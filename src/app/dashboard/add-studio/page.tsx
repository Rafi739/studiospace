"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Check, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import type { StudioCategory } from "@/lib/types";

const amenityOptions = ["Lighting equipment", "Backdrop options", "Wi-Fi", "Air conditioning", "Parking", "Soundproofing", "Natural light", "Props included"];
const categories: StudioCategory[] = ["Photo Studio", "Podcast Room", "Sound Stage", "Music Studio", "Art Workshop"];

export default function AddStudioPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const imageInput = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await api.createStudio({
        title: String(form.get("title") ?? "").trim(),
        category: String(form.get("category") ?? "") as StudioCategory,
        description: String(form.get("description") ?? "").trim(),
        images,
        hourlyRate: Number(form.get("hourlyRate")),
        securityDeposit: Number(form.get("securityDeposit") || 0),
        location: String(form.get("location") ?? "").trim(),
        capacity: Number(form.get("capacity")),
        amenities: selected,
      });
      toast.success("Your studio is live!");
      router.push("/dashboard/my-studios");
    } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Could not create studio."); }
    finally { setSaving(false); }
  }
  function toggle(value: string) { setSelected((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]); }
  async function uploadFile(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("Choose a JPG, PNG, or WebP image."); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Images must be smaller than 8 MB."); return; }
    setUploading(true);
    try { const result = await api.uploadImage(file); setImages((current) => [...current, result.url]); toast.success("Image uploaded."); }
    catch (reason) { toast.error(reason instanceof Error ? reason.message : "Could not upload image."); }
    finally { setUploading(false); if (imageInput.current) imageInput.current.value = ""; }
  }
  return <div className="dash-page"><Link href="/dashboard" className="dash-back"><ArrowLeft size={15} /> Workspace</Link><div className="dash-title"><p className="section-kicker">Share your creative space</p><h1>Add a <em>studio.</em></h1><p>Tell makers what makes your space a great place to create.</p></div>
    <form className="studio-form" onSubmit={submit}><div className="form-section"><h2>The essentials</h2><div className="form-grid"><label className="span-two">Studio title<input name="title" placeholder="e.g. Sunroom Photography Loft" required minLength={3} maxLength={100} /></label><label>Category<select name="category" required defaultValue=""><option value="" disabled>Choose a category</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Location<input name="location" placeholder="City, neighborhood" required maxLength={140} /></label><label>Hourly rate ($)<input name="hourlyRate" type="number" placeholder="75" min="1" max="10000" required /></label><label>Security deposit ($)<input name="securityDeposit" type="number" placeholder="0" min="0" max="100000" defaultValue="0" required /></label><label>Maximum capacity<input name="capacity" type="number" placeholder="8" min="1" max="500" required /></label><label>Host name<input value={session?.user.name ?? ""} readOnly /></label><label>Host email<input value={session?.user.email ?? ""} readOnly /></label></div></div>
      <div className="form-section"><h2>Show off your space</h2><input ref={imageInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadFile(event.target.files?.[0])} /><button type="button" className="upload-hint upload-control" onClick={() => imageInput.current?.click()} disabled={uploading || images.length >= 12}><ImagePlus size={20} /><span><strong>{uploading ? "Uploading image..." : "Upload a studio image"}</strong><small>JPG, PNG or WebP · Up to 8 MB</small></span></button>{images.length > 0 && <div className="uploaded-images">{images.map((image, index) => <div key={image}><Image src={image} alt={`Studio upload ${index + 1}`} fill sizes="77px" unoptimized /><button type="button" aria-label="Remove image" onClick={() => setImages((current) => current.filter((item) => item !== image))}>×</button></div>)}</div>}<div className="manual-image-label"><label htmlFor="image-url">Or add an image URL</label><div><input id="image-url" type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://images.example.com/your-studio.jpg" /><button type="button" className="button button-outline" disabled={!imageUrl || images.length >= 12} onClick={() => { if (!/^https:\/\/.+\.(jpe?g|png|webp)(\?.*)?$/i.test(imageUrl)) { toast.error("Add a secure JPG, PNG, or WebP image URL."); return; } setImages((current) => current.includes(imageUrl) ? current : [...current, imageUrl]); setImageUrl(""); }}>Add URL</button></div></div><p className="image-upload-note">Images appear on your studio listing. You can upload up to 12 images.</p></div>
      <div className="form-section"><h2>Make it yours</h2><label>About this studio<textarea name="description" rows={4} placeholder="What makes your space special? Tell guests what to expect..." required minLength={20} maxLength={3000} /></label><div className="amenity-choices"><p>Amenities</p>{amenityOptions.map((amenity) => <button type="button" className={selected.includes(amenity) ? "amenity-choice selected" : "amenity-choice"} key={amenity} onClick={() => toggle(amenity)}>{selected.includes(amenity) && <Check size={14} />}{amenity}</button>)}</div></div>
      <div className="form-submit"><p>Your listing can be edited any time.</p><button className="button button-lime" disabled={saving}>{saving ? "Publishing..." : "Publish studio"} <ArrowUpRight size={16} /></button></div>
    </form>
  </div>;
}
