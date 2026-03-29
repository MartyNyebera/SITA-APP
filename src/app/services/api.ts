const BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3010/api";

function getToken(): string | null {
  return localStorage.getItem("sita_token");
}

export function saveAuth(token: string, user: unknown, role: "user" | "driver" | "admin") {
  localStorage.setItem("sita_token", token);
  localStorage.setItem("sita_user", JSON.stringify(user));
  localStorage.setItem("sita_role", role);
}

export function clearAuth() {
  localStorage.removeItem("sita_token");
  localStorage.removeItem("sita_user");
  localStorage.removeItem("sita_role");
}

export function getStoredUser<T = Record<string, unknown>>(): T | null {
  const raw = localStorage.getItem("sita_user");
  return raw ? (JSON.parse(raw) as T) : null;
}

export function getStoredRole(): "user" | "driver" | "admin" | null {
  return localStorage.getItem("sita_role") as "user" | "driver" | "admin" | null;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data as T;
}

// ─── Auth ────────────────────────────────────────────────────

export const authApi = {
  customerRegister: (body: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
  }) => request<{ success: boolean; token: string; user: unknown }>("/auth/customer/register", {
    method: "POST",
    body: JSON.stringify(body),
  }),

  customerLogin: (body: { phone: string; password: string }) =>
    request<{ success: boolean; token: string; user: unknown }>("/auth/customer/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  driverRegister: (body: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
    plateNumber: string;
    vehicleModel: string;
    vehicleColor: string;
    licenseUrl?: string;
  }) => request<{ success: boolean; token: string; driver: unknown }>("/auth/driver/register", {
    method: "POST",
    body: JSON.stringify(body),
  }),

  driverLogin: (body: { phone: string; password: string }) =>
    request<{ success: boolean; token: string; driver: unknown }>("/auth/driver/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getMe: () =>
    request<{ success: boolean; data: unknown; role: string }>("/auth/me"),
};

// ─── Rides ───────────────────────────────────────────────────

export const ridesApi = {
  create: (body: {
    pickupAddress: string;
    pickupLatitude: number;
    pickupLongitude: number;
    dropoffAddress: string;
    dropoffLatitude: number;
    dropoffLongitude: number;
    paymentMethod?: string;
  }) => request<{ success: boolean; data: RideData }>("/rides", {
    method: "POST",
    body: JSON.stringify(body),
  }),

  get: (rideId: string) =>
    request<{ success: boolean; data: RideData }>(`/rides/${rideId}`),

  cancel: (rideId: string, reason?: string) =>
    request<{ success: boolean; data: RideData }>(`/rides/${rideId}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),

  rate: (rideId: string, rating: number) =>
    request<{ success: boolean; data: RideData }>(`/rides/${rideId}/rate`, {
      method: "PATCH",
      body: JSON.stringify({ rating }),
    }),

  accept: (rideId: string) =>
    request<{ success: boolean; data: RideData }>(`/rides/${rideId}/accept`, {
      method: "PATCH",
    }),

  arrived: (rideId: string) =>
    request<{ success: boolean; data: RideData }>(`/rides/${rideId}/arrived`, {
      method: "PATCH",
    }),

  start: (rideId: string) =>
    request<{ success: boolean; data: RideData }>(`/rides/${rideId}/start`, {
      method: "PATCH",
    }),

  complete: (rideId: string) =>
    request<{ success: boolean; data: RideData }>(`/rides/${rideId}/complete`, {
      method: "PATCH",
    }),
};

// ─── Drivers ─────────────────────────────────────────────────

export const driversApi = {
  updateStatus: (driverId: string, isOnline: boolean) =>
    request(`/drivers/${driverId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isOnline }),
    }),

  updateLocation: (driverId: string, latitude: number, longitude: number, rideId?: string) =>
    request(`/drivers/${driverId}/location`, {
      method: "PATCH",
      body: JSON.stringify({ latitude, longitude, rideId }),
    }),

  getEarnings: (driverId: string, period?: string) =>
    request(`/drivers/${driverId}/earnings${period ? `?period=${period}` : ""}`),

  getRides: (driverId: string) =>
    request(`/drivers/${driverId}/rides`),
};

// ─── Users ───────────────────────────────────────────────────

export const usersApi = {
  getRides: (userId: string) =>
    request<{ success: boolean; data: RideData[] }>(`/users/${userId}/rides`),

  getWallet: (userId: string) =>
    request(`/users/${userId}/wallet`),

  getNotifications: (userId: string) =>
    request(`/users/${userId}/notifications`),

  markNotificationsRead: (userId: string) =>
    request(`/users/${userId}/notifications/read`, { method: "PATCH" }),
};

// ─── Types ───────────────────────────────────────────────────

export interface RideData {
  id: string;
  status: string;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  dropoff_address: string;
  dropoff_latitude: number;
  dropoff_longitude: number;
  distance_km: number;
  fare_amount: number;
  payment_method: string;
  driver_id?: string;
  customer_id?: string;
  driver_first_name?: string;
  driver_last_name?: string;
  driver_phone?: string;
  plate_number?: string;
  vehicle_model?: string;
  customer_first_name?: string;
  customer_last_name?: string;
  customer_phone?: string;
}

export interface UserData {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  wallet_balance: number;
  total_rides: number;
  average_rating: number;
  profile_photo_url?: string;
}

export interface DriverData {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  plate_number: string;
  vehicle_model: string;
  vehicle_color: string;
  verification_status: string;
  is_online: boolean;
  total_rides: number;
  total_earnings: number;
  average_rating: number;
}
