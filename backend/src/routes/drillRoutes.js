import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  createDrill,
  getDrills,
  getDrill,
  recordAttendance,
  getAttendance,
  deleteDrill
} from '../controllers/drillController.js';

const router = express.Router();

// All drill routes require authentication
router.use(authenticate);

router.post('/', createDrill);
router.get('/', getDrills);
router.get('/:id', getDrill);
router.post('/:drillId/attendance', recordAttendance);
router.get('/:drillId/attendance', getAttendance);
router.delete('/:id', deleteDrill);

export default router;
