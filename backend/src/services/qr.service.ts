import QRCode from 'qrcode';
import crypto from 'crypto';
import { config } from '../config/index.js';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../middleware/error.middleware.js';
import { logger } from '../utils/logger.js';

export interface QRVerificationResult {
  valid: boolean;
  status: 'VALID' | 'USED' | 'CANCELLED' | 'INVALID';
  message: string;
  booking?: any;
}

export const qrService = {
  /**
   * Generates a signed tamper-proof QR code payload and returns a Data URL image
   */
  async generateTicketQR(booking: {
    id: string;
    bookingReference: string;
    userId: string;
    showId: string;
    totalAmount: number;
  }): Promise<string> {
    const payload = {
      ref: booking.bookingReference,
      bid: booking.id,
      uid: booking.userId,
      sid: booking.showId,
      amt: booking.totalAmount,
    };

    const signature = crypto
      .createHmac('sha256', config.qr.secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const qrData = JSON.stringify({
      ...payload,
      sig: signature,
    });

    // Generate high-resolution QR code Data URL
    return QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 320,
      color: {
        dark: '#12225f',
        light: '#ffffff',
      },
    });
  },

  /**
   * Validates a scanned QR payload or manual booking reference
   * Single-use entry check: Transitions VALID -> USED
   */
  async validateTicket(input: string, operatorName = 'Staff'): Promise<QRVerificationResult> {
    let bookingRef = input.trim();

    // If input is JSON payload from QR scanner, parse reference
    if (input.startsWith('{') && input.endsWith('}')) {
      try {
        const parsed = JSON.parse(input);
        if (parsed.ref) {
          bookingRef = parsed.ref;
        } else if (parsed.bid) {
          bookingRef = parsed.bid;
        }
      } catch {
        // Fallback to raw string
      }
    }

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { bookingReference: { equals: bookingRef, mode: 'insensitive' } },
          { id: bookingRef },
        ],
      },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        show: {
          include: {
            event: true,
            screen: { include: { venue: true } },
          },
        },
        bookingSeats: {
          include: {
            showSeat: {
              include: { seat: true },
            },
          },
        },
      },
    });

    if (!booking) {
      logger.warn(`[QR Validation] Invalid ticket scanned: ${bookingRef}`);
      return {
        valid: false,
        status: 'INVALID',
        message: 'Invalid ticket. No booking found with this reference.',
      };
    }

    // Check cancellation status
    if (booking.status === 'CANCELLED' || booking.ticketStatus === 'CANCELLED') {
      logger.warn(`[QR Validation] Cancelled ticket presented: ${booking.bookingReference}`);
      return {
        valid: false,
        status: 'CANCELLED',
        message: `TICKET CANCELLED — This booking was cancelled on ${booking.cancelledAt?.toLocaleString() || 'earlier'}. Entry denied.`,
        booking,
      };
    }

    // Check if already used (prevent double entry)
    if (booking.ticketStatus === 'USED') {
      logger.warn(`[QR Validation] Already used ticket presented: ${booking.bookingReference}`);
      return {
        valid: false,
        status: 'USED',
        message: `ALREADY USED — This ticket was checked in on ${booking.usedAt?.toLocaleString() || 'earlier'}. Entry denied.`,
        booking,
      };
    }

    if (booking.status !== 'CONFIRMED') {
      return {
        valid: false,
        status: 'INVALID',
        message: `Booking status is ${booking.status}. Only CONFIRMED bookings are valid for admission.`,
        booking,
      };
    }

    // Mark as USED
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        ticketStatus: 'USED',
        usedAt: new Date(),
      },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        show: {
          include: {
            event: true,
            screen: { include: { venue: true } },
          },
        },
        bookingSeats: {
          include: {
            showSeat: {
              include: { seat: true },
            },
          },
        },
      },
    });

    logger.info(`[QR Validation] Ticket successfully validated for booking ${booking.bookingReference} by ${operatorName}`);

    return {
      valid: true,
      status: 'VALID',
      message: `TICKET VALID ✓ — Admission approved for ${updatedBooking.user.name}`,
      booking: updatedBooking,
    };
  },
};
