# Roadmap — SENA Carnés

**Actualizado:** 2026-06-26 (post-auditoría)  
**Stack:** Express + MySQL + HTML/Bootstrap

---

## Resumen de fases

| Fase | Objetivo | Prioridad | Dependencias | Estado | Tiempo est. |
|------|----------|-----------|--------------|--------|-------------|
| 0 | Fundación | — | — | ✅ Completada | 2 sem |
| 0.5 | Corrección bloqueadores | 🔴 Crítica | Fase 0 | ✅ Completada | 2-3 días |
| 1 | Usuarios (verificación) | 🔴 Alta | Fase 0.5 | 🟡 Parcial | 1 sem |
| 1.5 | Consolidación arquitectura | Alta | Fase 0.5 | ✅ Completada | 3-4 días |
| 2 | Carnés | 🔴 Alta | Fase 1 | 🔴 Pendiente | 2 sem |
| 3 | QR y validación | 🟠 Alta | Fase 2 | 🔴 Pendiente | 1 sem |
| 4 | PDF | 🟠 Media | Fase 2 | 🔴 Pendiente | 1 sem |
| 5 | Dashboard y reportes | 🟡 Media | Fase 2 | 🔴 Pendiente | 1 sem |
| 6 | Auditoría, roles, config UI | 🟡 Media | Fase 1 | 🔴 Pendiente | 1 sem |
| 7 | Carga masiva | 🟢 Baja | Fase 2 | 🔴 Pendiente | 1 sem |
| 8 | Hardening y despliegue | 🟡 Media | Fases 1-5 | 🟡 Parcial | 2 sem |

**Avance global estimado: ~32%** (post-Sprint 0)

---

## Fase 0 — Fundación ✅

**Objetivo:** Establecer arquitectura, BD y autenticación base.  
**Prioridad:** Completada  
**Estado:** ✅ Terminada

- [x] Arquitectura Express + Bootstrap
- [x] Script SQL completo (schema + seed)
- [x] Conexión MySQL (mysql2 pool)
- [x] Variables de entorno
- [x] Docker Compose MySQL
- [x] Módulo auth base: login, logout, sesiones
- [x] Middleware seguridad (headers, rate limit, CSRF)
- [x] Documentación (README, DATABASE, ARCHITECTURE, ROADMAP, CHANGELOG, TASKS)

---

## Fase 0.5 — Corrección de bloqueadores ✅

**Objetivo:** Hacer el sistema ejecutable y funcional en desarrollo.  
**Prioridad:** 🔴 Crítica  
**Dependencias:** Fase 0  
**Estado:** ✅ Completada (2026-06-26)  
**Tiempo estimado:** 2-3 días

Ver [SPRINT_0_REPORT.md](./SPRINT_0_REPORT.md).

- [x] Completar `package.json` con dependencias runtime
- [x] Integrar CSRF en frontend (`api.js`, `login.js`)
- [x] Corregir INSERT coordinador en `database/seed.sql`
- [x] Verificar login + CRUD usuarios end-to-end con MySQL (login verificado)
- [x] Alinear `docker-compose.yml` con `.env`
- [x] Actualizar textos obsoletos en `index.html` y `dashboard.html`
- [ ] Actualizar `README.md` para reflejar stack Express
- [ ] Integrar migraciones 002/003 en schema o documentar aplicación obligatoria

---

## Fase 1 — Módulo Usuarios (verificación y cierre) 🟡

**Objetivo:** Confirmar y cerrar el módulo de gestión de usuarios.  
**Prioridad:** 🔴 Alta  
**Dependencias:** Fase 0.5  
**Estado:** 🟡 Parcial (~80%)  
**Tiempo estimado:** 1 semana

- [x] CRUD usuarios (API + UI)
- [x] Búsqueda y filtros (tipo, regional, estado)
- [x] Upload de foto (multer)
- [x] Validación de datos
- [x] Auditoría de cambios
- [ ] Filtro por `regional_id` para coordinadores
- [ ] RBAC por permisos (`requirePermission`) además de rol
- [ ] Pruebas manuales/automatizadas verificadas

---

## Fase 2 — Módulo Carnés 🔴

**Objetivo:** Generación y gestión de carnés institucionales conectada a MySQL.  
**Prioridad:** 🔴 Alta  
**Dependencias:** Fase 1  
**Estado:** 🔴 Sin desarrollar (~5%)  
**Tiempo estimado:** 2 semanas

**Referencia legacy:** `src/services/carnet.service.ts`, `src/repositories/carnet.repository.ts`

- [ ] Servicio y API `/api/carnets` en Express
- [ ] Generación individual
- [ ] Código único automático (`REG01-2026-000001`)
- [ ] Edición y renovación
- [ ] Revocación / suspensión
- [ ] Historial de estados
- [ ] UI listado y generación (`carnets.html` integrado)
- [ ] Migrar/eliminar prototipo mock en raíz

