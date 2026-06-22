# UX IMPROVEMENTS — SENA Carnés v1.4.0

**Versión:** 1.4.0  
**Tipo:** User Experience Enhancement  
**Status:** 🚀 En Implementación

---

## Descripción General

Mejoras de experiencia de usuario centradas en facilitar operaciones críticas:

1. **Recuperación de Contraseña** — Reset automático por email
2. **Notificaciones por Email** — Alertas de eventos importantes
3. **Two-Factor Authentication (2FA)** — Seguridad adicional
4. **Mejora de Dashboard** — Interfaz mejorada
5. **Mobile Responsiveness** — Optimización para móviles

---

## 1. Recuperación de Contraseña

### Flujo

```
Usuario olvida contraseña
    ↓
Click "Olvidé mi contraseña"
    ↓
Ingresa email
    ↓
Sistema envía email con link reset (válido 30 min)
    ↓
Usuario hace click en link
    ↓
Página de reset con validador de contraseña
    ↓
Nueva contraseña ingresada
    ↓
Contraseña actualizada ✓
```

### Archivos a crear

- `src/app/(auth)/forgot-password/page.tsx` — Página de solicitud
- `src/app/(auth)/reset-password/[token]/page.tsx` — Página de reset
- `src/services/auth.service.ts` — Lógica de recuperación
- `src/lib/email.ts` — Envío de emails
- Tests de recuperación

### Seguridad

- Email confirmado (token en BD)
- Link válido por 30 minutos
- Token de un solo uso
- IP tracking opcional
- Auditoría de reset

---

## 2. Notificaciones por Email

### Tipos de notificaciones

```
[Evento] → [Email]
─────────────────────
Carné creado → "Tu carné ha sido creado"
Carné vencido → "Tu carné vence en 7 días"
Carné suspendido → "Tu carné ha sido suspendido"
Login sospechoso → "Se detectó login desde IP nueva"
Cambio de contraseña → "Tu contraseña fue cambiada"
Reset solicitado → "Solicitud de reset de contraseña"
```

### Archivos a crear

- `src/lib/email-templates.ts` — Templates de emails
- `src/lib/nodemailer-config.ts` — Configuración SMTP
- `src/services/notification.service.ts` — Envío de notificaciones

### Configuración

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tuapp@gmail.com
SMTP_PASS=<app-password>
SMTP_FROM=noreply@tudominio.com
```

---

## 3. Two-Factor Authentication (2FA)

### Métodos soportados

1. **TOTP (Time-based One-Time Password):**
   - Usar Google Authenticator
   - Microsoft Authenticator
   - Authy

2. **Email:** Código de 6 dígitos

3. **SMS:** (Futuro con Twilio)

### Flujo

```
Login normal (email + contraseña)
    ↓
Solicitar 2FA (QR o código)
    ↓
Usuario escanea QR o ingresa código
    ↓
Verificar TOTP
    ↓
Acceso concedido
```

### Archivos a crear

- `src/lib/2fa.ts` — Lógica TOTP
- `src/components/auth/TwoFactorSetup.tsx` — Setup
- `src/components/auth/TwoFactorVerify.tsx` — Verificación
- `src/app/api/auth/2fa/setup` — Endpoint setup
- `src/app/api/auth/2fa/verify` — Endpoint verify

---

## 4. Mejora de Dashboard

### Nuevos componentes

```
┌────────────────────────────────────────┐
│ Dashboard Principal                     │
├────────────────────────────────────────┤
│ Estadísticas en tiempo real             │
│ • Carnés creados hoy                    │
│ • Validaciones QR últimas 24h           │
│ • Usuarios activos                      │
├────────────────────────────────────────┤
│ Alertas urgentes                        │
│ • Carnés por vencer (7 días)            │
│ • Intentos fallidos de login            │
│ • Cambios de estado pendientes          │
├────────────────────────────────────────┤
│ Acceso rápido                           │
│ • Crear carné (botón destacado)         │
│ • Generar reporte                       │
│ • Descargar PDF carné                   │
└────────────────────────────────────────┘
```

### Archivos a crear

- `src/components/dashboard/QuickStats.tsx`
- `src/components/dashboard/RecentActivity.tsx`
- `src/components/dashboard/Alerts.tsx`
- `src/components/dashboard/QuickActions.tsx`

---

## 5. Mobile Responsiveness

### Checklist

- [ ] Login page responsive
- [ ] Dashboard responsive
- [ ] Listado de usuarios responsive
- [ ] Validación QR responsive
- [ ] Modales responsive
- [ ] Formularios responsive

### CSS Framework

Usar Tailwind CSS con:
```typescript
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* contenido */}
</div>
```

---

## Estimación de Esfuerzo

| Funcionalidad | Horas | Prioridad |
|---------------|-------|-----------|
| Recuperación de contraseña | 8 | Alta ⭐⭐⭐ |
| Notificaciones por email | 6 | Alta ⭐⭐⭐ |
| 2FA | 12 | Media ⭐⭐ |
| Dashboard mejorado | 4 | Media ⭐⭐ |
| Mobile responsiveness | 6 | Media ⭐⭐ |
| **Total** | **36 horas** | - |

---

## Timeline Propuesto

**Semana 1:** Recuperación de contraseña + Notificaciones  
**Semana 2:** 2FA + Dashboard mejorado  
**Semana 3:** Mobile responsiveness + Testing  
**Semana 4:** Refinamiento + Documentación

---

## Checklist de Implementación

### Recuperación de Contraseña
- [ ] Página de solicitud
- [ ] Endpoint de reset
- [ ] Template de email
- [ ] Validación de token
- [ ] Tests
- [ ] Documentación

### Notificaciones
- [ ] Configuración SMTP
- [ ] Templates de email
- [ ] Envío automático
- [ ] Auditoría de emails
- [ ] Unsubscribe option
- [ ] Tests

### 2FA
- [ ] Setup TOTP
- [ ] QR generation
- [ ] Verificación
- [ ] Backup codes
- [ ] Recovery methods
- [ ] Tests

### Dashboard
- [ ] Estadísticas
- [ ] Alertas
- [ ] Acciones rápidas
- [ ] Gráficos
- [ ] Tests

### Mobile
- [ ] Viewport meta tag
- [ ] Responsive design
- [ ] Touch interactions
- [ ] Performance
- [ ] Tests

---

## Variables de Entorno Necesarias

```env
# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# 2FA
TWO_FACTOR_WINDOW=1            # Ventana de tolerancia
TWO_FACTOR_ENABLED=true        # Activar 2FA

# Recuperación
PASSWORD_RESET_TIMEOUT=1800000  # 30 minutos
```

---

## Próximas versiones

**v1.5.0:** API improvements + Webhooks  
**v1.6.0:** Analytics + Reportes avanzados  
**v2.0.0:** Mobile app (React Native)

---

**Versión:** 1.4.0  
**Inicio:** 2026-06-20  
**Status:** Planificado
