import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getShipCompliance,
  getComplianceDashboard
} from '../controllers/complianceController.js';

const router = express.Router();

// All compliance routes require authentication
router.use(authenticate);

router.get('/ships/:shipId', getShipCompliance);
router.get('/dashboard', getComplianceDashboard);

export default router;
