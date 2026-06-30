/**
 * Constantes de dominio — enums, límites y códigos de permiso.
 * Fuente única para validaciones, servicios y futuros módulos.
 */

const ESTADOS_USUARIO = ['ACTIVO', 'INACTIVO', 'SUSPENDIDO'];

const ESTADOS_CARNET = ['ACTIVO', 'VENCIDO', 'SUSPENDIDO', 'REVOCADO'];

const TIPOS_USUARIO = [
  'APRENDIZ',
  'INSTRUCTOR',
  'FUNCIONARIO',
  'CONTRATISTA',
  'COORDINADOR',
  'ADMINISTRADOR',
];

const TIPOS_DOCUMENTO = ['CC', 'TI', 'CE', 'PA', 'PEP'];

const ROLES = {
  ADMINISTRADOR: 'ADMINISTRADOR',
  COORDINADOR: 'COORDINADOR',
  FUNCIONARIO: 'FUNCIONARIO',
  INSTRUCTOR: 'INSTRUCTOR',
  APRENDIZ: 'APRENDIZ',
  CONTRATISTA: 'CONTRATISTA',
};

const ROL_TO_TIPO = { ...ROLES };

const PERMISOS = {
  USUARIOS_CREAR: 'usuarios.crear',
  USUARIOS_EDITAR: 'usuarios.editar',
  USUARIOS_DESACTIVAR: 'usuarios.desactivar',
  USUARIOS_VER: 'usuarios.ver',
  CARNETS_GENERAR: 'carnets.generar',
  CARNETS_GENERAR_MASIVO: 'carnets.generar_masivo',
  CARNETS_VER: 'carnets.ver',
  CARNETS_REVOCAR: 'carnets.revocar',
  CARNETS_SUSPENDER: 'carnets.suspender',
  VALIDAR_QR: 'validar.qr',
  REPORTES_VER: 'reportes.ver',
  AUDITORIA_VER: 'auditoria.ver',
  ROLES_GESTIONAR: 'roles.gestionar',
  CONFIG_GESTIONAR: 'config.gestionar',
  REGIONALES_VER: 'regionales.ver',
  REGIONALES_GESTIONAR: 'regionales.gestionar',
  CENTROS_VER: 'centros.ver',
  CENTROS_GESTIONAR: 'centros.gestionar',
  DEPENDENCIAS_VER: 'dependencias.ver',
  DEPENDENCIAS_GESTIONAR: 'dependencias.gestionar',
  PERMISOS_GESTIONAR: 'permisos.gestionar',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

const UPLOAD = {
  ALLOWED_MIMES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_SIZE_MB: 5,
};

const ESTADOS_ENTIDAD = ['ACTIVO', 'INACTIVO'];

const DOCUMENTO = {
  MIN_LENGTH: 5,
  MAX_LENGTH: 50,
};

const CARNET = {
  DEFAULT_VALIDITY_YEARS: 1,
  CODE_SEQUENCE_LENGTH: 6,
  DEFAULT_TEMPLATE_ID: 'default',
};

const DOCUMENTO_CARNET_ACCION = ['GENERAR', 'DESCARGAR', 'IMPRIMIR', 'REIMPRIMIR'];

const EXPORT_FORMATS = ['pdf', 'png', 'jpg'];

module.exports = {
  ESTADOS_USUARIO,
  ESTADOS_CARNET,
  TIPOS_USUARIO,
  TIPOS_DOCUMENTO,
  ROLES,
  ROL_TO_TIPO,
  PERMISOS,
  EMAIL_REGEX,
  PAGINATION,
  UPLOAD,
  DOCUMENTO,
  ESTADOS_ENTIDAD,
  CARNET,
  DOCUMENTO_CARNET_ACCION,
  EXPORT_FORMATS,
};
