import CrudView from "../components/CrudView.jsx";
import { endpoints } from "../services/api.js";
import { dateShort } from "../utils/format.js";

const OP_COLOR = { INSERT: "green", UPDATE: "amber", DELETE: "red" };

export default function Auditoria() {
  const columns = [
    { key: "id_bitacora", header: "#", render: (r) => <span className="cell-strong">#{r.id_bitacora}</span> },
    { key: "empleado_nombre", header: "Empleado", render: (r) => r.empleado_nombre || "Sistema" },
    { key: "tabla_afectada", header: "Tabla", render: (r) => <span className="badge badge--slate badge--plain">{r.tabla_afectada}</span> },
    {
      key: "tipo_operacion",
      header: "Operación",
      render: (r) => <span className={`badge badge--${OP_COLOR[r.tipo_operacion] || "slate"}`}>{r.tipo_operacion}</span>,
    },
    { key: "ip_origen", header: "IP origen", render: (r) => <span className="cell-mono">{r.ip_origen || "—"}</span> },
    {
      key: "fecha_operacion",
      header: "Fecha / hora",
      render: (r) => (
        <span>{dateShort(r.fecha_operacion)} {r.hora_operacion ? `· ${String(r.hora_operacion).slice(0, 5)}` : ""}</span>
      ),
    },
  ];

  return (
    <CrudView
      title="Auditoría"
      subtitle="Bitácora de operaciones realizadas en el sistema."
      api={endpoints.bitacora}
      idKey="id_bitacora"
      columns={columns}
      fields={[]}
      searchPlaceholder="Buscar en la bitácora…"
      write={[]}
      del={[]}
    />
  );
}
