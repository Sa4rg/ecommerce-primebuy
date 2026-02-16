const ACCESS_TOKEN_KEY = "accessToken";

function notify(token) {
  window.dispatchEvent(
    new CustomEvent("auth:token", { detail: token || "" })
  );
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
}

export function setAccessToken(token) {
  if (!token) {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    notify("");
    return;
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  notify(token);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  notify("");
}
