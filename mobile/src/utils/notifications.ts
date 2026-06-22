import * as Notifications from "expo-notifications";

/** Solicita permiso de notificaciones (idempotente). */
export async function ensureNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === "granted";
}

/** Notificación local de pedido confirmado (CU13). */
export async function notifyPedidoConfirmado(idVenta: number, total: string) {
  const ok = await ensureNotificationPermission();
  if (!ok) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "✅ Pedido confirmado",
      body: `Tu pedido #${idVenta} fue registrado. Total: ${total}`,
    },
    trigger: null, // inmediata
  });
}
