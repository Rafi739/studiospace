import type { Booking, BookingStatus, DashboardSummary, Studio } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(init?.body && !(init.body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError("Can’t reach StudioSpace right now. Please try again.", 0);
  }

  const body: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "Something went wrong. Please try again.";
    throw new ApiError(message, response.status);
  }
  return body as T;
}

export interface StudioQuery {
  search?: string;
  category?: string;
  sort?: "rating" | "price-low" | "price-high";
}

export const api = {
  studios: (query: StudioQuery = {}) => {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    if (query.category) params.set("category", query.category);
    if (query.sort) params.set("sort", query.sort);
    const suffix = params.size ? `?${params.toString()}` : "";
    return request<{ studios: Studio[] }>(`/api/studios${suffix}`);
  },
  studio: (id: string) =>
    request<{ studio: Studio }>(`/api/studios/${encodeURIComponent(id)}`),
  createStudio: (data: Omit<Studio, "id" | "hostId" | "createdAt">) =>
    request<{ studio: Studio }>("/api/studios", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateStudio: (id: string, data: Partial<Studio>) =>
    request<{ studio: Studio }>(`/api/studios/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteStudio: (id: string) =>
    request<{ success: true }>(`/api/studios/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  createBooking: (data: {
    studioId: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
  }) =>
    request<{ booking: Booking }>("/api/bookings", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  myBookings: () => request<{ bookings: Booking[] }>("/api/bookings/my"),
  booking: (id: string) =>
    request<{ booking: Booking }>(`/api/bookings/${encodeURIComponent(id)}`),
  cancelBooking: (id: string) =>
    request<{ booking: Booking }>(
      `/api/bookings/${encodeURIComponent(id)}/cancel`,
      { method: "PATCH" },
    ),
  setBookingStatus: (id: string, status: BookingStatus) =>
    request<{ booking: Booking }>(
      `/api/bookings/${encodeURIComponent(id)}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) },
    ),
  myStudios: () => request<{ studios: Studio[] }>("/api/studios/mine"),
  dashboard: () => request<DashboardSummary>("/api/dashboard"),
  updateProfile: (data: { name: string; image?: string }) =>
    request<{ user: { id: string; name: string; email: string; image?: string } }>(
      "/api/users/me",
      { method: "PATCH", body: JSON.stringify(data) },
    ),
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return request<{ url: string }>("/api/uploads/images", {
      method: "POST",
      body: formData,
    });
  },
  subscribe: (email: string) =>
    request<{ success: true }>("/api/newsletter", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
};
