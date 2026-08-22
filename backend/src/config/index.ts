import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || process.env.SERVER_PORT || '8080', 10),
  appUrl: process.env.APP_URL || 'http://localhost:8080',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://ticketease:ticketease@localhost:5432/ticketease?schema=public',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'ticketease-super-secret-key-development-min-256-bits-xyz',
    expiresIn: process.env.JWT_EXPIRATION || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '30d',
  },

  qr: {
    secret: process.env.QR_SECRET || 'ticketease-qr-validation-secret-key',
  },

  mail: {
    enabled: process.env.MAIL_ENABLED === 'true',
    host: process.env.MAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    user: process.env.MAIL_USERNAME || '',
    pass: process.env.MAIL_PASSWORD || '',
    from: process.env.MAIL_FROM || 'no-reply@ticketease.demo',
  },

  businessRules: {
    seatHoldMinutes: parseInt(process.env.SEAT_HOLD_MINUTES || '5', 10),
    waitlistOfferMinutes: parseInt(process.env.WAITLIST_OFFER_MINUTES || '5', 10),
    cancellationCutoffHours: parseFloat(process.env.CANCELLATION_CUTOFF_HOURS || '0.5'), // 30 minutes
    convenienceFee: 30.0,
  }
};
