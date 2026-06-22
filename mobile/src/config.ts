import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * URL base de la API según la plataforma:
 *
 *  - WEB (navegador en la misma PC que el backend) -> localhost.
 *    El navegador alcanza 127.0.0.1:8000 sin problemas de firewall.
 *
 *  - NATIVO (celular / emulador) -> IP de red local de la PC.
 *    En un dispositivo físico NO funciona "localhost"; debe ser la IP LAN.
 *    Además el backend debe correr con:  python manage.py runserver 0.0.0.0:8000
 *    y la IP estar permitida en el firewall de Windows.
 *
 * Configurables en app.json -> expo.extra (apiUrlWeb / apiUrl).
 */
const extra = (Constants.expoConfig?.extra ?? {}) as {
  apiUrl?: string;
  apiUrlWeb?: string;
};

const WEB_URL = extra.apiUrlWeb || "http://localhost:8000/api/v1";
const LAN_URL = extra.apiUrl || "http://192.168.1.30:8000/api/v1";

export const API_URL: string = Platform.OS === "web" ? WEB_URL : LAN_URL;

/** Resuelve rutas de imágenes (`foto`) relativas contra el host del backend. */
export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // API_URL = http://host:8000/api/v1  ->  origin = http://host:8000
  try {
    const origin = API_URL.replace(/\/api\/v1\/?$/, "");
    const rel = path.startsWith("/") ? path : `/${path}`;
    return `${origin}${rel}`;
  } catch {
    return path;
  }
}
