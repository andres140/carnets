# PERFORMANCE_REVIEW.md — SENA Carnés v1.0.0

**Fecha de auditoría:** 2026-07-01  
**Alcance:** Calidad, rendimiento, mantenibilidad, escalabilidad y experiencia de usuario  
**Metodología:** Revisión estática de código, análisis de consultas SQL, inspección frontend, simulación de instalación limpia, verificación RC1  
**Roles simulados:** Software Architect · Tech Lead · Performance Engineer · Backend Senior · Frontend Senior · DevOps · QA Lead  
**Estado:** Documentación únicamente — **sin correcciones aplicadas** (pendiente aprobación)

---

## Resumen ejecutivo

El sistema **SENA Carnés v1.0.0** es funcional, sigue una arquitectura MVC razonablemente clara y supera la verificación integral RC1 (`RC1_VERIFY_OK`). Sin embargo, **no debe asumirse que está optimizado**: existen cuellos de botella de rendimiento, duplicación significativa de código (backend y frontend), deuda técnica legacy y decisiones de middleware que penalizan cada petición autenticada.

### Verificación de instalación limpia (simulada)

| Paso | Comando | Resultado |
|------|---------|-----------|
| Dependencias | `npm install` | OK (dependencias declaradas en `package.json`) |
| Base de datos | `npm run setup:db` | **SETUP_DB_OK** — schema + seed + migraciones 002–008 |
| Tests unitarios | `npm test` | 3/3 OK — **contra mock legacy** (`services/carnets.service.js`), no contra backend real |
| Servidor | `npm run dev` | OK en `http://localhost:3000` |
| Verificación integral | `npm run verify:rc1` | **RC1_VERIFY_OK** — 9 suites (auth, usuarios, org, carnés, PDF, QR, dashboard, reportes, sistema) |

**Conclusión instalación:** El flujo desde cero funciona con `.env` configurado y MySQL activo. La cobertura de tests automatizados es **insuficiente** para garantizar regresiones de rendimiento o calidad.

### Calificación general del proyecto

| Dimensión | Nota | Comentario |
|-----------|------|------------|
| Funcionalidad | 9/10 | RC1 verificado; módulos core operativos |
| Arquitectura MVC | 7.5/10 | Separación clara; acoplamientos puntuales |
| Rendimiento backend | 5.5/10 | N+1, fan-out dashboard, middleware costoso |
| Rendimiento frontend | 6/10 | MPA sin bundler; duplicación; auto-refresh agresivo |
| Base de datos | 7/10 | FK e índices base correctos; faltan índices temporales |
| Mantenibilidad | 5.5/10 | Duplicación masiva; legacy en repo |
| Escalabilidad | 4.5/10 | MemoryStore, Puppeteer singleton, pool limitado |
| UX / Accesibilidad | 6/10 | Bootstrap consistente; a11y incompleta |
| **Calificación global calidad/rendimiento** | **6.3 / 10** | Funcional para entrega académica; requiere hardening para producción |

> **Nota:** La calificación de **seguridad** (5.5/10) está documentada por separado en [`SECURITY_AUDIT_REPORT.md`](SECURITY_AUDIT_REPORT.md). Esta auditoría se centra en rendimiento, organización y mantenibilidad.

### Recomendación final para producción

**NO recomendado para producción de alto tráfico** sin aplicar al menos la Fase 1 de optimización (ver sección final). Para entrega institucional / demo / piloto controlado con pocos usuarios concurrentes, el sistema es **aceptable con reservas**. Priorizar remediaciones de seguridad (informe separado) **antes** que optimizaciones de rendimiento.

---

## Estado del backend

### Fortalezas

- Patrón **Routes → Controllers → Services → Repository** respetado en módulos principales.
- SQL parametrizado consistente; sin concatenación directa de input de usuario en queries.
- Paginación implementada en listados (usuarios, carnés, auditoría, reportes).
- Caché de PDF por hash de datos (`pdf_hash`) evita regeneraciones innecesarias.
- Rate limiting por endpoint (API general, validación QR, login, 2FA).
- Constantes centralizadas en `backend/constants/index.js`.

### Debilidades detectadas

#### P0 — Impacto alto en rendimiento o corrección

