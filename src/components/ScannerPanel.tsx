"use client";

import { useEffect, useState } from "react";
import { ApiError, scannerApi, strategyApi } from "@/lib/api";
import type { SavedStrategy, ScanResult, ScanStrategySummary } from "@/lib/types";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

type RunningKey = string | null;

export function ScannerPanel() {
  const [builtIn, setBuiltIn] = useState<ScanStrategySummary[]>([]);
  const [saved, setSaved] = useState<SavedStrategy[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [running, setRunning] = useState<RunningKey>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [lastRunLabel, setLastRunLabel] = useState<string | null>(null);
  const [results, setResults] = useState<ScanResult[] | null>(null);

  useEffect(() => {
    Promise.all([scannerApi.listStrategies(), strategyApi.list()])
      .then(([builtInList, savedResponse]) => {
        setBuiltIn(builtInList);
        setSaved(savedResponse.strategies);
      })
      .catch((err) =>
        setLoadError(err instanceof ApiError ? err.message : "Couldn't load strategies."),
      );
  }, []);

  async function runBuiltIn(strategy: ScanStrategySummary) {
    setRunning(strategy.key);
    setRunError(null);
    try {
      const matches = await scannerApi.runStrategy(strategy.key);
      setResults(matches);
      setLastRunLabel(strategy.name);
    } catch (err) {
      setRunError(err instanceof ApiError ? err.message : "Scan failed.");
    } finally {
      setRunning(null);
    }
  }

  async function runSaved(strategy: SavedStrategy) {
    setRunning(`saved:${strategy.id}`);
    setRunError(null);
    try {
      const matches = await strategyApi.run(strategy.id);
      setResults(matches);
      setLastRunLabel(strategy.name);
    } catch (err) {
      setRunError(err instanceof ApiError ? err.message : "Scan failed.");
    } finally {
      setRunning(null);
    }
  }

  return (
    <Panel
      title="Scanner"
      description="Run a strategy against every synced instrument."
    >
      {loadError && <EmptyState>{loadError}</EmptyState>}

      {!loadError && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {builtIn.map((strategy) => (
              <Button
                key={strategy.key}
                variant="secondary"
                disabled={running !== null}
                onClick={() => runBuiltIn(strategy)}
              >
                {running === strategy.key ? "Running…" : strategy.name}
              </Button>
            ))}

            {saved.map((strategy) => (
              <Button
                key={strategy.id}
                variant="secondary"
                disabled={running !== null}
                onClick={() => runSaved(strategy)}
              >
                {running === `saved:${strategy.id}` ? "Running…" : strategy.name}
              </Button>
            ))}
          </div>

          {saved.length === 0 && builtIn.length === 0 && (
            <EmptyState>No strategies available yet.</EmptyState>
          )}

          {runError && <p className="text-sm text-loss-500">{runError}</p>}

          {results !== null && !runError && (
            <div>
              <p className="mb-2 text-sm text-paper-500">
                {results.length === 0
                  ? `No matches for ${lastRunLabel}.`
                  : `${results.length} match${results.length === 1 ? "" : "es"} for ${lastRunLabel}`}
              </p>

              {results.length > 0 && (
                <ul className="divide-y divide-ink-700 rounded border border-ink-700">
                  {results.map((result) => (
                    <li key={result.symbol} className="flex flex-wrap items-baseline gap-3 px-4 py-2.5">
                      <span className="font-mono text-sm text-brass-400">
                        {result.symbol}
                      </span>
                      <span className="text-sm text-paper-300">
                        {result.reasons.join("; ")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}