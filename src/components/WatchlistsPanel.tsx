"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError, watchlistApi } from "@/lib/api";
import type { Watchlist } from "@/lib/types";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";

export function WatchlistsPanel() {
  const [watchlists, setWatchlists] = useState<Watchlist[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [symbolInputs, setSymbolInputs] = useState<Record<number, string>>({});
  const [itemError, setItemError] = useState<string | null>(null);

  function load() {
    watchlistApi
      .list()
      .then((res) => setWatchlists(res.watchlists))
      .catch((err) =>
        setLoadError(err instanceof ApiError ? err.message : "Couldn't load watchlists."),
      );
  }

  useEffect(load, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    setCreateError(null);
    try {
      await watchlistApi.create(newName.trim());
      setNewName("");
      load();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Couldn't create watchlist.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(watchlistId: number) {
    await watchlistApi.remove(watchlistId);
    load();
  }

  async function handleAddSymbol(watchlistId: number) {
    const symbol = (symbolInputs[watchlistId] ?? "").trim();
    if (!symbol) return;

    setItemError(null);
    try {
      await watchlistApi.addItem(watchlistId, symbol.toUpperCase());
      setSymbolInputs((prev) => ({ ...prev, [watchlistId]: "" }));
      load();
    } catch (err) {
      setItemError(err instanceof ApiError ? err.message : "Couldn't add symbol.");
    }
  }

  async function handleRemoveSymbol(watchlistId: number, itemId: number) {
    await watchlistApi.removeItem(watchlistId, itemId);
    load();
  }

  return (
    <Panel
      title="Watchlists"
      description="Group the symbols you want alerts scoped to."
    >
      <form onSubmit={handleCreate} className="mb-5 flex gap-2">
        <Input
          placeholder="New watchlist name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button type="submit" disabled={creating || !newName.trim()}>
          {creating ? "Creating…" : "Create"}
        </Button>
      </form>
      {createError && <p className="mb-4 text-sm text-loss-500">{createError}</p>}
      {itemError && <p className="mb-4 text-sm text-loss-500">{itemError}</p>}

      {loadError && <EmptyState>{loadError}</EmptyState>}

      {!loadError && watchlists !== null && watchlists.length === 0 && (
        <EmptyState>No watchlists yet. Create one above.</EmptyState>
      )}

      <div className="space-y-4">
        {watchlists?.map((watchlist) => (
          <div key={watchlist.id} className="rounded border border-ink-700 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif text-base text-paper-100">{watchlist.name}</h3>
              <Button variant="ghost" onClick={() => handleDelete(watchlist.id)}>
                Delete
              </Button>
            </div>

            {watchlist.items.length > 0 && (
              <ul className="mb-3 flex flex-wrap gap-2">
                {watchlist.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-2 rounded-sm bg-ink-800 px-2 py-1 font-mono text-xs text-paper-100"
                  >
                    {item.symbol}
                    <button
                      type="button"
                      aria-label={`Remove ${item.symbol}`}
                      className="text-paper-500 hover:text-loss-500"
                      onClick={() => handleRemoveSymbol(watchlist.id, item.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="Symbol (e.g. RELIANCE)"
                value={symbolInputs[watchlist.id] ?? ""}
                onChange={(e) =>
                  setSymbolInputs((prev) => ({ ...prev, [watchlist.id]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSymbol(watchlist.id);
                  }
                }}
              />
              <Button variant="secondary" onClick={() => handleAddSymbol(watchlist.id)}>
                Add
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}