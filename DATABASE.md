# Modelo de Datos — SENA Carnés

Base de datos: **MySQL 8** · Charset: **utf8mb4**

Scripts: [`database/schema.sql`](database/schema.sql) · [`database/seed.sql`](database/seed.sql)

## Diagrama relacional (resumen)

```
regionales 1──N centros_formacion 1──N dependencias
roles 1──N usuarios
roles N──M permisos (rol_permisos)
usuarios 1──N carnets
carnets 1──N historial_carnets
carnets 1──N validaciones_qr
usuarios 1──N auditoria
```

## Tablas

### regionales
| Campo | Tipo | Notas |
|-------|------|-------|
| id | VARCHAR(36) PK | UUID |
| codigo | VARCHAR(10) UNIQUE | Ej: REG01 |
| nombre | VARCHAR(200) | |
| activo | TINYINT(1) | Default 1 |

### centros_formacion
| Campo | Tipo | Notas |
|-------|------|-------|
| id | VARCHAR(36) PK | |
| regional_id | VARCHAR(36) FK | → regionales |
| codigo | VARCHAR(20) UNIQUE | Ej: CTR001 |
| nombre | VARCHAR(200) | |

### dependencias
| Campo | Tipo | Notas |
|-------|------|-------|
| id | VARCHAR(36) PK | |
| centro_id | VARCHAR(36) FK | → centros_formacion |
| nombre | VARCHAR(200) | |

### roles / permisos / rol_permisos
RBAC granular. Permisos como `usuarios.crear`, `carnets.generar`, etc.

### usuarios (Módulo 2)

| Campo | Tipo | Notas |
|-------|------|-------|
| email | VARCHAR(255) UNIQUE | Login |
| password_hash | VARCHAR(255) | bcrypt |
| nombre_completo | VARCHAR(300) | Nombres + apellidos concatenados |
| tipo_usuario | ENUM | Derivado del rol |
| estado | ENUM | ACTIVO, INACTIVO, SUSPENDIDO |
| documento | VARCHAR(50) UNIQUE | Validación en API |
| foto_url | VARCHAR(500) | Ruta `/uploads/...` |
| telefono | VARCHAR(30) | Opcional |
| regional_id | FK nullable | → regionales |
| centro_id | FK nullable | → centros_formacion |
| dependencia_id | FK nullable | → dependencias |
| deactivated_at | DATETIME | Set al desactivar |

**Relaciones verificadas:** centro pertenece a regional; dependencia pertenece a centro (validado en `users.service.js`).

### carnets
Snapshot al emitir. Código único: `REG01-2026-000001`.

| Campo | Tipo | Notas |
|-------|------|-------|
| codigo_unico | VARCHAR(50) UNIQUE | |
| qr_token | VARCHAR(255) UNIQUE | Token firmado |
| estado | ENUM | ACTIVO, VENCIDO, SUSPENDIDO, REVOCADO |
| fecha_expedicion, fecha_vencimiento | DATE | |

### historial_carnets
Cambios de estado con motivo y usuario responsable.

### validaciones_qr

Auditoría de todas las validaciones QR realizadas.

| Campo | Tipo | Notas |
|-------|------|-------|
| id | VARCHAR(36) PK | UUID |
| carnet_id | VARCHAR(36) FK | → carnets |
| ip | VARCHAR(50) | Dirección IP del validador |
| resultado | VARCHAR(50) | `valido`, `estado`, `no_encontrado`, `token_invalido` |
| usuario_id | VARCHAR(36) FK nullable | Usuario autenticado (si aplica) |
| created_at | DATETIME | Timestamp de validación |

**Propósito:** Trazabilidad completa de todos los escaneos QR y validaciones. Registra intentos fallidos, consultantes (IP), y si fue validado por usuario autenticado.

### auditoria
Log de acciones: LOGIN, LOGOUT, CRUD, etc. Campo `detalle_json` (JSON).

## Índices principales

- `usuarios`: email, documento, estado, regional_id
- `carnets`: codigo_unico, qr_token, estado, fecha_vencimiento
- `auditoria`: created_at, entidad, usuario_id

## Seed

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Admin | admin@sena.edu.co | Admin123! | ADMINISTRADOR |
| Coordinador | coord@sena.edu.co | Coord123! | COORDINADOR |
| Aprendiz demo | aprendiz1@sena.edu.co | Admin123! | APRENDIZ |
| Instructor demo | instructor1@sena.edu.co | Admin123! | INSTRUCTOR (INACTIVO) |

Roles: ADMINISTRADOR, COORDINADOR, FUNCIONARIO, INSTRUCTOR, APRENDIZ, CONTRATISTA.

## Consultas útiles (Módulo 2)

```sql
-- Listar usuarios con joins (equivalente al servicio)
SELECT u.documento, u.nombre_completo, u.email, u.estado,
       r.nombre AS rol, reg.nombre AS regional, c.nombre AS centro
FROM usuarios u
JOIN roles r ON r.id = u.rol_id
LEFT JOIN regionales reg ON reg.id = u.regional_id
LEFT JOIN centros_formacion c ON c.id = u.centro_id
ORDER BY u.created_at DESC;

-- Verificar unicidad antes de insertar
SELECT id FROM usuarios WHERE email = ? OR documento = ?;
```

## Consultas útiles (Módulo 4 - QR)

```sql
-- Validar carné por token QR
SELECT c.id, c.codigo_unico, c.estado, c.fecha_vencimiento,
       u.nombre_completo, u.documento, u.foto_url,
       cfm.nombre AS centro_nombre,
       reg.nombre AS regional_nombre
FROM carnets c
JOIN usuarios u ON u.id = c.usuario_id
LEFT JOIN centros_formacion cfm ON cfm.id = u.centro_id
LEFT JOIN regionales reg ON reg.id = u.regional_id
WHERE c.qr_token = ?;

-- Auditoría: últimas validaciones
SELECT c.codigo_unico, vqr.resultado, vqr.ip, vqr.created_at
FROM validaciones_qr vqr
JOIN carnets c ON c.id = vqr.carnet_id
ORDER BY vqr.created_at DESC
LIMIT 50;

-- Contar validaciones por estado
SELECT c.estado, COUNT(*) as total
FROM validaciones_qr vqr
JOIN carnets c ON c.id = vqr.carnet_id
WHERE vqr.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY c.estado;
```
