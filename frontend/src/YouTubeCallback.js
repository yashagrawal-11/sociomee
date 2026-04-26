/**
 * YouTubeCallback.js
 * Handles the OAuth redirect from Google after YouTube connect.
 * Exchanges the code via backend, then redirects to home.
 */
import { useEffect, useRef, useState } from "react";

const BASE = "https://sociomee.in/api";

export default function YouTubeCallback() {
  const [status, setStatus] = useState("connecting");
  const [msg,    setMsg   ] = useState("");
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const params  = new URLSearchParams(window.location.search);
    const code    = params.get("code");
    const error   = params.get("error");
    const userId  = sessionStorage.getItem("yt_connect_user_id")
                 || localStorage.getItem("sociomee_user_id")
                 || "";

    if (error || !code) {
      setStatus("error");
      setMsg(error || "No authorization code received.");
      return;
    }

    fetch(`${BASE}/youtube/connect`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        user_id:      userId,
        code:         code,
        redirect_uri: window.location.origin + "/youtube/callback",
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStatus("success");
          setMsg(`Connected: ${data.channel_title} · ${data.subscribers?.toLocaleString()} subscribers`);
          sessionStorage.removeItem("yt_connect_user_id");
          setTimeout(() => { window.location.href = "/"; }, 2000);
        } else {
          setStatus("error");
          setMsg(data.detail || "Connection failed. Please try again.");
        }
      })
      .catch(e => { setStatus("error"); setMsg(e.message || "Network error."); });
  }, []);

  const cfg = {
    connecting: { icon:"⏳", color:"#7c3aed", label:"Connecting your YouTube channel…" },
    success:    { icon:"✅", color:"#10b981", label:"Connected! Redirecting…" },
    error:      { icon:"❌", color:"#ef4444", label:"Connection failed" },
  }[status];

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px", background:"linear-gradient(135deg,#f5f3ff,#fff0f7)", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ fontSize:"52px" }}>{cfg.icon}</div>
      <p style={{ fontSize:"16px", fontWeight:"700", color:cfg.color, margin:0 }}>{cfg.label}</p>
      {msg && <p style={{ fontSize:"13px", color:"#3b1f4e", maxWidth:"360px", textAlign:"center", margin:0 }}>{msg}</p>}
      {status === "error" && (
        <button onClick={() => window.location.href = "/"} style={{ padding:"10px 28px", borderRadius:"99px", border:"none", background:"#7c3aed", color:"white", fontWeight:"700", fontSize:"14px", cursor:"pointer", fontFamily:"inherit" }}>
          Go back
        </button>
      )}
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}"}</style>
    </div>
  );
}
