import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

export interface ProcessPaymentInput {
  amount: number;
  paymentMethod: 'UPI' | 'CARD' | 'NET_BANKING';
  simulateStatus?: 'SUCCESS' | 'FAILED';
  bookingReference?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  paymentMethod: string;
  amount: number;
  message: string;
  timestamp: Date;
}

export const paymentService = {
  /**
   * Process simulated payment
   */
  async processPayment(input: ProcessPaymentInput): Promise<PaymentResult> {
    const paymentId = `PAY-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;
    const shouldSucceed = input.simulateStatus !== 'FAILED';

    logger.info(
      `[Payment Simulation] Initiating payment of ₹${input.amount} via ${input.paymentMethod} (Simulate: ${
        shouldSucceed ? 'SUCCESS' : 'FAILURE'
      })`
    );

    if (!shouldSucceed) {
      logger.warn(`[Payment Simulation] Payment ${paymentId} failed as requested in simulation.`);
      return {
        success: false,
        paymentId,
        paymentMethod: input.paymentMethod,
        amount: input.amount,
        message: 'Payment simulation: Transaction failed by user choice or bank refusal.',
        timestamp: new Date(),
      };
    }

    logger.info(`[Payment Simulation] Payment ${paymentId} confirmed successfully.`);
    return {
      success: true,
      paymentId,
      paymentMethod: input.paymentMethod,
      amount: input.amount,
      message: 'Payment simulated successfully.',
      timestamp: new Date(),
    };
  },
};
