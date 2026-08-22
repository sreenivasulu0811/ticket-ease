import { Router } from 'express';
import { ticketController, validateTicketSchema } from '../controllers/ticket.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.post(
  '/validate',
  authenticate,
  requireRole('ADMIN', 'OPERATOR'),
  validate(validateTicketSchema),
  ticketController.validateTicket
);

export default router;
