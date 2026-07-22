import { useEffect, useState } from "react";
const BASE = "https://sociomeeai.com/api";

export default function YouTubeCallback() {
  const [status, setStatus] = useState("connecting");
  const [msg,    setMsg   ] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code  = params.get("code");
    const error = params.get("error");
    const uid   = sessionStorage.getItem("yt_connect_user_id") || "";
    if (error || !code) { setStatus("error"); setMsg(error || "No authorization code received."); return; }
    fetch(`${BASE}/youtube/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, user_id: uid, redirect_uri: window.location.origin + "/youtube/callback" }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStatus("success");
          const ch = data.channel_title || "";
          const subs = data.subscribers ? ` · ${Number(data.subscribers).toLocaleString()} subscribers` : "";
          setMsg(ch ? `Connected: ${ch}${subs}` : "");
          setTimeout(() => { window.location.href = "/app"; }, 1800);
        } else {
          setStatus("error");
          setMsg(data.detail || "Connection failed. Please try again.");
        }
      })
      .catch(e => { setStatus("error"); setMsg(e.message || "Network error."); });
  }, []);

  const cfg = {
    connecting: { color:"rgba(167,139,250,0.8)", label:"Connecting your YouTube channel" },
    success:    { color:"rgba(255,255,255,0.9)", label:"Connected. Redirecting" },
    error:      { color:"rgba(248,113,113,0.9)", label:"Connection failed" },
  }[status];

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px", background:"#0a0a0a", fontFamily:"'Poppins',sans-serif" }}>
      {status === "connecting" && (
        <div style={{ width:"32px", height:"32px", borderRadius:"50%", border:"2px solid rgba(124,58,237,0.15)", borderTopColor:"#7c3aed", animation:"spin 0.8s linear infinite" }}/>
      )}
      {status === "success" && (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      )}
      {status === "error" && (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      )}
      <p style={{ fontSize:"15px", fontWeight:"600", color:cfg.color, margin:0, letterSpacing:"0.01em" }}>{cfg.label}</p>
      {msg && <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.35)", maxWidth:"320px", textAlign:"center", margin:0, lineHeight:1.6 }}>{msg}</p>}
      {status === "error" && (
        <button onClick={() => window.location.href = "/app"} style={{ marginTop:"8px", padding:"10px 28px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.7)", fontWeight:"600", fontSize:"13px", cursor:"pointer", fontFamily:"inherit" }}>
          Go back
        </button>
      )}
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box;margin:0;padding:0}"}</style>
    </div>
  );
}
