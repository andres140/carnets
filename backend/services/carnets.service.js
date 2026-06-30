const carnetsRepository = require('../repositories/carnets.repository');
const usersRepository = require('../repositories/users.repository');
const { generateId } = require('../utils/helpers');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');
const { applyCarnetListScope, canAccessCarnet, canAccessUser } = require('../utils/permissions');
const { createAppError } = require('../utils/errors');
const { generateCodigoUnico, generateUniqueQrToken } = require('../utils/carnetCode');
const qrService = require('./qr.service');
const {
  assertTransition,
  resolveEstado,
  addYears,
  formatDateOnly,
  parseDateInput,
  assertFutureOrEqualDate,
} = require('../utils/carnetStates');
const { CARNET } = require('../constants');

function invalidatePdfCache(carnetId) {
  const carnetPdfService = require('./carnetPdf.service');
  return carnetPdfService.invalidateCache(carnetId);
}

function formatCarnet(row) {
  if (!row) return null;
  const item = {
    id: row.id,
    codigoUnico: row.codigo_unico,
    usuarioId: row.usuario_id,
    estado: row.estado,
    fechaExpedicion: row.fecha_expedicion,
    fechaVencimiento: row.fecha_vencimiento,
    qrToken: row.qr_token,
    fotoUrl: row.foto_url,
    nombreCompleto: row.nombre_completo,
    documento: row.documento,
    tipoDocumento: row.tipo_documento,
    tipoUsuario: row.tipo_usuario,
    centroNombre: row.centro_nombre,
    regionalNombre: row.regional_nombre,
    dependenciaNombre: row.dependencia_nombre,
    pdfUrl: row.pdf_url,
    pdfGeneradoAt: row.pdf_generado_at,
    pdfHash: row.pdf_hash,
    templateId: row.template_id,
    reimpresionesCount: row.reimpresiones_count,
    emitidoPorId: row.emitido_por_id,
    emitidoPorNombre: row.emitido_por_nombre,
    regionalId: row.regional_id,
    centroId: row.centro_id,
    dependenciaId: row.dependencia_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  item.estadoResuelto = resolveEstado(item);
  return item;
}

function formatHistorial(row) {
  return {
    id: row.id,
    estadoAnterior: row.estado_anterior,
    estadoNuevo: row.estado_nuevo,
    motivo: row.motivo,
    usuarioNombre: row.usuario_nombre,
    createdAt: row.created_at,
  };
}

async function syncResolvedEstado(carnet) {
  const resolved = resolveEstado(carnet);
  if (resolved === 'VENCIDO' && carnet.estado === 'ACTIVO') {
    await carnetsRepository.setEstado(carnet.id, 'VENCIDO');
    return { ...carnet, estado: 'VENCIDO', estadoResuelto: 'VENCIDO' };
  }
  return { ...carnet, estadoResuelto: resolved };
}

function assertCanAccess(actor, carnet) {
  if (!canAccessCarnet(actor, carnet)) {
    throw createAppError('Carné no encontrado', 404);
  }
}

async function buildSnapshotFromUser(usuarioId, actor) {
  const row = await usersRepository.findById(usuarioId);
  if (!row) throw createAppError('Usuario no encontrado', 404);

  const user = {
    id: row.id,
    estado: row.estado,
    nombreCompleto: row.nombre_completo,
    documento: row.documento,
    tipoDocumento: row.tipo_documento,
    tipoUsuario: row.tipo_usuario,
    fotoUrl: row.foto_url,
    regionalId: row.regional_id,
    centroId: row.centro_id,
    dependenciaId: row.dependencia_id,
    regionalNombre: row.regional_nombre,
    centroNombre: row.centro_nombre,
    dependenciaNombre: row.dependencia_nombre,
  };

  if (!canAccessUser(actor, user)) {
    throw createAppError('Usuario no encontrado', 404);
  }
  if (user.estado !== 'ACTIVO') {
    throw createAppError('El usuario debe estar activo para emitir un carné', 400);
  }
  if (!user.nombreCompleto?.trim() || !user.documento?.trim()) {
    throw createAppError('El usuario no tiene datos obligatorios completos', 400);
  }
  if (!user.fotoUrl) {
    throw createAppError('El usuario debe tener fotografía para emitir el carné', 400);
  }

  return user;
}

function defaultFechaVencimiento() {
  return formatDateOnly(addYears(new Date(), CARNET.DEFAULT_VALIDITY_YEARS));
}

async function preview(usuarioId, fechaVencimientoInput, actor) {
  const user = await buildSnapshotFromUser(usuarioId, actor);
  const fechaExpedicion = formatDateOnly(new Date());
  const fechaVencimiento = parseDateInput(fechaVencimientoInput) || defaultFechaVencimiento();
  assertFutureOrEqualDate(fechaVencimiento, new Date(fechaExpedicion));

  const regionalCodigo = await carnetsRepository.getRegionalCodigo(user.regionalId);
  const active = await carnetsRepository.findActiveByUsuarioId(usuarioId);

  return {
    usuarioId: user.id,
    nombreCompleto: user.nombreCompleto,
    documento: user.documento,
    tipoDocumento: user.tipoDocumento,
    tipoUsuario: user.tipoUsuario,
    regionalNombre: user.regionalNombre,
    centroNombre: user.centroNombre,
    dependenciaNombre: user.dependenciaNombre,
    fotoUrl: user.fotoUrl,
    fechaExpedicion,
    fechaVencimiento,
    estado: 'ACTIVO',
    codigoUnicoPreview: `${regionalCodigo}-${new Date().getFullYear()}-XXXXXX`,
    tieneCarnetActivo: Boolean(active),
    carnetActivoId: active?.id || null,
    completo: true,
  };
}

async function list(filters = {}, actor = null) {
  const scoped = applyCarnetListScope(actor, filters);
  const { page, limit, offset } = parsePagination(filters);
  const total = await carnetsRepository.count(scoped);
  const rows = await carnetsRepository.findMany(scoped, { limit, offset });

  const items = [];
  for (const row of rows) {
    let item = formatCarnet(row);
    item = await syncResolvedEstado(item);
    items.push(item);
  }

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total),
  };
}

