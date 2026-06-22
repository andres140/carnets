# SENA Carnés — Sistema de Gestión y Generación de Carnés Institucionales

Plataforma web para administrar usuarios del SENA y generar carnés institucionales con código QR, PDF y auditoría.

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| BD | MySQL 8+ / MariaDB 10+ |
| ORM | Prisma 7 |
| Auth | NextAuth.js v5 (JWT) |
| UI | Tailwind CSS 4 + shadcn/ui |
| PDF | @react-pdf/renderer |
| QR | qrcode + html5-qrcode |
| Validación | Zod |

## Requisitos

- Node.js 20+
- MySQL 8+ (o MariaDB 10+)
- npm

## Inicio rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar entorno

```bash
cp .env.example .env
```

**Importante:** `DATABASE_URL` es la conexión a MySQL. `NODE_ENV=development` muestra credenciales de prueba.

### 3. Crear base de datos y seed

```bash
npx prisma migrate dev
npx prisma db seed
```

### 4. Iniciar servidor

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## 🚀 Credenciales de desarrollo

Cuando `NODE_ENV=development`, la pantalla de login muestra una tarjeta con credenciales de prueba:

**Usuario de prueba:**
- Email: `admin@sena.edu.co`
- Contraseña: `Admin123!`
- Rol: `Administrador`

### Desactivar credenciales en producción

1. Asegúrate de que `.env` tenga:
   ```bash
   NODE_ENV=production
   ```

2. Redeploy la aplicación

El componente `DevCredentialsCard` verifica automáticamente `process.env.NODE_ENV` y no se renderiza en producción.

## Solución de problemas

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Síntoma | Causa | Solución |
|---------|-------|----------|
| Credenciales visibles en producción | `NODE_ENV` no es `production` | Verificar `.env` y redeploy |
| `Access denied` MySQL | Credenciales incorrectas | Ajustar `DATABASE_URL` en `.env` |
| Login falla | BD sin seed | Ejecutar `npx prisma db seed` |
| Carnet_estados tabla faltante | Migraciones incompletas | Ejecutar `npx prisma migrate dev` |

## Scripts

| Comando | Descripción |
|---------|------------|
| `npm run dev` | Dev server Next.js con hot reload |
| `npm run build` | Build producción |
| `npm start` | Start producción |
| `npm test` | Ejecutar tests (vitest) |

## Estructura

```
src/
  app/                    Rutas Next.js (App Router)
  components/             Componentes React reutilizables
  components/auth/        Componentes de autenticación (incluye DevCredentialsCard)
  services/               Lógica de negocio
  repositories/           Acceso a datos
  lib/                    Utilidades
  middleware.ts           Middleware de autenticación

prisma/
  schema.prisma           Definición ORM
  seed.ts                 Seed inicial (usuarios, roles, etc.)
  migrations/             Migraciones de BD

tests/                    Tests unitarios y de integración
```

## Documentación

- [DATABASE.md](./DATABASE.md) — Modelo de datos
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Arquitectura
- [ROADMAP.md](./ROADMAP.md) — Fases del proyecto
- [CHANGELOG.md](./CHANGELOG.md) — Historial de cambios

## Módulos implementados

| # | Módulo | Estado | Descripción |
|---|--------|--------|------------|
| 1 | Autenticación | ✅ Completo | Login con NextAuth, JWT, control de roles |
| 2 | Gestión de Usuarios | ✅ Completo | CRUD, foto, búsqueda, paginación, auditoría |
| 3 | Gestión de Carnés | ✅ Completo | Generación individual/masiva, estados, historial |
| 4 | Validación QR | ✅ Completo | Generación automática, endpoint público de validación |
| 5 | Exportación PDF | ✅ Completo | Plantilla de carné con datos personales |
| 6 | Dashboard | ✅ Completo | Estadísticas en tiempo real |
| 7 | Reportes | ✅ Completo | Exportación CSV, estadísticas por filtro |
| 8 | Auditoría | ✅ Completo | Log de todas las acciones |
| 9 | Credenciales de desarrollo | ✅ Completo | Tarjeta visible en login durante desarrollo |

## Pruebas rápidas

```bash
# Dev login (Next.js)
npm run dev
# Acceder a http://localhost:3000
# Usar credenciales mostradas en la tarjeta de desarrollo

# Tests
npm test
```

### Próximo paso recomendado

Después de completar el módulo de Validación QR:

## MÓDULO 5: HARDENING DE SEGURIDAD

### Alcance
1. **Rate Limiting**
   - Rate limiting en endpoint `/api/validar` (validación pública)
   - Rate limiting en login para prevenir fuerza bruta
   - Rate limiting en endpoints de API críticos
   - Uso de middleware `@upstash/ratelimit` o similar

2. **CSRF Protection**
   - Tokens CSRF en formularios
   - Validación de origen (referer check)
   - SameSite cookie policy

3. **Validación adicional**
   - Sanitización de input en campos de búsqueda
   - Validación de MIME type en uploads
   - Límites de tamaño de archivo

4. **Seguridad de datos**
   - Encriptación de datos sensibles en tránsito (HTTPS)
   - Encriptación de campos en BD (teléfono, documento)
   - Rotación de keys de firmado (QR_SIGNING_KEY)

5. **Auditoría mejorada**
   - Logs de intentos fallidos de acceso
   - Alertas para patrones sospechosos
   - Exportación de auditoría para compliance

### Métricas de éxito
- ✅ Login rechaza más de 5 intentos fallidos en 15 minutos
- ✅ Validación QR soporta 1000 req/hora sin degradación
- ✅ CSRF tokens válidos en todos los formularios
- ✅ Headers de seguridad apropiados (CSP, X-Frame-Options, etc.)
- ✅ Documentación de seguridad actualizada

### Alternativa: MÓDULO 5B - RECUPERACIÓN DE CONTRASEÑA

Si prefieres mejorar UX antes de hardening:
1. Endpoint `/api/auth/forgot-password`
2. Email con link de reset (válido 30 minutos)
3. Página `/reset-password/:token`
4. Auditoría de resets y cambios de contraseña

