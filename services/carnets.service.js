const crypto = require('crypto');

const carnets = [
  {
    id: 1,
    codigo: 'CAR-20260616-0001',
    usuario: 'USR-001',
    rol: 'Aprendiz',
    centro: 'Centro de Diseño',
    estado: 'Activo',
    fecha_expedicion: '2026-06-16',
    fecha_vencimiento: '2027-06-16',
    historial: [],
    auditoria: []
  }
];

const usuarios = {
  'USR-001': { activo: true },
  'USR-002': { activo: false },
  'USR-101': { activo: true },
  'USR-102': { activo: true },
};

function generateCode() {
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `CAR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${random}`;
}

function addAudit(codigo, accion, usuario, observacion) {
  const entry = {
    codigo,
    accion,
    usuario,
    fecha: new Date().toISOString(),
    ip: '127.0.0.1',
    observaciones: observacion || ''
  };
  const carnet = carnets.find((item) => item.codigo === codigo);
  if (carnet) {
    carnet.auditoria = carnet.auditoria || [];
    carnet.auditoria.push(entry);
  }
  return entry;
}

function listCarnets() {
  return { items: carnets.map((item) => ({ ...item })) };
}

function createCarnet({ usuario, observacion = '' }) {
  if (!usuario) throw new Error('Debe seleccionar un usuario.');
  if (!usuarios[usuario] || !usuarios[usuario].activo) throw new Error('No se puede generar un carné para un usuario inactivo.');
  if (carnets.some((item) => item.usuario === usuario && item.estado === 'Activo')) {
    throw new Error('El usuario ya tiene un carné activo.');
  }

  const fechaExpedicion = new Date().toISOString().slice(0, 10);
  const fechaVencimiento = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const carnet = {
    id: carnets.length + 1,
    codigo: generateCode(),
    usuario,
    rol: 'Aprendiz',
    centro: 'Centro de Servicio',
    estado: 'Activo',
    fecha_expedicion: fechaExpedicion,
    fecha_vencimiento: fechaVencimiento,
    historial: [{ accion: 'GENERAR', fecha: fechaExpedicion, observacion }],
    auditoria: []
  };

  carnets.push(carnet);
  addAudit(carnet.codigo, 'GENERAR', usuario, observacion);
  return carnet;
}

function renewCarnet(codigo, observacion = '') {
  const carnet = carnets.find((item) => item.codigo === codigo);
  if (!carnet) throw new Error('Carné no encontrado.');
  carnet.historial = carnet.historial || [];
  carnet.historial.push({ accion: 'RENOVAR', fecha: new Date().toISOString().slice(0, 10), observacion });
  carnet.fecha_vencimiento = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  carnet.estado = 'Activo';
  addAudit(codigo, 'RENOVAR', carnet.usuario, observacion);
  return carnet;
}

function suspendCarnet(codigo, observacion = '') {
  const carnet = carnets.find((item) => item.codigo === codigo);
  if (!carnet) throw new Error('Carné no encontrado.');
  carnet.estado = 'Suspendido';
  carnet.historial.push({ accion: 'SUSPENDER', fecha: new Date().toISOString().slice(0, 10), observacion });
  addAudit(codigo, 'SUSPENDER', carnet.usuario, observacion);
  return carnet;
}

function revokeCarnet(codigo, observacion = '') {
  const carnet = carnets.find((item) => item.codigo === codigo);
  if (!carnet) throw new Error('Carné no encontrado.');
  carnet.estado = 'Revocado';
  carnet.historial.push({ accion: 'REVOCAR', fecha: new Date().toISOString().slice(0, 10), observacion });
  addAudit(codigo, 'REVOCAR', carnet.usuario, observacion);
  return carnet;
}

module.exports = {
  listCarnets,
  createCarnet,
  renewCarnet,
  suspendCarnet,
  revokeCarnet
};
