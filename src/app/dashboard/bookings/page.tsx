"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CalendarDays, CalendarPlus, Clock3, Eye, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Booking, BookingStatus } from "@/lib/types";

const tabs = ["all", "upcoming", "completed", "cancelled"] as const;
type BookingView = "my" | "host";
type BookingFilter = (typeof tabs)[number];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [view, setView] = useState<BookingView>("my");
  const [filter, setFilter] = useState<BookingFilter>("all");
  const [loadedView, setLoadedView] = useState<BookingView | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    let active = true;
    const request = view === "my" ? api.myBookings() : api.hostBookings();
    request.then((result) => {
      if (active) {
        setBookings(result.bookings);
        setError("");
      }
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not load bookings.");
    }).finally(() => {
      if (active) setLoadedView(view);
    });
    return () => { active = false; };
  }, [view, reloadKey]);

  const loading = loadedView !== view;
  const visible = useMemo(() => filter === "all"
    ? bookings
    : filter === "upcoming"
      ? bookings.filter((booking) => booking.status === "pending" || booking.status === "confirmed")
      : bookings.filter((booking) => booking.status === filter), [bookings, filter]);

  async function cancel(booking: Booking) {
    try {
      const result = view === "my"
        ? await api.cancelBooking(booking.id)
        : await api.setBookingStatus(booking.id, "cancelled");
      setBookings((current) => current.map((item) => item.id === booking.id ? result.booking : item));
      toast.success("Booking cancelled.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Could not cancel booking.");
    }
  }

  async function updateStatus(booking: Booking, status: BookingStatus) {
    try {
      const result = await api.setBookingStatus(booking.id, status);
      setBookings((current) => current.map((item) => item.id === booking.id ? result.booking : item));
      toast.success(`Booking ${status}.`);
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Could not update booking.");
    }
  }

  return <div className="dash-page">
    <div className="dash-page-header booking-page-header"><div><p className="section-kicker">Your plans, all in one place</p><h1>{view === "my" ? <>My <em>bookings.</em></> : <>Booking <em>requests.</em></>}</h1><p>{view === "my" ? "Keep track of your studio time." : "Manage bookings for your studios."}</p></div>{view === "my" && <Link href="/studios" className="button button-lime booking-explore-button"><CalendarPlus size={17} />Book a Studio</Link>}</div>
    <div className="booking-tabs">
      {(["my", "host"] as const).map((nextView) => <button key={nextView} onClick={() => setView(nextView)} className={view === nextView ? "selected" : ""}>{nextView === "my" ? "My bookings" : "Incoming requests"}</button>)}
    </div>
    <div className="booking-tabs" aria-label="Filter bookings">{tabs.map((tab) => <button key={tab} onClick={() => setFilter(tab)} className={filter === tab ? "selected" : ""}>{tab === "all" ? "All bookings" : tab[0].toUpperCase() + tab.slice(1)}<span>{tab === "all" ? bookings.length : tab === "upcoming" ? bookings.filter((booking) => booking.status === "pending" || booking.status === "confirmed").length : bookings.filter((booking) => booking.status === tab).length}</span></button>)}</div>
    {loading
      ? <div className="page-loading"><span className="spinner" /> Loading bookings...</div>
      : error && loadedView === view
      ? <div className="error-panel"><h3>Bookings couldn’t be loaded.</h3><p>{error}</p><button className="button button-outline" onClick={() => { setError(""); setLoadedView(null); setReloadKey((current) => current + 1); }}>Try again</button></div>
        : visible.length
          ? <div className="booking-list">{visible.map((booking) => <article className="booking-row" key={booking.id}>
            <div className="booking-row-image">{booking.image && <Image src={booking.image} alt={booking.studioTitle} fill sizes="91px" unoptimized />}</div>
            <div className="booking-row-main">
              <div className="booking-row-title"><h2>{booking.studioTitle}</h2><span className={`status-pill status-${booking.status}`}>{booking.status}</span></div>
              <div className="booking-row-details">
                <span><CalendarDays size={14} />{new Date(`${booking.bookingDate}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                <span><Clock3 size={14} />{booking.startTime} – {booking.endTime} · {(Number(booking.endTime.slice(0, 2)) * 60 + Number(booking.endTime.slice(3)) - Number(booking.startTime.slice(0, 2)) * 60 - Number(booking.startTime.slice(3))) / 60}h</span>
                <strong>${booking.totalPrice.toFixed(2)}</strong>
              </div>
            </div>
            <button type="button" className="booking-details-button" onClick={() => setSelectedBooking(booking)}><Eye size={14} /> Details</button>
            {view === "my" && ["pending", "confirmed"].includes(booking.status) && <button className="cancel-booking" onClick={() => cancel(booking)}><X size={14} /> Cancel</button>}
            {view === "host" && booking.status === "pending" && <>
              <button className="host-action" onClick={() => updateStatus(booking, "confirmed")}>Confirm</button>
              <button className="cancel-booking" onClick={() => cancel(booking)}><X size={14} /> Cancel</button>
            </>}
            {view === "host" && booking.status === "confirmed" && <>
              <button className="host-action" onClick={() => updateStatus(booking, "completed")}>Complete</button>
              <button className="cancel-booking" onClick={() => cancel(booking)}><X size={14} /> Cancel</button>
            </>}
          </article>)}</div>
          : <div className="dashboard-empty">
            <MapPin size={24} />
            <strong>{view === "host"
              ? filter === "all" ? "No incoming bookings yet" : `No ${filter} requests`
              : filter === "all" ? "You haven't booked any studios yet." : `No ${filter} bookings`}</strong>
            <p>{view === "host" ? "Requests for studios you host will appear here." : "Explore studios and find a space that feels made for your next project."}</p>
            {view === "my" && <Link className="button button-lime button-large booking-empty-action" href="/studios"><CalendarPlus size={17} />Explore Studios</Link>}
          </div>}
    {selectedBooking && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedBooking(null); }}><div className="confirm-modal booking-detail-modal" role="dialog" aria-modal="true" aria-labelledby="booking-detail-title"><button className="modal-close" onClick={() => setSelectedBooking(null)} aria-label="Close booking details"><X size={18} /></button><span className="modal-icon"><CalendarDays size={21} /></span><p className="section-kicker">Booking details</p><h2 id="booking-detail-title">{selectedBooking.studioTitle}</h2><dl className="booking-detail-list"><div><dt>Date</dt><dd>{new Date(`${selectedBooking.bookingDate}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</dd></div><div><dt>Time</dt><dd>{selectedBooking.startTime} – {selectedBooking.endTime}</dd></div><div><dt>Duration</dt><dd>{(Number(selectedBooking.endTime.slice(0, 2)) * 60 + Number(selectedBooking.endTime.slice(3)) - Number(selectedBooking.startTime.slice(0, 2)) * 60 - Number(selectedBooking.startTime.slice(3))) / 60} hours</dd></div><div><dt>Total price</dt><dd>${selectedBooking.totalPrice.toFixed(2)}</dd></div><div><dt>Status</dt><dd><span className={`status-pill status-${selectedBooking.status}`}>{selectedBooking.status}</span></dd></div></dl><div className="modal-actions"><Link href={`/studios/${selectedBooking.studioId}`} className="button button-outline">View studio</Link><button className="button button-lime" onClick={() => setSelectedBooking(null)}>Done</button></div></div></div>}
  </div>;
}
