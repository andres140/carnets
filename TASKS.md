# TASKS — SENA Carnés

Checklist de tareas del proyecto. Actualizado tras Sprint 10 (v1.0.0 RC1) del 2026-07-01.

**Leyenda:** `[x]` terminado · `[ ]` pendiente · `[~]` parcial

---

## Fase 0 — Fundación

- [x] Arquitectura Express + Bootstrap definida
- [x] Script SQL completo (`database/schema.sql`)
- [x] Seed inicial (`database/seed.sql`)
- [x] Conexión MySQL (mysql2 pool)
- [x] Variables de entorno (`.env.example`)
- [x] Docker Compose para MySQL
- [x] Documentación base (README, DATABASE, ROADMAP, CHANGELOG)
- [x] `package.json` con todas las dependencias declaradas
- [ ] Migraciones de seguridad integradas en schema principal

---

## Sprint 0 — Estabilización ✅ (2026-06-26)

- [x] Validar hallazgos de auditoría
- [x] Corregir INSERT coordinador en `seed.sql`
- [x] Revisar `schema.sql` (sin cambios necesarios)
- [x] Alinear configuración MySQL local (`.env`, docker-compose)
- [x] Completar `package.json` (sin sqlite3)
- [x] Integrar CSRF en frontend (login funcional)
- [x] Actualizar textos obsoletos index/dashboard
- [x] Verificar npm install, npm run dev, login admin/coord
- [x] `SPRINT_0_REPORT.md`
- [ ] Actualizar README.md al stack Express (pendiente)

---

## Fase 1 — Autenticación

- [x] POST `/api/auth/login`
- [x] POST `/api/auth/logout`
- [x] GET `/api/auth/me`
- [x] Middleware `requireAuth`, `requireRole`
- [x] Página `login.html` + `login.js`
- [x] Sesión con express-session + bcrypt
- [x] Auditoría LOGIN/LOGOUT
- [x] Middleware seguridad (headers, rate limit, CSRF) — backend
- [x] Integración CSRF en frontend (`api.js`, `login.js`)
- [x] Login funcional end-to-end verificado
- [~] Recuperación de contraseña (backend parcial, sin UI)
- [~] 2FA (backend parcial, sin UI)
- [ ] Tarjeta credenciales demo en login (modo desarrollo)

---

## Sprint 1 — Consolidación arquitectónica ✅ (2026-06-26)

- [x] Capa `repositories/` (users)
- [x] Carpeta `constants/`
- [x] Utilidades compartidas (request, pagination, permissions, validators, asyncHandler, mappers)
- [x] Separar catalog.controller + catalog.routes
- [x] Estandarizar nombres `*.controller.js` / `*.service.js`
- [x] Filtro regional coordinador en users.service
- [x] CSRF en mutaciones usuarios
- [x] Organizar assets public (js/, css/)
- [x] `SPRINT_1_REPORT.md`

---

## Sprint 2 — Gestión de usuarios ✅ (2026-06-26)

- [x] CRUD completo con eliminación lógica (desactivar/reactivar)
- [x] Permisos granulares (`requirePermission` por operación)
- [x] Validaciones backend ampliadas (documento, teléfono, foto, tipo documento)
- [x] Validaciones frontend (formulario y foto)
- [x] Filtros combinables (estado, tipo, regional, centro, dependencia, rol)
- [x] Búsqueda por nombre, documento, correo
- [x] Paginación en listado
- [x] Auditoría con diff de cambios en actualización
- [x] Alcance coordinador en crear/editar (regional forzada)
- [x] UX: toasts, spinners, confirmaciones
- [x] Fix LIMIT/OFFSET mysql2 en repository
- [x] `scripts/sprint2-verify-usuarios.js`
- [x] `SPRINT_2_REPORT.md`

---

## Fase 2 — Gestión de Usuarios ✅