| ID | Problema | Evidencia | Impacto |
|----|----------|-----------|---------|
| BE-001 | **N+1 en listado de carnés** — `syncResolvedEstado()` ejecuta UPDATE por fila vencida | `backend/services/carnets.service.js` L154-165, L70-77 | Hasta N escrituras DB por página |
| BE-002 | **Dashboard dispara 13 queries concurrentes** con pool MySQL de 10 | `dashboard.service.js` L132-144; `env.js` L27 | Contención de pool; latencia variable |
| BE-003 | **`sessionGuard` en toda petición autenticada** incluyendo assets estáticos | `app.js` L39-43 | SELECT + UPDATE por cada CSS/JS/imagen |
| BE-004 | **`buildAuditoriaScope` duplicado con lógicas distintas** | `dashboard.repository.js` L169-206 vs `auditoria.repository.js` L8-36 | Inconsistencia de alcance + mantenimiento |
| BE-005 | **Bug `options.templateId` indefinido** en generación PDF | `carnetPdf.service.js` L103 | ReferenceError potencial al omitir template en carnet |
| BE-006 | **Puppeteer sin límite de concurrencia** | `backend/lib/pdf/generator.js` L7-17 | Picos de memoria (~50-150 MB/página) bajo carga |

#### P1 — Impacto medio

| ID | Problema | Evidencia |
|----|----------|-----------|
| BE-007 | `reportes.service.getEstadisticas()` reutiliza 8 funciones de `dashboard.repository` — duplica trabajo si el usuario visita dashboard y reportes | `reportes.service.js` L28-39 |
| BE-008 | Por reporte detallado: count + find + 4-5 agregaciones en paralelo (7-8 queries) | `reportes.service.js` L78-82 |
| BE-009 | `generateUniqueToken`: hasta 15 SELECTs por token QR | `qr.service.js` L67-72 |
| BE-010 | `loadCarnet()` llamado múltiples veces en flujo PDF | `carnetPdf.service.js` L97-125 |
| BE-011 | Exportaciones cargan hasta 10 000 filas en RAM | `constants/index.js` EXPORT_MAX_ROWS |
| BE-012 | Acoplamiento circular `carnets.service` ↔ `carnetPdf.service` | require lazy en carnets.service |
| BE-013 | `lib/carnetTemplate/engine.js` importa `services/qr.service` (capa invertida) | Arquitectura |

#### P2 — Deuda técnica / baja prioridad

| ID | Problema |
|----|----------|
| BE-014 | Legacy en raíz: `services/carnets.service.js`, `controllers/`, `routes/`, `index.js` (mock) |
| BE-015 | Carpeta `src/` (92 archivos Next.js/Prisma) sin uso en runtime |
| BE-016 | `npm test` solo prueba mock legacy, no backend MySQL |
| BE-017 | `resolveScopeLabel` duplicado en dashboard y reportes services |
| BE-018 | Filtros WHERE duplicados entre `users.repository`, `reportes.repository`, `carnets.repository` |

### Middleware — cadena actual

```
CORS → securityHeaders → apiRateLimit(/api) → json → session → csrf → sessionGuard → static → /api → pages
```

**Problema:** `sessionGuard` y `csrfTokenMiddleware` se ejecutan **antes** de `express.static`. Una página con sesión activa que carga ~15 assets genera ~15 validaciones de sesión + touches en BD.

**Recomendación:** Reordenar a `static` antes de middlewares con I/O de BD, o excluir rutas `/css`, `/js`, `/uploads`, `/favicon.ico`.

---

## Estado del frontend

### Fortalezas

- Bootstrap 5 consistente; identidad visual SENA (`sena.css`).
- `api.js` centraliza fetch con credenciales y manejo de CSRF.
- Páginas modulares por dominio (`pages/*.html` + JS dedicado).
- Dashboard con gráficas Chart.js y auto-actualización.
- `utils.js` con `escapeHtml` (aunque infrautilizado).

### Debilidades detectadas

#### Crítica

