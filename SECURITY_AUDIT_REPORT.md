# SECURITY_AUDIT_REPORT.md — SENA Carnés v1.0.0

**Fecha de auditoría:** 2026-07-01  
**Alcance:** Revisión pre-producción (pentest lógico + revisión de código)  
**Metodología:** OWASP Top 10 2021, OWASP ASVS (nivel 2 parcial), análisis estático, revisión de rutas API, flujos auth/authz  
**Auditor:** Equipo de revisión Senior (Security Engineer / PenTester / Backend / QA Security)  
**Estado:** Documentación únicamente — **sin correcciones aplicadas** (pendiente aprobación)

---

## Resumen ejecutivo

Se realizó una auditoría de seguridad completa sobre el stack activo **Express + MySQL + HTML/JS** (`backend/`, `public/`). El sistema implementa controles importantes (bcrypt, SQL parametrizado, CSRF parcial, rate limiting, headers de seguridad, RBAC), pero **no está listo para producción sin remediar vulnerabilidades críticas y altas**.

### Hallazgos consolidados

| Severidad | Cantidad | Bloqueante producción |
|-----------|----------|------------------------|
| Crítica | 4 | Sí |
| Alta | 9 | Sí |
| Media | 11 | Recomendado |
| Baja | 8 | No |

### Nivel general de seguridad

**Calificación: 5.5 / 10 — RIESGO MEDIO-ALTO**

El núcleo de acceso a datos (SQL parametrizado, permisos en rutas API) es sólido, pero existen fallos graves en **escalada de privilegios**, **bypass de autenticación multifactor**, **exposición de tokens de reset**, **bypass de autorización en páginas HTML**, y **XSS almacenado** en múltiples vistas.

### Recomendación para producción

**NO DESPLEGAR en producción** hasta corregir al menos todas las vulnerabilidades **Críticas** y **Altas** marcadas como bloqueantes. Tras remediación, ejecutar `npm run verify:rc1` y repetir pruebas manuales de escalada de privilegios y bypass de sesión.

---

## Vulnerabilidades críticas

### SEC-001 — Escalada vertical de privilegios (asignación de rol ADMIN)

| Campo | Detalle |
|-------|---------|
| **Severidad** | Crítica |
| **CWE** | CWE-269 (Improper Privilege Management) |
| **OWASP** | A01:2021 Broken Access Control |

**Descripción:** Un coordinador (u otro usuario con `usuarios.crear` / `usuarios.editar`) puede asignar **cualquier `rolId`**, incluido `rol-admin` (ADMINISTRADOR), sin validación de jerarquía de roles.

**Evidencia:**

```171:207:backend/services/users.service.js
  const rolId = scoped.rolId || existing.rolId;
  const rol = await usersRepository.findRolById(rolId);
  // ... no hay comprobación de que actor pueda asignar este rol
  const fields = [
    'email = ?',
    // ...
    'rol_id = ?',
    'tipo_usuario = ?',
```

El seed otorga `usuarios.editar` al rol coordinador (`database/seed.sql` líneas 48–51), pero **no** restringe qué roles puede asignar.

**Impacto:** Toma de control total del sistema por un usuario regional.

**Archivos afectados:** `backend/services/users.service.js`, `backend/controllers/users.controller.js`

**Solución recomendada:**
- Matriz de roles asignables por actor (ej. coordinador solo puede asignar INSTRUCTOR, APRENDIZ, etc.).
- Prohibir asignación de `ADMINISTRADOR` salvo por otro admin.
- Validar en create y update; auditar intentos denegados.

**Prueba sugerida:**
```http
PUT /api/usuarios/{id-coord-user}
Authorization: Cookie + CSRF
{ "rolId": "rol-admin" }
```

---

### SEC-002 — Bypass completo de 2FA en login principal

| Campo | Detalle |
|-------|---------|
| **Severidad** | Crítica |
| **CWE** | CWE-287 (Improper Authentication) |
| **OWASP** | A07:2021 Identification and Authentication Failures |

**Descripción:** El login principal crea sesión completa **sin verificar** `two_factor_enabled`. Un usuario con 2FA activo accede con solo email/contraseña.

**Evidencia:**

