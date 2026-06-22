import CrudView from "../components/CrudView.jsx";
import { endpoints } from "../services/api.js";
import { dateShort } from "../utils/format.js";
import Icon from "../components/Icon.jsx";

export default function Roles() {
  const columns = [
    {
      key: "nombre_rol",
      header: "Rol",
      render: (r) => (
        <div className="u-flex u-items-center u-gap-12">
          <span style={{
            width: 36, height: 36, borderRadius: 9, background: "var(--brand-50)",
            color: "var(--brand-700)", display: "grid", placeItems: "center",
          }}>
            <Icon name="shield" size={18} />
          </span>
          <span className="cell-strong">{r.nombre_rol}</span>
        </div>
      ),
    },
    { key: "fecha_creacion", header: "Creado", render: (r) => dateShort(r.fecha_creacion) },
  ];

  const fields = [
    { name: "nombre_rol", label: "Nombre del rol", required: true, span: true, placeholder: "Ej. Administrador, Cajero…" },
  ];

  return (
    <CrudView
      title="Roles"
      subtitle="Roles del personal y sus permisos."
      api={endpoints.roles}
      idKey="id_rol"
      columns={columns}
      fields={fields}
      createLabel="Nuevo rol"
      searchPlaceholder="Buscar rol…"
      write={["administrador"]}
      del={["administrador"]}
    />
  );
}
