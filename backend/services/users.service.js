const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateId } = require('../utils/helpers');

const ROL_TO_TIPO = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  COORDINADOR: 'COORDINADOR',
  FUNCIONARIO: 'FUNCIONARIO',
  INSTRUCTOR: 'INSTRUCTOR',
  APRENDIZ: 'APRENDIZ',
  CONTRATISTA: 'CONTRATISTA',
};

const USER_SELECT = `
  u.id, u.email, u.documento, u.tipo_documento, u.nombre_completo,
  u.foto_url, u.telefono, u.estado, u.tipo_usuario,
  u.rol_id, u.regional_id, u.centro_id, u.dependencia_id,
  u.created_at, u.updated_at, u.deactivated_at,
  r.nombre AS rol_nombre,
  reg.nombre AS regional_nombre,
  c.nombre AS centro_nombre,
  d.nombre AS dependencia_nombre
`;

const USER_FROM = `
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.rol_id
  LEFT JOIN regionales reg ON reg.id = u.regional_id
  LEFT JOIN centros_formacion c ON c.id = u.centro_id
  LEFT JOIN dependencias d ON d.id = u.dependencia_id
`;

function splitNombreCompleto(nombreCompleto) {
  const parts = (nombreCompleto || '').trim().split(/\s+/);
  if (parts.length <= 1) {
    return { nombres: nombreCompleto || '', apellidos: '' };
  }
  return { nombres: parts[0], apellidos: parts.slice(1).join(' ') };
}

function formatUser(row) {
  if (!row) return null;
  const { nombres, apellidos } = splitNombreCompleto(row.nombre_completo);
  return {
    id: row.id,
    documento: row.documento,
    tipoDocumento: row.tipo_documento,
    nombres,
    apellidos,
    nombreCompleto: row.nombre_completo,
    email: row.email,
    telefono: row.telefono,
    fotoUrl: row.foto_url,
    estado: row.estado,
    tipoUsuario: row.tipo_usuario,
    rolId: row.rol_id,
    rolNombre: row.rol_nombre,
    regionalId: row.regional_id,
    regionalNombre: row.regional_nombre,
    centroId: row.centro_id,
    centroNombre: row.centro_nombre,
    dependenciaId: row.dependencia_id,
    dependenciaNombre: row.dependencia_nombre,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deactivatedAt: row.deactivated_at,
  };
}