- [x] GET `/api/usuarios` (listado paginado)
- [x] GET `/api/usuarios/:id` (detalle)
- [x] POST `/api/usuarios` (crear con foto)
- [x] PUT `/api/usuarios/:id` (editar)
- [x] PATCH `/api/usuarios/:id/desactivar`
- [x] PATCH `/api/usuarios/:id/reactivar`
- [x] Catálogos: roles, regionales, centros, dependencias
- [x] Validaciones de entrada (`validate.js`)
- [x] Validación FKs (regional → centro → dependencia)
- [x] Unicidad email y documento
- [x] Upload foto con multer
- [x] Auditoría CREAR/ACTUALIZAR/DESACTIVAR/REACTIVAR
- [x] UI `usuarios.html` con filtros, paginación, modal CRUD
- [x] Ruta protegida `/usuarios.html`
- [x] Filtro por `regional_id` para rol COORDINADOR
- [x] `requirePermission` en rutas de usuarios
- [x] CRUD usuarios verificado end-to-end con MySQL
- [x] Corregir INSERT coordinador en `seed.sql`

---

## Sprint 3 — Organización y control de accesos ✅ (2026-06-26)

- [x] CRUD regionales (código único, desactivar/reactivar)
- [x] CRUD centros (regional obligatoria, integridad)
- [x] CRUD dependencias (centro obligatorio, integridad)
- [x] CRUD roles (activo, no desactivar con usuarios)
- [x] Gestión permisos y asignación a roles
- [x] Permisos granulares organizacionales en constants y seed
- [x] Control acceso: usuario activo + permisos por ruta
- [x] Auditoría en todas las mutaciones organizacionales
- [x] UI `organizacion.html` (5 pestañas, filtros, paginación)
- [x] Integración catálogos con módulo usuarios
- [x] `roles.activo` en schema + migración 004
- [x] `scripts/sprint3-setup-db.js` y `sprint3-verify-organizacion.js`
- [x] `SPRINT_3_REPORT.md`

---

## Fase 2.5 — Estructura organizacional ✅

- [x] API `/api/regionales`, `/api/centros`, `/api/dependencias`
- [x] API `/api/roles`, `/api/permisos`
- [x] Catálogos activos para formularios de usuarios
- [x] Validación rol activo al asignar usuario
- [x] Página `/organizacion.html` protegida por permisos

---

---

## Sprint 4 — Generación de carnés ✅ (2026-06-26)

- [x] CRUD carnés (emitir, consultar, editar, suspender, revocar, reactivar, renovar)
- [x] Generación automática desde usuario (snapshot)
- [x] Código único `REG01-2026-000001`
- [x] Estados y transiciones validadas
- [x] Vista previa antes de emitir
- [x] Plantilla temporal HTML (QR/firma placeholder)
- [x] Historial en `historial_carnets`
- [x] Permisos granulares por operación
- [x] Integración usuarios + auditoría
- [x] UI `carnets.html`
- [x] `scripts/sprint4-setup-db.js` y `sprint4-verify-carnets.js`
- [x] `SPRINT_4_REPORT.md`

---

## Sprint 5 — PDF e impresión ✅ (2026-06-26)

- [x] Motor de plantillas desacoplado (EJS + config.json)
- [x] Plantilla temporal anverso/reverso (CR80, calidad impresión)
- [x] Generación PDF con Puppeteer
- [x] Descarga PDF con caché por hash de datos
- [x] Vista previa HTML e impresión desde navegador
- [x] Reimpresión sin nuevo registro de carné
- [x] Historial `carnet_documentos_historial`
- [x] Validaciones antes de generar documento
- [x] Invalidación caché al editar/renovar/cambiar estado
- [x] Placeholders QR/firma para Sprint 6
- [x] UI botones PDF en `carnets.html`
- [x] `scripts/sprint5-setup-db.js` y `sprint5-verify-pdf.js`
- [x] `SPRINT_5_REPORT.md`

---

## Fase 3 — Gestión de Carnés ✅ (emisión, PDF e impresión)

- [x] Servicio `carnets.service.js` en backend (MySQL)
- [x] Rutas API `/api/carnets`
- [x] Generación individual de carné
- [x] Código único automático (`REG01-2026-000001`)
- [x] Validación: un carné activo por usuario
- [x] Cambio de estado (activo, vencido, suspendido, revocado)
- [x] Renovación de carné
- [x] Historial de estados (`historial_carnets`)
- [x] UI listado y emisión de carnés
- [x] Página carnés integrada en nav del dashboard
- [ ] Eliminar o migrar prototipo mock (`index.js`, `services/carnets.service.js` raíz)
- [ ] Generación masiva (Sprint posterior)
- [x] Exportación PDF (Sprint 5)
- [ ] QR funcional (Sprint 6)

