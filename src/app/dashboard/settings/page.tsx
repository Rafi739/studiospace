"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, LogOut, UserRound } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await api.updateProfile({ name: String(form.get("name") ?? "").trim(), image: String(form.get("image") ?? "").trim() });
      toast.success("Profile updated.");
      await authClient.getSession();
    } catch (reason) { toast.error(reason instanceof Error ? reason.message : "Could not update your profile."); }
    finally { setSaving(false); }
  }
  async function logout() { await authClient.signOut(); toast.success("You’re logged out."); router.push("/"); router.refresh(); }
  return <div className="dash-page"><div className="dash-title"><p className="section-kicker">Your account, your way</p><h1>Account <em>settings.</em></h1><p>Keep your profile up to date.</p></div><div className="settings-card"><div className="settings-card-head"><span className="settings-icon"><UserRound size={20} /></span><div><h2>Profile information</h2><p>Update the details associated with your account.</p></div></div><form className="settings-form" onSubmit={submit}><label>Full name<input name="name" defaultValue={session?.user.name ?? ""} required minLength={2} maxLength={100} /></label><label>Email address<input type="email" value={session?.user.email ?? ""} disabled /></label><label>Profile image URL <span className="field-note">Optional</span><input name="image" type="url" defaultValue={session?.user.image ?? ""} placeholder="https://..." /></label><button className="button button-lime" disabled={saving}>{saving ? "Saving..." : "Save profile"} <ArrowUpRight size={16} /></button></form></div><div className="settings-card logout-card"><div><h2>Sign out</h2><p>Sign out of StudioSpace on this device.</p></div><button className="button button-outline" onClick={logout}><LogOut size={16} /> Log out</button></div></div>;
}
