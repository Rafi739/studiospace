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
  hostName: string;
  createdAt: string;
  rating?: number;
  reviewCount?: number;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rejected";

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
