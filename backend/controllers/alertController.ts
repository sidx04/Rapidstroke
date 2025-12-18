import * as express from 'express';
import Alert from '../models/Alert.ts';
import Notification from '../models/Notification.ts';
import User from '../models/User.ts';
import { sendNotification } from '../services/notificationService.ts';
import { findUserByRoleId, getRoleSpecificId, getUsersWithRoleIds } from '../utils/userHelpers.ts';
import * as types from '../types.ts';

type Response = express.Response;
type AuthenticatedRequest = types.AuthenticatedRequest;

// Create new alert by EMO
export const createAlert = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {
            patientName,
            patientAge,
            symptoms,
            severity,
            emoNotes,
            location,
            vitals
        } = req.body;

        // Validate required fields
        if (!patientName || !patientAge || !symptoms || !emoNotes || !location) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: patientName, patientAge, symptoms, emoNotes, location'
            });
        }

        const emoId = req.user?.id; // From auth middleware
        if (!emoId) {
            return res.status(401).json({
                success: false,
                message: 'EMO ID not found'
            });
        }

        // Create new alert
        const alert = new Alert({
            patientName,
            patientAge,
            patientId: `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            symptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
            severity: severity || 'medium',
            emoId,
            emoNotes,
            location,
            vitals,
            stage: 'emo_created',
            timestamps: {
                emoCreated: new Date()
            }
        });

        await alert.save();

        res.status(201).json({
            success: true,
            message: 'Alert created successfully',
            data: {
                alert: {
                    alertId: alert.alertId,
                    patientName: alert.patientName,
                    severity: alert.severity,
                    stage: alert.stage,
                    createdAt: alert.createdAt
                }
            }
        });

    } catch (error) {
        console.error('Create alert error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while creating alert'
        });
    }
};

// Send alert to clinician
export const sendToClinician = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { alertId, clinicianId } = req.body;

        if (!alertId || !clinicianId) {
            return res.status(400).json({
                success: false,
                message: 'Alert ID and Clinician ID are required'
            });
        }

        const alert = await Alert.findOne({ alertId: alertId as string, isActive: true });
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        // Verify clinician exists by role-specific ID
        const clinician = await findUserByRoleId(clinicianId);
        if (!clinician || clinician.role !== 'clinician') {
            return res.status(404).json({
                success: false,
                message: 'Clinician not found'
            });
        }

        // Update alert
        alert.clinicianId = clinicianId;
        alert.stage = 'sent_to_clinician';
        alert.timestamps.sentToClinician = new Date();
        await alert.save();

        // Send notification to clinician
        await sendNotification({
            userId: clinician._id.toString(),
            alertId: alert.alertId,
            type: 'alert_assigned',
            title: 'New Emergency Alert',
            message: `Emergency alert for ${alert.patientName} (${alert.severity} severity)`,
            priority: alert.severity === 'critical' ? 'urgent' : 'high',
            data: {
                alertId: alert.alertId,
                patientName: alert.patientName,
                severity: alert.severity,
                stage: alert.stage,
                actionRequired: 'Review patient and provide initial assessment'
            }
        });

        res.status(200).json({
            success: true,
            message: 'Alert sent to clinician successfully',
            data: {
                alertId: alert.alertId,
                clinicianId,
                stage: alert.stage
            }
        });

    } catch (error) {
        console.error('Send to clinician error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while sending alert to clinician'
        });
    }
};

// Clinician forwards to radiologist
export const sendToRadiologist = async (req: AuthenticatedRequest, res: Response) => {
    try {
        console.log('sendToRadiologist endpoint called:', req.body);
        const { alertId, radiologistId, clinicianInitialNotes } = req.body;

        if (!alertId || !radiologistId) {
            console.log('Missing required fields:', { alertId, radiologistId });
            return res.status(400).json({
                success: false,
                message: 'Alert ID and Radiologist ID are required'
            });
        }

        const alert = await Alert.findOne({ alertId: alertId as string, isActive: true });
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        // Get current user's role-specific ID to verify they're the assigned clinician
        const currentUserDoc = await User.findById(req.user?.id);
        if (!currentUserDoc) {
            return res.status(404).json({
                success: false,
                message: 'Current user not found'
            });
        }

        const currentUser = {
            id: currentUserDoc._id.toString(),
            email: currentUserDoc.email,
            role: currentUserDoc.role,
            ...(currentUserDoc.emoId && { emoId: currentUserDoc.emoId }),
            ...(currentUserDoc.clinicianId && { clinicianId: currentUserDoc.clinicianId }),
            ...(currentUserDoc.radiologistId && { radiologistId: currentUserDoc.radiologistId })
        };

        const currentUserRoleId = getRoleSpecificId(currentUser);
        console.log('Authorization check:', {
            alertClinicianId: alert.clinicianId,
            currentUserRoleId,
            match: alert.clinicianId === currentUserRoleId
        });

        // Verify user is the assigned clinician
        if (alert.clinicianId !== currentUserRoleId) {
            console.log('Authorization failed - not assigned clinician');
            return res.status(403).json({
                success: false,
                message: 'Not authorized to forward this alert'
            });
        }

        console.log('Looking for radiologist with ID:', radiologistId);
        // Verify radiologist exists by role-specific ID
        const radiologist = await findUserByRoleId(radiologistId);
        console.log('Found radiologist:', radiologist ? { id: radiologist._id, name: radiologist.name, role: radiologist.role } : 'null');

        if (!radiologist || radiologist.role !== 'radiologist') {
            console.log('Radiologist validation failed');
            return res.status(404).json({
                success: false,
                message: 'Radiologist not found'
            });
        }

        console.log('Updating alert and sending to radiologist...');
        // Update alert
        alert.radiologistId = radiologistId;
        alert.stage = 'sent_to_radiologist';
        alert.clinicianInitialNotes = clinicianInitialNotes;
        alert.timestamps.sentToRadiologist = new Date();
        await alert.save();
        console.log('Alert updated successfully');

        console.log('Sending notification to radiologist:', radiologist._id.toString());
        // Send notification to radiologist (use MongoDB ObjectId for notification)
        await sendNotification({
            userId: radiologist._id.toString(),
            alertId: alert.alertId,
            type: 'alert_forwarded',
            title: 'Alert Forwarded for Radiology Review',
            message: `Please review imaging for ${alert.patientName} (${alert.severity} severity)`,
            priority: alert.severity === 'critical' ? 'urgent' : 'high',
            data: {
                alertId: alert.alertId,
                patientName: alert.patientName,
                severity: alert.severity,
                stage: alert.stage,
                actionRequired: 'Review imaging and provide radiological assessment'
            }
        });
        console.log('Notification sent successfully');

        console.log('Sending success response');
        res.status(200).json({
            success: true,
            message: 'Alert sent to radiologist successfully',
            data: {
                alertId: alert.alertId,
                radiologistId,
                stage: alert.stage
            }
        });
        console.log('Response sent successfully');

    } catch (error) {
        console.error('Send to radiologist error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while sending alert to radiologist'
        });
    }
};

// Radiologist sends back to clinician
export const sendBackToClinician = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { alertId, radiologistNotes } = req.body;

        if (!alertId || !radiologistNotes) {
            return res.status(400).json({
                success: false,
                message: 'Alert ID and radiologist notes are required'
            });
        }

        const alert = await Alert.findOne({ alertId: alertId as string, isActive: true });
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        // Get current user's role-specific ID to verify they're the assigned radiologist
        const currentUserDoc = await User.findById(req.user?.id);
        if (!currentUserDoc) {
            return res.status(404).json({
                success: false,
                message: 'Current user not found'
            });
        }

        const currentUser = {
            id: currentUserDoc._id.toString(),
            email: currentUserDoc.email,
            role: currentUserDoc.role,
            ...(currentUserDoc.emoId && { emoId: currentUserDoc.emoId }),
            ...(currentUserDoc.clinicianId && { clinicianId: currentUserDoc.clinicianId }),
            ...(currentUserDoc.radiologistId && { radiologistId: currentUserDoc.radiologistId })
        };

        const currentUserRoleId = getRoleSpecificId(currentUser);

        // Verify user is the assigned radiologist
        if (alert.radiologistId !== currentUserRoleId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to complete this radiology review'
            });
        }

        // Update alert
        alert.stage = 'sent_back_to_clinician';
        alert.radiologistNotes = radiologistNotes;
        alert.timestamps.sentBackToClinician = new Date();
        await alert.save();

        // Find the clinician user document to get MongoDB ObjectId for notification
        const clinician = await findUserByRoleId(alert.clinicianId!);
        if (!clinician) {
            console.error('Clinician not found for notification:', alert.clinicianId);
            // Continue without sending notification rather than failing the whole operation
        }

        // Send notification back to clinician (use MongoDB ObjectId for notification)
        if (clinician) {
            await sendNotification({
                userId: clinician._id.toString(),
                alertId: alert.alertId,
                type: 'alert_returned',
                title: 'Radiology Review Completed',
                message: `Radiology review completed for ${alert.patientName}`,
                priority: alert.severity === 'critical' ? 'urgent' : 'high',
                data: {
                    alertId: alert.alertId,
                    patientName: alert.patientName,
                    severity: alert.severity,
                    stage: alert.stage,
                    actionRequired: 'Review radiology findings and enter final record'
                }
            });
        }

        res.status(200).json({
            success: true,
            message: 'Alert returned to clinician with radiology notes',
            data: {
                alertId: alert.alertId,
                stage: alert.stage
            }
        });

    } catch (error) {
        console.error('Send back to clinician error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while sending alert back to clinician'
        });
    }
};

// Clinician enters final record
export const enterFinalRecord = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { alertId, clinicianFinalNotes, finalRecord } = req.body;

        if (!alertId || !finalRecord) {
            return res.status(400).json({
                success: false,
                message: 'Alert ID and final record are required'
            });
        }

        const alert = await Alert.findOne({ alertId: alertId as string, isActive: true });
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        // Get current user's role-specific ID to verify they're the assigned clinician
        const currentUserDoc = await User.findById(req.user?.id);
        if (!currentUserDoc) {
            return res.status(404).json({
                success: false,
                message: 'Current user not found'
            });
        }

        const currentUser = {
            id: currentUserDoc._id.toString(),
            email: currentUserDoc.email,
            role: currentUserDoc.role,
            ...(currentUserDoc.emoId && { emoId: currentUserDoc.emoId }),
            ...(currentUserDoc.clinicianId && { clinicianId: currentUserDoc.clinicianId }),
            ...(currentUserDoc.radiologistId && { radiologistId: currentUserDoc.radiologistId })
        };

        const currentUserRoleId = getRoleSpecificId(currentUser);

        // Verify user is the assigned clinician
        if (alert.clinicianId !== currentUserRoleId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to complete this alert'
            });
        }

        // Update alert
        alert.stage = 'completed';
        alert.clinicianFinalNotes = clinicianFinalNotes;
        alert.finalRecord = finalRecord;
        alert.timestamps.finalRecordEntered = new Date();
        alert.timestamps.completed = new Date();
        alert.isActive = false; // Mark as completed
        await alert.save();

        // Send completion notification to EMO
        await sendNotification({
            userId: alert.emoId,
            alertId: alert.alertId,
            type: 'alert_completed',
            title: 'Alert Completed',
            message: `Alert for ${alert.patientName} has been completed`,
            priority: 'medium',
            data: {
                alertId: alert.alertId,
                patientName: alert.patientName,
                severity: alert.severity,
                stage: alert.stage,
                actionRequired: 'Review completed case'
            }
        });

        res.status(200).json({
            success: true,
            message: 'Final record entered successfully. Alert completed.',
            data: {
                alertId: alert.alertId,
                stage: alert.stage,
                completedAt: alert.timestamps.completed
            }
        });

    } catch (error) {
        console.error('Enter final record error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while entering final record'
        });
    }
};

// Get alerts for current user
export const getMyAlerts = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;

        if (!userId || !userRole) {
            return res.status(401).json({
                success: false,
                message: 'User information not found'
            });
        }

        // Get the user to access their role-specific ID
        const userDoc = await User.findById(userId);
        if (!userDoc) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user: any = {
            id: userDoc._id.toString(),
            email: userDoc.email,
            role: userDoc.role
        };

        // Only add role-specific IDs if they exist (to satisfy exactOptionalPropertyTypes)
        if (userDoc.emoId) user.emoId = userDoc.emoId;
        if (userDoc.clinicianId) user.clinicianId = userDoc.clinicianId;
        if (userDoc.radiologistId) user.radiologistId = userDoc.radiologistId;

        let query: any = {};

        // Build query based on user role using role-specific IDs
        switch (userRole) {
            case 'emo':
                // EMO alerts use MongoDB ObjectId
                query.emoId = userId;
                break;
            case 'clinician':
                // Clinician alerts use role-specific ID (CLIN-xxx)
                const clinicianRoleId = getRoleSpecificId(user);
                if (!clinicianRoleId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Clinician role ID not found'
                    });
                }
                query.clinicianId = clinicianRoleId;
                break;
            case 'radiologist':
                // Radiologist alerts use role-specific ID (RAD-xxx)
                const radiologistRoleId = getRoleSpecificId(user);
                if (!radiologistRoleId) {
                    return res.status(400).json({
                        success: false,
                        message: 'Radiologist role ID not found'
                    });
                }
                query.radiologistId = radiologistRoleId;
                break;
            default:
                return res.status(403).json({
                    success: false,
                    message: 'Invalid user role'
                });
        }

        const alerts = await Alert.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            message: 'Alerts retrieved successfully',
            data: {
                alerts,
                count: alerts.length
            }
        });

    } catch (error) {
        console.error('Get alerts error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving alerts'
        });
    }
};

// Get alert details
export const getAlertDetails = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { alertId } = req.params;

        if (!alertId) {
            return res.status(400).json({
                success: false,
                message: 'Alert ID is required'
            });
        }

        const alert = await Alert.findOne({ alertId: alertId as string });
        if (!alert) {
            return res.status(404).json({
                success: false,
                message: 'Alert not found'
            });
        }

        // Check if user has access to this alert
        const userId = req.user?.id;
        if (alert.emoId !== userId &&
            alert.clinicianId !== userId &&
            alert.radiologistId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this alert'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Alert details retrieved successfully',
            data: {
                alert
            }
        });

    } catch (error) {
        console.error('Get alert details error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving alert details'
        });
    }
};

// Get user notifications for verification
export const getMyNotifications = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID not found'
            });
        }

        const { limit = '20' } = req.query;
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit as string));

        res.status(200).json({
            success: true,
            message: 'Notifications retrieved successfully',
            data: {
                notifications,
                count: notifications.length
            }
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving notifications'
        });
    }
};

// Get all notifications (admin/debug endpoint)
export const getAllNotifications = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { limit = '50', alertId } = req.query;

        let query = {};
        if (alertId) {
            query = { alertId };
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit as string));

        const notificationStats = await Notification.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    sent: { $sum: { $cond: ['$channels.push.sent', 1, 0] } },
                    delivered: { $sum: { $cond: ['$channels.push.delivered', 1, 0] } }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            message: 'All notifications retrieved successfully',
            data: {
                notifications,
                count: notifications.length,
                stats: notificationStats
            }
        });

    } catch (error) {
        console.error('Get all notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving all notifications'
        });
    }
};

// Get all users with role IDs for assignment
export const getUsersForAssignment = async (req: AuthenticatedRequest, res: Response) => {
    try {
        console.log('getUsersForAssignment called by user:', req.user?.id, 'role:', req.user?.role);
        const users = await getUsersWithRoleIds();
        console.log('Total users found:', users.length);
        console.log('Users with roles:', users.map(u => ({ name: u.name, role: u.role, roleId: u.roleId })));

        // Group users by role for easier frontend consumption
        const groupedUsers = {
            emos: users.filter(user => user.role === 'emo'),
            clinicians: users.filter(user => user.role === 'clinician'),
            radiologists: users.filter(user => user.role === 'radiologist')
        };

        console.log('Grouped users:', {
            emos: groupedUsers.emos.length,
            clinicians: groupedUsers.clinicians.length,
            radiologists: groupedUsers.radiologists.length
        });

        res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            data: groupedUsers
        });

    } catch (error) {
        console.error('Get users for assignment error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while retrieving users'
        });
    }
};