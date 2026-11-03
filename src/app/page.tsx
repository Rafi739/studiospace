"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, AudioLines, Camera,
  Check, ChevronLeft, ChevronRight, CirclePlay, Headphones, Mic2,
  MoveUpRight, Palette, ShieldCheck, Sparkles, WandSparkles,
} from "lucide-react";
import { SiteLayout } from "@/components/site-shell";
import { StudioCard, StudioEmptyState, StudioLoadingState } from "@/components/studio-card";
import { api } from "@/lib/api";
import type { Studio } from "@/lib/types";

const slides = [
  { eyebrow: "A space for every idea", title: <>Find your perfect<br /><em>creative space.</em></>, sub: "Spaces that spark something. Book by the hour and bring your next big idea to life.", image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2200&q=88" },
  { eyebrow: "Make something remarkable", title: <>Your next great<br /><em>work starts here.</em></>, sub: "From first take to final frame, find the place that makes your work feel effortless.", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=2200&q=88" },
  { eyebrow: "Spaces for the sound of it", title: <>Turn up the volume<br /><em>on your ideas.</em></>, sub: "Find a room to record, rehearse, create and make a little noise.", image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=2200&q=88" },
];

const categories = [
  { label: "Photo studios", icon: Camera, value: "Photo Studio" },
  { label: "Podcast rooms", icon: Mic2, value: "Podcast Room" },
  { label: "Sound stages", icon: AudioLines, value: "Sound Stage" },
  { label: "Music studios", icon: Headphones, value: "Music Studio" },
  { label: "Art workshops", icon: Palette, value: "Art Workshop" },
];

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.studios({ sort: "rating", limit: 6 }).then((data) => setStudios(data.studios))
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load studios."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setSlide((value) => (value + 1) % slides.length), 7000);
    return () => window.clearInterval(interval);
  }, []);

  const active = slides[slide];
  return (
    <SiteLayout>
      <main>
        <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(7,12,16,.91) 0%, rgba(7,12,16,.67) 43%, rgba(7,12,16,.05) 100%), url("${active.image}")` }}>
          <div className="hero-grain" />
          <div className="hero-content">
            <div className="eyebrow"><span />{active.eyebrow}</div>
            <h1>{active.title}</h1>
            <p>{active.sub}</p>
            <div className="hero-actions"><Link href="/studios" className="button button-lime button-large">Explore studios <ArrowUpRight size={17} /></Link><a className="watch-link" href="#how-it-works"><span><CirclePlay size={21} /></span> See how it works</a></div>
          </div>
          <div className="hero-bottom">
            <div className="hero-trust"><div className="avatar-stack"><span>J</span><span>M</span><span>A</span><span>+</span></div><p><strong>Made for creative people</strong><small>Spaces worth making in</small></p></div>
            <div className="slide-controls"><span className="slide-count">0{slide + 1}<i> / 0{slides.length}</i></span><button aria-label="Previous slide" onClick={() => setSlide((slide + slides.length - 1) % slides.length)}><ChevronLeft size={18} /></button><button aria-label="Next slide" onClick={() => setSlide((slide + 1) % slides.length)}><ChevronRight size={18} /></button></div>
          </div>
          <div className="hero-scroll"><ArrowDownRight size={15} /> Scroll to explore</div>
        </section>

        <section className="section featured-section">
          <div className="section-head"><div><p className="section-kicker">Handpicked for you</p><h2>Spaces with <em>something special.</em></h2></div><Link href="/studios" className="text-link">Explore all spaces <ArrowUpRight size={16} /></Link></div>
          {loading ? <StudioLoadingState /> : error ? <div className="inline-error">{error} <Link href="/studios">Browse studios <ArrowRight size={15} /></Link></div> : studios.length ? <div className="studio-grid">{studios.map((studio) => <StudioCard key={studio.id} studio={studio} />)}</div> : <StudioEmptyState message="Your next favorite space is waiting." />}
        </section>

        <section className="category-section">
          <div className="section category-inner"><div className="category-intro"><p className="section-kicker">Pick your playground</p><h2>What are you<br />making <em>today?</em></h2><p>Whatever the vision, there’s a space to bring it to life.</p></div><div className="category-list">{categories.map(({ label, icon: Icon, value }, index) => <Link href={`/studios?category=${encodeURIComponent(value)}`} className="category-item" key={value}><span className="category-number">0{index + 1}</span><Icon size={23} strokeWidth={1.6} /><strong>{label}</strong><MoveUpRight size={17} className="category-arrow" /></Link>)}</div></div>
        </section>

        <section className="section how-section" id="how-it-works">
          <div className="how-heading"><p className="section-kicker">Easy as making something</p><h2>Less planning.<br /><em>More creating.</em></h2><p>Good ideas don’t wait. Booking a great space shouldn’t either.</p><Link href="/studios" className="button button-dark">Find your space <ArrowUpRight size={16} /></Link></div>
          <div className="steps">{[
            { n: "01", icon: WandSparkles, title: "Find your space", text: "Browse one-of-a-kind spaces made for the way you create." },
            { n: "02", icon: Check, title: "Book your time", text: "Pick a date, choose your hours and confirm in a few clicks." },
            { n: "03", icon: Sparkles, title: "Make it happen", text: "Show up, get inspired and create something worth sharing." },
            { n: "04", icon: ArrowUpRight, title: "Share your work", text: "Bring your finished creation into the world." },
          ].map(({ n, icon: Icon, title, text }) => <article className="step-card" key={n}><div className="step-top"><span>{n}</span><Icon size={21} /></div><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section className="host-banner">
          <div className="host-image" />
          <div className="host-content"><div className="host-icon"><ShieldCheck size={23} /></div><p className="section-kicker">For the people behind the spaces</p><h2>Your space could<br />be someone’s <em>starting point.</em></h2><p>Meet the makers looking for a place to make. List your studio and turn your creative space into a thriving business.</p><div className="host-perks"><span><Check size={15} /> You’re in control</span><span><Check size={15} /> Secure bookings</span><span><Check size={15} /> Real creative people</span></div><Link href="/register" className="button button-lime">Become a host <ArrowUpRight size={16} /></Link></div>
        </section>
      </main>
    </SiteLayout>
  );
}
