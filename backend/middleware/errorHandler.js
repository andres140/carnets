function notFoundHandler(req, res) {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'Ruta no encontrada' });
  }
  res.status(404).send(`<h1>404</h1><p>Página no encontrada: ${req.path}</p>`);
}

function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err);

  if (res.headersSent) return next(err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    err.status = 400;
    err.message = 'La foto excede el tamaño máximo permitido';
  }
  if (err.message === 'Tipo de archivo no permitido') {
    err.status = 400;
  }

  const status = err.status || 500;
  const message =
    status === 500 && process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message || 'Error interno del servidor';

  if (req.originalUrl.startsWith('/api') || req.get('Accept')?.includes('application/json')) {
    return res.status(status).json({ success: false, error: message });
  }

  return res.status(status).send(`<h1>Error ${status}</h1><p>${message}</p>`);
}

module.exports = { notFoundHandler, errorHandler };
