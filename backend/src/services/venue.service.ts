import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export const venueService = {
  async getAllVenues() {
    return prisma.venue.findMany({
      include: {
        screens: {
          include: {
            _count: {
              select: { seats: true, shows: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  },

  async getVenueById(id: string) {
    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        screens: {
          include: {
            seats: {
              orderBy: [{ rowLabel: 'asc' }, { seatNumber: 'asc' }],
            },
          },
        },
      },
    });

    if (!venue) {
      throw new AppError('Venue not found.', 404, 'VENUE_NOT_FOUND');
    }

    return venue;
  },

  async createVenue(data: any) {
    return prisma.venue.create({
      data: {
        name: data.name.trim(),
        location: data.location.trim(),
        address: data.address.trim(),
        city: data.city.trim(),
        capacity: parseInt(data.capacity, 10) || 0,
        type: data.type || 'MOVIE_THEATRE',
        imageUrl: data.imageUrl?.trim() || null,
      },
    });
  },

  async updateVenue(id: string, data: any) {
    const existing = await prisma.venue.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Venue not found.', 404, 'VENUE_NOT_FOUND');
    }

    return prisma.venue.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name.trim() : undefined,
        location: data.location !== undefined ? data.location.trim() : undefined,
        address: data.address !== undefined ? data.address.trim() : undefined,
        city: data.city !== undefined ? data.city.trim() : undefined,
        capacity: data.capacity !== undefined ? parseInt(data.capacity, 10) : undefined,
        type: data.type !== undefined ? data.type : undefined,
        imageUrl: data.imageUrl !== undefined ? data.imageUrl?.trim() : undefined,
      },
    });
  },

  async deleteVenue(id: string) {
    const existing = await prisma.venue.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Venue not found.', 404, 'VENUE_NOT_FOUND');
    }

    return prisma.venue.delete({ where: { id } });
  },

  async createScreen(venueId: string, data: { name: string; rows: number; columns: number }) {
    const venue = await prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) {
      throw new AppError('Venue not found.', 404, 'VENUE_NOT_FOUND');
    }

    const rowCount = Math.min(Math.max(data.rows, 1), 26); // A through Z
    const colCount = Math.min(Math.max(data.columns, 1), 30);
    const capacity = rowCount * colCount;

    return prisma.$transaction(async (tx) => {
      const screen = await tx.screen.create({
        data: {
          venueId,
          name: data.name.trim(),
          rows: rowCount,
          columns: colCount,
          capacity,
        },
      });

      // Automatically generate seats for the screen layout
      const seatData: Array<{
        screenId: string;
        rowLabel: string;
        seatNumber: number;
        seatType: 'REGULAR' | 'PREMIUM' | 'VIP';
        priceMultiplier: number;
      }> = [];

      for (let r = 0; r < rowCount; r++) {
        const rowLabel = String.fromCharCode(65 + r); // A, B, C...
        let seatType: 'REGULAR' | 'PREMIUM' | 'VIP' = 'REGULAR';
        let priceMultiplier = 1.0;

        // Front 1-2 rows VIP, next 2-3 rows Premium, remaining Regular
        if (r < 2) {
          seatType = 'VIP';
          priceMultiplier = 1.5;
        } else if (r < 4) {
          seatType = 'PREMIUM';
          priceMultiplier = 1.25;
        }

        for (let c = 1; c <= colCount; c++) {
          seatData.push({
            screenId: screen.id,
            rowLabel,
            seatNumber: c,
            seatType,
            priceMultiplier,
          });
        }
      }

      await tx.seat.createMany({
        data: seatData,
      });

      // Update venue capacity
      const allScreens = await tx.screen.findMany({ where: { venueId } });
      const totalCapacity = allScreens.reduce((sum, s) => sum + s.capacity, 0);
      await tx.venue.update({
        where: { id: venueId },
        data: { capacity: totalCapacity },
      });

      return tx.screen.findUnique({
        where: { id: screen.id },
        include: { seats: true },
      });
    });
  },
};
