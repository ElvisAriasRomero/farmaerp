import { useCallback, useEffect, useState } from "react";
import { productosApi } from "../api/productos";
import { apiErrorMessage } from "../api/client";
import type { Producto, Categoria } from "../types";

/** Carga catálogo + categorías con búsqueda y filtro por categoría. */
export function useProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar categorías una vez.
  useEffect(() => {
    productosApi.categorias().then(setCategorias).catch(() => {});
  }, []);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      const data = await productosApi.listar({
        search: search.trim() || undefined,
        categoria: categoria ?? undefined,
      });
      setProductos(data);
    } catch (e) {
      setError(apiErrorMessage(e, "No se pudo cargar el catálogo."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, categoria]);

  // Debounce de búsqueda + recarga al cambiar filtros.
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(cargar, 350);
    return () => clearTimeout(t);
  }, [cargar]);

  const refrescar = useCallback(() => {
    setRefreshing(true);
    cargar();
  }, [cargar]);

  return {
    productos,
    categorias,
    search,
    setSearch,
    categoria,
    setCategoria,
    loading,
    refreshing,
    refrescar,
    error,
  };
}