---

## Fase 3 — Módulo QR 🔴

**Objetivo:** Validación pública de carnés mediante código QR.  
**Prioridad:** 🟠 Alta  
**Dependencias:** Fase 2  
**Estado:** 🔴 Sin desarrollar (~3%)  
**Tiempo estimado:** 1 semana

**Referencia legacy:** `src/services/qr.service.ts`, `src/components/carnets/QRScanner.tsx`

- [ ] Generación automática de `qr_token` al emitir carné (HMAC-SHA256)
- [ ] GET `/api/validar/:token` (público, datos seguros)
- [ ] Página `validar.html` funcional (escáner + entrada manual)
- [ ] Log de validaciones en `validaciones_qr`
- [ ] Resolución automática estado VENCIDO
- [ ] Rate limiting en endpoint público

---

## Fase 4 — Módulo PDF 🔴

**Objetivo:** Exportación e impresión de carnés institucionales.  
**Prioridad:** 🟠 Media  
**Dependencias:** Fase 2  
**Estado:** 🔴 Sin desarrollar (~2%)  
**Tiempo estimado:** 1 semana

- [ ] Motor PDF (evaluar puppeteer vs pdfkit)
- [ ] Plantilla basada en `public/templates/carnet-template.json`
- [ ] GET `/api/carnets/:id/pdf`
- [ ] Botón descargar en UI
- [ ] Impresión optimizada

---

## Fase 5 — Dashboard y Reportes 🔴

**Objetivo:** Estadísticas en tiempo real y exportación de datos.  
**Prioridad:** 🟡 Media  
**Dependencias:** Fase 2  
**Estado:** 🟡 Parcial (~15%)  
**Tiempo estimado:** 1 semana

**Referencia legacy:** `src/services/reporte.service.ts`

- [x] UI dashboard con cards (placeholders)
- [ ] API de estadísticas
- [ ] Contadores reales en dashboard
- [ ] Reportes: activos, inactivos, vencidos, próximos a vencer
- [ ] Exportación CSV/Excel
- [ ] Página de reportes

---

## Fase 6 — Auditoría, Roles y Configuración 🔴

**Objetivo:** Interfaces de administración avanzada.  
**Prioridad:** 🟡 Media  
**Dependencias:** Fase 1  
**Estado:** 🟡 Parcial (~10%)  
**Tiempo estimado:** 1 semana

- [x] Servicio auditoría (logging backend)
- [ ] UI auditoría (`/auditoria.html`)
- [ ] UI gestión roles y permisos
- [ ] UI CRUD regionales y centros
- [ ] API config completa (POST/PUT/DELETE)

---

## Fase 7 — Carga Masiva 🔴

**Objetivo:** Importación CSV de carnés en lote.  
**Prioridad:** 🟢 Baja  
**Dependencias:** Fase 2  
**Estado:** 🔴 Sin desarrollar  
**Tiempo estimado:** 1 semana

- [ ] POST `/api/carnets/masivo`
- [ ] Validación por fila
- [ ] Registro en `cargas_masivas`
- [ ] UI con preview de errores

---

## Fase 8 — Hardening y Despliegue 🟡

**Objetivo:** Preparar el sistema para producción.  
**Prioridad:** 🟡 Media  
**Dependencias:** Fases 1-5 mínimo  
**Estado:** 🟡 Parcial (~35%)  
**Tiempo estimado:** 2 semanas

- [x] Rate limiting (backend)
- [x] CSRF (backend)
- [x] Security headers
- [ ] CSRF integrado en frontend
- [ ] Corregir recuperación contraseña (bcrypt, columnas BD)
- [ ] Tests automatizados Express
- [ ] Session store persistente (producción)
- [ ] Despliegue PM2 / Docker completo
- [ ] Manual de usuario
- [ ] Limpieza archivos basura y legacy huérfano

---

## Cronograma estimado (desde junio 2026)

| Período | Fase | Entregable |
|---------|------|------------|
| Semana 1 | 0.5 | Sistema ejecutable, login funcional |
| Semana 2 | 1 | Usuarios verificado y cerrado |
| Semanas 3-4 | 2 | Carnés completo |
| Semana 5 | 3 | QR y validación |
| Semana 6 | 4 | PDF |
| Semana 7 | 5 | Dashboard + reportes |
| Semana 8 | 6-7 | Admin UI + carga masiva |
| Semanas 9-10 | 8 | Hardening + despliegue |

**Duración total estimada:** 10 semanas desde corrección de bloqueadores.

---

## Decisiones pendientes

1. ¿Portar lógica desde `src/` (Next.js) o reescribir desde cero en Express?
2. ¿Motor PDF: puppeteer (HTML→PDF) o pdfkit (programático)?
3. ¿Mantener `src/` como referencia permanente o archivar en rama separada?
4. ¿Recuperación contraseña y 2FA en scope del MVP o postergar?
