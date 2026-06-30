const { ESTADOS_CARNET } = require('../constants');
const { createAppError } = require('./errors');

const TRANSITIONS = {
  SUSPENDER: { from: ['ACTIVO'], to: 'SUSPENDIDO' },
  REVOCAR: { from: ['ACTIVO', 'SUSPENDIDO', 'VENCIDO'], to: 'REVOCADO' },
  REACTIVAR: { from: ['SUSPENDIDO'], to: 'ACTIVO' },
  RENOVAR: { from: ['VENCIDO', 'ACTIVO'], to: 'ACTIVO' },
};

function assertValidEstado(estado) {
  if (!ESTADOS_CARNET.includes(estado)) {
    throw createAppError('Estado de carné no válido', 400);
  }
}

function assertTransition(currentEstado, action) {
  const rule = TRANSITIONS[action];
  if (!rule) throw createAppError('Acción de estado no válida', 400);
  if (!rule.from.includes(currentEstado)) {
    throw createAppError(
      `No se puede ${action.toLowerCase()} un carné en estado ${currentEstado}`,
      400
    );
  }
  return rule.to;
}

function resolveEstado(carnet) {
  if (!carnet) return null;
  if (carnet.estado === 'REVOCADO' || carnet.estado === 'SUSPENDIDO') {
    return carnet.estado;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const vencimiento = new Date(carnet.fechaVencimiento || carnet.fecha_vencimiento);
  vencimiento.setHours(0, 0, 0, 0);
  if (vencimiento < today) return 'VENCIDO';
  return carnet.estado;
}

function addYears(date, years) {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function parseDateInput(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return formatDateOnly(date);
}

function assertFutureOrEqualDate(dateStr, reference = new Date()) {
  const date = new Date(dateStr);
  const ref = new Date(reference);
  ref.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  if (date < ref) {
    throw createAppError('La fecha de vencimiento debe ser hoy o posterior', 400);
  }
}

module.exports = {
  TRANSITIONS,
  assertValidEstado,
  assertTransition,
  resolveEstado,
  addYears,
  formatDateOnly,
  parseDateInput,
  assertFutureOrEqualDate,
};
