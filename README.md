# SENA Carnés — Sistema de Gestión de Carnés Institucionales

Plataforma web para el **Servicio Nacional de Aprendizaje (SENA)** que administra usuarios, emite carnés con código QR, genera PDF, valida credenciales públicamente y ofrece dashboard, reportes, auditoría y configuración del sistema.

**Versión:** 1.0.0 RC1  
**Stack:** Node.js · Express · MySQL · HTML/Bootstrap 5

---

## Requisitos

| Componente | Versión |
|------------|---------|
| Node.js | 18+ (recomendado 20+) |
| MySQL | 8.0+ |
| npm | 9+ |
| Docker | Opcional (MySQL) |

---

## Inicio rápido

```bash
# 1. Clonar e instalar
git clone <repo-url> app_carnets
cd app_carnets
npm install

# 2. Configurar entorno
cp .env.example .env
# Editar DB_PASSWORD y secretos si es necesario

# 3. Base de datos (Docker opcional)
docker compose up -d
npm run setup:db

# 4. Iniciar servidor
npm run dev
```

Abrir [http://localhost:3000/login.html](http://localhost:3000/login.html)

**Credenciales demo (seed):**
- Admin: `admin@sena.edu.co` / `Admin123!`
- Coordinador: `coord@sena.edu.co` / `Coord123!`

---

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm start` | Servidor producción |
| `npm run setup:db` | Instalar esquema + seed + migraciones |
| `npm test` | Tests unitarios |
| `npm run verify:rc1` | Verificación integral (servidor activo) |

---

## Estructura del proyecto

```
backend/          API Express (routes → controllers → services → MySQL)
public/           Frontend HTML/CSS/JS + uploads
database/         schema.sql, seed.sql, migraciones
scripts/          Setup BD y verificación por sprint
tests/            Tests unitarios
src/              Legacy Next.js (no modificar)
```

---

## Módulos implementados

| Módulo | Estado | Página / API |
|--------|--------|--------------|
| Autenticación | ✅ | `/login.html`, `/api/auth` |
| Usuarios | ✅ | `/usuarios.html`, `/api/usuarios` |
| Organización | ✅ | `/organizacion.html`, `/api/regionales` |
| Carnés | ✅ | `/carnets.html`, `/api/carnets` |
| PDF / Impresión | ✅ | `/api/carnets/:id/pdf` |
| Validación QR | ✅ | `/validar.html`, `/api/validar/:token` |
| Dashboard | ✅ | `/dashboard.html`, `/api/dashboard` |
| Reportes | ✅ | `/reportes.html`, `/api/reportes` |
| Auditoría | ✅ | `/auditoria.html`, `/api/auditoria` |
| Configuración | ✅ | `/sistema.html`, `/api/configuracion` |
| Notificaciones | ✅ | Campana navbar, `/api/notificaciones` |
| Sesiones | ✅ | `/api/sesiones` |

---

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [INSTALL.md](./INSTALL.md) | Instalación paso a paso |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | Referencia API REST |
| [DATABASE_DOCUMENTATION.md](./DATABASE_DOCUMENTATION.md) | Modelo de datos |
| [USER_MANUAL.md](./USER_MANUAL.md) | Manual de usuario |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Despliegue producción |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitectura técnica |
| [VERSION.md](./VERSION.md) | Versión y limitaciones |
| [RELEASE_NOTES.md](./RELEASE_NOTES.md) | Historial de releases |
| [FINAL_PROJECT_REPORT.md](./FINAL_PROJECT_REPORT.md) | Informe final del proyecto |

---

## Seguridad

- Contraseñas bcrypt (12 rondas)
- SQL parametrizado en todas las consultas
- CSRF en mutaciones autenticadas
- Rate limiting (login, API, validación QR)
- Headers de seguridad (CSP, X-Frame-Options)
- Auditoría de acciones críticas

En producción, configure `SESSION_SECRET` y `QR_SIGNING_KEY` con valores aleatorios de ≥32 caracteres y `NODE_ENV=production`.

---

## Licencia

Proyecto académico SENA — uso institucional.
