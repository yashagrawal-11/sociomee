/**
 * ThreadsDashboard.js — SocioMee Threads Analytics
 * Features: Analytics, Viral Predictor, Audience Insights, Best Time Heatmap,
 * Competitor Benchmark, Publisher — all in one.
 */

import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const BASE = "https://sociomeeai.com/api";

function getC() {
  const dark = true;
  return dark ? {
    rose:"#ff6eb5", purple:"#a78bfa", purpleXlt:"#150d2a",
    teal:"#22d3ee", ink:"#ede8ff", slate:"#c4b5fd",
    muted:"#8a8a94", hairline:"rgba(255,255,255,0.08)",
    glass:"rgba(255,255,255,0.03)", white:"#f5f5f7",
    success:"#34d399", warn:"#fbbf24", danger:"#f87171",
    threads:"#000", card:"rgba(30,18,55,0.9)",
  } : {
    rose:"#ff3d8f", purple:"#7c3aed", purpleXlt:"#f5f3ff",
    teal:"#0891b2", ink:"#0d0015", slate:"#3b1f4e",
    muted:"#8b6b9a", hairline:"rgba(124,58,237,0.12)",
    glass:"rgba(255,255,255,0.72)", white:"#fff",
    success:"#10b981", warn:"#f59e0b", danger:"#ef4444",
    threads:"#101010", card:"rgba(255,255,255,0.9)",
  };
}

let C = getC();

