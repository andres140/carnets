const crypto = require('crypto');
const carnetsRepository = require('../repositories/carnets.repository');
const qrService = require('../services/qr.service');
const { createAppError } = require('./errors');

async function generateCodigoUnico(regionalCodigo) {
  const year = new Date().getFullYear();
  const prefix = `${regionalCodigo || 'REG00'}-${year}-`;

  for (let attempt = 0; attempt < 10; attempt++) {
    const count = await carnetsRepository.countByCodigoPrefix(prefix);
    const sequence = String(count + 1 + attempt).padStart(6, '0');
    const codigo = `${prefix}${sequence}`;
    if (!(await carnetsRepository.codigoExists(codigo))) {
      return codigo;
    }
  }

  throw createAppError('No se pudo generar un código único para el carné', 500);
}

function generateQrPlaceholderToken() {
  return qrService.generateToken();
}

async function generateUniqueQrToken() {
  return qrService.generateUniqueToken((token) => carnetsRepository.qrTokenExists(token));
}

module.exports = { generateCodigoUnico, generateQrPlaceholderToken, generateUniqueQrToken };
