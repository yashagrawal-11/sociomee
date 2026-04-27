/**
 * PinterestDashboard.js — SocioMee Pinterest Analytics
 * 7 tabs: Analytics, Top Pins, Boards, Viral Predictor, Audience, Best Time, Benchmark + Publish
 * Same pattern as ThreadsDashboard.js and InstagramDashboard.js
 */

import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

const BASE = "https://sociomee.in/api";
const PINTEREST_RED = "#e60023";

function getC() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  return dark ? {
    red:"#ff4060", redLight:"#ff6080", purple:"#a78bfa",
    orange:"#fb923c", teal:"#22d3ee", ink:"#ede8ff", slate:"#c4b5fd",
    muted:"#9d86c8", hairline:"rgba(230,0,35,0.15)",
    glass:"rgba(22,14,42,0.82)", white:"#ede8ff",
    success:"#34d399", warn:"#fbbf24", danger:"#f87171",
    card:"rgba(30,18,55,0.9)",
  } : {
    red:"#e60023", redLight:"#ff4060", purple:"#7c3aed",
    orange:"#f97316", teal:"#0891b2", ink:"#0d0015", slate:"#3b1f4e",
    muted:"#8b6b9a", hairline:"rgba(230,0,35,0.12)",
    glass:"rgba(255,255,255,0.72)", white:"#fff",
    success:"#10b981", warn:"#f59e0b", danger:"#ef4444",
    card:"rgba(255,255,255,0.9)",
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
      <div style={{ width:36, height:36, borderRadius:"50%", border:`3px solid ${C.red}22`, borderTopColor:C.red, animation:"spin 0.7s linear infinite" }} />
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

function PinterestIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={PINTEREST_RED}>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
    </svg>
  );
}

