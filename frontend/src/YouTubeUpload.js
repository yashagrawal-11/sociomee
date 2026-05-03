/**
 * YouTubeUpload.js — SocioMee YouTube Auto-Upload
 * Async job system: upload starts instantly, progress bar polls every 3s
 */

import { useState, useEffect, useRef } from "react";

const BASE = "https://sociomee.in/api";

function getC() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  return dark ? {
    rose:"#ff6eb5", purple:"#a78bfa", teal:"#22d3ee", ink:"#ede8ff",
    muted:"#9d86c8", hairline:"rgba(167,139,250,0.15)", glass:"rgba(22,14,42,0.82)",
    success:"#34d399", warn:"#fbbf24", danger:"#f87171", yt:"#ff0000",
    purpleXlt:"#150d2a", slate:"#c4b5fd", white:"#ede8ff",
  } : {
    rose:"#ff3d8f", purple:"#7c3aed", teal:"#0891b2", ink:"#0d0015",
    muted:"#8b6b9a", hairline:"rgba(124,58,237,0.12)", glass:"rgba(255,255,255,0.85)",
    success:"#10b981", warn:"#f59e0b", danger:"#ef4444", yt:"#ff0000",
    purpleXlt:"#f5f3ff", slate:"#3b1f4e", white:"#ffffff",
  };
}

function Spinner({ size = 24, color }) {
  const C = getC();
  return <div style={{ width:size, height:size, borderRadius:"50%", border:`3px solid ${(color||C.purple)}22`, borderTopColor:color||C.purple, animation:"spin 0.7s linear infinite", display:"inline-block" }} />;
}

function PlanBadge({ plan }) {
  const C = getC();
  const isPremium = plan?.includes("premium");
  const isPro = plan?.includes("pro");
  if (!isPro && !isPremium) return null;
  return (
    <span style={{ padding:"2px 10px", borderRadius:"99px", fontSize:"10px", fontWeight:"800", letterSpacing:"0.8px", textTransform:"uppercase", background:isPremium?"linear-gradient(135deg,#f59e0b,#ef4444)":`${C.purple}22`, color:isPremium?"white":C.purple, border:isPremium?"none":`1px solid ${C.purple}44` }}>
      {isPremium ? "⭐ PREMIUM" : "✦ PRO"}
    </span>
  );
}

function UpgradeWall() {
  const C = getC();
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"40px 24px", gap:"16px", textAlign:"center" }}>
      <div style={{ fontSize:"48px" }}>🚀</div>
      <h3 style={{ fontSize:"18px", fontWeight:"900", color:C.ink }}>Auto-Upload is a Pro Feature</h3>
      <p style={{ fontSize:"13px", color:C.muted, lineHeight:1.6, maxWidth:"320px" }}>Upload videos to YouTube automatically. Just drop your video and we handle everything.</p>
      <div style={{ display:"flex", flexDirection:"column", gap:"10px", width:"100%", maxWidth:"300px" }}>
        {[
          { plan:"Pro ₹499/month", uploads:"4 uploads/month", color:C.purple },
          { plan:"Premium ₹2999/month", uploads:"15 uploads/month", color:"#f59e0b" },
        ].map((p,i) => (
          <div key={i} style={{ background:C.glass, border:`1.5px solid ${p.color}44`, borderRadius:"14px", padding:"14px 16px", textAlign:"left" }}>
            <div style={{ fontSize:"13px", fontWeight:"800", color:p.color }}>{p.plan}</div>
            <div style={{ fontSize:"11.5px", color:C.muted, marginTop:"4px" }}>✓ {p.uploads} · ✓ Auto-Upload to YouTube</div>
          </div>
        ))}
      </div>
      <button style={{ padding:"12px 28px", borderRadius:"12px", border:"none", background:`linear-gradient(135deg,${C.purple},${C.rose})`, color:"white", fontWeight:"800", fontSize:"14px", cursor:"pointer", fontFamily:"inherit" }}>Upgrade Now</button>
    </div>
  );
}

