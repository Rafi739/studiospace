"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowUpRight, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import type { Studio, StudioCategory } from "@/lib/types";

const categories: StudioCategory[] = ["Photo Studio", "Podcast Room", "Sound Stage", "Music Studio", "Art Workshop"];

export default function EditStudioPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const imageInput = useRef<HTMLInputElement>(null);
  const [studio, setStudio] = useState<Studio | null>(null);
  const [loadError, setLoadError] = useState<{ id: string; message: string } | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;
    api.studio(id)
      .then(({ studio: item }) => {
        if (!active) return;
        setStudio(item);
        setImages(item.images);
        setLoadError(null);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        const message = reason instanceof Error ? reason.message : "Studio not found.";
        setLoadError({ id, message });
        toast.error(message);
      });
    return () => { active = false; };
  }, [id]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await api.updateStudio(id, {
        title: String(form.get("title") ?? ""),
        category: String(form.get("category") ?? "") as StudioCategory,
        location: String(form.get("location") ?? ""),
        description: String(form.get("description") ?? ""),
        hourlyRate: Number(form.get("hourlyRate")),
        securityDeposit: Number(form.get("securityDeposit")),
        capacity: Number(form.get("capacity")),
        images,
        amenities: String(form.get("amenities") ?? "").split(",").map((amenity) => amenity.trim()).filter(Boolean),
      });
      toast.success("Listing updated.");
      router.push("/dashboard/my-studios");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Could not update listing.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadFile(file: File | undefined) {
    if (!file) return;
    if (images.length >= 12) {
      toast.error("You can upload up to 12 images.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Images must be smaller than 8 MB.");
      return;
    }

    setUploading(true);
    try {
      const result = await api.uploadImage(file);
      setImages((current) => [...current, result.url]);
      toast.success("Image uploaded.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Could not upload image.");
    } finally {
      setUploading(false);
      if (imageInput.current) imageInput.current.value = "";
    }
  }

  if (studio?.id !== id && loadError?.id === id) {
    return (
      <div className="error-panel">
        <h3>Studio couldn’t be loaded.</h3>
        <p>{loadError.message}</p>
        <Link className="button button-outline" href="/dashboard/my-studios">
          Back to my listings
        </Link>
      </div>
    );
  }
  if (studio?.id !== id) return <div className="page-loading"><span className="spinner" /> Loading studio...</div>;

  return <div className="dash-page">
    <Link href="/dashboard/my-studios" className="dash-back"><ArrowLeft size={15} /> My listings</Link>
    <div className="dash-title"><p className="section-kicker">Update your listing</p><h1>Edit <em>studio.</em></h1></div>
    <form onSubmit={submit} className="studio-form">
      <div className="form-section">
        <h2>Studio details</h2>
        <div className="form-grid">
          <label className="span-two">Title<input name="title" defaultValue={studio.title} required minLength={3} /></label>
          <label>Category<select name="category" defaultValue={studio.category}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label>Location<input name="location" defaultValue={studio.location} required /></label>
          <label>Hourly rate ($)<input name="hourlyRate" type="number" defaultValue={studio.hourlyRate} min="1" required /></label>
          <label>Security deposit ($)<input name="securityDeposit" type="number" defaultValue={studio.securityDeposit} min="0" required /></label>
          <label>Capacity<input name="capacity" type="number" defaultValue={studio.capacity} min="1" required /></label>
          <label>Host name<input value={session?.user.name ?? ""} readOnly /></label>
          <label>Host email<input value={session?.user.email ?? ""} readOnly /></label>
          <label className="span-two">Description<textarea name="description" rows={4} defaultValue={studio.description} required /></label>
          <label className="span-two">Image URLs (one per line)<textarea name="images" rows={3} value={images.join("\n")} onChange={(event) => setImages(event.target.value.split("\n").map((image) => image.trim()).filter(Boolean))} /></label>
          <label className="span-two">Amenities (comma separated)<input name="amenities" defaultValue={studio.amenities.join(", ")} /></label>
        </div>
      </div>
      <div className="form-section">
        <h2>Upload studio images</h2>
        <input ref={imageInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadFile(event.target.files?.[0])} />
        <button type="button" className="upload-hint upload-control" onClick={() => imageInput.current?.click()} disabled={uploading || images.length >= 12}>
          <ImagePlus size={20} />
          <span><strong>{uploading ? "Uploading image..." : "Upload a studio image"}</strong><small>JPG, PNG or WebP · Up to 8 MB</small></span>
        </button>
        {images.length > 0 && <div className="uploaded-images">{images.map((image, index) => <div key={`${image}-${index}`}>
          <Image src={image} alt={`Studio upload ${index + 1}`} fill sizes="77px" unoptimized />
          <button type="button" aria-label="Remove image" onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}>×</button>
        </div>)}</div>}
        <p className="image-upload-note">Images appear on your studio listing. You can upload up to 12 images.</p>
      </div>
      <div className="form-submit"><span>Changes are visible to all guests.</span><button className="button button-lime" disabled={saving || uploading}>{saving ? "Saving..." : "Save changes"} <ArrowUpRight size={16} /></button></div>
    </form>
  </div>;
}