| ID | Problema | Paths |
|----|----------|-------|
| FE-001 | **`public/carnets.html` legacy intercepta ruta protegida** — `express.static` sirve el archivo de 35 líneas **sin auth** antes de `pages.routes.js` | `public/carnets.html`, `backend/app.js` L43 |
| FE-002 | HTML legacy incompatible con `carnets.js` (IDs obsoletos, sin Bootstrap JS, sin `api.js`) | `public/carnets.html` vs `public/pages/carnets.html` |

#### Alta

| ID | Problema | Detalle |
|----|----------|---------|
| FE-003 | Navbar duplicado en ~7 páginas (~200-250 líneas) | Sin partial ni componente compartido |
| FE-004 | **5 implementaciones de toast** | usuarios, carnets, organizacion, reportes, sistema |
| FE-005 | **4 implementaciones de paginación** | Patrones distintos (numérica vs Anterior/Siguiente) |
| FE-006 | Navbar inconsistente entre páginas (permisos visuales) | dashboard filtra por JS; otras muestran enlaces fijos |
| FE-007 | `innerHTML` sin escape en 10+ módulos JS | Riesgo XSS (ver también SECURITY_AUDIT) |
| FE-008 | `.badge-estado-*` triplicado en CSS | usuarios.css, carnets.css, organizacion.css |

#### Media

| ID | Problema |
|----|----------|
| FE-009 | Dashboard auto-refresh 60s destruye/recrea 6 gráficas Chart.js sin pausar en pestaña oculta |
| FE-010 | Chart.js cargado en dashboard y reportes aunque no todos los tabs lo usan |
| FE-011 | `notificaciones-ui.js` solo en 4 de 7 páginas autenticadas |
| FE-012 | `utils.js` cargado solo en usuarios.html |
| FE-013 | Formularios sin `for` en labels; botones icono sin `aria-label` |
| FE-014 | Solo 3 de 10 CSS tienen `@media` queries |

#### Baja

| ID | Problema |
|----|----------|
| FE-015 | SVG legacy sin uso: `vercel.svg`, `window.svg`, `file.svg` |
| FE-016 | CDN Bootstrap repetido por navegación (sin bundle local) |
| FE-017 | `URL.createObjectURL` sin `revokeObjectURL` en preview de foto |

### Scripts por página (inconsistencia de carga)

| Página | Bootstrap | Chart.js | api.js | utils.js | notificaciones-ui.js |
|--------|-----------|----------|--------|----------|----------------------|
| dashboard | ✓ | ✓ | ✓ | — | ✓ |
| reportes | ✓ | ✓ | ✓ | — | ✓ |
| usuarios | ✓ | — | ✓ | ✓ | — |
| carnets | ✓ | — | ✓ | — | — |
| organizacion | ✓ | — | ✓ | — | — |
| auditoria | ✓ | — | ✓ | — | ✓ |
| sistema | ✓ | — | ✓ | — | ✓ |

---

## Estado de la base de datos

### Fortalezas

- **Normalización adecuada** en catálogos (regionales → centros → dependencias).
- **Foreign Keys** con reglas ON UPDATE/DELETE coherentes en tablas core.
- **Índices únicos** en email, documento, código carné, qr_token.
- **Índices de filtro** en estado, regional_id, centro_id, fecha_vencimiento.
- **Migraciones incrementales** documentadas (003–009).
- **Denormalización controlada** en carnets (snapshot de nombres) — decisión válida para PDF/QR offline.

### Índices existentes (resumen)

| Tabla | Índices relevantes |
|-------|-------------------|
| usuarios | uk_email, uk_documento, idx_estado, idx_regional, idx_centro, idx_tipo |
| carnets | uk_codigo, uk_qr, idx_usuario, idx_estado, idx_vencimiento |
| validaciones_qr | idx_carnet, idx_fecha, idx_resultado |
| auditoria | idx_fecha, idx_entidad, idx_usuario + idx_modulo/accion/resultado (migración 008) |
| sesiones | uk_session, idx_usuario, idx_activa |

### Índices faltantes o mejorables

