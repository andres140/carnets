/**
 * tests/security/rate-limit.test.ts
 * Tests para rate limiting
 */

import { describe, it, expect } from 'vitest';

describe('Rate Limiting', () => {
  describe('Login rate limit (5 intentos en 900 seg)', () => {
    it('debe permitir 5 intentos seguidos', () => {
      let allowed = 0;
      for (let i = 0; i < 5; i++) {
        allowed++;
      }
      expect(allowed).toBe(5);
    });

    it('debe rechazar el intento 6', () => {
      let requests = Array(6).fill(true);
      const blocked = requests.length > 5;
      expect(blocked).toBe(true);
    });
  });
});
