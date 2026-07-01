# QUALITY GATE REPORT — SENA Carnés

**Fecha:** 2026-07-01  
**Alcance:** Auditoría técnica completa pre-Sprint 8 (Sprints 0–7)  
**Rol:** Arquitecto · Tech Lead · QA · Seguridad · Revisión de código  
**Stack activo:** Express + MySQL + HTML/Bootstrap (`backend/` + `public/`)

---

## Resumen Ejecutivo

El proyecto está **funcionalmente maduro** para los módulos entregados en los Sprints 0–7. La configuración de base de datos está **centralizada en `.env`** y el núcleo (`database/schema.sql` + `seed.sql`) es coherente y operativo.

Durante esta auditoría se **confirmaron y corrigieron 3 errores** que afectaban estabilidad y seguridad:

1. **Rate limiting compartido** entre middlewares distintos (bloqueaba el 2.º login y los scripts de verificación).
2. **`securityAuditService`** incompatible con la API async de `database.js` y sin `id` en INSERT.
3. **Exposición de `password_hash`** en `POST /api/auth/2fa/verify-login`.

Tras las correcciones, **todos los scripts de verificación Sprint 0–7 pasan** contra MySQL local (`DB_HOST=localhost`, `DB_PORT=3306`, `DB_NAME=sena_carnets`, `DB_USER=root`, `DB_PASSWORD=root`).

**Recomendación:** El proyecto puede iniciar Sprint 8 con **reservas** — no hay bloqueadores críticos en el núcleo operativo, pero persisten deudas altas en seguridad avanzada (2FA/recuperación de contraseña), migraciones pendientes y UI de auditoría/reportes.

---

## Estado general del proyecto

| Área | Estado | Nota |
|------|--------|------|
| Backend Express | ✅ Estable | Patrón Route → Controller → Service → Repository |
| Frontend MPA | ✅ Estable | Bootstrap 5, `api.js` con CSRF |
| Base de datos núcleo | ✅ Estable | `schema.sql` + `seed.sql` verificados |
| Migraciones avanzadas | 🟡 Parcial | `002`/`003` no integradas en schema |
| Seguridad núcleo | ✅ Aceptable | SQL parametrizado, bcrypt, CSRF, RBAC |
| Seguridad avanzada | 🟡 Parcial | 2FA/recovery sin UI; tablas opcionales |
| Tests automatizados | 🔴 Débil | `npm test` apunta a mock legacy |
| Documentación | 🟡 Parcial | README aún describe Next.js en partes |
| Legacy `src/` | 📦 Referencia | No ejecutable con `package.json` actual |

**Avance estimado del proyecto:** **~90%**

---

## Problemas críticos

| # | Problema | Estado | Archivo(s) |
|---|----------|--------|------------|
| C1 | Rate limiters compartían un único contador por IP; el 2.º `POST /login` fallaba tras flujo admin (csrf + login + me + csrf) | ✅ **Corregido** | `backend/middleware/rateLimit.js` |
| C2 | `POST /api/auth/2fa/verify-login` devolvía `SELECT *` incluyendo `password_hash` | ✅ **Corregido** | `backend/routes/twoFactorAuth.routes.js` |
| C3 | `securityAuditService` usaba callbacks sobre `db.query` async; INSERT sin `id` UUID | ✅ **Corregido** | `backend/services/securityAuditService.js` |

> **Nota:** C3 sigue requiriendo la tabla `auditoria_seguridad` (migración `002`) para funcionar en runtime. Sin ella, los eventos de seguridad en login fallan silenciosamente en el `catch` del servicio.

---

## Problemas altos

