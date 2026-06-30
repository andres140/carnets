# Sprint 4 — Informe del sistema de generación de carnés

**Fecha:** 2026-06-26  
**Objetivo:** Sistema profesional de generación y administración de carnés institucionales.  
**Alcance:** CRUD, generación automática, estados, plantilla temporal, vista previa, historial, seguridad e integración.  
**Excluido (Sprint 5+):** PDF, impresión, QR funcional, validación pública.

---

## Resumen ejecutivo

El Sprint 4 implementó el módulo principal del sistema: emisión de carnés con snapshot de datos del usuario, código único por regional/año, máquina de estados, historial de cambios, plantilla HTML temporal con vista previa y auditoría completa.

**Verificación:** `node scripts/sprint4-verify-carnets.js` → `SPRINT4_CARNETS_OK`

---

## 1. Funcionalidades implementadas

### Gestión de carnés
- Crear (emitir), consultar, editar (vencimiento, sincronizar datos/foto).
- Suspender, revocar, reactivar, renovar.
- Sin eliminación física.

### Generación automática
Al emitir, se copian desde el usuario activo: nombre, documento, tipo documento, tipo usuario, regional, centro, dependencia, foto, fechas y código único.

### Código único
Formato `{CODIGO_REGIONAL}-{AÑO}-{SECUENCIA}` — ej. `REG01-2026-000001`.  
Validación de unicidad en BD + generación con reintentos.

### Estados y transiciones
| Acción | Desde | Hacia |
|--------|-------|-------|
| Suspender | ACTIVO | SUSPENDIDO |
| Revocar | ACTIVO, SUSPENDIDO, VENCIDO | REVOCADO |
| Reactivar | SUSPENDIDO | ACTIVO |
| Renovar | VENCIDO, ACTIVO | ACTIVO |
| Auto | ACTIVO (fecha pasada) | VENCIDO |

### Fotografía
- Obligatoria para emitir.
- Sincronización desde usuario (`PUT` con `sincronizarUsuario: true`).
- Renovación opcional con sync.

### Plantilla temporal
- HTML/CSS en `carnets.css` + `renderCarnetTemplate()` en `carnets.js`.
- Logo placeholder, datos, espacios QR/firma/fecha.
- Diseño reemplazable sin tocar lógica de negocio.

### Vista previa
- `GET /api/carnets/preview?usuarioId=&fechaVencimiento=`
- UI obliga revisar antes de emitir.

### Historial
- Tabla `historial_carnets`: emisión, cambios de estado, renovación.
- `GET /api/carnets/:id/historial`

### Seguridad
- Permisos: `carnets.ver`, `carnets.generar`, `carnets.suspender`, `carnets.revocar`.
- Alcance: coordinador (regional), instructor (centro), aprendiz/contratista (propio).

### Integración
- Usuarios, organización, auditoría.

---

## 2. Archivos creados / modificados

### Backend
| Archivo | Rol |
|---------|-----|
| `repositories/carnets.repository.js` | SQL carnés + historial |
| `services/carnets.service.js` | Lógica de negocio |
| `controllers/carnets.controller.js` | HTTP + auditoría |
| `routes/carnets.routes.js` | Rutas protegidas |
| `utils/carnetCode.js` | Código único + QR placeholder |
| `utils/carnetStates.js` | Transiciones y fechas |
| `utils/permissions.js` | Alcance carnés |
| `constants/index.js` | `CARNET` defaults |

### Frontend
| Archivo | Rol |
|---------|-----|
| `public/pages/carnets.html` | UI principal |
| `public/js/carnets.js` | Lógica UI + plantilla |
| `public/css/carnets.css` | Estilos plantilla |

### Base de datos
| Cambio |
|--------|
| `carnets.tipo_documento` |
| `carnets.dependencia_nombre` |
| Migración `005_sprint4_carnets_snapshot.sql` |

### Scripts
- `scripts/sprint4-setup-db.js`
- `scripts/sprint4-verify-carnets.js`

---

## 3. API endpoints

| Método | Ruta | Permiso |
|--------|------|---------|
| GET | `/api/carnets` | carnets.ver / generar |
| GET | `/api/carnets/preview` | carnets.generar |
| GET | `/api/carnets/:id` | carnets.ver / generar |
| GET | `/api/carnets/:id/historial` | carnets.ver / generar |
| POST | `/api/carnets` | carnets.generar |
| PUT | `/api/carnets/:id` | carnets.generar |
| PATCH | `/api/carnets/:id/suspender` | carnets.suspender |
| PATCH | `/api/carnets/:id/revocar` | carnets.revocar |
| PATCH | `/api/carnets/:id/reactivar` | carnets.generar |
| PATCH | `/api/carnets/:id/renovar` | carnets.generar |

---

## 4. Pruebas realizadas

| Caso | Resultado |
|------|-----------|
| Preview usuario con foto | OK |
| Emitir carné | OK |
| Un carné activo por usuario | OK |
| Listar y buscar | OK |
| Historial | OK |
| Suspender / reactivar | OK |
| Renovar | OK |
| Sincronizar foto/datos | OK |
| 401 sin sesión | OK |

### Flujo manual recomendado
1. Usuarios → crear usuario con regional, centro, dependencia y foto.
2. Carnés → Emitir → buscar usuario → vista previa → emitir.
3. Ver en listado → detalle → acciones de estado.

---

## 5. Errores corregidos

| Problema | Solución |
|----------|----------|
| Usuarios seed sin foto | `sprint4-setup-db.js` asigna placeholder |
| Orden rutas Express | `/preview` y `/historial` antes de `/:id` |
| Snapshot incompleto | Columnas `tipo_documento`, `dependencia_nombre` |

---

## 6. Riesgos pendientes

| Riesgo | Mitigación Sprint 5 |
|--------|---------------------|
| QR token es placeholder | Implementar HMAC-SHA256 |
| Sin PDF | Motor PDF + plantilla oficial |
| Contador código por COUNT | Considerar secuencia atómica en alta concurrencia |
| `public/carnets.html` legacy | No enlazado; eliminar en limpieza futura |

---

## 7. Recomendaciones para Sprint 5

1. **PDF:** Puppeteer/PDFKit renderizando la misma plantilla o diseño oficial.
2. **QR:** Firmar token con `QR_SIGNING_KEY`, endpoint `/api/validar/:token`.
3. **Página validar.html** con escáner.
4. **Resolución VENCIDO** en job programado además de lazy check.
5. **Generación masiva** (`carnets.generar_masivo`).

---

## Condición de cierre

- Sistema de generación y administración de carnés funcional y probado.
- **Esperando aprobación del usuario antes de iniciar Sprint 5.**
