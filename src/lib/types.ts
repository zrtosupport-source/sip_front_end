/**
 * Types mirroring the backend's Pydantic schemas. Kept as one file
 * since the backend keeps schemas split per-domain but small --
 * this file follows the same domain grouping via comments so it's
 * easy to cross-reference against each app/<domain>/schemas.py.
 */

// ---- Auth (app/auth/schemas.py) ----

export type UserRole = "ADMIN" | "USER";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";

export interface User {
  uuid: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  is_verified: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// ---- Scanner (app/scanner/schemas.py) ----

export type LogicalOperator = "AND" | "OR" | "NOT";
export type ComparisonOperator =
  | ">"
  | "<"
  | ">="
  | "<="
  | "=="
  | "!="
  | "crosses_above"
  | "crosses_below";

export type IndicatorField =
  | "CLOSE"
  | "OPEN"
  | "HIGH"
  | "LOW"
  | "VOLUME"
  | "SMA20"
  | "SMA50"
  | "SMA200"
  | "EMA20"
  | "EMA50"
  | "EMA200"
  | "RSI14"
  | "MACD"
  | "MACD_SIGNAL"
  | "MACD_HISTOGRAM"
  | "ATR14"
  | "ADX14"
  | "SUPERTREND10"
  | "SUPERTREND_BULLISH"
  | "BB_UPPER"
  | "BB_MIDDLE"
  | "BB_LOWER"
  | "HIGHEST252"
  | "LOWEST252"
  | "VOLUME_SURGE20";

export interface ScanCondition {
  left: IndicatorField;
  operator: ComparisonOperator;
  right: IndicatorField | string;
}

export interface ScanExpression {
  operator: LogicalOperator;
  children: (ScanExpression | ScanCondition)[];
}

export interface ScanRequest {
  strategy_name: string;
  expression: ScanExpression;
}

export interface ScanResult {
  symbol: string;
  reasons: string[];
}

export interface ScanStrategySummary {
  key: string;
  name: string;
}

export interface ScanRunSummary {
  id: number;
  user_id: number | null;
  strategy: string;
  stocks_scanned: number;
  matches_found: number;
  started_at: string;
}

// ---- Watchlists (app/watchlists/schemas.py) ----

export interface WatchlistItem {
  id: number;
  symbol: string;
  added_at: string;
}

export interface Watchlist {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
  items: WatchlistItem[];
}

// ---- Saved strategies (app/strategies/schemas.py) ----

export interface SavedStrategy {
  id: number;
  user_id: number;
  name: string;
  expression: ScanExpression;
  created_at: string;
  updated_at: string;
}

// ---- Alerts (app/alerts/schemas.py) ----

export interface AlertRule {
  id: number;
  user_id: number;
  name: string;
  strategy_key: string | null;
  saved_strategy_id: number | null;
  watchlist_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_checked_at: string | null;
  last_matched_symbols: string[];
}

export interface AlertNotification {
  id: number;
  alert_rule_id: number;
  symbol: string;
  reasons: string[];
  notified_at: string;
}

// ---- Generic API error shape (FastAPI's default) ----

export interface ApiErrorBody {
  detail?: string | { msg: string; loc: (string | number)[] }[];
}