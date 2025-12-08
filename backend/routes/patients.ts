import express from 'express';
import {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  getPatientsByUser
} from '../controllers/patientController.ts';
import { authMiddleware, authorize } from '../middleware/auth.ts';

const router = express.Router();

// All patient routes require authentication
router.use(authMiddleware);

// Routes accessible by all authenticated users
router.post('/', createPatient);
router.get('/my-patients', getPatientsByUser);
router.get('/:id', getPatientById);

// Routes for clinicians and radiologists only
router.get('/', authorize('clinician', 'radiologist'), getAllPatients);
router.put('/:id', authorize('clinician', 'radiologist'), updatePatient);
router.delete('/:id', authorize('clinician', 'radiologist'), deletePatient);

export default router;