/**
 * YouTubeUpload.js — SocioMee YouTube Auto-Upload
 * Tabs: Upload | SEO AI | Thumbnail Analyzer
 */

import { useState, useEffect, useRef } from "react";

const BASE = "https://sociomee.in/api";

function getC() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  return dark ? {
    rose:"#ff6eb5", purple:"#a78bfa", teal:"#22d3ee", ink:"#ede8ff",
    muted:"#9d86c8", hairline:"rgba(167,139,250,0.15)", glass:"rgba(22,14,42,0.82)",
    success:"#34d399", warn:"#fbbf24", danger:"#f87171", yt:"#ff0000",
    purpleXlt:"#150d2a", slate:"#c4b5fd",
  } : {
    rose:"#ff3d8f", purple:"#7c3aed", teal:"#0891b2", ink:"#0d0015",
    muted:"#8b6b9a", hairline:"rgba(124,58,237,0.12)", glass:"rgba(255,255,255,0.92)",
    success:"#10b981", warn:"#f59e0b", danger:"#ef4444", yt:"#ff0000",
    purpleXlt:"#f5f3ff", slate:"#3b1f4e",
  };
}

const Spinner = ({ size=20, color }) => {
  const C = getC();
  return <div style={{ width:size, height:size, borderRadius:"50%", border:`2.5px solid ${(color||C.purple)}22`, borderTopColor:color||C.purple, animation:"spin 0.7s linear infinite", display:"inline-block", flexShrink:0 }} />;
};

function PlanBadge({ plan }) {
  const C = getC();
  const isPremium = plan?.includes("premium");
  if (!plan?.includes("pro") && !isPremium) return null;
  return <span style={{ padding:"2px 10px", borderRadius:"99px", fontSize:"10px", fontWeight:"800", letterSpacing:"0.8px", textTransform:"uppercase", background:isPremium?"linear-gradient(135deg,#f59e0b,#ef4444)":`${C.purple}22`, color:isPremium?"white":C.purple, border:isPremium?"none":`1px solid ${C.purple}44` }}>{isPremium?"⭐ PREMIUM":"✦ PRO"}</span>;
}

function UpgradeWall() {
  const C = getC();
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"40px 24px", gap:"16px", textAlign:"center" }}>
      <div style={{ fontSize:"48px" }}>🚀</div>
      <h3 style={{ fontSize:"18px", fontWeight:"900", color:C.ink, margin:0 }}>Pro Feature</h3>
      <p style={{ fontSize:"13px", color:C.muted, lineHeight:1.6, maxWidth:"300px", margin:0 }}>Upgrade to unlock AI SEO, auto-upload, and thumbnail analysis.</p>
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
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <span style={{ fontSize:"12px", fontWeight:"700", color:C.ink }}>📤 Monthly Uploads</span>
          <PlanBadge plan={plan} />
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

// ── SEO Score Badge ───────────────────────────────────────────────────
function SEOScore({ score }) {
  const C   = getC();
  const col = score >= 85 ? C.success : score >= 65 ? C.warn : C.danger;
  const lbl = score >= 85 ? "HIGH" : score >= 65 ? "MEDIUM" : "LOW";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"6px 12px", borderRadius:"10px", background:`${col}15`, border:`1.5px solid ${col}44` }}>
      <div style={{ width:"36px", height:"36px", borderRadius:"50%", border:`3px solid ${col}`, display:"flex", alignItems:"center", justifyContent:"center", background:`${col}20` }}>
        <span style={{ fontSize:"13px", fontWeight:"900", color:col }}>{score}</span>
      </div>
      <div>
        <div style={{ fontSize:"9px", fontWeight:"700", color:col, textTransform:"uppercase", letterSpacing:"1px" }}>SEO Score — {lbl}</div>
        <div style={{ fontSize:"10px", color:C.muted, marginTop:"1px" }}>
          {score >= 85 ? "🟢 Excellent — High chance of ranking" : score >= 65 ? "🟡 Good — Will perform well" : "🔴 Needs improvement"}
        </div>
      </div>
    </div>
  );
}

