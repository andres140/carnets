# Roadmap — SENA Carnés

## Fase 0 — Fundación ✅ (actual)

- [x] Arquitectura Express + Bootstrap
- [x] Script SQL completo (schema + seed)
- [x] Conexión MySQL (mysql2 pool)
- [x] Variables de entorno
- [x] Documentación (README, DATABASE, ARCHITECTURE, ROADMAP, CHANGELOG)
- [x] Módulo 1 base: login, logout, sesiones, control de acceso

## Fase 1 — Módulo 2: Usuarios

- [ ] CRUD usuarios (API + UI)
- [ ] Búsqueda y filtros (tipo, regional, estado)
- [ ] Upload de foto (multer)
- [ ] Validación de datos
- [ ] Auditoría de cambios

## Fase 2 — Módulo 3: Carnés

- [ ] Generación individual
- [ ] Edición y renovación
- [ ] Revocación / suspensión
- [ ] Historial de estados
- [ ] Código único automático

## Fase 3 — Módulo 4: QR

- [ ] Generación automática al emitir carné
- [ ] Página pública de validación
- [ ] Log de validaciones

## Fase 4 — Módulo 5: PDF

- [ ] Plantilla de carné institucional
- [ ] Exportación PDF
- [ ] Impresión optimizada

## Fase 5 — Módulos 6 y 7: Dashboard y Reportes

- [ ] Estadísticas en tiempo real
- [ ] Reportes: activos, inactivos, vencidos, próximos a vencer
- [ ] Exportación CSV/Excel

## Fase 6 — Hardening

- [ ] Tests automatizados
- [ ] Rate limiting en login
- [ ] Despliegue producción (PM2 / Docker)
- [ ] Manual de usuario

## Cronograma estimado

| Fase | Duración | Entregable |
|------|----------|------------|
| 0 | Semana 1-2 | Auth + BD + docs |
| 1 | Semana 3-4 | CRUD usuarios |
| 2 | Semana 5-6 | Carnés |
| 3-4 | Semana 7-8 | QR + PDF |
| 5 | Semana 9-10 | Dashboard + reportes |
| 6 | Semana 11-12 | Hardening |
