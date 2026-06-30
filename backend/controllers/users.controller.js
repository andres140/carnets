const usersService = require('../services/users.service');
const auditoriaService = require('../services/auditoria.service');
const { getClientIp } = require('../utils/request');
const { parseUserBody } = require('../utils/mappers');
const { asyncHandler } = require('../utils/asyncHandler');
const { computeUserChanges } = require('../utils/diff');

function actorFromSession(req) {
  return req.session?.user || null;
}

async function logUserAction(req, accion, user, detalle = null) {
  await auditoriaService.log({
    usuarioId: req.session.user.id,
    accion,
    entidad: 'Usuario',
    entidadId: user.id,
    detalle,
    ip: getClientIp(req),
  });
}

const list = asyncHandler(async (req, res) => {
  const result = await usersService.list(
    {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      documento: req.query.documento,
      nombre: req.query.nombre,
      email: req.query.email,
      rolId: req.query.rolId,
      estado: req.query.estado,
      regionalId: req.query.regionalId,
      centroId: req.query.centroId,
      dependenciaId: req.query.dependenciaId,
      tipoUsuario: req.query.tipoUsuario,
    },
    actorFromSession(req)
  );
  return res.json({ success: true, data: result });
});

const getOne = asyncHandler(async (req, res) => {
  const user = await usersService.getById(req.params.id, actorFromSession(req));
  if (!user) {
    return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  }
  return res.json({ success: true, data: user });
});

const create = asyncHandler(async (req, res) => {
  const data = parseUserBody(req);
  const user = await usersService.create(data, actorFromSession(req));
  await logUserAction(req, 'CREAR', user, {
    documento: user.documento,
    email: user.email,
    rolNombre: user.rolNombre,
    tipoUsuario: user.tipoUsuario,
  });
  return res.status(201).json({
    success: true,
    data: user,
    message: 'Usuario creado correctamente',
  });
});

const update = asyncHandler(async (req, res) => {
  const existing = await usersService.getById(req.params.id, actorFromSession(req));
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
  }

  const data = parseUserBody(req);
  const user = await usersService.update(req.params.id, data, actorFromSession(req));
  const cambios = computeUserChanges(existing, user);

  await logUserAction(req, 'ACTUALIZAR', user, cambios || { mensaje: 'Sin cambios detectados' });

  return res.json({
    success: true,
    data: user,
    message: 'Usuario actualizado correctamente',
  });
});

const deactivate = asyncHandler(async (req, res) => {
  const user = await usersService.deactivate(req.params.id, actorFromSession(req));
  await logUserAction(req, 'DESACTIVAR', user, {
    estadoAnterior: 'ACTIVO',
    estadoNuevo: user.estado,
  });
  return res.json({
    success: true,
    data: user,
    message: 'Usuario desactivado correctamente',
  });
});

const reactivate = asyncHandler(async (req, res) => {
  const user = await usersService.reactivate(req.params.id, actorFromSession(req));
  await logUserAction(req, 'REACTIVAR', user, {
    estadoAnterior: 'INACTIVO',
    estadoNuevo: user.estado,
  });
  return res.json({
    success: true,
    data: user,
    message: 'Usuario reactivado correctamente',
  });
});

module.exports = {
  list,
  getOne,
  create,
  update,
  deactivate,
  reactivate,
};
