import { prisma } from '../utils/prisma.js';

export const reportService = {
  /**
   * Get comprehensive Admin KPI statistics
   */
  async getDashboardStats() {
    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1. Booking aggregations
    const allBookings = await prisma.booking.findMany({
      select: {
        totalAmount: true,
        status: true,
        createdAt: true,
      },
    });

    const confirmedBookings = allBookings.filter((b) => b.status === 'CONFIRMED');
    const cancelledBookings = allBookings.filter((b) => b.status === 'CANCELLED');
    const todayBookings = confirmedBookings.filter((b) => b.createdAt >= startOfToday);

    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const todayRevenue = todayBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    // 2. Counts
    const [totalUsers, totalEvents, totalVenues, totalShows, totalWaitlist] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.event.count({ where: { status: { not: 'ARCHIVED' } } }),
      prisma.venue.count(),
      prisma.show.count({ where: { status: 'SCHEDULED' } }),
      prisma.waitlistEntry.count({ where: { status: 'WAITING' } }),
    ]);

    // 3. Seat Inventory Stats
    const allShowSeats = await prisma.showSeat.findMany({
      select: { status: true },
    });

    const totalSeats = allShowSeats.length;
    const soldSeats = allShowSeats.filter((s) => s.status === 'BOOKED').length;
    const heldSeats = allShowSeats.filter((s) => s.status === 'HELD').length;
    const availableSeats = allShowSeats.filter((s) => s.status === 'AVAILABLE').length;
    const occupancyRate = totalSeats > 0 ? ((soldSeats / totalSeats) * 100).toFixed(1) : '0.0';
    const cancellationRate =
      allBookings.length > 0
        ? ((cancelledBookings.length / allBookings.length) * 100).toFixed(1)
        : '0.0';

    return {
      kpis: {
        totalRevenue,
        todayRevenue,
        totalBookings: confirmedBookings.length,
        todayBookings: todayBookings.length,
        cancelledBookings: cancelledBookings.length,
        cancellationRate: `${cancellationRate}%`,
        totalUsers,
        totalEvents,
        totalVenues,
        totalShows,
        totalSeats,
        soldSeats,
        heldSeats,
        availableSeats,
        occupancyRate: `${occupancyRate}%`,
        waitlistedUsers: totalWaitlist,
      },
    };
  },

  /**
   * Get revenue and bookings trend data for Recharts
   */
  async getAnalyticsData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const bookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group daily
    const dailyMap = new Map<string, { date: string; revenue: number; bookings: number }>();
    for (let i = 0; i <= 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const dateKey = d.toISOString().split('T')[0];
      dailyMap.set(dateKey, {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: 0,
        bookings: 0,
      });
    }

    bookings.forEach((b) => {
      const dateKey = b.createdAt.toISOString().split('T')[0];
      const entry = dailyMap.get(dateKey);
      if (entry) {
        entry.revenue += b.totalAmount;
        entry.bookings += 1;
      }
    });

    const dailyTrend = Array.from(dailyMap.values());

    // Most popular events
    const eventStats = await prisma.event.findMany({
      include: {
        shows: {
          include: {
            bookings: {
              where: { status: 'CONFIRMED' },
              select: { totalAmount: true },
            },
          },
        },
      },
    });

    const popularEvents = eventStats
      .map((ev) => {
        let totalRevenue = 0;
        let totalBookings = 0;
        ev.shows.forEach((sh) => {
          totalBookings += sh.bookings.length;
          totalRevenue += sh.bookings.reduce((sum, b) => sum + b.totalAmount, 0);
        });

        return {
          id: ev.id,
          title: ev.title,
          type: ev.type,
          posterUrl: ev.posterUrl,
          totalBookings,
          totalRevenue,
        };
      })
      .sort((a, b) => b.totalBookings - a.totalBookings)
      .slice(0, 5);

    // Venue breakdown
    const venueStats = await prisma.venue.findMany({
      include: {
        screens: {
          include: {
            shows: {
              include: {
                showSeats: { select: { status: true } },
              },
            },
          },
        },
      },
    });

    const venueOccupancy = venueStats.map((v) => {
      let totalSeats = 0;
      let bookedSeats = 0;
      v.screens.forEach((sc) => {
        sc.shows.forEach((sh) => {
          totalSeats += sh.showSeats.length;
          bookedSeats += sh.showSeats.filter((s) => s.status === 'BOOKED').length;
        });
      });

      const rate = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;
      return {
        venueName: v.name,
        city: v.city,
        totalSeats,
        bookedSeats,
        occupancyRate: rate,
      };
    });

    return {
      dailyTrend,
      popularEvents,
      venueOccupancy,
    };
  },
};
