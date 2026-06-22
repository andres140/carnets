# Arquitectura — SENA Carnés

## Visión

Sistema **Next.js 16** con arquitectura en capas: API routes → Services → Repositories → Prisma → MySQL.

**Características:**
- Autenticación con NextAuth.js v5 (JWT)
- Control de roles y permisos (RBAC)
- Validación de entrada con Zod
- Componentes reutilizables con shadcn/ui
- TypeScript en toda la codebase

## Diagrama

```
┌─────────────────────────────────────────────────────┐
│          Cliente (Browser / Mobile)                  │
│  React componentes + TypeScript                      │
└────────────────────────┬────────────────────────────┘
                         │ HTTP (JWT en Authorization)
┌────────────────────────▼────────────────────────────┐
│           Next.js 16 (App Router)                    │
│  src/app/                                            │
│    (auth)/login         ← Página de login            │
│    (dashboard)/*        ← Páginas protegidas         │
│    api/                 ← API routes                 │
├────────────────────────────────────────────────────┤
│  Middleware (src/middleware.ts)                      │
│    • Verificación de sesión                         │
│    • CORS                                           │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│     Services & Repositories (Lógica)                 │
│  src/services/                                       │
│  src/repositories/                                   │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│   Prisma ORM (src/lib/prisma.ts)                    │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│      MySQL 8+ / MariaDB 10+                         │
└─────────────────────────────────────────────────────┘
```

## Capas

| Capa | Responsabilidad | Ubicación |
|------|-----------------|-----------|
| **Pages** | Renderizado, UI, lógica cliente | `src/app/(dashboard)/*/page.tsx` |
| **Components** | Componentes reutilizables | `src/components/` |
| **API Routes** | HTTP handlers (GET, POST, PUT, PATCH, DELETE) | `src/app/api/*/route.ts` |
| **Services** | Lógica de negocio | `src/services/` |
| **Repositories** | Acceso a datos | `src/repositories/` |
| **Schemas** | Validación Zod | `src/schemas/` |
| **Types** | Tipos TypeScript | `src/types/` |
| **Prisma** | ORM y cliente | `src/generated/prisma/` |

## Autenticación

**Provider:** NextAuth.js v5 con estrategia `credentials`

**Flujo:**
1. Usuario ingresa email + contraseña en `/login`
2. Credenciales se validan contra BD (Prisma)
3. Se genera token JWT
4. Token se almacena en cookie HTTP-only
5. Middleware verifica token en cada request

**Archivo:** `src/app/api/auth/[...nextauth]/route.ts`

## Control de acceso

**RBAC (Role-Based Access Control):**
- Roles: ADMINISTRADOR, COORDINADOR, FUNCIONARIO, INSTRUCTOR, APRENDIZ, CONTRATISTA
- Permisos granulares por rol
- Verificación en API routes

**Middleware:**
- `withAuth()` — requiere sesión activa
- `withPermission(codigo)` — requiere permiso específico
- `withRole(roles)` — requiere rol específico

## Módulos

### 1. Autenticación ✅
```
GET    /api/auth/session          → Obtener sesión actual
POST   /api/auth/signin            → Generar JWT
POST   /api/auth/callback/...      → Callback NextAuth
POST   /api/auth/signout           → Revocar sesión
```

### 2. Gestión de usuarios ✅
```
GET    /api/usuarios              → Listado paginado
GET    /api/usuarios/:id          → Detalle
POST   /api/usuarios              → Crear
PUT    /api/usuarios/:id          → Actualizar
PATCH  /api/usuarios/:id/estado   → Cambiar estado
```

### 3. Gestión de carnés ✅
```
GET    /api/carnets               → Listado
GET    /api/carnets/:id           → Detalle
POST   /api/carnets               → Generar individual
POST   /api/carnets/masivo        → Generar masivo (CSV)
PATCH  /api/carnets/:id/revocar   → Revocar
PATCH  /api/carnets/:id/suspender → Suspender
GET    /api/carnets/:id/pdf       → Exportar PDF
```

### 4. Validación QR ✅

