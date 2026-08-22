import { Router } from 'express';
import { venueController, createVenueSchema, createScreenSchema } from '../controllers/venue.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', venueController.getAllVenues);
router.get('/:id', venueController.getVenueById);

// Admin-only
router.post('/', authenticate, requireRole('ADMIN'), validate(createVenueSchema), venueController.createVenue);
router.put('/:id', authenticate, requireRole('ADMIN'), venueController.updateVenue);
router.delete('/:id', authenticate, requireRole('ADMIN'), venueController.deleteVenue);
router.post('/:id/screens', authenticate, requireRole('ADMIN'), validate(createScreenSchema), venueController.createScreen);

export default router;
