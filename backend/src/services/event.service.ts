import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/error.middleware.js';

export interface EventFilterQuery {
  search?: string;
  type?: 'MOVIE' | 'CONCERT';
  category?: string;
  language?: string;
  city?: string;
  date?: string;
  sort?: 'popular' | 'newest' | 'price_asc' | 'price_desc' | 'date';
}

export const eventService = {
  async getAllEvents(filters: EventFilterQuery = {}) {
    const where: any = {
      status: { not: 'ARCHIVED' },
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.category) {
      where.category = { equals: filters.category, mode: 'insensitive' };
    }

    if (filters.language) {
      where.language = { equals: filters.language, mode: 'insensitive' };
    }

    if (filters.search) {
      const searchTerm = filters.search.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { castOrArtist: { contains: searchTerm, mode: 'insensitive' } },
        { category: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    if (filters.city) {
      where.shows = {
        some: {
          screen: {
            venue: {
              city: { equals: filters.city, mode: 'insensitive' },
            },
          },
        },
      };
    }

    if (filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      where.shows = {
        some: {
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (filters.sort === 'popular') {
      orderBy = { rating: 'desc' };
    } else if (filters.sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const events = await prisma.event.findMany({
      where,
      orderBy,
      include: {
        shows: {
          where: {
            startTime: { gte: new Date() },
            status: 'SCHEDULED',
          },
          include: {
            screen: {
              include: {
                venue: true,
              },
            },
          },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    // Compute min price and available cities for each event
    return events.map((event) => {
      const prices = event.shows.map((s) => s.basePrice);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const cities = Array.from(
        new Set(event.shows.map((s) => s.screen.venue.city).filter(Boolean))
      );

      return {
        ...event,
        minPrice,
        cities,
        upcomingShowCount: event.shows.length,
      };
    });
  },

  async getFeaturedEvents() {
    const events = await prisma.event.findMany({
      where: {
        status: 'ACTIVE',
      },
      take: 6,
      orderBy: { rating: 'desc' },
      include: {
        shows: {
          where: {
            startTime: { gte: new Date() },
            status: 'SCHEDULED',
          },
          include: {
            screen: {
              include: {
                venue: true,
              },
            },
          },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    return events.map((event) => {
      const prices = event.shows.map((s) => s.basePrice);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      return {
        ...event,
        minPrice,
      };
    });
  },

  async getEventById(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        shows: {
          where: {
            startTime: { gte: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // allow recent shows
            status: 'SCHEDULED',
          },
          include: {
            screen: {
              include: {
                venue: true,
              },
            },
            showSeats: {
              select: {
                status: true,
              },
            },
          },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!event) {
      throw new AppError('Event not found.', 404, 'EVENT_NOT_FOUND');
    }

    const showsWithStats = event.shows.map((show) => {
      const totalSeats = show.showSeats.length;
      const bookedOrHeld = show.showSeats.filter(
        (s) => s.status === 'BOOKED' || s.status === 'HELD' || s.status === 'BLOCKED'
      ).length;
      const availableSeats = totalSeats - bookedOrHeld;
      const isSoldOut = totalSeats > 0 && availableSeats === 0;

      const { showSeats, ...showDetails } = show;
      return {
        ...showDetails,
        totalSeats,
        availableSeats,
        isSoldOut,
      };
    });

    const prices = showsWithStats.map((s) => s.basePrice);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

    return {
      ...event,
      shows: showsWithStats,
      minPrice,
    };
  },

  async createEvent(data: any) {
    return prisma.event.create({
      data: {
        title: data.title.trim(),
        description: data.description.trim(),
        type: data.type || 'MOVIE',
        language: data.language || 'English',
        duration: parseInt(data.duration, 10),
        posterUrl: data.posterUrl.trim(),
        backdropUrl: data.backdropUrl?.trim() || null,
        category: data.category.trim(),
        castOrArtist: data.castOrArtist?.trim() || null,
        status: data.status || 'ACTIVE',
        rating: data.rating ? parseFloat(data.rating) : 4.5,
      },
    });
  },

  async updateEvent(id: string, data: any) {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Event not found.', 404, 'EVENT_NOT_FOUND');
    }

    return prisma.event.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title.trim() : undefined,
        description: data.description !== undefined ? data.description.trim() : undefined,
        type: data.type !== undefined ? data.type : undefined,
        language: data.language !== undefined ? data.language : undefined,
        duration: data.duration !== undefined ? parseInt(data.duration, 10) : undefined,
        posterUrl: data.posterUrl !== undefined ? data.posterUrl.trim() : undefined,
        backdropUrl: data.backdropUrl !== undefined ? data.backdropUrl?.trim() : undefined,
        category: data.category !== undefined ? data.category.trim() : undefined,
        castOrArtist: data.castOrArtist !== undefined ? data.castOrArtist?.trim() : undefined,
        status: data.status !== undefined ? data.status : undefined,
        rating: data.rating !== undefined ? parseFloat(data.rating) : undefined,
      },
    });
  },

  async deleteEvent(id: string) {
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Event not found.', 404, 'EVENT_NOT_FOUND');
    }

    return prisma.event.delete({ where: { id } });
  },
};
