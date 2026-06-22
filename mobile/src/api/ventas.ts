import { api } from "./client";
import type { Venta, CheckoutPayload, Paginated } from "../types";

function unwrap<T>(data: T[] | Paginated<T>): T[] {
  if (Array.isArray(data)) return data;
  return data?.results ?? [];
}

export const ventasApi = {
  /** CU13 — Confirma el pedido. El backend descuenta stock y crea la venta. */
  async checkout(payload: CheckoutPayload): Promise<Venta> {
    const { data } = await api.post<Venta>("/ventas/checkout/", payload);
    return data;
  },

  /**
   * CU16 — Historial del cliente autenticado.
   * VentaViewSet usa FiltrarPorClienteMixin, así que solo devuelve las
   * ventas del cliente logueado.
   */
  async historial(): Promise<Venta[]> {
    const { data } = await api.get<Venta[] | Paginated<Venta>>(
      "/ventas/ventas/",
      { params: { origen: "tienda" } }
    );
    return unwrap(data);
  },

  async detalle(id: number): Promise<Venta> {
    const { data } = await api.get<Venta>(`/ventas/ventas/${id}/`);
    return data;
  },
};
