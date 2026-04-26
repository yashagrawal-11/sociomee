/**
 * YouTubeDashboard.js — SocioMee YouTube Analytics Dashboard
 * Shows channel stats, views/subs graph, top videos, and AI growth prediction.
 * Uses recharts for graphs (already in your package.json).
 *
 * Usage in App.js:
 *   import YouTubeDashboard from "./YouTubeDashboard";
 *   // Add a "YouTube" tab button that shows <YouTubeDashboard user={user} topic={keyword} />
 */

import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const BASE = "https://sociomee.in/api";

// Theme-aware colors — reads from html[data-theme] set by App.js
function getThemeC() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  return dark ? {
    rose:"#ff6eb5",    purple:"#a78bfa",   purpleXlt:"#150d2a",
    teal:"#22d3ee",    ink:"#ede8ff",       slate:"#c4b5fd",
    muted:"#9d86c8",   hairline:"rgba(167,139,250,0.15)",
    glass:"rgba(22,14,42,0.82)",
    white:"#ede8ff",   success:"#34d399",
    warn:"#fbbf24",    danger:"#f87171",
    yt:"#ff0000",
  } : {
    rose:"#ff3d8f",    purple:"#7c3aed",   purpleXlt:"#f5f3ff",
    teal:"#0891b2",    ink:"#0d0015",       slate:"#3b1f4e",
    muted:"#8b6b9a",   hairline:"rgba(124,58,237,0.12)",
    glass:"rgba(255,255,255,0.68)",
    white:"#ffffff",   success:"#10b981",
    warn:"#f59e0b",    danger:"#ef4444",
    yt:"#ff0000",
  };
}

// C is resolved fresh on each render
let C = getThemeC();

// ── Helpers ───────────────────────────────────────────────────────────
function fmt(n) {
  if (!n && n !== 0) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1)     + "K";
  return String(n);
}

