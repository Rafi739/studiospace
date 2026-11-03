"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, CalendarDays, Check, Clock3, Heart, MapPin, ShieldCheck, Star, Users } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site-shell";
import { api, ApiError } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import type { Review, Studio } from "@/lib/types";

export default function StudioDetailsPage() {
  return <Suspense fallback={<SiteLayout darkNavbar><div className="page-loading"><span className="spinner" /> Finding your space...</div></SiteLayout>}><StudioDetails /></Suspense>;
}

function StudioDetails() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const dateInput = useRef<HTMLInputElement>(null);
  const [studio, setStudio] = useState<Studio | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [booking, setBooking] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (dateInput.current) dateInput.current.min = new Date().toISOString().slice(0, 10);
    api.studio(params.id).then((result) => setStudio(result.studio))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Studio not found."))
      .finally(() => setLoading(false));
    api.studioReviews(params.id).then((result) => {
      setReviews(result.reviews);
      setHasReviewed(result.hasReviewed);
    })
      .catch((reason: unknown) => setReviewsError(reason instanceof Error ? reason.message : "Could not load reviews."))
      .finally(() => setReviewsLoading(false));
  }, [params.id]);

  const hours = useMemo(() => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const duration = (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60;
    return Math.max(0, duration);
  }, [startTime, endTime]);
  const total = studio ? hours * studio.hourlyRate : 0;
  async function submitBooking() {
    if (!studio) return;
    if (!date || hours <= 0) { toast.error("Choose a date and a valid time range."); return; }
    setBooking(true);
    try {
      await api.createBooking({ studioId: studio.id, bookingDate: date, startTime, endTime });
      toast.success("Booking request sent!");
      setBookingOpen(false);
      router.push("/dashboard/bookings");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Could not book this studio.");
      if (reason instanceof Error && "status" in reason && reason.status === 401) router.push("/login");
    } finally { setBooking(false); }
  }

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!studio) return;
    setSubmittingReview(true);
    try {
      const result = await api.createReview(studio.id, { rating, comment });
      setReviews((current) => [result.review, ...current]);
      setHasReviewed(true);
      setStudio((current) => current
        ? { ...current, rating: result.rating, reviewCount: result.reviewCount }
        : current);
      setComment("");
      setRating(5);
      toast.success("Your review was submitted.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Could not submit your review.");
      if (reason instanceof ApiError && reason.status === 401) router.push("/login");
    } finally { setSubmittingReview(false); }
  }

  if (loading) return <SiteLayout darkNavbar><div className="page-loading"><span className="spinner" /> Finding your space...</div></SiteLayout>;
  if (!studio || error) return <SiteLayout darkNavbar><div className="error-panel detail-error"><h2>We couldn’t find this studio.</h2><p>{error}</p><Link className="button button-dark" href="/studios"><ArrowLeft size={16} /> Explore studios</Link></div></SiteLayout>;
  const images = studio.images.length ? studio.images : [];

  return <SiteLayout darkNavbar><main className="detail-page">
    <Link href="/studios" className="back-link"><ArrowLeft size={16} /> All studios</Link>
    <div className="detail-heading"><div><p className="section-kicker">{studio.category}</p><h1>{studio.title}</h1><div className="detail-meta"><span><Star size={15} fill="currentColor" /> {studio.rating?.toFixed(1) ?? "New"} {studio.reviewCount ? `(${studio.reviewCount} reviews)` : ""}</span><span><MapPin size={15} />{studio.location}</span><span><Users size={15} />Up to {studio.capacity} guests</span></div></div><button className={`save-button ${saved ? "saved" : ""}`} onClick={() => setSaved(!saved)} aria-label={saved ? "Remove from saved" : "Save studio"}><Heart size={18} fill={saved ? "currentColor" : "none"} /></button></div>
    <div className="gallery">
      <div className="gallery-main">{images[activeImage] ? <Image src={images[activeImage]} alt={`${studio.title} view ${activeImage + 1}`} fill sizes="(max-width: 700px) 100vw, 70vw" unoptimized /> : <div className="image-placeholder">StudioSpace</div>}</div>
      <div className="gallery-thumbs">{images.slice(0, 4).map((image, index) => <button className={index === activeImage ? "thumb active" : "thumb"} key={image} onClick={() => setActiveImage(index)}><Image src={image} alt={`${studio.title} thumbnail ${index + 1}`} fill sizes="(max-width: 700px) 25vw, 18vw" unoptimized /></button>)}</div>
    </div>
    <div className="detail-columns">
      <div className="detail-copy">
        <div className="overview-block"><h2>About this space</h2><p>{studio.description}</p></div>
        <div className="overview-block"><h2>What this space offers</h2>{studio.amenities.length ? <div className="amenity-list">{studio.amenities.map((amenity) => <span key={amenity}><Check size={16} />{amenity}</span>)}</div> : <p>Amenities will be shared by the host.</p>}</div>
        <section className="overview-block reviews-block" aria-labelledby="reviews-title">
          <h2 id="reviews-title">Reviews {studio.reviewCount ? `(${studio.reviewCount})` : ""}</h2>
          {sessionPending
            ? <p className="reviews-status">Checking your account...</p>
            : session?.user.id === studio.hostId
              ? <p>You can’t review your own studio.</p>
            : hasReviewed
              ? <p>You’ve already reviewed this studio.</p>
            : session
              ? <form className="review-form" onSubmit={submitReview}>
                <label htmlFor="review-rating">Your rating</label>
                <select id="review-rating" value={rating} onChange={(event) => setRating(Number(event.target.value))}>
                  {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} {value === 1 ? "star" : "stars"}</option>)}
                </select>
                <label htmlFor="review-comment">Your review</label>
                <textarea id="review-comment" value={comment} onChange={(event) => setComment(event.target.value)} minLength={3} maxLength={1000} required placeholder="Share what your experience was like." />
                <button className="button button-lime" disabled={submittingReview}>{submittingReview ? "Submitting..." : "Submit review"}</button>
              </form>
              : <p><Link href="/login">Log in</Link> to leave a review.</p>}
          {reviewsLoading
            ? <p className="reviews-status">Loading reviews...</p>
            : reviewsError
              ? <p className="reviews-status">{reviewsError}</p>
              : reviews.length
                ? <div className="review-list">{reviews.map((review) => <article className="review-item" key={review.id}>
                  <div className="review-item-heading"><strong>{review.userName}</strong><span><Star size={13} fill="currentColor" /> {review.rating}</span></div>
                  <p>{review.comment}</p>
                  <time dateTime={review.createdAt}>{new Date(review.createdAt).toLocaleDateString()}</time>
                </article>)}</div>
                : <p className="reviews-status">No reviews yet. Be the first to share your experience.</p>}
        </section>
        <div className="overview-block"><h2>Your host</h2><div className="host-details"><span>{studio.hostName.slice(0, 1).toUpperCase()}</span><div><strong>{studio.hostName}</strong><p>StudioSpace community host</p></div></div></div>
        <div className="capacity-note"><ShieldCheck size={20} /><div><strong>A space you can count on</strong><p>Booking requests are handled securely through StudioSpace.</p></div></div>
      </div>
      <aside className="booking-card"><div className="booking-price"><strong>${studio.hourlyRate}</strong><span> / hour</span><div className="booking-rating"><Star size={14} fill="currentColor" />{studio.rating?.toFixed(1) ?? "New"}</div></div>
        <div className="booking-input"><label htmlFor="booking-date">Date</label><div><CalendarDays size={16} /><input ref={dateInput} id="booking-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></div></div>
        <div className="time-inputs"><div className="booking-input"><label htmlFor="start-time">Starts</label><div><Clock3 size={15} /><input id="start-time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></div></div><div className="booking-input"><label htmlFor="end-time">Ends</label><div><Clock3 size={15} /><input id="end-time" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></div></div></div>
        <div className="booking-total"><span>{hours} hrs × ${studio.hourlyRate}</span><strong>${total.toFixed(2)}</strong></div><div className="booking-total booking-grand"><span>Total before taxes</span><strong>${total.toFixed(2)}</strong></div>
        <button className="button button-lime button-full" disabled={booking || hours <= 0} onClick={() => setBookingOpen(true)}>Book workspace now <ArrowUpRight size={16} /></button><small className="booking-footnote">You won’t be charged yet.</small>
        {studio.securityDeposit > 0 && <p className="deposit-note">Refundable security deposit: ${studio.securityDeposit}</p>}
      </aside>
    </div>
    {bookingOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !booking) setBookingOpen(false); }}><div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title"><button className="modal-close" onClick={() => setBookingOpen(false)} aria-label="Close" disabled={booking}>×</button><span className="modal-icon"><CalendarDays size={21} /></span><h2 id="booking-title">Confirm your booking request</h2><p>{studio.title} · {date} · {startTime}–{endTime}</p><div className="booking-total booking-grand"><span>{hours} hours × ${studio.hourlyRate}/hour</span><strong>${total.toFixed(2)}</strong></div><div className="modal-actions"><button className="button button-outline" onClick={() => setBookingOpen(false)} disabled={booking}>Go back</button><button className="button button-lime" onClick={submitBooking} disabled={booking}>{booking ? "Sending..." : "Send request"}</button></div></div></div>}
  </main></SiteLayout>;
}
