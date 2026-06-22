/**
 * Paleta de colores FarmaERP.
 * Mantiene coherencia visual con el frontend web.
 */
export const colors = {
  primary: "#1F3864",
  primaryDark: "#16284A",
  primaryLight: "#2E4F8F",
  accent: "#2E9E7B",
  accentDark: "#1F7A5E",

  bg: "#F4F6FB",
  surface: "#FFFFFF",
  border: "#E2E8F0",

  text: "#1A202C",
  textMuted: "#64748B",
  textInverse: "#FFFFFF",

  success: "#16A34A",
  warning: "#D97706",
  danger: "#DC2626",
  info: "#2563EB",

  // Estados de venta
  estado: {
    pendiente: "#D97706",
    reservada: "#2563EB",
    pagada: "#16A34A",
    entregada: "#0D9488",
    completada: "#16A34A",
    cancelada: "#DC2626",
  } as Record<string, string>,
};

export type Colors = typeof colors;
