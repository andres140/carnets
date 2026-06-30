# Sprint 6 — Validación por código QR y verificación pública

**Fecha:** 2026-06-26  
**Objetivo:** Sistema seguro de QR único por carné y validación pública sin autenticación.  
**Excluido (Sprint 7):** Reportes avanzados, firma digital.

---

## Resumen ejecutivo

Se implementó generación de tokens HMAC-SHA256, imágenes QR con la librería `qrcode`, endpoint público de validación con rate limiting, registro en `validaciones_qr` y auditoría, integración en PDF/plantilla/UI, página pública con escáner móvil y estadísticas en dashboard.

**Verificación:** `node scripts/sprint6-verify-qr.js` → `SPRINT6_VERIFY_OK`

---

## 1. Funcionalidades implementadas

### Módulo 1 — Generación de QR
- Token único por carné al emitir (`generateUniqueQrToken`).
- Imagen QR generada server-side (`qrcode`) con URL pública únicamente.
- Sin datos sensibles en el código QR.

### Módulo 2 — Token seguro
- Formato: `{32 hex aleatorios}.{16 hex HMAC-SHA256}`.
- Clave: `QR_SIGNING_KEY` en `.env`.
- Verificación con `crypto.timingSafeEqual`.
- Persistente; regeneración opcional vía API.

### Módulo 3 — Integración con carnés
- Token al crear carné + auditoría `GENERAR_QR`.
- QR en plantilla PDF (anverso), vista previa HTML, detalle UI.
- `GET /api/carnets/:id/qr` — imagen data URL + URL de validación.
- `POST /api/carnets/:id/qr/regenerar` — invalida caché PDF.

### Módulo 4 — Página pública
- `public/validar.html` — sin login.
- Escáner con `html5-qrcode` + entrada manual.
- Auto-validación con `?token=` en URL.
- Muestra: nombre, tipo, regional, centro, estado, fechas, foto, código.
- No expone: email, teléfono, documento, contraseña.

### Módulo 5 — Estados del carné
- Badges visuales: ACTIVO, VENCIDO, SUSPENDIDO, REVOCADO.
- Resolución automática de VENCIDO por fecha.
- Mensajes claros por estado.

### Módulo 6 — Registro de validaciones
- Tabla `validaciones_qr` ampliada (`token_intentado`, `carnet_id` nullable).
- IP, fecha/hora, resultado, usuario autenticado (si aplica).

### Módulo 7 — Seguridad
- Rate limit: 100 req/hora por IP (`qrValidationRateLimit`).
- Mensaje genérico ante token inválido o inexistente.
- Sin filtración de información interna.

### Módulo 8 — Rendimiento
- `findByQrToken` con índice único en `qr_token`.
- Consulta única por validación; sin joins innecesarios.

### Módulo 9 — Auditoría
- `GENERAR_QR`, `REGENERAR_QR`, `VALIDAR_QR_EXITOSA`, `VALIDAR_QR_ESTADO`, `VALIDAR_QR_FALLIDA`.

### Módulo 10 — Integración
- Dashboard: stats reales + validaciones recientes (`GET /api/dashboard/stats`).
- Preparado para reportes Sprint 7.

---

## 2. Archivos principales

| Área | Archivos |
|------|----------|
| Servicios | `qr.service.js`, `validacion.service.js`, `dashboard.service.js` |
| API | `validacion.routes.js`, `dashboard.routes.js`, rutas QR en `carnets.routes.js` |
| Repositorios | `validacionesQr.repository.js`, `carnets.repository.js` (findByQrToken) |
| Frontend | `validar.html`, `validar.js`, `validar.css`, `carnets.js`, `dashboard.js/html` |
| Plantilla | `front.ejs`, `engine.js` (QR embebido) |
| BD | `007_sprint6_validacion_qr.sql`, `schema.sql` |
| Scripts | `sprint6-setup-db.js`, `sprint6-verify-qr.js` |

---

## 3. API

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/validar/:token` | No | Validación pública |
| GET | `/api/carnets/:id/qr` | Sí | Imagen QR + URL |
| POST | `/api/carnets/:id/qr/regenerar` | Sí | Nuevo token QR |
| GET | `/api/dashboard/stats` | Sí | Estadísticas sistema |

---

## 4. Casos de prueba

| Prueba | Resultado |
|--------|-----------|
| QR data URL | ✅ |
| Token HMAC seguro | ✅ |
| Validación carné activo | ✅ |
| Token inválido | ✅ Mensaje seguro |
| Token inexistente (formato válido) | ✅ |
| Dashboard stats | ✅ |
| PDF con QR embebido | ✅ |
| Migración tokens legacy | ✅ |

---

## 5. Problemas y soluciones

| Problema | Solución |
|----------|----------|
| Tokens placeholder `qr_*` en BD | Migración en `sprint6-setup-db.js` |
| `validaciones_qr.carnet_id` NOT NULL | Columna nullable + `token_intentado` |
| Render async QR en plantilla | `buildViewModel` y `renderFullDocument` async |

---

## 6. Riesgos pendientes

- Rotar `QR_SIGNING_KEY` invalida tokens existentes (documentar procedimiento).
- Rate limit en memoria no escala horizontalmente (Redis en producción).
- Escáner QR requiere HTTPS en producción para acceso a cámara.

---

## 7. Recomendaciones Sprint 7

1. Módulo de reportes con exportación CSV de validaciones.
2. UI de auditoría con filtro por `ValidacionQR`.
3. Endpoint de estadísticas por regional/centro con gráficos.
4. Considerar QR con logo institucional en plantilla oficial.

---

**Estado:** Sprint 6 completo — pendiente aprobación antes de Sprint 7.
