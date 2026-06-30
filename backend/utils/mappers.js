/**
 * Mapeo HTTP (req) → DTOs de servicio.
 */

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

module.exports = { parseUserBody };
