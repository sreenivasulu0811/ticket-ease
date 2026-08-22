import { Router } from 'express';
import { waitlistController, joinWaitlistSchema } from '../controllers/waitlist.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(joinWaitlistSchema), waitlistController.joinWaitlist);
router.get('/my', waitlistController.getMyWaitlist);
router.post('/:id/decline', waitlistController.declineOffer);

export default router;
