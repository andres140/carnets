/**
 * Consultas SQL para reportes institucionales — datos en tiempo real.
 */
const { query } = require('../config/database');
const { buildUserScope } = require('./dashboard.repository');
const { REPORT } = require('../constants');

function buildUsuarioWhere(filters, actor, alias = 'u') {
  const scope = buildUserScope(actor, alias);
  const conditions = ['1=1'];
  const params = [...scope.params];

  if (scope.clause) {
    conditions.push(scope.clause.replace(/^\s*AND\s*/i, ''));
  }

  if (filters.soloActivos) conditions.push(`${alias}.estado = 'ACTIVO'`);
  if (filters.soloInactivos) conditions.push(`${alias}.estado IN ('INACTIVO','SUSPENDIDO')`);
  if (filters.estado && !filters.soloActivos && !filters.soloInactivos) {
    conditions.push(`${alias}.estado = ?`);
    params.push(filters.estado);
  }
  if (filters.nombre) {
    conditions.push(`${alias}.nombre_completo LIKE ?`);
    params.push(`%${filters.nombre}%`);
  }
  if (filters.documento) {
    conditions.push(`${alias}.documento LIKE ?`);
    params.push(`%${filters.documento}%`);
  }
  if (filters.email) {
    conditions.push(`${alias}.email LIKE ?`);
    params.push(`%${filters.email}%`);
  }
  if (filters.rolId) {
    conditions.push(`${alias}.rol_id = ?`);
    params.push(filters.rolId);
  }
  if (filters.tipoUsuario) {
    conditions.push(`${alias}.tipo_usuario = ?`);
    params.push(filters.tipoUsuario);
  }
  if (filters.regionalId) {
    conditions.push(`${alias}.regional_id = ?`);
    params.push(filters.regionalId);
  }
  if (filters.centroId) {
    conditions.push(`${alias}.centro_id = ?`);
    params.push(filters.centroId);
  }
  if (filters.dependenciaId) {
    conditions.push(`${alias}.dependencia_id = ?`);
    params.push(filters.dependenciaId);
  }
  if (filters.fechaRegistroDesde) {
    conditions.push(`DATE(${alias}.created_at) >= ?`);
    params.push(filters.fechaRegistroDesde);
  }
  if (filters.fechaRegistroHasta) {
    conditions.push(`DATE(${alias}.created_at) <= ?`);
    params.push(filters.fechaRegistroHasta);
  }
  if (filters.search) {
    conditions.push(
      `(${alias}.documento LIKE ? OR ${alias}.nombre_completo LIKE ? OR ${alias}.email LIKE ?)`
    );
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  return { where: conditions.join(' AND '), params };
}

function buildCarnetWhere(filters, actor) {
  const scope = buildUserScope(actor, 'u');
  const conditions = ['1=1'];
  const params = [...scope.params];

  if (scope.clause) {
    conditions.push(scope.clause.replace(/^\s*AND\s*/i, ''));
  }

  if (filters.estado) {
    conditions.push('c.estado = ?');
    params.push(filters.estado);
  }
  if (filters.proximosVencer) {
    conditions.push(
      `c.estado = 'ACTIVO' AND c.fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ${REPORT.PROXIMOS_VENCER_DIAS} DAY)`
    );
  }
  if (filters.nombre) {
    conditions.push('c.nombre_completo LIKE ?');
    params.push(`%${filters.nombre}%`);
  }
  if (filters.documento) {
    conditions.push('c.documento LIKE ?');
    params.push(`%${filters.documento}%`);
  }
  if (filters.email) {
    conditions.push('u.email LIKE ?');
    params.push(`%${filters.email}%`);
  }
  if (filters.tipoUsuario) {
    conditions.push('c.tipo_usuario = ?');
    params.push(filters.tipoUsuario);
  }
  if (filters.rolId) {
    conditions.push('u.rol_id = ?');
    params.push(filters.rolId);
  }
  if (filters.regionalId) {
    conditions.push('u.regional_id = ?');
    params.push(filters.regionalId);
  }
  if (filters.centroId) {
    conditions.push('u.centro_id = ?');
    params.push(filters.centroId);
  }
  if (filters.dependenciaId) {
    conditions.push('u.dependencia_id = ?');
    params.push(filters.dependenciaId);
  }
  if (filters.fechaExpedicionDesde) {
    conditions.push('DATE(c.fecha_expedicion) >= ?');
    params.push(filters.fechaExpedicionDesde);
  }
  if (filters.fechaExpedicionHasta) {
    conditions.push('DATE(c.fecha_expedicion) <= ?');
    params.push(filters.fechaExpedicionHasta);
  }
  if (filters.fechaVencimientoDesde) {
    conditions.push('DATE(c.fecha_vencimiento) >= ?');
    params.push(filters.fechaVencimientoDesde);
  }
  if (filters.fechaVencimientoHasta) {
    conditions.push('DATE(c.fecha_vencimiento) <= ?');
    params.push(filters.fechaVencimientoHasta);
  }
  if (filters.fechaDesde) {
    conditions.push('DATE(c.created_at) >= ?');
    params.push(filters.fechaDesde);
  }
  if (filters.fechaHasta) {
    conditions.push('DATE(c.created_at) <= ?');
    params.push(filters.fechaHasta);
  }
  if (filters.search) {
    conditions.push('(c.codigo_unico LIKE ? OR c.documento LIKE ? OR c.nombre_completo LIKE ?)');
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  return { where: conditions.join(' AND '), params };
}

const CARNET_FROM = `
  FROM carnets c
  INNER JOIN usuarios u ON u.id = c.usuario_id
`;

const USUARIO_SELECT = `
  u.id, u.email, u.documento, u.tipo_documento, u.nombre_completo,
  u.estado, u.tipo_usuario, u.telefono, u.created_at,
  r.nombre AS rol_nombre,
  reg.nombre AS regional_nombre,
  cen.nombre AS centro_nombre,
  dep.nombre AS dependencia_nombre
`;

const USUARIO_FROM = `
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.rol_id
  LEFT JOIN regionales reg ON reg.id = u.regional_id
  LEFT JOIN centros_formacion cen ON cen.id = u.centro_id
  LEFT JOIN dependencias dep ON dep.id = u.dependencia_id
`;

async function countUsuarios(filters, actor) {
  const { where, params } = buildUsuarioWhere(filters, actor);
  const rows = await query(`SELECT COUNT(*) AS total ${USUARIO_FROM} WHERE ${where}`, params);
  return Number(rows[0]?.total) || 0;
}

async function findUsuarios(filters, actor, { limit, offset }) {
  const { where, params } = buildUsuarioWhere(filters, actor);
  const safeLimit = Math.min(REPORT.MAX_PAGE_LIMIT, Math.max(1, parseInt(limit, 10) || 20));
  const safeOffset = Math.max(0, parseInt(offset, 10) || 0);

  return query(
    `SELECT ${USUARIO_SELECT} ${USUARIO_FROM}
     WHERE ${where}
     ORDER BY u.created_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );
}

async function aggregateUsuarios(filters, actor) {
  const { where, params } = buildUsuarioWhere(filters, actor);

  const [porEstado, porTipo, porRegional, porRol] = await Promise.all([
    query(
      `SELECT u.estado, COUNT(*) AS total ${USUARIO_FROM} WHERE ${where} GROUP BY u.estado`,
      params
    ),
    query(
      `SELECT u.tipo_usuario AS tipo, COUNT(*) AS total ${USUARIO_FROM} WHERE ${where} GROUP BY u.tipo_usuario ORDER BY total DESC`,
      params
    ),
    query(
      `SELECT COALESCE(reg.nombre, 'Sin regional') AS nombre, COUNT(*) AS total
       ${USUARIO_FROM} WHERE ${where}
       GROUP BY reg.id, reg.nombre ORDER BY total DESC LIMIT 15`,
      params
    ),
    query(
      `SELECT r.nombre AS rol, COUNT(*) AS total
       ${USUARIO_FROM} WHERE ${where}
       GROUP BY r.id, r.nombre ORDER BY total DESC`,
      params
    ),
  ]);

  return { porEstado, porTipo, porRegional, porRol };
}

async function countCarnets(filters, actor) {
  const { where, params } = buildCarnetWhere(filters, actor);
  const rows = await query(`SELECT COUNT(*) AS total ${CARNET_FROM} WHERE ${where}`, params);
  return Number(rows[0]?.total) || 0;
}

async function findCarnets(filters, actor, { limit, offset }) {
  const { where, params } = buildCarnetWhere(filters, actor);
  const safeLimit = Math.min(REPORT.MAX_PAGE_LIMIT, Math.max(1, parseInt(limit, 10) || 20));
  const safeOffset = Math.max(0, parseInt(offset, 10) || 0);

  return query(
    `SELECT c.id, c.codigo_unico, c.estado, c.tipo_usuario, c.documento, c.nombre_completo,
            c.regional_nombre, c.centro_nombre, c.dependencia_nombre,
            c.fecha_expedicion, c.fecha_vencimiento, c.created_at,
            u.email
     ${CARNET_FROM}
     WHERE ${where}
     ORDER BY c.created_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );
}

async function aggregateCarnets(filters, actor) {
  const { where, params } = buildCarnetWhere(filters, actor);

  const [porEstado, porRegional, porCentro, porMes] = await Promise.all([
    query(
      `SELECT c.estado, COUNT(*) AS total ${CARNET_FROM} WHERE ${where} GROUP BY c.estado`,
      params
    ),
    query(
      `SELECT COALESCE(c.regional_nombre, 'Sin regional') AS nombre, COUNT(*) AS total
       ${CARNET_FROM} WHERE ${where}
       GROUP BY c.regional_nombre ORDER BY total DESC LIMIT 15`,
      params
    ),
    query(
      `SELECT COALESCE(c.centro_nombre, 'Sin centro') AS nombre, COUNT(*) AS total
       ${CARNET_FROM} WHERE ${where}
       GROUP BY c.centro_nombre ORDER BY total DESC LIMIT 15`,
      params
    ),
    query(
      `SELECT DATE_FORMAT(c.created_at, '%Y-%m') AS periodo,
              DATE_FORMAT(c.created_at, '%b %Y') AS etiqueta,
              COUNT(*) AS total
       ${CARNET_FROM}
       WHERE ${where} AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY periodo, etiqueta ORDER BY periodo ASC`,
      params
    ),
  ]);

  return { porEstado, porRegional, porCentro, porMes };
}

function buildValidacionWhere(filters, actor) {
  const scope = buildUserScope(actor, 'u');
  const conditions = ['1=1'];
  const params = [...scope.params];

  if (scope.clause) {
    conditions.push(scope.clause.replace(/^\s*AND\s*/i, ''));
  }

  if (filters.fechaDesde) {
    conditions.push('DATE(v.created_at) >= ?');
    params.push(filters.fechaDesde);
  }
  if (filters.fechaHasta) {
    conditions.push('DATE(v.created_at) <= ?');
    params.push(filters.fechaHasta);
  }
  if (filters.resultado === 'EXITOSAS') {
    conditions.push("v.resultado = 'VALIDO'");
  } else if (filters.resultado === 'FALLIDAS') {
    conditions.push("v.resultado != 'VALIDO'");
  } else if (filters.resultado) {
    conditions.push('v.resultado = ?');
    params.push(filters.resultado);
  }
  if (filters.regionalId) {
    conditions.push('u.regional_id = ?');
    params.push(filters.regionalId);
  }
  if (filters.centroId) {
    conditions.push('u.centro_id = ?');
    params.push(filters.centroId);
  }
  if (filters.documento) {
    conditions.push('c.documento LIKE ?');
    params.push(`%${filters.documento}%`);
  }
  if (filters.nombre) {
    conditions.push('c.nombre_completo LIKE ?');
    params.push(`%${filters.nombre}%`);
  }

  return { where: conditions.join(' AND '), params };
}

const VALIDACION_FROM = `
  FROM validaciones_qr v
  LEFT JOIN carnets c ON c.id = v.carnet_id
  LEFT JOIN usuarios u ON u.id = c.usuario_id
`;

async function countValidaciones(filters, actor) {
  const { where, params } = buildValidacionWhere(filters, actor);
  const rows = await query(`SELECT COUNT(*) AS total ${VALIDACION_FROM} WHERE ${where}`, params);
  return Number(rows[0]?.total) || 0;
}

async function findValidaciones(filters, actor, { limit, offset }) {
  const { where, params } = buildValidacionWhere(filters, actor);
  const safeLimit = Math.min(REPORT.MAX_PAGE_LIMIT, Math.max(1, parseInt(limit, 10) || 20));
  const safeOffset = Math.max(0, parseInt(offset, 10) || 0);

  return query(
    `SELECT v.id, v.resultado, v.ip, v.created_at,
            c.codigo_unico, c.nombre_completo, c.documento,
            c.regional_nombre, c.centro_nombre
     ${VALIDACION_FROM}
     WHERE ${where}
     ORDER BY v.created_at DESC
     LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    params
  );
}

async function aggregateValidaciones(filters, actor) {
  const { where, params } = buildValidacionWhere(filters, actor);

  const [porResultado, porFecha, porRegional, masConsultados, porHora] = await Promise.all([
    query(
      `SELECT v.resultado, COUNT(*) AS total ${VALIDACION_FROM} WHERE ${where} GROUP BY v.resultado`,
      params
    ),
    query(
      `SELECT DATE(v.created_at) AS fecha, COUNT(*) AS total,
              SUM(CASE WHEN v.resultado = 'VALIDO' THEN 1 ELSE 0 END) AS exitosas,
              SUM(CASE WHEN v.resultado != 'VALIDO' THEN 1 ELSE 0 END) AS fallidas
       ${VALIDACION_FROM} WHERE ${where}
         AND v.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(v.created_at) ORDER BY fecha ASC`,
      params
    ),
    query(
      `SELECT COALESCE(c.regional_nombre, 'Sin regional') AS nombre, COUNT(*) AS total
       ${VALIDACION_FROM} WHERE ${where}
       GROUP BY c.regional_nombre ORDER BY total DESC LIMIT 12`,
      params
    ),
    query(
      `SELECT c.codigo_unico AS codigo, c.nombre_completo AS nombre, COUNT(*) AS total
       ${VALIDACION_FROM} WHERE ${where} AND c.id IS NOT NULL
       GROUP BY c.id, c.codigo_unico, c.nombre_completo
       ORDER BY total DESC LIMIT 10`,
      params
    ),
    query(
      `SELECT HOUR(v.created_at) AS hora, COUNT(*) AS total
       ${VALIDACION_FROM} WHERE ${where}
         AND v.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY HOUR(v.created_at) ORDER BY hora ASC`,
      params
    ),
  ]);

  return { porResultado, porFecha, porRegional, masConsultados, porHora };
}

module.exports = {
  countUsuarios,
  findUsuarios,
  aggregateUsuarios,
  countCarnets,
  findCarnets,
  aggregateCarnets,
  countValidaciones,
  findValidaciones,
  aggregateValidaciones,
};
