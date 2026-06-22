import { useState } from "react";
import CrudView from "../components/CrudView.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Icon from "../components/Icon.jsx";
import { endpoints, facturasApi, parseApiError } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { currency, dateShort } from "../utils/format.js";

export default function Facturas() {
  const toast = useToast();
  const [version, setVersion] = useState(0);

  const anular = async (row) => {
    if (row.estado === "anulada") return;
    try {
      await facturasApi.anular(row.id_factura);
      toast.success("Factura anulada", `${row.numero_factura} quedó anulada.`);
      setVersion((v) => v + 1);
    } catch (err) {
      toast.error("No se pudo anular", parseApiError(err));
    }
  };

  const columns = [
    { key: "numero_factura", header: "N° Factura", render: (r) => <span className="cell-strong">{r.numero_factura}</span> },
    { key: "venta", header: "Venta", render: (r) => `#${r.venta}` },
    { key: "razon_social", header: "Razón social", render: (r) => r.razon_social || "—" },
    { key: "nit_ci", header: "NIT/CI", render: (r) => r.nit_ci || "—" },
    { key: "fecha_emision", header: "Emisión", render: (r) => dateShort(r.fecha_emision) },
    { key: "total", header: "Total", align: "right", render: (r) => currency(r.total) },
    { key: "estado", header: "Estado", render: (r) => <StatusBadge value={r.estado} /> },
  ];

  // Solo consulta: las facturas se emiten automáticamente desde la venta.
  // La única acción manual es anular.
  return (
    <CrudView
      key={version}
      title="Facturación"
      subtitle="Comprobantes emitidos automáticamente por las ventas."
      api={endpoints.facturas}
      idKey="id_factura"
      columns={columns}
      fields={[]}
      write={[]}
      del={[]}
      searchPlaceholder="Buscar por número…"
      rowActionsExtra={(row) =>
        row.estado !== "anulada" ? (
          <button className="row-action danger" title="Anular factura" onClick={() => anular(row)}>
            <Icon name="x" size={15} />
          </button>
        ) : null
      }
    />
  );
}
