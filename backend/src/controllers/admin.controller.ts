import { Request, Response, NextFunction } from 'express';
import { reportService } from '../services/report.service.js';
import { prisma } from '../utils/prisma.js';

export const adminController = {
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await reportService.getDashboardStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },

  async getReports(req: Request, res: Response, next: NextFunction) {
    try {
      const analytics = await reportService.getAnalyticsData();
      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, status, paymentStatus } = req.query;
      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (paymentStatus) {
        where.paymentStatus = paymentStatus;
      }

      if (search) {
        const term = String(search).trim();
        where.OR = [
          { bookingReference: { contains: term, mode: 'insensitive' } },
          { user: { name: { contains: term, mode: 'insensitive' } } },
          { user: { email: { contains: term, mode: 'insensitive' } } },
          { show: { event: { title: { contains: term, mode: 'insensitive' } } } },
        ];
      }

      const bookings = await prisma.booking.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          show: {
            include: {
              event: true,
              screen: { include: { venue: true } },
            },
          },
          bookingSeats: {
            include: {
              showSeat: { include: { seat: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              bookings: true,
              waitlistEntries: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllWaitlist(req: Request, res: Response, next: NextFunction) {
    try {
      const waitlist = await prisma.waitlistEntry.findMany({
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          show: {
            include: {
              event: true,
              screen: { include: { venue: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: waitlist,
      });
    } catch (error) {
      next(error);
    }
  },
};
