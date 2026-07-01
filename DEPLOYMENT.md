# DEPLOYMENT.md — Despliegue en Producción SENA Carnés v1.0.0

---

## 1. Requisitos de producción

| Componente | Especificación mínima |
|------------|----------------------|
| SO | Linux (Ubuntu 22.04 LTS recomendado) |
| Node.js | 20 LTS |
| MySQL | 8.0+ |
| RAM | 2 GB (4 GB si PDF frecuente) |
| Disco | 20 GB + espacio para uploads |
| HTTPS | Certificado TLS obligatorio |

---

## 2. Variables de entorno (producción)

```bash
NODE_ENV=production
PORT=3000
APP_URL=https://carnets.sena.edu.co

DB_HOST=mysql.internal
DB_PORT=3306
DB_USER=carnets_app
DB_PASSWORD=<contraseña-fuerte>
DB_NAME=sena_carnets

SESSION_SECRET=<64-chars-aleatorios>
QR_SIGNING_KEY=<64-chars-aleatorios>
SESSION_MAX_AGE=28800000

UPLOAD_DIR=/var/app/uploads
UPLOAD_MAX_MB=5
```

> El servidor **falla al arrancar** si `SESSION_SECRET` o `QR_SIGNING_KEY` tienen menos de 32 caracteres en producción.

Generar secretos:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 3. Docker — MySQL

```yaml
# docker-compose.yml (incluido en el repo)
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: <root-pass>
      MYSQL_DATABASE: sena_carnets
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
```

```bash
docker compose up -d
npm run setup:db
```

---

## 4. Despliegue de la aplicación

### Instalación

```bash
git clone <repo> /var/www/carnets
cd /var/www/carnets
npm ci --omit=dev
cp .env.example .env
# Editar .env con valores de producción
npm run setup:db
```

### Process manager (PM2)

```bash
npm install -g pm2
pm2 start backend/server.js --name sena-carnets
pm2 save
pm2 startup
```

### Reverse proxy (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name carnets.sena.edu.co;

    ssl_certificate     /etc/ssl/certs/carnets.crt;
    ssl_certificate_key /etc/ssl/private/carnets.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 10M;
}
```

En `backend/app.js`, configurar `trust proxy` si se usa Nginx:
```javascript
app.set('trust proxy', 1);
```

---

## 5. Almacenamiento

| Directorio | Contenido | Backup |
|------------|-----------|--------|
| `public/uploads/` | Fotos de usuarios, logos | Sí — diario |
| `public/uploads/carnets/` | PDFs generados | Sí — diario |
| MySQL `sena_carnets` | Datos transaccionales | Sí — diario |

---

## 6. Backup

### Base de datos

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M)
mysqldump -u carnets_app -p sena_carnets | gzip > /backups/db_$DATE.sql.gz
find /backups -name "db_*.sql.gz" -mtime +30 -delete
```

Cron: `0 2 * * * /opt/scripts/backup-db.sh`

### Archivos

```bash
tar -czf /backups/uploads_$DATE.tar.gz /var/app/uploads/
```

---

## 7. Restauración

```bash
# BD
gunzip < backup.sql.gz | mysql -u root -p sena_carnets

# Uploads
tar -xzf uploads_backup.tar.gz -C /var/app/
```

---

## 8. Actualización del sistema

```bash
cd /var/www/carnets
git pull origin main
npm ci --omit=dev
node scripts/setup-db.js   # Aplica migraciones incrementales
pm2 restart sena-carnets
npm run verify:rc1         # Verificación post-deploy
```

---

## 9. Seguridad en producción

- [ ] `NODE_ENV=production`
- [ ] Secretos únicos ≥32 caracteres
- [ ] HTTPS con HSTS
- [ ] MySQL no expuesto públicamente
- [ ] Usuario MySQL con permisos mínimos
- [ ] Firewall: solo 443/80 públicos
- [ ] Credenciales demo deshabilitadas o seed no ejecutado
- [ ] Logs de auditoría revisados periódicamente
- [ ] Rate limiting activo (5 login/15min en prod)

---

## 10. Limitaciones conocidas v1.0.0

- Sesiones en memoria (`express-session` default) — no escala horizontalmente
- Revocación de sesiones parcialmente en memoria
- 2FA implementado pero no obligatorio en login
- Email requiere configuración SMTP manual
- Carga masiva de carnés no implementada

### Mejoras recomendadas v2.0
- Redis para sesiones y rate limiting
- Store MySQL para sesiones (`connect-mysql`)
- 2FA obligatorio para administradores
- SMTP integrado con plantillas
- CI/CD con GitHub Actions

---

## 11. Monitoreo

- Health check: `GET /api/health`
- Panel interno: `/sistema.html` → Monitoreo
- Logs PM2: `pm2 logs sena-carnets`
- Alertas MySQL: revisar latencia en panel de monitoreo
