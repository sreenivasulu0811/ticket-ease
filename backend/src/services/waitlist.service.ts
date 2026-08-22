import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import { config } from '../config/index.js';
import { emailService } from './email.service.js';
import { logger } from '../utils/logger.js';

export const waitlistService = {
  /**
   * Join waitlist for a sold-out show (FIFO)
   */
  async joinWaitlist(userId: string, showId: string, requestedSeats = 1) {
    const show = await prisma.show.findUnique({
      where: { id: showId },
      include: { event: true },
    });

    if (!show) {
      throw new AppError('Show not found.', 404, 'SHOW_NOT_FOUND');
    }

    if (show.startTime < new Date()) {
      throw new AppError('Cannot join waitlist for a past show.', 400, 'PAST_SHOW');
    }

    // Check if user is already waiting
    const existing = await prisma.waitlistEntry.findFirst({
      where: {
        userId,
        showId,
        status: { in: ['WAITING', 'OFFERED'] },
      },
    });

    if (existing) {
      throw new AppError('You are already on the waitlist for this show.', 409, 'ALREADY_WAITLISTED');
    }

    const entry = await prisma.waitlistEntry.create({
      data: {
        userId,
        showId,
        requestedSeats: Math.min(Math.max(requestedSeats, 1), 6),
        status: 'WAITING',
      },
      include: {
        show: { include: { event: true, screen: { include: { venue: true } } } },
      },
    });

    // Calculate queue position
    const position = await prisma.waitlistEntry.count({
      where: {
        showId,
        status: 'WAITING',
        createdAt: { lte: entry.createdAt },
      },
    });

    logger.info(`[Waitlist] User ${userId} joined waitlist for show ${showId} at position #${position}`);

    return {
      ...entry,
      queuePosition: position,
    };
  },

  /**
   * Get user's waitlist entries with queue positions
   */
  async getUserWaitlist(userId: string) {
    const entries = await prisma.waitlistEntry.findMany({
      where: { userId },
      include: {
        show: {
          include: {
            event: true,
            screen: { include: { venue: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = await Promise.all(
      entries.map(async (entry) => {
        let queuePosition = 0;
        if (entry.status === 'WAITING') {
          queuePosition = await prisma.waitlistEntry.count({
            where: {
              showId: entry.showId,
              status: 'WAITING',
              createdAt: { lte: entry.createdAt },
            },
          });
        }

        let offeredSeatsDetails: any[] = [];
        if (entry.offeredSeatIds) {
          try {
            const seatIds: string[] = JSON.parse(entry.offeredSeatIds);
            offeredSeatsDetails = await prisma.showSeat.findMany({
              where: { id: { in: seatIds } },
              include: { seat: true },
            });
          } catch {
            // Ignore parse error
          }
        }

        return {
          ...entry,
          queuePosition,
          offeredSeatsDetails,
        };
      })
    );

    return enriched;
  },

  /**
   * Automatic FIFO Allocation when seats are released (e.g. upon cancellation)
   */
  async triggerWaitlistAllocation(showId: string, releasedShowSeatIds: string[], customTx?: any) {
    const tx = customTx || prisma;

    if (!releasedShowSeatIds || releasedShowSeatIds.length === 0) return null;

    // Find earliest WAITING user (FIFO ordering: createdAt ASC)
    const nextWaitingUser = await tx.waitlistEntry.findFirst({
      where: {
        showId,
        status: 'WAITING',
        requestedSeats: { lte: releasedShowSeatIds.length },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        user: true,
        show: { include: { event: true } },
      },
    });

    if (!nextWaitingUser) {
      logger.info(`[Waitlist Allocation] No eligible waiting user found for show ${showId}`);
      return null;
    }

    const offerDurationMinutes = config.businessRules.waitlistOfferMinutes;
    const offerExpiresAt = new Date(Date.now() + offerDurationMinutes * 60 * 1000);
    const allocatedSeatIds = releasedShowSeatIds.slice(0, nextWaitingUser.requestedSeats);

    // Hold these seats for this waitlist user
    await tx.showSeat.updateMany({
      where: {
        id: { in: allocatedSeatIds },
      },
      data: {
        status: 'HELD',
        holdExpiresAt: offerExpiresAt,
        heldByUserId: nextWaitingUser.userId,
      },
    });

    // Update waitlist entry to OFFERED
    const updatedEntry = await tx.waitlistEntry.update({
      where: { id: nextWaitingUser.id },
      data: {
        status: 'OFFERED',
        offerExpiresAt,
        offeredSeatIds: JSON.stringify(allocatedSeatIds),
        allocatedAt: new Date(),
      },
    });

    logger.info(
      `[Waitlist Allocation] OFFER CREATED: Allocated ${allocatedSeatIds.length} seats to User ${nextWaitingUser.user.name} (${nextWaitingUser.user.email}) for show ${showId}`
    );

    // Send notification
    emailService.sendWaitlistOffer({
      userEmail: nextWaitingUser.user.email,
      userName: nextWaitingUser.user.name,
      eventTitle: nextWaitingUser.show.event.title,
      showTime: nextWaitingUser.show.startTime,
      seatCount: allocatedSeatIds.length,
      expiresAt: offerExpiresAt,
    }).catch((e) => logger.error('Waitlist email error:', e));

    return updatedEntry;
  },

  /**
   * Decline waitlist offer: Releases seats and advances FIFO queue to next customer
   */
  async declineOffer(waitlistId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const entry = await tx.waitlistEntry.findUnique({
        where: { id: waitlistId },
        include: { show: true },
      });

      if (!entry || entry.userId !== userId) {
        throw new AppError('Waitlist entry not found.', 404, 'WAITLIST_NOT_FOUND');
      }

      if (entry.status !== 'OFFERED') {
        throw new AppError(`Cannot decline an offer with status: ${entry.status}`, 400, 'INVALID_STATUS');
      }

      let offeredSeatIds: string[] = [];
      if (entry.offeredSeatIds) {
        try {
          offeredSeatIds = JSON.parse(entry.offeredSeatIds);
        } catch {
          offeredSeatIds = [];
        }
      }

      // 1. Release held seats
      if (offeredSeatIds.length > 0) {
        await tx.showSeat.updateMany({
          where: { id: { in: offeredSeatIds } },
          data: {
            status: 'AVAILABLE',
            holdToken: null,
            holdExpiresAt: null,
            heldByUserId: null,
          },
        });
      }

      // 2. Mark entry as DECLINED
      await tx.waitlistEntry.update({
        where: { id: waitlistId },
        data: { status: 'DECLINED' },
      });

      logger.info(`[Waitlist] User ${userId} declined offer for waitlist ${waitlistId}`);

      // 3. Immediately trigger FIFO reallocation for next waiting customer!
      if (offeredSeatIds.length > 0) {
        await this.triggerWaitlistAllocation(entry.showId, offeredSeatIds, tx);
      }

      return { success: true, message: 'Offer declined. Seats released to the next person in queue.' };
    });
  },
};
