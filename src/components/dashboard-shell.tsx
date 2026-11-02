"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, DoorOpen, LayoutDashboard, LogOut, Plus, Settings, Sparkles } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Brand } from "@/components/site-shell";

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

  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, session, router]);

  async function logout() {
    await authClient.signOut();
    router.replace("/");
    router.refresh();
  }

  if (isPending || !session) return <div className="page-loading"><span className="spinner" /> Loading your workspace...</div>;
  const userName = session.user.name || session.user.email.split("@")[0];
  return <div className="dashboard-layout">
    <aside className={`dashboard-sidebar ${mobile ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand"><Brand light /><button className="sidebar-home" onClick={() => router.push("/")} aria-label="Go to home"><ArrowLeft size={16} /></button></div>
      <div className="sidebar-user"><div className="user-avatar">{userName.slice(0, 1).toUpperCase()}</div><div><strong>{userName}</strong><small>Creator account</small></div></div>
      <p className="sidebar-label">Workspace</p><nav className="sidebar-nav">{links.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobile(false)} className={pathname === href ? "active" : ""}><Icon size={17} />{label}{pathname === href && <span />}</Link>)}</nav>
      <button className="sidebar-logout" onClick={logout}><LogOut size={17} /> Log out</button>
      <div className="sidebar-help"><Sparkles size={17} /><strong>Keep making.</strong><p>Your next idea deserves a great space.</p><Link href="/studios">Explore studios →</Link></div>
    </aside>
    <div className="dashboard-main"><header className="dashboard-topbar"><button className="dash-mobile-toggle" onClick={() => setMobile(!mobile)} aria-label="Toggle menu"><span /><span /></button><span>Creator workspace</span><Link href="/" className="dashboard-view-site">View site <ArrowLeft size={14} /></Link><div className="topbar-avatar">{userName.slice(0, 1).toUpperCase()}</div></header><main className="dashboard-content">{children}</main></div>
  </div>;
}
