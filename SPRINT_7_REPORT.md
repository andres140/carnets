# Sprint 7 — Dashboard ejecutivo, estadísticas y monitoreo

**Fecha:** 2026-06-26  
**Objetivo:** Panel administrativo dinámico con métricas, gráficas, alertas y actividad en tiempo real desde MySQL.

---

## Resumen ejecutivo

Se transformó el dashboard básico del Sprint 6 en un **panel ejecutivo completo**: 11 indicadores KPI, 6 gráficas Chart.js, alertas automáticas, actividad reciente unificada (auditoría + validaciones QR), accesos rápidos por permisos y personalización por rol con auto-refresh cada 60 segundos.

**Verificación:** `node scripts/sprint7-verify-dashboard.js` → `SPRINT7_VERIFY_OK`

---

## 1. Funcionalidades implementadas

### Módulo 1 — Tarjetas de resumen
11 KPIs dinámicos: usuarios (total/activos/inactivos), carnés por estado, emitidos hoy/mes, validaciones QR hoy, próximos a vencer.

### Módulo 2 — Gráficas interactivas (Chart.js)
- Carnés emitidos por mes (línea)
- Carnés por estado (dona)
- Usuarios por tipo (barras)
- Usuarios por regional (barras horizontales)
- Validaciones QR por día (línea dual)
- Emisiones por centro (barras)

### Módulo 3 — Actividad reciente
Unión eficiente `auditoria` + `validaciones_qr` con etiquetas legibles (login, emisión, renovación, validación QR, etc.).

### Módulo 4 — Accesos rápidos
Botones según permisos: crear usuario, emitir carné, buscar, validar QR, reportes (#gráficas), auditoría (#actividad), configuración.

### Módulo 5 — Alertas
- Carnés próximos a vencer (30 días)
- Usuarios activos sin fotografía
- Carnés suspendidos  
Desaparecen automáticamente al resolverse en BD.

### Módulo 6 — Dashboard por rol
| Rol | Alcance |
|-----|---------|
| Administrador | Vista nacional |
| Coordinador | Filtro `regional_id` |
| Instructor | Filtro `centro_id` |
| Aprendiz/Contratista | Vista personal (`usuario_id`) |
| Funcionario | Según permisos asignados |

### Módulo 7 — Rendimiento
- `dashboard.repository.js` con agregaciones SQL y `Promise.all` en servicio
- Una sola petición `GET /api/dashboard` para toda la UI
- Compatibilidad `GET /api/dashboard/stats` (Sprint 6)

### Módulo 8 — UX
- Diseño responsivo Bootstrap 5 + `dashboard.css`
- Identidad SENA (azul/verde)
- Auto-refresh 60s sin recargar página

### Módulo 9 — Integración
Usuarios, carnés, auditoría, validaciones QR; preparado para reportes Sprint 8.

---

## 2. Archivos modificados / creados

| Archivo | Cambio |
|---------|--------|
| `backend/repositories/dashboard.repository.js` | **Nuevo** — consultas agregadas |
| `backend/services/dashboard.service.js` | Refactor completo |
| `backend/controllers/dashboard.controller.js` | `GET /api/dashboard` |
| `backend/routes/dashboard.routes.js` | Ruta principal |
| `public/pages/dashboard.html` | UI ejecutiva |
| `public/js/dashboard.js` | Chart.js + refresh |
| `public/css/dashboard.css` | Estilos panel |
| `scripts/sprint7-verify-dashboard.js` | Verificación |

---

## 3. API

```
GET /api/dashboard
```

Respuesta: `{ resumen, graficas, actividad, alertas, quickActions, visibility, scope, actualizadoEn }`

---

## 4. Casos de prueba

| Prueba | Resultado |
|--------|-----------|
| KPIs desde BD | ✅ |
| 6 gráficas con datos | ✅ |
| Accesos rápidos (7 admin) | ✅ |
| API legacy `/stats` | ✅ |
| Scope coordinador (repositorio) | ✅ |
| Auto-refresh frontend | ✅ (60s) |

---

## 5. Capturas del Dashboard

> Acceder a `http://localhost:3000/dashboard.html` tras login como `admin@sena.edu.co`.

**Secciones visibles:**
1. Barra superior con scope y hora de actualización
2. Accesos rápidos (fila de botones)
3. 11 tarjetas KPI en grid responsivo
4. 6 gráficas Chart.js (2 columnas en desktop)
5. Panel alertas (derecha)
6. Actividad reciente con scroll

---

## 6. Problemas y soluciones

| Problema | Solución |
|----------|----------|
| Rate limit en login durante verify | Logout + espera; test unitario de scope en repositorio |
| Múltiples requests al frontend | Endpoint único `/api/dashboard` |
| UNION actividad SQL | Scope separado auditoría vs carnets |

---

## 7. Recomendaciones Sprint 8

1. Página `/reportes.html` con exportación CSV/PDF.
2. Filtros de fecha en dashboard (rango personalizado).
3. WebSocket o SSE para refresh instantáneo sin polling.
4. UI de auditoría completa (`/auditoria.html`).
5. Redis para rate limit y caché de agregaciones pesadas.

---

**Estado:** Sprint 7 completo — pendiente aprobación antes de Sprint 8.
