/**
 * YouTubeUpload.js — SocioMee YouTube Bulk Upload + Scheduler
 * Tabs: Bulk Upload | SEO AI | Thumbnail Analyzer
 */

import { useState, useEffect, useRef } from "react";

const BASE = "https://sociomee.in/api";

function getC() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  return dark ? {
    rose:"#ff6eb5", purple:"#a78bfa", teal:"#22d3ee", ink:"#ede8ff",
    muted:"#9d86c8", hairline:"rgba(167,139,250,0.15)", glass:"rgba(22,14,42,0.82)",
    success:"#34d399", warn:"#fbbf24", danger:"#f87171", yt:"#ff0000",
    purpleXlt:"#150d2a", slate:"#c4b5fd", inputBg:"rgba(15,8,30,0.9)",
  } : {
    rose:"#ff3d8f", purple:"#7c3aed", teal:"#0891b2", ink:"#0d0015",
    muted:"#8b6b9a", hairline:"rgba(124,58,237,0.12)", glass:"rgba(255,255,255,0.92)",
    success:"#10b981", warn:"#f59e0b", danger:"#ef4444", yt:"#ff0000",
    purpleXlt:"#f5f3ff", slate:"#3b1f4e", inputBg:"rgba(255,255,255,0.9)",
  };
}

const Spinner = ({ size=20, color }) => {
  const C = getC();
  return <div style={{ width:size, height:size, borderRadius:"50%", border:`2.5px solid ${(color||C.purple)}22`, borderTopColor:color||C.purple, animation:"spin 0.7s linear infinite", display:"inline-block", flexShrink:0 }} />;
};

