# Auditoría Técnica — SENA Carnés

**Fecha:** 2026-06-26  
**Auditor:** Arquitecto de Software (revisión estática + análisis de código)  
**Alcance:** Repositorio completo (`backend/`, `public/`, `database/`, `src/` legacy, raíz)

---

## Arquitectura encontrada

El repositorio contiene **tres implementaciones superpuestas** en distinto estado de madurez:

```
┌─────────────────────────────────────────────────────────────────┐
│                    STACK ACTIVO (objetivo)                       │
│  public/ (HTML+Bootstrap+JS) → backend/ (Express) → MySQL       │
│  Entry: npm run dev → backend/server.js                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    STACK LEGACY (Next.js)                        │
│  src/app/ → services/ → repositories/ → Prisma → MySQL          │
│  No ejecutable: sin dependencias Next en package.json actual    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    PROTOTIPO MOCK (raíz)                         │
│  index.js → routes/carnets.routes.js → services/carnets.service │
│  Datos en memoria, sin BD. No es el entry point de npm scripts  │
└─────────────────────────────────────────────────────────────────┘
```

### Capas del stack activo (Express)

| Capa | Ubicación | Responsabilidad |
|------|-----------|-----------------|
| Estáticos / UI | `public/` | HTML, CSS, JS cliente |
| Rutas HTTP | `backend/routes/` | Montaje de endpoints y páginas |
| Controladores | `backend/controllers/` | Orquestación HTTP, auditoría |
| Servicios | `backend/services/` | Lógica de negocio, SQL |
| Middleware | `backend/middleware/` | Auth, validación, CSRF, rate limit |
| Config | `backend/config/` | BD, sesión, uploads, env |
| Utilidades | `backend/utils/`, `backend/lib/` | Helpers, sanitización, email |
| Base de datos | `database/schema.sql`, `database/seed.sql` | Esquema y datos iniciales |

**Patrón obligatorio:** `Routes → Controllers → Services → MySQL (mysql2)`

No existe capa `models/`; las consultas SQL están en los servicios.

---

## Tecnologías utilizadas

### Stack activo

| Componente | Tecnología | Versión (declarada/lock) |
|------------|------------|--------------------------|
| Runtime | Node.js | 20+ recomendado |
| Servidor HTTP | Express | ^4.19.2 |
| Base de datos | MySQL 8 | vía mysql2 ^3.6.5 |
| Autenticación | express-session + bcryptjs | Sesión en cookie |
| Uploads | multer | Config en `backend/config/upload.js` |
| Frontend | HTML5, CSS3, JavaScript vanilla | Bootstrap 5.3.3 (CDN) |
| Contenedor BD | Docker Compose | mysql:8.0 |

### Stack legacy (no activo)

| Componente | Tecnología |
|------------|------------|
| Framework | Next.js 16 App Router |
| Lenguaje | TypeScript |
| ORM | Prisma 7 |
| Auth | NextAuth.js v5 (JWT) |
| UI | Tailwind CSS 4 + shadcn/ui |
| Validación | Zod |
| Tests | Vitest |

### Artefactos huérfanos en raíz

- `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `postcss.config.mjs`
- `components.json` (shadcn)
- `prisma/schema.prisma`, `prisma/seed.ts`
- Carpeta `.next/` (build previo)
- `sqlite3` declarado en `package.json` pero **no usado** en backend activo

---

## Dependencias

### `package.json` (raíz) — incompleto

```json
"dependencies": {
  "express": "^4.19.2",
  "sqlite3": "^5.1.7"    // ← no referenciado en código activo
}
```

### Usadas en código pero NO declaradas en `package.json`

| Paquete | Uso |
|---------|-----|
| `mysql2` | `backend/config/database.js` |
| `bcryptjs` | `authService.js`, `users.service.js` |
| `express-session` | `backend/config/session.js` |
| `multer` | `backend/config/upload.js` |
| `dotenv` | `backend/config/env.js` |
| `cors` | `backend/app.js` |
| `nodemailer` | `backend/lib/emailService.js` (recuperación contraseña) |

> **Riesgo:** `npm install` en entorno limpio no instalará dependencias críticas.

---

## Flujo completo del sistema

### Flujo de autenticación (diseñado)

```
Usuario → /login.html → POST /api/auth/login
  → authController.login
  → authService.authenticate (bcrypt + permisos por rol)
  → req.session.user = datos sesión
  → auditoriaService.log(LOGIN)
  → redirect /dashboard.html
```

### Flujo de usuarios (implementado)

```
/usuarios.html → GET /api/usuarios (paginado + filtros)
  → users.controller → users.service → MySQL

