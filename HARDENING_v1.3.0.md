# MÓDULO 5: HARDENING DE SEGURIDAD — SENA Carnés v1.3.0

**Versión:** 1.3.0  
**Tipo:** Security Hardening  
**Status:** 🔒 En Implementación

---

## Descripción General

Implementación de medidas de seguridad avanzadas para proteger el Sistema de Gestión de Carnés contra ataques comunes:

1. **Rate Limiting** — Protección contra ataques de fuerza bruta
2. **CSRF Protection** — Protección contra falsificación de solicitudes entre sitios
3. **Security Headers** — Headers HTTP de seguridad
4. **Password Validation** — Validación de contraseñas robustas
5. **Input Sanitization** — Sanitización de entrada
6. **Encryption** — Encriptación de datos sensibles en tránsito

---

## Implementación

### 1. Rate Limiting

**Archivos:**
- `src/middleware/rateLimit.ts` — Middleware de rate limiting

**Límites configurados:**
- **Login:** 5 intentos fallidos en 15 minutos
- **QR Validation (público):** 100 validaciones en 1 hora
- **API General:** 1000 requests en 1 minuto

**Uso:**
```typescript
import { loginRateLimit, qrValidationRateLimit } from '@/middleware/rateLimit';

// En endpoint
if (!loginRateLimit(req)) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

### 2. CSRF Protection

**Archivos:**
- `src/lib/csrf.ts` — Utilidades CSRF
- `src/components/forms/CsrfForm.tsx` — Componente de formulario CSRF-seguro

**Implementación:**
```typescript
// En servidor
const token = generateCsrfToken(sessionId);

// En cliente
import CsrfForm from '@/components/forms/CsrfForm';

<CsrfForm onSubmit={handleSubmit}>
  {/* Form fields */}
</CsrfForm>

// En API
const token = formData.get('_csrf');
if (!validateCsrfToken(sessionId, token)) {
  return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
}
```

### 3. Security Headers

**Archivo:**
- `src/lib/security-headers.ts` — Configuración de headers

**Headers implementados:**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [config]
Permissions-Policy: [restricciones]
```

### 4. Password Validation

**Archivo:**
- `src/lib/password-validator.ts` — Validador de contraseñas
- `src/components/forms/PasswordValidator.tsx` — Componente visual

**Requisitos:**
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula
- Al menos 1 número
- Al menos 1 carácter especial (!@#$%^&*)

**Fortaleza:**
- WEAK: < 2 criterios cumplidos
- MEDIUM: 2-4 criterios + 8+ caracteres
- STRONG: Todos los criterios + 12+ caracteres

**Uso:**
```typescript
import { validatePassword, generateSecurePassword } from '@/lib/password-validator';

const result = validatePassword('password123');
// { valid: false, errors: [...], strength: 'weak' }

const securePassword = generateSecurePassword(16);
// Genera contraseña aleatoria de 16 caracteres
```

### 5. Input Sanitization

**Próximo a implementar:**
- Sanitización de campos de búsqueda
- Validación de MIME types en uploads
- Límites de tamaño de archivo

### 6. Encryption

**Variables de entorno para producción:**
```env
# QR Signing
QR_SIGNING_KEY=<random-key-32-chars>

# JWT
NEXTAUTH_SECRET=<random-key-32-chars>

# Encryption master key (futuro)
ENCRYPTION_KEY=<random-key-32-chars>
```

---

## Configuración

### Variables de Entorno

```env
# Seguridad
NODE_ENV=production
RATE_LIMIT_LOGIN=5:900           # 5 intentos en 900 segundos
RATE_LIMIT_QR=100:3600           # 100 validaciones en 1 hora
RATE_LIMIT_API=1000:60           # 1000 requests en 60 segundos
CSRF_SECRET=<random>
```

### Middleware

En `src/middleware.ts`:
```typescript
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

---

## Testing

**Escenarios de prueba:**

### Rate Limiting
```bash
# Login: 6 intentos seguidos
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/signin \
    -d "email=test&password=wrong"
done
# El 6to debe retornar 429

# QR: 101 validaciones en < 1 hora
for i in {1..101}; do
  curl http://localhost:3000/api/validar?token=xxx
done
# El 101 debe retornar 429
```

### CSRF Protection
```bash
# Sin token CSRF → debe fallar
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}'
# Respuesta: 403 Forbidden

# Con token CSRF → debe funcionar
```

### Security Headers
```bash
curl -I http://localhost:3000

# Verificar headers presentes:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# CSP: ...
```

### Password Validation
```typescript
validatePassword('weak');
// { valid: false, errors: [...], strength: 'weak' }

validatePassword('Admin123!');
// { valid: true, errors: [], strength: 'strong' }
```

---

## Auditoría y Logging

**Eventos registrados:**
- ✅ Intentos fallidos de login (rate limited)
- ✅ Validaciones QR (rate limited)
- ✅ Solicitudes rechazadas por CSRF
- ✅ Headers de seguridad aplicados
- ✅ Tokens generados y validados

**Tabla: `security_audit_log`**
```sql
CREATE TABLE security_audit_log (
  id VARCHAR(36) PRIMARY KEY,
  event_type VARCHAR(50),
  ip VARCHAR(50),
  status VARCHAR(20),
  details JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Checklist de Implementación

### Rate Limiting
- [x] Middleware de rate limiting
- [x] Limiter para login (5/15min)
- [x] Limiter para QR validation (100/1h)
- [x] Limiter para API general (1000/1min)
- [ ] Tests de rate limiting
- [ ] Persistencia en Redis (opcional)

### CSRF Protection
- [x] Generación de tokens CSRF
- [x] Validación de tokens
- [x] Componente CsrfForm
- [ ] Tests de CSRF
- [ ] Integración en todos los formularios

### Security Headers
- [x] X-Content-Type-Options
- [x] X-Frame-Options
- [x] X-XSS-Protection
- [x] CSP (Content Security Policy)
- [x] Referrer-Policy
- [ ] HSTS (si HTTPS disponible)
- [ ] SRI (Subresource Integrity)

### Password Validation
- [x] Validador de contraseñas
- [x] Componente visual
- [x] Generador de contraseñas seguras
- [ ] Tests de contraseñas
- [ ] Integración en signup/password change

### Input Sanitization
- [ ] Sanitización de strings
- [ ] Validación de MIME types
- [ ] Límites de tamaño de archivo
- [ ] Escape de HTML/SQL injection

### Encryption
- [ ] Encriptación de datos en tránsito (HTTPS)
- [ ] Encriptación de campos sensibles en BD
- [ ] Gestión de claves

---

## Próximas mejoras

### Corto plazo (v1.3.1)
- [ ] Integración de CSRF en todos los formularios
- [ ] Tests exhaustivos de rate limiting
- [ ] Logging de seguridad mejorado
- [ ] Dashboard de seguridad (eventos)

### Mediano plazo (v1.4.0)
- [ ] 2FA (Two-Factor Authentication)
- [ ] Session management mejorado
- [ ] IP whitelist/blacklist
- [ ] Detección de anomalías (ML)

### Largo plazo (v2.0.0)
- [ ] OAuth2 / OIDC
- [ ] Encriptación end-to-end
- [ ] Auditoría blockchain
- [ ] Zero-trust architecture

---

## Documentación de Referencia

- [OWASP Top 10](https://owasp.org/Top10/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)

---

**Versión:** 1.3.0  
**Fecha de inicio:** 2026-06-16  
**Estado:** En Implementación  
**Próxima revisión:** 2026-06-20
