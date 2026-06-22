import CrudView from "../components/CrudView.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Icon from "../components/Icon.jsx";
import { endpoints, reportesApi, parseApiError } from "../services/api.js";
import useOptions from "../hooks/useOptions.js";
import { useToast } from "../context/ToastContext.jsx";
import { dateShort, dateTime } from "../utils/format.js";
import { TIPO_REPORTE, FORMATO_REPORTE } from "../config/choices.js";

export default function Reportes() {
  const toast = useToast();
  const empleados = useOptions(endpoints.empleados, (e) => ({
    value: e.id_empleado,
    label: e.nombre,
  }));

  const descargar = async (row) => {
    try {
      await reportesApi.descargar(row);
    } catch (err) {
      toast.error("No se pudo descargar", parseApiError(err));
    }
  };

  const columns = [
    { key: "id_reporte", header: "#", render: (r) => <span className="cell-strong">#{r.id_reporte}</span> },
    { key: "tipo", header: "Tipo", render: (r) => <span className="badge badge--blue badge--plain" style={{ textTransform: "capitalize" }}>{r.tipo}</span> },
    { key: "formato", header: "Formato", render: (r) => <span className="badge badge--slate badge--plain">{r.formato}</span> },
    { key: "periodo", header: "Período", render: (r) => `${dateShort(r.fecha_inicio)} - ${dateShort(r.fecha_fin)}` },
    { key: "empleado_nombre", header: "Generado por", render: (r) => r.empleado_nombre || "-" },
    { key: "estado", header: "Estado", render: (r) => <StatusBadge value={r.estado} /> },
    { key: "fecha_generacion", header: "Fecha", render: (r) => dateTime(r.fecha_generacion) },
  ];

  const fields = [
    { name: "tipo", label: "Tipo de reporte", type: "select", required: true, options: TIPO_REPORTE },
    { name: "formato", label: "Formato", type: "select", required: true, options: FORMATO_REPORTE },
    { name: "fecha_inicio", label: "Fecha inicio", type: "date", omitIfEmpty: true },
    { name: "fecha_fin", label: "Fecha fin", type: "date", omitIfEmpty: true },
    { name: "empleado", label: "Generado por", type: "select", options: () => empleados, omitIfEmpty: true },
  ];

  return (
    <CrudView
      title="Reportes"
      subtitle="Reportes generados del sistema."
      api={endpoints.reportes}
      idKey="id_reporte"
      columns={columns}
      fields={fields}
      createLabel="Generar reporte"
      searchPlaceholder="Buscar reporte..."
      rowActionsExtra={(row) => (
        <button className="row-action ok" title="Descargar archivo" onClick={() => descargar(row)}>
          <Icon name="download" size={15} />
        </button>
      )}
    />
  );
}
