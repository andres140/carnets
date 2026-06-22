/**
 * tests/security/input-sanitization.test.ts
 * Tests para sanitización de entrada
 */

import { describe, it, expect } from 'vitest';

describe('Input Sanitization', () => {
  describe('Email sanitization', () => {
    it('debe aceptar email válido', () => {
      const email = 'user@example.com';
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      expect(isValid).toBe(true);
    });

    it('debe rechazar email inválido', () => {
      const email = 'notanemail';
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      expect(isValid).toBe(false);
    });
  });
});