function QuotaBar({ quota, plan }) {
  const C = getC();
  if (!quota) return null;
  const pct = quota.limit > 0 ? (quota.used / quota.limit) * 100 : 0;
  const col = pct >= 100 ? C.danger : pct >= 75 ? C.warn : C.success;
  const resetDate = quota.reset_date ? new Date(quota.reset_date).toLocaleDateString("en-IN", { day:"numeric", month:"short" }) : "";
  return (
    <div style={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:"12px", padding:"12px 16px", marginBottom:"16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <span style={{ fontSize:"12px", fontWeight:"700", color:C.ink }}>📤 Monthly Uploads</span>
          <PlanBadge plan={plan} />
        </div>
        <span style={{ fontSize:"12px", fontWeight:"800", color:col }}>{quota.used}/{quota.limit}</span>
      </div>
      <div style={{ height:"6px", background:`${C.hairline}`, borderRadius:"99px", overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${Math.min(pct,100)}%`, background:col, borderRadius:"99px", transition:"width 0.4s" }} />
      </div>
      <div style={{ fontSize:"10.5px", color:C.muted, marginTop:"6px" }}>{quota.remaining} uploads remaining · Resets {resetDate}</div>
    </div>
  );
}

function UploadProgress({ job }) {
  const C = getC();
  if (!job) return null;
  const isDone  = job.status === "done";
  const isError = job.status === "error";
  const color   = isDone ? C.success : isError ? C.danger : C.purple;

  return (
    <div style={{ background:isDone?`${C.success}10`:isError?`${C.danger}10`:`${C.purple}08`, border:`1.5px solid ${color}33`, borderRadius:"16px", padding:"18px", marginBottom:"20px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"14px" }}>
        {!isDone && !isError && <Spinner size={18} color={C.purple} />}
        {isDone  && <span style={{ fontSize:"20px" }}>✅</span>}
        {isError && <span style={{ fontSize:"20px" }}>❌</span>}
        <div>
          <div style={{ fontSize:"13px", fontWeight:"900", color }}>{job.message}</div>
          {!isDone && !isError && <div style={{ fontSize:"11px", color:C.muted, marginTop:"2px" }}>Please keep this tab open</div>}
        </div>
      </div>

      {!isError && (
        <div style={{ marginBottom:"14px" }}>
          <div style={{ height:"8px", background:`${C.hairline}`, borderRadius:"99px", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${job.progress}%`, background:isDone?`linear-gradient(90deg,${C.success},${C.teal})`:`linear-gradient(90deg,${C.purple},${C.rose})`, borderRadius:"99px", transition:"width 0.6s ease" }} />
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:"4px" }}>
            <span style={{ fontSize:"10px", color:C.muted }}>{job.status === "done" ? "Upload complete!" : job.status === "uploading" ? "Uploading to YouTube…" : "Starting…"}</span>
            <span style={{ fontSize:"10px", fontWeight:"800", color }}>{job.progress}%</span>
          </div>
        </div>
      )}

      {isDone && job.result && (
        <div>
          <div style={{ fontSize:"13px", color:C.ink, fontWeight:"700", marginBottom:"6px" }}>{job.result.title}</div>
          {job.result.scheduled
            ? <div style={{ fontSize:"12px", color:C.warn }}>⏰ Scheduled: {job.result.best_time?.ist_label || new Date(job.result.scheduled).toLocaleString("en-IN")}</div>
            : <div style={{ fontSize:"12px", color:C.success }}>🔴 Live on YouTube now</div>
          }
          <a href={job.result.video_url} target="_blank" rel="noreferrer" style={{ display:"inline-block", marginTop:"10px", padding:"8px 18px", borderRadius:"10px", background:"#ff0000", color:"white", fontWeight:"700", fontSize:"12px", textDecoration:"none" }}>
            ▶ View on YouTube
          </a>
        </div>
      )}

      {isError && (
        <div style={{ fontSize:"12px", color:C.danger, marginTop:"4px" }}>{job.error || "Something went wrong. Please try again."}</div>
      )}
    </div>
  );
}

