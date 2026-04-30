/**
 * YouTubeUpload.js — SocioMee YouTube Auto-Upload with AI SEO
 * Pro: 4 uploads/month, Full SEO (title + desc + 20 tags)
 * Premium: 15 uploads/month, Perfect SEO + competitor research + hooks
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
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", border: `3px solid ${(color || C.purple)}22`, borderTopColor: color || C.purple, animation: "spin 0.7s linear infinite", display: "inline-block" }} />
  );
}

function PlanBadge({ plan }) {
  const C = getC();
  const isPremium = plan?.includes("premium");
  const isPro = plan?.includes("pro");
  if (!isPro && !isPremium) return null;
  return (
    <span style={{ padding: "2px 10px", borderRadius: "99px", fontSize: "10px", fontWeight: "800", letterSpacing: "0.8px", textTransform: "uppercase", background: isPremium ? "linear-gradient(135deg,#f59e0b,#ef4444)" : `${C.purple}22`, color: isPremium ? "white" : C.purple, border: isPremium ? "none" : `1px solid ${C.purple}44` }}>
      {isPremium ? "⭐ PREMIUM" : "✦ PRO"}
    </span>
  );
}

// ── Upgrade wall for free users ───────────────────────────────────────
function UpgradeWall() {
  const C = getC();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px", gap: "16px", textAlign: "center" }}>
      <div style={{ fontSize: "48px" }}>🚀</div>
      <h3 style={{ fontSize: "18px", fontWeight: "900", color: C.ink }}>Auto-Upload is a Pro Feature</h3>
      <p style={{ fontSize: "13px", color: C.muted, lineHeight: 1.6, maxWidth: "320px" }}>
        Upload videos to YouTube with AI-generated SEO automatically. Just drop your video and we handle everything.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "300px" }}>
        {[
          { plan: "Pro ₹499/month", uploads: "4 uploads/month", seo: "Full AI SEO", color: C.purple },
          { plan: "Premium ₹2999/month", uploads: "15 uploads/month", seo: "Perfect SEO + Research", color: "#f59e0b" },
        ].map((p, i) => (
          <div key={i} style={{ background: C.glass, border: `1.5px solid ${p.color}44`, borderRadius: "14px", padding: "14px 16px", textAlign: "left" }}>
            <div style={{ fontSize: "13px", fontWeight: "800", color: p.color }}>{p.plan}</div>
            <div style={{ fontSize: "11.5px", color: C.muted, marginTop: "4px" }}>✓ {p.uploads} · ✓ {p.seo} · ✓ Auto DM</div>
          </div>
        ))}
      </div>
      <button style={{ padding: "12px 28px", borderRadius: "12px", border: "none", background: `linear-gradient(135deg,${C.purple},${C.rose})`, color: "white", fontWeight: "800", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" }}>
        Upgrade Now
      </button>
    </div>
  );
}

// ── Quota bar ─────────────────────────────────────────────────────────
function QuotaBar({ quota, plan }) {
  const C = getC();
  if (!quota) return null;
  const pct = quota.limit > 0 ? (quota.used / quota.limit) * 100 : 0;
  const col  = pct >= 100 ? C.danger : pct >= 75 ? C.warn : C.success;
  const resetDate = quota.reset_date ? new Date(quota.reset_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";
  return (
    <div style={{ background: C.glass, border: `1px solid ${C.hairline}`, borderRadius: "12px", padding: "12px 16px", marginBottom: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", color: C.ink }}>📤 Monthly Uploads</span>
          <PlanBadge plan={plan} />
        </div>
        <span style={{ fontSize: "12px", fontWeight: "800", color: col }}>{quota.used}/{quota.limit}</span>
      </div>
      <div style={{ height: "6px", background: `${C.hairline}`, borderRadius: "99px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: col, borderRadius: "99px", transition: "width 0.4s" }} />
      </div>
      <div style={{ fontSize: "10.5px", color: C.muted, marginTop: "6px" }}>
        {quota.remaining} uploads remaining · Resets {resetDate}
      </div>
    </div>
  );
}

// ── SEO Preview card ──────────────────────────────────────────────────
function SEOPreview({ seo, plan }) {
  const C = getC();
  const isPremium = plan?.includes("premium");
  if (!seo) return null;
  return (
    <div style={{ background: `linear-gradient(145deg,${C.purpleXlt},${isPremium ? "#fff8e1" : C.white})`, border: `1.5px solid ${isPremium ? "#f59e0b44" : C.purple + "33"}`, borderRadius: "16px", padding: "18px", marginTop: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <span style={{ fontSize: "11px", fontWeight: "900", letterSpacing: "1.2px", textTransform: "uppercase", color: isPremium ? "#f59e0b" : C.purple }}>
          {isPremium ? "⭐ Perfect AI SEO + Research" : "✦ Full AI SEO"}
        </span>
        <PlanBadge plan={plan} />
      </div>

      {/* Title */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "10px", fontWeight: "700", color: C.muted, textTransform: "uppercase", marginBottom: "4px" }}>Title</div>
        <div style={{ fontSize: "14px", fontWeight: "800", color: C.ink, lineHeight: 1.4 }}>{seo.title}</div>
        {seo.best_title_alternatives?.length > 0 && (
          <div style={{ marginTop: "6px" }}>
            <div style={{ fontSize: "10px", color: C.muted, marginBottom: "3px" }}>Alternative titles:</div>
            {seo.best_title_alternatives.map((t, i) => (
              <div key={i} style={{ fontSize: "12px", color: C.slate, padding: "3px 0", borderBottom: `1px solid ${C.hairline}` }}>→ {t}</div>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "10px", fontWeight: "700", color: C.muted, textTransform: "uppercase", marginBottom: "4px" }}>Description</div>
        <div style={{ fontSize: "12px", color: C.slate, lineHeight: 1.6, maxHeight: "80px", overflow: "hidden", position: "relative" }}>
          {seo.description}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "30px", background: `linear-gradient(transparent,${isPremium ? "#fff8e1" : C.purpleXlt})` }} />
        </div>
      </div>

      {/* Tags */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ fontSize: "10px", fontWeight: "700", color: C.muted, textTransform: "uppercase", marginBottom: "6px" }}>Tags ({seo.tags?.length})</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {(seo.tags || []).slice(0, 15).map((tag, i) => (
            <span key={i} style={{ padding: "2px 8px", borderRadius: "99px", background: `${C.purple}15`, color: C.purple, fontSize: "10.5px", fontWeight: "600" }}>{tag}</span>
          ))}
          {seo.tags?.length > 15 && <span style={{ padding: "2px 8px", fontSize: "10.5px", color: C.muted }}>+{seo.tags.length - 15} more</span>}
        </div>
      </div>

      {/* Hashtags */}
      {seo.hashtags?.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <div style={{ fontSize: "10px", fontWeight: "700", color: C.muted, textTransform: "uppercase", marginBottom: "6px" }}>Hashtags</div>
          <div style={{ fontSize: "12px", color: C.teal, fontWeight: "600" }}>{seo.hashtags.join(" ")}</div>
        </div>
      )}

      {/* Premium extras */}
      {isPremium && (
        <>
          {seo.hook && (
            <div style={{ background: `${C.success}12`, border: `1px solid ${C.success}33`, borderRadius: "10px", padding: "10px 14px", marginBottom: "10px" }}>
              <div style={{ fontSize: "10px", fontWeight: "800", color: C.success, marginBottom: "4px" }}>🎬 OPENING HOOK (first 15 sec)</div>
              <div style={{ fontSize: "12px", color: C.slate, fontStyle: "italic" }}>"{seo.hook}"</div>
            </div>
          )}
          {seo.thumbnail_idea && (
            <div style={{ background: `${C.warn}12`, border: `1px solid ${C.warn}33`, borderRadius: "10px", padding: "10px 14px" }}>
              <div style={{ fontSize: "10px", fontWeight: "800", color: C.warn, marginBottom: "4px" }}>🖼️ THUMBNAIL IDEA</div>
              <div style={{ fontSize: "12px", color: C.slate }}>{seo.thumbnail_idea}</div>
            </div>
          )}
        </>
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

  const [plan,          setPlan        ] = useState("free");
  const [quota,         setQuota       ] = useState(null);
  const [videoFile,     setVideoFile   ] = useState(null);
  const [videoPreview,  setVideoPreview] = useState("");
  const [topic,         setTopic       ] = useState("");
  const [videoType,     setVideoType   ] = useState("video");
  const [scheduleType,  setScheduleType] = useState("now");
  const [customTime,    setCustomTime  ] = useState("");
  const [privacy,       setPrivacy     ] = useState("public");
  const [language,      setLanguage    ] = useState("Hindi/English");
  const [seo,           setSeo         ] = useState(null);
  const [seoLoading,    setSeoLoading  ] = useState(false);
  const [uploading,     setUploading   ] = useState(false);
  const [result,        setResult      ] = useState(null);
  const [error,         setError       ] = useState("");
  const [bestTime,      setBestTime    ] = useState(null);
  const [dragOver,      setDragOver    ] = useState(false);
  const fileRef = useRef();

  // Load plan + quota
  useEffect(() => {
    if (!userId) return;
    fetch(`${BASE}/youtube/upload/quota?user_id=${userId}`)
      .then(r => r.json())
      .then(d => { setQuota(d); setPlan(d.plan || "free"); })
      .catch(() => {});

    fetch(`${BASE}/youtube/upload/best-time`)
      .then(r => r.json())
      .then(d => setBestTime(d))
      .catch(() => {});
  }, [userId]);

  const isPro     = plan?.includes("pro") || plan?.includes("premium");
  const isPremium = plan?.includes("premium");

  // File handling
  const handleFile = (file) => {
    if (!file || !file.type.startsWith("video/")) {
      setError("Please select a valid video file.");
      return;
    }
    if (file.size > 256 * 1024 * 1024) {
      setError("File too large. Max 256 MB.");
      return;
    }
    setError("");
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setSeo(null);
    setResult(null);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // SEO Preview
  const handleSeoPreview = async () => {
    if (!topic.trim()) { setError("Enter a topic first"); return; }
    setSeoLoading(true); setError(""); setSeo(null);
    try {
      const res  = await fetch(`${BASE}/youtube/upload/seo-preview?user_id=${userId}&topic=${encodeURIComponent(topic)}&video_type=${videoType}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "SEO generation failed");
      setSeo(data.seo);
    } catch (e) {
      setError(e.message);
    } finally {
      setSeoLoading(false);
    }
  };

  // Upload
  const handleUpload = async () => {
    if (!videoFile) { setError("Please select a video file"); return; }
    if (!topic.trim()) { setError("Enter a video topic"); return; }
    if (!quota?.can_upload) { setError("Monthly upload limit reached"); return; }

    setUploading(true); setError(""); setResult(null);
    try {
      const fd = new FormData();
      fd.append("user_id",       userId);
      fd.append("topic",         topic);
      fd.append("video_type",    videoType);
      fd.append("schedule_type", scheduleType);
      fd.append("custom_time",   customTime);
      fd.append("privacy",       privacy);
      fd.append("language",      language);
      fd.append("video",         videoFile);

      const res  = await fetch(`${BASE}/youtube/upload/auto`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail?.message || data.detail || "Upload failed");

      setResult(data);
      setSeo(data.seo);
      setQuota(data.quota);
      setVideoFile(null);
      setVideoPreview("");
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  if (!isPro) return <UpgradeWall />;

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", paddingBottom: "20px" }}>

      {/* Quota bar */}
      <QuotaBar quota={quota} plan={plan} />

      {/* Success result */}
      {result && (
        <div style={{ background: `${getC().success}12`, border: `1.5px solid ${getC().success}44`, borderRadius: "16px", padding: "18px", marginBottom: "20px" }}>
          <div style={{ fontSize: "13px", fontWeight: "900", color: getC().success, marginBottom: "10px" }}>✅ Video Uploaded Successfully!</div>
          <div style={{ fontSize: "13px", color: getC().ink, fontWeight: "700", marginBottom: "6px" }}>{result.title}</div>
          {result.scheduled
            ? <div style={{ fontSize: "12px", color: getC().warn }}>⏰ Scheduled: {result.best_time?.ist_label || new Date(result.scheduled).toLocaleString("en-IN")}</div>
            : <div style={{ fontSize: "12px", color: getC().success }}>🔴 Live on YouTube now</div>
          }
          <a href={result.video_url} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "10px", padding: "8px 18px", borderRadius: "10px", background: "#ff0000", color: "white", fontWeight: "700", fontSize: "12px", textDecoration: "none" }}>
            ▶ View on YouTube
          </a>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        style={{ border: `2px dashed ${dragOver ? getC().yt : getC().purple}`, borderRadius: "16px", padding: videoPreview ? "12px" : "36px 24px", textAlign: "center", cursor: "pointer", background: dragOver ? `${getC().yt}08` : `${getC().purple}06`, transition: "all 0.2s", marginBottom: "16px" }}
      >
        <input ref={fileRef} type="file" accept="video/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
        {videoPreview ? (
          <div>
            <video src={videoPreview} style={{ width: "100%", maxHeight: "160px", borderRadius: "10px", objectFit: "cover" }} controls />
            <div style={{ fontSize: "12px", color: getC().muted, marginTop: "8px" }}>
              📹 {videoFile?.name} ({(videoFile?.size / 1024 / 1024).toFixed(1)} MB)
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: "36px", marginBottom: "10px" }}>📹</div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: getC().ink }}>Drop video here or click to select</div>
            <div style={{ fontSize: "12px", color: getC().muted, marginTop: "4px" }}>Supports MP4, MOV, AVI · Max 256 MB · Shorts & Long videos</div>
          </>
        )}
      </div>

      {/* Video type */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
        {[["video", "🎬 Long Video"], ["short", "⚡ Short (< 60s)"]].map(([val, label]) => (
          <button key={val} onClick={() => setVideoType(val)} style={{ flex: 1, padding: "10px", borderRadius: "12px", border: `1.5px solid ${videoType === val ? getC().yt : getC().hairline}`, background: videoType === val ? `${getC().yt}15` : getC().glass, color: videoType === val ? getC().yt : getC().muted, fontWeight: "700", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Topic input */}
      <div style={{ marginBottom: "14px" }}>
        <label style={{ fontSize: "11px", fontWeight: "700", color: getC().muted, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Video Topic *</label>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. 10 AI tools for Indian students"
            style={{ flex: 1, padding: "11px 14px", borderRadius: "12px", border: `1.5px solid ${getC().hairline}`, background: getC().glass, color: getC().ink, fontSize: "13px", fontFamily: "inherit", outline: "none" }}
          />
          <button onClick={handleSeoPreview} disabled={seoLoading || !topic.trim()} style={{ padding: "11px 16px", borderRadius: "12px", border: "none", background: seoLoading ? getC().hairline : `linear-gradient(135deg,${getC().purple},${getC().rose})`, color: "white", fontWeight: "800", fontSize: "12px", cursor: seoLoading ? "not-allowed" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}>
            {seoLoading ? <Spinner size={14} color="white" /> : "🤖 Preview SEO"}
          </button>
        </div>
      </div>

      {/* Language */}
      <div style={{ marginBottom: "14px" }}>
        <label style={{ fontSize: "11px", fontWeight: "700", color: getC().muted, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Language</label>
        <select value={language} onChange={e => setLanguage(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: "12px", border: `1.5px solid ${getC().hairline}`, background: getC().glass, color: getC().ink, fontSize: "13px", fontFamily: "inherit" }}>
          <option value="Hindi/English">Hindi/English (Hinglish)</option>
          <option value="Hindi">Hindi only</option>
          <option value="English">English only</option>
          <option value="Tamil">Tamil</option>
          <option value="Telugu">Telugu</option>
          <option value="Marathi">Marathi</option>
          <option value="Bengali">Bengali</option>
        </select>
      </div>

      {/* Schedule */}
      <div style={{ marginBottom: "14px" }}>
        <label style={{ fontSize: "11px", fontWeight: "700", color: getC().muted, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>When to Post</label>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {[
            ["now",    "🔴 Post Now"],
            ["best",  `⭐ Best Time${bestTime ? ` (${bestTime.ist_label})` : ""}`],
            ["custom","📅 Custom Time"],
          ].map(([val, label]) => (
            <button key={val} onClick={() => setScheduleType(val)} style={{ padding: "8px 14px", borderRadius: "10px", border: `1.5px solid ${scheduleType === val ? getC().purple : getC().hairline}`, background: scheduleType === val ? `${getC().purple}18` : getC().glass, color: scheduleType === val ? getC().purple : getC().muted, fontWeight: "700", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>
              {label}
            </button>
          ))}
        </div>
        {scheduleType === "custom" && (
          <input type="datetime-local" value={customTime} onChange={e => setCustomTime(e.target.value)} style={{ marginTop: "8px", width: "100%", padding: "10px 14px", borderRadius: "12px", border: `1.5px solid ${getC().purple}44`, background: getC().glass, color: getC().ink, fontSize: "13px", fontFamily: "inherit" }} />
        )}
      </div>

      {/* Privacy */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ fontSize: "11px", fontWeight: "700", color: getC().muted, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Privacy</label>
        <div style={{ display: "flex", gap: "6px" }}>
          {[["public", "🌍 Public"], ["unlisted", "🔗 Unlisted"], ["private", "🔒 Private"]].map(([val, label]) => (
            <button key={val} onClick={() => setPrivacy(val)} style={{ flex: 1, padding: "8px", borderRadius: "10px", border: `1.5px solid ${privacy === val ? getC().teal : getC().hairline}`, background: privacy === val ? `${getC().teal}18` : getC().glass, color: privacy === val ? getC().teal : getC().muted, fontWeight: "700", fontSize: "11.5px", cursor: "pointer", fontFamily: "inherit" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: `${getC().danger}12`, border: `1px solid ${getC().danger}44`, borderRadius: "10px", padding: "10px 14px", marginBottom: "14px", fontSize: "12.5px", color: getC().danger, fontWeight: "600" }}>
          ⚠ {error}
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={uploading || !videoFile || !topic.trim() || !quota?.can_upload}
        style={{ width: "100%", padding: "14px", borderRadius: "14px", border: "none", background: uploading || !videoFile || !topic.trim() || !quota?.can_upload ? getC().hairline : "linear-gradient(135deg,#ff0000,#cc0000)", color: uploading || !videoFile || !topic.trim() ? getC().muted : "white", fontWeight: "900", fontSize: "15px", cursor: uploading || !videoFile || !topic.trim() || !quota?.can_upload ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: "all 0.2s" }}
      >
        {uploading ? (
          <><Spinner size={18} color="white" /> Uploading & Generating AI SEO…</>
        ) : (
          <>▶ Auto-Upload to YouTube ({quota?.remaining || 0} left this month)</>
        )}
      </button>

      {isPremium && !uploading && (
        <p style={{ textAlign: "center", fontSize: "11px", color: getC().muted, marginTop: "8px" }}>
          ⭐ Premium: DeepSeek competitor research + Gemma perfect SEO applied
        </p>
      )}

      {/* SEO Preview */}
      <SEOPreview seo={seo} plan={plan} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, select:focus { outline: none; border-color: #7c3aed !important; }
      `}</style>
    </div>
  );
}