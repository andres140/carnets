# PROJECT_CONTEXT — SENA Carnés

> Contexto completo para que cualquier desarrollador o IA pueda continuar el proyecto sin perder información.

**Última actualización:** 2026-07-01 (Sprint 10 — v1.0.0 RC1)  
**Stack activo:** Express + MySQL + HTML/Bootstrap (`backend/` + `public/`)  
**Stack legacy (no modificar):** Next.js + Prisma (`src/`)  
**Avance estimado:** 97% — **LISTO PARA ENTREGA**  
**Informe final:** [FINAL_PROJECT_REPORT.md](./FINAL_PROJECT_REPORT.md)

---

## ¿Qué hace el proyecto?

Sistema web para el **Servicio Nacional de Aprendizaje (SENA)** que permite:

1. Administrar usuarios institucionales (aprendices, instructores, funcionarios, etc.)
2. Generar carnés institucionales con código único
3. Validar carnés mediante código QR (público)
4. Exportar carnés en PDF para impresión
5. Controlar acceso por roles y permisos (RBAC)
6. Auditar acciones críticas del sistema
7. Generar reportes y estadísticas

---

## ¿Cómo funciona?

### Arranque

```bash
# 1. MySQL (Docker o local)
docker compose up -d

# 2. Esquema y datos
npm run setup:db
# Equivalente manual:
# mysql -u root -p < database/schema.sql
# mysql -u root -p < database/seed.sql
# node scripts/setup-db.js

# 3. Variables de entorno
cp .env.example .env

# 4. Dependencias (ver nota abajo)
npm install

# 5. Servidor
npm run dev   # → node backend/server.js
```

**URL:** http://localhost:3000

### Nota crítica sobre dependencias

Todas las dependencias runtime están declaradas en `package.json` (Sprint 0 ✅). Ejecutar `npm install` antes de `npm run dev`.

### Verificación Sprint 0

```bash
node scripts/sprint0-verify-db.js    # schema + seed
npm run dev
node scripts/sprint0-verify-auth.js    # login admin + coord
```

### Verificación Sprint 2 — Usuarios

```bash
npm run dev
node scripts/sprint2-verify-usuarios.js
```

### Verificación Sprint 3 — Organización

```bash
node scripts/sprint3-setup-db.js   # BD existente: permisos + roles.activo
npm run dev
node scripts/sprint3-verify-organizacion.js
```

### Verificación Sprint 4 — Carnés

```bash
node scripts/sprint4-setup-db.js
npm run dev
node scripts/sprint4-verify-carnets.js
```

### Verificación Sprint 7 — Dashboard ejecutivo

```bash
npm run dev
node scripts/sprint7-verify-dashboard.js
```

### Verificación Sprint 8 — Reportes

```bash
npm run dev
node scripts/sprint8-verify-reportes.js
```

### Quality Gate pre-Sprint 8 (2026-07-01)

```bash
node scripts/sprint0-verify-db.js
npm run dev
node scripts/sprint0-verify-auth.js
node scripts/sprint2-verify-usuarios.js
node scripts/sprint3-verify-organizacion.js
node scripts/sprint4-verify-carnets.js
node scripts/sprint5-verify-pdf.js
node scripts/sprint6-verify-qr.js
node scripts/sprint7-verify-dashboard.js
```

> Si se encadenan todos los scripts sin reiniciar el servidor, el rate limit de login (5/15 min) puede bloquear logins adicionales. Reiniciar `npm run dev` entre lotes o ejecutar por sprint.

**Migraciones opcionales (seguridad avanzada):** aplicar `migrations/002_security_audit.sql` y `migrations/003_password_recovery_2fa.sql` si se usan recuperación de contraseña, 2FA o auditoría de seguridad en login.

### Verificación Sprint 6 — Validación QR

```bash
node scripts/sprint6-setup-db.js
npm run dev
node scripts/sprint6-verify-qr.js
```

### Verificación Sprint 5 — PDF e impresión

```bash
node scripts/sprint5-setup-db.js
npm run dev
node scripts/sprint5-verify-pdf.js
```

### Flujo de una petición

```
Browser (public/js/*.js)
  → fetch /api/* con credentials + X-CSRF-Token (mutaciones)
  → Express (backend/app.js)
  → Middleware: CORS, security headers, rate limit, session, CSRF
  → Router (backend/routes/)
  → Controller (orquestación + auditoría)
  → Service (lógica de negocio, permisos de alcance)
  → Repository (SQL parametrizado) — Sprint 1+
  → MySQL (mysql2 pool)
```

### Autenticación

- **Mecanismo:** `express-session` con cookie `sena_carnets_sid`
- **Contraseñas:** bcrypt (12 rounds)
- **Sesión almacena:** id, email, nombreCompleto, rolNombre, tipoUsuario, permisos[]
- **Protección páginas:** `requireAuth` en `pages.routes.js`
- **Protección API:** `requireAuth` + `requireRole('ADMINISTRADOR', 'COORDINADOR')` en usuarios