**Generación automática:**
- Al crear un carné, se genera automáticamente un `qrToken` único
- Token: HMAC-SHA256 con 16 bytes random + 16 bytes signature
- Formato: `{random}.{signature}`
- Almacenado en tabla `carnets.qr_token` (VARCHAR UNIQUE)

**Validación pública:**
```
GET    /api/validar/:codigo       → Validar código QR (público)
POST   /app/validar               → Página de validación con QR scanner
```

**Flujo de validación:**
1. Token llega en query param `/api/validar?token=...`
2. `carnetService.validarQr(token)` verifica integridad del token
3. Si válido, busca carné en BD y valida estado
4. Resuelve estado automático: marca VENCIDO si `fechaVencimiento < now()`
5. Retorna objeto `CarnetValidacionSeguro` con datos públicos solamente
6. Registra validación en tabla `ValidacionQr` para auditoría

**Campos retornados (datos públicos):**
- `codigoUnico`, `nombreCompleto`, `documento`, `tipoUsuario`
- `centroNombre`, `regionalNombre`, `fotoUrl`
- `fechaExpedicion`, `fechaVencimiento`, `estado`
- NO expone: email, teléfono, passwordHash, userId

**Seguridad:**
- Token verificación mediante re-compute de HMAC
- Imposible forjar tokens sin `QR_SIGNING_KEY`
- Validación pública NO requiere autenticación
- Rate limiting recomendado en producción

**Auditoría:**
- Toda validación registrada con IP, resultado, timestamp
- Permite rastrear intentos fallidos, escaneos fraudulentos
- Tabla `ValidacionQr`: carnetId, ip, resultado, usuarioId, createdAt

### 5. Reportes ✅
```
GET    /api/reportes              → Estadísticas generales
GET    /api/reportes?format=csv   → Exportar CSV
```

### 6. Auditoría ✅
```
GET    /api/auditoria             → Log de acciones
```

## Modelo de datos

Ver `prisma/schema.prisma` para detalle completo.

**Tablas principales:**
- `Usuario` — datos personales + autenticación
- `Rol`, `Permiso`, `RolPermiso` — RBAC
- `Carnet` — carnés emitidos
- `CarnetEstadoHistorial` — cambios de estado
- `AuditoriaLog` — log de acciones
- `Regional`, `CentroFormacion`, `Dependencia` — configuración

## Credenciales de desarrollo

**Componente:** `src/components/auth/DevCredentialsCard.tsx`

**Funcionalidad:**
- Se renderiza solo cuando `process.env.NODE_ENV === 'development'`
- Muestra tarjeta con datos del usuario de prueba
- Banner de advertencia clara
- Auto-desactivación en producción

**Cómo desactivar en producción:**
```bash
NODE_ENV=production npm start
```

**Credenciales de prueba:**
- Email: `admin@sena.edu.co`
- Contraseña: `Admin123!`
- Rol: `Administrador`

## Seguridad

- **Contraseñas:** bcryptjs (12 rounds)
- **JWT:** Firmado y con expiración
- **Cookies:** HTTP-only, SameSite=Lax
- **CORS:** Restringido a `APP_URL`
- **Validación:** Zod en entrada
- **SQL:** Parametrizado (Prisma)
- **Auditoría:** Log de mutaciones críticas

## Convenciones de código

- **Español:** UI, comentarios, nombres de negocio
- **Inglés:** Código backend, tipos, servicios
- **Imports:** Alias `@/` para rutas relativas
- **Comentarios:** Solo lógica compleja o decisiones
- **Tipos:** Exportados desde `src/types/`
- **Schemas:** Exportados desde `src/schemas/`
- **Constantes:** En `src/lib/constants.ts`

## Despliegue

### Desarrollo
```bash
npm install
npm run dev
```

### Producción
```bash
npm install --production
npm run build
NODE_ENV=production npm start
```

**Variables de entorno en producción:**
- `NODE_ENV=production`
- `DATABASE_URL=mysql://...`
- `NEXTAUTH_SECRET=<random-key>`
- `NEXTAUTH_URL=https://tudominio.com`
