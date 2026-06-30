const express = require('express');
const carnetsController = require('../controllers/carnets.controller');
const carnetDocumentoController = require('../controllers/carnetDocumento.controller');
const { requireAuth, requirePermission } = require('../middleware/auth');
const { csrfProtection } = require('../middleware/csrf');
const { PERMISOS } = require('../constants');

const router = express.Router();
const mutate = [csrfProtection];

router.get(
  '/carnets',
  requireAuth,
  requirePermission(PERMISOS.CARNETS_VER, PERMISOS.CARNETS_GENERAR),
  carnetsController.list
);

router.get(
  '/carnets/preview',
  requireAuth,
  requirePermission(PERMISOS.CARNETS_GENERAR),
  carnetsController.preview
);

router.get(
  '/carnets/:id/historial',
  requireAuth,
  requirePermission(PERMISOS.CARNETS_VER, PERMISOS.CARNETS_GENERAR),
  carnetsController.getHistorial
);

router.get(
  '/carnets/:id/qr',
  requireAuth,
  requirePermission(PERMISOS.CARNETS_VER, PERMISOS.CARNETS_GENERAR),
  carnetsController.getQr
);

router.post(
  '/carnets/:id/qr/regenerar',
  requireAuth,
  requirePermission(PERMISOS.CARNETS_GENERAR),
  ...mutate,
  carnetsController.regenerarQr
);

router.get(
  '/carnets/:id/documento/preview',
  requireAuth,
  requirePermission(PERMISOS.CARNETS_VER, PERMISOS.CARNETS_GENERAR),
  carnetDocumentoController.preview
);

router.get(
  '/carnets/:id/documento/pdf',
  requireAuth,
  requirePermission(PERMISOS.CARNETS_VER, PERMISOS.CARNETS_GENERAR),
  carnetDocumentoController.downloadPdf
);

router.get(
  '/carnets/:id/documento/historial',
  requireAuth,
  requirePermission(PERMISOS.CARNETS_VER, PERMISOS.CARNETS_GENERAR),
  carnetDocumentoController.getHistorial
);

router.post(
  '/carnets/:id/documento/reimprimir',
  requireAuth,
  requirePermission(PERMISOS.CARNETS_GENERAR),
  ...mutate,
  carnetDocumentoController.reimprimir
);

router.post(
  '/carnets/:id/documento/regenerar',
  requireAuth,
  requirePermission(PERMISOS.CARNETS_GENERAR),
  ...mutate,
  carnetDocumentoController.regenerar
);

router.post(
  '/carnets/:id/documento/registrar-impresion',
  requireAuth,
  requirePermission(PERMISOS.CARNETS_GENERAR),
  ...mutate,
  carnetDocumentoController.registrarImpresion
);

router.get(
  '/carnets/:id',
  requireAuth,
  requirePermission(PERMISOS.CARNETS_VER, PERMISOS.CARNETS_GENERAR),
  carnetsController.getOne
);

router.post(
  '/carnets',
  requireAuth,
  requirePermission(PERMISOS.CARNETS_GENERAR),
  ...mutate,
  carnetsController.create
);

router.put(
  '/carnets/:id',
  requireAuth,
  requirePermission(PERMISOS.CARNETS_GENERAR),
  ...mutate,
  carnetsController.update
);

router.patch(
  '/carnets/:id/suspender',
  requireAuth,
  requirePermission(PERMISOS.CARNETS_SUSPENDER),
  ...mutate,
  carnetsController.suspender
);

router.patch(
  '/carnets/:id/revocar',
  requireAuth,
  requirePermission(PERMISOS.CARNETS_REVOCAR),
  ...mutate,
  carnetsController.revocar
);

router.patch(
  '/carnets/:id/reactivar',
  requireAuth,
  requirePermission(PERMISOS.CARNETS_GENERAR),
  ...mutate,
  carnetsController.reactivar
);

router.patch(
  '/carnets/:id/renovar',
  requireAuth,
  requirePermission(PERMISOS.CARNETS_GENERAR),
  ...mutate,
  carnetsController.renovar
);

module.exports = router;
