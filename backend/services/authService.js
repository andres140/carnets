const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { pickUserSession } = require('../utils/helpers');

async function getPermisosByRolId(rolId) {
  const rows = await query(
    `SELECT p.codigo FROM permisos p
     INNER JOIN rol_permisos rp ON rp.permiso_id = p.id
     WHERE rp.rol_id = ?`,
    [rolId]
  );
  return rows.map((r) => r.codigo);
}

async function findByEmail(email) {
  const rows = await query(
    `SELECT u.*, r.nombre AS rol_nombre
     FROM usuarios u
     INNER JOIN roles r ON r.id = u.rol_id
     WHERE u.email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function authenticate(email, password) {
  const user = await findByEmail(email);
  if (!user || user.estado !== 'ACTIVO') return null;

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return null;

  const permisos = await getPermisosByRolId(user.rol_id);
  return pickUserSession(user, permisos);
}

async function getById(id) {
  const rows = await query(
    `SELECT u.*, r.nombre AS rol_nombre
     FROM usuarios u
     INNER JOIN roles r ON r.id = u.rol_id
     WHERE u.id = ? LIMIT 1`,
    [id]
  );
  const user = rows[0];
  if (!user) return null;

  const permisos = await getPermisosByRolId(user.rol_id);
  return pickUserSession(user, permisos);
}

module.exports = { authenticate, getById, findByEmail };
