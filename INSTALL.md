# INSTALL.md — Instalación de SENA Carnés v1.0.0

Guía para instalar el sistema desde cero en un entorno local o de pruebas.

---

## 1. Requisitos previos

- **Node.js** 18 o superior ([nodejs.org](https://nodejs.org))
- **MySQL** 8.0+ o **Docker Desktop** (para MySQL en contenedor)
- **Git** (para clonar el repositorio)
- Puerto **3000** libre (servidor HTTP)
- Puerto **3306** libre (MySQL)

---

## 2. Clonar el repositorio

```bash
git clone <url-del-repositorio> app_carnets
cd app_carnets
```

---

## 3. Instalar dependencias

```bash
npm install
```

Dependencias principales: `express`, `mysql2`, `bcryptjs`, `express-session`, `multer`, `puppeteer`, `qrcode`, `xlsx`.

---

## 4. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` según su entorno:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto HTTP del servidor | `3000` |
| `APP_URL` | URL base de la aplicación | `http://localhost:3000` |
| `NODE_ENV` | Entorno | `development` |
| `DB_HOST` | Host MySQL | `localhost` |
| `DB_PORT` | Puerto MySQL | `3306` |
| `DB_USER` | Usuario MySQL | `root` |
| `DB_PASSWORD` | Contraseña MySQL | `root` |
| `DB_NAME` | Nombre de la BD | `sena_carnets` |
| `SESSION_SECRET` | Secreto de sesión (≥32 chars en prod) | Ver `.env.example` |
| `QR_SIGNING_KEY` | Clave firma QR (≥32 chars en prod) | Ver `.env.example` |

> **Importante:** `PORT` y `DB_PORT` deben ser distintos (3000 vs 3306).

---

## 5. Base de datos

### Opción A — Docker (recomendado)

```bash
docker compose up -d
```

Esperar a que MySQL esté listo (~15 segundos).

### Opción B — MySQL local

Crear manualmente la base de datos o dejar que el script la cree.

### Instalación automática (schema + seed + migraciones)

```bash
npm run setup:db
```

Salida esperada: `SETUP_DB_OK`

Este comando ejecuta:
1. `database/schema.sql` — tablas base
2. `database/seed.sql` — roles, permisos, usuarios demo, catálogos
3. Migraciones incrementales (Sprints 3–9, seguridad, 2FA)

### Instalación manual (alternativa)

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
node scripts/setup-db.js
```

---

## 6. Iniciar el servidor

```bash
npm run dev
```

Salida esperada:
```
✅ MySQL conectado
🚀 Servidor en http://localhost:3000
```

---

## 7. Primer acceso

1. Abrir [http://localhost:3000/login.html](http://localhost:3000/login.html)
2. Iniciar sesión con:
   - **Email:** `admin@sena.edu.co`
   - **Contraseña:** `Admin123!`
3. Será redirigido al dashboard ejecutivo

---

## 8. Verificación de instalación

Con el servidor en ejecución:

```bash
npm run verify:rc1
```

Ejecuta 9 suites de prueba (auth, usuarios, organización, carnés, PDF, QR, dashboard, reportes, sistema).

Salida esperada: `RC1_VERIFY_OK`

Tests unitarios:

```bash
npm test
```

---

## 9. Solución de problemas

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| `ECONNREFUSED` MySQL | MySQL no iniciado | `docker compose up -d` o iniciar servicio MySQL |
| `Access denied` | Credenciales incorrectas | Verificar `DB_USER` / `DB_PASSWORD` en `.env` |
| Puerto 3000 en uso | Otro proceso ocupa el puerto | Cambiar `PORT` en `.env` o detener el proceso |
| `Table doesn't exist` | BD sin migraciones | Ejecutar `npm run setup:db` |
| Login falla 401 | Seed no aplicado | Re-ejecutar `npm run setup:db` |
| Login falla 429 | Rate limit agotado | Reiniciar servidor (`npm run dev`) |
| PDF no genera | Puppeteer sin Chromium | Reinstalar dependencias; en Linux instalar libs de Chrome |
| CSRF error en API | Token ausente | Obtener token: `GET /api/auth/csrf-token` con cookies |

---

## 10. Estructura post-instalación

```
app_carnets/
├── .env                 ← Configuración local (no commitear)
├── backend/             ← API Express
├── public/              ← Frontend + uploads
├── database/            ← SQL schema y seed
├── scripts/             ← Setup y verificación
└── node_modules/        ← Dependencias npm
```

---

## 11. Próximos pasos

- Consultar [USER_MANUAL.md](./USER_MANUAL.md) para uso del sistema
- Consultar [DEPLOYMENT.md](./DEPLOYMENT.md) para producción
- Consultar [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) para integración
