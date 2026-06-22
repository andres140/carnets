# Sistema de Gestión de Carnés Institucionales SENA

## Visión

Plataforma web para el registro, emisión, validación y auditoría de carnés institucionales del SENA, con control de roles, generación masiva, PDF e QR.

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| Base de datos | MySQL 8 |
| ORM | Prisma 7 |
| Auth | NextAuth.js v5 (JWT) |
| UI | Tailwind CSS 4 + shadcn/ui |
| PDF | @react-pdf/renderer |
| QR | qrcode + html5-qrcode |
| Validación | Zod |

## Tipos de usuario

- Aprendices
- Instructores
- Funcionarios
- Contratistas
- Coordinadores
- Administradores

## Funcionalidades

- [x] Registro, consulta, edición y desactivación de usuarios
- [x] Generación individual y masiva de carnés
- [x] Generación de PDF para impresión
- [x] Código QR para validación pública
- [x] Control de estado (activo, vencido, suspendido, revocado)
- [x] Gestión de roles y permisos (RBAC)
- [x] Reportes y estadísticas con exportación CSV
- [x] Historial de acciones y auditoría
- [x] Diseño responsivo (sidebar + mobile nav)
- [x] Configuración de regionales y centros

## Arquitectura

```
app/ (rutas) → services/ (lógica) → repositories/ → Prisma → MySQL
```

**Reglas:**
- Sin lógica de negocio en `page.tsx`
- Validación con Zod en `schemas/`
- Mutaciones críticas registran `auditoria.service.log()`
- Imports con alias `@/`

## Modelo de datos (resumen)

| Tabla | Descripción |
|-------|-------------|
| regionales | Regionales SENA |
| centros_formacion | Centros por regional |
| dependencias | Dependencias administrativas |
| roles / permisos / rol_permisos | RBAC |
| usuarios | Cuentas y datos personales |
| carnets | Carnés emitidos (snapshot) |
| carnet_estados_historial | Cambios de estado |
| validaciones_qr | Log de escaneos |
| audit_logs | Auditoría global |
| cargas_masivas | Importaciones masivas |

## Roadmap y estado

### Fase 1 — Fundación ✅
- Scaffold, Prisma, documentación, NextAuth, layout, CRUD regionales/centros

### Fase 2 — Usuarios y roles ✅
- CRUD usuarios, RBAC, upload foto, auditoría

### Fase 3 — Carnés individuales ✅
- Generación, QR, PDF, estados

### Fase 4 — Masivo y validación ✅
- CSV masivo, validador QR, historial estados

### Fase 5 — Reportes y auditoría ✅
- Dashboard, reportes, export CSV, vista auditoría

### Fase 6 — Hardening ✅
- Tests unitarios, Docker, documentación despliegue

## Decisiones técnicas

- **QR público**: endpoint `/api/validar/[codigo]` devuelve estado y nombre parcial (sin documento completo)
- **Código único**: `{regional}-{año}-{secuencia}` (ej. REG01-2026-000001)
- **Fotos**: almacenamiento local en `public/uploads` (configurable vía `STORAGE_TYPE`)
- **Scope regional**: coordinadores filtrados por `regional_id` en services

## Credenciales demo (seed)

- Email: `admin@sena.edu.co`
- Contraseña: `Admin123!`

## Convenciones de código

- UI y comentarios de negocio en español
- Nombres de código en inglés
- Tipos en `types/`, schemas Zod en `schemas/`
