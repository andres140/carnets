# SECURITY DEPLOYMENT GUIDE — SENA Carnés

**Versión:** 1.3.0  
**Ambiente:** Producción  
**Fecha:** 2026-06-16

---

## Pre-Despliegue (Checklist)

### 1. Configuración de Seguridad

- [ ] **Variables de entorno actualizadas:**
  ```env
  NODE_ENV=production
  NEXTAUTH_SECRET=<generar con: openssl rand -base64 32>
  QR_SIGNING_KEY=<generar con: openssl rand -base64 32>
  DATABASE_URL=<usar credenciales de producción>
  ```

- [ ] **Rate limiting activado:**
  ```env
  RATE_LIMIT_LOGIN=5:900           # 5 intentos en 15 min
  RATE_LIMIT_QR=100:3600           # 100 en 1 hora
  RATE_LIMIT_API=1000:60           # 1000 en 1 min
  ```

- [ ] **HTTPS obligatorio:** El servidor debe usar HTTPS (certificado SSL/TLS)

- [ ] **CORS configurado correctamente:**
  ```typescript
  // solo permitir origen conocido
  NEXTAUTH_URL=https://tudominio.com
  ```

### 2. Base de Datos

- [ ] Base de datos en producción configurada
- [ ] Credenciales seguras (no hardcodeadas)
- [ ] Backups automáticos configurados
- [ ] Tabla `security_audit_log` creada

### 3. Dependencias

- [ ] Actualizar todas las dependencias: `npm update`
- [ ] Auditoría de seguridad: `npm audit`
- [ ] Vulnerabilidades críticas resueltas

### 4. Compilación

- [ ] Build de producción exitoso: `npm run build`
- [ ] Sin warnings de TypeScript
- [ ] Tamaño de bundle verificado
- [ ] Source maps deshabilitados (en producción)

### 5. Tests

- [ ] Tests de seguridad pasados: `npm test`
- [ ] Tests de integración pasados
- [ ] Cobertura mínima del 80%

---

## Despliegue

### Opción 1: Vercel (Recomendado)

```bash
# 1. Conectar repositorio a Vercel
# 2. Configurar variables de entorno
# 3. Deploy automático en push a main
```

**Ventajas:**
- HTTPS automático
- CDN global
- DDoS protection incluido
- Escalado automático

### Opción 2: Docker

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**Build y run:**
```bash
docker build -t sena-carnes:1.3.0 .
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXTAUTH_SECRET=<secret> \
  -e DATABASE_URL=<url> \
  sena-carnes:1.3.0
```

### Opción 3: VPS (DigitalOcean, AWS, etc.)

```bash
# 1. SSH a servidor
ssh root@ip_servidor

# 2. Clonar repositorio
git clone https://github.com/...
cd app_carnets

# 3. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Instalar PM2
npm install -g pm2

# 5. Instalar dependencias
npm ci --production

# 6. Build
npm run build

# 7. Configurar PM2
pm2 start npm --name "sena-carnes" -- start
pm2 save

# 8. Instalar Nginx
sudo apt-get install -y nginx

# 9. Configurar Nginx (ver abajo)

# 10. SSL con Certbot
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com
```

---

## Configuración de Nginx

```nginx
# /etc/nginx/sites-available/sena-carnes
upstream sena_carnes {
  server localhost:3000;
}

server {
  listen 80;
  server_name tudominio.com www.tudominio.com;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name tudominio.com www.tudominio.com;

  # SSL
  ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;

  # Seguridad
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options "DENY" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;

  # Logging
  access_log /var/log/nginx/sena_carnes.log;
  error_log /var/log/nginx/sena_carnes_error.log;

  # Proxy
  location / {
    proxy_pass http://sena_carnes;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Rate limiting
  limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
  limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;

  location /api/auth/signin {
    limit_req zone=login burst=5 nodelay;
    proxy_pass http://sena_carnes;
  }

  location /api/ {
    limit_req zone=api burst=100 nodelay;
    proxy_pass http://sena_carnes;
  }
}
```

---

## Post-Despliegue

### Verificación

```bash
# 1. Verificar que el servidor está corriendo
curl https://tudominio.com

# 2. Verificar headers de seguridad
curl -I https://tudominio.com
# Verificar que incluye:
# - X-Frame-Options: DENY
# - X-Content-Type-Options: nosniff
# - Strict-Transport-Security

# 3. Verificar rate limiting
for i in {1..10}; do
  curl https://tudominio.com/api/validar?token=xxx
done
# Debe retornar 429 después de X intentos

# 4. Verificar logs
pm2 logs sena-carnes    # Para PM2
docker logs container_id  # Para Docker
tail -f /var/log/nginx/sena_carnes.log  # Para Nginx
```

### Monitoreo

```bash
# PM2
pm2 monit    # Monitor en tiempo real
pm2 logs     # Ver logs

# Nginx
sudo systemctl status nginx
tail -f /var/log/nginx/sena_carnes.log

# Alertas
# Configurar alertas para:
# - CPU > 80%
# - Memoria > 80%
# - Errores HTTP 5xx > 10
# - Rate limit hits > 100/min
```

### Backups

```bash
# Base de datos (MySQL)
mysqldump -u user -p database > backup_$(date +%Y%m%d).sql

# Automatizar con cron
# 0 3 * * * /usr/local/bin/backup_db.sh
```

---

## Seguridad Post-Despliegue

### 1. Certificado SSL

- ✅ Renovación automática (Certbot)
- ✅ HSTS activado (ver Nginx config)
- ✅ TLS 1.2+ solamente

### 2. Firewall

```bash
# UFW (Uncomplicated Firewall)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 3. Fallos de Login

```sql
-- Crear tabla de intentos fallidos
CREATE TABLE login_failures (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255),
  ip VARCHAR(50),
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX(email, ip)
);

-- Limpiar registros antiguos (30 días)
DELETE FROM login_failures WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

### 4. Auditoría Activa

```sql
-- Monitorear actividad sospechosa
SELECT COUNT(*) as failed_logins, email, ip
FROM login_failures
WHERE attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
GROUP BY email, ip
HAVING COUNT(*) >= 5;
```

---

## Escala y Performance

### Database Optimization

```sql
-- Índices recomendados
CREATE INDEX idx_carnet_qr ON carnets(qr_token);
CREATE INDEX idx_carnet_estado ON carnets(estado);
CREATE INDEX idx_usuario_email ON usuarios(email);
CREATE INDEX idx_auditoria_created ON auditoria(created_at);
```

### Caché (Redis)

```typescript
// Implementar caché de validación QR
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function validarQrCached(token: string) {
  const cached = await redis.get(`qr:${token}`);
  if (cached) return JSON.parse(cached);

  const result = await carnetService.validarQr(token);
  await redis.setex(`qr:${token}`, 3600, JSON.stringify(result));
  return result;
}
```

### CDN

- Usar CloudFlare o similar para assets estáticos
- Caché de imágenes (fotos de carnés)
- Compresión automática

---

## Rollback

Si hay problemas después del despliegue:

```bash
# Con Git
git rollback <commit-hash>
npm run build
npm start

# Con Docker
docker run -p 3000:3000 sena-carnes:1.2.0  # Versión anterior

# Con PM2
pm2 delete sena-carnes
git checkout v1.2.0
npm ci --production
npm run build
pm2 start ...
```

---

## Documentación de Referencia

- [Vercel Security](https://vercel.com/security)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [OWASP Production Readiness](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)

---

**Responsable:** DevOps Team  
**Última actualización:** 2026-06-16  
**Próxima revisión:** 2026-07-01
