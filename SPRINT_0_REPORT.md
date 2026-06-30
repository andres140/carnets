# Sprint 0 — Informe de estabilización

**Fecha:** 2026-06-26  
**Objetivo:** Eliminar bloqueadores, corregir inconsistencias y dejar base sólida.  
**Alcance:** Sin nuevas funcionalidades (carnés, QR, PDF, reportes).

---

## Resumen ejecutivo

Sprint 0 completado con **correcciones aplicadas en bloqueadores críticos**. El proyecto:

- Instala dependencias con `npm install` (38 paquetes, sin sqlite3 huérfano).
- Arranca con `npm run dev` / `node backend/server.js`.
- Conecta a MySQL con credenciales de `.env`.
- Ejecuta `schema.sql` y `seed.sql` sin errores.
- Permite login de **admin** y **coordinador** vía API (verificado con script).

**Avance estimado post-Sprint 0:** ~32% (fundación + auth + usuarios estables).

---

## 1. Validación de hallazgos de auditoría

| # | Hallazgo | Clasificación | Evidencia |
|---|----------|---------------|-----------|
| 1 | CSRF bloquea login (frontend sin token) | **Confirmado** | `auth.routes.js:12` exige `csrfProtection`; `api.js` original no enviaba `X-CSRF-Token`. Tras fix: `sprint0-verify-auth.js` → `LOGIN_ADMIN_OK`, `LOGIN_COORD_OK` |
| 2 | `package.json` incompleto | **Confirmado** | Solo `express` + `sqlite3`; `require('mysql2')` fallaba en install limpio. Corregido; `require('./backend/app')` → `APP_OK` |
| 3 | `seed.sql` coordinador con FK inválida | **Confirmado** | Líneas 91-92: `rol_id='COORDINADOR'` (debe ser `rol-coord`). Tras fix: query seed → `rol_id: "rol-coord"` |
| 4 | README describe Next.js como activo | **Confirmado** | `README.md` líneas 7-17. No modificado en Sprint 0 (documentado como riesgo) |
| 5 | Reset contraseña usa SHA256 | **Confirmado** | `passwordRecovery.routes.js:137`. **No corregido** — fuera de flujo login; requiere tabla `password_reset_tokens` |
| 6 | Recovery usa columnas `nombres`/`apellidos` | **Confirmado** | `passwordRecovery.routes.js:51`. **No corregido** — módulo no usado en Sprint 0 |
| 7 | `carnets.html` apunta a API no montada | **Confirmado** | `index.js` raíz no es entry point; `backend/routes` sin carnés. Sin cambios (no eliminar rutas) |
| 8 | Migraciones 002/003 no en schema.sql | **Confirmado** | `migrations/` existe; `schema.sql` no incluye `password_reset_tokens` ni `auditoria_seguridad` |
| 9 | Servidor no arrancaba por archivos faltantes | **Falso positivo** | Archivos existen (`securityHeaders.js`, `rateLimit.js`, `csrf.js`, etc.) |
| 10 | Coordinador sin filtro regional en usuarios | **Confirmado** | `users.service.js` sin filtro por `regional_id`. **No corregido** — Sprint 1 |
| 11 | `requirePermission` sin uso en rutas | **Confirmado** | Solo `requireRole` en `users.routes.js`. **No corregido** — Sprint 1 |
| 12 | Tests prueban mock en memoria | **Confirmado** | `npm test` → 2/3 fallan por estado compartido en `services/carnets.service.js` |
| 13 | MySQL no disponible (auditoría previa) | **Falso positivo** (ahora) | `MYSQL_OK` con `.env` actual |
| 14 | `sqlite3` sin uso | **Confirmado** | Eliminado de `package.json` |
| 15 | Textos obsoletos index/dashboard | **Confirmado** | Corregidos en `index.html` y `dashboard.html` |
| 16 | Docker password ≠ .env | **Confirmado** | `docker-compose.yml` tenía `password`; alineado a `root` |

---

## 2. Problemas corregidos

