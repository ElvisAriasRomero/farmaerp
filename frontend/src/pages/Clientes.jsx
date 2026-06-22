import CrudView from "../components/CrudView.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { endpoints } from "../services/api.js";
import { dateShort, initials } from "../utils/format.js";
import { ESTADO_CLIENTE } from "../config/choices.js";

export default function Clientes() {
  const columns = [
    {
      key: "nombre",
      header: "Cliente",
      render: (r) => (
        <div className="u-flex u-items-center u-gap-12">
          <span className="avatar" style={{ width: 34, height: 34 }}>{initials(r.nombre || r.email)}</span>
          <div>
            <div className="cell-strong">{r.nombre || "Sin nombre"}</div>
            <div className="text-soft" style={{ fontSize: 12 }}>{r.email}</div>
          </div>
        </div>
      ),
    },
    { key: "telefono", header: "Teléfono", render: (r) => r.telefono || "—" },
    { key: "direccion", header: "Dirección", render: (r) => r.direccion || <span className="text-soft">—</span> },
    { key: "estado", header: "Estado", render: (r) => <StatusBadge value={r.estado} /> },
    { key: "fecha_registro", header: "Registro", render: (r) => dateShort(r.fecha_registro) },
  ];

  const fields = [
    { name: "nombre", label: "Nombre completo", required: true, span: true },
    { name: "email", label: "Correo electrónico", type: "email", required: true, hint: "Se usará como usuario de acceso." },
    { name: "password", label: "Contraseña", type: "password", required: false, omitIfEmpty: true },
    { name: "telefono", label: "Teléfono", omitIfEmpty: true },
    { name: "estado", label: "Estado", type: "select", options: ESTADO_CLIENTE, defaultValue: "activo" },
    { name: "direccion", label: "Dirección", type: "textarea", span: true, omitIfEmpty: true },
  ];

  return (
    <CrudView
      title="Clientes"
      subtitle="Directorio de clientes de la farmacia."
      api={endpoints.clientes}
      idKey="id_cliente"
      columns={columns}
      fields={fields}
      modalSize="lg"
      createLabel="Nuevo cliente"
      searchPlaceholder="Buscar cliente…"
    />
  );
}
