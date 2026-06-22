import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// El backend Django corre en http://localhost:8000 (CORS habilitado para :5173)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
});
