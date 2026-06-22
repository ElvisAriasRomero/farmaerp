# Plan de Implementación — App Móvil FarmaERP

> Versión corregida tras validar los endpoints contra el backend real (Django REST).
> App de **tienda para clientes** en **React Native + Expo**, consumiendo la API existente sin modificar el servidor.

---

## Estado actual del proyecto

El backend ya expone todos los endpoints necesarios para la app móvil, completamente funcionales:

| Endpoint | Método | Uso en móvil | Auth |
|---|---|---|---|
| `/api/v1/auth/login/` | POST | Login `{email, password}` | No |
| `/api/v1/auth/register/cliente/` | POST | Registro `{nombre, email, telefono, direccion, password, password_confirm}` | No |
| `/api/v1/auth/refresh/` | POST | Refresh de token `{refresh}` | No |
| `/api/v1/auth/me/` | GET | Perfil del usuario autenticado | Sí |
| `/api/v1/tienda/productos/?search=&categoria=` | GET | CU14 — catálogo público | No |
| `/api/v1/tienda/categorias/` | GET | CU14 — filtros por categoría | No |
| `/api/v1/ventas/checkout/` | POST | CU13 — confirmar pedido | Sí (rol cliente) |
| `/api/v1/ventas/ventas/` | GET | CU16 — historial de pedidos | Sí |

No existe carpeta `mobile/` aún — se crea desde cero. El frontend web (`src/pages/store/Home.jsx`, `Carrito.jsx`, `Checkout.jsx`) sirve como referencia de lógica.

### Corrección clave frente a la versión anterior del plan

El checkout **NO usa un carrito del servidor**. La vista `CheckoutView` ignora cualquier `id_carrito` y espera recibir los ítems directamente:

```json
{
  "items": [{ "producto": <id>, "cantidad": <n> }],
  "metodo_pago": "farmacia" | "qr",
  "con_factura": false,
  "nit_ci": "...",
  "razon_social": "..."
}
```

El backend toma el `precio_venta` actual de cada producto, descuenta stock y crea la venta. Así funciona ya la web: arma `items` desde un **carrito local en memoria** y lo envía al checkout.

**Decisión:** el carrito de la app móvil será **100% local** (Context + AsyncStorage), igual que el web. Los endpoints `/carrito/` y `/carrito/detalle/` del servidor existen pero **no se usan** en este flujo; quedan para una versión futura con carrito sincronizado entre dispositivos.

---

## Stack técnico

- **React Native + Expo SDK 52** (managed workflow)
- **expo-router v3** — routing basado en archivos (similar a Next.js App Router)
- **axios** — cliente HTTP con interceptores JWT (replicando `frontend/src/services/api.js`)
- **expo-secure-store** — almacenamiento cifrado de tokens JWT (keychain del dispositivo)
- **@react-native-async-storage/async-storage** — persistencia del carrito local
- **expo-camera / expo-barcode-scanner** — escáner de código de barras (CU extra)
- **expo-notifications** — notificación local de pedido confirmado (CU13)
- **@expo/vector-icons** (Ionicons) — iconografía
- **TypeScript** — tipado completo

### Configuración de red importante

El celular debe estar en la **misma red Wi-Fi** que el servidor Django. La URL base de la API debe apuntar a la **IP de red local** (ej. `http://192.168.x.x:8000/api/v1`), no a `localhost`. Verificar que `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` y `MEDIA_URL` (imágenes de productos) permitan esa IP.

---

## Estructura de carpetas

```
mobile/
├── app/                          # expo-router (file-based routing)
│   ├── _layout.tsx               # Root: AuthGuard + providers
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx             # Pantalla Login
│   │   └── register.tsx          # Pantalla Registro
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigator (3 tabs)
│   │   ├── index.tsx             # 🏠 Catálogo        CU14
│   │   ├── carrito.tsx           # 🛒 Carrito          CU15
│   │   └── pedidos.tsx           # 📋 Mis Pedidos      CU16
│   ├── producto/
│   │   └── [id].tsx              # Detalle de producto
│   └── checkout.tsx              # Checkout            CU13
├── src/
│   ├── api/
│   │   ├── client.ts             # axios + interceptor refresh JWT
│   │   ├── auth.ts               # login / register / me
│   │   ├── productos.ts          # tienda/productos, tienda/categorias
│   │   └── ventas.ts             # checkout + historial
│   ├── context/
│   │   ├── AuthContext.tsx       # tokens, user, login/logout
│   │   └── CartContext.tsx       # carrito LOCAL + operaciones
│   ├── components/
│   │   ├── ProductCard.tsx       # Card producto (imagen, nombre, precio)
│   │   ├── CartItem.tsx          # Fila carrito con +/- cantidad
│   │   ├── OrderCard.tsx         # Card pedido con estado y total
│   │   ├── CategoryFilter.tsx    # ScrollView horizontal de categorías
│   │   └── EmptyState.tsx        # Pantalla vacía reutilizable
│   ├── hooks/
│   │   ├── useProductos.ts       # fetch + búsqueda + filtro categoría
│   │   └── useCarrito.ts         # add, remove, update, clear (local)
│   ├── types/index.ts            # Interfaces TS (Producto, Carrito, Venta…)
│   └── constants/colors.ts       # Paleta FarmaERP (#1F3864, etc.)
├── app.json
├── package.json
└── tsconfig.json
```

> Nota: ya no hay `src/api/carrito.ts` — el carrito vive solo en el cliente.

---

## Fases de implementación

