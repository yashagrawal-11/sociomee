import { useState, useRef } from "react";

const FONT = "'Poppins','DM Sans',sans-serif";
const C = { bg:"#0a0a0a", border:"rgba(255,255,255,0.08)", card:"rgba(255,255,255,0.03)", muted:"rgba(255,255,255,0.35)", white:"#fff" };
const token = () => localStorage.getItem("sociomee_token");
const API = "https://sociomeeai.com/api";

const CONVERSIONS = [
  { id:"img-svg",  label:"Image \u2192 SVG",   desc:"Vectorize any image" },
  { id:"img-pdf",  label:"Image \u2192 PDF",   desc:"Wrap image in a PDF" },
  { id:"img-webp", label:"Image \u2192 WebP",  desc:"Modern format" },
  { id:"img-jpg",  label:"Image \u2192 JPG",   desc:"Convert to JPEG" },
  { id:"img-png",  label:"Image \u2192 PNG",   desc:"Convert to PNG" },
  { id:"img-gif",  label:"Images \u2192 GIF",  desc:"Animate multiple images" },
  { id:"pdf-img",  label:"PDF \u2192 Images",  desc:"Export pages as PNGs" },
];

function formatBytes(b) {
  if (!b) return "";
  const u = ["B","KB","MB"]; let i = 0, n = b;
  while (n >= 1024 && i < 2) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${u[i]}`;
}

export default function SocioMeeConvert({ user, creditStatus }) {
  const rawPlan = creditStatus?.plan || user?.plan || "free";
  const isPro = rawPlan.includes("pro") || rawPlan.includes("premium");
  const [active, setActive] = useState("img-svg");
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState(null);
  const [imgNaturalW, setImgNaturalW] = useState(0);
  const [imgNaturalH, setImgNaturalH] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [threshold, setThreshold] = useState(128);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const multiRef = useRef(null);

  if (!isPro) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"80vh", padding:"24px", fontFamily:FONT }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"24px", textAlign:"center", background:C.card, border:`1px solid ${C.border}`, borderRadius:"24px", padding:"52px 44px", maxWidth:"420px", width:"100%", backdropFilter:"blur(24px)" }}>
        <div style={{ width:"68px", height:"68px", borderRadius:"20px", background:"rgba(255,255,255,0.06)", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.7"><polyline points="23 7 13.5 16.5 8.5 11.5 1 19"/><polyline points="17 7 23 7 23 13"/></svg>
        </div>
        <div>
          <h3 style={{ fontSize:"22px", fontWeight:"700", color:C.white, margin:"0 0 10px", fontFamily:FONT }}>SocioMee Convert</h3>
          <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.4)", lineHeight:1.8, margin:0 }}>Convert images to SVG, PDF, WebP, GIF and more. Available on Pro and Pro+ plans.</p>
        </div>
        <a href="/pricing" style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"13px 0", borderRadius:"12px", background:C.white, color:C.bg, fontWeight:"700", fontSize:"14px", textDecoration:"none", width:"100%" }}>Upgrade to Pro</a>
      </div>
    </div>
  );

  const reset = () => { setFiles([]); setPreview(null); setResult(null); setError(""); setImgNaturalW(0); setImgNaturalH(0); };
  const switchTab = (id) => { setActive(id); reset(); };

  const handleSingleFile = (f) => {
    if (!f || !f.type.startsWith("image/")) return;
    setFiles([f]); setResult(null); setError("");
    const r = new FileReader();
    r.onload = e => {
      const src = e.target.result;
      setPreview(src);
      const img = new Image();
      img.onload = () => { setImgNaturalW(img.naturalWidth); setImgNaturalH(img.naturalHeight); };
      img.src = src;
    };
    r.readAsDataURL(f);
  };
  const handleMultiFiles = (fList) => {
    const imgs = Array.from(fList).filter(f => f.type.startsWith("image/"));
    if (!imgs.length) return;
    setFiles(imgs); setResult(null); setError("");
    const r = new FileReader();
    r.onload = e => {
      const src = e.target.result;
      setPreview(src);
      const img = new Image();
      img.onload = () => { setImgNaturalW(img.naturalWidth); setImgNaturalH(img.naturalHeight); };
      img.src = src;
    };
    r.readAsDataURL(imgs[0]);
  };

  const convert = async () => {
    if (!files.length) return;
    setLoading(true); setError(""); setResult(null);
    try {
      if (active === "img-svg") {
        const resp = await fetch(`${API}/convert/img-to-svg`, {
          method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${token()}`},
          body: JSON.stringify({ image: preview, threshold }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.detail || "Failed");
        // preserve aspect ratio: inject width/height attrs matching source
        const ratio = imgNaturalH && imgNaturalW ? imgNaturalH / imgNaturalW : 1;
        const svgFixed = data.svg
          .replace(/<svg([^>]*)width="[^"]*"/, `<svg$1width="100%"`)
          .replace(/<svg([^>]*)height="[^"]*"/, `<svg$1height="auto"`)
          .replace(/<svg /, `<svg style="display:block;width:100%;aspect-ratio:${imgNaturalW}/${imgNaturalH};" `);
        setResult({ type:"svg", content: svgFixed, w: imgNaturalW, h: imgNaturalH });
      } else {
        const img = new Image();
        img.src = preview;
        await new Promise(res => { img.onload = res; });
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        if (active === "img-pdf") {
          const { jsPDF } = await import("jspdf");
          const pdf = new jsPDF({ orientation: img.naturalWidth > img.naturalHeight ? "landscape" : "portrait", unit:"px", format:[img.naturalWidth, img.naturalHeight] });
          pdf.addImage(preview, "JPEG", 0, 0, img.naturalWidth, img.naturalHeight);
          const blob = pdf.output("blob");
          setResult({ type:"pdf", blob, name:`SocioMee_${files[0].name.replace(/\.[^.]+$/,"")}.pdf` });
        } else if (active === "img-gif" && files.length > 1) {
          setResult({ type:"multi-img", files, note:"GIF creation requires a backend encoder." });
        } else {
          const mimeMap = { "img-webp":"image/webp","img-jpg":"image/jpeg","img-png":"image/png" };
          const mime = mimeMap[active] || "image/png";
          const ext = active.split("-")[1];
          const dataUrl = canvas.toDataURL(mime, 0.92);
          setResult({ type:"image", dataUrl, name:`SocioMee_${files[0].name.replace(/\.[^.]+$/,"")}.${ext}` });
        }
      }
    } catch (e) { setError(e.message || "Conversion failed."); }
    finally { setLoading(false); }
  };

  const download = () => {
    if (!result) return;
    if (result.type === "svg") {
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([result.content],{type:"image/svg+xml"}));
      a.download = `SocioMee_${files[0]?.name?.replace(/\.[^.]+$/,"")||"vector"}.svg`; a.click();
    } else if (result.type === "pdf") {
      const a = document.createElement("a"); a.href = URL.createObjectURL(result.blob); a.download = result.name; a.click();
    } else if (result.type === "image") {
      const a = document.createElement("a"); a.href = result.dataUrl; a.download = result.name; a.click();
    }
  };

  const isMulti = active === "img-gif";
  const activeConv = CONVERSIONS.find(c => c.id === active);

  // preview box: match source aspect ratio
  const previewAspect = imgNaturalW && imgNaturalH ? `${imgNaturalW}/${imgNaturalH}` : "auto";

  return (
    <div style={{
      display:"flex", alignItems:"center", justifyContent:"center",
      minHeight:"calc(100vh - 60px)", padding:"24px 20px", fontFamily:FONT, boxSizing:"border-box"
    }}>
      <div style={{ display:"flex", gap:"16px", width:"100%", maxWidth:"1040px", alignItems:"flex-start" }}>

        {/* LEFT: upload / source panel */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"12px", minWidth:0 }}>
          <div style={{
            background:C.card, border:`1px solid ${C.border}`, borderRadius:"20px",
            overflow:"hidden", backdropFilter:"blur(24px)"
          }}>
            {!files.length ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); isMulti ? handleMultiFiles(e.dataTransfer.files) : handleSingleFile(e.dataTransfer.files[0]); }}
                onClick={() => (isMulti ? multiRef : fileRef).current?.click()}
                style={{
                  padding:"60px 24px", textAlign:"center", cursor:"pointer",
                  background: dragOver ? "rgba(255,255,255,0.04)" : "transparent",
                  transition:"all 0.2s"
                }}>
                <div style={{
                  width:"56px", height:"56px", borderRadius:"16px",
                  background:"rgba(255,255,255,0.06)", border:`1px solid ${C.border}`,
                  display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px"
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.7">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <p style={{ fontSize:"14px", fontWeight:"600", color:C.white, margin:"0 0 6px" }}>
                  {isMulti ? "Drop multiple images" : "Drop your image here"}
                </p>
                <p style={{ fontSize:"12px", color:C.muted, margin:"0 0 22px" }}>
                  PNG, JPG, WEBP{isMulti ? " \u00b7 Select multiple" : ""}
                </p>
                <button style={{
                  padding:"10px 28px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.15)",
                  background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.9)",
                  fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:FONT
                }}>
                  Choose {isMulti ? "Images" : "Image"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e => handleSingleFile(e.target.files[0])}/>
                <input ref={multiRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={e => handleMultiFiles(e.target.files)}/>
              </div>
            ) : (
              <div style={{ padding:"16px" }}>
                <p style={{ fontSize:"9px", fontWeight:"700", color:C.muted, letterSpacing:"1.5px", textTransform:"uppercase", margin:"0 0 10px" }}>
                  {isMulti ? `${files.length} images selected` : "Source"}
                </p>
                {preview && (
                  <div style={{ width:"100%", aspectRatio: previewAspect, overflow:"hidden", borderRadius:"12px", background:"rgba(255,255,255,0.02)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <img src={preview} alt="" style={{ width:"100%", height:"100%", objectFit:"contain", display:"block" }}/>
                  </div>
                )}
                {isMulti && files.length > 1 && <p style={{ fontSize:"11px", color:C.muted, margin:"8px 0 0" }}>+ {files.length - 1} more</p>}
                <p style={{ fontSize:"11px", color:C.muted, margin:"8px 0 0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {files[0]?.name} \u00b7 {formatBytes(files[0]?.size)}
                </p>
              </div>
            )}
          </div>

          {active === "img-svg" && files.length > 0 && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"16px", padding:"14px 16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"10px" }}>
                <span style={{ fontSize:"12px", fontWeight:"600", color:C.white }}>Threshold</span>
                <span style={{ fontSize:"12px", color:C.muted }}>{threshold}</span>
              </div>
              <input type="range" min="50" max="220" value={threshold} onChange={e => setThreshold(Number(e.target.value))}
                style={{ width:"100%", accentColor:"rgba(255,255,255,0.6)" }}/>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:"4px" }}>
                <span style={{ fontSize:"10px", color:C.muted }}>More detail</span>
                <span style={{ fontSize:"10px", color:C.muted }}>Less detail</span>
              </div>
            </div>
          )}

          {error && (
            <div style={{ padding:"10px 14px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"10px", color:"rgba(239,68,68,0.8)", fontSize:"12px" }}>
              {error}
            </div>
          )}

          <div style={{ display:"flex", gap:"8px" }}>
            {files.length > 0 && (
              <button onClick={reset} style={{
                padding:"12px 18px", borderRadius:"99px", border:`1px solid ${C.border}`,
                background:C.card, color:C.muted, fontSize:"12px", fontWeight:"600",
                cursor:"pointer", fontFamily:FONT, flexShrink:0
              }}>Clear</button>
            )}
            <button
              onClick={files.length ? convert : () => (isMulti ? multiRef : fileRef).current?.click()}
              disabled={loading}
              style={{
                flex:1, padding:"12px", borderRadius:"99px",
                border:"1px solid rgba(255,255,255,0.22)", background:"rgba(255,255,255,0.12)",
                color:C.white, fontSize:"13px", fontWeight:"700", cursor:loading ? "not-allowed" : "pointer",
                fontFamily:FONT, display:"flex", alignItems:"center", justifyContent:"center", gap:"8px"
              }}>
              {loading
                ? <><div style={{ width:"14px",height:"14px",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.8s linear infinite" }}/> Converting...</>
                : files.length ? `Convert to ${activeConv?.label?.split("\u2192")[1]?.trim() || ""}` : "Choose Image"}
            </button>
          </div>
        </div>

        {/* CENTER: result panel */}
        <div style={{
          flex:1, background:C.card, border:`1px solid ${C.border}`, borderRadius:"20px",
          padding:"16px", minHeight:"340px", display:"flex", flexDirection:"column",
          backdropFilter:"blur(24px)", minWidth:0
        }}>
          <p style={{ fontSize:"9px", fontWeight:"700", color:C.muted, letterSpacing:"1.8px", textTransform:"uppercase", margin:"0 0 14px" }}>Result</p>

          {!result && !loading && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"10px" }}>
              <div style={{ width:"52px", height:"52px", borderRadius:"14px", background:"rgba(255,255,255,0.04)", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5">
                  <polyline points="23 7 13.5 16.5 8.5 11.5 1 19"/>
                  <polyline points="17 7 23 7 23 13"/>
                </svg>
              </div>
              <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.18)", margin:0, textAlign:"center", lineHeight:1.6 }}>
                Converted file<br/>will appear here
              </p>
            </div>
          )}

          {loading && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"14px" }}>
              <div style={{ width:"36px",height:"36px",borderRadius:"50%",border:"3px solid rgba(255,255,255,0.08)",borderTopColor:"rgba(255,255,255,0.55)",animation:"spin 0.8s linear infinite" }}/>
              <p style={{ fontSize:"12px", color:C.muted, margin:0 }}>Converting...</p>
            </div>
          )}

          {result && result.type === "svg" && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"12px" }}>
              <div style={{
                borderRadius:"12px", padding:"10px", overflow:"hidden",
                display:"flex", alignItems:"center", justifyContent:"center", flex:1,
                background:"rgba(255,255,255,0.97)",
                aspectRatio: result.w && result.h ? `${result.w}/${result.h}` : "auto"
              }}
                dangerouslySetInnerHTML={{ __html: result.content }}/>
              <button onClick={download} style={{ width:"100%", padding:"12px", borderRadius:"99px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.08)", color:C.white, fontSize:"13px", fontWeight:"700", cursor:"pointer", fontFamily:FONT }}>
                Download SVG
              </button>
            </div>
          )}

          {result && result.type === "image" && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"12px" }}>
              <div style={{ width:"100%", aspectRatio: previewAspect, overflow:"hidden", borderRadius:"12px", background:"rgba(255,255,255,0.02)" }}>
                <img src={result.dataUrl} alt="result" style={{ width:"100%", height:"100%", objectFit:"contain", display:"block" }}/>
              </div>
              <button onClick={download} style={{ width:"100%", padding:"12px", borderRadius:"99px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.08)", color:C.white, fontSize:"13px", fontWeight:"700", cursor:"pointer", fontFamily:FONT }}>
                Download {active.split("-")[1].toUpperCase()}
              </button>
            </div>
          )}

          {result && result.type === "pdf" && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px" }}>
              <div style={{ width:"64px", height:"80px", borderRadius:"12px", background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <p style={{ fontSize:"13px", color:C.white, margin:0, fontWeight:"600" }}>PDF ready</p>
              <button onClick={download} style={{ width:"100%", padding:"12px", borderRadius:"99px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.08)", color:C.white, fontSize:"13px", fontWeight:"700", cursor:"pointer", fontFamily:FONT }}>
                Download PDF
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: conversion type selector */}
        <div style={{
          display:"flex", flexDirection:"column", gap:"6px",
          background:C.card, border:`1px solid ${C.border}`, borderRadius:"20px",
          padding:"16px 12px", backdropFilter:"blur(24px)", flexShrink:0, width:"176px"
        }}>
          <p style={{ fontSize:"9px", fontWeight:"700", color:"rgba(255,255,255,0.25)", letterSpacing:"1.8px", textTransform:"uppercase", margin:"0 0 8px 4px" }}>Convert</p>
          {CONVERSIONS.map(c => (
            <button key={c.id} onClick={() => switchTab(c.id)} style={{
              display:"flex", alignItems:"center", gap:"10px",
              padding:"10px 12px", borderRadius:"12px", border:"none",
              background: active === c.id ? "rgba(255,255,255,0.10)" : "transparent",
              color: active === c.id ? C.white : C.muted,
              fontSize:"12px", fontWeight: active === c.id ? "700" : "500",
              cursor:"pointer", fontFamily:FONT, textAlign:"left", width:"100%",
              transition:"all 0.18s",
              outline: active === c.id ? "1px solid rgba(255,255,255,0.12)" : "none"
            }}>
              <span style={{ lineHeight:1.3 }}>{c.label}</span>
            </button>
          ))}
        </div>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
