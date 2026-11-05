import type { Booking, BookingStatus, DashboardSummary, Review, Studio } from "@/lib/types";

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
  limit?: number;
}

export const api = {
  studios: (query: StudioQuery = {}) => {
    const params = new URLSearchParams();
    if (query.search) params.set("search", query.search);
    if (query.category) params.set("category", query.category);
    if (query.sort) params.set("sort", query.sort);
    if (query.limit) params.set("limit", String(query.limit));
    const suffix = params.size ? `?${params.toString()}` : "";
    return request<{ studios: Studio[] }>(`/api/studios${suffix}`);
  },
  studio: (id: string) =>
    request<{ studio: Studio }>(`/api/studios/${encodeURIComponent(id)}`),
  studioAvailability: (id: string, date: string, duration: number) => {
    const params = new URLSearchParams({ date, duration: String(duration) });
    return request<{ startTimes: string[] }>(
      `/api/studios/${encodeURIComponent(id)}/availability?${params.toString()}`,
    );
  },
  studioReviews: (id: string) =>
    request<{ reviews: Review[]; hasReviewed: boolean }>(`/api/studios/${encodeURIComponent(id)}/reviews`),
  createReview: (id: string, data: { rating: number; comment: string }) =>
    request<{ review: Review; rating: number; reviewCount: number }>(
      `/api/studios/${encodeURIComponent(id)}/reviews`,
      { method: "POST", body: JSON.stringify(data) },
    ),
  createStudio: (data: Omit<Studio, "id" | "hostId" | "hostName" | "createdAt">) =>
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
  hostBookings: () => request<{ bookings: Booking[] }>("/api/bookings/host"),
  booking: (id: string) =>
    request<{ booking: Booking }>(`/api/bookings/${encodeURIComponent(id)}`),
  cancelBooking: (id: string) =>
    request<{ booking: Booking }>(
      `/api/bookings/${encodeURIComponent(id)}/cancel`,
      { method: "PATCH" },
    ),
  setBookingStatus: (id: string, status: Exclude<BookingStatus, "pending">) =>
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
  uploadImage: (file: File, onProgress?: (progress: number) => void) =>
    new Promise<{ url: string }>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("POST", `${API_URL}/api/uploads/images`);
      request.withCredentials = true;
      request.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
      };
      request.onerror = () => reject(new ApiError("Can’t reach StudioSpace right now. Please try again.", 0));
      request.onload = () => {
        let body: unknown;
        try {
          body = JSON.parse(request.responseText);
        } catch {
          body = {};
        }
        if (request.status < 200 || request.status >= 300) {
          const message =
            typeof body === "object" &&
            body !== null &&
            "error" in body &&
            typeof body.error === "string"
              ? body.error
              : "Could not upload this image. Please try again.";
          reject(new ApiError(message, request.status));
          return;
        }
        if (
          typeof body !== "object" ||
          body === null ||
          !("url" in body) ||
          typeof body.url !== "string"
        ) {
          reject(new ApiError("The image server returned an invalid response.", request.status));
          return;
        }
        resolve({ url: body.url });
      };
      const formData = new FormData();
      formData.append("image", file);
      request.send(formData);
    }),
  subscribe: (email: string) =>
    request<{ success: true }>("/api/newsletter", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
};
