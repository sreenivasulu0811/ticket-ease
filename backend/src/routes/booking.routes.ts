import { Router } from 'express';
import { bookingController, createBookingSchema } from '../controllers/booking.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createBookingSchema), bookingController.createBooking);
router.get('/my', bookingController.getMyBookings);
router.get('/:id', bookingController.getBookingById);
router.post('/:id/cancel', bookingController.cancelBooking);

export default router;
