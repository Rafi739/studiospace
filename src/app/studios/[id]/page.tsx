"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
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
  const [duration, setDuration] = useState(2);
  const [startTime, setStartTime] = useState("");
  const [availabilityResult, setAvailabilityResult] = useState<{
    key: string;
    startTimes: string[];
    error: string;
  } | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [activeImage, setActiveImage] = useState("");
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    api.studio(params.id).then((result) => {
      if (active) setStudio(result.studio);
    })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Studio not found.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    api.studioReviews(params.id).then((result) => {
      if (!active) return;
      setReviews(result.reviews);
      setHasReviewed(result.hasReviewed);
    })
      .catch((reason: unknown) => {
        if (active) setReviewsError(reason instanceof Error ? reason.message : "Could not load reviews.");
      })
      .finally(() => {
        if (active) setReviewsLoading(false);
      });
    return () => { active = false; };
  }, [params.id]);

  const studioId = studio?.id;
  const availabilityKey = studioId && date ? `${studioId}:${date}:${duration}` : "";
  const currentAvailability = availabilityResult?.key === availabilityKey ? availabilityResult : null;
  const availableStarts = currentAvailability?.startTimes ?? [];
  const availabilityError = currentAvailability?.error ?? "";
  const availabilityLoading = Boolean(availabilityKey && !currentAvailability);

  useEffect(() => {
    if (!studioId || !date) return;
    let active = true;
    const key = `${studioId}:${date}:${duration}`;
    api.studioAvailability(studioId, date, duration).then(({ startTimes }) => {
      if (!active) return;
      setAvailabilityResult({ key, startTimes, error: "" });
      setStartTime((current) => startTimes.includes(current) ? current : startTimes[0] ?? "");
    }).catch((reason: unknown) => {
      if (!active) return;
      setAvailabilityResult({
        key,
        startTimes: [],
        error: reason instanceof Error ? reason.message : "Could not load available times.",
      });
      setStartTime("");
    });
    return () => { active = false; };
  }, [studioId, date, duration]);

  const hours = duration;
  const endTime = startTime ? `${String(Number(startTime.slice(0, 2)) + duration).padStart(2, "0")}:00` : "";
  const total = studio ? hours * studio.hourlyRate : 0;
  async function submitBooking() {
    if (!studio) return;
    if (!date || !startTime || !availableStarts.includes(startTime)) { toast.error("Choose a date and an available time slot."); return; }
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
  const images = [...new Set(studio.images)].filter((image) => image && !failedImages.includes(image));
  const selectedImage = images.includes(activeImage) ? activeImage : images[0] ?? "";
  const isOwnStudio = session?.user.id === studio.hostId;
  const minimumDate = new Date().toISOString().slice(0, 10);

  return <SiteLayout darkNavbar><main className="detail-page">
    <Link href="/studios" className="back-link"><ArrowLeft size={16} /> All studios</Link>
    <div className="detail-heading"><div><p className="section-kicker">{studio.category}</p><h1>{studio.title}</h1><div className="detail-meta"><span><Star size={15} fill="currentColor" /> {studio.rating && studio.rating > 0 ? studio.rating.toFixed(1) : "New"} {studio.reviewCount ? `(${studio.reviewCount} reviews)` : ""}</span><span><MapPin size={15} />{studio.location}</span><span><Users size={15} />Up to {studio.capacity} guests</span></div></div><div className="detail-heading-actions"><div className="detail-heading-price"><strong>${studio.hourlyRate}</strong><span> / hour</span></div><button type="button" className="button button-lime detail-book-button" onClick={() => document.getElementById("booking-section")?.scrollIntoView({ behavior: "smooth", block: "center" })}>Book Now <ArrowUpRight size={16} /></button><button className={`save-button ${saved ? "saved" : ""}`} onClick={() => setSaved(!saved)} aria-label={saved ? "Remove from saved" : "Save studio"}><Heart size={18} fill={saved ? "currentColor" : "none"} /></button></div></div>
    <div className="gallery" aria-label="Studio photos">
      <div className="gallery-main">{selectedImage ? <Image src={selectedImage} alt={`${studio.title} main view`} fill sizes="(max-width: 800px) 100vw, 68vw" priority unoptimized onError={() => setFailedImages((current) => [...current, selectedImage])} /> : <div className="image-placeholder">StudioSpace</div>}</div>
      <div className="gallery-thumbs" aria-label="More studio photos">{images.filter((image) => image !== selectedImage).map((image, index) => <button type="button" className="thumb" key={image} onClick={() => setActiveImage(image)} aria-label={`View studio photo ${index + 2}`}><Image src={image} alt="" fill sizes="(max-width: 800px) 25vw, 16vw" unoptimized onError={() => setFailedImages((current) => [...current, image])} /></button>)}</div>
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
      <aside className="booking-card" id="booking-section" aria-labelledby="booking-card-title"><h2 id="booking-card-title" className="booking-card-title">Reserve this space</h2><div className="booking-price"><strong>${studio.hourlyRate}</strong><span> / hour</span><div className="booking-rating"><Star size={14} fill="currentColor" />{studio.rating && studio.rating > 0 ? studio.rating.toFixed(1) : "New"}</div></div>
        {isOwnStudio
          ? <div className="own-studio-notice" role="status">This is your studio listing. You can’t book your own space.</div>
          : <><div className="booking-input"><label htmlFor="booking-date">Date</label><div><CalendarDays size={16} /><input id="booking-date" type="date" min={minimumDate} value={date} onChange={(event) => { setDate(event.target.value); setStartTime(""); }} required /></div></div>
            <div className="booking-input"><label htmlFor="booking-duration">Duration</label><div><Clock3 size={15} /><select id="booking-duration" value={duration} onChange={(event) => { setDuration(Number(event.target.value)); setStartTime(""); }}>{Array.from({ length: 12 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value} {value === 1 ? "hour" : "hours"}</option>)}</select></div></div>
            <div className="booking-input"><label htmlFor="start-time">Available start time</label><div><Clock3 size={15} /><select id="start-time" value={startTime} disabled={!date || availabilityLoading || !availableStarts.length} onChange={(event) => setStartTime(event.target.value)}><option value="">{availabilityLoading ? "Checking availability..." : date ? "Select a time" : "Choose a date first"}</option>{availableStarts.map((time) => <option key={time} value={time}>{time} – {`${String(Number(time.slice(0, 2)) + duration).padStart(2, "0")}:00`}</option>)}</select></div></div>
            {availabilityError && <p className="availability-error" role="alert">{availabilityError}</p>}
            {date && !availabilityLoading && !availabilityError && availableStarts.length === 0 && <p className="availability-empty" role="status">No time slots are available for this date and duration. Try another date or duration.</p>}
            <div className="booking-total"><span>{hours} {hours === 1 ? "hour" : "hours"} × ${studio.hourlyRate}</span><strong>${total.toFixed(2)}</strong></div><div className="booking-total booking-grand"><span>Total before taxes</span><strong>${total.toFixed(2)}</strong></div>
            <button className="button button-lime button-full" disabled={booking || sessionPending || availabilityLoading || !date || !startTime || !availableStarts.includes(startTime)} onClick={() => session ? setBookingOpen(true) : router.push("/login")}>{session ? "Book Now" : "Log in to book"} <ArrowUpRight size={16} /></button><small className="booking-footnote">You won’t be charged yet.</small></>}
        {studio.securityDeposit > 0 && <p className="deposit-note">Refundable security deposit: ${studio.securityDeposit}</p>}
      </aside>
    </div>
    {bookingOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !booking) setBookingOpen(false); }}><div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title"><button className="modal-close" onClick={() => setBookingOpen(false)} aria-label="Close" disabled={booking}>×</button><span className="modal-icon"><CalendarDays size={21} /></span><h2 id="booking-title">Confirm your booking request</h2><p>{studio.title} · {date} · {startTime}–{endTime}</p><div className="booking-total booking-grand"><span>{hours} {hours === 1 ? "hour" : "hours"} × ${studio.hourlyRate}/hour</span><strong>${total.toFixed(2)}</strong></div><div className="modal-actions"><button className="button button-outline" onClick={() => setBookingOpen(false)} disabled={booking}>Go back</button><button className="button button-lime" onClick={submitBooking} disabled={booking}>{booking ? "Sending..." : "Send request"}</button></div></div></div>}
  </main></SiteLayout>;
}
