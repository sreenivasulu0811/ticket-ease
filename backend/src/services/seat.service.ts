import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/prisma.js';
import { config } from '../config/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { logger } from '../utils/logger.js';

export interface HoldSeatsInput {
  showId: string;
  seatIds: string[]; // showSeat IDs or seat IDs
  userId?: string;
}

export const seatService = {
  /**
   * Release expired holds lazily for a given show
   */
  async expireShowHolds(showId: string) {
    const now = new Date();
    const expiredCount = await prisma.showSeat.updateMany({
      where: {
        showId,
        status: 'HELD',
        holdExpiresAt: { lt: now },
      },
      data: {
        status: 'AVAILABLE',
        holdToken: null,
        holdExpiresAt: null,
        heldByUserId: null,
      },
    });

    if (expiredCount.count > 0) {
      logger.info(`[SeatService] Lazy-expired ${expiredCount.count} seats for show ${showId}`);
    }
  },

  /**
   * Global cleanup job for all expired holds and expired waitlist offers
   */
  async cleanupAllExpired() {
    const now = new Date();
    try {
      // 1. Release expired seat holds
      const expiredSeats = await prisma.showSeat.updateMany({
        where: {
          status: 'HELD',
          holdExpiresAt: { lt: now },
        },
        data: {
          status: 'AVAILABLE',
          holdToken: null,
          holdExpiresAt: null,
          heldByUserId: null,
        },
      });

      if (expiredSeats.count > 0) {
        logger.info(`[Background Job] Cleaned up ${expiredSeats.count} expired seat holds.`);
      }

      // 2. Expire stale waitlist offers
      const expiredOffers = await prisma.waitlistEntry.updateMany({
        where: {
          status: 'OFFERED',
          offerExpiresAt: { lt: now },
        },
        data: {
          status: 'EXPIRED',
        },
      });

      if (expiredOffers.count > 0) {
        logger.info(`[Background Job] Expired ${expiredOffers.count} stale waitlist offers.`);
      }
    } catch (err) {
      logger.error('[Background Job] Error during cleanup:', err);
    }
  },

  /**
   * Get seat map for a show with real-time status and pricing
   */
  async getShowSeats(showId: string, currentUserId?: string, currentHoldToken?: string) {
    // 1. Run lazy expiration first
    await this.expireShowHolds(showId);

    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: {
        event: true,
        screen: {
          include: {
            venue: true,
          },
        },
        showSeats: {
          include: {
            seat: true,
          },
          orderBy: [
            { seat: { rowLabel: 'asc' } },
            { seat: { seatNumber: 'asc' } },
          ],
        },
      },
    });

    if (!show) {
      throw new AppError('Show not found.', 404, 'SHOW_NOT_FOUND');
    }

    const now = new Date();
    const formattedSeats = show.showSeats.map((ss) => {
      const price = Math.round(show.basePrice * ss.seat.priceMultiplier);
      const isHeldByMe =
        ss.status === 'HELD' &&
        ((currentUserId && ss.heldByUserId === currentUserId) ||
          (currentHoldToken && ss.holdToken === currentHoldToken));

      let effectiveStatus = ss.status;
      if (ss.status === 'HELD' && ss.holdExpiresAt && ss.holdExpiresAt < now) {
        effectiveStatus = 'AVAILABLE';
      }

      return {
        id: ss.id,
        seatId: ss.seatId,
        rowLabel: ss.seat.rowLabel,
        seatNumber: ss.seat.seatNumber,
        seatType: ss.seat.seatType,
        priceMultiplier: ss.seat.priceMultiplier,
        price,
        status: effectiveStatus,
        isHeldByMe,
        holdExpiresAt: ss.holdExpiresAt,
      };
    });

    // Summary counts
    const totalSeats = formattedSeats.length;
    const availableSeats = formattedSeats.filter((s) => s.status === 'AVAILABLE').length;
    const bookedSeats = formattedSeats.filter((s) => s.status === 'BOOKED').length;
    const heldSeats = formattedSeats.filter((s) => s.status === 'HELD').length;

    return {
      show: {
        id: show.id,
        startTime: show.startTime,
        endTime: show.endTime,
        basePrice: show.basePrice,
        status: show.status,
        event: show.event,
        venue: show.screen.venue,
        screen: {
          id: show.screen.id,
          name: show.screen.name,
          rows: show.screen.rows,
          columns: show.screen.columns,
          capacity: show.screen.capacity,
        },
      },
      stats: {
        totalSeats,
        availableSeats,
        bookedSeats,
        heldSeats,
        isSoldOut: availableSeats === 0,
      },
      seats: formattedSeats,
    };
  },

  /**
   * Concurrency-safe seat holding using transactional locking
   */
  async holdSeats(input: HoldSeatsInput) {
    const { showId, seatIds, userId } = input;

    if (!seatIds || seatIds.length === 0) {
      throw new AppError('Please select at least one seat to reserve.', 400, 'NO_SEATS_SELECTED');
    }

    if (seatIds.length > 10) {
      throw new AppError('You can reserve a maximum of 10 seats per booking.', 400, 'MAX_SEATS_EXCEEDED');
    }

    const holdDurationMinutes = config.businessRules.seatHoldMinutes;
    const holdExpiresAt = new Date(Date.now() + holdDurationMinutes * 60 * 1000);
    const holdToken = uuidv4();

    return prisma.$transaction(async (tx) => {
      // 1. Reclaim any expired holds for this show first
      const now = new Date();
      await tx.showSeat.updateMany({
        where: {
          showId,
          status: 'HELD',
          holdExpiresAt: { lt: now },
        },
        data: {
          status: 'AVAILABLE',
          holdToken: null,
          holdExpiresAt: null,
          heldByUserId: null,
        },
      });

      // 2. Fetch the target seats (support matching by showSeat.id or seat.id)
      const targetSeats = await tx.showSeat.findMany({
        where: {
          showId,
          OR: [
            { id: { in: seatIds } },
            { seatId: { in: seatIds } },
          ],
        },
        include: {
          seat: true,
          show: true,
        },
      });

      if (targetSeats.length !== seatIds.length) {
        throw new AppError('One or more selected seats could not be found for this show.', 404, 'SEAT_NOT_FOUND');
      }

      // 3. Concurrency check: Ensure EVERY requested seat is currently AVAILABLE
      const unavailableSeats: string[] = [];
      for (const showSeat of targetSeats) {
        const isCurrentlyAvailable =
          showSeat.status === 'AVAILABLE' ||
          (showSeat.status === 'HELD' && showSeat.holdExpiresAt && showSeat.holdExpiresAt < now);

        if (!isCurrentlyAvailable) {
          unavailableSeats.push(`${showSeat.seat.rowLabel}${showSeat.seat.seatNumber}`);
        }
      }

      if (unavailableSeats.length > 0) {
        logger.warn(`[Seat Hold Conflict] Seats ${unavailableSeats.join(', ')} unavailable for show ${showId}`);
        throw new AppError(
          `Seat${unavailableSeats.length > 1 ? 's' : ''} ${unavailableSeats.join(', ')} is no longer available. Please select different seats.`,
          409,
          'SEAT_UNAVAILABLE'
        );
      }

      // 4. Atomically transition selected seats to HELD
      const targetIds = targetSeats.map((s) => s.id);
      await tx.showSeat.updateMany({
        where: {
          id: { in: targetIds },
          status: 'AVAILABLE', // Atomic guard
        },
        data: {
          status: 'HELD',
          holdToken,
          holdExpiresAt,
          heldByUserId: userId || null,
        },
      });

      // 5. Calculate pricing
      const show = targetSeats[0].show;
      const seatDetails = targetSeats.map((ss) => {
        const price = Math.round(show.basePrice * ss.seat.priceMultiplier);
        return {
          showSeatId: ss.id,
          seatId: ss.seatId,
          rowLabel: ss.seat.rowLabel,
          seatNumber: ss.seat.seatNumber,
          seatType: ss.seat.seatType,
          price,
        };
      });

      const subtotal = seatDetails.reduce((sum, s) => sum + s.price, 0);
      const convenienceFee = config.businessRules.convenienceFee;
      const totalAmount = subtotal + convenienceFee;

      logger.info(`[Seat Hold] Successfully held ${seatDetails.length} seats with token ${holdToken} for show ${showId}`);

      return {
        holdToken,
        holdExpiresAt,
        expiresInSeconds: holdDurationMinutes * 60,
        seats: seatDetails,
        pricing: {
          subtotal,
          convenienceFee,
          totalAmount,
        },
      };
    });
  },

  /**
   * Explicitly release held seats by holdToken
   */
  async releaseHold(showId: string, holdToken: string, userId?: string) {
    const where: any = {
      showId,
      holdToken,
      status: 'HELD',
    };

    if (userId) {
      where.heldByUserId = userId;
    }

    const released = await prisma.showSeat.updateMany({
      where,
      data: {
        status: 'AVAILABLE',
        holdToken: null,
        holdExpiresAt: null,
        heldByUserId: null,
      },
    });

    logger.info(`[Seat Release] Released ${released.count} seats for holdToken ${holdToken}`);
    return { releasedCount: released.count };
  },
};
