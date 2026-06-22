/**
 * src/lib/password-validator.ts
 * Validación de contraseñas seguras
 */

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

/**
 * Validar contraseña según criterios de seguridad
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  // Longitud mínima
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres.');
  }

  // Mayúsculas
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una mayúscula.');
  }

  // Minúsculas
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una minúscula.');
  }

  // Números
  if (!/\d/.test(password)) {
    errors.push('La contraseña debe contener al menos un número.');
  }

  // Caracteres especiales
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push(
      'La contraseña debe contener al menos un carácter especial (!@#$%^&*).'
    );
  }

  // Calcular fortaleza
  if (errors.length === 0) {
    strength = password.length >= 12 ? 'strong' : 'medium';
  } else if (errors.length <= 2) {
    strength = 'medium';
  }

  return {
    valid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Generador de contraseña segura
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const all = uppercase + lowercase + numbers + special;

  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  return password.split('').sort(() => Math.random() - 0.5).join('');
}
