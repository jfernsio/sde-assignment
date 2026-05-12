import express from 'express';
import authRoutes from './authRoutes.js';
import maintenanceRoutes from './maintenanceRoutes.js';
import drillRoutes from './drillRoutes.js';
import complianceRoutes from './complianceRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/drills', drillRoutes);
router.use('/compliance', complianceRoutes);

export default router;
