/**
 * TikTokDashboard.js — SocioMee TikTok
 * Analytics + SEO + Content Generation + Scheduler
 */
import { useState, useEffect } from "react";

const BASE = "https://sociomee.in/api";

function getC() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  return dark ? {
    rose:"#ff6eb5", purple:"#a78bfa", teal:"#22d3ee", ink:"#ede8ff",
    muted:"#9d86c8", hairline:"rgba(167,139,250,0.15)", glass:"rgba(22,14,42,0.82)",
    success:"#34d399", warn:"#fbbf24", danger:"#f87171",
    tt:"#ff0050", ttSecond:"#00f2ea", slate:"#c4b5fd",
    inputBg:"rgba(15,8,30,0.9)", cardBg:"rgba(255,255,255,0.04)",
  } : {
    rose:"#ff3d8f", purple:"#7c3aed", teal:"#0891b2", ink:"#0d0015",
    muted:"#8b6b9a", hairline:"rgba(124,58,237,0.12)", glass:"rgba(255,255,255,0.92)",
    success:"#10b981", warn:"#f59e0b", danger:"#ef4444",
    tt:"#ff0050", ttSecond:"#00f2ea", slate:"#3b1f4e",
    inputBg:"rgba(255,255,255,0.9)", cardBg:"rgba(255,255,255,0.7)",
  };
}

const Spin = ({ size=20, color }) => {
  const C = getC();
  return <div style={{ width:size, height:size, borderRadius:"50%", border:`2.5px solid ${(color||C.tt)}22`, borderTopColor:color||C.tt, animation:"spin 0.7s linear infinite", display:"inline-block", flexShrink:0 }} />;
};

function TTIcon({ size=20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path fill="#ff0050" d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z"/>
    </svg>
  );
}

function StatCard({ label, value, sub, color }) {
  const C = getC();
  return (
    <div style={{ background:C.cardBg, border:`1px solid ${C.hairline}`, borderRadius:12, padding:"14px 16px", flex:1, minWidth:120 }}>
      <div style={{ fontSize:11, fontWeight:600, color:C.muted, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:800, color: color || C.ink }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:C.muted, marginTop:3 }}>{sub}</div>}
    </div>
  );
}

function fmt(n) {
  if (!n) return "0";
  if (n >= 1000000) return (n/1000000).toFixed(1) + "M";
  if (n >= 1000)    return (n/1000).toFixed(1) + "K";
  return String(n);
}

