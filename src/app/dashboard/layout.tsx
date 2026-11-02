import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <Suspense fallback={<div className="page-loading"><span className="spinner" /> Loading your workspace...</div>}><DashboardShell>{children}</DashboardShell></Suspense>; }