---

## Fase 5 — Exportación PDF ✅ (Sprint 5)

- [x] Motor de generación PDF (Puppeteer + EJS)
- [x] Plantilla intercambiable en `backend/templates/carnets/`
- [x] GET `/api/carnets/:id/documento/pdf`
- [x] Almacenar `pdf_url`, `pdf_hash`, `pdf_generado_at` en carnets
- [x] Botón descargar PDF en detalle de carné
- [x] Vista previa e impresión optimizada (`carnets-imprimir.html`)
- [x] Reimpresión e historial de documento
- [ ] Exportación PNG/JPG (preparado en constants)

---

## Sprint 6 — Validación QR ✅ (2026-06-26)

- [x] Token HMAC-SHA256, imagen QR, validación pública
- [x] `validar.html` con escáner móvil
- [x] Integración QR en PDF y carnés
- [x] Dashboard stats reales
- [x] `SPRINT_6_REPORT.md`

---

## Fase 4 — Validación QR ✅

- [x] Servicio QR con HMAC-SHA256 (`QR_SIGNING_KEY`)
- [x] Generación automática de `qr_token` al emitir carné
- [x] GET `/api/validar/:token` (público)
- [x] Resolución automática estado VENCIDO por fecha
- [x] Respuesta segura (sin email, teléfono, password)
- [x] Log en `validaciones_qr`
- [x] Página `validar.html` funcional
- [x] Escáner QR con cámara (html5-qrcode)
- [x] Entrada manual de token
- [x] Rate limiting en endpoint público

---

## Sprint 7 — Dashboard ejecutivo ✅ (2026-06-26)

- [x] 11 tarjetas KPI dinámicas desde MySQL
- [x] 6 gráficas Chart.js interactivas
- [x] Actividad reciente (auditoría + validaciones QR)
- [x] Alertas: vencimientos, sin foto, suspendidos
- [x] Accesos rápidos por permisos
- [x] Dashboard por rol (admin/coord/instructor/aprendiz)
- [x] `GET /api/dashboard` unificado
- [x] Auto-refresh 60s
- [x] UI responsiva moderna
- [x] `scripts/sprint7-verify-dashboard.js`
- [x] `SPRINT_7_REPORT.md`

---

## Sprint 8 — Reportes institucionales ✅ (2026-07-01)

- [x] Centro de reportes (`reportes.html`)
- [x] API `/api/reportes` (usuarios, carnés, validaciones, estadísticas)
- [x] Búsqueda avanzada con filtros combinables
- [x] Exportación CSV, Excel (.xlsx), PDF
- [x] Estadísticas y gráficas Chart.js
- [x] Alcance por rol (coordinador regional)
- [x] Auditoría de exportaciones
- [x] `scripts/sprint8-verify-reportes.js`
- [x] `SPRINT_8_REPORT.md`

---

## Sprint 9 — Auditoría, configuración y notificaciones ✅ (2026-07-01)

- [x] Bitácora ampliada (rol, módulo, resultado, IP, user-agent)
- [x] UI `/auditoria.html` + API `GET /api/auditoria`
- [x] Configuración del sistema en BD (`configuracion_sistema`)
- [x] UI `/sistema.html` (config, sesiones, monitoreo, notificaciones)
- [x] Notificaciones internas + campana navbar
- [x] Gestión de sesiones activas y revocación
- [x] Monitoreo MySQL, almacenamiento, seguridad
- [x] Migración `008_sprint9_sistema.sql` + setup script
- [x] `scripts/sprint9-verify-sistema.js`
- [x] `SPRINT_9_REPORT.md`

---

## Sprint 10 — Release Candidate 1 ✅ (2026-07-01)

- [x] Auditoría integral del proyecto
- [x] Script `setup-db.js` unificado
- [x] Script `sprint10-verify-rc1.js` (9 suites)
- [x] Correcciones seguridad (env prod, CSRF 2FA, XSS, SVG)
- [x] Fix password recovery admin + tests unitarios
- [x] Eliminación código muerto
- [x] README reescrito (Express)
- [x] `.env.example`
- [x] INSTALL.md, API_DOCUMENTATION.md, DATABASE_DOCUMENTATION.md
- [x] USER_MANUAL.md, DEPLOYMENT.md
- [x] VERSION.md, RELEASE_NOTES.md, FINAL_PROJECT_REPORT.md
- [x] `SPRINT_10_REPORT.md`

