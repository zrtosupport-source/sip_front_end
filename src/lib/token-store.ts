/**
 * Plain (non-React) token storage so the API client can read/write
 * tokens outside of a component tree (e.g. during a fetch retry),
 * while AuthContext wraps this with React state for re-renders.
 *
 * localStorage, not cookies: this app calls the API directly from
 * the browser with an Authorization header, not same-origin
 * requests that would benefit from cookie auto-attachment.
 */

const ACCESS_KEY = "sip_access_token";
const REFRESH_KEY = "sip_refresh_token";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(ACCESS_KEY, accessToken);
  window.localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}