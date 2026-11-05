import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, MapPin, Star } from "lucide-react";
import type { Studio } from "@/lib/types";

export function StudioCard({ studio }: { studio: Studio }) {
  return (
    <article className="studio-card">
      <Link href={`/studios/${studio.id}`} className="studio-image-wrap">
        {studio.images[0] ? <Image src={studio.images[0]} alt={studio.title} className="studio-image" fill sizes="(max-width: 700px) 100vw, 33vw" unoptimized /> : <div className="image-placeholder">StudioSpace</div>}
        <span className="image-category">{studio.category}</span>
        <span className="card-arrow"><ArrowUpRight size={17} /></span>
      </Link>
      <div className="studio-card-info">
        <div className="studio-card-title"><Link href={`/studios/${studio.id}`}>{studio.title}</Link><span className="rating"><Star size={13} fill="currentColor" /> {studio.rating && studio.rating > 0 ? studio.rating.toFixed(1) : "New"}{studio.reviewCount ? <small> ({studio.reviewCount})</small> : null}</span></div>
        <p className="studio-location"><MapPin size={13} />{studio.location}</p>
        <div className="studio-card-price"><strong>${studio.hourlyRate}<span> / hour</span></strong><span>Up to {studio.capacity} guests</span></div>
      </div>
    </article>
  );
}

export function StudioEmptyState({ message = "No studios found just yet." }: { message?: string }) {
  return <div className="empty-state"><span className="empty-sparkle">✳</span><h3>{message}</h3><p>Try a different search, or check back soon for new spaces.</p></div>;
}

export function StudioLoadingState() {
  return <div className="studio-grid">{[1, 2, 3].map((item) => <div className="studio-skeleton" key={item}><div /><span /><span /></div>)}</div>;
}
