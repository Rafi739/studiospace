"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, DoorOpen, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { Studio } from "@/lib/types";

export default function MyStudiosPage() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Studio | null>(null);
  useEffect(() => { api.myStudios().then((result) => setStudios(result.studios)).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load listings.")).finally(() => setLoading(false)); }, []);
  async function remove() {
    if (!deleteTarget) return;
    try { await api.deleteStudio(deleteTarget.id); setStudios((current) => current.filter((studio) => studio.id !== deleteTarget.id)); toast.success("Studio listing deleted."); }
    catch (reason) { toast.error(reason instanceof Error ? reason.message : "Could not delete listing."); }
    finally { setDeleteTarget(null); }
  }
  return <div className="dash-page"><div className="dash-page-header"><div><p className="section-kicker">Your creative spaces</p><h1>My <em>listings.</em></h1><p>Manage the studios you’ve shared with the community.</p></div><Link href="/dashboard/add-studio" className="button button-lime"><Plus size={16} /> Add a studio</Link></div>
    {loading ? <div className="page-loading"><span className="spinner" /> Loading your listings...</div> : error ? <div className="error-panel"><h3>Listings couldn’t be loaded.</h3><p>{error}</p></div> : studios.length ? <div className="listing-management-grid">{studios.map((studio) => <article className="manage-card" key={studio.id}><Link href={`/studios/${studio.id}`} className="manage-image">{studio.images[0] ? <Image src={studio.images[0]} alt={studio.title} fill sizes="(max-width: 700px) 100vw, 33vw" unoptimized /> : <div className="image-placeholder">StudioSpace</div>}</Link><div className="manage-card-body"><span className="image-category">{studio.category}</span><h2>{studio.title}</h2><p>{studio.location}</p><div className="manage-card-foot"><strong>${studio.hourlyRate}<small> / hr</small></strong><div><Link href={`/dashboard/my-studios/${studio.id}/edit`} aria-label={`Edit ${studio.title}`}><Pencil size={16} /></Link><button onClick={() => setDeleteTarget(studio)} aria-label={`Delete ${studio.title}`}><Trash2 size={16} /></button></div></div></div></article>)}</div> : <div className="dashboard-empty"><DoorOpen size={24} /><strong>No listings yet</strong><p>Your first studio listing is a few details away.</p><Link className="button button-lime" href="/dashboard/add-studio">Add your first studio <ArrowUpRight size={16} /></Link></div>}
    {deleteTarget && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteTarget(null); }}><div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title"><button className="modal-close" onClick={() => setDeleteTarget(null)} aria-label="Close"><X size={18} /></button><span className="modal-icon"><Trash2 size={21} /></span><h2 id="delete-title">Delete this studio?</h2><p><strong>{deleteTarget.title}</strong> will be removed from your listings. This can’t be undone.</p><div className="modal-actions"><button className="button button-outline" onClick={() => setDeleteTarget(null)}>Keep listing</button><button className="button button-danger" onClick={remove}>Delete studio</button></div></div></div>}
  </div>;
}