| # | Problema | Impacto | Recomendación |
|---|----------|---------|---------------|
| A1 | Migraciones `migrations/002_security_audit.sql` y `003_password_recovery_2fa.sql` **no integradas** en `database/schema.sql` | Instalación limpia sin migraciones deja recovery/2FA/auditoría de seguridad rotos | Integrar en schema o documentar como paso obligatorio |
| A2 | 2FA **no bloquea** el login principal (`auth.controller.js` ignora `two_factor_enabled`) | 2FA es bypassable | Sprint 8 o hardening dedicado |
| A3 | Recuperación de contraseña: backend montado, **sin UI** en `public/` | Funcionalidad incompleta para usuarios | Sprint 8 o sub-tarea |
| A4 | Secretos por defecto en `env.js` (`SESSION_SECRET`, `QR_SIGNING_KEY`) | Riesgo en despliegue si no se cambian | Validar en arranque si `NODE_ENV=production` |
| A5 | Token de reset almacenado en texto plano (`passwordRecoveryService.js`) | Exposición si hay fuga de BD | Almacenar solo hash del token |
| A6 | `npm test` ejecuta `tests/carnets.test.js` contra **mock en memoria** (`services/carnets.service.js` raíz) | Falsa sensación de cobertura | Reescribir tests contra Express + MySQL |
| A7 | Dos carpetas de migraciones (`migrations/` vs `database/migrations/`) con semánticas opuestas | Confusión en instalación fresca | Unificar y marcar históricas las 004–006 |

---

## Problemas medios

| # | Problema | Detalle |
|---|----------|---------|
| M1 | UI de auditoría inexistente | Solo logging; sin `GET /api/auditoria` ni `auditoria.html` |
| M2 | Página de reportes dedicada pendiente | Gráficas parcialmente en dashboard |
| M3 | CSP permite `unsafe-inline` y `unsafe-eval` | Defensa XSS débil en frontend |
| M4 | `errorHandler` inserta `req.path` y `err.message` en HTML sin escapar | XSS reflejado en rutas no-API |
| M5 | Validación pública expone **nombre completo** y foto | Reglas de proyecto piden nombre parcial |
| M6 | `public/carnets.html` (raíz) huérfano e incompatible con `carnets.js` actual | Confusión; no se sirve en ruta canónica |
| M7 | Scripts de verificación hacen login independiente cada uno | Agotan rate limit de login (5/15 min) si se encadenan sin reinicio |
| M8 | Sesión en memoria (`express-session` default) | No escala horizontalmente |
| M9 | `DOCUMENTACIÓN` desactualizada sobre bug coordinador en seed | Ya corregido en `seed.sql` |
| M10 | CSRF ausente en rutas 2FA (`/2fa/setup`, `/verify`, `/disable`) | Riesgo en sesiones secuestradas |
| M11 | Carga masiva de carnés no portada desde legacy | `src/app/api/carnets/masivo/` sin equivalente Express |

---

## Problemas bajos

| # | Problema |
|---|----------|
| B1 | Assets SVG de Next.js sin uso (`public/vercel.svg`, `file.svg`, `window.svg`) |
| B2 | `migrations/001_carnets.sql` — SQLite legacy, incompatible |
| B3 | Índices ausentes en `usuarios.dependencia_id` y `carnets.emitido_por_id` |
| B4 | `validaciones_qr.resultado` sin ENUM en BD (solo VARCHAR) |
| B5 | Validación de contraseña en login (mín. 6) vs reset (mín. 8 + complejidad) |
| B6 | `README.md` no actualizado al stack Express |
| B7 | `QUICK_REFERENCE.md` / `QR_TESTING_GUIDE.md` referencian `DATABASE_URL` legacy |
| B8 | Upload valida MIME pero no magic bytes del archivo |
| B9 | Rate limiting en memoria — no compartido entre instancias |

---

## Mejoras recomendadas

