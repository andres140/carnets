# Informe UI/UX — Rediseño SENA Carnés

**Fecha:** Julio 2026  
**Alcance:** Rediseño visual completo sin cambios de lógica de negocio ni backend  
**Estado:** Completado  

---

## 1. Resumen ejecutivo

Se transformó la interfaz del sistema de gestión de carnés institucionales del SENA hacia un diseño profesional, institucional y consistente. Se adoptó el verde `#39A900` como color principal, tipografía Inter, layout con sidebar fija y sistema CSS modular escalable.

**No se modificó:** lógica de API, controladores, servicios, repositorios ni flujos JavaScript de negocio (CRUD, auth, carnés, reportes, etc.).

---

## 2. Pantallas rediseñadas

| Pantalla | Ruta | Cambios principales |
|----------|------|---------------------|
| Landing | `/` (`index.html`) | Tarjeta institucional, indicador de servidor, botones modernos |
| Login | `/login.html` | Fondo claro con patrón sutil, tarjeta elevada, animación fade-in |
| Dashboard | `/dashboard.html` | Shell sidebar, hero verde, cards y gráficas con paleta SENA |
| Usuarios | `/usuarios.html` | Layout unificado, tablas y formularios rediseñados |
| Organización | `/organizacion.html` | Tabs y paneles con nuevo sistema visual |
| Carnés | `/carnets.html` | Preview de carné verde institucional, sombras premium |
| Reportes | `/reportes.html` | Hero, KPIs, filtros y tablas modernizados |
| Auditoría | `/auditoria.html` | Filtros y tabla de eventos consistentes |
| Sistema | `/sistema.html` | Configuración, sesiones, monitoreo con tabs renovados |
| Validar QR | `/validar.html` | Pantalla pública limpia, resultado con badges de estado |
| Impresión carné | `/carnets-imprimir.html` | Sin cambios (vista de impresión) |

---

## 3. Componentes actualizados

- **Layout:** Sidebar fija, header sticky, footer discreto, overlay móvil
- **Botones:** Primario verde, outline, iconos Bootstrap
- **Formularios:** Inputs redondeados, focus verde, labels consistentes
- **Tablas:** Striped, hover, encabezados uppercase, paginación moderna
- **Cards:** Sombras suaves, hover con elevación
- **Modales:** Bordes xl, header/footer diferenciados
- **Alertas:** Fondos tintados semánticos
- **Badges:** Estados de carné y usuario unificados
- **Tabs / acordeones:** Indicador activo verde
- **Dropdowns:** Notificaciones con estilo header claro
- **Breadcrumbs:** En header de cada módulo
- **Carné preview:** Gradiente verde, borde y sombra profesional
- **Skeleton:** Clases preparadas para cargas futuras

---

## 4. Mejoras de accesibilidad

| Mejora | Implementación |
|--------|----------------|
| Skip link | "Ir al contenido principal" en páginas autenticadas |
| Focus visible | Outline verde en `:focus-visible` global |
| Contraste | Paleta verificada para texto y sidebar |
| ARIA | `aria-label` en sidebar, toggles y notificaciones |
| Navegación teclado | Sidebar toggle y enlaces focusables |
| Reduced motion | Media query desactiva animaciones |
| Labels | Formularios mantienen `for` / `id` asociados |

---

## 5. Mejoras visuales

- Identidad SENA con verde `#39A900` (reemplaza azul `#0066cc` anterior)
- Tipografía Inter con jerarquía clara
- Espaciado uniforme y más aire entre secciones
- Sombras premium discretas
- Animaciones fade-in / slide-up en login y contenido
- Gráficas Chart.js con colores institucionales actualizados
- Iconografía unificada (solo Bootstrap Icons)
- Responsive: sidebar colapsable en tablet/móvil

---

## 6. Archivos creados

```
public/css/app.css
public/css/styles/variables.css
public/css/styles/base/reset.css
public/css/styles/base/typography.css
public/css/styles/layout/shell.css
public/css/styles/layout/sidebar.css
public/css/styles/layout/header.css
public/css/styles/layout/footer.css
public/css/styles/components/*.css (11 archivos)
public/css/styles/utilities/animations.css
public/css/styles/utilities/helpers.css
public/css/styles/pages/*.css (9 archivos)
public/js/sidebar.js
DESIGN_SYSTEM.md
UI_UX_REPORT.md
```

---

## 7. Archivos modificados

### HTML
- `public/index.html`
- `public/validar.html`
- `public/carnets.html`
- `public/pages/login.html`
- `public/pages/dashboard.html`
- `public/pages/usuarios.html`
- `public/pages/organizacion.html`
- `public/pages/carnets.html`
- `public/pages/reportes.html`
- `public/pages/auditoria.html`
- `public/pages/sistema.html`

### CSS (redirección a app.css)
- `public/css/sena.css`
- `public/css/login.css`
- `public/css/dashboard.css`
- `public/css/usuarios.css`
- `public/css/carnets.css`
- `public/css/reportes.css`
- `public/css/validar.css`
- `public/css/auditoria.css`
- `public/css/sistema.css`
- `public/css/organizacion.css`

### JavaScript (solo ajustes visuales)
- `public/js/dashboard.js` — colores de gráficas
- `public/js/reportes.js` — paleta de gráficas
- `public/js/notificaciones-ui.js` — clase del botón campana (header claro)

---

## 8. Verificación funcional

Checklist de pantallas revisadas (IDs y hooks JS preservados):

| Módulo | IDs críticos verificados |
|--------|--------------------------|
| Login | `loginForm`, `email`, `password`, `btnLogin`, `alertBox` |
| Dashboard | `statCards`, `quickActions`, `chart*`, `btnLogout`, `navLinks` |
| Usuarios | `btnNuevoUsuario`, `tablaUsuarios`, modales, filtros |
| Organización | Tabs regionales/centros/roles, formularios |
| Carnés | `tablaCarnets`, `modalEmitir`, `previewEmitir`, paginación |
| Reportes | Tabs reportes, filtros, exportación, gráficas |
| Auditoría | Filtros, tabla auditoría |
| Sistema | `tabsSistema`, `formConfig`, `notifNavSlot` |
| Validar | `qrReader`, `tokenManual`, `resultadoCard`, `estadoBadge` |

**Backend:** Sin cambios.  
**Rutas API:** Sin cambios.  
**Lógica JS de negocio:** Intacta.

---

## 9. Cómo probar

```bash
npm run dev
```

Abrir `http://localhost:3000/login.html` y recorrer cada módulo con usuario admin.

---

## 10. Próximos pasos sugeridos (fuera de alcance)

- Modo oscuro con `data-theme="dark"`
- Skeleton loading en tablas con datos async
- Tooltips Bootstrap inicializados globalmente
- Consolidar shell HTML con plantillas servidor (EJS) para evitar duplicación
