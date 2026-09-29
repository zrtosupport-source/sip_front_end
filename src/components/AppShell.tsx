"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col justify-between border-r border-ink-700 bg-ink-900 px-5 py-6">
        <div>
          <p className="font-serif text-xl leading-tight text-paper-100">
            Stock
            <br />
            Intelligence
          </p>
          <p className="mt-1 text-xs tracking-wide text-brass-400">
            Platform
          </p>
        </div>

        <div className="space-y-3 border-t border-ink-700 pt-4">
          <p className="truncate text-sm text-paper-300" title={user?.email}>
            {user?.email}
          </p>
          <Button variant="ghost" className="w-full" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto max-w-3xl space-y-8">{children}</div>
      </main>
    </div>
  );
}