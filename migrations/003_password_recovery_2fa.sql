-- Migration: Add password reset tokens table
-- Created: 2024
-- Purpose: Store temporary password reset tokens for recovering forgotten passwords

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  usuario_id    VARCHAR(36)  NOT NULL,
  token         VARCHAR(255) NOT NULL UNIQUE,
  token_hash    VARCHAR(255) NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL,
  expires_at    DATETIME     NOT NULL,
  used_at       DATETIME     NULL,
  ip_address    VARCHAR(45)  NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  KEY idx_token (token_hash),
  KEY idx_usuario_id (usuario_id),
  KEY idx_email (email),
  KEY idx_expires_at (expires_at),
  
  CONSTRAINT fk_password_reset_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Add columns to track 2FA configuration
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS two_factor_method ENUM('NONE', 'EMAIL', 'TOTP', 'SMS') DEFAULT 'NONE';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255) NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS two_factor_backup_codes JSON NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS two_factor_verified_at DATETIME NULL;

-- Add columns to track email notifications preference
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS notification_preferences JSON NULL;
