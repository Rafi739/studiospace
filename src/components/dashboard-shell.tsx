"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, DoorOpen, LayoutDashboard, LogOut, Plus, Settings, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { getInitials } from "@/lib/profile";
import { Brand } from "@/components/site-shell";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Add a studio", href: "/dashboard/add-studio", icon: Plus },
  { label: "My listings", href: "/dashboard/my-studios", icon: DoorOpen },
  { label: "My bookings", href: "/dashboard/bookings", icon: CalendarDays },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [mobile, setMobile] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, session, router]);

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

  if (isPending || !session) return <div className="page-loading"><span className="spinner" /> Loading your workspace...</div>;
  const userName = session.user.name || session.user.email.split("@")[0];
  return <div className="dashboard-layout">
    <aside className={`dashboard-sidebar ${mobile ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand"><Brand light /><button className="sidebar-home" onClick={() => router.push("/")} aria-label="Go to home"><ArrowLeft size={16} /></button></div>
      <Link href="/dashboard/settings" className="sidebar-user" aria-label="Open profile settings" onClick={() => setMobile(false)}>
        <div className="user-avatar">{session.user.image
          ? <Image src={session.user.image} alt="" fill sizes="42px" unoptimized />
          : getInitials(userName)}</div>
        <div><strong>{userName}</strong><small>Profile settings</small></div>
      </Link>
      <p className="sidebar-label">Workspace</p><nav className="sidebar-nav">{links.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobile(false)} className={pathname === href ? "active" : ""}><Icon size={17} />{label}{pathname === href && <span />}</Link>)}</nav>
      <button className="sidebar-logout" onClick={logout} disabled={loggingOut}><LogOut size={17} /> {loggingOut ? "Logging out..." : "Log out"}</button>
      <div className="sidebar-help"><Sparkles size={17} /><strong>Keep making.</strong><p>Your next idea deserves a great space.</p><Link href="/studios">Explore studios →</Link></div>
    </aside>
    <div className="dashboard-main"><header className="dashboard-topbar"><button className="dash-mobile-toggle" onClick={() => setMobile(!mobile)} aria-label="Toggle menu"><span /><span /></button><span>Creator workspace</span><Link href="/" className="dashboard-view-site">View site <ArrowLeft size={14} /></Link><ThemeToggle /><Link href="/dashboard/settings" className="topbar-avatar" aria-label="Profile settings">{session.user.image
      ? <Image src={session.user.image} alt="" fill sizes="36px" unoptimized />
      : getInitials(userName)}</Link></header><main className="dashboard-content">{children}</main></div>
  </div>;
}