```107:115:backend/controllers/auth.controller.js
    const passwordValidation = validatePassword(password);
    req.session.user = user;
    // ... no consulta two_factor_enabled
    await sesionesService.registerLogin(req, user);
```

**Impacto:** 2FA es inefectivo; falsa sensación de seguridad.

**Archivos afectados:** `backend/controllers/auth.controller.js`

**Solución recomendada:** Si `two_factor_enabled`, no establecer `req.session.user`; devolver `{ requires2fa: true, pendingToken }` firmado y de un solo uso; completar sesión solo tras `/2fa/verify-login`.

---

### SEC-003 — Bypass de autenticación vía `/2fa/verify-login`

| Campo | Detalle |
|-------|---------|
| **Severidad** | Crítica |
| **CWE** | CWE-306 (Missing Authentication for Critical Function) |
| **OWASP** | A07:2021 |

**Descripción:** `POST /api/auth/2fa/verify-login` acepta `{ usuarioId, token }` **sin demostrar** que el usuario completó el paso de contraseña. Cualquiera que obtenga/adivine un TOTP válido (o explote SEC-004) puede crear sesión para **cualquier** `usuarioId`.

**Evidencia:**

```92:127:backend/routes/twoFactorAuth.routes.js
router.post('/verify-login', loginRateLimit, csrfProtection, async (req, res, next) => {
  const { usuarioId, token } = req.body;
  const result = await twoFactorAuthService.verifyTwoFactorLogin(usuarioId, token);
  // ...
  req.session.user = user;
```

**Impacto:** Account takeover sin contraseña.

**Archivos afectados:** `backend/routes/twoFactorAuth.routes.js`, `backend/services/twoFactorAuthService.js`

**Solución recomendada:** Token intermedio post-password almacenado en sesión o JWT de un solo uso (5 min) vinculado a `usuarioId` + IP; rechazar verify-login sin ese token.

---

### SEC-004 — Tokens de recuperación de contraseña almacenados en texto plano

| Campo | Detalle |
|-------|---------|
| **Severidad** | Crítica |
| **CWE** | CWE-256 (Plaintext Storage of Password), CWE-312 |
| **OWASP** | A02:2021 Cryptographic Failures |

**Descripción:** La tabla `password_reset_tokens` almacena el token **en claro** en la columna `token`, además del hash. Compromiso de BD = reset masivo de contraseñas.

**Evidencia:**

```48:61:backend/services/passwordRecoveryService.js
    await db.query(insertQuery, [
      tokenId,
      user.id,
      token,        // ← texto plano en BD
      tokenHash,
      email,
```

**Impacto:** Compromiso total de cuentas si hay acceso read-only a MySQL, backup filtrado o SQLi futura.

**Archivos afectados:** `backend/services/passwordRecoveryService.js`, `migrations/003_password_recovery_2fa.sql`

**Solución recomendada:** Almacenar **solo** `token_hash`; nunca persistir el token en claro. Eliminar columna `token` o dejar de escribirla.

---

## Vulnerabilidades altas

### SEC-005 — Session Fixation (sin regeneración de ID de sesión)

| Campo | Detalle |
|-------|---------|
| **Severidad** | Alta |
| **CWE** | CWE-384 (Session Fixation) |

**Descripción:** Tras login exitoso no se llama a `req.session.regenerate()`. Un atacante puede fijar un ID de sesión previo.

**Evidencia:** `backend/controllers/auth.controller.js` línea 108 — asignación directa a sesión existente.

**Solución:** `req.session.regenerate()` antes de `req.session.user = user`.

---

### SEC-006 — Bypass de autorización en páginas HTML vía archivos estáticos

| Campo | Detalle |
|-------|---------|
| **Severidad** | Alta |
| **CWE** | CWE-425 (Direct Request) |
| **OWASP** | A01:2021 |

**Descripción:** `express.static` sirve `public/` **antes** de `pageRoutes`. Las páginas en `public/pages/` son accesibles en `/pages/*.html` **sin** middleware `requireAuth`.

**Evidencia:**

```42:54:backend/app.js
app.use(express.static(publicDir));  // sirve /pages/dashboard.html sin auth
// ...
app.use(pageRoutes);                 // protege /dashboard.html
```

**Impacto:** Exposición de UI administrativa, scripts y estructura; facilita ataques combinados; datos sensibles aún requieren API autenticada, pero la superficie de ataque aumenta.

