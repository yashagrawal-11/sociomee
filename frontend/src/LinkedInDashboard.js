import React, { useState, useEffect } from "react";
const BASE = process.env.REACT_APP_API_URL || "https://sociomeeai.com/api";
const C = { ink:"#fff", muted:"rgba(255,255,255,0.45)" };

function LinkedInDashboard({ user }) {
  const userId = user?.id || localStorage.getItem("sociomee_user_id") || "";
  const [liStatus, setLiStatus] = useState("checking");
  const [profile, setProfile] = useState(null);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postMsg, setPostMsg] = useState("");
  const [history, setHistory] = useState([]);

  const HISTORY_KEY = "sociomee_li_post_history_" + userId;

  useEffect(() => {
    if (!userId) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "true") window.history.replaceState({}, "", window.location.pathname);
    fetch(BASE + "/linkedin/status?user_id=" + userId)
      .then(r => r.json())
      .then(d => { if (d.connected) { setProfile(d); setLiStatus("connected"); } else setLiStatus("disconnected"); })
      .catch(() => setLiStatus("disconnected"));
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      setHistory(saved);
    } catch { setHistory([]); }
  }, [userId]);

  const disconnect = () => {
    fetch(BASE + "/linkedin/disconnect", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ user_id:userId }) })
      .then(() => { setLiStatus("disconnected"); setProfile(null); });
  };

  const post = () => {
    if (!text.trim()) return;
    setPosting(true);
    fetch(BASE + "/linkedin/post", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ user_id:userId, text }) })
      .then(r => r.json())
      .then(d => {
        setPosting(false);
        if (d.success) {
          setPostMsg("Posted successfully!");
          const entry = { text, date: new Date().toISOString() };
          const updated = [entry, ...history].slice(0, 20);
          setHistory(updated);
          localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
          setText("");
          setTimeout(() => setPostMsg(""), 3000);
        } else setPostMsg("Error: " + (d.error || "unknown"));
      })
      .catch(() => { setPosting(false); setPostMsg("Network error"); });
  };

  if (liStatus === "checking") return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"70vh", padding:"24px" }}>
      <div style={{ width:"100%", maxWidth:"420px", display:"flex", flexDirection:"column", gap:12 }}>
        <style>{`@keyframes skpulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
          <div style={{ width:44,height:44,borderRadius:"50%",background:"rgba(10,102,194,0.1)",animation:"skpulse 1.4s ease-in-out infinite",flexShrink:0 }}/>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
            <div style={{ width:"40%",height:12,borderRadius:6,background:"rgba(255,255,255,0.06)",animation:"skpulse 1.4s ease-in-out infinite" }}/>
            <div style={{ width:"25%",height:10,borderRadius:6,background:"rgba(255,255,255,0.06)",animation:"skpulse 1.4s ease-in-out infinite" }}/>
          </div>
        </div>
        {[1,2,3].map(i=><div key={i} style={{ height:48,borderRadius:12,background:"rgba(255,255,255,0.06)",animation:"skpulse 1.4s ease-in-out infinite" }}/>)}
      </div>
    </div>
  );

  if (liStatus === "disconnected") return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"70vh", padding:"32px 24px" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"16px", textAlign:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"20px", padding:"40px 32px", maxWidth:"360px", width:"100%" }}>
        <div style={{ width:"64px", height:"64px", borderRadius:"50%", background:"rgba(10,102,194,0.12)", border:"2px solid rgba(10,102,194,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <img src="/icons/linkedin.png" style={{ width:28, height:28, objectFit:"contain" }} alt="linkedin"/>
        </div>
        <h3 style={{ fontSize:"16px", fontWeight:"900", color:C.ink, margin:0 }}>Connect LinkedIn</h3>
        <p style={{ fontSize:"12.5px", color:C.muted, lineHeight:1.6, maxWidth:"280px", margin:0 }}>Post to your LinkedIn personal feed directly from SocioMee.</p>
        <a href={BASE + "/linkedin/connect?user_id=" + userId} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"12px 24px", borderRadius:"12px", border:"none", background:"linear-gradient(135deg,#0a66c2,#0052a3)", color:"white", fontWeight:"800", fontSize:"14px", cursor:"pointer", fontFamily:"inherit", textDecoration:"none" }}>
          <img src="/icons/linkedin.png" style={{ width:16, height:16, objectFit:"contain", filter:"brightness(10)" }} alt=""/> Connect LinkedIn
        </a>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"DM Sans,sans-serif", paddingBottom:"20px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderRadius:"14px", background:"rgba(10,102,194,0.08)", border:"1px solid rgba(10,102,194,0.2)", marginBottom:16 }}>
        <div style={{ width:42, height:42, borderRadius:"50%", overflow:"hidden", flexShrink:0, background:"rgba(10,102,194,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {profile?.picture ? <img src={profile.picture} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt=""/> : <img src="/icons/linkedin.png" style={{ width:22, height:22, objectFit:"contain" }} alt="li"/>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:"14px", fontWeight:"700", color:C.ink }}>{profile?.name || "Connected"}</div>
          <div style={{ fontSize:"11px", color:C.muted }}>{profile?.email || ""}</div>
        </div>
        <button onClick={disconnect} style={{ padding:"6px 12px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.15)", background:"transparent", color:C.muted, fontSize:"11px", fontWeight:"600", cursor:"pointer", fontFamily:"inherit" }}>Disconnect</button>
      </div>

      <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"14px", padding:"16px", display:"flex", flexDirection:"column", gap:12, marginBottom:16 }}>
        <div style={{ fontSize:"13px", fontWeight:"700", color:C.ink }}>Post to LinkedIn</div>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="What do you want to share?" rows={6}
          style={{ width:"100%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", padding:"12px", color:C.ink, fontSize:"13px", fontFamily:"inherit", resize:"vertical", outline:"none", boxSizing:"border-box" }}/>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:"12px", color: text.length > 2900 ? "#f87171" : C.muted }}>{text.length}/3000</span>
          <button onClick={post} disabled={posting || !text.trim()}
            style={{ padding:"10px 24px", borderRadius:"10px", border:"none", background: posting || !text.trim() ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#0a66c2,#0052a3)", color: posting || !text.trim() ? "rgba(255,255,255,0.3)" : "#fff", fontWeight:"800", fontSize:"13px", cursor: posting || !text.trim() ? "not-allowed" : "pointer", fontFamily:"inherit" }}>
            {posting ? "Posting..." : "Post to LinkedIn"}
          </button>
        </div>
        {postMsg && <div style={{ fontSize:"12px", color: postMsg.startsWith("Error") ? "#f87171" : "#4ade80", fontWeight:"600" }}>{postMsg}</div>}
      </div>

      <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", padding:"16px" }}>
        <div style={{ fontSize:"11px", fontWeight:"700", color:C.muted, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"12px" }}>Recent Posts ({history.length})</div>
        {history.length === 0 ? (
          <div style={{ fontSize:"12px", color:C.muted, padding:"8px 0" }}>Posts you send from here will show up in this history.</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {history.map((h, i) => (
              <div key={i} style={{ padding:"10px 12px", borderRadius:"10px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.75)", lineHeight:1.5, whiteSpace:"pre-line" }}>{h.text.length > 200 ? h.text.slice(0,200) + "..." : h.text}</div>
                <div style={{ fontSize:"10px", color:C.muted, marginTop:"6px" }}>{new Date(h.date).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LinkedInDashboard;
