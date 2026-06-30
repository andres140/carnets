/**
 * Utilidades para registrar cambios en auditoría.
 */

const USER_AUDIT_FIELDS = [
  'documento',
  'tipoDocumento',
  'nombres',
  'apellidos',
  'email',
  'telefono',
  'estado',
  'rolId',
  'rolNombre',
  'tipoUsuario',
  'regionalId',
  'regionalNombre',
  'centroId',
  'centroNombre',
  'dependenciaId',
  'dependenciaNombre',
  'fotoUrl',
];

function computeUserChanges(before, after) {
  if (!before || !after) return null;

  const cambios = {};

  for (const field of USER_AUDIT_FIELDS) {
    const prev = before[field] ?? null;
    const next = after[field] ?? null;
    if (prev !== next) {
      cambios[field] = { antes: prev, despues: next };
    }
  }

  return Object.keys(cambios).length > 0 ? cambios : null;
}

function computeEntityChanges(before, after, fields) {
  if (!before || !after) return null;

  const cambios = {};
  for (const field of fields) {
    const prev = before[field] ?? null;
    const next = after[field] ?? null;
    if (prev !== next) {
      cambios[field] = { antes: prev, despues: next };
    }
  }

  return Object.keys(cambios).length > 0 ? cambios : null;
}

module.exports = { computeUserChanges, USER_AUDIT_FIELDS, computeEntityChanges };
