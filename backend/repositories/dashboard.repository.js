const { query } = require('../config/database');
const { ROLES } = require('../constants');

/**
 * Construye filtro SQL por rol sobre alias de tabla usuarios.
 */
function buildUserScope(actor, alias = 'u') {
  const params = [];
  const parts = [];

  if (!actor) return { clause: '', params };

  if (actor.tipoUsuario === ROLES.APRENDIZ || actor.tipoUsuario === ROLES.CONTRATISTA) {
    parts.push(`${alias}.id = ?`);
    params.push(actor.id);
  } else if (actor.tipoUsuario === ROLES.COORDINADOR && actor.regionalId) {
    parts.push(`${alias}.regional_id = ?`);
    params.push(actor.regionalId);
  } else if (actor.tipoUsuario === ROLES.INSTRUCTOR && actor.centroId) {
    parts.push(`${alias}.centro_id = ?`);
    params.push(actor.centroId);
  }

  return {
    clause: parts.length ? ` AND ${parts.join(' AND ')}` : '',
    params,
  };
}

function carnetJoinScope(actor) {
  const scope = buildUserScope(actor, 'u');
  return {
    join: 'INNER JOIN usuarios u ON u.id = c.usuario_id',
    clause: scope.clause,
    params: scope.params,
  };
}

async function getUsuariosResumen(actor) {
  const scope = buildUserScope(actor, 'u');
  const rows = await query(
    `SELECT
       COUNT(*) AS total,
       SUM(CASE WHEN u.estado = 'ACTIVO' THEN 1 ELSE 0 END) AS activos,
       SUM(CASE WHEN u.estado IN ('INACTIVO','SUSPENDIDO') THEN 1 ELSE 0 END) AS inactivos,
       SUM(CASE WHEN u.estado = 'ACTIVO' AND (u.foto_url IS NULL OR u.foto_url = '') THEN 1 ELSE 0 END) AS sinFoto
     FROM usuarios u
     WHERE 1=1 ${scope.clause}`,
    scope.params
  );
  return rows[0] || { total: 0, activos: 0, inactivos: 0, sinFoto: 0 };
}

async function getCarnetsResumen(actor) {
  const { join, clause, params } = carnetJoinScope(actor);
  const rows = await query(
    `SELECT
       SUM(CASE WHEN c.estado = 'ACTIVO' THEN 1 ELSE 0 END) AS activos,
       SUM(CASE WHEN c.estado = 'VENCIDO' THEN 1 ELSE 0 END) AS vencidos,
       SUM(CASE WHEN c.estado = 'SUSPENDIDO' THEN 1 ELSE 0 END) AS suspendidos,
       SUM(CASE WHEN c.estado = 'REVOCADO' THEN 1 ELSE 0 END) AS revocados,
       SUM(CASE WHEN DATE(c.created_at) = CURDATE() THEN 1 ELSE 0 END) AS emitidosHoy,
       SUM(CASE WHEN YEAR(c.created_at) = YEAR(CURDATE()) AND MONTH(c.created_at) = MONTH(CURDATE()) THEN 1 ELSE 0 END) AS emitidosMes,
       SUM(CASE WHEN c.estado = 'ACTIVO' AND c.fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS proximosVencer
     FROM carnets c ${join}
     WHERE 1=1 ${clause}`,
    params
  );
  return rows[0] || {};
}

async function getValidacionesHoy(actor) {
  const { join, clause, params } = carnetJoinScope(actor);
  const rows = await query(
    `SELECT COUNT(*) AS total
     FROM validaciones_qr v
     INNER JOIN carnets c ON c.id = v.carnet_id
     ${join}
     WHERE DATE(v.created_at) = CURDATE() ${clause}`,
    params
  );
  return rows[0]?.total || 0;
}

