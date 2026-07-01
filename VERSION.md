# VERSION.md — SENA Carnés

## Versión actual

| Campo | Valor |
|-------|-------|
| **Versión** | v1.0.0 |
| **Codename** | RC1 — Release Candidate |
| **Fecha** | 2026-07-01 |
| **Estado** | Lista para entrega y despliegue |

---

## Resumen

Primera versión estable del **Sistema de Gestión y Generación de Carnés Institucionales del SENA**. Implementa el ciclo completo: usuarios → carnés → QR → PDF → validación pública → dashboard → reportes → auditoría → configuración.

---

## Funcionalidades incluidas

- Autenticación con sesiones, CSRF y rate limiting
- RBAC con 14 permisos granulares
- CRUD usuarios con foto y alcance organizacional
- Gestión de regionales, centros, dependencias y roles
- Emisión, renovación, suspensión y revocación de carnés
- Generación PDF con plantilla institucional (Puppeteer)
- Código QR firmado HMAC + validación pública
- Dashboard ejecutivo con Chart.js
- Reportes con exportación CSV, Excel y PDF
- Bitácora de auditoría consultable
- Configuración del sistema en base de datos
- Notificaciones internas
- Gestión de sesiones activas
- Monitoreo de servicios

---

## Limitaciones conocidas

| # | Limitación | Impacto | Workaround |
|---|------------|---------|------------|
| 1 | Sesiones en memoria | No escala multi-instancia | Una instancia o PM2 cluster limitado |
| 2 | 2FA no obligatorio en login | Seguridad reducida para admins | Desactivar cuentas demo en prod |
| 3 | TOTP implementation parcial | 2FA puede no funcionar correctamente | No activar 2FA hasta v2.0 |
| 4 | Email SMTP manual | Recuperación password sin SMTP no envía correo | Configurar SMTP o reset manual |
| 5 | Carga masiva no implementada | Emisión solo individual | Proceso manual por lotes |
| 6 | `src/` legacy Next.js | Confusión en documentación antigua | Usar solo `backend/` + `public/` |
| 7 | Tests unitarios limitados | Cobertura parcial | `npm run verify:rc1` para integración |

---

## Mejoras futuras (Roadmap v2.0)

1. Redis para sesiones, rate limiting y caché
2. 2FA obligatorio con librería TOTP estándar (`otplib`)
3. Envío de correo integrado (notificaciones + reset password)
4. Carga masiva CSV de carnés
5. API REST versionada (`/api/v1/`)
6. Internacionalización (i18n) completa
7. PWA / modo offline para validación QR
8. CI/CD automatizado con GitHub Actions
9. Tests E2E con Playwright
10. Panel de analytics avanzado

---

## Requisitos mínimos

- Node.js 18+
- MySQL 8.0+
- 2 GB RAM
- Chromium (via Puppeteer) para PDF

---

## Verificación

```bash
npm run setup:db
npm run dev
npm run verify:rc1   # → RC1_VERIFY_OK
npm test             # → 3 tests OK
```

---

## Historial de versiones

| Versión | Fecha | Notas |
|---------|-------|-------|
| v1.0.0-rc1 | 2026-07-01 | Release Candidate — Sprint 10 |
| v0.9.0 | 2026-07-01 | Sprint 9 — Auditoría y configuración |
| v0.8.0 | 2026-07-01 | Sprint 8 — Reportes |
| v0.7.0 | 2026-07-01 | Sprint 7 — Dashboard |
| v0.6.0 | 2026-07-01 | Sprint 6 — Validación QR |
| v0.5.0 | 2026-07-01 | Sprint 5 — PDF |
| v0.4.0 | 2026-07-01 | Sprint 4 — Carnés |
| v0.3.0 | 2026-07-01 | Sprint 3 — Organización |
| v0.2.0 | 2026-07-01 | Sprint 2 — Usuarios |
| v0.1.0 | 2026-07-01 | Sprint 0–1 — Auth + base |