// ── Growth Prediction Card ────────────────────────────────────────────
function GrowthPrediction({ prediction }) {
  const C = getC();
  if (!prediction) return null;
  const virCol = prediction.viral_probability === "high" ? C.success : prediction.viral_probability === "medium" ? C.warn : C.muted;

  return (
    <div style={{ background:`${C.purple}08`, border:`1.5px solid ${C.purple}22`, borderRadius:"14px", padding:"16px", marginTop:"16px" }}>
      <div style={{ fontSize:"12px", fontWeight:"900", color:C.purple, marginBottom:"12px", textTransform:"uppercase", letterSpacing:"1px" }}>📈 AI Growth Prediction</div>

      {/* Stats grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginBottom:"12px" }}>
        {[
          { label:"7 Days", value: prediction.views_7_days?.toLocaleString("en-IN"), icon:"👁️" },
          { label:"30 Days", value: prediction.views_30_days?.toLocaleString("en-IN"), icon:"📅" },
          { label:"90 Days", value: prediction.views_90_days?.toLocaleString("en-IN"), icon:"🚀" },
        ].map((s,i) => (
          <div key={i} style={{ background:C.glass, borderRadius:"10px", padding:"10px 8px", textAlign:"center", border:`1px solid ${C.hairline}` }}>
            <div style={{ fontSize:"16px", marginBottom:"2px" }}>{s.icon}</div>
            <div style={{ fontSize:"13px", fontWeight:"900", color:C.ink }}>{s.value}</div>
            <div style={{ fontSize:"9px", color:C.muted, fontWeight:"600", textTransform:"uppercase" }}>Views · {s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"12px" }}>
        {[
          { label:"New Subscribers", value:`+${prediction.new_subscribers}`, col:C.success },
          { label:"Est. Revenue", value:prediction.revenue_estimate, col:C.warn },
          { label:"Expected CTR", value:prediction.estimated_ctr, col:C.teal },
          { label:"Watch Time", value:`${prediction.watch_time_hours}h`, col:C.purple },
        ].map((s,i) => (
          <div key={i} style={{ background:C.glass, borderRadius:"10px", padding:"8px 10px", border:`1px solid ${C.hairline}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:"10px", color:C.muted }}>{s.label}</span>
            <span style={{ fontSize:"12px", fontWeight:"800", color:s.col }}>{s.value}</span>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
        <span style={{ fontSize:"11px", color:C.muted }}>Viral Probability</span>
        <span style={{ fontSize:"12px", fontWeight:"800", color:virCol, textTransform:"capitalize" }}>
          {prediction.viral_probability === "high" ? "🔥" : prediction.viral_probability === "medium" ? "⚡" : "📌"} {prediction.viral_probability}
        </span>
      </div>

      {prediction.growth_tip && (
        <div style={{ background:`${C.success}10`, border:`1px solid ${C.success}30`, borderRadius:"10px", padding:"10px 12px" }}>
          <div style={{ fontSize:"10px", fontWeight:"800", color:C.success, marginBottom:"3px" }}>💡 PRO TIP</div>
          <div style={{ fontSize:"11.5px", color:C.ink }}>{prediction.growth_tip}</div>
        </div>
      )}
    </div>
  );
}

// ── SEO Card ──────────────────────────────────────────────────────────
function SEOCard({ seo, plan }) {
  const C = getC();
  const isPremium = plan?.includes("premium");
  const [copied, setCopied] = useState("");

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  if (!seo) return null;

  return (
    <div style={{ background:C.glass, border:`1.5px solid ${C.purple}22`, borderRadius:"16px", padding:"16px", marginTop:"14px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
        <span style={{ fontSize:"12px", fontWeight:"900", color:C.purple, textTransform:"uppercase", letterSpacing:"1px" }}>🤖 AI Viral SEO</span>
        {seo.seo_score && <SEOScore score={seo.seo_score} />}
      </div>

      {seo.why_viral && (
        <div style={{ background:`${C.success}12`, border:`1px solid ${C.success}30`, borderRadius:"10px", padding:"10px 12px", marginBottom:"12px", fontSize:"12px", color:C.ink, fontStyle:"italic" }}>
          💡 {seo.why_viral}
        </div>
      )}

      {/* Title */}
      <div style={{ marginBottom:"12px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"4px" }}>
          <span style={{ fontSize:"10px", fontWeight:"700", color:C.muted, textTransform:"uppercase" }}>Title</span>
          <button onClick={() => copy(seo.title, "title")} style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"6px", border:`1px solid ${C.hairline}`, background:"transparent", color:copied==="title"?C.success:C.muted, cursor:"pointer", fontFamily:"inherit" }}>{copied==="title"?"✓ Copied":"Copy"}</button>
        </div>
        <div style={{ fontSize:"14px", fontWeight:"800", color:C.ink, lineHeight:1.4 }}>{seo.title}</div>
        {seo.best_title_alternatives?.length > 0 && (
          <div style={{ marginTop:"6px" }}>
            <div style={{ fontSize:"10px", color:C.muted, marginBottom:"3px" }}>Alternatives:</div>
            {seo.best_title_alternatives.map((t,i) => <div key={i} style={{ fontSize:"11.5px", color:C.slate, padding:"2px 0", borderBottom:`1px solid ${C.hairline}` }}>→ {t}</div>)}
          </div>
        )}
      </div>

      {/* Description */}
      <div style={{ marginBottom:"12px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"4px" }}>
          <span style={{ fontSize:"10px", fontWeight:"700", color:C.muted, textTransform:"uppercase" }}>Description</span>
          <button onClick={() => copy(seo.description, "desc")} style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"6px", border:`1px solid ${C.hairline}`, background:"transparent", color:copied==="desc"?C.success:C.muted, cursor:"pointer", fontFamily:"inherit" }}>{copied==="desc"?"✓ Copied":"Copy"}</button>
        </div>
        <div style={{ fontSize:"11px", color:C.slate, lineHeight:1.6, maxHeight:"100px", overflow:"hidden", position:"relative", whiteSpace:"pre-wrap" }}>
          {seo.description}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"30px", background:`linear-gradient(transparent,${C.glass})` }} />
        </div>
      </div>

      {/* Tags */}
      <div style={{ marginBottom:"12px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
          <span style={{ fontSize:"10px", fontWeight:"700", color:C.muted, textTransform:"uppercase" }}>Tags ({seo.tags?.length})</span>
          <button onClick={() => copy(seo.tags?.join(", "), "tags")} style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"6px", border:`1px solid ${C.hairline}`, background:"transparent", color:copied==="tags"?C.success:C.muted, cursor:"pointer", fontFamily:"inherit" }}>{copied==="tags"?"✓ Copied":"Copy All"}</button>
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"4px" }}>
          {(seo.tags||[]).map((tag,i) => (
            <span key={i} style={{ padding:"2px 8px", borderRadius:"99px", background:`${C.purple}12`, color:C.purple, fontSize:"10.5px", fontWeight:"600" }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Hashtags */}
      {seo.hashtags?.length > 0 && (
        <div style={{ marginBottom:"12px" }}>
          <span style={{ fontSize:"10px", fontWeight:"700", color:C.muted, textTransform:"uppercase", display:"block", marginBottom:"4px" }}>Hashtags</span>
          <div style={{ fontSize:"12px", color:C.teal, fontWeight:"700" }}>{seo.hashtags.join(" ")}</div>
        </div>
      )}

      {/* Premium extras */}
      {isPremium && (
        <>
          {seo.hook && (
            <div style={{ background:`${C.success}10`, border:`1px solid ${C.success}30`, borderRadius:"10px", padding:"10px 12px", marginBottom:"10px" }}>
              <div style={{ fontSize:"10px", fontWeight:"800", color:C.success, marginBottom:"4px" }}>🎬 OPENING HOOK (first 15 sec)</div>
              <div style={{ fontSize:"12px", color:C.ink, fontStyle:"italic" }}>"{seo.hook}"</div>
            </div>
          )}
          {seo.thumbnail_idea && (
            <div style={{ background:`${C.warn}10`, border:`1px solid ${C.warn}30`, borderRadius:"10px", padding:"10px 12px", marginBottom:"10px" }}>
              <div style={{ fontSize:"10px", fontWeight:"800", color:C.warn, marginBottom:"4px" }}>🖼️ THUMBNAIL IDEA</div>
              <div style={{ fontSize:"12px", color:C.ink }}>{seo.thumbnail_idea}</div>
            </div>
          )}
          {seo.upload_tip && (
            <div style={{ background:`${C.teal}10`, border:`1px solid ${C.teal}30`, borderRadius:"10px", padding:"10px 12px" }}>
              <div style={{ fontSize:"10px", fontWeight:"800", color:C.teal, marginBottom:"4px" }}>⚡ UPLOAD TIP</div>
              <div style={{ fontSize:"12px", color:C.ink }}>{seo.upload_tip}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Upload Progress ───────────────────────────────────────────────────
function UploadProgress({ job, onReset }) {
  const C = getC();
  if (!job) return null;
  const isDone  = job.status === "done";
  const isError = job.status === "error";
  const color   = isDone ? C.success : isError ? C.danger : C.purple;

  return (
    <div style={{ marginBottom:"16px" }}>
      {/* Status bar */}
      <div style={{ background:isDone?`${C.success}10`:isError?`${C.danger}10`:`${C.purple}08`, border:`1.5px solid ${color}44`, borderRadius:"16px", padding:"16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom: isDone||isError ? "0" : "12px" }}>
          {!isDone && !isError && <Spinner size={18} color={C.purple} />}
          {isDone  && <span style={{ fontSize:"22px" }}>✅</span>}
          {isError && <span style={{ fontSize:"22px" }}>❌</span>}
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"13px", fontWeight:"900", color }}>{job.message}</div>
            {!isDone && !isError && <div style={{ fontSize:"11px", color:C.muted, marginTop:"1px" }}>Please keep this tab open</div>}
          </div>
        </div>

        {!isDone && !isError && (
          <div>
            <div style={{ height:"8px", background:`${C.hairline}`, borderRadius:"99px", overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${job.progress}%`, background:`linear-gradient(90deg,${C.purple},${C.rose})`, borderRadius:"99px", transition:"width 0.6s ease" }} />
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:"4px" }}>
              <span style={{ fontSize:"10px", fontWeight:"800", color:C.purple }}>{job.progress}%</span>
            </div>
          </div>
        )}

        {isError && (
          <div style={{ marginTop:"8px" }}>
            <div style={{ fontSize:"12px", color:C.danger, marginBottom:"10px" }}>{job.error || "Something went wrong."}</div>
            <button onClick={onReset} style={{ padding:"8px 16px", borderRadius:"10px", border:`1px solid ${C.danger}44`, background:"transparent", color:C.danger, fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>Try Again</button>
          </div>
        )}
      </div>

      {/* Success result */}
      {isDone && job.result && (
        <div style={{ background:`linear-gradient(135deg,${C.success}12,${C.teal}08)`, border:`2px solid ${C.success}44`, borderRadius:"16px", padding:"18px", marginTop:"12px" }}>
          <div style={{ fontSize:"11px", fontWeight:"900", color:C.success, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"10px" }}>🎉 Video Live on YouTube!</div>
          <div style={{ fontSize:"14px", fontWeight:"800", color:C.ink, lineHeight:1.4, marginBottom:"8px" }}>{job.result.title}</div>
          {job.result.scheduled
            ? <div style={{ fontSize:"12px", color:C.warn, marginBottom:"12px" }}>⏰ Scheduled: {job.result.best_time?.ist_label}</div>
            : <div style={{ fontSize:"12px", color:C.success, marginBottom:"12px" }}>🔴 Live now · Processing on YouTube</div>
          }
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
            <a href={job.result.video_url} target="_blank" rel="noreferrer"
              style={{ display:"inline-flex", alignItems:"center", gap:"6px", padding:"10px 20px", borderRadius:"12px", background:"#ff0000", color:"white", fontWeight:"800", fontSize:"13px", textDecoration:"none" }}>
              ▶ View on YouTube
            </a>
            <button onClick={onReset}
              style={{ padding:"10px 16px", borderRadius:"12px", border:`1.5px solid ${C.purple}44`, background:"transparent", color:C.purple, fontWeight:"700", fontSize:"13px", cursor:"pointer", fontFamily:"inherit" }}>
              + Upload Another
            </button>
          </div>

          {/* SEO */}
          {job.result.seo && <SEOCard seo={job.result.seo} plan={job.result.plan} />}

          {/* Growth Prediction */}
          {job.result.prediction && <GrowthPrediction prediction={job.result.prediction} />}
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
      <div style={{ fontSize:"13px", fontWeight:"700", color:getC().ink, marginBottom:"4px" }}>🤖 AI Viral SEO Generator</div>
      <div style={{ fontSize:"11.5px", color:getC().muted, marginBottom:"16px" }}>Enter any keyword → get viral title, perfect description, 20 tags, SEO score</div>

      <div style={{ marginBottom:"12px" }}>
        <input value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => e.key==="Enter" && generate()} placeholder="e.g. AI tools for students, cricket tips, recipe…" style={{ width:"100%", padding:"12px 14px", borderRadius:"12px", border:`1.5px solid ${getC().hairline}`, background:getC().glass, color:getC().ink, fontSize:"13px", fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
      </div>

      <div style={{ display:"flex", gap:"8px", marginBottom:"12px" }}>
        {[["video","🎬 Long"],["short","⚡ Short"]].map(([v,l]) => (
          <button key={v} onClick={() => setVideoType(v)} style={{ flex:1, padding:"8px", borderRadius:"10px", border:`1.5px solid ${videoType===v?getC().yt:getC().hairline}`, background:videoType===v?`${getC().yt}12`:getC().glass, color:videoType===v?getC().yt:getC().muted, fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
        ))}
        <select value={language} onChange={e => setLanguage(e.target.value)} style={{ flex:2, padding:"8px 10px", borderRadius:"10px", border:`1.5px solid ${getC().hairline}`, background:getC().glass, color:getC().ink, fontSize:"12px", fontFamily:"inherit" }}>
          <option value="Hindi/English">Hinglish</option>
          <option value="Hindi">Hindi</option>
          <option value="English">English</option>
          <option value="Tamil">Tamil</option>
          <option value="Telugu">Telugu</option>
          <option value="Marathi">Marathi</option>
        </select>
      </div>

      {error && <div style={{ background:`${getC().danger}12`, border:`1px solid ${getC().danger}44`, borderRadius:"10px", padding:"10px 14px", marginBottom:"12px", fontSize:"12px", color:getC().danger }}>⚠ {error}</div>}

      <button onClick={generate} disabled={loading||!keyword.trim()}
        style={{ width:"100%", padding:"12px", borderRadius:"12px", border:"none", background:(loading||!keyword.trim())?getC().hairline:`linear-gradient(135deg,${getC().purple},${getC().rose})`, color:(loading||!keyword.trim())?getC().muted:"white", fontWeight:"800", fontSize:"14px", cursor:(loading||!keyword.trim())?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
        {loading ? <><Spinner size={16} color="white" /> Generating…</> : "✨ Generate Viral SEO"}
      </button>

      {seo && <SEOCard seo={seo} plan={plan} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// THUMBNAIL ANALYZER TAB
// ══════════════════════════════════════════════════════════════════════
function ThumbnailAnalyzer({ userId }) {
  const C = getC();
  const [thumb1,  setThumb1 ] = useState(null);
  const [thumb2,  setThumb2 ] = useState(null);
  const [prev1,   setPrev1  ] = useState("");
  const [prev2,   setPrev2  ] = useState("");
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
      fd.append("user_id", userId);
      fd.append("thumbnail1", thumb1);
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
    const lbl = score >= 80 ? "HIGH CTR" : score >= 60 ? "MED CTR" : "LOW CTR";
    return (
      <div style={{ textAlign:"center", padding:"8px" }}>
        <div style={{ width:"56px", height:"56px", borderRadius:"50%", border:`4px solid ${col}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 4px", background:`${col}12` }}>
          <span style={{ fontSize:"16px", fontWeight:"900", color:col }}>{score}</span>
        </div>
        <div style={{ fontSize:"9px", fontWeight:"800", color:col, textTransform:"uppercase", letterSpacing:"0.5px" }}>{lbl}</div>
      </div>
    );
  };

  const TCard = ({ data, label, isWinner, preview }) => {
    if (!data) return null;
    return (
      <div style={{ background:isWinner?`${C.success}08`:C.glass, border:`1.5px solid ${isWinner?C.success:C.hairline}`, borderRadius:"14px", padding:"12px", flex:1, minWidth:0 }}>
        {isWinner && <div style={{ fontSize:"9px", fontWeight:"900", color:C.success, marginBottom:"6px", textTransform:"uppercase", letterSpacing:"1px" }}>🏆 WINNER</div>}
        <div style={{ fontSize:"11px", fontWeight:"800", color:C.ink, marginBottom:"6px" }}>{label}</div>
        {preview && <img src={preview} alt={label} style={{ width:"100%", height:"60px", objectFit:"cover", borderRadius:"8px", marginBottom:"8px" }} />}
        <ScoreRing score={data.ctr_score} />
        {[
          { label:"✅ Strengths", items:data.strengths, col:C.success },
          { label:"❌ Weaknesses", items:data.weaknesses, col:C.danger },
          { label:"🎨 Colors", items:[data.color_analysis], col:C.purple },
          { label:"📝 Text", items:[data.text_analysis], col:C.teal },
          { label:"😮 Face", items:[data.face_emotion], col:C.warn },
          { label:"🚀 Fix", items:data.improvements, col:C.rose },
        ].map(({ label:l, items, col }) => items?.filter(Boolean).length > 0 && (
          <div key={l} style={{ marginTop:"8px" }}>
            <div style={{ fontSize:"9px", fontWeight:"700", color:col, marginBottom:"2px" }}>{l}</div>
            {items.filter(Boolean).map((item,i) => <div key={i} style={{ fontSize:"10px", color:C.ink, padding:"1px 0" }}>• {item}</div>)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div style={{ fontSize:"13px", fontWeight:"700", color:C.ink, marginBottom:"4px" }}>🖼️ Thumbnail CTR Analyzer</div>
      <div style={{ fontSize:"11.5px", color:C.muted, marginBottom:"16px" }}>Upload 1 thumbnail to analyze, or 2 to compare — AI picks the winner</div>

      <div style={{ display:"flex", gap:"10px", marginBottom:"14px" }}>
        {[{ label:"Thumbnail A *", prev:prev1, ref:ref1, n:1 }, { label:"Thumbnail B (optional)", prev:prev2, ref:ref2, n:2 }].map(({ label, prev, ref, n }) => (
          <div key={n} onClick={() => ref.current?.click()}
            style={{ flex:1, border:`2px dashed ${prev?C.success:C.purple}55`, borderRadius:"12px", padding:"10px", textAlign:"center", cursor:"pointer", background:prev?`${C.success}06`:`${C.purple}04`, minHeight:"90px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <input ref={ref} type="file" accept="image/*" style={{ display:"none" }} onChange={e => handleImg(e.target.files[0], n)} />
            {prev
              ? <img src={prev} alt={label} style={{ width:"100%", maxHeight:"70px", objectFit:"cover", borderRadius:"6px" }} />
              : <><div style={{ fontSize:"22px" }}>🖼️</div><div style={{ fontSize:"10px", fontWeight:"700", color:C.purple, marginTop:"4px" }}>{label}</div></>
            }
          </div>
        ))}
      </div>

      {error && <div style={{ background:`${C.danger}12`, border:`1px solid ${C.danger}44`, borderRadius:"10px", padding:"10px 14px", marginBottom:"12px", fontSize:"12px", color:C.danger }}>⚠ {error}</div>}

      <button onClick={analyze} disabled={loading||!thumb1}
        style={{ width:"100%", padding:"12px", borderRadius:"12px", border:"none", background:(loading||!thumb1)?C.hairline:`linear-gradient(135deg,${C.purple},${C.rose})`, color:(loading||!thumb1)?C.muted:"white", fontWeight:"800", fontSize:"14px", cursor:(loading||!thumb1)?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", marginBottom:"16px" }}>
        {loading ? <><Spinner size={16} color="white" /> Analyzing with AI…</> : "🔍 Analyze Thumbnail"}
      </button>

      {result?.analysis && (
        <div>
          {result.mode === "compare" && result.analysis.winner && (
            <>
              <div style={{ background:`${C.success}12`, border:`1.5px solid ${C.success}44`, borderRadius:"12px", padding:"12px 16px", marginBottom:"12px" }}>
                <div style={{ fontSize:"13px", fontWeight:"900", color:C.success }}>🏆 Thumbnail {result.analysis.winner} wins!</div>
                <div style={{ fontSize:"12px", color:C.ink, marginTop:"4px" }}>{result.analysis.winner_reason}</div>
              </div>
              <div style={{ display:"flex", gap:"8px", marginBottom:"12px" }}>
                <TCard data={result.analysis.thumbnail_a} label="A" isWinner={result.analysis.winner==="A"} preview={prev1} />
                <TCard data={result.analysis.thumbnail_b} label="B" isWinner={result.analysis.winner==="B"} preview={prev2} />
              </div>
            </>
          )}

          {result.mode === "single" && (
            <div style={{ background:C.glass, border:`1.5px solid ${C.purple}22`, borderRadius:"14px", padding:"16px", marginBottom:"12px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px" }}>
                <span style={{ fontSize:"13px", fontWeight:"900", color:C.ink }}>Thumbnail Analysis</span>
                <ScoreRing score={result.analysis.ctr_score} />
              </div>
              {prev1 && <img src={prev1} style={{ width:"100%", maxHeight:"120px", objectFit:"cover", borderRadius:"10px", marginBottom:"12px" }} alt="thumbnail" />}
              {[
                { label:"✅ Strengths", items:result.analysis.strengths, col:C.success },
                { label:"❌ Weaknesses", items:result.analysis.weaknesses, col:C.danger },
                { label:"🚀 Improvements", items:result.analysis.improvements, col:C.purple },
                { label:"🎨 Color Grading", items:[result.analysis.color_analysis], col:C.warn },
                { label:"📝 Text Overlay", items:[result.analysis.text_analysis], col:C.teal },
                { label:"😮 Face & Emotion", items:[result.analysis.face_emotion], col:C.rose },
              ].map(({ label, items, col }) => items?.filter(Boolean).length > 0 && (
                <div key={label} style={{ marginBottom:"10px" }}>
                  <div style={{ fontSize:"10px", fontWeight:"700", color:col, marginBottom:"4px", textTransform:"uppercase" }}>{label}</div>
                  {items.filter(Boolean).map((item,i) => <div key={i} style={{ fontSize:"12px", color:C.ink, padding:"2px 0" }}>• {item}</div>)}
                </div>
              ))}
              {result.analysis.overall && (
                <div style={{ background:`${C.purple}08`, borderRadius:"10px", padding:"10px", marginTop:"8px" }}>
                  <div style={{ fontSize:"12px", color:C.ink, fontStyle:"italic" }}>{result.analysis.overall}</div>
                </div>
              )}
            </div>
          )}

          {result.analysis.general_tips?.length > 0 && (
            <div style={{ background:`${C.teal}10`, border:`1px solid ${C.teal}30`, borderRadius:"12px", padding:"12px 16px" }}>
              <div style={{ fontSize:"10px", fontWeight:"800", color:C.teal, marginBottom:"8px", textTransform:"uppercase" }}>💡 CTR Tips for Indian YouTube</div>
              {result.analysis.general_tips.map((tip,i) => <div key={i} style={{ fontSize:"12px", color:C.ink, padding:"3px 0" }}>→ {tip}</div>)}
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

  const [activeTab,    setActiveTab   ] = useState("upload");
  const [plan,         setPlan        ] = useState("free");
  const [quota,        setQuota       ] = useState(null);
  const [videoFile,    setVideoFile   ] = useState(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [keyword,      setKeyword     ] = useState("");
  const [videoType,    setVideoType   ] = useState("video");
  const [scheduleType, setScheduleType] = useState("now");
  const [customTime,   setCustomTime  ] = useState("");
  const [privacy,      setPrivacy     ] = useState("public");
  const [language,     setLanguage    ] = useState("Hindi/English");
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
      .then(r=>r.json()).then(d=>{ setQuota(d); setPlan(d.plan||"free"); }).catch(()=>{});
    fetch(`${BASE}/youtube/upload/best-time`)
      .then(r=>r.json()).then(d=>setBestTime(d)).catch(()=>{});
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
          if (data.result?.quota) setQuota(data.result.quota);
        }
        if (data.status === "error") { clearInterval(pollRef.current); setUploading(false); }
      } catch {}
    }, 3000);
  };

  useEffect(() => () => clearInterval(pollRef.current), []);

  const isPro = plan?.includes("pro") || plan?.includes("premium");

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("video/")) { setError("Please select a valid video file."); return; }
    if (file.size > 256*1024*1024) { setError("File too large. Max 256 MB."); return; }
    setError(""); setVideoFile(file); setVideoPreview(URL.createObjectURL(file)); setJob(null);
  };

  const resetUpload = () => {
    setJob(null); setVideoFile(null); setVideoPreview(""); setKeyword(""); setError(""); setUploading(false);
  };

  const handleUpload = async () => {
    if (!videoFile)         { setError("Please select a video file"); return; }
    if (!keyword.trim())    { setError("Enter a keyword for AI SEO"); return; }
    if (!quota?.can_upload) { setError("Monthly upload limit reached"); return; }

    setUploading(true); setError(""); setJob(null);
    try {
      const fd = new FormData();
      fd.append("user_id", userId); fd.append("keyword", keyword);
      fd.append("video_type", videoType); fd.append("schedule_type", scheduleType);
      fd.append("custom_time", customTime); fd.append("privacy", privacy);
      fd.append("language", language); fd.append("video", videoFile);

      const res  = await fetch(`${BASE}/youtube/upload/auto`, { method:"POST", body:fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail?.message || data.detail || "Upload failed");

      setJob({ job_id:data.job_id, status:"queued", progress:0, message:"Generating AI SEO…" });
      startPolling(data.job_id);
    } catch(e) { setError(e.message); setUploading(false); }
  };

  if (!isPro) return <UpgradeWall />;

  const isActive = uploading || (job && job.status !== "done" && job.status !== "error");

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", paddingBottom:"20px" }}>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"4px", marginBottom:"16px", background:`${C.purple}08`, borderRadius:"12px", padding:"4px" }}>
        {[["upload","📤 Upload"],["seo","🤖 SEO AI"],["thumb","🖼️ Thumbnail"]].map(([id,label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ flex:1, padding:"8px 4px", borderRadius:"9px", border:"none", background:activeTab===id?C.glass:"transparent", color:activeTab===id?C.purple:C.muted, fontWeight:activeTab===id?"800":"600", fontSize:"11.5px", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", boxShadow:activeTab===id?"0 1px 4px rgba(0,0,0,0.08)":"none" }}>
            {label}
          </button>
        ))}
      </div>

      {/* UPLOAD TAB */}
      {activeTab === "upload" && (
        <>
          <QuotaBar quota={quota} plan={plan} />

          {job && <UploadProgress job={job} onReset={resetUpload} />}

          {!isActive && !job?.status?.includes("done") && (
            <>
              {/* Drop zone */}
              <div
                onDrop={e=>{ e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                onDragOver={e=>{ e.preventDefault(); setDragOver(true); }}
                onDragLeave={()=>setDragOver(false)}
                onClick={()=>fileRef.current?.click()}
                style={{ border:`2px dashed ${dragOver?C.yt:C.purple}55`, borderRadius:"16px", padding:videoPreview?"12px":"30px 24px", textAlign:"center", cursor:"pointer", background:dragOver?`${C.yt}08`:`${C.purple}04`, transition:"all 0.2s", marginBottom:"14px" }}
              >
                <input ref={fileRef} type="file" accept="video/*" style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])} />
                {videoPreview ? (
                  <div>
                    <video src={videoPreview} style={{ width:"100%", maxHeight:"150px", borderRadius:"10px", objectFit:"cover" }} controls />
                    <div style={{ fontSize:"12px", color:C.muted, marginTop:"6px" }}>📹 {videoFile?.name} ({(videoFile?.size/1024/1024).toFixed(1)} MB)</div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize:"36px", marginBottom:"8px" }}>📹</div>
                    <div style={{ fontSize:"14px", fontWeight:"700", color:C.ink }}>Drop video here or click</div>
                    <div style={{ fontSize:"11px", color:C.muted, marginTop:"4px" }}>MP4, MOV, AVI · Max 256 MB · Any length ✓</div>
                  </>
                )}
              </div>

              <div style={{ display:"flex", gap:"8px", marginBottom:"12px" }}>
                {[["video","🎬 Long Video"],["short","⚡ Short"]].map(([v,l]) => (
                  <button key={v} onClick={()=>setVideoType(v)} style={{ flex:1, padding:"9px", borderRadius:"11px", border:`1.5px solid ${videoType===v?C.yt:C.hairline}`, background:videoType===v?`${C.yt}12`:C.glass, color:videoType===v?C.yt:C.muted, fontWeight:"700", fontSize:"12.5px", cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
                ))}
              </div>

              <div style={{ marginBottom:"12px" }}>
                <label style={{ fontSize:"10px", fontWeight:"700", color:C.muted, textTransform:"uppercase", display:"block", marginBottom:"5px" }}>Keyword for AI SEO *</label>
                <input value={keyword} onChange={e=>setKeyword(e.target.value)} placeholder="e.g. AI tools, cricket tips, cooking hacks…" style={{ width:"100%", padding:"11px 14px", borderRadius:"12px", border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:"13px", fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
                <div style={{ fontSize:"10px", color:C.muted, marginTop:"3px" }}>AI generates viral title, full description & 20 tags from this</div>
              </div>

              <select value={language} onChange={e=>setLanguage(e.target.value)} style={{ width:"100%", padding:"9px 12px", borderRadius:"11px", border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:"12px", fontFamily:"inherit", marginBottom:"12px" }}>
                <option value="Hindi/English">Hinglish (Hindi + English)</option>
                <option value="Hindi">Hindi only</option>
                <option value="English">English only</option>
                <option value="Tamil">Tamil</option>
                <option value="Telugu">Telugu</option>
                <option value="Marathi">Marathi</option>
              </select>

              <div style={{ marginBottom:"12px" }}>
                <label style={{ fontSize:"10px", fontWeight:"700", color:C.muted, textTransform:"uppercase", display:"block", marginBottom:"5px" }}>When to Post</label>
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                  {[["now","🔴 Post Now"],["best",`⭐ Best Time${bestTime?` (${bestTime.ist_label.split(" ").slice(0,2).join(" ")})`:""}` ],["custom","📅 Custom"]].map(([v,l]) => (
                    <button key={v} onClick={()=>setScheduleType(v)} style={{ padding:"7px 12px", borderRadius:"9px", border:`1.5px solid ${scheduleType===v?C.purple:C.hairline}`, background:scheduleType===v?`${C.purple}15`:C.glass, color:scheduleType===v?C.purple:C.muted, fontWeight:"700", fontSize:"11.5px", cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
                  ))}
                </div>
                {scheduleType==="custom" && (
                  <input type="datetime-local" value={customTime} onChange={e=>setCustomTime(e.target.value)} style={{ marginTop:"8px", width:"100%", padding:"9px 12px", borderRadius:"11px", border:`1.5px solid ${C.purple}44`, background:C.glass, color:C.ink, fontSize:"13px", fontFamily:"inherit" }} />
                )}
              </div>

              <div style={{ marginBottom:"16px" }}>
                <label style={{ fontSize:"10px", fontWeight:"700", color:C.muted, textTransform:"uppercase", display:"block", marginBottom:"5px" }}>Privacy</label>
                <div style={{ display:"flex", gap:"6px" }}>
                  {[["public","🌍 Public"],["unlisted","🔗 Unlisted"],["private","🔒 Private"]].map(([v,l]) => (
                    <button key={v} onClick={()=>setPrivacy(v)} style={{ flex:1, padding:"7px", borderRadius:"9px", border:`1.5px solid ${privacy===v?C.teal:C.hairline}`, background:privacy===v?`${C.teal}15`:C.glass, color:privacy===v?C.teal:C.muted, fontWeight:"700", fontSize:"11px", cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
                  ))}
                </div>
              </div>

              {error && <div style={{ background:`${C.danger}12`, border:`1px solid ${C.danger}44`, borderRadius:"10px", padding:"10px 14px", marginBottom:"12px", fontSize:"12px", color:C.danger, fontWeight:"600" }}>⚠ {error}</div>}

              <button onClick={handleUpload} disabled={!videoFile||!keyword.trim()||!quota?.can_upload}
                style={{ width:"100%", padding:"14px", borderRadius:"14px", border:"none", background:(!videoFile||!keyword.trim()||!quota?.can_upload)?C.hairline:"linear-gradient(135deg,#ff0000,#cc0000)", color:(!videoFile||!keyword.trim())?C.muted:"white", fontWeight:"900", fontSize:"15px", cursor:(!videoFile||!keyword.trim()||!quota?.can_upload)?"not-allowed":"pointer", fontFamily:"inherit", transition:"all 0.2s" }}>
                ▶ Upload + AI SEO ({quota?.remaining||0} left this month)
              </button>
            </>
          )}
        </>
      )}

      {activeTab === "seo"   && <SEOGenerator userId={userId} plan={plan} />}
      {activeTab === "thumb" && <ThumbnailAnalyzer userId={userId} plan={plan} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, select:focus { outline: none; border-color: #7c3aed !important; }
      `}</style>
    </div>
  );
}