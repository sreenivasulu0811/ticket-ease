import { app } from './app.js';
import { config } from './config/index.js';
import { prisma } from './utils/prisma.js';
import { logger } from './utils/logger.js';
import { startHoldCleanupJob } from './jobs/holdCleanup.job.js';

const startServer = async () => {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info('[Database] Connected successfully to PostgreSQL.');

    // Start background hold & waitlist expiry worker
    startHoldCleanupJob(30);

    const server = app.listen(config.port, () => {
      logger.info(`=======================================================`);
      logger.info(`🚀 TicketEase API Server running on port ${config.port}`);
      logger.info(`🌐 Health check: http://localhost:${config.port}/api/health`);
      logger.info(`🎬 Frontend URL: ${config.frontendUrl}`);
      logger.info(`=======================================================`);
    });

    const shutdown = async () => {
      logger.info('Shutting down TicketEase server gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Database disconnected. Exiting.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    logger.error('Failed to start TicketEase server:', error);
    process.exit(1);
  }
};

startServer();