### `database/seed.sql` — INSERT coordinador

**Problema:** Valores desalineados — `rol_id` recibía `'COORDINADOR'` (nombre de rol, no FK).

**Corrección:** `rol_id='rol-coord'`, `tipo_usuario='COORDINADOR'`, `estado='ACTIVO'`.

**Verificación:** `node scripts/sprint0-verify-db.js` → usuario coord con `rol_id: "rol-coord"`.

### `package.json` — dependencias

**Problema:** Faltaban paquetes runtime; `sqlite3` sin uso.

**Corrección:** Añadidos `mysql2`, `bcryptjs`, `express-session`, `multer`, `dotenv`, `cors`, `nodemailer`. Eliminado `sqlite3`. `main` → `backend/server.js`.

**Verificación:** `npm install` exitoso (38 packages).

### Autenticación — CSRF

**Problema:** Login devolvía 403 "Token CSRF requerido".

**Corrección:**
- `GET /api/auth/csrf-token` en `auth.routes.js` + `authController.csrfToken`
- `public/js/api.js` — `ensureCsrf()` + header `X-CSRF-Token` en mutaciones
- `public/js/login.js` — precarga token al cargar página

**Verificación:** Login admin y coord exitoso vía `scripts/sprint0-verify-auth.js`.

### Configuración MySQL

**Problema:** `docker-compose.yml` usaba `MYSQL_ROOT_PASSWORD: password` vs `.env` `root`.

**Corrección:** Docker alineado a `root`. `.env.example` documenta setup local.

**Verificación:** Conexión `DB_HOST=localhost`, `DB_USER=root`, `DB_PASSWORD=root` → `MYSQL_OK`.

### Textos UI obsoletos

**Corrección:** `index.html` y `dashboard.html` reflejan estado real del proyecto.

### `database/schema.sql`

**Revisión:** FKs, índices, ENUMs, ON DELETE/UPDATE — **sin errores encontrados**. No se modificó.

---

## 3. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `database/seed.sql` | Fix INSERT coordinador |
| `package.json` | Dependencias completas, sin sqlite3 |
| `package-lock.json` | Regenerado por npm install |
| `backend/routes/auth.routes.js` | Ruta `GET /csrf-token` |
| `backend/controllers/authController.js` | Handler `csrfToken` |
| `public/js/api.js` | Soporte CSRF |
| `public/js/login.js` | Precarga CSRF |
| `public/index.html` | Texto actualizado |
| `public/pages/dashboard.html` | Texto actualizado |
| `.env.example` | Documentación MySQL local |
| `docker-compose.yml` | Password `root` |
| `scripts/sprint0-verify-db.js` | **Nuevo** — verificación schema/seed |
| `scripts/sprint0-verify-auth.js` | **Nuevo** — verificación login |
| Documentación | Ver sección 8 |

---

## 4. Verificación completa

| Prueba | Resultado |
|--------|-----------|
| `npm install` | ✅ 38 paquetes, sin errores |
| `require('./backend/app')` | ✅ APP_OK |
| `npm run dev` | ✅ Servidor inicia (puerto 3000) |
| Conexión MySQL | ✅ localhost:3306 |
| `schema.sql` | ✅ Sin errores |
| `seed.sql` | ✅ Sin errores |
| Login admin@sena.edu.co | ✅ ADMINISTRADOR |
| Login coord@sena.edu.co | ✅ COORDINADOR |
| `GET /api/health` | ✅ (servidor activo) |
| `npm test` | ⚠️ 1/3 pass — tests del mock legacy (no Express) |

---

## 5. Código muerto / candidatos a eliminación (NO eliminados)