function StatCard({ icon, label, value, sub, color = C.purple }) {
  return (
    <div style={{ background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:"16px", padding:"18px 20px", flex:1, minWidth:"120px" }}>
      <div style={{ fontSize:"22px", marginBottom:"6px" }}>{icon}</div>
      <div style={{ fontSize:"22px", fontWeight:"900", color, letterSpacing:"-1px", lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:"11px", fontWeight:"700", color:C.muted, marginTop:"4px", textTransform:"uppercase", letterSpacing:"0.8px" }}>{label}</div>
      {sub && <div style={{ fontSize:"11px", color:C.success, fontWeight:"600", marginTop:"2px" }}>{sub}</div>}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", padding:"40px" }}>
      <div style={{ width:"36px", height:"36px", borderRadius:"50%", border:`3px solid ${C.purple}22`, borderTopColor:C.purple, animation:"spin 0.7s linear infinite" }} />
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

// ── Connect Button ────────────────────────────────────────────────────
function ConnectYouTube({ userId, onConnected }) {
  const [loading, setLoading] = useState(false);
  const [err,     setErr    ] = useState("");

  const handleConnect = async () => {
    setLoading(true); setErr("");
    try {
      const res  = await fetch(`${BASE}/youtube/auth-url?redirect_uri=${encodeURIComponent(window.location.origin + "/youtube/callback")}`);
      const data = await res.json();
      if (data?.url) {
        // Store userId so callback page can use it
        sessionStorage.setItem("yt_connect_user_id", userId);
        window.location.href = data.url;
      }
    } catch (e) {
      setErr("Failed to start OAuth. Is backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"52px 24px", gap:"20px" }}>
      {/* YouTube logo */}
      <div style={{ width:"72px", height:"72px", borderRadius:"18px", background:"#ff0000", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 12px 32px #ff000044" }}>
        <svg viewBox="0 0 24 24" width="40" height="40" fill="white">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      </div>

      <div style={{ textAlign:"center" }}>
        <h2 style={{ fontSize:"20px", fontWeight:"900", color:C.ink, marginBottom:"8px" }}>Connect Your YouTube Channel</h2>
        <p style={{ fontSize:"13px", color:C.muted, lineHeight:1.6, maxWidth:"340px" }}>
          Get real analytics, AI-powered growth predictions, and channel insights — read-only access, we never post on your behalf.
        </p>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"8px", width:"100%", maxWidth:"320px" }}>
        {["📊 Views & subscribers graph", "🎬 Top performing videos", "🤖 AI growth prediction", "🔒 Read-only — never posts"].map((f, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:"8px", fontSize:"13px", color:C.slate }}>
            <span>{f}</span>
          </div>
        ))}
      </div>

      {err && <p style={{ color:C.danger, fontSize:"12.5px", fontWeight:"600" }}>⚠ {err}</p>}

      <button onClick={handleConnect} disabled={loading} style={{ padding:"14px 32px", borderRadius:"14px", border:"none", background:"linear-gradient(135deg,#ff0000,#cc0000)", color:"white", fontWeight:"800", fontSize:"15px", cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", boxShadow:"0 12px 32px #ff000044", display:"flex", alignItems:"center", gap:"10px" }}>
        {loading ? "Redirecting…" : "▶ Connect YouTube Channel"}
      </button>
      <p style={{ fontSize:"11px", color:C.muted }}>Secured by Google OAuth 2.0 · Read-only access</p>
    </div>
  );
}

// ── Analytics Chart ───────────────────────────────────────────────────
function AnalyticsChart({ data, metric = "views", color = C.purple }) {
  const label = metric === "views" ? "Views" : "Subscribers";
  const formatted = (data || []).map(d => ({
    ...d,
    date: d.date?.slice(5),  // "MM-DD" format
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted} margin={{ top:5, right:10, left:-20, bottom:0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.hairline} />
        <XAxis dataKey="date" tick={{ fontSize:10, fill:C.muted }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize:10, fill:C.muted }} tickLine={false} axisLine={false} tickFormatter={fmt} />
        <Tooltip
          contentStyle={{ background:C.white, border:`1px solid ${C.hairline}`, borderRadius:"10px", fontSize:"12px" }}
          formatter={(val) => [fmt(val), label]}
        />
        <Line type="monotone" dataKey={metric} stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r:5, strokeWidth:0 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Growth Prediction Card ────────────────────────────────────────────
function GrowthPrediction({ prediction, topic }) {
  if (!prediction) return null;
  const { estimated_views, estimated_subs, virality_score, recommendation, next_milestone, best_upload_time, best_thumbnail_tip, growth_pct } = prediction;
  const col = virality_score >= 70 ? C.success : virality_score >= 50 ? C.warn : C.muted;

  return (
    <div style={{ background:`linear-gradient(145deg,${C.purpleXlt},#fff0f7)`, border:`1.5px solid ${C.purple}33`, borderRadius:"16px", padding:"20px", marginBottom:"20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"14px" }}>
        <div>
          <div style={{ fontSize:"11px", fontWeight:"900", letterSpacing:"1.5px", textTransform:"uppercase", color:C.purple, marginBottom:"4px" }}>🤖 AI Growth Prediction</div>
          <div style={{ fontSize:"14px", fontWeight:"700", color:C.ink }}>If you upload: <span style={{ color:C.purple }}>"{topic}"</span></div>
        </div>
        {/* Virality score ring */}
        <div style={{ textAlign:"center", flexShrink:0 }}>
          <div style={{ fontSize:"24px", fontWeight:"900", color:col, lineHeight:1 }}>{virality_score}</div>
          <div style={{ fontSize:"9px", fontWeight:"800", color:C.muted, textTransform:"uppercase" }}>Virality</div>
        </div>
      </div>

      {/* Estimated stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"14px" }}>
        {[
          { icon:"👁️", label:"Est. Views",    val:fmt(estimated_views) },
          { icon:"➕", label:"Est. New Subs", val:`+${fmt(estimated_subs)}` },
          { icon:"📈", label:"Growth",         val:`+${growth_pct}%`        },
        ].map((s, i) => (
          <div key={i} style={{ background:C.glass, borderRadius:"10px", padding:"10px", textAlign:"center" }}>
            <div style={{ fontSize:"18px" }}>{s.icon}</div>
            <div style={{ fontSize:"16px", fontWeight:"900", color:C.ink }}>{s.val}</div>
            <div style={{ fontSize:"10px", color:C.muted, fontWeight:"600" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Next milestone */}
      {next_milestone && (
        <div style={{ background:`${C.success}12`, border:`1px solid ${C.success}33`, borderRadius:"10px", padding:"10px 14px", marginBottom:"12px", fontSize:"13px", color:C.slate }}>
          🏆 At this pace, you'll hit <strong style={{ color:C.success }}>{fmt(next_milestone.target)} subscribers</strong> in approx. <strong>{next_milestone.months} month{next_milestone.months !== 1 ? "s" : ""}</strong>
        </div>
      )}

      {/* Tips */}
      <div style={{ fontSize:"12.5px", color:C.slate, lineHeight:1.6 }}>
        <div style={{ marginBottom:"4px" }}>💡 <strong>Strategy:</strong> {recommendation}</div>
        <div style={{ marginBottom:"4px" }}>🕐 <strong>Best time to upload:</strong> {best_upload_time}</div>
        <div>🖼️ <strong>Thumbnail tip:</strong> {best_thumbnail_tip}</div>
      </div>
    </div>
  );
}

// ── Top Videos Table ──────────────────────────────────────────────────
function TopVideos({ videos }) {
  if (!videos?.length) return <p style={{ color:C.muted, fontSize:"13px", textAlign:"center", padding:"20px" }}>No videos found.</p>;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
      {videos.map((v, i) => (
        <a key={i} href={v.url} target="_blank" rel="noreferrer" style={{ display:"flex", gap:"12px", alignItems:"center", background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:"12px", padding:"10px 14px", textDecoration:"none", transition:"all 0.15s" }}>
          <div style={{ width:"28px", height:"28px", borderRadius:"6px", background:`${C.purple}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", fontWeight:"800", color:C.purple, flexShrink:0 }}>#{i+1}</div>
          {v.thumbnail && <img src={v.thumbnail} alt="" style={{ width:"64px", height:"36px", borderRadius:"6px", objectFit:"cover", flexShrink:0 }} />}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:"12.5px", fontWeight:"700", color:C.ink, lineHeight:1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.title}</div>
            <div style={{ fontSize:"10.5px", color:C.muted, marginTop:"2px" }}>{v.published_at}</div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div style={{ fontSize:"13px", fontWeight:"800", color:C.ink }}>{fmt(v.views)}</div>
            <div style={{ fontSize:"10px", color:C.muted }}>views</div>
          </div>
          <div style={{ textAlign:"right", flexShrink:0 }}>
            <div style={{ fontSize:"13px", fontWeight:"700", color:C.success }}>👍 {fmt(v.likes)}</div>
          </div>
        </a>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════
export default function YouTubeDashboard({ user, topic = "" }) {
  // Refresh theme on every render
  C = getThemeC();

  const userId = user?.user_id || localStorage.getItem("sociomee_user_id") || "";

  const [connected,  setConnected ] = useState(false);
  const [channel,    setChannel  ] = useState(null);
  const [analytics,  setAnalytics] = useState(null);
  const [videos,     setVideos   ] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading,    setLoading  ] = useState(true);
  const [activeChart, setActiveChart] = useState("views");
  const [days,       setDays     ] = useState(30);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      // Check connection status
      const statusRes = await fetch(`${BASE}/youtube/status/${userId}`);
      const status    = await statusRes.json();

      if (!status.connected) { setConnected(false); setLoading(false); return; }
      setConnected(true);
      setChannel(status);

      // Load analytics + videos in parallel
      const [analyticsRes, videosRes] = await Promise.all([
        fetch(`${BASE}/youtube/analytics/${userId}?days=${days}`),
        fetch(`${BASE}/youtube/videos/${userId}?max_results=8`),
      ]);
      const [analyticsData, videosData] = await Promise.all([
        analyticsRes.json(),
        videosRes.json(),
      ]);
      setAnalytics(analyticsData);
      setVideos(videosData.videos || []);

      // Growth prediction if topic provided
      if (topic) {
        const predRes  = await fetch(`${BASE}/youtube/predict/${userId}?topic=${encodeURIComponent(topic)}`);
        const predData = await predRes.json();
        setPrediction(predData);
      }
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  }, [userId, days, topic]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;

  if (!connected) {
    return <ConnectYouTube userId={userId} onConnected={() => { setConnected(true); load(); }} />;
  }

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif" }}>

      {/* Channel header */}
      <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"20px", background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:"16px", padding:"14px 18px" }}>
        {/* Channel avatar with letter fallback */}
        {channel?.thumbnail
          ? <img
              src={channel.thumbnail}
              alt=""
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              style={{ width:"48px", height:"48px", borderRadius:"50%", border:`2px solid ${C.yt}44`, objectFit:"cover", flexShrink:0 }}
              onError={e => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
          : null
        }
        <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:`linear-gradient(135deg,${C.yt},#cc0000)`, display: channel?.thumbnail ? "none" : "flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"20px", fontWeight:"900", flexShrink:0 }}>
          {(channel?.channel_title || "Y").charAt(0).toUpperCase()}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:"15px", fontWeight:"800", color:C.ink }}>{channel?.channel_title || "Your Channel"}</div>
          <div style={{ fontSize:"11.5px", color:C.muted }}>
            {fmt(channel?.video_count)} videos · {fmt(channel?.subscribers)} subscribers
          </div>
        </div>
        <button onClick={() => { if (window.confirm("Disconnect YouTube?")) { fetch(`${BASE}/youtube/disconnect/${userId}`, {method:"POST"}).then(() => { setConnected(false); setChannel(null); }); } }} style={{ padding:"5px 12px", borderRadius:"99px", border:`1px solid ${C.danger}44`, background:C.danger+"10", color:C.danger, fontSize:"11.5px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>Disconnect</button>
      </div>

      {/* Stat cards */}
      <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginBottom:"20px" }}>
        <StatCard icon="👥" label="Subscribers" value={fmt(channel?.subscribers)} color={C.yt} />
        <StatCard icon="👁️" label="Total Views"  value={fmt(channel?.total_views)} color={C.purple} />
        <StatCard icon="📊" label={`Views (${days}d)`} value={fmt(analytics?.total_views)} sub={analytics?.is_mock ? "Demo data" : ""} color={C.teal} />
        <StatCard icon="➕" label={`Subs (${days}d)`}  value={`+${fmt(analytics?.total_subs)}`} color={C.success} />
      </div>

      {/* Analytics chart */}
      <div style={{ background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:"16px", padding:"18px", marginBottom:"20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
          <span style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.2px", textTransform:"uppercase", color:C.muted }}>📈 Channel Analytics</span>
          <div style={{ display:"flex", gap:"6px" }}>
            {/* Metric toggle */}
            {[["views","Views",C.purple],["subs","Subs",C.success]].map(([key,label,col]) => (
              <button key={key} onClick={() => setActiveChart(key)} style={{ padding:"4px 10px", borderRadius:"99px", border:`1.5px solid ${activeChart===key?col:C.hairline}`, background:activeChart===key?col+"18":"rgba(255,255,255,0.5)", color:activeChart===key?col:C.muted, fontSize:"11.5px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>{label}</button>
            ))}
            {/* Period toggle */}
            {[7,30,90].map(d => (
              <button key={d} onClick={() => setDays(d)} style={{ padding:"4px 10px", borderRadius:"99px", border:`1.5px solid ${days===d?C.teal:C.hairline}`, background:days===d?C.teal+"18":"rgba(255,255,255,0.5)", color:days===d?C.teal:C.muted, fontSize:"11.5px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>{d}d</button>
            ))}
          </div>
        </div>
        {analytics?.chart_data?.length > 0
          ? <AnalyticsChart data={analytics.chart_data} metric={activeChart} color={activeChart==="views"?C.purple:C.success} />
          : <p style={{ textAlign:"center", color:C.muted, fontSize:"13px", padding:"40px 0" }}>No analytics data available yet.</p>
        }
        {analytics?.is_mock && <p style={{ textAlign:"center", fontSize:"10.5px", color:C.muted, marginTop:"8px" }}>⚠ Demo data — connect YouTube Analytics API for real data</p>}
      </div>

      {/* AI Growth Prediction */}
      {topic && <GrowthPrediction prediction={prediction} topic={topic} />}

      {/* Top Videos */}
      <div style={{ background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:"16px", padding:"18px" }}>
        <div style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.2px", textTransform:"uppercase", color:C.muted, marginBottom:"14px" }}>🎬 Top Videos by Views</div>
        <TopVideos videos={videos} />
      </div>

      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
    </div>
  );
}
