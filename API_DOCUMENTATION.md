# API_DOCUMENTATION.md — SENA Carnés v1.0.0

Referencia de la API REST. Base URL: `{APP_URL}/api`

## Convenciones

### Formato de respuesta

```json
{ "success": true, "data": { ... }, "message": "opcional" }
{ "success": false, "error": "mensaje descriptivo" }
```

### Autenticación

Sesión basada en cookies (`express-session`). Obtener token CSRF antes de mutaciones:

```
GET /api/auth/csrf-token
→ { "data": { "csrfToken": "..." } }
```

Incluir en POST/PUT/PATCH/DELETE:
```
Header: X-CSRF-Token: <token>
Cookie: sena_carnets_sid=...
```

### Paginación

Query params: `page` (default 1), `limit` (default 10–25, máx 100).

```json
{
  "data": {
    "items": [...],
    "pagination": { "page": 1, "limit": 25, "total": 120, "totalPages": 5 }
  }
}
```

### Códigos HTTP

| Código | Significado |
|--------|-------------|
| 200 | Éxito |
| 201 | Creado |
| 400 | Validación / solicitud inválida |
| 401 | No autenticado |
| 403 | Sin permisos |
| 404 | No encontrado |
| 429 | Rate limit excedido |
| 500 | Error interno |

---

## Auth — `/api/auth`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/csrf-token` | No | Obtener token CSRF |
| POST | `/login` | No | Iniciar sesión `{ email, password }` |
| POST | `/logout` | Sí | Cerrar sesión |
| GET | `/me` | Sí | Usuario actual con permisos |

### Recuperación de contraseña — `/api/auth/password-recovery`

| Método | Ruta | Auth | Body |
|--------|------|------|------|
| POST | `/forgot-password` | No | `{ email }` |
| POST | `/validate-reset-token` | No | `{ token }` |
| POST | `/reset-password` | No | `{ token, password }` |
| GET | `/status` | Admin | Tokens pendientes |

### 2FA — `/api/auth/2fa`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/setup` | Sí | Iniciar configuración TOTP |
| POST | `/verify` | Sí | Confirmar setup `{ token }` |
| POST | `/verify-login` | No | Completar login 2FA `{ usuarioId, token }` |
| POST | `/disable` | Sí | Desactivar 2FA |
| GET | `/status` | Sí | Estado 2FA del usuario |

> **Nota:** 2FA es opcional; el login principal no lo exige aún (limitación v1.0.0).

---

## Usuarios — `/api/usuarios`

Permiso: `usuarios.ver` (GET), `usuarios.crear` (POST), `usuarios.editar` (PUT/PATCH)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/usuarios` | Listar con filtros: `search`, `estado`, `tipo`, `regionalId`, `centroId`, `page`, `limit` |
| GET | `/usuarios/:id` | Detalle |
| POST | `/usuarios` | Crear (multipart: campo `foto` opcional) |
| PUT | `/usuarios/:id` | Actualizar |
| PATCH | `/usuarios/:id/desactivar` | Desactivar |
| PATCH | `/usuarios/:id/reactivar` | Reactivar |

---

## Organización

### Regionales — `/api/regionales`

| Método | Ruta | Permiso |
|--------|------>


| GET | `/regionales` | `regionales.ver` |
| POST | `/regionales` | `regionales.gestionar` |
| PUT | `/regionales/:id` | `regionales.gestionar` |
| PATCH | `/regionales/:id/desactivar` | `regionales.gestionar` |
| PATCH | `/regionales/:id/reactivar` | `regionales.gestionar` |

### Centros — `/api/centros`

Misma estructura. Permisos: `centros.ver`, `centros.gestionar`.

### Dependencias — `/api/dependencias`

Permisos: `dependencias.ver`, `dependencias.gestionar`.

---

## Roles y permisos — `/api/roles`, `/api/permisos`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/roles` | Listar roles |
| POST | `/roles` | Crear rol |
| PUT | `/roles/:id/permisos` | Asignar permisos `{ permisoIds: [] }` |
| GET | `/permisos` | Listar permisos |

---

## Catálogos — `/api/catalogos`

Para formularios (selects). Requiere permisos de catálogo según rol.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/catalogos/roles` | Roles activos |
| GET | `/catalogos/regionales` | Regionales |
| GET | `/catalogos/centros?regionalId=` | Centros filtrados |
| GET | `/catalogos/dependencias?centroId=` | Dependencias |

---

## Carnés — `/api/carnets`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/carnets` | Listar (filtros: estado, búsqueda, regional, fechas) |
| GET | `/carnets/:id` | Detalle |
| POST | `/carnets` | Emitir `{ usuarioId, observacion? }` |
| POST | `/carnets/:id/renovar` | Renovar vigencia |
| PATCH | `/carnets/:id/suspender` | Suspender |
| PATCH | `/carnets/:id/reactivar` | Reactivar |
| PATCH | `/carnets/:id/revocar` | Revocar |
| GET | `/carnets/:id/historial` | Historial de estados |
| GET | `/carnets/:id/preview` | Vista previa HTML |
| GET | `/carnets/:id/pdf` | Descargar PDF |
| POST | `/carnets/:id/pdf/regenerar` | Regenerar PDF |
| POST | `/carnets/:id/reimprimir` | Registrar reimpresión |
| GET | `/carnets/usuario/:usuarioId` | Carné del usuario |

