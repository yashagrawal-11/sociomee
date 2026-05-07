/**
 * RedditDashboard.js — SocioMee Reddit Analytics
 * Tabs: Analytics, Top Posts, Viral AI, Subreddits, Best Time, Benchmark, Publish
 * Demo data (real API pending Reddit approval)
 * Matches LinkedInDashboard.js style exactly
 */

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";

function getC() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  return dark ? {
    orange:"#ff6314", orangeDark:"#c94d0e", purpleXlt:"#150d0a",
    teal:"#22d3ee", ink:"#fff1ed", slate:"#ffc4a8",
    muted:"#c89d86", hairline:"rgba(255,99,20,0.15)",
    glass:"rgba(28,12,8,0.82)", white:"#fff1ed",
    success:"#34d399", warn:"#fbbf24", danger:"#f87171",
    reddit:"linear-gradient(135deg,#ff4500,#ff6314)",
    card:"rgba(30,10,5,0.9)",
  } : {
    orange:"#ff4500", orangeDark:"#c94d0e", purpleXlt:"#fff8f5",
    teal:"#0891b2", ink:"#1a0a00", slate:"#5f2d00",
    muted:"#8a6a5a", hairline:"rgba(255,69,0,0.15)",
    glass:"rgba(255,255,255,0.72)", white:"#fff",
    success:"#10b981", warn:"#f59e0b", danger:"#ef4444",
    reddit:"linear-gradient(135deg,#ff4500,#ff6314)",
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

function RedditIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#ff4500">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
    </svg>
  );
}

