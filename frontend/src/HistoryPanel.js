/**
 * HistoryPanel.js — SocioMee Content History
 * Shows past generations with skeleton loading screens
 * Matches App.js dark/light theme system exactly
 */

import { useState, useEffect, useCallback } from "react";

const BASE = "https://sociomee.in/api";

function getC() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  return dark ? {
    purple:"#a78bfa", rose:"#ff6eb5", teal:"#22d3ee",
    ink:"#ede8ff", slate:"#c4b5fd", muted:"#9d86c8",
    hairline:"rgba(167,139,250,0.15)", glass:"rgba(22,14,42,0.82)",
    success:"#34d399", warn:"#fbbf24", danger:"#f87171",
    pillBg:"rgba(255,255,255,0.06)", inputBg:"rgba(15,8,30,0.9)",
  } : {
    purple:"#7c3aed", rose:"#ff3d8f", teal:"#0891b2",
    ink:"#0d0015", slate:"#3b1f4e", muted:"#8b6b9a",
    hairline:"rgba(124,58,237,0.12)", glass:"rgba(255,255,255,0.68)",
    success:"#10b981", warn:"#f59e0b", danger:"#ef4444",
    pillBg:"rgba(255,255,255,0.5)", inputBg:"rgba(255,255,255,0.7)",
  };
}

// ── Platform colors & icons ───────────────────────────────────────────
const PLATFORM_META = {
  youtube:   { color:"#ff0000", emoji:"▶️" },
  instagram: { color:"#e1306c", emoji:"📸" },
  linkedin:  { color:"#0077b5", emoji:"💼" },
  reddit:    { color:"#ff4500", emoji:"🔴" },
  threads:   { color:"#000000", emoji:"🧵" },
  pinterest: { color:"#e60023", emoji:"📌" },
  telegram:  { color:"#2aabee", emoji:"✈️" },
  facebook:  { color:"#1877f2", emoji:"👤" },
  tiktok:    { color:"#010101", emoji:"🎵" },
  x:         { color:"#000000", emoji:"𝕏"  },
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day:"numeric", month:"short" });
}

