/**
 * src/components/forms/PasswordValidator.tsx
 * Componente visual para validación de contraseña
 */

'use client';

import { useState } from 'react';
import { validatePassword } from '@/lib/password-validator';

interface PasswordValidatorProps {
  onPasswordChange?: (password: string) => void;
}

export default function PasswordValidator({
  onPasswordChange,
}: PasswordValidatorProps) {
  const [password, setPassword] = useState('');
  const validation = validatePassword(password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    onPasswordChange?.(newPassword);
  };

  return (
    <div className="space-y-3">
      <input
        type="password"
        value={password}
        onChange={handleChange}
        placeholder="Ingrese contraseña segura"
        className="w-full px-3 py-2 border rounded"
      />

      {password && (
        <>
          <div
            className={`h-2 rounded ${
              validation.strength === 'strong'
                ? 'bg-green-500'
                : validation.strength === 'medium'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
          />

          {validation.errors.length > 0 && (
            <ul className="text-sm text-red-600 space-y-1">
              {validation.errors.map((error, i) => (
                <li key={i}>• {error}</li>
              ))}
            </ul>
          )}

          {validation.valid && (
            <p className="text-sm text-green-600">
              ✓ Contraseña segura ({validation.strength})
            </p>
          )}
        </>
      )}
    </div>
  );
}
