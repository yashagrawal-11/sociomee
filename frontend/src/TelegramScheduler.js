/**
 * TelegramScheduler.js — SocioMee Telegram Post Scheduler
 * Schedule text, images, videos, GIFs to Telegram personal + channel
 */

import { useState, useEffect, useRef } from "react";

const BASE = "https://sociomee.in/api";

function getC() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  return dark ? {
    rose:"#ff6eb5", purple:"#a78bfa", teal:"#22d3ee", ink:"#ede8ff",
    muted:"#9d86c8", hairline:"rgba(167,139,250,0.15)", glass:"rgba(22,14,42,0.82)",
    success:"#34d399", warn:"#fbbf24", danger:"#f87171",
    tg:"#2aabee", slate:"#c4b5fd", inputBg:"rgba(15,8,30,0.9)",
  } : {
    rose:"#ff3d8f", purple:"#7c3aed", teal:"#0891b2", ink:"#0d0015",
    muted:"#8b6b9a", hairline:"rgba(124,58,237,0.12)", glass:"rgba(255,255,255,0.92)",
    success:"#10b981", warn:"#f59e0b", danger:"#ef4444",
    tg:"#2aabee", slate:"#3b1f4e", inputBg:"rgba(255,255,255,0.9)",
  };
}

const Spinner = ({ size=20, color }) => {
  const C = getC();
  return <div style={{ width:size, height:size, borderRadius:"50%", border:`2.5px solid ${(color||C.tg)}22`, borderTopColor:color||C.tg, animation:"spin 0.7s linear infinite", display:"inline-block", flexShrink:0 }} />;
};