function buildWhereClause(filters) {
  const conditions = [];
  const params = [];

  if (filters.documento) {
    conditions.push('u.documento LIKE ?');
    params.push(`%${filters.documento}%`);
  }
  if (filters.nombre) {
    conditions.push('u.nombre_completo LIKE ?');
    params.push(`%${filters.nombre}%`);
  }
  if (filters.email) {
    conditions.push('u.email LIKE ?');
    params.push(`%${filters.email}%`);
  }
  if (filters.rolId) {
    conditions.push('u.rol_id = ?');
    params.push(filters.rolId);
  }
  if (filters.estado) {
    conditions.push('u.estado = ?');
    params.push(filters.estado);
  }
  if (filters.regionalId) {
    conditions.push('u.regional_id = ?');
    params.push(filters.regionalId);
  }
  if (filters.centroId) {
    conditions.push('u.centro_id = ?');
    params.push(filters.centroId);
  }
  if (filters.search) {
    conditions.push(
      '(u.documento LIKE ? OR u.nombre_completo LIKE ? OR u.email LIKE ?)'
    );
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { where, params };
}

async function list(filters = {}) {
  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 10));
  const offset = (page - 1) * limit;

  const { where, params } = buildWhereClause(filters);

  const countRows = await query(
    `SELECT COUNT(*) AS total FROM usuarios u ${where}`,
    params
  );
  const total = countRows[0]?.total || 0;

  const rows = await query(
    `SELECT ${USER_SELECT} ${USER_FROM} ${where}
     ORDER BY u.created_at DESC
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return {
    items: rows.map(formatUser),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function getById(id) {
  const rows = await query(
    `SELECT ${USER_SELECT} ${USER_FROM} WHERE u.id = ? LIMIT 1`,
    [id]
  );
  return formatUser(rows[0]);
}

async function emailExists(email, excludeId = null) {
  const sql = excludeId
    ? 'SELECT id FROM usuarios WHERE email = ? AND id != ? LIMIT 1'
    : 'SELECT id FROM usuarios WHERE email = ? LIMIT 1';
  const params = excludeId ? [email, excludeId] : [email];
  const rows = await query(sql, params);
  return rows.length > 0;
}

async function documentoExists(documento, excludeId = null) {
  const sql = excludeId
    ? 'SELECT id FROM usuarios WHERE documento = ? AND id != ? LIMIT 1'
    : 'SELECT id FROM usuarios WHERE documento = ? LIMIT 1';
  const params = excludeId ? [documento, excludeId] : [documento];
  const rows = await query(sql, params);
  return rows.length > 0;
}

async function getRolById(rolId) {
  const rows = await query('SELECT id, nombre FROM roles WHERE id = ? LIMIT 1', [rolId]);
  return rows[0] || null;
}

async function validateForeignKeys({ regionalId, centroId, dependenciaId }) {
  if (regionalId) {
    const rows = await query('SELECT id FROM regionales WHERE id = ? AND activo = 1 LIMIT 1', [
      regionalId,
    ]);
    if (!rows.length) {
      const err = new Error('Regional no válida');
      err.status = 400;
      throw err;
    }
  }
  if (centroId) {
    const rows = await query(
      'SELECT id, regional_id FROM centros_formacion WHERE id = ? AND activo = 1 LIMIT 1',
      [centroId]
    );
    if (!rows.length) {
      const err = new Error('Centro de formación no válido');
      err.status = 400;
      throw err;
    }
    if (regionalId && rows[0].regional_id !== regionalId) {
      const err = new Error('El centro no pertenece a la regional seleccionada');
      err.status = 400;
      throw err;
    }
  }
  if (dependenciaId) {
    const rows = await query(
      'SELECT id, centro_id FROM dependencias WHERE id = ? AND activo = 1 LIMIT 1',
      [dependenciaId]
    );
    if (!rows.length) {
      const err = new Error('Dependencia no válida');
      err.status = 400;
      throw err;
    }
    if (centroId && rows[0].centro_id !== centroId) {
      const err = new Error('La dependencia no pertenece al centro seleccionado');
      err.status = 400;
      throw err;
    }
  }
}

async function create(data) {
  const rol = await getRolById(data.rolId);
  if (!rol) {
    const err = new Error('Rol no válido');
    err.status = 400;
    throw err;
  }

  if (await emailExists(data.email)) {
    const err = new Error('El correo ya está registrado');
    err.status = 409;
    throw err;
  }
  if (await documentoExists(data.documento)) {
    const err = new Error('El documento ya está registrado');
    err.status = 409;
    throw err;
  }

  await validateForeignKeys(data);

  const id = generateId();
  const nombreCompleto = `${data.nombres.trim()} ${data.apellidos.trim()}`.trim();
  const passwordHash = await bcrypt.hash(data.password, 12);
  const tipoUsuario = ROL_TO_TIPO[rol.nombre] || 'FUNCIONARIO';
  const estado = data.estado || 'ACTIVO';

  await query(
    `INSERT INTO usuarios (
      id, email, password_hash, rol_id, tipo_usuario, estado,
      documento, tipo_documento, nombre_completo, foto_url,
      regional_id, centro_id, dependencia_id, telefono
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.email.trim().toLowerCase(),
      passwordHash,
      data.rolId,
      tipoUsuario,
      estado,
      data.documento.trim(),
      data.tipoDocumento || 'CC',
      nombreCompleto,
      data.fotoUrl || null,
      data.regionalId || null,
      data.centroId || null,
      data.dependenciaId || null,
      data.telefono?.trim() || null,
    ]
  );

  return getById(id);
}

