import { Router } from 'express';
import { showController, createShowSchema } from '../controllers/show.controller.js';
import { seatController, holdSeatsSchema, releaseSeatsSchema } from '../controllers/seat.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Shows endpoints
router.get('/', showController.getAllShows);
router.get('/:id', showController.getShowById);
router.post('/', authenticate, requireRole('ADMIN'), validate(createShowSchema), showController.createShow);
router.put('/:id', authenticate, requireRole('ADMIN'), showController.updateShow);
router.delete('/:id', authenticate, requireRole('ADMIN'), showController.deleteShow);

// Seat inventory & Hold endpoints
router.get('/:showId/seats', optionalAuthenticate, seatController.getShowSeats);
router.post('/:showId/hold', optionalAuthenticate, validate(holdSeatsSchema), seatController.holdSeats);
router.post('/:showId/release', optionalAuthenticate, validate(releaseSeatsSchema), seatController.releaseHold);

export default router;
