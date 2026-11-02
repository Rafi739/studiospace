"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, CalendarDays, CircleDollarSign, DoorOpen, Plus, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Booking, BookingStatus, DashboardSummary } from "@/lib/types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  useEffect(() => {
    api.dashboard().then(setData).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load dashboard."));
  }, []);
  async function changeStatus(booking: Booking, status: BookingStatus) {
    setUpdating(booking.id);
    try {
      const { booking: updated } = await api.setBookingStatus(booking.id, status);
      setData((current) => current ? { ...current, recentBookings: current.recentBookings.map((item) => item.id === updated.id ? updated : item) } : current);
      const refreshed = await api.dashboard();
      setData(refreshed);
      toast.success(`Booking ${status}.`);
    } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Could not update booking."); }
    finally { setUpdating(null); }
  }
  return <div className="dash-page"><div className="dash-welcome"><div><p className="section-kicker">Your creative corner</p><h1>Make good things<br /><em>happen.</em></h1><p>Here’s what’s going on in your workspace.</p></div><Link href="/dashboard/add-studio" className="button button-lime"><Plus size={16} /> Add a studio</Link></div>
    {error ? <div className="error-panel"><h3>Your workspace couldn’t load.</h3><p>{error}</p></div> : <><div className="stat-grid">{[
      { title: "Your studios", value: data?.studioCount, icon: DoorOpen, accent: "lime" },
      { title: "Total bookings", value: data?.bookingCount, icon: CalendarDays, accent: "blue" },
      { title: "Host earnings", value: data ? `$${data.earnings.toLocaleString()}` : undefined, icon: CircleDollarSign, accent: "peach" },
    ].map(({ title, value, icon: Icon, accent }) => <article className="stat-card" key={title}><span className={`stat-icon ${accent}`}><Icon size={18} /></span><span>{title}</span><strong>{value ?? <i className="skeleton-value" />}</strong><small><TrendingUp size={13} /> From your live activity</small></article>)}</div>
      <section className="dash-panel"><div className="panel-heading"><div><h2>Recent bookings</h2><p>Keep an eye on what’s coming up.</p></div><Link href="/dashboard/bookings" className="text-link">View all <ArrowUpRight size={15} /></Link></div>
        {data?.recentBookings.length ? <div className="recent-list">{data.recentBookings.map((booking) => <div className="recent-row" key={booking.id}><div className="recent-image">{booking.image && <Image src={booking.image} alt="" fill sizes="56px" unoptimized />}</div><div className="recent-info"><strong>{booking.studioTitle}</strong><span>{new Date(`${booking.bookingDate}T00:00:00`).toLocaleDateString()} · {booking.startTime} – {booking.endTime}</span></div><span className={`status-pill status-${booking.status}`}>{booking.status}</span>{booking.status === "pending" && <button className="host-action" disabled={updating === booking.id} onClick={() => changeStatus(booking, "confirmed")}>{updating === booking.id ? "..." : "Confirm"}</button>}{booking.status === "confirmed" && <button className="host-action" disabled={updating === booking.id} onClick={() => changeStatus(booking, "completed")}>{updating === booking.id ? "..." : "Complete"}</button>}</div>)}</div> : <div className="dashboard-empty"><CalendarDays size={23} /><strong>No bookings to show yet</strong><p>Bookings will appear here as soon as someone reserves one of your studios.</p><Link href="/dashboard/add-studio" className="text-link">List your first space <ArrowUpRight size={15} /></Link></div>}
      </section></>}
  </div>;
}
