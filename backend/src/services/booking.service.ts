import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/prisma.js';
import { config } from '../config/index.js';
import { AppError } from '../middleware/error.middleware.js';
import { paymentService } from './payment.service.js';
import { qrService } from './qr.service.js';
import { emailService } from './email.service.js';
import { waitlistService } from './waitlist.service.js';
import { logger } from '../utils/logger.js';

export interface CreateBookingInput {
  showId: string;
  holdToken?: string;
  waitlistEntryId?: string;
  userId: string;
  paymentMethod: 'UPI' | 'CARD' | 'NET_BANKING';
  simulateStatus?: 'SUCCESS' | 'FAILED';
}

export const bookingService = {
  /**
   * Complete booking checkout with transactional integrity
   */
  async createBooking(input: CreateBookingInput) {
    const { showId, holdToken, waitlistEntryId, userId, paymentMethod, simulateStatus } = input;

    // Generate unique booking reference: TE-2026-XXXXXX
    const bookingReference = `TE-2026-${uuidv4().substring(0, 6).toUpperCase()}`;

    return prisma.$transaction(async (tx) => {
      let targetSeats: any[] = [];

      if (waitlistEntryId) {
        // Booking from waitlist offer acceptance
        const waitlistEntry = await tx.waitlistEntry.findUnique({
          where: { id: waitlistEntryId },
        });

        if (!waitlistEntry || waitlistEntry.userId !== userId) {
          throw new AppError('Invalid waitlist entry.', 404, 'WAITLIST_NOT_FOUND');
        }

        if (waitlistEntry.status !== 'OFFERED') {
          throw new AppError('This waitlist offer is no longer valid.', 400, 'OFFER_INVALID');
        }

        if (waitlistEntry.offerExpiresAt && waitlistEntry.offerExpiresAt < new Date()) {
          throw new AppError('This waitlist offer has expired.', 400, 'OFFER_EXPIRED');
        }

        const seatIds: string[] = JSON.parse(waitlistEntry.offeredSeatIds || '[]');
        targetSeats = await tx.showSeat.findMany({
          where: { id: { in: seatIds } },
          include: { seat: true, show: true },
        });

        // Mark waitlist entry ACCEPTED
        await tx.waitlistEntry.update({
          where: { id: waitlistEntryId },
          data: { status: 'ACCEPTED' },
        });
      } else {
        // Booking from standard seat hold
        if (!holdToken) {
          throw new AppError('Hold token is required to complete booking.', 400, 'HOLD_TOKEN_REQUIRED');
        }

        const now = new Date();
        targetSeats = await tx.showSeat.findMany({
          where: {
            showId,
            holdToken,
            status: 'HELD',
          },
          include: {
            seat: true,
            show: true,
          },
        });

        if (targetSeats.length === 0) {
          throw new AppError(
            'Your seat hold has expired or is invalid. Please select your seats again.',
            400,
            'HOLD_EXPIRED'
          );
        }

        // Check hold expiry
        const isExpired = targetSeats.some((s) => s.holdExpiresAt && s.holdExpiresAt < now);
        if (isExpired) {
          await tx.showSeat.updateMany({
            where: { id: { in: targetSeats.map((s) => s.id) } },
            data: {
              status: 'AVAILABLE',
              holdToken: null,
              holdExpiresAt: null,
              heldByUserId: null,
            },
          });

          throw new AppError(
            'Your seat hold has expired. Please select your seats again.',
            400,
            'HOLD_EXPIRED'
          );
        }
      }

      const show = targetSeats[0].show;
      const seatCalculations = targetSeats.map((ss) => {
        const price = Math.round(show.basePrice * ss.seat.priceMultiplier);
        return {
          showSeatId: ss.id,
          price,
          rowLabel: ss.seat.rowLabel,
          seatNumber: ss.seat.seatNumber,
          seatType: ss.seat.seatType,
        };
      });

      const subtotal = seatCalculations.reduce((sum, s) => sum + s.price, 0);
      const convenienceFee = config.businessRules.convenienceFee;
      const totalAmount = subtotal + convenienceFee;

      // 1. Process simulated payment
      const paymentResult = await paymentService.processPayment({
        amount: totalAmount,
        paymentMethod,
        simulateStatus,
        bookingReference,
      });

      if (!paymentResult.success) {
        // Payment failed: Release held seats immediately
        await tx.showSeat.updateMany({
          where: { id: { in: targetSeats.map((s) => s.id) } },
          data: {
            status: 'AVAILABLE',
            holdToken: null,
            holdExpiresAt: null,
            heldByUserId: null,
          },
        });

        throw new AppError(
          'Payment simulation failed. Your held seats have been released.',
          402,
          'PAYMENT_FAILED'
        );
      }

      // 2. Create Confirmed Booking record
      const booking = await tx.booking.create({
        data: {
          bookingReference,
          userId,
          showId,
          subtotal,
          convenienceFee,
          totalAmount,
          status: 'CONFIRMED',
          paymentStatus: 'SUCCESS',
          paymentMethod,
          paymentId: paymentResult.paymentId,
          ticketStatus: 'VALID',
        },
      });

      // 3. Create BookingSeat links
      await tx.bookingSeat.createMany({
        data: seatCalculations.map((sc) => ({
          bookingId: booking.id,
          showSeatId: sc.showSeatId,
          price: sc.price,
        })),
      });

      // 4. Update ShowSeat inventory to BOOKED
      await tx.showSeat.updateMany({
        where: { id: { in: targetSeats.map((s) => s.id) } },
        data: {
          status: 'BOOKED',
          bookingId: booking.id,
          holdToken: null,
          holdExpiresAt: null,
          heldByUserId: null,
        },
      });

      // 5. Generate secure QR ticket data URL
      const qrCodeData = await qrService.generateTicketQR({
        id: booking.id,
        bookingReference: booking.bookingReference,
        userId: booking.userId,
        showId: booking.showId,
        totalAmount: booking.totalAmount,
      });

      const finalBooking = await tx.booking.update({
        where: { id: booking.id },
        data: { qrCodeData },
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
      });

      logger.info(`[Booking Confirmed] Created booking ${bookingReference} for user ${userId} with total ₹${totalAmount}`);

      // 6. Send asynchronous confirmation email
      emailService.sendBookingConfirmation({
        bookingReference: finalBooking.bookingReference,
        totalAmount: finalBooking.totalAmount,
        user: finalBooking.user,
        show: finalBooking.show,
        seats: seatCalculations,
      }).catch((e) => logger.error('Email error:', e));

      return finalBooking;
    });
  },

  /**
   * Get single booking by ID
   */
  async getBookingById(id: string, userId: string, userRole: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
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
    });

    if (!booking) {
      throw new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND');
    }

    if (userRole !== 'ADMIN' && userRole !== 'OPERATOR' && booking.userId !== userId) {
      throw new AppError('You do not have permission to view this booking.', 403, 'FORBIDDEN');
    }

    return booking;
  },

  /**
   * Get all bookings for a user
   */
  async getUserBookings(userId: string) {
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
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

    const now = new Date();
    return bookings.map((b) => {
      const isPast = b.show.startTime < now;
      const hoursUntilShow = (b.show.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const isCancellable =
        b.status === 'CONFIRMED' &&
        hoursUntilShow > config.businessRules.cancellationCutoffHours;

      return {
        ...b,
        isPast,
        isCancellable,
        hoursUntilShow,
      };
    });
  },

  /**
   * Cancel booking, refund payment, release seats, and trigger waitlist FIFO allocation
   */
  async cancelBooking(bookingId: string, userId: string, userRole: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        show: { include: { event: true } },
        user: true,
        bookingSeats: { include: { showSeat: true } },
      },
    });

    if (!booking) {
      throw new AppError('Booking not found.', 404, 'BOOKING_NOT_FOUND');
    }

    if (userRole !== 'ADMIN' && booking.userId !== userId) {
      throw new AppError('You do not have permission to cancel this booking.', 403, 'FORBIDDEN');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new AppError(`Cannot cancel booking with status: ${booking.status}`, 400, 'INVALID_STATUS');
    }

    // Cancellation cutoff rule (e.g. 30 minutes before showtime)
    const now = new Date();
    const cutoffMs = config.businessRules.cancellationCutoffHours * 60 * 60 * 1000;
    if (booking.show.startTime.getTime() - now.getTime() < cutoffMs) {
      throw new AppError(
        `Cancellation unavailable: Bookings can only be cancelled up to ${config.businessRules.cancellationCutoffHours * 60} minutes before showtime.`,
        400,
        'CANCELLATION_DEADLINE_PASSED'
      );
    }

    return prisma.$transaction(async (tx) => {
      // 1. Mark booking CANCELLED
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'REFUNDED',
          ticketStatus: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });

      // 2. Release show seats back to AVAILABLE
      const showSeatIds = booking.bookingSeats.map((bs) => bs.showSeatId);
      await tx.showSeat.updateMany({
        where: { id: { in: showSeatIds } },
        data: {
          status: 'AVAILABLE',
          bookingId: null,
          holdToken: null,
          holdExpiresAt: null,
          heldByUserId: null,
        },
      });

      logger.info(
        `[Booking Cancelled] Booking ${booking.bookingReference} cancelled. Released ${showSeatIds.length} seats for show ${booking.showId}`
      );

      // 3. Process simulated refund
      const refundAmount = booking.totalAmount;

      // 4. Trigger FIFO Waitlist allocation for the released seats!
      await waitlistService.triggerWaitlistAllocation(booking.showId, showSeatIds, tx);

      // 5. Send cancellation email
      emailService.sendCancellationNotification({
        bookingReference: booking.bookingReference,
        refundAmount,
        user: booking.user,
        eventTitle: booking.show.event.title,
      }).catch((e) => logger.error('Cancellation email error:', e));

      return {
        success: true,
        booking: updatedBooking,
        refundAmount,
        message: 'Booking cancelled successfully. Refund has been simulated and seats released.',
      };
    });
  },
};
