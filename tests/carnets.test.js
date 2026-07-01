const test = require('node:test');
const assert = require('node:assert/strict');
const service = require('../services/carnets.service');

test('genera carné para usuario activo', () => {
  const carnet = service.createCarnet({ usuario: 'USR-101', observacion: 'Prueba' });
  assert.equal(carnet.estado, 'Activo');
  assert.ok(carnet.codigo);
});

test('rechaza usuario inactivo', () => {
  assert.throws(() => service.createCarnet({ usuario: 'USR-002' }), /inactivo/);
});

test('renueva carné y actualiza vigencia', () => {
  const carnet = service.createCarnet({ usuario: 'USR-102', observacion: 'Renovación' });
  const renovado = service.renewCarnet(carnet.codigo, 'Prueba renovación');
  assert.equal(renovado.estado, 'Activo');
  assert.ok(renovado.fecha_vencimiento);
});