### Credenciales demo (seed)

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@sena.edu.co | Admin123! | ADMINISTRADOR |
| coord@sena.edu.co | Coord123! | COORDINADOR |

> El usuario coordinador en `seed.sql` está corregido (`rol_id='rol-coord'`, contraseña `Coord123!`).

---

## Estructura del repositorio

```
app_carnets/
├── backend/                 # ← STACK ACTIVO
│   ├── server.js            # Entry point
│   ├── app.js               # Config Express
│   ├── config/              # env, database, session, upload
│   ├── controllers/         # authController, users.controller
│   ├── middleware/          # auth, validate, csrf, rateLimit, errorHandler
│   ├── routes/              # index, auth, users, pages
│   ├── services/            # auth, users, catalog, auditoria, security...
│   ├── lib/                 # email, sanitización, passwords, carnetTemplate, pdf
│   └── templates/carnets/   # Plantillas EJS intercambiables (Sprint 5)
│
├── public/                  # ← FRONTEND ACTIVO
│   ├── pages/               # login.html, dashboard.html, usuarios.html
│   ├── js/                  # api.js, login.js, dashboard.js, usuarios.js
│   ├── css/                 # sena.css, login.css, usuarios.css
│   ├── templates/           # carnet-template.json (referencia legacy)
│   ├── pages/carnets-imprimir.html  # Vista impresión (Sprint 5)
│   ├── index.html           # Landing
│   ├── validar.html         # Placeholder QR
│   └── carnets.html         # Huérfano (API mock no montada)
│
├── database/
│   ├── schema.sql           # Esquema MySQL principal
│   └── seed.sql             # Datos iniciales
│
├── migrations/              # Migraciones adicionales (no integradas en schema)
│
├── src/                     # ← LEGACY Next.js (NO MODIFICAR)
│   ├── app/                 # Páginas y API routes Next.js
│   ├── components/          # React + shadcn/ui
│   ├── services/            # Lógica de negocio completa (referencia)
│   ├── repositories/        # Prisma queries
│   └── ...
│
├── prisma/                  # Schema Prisma legacy
├── tests/                   # Tests (mayoría apuntan a legacy/mock)
├── index.js                 # Servidor mock carnets (legacy raíz)
└── docs: README, DATABASE, ARCHITECTURE, ROADMAP, CHANGELOG, TASKS
```

---

## Módulos

| Módulo | Estado Express | Archivos clave |
|--------|---------------|----------------|
| Auth | Completo | `auth.controller.js`, `login.html`, `login.js` |
| Usuarios | Completo | `users.*`, `usuarios.html` — Sprint 2 ✅ |
| Organización | Completo | `organizacion.*`, `roles.*` — Sprint 3 ✅ |
| Carnés | **Completo** | `carnets.*`, `carnetPdf.*` — Sprint 4–5 |
| PDF / Impresión | **Completo** | Sprint 5 |
| QR / Validación | **Completo** | Sprint 6 |
| Dashboard | **Completo (ejecutivo)** | Sprint 7 — Chart.js, `/api/dashboard` |
| Reportes | **Completo** | Sprint 8 — `/api/reportes`, `reportes.html` |
| Auditoría | **Completo** | Sprint 9 — `/api/auditoria`, `auditoria.html` |
| Configuración | **Completo** | Sprint 9 — `/api/configuracion/sistema`, `sistema.html` |
| Notificaciones | **Completo** | Sprint 9 — `/api/notificaciones`, campana navbar |
| Sesiones | **Completo** | Sprint 9 — `/api/sesiones`, `sessionGuard.js` |
| Monitoreo | **Completo** | Sprint 9 — `/api/monitoreo/*` |
| Config catálogos | Catálogos GET | `catalog.service.js` |

---

## Base de datos

- **Motor:** MySQL 8 (utf8mb4)
- **Nombre:** `sena_carnets`
- **IDs:** UUID v4 (VARCHAR(36)) generados con `crypto.randomUUID()` en `helpers.js`
- **Documentación detallada:** [DATABASE.md](./DATABASE.md)

### Tablas principales

- `usuarios` — cuentas con FK a roles, regionales, centros, dependencias
- `carnets` — snapshot al emitir; `pdf_url`, `pdf_hash`, `template_id`, `reimpresiones_count`
- `historial_carnets` — cambios de estado
- `carnet_documentos_historial` — generación, descarga, impresión, reimpresión (Sprint 5)
- `validaciones_qr` — log de escaneos
- `auditoria` — acciones del sistema (JSON en `detalle_json`; Sprint 9: `modulo`, `resultado`, `user_agent`)
- `auditoria_seguridad` — eventos de seguridad (login fallido, rate limit, etc.)
- `configuracion_sistema` — parámetros clave-valor del sistema (Sprint 9)
- `notificaciones` — alertas internas por usuario o globales (Sprint 9)
- `sesiones_usuario` — registro de sesiones activas (Sprint 9)
- `roles` / `permisos` / `rol_permisos` — RBAC

