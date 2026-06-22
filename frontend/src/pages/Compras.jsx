import DocumentView from "../components/DocumentView.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { endpoints, comprasApi } from "../services/api.js";
import { currency, dateShort } from "../utils/format.js";

export default function Compras() {
  const columns = [
    { key: "id_compra", header: "N° Compra", render: (r) => <span className="cell-strong">#{r.id_compra}</span> },
    { key: "proveedor_nombre", header: "Proveedor", render: (r) => r.proveedor_nombre || "—" },
    { key: "fecha_pedido", header: "Pedido", render: (r) => dateShort(r.fecha_pedido) },
    { key: "fecha_recepcion", header: "Recepción", render: (r) => dateShort(r.fecha_recepcion) },
    { key: "items", header: "Ítems", align: "right", render: (r) => (r.detalles || []).length },
    { key: "total", header: "Total", align: "right", render: (r) => <span className="cell-strong">{currency(r.total)}</span> },
    { key: "estado", header: "Estado", render: (r) => <StatusBadge value={r.estado} /> },
  ];

  return (
    <DocumentView
      title="Compras"
      subtitle="Pedidos y recepciones de proveedores."
      api={endpoints.compras}
      idKey="id_compra"
      columns={columns}
      basePath="/panel/compras"
      createLabel="Nueva compra"
      receiveApi={(id) => comprasApi.recepcionar(id)}
    />
  );
}