1. **Integrar migraciones 002/003** en `database/schema.sql` o script único `database/install.sql`.
2. **Suite de tests de integración** que reutilice sesión y ejecute contra `backend/server.js`.
3. **Página `auditoria.html`** + API paginada con filtros (portar desde `src/`).
4. **Módulo reportes** con exportación CSV (Sprint 8 planificado).
5. **Eliminar/archivar** prototipo raíz (`index.js`, `services/carnets.service.js`, `public/carnets.html`) tras confirmación.
6. **Endurecer CSP** gradualmente (nonces o hashes).
7. **Session store** Redis/MySQL para producción.
8. **Whitelabel** variables de entorno en arranque para producción (`SESSION_SECRET`, `QR_SIGNING_KEY`).

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Despliegue sin cambiar secretos | Media | Alto | Checklist pre-producción |
| Instalación sin migraciones 002/003 | Alta | Medio | Documentar e integrar |
| 2FA bypass | Media | Alto | Integrar en flujo login |
| Tests legacy dan falsa confianza | Alta | Medio | Reemplazar suite |
| Pérdida de sesión al reiniciar servidor | Alta | Bajo (dev) | Session store persistente |
| Enumeración tokens reset | Baja | Medio | Rate limit + hash tokens |

---

## Código duplicado

| Ubicación A | Ubicación B | Notas |
|-------------|-------------|-------|
| `backend/services/carnets.service.js` | `services/carnets.service.js` (raíz) | Mock vs MySQL — mantener solo backend |
| `backend/services/qr.service.js` | `src/services/qr.service.ts` | Legacy portado; TS es referencia |
| `backend/lib/inputSanitizer.js` | `src/lib/input-sanitizer.ts` | Duplicado conceptual |
| `backend/middleware/rateLimit.js` | `src/middleware/rateLimit.ts` | Solo activo el de backend |
| `public/pages/carnets.html` | `public/carnets.html` | Solo `pages/` es canónico |
| Validadores password | `backend/lib/passwordValidator.js` vs `validate.js` login | Reglas inconsistentes |

---

## Posibles refactorizaciones

1. **Unificar migraciones** en un solo directorio con numeración secuencial.
2. **Extraer `install-fresh.sh`** que ejecute schema + seed + 002 + 003.
3. **Módulo `backend/lib/rateLimit/`** con stores intercambiables (memoria/Redis).
4. **Cliente API** (`api.js`) con reintentos y manejo centralizado de 401/429.
5. **Consolidar constantes** ENUM entre `schema.sql`, `constants/index.js` y docs.
6. **Retiro gradual de `src/`** tras portar reportes, auditoría y carga masiva.

---

## Estado de seguridad

| Control | Estado |
|---------|--------|
| SQL Injection | ✅ Consultas parametrizadas en repositorios |
| XSS | 🟡 Parcial — CSP débil; sanitización solo en login |
| CSRF | ✅ Backend + frontend en mutaciones principales; gaps en 2FA |
| Autenticación | ✅ bcrypt 12r, sesiones httpOnly |
| Autorización RBAC | ✅ `requirePermission` en rutas sensibles |
| Rate limiting | ✅ Corregido (namespaces separados) |
| Auditoría operacional | ✅ `auditoria` en mutaciones CRUD |
| Auditoría de seguridad | 🟡 Requiere migración 002 |
| QR HMAC | ✅ `QR_SIGNING_KEY` desde `.env` |
| Secretos en repo | ✅ `.env` no versionado; `.env.example` sin secretos reales |
| Exposición password_hash | ✅ Corregido en 2FA verify-login |
| Uploads | ✅ MIME + tamaño; nombres UUID |

---

## Estado de rendimiento

| Aspecto | Evaluación |
|---------|------------|
| Pool MySQL | ✅ `DB_POOL_LIMIT` configurable |
| Consultas dashboard | ✅ Agregaciones paralelas en repository |
| PDF Puppeteer | 🟡 Proceso pesado; caché por `pdf_hash` mitiga |
| Rate limit en memoria | 🟡 O(n) por IP; aceptable en dev |
| Índices BD | ✅ Mayoría cubiertos; 2 FKs sin índice |
| Assets estáticos | ✅ CDN Bootstrap/Chart.js |
| Código duplicado | 🟡 Legacy aumenta superficie sin impacto runtime |

---

## Estado de la base de datos

