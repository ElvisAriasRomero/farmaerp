import CrudView from "../components/CrudView.jsx";
import { endpoints } from "../services/api.js";
import useOptions from "../hooks/useOptions.js";

export default function Inventario() {
  const productos = useOptions(endpoints.productos, (p) => ({
    value: p.id_producto,
    label: p.nombre,
  }));

  const columns = [
    { key: "producto_nombre", header: "Producto", render: (r) => <span className="cell-strong">{r.producto_nombre}</span> },
    {
      key: "stock_actual",
      header: "Stock actual",
      align: "right",
      render: (r) => {
        const bajo = r.stock_actual <= r.stock_minimo;
        return <span className={`badge badge--${bajo ? "red" : "green"}`}>{r.stock_actual}</span>;
      },
    },
    { key: "stock_minimo", header: "Stock mínimo", align: "right" },
    {
      key: "stock_disponible",
      header: "Disponible",
      align: "right",
      render: (r) => <span className="cell-strong">{r.stock_disponible}</span>,
    },
  ];

  const fields = [
    { name: "producto", label: "Producto", type: "select", required: true, options: () => productos, hidden: (editing) => !!editing },
    { name: "stock_actual", label: "Stock actual", type: "number", min: "0", required: true, defaultValue: 0 },
    { name: "stock_minimo", label: "Stock mínimo", type: "number", min: "0", required: true, defaultValue: 10 },
  ];

  return (
    <CrudView
      title="Inventario"
      subtitle="Controla las existencias por producto."
      api={endpoints.inventario}
      idKey="id_inventario"
      columns={columns}
      fields={fields}
      createLabel="Registrar inventario"
      searchPlaceholder="Buscar producto…"
    />
  );
}
