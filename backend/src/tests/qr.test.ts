import { describe, it, expect } from 'vitest';
import { qrService } from '../services/qr.service.js';

describe('QR Service', () => {
  it('should generate valid QR code data URL', async () => {
    const booking = {
      id: 'test-booking-123',
      bookingReference: 'TE-2026-TEST01',
      userId: 'test-user-123',
      showId: 'test-show-123',
      totalAmount: 500,
    };

    const qrDataUrl = await qrService.generateTicketQR(booking);
    expect(qrDataUrl).toBeDefined();
    expect(qrDataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
