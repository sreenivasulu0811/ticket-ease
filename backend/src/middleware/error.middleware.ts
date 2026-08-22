import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }

  if (err instanceof ZodError) {
    const errorDetails = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.status(400).json({
      success: false,
      code: 'VALIDATION_ERROR',
      message: `Invalid input: ${errorDetails}`,
      errors: err.errors,
      timestamp: new Date().toISOString(),
    });
  }

  // Handle Prisma known errors
  if (err?.code === 'P2002') {
    return res.status(409).json({
      success: false,
      code: 'DUPLICATE_ENTRY',
      message: 'A record with this unique value already exists.',
      timestamp: new Date().toISOString(),
    });
  }

  return res.status(500).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : (err.message || 'Internal Server Error'),
    timestamp: new Date().toISOString(),
  });
};
