import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const STORAGE_KEY = "farmaerp_cart";

function loadInitial() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  // items: [{ id, nombre, precio, foto, stock, cantidad }]
  const [items, setItems] = useState(loadInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = (producto, cantidad = 1) => {
    const id = producto.id_producto;
    const stock = producto.stock_actual ?? 0;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        const next = Math.min(existing.cantidad + cantidad, Math.max(stock, 1));
        return prev.map((i) => (i.id === id ? { ...i, cantidad: next } : i));
      }
      return [
        ...prev,
        {
          id,
          nombre: producto.nombre,
          precio: Number(producto.precio_venta),
          foto: producto.foto || "",
          stock,
          cantidad: Math.min(cantidad, Math.max(stock, 1)),
        },
      ];
    });
  };

  const setQty = (id, cantidad) =>
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, cantidad: Math.max(1, Math.min(cantidad, Math.max(i.stock, 1))) }
          : i
      )
    );

  const remove = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clear = () => setItems([]);

  const count = useMemo(
    () => items.reduce((acc, i) => acc + i.cantidad, 0),
    [items]
  );
  const total = useMemo(
    () => items.reduce((acc, i) => acc + i.precio * i.cantidad, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, add, setQty, remove, clear, count, total }}
    >
      {children}
    </CartContext.Provider>
  );
}
