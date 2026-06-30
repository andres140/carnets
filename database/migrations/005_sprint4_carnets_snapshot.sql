-- Sprint 4 — campos snapshot adicionales en carnets
USE sena_carnets;

ALTER TABLE carnets
  ADD COLUMN tipo_documento VARCHAR(20) NOT NULL DEFAULT 'CC' AFTER documento;

ALTER TABLE carnets
  ADD COLUMN dependencia_nombre VARCHAR(200) NULL AFTER regional_nombre;
