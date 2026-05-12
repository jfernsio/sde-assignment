import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createMaintenanceTask,
  getMaintenanceTasks,
  getMaintenanceTask,
  updateMaintenanceTask,
  deleteMaintenanceTask
} from '../controllers/maintenanceController.js';

const router = express.Router();

// All maintenance routes require authentication
router.use(authenticate);

router.post('/', createMaintenanceTask);
router.get('/', getMaintenanceTasks);
router.get('/:id', getMaintenanceTask);
router.put('/:id', updateMaintenanceTask);
router.delete('/:id', deleteMaintenanceTask);

export default router;
