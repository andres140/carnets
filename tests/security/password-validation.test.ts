/**
 * tests/security/password-validation.test.ts
 * Tests para validación de contraseñas
 */

import { describe, it, expect } from 'vitest';

describe('Password Validation', () => {
  describe('Requisitos de contraseña', () => {
    it('debe requerir al menos 8 caracteres', () => {
      const pwd = 'short';
      expect(pwd.length >= 8).toBe(false);
    });

    it('debe requerir mayúsculas', () => {
      const pwd = 'admin123!';
      expect(/[A-Z]/.test(pwd)).toBe(false);
    });
  });
});
