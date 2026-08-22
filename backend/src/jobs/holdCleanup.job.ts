import { seatService } from '../services/seat.service.js';
import { logger } from '../utils/logger.js';

let intervalId: NodeJS.Timeout | null = null;

export const startHoldCleanupJob = (intervalSeconds = 30) => {
  if (intervalId) return;

  logger.info(`[Background Job] Starting hold & waitlist cleanup worker (Interval: ${intervalSeconds}s)`);

  // Run once on startup
  seatService.cleanupAllExpired().catch((err) => logger.error('Initial cleanup error:', err));

  intervalId = setInterval(async () => {
    try {
      await seatService.cleanupAllExpired();
    } catch (err) {
      logger.error('[Background Job] Error during periodic cleanup execution:', err);
    }
  }, intervalSeconds * 1000);
};

export const stopHoldCleanupJob = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('[Background Job] Stopped hold cleanup worker.');
  }
};
