# Guía de Pruebas — Módulo QR y Validación Pública

## Descripción General

Este documento proporciona pasos para probar manualmente la funcionalidad completa del módulo QR y validación pública.

## Configuración previa

### 1. Base de datos

Asegúrate de tener las migraciones ejecutadas:

```bash
npx prisma migrate dev
npx prisma db seed
```

Verifica que existan las tablas:
- `carnets` (con campo `qrToken`)
- `validacionQr` (para auditoría)

### 2. Variables de entorno

Verifica en `.env`:

```env
NODE_ENV=development
DATABASE_URL=mysql://root:password@localhost:3306/sena_carnes
QR_SIGNING_KEY=dev-qr-key
NEXTAUTH_SECRET=dev-secret
NEXTAUTH_URL=http://localhost:3000
```

### 3. Iniciar aplicación

```bash
npm install
npm run dev
```

La app estará en `http://localhost:3000`

## Escenarios de prueba

### Escenario 1: Generación automática de QR al crear carné

**Pasos:**

1. Login como admin:
   - Email: `admin@sena.edu.co`
   - Contraseña: `Admin123!`

2. Navegar a **Gestión de Carnés**

3. Crear un nuevo carné (individual o masivo)

4. Verificar en BD:
   ```sql
   SELECT id, codigo_unico, qr_token, estado FROM carnets LIMIT 1;
   ```

**Resultado esperado:**
- Campo `qr_token` poblado (formato: `{random}.{signature}`)
- Campo `codigo_unico` generado (ej: `REG01-2026-000001`)
- Sin errores en consola

---

### Escenario 2: Validación con carné activo

**Pasos:**

1. Obtén un `qrToken` válido de BD:
   ```sql
   SELECT qr_token FROM carnets WHERE estado = 'ACTIVO' LIMIT 1;
   ```
   Copia el valor (ej: `abc123.def456`)

2. Abre en navegador incógnito (sin autenticación):
   ```
   http://localhost:3000/validar
   ```

3. En la sección "Ingresar token manualmente", pega el token

4. Haz clic en "Validar"

**Resultado esperado:**
- Tarjeta verde con "Activo"
- Información visible:
  - ✅ Foto del usuario
  - ✅ Nombre completo
  - ✅ Documento
  - ✅ Tipo de usuario
  - ✅ Centro de formación
  - ✅ Regional
  - ✅ Fecha de expedición
  - ✅ Fecha de vencimiento
- Información NO visible:
  - ❌ Email
  - ❌ Teléfono
  - ❌ Contraseña

---

### Escenario 3: Validación con carné vencido

**Pasos:**

1. Crea un carné manual con fecha de vencimiento en el pasado:
   ```sql
   INSERT INTO carnets (..., fecha_vencimiento, estado)
   VALUES (..., DATE_SUB(NOW(), INTERVAL 1 DAY), 'ACTIVO');
   ```

2. Obtén su `qr_token`

3. Intenta validar en `/validar`

**Resultado esperado:**
- Tarjeta roja con "Vencido"
- Mensaje: "Carné no válido. Estado: VENCIDO"
- Datos del carné aún visibles (pero con estado inválido)

---

### Escenario 4: Validación con carné suspendido

**Pasos:**

1. En dashboard, busca un carné activo

2. Haz clic en el botón "Suspender" (acción disponible para admins)

3. En `/validar`, intenta validar ese carné

**Resultado esperado:**
- Tarjeta naranja con "Suspendido"
- Mensaje: "Carné no válido. Estado: SUSPENDIDO"

---

### Escenario 5: Validación con carné revocado

**Pasos:**

1. En dashboard, busca un carné activo

2. Haz clic en el botón "Revocar"

3. En `/validar`, intenta validar ese carné

**Resultado esperado:**
- Tarjeta gris con "Revocado"
- Mensaje: "Carné no válido. Estado: REVOCADO"

---

### Escenario 6: Token inexistente o inválido

**Pasos:**

1. En `/validar`, intenta con un token inexistente:
   ```
   invalid.token
   ```

2. Haz clic en "Validar"

**Resultado esperado:**
- Mensaje de error: "Carné no encontrado."
- Tarjeta roja indicando error
- SIN datos del carné

---

### Escenario 7: Token corrupto

**Pasos:**

1. En `/validar`, intenta con un token mal formado:
   ```
   notokenformat
   ```

2. Haz clic en "Validar"

**Resultado esperado:**
- Mensaje de error: "Token QR inválido o corrupto."
- Tarjeta roja indicando error

---

### Escenario 8: Escaneo QR con cámara

**Pasos:**

1. Genera un carné y obtén su código QR (si tu aplicación lo genera en PDF)

2. En `/validar`, haz clic en "Escanear código QR"

