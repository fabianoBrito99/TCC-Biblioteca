const API_PROXY = "/api/a6b7e9c4f";

export type Room = { id: number; name: string; age_range: string; is_open: number | boolean };
export type Child = { id: number; guardian_id: number; name: string; birth_date: string | null; gender: "M" | "F" | null; has_autism: number | boolean; autism_type: string | null; has_food_restriction: number | boolean; food_restriction_notes: string | null; notes: string | null; room_id: number | null; room_name?: string | null; checkins_count: number };
export type Guardian = { id: number; name: string; email: string | null; phone: string | null; gender: "M" | "F" | null; status: "visitante" | "familia"; children: Child[] };
export type PublicCheckinChild = { child_id: number; child_name_snapshot: string; child_birth_date_snapshot: string | null; child_has_autism_snapshot: number | boolean; child_autism_type_snapshot: string | null; child_has_food_restriction_snapshot: number | boolean; child_food_restriction_notes_snapshot: string | null; child_notes_snapshot: string | null; room_name_snapshot: string; arrival_number: number | null; checked_out_at: string | null; created_at: string };
export type Checkin = { id?: number; public_code: string; guardian_id?: number; child_id?: number; room_id?: number; arrival_number?: number | null; checked_out_at?: string | null; guardian_label_needed?: boolean; children?: PublicCheckinChild[]; child_name_snapshot: string; guardian_name_snapshot: string; guardian_email_snapshot: string | null; guardian_phone_snapshot: string | null; child_birth_date_snapshot: string | null; child_has_autism_snapshot: number | boolean; child_autism_type_snapshot: string | null; child_has_food_restriction_snapshot: number | boolean; child_food_restriction_notes_snapshot: string | null; child_notes_snapshot: string | null; room_name_snapshot: string; created_at: string };
export type PrinterSettings = {
  id: number;
  printer_name: string | null;
  detected_printer_name?: string | null;
  bridge_url: string | null;
  bridge_token?: string | null;
  bridge_online?: boolean;
  printer_online?: boolean;
  printer_last_error?: string | null;
  bridge_version?: string | null;
  label_width: number;
  label_height: number;
  is_active: number | boolean;
};
export type RoomCloseAlert = { room_id: number; room_name: string; last_checkin_at: string; auto_close_at: string };
export type RoomHistory = { id: number; room_id: number; room_name: string; opened_at: string; closed_at: string; closed_automatically: number | boolean; children_count: number };
export type PublicRoomChild = { checkin_id: number; child_id: number; name: string; arrival_number: number | null; has_food_restriction: boolean; food_restriction: string | null; checked_in_at: string };
export type PublicRoom = { id: number; name: string; age_range: string; is_open: boolean; quantity: number; restrictions_count: number; children: PublicRoomChild[] };
export type PublicRoomsResponse = { updated_at: string; total: number; restrictions_total: number; rooms: PublicRoom[] };

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
  createChild: (guardianId: number, body: unknown) => request<Child>(`/mykids/guardians/${guardianId}/children`, { method: "POST", body: JSON.stringify(body) }),
  updateChild: (id: number, body: unknown) => request<Child>(`/mykids/children/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  createCheckin: (body: { guardian_id: number; child_id: number; room_id?: number }) => request<Checkin>("/mykids/checkins", { method: "POST", body: JSON.stringify(body) }),
  checkout: (id: number) => request<{ ok: boolean }>(`/mykids/checkins/${id}/checkout`, { method: "PATCH", body: JSON.stringify({}) }),
  today: () => request<Checkin[]>("/mykids/checkins/today"),
  roomCloseAlerts: () => request<RoomCloseAlert[]>("/mykids/room-close-alerts"),
  snoozeRoomClose: (id: number) => request<{ ok: boolean }>(`/mykids/rooms/${id}/snooze-close`, { method: "POST", body: JSON.stringify({}) }),
  roomHistory: () => request<RoomHistory[]>("/mykids/room-history"),
  publicCheckin: (code: string) => request<Checkin>(`/public/mykids/checkins/${encodeURIComponent(code)}`),
  publicRooms: () => request<PublicRoomsResponse>("/public/mykids/rooms"),
  printer: () => request<PrinterSettings | null>("/mykids/printer-settings"),
  updatePrinter: (body: Partial<PrinterSettings>) => request<PrinterSettings>("/mykids/printer-settings", { method: "PATCH", body: JSON.stringify(body) }),
  print: (body: { zpl: string; printer_name?: string }) => request<{ ok: boolean; job_id: number }>("/mykids/print-jobs", { method: "POST", body: JSON.stringify(body) }),
};
