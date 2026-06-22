import CrudView from "../components/CrudView.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { endpoints } from "../services/api.js";
import { currency, dateTime } from "../utils/format.js";

export default function Pagos() {
  const columns = [
    { key: "id_pago", header: "#", render: (r) => <span className="cell-strong">#{r.id_pago}</span> },
    { key: "venta", header: "Venta", render: (r) => (r.venta ? `#${r.venta}` : <span className="text-soft">—</span>) },
    { key: "factura", header: "Factura", render: (r) => (r.factura ? `#${r.factura}` : <span className="text-soft">Sin factura</span>) },
    { key: "monto", header: "Monto", align: "right", render: (r) => currency(r.monto) },
    { key: "metodo_pago", header: "Método", render: (r) => <StatusBadge value={r.metodo_pago} /> },
    { key: "estado", header: "Estado", render: (r) => <StatusBadge value={r.estado} /> },
    { key: "referencia", header: "Referencia", render: (r) => r.referencia || <span className="text-soft">—</span> },
    { key: "fecha_pago", header: "Fecha", render: (r) => dateTime(r.fecha_pago) },
  ];

  // Solo consulta: los pagos se generan automáticamente al confirmar la venta.
  return (
    <CrudView
      title="Pagos"
      subtitle="Cobros registrados (generados automáticamente desde las ventas)."
      api={endpoints.pagos}
      idKey="id_pago"
      columns={columns}
      fields={[]}
      write={[]}
      del={[]}
      searchPlaceholder="Buscar por referencia…"
    />
  );
}
