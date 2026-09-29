import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "@/lib/token-store";
import type {
  AlertNotification,
  AlertRule,
  ApiErrorBody,
  SavedStrategy,
  ScanExpression,
  ScanResult,
  ScanRunSummary,
  ScanStrategySummary,
  TokenResponse,
  User,
  Watchlist,
  WatchlistItem,
} from "@/lib/types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function extractErrorMessage(body: ApiErrorBody, fallback: string): string {
  if (!body.detail) return fallback;
  if (typeof body.detail === "string") return body.detail;
  return body.detail.map((e) => e.msg).join(", ") || fallback;
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        clearTokens();
        return false;
      }

      const tokens: TokenResponse = await response.json();
      setTokens(tokens.access_token, tokens.refresh_token);
      return true;
    } catch {
      return false;
    }
  })();

  const result = await refreshInFlight;
  refreshInFlight = null;
  return result;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  skipAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, skipAuth = false } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const doFetch = () =>
    fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let response = await doFetch();

  if (response.status === 401 && !skipAuth) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const token = getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
      response = await doFetch();
    }
  }

  if (!response.ok) {
    let body: ApiErrorBody = {};
    try {
      body = await response.json();
    } catch {
      // Non-JSON error body (rare) -- fall through to the status-based message.
    }
    throw new ApiError(
      response.status,
      extractErrorMessage(body, `Request failed (${response.status})`),
    );
  }

  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

// ---- Auth ----

export const authApi = {
  register: (data: { full_name: string; email: string; password: string }) =>
    request<User>("/auth/register", { method: "POST", body: data, skipAuth: true }),

  login: (data: { email: string; password: string }) =>
    request<TokenResponse>("/auth/login", { method: "POST", body: data, skipAuth: true }),

  me: () => request<User>("/auth/me"),

  logout: (refreshToken: string) =>
    request<{ message: string }>("/auth/logout", {
      method: "POST",
      body: { refresh_token: refreshToken },
    }),

  forgotPassword: (email: string) =>
    request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
      skipAuth: true,
    }),
};

// ---- Scanner ----

export const scannerApi = {
  listStrategies: () => request<ScanStrategySummary[]>("/scanner/strategies"),

  runStrategy: (key: string) =>
    request<ScanResult[]>(`/scanner/strategies/${key}/scan`, { method: "POST" }),

  runCustomScan: (strategyName: string, expression: ScanExpression) =>
    request<ScanResult[]>("/scanner/scan", {
      method: "POST",
      body: { strategy_name: strategyName, expression },
    }),

  listRuns: () =>
    request<{ total: number; limit: number; offset: number; runs: ScanRunSummary[] }>(
      "/scanner/runs",
    ),
};

// ---- Watchlists ----

export const watchlistApi = {
  list: () => request<{ watchlists: Watchlist[] }>("/watchlists"),

  create: (name: string) =>
    request<Watchlist>("/watchlists", { method: "POST", body: { name } }),

  remove: (watchlistId: number) =>
    request<void>(`/watchlists/${watchlistId}`, { method: "DELETE" }),

  addItem: (watchlistId: number, symbol: string) =>
    request<WatchlistItem>(`/watchlists/${watchlistId}/items`, {
      method: "POST",
      body: { symbol },
    }),

  removeItem: (watchlistId: number, itemId: number) =>
    request<void>(`/watchlists/${watchlistId}/items/${itemId}`, {
      method: "DELETE",
    }),
};

// ---- Saved strategies ----

export const strategyApi = {
  list: () => request<{ strategies: SavedStrategy[] }>("/strategies"),

  create: (name: string, expression: ScanExpression) =>
    request<SavedStrategy>("/strategies", { method: "POST", body: { name, expression } }),

  remove: (id: number) => request<void>(`/strategies/${id}`, { method: "DELETE" }),

  run: (id: number) => request<ScanResult[]>(`/strategies/${id}/scan`, { method: "POST" }),
};

// ---- Alerts ----

export const alertApi = {
  list: () => request<{ alerts: AlertRule[] }>("/alerts"),

  create: (data: {
    name: string;
    strategy_key?: string;
    saved_strategy_id?: number;
    watchlist_id?: number | null;
  }) => request<AlertRule>("/alerts", { method: "POST", body: data }),

  update: (id: number, data: Partial<{ is_active: boolean; name: string }>) =>
    request<AlertRule>(`/alerts/${id}`, { method: "PATCH", body: data }),

  remove: (id: number) => request<void>(`/alerts/${id}`, { method: "DELETE" }),

  runNow: (id: number) => request<ScanResult[]>(`/alerts/${id}/run`, { method: "POST" }),

  recentNotifications: () =>
    request<{ notifications: AlertNotification[] }>("/alerts/notifications/recent"),
};