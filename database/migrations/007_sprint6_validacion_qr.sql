-- Sprint 6 — Validación QR pública
USE sena_carnets;

ALTER TABLE validaciones_qr MODIFY carnet_id VARCHAR(36) NULL;

SET @col_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'validaciones_qr'
    AND COLUMN_NAME = 'token_intentado'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE validaciones_qr ADD COLUMN token_intentado VARCHAR(255) NULL AFTER carnet_id',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Re-crear FK con ON DELETE SET NULL (si aplica)
-- En instalaciones nuevas schema.sql ya tiene la definición correcta.
