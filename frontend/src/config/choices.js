// Valores de TextChoices del backend (apps/*/models.py)
export const ESTADO_CLIENTE = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" },
];
export const ESTADO_EMPLEADO = [
  { value: "activo", label: "Activo" },
  { value: "vacaciones", label: "Vacaciones" },
];
export const TIPO_USUARIO = [
  { value: "cliente", label: "Cliente" },
  { value: "empleado", label: "Empleado" },
];
export const ESTADO_COMPRA = [
  { value: "pendiente", label: "Pendiente" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
];
export const ESTADO_VENTA = [
  { value: "pendiente", label: "Pendiente" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
];
export const ESTADO_FACTURA = [
  { value: "emitida", label: "Emitida" },
  { value: "pagada", label: "Pagada" },
  { value: "anulada", label: "Anulada" },
];
export const METODO_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "qr", label: "QR" },
];
export const ESTADO_PAGO = [
  { value: "pendiente", label: "Pendiente" },
  { value: "completado", label: "Completado" },
  { value: "rechazado", label: "Rechazado" },
];
export const ESTADO_CAJA = [
  { value: "abierta", label: "Abierta" },
  { value: "cerrada", label: "Cerrada" },
];
export const TIPO_REPORTE = [
  { value: "ventas", label: "Ventas" },
  { value: "compra", label: "Compra" },
  { value: "inventario", label: "Inventario" },
];
export const FORMATO_REPORTE = [
  { value: "PDF", label: "PDF" },
  { value: "Excel", label: "Excel" },
];
export const PERIODO = [
  { value: "diario", label: "Diario" },
  { value: "semanal", label: "Semanal" },
  { value: "mensual", label: "Mensual" },
  { value: "trimestral", label: "Trimestral" },
  { value: "anual", label: "Anual" },
];

export const ESTADO_SUGERENCIA = [
  { value: "pendiente", label: "Pendiente" },
  { value: "atendida", label: "Atendida" },
  { value: "descartada", label: "Descartada" },
];
export const MOTIVO_SUGERENCIA = [
  { value: "bajo_stock", label: "Bajo stock" },
  { value: "prediccion_demanda", label: "Predicción de demanda" },
];
