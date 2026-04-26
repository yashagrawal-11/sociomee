/**
 * InstagramDashboard.js — SocioMee Instagram Analytics
 * 7 tabs: Analytics, Reels, Stories, Viral Predictor, Audience, Best Time, Benchmark + Publish
 * Same pattern as ThreadsDashboard.js
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
    pink:"#f472b6", purple:"#a78bfa", purpleXlt:"#150d2a",
    orange:"#fb923c", teal:"#22d3ee", ink:"#ede8ff", slate:"#c4b5fd",
    muted:"#9d86c8", hairline:"rgba(167,139,250,0.15)",
    glass:"rgba(22,14,42,0.82)", white:"#ede8ff",
    success:"#34d399", warn:"#fbbf24", danger:"#f87171",
    ig:"linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)",
    card:"rgba(30,18,55,0.9)",
  } : {
    pink:"#e1306c", purple:"#7c3aed", purpleXlt:"#f5f3ff",
    orange:"#f97316", teal:"#0891b2", ink:"#0d0015", slate:"#3b1f4e",
    muted:"#8b6b9a", hairline:"rgba(124,58,237,0.12)",
    glass:"rgba(255,255,255,0.72)", white:"#fff",
    success:"#10b981", warn:"#f59e0b", danger:"#ef4444",
    ig:"linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)",
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
      <div style={{ width:36, height:36, borderRadius:"50%", border:`3px solid ${C.pink}22`, borderTopColor:C.pink, animation:"spin 0.7s linear infinite" }} />
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

function IGIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fcb045"/>
          <stop offset="50%" stopColor="#fd1d1d"/>
          <stop offset="100%" stopColor="#833ab4"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="url(#ig-grad)" strokeWidth="2" fill="none"/>
      <circle cx="12" cy="12" r="5" stroke="url(#ig-grad)" strokeWidth="2" fill="none"/>
      <circle cx="17.5" cy="6.5" r="1.5" fill="url(#ig-grad)"/>
    </svg>
  );
}

function StatCard({ icon, label, value, color, sub }) {
  C = getC();
  return (
    <div style={{ background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:16, padding:"16px 18px", flex:1, minWidth:100, textAlign:"center" }}>
      <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
      <div style={{ fontSize:21, fontWeight:900, color: color || C.pink, letterSpacing:"-0.5px", lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.8px", marginTop:4 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:C.success, fontWeight:600, marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function Tab({ label, active, onClick }) {
  C = getC();
  return (
    <button onClick={onClick} style={{ padding:"7px 14px", borderRadius:99, border:`1.5px solid ${active ? C.pink : C.hairline}`, background:active ? `${C.pink}18` : "transparent", color:active ? C.pink : C.muted, fontWeight:700, fontSize:11.5, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", whiteSpace:"nowrap" }}>
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
  const scoreColor = s => s >= 80 ? C.pink : s >= 60 ? C.orange : s >= 40 ? C.warn : s >= 20 ? `${C.muted}88` : C.hairline;
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
        {[C.hairline, `${C.muted}88`, C.warn, C.orange, C.pink].map((col, i) => (
          <div key={i} style={{ width:14, height:14, borderRadius:3, background:col }} />
        ))}
        <span style={{ fontSize:9, color:C.muted }}>High</span>
      </div>
    </div>
  );
}

function Publisher({ userId, topic, onPublished }) {
  C = getC();
  const [caption, setCaption] = useState(topic ? topic.slice(0, 500) : "");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoad] = useState(false);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const rem = 2200 - caption.length;

  const publish = async () => {
    if (!caption.trim()) { setErr("Write a caption first."); return; }
    if (!imageUrl.trim()) { setErr("Image URL is required — Instagram requires an image to post."); return; }
    setLoad(true); setErr(""); setResult(null);
    try {
      const r = await fetch(`${BASE}/instagram/publish?user_id=${userId}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ caption, image_url: imageUrl }),
      });
      const d = await r.json();
      if (d.success) { setResult(d); onPublished?.(); }
      else setErr(d.detail || "Failed to publish.");
    } catch(e) { setErr(e.message || "Network error."); }
    finally { setLoad(false); }
  };

  if (result) return (
    <div style={{ textAlign:"center", padding:"24px 0" }}>
      <div style={{ fontSize:40, marginBottom:8 }}>🎉</div>
      <p style={{ fontSize:14, fontWeight:700, color:C.success, marginBottom:8 }}>Posted to Instagram!</p>
      {result.url && <a href={result.url} target="_blank" rel="noreferrer" style={{ fontSize:12, color:C.pink, fontWeight:600 }}>View on Instagram →</a>}
      <br />
      <button onClick={() => { setResult(null); setCaption(""); setImageUrl(""); }} style={{ marginTop:12, padding:"8px 20px", borderRadius:99, border:"none", background:C.pink, color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Post Another</button>
    </div>
  );

  return (
    <>
      <div style={{ marginBottom:10 }}>
        <label style={{ fontSize:11, fontWeight:700, color:C.muted, display:"block", marginBottom:5 }}>IMAGE URL (required)</label>
        <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://your-image-url.jpg (must be publicly accessible)"
          style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:12.5, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
        <p style={{ fontSize:10.5, color:C.muted, marginTop:4 }}>⚠ Instagram requires a publicly accessible image URL. Upload to Cloudinary, ImgBB, or your server first.</p>
      </div>
      <textarea value={caption} onChange={e => setCaption(e.target.value.slice(0, 2200))} placeholder="Write your Instagram caption... (max 2200 chars)" rows={4}
        style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:13.5, lineHeight:1.7, fontFamily:"inherit", resize:"vertical", outline:"none", boxSizing:"border-box" }} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
        <span style={{ fontSize:11.5, color: rem < 100 ? C.danger : C.muted, fontWeight:600 }}>{rem} chars left</span>
        <button onClick={publish} disabled={loading || !caption.trim() || !imageUrl.trim()} style={{ padding:"9px 22px", borderRadius:99, border:"none", background:C.ig, color:"#fff", fontWeight:800, fontSize:12.5, cursor: loading ? "not-allowed" : "pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:7, opacity: loading ? 0.6 : 1 }}>
          <IGIcon size={14} />
          {loading ? "Posting…" : "Post to Instagram"}
        </button>
      </div>
      {err && <p style={{ fontSize:12, color:C.danger, fontWeight:600, marginTop:8 }}>⚠ {err}</p>}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ════════════════════════════════════════════════════════════════════
export default function InstagramDashboard({ user, topic = "" }) {
  C = getC();
  const userId = user?.user_id || localStorage.getItem("sociomee_user_id") || "";

  const [tab,         setTab        ] = useState("analytics");
  const [profile,     setProfile    ] = useState(null);
  const [insights,    setInsights   ] = useState(null);
  const [posts,       setPosts      ] = useState([]);
  const [stories,     setStories    ] = useState(null);
  const [reels,       setReels      ] = useState(null);
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
  const [predFormat,  setPredFormat ] = useState("reel");
  const [predLoading, setPredLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const sr = await fetch(`${BASE}/instagram/status?user_id=${userId}`);
      const st = await sr.json();
      if (!st.connected) { setConnected(false); setLoading(false); return; }
      setConnected(true);
      setProfile(st);

      const [ir, pr, sr2, rr, ar, btr, br] = await Promise.all([
        fetch(`${BASE}/instagram/insights?user_id=${userId}&days=${days}`),
        fetch(`${BASE}/instagram/posts?user_id=${userId}&limit=12`),
        fetch(`${BASE}/instagram/stories?user_id=${userId}`),
        fetch(`${BASE}/instagram/reels?user_id=${userId}`),
        fetch(`${BASE}/instagram/audience?user_id=${userId}`),
        fetch(`${BASE}/instagram/best-time?user_id=${userId}`),
        fetch(`${BASE}/instagram/benchmark?user_id=${userId}`),
      ]);
      const [id, pd, std, rd, ad, btd, bmd] = await Promise.all([
        ir.json(), pr.json(), sr2.json(), rr.json(), ar.json(), btr.json(), br.json(),
      ]);
      setInsights(id);
      setPosts(pd.posts || []);
      setStories(std);
      setReels(rd);
      setAudience(ad);
      setBestTime(btd);
      setBenchmark(bmd);

      if (topic) {
        const predr = await fetch(`${BASE}/instagram/predict?user_id=${userId}&topic=${encodeURIComponent(topic)}&content_format=reel`);
        setPrediction(await predr.json());
      }
    } catch(e) {
      console.error("InstagramDashboard:", e);
    } finally {
      setLoading(false);
    }
  }, [userId, days, topic]);

  useEffect(() => { load(); }, [load]);

  const runPrediction = async () => {
    if (!predTopic.trim()) return;
    setPredLoading(true);
    try {
      const r = await fetch(`${BASE}/instagram/predict?user_id=${userId}&topic=${encodeURIComponent(predTopic)}&content_format=${predFormat}`);
      setPrediction(await r.json());
    } catch(e) { console.error(e); }
    finally { setPredLoading(false); }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const r = await fetch(`${BASE}/instagram/auth-url?user_id=${userId}`);
      const d = await r.json();
      window.location.href = d.url;
    } catch { setConnecting(false); }
  };

  if (loading) return <Spinner />;

  // ── Not connected ──────────────────────────────────────────────────
  if (!connected) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"52px 24px", gap:16, textAlign:"center" }}>
      <div style={{ width:72, height:72, borderRadius:20, background:C.ig, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 12px 32px rgba(225,48,108,0.3)" }}>
        <IGIcon size={38} />
      </div>
      <h2 style={{ fontSize:20, fontWeight:900, color:C.ink }}>Connect Instagram</h2>
      <p style={{ fontSize:13, color:C.muted, maxWidth:320, lineHeight:1.7 }}>
        Get full analytics, viral predictions, Reels insights, audience data, and best time to post.
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, maxWidth:340, width:"100%", textAlign:"left" }}>
        {["📊 Impressions, reach & engagement", "🔥 Viral Reel predictor", "🎬 Reels & Stories analytics", "👥 Audience demographics", "🕐 Best time to post heatmap", "✍️ Publish directly to Instagram"].map((f, i) => (
          <div key={i} style={{ fontSize:12, color:C.slate, background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:10, padding:"8px 12px" }}>{f}</div>
        ))}
      </div>
      <div style={{ background:`${C.warn}15`, border:`1px solid ${C.warn}44`, borderRadius:12, padding:"12px 16px", maxWidth:340, fontSize:12, color:C.slate, textAlign:"left", lineHeight:1.6 }}>
        ⚠ <strong>Requires Instagram Business or Creator account</strong> linked to a Facebook Page. Personal accounts are not supported by Meta's API.
      </div>
      <button onClick={handleConnect} disabled={connecting} style={{ padding:"13px 36px", borderRadius:99, border:"none", background:C.ig, color:"#fff", fontWeight:800, fontSize:14, cursor: connecting ? "not-allowed" : "pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:10, boxShadow:"0 8px 24px rgba(225,48,108,0.3)", opacity: connecting ? 0.7 : 1 }}>
        <IGIcon size={18} />
        {connecting ? "Redirecting…" : "Connect with Instagram"}
      </button>
    </div>
  );

  // ── Connected ──────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif" }}>

      {/* Profile header */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16, background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:16, padding:"14px 18px" }}>
        {profile?.profile_pic
          ? <img src={profile.profile_pic} alt="" referrerPolicy="no-referrer" style={{ width:48, height:48, borderRadius:"50%", objectFit:"cover", flexShrink:0, border:"2px solid transparent", backgroundImage:C.ig, backgroundOrigin:"border-box" }} />
          : <div style={{ width:48, height:48, borderRadius:"50%", background:C.ig, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><IGIcon size={24} /></div>
        }
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:800, color:C.ink }}>@{profile?.username}</div>
          <div style={{ fontSize:11.5, color:C.muted }}>{profile?.display_name} · {fmt(profile?.followers)} followers · {fmt(profile?.media_count)} posts</div>
          {profile?.bio && <div style={{ fontSize:11, color:C.muted, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{profile.bio}</div>}
        </div>
        <div style={{ display:"flex", gap:6, flexShrink:0 }}>
          {profile?.profile_url && <a href={profile.profile_url} target="_blank" rel="noreferrer" style={{ padding:"5px 12px", borderRadius:99, border:`1px solid ${C.hairline}`, color:C.slate, fontSize:11.5, fontWeight:700, textDecoration:"none" }}>View</a>}
          <button onClick={() => { if (window.confirm("Disconnect Instagram?")) fetch(`${BASE}/instagram/disconnect?user_id=${userId}`, {method:"POST"}).then(() => { setConnected(false); setProfile(null); }); }} style={{ padding:"5px 12px", borderRadius:99, border:`1px solid ${C.danger}44`, background:`${C.danger}10`, color:C.danger, fontSize:11.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Disconnect</button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
        <StatCard icon="👥" label="Followers"      value={fmt(profile?.followers)}                      color={C.pink} />
        <StatCard icon="👁️" label={`Reach (${days}d)`}  value={fmt(insights?.total_reach)}             color={C.purple} />
        <StatCard icon="📊" label={`Impr. (${days}d)`}  value={fmt(insights?.total_impressions)}        color={C.orange} />
        <StatCard icon="💾" label="Saves"          value={fmt(insights?.total_saves)}                   color={C.success} />
        <StatCard icon="💬" label="Eng. Rate"      value={`${insights?.engagement_rate ?? "—"}%`}       color={C.teal} />
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:16, overflowX:"auto" }}>
        {[
          ["analytics","📊 Analytics"],
          ["reels","🎬 Reels"],
          ["stories","📱 Stories"],
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
        <>
          <Section title="📈 Performance Over Time">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:6 }}>
              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                {[["impressions","Impressions",C.purple],["reach","Reach",C.pink],["likes","Likes",C.orange],["saves","Saves",C.success],["comments","Comments",C.teal]].map(([k,l,col]) => (
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
                    <Line type="monotone" dataKey={chartMetric} stroke={chartMetric==="impressions"?C.purple:chartMetric==="reach"?C.pink:chartMetric==="likes"?C.orange:chartMetric==="saves"?C.success:C.teal} strokeWidth={2.5} dot={false} activeDot={{ r:5, strokeWidth:0 }} />
                  </LineChart>
                </ResponsiveContainer>
              : <p style={{ textAlign:"center", color:C.muted, fontSize:13, padding:"40px 0" }}>No data yet.</p>
            }
            {insights?.is_mock && <p style={{ textAlign:"center", fontSize:10, color:C.muted, marginTop:6 }}>⚠ Demo data — real data loads after instagram_manage_insights is approved</p>}
          </Section>

          <Section title="🖼️ Recent Posts">
            {posts.length === 0
              ? <p style={{ textAlign:"center", color:C.muted, fontSize:13, padding:20 }}>No posts found.</p>
              : posts.map((p, i) => (
                <div key={i} style={{ background:`${C.hairline}`, border:`1px solid ${C.hairline}`, borderRadius:12, padding:"12px 14px", marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6, gap:8 }}>
                    <p style={{ fontSize:13, color:C.ink, lineHeight:1.5, flex:1 }}>{p.caption || "(No caption)"}</p>
                    <span style={{ fontSize:10, fontWeight:700, color:C.muted, background:`${C.hairline}`, padding:"2px 8px", borderRadius:99, flexShrink:0 }}>{p.type === "VIDEO" ? "🎬 Reel" : p.type === "CAROUSEL_ALBUM" ? "🖼️ Carousel" : "📷 Post"}</span>
                  </div>
                  <div style={{ display:"flex", gap:14, fontSize:11.5, color:C.muted, fontWeight:600, flexWrap:"wrap" }}>
                    <span>❤️ {fmt(p.likes)}</span>
                    <span>💬 {fmt(p.comments)}</span>
                    <span>💾 {fmt(p.saves)}</span>
                    <span style={{ marginLeft:"auto" }}>{p.timestamp}</span>
                    {p.url && <a href={p.url} target="_blank" rel="noreferrer" style={{ color:C.pink, fontWeight:700, fontSize:11 }}>View →</a>}
                  </div>
                </div>
              ))
            }
          </Section>
        </>
      )}

      {/* ── Reels Tab ── */}
      {tab === "reels" && reels && (
        <>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
            <StatCard icon="▶️" label="Avg Plays"   value={fmt(reels.avg_plays)} color={C.pink} />
            <StatCard icon="💫" label="Avg Eng Rate" value={`${reels.avg_eng}%`}  color={C.purple} />
          </div>

          <Section title="🎬 Reels Performance">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={reels.reels} margin={{ top:5, right:10, left:-20, bottom:0 }}>
                <XAxis dataKey="topic" tick={{ fontSize:9, fill:C.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:9, fill:C.muted }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                <Tooltip contentStyle={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:10, fontSize:12 }} formatter={v => [fmt(v), "Plays"]} />
                <Bar dataKey="plays" fill={C.pink} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          {reels.best_reel && (
            <Section title="🏆 Best Performing Reel">
              <div style={{ background:`${C.pink}10`, border:`1px solid ${C.pink}33`, borderRadius:12, padding:"14px 16px" }}>
                <div style={{ fontSize:14, fontWeight:800, color:C.ink, marginBottom:8 }}>{reels.best_reel.topic}</div>
                <div style={{ display:"flex", gap:16, flexWrap:"wrap", fontSize:12, color:C.muted, fontWeight:600 }}>
                  <span>▶️ {fmt(reels.best_reel.plays)} plays</span>
                  <span>❤️ {fmt(reels.best_reel.likes)}</span>
                  <span>💾 {fmt(reels.best_reel.saves)}</span>
                  <span>🔁 {fmt(reels.best_reel.shares)}</span>
                  <span>📊 {reels.best_reel.eng_rate}% eng</span>
                </div>
              </div>
            </Section>
          )}

          <Section title="">
            <div style={{ background:`${C.purple}10`, border:`1px solid ${C.purple}33`, borderRadius:10, padding:"12px 14px", fontSize:12.5, color:C.slate, lineHeight:1.6 }}>
              💡 <strong>Reels Tip:</strong> {reels.tip}
            </div>
          </Section>

          {reels.is_mock && <p style={{ textAlign:"center", fontSize:10, color:C.muted }}>⚠ Demo data — real Reels metrics load after API access is granted</p>}
        </>
      )}

      {/* ── Stories Tab ── */}
      {tab === "stories" && stories && (
        <>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
            <StatCard icon="👁️"  label="Avg Views"     value={fmt(stories.avg_views)}    color={C.pink} />
            <StatCard icon="🚪" label="Avg Exit Rate"  value={`${stories.avg_exit_rate}%`} color={C.orange} />
            <StatCard icon="🏆" label="Best Type"      value={stories.best_type}           color={C.success} />
          </div>

          <Section title="📱 Story Performance This Week">
            {stories.stories.map((s, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${C.hairline}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:C.ig, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
                    {s.type === "Poll" ? "📊" : s.type === "Question" ? "❓" : s.type === "Slider" ? "⭐" : s.type === "Quiz" ? "🧠" : s.type === "Countdown" ? "⏰" : s.type === "Link" ? "🔗" : "📷"}
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:C.ink }}>{s.day} · {s.type}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{fmt(s.views)} views · {s.replies} replies</div>
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:12, fontWeight:800, color: s.exit_rate > 15 ? C.danger : C.success }}>{s.exit_rate}% exit</div>
                </div>
              </div>
            ))}
          </Section>

          <Section title="">
            <div style={{ background:`${C.pink}10`, border:`1px solid ${C.pink}33`, borderRadius:10, padding:"12px 14px", fontSize:12.5, color:C.slate, lineHeight:1.6 }}>
              💡 <strong>Stories Tip:</strong> {stories.tip}
            </div>
          </Section>
        </>
      )}

      {/* ── Viral AI Tab ── */}
      {tab === "viral" && (
        <Section title="🔥 Viral Content AI Predictor">
          <p style={{ fontSize:12.5, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
            Enter your Reel/post idea and our AI predicts reach, likes, saves, and viral score — before you post.
          </p>

          {/* Format selector */}
          <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
            {[["reel","🎬 Reel"],["carousel","🖼️ Carousel"],["post","📷 Post"],["story","📱 Story"]].map(([key,label]) => (
              <button key={key} onClick={() => setPredFormat(key)} style={{ padding:"6px 14px", borderRadius:99, border:`1.5px solid ${predFormat===key?C.pink:C.hairline}`, background:predFormat===key?`${C.pink}18`:"transparent", color:predFormat===key?C.pink:C.muted, fontSize:11.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{label}</button>
            ))}
          </div>

          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            <input value={predTopic} onChange={e => setPredTopic(e.target.value)} placeholder="e.g. POV: I quit my 9-5 to become a full-time creator..." style={{ flex:1, padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:13, fontFamily:"inherit", outline:"none" }} onKeyDown={e => e.key === "Enter" && runPrediction()} />
            <button onClick={runPrediction} disabled={predLoading || !predTopic.trim()} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:C.ig, color:"#fff", fontWeight:800, fontSize:12.5, cursor: predLoading ? "not-allowed" : "pointer", fontFamily:"inherit", opacity: predLoading ? 0.7 : 1 }}>
              {predLoading ? "…" : "Predict"}
            </button>
          </div>

          {prediction && (
            <>
              {/* Format tip */}
              {prediction.format_tip && (
                <div style={{ background:`${C.orange}12`, border:`1px solid ${C.orange}33`, borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:12.5, color:C.slate }}>
                  📋 <strong>{prediction.content_format}:</strong> {prediction.format_tip}
                </div>
              )}

              {/* Score + recommendation */}
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
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16 }}>
                {[
                  { icon:"👁️", label:"Est. Reach",    val:fmt(prediction.estimated_reach) },
                  { icon:"❤️", label:"Est. Likes",    val:fmt(prediction.estimated_likes) },
                  { icon:"💾", label:"Est. Saves",    val:fmt(prediction.estimated_saves) },
                  { icon:"💬", label:"Est. Comments", val:fmt(prediction.estimated_comments) },
                  { icon:"🔁", label:"Est. Shares",   val:fmt(prediction.estimated_shares) },
                  { icon:"👥", label:"Est. Follows",  val:`+${fmt(prediction.estimated_follows)}` },
                ].map((s, i) => (
                  <div key={i} style={{ background:`${C.pink}0D`, border:`1px solid ${C.hairline}`, borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
                    <div style={{ fontSize:18 }}>{s.icon}</div>
                    <div style={{ fontSize:14, fontWeight:900, color:C.ink }}>{s.val}</div>
                    <div style={{ fontSize:9, color:C.muted, fontWeight:600, marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {prediction.estimated_plays && (
                <div style={{ background:`${C.purple}12`, border:`1px solid ${C.purple}33`, borderRadius:10, padding:"10px 14px", marginBottom:12, fontSize:13, color:C.slate }}>
                  🎬 Estimated Reel Plays: <strong style={{ color:C.purple }}>{fmt(prediction.estimated_plays)}</strong>
                </div>
              )}

              {/* Score breakdown radar */}
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
                      <Radar dataKey="value" stroke={C.pink} fill={C.pink} fillOpacity={0.25} strokeWidth={2} />
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
                    <div style={{ width:`${l.pct}%`, height:"100%", background:C.ig, borderRadius:99 }} />
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
                <Bar dataKey="pct" fill={C.pink} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="⚡ Peak Activity Hours">
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {audience.peak_hours.map((h, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:50, fontSize:12, color:C.ink, fontWeight:600 }}>{h.hour}</div>
                  <div style={{ flex:1, background:C.hairline, borderRadius:99, height:8, overflow:"hidden" }}>
                    <div style={{ width:`${h.activity}%`, height:"100%", background:C.ig, borderRadius:99 }} />
                  </div>
                  <div style={{ width:35, fontSize:11, color:C.muted, fontWeight:700, textAlign:"right" }}>{h.activity}%</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="👥 Gender Split">
            <div style={{ display:"flex", gap:12 }}>
              {[{label:"Male",val:audience.gender.male,col:C.purple},{label:"Female",val:audience.gender.female,col:C.pink}].map((g, i) => (
                <div key={i} style={{ flex:1, background:`${g.col}12`, border:`1px solid ${g.col}33`, borderRadius:12, padding:14, textAlign:"center" }}>
                  <div style={{ fontSize:22, fontWeight:900, color:g.col }}>{g.val}%</div>
                  <div style={{ fontSize:11, color:C.muted, fontWeight:700 }}>{g.label}</div>
                </div>
              ))}
            </div>
          </Section>

          {audience.is_mock && <p style={{ textAlign:"center", fontSize:10, color:C.muted }}>⚠ Estimated audience data — real data loads after insights API is approved</p>}
        </>
      )}

      {/* ── Best Time Tab ── */}
      {tab === "besttime" && bestTime && (
        <>
          <Section title="🕐 Best Time to Post — Weekly Heatmap">
            <p style={{ fontSize:12, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
              Darker = higher audience activity. Post during peak hours for maximum organic reach.
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
                    <div style={{ width:`${s.score}%`, height:"100%", background:C.ig, borderRadius:99 }} />
                  </div>
                  <span style={{ fontSize:12, fontWeight:800, color:C.pink }}>{s.score}</span>
                </div>
              </div>
            ))}
            {bestTime.insight && (
              <div style={{ marginTop:14, background:`${C.pink}10`, border:`1px solid ${C.pink}30`, borderRadius:10, padding:"10px 14px", fontSize:12.5, color:C.slate, lineHeight:1.6 }}>
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
            <div style={{ flex:1, background:`${C.pink}12`, border:`1px solid ${C.pink}33`, borderRadius:12, padding:14, textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:900, color:C.pink }}>{benchmark.your_tier}</div>
              <div style={{ fontSize:11, color:C.muted, fontWeight:700 }}>Your Tier</div>
            </div>
            <div style={{ flex:1, background:`${C.purple}12`, border:`1px solid ${C.purple}33`, borderRadius:12, padding:14, textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:900, color:C.purple }}>Top {100 - benchmark.your_percentile}%</div>
              <div style={{ fontSize:11, color:C.muted, fontWeight:700 }}>In Your Tier</div>
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { label:"Avg. Reach/Post",    yours: fmt(Math.round((insights?.total_reach || 0) / Math.max(posts.length, 1))),       avg: fmt(benchmark.benchmark.avg_reach_per_post) },
              { label:"Avg. Likes/Post",    yours: fmt(Math.round((insights?.total_likes || 0) / Math.max(posts.length, 1))),       avg: fmt(benchmark.benchmark.avg_likes) },
              { label:"Avg. Saves/Post",    yours: fmt(Math.round((insights?.total_saves || 0) / Math.max(posts.length, 1))),       avg: fmt(benchmark.benchmark.avg_saves) },
              { label:"Avg. Reel Plays",    yours: fmt(reels?.avg_plays || 0),                                                       avg: fmt(benchmark.benchmark.avg_reel_plays) },
              { label:"Engagement Rate",    yours: `${insights?.engagement_rate ?? 0}%`,                                             avg: `${benchmark.benchmark.avg_eng_rate}%` },
            ].map((row, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${C.hairline}` }}>
                <span style={{ fontSize:12, color:C.ink, fontWeight:600 }}>{row.label}</span>
                <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:C.pink }}>{row.yours}</div>
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
        <Section title="✍️ Publish to Instagram">
          <Publisher userId={userId} topic={topic} onPublished={() => setTimeout(load, 3000)} />
        </Section>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}