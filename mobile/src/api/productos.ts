import { api } from "./client";
import type { Producto, Categoria, Paginated } from "../types";

/** La API puede responder como lista plana o paginada (DRF). Normalizamos. */
function unwrap<T>(data: T[] | Paginated<T>): T[] {
  if (Array.isArray(data)) return data;
  return data?.results ?? [];
}

export interface ProductoQuery {
  search?: string;
  categoria?: number;
}

export const productosApi = {
  async listar(params: ProductoQuery = {}): Promise<Producto[]> {
    const { data } = await api.get<Producto[] | Paginated<Producto>>(
      "/tienda/productos/",
      { params }
    );
    return unwrap(data);
  },

  async detalle(id: number): Promise<Producto> {
    // El detalle público se obtiene del catálogo filtrando; si necesitas el
    // endpoint protegido usa /productos/productos/{id}/.
    const { data } = await api.get<Producto>(`/productos/productos/${id}/`);
    return data;
  },

  async categorias(): Promise<Categoria[]> {
    const { data } = await api.get<Categoria[] | Paginated<Categoria>>(
      "/tienda/categorias/"
    );
    return unwrap(data);
  },

  /** Busca un producto por su código de barras (usado por el escáner). */
  async porCodigoBarras(codigo: string): Promise<Producto | null> {
    const lista = await this.listar({ search: codigo });
    return (
      lista.find((p) => p.codigo_barras === codigo) ?? lista[0] ?? null
    );
  },
};
