import { describe, it, expect } from 'vitest';
import { authService } from '../services/auth.service.js';

describe('Auth Service Tokens', () => {
  it('should generate valid access and refresh tokens', () => {
    const user = {
      id: 'test-user-id',
      email: 'customer@ticketease.demo',
      role: 'CUSTOMER' as const,
    };

    const tokens = authService.generateTokens(user);
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(typeof tokens.accessToken).toBe('string');
    expect(typeof tokens.refreshToken).toBe('string');
  });
});
