# Sprint 3 — Informe de gestión organizacional y control de accesos

**Fecha:** 2026-06-26  
**Objetivo:** Administración completa de la estructura organizacional del SENA y sistema de roles/permisos.  
**Alcance:** Regionales, centros, dependencias, roles, permisos, control de acceso e integración con usuarios.

---

## Resumen ejecutivo

El Sprint 3 implementó el módulo organizacional completo siguiendo la arquitectura Route → Controller → Service → Repository. Se añadieron permisos granulares, auditoría en todas las mutaciones, interfaz unificada con pestañas y validación de integridad referencial. El módulo de usuarios (Sprint 2) sigue operando mediante catálogos dinámicos sin cambios breaking.

**Verificación:** `node scripts/sprint3-verify-organizacion.js` → `SPRINT3_ORGANIZACION_OK`

---

## 1. Funcionalidades implementadas

### Módulo 1 — Regionales
- CRUD completo (crear, consultar, editar, desactivar, reactivar).
- Campos: código, nombre, estado (activo/inactivo).
- Código único, sin eliminación física.

### Módulo 2 — Centros de formación
- CRUD completo con regional obligatoria.
- Validación: centro pertenece a regional activa.
- Código único, desactivación bloqueada si hay dependencias activas.

### Módulo 3 — Dependencias
- CRUD completo con centro obligatorio.
- Nombre único por centro.
- Desactivación bloqueada si hay usuarios activos asignados.

### Módulo 4 — Roles
- Crear, editar, consultar, desactivar, reactivar.
- Columna `activo` en tabla `roles`.
- No desactivar roles con usuarios asignados.

### Módulo 5 — Permisos
- Listar, crear y editar permisos.
- Asignación de permisos a roles (`PUT /api/roles/:id/permisos`).
- Interfaz con checkboxes por rol.

### Módulo 6 — Control de acceso
- `requireAuth` valida usuario autenticado y estado `ACTIVO`.
- `requirePermission` por operación en cada ruta.
- Páginas protegidas por permisos (`organizacion.html`, `usuarios.html`).

### Módulo 7 — Integración con usuarios
- Catálogos `/api/catalogos/*` devuelven solo entidades activas.
- Roles activos en formulario de usuarios.
- Validación de rol inactivo al crear/editar usuario.

### Auditoría
- CREAR, ACTUALIZAR, DESACTIVAR, REACTIVAR en todas las entidades.
- Asignación de permisos registrada con diff antes/después.

### Interfaz
- `organizacion.html` con 5 pestañas, buscador, filtros, paginación, toasts y confirmaciones.

---

## 2. Archivos modificados / creados

### Backend
| Archivo | Descripción |
|---------|-------------|
| `repositories/regionales.repository.js` | **Nuevo** |
| `repositories/centros.repository.js` | **Nuevo** |
| `repositories/dependencias.repository.js` | **Nuevo** |
| `repositories/roles.repository.js` | **Nuevo** |
| `repositories/permisos.repository.js` | **Nuevo** |
| `services/regionales.service.js` | **Nuevo** |
| `services/centros.service.js` | **Nuevo** |
| `services/dependencias.service.js` | **Nuevo** |
| `services/roles.service.js` | **Nuevo** |
| `services/permisos.service.js` | **Nuevo** |
| `controllers/organizacion.controller.js` | **Nuevo** |
| `controllers/roles.controller.js` | **Nuevo** |
| `routes/organizacion.routes.js` | **Nuevo** |
| `routes/roles.routes.js` | **Nuevo** |
| `routes/index.js` | Registro de rutas |
| `routes/catalog.routes.js` | Permisos en catálogos |
| `routes/pages.routes.js` | Página organización |
| `middleware/auth.js` | Validación usuario activo |
| `utils/helpers.js` | `estado` en sesión |
| `utils/auditHelper.js` | **Nuevo** |
| `utils/diff.js` | `computeEntityChanges` |
| `constants/index.js` | Permisos organizacionales |
| `services/catalog.service.js` | Roles activos |
| `services/users.service.js` | Validar rol activo |

