# SPRINT 8 REPORT — Reportes Avanzados, Exportación y Consultas Inteligentes

**Fecha:** 2026-07-01  
**Estado:** ✅ Completado  
**Verificación:** `node scripts/sprint8-verify-reportes.js`

---

## Funcionalidades implementadas

### Módulo 1 — Centro de Reportes
- Página dedicada `/reportes.html` con interfaz responsive (Bootstrap 5)
- 5 pestañas: Resumen, Usuarios, Carnés, Validaciones QR, Búsqueda avanzada
- Integración con navbar del sistema y acceso rápido desde dashboard

### Módulo 2 — Reportes de Usuarios
- Filtros: nombre, documento, correo, tipo, estado, regional, centro, fechas de registro
- Totales y agregaciones por estado, tipo, regional y rol
- Paginación (hasta 100 registros por página)

### Módulo 3 — Reportes de Carnés
- Filtros: estado, documento, nombre, regional, centro, fechas expedición/vencimiento
- Opción «próximos a vencer» (30 días)
- Agregaciones por estado, regional, centro y emisiones mensuales

### Módulo 4 — Reportes de Validaciones QR
- Estadísticas exitosas vs fallidas
- Validaciones por fecha, regional, carnés más consultados, actividad por hora
- Datos desde tabla `validaciones_qr` en tiempo real

### Módulo 5 — Búsqueda Avanzada
- Filtros combinables sobre usuarios, carnés o validaciones
- Un solo formulario con tipo de entidad seleccionable

### Módulo 6 — Exportación
- Formatos: **CSV**, **Excel (.xlsx)**, **PDF**
- Metadatos en exportaciones: encabezados, filtros aplicados, fecha de generación, usuario, alcance, totales
- Auditoría en cada exportación (`EXPORTAR_REPORTE`)

### Módulo 7 — Estadísticas
- KPIs automáticos en pestaña Resumen
- 4 gráficas Chart.js: carnés por estado, usuarios por regional, emisiones por período, validaciones QR

### Módulo 8 — Rendimiento
- Consultas agregadas en paralelo (`Promise.all`)
- Reutilización de `buildUserScope` del dashboard (sin duplicar lógica de alcance)
- Paginación en listados; límite de exportación configurable (`REPORT.EXPORT_MAX_ROWS = 10000`)

### Módulo 9 — Seguridad
- Permiso `reportes.ver` obligatorio en todas las rutas
- Coordinador limitado a su regional (mismo scope que dashboard)
- Instructor limitado a su centro
- Registro de auditoría en exportaciones

### Módulo 10 — Integración
- Enlace en dashboard (accesos rápidos + navbar)
- Catálogos regionales/centros disponibles para filtros (`REPORTES_VER` en catálogos)
- Datos alineados con dashboard y módulos existentes

---

## Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `backend/repositories/reportes.repository.js` | Consultas SQL parametrizadas |
| `backend/services/reportes.service.js` | Lógica de negocio y orquestación |
| `backend/controllers/reportes.controller.js` | Controlador HTTP |
| `backend/routes/reportes.routes.js` | Rutas API |
| `backend/lib/reportExport.js` | Exportación CSV/XLSX/PDF |
| `backend/utils/reportFilters.js` | Parseo de filtros |
| `public/pages/reportes.html` | UI del centro de reportes |
| `public/js/reportes.js` | Cliente frontend |
| `public/css/reportes.css` | Estilos |
| `scripts/sprint8-verify-reportes.js` | Script de verificación |

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `backend/routes/index.js` | Montaje rutas reportes |
| `backend/routes/pages.routes.js` | Ruta protegida `/reportes.html` |
| `backend/routes/catalog.routes.js` | Permiso `reportes.ver` en catálogos |
| `backend/constants/index.js` | Constantes `REPORT` |
| `backend/services/dashboard.service.js` | Enlace reportes + label auditoría |
| `backend/lib/pdf/generator.js` | Opciones PDF para reportes |
| `public/js/api.js` | `downloadExport()` |
| `public/pages/dashboard.html` | Nav reportes |
| `public/js/dashboard.js` | Visibilidad nav reportes |
| `package.json` | Dependencia `xlsx` |

