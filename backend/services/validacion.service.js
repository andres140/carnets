/**
 * Servicio de validación pública por QR.
 */
const carnetsRepository = require('../repositories/carnets.repository');
const validacionesQrRepository = require('../repositories/validacionesQr.repository');
const auditoriaService = require('./auditoria.service');
const qrService = require('./qr.service');
const { formatCarnet } = require('./carnets.service');
const { resolveEstado } = require('../utils/carnetStates');
const { generateId } = require('../utils/helpers');

const MENSAJE_FALLO =
  'No se encontró un carné válido para este código. Verifique el QR e intente nuevamente.';

const MENSAJES_ESTADO = {
  ACTIVO: 'Carné vigente y válido.',
  VENCIDO: 'Carné vencido. No se encuentra vigente.',
  SUSPENDIDO: 'Carné suspendido temporalmente.',
  REVOCADO: 'Carné revocado. No es válido para su uso.',
};

async function registrarValidacion({
  carnetId,
  tokenIntentado,
  ip,
  resultado,
  usuarioId,
}) {
  await validacionesQrRepository.insert({
    id: generateId(),
    carnetId,
    tokenIntentado: tokenIntentado || null,
    ip: ip || null,
    resultado,
    usuarioId: usuarioId || null,
  });
}

async function auditarValidacion({ accion, entidadId, detalle, ip, usuarioId }) {
  await auditoriaService.log({
    usuarioId: usuarioId || null,
    accion,
    entidad: 'ValidacionQR',
    entidadId,
    detalle,
    ip,
  });
}

function buildPublicCarnet(carnet) {
  return {
    codigoUnico: carnet.codigoUnico,
    nombreCompleto: carnet.nombreCompleto,
    tipoUsuario: carnet.tipoUsuario,
    regionalNombre: carnet.regionalNombre,
    centroNombre: carnet.centroNombre,
    fotoUrl: carnet.fotoUrl,
    fechaExpedicion: carnet.fechaExpedicion,
    fechaVencimiento: carnet.fechaVencimiento,
    estado: carnet.estadoResuelto || carnet.estado,
  };
}

async function validarToken(token, { ip, usuarioId } = {}) {
  const tokenNormalizado = (token || '').trim();

  if (!tokenNormalizado) {
    return { valido: false, mensaje: MENSAJE_FALLO };
  }

  if (!qrService.verifyToken(tokenNormalizado)) {
    await registrarValidacion({
      tokenIntentado: tokenNormalizado.slice(0, 120),
      ip,
      resultado: 'TOKEN_INVALIDO',
      usuarioId,
    });
    await auditarValidacion({
      accion: 'VALIDAR_QR_FALLIDA',
      detalle: { motivo: 'TOKEN_INVALIDO' },
      ip,
      usuarioId,
    });
    return { valido: false, mensaje: MENSAJE_FALLO };
  }

  const row = await carnetsRepository.findByQrToken(tokenNormalizado);
  if (!row) {
    await registrarValidacion({
      tokenIntentado: tokenNormalizado.slice(0, 120),
      ip,
      resultado: 'NO_ENCONTRADO',
      usuarioId,
    });
    await auditarValidacion({
      accion: 'VALIDAR_QR_FALLIDA',
      detalle: { motivo: 'NO_ENCONTRADO' },
      ip,
      usuarioId,
    });
    return { valido: false, mensaje: MENSAJE_FALLO };
  }

  let carnet = formatCarnet(row);
  let estadoResuelto = resolveEstado(carnet);

  if (estadoResuelto === 'VENCIDO' && carnet.estado === 'ACTIVO') {
    await carnetsRepository.setEstado(carnet.id, 'VENCIDO');
    carnet = { ...carnet, estado: 'VENCIDO' };
    estadoResuelto = 'VENCIDO';
  } else {
    carnet.estadoResuelto = estadoResuelto;
  }

  const valido = estadoResuelto === 'ACTIVO';
  const resultado = valido ? 'VALIDO' : estadoResuelto;

  await registrarValidacion({
    carnetId: carnet.id,
    tokenIntentado: tokenNormalizado.slice(0, 120),
    ip,
    resultado,
    usuarioId,
  });

  await auditarValidacion({
    accion: valido ? 'VALIDAR_QR_EXITOSA' : 'VALIDAR_QR_ESTADO',
    entidadId: carnet.id,
    detalle: { resultado, codigoUnico: carnet.codigoUnico },
    ip,
    usuarioId,
  });

  return {
    valido,
    estado: estadoResuelto,
    carnet: buildPublicCarnet({ ...carnet, estadoResuelto }),
    mensaje: MENSAJES_ESTADO[estadoResuelto] || MENSAJE_FALLO,
  };
}

module.exports = { validarToken, buildPublicCarnet, MENSAJE_FALLO };
