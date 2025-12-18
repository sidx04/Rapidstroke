import express from 'express';
import * as alertController from '../controllers/alertController.ts';
import { authMiddleware, authorize } from '../middleware/auth.ts';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// EMO routes
router.post('/create',
    authorize('emo'),
    alertController.createAlert
);

router.post('/send-to-clinician',
    authorize('emo'),
    alertController.sendToClinician
);

// Clinician routes
router.post('/send-to-radiologist',
    authorize('clinician'),
    alertController.sendToRadiologist
);

router.post('/final-record',
    authorize('clinician'),
    alertController.enterFinalRecord
);

// Radiologist routes
router.post('/send-back-to-clinician',
    authorize('radiologist'),
    alertController.sendBackToClinician
);

// Common routes (all roles) - specific routes must come before parameterized routes
router.get('/my-alerts',
    authorize('emo', 'clinician', 'radiologist'),
    alertController.getMyAlerts
);

// Notification verification routes
router.get('/notifications/my-notifications',
    authorize('emo', 'clinician', 'radiologist'),
    alertController.getMyNotifications
);

router.get('/notifications/all',
    authorize('emo', 'clinician', 'radiologist'), // In production, restrict to admin only
    alertController.getAllNotifications
);

// Get users for assignment
router.get('/users-for-assignment',
    authorize('emo', 'clinician', 'radiologist'),
    alertController.getUsersForAssignment
);

// This must come last because it uses a parameter
router.get('/:alertId',
    authorize('emo', 'clinician', 'radiologist'),
    alertController.getAlertDetails
);

export default router;