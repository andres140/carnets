const usersService = require('../services/users.service');
const catalogService = require('../services/catalog.service');
const auditoriaService = require('../services/auditoriaService');

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
}

function parseUserBody(req) {
  const body = req.body || {};
  return {
    documento: body.documento?.trim(),
    tipoDocumento: body.tipoDocumento || 'CC',
    nombres: body.nombres?.trim(),
    apellidos: body.apellidos?.trim(),
    email: body.email?.trim(),
    telefono: body.telefono?.trim(),
    password: body.password,
    rolId: body.rolId,
    regionalId: body.regionalId || null,
    centroId: body.centroId || null,
    dependenciaId: body.dependenciaId || null,
    estado: body.estado || 'ACTIVO',
    fotoUrl: req.file ? `/uploads/${req.file.filename}` : body.fotoUrl,
  };
}

async function list(req, res, next) {
  try {
    const result = await usersService.list({
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
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const user = await usersService.getById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    return res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const data = parseUserBody(req);
    const user = await usersService.create(data);

    await auditoriaService.log({
      usuarioId: req.session.user.id,
      accion: 'CREAR',
      entidad: 'Usuario',
      entidadId: user.id,
      detalle: { email: user.email, documento: user.documento },
      ip: getClientIp(req),
    });

    return res.status(201).json({
      success: true,
      data: user,
      message: 'Usuario creado correctamente',
    });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const data = parseUserBody(req);
    const user = await usersService.update(req.params.id, data);

    await auditoriaService.log({
      usuarioId: req.session.user.id,
      accion: 'ACTUALIZAR',
      entidad: 'Usuario',
      entidadId: user.id,
      detalle: { email: user.email },
      ip: getClientIp(req),
    });

    return res.json({
      success: true,
      data: user,
      message: 'Usuario actualizado correctamente',
    });
  } catch (err) {
    next(err);
  }
}

async function deactivate(req, res, next) {
  try {
    const user = await usersService.deactivate(req.params.id);

    await auditoriaService.log({
      usuarioId: req.session.user.id,
      accion: 'DESACTIVAR',
      entidad: 'Usuario',
      entidadId: user.id,
      ip: getClientIp(req),
    });

    return res.json({
      success: true,
      data: user,
      message: 'Usuario desactivado correctamente',
    });
  } catch (err) {
    next(err);
  }
}

async function reactivate(req, res, next) {
  try {
    const user = await usersService.reactivate(req.params.id);

    await auditoriaService.log({
      usuarioId: req.session.user.id,
      accion: 'REACTIVAR',
      entidad: 'Usuario',
      entidadId: user.id,
      ip: getClientIp(req),
    });

    return res.json({
      success: true,
      data: user,
      message: 'Usuario reactivado correctamente',
    });
  } catch (err) {
    next(err);
  }
}

async function getRoles(_req, res, next) {
  try {
    const roles = await catalogService.getRoles();
    return res.json({ success: true, data: roles });
  } catch (err) {
    next(err);
  }
}

async function getRegionales(_req, res, next) {
  try {
    const regionales = await catalogService.getRegionales();
    return res.json({ success: true, data: regionales });
  } catch (err) {
    next(err);
  }
}

async function getCentros(req, res, next) {
  try {
    const centros = await catalogService.getCentros(req.query.regionalId);
    return res.json({ success: true, data: centros });
  } catch (err) {
    next(err);
  }
}

async function getDependencias(req, res, next) {
  try {
    const dependencias = await catalogService.getDependencias(req.query.centroId);
    return res.json({ success: true, data: dependencias });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getOne,
  create,
  update,
  deactivate,
  reactivate,
  getRoles,
  getRegionales,
  getCentros,
  getDependencias,
};
