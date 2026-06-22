# Changelog — SENA Carnés

Formato basado en [Keep a Changelog](https://keepachangelog.com/).

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