### Código único de carné (diseño)

Formato: `{codigoRegional}-{año}-{secuencia}` → Ej: `REG01-2026-000001`

---

## Dependencias

### Runtime (requeridas, algunas no en package.json)

| Paquete | Uso |
|---------|-----|
| express | Servidor HTTP |
| mysql2 | Pool de conexiones MySQL |
| bcryptjs | Hash de contraseñas |
| express-session | Sesiones |
| multer | Upload de fotos |
| dotenv | Variables de entorno |
| cors | CORS con credenciales |
| nodemailer | Emails (recuperación contraseña) |
| ejs | Plantillas HTML de carné |
| qrcode | Generación imágenes QR |

### Legacy (en node_modules pero no en package.json activo)

next, react, prisma, @prisma/client, tailwindcss, vitest, zod, etc.

---

## Variables de entorno

Ver `.env.example`:

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto HTTP (3000) — **NO confundir con DB_PORT** |
| `DB_*` | Conexión MySQL |
| `SESSION_SECRET` | Secreto de sesión |
| `UPLOAD_DIR` | Directorio de fotos (`public/uploads`) |
| `QR_SIGNING_KEY` | Firma HMAC para tokens QR |
| `CARNET_TEMPLATE_ID` | Plantilla activa (`default`) |
| `CARNET_PDF_DIR` | Directorio caché PDF (`public/uploads/carnets`) |

---

## Convenciones

### Código

- **UI y mensajes al usuario:** español
- **Código (variables, funciones, archivos):** inglés
- **Respuestas API:** `{ success: boolean, data?: any, error?: string, message?: string }`
- **SQL:** siempre parametrizado (`?` placeholders)
- **Mutaciones críticas:** llamar `auditoriaService.log()`
- **IDs:** UUID v4

### Arquitectura

```
Routes → Controllers → Services → MySQL
```

- Controllers: solo orquestación HTTP, sin lógica de negocio
- Services: validaciones de negocio, queries SQL
- No eliminar rutas/APIs existentes
- No cambiar nombres de tablas sin autorización
- Reutilizar componentes y servicios existentes

### Archivos legacy

La carpeta `src/` contiene implementación Next.js previa. **No modificar** salvo migración explícita. Usar como referencia para portar funcionalidades a Express.

---

## Cómo continuar el desarrollo

### Orden recomendado (ver ROADMAP.md y TASKS.md)

1. **Corregir bloqueadores** — package.json, seed.sql coordinador, integración CSRF en frontend
2. **Verificar módulo usuarios** — probar CRUD end-to-end con MySQL
3. **Implementar carnés en Express** — portar lógica de `src/services/carnet.service.ts`
4. **QR + validación pública** — portar `qr.service.ts` y UI de `QRScanner.tsx` a vanilla JS
5. **PDF** — implementar generación con plantilla existente
6. **Dashboard + reportes** — API de estadísticas
7. **Hardening** — tests, despliegue, documentación

### Al portar desde legacy Next.js

1. Leer el service en `src/services/`
2. Reimplementar en `backend/services/` con mysql2
3. Crear controller + routes siguiendo patrón de `users.controller.js`
4. Crear página HTML + JS en `public/`
5. Registrar ruta en `pages.routes.js` si requiere auth
6. Actualizar TASKS.md y CHANGELOG.md

### Al modificar código

Antes de cada cambio documentar:
- Qué se encontró
- Por qué se modifica
- Impacto y archivos afectados
- Riesgos y beneficios

---

## Documentación relacionada

| Archivo | Contenido |
|---------|-----------|
| [AUDITORIA_PROYECTO.md](./AUDITORIA_PROYECTO.md) | Auditoría técnica completa |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitectura detallada |
| [DATABASE.md](./DATABASE.md) | Modelo de datos |
| [ROADMAP.md](./ROADMAP.md) | Fases y cronograma |
| [TASKS.md](./TASKS.md) | Checklist de tareas |
| [SPRINT_1_REPORT.md](./SPRINT_1_REPORT.md) | Informe Sprint 1 — consolidación arquitectónica |
| [SPRINT_0_REPORT.md](./SPRINT_0_REPORT.md) | Informe Sprint 0 — estabilización |

---

## Contacto / contexto institucional

Proyecto académico SENA — Sistema de Gestión y Generación de Carnés Institucionales.  
Tipos de usuario: APRENDIZ, INSTRUCTOR, FUNCIONARIO, CONTRATISTA, COORDINADOR, ADMINISTRADOR.
