import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { seatService } from '../services/seat.service.js';

export const holdSeatsSchema = z.object({
  params: z.object({
    showId: z.string(),
  }),
  body: z.object({
    seatIds: z.array(z.string()).min(1, 'Please select at least one seat'),
  }),
});

export const releaseSeatsSchema = z.object({
  params: z.object({
    showId: z.string(),
  }),
  body: z.object({
    holdToken: z.string().min(1, 'Hold token is required'),
  }),
});

export const seatController = {
  async getShowSeats(req: Request, res: Response, next: NextFunction) {
    try {
      const { showId } = req.params;
      const currentUserId = req.user?.id;
      const holdToken = req.query.holdToken as string | undefined;

      const result = await seatService.getShowSeats(showId, currentUserId, holdToken);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async holdSeats(req: Request, res: Response, next: NextFunction) {
    try {
      const { showId } = req.params;
      const { seatIds } = req.body;
      const userId = req.user?.id;

      const result = await seatService.holdSeats({
        showId,
        seatIds,
        userId,
      });

      res.status(200).json({
        success: true,
        message: 'Seats held successfully for 5 minutes.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async releaseHold(req: Request, res: Response, next: NextFunction) {
    try {
      const { showId } = req.params;
      const { holdToken } = req.body;
      const userId = req.user?.id;

      const result = await seatService.releaseHold(showId, holdToken, userId);
      res.status(200).json({
        success: true,
        message: 'Seats released successfully.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
