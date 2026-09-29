"use client";

import { FormEvent, useEffect, useState } from "react";
import { alertApi, ApiError, scannerApi, strategyApi, watchlistApi } from "@/lib/api";
import type {
  AlertNotification,
  AlertRule,
  SavedStrategy,
  ScanStrategySummary,
  Watchlist,
} from "@/lib/types";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

const NONE_WATCHLIST = "";

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<AlertRule[] | null>(null);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [builtIn, setBuiltIn] = useState<ScanStrategySummary[]>([]);
  const [saved, setSaved] = useState<SavedStrategy[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [strategyValue, setStrategyValue] = useState("");
  const [watchlistValue, setWatchlistValue] = useState(NONE_WATCHLIST);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [busyId, setBusyId] = useState<number | null>(null);
  const [runResultByAlert, setRunResultByAlert] = useState<Record<number, string>>({});

  function load() {
    Promise.all([
      alertApi.list(),
      alertApi.recentNotifications(),
      watchlistApi.list(),
      scannerApi.listStrategies(),
      strategyApi.list(),
    ])
      .then(([alertsRes, notifsRes, watchlistsRes, builtInList, savedRes]) => {
        setAlerts(alertsRes.alerts);
        setNotifications(notifsRes.notifications);
        setWatchlists(watchlistsRes.watchlists);
        setBuiltIn(builtInList);
        setSaved(savedRes.strategies);
      })
      .catch((err) =>
        setLoadError(err instanceof ApiError ? err.message : "Couldn't load alerts."),
      );
  }

  useEffect(load, []);

  function strategyLabel(alert: AlertRule): string {
    if (alert.strategy_key) {
      return builtIn.find((s) => s.key === alert.strategy_key)?.name ?? alert.strategy_key;
    }
    return saved.find((s) => s.id === alert.saved_strategy_id)?.name ?? "Saved strategy";
  }

  function watchlistLabel(alert: AlertRule): string {
    if (alert.watchlist_id === null) return "All symbols";
    return watchlists.find((w) => w.id === alert.watchlist_id)?.name ?? "Watchlist";
  }

  function alertNameFor(alertRuleId: number): string {
    return alerts?.find((a) => a.id === alertRuleId)?.name ?? `Alert #${alertRuleId}`;
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !strategyValue) return;

    setCreating(true);
    setCreateError(null);
    try {
      const [source, value] = strategyValue.split(":");
      await alertApi.create({
        name: name.trim(),
        ...(source === "builtin" ? { strategy_key: value } : { saved_strategy_id: Number(value) }),
        ...(watchlistValue ? { watchlist_id: Number(watchlistValue) } : {}),
      });
      setName("");
      setStrategyValue("");
      setWatchlistValue(NONE_WATCHLIST);
      load();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Couldn't create alert.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(alert: AlertRule) {
    setBusyId(alert.id);
    try {
      await alertApi.update(alert.id, { is_active: !alert.is_active });
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(alertId: number) {
    setBusyId(alertId);
    try {
      await alertApi.remove(alertId);
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleRunNow(alertId: number) {
    setBusyId(alertId);
    try {
      const matches = await alertApi.runNow(alertId);
      setRunResultByAlert((prev) => ({
        ...prev,
        [alertId]:
          matches.length === 0
            ? "No new matches."
            : `${matches.length} new match${matches.length === 1 ? "" : "es"}.`,
      }));
      load();
    } catch (err) {
      setRunResultByAlert((prev) => ({
        ...prev,
        [alertId]: err instanceof ApiError ? err.message : "Run failed.",
      }));
    } finally {
      setBusyId(null);
    }
  }

  const hasStrategyOptions = builtIn.length > 0 || saved.length > 0;

  return (
    <Panel
      title="Alerts"
      description="Get emailed when a strategy newly matches -- not every day it keeps matching."
    >
      {loadError && <EmptyState>{loadError}</EmptyState>}

      {!loadError && (
        <>
          <form onSubmit={handleCreate} className="mb-6 space-y-3">
            <Input
              placeholder="Alert name (e.g. Breakout watch)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="flex gap-2">
              <select
                className="w-full rounded-sm border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-paper-100 focus:border-brass-500"
                value={strategyValue}
                onChange={(e) => setStrategyValue(e.target.value)}
              >
                <option value="">Select a strategy…</option>
                {builtIn.map((s) => (
                  <option key={`builtin:${s.key}`} value={`builtin:${s.key}`}>
                    {s.name}
                  </option>
                ))}
                {saved.map((s) => (
                  <option key={`saved:${s.id}`} value={`saved:${s.id}`}>
                    {s.name} (saved)
                  </option>
                ))}
              </select>

              <select
                className="w-full rounded-sm border border-ink-600 bg-ink-900 px-3 py-1.5 text-sm text-paper-100 focus:border-brass-500"
                value={watchlistValue}
                onChange={(e) => setWatchlistValue(e.target.value)}
              >
                <option value={NONE_WATCHLIST}>All symbols</option>
                {watchlists.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {!hasStrategyOptions && (
              <p className="text-sm text-paper-500">
                No strategies available yet -- save one, or check back once the scanner has strategies configured.
              </p>
            )}

            <Button type="submit" disabled={creating || !name.trim() || !strategyValue}>
              {creating ? "Creating…" : "Create alert"}
            </Button>
            {createError && <p className="text-sm text-loss-500">{createError}</p>}
          </form>

          {alerts !== null && alerts.length === 0 && (
            <EmptyState>No alerts yet. Create one above.</EmptyState>
          )}

          <div className="space-y-3">
            {alerts?.map((alert) => (
              <div key={alert.id} className="rounded border border-ink-700 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-serif text-base text-paper-100">{alert.name}</p>
                    <p className="text-sm text-paper-500">
                      {strategyLabel(alert)} — {watchlistLabel(alert)}
                    </p>
                  </div>
                  <Badge tone={alert.is_active ? "gain" : "neutral"}>
                    {alert.is_active ? "Active" : "Paused"}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    disabled={busyId === alert.id}
                    onClick={() => handleRunNow(alert.id)}
                  >
                    Run now
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={busyId === alert.id}
                    onClick={() => handleToggleActive(alert)}
                  >
                    {alert.is_active ? "Pause" : "Resume"}
                  </Button>
                  <Button
                    variant="danger"
                    disabled={busyId === alert.id}
                    onClick={() => handleDelete(alert.id)}
                  >
                    Delete
                  </Button>
                </div>

                {runResultByAlert[alert.id] && (
                  <p className="mt-2 text-sm text-paper-300">{runResultByAlert[alert.id]}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="mt-8 border-t border-ink-700 pt-5">
        <h3 className="mb-3 font-serif text-base text-paper-100">Recent notifications</h3>
        {notifications.length === 0 ? (
          <EmptyState>Nothing&apos;s fired yet.</EmptyState>
        ) : (
          <ul className="divide-y divide-ink-700 rounded border border-ink-700">
            {notifications.map((n) => (
              <li key={n.id} className="px-4 py-2.5">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-sm text-brass-400">{n.symbol}</span>
                  <span className="text-xs text-paper-500">{alertNameFor(n.alert_rule_id)}</span>
                </div>
                <p className="mt-0.5 text-sm text-paper-300">{n.reasons.join("; ")}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}