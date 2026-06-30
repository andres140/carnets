# Sprint 5 — PDF, impresión y plantilla oficial del carné

**Fecha:** 2026-06-26  
**Objetivo:** Generar carnés institucionales listos para impresión con plantilla intercambiable, descarga PDF, vista previa, impresión y reimpresión con historial.  
**Excluido (Sprint 6):** QR dinámico funcional, validación pública, firma digital.

---

## Resumen ejecutivo

El Sprint 5 implementó un motor de plantillas desacoplado (diseño / datos / lógica), generación de PDF profesional con Puppeteer + EJS, caché por hash de datos, endpoints de documento, UI de descarga/impresión/reimpresión e historial `carnet_documentos_historial`.

**Verificación:** `node scripts/sprint5-verify-pdf.js` → `SPRINT5_VERIFY_OK`

---

## 1. Funcionalidades implementadas

### Módulo 1 — Motor de plantillas
- Carpeta `backend/templates/carnets/{id}/` con `config.json`, `front.ejs`, `back.ejs`, `styles.css`.
- Motor en `backend/lib/carnetTemplate/engine.js`: ViewModel, hash de datos, render HTML.
- Plantilla activa vía `CARNET_TEMPLATE_ID` (default: `default`).
- Preparado para múltiples diseños sin tocar lógica de negocio.

### Módulo 2 — Plantilla oficial (temporal)
- Plantilla institucional temporal con anverso y reverso (tamaño CR80: 85.6×53.98 mm).
- Foto embebida en base64, logos placeholder, espacios QR y firma reservados.
- Sustitución: duplicar carpeta `default/` y cambiar variable de entorno.

### Módulo 3 — Generación PDF
- `backend/lib/pdf/generator.js` — Puppeteer headless, `printBackground`, `@page` CSS.
- PDF de dos páginas (anverso + reverso) con calidad de impresión.

### Módulo 4 — Descarga
- `GET /api/carnets/:id/documento/pdf` — descarga con nombre `carnet-{codigo}.pdf`.
- Arquitectura preparada para PNG/JPG (`EXPORT_FORMATS` en constants).

### Módulo 5 — Impresión
- `GET /api/carnets/:id/documento/preview` — HTML para impresión.
- `public/pages/carnets-imprimir.html` — vista previa en iframe + `window.print()`.
- `POST /api/carnets/:id/documento/registrar-impresion` — registro en historial.

### Módulo 6 — Reimpresión
- `POST /api/carnets/:id/documento/reimprimir` — reutiliza PDF en caché, no crea carné nuevo.
- Incrementa `carnets.reimpresiones_count`.
- Auditoría en `auditoria` + `carnet_documentos_historial`.

### Módulo 7 — Historial de documento
- Tabla `carnet_documentos_historial` (GENERAR, DESCARGAR, IMPRIMIR, REIMPRIMIR).
- `GET /api/carnets/:id/documento/historial` — fechas, usuario, reimpresiones.
- UI en modal detalle de `carnets.html`.

### Módulo 8 — Validaciones
Antes de generar documento:
- Datos completos (nombre, documento, código, fechas).
- Fotografía obligatoria.
- Fechas coherentes (vencimiento ≥ expedición).
- Usuario activo en primera generación (reimpresión/descarga permiten usuario inactivo).

### Módulo 9 — Optimización
- Caché en `public/uploads/carnets/{carnetId}.pdf`.
- Hash SHA-256 de datos + plantilla (`pdf_hash`); regeneración solo si cambian datos o `force`.
- Invalidación automática al editar, renovar o cambiar estado del carné.

### Módulo 10 — Preparación Sprint 6
- Placeholders QR y firma en plantilla EJS.
- `qrTokenMasked` en reverso (sin validación pública).
- `EXPORT_FORMATS` y `placeholders` en `config.json`.

---

## 2. Archivos modificados / creados

| Área | Archivos |
|------|----------|
| BD | `database/schema.sql`, `database/migrations/006_sprint5_carnet_pdf.sql` |
| Plantillas | `backend/templates/carnets/default/*` |
| Motor PDF | `backend/lib/carnetTemplate/engine.js`, `backend/lib/pdf/generator.js` |
| Backend | `carnetPdf.service.js`, `carnetDocumento.controller.js`, `carnetDocumentos.repository.js` |
| Integración | `carnets.service.js`, `carnets.repository.js`, `carnets.routes.js`, `constants/index.js`, `config/env.js` |
| Frontend | `carnets.js`, `carnets.html`, `carnets-imprimir.html`, `api.js` |
| Scripts | `sprint5-setup-db.js`, `sprint5-verify-pdf.js` |
| Dependencias | `package.json` — `ejs`, `puppeteer` |

---

## 3. API nueva

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/carnets/:id/documento/preview` | HTML impresión |
| GET | `/api/carnets/:id/documento/pdf` | Descarga PDF |
| GET | `/api/carnets/:id/documento/historial` | Historial documento |
| POST | `/api/carnets/:id/documento/reimprimir` | Reimpresión (PDF + registro) |
| POST | `/api/carnets/:id/documento/regenerar` | Forzar regeneración |
| POST | `/api/carnets/:id/documento/registrar-impresion` | Registrar impresión navegador |

---

## 4. Casos de prueba ejecutados

| Prueba | Resultado |
|--------|-----------|
| Vista previa HTML | ✅ Contiene código y páginas carné |
| Primera descarga PDF | ✅ PDF válido (~121 KB) |
| Segunda descarga (caché) | ✅ Sin regenerar |
| Registrar impresión | ✅ HTTP 200 |
| Reimprimir | ✅ PDF + contador |
| Historial documento | ✅ GENERAR, DESCARGAR, IMPRIMIR, REIMPRIMIR |
| Invalidación al mutar carné | ✅ Implementado en service |

---

## 5. Problemas encontrados y soluciones

| Problema | Solución |
|----------|----------|
| BOM en `package.json` bloqueaba install de Puppeteer | Eliminación de UTF-8 BOM |
| Servidor antiguo en puerto 3000 sin rutas nuevas | Reinicio del proceso Node |
| Dependencia circular carnets ↔ carnetPdf | `require` lazy en `invalidatePdfCache` |

---

## 6. Riesgos pendientes

- **Puppeteer en producción:** requiere Chromium; considerar contenedor Docker con dependencias o servicio PDF dedicado.
- **Primera generación PDF:** ~10–15 s (descarga Chromium en install); subsecuentes más rápidas.
- **Plantilla oficial SENA:** aún es temporal; reemplazar assets en `templates/carnets/default/` o nueva carpeta.
- **Session store en memoria:** no afecta PDF pero limita escalado horizontal.

---

## 7. Recomendaciones para Sprint 6

1. Implementar QR HMAC con `QR_SIGNING_KEY` y endpoint público `/api/validar/:token`.
2. Reemplazar placeholder QR en plantilla EJS con imagen generada (qrcode library).
3. Sustituir plantilla temporal por diseño oficial (solo archivos en `templates/carnets/`).
4. Evaluar cola de trabajos (Bull/Redis) si el volumen de PDFs crece.
5. Añadir tests automatizados para `engine.js` (hash, ViewModel) sin Puppeteer.

---

## 8. Cómo probar manualmente

```bash
node scripts/sprint5-setup-db.js
npm run dev
node scripts/sprint5-verify-pdf.js
```

En UI: Carnés → Ver detalle → Descargar PDF / Vista impresión / Reimprimir.

---

**Estado:** Sprint 5 completo — pendiente aprobación del usuario antes de Sprint 6.
