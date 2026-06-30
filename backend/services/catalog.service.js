const { query } = require('../config/database');

async function getRoles() {
  return query(
    'SELECT id, nombre, descripcion FROM roles WHERE activo = 1 ORDER BY nombre'
  );
}

async function getRegionales() {
  return query(
    'SELECT id, codigo, nombre FROM regionales WHERE activo = 1 ORDER BY nombre'
  );
}

async function getCentros(regionalId) {
  if (!regionalId) return [];
  return query(
    `SELECT id, codigo, nombre, regional_id
     FROM centros_formacion
     WHERE activo = 1 AND regional_id = ?
     ORDER BY nombre`,
    [regionalId]
  );
}

async function getDependencias(centroId) {
  if (!centroId) return [];
  return query(
    `SELECT id, nombre, centro_id
     FROM dependencias
     WHERE activo = 1 AND centro_id = ?
     ORDER BY nombre`,
    [centroId]
  );
}

module.exports = { getRoles, getRegionales, getCentros, getDependencias };
