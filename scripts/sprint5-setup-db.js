/**
 * Sprint 5 — migración PDF y historial de documentos.
 * Uso: node scripts/sprint5-setup-db.js
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function tryAlter(conn, sql, skipCode = 'ER_DUP_FIELDNAME') {
  try {
    await conn.query(sql);
    return true;
  } catch (err) {
    if (err.code === skipCode) return false;
    throw err;
  }
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sena_carnets',
    multipleStatements: true,
  });

  const alters = [
    ['pdf_generado_at', 'ALTER TABLE carnets ADD COLUMN pdf_generado_at DATETIME NULL AFTER pdf_url'],
    ['pdf_hash', 'ALTER TABLE carnets ADD COLUMN pdf_hash VARCHAR(64) NULL AFTER pdf_generado_at'],
    [
      'template_id',
      "ALTER TABLE carnets ADD COLUMN template_id VARCHAR(50) NOT NULL DEFAULT 'default' AFTER pdf_hash",
    ],
    [
      'reimpresiones_count',
      'ALTER TABLE carnets ADD COLUMN reimpresiones_count INT NOT NULL DEFAULT 0 AFTER template_id',
    ],
  ];

  for (const [name, sql] of alters) {
    if (await tryAlter(conn, sql)) console.log(`OK carnets.${name}`);
    else console.log(`SKIP carnets.${name}`);
  }

  await conn.query(`
    CREATE TABLE IF NOT EXISTS carnet_documentos_historial (
      id            VARCHAR(36) NOT NULL PRIMARY KEY,
      carnet_id     VARCHAR(36) NOT NULL,
      accion        ENUM('GENERAR','DESCARGAR','IMPRIMIR','REIMPRIMIR') NOT NULL,
      usuario_id    VARCHAR(36) NOT NULL,
      detalle_json  JSON         NULL,
      created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY idx_carnet_doc_carnet (carnet_id),
      KEY idx_carnet_doc_fecha (created_at),
      CONSTRAINT fk_carnet_doc_carnet
        FOREIGN KEY (carnet_id) REFERENCES carnets(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT fk_carnet_doc_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
    ) ENGINE=InnoDB
  `);
  console.log('OK carnet_documentos_historial');

  const pdfDir = path.join(__dirname, '../public/uploads/carnets');
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
    console.log('OK public/uploads/carnets');
  }

  await conn.end();
  console.log('SPRINT5_DB_OK');
}

main().catch((err) => {
  console.error('SPRINT5_DB_FAIL', err.message);
  process.exit(1);
});
