const { ROLES } = require('../constants');

function hasPermission(user, permission) {
  if (!user?.permisos) return false;
  return user.permisos.includes(permission);
}

function hasAnyPermission(user, permissions) {
  return permissions.some((p) => hasPermission(user, p));
}

function canAccessRegional(user, regionalId) {
  if (!user) return false;
  if (user.tipoUsuario === ROLES.ADMINISTRADOR) return true;
  if (!regionalId || !user.regionalId) return false;
  return user.regionalId === regionalId;
}

/**
 * Aplica filtros de alcance según el actor (coordinador → regional, instructor → centro).
 */
function applyUserListScope(actor, filters = {}) {
  const scoped = { ...filters };

  if (actor?.tipoUsuario === ROLES.COORDINADOR && actor.regionalId) {
    scoped.regionalId = actor.regionalId;
  }

  if (actor?.tipoUsuario === ROLES.INSTRUCTOR && actor.centroId) {
    scoped.centroId = actor.centroId;
  }

  return scoped;
}

/**
 * Verifica si el actor puede acceder a un usuario concreto (lectura/mutación).
 */
function canAccessUser(actor, targetUser) {
  if (!actor || !targetUser) return false;
  if (actor.tipoUsuario === ROLES.ADMINISTRADOR) return true;
  if (actor.tipoUsuario === ROLES.COORDINADOR) {
    return canAccessRegional(actor, targetUser.regionalId);
  }
  return false;
}

function canAccessCarnet(actor, carnet) {
  if (!actor || !carnet) return false;
  if (actor.tipoUsuario === ROLES.ADMINISTRADOR) return true;

  if (actor.tipoUsuario === ROLES.APRENDIZ || actor.tipoUsuario === ROLES.CONTRATISTA) {
    return carnet.usuarioId === actor.id;
  }

  if (actor.tipoUsuario === ROLES.COORDINADOR) {
    return canAccessRegional(actor, carnet.regionalId);
  }

  if (actor.tipoUsuario === ROLES.INSTRUCTOR && actor.centroId) {
    return carnet.centroId === actor.centroId;
  }

  return hasPermission(actor, 'carnets.ver') || hasPermission(actor, 'carnets.generar');
}

function applyCarnetListScope(actor, filters = {}) {
  const scoped = { ...filters };

  if (actor?.tipoUsuario === ROLES.APRENDIZ || actor?.tipoUsuario === ROLES.CONTRATISTA) {
    scoped.usuarioId = actor.id;
  }

  if (actor?.tipoUsuario === ROLES.COORDINADOR && actor.regionalId) {
    scoped.regionalId = actor.regionalId;
  }

  if (actor?.tipoUsuario === ROLES.INSTRUCTOR && actor.centroId) {
    scoped.centroId = actor.centroId;
  }

  return scoped;
}

module.exports = {
  hasPermission,
  hasAnyPermission,
  canAccessRegional,
  applyUserListScope,
  canAccessUser,
  canAccessCarnet,
  applyCarnetListScope,
};