Crear/editar → POST/PUT /api/usuarios (multipart + foto)
  → validateCreateUser / validateUpdateUser
  → users.service (FK validation, unicidad email/documento)
  → auditoriaService.log
```

### Flujos NO conectados al stack activo

| Flujo | Estado |
|-------|--------|
| Generación de carnés | Solo mock en `services/carnets.service.js` (memoria) |
| Validación QR | Placeholder en `public/validar.html` |
| PDF | Plantilla JSON en `public/templates/carnet-template.json` |
| Reportes / Dashboard stats | UI con placeholders `—`, sin API |
| Recuperación contraseña | Backend parcial, sin UI, migración SQL separada |
| 2FA | Backend parcial (`twoFactorAuthService.js`), sin UI |

### Flujo legacy Next.js (referencia)

Implementación completa en diseño en `src/services/carnet.service.ts`, `qr.service.ts`, etc., con páginas en `src/app/(dashboard)/`. **No ejecutable** con el `package.json` actual.

---

## Base de datos

### Scripts principales

| Archivo | Propósito |
|---------|-----------|
| `database/schema.sql` | Esquema completo MySQL (12 tablas) |
| `database/seed.sql` | Permisos, roles, catálogos demo, usuarios |
| `migrations/001_carnets.sql` | Esquema SQLite legacy (obsoleto) |
| `migrations/002_security_audit.sql` | Tabla `auditoria_seguridad` + columnas QR |
| `migrations/003_password_recovery_2fa.sql` | `password_reset_tokens` + columnas 2FA |

> **Problema:** Las migraciones `002` y `003` **no están integradas** en `schema.sql`. El despliegue solo con `schema.sql` + `seed.sql` deja incompletas las funciones de seguridad avanzada.

### Tablas (schema.sql)

| Tabla | Registros esperados (seed) |
|-------|---------------------------|
| `regionales` | 1 (Antioquia) |
| `centros_formacion` | 1 |
| `dependencias` | 1 |
| `roles` | 6 |
| `permisos` | 14 |
| `rol_permisos` | M:N configurado |
| `usuarios` | 4 (admin, coord, aprendiz, instructor) |
| `carnets` | 0 |
| `historial_carnets` | 0 |
| `validaciones_qr` | 0 |
| `auditoria` | 0 (se llena en runtime) |
| `cargas_masivas` | 0 |

---

## Relaciones

```
regionales 1──N centros_formacion 1──N dependencias
roles 1──N usuarios
roles N──M permisos (rol_permisos)
usuarios 1──N carnets
carnets 1──N historial_carnets
carnets 1──N validaciones_qr
usuarios 1──N auditoria
usuarios 1──N cargas_masivas
usuarios 1──N carnets (como emitido_por_id)
```

**Validaciones en servicio:** centro ∈ regional, dependencia ∈ centro (`users.service.js`).

---

## Rutas

### API Express activa (`/api`)

| Método | Ruta | Auth | Estado |
|--------|------|------|--------|
| GET | `/api/health` | No | ✅ Implementado |
| POST | `/api/auth/login` | No + CSRF + rate limit | 🟡 Bloqueado por CSRF en frontend |
| POST | `/api/auth/logout` | Sesión | ✅ |
| GET | `/api/auth/me` | Sesión | ✅ |
| POST | `/api/auth/password-recovery/forgot-password` | No | 🟡 Backend sin tabla/migración aplicada |
| POST | `/api/auth/password-recovery/validate-reset-token` | No | 🟡 |
| POST | `/api/auth/password-recovery/reset-password` | No | 🟡 Bug: usa SHA256 en vez de bcrypt |
| GET | `/api/auth/password-recovery/status` | Admin | 🟡 |
| * | `/api/auth/2fa/*` | Varía | 🟡 Sin UI |
| GET | `/api/catalogos/roles` | Admin/Coord | ✅ |
| GET | `/api/catalogos/regionales` | Admin/Coord | ✅ |
| GET | `/api/catalogos/centros` | Admin/Coord | ✅ |
| GET | `/api/catalogos/dependencias` | Admin/Coord | ✅ |
| GET | `/api/usuarios` | Admin/Coord | ✅ |
| GET | `/api/usuarios/:id` | Admin/Coord | ✅ |
| POST | `/api/usuarios` | Admin/Coord | ✅ |
| PUT | `/api/usuarios/:id` | Admin/Coord | ✅ |
| PATCH | `/api/usuarios/:id/desactivar` | Admin/Coord | ✅ |
| PATCH | `/api/usuarios/:id/reactivar` | Admin/Coord | ✅ |

### Páginas HTML

| URL | Archivo | Protección | Estado |
|-----|---------|------------|--------|
| `/` | `public/index.html` | No | ✅ Landing |
| `/login.html` | `public/pages/login.html` | redirectIfAuth | ✅ |
| `/dashboard.html` | `public/pages/dashboard.html` | requireAuth | 🟡 Sin stats reales |
| `/usuarios.html` | `public/pages/usuarios.html` | requireAuth + rol | ✅ |
| `/validar.html` | `public/validar.html` | No | 🔴 Placeholder |
| `/carnets.html` | `public/carnets.html` | No | 🔴 API mock no montada |

### Rutas legacy (no montadas en servidor activo)

- `index.js` → `/api/carnets/*` (memoria)
- `src/app/api/*` → 12 endpoints Next.js

---

## Componentes

### Frontend activo (`public/`)

| Archivo | Tipo | Función |
|---------|------|---------|
| `js/api.js` | Cliente HTTP | fetch con cookies, sin CSRF |
| `js/login.js` | Página | Formulario login |
| `js/dashboard.js` | Página | Sesión + logout (sin stats) |
| `js/usuarios.js` | Módulo | CRUD completo con modal |
| `carnets.js` | Módulo | Llama API mock inexistente |
| `css/sena.css` | Estilos | Globales SENA |
| `css/login.css` | Estilos | Login |
| `css/usuarios.css` | Estilos | Tabla usuarios |
| `templates/carnet-template.json` | Plantilla | Diseño PDF futuro |

### Backend activo (`backend/`)

| Módulo | Archivos clave |
|--------|----------------|
| Auth | `authController.js`, `authService.js`, `auth.routes.js` |
| Usuarios | `users.controller.js`, `users.service.js`, `users.routes.js` |
| Catálogos | `catalog.service.js` |
| Auditoría | `auditoriaService.js` |
| Seguridad | `securityHeaders.js`, `rateLimit.js`, `csrf.js`, `securityAuditService.js` |
| Recuperación | `passwordRecoveryService.js`, `passwordRecovery.routes.js` |
| 2FA | `twoFactorAuthService.js`, `twoFactorAuth.routes.js` |

### Legacy Next.js (`src/components/`)

24 componentes incluyendo `QRScanner.tsx`, `CarnetPreview.tsx`, `Sidebar.tsx`, 14 componentes shadcn/ui.

---

## Servicios

| Servicio | Stack | Conectado a BD | Usado por UI activa |
|----------|-------|----------------|---------------------|
| `authService.js` | Express | ✅ | ✅ login |
| `users.service.js` | Express | ✅ | ✅ usuarios |
| `catalog.service.js` | Express | ✅ | ✅ usuarios |
| `auditoriaService.js` | Express | ✅ | Parcial (login/CRUD) |
| `securityAuditService.js` | Express | 🟡 requiere migración 002 | ❌ |
| `passwordRecoveryService.js` | Express | 🟡 requiere migración 003 | ❌ |
| `twoFactorAuthService.js` | Express | 🟡 requiere migración 003 | ❌ |
| `carnets.service.js` (raíz) | Mock | ❌ memoria | carnets.html huérfano |
| `carnet.service.ts` | Next.js | Prisma | ❌ legacy |
| `qr.service.ts` | Next.js | — | ❌ legacy |
| `reporte.service.ts` | Next.js | Prisma | ❌ legacy |

---

## Módulos

| # | Módulo | Backend Express | Frontend Express | BD | Estado |
|---|--------|-----------------|------------------|-----|--------|
| 0 | Fundación (Express, SQL, Docker) | ✅ | ✅ landing | ✅ schema | ✅ Terminado |
| 1 | Autenticación (login/logout/sesión) | 🟡 CSRF rompe login | 🟡 sin token CSRF | ✅ | 🟡 Parcial |
| 2 | Gestión de usuarios | ✅ CRUD completo | ✅ UI completa | ✅ | 🟡 Parcial (sin probar runtime) |
| 3 | Gestión de carnés | 🔴 sin API | 🔴 carnets.html huérfano | ✅ schema | 🔴 Sin desarrollar |
| 4 | Validación QR | 🔴 | 🔴 placeholder | ✅ schema | 🔴 Sin desarrollar |
| 5 | Exportación PDF | 🔴 | 🔴 solo plantilla JSON | ✅ campo pdf_url | 🔴 Sin desarrollar |
| 6 | Dashboard | 🔴 sin API stats | 🟡 shell UI | — | 🟡 Parcial |
| 7 | Reportes | 🔴 | 🔴 | — | 🔴 Sin desarrollar |
| 8 | Auditoría (vista) | 🟡 servicio login/users | 🔴 | ✅ tabla | 🟡 Parcial |
| 9 | Roles y permisos (gestión) | 🟡 solo lectura catálogo | 🔴 | ✅ | 🟡 Parcial |
| 10 | Config regionales/centros | 🟡 catálogos GET | 🔴 | ✅ | 🟡 Parcial |
| 11 | Carga masiva | 🔴 | 🔴 | ✅ tabla | 🔴 Sin desarrollar |
| 12 | Recuperación contraseña | 🟡 backend con bugs | 🔴 | 🟡 migración separada | 🟡 Parcial |
| 13 | 2FA | 🟡 backend sin UI | 🔴 | 🟡 migración separada | 🟡 Parcial |
| 14 | Hardening seguridad | 🟡 middleware existe | 🔴 CSRF no integrado | 🟡 | 🟡 Parcial |

**Leyenda:** ✅ Terminado · 🟡 Parcial · 🔴 Sin desarrollar

---

## Diseño actual

### Identidad visual

- Colores SENA: azul primario `#0066CC` (definido en `carnet-template.json` y CSS)
- Bootstrap 5.3.3 vía CDN (no build local)
- Bootstrap Icons 1.11.3
- Tipografía del sistema (sin fuentes custom en stack Express)

### Páginas con diseño coherente

- Login: card centrada, fondo degradado (`login.css`)
- Dashboard y usuarios: navbar azul SENA, cards con sombra
- Validar: placeholder mínimo, inconsistente con legacy Next.js que tiene diseño completo

### Inconsistencias visuales detectadas

1. `index.html` dice "continuar con módulo de autenticación" pero login ya existe
2. `dashboard.html` lista "Módulo 2 próximamente" pero usuarios ya está en nav
3. Nav tiene "Carnés" deshabilitado pero existe `carnets.html` accesible directamente
4. Assets `next.svg`, `vercel.svg` sin uso en UI Bootstrap
5. Legacy Next.js usa Tailwind/shadcn — estética diferente al stack activo

---

## Estado de cada módulo (resumen)

| Módulo | % estimado | Bloqueadores principales |
|--------|------------|--------------------------|
| Fundación | 95% | `package.json` incompleto |
| Auth | 65% | CSRF no enviado desde frontend |
| Usuarios | 80% | Sin verificación runtime (MySQL) |
| Carnés | 5% | Sin servicio/API en Express |
| QR | 3% | Sin implementación activa |
| PDF | 2% | Solo plantilla JSON |
| Dashboard | 15% | Sin endpoint de estadísticas |
| Reportes | 0% | — |
| Auditoría UI | 5% | Solo logging backend |
| Seguridad avanzada | 35% | Migraciones no integradas, bugs |

**Avance global del stack activo: ~28%**

---

## Errores y hallazgos críticos

### 🔴 Bloqueadores (impiden uso normal)

| # | Hallazgo | Ubicación | Impacto |
|---|----------|-----------|---------|
| 1 | **CSRF en login sin token en frontend** | `auth.routes.js` + `login.js` | Login falla con 403 |
| 2 | **seed.sql: INSERT coordinador corrupto** | Líneas 88-99 | `rol_id='COORDINADOR'` en vez de `'rol-coord'`; FK falla o datos incorrectos |
| 3 | **package.json incompleto** | `package.json` | Instalación limpia no funciona |
| 4 | **README/ARCHITECTURE desactualizados** | Raíz | Documentan Next.js como stack activo |

### 🟡 Bugs y funciones incompletas

| # | Hallazgo | Ubicación |
|---|----------|-----------|
| 5 | Reset contraseña usa SHA256, no bcrypt | `passwordRecovery.routes.js:137` |
| 6 | Query usa columnas `nombres`, `apellidos` inexistentes | `passwordRecovery.routes.js:51` |
| 7 | `requirePermission` exportado pero no usado en rutas | `auth.js` |
| 8 | Auth usa `requireRole` en vez de permisos granulares RBAC | `users.routes.js` |
| 9 | Coordinadores sin filtro por `regional_id` en listado | `users.service.js` |
| 10 | Migraciones 002/003 no en schema principal | `migrations/` |
| 11 | `password_reset_tokens` referenciada sin garantía de existencia | Servicios seguridad |
| 12 | `carnets.html` apunta a `/api/carnets` no montada en `backend/server.js` | `public/carnets.js` |
| 13 | Tests activos prueban mock en memoria, no Express | `tests/carnets.test.js` |
| 14 | `sqlite3` declarado sin uso | `package.json` |
| 15 | `migrations/001_carnets.sql` es SQLite, incompatible con MySQL activo | Obsoleto |

### Código muerto / archivos prescindibles

| Archivo/carpeta | Motivo |
|-----------------|--------|
| `foo.txt`, `newfile.txt`, `test.txt` | Archivos de prueba sin uso |
| `cookies.txt` | Artefacto de debugging |
| `package.fixed.json` | Versión alternativa no usada |
| `index.js` + `routes/carnets.routes.js` + `controllers/carnets.controller.js` | Servidor mock separado |
| `public/*.svg` (next, vercel, etc.) | Assets Next.js default |
| `migrations/001_carnets.sql` | SQLite legacy |
| `.next/` | Build Next.js (regenerable, no versionar idealmente) |
| `src/` completo | Legacy — conservar como referencia, no modificar |

### Código duplicado

- Lógica de carnés: mock (`services/carnets.service.js`) vs Prisma (`src/services/carnet.service.ts`)
- Esquema BD: `database/schema.sql` vs `prisma/schema.prisma` (nombres tabla difieren: `auditoria` vs `audit_logs`, `historial_carnets` vs `carnet_estados_historial`)
- Documentación: `README.md`, `PROYECTO.md`, `ARCHITECTURE.md` describen Next.js; `ROADMAP.md` describe Express

### Problemas de seguridad

| Severidad | Problema |
|-----------|----------|
| Alta | CSRF implementado pero no integrado en cliente → login roto O bypass si se quita middleware |
| Alta | Reset contraseña con hash débil (SHA256) incompatible con bcrypt del login |
| Media | `SESSION_SECRET` y `QR_SIGNING_KEY` con valores por defecto en `.env.example` |
| Media | Sin filtro regional para coordinadores (violación regla de seguridad del proyecto) |
| Media | `passwordRecovery` expone estructura interna si tabla no existe (error 500) |
| Baja | Rate limiting implementado pero no verificado en runtime |

### Problemas UX

- Dashboard muestra estadísticas `—` permanentemente
- Mensajes de "próximamente" en módulos ya parcialmente implementados
- Sin feedback de credenciales demo en login Express (solo existía en Next.js `DevCredentialsCard`)
- `validar.html` no ofrece funcionalidad real

---

## Verificación de funcionalidades (análisis estático)

| Elemento | ¿Existe código? | ¿Conectado? | ¿Funcional? |
|----------|-----------------|-------------|-------------|
| Botón "Iniciar sesión" | ✅ | ✅ → `/api/auth/login` | ❌ CSRF bloquea |
| Botón "Salir" dashboard | ✅ | ✅ → `/api/auth/logout` | 🟡 Requiere sesión previa |
| Nav "Usuarios" | ✅ | ✅ → `/usuarios.html` | 🟡 Requiere auth + MySQL |
| CRUD usuarios (modal) | ✅ | ✅ APIs completas | 🟡 No verificado runtime |
| Upload foto usuario | ✅ | ✅ multer | 🟡 No verificado runtime |
| Nav "Carnés" | Deshabilitado | — | ❌ |
| `/carnets.html` directo | ✅ | ❌ API no montada | ❌ |
| `/validar.html` | ✅ placeholder | ❌ | ❌ |
| Stats dashboard | UI ✅ | ❌ sin API | ❌ |
| `/api/health` | ✅ | ✅ | ✅ (sin BD) |
| Tests `npm test` | ✅ | Mock carnets | 🟡 No prueba Express |

> **Nota:** No se pudo verificar runtime porque MySQL no respondió en `localhost:3306` durante la auditoría. El servidor Express queda bloqueado en `testConnection()`.

---

## Archivos temporales y basura

```
foo.txt          — 5 bytes, sin propósito
newfile.txt      — 17 bytes, sin propósito  
test.txt         — 19 bytes, sin propósito
cookies.txt      — 135 bytes, artefacto curl/debug
package.fixed.json — alternativa no adoptada
```

**Recomendación:** Eliminar tras aprobación (no ejecutado en esta auditoría).

---

## Comparativa Legacy vs Activo

| Capacidad | Express activo | Next.js legacy |
|-----------|---------------|----------------|
| Login/sesión | Parcial | Completo |
| CRUD usuarios | Completo | Completo (API parcial) |
| Carnés | No | Completo en services |
| QR validación | No | Completo en services |
| PDF | No | Referenciado en UI |
| Reportes | No | Completo en services |
| Auditoría UI | No | Ruta sin página |
| RBAC granular | Parcial (por rol) | Por permiso |

El legacy es **referencia valiosa** para portar lógica a Express, no código en producción.

---

*Documento generado durante auditoría del 2026-06-26. No se modificó código de aplicación.*
