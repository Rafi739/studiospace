"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, ArrowUpRight, MapPin } from "lucide-react";
import { SiteLayout } from "@/components/site-shell";
import { StudioCard, StudioEmptyState, StudioLoadingState } from "@/components/studio-card";
import { api, type StudioQuery } from "@/lib/api";
import type { Studio } from "@/lib/types";

const categories = ["All categories", "Photo Studio", "Podcast Room", "Sound Stage", "Music Studio", "Art Workshop"];

export default function StudiosPage() {
  return <Suspense fallback={<SiteLayout><div className="page-loading"><span className="spinner" /> Finding your space...</div></SiteLayout>}><StudiosCatalog /></Suspense>;
}

function StudiosCatalog() {
  const searchParams = useSearchParams();
  const [studios, setStudios] = useState<Studio[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(() => {
    const requested = searchParams.get("category");
    return requested && categories.includes(requested) ? requested : "All categories";
  });
  const [sort, setSort] = useState<NonNullable<StudioQuery["sort"]>>("rating");
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.studios({ search, category: category === "All categories" ? undefined : category, sort })
      .then(({ studios: results }) => { if (active) setStudios(results); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load studios."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, category, sort, refresh]);

  return <SiteLayout><main className="listing-page">
    <div className="listing-hero"><div className="listing-hero-content"><p className="section-kicker">The right space changes everything</p><h1>Find your next<br /><em>creative space.</em></h1><p>Explore inspiring spaces made for the things you love to create.</p></div><div className="listing-hero-note"><MapPin size={16} /><span>Find a space<br /><strong>that feels like yours.</strong></span></div></div>
    <section className="listing-content">
      <div className="listing-toolbar"><label className="search-field"><Search size={18} /><input value={search} onChange={(event) => { setLoading(true); setError(""); setSearch(event.target.value); }} placeholder="Search studios by name..." aria-label="Search studios" /></label><div className="listing-filters"><SlidersHorizontal size={17} /><select value={category} onChange={(event) => { setLoading(true); setError(""); setCategory(event.target.value); }} aria-label="Filter by category">{categories.map((item) => <option key={item}>{item}</option>)}</select><select value={sort} onChange={(event) => { setLoading(true); setError(""); setSort(event.target.value as NonNullable<StudioQuery["sort"]>); }} aria-label="Sort studios"><option value="rating">Top rated</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></div></div>
      <div className="results-heading"><div><h2>Explore all spaces</h2><p>{loading ? "Finding the right spaces..." : error ? "Live listings are temporarily unavailable" : `${studios.length} ${studios.length === 1 ? "space" : "spaces"} to explore`}</p></div><Link href="/register" className="text-link">Host a space <ArrowUpRight size={16} /></Link></div>
      {loading ? <StudioLoadingState /> : error ? <div className="error-panel"><h3>We couldn’t load the studios.</h3><p>{error}</p><button className="button button-dark" onClick={() => { setLoading(true); setError(""); setRefresh((value) => value + 1); }}>Try again</button></div> : studios.length ? <div className="studio-grid">{studios.map((studio) => <StudioCard key={studio.id} studio={studio} />)}</div> : <StudioEmptyState message="No spaces match your search." />}
    </section>
  </main></SiteLayout>;
}