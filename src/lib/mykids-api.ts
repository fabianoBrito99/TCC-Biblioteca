const API_PROXY = "/api/a6b7e9c4f";

export type Room = { id: number; name: string; age_range: string; is_open: number | boolean };
export type Child = { id: number; guardian_id: number; name: string; birth_date: string | null; gender: "M" | "F" | null; notes: string | null; room_id: number | null; room_name?: string | null; checkins_count: number };
export type Guardian = { id: number; name: string; email: string | null; phone: string | null; gender: "M" | "F" | null; status: "visitante" | "familia"; children: Child[] };
export type PublicCheckinChild = { child_id: number; child_name_snapshot: string; child_birth_date_snapshot: string | null; child_notes_snapshot: string | null; room_name_snapshot: string; arrival_number: number | null; checked_out_at: string | null; created_at: string };
export type Checkin = { id?: number; public_code: string; guardian_id?: number; child_id?: number; room_id?: number; arrival_number?: number | null; checked_out_at?: string | null; guardian_label_needed?: boolean; children?: PublicCheckinChild[]; child_name_snapshot: string; guardian_name_snapshot: string; guardian_email_snapshot: string | null; guardian_phone_snapshot: string | null; child_birth_date_snapshot: string | null; child_notes_snapshot: string | null; room_name_snapshot: string; created_at: string };
export type PrinterSettings = { id: number; printer_name: string | null; bridge_url: string | null; bridge_token?: string | null; bridge_online?: boolean; label_width: number; label_height: number; is_active: number | boolean };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_PROXY}${path}`, { ...init, headers, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.erro || "Não foi possível concluir a operação");
  if (response.status === 204) return null as T;
  return data as T;
}

export const myKidsApi = {
  rooms: () => request<Room[]>("/mykids/rooms"),
  createRoom: (body: Partial<Room>) => request<Room>("/mykids/rooms", { method: "POST", body: JSON.stringify(body) }),
  updateRoom: (id: number, body: Partial<Room>) => request<Room>(`/mykids/rooms/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  guardians: (search = "") => request<Guardian[]>(`/mykids/guardians${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  createGuardian: (body: unknown) => request<Guardian>("/mykids/guardians", { method: "POST", body: JSON.stringify(body) }),
  updateGuardian: (id: number, body: unknown) => request<Guardian>(`/mykids/guardians/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  updateChild: (id: number, body: unknown) => request<Child>(`/mykids/children/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  createCheckin: (body: { guardian_id: number; child_id: number; room_id: number }) => request<Checkin>("/mykids/checkins", { method: "POST", body: JSON.stringify(body) }),
  checkout: (id: number) => request<{ ok: boolean }>(`/mykids/checkins/${id}/checkout`, { method: "PATCH", body: JSON.stringify({}) }),
  today: () => request<Checkin[]>("/mykids/checkins/today"),
  publicCheckin: (code: string) => request<Checkin>(`/public/mykids/checkins/${encodeURIComponent(code)}`),
  printer: () => request<PrinterSettings | null>("/mykids/printer-settings"),
  updatePrinter: (body: Partial<PrinterSettings>) => request<PrinterSettings>("/mykids/printer-settings", { method: "PATCH", body: JSON.stringify(body) }),
  print: (body: { zpl: string; printer_name?: string }) => request<{ ok: boolean; job_id: number }>("/mykids/print-jobs", { method: "POST", body: JSON.stringify(body) }),
  claimPrint: () => request<{ id: number; zpl: string; printer_name: string | null } | null>("/mykids/print-jobs/claim", { method: "POST", body: JSON.stringify({}) }),
  completePrint: (id: number, body: { ok: boolean; error?: string }) => request<{ ok: boolean }>(`/mykids/print-jobs/${id}/complete`, { method: "POST", body: JSON.stringify(body) }),
};
