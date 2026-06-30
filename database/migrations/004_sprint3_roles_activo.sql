-- Sprint 3 — columna activo en roles (ejecutar una vez si la BD ya existía)
USE sena_carnets;

ALTER TABLE roles
  ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1 AFTER descripcion;

ALTER TABLE roles
  ADD KEY idx_roles_activo (activo);