function TGIcon({ size=16, color="#fff" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff/60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins/60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs/24)}d ago`;
}

function statusColor(status) {
  const C = getC();
  switch(status) {
    case "done":      return C.success;
    case "scheduled": return C.warn;
    case "sending":   return C.tg;
    case "error":     return C.danger;
    case "cancelled": return C.muted;
    default:          return C.muted;
  }
}

function statusIcon(status) {
  switch(status) {
    case "done":      return "✅";
    case "scheduled": return "⏰";
    case "sending":   return "📤";
    case "error":     return "❌";
    case "cancelled": return "🚫";
    default:          return "⏳";
  }
}

// ══════════════════════════════════════════════════════════════════════
// COMPOSE TAB
// ══════════════════════════════════════════════════════════════════════
function ComposePost({ userId, onSent }) {
  const C = getC();
  const [text,         setText        ] = useState("");
  const [caption,      setCaption     ] = useState("");
  const [scheduleType, setScheduleType] = useState("now");
  const [scheduledAt,  setScheduledAt ] = useState("");
  const [media,        setMedia       ] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [mediaType,    setMediaType   ] = useState("");
  const [loading,      setLoading     ] = useState(false);
  const [result,       setResult      ] = useState(null);
  const [error,        setError       ] = useState("");
  const [dragOver,     setDragOver    ] = useState(false);
  const fileRef = useRef();
  const charLimit = 4096;

  const handleMedia = (file) => {
    if (!file) return;
    if (file.size > 50*1024*1024) { setError("Max file size is 50 MB"); return; }
    setError("");
    setMedia(file);
    setMediaPreview(URL.createObjectURL(file));
    const ext = file.name.split(".").pop().toLowerCase();
    if (["jpg","jpeg","png","webp"].includes(ext)) setMediaType("photo");
    else if (["mp4","mov","avi"].includes(ext)) setMediaType("video");
    else if (ext === "gif") setMediaType("gif");
    else setMediaType("document");
  };

  const removeMedia = () => { setMedia(null); setMediaPreview(""); setMediaType(""); };

  const send = async () => {
    if (!text.trim() && !media) { setError("Write a message or attach media"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const fd = new FormData();
      fd.append("user_id", userId);
      fd.append("text", text);
      fd.append("caption", caption || text.slice(0, 200));
      fd.append("schedule_type", scheduleType);
      if (scheduleType === "custom" && scheduledAt) fd.append("scheduled_at", scheduledAt);
      if (media) fd.append("media", media);

      const res = await fetch(`${BASE}/telegram/scheduler/send`, { method:"POST", body:fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send");
      setResult(data);
      setText(""); setCaption(""); setMedia(null); setMediaPreview(""); setMediaType(""); setScheduledAt("");
      if (onSent) onSent();
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const mediaIconMap = { photo:"🖼️", video:"🎬", gif:"🎞️", document:"📄" };

  return (
    <div>
      <div style={{ fontSize:"13px", fontWeight:"700", color:C.ink, marginBottom:"4px" }}>✍️ Compose Post</div>
      <div style={{ fontSize:"11.5px", color:C.muted, marginBottom:"16px" }}>Send text, images, videos or GIFs to your Telegram personal + channel</div>

      {/* Text area */}
      <div style={{ position:"relative", marginBottom:"12px" }}>
        <textarea
          value={text} onChange={e => setText(e.target.value)}
          placeholder="Write your Telegram post here… supports HTML: <b>bold</b>, <i>italic</i>, <a href='url'>link</a>"
          rows={5}
          style={{ width:"100%", padding:"12px 14px", borderRadius:"12px", border:`1.5px solid ${C.hairline}`, background:C.inputBg, color:C.ink, fontSize:"13px", fontFamily:"inherit", outline:"none", boxSizing:"border-box", resize:"vertical", lineHeight:1.6 }}
        />
        <div style={{ position:"absolute", bottom:"8px", right:"10px", fontSize:"10px", color:text.length > charLimit*0.9 ? C.danger : C.muted }}>
          {text.length}/{charLimit}
        </div>
      </div>

      {/* Media drop zone */}
      {!media ? (
        <div
          onDrop={e=>{ e.preventDefault(); setDragOver(false); handleMedia(e.dataTransfer.files[0]); }}
          onDragOver={e=>{ e.preventDefault(); setDragOver(true); }}
          onDragLeave={()=>setDragOver(false)}
          onClick={()=>fileRef.current?.click()}
          style={{ border:`2px dashed ${dragOver?C.tg:C.hairline}`, borderRadius:"12px", padding:"16px", textAlign:"center", cursor:"pointer", background:dragOver?`${C.tg}08`:"transparent", transition:"all 0.2s", marginBottom:"12px" }}>
          <input ref={fileRef} type="file" accept="image/*,video/*,.gif" style={{ display:"none" }} onChange={e=>handleMedia(e.target.files[0])} />
          <div style={{ fontSize:"20px", marginBottom:"4px" }}>📎</div>
          <div style={{ fontSize:"12px", fontWeight:"700", color:C.muted }}>Attach media (optional)</div>
          <div style={{ fontSize:"10px", color:C.muted, marginTop:"2px" }}>Images · Videos · GIFs · Max 50 MB</div>
        </div>
      ) : (
        <div style={{ background:C.glass, border:`1.5px solid ${C.tg}44`, borderRadius:"12px", padding:"12px", marginBottom:"12px", position:"relative" }}>
          <button onClick={removeMedia} style={{ position:"absolute", top:"8px", right:"8px", background:C.danger+"22", border:"none", color:C.danger, width:"24px", height:"24px", borderRadius:"50%", cursor:"pointer", fontSize:"12px", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }}>
            <span style={{ fontSize:"20px" }}>{mediaIconMap[mediaType]||"📄"}</span>
            <div>
              <div style={{ fontSize:"12px", fontWeight:"700", color:C.ink }}>{media.name}</div>
              <div style={{ fontSize:"10px", color:C.muted }}>{(media.size/1024/1024).toFixed(1)} MB · {mediaType}</div>
            </div>
          </div>

          {/* Preview */}
          {mediaType === "photo" && <img src={mediaPreview} alt="preview" style={{ width:"100%", maxHeight:"200px", objectFit:"cover", borderRadius:"8px", marginBottom:"8px" }} />}
          {mediaType === "video" && <video src={mediaPreview} controls style={{ width:"100%", maxHeight:"200px", borderRadius:"8px", marginBottom:"8px" }} />}
          {mediaType === "gif"   && <img src={mediaPreview} alt="gif" style={{ width:"100%", maxHeight:"200px", objectFit:"contain", borderRadius:"8px", marginBottom:"8px" }} />}

          {/* Caption for media */}
          <input value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Caption for media (optional, uses message text if empty)"
            style={{ width:"100%", padding:"8px 12px", borderRadius:"9px", border:`1.5px solid ${C.hairline}`, background:C.inputBg, color:C.ink, fontSize:"12px", fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
        </div>
      )}

      {/* Schedule options */}
      <div style={{ marginBottom:"14px" }}>
        <div style={{ fontSize:"10px", fontWeight:"800", color:C.muted, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"8px" }}>📅 When to Send</div>
        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
          {[["now","🔴 Send Now"],["custom","📅 Schedule"]].map(([v,l]) => (
            <button key={v} onClick={()=>setScheduleType(v)}
              style={{ padding:"7px 16px", borderRadius:"9px", border:`1.5px solid ${scheduleType===v?C.tg:C.hairline}`, background:scheduleType===v?`${C.tg}15`:C.glass, color:scheduleType===v?C.tg:C.muted, fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>
              {l}
            </button>
          ))}
        </div>
        {scheduleType === "custom" && (
          <input type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)}
            style={{ marginTop:"8px", width:"100%", padding:"9px 12px", borderRadius:"10px", border:`1.5px solid ${C.tg}44`, background:C.inputBg, color:C.ink, fontSize:"13px", fontFamily:"inherit" }} />
        )}
      </div>

      {error && <div style={{ background:`${C.danger}12`, border:`1px solid ${C.danger}44`, borderRadius:"10px", padding:"10px 14px", marginBottom:"12px", fontSize:"12px", color:C.danger, fontWeight:"600" }}>⚠ {error}</div>}

      {result && (
        <div style={{ background:`${C.success}12`, border:`1px solid ${C.success}44`, borderRadius:"10px", padding:"12px 14px", marginBottom:"12px" }}>
          <div style={{ fontSize:"13px", fontWeight:"800", color:C.success, marginBottom:"4px" }}>
            {result.status === "scheduled" ? "⏰ Scheduled!" : "✅ Sent!"}
          </div>
          <div style={{ fontSize:"11.5px", color:C.ink }}>{result.message}</div>
          {result.targets?.length > 0 && (
            <div style={{ fontSize:"10px", color:C.muted, marginTop:"4px" }}>→ {result.targets.join(", ")}</div>
          )}
        </div>
      )}

      <button onClick={send} disabled={loading || (!text.trim() && !media)}
        style={{ width:"100%", padding:"13px", borderRadius:"12px", border:"none", background:(loading||(!text.trim()&&!media))?"rgba(42,171,238,0.3)":`linear-gradient(135deg,#2aabee,#1a8ac0)`, color:(loading||(!text.trim()&&!media))?"rgba(255,255,255,0.5)":"white", fontWeight:"800", fontSize:"14px", cursor:(loading||(!text.trim()&&!media))?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", boxShadow:(loading||(!text.trim()&&!media))?"none":"0 4px 20px rgba(42,171,238,0.4)" }}>
        {loading ? <><Spinner size={16} color="white" /> {scheduleType==="custom"?"Scheduling…":"Sending…"}</>
          : <><TGIcon size={16} /> {scheduleType==="custom"?"Schedule Post":"Send to Telegram"}</>}
      </button>

      <div style={{ marginTop:"10px", fontSize:"10.5px", color:C.muted, textAlign:"center" }}>
        Sends to your personal Telegram + channel (if connected)
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SCHEDULED POSTS TAB
// ══════════════════════════════════════════════════════════════════════
function ScheduledPosts({ userId, refreshKey }) {
  const C = getC();
  const [jobs,    setJobs   ] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState({});

  const load = async () => {
    try {
      const res = await fetch(`${BASE}/telegram/scheduler/jobs?user_id=${userId}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch(e) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [userId, refreshKey]);

  // Auto-refresh every 10s for pending jobs
  useEffect(() => {
    const hasPending = jobs.some(j => j.status === "sending" || j.status === "scheduled");
    if (!hasPending) return;
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [jobs]);

  const cancel = async (jobId) => {
    setCancelling(prev => ({...prev, [jobId]: true}));
    try {
      await fetch(`${BASE}/telegram/scheduler/job/${jobId}?user_id=${userId}`, { method:"DELETE" });
      load();
    } catch(e) {}
    finally { setCancelling(prev => ({...prev, [jobId]: false})); }
  };

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:"40px" }}><Spinner size={28} color={getC().tg} /></div>;

  if (!jobs.length) return (
    <div style={{ textAlign:"center", padding:"40px", color:C.muted }}>
      <div style={{ fontSize:"36px", marginBottom:"12px" }}>📭</div>
      <div style={{ fontSize:"14px", fontWeight:"700", color:C.ink, marginBottom:"6px" }}>No posts yet</div>
      <div style={{ fontSize:"12px" }}>Compose your first post from the Compose tab!</div>
    </div>
  );

  const scheduled = jobs.filter(j => j.status === "scheduled");
  const sent      = jobs.filter(j => j.status === "done");
  const others    = jobs.filter(j => !["scheduled","done"].includes(j.status));

  const JobCard = ({ job }) => {
    const col = statusColor(job.status);
    const ist = job.scheduled_at ? new Date(job.scheduled_at).toLocaleString("en-IN", { timeZone:"Asia/Kolkata", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }) : "";

    return (
      <div style={{ background:C.glass, border:`1.5px solid ${col}44`, borderRadius:"14px", padding:"14px", marginBottom:"10px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:"10px" }}>
          <span style={{ fontSize:"18px", flexShrink:0 }}>{statusIcon(job.status)}</span>
          <div style={{ flex:1, minWidth:0 }}>
            {/* Message preview */}
            <div style={{ fontSize:"12px", fontWeight:"600", color:C.ink, lineHeight:1.5, marginBottom:"6px", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
              {job.text || job.caption || "(media only)"}
            </div>

            {/* Meta */}
            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", alignItems:"center" }}>
              <span style={{ fontSize:"10px", fontWeight:"800", color:col, padding:"2px 8px", borderRadius:"99px", background:`${col}15`, border:`1px solid ${col}33`, textTransform:"uppercase" }}>
                {job.status}
              </span>
              {job.media_type && job.media_type !== "none" && (
                <span style={{ fontSize:"10px", color:C.tg, fontWeight:"700" }}>
                  {job.media_type==="photo"?"🖼️":job.media_type==="video"?"🎬":job.media_type==="gif"?"🎞️":"📄"} {job.media_type}
                </span>
              )}
              {ist && <span style={{ fontSize:"10px", color:C.warn, fontWeight:"700" }}>⏰ {ist} IST</span>}
              {job.sent_at && <span style={{ fontSize:"10px", color:C.muted }}>{timeAgo(job.sent_at)}</span>}
              {job.created_at && !job.sent_at && <span style={{ fontSize:"10px", color:C.muted }}>{timeAgo(job.created_at)}</span>}
            </div>

            {/* Targets */}
            {job.targets?.length > 0 && (
              <div style={{ fontSize:"10px", color:C.muted, marginTop:"4px" }}>
                → {job.targets.join(" · ")}
              </div>
            )}

            {/* Error */}
            {job.status === "error" && job.error && (
              <div style={{ fontSize:"11px", color:C.danger, marginTop:"4px" }}>❌ {job.error}</div>
            )}

            {/* Results */}
            {job.results?.length > 0 && (
              <div style={{ marginTop:"4px" }}>
                {job.results.map((r,i) => (
                  <div key={i} style={{ fontSize:"10px", color:r.ok?C.success:C.danger }}>
                    {r.ok?"✓":"✗"} {r.target} {r.error?`— ${r.error}`:""}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cancel button for scheduled */}
          {job.status === "scheduled" && (
            <button onClick={() => cancel(job.job_id)} disabled={cancelling[job.job_id]}
              style={{ padding:"5px 10px", borderRadius:"8px", border:`1px solid ${C.danger}44`, background:`${C.danger}10`, color:C.danger, fontSize:"10px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", flexShrink:0 }}>
              {cancelling[job.job_id] ? "…" : "Cancel"}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
        <div style={{ fontSize:"13px", fontWeight:"800", color:C.ink }}>📋 All Posts</div>
        <button onClick={load} style={{ fontSize:"11px", padding:"4px 12px", borderRadius:"8px", border:`1px solid ${C.hairline}`, background:"transparent", color:C.muted, cursor:"pointer", fontFamily:"inherit" }}>↺ Refresh</button>
      </div>

      {scheduled.length > 0 && (
        <>
          <div style={{ fontSize:"10px", fontWeight:"800", color:C.warn, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"8px" }}>⏰ Scheduled ({scheduled.length})</div>
          {scheduled.map(j => <JobCard key={j.job_id} job={j} />)}
        </>
      )}

      {others.length > 0 && (
        <>
          <div style={{ fontSize:"10px", fontWeight:"800", color:C.muted, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"8px", marginTop:scheduled.length?"14px":"0" }}>⚡ In Progress ({others.length})</div>
          {others.map(j => <JobCard key={j.job_id} job={j} />)}
        </>
      )}

      {sent.length > 0 && (
        <>
          <div style={{ fontSize:"10px", fontWeight:"800", color:C.success, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"8px", marginTop:(scheduled.length||others.length)?"14px":"0" }}>✅ Sent ({sent.length})</div>
          {sent.map(j => <JobCard key={j.job_id} job={j} />)}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════
export default function TelegramScheduler({ user }) {
  const C      = getC();
  const userId = user?.user_id || localStorage.getItem("sociomee_user_id") || "";

  const [activeTab,   setActiveTab  ] = useState("compose");
  const [tgStatus,    setTgStatus   ] = useState("checking");
  const [tgInfo,      setTgInfo     ] = useState(null);
  const [connectLink, setConnectLink] = useState("");
  const [polling,     setPolling    ] = useState(false);
  const [refreshKey,  setRefreshKey ] = useState(0);

  useEffect(() => {
    if (!userId) return;
    fetch(`${BASE}/telegram/connect-status?user_id=${userId}`)
      .then(r => r.json())
      .then(d => { setTgStatus(d.connected?"connected":"disconnected"); if (d.connected) setTgInfo(d); })
      .catch(() => setTgStatus("disconnected"));
  }, [userId]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`${BASE}/telegram/connect-status?user_id=${userId}`);
        const d = await r.json();
        if (d.connected) { setTgStatus("connected"); setTgInfo(d); setPolling(false); }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [polling, userId]);

  const handleConnect = async () => {
    try {
      const r = await fetch(`${BASE}/telegram/connect-link?user_id=${userId}`);
      const d = await r.json();
      setConnectLink(d.link); setPolling(true);
      window.open(d.link.replace("tg://","https://t.me/").replace("resolve?domain=",""), "_blank");
    } catch(e) {}
  };

  const handleDisconnect = async () => {
    await fetch(`${BASE}/telegram/disconnect?user_id=${userId}`, { method:"POST" });
    setTgStatus("disconnected"); setTgInfo(null); setConnectLink("");
  };

  // Not connected state
  if (tgStatus === "checking") return (
    <div style={{ display:"flex", justifyContent:"center", padding:"40px" }}>
      <Spinner size={28} color={getC().tg} />
    </div>
  );

  if (tgStatus === "disconnected") return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"32px 24px", gap:"16px", textAlign:"center" }}>
      <div style={{ width:"64px", height:"64px", borderRadius:"50%", background:"rgba(42,171,238,0.12)", border:"2px solid rgba(42,171,238,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <TGIcon size={28} color="#2aabee" />
      </div>
      <h3 style={{ fontSize:"16px", fontWeight:"900", color:C.ink, margin:0 }}>Connect Telegram</h3>
      <p style={{ fontSize:"12.5px", color:C.muted, lineHeight:1.6, maxWidth:"280px", margin:0 }}>
        Connect your Telegram to schedule and send posts with images, videos, and GIFs.
      </p>
      {!connectLink ? (
        <button onClick={handleConnect}
          style={{ display:"flex", alignItems:"center", gap:"8px", padding:"12px 24px", borderRadius:"12px", border:"none", background:"linear-gradient(135deg,#2aabee,#1a8ac0)", color:"white", fontWeight:"800", fontSize:"14px", cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 20px rgba(42,171,238,0.4)" }}>
          <TGIcon size={16} /> Connect Telegram
        </button>
      ) : (
        <div style={{ background:"rgba(42,171,238,0.08)", border:"1.5px solid rgba(42,171,238,0.3)", borderRadius:"14px", padding:"16px", width:"100%", maxWidth:"300px" }}>
          <p style={{ fontSize:"13px", fontWeight:"700", color:C.ink, marginBottom:"10px" }}>Open Telegram and tap Start</p>
          <a href={connectLink} target="_blank" rel="noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"10px 20px", borderRadius:"10px", background:"linear-gradient(135deg,#2aabee,#1a8ac0)", color:"white", fontWeight:"800", fontSize:"13px", textDecoration:"none" }}>
            <TGIcon size={14} /> Open Telegram
          </a>
          <p style={{ fontSize:"11px", color:C.muted, marginTop:"8px" }}>{polling?"⏳ Waiting for connection…":"Tap the link above"}</p>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", paddingBottom:"20px" }}>
      {/* Connected header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:`${C.tg}10`, border:`1px solid ${C.tg}33`, borderRadius:"12px", padding:"10px 14px", marginBottom:"16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <TGIcon size={16} color={C.tg} />
          <div>
            <div style={{ fontSize:"12px", fontWeight:"800", color:C.ink }}>
              @{tgInfo?.telegram_username || tgInfo?.full_name || "Connected"}
            </div>
            {tgInfo?.channel_verified && (
              <div style={{ fontSize:"10px", color:C.tg, fontWeight:"700" }}>+ {tgInfo.channel} 📢</div>
            )}
          </div>
        </div>
        <button onClick={handleDisconnect}
          style={{ fontSize:"11px", color:C.danger, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", textDecoration:"underline" }}>
          Disconnect
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"4px", marginBottom:"16px", background:`${C.tg}10`, borderRadius:"12px", padding:"4px" }}>
        {[["compose","✍️ Compose"],["posts","📋 Posts"]].map(([id,label]) => (
          <button key={id} onClick={()=>setActiveTab(id)}
            style={{ flex:1, padding:"8px 4px", borderRadius:"9px", border:"none", background:activeTab===id?C.glass:"transparent", color:activeTab===id?C.tg:C.muted, fontWeight:activeTab===id?"800":"600", fontSize:"12px", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", boxShadow:activeTab===id?"0 1px 4px rgba(0,0,0,0.08)":"none" }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab==="compose" && (
        <ComposePost userId={userId} onSent={()=>{ setRefreshKey(k=>k+1); setActiveTab("posts"); }} />
      )}
      {activeTab==="posts" && (
        <ScheduledPosts userId={userId} refreshKey={refreshKey} />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea:focus, input:focus { outline: none; border-color: #2aabee !important; }
        textarea { font-family: inherit; }
      `}</style>
    </div>
  );
}