### Fase 1 — Setup del proyecto (1 sesión)
- `npx create-expo-app mobile` con plantilla TypeScript.
- Instalar/configurar expo-router, axios, expo-secure-store, async-storage, expo-notifications, expo-barcode-scanner.
- Configurar `app.json` (nombre, bundle ID, permisos de cámara y notificaciones).
- Crear `src/constants/colors.ts` con la paleta del sistema (`#1F3864`, etc.).
- Crear `src/types/index.ts` con interfaces: `Producto`, `Categoria`, `CartItem`, `Venta`, `DetalleVenta`.
- Configurar la URL base por IP de red y probar un fetch al catálogo.

### Fase 2 — Capa API (1 sesión)
- `src/api/client.ts`: instancia axios con `baseURL`, interceptor que inyecta el Bearer token en cada request y hace refresh automático en 401 (replicando `frontend/src/services/api.js`).
- `src/api/auth.ts`, `productos.ts`, `ventas.ts`.

### Fase 3 — Autenticación (1 sesión)
- `AuthContext`: guarda tokens en expo-secure-store, expone `login()`, `logout()`, `user`; auto-login al abrir la app.
- `app/(auth)/login.tsx`: formulario email/password → `POST /auth/login/`.
- `app/(auth)/register.tsx`: nombre, email, teléfono, dirección, password, password_confirm → `POST /auth/register/cliente/`.
- `app/_layout.tsx`: redirige a `/(auth)/login` si no hay token.

### Fase 4 — CU14: Explorar catálogo (1 sesión)
- `app/(tabs)/index.tsx`: `FlatList` a 2 columnas con `ProductCard`.
- `CategoryFilter`: `ScrollView` horizontal con chips (fetch de `/tienda/categorias/`).
- Barra de búsqueda con debounce → `?search=término`.
- `app/producto/[id].tsx`: imagen ampliada, nombre, precio, stock disponible, botón "Agregar al carrito".

### Fase 5 — CU15: Gestionar carrito (carrito LOCAL) (1 sesión)
- `CartContext`: estado del carrito **en memoria + AsyncStorage** (persiste si se cierra la app).
- Operaciones: `addItem(producto, cantidad)`, `updateQty(productoId, qty)`, `removeItem(productoId)`, `clearCart()`.
- Cálculo de total en el cliente a partir de `precio_venta`.
- `app/(tabs)/carrito.tsx`: lista con `CartItem` (+/- cantidad, eliminar), resumen del total, botón "Confirmar pedido".

### Fase 6 — CU13: Checkout (1 sesión)
- `app/checkout.tsx`: resumen del pedido + selector de **método de pago** (`farmacia` / `qr`). Opcional: campos de factura (`con_factura`, `nit_ci`, `razon_social`).
- `POST /api/v1/ventas/checkout/` con `{ items: [{producto, cantidad}], metodo_pago }`.
- Success screen: número de venta, estado "Pendiente", notificación local vía expo-notifications.
- `clearCart()` tras el éxito.

### Fase 7 — CU16: Historial de pedidos (1 sesión)
- `app/(tabs)/pedidos.tsx`: `FlatList` con `OrderCard` (nro pedido, fecha, total, estado con badge de color).
- `GET /api/v1/ventas/ventas/` — confirmar que el `VentaViewSet` filtra por el cliente autenticado (el patrón `FiltrarPorClienteMixin` ya se usa en otras vistas).
- Tap en pedido → pantalla/modal con detalle de la venta (productos, cantidades, subtotales).

### Fase 8 — Extra: Escáner de código de barras ⭐ (1 sesión)
- Botón de cámara que escanea un código → busca el producto vía `GET /tienda/productos/?search=<codigo_barras>`.
- Si existe, abre su detalle o lo agrega al carrito. (El modelo `Producto` ya tiene el campo `codigo_barras`.)
- Diferenciador para la defensa del taller.

---

## Flujo de datos clave

```
Login → tokens en expo-secure-store
    ↓
Catálogo (público: GET tienda/productos)
    ↓ tap producto
Detalle → "Agregar al carrito"
    ↓ CartContext (LOCAL, AsyncStorage)
Carrito → ajuste de cantidades (LOCAL)
    ↓ tap "Confirmar"
Checkout → POST ventas/checkout/ { items, metodo_pago } → Venta creada
    ↓
Notificación local de confirmación + clearCart()
    ↓
Historial → GET ventas/ventas/ (filtrado por cliente)
```

---

## Decisiones técnicas importantes

- **Carrito local, no en servidor.** El checkout consume una lista de `items`, no un `id_carrito`. Un carrito local (Context + AsyncStorage) coincide con lo que el backend espera, reduce llamadas de red y evita sincronización innecesaria. Coincide con el comportamiento actual del web.
- **expo-router sobre React Navigation puro.** Rutas como archivos, más simple de mantener y coherente con la escala del proyecto.
- **Tokens en expo-secure-store** (no AsyncStorage). Los JWT se guardan cifrados en el keychain del dispositivo, más seguro que AsyncStorage plano.
- **Sin Expo Go para push reales.** Para probar push notifications se necesita un build de desarrollo (expo-dev-client) o dispositivo físico. En simulador solo funcionan notificaciones locales — suficiente para el CU13.
- **URL de API por IP de red.** `localhost` no funciona desde el celular; usar la IP local del servidor y permitirla en CORS/ALLOWED_HOSTS.

---

## Estimación

8 sesiones de trabajo (≈ 9–12 días enfocados), incluyendo el escáner como extra. El historial y el escáner pueden recortarse si el tiempo aprieta sin afectar el flujo principal de compra (CU13–CU15).
