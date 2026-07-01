# SPRINT 9 REPORT — Auditoría Avanzada, Configuración del Sistema y Notificaciones

**Fecha:** 2026-07-01  
**Estado:** ✅ Completado  
**Verificación:** `node scripts/sprint9-verify-sistema.js` → `SPRINT9_SISTEMA_OK`  
**Migración BD:** `node scripts/sprint9-setup-db.js` → `SPRINT9_DB_OK`

---

## Funcionalidades implementadas

### Módulo 1 — Bitácora General
- Registro automático ampliado con: `rol_nombre`, `modulo`, `resultado`, `user_agent`, `ip`
- Eventos cubiertos: login, logout, intentos fallidos, usuarios, carnés, validaciones QR, exportaciones, configuración
- Helper centralizado `auditHelper.logAudit()` integrado en controladores y servicios existentes

### Módulo 2 — Consulta de Auditoría
- API `GET /api/auditoria` con filtros: usuario, rol, módulo, acción, fecha, resultado, IP, búsqueda rápida
- Paginación y metadatos de filtros disponibles
- UI `/auditoria.html` con tabla, filtros y panel de eventos de seguridad
- API `GET /api/auditoria/seguridad` para incidentes recientes

### Módulo 3 — Configuración General
- Tabla `configuracion_sistema` (clave-valor en BD)
- Parámetros: institución, logo, sesión, vigencia carné, formato código, tamaño foto, idioma, zona horaria
- API `GET/PUT /api/configuracion/sistema`, `POST /api/configuracion/sistema/logo`
- UI pestaña Configuración en `/sistema.html` con carga de logo

### Módulo 4 — Notificaciones
- Tabla `notificaciones` con soporte usuario específico o global (`usuario_id` NULL)
- Tipos: carnés por vencer, sin foto, acceso sospechoso, exportación, cambio de config
- API `GET /api/notificaciones`, `PATCH /:id/leer`, `POST /leer-todas`
- Campana en navbar (`notificaciones-ui.js`) + panel en Sistema
- Arquitectura preparada para canal email futuro (`notify()` desacoplado)

### Módulo 5 — Gestión de Sesiones
- Tabla `sesiones_usuario` con IP, user-agent, dispositivo, actividad
- Registro en login, cierre en logout, revocación administrativa
- Middleware `sessionGuard` valida sesiones revocadas
- API `GET /api/sesiones`, `POST /:id/revoke`, `GET /mis-accesos`
- UI pestaña Sesiones en `/sistema.html`

### Módulo 6 — Monitoreo del Sistema
- API `GET /api/monitoreo/estado` — MySQL, sesiones activas, almacenamiento uploads
- API `GET /api/monitoreo/seguridad` — rutas críticas y recomendaciones
- UI pestaña Monitoreo en `/sistema.html`

### Módulo 7 — Seguridad
- Integración con `auditoria_seguridad` (migración 002 aplicada por setup script)
- Detección de actividad sospechosa → notificación automática
- Permisos: `auditoria.ver` (consulta), `config.gestionar` (config/sesiones/monitoreo)

### Módulo 8 — Integración
- Dashboard: accesos rápidos a Auditoría y Sistema
- Exportaciones de reportes generan auditoría + notificación
- Cambios de configuración generan auditoría + notificación global
- Navbar unificado con campana de notificaciones

---

## Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `database/migrations/008_sprint9_sistema.sql` | Tablas config, notificaciones, sesiones; ampliación auditoría |
| `scripts/sprint9-setup-db.js` | Aplicador de migración (008 + 002) |
| `scripts/sprint9-verify-sistema.js` | Verificación end-to-end |
| `backend/repositories/auditoria.repository.js` | Consultas bitácora |
| `backend/repositories/configuracion.repository.js` | CRUD config clave-valor |
| `backend/repositories/notificaciones.repository.js` | Notificaciones internas |
| `backend/repositories/sesiones.repository.js` | Sesiones de usuario |
| `backend/services/configuracion.service.js` | Config con caché |
| `backend/services/notificaciones.service.js` | Alertas automáticas |
| `backend/services/sesiones.service.js` | Registro y revocación |
| `backend/services/monitoreo.service.js` | Estado del sistema |
| `backend/controllers/auditoria.controller.js` | Controlador auditoría |
| `backend/controllers/configuracion.controller.js` | Controlador config |
| `backend/controllers/notificaciones.controller.js` | Controlador notificaciones |
| `backend/controllers/sesiones.controller.js` | Controlador sesiones |
| `backend/controllers/monitoreo.controller.js` | Controlador monitoreo |
| `backend/routes/auditoria.routes.js` | Rutas auditoría |
| `backend/routes/sistema.routes.js` | Rutas config + monitoreo |
| `backend/routes/notificaciones.routes.js` | Rutas notificaciones |
| `backend/routes/sesiones.routes.js` | Rutas sesiones |
| `backend/middleware/sessionGuard.js` | Validación sesiones revocadas |
| `public/pages/auditoria.html` | UI consulta auditoría |
| `public/pages/sistema.html` | UI config, sesiones, monitoreo |
| `public/js/auditoria.js` | Cliente auditoría |
| `public/js/sistema.js` | Cliente sistema |
| `public/js/notificaciones-ui.js` | Campana de notificaciones |
| `public/css/auditoria.css` | Estilos auditoría |
| `public/css/sistema.css` | Estilos sistema |
| `public/uploads/placeholder-logo.png` | Logo placeholder |

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `backend/services/auditoria.service.js` | Reescrito: log ampliado, list, seguridad |
| `backend/utils/auditHelper.js` | Campos modulo, resultado, userAgent |
| `backend/utils/request.js` | getUserAgent, parseDeviceLabel |
| `backend/constants/index.js` | MODULOS, NOTIFICACION_TIPOS, CONFIG_KEYS |
| `backend/app.js` | Middleware sessionGuard |
| `backend/controllers/auth.controller.js` | Sesiones + auditoría auth ampliada |
| `backend/controllers/reportes.controller.js` | Notificación al exportar |
| `backend/services/dashboard.service.js` | Accesos rápidos auditoría/sistema |
| `backend/routes/index.js` | Registro rutas Sprint 9 |
| `backend/routes/pages.routes.js` | Rutas HTML auditoría/sistema |
| `public/pages/dashboard.html` | Nav auditoría/sistema + campana |
| `public/js/dashboard.js` | Permisos nav + notificaciones |
| `public/pages/reportes.html` | Campana notificaciones |
| `public/js/reportes.js` | Init notificaciones |
| `public/css/sena.css` | Estilos campana |

---

## Casos de prueba ejecutados

| # | Prueba | Resultado |
|---|--------|-----------|
| 1 | Login admin | ✅ |
| 2 | Listado auditoría con evento LOGIN | ✅ |
| 3 | Filtro por acción | ✅ |
| 4 | GET configuración | ✅ |
| 5 | PUT configuración + auditoría | ✅ |
| 6 | Notificaciones (incl. config change) | ✅ |
| 7 | Sesiones activas post-login | ✅ |
| 8 | Monitoreo MySQL + almacenamiento | ✅ |
| 9 | Diagnóstico seguridad | ✅ |
| 10 | Mis accesos | ✅ |
| 11 | Export CSV genera auditoría | ✅ |
| 12 | 401 sin sesión | ✅ |
| 13 | Coord: auditoría sí, config no (403) | ✅ |

---

## Problemas encontrados y soluciones

| Problema | Solución |
|----------|----------|
| `sprint9-setup-db.js` no creaba tablas (filtro `--` eliminaba CREATE TABLE) | Función `stripSqlComments()` + parseo correcto de statements |
| MySQL no soporta `ADD INDEX IF NOT EXISTS` | Normalización SQL + `tryQuery` con skip duplicados |
| Login fallaba: tabla `configuracion_sistema` inexistente | Migración corregida y re-ejecutada |
| `findSeguridadReciente` lanzaba 500 sin `await` | Añadido `await query(...)` dentro del try/catch |
| Tabla `auditoria_seguridad` ausente | Setup script aplica también `migrations/002_security_audit.sql` |
| Servidor antiguo en puerto 3000 sin rutas Sprint 9 | Reinicio del proceso Node |

---

## Riesgos pendientes

1. **Sesiones en memoria** — `express-session` default + Set `revokedSessions` no escala en multi-instancia
2. **2FA no bloquea login principal** — deuda técnica previa
3. **`npm test`** — desalineado con mock legacy en raíz
4. **Email** — canal preparado arquitectónicamente pero no implementado
5. **Revocación de sesión** — requiere reinicio de servidor si el Set en memoria se pierde

---

## Recomendaciones para Sprint 10

1. Implementar store de sesiones compartido (Redis o MySQL) para revocación multi-instancia
2. Activar envío de correo para notificaciones críticas (nodemailer + plantillas)
3. UI de gestión de roles/permisos (`/organizacion.html` ampliado)
4. Carga masiva de carnés (CSV) con auditoría por lote
5. Programación de reportes periódicos
6. Integrar 2FA como paso obligatorio post-login para roles administrativos

---

## Comandos de despliegue

```bash
node scripts/sprint9-setup-db.js   # Migración BD
npm run dev                         # Servidor
node scripts/sprint9-verify-sistema.js
```

**Credenciales demo:** `admin@sena.edu.co` / `Admin123!`
