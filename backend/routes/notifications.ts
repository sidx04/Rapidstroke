import * as express from 'express';
import {
    sendNotification,
    getUserNotifications,
    markNotificationAsRead,
    getPushNotificationStats,
    checkPushNotificationReceipts
} from '../services/notificationService.ts';
import { authMiddleware } from '../middleware/auth.ts';
import * as types from '../types.ts';

type Response = express.Response;
type AuthenticatedRequest = types.AuthenticatedRequest;

const router = express.Router();

/**
 * GET /api/notifications
 * Get all notifications for the authenticated user
 */
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const limit = parseInt(req.query.limit as string) || 50;
        const notifications = await getUserNotifications(userId as string, limit);

        res.status(200).json({
            success: true,
            data: {
                notifications,
                count: notifications.length
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching notifications'
        });
    }
});

/**
 * POST /api/notifications/:notificationId/read
 * Mark a notification as read
 */
router.post('/:notificationId/read', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const { notificationId } = req.params;
        const notification = await markNotificationAsRead(notificationId as string, userId as string);

        res.status(200).json({
            success: true,
            data: { notification }
        });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while marking notification as read'
        });
    }
});

/**
 * GET /api/notifications/stats
 * Get notification statistics for the authenticated user
 */
router.get('/stats', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const stats = await getPushNotificationStats(userId as string);

        res.status(200).json({
            success: true,
            data: { stats }
        });
    } catch (error) {
        console.error('Get notification stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while fetching notification stats'
        });
    }
});

/**
 * POST /api/notifications/check-receipts
 * Manually trigger receipt checking (admin endpoint)
 */
router.post('/check-receipts', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
        // In production, you'd want to verify admin role here
        await checkPushNotificationReceipts();

        res.status(200).json({
            success: true,
            message: 'Push notification receipts checked successfully'
        });
    } catch (error) {
        console.error('Check receipts error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while checking receipts'
        });
    }
});

export default router;
