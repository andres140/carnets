# SENA Carnés — Sistema de Diseño

Documentación del sistema visual institucional. Inspirado en Fluent Design, Material Design 3, GOV.UK y dashboards administrativos modernos, adaptado a la identidad del SENA.

**Versión:** 2.0 UI  
**Modo:** Claro (arquitectura preparada para modo oscuro futuro)  
**Iconografía:** Bootstrap Icons 1.11.3 (única librería)  
**Tipografía:** Inter  

---

## 1. Paleta de colores

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-primary` | `#39A900` | Botones primarios, acentos, marca |
| `--color-primary-dark` | `#1F6B2A` | Sidebar, hover, texto primario |
| `--color-primary-light` | `#DDF5D6` | Fondos suaves, hover tablas |
| `--color-white` | `#FFFFFF` | Superficies, tarjetas |
| `--color-bg` | `#F7F8FA` | Fondo general |
| `--color-border` | `#E9ECEF` | Bordes, divisores |
| `--color-text` | `#222222` | Texto principal |
| `--color-text-secondary` | `#666666` | Subtítulos, labels |
| `--color-text-muted` | `#8A8F98` | Metadatos, hints |
| `--color-error` | `#DC3545` | Errores, revocado |
| `--color-warning` | `#FFC107` | Advertencias, vencido |
| `--color-success` | `#28A745` | Éxito, activo |
| `--color-info` | `#0DCAF0` | Información, suspendido |

### Contraste (WCAG)

- Texto `#222222` sobre `#FFFFFF` / `#F7F8FA`: cumple AA.
- Texto blanco sobre `#1F6B2A` (sidebar): cumple AA.
- Estados semánticos usan fondos tintados + texto oscuro para badges.

---

## 2. Tipografía

```css
--font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
```

| Nivel | Tamaño | Peso | Uso |
|-------|--------|------|-----|
| Título página | 1.5rem (`--font-size-2xl`) | 700 | H1 de módulo |
| Subtítulo | 0.875rem (`--font-size-sm`) | 400 | Descripción bajo título |
| Sección | 0.75rem (`--font-size-xs`) | 600 | Labels uppercase |
| Cuerpo | 1rem | 400 | Texto general |
| Tabla | 0.875rem | 400–600 | Celdas y encabezados |

---

## 3. Espaciado

Escala basada en múltiplos de 4px:

| Token | Valor |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |

---

## 4. Bordes y sombras

### Border radius

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-sm` | 6px | Badges, botones pequeños |
| `--radius-md` | 10px | Inputs, botones |
| `--radius-lg` | 14px | Cards, tablas |
| `--radius-xl` | 18px | Modales, login |
| `--radius-full` | 9999px | Pills, avatares |

### Sombras

| Token | Uso |
|-------|-----|
| `--shadow-xs` | Header, cards en reposo |
| `--shadow-sm` | Cards hover, dropdowns |
| `--shadow-md` | Carné preview, modales |
| `--shadow-lg` | Login card |
| `--shadow-focus` | Focus accesible (verde) |

---

## 5. Layout

```
┌─────────────┬──────────────────────────────────┐
│  Sidebar    │  Header (breadcrumb + usuario)   │
│  260px      ├──────────────────────────────────┤
│  fija       │                                  │
│             │  Contenido principal             │
│             │                                  │
│             ├──────────────────────────────────┤
│             │  Footer discreto                 │
└─────────────┴──────────────────────────────────┘
```

| Token | Valor |
|-------|-------|
| `--sidebar-width` | 260px |
| `--header-height` | 64px |
| `--content-max-width` | 1440px |

**Responsive:** En `< 992px` la sidebar se oculta y se abre con overlay (`sidebar.js`).

---

## 6. Componentes

### Botones

- Primario: verde `#39A900`, hover `#1F6B2A`
- Outline: borde verde, fondo claro al hover
- Secundario: gris neutro institucional
- Estados: `:hover`, `:focus-visible`, `:active` (scale 0.98)

### Formularios

- Inputs con `--radius-md`, padding amplio
- Focus: borde verde + `--shadow-focus`
- Labels con peso 500, tamaño sm
- Validación: clases Bootstrap `is-invalid` / `is-valid`

