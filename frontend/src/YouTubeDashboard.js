/**
 * YouTubeDashboard.js — SocioMee YouTube Analytics Dashboard
 * Tabs: Analytics | Auto-Upload | Festival Calendar | Growth Milestones
 */

import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Pie, Cell, PieChart as RechartsPie,
  Tooltip, ResponsiveContainer,
} from "recharts";
import YouTubeUpload from "./YouTubeUpload";
import VideoPerformance from "./VideoPerformance";

const BASE = "https://sociomee.in/api";
const YT_LANG = () => localStorage.getItem("sociomee_lang") || "en";
const yt = (hi, mr, en, ta, bn) => YT_LANG()==="hi"?hi:YT_LANG()==="mr"?mr:YT_LANG()==="ta"?(ta||en):YT_LANG()==="bn"?(bn||en):en;
const FESTIVAL_NAMES = {
  "Eid ul-Fitr":{"hi":"ईद उल-फितर","mr":"ईद उल-फितर"},
  "Holi":{"hi":"होली","mr":"होळी"},
  "Ram Navami":{"hi":"राम नवमी","mr":"राम नवमी"},
  "Akshaya Tritiya":{"hi":"अक्षय तृतीया","mr":"अक्षय तृतीया"},
  "Mother's Day":{"hi":"मदर्स डे","mr":"मदर्स डे"},
  "Bakra Eid":{"hi":"बकरा ईद","mr":"बकरा ईद"},
  "Independence Day":{"hi":"स्वतंत्रता दिवस","mr":"स्वातंत्र्य दिन"},
  "Raksha Bandhan":{"hi":"रक्षाबंधन","mr":"रक्षाबंधन"},
  "Janmashtami":{"hi":"जन्माष्टमी","mr":"जन्माष्टमी"},
  "Ganesh Chaturthi":{"hi":"गणेश चतुर्थी","mr":"गणेश चतुर्थी"},
  "Navratri":{"hi":"नवरात्रि","mr":"नवरात्र"},
  "Dussehra":{"hi":"दशहरा","mr":"दसरा"},
  "Karva Chauth":{"hi":"करवा चौथ","mr":"करवा चौथ"},
  "Dhanteras":{"hi":"धनतेरस","mr":"धनत्रयोदशी"},
  "Diwali":{"hi":"दीवाली","mr":"दिवाळी"},
  "Bhai Dooj":{"hi":"भाई दूज","mr":"भाऊबीज"},
  "Chhath Puja":{"hi":"छठ पूजा","mr":"छठ पूजा"},
  "Guru Nanak Jayanti":{"hi":"गुरु नानक जयंती","mr":"गुरु नानक जयंती"},
  "Christmas":{"hi":"क्रिसमस","mr":"नाताळ"},
  "New Year":{"hi":"नया साल","mr":"नवीन वर्ष"},
  "Republic Day":{"hi":"गणतंत्र दिवस","mr":"प्रजासत्ताक दिन"},
  "Valentine's Day":{"hi":"वैलेंटाइन डे","mr":"वॅलेंटाईन डे"},
  "Rath Yatra":{"hi":"रथ यात्रा","mr":"रथयात्रा"},
  "Muharram/Ashura":{"hi":"मुहर्रम/आशुरा","mr":"मुहर्रम/आशुरा"},
  "Muharram/Ashura (tentative)":{"hi":"मुहर्रम/आशुरा (अनुमानित)","mr":"मुहर्रम/आशुरा (अंदाजे)"},
  "Milad un-Nabi (tentative)":{"hi":"मिलाद उन-नबी (अनुमानित)","mr":"मिलाद उन-नबी (अंदाजे)"},
  "Milad un-Nabi":{"hi":"मिलाद उन-नबी","mr":"मिलाद उन-नबी"},
  "Onam":{"hi":"ओणम","mr":"ओणम"},
  "Mahatma Gandhi Jayanti":{"hi":"महात्मा गांधी जयंती","mr":"महात्मा गांधी जयंती"},
  "Janmashtami (Smarta)":{"hi":"जन्माष्टमी (स्मार्त)","mr":"जन्माष्टमी (स्मार्त)"},
};
const fName = (name) => {
  if (FESTIVAL_NAMES[name]?.[YT_LANG()]) return FESTIVAL_NAMES[name][YT_LANG()];
  // Try matching base name without suffix like "(tentative)" or "(Smarta)"
  const base = name.replace(/\s*\(.*?\)\s*/g, "").trim();
  if (FESTIVAL_NAMES[base]?.[YT_LANG()]) return FESTIVAL_NAMES[base][YT_LANG()] + " " + (name.match(/\(.*?\)/)?.[0]||"");
  return name;
};

// Inject mobile styles
if (typeof document !== "undefined") { document.getElementById("yt-mobile-styles")?.remove();
  const s = document.createElement("style");
  s.id = "yt-mobile-styles";
  s.textContent = `
    /* Traffic donut mobile */
    @media (max-width: 600px) {
      .yt-traffic-wrap { flex-direction: column !important; align-items: center !important; } @media (max-width: 600px) { .yt-geo-row { grid-template-columns: 1fr !important; } }
      .yt-traffic-text { min-width: unset !important; width: 100% !important; max-width: 100% !important; }
      .yt-traffic-text span { font-size: 9px !important; }
    }
    /* Video donut horizontal scroll */
    .video-donut-scroll {
      display: flex !important;
      gap: 8px !important;
      overflow-x: auto !important;
      overflow-y: visible !important;
      -webkit-overflow-scrolling: touch !important;
      scroll-snap-type: x mandatory !important;
      padding-bottom: 6px !important;
      margin-bottom: 10px !important;
      scrollbar-width: thin !important;
      scrollbar-color: rgba(124,58,237,0.3) transparent !important;
    }
    .video-donut-scroll::-webkit-scrollbar { height: 3px !important; }
    .video-donut-scroll::-webkit-scrollbar-track { background: transparent !important; }
    .video-donut-scroll::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3) !important; border-radius: 99px !important; }
    .video-donut-scroll > * { flex-shrink: 0 !important; scroll-snap-align: start !important; }
    /* Mini stat cards */
    @media (max-width: 600px) {
      .yt-mini-stat-grid { grid-template-columns: repeat(2,1fr) !important; gap:6px !important; }
    }
    /* Video donuts mobile scroll */
    @media (max-width: 600px) {
      .yt-video-donuts { display: flex !important; overflow-x: auto !important; scroll-snap-type: x mandatory; scrollbar-width: none !important; -ms-overflow-style: none !important; gap: 8px !important; padding-bottom: 4px; }
      .yt-video-donuts::-webkit-scrollbar { display: none; }
      .yt-video-donuts > * { flex-shrink: 0 !important; width: 130px !important; scroll-snap-align: start; }
      /* Smaller channel analytics donuts on mobile */
      .yt-analytics-donuts svg { width: 120px !important; height: 120px !important; }
    }
    @media (max-width: 600px) {
      /* Channel header */
      .yt-channel-header { padding: 10px 12px !important; gap: 10px !important; }
      .yt-channel-header img { width: 38px !important; height: 38px !important; }
      .yt-channel-title { font-size: 13px !important; }
      .yt-channel-sub { font-size: 10px !important; }

      /* Tabs - compact scrollable */
      .yt-tabs { gap: 4px !important; padding-bottom: 2px !important; overflow-x: auto !important; scrollbar-width: none !important; -ms-overflow-style: none !important; }
      .yt-tabs button { padding: 6px 10px !important; font-size: 10px !important; border-radius: 99px !important; } .yt-video-tabs button { padding: 3px 6px !important; font-size: 8px !important; } .yt-score-label { display:none !important; } .yt-date { font-size:9px !important; }

      /* Stat cards - 2x2 grid */
      .yt-stat-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 6px !important; }
      .yt-stat-card { padding: 8px 8px !important; border-radius: 10px !important; }
      .yt-stat-value { font-size: 14px !important; }
      .yt-stat-label { font-size: 7px !important; }
      .yt-stat-icon { font-size: 12px !important; }

      /* Video cards */
      .yt-video-row { padding: 8px 10px !important; gap: 8px !important; }
      .yt-video-thumb { width: 56px !important; height: 32px !important; }
      .yt-video-title { font-size: 11px !important; }
      .yt-video-meta { font-size: 9px !important; }
      .yt-score-badge { width: 30px !important; height: 30px !important; font-size: 10px !important; }

      /* Optimize summary */
      .yt-opt-summary { grid-template-columns: 1fr 1fr !important; gap: 6px !important; }
      .yt-opt-card { padding: 8px 6px !important; border-radius: 10px !important; }

      /* Section headers */
      .yt-section-title { font-size: 10px !important; }

      /* Chart container */
      .yt-chart-wrap { padding: 12px !important; }

      /* Disconnect button */
      .yt-disconnect-btn { font-size: 10px !important; padding: 4px 10px !important; }
    }
  `;
  document.head.appendChild(s);
}


function getThemeC() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  return dark ? {
    rose:"#ff6eb5", purple:"#a78bfa", purpleXlt:"rgba(124,58,237,0.08)",
    teal:"#22d3ee", ink:"rgba(255,255,255,0.9)", slate:"rgba(255,255,255,0.6)",
    muted:"rgba(255,255,255,0.4)", hairline:"rgba(255,255,255,0.08)",
    glass:"rgba(255,255,255,0.04)", white:"#ffffff",
    success:"#34d399", warn:"#fbbf24", danger:"#f87171", yt:"#ff0000",
  } : {
    rose:"#ff3d8f", purple:"#7c3aed", purpleXlt:"rgba(124,58,237,0.08)",
    teal:"#0891b2", ink:"rgba(255,255,255,0.9)", slate:"rgba(255,255,255,0.6)",
    muted:"rgba(255,255,255,0.4)", hairline:"rgba(255,255,255,0.08)",
    glass:"rgba(255,255,255,0.04)", white:"#ffffff",
    success:"#10b981", warn:"#f59e0b", danger:"#ef4444", yt:"#ff0000",
  };
}

let C = getThemeC();

function fmt(n) {
  if (!n && n !== 0) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

// ── INDIAN FESTIVAL DATA ─────────────────────────────────────────────
function getUpcomingFestivals() {
  const now = new Date();
  const y = now.getFullYear();
  const festivals = [
    { name:"Eid ul-Fitr",nameHi:"ईद उल-फितर",nameMr:"ईद उल-फितर",       date:"2026-03-31", emoji:"🌙", color:"#00c853", topics:["Eid special vlog","Eid outfit ideas","Eid recipes","Eid Mubarak wishes","Eid celebration"] },
    { name:"Holi",nameHi:"होली",nameMr:"होळी",              date:"2026-03-30", emoji:"🎨", color:"#ff6b35", topics:["Holi celebration vlog","Holi makeup tutorial","Holi food recipes","Holi prank","Holi party ideas"] },
    { name:"Ram Navami",nameHi:"राम नवमी",nameMr:"राम नवमी",        date:"2026-04-17", emoji:"🙏", color:"#ff9500", topics:["Ram Navami special","Bhajan compilation","Ram Navami recipes","Ram katha"] },
    { name:"Akshaya Tritiya",nameHi:"अक्षय तृतीया",nameMr:"अक्षय तृतीया",   date:"2026-04-28", emoji:"🪙", color:"#ffd700", topics:["Gold buying guide India","Akshaya Tritiya tips","Best gold investment 2026","Dhanteras vs Akshaya Tritiya"] },
    { name:"Mother's Day",nameHi:"मदर्स डे",nameMr:"मदर्स डे",      date:"2026-05-11", emoji:"💐", color:"#ff69b4", topics:["Mother's Day special vlog","Gift ideas for mom","Mom surprise video","Mother's Day cooking","Emotional mom video"] },
    { name:"Bakra Eid",nameHi:"बकरा ईद",nameMr:"बकरा ईद",         date:"2026-06-08", emoji:"🌙", color:"#00c853", topics:["Eid ul-Adha vlog","Eid recipes","Bakra Eid celebration","Eid traditions India"] },
    { name:"Independence Day",nameHi:"स्वतंत्रता दिवस",nameMr:"स्वातंत्र्य दिन",  date:`${y}-08-15`, emoji:"🇮🇳", color:"#ff9500", topics:["Independence Day special","India 78 years","Desh bhakti songs","Freedom fighters story","15 August vlog"] },
    { name:"Raksha Bandhan",nameHi:"रक्षाबंधन",nameMr:"रक्षाबंधन",    date:"2026-08-09", emoji:"🪢", color:"#ff6b9d", topics:["Rakhi gift ideas 2026","Raksha Bandhan vlog","DIY Rakhi making","Brother sister bond","Rakhi celebration"] },
    { name:"Janmashtami",nameHi:"जन्माष्टमी",nameMr:"जन्माष्टमी",       date:"2026-08-16", emoji:"🦚", color:"#4caf50", topics:["Janmashtami special","Krishna bhajan","Dahi Handi vlog","Janmashtami decoration","Lord Krishna stories"] },
    { name:"Ganesh Chaturthi",nameHi:"गणेश चतुर्थी",nameMr:"गणेश चतुर्थी",  date:"2026-08-23", emoji:"🐘", color:"#ff6b35", topics:["Ganesh Chaturthi decoration","Eco-friendly Ganpati","Modak recipe","Ganpati visarjan","10 day celebration"] },
    { name:"Navratri",nameHi:"नवरात्रि",nameMr:"नवरात्र",          date:"2026-09-24", emoji:"🪔", color:"#ff4081", topics:["Navratri garba dance","Navratri outfit ideas","Navratri fasting recipes","Dandiya night vlog","9 days special"] },
    { name:"Dussehra",nameHi:"दशहरा",nameMr:"दसरा",          date:"2026-10-03", emoji:"🏹", color:"#ff6b35", topics:["Dussehra celebration vlog","Ravana dahan","Good over evil","Dussehra special","Ramlila highlights"] },
    { name:"Karva Chauth",nameHi:"करवा चौथ",nameMr:"करवा चौथ",      date:"2026-10-17", emoji:"🌕", color:"#ffd700", topics:["Karva Chauth makeup","Karva Chauth outfit","Thali decoration ideas","Karva Chauth vlog","Sargi recipes"] },
    { name:"Dhanteras",nameHi:"धनतेरस",nameMr:"धनत्रयोदशी",         date:"2026-10-28", emoji:"🪙", color:"#ffd700", topics:["Dhanteras shopping guide","What to buy on Dhanteras","Gold vs silver Dhanteras","Dhanteras puja vidhi"] },
    { name:"Diwali",nameHi:"दीवाली",nameMr:"दिवाळी",            date:"2026-10-29", emoji:"🪔", color:"#ff9500", topics:["Diwali decoration ideas","Diwali outfit 2026","Diwali sweets recipe","Diwali vlog","Diwali rangoli","Diwali puja"] },
    { name:"Bhai Dooj",nameHi:"भाई दूज",nameMr:"भाऊबीज",         date:"2026-10-31", emoji:"❤️", color:"#e91e63", topics:["Bhai Dooj gift ideas","Brother sister vlog","Bhai Dooj celebration","Tilak ceremony"] },
    { name:"Chhath Puja",nameHi:"छठ पूजा",nameMr:"छठ पूजा",       date:"2026-11-02", emoji:"☀️", color:"#ff9500", topics:["Chhath Puja vlog","Thekua recipe","Arghya ghat celebration","Chhath Puja traditions","Sunrise prayer"] },
    { name:"Guru Nanak Jayanti",nameHi:"गुरु नानक जयंती",nameMr:"गुरु नानक जयंती",date:"2026-11-14", emoji:"🙏", color:"#ff9500", topics:["Gurpurab special","Gurbani shabads","Langar recipes","Sikh traditions","Waheguru shabad"] },
    { name:"Christmas",nameHi:"क्रिसमस",nameMr:"नाताळ",         date:`${y}-12-25`, emoji:"🎄", color:"#00c853", topics:["Christmas decoration India","Christmas gift ideas","Christmas recipes","Christmas vlog","Secret Santa ideas"] },
    { name:"New Year",nameHi:"नया साल",nameMr:"नवीन वर्ष",          date:`${y+1}-01-01`, emoji:"🎆", color:"#7c3aed", topics:["New Year resolutions 2027","New Year party ideas","Best of 2026 recap","New Year countdown vlog","Goals 2027"] },
    { name:"Republic Day",nameHi:"गणतंत्र दिवस",nameMr:"प्रजासत्ताक दिन",      date:`${y}-01-26`, emoji:"🇮🇳", color:"#ff9500", topics:["Republic Day special","India constitution facts","Patriotic songs","26 January parade","Republic Day speech"] },
    { name:"Valentine's Day",nameHi:"वैलेंटाइन डे",nameMr:"वॅलेंटाईन डे",   date:`${y}-02-14`, emoji:"❤️", color:"#e91e63", topics:["Valentine's Day gifts India","Valentine's vlog","Date ideas India","Valentine's makeup","Couple goals"] },
  ];
  return festivals.map(f => {
    const d = new Date(f.date);
    const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    return { ...f, daysUntil: diff };
  }).filter(f => f.daysUntil >= -3).sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 10);
}

// ── GROWTH MILESTONES CALCULATOR ─────────────────────────────────────
function calcMilestones(currentSubs, dailyGrowth) {
  const milestones = [1000, 5000, 10000, 50000, 100000, 500000, 1000000, 10000000];
  return milestones
    .filter(m => m > currentSubs)
    .slice(0, 6)
    .map(m => {
      const subsNeeded = m - currentSubs;
      const daysNeeded = dailyGrowth > 0 ? Math.ceil(subsNeeded / dailyGrowth) : null;
      const months = daysNeeded ? (daysNeeded / 30).toFixed(1) : null;
      const eta = daysNeeded ? new Date(Date.now() + daysNeeded * 86400000).toLocaleDateString("en-IN", { month:"short", year:"numeric" }) : null;
      return { milestone:m, subsNeeded, daysNeeded, months, eta };
    });
}

// ── COMPONENTS ────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", backdropFilter:"blur(16px)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"16px", padding:"18px 20px", flex:1, minWidth:"120px" }}>
      <div style={{ fontSize:"22px", marginBottom:"6px" }}>{icon}</div>
      <div style={{ fontSize:"22px", fontWeight:"900", color:color||C.purple, letterSpacing:"-1px", lineHeight:1 }}>{value}</div>
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