| Verificación | Resultado |
|--------------|-----------|
| `schema.sql` crea BD `sena_carnets` | ✅ |
| Foreign keys coherentes | ✅ |
| ENUMs alineados con `backend/constants` | ✅ |
| Seed coordinador (`rol-coord`, `Coord123!`) | ✅ Verificado |
| Migraciones 004–007 integradas en schema | ✅ |
| Migraciones 002–003 integradas | ❌ Aplicar manualmente |
| Instalación desde cero (schema + seed) | ✅ `sprint0-verify-db.js` OK |
| Integridad regional→centro→dependencia | 🟡 Solo en aplicación, no en BD |

---

## Estado del frontend

| Aspecto | Estado |
|---------|--------|
| Diseño consistente SENA | ✅ `sena.css` compartido |
| Responsive | ✅ Bootstrap 5 grid |
| Navegación | ✅ Navbar coherente en páginas autenticadas |
| CSRF en mutaciones | ✅ vía `api.js` |
| Formularios y validaciones | ✅ Toasts, spinners, validación cliente |
| Páginas activas | login, dashboard, usuarios, organización, carnés, validar, imprimir |
| Enlaces rotos | ✅ No detectados en rutas principales |
| Accesibilidad | 🟡 Básica; sin ARIA avanzado |
| Recuperación contraseña UI | ❌ No existe |
| Auditoría UI | ❌ No existe |

---

## Estado del backend

| Aspecto | Estado |
|---------|--------|
| Arquitectura por capas | ✅ |
| Manejo de errores centralizado | ✅ `errorHandler.js` |
| Logging | 🟡 `console.error` — sin logger estructurado |
| Validaciones entrada | ✅ `middleware/validate.js` |
| Permisos granulares | ✅ |
| Rutas API documentadas en ARCHITECTURE | ✅ |
| Código legacy montado | 🟡 `passwordRecovery`, `twoFactorAuth` sin UI |
| Health check | ✅ `GET /api/health` |

---

## Checklist de funcionalidades

| Funcionalidad | Estado | Verificación |
|---------------|--------|--------------|
| Login | ✅ | `sprint0-verify-auth.js` |
| Logout | ✅ | Manual / sesión |
| Recuperación contraseña | 🟡 Backend only | Tabla requiere migración 003 |
| Gestión de sesiones | ✅ | express-session + cookie |
| Gestión de usuarios CRUD | ✅ | `sprint2-verify-usuarios.js` |
| Roles y permisos | ✅ | `sprint3-verify-organizacion.js` |
| Regionales | ✅ | Sprint 3 |
| Centros | ✅ | Sprint 3 |
| Dependencias | ✅ | Sprint 3 |
| Gestión de carnés | ✅ | `sprint4-verify-carnets.js` |
| Vista previa carné | ✅ | Sprint 4/5 |
| Generación PDF | ✅ | `sprint5-verify-pdf.js` |
| Impresión | ✅ | Sprint 5 |
| Código QR | ✅ | `sprint6-verify-qr.js` |
| Validación pública | ✅ | Sprint 6 |
| Dashboard ejecutivo | ✅ | `sprint7-verify-dashboard.js` |
| Auditoría (consulta UI) | ❌ | Solo widget en dashboard |
| 2FA end-to-end | ❌ | Backend parcial, no integrado en login |
| Carga masiva carnés | ❌ | Legacy Next.js only |
| Reportes dedicados / CSV | ❌ | Sprint 8 |

---

## Configuración de base de datos

### Verificación `.env`

| Variable | `.env.example` | `backend/config/env.js` | `backend/config/database.js` |
|----------|----------------|-------------------------|-------------------------------|
| `DB_HOST` | `localhost` | ✅ `process.env.DB_HOST` | ✅ vía `env.db.host` |
| `DB_PORT` | `3306` | ✅ | ✅ |
| `DB_NAME` | `sena_carnets` | ✅ | ✅ |
| `DB_USER` | `root` | ✅ | ✅ |
| `DB_PASSWORD` | `root` | ✅ | ✅ |

