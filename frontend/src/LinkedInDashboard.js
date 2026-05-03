/**
 * LinkedInDashboard.js — SocioMee LinkedIn Analytics
 * Tabs: Analytics, Posts, Viral AI, Audience, Best Time, Benchmark, Publish
 * Demo data (real API pending LinkedIn approval)
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
    blue:"#60a5fa", blueDark:"#1d4ed8", purpleXlt:"#150d2a",
    teal:"#22d3ee", ink:"#ede8ff", slate:"#c4b5fd",
    muted:"#9d86c8", hairline:"rgba(167,139,250,0.15)",
    glass:"rgba(22,14,42,0.82)", white:"#ede8ff",
    success:"#34d399", warn:"#fbbf24", danger:"#f87171",
    li:"linear-gradient(135deg,#0077b5,#00a0dc)",
    card:"rgba(30,18,55,0.9)",
  } : {
    blue:"#0077b5", blueDark:"#005582", purpleXlt:"#f0f9ff",
    teal:"#0891b2", ink:"#0d0015", slate:"#1e3a5f",
    muted:"#6b8fa3", hairline:"rgba(0,119,181,0.15)",
    glass:"rgba(255,255,255,0.72)", white:"#fff",
    success:"#10b981", warn:"#f59e0b", danger:"#ef4444",
    li:"linear-gradient(135deg,#0077b5,#00a0dc)",
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
      <div style={{ width:36, height:36, borderRadius:"50%", border:`3px solid ${C.blue}22`, borderTopColor:C.blue, animation:"spin 0.7s linear infinite" }} />
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

function LIIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#0077b5">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function StatCard({ icon, label, value, color, sub }) {
  C = getC();
  return (
    <div style={{ background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:16, padding:"16px 18px", flex:1, minWidth:100, textAlign:"center" }}>
      <div style={{ fontSize:20, marginBottom:4 }}>{icon}</div>
      <div style={{ fontSize:21, fontWeight:900, color:color||C.blue, letterSpacing:"-0.5px", lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.8px", marginTop:4 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color:C.success, fontWeight:600, marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function Tab({ label, active, onClick }) {
  C = getC();
  return (
    <button onClick={onClick} style={{ padding:"7px 14px", borderRadius:99, border:`1.5px solid ${active?C.blue:C.hairline}`, background:active?`${C.blue}18`:"transparent", color:active?C.blue:C.muted, fontWeight:700, fontSize:11.5, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", whiteSpace:"nowrap" }}>
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
  const scoreColor = s => s >= 80 ? C.blue : s >= 60 ? C.teal : s >= 40 ? C.warn : s >= 20 ? `${C.muted}88` : C.hairline;
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
        {[C.hairline, `${C.muted}88`, C.warn, C.teal, C.blue].map((col, i) => (
          <div key={i} style={{ width:14, height:14, borderRadius:3, background:col }} />
        ))}
        <span style={{ fontSize:9, color:C.muted }}>High</span>
      </div>
    </div>
  );
}

// ── Demo data generator ──────────────────────────────────────────────
function getDemoData() {
  const chartData = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    chartData.push({
      date: d.toLocaleDateString("en-IN", { day:"numeric", month:"short" }),
      impressions: Math.floor(800 + Math.random() * 1200),
      reach:       Math.floor(500 + Math.random() * 800),
      reactions:   Math.floor(20 + Math.random() * 80),
      comments:    Math.floor(5 + Math.random() * 30),
      shares:      Math.floor(3 + Math.random() * 20),
      clicks:      Math.floor(30 + Math.random() * 150),
    });
  }

  const posts = [
    { title:"How I grew my LinkedIn from 0 to 10K in 6 months 🚀", type:"Article", reactions:342, comments:67, shares:89, impressions:18500, date:"2 days ago" },
    { title:"5 mistakes every fresher makes in their first job", type:"Post", reactions:218, comments:43, shares:56, impressions:12300, date:"5 days ago" },
    { title:"The truth about AI replacing jobs in India", type:"Video", reactions:445, comments:112, shares:134, impressions:28700, date:"1 week ago" },
    { title:"My internship at a startup vs MNC — honest review", type:"Post", reactions:189, comments:38, shares:45, impressions:9800, date:"10 days ago" },
    { title:"How to write a LinkedIn headline that gets recruiters' attention", type:"Article", reactions:267, comments:54, shares:72, impressions:15600, date:"2 weeks ago" },
  ];

  const audience = {
    industries: [
      { name:"Information Technology", pct:34 },
      { name:"Education", pct:18 },
      { name:"Finance", pct:12 },
      { name:"Marketing", pct:10 },
      { name:"Healthcare", pct:8 },
      { name:"Others", pct:18 },
    ],
    seniority: [
      { level:"Student", pct:28 },
      { level:"Entry Level", pct:32 },
      { level:"Mid Level", pct:22 },
      { level:"Senior", pct:12 },
      { level:"Manager+", pct:6 },
    ],
    locations: [
      { city:"Mumbai", pct:22 },
      { city:"Bangalore", pct:19 },
      { city:"Delhi NCR", pct:16 },
      { city:"Hyderabad", pct:11 },
      { city:"Pune", pct:9 },
    ],
    age_groups: [
      { group:"18-24", pct:35 },
      { group:"25-34", pct:42 },
      { group:"35-44", pct:15 },
      { group:"45-54", pct:6 },
      { group:"55+",   pct:2 },
    ],
    gender: { male:58, female:38, other:4 },
  };

  const bestTimeHeatmap = [];
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const hours = [0,3,6,9,12,15,18,21];
  days.forEach(day => {
    hours.forEach(hour => {
      let score = 10;
      if (["Mon","Tue","Wed","Thu"].includes(day)) {
        if (hour === 9 || hour === 12 || hour === 18) score = 60 + Math.floor(Math.random() * 35);
        else if (hour === 6 || hour === 15) score = 35 + Math.floor(Math.random() * 25);
        else score = 5 + Math.floor(Math.random() * 20);
      } else {
        score = 5 + Math.floor(Math.random() * 20);
      }
      bestTimeHeatmap.push({ day, hour, score });
    });
  });

  return { chartData, posts, audience, bestTimeHeatmap };
}

// ════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ════════════════════════════════════════════════════════════════════
export default function LinkedInDashboard({ user, topic = "" }) {
  C = getC();
  const userId = user?.user_id || localStorage.getItem("sociomee_user_id") || "";

  const [tab,         setTab        ] = useState("analytics");
  const [chartMetric, setChartMetric] = useState("impressions");
  const [predTopic,   setPredTopic  ] = useState(topic || "");
  const [predFormat,  setPredFormat ] = useState("post");
  const [predLoading, setPredLoading] = useState(false);
  const [prediction,  setPrediction ] = useState(null);
  const [caption,     setCaption    ] = useState("");
  const [postLoading, setPostLoading] = useState(false);
  const [postResult,  setPostResult ] = useState(null);
  const [postErr,     setPostErr    ] = useState("");

  const demo = getDemoData();

  // Profile stats (demo)
  const profile = {
    name:        user?.name || "Your Name",
    headline:    "Creator · Building SocioMee 🚀",
    followers:   4280,
    connections: 1847,
    profile_views: 312,
    post_impressions: 68400,
    search_appearances: 89,
  };

  const insights = {
    total_impressions:  demo.chartData.reduce((s, d) => s + d.impressions, 0),
    total_reach:        demo.chartData.reduce((s, d) => s + d.reach, 0),
    total_reactions:    demo.chartData.reduce((s, d) => s + d.reactions, 0),
    total_clicks:       demo.chartData.reduce((s, d) => s + d.clicks, 0),
    engagement_rate:    "4.2",
    chart_data:         demo.chartData,
  };

  const runPrediction = () => {
    if (!predTopic.trim()) return;
    setPredLoading(true);
    setTimeout(() => {
      const scores = { hook_strength:72, audience_reach:65, content_format:80, timing_potential:70 };
      const virality = Math.round((scores.hook_strength + scores.audience_reach + scores.content_format + scores.timing_potential) / 4);
      setPrediction({
        virality_score:       virality,
        recommendation:       `This ${predFormat} about "${predTopic}" has strong potential for LinkedIn's professional audience. Use data, personal story, or contrarian take for best results.`,
        estimated_impressions: Math.floor(3000 + Math.random() * 12000),
        estimated_reactions:   Math.floor(80 + Math.random() * 300),
        estimated_comments:    Math.floor(20 + Math.random() * 80),
        estimated_shares:      Math.floor(15 + Math.random() * 60),
        estimated_follows:     Math.floor(10 + Math.random() * 50),
        best_post_time:        "Tuesday–Thursday, 8–10 AM or 5–6 PM IST",
        tip:                   "Start with a hook in the first line — LinkedIn shows only 2-3 lines before 'See more'. Make people stop scrolling.",
        breakdown:             scores,
        format_tip:            predFormat === "post" ? "Text posts with line breaks and emojis get 3x more reach than plain paragraphs." : predFormat === "article" ? "Articles rank on Google and LinkedIn search — great for thought leadership." : predFormat === "video" ? "Native LinkedIn videos autoplay and get 5x more reach than YouTube links." : "Documents/carousels are shared the most on LinkedIn — great for lists and tips.",
      });
      setPredLoading(false);
    }, 1200);
  };

  const handlePost = async () => {
    if (!caption.trim()) { setPostErr("Write something first."); return; }
    setPostLoading(true); setPostErr(""); setPostResult(null);
    setTimeout(() => {
      setPostResult({ success:true, message:"Your post has been shared on LinkedIn! (Demo mode — real posting requires LinkedIn API approval)" });
      setPostLoading(false);
    }, 1500);
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif" }}>

      {/* Profile header */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16, background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:16, padding:"14px 18px" }}>
        <div style={{ width:48, height:48, borderRadius:"50%", background:C.li, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <LIIcon size={28} />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:800, color:C.ink }}>{profile.name}</div>
          <div style={{ fontSize:11.5, color:C.muted }}>{profile.headline}</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{fmt(profile.followers)} followers · {fmt(profile.connections)} connections</div>
        </div>
        <div style={{ fontSize:10, color:C.warn, background:`${C.warn}15`, border:`1px solid ${C.warn}44`, borderRadius:8, padding:"4px 8px", flexShrink:0, textAlign:"center" }}>
          <div style={{ fontWeight:800 }}>⚠ Demo</div>
          <div>API pending</div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
        <StatCard icon="👥" label="Followers"      value={fmt(profile.followers)}            color={C.blue} />
        <StatCard icon="👁️" label="Profile Views"  value={fmt(profile.profile_views)}        color={C.teal} />
        <StatCard icon="📊" label="Impressions"    value={fmt(insights.total_impressions)}    color="#8b5cf6" />
        <StatCard icon="🔍" label="Search Appears" value={fmt(profile.search_appearances)}    color={C.success} />
        <StatCard icon="💫" label="Eng. Rate"      value={`${insights.engagement_rate}%`}     color={C.warn} />
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:16, overflowX:"auto" }}>
        {[
          ["analytics","📊 Analytics"],
          ["posts","📝 Top Posts"],
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
          <Section title="📈 Performance Over Time (Last 30 Days)">
            <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:14 }}>
              {[["impressions","Impressions","#8b5cf6"],["reach","Reach",C.blue],["reactions","Reactions","#ef4444"],["comments","Comments",C.teal],["clicks","Clicks",C.success]].map(([k,l,col]) => (
                <button key={k} onClick={() => setChartMetric(k)} style={{ padding:"3px 10px", borderRadius:99, border:`1.5px solid ${chartMetric===k?col:C.hairline}`, background:chartMetric===k?`${col}18`:"transparent", color:chartMetric===k?col:C.muted, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={insights.chart_data} margin={{ top:5, right:10, left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.hairline} />
                <XAxis dataKey="date" tick={{ fontSize:9, fill:C.muted }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize:9, fill:C.muted }} tickLine={false} axisLine={false} tickFormatter={fmt} />
                <Tooltip contentStyle={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:10, fontSize:12 }} formatter={v => [fmt(v), chartMetric]} />
                <Line type="monotone" dataKey={chartMetric} stroke={chartMetric==="impressions"?"#8b5cf6":chartMetric==="reach"?C.blue:chartMetric==="reactions"?"#ef4444":chartMetric==="comments"?C.teal:C.success} strokeWidth={2.5} dot={false} activeDot={{ r:5, strokeWidth:0 }} />
              </LineChart>
            </ResponsiveContainer>
          </Section>

          <Section title="📊 Weekly Summary">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[
                { label:"Total Impressions", value:fmt(insights.total_impressions), icon:"👁️", col:"#8b5cf6" },
                { label:"Total Reach",       value:fmt(insights.total_reach),       icon:"📡", col:C.blue },
                { label:"Total Reactions",   value:fmt(insights.total_reactions),    icon:"❤️", col:"#ef4444" },
                { label:"Total Clicks",      value:fmt(insights.total_clicks),       icon:"🖱️", col:C.success },
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
            ⚠ <strong>Demo Data</strong> — Connect your LinkedIn account once LinkedIn approves SocioMee's API access. Real data will show your actual impressions, followers, and post performance.
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
                <span style={{ fontSize:10, fontWeight:700, color:C.muted, background:`${C.blue}15`, padding:"2px 8px", borderRadius:99, flexShrink:0, border:`1px solid ${C.blue}33` }}>
                  {p.type === "Video" ? "🎬 Video" : p.type === "Article" ? "📰 Article" : "📝 Post"}
                </span>
              </div>
              <div style={{ display:"flex", gap:14, fontSize:11.5, color:C.muted, fontWeight:600, flexWrap:"wrap" }}>
                <span>❤️ {fmt(p.reactions)}</span>
                <span>💬 {fmt(p.comments)}</span>
                <span>🔁 {fmt(p.shares)}</span>
                <span>👁️ {fmt(p.impressions)}</span>
                <span style={{ marginLeft:"auto" }}>{p.date}</span>
              </div>
              <div style={{ marginTop:8, height:4, borderRadius:99, background:C.hairline, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${Math.min((p.impressions/30000)*100, 100)}%`, background:C.li, borderRadius:99 }} />
              </div>
            </div>
          ))}
          <div style={{ background:`${C.blue}10`, border:`1px solid ${C.blue}33`, borderRadius:10, padding:"12px 14px", fontSize:12.5, color:C.slate, lineHeight:1.6, marginTop:8 }}>
            💡 <strong>LinkedIn Tip:</strong> Posts with personal stories and lessons get 3x more comments than promotional content. Authenticity wins on LinkedIn.
          </div>
        </Section>
      )}

      {/* ── Viral AI Tab ── */}
      {tab === "viral" && (
        <Section title="🔥 LinkedIn Viral Content Predictor">
          <p style={{ fontSize:12.5, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
            Enter your post idea and AI predicts how it'll perform with LinkedIn's professional audience.
          </p>

          <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
            {[["post","📝 Post"],["article","📰 Article"],["video","🎬 Video"],["document","📄 Carousel"]].map(([key,label]) => (
              <button key={key} onClick={() => setPredFormat(key)} style={{ padding:"6px 14px", borderRadius:99, border:`1.5px solid ${predFormat===key?C.blue:C.hairline}`, background:predFormat===key?`${C.blue}18`:"transparent", color:predFormat===key?C.blue:C.muted, fontSize:11.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{label}</button>
            ))}
          </div>

          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            <input value={predTopic} onChange={e => setPredTopic(e.target.value)} placeholder="e.g. How I got 5 job offers in 30 days..." style={{ flex:1, padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:13, fontFamily:"inherit", outline:"none" }} onKeyDown={e => e.key === "Enter" && runPrediction()} />
            <button onClick={runPrediction} disabled={predLoading || !predTopic.trim()} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:C.li, color:"#fff", fontWeight:800, fontSize:12.5, cursor:predLoading?"not-allowed":"pointer", fontFamily:"inherit", opacity:predLoading?0.7:1 }}>
              {predLoading ? "…" : "Predict"}
            </button>
          </div>

          {prediction && (
            <>
              {prediction.format_tip && (
                <div style={{ background:`${C.teal}12`, border:`1px solid ${C.teal}33`, borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:12.5, color:C.slate }}>
                  📋 <strong>{predFormat}:</strong> {prediction.format_tip}
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
                  { icon:"👁️", label:"Est. Impressions", val:fmt(prediction.estimated_impressions) },
                  { icon:"❤️", label:"Est. Reactions",   val:fmt(prediction.estimated_reactions) },
                  { icon:"💬", label:"Est. Comments",    val:fmt(prediction.estimated_comments) },
                  { icon:"🔁", label:"Est. Shares",      val:fmt(prediction.estimated_shares) },
                  { icon:"👥", label:"Est. Follows",     val:`+${fmt(prediction.estimated_follows)}` },
                  { icon:"📊", label:"Eng. Rate",        val:`${((prediction.estimated_reactions / prediction.estimated_impressions) * 100).toFixed(1)}%` },
                ].map((s, i) => (
                  <div key={i} style={{ background:`${C.blue}0D`, border:`1px solid ${C.hairline}`, borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
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
                      <Radar dataKey="value" stroke={C.blue} fill={C.blue} fillOpacity={0.25} strokeWidth={2} />
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

      {/* ── Audience Tab ── */}
      {tab === "audience" && (
        <>
          <Section title="🏢 Top Industries">
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {demo.audience.industries.map((l, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:140, fontSize:12, color:C.ink, fontWeight:600 }}>{l.name}</div>
                  <div style={{ flex:1, background:C.hairline, borderRadius:99, height:8, overflow:"hidden" }}>
                    <div style={{ width:`${l.pct}%`, height:"100%", background:C.li, borderRadius:99 }} />
                  </div>
                  <div style={{ width:30, fontSize:11, color:C.muted, fontWeight:700, textAlign:"right" }}>{l.pct}%</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="📊 Seniority Level">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={demo.audience.seniority} margin={{ top:5, right:10, left:-20, bottom:0 }}>
                <XAxis dataKey="level" tick={{ fontSize:10, fill:C.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:9, fill:C.muted }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:10, fontSize:12 }} formatter={v => [`${v}%`, "Share"]} />
                <Bar dataKey="pct" fill={C.blue} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="📍 Top Locations">
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {demo.audience.locations.map((l, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:80, fontSize:12, color:C.ink, fontWeight:600 }}>{l.city}</div>
                  <div style={{ flex:1, background:C.hairline, borderRadius:99, height:8, overflow:"hidden" }}>
                    <div style={{ width:`${l.pct}%`, height:"100%", background:C.li, borderRadius:99 }} />
                  </div>
                  <div style={{ width:30, fontSize:11, color:C.muted, fontWeight:700, textAlign:"right" }}>{l.pct}%</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="🎂 Age Groups">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={demo.audience.age_groups} margin={{ top:5, right:10, left:-20, bottom:0 }}>
                <XAxis dataKey="group" tick={{ fontSize:11, fill:C.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:9, fill:C.muted }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:10, fontSize:12 }} formatter={v => [`${v}%`, "Share"]} />
                <Bar dataKey="pct" fill={C.teal} radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="👥 Gender Split">
            <div style={{ display:"flex", gap:12 }}>
              {[{label:"Male",val:demo.audience.gender.male,col:C.blue},{label:"Female",val:demo.audience.gender.female,col:"#f472b6"},{label:"Other",val:demo.audience.gender.other,col:C.teal}].map((g, i) => (
                <div key={i} style={{ flex:1, background:`${g.col}12`, border:`1px solid ${g.col}33`, borderRadius:12, padding:14, textAlign:"center" }}>
                  <div style={{ fontSize:22, fontWeight:900, color:g.col }}>{g.val}%</div>
                  <div style={{ fontSize:11, color:C.muted, fontWeight:700 }}>{g.label}</div>
                </div>
              ))}
            </div>
          </Section>

          <p style={{ textAlign:"center", fontSize:10, color:C.muted }}>⚠ Estimated audience data — real demographics load after LinkedIn API access is granted</p>
        </>
      )}

      {/* ── Best Time Tab ── */}
      {tab === "besttime" && (
        <>
          <Section title="🕐 Best Time to Post — Weekly Heatmap">
            <p style={{ fontSize:12, color:C.muted, marginBottom:14, lineHeight:1.6 }}>
              LinkedIn's professional audience is most active on weekday mornings and lunch hours.
            </p>
            <Heatmap data={demo.bestTimeHeatmap} />
          </Section>

          <Section title="🏆 Top Time Slots for Indian LinkedIn (IST)">
            {[
              { day:"Tuesday",   time:"8:00 AM – 10:00 AM", score:95, reason:"Peak professional browsing before work" },
              { day:"Wednesday", time:"12:00 PM – 1:00 PM",  score:88, reason:"Lunch break scrolling peak" },
              { day:"Thursday",  time:"5:00 PM – 6:00 PM",   score:82, reason:"End of workday engagement" },
              { day:"Monday",    time:"9:00 AM – 10:00 AM",  score:76, reason:"Week start motivation content" },
              { day:"Friday",    time:"8:00 AM – 9:00 AM",   score:71, reason:"Friday morning catch-up" },
            ].map((s, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:`1px solid ${C.hairline}` }}>
                <div>
                  <span style={{ fontSize:14, fontWeight:800, color:C.ink }}>#{i+1} {s.day}</span>
                  <span style={{ fontSize:12, color:C.muted, marginLeft:8 }}>{s.time}</span>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{s.reason}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:60, background:C.hairline, borderRadius:99, height:6, overflow:"hidden" }}>
                    <div style={{ width:`${s.score}%`, height:"100%", background:C.li, borderRadius:99 }} />
                  </div>
                  <span style={{ fontSize:12, fontWeight:800, color:C.blue }}>{s.score}</span>
                </div>
              </div>
            ))}
            <div style={{ marginTop:14, background:`${C.blue}10`, border:`1px solid ${C.blue}30`, borderRadius:10, padding:"10px 14px", fontSize:12.5, color:C.slate, lineHeight:1.6 }}>
              💡 Avoid posting on weekends — LinkedIn engagement drops by 70% on Sat–Sun for Indian professionals.
            </div>
          </Section>
        </>
      )}

      {/* ── Benchmark Tab ── */}
      {tab === "benchmark" && (
        <Section title="📈 How You Compare to Indian LinkedIn Creators">
          <div style={{ display:"flex", gap:10, marginBottom:16 }}>
            <div style={{ flex:1, background:`${C.blue}12`, border:`1px solid ${C.blue}33`, borderRadius:12, padding:14, textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:900, color:C.blue }}>Rising</div>
              <div style={{ fontSize:11, color:C.muted, fontWeight:700 }}>Your Tier</div>
            </div>
            <div style={{ flex:1, background:`${C.success}12`, border:`1px solid ${C.success}33`, borderRadius:12, padding:14, textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:900, color:C.success }}>Top 35%</div>
              <div style={{ fontSize:11, color:C.muted, fontWeight:700 }}>In Your Niche</div>
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {[
              { label:"Avg. Impressions/Post", yours:"1,240",  avg:"890" },
              { label:"Avg. Reactions/Post",   yours:"68",     avg:"45" },
              { label:"Avg. Comments/Post",    yours:"22",     avg:"14" },
              { label:"Follower Growth/Month", yours:"+124",   avg:"+67" },
              { label:"Engagement Rate",       yours:"4.2%",   avg:"3.1%" },
            ].map((row, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${C.hairline}` }}>
                <span style={{ fontSize:12, color:C.ink, fontWeight:600 }}>{row.label}</span>
                <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:13, fontWeight:800, color:C.blue }}>{row.yours}</div>
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
            💡 <strong>Growth Tip:</strong> Indian LinkedIn creators who post 3-4 times per week and engage in comments grow 2.5x faster. Comment on 5 posts before you publish yours.
          </div>
        </Section>
      )}

      {/* ── Publish Tab ── */}
      {tab === "publish" && (
        <Section title="✍️ Publish to LinkedIn">
          {postResult ? (
            <div style={{ textAlign:"center", padding:"24px 0" }}>
              <div style={{ fontSize:40, marginBottom:8 }}>🎉</div>
              <p style={{ fontSize:14, fontWeight:700, color:C.success, marginBottom:8 }}>{postResult.message}</p>
              <button onClick={() => { setPostResult(null); setCaption(""); }} style={{ marginTop:12, padding:"8px 20px", borderRadius:99, border:"none", background:C.li, color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>Post Another</button>
            </div>
          ) : (
            <>
              <p style={{ fontSize:12, color:C.muted, marginBottom:12, lineHeight:1.6 }}>
                💡 <strong>LinkedIn Post Tips:</strong> Start with a hook. Use line breaks. Add 3-5 relevant hashtags at the end. Keep it under 1300 chars for full visibility without "See more".
              </p>
              <textarea value={caption} onChange={e => setCaption(e.target.value.slice(0, 3000))} placeholder="What do you want to share with your LinkedIn network? Start with a strong hook..." rows={6}
                style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:13.5, lineHeight:1.7, fontFamily:"inherit", resize:"vertical", outline:"none", boxSizing:"border-box" }} />
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:8 }}>
                <span style={{ fontSize:11.5, color:caption.length > 2500 ? C.danger : C.muted, fontWeight:600 }}>{3000 - caption.length} chars left</span>
                <button onClick={handlePost} disabled={postLoading || !caption.trim()} style={{ padding:"9px 22px", borderRadius:99, border:"none", background:C.li, color:"#fff", fontWeight:800, fontSize:12.5, cursor:postLoading?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:7, opacity:postLoading?0.6:1 }}>
                  <LIIcon size={14} />
                  {postLoading ? "Posting…" : "Post to LinkedIn"}
                </button>
              </div>
              {postErr && <p style={{ fontSize:12, color:C.danger, fontWeight:600, marginTop:8 }}>⚠ {postErr}</p>}
              <div style={{ marginTop:14, background:`${C.warn}12`, border:`1px solid ${C.warn}33`, borderRadius:10, padding:"10px 14px", fontSize:12, color:C.slate }}>
                ⚠ <strong>Demo mode</strong> — Real LinkedIn posting requires LinkedIn API access. We've submitted the request and will enable it once approved.
              </div>
            </>
          )}
        </Section>
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}