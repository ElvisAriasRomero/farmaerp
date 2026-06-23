import CrudView from "../components/CrudView.jsx";
import { endpoints } from "../services/api.js";
import useOptions from "../hooks/useOptions.js";
import { currency, dateShort } from "../utils/format.js";
import Icon from "../components/Icon.jsx";

export default function Productos() {
  const categorias = useOptions(endpoints.categorias, (c) => ({
    value: c.id_categoria,
    label: c.nombre,
  }));

  const columns = [
    {
      key: "nombre",
      header: "Producto",
      render: (r) => (
        <div className="u-flex u-items-center u-gap-12">
          <span style={{
            width: 36, height: 36, background: "var(--brand-50)",
            color: "var(--brand-700)", display: "grid", placeItems: "center", flexShrink: 0,
          }}>
            <Icon name="pill" size={18} />
          </span>
          <div>
            <div className="cell-strong">{r.nombre}</div>
            <div className="text-soft" style={{ fontSize: 12 }}>
              {r.codigo_barras || "Sin código"}
            </div>
          </div>
        </div>
      ),
    },
    { key: "categoria_nombre", header: "Categoría", render: (r) => r.categoria_nombre || "—" },
    {
      key: "precio_compra",
      header: "Costo",
      align: "right",
      render: (r) => (r.precio_compra == null ? <span className="text-soft">—</span> : currency(r.precio_compra)),
    },
    {
      key: "precio_venta",
      header: "Venta",
      align: "right",
      render: (r) => {
        if (r.precio_venta == null) return <span className="text-soft">—</span>;
        if (r.precio_compra == null) return currency(r.precio_venta);
        const ok = Number(r.precio_venta) > Number(r.precio_compra);
        return (
          <span
            title={ok ? "Precio actualizado" : "El precio de venta no supera al costo"}
            style={{ color: ok ? "var(--success-600)" : "var(--danger-600)" }}
          >
            {currency(r.precio_venta)}
          </span>
        );
      },
    },
    {
      key: "stock_actual",
      header: "Stock",
      align: "right",
      render: (r) => {
        const s = r.stock_actual ?? 0;
        return <span className={`badge badge--${s <= 0 ? "red" : s < 10 ? "amber" : "green"}`}>{s}</span>;
      },
    },
    { key: "fecha_vencimiento", header: "Vence", render: (r) => dateShort(r.fecha_vencimiento) },
  ];

  // El producto es SOLO identidad. Costo, venta y unidades por paquete se
  // definen en la compra y se actualizan al recepcionar.
  const fields = [
    { name: "nombre", label: "Nombre del producto", required: true, span: true, placeholder: "Ej. Paracetamol 500mg" },
    { name: "id_categoria", label: "Categoría", type: "select", required: true, options: () => categorias },
    { name: "codigo_barras", label: "Código de barras", placeholder: "7790000000000" },
    // La fecha de vencimiento ya no se edita aquí: la gestionan los lotes (FEFO).
    { name: "foto", label: "URL de imagen", span: true, placeholder: "https://…", omitIfEmpty: true },
  ];

  return (
    <CrudView
      title="Productos"
      subtitle="Catálogo (identidad). El costo y precio de venta se definen en la compra."
      api={endpoints.productos}
      idKey="id_producto"
      columns={columns}
      fields={fields}
      modalSize="md"
      createLabel="Nuevo producto"
      searchPlaceholder="Buscar por nombre o código…"
    />
  );
}