| ID | Tabla / columna | Problema | Recomendación |
|----|-----------------|----------|---------------|
| DB-001 | `carnets.created_at` | Usado en dashboard/reportes/agregaciones temporales; **sin índice** | `KEY idx_carnets_created (created_at)` o compuesto `(estado, created_at)` |
| DB-002 | `carnets` + filtros compuestos | Consultas frecuentes por estado + vencimiento | Considerar `(estado, fecha_vencimiento)` |
| DB-003 | Búsquedas `LIKE '%term%'` | No usan índices B-tree | FULLTEXT en nombre_completo, documento, email (si escala) |
| DB-004 | `auditoria` sin regional_id denormalizado | Subconsultas EXISTS correlacionadas en dashboard | Denormalizar regional_id/centro_id en auditoría al registrar |

### Consultas con funciones sobre columnas indexadas

El patrón `DATE(col) = CURDATE()` y `DATE(col) >= ?` **impide uso de índices**:

```sql
-- Actual (dashboard.repository.js L62, L79)
SUM(CASE WHEN DATE(c.created_at) = CURDATE() THEN 1 ELSE 0 END)
WHERE DATE(v.created_at) = CURDATE()

-- Recomendado
WHERE c.created_at >= CURDATE() AND c.created_at < CURDATE() + INTERVAL 1 DAY
```

Afecta: `getCarnetsResumen`, `getValidacionesHoy`, `getValidacionesPorDia`, filtros en `reportes.repository.js`.

### Integridad y relaciones

- Relaciones usuario ↔ carnet ↔ validaciones coherentes.
- `validaciones_qr.carnet_id` nullable (correcto para tokens inválidos).
- Tabla `cargas_masivas` definida pero **funcionalidad CSV masiva no implementada** en backend activo.
- Sesiones y notificaciones (migración 008) integradas con FK a usuarios.

---

## Estado del rendimiento

### Dashboard

| Métrica | Valor actual | Riesgo |
|---------|--------------|--------|
| Queries concurrentes (admin, vista completa) | **13** | Supera pool de 10 |
| Auto-refresh frontend | 60 segundos | 6 Chart.js destroy/recreate por ciclo |
| Duplicación con reportes | 8 queries compartidas | Doble carga en misma sesión |

**Consultas en `getDashboard()` (Promise.all):**

1. getUsuariosResumen  
2. getCarnetsResumen  
3. getValidacionesHoy  
4. getCarnetsPorMes  
5. getUsuariosPorTipo  
6. getUsuariosPorRegional  
7. getCarnetsPorEstado  
8. getValidacionesPorDia  
9. getEmisionesPorCentro  
10. getActividadReciente (UNION ALL complejo)  
11. getAlertas → **3 queries internas** (proximosVencer, sinFoto, suspendidos)

**Optimizaciones sugeridas:**

- Endpoint `/api/dashboard/stats` ligero (solo resumen) vs `/api/dashboard` completo.
- Cache en memoria/Redis 30-60 s por actor+scope.
- Consolidar alertas con datos ya calculados en `getCarnetsResumen` (proximosVencer duplicado).
- Limitar subconsultas en `getActividadReciente` con LIMIT por rama antes del UNION.

### PDF

| Aspecto | Estado | Nota |
|---------|--------|------|
| Tiempo generación | ~1-3 s (Puppeteer) | Verificado RC1: ~110 KB por carné |
| Caché | Por hash de datos | Segunda descarga reutiliza archivo |
| Memoria | Browser singleton Chromium | Sin cola de concurrencia |
| Foto | `fs.readFileSync` → base64 en HTML | Sin compresión previa |
| QR en PDF | Regenerado en cada render | Sin cache de dataUrl |
| Shutdown | `closeBrowser()` existe pero no se invoca en SIGTERM | Posible leak en deploy |

**Bug confirmado:** Línea 103 de `carnetPdf.service.js` referencia `options.templateId` fuera de scope — debe usar el parámetro destructurado o `env.carnet.templateId`.

### QR

| Aspecto | Estado |
|---------|--------|
| Generación imagen | `QRCode.toDataURL` — ~25-40 KB, O(ms) |
| Token HMAC | O(1), sin I/O — correcto |
| Unicidad en BD | Hasta 15 roundtrips — mejorable con UUID + UNIQUE |
| Validación pública | Sin JOIN pesado; índice en qr_token |
| Escalabilidad | Adecuada para tráfico moderado; rate limit 100/h en validación |

### Reportes