// ── Skeleton screen component ─────────────────────────────────────────
function SkeletonCard() {
  const C = getC();
  return (
    <div style={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:14, padding:"14px 16px", marginBottom:10 }}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, ${C.hairline} 25%, ${C.pillBg} 50%, ${C.hairline} 75%);
          background-size: 400px 100%;
          animation: shimmer 1.4s ease infinite;
          border-radius: 6px;
        }
      `}</style>
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

// ── Single history card ───────────────────────────────────────────────
function HistoryCard({ item, onDelete, onReuse }) {
  const C = getC();
  const pm = PLATFORM_META[item.platform] || { color:C.purple, emoji:"✦" };
  const [deleting, setDeleting] = useState(false);
  const [copied,   setCopied  ] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    onDelete(item.id);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(item.best_title || item.topic);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ background:C.glass, backdropFilter:"blur(12px)", border:`1px solid ${C.hairline}`, borderRadius:14, padding:"14px 16px", marginBottom:10, transition:"all 0.2s", opacity:deleting?0.4:1 }}>
      {/* Header row */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8, gap:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.ink, lineHeight:1.4, marginBottom:3 }}>
            {item.best_title || item.topic}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
            <span style={{ fontSize:10, fontWeight:800, color:pm.color, background:`${pm.color}15`, border:`1px solid ${pm.color}33`, borderRadius:99, padding:"2px 8px", textTransform:"uppercase", letterSpacing:"0.5px" }}>
              {pm.emoji} {item.platform}
            </span>
            <span style={{ fontSize:10, color:C.muted, fontWeight:600 }}>{timeAgo(item.created_at)}</span>
            {item.word_count > 0 && <span style={{ fontSize:10, color:C.muted }}>· {item.word_count} words</span>}
            {item.language && <span style={{ fontSize:10, color:C.muted }}>· {item.language}</span>}
          </div>
        </div>
      </div>

      {/* Preview text */}
      {item.preview && (
        <div style={{ fontSize:12, color:C.muted, lineHeight:1.6, marginBottom:10, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
          {item.preview}
        </div>
      )}

      {/* Hashtags */}
      {item.hashtags?.length > 0 && (
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:10 }}>
          {item.hashtags.slice(0,4).map((h, i) => (
            <span key={i} style={{ fontSize:10, fontWeight:600, color:C.purple, background:`${C.purple}12`, border:`1px solid ${C.purple}25`, borderRadius:99, padding:"2px 8px" }}>{h}</span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
        <button onClick={() => onReuse(item)} style={{ padding:"5px 12px", borderRadius:99, border:`1.5px solid ${C.purple}44`, background:`${C.purple}10`, color:C.purple, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          ↺ Reuse
        </button>
        <button onClick={handleCopy} style={{ padding:"5px 12px", borderRadius:99, border:`1.5px solid ${C.hairline}`, background:"transparent", color:copied?C.success:C.muted, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          {copied ? "✓ Copied" : "Copy Title"}
        </button>
        <button onClick={handleDelete} style={{ marginLeft:"auto", padding:"5px 10px", borderRadius:99, border:`1px solid ${C.danger}33`, background:"transparent", color:C.danger, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit", opacity:0.7 }}>
          🗑
        </button>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────
function EmptyState({ C }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 20px" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>📝</div>
      <div style={{ fontSize:15, fontWeight:800, color:C.ink, marginBottom:6 }}>No history yet</div>
      <div style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>
        Generate your first piece of content and it'll appear here automatically.
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════
export default function HistoryPanel({ user, onReuse }) {
  const C = getC();
  const userId = user?.user_id || "";

  const [history,   setHistory  ] = useState([]);
  const [loading,   setLoading  ] = useState(true);
  const [error,     setError    ] = useState("");
  const [filter,    setFilter   ] = useState("all");
  const [search,    setSearch   ] = useState("");

  const fetchHistory = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${BASE}/history/${userId}`);
      if (!res.ok) throw new Error("Failed to load history");
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleDelete = async (itemId) => {
    setHistory(prev => prev.filter(h => h.id !== itemId));
    try {
      await fetch(`${BASE}/history/${userId}/${itemId}`, { method:"DELETE" });
    } catch {}
  };

  const handleReuse = (item) => {
    if (onReuse) onReuse(item.topic, item.platform);
  };

  // Filter + search
  const platforms = ["all", ...new Set(history.map(h => h.platform))];
  const filtered = history.filter(h => {
    const matchPlatform = filter === "all" || h.platform === filter;
    const matchSearch   = !search || h.topic.toLowerCase().includes(search.toLowerCase()) || h.best_title?.toLowerCase().includes(search.toLowerCase());
    return matchPlatform && matchSearch;
  });

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif" }}>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <div style={{ fontSize:16, fontWeight:900, color:C.ink }}>📋 Content History</div>
          <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{history.length} generation{history.length !== 1 ? "s" : ""} saved</div>
        </div>
        <button onClick={fetchHistory} style={{ padding:"6px 12px", borderRadius:99, border:`1px solid ${C.hairline}`, background:"transparent", color:C.muted, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          ↻ Refresh
        </button>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by topic or title..."
        style={{ width:"100%", padding:"9px 14px", borderRadius:10, border:`1.5px solid ${C.hairline}`, background:C.inputBg, color:C.ink, fontSize:13, fontFamily:"inherit", outline:"none", marginBottom:10, boxSizing:"border-box" }}
      />

      {/* Platform filter tabs */}
      {platforms.length > 1 && (
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
          {platforms.map(p => {
            const pm = PLATFORM_META[p] || {};
            const isActive = filter === p;
            const col = p === "all" ? C.purple : (pm.color || C.purple);
            return (
              <button key={p} onClick={() => setFilter(p)} style={{ padding:"4px 12px", borderRadius:99, border:`1.5px solid ${isActive ? col : C.hairline}`, background:isActive ? `${col}15` : "transparent", color:isActive ? col : C.muted, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", textTransform:"capitalize" }}>
                {p === "all" ? "All" : `${pm.emoji || ""} ${p}`}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      ) : error ? (
        <div style={{ background:`${C.danger}12`, border:`1px solid ${C.danger}33`, borderRadius:12, padding:"14px 16px", fontSize:13, color:C.danger, fontWeight:600 }}>
          ⚠ {error} · <span onClick={fetchHistory} style={{ cursor:"pointer", textDecoration:"underline" }}>Retry</span>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState C={C} />
      ) : (
        filtered.map(item => (
          <HistoryCard key={item.id} item={item} onDelete={handleDelete} onReuse={handleReuse} />
        ))
      )}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}`}</style>
    </div>
  );
}