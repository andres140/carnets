const { query } = require('../config/database');

const CARNET_SELECT = `
  c.id, c.codigo_unico, c.usuario_id, c.estado,
  c.fecha_expedicion, c.fecha_vencimiento, c.qr_token,
  c.foto_url, c.nombre_completo, c.documento, c.tipo_documento,
  c.tipo_usuario, c.centro_nombre, c.regional_nombre, c.dependencia_nombre,
  c.pdf_url, c.pdf_generado_at, c.pdf_hash, c.template_id, c.reimpresiones_count,
  c.emitido_por_id, c.created_at, c.updated_at,
  u.regional_id, u.centro_id, u.dependencia_id,
  ep.nombre_completo AS emitido_por_nombre
`;

const CARNET_FROM = `
  FROM carnets c
  INNER JOIN usuarios u ON u.id = c.usuario_id
  LEFT JOIN usuarios ep ON ep.id = c.emitido_por_id
`;

function buildWhereClause(filters) {
  const conditions = [];
  const params = [];

  if (filters.search) {
    conditions.push(
      '(c.codigo_unico LIKE ? OR c.nombre_completo LIKE ? OR c.documento LIKE ?)'
    );
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }
  if (filters.estado) {
    conditions.push('c.estado = ?');
    params.push(filters.estado);
  }
  if (filters.usuarioId) {
    conditions.push('c.usuario_id = ?');
    params.push(filters.usuarioId);
  }
  if (filters.regionalId) {
    conditions.push('u.regional_id = ?');
    params.push(filters.regionalId);
  }
  if (filters.centroId) {
    conditions.push('u.centro_id = ?');
    params.push(filters.centroId);
  }
  if (filters.tipoUsuario) {
    conditions.push('c.tipo_usuario = ?');
    params.push(filters.tipoUsuario);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}

async function count(filters = {}) {
  const { where, params } = buildWhereClause(filters);
  const rows = await query(
    `SELECT COUNT(*) AS total FROM carnets c INNER JOIN usuarios u ON u.id = c.usuario_id ${where}`,
    params
  );
  return rows[0]?.total || 0;
}

async function findMany(filters = {}, pagination = {}) {
  const { where, params } = buildWhereClause(filters);
  const limit = Math.max(1, parseInt(pagination.limit, 10) || 10);
  const offset = Math.max(0, parseInt(pagination.offset, 10) || 0);

  return query(
    `SELECT ${CARNET_SELECT} ${CARNET_FROM} ${where}
     ORDER BY c.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );
}

async function findById(id) {
  const rows = await query(
    `SELECT ${CARNET_SELECT} ${CARNET_FROM} WHERE c.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function findByQrToken(qrToken) {
  const rows = await query(
    `SELECT ${CARNET_SELECT} ${CARNET_FROM} WHERE c.qr_token = ? LIMIT 1`,
    [qrToken]
  );
  return rows[0] || null;
}

async function qrTokenExists(qrToken) {
  const rows = await query('SELECT id FROM carnets WHERE qr_token = ? LIMIT 1', [qrToken]);
  return rows.length > 0;
}

async function updateQrToken(id, qrToken) {
  await query('UPDATE carnets SET qr_token = ? WHERE id = ?', [qrToken, id]);
}

async function findActiveByUsuarioId(usuarioId) {
  const rows = await query(
    `SELECT id, codigo_unico, estado FROM carnets
     WHERE usuario_id = ? AND estado = 'ACTIVO' LIMIT 1`,
    [usuarioId]
  );
  return rows[0] || null;
}

async function codigoExists(codigo) {
  const rows = await query('SELECT id FROM carnets WHERE codigo_unico = ? LIMIT 1', [codigo]);
  return rows.length > 0;
}

async function countByCodigoPrefix(prefix) {
  const rows = await query(
    'SELECT COUNT(*) AS total FROM carnets WHERE codigo_unico LIKE ?',
    [`${prefix}%`]
  );
  return rows[0]?.total || 0;
}

async function getRegionalCodigo(regionalId) {
  if (!regionalId) return 'REG00';
  const rows = await query('SELECT codigo FROM regionales WHERE id = ? LIMIT 1', [regionalId]);
  return rows[0]?.codigo || 'REG00';
}

async function insertCarnet(data) {
  await query(
    `INSERT INTO carnets (
      id, codigo_unico, usuario_id, estado, fecha_expedicion, fecha_vencimiento,
      qr_token, foto_url, nombre_completo, documento, tipo_documento, tipo_usuario,
      centro_nombre, regional_nombre, dependencia_nombre, emitido_por_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    data
  );
}

async function updateCarnet(id, fields, params) {
  await query(`UPDATE carnets SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
}

async function setEstado(id, estado) {
  await query('UPDATE carnets SET estado = ? WHERE id = ?', [estado, id]);
}

async function insertHistorial(data) {
  await query(
    `INSERT INTO historial_carnets (id, carnet_id, estado_anterior, estado_nuevo, motivo, usuario_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    data
  );
}

async function findHistorial(carnetId) {
  return query(
    `SELECT h.id, h.estado_anterior, h.estado_nuevo, h.motivo, h.created_at,
            u.nombre_completo AS usuario_nombre
     FROM historial_carnets h
     INNER JOIN usuarios u ON u.id = h.usuario_id
     WHERE h.carnet_id = ?
     ORDER BY h.created_at DESC`,
    [carnetId]
  );
}

async function updatePdfMeta(id, { pdfUrl, pdfHash, pdfGeneradoAt, templateId }) {
  await query(
    `UPDATE carnets SET pdf_url = ?, pdf_hash = ?, pdf_generado_at = ?, template_id = ? WHERE id = ?`,
    [pdfUrl, pdfHash, pdfGeneradoAt, templateId, id]
  );
}

async function clearPdfCache(id) {
  await query(
    `UPDATE carnets SET pdf_url = NULL, pdf_hash = NULL, pdf_generado_at = NULL WHERE id = ?`,
    [id]
  );
}

async function incrementReimpresiones(id) {
  await query('UPDATE carnets SET reimpresiones_count = reimpresiones_count + 1 WHERE id = ?', [id]);
}

module.exports = {
  count,
  findMany,
  findById,
  findByQrToken,
  qrTokenExists,
  updateQrToken,
  findActiveByUsuarioId,
  codigoExists,
  countByCodigoPrefix,
  getRegionalCodigo,
  insertCarnet,
  updateCarnet,
  setEstado,
  insertHistorial,
  findHistorial,
  updatePdfMeta,
  clearPdfCache,
  incrementReimpresiones,
};
