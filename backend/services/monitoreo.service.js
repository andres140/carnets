const fs = require('fs');
const path = require('path');
const { testConnection } = require('../config/database');
const sesionesService = require('./sesiones.service');
const auditoriaRepository = require('../repositories/auditoria.repository');
const env = require('../config/env');

function getUploadsSize(dir) {
  let total = 0;
  let files = 0;
  try {
    if (!fs.existsSync(dir)) return { bytes: 0, files: 0 };
    const walk = (d) => {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) walk(full);
        else {
          total += fs.statSync(full).size;
          files += 1;
        }
      }
    };
    walk(dir);
  } catch {
    /* ignore */
  }
  return { bytes: total, files };
}

async function getEstado() {
  let dbOk = false;
  let dbLatencyMs = null;
  const start = Date.now();
  try {
    await testConnection();
    dbOk = true;
    dbLatencyMs = Date.now() - start;
  } catch {
    dbOk = false;
  }

  const uploads = getUploadsSize(path.join(__dirname, '../../public/uploads'));
  const sesionesActivas = await sesionesService.countActivas();
  const eventosSeguridad24h = await auditoriaRepository.countSeguridadReciente(24);

  return {
    timestamp: new Date().toISOString(),
    entorno: env.nodeEnv,
    servicios: {
      mysql: { estado: dbOk ? 'OK' : 'ERROR', latenciaMs: dbLatencyMs },
      api: { estado: 'OK', puerto: env.port },
      sesiones: { estado: 'OK', activas: sesionesActivas },
    },
    almacenamiento: {
      uploadsBytes: uploads.bytes,
      uploadsMb: Math.round((uploads.bytes / (1024 * 1024)) * 100) / 100,
      archivos: uploads.files,
    },
    seguridad: {
      eventos24h: eventosSeguridad24h,
      alerta: eventosSeguridad24h > 10 ? 'ALTA' : eventosSeguridad24h > 3 ? 'MEDIA' : 'BAJA',
    },
  };
}

async function getDiagnosticoSeguridad() {
  const eventos = await auditoriaRepository.findSeguridadReciente(30);
  const rutasProtegidas = [
    '/api/usuarios',
    '/api/carnets',
    '/api/reportes',
    '/api/auditoria',
    '/api/configuracion',
    '/api/sesiones',
    '/api/notificaciones',
  ];

  return {
    rutasCriticas: rutasProtegidas.map((r) => ({ ruta: r, protegida: true })),
    eventosRecientes: eventos.length,
    recomendaciones:
      eventos.length > 5
        ? ['Revisar intentos de acceso fallidos en auditoría de seguridad']
        : ['Sin incidentes críticos recientes'],
  };
}

module.exports = { getEstado, getDiagnosticoSeguridad };
