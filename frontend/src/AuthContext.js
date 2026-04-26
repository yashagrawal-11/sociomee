import { createContext, useContext, useState, useEffect, useCallback } from "react";

const BASE = "http://127.0.0.1:8000";
const AuthContext = createContext(null);
const TOKEN_KEY = "sociomee_token";

function saveToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function loadToken() { return localStorage.getItem(TOKEN_KEY) || ""; }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = loadToken();
    if (!stored) { setLoading(false); return; }
    fetch(`${BASE}/auth/me`, { headers: { Authorization: `Bearer ${stored}` } })
      .then(r => { if (!r.ok) throw new Error("invalid"); return r.json(); })
      .then(data => {
        setToken(stored); setUser(data);
        if (data?.user_id) localStorage.setItem("sociomee_user_id", data.user_id);
        if (data?.email)   localStorage.setItem("sociomee_email",   data.email);
      })
      .catch(() => { clearToken(); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const loginWithGoogle = useCallback(async () => {
    try {
      const res  = await fetch(`${BASE}/auth/google/login`);
      const data = await res.json();
      if (data?.url) window.location.href = data.url;
    } catch (e) { console.error("Login failed:", e); }
  }, []);

  const handleCallback = useCallback(async (newToken) => {
    if (!newToken) return;
    saveToken(newToken); setToken(newToken);
    try {
      const res  = await fetch(`${BASE}/auth/me`, { headers: { Authorization: `Bearer ${newToken}` } });
      const data = await res.json();
      setUser(data);
      if (data?.user_id) localStorage.setItem("sociomee_user_id", data.user_id);
      if (data?.email)   localStorage.setItem("sociomee_email",   data.email);
    } catch { clearToken(); setUser(null); }
  }, []);

  const logout = useCallback(async () => {
    try { if (token) await fetch(`${BASE}/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }); } catch {}
    clearToken();
    localStorage.removeItem("sociomee_user_id");
    localStorage.removeItem("sociomee_email");
    setToken(""); setUser(null);
  }, [token]);

  const refreshToken = useCallback(async () => {
    if (!token) return;
    try {
      const res  = await fetch(`${BASE}/auth/refresh-token`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data?.token) { saveToken(data.token); setToken(data.token); }
    } catch (e) { console.error("Token refresh failed:", e); }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, isLoggedIn: !!user, isPro: !!(user?.plan && user.plan !== "free"), loginWithGoogle, handleCallback, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}