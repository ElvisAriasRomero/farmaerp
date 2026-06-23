import CrudView from "../components/CrudView.jsx";
import { endpoints } from "../services/api.js";
import { dateShort } from "../utils/format.js";

export default function Lotes() {
  const columns = [
    { key: "producto_nombre", header: "Producto", render: (r) => r.producto_nombre },
    { key: "numero_lote", header: "Lote", render: (r) => r.numero_lote || "—" },
    {
      key: "cantidad",
      header: "Cantidad",
      align: "right",
      render: (r) => (
        <span className={`badge badge--${r.cantidad <= 0 ? "red" : r.cantidad < 10 ? "amber" : "green"}`}>
          {r.cantidad}
        </span>
      ),
    },
    { key: "fecha_vencimiento", header: "Vence", render: (r) => dateShort(r.fecha_vencimiento) },
    { key: "fecha_ingreso", header: "Ingreso", render: (r) => dateShort(r.fecha_ingreso) },
  ];

  return (
    <CrudView
      title="Lotes"
      subtitle="Lotes por producto con su fecha de vencimiento. La venta consume primero el lote que vence antes (FEFO); al agotarse, la fecha del producto salta al siguiente lote."
      api={endpoints.lotes}
      idKey="id_lote"
      columns={columns}
      fields={[]}
      write={[]}
      del={[]}
      searchPlaceholder="Buscar por producto o número de lote…"
    />
  );
}
