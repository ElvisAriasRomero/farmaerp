import CrudView from "../components/CrudView.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { endpoints } from "../services/api.js";
import { dateTime } from "../utils/format.js";
import { TIPO_USUARIO } from "../config/choices.js";

export default function Usuarios() {
  const columns = [
    { key: "email", header: "Correo", render: (r) => <span className="cell-strong">{r.email}</span> },
    {
      key: "tipo",
      header: "Tipo",
      render: (r) => <span className="badge badge--slate badge--plain" style={{ textTransform: "capitalize" }}>{r.tipo}</span>,
    },
    {
      key: "is_active",
      header: "Estado",
      render: (r) => <StatusBadge value={r.is_active ? "activo" : "inactivo"} />,
    },
    {
      key: "is_superuser",
      header: "Rol",
      render: (r) =>
        r.is_superuser ? <span className="badge badge--blue">Superusuario</span>
        : r.is_staff ? <span className="badge badge--cyan">Staff</span>
        : <span className="text-soft">—</span>,
    },
    { key: "last_login", header: "Último acceso", render: (r) => dateTime(r.last_login) },
  ];

  const fields = [
    { name: "email", label: "Correo electrónico", type: "email", required: true, span: true },
    { name: "tipo", label: "Tipo de usuario", type: "select", required: true, options: TIPO_USUARIO },
    {
      name: "is_active", label: "Estado", type: "select", defaultValue: "true",
      options: [{ value: "true", label: "Activo" }, { value: "false", label: "Inactivo" }],
    },
  ];

  return (
    <CrudView
      title="Usuarios"
      subtitle="Cuentas de acceso al sistema."
      api={endpoints.usuarios}
      idKey="id_usuario"
      columns={columns}
      fields={fields}
      createLabel="Nuevo usuario"
      searchPlaceholder="Buscar por correo…"
      write={["administrador"]}
      del={["administrador"]}
      transform={(p) => ({ ...p, is_active: p.is_active === "true" || p.is_active === true })}
    />
  );
}
