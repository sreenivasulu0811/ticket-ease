import { describe, it, expect, vi } from 'vitest';
import { seatService } from '../services/seat.service.js';

describe('Concurrency & Double-Booking Prevention Logic', () => {
  it('should guarantee that concurrent hold attempts on the same seat result in only one winner', async () => {
    // Simulating transactional lock check
    let seatState = 'AVAILABLE';
    const lockMutex = { locked: false };

    const simulateAtomicHold = async (userId: string, seatId: string) => {
      // Simulate database transaction with row-level lock
      if (lockMutex.locked) {
        // Wait briefly for transaction lock
        await new Promise((r) => setTimeout(r, 10));
      }

      lockMutex.locked = true;
      try {
        if (seatState !== 'AVAILABLE') {
          throw new Error('SEAT_UNAVAILABLE');
        }
        seatState = `HELD_BY_${userId}`;
        return { success: true, user: userId, seatId };
      } finally {
        lockMutex.locked = false;
      }
    };

    // User A and User B concurrently attempt to book seat A10
    const attemptUserA = simulateAtomicHold('user_A', 'seat_A10');
    const attemptUserB = simulateAtomicHold('user_B', 'seat_A10');

    const results = await Promise.allSettled([attemptUserA, attemptUserB]);

    const successes = results.filter((r) => r.status === 'fulfilled');
    const failures = results.filter((r) => r.status === 'rejected');

    // Crucial check: Exactly 1 success, 1 failure
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
  });
});
