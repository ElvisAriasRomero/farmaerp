import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CartItem, Producto } from "../types";

const CART_KEY = "farmaerp_cart";

interface CartState {
  items: CartItem[];
  count: number; // total de unidades
  total: number; // total en dinero
  ready: boolean; // ya cargó desde AsyncStorage
  addItem: (producto: Producto, cantidad?: number) => void;
  updateQty: (idProducto: number, cantidad: number) => void;
  removeItem: (idProducto: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartState | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  // Cargar carrito persistido al iniciar.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CART_KEY);
        if (raw) setItems(JSON.parse(raw) as CartItem[]);
      } catch {
        // ignorar
      }
      setReady(true);
    })();
  }, []);

  // Persistir en cada cambio (después de la carga inicial).
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(CART_KEY, JSON.stringify(items)).catch(() => {});
  }, [items, ready]);

  const addItem = useCallback((producto: Producto, cantidad = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.producto.id_producto === producto.id_producto
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          cantidad: next[idx].cantidad + cantidad,
        };
        return next;
      }
      return [...prev, { producto, cantidad }];
    });
  }, []);

  const updateQty = useCallback((idProducto: number, cantidad: number) => {
    setItems((prev) => {
      if (cantidad <= 0) {
        return prev.filter((i) => i.producto.id_producto !== idProducto);
      }
      return prev.map((i) =>
        i.producto.id_producto === idProducto ? { ...i, cantidad } : i
      );
    });
  }, []);

  const removeItem = useCallback((idProducto: number) => {
    setItems((prev) =>
      prev.filter((i) => i.producto.id_producto !== idProducto)
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const { count, total } = useMemo(() => {
    let c = 0;
    let t = 0;
    for (const i of items) {
      c += i.cantidad;
      t += Number(i.producto.precio_venta ?? 0) * i.cantidad;
    }
    return { count: c, total: t };
  }, [items]);

  const value = useMemo<CartState>(
    () => ({
      items,
      count,
      total,
      ready,
      addItem,
      updateQty,
      removeItem,
      clear,
    }),
    [items, count, total, ready, addItem, updateQty, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>.");
  return ctx;
}
