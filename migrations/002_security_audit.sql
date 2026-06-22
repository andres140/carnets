-- Migration: Add security audit table for tracking security events
-- Created: 2024
-- Purpose: Log security-related events (rate limit exceeded, CSRF failures, etc.)

CREATE TABLE IF NOT EXISTS auditoria_seguridad (
  id              VARCHAR(36)  NOT NULL PRIMARY KEY,
  tipo            VARCHAR(100) NOT NULL,
  usuario_id      VARCHAR(36)  NULL,
  ip              VARCHAR(45)  NULL,
  detalles        JSON         NULL,
  fecha_creacion  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  KEY idx_tipo (tipo),
  KEY idx_usuario_id (usuario_id),
  KEY idx_ip (ip),
  KEY idx_fecha_creacion (fecha_creacion),
  
  CONSTRAINT fk_auditoria_seguridad_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- Add QR-related fields to carnets table if they don't exist
ALTER TABLE carnets ADD COLUMN IF NOT EXISTS token_qr VARCHAR(255) UNIQUE NULL;
ALTER TABLE carnets ADD COLUMN IF NOT EXISTS fecha_generacion_qr DATETIME NULL;
ALTER TABLE carnets ADD COLUMN IF NOT EXISTS fecha_actualizacion_qr DATETIME NULL;
