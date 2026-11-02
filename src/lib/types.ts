export type StudioCategory =
  | "Photo Studio"
  | "Podcast Room"
  | "Sound Stage"
  | "Music Studio"
  | "Art Workshop";

export interface Studio {
  id: string;
  title: string;
  category: StudioCategory;
  description: string;
  images: string[];
  hourlyRate: number;
  securityDeposit: number;
  location: string;
  capacity: number;
  amenities: string[];
  hostId: string;
  createdAt: string;
  rating?: number;
  reviewCount?: number;
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

export interface Booking {
  id: string;
  studioId: string;
  studioTitle: string;
  image: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: BookingStatus;
}

export interface DashboardSummary {
  studioCount: number;
  bookingCount: number;
  earnings: number;
  recentBookings: Booking[];
}