function UpgradeWall() {
  const C = getC();
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"40px 24px", gap:"16px", textAlign:"center" }}>
      <div style={{ fontSize:"48px" }}>🚀</div>
      <h3 style={{ fontSize:"18px", fontWeight:"900", color:C.ink, margin:0 }}>Pro Feature</h3>
      <p style={{ fontSize:"13px", color:C.muted, lineHeight:1.6, maxWidth:"300px", margin:0 }}>Upgrade to unlock bulk upload, AI SEO, and thumbnail analysis.</p>
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
  const isPremium = plan?.includes("premium");
  return (
    <div style={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:"12px", padding:"12px 16px", marginBottom:"16px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <span style={{ fontSize:"12px", fontWeight:"700", color:C.ink }}>📤 Monthly Uploads</span>
          <span style={{ padding:"2px 10px", borderRadius:"99px", fontSize:"10px", fontWeight:"800", letterSpacing:"0.8px", textTransform:"uppercase", background:isPremium?"linear-gradient(135deg,#f59e0b,#ef4444)":`${C.purple}22`, color:isPremium?"white":C.purple, border:isPremium?"none":`1px solid ${C.purple}44` }}>{isPremium?"⭐ PREMIUM":"✦ PRO"}</span>
        </div>
        <span style={{ fontSize:"12px", fontWeight:"800", color:col }}>{quota.used}/{quota.limit}</span>
      </div>
      <div style={{ height:"5px", background:`${C.hairline}`, borderRadius:"99px", overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${Math.min(pct,100)}%`, background:col, borderRadius:"99px", transition:"width 0.4s" }} />
      </div>
      <div style={{ fontSize:"10px", color:C.muted, marginTop:"5px" }}>{quota.remaining} uploads remaining · Resets {resetDate}</div>
    </div>
  );
}

function SEOScore({ score }) {
  const C = getC();
  const col = score >= 85 ? C.success : score >= 65 ? C.warn : C.danger;
  const lbl = score >= 85 ? "HIGH" : score >= 65 ? "MED" : "LOW";
  return (
    <div style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"4px 10px", borderRadius:"8px", background:`${col}15`, border:`1px solid ${col}44` }}>
      <span style={{ fontSize:"13px", fontWeight:"900", color:col }}>{score}</span>
      <span style={{ fontSize:"9px", fontWeight:"700", color:col, textTransform:"uppercase" }}>{lbl}</span>
    </div>
  );
}

// ── Single Video Card in Bulk Queue ───────────────────────────────────
function VideoCard({ item, index, onUpdate, onRemove, bestTime, plan }) {
  const C = getC();
  const [genLoading, setGenLoading] = useState(false);

  const generateSEO = async () => {
    if (!item.keyword.trim()) return;
    setGenLoading(true);
    try {
      const fd = new FormData();
      fd.append("user_id", item.userId || "");
      fd.append("keyword", item.keyword);
      fd.append("video_type", item.videoType || "video");
      fd.append("language", item.language || "Hindi/English");
      const res = await fetch(`${BASE}/youtube/upload/seo`, { method:"POST", body:fd });
      const data = await res.json();
      if (res.ok && data.seo) {
        onUpdate(index, { seo: data.seo, seoGenerated: true });
      }
    } catch(e) { console.error(e); }
    finally { setGenLoading(false); }
  };

  const statusColor = item.jobStatus === "done" ? C.success : item.jobStatus === "error" ? C.danger : item.jobStatus === "uploading" ? C.warn : C.hairline;
  const statusIcon  = item.jobStatus === "done" ? "✅" : item.jobStatus === "error" ? "❌" : item.jobStatus === "uploading" ? "⏳" : "📹";

  return (
    <div style={{ background:C.glass, border:`1.5px solid ${statusColor}`, borderRadius:"16px", padding:"16px", marginBottom:"12px", position:"relative" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"12px" }}>
        <span style={{ fontSize:"18px" }}>{statusIcon}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:"12px", fontWeight:"800", color:C.ink, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
            {item.file?.name || "Video " + (index + 1)}
          </div>
          <div style={{ fontSize:"10px", color:C.muted }}>
            {item.file ? `${(item.file.size/1024/1024).toFixed(1)} MB` : ""} {item.videoType === "short" ? "· #Shorts" : "· Long Video"}
          </div>
        </div>
        {item.seo?.seo_score && <SEOScore score={item.seo.seo_score} />}
        {!item.jobId && (
          <button onClick={() => onRemove(index)} style={{ background:"none", border:"none", color:C.danger, fontSize:"16px", cursor:"pointer", padding:"2px 6px", borderRadius:"6px", flexShrink:0 }}>✕</button>
        )}
      </div>

      {/* Video preview */}
      {item.preview && (
        <video src={item.preview} style={{ width:"100%", maxHeight:"100px", borderRadius:"8px", objectFit:"cover", marginBottom:"10px", background:"#000" }} />
      )}

      {/* Job progress */}
      {item.jobId && item.jobStatus !== "done" && item.jobStatus !== "error" && (
        <div style={{ marginBottom:"10px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
            <Spinner size={14} color={C.purple} />
            <span style={{ fontSize:"11px", color:C.purple, fontWeight:"700" }}>{item.jobMessage || "Processing…"}</span>
          </div>
          <div style={{ height:"4px", background:C.hairline, borderRadius:"99px", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${item.jobProgress||0}%`, background:`linear-gradient(90deg,${C.purple},${C.rose})`, borderRadius:"99px", transition:"width 0.5s" }} />
          </div>
        </div>
      )}

      {/* Done result */}
      {item.jobStatus === "done" && item.jobResult && (
        <div style={{ background:`${C.success}10`, border:`1px solid ${C.success}30`, borderRadius:"10px", padding:"10px 12px", marginBottom:"10px" }}>
          <div style={{ fontSize:"12px", fontWeight:"800", color:C.success, marginBottom:"4px" }}>🎉 Uploaded!</div>
          <div style={{ fontSize:"11px", color:C.ink, marginBottom:"6px" }}>{item.jobResult.title}</div>
          <a href={item.jobResult.video_url} target="_blank" rel="noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:"4px", padding:"6px 14px", borderRadius:"8px", background:"#ff0000", color:"white", fontWeight:"800", fontSize:"11px", textDecoration:"none" }}>
            ▶ View on YouTube
          </a>
        </div>
      )}

      {/* Error */}
      {item.jobStatus === "error" && (
        <div style={{ background:`${C.danger}10`, border:`1px solid ${C.danger}30`, borderRadius:"10px", padding:"10px 12px", marginBottom:"10px", fontSize:"11px", color:C.danger }}>
          ❌ {item.jobError || "Upload failed"}
        </div>
      )}

      {/* Inputs — only show if not uploaded yet */}
      {!item.jobId && (
        <>
          {/* Keyword + SEO */}
          <div style={{ display:"flex", gap:"6px", marginBottom:"8px" }}>
            <input
              value={item.keyword}
              onChange={e => onUpdate(index, { keyword: e.target.value })}
              placeholder="Keyword for AI SEO *"
              style={{ flex:1, padding:"9px 12px", borderRadius:"10px", border:`1.5px solid ${C.hairline}`, background:C.inputBg, color:C.ink, fontSize:"12px", fontFamily:"inherit", outline:"none" }}
            />
            <button onClick={generateSEO} disabled={genLoading || !item.keyword.trim()}
              style={{ padding:"9px 12px", borderRadius:"10px", border:"none", background:(!item.keyword.trim())?C.hairline:`${C.purple}22`, color:(!item.keyword.trim())?C.muted:C.purple, fontWeight:"800", fontSize:"11px", cursor:(!item.keyword.trim())?"not-allowed":"pointer", fontFamily:"inherit", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:"4px" }}>
              {genLoading ? <Spinner size={12} color={C.purple} /> : "✨"} SEO
            </button>
          </div>

          {/* SEO preview if generated */}
          {item.seoGenerated && item.seo && (
            <div style={{ background:`${C.purple}08`, border:`1px solid ${C.purple}22`, borderRadius:"10px", padding:"10px 12px", marginBottom:"8px" }}>
              <div style={{ fontSize:"12px", fontWeight:"700", color:C.ink, marginBottom:"4px" }}>{item.seo.title}</div>
              <div style={{ fontSize:"10px", color:C.muted }}>{item.seo.tags?.slice(0,5).join(", ")}</div>
            </div>
          )}

          {/* Type + Language row */}
          <div style={{ display:"flex", gap:"6px", marginBottom:"8px" }}>
            <select value={item.videoType} onChange={e => onUpdate(index, { videoType: e.target.value })}
              style={{ flex:1, padding:"7px 10px", borderRadius:"9px", border:`1.5px solid ${C.hairline}`, background:C.inputBg, color:C.ink, fontSize:"11px", fontFamily:"inherit" }}>
              <option value="video">🎬 Long Video</option>
              <option value="short">⚡ Short</option>
            </select>
            <select value={item.language} onChange={e => onUpdate(index, { language: e.target.value })}
              style={{ flex:1, padding:"7px 10px", borderRadius:"9px", border:`1.5px solid ${C.hairline}`, background:C.inputBg, color:C.ink, fontSize:"11px", fontFamily:"inherit" }}>
              <option value="Hindi/English">Hinglish</option>
              <option value="Hindi">Hindi</option>
              <option value="English">English</option>
              <option value="Tamil">Tamil</option>
              <option value="Marathi">Marathi</option>
            </select>
          </div>

          {/* Schedule row */}
          <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom: item.scheduleType === "custom" ? "8px" : "0" }}>
            {[["now","🔴 Now"],["best",`⭐ Best${bestTime?" ("+bestTime.ist_label.split(" ").slice(0,2).join(" ")+")":`"`}`],["custom","📅 Custom"]].map(([v,l]) => (
              <button key={v} onClick={() => onUpdate(index, { scheduleType: v })}
                style={{ padding:"5px 10px", borderRadius:"8px", border:`1.5px solid ${item.scheduleType===v?C.purple:C.hairline}`, background:item.scheduleType===v?`${C.purple}15`:C.glass, color:item.scheduleType===v?C.purple:C.muted, fontWeight:"700", fontSize:"10.5px", cursor:"pointer", fontFamily:"inherit" }}>
                {l}
              </button>
            ))}
          </div>

          {item.scheduleType === "custom" && (
            <input type="datetime-local" value={item.customTime || ""} onChange={e => onUpdate(index, { customTime: e.target.value })}
              style={{ marginTop:"8px", width:"100%", padding:"8px 12px", borderRadius:"9px", border:`1.5px solid ${C.purple}44`, background:C.inputBg, color:C.ink, fontSize:"12px", fontFamily:"inherit" }} />
          )}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// BULK UPLOAD TAB
