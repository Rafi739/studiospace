"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const isRegister = mode === "register";
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "");
    const image = String(formData.get("image") ?? "").trim();
    const rememberMe = formData.get("rememberMe") === "on";
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (isRegister && (!/[A-Z]/.test(password) || !/[a-z]/.test(password))) {
      toast.error("Password must include at least one uppercase and one lowercase letter.");
      return;
    }
    setBusy(true);
    try {
      const result = isRegister
        ? await authClient.signUp.email({ email, password, name, ...(image ? { image } : {}) })
        : await authClient.signIn.email({ email, password, rememberMe, callbackURL: "/dashboard" });
      if (result.error) { toast.error(result.error.message ?? "Authentication failed."); return; }
      if (isRegister) {
        const signedOut = await authClient.signOut();
        if (signedOut.error) {
          toast.error(signedOut.error.message ?? "Account was created, but sign-out failed. Please log out before continuing.");
          return;
        }
        toast.success("Account created. Please log in.");
        router.push("/login?registered=1");
      } else {
        toast.success("Welcome back!");
        router.push("/dashboard");
      }
      router.refresh();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Authentication failed.");
    } finally { setBusy(false); }
  }

  async function signInWithGoogle() {
    setBusy(true);
    try {
      const result = await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
      if (result.error) toast.error(result.error.message ?? "Google sign-in failed.");
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Google sign-in failed.");
    } finally { setBusy(false); }
  }

  return <main className="auth-page">
    <div className="auth-image-side"><Link href="/" className="auth-brand"><span className="brand-mark"><Sparkles size={17} /></span>studio<span>space</span></Link><div className="auth-image-content"><p className="section-kicker">Make room for inspiration</p><h1>A little space<br />goes a <em>long way.</em></h1><p>Find the place where your next big idea feels right at home.</p></div><div className="auth-image-credit">Space to make something of it.</div></div>
    <div className="auth-form-side"><Link href="/" className="auth-back"><ArrowLeft size={16} /> Back to StudioSpace</Link><div className="auth-form-wrap"><p className="section-kicker">{isRegister ? "Your next chapter starts here" : "Good to have you back"}</p><h2>{isRegister ? "Create your account" : "Welcome back."}</h2><p className="auth-subtitle">{isRegister ? "Join a community made for creative minds." : "Log in to manage your spaces and bookings."}</p>
      <form className="auth-form" onSubmit={submit}>
        {isRegister && <><label>Your name<input name="name" type="text" placeholder="How should we call you?" required minLength={2} autoComplete="name" /></label><label>Photo URL<input name="image" type="url" placeholder="https://example.com/photo.jpg" autoComplete="url" /></label></>}
        <label>Email address<input name="email" type="email" placeholder="you@example.com" required autoComplete="email" /></label>
        <label>Password<input name="password" type="password" placeholder={isRegister ? "8+ characters, uppercase and lowercase" : "Your password"} required minLength={8} autoComplete={isRegister ? "new-password" : "current-password"} /></label>
        {!isRegister && <div className="auth-aux"><label className="check-label"><input name="rememberMe" type="checkbox" /> Remember me</label><span>Secure sign-in</span></div>}
        <button className="button button-lime button-full" disabled={busy}>{busy ? "One moment..." : isRegister ? "Create account" : "Log in"} <ArrowUpRight size={17} /></button>
        {googleEnabled && <button type="button" className="button button-outline button-full social-button" disabled={busy} onClick={signInWithGoogle}>Continue with Google</button>}
      </form><p className="auth-switch">{isRegister ? "Already have an account?" : "New to StudioSpace?"} <Link href={isRegister ? "/login" : "/register"}>{isRegister ? "Log in" : "Create an account"}</Link></p>
    </div><div className="auth-foot">© 2026 StudioSpace</div></div>
  </main>;
}
