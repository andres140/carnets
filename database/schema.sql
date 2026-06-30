-- ============================================================
-- SENA Carnés — Esquema MySQL
-- Sistema de Gestión y Generación de Carnés Institucionales
-- ============================================================

CREATE DATABASE IF NOT EXISTS sena_carnets
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sena_carnets;

-- ------------------------------------------------------------
-- Catálogos organizacionales
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS regionales (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  codigo        VARCHAR(10)  NOT NULL,
  nombre        VARCHAR(200) NOT NULL,
  
  activo        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_regionales_codigo (codigo),
  KEY idx_regionales_activo (activo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS centros_formacion (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  regional_id   VARCHAR(36)  NOT NULL,
  codigo        VARCHAR(20)  NOT NULL,
  nombre        VARCHAR(200) NOT NULL,
  activo        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_centros_codigo (codigo),
  KEY idx_centros_regional (regional_id),
  KEY idx_centros_activo (activo),
  CONSTRAINT fk_centros_regional
    FOREIGN KEY (regional_id) REFERENCES regionales(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS dependencias (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  centro_id     VARCHAR(36)  NOT NULL,
  nombre        VARCHAR(200) NOT NULL,
  activo        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_dependencias_centro (centro_id),
  CONSTRAINT fk_dependencias_centro
    FOREIGN KEY (centro_id) REFERENCES centros_formacion(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Seguridad y roles
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  nombre        VARCHAR(50)  NOT NULL,
  descripcion   VARCHAR(500) NULL,
  activo        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_roles_nombre (nombre),
  KEY idx_roles_activo (activo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS permisos (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  codigo        VARCHAR(100) NOT NULL,
  nombre        VARCHAR(200) NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_permisos_codigo (codigo)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rol_permisos (
  rol_id        VARCHAR(36) NOT NULL,
  permiso_id    VARCHAR(36) NOT NULL,
  PRIMARY KEY (rol_id, permiso_id),
  CONSTRAINT fk_rol_permisos_rol
    FOREIGN KEY (rol_id) REFERENCES roles(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_rol_permisos_permiso
    FOREIGN KEY (permiso_id) REFERENCES permisos(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Usuarios
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS usuarios (
  id              VARCHAR(36)  NOT NULL PRIMARY KEY,
  email           VARCHAR(255) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  rol_id          VARCHAR(36)  NOT NULL,
  tipo_usuario    ENUM(
                    'APRENDIZ','INSTRUCTOR','FUNCIONARIO',
                    'CONTRATISTA','COORDINADOR','ADMINISTRADOR'
                  ) NOT NULL,
  estado          ENUM('ACTIVO','INACTIVO','SUSPENDIDO') NOT NULL DEFAULT 'ACTIVO',
  documento       VARCHAR(50)  NOT NULL,
  tipo_documento  VARCHAR(20)  NOT NULL DEFAULT 'CC',
  nombre_completo VARCHAR(300) NOT NULL,
  foto_url        VARCHAR(500) NULL,
  regional_id     VARCHAR(36)  NULL,
  centro_id       VARCHAR(36)  NULL,
  dependencia_id  VARCHAR(36)  NULL,
  telefono        VARCHAR(30)  NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deactivated_at  DATETIME     NULL,
  UNIQUE KEY uk_usuarios_email (email),
  UNIQUE KEY uk_usuarios_documento (documento),
  KEY idx_usuarios_rol (rol_id),
  KEY idx_usuarios_regional (regional_id),
  KEY idx_usuarios_centro (centro_id),
  KEY idx_usuarios_estado (estado),
  KEY idx_usuarios_tipo (tipo_usuario),
  CONSTRAINT fk_usuarios_rol
    FOREIGN KEY (rol_id) REFERENCES roles(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_usuarios_regional
    FOREIGN KEY (regional_id) REFERENCES regionales(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_usuarios_centro
    FOREIGN KEY (centro_id) REFERENCES centros_formacion(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_usuarios_dependencia
    FOREIGN KEY (dependencia_id) REFERENCES dependencias(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Carnés
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS carnets (
  id                VARCHAR(36)  NOT NULL PRIMARY KEY,
  codigo_unico      VARCHAR(50)  NOT NULL,
  usuario_id        VARCHAR(36)  NOT NULL,
  estado            ENUM('ACTIVO','VENCIDO','SUSPENDIDO','REVOCADO') NOT NULL DEFAULT 'ACTIVO',
  fecha_expedicion  DATE         NOT NULL,
  fecha_vencimiento DATE         NOT NULL,
  qr_token          VARCHAR(255) NOT NULL,
  foto_url          VARCHAR(500) NULL,
  nombre_completo   VARCHAR(300) NOT NULL,
  documento         VARCHAR(50)  NOT NULL,
  tipo_documento    VARCHAR(20)  NOT NULL DEFAULT 'CC',
  tipo_usuario      ENUM(
                      'APRENDIZ','INSTRUCTOR','FUNCIONARIO',
                      'CONTRATISTA','COORDINADOR','ADMINISTRADOR'
                    ) NOT NULL,
  centro_nombre     VARCHAR(200) NULL,
  regional_nombre   VARCHAR(200) NULL,
  dependencia_nombre VARCHAR(200) NULL,
  pdf_url           VARCHAR(500) NULL,
  pdf_generado_at   DATETIME     NULL,
  pdf_hash          VARCHAR(64)  NULL,
  template_id       VARCHAR(50)  NOT NULL DEFAULT 'default',
  reimpresiones_count INT        NOT NULL DEFAULT 0,
  emitido_por_id    VARCHAR(36)  NOT NULL,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_carnets_codigo (codigo_unico),
  UNIQUE KEY uk_carnets_qr (qr_token),
  KEY idx_carnets_usuario (usuario_id),
  KEY idx_carnets_estado (estado),
  KEY idx_carnets_vencimiento (fecha_vencimiento),
  CONSTRAINT fk_carnets_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_carnets_emitido_por
    FOREIGN KEY (emitido_por_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

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
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS historial_carnets (
  id              VARCHAR(36) NOT NULL PRIMARY KEY,
  carnet_id       VARCHAR(36) NOT NULL,
  estado_anterior ENUM('ACTIVO','VENCIDO','SUSPENDIDO','REVOCADO') NULL,
  estado_nuevo    ENUM('ACTIVO','VENCIDO','SUSPENDIDO','REVOCADO') NOT NULL,
  motivo          VARCHAR(500) NULL,
  usuario_id      VARCHAR(36) NOT NULL,
  created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_historial_carnet (carnet_id),
  KEY idx_historial_fecha (created_at),
  CONSTRAINT fk_historial_carnet
    FOREIGN KEY (carnet_id) REFERENCES carnets(id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_historial_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS validaciones_qr (
  id               VARCHAR(36) NOT NULL PRIMARY KEY,
  carnet_id        VARCHAR(36) NULL,
  token_intentado  VARCHAR(255) NULL,
  ip               VARCHAR(45) NULL,
  resultado        VARCHAR(50) NOT NULL,
  usuario_id       VARCHAR(36) NULL,
  created_at       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_validaciones_carnet (carnet_id),
  KEY idx_validaciones_fecha (created_at),
  KEY idx_validaciones_resultado (resultado),
  CONSTRAINT fk_validaciones_carnet
    FOREIGN KEY (carnet_id) REFERENCES carnets(id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_validaciones_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Auditoría y cargas masivas
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS auditoria (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  usuario_id    VARCHAR(36)  NULL,
  accion        VARCHAR(100) NOT NULL,
  entidad       VARCHAR(100) NOT NULL,
  entidad_id    VARCHAR(100) NULL,
  detalle_json  JSON         NULL,
  ip            VARCHAR(45)  NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_auditoria_fecha (created_at),
  KEY idx_auditoria_entidad (entidad),
  KEY idx_auditoria_usuario (usuario_id),
  CONSTRAINT fk_auditoria_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cargas_masivas (
  id          VARCHAR(36)  NOT NULL PRIMARY KEY,
  archivo     VARCHAR(500) NOT NULL,
  total       INT          NOT NULL DEFAULT 0,
  exitos      INT          NOT NULL DEFAULT 0,
  errores     INT          NOT NULL DEFAULT 0,
  detalle     JSON         NULL,
  usuario_id  VARCHAR(36)  NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_cargas_usuario (usuario_id),
  CONSTRAINT fk_cargas_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;