// ══════════════════════════════════════════════════════════════════════
function BulkUpload({ userId, plan, quota, setQuota, bestTime }) {
  const C = getC();
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [globalGenLoading, setGlobalGenLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();
  const pollRefs = useRef({});

  const maxVideos = quota?.remaining || 0;

  const addFiles = (files) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith("video/") && f.size <= 256*1024*1024);
    if (!validFiles.length) { setError("Please select valid video files (max 256MB each)"); return; }
    const canAdd = Math.min(validFiles.length, maxVideos - videos.length);
    if (canAdd <= 0) { setError(`Quota full. You have ${maxVideos} uploads remaining.`); return; }
    setError("");
    const newVideos = validFiles.slice(0, canAdd).map(file => ({
      file, preview: URL.createObjectURL(file),
      keyword: "", videoType: "video", language: "Hindi/English",
      scheduleType: "best", customTime: "", privacy: "public",
      seo: null, seoGenerated: false,
      jobId: null, jobStatus: null, jobProgress: 0, jobMessage: "", jobResult: null, jobError: null,
      userId,
    }));
    setVideos(prev => [...prev, ...newVideos]);
  };

  const updateVideo = (index, updates) => {
    setVideos(prev => prev.map((v, i) => i === index ? { ...v, ...updates } : v));
  };

  const removeVideo = (index) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  const generateAllSEO = async () => {
    const pending = videos.filter(v => v.keyword.trim() && !v.seoGenerated && !v.jobId);
    if (!pending.length) { setError("Add keywords to videos first"); return; }
    setGlobalGenLoading(true);
    await Promise.all(pending.map(async (item, i) => {
      const realIndex = videos.indexOf(item);
      try {
        const fd = new FormData();
        fd.append("user_id", userId); fd.append("keyword", item.keyword);
        fd.append("video_type", item.videoType); fd.append("language", item.language);
        const res = await fetch(`${BASE}/youtube/upload/seo`, { method:"POST", body:fd });
        const data = await res.json();
        if (res.ok && data.seo) {
          updateVideo(realIndex, { seo: data.seo, seoGenerated: true });
        }
      } catch(e) {}
    }));
    setGlobalGenLoading(false);
  };

  const pollJob = (jobId, index) => {
    if (pollRefs.current[jobId]) clearInterval(pollRefs.current[jobId]);
    pollRefs.current[jobId] = setInterval(async () => {
      try {
        const res = await fetch(`${BASE}/youtube/upload/job/${jobId}`);
        const data = await res.json();
        updateVideo(index, {
          jobStatus: data.status, jobProgress: data.progress,
          jobMessage: data.message, jobResult: data.result || null,
          jobError: data.error || null,
        });
        if (data.status === "done" || data.status === "error") {
          clearInterval(pollRefs.current[jobId]);
          if (data.status === "done" && data.result?.quota) setQuota(data.result.quota);
        }
      } catch {}
    }, 3000);
  };

  const uploadAll = async () => {
    const readyVideos = videos.filter(v => v.file && v.keyword.trim() && !v.jobId);
    if (!readyVideos.length) { setError("Add videos with keywords first"); return; }
    setUploading(true); setError("");

    for (let i = 0; i < videos.length; i++) {
      const item = videos[i];
      if (!item.file || !item.keyword.trim() || item.jobId) continue;

      try {
        const fd = new FormData();
        fd.append("user_id", userId); fd.append("keyword", item.keyword);
        fd.append("video_type", item.videoType); fd.append("schedule_type", item.scheduleType);
        fd.append("custom_time", item.customTime || ""); fd.append("privacy", item.privacy || "public");
        fd.append("language", item.language); fd.append("video", item.file);

        const res = await fetch(`${BASE}/youtube/upload/auto`, { method:"POST", body:fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail?.message || data.detail || "Upload failed");

        updateVideo(i, { jobId: data.job_id, jobStatus: "queued", jobProgress: 0, jobMessage: "Starting…" });
        pollJob(data.job_id, i);

        // Small delay between uploads
        await new Promise(r => setTimeout(r, 500));
      } catch(e) {
        updateVideo(i, { jobStatus: "error", jobError: e.message });
      }
    }
    setUploading(false);
  };

  const reset = () => {
    Object.values(pollRefs.current).forEach(clearInterval);
    setVideos([]); setError("");
  };

  useEffect(() => () => Object.values(pollRefs.current).forEach(clearInterval), []);

  const pendingCount = videos.filter(v => !v.jobId).length;
  const doneCount    = videos.filter(v => v.jobStatus === "done").length;
  const hasKeywords  = videos.filter(v => v.keyword.trim() && !v.seoGenerated && !v.jobId).length > 0;

  return (
    <div>
      <QuotaBar quota={quota} plan={plan} />

      {/* Drop zone */}
      {videos.length < maxVideos && (
        <div
          onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          style={{ border:`2px dashed ${dragOver ? C.yt : C.purple}55`, borderRadius:"16px", padding:"24px", textAlign:"center", cursor:"pointer", background:dragOver ? `${C.yt}08` : `${C.purple}04`, transition:"all 0.2s", marginBottom:"14px" }}
        >
          <input ref={fileRef} type="file" accept="video/*" multiple style={{ display:"none" }}
            onChange={e => addFiles(e.target.files)} />
          <div style={{ fontSize:"28px", marginBottom:"6px" }}>📹</div>
          <div style={{ fontSize:"14px", fontWeight:"800", color:C.ink }}>Drop videos here or click to select</div>
          <div style={{ fontSize:"11px", color:C.muted, marginTop:"4px" }}>
            Select up to {maxVideos - videos.length} video{maxVideos - videos.length !== 1 ? "s" : ""} · MP4, MOV, AVI · Max 256 MB each
          </div>
        </div>
      )}

      {error && (
        <div style={{ background:`${C.danger}12`, border:`1px solid ${C.danger}44`, borderRadius:"10px", padding:"10px 14px", marginBottom:"12px", fontSize:"12px", color:C.danger, fontWeight:"600" }}>
          ⚠ {error}
        </div>
      )}

      {/* Action buttons */}
      {videos.length > 0 && (
        <div style={{ display:"flex", gap:"8px", marginBottom:"14px", flexWrap:"wrap" }}>
          {hasKeywords && (
            <button onClick={generateAllSEO} disabled={globalGenLoading}
              style={{ flex:1, padding:"10px", borderRadius:"11px", border:`1.5px solid ${C.purple}44`, background:`${C.purple}12`, color:C.purple, fontWeight:"800", fontSize:"12px", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", minWidth:"120px" }}>
              {globalGenLoading ? <><Spinner size={14} color={C.purple} /> Generating…</> : "✨ Generate All SEO"}
            </button>
          )}
          {pendingCount > 0 && (
            <button onClick={uploadAll} disabled={uploading}
              style={{ flex:2, padding:"10px", borderRadius:"11px", border:"none", background:uploading?C.hairline:`linear-gradient(135deg,#ff0000,#cc0000)`, color:uploading?C.muted:"white", fontWeight:"900", fontSize:"13px", cursor:uploading?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
              {uploading ? <><Spinner size={14} color="white" /> Uploading…</> : `▶ Upload All (${pendingCount} video${pendingCount !== 1 ? "s" : ""})`}
            </button>
          )}
          {doneCount > 0 && doneCount === videos.length && (
            <button onClick={reset}
              style={{ padding:"10px 16px", borderRadius:"11px", border:`1.5px solid ${C.purple}44`, background:"transparent", color:C.purple, fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>
              + New Batch
            </button>
          )}
        </div>
      )}

      {/* Video cards */}
      {videos.map((item, index) => (
        <VideoCard key={index} item={item} index={index} onUpdate={updateVideo} onRemove={removeVideo} bestTime={bestTime} plan={plan} />
      ))}

      {videos.length === 0 && maxVideos === 0 && (
        <div style={{ textAlign:"center", padding:"24px", color:C.muted, fontSize:"13px" }}>
          You've used all {quota?.limit} uploads this month. Resets {quota?.reset_date ? new Date(quota.reset_date).toLocaleDateString("en-IN", { day:"numeric", month:"short" }) : "next month"}.
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SEO GENERATOR TAB
// ══════════════════════════════════════════════════════════════════════
function SEOGenerator({ userId, plan }) {
  const C = getC();
  const [keyword,   setKeyword  ] = useState("");
  const [videoType, setVideoType] = useState("video");
  const [language,  setLanguage ] = useState("Hindi/English");
  const [loading,   setLoading  ] = useState(false);
  const [seo,       setSeo      ] = useState(null);
  const [error,     setError    ] = useState("");
  const [copied,    setCopied   ] = useState("");

  const copy = (text, key) => { navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 2000); };

  const generate = async () => {
    if (!keyword.trim()) { setError("Enter a keyword"); return; }
    setLoading(true); setError(""); setSeo(null);
    try {
      const fd = new FormData();
      fd.append("user_id", userId); fd.append("keyword", keyword);
      fd.append("video_type", videoType); fd.append("language", language);
      const res  = await fetch(`${BASE}/youtube/upload/seo`, { method:"POST", body:fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      setSeo(data.seo);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ fontSize:"13px", fontWeight:"700", color:C.ink, marginBottom:"4px" }}>🤖 AI Viral SEO Generator</div>
      <div style={{ fontSize:"11.5px", color:C.muted, marginBottom:"16px" }}>Enter any keyword → viral title, full description, 20 tags + SEO score</div>

      <input value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => e.key==="Enter" && generate()}
        placeholder="e.g. AI tools for students, cricket tips…"
        style={{ width:"100%", padding:"12px 14px", borderRadius:"12px", border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:"13px", fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:"10px" }} />

      <div style={{ display:"flex", gap:"8px", marginBottom:"12px" }}>
        {[["video","🎬 Long"],["short","⚡ Short"]].map(([v,l]) => (
          <button key={v} onClick={() => setVideoType(v)} style={{ flex:1, padding:"8px", borderRadius:"10px", border:`1.5px solid ${videoType===v?C.yt:C.hairline}`, background:videoType===v?`${C.yt}12`:C.glass, color:videoType===v?C.yt:C.muted, fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
        ))}
        <select value={language} onChange={e => setLanguage(e.target.value)}
          style={{ flex:2, padding:"8px 10px", borderRadius:"10px", border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:"12px", fontFamily:"inherit" }}>
          <option value="Hindi/English">Hinglish</option>
          <option value="Hindi">Hindi</option>
          <option value="English">English</option>
          <option value="Tamil">Tamil</option>
          <option value="Marathi">Marathi</option>
        </select>
      </div>

      {error && <div style={{ background:`${C.danger}12`, border:`1px solid ${C.danger}44`, borderRadius:"10px", padding:"10px 14px", marginBottom:"12px", fontSize:"12px", color:C.danger }}>⚠ {error}</div>}

      <button onClick={generate} disabled={loading || !keyword.trim()}
        style={{ width:"100%", padding:"12px", borderRadius:"12px", border:"none", background:(loading||!keyword.trim())?C.hairline:`linear-gradient(135deg,${C.purple},${C.rose})`, color:(loading||!keyword.trim())?C.muted:"white", fontWeight:"800", fontSize:"14px", cursor:(loading||!keyword.trim())?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", marginBottom:"14px" }}>
        {loading ? <><Spinner size={16} color="white" /> Generating…</> : "✨ Generate Viral SEO"}
      </button>

      {seo && (
        <div style={{ background:C.glass, border:`1.5px solid ${C.purple}22`, borderRadius:"16px", padding:"16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
            <span style={{ fontSize:"12px", fontWeight:"900", color:C.purple, textTransform:"uppercase" }}>🤖 AI Viral SEO</span>
            {seo.seo_score && <SEOScore score={seo.seo_score} />}
          </div>

          {[
            { label:"Title", text:seo.title, key:"title" },
            { label:"Description", text:seo.description, key:"desc" },
          ].map(({ label, text, key }) => (
            <div key={key} style={{ marginBottom:"12px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"4px" }}>
                <span style={{ fontSize:"10px", fontWeight:"700", color:C.muted, textTransform:"uppercase" }}>{label}</span>
                <button onClick={() => copy(text, key)} style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"6px", border:`1px solid ${C.hairline}`, background:"transparent", color:copied===key?C.success:C.muted, cursor:"pointer", fontFamily:"inherit" }}>{copied===key?"✓ Copied":"Copy"}</button>
              </div>
              <div style={{ fontSize:key==="title"?"14px":"11px", fontWeight:key==="title"?"800":"400", color:C.ink, lineHeight:1.5, maxHeight:key==="desc"?"80px":"none", overflow:key==="desc"?"hidden":"visible", whiteSpace:"pre-wrap" }}>{text}</div>
            </div>
          ))}

          <div style={{ marginBottom:"10px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
              <span style={{ fontSize:"10px", fontWeight:"700", color:C.muted, textTransform:"uppercase" }}>Tags ({seo.tags?.length})</span>
              <button onClick={() => copy(seo.tags?.join(", "), "tags")} style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"6px", border:`1px solid ${C.hairline}`, background:"transparent", color:copied==="tags"?C.success:C.muted, cursor:"pointer", fontFamily:"inherit" }}>{copied==="tags"?"✓ Copied":"Copy All"}</button>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"4px" }}>
              {(seo.tags||[]).map((tag,i) => <span key={i} style={{ padding:"2px 8px", borderRadius:"99px", background:`${C.purple}12`, color:C.purple, fontSize:"10.5px", fontWeight:"600" }}>{tag}</span>)}
            </div>
          </div>

          {seo.hashtags?.length > 0 && (
            <div style={{ fontSize:"12px", color:C.teal, fontWeight:"700" }}>{seo.hashtags.join(" ")}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// THUMBNAIL ANALYZER TAB
// ══════════════════════════════════════════════════════════════════════
function ThumbnailAnalyzer({ userId }) {
  const C = getC();
  const [thumb1, setThumb1] = useState(null);
  const [thumb2, setThumb2] = useState(null);
  const [prev1,  setPrev1 ] = useState("");
  const [prev2,  setPrev2 ] = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult ] = useState(null);
  const [error,   setError  ] = useState("");
  const ref1 = useRef(); const ref2 = useRef();

  const handleImg = (file, n) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (n===1) { setThumb1(file); setPrev1(URL.createObjectURL(file)); }
    else       { setThumb2(file); setPrev2(URL.createObjectURL(file)); }
    setResult(null);
  };

  const analyze = async () => {
    if (!thumb1) { setError("Upload at least 1 thumbnail"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const fd = new FormData();
      fd.append("user_id", userId); fd.append("thumbnail1", thumb1);
      if (thumb2) fd.append("thumbnail2", thumb2);
      const res  = await fetch(`${BASE}/youtube/upload/thumbnail`, { method:"POST", body:fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Analysis failed");
      setResult(data);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const ScoreRing = ({ score }) => {
    const col = score >= 80 ? C.success : score >= 60 ? C.warn : C.danger;
    return (
      <div style={{ textAlign:"center" }}>
        <div style={{ width:"52px", height:"52px", borderRadius:"50%", border:`4px solid ${col}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 4px", background:`${col}12` }}>
          <span style={{ fontSize:"15px", fontWeight:"900", color:col }}>{score}</span>
        </div>
        <div style={{ fontSize:"9px", fontWeight:"800", color:col, textTransform:"uppercase" }}>{score>=80?"HIGH":score>=60?"MED":"LOW"} CTR</div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ fontSize:"13px", fontWeight:"700", color:C.ink, marginBottom:"4px" }}>🖼️ Thumbnail CTR Analyzer</div>
      <div style={{ fontSize:"11.5px", color:C.muted, marginBottom:"16px" }}>Upload 1 to analyze, or 2 to A/B compare — AI picks the winner</div>

      <div style={{ display:"flex", gap:"10px", marginBottom:"14px" }}>
        {[{ label:"Thumbnail A *", prev:prev1, ref:ref1, n:1 }, { label:"Thumbnail B", prev:prev2, ref:ref2, n:2 }].map(({ label, prev, ref, n }) => (
          <div key={n} onClick={() => ref.current?.click()}
            style={{ flex:1, border:`2px dashed ${prev?C.success:C.purple}55`, borderRadius:"12px", padding:"10px", textAlign:"center", cursor:"pointer", background:prev?`${C.success}06`:`${C.purple}04`, minHeight:"80px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <input ref={ref} type="file" accept="image/*" style={{ display:"none" }} onChange={e => handleImg(e.target.files[0], n)} />
            {prev ? <img src={prev} alt={label} style={{ width:"100%", maxHeight:"60px", objectFit:"cover", borderRadius:"6px" }} />
              : <><div style={{ fontSize:"20px" }}>🖼️</div><div style={{ fontSize:"10px", fontWeight:"700", color:C.purple, marginTop:"3px" }}>{label}</div></>}
          </div>
        ))}
      </div>

      {error && <div style={{ background:`${C.danger}12`, border:`1px solid ${C.danger}44`, borderRadius:"10px", padding:"10px 14px", marginBottom:"12px", fontSize:"12px", color:C.danger }}>⚠ {error}</div>}

      <button onClick={analyze} disabled={loading || !thumb1}
        style={{ width:"100%", padding:"12px", borderRadius:"12px", border:"none", background:(loading||!thumb1)?C.hairline:`linear-gradient(135deg,${C.purple},${C.rose})`, color:(loading||!thumb1)?C.muted:"white", fontWeight:"800", fontSize:"14px", cursor:(loading||!thumb1)?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", marginBottom:"16px" }}>
        {loading ? <><Spinner size={16} color="white" /> Analyzing…</> : "🔍 Analyze Thumbnail"}
      </button>

      {result?.analysis && (
        <div style={{ background:C.glass, border:`1.5px solid ${C.purple}22`, borderRadius:"14px", padding:"16px" }}>
          {result.mode === "compare" && result.analysis.winner && (
            <div style={{ background:`${C.success}12`, border:`1px solid ${C.success}44`, borderRadius:"10px", padding:"10px 12px", marginBottom:"12px" }}>
              <div style={{ fontSize:"13px", fontWeight:"900", color:C.success }}>🏆 Thumbnail {result.analysis.winner} wins!</div>
              <div style={{ fontSize:"11px", color:C.ink, marginTop:"3px" }}>{result.analysis.winner_reason}</div>
            </div>
          )}

          {result.mode === "single" && (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
                <span style={{ fontSize:"13px", fontWeight:"900", color:C.ink }}>Analysis Result</span>
                <ScoreRing score={result.analysis.ctr_score} />
              </div>
              {prev1 && <img src={prev1} style={{ width:"100%", maxHeight:"100px", objectFit:"cover", borderRadius:"8px", marginBottom:"10px" }} alt="thumbnail" />}
            </>
          )}

          {[
            { label:"✅ Strengths", items:result.analysis.strengths || result.analysis.thumbnail_a?.strengths, col:C.success },
            { label:"❌ Weaknesses", items:result.analysis.weaknesses || result.analysis.thumbnail_a?.weaknesses, col:C.danger },
            { label:"🚀 Improvements", items:result.analysis.improvements || result.analysis.thumbnail_a?.improvements, col:C.purple },
          ].map(({ label, items, col }) => items?.filter(Boolean).length > 0 && (
            <div key={label} style={{ marginBottom:"10px" }}>
              <div style={{ fontSize:"10px", fontWeight:"700", color:col, marginBottom:"4px", textTransform:"uppercase" }}>{label}</div>
              {items.filter(Boolean).map((item,i) => <div key={i} style={{ fontSize:"11.5px", color:C.ink, padding:"2px 0" }}>• {item}</div>)}
            </div>
          ))}

          {result.analysis.overall && (
            <div style={{ background:`${C.purple}08`, borderRadius:"10px", padding:"10px", marginTop:"8px", fontSize:"12px", color:C.ink, fontStyle:"italic" }}>
              {result.analysis.overall}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════
export default function YouTubeUpload({ user }) {
  const C      = getC();
  const userId = user?.user_id || localStorage.getItem("sociomee_user_id") || "";

  const [activeTab, setActiveTab] = useState("upload");
  const [plan,      setPlan     ] = useState("free");
  const [quota,     setQuota    ] = useState(null);
  const [bestTime,  setBestTime ] = useState(null);

  useEffect(() => {
    if (!userId) return;
    fetch(`${BASE}/youtube/upload/quota?user_id=${userId}`)
      .then(r => r.json()).then(d => { setQuota(d); setPlan(d.plan || "free"); }).catch(() => {});
    fetch(`${BASE}/youtube/upload/best-time`)
      .then(r => r.json()).then(d => setBestTime(d)).catch(() => {});
  }, [userId]);

  const isPro = plan?.includes("pro") || plan?.includes("premium");

  if (!isPro) return <UpgradeWall />;

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", paddingBottom:"20px" }}>
      {/* Tabs */}
      <div style={{ display:"flex", gap:"4px", marginBottom:"16px", background:`${C.purple}08`, borderRadius:"12px", padding:"4px" }}>
        {[["upload","📤 Bulk Upload"],["seo","🤖 SEO AI"],["thumb","🖼️ Thumbnail"]].map(([id,label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ flex:1, padding:"8px 4px", borderRadius:"9px", border:"none", background:activeTab===id?C.glass:"transparent", color:activeTab===id?C.purple:C.muted, fontWeight:activeTab===id?"800":"600", fontSize:"11.5px", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", boxShadow:activeTab===id?"0 1px 4px rgba(0,0,0,0.08)":"none" }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === "upload" && <BulkUpload userId={userId} plan={plan} quota={quota} setQuota={setQuota} bestTime={bestTime} />}
      {activeTab === "seo"    && <SEOGenerator userId={userId} plan={plan} />}
      {activeTab === "thumb"  && <ThumbnailAnalyzer userId={userId} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, select:focus { outline: none; border-color: #7c3aed !important; }
      `}</style>
    </div>
  );
}