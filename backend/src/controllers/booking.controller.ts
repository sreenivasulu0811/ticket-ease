import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { bookingService } from '../services/booking.service.js';

export const createBookingSchema = z.object({
  body: z.object({
    showId: z.string().min(1, 'Show ID is required'),
    holdToken: z.string().optional(),
    waitlistEntryId: z.string().optional(),
    paymentMethod: z.enum(['UPI', 'CARD', 'NET_BANKING']).default('UPI'),
    simulateStatus: z.enum(['SUCCESS', 'FAILED']).default('SUCCESS'),
  }),
});

export const bookingController = {
  async createBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const { showId, holdToken, waitlistEntryId, paymentMethod, simulateStatus } = req.body;
      const userId = req.user!.id;

      const booking = await bookingService.createBooking({
        showId,
        holdToken,
        waitlistEntryId,
        userId,
        paymentMethod,
        simulateStatus,
      });

      res.status(201).json({
        success: true,
        message: 'Booking confirmed successfully!',
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  },

  async getMyBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const bookings = await bookingService.getUserBookings(req.user!.id);
      res.status(200).json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      next(error);
    }
  },

  async getBookingById(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await bookingService.getBookingById(
        req.params.id,
        req.user!.id,
        req.user!.role
      );
      res.status(200).json({
        success: true,
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  },

  async cancelBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await bookingService.cancelBooking(
        req.params.id,
        req.user!.id,
        req.user!.role
      );
      res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
