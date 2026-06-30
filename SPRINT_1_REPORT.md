# Sprint 1 — Informe de consolidación arquitectónica

**Fecha:** 2026-06-26  
**Objetivo:** Eliminar deuda técnica, organizar el proyecto para escalabilidad.  
**Alcance:** Sin nuevas funcionalidades de negocio (carnés, QR, PDF, reportes).

---

## Resumen ejecutivo

Sprint 1 refactorizó la arquitectura del backend Express sin añadir módulos de negocio. Se introdujo una **capa Repository**, utilidades compartidas, constantes centralizadas, convención de nombres unificada y mejoras de seguridad (alcance regional, CSRF en mutaciones de usuarios).

**Verificación:** `require('./backend/app')` → OK · Login admin verificado post-refactor.

---

## 1. Estructura de carpetas

### Organización final

```
backend/
├── config/           # env, database, session, upload
├── constants/        # enums, permisos, límites (NUEVO)
├── controllers/      # Orquestación HTTP
│   ├── auth.controller.js
│   ├── users.controller.js
│   └── catalog.controller.js   (NUEVO — separado de users)
├── middleware/       # auth, validate, csrf, rateLimit, errorHandler
├── repositories/     # Acceso SQL (NUEVO)
│   ├── users.repository.js
│   └── index.js      # placeholder Sprint 2+
├── routes/
│   ├── index.js
│   ├── auth.routes.js
│   ├── users.routes.js
│   └── catalog.routes.js       (NUEVO)
├── services/         # Lógica de negocio
│   ├── auth.service.js         (renombrado)
│   ├── auditoria.service.js    (renombrado)
│   ├── users.service.js
│   └── catalog.service.js
├── lib/              # Infraestructura (email, sanitización, passwords)
└── utils/            # Helpers reutilizables (ampliado)
    ├── helpers.js
    ├── request.js
    ├── asyncHandler.js
    ├── pagination.js
    ├── permissions.js
    ├── validators.js
    ├── errors.js
    └── mappers.js

public/
├── pages/            # Vistas HTML (login, dashboard, usuarios)
├── js/               # Lógica cliente (api, login, usuarios, carnets)
├── css/              # Estilos por módulo
├── templates/        # Plantillas JSON (PDF futuro)
└── uploads/          # Fotos subidas (.gitkeep)
```

### Movimientos realizados

| Antes | Después | Motivo |
|-------|---------|--------|
| `public/carnets.js` | `public/js/carnets.js` | Consistencia con otros módulos JS |
| `public/carnets.css` | `public/css/carnets.css` | Consistencia con `css/` |
| Catálogos en `users.controller` | `catalog.controller.js` | Separación de responsabilidades MVC |
| Catálogos en `users.routes` | `catalog.routes.js` | Rutas modulares |
| SQL en `users.service` | `repositories/users.repository.js` | Preparación para carnés, reportes, auditoría |

### Sin capa `models/`

El proyecto usa **Repository + Service** sobre MySQL directo (`mysql2`). No se añadió ORM ni carpeta `models/` — las entidades se representan como filas SQL y DTOs en servicios. Esto alinea con las reglas del proyecto y facilita portar queries desde el legacy Next.js.

### Carpeta `views/`

Las vistas son `public/pages/*.html` (MPA Bootstrap). No se creó `views/` separada para no romper rutas existentes (`/login.html`, `/usuarios.html`).

---

## 2. Eliminación de duplicación

| Duplicado | Solución |
|-----------|----------|
| `getClientIp()` en 4 archivos | `utils/request.js` |
| Regex email en `validate.js` y `inputSanitizer.js` | `constants/EMAIL_REGEX` + `utils/validators.isValidEmail` |
| `ESTADOS_USUARIO` repetido en validate | `constants/index.js` |
| `ROL_TO_TIPO` en users.service | `constants/ROL_TO_TIPO` |
| MIME types en upload.js | `constants/UPLOAD.ALLOWED_MIMES` |
| Paginación inline | `utils/pagination.js` |
| `parseUserBody` en controller | `utils/mappers.js` |
| try/catch repetido en controllers | `utils/asyncHandler.js` |
| Permisos inline en auth middleware | `utils/permissions.hasPermission` |
| SQL CRUD usuarios mezclado con negocio | `repositories/users.repository.js` |

### Consultas SQL optimizadas

- `LIMIT` y `OFFSET` ahora usan **parámetros preparados** (`?`) en lugar de interpolación en template string.

---

## 3. Estandarización de nombres

### Convención adoptada

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Controladores | `{modulo}.controller.js` | `auth.controller.js` |
| Servicios | `{modulo}.service.js` | `auth.service.js` |
| Repositorios | `{modulo}.repository.js` | `users.repository.js` |
| Rutas | `{modulo}.routes.js` | `catalog.routes.js` |
| Variables JS | camelCase | `nombreCompleto`, `rolId` |
| Columnas SQL | snake_case | `nombre_completo`, `rol_id` |
| Rutas API | kebab-case / plural | `/api/usuarios`, `/api/catalogos/roles` |

### Archivos renombrados

| Anterior | Nuevo |
|----------|-------|
| `authController.js` | `auth.controller.js` |
| `authService.js` | `auth.service.js` |
| `auditoriaService.js` | `auditoria.service.js` |

---

## 4. Arquitectura MVC

### Flujo consolidado

