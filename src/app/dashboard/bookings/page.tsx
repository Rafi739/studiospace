"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock3, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Booking, BookingStatus } from "@/lib/types";

const tabs: Array<"all" | BookingStatus> = ["all", "pending", "confirmed", "completed", "cancelled"];
export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<(typeof tabs)[number]>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { api.myBookings().then((result) => setBookings(result.bookings)).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load bookings.")).finally(() => setLoading(false)); }, []);
  const visible = useMemo(() => filter === "all" ? bookings : bookings.filter((booking) => booking.status === filter), [bookings, filter]);
  async function cancel(booking: Booking) {
    try { const result = await api.cancelBooking(booking.id); setBookings((current) => current.map((item) => item.id === booking.id ? result.booking : item)); toast.success("Booking cancelled."); }
    catch (reason) { toast.error(reason instanceof Error ? reason.message : "Could not cancel booking."); }
  }
  return <div className="dash-page"><div className="dash-page-header"><div><p className="section-kicker">Your plans, all in one place</p><h1>My <em>bookings.</em></h1><p>Keep track of your studio time.</p></div></div>
    <div className="booking-tabs">{tabs.map((tab) => <button key={tab} onClick={() => setFilter(tab)} className={filter === tab ? "selected" : ""}>{tab === "all" ? "All bookings" : tab[0].toUpperCase() + tab.slice(1)}<span>{tab === "all" ? bookings.length : bookings.filter((booking) => booking.status === tab).length}</span></button>)}</div>
    {loading ? <div className="page-loading"><span className="spinner" /> Loading bookings...</div> : error ? <div className="error-panel"><h3>Bookings couldn’t be loaded.</h3><p>{error}</p></div> : visible.length ? <div className="booking-list">{visible.map((booking) => <article className="booking-row" key={booking.id}><div className="booking-row-image">{booking.image && <Image src={booking.image} alt={booking.studioTitle} fill sizes="91px" unoptimized />}</div><div className="booking-row-main"><div className="booking-row-title"><h2>{booking.studioTitle}</h2><span className={`status-pill status-${booking.status}`}>{booking.status}</span></div><div className="booking-row-details"><span><CalendarDays size={14} />{new Date(`${booking.bookingDate}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span><span><Clock3 size={14} />{booking.startTime} – {booking.endTime}</span><strong>${booking.totalPrice.toFixed(2)}</strong></div></div>{["pending", "confirmed"].includes(booking.status) && <button className="cancel-booking" onClick={() => cancel(booking)}><X size={14} /> Cancel</button>}</article>)}</div> : <div className="dashboard-empty"><MapPin size={24} /><strong>{filter === "all" ? "No bookings just yet" : `No ${filter} bookings`}</strong><p>Explore studios and find a space that feels made for your next project.</p><Link className="text-link" href="/studios">Explore studios →</Link></div>}
  </div>;
}
