const crypto = require('crypto');

function generateId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return crypto.randomBytes(16).toString('hex');
}

function pickUserSession(user, permisos = []) {
  return {
    id: user.id,
    email: user.email,
    nombreCompleto: user.nombre_completo,
    tipoUsuario: user.tipo_usuario,
    rolId: user.rol_id,
    rolNombre: user.rol_nombre,
    regionalId: user.regional_id,
    centroId: user.centro_id,
    permisos,
  };
}

module.exports = { generateId, pickUserSession };