async function update(id, data) {
  const existing = await getById(id);
  if (!existing) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }

  if (data.email && (await emailExists(data.email, id))) {
    const err = new Error('El correo ya está registrado');
    err.status = 409;
    throw err;
  }
  if (data.documento && (await documentoExists(data.documento, id))) {
    const err = new Error('El documento ya está registrado');
    err.status = 409;
    throw err;
  }

  const rolId = data.rolId || existing.rolId;
  const rol = await getRolById(rolId);
  if (!rol) {
    const err = new Error('Rol no válido');
    err.status = 400;
    throw err;
  }

  await validateForeignKeys({
    regionalId: data.regionalId !== undefined ? data.regionalId : existing.regionalId,
    centroId: data.centroId !== undefined ? data.centroId : existing.centroId,
    dependenciaId:
      data.dependenciaId !== undefined ? data.dependenciaId : existing.dependenciaId,
  });

  const nombres = data.nombres !== undefined ? data.nombres : existing.nombres;
  const apellidos = data.apellidos !== undefined ? data.apellidos : existing.apellidos;
  const nombreCompleto = `${nombres.trim()} ${apellidos.trim()}`.trim();
  const tipoUsuario = ROL_TO_TIPO[rol.nombre] || existing.tipoUsuario;

  const fields = [
    'email = ?',
    'documento = ?',
    'tipo_documento = ?',
    'nombre_completo = ?',
    'rol_id = ?',
    'tipo_usuario = ?',
    'telefono = ?',
    'regional_id = ?',
    'centro_id = ?',
    'dependencia_id = ?',
  ];
  const params = [
    (data.email || existing.email).trim().toLowerCase(),
    (data.documento || existing.documento).trim(),
    data.tipoDocumento || existing.tipoDocumento,
    nombreCompleto,
    rolId,
    tipoUsuario,
    data.telefono !== undefined ? data.telefono?.trim() || null : existing.telefono,
    data.regionalId !== undefined ? data.regionalId || null : existing.regionalId,
    data.centroId !== undefined ? data.centroId || null : existing.centroId,
    data.dependenciaId !== undefined ? data.dependenciaId || null : existing.dependenciaId,
  ];

  if (data.estado) {
    fields.push('estado = ?');
    params.push(data.estado);
    if (data.estado === 'INACTIVO') {
      fields.push('deactivated_at = NOW()');
    } else if (data.estado === 'ACTIVO') {
      fields.push('deactivated_at = NULL');
    }
  }

  if (data.fotoUrl !== undefined) {
    fields.push('foto_url = ?');
    params.push(data.fotoUrl);
  }

  if (data.password) {
    fields.push('password_hash = ?');
    params.push(await bcrypt.hash(data.password, 12));
  }

  params.push(id);
  await query(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`, params);

  return getById(id);
}

async function deactivate(id) {
  const existing = await getById(id);
  if (!existing) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  if (existing.estado === 'INACTIVO') {
    const err = new Error('El usuario ya está inactivo');
    err.status = 400;
    throw err;
  }

  await query(
    `UPDATE usuarios SET estado = 'INACTIVO', deactivated_at = NOW() WHERE id = ?`,
    [id]
  );
  return getById(id);
}

async function reactivate(id) {
  const existing = await getById(id);
  if (!existing) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  if (existing.estado === 'ACTIVO') {
    const err = new Error('El usuario ya está activo');
    err.status = 400;
    throw err;
  }

  await query(
    `UPDATE usuarios SET estado = 'ACTIVO', deactivated_at = NULL WHERE id = ?`,
    [id]
  );
  return getById(id);
}

module.exports = {
  list,
  getById,
  create,
  update,
  deactivate,
  reactivate,
  formatUser,
};
