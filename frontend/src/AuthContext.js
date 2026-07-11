import { createContext, useContext, useState, useEffect, useCallback } from "react";
const BASE = "https://sociomeeai.com/api";
const AuthContext = createContext(null);
// SECURITY MIGRATION: the session now lives in an httpOnly cookie set by the backend,
// not in localStorage. The cookie is invisible to JavaScript (that's the whole point —
// it can't be stolen via XSS), so we no longer read/write a token value here at all.
// credentials: "include" is required on every fetch so the browser actually sends the cookie.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // On load, just ask the backend "who am I?" — the cookie (if present and valid)
    // answers this automatically. No token to manage on this side at all.
    fetch(`${BASE}/auth/refresh-token`, { method: "POST", credentials: "include" }).catch(() => {});
    fetch(`${BASE}/auth/me`, { credentials: "include" })
      .then(r => { if (!r.ok) throw new Error("invalid"); return r.json(); })
      .then(data => {
        setUser(data);
        if (data?.user_id) localStorage.setItem("sociomee_user_id", data.user_id);
        if (data?.email)   localStorage.setItem("sociomee_email",   data.email);
      })
      .catch(() => { setUser(null); })
      .finally(() => setLoading(false));
  }, []);
  const loginWithGoogle = useCallback(async () => {
    try {
      const res  = await fetch(`${BASE}/auth/google/login`, { credentials: "include" });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    } catch (e) { console.error("Login failed:", e); }
  }, []);
  const loginWithGithub = useCallback(async () => {
    try {
      const res  = await fetch(`${BASE}/auth/github/login`, { credentials: "include" });
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    } catch (e) { console.error("GitHub login failed:", e); }
  }, []);
  const handleCallback = useCallback(async (token) => {
    // Setting the cookie on the OAuth redirect itself is unreliable (it crosses through
    // Google's domain mid-chain), so instead we call set-session directly from sociomeeai.com
    // — a same-origin request — using the token the redirect put in the URL. This actually
    // sets the cookie reliably, then we fetch the user as normal.
    try {
      if (token) {
        await fetch(`${BASE}/auth/set-session`, {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      }
      const res  = await fetch(`${BASE}/auth/me`, { credentials: "include" });
      const data = await res.json();
      setUser(data);
      if (data?.user_id) localStorage.setItem("sociomee_user_id", data.user_id);
      if (data?.email)   localStorage.setItem("sociomee_email",   data.email);
    } catch { setUser(null); }
  }, []);
  const logout = useCallback(async () => {
    try { await fetch(`${BASE}/auth/logout`, { method: "POST", credentials: "include" }); } catch {}
    localStorage.removeItem("sociomee_user_id");
    localStorage.removeItem("sociomee_email");
    setUser(null);
  }, []);
  const refreshToken = useCallback(async () => {
    try { await fetch(`${BASE}/auth/refresh-token`, { method: "POST", credentials: "include" }); } catch (e) { console.error("Token refresh failed:", e); }
  }, []);
  return (
    <AuthContext.Provider value={{ user, loading, isLoggedIn: !!user, isPro: !!(user?.plan && user.plan !== "free"), loginWithGoogle, loginWithGithub, handleCallback, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
