import type { Shipment, ShipmentInput } from "./types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(
  /\/$/,
  "",
);

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `تعذر تنفيذ الطلب (${response.status})`;
    try {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body.detail === "string") {
        message = body.detail;
      } else if (Array.isArray(body.detail)) {
        const messages = body.detail.flatMap((item: unknown) => {
          if (
            typeof item === "object" &&
            item !== null &&
            "msg" in item &&
            typeof item.msg === "string"
          ) {
            return [item.msg];
          }
          return [];
        });
        if (messages.length) message = messages.join("، ");
      }
    } catch {
      // Keep the HTTP status message when the response has no JSON body.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export interface AuthUser {
  id: number;
  email: string;
  created_at: string;
}

export const authApi = {
  me: () => request<AuthUser>("/auth/me"),
  login: (email: string, password: string) =>
    request<AuthUser>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string) =>
    request<AuthUser>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () =>
    request<void>("/auth/logout", {
      method: "POST",
    }),
};

export const shipmentApi = {
  list: () => request<Shipment[]>("/shipments?skip=0&limit=1000"),
  create: (shipment: ShipmentInput) =>
    request<Shipment>("/shipments", {
      method: "POST",
      body: JSON.stringify(shipment),
    }),
  update: (id: number, shipment: ShipmentInput) =>
    request<Shipment>(`/shipments/${id}`, {
      method: "PUT",
      body: JSON.stringify(shipment),
    }),
  remove: (id: number) =>
    request<void>(`/shipments/${id}`, { method: "DELETE" }),
};
