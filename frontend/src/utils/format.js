export const currency = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
    minimumFractionDigits: 2,
  }).format(n);
};

export const number = (v) => {
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("es-BO").format(n);
};

export const dateShort = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
};

export const dateTime = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const initials = (text = "") => {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
