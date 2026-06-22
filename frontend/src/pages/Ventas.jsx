import DocumentView from "../components/DocumentView.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { endpoints } from "../services/api.js";
import { currency, dateTime } from "../utils/format.js";

export default function Ventas() {
  const columns = [
    { key: "id_venta", header: "N° Venta", render: (r) => <span className="cell-strong">#{r.id_venta}</span> },
    { key: "cliente_nombre", header: "Cliente", render: (r) => r.cliente_nombre || "Consumidor final" },
    { key: "fecha_venta", header: "Fecha", render: (r) => dateTime(r.fecha_venta) },
    { key: "items", header: "Ítems", align: "right", render: (r) => (r.detalles || []).length },
    { key: "total", header: "Total", align: "right", render: (r) => <span className="cell-strong">{currency(r.total)}</span> },
    { key: "estado", header: "Estado", render: (r) => <StatusBadge value={r.estado} /> },
  ];

  return (
    <DocumentView
      title="Ventas"
      subtitle="Registro de ventas y punto de venta."
      api={endpoints.ventas}
      idKey="id_venta"
      columns={columns}
      basePath="/panel/ventas"
      createLabel="Nueva venta"
    />
  );
}
