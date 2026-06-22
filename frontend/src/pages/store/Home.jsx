import { useEffect, useMemo, useState } from "react";
import Icon from "../../components/Icon.jsx";
import { tiendaApi, parseApiError } from "../../services/api.js";
import { useCart } from "../../context/CartContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { currency } from "../../utils/format.js";

export default function Home() {
  const { add } = useCart();
  const toast = useToast();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cat, setCat] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([tiendaApi.productos(), tiendaApi.categorias()])
      .then(([pRes, cRes]) => {
        setProductos(Array.isArray(pRes.data) ? pRes.data : pRes.data.results || []);
        setCategorias(Array.isArray(cRes.data) ? cRes.data : cRes.data.results || []);
      })
      .catch((err) => toast.error("No se pudo cargar el catálogo", parseApiError(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return productos.filter((p) => {
      const okCat = !cat || p.id_categoria === cat;
      const okQ = !q || p.nombre.toLowerCase().includes(q);
      return okCat && okQ;
    });
  }, [productos, cat, search]);

  const onAdd = (p) => {
    if ((p.stock_actual ?? 0) <= 0) {
      toast.error("Sin stock", "Este producto no tiene unidades disponibles.");
      return;
    }
    add(p);
    toast.success("Agregado al carrito", p.nombre);
  };

  return (
    <div className="store-page">
      {/* Hero */}
      <section className="store-hero">
        <div className="store-hero__content">
          <h1>Tu farmacia en línea, fácil y rápida</h1>
          <p>
            Encuentra medicamentos e insumos al mejor precio y recíbelos sin
            complicaciones. Compra segura, stock en tiempo real.
          </p>
          <a href="#catalogo" className="btn btn--primary">
            <Icon name="cart" size={16} /> Ver catálogo
          </a>
        </div>
        <div className="store-hero__art"><Icon name="pill" size={120} /></div>
      </section>

      {/* Catálogo */}
      <section id="catalogo" className="store-catalog">
        <div className="store-catalog__head">
          <h2>Catálogo de productos</h2>
          <div className="store-search">
            <Icon name="search" size={16} />
            <input
              placeholder="Buscar producto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="store-chips">
          <button
            className={`store-chip ${!cat ? "active" : ""}`}
            onClick={() => setCat(null)}
          >
            Todos
          </button>
          {categorias.map((c) => (
            <button
              key={c.id_categoria}
              className={`store-chip ${cat === c.id_categoria ? "active" : ""}`}
              onClick={() => setCat(c.id_categoria)}
            >
              {c.nombre}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-block"><div className="spinner" /><span>Cargando catálogo…</span></div>
        ) : visibles.length === 0 ? (
          <div className="empty">
            <div className="empty__icon"><Icon name="package" size={28} /></div>
            <h4>Sin productos</h4>
            <p>No encontramos productos con ese filtro.</p>
          </div>
        ) : (
          <div className="store-grid">
            {visibles.map((p) => {
              const stock = p.stock_actual ?? 0;
              return (
                <article key={p.id_producto} className="prod-card">
                  <div className="prod-card__img">
                    {p.foto ? (
                      <img src={p.foto} alt={p.nombre} onError={(e) => (e.target.style.display = "none")} />
                    ) : (
                      <Icon name="pill" size={40} />
                    )}
                  </div>
                  <div className="prod-card__body">
                    <span className="prod-card__cat">{p.categoria_nombre || "General"}</span>
                    <h3 className="prod-card__name">{p.nombre}</h3>
                    <div className="prod-card__row">
                      <span className="prod-card__price">{currency(p.precio_venta)}</span>
                      <span className={`prod-card__stock ${stock <= 0 ? "out" : stock < 10 ? "low" : ""}`}>
                        {stock <= 0 ? "Agotado" : `${stock} en stock`}
                      </span>
                    </div>
                    <button
                      className="btn btn--primary btn--block"
                      disabled={stock <= 0}
                      onClick={() => onAdd(p)}
                    >
                      <Icon name="cart" size={15} /> Agregar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
