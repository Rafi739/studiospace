"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Menu,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { getInitials } from "@/lib/profile";
import { ThemeToggle } from "@/components/theme-toggle";

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-mark"><Sparkles size={17} strokeWidth={2.8} /></span>
      <span>studio<span>space</span></span>
    </Link>
  );
}

export function Navbar({ solid = false }: { solid?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { data: session } = authClient.useSession();

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        toast.error(result.error.message ?? "Could not log out.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Could not log out.");
    } finally {
      setLoggingOut(false);
    }
  }

  const accountLinks = <>
    <Link href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
    <Link href="/dashboard/bookings" onClick={() => setOpen(false)}>My bookings</Link>
    <Link href="/dashboard/my-studios" onClick={() => setOpen(false)}>My listings</Link>
    <Link href="/dashboard/settings" onClick={() => setOpen(false)}>Profile Settings</Link>
    <Link href="/dashboard/add-studio" onClick={() => setOpen(false)}>Add a studio</Link>
    <button type="button" onClick={logout} disabled={loggingOut}>{loggingOut ? "Logging out..." : "Log out"}</button>
  </>;

  return (
    <header className={`navbar ${solid ? "navbar-solid" : ""}`}>
      <div className="nav-inner">
        <Brand light />
        <nav className={`nav-links ${open ? "nav-open" : ""}`}>
          <Link href="/" onClick={() => setOpen(false)}>Home</Link>
          <Link href="/studios" onClick={() => setOpen(false)}>Explore studios</Link>
          <Link href="/#how-it-works" onClick={() => setOpen(false)}>How it works</Link>
          <Link href="/#about" onClick={() => setOpen(false)}>About us</Link>
          <div className="mobile-nav-actions">
            {session ? accountLinks : <>
              <Link href="/login" className="button button-outline" onClick={() => setOpen(false)}>Log in</Link>
              <Link href="/register" className="button button-lime" onClick={() => setOpen(false)}>Get started <ArrowUpRight size={15} /></Link>
            </>}
          </div>
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          {session ? <details className="nav-account">
            <summary aria-label="Open account menu">
              {session.user.image
                ? <Image src={session.user.image} alt="" width={36} height={36} unoptimized />
                : <span>{getInitials(session.user.name || session.user.email)}</span>}
              <span className="nav-account-name">{session.user.name || session.user.email}</span>
            </summary>
            <div className="nav-account-menu">{accountLinks}</div>
          </details> : <>
            <Link href="/login" className="nav-login">Log in</Link>
            <Link href="/register" className="button button-lime">Get started <ArrowUpRight size={15} /></Link>
          </>}
        </div>
        <div className="mobile-theme-toggle"><ThemeToggle /></div>
        <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
    </header>
  );
}

export function Footer() {
  const [subscribing, setSubscribing] = useState(false);
  async function subscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setSubscribing(true);
    try {
      await api.subscribe(String(formData.get("email") ?? ""));
      toast.success("You’re on the StudioSpace list.");
      form.reset();
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : "Could not subscribe.");
    } finally { setSubscribing(false); }
  }
  return (
    <footer className="footer" id="about">
      <div className="footer-main">
        <div className="footer-about">
          <Brand light />
          <p>Make room for your next big idea.<br />Find a space that feels like yours.</p>
        </div>
        <div className="footer-col"><strong>Explore</strong><Link href="/studios">All studios</Link><Link href="/studios?category=Photo%20Studio">Photo studios</Link><Link href="/studios?category=Sound%20Stage">Sound stages</Link><Link href="/studios?category=Podcast%20Room">Podcast rooms</Link><Link href="/studios?category=Music%20Studio">Music studios</Link><Link href="/studios?category=Art%20Workshop">Art workshops</Link></div>
        <div className="footer-col"><strong>StudioSpace</strong><Link href="/#how-it-works">How it works</Link><Link href="/register">Become a host</Link><Link href="/login">Your account</Link></div>
        <div className="footer-col"><strong>Stay in the loop</strong><p>Fresh spaces and creative inspiration, occasionally.</p><form className="newsletter" onSubmit={subscribe}><input name="email" type="email" placeholder="Your email address" aria-label="Your email address" required /><button aria-label="Subscribe" disabled={subscribing}><ArrowUpRight size={17} /></button></form></div>
      </div>
      <div className="footer-bottom"><span>© 2026 StudioSpace. Made for makers.</span><div><Link href="/#about">About</Link><Link href="/#how-it-works">How it works</Link></div></div>
    </footer>
  );
}

export function SiteLayout({ children, darkNavbar = false }: { children: React.ReactNode; darkNavbar?: boolean }) {
  return <><Navbar solid={darkNavbar} />{children}<Footer /></>;
}