### Tablas

- Encabezado uppercase, fondo `--color-bg`
- Filas alternadas (`table-striped`)
- Hover con tinte verde claro
- Paginación redondeada con estado activo verde

### Cards

- Borde sutil, sombra xs
- Hover: elevación suave (`stat-card`, `report-kpi`)
- `chart-card` para gráficas del dashboard

### Modales

- `--radius-xl`, header/footer con fondo `--color-bg`
- Sombra lg

### Alertas y badges

- Fondos tintados semánticos (no colores planos estridentes)
- Badges de estado de carné: `.badge-estado-*`, `.estado-badge`

### Tabs y acordeones

- Tab activo: borde inferior verde
- Acordeón: fondo verde claro al expandir

### Skeleton

- `.skeleton`, `.skeleton-text`, `.skeleton-card` para cargas futuras

---

## 7. Animaciones

| Animación | Duración | Uso |
|-----------|----------|-----|
| `fadeIn` | 350ms | Aparición general |
| `fadeInUp` | 350ms | Login, contenido principal |
| `skeleton-shimmer` | 1.4s | Placeholders |
| `pulse-dot` | 2s | Estado servidor en landing |

**Regla:** `prefers-reduced-motion` desactiva animaciones.

---

## 8. Iconografía

- **Librería única:** [Bootstrap Icons](https://icons.getbootstrap.com/)
- Tamaño sidebar: 1.1rem
- Stat icons: 1.25rem en contenedor 48×48px

---

## 9. Estructura de archivos CSS

```
public/css/
├── app.css                    # Entrada principal (@import de todo)
├── sena.css                   # Compatibilidad → app.css
└── styles/
    ├── variables.css
    ├── base/
    │   ├── reset.css
    │   └── typography.css
    ├── layout/
    │   ├── shell.css
    │   ├── sidebar.css
    │   ├── header.css
    │   └── footer.css
    ├── components/
    │   ├── buttons.css
    │   ├── forms.css
    │   ├── cards.css
    │   ├── tables.css
    │   ├── modals.css
    │   ├── alerts.css
    │   ├── badges.css
    │   ├── tabs.css
    │   ├── dropdowns.css
    │   ├── breadcrumbs.css
    │   └── skeleton.css
    ├── utilities/
    │   ├── animations.css
    │   └── helpers.css
    └── pages/
        ├── login.css
        ├── dashboard.css
        ├── usuarios.css
        ├── carnets.css
        ├── reportes.css
        ├── validar.css
        ├── auditoria.css
        ├── sistema.css
        └── organizacion.css
```

---

## 10. Convenciones para nuevas pantallas

1. **HTML autenticado:** Copiar shell de `public/pages/dashboard.html`. Cambiar `body class="app-body page-{modulo}"` y enlace activo en sidebar.
2. **CSS:** Estilos exclusivos en `styles/pages/{modulo}.css` e importar en `app.css`.
3. **IDs:** No renombrar IDs usados por JavaScript (`userName`, `btnLogout`, `navLinks`, etc.).
4. **Permisos nav:** Mantener clases `nav-{modulo} d-none` en items del sidebar.
5. **Scripts:** Incluir `sidebar.js` en páginas con shell.
6. **Páginas públicas:** Sin sidebar (login, validar QR, landing).
7. **Colores:** Usar variables CSS, no hex sueltos.
8. **Modo oscuro (futuro):** Añadir `[data-theme="dark"]` con tokens `--color-*-dark` en `variables.css`.

---

## 11. Clases utilitarias de página

| Clase body | Módulo |
|------------|--------|
| `page-dashboard` | Dashboard ejecutivo |
| `page-usuarios` | Gestión de usuarios |
| `page-organizacion` | Estructura organizacional |
| `page-carnets` | Emisión de carnés |
| `page-reportes` | Centro de reportes |
| `page-auditoria` | Bitácora |
| `page-sistema` | Configuración |
| `login-page` | Autenticación |
| `validar-body` | Validación QR pública |
| `auth-body` | Landing / inicio |