| Archivo/carpeta | Motivo | Impacto si se elimina |
|-----------------|--------|----------------------|
| `src/` (Next.js, ~91 archivos) | Stack legacy no ejecutado | Ninguno en Express; pérdida de referencia para migración |
| `prisma/`, `.next/` | ORM/build Next.js | Ninguno en Express |
| `index.js`, `routes/carnets.routes.js`, `controllers/carnets.controller.js`, `services/carnets.service.js` | Mock carnés en memoria | Ninguno en Express; `carnets.html` dejaría de funcionar aún más |
| `public/carnets.html`, `carnets.js`, `carnets.css` | UI huérfana (API no montada) | Ninguno en backend activo |
| `foo.txt`, `newfile.txt`, `test.txt`, `cookies.txt` | Basura | Ninguno |
| `package.fixed.json` | Alternativa no usada | Ninguno |
| `public/*.svg` (next, vercel, etc.) | Assets Next default | Ninguno en UI Bootstrap |
| `migrations/001_carnets.sql` | SQLite obsoleto | Ninguno |
| `tests/carnets.test.js` + mock service | Prueban código muerto | Ninguno en Express |
| `tests/**/*.ts` | Tests Next.js/vitest | Ninguno en `npm test` actual |

---

## 6. Legacy Next.js — resumen (sin portar)

| Área | Reutilizable | Duplicado con Express | Acción futura |
|------|--------------|----------------------|---------------|
| `carnet.service.ts` | Lógica de negocio | No en Express | Migrar Sprint 1+ |
| `qr.service.ts` | Algoritmo HMAC | No en Express | Reutilizar/migrar |
| `pdf.service.ts` | Plantilla PDF | No en Express | Migrar Sprint 1+ |
| `reporte.service.ts` | Agregaciones | No en Express | Migrar Sprint 1+ |
| `usuario.service.ts` | Filtros regional/coord | Parcial en Express | Migrar gaps |
| `permissions.ts`, `constants.ts` | RBAC, enums | Parcial | Migrar |
| UI React/shadcn | — | Bootstrap activo | No reutilizar directo |
| NextAuth | — | express-session activo | Eliminar eventualmente |

---

## 7. Riesgos pendientes

| Prioridad | Riesgo |
|-----------|--------|
| Alta | `README.md` y `PROYECTO.md` siguen describiendo Next.js como stack activo |
| Alta | Migraciones 002/003 no integradas — 2FA, recovery, auditoría seguridad requieren tablas extra |
| Media | `passwordRecovery` con SHA256 y columnas incorrectas |
| Media | `users.service.js` sin filtro regional para coordinadores |
| Media | CSRF solo en login; mutaciones usuarios sin CSRF |
| Media | `npm test` falla en tests mock legacy |
| Baja | `multer@1.x` deprecado (avisar upgrade a 2.x en Sprint futuro) |
| Baja | Session store en memoria (no producción) |

---

## 8. Recomendaciones para Sprint 1

1. Portar **carnets** desde `src/services/carnet.service.ts` a Express.
2. Aplicar **filtro regional** y **requirePermission** en usuarios.
3. Actualizar **README.md** al stack Express.
4. Integrar migraciones 002/003 en `schema.sql` o documentar aplicación obligatoria.
5. Decidir destino de carpeta `src/` (archivar en rama `legacy/`).
6. Reemplazar o eliminar tests mock (`tests/carnets.test.js`).

---

## 9. Estado del proyecto al finalizar Sprint 0

| Módulo | Estado |
|--------|--------|
| Fundación | ✅ Estable |
| MySQL + schema + seed | ✅ Verificado |
| Auth (login/logout/sesión/CSRF) | ✅ Funcional |
| Usuarios CRUD | ✅ Código listo (requiere sesión previa) |
| Carnés / QR / PDF / Reportes | 🔴 Sin cambios — Sprint 1+ |
| Legacy Next.js | 📦 Conservado como referencia |

**El proyecto está listo para iniciar Sprint 1 tras su aprobación.**

---

## Comandos de verificación local

```bash
cp .env.example .env
npm install
node scripts/sprint0-verify-db.js    # schema + seed
npm run dev                          # http://localhost:3000
node scripts/sprint0-verify-auth.js  # login admin + coord
```

Credenciales: `admin@sena.edu.co` / `Admin123!` · `coord@sena.edu.co` / `Coord123!`
