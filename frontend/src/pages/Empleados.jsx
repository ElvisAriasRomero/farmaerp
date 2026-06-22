import CrudView from "../components/CrudView.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { endpoints } from "../services/api.js";
import useOptions from "../hooks/useOptions.js";
import { currency, dateShort, initials } from "../utils/format.js";
import { ESTADO_EMPLEADO } from "../config/choices.js";

export default function Empleados() {
  const roles = useOptions(endpoints.roles, (r) => ({
    value: r.id_rol,
    label: r.nombre_rol,
  }));

  const columns = [
    {
      key: "nombre",
      header: "Empleado",
      render: (r) => (
        <div className="u-flex u-items-center u-gap-12">
          <span className="avatar" style={{ width: 34, height: 34 }}>{initials(r.nombre || r.email)}</span>
          <div>
            <div className="cell-strong">{r.nombre}</div>
            <div className="text-soft" style={{ fontSize: 12 }}>{r.email}</div>
          </div>
        </div>
      ),
    },
    { key: "rol_nombre", header: "Rol", render: (r) => <span className="badge badge--blue badge--plain">{r.rol_nombre || "—"}</span> },
    { key: "telefono", header: "Teléfono", render: (r) => r.telefono || "—" },
    { key: "salario", header: "Salario", align: "right", render: (r) => currency(r.salario) },
    { key: "fecha_contratacion", header: "Contratación", render: (r) => dateShort(r.fecha_contratacion) },
    { key: "estado", header: "Estado", render: (r) => <StatusBadge value={r.estado} /> },
  ];

  const fields = [
    { name: "nombre", label: "Nombre completo", required: true, span: true },
    { name: "email", label: "Correo electrónico", type: "email", required: true },
    { name: "password", label: "Contraseña", type: "password", omitIfEmpty: true },
    { name: "rol", label: "Rol", type: "select", required: true, options: () => roles },
    { name: "estado", label: "Estado", type: "select", options: ESTADO_EMPLEADO, defaultValue: "activo" },
    { name: "salario", label: "Salario (Bs)", type: "number", step: "0.01", min: "0", required: true },
    { name: "fecha_contratacion", label: "Fecha de contratación", type: "date", required: true },
    { name: "fecha_nacimiento", label: "Fecha de nacimiento", type: "date", omitIfEmpty: true },
    { name: "telefono", label: "Teléfono", omitIfEmpty: true },
    { name: "direccion", label: "Dirección", type: "textarea", span: true, omitIfEmpty: true },
  ];

  return (
    <CrudView
      title="Empleados"
      subtitle="Gestión del personal de la farmacia."
      api={endpoints.empleados}
      idKey="id_empleado"
      columns={columns}
      fields={fields}
      modalSize="lg"
      createLabel="Nuevo empleado"
      searchPlaceholder="Buscar empleado…"
      write={["administrador"]}
      del={["administrador"]}
    />
  );
}