async function getById(id, actor = null) {
  const row = await carnetsRepository.findById(id);
  let carnet = formatCarnet(row);
  if (!carnet) return null;
  assertCanAccess(actor, carnet);
  carnet = await syncResolvedEstado(carnet);
  return carnet;
}

async function getHistorial(id, actor = null) {
  const carnet = await getById(id, actor);
  if (!carnet) throw createAppError('Carné no encontrado', 404);
  const rows = await carnetsRepository.findHistorial(id);
  return rows.map(formatHistorial);
}

async function recordHistorial(carnetId, estadoAnterior, estadoNuevo, motivo, actorId) {
  await carnetsRepository.insertHistorial([
    generateId(),
    carnetId,
    estadoAnterior,
    estadoNuevo,
    motivo || null,
    actorId,
  ]);
}

async function create({ usuarioId, fechaVencimiento: fechaVencimientoInput }, actor) {
  const user = await buildSnapshotFromUser(usuarioId, actor);
  const active = await carnetsRepository.findActiveByUsuarioId(usuarioId);
  if (active) {
    throw createAppError('El usuario ya tiene un carné activo', 409);
  }

  const fechaExpedicion = formatDateOnly(new Date());
  const fechaVencimiento = parseDateInput(fechaVencimientoInput) || defaultFechaVencimiento();
  assertFutureOrEqualDate(fechaVencimiento, new Date(fechaExpedicion));

  const regionalCodigo = await carnetsRepository.getRegionalCodigo(user.regionalId);
  const codigoUnico = await generateCodigoUnico(regionalCodigo);
  const qrToken = await generateUniqueQrToken();
  const id = generateId();

  await carnetsRepository.insertCarnet([
    id,
    codigoUnico,
    usuarioId,
    'ACTIVO',
    fechaExpedicion,
    fechaVencimiento,
    qrToken,
    user.fotoUrl,
    user.nombreCompleto,
    user.documento,
    user.tipoDocumento || 'CC',
    user.tipoUsuario,
    user.centroNombre || null,
    user.regionalNombre || null,
    user.dependenciaNombre || null,
    actor.id,
  ]);

  await recordHistorial(id, null, 'ACTIVO', 'Emisión inicial', actor.id);

  const auditoriaService = require('./auditoria.service');
  await auditoriaService.log({
    usuarioId: actor.id,
    accion: 'GENERAR_QR',
    entidad: 'CarnetQR',
    entidadId: id,
    detalle: { codigoUnico },
  });

  return getById(id, actor);
}

async function update(id, data, actor) {
  const carnet = await getById(id, actor);
  if (!carnet) throw createAppError('Carné no encontrado', 404);
  if (carnet.estado === 'REVOCADO') {
    throw createAppError('No se puede editar un carné revocado', 400);
  }

  const fields = [];
  const params = [];

  if (data.fechaVencimiento) {
    assertFutureOrEqualDate(data.fechaVencimiento, new Date(carnet.fechaExpedicion));
    fields.push('fecha_vencimiento = ?');
    params.push(data.fechaVencimiento);
  }

  if (data.sincronizarUsuario) {
    const user = await buildSnapshotFromUser(carnet.usuarioId, actor);
    fields.push(
      'foto_url = ?',
      'nombre_completo = ?',
      'documento = ?',
      'tipo_documento = ?',
      'tipo_usuario = ?',
      'centro_nombre = ?',
      'regional_nombre = ?',
      'dependencia_nombre = ?'
    );
    params.push(
      user.fotoUrl,
      user.nombreCompleto,
      user.documento,
      user.tipoDocumento || 'CC',
      user.tipoUsuario,
      user.centroNombre || null,
      user.regionalNombre || null,
      user.dependenciaNombre || null
    );
  }

  if (!fields.length) {
    throw createAppError('No hay cambios para aplicar', 400);
  }

  await carnetsRepository.updateCarnet(id, fields, params);
  await invalidatePdfCache(id);
  return getById(id, actor);
}

