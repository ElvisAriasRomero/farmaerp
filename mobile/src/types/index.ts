/**
 * Interfaces TypeScript alineadas con los serializers del backend Django.
 * Fuente: serializers del backend (apps de Django).
 */

// --- Usuario / Auth ---
export type TipoUsuario = "cliente" | "empleado";

export interface Usuario {
  id_usuario: number;
  email: string;
  tipo: TipoUsuario;
  nombre: string | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  last_login: string | null;
  date_joined: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

/** Respuesta de POST /auth/login/ (CustomTokenObtainPairSerializer) */
export interface LoginResponse extends AuthTokens {
  usuario: Usuario;
}

export interface RegistroClientePayload {
  nombre: string;
  email: string;
  telefono?: string;
  direccion?: string;
  password: string;
  password_confirm: string;
}

// --- Catálogo ---
export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

/** ProductoSerializer: excluye el FK `categoria`, agrega id_categoria + nombre + stock */
export interface Producto {
  id_producto: number;
  nombre: string;
  foto: string | null;
  codigo_barras: string | null;
  precio_compra: string | null;
  precio_venta: string | null;
  fecha_vencimiento: string | null;
  unidad_medida: string | null;
  unidades_por_empaque: number;
  id_categoria: number;
  categoria_nombre: string;
  stock_actual: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

// --- Carrito (LOCAL, no se persiste en el servidor) ---
export interface CartItem {
  producto: Producto;
  cantidad: number;
}

// --- Ventas / Pedidos ---
export type EstadoVenta =
  | "pendiente"
  | "reservada"
  | "pagada"
  | "entregada"
  | "completada"
  | "cancelada";

export type MetodoPago = "farmacia" | "qr";

export interface DetalleVenta {
  id_detalle_venta: number;
  producto: number;
  producto_nombre: string;
  presentacion: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
}

export interface PagoResumen {
  metodo_pago: string;
  referencia: string | null;
  estado: string;
  monto: string;
}

export interface Venta {
  id_venta: number;
  cliente: number | null;
  cliente_nombre: string | null;
  carrito: number | null;
  empleado: number | null;
  fecha_venta: string;
  total: string;
  estado: EstadoVenta;
  con_factura: boolean;
  origen: "mostrador" | "tienda";
  factura_numero: string | null;
  pago: PagoResumen | null;
  detalles: DetalleVenta[];
  fecha_creacion: string;
  fecha_actualizacion: string;
}

/** Body de POST /ventas/checkout/ */
export interface CheckoutPayload {
  items: { producto: number; cantidad: number }[];
  metodo_pago: MetodoPago;
  con_factura?: boolean;
  nit_ci?: string;
  razon_social?: string;
}

// --- Paginación DRF ---
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
