-- Sprint 9 — Auditoría avanzada, configuración, notificaciones y sesiones
USE sena_carnets;

-- Ampliar bitácora general
ALTER TABLE auditoria
  ADD COLUMN IF NOT EXISTS rol_nombre VARCHAR(100) NULL AFTER usuario_id,
  ADD COLUMN IF NOT EXISTS modulo VARCHAR(100) NULL AFTER accion,
  ADD COLUMN IF NOT EXISTS resultado VARCHAR(20) NOT NULL DEFAULT 'EXITO' AFTER modulo,
  ADD COLUMN IF NOT EXISTS user_agent VARCHAR(500) NULL AFTER ip;

ALTER TABLE auditoria ADD INDEX IF NOT EXISTS idx_auditoria_modulo (modulo);
ALTER TABLE auditoria ADD INDEX IF NOT EXISTS idx_auditoria_accion (accion);
ALTER TABLE auditoria ADD INDEX IF NOT EXISTS idx_auditoria_resultado (resultado);

-- Configuración del sistema (clave-valor)
CREATE TABLE IF NOT EXISTS configuracion_sistema (
  clave         VARCHAR(100) NOT NULL PRIMARY KEY,
  valor         TEXT         NOT NULL,
  tipo          VARCHAR(50)  NOT NULL DEFAULT 'string',
  descripcion   VARCHAR(255) NULL,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by    VARCHAR(36)  NULL,
  CONSTRAINT fk_config_updated_by
    FOREIGN KEY (updated_by) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- Notificaciones internas
CREATE TABLE IF NOT EXISTS notificaciones (
  id          VARCHAR(36)  NOT NULL PRIMARY KEY,
  usuario_id  VARCHAR(36)  NULL,
  tipo        VARCHAR(50)  NOT NULL,
  titulo      VARCHAR(200) NOT NULL,
  mensaje     TEXT         NOT NULL,
  leida       TINYINT(1)   NOT NULL DEFAULT 0,
  metadata    JSON         NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notif_usuario (usuario_id),
  KEY idx_notif_leida (leida),
  KEY idx_notif_tipo (tipo),
  KEY idx_notif_fecha (created_at),
  CONSTRAINT fk_notif_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Registro de sesiones de usuario
CREATE TABLE IF NOT EXISTS sesiones_usuario (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  usuario_id    VARCHAR(36)  NOT NULL,
  session_id    VARCHAR(128) NOT NULL,
  ip            VARCHAR(45)  NULL,
  user_agent    VARCHAR(500) NULL,
  device_label  VARCHAR(200) NULL,
  activa        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at     DATETIME     NULL,
  UNIQUE KEY uk_sesion_session (session_id),
  KEY idx_sesiones_usuario (usuario_id),
  KEY idx_sesiones_activa (activa),
  CONSTRAINT fk_sesiones_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Valores por defecto de configuración
INSERT INTO configuracion_sistema (clave, valor, tipo, descripcion) VALUES
  ('institucion_nombre', 'Servicio Nacional de Aprendizaje — SENA', 'string', 'Nombre de la institución'),
  ('logo_url', '/uploads/placeholder-logo.png', 'string', 'URL del logo institucional'),
  ('session_max_age_ms', '28800000', 'number', 'Duración de sesión en milisegundos (8h)'),
  ('carnet_vigencia_anos', '1', 'number', 'Años de vigencia predeterminada del carné'),
  ('carnet_codigo_formato', '{REGIONAL}-{YEAR}-{SEQ}', 'string', 'Formato de numeración de carné'),
  ('upload_max_mb', '5', 'number', 'Tamaño máximo de fotografías en MB'),
  ('idioma', 'es', 'string', 'Código de idioma (preparado para i18n)'),
  ('timezone', 'America/Bogota', 'string', 'Zona horaria del sistema')
ON DUPLICATE KEY UPDATE clave = clave;
