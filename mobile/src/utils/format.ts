/** Formatea un número/decimal como moneda (Bs.). */
export function formatMoney(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return `Bs. ${n.toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Formatea una fecha ISO a algo legible (dd/mm/yyyy hh:mm). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  reservada: "Reservada",
  pagada: "Pagada",
  entregada: "Entregada",
  completada: "Completada",
  cancelada: "Cancelada",
};

export function estadoLabel(estado: string): string {
  return ESTADO_LABEL[estado] ?? estado;
}
