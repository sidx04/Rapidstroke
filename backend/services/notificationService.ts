import Notification from '../models/Notification.ts';
import User from '../models/User.ts';
import { Expo } from 'expo-server-sdk';
import type { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

// Create a new Expo SDK client
const expo = new Expo();

interface NotificationData {
    userId: string;
    alertId: string;
    type: 'alert_assigned' | 'alert_forwarded' | 'alert_returned' | 'alert_completed' | 'reminder';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    data: {
        alertId: string;
        patientName: string;
        severity: string;
        stage: string;
        actionRequired?: string;
    };
    scheduledFor?: Date;
}

export const sendNotification = async (notificationData: NotificationData) => {
    try {
        const user = await User.findById(notificationData.userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Create notification record
        const notification = new Notification({
            userId: notificationData.userId,
            alertId: notificationData.alertId,
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            priority: notificationData.priority,
            data: notificationData.data,
            scheduledFor: notificationData.scheduledFor || new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expire after 24 hours
            channels: {
                push: { sent: false, delivered: false, clicked: false },
                sms: { sent: false, delivered: false },
                email: { sent: false, delivered: false }
            }
        });

        await notification.save();

        // Send notifications based on user preferences
        const promises = [];

        // Push notification
        if (user.notificationPreferences.push &&
            (!user.notificationPreferences.urgentOnly || notification.priority === 'urgent')) {
            promises.push(sendPushNotification(user, notification));
        }

        // SMS notification
        if (user.notificationPreferences.sms && user.phone &&
            (!user.notificationPreferences.urgentOnly || notification.priority === 'urgent')) {
            promises.push(sendSMSNotification(user, notification));
        }

        // Email notification
        if (user.notificationPreferences.email && user.email &&
            (!user.notificationPreferences.urgentOnly || notification.priority === 'urgent')) {
            promises.push(sendEmailNotification(user, notification));
        }

        await Promise.allSettled(promises);

        console.log(`Notification sent to user ${user.name} for alert ${notificationData.alertId}`);
        return notification;

    } catch (error) {
        console.error('Send notification error:', error);
        throw error;
    }
};

const sendPushNotification = async (user: any, notification: any) => {
    try {
        // Check if user has a valid Expo push token
        if (!user.expoPushToken || !Expo.isExpoPushToken(user.expoPushToken)) {
            console.log(`User ${user.name} does not have a valid Expo push token`);
            return;
        }

        // Create the message
        const message: ExpoPushMessage = {
            to: user.expoPushToken,
            sound: 'default',
            title: notification.title,
            body: notification.message,
            data: {
                alertId: notification.data.alertId,
                type: notification.type,
                priority: notification.priority,
                patientName: notification.data.patientName,
                severity: notification.data.severity,
                stage: notification.data.stage
            },
            priority: notification.priority === 'urgent' ? 'high' : 'normal',
            channelId: notification.priority === 'urgent' ? 'urgent-alerts' : 'default'
        };

        // Send the push notification
        const tickets = await expo.sendPushNotificationsAsync([message]);

        // Update notification record
        notification.channels.push.sent = true;
        notification.channels.push.sentAt = new Date();

        // Check if the ticket indicates delivery
        if (tickets[0] && tickets[0].status === 'ok') {
            notification.channels.push.delivered = true;
            notification.channels.push.deliveredAt = new Date();
        }

        await notification.save();
        console.log(`Expo push notification sent successfully to ${user.name}`);

    } catch (error) {
        console.error('Expo push notification error:', error);
        notification.retryCount += 1;
        await notification.save();
    }
};

const sendSMSNotification = async (user: any, notification: any) => {
    try {
        // Placeholder for SMS service integration (Twilio, AWS SNS, etc.)
        // You'll need to implement actual SMS sending logic here

        console.log(`SMS would be sent to ${user.phone}: ${notification.title} - ${notification.message}`);

        notification.channels.sms.sent = true;
        notification.channels.sms.sentAt = new Date();
        notification.channels.sms.phoneNumber = user.phone;

        await notification.save();
    } catch (error) {
        console.error('SMS notification error:', error);
        notification.retryCount += 1;
        await notification.save();
    }
};

const sendEmailNotification = async (user: any, notification: any) => {
    try {
        // Placeholder for email service integration (SendGrid, AWS SES, etc.)
        // You'll need to implement actual email sending logic here

        console.log(`Email would be sent to ${user.email}: ${notification.title} - ${notification.message}`);

        notification.channels.email.sent = true;
        notification.channels.email.sentAt = new Date();
        notification.channels.email.emailAddress = user.email;

        await notification.save();
    } catch (error) {
        console.error('Email notification error:', error);
        notification.retryCount += 1;
        await notification.save();
    }
};

// Get user notifications
export const getUserNotifications = async (userId: string, limit: number = 50) => {
    try {
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit);

        return notifications;
    } catch (error) {
        console.error('Get user notifications error:', error);
        throw error;
    }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string, userId: string) => {
    try {
        const notification = await Notification.findOne({
            notificationId,
            userId
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();

        return notification;
    } catch (error) {
        console.error('Mark notification as read error:', error);
        throw error;
    }
};

// Retry failed notifications
export const retryFailedNotifications = async () => {
    try {
        const failedNotifications = await Notification.find({
            retryCount: { $lt: 3 },
            $or: [
                { 'channels.push.sent': false },
                { 'channels.sms.sent': false },
                { 'channels.email.sent': false }
            ],
            scheduledFor: { $lte: new Date() },
            expiresAt: { $gt: new Date() }
        });

        for (const notification of failedNotifications) {
            const user = await User.findById(notification.userId);
            if (user) {
                // Retry sending notification
                await sendNotification({
                    userId: notification.userId,
                    alertId: notification.alertId,
                    type: notification.type,
                    title: notification.title,
                    message: notification.message,
                    priority: notification.priority,
                    data: notification.data
                });
            }
        }

        console.log(`Retried ${failedNotifications.length} failed notifications`);
    } catch (error) {
        console.error('Retry failed notifications error:', error);
    }
};

// Handle Expo push notification receipts
export const handlePushNotificationReceipts = async () => {
    try {
        // Get all tickets that need receipt checking
        const notifications = await Notification.find({
            'channels.push.sent': true,
            'channels.push.delivered': false,
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        });

        if (notifications.length === 0) return;

        // Group notifications by their push tickets (you'd need to store ticket IDs)
        // For now, we'll simulate receipt checking
        for (const notification of notifications) {
            // In a real implementation, you'd use the stored ticket ID
            // const receiptIds = [storedTicketId];
            // const receipts = await expo.getPushNotificationReceiptsAsync(receiptIds);

            // For simulation, assume delivery after 5 minutes
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
            if (notification.channels.push.sentAt && notification.channels.push.sentAt < fiveMinutesAgo) {
                notification.channels.push.delivered = true;
                notification.channels.push.deliveredAt = new Date();
                await notification.save();
            }
        }

        console.log(`Processed receipts for ${notifications.length} notifications`);
    } catch (error) {
        console.error('Handle push notification receipts error:', error);
    }
};