function StatCard({ icon, label, value, color, sub }) {
  C = getC();
  return (
    <div style={{ background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:16, padding:"16px 18px", flex:1, minWidth:100, textAlign:"center" }}>
      <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
      <div style={{ fontSize:21, fontWeight:900, color: color || C.red, letterSpacing:"-0.5px", lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.8px", marginTop:4 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:C.success, fontWeight:600, marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function Tab({ label, active, onClick }) {
  C = getC();
  return (
    <button onClick={onClick} style={{ padding:"7px 14px", borderRadius:99, border:`1.5px solid ${active ? C.red : C.hairline}`, background:active ? `${C.red}18` : "transparent", color:active ? C.red : C.muted, fontWeight:700, fontSize:11.5, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", whiteSpace:"nowrap" }}>
      {label}
    </button>
  );
}

function Section({ title, children }) {
  C = getC();
  return (
    <div style={{ background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:16, padding:18, marginBottom:16 }}>
      {title && <div style={{ fontSize:11, fontWeight:800, letterSpacing:"1.2px", textTransform:"uppercase", color:C.muted, marginBottom:14 }}>{title}</div>}
      {children}
    </div>
  );
}

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

function Heatmap({ data }) {
  C = getC();
  const days  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const hours = [0,3,6,9,12,15,18,21];
  const getScore = (day, hour) => (data.find(d => d.day === day && d.hour === hour) || {}).score || 0;
  const scoreColor = s => s >= 80 ? C.red : s >= 60 ? C.orange : s >= 40 ? C.warn : s >= 20 ? `${C.muted}88` : C.hairline;
  return (
    <div style={{ overflowX:"auto" }}>
      <div style={{ display:"grid", gridTemplateColumns:`40px repeat(${hours.length}, 1fr)`, gap:3, minWidth:320 }}>
        <div />
        {hours.map(h => <div key={h} style={{ fontSize:9, color:C.muted, textAlign:"center", fontWeight:600 }}>{h}h</div>)}
        {days.map(day => (
          <>
            <div key={day} style={{ fontSize:10, color:C.muted, fontWeight:700, display:"flex", alignItems:"center" }}>{day}</div>
            {hours.map(hour => {
              const s = getScore(day, hour);
              return <div key={hour} title={`${day} ${hour}:00 — Score: ${s}`} style={{ height:22, borderRadius:4, background:scoreColor(s), opacity:0.85 }} />;
            })}
          </>
        ))}
      </div>
      <div style={{ display:"flex", gap:8, marginTop:10, alignItems:"center", justifyContent:"flex-end" }}>
        <span style={{ fontSize:9, color:C.muted }}>Low</span>
        {[C.hairline, `${C.muted}88`, C.warn, C.orange, C.red].map((col, i) => (
          <div key={i} style={{ width:14, height:14, borderRadius:3, background:col }} />
        ))}
        <span style={{ fontSize:9, color:C.muted }}>High</span>
      </div>
    </div>
  );
}

function Publisher({ userId, boards, onPublished }) {
  C = getC();
  const [title,    setTitle   ] = useState("");
  const [desc,     setDesc    ] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [link,     setLink    ] = useState("https://sociomee.in");
  const [boardId,  setBoardId ] = useState(boards[0]?.id || "");
  const [loading,  setLoad    ] = useState(false);
  const [result,   setResult  ] = useState(null);
  const [err,      setErr     ] = useState("");

  const publish = async () => {
    if (!title.trim())    { setErr("Title is required."); return; }
    if (!imageUrl.trim()) { setErr("Image URL is required."); return; }
    if (!boardId)         { setErr("Select a board."); return; }
    setLoad(true); setErr(""); setResult(null);
    try {
      const r = await fetch(`${BASE}/pinterest/publish?user_id=${userId}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ title, description: desc, image_url: imageUrl, board_id: boardId, link }),
      });
      const d = await r.json();
      if (d.success) { setResult(d); onPublished?.(); }
      else setErr(d.detail || "Failed to publish.");
    } catch(e) { setErr(e.message || "Network error."); }
    finally { setLoad(false); }
  };

  if (result) return (
    <div style={{ textAlign:"center", padding:"24px 0" }}>
      <div style={{ fontSize:40, marginBottom:8 }}>📌</div>
      <p style={{ fontSize:14, fontWeight:700, color:C.success, marginBottom:8 }}>Pin published!</p>
      {result.url && <a href={result.url} target="_blank" rel="noreferrer" style={{ fontSize:12, color:C.red, fontWeight:600 }}>View on Pinterest →</a>}
      <br />
      <button onClick={() => { setResult(null); setTitle(""); setDesc(""); setImageUrl(""); }} style={{ marginTop:12, padding:"8px 20px", borderRadius:99, border:"none", background:C.red, color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Create Another</button>
    </div>
  );

  return (
    <>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:C.muted, display:"block", marginBottom:5 }}>PIN TITLE *</label>
          <input value={title} onChange={e => setTitle(e.target.value.slice(0, 100))} placeholder="10 Content Ideas for Creators..."
            style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
        </div>
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:C.muted, display:"block", marginBottom:5 }}>BOARD *</label>
          <select value={boardId} onChange={e => setBoardId(e.target.value)}
            style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}>
            {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            {boards.length === 0 && <option value="">No boards found</option>}
          </select>
        </div>
      </div>

      <div style={{ marginBottom:10 }}>
        <label style={{ fontSize:11, fontWeight:700, color:C.muted, display:"block", marginBottom:5 }}>IMAGE URL *</label>
        <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://your-image.jpg (vertical 2:3 ratio recommended)"
          style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
      </div>

      <div style={{ marginBottom:10 }}>
        <label style={{ fontSize:11, fontWeight:700, color:C.muted, display:"block", marginBottom:5 }}>DESCRIPTION</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value.slice(0, 500))} placeholder="Add keywords for Pinterest SEO..." rows={3}
          style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:13, fontFamily:"inherit", outline:"none", resize:"vertical", boxSizing:"border-box" }} />
      </div>

      <div style={{ marginBottom:14 }}>
        <label style={{ fontSize:11, fontWeight:700, color:C.muted, display:"block", marginBottom:5 }}>DESTINATION LINK</label>
        <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://your-website.com"
          style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
      </div>

      <button onClick={publish} disabled={loading} style={{ width:"100%", padding:"12px", borderRadius:99, border:"none", background:C.red, color:"#fff", fontWeight:800, fontSize:14, cursor:loading ? "not-allowed" : "pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity:loading ? 0.7 : 1 }}>
        <PinterestIcon size={16} />
        {loading ? "Publishing…" : "Publish Pin"}
      </button>
      {err && <p style={{ fontSize:12, color:C.danger, fontWeight:600, marginTop:8 }}>⚠ {err}</p>}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ════════════════════════════════════════════════════════════════════
export default function PinterestDashboard({ user, topic = "" }) {
  C = getC();
  const userId = user?.user_id || localStorage.getItem("sociomee_user_id") || "";

  const [tab,         setTab        ] = useState("analytics");
  const [profile,     setProfile    ] = useState(null);
  const [insights,    setInsights   ] = useState(null);
  const [pins,        setPins       ] = useState([]);
  const [boards,      setBoards     ] = useState([]);
  const [prediction,  setPrediction ] = useState(null);
  const [audience,    setAudience   ] = useState(null);
  const [bestTime,    setBestTime   ] = useState(null);
  const [benchmark,   setBenchmark  ] = useState(null);
  const [loading,     setLoading    ] = useState(true);
  const [connected,   setConnected  ] = useState(false);
  const [connecting,  setConnecting ] = useState(false);
  const [days,        setDays       ] = useState(30);
  const [chartMetric, setChartMetric] = useState("impressions");
  const [predTopic,   setPredTopic  ] = useState(topic || "");
  const [predFormat,  setPredFormat ] = useState("static");
  const [predLoading, setPredLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const sr = await fetch(`${BASE}/pinterest/status?user_id=${userId}`);
      const st = await sr.json();
      if (!st.connected) { setConnected(false); setLoading(false); return; }
      setConnected(true);
      setProfile(st);

      const [ir, pr, br, ar, btr, bmr] = await Promise.all([
        fetch(`${BASE}/pinterest/insights?user_id=${userId}&days=${days}`),
        fetch(`${BASE}/pinterest/pins?user_id=${userId}&limit=12`),
        fetch(`${BASE}/pinterest/boards?user_id=${userId}`),
        fetch(`${BASE}/pinterest/audience?user_id=${userId}`),
        fetch(`${BASE}/pinterest/best-time?user_id=${userId}`),
        fetch(`${BASE}/pinterest/benchmark?user_id=${userId}`),
      ]);
      const [id, pd, bd, ad, btd, bmd] = await Promise.all([
        ir.json(), pr.json(), br.json(), ar.json(), btr.json(), bmr.json(),
      ]);
      setInsights(id);
      setPins(pd.pins || []);
      setBoards(bd.boards || []);
      setAudience(ad);
      setBestTime(btd);
      setBenchmark(bmd);

      if (topic) {
        const predr = await fetch(`${BASE}/pinterest/predict?user_id=${userId}&topic=${encodeURIComponent(topic)}&pin_format=static`);
        setPrediction(await predr.json());
      }
    } catch(e) {
      console.error("PinterestDashboard:", e);
    } finally {
      setLoading(false);
    }
  }, [userId, days, topic]);

  useEffect(() => { load(); }, [load]);

  const runPrediction = async () => {
    if (!predTopic.trim()) return;
    setPredLoading(true);
    try {
      const r = await fetch(`${BASE}/pinterest/predict?user_id=${userId}&topic=${encodeURIComponent(predTopic)}&pin_format=${predFormat}`);
      setPrediction(await r.json());
    } catch(e) { console.error(e); }
    finally { setPredLoading(false); }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const r = await fetch(`${BASE}/pinterest/auth-url?user_id=${userId}`);
      const d = await r.json();
      window.location.href = d.url;
    } catch { setConnecting(false); }
  };

  if (loading) return <Spinner />;

  // ── Not connected ──────────────────────────────────────────────────
  if (!connected) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"52px 24px", gap:16, textAlign:"center" }}>
      <div style={{ width:72, height:72, borderRadius:20, background:PINTEREST_RED, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 12px 32px rgba(230,0,35,0.3)" }}>
        <svg width={40} height={40} viewBox="0 0 24 24" fill="#fff">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
        </svg>
      </div>
      <h2 style={{ fontSize:20, fontWeight:900, color:C.ink }}>Connect Pinterest</h2>
      <p style={{ fontSize:13, color:C.muted, maxWidth:320, lineHeight:1.7 }}>
        Track your pins, boards, viral predictions, audience insights and best time to post.
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, maxWidth:340, width:"100%", textAlign:"left" }}>
        {["📌 Pin & board analytics", "🔥 Viral pin predictor", "👥 Audience demographics", "🕐 Best time to post", "📈 Creator benchmarking", "✍️ Publish pins directly"].map((f, i) => (
          <div key={i} style={{ fontSize:12, color:C.slate, background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:10, padding:"8px 12px" }}>{f}</div>
        ))}
      </div>
      <button onClick={handleConnect} disabled={connecting} style={{ padding:"13px 36px", borderRadius:99, border:"none", background:PINTEREST_RED, color:"#fff", fontWeight:800, fontSize:14, cursor: connecting ? "not-allowed" : "pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:10, boxShadow:"0 8px 24px rgba(230,0,35,0.3)", opacity: connecting ? 0.7 : 1 }}>
        <PinterestIcon size={18} />
        {connecting ? "Redirecting…" : "Connect with Pinterest"}
      </button>
    </div>
  );

  // ── Connected ──────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif" }}>

      {/* Profile header */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16, background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:16, padding:"14px 18px" }}>
        {profile?.profile_pic
          ? <img src={profile.profile_pic} alt="" referrerPolicy="no-referrer" style={{ width:48, height:48, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
          : <div style={{ width:48, height:48, borderRadius:"50%", background:PINTEREST_RED, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><PinterestIcon size={24} /></div>
        }
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:800, color:C.ink }}>{profile?.display_name || profile?.username}</div>
          <div style={{ fontSize:11.5, color:C.muted }}>@{profile?.username} · {fmt(profile?.followers)} followers · {fmt(profile?.pin_count)} pins · {fmt(profile?.board_count)} boards</div>
        </div>
        <div style={{ display:"flex", gap:6, flexShrink:0 }}>
          {profile?.profile_url && <a href={profile.profile_url} target="_blank" rel="noreferrer" style={{ padding:"5px 12px", borderRadius:99, border:`1px solid ${C.hairline}`, color:C.slate, fontSize:11.5, fontWeight:700, textDecoration:"none" }}>View</a>}
          <button onClick={() => { if (window.confirm("Disconnect Pinterest?")) fetch(`${BASE}/pinterest/disconnect?user_id=${userId}`, {method:"POST"}).then(() => { setConnected(false); setProfile(null); }); }} style={{ padding:"5px 12px", borderRadius:99, border:`1px solid ${C.danger}44`, background:`${C.danger}10`, color:C.danger, fontSize:11.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Disconnect</button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
        <StatCard icon="📌" label="Pins"          value={fmt(profile?.pin_count)}              color={C.red} />
        <StatCard icon="👁️" label={`Impr. (${days}d)`} value={fmt(insights?.total_impressions)} color={C.purple} />
        <StatCard icon="💾" label="Saves"          value={fmt(insights?.total_saves)}           color={C.orange} />
        <StatCard icon="🖱️" label="Clicks"         value={fmt(insights?.total_pin_clicks)}      color={C.teal} />
        <StatCard icon="💬" label="Eng. Rate"      value={`${insights?.engagement_rate ?? "—"}%`} color={C.success} />
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:16, overflowX:"auto" }}>
        {[
          ["analytics","📊 Analytics"],
          ["pins","📌 Top Pins"],
          ["boards","🗂️ Boards"],
          ["viral","🔥 Viral AI"],
          ["audience","👥 Audience"],
          ["besttime","🕐 Best Time"],
          ["benchmark","📈 Benchmark"],
          ["publish","✍️ Publish"],
        ].map(([key, label]) => (
          <Tab key={key} label={label} active={tab === key} onClick={() => setTab(key)} />
        ))}
      </div>

      {/* ── Analytics Tab ── */}
      {tab === "analytics" && (
        <Section title="📈 Performance Over Time">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:6 }}>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {[["impressions","Impressions",C.red],["saves","Saves",C.orange],["pin_clicks","Clicks",C.purple]].map(([k,l,col]) => (
                <button key={k} onClick={() => setChartMetric(k)} style={{ padding:"3px 10px", borderRadius:99, border:`1.5px solid ${chartMetric===k?col:C.hairline}`, background:chartMetric===k?`${col}18`:"transparent", color:chartMetric===k?col:C.muted, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
              ))}
            </div>
            <div style={{ display:"flex", gap:5 }}>
              {[7,30,90].map(d => (
                <button key={d} onClick={() => setDays(d)} style={{ padding:"3px 9px", borderRadius:99, border:`1.5px solid ${days===d?C.teal:C.hairline}`, background:days===d?`${C.teal}18`:"transparent", color:days===d?C.teal:C.muted, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{d}d</button>
              ))}
            </div>
          </div>
          {insights?.chart_data?.length > 0
            ? <ResponsiveContainer width="100%" height={180}>
                <LineChart data={insights.chart_data} margin={{ top:5, right:10, left:-20, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.hairline} />
                  <XAxis dataKey="date" tick={{ fontSize:9, fill:C.muted }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize:9, fill:C.muted }} tickLine={false} axisLine={false} tickFormatter={fmt} />
                  <Tooltip contentStyle={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:10, fontSize:12 }} formatter={v => [fmt(v), chartMetric]} />
                  <Line type="monotone" dataKey={chartMetric} stroke={chartMetric==="impressions"?C.red:chartMetric==="saves"?C.orange:C.purple} strokeWidth={2.5} dot={false} activeDot={{ r:5, strokeWidth:0 }} />
                </LineChart>
              </ResponsiveContainer>
            : <p style={{ textAlign:"center", color:C.muted, fontSize:13, padding:"40px 0" }}>No data yet.</p>
          }
          {insights?.is_mock && <p style={{ textAlign:"center", fontSize:10, color:C.muted, marginTop:6 }}>⚠ Demo data — real analytics load after Pinterest approves your app</p>}
        </Section>
      )}

      {/* ── Top Pins Tab ── */}
      {tab === "pins" && (
        <Section title="📌 Your Pins">
          {pins.length === 0
            ? <p style={{ textAlign:"center", color:C.muted, fontSize:13, padding:20 }}>No pins found.</p>
            : pins.map((p, i) => (
              <div key={i} style={{ background:`${C.hairline}`, border:`1px solid ${C.hairline}`, borderRadius:12, padding:"12px 14px", marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:6 }}>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:13, fontWeight:700, color:C.ink, marginBottom:3 }}>{p.title || "(No title)"}</p>
                    <p style={{ fontSize:11.5, color:C.muted }}>{p.description}</p>
                  </div>
                  <span style={{ fontSize:10, fontWeight:700, color:C.red, background:`${C.red}12`, padding:"2px 8px", borderRadius:99, flexShrink:0 }}>{p.board}</span>
                </div>
                <div style={{ display:"flex", gap:14, fontSize:11.5, color:C.muted, fontWeight:600 }}>
                  <span>💾 {fmt(p.saves)}</span>
                  <span>🖱️ {fmt(p.clicks)}</span>
                  <span style={{ marginLeft:"auto" }}>{p.created_at}</span>
                  {p.link && <a href={p.link} target="_blank" rel="noreferrer" style={{ color:C.red, fontWeight:700, fontSize:11 }}>View →</a>}
                </div>
              </div>
            ))
          }
        </Section>
      )}

      {/* ── Boards Tab ── */}
      {tab === "boards" && (
        <Section title="🗂️ Your Boards">
          {boards.length === 0
            ? <p style={{ textAlign:"center", color:C.muted, fontSize:13, padding:20 }}>No boards found.</p>
            : boards.map((b, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:`1px solid ${C.hairline}` }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.ink }}>{b.name}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{b.pin_count} pins · {fmt(b.follower_count)} followers</div>
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ fontSize:10, fontWeight:700, color: b.privacy === "PUBLIC" ? C.success : C.muted, background: b.privacy === "PUBLIC" ? `${C.success}18` : `${C.muted}18`, padding:"2px 8px", borderRadius:99 }}>{b.privacy}</span>
                </div>
              </div>
            ))
          }
        </Section>
      )}

      {/* ── Viral AI Tab ── */}
      {tab === "viral" && (
        <Section title="🔥 Viral Pin AI Predictor">
          <p style={{ fontSize:12.5, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
            Enter your pin idea and choose format — our AI predicts saves, clicks and viral score before you post.
          </p>

          <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
            {[["static","📷 Static"],["video","🎬 Video"],["idea","💡 Idea Pin"],["carousel","🖼️ Carousel"]].map(([key,label]) => (
              <button key={key} onClick={() => setPredFormat(key)} style={{ padding:"6px 14px", borderRadius:99, border:`1.5px solid ${predFormat===key?C.red:C.hairline}`, background:predFormat===key?`${C.red}18`:"transparent", color:predFormat===key?C.red:C.muted, fontSize:11.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{label}</button>
            ))}
          </div>

          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            <input value={predTopic} onChange={e => setPredTopic(e.target.value)} placeholder="e.g. 10 free Canva templates for creators..." style={{ flex:1, padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:13, fontFamily:"inherit", outline:"none" }} onKeyDown={e => e.key === "Enter" && runPrediction()} />
            <button onClick={runPrediction} disabled={predLoading || !predTopic.trim()} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:C.red, color:"#fff", fontWeight:800, fontSize:12.5, cursor: predLoading ? "not-allowed" : "pointer", fontFamily:"inherit", opacity: predLoading ? 0.7 : 1 }}>
              {predLoading ? "…" : "Predict"}
            </button>
          </div>

          {prediction && (
            <>
              {prediction.format_tip && (
                <div style={{ background:`${C.orange}12`, border:`1px solid ${C.orange}33`, borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:12.5, color:C.slate }}>
                  📋 <strong>{prediction.pin_format}:</strong> {prediction.format_tip}
                </div>
              )}

              <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
                <ViralRing score={prediction.virality_score} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.ink, marginBottom:8 }}>{prediction.recommendation}</div>
                  {prediction.hook_detected?.length > 0 && (
                    <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                      {prediction.hook_detected.map((h, i) => (
                        <span key={i} style={{ padding:"2px 8px", borderRadius:99, background:`${C.success}18`, color:C.success, fontSize:10, fontWeight:700, border:`1px solid ${C.success}33` }}>✓ "{h}"</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:16 }}>
                {[
                  { icon:"👁️", label:"Est. Impressions", val:fmt(prediction.estimated_impressions) },
                  { icon:"💾", label:"Est. Saves",        val:fmt(prediction.estimated_saves) },
                  { icon:"🖱️", label:"Est. Clicks",       val:fmt(prediction.estimated_clicks) },
                  { icon:"👥", label:"Est. Follows",      val:`+${fmt(prediction.estimated_follows)}` },
                ].map((s, i) => (
                  <div key={i} style={{ background:`${C.red}0D`, border:`1px solid ${C.hairline}`, borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
                    <div style={{ fontSize:18 }}>{s.icon}</div>
                    <div style={{ fontSize:14, fontWeight:900, color:C.ink }}>{s.val}</div>
                    <div style={{ fontSize:9, color:C.muted, fontWeight:600, marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {prediction.breakdown && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:8 }}>SCORE BREAKDOWN</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <RadarChart data={[
                      { subject:"Hook",     value:prediction.breakdown.hook_strength },
                      { subject:"Audience", value:prediction.breakdown.audience_reach },
                      { subject:"Format",   value:prediction.breakdown.content_format },
                      { subject:"Timing",   value:prediction.breakdown.timing_potential },
                    ]}>
                      <PolarGrid stroke={C.hairline} />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize:10, fill:C.muted }} />
                      <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false} />
                      <Radar dataKey="value" stroke={C.red} fill={C.red} fillOpacity={0.25} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {prediction.next_milestone && (
                <div style={{ background:`${C.success}12`, border:`1px solid ${C.success}33`, borderRadius:10, padding:"10px 14px", marginBottom:12, fontSize:13, color:C.slate }}>
                  🏆 At this pace → <strong style={{ color:C.success }}>{fmt(prediction.next_milestone.target)} followers</strong> in ~{prediction.next_milestone.months} month{prediction.next_milestone.months !== 1 ? "s" : ""}
                </div>
              )}

              <div style={{ fontSize:12.5, color:C.slate, lineHeight:1.7 }}>
                <div>🕐 <strong>Best time to post:</strong> {prediction.best_post_time}</div>
                <div>✍️ <strong>Tip:</strong> {prediction.tip}</div>
              </div>
            </>
          )}
        </Section>
      )}

      {/* ── Audience Tab ── */}
      {tab === "audience" && audience && (
        <>
          <Section title="📍 Top Locations">
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {audience.top_locations.map((l, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:70, fontSize:12, color:C.ink, fontWeight:600 }}>{l.city}</div>
                  <div style={{ flex:1, background:C.hairline, borderRadius:99, height:8, overflow:"hidden" }}>
                    <div style={{ width:`${l.pct}%`, height:"100%", background:`linear-gradient(90deg,${C.red},${C.orange})`, borderRadius:99 }} />
                  </div>
                  <div style={{ width:30, fontSize:11, color:C.muted, fontWeight:700, textAlign:"right" }}>{l.pct}%</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="🎂 Age Groups">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={audience.age_groups} margin={{ top:5, right:10, left:-20, bottom:0 }}>
                <XAxis dataKey="group" tick={{ fontSize:11, fill:C.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:9, fill:C.muted }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:10, fontSize:12 }} formatter={v => [`${v}%`, "Share"]} />
                <Bar dataKey="pct" fill={C.red} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="⚡ Peak Activity Hours">
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {audience.peak_hours.map((h, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:50, fontSize:12, color:C.ink, fontWeight:600 }}>{h.hour}</div>
                  <div style={{ flex:1, background:C.hairline, borderRadius:99, height:8, overflow:"hidden" }}>
                    <div style={{ width:`${h.activity}%`, height:"100%", background:`linear-gradient(90deg,${C.red},${C.orange})`, borderRadius:99 }} />
                  </div>
                  <div style={{ width:35, fontSize:11, color:C.muted, fontWeight:700, textAlign:"right" }}>{h.activity}%</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="👥 Gender Split">
            <div style={{ display:"flex", gap:12 }}>
              {[{label:"Female",val:audience.gender.female,col:C.red},{label:"Male",val:audience.gender.male,col:C.purple}].map((g, i) => (
                <div key={i} style={{ flex:1, background:`${g.col}12`, border:`1px solid ${g.col}33`, borderRadius:12, padding:14, textAlign:"center" }}>
                  <div style={{ fontSize:22, fontWeight:900, color:g.col }}>{g.val}%</div>
                  <div style={{ fontSize:11, color:C.muted, fontWeight:700 }}>{g.label}</div>
                </div>
              ))}
            </div>
            {audience.note && (
              <div style={{ marginTop:12, background:`${C.warn}12`, border:`1px solid ${C.warn}33`, borderRadius:10, padding:"10px 14px", fontSize:12, color:C.slate }}>
                💡 {audience.note}
              </div>
            )}
          </Section>

          {audience.is_mock && <p style={{ textAlign:"center", fontSize:10, color:C.muted }}>⚠ Estimated data — real audience data loads after API approval</p>}
        </>
      )}

      {/* ── Best Time Tab ── */}
      {tab === "besttime" && bestTime && (
        <>
          <Section title="🕐 Best Time to Pin — Weekly Heatmap">
            <p style={{ fontSize:12, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
              Pinterest peaks on weekends. Darker = more audience activity.
            </p>
            <Heatmap data={bestTime.heatmap} />
          </Section>

          <Section title="🏆 Top Time Slots (IST)">
            {bestTime.top_slots.map((s, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${C.hairline}` }}>
                <div>
                  <span style={{ fontSize:14, fontWeight:800, color:C.ink }}>#{i+1} {s.day}</span>
                  <span style={{ fontSize:12, color:C.muted, marginLeft:8 }}>{s.time}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:60, background:C.hairline, borderRadius:99, height:6, overflow:"hidden" }}>
                    <div style={{ width:`${s.score}%`, height:"100%", background:`linear-gradient(90deg,${C.red},${C.orange})`, borderRadius:99 }} />
                  </div>
                  <span style={{ fontSize:12, fontWeight:800, color:C.red }}>{s.score}</span>
                </div>
              </div>
            ))}
            {bestTime.insight && (
              <div style={{ marginTop:14, background:`${C.red}10`, border:`1px solid ${C.red}30`, borderRadius:10, padding:"10px 14px", fontSize:12.5, color:C.slate, lineHeight:1.6 }}>
                💡 {bestTime.insight}
              </div>
            )}
          </Section>
        </>
      )}

      {/* ── Benchmark Tab ── */}
      {tab === "benchmark" && benchmark && (
        <Section title="📈 How You Compare">
          <div style={{ display:"flex", gap:10, marginBottom:16 }}>
            <div style={{ flex:1, background:`${C.red}12`, border:`1px solid ${C.red}33`, borderRadius:12, padding:14, textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:900, color:C.red }}>{benchmark.your_tier}</div>
              <div style={{ fontSize:11, color:C.muted, fontWeight:700 }}>Your Tier</div>
            </div>
            <div style={{ flex:1, background:`${C.purple}12`, border:`1px solid ${C.purple}33`, borderRadius:12, padding:14, textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:900, color:C.purple }}>Top {100 - benchmark.your_percentile}%</div>
              <div style={{ fontSize:11, color:C.muted, fontWeight:700 }}>In Your Tier</div>
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { label:"Monthly Impressions", yours: fmt(insights?.total_impressions || 0),                                         avg: fmt(benchmark.benchmark.avg_monthly_impressions) },
              { label:"Avg. Saves/Pin",      yours: fmt(Math.round((insights?.total_saves || 0) / Math.max(pins.length, 1))),      avg: fmt(benchmark.benchmark.avg_saves_per_pin) },
              { label:"Avg. Clicks/Pin",     yours: fmt(Math.round((insights?.total_pin_clicks || 0) / Math.max(pins.length, 1))), avg: fmt(benchmark.benchmark.avg_clicks_per_pin) },
              { label:"Engagement Rate",     yours: `${insights?.engagement_rate ?? 0}%`,                                          avg: `${benchmark.benchmark.avg_eng_rate}%` },
            ].map((row, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${C.hairline}` }}>
                <span style={{ fontSize:12, color:C.ink, fontWeight:600 }}>{row.label}</span>
                <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:C.red }}>{row.yours}</div>
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
            💡 {benchmark.growth_tip}
          </div>
        </Section>
      )}

      {/* ── Publish Tab ── */}
      {tab === "publish" && (
        <Section title="📌 Publish a Pin">
          <Publisher userId={userId} boards={boards} onPublished={() => setTimeout(load, 3000)} />
        </Section>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}