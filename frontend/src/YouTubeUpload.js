/**
 * YouTubeUpload.js — SocioMee YouTube Bulk Upload + History + PDF
 * Tabs: Bulk Upload | History | SEO AI | Thumbnail
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
    <div style={{ display:"inline-flex", alignItems:"center", gap:"5px", padding:"3px 9px", borderRadius:"8px", background:`${col}15`, border:`1px solid ${col}44` }}>
      <span style={{ fontSize:"12px", fontWeight:"900", color:col }}>{score}</span>
      <span style={{ fontSize:"9px", fontWeight:"700", color:col, textTransform:"uppercase" }}>{lbl}</span>
    </div>
  );
}

// ── PDF Download ──────────────────────────────────────────────────────
function downloadSEOPdf(seo, videoUrl) {
  const C2 = getC();
  const date = new Date().toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" });
  const pred = seo.prediction;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
body{font-family:Arial,sans-serif;max-width:820px;margin:0 auto;padding:40px;color:#1a0a00}
.header{background:linear-gradient(135deg,#7c3aed,#ff3d8f);color:white;padding:24px 32px;border-radius:12px;margin-bottom:28px}
.logo{font-size:26px;font-weight:900;margin-bottom:4px}
.section{margin-bottom:20px;border-left:3px solid #7c3aed;padding-left:16px}
.section-title{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#7c3aed;margin-bottom:8px}
.title-box{background:#f5f3ff;border-radius:8px;padding:14px;font-size:16px;font-weight:700;line-height:1.4}
.score{display:inline-block;padding:4px 14px;border-radius:99px;font-size:13px;font-weight:800;margin-bottom:14px}
.tag{display:inline-block;padding:3px 9px;border-radius:99px;background:#f5f3ff;color:#7c3aed;font-size:11px;font-weight:600;margin:2px}
.query{display:inline-block;padding:3px 9px;border-radius:99px;background:#f0fdf4;color:#059669;font-size:11px;font-weight:600;margin:2px}
.desc{font-size:12px;line-height:1.8;white-space:pre-wrap;background:#f9f9f9;padding:12px;border-radius:8px}
.box-rose{background:#fff7f7;border:1px solid #fecaca;border-radius:8px;padding:10px 12px;font-size:12px}
.box-amber{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 12px;font-size:12px}
.predict{background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:16px;margin-bottom:16px}
.pgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:10px 0}
.pcard{background:white;border-radius:8px;padding:10px;text-align:center;border:1px solid #e9d5ff}
.pval{font-size:18px;font-weight:900;color:#7c3aed}
.plbl{font-size:9px;color:#8b6b9a;text-transform:uppercase;font-weight:700}
.p2grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0}
.p2card{background:white;border-radius:8px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center;border:1px solid #e9d5ff}
.tip{background:#f0fdf4;border-radius:8px;padding:10px;font-size:12px;color:#166534;margin-top:8px}
.alt{font-size:12px;color:#5b21b6;padding:3px 0;border-bottom:1px solid #ede9fe}
.footer{margin-top:40px;text-align:center;font-size:11px;color:#8b6b9a;border-top:1px solid #e9e3ff;padding-top:16px}
</style></head><body>
<div class="header">
  <div class="logo">SocioMee.</div>
  <div style="font-size:12px;opacity:0.85">✦ YouTube SEO Report · Generated ${date}</div>
</div>

${seo.seo_score ? `<div style="margin-bottom:16px">
  <span class="score" style="background:${seo.seo_score>=85?"#dcfce7":seo.seo_score>=65?"#fef9c3":"#fee2e2"};color:${seo.seo_score>=85?"#15803d":seo.seo_score>=65?"#854d0e":"#991b1b"}">
    SEO Score: ${seo.seo_score}/100 — ${seo.seo_score>=85?"EXCELLENT":seo.seo_score>=65?"GOOD":"NEEDS WORK"}
  </span>
</div>` : ""}

<div class="section">
  <div class="section-title">🎯 Viral Title</div>
  <div class="title-box">${seo.title||""}</div>
  ${(seo.best_title_alternatives||[]).length>0?`<div style="margin-top:8px">${seo.best_title_alternatives.map(t=>`<div class="alt">→ ${t}</div>`).join("")}</div>`:""}
</div>

${seo.why_viral?`<div class="section">
  <div class="section-title">💡 Why It Will Go Viral</div>
  <div style="font-size:13px;font-style:italic;color:#374151">${seo.why_viral}</div>
</div>`:""}

${seo.hook?`<div class="section">
  <div class="section-title">🎬 Opening Hook — First 15 Seconds</div>
  <div class="box-rose">"${seo.hook}"</div>
</div>`:""}

${seo.thumbnail_idea?`<div class="section">
  <div class="section-title">🖼️ Thumbnail Idea</div>
  <div class="box-amber">${seo.thumbnail_idea}</div>
</div>`:""}

<div class="section">
  <div class="section-title">📝 Full YouTube Description</div>
  <div class="desc">${(seo.description||"").replace(/</g,"&lt;")}</div>
</div>

<div class="section">
  <div class="section-title">🏷️ Tags (${(seo.tags||[]).length})</div>
  <div>${(seo.tags||[]).map(t=>`<span class="tag">${t}</span>`).join("")}</div>
</div>

${(seo.hashtags||[]).length>0?`<div class="section">
  <div class="section-title">🔖 Hashtags</div>
  <div style="font-size:13px;color:#0891b2;font-weight:700">${seo.hashtags.join(" ")}</div>
</div>`:""}

${(seo.queries||[]).length>0?`<div class="section">
  <div class="section-title">🔍 Search Queries People Use</div>
  <div>${(seo.queries||[]).map(q=>`<span class="query">${q}</span>`).join("")}</div>
</div>`:""}

${seo.category?`<div class="section">
  <div class="section-title">📂 YouTube Category</div>
  <div style="font-size:13px;font-weight:700">${seo.category}</div>
</div>`:""}

${pred?`<div class="predict">
  <div style="font-size:11px;font-weight:900;color:#7c3aed;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">📈 SocioMee Predicts</div>
  <div style="font-size:12px;color:#374151;margin-bottom:8px">Based on AI analysis of your topic, niche, and Indian YouTube trends</div>
  <div class="pgrid">
    <div class="pcard"><div class="pval">${pred.views_7_days?.toLocaleString("en-IN")||"—"}</div><div class="plbl">Views · 7 Days</div></div>
    <div class="pcard"><div class="pval">${pred.views_30_days?.toLocaleString("en-IN")||"—"}</div><div class="plbl">Views · 30 Days</div></div>
    <div class="pcard"><div class="pval">${pred.views_90_days?.toLocaleString("en-IN")||"—"}</div><div class="plbl">Views · 90 Days</div></div>
  </div>
  <div class="p2grid">
    <div class="p2card"><span style="font-size:10px;color:#8b6b9a">New Subscribers</span><span style="font-size:12px;font-weight:800;color:#10b981">+${pred.new_subscribers||"—"}</span></div>
    <div class="p2card"><span style="font-size:10px;color:#8b6b9a">Est. Revenue</span><span style="font-size:12px;font-weight:800;color:#f59e0b">${pred.revenue_estimate||"—"}</span></div>
    <div class="p2card"><span style="font-size:10px;color:#8b6b9a">Expected CTR</span><span style="font-size:12px;font-weight:800;color:#0891b2">${pred.estimated_ctr||"—"}</span></div>
    <div class="p2card"><span style="font-size:10px;color:#8b6b9a">Viral Probability</span><span style="font-size:12px;font-weight:800;color:${pred.viral_probability==="high"?"#10b981":pred.viral_probability==="medium"?"#f59e0b":"#8b6b9a"};text-transform:capitalize">${pred.viral_probability||"—"}</span></div>
  </div>
  ${pred.growth_tip?`<div class="tip">💡 <strong>SocioMee Recommends:</strong> ${pred.growth_tip}</div>`:""}
</div>`:""}

${videoUrl?`<div class="section">
  <div class="section-title">🔗 YouTube Video URL</div>
  <div style="font-size:13px;color:#0891b2">${videoUrl}</div>
</div>`:""}

<div class="footer">Generated by SocioMee · sociomee.in · AI Content Studio for Indian Creators</div>
</body></html>`;

  const blob = new Blob([html], { type:"text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SocioMee-SEO-${(seo.title||"video").slice(0,40).replace(/[^a-z0-9]/gi,"-")}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Full SEO Panel ────────────────────────────────────────────────────
function FullSEOPanel({ seo, prediction, videoUrl, compact=false }) {
  const C = getC();
  const [copied, setCopied] = useState("");
  const copy = (text, key) => { navigator.clipboard.writeText(String(text||"")); setCopied(key); setTimeout(()=>setCopied(""),2000); };
  if (!seo) return null;

  const lbl = { fontSize:"9px", fontWeight:"800", color:C.muted, textTransform:"uppercase", letterSpacing:"1.2px" };
  const row = { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"5px" };
  const copyBtn = (text, key) => (
    <button onClick={()=>copy(text,key)} style={{ fontSize:"9px", padding:"1px 8px", borderRadius:"5px", border:`1px solid ${C.hairline}`, background:"transparent", color:copied===key?C.success:C.muted, cursor:"pointer", fontFamily:"inherit" }}>
      {copied===key?"✓":"Copy"}
    </button>
  );

  const mergedSeo = { ...seo, ...(prediction ? { prediction } : {}) };

  return (
    <div style={{ background:`${C.purple}06`, border:`1.5px solid ${C.purple}25`, borderRadius:"12px", padding:"14px", marginTop:"8px" }}>
      {/* Header + PDF */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
        <span style={{ fontSize:"10px", fontWeight:"900", color:C.purple, textTransform:"uppercase", letterSpacing:"1px" }}>🤖 AI SEO Pack</span>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          {seo.seo_score && <SEOScore score={seo.seo_score} />}
          <button onClick={()=>downloadSEOPdf(mergedSeo, videoUrl)}
            style={{ padding:"4px 12px", borderRadius:"8px", border:"none", background:`linear-gradient(135deg,${C.purple},${C.rose})`, color:"white", fontWeight:"800", fontSize:"10px", cursor:"pointer", fontFamily:"inherit" }}>
            ⬇ PDF
          </button>
        </div>
      </div>

      {seo.why_viral && (
        <div style={{ background:`${C.success}10`, border:`1px solid ${C.success}25`, borderRadius:"8px", padding:"8px 10px", marginBottom:"10px", fontSize:"11px", color:C.ink }}>
          💡 <strong style={{color:C.success, fontStyle:"normal"}}>Why it'll go viral:</strong> <em>{seo.why_viral}</em>
        </div>
      )}

      {/* Title */}
      <div style={{ marginBottom:"10px" }}>
        <div style={row}><span style={lbl}>🎯 Viral Title</span>{copyBtn(seo.title,"title")}</div>
        <div style={{ fontSize:"13px", fontWeight:"800", color:C.ink, lineHeight:1.4 }}>{seo.title}</div>
        {(seo.best_title_alternatives||[]).length>0 && (
          <div style={{ marginTop:"5px" }}>
            {seo.best_title_alternatives.map((t,i) => <div key={i} style={{ fontSize:"11px", color:C.slate, padding:"2px 0", borderBottom:`1px solid ${C.hairline}` }}>→ {t}</div>)}
          </div>
        )}
      </div>

      {seo.hook && (
        <div style={{ background:`${C.rose}10`, border:`1px solid ${C.rose}25`, borderRadius:"8px", padding:"8px 10px", marginBottom:"10px" }}>
          <div style={{ fontSize:"9px", fontWeight:"800", color:C.rose, marginBottom:"3px", textTransform:"uppercase", letterSpacing:"1px" }}>🎬 Opening Hook — First 15 Seconds</div>
          <div style={{ fontSize:"11.5px", color:C.ink, fontStyle:"italic" }}>"{seo.hook}"</div>
        </div>
      )}

      {seo.thumbnail_idea && (
        <div style={{ background:`${C.warn}10`, border:`1px solid ${C.warn}25`, borderRadius:"8px", padding:"8px 10px", marginBottom:"10px" }}>
          <div style={{ fontSize:"9px", fontWeight:"800", color:C.warn, marginBottom:"3px", textTransform:"uppercase", letterSpacing:"1px" }}>🖼️ Thumbnail Idea</div>
          <div style={{ fontSize:"11.5px", color:C.ink }}>{seo.thumbnail_idea}</div>
        </div>
      )}

      {/* Description */}
      <div style={{ marginBottom:"10px" }}>
        <div style={row}><span style={lbl}>📝 Full Description</span>{copyBtn(seo.description,"desc")}</div>
        <div style={{ fontSize:"10.5px", color:C.slate, lineHeight:1.6, maxHeight:compact?"70px":"130px", overflow:"hidden", position:"relative", whiteSpace:"pre-wrap", background:C.glass, borderRadius:"8px", padding:"8px 10px" }}>
          {seo.description}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"24px", background:`linear-gradient(transparent,${C.glass})` }} />
        </div>
      </div>

      {/* Tags */}
      <div style={{ marginBottom:"10px" }}>
        <div style={row}><span style={lbl}>🏷️ Tags ({(seo.tags||[]).length})</span>{copyBtn((seo.tags||[]).join(", "),"tags")}</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"3px" }}>
          {(seo.tags||[]).map((tag,i) => <span key={i} style={{ padding:"2px 7px", borderRadius:"99px", background:`${C.purple}12`, color:C.purple, fontSize:"10px", fontWeight:"600" }}>{tag}</span>)}
        </div>
      </div>

      {(seo.hashtags||[]).length>0 && (
        <div style={{ marginBottom:"10px" }}>
          <div style={row}><span style={lbl}>🔖 Hashtags</span>{copyBtn((seo.hashtags||[]).join(" "),"hash")}</div>
          <div style={{ fontSize:"12px", color:C.teal, fontWeight:"700" }}>{seo.hashtags.join(" ")}</div>
        </div>
      )}

      {(seo.queries||[]).length>0 && (
        <div style={{ marginBottom:"10px" }}>
          <div style={{ ...lbl, marginBottom:"5px", display:"block" }}>🔍 Search Queries People Use</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"3px" }}>
            {seo.queries.map((q,i) => <span key={i} style={{ padding:"2px 7px", borderRadius:"99px", background:`${C.teal}12`, color:C.teal, fontSize:"10px", fontWeight:"600" }}>{q}</span>)}
          </div>
        </div>
      )}

      {seo.category && (
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
          <span style={lbl}>📂 Category</span>
          <span style={{ fontSize:"11px", fontWeight:"700", color:C.ink }}>{seo.category}</span>
        </div>
      )}

      {/* SocioMee Predicts */}
      {prediction && (
        <div style={{ background:`${C.purple}08`, border:`1.5px solid ${C.purple}25`, borderRadius:"10px", padding:"12px" }}>
          <div style={{ fontSize:"10px", fontWeight:"900", color:C.purple, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"3px" }}>📈 SocioMee Predicts</div>
          <div style={{ fontSize:"10px", color:C.muted, marginBottom:"10px" }}>Based on AI analysis of your topic, niche, and Indian YouTube trends</div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"6px", marginBottom:"8px" }}>
            {[{label:"7 Days",value:prediction.views_7_days?.toLocaleString("en-IN"),icon:"👁️"},{label:"30 Days",value:prediction.views_30_days?.toLocaleString("en-IN"),icon:"📅"},{label:"90 Days",value:prediction.views_90_days?.toLocaleString("en-IN"),icon:"🚀"}].map((s,i) => (
              <div key={i} style={{ background:C.glass, borderRadius:"8px", padding:"8px 6px", textAlign:"center", border:`1px solid ${C.hairline}` }}>
                <div style={{ fontSize:"13px", marginBottom:"1px" }}>{s.icon}</div>
                <div style={{ fontSize:"13px", fontWeight:"900", color:C.ink }}>{s.value}</div>
                <div style={{ fontSize:"9px", color:C.muted, fontWeight:"600", textTransform:"uppercase" }}>Views · {s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px", marginBottom:"8px" }}>
            {[
              {label:"New Subscribers",value:`+${prediction.new_subscribers}`,col:C.success},
              {label:"Est. Revenue",value:prediction.revenue_estimate,col:C.warn},
              {label:"Expected CTR",value:prediction.estimated_ctr,col:C.teal},
              {label:"Viral Probability",value:prediction.viral_probability,col:prediction.viral_probability==="high"?C.success:prediction.viral_probability==="medium"?C.warn:C.muted},
            ].map((s,i) => (
              <div key={i} style={{ background:C.glass, borderRadius:"8px", padding:"7px 10px", border:`1px solid ${C.hairline}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:"9px", color:C.muted, fontWeight:"600" }}>{s.label}</span>
                <span style={{ fontSize:"11px", fontWeight:"800", color:s.col, textTransform:"capitalize" }}>{s.value}</span>
              </div>
            ))}
          </div>

          {prediction.growth_tip && (
            <div style={{ background:`${C.success}10`, border:`1px solid ${C.success}25`, borderRadius:"8px", padding:"8px 10px" }}>
              <div style={{ fontSize:"9px", fontWeight:"800", color:C.success, marginBottom:"2px", textTransform:"uppercase" }}>💡 SocioMee Recommends</div>
              <div style={{ fontSize:"11px", color:C.ink }}>{prediction.growth_tip}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Single Video Card ─────────────────────────────────────────────────
function VideoCard({ item, index, onUpdate, onRemove, bestTime }) {
  const C = getC();
  const [genLoading, setGenLoading] = useState(false);

  const generateSEO = async () => {
    if (!item.keyword.trim()) return;
    setGenLoading(true);
    try {
      const fd = new FormData();
      fd.append("user_id", item.userId||""); fd.append("keyword", item.keyword);
      fd.append("video_type", item.videoType||"video"); fd.append("language", item.language||"Hindi/English");
      const res = await fetch(`${BASE}/youtube/upload/seo`, { method:"POST", body:fd });
      const data = await res.json();
      if (res.ok && data.seo) onUpdate(index, { seo:data.seo, seoGenerated:true });
    } catch(e) {}
    finally { setGenLoading(false); }
  };

  const sc = item.jobStatus==="done"?C.success:item.jobStatus==="error"?C.danger:item.jobStatus==="uploading"?C.warn:C.hairline;
  const si = item.jobStatus==="done"?"✅":item.jobStatus==="error"?"❌":item.jobStatus==="uploading"?"⏳":"📹";

  return (
    <div style={{ background:C.glass, border:`1.5px solid ${sc}`, borderRadius:"16px", padding:"16px", marginBottom:"12px" }}>
      <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"10px" }}>
        <span style={{ fontSize:"18px" }}>{si}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:"12px", fontWeight:"800", color:C.ink, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.file?.name||"Video "+(index+1)}</div>
          <div style={{ fontSize:"10px", color:C.muted }}>{item.file?`${(item.file.size/1024/1024).toFixed(1)} MB`:""} {item.videoType==="short"?"· #Shorts":"· Long Video"}</div>
        </div>
        {item.seo?.seo_score && <SEOScore score={item.seo.seo_score} />}
        {!item.jobId && <button onClick={()=>onRemove(index)} style={{ background:"none", border:"none", color:C.danger, fontSize:"16px", cursor:"pointer", padding:"2px 6px", flexShrink:0 }}>✕</button>}
      </div>

      {item.preview && <video src={item.preview} style={{ width:"100%", maxHeight:"90px", borderRadius:"8px", objectFit:"cover", marginBottom:"10px", background:"#000" }} />}

      {item.jobId && item.jobStatus!=="done" && item.jobStatus!=="error" && (
        <div style={{ marginBottom:"10px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"4px" }}>
            <Spinner size={14} color={C.purple} />
            <span style={{ fontSize:"11px", color:C.purple, fontWeight:"700" }}>{item.jobMessage||"Processing…"}</span>
          </div>
          <div style={{ height:"4px", background:C.hairline, borderRadius:"99px", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${item.jobProgress||0}%`, background:`linear-gradient(90deg,${C.purple},${C.rose})`, borderRadius:"99px", transition:"width 0.5s" }} />
          </div>
        </div>
      )}

      {item.jobStatus==="done" && item.jobResult && (
        <div style={{ background:`${C.success}10`, border:`1px solid ${C.success}30`, borderRadius:"10px", padding:"10px 12px", marginBottom:"8px" }}>
          <div style={{ fontSize:"12px", fontWeight:"800", color:C.success, marginBottom:"4px" }}>🎉 Uploaded Successfully!</div>
          <div style={{ fontSize:"11px", color:C.ink, marginBottom:"6px" }}>{item.jobResult.title}</div>
          <a href={item.jobResult.video_url} target="_blank" rel="noreferrer"
            style={{ display:"inline-flex", alignItems:"center", gap:"4px", padding:"6px 14px", borderRadius:"8px", background:"#ff0000", color:"white", fontWeight:"800", fontSize:"11px", textDecoration:"none" }}>
            ▶ View on YouTube
          </a>
        </div>
      )}

      {item.jobStatus==="error" && (
        <div style={{ background:`${C.danger}10`, border:`1px solid ${C.danger}30`, borderRadius:"10px", padding:"10px 12px", marginBottom:"8px", fontSize:"11px", color:C.danger }}>
          ❌ {item.jobError||"Upload failed"}
        </div>
      )}

      {!item.jobId && (
        <>
          <div style={{ display:"flex", gap:"6px", marginBottom:"8px" }}>
            <input value={item.keyword} onChange={e=>onUpdate(index,{keyword:e.target.value})} placeholder="Keyword for AI SEO *"
              style={{ flex:1, padding:"9px 12px", borderRadius:"10px", border:`1.5px solid ${C.hairline}`, background:C.inputBg, color:C.ink, fontSize:"12px", fontFamily:"inherit", outline:"none" }} />
            <button onClick={generateSEO} disabled={genLoading||!item.keyword.trim()}
              style={{ padding:"9px 12px", borderRadius:"10px", border:"none", background:!item.keyword.trim()?C.hairline:`${C.purple}22`, color:!item.keyword.trim()?C.muted:C.purple, fontWeight:"800", fontSize:"11px", cursor:!item.keyword.trim()?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:"4px" }}>
              {genLoading?<Spinner size={12} color={C.purple}/>:"✨"} SEO
            </button>
          </div>

          {item.seoGenerated && item.seo && <FullSEOPanel seo={item.seo} prediction={null} videoUrl={null} compact={true} />}

          <div style={{ display:"flex", gap:"6px", marginBottom:"8px", marginTop:"8px" }}>
            <select value={item.videoType} onChange={e=>onUpdate(index,{videoType:e.target.value})}
              style={{ flex:1, padding:"7px 10px", borderRadius:"9px", border:`1.5px solid ${C.hairline}`, background:C.inputBg, color:C.ink, fontSize:"11px", fontFamily:"inherit" }}>
              <option value="video">🎬 Long Video</option>
              <option value="short">⚡ Short</option>
            </select>
            <select value={item.language} onChange={e=>onUpdate(index,{language:e.target.value})}
              style={{ flex:1, padding:"7px 10px", borderRadius:"9px", border:`1.5px solid ${C.hairline}`, background:C.inputBg, color:C.ink, fontSize:"11px", fontFamily:"inherit" }}>
              <option value="Hindi/English">Hinglish</option>
              <option value="Hindi">Hindi</option>
              <option value="English">English</option>
              <option value="Tamil">Tamil</option>
              <option value="Marathi">Marathi</option>
            </select>
          </div>

          <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
            {[["now","🔴 Now"],["best",`⭐ Best${bestTime?" ("+bestTime.ist_label.split(" ").slice(0,2).join(" ")+")":`"`}`],["custom","📅 Custom"]].map(([v,l]) => (
              <button key={v} onClick={()=>onUpdate(index,{scheduleType:v})}
                style={{ padding:"5px 10px", borderRadius:"8px", border:`1.5px solid ${item.scheduleType===v?C.purple:C.hairline}`, background:item.scheduleType===v?`${C.purple}15`:C.glass, color:item.scheduleType===v?C.purple:C.muted, fontWeight:"700", fontSize:"10.5px", cursor:"pointer", fontFamily:"inherit" }}>
                {l}
              </button>
            ))}
          </div>
          {item.scheduleType==="custom" && (
            <input type="datetime-local" value={item.customTime||""} onChange={e=>onUpdate(index,{customTime:e.target.value})}
              style={{ marginTop:"8px", width:"100%", padding:"8px 12px", borderRadius:"9px", border:`1.5px solid ${C.purple}44`, background:C.inputBg, color:C.ink, fontSize:"12px", fontFamily:"inherit" }} />
          )}
        </>
      )}

      {item.jobStatus==="done" && item.jobResult?.seo && (
        <FullSEOPanel seo={item.jobResult.seo} prediction={item.jobResult.prediction} videoUrl={item.jobResult.video_url} compact={false} />
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
  const maxVideos = quota?.remaining||0;

  const addFiles = (files) => {
    const valid = Array.from(files).filter(f=>f.type.startsWith("video/")&&f.size<=256*1024*1024);
    if (!valid.length) { setError("Select valid video files (max 256MB each)"); return; }
    const canAdd = Math.min(valid.length, maxVideos-videos.length);
    if (canAdd<=0) { setError(`Quota full. ${maxVideos} uploads remaining.`); return; }
    setError("");
    setVideos(prev=>[...prev,...valid.slice(0,canAdd).map(file=>({
      file, preview:URL.createObjectURL(file), keyword:"", videoType:"video", language:"Hindi/English",
      scheduleType:"best", customTime:"", privacy:"public", seo:null, seoGenerated:false,
      jobId:null, jobStatus:null, jobProgress:0, jobMessage:"", jobResult:null, jobError:null, userId,
    }))]);
  };

  const updateVideo = (i,u) => setVideos(prev=>prev.map((v,idx)=>idx===i?{...v,...u}:v));
  const removeVideo = (i) => setVideos(prev=>prev.filter((_,idx)=>idx!==i));

  const generateAllSEO = async () => {
    const pending = videos.filter(v=>v.keyword.trim()&&!v.seoGenerated&&!v.jobId);
    if (!pending.length) { setError("Add keywords first"); return; }
    setGlobalGenLoading(true);
    await Promise.all(pending.map(async item => {
      const idx = videos.indexOf(item);
      try {
        const fd=new FormData();
        fd.append("user_id",userId);fd.append("keyword",item.keyword);
        fd.append("video_type",item.videoType);fd.append("language",item.language);
        const res=await fetch(`${BASE}/youtube/upload/seo`,{method:"POST",body:fd});
        const data=await res.json();
        if (res.ok&&data.seo) updateVideo(idx,{seo:data.seo,seoGenerated:true});
      } catch(e){}
    }));
    setGlobalGenLoading(false);
  };

  const pollJob = (jobId, idx) => {
    if (pollRefs.current[jobId]) clearInterval(pollRefs.current[jobId]);
    pollRefs.current[jobId] = setInterval(async()=>{
      try {
        const res=await fetch(`${BASE}/youtube/upload/job/${jobId}`);
        const data=await res.json();
        updateVideo(idx,{jobStatus:data.status,jobProgress:data.progress,jobMessage:data.message,jobResult:data.result||null,jobError:data.error||null});
        if (data.status==="done"||data.status==="error") {
          clearInterval(pollRefs.current[jobId]);
          if (data.status==="done"&&data.result?.quota) setQuota(data.result.quota);
        }
      } catch{}
    },3000);
  };

  const uploadAll = async () => {
    const ready = videos.filter(v=>v.file&&v.keyword.trim()&&!v.jobId);
    if (!ready.length) { setError("Add videos with keywords first"); return; }
    setUploading(true); setError("");
    for (let i=0;i<videos.length;i++) {
      const item=videos[i];
      if (!item.file||!item.keyword.trim()||item.jobId) continue;
      try {
        const fd=new FormData();
        fd.append("user_id",userId);fd.append("keyword",item.keyword);
        fd.append("video_type",item.videoType);fd.append("schedule_type",item.scheduleType);
        fd.append("custom_time",item.customTime||"");fd.append("privacy",item.privacy||"public");
        fd.append("language",item.language);fd.append("video",item.file);
        const res=await fetch(`${BASE}/youtube/upload/auto`,{method:"POST",body:fd});
        const data=await res.json();
        if (!res.ok) throw new Error(data.detail?.message||data.detail||"Upload failed");
        updateVideo(i,{jobId:data.job_id,jobStatus:"queued",jobProgress:0,jobMessage:"Starting…"});
        pollJob(data.job_id,i);
        await new Promise(r=>setTimeout(r,500));
      } catch(e) { updateVideo(i,{jobStatus:"error",jobError:e.message}); }
    }
    setUploading(false);
  };

  const reset = () => { Object.values(pollRefs.current).forEach(clearInterval); setVideos([]); setError(""); };
  useEffect(()=>()=>Object.values(pollRefs.current).forEach(clearInterval),[]);

  const pendingCount = videos.filter(v=>!v.jobId).length;
  const doneCount    = videos.filter(v=>v.jobStatus==="done").length;
  const hasKeywords  = videos.some(v=>v.keyword.trim()&&!v.seoGenerated&&!v.jobId);

  return (
    <div>
      <QuotaBar quota={quota} plan={plan} />
      {videos.length<maxVideos && (
        <div onDrop={e=>{e.preventDefault();setDragOver(false);addFiles(e.dataTransfer.files);}}
          onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
          onClick={()=>fileRef.current?.click()}
          style={{ border:`2px dashed ${dragOver?C.yt:C.purple}55`, borderRadius:"16px", padding:"24px", textAlign:"center", cursor:"pointer", background:dragOver?`${C.yt}08`:`${C.purple}04`, transition:"all 0.2s", marginBottom:"14px" }}>
          <input ref={fileRef} type="file" accept="video/*" multiple style={{ display:"none" }} onChange={e=>addFiles(e.target.files)} />
          <div style={{ fontSize:"28px", marginBottom:"6px" }}>📹</div>
          <div style={{ fontSize:"14px", fontWeight:"800", color:C.ink }}>Drop videos here or click to select</div>
          <div style={{ fontSize:"11px", color:C.muted, marginTop:"4px" }}>Up to {maxVideos-videos.length} video{maxVideos-videos.length!==1?"s":""} · MP4, MOV, AVI · Max 256 MB each</div>
        </div>
      )}
      {error && <div style={{ background:`${C.danger}12`, border:`1px solid ${C.danger}44`, borderRadius:"10px", padding:"10px 14px", marginBottom:"12px", fontSize:"12px", color:C.danger, fontWeight:"600" }}>⚠ {error}</div>}
      {videos.length>0 && (
        <div style={{ display:"flex", gap:"8px", marginBottom:"14px", flexWrap:"wrap" }}>
          {hasKeywords && (
            <button onClick={generateAllSEO} disabled={globalGenLoading}
              style={{ flex:1, padding:"10px", borderRadius:"11px", border:`1.5px solid ${C.purple}44`, background:`${C.purple}12`, color:C.purple, fontWeight:"800", fontSize:"12px", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", minWidth:"120px" }}>
              {globalGenLoading?<><Spinner size={14} color={C.purple}/> Generating…</>:"✨ Generate All SEO"}
            </button>
          )}
          {pendingCount>0 && (
            <button onClick={uploadAll} disabled={uploading}
              style={{ flex:2, padding:"10px", borderRadius:"11px", border:"none", background:uploading?C.hairline:`linear-gradient(135deg,#ff0000,#cc0000)`, color:uploading?C.muted:"white", fontWeight:"900", fontSize:"13px", cursor:uploading?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
              {uploading?<><Spinner size={14} color="white"/> Uploading…</>:`▶ Upload All (${pendingCount} video${pendingCount!==1?"s":""})`}
            </button>
          )}
          {doneCount>0&&doneCount===videos.length && (
            <button onClick={reset} style={{ padding:"10px 16px", borderRadius:"11px", border:`1.5px solid ${C.purple}44`, background:"transparent", color:C.purple, fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>+ New Batch</button>
          )}
        </div>
      )}
      {videos.map((item,index) => <VideoCard key={index} item={item} index={index} onUpdate={updateVideo} onRemove={removeVideo} bestTime={bestTime} />)}
      {videos.length===0&&maxVideos===0 && (
        <div style={{ textAlign:"center", padding:"24px", color:C.muted, fontSize:"13px" }}>
          All uploads used this month. Resets {quota?.reset_date?new Date(quota.reset_date).toLocaleDateString("en-IN",{day:"numeric",month:"short"}):"next month"}.
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// UPLOAD HISTORY TAB
// ══════════════════════════════════════════════════════════════════════
function UploadHistory({ userId }) {
  const C = getC();
  const [history,  setHistory ] = useState([]);
  const [loading,  setLoading ] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!userId) return;
    fetch(`${BASE}/youtube/upload/history?user_id=${userId}`)
      .then(r=>r.json()).then(d=>{ setHistory(d.history||[]); setLoading(false); }).catch(()=>setLoading(false));
  }, [userId]);

  const toggle = (id) => setExpanded(prev=>({...prev,[id]:!prev[id]}));

  if (loading) return <div style={{ display:"flex", justifyContent:"center", padding:"40px" }}><Spinner size={32} color={getC().purple} /></div>;

  if (!history.length) return (
    <div style={{ textAlign:"center", padding:"40px", color:C.muted }}>
      <div style={{ fontSize:"36px", marginBottom:"12px" }}>📭</div>
      <div style={{ fontSize:"14px", fontWeight:"700", color:C.ink, marginBottom:"6px" }}>No uploads yet</div>
      <div style={{ fontSize:"12px" }}>Upload your first video from Bulk Upload tab!</div>
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
        <div style={{ fontSize:"13px", fontWeight:"800", color:C.ink }}>📜 Upload History</div>
        <span style={{ fontSize:"11px", color:C.muted }}>{history.length} video{history.length!==1?"s":""} uploaded</span>
      </div>

      {history.map((job) => {
        const r = job.result||{};
        const isOpen = expanded[job.job_id];
        return (
          <div key={job.job_id} style={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:"14px", marginBottom:"10px", overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"14px 16px", cursor:"pointer" }} onClick={()=>toggle(job.job_id)}>
              <div style={{ width:"40px", height:"40px", borderRadius:"8px", background:"#ff000018", border:"1px solid #ff000044", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>▶</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:"13px", fontWeight:"800", color:C.ink, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.title||"Untitled"}</div>
                <div style={{ fontSize:"10px", color:C.muted, marginTop:"2px", display:"flex", gap:"8px", alignItems:"center" }}>
                  {r.scheduled?<span style={{color:C.warn}}>⏰ Scheduled</span>:<span style={{color:C.success}}>🔴 Live</span>}
                  {r.seo?.seo_score && <SEOScore score={r.seo.seo_score} />}
                </div>
              </div>
              <div style={{ display:"flex", gap:"8px", alignItems:"center", flexShrink:0 }}>
                {r.video_url && (
                  <a href={r.video_url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                    style={{ padding:"5px 12px", borderRadius:"8px", background:"#ff0000", color:"white", fontWeight:"800", fontSize:"10px", textDecoration:"none" }}>
                    ▶ YT
                  </a>
                )}
                {r.seo && (
                  <button onClick={e=>{e.stopPropagation();downloadSEOPdf({...r.seo,prediction:r.prediction},r.video_url);}}
                    style={{ padding:"5px 12px", borderRadius:"8px", border:"none", background:`linear-gradient(135deg,${C.purple},${C.rose})`, color:"white", fontWeight:"800", fontSize:"10px", cursor:"pointer", fontFamily:"inherit" }}>
                    ⬇ PDF
                  </button>
                )}
                <span style={{ fontSize:"14px", color:C.muted }}>{isOpen?"▲":"▼"}</span>
              </div>
            </div>
            {isOpen && r.seo && (
              <div style={{ padding:"0 16px 16px" }}>
                <FullSEOPanel seo={r.seo} prediction={r.prediction} videoUrl={r.video_url} compact={false} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SEO GENERATOR TAB
// ══════════════════════════════════════════════════════════════════════
function SEOGenerator({ userId }) {
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
      const fd=new FormData();
      fd.append("user_id",userId);fd.append("keyword",keyword);
      fd.append("video_type",videoType);fd.append("language",language);
      const res=await fetch(`${BASE}/youtube/upload/seo`,{method:"POST",body:fd});
      const data=await res.json();
      if (!res.ok) throw new Error(data.detail||"Failed");
      setSeo(data.seo);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ fontSize:"13px", fontWeight:"700", color:C.ink, marginBottom:"4px" }}>🤖 AI Viral SEO Generator</div>
      <div style={{ fontSize:"11.5px", color:C.muted, marginBottom:"14px" }}>Viral title · Hook · Thumbnail idea · Full description · 20 tags · Queries</div>
      <input value={keyword} onChange={e=>setKeyword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&generate()} placeholder="e.g. AI tools for students, cricket tips…"
        style={{ width:"100%", padding:"12px 14px", borderRadius:"12px", border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:"13px", fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:"10px" }} />
      <div style={{ display:"flex", gap:"8px", marginBottom:"12px" }}>
        {[["video","🎬 Long"],["short","⚡ Short"]].map(([v,l]) => (
          <button key={v} onClick={()=>setVideoType(v)} style={{ flex:1, padding:"8px", borderRadius:"10px", border:`1.5px solid ${videoType===v?C.yt:C.hairline}`, background:videoType===v?`${C.yt}12`:C.glass, color:videoType===v?C.yt:C.muted, fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
        ))}
        <select value={language} onChange={e=>setLanguage(e.target.value)}
          style={{ flex:2, padding:"8px 10px", borderRadius:"10px", border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:"12px", fontFamily:"inherit" }}>
          <option value="Hindi/English">Hinglish</option>
          <option value="Hindi">Hindi</option>
          <option value="English">English</option>
          <option value="Tamil">Tamil</option>
          <option value="Marathi">Marathi</option>
        </select>
      </div>
      {error && <div style={{ background:`${C.danger}12`, border:`1px solid ${C.danger}44`, borderRadius:"10px", padding:"10px 14px", marginBottom:"12px", fontSize:"12px", color:C.danger }}>⚠ {error}</div>}
      <button onClick={generate} disabled={loading||!keyword.trim()}
        style={{ width:"100%", padding:"12px", borderRadius:"12px", border:"none", background:(loading||!keyword.trim())?C.hairline:`linear-gradient(135deg,${C.purple},${C.rose})`, color:(loading||!keyword.trim())?C.muted:"white", fontWeight:"800", fontSize:"14px", cursor:(loading||!keyword.trim())?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", marginBottom:"14px" }}>
        {loading?<><Spinner size={16} color="white"/> Generating…</>:"✨ Generate Viral SEO"}
      </button>
      {seo && <FullSEOPanel seo={seo} prediction={null} videoUrl={null} compact={false} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// THUMBNAIL ANALYZER TAB
// ══════════════════════════════════════════════════════════════════════
function ThumbnailAnalyzer({ userId }) {
  const C = getC();
  const [thumb1,setThumb1]=useState(null);const [thumb2,setThumb2]=useState(null);
  const [prev1,setPrev1]=useState("");const [prev2,setPrev2]=useState("");
  const [loading,setLoading]=useState(false);const [result,setResult]=useState(null);const [error,setError]=useState("");
  const ref1=useRef();const ref2=useRef();

  const handleImg=(file,n)=>{if(!file||!file.type.startsWith("image/"))return;if(n===1){setThumb1(file);setPrev1(URL.createObjectURL(file));}else{setThumb2(file);setPrev2(URL.createObjectURL(file));}setResult(null);};
  const analyze=async()=>{if(!thumb1){setError("Upload at least 1 thumbnail");return;}setLoading(true);setError("");setResult(null);try{const fd=new FormData();fd.append("user_id",userId);fd.append("thumbnail1",thumb1);if(thumb2)fd.append("thumbnail2",thumb2);const res=await fetch(`${BASE}/youtube/upload/thumbnail`,{method:"POST",body:fd});const data=await res.json();if(!res.ok)throw new Error(data.detail||"Failed");setResult(data);}catch(e){setError(e.message);}finally{setLoading(false);}};
  const ScoreRing=({score})=>{const col=score>=80?C.success:score>=60?C.warn:C.danger;return(<div style={{textAlign:"center"}}><div style={{width:"52px",height:"52px",borderRadius:"50%",border:`4px solid ${col}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 4px",background:`${col}12`}}><span style={{fontSize:"15px",fontWeight:"900",color:col}}>{score}</span></div><div style={{fontSize:"9px",fontWeight:"800",color:col,textTransform:"uppercase"}}>{score>=80?"HIGH":score>=60?"MED":"LOW"} CTR</div></div>);};

  return (
    <div>
      <div style={{ fontSize:"13px", fontWeight:"700", color:C.ink, marginBottom:"4px" }}>🖼️ Thumbnail CTR Analyzer</div>
      <div style={{ fontSize:"11.5px", color:C.muted, marginBottom:"16px" }}>Upload 1 to analyze, or 2 to A/B compare</div>
      <div style={{ display:"flex", gap:"10px", marginBottom:"14px" }}>
        {[{label:"Thumbnail A *",prev:prev1,ref:ref1,n:1},{label:"Thumbnail B",prev:prev2,ref:ref2,n:2}].map(({label,prev,ref,n})=>(
          <div key={n} onClick={()=>ref.current?.click()} style={{ flex:1, border:`2px dashed ${prev?C.success:C.purple}55`, borderRadius:"12px", padding:"10px", textAlign:"center", cursor:"pointer", background:prev?`${C.success}06`:`${C.purple}04`, minHeight:"80px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <input ref={ref} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>handleImg(e.target.files[0],n)} />
            {prev?<img src={prev} alt={label} style={{ width:"100%", maxHeight:"60px", objectFit:"cover", borderRadius:"6px" }} />:<><div style={{ fontSize:"20px" }}>🖼️</div><div style={{ fontSize:"10px", fontWeight:"700", color:C.purple, marginTop:"3px" }}>{label}</div></>}
          </div>
        ))}
      </div>
      {error&&<div style={{ background:`${C.danger}12`, border:`1px solid ${C.danger}44`, borderRadius:"10px", padding:"10px 14px", marginBottom:"12px", fontSize:"12px", color:C.danger }}>⚠ {error}</div>}
      <button onClick={analyze} disabled={loading||!thumb1}
        style={{ width:"100%", padding:"12px", borderRadius:"12px", border:"none", background:(loading||!thumb1)?C.hairline:`linear-gradient(135deg,${C.purple},${C.rose})`, color:(loading||!thumb1)?C.muted:"white", fontWeight:"800", fontSize:"14px", cursor:(loading||!thumb1)?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", marginBottom:"16px" }}>
        {loading?<><Spinner size={16} color="white"/> Analyzing…</>:"🔍 Analyze Thumbnail"}
      </button>
      {result?.analysis&&(
        <div style={{ background:C.glass, border:`1.5px solid ${C.purple}22`, borderRadius:"14px", padding:"16px" }}>
          {result.mode==="compare"&&result.analysis.winner&&<div style={{ background:`${C.success}12`, border:`1px solid ${C.success}44`, borderRadius:"10px", padding:"10px 12px", marginBottom:"12px" }}><div style={{ fontSize:"13px", fontWeight:"900", color:C.success }}>🏆 Thumbnail {result.analysis.winner} wins!</div><div style={{ fontSize:"11px", color:C.ink, marginTop:"3px" }}>{result.analysis.winner_reason}</div></div>}
          {result.mode==="single"&&<><div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}><span style={{ fontSize:"13px", fontWeight:"900", color:C.ink }}>Analysis Result</span><ScoreRing score={result.analysis.ctr_score}/></div>{prev1&&<img src={prev1} style={{ width:"100%", maxHeight:"100px", objectFit:"cover", borderRadius:"8px", marginBottom:"10px" }} alt="thumbnail"/>}</>}
          {[{label:"✅ Strengths",items:result.analysis.strengths,col:C.success},{label:"❌ Weaknesses",items:result.analysis.weaknesses,col:C.danger},{label:"🚀 Improvements",items:result.analysis.improvements,col:C.purple}].map(({label,items,col})=>items?.filter(Boolean).length>0&&<div key={label} style={{ marginBottom:"10px" }}><div style={{ fontSize:"10px", fontWeight:"700", color:col, marginBottom:"4px", textTransform:"uppercase" }}>{label}</div>{items.filter(Boolean).map((item,i)=><div key={i} style={{ fontSize:"11.5px", color:C.ink, padding:"2px 0" }}>• {item}</div>)}</div>)}
          {result.analysis.overall&&<div style={{ background:`${C.purple}08`, borderRadius:"10px", padding:"10px", marginTop:"8px", fontSize:"12px", color:C.ink, fontStyle:"italic" }}>{result.analysis.overall}</div>}
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
    fetch(`${BASE}/youtube/upload/quota?user_id=${userId}`).then(r=>r.json()).then(d=>{setQuota(d);setPlan(d.plan||"free");}).catch(()=>{});
    fetch(`${BASE}/youtube/upload/best-time`).then(r=>r.json()).then(d=>setBestTime(d)).catch(()=>{});
  }, [userId]);

  const isPro = plan?.includes("pro") || plan?.includes("premium");
  if (!isPro) return <UpgradeWall />;

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", paddingBottom:"20px" }}>
      <div style={{ display:"flex", gap:"4px", marginBottom:"16px", background:`${C.purple}08`, borderRadius:"12px", padding:"4px" }}>
        {[["upload","📤 Bulk Upload"],["history","📜 History"],["seo","🤖 SEO AI"],["thumb","🖼️ Thumbnail"]].map(([id,label]) => (
          <button key={id} onClick={()=>setActiveTab(id)}
            style={{ flex:1, padding:"8px 4px", borderRadius:"9px", border:"none", background:activeTab===id?C.glass:"transparent", color:activeTab===id?C.purple:C.muted, fontWeight:activeTab===id?"800":"600", fontSize:"11px", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", boxShadow:activeTab===id?"0 1px 4px rgba(0,0,0,0.08)":"none" }}>
            {label}
          </button>
        ))}
      </div>
      {activeTab==="upload"  && <BulkUpload userId={userId} plan={plan} quota={quota} setQuota={setQuota} bestTime={bestTime} />}
      {activeTab==="history" && <UploadHistory userId={userId} />}
      {activeTab==="seo"     && <SEOGenerator userId={userId} />}
      {activeTab==="thumb"   && <ThumbnailAnalyzer userId={userId} />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, select:focus { outline: none; border-color: #7c3aed !important; }
      `}</style>
    </div>
  );
}