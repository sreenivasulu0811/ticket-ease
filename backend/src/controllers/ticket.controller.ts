import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { qrService } from '../services/qr.service.js';

export const validateTicketSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'QR code or booking reference is required'),
  }),
});

export const ticketController = {
  async validateTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;
      const operatorName = req.user?.name || 'Staff Member';

      const result = await qrService.validateTicket(code, operatorName);

      if (!result.valid) {
        return res.status(200).json({
          success: false,
          status: result.status,
          message: result.message,
          data: result.booking || null,
        });
      }

      res.status(200).json({
        success: true,
        status: result.status,
        message: result.message,
        data: result.booking,
      });
    } catch (error) {
      next(error);
    }
  },
};
