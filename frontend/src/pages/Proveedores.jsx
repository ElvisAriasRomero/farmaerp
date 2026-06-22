import CrudView from "../components/CrudView.jsx";
import { endpoints } from "../services/api.js";
import Icon from "../components/Icon.jsx";

export default function Proveedores() {
  const columns = [
    {
      key: "nombre",
      header: "Proveedor",
      render: (r) => (
        <div className="u-flex u-items-center u-gap-12">
          <span style={{
            width: 36, height: 36, borderRadius: 9, background: "var(--info-50)",
            color: "var(--info-600)", display: "grid", placeItems: "center", flexShrink: 0,
          }}>
            <Icon name="store" size={18} />
          </span>
          <span className="cell-strong">{r.nombre}</span>
        </div>
      ),
    },
    { key: "email", header: "Correo", render: (r) => r.email || "—" },
    { key: "telefono", header: "Teléfono", render: (r) => r.telefono || "—" },
    { key: "direccion", header: "Dirección", render: (r) => r.direccion || <span className="text-soft">—</span> },
  ];

  const fields = [
    { name: "nombre", label: "Nombre / Razón social", required: true, span: true },
    { name: "email", label: "Correo electrónico", type: "email", omitIfEmpty: true },
    { name: "telefono", label: "Teléfono", omitIfEmpty: true },
    { name: "direccion", label: "Dirección", type: "textarea", span: true, omitIfEmpty: true },
  ];

  return (
    <CrudView
      title="Proveedores"
      subtitle="Directorio de proveedores y laboratorios."
      api={endpoints.proveedores}
      idKey="id_proveedor"
      columns={columns}
      fields={fields}
      createLabel="Nuevo proveedor"
      searchPlaceholder="Buscar proveedor…"
    />
  );
}
