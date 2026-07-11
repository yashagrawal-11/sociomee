/**
 * HistoryPanel.js — SocioMee Content History
 * Shows past generations with skeleton loading screens
 * Matches App.js dark/light theme system exactly
 */

import { useState, useEffect, useCallback } from "react";

const BASE = "https://sociomeeai.com/api";

function getC() {
  const dark = true;
  return dark ? {
    purple:"#a78bfa", rose:"#ff6eb5", teal:"#22d3ee",
    ink:"#ffffff", slate:"#d1d5db", muted:"rgba(255,255,255,0.45)",
    hairline:"rgba(255,255,255,0.08)", glass:"rgba(255,255,255,0.04)",
    success:"#34d399", warn:"#fbbf24", danger:"#f87171",
    pillBg:"rgba(255,255,255,0.06)", inputBg:"rgba(255,255,255,0.05)",
  } : {
    purple:"#7c3aed", rose:"#ff3d8f", teal:"#0891b2",
    ink:"#0d0015", slate:"#3b1f4e", muted:"#8b6b9a",
    hairline:"rgba(124,58,237,0.12)", glass:"rgba(255,255,255,0.68)",
    success:"#10b981", warn:"#f59e0b", danger:"#ef4444",
    pillBg:"rgba(255,255,255,0.5)", inputBg:"rgba(255,255,255,0.7)",
  };
}

const PLATFORM_META = {
  youtube:   { color:"#ff0000", icon:"/icons/youtube.png" },
  instagram: { color:"#e1306c", icon:"/icons/instagram.png" },
  linkedin:  { color:"#0077b5", icon:"/icons/linkedin.png" },
  reddit:    { color:"#ff4500", icon:"/icons/reddit.png" },
  threads:   { color:"#ffffff", icon:"/icons/threads.png" },
  pinterest: { color:"#e60023", icon:"/icons/pinterest.png" },
  telegram:  { color:"#2aabee", icon:"/icons/telegram.png" },
  facebook:  { color:"#1877f2", icon:"/icons/facebook.png" },
  tiktok:    { color:"#010101", icon:"/icons/tiktok.png" },
  x:         { color:"#ffffff", icon:"/icons/x.png" },
  quora:     { color:"#b92b27", icon:"/icons/quora.png" },
};