**Estado final: v1.0.0 — LISTA PARA ENTREGA**

---

## Fase 6 — Dashboard y Reportes ✅

- [x] UI dashboard ejecutivo completo
- [x] API `/api/dashboard` con estadísticas reales
- [x] Contadores completos y gráficas
- [x] Validaciones recientes y alertas
- [x] Página de reportes dedicada (`reportes.html`)
- [x] Exportación CSV, XLSX, PDF
- [x] Filtros avanzados combinables
- [ ] Exportación programada por correo (Sprint 10+)

---

## Fase 7 — Auditoría y Roles

- [x] Servicio `auditoriaService.js` (logging ampliado)
- [x] UI listado de auditoría (`/auditoria.html`)
- [x] GET `/api/auditoria` con paginación y filtros
- [x] UI configuración del sistema (`/sistema.html`)
- [x] GET/PUT `/api/configuracion/sistema`
- [ ] UI gestión de roles y permisos
- [ ] PUT `/api/roles/:id/permisos`
- [ ] UI configuración regionales (CRUD)
- [ ] UI configuración centros (CRUD)
- [ ] API CRUD config (`/api/config/regionales`, `/api/config/centros`)

---

## Fase 8 — Carga Masiva

- [ ] POST `/api/carnets/masivo` (CSV)
- [ ] Validación fila por fila
- [ ] Registro en `cargas_masivas`
- [ ] UI carga masiva con preview de errores
- [ ] Plantilla CSV descargable

---

## Fase 9 — Hardening y Calidad

- [x] Middleware rate limiting (backend)
- [x] Middleware CSRF (backend)
- [x] Security headers
- [ ] CSRF integrado en todo el frontend
- [ ] Tests unitarios backend Express
- [ ] Tests integración API (auth, usuarios, carnés)
- [ ] Corregir `passwordRecovery` (bcrypt, columnas BD)
- [ ] Aplicar migraciones 002 y 003 o integrar en schema
- [ ] Actualizar README para stack Express
- [ ] Actualizar ARCHITECTURE.md (hecho en auditoría)
- [ ] Limpiar archivos basura (`foo.txt`, `test.txt`, etc.)
- [ ] Despliegue producción (PM2 / Docker completo)
- [ ] Manual de usuario

---

## Deuda técnica / Limpieza

- [ ] Decidir destino de `src/` legacy (conservar referencia vs eliminar)
- [ ] Sincronizar documentación (README, PROYECTO.md vs realidad Express)
- [ ] Remover `sqlite3` de dependencias si no se usa
- [ ] Remover assets SVG de Next.js no usados
- [ ] Unificar nombres de tablas Prisma vs SQL si se retoma Prisma

---

## Quality Gate pre-Sprint 8 ✅ (2026-07-01)

- [x] Auditoría técnica completa (`QUALITY_GATE_REPORT.md`)
- [x] Verificar configuración DB desde `.env` (única fuente en stack activo)
- [x] Verificar `schema.sql` + `seed.sql` (coordinador OK)
- [x] Scripts verificación Sprint 0–7 ejecutados
- [x] Fix rate limit compartido entre middlewares
- [x] Fix `securityAuditService` async + UUID
- [x] Fix exposición `password_hash` en 2FA verify-login
- [ ] Integrar migraciones 002/003 en schema principal
- [ ] Reemplazar `npm test` (mock legacy) por tests Express

---

## Bloqueadores actuales (prioridad inmediata)

- [x] Corregir CSRF: frontend envía `X-CSRF-Token`
- [x] Completar `package.json` con dependencias runtime
- [x] Corregir `seed.sql` usuario coordinador
- [x] Verificar MySQL + servidor arrancan correctamente
- [x] Fix rate limit que bloqueaba 2.º login y scripts de verificación
- [ ] Actualizar README.md al stack Express
- [ ] Integrar migraciones 002/003 o documentar aplicación obligatoria
