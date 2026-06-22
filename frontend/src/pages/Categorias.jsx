import CrudView from "../components/CrudView.jsx";
import { endpoints } from "../services/api.js";
import { dateShort } from "../utils/format.js";

export default function Categorias() {
  const columns = [
    { key: "nombre", header: "Categoría", render: (r) => <span className="cell-strong">{r.nombre}</span> },
    { key: "descripcion", header: "Descripción", render: (r) => r.descripcion || <span className="text-soft">—</span> },
    { key: "fecha_creacion", header: "Creada", render: (r) => dateShort(r.fecha_creacion) },
  ];

  const fields = [
    { name: "nombre", label: "Nombre", required: true, span: true, placeholder: "Ej. Analgésicos" },
    { name: "descripcion", label: "Descripción", type: "textarea", span: true, omitIfEmpty: true },
  ];

  return (
    <CrudView
      title="Categorías"
      subtitle="Clasifica los productos del catálogo."
      api={endpoints.categorias}
      idKey="id_categoria"
      columns={columns}
      fields={fields}
      createLabel="Nueva categoría"
    />
  );
}
