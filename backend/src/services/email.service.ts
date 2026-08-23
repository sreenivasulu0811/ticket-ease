import nodemailer from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export const emailService = {
  getTransporter() {
    if (config.mail.enabled && config.mail.host && config.mail.user) {
      return nodemailer.createTransport({
        host: config.mail.host,
        port: config.mail.port,
        secure: config.mail.port === 465,
        auth: {
          user: config.mail.user,
          pass: config.mail.pass,
        },
      });
    }
    return null;
  },

  async sendBookingConfirmation(booking: {
    bookingReference: string;
    totalAmount: number;
    user: { name: string; email: string };
    show: {
      startTime: Date;
      event: { title: string; type: string; posterUrl: string };
      screen: { name: string; venue: { name: string; address: string; city: string } };
    };
    seats: Array<{ rowLabel: string; seatNumber: number; seatType: string; price: number }>;
  }) {
    const formattedDate = new Date(booking.show.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = new Date(booking.show.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const seatLabels = booking.seats.map((s) => `${s.rowLabel}${s.seatNumber}`).join(', ');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: -0.5px;">TicketEase</h1>
          <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Your Booking Confirmation</p>
        </div>
        <div style="padding: 24px;">
          <h2 style="color: #1e293b; margin-top: 0; font-size: 20px;">Hi ${booking.user.name}, you're all set! 🎉</h2>
          <p style="color: #64748b; font-size: 15px; line-height: 1.5;">Your tickets have been confirmed. Please present your digital QR ticket at the venue gate for admission.</p>
          
          <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <div style="font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold; margin-bottom: 4px;">Booking Reference</div>
            <div style="font-size: 22px; font-weight: bold; color: #1e40af; font-family: monospace;">${booking.bookingReference}</div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Event:</td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: bold; font-size: 14px; text-align: right;">${booking.show.event.title}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Venue:</td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 14px; text-align: right;">${booking.show.screen.venue.name} (${booking.show.screen.venue.city})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Screen / Hall:</td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 14px; text-align: right;">${booking.show.screen.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Date & Time:</td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 14px; text-align: right;">${formattedDate} at ${formattedTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Seats:</td>
              <td style="padding: 8px 0; color: #1e40af; font-weight: bold; font-size: 14px; text-align: right;">${seatLabels}</td>
            </tr>
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 12px 0 8px 0; color: #0f172a; font-weight: bold; font-size: 16px;">Total Paid:</td>
              <td style="padding: 12px 0 8px 0; color: #059669; font-weight: bold; font-size: 18px; text-align: right;">₹${booking.totalAmount.toFixed(2)}</td>
            </tr>
          </table>

          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; border-radius: 4px; font-size: 13px; color: #1e40af;">
            💡 <strong>Cancellation Policy:</strong> You can cancel your booking directly from <em>My Bookings</em> up to 30 minutes before showtime.
          </div>
        </div>
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; color: #64748b; font-size: 12px;">
          TicketEase Smart Ticket Booking Platform &bull; Digital Admission Voucher
        </div>
      </div>
    `;

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"TicketEase" <${config.mail.from}>`,
          to: booking.user.email,
          subject: `🎟️ Booking Confirmed: ${booking.show.event.title} [${booking.bookingReference}]`,
          html,
        });
        logger.info(`[Email Service] Sent confirmation email to ${booking.user.email} for ${booking.bookingReference}`);
      } catch (err) {
        logger.error(`[Email Service] Failed to send email to ${booking.user.email}:`, err);
      }
    } else {
      // Dev mode logger
      logger.info(`\n================== [DEV EMAIL SERVICE] ==================\n` +
        `To: ${booking.user.email}\n` +
        `Subject: 🎟️ Booking Confirmed: ${booking.show.event.title} [${booking.bookingReference}]\n` +
        `Event: ${booking.show.event.title}\n` +
        `Venue: ${booking.show.screen.venue.name} (${booking.show.screen.name})\n` +
        `Date/Time: ${formattedDate} at ${formattedTime}\n` +
        `Seats: ${seatLabels}\n` +
        `Total: ₹${booking.totalAmount}\n` +
        `=========================================================\n`);
    }
  },

  async sendCancellationNotification(booking: {
    bookingReference: string;
    refundAmount: number;
    user: { name: string; email: string };
    eventTitle: string;
  }) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #dc2626, #ef4444); padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">TicketEase</h1>
          <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">Booking Cancellation & Refund</p>
        </div>
        <div style="padding: 24px;">
          <h2 style="color: #1e293b; margin-top: 0; font-size: 20px;">Hi ${booking.user.name},</h2>
          <p style="color: #64748b; font-size: 15px; line-height: 1.5;">Your booking for <strong>${booking.eventTitle}</strong> (Ref: <code style="color: #dc2626;">${booking.bookingReference}</code>) has been cancelled.</p>
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <div style="font-size: 12px; text-transform: uppercase; color: #991b1b; font-weight: bold;">Refund Processed</div>
            <div style="font-size: 22px; font-weight: bold; color: #dc2626;">₹${booking.refundAmount.toFixed(2)}</div>
            <p style="font-size: 12px; color: #7f1d1d; margin: 4px 0 0 0;">Credited to your original payment method.</p>
          </div>
        </div>
      </div>
    `;

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"TicketEase" <${config.mail.from}>`,
          to: booking.user.email,
          subject: `Booking Cancelled & Refund Processed [${booking.bookingReference}]`,
          html,
        });
      } catch (err) {
        logger.error(`[Email Service] Failed to send cancellation email:`, err);
      }
    } else {
      logger.info(`\n================== [DEV EMAIL SERVICE - CANCELLATION] ==================\n` +
        `To: ${booking.user.email}\n` +
        `Subject: Booking Cancelled & Refund Processed [${booking.bookingReference}]\n` +
        `Refund: ₹${booking.refundAmount}\n` +
        `========================================================================\n`);
    }
  },

  async sendWaitlistOffer(offer: {
    userEmail: string;
    userName: string;
    eventTitle: string;
    showTime: Date;
    seatCount: number;
    expiresAt: Date;
  }) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #d97706, #f59e0b); padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">TicketEase</h1>
          <p style="margin: 4px 0 0 0; font-size: 14px; opacity: 0.9;">🎉 Seats Are Available For You!</p>
        </div>
        <div style="padding: 24px;">
          <h2 style="color: #1e293b; margin-top: 0; font-size: 20px;">Hi ${offer.userName},</h2>
          <p style="color: #64748b; font-size: 15px; line-height: 1.5;">${offer.seatCount} seat(s) just opened up for <strong>${offer.eventTitle}</strong>!</p>
          <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <div style="font-size: 13px; color: #92400e;">
              Please log in to your TicketEase account to accept this offer before it expires at <strong>${new Date(offer.expiresAt).toLocaleTimeString()}</strong>.
            </div>
          </div>
        </div>
      </div>
    `;

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"TicketEase" <${config.mail.from}>`,
          to: offer.userEmail,
          subject: `🌟 Seats Available! Confirm your TicketEase Waitlist Offer for ${offer.eventTitle}`,
          html,
        });
      } catch (err) {
        logger.error(`[Email Service] Failed to send waitlist email:`, err);
      }
    } else {
      logger.info(`\n================== [DEV EMAIL SERVICE - WAITLIST OFFER] ==================\n` +
        `To: ${offer.userEmail}\n` +
        `Subject: 🌟 Seats Available! Confirm your TicketEase Waitlist Offer for ${offer.eventTitle}\n` +
        `Expires At: ${offer.expiresAt.toLocaleTimeString()}\n` +
        `=========================================================================\n`);
    }
  },
};
