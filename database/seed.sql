-- ============================================================
-- SENA Carnés — Datos iniciales
-- Ejecutar después de schema.sql
-- ============================================================

USE sena_carnets;

-- Permisos
INSERT INTO permisos (id, codigo, nombre) VALUES
  ('perm-001', 'usuarios.crear',       'Crear usuarios'),
  ('perm-002', 'usuarios.editar',      'Editar usuarios'),
  ('perm-003', 'usuarios.desactivar',  'Desactivar usuarios'),
  ('perm-004', 'usuarios.ver',         'Ver usuarios'),
  ('perm-005', 'carnets.generar',      'Generar carnés'),
  ('perm-006', 'carnets.generar_masivo','Generación masiva'),
  ('perm-007', 'carnets.ver',          'Ver carnés'),
  ('perm-008', 'carnets.revocar',      'Revocar carnés'),
  ('perm-009', 'carnets.suspender',    'Suspender carnés'),
  ('perm-010', 'validar.qr',           'Validar QR'),
  ('perm-011', 'reportes.ver',         'Ver reportes'),
  ('perm-012', 'auditoria.ver',        'Ver auditoría'),
  ('perm-013', 'roles.gestionar',      'Gestionar roles'),
  ('perm-014', 'config.gestionar',     'Gestionar configuración'),
  ('perm-015', 'regionales.ver',       'Ver regionales'),
  ('perm-016', 'regionales.gestionar', 'Gestionar regionales'),
  ('perm-017', 'centros.ver',          'Ver centros'),
  ('perm-018', 'centros.gestionar',    'Gestionar centros'),
  ('perm-019', 'dependencias.ver',     'Ver dependencias'),
  ('perm-020', 'dependencias.gestionar','Gestionar dependencias'),
  ('perm-021', 'permisos.gestionar',   'Gestionar permisos')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Roles
INSERT INTO roles (id, nombre, descripcion) VALUES
  ('rol-admin',       'ADMINISTRADOR', 'Acceso total al sistema'),
  ('rol-coord',       'COORDINADOR',   'Gestión regional'),
  ('rol-func',        'FUNCIONARIO',   'Emisión de carnés'),
  ('rol-instructor',  'INSTRUCTOR',    'Consulta y validación'),
  ('rol-aprendiz',    'APRENDIZ',      'Consulta propio carné'),
  ('rol-contratista', 'CONTRATISTA',   'Consulta propio carné')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

-- Permisos por rol (ADMINISTRADOR = todos)
INSERT IGNORE INTO rol_permisos (rol_id, permiso_id)
SELECT 'rol-admin', id FROM permisos;

INSERT IGNORE INTO rol_permisos (rol_id, permiso_id) VALUES
  ('rol-coord', 'perm-001'), ('rol-coord', 'perm-002'), ('rol-coord', 'perm-003'),
  ('rol-coord', 'perm-004'), ('rol-coord', 'perm-005'), ('rol-coord', 'perm-006'),
  ('rol-coord', 'perm-007'), ('rol-coord', 'perm-008'), ('rol-coord', 'perm-009'),
  ('rol-coord', 'perm-010'), ('rol-coord', 'perm-011'), ('rol-coord', 'perm-012'),
  ('rol-func', 'perm-005'), ('rol-func', 'perm-007'), ('rol-func', 'perm-010'), ('rol-func', 'perm-004'),
  ('rol-instructor', 'perm-007'), ('rol-instructor', 'perm-010'), ('rol-instructor', 'perm-004'),
  ('rol-aprendiz', 'perm-007'),
  ('rol-contratista', 'perm-007');

-- Regional y centro demo
INSERT INTO regionales (id, codigo, nombre) VALUES
  ('reg-001', 'REG01', 'Regional Antioquia')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT INTO centros_formacion (id, regional_id, codigo, nombre) VALUES
  ('ctr-001', 'reg-001', 'CTR001', 'Centro de Servicios y Gestión Empresarial')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT INTO dependencias (id, centro_id, nombre) VALUES
  ('dep-001', 'ctr-001', 'Dirección Regional')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Usuario administrador (contraseña: Admin123!)
INSERT INTO usuarios (
  id, email, password_hash, rol_id, tipo_usuario, estado,
  documento, tipo_documento, nombre_completo,
  regional_id, centro_id
) VALUES (
  'usr-admin',
  'admin@sena.edu.co',
  '$2b$12$EZudd5uK2a1HkMITTMbmRO4A0o.s8IL.h8Xls81K5.UzHjQf97Tqm',
  'rol-admin',
  'ADMINISTRADOR',
  'ACTIVO',
  '1000000001',
  'CC',
  'Administrador Sistema',
  'reg-001',
  'ctr-001'
) ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Usuario coordinador (contraseña: Coord123!)
INSERT INTO usuarios (
  id, email, password_hash, rol_id, tipo_usuario, estado,
  documento, tipo_documento, nombre_completo,
  regional_id, centro_id, dependencia_id, telefono
) VALUES (
  'usr-coord',
  'coord@sena.edu.co',
  '$2b$12$sv2GEZ.OA4P3Ea0Biz0Cl.x/Prl4776vMqK0e2Rj0ijKnv9BzzPmG',
  'rol-coord',
  'COORDINADOR',
  'ACTIVO',
  '1000000002',
  'CC',
  'María Coordinadora',
  'reg-001',
  'ctr-001',
  'dep-001',
  '3001234567'
) ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Usuarios de prueba
INSERT INTO usuarios (
  id, email, password_hash, rol_id, tipo_usuario, estado,
  documento, tipo_documento, nombre_completo,
  regional_id, centro_id, telefono
) VALUES
(
  'usr-aprendiz-1',
  'aprendiz1@sena.edu.co',
  '$2b$12$EZudd5uK2a1HkMITTMbmRO4A0o.s8IL.h8Xls81K5.UzHjQf97Tqm',
  'rol-aprendiz',
  'APRENDIZ',
  'ACTIVO',
  '1090123456',
  'CC',
  'Carlos Aprendiz',
  'reg-001',
  'ctr-001',
  '3009876543'
),
(
  'usr-instructor-1',
  'instructor1@sena.edu.co',
  '$2b$12$EZudd5uK2a1HkMITTMbmRO4A0o.s8IL.h8Xls81K5.UzHjQf97Tqm',
  'rol-instructor',
  'INSTRUCTOR',
  'INACTIVO',
  '80123456',
  'CC',
  'Ana Instructora',
  'reg-001',
  'ctr-001',
  '3005551234'
)
ON DUPLICATE KEY UPDATE email = VALUES(email);