const Icon = {
  history: (p) => <svg width={p&&p.s||16} height={p&&p.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  refresh: (p) => <svg width={p&&p.s||13} height={p&&p.s||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>,
  reuse: (p) => <svg width={p&&p.s||13} height={p&&p.s||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>,
  copy: (p) => <svg width={p&&p.s||13} height={p&&p.s||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  check: (p) => <svg width={p&&p.s||13} height={p&&p.s||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  download: (p) => <svg width={p&&p.s||13} height={p&&p.s||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  trash: (p) => <svg width={p&&p.s||13} height={p&&p.s||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  warn: (p) => <svg width={p&&p.s||16} height={p&&p.s||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  empty: (p) => <svg width={p&&p.s||36} height={p&&p.s||36} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
};

function PlatformIcon({ platform, size }) {
  const s = size || 12;
  const pm = PLATFORM_META[platform];
  if (!pm) return null;
  return <img src={pm.icon} alt={platform} style={{ width:s, height:s, objectFit:"contain", borderRadius:2 }} onError={e=>e.target.style.display="none"}/>;
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return mins + "m ago";
  if (hours < 24) return hours + "h ago";
  if (days < 7)   return days + "d ago";
  return new Date(iso).toLocaleDateString("en-IN", { day:"numeric", month:"short" });
}

function SkeletonCard() {
  const C = getC();
  return (
    <div style={{ background:C.glass, border:"1px solid " + C.hairline, borderRadius:14, padding:"14px 16px", marginBottom:10 }}>
      <style>{"@keyframes shimmer { 0% { background-position: -400px 0; } 100% { background-position: 400px 0; } } .skeleton { background: linear-gradient(90deg, " + C.hairline + " 25%, " + C.pillBg + " 50%, " + C.hairline + " 75%); background-size: 400px 100%; animation: shimmer 1.4s ease infinite; border-radius: 6px; }"}</style>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div className="skeleton" style={{ height:14, width:"60%", borderRadius:6 }} />
        <div className="skeleton" style={{ height:20, width:60, borderRadius:99 }} />
      </div>
      <div className="skeleton" style={{ height:11, width:"90%", marginBottom:6 }} />
      <div className="skeleton" style={{ height:11, width:"75%", marginBottom:10 }} />
      <div style={{ display:"flex", gap:6 }}>
        <div className="skeleton" style={{ height:22, width:70, borderRadius:99 }} />
        <div className="skeleton" style={{ height:22, width:60, borderRadius:99 }} />
        <div className="skeleton" style={{ height:22, width:80, borderRadius:99 }} />
      </div>
    </div>
  );
}

function HistoryCard({ item, onDelete, onReuse }) {
  const C = getC();
  const pm = PLATFORM_META[item.platform] || { color:C.purple };
  const [deleting, setDeleting] = useState(false);
  const [copied,   setCopied  ] = useState(false);
  const [hovered,  setHovered ] = useState(false);
  const previewLower = (item.preview || "").toLowerCase();
  const isFailed = previewLower.indexOf("script generation failed") !== -1 || previewLower.indexOf("gemini") !== -1;

  const handleDelete = async () => {
    setDeleting(true);
    onDelete(item.id);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(item.best_title || item.topic);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownloadPDF = () => {
    const date = new Date(item.created_at).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" });
    const titleSafe = item.best_title || item.topic;
    let html = "<!DOCTYPE html><html><head><meta charset='utf-8'/><title>" + titleSafe + "</title>";
    html += "<style>@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Poppins:wght@400;600;700;800&display=swap');";
    html += "body{font-family:'Poppins',sans-serif;background:#0a0a0a;color:#fff;margin:0;padding:40px;}";
    html += ".header{padding:0 0 20px 0;margin-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.06);}";
    html += ".logo{font-size:22px;font-weight:800;letter-spacing:3px;margin-bottom:4px;font-family:Orbitron,sans-serif;}";
    html += ".subtitle{font-size:10px;color:rgba(255,255,255,0.3);letter-spacing:1.5px;text-transform:uppercase;}";
    html += ".platform-badge{display:inline-block;background:" + pm.color + "22;border:1px solid " + pm.color + "55;color:" + pm.color + ";font-size:11px;font-weight:700;padding:3px 12px;border-radius:99px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;}";
    html += ".title{font-size:22px;font-weight:800;color:#fff;line-height:1.3;margin-bottom:8px;}";
    html += ".meta{font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:24px;}";
    html += ".section{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;margin-bottom:16px;}";
    html += ".section-label{font-size:9px;font-weight:700;color:#a78bfa;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;}";
    html += ".content{font-size:13px;color:rgba(255,255,255,0.85);line-height:1.8;white-space:pre-wrap;}";
    html += ".tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}";
    html += ".tag{background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.25);color:#a78bfa;font-size:10px;font-weight:600;padding:3px 10px;border-radius:99px;}";
    html += ".footer{text-align:center;margin-top:32px;font-size:10px;color:rgba(255,255,255,0.2);}</style></head><body>";
    html += "<div class='header'><div class='logo'>SOCIOMEE</div><div class='subtitle'>One Topic. Infinite Content.</div></div>";
    html += "<div class='platform-badge'>" + item.platform + "</div>";
    html += "<div class='title'>" + titleSafe + "</div>";
    html += "<div class='meta'>Generated on " + date + " · " + (item.word_count || 0) + " words · " + (item.language || "english") + "</div>";
    if (item.preview) html += "<div class='section'><div class='section-label'>Content Preview</div><div class='content'>" + item.preview + "</div></div>";
    if (item.description) html += "<div class='section'><div class='section-label'>Description</div><div class='content'>" + item.description + "</div></div>";
    if (item.caption) html += "<div class='section'><div class='section-label'>Caption</div><div class='content'>" + item.caption + "</div></div>";
    if (item.post) html += "<div class='section'><div class='section-label'>Post Content</div><div class='content'>" + item.post + "</div></div>";
    if (item.hashtags && item.hashtags.length > 0) html += "<div class='section'><div class='section-label'>Hashtags</div><div class='tags'>" + item.hashtags.map(function(h){return "<span class='tag'>" + h + "</span>";}).join("") + "</div></div>";
    if (item.seo_tags && item.seo_tags.length > 0) html += "<div class='section'><div class='section-label'>SEO Tags</div><div class='tags'>" + item.seo_tags.map(function(t){return "<span class='tag'>" + t + "</span>";}).join("") + "</div></div>";
    html += "<div class='footer'>Generated by SocioMee AI · sociomeeai.com</div></body></html>";
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = titleSafe.replace(/[^a-z0-9]/gi,"_").substring(0,50) + "_SocioMee.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>setHovered(false)}
      style={{
        background:C.glass, backdropFilter:"blur(14px)",
        border:"1px solid " + (hovered ? pm.color + "40" : C.hairline),
        borderRadius:16, padding:"16px 18px", marginBottom:10,
        transition:"all 0.2s ease", opacity:deleting?0.4:1,
        boxShadow:hovered ? "0 6px 24px rgba(0,0,0,0.25)" : "none",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
      }}
    >
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10, gap:10 }}>
        <div style={{ display:"flex", gap:10, flex:1, minWidth:0 }}>
          <div style={{
            width:34, height:34, borderRadius:10, flexShrink:0,
            background:pm.color + "15", border:"1px solid " + pm.color + "30",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}>
            <PlatformIcon platform={item.platform} size={17}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13.5, fontWeight:700, color:C.ink, lineHeight:1.4, marginBottom:4 }}>
              {item.best_title || item.topic}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
              <span style={{ fontSize:10, fontWeight:800, color:pm.color, background:pm.color + "15", border:"1px solid " + pm.color + "33", borderRadius:99, padding:"2px 9px", textTransform:"uppercase", letterSpacing:"0.5px" }}>
                {item.platform}
              </span>
              <span style={{ fontSize:10.5, color:C.muted, fontWeight:600 }}>{timeAgo(item.created_at)}</span>
              {item.word_count > 0 && <span style={{ fontSize:10.5, color:C.muted }}>· {item.word_count} words</span>}
              {item.language && <span style={{ fontSize:10.5, color:C.muted, textTransform:"capitalize" }}>· {item.language}</span>}
            </div>
          </div>
        </div>
        {isFailed && (
          <span style={{ display:"flex", alignItems:"center", gap:4, fontSize:9.5, fontWeight:700, color:C.warn, background:C.warn + "15", border:"1px solid " + C.warn + "35", borderRadius:99, padding:"3px 8px", flexShrink:0 }}>
            <Icon.warn s={11}/> Failed
          </span>
        )}
      </div>

      {item.preview && (
        <div style={{ fontSize:12, color:isFailed?C.danger:C.muted, lineHeight:1.6, marginBottom:11, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
          {item.preview}
        </div>
      )}

      {item.hashtags && item.hashtags.length > 0 && (
        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:11 }}>
          {item.hashtags.slice(0,4).map((h, i) => (
            <span key={i} style={{ fontSize:10.5, fontWeight:600, color:C.purple, background:C.purple + "12", border:"1px solid " + C.purple + "25", borderRadius:99, padding:"3px 9px" }}>{h}</span>
          ))}
        </div>
      )}

      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
        <button onClick={() => onReuse(item)} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 13px", borderRadius:99, border:"1.5px solid " + C.purple + "44", background:C.purple + "10", color:C.purple, fontSize:11.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          <Icon.reuse/> Reuse
        </button>
        <button onClick={handleCopy} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 13px", borderRadius:99, border:"1.5px solid " + C.hairline, background:"transparent", color:copied?C.success:C.muted, fontSize:11.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          {copied ? (<><Icon.check/> Copied</>) : (<><Icon.copy/> Copy Title</>)}
        </button>
        <button onClick={handleDownloadPDF} title="Download as PDF" style={{ display:"flex", alignItems:"center", gap:5, marginLeft:"auto", padding:"6px 12px", borderRadius:99, border:"1px solid " + C.purple + "30", background:C.purple + "08", color:C.purple, fontSize:11.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          <Icon.download/> PDF
        </button>
        <button onClick={handleDelete} style={{ display:"flex", alignItems:"center", padding:"6px 10px", borderRadius:99, border:"1px solid " + C.danger + "30", background:"transparent", color:C.danger, cursor:"pointer", fontFamily:"inherit", opacity:0.75 }}>
          <Icon.trash/>
        </button>
      </div>
    </div>
  );
}

function EmptyState({ C }) {
  return (
    <div style={{ textAlign:"center", padding:"48px 20px" }}>
      <div style={{ width:64, height:64, borderRadius:18, background:C.purple + "10", border:"1px solid " + C.purple + "25", display:"flex", alignItems:"center", justifyContent:"center", color:C.purple, margin:"0 auto 16px" }}>
        <Icon.empty/>
      </div>
      <div style={{ fontSize:15, fontWeight:800, color:C.ink, marginBottom:6 }}>No history yet</div>
      <div style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>
        Generate your first piece of content and it'll appear here automatically.
      </div>
    </div>
  );
}

export default function HistoryPanel({ user, onReuse }) {
  const C = getC();
  const userId = user && user.user_id || "";

  const [history,   setHistory  ] = useState([]);
  const [loading,   setLoading  ] = useState(true);
  const [error,     setError    ] = useState("");
  const [filter,    setFilter   ] = useState("all");
  const [search,    setSearch   ] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setError("");
    try {
      const res = await fetch(BASE + "/history/" + userId);
      if (!res.ok) throw new Error("Failed to load history");
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleRefresh = () => { setRefreshing(true); fetchHistory(); };

  const handleDelete = async (itemId) => {
    setHistory(prev => prev.filter(h => h.id !== itemId));
    try {
      await fetch(BASE + "/history/" + userId + "/" + itemId, { method:"DELETE" });
    } catch (e) {}
  };

  const handleReuse = (item) => {
    if (onReuse) onReuse(item.topic, item.platform);
  };

  const platforms = ["all"].concat(Array.from(new Set(history.map(h => h.platform))));
  const filtered = history.filter(h => {
    const matchPlatform = filter === "all" || h.platform === filter;
    const matchSearch   = !search || h.topic.toLowerCase().indexOf(search.toLowerCase()) !== -1 || (h.best_title && h.best_title.toLowerCase().indexOf(search.toLowerCase()) !== -1);
    return matchPlatform && matchSearch;
  });

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif" }}>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:11, background:C.purple + "12", border:"1px solid " + C.purple + "28", display:"flex", alignItems:"center", justifyContent:"center", color:C.purple }}>
            <Icon.history s={17}/>
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:900, color:C.ink }}>Content History</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{history.length} generation{history.length !== 1 ? "s" : ""} saved</div>
          </div>
        </div>
        <button onClick={handleRefresh} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:99, border:"1px solid " + C.hairline, background:"transparent", color:C.muted, fontSize:11.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          <span style={{ display:"inline-flex", animation:refreshing?"spin 0.7s linear infinite":"none" }}><Icon.refresh/></span> Refresh
        </button>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by topic or title..."
        style={{ width:"100%", padding:"10px 15px", borderRadius:12, border:"1.5px solid " + C.hairline, background:C.inputBg, color:C.ink, fontSize:13, fontFamily:"inherit", outline:"none", marginBottom:12, boxSizing:"border-box" }}
      />

      {platforms.length > 1 && (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 }}>
          {platforms.map(p => {
            const pm = PLATFORM_META[p];
            const isActive = filter === p;
            const col = p === "all" ? C.purple : (pm && pm.color || C.purple);
            return (
              <button key={p} onClick={() => setFilter(p)} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 13px", borderRadius:99, border:"1.5px solid " + (isActive ? col : C.hairline), background:isActive ? col + "15" : "transparent", color:isActive ? col : C.muted, fontSize:11.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit", textTransform:"capitalize" }}>
                {p !== "all" && <PlatformIcon platform={p} size={13}/>}
                {p === "all" ? "All" : p}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : error ? (
        <div style={{ display:"flex", alignItems:"center", gap:10, background:C.danger + "12", border:"1px solid " + C.danger + "33", borderRadius:14, padding:"14px 16px", fontSize:13, color:C.danger, fontWeight:600 }}>
          <Icon.warn/> {error} · <span onClick={fetchHistory} style={{ cursor:"pointer", textDecoration:"underline" }}>Retry</span>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState C={C} />
      ) : (
        filtered.map(item => (
          <HistoryCard key={item.id} item={item} onDelete={handleDelete} onReuse={handleReuse} />
        ))
      )}

      <style>{"@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0} @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }"}</style>
    </div>
  );
}