**Solución:** Mover HTML fuera de static, deshabilitar listado de `/pages/`, o middleware de auth antes de static para `/pages/`.

---

### SEC-007 — XSS almacenado/reflejado en frontend (innerHTML sin escape)

| Campo | Detalle |
|-------|---------|
| **Severidad** | Alta |
| **CWE** | CWE-79 (XSS) |
| **OWASP** | A03:2021 Injection |

**Descripción:** Múltiples módulos renderizan datos de usuario/API con `innerHTML` sin escapar: nombres, emails, mensajes de error.

**Evidencia (ejemplos):**

| Archivo | Línea aprox. | Dato sin escapar |
|---------|--------------|------------------|
| `public/js/carnets.js` | 121–139 | `nombreCompleto`, `err.message` |
| `public/js/usuarios.js` | 123–130 | `u.nombreCompleto`, `u.email` |
| `public/js/reportes.js` | 172+ | datos de reportes |
| `public/js/organizacion.js` | 133+ | nombres de entidades |
| `public/js/dashboard.js` | 182+ | actividad reciente |
| `public/js/auditoria.js` | 49+ | acciones, usuarios |

Solo `usuarios.js` escapa parcialmente errores (`escapeHtml` en línea 111); el resto no importa `utils.js`.

**Impacto:** Un admin que introduce `<img onerror=...>` en nombre de usuario ejecuta JS en sesión de otros admins (robo de sesión, CSRF adicional).

**Solución:** Escapar todo contenuto dinámico; preferir `textContent`; CSP sin `unsafe-inline`.

---

### SEC-008 — IDOR en carnés (`canAccessCarnet` fallback permisivo)

| Campo | Detalle |
|-------|---------|
| **Severidad** | Alta |
| **CWE** | CWE-639 (IDOR) |

**Descripción:** Para usuarios que no son admin/coord/instructor/aprendiz, `canAccessCarnet` devuelve `true` si tienen permiso `carnets.ver` **sin filtro regional**.

**Evidencia:**

```48:65:backend/utils/permissions.js
  if (actor.tipoUsuario === ROLES.INSTRUCTOR && actor.centroId) {
    return carnet.centroId === actor.centroId;
  }
  return hasPermission(actor, 'carnets.ver') || hasPermission(actor, 'carnets.generar');
```

**Impacto:** Acceso a carnés de otras regiones vía `GET /api/carnets/:id` si el rol tiene permiso pero no scope geográfico.

**Solución:** Denegar por defecto; aplicar scope organizacional a todos los roles staff.

---

### SEC-009 — 2FA desactivable sin re-autenticación

| Campo | Detalle |
|-------|---------|
| **Severidad** | Alta |
| **CWE** | CWE-308 (Missing Authorization) |

**Descripción:** `POST /api/auth/2fa/disable` solo requiere sesión + CSRF; no pide contraseña ni TOTP.

**Evidencia:** `backend/routes/twoFactorAuth.routes.js` líneas 138–156.

**Impacto:** CSRF o XSS puede desactivar 2FA de víctima.

**Solución:** Exigir contraseña + TOTP actual antes de disable.

---

### SEC-010 — CSRF ausente en recuperación de contraseña

| Campo | Detalle |
|-------|---------|
| **Severidad** | Alta |
| **CWE** | CWE-352 (CSRF) |
| **OWASP** | A01:2021 |

**Descripción:** Endpoints sin `csrfProtection`:
- `POST /api/auth/password-recovery/forgot-password`
- `POST /api/auth/password-recovery/validate-reset-token`
- `POST /api/auth/password-recovery/reset-password`

**Archivos:** `backend/routes/passwordRecovery.routes.js`

**Impacto:** Reset forzado / spam de emails de reset (si SMTP activo).

**Solución:** CSRF o token anti-automation en formularios de reset.

---

### SEC-011 — Validación de uploads basada solo en MIME declarado

| Campo | Detalle |
|-------|---------|
| **Severidad** | Alta |
| **CWE** | CWE-434 (Unrestricted Upload) |

**Descripción:** Multer valida `file.mimetype` del cliente, no magic bytes. Extensión tomada de `originalname`.

**Evidencia:**

