# FarmaERP · Frontend

Interfaz web del ERP de Farmacia, construida con **React 18 + Vite** y un sistema de diseño propio (azul corporativo + slate). Consume el backend Django REST del proyecto.

## Requisitos

- Node.js 18 o superior
- El backend corriendo en `http://localhost:8000` (CORS ya permite `http://localhost:5173`)

## Puesta en marcha

```bash
cd frontend
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

> La URL del backend se configura en `.env` con `VITE_API_URL` (por defecto `http://localhost:8000/api/v1`).

### Scripts

- `npm run dev` — servidor de desarrollo con recarga en caliente
- `npm run build` — compila para producción en `dist/`
- `npm run preview` — sirve el build de producción

## Estructura

```
src/
  components/     Layout, Sidebar, Topbar, Modal, DataTable, CrudView, DocumentView, Field, Icon…
  context/        AuthContext (JWT) y ToastContext (notificaciones)
  config/         nav.js (menú lateral), choices.js (estados del backend)
  hooks/          useOptions (carga de selects de llaves foráneas)
  pages/          Login, Dashboard y los módulos CRUD
  services/       api.js (axios + refresh JWT + mapa de endpoints)
  styles/         index.css (sistema de diseño)
  utils/          format.js (moneda, fechas, etc.)
```

## Funcionalidades

- **Autenticación JWT** con refresco automático de token y rutas protegidas.
- **Dashboard** con KPIs, gráfica de ingresos, ranking de productos y alertas de stock (endpoints `/dashboard/` y `/analitica/*`).
- **Navbar lateral permanente y colapsable** (botón _Minimizar_), responsiva (off-canvas en móvil); el estado se recuerda entre sesiones.
- **Modales de crear/actualizar** con colores suaves; solo se cierran con el botón **Cancelar** o la **X** (no con clic afuera, doble clic ni Escape).
- **Módulos**: Productos, Categorías, Inventario, Ventas, Compras, Facturación, Pagos, Caja, Clientes, Proveedores, Empleados, Predicción, Sugerencias, Métricas, Usuarios, Roles, Reportes y Auditoría.
- **Ventas y Compras** con documento de ítems de línea (agregar productos, subtotales y total en vivo).
- Visibilidad de menús y acciones por rol (administrador / empleado / cliente).

## Mapeo con el backend

Las rutas de `services/api.js` reflejan exactamente `config/urls.py` del backend (prefijos anidados, p. ej. `/productos/productos/`, `/usuarios/clientes/`, `/ventas/facturas/`). Los nombres de campos y los valores de estado coinciden con los serializers y `TextChoices` de Django.
