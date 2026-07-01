# RELEASE_NOTES.md — SENA Carnés

Historial completo de funcionalidades desde Sprint 0 hasta v1.0.0.

---

## v1.0.0 — Release Candidate (2026-07-01)

### Sprint 10 — RC1, optimización y preparación producción

- Script unificado `npm run setup:db` (schema + seed + migraciones)
- Verificación integral `npm run verify:rc1` (9 suites)
- Documentación completa: INSTALL, API, DATABASE, USER, DEPLOY, VERSION
- Corrección bug admin en recuperación de contraseña (`rol` → `tipoUsuario`)
- Validación de secretos en producción (`SESSION_SECRET`, `QR_SIGNING_KEY`)
- CSRF + rate limit en rutas 2FA
- Bloqueo upload SVG (prevención XSS)
- Utilidad `escapeHtml` para prevención XSS en frontend
- Eliminación código muerto (`notificationService.js`)
- Rate limit login ampliado en desarrollo para suites de prueba
- Tests unitarios corregidos (aislamiento de datos)
- README reescrito para stack Express activo
- `.env.example` creado

---

## v0.9.0 — Sprint 9 (2026-07-01)

### Auditoría, configuración y notificaciones

- Bitácora ampliada: rol, módulo, resultado, IP, user-agent
- UI `/auditoria.html` con filtros y paginación
- UI `/sistema.html`: config, sesiones, monitoreo, notificaciones
- Tablas: `configuracion_sistema`, `notificaciones`, `sesiones_usuario`
- API: `/api/auditoria`, `/api/configuracion`, `/api/notificaciones`, `/api/sesiones`, `/api/monitoreo`
- Middleware `sessionGuard` para revocación de sesiones
- Campana de notificaciones en navbar
- Notificaciones automáticas: vencimientos, sin foto, exportaciones, config, seguridad

---

## v0.8.0 — Sprint 8 (2026-07-01)

### Reportes institucionales

- Centro de reportes `/reportes.html` (5 pestañas)
- API `/api/reportes/*` con alcance por rol
- Exportación CSV, Excel (.xlsx), PDF
- Búsqueda avanzada con filtros combinables
- Gráficas Chart.js en resumen
- Auditoría `EXPORTAR_REPORTE`

---

## v0.7.0 — Sprint 7 (2026-07-01)

### Dashboard ejecutivo

- Dashboard con KPIs en tiempo real
- Gráficas: carnés por estado, usuarios por regional, emisiones, validaciones
- Alertas: próximos a vencer, sin foto
- Accesos rápidos por permisos
- Auto-refresh 60 segundos
- Alcance por rol (nacional/regional/centro/personal)

---

## v0.6.0 — Sprint 6 (2026-07-01)

### Validación QR pública

- Endpoint público `GET /api/validar/:token`
- Página `/validar.html` con escáner de cámara
- Token QR firmado HMAC
- Rate limiting 100 req/hora
- Log en `validaciones_qr`
- Respuesta sanitizada (sin datos sensibles completos)

---

## v0.5.0 — Sprint 5 (2026-07-01)

### PDF e impresión

- Generación PDF con Puppeteer + plantilla EJS
- Vista previa HTML del carné
- Descarga, impresión y reimpresión registradas
- Historial `carnet_documentos_historial`
- Caché de PDF por hash

---

## v0.4.0 — Sprint 4 (2026-07-01)

### Módulo de carnés

- Emisión con snapshot de datos del usuario
- Código único `{REGIONAL}-{AÑO}-{SEQ}`
- Estados: ACTIVO, VENCIDO, SUSPENDIDO, REVOCADO
- Renovar, suspender, reactivar, revocar
- Historial de cambios
- Un carné activo por usuario

---

## v0.3.0 — Sprint 3 (2026-07-01)

### Organización y roles

- CRUD regionales, centros, dependencias
- CRUD roles con asignación de permisos
- UI `/organizacion.html`
- Catálogos para formularios
- Desactivación/reactivación de entidades

---

## v0.2.0 — Sprint 2 (2026-07-01)

### Gestión de usuarios

- CRUD completo con foto (multer)
- Filtros, búsqueda, paginación
- Validación documento único, email único
- Alcance regional para coordinadores
- UI `/usuarios.html`

---

## v0.1.0 — Sprint 0–1 (2026-07-01)

### Fundamentos

- Autenticación login/logout con bcrypt
- Sesiones express-session + CSRF
- RBAC con roles y permisos
- Esquema MySQL + seed demo
- Estructura Routes → Controllers → Services
- Rate limiting, security headers
- Páginas login y dashboard base

---

## Quality Gate (pre-Sprint 8)

- Fix rate limit namespaces (login no fallaba en 2.º intento)
- Fix `securityAuditService` async + UUID
- Fix 2FA verify-login sin exponer `password_hash`

---

## Stack tecnológico final

| Capa | Tecnología |
|------|------------|
| Runtime | Node.js 20 |
| Backend | Express 4 |
| BD | MySQL 8 (mysql2) |
| Frontend | HTML + Bootstrap 5 + JavaScript |
| PDF | Puppeteer + EJS |
| QR | qrcode + HMAC |
| Reportes | xlsx + PDF custom |
| Gráficas | Chart.js 4 |

---

## Créditos

Proyecto académico — Servicio Nacional de Aprendizaje (SENA)  
Desarrollo iterativo en 10 Sprints (Sprint 0 – Sprint 10)
