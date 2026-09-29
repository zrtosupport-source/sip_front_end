"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { ScannerPanel } from "@/components/ScannerPanel";
import { WatchlistsPanel } from "@/components/WatchlistsPanel";
import { AlertsPanel } from "@/components/AlertsPanel";

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-paper-500">Loading…</p>
      </div>
    );
  }

  return (
    <AppShell>
      <ScannerPanel />
      <WatchlistsPanel />
      <AlertsPanel />
    </AppShell>
  );
}