function fmt(n) {
  if (!n && n !== 0) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function Spinner() {
  return (
    <div style={{ display:"flex", justifyContent:"center", padding:"48px" }}>
      <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid rgba(255,255,255,0.06)", borderTopColor:"rgba(255,255,255,0.3)", animation:"spin 0.7s linear infinite" }} />
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

function ThreadsIcon({ size = 20, color = "#000" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 192 192" fill={color}>
      <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.452-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.206 17.11 97.015 16.94c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 10.015 15.86 12.853 26.162l16.147-4.308c-3.44-12.68-8.853-23.606-16.219-32.668C147.036 9.607 125.202.195 97.101 0h-.186C68.841.195 47.238 9.636 32.899 28.047 20.17 44.346 13.643 67.352 13.404 96v.004c.239 28.648 6.766 51.664 19.495 68.047C47.238 182.364 68.841 191.805 96.915 192h.186c24.692-.187 42.038-6.61 56.328-20.868 18.806-18.777 18.274-42.922 12.078-57.564-4.451-10.376-13.031-18.752-23.97-23.58zM97.45 128.07c-10.243.575-20.857-4.016-21.384-13.795-.397-7.42 5.27-15.693 22.904-16.705 2.003-.115 3.974-.17 5.913-.17 6.476 0 12.542.617 18.072 1.8-2.058 25.706-15.3 28.29-25.505 28.87z"/>
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────
function StatCard({ label, value, sub }) {
  C = getC();
  return (
    <div style={{ background:"rgba(255,255,255,0.02)", backdropFilter:"blur(16px)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"16px 18px", flex:1, minWidth:110, textAlign:"center" }}>
      <div style={{ fontSize:22, fontWeight:900, color:"#f5f5f7", letterSpacing:"-0.5px", lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:9.5, fontWeight:700, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"1.3px", marginTop:6 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:C.success, fontWeight:600, marginTop:2 }}>{sub}</div>}
    </div>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────
function Tab({ label, active, onClick }) {
  C = getC();
  return (
    <button onClick={onClick} style={{ padding:"8px 16px", borderRadius:99, border:`1.5px solid ${active ? "rgba(255,255,255,0.25)" : C.hairline}`, background:active ? "rgba(255,255,255,0.08)" : "transparent", color:active ? "#f5f5f7" : C.muted, fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", whiteSpace:"nowrap" }}>
      {label}
    </button>
  );
}


// ─── Section wrapper ─────────────────────────────────────────────────
function Section({ title, children }) {
  C = getC();
  return (
    <div style={{ background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:16, padding:18, marginBottom:16 }}>
      {title && <div style={{ fontSize:11, fontWeight:800, letterSpacing:"1.2px", textTransform:"uppercase", color:C.muted, marginBottom:14 }}>{title}</div>}
      {children}
    </div>
  );
}

// ─── Viral Score Ring ─────────────────────────────────────────────────
function ViralRing({ score }) {
  const col = score >= 70 ? C.success : score >= 50 ? C.warn : C.muted;
  const r = 36, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div style={{ position:"relative", width:90, height:90, flexShrink:0 }}>
      <svg width={90} height={90} style={{ transform:"rotate(-90deg)" }}>
        <circle cx={45} cy={45} r={r} fill="none" stroke={`${col}22`} strokeWidth={8} />
        <circle cx={45} cy={45} r={r} fill="none" stroke={col} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontSize:22, fontWeight:900, color:col, lineHeight:1 }}>{score}</div>
        <div style={{ fontSize:8, fontWeight:800, color:C.muted, textTransform:"uppercase" }}>Virality</div>
      </div>
    </div>
  );
}

// ─── Heatmap ──────────────────────────────────────────────────────────
function Heatmap({ data }) {
  C = getC();
  const days  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const hours = [0,3,6,9,12,15,18,21];

  const getScore = (day, hour) => {
    const entry = data.find(d => d.day === day && d.hour === hour);
    return entry ? entry.score : 0;
  };

  const scoreColor = (s) => {
    if (s >= 80) return C.purple;
    if (s >= 60) return C.teal;
    if (s >= 40) return C.warn;
    if (s >= 20) return `${C.muted}88`;
    return `${C.hairline}`;
  };

  return (
    <div style={{ overflowX:"auto" }}>
      <div style={{ display:"grid", gridTemplateColumns:`40px repeat(${hours.length}, 1fr)`, gap:3, minWidth:320 }}>
        <div />
        {hours.map(h => (
          <div key={h} style={{ fontSize:9, color:C.muted, textAlign:"center", fontWeight:600 }}>{h}h</div>
        ))}
        {days.map(day => (
          <>
            <div key={day} style={{ fontSize:10, color:C.muted, fontWeight:700, display:"flex", alignItems:"center" }}>{day}</div>
            {hours.map(hour => {
              const s = getScore(day, hour);
              return (
                <div key={hour} title={`${day} ${hour}:00 — Score: ${s}`} style={{ height:22, borderRadius:4, background:scoreColor(s), opacity:0.85, cursor:"default", transition:"all 0.15s" }} />
              );
            })}
          </>
        ))}
      </div>
      <div style={{ display:"flex", gap:8, marginTop:10, alignItems:"center", justifyContent:"flex-end" }}>
        <span style={{ fontSize:9, color:C.muted }}>Low</span>
        {[C.hairline, `${C.muted}88`, C.warn, C.teal, C.purple].map((c, i) => (
          <div key={i} style={{ width:14, height:14, borderRadius:3, background:c }} />
        ))}
        <span style={{ fontSize:9, color:C.muted }}>High</span>
      </div>
    </div>
  );
}

// ─── Publisher ────────────────────────────────────────────────────────
function Publisher({ userId, topic, onPublished }) {
  C = getC();
  const [text, setText]           = useState(topic ? topic.slice(0, 450) : "");
  const [loading, setLoad]        = useState(false);
  const [result, setResult]       = useState(null);
  const [err, setErr]             = useState("");
  const [imageUrl, setImageUrl]   = useState("");
  const [imgPreview, setPreview]  = useState("");
  const [imgLoading, setImgLoad]  = useState(false);
  const [replyCtrl, setReplyCtrl] = useState("everyone");
  const [replyOpen,  setReplyOpen ] = useState(false);
  const rem = 500 - text.length;

  const handleImage = async (file) => {
    if (!file) return;
    setImgLoad(true); setErr("");
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch(`${BASE}/threads/upload-media?user_id=${userId}`, { method:"POST", body:fd });
      const d = await r.json();
      if (d.url) { setImageUrl(d.url); setPreview(URL.createObjectURL(file)); }
      else setErr(d.detail || "Image upload failed.");
    } catch (e) { setErr(e.message || "Upload error."); }
    finally { setImgLoad(false); }
  };

  const publish = async () => {
    if (!text.trim()) { setErr("Write something first."); return; }
    setLoad(true); setErr(""); setResult(null);
    try {
      const r = await fetch(`${BASE}/threads/publish?user_id=${userId}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ text, image_url: imageUrl, reply_control: replyCtrl }),
      });
      const d = await r.json();
      if (d.success) { setResult(d); onPublished?.(); }
      else setErr(d.detail || "Failed to publish.");
    } catch (e) {
      setErr(e.message || "Network error.");
    } finally { setLoad(false); }
  };

  if (result) return (
    <div style={{ textAlign:"center", padding:"24px 0" }}>
      <p style={{ fontSize:14, fontWeight:700, color:C.success, marginBottom:8 }}>Posted to Threads!</p>
      {result.url && <a href={result.url} target="_blank" rel="noreferrer" style={{ fontSize:12, color:"rgba(255,255,255,0.5)", fontWeight:600 }}>View on Threads</a>}
      <br />
      <button onClick={() => { setResult(null); setText(""); setImageUrl(""); setPreview(""); }} style={{ marginTop:12, padding:"8px 20px", borderRadius:99, border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.06)", color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Post Another</button>
    </div>
  );

  return (
    <>
      <textarea value={text} onChange={e => setText(e.target.value.slice(0, 500))} placeholder="Write your Threads post... (max 500 chars)" rows={4}
        style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:C.ink, fontSize:13.5, lineHeight:1.7, fontFamily:"inherit", resize:"vertical", outline:"none", boxSizing:"border-box" }} />

      {/* Image preview */}
      {imgPreview && (
        <div style={{ position:"relative", marginTop:8, display:"inline-block" }}>
          <img src={imgPreview} alt="" style={{ maxHeight:160, maxWidth:"100%", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)" }} />
          <button onClick={() => { setImageUrl(""); setPreview(""); }} style={{ position:"absolute", top:4, right:4, width:22, height:22, borderRadius:"50%", border:"none", background:"rgba(0,0,0,0.7)", color:"#fff", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>x</button>
        </div>
      )}

      {/* Toolbar row */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:10 }}>
        <label style={{ width:32, height:32, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"center", cursor: imgLoading ? "not-allowed" : "pointer", flexShrink:0, transition:"all 0.15s" }} title="Attach image">
          <input type="file" accept="image/*" style={{ display:"none" }} disabled={imgLoading} onChange={e => handleImage(e.target.files[0])} />
          {imgLoading
            ? <div style={{ width:14, height:14, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.1)", borderTopColor:"rgba(255,255,255,0.5)", animation:"spin 0.7s linear infinite" }} />
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          }
        </label>
        <div style={{ position:"relative" }}>
          <button onClick={() => setReplyOpen(o => !o)} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:99, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:"rgba(255,255,255,0.45)", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
            {["everyone","accounts_you_follow","mentioned_only"].find(v=>v===replyCtrl)==="everyone"?"Anyone can reply":replyCtrl==="accounts_you_follow"?"Following only":"Mentioned only"}
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" style={{ transform:replyOpen?"rotate(180deg)":"none", transition:"transform 0.15s" }}><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {replyOpen && (
            <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, zIndex:99, background:"rgba(18,18,18,0.97)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, backdropFilter:"blur(20px)", padding:4, minWidth:160, boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>
              {[["everyone","Anyone can reply"],["accounts_you_follow","Following only"],["mentioned_only","Mentioned only"]].map(([val,label]) => (
                <button key={val} onClick={() => { setReplyCtrl(val); setReplyOpen(false); }} style={{ display:"block", width:"100%", textAlign:"left", padding:"8px 12px", borderRadius:8, border:"none", background:replyCtrl===val?"rgba(255,255,255,0.08)":"transparent", color:replyCtrl===val?"#f5f5f7":"rgba(255,255,255,0.5)", fontSize:11.5, fontWeight:replyCtrl===val?700:500, cursor:"pointer", fontFamily:"inherit", transition:"all 0.1s" }}>{label}</button>
              ))}
            </div>
          )}
        </div>
        <span style={{ fontSize:11, color: rem < 50 ? C.danger : "rgba(255,255,255,0.2)", fontWeight:600, marginLeft:"auto" }}>{rem}</span>
        <button onClick={publish} disabled={loading || !text.trim()} style={{ padding:"8px 20px", borderRadius:99, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.06)", color:"#f5f5f7", fontWeight:800, fontSize:12, cursor: loading || !text.trim() ? "not-allowed" : "pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:6, opacity: loading || !text.trim() ? 0.4 : 1, transition:"all 0.15s" }}>
          <ThreadsIcon size={13} color="#fff" />
          {loading ? "Posting..." : "Post to Threads"}
        </button>
      </div>
      {err && <p style={{ fontSize:12, color:C.danger, fontWeight:600, marginTop:8 }}>{err}</p>}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ════════════════════════════════════════════════════════════════════
export default function ThreadsDashboard({ user, topic = "" }) {
  C = getC();
  const userId = user?.user_id || localStorage.getItem("sociomee_user_id") || "";

  const [tab,        setTab       ] = useState("analytics");
  const [profile,    setProfile   ] = useState(null);
  const [insights,   setInsights  ] = useState(null);
  const [posts,      setPosts     ] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [audience,   setAudience  ] = useState(null);
  const [bestTime,   setBestTime  ] = useState(null);
  const [benchmark,  setBenchmark ] = useState(null);
  const [loading,    setLoading   ] = useState(true);
  const [connected,  setConnected ] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [days,       setDays      ] = useState(30);
  const [chartMetric,setChartMetric] = useState("views");
  const [predTopic,    setPredTopic   ] = useState(topic || "");
  const [predLoading,  setPredLoading ] = useState(false);
  const [predTrending, setPredTrending] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendLoaded,  setTrendLoaded  ] = useState(false);

  const load = useCallback(async () => {
    const _t0 = Date.now();
    if (!userId) { setTimeout(()=>setLoading(false), 600); return; }
    setLoading(true);
    try {
      const sr = await fetch(`${BASE}/threads/status?user_id=${userId}`);
      const st = await sr.json();
      if (!st.connected) { setConnected(false); setTimeout(()=>setLoading(false), Math.max(0, 600-(Date.now()-_t0))); return; }
      setConnected(true);
      setProfile(st);

      const [ir, pr, ar, btr, br] = await Promise.all([
        fetch(`${BASE}/threads/insights?user_id=${userId}&days=${days}`),
        fetch(`${BASE}/threads/posts?user_id=${userId}&limit=10`),
        fetch(`${BASE}/threads/audience?user_id=${userId}`),
        fetch(`${BASE}/threads/best-time?user_id=${userId}`),
        fetch(`${BASE}/threads/benchmark?user_id=${userId}`),
      ]);
      const [id, pd, ad, btd, bmd] = await Promise.all([ir.json(), pr.json(), ar.json(), btr.json(), br.json()]);
      setInsights(id);
      setPosts(pd.posts || []);
      setAudience(ad);
      setBestTime(btd);
      setBenchmark(bmd);

      if (topic) {
        const predr = await fetch(`${BASE}/threads/predict?user_id=${userId}&topic=${encodeURIComponent(topic)}`);
        setPrediction(await predr.json());
      }
    } catch (e) {
      console.error("ThreadsDashboard:", e);
    } finally {
      setLoading(false);
    }
  }, [userId, days, topic]);

  useEffect(() => { load(); }, [load]);

  const runPrediction = async () => {
    if (!predTopic.trim()) return;
    setPredLoading(true);
    try {
      const r = await fetch(`${BASE}/threads/predict?user_id=${userId}&topic=${encodeURIComponent(predTopic)}`);
      const d = await r.json();
      if (d.detail?.error === "no_credits") { alert("Not enough credits to analyze. Please top up."); return; }
      setPrediction(d);
      fetch(`${BASE}/credits/${userId}`).then(r=>r.json()).then(cr=>{ window.dispatchEvent(new CustomEvent("sociomee-credits-updated", { detail:{ plan:cr.plan||"free", plan_label:cr.plan_label||"Free", credits_remaining:cr.credits_remaining??cr.credits??0, credits:cr.credits_remaining??cr.credits??0, monthly_limit:cr.monthly_limit??180, next_reset:cr.next_reset||"" } })); }).catch(()=>{});
    } catch (e) {
      console.error(e);
    } finally { setPredLoading(false); }
  };

  const loadTrending = async () => {
    if (trendLoaded) return;
    setTrendLoading(true);
    try {
      const r = await fetch(`${BASE}/threads/trending-topics?user_id=${userId}`);
      const d = await r.json();
      if (d.trending) { setPredTrending(d.trending); setTrendLoaded(true); }
      fetch(`${BASE}/credits/${userId}`).then(r=>r.json()).then(cr=>{ window.dispatchEvent(new CustomEvent("sociomee-credits-updated", { detail:{ plan:cr.plan||"free", plan_label:cr.plan_label||"Free", credits_remaining:cr.credits_remaining??cr.credits??0, credits:cr.credits_remaining??cr.credits??0, monthly_limit:cr.monthly_limit??180, next_reset:cr.next_reset||"" } })); }).catch(()=>{});
    } catch (e) { console.error(e); }
    finally { setTrendLoading(false); }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const r = await fetch(`${BASE}/threads/auth-url?user_id=${userId}`);
      const d = await r.json();
      window.location.href = d.url;
    } catch (e) { setConnecting(false); }
  };

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"70vh", padding:"24px" }}>
      <div style={{ width:"100%", maxWidth:"420px", display:"flex", flexDirection:"column", gap:12 }}>
      <style>{`@keyframes skpulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
        <div style={{ width:52,height:52,borderRadius:"50%",background:"rgba(255,255,255,0.06)",animation:"skpulse 1.4s ease-in-out infinite",flexShrink:0 }}/>
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
          <div style={{ width:"40%",height:13,borderRadius:6,background:"rgba(255,255,255,0.06)",animation:"skpulse 1.4s ease-in-out infinite" }}/>
          <div style={{ width:"25%",height:10,borderRadius:6,background:"rgba(255,255,255,0.06)",animation:"skpulse 1.4s ease-in-out infinite" }}/>
        </div>
      </div>
      {[1,2,3].map(i=><div key={i} style={{ height:56,borderRadius:12,background:"rgba(255,255,255,0.06)",animation:"skpulse 1.4s ease-in-out infinite" }}/>)}
      <div style={{ height:120,borderRadius:12,background:"rgba(255,255,255,0.06)",animation:"skpulse 1.4s ease-in-out infinite" }}/>
      </div>
    </div>
  );

  // ── Not connected ──────────────────────────────────────────────────
  if (!connected) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"70vh", padding:"24px" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, textAlign:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"20px", padding:"40px 32px", maxWidth:"360px", width:"100%" }}>
        <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(255,255,255,0.06)", border:"2px solid rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <ThreadsIcon size={30} color="#fff" />
        </div>
        <h2 style={{ fontSize:18, fontWeight:900, color:C.ink, margin:0 }}>Connect Threads</h2>
        <p style={{ fontSize:12.5, color:C.muted, maxWidth:280, lineHeight:1.6, margin:0 }}>Get full analytics, viral predictions and audience insights.</p>
        <button onClick={handleConnect} disabled={connecting} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"12px 24px", borderRadius:"12px", border:"none", background:"rgba(255,255,255,0.08)", color:"#fff", fontWeight:"800", fontSize:"14px", cursor:connecting?"not-allowed":"pointer", fontFamily:"inherit", opacity:connecting?0.7:1 }}>
          <ThreadsIcon size={18} color="#fff" />
          {connecting ? "Redirecting…" : "Connect with Threads"}
        </button>
      </div>
    </div>
  );

  // ── Connected ──────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif" }}>

      {/* Profile header */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16, background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:16, padding:"14px 18px" }}>
        {profile?.profile_pic
          ? <img src={profile.profile_pic} alt="" referrerPolicy="no-referrer" style={{ width:48, height:48, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
          : <div style={{ width:48, height:48, borderRadius:"50%", background:"#000", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><ThreadsIcon size={24} color="#fff" /></div>
        }
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:800, color:C.ink }}>@{profile?.username}</div>
          <div style={{ fontSize:11.5, color:C.muted }}>{profile?.display_name} · {fmt(profile?.followers)} followers · {fmt(profile?.following)} following</div>
          {profile?.bio && <div style={{ fontSize:11, color:C.muted, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{profile.bio}</div>}
        </div>
        <div style={{ display:"flex", gap:6, flexShrink:0 }}>
          <a href={profile?.profile_url} target="_blank" rel="noreferrer" style={{ padding:"5px 12px", borderRadius:99, border:`1px solid ${C.hairline}`, color:C.slate, fontSize:11.5, fontWeight:700, textDecoration:"none" }}>View</a>
          <button onClick={() => { if (window.confirm("Disconnect Threads?")) fetch(`${BASE}/threads/disconnect?user_id=${userId}`, {method:"POST"}).then(() => { setConnected(false); setProfile(null); }); }} style={{ padding:"5px 12px", borderRadius:99, border:`1px solid ${C.danger}44`, background:`${C.danger}10`, color:C.danger, fontSize:11.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Disconnect</button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="threads-stat-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
        <StatCard label="Followers" value={fmt(profile?.followers)} />
        <StatCard label={`Views (${days}d)`} value={fmt(insights?.total_views)} />
        <StatCard label={`Likes (${days}d)`} value={fmt(insights?.total_likes)} />
        <StatCard label="Eng. Rate" value={`${insights?.engagement_rate ?? "—"}%`} />
      </div>

      {/* Tabs — horizontal scroll, no wrap, matches YouTube pill row */}
      <div style={{ display:"flex", gap:8, flexWrap:"nowrap", marginBottom:16, overflowX:"auto", WebkitOverflowScrolling:"touch", scrollbarWidth:"none", msOverflowStyle:"none", paddingBottom:2 }}>
        {[["analytics","Analytics"],["viral","Viral Predictor"],["audience","Audience"],["besttime","Best Time"],["benchmark","Benchmark"],["publish","Publish"],["schedule","Schedule"],["bulk","Bulk Schedule"]].map(([key, label]) => (
          <Tab key={key} label={label} active={tab === key} onClick={() => setTab(key)} />
        ))}
      </div>

      {/* ── Analytics Tab ── */}
      {tab === "analytics" && (
        <>
          <div style={{ background:"rgba(255,255,255,0.03)", backdropFilter:"blur(16px)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:20, marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:8 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:"1.2px", textTransform:"uppercase", color:C.muted }}>Thread Analytics</div>
                <div style={{ fontSize:26, fontWeight:900, color:"#fff", marginTop:4, lineHeight:1 }}>
                  {chartMetric==="views" ? fmt(insights?.total_views) : chartMetric==="likes" ? fmt(insights?.total_likes) : chartMetric==="replies" ? fmt(insights?.total_replies) : fmt(insights?.total_reposts)}
                </div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>Last {days} days</div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end" }}>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap", justifyContent:"flex-end" }}>
                  {[["views","Views",C.purple],["likes","Likes",C.rose],["replies","Replies",C.teal],["reposts","Reposts",C.warn]].map(([k,l,col]) => (
                    <button key={k} onClick={() => setChartMetric(k)} style={{ padding:"4px 10px", borderRadius:8, border:`1px solid ${chartMetric===k?col:C.hairline}`, background:chartMetric===k?`${col}18`:"transparent", color:chartMetric===k?col:C.muted, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
                  ))}
                </div>
                <div style={{ display:"flex", gap:5 }}>
                  {[7,30,90].map(d => (
                    <button key={d} onClick={() => setDays(d)} style={{ padding:"4px 10px", borderRadius:8, border:`1px solid ${days===d?C.purple:C.hairline}`, background:days===d?`${C.purple}18`:"transparent", color:days===d?C.purple:C.muted, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{d}d</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ height:200 }}>
              {insights?.chart_data?.length > 0
                ? <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={insights.chart_data} margin={{ top:4, right:4, left:-28, bottom:0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="date" hide={true} />
                      <YAxis tick={{ fill:"rgba(255,255,255,0.25)", fontSize:9 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                      <Tooltip contentStyle={{ background:"rgba(10,5,20,0.95)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, fontSize:11, boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }} labelStyle={{ color:"rgba(255,255,255,0.6)" }} formatter={v => [fmt(v), chartMetric]} />
                      <Line type="monotone" dataKey={chartMetric} stroke={chartMetric==="views"?C.purple:chartMetric==="likes"?C.rose:chartMetric==="replies"?C.teal:C.warn} strokeWidth={2.5} dot={false} activeDot={{ r:5, fill:chartMetric==="views"?C.purple:chartMetric==="likes"?C.rose:chartMetric==="replies"?C.teal:C.warn, stroke:"#fff", strokeWidth:2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                : <p style={{ textAlign:"center", color:C.muted, fontSize:13, paddingTop:60 }}>No data yet.</p>
              }
            </div>
            {insights?.is_mock && <p style={{ textAlign:"center", fontSize:10, color:C.muted, marginTop:8 }}>Demo data — real data loads after threads_manage_insights is approved</p>}
          </div>

          <Section title="Recent Threads">
            {posts.length === 0
              ? <p style={{ textAlign:"center", color:C.muted, fontSize:13, padding:20 }}>No posts found.</p>
              : posts.map((p, i) => (
                <div key={i} style={{ background:`${C.hairline}`, border:`1px solid ${C.hairline}`, borderRadius:12, padding:"12px 14px", marginBottom:8 }}>
                  <p style={{ fontSize:13, color:C.ink, lineHeight:1.6, marginBottom:8 }}>{p.text || "(No text)"}</p>
                  <div style={{ display:"flex", gap:16, fontSize:11.5, color:C.muted, fontWeight:600, flexWrap:"wrap" }}>
                    <span>❤️ {fmt(p.likes)}</span>
                    <span>💬 {fmt(p.replies)}</span>
                    <span>🔁 {fmt(p.reposts)}</span>
                    <span style={{ marginLeft:"auto" }}>{p.timestamp}</span>
                    {p.url && <a href={p.url} target="_blank" rel="noreferrer" style={{ color:C.purple, fontWeight:700, fontSize:11 }}>View →</a>}
                  </div>
                </div>
              ))
            }
          </Section>
        </>
      )}

      {/* ── Viral Predictor Tab ── */}
      {tab === "viral" && (
        <div>
          {/* Trending Topics */}
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:20, marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:800, letterSpacing:"1.3px", textTransform:"uppercase", color:C.muted }}>Trending on Threads</div>
              <button onClick={loadTrending} disabled={trendLoading} style={{ padding:"5px 14px", borderRadius:99, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.5)", fontSize:10, fontWeight:700, cursor:trendLoading?"not-allowed":"pointer", fontFamily:"inherit", opacity:trendLoading?0.5:1 }}>
                {trendLoading ? "Loading..." : trendLoaded ? "Refresh" : "Load Trends"}
              </button>
            </div>
            {!trendLoaded && !trendLoading && (
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.25)", textAlign:"center", padding:"16px 0" }}>Click Load Trends to see what is viral on Threads right now (2 credits)</div>
            )}
            {trendLoading && (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {[1,2,3].map(i => <div key={i} style={{ height:52, borderRadius:10, background:"rgba(255,255,255,0.04)", animation:"skpulse 1.4s ease-in-out infinite" }} />)}
              </div>
            )}
            {trendLoaded && predTrending.length > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {predTrending.map((t, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"10px 14px", cursor:"pointer" }}
                    onClick={() => setPredTopic(t.hook_ideas?.[0] || t.topic)}>
                    <div style={{ fontSize:13, fontWeight:800, color:"rgba(255,255,255,0.15)", width:18, textAlign:"center", flexShrink:0 }}>{i+1}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12.5, fontWeight:700, color:"#f5f5f7", marginBottom:2 }}>{t.topic}</div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontWeight:600 }}>{t.category} · {t.momentum}</div>
                    </div>
                    <div style={{ fontSize:9.5, fontWeight:700, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:"0.8px", flexShrink:0 }}>Use</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input card */}
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:20, marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:800, letterSpacing:"1.3px", textTransform:"uppercase", color:C.muted, marginBottom:14 }}>Analyze Post Idea</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginBottom:12, lineHeight:1.6 }}>
              Paste your post idea or topic. AI scores viral potential, rewrites your hook, and tells you the best time to post. (5 credits)
            </div>
            <textarea
              value={predTopic}
              onChange={e => setPredTopic(e.target.value.slice(0, 500))}
              placeholder="e.g. Hot take: most creators are faking their growth numbers..."
              rows={3}
              style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:`1.5px solid ${C.hairline}`, background:"rgba(255,255,255,0.03)", color:C.ink, fontSize:13, fontFamily:"inherit", resize:"vertical", outline:"none", boxSizing:"border-box", lineHeight:1.7 }}
              onKeyDown={e => e.key === "Enter" && e.metaKey && runPrediction()}
            />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.25)", fontWeight:600 }}>{500 - predTopic.length} chars left</span>
              <button onClick={runPrediction} disabled={predLoading || !predTopic.trim()} style={{ padding:"10px 28px", borderRadius:99, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.06)", color:"#f5f5f7", fontWeight:800, fontSize:12, cursor: predLoading || !predTopic.trim() ? "not-allowed" : "pointer", fontFamily:"inherit", opacity: predLoading || !predTopic.trim() ? 0.4 : 1, letterSpacing:"0.3px", transition:"all 0.15s" }}>
                {predLoading ? "Analyzing..." : "Predict Virality"}
              </button>
            </div>
          </div>

          {prediction && (
            <>
              {/* Score + recommendation */}
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:20, marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:"1.3px", textTransform:"uppercase", color:C.muted, marginBottom:16 }}>Virality Score</div>
                <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
                  <ViralRing score={prediction.virality_score} />
                  <div style={{ flex:1, minWidth:160 }}>
                    <div style={{ fontSize:13.5, fontWeight:700, color:"#f5f5f7", lineHeight:1.6, marginBottom:10 }}>{prediction.recommendation}</div>
                    {prediction.hook_detected?.length > 0 && (
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                        {prediction.hook_detected.map((h, i) => (
                          <span key={i} style={{ padding:"3px 10px", borderRadius:99, background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.6)", fontSize:10, fontWeight:700, border:"1px solid rgba(255,255,255,0.1)" }}>Hook detected: {h}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Estimated stats */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
                {[
                  { label:"Est. Views",   val:fmt(prediction.estimated_views) },
                  { label:"Est. Likes",   val:fmt(prediction.estimated_likes) },
                  { label:"Est. Replies", val:fmt(prediction.estimated_replies) },
                  { label:"Est. Follows", val:`+${fmt(prediction.estimated_follows)}` },
                ].map((s, i) => (
                  <div key={i} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"14px 10px", textAlign:"center" }}>
                    <div style={{ fontSize:20, fontWeight:900, color:"#f5f5f7", letterSpacing:"-0.5px", lineHeight:1 }}>{s.val}</div>
                    <div style={{ fontSize:9.5, fontWeight:700, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"1.3px", marginTop:6 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Score breakdown bars */}
              {prediction.breakdown && (
                <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:20, marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:800, letterSpacing:"1.3px", textTransform:"uppercase", color:C.muted, marginBottom:16 }}>Score Breakdown</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    {[
                      { label:"Hook Strength",      val:prediction.breakdown.hook_strength },
                      { label:"Audience Reach",     val:prediction.breakdown.audience_reach },
                      { label:"Content Format",     val:prediction.breakdown.content_format },
                      { label:"Timing Potential",   val:prediction.breakdown.timing_potential },
                    ].map(({ label, val }) => {
                      const col = val >= 70 ? C.success : val >= 50 ? C.warn : C.muted;
                      return (
                        <div key={label}>
                          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:700, marginBottom:5 }}>
                            <span>{label}</span><span style={{ color:col, fontWeight:800 }}>{val}</span>
                          </div>
                          <div style={{ height:5, background:"rgba(255,255,255,0.06)", borderRadius:99, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${val}%`, background:col, borderRadius:99, transition:"width 0.6s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Hook suggestions */}
              {prediction.hook_suggestions?.length > 0 && (
                <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:20, marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:800, letterSpacing:"1.3px", textTransform:"uppercase", color:C.muted, marginBottom:14 }}>Suggested Hooks</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {prediction.hook_suggestions.map((h, i) => (
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"10px 14px" }}>
                        <span style={{ fontSize:12.5, color:"#f5f5f7", fontWeight:600, lineHeight:1.5, flex:1 }}>{h}</span>
                        <div style={{ display:"flex", gap:6, marginLeft:10, flexShrink:0 }}>
                          <button onClick={() => navigator.clipboard.writeText(h)} style={{ padding:"4px 10px", borderRadius:7, border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.4)", fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Copy</button>
                          <button onClick={() => window.dispatchEvent(new CustomEvent("sociomee:generate", { detail:{ content:h, platform:"threads" } }))} style={{ padding:"4px 10px", borderRadius:7, border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.06)", color:"#f5f5f7", fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Generate</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Best time + tip */}
              <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:20, marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:"1.3px", textTransform:"uppercase", color:C.muted, marginBottom:14 }}>Post Strategy</div>
                {prediction.best_post_time && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:9.5, fontWeight:700, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"1.3px", marginBottom:8 }}>Best Time to Post</div>
                    <span style={{ display:"inline-block", padding:"6px 16px", borderRadius:99, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", color:"#f5f5f7", fontSize:12.5, fontWeight:700 }}>{prediction.best_post_time}</span>
                  </div>
                )}
                {prediction.tip && (
                  <div>
                    <div style={{ fontSize:9.5, fontWeight:700, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"1.3px", marginBottom:8 }}>AI Tip</div>
                    <div style={{ fontSize:12.5, color:"rgba(255,255,255,0.6)", lineHeight:1.7, background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"10px 14px", borderLeft:"2px solid rgba(255,255,255,0.15)" }}>{prediction.tip}</div>
                  </div>
                )}
                {prediction.next_milestone && (
                  <div style={{ marginTop:12, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"10px 14px", fontSize:12.5, color:"rgba(255,255,255,0.6)" }}>
                    At this pace you could hit <strong style={{ color:"#f5f5f7" }}>{fmt(prediction.next_milestone.target)} followers</strong> in {prediction.next_milestone.months} month{prediction.next_milestone.months !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Audience Tab ── */}
      {tab === "audience" && audience && (
        <>
          <Section title="Top Locations">
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {audience.top_locations.map((l, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:70, fontSize:12, color:C.ink, fontWeight:600 }}>{l.city}</div>
                  <div style={{ flex:1, background:C.hairline, borderRadius:99, height:8, overflow:"hidden" }}>
                    <div style={{ width:`${l.pct}%`, height:"100%", background:`linear-gradient(90deg,${C.purple},${C.teal})`, borderRadius:99 }} />
                  </div>
                  <div style={{ width:30, fontSize:11, color:C.muted, fontWeight:700, textAlign:"right" }}>{l.pct}%</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Age Groups">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={audience.age_groups} margin={{ top:5, right:10, left:-20, bottom:0 }}>
                <XAxis dataKey="group" tick={{ fontSize:11, fill:C.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:9, fill:C.muted }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:10, fontSize:12 }} formatter={v => [`${v}%`, "Share"]} />
                <Bar dataKey="pct" fill={C.purple} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Peak Activity Hours">
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {audience.peak_hours.map((h, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:50, fontSize:12, color:C.ink, fontWeight:600 }}>{h.hour}</div>
                  <div style={{ flex:1, background:C.hairline, borderRadius:99, height:8, overflow:"hidden" }}>
                    <div style={{ width:`${h.activity}%`, height:"100%", background:`linear-gradient(90deg,${C.teal},${C.purple})`, borderRadius:99 }} />
                  </div>
                  <div style={{ width:35, fontSize:11, color:C.muted, fontWeight:700, textAlign:"right" }}>{h.activity}%</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Gender Split">
            <div style={{ display:"flex", gap:12 }}>
              {[{label:"Male",val:audience.gender.male,col:C.purple},{label:"Female",val:audience.gender.female,col:C.rose}].map((g, i) => (
                <div key={i} style={{ flex:1, background:`${g.col}12`, border:`1px solid ${g.col}33`, borderRadius:12, padding:"14px", textAlign:"center" }}>
                  <div style={{ fontSize:22, fontWeight:900, color:g.col }}>{g.val}%</div>
                  <div style={{ fontSize:11, color:C.muted, fontWeight:700 }}>{g.label}</div>
                </div>
              ))}
            </div>
          </Section>

          {audience.is_mock && <p style={{ textAlign:"center", fontSize:10, color:C.muted }}>⚠ Estimated data — Meta will expose real audience data when API matures</p>}
        </>
      )}

      {/* ── Best Time Tab ── */}
      {tab === "besttime" && bestTime && (
        <>
          <Section title="Best Time to Post — Weekly Heatmap">
            <p style={{ fontSize:12, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
              Darker = more audience activity. Post during peak hours for maximum reach.
            </p>
            <Heatmap data={bestTime.heatmap} />
          </Section>

          <Section title="Top Time Slots (IST)">
            {bestTime.top_slots.map((s, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${C.hairline}` }}>
                <div>
                  <span style={{ fontSize:14, fontWeight:800, color:C.ink }}>#{i+1} {s.day}</span>
                  <span style={{ fontSize:12, color:C.muted, marginLeft:8 }}>{s.time}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:60, background:C.hairline, borderRadius:99, height:6, overflow:"hidden" }}>
                    <div style={{ width:`${s.score}%`, height:"100%", background:`linear-gradient(90deg,${C.purple},${C.teal})`, borderRadius:99 }} />
                  </div>
                  <span style={{ fontSize:12, fontWeight:800, color:C.purple }}>{s.score}</span>
                </div>
              </div>
            ))}
          </Section>
        </>
      )}

      {/* ── Benchmark Tab ── */}
      {tab === "benchmark" && benchmark && (
        <Section title="How You Compare">
          <div style={{ display:"flex", gap:10, marginBottom:16 }}>
            <div style={{ flex:1, background:`${C.purple}12`, border:`1px solid ${C.purple}33`, borderRadius:12, padding:14, textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:900, color:C.purple }}>{benchmark.your_tier}</div>
              <div style={{ fontSize:11, color:C.muted, fontWeight:700 }}>Your Tier</div>
            </div>
            <div style={{ flex:1, background:`${C.teal}12`, border:`1px solid ${C.teal}33`, borderRadius:12, padding:14, textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:900, color:C.teal }}>Top {100 - benchmark.your_percentile}%</div>
              <div style={{ fontSize:11, color:C.muted, fontWeight:700 }}>In Your Tier</div>
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { label:"Avg. Views/Post",    yours: fmt(Math.round(insights?.total_views / Math.max(posts.length, 1))), avg: fmt(benchmark.benchmark.avg_views_per_post) },
              { label:"Avg. Likes/Post",    yours: fmt(Math.round(insights?.total_likes / Math.max(posts.length, 1))), avg: fmt(benchmark.benchmark.avg_likes) },
              { label:"Avg. Replies/Post",  yours: fmt(Math.round(insights?.total_replies / Math.max(posts.length, 1))), avg: fmt(benchmark.benchmark.avg_replies) },
              { label:"Engagement Rate",    yours: `${insights?.engagement_rate ?? 0}%`, avg: `${benchmark.benchmark.avg_eng_rate}%` },
            ].map((row, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${C.hairline}` }}>
                <span style={{ fontSize:12, color:C.ink, fontWeight:600 }}>{row.label}</span>
                <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:C.purple }}>{row.yours}</div>
                    <div style={{ fontSize:9, color:C.muted }}>You</div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:C.muted }}>{row.avg}</div>
                    <div style={{ fontSize:9, color:C.muted }}>Avg</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:16, background:`${C.warn}12`, border:`1px solid ${C.warn}33`, borderRadius:10, padding:"12px 14px", fontSize:12.5, color:C.slate, lineHeight:1.6 }}>
            💡 <strong>{benchmark.your_tier} creators</strong> average {benchmark.benchmark.avg_eng_rate}% engagement. Focus on replies — they signal quality content to the algorithm.
          </div>
        </Section>
      )}

      {/* ── Publish Tab ── */}
      {tab === "publish" && (
        <Section title="️ Publish to Threads">
          <Publisher userId={userId} topic={topic} onPublished={() => setTimeout(load, 3000)} />
        </Section>
      )}

      {/* ── Bulk Schedule Tab ── */}
      
      {/* ── Schedule Tab ── */}
      {tab === "bulk" && (
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", backdropFilter:"blur(24px)", borderRadius:16, padding:28, textAlign:"center" }}>
          <div style={{ fontSize:16, fontWeight:800, color:"rgba(255,255,255,0.9)", marginBottom:8 }}>Bulk Schedule</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.7, marginBottom:20, maxWidth:400, margin:"0 auto 20px" }}>Schedule multiple Threads posts at once with AI-optimised timing. Exclusive to Pro+ members.</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", fontWeight:500 }}>Available soon for Pro+ members</div>
        </div>
      )}
      {tab === "schedule" && (
        <ThreadsScheduleTab userId={userId} />
      )}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes spin{to{transform:rotate(360deg)}}@media(max-width:767px){.threads-stat-grid{grid-template-columns:repeat(2,1fr) !important;gap:8px !important;}}`}</style>
    </div>
  );
}
function ThreadsScheduleTab({ userId }) {
  const C = getC();
  const BASE = "https://sociomeeai.com/api";
  const [text, setText] = useState("");
  const [when, setWhen] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [schedImg, setSchedImg]       = useState("");
  const [schedImgPrev, setSchedImgPrev] = useState("");
  const [schedImgLoad, setSchedImgLoad] = useState(false);
  const [schedReply, setSchedReply]   = useState("everyone");
  const [schedReplyOpen, setSchedReplyOpen] = useState(false);

  const loadJobs = () => {
    fetch(`${BASE}/threads/scheduled?user_id=${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.jobs) setJobs(d.jobs); })
      .catch(() => {});
  };

  useEffect(() => { loadJobs(); const iv = setInterval(loadJobs, 15000); return () => clearInterval(iv); }, [userId]);

  const schedule = () => {
    if (!text.trim() || !when) return;
    setLoading(true);
    const scheduled_at = when.toISOString();
    fetch(`${BASE}/threads/schedule`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, text, scheduled_at }),
    })
      .then(r => r.json())
      .then(d => {
        setLoading(false);
        if (d.ok) { setMsg("Scheduled!"); setText(""); setWhen(null); loadJobs(); setTimeout(() => setMsg(""), 3000); }
        else setMsg("Error: " + (d.detail || "unknown"));
      })
      .catch(() => { setLoading(false); setMsg("Network error"); });
  };

  const statusColor = (s) => s === "done" ? C.success : s === "error" ? C.rose : s === "sending" ? C.purple : C.muted;

  return (
    <Section title="Schedule a Thread">
      <div style={{ background: C.glass, border: `1.5px solid ${C.hairline}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Write your Threads post... (max 500 chars)" maxLength={500}
          style={{ width: "100%", minHeight: 100, padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C.hairline}`, background: "rgba(255,255,255,0.04)", color: C.ink, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 10 }} />
        <div style={{ marginBottom: 12, maxWidth: 320 }}>
          <ThreadsMiniCalendar value={when} onChange={setWhen} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <ThreadsTimePicker value={when} onChange={setWhen} />
        </div>
        {schedImgPrev && (
          <div style={{ position:"relative", marginBottom:10, display:"inline-block" }}>
            <img src={schedImgPrev} alt="" style={{ maxHeight:120, maxWidth:"100%", borderRadius:10, border:"1px solid rgba(255,255,255,0.1)" }} />
            <button onClick={() => { setSchedImg(""); setSchedImgPrev(""); }} style={{ position:"absolute", top:4, right:4, width:20, height:20, borderRadius:"50%", border:"none", background:"rgba(0,0,0,0.7)", color:"#fff", fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>x</button>
          </div>
        )}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <label style={{ width:32, height:32, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"center", cursor: schedImgLoad ? "not-allowed" : "pointer", flexShrink:0 }} title="Attach image">
            <input type="file" accept="image/*" style={{ display:"none" }} disabled={schedImgLoad} onChange={async e => { const f=e.target.files[0]; if(!f) return; setSchedImgLoad(true); const fd=new FormData(); fd.append("file",f); try { const r=await fetch(BASE+"/threads/upload-media?user_id="+userId,{method:"POST",body:fd}); const d=await r.json(); if(d.url){setSchedImg(d.url);setSchedImgPrev(URL.createObjectURL(f));} } catch(ex){} finally{setSchedImgLoad(false);} }} />
            {schedImgLoad ? <div style={{ width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.1)",borderTopColor:"rgba(255,255,255,0.5)",animation:"spin 0.7s linear infinite" }}/> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}
          </label>
          <div style={{ position:"relative" }}>
            <button onClick={() => setSchedReplyOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:99, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:"rgba(255,255,255,0.45)", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
              {schedReply==="everyone"?"Anyone can reply":schedReply==="accounts_you_follow"?"Following only":"Mentioned only"}
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" style={{ transform:schedReplyOpen?"rotate(180deg)":"none",transition:"transform 0.15s" }}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {schedReplyOpen && (
              <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, zIndex:99, background:"rgba(18,18,18,0.97)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, backdropFilter:"blur(20px)", padding:4, minWidth:160, boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>
                {[["everyone","Anyone can reply"],["accounts_you_follow","Following only"],["mentioned_only","Mentioned only"]].map(([val,label]) => (
                  <button key={val} onClick={() => { setSchedReply(val); setSchedReplyOpen(false); }} style={{ display:"block", width:"100%", textAlign:"left", padding:"8px 12px", borderRadius:8, border:"none", background:schedReply===val?"rgba(255,255,255,0.08)":"transparent", color:schedReply===val?"#f5f5f7":"rgba(255,255,255,0.5)", fontSize:11.5, fontWeight:schedReply===val?700:500, cursor:"pointer", fontFamily:"inherit" }}>{label}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        <button onClick={schedule} disabled={loading || !text.trim() || !when}
          style={{ width: "100%", padding: 12, borderRadius: 99, border: "none", background: (loading || !text.trim() || !when) ? "rgba(255,255,255,0.08)" : C.purple, color: "#fff", fontWeight: 800, fontSize: 13, cursor: (loading || !text.trim() || !when) ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
          {loading ? "Scheduling…" : "Schedule Post"}
        </button>
        {msg && <div style={{ marginTop: 8, fontSize: 12, color: msg.startsWith("Error") ? C.rose : C.success, fontWeight: 600 }}>{msg}</div>}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Scheduled Posts ({jobs.length})</div>
      {jobs.length === 0 ? (
        <div style={{ fontSize: 12, color: C.muted }}>No scheduled posts yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {jobs.map(j => (
            <div key={j.job_id} style={{ background: C.glass, border: `1.5px solid ${statusColor(j.status)}44`, borderRadius: 12, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: statusColor(j.status), textTransform: "uppercase" }}>{j.status}</span>
                <span style={{ fontSize: 10, color: C.muted }}>{j.scheduled_at ? new Date(j.scheduled_at).toLocaleString() : ""}</span>
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>{j.text?.slice(0, 150)}{j.text?.length > 150 ? "..." : ""}</div>
              {j.error && <div style={{ fontSize: 11, color: C.rose, marginTop: 4 }}>{j.error}</div>}
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function ThreadsMiniCalendar({ value, onChange }) {
  const C = getC();
  const today = new Date();
  const [viewDate, setViewDate] = useState(value || today);
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName  = viewDate.toLocaleString("default", { month: "long" });
  const isPast = (d) => {
    const cmp = new Date(year, month, d); cmp.setHours(23,59,59,999);
    return cmp < new Date();
  };
  const isSelected = (d) => value && value.getFullYear()===year && value.getMonth()===month && value.getDate()===d;
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return (
    <div style={{ background:C.glass, border:`1.5px solid ${C.hairline}`, borderRadius:14, padding:16 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))}
          style={{ background:"transparent", border:"none", color:C.ink, fontSize:16, cursor:"pointer", padding:"4px 10px" }}>‹</button>
        <span style={{ fontSize:13, fontWeight:700, color:C.ink }}>{monthName} {year}</span>
        <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))}
          style={{ background:"transparent", border:"none", color:C.ink, fontSize:16, cursor:"pointer", padding:"4px 10px" }}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:6 }}>
        {["S","M","T","W","T","F","S"].map((d,i) => (
          <div key={i} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:C.muted, padding:"4px 0" }}>{d}</div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
        {cells.map((d, i) => d === null ? <div key={i} /> : (
          <button key={i} type="button" disabled={isPast(d)}
            onClick={() => onChange(new Date(year, month, d, value?.getHours()??12, value?.getMinutes()??0))}
            style={{
              aspectRatio:"1", borderRadius:8, border:"none", fontSize:12, fontFamily:"inherit",
              cursor:isPast(d) ? "not-allowed" : "pointer",
              background:isSelected(d) ? C.purple : "transparent",
              color:isPast(d) ? C.muted : (isSelected(d) ? "#fff" : C.ink),
              fontWeight:isSelected(d) ? 700 : 500,
              opacity:isPast(d) ? 0.35 : 1,
            }}>{d}</button>
        ))}
      </div>
    </div>
  );
}

function ThreadsTimePicker({ value, onChange }) {
  const C = getC();
  const h24 = value ? value.getHours() : 12;
  const m   = value ? value.getMinutes() : 0;
  const h12 = ((h24 % 12) || 12);
  const ampm = h24 >= 12 ? "PM" : "AM";
  const setTime = (newH12, newM, newAmpm) => {
    let h = newH12 % 12;
    if (newAmpm === "PM") h += 12;
    const base = value || new Date();
    onChange(new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, newM));
  };
  const selStyle = { padding:"10px 12px", borderRadius:10, border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:13, fontFamily:"inherit", outline:"none" };
  return (
    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
      <select value={h12} onChange={e => setTime(Number(e.target.value), m, ampm)} style={selStyle}>
        {[...Array(12)].map((_,i) => <option key={i+1} value={i+1}>{i+1}</option>)}
      </select>
      <span style={{ color:C.muted }}>:</span>
      <select value={m} onChange={e => setTime(h12, Number(e.target.value), ampm)} style={selStyle}>
        {[0,15,30,45].map(mm => <option key={mm} value={mm}>{String(mm).padStart(2,"0")}</option>)}
      </select>
      <select value={ampm} onChange={e => setTime(h12, m, e.target.value)} style={selStyle}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
