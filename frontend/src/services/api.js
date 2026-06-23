import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const TOKENS = "farmaerp_tokens";

export const tokenStore = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(TOKENS)) || null;
    } catch {
      return null;
    }
  },
  set(tokens) {
    localStorage.setItem(TOKENS, JSON.stringify(tokens));
  },
  clear() {
    localStorage.removeItem(TOKENS);
  },
};

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// --- Request: inyecta Authorization ---
api.interceptors.request.use((config) => {
  const tokens = tokenStore.get();
  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
});

// --- Response: refresh automático en 401 ---
let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && !original._retry && !original.url?.includes("/auth/")) {
      const tokens = tokenStore.get();
      if (!tokens?.refresh) {
        forceLogout();
        return Promise.reject(error);
      }
      original._retry = true;
      try {
        refreshing =
          refreshing ||
          axios.post(`${BASE_URL}/auth/refresh/`, { refresh: tokens.refresh });
        const { data } = await refreshing;
        refreshing = null;
        const next = { ...tokens, access: data.access };
        tokenStore.set(next);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        forceLogout();
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

function forceLogout() {
  tokenStore.clear();
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

// Extrae un mensaje legible de un error de DRF
export function parseApiError(err, fallback = "Ocurrió un error inesperado.") {
  const data = err?.response?.data;
  if (!data) return err?.message || fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  // errores de campos: { campo: ["msg"] }
  const parts = [];
  for (const [k, v] of Object.entries(data)) {
    const msg = Array.isArray(v) ? v.join(" ") : String(v);
    parts.push(k === "non_field_errors" ? msg : `${k}: ${msg}`);
  }
  return parts.join(" · ") || fallback;
}

/* ============================================================
   AUTH
   ============================================================ */
export const authApi = {
  login: (email, password) => api.post("/auth/login/", { email, password }),
  me: () => api.get("/auth/me/"),
  logout: (refresh) => api.post("/auth/logout/", { refresh }),
  registroCliente: (payload) => api.post("/auth/register/cliente/", payload),
};

/* ============================================================
   CRUD genérico por recurso
   ============================================================ */
export function resource(path) {
  return {
    list: (params) => api.get(`/${path}/`, { params }),
    retrieve: (id) => api.get(`/${path}/${id}/`),
    create: (payload) => api.post(`/${path}/`, payload),
    update: (id, payload) => api.put(`/${path}/${id}/`, payload),
    patch: (id, payload) => api.patch(`/${path}/${id}/`, payload),
    remove: (id) => api.delete(`/${path}/${id}/`),
  };
}

// Mapa de recursos del backend (config/urls.py)
export const endpoints = {
  usuarios: resource("usuarios"),
  roles: resource("usuarios/roles"),
  clientes: resource("usuarios/clientes"),
  empleados: resource("usuarios/empleados"),
  proveedores: resource("usuarios/proveedores"),
  categorias: resource("productos/categorias"),
  productos: resource("productos/productos"),
  inventario: resource("inventario/inventario"),
  lotes: resource("inventario/lotes"),
  compras: resource("compras/compras"),
  detalleCompra: resource("compras/detalle"),
  carritos: resource("carrito"),
  detalleCarrito: resource("carrito/detalle"),
  ventas: resource("ventas/ventas"),
  detalleVenta: resource("ventas/detalle"),
  facturas: resource("ventas/facturas"),
  pagos: resource("ventas/pagos"),
  bitacora: resource("bitacora"),
  reportes: resource("reportes"),
  caja: resource("caja/movimientos"),
  demandas: resource("prediccion/demandas"),
  predicciones: resource("prediccion/predicciones"),
  sugerencias: resource("prediccion/sugerencias"),
};

/* ============================================================
   ANALÍTICA / DASHBOARD
   ============================================================ */
export const analyticsApi = {
  dashboard: (dias = 30) => api.get("/dashboard/", { params: { dias } }),
  kpis: (dias = 30) => api.get("/analitica/kpis/", { params: { dias } }),
  ventasDiarias: (dias = 30) =>
    api.get("/analitica/ventas-diarias/", { params: { dias } }),
  ventasMensuales: () => api.get("/analitica/ventas-mensuales/"),
  topProductos: (dias = 30) =>
    api.get("/analitica/top-productos/", { params: { dias } }),
  rentabilidad: () => api.get("/analitica/rentabilidad/"),
  alertasStock: () => api.get("/analitica/alertas-stock/"),
};

export const prediccionApi = {
  analisis: () => api.get("/prediccion/analisis/"),
  predecirProducto: (id, periodo = "semanal") =>
    api.get(`/prediccion/producto/${id}/`, { params: { periodo } }),
  entrenar: () => api.post("/prediccion/entrenar/"),
  generar: (periodo = "semanal") => api.post("/prediccion/generar/", { periodo }),
  generarSugerencias: (periodo = "semanal") =>
    api.post("/prediccion/sugerencias/generar/", { periodo }),
  pipeline: (periodo = "semanal") => api.post("/prediccion/pipeline/", { periodo }),
};

export default api;

/* ============================================================
   TIENDA ONLINE (cliente) — catálogo público y checkout
   ============================================================ */
export const tiendaApi = {
  productos: (params) => api.get("/tienda/productos/", { params }),
  categorias: () => api.get("/tienda/categorias/"),
  checkout: (payload) => api.post("/ventas/checkout/", payload),
};

/* ============================================================
   VENTAS — confirmación (pago + factura automática)
   ============================================================ */
export const ventasApi = {
  confirmar: (id, payload) => api.post(`/ventas/ventas/${id}/confirmar/`, payload),
  cobrar: (id, payload) => api.post(`/ventas/ventas/${id}/cobrar/`, payload),
  entregar: (id) => api.post(`/ventas/ventas/${id}/entregar/`),
  cancelar: (id) => api.post(`/ventas/ventas/${id}/cancelar/`),
};

/* ============================================================
   COMPRAS — recepción (suma stock + actualiza costo)
   ============================================================ */
export const comprasApi = {
  recepcionar: (id) => api.post(`/compras/compras/${id}/recepcionar/`),
};

/* ============================================================
   FACTURACIÓN — anular factura
   ============================================================ */
export const facturasApi = {
  anular: (id) => api.post(`/ventas/facturas/${id}/anular/`),
};

/* ============================================================
   REPORTES — descargar archivo PDF/Excel
   ============================================================ */
export const reportesApi = {
  descargar: async (reporte) => {
    const { data, headers } = await api.get(`/reportes/${reporte.id_reporte}/descargar/`, {
      responseType: "blob",
    });
    const cd = headers["content-disposition"] || "";
    const match = cd.match(/filename="?([^"]+)"?/);
    const ext = reporte.formato === "Excel" ? "xlsx" : "pdf";
    const filename = match ? match[1] : `reporte_${reporte.tipo}_${reporte.id_reporte}.${ext}`;
    const url = window.URL.createObjectURL(new Blob([data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};

/* ============================================================
   CAJA — cerrar y registrar salida
   ============================================================ */
export const cajaApi = {
  cerrar: (id) => api.post(`/caja/movimientos/${id}/cerrar/`),
  salida: (id, payload) => api.post(`/caja/movimientos/${id}/salida/`, payload),
};