| Aspecto | Estado |
|---------|--------|
| Consultas por reporte | 7-8 en paralelo (count + find + aggregates) |
| Export CSV | Streaming parcial; filas en memoria |
| Export XLSX | Buffer completo vía `xlsx` |
| Export PDF reportes | Comparte Puppeteer con carnés |
| Límite export | 10 000 filas en RAM |

**Consultas lentas potenciales bajo volumen:**

- `aggregateValidaciones` — 5 GROUP BY sobre misma tabla filtrada.
- `findUsuarios` + `countUsuarios` — doble escaneo; aceptable con índices actuales en datasets pequeños.
- Export PDF de validaciones — RC1 generó 136 KB; tiempo proporcional a filas.

---

## Estado de la arquitectura

### MVC y separación de responsabilidades

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   Routes    │ ──► │ Controllers  │ ──► │  Services   │ ──► │ Repositories │
│  (HTTP)     │     │ (orquestación)│     │ (negocio)   │     │ (SQL)        │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                                                │
                                                ▼
                                         ┌─────────────┐
                                         │  lib/ utils │
                                         │  (PDF, QR)  │
                                         └─────────────┘
```

**Evaluación:** 7.5/10 — La separación es clara en módulos nuevos (Sprint 4-10). Excepciones:

- `reportes.service` depende de `dashboard.repository` (mezcla de capas analíticas).
- `lib/carnetTemplate/engine` depende de `services/qr.service`.
- Controllers ocasionalmente invocan auditoría inline.

### Acoplamiento

| Tipo | Ejemplos | Severidad |
|------|----------|-----------|
| Circular | carnets ↔ carnetPdf | Media |
| Cross-domain repo | reportes → dashboard.repository | Media |
| Legacy paralelo | raíz mock vs backend/ | Alta |
| Infra → app | engine → qr.service | Baja-Media |

### Modularidad y reutilización

- **Buena:** `utils/pagination.js`, `utils/permissions.js`, `utils/reportFilters.js`, `constants/`.
- **Mejorable:** Filtros SQL, scope de auditoría, helpers UI frontend, estilos badge/toast.

### Escalabilidad

| Componente | Limitación | Escala horizontal |
|------------|------------|-------------------|
| Sesiones | MemoryStore + Set revocado en memoria | No — requiere Redis |
| Rate limit | Map en memoria | No — requiere Redis |
| Puppeteer | 1 browser por proceso | Limitado — cola o servicio externo |
| MySQL pool | 10 conexiones default | Vertical primero; luego read replicas |
| Uploads | Filesystem local | Requiere S3/NFS para multi-instancia |

---

## Código duplicado encontrado

### Backend

| Duplicado | Ubicaciones | Severidad |
|-----------|-------------|-----------|
| `buildAuditoriaScope` (lógicas **distintas**) | dashboard.repository, auditoria.repository | **Alta** |
| Filtros usuarios/carnés WHERE | users.repository, reportes.repository, carnets.repository | Media |
| `resolveScopeLabel` / scopeLabel | dashboard.service, reportes.service | Baja |
| `syncResolvedEstado` / `loadCarnet` + resolve | carnets.service, carnetPdf.service, validacion.service | Media |
| Agregaciones carnets/usuarios/validaciones | dashboard.repository, reportes.repository | Media |
| Stack legacy completo | `services/`, `controllers/`, `routes/` raíz vs `backend/` | Alta |
| Stack Next.js | `src/` (92 archivos) vs Express activo | Media |

### Frontend

| Duplicado | Ocurrencias | Líneas aprox. duplicadas |
|-----------|-------------|--------------------------|
| Navbar HTML | 7 páginas | ~200-250 |
| showToast | 5 JS | ~80 |
| renderPagination | 4 JS | ~60 |
| fillSelect | 3 variantes | ~40 |
| formatDate/DateTime | 5+ JS | ~50 |
| badgeEstado | 3 JS | ~30 |
| initSession + logout | 7 módulos | ~70 |
| Hero gradient CSS | 4 CSS | ~20 |
| badge-estado CSS | 3 CSS | ~45 |

---

## Archivos candidatos a refactorización

### Prioridad alta

| Archivo | Motivo |
|---------|--------|
| `backend/app.js` | Reordenar middleware; excluir static de sessionGuard |
| `backend/services/carnets.service.js` | Eliminar N+1 en list(); extraer sync estado |
| `backend/repositories/dashboard.repository.js` | Unificar scope; optimizar DATE(); reducir fan-out |
| `backend/repositories/auditoria.repository.js` | Unificar buildAuditoriaScope con dashboard |
| `backend/services/carnetPdf.service.js` | Corregir bug options; reducir loadCarnet repetido |
| `backend/lib/pdf/generator.js` | Cola concurrencia; hook shutdown |
| `public/carnets.html` | **Eliminar** (conflicto ruta) |
| `services/carnets.service.js` (raíz) | Eliminar o mover a tests/fixtures |

### Prioridad media

| Archivo | Motivo |
|---------|--------|
| `backend/services/reportes.service.js` | Repo analítico compartido; cache estadísticas |
| `backend/services/dashboard.service.js` | Separar endpoints ligeros/pesados |
| `backend/services/qr.service.js` | UUID + retry en lugar de 15 SELECTs |
| `public/js/*.js` (7 módulos) | Extraer `ui.js` común (toast, pagination, dates) |
| `public/css/*.css` | Consolidar badges, heroes, toast en sena.css |
| `public/pages/*.html` | Partial navbar o mountNavbar() |

### Prioridad baja

| Archivo / carpeta | Motivo |
|-------------------|--------|
| `src/` completo | Archivar tras checklist paridad |
| `index.js`, `controllers/`, `routes/` raíz | Eliminar legacy mock |
| `tests/carnets.test.js` | Reescribir contra backend real |
| `public/vercel.svg`, etc. | Limpiar assets muertos |

---

## Consultas SQL a optimizar

| # | Query / patrón | Archivo | Optimización propuesta |
|---|----------------|---------|------------------------|
| SQL-01 | N UPDATEs en listado carnés vencidos | carnets.service | Batch UPDATE o job cron; calcular en lectura |
| SQL-02 | 13 queries paralelas dashboard | dashboard.service | Reducir fan-out; cache; serializar no críticas |
| SQL-03 | `DATE(created_at) = CURDATE()` | dashboard.repository | Rango datetime sin función |
| SQL-04 | UNION ALL actividad sin LIMIT interno | dashboard.repository L213-229 | LIMIT por subconsulta |
| SQL-05 | EXISTS correlacionados en audit scope | dashboard.repository | Denormalizar regional en auditoría |
| SQL-06 | proximosVencer COUNT + SELECT alertas | dashboard.repository | Reutilizar COUNT o CTE |
| SQL-07 | 4-5 GROUP BY mismo WHERE en reportes | reportes.repository | Una query con SUM(CASE WHEN...) |
| SQL-08 | count + find doble escaneo | reportes.repository | SQL_CALC_FOUND_ROWS o window COUNT (MySQL 8+) |
| SQL-09 | qrTokenExists loop 15× | carnets.repository + qr.service | INSERT con UNIQUE; retry on duplicate |
| SQL-10 | LIKE '%term%' búsquedas | users/carnets repos | FULLTEXT o Elastic si >10k registros |
| SQL-11 | Falta índice created_at carnets | schema.sql | ALTER TABLE ADD INDEX |
| SQL-12 | getEmisionesPorCentro GROUP BY centro_nombre | dashboard.repository | Índice o columna centro_id denormalizada |

---

## Mejoras sugeridas (por fases)

### Fase 1 — Quick wins (1-3 días, sin cambio funcional)

1. Eliminar `public/carnets.html` o excluir `*.html` de static excepto rutas públicas.
2. Mover `express.static` antes de `sessionGuard` / throttle touch cada 60 s.
3. Corregir bug `options.templateId` en carnetPdf.service.js.
4. Añadir índice `idx_carnets_created` y reescribir filtros DATE().
5. Batch sync estado vencido en listado carnés (eliminar N+1).
6. Cola Puppeteer max 2-3 concurrentes + closeBrowser en shutdown.

### Fase 2 — Consolidación (1-2 semanas)

7. Unificar `buildAuditoriaScope` en módulo compartido.
8. Crear `analytics.repository.js` para dashboard + reportes.
9. Cache 30-60 s de estadísticas por scope.
10. Extraer `public/js/ui.js` (toast, pagination, fillSelect, escapeHtml).
11. Consolidar CSS duplicado en sena.css.
12. Navbar compartido (EJS partial o JS mount).
13. Pausar dashboard refresh con `visibilitychange`.

### Fase 3 — Escalabilidad producción (2-4 semanas)

14. Redis para sesiones + rate limit.
15. Streaming export CSV/XLSX por lotes.
16. Retirar `src/` y legacy raíz.
17. Suite tests integración contra backend MySQL.
18. FULLTEXT o búsqueda dedicada si volumen crece.
19. Job nocturno sincronización estados VENCIDO.
20. Servicio PDF externo o worker pool si >50 PDFs/min.

---

## Riesgos futuros

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Pool MySQL agotado bajo carga dashboard | Alta | Alto | Fase 1 + aumentar DB_POOL_LIMIT |
| OOM por PDFs concurrentes | Media | Alto | Cola Puppeteer |
| Inconsistencia datos auditoría por scopes distintos | Media | Alto | Unificar buildAuditoriaScope |
| Deuda frontend impide cambios de navegación | Alta | Medio | Navbar compartido |
| Legacy confunde nuevos desarrolladores | Alta | Medio | Eliminar src/ y mock raíz |
| MemoryStore impide multi-instancia | Alta (prod) | Alto | Redis sessions |
| Tests no detectan regresiones reales | Alta | Medio | Tests integración |
| XSS + innerHTML escala con más usuarios | MediaQuery | Alto | escapeHtml universal (ver SECURITY_AUDIT) |
| npm audit HIGH (nodemailer, xlsx) | Media | Medio | Actualizar dependencias |
| Carga masiva CSV pendiente | Baja | Medio | Implementar o remover tabla cargas_masivas |

---

## Experiencia de usuario

### Fortalezas

- Flujo login → dashboard intuitivo con accesos rápidos por permiso.
- Validación QR pública (`validar.html`) clara y sin login.
- Toasts y feedback en operaciones CRUD.
- Preview de carné antes de emitir.
- Export reportes en CSV/XLSX/PDF.

### Debilidades

| Área | Problema |
|------|----------|
| Navegación | Enlaces visibles sin permiso en algunas páginas |
| Formularios | Labels sin `for`; validación HTML5 básica |
| Confirmaciones | Algunas acciones destructivas sin modal confirm |
| Estados de carga | No uniformes; algunos botones sin spinner/disabled |
| Responsive | Tablas densas en móvil; filtros reportes con scroll horizontal |
| Notificaciones | Campana solo en 4 páginas |
| Accesibilidad | Modales sin aria-label en close; tabs sin ARIA completo |

---

## Checklist de calidad

### Backend

- [x] Arquitectura MVC documentada
- [x] SQL parametrizado
- [x] Paginación en listados principales
- [x] Rate limiting API
- [ ] Sin N+1 en operaciones frecuentes
- [ ] Pool DB dimensionado para fan-out
- [ ] Middleware sin I/O en assets estáticos
- [ ] Tests contra backend real
- [ ] Sin código legacy en runtime path

### Frontend

- [x] Responsive base (Bootstrap)
- [x] API client centralizado
- [ ] Componentes UI reutilizables
- [ ] escapeHtml en todo innerHTML dinámico
- [ ] Accesibilidad WCAG 2.1 AA parcial
- [ ] Sin HTML conflictivo en static
- [ ] Bundle/lazy-load scripts pesados

### Base de datos

- [x] FK e integridad referencial
- [x] Índices en claves de búsqueda frecuente
- [ ] Índices temporales (created_at)
- [ ] Consultas sin funciones sobre columnas indexadas
- [ ] Migraciones versionadas

### Rendimiento

- [x] Caché PDF por hash
- [ ] Cola generación PDF
- [ ] Cache estadísticas dashboard
- [ ] Export streaming
- [ ] Auto-refresh con visibility API

### DevOps / Instalación

- [x] `npm run setup:db` funcional
- [x] `.env.example` documentado
- [x] `npm run verify:rc1` integral
- [ ] CI/CD con tests reales
- [ ] Health check + métricas producción

### Documentación

- [x] ARCHITECTURE.md
- [x] INSTALL.md, API_DOCUMENTATION.md, DATABASE_DOCUMENTATION.md
- [x] SECURITY_AUDIT_REPORT.md
- [x] PERFORMANCE_REVIEW.md (este documento)

---

## Calificación por área (detalle)

| Área | Nota | Justificación breve |
|------|------|---------------------|
| Backend — organización | 7/10 | MVC claro; duplicación y acoplamientos puntuales |
| Backend — rendimiento | 5.5/10 | N+1, fan-out, middleware costoso |
| Frontend — organización | 5/10 | MPA sin abstracciones compartidas |
| Frontend — rendimiento | 6/10 | Sin bundler OK para escala pequeña; refresh agresivo |
| Base de datos — diseño | 8/10 | Normalización y FK sólidas |
| Base de datos — rendimiento | 6/10 | Índices base OK; faltan temporales y anti-patterns DATE() |
| PDF / QR | 6.5/10 | Funcional con caché; Puppeteer es cuello de botella |
| Dashboard / Reportes | 5.5/10 | Duplicación de queries; sin cache |
| Arquitectura global | 7/10 | Monolito bien estructurado; legacy confunde |
| Mantenibilidad | 5.5/10 | Alta duplicación frontend y filtros SQL |
| Escalabilidad | 4.5/10 | MemoryStore, FS local, Puppeteer single |
| UX | 6.5/10 | Funcional; a11y y consistencia mejorables |
| Instalabilidad | 8.5/10 | setup:db + verify:rc1 robustos |

---

## Recomendación final para producción

### Para entrega académica / demo / piloto (< 50 usuarios concurrentes)

**APROBADO con reservas.** El sistema cumple funcionalmente (RC1 verificado). Documentar limitaciones conocidas y aplicar al menos **Fase 1** antes de demo pública.

### Para producción institucional (> 100 usuarios, SLA, multi-servidor)

**NO APROBADO** hasta:

1. Remediar vulnerabilidades críticas/altas de [`SECURITY_AUDIT_REPORT.md`](SECURITY_AUDIT_REPORT.md).
2. Completar **Fase 1 y Fase 2** de este informe.
3. Migrar sesiones y rate limit a Redis.
4. Ampliar cobertura de tests de integración.

### Orden de ejecución recomendado

```
1. Seguridad Fase 1 (bloqueante)     ← SECURITY_AUDIT_REPORT.md
2. Performance Fase 1 (quick wins)   ← Este informe
3. Performance Fase 2 (consolidación)
4. Seguridad Fase 2 + Performance Fase 3 (producción)
```

---

## Apéndice A — Métricas de referencia (configuración actual)

| Parámetro | Valor | Archivo |
|-----------|-------|---------|
| DB pool limit | 10 | `backend/config/env.js` |
| Dashboard max queries concurrentes | 13 | `dashboard.service.js` |
| Reporte validaciones max concurrentes | 8 | `reportes.service.js` |
| Export max filas | 10 000 | `backend/constants/index.js` |
| Puppeteer | 1 browser singleton | `backend/lib/pdf/generator.js` |
| Dashboard auto-refresh | 60 s | `public/js/dashboard.js` |
| Session max age | 8 h default | `backend/config/env.js` |

## Apéndice B — Comandos de verificación post-optimización

```bash
npm run setup:db
npm run dev
npm run verify:rc1
npm test   # Tras reescribir tests contra backend real
```

## Apéndice C — Relación con auditoría de seguridad

Varios hallazgos de rendimiento coinciden o amplían issues de seguridad:

| Performance ID | Security ID | Tema |
|----------------|-------------|------|
| FE-001 | SEC (bypass HTML) | static antes de pageRoutes |
| FE-007 | SEC XSS | innerHTML sin escape |
| BE-003 | SEC session | sessionGuard en assets |
| BE-004 | SEC scope | buildAuditoriaScope inconsistente |

Consultar [`SECURITY_AUDIT_REPORT.md`](SECURITY_AUDIT_REPORT.md) para remediación coordinada.

---

*Documento generado como parte de la auditoría pre-producción v1.0.0 RC1. No se aplicaron cambios al código fuente. Esperar aprobación del equipo antes de implementar optimizaciones.*
