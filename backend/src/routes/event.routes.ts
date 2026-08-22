import { Router } from 'express';
import { eventController, createEventSchema } from '../controllers/event.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', eventController.getAllEvents);
router.get('/featured', eventController.getFeaturedEvents);
router.get('/:id', eventController.getEventById);

// Admin-only management
router.post('/', authenticate, requireRole('ADMIN'), validate(createEventSchema), eventController.createEvent);
router.put('/:id', authenticate, requireRole('ADMIN'), eventController.updateEvent);
router.delete('/:id', authenticate, requireRole('ADMIN'), eventController.deleteEvent);

export default router;
