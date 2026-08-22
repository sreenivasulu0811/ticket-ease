import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

router.get('/stats', adminController.getDashboardStats);
router.get('/reports', adminController.getReports);
router.get('/bookings', adminController.getAllBookings);
router.get('/users', adminController.getAllUsers);
router.get('/waitlist', adminController.getAllWaitlist);

export default router;