```
HTTP Request
  → middleware (auth, validate, csrf, rateLimit)
  → routes
  → controller (orquestación, auditoría, mapeo req→DTO)
  → service (reglas de negocio, permisos de alcance)
  → repository (SQL parametrizado)
  → MySQL
```

### Cambios MVC

| Capa | Antes | Después |
|------|-------|---------|
| Controller | Catálogos + usuarios + parseUserBody + getClientIp | Solo usuarios; catálogo separado; mappers/utils |
| Service | SQL + negocio mezclados | Solo negocio; delega SQL al repository |
| Vista (`public/`) | JS suelto en raíz (`carnets.js`) | Todo en `js/` y `css/` |

### Vistas sin lógica de negocio

Las páginas HTML solo renderizan UI. La lógica cliente en `public/js/` limita a fetch y DOM — sin reglas de negocio de carnés reales (el mock legacy permanece aislado).

---

## 5. Seguridad

| Área | Mejora Sprint 1 |
|------|-----------------|
| Alcance regional | Coordinador solo ve/edita usuarios de su `regional_id` (`permissions.applyUserListScope`, `canAccessUser`) |
| CSRF | Añadido a logout y mutaciones de usuarios (POST/PUT/PATCH) |
| Password recovery | SHA256 reemplazado por **bcrypt**; query corregida a `nombre_completo` |
| Validaciones | Centralizadas en `validators.js` + `constants` |
| SQL | 100% parametrizado en repository; LIMIT/OFFSET corregidos |
| Sesiones | Sin cambios (ya correctas en Sprint 0) |
| Permisos | `utils/permissions.js` listo para `requirePermission` en Sprint 2 |

---

## 6. Rendimiento

- Eliminadas consultas duplicadas de validación FK — centralizadas en repository.
- Paginación con límites desde `constants.PAGINATION.MAX_LIMIT` (100).
- Imports huérfanos eliminados al renombrar archivos.
- Controllers más ligeros → menos código por request.

---

## 7. Preparación para crecimiento

| Módulo futuro | Preparación |
|---------------|-------------|
| Carnés | `repositories/index.js` placeholder; patrón users replicable |
| QR / Validación | `constants.PERMISOS.VALIDAR_QR`; `utils/permissions` |
| PDF | `public/templates/carnet-template.json` en lugar estándar |
| Auditoría listado | `auditoria.service.js` — añadir `list()` + `audit.repository.js` en Sprint 2 |
| Reportes | `utils/pagination.js` reutilizable |
| Carga masiva | `constants` con `CARNETS_GENERAR_MASIVO` |
| Multi-regional | `applyUserListScope` extensible por `tipoUsuario` |

### Rutas API estables (sin breaking changes)

- `/api/catalogos/*` — sin cambio de URL (montaje en `/catalogos` sub-router)
- `/api/usuarios/*` — sin cambio
- `/api/auth/*` — sin cambio

---

## 8. Archivos modificados / creados

### Nuevos

`backend/constants/index.js`, `backend/repositories/users.repository.js`, `backend/repositories/index.js`, `backend/controllers/catalog.controller.js`, `backend/controllers/auth.controller.js`, `backend/routes/catalog.routes.js`, `backend/services/auth.service.js`, `backend/services/auditoria.service.js`, `backend/utils/request.js`, `asyncHandler.js`, `pagination.js`, `permissions.js`, `validators.js`, `errors.js`, `mappers.js`, `public/js/carnets.js`, `public/css/carnets.css`, `public/uploads/.gitkeep`

### Modificados

`users.service.js`, `users.controller.js`, `users.routes.js`, `auth.routes.js`, `routes/index.js`, `middleware/validate.js`, `middleware/auth.js`, `config/upload.js`, `passwordRecovery.routes.js`, `twoFactorAuth.routes.js`, `passwordRecoveryService.js`, `public/carnets.html`

### Eliminados

`authController.js`, `authService.js`, `auditoriaService.js`, `public/carnets.js`, `public/carnets.css`

---

## 9. Riesgos restantes

| Prioridad | Riesgo |
|-----------|--------|
| Media | `README.md` aún describe Next.js |
| Media | Migraciones 002/003 no en `schema.sql` |
| Media | `password_reset_tokens` sin tabla si se usa recovery |
| Baja | Tests `npm test` apuntan a mock legacy |
| Baja | `carnets.html` sigue huérfano (API mock no montada) — Sprint 2 |
| Baja | Rate limit puede bloquear logins rápidos consecutivos en pruebas |

---

## 10. Preparación para Sprint 2

Sprint 2 recomendado: **Módulo Carnés en Express**

1. Crear `repositories/carnets.repository.js` siguiendo patrón de users.
2. Crear `services/carnets.service.js` portando lógica de `src/services/carnet.service.ts`.
3. Crear `controllers/carnets.controller.js` + `routes/carnets.routes.js`.
4. Crear `public/pages/carnets.html` integrado al dashboard.
5. Aplicar `requirePermission('carnets.generar')` donde corresponda.

La arquitectura actual soporta esto **sin reestructurar carpetas**.

---

## Verificación

```bash
node -e "require('./backend/app'); console.log('OK')"
npm run dev
node scripts/sprint0-verify-auth.js   # admin OK; coord puede requerir pausa por rate limit
```

---

**Sprint 1 cerrado. Esperando aprobación para Sprint 2 (Carnés).**
