import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { waitlistService } from '../services/waitlist.service.js';

export const joinWaitlistSchema = z.object({
  body: z.object({
    showId: z.string().min(1, 'Show ID is required'),
    requestedSeats: z.number().min(1).max(6).default(1),
  }),
});

export const waitlistController = {
  async joinWaitlist(req: Request, res: Response, next: NextFunction) {
    try {
      const { showId, requestedSeats } = req.body;
      const userId = req.user!.id;

      const entry = await waitlistService.joinWaitlist(userId, showId, requestedSeats);
      res.status(201).json({
        success: true,
        message: `Joined waitlist successfully at position #${entry.queuePosition}. We will notify you when seats open up.`,
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  },

  async getMyWaitlist(req: Request, res: Response, next: NextFunction) {
    try {
      const entries = await waitlistService.getUserWaitlist(req.user!.id);
      res.status(200).json({
        success: true,
        data: entries,
      });
    } catch (error) {
      next(error);
    }
  },

  async declineOffer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await waitlistService.declineOffer(req.params.id, req.user!.id);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },
};