export default function YouTubeUpload({ user }) {
  const C      = getC();
  const userId = user?.user_id || localStorage.getItem("sociomee_user_id") || "";

  const [plan,         setPlan        ] = useState("free");
  const [quota,        setQuota       ] = useState(null);
  const [videoFile,    setVideoFile   ] = useState(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [topic,        setTopic       ] = useState("");
  const [videoType,    setVideoType   ] = useState("video");
  const [scheduleType, setScheduleType] = useState("now");
  const [customTime,   setCustomTime  ] = useState("");
  const [privacy,      setPrivacy     ] = useState("public");
  const [uploading,    setUploading   ] = useState(false);
  const [job,          setJob         ] = useState(null);
  const [error,        setError       ] = useState("");
  const [bestTime,     setBestTime    ] = useState(null);
  const [dragOver,     setDragOver    ] = useState(false);
  const fileRef = useRef();
  const pollRef = useRef();

  useEffect(() => {
    if (!userId) return;
    fetch(`${BASE}/youtube/upload/quota?user_id=${userId}`)
      .then(r => r.json()).then(d => { setQuota(d); setPlan(d.plan || "free"); }).catch(() => {});
    fetch(`${BASE}/youtube/upload/best-time`)
      .then(r => r.json()).then(d => setBestTime(d)).catch(() => {});
  }, [userId]);

  const startPolling = (jobId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${BASE}/youtube/upload/job/${jobId}`);
        const data = await res.json();
        setJob(data);
        if (data.status === "done") {
          clearInterval(pollRef.current);
          setUploading(false);
          setVideoFile(null);
          setVideoPreview("");
          setTopic("");
          if (data.result?.quota) setQuota(data.result.quota);
        }
        if (data.status === "error") {
          clearInterval(pollRef.current);
          setUploading(false);
        }
      } catch { /* keep polling on network blip */ }
    }, 3000);
  };

  useEffect(() => () => clearInterval(pollRef.current), []);

  const isPro = plan?.includes("pro") || plan?.includes("premium");

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("video/")) { setError("Please select a valid video file."); return; }
    if (file.size > 256 * 1024 * 1024) { setError("File too large. Max 256 MB."); return; }
    setError(""); setVideoFile(file); setVideoPreview(URL.createObjectURL(file)); setJob(null);
  };

  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };

  const handleUpload = async () => {
    if (!videoFile)         { setError("Please select a video file"); return; }
    if (!topic.trim())      { setError("Enter a video title"); return; }
    if (!quota?.can_upload) { setError("Monthly upload limit reached"); return; }

    setUploading(true); setError(""); setJob(null);
    try {
      const fd = new FormData();
      fd.append("user_id",       userId);
      fd.append("topic",         topic);
      fd.append("video_type",    videoType);
      fd.append("schedule_type", scheduleType);
      fd.append("custom_time",   customTime);
      fd.append("privacy",       privacy);
      fd.append("language",      "Hindi/English");
      fd.append("video",         videoFile);

      const res  = await fetch(`${BASE}/youtube/upload/auto`, { method:"POST", body:fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail?.message || data.detail || "Upload failed");

      setJob({ job_id:data.job_id, status:"queued", progress:0, message:"Upload started…" });
      startPolling(data.job_id);
    } catch (e) {
      setError(e.message);
      setUploading(false);
    }
  };

  if (!isPro) return <UpgradeWall />;

  const isActive = uploading || (job && job.status !== "done" && job.status !== "error");

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", paddingBottom:"20px" }}>

      <QuotaBar quota={quota} plan={plan} />

      {job && <UploadProgress job={job} />}

      {!isActive && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          style={{ border:`2px dashed ${dragOver?C.yt:C.purple}`, borderRadius:"16px", padding:videoPreview?"12px":"36px 24px", textAlign:"center", cursor:"pointer", background:dragOver?`${C.yt}08`:`${C.purple}06`, transition:"all 0.2s", marginBottom:"16px" }}
        >
          <input ref={fileRef} type="file" accept="video/*" style={{ display:"none" }} onChange={e => handleFile(e.target.files[0])} />
          {videoPreview ? (
            <div>
              <video src={videoPreview} style={{ width:"100%", maxHeight:"160px", borderRadius:"10px", objectFit:"cover" }} controls />
              <div style={{ fontSize:"12px", color:C.muted, marginTop:"8px" }}>📹 {videoFile?.name} ({(videoFile?.size/1024/1024).toFixed(1)} MB)</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize:"36px", marginBottom:"10px" }}>📹</div>
              <div style={{ fontSize:"14px", fontWeight:"700", color:C.ink }}>Drop video here or click to select</div>
              <div style={{ fontSize:"12px", color:C.muted, marginTop:"4px" }}>Supports MP4, MOV, AVI · Max 256 MB · Any length ✓</div>
            </>
          )}
        </div>
      )}

      {!isActive && (
        <>
          <div style={{ display:"flex", gap:"8px", marginBottom:"14px" }}>
            {[["video","🎬 Long Video"],["short","⚡ Short (< 60s)"]].map(([val,label]) => (
              <button key={val} onClick={() => setVideoType(val)} style={{ flex:1, padding:"10px", borderRadius:"12px", border:`1.5px solid ${videoType===val?C.yt:C.hairline}`, background:videoType===val?`${C.yt}15`:C.glass, color:videoType===val?C.yt:C.muted, fontWeight:"700", fontSize:"13px", cursor:"pointer", fontFamily:"inherit" }}>{label}</button>
            ))}
          </div>

          <div style={{ marginBottom:"14px" }}>
            <label style={{ fontSize:"11px", fontWeight:"700", color:C.muted, textTransform:"uppercase", display:"block", marginBottom:"6px" }}>Video Title *</label>
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. 10 AI tools for Indian students" style={{ width:"100%", padding:"11px 14px", borderRadius:"12px", border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:"13px", fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
          </div>

          <div style={{ marginBottom:"14px" }}>
            <label style={{ fontSize:"11px", fontWeight:"700", color:C.muted, textTransform:"uppercase", display:"block", marginBottom:"6px" }}>When to Post</label>
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
              {[["now","🔴 Post Now"],["best",`⭐ Best Time${bestTime?` (${bestTime.ist_label})`:""}`],["custom","📅 Custom Time"]].map(([val,label]) => (
                <button key={val} onClick={() => setScheduleType(val)} style={{ padding:"8px 14px", borderRadius:"10px", border:`1.5px solid ${scheduleType===val?C.purple:C.hairline}`, background:scheduleType===val?`${C.purple}18`:C.glass, color:scheduleType===val?C.purple:C.muted, fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>{label}</button>
              ))}
            </div>
            {scheduleType === "custom" && (
              <input type="datetime-local" value={customTime} onChange={e => setCustomTime(e.target.value)} style={{ marginTop:"8px", width:"100%", padding:"10px 14px", borderRadius:"12px", border:`1.5px solid ${C.purple}44`, background:C.glass, color:C.ink, fontSize:"13px", fontFamily:"inherit" }} />
            )}
          </div>

          <div style={{ marginBottom:"20px" }}>
            <label style={{ fontSize:"11px", fontWeight:"700", color:C.muted, textTransform:"uppercase", display:"block", marginBottom:"6px" }}>Privacy</label>
            <div style={{ display:"flex", gap:"6px" }}>
              {[["public","🌍 Public"],["unlisted","🔗 Unlisted"],["private","🔒 Private"]].map(([val,label]) => (
                <button key={val} onClick={() => setPrivacy(val)} style={{ flex:1, padding:"8px", borderRadius:"10px", border:`1.5px solid ${privacy===val?C.teal:C.hairline}`, background:privacy===val?`${C.teal}18`:C.glass, color:privacy===val?C.teal:C.muted, fontWeight:"700", fontSize:"11.5px", cursor:"pointer", fontFamily:"inherit" }}>{label}</button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ background:`${C.danger}12`, border:`1px solid ${C.danger}44`, borderRadius:"10px", padding:"10px 14px", marginBottom:"14px", fontSize:"12.5px", color:C.danger, fontWeight:"600" }}>⚠ {error}</div>
          )}

          <button
            onClick={handleUpload}
            disabled={!videoFile || !topic.trim() || !quota?.can_upload}
            style={{ width:"100%", padding:"14px", borderRadius:"14px", border:"none", background:(!videoFile||!topic.trim()||!quota?.can_upload)?C.hairline:"linear-gradient(135deg,#ff0000,#cc0000)", color:(!videoFile||!topic.trim())?C.muted:"white", fontWeight:"900", fontSize:"15px", cursor:(!videoFile||!topic.trim()||!quota?.can_upload)?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"10px", transition:"all 0.2s" }}
          >
            ▶ Upload to YouTube ({quota?.remaining || 0} left this month)
          </button>
        </>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, select:focus { outline: none; border-color: #7c3aed !important; }
      `}</style>
    </div>
  );
}