---

## Validación QR — `/api/validar/:token`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/validar/:token` | **No** (público) | Validar carné por token QR |

Rate limit: 100 req/hora por IP.

Respuesta pública (sin datos sensibles):
```json
{
  "success": true,
  "data": {
    "valido": true,
    "estado": "ACTIVO",
    "nombre": "Juan Pérez",
    "documento": "****1234",
    "centro": "Centro Industrial",
    "vigencia": "2027-06-01"
  }
}
```

---

## Dashboard — `/api/dashboard`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/dashboard` | Dashboard completo (KPIs, gráficas, alertas, actividad) |
| GET | `/dashboard/stats` | Solo estadísticas resumidas |

Alcance automático por rol (nacional / regional / centro / personal).

---

## Reportes — `/api/reportes`

Permiso: `reportes.ver`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/reportes/estadisticas` | KPIs globales |
| GET | `/reportes/usuarios` | Reporte usuarios |
| GET | `/reportes/carnets` | Reporte carnés |
| GET | `/reportes/validaciones` | Reporte validaciones QR |
| GET | `/reportes/busqueda?tipo=` | Búsqueda avanzada |
| GET | `/reportes/{tipo}/export?format=` | Export CSV, XLSX o PDF |

Query params comunes: `fechaDesde`, `fechaHasta`, `estado`, `regionalId`, `limit`.

---

## Auditoría — `/api/auditoria`

Permiso: `auditoria.ver`

| Método | Ruta | Query params |
|--------|------|--------------|
| GET | `/auditoria` | `usuarioId`, `rol`, `modulo`, `accion`, `resultado`, `ip`, `fechaDesde`, `fechaHasta`, `search`, `page`, `limit` |
| GET | `/auditoria/seguridad` | Eventos de seguridad recientes |

---

## Configuración — `/api/configuracion/sistema`

Permiso: `config.gestionar`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/configuracion/sistema` | Todos los parámetros |
| PUT | `/configuracion/sistema` | Actualizar `{ clave: valor, ... }` |
| POST | `/configuracion/sistema/logo` | Subir logo (multipart: `logo`) |

Claves: `institucion_nombre`, `logo_url`, `session_max_age_ms`, `carnet_vigencia_anos`, `carnet_codigo_formato`, `upload_max_mb`, `idioma`, `timezone`.

---

## Notificaciones — `/api/notificaciones`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/notificaciones` | Listar (`soloNoLeidas`, `limit`) |
| PATCH | `/notificaciones/:id/leer` | Marcar leída |
| POST | `/notificaciones/leer-todas` | Marcar todas leídas |

---

## Sesiones — `/api/sesiones`

| Método | Ruta | Permiso | Descripción |
|--------|------|---------|-------------|
| GET | `/sesiones` | `config.gestionar` | Sesiones activas |
| POST | `/sesiones/:id/revoke` | `config.gestionar` | Cerrar sesión remota |
| GET | `/sesiones/mis-accesos` | Auth | Últimos accesos del usuario |

---

## Monitoreo — `/api/monitoreo`

Permiso: `config.gestionar`

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/monitoreo/estado` | MySQL, sesiones, almacenamiento |
| GET | `/monitoreo/seguridad` | Diagnóstico de rutas críticas |

---

## Health — `/api/health`

| Método | Ruta | Auth |
|--------|------|------|
| GET | `/health` | No |

```json
{ "success": true, "status": "ok", "service": "SENA Carnés API" }
```

---

## Ejemplo: flujo completo autenticado

```bash
# 1. CSRF + Login
curl -c cookies.txt http://localhost:3000/api/auth/csrf-token
CSRF=$(jq -r .data.csrfToken cookies.txt)
curl -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" -H "X-CSRF-Token: $CSRF" \
  -d '{"email":"admin@sena.edu.co","password":"Admin123!"}'

# 2. Consultar dashboard
curl -b cookies.txt http://localhost:3000/api/dashboard

# 3. Exportar reporte CSV
curl -b cookies.txt "http://localhost:3000/api/reportes/usuarios/export?format=csv&limit=10" -o usuarios.csv
```

---

## Permisos del sistema

| Código | Descripción |
|--------|-------------|
| `usuarios.ver` | Ver usuarios |
| `usuarios.crear` | Crear usuarios |
| `usuarios.editar` | Editar usuarios |
| `carnets.ver` | Ver carnés |
| `carnets.generar` | Emitir carnés |
| `validar.qr` | Validar QR autenticado |
| `reportes.ver` | Ver reportes |
| `auditoria.ver` | Ver auditoría |
| `config.gestionar` | Configuración del sistema |
| `regionales.gestionar` | Gestionar regionales |
| `centros.gestionar` | Gestionar centros |
| `roles.gestionar` | Gestionar roles |

Lista completa en `database/seed.sql`.
