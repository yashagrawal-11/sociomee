import { useState, useRef } from "react";

const FONT = "'Poppins','DM Sans',sans-serif";
const C = { bg:"#0a0a0a", border:"rgba(255,255,255,0.08)", card:"rgba(255,255,255,0.03)", muted:"rgba(255,255,255,0.35)", white:"#fff" };
const token = () => localStorage.getItem("sociomee_token");
const API = "https://sociomeeai.com/api";

const CONVERSIONS = [
  { id:"img-svg",  label:"Image \u2192 SVG",    accept:"image/*",         multi:false, group:"Image" },
  { id:"img-pdf",  label:"Image \u2192 PDF",    accept:"image/*",         multi:false, group:"Image" },
  { id:"img-jpg",  label:"Image \u2192 JPG",    accept:"image/*",         multi:false, group:"Image" },
  { id:"img-png",  label:"Image \u2192 PNG",    accept:"image/*",         multi:false, group:"Image" },
  { id:"img-webp", label:"Image \u2192 WebP",   accept:"image/*",         multi:false, group:"Image" },
  { id:"img-gif",  label:"Images \u2192 GIF",   accept:"image/*",         multi:true,  group:"Image" },
  { id:"png-jpg",  label:"PNG \u2192 JPG",      accept:"image/png",       multi:false, group:"Image" },
  { id:"jpg-png",  label:"JPG \u2192 PNG",      accept:"image/jpeg",      multi:false, group:"Image" },
  { id:"webp-png", label:"WebP \u2192 PNG",     accept:"image/webp",      multi:false, group:"Image" },
  { id:"webp-jpg", label:"WebP \u2192 JPG",     accept:"image/webp",      multi:false, group:"Image" },
  { id:"png-webp", label:"PNG \u2192 WebP",     accept:"image/png",       multi:false, group:"Image" },
  { id:"jpg-webp", label:"JPG \u2192 WebP",     accept:"image/jpeg",      multi:false, group:"Image" },
  { id:"pdf-img",  label:"PDF \u2192 Images",   accept:"application/pdf", multi:false, group:"PDF"   },
  { id:"imgs-pdf", label:"Images \u2192 PDF",   accept:"image/*",         multi:true,  group:"PDF"   },
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
  const [imgW, setImgW] = useState(0);
  const [imgH, setImgH] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [threshold, setThreshold] = useState(128);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const activeConv = CONVERSIONS.find(c => c.id === active);
  const isMulti = activeConv?.multi || false;
  const isPdfInput = activeConv?.accept === "application/pdf";

  const reset = () => { setFiles([]); setPreview(null); setResult(null); setError(""); setImgW(0); setImgH(0); };
  const switchTab = (id) => { setActive(id); reset(); };

  const handleFiles = (fList) => {
    const arr = Array.from(fList);
    if (!arr.length) return;
    setFiles(arr); setResult(null); setError("");
    if (isPdfInput) { setPreview(null); return; }
    const r = new FileReader();
    r.onload = e => {
      setPreview(e.target.result);
      const img = new Image();
      img.onload = () => { setImgW(img.naturalWidth); setImgH(img.naturalHeight); };
      img.src = e.target.result;
    };
    r.readAsDataURL(arr[0]);
  };

  const convert = async () => {
    if (!files.length) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const f = files[0];
      if (active === "img-svg") {
        const resp = await fetch(`${API}/convert/img-to-svg`, {
          method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${token()}`},
          body: JSON.stringify({ image: preview, threshold }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.detail || "Failed");
        const svgOut = data.svg
          .replace(/<svg([^>]*)width="[^"]*"/, `<svg$1width="100%"`)
          .replace(/<svg([^>]*)height="[^"]*"/, `<svg$1height="auto"`)
          .replace(/<svg /, `<svg style="display:block;width:100%;height:auto;" `);
        setResult({ type:"svg", content: svgOut });
      } else if (active === "pdf-img") {
        const fd = new FormData(); fd.append("file", f);
        const resp = await fetch(`${API}/convert/pdf-to-images`, {
          method:"POST", headers:{"Authorization":`Bearer ${token()}`}, body: fd,
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.detail || "Failed");
        setResult({ type:"pdf-pages", pages: data.images, name: f.name.replace(/\.[^.]+$/,"") });
      } else {
        const img = new Image();
        img.src = preview;
        await new Promise(res => { img.onload = res; });
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (["img-jpg","png-jpg","webp-jpg"].includes(active)) {
          ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        if (active === "img-pdf" || active === "imgs-pdf") {
          const { jsPDF } = await import("jspdf");
          const allFiles = isMulti ? files : [f];
          const first = new Image(); first.src = preview;
          await new Promise(res => { first.onload = res; });
          const pdf = new jsPDF({ orientation: first.naturalWidth > first.naturalHeight ? "landscape" : "portrait", unit:"px", format:[first.naturalWidth, first.naturalHeight] });
          for (let i = 0; i < allFiles.length; i++) {
            const src = await new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(allFiles[i]); });
            if (i > 0) { const im = new Image(); im.src = src; await new Promise(res => { im.onload = res; }); pdf.addPage([im.naturalWidth, im.naturalHeight], im.naturalWidth > im.naturalHeight ? "landscape" : "portrait"); }
            pdf.addImage(src, "JPEG", 0, 0, i === 0 ? first.naturalWidth : 0, i === 0 ? first.naturalHeight : 0);
          }
          setResult({ type:"pdf", blob: pdf.output("blob"), name:`SocioMee_${f.name.replace(/\.[^.]+$/,"")}.pdf` });
        } else if (active === "img-gif") {
          setResult({ type:"note", note:"GIF encoding coming soon." });
        } else {
          const mimeMap = { "img-jpg":"image/jpeg","img-png":"image/png","img-webp":"image/webp","png-jpg":"image/jpeg","jpg-png":"image/png","webp-png":"image/png","webp-jpg":"image/jpeg","png-webp":"image/webp","jpg-webp":"image/webp" };
          const extMap =  { "img-jpg":"jpg","img-png":"png","img-webp":"webp","png-jpg":"jpg","jpg-png":"png","webp-png":"png","webp-jpg":"jpg","png-webp":"webp","jpg-webp":"webp" };
          const mime = mimeMap[active] || "image/png";
          const ext = extMap[active] || "png";
          setResult({ type:"image", dataUrl: canvas.toDataURL(mime, 0.92), name:`SocioMee_${f.name.replace(/\.[^.]+$/,"")}.${ext}`, ext });
        }
      }
    } catch(e) { setError(e.message || "Conversion failed."); }
    finally { setLoading(false); }
  };

  const dlFile = (url, name) => { const a = document.createElement("a"); a.href = url; a.download = name; a.click(); };
  const downloadResult = () => {
    if (!result) return;
    if (result.type === "svg") dlFile(URL.createObjectURL(new Blob([result.content],{type:"image/svg+xml"})), `SocioMee_${files[0]?.name?.replace(/\.[^.]+$/,"")||"vector"}.svg`);
    else if (result.type === "pdf") dlFile(URL.createObjectURL(result.blob), result.name);
    else if (result.type === "image") dlFile(result.dataUrl, result.name);
  };

  if (!isPro) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"80vh", fontFamily:FONT }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"24px", textAlign:"center", background:C.card, border:`1px solid ${C.border}`, borderRadius:"24px", padding:"52px 44px", maxWidth:"420px", width:"100%" }}>
        <h3 style={{ fontSize:"22px", fontWeight:"700", color:C.white, margin:"0 0 10px", fontFamily:FONT }}>SocioMee Convert</h3>
        <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.4)", lineHeight:1.8, margin:0 }}>Available on Pro and Pro+ plans.</p>
        <a href="/pricing" style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"13px 0", borderRadius:"12px", background:C.white, color:C.bg, fontWeight:"700", fontSize:"14px", textDecoration:"none", width:"100%" }}>Upgrade to Pro</a>
      </div>
    </div>
  );

  const btnLabel = loading ? null : !files.length ? (isPdfInput ? "Choose PDF" : isMulti ? "Choose Images" : "Choose Image") : `Convert to ${activeConv?.label?.split("\u2192")[1]?.trim()||""}`;

  return (
    <div style={{ display:"flex", height:"calc(100vh - 60px)", fontFamily:FONT, overflow:"hidden" }}>

      {/* MAIN CONTENT */}
      <div style={{ flex:1, display:"flex", gap:"16px", padding:"20px", overflow:"hidden", minWidth:0 }}>

        {/* SOURCE PANEL */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"12px", minWidth:0, overflow:"hidden" }}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"20px", overflow:"hidden", flex:1, display:"flex", flexDirection:"column" }}>
            <div style={{ padding:"12px 14px 0", flexShrink:0 }}>
              <p style={{ fontSize:"9px", fontWeight:"700", color:C.muted, letterSpacing:"1.5px", textTransform:"uppercase", margin:0 }}>Source</p>
            </div>
            {!files.length ? (
              <div
                onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={e=>{e.preventDefault();setDragOver(false);handleFiles(e.dataTransfer.files);}}
                onClick={()=>fileRef.current?.click()}
                style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", background:dragOver?"rgba(255,255,255,0.04)":"transparent", transition:"all 0.2s", padding:"24px", textAlign:"center" }}>
                <div style={{ width:"52px", height:"52px", borderRadius:"14px", background:"rgba(255,255,255,0.06)", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.7"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <p style={{ fontSize:"13px", fontWeight:"600", color:C.white, margin:"0 0 4px" }}>{isPdfInput?"Drop PDF here":isMulti?"Drop images here":"Drop image here"}</p>
                <p style={{ fontSize:"11px", color:C.muted, margin:"0 0 18px" }}>{isPdfInput?"PDF files only":isMulti?"PNG, JPG, WEBP":"PNG, JPG, WEBP, SVG"}</p>
                <button style={{ padding:"9px 24px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.9)", fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:FONT }}>
                  {isPdfInput?"Choose PDF":isMulti?"Choose Images":"Choose Image"}
                </button>
                <input ref={fileRef} type="file" accept={activeConv?.accept||"image/*"} multiple={isMulti} style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/>
              </div>
            ) : (
              <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"10px 14px 14px", minHeight:0 }}>
                <div style={{ flex:1, minHeight:0, borderRadius:"12px", overflow:"hidden", background:"rgba(255,255,255,0.02)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {preview
                    ? <img src={preview} alt="" style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain", display:"block" }}/>
                    : <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"8px" }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <span style={{ fontSize:"12px", color:C.muted }}>{files[0]?.name}</span>
                      </div>
                  }
                </div>
                <p style={{ fontSize:"11px", color:C.muted, margin:"8px 0 0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flexShrink:0 }}>
                  {files[0]?.name} \u00b7 {formatBytes(files[0]?.size)}{isMulti&&files.length>1?` \u00b7 +${files.length-1} more`:""}
                </p>
              </div>
            )}
          </div>

          {active==="img-svg" && files.length>0 && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"16px", padding:"14px 16px", flexShrink:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
                <span style={{ fontSize:"12px", fontWeight:"600", color:C.white }}>Threshold</span>
                <span style={{ fontSize:"12px", color:C.muted }}>{threshold}</span>
              </div>
              <input type="range" min="50" max="220" value={threshold} onChange={e=>setThreshold(Number(e.target.value))} style={{ width:"100%", accentColor:"rgba(255,255,255,0.6)" }}/>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:"4px" }}>
                <span style={{ fontSize:"10px", color:C.muted }}>More detail</span>
                <span style={{ fontSize:"10px", color:C.muted }}>Less detail</span>
              </div>
            </div>
          )}

          {error && <div style={{ padding:"10px 14px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"10px", color:"rgba(239,68,68,0.8)", fontSize:"12px", flexShrink:0 }}>{error}</div>}

          <div style={{ display:"flex", gap:"8px", flexShrink:0 }}>
            {files.length>0 && <button onClick={reset} style={{ padding:"12px 18px", borderRadius:"99px", border:`1px solid ${C.border}`, background:C.card, color:C.muted, fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:FONT }}>Clear</button>}
            <button onClick={files.length?convert:()=>fileRef.current?.click()} disabled={loading}
              style={{ flex:1, padding:"12px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.22)", background:"rgba(255,255,255,0.12)", color:C.white, fontSize:"13px", fontWeight:"700", cursor:loading?"not-allowed":"pointer", fontFamily:FONT, display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
              {loading?<><div style={{ width:"14px",height:"14px",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.8s linear infinite" }}/> Converting...</>:btnLabel}
            </button>
          </div>
        </div>

        {/* RESULT PANEL */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"12px", minWidth:0, overflow:"hidden" }}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"20px", overflow:"hidden", flex:1, display:"flex", flexDirection:"column", minHeight:0 }}>
            <div style={{ padding:"12px 14px 0", flexShrink:0 }}>
              <p style={{ fontSize:"9px", fontWeight:"700", color:C.muted, letterSpacing:"1.5px", textTransform:"uppercase", margin:0 }}>Result</p>
            </div>
            <div style={{ flex:1, minHeight:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent: result&&result.type==="pdf-pages"?"flex-start":"center", overflow: result&&result.type==="pdf-pages"?"auto":"hidden", padding:"10px 14px 14px" }}>
              {!result && !loading && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"10px" }}>
                  <div style={{ width:"48px", height:"48px", borderRadius:"14px", background:"rgba(255,255,255,0.04)", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"><polyline points="23 7 13.5 16.5 8.5 11.5 1 19"/><polyline points="17 7 23 7 23 13"/></svg>
                  </div>
                  <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.15)", margin:0, textAlign:"center", lineHeight:1.6 }}>Converted file<br/>will appear here</p>
                </div>
              )}
              {loading && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"12px" }}>
                  <div style={{ width:"32px",height:"32px",borderRadius:"50%",border:"3px solid rgba(255,255,255,0.08)",borderTopColor:"rgba(255,255,255,0.5)",animation:"spin 0.8s linear infinite" }}/>
                  <p style={{ fontSize:"12px", color:C.muted, margin:0 }}>Converting...</p>
                </div>
              )}
              {result && result.type==="svg" && (
                <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.97)", borderRadius:"10px", overflow:"hidden", padding:"8px", boxSizing:"border-box" }}>
                  <div style={{ width:"100%" }} dangerouslySetInnerHTML={{ __html: result.content }}/>
                </div>
              )}
              {result && result.type==="image" && (
                <img src={result.dataUrl} alt="result" style={{ maxWidth:"100%", maxHeight:"100%", objectFit:"contain", display:"block", borderRadius:"10px" }}/>
              )}
              {result && result.type==="pdf" && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"12px" }}>
                  <div style={{ width:"60px", height:"76px", borderRadius:"10px", background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <p style={{ fontSize:"13px", color:C.white, margin:0, fontWeight:"600" }}>PDF ready</p>
                </div>
              )}
              {result && result.type==="pdf-pages" && (
                <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:"10px" }}>
                  {result.pages.map((pg, i) => (
                    <div key={i} style={{ position:"relative", borderRadius:"10px", overflow:"hidden" }}>
                      <img src={`data:image/png;base64,${pg}`} alt={`Page ${i+1}`} style={{ width:"100%", display:"block" }}/>
                      <button onClick={()=>dlFile(`data:image/png;base64,${pg}`, `${result.name}_page${i+1}.png`)}
                        style={{ position:"absolute", bottom:"10px", right:"10px", padding:"6px 14px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.25)", background:"rgba(10,10,10,0.75)", backdropFilter:"blur(8px)", color:C.white, fontSize:"11px", fontWeight:"600", cursor:"pointer", fontFamily:FONT }}>
                        \u2913 Page {i+1}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {result && result.type==="note" && (
                <p style={{ fontSize:"13px", color:C.muted, textAlign:"center", lineHeight:1.7 }}>{result.note}</p>
              )}
            </div>
          </div>
          {result && (result.type==="svg"||result.type==="image"||result.type==="pdf") && (
            <button onClick={downloadResult} style={{ flexShrink:0, padding:"12px", borderRadius:"99px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.08)", color:C.white, fontSize:"13px", fontWeight:"700", cursor:"pointer", fontFamily:FONT }}>
              {result.type==="svg"?"Download SVG":result.type==="pdf"?"Download PDF":`Download ${result.ext?.toUpperCase()}`}
            </button>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR — full height, stuck to right edge */}
      <div style={{ width:"220px", height:"100%", background:"rgba(255,255,255,0.02)", borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", flexShrink:0, overflow:"hidden" }}>
        <div style={{ padding:"20px 16px 10px", flexShrink:0 }}>
          <p style={{ fontSize:"10px", fontWeight:"700", color:"rgba(255,255,255,0.3)", letterSpacing:"1.4px", textTransform:"uppercase", margin:0 }}>Convert</p>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"0 8px 20px", scrollbarWidth:"thin", scrollbarColor:"rgba(255,255,255,0.06) transparent" }}>
          {["Image","PDF"].map(grp => (
            <div key={grp}>
              <p style={{ fontSize:"9px", fontWeight:"700", color:"rgba(255,255,255,0.2)", letterSpacing:"1.2px", textTransform:"uppercase", margin:"16px 8px 6px" }}>{grp}</p>
              {CONVERSIONS.filter(c=>c.group===grp).map(c=>(
                <button key={c.id} onClick={()=>switchTab(c.id)} style={{
                  display:"flex", alignItems:"center", width:"100%", padding:"10px 12px",
                  borderRadius:"10px", border:"none",
                  background: active===c.id?"rgba(255,255,255,0.09)":"transparent",
                  color: active===c.id?C.white:"rgba(255,255,255,0.45)",
                  fontSize:"13px", fontWeight: active===c.id?"600":"400",
                  cursor:"pointer", fontFamily:FONT, textAlign:"left",
                  transition:"all 0.15s", marginBottom:"2px",
                  outline: active===c.id?"1px solid rgba(255,255,255,0.1)":"none"
                }}>
                  {c.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