3. Permite acceso a la cámara

4. Escanea el código QR

**Resultado esperado:**
- Token se extrae automáticamente
- Validación ocurre automáticamente
- Se muestra resultado de validación

---

### Escenario 9: Auditoría de validaciones

**Pasos:**

1. Realiza varias validaciones como en Escenario 2

2. Verifica la auditoría en BD:
   ```sql
   SELECT carnet_id, resultado, ip, created_at 
   FROM validacion_qr 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

**Resultado esperado:**
- Cada validación registrada con:
  - ID del carné
  - Resultado (valido, estado, no_encontrado, etc.)
  - IP del cliente
  - Timestamp

---

### Escenario 10: Persistencia de QR con cambios de usuario

**Pasos:**

1. Obtén un carné y su QR token

2. Como admin, edita el usuario (cambia nombre, teléfono, etc.)

3. Intenta validar el QR nuevamente en `/validar`

**Resultado esperado:**
- QR sigue siendo válido
- Información mostrada es actualizada (nombre nuevo)
- Token no cambia

---

## Pruebas de seguridad

### 1. Información sensible no expuesta

Ejecuta una validación exitosa:

```bash
curl "http://localhost:3000/api/validar?token=<token_valido>"
```

Verifica que la respuesta JSON:
- ✅ Incluya: codigoUnico, nombreCompleto, documento, estado
- ✅ Incluya: centro, regional, foto, fechas
- ❌ NO incluya: email, teléfono, passwordHash
- ❌ NO incluya: usuarioId, createdAt (internas del sistema)

### 2. Rate limiting

En producción, es recomendable agregar rate limiting:

```typescript
// En src/app/api/validar/[codigo]/route.ts
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h'),
});

const { success } = await ratelimit.limit(ip);
if (!success) return new Response('Rate limited', { status: 429 });
```

### 3. Token tampering

Intenta modificar un token válido:

```
Original: abc123.def456
Modificado: abc124.def456
```

**Resultado esperado:**
- "Token QR inválido o corrupto"
- NO debe validarse

---

## Pruebas de rendimiento

### 1. Tiempo de validación

Mide el tiempo de respuesta:

```bash
time curl "http://localhost:3000/api/validar?token=<token>"
```

**Esperado:** < 100ms

### 2. Carga de foto

Verifica que la foto se carga correctamente:

1. Abre DevTools (F12)
2. Valida un carné
3. En Network, busca request a `fotoUrl`
4. Verifica que la imagen se carga

**Resultado esperado:**
- Imagen se carga (200 OK)
- Tamaño < 500KB (optimizado)

---

## Checklist de verificación

- [ ] Base de datos con todas las tablas
- [ ] Variables de entorno configuradas
- [ ] Generación automática de QR al crear carné
- [ ] Validación exitosa con carné activo
- [ ] Detección de carné vencido
- [ ] Detección de carné suspendido
- [ ] Detección de carné revocado
- [ ] Manejo de token inexistente
- [ ] Manejo de token corrupto
- [ ] Escaneo QR con cámara funciona
- [ ] Auditoría registra validaciones
- [ ] QR persiste con cambios de usuario
- [ ] Información sensible no se expone
- [ ] Token tampering es rechazado
- [ ] Rendimiento aceptable (< 100ms)
- [ ] Fotos se cargan correctamente

---

## Troubleshooting

### Error: "qr_token column not found"

**Causa:** Migraciones incompletas

**Solución:**
```bash
npx prisma migrate dev
```

### Error: "QR_SIGNING_KEY not defined"

**Causa:** Variable de entorno faltante

**Solución:**
```bash
# Agregar a .env
QR_SIGNING_KEY=dev-qr-key
```

### Token válido retorna "no encontrado"

**Causa:** Carné no existe en BD

**Solución:**
```sql
SELECT COUNT(*) FROM carnets WHERE qr_token = '<token>';
```

### Foto no se carga en validación

**Causa:** Ruta de foto incorrecta o archivo no existe

**Solución:**
1. Verifica en BD: `SELECT foto_url FROM usuarios WHERE ...`
2. Verifica que archivo existe en `/public/uploads/`
3. Recrea el carné con foto

### Escaneo QR no funciona

**Causa:** Cámara no disponible o permisos denegados

**Solución:**
1. Usar HTTPS o localhost para acceso a cámara
2. Permitir permisos en el navegador
3. Usar entrada manual de token como fallback

---

## Contacto y reporte de issues

Si encuentras problemas durante las pruebas:

1. Verifica el console.log en DevTools (F12)
2. Revisa logs del servidor en terminal
3. Consulta las migraciones de Prisma
4. Valida que BD esté sincronizada con schema.prisma
