"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import type { Studio, StudioCategory } from "@/lib/types";

const categories: StudioCategory[] = ["Photo Studio", "Podcast Room", "Sound Stage", "Music Studio", "Art Workshop"];

export default function EditStudioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [studio, setStudio] = useState<Studio | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { api.studio(id).then(({ studio: item }) => setStudio(item)).catch((reason: unknown) => toast.error(reason instanceof Error ? reason.message : "Studio not found.")); }, [id]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await api.updateStudio(id, {
        title: String(form.get("title") ?? ""),
        category: String(form.get("category") ?? "") as StudioCategory,
        location: String(form.get("location") ?? ""),
        description: String(form.get("description") ?? ""),
        hourlyRate: Number(form.get("hourlyRate")), securityDeposit: Number(form.get("securityDeposit")),
        capacity: Number(form.get("capacity")),
        images: String(form.get("images") ?? "").split("\n").map((image) => image.trim()).filter(Boolean),
        amenities: String(form.get("amenities") ?? "").split(",").map((amenity) => amenity.trim()).filter(Boolean),
      });
      toast.success("Listing updated."); router.push("/dashboard/my-studios");
    } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Could not update listing."); }
    finally { setSaving(false); }
  }
  if (!studio) return <div className="page-loading"><span className="spinner" /> Loading studio...</div>;
  return <div className="dash-page"><Link href="/dashboard/my-studios" className="dash-back"><ArrowLeft size={15} /> My listings</Link><div className="dash-title"><p className="section-kicker">Update your listing</p><h1>Edit <em>studio.</em></h1></div><form onSubmit={submit} className="studio-form"><div className="form-section"><h2>Studio details</h2><div className="form-grid"><label className="span-two">Title<input name="title" defaultValue={studio.title} required minLength={3} /></label><label>Category<select name="category" defaultValue={studio.category}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Location<input name="location" defaultValue={studio.location} required /></label><label>Hourly rate ($)<input name="hourlyRate" type="number" defaultValue={studio.hourlyRate} min="1" required /></label><label>Security deposit ($)<input name="securityDeposit" type="number" defaultValue={studio.securityDeposit} min="0" required /></label><label>Capacity<input name="capacity" type="number" defaultValue={studio.capacity} min="1" required /></label><label>Host name<input value={session?.user.name ?? ""} readOnly /></label><label>Host email<input value={session?.user.email ?? ""} readOnly /></label><label className="span-two">Description<textarea name="description" rows={4} defaultValue={studio.description} required /></label><label className="span-two">Image URLs (one per line)<textarea name="images" rows={3} defaultValue={studio.images.join("\n")} /></label><label className="span-two">Amenities (comma separated)<input name="amenities" defaultValue={studio.amenities.join(", ")} /></label></div></div><div className="form-submit"><span>Changes are visible to all guests.</span><button className="button button-lime" disabled={saving}>{saving ? "Saving..." : "Save changes"} <ArrowUpRight size={16} /></button></div></form></div>;
}
