# USER_MANUAL.md — Manual de Usuario SENA Carnés v1.0.0

Guía de uso del sistema para administradores, coordinadores e instructores.

---

## 1. Acceso al sistema

1. Abrir la URL del servidor (ej. `http://localhost:3000/login.html`)
2. Ingresar **correo institucional** y **contraseña**
3. Tras login exitoso, accede al **Dashboard ejecutivo**

### Roles principales

| Rol | Alcance | Capacidades |
|-----|---------|-------------|
| **Administrador** | Nacional | Todos los módulos, configuración, sesiones |
| **Coordinador** | Regional | Usuarios, carnés y reportes de su regional |
| **Instructor** | Centro | Usuarios y carnés de su centro |
| **Aprendiz / Contratista** | Personal | Ver su propio carné y actividad |

---

## 2. Dashboard

Pantalla principal con:
- **Indicadores clave:** usuarios, carnés activos/vencidos, validaciones QR
- **Gráficas:** distribución por estado, regional, emisiones
- **Alertas:** carnés próximos a vencer, usuarios sin foto
- **Accesos rápidos:** crear usuario, emitir carné, validar QR, reportes
- **Actividad reciente:** últimas acciones del sistema

El badge superior indica el alcance: *Vista nacional*, *Vista regional*, etc.

---

## 3. Gestión de usuarios

**Ruta:** `/usuarios.html` · Permiso: `usuarios.ver`

### Listar y buscar
- Filtros por nombre, documento, estado, tipo, regional, centro
- Paginación automática

### Crear usuario
1. Clic en **Nuevo usuario**
2. Completar datos obligatorios: documento, nombres, email, rol, regional/centro
3. Subir **fotografía** (JPEG/PNG/WebP, máx. 5 MB)
4. Guardar — se genera contraseña temporal o se define en el formulario

### Editar / desactivar
- **Editar:** modificar datos, cambiar foto, reasignar centro
- **Desactivar:** impide login y emisión de carnés
- **Reactivar:** restaura acceso

> Un usuario **inactivo** o **sin foto** no puede recibir carné.

---

## 4. Organización

**Ruta:** `/organizacion.html`

Gestión de estructura institucional:
- **Regionales** — divisiones territoriales
- **Centros de formación** — vinculados a una regional
- **Dependencias** — áreas dentro del centro
- **Roles y permisos** — asignación granular de capacidades

---

## 5. Carnés institucionales

**Ruta:** `/carnets.html`

### Emitir carné
1. Buscar usuario activo con fotografía
2. Clic en **Emitir carné**
3. Confirmar — se genera código único, QR y PDF

### Estados del carné

| Estado | Significado |
|--------|-------------|
| ACTIVO | Vigente y válido |
| VENCIDO | Pasó fecha de vencimiento |
| SUSPENDIDO | Temporalmente inválido |
| REVOCADO | Cancelado permanentemente |

### Acciones disponibles
- **Renovar** — extiende vigencia
- **Suspender / Reactivar** — control temporal
- **Revocar** — cancelación definitiva
- **Vista previa** — carné en pantalla
- **Descargar PDF** — archivo para impresión
- **Reimprimir** — registra nueva impresión en auditoría

---

## 6. Validación QR (público)

**Ruta:** `/validar.html` — **no requiere login**

1. Escanear código QR del carné con cámara o lector
2. O ingresar manualmente el token/código
3. El sistema muestra:
   - Validez (vigente / no vigente)
   - Nombre parcial y centro
   - Fecha de vencimiento

Ideal para portería, eventos y control de acceso.

---

## 7. Reportes

**Ruta:** `/reportes.html` · Permiso: `reportes.ver`

Cinco secciones:
1. **Resumen** — KPIs y gráficas
2. **Usuarios** — listado filtrable
3. **Carnés** — por estado, regional, fechas
4. **Validaciones QR** — historial de escaneos
5. **Búsqueda avanzada** — filtros combinados

### Exportación
Formatos: **CSV**, **Excel (.xlsx)**, **PDF**
- Clic en botón Exportar del reporte activo
- Se registra en auditoría y genera notificación

---

## 8. Auditoría

**Ruta:** `/auditoria.html` · Permiso: `auditoria.ver`

Consulta la bitácora completa del sistema:
- Filtros: acción, módulo, resultado, fechas, IP, búsqueda libre
- Cada registro muestra: usuario, rol, fecha, IP, navegador, resultado

Panel de **seguridad** (admin): intentos fallidos, actividad sospechosa.

---

## 9. Configuración del sistema

**Ruta:** `/sistema.html` · Permiso: `config.gestionar`

### Pestaña Configuración
- Nombre de la institución
- Logo institucional (subir imagen)
- Duración de sesión (horas)
- Vigencia predeterminada de carnés
- Formato de numeración
- Tamaño máximo de fotos
- Idioma y zona horaria

### Pestaña Sesiones
- Ver sesiones activas (usuario, dispositivo, IP)
- **Cerrar sesión** remotamente

### Pestaña Monitoreo
- Estado MySQL, almacenamiento, alertas de seguridad

### Pestaña Notificaciones
- Alertas del sistema: vencimientos, exportaciones, cambios de config

---

## 10. Notificaciones (campana)

Icono de campana en la barra superior:
- Muestra contador de no leídas
- Clic para ver últimas notificaciones
- Enlace a panel completo en Sistema

---

## 11. Recuperación de contraseña

1. En login, clic en **¿Olvidó su contraseña?**
2. Ingresar email registrado
3. Si SMTP está configurado, recibirá enlace de reset
4. En desarrollo, el enlace puede aparecer en consola del servidor

---

## 12. Buenas prácticas

- Mantener fotografías actualizadas y con fondo claro
- Revocar carnés de usuarios retirados
- Revisar auditoría semanalmente
- No compartir credenciales de administrador
- Realizar backup de BD y uploads periódicamente

---

## 13. Soporte

Consultar [INSTALL.md](./INSTALL.md) para problemas de instalación y [DEPLOYMENT.md](./DEPLOYMENT.md) para producción.
