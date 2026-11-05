"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  DoorOpen,
  Plus,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Booking, BookingStatus, DashboardSummary } from "@/lib/types";

type BookingActionStatus = Exclude<BookingStatus, "pending">;
type ConfirmationStatus =
  | "rejected"
  | "cancelled";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    booking: Booking;
    status: ConfirmationStatus;
  } | null>(null);
  const actionInProgress = useRef(false);

  useEffect(() => {
    api.dashboard()
      .then(setData)
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : "Could not load dashboard.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function changeStatus(
    booking: Booking,
    status: BookingActionStatus,
  ) {
    if (actionInProgress.current) return;

    actionInProgress.current = true;
    setUpdating(booking.id);

    try {
      const { booking: updated } = await api.setBookingStatus(booking.id, status);
      setData((current) => current
        ? {
          ...current,
          recentBookings: current.recentBookings.map((item) =>
            item.id === updated.id ? updated : item,
          ),
        }
        : current);

      setConfirmation(null);
      toast.success(
        status === "confirmed" ? "Booking confirmed."
          : status === "rejected" ? "Booking rejected."
            : status === "completed" ? "Booking completed."
              : "Booking cancelled.",
      );
      try {
        setData(await api.dashboard());
      } catch (reason) {
        toast.error(reason instanceof Error
          ? `Booking updated, but the dashboard summary could not refresh: ${reason.message}`
          : "Booking updated, but the dashboard summary could not refresh.");
      }
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Could not update booking.");
    } finally {
      actionInProgress.current = false;
      setUpdating(null);
    }
  }

  function confirmAction() {
    if (confirmation && !actionInProgress.current) {
      void changeStatus(confirmation.booking, confirmation.status);
    }
  }

  return (
    <div className="dash-page">
      <div className="dash-welcome">
        <div>
          <p className="section-kicker">Your creative corner</p>
          <h1>Make good things<br /><em>happen.</em></h1>
          <p>Here’s what’s going on in your workspace.</p>
        </div>
        <Link href="/dashboard/add-studio" className="button button-lime">
          <Plus size={16} /> Add a studio
        </Link>
      </div>

      {error ? (
        <div className="error-panel">
          <h3>Your workspace couldn’t load.</h3>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="stat-grid">
            {[
              { title: "Your studios", value: data?.studioCount, icon: DoorOpen, accent: "lime" },
              { title: "Total bookings", value: data?.bookingCount, icon: CalendarDays, accent: "blue" },
              {
                title: "Host earnings",
                value: data ? `$${data.earnings.toLocaleString()}` : undefined,
                icon: CircleDollarSign,
                accent: "peach",
              },
            ].map(({ title, value, icon: Icon, accent }) => (
              <article className="stat-card" key={title}>
                <span className={`stat-icon ${accent}`}><Icon size={18} /></span>
                <span>{title}</span>
                <strong>{value ?? <i className="skeleton-value" />}</strong>
                <small><TrendingUp size={13} /> From your live activity</small>
              </article>
            ))}
          </div>

          <section className="dash-panel">
            <div className="panel-heading">
              <div>
                <h2>Recent bookings</h2>
                <p>Keep an eye on what’s coming up.</p>
              </div>
              <Link href="/dashboard/bookings" className="text-link">
                View all <ArrowUpRight size={15} />
              </Link>
            </div>

            {loading ? (
              <div className="page-loading">
                <span className="spinner" /> Loading recent bookings...
              </div>
            ) : data?.recentBookings.length ? (
              <div className="recent-list">
                {data.recentBookings.map((booking) => (
                  <div className="recent-row" key={booking.id}>
                    <div className="recent-image">
                      {booking.image && (
                        <Image
                          src={booking.image}
                          alt=""
                          fill
                          sizes="56px"
                          unoptimized
                        />
                      )}
                    </div>
                    <div className="recent-info">
                      <strong>{booking.studioTitle}</strong>
                      <span>
                        {new Date(`${booking.bookingDate}T00:00:00`).toLocaleDateString()}
                        {" · "}
                        {booking.startTime} – {booking.endTime}
                      </span>
                    </div>
                    <span className={`status-pill status-${booking.status}`}>
                      {booking.status}
                    </span>
                    {booking.status === "pending" && (
                      <>
                        <button
                          className="host-action"
                          disabled={updating !== null}
                          onClick={() => void changeStatus(booking, "confirmed")}
                        >
                          {updating === booking.id ? "Updating…" : "Confirm"}
                        </button>
                        <button
                          className="cancel-booking"
                          disabled={updating !== null}
                          onClick={() => setConfirmation({ booking, status: "rejected" })}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {booking.status === "confirmed" && (
                      <>
                        <button
                          className="host-action"
                          disabled={updating !== null}
                          onClick={() => void changeStatus(booking, "completed")}
                        >
                          {updating === booking.id ? "Updating…" : "Complete"}
                        </button>
                        <button
                          className="cancel-booking"
                          disabled={updating !== null}
                          onClick={() => setConfirmation({ booking, status: "cancelled" })}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-empty">
                <CalendarDays size={23} />
                <strong>No bookings to show yet</strong>
                <p>Bookings will appear here as soon as someone reserves one of your studios.</p>
                <Link href="/dashboard/add-studio" className="text-link">
                  List your first space <ArrowUpRight size={15} />
                </Link>
              </div>
            )}
          </section>
        </>
      )}

      {confirmation && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && updating === null) {
              setConfirmation(null);
            }
          }}
        >
          <div
            className="confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dashboard-booking-action-title"
            aria-describedby="dashboard-booking-action-description"
            aria-busy={updating !== null}
          >
            <span className="modal-icon"><CalendarDays size={21} /></span>
            <p className="section-kicker">Confirm action</p>
            <h2 id="dashboard-booking-action-title">
              {confirmation.status === "rejected" ? "Reject this booking?" : "Cancel this booking?"}
            </h2>
            <p id="dashboard-booking-action-description">
              {confirmation.status === "rejected"
                ? "The booking will be marked as rejected and this time slot will become available again."
                : "The booking will be cancelled and this time slot will become available again."}
            </p>
            <div className="modal-actions">
              <button
                className="button button-outline"
                disabled={updating !== null}
                onClick={() => setConfirmation(null)}
              >
                Keep booking
              </button>
              <button
                className="button button-danger"
                disabled={updating !== null}
                onClick={confirmAction}
              >
                {updating !== null
                  ? confirmation.status === "rejected" ? "Rejecting…" : "Cancelling…"
                  : confirmation.status === "rejected" ? "Reject booking" : "Cancel booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
