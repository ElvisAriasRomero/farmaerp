import { useParams } from "react-router-dom";
import DocumentForm from "../components/DocumentForm.jsx";
import VentaPOS from "../components/VentaPOS.jsx";
import { endpoints } from "../services/api.js";
import useOptions from "../hooks/useOptions.js";
import { ESTADO_VENTA } from "../config/choices.js";

export default function VentaForm() {
  const { id } = useParams();
  const editing = !!id;

  const productos = useOptions(endpoints.productos, (p) => ({
    value: p.id_producto,
    label: p.nombre,
    price: Number(p.precio_venta),
    factor: Number(p.unidades_por_empaque || 1),
    stock: Number(p.stock_actual || 0),
  }));
  const clientes = useOptions(endpoints.clientes, (c) => ({
    value: c.id_cliente,
    label: c.nombre || c.email,
  }));
  const empleados = useOptions(endpoints.empleados, (e) => ({
    value: e.id_empleado,
    label: e.nombre,
  }));

  // CREAR -> flujo POS (productos + pago + factura)
  if (!editing) {
    return <VentaPOS productos={productos} clientes={clientes} empleados={empleados} />;
  }

  // EDITAR -> cabecera + estado (lineas de solo lectura)
  const headerFields = [
    { name: "cliente", label: "Cliente", type: "select", options: () => clientes, placeholder: "Consumidor final" },
    { name: "empleado", label: "Vendedor", type: "select", required: true, options: () => empleados, placeholder: "Seleccionar vendedor..." },
    { name: "estado", label: "Estado", type: "select", options: ESTADO_VENTA },
  ];

  return (
    <DocumentForm
      title="venta"
      api={endpoints.ventas}
      idKey="id_venta"
      basePath="/panel/ventas"
      headerFields={headerFields}
      productOptions={productos}
      buildPayload={() => ({})}
    />
  );
}
