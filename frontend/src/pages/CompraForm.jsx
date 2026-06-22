import { useParams } from "react-router-dom";
import DocumentForm from "../components/DocumentForm.jsx";
import CompraPOS from "../components/CompraPOS.jsx";
import { endpoints } from "../services/api.js";
import useOptions from "../hooks/useOptions.js";

export default function CompraForm() {
  const { id } = useParams();
  const editing = !!id;

  const productos = useOptions(endpoints.productos, (p) => ({
    value: p.id_producto,
    label: p.nombre,
  }));
  const proveedores = useOptions(endpoints.proveedores, (p) => ({
    value: p.id_proveedor,
    label: p.nombre,
  }));
  const empleados = useOptions(endpoints.empleados, (e) => ({
    value: e.id_empleado,
    label: e.nombre,
  }));

  // CREAR -> POS de compra (modelo 2b)
  if (!editing) {
    return <CompraPOS productos={productos} proveedores={proveedores} empleados={empleados} />;
  }

  // EDITAR -> cabecera (líneas de solo lectura)
  const headerFields = [
    { name: "proveedor", label: "Proveedor", type: "select", required: true, options: () => proveedores },
    { name: "empleado", label: "Responsable", type: "select", options: () => empleados, placeholder: "—" },
    { name: "fecha_pedido", label: "Fecha de pedido", type: "date", required: true },
    { name: "fecha_recepcion", label: "Fecha de recepción", type: "date" },
  ];

  return (
    <DocumentForm
      title="compra"
      api={endpoints.compras}
      idKey="id_compra"
      basePath="/panel/compras"
      headerFields={headerFields}
      productOptions={productos}
      buildPayload={() => ({})}
    />
  );
}