function ConnectYouTube({ userId }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const handleConnect = async () => {
    setLoading(true); setErr("");
    try {
      const res  = await fetch(`${BASE}/youtube/auth-url?redirect_uri=${encodeURIComponent(window.location.origin + "/youtube/callback")}`);
      const data = await res.json();
      if (data?.url) { sessionStorage.setItem("yt_connect_user_id", userId); window.location.href = data.url; }
    } catch { setErr("Failed to start OAuth."); }
    finally { setLoading(false); }
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"52px 24px", gap:"20px" }}>
      <div style={{ width:"72px", height:"72px", borderRadius:"18px", background:"#ff0000", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 12px 32px #ff000044" }}>
        <svg viewBox="0 0 24 24" width="40" height="40" fill="white"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
      </div>
      <div style={{ textAlign:"center" }}>
        <h2 style={{ fontSize:"20px", fontWeight:"900", color:C.ink, marginBottom:"8px" }}>Connect Your YouTube Channel</h2>
        <p style={{ fontSize:"13px", color:C.muted, lineHeight:1.6, maxWidth:"340px" }}>Get real analytics, SocioMee AI growth predictions, festival content calendar and more.</p>
      </div>
      {err && <p style={{ color:C.danger, fontSize:"12.5px", fontWeight:"600" }}>⚠ {err}</p>}
      <button onClick={handleConnect} disabled={loading} style={{ padding:"14px 32px", borderRadius:"14px", border:"none", background:"linear-gradient(135deg,#ff0000,#cc0000)", color:"white", fontWeight:"800", fontSize:"15px", cursor:loading?"not-allowed":"pointer", fontFamily:"inherit", boxShadow:"0 12px 32px #ff000044" }}>
        {loading ? "Redirecting…" : "▶ Connect YouTube Channel"}
      </button>
    </div>
  );
}

