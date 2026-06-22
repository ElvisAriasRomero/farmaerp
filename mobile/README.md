# FarmaERP — App Móvil (Tienda para clientes)

App móvil de la tienda online de FarmaERP, construida con **React Native + Expo**.
Consume la misma API REST del backend Django (`/api/v1/`) que el frontend web.

## Casos de uso implementados

| CU | Funcionalidad | Pantalla |
|----|---------------|----------|
| CU01 | Login / Registro de cliente | `app/(auth)/login.tsx`, `register.tsx` |
| CU14 | Explorar catálogo (búsqueda + filtro por categoría) | `app/(tabs)/index.tsx` |
| CU15 | Gestionar carrito (local, persistente) | `app/(tabs)/carrito.tsx` |
| CU13 | Checkout (método de pago + notificación) | `app/checkout.tsx` |
| CU16 | Historial de pedidos | `app/(tabs)/pedidos.tsx` |
| Extra | Escáner de código de barras | `src/components/BarcodeScannerModal.tsx` |

## Stack

- React Native 0.76 + Expo SDK 52
- expo-router v4 (routing por archivos)
- axios con refresh automático de JWT
- expo-secure-store (tokens cifrados)
- AsyncStorage (carrito local persistente)
- expo-camera (escáner), expo-notifications (aviso de pedido)
- TypeScript

## Requisitos previos

- Node.js 18+ y npm
- App **Expo Go** en tu celular (Android/iOS), o un emulador
- El **backend Django corriendo** y accesible desde el celular

## Instalación

```bash
cd mobile
npm install
```

## Configuración de la API (IMPORTANTE)

El celular no puede usar `localhost`. Configura la **IP de red local** del equipo que corre Django.

1. Averigua tu IP local (ej. `192.168.1.100`):
   - Windows: `ipconfig` → "Dirección IPv4"
   - macOS/Linux: `ifconfig` o `ip a`

2. Edita `app.json` → `expo.extra.apiUrl`:
   ```json
   "extra": { "apiUrl": "http://192.168.1.100:8000/api/v1" }
   ```

3. En el backend, asegúrate de:
   - Correr el servidor escuchando en la red:
     ```bash
     python manage.py runserver 0.0.0.0:8000
     ```
   - Permitir tu IP en `settings` (`ALLOWED_HOSTS` y `CORS_ALLOWED_ORIGINS`).
   - Que `MEDIA_URL` sea accesible por IP (para que carguen las fotos de productos).

4. El celular y la PC deben estar en la **misma red Wi-Fi**.

## Ejecutar

```bash
npm start
```

Escanea el QR con Expo Go (Android) o la app de cámara (iOS).

> **Nota sobre la cámara:** el escáner de código de barras y las notificaciones
> push reales no funcionan en simuladores ni del todo en Expo Go en algunas
> plataformas. Para probarlos al 100% usa un **dispositivo físico** o un
> **development build** (`npx expo run:android`).

## Estructura

```
mobile/
├── app/                 # Rutas (expo-router)
│   ├── (auth)/          # Login y registro
│   ├── (tabs)/          # Catálogo, carrito, pedidos
│   ├── producto/[id]    # Detalle de producto
│   └── checkout.tsx     # Confirmar pedido
└── src/
    ├── api/             # client (axios+JWT), auth, productos, ventas
    ├── context/         # AuthContext, CartContext (carrito local)
    ├── components/      # ProductCard, CartItem, OrderCard, etc.
    ├── hooks/           # useProductos
    ├── utils/           # format, notifications
    ├── constants/       # colors
    ├── config.ts        # URL de API + resolución de imágenes
    └── types/           # Interfaces TypeScript
```

## Decisiones de diseño

- **Carrito 100% local.** El endpoint `POST /ventas/checkout/` recibe la lista de
  ítems directamente (`{ items: [{producto, cantidad}], metodo_pago }`), no un
  `id_carrito`. Por eso el carrito vive en el cliente (AsyncStorage), igual que
  en el frontend web. Los endpoints `/carrito/` del servidor no se usan aquí.
- **Tokens en SecureStore**, no en almacenamiento plano.
- **Refresh automático de JWT** replicando la lógica de `frontend/src/services/api.js`.