async function getCarnetsPorMes(actor, months = 12) {
  const { join, clause, params } = carnetJoinScope(actor);
  const safeMonths = Math.min(24, Math.max(3, parseInt(months, 10) || 12));
  return query(
    `SELECT DATE_FORMAT(c.created_at, '%Y-%m') AS periodo,
            DATE_FORMAT(c.created_at, '%b %Y') AS etiqueta,
            COUNT(*) AS total
     FROM carnets c ${join}
     WHERE c.created_at >= DATE_SUB(CURDATE(), INTERVAL ${safeMonths} MONTH) ${clause}
     GROUP BY periodo, etiqueta
     ORDER BY periodo ASC`,
    params
  );
}

async function getUsuariosPorTipo(actor) {
  const scope = buildUserScope(actor, 'u');
  return query(
    `SELECT u.tipo_usuario AS tipo, COUNT(*) AS total
     FROM usuarios u
     WHERE u.estado = 'ACTIVO' ${scope.clause}
     GROUP BY u.tipo_usuario
     ORDER BY total DESC`,
    scope.params
  );
}

async function getUsuariosPorRegional(actor) {
  const scope = buildUserScope(actor, 'u');
  return query(
    `SELECT COALESCE(r.nombre, 'Sin regional') AS nombre, COUNT(*) AS total
     FROM usuarios u
     LEFT JOIN regionales r ON r.id = u.regional_id
     WHERE u.estado = 'ACTIVO' ${scope.clause}
     GROUP BY r.id, r.nombre
     ORDER BY total DESC
     LIMIT 12`,
    scope.params
  );
}

async function getCarnetsPorEstado(actor) {
  const { join, clause, params } = carnetJoinScope(actor);
  return query(
    `SELECT c.estado, COUNT(*) AS total
     FROM carnets c ${join}
     WHERE 1=1 ${clause}
     GROUP BY c.estado
     ORDER BY total DESC`,
    params
  );
}

async function getValidacionesPorDia(actor, days = 14) {
  const { join, clause, params } = carnetJoinScope(actor);
  const safeDays = Math.min(30, Math.max(7, parseInt(days, 10) || 14));
  return query(
    `SELECT DATE(v.created_at) AS fecha,
            COUNT(*) AS total,
            SUM(CASE WHEN v.resultado = 'VALIDO' THEN 1 ELSE 0 END) AS validas
     FROM validaciones_qr v
     INNER JOIN carnets c ON c.id = v.carnet_id
     ${join}
     WHERE v.created_at >= DATE_SUB(CURDATE(), INTERVAL ${safeDays} DAY) ${clause}
     GROUP BY DATE(v.created_at)
     ORDER BY fecha ASC`,
    params
  );
}

async function getEmisionesPorCentro(actor, limit = 10) {
  const { join, clause, params } = carnetJoinScope(actor);
  const safeLimit = Math.min(20, Math.max(5, parseInt(limit, 10) || 10));
  return query(
    `SELECT COALESCE(c.centro_nombre, 'Sin centro') AS nombre, COUNT(*) AS total
     FROM carnets c ${join}
     WHERE 1=1 ${clause}
     GROUP BY c.centro_nombre
     ORDER BY total DESC
     LIMIT ${safeLimit}`,
    params
  );
}

