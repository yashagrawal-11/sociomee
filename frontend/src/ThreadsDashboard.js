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

const BASE = "https://sociomee.in/api";

function getC() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  return dark ? {
    rose:"#ff6eb5", purple:"#a78bfa", purpleXlt:"#150d2a",
    teal:"#22d3ee", ink:"#ede8ff", slate:"#c4b5fd",
    muted:"#9d86c8", hairline:"rgba(167,139,250,0.15)",
    glass:"rgba(22,14,42,0.82)", white:"#ede8ff",
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
      <div style={{ width:36, height:36, borderRadius:"50%", border:`3px solid ${C.purple}22`, borderTopColor:C.purple, animation:"spin 0.7s linear infinite" }} />
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
function StatCard({ icon, label, value, color, sub }) {
  C = getC();
  return (
    <div style={{ background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:16, padding:"16px 18px", flex:1, minWidth:110, textAlign:"center" }}>
      <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
      <div style={{ fontSize:22, fontWeight:900, color: color || C.purple, letterSpacing:"-0.5px", lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.8px", marginTop:4 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:C.success, fontWeight:600, marginTop:2 }}>{sub}</div>}
    </div>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────
function Tab({ label, active, onClick }) {
  C = getC();
  return (
    <button onClick={onClick} style={{ padding:"8px 16px", borderRadius:99, border:`1.5px solid ${active ? C.purple : C.hairline}`, background:active ? `${C.purple}18` : "transparent", color:active ? C.purple : C.muted, fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", whiteSpace:"nowrap" }}>
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
  const [text, setText]     = useState(topic ? topic.slice(0, 450) : "");
  const [loading, setLoad]  = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr]       = useState("");
  const rem = 500 - text.length;

  const publish = async () => {
    if (!text.trim()) { setErr("Write something first."); return; }
    setLoad(true); setErr(""); setResult(null);
    try {
      const r = await fetch(`${BASE}/threads/publish?user_id=${userId}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ text }),
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
      <div style={{ fontSize:40, marginBottom:8 }}>🎉</div>
      <p style={{ fontSize:14, fontWeight:700, color:C.success, marginBottom:8 }}>Posted to Threads!</p>
      {result.url && <a href={result.url} target="_blank" rel="noreferrer" style={{ fontSize:12, color:C.purple, fontWeight:600 }}>View on Threads →</a>}
      <br />
      <button onClick={() => { setResult(null); setText(""); }} style={{ marginTop:12, padding:"8px 20px", borderRadius:99, border:"none", background:C.purple, color:C.white, fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Post Another</button>
    </div>
  );

  return (
    <>
      <textarea value={text} onChange={e => setText(e.target.value.slice(0, 500))} placeholder="Write your Threads post... (max 500 chars)" rows={4}
        style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:13.5, lineHeight:1.7, fontFamily:"inherit", resize:"vertical", outline:"none", boxSizing:"border-box" }} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
        <span style={{ fontSize:11.5, color: rem < 50 ? C.danger : C.muted, fontWeight:600 }}>{rem} chars left</span>
        <button onClick={publish} disabled={loading || !text.trim()} style={{ padding:"9px 22px", borderRadius:99, border:"none", background:`linear-gradient(135deg,#000,#333)`, color:"#fff", fontWeight:800, fontSize:12.5, cursor: loading || !text.trim() ? "not-allowed" : "pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:7, opacity: loading || !text.trim() ? 0.6 : 1 }}>
          <ThreadsIcon size={14} color="#fff" />
          {loading ? "Posting…" : "Post to Threads"}
        </button>
      </div>
      {err && <p style={{ fontSize:12, color:C.danger, fontWeight:600, marginTop:8 }}>⚠ {err}</p>}
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
  const [predTopic,  setPredTopic ] = useState(topic || "");
  const [predLoading,setPredLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const sr = await fetch(`${BASE}/threads/status?user_id=${userId}`);
      const st = await sr.json();
      if (!st.connected) { setConnected(false); setLoading(false); return; }
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
      setPrediction(await r.json());
    } catch (e) {
      console.error(e);
    } finally { setPredLoading(false); }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const r = await fetch(`${BASE}/threads/auth-url?user_id=${userId}`);
      const d = await r.json();
      window.location.href = d.url;
    } catch (e) { setConnecting(false); }
  };

  if (loading) return <Spinner />;

  // ── Not connected ──────────────────────────────────────────────────
  if (!connected) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"52px 24px", gap:16, textAlign:"center" }}>
      <div style={{ width:72, height:72, borderRadius:20, background:"#000", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 12px 32px rgba(0,0,0,0.3)" }}>
        <ThreadsIcon size={40} color="#fff" />
      </div>
      <h2 style={{ fontSize:20, fontWeight:900, color:C.ink }}>Connect Threads</h2>
      <p style={{ fontSize:13, color:C.muted, maxWidth:320, lineHeight:1.7 }}>
        Get full analytics, viral predictions, audience insights, and best time to post — all in one place.
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, maxWidth:320, width:"100%", textAlign:"left" }}>
        {["📊 Views, likes & engagement", "🔥 Viral post predictor", "👥 Audience demographics", "🕐 Best time to post heatmap", "📈 Competitor benchmarking", "✍️ Publish directly"].map((f, i) => (
          <div key={i} style={{ fontSize:12, color:C.slate, background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:10, padding:"8px 12px" }}>{f}</div>
        ))}
      </div>
      <button onClick={handleConnect} disabled={connecting} style={{ padding:"13px 36px", borderRadius:99, border:"none", background:"#000", color:"#fff", fontWeight:800, fontSize:14, cursor: connecting ? "not-allowed" : "pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:10, boxShadow:"0 8px 24px rgba(0,0,0,0.25)", opacity: connecting ? 0.7 : 1 }}>
        <ThreadsIcon size={18} color="#fff" />
        {connecting ? "Redirecting…" : "Connect with Threads"}
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
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
        <StatCard icon="👥" label="Followers"        value={fmt(profile?.followers)}              color="#000" />
        <StatCard icon="👁️" label={`Views (${days}d)`} value={fmt(insights?.total_views)}       color={C.purple} />
        <StatCard icon="❤️" label={`Likes (${days}d)`} value={fmt(insights?.total_likes)}        color={C.rose} />
        <StatCard icon="💬" label="Eng. Rate"         value={`${insights?.engagement_rate ?? "—"}%`} color={C.teal} />
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16, overflowX:"auto" }}>
        {[["analytics","📊 Analytics"],["viral","🔥 Viral Predictor"],["audience","👥 Audience"],["besttime","🕐 Best Time"],["benchmark","📈 Benchmark"],["publish","✍️ Publish"]].map(([key, label]) => (
          <Tab key={key} label={label} active={tab === key} onClick={() => setTab(key)} />
        ))}
      </div>

      {/* ── Analytics Tab ── */}
      {tab === "analytics" && (
        <>
          <Section title="📈 Engagement Over Time">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:6 }}>
              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                {[["views","Views",C.purple],["likes","Likes",C.rose],["replies","Replies",C.teal],["reposts","Reposts",C.warn]].map(([k,l,col]) => (
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
                    <Line type="monotone" dataKey={chartMetric} stroke={chartMetric==="views"?C.purple:chartMetric==="likes"?C.rose:chartMetric==="replies"?C.teal:C.warn} strokeWidth={2.5} dot={false} activeDot={{ r:5, strokeWidth:0 }} />
                  </LineChart>
                </ResponsiveContainer>
              : <p style={{ textAlign:"center", color:C.muted, fontSize:13, padding:"40px 0" }}>No data yet.</p>
            }
            {insights?.is_mock && <p style={{ textAlign:"center", fontSize:10, color:C.muted, marginTop:6 }}>⚠ Demo data — real data loads after threads_manage_insights is approved</p>}
          </Section>

          <Section title="🧵 Recent Threads">
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
        <Section title="🔥 Viral Post Predictor">
          <p style={{ fontSize:12.5, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
            Enter your post idea or topic and our AI will predict how it'll perform — before you even post it.
          </p>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            <input value={predTopic} onChange={e => setPredTopic(e.target.value)} placeholder="e.g. Hot take: most creators are faking their growth numbers..." style={{ flex:1, padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:13, fontFamily:"inherit", outline:"none" }} onKeyDown={e => e.key === "Enter" && runPrediction()} />
            <button onClick={runPrediction} disabled={predLoading || !predTopic.trim()} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:`linear-gradient(135deg,${C.purple},${C.rose})`, color:"#fff", fontWeight:800, fontSize:12.5, cursor: predLoading ? "not-allowed" : "pointer", fontFamily:"inherit", opacity: predLoading ? 0.7 : 1 }}>
              {predLoading ? "…" : "Predict"}
            </button>
          </div>

          {prediction && (
            <>
              {/* Score + key metrics */}
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

              {/* Estimated stats */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:16 }}>
                {[
                  { icon:"👁️", label:"Est. Views",   val:fmt(prediction.estimated_views) },
                  { icon:"❤️", label:"Est. Likes",   val:fmt(prediction.estimated_likes) },
                  { icon:"💬", label:"Est. Replies", val:fmt(prediction.estimated_replies) },
                  { icon:"👥", label:"Est. Follows", val:`+${fmt(prediction.estimated_follows)}` },
                ].map((s, i) => (
                  <div key={i} style={{ background:`${C.purple}0D`, border:`1px solid ${C.hairline}`, borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
                    <div style={{ fontSize:18 }}>{s.icon}</div>
                    <div style={{ fontSize:15, fontWeight:900, color:C.ink }}>{s.val}</div>
                    <div style={{ fontSize:9, color:C.muted, fontWeight:600, marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Breakdown radar */}
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
                      <Radar dataKey="value" stroke={C.purple} fill={C.purple} fillOpacity={0.25} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Next milestone */}
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
                    <div style={{ width:`${l.pct}%`, height:"100%", background:`linear-gradient(90deg,${C.purple},${C.teal})`, borderRadius:99 }} />
                  </div>
                  <div style={{ width:30, fontSize:11, color:C.muted, fontWeight:700, textAlign:"right" }}>{l.pct}%</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="🎂 Age Groups">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={audience.age_groups} margin={{ top:5, right:10, left:-20, bottom:0 }}>
                <XAxis dataKey="group" tick={{ fontSize:11, fill:C.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:9, fill:C.muted }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:10, fontSize:12 }} formatter={v => [`${v}%`, "Share"]} />
                <Bar dataKey="pct" fill={C.purple} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="⚡ Peak Activity Hours">
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

          <Section title="👥 Gender Split">
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
          <Section title="🕐 Best Time to Post — Weekly Heatmap">
            <p style={{ fontSize:12, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
              Darker = more audience activity. Post during peak hours for maximum reach.
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
        <Section title="📈 How You Compare">
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
        <Section title="✍️ Publish to Threads">
          <Publisher userId={userId} topic={topic} onPublished={() => setTimeout(load, 3000)} />
        </Section>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}