```22:28:backend/config/upload.js
  fileFilter: (_req, file, cb) => {
    if (UPLOAD.ALLOWED_MIMES.includes(file.mimetype)) cb(null, true);
```

**Impacto:** Subida de polyglot files; posible almacenamiento de contenido malicioso servido desde `/uploads/`.

**Solución:** Validar firma de archivo (file-type); forzar extensión `.jpg/.png`; servir uploads con `Content-Disposition: attachment` o desde dominio separado.

---

### SEC-012 — Dependencias con vulnerabilidades HIGH (npm audit)

| Campo | Detalle |
|-------|---------|
| **Severidad** | Alta |

**Hallazgos `npm audit`:**

| Paquete | Severidad | Notas |
|---------|-----------|-------|
| `nodemailer` ≤9.0.0 | High | SMTP injection, DoS, TLS issues — fix en 9.0.3 |
| `xlsx` * | High | Prototype pollution, ReDoS — sin fix disponible |

**Impacto:** DoS en exportación Excel; riesgo en envío de correo si SMTP se activa.

**Solución:** Actualizar nodemailer; evaluar `exceljs` o sanitizar/limitar tamaño de exportaciones; aislar parsing en worker.

---

### SEC-013 — Sesiones: revocación incompleta y store en memoria

| Campo | Detalle |
|-------|---------|
| **Severidad** | Alta |
| **CWE** | CWE-613 (Insufficient Session Expiration) |

**Descripción:**
1. `express-session` MemoryStore — sesiones perdidas/reiniciadas inconsistentemente.
2. `revokedSessions` Set en memoria — no sobrevive reinicio del proceso.
3. `isActive()` devuelve `true` si no hay fila en `sesiones_usuario` — sesiones legacy no revocables.

**Evidencia:** `backend/services/sesiones.service.js`, `backend/repositories/sesiones.repository.js` líneas 40–46.

**Solución:** Redis/MySQL session store; tratar ausencia de fila como no rastreada o inválida según política.

---

## Vulnerabilidades medias

### SEC-014 — CSP débil (`unsafe-inline`, `unsafe-eval`)

**Archivo:** `backend/middleware/securityHeaders.js` líneas 26–28  
**Impacto:** Reduce eficacia anti-XSS.  
**Solución:** Nonces por request; eliminar `unsafe-eval`.

---

### SEC-015 — Token CSRF aceptado en query string

**Archivo:** `backend/middleware/csrf.js` línea 55  
**Impacto:** Filtración vía logs, Referer, historial.  
**Solución:** Solo header `X-CSRF-Token`.

---

### SEC-016 — Reflección de path en error 404 HTML

**Archivo:** `backend/middleware/errorHandler.js` línea 5  
**Código:** `` `<p>Página no encontrada: ${req.path}</p>` `` sin escape  
**Impacto:** XSS reflejado vía URL maliciosa.

---

### SEC-017 — Rate limiting spoofeable (X-Forwarded-For)

**Archivo:** `backend/middleware/rateLimit.js` — usa `X-Forwarded-For` sin `trust proxy` configurado en `app.js`.  
**Impacto:** Evadir límites de login/QR.

---

### SEC-018 — Validación QR pública expone foto y nombre completo

**Archivo:** `backend/services/validacion.service.js` — `buildPublicCarnet` incluye `fotoUrl`, `nombreCompleto`.  
**Impacto:** Privacidad / enumeración si token filtrado.  
**Solución:** Evaluar minimización de datos en endpoint público.

---

### SEC-019 — `validate-reset-token` sin rate limit

**Archivo:** `backend/routes/passwordRecovery.routes.js` línea 76  
**Impacto:** Enumeración/bruteforce de tokens (mitigado por entropía alta del token).

---

### SEC-020 — Implementación TOTP defectuosa

**Archivo:** `backend/services/twoFactorAuthService.js` líneas 38–61  
**Detalle:** `hmac.digest()` llamado dos veces (segundo digest vacío); `Buffer.from(secret, 'base32')` inválido; counter no usado en HMAC.  
**Impacto:** 2FA no funciona correctamente (reduce riesgo accidentalmente, pero SEC-002/003 siguen críticos).

---

### SEC-021 — 2FA activado antes de verificación (`setupTwoFactor`)