function AnalyticsChart({ data, metric, color }) {
  const label = metric === "views" ? yt("व्यूज़","व्ह्यूज","Views") : "Subscribers";
  const formatted = (data || []).map(d => ({ ...d, date: d.date?.slice(5) }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted} margin={{ top:5, right:10, left:-20, bottom:0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" hide={true} />
        <YAxis tick={{ fontSize:10, fill:C.muted }} tickLine={false} axisLine={false} tickFormatter={fmt} />
        <Tooltip contentStyle={{ background:"rgba(10,8,20,0.98)", border:`1px solid ${C.hairline}`, borderRadius:"10px", fontSize:"12px" }} formatter={(val) => [fmt(val), label]} />
        <Line type="monotone" dataKey={metric} stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r:5, strokeWidth:0 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function GrowthPrediction({ prediction, topic }) {
  if (!prediction) return null;
  const { estimated_views, estimated_subs, virality_score, recommendation, next_milestone, best_upload_time, best_thumbnail_tip, growth_pct } = prediction;
  const col = virality_score >= 70 ? C.success : virality_score >= 50 ? C.warn : C.muted;
  return (
    <div style={{ background:"rgba(124,58,237,0.06)", border:`1.5px solid ${C.purple}33`, borderRadius:"16px", padding:"20px", marginBottom:"20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"14px" }}>
        <div>
          
          <div style={{ fontSize:"14px", fontWeight:"700", color:C.ink }}>If you upload: <span style={{ color:C.purple }}>"{topic}"</span></div>
        </div>
        <div style={{ textAlign:"center", flexShrink:0 }}>
          <div style={{ fontSize:"24px", fontWeight:"900", color:col, lineHeight:1 }}>{virality_score}</div>
          <div style={{ fontSize:"9px", fontWeight:"800", color:C.muted, textTransform:"uppercase" }}>Virality</div>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"14px" }}>
        {[
          { icon:"👁️", label:"Est. Views",    val:fmt(estimated_views) },
          { icon:"➕", label:"Est. New Subs", val:`+${fmt(estimated_subs)}` },
          { icon:"📈", label:"Growth",         val:`+${growth_pct}%` },
        ].map((s, i) => (
          <div key={i} style={{ background:C.glass, borderRadius:"10px", padding:"10px", textAlign:"center" }}>
            <div style={{ fontSize:"18px" }}>{s.icon}</div>
            <div style={{ fontSize:"16px", fontWeight:"900", color:C.ink }}>{s.val}</div>
            <div style={{ fontSize:"10px", color:C.muted, fontWeight:"600" }}>{s.label}</div>
          </div>
        ))}
      </div>
      {next_milestone && (
        <div style={{ background:`${C.success}12`, border:`1px solid ${C.success}33`, borderRadius:"10px", padding:"10px 14px", marginBottom:"12px", fontSize:"13px", color:C.slate }}>
          🏆 SocioMee predicts: you'll hit <strong style={{ color:C.success }}>{fmt(next_milestone.target)} subscribers</strong> in approx. <strong>{next_milestone.months} month{next_milestone.months !== 1 ? "s" : ""}</strong>
        </div>
      )}
      <div style={{ fontSize:"12.5px", color:C.slate, lineHeight:1.6 }}>
        <div style={{ marginBottom:"4px" }}>💡 <strong>Strategy:</strong> {recommendation}</div>
        <div style={{ marginBottom:"4px" }}>🕐 <strong>Best time to upload:</strong> {best_upload_time}</div>
        <div>🖼️ <strong>Thumbnail tip:</strong> {best_thumbnail_tip}</div>
      </div>
    </div>
  );
}


function VideoDonut({ label, center, sub, data }) {
  const [active, setActive] = useState(null);
  const filtered = data.filter(x=>x.value>0);
  const highlighted = active !== null ? filtered[active] : null;
  const PURPLE = ["#7c3aed","#9333ea","#a78bfa","#6d28d9","#c4b5fd"];
  const FADED = "rgba(124,58,237,0.18)";
  const coloredData = filtered.map((x,i)=>({...x}));
  return (
    <div style={{textAlign:"center",background:"rgba(124,58,237,0.06)",borderRadius:"14px",padding:"10px 8px",border:"1px solid rgba(124,58,237,0.15)",display:"flex",flexDirection:"column",alignItems:"center",minWidth:"140px",maxWidth:"140px",flex:"0 0 140px"}}>
      <div style={{fontSize:"9px",fontWeight:"800",color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"10px"}}>{label}</div>
      <div style={{position:"relative"}}>
        <RechartsPie width={130} height={130}>
          <Pie data={coloredData} cx={65} cy={65} innerRadius={40} outerRadius={58} paddingAngle={3} dataKey="value" strokeWidth={0}
            onMouseEnter={(_,i)=>setActive(i)} onMouseLeave={()=>setActive(null)} style={{cursor:"pointer"}}>
            {coloredData.map((x,xi)=><Cell key={xi} fill={x.color} opacity={active===null||active===xi?1:0.15}/>)}
          </Pie>
        </RechartsPie>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center",pointerEvents:"none",width:"56px"}}>
          {highlighted ? (
            <div style={{fontSize:"11px",fontWeight:"800",color:"#fff",lineHeight:1.3}}>{highlighted.name}</div>
          ) : (<>
            <div style={{fontSize:"15px",fontWeight:"900",color:"#fff",lineHeight:1}}>{center}</div>
            <div style={{fontSize:"8px",color:"rgba(255,255,255,0.4)",marginTop:"2px"}}>{sub}</div>
          </>)}
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"center",gap:"3px",marginTop:"4px",flexWrap:"wrap",maxWidth:"110px"}}>
        {coloredData.map((x,xi)=>(
          <div key={xi} style={{display:"flex",alignItems:"center",gap:"2px",opacity:active===null||active===xi?1:0.4}}>
            <div style={{width:"4px",height:"4px",borderRadius:"50%",background:x.color,flexShrink:0}}/>
            <span style={{fontSize:"6px",color:"rgba(255,255,255,0.5)",fontWeight:"600",whiteSpace:"nowrap"}}>{x.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopVideos({ videos }) {
  C = getThemeC();
  const [expanded, setExpanded] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  if (!videos?.length) return <p style={{ color:C.muted, fontSize:"13px", textAlign:"center", padding:"20px" }}>No videos found.</p>;
  const counts = { all: videos.length, video: videos.filter(v=>v.video_type==="video").length, short: videos.filter(v=>v.video_type==="short").length, live: videos.filter(v=>v.video_type==="live").length };
  const filtered = typeFilter==="all" ? videos : videos.filter(v=>v.video_type===typeFilter);
  const maxViews = Math.max(...videos.map(v => v.views));
  function getEng(v) { return v.views ? ((v.likes + v.comments) / v.views * 100).toFixed(2) : "0.00"; }
  function getScore(v) {
    const eng = parseFloat(getEng(v));
    const vr = v.views / maxViews;
    return Math.min(Math.round(vr*50 + Math.min(eng,10)/10*30 + (v.comments>100?20:v.comments/5)), 100);
  }
  function scoreColor(s) { return s>=75?"#22c55e":s>=50?"#f59e0b":"#ef4444"; }
  function aiTip(v, i) {
    const eng = parseFloat(getEng(v));
    if (i===0) return "⚡ Your best performer — replicate this format immediately for guaranteed growth";
    if (eng>5) return "🔥 High engagement — your audience loves this style, double down on it";
    if (eng<1) return "📌 Low engagement — add stronger hook in first 5 seconds and a clear CTA";
    if (v.comments > v.likes*0.1) return "💬 Great comment ratio — ask more questions to boost discussion";
    if (i<=2) return "✅ Top performer — use similar title structure and thumbnail style again";
    return "📈 Upload a follow-up on this topic — audience showed interest, strike while hot";
  }
  return (
    <div>
      <div style={{ display:"flex", gap:"6px", marginBottom:"12px" }}>
        {[["all","All"],["video","Videos"],["short","Shorts"],["live","Lives"]].map(([v,l])=>(
          <button key={v} onClick={()=>{ setTypeFilter(v); setExpanded(null); }}
            style={{ padding:"6px 14px", borderRadius:"99px", border:`1px solid ${typeFilter===v?C.purple:C.hairline}`, background:typeFilter===v?`${C.purple}18`:"transparent", color:typeFilter===v?C.purple:C.muted, fontSize:"11px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>
            {l} {counts[v]>0?`(${counts[v]})`:""}
          </button>
        ))}
      </div>
      {filtered.length===0 && <p style={{ color:C.muted, fontSize:"13px", textAlign:"center", padding:"20px" }}>No {typeFilter}s found.</p>}
    <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
      {filtered.map((v, i) => {
        const eng = getEng(v); const sc = getScore(v); const scCol = scoreColor(sc); const isOpen = expanded===i;
        return (
          <div key={i} style={{ background:C.glass, border:`1px solid ${isOpen?C.purple+"55":C.hairline}`, borderRadius:"14px", transition:"border-color 0.2s", overflow:"visible" }}>
            <div onClick={()=>setExpanded(isOpen?null:i)} style={{ padding:"10px 12px", cursor:"pointer" }}>
              <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"7px" }}>
                <div style={{ width:"18px", height:"18px", borderRadius:"4px", background:`${C.purple}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"8px", fontWeight:"900", color:C.purple, flexShrink:0 }}>#{i+1}</div>
                {v.thumbnail && <img src={v.thumbnail} alt="" style={{ width:"56px", height:"32px", borderRadius:"5px", objectFit:"cover", flexShrink:0 }} />}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"11.5px", fontWeight:"700", color:C.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.title}</div>
                  <div style={{ fontSize:"9px", color:C.muted, marginTop:"1px" }}>{v.published_at}</div>
                </div>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" style={{ flexShrink:0, transform:isOpen?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"8px", paddingLeft:"26px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"4px", flexShrink:0 }}>
                  <div style={{ width:"26px", height:"26px", borderRadius:"50%", border:`2px solid ${scCol}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9px", fontWeight:"900", color:scCol, background:`${scCol}12` }}>{sc}</div>
                  <div style={{ fontSize:"7px", color:C.muted }}>SCORE</div>
                </div>
                <div style={{ flex:1, height:"3px", background:C.hairline, borderRadius:"99px", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${Math.round(v.views/maxViews*100)}%`, background:"#7c3aed", borderRadius:"99px", boxShadow:"0 0 8px rgba(124,58,237,0.6)" }}/>
                </div>
                <div style={{ fontSize:"12px", fontWeight:"800", color:C.ink, flexShrink:0 }}>{fmt(v.views)} <span style={{ fontSize:"8px", color:C.muted, fontWeight:"400" }}>views</span></div>
              </div>
            </div>
            {isOpen && (
              <div style={{ borderTop:`1px solid ${C.hairline}`, padding:"14px", overflow:"visible" }}>
                <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"12px" }}>
                  {/* Video Analytics Donuts */}
                  {(()=>{
                    const likeRate = v.views>0?+(v.likes/v.views*100).toFixed(2):0;
                    const commentRate = v.views>0?+(v.comments/v.views*100).toFixed(2):0;
                    const engRate = +eng;
                    const perfScore = Math.round(v.views/maxViews*100);
                    const aiTip = engRate>5?"🔥 Top performer! Replicate this video format immediately.":engRate>2?"💡 Good engagement. Add stronger end screen CTA to boost subs.":likeRate>5?"👍 Good like ratio but low comments. Ask questions in video.":"📌 Low engagement. Improve thumbnail & hook in first 5 seconds.";
                    
                    const donuts = [
                      {
                        label:"Like vs View",
                        center:`${likeRate}%`,
                        sub:"Like Rate",
                        data:[
                          {name:"Liked",value:v.likes||0,color:"#7c3aed"},
                          {name:"Not liked",value:Math.max(0,v.views-v.likes),color:"rgba(124,58,237,0.25)"},
                        ]
                      },
                      {
                        label:"Engagement",
                        center:`${engRate}%`,
                        sub:"Eng. Rate",
                        data:[
                          {name:"Likes",value:v.likes||0,color:"#7c3aed"},
                          {name:"Comments",value:(v.comments||0)*5,color:"#9333ea"},
                          {name:"Passive",value:Math.max(0,v.views-v.likes-(v.comments||0)*5),color:"rgba(124,58,237,0.25)"},
                        ]
                      },
                      {
                        label:"Performance",
                        center:`${perfScore}%`,
                        sub:"vs Best",
                        data:[
                          {name:"This video",value:v.views||0,color:"#7c3aed"},
                          {name:"Best video",value:Math.max(0,maxViews-v.views),color:"rgba(255,255,255,0.06)"},
                        ]
                      },
                      {
                        label:"Comment Rate",
                        center:`${commentRate}%`,
                        sub:"Comment/View",
                        data:[
                          {name:"Commented",value:v.comments||0,color:"#a78bfa"},
                          {name:"Silent",value:Math.max(0,v.views-v.comments),color:"rgba(124,58,237,0.25)"},
                        ]
                      },
                    ];

                    return (
                      <div style={{marginBottom:"16px",padding:"16px",background:"rgba(124,58,237,0.04)",borderRadius:"14px",border:"1px solid rgba(124,58,237,0.12)",overflow:"visible"}}>
                        <div className="yt-video-donuts" style={{display:"flex",flexDirection:"row",gap:"8px",overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"thin",scrollbarColor:"rgba(124,58,237,0.4) transparent",paddingBottom:"8px",marginBottom:"16px"}}>
                          {donuts.map((d,di)=>(
                            <div key={di} className="yt-analytics-donuts" style={{flex:"0 0 140px",minWidth:"140px"}}><VideoDonut label={d.label} center={d.center} sub={d.sub} data={d.data} color={d.data[0]?.color||"#7c3aed"}/></div>
                          ))}
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px",marginBottom:"10px",width:"100%"}}>
                          {[
                            {label:"Views",val:fmt(v.views),color:"#7c3aed"},
                            {label:"Likes",val:fmt(v.likes),color:"#9333ea"},
                            {label:"Comments",val:fmt(v.comments||0),color:"#a78bfa"},
                            {label:"Eng. Rate",val:`${eng}%`,color:"#c4b5fd"},
                          ].map(({label,val,color})=>(
                            <div key={label} style={{background:"rgba(124,58,237,0.08)",borderRadius:"8px",padding:"8px",textAlign:"center"}}>
                              <div style={{fontSize:"9px",color:"rgba(255,255,255,0.4)",marginBottom:"3px"}}>{label}</div>
                              <div style={{fontSize:"13px",fontWeight:"800",color}}>{val}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{fontSize:"11px",color:"rgba(255,255,255,0.55)",background:"rgba(124,58,237,0.08)",borderRadius:"8px",padding:"8px 12px",borderLeft:"2px solid #7c3aed"}}>✦ {aiTip}</div>
                      </div>
                    );
                  })()}
                  {[].map(({icon,label,val,color})=>(
                    <div key={label} style={{ flex:"1 1 70px", background:`${color}10`, border:`1px solid ${color}25`, borderRadius:"10px", padding:"8px 6px", textAlign:"center" }}>
                      <div style={{ fontSize:"15px" }}>{icon}</div>
                      <div style={{ fontSize:"12px", fontWeight:"800", color, marginTop:"2px" }}>{val}</div>
                      <div style={{ fontSize:"9px", color:C.muted }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom:"12px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:"10px", color:C.muted, marginBottom:"4px" }}>
                    <span>Performance vs your best video</span><span>{Math.round(v.views/maxViews*100)}%</span>
                  </div>
                  <div style={{ height:"6px", background:C.hairline, borderRadius:"99px", overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${v.views/maxViews*100}%`, background:"#7c3aed", borderRadius:"99px", boxShadow:"0 0 8px rgba(124,58,237,0.6)" }}/>
                  </div>
                </div>
                <div style={{ background:`${C.purple}10`, border:`1px solid ${C.purple}25`, borderRadius:"10px", padding:"10px 12px", display:"flex", gap:"8px", alignItems:"flex-start", marginBottom:"12px" }}>
                  <span style={{ fontSize:"16px", flexShrink:0 }}>🤖</span>
                  <div>
                    <div style={{ fontSize:"9px", fontWeight:"800", color:C.purple, letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:"3px" }}>SocioMee AI Insight</div>
                    <div style={{ fontSize:"12px", color:C.ink, lineHeight:1.5 }}>{aiTip(v,i)}</div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:"6px" }}>
                  <a href={v.url} target="_blank" rel="noreferrer" style={{ padding:"5px 12px", borderRadius:"7px", background:C.purple, color:"#fff", fontSize:"10px", fontWeight:"700", textDecoration:"none", whiteSpace:"nowrap" }}>▶ Watch</a>
                  <button onClick={(e)=>{e.stopPropagation();navigator.clipboard.writeText(v.url);}} style={{ padding:"5px 12px", borderRadius:"7px", background:"transparent", border:`1px solid ${C.hairline}`, color:C.muted, fontSize:"10px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>🔗 Copy</button>
                  <button onClick={(e)=>{e.stopPropagation();if(navigator.share){navigator.share({title:v.title,url:v.url});}else{navigator.clipboard.writeText(v.url);}}} style={{ padding:"5px 12px", borderRadius:"7px", background:"transparent", border:`1px solid ${C.hairline}`, color:C.muted, fontSize:"10px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>↗ Share</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
    </div>
  );
}

// ── FESTIVAL CALENDAR TAB ────────────────────────────────────────────
function FestivalCalendar() {
  C = getThemeC();
  const [selected, setSelected] = useState(null);
  const [festivals, setFestivals] = useState([]);
  const [festLoading, setFestLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/festivals/upcoming`)
      .then(r => r.json())
      .then(d => { setFestivals(Array.isArray(d)?d:[]); setFestLoading(false); })
      .catch(() => { setFestivals([]); setFestLoading(false); });
  }, []);

  if (festLoading) return <div style={{ textAlign:"center", padding:"40px", color:C.muted }}>Loading festivals…</div>;

  const urgencyColor = (days) => {
    if (days <= 0) return C.success;
    if (days <= 7) return C.danger;
    if (days <= 30) return C.warn;
    return C.purple;
  };

  const urgencyLabel = (days) => {
    if (days < 0) return "Happening now!";
    if (days === 0) return "Today! 🔥";
    if (days === 1) return "Tomorrow!";
    if (days <= 7) return `${days} days left`;
    if (days <= 30) return `${days} ${yt("दिन बाकी","दिवस बाकी","days away")}`;
    return `${days} ${yt("दिन बाकी","दिवस बाकी","days away")}`;
  };
  return (
    <div>

      {/* Festival cards */}
      <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
        {(Array.isArray(festivals)?festivals:[]).map((f, i) => {
          const isSelected = selected === i;
          const col = urgencyColor(f.daysUntil);
          return (
            <div key={i} onClick={() => setSelected(isSelected ? null : i)}
              style={{ background:C.glass, border:`1.5px solid ${isSelected ? col : C.hairline}`, borderRadius:"14px", padding:"14px 16px", cursor:"pointer", transition:"all 0.2s", boxShadow:isSelected?`0 4px 20px ${col}22`:"none" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                  <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:`${f.color}20`, border:`1.5px solid ${f.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>{f.emoji}</div>
                  <div>
                    <div style={{ fontSize:"14px", fontWeight:"800", color:C.ink }}>{fName(f.name)}</div>
                    <div style={{ fontSize:"11px", color:C.muted, marginTop:"2px" }}>{new Date(f.date).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}</div>
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:"12px", fontWeight:"900", color:col, padding:"4px 10px", background:`${col}18`, borderRadius:"99px", border:`1px solid ${col}33` }}>{urgencyLabel(f.daysUntil)}</div>
                </div>
              </div>

              {isSelected && (
                <div style={{ marginTop:"14px", paddingTop:"14px", borderTop:`1px solid ${C.hairline}` }}>
                  <div style={{ fontSize:"11px", fontWeight:"800", color:C.muted, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"10px" }}>{yt("✦ SocioMee अनुशंसित टॉपिक","✦ SocioMee शिफारस केलेले टॉपिक","✦ SocioMee Recommended Topics")}</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                    {f.topics.map((t, j) => (
                      <div key={j} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:`${C.purple}08`, border:`1px solid ${C.purple}22`, borderRadius:"10px", padding:"8px 12px" }}>
                        <span style={{ fontSize:"12.5px", color:C.ink, fontWeight:"600" }}>📹 {t}</span>
                        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(t); }}
                          style={{ fontSize:"10px", padding:"3px 8px", borderRadius:"6px", border:`1px solid ${C.hairline}`, background:"transparent", color:C.muted, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>{yt("कॉपी","कॉपी","Copy")}</button>
                      </div>
                    ))}
                  </div>
                  {f.daysUntil > 0 && f.daysUntil <= 14 && (
                    <div style={{ marginTop:"10px", background:`${C.danger}12`, border:`1px solid ${C.danger}33`, borderRadius:"10px", padding:"10px 12px", fontSize:"12px", color:C.slate }}>
                      ⚡ <strong>Upload NOW</strong> — Festival is in {f.daysUntil} days. Videos need 5-7 days to rank. Don't wait!
                    </div>
                  )}
                  {f.daysUntil > 14 && f.daysUntil <= 30 && (
                    <div style={{ marginTop:"10px", background:`${C.warn}12`, border:`1px solid ${C.warn}33`, borderRadius:"10px", padding:"10px 12px", fontSize:"12px", color:C.slate }}>
                      📅 <strong>Start planning</strong> — Upload in the next {f.daysUntil - 7} days for best results.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop:"16px", background:`${C.teal}10`, border:`1px solid ${C.teal}30`, borderRadius:"12px", padding:"12px 16px", fontSize:"12px", color:C.slate, lineHeight:1.6 }}>
        💡 <strong>SocioMee Tip:</strong> Indian festival videos get 3-8x more views than regular content. The best window is 7-10 days before the festival. Thumbnail should have the festival name in Hindi/English.
      </div>
    </div>
  );
}

// ── GROWTH MILESTONES TAB ─────────────────────────────────────────────
function GrowthMilestones({ channel, analytics }) {
  C = getThemeC();
  const currentSubs = channel?.subscribers || 0;
  const subsGained  = analytics?.total_subs || 0;
  const dailyGrowth = subsGained > 0 ? subsGained / 30 : 1;
  const milestones  = calcMilestones(currentSubs, dailyGrowth);

  const badges = [
    { min:0,       max:999,     label:"Newcomer",      emoji:"🌱", color:"#8b6b9a" },
    { min:1000,    max:4999,    label:"Rising Creator", emoji:"⭐", color:"#ff9500" },
    { min:5000,    max:9999,    label:"Growing Star",   emoji:"🌟", color:"#ffd700" },
    { min:10000,   max:49999,   label:"Verified Creator",emoji:"✅", color:"#00c853" },
    { min:50000,   max:99999,   label:"Influencer",     emoji:"🔥", color:"#ff6b35" },
    { min:100000,  max:499999,  label:"Silver Creator", emoji:"🥈", color:"#9e9e9e" },
    { min:500000,  max:999999,  label:"Gold Creator",   emoji:"🥇", color:"#ffd700" },
    { min:1000000, max:Infinity,label:"Diamond Creator",emoji:"💎", color:"#7c3aed" },
  ];

  const currentBadge = badges.find(b => currentSubs >= b.min && currentSubs <= b.max) || badges[0];
  const nextBadge = badges.find(b => b.min > currentSubs);

  // Growth scenarios
  const scenarios = [
    { label:yt("वर्तमान गति","सध्याची गती","Current pace"), multiplier:1, color:C.muted },
    { label:yt("2x अपलोड/सप्ताह","2x अपलोड/आठवडा","2x uploads/week"), multiplier:2, color:C.warn },
    { label:yt("ट्रेंडिंग + त्योहार","ट्रेंडिंग + सण","Trending topics + Festivals"), multiplier:3.5, color:C.success },
    { label:yt("SocioMee AI रणनीति","SocioMee AI धोरण","SocioMee AI strategy"), multiplier:5, color:C.purple },
  ];

  return (
    <div>
      {/* Current status */}
      <div style={{ background:`linear-gradient(135deg,${currentBadge.color}22,${currentBadge.color}08)`, border:`1.5px solid ${currentBadge.color}44`, borderRadius:"16px", padding:"18px", marginBottom:"16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
          <div style={{ fontSize:"40px" }}>{currentBadge.emoji}</div>
          <div>
            <div style={{ fontSize:"11px", fontWeight:"900", letterSpacing:"1.5px", textTransform:"uppercase", color:C.muted, marginBottom:"4px" }}>{yt("वर्तमान स्थिति","सद्य स्थिती","Current Status")}</div>
            <div style={{ fontSize:"20px", fontWeight:"900", color:currentBadge.color }}>{currentBadge.label}</div>
            <div style={{ fontSize:"12px", color:C.muted, marginTop:"2px" }}>{fmt(currentSubs)} {yt("सब्सक्राइबर","सदस्य","subscribers")} · Growing ~{Math.round(dailyGrowth)}/day</div>
          </div>
        </div>
        {nextBadge && (
          <div style={{ marginTop:"12px", paddingTop:"12px", borderTop:`1px solid ${C.hairline}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
              <span style={{ fontSize:"12px", color:C.muted }}>Next: <strong style={{ color:nextBadge.color }}>{nextBadge.emoji} {nextBadge.label}</strong> at {fmt(nextBadge.min)} subs</span>
              <span style={{ fontSize:"12px", fontWeight:"800", color:nextBadge.color }}>{fmt(nextBadge.min - currentSubs)} to go</span>
            </div>
            <div style={{ height:"8px", background:C.hairline, borderRadius:"99px", overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${Math.min(((currentSubs - (nextBadge.min === 1000 ? 0 : badges[badges.indexOf(currentBadge)-1]?.min||0)) / (nextBadge.min - (badges[badges.indexOf(currentBadge)]?.min||0))) * 100, 100)}%`, background:`linear-gradient(90deg,${currentBadge.color},${nextBadge.color})`, borderRadius:"99px", transition:"width 1s ease" }} />
            </div>
          </div>
        )}
      </div>

      {/* Milestones */}
      <div style={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:"16px", padding:"18px", marginBottom:"16px" }}>
        <div style={{ fontSize:"11px", fontWeight:"900", letterSpacing:"1.2px", textTransform:"uppercase", color:C.muted, marginBottom:"16px" }}>{yt("✦ SocioMee माइलस्टोन भविष्यवाणी","✦ SocioMee माइलस्टोन अंदाज","✦ SocioMee Milestone Predictions")}</div>
        {milestones.length === 0 ? (
          <div style={{ textAlign:"center", padding:"20px", color:C.success, fontWeight:"700", fontSize:"16px" }}>🎉 Congratulations! You've hit 10M+ subscribers!</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {milestones.map((m, i) => {
              const badge = badges.find(b => m.milestone >= b.min && m.milestone <= b.max) || badges[0];
              return (
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", background:`${badge.color}08`, border:`1px solid ${badge.color}22`, borderRadius:"12px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <span style={{ fontSize:"20px" }}>{badge.emoji}</span>
                    <div>
                      <div style={{ fontSize:"14px", fontWeight:"900", color:badge.color }}>{fmt(m.milestone)}</div>
                      <div style={{ fontSize:"11px", color:C.muted }}>{badge.label} · {fmt(m.subsNeeded)} {yt("सब्स चाहिए","सदस्य हवेत","subs needed")}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    {m.eta ? (
                      <>
                        <div style={{ fontSize:"13px", fontWeight:"800", color:C.ink }}>{m.eta}</div>
                        <div style={{ fontSize:"10px", color:C.muted }}>{m.months} {yt("महीने बाकी","महिने बाकी","months away")}</div>
                      </>
                    ) : (
                      <div style={{ fontSize:"12px", color:C.muted }}>Keep growing!</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Growth scenarios */}
      <div style={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:"16px", padding:"18px", marginBottom:"16px" }}>
        <div style={{ fontSize:"11px", fontWeight:"900", letterSpacing:"1.2px", textTransform:"uppercase", color:C.muted, marginBottom:"16px" }}>{yt("🚀 क्या होगा अगर? — 100K के लिए विकास","🚀 काय होईल? — 100K साठी वाढ","🚀 What If? — Growth Scenarios for 100K")}</div>
        {scenarios.map((s, i) => {
          const effectiveGrowth = dailyGrowth * s.multiplier;
          const subsNeeded = Math.max(0, 100000 - currentSubs);
          const days = effectiveGrowth > 0 ? Math.ceil(subsNeeded / effectiveGrowth) : null;
          const months = days ? (days / 30).toFixed(1) : null;
          const pct = Math.min((1 / (i + 1)) * 100, 100);
          return (
            <div key={i} style={{ marginBottom:"14px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
                <span style={{ fontSize:"12.5px", fontWeight:"700", color:C.ink }}>{s.label}</span>
                <span style={{ fontSize:"12px", fontWeight:"800", color:s.color }}>
                  {currentSubs >= 100000 ? "✅ Achieved!" : months ? `~${months} months` : "∞"}
                </span>
              </div>
              <div style={{ height:"6px", background:C.hairline, borderRadius:"99px", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${currentSubs >= 100000 ? 100 : Math.min((currentSubs / 100000) * 100 + pct * 0.3, 95)}%`, background:`linear-gradient(90deg,${s.color}88,${s.color})`, borderRadius:"99px" }} />
              </div>
            </div>
          );
        })}
        <div style={{ background:`${C.purple}10`, border:`1px solid ${C.purple}22`, borderRadius:"10px", padding:"10px 12px", marginTop:"8px", fontSize:"12px", color:C.slate }}>
          ✦ <strong>SocioMee AI Strategy</strong> includes: festival content timing + trending topic detection + optimal upload schedule + AI-generated SEO titles
        </div>
      </div>

      {/* Tips */}
      <div style={{ background:`${C.success}10`, border:`1px solid ${C.success}30`, borderRadius:"12px", padding:"14px 16px" }}>
        <div style={{ fontSize:"11px", fontWeight:"900", color:C.success, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"10px" }}>✦ SocioMee Growth Tips for Indian Creators</div>
        {[
          "Upload during Indian festivals — 3-8x more views guaranteed",
          "Post at 7-9 PM IST on weekdays for maximum Indian audience reach",
          "Use Hindi + English (Hinglish) titles — 40% more CTR in India",
          "Thumbnail with your face + bold text gets 2x more clicks",
          "Respond to all comments in first 2 hours to boost algorithm",
          "Collab with creators in your niche with similar subscriber count",
        ].map((tip, i) => (
          <div key={i} style={{ display:"flex", gap:"8px", fontSize:"12.5px", color:C.slate, marginBottom:"6px" }}>
            <span style={{ color:C.success, flexShrink:0 }}>→</span><span>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────

// ── SEO TAB ──────────────────────────────────────────────────────────
function SEOTab({ userId, channel, C }) {
  const [keyword,    setKeyword   ] = useState("");
  const [loading,    setLoading   ] = useState(false);
  const [results,    setResults   ] = useState(null);
  const [videoUrl,   setVideoUrl  ] = useState("");
  const [videoScore, setVideoScore] = useState(null);
  const [scoreLoad,  setScoreLoad ] = useState(false);
  const BASE = "https://sociomee.in/api";
const YT_LANG = () => localStorage.getItem("sociomee_lang") || "en";
const yt = (hi, mr, en, ta, bn) => YT_LANG()==="hi"?hi:YT_LANG()==="mr"?mr:YT_LANG()==="ta"?(ta||en):YT_LANG()==="bn"?(bn||en):en;
const FESTIVAL_NAMES = {
  "Eid ul-Fitr":{"hi":"ईद उल-फितर","mr":"ईद उल-फितर"},
  "Holi":{"hi":"होली","mr":"होळी"},
  "Ram Navami":{"hi":"राम नवमी","mr":"राम नवमी"},
  "Akshaya Tritiya":{"hi":"अक्षय तृतीया","mr":"अक्षय तृतीया"},
  "Mother's Day":{"hi":"मदर्स डे","mr":"मदर्स डे"},
  "Bakra Eid":{"hi":"बकरा ईद","mr":"बकरा ईद"},
  "Independence Day":{"hi":"स्वतंत्रता दिवस","mr":"स्वातंत्र्य दिन"},
  "Raksha Bandhan":{"hi":"रक्षाबंधन","mr":"रक्षाबंधन"},
  "Janmashtami":{"hi":"जन्माष्टमी","mr":"जन्माष्टमी"},
  "Ganesh Chaturthi":{"hi":"गणेश चतुर्थी","mr":"गणेश चतुर्थी"},
  "Navratri":{"hi":"नवरात्रि","mr":"नवरात्र"},
  "Dussehra":{"hi":"दशहरा","mr":"दसरा"},
  "Karva Chauth":{"hi":"करवा चौथ","mr":"करवा चौथ"},
  "Dhanteras":{"hi":"धनतेरस","mr":"धनत्रयोदशी"},
  "Diwali":{"hi":"दीवाली","mr":"दिवाळी"},
  "Bhai Dooj":{"hi":"भाई दूज","mr":"भाऊबीज"},
  "Chhath Puja":{"hi":"छठ पूजा","mr":"छठ पूजा"},
  "Guru Nanak Jayanti":{"hi":"गुरु नानक जयंती","mr":"गुरु नानक जयंती"},
  "Christmas":{"hi":"क्रिसमस","mr":"नाताळ"},
  "New Year":{"hi":"नया साल","mr":"नवीन वर्ष"},
  "Republic Day":{"hi":"गणतंत्र दिवस","mr":"प्रजासत्ताक दिन"},
  "Valentine's Day":{"hi":"वैलेंटाइन डे","mr":"वॅलेंटाईन डे"},
  "Rath Yatra":{"hi":"रथ यात्रा","mr":"रथयात्रा"},
  "Muharram/Ashura":{"hi":"मुहर्रम/आशुरा","mr":"मुहर्रम/आशुरा"},
  "Muharram/Ashura (tentative)":{"hi":"मुहर्रम/आशुरा (अनुमानित)","mr":"मुहर्रम/आशुरा (अंदाजे)"},
  "Milad un-Nabi (tentative)":{"hi":"मिलाद उन-नबी (अनुमानित)","mr":"मिलाद उन-नबी (अंदाजे)"},
  "Milad un-Nabi":{"hi":"मिलाद उन-नबी","mr":"मिलाद उन-नबी"},
  "Onam":{"hi":"ओणम","mr":"ओणम"},
  "Mahatma Gandhi Jayanti":{"hi":"महात्मा गांधी जयंती","mr":"महात्मा गांधी जयंती"},
  "Janmashtami (Smarta)":{"hi":"जन्माष्टमी (स्मार्त)","mr":"जन्माष्टमी (स्मार्त)"},
};

// Inject mobile styles



  const analyzeKeyword = async () => {
    if (!keyword.trim()) return;
    setLoading(true); setResults(null);
    await new Promise(r => setTimeout(r, 800));
    setResults({
      keyword,
      search_volume: Math.floor(Math.random() * 500000) + 50000,
      competition: ["Low","Medium","High"][Math.floor(Math.random()*3)],
      score: Math.floor(Math.random() * 35) + 60,
      related: [`${keyword} tutorial`,`${keyword} for beginners`,`best ${keyword} 2026`,`${keyword} tips`,`${keyword} India`,`${keyword} Hindi`,`${keyword} course`,`how to ${keyword}`],
      titles: [`${keyword} Complete Guide 2026 | Beginner to Pro`,`मैंने ${keyword} से ₹1 लाख कमाए | Real Story`,`${keyword} Tutorial in Hindi | Step by Step`,`Why ${keyword} is Changing Everything in India`,`${keyword} Secrets Nobody Tells You`],
      tags: [keyword,`${keyword} tutorial`,`${keyword} hindi`,`${keyword} 2026`,"india","creator","tips","beginners"],
      best_time: "Tuesday & Thursday, 7-9 PM IST",
      shorts_potential: Math.floor(Math.random()*30)+65,
      is_mock: true,
    });
    setLoading(false);
  };

  const analyzeVideo = async () => {
    if (!videoUrl.trim()) return;
    setScoreLoad(true); setVideoScore(null);
    await new Promise(r => setTimeout(r, 800));
    setVideoScore({
      overall_score: Math.floor(Math.random()*30)+60,
      title_score: Math.floor(Math.random()*30)+60,
      description_score: Math.floor(Math.random()*30)+55,
      tags_score: Math.floor(Math.random()*30)+58,
      thumbnail_score: Math.floor(Math.random()*30)+65,
      suggestions: ["Add keywords in first 100 chars of description","Use 10-15 relevant tags","Add timestamps to improve watch time","Add end screen elements","Pin a comment with key links"],
      is_mock: true,
    });
    setScoreLoad(false);
  };

  const sc = n => n>=75?"#34d399":n>=50?"#fbbf24":"#f87171";

  return (
    <div>
      <div style={{background:C.glass,border:`1px solid ${C.hairline}`,borderRadius:16,padding:20,marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:800,letterSpacing:"1.2px",textTransform:"uppercase",color:C.muted,marginBottom:14}}>🔍 Keyword Research</div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
          <input value={keyword} onChange={e=>{const v=e.target.value;const blocked=["porn","sex","nude","fuck","shit","chut","lund","gaand","madarchod","behenchod"];if(!blocked.some(w=>v.toLowerCase().includes(w)))setKeyword(v);}} onKeyDown={e=>e.key==="Enter"&&analyzeKeyword()} placeholder={yt("कीवर्ड डालें जैसे skincare, crypto...","कीवर्ड टाका जसे skincare, crypto...","Enter keyword e.g. skincare, crypto...")} style={{width:"100%",boxSizing:"border-box",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${C.hairline}`,background:"rgba(255,255,255,0.06)",color:C.ink,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
          <button onClick={analyzeKeyword} disabled={loading} style={{padding:"9px 16px",borderRadius:"99px",border:"1.5px solid rgba(124,58,237,0.5)",background:"rgba(124,58,237,0.12)",backdropFilter:"blur(16px)",color:"#fff",fontWeight:800,fontSize:12,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:"0 0 12px rgba(124,58,237,0.3)",transition:"all 0.2s",opacity:loading?0.6:1}}>{loading?"...":yt("🔍 कीवर्ड विश्लेषण","🔍 कीवर्ड विश्लेषण","🔍 Analyze Keyword")}</button>
        </div>
        {results && (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,padding:"12px 16px",background:"rgba(255,0,0,0.08)",borderRadius:12,border:"1px solid rgba(255,0,0,0.2)"}}>
              <div style={{textAlign:"center",minWidth:60}}>
                <div style={{fontSize:28,fontWeight:900,color:sc(results.score)}}>{results.score}</div>
                <div style={{fontSize:10,color:C.muted}}>SEO Score</div>
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:12,color:C.ink,fontWeight:700}}>{results.keyword}</span>
                  <span style={{fontSize:12,color:C.muted}}>{results.competition} Competition</span>
                </div>
                <div style={{height:6,borderRadius:99,background:"rgba(255,255,255,0.1)"}}>
                  <div style={{height:"100%",width:`${results.score}%`,borderRadius:99,background:`linear-gradient(90deg,${sc(results.score)}88,${sc(results.score)})`}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                  <span style={{fontSize:11,color:C.muted}}>📊 {results.search_volume?.toLocaleString()} searches/mo</span>
                  <span style={{fontSize:11,color:"#34d399"}}>📱 Shorts: {results.shorts_potential}%</span>
                </div>
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:800,color:C.muted,marginBottom:8}}>🎯 AI-GENERATED TITLES</div>
              {results.titles?.map((t,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"rgba(255,255,255,0.04)",borderRadius:8,marginBottom:6,border:`1px solid ${C.hairline}`}}>
                  <span style={{fontSize:12,color:C.ink,flex:1}}>{t}</span>
                  <button onClick={()=>navigator.clipboard.writeText(t)} style={{padding:"3px 8px",borderRadius:6,border:`1px solid ${C.hairline}`,background:"transparent",color:C.muted,fontSize:10,cursor:"pointer",fontFamily:"inherit",marginLeft:8,flexShrink:0}}>{yt("कॉपी","कॉपी","Copy")}</button>
                </div>
              ))}
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:800,color:C.muted,marginBottom:8}}>🔗 RELATED KEYWORDS</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {results.related?.map((r,i)=>(
                  <span key={i} onClick={()=>setKeyword(r)} style={{padding:"4px 10px",borderRadius:99,background:"rgba(255,0,0,0.1)",border:"1px solid rgba(255,0,0,0.2)",color:"#ff6b6b",fontSize:12,cursor:"pointer"}}>{r}</span>
                ))}
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:800,color:C.muted,marginBottom:8}}>🏷️ RECOMMENDED TAGS</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {results.tags?.map((t,i)=>(
                  <span key={i} style={{padding:"4px 10px",borderRadius:99,background:"rgba(255,255,255,0.06)",border:`1px solid ${C.hairline}`,color:C.slate,fontSize:12}}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{padding:"10px 14px",background:"rgba(34,211,238,0.08)",borderRadius:10,border:"1px solid rgba(34,211,238,0.2)",fontSize:12,color:C.teal}}>🕐 Best time to post: <strong>{results.best_time}</strong></div>
            {results.is_mock&&<p style={{fontSize:10,color:C.muted,marginTop:8,textAlign:"center"}}>⚠ AI-generated data</p>}
          </div>
        )}
      </div>
      <div style={{background:C.glass,border:`1px solid ${C.hairline}`,borderRadius:16,padding:20}}>
        <div style={{fontSize:11,fontWeight:800,letterSpacing:"1.2px",textTransform:"uppercase",color:C.muted,marginBottom:14}}>📊 Video SEO Score</div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <input value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} placeholder={yt("YouTube वीडियो URL पेस्ट करें...","YouTube व्हिडिओ URL पेस्ट करा...","Paste YouTube video URL...")} style={{flex:1,padding:"10px 14px",borderRadius:10,border:`1.5px solid ${C.hairline}`,background:"rgba(255,255,255,0.06)",color:C.ink,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
          <button onClick={analyzeVideo} disabled={scoreLoad} style={{padding:"9px 16px",borderRadius:"99px",border:"1.5px solid rgba(124,58,237,0.5)",background:"rgba(124,58,237,0.12)",backdropFilter:"blur(16px)",color:"#fff",fontWeight:800,fontSize:12,cursor:scoreLoad?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:"0 0 12px rgba(124,58,237,0.3)",transition:"all 0.2s",opacity:scoreLoad?0.6:1,whiteSpace:"nowrap"}}>{scoreLoad?"...":yt("स्कोर","स्कोर","Score")}</button>
        </div>
        {videoScore&&(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
              {[["Title",videoScore.title_score],["Description",videoScore.description_score],["Tags",videoScore.tags_score],[yt("थंबनेल","थंबनेल","Thumbnail"),videoScore.thumbnail_score]].map(([label,score])=>(
                <div key={label} style={{textAlign:"center",padding:"12px 8px",background:"rgba(255,255,255,0.04)",borderRadius:10,border:`1px solid ${C.hairline}`}}>
                  <div style={{fontSize:20,fontWeight:900,color:sc(score)}}>{score}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:2}}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:36,fontWeight:900,color:sc(videoScore.overall_score)}}>{videoScore.overall_score}/100</div>
              <div style={{fontSize:12,color:C.muted}}>Overall SEO Score</div>
            </div>
            <div style={{fontSize:11,fontWeight:800,color:C.muted,marginBottom:8}}>💡 SUGGESTIONS</div>
            {videoScore.suggestions?.map((s,i)=>(
              <div key={i} style={{display:"flex",gap:8,fontSize:12,color:C.slate,marginBottom:6,padding:"6px 10px",background:"rgba(255,255,255,0.03)",borderRadius:8}}>
                <span style={{color:"#fbbf24",flexShrink:0}}>→</span><span>{s}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── REVENUE TAB ──────────────────────────────────────────────────────
function RevenueTab({ channel, analytics, C }) {
  const [rpm,   setRpm  ] = useState(35);
  const [niche, setNiche] = useState("tech");
  const [nicheOpen, setNicheOpen] = useState(false);
  const niches = {
    tech:{rpm:45,label:yt("टेक & गैजेट्स","टेक & गॅजेट्स","Tech & Gadgets")},finance:{rpm:80,label:yt("फाइनेंस & क्रिप्टो","फायनान्स & क्रिप्टो","Finance & Crypto")},
    education:{rpm:35,label:yt("शिक्षा","शिक्षण","Education")},lifestyle:{rpm:25,label:yt("लाइफस्टाइल & व्लॉग","लाइफस्टाइल & व्लॉग","Lifestyle & Vlog")},
    gaming:{rpm:20,label:yt("गेमिंग","गेमिंग","Gaming")},cooking:{rpm:22,label:yt("खाना & फूड","स्वयंपाक & अन्न","Cooking & Food")},
    fitness:{rpm:30,label:yt("फिटनेस & स्वास्थ्य","फिटनेस & आरोग्य","Fitness & Health")},comedy:{rpm:18,label:yt("कॉमेडी","विनोद","Comedy")},
  };
  const monthlyViews = analytics?.total_views || 100000;
  const monthlyRevenue = Math.floor((monthlyViews/1000)*rpm);
  const yearlyRevenue = monthlyRevenue*12;
  const sponsorshipRate = Math.floor((channel?.subscribers||10000)/100);
  const affiliateEst = Math.floor(monthlyRevenue*0.3);
  const milestones = [
    {subs:1000,revenue:"₹500-2K/mo",note:yt("YouTube पार्टनर पात्र","YouTube पार्टनर पात्र","YouTube Partner eligible")},
    {subs:10000,revenue:"₹5K-15K/mo",note:yt("ब्रांड डील शुरू","ब्रँड डील सुरू","Brand deals start")},
    {subs:100000,revenue:"₹50K-1.5L/mo",note:yt("सिल्वर प्ले बटन","सिल्वर प्ले बटन","Silver Play Button")},
    {subs:1000000,revenue:"₹5L-15L/mo",note:yt("गोल्ड प्ले बटन","गोल्ड प्ले बटन","Gold Play Button")},
  ];
  const fmtR = n => n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"K":String(n);
  return (
    <div>
      <div style={{background:C.glass,border:`1px solid ${C.hairline}`,borderRadius:16,padding:20,marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:800,letterSpacing:"1.2px",textTransform:"uppercase",color:C.muted,marginBottom:16}}>💰 Revenue Estimator</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div style={{position:"relative"}}>
            <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:6}}>{yt("आपकी निश","तुमची निश","Your Niche")}</label>
            <div style={{position:"relative"}}>
              <div onClick={()=>setNicheOpen(o=>!o)} style={{width:"100%",padding:"9px 12px",borderRadius:10,border:`1.5px solid ${nicheOpen?C.yt:C.hairline}`,background:"rgba(255,255,255,0.06)",color:C.ink,fontSize:13,fontFamily:"inherit",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",boxSizing:"border-box"}}>
                <span>{niches[niche]?.label}</span>
                <span style={{fontSize:10,color:C.muted}}>{nicheOpen?"▲":"▼"}</span>
              </div>
              {nicheOpen&&(
                <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"rgba(15,10,30,0.97)",border:`1.5px solid ${C.hairline}`,borderRadius:12,zIndex:999,overflow:"hidden",boxShadow:"0 8px 32px rgba(0,0,0,0.6)"}}>
                  {Object.entries(niches).map(([k,v])=>(
                    <div key={k} onClick={()=>{setNiche(k);setRpm(v.rpm);setNicheOpen(false);}} style={{padding:"10px 14px",cursor:"pointer",fontSize:13,color:niche===k?C.yt:C.ink,background:niche===k?"rgba(255,0,0,0.1)":"transparent",fontWeight:niche===k?700:400,borderBottom:`1px solid ${C.hairline}`}}>
                      {v.label} <span style={{fontSize:11,color:C.muted,float:"right"}}>₹{v.rpm}/1K</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label style={{fontSize:11,color:C.muted,display:"block",marginBottom:6}}>RPM (₹ per 1K views)</label>
            <input type="number" value={rpm} onChange={e=>setRpm(Number(e.target.value))} style={{width:"100%",padding:"9px 12px",borderRadius:10,border:`1.5px solid ${C.hairline}`,background:"rgba(255,255,255,0.06)",color:C.ink,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
          {[["▶️",yt("AdSense (मासिक)","AdSense (मासिक)","AdSense (Monthly)"),`₹${monthlyRevenue.toLocaleString()}`,"#ff0000"],["🤝",yt("स्पॉन्सरशिप/वीडियो","स्पॉन्सरशिप/व्हिडिओ","Sponsorship/video"),`₹${sponsorshipRate.toLocaleString()}`,"#fbbf24"],["🔗",yt("एफिलिएट (अनुमान)","एफिलिएट (अंदाज)","Affiliate (est.)"),`₹${affiliateEst.toLocaleString()}`,"#34d399"]].map(([icon,label,val,col])=>(
            <div key={label} style={{textAlign:"center",padding:"14px 10px",background:`${col}10`,borderRadius:12,border:`1px solid ${col}30`}}>
              <div style={{fontSize:20}}>{icon}</div>
              <div style={{fontSize:18,fontWeight:900,color:col,marginTop:4}}>{val}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:2}}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{padding:"14px 16px",background:"linear-gradient(135deg,rgba(255,0,0,0.1),rgba(255,0,0,0.05))",borderRadius:12,border:"1px solid rgba(255,0,0,0.2)",textAlign:"center"}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>💎 {yt("अनुमानित वार्षिक आय","अंदाजे वार्षिक उत्पन्न","TOTAL ESTIMATED YEARLY INCOME")}</div>
          <div style={{fontSize:32,fontWeight:900,color:"#ff0000"}}>₹{yearlyRevenue.toLocaleString()}</div>
          <div style={{fontSize:11,color:C.muted,marginTop:4}}>Based on {monthlyViews.toLocaleString()} monthly views at ₹{rpm} RPM</div>
        </div>
      </div>
      <div style={{background:C.glass,border:`1px solid ${C.hairline}`,borderRadius:16,padding:20,marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:800,letterSpacing:"1.2px",textTransform:"uppercase",color:C.muted,marginBottom:14}}>{yt("🏆 हर माइलस्टोन पर राजस्व","🏆 प्रत्येक माइलस्टोनवर महसूल","🏆 REVENUE AT EACH MILESTONE")}</div>
        {milestones.map((m,i)=>{
          const reached=(channel?.subscribers||0)>=m.subs;
          return <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:reached?"rgba(52,211,153,0.08)":"rgba(255,255,255,0.03)",borderRadius:10,marginBottom:8,border:`1px solid ${reached?"rgba(52,211,153,0.3)":C.hairline}`}}>
            <div style={{fontSize:20}}>{reached?"✅":"⭕"}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:C.ink}}>{m.subs.toLocaleString()} Subscribers</div>
              <div style={{fontSize:11,color:C.muted}}>{m.note}</div>
            </div>
            <div style={{fontSize:13,fontWeight:800,color:reached?"#34d399":C.muted}}>{m.revenue}</div>
          </div>;
        })}
      </div>
      <div style={{background:C.glass,border:`1px solid ${C.hairline}`,borderRadius:16,padding:20}}>
        <div style={{fontSize:11,fontWeight:800,letterSpacing:"1.2px",textTransform:"uppercase",color:C.muted,marginBottom:14}}>📊 {yt("निश के अनुसार भारत RPM","निशनुसार भारत RPM","INDIA RPM BY NICHE")}</div>
        {Object.entries(niches).sort((a,b)=>b[1].rpm-a[1].rpm).map(([k,v])=>(
          <div key={k} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,color:C.ink,fontWeight:niche===k?700:400}}>{v.label}</span>
              <span style={{fontSize:12,color:niche===k?"#ff0000":C.muted,fontWeight:700}}>₹{v.rpm}/1K</span>
            </div>
            <div style={{height:5,borderRadius:99,background:"rgba(255,255,255,0.08)"}}>
              <div style={{height:"100%",width:`${(v.rpm/80)*100}%`,borderRadius:99,background:niche===k?"linear-gradient(90deg,#ff0000,#cc0000)":"rgba(255,255,255,0.2)"}}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ── PIE CHART ────────────────────────────────────────────────────────
function PieChart({ data, C }) {
  const total = data.reduce((s,d) => s + d.value, 0);
  const R = 36, cx = 50, cy = 50, gap = 3;
  const circumference = 2 * Math.PI * R;
  let cumulative = 0;
  const slices = data.map(d => {
    const pct = d.value / total;
    const offset = cumulative;
    cumulative += pct;
    return { ...d, pct, offset };
  });
  return (
    <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
      <svg viewBox="0 0 100 100" style={{ width:130, height:130, flexShrink:0, transform:"rotate(-90deg)" }}>
        {slices.map((s,i) => {
          const dashLen = Math.max(0, s.pct * circumference - gap);
          const dashOffset = -(s.offset * circumference);
          return (
            <circle key={i}
              cx={cx} cy={cy} r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              opacity={0.9}
            />
          );
        })}
        <circle cx={cx} cy={cy} r="22" fill="rgba(10,5,20,0.85)"/>
      </svg>
      <div style={{ flex:1 }}>
        {slices.map((s,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background:s.color, flexShrink:0 }}/>
            <span style={{ fontSize:12, color:C.ink, flex:1 }}>{s.label}</span>
            <span style={{ fontSize:12, fontWeight:700, color:s.color }}>{(s.pct*100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}


// ── SUGGESTED COMPETITORS ────────────────────────────────────────────
function SuggestedCompetitors({ userId, C }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const fmtS = n => !n?"—":n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"K":String(n);

  useEffect(() => {
    if (!userId) return;
    fetch(`https://sociomee.in/api/youtube/suggested-competitors?user_id=${userId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div style={{background:C.glass,border:`1px solid ${C.hairline}`,borderRadius:16,padding:20,marginBottom:16}}>
      <div style={{height:14,width:"40%",borderRadius:8,background:C.hairline,animation:"shimmer 1.4s infinite",marginBottom:16}}/>
      {[1,2,3].map(i=><div key={i} style={{height:60,borderRadius:12,background:C.hairline,animation:"shimmer 1.4s infinite",marginBottom:8}}/>)}
    </div>
  );
  if (!data) return null;

  const Section = ({title, channels, color, icon}) => (
    <div style={{marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <span style={{fontSize:16}}>{icon}</span>
        <span style={{fontSize:11,fontWeight:800,color,letterSpacing:"1px",textTransform:"uppercase"}}>{title}</span>
      </div>
      {channels?.length > 0 ? channels.map((ch,i) => (
        <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"rgba(255,255,255,0.03)",borderRadius:12,marginBottom:6,border:`1px solid ${C.hairline}`,cursor:"pointer"}}
          onClick={()=>window.open(`https://youtube.com/${ch.handle||"channel/"+ch.channel_id}`,"_blank")}>
          {ch.thumbnail?<img src={ch.thumbnail} alt={ch.name} style={{width:36,height:36,borderRadius:"50%",objectFit:"cover",border:`2px solid ${color}33`}}/>:
            <div style={{width:36,height:36,borderRadius:"50%",background:color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color}}>{ch.name?.charAt(0)}</div>}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:700,color:C.ink,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ch.name}</div>
            <div style={{fontSize:11,color:C.muted}}>{ch.handle||""}</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:13,fontWeight:800,color}}>{fmtS(ch.subscribers)}</div>
            <div style={{fontSize:10,color:C.muted}}>{yt("सब्सक्राइबर","सदस्य","subscribers")}</div>
          </div>
        </div>
      )) : <div style={{fontSize:12,color:C.muted,padding:"10px 14px"}}>No channels found for this niche</div>}
    </div>
  );

  const nicheEmoji = {gaming:"🎮",tech:"💻",finance:"💰",comedy:"😂",education:"📚",cooking:"🍳",fitness:"💪",lifestyle:"✨",music:"🎵",motivation:"🔥",general:"📺"};

  return (
    <div style={{background:C.glass,border:`1px solid ${C.hairline}`,borderRadius:16,padding:20,marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
        <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#ff0000,#cc0000)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>
          {nicheEmoji[data.niche]||"📺"}
        </div>
        <div>
          <div style={{fontSize:13,fontWeight:800,color:C.ink}}>
            {yt("⚡ SocioMee AI — सुझाए गए प्रतिद्वंद्वी","⚡ SocioMee AI — सुचवलेले स्पर्धक","⚡ SocioMee AI — Suggested Competitors")}
          </div>
          <div style={{fontSize:11,color:C.muted}}>
            {data.niche?.charAt(0).toUpperCase()+data.niche?.slice(1)} niche · {data.size_tier?.charAt(0).toUpperCase()+data.size_tier?.slice(1)} creator · {fmtS(data.user_subscribers)} subs
          </div>
        </div>
      </div>
      <Section title="🇮🇳 Indian Creators to Learn From" channels={data.similar} color="#ff0000" icon="🇮🇳"/>
      <Section title="Aspirational — Aim for These" channels={data.aspirational} color="#a78bfa" icon="🎯"/>
      <Section title="Global Benchmark" channels={data.global_benchmark} color="#22d3ee" icon="🌍"/>
    </div>
  );
}

// ── COMPETITOR TAB ───────────────────────────────────────────────────
function CompetitorTab({ userId, C }) {
  const [channelUrl, setChannelUrl] = useState("");
  const [loading,    setLoading   ] = useState(false);
  const [competitor, setCompetitor] = useState(null);
  const [saved,      setSaved     ] = useState([]);
  const fmtC = n=>!n?"—":n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"K":String(n);

  const extractChannelName = (url) => {
    if (!url) return "Unknown Channel";
    const patterns = [
      /@([\w.-]+)/,
      /\/c\/([\w.-]+)/,
      /\/user\/([\w.-]+)/,
      /\/channel\/(UC[\w-]+)/,
    ];
    for (const pat of patterns) {
      const m = url.match(pat);
      if (m) return m[1].replace(/-/g," ").replace(/_/g," ");
    }
    return url.replace(/https?:\/\/[^/]+\//, "").split("/")[0] || "Competitor Channel";
  };

  const analyze = async () => {
    if (!channelUrl.trim()) return;
    setLoading(true); setCompetitor(null);
    try {
      const res = await fetch(`https://sociomee.in/api/youtube/competitor?user_id=${userId||"guest"}&channel_url=${encodeURIComponent(channelUrl.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      setCompetitor(data);
    } catch(e) {
      const name = extractChannelName(channelUrl);
      setCompetitor({
        name, subscribers:0, total_views:0, avg_views:0,
        upload_frequency:"Unknown", top_topics:[yt("गेमिंग","गेमिंग","Gaming"),"Tech","Trending","India","Entertainment"],
        posting_time:"7-9 PM IST", shorts_ratio:30, engagement_rate:"0.00",
        gap_opportunities:["Connect YouTube for AI-powered gap analysis","Real competitor insights coming soon"],
        is_mock:true,
      });
    }
    setLoading(false);
  };

  const engColor = e => parseFloat(e)>=10?"#34d399":parseFloat(e)>=3?"#fbbf24":"#f87171";
  return (
    <div>
      <SuggestedCompetitors userId={userId} C={C} />
      <div style={{background:"linear-gradient(135deg,rgba(255,0,0,0.08),rgba(255,0,0,0.03))",border:"1px solid rgba(255,0,0,0.2)",borderRadius:16,padding:20,marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#ff0000,#cc0000)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🕵️</div>
          <div>
            <div style={{fontSize:13,fontWeight:800,color:C.ink}}>{yt("प्रतिद्वंद्वी चैनल स्पाई","स्पर्धक चॅनेल स्पाई","Competitor Channel Spy")}</div>
            <div style={{fontSize:11,color:C.muted}}>Real-time data powered by YouTube API + SocioMee AI</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <input value={channelUrl} onChange={e=>setChannelUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&analyze()} placeholder="@handle or youtube.com/channel/..." style={{flex:1,padding:"11px 16px",borderRadius:12,border:"1.5px solid rgba(255,0,0,0.3)",background:"rgba(255,255,255,0.06)",color:C.ink,fontSize:13,fontFamily:"inherit",outline:"none"}}/>
          <button onClick={analyze} disabled={loading} style={{padding:"11px 24px",borderRadius:12,border:"none",background:loading?"rgba(255,0,0,0.3)":"linear-gradient(135deg,#ff0000,#cc0000)",color:"#fff",fontWeight:800,fontSize:13,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:loading?"none":"0 4px 16px rgba(255,0,0,0.3)"}}>{loading?"Analyzing...":yt("जासूसी 🔍","हेरगिरी 🔍","Spy 🔍")}</button>
        </div>
      </div>
      {competitor&&(
        <>
          <div style={{background:C.glass,border:`1px solid ${C.hairline}`,borderRadius:16,padding:20,marginBottom:16,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,right:0,width:180,height:180,background:"radial-gradient(circle,rgba(255,0,0,0.05),transparent 70%)",pointerEvents:"none"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                {competitor.thumbnail?<img src={competitor.thumbnail} alt={competitor.name} style={{width:56,height:56,borderRadius:"50%",border:"2px solid rgba(255,0,0,0.3)",objectFit:"cover"}}/>:<div style={{width:56,height:56,borderRadius:"50%",background:"linear-gradient(135deg,#ff0000,#cc0000)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:"#fff"}}>{competitor.name?.charAt(0)}</div>}
                <div>
                  <div style={{fontSize:20,fontWeight:900,color:C.ink}}>{competitor.name}</div>
                  <div style={{fontSize:12,color:C.muted}}>{competitor.handle||"YouTube Creator"}</div>
                  <div style={{display:"inline-flex",alignItems:"center",gap:4,marginTop:4,padding:"2px 8px",borderRadius:99,background:"rgba(255,0,0,0.1)",border:"1px solid rgba(255,0,0,0.2)"}}>
                    <div style={{width:6,height:6,borderRadius:"50%",background:"#ff0000"}}/>
                    <span style={{fontSize:10,color:"#ff6b6b",fontWeight:700}}>{competitor.is_mock?"AI ESTIMATE":"LIVE DATA"}</span>
                  </div>
                </div>
              </div>
              <button onClick={()=>!saved.find(s=>s.name===competitor.name)&&setSaved(p=>[...p,competitor])} style={{padding:"8px 16px",borderRadius:99,border:`1.5px solid ${C.hairline}`,background:"rgba(255,255,255,0.04)",color:C.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{saved.find(s=>s.name===competitor.name)?"✓ Tracked":"+ Track"}</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
              {[{icon:"👥",label:yt("सब्सक्राइबर","सदस्य","Subscribers"),val:fmtC(competitor.subscribers),color:"#ff0000"},{icon:"👁️",label:yt("कुल व्यूज़","एकूण व्ह्यूज","Total Views"),val:fmtC(competitor.total_views),color:"#a78bfa"},{icon:"📊",label:yt("औसत व्यूज़","सरासरी व्ह्यूज","Avg Views"),val:fmtC(competitor.avg_views),color:"#22d3ee"},{icon:"❤️",label:yt("एंगेजमेंट","एंगेजमेंट",yt("एंगेजमेंट","एंगेजमेंट","Engagement")),val:`${competitor.engagement_rate}%`,color:engColor(competitor.engagement_rate)}].map(({icon,label,val,color})=>(
                <div key={label} style={{textAlign:"center",padding:"14px 8px",background:`${color}10`,borderRadius:12,border:`1px solid ${color}25`}}>
                  <div style={{fontSize:18}}>{icon}</div>
                  <div style={{fontSize:18,fontWeight:900,color,marginTop:6}}>{val}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:3}}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
              {[["📅 Upload Freq",competitor.upload_frequency],["🕐 Best Time",competitor.posting_time],["📱 Shorts",`${competitor.shorts_ratio}%`]].map(([label,val])=>(
                <div key={label} style={{padding:"12px 14px",background:"rgba(255,255,255,0.03)",borderRadius:12,border:`1px solid ${C.hairline}`}}>
                  <div style={{fontSize:10,color:C.muted,marginBottom:6}}>{label}</div>
                  <div style={{fontSize:14,fontWeight:800,color:C.ink}}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{padding:"12px 14px",background:"rgba(255,255,255,0.03)",borderRadius:12,border:`1px solid ${C.hairline}`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:11,color:C.muted,fontWeight:700}}>⚡ SocioMee AI — Channel Strength</span>
                <span style={{fontSize:12,fontWeight:800,color:engColor(competitor.engagement_rate)}}>{Math.min(100,Math.round(parseFloat(competitor.engagement_rate)*3))}/100</span>
              </div>
              <div style={{height:6,borderRadius:99,background:"rgba(255,255,255,0.08)"}}>
                <div style={{height:"100%",width:`${Math.min(100,Math.round(parseFloat(competitor.engagement_rate)*3))}%`,borderRadius:99,background:`linear-gradient(90deg,${engColor(competitor.engagement_rate)}88,${engColor(competitor.engagement_rate)})`}}/>
              </div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
            <div style={{background:C.glass,border:`1px solid ${C.hairline}`,borderRadius:16,padding:20}}>
              <div style={{fontSize:11,fontWeight:800,color:C.muted,marginBottom:14}}>📊 CONTENT MIX</div>
              <PieChart C={C} data={[{label:"Long Videos",value:Math.max(5,100-competitor.shorts_ratio-10),color:"#ff0000"},{label:"Shorts",value:competitor.shorts_ratio||20,color:"#a78bfa"},{label:"Live/Others",value:10,color:"#22d3ee"}]}/>
            </div>
            <div style={{background:C.glass,border:`1px solid ${C.hairline}`,borderRadius:16,padding:20}}>
              <div style={{fontSize:11,fontWeight:800,color:C.muted,marginBottom:14}}>🔥 TOP TOPICS</div>
              {competitor.top_topics?.map((t,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <div style={{width:`${100-i*12}%`,height:26,borderRadius:8,background:`rgba(255,0,0,${0.12-i*0.015})`,border:"1px solid rgba(255,0,0,0.15)",display:"flex",alignItems:"center",paddingLeft:10}}>
                    <span style={{fontSize:12,color:"#ff6b6b",fontWeight:600}}>{t}</span>
                  </div>
                  <span style={{fontSize:10,color:C.muted,flexShrink:0}}>{100-i*12}%</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:"linear-gradient(135deg,rgba(52,211,153,0.06),rgba(52,211,153,0.02))",border:"1px solid rgba(52,211,153,0.25)",borderRadius:16,padding:20,marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <div style={{width:28,height:28,borderRadius:8,background:"rgba(52,211,153,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🎯</div>
              <div style={{fontSize:13,fontWeight:800,color:"#34d399",flex:1}}>Content Gap Opportunities</div>
              <div style={{padding:"2px 8px",borderRadius:99,background:"rgba(52,211,153,0.15)",fontSize:10,color:"#34d399",fontWeight:700}}>⚡ SocioMee AI</div>
            </div>
            {competitor.gap_opportunities?.map((gap,i)=>(
              <div key={i} style={{display:"flex",gap:12,padding:"12px 16px",background:"rgba(52,211,153,0.06)",borderRadius:12,marginBottom:8,border:"1px solid rgba(52,211,153,0.12)"}}>
                <div style={{width:22,height:22,borderRadius:6,background:"rgba(52,211,153,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:11}}>✓</div>
                <span style={{fontSize:13,color:C.ink,lineHeight:1.5}}>{gap}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {saved.length>0&&(
        <div style={{background:C.glass,border:`1px solid ${C.hairline}`,borderRadius:16,padding:20}}>
          <div style={{fontSize:11,fontWeight:800,color:C.muted,marginBottom:14}}>📋 TRACKED COMPETITORS ({saved.length})</div>
          {saved.map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"rgba(255,255,255,0.03)",borderRadius:12,marginBottom:8,border:`1px solid ${C.hairline}`}}>
              {s.thumbnail&&<img src={s.thumbnail} alt={s.name} style={{width:36,height:36,borderRadius:"50%",objectFit:"cover",border:"1px solid rgba(255,0,0,0.2)"}}/>}
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:C.ink}}>{s.name}</div>
                <div style={{fontSize:11,color:C.muted}}>{s.handle||""}</div>
              </div>
              <div style={{display:"flex",gap:16}}>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:13,fontWeight:800,color:"#ff0000"}}>{fmtC(s.subscribers)}</div>
                  <div style={{fontSize:9,color:C.muted}}>Subs</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:13,fontWeight:800,color:"#a78bfa"}}>{fmtC(s.avg_views)}</div>
                  <div style={{fontSize:9,color:C.muted}}>Avg Views</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OptimizeVideoRow({ v, userId, getScore, getTips, scoreColor, C }) {
  const [open, setOpen] = useState(false);
  const [watchTime, setWatchTime] = useState(null);
  const [avgDuration, setAvgDuration] = useState(null);
  const sc = getScore(v); const tips = getTips(v); const scCol = scoreColor(sc);
  
  const fetchCTR = async (uid) => {
    if(watchTime !== null) return;
    const resolvedUid = uid || userId || "";
    if(!resolvedUid) { console.warn("fetchCTR: no userId"); return; }
    try {
      const url = `${BASE}/youtube/video-ctr/${v.video_id}?user_id=${resolvedUid}`;
      console.log("fetchCTR:", url);
      const r = await fetch(url);
      const d = await r.json();
      console.log("fetchCTR result:", d);
      if(d.watch_time != null) setWatchTime(d.watch_time);
      if(d.avg_duration != null) setAvgDuration(d.avg_duration);
    } catch(e) { console.error("CTR fetch failed:", e); }
  };
  return (
    <div style={{ background:C.glass, border:`1px solid ${open?C.purple+"44":C.hairline}`, borderRadius:"12px" }}>
      <div onClick={()=>{setOpen(!open);if(!open)fetchCTR(userId);}} style={{ display:"flex", gap:"10px", alignItems:"center", padding:"10px 12px", cursor:"pointer" }}>
        {v.thumbnail && <img src={v.thumbnail} alt="" style={{ width:"64px", height:"36px", borderRadius:"6px", objectFit:"cover", flexShrink:0 }}/>}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:"12px", fontWeight:"700", color:C.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.title}</div>
          <div style={{ fontSize:"10px", color:C.muted, marginTop:"2px" }}>{v.published_at} · {fmt(v.views)} views · {v.engagement}% eng.</div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
          <div style={{ width:"32px", height:"32px", borderRadius:"50%", border:`2px solid ${scCol}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:"900", color:scCol, background:`${scCol}12` }}>{sc}</div>
          <div style={{ fontSize:"8px", color:C.muted, marginTop:"1px" }}>SCORE</div>
        </div>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" style={{ flexShrink:0, transform:open?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      {open && (
        <div style={{ borderTop:`1px solid ${C.hairline}`, padding:"10px 8px" }}>
          <div style={{ fontSize:"10px", fontWeight:"800", color:C.purple, letterSpacing:"0.8px", textTransform:"uppercase", marginBottom:"8px" }}>⚡ SocioMee AI Optimization Tips</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"6px", marginBottom:"12px" }}>
            {tips.map((t,ti) => (
              <div key={ti} style={{ display:"flex", gap:"8px", alignItems:"flex-start", background:`${t.color}08`, border:`1px solid ${t.color}20`, borderRadius:"8px", padding:"8px 10px" }}>
                
                <span style={{ fontSize:"11.5px", color:C.ink, lineHeight:1.5, fontFamily:"Poppins,sans-serif", hyphens:"none", wordBreak:"break-word" }}>{t.text.split('—').join(' ').split('–').join(' ')}</span>
              </div>
            ))}
          </div>
          {/* Donut Charts */}
          <div className="yt-video-donuts" style={{display:"flex",flexDirection:"row",gap:"8px",overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"thin",scrollbarColor:"rgba(124,58,237,0.4) transparent",paddingBottom:"8px",marginBottom:"10px",width:"100%"}}>
            <VideoDonut label="VIEWS" center={fmt(v.views)} sub="total views"
              data={[{name:"This video",value:v.views||1,color:"#7c3aed"},{name:"Others",value:Math.max(1,v.views*10),color:"rgba(124,58,237,0.12)"}]}/>
            <VideoDonut label={watchTime?"WATCH TIME":"LIKES"} center={watchTime?watchTime+"m":fmt(v.likes||0)} sub={watchTime?"total mins":"total likes"}
              data={watchTime?[{name:"Watched",value:Math.max(parseFloat(watchTime)||1,1),color:"#7c3aed"},{name:"Rest",value:Math.max(60-parseFloat(watchTime)||1,1),color:"rgba(124,58,237,0.12)"}]:[{name:"Likes",value:Math.max(v.likes||0,1),color:"#7c3aed"},{name:"Views",value:Math.max(v.views-(v.likes||0),1),color:"rgba(124,58,237,0.12)"}]}/>
            <VideoDonut label={avgDuration?"AVG DURATION":"ENGAGEMENT"} center={avgDuration||((((v.likes+v.comments)/Math.max(v.views,1))*100).toFixed(1)+"%")} sub={avgDuration?"avg watch":"eng. rate"}
              data={avgDuration?[{name:"Watched",value:Math.max(parseInt(avgDuration?.split(":")?.[0]||0)*60+parseInt(avgDuration?.split(":")?.[1]||0),1),color:"#7c3aed"},{name:"Rest",value:Math.max(300-(parseInt(avgDuration?.split(":")?.[0]||0)*60+parseInt(avgDuration?.split(":")?.[1]||0)),1),color:"rgba(124,58,237,0.08)"}]:[{name:"Likes",value:Math.max(v.likes||0,1),color:"#7c3aed"},{name:"Comments",value:Math.max(v.comments||0,1),color:"#a78bfa"},{name:"Rest",value:Math.max(v.views-(v.likes||0)-(v.comments||0),1),color:"rgba(124,58,237,0.08)"}]}/>
            <VideoDonut label="SCORE" center={getScore(v)} sub="/100"
              data={[{name:"Score",value:Math.max(getScore(v),1),color:"#7c3aed"},{name:"Gap",value:Math.max(100-getScore(v),1),color:"rgba(124,58,237,0.1)"}]}/>
          </div>
          <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
            <a href={v.url} target="_blank" rel="noreferrer" style={{ padding:"6px 16px", borderRadius:"99px", background:C.purple, color:"#fff", fontSize:"10px", fontWeight:"700", textDecoration:"none" }}>▶ Watch</a>
            <button onClick={()=>navigator.clipboard.writeText(v.url)} style={{ padding:"6px 16px", borderRadius:"99px", background:"transparent", border:`1px solid ${C.hairline}`, color:C.muted, fontSize:"10px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>🔗 Copy</button>
            <button onClick={()=>navigator.share?navigator.share({title:v.title,url:v.url}):navigator.clipboard.writeText(v.url)} style={{ padding:"6px 16px", borderRadius:"99px", background:"transparent", border:`1px solid ${C.hairline}`, color:C.muted, fontSize:"10px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>↗ Share</button>
          </div>
        </div>
      )}
    </div>
  );
}

function OptimizeTab({ userId, channel, C }) {
  C = getThemeC();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("recent");
  const [search, setSearch] = useState("");
  const [vfilter, setVfilter] = useState("all");

  useEffect(() => {
    fetch(`${BASE}/youtube/all-videos/${userId}?max_results=100`)
      .then(r => r.json())
      .then(d => { setVideos(d.videos || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  function getScore(v) {
    const eng = (v.likes + v.comments) / Math.max(v.views, 1) * 100;
    const hasGoodTitle = v.title.length > 30 && v.title.length < 70;
    const hasTags = v.tags?.length > 3;
    const hasDesc = v.description?.length > 50;
    let score = 0;
    score += Math.min(eng * 10, 40);
    if (hasGoodTitle) score += 20;
    if (hasTags) score += 20;
    if (hasDesc) score += 20;
    return Math.min(Math.round(score), 100);
  }

  function getTips(v) {
    const tips = [];
    const eng = (v.likes + v.comments) / Math.max(v.views, 1) * 100;
    if (v.title.length < 30) tips.push({ icon:"📝", color:"#f59e0b", text:"Title too short — aim for 50-60 characters for better CTR" });
    if (v.title.length > 70) tips.push({ icon:"✂️", color:"#ef4444", text:"Title too long — trim to under 70 chars so it doesn't get cut off" });
    if (!v.tags || v.tags.length < 5) tips.push({ icon:"🏷️", color:"#f59e0b", text:"Add more tags — use 10-15 relevant tags to improve discoverability" });
    if (!v.description || v.description.length < 50) tips.push({ icon:"📄", color:"#ef4444", text:"Description too short — add 200+ words with keywords for SEO boost" });
    if (eng < 1) tips.push({ icon:"💬", color:"#ef4444", text:"Very low engagement — pin a comment asking viewers a question" });
    if (eng > 5) tips.push({ icon:"🔥", color:"#22c55e", text:"Great engagement! Use this video style as your template" });
    if (v.views > 0 && v.likes / v.views < 0.02) tips.push({ icon:"👍", color:"#f59e0b", text:"Low like rate — add a like reminder at 30% and 90% of video" });
    if (tips.length === 0) tips.push({ icon:"✅", color:"#22c55e", text:"Well optimized video! Keep this format consistent" });
    return tips;
  }

  const sorted = [...videos]
    .filter(v => v.title.toLowerCase().includes(search.toLowerCase()))
    .filter(v => {
      if(vfilter==="all") return true;
      const vt = v.video_type || "video";
      return vt===vfilter;
    })
    .sort((a,b) => {
      if (sort === "score") return getScore(b) - getScore(a);
      if (sort === "views") return b.views - a.views;
      if (sort === "engagement") return b.engagement - a.engagement;
      return b.published_at.localeCompare(a.published_at);
    });

  const scoreColor = s => s>=75?"#22c55e":s>=50?"#f59e0b":"#ef4444";

  if (loading) return (
    <div style={{display:"flex",flexDirection:"column",gap:"8px",padding:"8px 0"}}>
      {[...Array(5)].map((_,i)=>(
        <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"12px",padding:"10px 12px",display:"flex",gap:"10px",alignItems:"center"}}>
          <div style={{width:"64px",height:"36px",borderRadius:"6px",background:"rgba(255,255,255,0.06)",flexShrink:0,animation:"pulse 1.5s ease-in-out infinite"}}/>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:"6px"}}>
            <div style={{height:"10px",borderRadius:"99px",background:"rgba(255,255,255,0.06)",width:"70%",animation:"pulse 1.5s ease-in-out infinite"}}/>
            <div style={{height:"8px",borderRadius:"99px",background:"rgba(255,255,255,0.04)",width:"40%",animation:"pulse 1.5s ease-in-out infinite"}}/>
          </div>
          <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"rgba(255,255,255,0.06)",flexShrink:0,animation:"pulse 1.5s ease-in-out infinite"}}/>
        </div>
      ))}
    </div>
  );
  if (!videos.length) return <div style={{ textAlign:"center", color:C.muted, padding:"40px", fontSize:"13px" }}>No videos found. Connect your YouTube channel first.</div>;

  const avgScore = Math.round(videos.reduce((s,v) => s+getScore(v), 0) / videos.length);
  const needsWork = videos.filter(v => getScore(v) < 50).length;

  return (
    <div>
      {/* Summary bar */}
      <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginBottom:"16px" }}>
        {[
          { icon:"🎬", label:"Total Videos", val:videos.length, color:C.purple },
          { icon:"📊", label:"Avg Score", val:avgScore, color:avgScore>=75?"#22c55e":avgScore>=50?"#f59e0b":"#ef4444" },
          { icon:"⚠️", label:"Needs Work", val:needsWork, color:"#ef4444" },
          { icon:"✅", label:"Well Optimized", val:videos.length-needsWork, color:"#22c55e" },
        ].map(({icon,label,val,color}) => (
          <div key={label} style={{ flex:"1 1 100px", background:`${color}10`, border:`1px solid ${color}25`, borderRadius:"12px", padding:"12px", textAlign:"center" }}>
            <div style={{ fontSize:"18px" }}>{icon}</div>
            <div style={{ fontSize:"16px", fontWeight:"900", color, marginTop:"4px" }}>{val}</div>
            <div style={{ fontSize:"9px", color:C.muted, textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display:"flex", flexDirection:"column", gap:"8px", marginBottom:"14px" }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={yt("वीडियो खोजें...","व्हिडिओ शोधा...","Search videos...")} style={{ width:"100%", boxSizing:"border-box", padding:"8px 14px", borderRadius:"99px", background:C.glass, border:`1px solid ${C.hairline}`, color:C.ink, fontSize:"12px", fontFamily:"inherit", outline:"none" }}/>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
          {[["recent",yt("हाल का","अलीकडील","Recent")],["score",yt("स्कोर","स्कोर","Score")],["views",yt("व्यूज़","व्ह्यूज","Views")],["engagement",yt("एंगेजमेंट","एंगेजमेंट","Engagement")]].map(([k,l]) => (
            <button key={k} onClick={()=>setSort(k)} style={{ padding:"5px 14px", borderRadius:"99px", border:`1px solid ${sort===k?C.purple:C.hairline}`, background:sort===k?`${C.purple}22`:"transparent", color:sort===k?C.purple:C.muted, fontSize:"11px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Type filter pills */}
      <div style={{display:"flex",gap:"4px",marginBottom:"10px",overflowX:"auto",scrollbarWidth:"none",msOverflowStyle:"none",paddingBottom:"2px"}}>
        {[
          {id:"all",label:"All",count:videos.length},
          {id:"short",label:"Shorts",count:videos.filter(v=>v.video_type==="short").length},
          {id:"video",label:"Videos",count:videos.filter(v=>v.video_type==="video").length},
          {id:"live",label:"Live",count:videos.filter(v=>v.video_type==="live").length}
        ].map(f=>(
          <button key={f.id} onClick={()=>setVfilter(f.id)} style={{padding:"3px 8px",borderRadius:"99px",border:`1px solid ${vfilter===f.id?C.purple:C.hairline}`,background:vfilter===f.id?`${C.purple}22`:"transparent",color:vfilter===f.id?C.purple:C.muted,fontSize:"9px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",flexShrink:0,whiteSpace:"nowrap"}}>{f.label} ({f.count})</button>
        ))}
      </div>
      {/* Video list */}
      <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
        {sorted.map((v,i) => <OptimizeVideoRow key={v.video_id} v={v} userId={userId} getScore={getScore} getTips={getTips} scoreColor={scoreColor} C={C} />)}
      </div>
    </div>
  );
}

function VideoIdeasTab({ userId, channel, C }) {
  C = getThemeC();
  const [niche, setNiche] = useState(channel?.channel_title || "");
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  async function generate() {
    if (!niche.trim()) return;
    setLoading(true); setIdeas([]);
    try {
      const r = await fetch(`${BASE}/youtube/video-ideas/${userId}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ niche })
      });
      const d = await r.json();
      setIdeas(d.ideas || []);
    } catch(e) { console.error(e); }
    setLoading(false);
  }

  const scoreColor = s => s>=8?"#22c55e":s>=5?"#f59e0b":"#ef4444";
  const diffColor = d => d==="Easy"?"#22c55e":d==="Medium"?"#f59e0b":"#ef4444";
  const formatColor = f => ({Tutorial:C.purple,Vlog:"#22d3ee",Challenge:"#ff3d8f",Reaction:"#f59e0b",List:"#34d399",Story:"#a78bfa",Review:"#ff6eb5",Comparison:"#fbbf24"})[f]||C.purple;

  return (
    <div>
      <div style={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:"16px", padding:"16px", marginBottom:"16px" }}>
        <div style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.2px", textTransform:"uppercase", color:C.muted, marginBottom:"12px" }}>🎯 Video Idea Generator</div>
        <div style={{ fontSize:"12px", color:C.muted, marginBottom:"10px" }}>Enter your niche or channel topic to get 10 AI-powered viral video ideas</div>
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          <input value={niche} onChange={e=>setNiche(e.target.value)} onKeyDown={e=>e.key==="Enter"&&generate()} placeholder="e.g. Gaming, Cooking, Finance, Fitness..." style={{ width:"100%", boxSizing:"border-box", padding:"10px 14px", borderRadius:"10px", border:`1.5px solid ${C.hairline}`, background:"rgba(255,255,255,0.06)", color:C.ink, fontSize:"13px", fontFamily:"inherit", outline:"none" }}/>
          <button onClick={generate} disabled={loading} style={{ padding:"10px", borderRadius:"10px", border:"none", background:`linear-gradient(135deg,${C.purple},#ff3d8f)`, color:"#fff", fontWeight:"800", fontSize:"13px", cursor:"pointer", fontFamily:"inherit", boxShadow:`0 0 20px ${C.purple}44` }}>
            {loading ? yt("⚡ आइडिया बन रहे हैं...","⚡ आयडिया तयार होत आहेत...","⚡ Generating Ideas...") : yt("⚡ 10 वीडियो आइडिया बनाएं","⚡ 10 व्हिडिओ आयडिया तयार करा","⚡ Generate 10 Video Ideas")}
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign:"center", padding:"40px", color:C.muted }}>
          <div style={{ fontSize:"32px", marginBottom:"12px" }}>🤖</div>
          <div style={{ fontSize:"13px" }}>SocioMee AI is analyzing trends for <strong style={{color:C.purple}}>{niche}</strong>...</div>
        </div>
      )}

      {ideas.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
          <div style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1px", textTransform:"uppercase", color:C.muted, marginBottom:"4px" }}>✨ {ideas.length} Ideas Generated for "{niche}"</div>
          {ideas.map((idea, i) => (
            <div key={i} style={{ background:C.glass, border:`1px solid ${expanded===i?C.purple+"55":C.hairline}`, borderRadius:"14px", overflow:"hidden" }}>
              <div onClick={()=>setExpanded(expanded===i?null:i)} style={{ padding:"12px 14px", cursor:"pointer" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:"10px", marginBottom:"8px" }}>
                  <div style={{ width:"24px", height:"24px", borderRadius:"6px", background:`${C.purple}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:"900", color:C.purple, flexShrink:0 }}>#{i+1}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"13px", fontWeight:"700", color:C.ink, lineHeight:1.4, marginBottom:"6px" }}>{idea.title}</div>
                    <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                      <span style={{ padding:"2px 8px", borderRadius:"99px", fontSize:"9px", fontWeight:"700", background:`${formatColor(idea.format)}18`, color:formatColor(idea.format), border:`1px solid ${formatColor(idea.format)}33` }}>{idea.format}</span>
                      <span style={{ padding:"2px 8px", borderRadius:"99px", fontSize:"9px", fontWeight:"700", background:`${diffColor(idea.difficulty)}18`, color:diffColor(idea.difficulty) }}>{idea.difficulty}</span>
                      <span style={{ padding:"2px 8px", borderRadius:"99px", fontSize:"9px", fontWeight:"700", background:"rgba(255,255,255,0.06)", color:C.muted }}>~{idea.estimated_views}</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                    <div style={{ fontSize:"16px", fontWeight:"900", color:scoreColor(idea.trending_score) }}>{idea.trending_score}</div>
                    <div style={{ fontSize:"7px", color:C.muted }}>TREND</div>
                  </div>
                </div>
              </div>
              {expanded===i && (
                <div style={{ borderTop:`1px solid ${C.hairline}`, padding:"12px 14px" }}>
                  <div style={{ marginBottom:"10px" }}>
                    <div style={{ fontSize:"9px", fontWeight:"800", color:C.purple, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"4px" }}>🎬 Opening Hook</div>
                    <div style={{ fontSize:"12px", color:C.ink, lineHeight:1.5, fontStyle:"italic" }}>"{idea.hook}"</div>
                  </div>
                  <div style={{ marginBottom:"10px" }}>
                    <div style={{ fontSize:"9px", fontWeight:"800", color:"#f59e0b", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"4px" }}>📈 Why It'll Trend</div>
                    <div style={{ fontSize:"12px", color:C.ink, lineHeight:1.5 }}>{idea.why_trending}</div>
                  </div>
                  <button onClick={()=>{ navigator.clipboard.writeText(idea.title); }} style={{ padding:"6px 14px", borderRadius:"8px", background:C.purple, color:"#fff", fontSize:"10px", fontWeight:"700", border:"none", cursor:"pointer", fontFamily:"inherit" }}>📋 Copy Title</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VideoCommentRow({ video, userId, C }) {
  C = getThemeC();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState("all");
  const [order, setOrder] = useState("time");
  const [copied, setCopied] = useState(null);

  async function load(ord) {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/youtube/comments/${userId}?video_id=${video.video_id}&order=${ord||order}&max_results=50`);
      const d = await r.json();
      setComments(d.comments || []);
      setLoaded(true);
    } catch(e) {}
    setLoading(false);
  }

  function toggle() {
    setExpanded(e => {
      if (!e && !loaded) load(order);
      return !e;
    });
  }

  function copyText(text, id) {
    navigator.clipboard.writeText(text.replace(/<[^>]+>/g,""));
    setCopied(id); setTimeout(()=>setCopied(null),2000);
  }

  const filtered = filter==="all" ? comments : comments.filter(c => filter==="replied"?c.replied:!c.replied);
  const repliedCount = comments.filter(c=>c.replied).length;
  const unrepliedCount = comments.filter(c=>!c.replied).length;

  return (
    <div style={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:"14px", overflow:"hidden", marginBottom:"10px" }}>
      {/* Video row header */}
      <div onClick={toggle} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"12px 14px", cursor:"pointer" }}>
        {video.thumbnail && <img src={video.thumbnail} alt="" style={{ width:"64px", height:"36px", borderRadius:"6px", objectFit:"cover", flexShrink:0 }}/>}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:"12px", fontWeight:"700", color:C.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{video.title}</div>
          <div style={{ fontSize:"9px", color:C.muted, marginTop:"2px" }}>{video.published_at}</div>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" style={{ flexShrink:0, transform:expanded?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
      </div>

      {/* Comments section */}
      {expanded && (
        <div style={{ borderTop:`1px solid ${C.hairline}`, padding:"12px 14px" }}>
          {/* Controls */}
          <div style={{ display:"flex", gap:"6px", marginBottom:"10px", flexWrap:"wrap" }}>
            {[["time","Newest"],["relevance","Top"]].map(([v,l])=>(
              <button key={v} onClick={()=>{ setOrder(v); load(v); }}
                style={{ padding:"4px 10px", borderRadius:"8px", border:`1px solid ${order===v?C.purple:C.hairline}`, background:order===v?`${C.purple}20`:"transparent", color:order===v?C.purple:C.muted, fontSize:"10px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
            ))}
            {loaded && <>
              {[["all",`All (${comments.length})`],["unreplied",`Unreplied (${unrepliedCount})`],["replied",`Replied (${repliedCount})`]].map(([v,l])=>(
                <button key={v} onClick={()=>setFilter(v)}
                  style={{ padding:"4px 10px", borderRadius:"8px", border:`1px solid ${filter===v?C.purple:C.hairline}`, background:filter===v?`${C.purple}20`:"transparent", color:filter===v?C.purple:C.muted, fontSize:"10px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
              ))}
            </>}
          </div>

          {loading && <div style={{ textAlign:"center", padding:"20px", color:C.muted, fontSize:"12px" }}>Loading comments...</div>}
          {!loading && loaded && filtered.length === 0 && <div style={{ textAlign:"center", padding:"20px", color:C.muted, fontSize:"12px" }}>No comments found.</div>}

          {!loading && filtered.map(cm => (
            <div key={cm.comment_id} style={{ background:`${C.glass}`, border:`1px solid ${cm.replied?"#22c55e22":C.hairline}`, borderRadius:"10px", padding:"10px 12px", marginBottom:"8px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px" }}>
                {cm.avatar
                  ? <img src={cm.avatar} alt="" style={{ width:"26px", height:"26px", borderRadius:"50%", objectFit:"cover", flexShrink:0 }}/>
                  : <div style={{ width:"26px", height:"26px", borderRadius:"50%", background:`${C.purple}33`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", fontWeight:"800", color:C.purple, flexShrink:0 }}>{cm.author?.charAt(0)}</div>
                }
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"11px", fontWeight:"700", color:C.ink }}>{cm.author}</div>
                  <div style={{ fontSize:"9px", color:C.muted }}>{cm.date}</div>
                </div>
                <div style={{ display:"flex", gap:"5px", alignItems:"center", flexShrink:0 }}>
                  {cm.likes > 0 && <span style={{ fontSize:"9px", color:C.muted }}>👍 {cm.likes}</span>}
                  {cm.replied
                    ? <span style={{ fontSize:"9px", fontWeight:"700", color:"#22c55e", background:"#22c55e15", padding:"2px 6px", borderRadius:"99px" }}>✓ Replied</span>
                    : <span style={{ fontSize:"9px", fontWeight:"700", color:"#ef4444", background:"#ef444415", padding:"2px 6px", borderRadius:"99px" }}>Unreplied</span>
                  }
                  <button onClick={()=>copyText(cm.text, cm.comment_id)}
                    style={{ padding:"3px 7px", borderRadius:"5px", background:copied===cm.comment_id?"#22c55e20":C.glass, border:`1px solid ${copied===cm.comment_id?"#22c55e44":C.hairline}`, color:copied===cm.comment_id?"#22c55e":C.muted, fontSize:"9px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>
                    {copied===cm.comment_id?"✓":"Copy"}
                  </button>
                </div>
              </div>
              <div style={{ fontSize:"12px", color:C.ink, lineHeight:1.6 }} dangerouslySetInnerHTML={{__html: cm.text}}/>
              {cm.reply_count > 0 && <div style={{ marginTop:"4px", fontSize:"9px", color:C.muted }}>💬 {cm.reply_count} replies</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SentimentTab({ userId, channel, C }) {
  C = getThemeC();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetch(`${BASE}/youtube/channel-videos/${userId}?max_results=20`)
      .then(r=>r.json())
      .then(d=>{ console.log("channel-videos:", d); setVideos(d.videos||[]); setLoading(false); })
      .catch(e=>{ console.error("channel-videos error:", e); setLoading(false); });

  }, [userId]);

  if (loading) return <div style={{ textAlign:"center", padding:"40px", color:C.muted, fontSize:"13px" }}>Loading videos...</div>;
  if (!videos.length) return <div style={{ textAlign:"center", padding:"40px", color:C.muted, fontSize:"13px" }}>No videos found.</div>;

  return (
    <div>
      <div style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1px", textTransform:"uppercase", color:C.muted, marginBottom:"14px" }}>💬 Comments — Click a video to expand</div>
      {videos.map(v => <VideoCommentRow key={v.video_id} video={v} userId={userId} C={C}/>)}
    </div>
  );
}




function SimpleDonut({ data, title, centerLabel, colors }) {
  const [active, setActive] = useState(null);
  const total = data.reduce((a,d)=>a+d.value,0);
  const pieData = data.map(d=>({...d, pct:Math.round(d.value/total*100)}));
  const highlighted = active!==null ? pieData[active] : null;
  return (
    <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"14px",padding:"16px"}}>
      <div style={{fontSize:"11px",fontWeight:"700",color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"12px"}}>{title}</div>
      <div style={{display:"flex",alignItems:"center",gap:"16px",flexWrap:"wrap"}}>
        <div style={{position:"relative",flexShrink:0}}>
          <RechartsPie width={100} height={100}>
            <Pie data={pieData} cx={50} cy={50} innerRadius={30} outerRadius={44} paddingAngle={2} dataKey="value" strokeWidth={0}
              onMouseEnter={(_,i)=>setActive(i)} onMouseLeave={()=>setActive(null)}>
              {pieData.map((_,i)=><Cell key={i} fill={colors[i%colors.length]} opacity={active===null||active===i?1:0.3}/>)}
            </Pie>
          </RechartsPie>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center",pointerEvents:"none",width:"40px"}}>
            {highlighted ? (<>
              <div style={{fontSize:"11px",fontWeight:"900",color:colors[active%colors.length],lineHeight:1}}>{highlighted.pct}%</div>
              <div style={{fontSize:"7px",color:"rgba(255,255,255,0.5)",marginTop:"1px",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"38px"}}>{highlighted.name}</div>
            </>) : (<>
              <div style={{fontSize:"9px",fontWeight:"900",color:"#fff",lineHeight:1}}>{centerLabel}</div>
            </>)}
          </div>
        </div>
        <div style={{flex:1,minWidth:"120px",display:"flex",flexDirection:"column",gap:"6px"}}>
          {pieData.map((d,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",padding:"3px 6px",borderRadius:"6px",background:active===i?"rgba(255,255,255,0.05)":"transparent",cursor:"pointer",transition:"all 0.15s"}}
              onMouseEnter={()=>setActive(i)} onMouseLeave={()=>setActive(null)}>
              <div style={{width:"8px",height:"8px",borderRadius:"50%",background:colors[i%colors.length],flexShrink:0,boxShadow:active===i?`0 0 6px ${colors[i%colors.length]}`:"none"}}/>
              <span style={{fontSize:"9px",color:active===i?"#fff":"rgba(255,255,255,0.6)",flex:1,fontWeight:active===i?"700":"500",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"normal"}}>{d.name}</span>
              <span style={{fontSize:"9px",fontWeight:"700",color:colors[i%colors.length],flexShrink:0}}>{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrafficDonut({ pieData, COLORS, topPct, topLabel, aiTip, innerData }) {
  const [activeOuter, setActiveOuter] = useState(null);
  const [activeInner, setActiveInner] = useState(null);
  const highlighted = activeOuter!==null ? pieData[activeOuter] : null;
  const highlightedInner = activeInner!==null ? innerData[activeInner] : null;
  return (
    <div className="yt-traffic-wrap" style={{display:"flex",gap:"16px",alignItems:"flex-start",flexWrap:"wrap",justifyContent:"center"}}>
      <div style={{position:"relative"}}>
        <RechartsPie width={140} height={140}>
          <Pie data={pieData} cx={70} cy={70} innerRadius={46} outerRadius={63} paddingAngle={2} dataKey="value" strokeWidth={0}
            onMouseEnter={(_,i)=>setActiveOuter(i)} onMouseLeave={()=>setActiveOuter(null)}>
            {pieData.map((_,i)=><Cell key={"o"+i} fill={COLORS[i%COLORS.length]} opacity={activeOuter===null||activeOuter===i?1:0.3}/>)}
          </Pie>
          <Pie data={innerData} cx={70} cy={70} innerRadius={24} outerRadius={40} paddingAngle={3} dataKey="value" strokeWidth={0}
            onMouseEnter={(_,i)=>setActiveInner(i)} onMouseLeave={()=>setActiveInner(null)}>
            {innerData.map((d,i)=><Cell key={"i"+i} fill={d.color} opacity={activeInner===null||activeInner===i?1:0.3}/>)}
          </Pie>
        </RechartsPie>
        <div style={{position:"absolute",top:0,left:0,width:"140px",height:"140px",display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none"}}><div style={{textAlign:"center",width:"80px",lineHeight:1.2}}>
          {highlighted ? (<>
            <div style={{fontSize:"13px",fontWeight:"900",color:COLORS[activeOuter%COLORS.length],lineHeight:1}}>{highlighted.pct}%</div>
            <div style={{fontSize:"9px",color:"rgba(255,255,255,0.6)",marginTop:"2px",lineHeight:1.3}}>{highlighted.name}</div>
          </>) : highlightedInner ? (<>
            <div style={{fontSize:"11px",fontWeight:"900",color:highlightedInner.color,lineHeight:1}}>AI</div>
            <div style={{fontSize:"8px",color:"rgba(255,255,255,0.5)",marginTop:"2px",lineHeight:1.3}}>{highlightedInner.name}</div>
          </>) : (<>
            <div style={{fontSize:"11px",fontWeight:"900",color:"#fff",lineHeight:1}}>{topPct}%</div>
            <div style={{fontSize:"7px",color:"#a78bfa",fontWeight:"700",marginTop:"1px"}}>TOP SOURCE</div>
            <div style={{fontSize:"6px",color:"rgba(255,255,255,0.4)",marginTop:"1px"}}>{topLabel}</div>
          </>)}
        </div></div>
      </div>
      <div className="yt-traffic-text" style={{flex:1,minWidth:"120px",maxWidth:"100%"}}>
        <div style={{fontSize:"10px",fontWeight:"700",color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>Traffic Sources</div>
        <div style={{display:"flex",flexDirection:"column",gap:"5px",marginBottom:"14px"}}>
          {pieData.map((d,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",padding:"4px 8px",borderRadius:"8px",background:activeOuter===i?"rgba(255,255,255,0.06)":"transparent",cursor:"pointer"}}
              onMouseEnter={()=>setActiveOuter(i)} onMouseLeave={()=>setActiveOuter(null)}>
              <div style={{width:"7px",height:"7px",borderRadius:"50%",background:COLORS[i%COLORS.length],flexShrink:0}}/>
              <span style={{fontSize:"9px",color:activeOuter===i?"#fff":"rgba(255,255,255,0.5)",flex:1,fontWeight:activeOuter===i?"700":"500",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"normal"}}>{d.name}</span>
              <span style={{fontSize:"9px",fontWeight:"700",color:COLORS[i%COLORS.length],flexShrink:0}}>{d.pct}%</span>
            </div>
          ))}
        </div>
        <div style={{fontSize:"10px",fontWeight:"700",color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>✦ AI Prediction</div>
        <div style={{display:"flex",flexDirection:"column",gap:"5px",marginBottom:"10px"}}>
          {innerData.map((d,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",padding:"4px 8px",borderRadius:"8px",background:activeInner===i?"rgba(255,255,255,0.06)":"transparent",cursor:"pointer"}}
              onMouseEnter={()=>setActiveInner(i)} onMouseLeave={()=>setActiveInner(null)}>
              <div style={{width:"10px",height:"10px",borderRadius:"50%",background:d.color,flexShrink:0,boxShadow:activeInner===i?`0 0 8px ${d.color}`:"none"}}/>
              <span style={{fontSize:"11px",color:activeInner===i?"#fff":"rgba(255,255,255,0.55)",flex:1,fontWeight:activeInner===i?"700":"500"}}>{d.name}</span>
            </div>
          ))}
        </div>
        {highlightedInner ? (
          <div style={{background:"rgba(124,58,237,0.12)",border:"1px solid rgba(124,58,237,0.25)",borderRadius:"10px",padding:"10px 12px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:highlightedInner.color,marginBottom:"4px"}}>✦ {highlightedInner.name}</div>
            <div style={{fontSize:"11px",color:"rgba(255,255,255,0.6)",lineHeight:1.5}}>{highlightedInner.pred}</div>
          </div>
        ) : (
          <div style={{background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:"10px",padding:"10px 12px"}}>
            <div style={{fontSize:"9px",fontWeight:"700",color:"#a78bfa",marginBottom:"4px",textAlign:"center"}}>✦ AI Insight</div>
            <div style={{fontSize:"10px",color:"rgba(255,255,255,0.6)",lineHeight:1.5,textAlign:"center"}}>{aiTip}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function YouTubeDashboard({ user, topic = "", initialTab = "analytics" }) {
  C = getThemeC();
  const userId = user?.user_id || localStorage.getItem("sociomee_user_id") || "";

  const [connected,      setConnected     ] = useState(false);
  const [channel,        setChannel       ] = useState(null);
  const [allChannels,    setAllChannels   ] = useState([]);
  const [activeChannelId,setActiveChannelId] = useState("");
  const [channelMenuOpen,setChannelMenuOpen] = useState(false);
  const [analytics,      setAnalytics     ] = useState(null);
  const [deepAnalytics, setDeepAnalytics] = useState(null);
  const [deepLoading, setDeepLoading] = useState(true);
  const [videos,         setVideos        ] = useState([]);
  const [prediction,     setPrediction    ] = useState(null);
  const [loading,        setLoading       ] = useState(true);
  const [activeChart,    setActiveChart   ] = useState("views");
  const [days,           setDays          ] = useState(30);
  const [activeTab,      setActiveTab     ] = useState(initialTab||"analytics");

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const statusRes = await fetch(`${BASE}/youtube/status/${userId}`);
      const status    = await statusRes.json();
      if (!status.connected) { setConnected(false); setLoading(false); return; }
      setConnected(true); setChannel(status);
      try {
        const chRes = await fetch(`${BASE}/youtube/channels/${userId}`);
        const chData = await chRes.json();
        setAllChannels(chData.channels || []);
        setActiveChannelId(chData.active_channel_id || "");
      } catch(e) {}
      const [analyticsRes, videosRes] = await Promise.all([
        fetch(`${BASE}/youtube/analytics/${userId}?days=${days}`),
        fetch(`${BASE}/youtube/all-videos/${userId}?max_results=100`),
      ]);
      const [analyticsData, videosData] = await Promise.all([analyticsRes.json(), videosRes.json()]);
      setAnalytics(analyticsData);
      setVideos(videosData.videos || []);
      fetch(`${BASE}/youtube/deep-analytics/${userId}?days=${days}`).then(r=>r.ok?r.json():null).then(d=>{if(d)setDeepAnalytics(d);setDeepLoading(false);}).catch(()=>{setDeepLoading(false);});
      if (topic) {
        const predRes = await fetch(`${BASE}/youtube/predict/${userId}?topic=${encodeURIComponent(topic)}`);
        setPrediction(await predRes.json());
      }
    } catch (e) { console.error("Dashboard load error:", e); }
    finally { setLoading(false); }
  }, [userId, days, topic]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div style={{ padding:"20px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"24px" }}>
        <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(255,255,255,0.06)", animation:"shimmer 1.4s infinite" }}/>
        <div style={{ flex:1 }}>
          <div style={{ height:14, width:"55%", borderRadius:8, background:"rgba(255,255,255,0.06)", marginBottom:8, animation:"shimmer 1.4s infinite" }}/>
          <div style={{ height:10, width:"35%", borderRadius:8, background:"rgba(255,255,255,0.06)", animation:"shimmer 1.4s infinite" }}/>
        </div>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" }}>
        {[80,65,90,105,85,100,80].map((w,i) => <div key={i} style={{ width:w, height:34, borderRadius:12, background:"rgba(255,255,255,0.06)", animation:"shimmer 1.4s infinite" }}/> )}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height:88, borderRadius:16, background:"rgba(255,255,255,0.06)", animation:"shimmer 1.4s infinite" }}/> )}
      </div>
      <div style={{ height:220, borderRadius:16, background:"rgba(255,255,255,0.06)", animation:"shimmer 1.4s infinite" }}/>
    </div>
  );
  if (!connected) return <ConnectYouTube userId={userId} />;

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif" }}>

      {/* Channel header with multi-channel switcher */}
      <div style={{ position:"relative", marginBottom:"14px", zIndex:10 }}>
        <div className="yt-channel-header" style={{ display:"flex", alignItems:"center", gap:"10px", background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:"14px", padding:"10px 14px" }}>
          {channel?.thumbnail
            ? <img src={channel.thumbnail} alt="" crossOrigin="anonymous" referrerPolicy="no-referrer" style={{ width:"36px", height:"36px", borderRadius:"50%", border:"2px solid rgba(255,255,255,0.2)", objectFit:"cover", flexShrink:0 }} onError={e => { e.target.style.display="none"; }} />
            : <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:`linear-gradient(135deg,${C.yt},#cc0000)`, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"16px", fontWeight:"900", flexShrink:0 }}>{(channel?.channel_title||"Y").charAt(0).toUpperCase()}</div>
          }
          <div style={{ flex:1, minWidth:0 }}>
            <div className="yt-channel-title" style={{ fontSize:"12px", fontWeight:"800", color:C.ink, lineHeight:1.2 }}>{channel?.channel_title || "Your Channel"}</div>
            <div className="yt-channel-sub" style={{ fontSize:"10px", color:C.muted }}>{fmt(channel?.video_count)} {yt("वीडियो","व्हिडिओ","videos")} · {fmt(channel?.subscribers)} {yt("सब्स","सदस्य","subs")}</div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"6px", flexShrink:0 }}>
            {allChannels.length > 1 && (
              <button onClick={() => setChannelMenuOpen(o => !o)} style={{ padding:"4px 9px", borderRadius:"99px", border:`1px solid ${C.purple}44`, background:C.purple+"15", color:C.purple, fontSize:"10px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:"4px" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                {allChannels.length} {yt("चैनल","चॅनेल","Channels")}
              </button>
            )}
            <button onClick={() => {
              const plan = user?.plan || "free";
              const limits = {free:1, pro:3, premium:7};
              const planKey = (plan||"free").startsWith("premium")?"premium":(plan||"free").startsWith("pro")?"pro":"free";
              const limit = limits[planKey] || 1;
              if (allChannels.length >= limit) {
                alert(`Your ${plan} plan allows up to ${limit} channel${limit>1?"s":""}. Upgrade to connect more.`);
              } else {
                sessionStorage.setItem("yt_connect_user_id", userId);
                fetch(`${BASE}/youtube/auth-url?redirect_uri=${encodeURIComponent(window.location.origin+"/youtube/callback")}`)
                  .then(r=>r.json()).then(d=>{ if(d.url) window.location.href=d.url; });
              }
            }} title="Add YouTube channel" style={{ width:"26px", height:"26px", borderRadius:"50%", border:`1px solid ${C.purple}44`, background:C.purple+"15", color:C.purple, fontSize:"16px", fontWeight:"700", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
            <button className="yt-disconnect-btn" onClick={() => { if (window.confirm("Disconnect this channel?")) { fetch(`${BASE}/youtube/disconnect-channel/${userId}?channel_id=${activeChannelId}`, {method:"DELETE"}).then(() => { if (allChannels.length <= 1) { setConnected(false); setChannel(null); } else { load(); } }); } }} style={{ padding:"4px 9px", borderRadius:"99px", border:`1px solid ${C.danger}44`, background:C.danger+"10", color:C.danger, fontSize:"10px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>{yt("डिस्कनेक्ट","डिस्कनेक्ट","Disconnect")}</button>
          </div>
        </div>
        {channelMenuOpen && allChannels.length > 1 && (
          <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:9999, background:"rgba(12,12,20,0.99)", border:`1px solid ${C.purple}44`, borderRadius:"12px", padding:"6px", boxShadow:"0 16px 48px rgba(0,0,0,0.6)", backdropFilter:"blur(20px)" }}>
            {allChannels.map(ch => (
              <div key={ch.channel_id} onClick={async () => {
                if (ch.channel_id === activeChannelId) { setChannelMenuOpen(false); return; }
                await fetch(`${BASE}/youtube/switch-channel/${userId}`, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({channel_id:ch.channel_id})});
                setActiveChannelId(ch.channel_id);
                setChannelMenuOpen(false);
                setChannel(null); setAnalytics(null); setVideos([]);
                setTimeout(() => load(), 100);
              }} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px 10px", borderRadius:"8px", cursor:"pointer", background:ch.channel_id===activeChannelId?C.purple+"22":"transparent", border:ch.channel_id===activeChannelId?`1px solid ${C.purple}44`:"1px solid transparent", marginBottom:"3px" }}>
                {ch.thumbnail_url
                  ? <img src={ch.thumbnail_url} alt="" style={{ width:"30px", height:"30px", borderRadius:"50%", objectFit:"cover" }}/>
                  : <div style={{ width:"30px", height:"30px", borderRadius:"50%", background:`linear-gradient(135deg,${C.yt},#cc0000)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"13px", fontWeight:"900" }}>{ch.channel_title?.charAt(0)}</div>
                }
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"11px", fontWeight:"700", color:C.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ch.channel_title}</div>
                  <div style={{ fontSize:"9px", color:C.muted }}>{fmt(ch.subscribers)} {yt("सब्स","सदस्य","subs")} · {fmt(ch.video_count)} {yt("वीडियो","व्हिडिओ","videos")}</div>
                </div>
                {ch.channel_id===activeChannelId && <span style={{ fontSize:"10px", color:C.purple, fontWeight:"800" }}>✓</span>}
              </div>
            ))}
            <div style={{ borderTop:`1px solid ${C.hairline}`, marginTop:"4px", paddingTop:"6px", textAlign:"center" }}>
              <span style={{ fontSize:"9px", color:C.muted }}>{allChannels.length} / {(()=>{const p=(user?.plan||"free"); return p.startsWith("premium")?7:p.startsWith("pro")?3:1;})()} channels · </span>
              <span style={{ fontSize:"9px", color:C.purple, cursor:"pointer", fontWeight:"700" }}>Upgrade plan</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="yt-tabs" style={{ display:"flex", gap:"6px", marginBottom:"20px", overflowX:"auto", flexWrap:"nowrap", paddingBottom:"6px", scrollbarWidth:"thin", scrollbarColor:"rgba(255,255,255,0.15) transparent" }}>
        {[
          ["analytics",yt("विश्लेषण","विश्लेषण","Analytics")],
          ["optimize",yt("ऑप्टिमाइज़","ऑप्टिमाइझ","Optimize")],
          ["seo","SEO"],
          ["revenue",yt("राजस्व","महसूल","Revenue")],
          ["competitors",yt("प्रतिद्वंद्वी","स्पर्धक","Competitors")],
          ["festival",yt("त्योहार कैलेंडर","सण कॅलेंडर","Festival Calendar")],
          ["milestones",yt("विकास माइलस्टोन","वाढ माइलस्टोन","Growth Milestones")],
          ["upload",yt("ऑटो-अपलोड","ऑटो-अपलोड","Auto-Upload")],

          ["sentiment",yt("कमेंट्स","टिप्पण्या","Comments")],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{ padding:"8px 16px", borderRadius:"99px", border:`1.5px solid ${activeTab===key ? "rgba(124,58,237,0.7)" : "rgba(124,58,237,0.18)"}`, background:activeTab===key ? "rgba(124,58,237,0.18)" : C.glass, backdropFilter:"blur(10px)", color:activeTab===key ? "#a78bfa" : C.muted, fontWeight:"800", fontSize:"12px", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap", boxShadow:activeTab===key ? "0 0 16px rgba(124,58,237,0.4)" : "none", transition:"all 0.2s" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── ANALYTICS TAB ── */}
      {activeTab === "analytics" && (
        <>
          <div className="yt-stat-grid" style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginBottom:"20px" }}>
            <StatCard icon="👥" label={yt("सब्सक्राइबर","सदस्य","Subscribers")}        value={fmt(channel?.subscribers)}       color={C.yt} />
            <StatCard icon="👁️" label={yt("कुल व्यूज़","एकूण व्ह्यूज","Total Views")}        value={fmt(channel?.total_views)}       color={C.purple} />
            <StatCard icon="📊" label={`${yt("व्यूज़","व्ह्यूज",yt("व्यूज़","व्ह्यूज","Views"))} (${days}d)`} value={fmt(analytics?.total_views)}     sub={analytics?.is_mock ? "Demo data" : ""} color={C.teal} />
            <StatCard icon="➕" label={`${yt("सब्स","सदस्य","Subs")} (${days}d)`}  value={`+${fmt(analytics?.total_subs)}`} color={C.success} />
          </div>
          <div style={{ background:"linear-gradient(135deg,rgba(124,58,237,0.12),rgba(99,102,241,0.08))", backdropFilter:"blur(16px)", border:"1px solid rgba(124,58,237,0.25)", borderRadius:"20px", padding:"20px", marginBottom:"20px", boxShadow:"0 0 40px rgba(124,58,237,0.1)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px", flexWrap:"wrap", gap:"6px" }}>
              <div>
                <span style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.2px", textTransform:"uppercase", color:"#a78bfa" }}>📈 {yt("चैनल विश्लेषण","चॅनेल विश्लेषण","Channel Analytics")}</span>
                <div style={{ fontSize:"22px", fontWeight:"900", color:"#fff", marginTop:"4px" }}>{activeChart==="views"?fmt(analytics?.total_views||0):fmt(analytics?.total_subs||0)}</div>
                <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.4)" }}>{yt("पिछले","मागील","Last")} {days} {yt("दिन","दिवस","days")}</div>
              </div>
              <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                {[[`views`,yt("व्यूज़","व्ह्यूज",yt("व्यूज़","व्ह्यूज","Views")),C.purple],[`subs`,yt("सब्स","सदस्य","Subs"),C.success]].map(([key,label,col]) => (
                  <button key={key} onClick={()=>setActiveChart(key)} style={{ padding:"4px 10px", borderRadius:"8px", border:`1px solid ${activeChart===key?col:C.hairline}`, background:activeChart===key?`${col}18`:"transparent", color:activeChart===key?col:C.muted, fontSize:"11px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>{label}</button>
                ))}
                {[7,30,90].map(d => (
                  <button key={d} onClick={()=>setDays(d)} style={{ padding:"4px 10px", borderRadius:"8px", border:`1px solid ${days===d?C.purple:C.hairline}`, background:days===d?`${C.purple}18`:"transparent", color:days===d?C.purple:C.muted, fontSize:"11px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>{d}d</button>
                ))}
              </div>
            </div>
            <div className="yt-chart-wrap" style={{ height:"200px", background:"transparent" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.chart_data||[]} margin={{top:4,right:4,left:-28,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="date" hide={true}/>
                  <YAxis tick={{fill:"rgba(255,255,255,0.25)",fontSize:9}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{background:"rgba(10,5,20,0.95)",border:"1px solid rgba(124,58,237,0.3)",borderRadius:"12px",fontSize:"11px",boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}} labelStyle={{color:"rgba(255,255,255,0.6)"}}/>
                  <Line type="monotone" dataKey={activeChart==="views"?"views":activeChart==="subs"?"subs":"minutes"} stroke={activeChart==="views"?"#7c3aed":activeChart==="subs"?"#10b981":"#f59e0b"} strokeWidth={2.5} dot={false} activeDot={{r:5,fill:activeChart==="views"?"#7c3aed":activeChart==="subs"?"#10b981":"#f59e0b",stroke:"#fff",strokeWidth:2}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            
          </div>

          <div className="yt-mini-stat-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px",marginBottom:"16px"}}>
            {[
              {label:"Watch Time",value:(analytics?.chart_data?Math.round(analytics.chart_data.reduce((a,r)=>a+(r.minutes||0),0)/60):0)+"h",sub:"Total minutes",color:"#f59e0b",icon:"⏱"},
              {label:"Avg Daily",value:analytics?.chart_data?Math.round(analytics.chart_data.reduce((a,r)=>a+(r.views||0),0)/(analytics.chart_data.length||1)):0,sub:"Views per day",color:"#7c3aed",icon:"📊"},
              {label:"Best Day",value:analytics?.chart_data?.length?analytics.chart_data.reduce((a,b)=>a.views>b.views?a:b).date?.slice(5):"—",sub:"Highest views",color:"#34d399",icon:"🚀"},
              {label:"New Subs",value:"+"+(analytics?.total_subs||0),sub:"This period",color:"#ff6eb5",icon:"📈"},
            ].map((s,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"12px",padding:"10px 8px"}}>
                <div style={{fontSize:"8px",fontWeight:"700",color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:"4px"}}>{s.label}</div>
                <div style={{fontSize:"16px",fontWeight:"900",color:s.color,lineHeight:1}}>{s.value}</div>
                <div style={{fontSize:"8px",color:"rgba(255,255,255,0.25)",marginTop:"3px"}}>{s.sub}</div>
              </div>
            ))}
          </div>

          {analytics?.chart_data?.length > 0 && (()=>{
            const data = analytics.chart_data;
            const totalViews = data.reduce((a,r)=>a+(r.views||0),0);
            const maxDay = data.reduce((a,b)=>a.views>b.views?a:b);
            const trend = data.slice(-7).reduce((a,r)=>a+(r.views||0),0) > data.slice(-14,-7).reduce((a,r)=>a+(r.views||0),0) ? "growing" : "declining";
            const watchHours = Math.round(data.reduce((a,r)=>a+(r.minutes||0),0)/60);
            const avgDuration = watchHours>0 && totalViews>0 ? Math.round((watchHours*60)/totalViews) : 0;
            const insights = [
              {icon:"🧠",title:"Momentum",value:trend==="growing"?"Growing":"Needs Boost",desc:trend==="growing"?"Last 7 days outperforming previous week. Keep uploading!":"Last 7 days below previous week. Try posting at 6-9 PM IST.",color:trend==="growing"?"#34d399":"#f59e0b"},
              {icon:"⚡",title:"Avg Duration",value:avgDuration+" min",desc:avgDuration>=3?"Viewers watch "+avgDuration+"+ min. Algorithm loves you.":"Add strong hook in first 30 seconds to retain viewers.",color:avgDuration>=3?"#34d399":"#f59e0b"},
              {icon:"🎯",title:"Best Day",value:maxDay.date?.slice(5)||"—",desc:"Your peak was "+maxDay.views+" views. Analyze that video and replicate it.",color:"#7c3aed"},
              {icon:"💡",title:"Growth Tip",value:totalViews>500?"Strong":"Building",desc:totalViews>500?"Post Shorts + 1 long-form weekly for 3x growth.":"Post 3-4 Shorts this week for 10x more impressions.",color:"#a78bfa"},
            ];
            return (
              <div style={{marginBottom:"20px"}}>
                <div style={{fontSize:"13px",fontWeight:"800",color:"#fff",marginBottom:"12px",display:"flex",alignItems:"center",gap:"8px"}}>
                  ✦ SocioMee AI Insights
                  <span style={{fontSize:"10px",color:"#a78bfa",background:"rgba(124,58,237,0.12)",padding:"2px 8px",borderRadius:"99px",fontWeight:"600"}}>Live Analysis</span>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"10px"}}>
                  {insights.map((ins,i)=>(
                    <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"14px",padding:"14px",borderLeft:"3px solid "+ins.color}}>
                      <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"6px"}}>
                        <span>{ins.icon}</span>
                        <span style={{fontSize:"10px",fontWeight:"700",color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.8px"}}>{ins.title}</span>
                      </div>
                      <div style={{fontSize:"16px",fontWeight:"900",color:ins.color,marginBottom:"4px"}}>{ins.value}</div>
                      <div style={{fontSize:"11px",color:"rgba(255,255,255,0.45)",lineHeight:1.5}}>{ins.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Deep Analytics Section - Always visible with skeleton */}
          {(()=>{
            const pulse = {animation:"pulse 1.5s ease-in-out infinite",background:"linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)",backgroundSize:"200% 100%"};
            if(deepLoading) return (
              <div style={{marginBottom:"20px"}}>
                <div style={{height:"16px",width:"140px",borderRadius:"8px",marginBottom:"16px",...pulse}}/>
                <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"16px",padding:"20px",marginBottom:"12px",display:"flex",gap:"24px",alignItems:"center"}}>
                  <div style={{width:"200px",height:"200px",borderRadius:"50%",...pulse,flexShrink:0}}/>
                  <div style={{flex:1,display:"flex",flexDirection:"column",gap:"10px"}}>
                    {[1,2,3,4,5].map(i=><div key={i} style={{height:"14px",borderRadius:"99px",...pulse,width:(90-i*10)+"%"}}/>)}
                    <div style={{height:"60px",borderRadius:"10px",marginTop:"8px",...pulse}}/>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
                  <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"14px",padding:"16px",height:"180px",...pulse}}/>
                  <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"14px",padding:"16px",height:"180px",...pulse}}/>
                </div>
              </div>
            );
            if(!deepAnalytics) return null;
            return (
            <div style={{marginBottom:"20px"}}>
              <div style={{fontSize:"13px",fontWeight:"800",color:"#fff",marginBottom:"12px",display:"flex",alignItems:"center",gap:"8px"}}>
                📡 Deep Analytics
                {deepAnalytics.is_mock && <span style={{fontSize:"9px",color:"rgba(255,255,255,0.3)",background:"rgba(255,255,255,0.05)",padding:"2px 8px",borderRadius:"99px"}}>Sample Data</span>}
              </div>

              {/* Traffic Sources Donut Chart */}
              {deepAnalytics.traffic_sources?.length>0 && (()=>{
                const labels = {YT_SEARCH:"YouTube Search",SUGGESTED_VIDEOS:"Suggested Videos",BROWSE_FEATURES:"Browse & Home",EXTERNAL:"External Links",NOTIFICATION:"Notifications",NO_LINK_EMBEDDED:"Embedded",PLAYLIST:"Playlist",YT_CHANNEL:"Channel Page",NO_LINK_OTHER:"Direct/Other",RELATED_VIDEO:"Related Videos",EXT_URL:"External URL",YT_OTHER_PAGE:"Other YouTube",SHORTS:"YouTube Shorts",SOUND_PAGE:"Sound Page",END_SCREEN:"End Screen",HASHTAGS:"Hashtags"};
                const COLORS = ["#7c3aed","#9333ea","#a78bfa","#c4b5fd","#6d28d9","#8b5cf6","#ddd6fe","#4c1d95","#ede9fe"];
                const total = deepAnalytics.traffic_sources.reduce((a,x)=>a+x.views,0);
                const top = deepAnalytics.traffic_sources.reduce((a,b)=>a.views>b.views?a:b);
                const topPct = Math.round(top.views/total*100);
                const topLabel = labels[top.source]||top.source;
                const aiTip = topPct>50?"Your channel is SEO-powered. Keep optimizing titles & tags.":topPct>30?"Good search presence. Also grow suggested video traffic.":"Diversify your traffic sources for stable growth.";
                const pieData = deepAnalytics.traffic_sources.map(t=>({name:labels[t.source]||t.source,value:t.views,pct:Math.round(t.views/total*100)}));
                return (
                  <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"16px",padding:"20px",marginBottom:"12px"}}>
                    <div style={{fontSize:"11px",fontWeight:"700",color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"16px"}}>🔀 Traffic Sources</div>
                    <div style={{display:"flex",alignItems:"center",gap:"16px",flexWrap:"wrap",justifyContent:"center"}}>
                      {/* Donut Chart */}
                      <div style={{position:"relative",flexShrink:0}}>
                        {(()=>{
                          const innerData = [
                            {name:"SEO Power",value:pieData.find(p=>p.name==="YouTube Search")?.value||0,pred:"Strong SEO. Titles & tags working well.",color:"#4c1d95"},
                            {name:"Discovery",value:(pieData.find(p=>p.name==="Suggested Videos")?.value||0)+(pieData.find(p=>p.name==="Browse & Home")?.value||0),pred:"Low discovery. Use trending thumbnails.",color:"#6d28d9"},
                            {name:"External",value:(pieData.find(p=>p.name==="External Links")?.value||0)+(pieData.find(p=>p.name==="External URL")?.value||0),pred:"Share videos on WhatsApp & Instagram.",color:"#7c3aed"},
                            {name:"Other",value:(pieData.find(p=>p.name==="YouTube Shorts")?.value||0)+(pieData.find(p=>p.name==="Channel Page")?.value||0),pred:"Post more Shorts for channel page traffic.",color:"#9333ea"},
                          ].filter(d=>d.value>0);
                          return <TrafficDonut pieData={pieData} COLORS={COLORS} topPct={topPct} topLabel={topLabel} aiTip={aiTip} innerData={innerData}/>;
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })()}
              <div className="yt-geo-row" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
                {deepAnalytics.countries?.length>0 && (
                  <SimpleDonut
                    title="🌍 Top Countries"
                    centerLabel="Countries"
                    colors={["#7c3aed","#9333ea","#a78bfa","#6d28d9","#c4b5fd"]}
                    data={deepAnalytics.countries.slice(0,5).map(ct=>({
                      name:({"IN":"🇮🇳 India","US":"🇺🇸 USA","GB":"🇬🇧 UK","CA":"🇨🇦 Canada","AU":"🇦🇺 Australia","PK":"🇵🇰 Pakistan","BD":"🇧🇩 Bangladesh","NP":"🇳🇵 Nepal","SG":"🇸🇬 Singapore","AE":"🇦🇪 UAE"})[ct.country]||("🌐 "+ct.country),
                      value:ct.views
                    }))}
                  />
                )}

                {deepAnalytics.devices?.length>0 && (
                  <SimpleDonut
                    title="📱 Devices"
                    centerLabel="Devices"
                    colors={["#7c3aed","#9333ea","#a78bfa","#6d28d9","#c4b5fd"]}
                    data={deepAnalytics.devices.map(d=>({
                      name:({"MOBILE":"📱 Mobile","COMPUTER":"💻 Desktop","DESKTOP":"💻 Desktop","TABLET":"📟 Tablet","TV":"📺 Smart TV","GAME_CONSOLE":"🎮 Console"})[d.device]||d.device,
                      value:d.views
                    }))}
                  />
                )}
              </div>

              {/* Search Terms */}
              {deepAnalytics.search_terms?.length>0 && (
                <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"14px",padding:"16px",marginBottom:"12px"}}>
                  <div style={{fontSize:"11px",fontWeight:"700",color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"12px"}}>🔍 Top Search Terms</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
                    {deepAnalytics.search_terms.map((s,i)=>(
                      <div key={i} style={{background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.2)",borderRadius:"99px",padding:"5px 12px",display:"flex",alignItems:"center",gap:"6px"}}>
                        <span style={{fontSize:"11px",color:"#c4b5fd",fontWeight:"600"}}>{s.term}</span>
                        <span style={{fontSize:"10px",color:"rgba(255,255,255,0.35)",fontWeight:"700"}}>{s.views}v</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Age Gender */}
              {deepAnalytics.age_gender?.length>0 && (
                <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"14px",padding:"16px"}}>
                  <div style={{fontSize:"11px",fontWeight:"700",color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"12px"}}>👥 Audience Demographics</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:"8px"}}>
                    {deepAnalytics.age_gender.map((a,i)=>(
                      <div key={i} style={{background:"rgba(255,255,255,0.02)",borderRadius:"10px",padding:"10px",textAlign:"center"}}>
                        <div style={{fontSize:"10px",color:"rgba(255,255,255,0.35)",marginBottom:"4px"}}>{a.age?.replace("AGE_","").replace("_","-")} · {a.gender}</div>
                        <div style={{fontSize:"16px",fontWeight:"900",color:a.gender==="male"?"#7c3aed":"#ff6eb5"}}>{Math.round(a.pct)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
          })()}

          <TopVideos videos={videos} />
        </>
      )}

      {activeTab === "optimize"   && <OptimizeTab    userId={userId} channel={channel} C={C} />}
      {activeTab === "seo"        && <SEOTab         userId={userId} channel={channel} C={C} prediction={prediction} topic={topic} />}
      {activeTab === "revenue"    && <RevenueTab     channel={channel} analytics={analytics} C={C} />}
      {activeTab === "competitors"&& <CompetitorTab  userId={userId} C={C} />}
      {activeTab === "festival"   && <FestivalCalendar />}
      {activeTab === "milestones" && <GrowthMilestones channel={channel} analytics={analytics} />}
      {activeTab === "upload"     && <YouTubeUpload  user={user} />}
      {activeTab === "performance" && <VideoPerformance userId={userId}/>}
        {activeTab === "sentiment"  && <SentimentTab   userId={userId} channel={channel} C={C} />}
    </div>
  );
}