// ── Connect Panel ──────────────────────────────────────────────────────
function ConnectPanel({ userId, onConnected }) {
  const C = getC();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const connect = async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`${BASE}/tiktok/auth-url?user_id=${userId}`);
      const d = await r.json();
      if (d.url) {
        window.location.href = d.url;
      } else {
        throw new Error(d.detail || "Could not get auth URL");
      }
    } catch(e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth:460, margin:"0 auto", textAlign:"center" }}>
      <div style={{ width:72, height:72, borderRadius:22, background:`${C.tt}15`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
        <TTIcon size={36}/>
      </div>
      <div style={{ fontSize:22, fontWeight:800, color:C.ink, marginBottom:8 }}>Connect TikTok</div>
      <div style={{ fontSize:14, color:C.muted, marginBottom:28, lineHeight:1.6 }}>
        Connect your TikTok account to get analytics, generate content, and schedule posts directly from SocioMee.
      </div>

      <div style={{ background:`${C.tt}10`, border:`1px solid ${C.tt}30`, borderRadius:12, padding:"14px 16px", marginBottom:24, textAlign:"left" }}>
        <div style={{ fontSize:12, fontWeight:700, color:C.tt, marginBottom:10 }}>✅ What you get</div>
        {["View your TikTok analytics & viral score","Generate hooks, captions, hashtags with AI","Schedule posts with best time recommendations","Get editing notes and shot plans for every video"].map((s,i) => (
          <div key={i} style={{ display:"flex", gap:8, marginBottom:6, fontSize:13, color:C.ink, alignItems:"flex-start" }}>
            <span style={{ color:C.tt, flexShrink:0 }}>✦</span> {s}
          </div>
        ))}
      </div>

      {error && <div style={{ background:`${C.danger}15`, border:`1px solid ${C.danger}40`, borderRadius:8, padding:"8px 12px", color:C.danger, fontSize:13, marginBottom:14 }}>⚠️ {error}</div>}

      <button onClick={connect} disabled={loading} style={{ width:"100%", padding:"14px", borderRadius:14, background:C.tt, color:"#fff", border:"none", fontSize:16, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
        {loading ? <Spin size={20} color="#fff"/> : <TTIcon size={20}/>}
        {loading ? "Redirecting to TikTok..." : "Connect with TikTok"}
      </button>

      <div style={{ fontSize:11, color:C.muted, marginTop:12 }}>
        You will be redirected to TikTok to authorize SocioMee.
      </div>
    </div>
  );
}

// ── Analytics Tab ──────────────────────────────────────────────────────
function AnalyticsTab({ userId }) {
  const C = getC();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    fetch(`${BASE}/tiktok/analytics?user_id=${userId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError("Failed to load analytics"); setLoading(false); });
  }, [userId]);

  if (loading) return <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:60, gap:12, color:C.muted }}><Spin size={24} color={C.tt}/> Loading analytics...</div>;
  if (error)   return <div style={{ color:C.danger, padding:20 }}>⚠️ {error}</div>;
  if (!data)   return null;

  return (
    <div>
      {/* Stats grid */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:16 }}>
        <StatCard label="Followers"    value={fmt(data.followers)}       color={C.tt}/>
        <StatCard label="Total Views"  value={fmt(data.total_views)}     color={C.purple}/>
        <StatCard label="Total Likes"  value={fmt(data.total_likes)}     color={C.rose}/>
        <StatCard label="Engagement"   value={`${data.engagement_rate}%`} color={C.success}/>
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:20 }}>
        <StatCard label="Videos"       value={data.total_videos}         color={C.teal}/>
        <StatCard label="Avg Views"    value={fmt(data.avg_views)}       color={C.warn}/>
        <StatCard label="Shares"       value={fmt(data.total_shares)}    color={C.purple}/>
        <StatCard label="Viral Score"  value={`${data.viral_score}/100`} color={C.tt}/>
      </div>

      {/* Best posting times */}
      <div style={{ background:C.cardBg, border:`1px solid ${C.hairline}`, borderRadius:14, padding:"18px 20px", marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.tt, marginBottom:12 }}>⏰ Best Posting Times for India</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:8 }}>
          {data.best_posting_times?.map((t,i) => (
            <div key={i} style={{ background:`${C.tt}10`, border:`1px solid ${C.tt}25`, borderRadius:10, padding:"10px 12px" }}>
              <div style={{ fontSize:12, fontWeight:700, color:C.tt }}>{t.day}</div>
              <div style={{ fontSize:15, fontWeight:800, color:C.ink }}>{t.time}</div>
              <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>Score: {t.score}/100</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent videos */}
      {data.recent_videos?.length > 0 && (
        <div style={{ background:C.cardBg, border:`1px solid ${C.hairline}`, borderRadius:14, padding:"18px 20px" }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.ink, marginBottom:12 }}>🎬 Recent Videos</div>
          {data.recent_videos.slice(0,5).map((v,i) => (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom: i<4 ? `1px solid ${C.hairline}` : "none" }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.title || "Untitled"}</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{new Date(v.create_time*1000).toLocaleDateString("en-IN")}</div>
              </div>
              <div style={{ display:"flex", gap:12, flexShrink:0, fontSize:12, color:C.muted }}>
                <span>👁️ {fmt(v.view_count)}</span>
                <span>❤️ {fmt(v.like_count)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── SEO / Generate Tab ─────────────────────────────────────────────────
function SEOTab({ userId }) {
  const C = getC();
  const [topic,   setTopic]   = useState("");
  const [niche,   setNiche]   = useState("lifestyle");
  const [tone,    setTone]    = useState("default");
  const [dur,     setDur]     = useState(30);
  const [loading, setLoading] = useState(false);
  const [pack,    setPack]    = useState(null);
  const [error,   setError]   = useState("");
  const [copied,  setCopied]  = useState("");

  const niches = ["lifestyle","fitness","beauty","fashion","finance","technology","gaming","travel","education","comedy","personal growth"];
  const tones  = ["default","bold","funny","educational","emotional","controversial"];

  const generate = async () => {
    if (!topic.trim()) { setError("Enter a topic"); return; }
    setLoading(true); setError(""); setPack(null);
    try {
      const r = await fetch(`${BASE}/tiktok/generate`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ user_id: userId, topic: topic.trim(), niche, tone, objective:"watch_time", duration: dur }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Generation failed");
      setPack(d);
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const inp = { width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.hairline}`, background:C.inputBg, color:C.ink, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" };
  const sel  = { ...inp, cursor:"pointer" };

  const CopyBtn = ({ text, id }) => (
    <button onClick={() => copy(text, id)} style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${C.hairline}`, background:"transparent", color: copied===id ? C.success : C.muted, fontSize:11, cursor:"pointer", flexShrink:0 }}>
      {copied===id ? "✅" : "Copy"}
    </button>
  );

  return (
    <div>
      {/* Input form */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
        <div>
          <label style={{ fontSize:11, fontWeight:600, color:C.muted, display:"block", marginBottom:5 }}>NICHE</label>
          <select style={sel} value={niche} onChange={e => setNiche(e.target.value)}>
            {niches.map(n => <option key={n} value={n}>{n.charAt(0).toUpperCase()+n.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize:11, fontWeight:600, color:C.muted, display:"block", marginBottom:5 }}>TONE</label>
          <select style={sel} value={tone} onChange={e => setTone(e.target.value)}>
            {tones.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom:12 }}>
        <label style={{ fontSize:11, fontWeight:600, color:C.muted, display:"block", marginBottom:5 }}>DURATION (seconds)</label>
        <div style={{ display:"flex", gap:8 }}>
          {[15,30,45,60].map(d => (
            <button key={d} onClick={() => setDur(d)} style={{ flex:1, padding:"8px", borderRadius:8, border:`1.5px solid ${dur===d ? C.tt : C.hairline}`, background: dur===d ? `${C.tt}15` : "transparent", color: dur===d ? C.tt : C.muted, fontSize:13, fontWeight:600, cursor:"pointer" }}>
              {d}s
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom:14 }}>
        <label style={{ fontSize:11, fontWeight:600, color:C.muted, display:"block", marginBottom:5 }}>TOPIC</label>
        <div style={{ display:"flex", gap:8 }}>
          <input style={{...inp, flex:1}} placeholder="e.g. Morning skincare routine for glowing skin" value={topic} onChange={e => setTopic(e.target.value)} onKeyDown={e => e.key==="Enter" && generate()}/>
          <button onClick={generate} disabled={loading} style={{ padding:"10px 20px", borderRadius:10, background:C.tt, color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:6 }}>
            {loading ? <Spin size={16} color="#fff"/> : <TTIcon size={16}/>}
            {loading ? "..." : "Generate"}
          </button>
        </div>
      </div>

      {error && <div style={{ background:`${C.danger}15`, border:`1px solid ${C.danger}40`, borderRadius:8, padding:"8px 12px", color:C.danger, fontSize:13, marginBottom:14 }}>⚠️ {error}</div>}

      {pack && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {/* Hook */}
          <div style={{ background:C.cardBg, border:`1px solid ${C.hairline}`, borderRadius:12, padding:"14px 16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:11, fontWeight:700, color:C.tt, textTransform:"uppercase" }}>🎯 Hook</span>
              <CopyBtn text={pack.hook} id="hook"/>
            </div>
            <div style={{ fontSize:15, fontWeight:600, color:C.ink, lineHeight:1.5 }}>{pack.hook}</div>
          </div>

          {/* Cover text */}
          <div style={{ background:C.cardBg, border:`1px solid ${C.hairline}`, borderRadius:12, padding:"14px 16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:11, fontWeight:700, color:C.tt, textTransform:"uppercase" }}>📺 Cover Text</span>
              <CopyBtn text={pack.cover_text} id="cover"/>
            </div>
            <div style={{ fontSize:20, fontWeight:800, color:C.ink }}>{pack.cover_text}</div>
          </div>

          {/* Caption */}
          <div style={{ background:C.cardBg, border:`1px solid ${C.hairline}`, borderRadius:12, padding:"14px 16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:11, fontWeight:700, color:C.tt, textTransform:"uppercase" }}>✍️ Caption</span>
              <CopyBtn text={pack.caption} id="caption"/>
            </div>
            <div style={{ fontSize:14, color:C.ink, lineHeight:1.7 }}>{pack.caption}</div>
          </div>

          {/* Hashtags */}
          <div style={{ background:C.cardBg, border:`1px solid ${C.hairline}`, borderRadius:12, padding:"14px 16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
              <span style={{ fontSize:11, fontWeight:700, color:C.tt, textTransform:"uppercase" }}>🏷️ Hashtags</span>
              <CopyBtn text={pack.hashtags?.join(" ")} id="hashtags"/>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {pack.hashtags?.map((h,i) => (
                <span key={i} style={{ padding:"4px 10px", borderRadius:99, background:`${C.tt}12`, border:`1px solid ${C.tt}30`, fontSize:12, color:C.tt, fontWeight:600 }}>{h}</span>
              ))}
            </div>
          </div>

          {/* Best posting time */}
          <div style={{ display:"flex", gap:10 }}>
            <div style={{ flex:1, background:`${C.tt}10`, border:`1px solid ${C.tt}30`, borderRadius:12, padding:"14px 16px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.tt, marginBottom:6 }}>📅 BEST DAY</div>
              <div style={{ fontSize:16, fontWeight:800, color:C.ink }}>{pack.posting_window?.best_day}</div>
            </div>
            <div style={{ flex:1, background:`${C.tt}10`, border:`1px solid ${C.tt}30`, borderRadius:12, padding:"14px 16px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.tt, marginBottom:6 }}>⏰ BEST TIME</div>
              <div style={{ fontSize:16, fontWeight:800, color:C.ink }}>{pack.posting_window?.best_time}</div>
            </div>
            <div style={{ flex:1, background:`${C.success}10`, border:`1px solid ${C.success}30`, borderRadius:12, padding:"14px 16px" }}>
              <div style={{ fontSize:11, fontWeight:700, color:C.success, marginBottom:6 }}>📈 VIRAL SCORE</div>
              <div style={{ fontSize:16, fontWeight:800, color:C.ink }}>{pack.engagement_prediction?.viral_score}/100</div>
            </div>
          </div>

          {/* Beat plan */}
          <div style={{ background:C.cardBg, border:`1px solid ${C.hairline}`, borderRadius:12, padding:"14px 16px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.tt, textTransform:"uppercase", marginBottom:12 }}>🎬 Beat Plan</div>
            {pack.beat_plan?.map((b,i) => (
              <div key={i} style={{ display:"flex", gap:10, marginBottom:8, alignItems:"flex-start" }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background:C.tt, color:"#fff", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{b.beat}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.ink }}>{b.purpose}</div>
                  <div style={{ fontSize:11, color:C.muted }}>@ {b.time_seconds}s · {b.energy} energy</div>
                </div>
              </div>
            ))}
          </div>

          {/* Editing notes */}
          <div style={{ background:C.cardBg, border:`1px solid ${C.hairline}`, borderRadius:12, padding:"14px 16px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.tt, textTransform:"uppercase", marginBottom:10 }}>✂️ Editing Notes</div>
            {pack.editing_notes?.map((n,i) => (
              <div key={i} style={{ display:"flex", gap:8, marginBottom:6 }}>
                <span style={{ color:C.tt, flexShrink:0 }}>✦</span>
                <span style={{ fontSize:13, color:C.ink }}>{n}</span>
              </div>
            ))}
          </div>

          {/* Variants */}
          <div style={{ background:C.cardBg, border:`1px solid ${C.hairline}`, borderRadius:12, padding:"14px 16px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.tt, textTransform:"uppercase", marginBottom:10 }}>🔀 Title Variants</div>
            {pack.variants?.map((v,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom: i<pack.variants.length-1 ? `1px solid ${C.hairline}` : "none" }}>
                <span style={{ fontSize:13, color:C.ink }}>{v}</span>
                <CopyBtn text={v} id={`var${i}`}/>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Scheduler Tab ──────────────────────────────────────────────────────
function SchedulerTab({ userId }) {
  const C = getC();
  const [caption,  setCaption]  = useState("");
  const [hashtags, setHashtags] = useState("");
  const [schedAt,  setSchedAt]  = useState("");
  const [posts,    setPosts]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [fetchLoad,setFetchLoad]= useState(true);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  const fetchPosts = async () => {
    setFetchLoad(true);
    try {
      const r = await fetch(`${BASE}/tiktok/schedule?user_id=${userId}`);
      const d = await r.json();
      setPosts(d.posts || []);
    } catch(e) {} finally { setFetchLoad(false); }
  };

  useEffect(() => { fetchPosts(); }, [userId]);

  const schedule = async () => {
    if (!caption.trim()) { setError("Write a caption"); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const r = await fetch(`${BASE}/tiktok/schedule`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          user_id:      userId,
          caption:      caption.trim(),
          hashtags:     hashtags.split(" ").filter(h => h.startsWith("#")),
          scheduled_at: schedAt || "",
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || "Schedule failed");
      setSuccess(`Scheduled! ID: ${d.id}`);
      setCaption(""); setHashtags(""); setSchedAt("");
      fetchPosts();
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id) => {
    try {
      await fetch(`${BASE}/tiktok/schedule/${id}?user_id=${userId}`, { method:"DELETE" });
      fetchPosts();
    } catch(e) {}
  };

  const inp = { width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.hairline}`, background:C.inputBg, color:C.ink, fontSize:14, fontFamily:"inherit", outline:"none", boxSizing:"border-box" };

  const statusColor = s => s==="scheduled" ? C.warn : s==="done" ? C.success : s==="error" ? C.danger : C.muted;
  const statusIcon  = s => s==="scheduled" ? "⏰" : s==="done" ? "✅" : s==="error" ? "❌" : "⏳";

  return (
    <div>
      {/* Compose */}
      <div style={{ background:C.cardBg, border:`1px solid ${C.hairline}`, borderRadius:14, padding:"18px 20px", marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.ink, marginBottom:14 }}>📅 Schedule a TikTok Post</div>

        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11, fontWeight:600, color:C.muted, display:"block", marginBottom:5 }}>CAPTION</label>
          <textarea style={{...inp, minHeight:100, resize:"vertical", lineHeight:1.6}} placeholder="Write your TikTok caption..." value={caption} onChange={e => setCaption(e.target.value)}/>
        </div>

        <div style={{ marginBottom:12 }}>
          <label style={{ fontSize:11, fontWeight:600, color:C.muted, display:"block", marginBottom:5 }}>HASHTAGS</label>
          <input style={inp} placeholder="#fitness #motivation #tiktok" value={hashtags} onChange={e => setHashtags(e.target.value)}/>
        </div>

        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:11, fontWeight:600, color:C.muted, display:"block", marginBottom:5 }}>SCHEDULE TIME (optional — blank = now)</label>
          <input style={inp} type="datetime-local" value={schedAt} onChange={e => setSchedAt(e.target.value)}/>
        </div>

        {error   && <div style={{ background:`${C.danger}15`, border:`1px solid ${C.danger}40`, borderRadius:8, padding:"8px 12px", color:C.danger, fontSize:13, marginBottom:12 }}>⚠️ {error}</div>}
        {success && <div style={{ background:`${C.success}15`, border:`1px solid ${C.success}40`, borderRadius:8, padding:"8px 12px", color:C.success, fontSize:13, marginBottom:12 }}>✅ {success}</div>}

        <button onClick={schedule} disabled={loading} style={{ width:"100%", padding:"11px", borderRadius:12, background:C.tt, color:"#fff", border:"none", fontSize:14, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {loading ? <Spin size={18} color="#fff"/> : "⏰"}
          {loading ? "Scheduling..." : "Schedule Post"}
        </button>
      </div>

      {/* Posts list */}
      <div style={{ fontSize:13, fontWeight:700, color:C.ink, marginBottom:12 }}>📋 Scheduled Posts</div>
      {fetchLoad ? (
        <div style={{ display:"flex", justifyContent:"center", padding:30 }}><Spin size={24} color={C.tt}/></div>
      ) : posts.length === 0 ? (
        <div style={{ textAlign:"center", padding:30, color:C.muted, fontSize:14 }}>No scheduled posts yet</div>
      ) : (
        posts.map(p => (
          <div key={p.id} style={{ background:C.cardBg, border:`1px solid ${C.hairline}`, borderRadius:12, padding:"14px 16px", marginBottom:10 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.caption}</div>
                {p.hashtags?.length > 0 && (
                  <div style={{ fontSize:11, color:C.tt, marginTop:4 }}>{p.hashtags.join(" ")}</div>
                )}
                <div style={{ fontSize:11, color:C.muted, marginTop:6 }}>
                  <span style={{ color: statusColor(p.status) }}>{statusIcon(p.status)} {p.status}</span>
                  {" · "}{p.scheduled_at ? new Date(p.scheduled_at).toLocaleString("en-IN") : "Immediate"}
                </div>
              </div>
              <button onClick={() => deletePost(p.id)} style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${C.danger}40`, background:`${C.danger}10`, color:C.danger, fontSize:11, cursor:"pointer", flexShrink:0 }}>Delete</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────
export default function TikTokDashboard({ userId }) {
  const C = getC();
  const [status,  setStatus]  = useState(null);
  const [tab,     setTab]     = useState("analytics");
  const [loading, setLoading] = useState(true);
  const [disc,    setDisc]    = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/tiktok/connect-status?user_id=${userId}`);
      const d = await r.json();
      setStatus(d);
    } catch(e) {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if returning from TikTok OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get("tiktok") === "connected") {
      window.history.replaceState({}, "", window.location.pathname);
    }
    fetchStatus();
  }, [userId]);

  const disconnect = async () => {
    setDisc(true);
    try {
      await fetch(`${BASE}/tiktok/disconnect?user_id=${userId}`, { method:"POST" });
      setStatus({ connected: false });
    } finally {
      setDisc(false);
    }
  };

  const card = { background:C.cardBg, border:`1px solid ${C.hairline}`, borderRadius:16, padding:"20px 22px", marginBottom:16 };
  const tabBtn = (id, label) => (
    <button onClick={() => setTab(id)} style={{ padding:"8px 16px", borderRadius:99, border:`1.5px solid ${tab===id ? C.tt : C.hairline}`, background: tab===id ? `${C.tt}18` : "transparent", color: tab===id ? C.tt : C.muted, fontSize:13, fontWeight:600, cursor:"pointer" }}>
      {label}
    </button>
  );

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:60, gap:12, color:C.muted }}>
      <Spin size={24} color={C.tt}/> Loading TikTok...
    </div>
  );

  if (!status?.connected) return (
    <div style={{ padding:"32px 16px" }}>
      <ConnectPanel userId={userId} onConnected={() => fetchStatus()}/>
    </div>
  );

  return (
    <div style={{ padding:"24px 16px", maxWidth:720, margin:"0 auto" }}>
      {/* Connected header */}
      <div style={{...card, background:`${C.tt}10`, border:`1px solid ${C.tt}30`, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {status.avatar_url && <img src={status.avatar_url} alt="" style={{ width:44, height:44, borderRadius:14, objectFit:"cover" }}/>}
          {!status.avatar_url && (
            <div style={{ width:44, height:44, borderRadius:14, background:`${C.tt}20`, display:"flex", alignItems:"center", justifyContent:"center" }}><TTIcon size={24}/></div>
          )}
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:C.ink }}>{status.display_name || "TikTok Account"}</div>
            <div style={{ fontSize:13, color:C.tt }}>✅ Connected · {fmt(status.followers)} followers</div>
          </div>
        </div>
        <button onClick={disconnect} disabled={disc} style={{ padding:"6px 14px", borderRadius:99, border:`1.5px solid ${C.danger}40`, background:`${C.danger}10`, color:C.danger, fontSize:12, fontWeight:600, cursor:"pointer" }}>
          {disc ? "..." : "Disconnect"}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20 }}>
        {tabBtn("analytics", "📊 Analytics")}
        {tabBtn("seo",       "✨ SEO & Generate")}
        {tabBtn("schedule",  "⏰ Scheduler")}
      </div>

      {/* Tab content */}
      <div style={tab !== "analytics" ? card : {}}>
        {tab === "analytics" && <AnalyticsTab userId={userId}/>}
        {tab === "seo"       && <SEOTab       userId={userId}/>}
        {tab === "schedule"  && <SchedulerTab userId={userId}/>}
      </div>
    </div>
  );
}
