import {
    checkPushNotificationReceipts,
    retryFailedNotifications,
    cleanupExpiredNotifications
} from './notificationService.ts';

/**
 * Start all background tasks for notification management
 * Call this once from your main application startup
 */
export const startBackgroundTasks = () => {
    console.log('Starting background notification tasks...');

    // Check push receipts every 15 minutes (Expo recommends this interval)
    setInterval(() => {
        checkPushNotificationReceipts().catch(err => {
            console.error('Error in receipt checking task:', err);
        });
    }, 15 * 60 * 1000); // 15 minutes

    // Retry failed notifications every 5 minutes
    setInterval(() => {
        retryFailedNotifications().catch(err => {
            console.error('Error in retry task:', err);
        });
    }, 5 * 60 * 1000); // 5 minutes

    // Clean up expired notifications every hour
    setInterval(() => {
        cleanupExpiredNotifications().catch(err => {
            console.error('Error in cleanup task:', err);
        });
    }, 60 * 60 * 1000); // 1 hour

    // Initial runs
    checkPushNotificationReceipts().catch(err => {
        console.error('Initial receipt check error:', err);
    });

    retryFailedNotifications().catch(err => {
        console.error('Initial retry error:', err);
    });

    console.log('Background notification tasks started');
};

/**
 * Stop all background tasks (for graceful shutdown)
 */
export const stopBackgroundTasks = () => {
    // In a real implementation, you would clear intervals
    // For now, this is a placeholder
    console.log('Background tasks stopped');
};