**Archivo:** `twoFactorAuthService.js` línea 99 — `two_factor_enabled = TRUE` antes de confirmar TOTP.

---

### SEC-022 — Mensajes de error detallados en desarrollo

**Archivo:** `backend/middleware/errorHandler.js` — stack en consola; mensaje completo si `NODE_ENV !== production`.  
**Verificar:** No filtrar stack al cliente en prod (actualmente OK en prod).

---

### SEC-023 — Páginas HTML duplicadas sin protección

**Archivos:** `public/carnets.html` (raíz) vs `public/pages/carnets.html`  
**Impacto:** Confusión y posible acceso a UI legacy.

---

### SEC-024 — Health endpoint expone metadatos

**Ruta:** `GET /api/health` — sin auth, revela nombre del servicio.  
**Impacto:** Bajo reconocimiento.

---

## Vulnerabilidades bajas

| ID | Hallazgo | Archivo |
|----|----------|---------|
| SEC-025 | Secretos débiles en `.env.example` (aceptable solo dev) | `.env.example` |
| SEC-026 | Validación SQLi/XSS solo en login, no global | `auth.controller.js` |
| SEC-027 | `canAccessUser` niega acceso a INSTRUCTOR (inconsistencia) | `permissions.js` |
| SEC-028 | Logout no invalida todas las sesiones del usuario en BD | `auth.controller.js` |
| SEC-029 | Backup codes 2FA devueltos en JSON de setup | `twoFactorAuth.routes.js` |
| SEC-030 | CORS restringido a `APP_URL` (correcto) pero sin whitelist múltiple | `app.js` |
| SEC-031 | Sin rotación de `QR_SIGNING_KEY` documentada | `env.js` |
| SEC-032 | Carpeta `src/` legacy Next.js en repo (superficie de confusión) | `src/` |

---

## Matriz por área auditada

### Autenticación

| Control | Estado | Notas |
|---------|--------|-------|
| Login bcrypt | ✅ | 12 rondas |
| Rate limit login | ✅ | 5/15min prod |
| CSRF login/logout | ✅ | |
| Session httpOnly | ✅ | |
| Session secure (prod) | ✅ | |
| Session regeneration | ❌ | SEC-005 |
| 2FA efectivo | ❌ | SEC-002, SEC-003, SEC-020 |
| Password recovery | ⚠️ | SEC-004, SEC-010 |
| Logout | ✅ | Destruye sesión |

### Autorización

| Control | Estado | Notas |
|---------|--------|-------|
| RBAC en API | ✅ | Mayoría de rutas |
| Escalada de rol | ❌ | SEC-001 |
| IDOR carnés | ⚠️ | SEC-008 |
| HTML protegido | ❌ | SEC-006 |
| Auditoría borrable | ✅ | Sin rutas DELETE |

### Base de datos

| Control | Estado | Notas |
|---------|--------|-------|
| SQL parametrizado | ✅ | Repositories usan `?` |
| Concatenación peligrosa | ⚠️ | `fields.join` con whitelist interna — OK si fields no son user-controlled |
| LIKE con `%term%` | ✅ | Parametrizado |

### Frontend

| Control | Estado | Notas |
|---------|--------|-------|
| XSS | ❌ | SEC-007 |
| CSP | ⚠️ | SEC-014 |

### API

| Control | Estado | Notas |
|---------|--------|-------|
| Rutas sin auth | ⚠️ | Solo health, login, validar QR, recovery, csrf-token (esperado) |
| Métodos HTTP | ✅ | REST coherente |
| Export sin permiso | ✅ | Requiere `reportes.ver` + sesión |

### Subida de archivos

| Control | Estado | Notas |
|---------|--------|-------|
| Tamaño límite | ✅ | 5 MB |
| MIME whitelist | ⚠️ | Solo cliente — SEC-011 |
| Renombrado UUID | ✅ | |
| SVG bloqueado (logo) | ✅ | Sprint 10 |
| Uploads públicos | ⚠️ | `/uploads/` estático |

### QR / PDF

| Control | Estado | Notas |
|---------|--------|-------|
| Token QR HMAC | ✅ | 128-bit random + firma |
| timingSafeEqual | ✅ | |
| PDF IDOR | ✅ | `canAccessCarnet` en servicio |
| Validación token inválido | ✅ | Mensaje genérico |

