import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider, useAuth } from "./AuthContext";
import { AuthCallback } from "./LoginPage";
import LoginPage from "./LoginPage";
import App from "./App";
import YouTubeCallback from "./YouTubeCallback";

function Router() {
  const { isLoggedIn, loading } = useAuth();
  const path = window.location.pathname;

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px", background:"linear-gradient(135deg,#f5f3ff,#fff0f7)", fontFamily:"sans-serif" }}>
      <div style={{ width:"44px", height:"44px", borderRadius:"50%", border:"3px solid rgba(124,58,237,0.2)", borderTopColor:"#7c3aed", animation:"spin 0.7s linear infinite" }}/>
      <p style={{ color:"#8b6b9a", fontSize:"14px", fontWeight:"600", margin:0 }}>Loading SocioMee…</p>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}"}</style>
    </div>
  );

  // YouTube OAuth callback — must be before login check
  if (path === "/youtube/callback") return <YouTubeCallback />;

  // Google login callback
  if (path === "/auth/callback") return <AuthCallback />;

  if (!isLoggedIn) return <LoginPage />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <Router />
    </AuthProvider>
  </React.StrictMode>
);