### Frontend
| Archivo | Descripción |
|---------|-------------|
| `public/pages/organizacion.html` | **Nuevo** |
| `public/js/organizacion.js` | **Nuevo** |
| `public/css/organizacion.css` | **Nuevo** |
| `public/pages/dashboard.html` | Nav organización |
| `public/pages/usuarios.html` | Nav organización |

### Base de datos
| Archivo | Descripción |
|---------|-------------|
| `database/schema.sql` | `roles.activo` |
| `database/seed.sql` | Permisos perm-015 a perm-021 |
| `database/migrations/004_sprint3_roles_activo.sql` | **Nuevo** |
| `scripts/sprint3-setup-db.js` | **Nuevo** |
| `scripts/sprint3-verify-organizacion.js` | **Nuevo** |

---

## 3. Cambios en base de datos

```sql
ALTER TABLE roles ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1;
```

**Nuevos permisos:**
- `regionales.ver`, `regionales.gestionar`
- `centros.ver`, `centros.gestionar`
- `dependencias.ver`, `dependencias.gestionar`
- `permisos.gestionar`

Administrador recibe todos automáticamente vía seed.

**Aplicar en BD existente:**
```bash
node scripts/sprint3-setup-db.js
```

---

## 4. API endpoints nuevos

| Método | Ruta | Permiso |
|--------|------|---------|
| GET/POST | `/api/regionales` | ver / gestionar |
| GET/PUT | `/api/regionales/:id` | ver / gestionar |
| PATCH | `/api/regionales/:id/desactivar\|reactivar` | gestionar |
| GET/POST | `/api/centros` | ver / gestionar |
| GET/PUT/PATCH | `/api/centros/:id` | ver / gestionar |
| GET/POST | `/api/dependencias` | ver / gestionar |
| GET/PUT/PATCH | `/api/dependencias/:id` | ver / gestionar |
| GET/POST | `/api/roles` | roles.gestionar |
| GET/PUT/PATCH | `/api/roles/:id` | roles.gestionar |
| PUT | `/api/roles/:id/permisos` | roles.gestionar |
| GET/POST/PUT | `/api/permisos` | permisos.gestionar |

Catálogos legacy (`/api/catalogos/*`) se mantienen para el módulo de usuarios.

---

## 5. Casos de prueba

| Prueba | Resultado |
|--------|-----------|
| CRUD regional + duplicado código | OK |
| CRUD centro vinculado a regional | OK |
| CRUD dependencia vinculada a centro | OK |
| CRUD rol + asignar permisos | OK |
| Catálogos integración usuarios | OK |
| Desactivar dependencia → centro → regional | OK |
| Desactivar rol sin usuarios | OK |
| 401 sin sesión | OK |

```bash
node scripts/sprint3-setup-db.js
npm run dev
node scripts/sprint3-verify-organizacion.js
```

---

## 6. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| BD existente sin nuevos permisos | Ejecutar `sprint3-setup-db.js` |
| Rate limit en pruebas consecutivas | Esperar entre scripts de verificación |
| Coordinador sin acceso organizacional | Por diseño; solo administrador gestiona estructura |

---

## 7. Pendientes

- UI de consulta de auditoría organizacional.
- Coordinador con gestión limitada a su regional (alcance parcial).
- Tests Jest integrados en CI.

---

## 8. Recomendaciones para Sprint 4 (Carnés)

1. Reutilizar regionales/centros activos al emitir carné (snapshot en tabla `carnets`).
2. Permisos `carnets.*` ya definidos en seed — aplicar `requirePermission` como en usuarios.
3. Validar que usuario tenga regional/centro activos antes de generar carné.
4. Auditoría en emisión, revocación y suspensión.
5. Script `sprint4-verify-carnets.js` siguiendo el patrón de sprints anteriores.

---

## Condición de cierre

- Estructura organizacional funcional e integrada con usuarios.
- **Esperando aprobación del usuario antes de iniciar Sprint 4.**
