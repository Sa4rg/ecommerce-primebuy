// ⚠️ httpOnly Cookies Migration
// Tokens are now stored in httpOnly cookies (managed by the backend).
// This module no longer uses localStorage for security reasons (XSS protection).
// We keep a notification system for AuthContext to sync auth state changes.

function notify(authenticated) {
  window.dispatchEvent(
    new CustomEvent("auth:state", { detail: { authenticated } })
  );
}

export function getAccessToken() {
  // httpOnly cookies are not accessible from JavaScript
  // Token is sent automatically by the browser with credentials: 'include'
  return null;
}

export function setAccessToken(token) {
  // No-op: tokens are managed by httpOnly cookies
  // Notify AuthContext that user is authenticated
  if (token) {
    notify(true);
  } else {
    notify(false);
  }
}

export function clearAccessToken() {
  // No-op: cookies are cleared by backend on logout
  // Notify AuthContext that user is logged out
  notify(false);
}
