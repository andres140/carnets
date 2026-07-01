# Changelog — SENA Carnés

Formato basado en [Keep a Changelog](https://keepachangelog.com/).

## [1.0.0] — Sprint 10 RC1 (2026-07-01)

### Entrega final — Release Candidate

- Script unificado `npm run setup:db`
- Verificación integral `npm run verify:rc1`
- Documentación completa (INSTALL, API, DATABASE, USER, DEPLOY, VERSION, RELEASE_NOTES, FINAL_PROJECT_REPORT)
- README reescrito para stack Express
- `.env.example` creado
- Fix seguridad: secretos prod, CSRF 2FA, XSS escapeHtml, bloqueo SVG
- Fix password recovery admin check
- Eliminado `notificationService.js` (código muerto)
- Tests unitarios corregidos

**Estado: v1.0.0 — LISTA PARA ENTREGA Y DESPLIEGUE**

---

## [Unreleased] — Sprint 9 (2026-07-01)

### Añadido — Auditoría, configuración, notificaciones y sesiones

**Backend:**
- Bitácora ampliada (`rol_nombre`, `modulo`, `resultado`, `user_agent`)
- Tablas: `configuracion_sistema`, `notificaciones`, `sesiones_usuario`
- API `/api/auditoria`, `/api/configuracion/sistema`, `/api/notificaciones`, `/api/sesiones`, `/api/monitoreo`
- Middleware `sessionGuard` — revocación de sesiones administrativa
- Notificaciones automáticas: carnés por vencer, sin foto, accesos sospechosos, exportaciones, config

**Frontend:**
- `/auditoria.html` — consulta de bitácora con filtros y paginación
- `/sistema.html` — configuración, sesiones, monitoreo, notificaciones
- Campana de notificaciones en navbar (`notificaciones-ui.js`)

**Migración:** `database/migrations/008_sprint9_sistema.sql` + `scripts/sprint9-setup-db.js`

**Verificación:** `sprint9-verify-sistema.js`

**Documentación:** `SPRINT_9_REPORT.md`

---

## [Unreleased] — Sprint 8 (2026-07-01)

### Añadido — Centro de reportes institucionales

**Backend:**
- `reportes.repository.js`, `reportes.service.js`, `reportes.controller.js`, `reportes.routes.js`
- `reportExport.js` — exportación CSV, Excel (xlsx), PDF
- `GET /api/reportes/*` — estadísticas, usuarios, carnés, validaciones, búsqueda avanzada
- Alcance por rol (admin/coordinador/instructor)
- Auditoría `EXPORTAR_REPORTE` en cada exportación

**Frontend:**
- `public/pages/reportes.html` — centro de reportes con 5 pestañas
- Gráficas Chart.js, filtros combinables, paginación, exportación
- Integración navbar dashboard y accesos rápidos

**Dependencia:** `xlsx`

**Verificación:** `sprint8-verify-reportes.js`

**Documentación:** `SPRINT_8_REPORT.md`

---

## [Unreleased] — Quality Gate pre-Sprint 8 (2026-07-01)

### Corregido — Estabilidad y seguridad

- **Rate limiting:** contadores separados por namespace (`api`, `login`, `qr`) — el 2.º login ya no falla tras flujo CSRF + `/me`
- **`securityAuditService`:** uso async de `db.query` + `id` UUID en INSERT a `auditoria_seguridad`
- **2FA verify-login:** sesión y respuesta sin `password_hash` (usa `authService.getById` / `pickUserSession`)

### Documentación

- `QUALITY_GATE_REPORT.md` — auditoría técnica completa Sprints 0–7
- Actualizados `PROJECT_CONTEXT.md`, `TASKS.md`, `ARCHITECTURE.md`

**Verificación:** scripts Sprint 0–7 OK tras correcciones (ver `QUALITY_GATE_REPORT.md`)

---

## [Unreleased] — Sprint 7 (2026-06-26)

### Añadido — Dashboard ejecutivo

**Backend:**
- `dashboard.repository.js` — agregaciones SQL optimizadas por rol
- `GET /api/dashboard` — payload unificado (resumen, gráficas, alertas, actividad)
- Alcance: administrador (nacional), coordinador (regional), instructor (centro), aprendiz (personal)

**Frontend:**
- Dashboard ejecutivo con 11 KPIs, 6 gráficas Chart.js, alertas y actividad
- Accesos rápidos por permisos
- Auto-refresh cada 60 segundos
- `dashboard.css` — estilos del panel

**Verificación:** `sprint7-verify-dashboard.js`

**Documentación:** `SPRINT_7_REPORT.md`

---

## [Unreleased] — Sprint 6 (2026-06-26)

### Añadido — Validación QR y verificación pública

**Backend:**
- `qr.service.js` — tokens HMAC-SHA256, generación imagen QR
- `validacion.service.js` — validación pública segura
- `GET /api/validar/:token` (público, rate limited)
- `GET /api/carnets/:id/qr`, `POST /api/carnets/:id/qr/regenerar`
- `GET /api/dashboard/stats` — estadísticas reales
- Repositorio `validacionesQr.repository.js`
- Migración `validaciones_qr` (token_intentado, carnet_id nullable)

**Frontend:**
- `validar.html` — escáner QR móvil + validación manual
- QR en detalle de carné, PDF y plantilla
- Dashboard con stats y validaciones recientes

**Dependencia:** `qrcode`

**Verificación:** `sprint6-setup-db.js`, `sprint6-verify-qr.js`

**Documentación:** `SPRINT_6_REPORT.md`

---

## [Unreleased] — Sprint 5 (2026-06-26)

### Añadido — PDF, impresión y plantilla de carné

**Backend:**
- Motor de plantillas EJS (`backend/lib/carnetTemplate/`, `backend/templates/carnets/`)
- Generación PDF con Puppeteer (`backend/lib/pdf/generator.js`)
- Servicio `carnetPdf.service.js` — caché por hash, validaciones, historial
- Endpoints `/api/carnets/:id/documento/*` (preview, pdf, historial, reimprimir, regenerar, registrar-impresion)
- Tabla `carnet_documentos_historial`; columnas `pdf_generado_at`, `pdf_hash`, `template_id`, `reimpresiones_count`
- Invalidación de caché PDF al mutar carné

**Frontend:**
- Botones Descargar PDF, Vista impresión, Reimprimir en detalle de carné
- `carnets-imprimir.html` — vista previa e impresión desde navegador
- `API.downloadBlob()` para descargas binarias

**Dependencias:** `ejs`, `puppeteer`

**Verificación:** `sprint5-setup-db.js`, `sprint5-verify-pdf.js`

**Documentación:** `SPRINT_5_REPORT.md`

---

## [Unreleased] — Sprint 4 (2026-06-26)

### Añadido — Sistema de generación de carnés

**Backend:**
- CRUD carnés con snapshot de usuario
- Código único por regional/año/secuencia
- Transiciones de estado validadas
- Historial `historial_carnets`
- Preview API antes de emisión
- QR token placeholder (Sprint 5)
- Permisos y alcance por rol

**Frontend:**
- `public/pages/carnets.html` — emisión, listado, detalle, acciones
- Plantilla temporal HTML/CSS reemplazable

**BD:**
- `carnets.tipo_documento`, `carnets.dependencia_nombre`

**Verificación:** `sprint4-setup-db.js`, `sprint4-verify-carnets.js`

**Documentación:** `SPRINT_4_REPORT.md`

---

## [Unreleased] — Sprint 3 (2026-06-26)

### Añadido — Gestión organizacional y control de accesos

**Backend:**
- CRUD completo: regionales, centros, dependencias, roles, permisos
- Repositories y services por entidad (patrón Sprint 1/2)
- Permisos: `regionales.*`, `centros.*`, `dependencias.*`, `permisos.gestionar`
- `requireAuth` valida usuario con estado ACTIVO
- Asignación de permisos a roles (`PUT /api/roles/:id/permisos`)
- Auditoría con diff en actualizaciones
- Columna `roles.activo` + migración 004

**Frontend:**
- `organizacion.html` — interfaz con pestañas
- Gestión de permisos por rol (checkboxes)

**Integración:**
- Catálogos `/api/catalogos/*` con permisos ampliados
- Usuarios: solo roles y entidades organizacionales activas

**Verificación:**
- `scripts/sprint3-setup-db.js`
- `scripts/sprint3-verify-organizacion.js`

**Documentación:** `SPRINT_3_REPORT.md`, ARCHITECTURE, PROJECT_CONTEXT, TASKS

---

## [Unreleased] — Sprint 2 (2026-06-26)

### Añadido — Módulo de gestión de usuarios (producción)

**Backend:**
- Permisos granulares en rutas: `usuarios.ver`, `usuarios.crear`, `usuarios.editar`, `usuarios.desactivar`
- Validaciones ampliadas: documento (5–50), teléfono, tipo documento, foto (MIME y 5 MB)
- Filtros: `tipoUsuario`, `dependenciaId` en repository y controller
- Auditoría con diff de cambios (`utils/diff.js`)
- Alcance coordinador en crear/editar (`assertCoordinatorAssignment`)
- Fix LIMIT/OFFSET en `users.repository.js` (compatibilidad mysql2)

**Frontend:**
- Filtros UI: regional, centro, dependencia, tipo de usuario
- Validación cliente en formulario y foto
- Toasts de éxito/error, spinners en acciones
- Columna correo en tabla

**Verificación:**
- `scripts/sprint2-verify-usuarios.js` — CRUD, búsqueda, filtros, validaciones, permisos

**Documentación:** `SPRINT_2_REPORT.md`, actualización TASKS, PROJECT_CONTEXT

---

## [Unreleased] — Sprint 1 (2026-06-26)

### Refactor — Consolidación arquitectónica

**Estructura:**
- Nueva capa `backend/repositories/` (`users.repository.js`)
- Nueva carpeta `backend/constants/` (enums, permisos, límites)
- Utilidades compartidas: `request`, `asyncHandler`, `pagination`, `permissions`, `validators`, `errors`, `mappers`
- Separación catálogos: `catalog.controller.js` + `catalog.routes.js`

**Estandarización:**
- `authController.js` → `auth.controller.js`
- `authService.js` → `auth.service.js`
- `auditoriaService.js` → `auditoria.service.js`
- Assets carnés movidos a `public/js/` y `public/css/`

**Seguridad:**
- Filtro regional para coordinadores en listado/acceso usuarios
- CSRF en mutaciones de usuarios y logout
- Password recovery: bcrypt + columna `nombre_completo`
- SQL LIMIT/OFFSET parametrizado

**Documentación:** `SPRINT_1_REPORT.md`, actualización ARCHITECTURE, PROJECT_CONTEXT, TASKS

---

## [Unreleased] — Sprint 0 (2026-06-26)

### Corregido — Estabilización y bloqueadores

**Hallazgos validados y corregidos:**
- `database/seed.sql` — INSERT coordinador: `rol_id` corregido a `rol-coord`
- `package.json` — dependencias runtime completas; eliminado `sqlite3` sin uso
- Autenticación CSRF — `GET /api/auth/csrf-token`, `api.js` y `login.js` integrados
- `docker-compose.yml` — `MYSQL_ROOT_PASSWORD` alineado con `.env` (`root`)
- `public/index.html`, `public/pages/dashboard.html` — textos actualizados

**Verificación:**
- `npm install` y `npm run dev` operativos
- `schema.sql` + `seed.sql` ejecutan sin errores
- Login admin y coordinador verificado (`scripts/sprint0-verify-auth.js`)

**Scripts de verificación añadidos:**
- `scripts/sprint0-verify-db.js`
- `scripts/sprint0-verify-auth.js`

**Documentación:** `SPRINT_0_REPORT.md`, actualización de PROJECT_CONTEXT, ROADMAP, TASKS, ARCHITECTURE

**Pendiente (no Sprint 0):** README Next.js desactualizado, migraciones 002/003, password recovery SHA256, filtro regional coordinadores

---

## [Unreleased] — Auditoría 2026-06-26

### Documentación — Auditoría técnica completa

**Alcance:** Revisión estática de todo el repositorio sin modificar código de aplicación.

**Archivos creados:**
- `AUDITORIA_PROYECTO.md` — Informe completo de auditoría
- `PROJECT_CONTEXT.md` — Contexto para continuidad del proyecto
- `TASKS.md` — Checklist de tareas con estado real

**Archivos actualizados:**
- `ARCHITECTURE.md` — Reescrito para stack Express activo (antes describía solo Next.js)
- `ROADMAP.md` — Fases actualizadas con estado real y Fase 0.5 (bloqueadores)

### Hallazgos críticos (sin corregir — pendiente aprobación)

**Bloqueadores:**
- CSRF implementado en backend pero frontend (`api.js`, `login.js`) no envía token → login falla con 403
- `package.json` incompleto: faltan mysql2, bcryptjs, express-session, multer, dotenv, cors
- `database/seed.sql` líneas 88-99: INSERT coordinador con `rol_id='COORDINADOR'` en vez de `'rol-coord'`

**Bugs detectados:**
- `passwordRecovery.routes.js` usa SHA256 para reset en vez de bcrypt
- `passwordRecovery.routes.js` consulta columnas `nombres`/`apellidos` que no existen en `usuarios`
- `public/carnets.html` apunta a `/api/carnets` no montada en servidor Express activo
- Migraciones `002_security_audit.sql` y `003_password_recovery_2fa.sql` no integradas en `schema.sql`

**Deuda técnica:**
- README.md y PROYECTO.md describen Next.js como stack activo (desactualizado)
- `dashboard.html` e `index.html` con textos obsoletos ("próximamente", "continuar con auth")
- Tres stacks superpuestos: Express activo, Next.js legacy (`src/`), mock carnets (`index.js`)
- Tests (`tests/carnets.test.js`) prueban servicio mock, no backend Express
- Archivos basura: `foo.txt`, `newfile.txt`, `test.txt`, `cookies.txt`

**Estado real del proyecto:**
- Stack activo Express: ~28% de avance global
- Módulos completos en legacy Next.js no ejecutable con package.json actual
- MySQL no disponible durante auditoría — verificación runtime pendiente

---

## [1.2.0] — 2026-06-17

### Mejorado — Módulo QR y Validación Pública

**Análisis inicial:**
- Módulo QR detectado como 95% implementado
- API endpoint `/api/validar/[codigo]` ya existente
- Página de validación `/app/validar/page.tsx` funcional
- QR automaticamente generado en creación de carnés

**Cambios realizados:**

**Backend:**
- `src/services/carnet.service.ts` — Mejorado método `validarQr()` para retornar objeto carnet completo con datos seguros
- `src/types/carnet.ts` — Agregada interface `CarnetValidacionSeguro` para filtrar campos sensibles

**Frontend:**
- `src/components/carnets/QRScanner.tsx` — Reescrito componente `ValidacionResult` para mostrar información completa del carné
- `src/app/validar/page.tsx` — Rediseño completo con UX mejorada: dos métodos de entrada (QR scan + paste manual), manejo de errores, tarjeta informativa

**Pruebas:**
- `tests/services/qr.service.test.ts` — Tests unitarios para generación y verificación de tokens QR
- `tests/scenarios/carnet-validation.test.ts` — Escenarios de validación (activo, vencido, suspendido, revocado, token inválido)
- `tests/integration/qr-validation.test.ts` — Tests de integración para endpoint `/api/validar/[codigo]`

**Funcionalidades agregadas:**
- Validación de carné activo con datos completos: foto, nombre, documento, tipo usuario, centro, regional, fechas, estado
- Detección automática de carnés vencidos basada en `fechaVencimiento`
- Respuesta segura que excluye: email, teléfono, password_hash, datos internos del sistema
- Soporte para dos métodos de validación: escaneo QR con cámara y entrada manual de token
- Mejor visualización de estados con badges: Activo (verde), Suspendido (naranja), Vencido (rojo), Revocado (gris)
- Auditoría de todas las validaciones registradas en tabla `ValidacionQr`

**Seguridad:**
- Tokens QR con HMAC-SHA256 (16 bytes random + 16 bytes signature)
- Verificación de token impide tampering (re-compute de HMAC)
- Datos sensibles filtrados automáticamente en validación pública
- Endpoint `/api/validar` es público, pero solo expone información de seguridad apropiada

**Resolución de estado en tiempo real:**
- Función `resolveEstado()` marca carnés como VENCIDO automáticamente si `fechaVencimiento < now()`
- No requiere background jobs, cálculo al momento de validación

**Documentación:**
- Actualización de CHANGELOG.md con cambios de v1.2.0
- Actualización de DATABASE.md con tabla `ValidacionQr` y campo `qrToken`
- Actualización de ARCHITECTURE.md con flujo de validación QR

## [1.1.0] — 2026-06-16

### Añadido — Credenciales de desarrollo visibles en login

**Componentes:**
- `src/components/auth/DevCredentialsCard.tsx` — componente reutilizable que muestra credenciales de prueba solo en desarrollo

**Funcionalidades:**
- Tarjeta de credenciales visible en página de login cuando `NODE_ENV=development`
- Muestra email, contraseña y rol del usuario administrador de prueba
- Banner de advertencia "Solo visible en modo desarrollo"
- Auto-desactivación en producción mediante verificación de variable de entorno

**Pruebas:**
- `tests/components/DevCredentialsCard.test.ts` — pruebas unitarias para validación de entorno

**Credenciales de prueba:**
- Email: `admin@sena.edu.co`
- Contraseña: `Admin123!`
- Rol: `Administrador`

**Seguridad:**
- Componente usa condicional `process.env.NODE_ENV` para rendering seguro
- No se incluyen credenciales en bundle de producción
- Recomendación de desactivación en `.env` con `NODE_ENV=production`

## [0.3.0] — 2026-06-16

### Añadido — Módulo 2: Gestión de usuarios

**Backend:**
- `backend/services/users.service.js` — CRUD, búsqueda, paginación, desactivar/reactivar
- `backend/services/catalog.service.js` — catálogos roles, regionales, centros, dependencias
- `backend/controllers/users.controller.js` — controladores HTTP
- `backend/routes/users.routes.js` — rutas API protegidas
- Validaciones en `backend/middleware/validate.js` (`validateCreateUser`, `validateUpdateUser`)
- Upload de foto con multer en crear/editar
- Auditoría: CREAR, ACTUALIZAR, DESACTIVAR, REACTIVAR

**Frontend:**
- `public/pages/usuarios.html` — listado, filtros, paginación, modal crear/editar
- `public/css/usuarios.css` — estilos del módulo
- `public/js/usuarios.js` — lógica cliente
- Cliente API extendido: `put`, `patch`, soporte `FormData`

**Endpoints:**
- `GET /api/usuarios` — listado paginado con filtros
- `GET /api/usuarios/:id` — detalle
- `POST /api/usuarios` — crear (multipart)
- `PUT /api/usuarios/:id` — editar (multipart)
- `PATCH /api/usuarios/:id/desactivar` — desactivar (soft delete)
- `PATCH /api/usuarios/:id/reactivar` — reactivar
- `GET /api/catalogos/roles|regionales|centros|dependencias`

**Seguridad:** acceso restringido a roles `ADMINISTRADOR` y `COORDINADOR`.

**Seed:** usuario coordinador (`coord@sena.edu.co` / `Coord123!`) y usuarios de prueba.

### Archivos modificados

- `backend/routes/index.js`, `pages.routes.js`
- `backend/middleware/errorHandler.js`, `validate.js`
- `public/js/api.js`, `public/pages/dashboard.html`
- `database/seed.sql`
- `README.md`, `ARCHITECTURE.md`, `DATABASE.md`

## [0.2.1] — 2026-06-16

### Corregido

- **Causa raíz del navegador sin respuesta HTTP:** `.env` tenía `PORT=3306` (puerto MySQL) en lugar de `PORT=3000`.
- Separación explícita `PORT` vs `DB_PORT`.
- Middleware `requireAuth` corregido con `req.originalUrl`.
- Página temporal `/`, módulo auth completo.

## [0.2.0] — 2026-06-16

### Añadido

- Arquitectura Express + Bootstrap 5 como stack principal.

## [0.1.0] — 2026-06-16

### Añadido

- Scaffold inicial Next.js + Prisma + NextAuth (legacy).