---

## API REST

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/reportes/estadisticas` | KPIs y gráficas resumen |
| GET | `/api/reportes/usuarios` | Listado + estadísticas usuarios |
| GET | `/api/reportes/carnets` | Listado + estadísticas carnés |
| GET | `/api/reportes/validaciones` | Listado + estadísticas QR |
| GET | `/api/reportes/busqueda` | Búsqueda avanzada (`tipo=usuarios\|carnets\|validaciones`) |
| GET | `/api/reportes/usuarios/export?format=csv\|xlsx\|pdf` | Exportar usuarios |
| GET | `/api/reportes/carnets/export?format=...` | Exportar carnés |
| GET | `/api/reportes/validaciones/export?format=...` | Exportar validaciones |

---

## Cambios en base de datos

**Ninguno.** El módulo utiliza tablas existentes (`usuarios`, `carnets`, `validaciones_qr`, `regionales`, etc.).

---

## Casos de prueba ejecutados

| # | Prueba | Resultado |
|---|--------|-----------|
| 1 | Login admin | ✅ |
| 2 | GET estadísticas | ✅ |
| 3 | Reporte usuarios filtrado | ✅ |
| 4 | Reporte carnés | ✅ |
| 5 | Reporte validaciones | ✅ |
| 6 | Búsqueda avanzada | ✅ |
| 7 | Export CSV | ✅ |
| 8 | Export XLSX | ✅ |
| 9 | Export PDF | ✅ |
| 10 | 401 sin sesión | ✅ |
| 11 | Alcance coordinador regional | ✅ |

---

## Capturas de los reportes

> Las capturas deben tomarse manualmente en el navegador tras `npm run dev` → http://localhost:3000/reportes.html

- Pestaña **Resumen**: KPIs + 4 gráficas Chart.js
- Pestaña **Usuarios**: tabla paginada + botones CSV/Excel/PDF
- Pestaña **Carnés**: filtros por estado y fechas
- Pestaña **Validaciones QR**: carnés más consultados + gráfica por hora
- Pestaña **Búsqueda avanzada**: resultados combinados

---

## Exportaciones generadas (verificación automática)

| Formato | Tamaño aprox. | Validación |
|---------|---------------|------------|
| CSV usuarios | ~1 KB | Encabezado `Documento` presente |
| XLSX carnés | ~17 KB | Buffer binario válido |
| PDF validaciones | ~126 KB | Firma `%PDF` |

---

## Problemas encontrados

1. **Export PDF en script de verificación:** el parser JSON interpretaba respuestas binarias — corregido con flag `binary` en `request()`.
2. **PDF voluminoso con `networkidle0`:** optimizado usando `domcontentloaded` para reportes tabulares.
3. **Catálogos inaccesibles para rol reportes:** añadido `REPORTES_VER` a permisos de catálogo.

---

## Soluciones aplicadas

- `res.end(buffer)` para respuestas binarias de exportación
- Reutilización de `buildUserScope` desde `dashboard.repository.js`
- Dependencia `xlsx` para Excel nativo

---

## Riesgos pendientes

| Riesgo | Severidad | Nota |
|--------|-----------|------|
| Exportaciones muy grandes (>10k filas) | Media | Límite `EXPORT_MAX_ROWS`; considerar streaming en Sprint 9 |
| PDF con Puppeteer en producción | Media | Requiere Chromium en servidor |
| Sin UI de auditoría de exportaciones | Baja | Los eventos quedan en tabla `auditoria` |

---

## Recomendaciones para Sprint 9

1. **UI de auditoría** — listar exportaciones y acciones críticas
2. **Recuperación de contraseña** — UI frontend
3. **Integrar migraciones 002/003** en schema principal
4. **Tests automatizados Express** — ampliar suite más allá de scripts sprint
5. **Exportación programada** — reportes por correo (opcional)
6. **Filtro por dependencia** en UI de reportes (backend ya soporta `dependenciaId`)

---

## Comando de verificación

```bash
npm run dev
node scripts/sprint8-verify-reportes.js
```

**Resultado esperado:** `SPRINT8_REPORTES_OK`

---

*Pendiente aprobación del responsable antes de iniciar Sprint 9.*