function buildAuditoriaScope(actor) {
  if (!actor) return { clause: '', params: [] };

  if (actor.tipoUsuario === ROLES.APRENDIZ || actor.tipoUsuario === ROLES.CONTRATISTA) {
    return { clause: ' AND a.usuario_id = ?', params: [actor.id] };
  }

  if (actor.tipoUsuario === ROLES.COORDINADOR && actor.regionalId) {
    return {
      clause: ` AND (
        ua.regional_id = ?
        OR (a.entidad = 'Carnet' AND EXISTS (
          SELECT 1 FROM carnets c2 INNER JOIN usuarios u2 ON u2.id = c2.usuario_id
          WHERE c2.id = a.entidad_id AND u2.regional_id = ?
        ))
        OR (a.entidad = 'Usuario' AND EXISTS (
          SELECT 1 FROM usuarios u3 WHERE u3.id = a.entidad_id AND u3.regional_id = ?
        ))
      )`,
      params: [actor.regionalId, actor.regionalId, actor.regionalId],
    };
  }

  if (actor.tipoUsuario === ROLES.INSTRUCTOR && actor.centroId) {
    return {
      clause: ` AND (
        ua.centro_id = ?
        OR (a.entidad = 'Carnet' AND EXISTS (
          SELECT 1 FROM carnets c2 INNER JOIN usuarios u2 ON u2.id = c2.usuario_id
          WHERE c2.id = a.entidad_id AND u2.centro_id = ?
        ))
      )`,
      params: [actor.centroId, actor.centroId],
    };
  }

  return { clause: '', params: [] };
}

async function getActividadReciente(actor, limit = 20) {
  const auditScope = buildAuditoriaScope(actor);
  const carnetScope = carnetJoinScope(actor);
  const safeLimit = Math.min(30, Math.max(5, parseInt(limit, 10) || 20));

  const rows = await query(
    `(SELECT a.created_at, a.accion AS tipo, COALESCE(ua.nombre_completo, 'Sistema') AS usuario,
             a.entidad, a.entidad_id AS referenciaId, NULL AS detalle
      FROM auditoria a
      LEFT JOIN usuarios ua ON ua.id = a.usuario_id
      WHERE 1=1 ${auditScope.clause})
     UNION ALL
     (SELECT v.created_at, CONCAT('VALIDAR_QR_', v.resultado) AS tipo,
             COALESCE(uv.nombre_completo, 'Público') AS usuario,
             'ValidacionQR' AS entidad, v.carnet_id AS referenciaId, c.codigo_unico AS detalle
      FROM validaciones_qr v
      INNER JOIN carnets c ON c.id = v.carnet_id
      ${carnetScope.join}
      LEFT JOIN usuarios uv ON uv.id = v.usuario_id
      WHERE 1=1 ${carnetScope.clause})
     ORDER BY created_at DESC
     LIMIT ${safeLimit}`,
    [...auditScope.params, ...carnetScope.params]
  );

  return rows;
}

async function getAlertas(actor) {
  const { join, clause, params } = carnetJoinScope(actor);
  const userScope = buildUserScope(actor, 'u');

  const [proximos, sinFoto, suspendidos] = await Promise.all([
    query(
      `SELECT c.id, c.codigo_unico, c.nombre_completo, c.fecha_vencimiento
       FROM carnets c ${join}
       WHERE c.estado = 'ACTIVO'
         AND c.fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
         ${clause}
       ORDER BY c.fecha_vencimiento ASC
       LIMIT 8`,
      params
    ),
    query(
      `SELECT u.id, u.nombre_completo, u.email
       FROM usuarios u
       WHERE u.estado = 'ACTIVO' AND (u.foto_url IS NULL OR u.foto_url = '')
       ${userScope.clause}
       ORDER BY u.nombre_completo ASC
       LIMIT 8`,
      userScope.params
    ),
    query(
      `SELECT c.id, c.codigo_unico, c.nombre_completo
       FROM carnets c ${join}
       WHERE c.estado = 'SUSPENDIDO' ${clause}
       ORDER BY c.updated_at DESC
       LIMIT 8`,
      params
    ),
  ]);

  return { proximosVencer: proximos, usuariosSinFoto: sinFoto, carnetsSuspendidos: suspendidos };
}

module.exports = {
  buildUserScope,
  getUsuariosResumen,
  getCarnetsResumen,
  getValidacionesHoy,
  getCarnetsPorMes,
  getUsuariosPorTipo,
  getUsuariosPorRegional,
  getCarnetsPorEstado,
  getValidacionesPorDia,
  getEmisionesPorCentro,
  getActividadReciente,
  getAlertas,
};
