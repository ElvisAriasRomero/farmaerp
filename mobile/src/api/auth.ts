import { api } from "./client";
import type {
  LoginResponse,
  RegistroClientePayload,
  Usuario,
} from "../types";

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/auth/login/", { email, password }),

  me: () => api.get<Usuario>("/auth/me/"),

  logout: (refresh: string) => api.post("/auth/logout/", { refresh }),

  registroCliente: (payload: RegistroClientePayload) =>
    api.post("/auth/register/cliente/", payload),
};
