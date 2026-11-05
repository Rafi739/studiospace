"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Camera, LogOut, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";
import { getInitials } from "@/lib/profile";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function SettingsPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const imageInput = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState("");
  const [preview, setPreview] = useState("");
  const [imageTouched, setImageTouched] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => () => {
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
  }, [preview]);

  async function selectImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Choose an image smaller than 8 MB.");
      return;
    }

    setPreview(URL.createObjectURL(file));
    setImageTouched(true);
    setUploading(true);
    setUploadProgress(0);
    try {
      const { url } = await api.uploadImage(file, setUploadProgress);
      setProfileImage(url);
      setPreview("");
      toast.success("Photo uploaded. Save your profile to apply it.");
    } catch (reason) {
      setPreview("");
      setImageTouched(false);
      toast.error(reason instanceof Error ? reason.message : "Could not upload your photo.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await api.updateProfile({
        name: String(formData.get("name") ?? "").trim(),
        ...(imageTouched ? { image: profileImage } : {}),
      });
      await authClient.getSession();
      toast.success("Profile updated.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Could not update your profile.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        toast.error(result.error.message ?? "Could not log out.");
        return;
      }
      toast.success("You’re logged out.");
      router.push("/");
      router.refresh();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Could not log out.");
    } finally {
      setLoggingOut(false);
    }
  }

  const displayName = session?.user.name || session?.user.email || "StudioSpace member";
  const avatar = preview || (imageTouched ? profileImage : session?.user.image ?? "");

  return <div className="dash-page">
    <div className="dash-title"><p className="section-kicker">Your account, your way</p><h1>Profile <em>settings.</em></h1><p>Keep your profile and account details up to date.</p></div>
    <div className="settings-card">
      <div className="settings-card-head"><span className="settings-icon"><UserRound size={20} /></span><div><h2>Profile information</h2><p>Update the details associated with your account.</p></div></div>
      <form className="settings-form" onSubmit={submit}>
        <div className="profile-picture-field">
          <div className="profile-picture-preview" aria-label={`${displayName} profile picture`}>
            {avatar
              ? <Image src={avatar} alt="" fill sizes="112px" unoptimized />
              : <span>{getInitials(displayName)}</span>}
          </div>
          <div className="profile-picture-actions">
            <strong>Profile picture</strong>
            <p>JPG, PNG, or WebP · up to 8 MB</p>
            <input ref={imageInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose a profile picture" onChange={selectImage} />
            <div className="profile-picture-buttons">
              <button type="button" className="button button-outline" onClick={() => imageInput.current?.click()} disabled={uploading}><Camera size={15} /> {uploading ? "Uploading..." : "Choose photo"}</button>
              {avatar && <button type="button" className="profile-remove-button" onClick={() => { setProfileImage(""); setPreview(""); setImageTouched(true); }} disabled={uploading}><Trash2 size={14} /> Remove</button>}
            </div>
            {uploading && <div className="upload-progress" role="progressbar" aria-label="Profile picture upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress}><span style={{ width: `${uploadProgress}%` }} /></div>}
          </div>
        </div>
        <label htmlFor="profile-name">Full name<input id="profile-name" name="name" defaultValue={session?.user.name ?? ""} required minLength={2} maxLength={100} /></label>
        <label htmlFor="profile-email">Email address<input id="profile-email" type="email" value={session?.user.email ?? ""} disabled /></label>
        <button className="button button-lime" disabled={saving || uploading || isPending}>{saving ? "Saving..." : "Save profile"} <ArrowUpRight size={16} /></button>
      </form>
    </div>
    <div className="settings-card logout-card"><div><h2>Sign out</h2><p>Sign out of StudioSpace on this device.</p></div><button className="button button-outline" onClick={logout} disabled={loggingOut}><LogOut size={16} /> {loggingOut ? "Logging out..." : "Log out"}</button></div>
  </div>;
}