### Variables de entorno

| Variable | `.env.example` | Producción |
|----------|----------------|------------|
| DB_HOST=localhost | ✅ | OK dev |
| DB_PORT=3306 | ✅ | OK |
| DB_NAME=sena_carnets | ✅ | OK |
| DB_USER=root | ✅ | Cambiar en prod |
| DB_PASSWORD=root | ✅ | **Cambiar obligatorio en prod** |
| SESSION_SECRET | Débil (dev) | Validación ≥32 chars en prod ✅ |
| QR_SIGNING_KEY | Débil (dev) | Validación ≥32 chars en prod ✅ |

**Nota:** `.env` real no está en repositorio (correcto). No se encontraron secretos hardcodeados en código fuente activo.

### Auditoría

| Control | Estado |
|---------|--------|
| Registro de acciones | ✅ |
| Eliminación de registros | ✅ No implementada (correcto) |
| Consulta acotada por rol | ✅ Coordinador regional |

---

## Checklist OWASP Top 10 (2021)

| # | Categoría | Estado | Hallazgos |
|---|-----------|--------|-----------|
| A01 | Broken Access Control | ❌ | SEC-001, SEC-006, SEC-008 |
| A02 | Cryptographic Failures | ❌ | SEC-004 |
| A03 | Injection | ⚠️ | SQL OK; XSS SEC-007 |
| A04 | Insecure Design | ⚠️ | 2FA diseño roto SEC-002/003 |
| A05 | Security Misconfiguration | ⚠️ | SEC-006, SEC-014, static pages |
| A06 | Vulnerable Components | ❌ | SEC-012 nodemailer, xlsx |
| A07 | Auth Failures | ❌ | SEC-002, SEC-003, SEC-005, SEC-009 |
| A08 | Software/Data Integrity | ⚠️ | xlsx prototype pollution |
| A09 | Logging Failures | ✅ | Auditoría implementada |
| A10 | SSRF | ✅ | No endpoints SSRF obvios; Puppeteer local |

---

## Pruebas realizadas / recomendadas

| Prueba | Resultado auditoría |
|--------|---------------------|
| API sin sesión → 401 | ✅ Verificado en diseño |
| Coordinador → config 403 | ✅ Sprint 9 verify |
| Escalada rol ADMIN | ❌ **Vulnerable (SEC-001)** |
| `/pages/dashboard.html` sin login | ❌ **Accesible (SEC-006)** |
| SQLi en login | ✅ Bloqueado (patrones + parametrizado) |
| npm audit | ❌ 2 high |
| Token QR inválido | ✅ Respuesta genérica |
| Export CSV sin auth | ✅ 401 |

---

## Plan de remediación priorizado (pendiente aprobación)

### Fase 1 — Bloqueantes (antes de producción)

1. SEC-001 — Restricción asignación de roles  
2. SEC-004 — Eliminar tokens plaintext en BD  
3. SEC-002 + SEC-003 — Rediseño flujo 2FA/login  
4. SEC-006 — Proteger HTML estático  
5. SEC-007 — Sanitización XSS global  
6. SEC-005 — Regeneración de sesión  

### Fase 2 — Alta prioridad (1–2 semanas)

7. SEC-008 — Scope IDOR carnés  
8. SEC-010 — CSRF password recovery  
9. SEC-011 — Validación uploads  
10. SEC-012 — Actualizar dependencias  
11. SEC-009 — Re-auth para disable 2FA  
12. SEC-013 — Session store persistente  

### Fase 3 — Endurecimiento

13. CSP estricta (SEC-014)  
14. Rate limit + trust proxy (SEC-017)  
15. Minimizar datos QR públicos (SEC-018)  

---

## Conclusión

SENA Carnés v1.0.0 tiene **fundamentos de seguridad aceptables en capa de datos**, pero presenta **fallos críticos de control de acceso y autenticación** que impiden un despliegue seguro en producción institucional.

**Veredicto:** ⛔ **NO APROBADO PARA PRODUCCIÓN** — remediar Fase 1 y re-auditar.

---

*Informe generado sin modificar código. Las correcciones requieren aprobación explícita del responsable del proyecto.*
