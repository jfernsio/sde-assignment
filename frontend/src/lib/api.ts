import type {
  AuthResponse,
  ComplianceDashboard,
  MaintenanceStatus,
  MaintenanceTask,
  SafetyDrill,
  ShipCompliance,
  AttendanceRecord,
  Role,
} from "./types";

const API_BASE_KEY = "maritime.apiBase";
const TOKEN_KEY = "maritime.token";
const USER_KEY = "maritime.user";

export const DEFAULT_API_BASE = "http://localhost:3000/api";

export function getApiBase(): string {
  if (typeof window === "undefined") return DEFAULT_API_BASE;
  return window.localStorage.getItem(API_BASE_KEY) ?? DEFAULT_API_BASE;
}

export function setApiBase(url: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(API_BASE_KEY, url.replace(/\/+$/, ""));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function getStoredUser(): { id: number; email: string; role: Role } | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { id: number; email: string; role: Role };
  } catch {
    return null;
  }
}

export function setStoredUser(user: { id: number; email: string; role: Role } | null): void {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${getApiBase()}${path}`, { ...init, headers });
  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = data as { error?: string; message?: string } | null;
    throw new Error(err?.error ?? err?.message ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string, role: Role) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    }),

  // Maintenance
  listMaintenance: (params: { shipId?: number; status?: MaintenanceStatus } = {}) => {
    const q = new URLSearchParams();
    if (params.shipId) q.set("shipId", String(params.shipId));
    if (params.status) q.set("status", params.status);
    const qs = q.toString();
    return request<{ total: number; tasks: MaintenanceTask[] }>(
      `/maintenance${qs ? `?${qs}` : ""}`,
    );
  },
  createMaintenance: (input: {
    shipId: number;
    title: string;
    description: string;
    dueDate: string;
  }) =>
    request<{ message: string; task: MaintenanceTask }>("/maintenance", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateMaintenance: (
    id: number,
    input: Partial<{
      status: MaintenanceStatus;
      notes: string;
      title: string;
      description: string;
    }>,
  ) =>
    request<{ message: string; task: MaintenanceTask }>(`/maintenance/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  deleteMaintenance: (id: number) =>
    request<{ message: string }>(`/maintenance/${id}`, { method: "DELETE" }),

  // Drills
  listDrills: (params: { shipId?: number; status?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.shipId) q.set("shipId", String(params.shipId));
    if (params.status) q.set("status", params.status);
    const qs = q.toString();
    return request<{ total: number; drills: SafetyDrill[] }>(`/drills${qs ? `?${qs}` : ""}`);
  },
  createDrill: (input: {
    shipId: number;
    title: string;
    description: string;
    scheduledDate: string;
  }) =>
    request<{ message: string; drill: SafetyDrill }>("/drills", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getDrill: (id: number) => request<{ drill: SafetyDrill } | SafetyDrill>(`/drills/${id}`),
  recordAttendance: (drillId: number, attended: boolean) =>
    request<{ message: string; record: AttendanceRecord }>(`/drills/${drillId}/attendance`, {
      method: "POST",
      body: JSON.stringify({ attended }),
    }),
  getAttendance: (drillId: number) =>
    request<{ total: number; attendance: AttendanceRecord[] }>(`/drills/${drillId}/attendance`),
  deleteDrill: (id: number) => request<{ message: string }>(`/drills/${id}`, { method: "DELETE" }),

  // Compliance
  shipCompliance: (shipId: number) => request<ShipCompliance>(`/compliance/ships/${shipId}`),
  complianceDashboard: () => request<ComplianceDashboard>(`/compliance/dashboard`),
};
