/**
 * YouTubeDashboard.js — SocioMee YouTube Analytics Dashboard
 * Tabs: Analytics | Auto-Upload | Festival Calendar | Growth Milestones
 */

import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import YouTubeUpload from "./YouTubeUpload";

const BASE = "https://sociomee.in/api";

function getThemeC() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  return dark ? {
    rose:"#ff6eb5", purple:"#a78bfa", purpleXlt:"#150d2a",
    teal:"#22d3ee", ink:"#ede8ff", slate:"#c4b5fd",
    muted:"#9d86c8", hairline:"rgba(167,139,250,0.15)",
    glass:"rgba(22,14,42,0.82)", white:"#ede8ff",
    success:"#34d399", warn:"#fbbf24", danger:"#f87171", yt:"#ff0000",
  } : {
    rose:"#ff3d8f", purple:"#7c3aed", purpleXlt:"#f5f3ff",
    teal:"#0891b2", ink:"#0d0015", slate:"#3b1f4e",
    muted:"#8b6b9a", hairline:"rgba(124,58,237,0.12)",
    glass:"rgba(255,255,255,0.68)", white:"#ffffff",
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
    { name:"Eid ul-Fitr",       date:"2026-03-31", emoji:"🌙", color:"#00c853", topics:["Eid special vlog","Eid outfit ideas","Eid recipes","Eid Mubarak wishes","Eid celebration"] },
    { name:"Holi",              date:"2026-03-30", emoji:"🎨", color:"#ff6b35", topics:["Holi celebration vlog","Holi makeup tutorial","Holi food recipes","Holi prank","Holi party ideas"] },
    { name:"Ram Navami",        date:"2026-04-17", emoji:"🙏", color:"#ff9500", topics:["Ram Navami special","Bhajan compilation","Ram Navami recipes","Ram katha"] },
    { name:"Akshaya Tritiya",   date:"2026-04-28", emoji:"🪙", color:"#ffd700", topics:["Gold buying guide India","Akshaya Tritiya tips","Best gold investment 2026","Dhanteras vs Akshaya Tritiya"] },
    { name:"Mother's Day",      date:"2026-05-11", emoji:"💐", color:"#ff69b4", topics:["Mother's Day special vlog","Gift ideas for mom","Mom surprise video","Mother's Day cooking","Emotional mom video"] },
    { name:"Bakra Eid",         date:"2026-06-08", emoji:"🌙", color:"#00c853", topics:["Eid ul-Adha vlog","Eid recipes","Bakra Eid celebration","Eid traditions India"] },
    { name:"Independence Day",  date:`${y}-08-15`, emoji:"🇮🇳", color:"#ff9500", topics:["Independence Day special","India 78 years","Desh bhakti songs","Freedom fighters story","15 August vlog"] },
    { name:"Raksha Bandhan",    date:"2026-08-09", emoji:"🪢", color:"#ff6b9d", topics:["Rakhi gift ideas 2026","Raksha Bandhan vlog","DIY Rakhi making","Brother sister bond","Rakhi celebration"] },
    { name:"Janmashtami",       date:"2026-08-16", emoji:"🦚", color:"#4caf50", topics:["Janmashtami special","Krishna bhajan","Dahi Handi vlog","Janmashtami decoration","Lord Krishna stories"] },
    { name:"Ganesh Chaturthi",  date:"2026-08-23", emoji:"🐘", color:"#ff6b35", topics:["Ganesh Chaturthi decoration","Eco-friendly Ganpati","Modak recipe","Ganpati visarjan","10 day celebration"] },
    { name:"Navratri",          date:"2026-09-24", emoji:"🪔", color:"#ff4081", topics:["Navratri garba dance","Navratri outfit ideas","Navratri fasting recipes","Dandiya night vlog","9 days special"] },
    { name:"Dussehra",          date:"2026-10-03", emoji:"🏹", color:"#ff6b35", topics:["Dussehra celebration vlog","Ravana dahan","Good over evil","Dussehra special","Ramlila highlights"] },
    { name:"Karva Chauth",      date:"2026-10-17", emoji:"🌕", color:"#ffd700", topics:["Karva Chauth makeup","Karva Chauth outfit","Thali decoration ideas","Karva Chauth vlog","Sargi recipes"] },
    { name:"Dhanteras",         date:"2026-10-28", emoji:"🪙", color:"#ffd700", topics:["Dhanteras shopping guide","What to buy on Dhanteras","Gold vs silver Dhanteras","Dhanteras puja vidhi"] },
    { name:"Diwali",            date:"2026-10-29", emoji:"🪔", color:"#ff9500", topics:["Diwali decoration ideas","Diwali outfit 2026","Diwali sweets recipe","Diwali vlog","Diwali rangoli","Diwali puja"] },
    { name:"Bhai Dooj",         date:"2026-10-31", emoji:"❤️", color:"#e91e63", topics:["Bhai Dooj gift ideas","Brother sister vlog","Bhai Dooj celebration","Tilak ceremony"] },
    { name:"Chhath Puja",       date:"2026-11-02", emoji:"☀️", color:"#ff9500", topics:["Chhath Puja vlog","Thekua recipe","Arghya ghat celebration","Chhath Puja traditions","Sunrise prayer"] },
    { name:"Guru Nanak Jayanti",date:"2026-11-14", emoji:"🙏", color:"#ff9500", topics:["Gurpurab special","Gurbani shabads","Langar recipes","Sikh traditions","Waheguru shabad"] },
    { name:"Christmas",         date:`${y}-12-25`, emoji:"🎄", color:"#00c853", topics:["Christmas decoration India","Christmas gift ideas","Christmas recipes","Christmas vlog","Secret Santa ideas"] },
    { name:"New Year",          date:`${y+1}-01-01`, emoji:"🎆", color:"#7c3aed", topics:["New Year resolutions 2027","New Year party ideas","Best of 2026 recap","New Year countdown vlog","Goals 2027"] },
    { name:"Republic Day",      date:`${y}-01-26`, emoji:"🇮🇳", color:"#ff9500", topics:["Republic Day special","India constitution facts","Patriotic songs","26 January parade","Republic Day speech"] },
    { name:"Valentine's Day",   date:`${y}-02-14`, emoji:"❤️", color:"#e91e63", topics:["Valentine's Day gifts India","Valentine's vlog","Date ideas India","Valentine's makeup","Couple goals"] },
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
    <div style={{ background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:"16px", padding:"18px 20px", flex:1, minWidth:"120px" }}>
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
  const label = metric === "views" ? "Views" : "Subscribers";
  const formatted = (data || []).map(d => ({ ...d, date: d.date?.slice(5) }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={formatted} margin={{ top:5, right:10, left:-20, bottom:0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.hairline} />
        <XAxis dataKey="date" tick={{ fontSize:10, fill:C.muted }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize:10, fill:C.muted }} tickLine={false} axisLine={false} tickFormatter={fmt} />
        <Tooltip contentStyle={{ background:C.white, border:`1px solid ${C.hairline}`, borderRadius:"10px", fontSize:"12px" }} formatter={(val) => [fmt(val), label]} />
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
    <div style={{ background:`linear-gradient(145deg,${C.purpleXlt},#fff0f7)`, border:`1.5px solid ${C.purple}33`, borderRadius:"16px", padding:"20px", marginBottom:"20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"14px" }}>
        <div>
          <div style={{ fontSize:"11px", fontWeight:"900", letterSpacing:"1.5px", textTransform:"uppercase", color:C.purple, marginBottom:"4px" }}>✦ SocioMee AI Prediction</div>
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

function TopVideos({ videos }) {
  if (!videos?.length) return <p style={{ color:C.muted, fontSize:"13px", textAlign:"center", padding:"20px" }}>No videos found.</p>;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
      {videos.map((v, i) => (
        <a key={i} href={v.url} target="_blank" rel="noreferrer" style={{ display:"flex", gap:"12px", alignItems:"center", background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:"12px", padding:"10px 14px", textDecoration:"none" }}>
          <div style={{ width:"28px", height:"28px", borderRadius:"6px", background:`${C.purple}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", fontWeight:"800", color:C.purple, flexShrink:0 }}>#{i+1}</div>
          {v.thumbnail && <img src={v.thumbnail} alt="" style={{ width:"64px", height:"36px", borderRadius:"6px", objectFit:"cover", flexShrink:0 }} />}
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:"12.5px", fontWeight:"700", color:C.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.title}</div>
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

// ── FESTIVAL CALENDAR TAB ────────────────────────────────────────────
function FestivalCalendar() {
  C = getThemeC();
  const [selected, setSelected] = useState(null);
  const festivals = getUpcomingFestivals();

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
    if (days <= 30) return `${days} days away`;
    return `${days} days away`;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${C.purple}22,${C.rose}18)`, border:`1.5px solid ${C.purple}33`, borderRadius:"16px", padding:"16px 18px", marginBottom:"16px" }}>
        <div style={{ fontSize:"11px", fontWeight:"900", letterSpacing:"1.5px", textTransform:"uppercase", color:C.purple, marginBottom:"6px" }}>✦ SocioMee Festival Intelligence</div>
        <div style={{ fontSize:"14px", fontWeight:"700", color:C.ink, lineHeight:1.5 }}>Plan your content around Indian festivals — upload 7-10 days before for maximum reach 🚀</div>
      </div>

      {/* Festival cards */}
      <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
        {festivals.map((f, i) => {
          const isSelected = selected === i;
          const col = urgencyColor(f.daysUntil);
          return (
            <div key={i} onClick={() => setSelected(isSelected ? null : i)}
              style={{ background:C.glass, border:`1.5px solid ${isSelected ? col : C.hairline}`, borderRadius:"14px", padding:"14px 16px", cursor:"pointer", transition:"all 0.2s", boxShadow:isSelected?`0 4px 20px ${col}22`:"none" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                  <div style={{ width:"44px", height:"44px", borderRadius:"12px", background:`${f.color}20`, border:`1.5px solid ${f.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>{f.emoji}</div>
                  <div>
                    <div style={{ fontSize:"14px", fontWeight:"800", color:C.ink }}>{f.name}</div>
                    <div style={{ fontSize:"11px", color:C.muted, marginTop:"2px" }}>{new Date(f.date).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}</div>
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:"12px", fontWeight:"900", color:col, padding:"4px 10px", background:`${col}18`, borderRadius:"99px", border:`1px solid ${col}33` }}>{urgencyLabel(f.daysUntil)}</div>
                </div>
              </div>

              {isSelected && (
                <div style={{ marginTop:"14px", paddingTop:"14px", borderTop:`1px solid ${C.hairline}` }}>
                  <div style={{ fontSize:"11px", fontWeight:"800", color:C.muted, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"10px" }}>✦ SocioMee Recommended Topics</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                    {f.topics.map((t, j) => (
                      <div key={j} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:`${C.purple}08`, border:`1px solid ${C.purple}22`, borderRadius:"10px", padding:"8px 12px" }}>
                        <span style={{ fontSize:"12.5px", color:C.ink, fontWeight:"600" }}>📹 {t}</span>
                        <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(t); }}
                          style={{ fontSize:"10px", padding:"3px 8px", borderRadius:"6px", border:`1px solid ${C.hairline}`, background:"transparent", color:C.muted, cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>Copy</button>
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
    { label:"Current pace", multiplier:1, color:C.muted },
    { label:"2x uploads/week", multiplier:2, color:C.warn },
    { label:"Trending topics + Festivals", multiplier:3.5, color:C.success },
    { label:"SocioMee AI strategy", multiplier:5, color:C.purple },
  ];

  return (
    <div>
      {/* Current status */}
      <div style={{ background:`linear-gradient(135deg,${currentBadge.color}22,${currentBadge.color}08)`, border:`1.5px solid ${currentBadge.color}44`, borderRadius:"16px", padding:"18px", marginBottom:"16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
          <div style={{ fontSize:"40px" }}>{currentBadge.emoji}</div>
          <div>
            <div style={{ fontSize:"11px", fontWeight:"900", letterSpacing:"1.5px", textTransform:"uppercase", color:C.muted, marginBottom:"4px" }}>Current Status</div>
            <div style={{ fontSize:"20px", fontWeight:"900", color:currentBadge.color }}>{currentBadge.label}</div>
            <div style={{ fontSize:"12px", color:C.muted, marginTop:"2px" }}>{fmt(currentSubs)} subscribers · Growing ~{Math.round(dailyGrowth)}/day</div>
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
        <div style={{ fontSize:"11px", fontWeight:"900", letterSpacing:"1.2px", textTransform:"uppercase", color:C.muted, marginBottom:"16px" }}>✦ SocioMee Milestone Predictions</div>
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
                      <div style={{ fontSize:"11px", color:C.muted }}>{badge.label} · {fmt(m.subsNeeded)} subs needed</div>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    {m.eta ? (
                      <>
                        <div style={{ fontSize:"13px", fontWeight:"800", color:C.ink }}>{m.eta}</div>
                        <div style={{ fontSize:"10px", color:C.muted }}>{m.months} months away</div>
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
        <div style={{ fontSize:"11px", fontWeight:"900", letterSpacing:"1.2px", textTransform:"uppercase", color:C.muted, marginBottom:"16px" }}>🚀 What If? — Growth Scenarios for 100K</div>
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
export default function YouTubeDashboard({ user, topic = "" }) {
  C = getThemeC();
  const userId = user?.user_id || localStorage.getItem("sociomee_user_id") || "";

  const [connected,   setConnected  ] = useState(false);
  const [channel,     setChannel    ] = useState(null);
  const [analytics,   setAnalytics  ] = useState(null);
  const [videos,      setVideos     ] = useState([]);
  const [prediction,  setPrediction ] = useState(null);
  const [loading,     setLoading    ] = useState(true);
  const [activeChart, setActiveChart] = useState("views");
  const [days,        setDays       ] = useState(30);
  const [activeTab,   setActiveTab  ] = useState("analytics");

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const statusRes = await fetch(`${BASE}/youtube/status/${userId}`);
      const status    = await statusRes.json();
      if (!status.connected) { setConnected(false); setLoading(false); return; }
      setConnected(true); setChannel(status);
      const [analyticsRes, videosRes] = await Promise.all([
        fetch(`${BASE}/youtube/analytics/${userId}?days=${days}`),
        fetch(`${BASE}/youtube/videos/${userId}?max_results=8`),
      ]);
      const [analyticsData, videosData] = await Promise.all([analyticsRes.json(), videosRes.json()]);
      setAnalytics(analyticsData);
      setVideos(videosData.videos || []);
      if (topic) {
        const predRes  = await fetch(`${BASE}/youtube/predict/${userId}?topic=${encodeURIComponent(topic)}`);
        setPrediction(await predRes.json());
      }
    } catch (e) { console.error("Dashboard load error:", e); }
    finally { setLoading(false); }
  }, [userId, days, topic]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (!connected) return <ConnectYouTube userId={userId} />;

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif" }}>

      {/* Channel header */}
      <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"20px", background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:"16px", padding:"14px 18px" }}>
        {channel?.thumbnail
          ? <img src={channel.thumbnail} alt="" crossOrigin="anonymous" referrerPolicy="no-referrer" style={{ width:"48px", height:"48px", borderRadius:"50%", border:`2px solid ${C.yt}44`, objectFit:"cover", flexShrink:0 }} onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
          : null
        }
        <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:`linear-gradient(135deg,${C.yt},#cc0000)`, display:channel?.thumbnail?"none":"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"20px", fontWeight:"900", flexShrink:0 }}>
          {(channel?.channel_title || "Y").charAt(0).toUpperCase()}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:"15px", fontWeight:"800", color:C.ink }}>{channel?.channel_title || "Your Channel"}</div>
          <div style={{ fontSize:"11.5px", color:C.muted }}>{fmt(channel?.video_count)} videos · {fmt(channel?.subscribers)} subscribers</div>
        </div>
        <button onClick={() => { if (window.confirm("Disconnect YouTube?")) { fetch(`${BASE}/youtube/disconnect/${userId}`, {method:"POST"}).then(() => { setConnected(false); setChannel(null); }); } }} style={{ padding:"5px 12px", borderRadius:"99px", border:`1px solid ${C.danger}44`, background:C.danger+"10", color:C.danger, fontSize:"11.5px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>Disconnect</button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"6px", marginBottom:"20px", flexWrap:"wrap" }}>
        {[
          ["analytics","📊 Analytics"],
          ["upload","📤 Auto-Upload"],
          ["festival","🎉 Festival Calendar"],
          ["milestones","📈 Growth Milestones"],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{ padding:"8px 14px", borderRadius:"12px", border:`1.5px solid ${activeTab===key ? C.yt : C.hairline}`, background:activeTab===key ? `${C.yt}15` : C.glass, color:activeTab===key ? C.yt : C.muted, fontWeight:"800", fontSize:"12px", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── ANALYTICS TAB ── */}
      {activeTab === "analytics" && (
        <>
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginBottom:"20px" }}>
            <StatCard icon="👥" label="Subscribers"      value={fmt(channel?.subscribers)}     color={C.yt} />
            <StatCard icon="👁️" label="Total Views"      value={fmt(channel?.total_views)}     color={C.purple} />
            <StatCard icon="📊" label={`Views (${days}d)`} value={fmt(analytics?.total_views)} sub={analytics?.is_mock ? "Demo data" : ""} color={C.teal} />
            <StatCard icon="➕" label={`Subs (${days}d)`}  value={`+${fmt(analytics?.total_subs)}`} color={C.success} />
          </div>
          <div style={{ background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:"16px", padding:"18px", marginBottom:"20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px", flexWrap:"wrap", gap:"6px" }}>
              <span style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.2px", textTransform:"uppercase", color:C.muted }}>📈 Channel Analytics</span>
              <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                {[["views","Views",C.purple],["subs","Subs",C.success]].map(([key,label,col]) => (
                  <button key={key} onClick={() => setActiveChart(key)} style={{ padding:"4px 10px", borderRadius:"99px", border:`1.5px solid ${activeChart===key?col:C.hairline}`, background:activeChart===key?col+"18":"rgba(255,255,255,0.5)", color:activeChart===key?col:C.muted, fontSize:"11.5px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>{label}</button>
                ))}
                {[7,30,90].map(d => (
                  <button key={d} onClick={() => setDays(d)} style={{ padding:"4px 10px", borderRadius:"99px", border:`1.5px solid ${days===d?C.teal:C.hairline}`, background:days===d?C.teal+"18":"rgba(255,255,255,0.5)", color:days===d?C.teal:C.muted, fontSize:"11.5px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>{d}d</button>
                ))}
              </div>
            </div>
            {analytics?.chart_data?.length > 0
              ? <AnalyticsChart data={analytics.chart_data} metric={activeChart} color={activeChart==="views"?C.purple:C.success} />
              : <p style={{ textAlign:"center", color:C.muted, fontSize:"13px", padding:"40px 0" }}>No analytics data available yet.</p>
            }
            {analytics?.is_mock && <p style={{ textAlign:"center", fontSize:"10.5px", color:C.muted, marginTop:"8px" }}>⚠ Demo data — real data loads from YouTube Analytics API</p>}
          </div>
          {topic && <GrowthPrediction prediction={prediction} topic={topic} />}
          <div style={{ background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:"16px", padding:"18px" }}>
            <div style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.2px", textTransform:"uppercase", color:C.muted, marginBottom:"14px" }}>🎬 Top Videos by Views</div>
            <TopVideos videos={videos} />
          </div>
        </>
      )}

      {/* ── UPLOAD TAB ── */}
      {activeTab === "upload" && (
        <div style={{ background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:"16px", padding:"18px" }}>
          <YouTubeUpload user={user} />
        </div>
      )}

      {/* ── FESTIVAL CALENDAR TAB ── */}
      {activeTab === "festival" && <FestivalCalendar />}

      {/* ── GROWTH MILESTONES TAB ── */}
      {activeTab === "milestones" && <GrowthMilestones channel={channel} analytics={analytics} />}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
    </div>
  );
}