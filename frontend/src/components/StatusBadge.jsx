// Mapeo de estados del backend -> color de badge
const MAP = {
  activo: "green",
  completada: "green",
  completado: "green",
  pagada: "green",
  entregada: "green",
  reservada: "cyan",
  atendida: "green",
  descartada: "slate",
  prophet: "green",
  media_movil: "amber",
  sin_datos: "slate",
  emitida: "blue",
  abierta: "cyan",
  pendiente: "amber",
  vacaciones: "amber",
  convertido_venta: "blue",
  inactivo: "slate",
  cerrada: "slate",
  abandonado: "slate",
  cancelada: "red",
  anulada: "red",
  rechazado: "red",
  generado: "green",
  // métodos de pago
  efectivo: "green",
  qr: "cyan",
  // motivos
  bajo_stock: "amber",
  prediccion_demanda: "blue",
};

const LABELS = {
  convertido_venta: "Convertido",
  prediccion_demanda: "Predicción",
  bajo_stock: "Bajo stock",
  prophet: "Prophet",
  media_movil: "Promedio móvil",
  sin_datos: "Sin datos",
};

export default function StatusBadge({ value }) {
  if (value === null || value === undefined || value === "") return <span className="text-soft">—</span>;
  const key = String(value).toLowerCase();
  const color = MAP[key] || "slate";
  const label = LABELS[key] || String(value).replace(/_/g, " ");
  return (
    <span className={`badge badge--${color}`} style={{ textTransform: "capitalize" }}>
      {label}
    </span>
  );
}
