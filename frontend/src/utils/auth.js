export const AUTH_KEYS = ["token", "adminToken", "role", "userId", "user"];
export const SESSION_EXPIRED_EVENT = "vrms:session-expired";
export const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please log in again.";

export const clearAuth = () => {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const decodeToken = (token) => {
  if (!token || typeof token !== "string") return null;

  const part = token.split(".")[1];
  if (!part) return null;

  try {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
};

export const getTokenExpiry = (token) => {
  const payload = decodeToken(token);
  return typeof payload?.exp === "number" ? payload.exp * 1000 : null;
};

export const isTokenExpired = (token) => {
  const expiry = getTokenExpiry(token);
  return !expiry || expiry <= Date.now();
};

let lastExpiryEventAt = 0;

export const notifySessionExpired = (admin = false) => {
  clearAuth();

  const now = Date.now();
  if (now - lastExpiryEventAt < 1000) return;
  lastExpiryEventAt = now;

  window.dispatchEvent(
    new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { admin } })
  );
};
