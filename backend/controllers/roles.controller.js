const rolesService = require('../services/roles.service');
const permisosService = require('../services/permisos.service');
const { asyncHandler } = require('../utils/asyncHandler');
const { logAudit } = require('../utils/auditHelper');
const { computeEntityChanges } = require('../utils/diff');

const ROL_FIELDS = ['nombre', 'descripcion', 'estado'];
const PERMISO_FIELDS = ['codigo', 'nombre'];

const listRoles = asyncHandler(async (req, res) => {
  const result = await rolesService.list({
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    activo: req.query.activo,
  });
  return res.json({ success: true, data: result });
});

const getRol = asyncHandler(async (req, res) => {
  const item = await rolesService.getById(req.params.id, { includePermisos: true });
  if (!item) return res.status(404).json({ success: false, error: 'Rol no encontrado' });
  return res.json({ success: true, data: item });
});

const createRol = asyncHandler(async (req, res) => {
  const item = await rolesService.create(req.body);
  await logAudit(req, {
    accion: 'CREAR',
    entidad: 'Rol',
    entidadId: item.id,
    detalle: { nombre: item.nombre },
  });
  return res.status(201).json({ success: true, data: item, message: 'Rol creado correctamente' });
});

const updateRol = asyncHandler(async (req, res) => {
  const before = await rolesService.getById(req.params.id);
  if (!before) return res.status(404).json({ success: false, error: 'Rol no encontrado' });
  const item = await rolesService.update(req.params.id, req.body);
  const cambios = computeEntityChanges(before, item, ROL_FIELDS);
  await logAudit(req, {
    accion: 'ACTUALIZAR',
    entidad: 'Rol',
    entidadId: item.id,
    detalle: cambios || { mensaje: 'Sin cambios detectados' },
  });
  return res.json({ success: true, data: item, message: 'Rol actualizado correctamente' });
});

const deactivateRol = asyncHandler(async (req, res) => {
  const item = await rolesService.deactivate(req.params.id);
  await logAudit(req, {
    accion: 'DESACTIVAR',
    entidad: 'Rol',
    entidadId: item.id,
    detalle: { estado: item.estado },
  });
  return res.json({ success: true, data: item, message: 'Rol desactivado correctamente' });
});

const reactivateRol = asyncHandler(async (req, res) => {
  const item = await rolesService.reactivate(req.params.id);
  await logAudit(req, {
    accion: 'REACTIVAR',
    entidad: 'Rol',
    entidadId: item.id,
    detalle: { estado: item.estado },
  });
  return res.json({ success: true, data: item, message: 'Rol reactivado correctamente' });
});

const setRolPermisos = asyncHandler(async (req, res) => {
  const before = await rolesService.getById(req.params.id, { includePermisos: true });
  if (!before) return res.status(404).json({ success: false, error: 'Rol no encontrado' });

  const permisoIds = Array.isArray(req.body.permisoIds) ? req.body.permisoIds : [];
  const item = await rolesService.setPermisos(req.params.id, permisoIds);

  await logAudit(req, {
    accion: 'ACTUALIZAR',
    entidad: 'RolPermisos',
    entidadId: item.id,
    detalle: {
      rol: item.nombre,
      permisosAntes: (before.permisos || []).map((p) => p.codigo),
      permisosDespues: (item.permisos || []).map((p) => p.codigo),
    },
  });

  return res.json({
    success: true,
    data: item,
    message: 'Permisos del rol actualizados correctamente',
  });
});

const listPermisos = asyncHandler(async (req, res) => {
  if (req.query.all === '1') {
    const items = await permisosService.listAll();
    return res.json({ success: true, data: items });
  }
  const result = await permisosService.list({
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
  });
  return res.json({ success: true, data: result });
});

const createPermiso = asyncHandler(async (req, res) => {
  const item = await permisosService.create(req.body);
  await logAudit(req, {
    accion: 'CREAR',
    entidad: 'Permiso',
    entidadId: item.id,
    detalle: { codigo: item.codigo, nombre: item.nombre },
  });
  return res.status(201).json({ success: true, data: item, message: 'Permiso creado correctamente' });
});

const updatePermiso = asyncHandler(async (req, res) => {
  const before = await permisosService.getById(req.params.id);
  if (!before) return res.status(404).json({ success: false, error: 'Permiso no encontrado' });
  const item = await permisosService.update(req.params.id, req.body);
  const cambios = computeEntityChanges(before, item, PERMISO_FIELDS);
  await logAudit(req, {
    accion: 'ACTUALIZAR',
    entidad: 'Permiso',
    entidadId: item.id,
    detalle: cambios || { mensaje: 'Sin cambios detectados' },
  });
  return res.json({ success: true, data: item, message: 'Permiso actualizado correctamente' });
});

module.exports = {
  listRoles,
  getRol,
  createRol,
  updateRol,
  deactivateRol,
  reactivateRol,
  setRolPermisos,
  listPermisos,
  createPermiso,
  updatePermiso,
};
