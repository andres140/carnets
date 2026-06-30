# Sprint 2 — Informe del módulo de gestión de usuarios

**Fecha:** 2026-06-26  
**Objetivo:** Módulo profesional de gestión de usuarios listo para producción.  
**Alcance:** CRUD completo, búsqueda, filtros, paginación, validaciones, permisos, auditoría y UX.

---

## Resumen ejecutivo

El Sprint 2 completó el módulo de gestión de usuarios sobre la arquitectura consolidada en Sprint 1. Se reforzaron validaciones backend y frontend, permisos granulares por operación, auditoría con detalle de cambios, filtros combinables y experiencia de usuario con toasts y estados de carga.

**Verificación:** `node scripts/sprint2-verify-usuarios.js` → `SPRINT2_USUARIOS_OK`

---

## 1. Funcionalidades implementadas

### CRUD completo
- Crear, consultar, editar, desactivar (eliminación lógica) y reactivar usuarios.
- Sin eliminación física de registros.

### Tipos de usuario
- Soporte de los 6 tipos: Administrador, Coordinador, Funcionario, Instructor, Aprendiz, Contratista.
- `tipo_usuario` derivado del rol vía `ROL_TO_TIPO` en constants.

### Datos del usuario
- Nombre completo, documento, tipo de documento, correo, teléfono, fotografía, regional, centro, dependencia, estado y rol.
- Validación de FKs (regional → centro → dependencia).

### Fotografías
- Subida y reemplazo con multer.
- Validación MIME (JPEG, PNG, WebP) y tamaño máximo 5 MB en backend y frontend.
- Vista previa en formulario y avatar en listado.

### Búsqueda y filtros
- Búsqueda general (documento, nombre, correo).
- Filtros combinables: documento, nombre, correo, estado, tipo de usuario, rol, regional, centro, dependencia.

### Paginación
- Listado paginado (default 10, máx. 100 por página).

### Validaciones
- Documento único y correo único (409).
- Formato de correo, longitud de documento (5–50), campos obligatorios, teléfono, tipo de documento.
- Validación en `validate.js` (backend) y `usuarios.js` (frontend).

### Seguridad
- `requirePermission` por operación:
  - `usuarios.ver` — listar/consultar
  - `usuarios.crear` — crear
  - `usuarios.editar` — editar y reactivar
  - `usuarios.desactivar` — desactivar
- Coordinador limitado a su regional en listado, acceso y asignación al crear/editar.

### Auditoría
- CREAR, ACTUALIZAR, DESACTIVAR, REACTIVAR con usuario, fecha, IP y detalle JSON.
- ACTUALIZAR registra diff campo a campo (`antes` / `despues`).

### Experiencia de usuario
- Toasts de éxito/error (Bootstrap).
- Confirmación antes de desactivar/reactivar.
- Spinners en guardar y acciones de estado.
- Validación cliente antes de enviar formulario.

---

## 2. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `backend/constants/index.js` | Límites `DOCUMENTO`, `UPLOAD.MAX_SIZE_MB` |
| `backend/utils/validators.js` | Validadores documento, teléfono, foto |
| `backend/utils/diff.js` | **Nuevo** — diff para auditoría |
| `backend/middleware/validate.js` | Validaciones ampliadas |
| `backend/routes/users.routes.js` | `requirePermission` por ruta |
| `backend/controllers/users.controller.js` | Filtros nuevos, auditoría detallada |
| `backend/services/users.service.js` | Alcance coordinador en create/update |
| `backend/repositories/users.repository.js` | Filtros `tipoUsuario`, `dependenciaId`; fix LIMIT/OFFSET |
| `public/pages/usuarios.html` | Filtros UI, toasts, columna correo |
| `public/js/usuarios.js` | Filtros, validación cliente, toasts, UX |
| `public/css/usuarios.css` | Estilos toast |
| `scripts/sprint2-verify-usuarios.js` | **Nuevo** — verificación E2E API |

---

## 3. Cambios en base de datos

**Ninguno.** El schema existente (`usuarios`, `auditoria`, catálogos) cubre todos los requisitos del sprint.

---

## 4. Pruebas realizadas

| Prueba | Resultado |
|--------|-----------|
| Login admin | OK |
| Listar usuarios paginado | OK |
| Filtros combinados (estado + tipo) | OK |
| Crear usuario | OK |
| Duplicado documento/correo (409) | OK |
| Actualizar usuario | OK |
| Búsqueda por documento | OK |
| Desactivar usuario | OK |
| Reactivar usuario | OK |
| Documento corto (400) | OK |
| Sin autenticación (401) | OK |

```bash
npm run dev
node scripts/sprint2-verify-usuarios.js
```

---

## 5. Errores corregidos

| Error | Solución |
|-------|----------|
| `Incorrect arguments to mysqld_stmt_execute` en listado | LIMIT/OFFSET como enteros sanitizados en SQL (incompatibilidad mysql2 con placeholders) |
| Auditoría UPDATE solo guardaba email | `computeUserChanges` con diff completo |
| Rutas solo con `requireRole` | `requirePermission` por operación |
| Filtros incompletos en UI/API | `tipoUsuario`, `dependenciaId`, regional, centro en backend y frontend |
| Coordinador podía asignar otra regional | `assertCoordinatorAssignment` en service |
| Script verificación CSRF | Login alineado con patrón Sprint 0 |

---

## 6. Funcionalidades pendientes

- UI de auditoría (consulta de logs) — Sprint posterior.
- Recuperación de contraseña y 2FA (backend parcial, sin UI).
- Tests automatizados en framework (Jest) integrados al CI.
- Eliminación física de foto anterior al reemplazar (optimización de almacenamiento).
- Rol Instructor con alcance por centro en mutaciones (solo listado hoy).

---

## 7. Riesgos detectados

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Rate limit en login bloquea pruebas rápidas | Medio | Esperar entre logins o ajustar límite en desarrollo |
| README describe stack Next.js | Bajo | Actualizar en sprint de documentación |
| Fotos huérfanas al reemplazar | Bajo | Job de limpieza futuro |
| `public/carnets.html` mock sin API | Ninguno en usuarios | Sprint 3 |

---

## 8. Recomendaciones para Sprint 3 (Carnés)

1. Replicar patrón Repository + Service + permisos granulares para carnés.
2. Reutilizar upload de fotos de usuarios al generar plantilla de carné.
3. Implementar generación de código único (`REG01-2026-000001`) en service dedicado.
4. Conectar `public/js/carnets.js` a API real y retirar mock de raíz.
5. Auditoría en emisión, revocación y suspensión de carnés.
6. Mantener script de verificación E2E por módulo (`sprint3-verify-carnets.js`).

---

## Condición de cierre

- Módulo de usuarios funcional, probado y documentado.
- **Esperando aprobación del usuario antes de iniciar Sprint 3.**