async function changeEstado(id, action, motivo, actor, extra = {}) {
  const carnet = await getById(id, actor);
  if (!carnet) throw createAppError('Carné no encontrado', 404);

  const current = carnet.estadoResuelto || carnet.estado;
  const nuevoEstado = assertTransition(current, action);

  const fields = ['estado = ?'];
  const params = [nuevoEstado];

  if (action === 'RENOVAR') {
    const fechaExpedicion = formatDateOnly(new Date());
    const fechaVencimiento =
      parseDateInput(extra.fechaVencimiento) || defaultFechaVencimiento();
    assertFutureOrEqualDate(fechaVencimiento, new Date(fechaExpedicion));
    fields.push('fecha_expedicion = ?', 'fecha_vencimiento = ?');
    params.push(fechaExpedicion, fechaVencimiento);

    if (extra.sincronizarUsuario) {
      const user = await buildSnapshotFromUser(carnet.usuarioId, actor);
      fields.push(
        'foto_url = ?',
        'nombre_completo = ?',
        'documento = ?',
        'tipo_documento = ?',
        'tipo_usuario = ?',
        'centro_nombre = ?',
        'regional_nombre = ?',
        'dependencia_nombre = ?'
      );
      params.push(
        user.fotoUrl,
        user.nombreCompleto,
        user.documento,
        user.tipoDocumento || 'CC',
        user.tipoUsuario,
        user.centroNombre || null,
        user.regionalNombre || null,
        user.dependenciaNombre || null
      );
    }
  }

  await carnetsRepository.updateCarnet(id, fields, params);
  await recordHistorial(id, carnet.estado, nuevoEstado, motivo, actor.id);
  await invalidatePdfCache(id);
  return getById(id, actor);
}

async function suspender(id, motivo, actor) {
  return changeEstado(id, 'SUSPENDER', motivo || 'Suspensión administrativa', actor);
}

async function revocar(id, motivo, actor) {
  if (!motivo?.trim()) throw createAppError('El motivo de revocación es obligatorio', 400);
  return changeEstado(id, 'REVOCAR', motivo.trim(), actor);
}

async function reactivar(id, motivo, actor) {
  const active = await carnetsRepository.findActiveByUsuarioId(
    (await getById(id, actor)).usuarioId
  );
  if (active && active.id !== id) {
    throw createAppError('El usuario ya tiene otro carné activo', 409);
  }
  return changeEstado(id, 'REACTIVAR', motivo || 'Reactivación', actor);
}

async function renovar(id, { fechaVencimiento, motivo, sincronizarUsuario }, actor) {
  const carnet = await getById(id, actor);
  const active = await carnetsRepository.findActiveByUsuarioId(carnet.usuarioId);
  if (active && active.id !== id && active.estado === 'ACTIVO') {
    throw createAppError('El usuario ya tiene un carné activo', 409);
  }
  return changeEstado(id, 'RENOVAR', motivo || 'Renovación de carné', actor, {
    fechaVencimiento,
    sincronizarUsuario,
  });
}

async function getQrInfo(id, actor) {
  const carnet = await getById(id, actor);
  if (!carnet) throw createAppError('Carné no encontrado', 404);
  if (!carnet.qrToken || !qrService.verifyToken(carnet.qrToken)) {
    throw createAppError('El carné no tiene un código QR válido', 400);
  }
  const qr = await qrService.generateQrForToken(carnet.qrToken, 200);
  return {
    carnetId: carnet.id,
    codigoUnico: carnet.codigoUnico,
    validationUrl: qr.validationUrl,
    dataUrl: qr.dataUrl,
  };
}

async function regenerarQr(id, actor) {
  const carnet = await getById(id, actor);
  if (!carnet) throw createAppError('Carné no encontrado', 404);
  if (carnet.estado === 'REVOCADO') {
    throw createAppError('No se puede regenerar el QR de un carné revocado', 400);
  }

  const newToken = await generateUniqueQrToken();
  await carnetsRepository.updateQrToken(id, newToken);
  await invalidatePdfCache(id);

  const auditoriaService = require('./auditoria.service');
  await auditoriaService.log({
    usuarioId: actor.id,
    accion: 'REGENERAR_QR',
    entidad: 'CarnetQR',
    entidadId: id,
    detalle: { codigoUnico: carnet.codigoUnico },
  });

  return getQrInfo(id, actor);
}

module.exports = {
  list,
  getById,
  getHistorial,
  preview,
  create,
  update,
  suspender,
  revocar,
  reactivar,
  renovar,
  getQrInfo,
  regenerarQr,
  formatCarnet,
};
