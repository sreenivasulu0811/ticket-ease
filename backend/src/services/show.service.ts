import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export interface CreateShowInput {
  eventId: string;
  screenId: string;
  startTime: string | Date;
  endTime: string | Date;
  basePrice: number;
}

export const showService = {
  async getAllShows(query: { eventId?: string; screenId?: string; venueId?: string; date?: string }) {
    const where: any = {};

    if (query.eventId) where.eventId = query.eventId;
    if (query.screenId) where.screenId = query.screenId;
    if (query.venueId) {
      where.screen = { venueId: query.venueId };
    }

    if (query.date) {
      const startOfDay = new Date(query.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(query.date);
      endOfDay.setHours(23, 59, 59, 999);

      where.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    return prisma.show.findMany({
      where,
      include: {
        event: true,
        screen: {
          include: {
            venue: true,
          },
        },
        _count: {
          select: {
            showSeats: true,
            bookings: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  },

  async getShowById(id: string) {
    const show = await prisma.show.findUnique({
      where: { id },
      include: {
        event: true,
        screen: {
          include: {
            venue: true,
          },
        },
      },
    });

    if (!show) {
      throw new AppError('Show not found.', 404, 'SHOW_NOT_FOUND');
    }

    return show;
  },

  async createShow(data: CreateShowInput) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError('Invalid start or end time format.', 400, 'INVALID_DATE');
    }

    if (start >= end) {
      throw new AppError('Show start time must be before end time.', 400, 'INVALID_TIME_RANGE');
    }

    // Verify event and screen exist
    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) throw new AppError('Event not found.', 404, 'EVENT_NOT_FOUND');

    const screen = await prisma.screen.findUnique({
      where: { id: data.screenId },
      include: { seats: true },
    });
    if (!screen) throw new AppError('Screen not found.', 404, 'SCREEN_NOT_FOUND');

    // Rule 11: Check for overlapping shows on the same screen
    const overlappingShow = await prisma.show.findFirst({
      where: {
        screenId: data.screenId,
        status: 'SCHEDULED',
        OR: [
          {
            startTime: { lte: start },
            endTime: { gt: start },
          },
          {
            startTime: { lt: end },
            endTime: { gte: end },
          },
          {
            startTime: { gte: start },
            endTime: { lte: end },
          },
        ],
      },
    });

    if (overlappingShow) {
      throw new AppError(
        'Schedule conflict: Another show is already scheduled in this screen during the requested time window.',
        409,
        'SCHEDULE_CONFLICT'
      );
    }

    return prisma.$transaction(async (tx) => {
      const show = await tx.show.create({
        data: {
          eventId: data.eventId,
          screenId: data.screenId,
          startTime: start,
          endTime: end,
          basePrice: parseFloat(String(data.basePrice)),
          status: 'SCHEDULED',
        },
      });

      // Create ShowSeat inventory for every seat in the screen
      if (screen.seats.length > 0) {
        await tx.showSeat.createMany({
          data: screen.seats.map((seat) => ({
            showId: show.id,
            seatId: seat.id,
            status: 'AVAILABLE',
          })),
        });
      }

      return tx.show.findUnique({
        where: { id: show.id },
        include: {
          event: true,
          screen: {
            include: { venue: true },
          },
        },
      });
    });
  },

  async updateShow(id: string, data: any) {
    const existing = await prisma.show.findUnique({ where: { id } });
    if (!existing) throw new AppError('Show not found.', 404, 'SHOW_NOT_FOUND');

    return prisma.show.update({
      where: { id },
      data: {
        basePrice: data.basePrice !== undefined ? parseFloat(String(data.basePrice)) : undefined,
        status: data.status !== undefined ? data.status : undefined,
      },
    });
  },

  async deleteShow(id: string) {
    const existing = await prisma.show.findUnique({ where: { id } });
    if (!existing) throw new AppError('Show not found.', 404, 'SHOW_NOT_FOUND');

    return prisma.show.delete({ where: { id } });
  },
};