- **No hay credenciales hardcodeadas** en código de producción; solo fallbacks de desarrollo en `env.js` y scripts.
- **Una sola fuente de verdad** para el pool activo: `env.js` → `database.js`.
- Scripts en `scripts/` leen `process.env` directamente (aceptable para tooling).
- Legacy `src/lib/prisma.ts` usa `DATABASE_URL` — **no es stack activo**.

---

## Código legacy — inventario (sin eliminar)

### Mantener (stack activo)
- `backend/**`, `database/**`, `public/pages/**`, `public/js/**`, `public/css/**`
- `public/index.html`, `public/validar.html`, `docker-compose.yml`

### Ya migrado a Express
- Auth, usuarios, organización, carnés, PDF, QR, dashboard

### Útil como referencia (`src/`, `prisma/`)
- Reportes (`src/services/reporte.service.ts`)
- Auditoría consultable (`src/app/(dashboard)/auditoria/`)
- Carga masiva (`src/app/api/carnets/masivo/`)
- Componentes React (preview, QR scanner, forms)
- Schema Prisma como modelo de dominio

### Candidato a retiro futuro (documentar, no borrar aún)
- `index.js` + `routes/` + `controllers/` + `services/` (raíz) — mock carnés
- `public/carnets.html` — prototipo incompatible
- `migrations/001_carnets.sql` — SQLite
- `package.fixed.json`
- Assets SVG Next.js en `public/`
- Tests Vitest no cableados en `package.json`

---

## Correcciones aplicadas en esta auditoría

```
backend/middleware/rateLimit.js      — namespaces por tipo de limiter
backend/services/securityAuditService.js — async/await + UUID en INSERT
backend/routes/twoFactorAuth.routes.js   — pickUserSession sin password_hash
```

---

## Pruebas ejecutadas

| Prueba | Resultado |
|--------|-----------|
| `npm install` | ✅ (dependencias declaradas) |
| `npm run dev` | ✅ MySQL + puerto 3000 |
| `node scripts/sprint0-verify-db.js` | ✅ |
| `node scripts/sprint0-verify-auth.js` | ✅ admin + coord |
| `node scripts/sprint2-verify-usuarios.js` | ✅ |
| `node scripts/sprint3-verify-organizacion.js` | ✅ |
| `node scripts/sprint4-verify-carnets.js` | ✅ |
| `node scripts/sprint5-verify-pdf.js` | ✅ |
| `node scripts/sprint6-verify-qr.js` | ✅ |
| `node scripts/sprint7-verify-dashboard.js` | ✅ |
| `npm test` | ❌ 2/3 fallan (mock legacy en memoria) |

---

## Porcentaje estimado de avance del proyecto

| Fase | Peso | Avance |
|------|------|--------|
| Fundación + Auth | 10% | 95% |
| Usuarios + Organización | 20% | 100% |
| Carnés + PDF + QR | 35% | 100% |
| Dashboard | 15% | 100% |
| Reportes + Auditoría UI | 10% | 20% |
| Hardening + Tests + Deploy | 10% | 40% |

**Total ponderado: ~90%**

---

## Recomendación para iniciar el Sprint 8

### ✅ Puede iniciarse con aprobación condicional

El núcleo operativo (Sprints 0–7) está **verificado y estable**. No quedan errores críticos bloqueantes tras las correcciones de esta auditoría.

### Condiciones recomendadas antes o durante Sprint 8

1. **Integrar migraciones 002/003** en el procedimiento de instalación (o en `schema.sql`).
2. **Planificar** UI de reportes y auditoría como entregables Sprint 8.
3. **No eliminar `src/`** hasta portar carga masiva y reportes.
4. **Reemplazar `npm test`** por tests de integración Express.
5. **Revisar** flujo 2FA y recuperación de contraseña si se prometen al usuario final.

### Esperar aprobación del responsable antes de continuar

Este informe queda pendiente de tu revisión y aprobación explícita para dar inicio formal al Sprint 8.

---

*Generado como parte del Quality Gate pre-Sprint 8 — SENA Carnés.*