function StatCard({ icon, label, value, color, sub }) {
  C = getC();
  return (
    <div style={{ background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:16, padding:"16px 18px", flex:1, minWidth:100, textAlign:"center" }}>
      <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
      <div style={{ fontSize:21, fontWeight:900, color:color||C.orange, letterSpacing:"-0.5px", lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.8px", marginTop:4 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:C.success, fontWeight:600, marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function Tab({ label, active, onClick }) {
  C = getC();
  return (
    <button onClick={onClick} style={{ padding:"7px 14px", borderRadius:99, border:`1.5px solid ${active?C.orange:C.hairline}`, background:active?`${C.orange}18`:"transparent", color:active?C.orange:C.muted, fontWeight:700, fontSize:11.5, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", whiteSpace:"nowrap" }}>
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
  C = getC();
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
  const scoreColor = s => s >= 80 ? C.orange : s >= 60 ? C.warn : s >= 40 ? `${C.muted}88` : s >= 20 ? `${C.muted}44` : C.hairline;
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
        {[C.hairline, `${C.muted}44`, `${C.muted}88`, C.warn, C.orange].map((col, i) => (
          <div key={i} style={{ width:14, height:14, borderRadius:3, background:col }} />
        ))}
        <span style={{ fontSize:9, color:C.muted }}>High</span>
      </div>
    </div>
  );
}

// ── Demo data ─────────────────────────────────────────────────────────
function getDemoData() {
  const chartData = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    chartData.push({
      date: d.toLocaleDateString("en-IN", { day:"numeric", month:"short" }),
      karma:       Math.floor(200 + Math.random() * 800),
      upvotes:     Math.floor(50  + Math.random() * 400),
      comments:    Math.floor(5   + Math.random() * 60),
      awards:      Math.floor(0   + Math.random() * 5),
      views:       Math.floor(500 + Math.random() * 3000),
    });
  }

  const posts = [
    { title:"Built an AI content tool for Indian creators — here's what I learned after 1000 users", sub:"r/IndiaStartups", type:"Text", upvotes:2847, comments:312, awards:4, ratio:"97%", date:"2 days ago" },
    { title:"Why most YouTube automation channels in India are failing in 2026 [Analysis]", sub:"r/india", type:"Text", upvotes:1923, comments:187, awards:2, ratio:"94%", date:"4 days ago" },
    { title:"I analyzed 500 viral Indian YouTube thumbnails — here's the pattern", sub:"r/NewTubers", type:"Image", upvotes:3412, comments:445, awards:7, ratio:"98%", date:"6 days ago" },
    { title:"Free tool I built to generate Hindi/English scripts using AI [link in comments]", sub:"r/ChatGPT", type:"Text", upvotes:1456, comments:223, awards:3, ratio:"91%", date:"1 week ago" },
    { title:"Reddit is the most underrated platform for Indian creators — here's why", sub:"r/content_marketing", type:"Discussion", upvotes:987, comments:134, awards:1, ratio:"89%", date:"10 days ago" },
  ];

  const subreddits = [
    { name:"r/india",            members:"3.2M", karma:4820, posts:12, avgUpvotes:387, relevance:95 },
    { name:"r/IndiaStartups",    members:"184K", karma:3240, posts:8,  avgUpvotes:405, relevance:92 },
    { name:"r/NewTubers",        members:"312K", karma:5670, posts:15, avgUpvotes:378, relevance:88 },
    { name:"r/ChatGPT",          members:"7.1M", karma:2180, posts:6,  avgUpvotes:363, relevance:85 },
    { name:"r/content_marketing",members:"89K",  karma:1240, posts:5,  avgUpvotes:248, relevance:78 },
    { name:"r/Entrepreneur",     members:"2.9M", karma:980,  posts:4,  avgUpvotes:245, relevance:72 },
  ];

  const bestTimeHeatmap = [];
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const hours = [0,3,6,9,12,15,18,21];
  days.forEach(day => {
    hours.forEach(hour => {
      let score = 10;
      if (["Sat","Sun"].includes(day)) {
        if (hour === 9 || hour === 12) score = 65 + Math.floor(Math.random() * 30);
        else if (hour === 15 || hour === 18) score = 50 + Math.floor(Math.random() * 25);
        else score = 10 + Math.floor(Math.random() * 20);
      } else {
        if (hour === 9 || hour === 18 || hour === 21) score = 55 + Math.floor(Math.random() * 30);
        else if (hour === 12 || hour === 15) score = 40 + Math.floor(Math.random() * 25);
        else score = 5 + Math.floor(Math.random() * 20);
      }
      bestTimeHeatmap.push({ day, hour, score });
    });
  });

  return { chartData, posts, subreddits, bestTimeHeatmap };
}

// ════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ════════════════════════════════════════════════════════════════════
export default function RedditDashboard({ user, topic = "" }) {
  C = getC();
  const [tab,         setTab        ] = useState("analytics");
  const [chartMetric, setChartMetric] = useState("upvotes");
  const [predTopic,   setPredTopic  ] = useState(topic || "");
  const [predType,    setPredType   ] = useState("text");
  const [predSub,     setPredSub    ] = useState("r/india");
  const [predLoading, setPredLoading] = useState(false);
  const [prediction,  setPrediction ] = useState(null);
  const [postTitle,   setPostTitle  ] = useState("");
  const [postBody,    setPostBody   ] = useState("");
  const [postLoading, setPostLoading] = useState(false);
  const [postResult,  setPostResult ] = useState(null);
  const [postErr,     setPostErr    ] = useState("");

  const demo = getDemoData();

  const profile = {
    name:        user?.name || "u/YourUsername",
    karma:       14820,
    post_karma:  9340,
    comment_karma:5480,
    awards:      23,
    account_age: "2 years",
  };

  const insights = {
    total_upvotes:  demo.chartData.reduce((s, d) => s + d.upvotes, 0),
    total_comments: demo.chartData.reduce((s, d) => s + d.comments, 0),
    total_karma:    demo.chartData.reduce((s, d) => s + d.karma, 0),
    total_views:    demo.chartData.reduce((s, d) => s + d.views, 0),
    avg_ratio:      "93.4",
    chart_data:     demo.chartData,
  };

  const runPrediction = () => {
    if (!predTopic.trim()) return;
    setPredLoading(true);
    setTimeout(() => {
      const scores = {
        hook_strength:    68 + Math.floor(Math.random() * 20),
        community_fit:    60 + Math.floor(Math.random() * 30),
        content_format:   72 + Math.floor(Math.random() * 18),
        timing_potential: 65 + Math.floor(Math.random() * 25),
      };
      const virality = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / 4);
      setPrediction({
        virality_score:       virality,
        recommendation:       `This ${predType} post about "${predTopic}" in ${predSub} has ${virality >= 70 ? "strong" : "moderate"} viral potential. Reddit rewards authenticity, data, and genuine community value — avoid anything that looks promotional.`,
        estimated_upvotes:    Math.floor(200 + Math.random() * 3000),
        estimated_comments:   Math.floor(20  + Math.random() * 300),
        estimated_awards:     Math.floor(0   + Math.random() * 8),
        estimated_karma:      Math.floor(500 + Math.random() * 5000),
        best_post_time:       "Saturday–Sunday 9–12 AM IST or weekday evenings 9–11 PM IST",
        tip:                  "Reddit's algorithm heavily weights early engagement in the first 2 hours. Post when you can actively respond to comments — early replies boost visibility dramatically.",
        breakdown:            scores,
        format_tip:           predType === "text" ? "Text posts with structured formatting (bold headers, bullet points) get 40% more comments than wall-of-text posts." : predType === "image" ? "High-quality images with a clear data story or 'before/after' perform best on Reddit." : predType === "link" ? "Link posts perform best when the title adds clear context — don't just paste a URL." : "Video posts autoplay on Reddit mobile — first 3 seconds must hook immediately.",
      });
      setPredLoading(false);
    }, 1200);
  };

  const handlePost = () => {
    if (!postTitle.trim()) { setPostErr("Add a title first."); return; }
    setPostLoading(true); setPostErr(""); setPostResult(null);
    setTimeout(() => {
      setPostResult({ success:true, message:"Your post has been submitted to Reddit! (Demo mode — real posting requires Reddit API approval)" });
      setPostLoading(false);
    }, 1500);
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif" }}>

      {/* Profile header */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16, background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:16, padding:"14px 18px" }}>
        <div style={{ width:48, height:48, borderRadius:"50%", background:C.reddit, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <RedditIcon size={28} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:800, color:C.ink }}>{profile.name}</div>
          <div style={{ fontSize:11.5, color:C.muted }}>Reddit Creator · {profile.account_age} old account</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{fmt(profile.karma)} karma · {profile.awards} awards received</div>
        </div>
        <div style={{ fontSize:10, color:C.warn, background:`${C.warn}15`, border:`1px solid ${C.warn}44`, borderRadius:8, padding:"4px 8px", flexShrink:0, textAlign:"center" }}>
          <div style={{ fontWeight:800 }}>⚠ Demo</div>
          <div>API pending</div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
        <StatCard icon="⬆️" label="Total Karma"   value={fmt(profile.karma)}               color={C.orange} />
        <StatCard icon="👁️" label="30d Views"     value={fmt(insights.total_views)}         color={C.teal} />
        <StatCard icon="💬" label="30d Comments"  value={fmt(insights.total_comments)}      color="#8b5cf6" />
        <StatCard icon="🏆" label="Awards"        value={fmt(profile.awards)}               color={C.success} />
        <StatCard icon="📊" label="Avg Ratio"     value={`${insights.avg_ratio}%`}          color={C.warn} />
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:16, overflowX:"auto" }}>
        {[
          ["analytics",   "📊 Analytics"],
          ["posts",       "📝 Top Posts"],
          ["viral",       "🔥 Viral AI"],
          ["subreddits",  "🏘️ Subreddits"],
          ["besttime",    "🕐 Best Time"],
          ["benchmark",   "📈 Benchmark"],
          ["publish",     "✍️ Publish"],
        ].map(([key, label]) => (
          <Tab key={key} label={label} active={tab === key} onClick={() => setTab(key)} />
        ))}
      </div>

      {/* ── Analytics Tab ── */}
      {tab === "analytics" && (
        <>
          <Section title="📈 Performance Over Time (Last 30 Days)">
            <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:14 }}>
              {[["upvotes","Upvotes",C.orange],["comments","Comments","#8b5cf6"],["karma","Karma",C.success],["views","Views",C.teal]].map(([k,l,col]) => (
                <button key={k} onClick={() => setChartMetric(k)} style={{ padding:"3px 10px", borderRadius:99, border:`1.5px solid ${chartMetric===k?col:C.hairline}`, background:chartMetric===k?`${col}18`:"transparent", color:chartMetric===k?col:C.muted, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={insights.chart_data} margin={{ top:5, right:10, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.hairline} />
                <XAxis dataKey="date" tick={{ fontSize:9, fill:C.muted }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize:9, fill:C.muted }} tickLine={false} axisLine={false} tickFormatter={fmt} />
                <Tooltip contentStyle={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:10, fontSize:12 }} formatter={v => [fmt(v), chartMetric]} />
                <Line type="monotone" dataKey={chartMetric} stroke={chartMetric==="upvotes"?C.orange:chartMetric==="comments"?"#8b5cf6":chartMetric==="karma"?C.success:C.teal} strokeWidth={2.5} dot={false} activeDot={{ r:5, strokeWidth:0 }} />
              </LineChart>
            </ResponsiveContainer>
          </Section>

          <Section title="📊 30-Day Summary">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[
                { label:"Total Upvotes",  value:fmt(insights.total_upvotes),  icon:"⬆️", col:C.orange },
                { label:"Total Views",    value:fmt(insights.total_views),    icon:"👁️", col:C.teal },
                { label:"Total Comments", value:fmt(insights.total_comments), icon:"💬", col:"#8b5cf6" },
                { label:"Karma Earned",   value:fmt(insights.total_karma),    icon:"✨", col:C.success },
              ].map((s, i) => (
                <div key={i} style={{ background:`${s.col}10`, border:`1px solid ${s.col}33`, borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:22 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize:16, fontWeight:900, color:s.col }}>{s.value}</div>
                    <div style={{ fontSize:10, color:C.muted, fontWeight:600 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <div style={{ background:`${C.warn}12`, border:`1px solid ${C.warn}33`, borderRadius:12, padding:"12px 16px", fontSize:12, color:C.slate, lineHeight:1.6 }}>
            ⚠ <strong>Demo Data</strong> — Connect your Reddit account once Reddit approves SocioMee's API access. Real data will show your actual karma, post performance, and subreddit analytics.
          </div>
        </>
      )}

      {/* ── Top Posts Tab ── */}
      {tab === "posts" && (
        <Section title="📝 Top Performing Posts">
          {demo.posts.map((p, i) => (
            <div key={i} style={{ background:`${C.hairline}`, border:`1px solid ${C.hairline}`, borderRadius:12, padding:"14px 16px", marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8, gap:8 }}>
                <p style={{ fontSize:13, color:C.ink, lineHeight:1.5, flex:1, fontWeight:600 }}>{p.title}</p>
                <span style={{ fontSize:10, fontWeight:700, color:C.muted, background:`${C.orange}15`, padding:"2px 8px", borderRadius:99, flexShrink:0, border:`1px solid ${C.orange}33` }}>
                  {p.type === "Image" ? "🖼️ Image" : p.type === "Video" ? "🎬 Video" : "📝 Text"}
                </span>
              </div>
              <div style={{ fontSize:11, color:C.orange, fontWeight:700, marginBottom:6 }}>{p.sub}</div>
              <div style={{ display:"flex", gap:14, fontSize:11.5, color:C.muted, fontWeight:600, flexWrap:"wrap" }}>
                <span>⬆️ {fmt(p.upvotes)}</span>
                <span>💬 {fmt(p.comments)}</span>
                <span>🏆 {p.awards} awards</span>
                <span>📊 {p.ratio} upvoted</span>
                <span style={{ marginLeft:"auto" }}>{p.date}</span>
              </div>
              <div style={{ marginTop:8, height:4, borderRadius:99, background:C.hairline, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${Math.min((p.upvotes/4000)*100, 100)}%`, background:C.reddit, borderRadius:99 }} />
              </div>
            </div>
          ))}
          <div style={{ background:`${C.orange}10`, border:`1px solid ${C.orange}33`, borderRadius:10, padding:"12px 14px", fontSize:12.5, color:C.slate, lineHeight:1.6, marginTop:8 }}>
            💡 <strong>Reddit Tip:</strong> Posts that provide genuine value with no promotional intent get 10x more upvotes. The Reddit community can smell marketing — be a contributor, not an advertiser.
          </div>
        </Section>
      )}

      {/* ── Viral AI Tab ── */}
      {tab === "viral" && (
        <Section title="🔥 Reddit Viral Content Predictor">
          <p style={{ fontSize:12.5, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
            Enter your post idea and AI predicts how it'll perform with Reddit's brutally honest community.
          </p>

          <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap" }}>
            {[["text","📝 Text"],["image","🖼️ Image"],["link","🔗 Link"],["video","🎬 Video"]].map(([key,label]) => (
              <button key={key} onClick={() => setPredType(key)} style={{ padding:"6px 14px", borderRadius:99, border:`1.5px solid ${predType===key?C.orange:C.hairline}`, background:predType===key?`${C.orange}18`:"transparent", color:predType===key?C.orange:C.muted, fontSize:11.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{label}</button>
            ))}
          </div>

          <div style={{ marginBottom:10 }}>
            <select value={predSub} onChange={e => setPredSub(e.target.value)} style={{ width:"100%", padding:"9px 14px", borderRadius:10, border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:13, fontFamily:"inherit", outline:"none" }}>
              {["r/india","r/IndiaStartups","r/NewTubers","r/ChatGPT","r/content_marketing","r/Entrepreneur","r/technology","r/startups","r/videos"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            <input value={predTopic} onChange={e => setPredTopic(e.target.value)} placeholder="e.g. I built a free AI tool for content creators in India..." style={{ flex:1, padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:13, fontFamily:"inherit", outline:"none" }} onKeyDown={e => e.key === "Enter" && runPrediction()} />
            <button onClick={runPrediction} disabled={predLoading || !predTopic.trim()} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:C.reddit, color:"#fff", fontWeight:800, fontSize:12.5, cursor:predLoading?"not-allowed":"pointer", fontFamily:"inherit", opacity:predLoading?0.7:1 }}>
              {predLoading ? "…" : "Predict"}
            </button>
          </div>

          {prediction && (
            <>
              {prediction.format_tip && (
                <div style={{ background:`${C.teal}12`, border:`1px solid ${C.teal}33`, borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:12.5, color:C.slate }}>
                  📋 <strong>{predType}:</strong> {prediction.format_tip}
                </div>
              )}

              <div style={{ display:"flex", gap:14, alignItems:"center", marginBottom:16, flexWrap:"wrap" }}>
                <ViralRing score={prediction.virality_score} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.ink, marginBottom:8 }}>{prediction.recommendation}</div>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16 }}>
                {[
                  { icon:"⬆️", label:"Est. Upvotes",  val:fmt(prediction.estimated_upvotes) },
                  { icon:"💬", label:"Est. Comments", val:fmt(prediction.estimated_comments) },
                  { icon:"🏆", label:"Est. Awards",   val:fmt(prediction.estimated_awards) },
                  { icon:"✨", label:"Est. Karma",    val:`+${fmt(prediction.estimated_karma)}` },
                  { icon:"📊", label:"Upvote Ratio",  val:`${85 + Math.floor(Math.random()*13)}%` },
                  { icon:"🔥", label:"Viral Score",   val:`${prediction.virality_score}/100` },
                ].map((s, i) => (
                  <div key={i} style={{ background:`${C.orange}0D`, border:`1px solid ${C.hairline}`, borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
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
                      { subject:"Hook",      value:prediction.breakdown.hook_strength },
                      { subject:"Community", value:prediction.breakdown.community_fit },
                      { subject:"Format",    value:prediction.breakdown.content_format },
                      { subject:"Timing",    value:prediction.breakdown.timing_potential },
                    ]}>
                      <PolarGrid stroke={C.hairline} />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize:10, fill:C.muted }} />
                      <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false} />
                      <Radar dataKey="value" stroke={C.orange} fill={C.orange} fillOpacity={0.25} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
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

      {/* ── Subreddits Tab ── */}
      {tab === "subreddits" && (
        <>
          <Section title="🏘️ Your Best Performing Subreddits">
            {demo.subreddits.map((s, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:`1px solid ${C.hairline}` }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:C.orange }}>{s.name}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s.members} members · {s.posts} posts from you</div>
                </div>
                <div style={{ display:"flex", gap:16, alignItems:"center", flexShrink:0 }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:C.ink }}>{fmt(s.karma)}</div>
                    <div style={{ fontSize:9, color:C.muted }}>Karma</div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:C.success }}>{fmt(s.avgUpvotes)}</div>
                    <div style={{ fontSize:9, color:C.muted }}>Avg ⬆️</div>
                  </div>
                  <div style={{ width:36, height:36, borderRadius:"50%", background:`${C.orange}15`, border:`2px solid ${C.orange}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:C.orange }}>
                    {s.relevance}
                  </div>
                </div>
              </div>
            ))}
          </Section>

          <Section title="💡 Subreddit Strategy for Indian Creators">
            {[
              { sub:"r/india",         tip:"Share insights, analysis, or 'I built/learned X' stories. No direct promotion." },
              { sub:"r/IndiaStartups", tip:"Best for startup journey posts, tool launches, and honest failure stories." },
              { sub:"r/NewTubers",     tip:"YouTube creator community — share growth milestones, tips, ask for feedback." },
              { sub:"r/ChatGPT",       tip:"AI tool showcases do extremely well here if genuinely useful." },
            ].map((s, i) => (
              <div key={i} style={{ marginBottom:12, padding:"10px 12px", background:`${C.orange}08`, borderRadius:10, borderLeft:`3px solid ${C.orange}` }}>
                <div style={{ fontSize:12, fontWeight:800, color:C.orange, marginBottom:4 }}>{s.sub}</div>
                <div style={{ fontSize:12, color:C.slate, lineHeight:1.5 }}>{s.tip}</div>
              </div>
            ))}
          </Section>
        </>
      )}

      {/* ── Best Time Tab ── */}
      {tab === "besttime" && (
        <>
          <Section title="🕐 Best Time to Post — Weekly Heatmap">
            <p style={{ fontSize:12, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
              Reddit's Indian audience is most active on weekends and late weekday evenings (IST).
            </p>
            <Heatmap data={demo.bestTimeHeatmap} />
          </Section>

          <Section title="🏆 Top Time Slots for Indian Reddit Creators (IST)">
            {[
              { day:"Saturday",  time:"9:00 AM – 12:00 PM", score:94, reason:"Weekend morning browsing peak" },
              { day:"Sunday",    time:"10:00 AM – 1:00 PM",  score:90, reason:"Highest engagement day of the week" },
              { day:"Wednesday", time:"9:00 PM – 11:00 PM",  score:83, reason:"Mid-week evening relaxation scroll" },
              { day:"Tuesday",   time:"9:00 PM – 11:00 PM",  score:78, reason:"Post-work evening browse" },
              { day:"Thursday",  time:"8:00 PM – 10:00 PM",  score:72, reason:"Pre-weekend excitement builds" },
            ].map((s, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:`1px solid ${C.hairline}` }}>
                <div>
                  <span style={{ fontSize:14, fontWeight:800, color:C.ink }}>#{i+1} {s.day}</span>
                  <span style={{ fontSize:12, color:C.muted, marginLeft:8 }}>{s.time}</span>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s.reason}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:60, background:C.hairline, borderRadius:99, height:6, overflow:"hidden" }}>
                    <div style={{ width:`${s.score}%`, height:"100%", background:C.reddit, borderRadius:99 }} />
                  </div>
                  <span style={{ fontSize:12, fontWeight:800, color:C.orange }}>{s.score}</span>
                </div>
              </div>
            ))}
            <div style={{ marginTop:14, background:`${C.orange}10`, border:`1px solid ${C.orange}30`, borderRadius:10, padding:"10px 14px", fontSize:12.5, color:C.slate, lineHeight:1.6 }}>
              💡 Unlike LinkedIn, Reddit is very active on weekends — Saturday morning is your best slot for maximum visibility.
            </div>
          </Section>
        </>
      )}

      {/* ── Benchmark Tab ── */}
      {tab === "benchmark" && (
        <Section title="📈 How You Compare to Indian Reddit Creators">
          <div style={{ display:"flex", gap:10, marginBottom:16 }}>
            <div style={{ flex:1, background:`${C.orange}12`, border:`1px solid ${C.orange}33`, borderRadius:12, padding:14, textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:900, color:C.orange }}>Rising</div>
              <div style={{ fontSize:11, color:C.muted, fontWeight:700 }}>Your Tier</div>
            </div>
            <div style={{ flex:1, background:`${C.success}12`, border:`1px solid ${C.success}33`, borderRadius:12, padding:14, textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:900, color:C.success }}>Top 28%</div>
              <div style={{ fontSize:11, color:C.muted, fontWeight:700 }}>In Your Niche</div>
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { label:"Avg. Upvotes/Post",    yours:"847",   avg:"312" },
              { label:"Avg. Comments/Post",   yours:"94",    avg:"38" },
              { label:"Avg. Upvote Ratio",    yours:"93.4%", avg:"84.2%" },
              { label:"Karma/Month",          yours:"+2,840",avg:"+890" },
              { label:"Awards Received",      yours:"23",    avg:"6" },
            ].map((row, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${C.hairline}` }}>
                <span style={{ fontSize:12, color:C.ink, fontWeight:600 }}>{row.label}</span>
                <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:C.orange }}>{row.yours}</div>
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
            💡 <strong>Growth Tip:</strong> Indian creators who comment genuinely on 10+ posts before submitting their own get 3x more upvotes due to established account activity. Build karma before promoting.
          </div>
        </Section>
      )}

      {/* ── Publish Tab ── */}
      {tab === "publish" && (
        <Section title="✍️ Submit to Reddit">
          {postResult ? (
            <div style={{ textAlign:"center", padding:"24px 0" }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🎉</div>
              <p style={{ fontSize:14, fontWeight:700, color:C.success, marginBottom:8 }}>{postResult.message}</p>
              <button onClick={() => { setPostResult(null); setPostTitle(""); setPostBody(""); }} style={{ marginTop:12, padding:"8px 20px", borderRadius:99, border:"none", background:C.reddit, color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Post Another</button>
            </div>
          ) : (
            <>
              <p style={{ fontSize:12, color:C.muted, marginBottom:12, lineHeight:1.6 }}>
                💡 <strong>Reddit Rules:</strong> Be genuine. Provide value. Don't self-promote without being a community member first. Read subreddit rules before posting.
              </p>

              <input value={postTitle} onChange={e => setPostTitle(e.target.value.slice(0, 300))} placeholder="Post title (be specific and honest — clickbait gets downvoted)" style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:13, fontFamily:"inherit", outline:"none", marginBottom:10, boxSizing:"border-box" }} />

              <textarea value={postBody} onChange={e => setPostBody(e.target.value.slice(0, 10000))} placeholder="Your post body (optional for link posts). Use formatting: **bold**, bullet points, etc." rows={5}
                style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:13.5, lineHeight:1.7, fontFamily:"inherit", resize:"vertical", outline:"none", boxSizing:"border-box" }} />

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
                <span style={{ fontSize:11.5, color:C.muted, fontWeight:600 }}>{300 - postTitle.length} chars left in title</span>
                <button onClick={handlePost} disabled={postLoading || !postTitle.trim()} style={{ padding:"9px 22px", borderRadius:99, border:"none", background:C.reddit, color:"#fff", fontWeight:800, fontSize:12.5, cursor:postLoading?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:7, opacity:postLoading?0.6:1 }}>
                  <RedditIcon size={14} />
                  {postLoading ? "Submitting…" : "Submit to Reddit"}
                </button>
              </div>
              {postErr && <p style={{ fontSize:12, color:C.danger, fontWeight:600, marginTop:8 }}>⚠ {postErr}</p>}
              <div style={{ marginTop:14, background:`${C.warn}12`, border:`1px solid ${C.warn}33`, borderRadius:10, padding:"10px 14px", fontSize:12, color:C.slate }}>
                ⚠ <strong>Demo mode</strong> — Real Reddit posting requires Reddit API access. We've submitted the request and will enable it once approved.
              </div>
            </>
          )}
        </Section>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}