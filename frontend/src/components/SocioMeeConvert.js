import { useState, useRef } from "react";

const FONT = "'Poppins','DM Sans',sans-serif";
const C = { bg:"#0a0a0a", border:"rgba(255,255,255,0.08)", card:"rgba(255,255,255,0.03)", muted:"rgba(255,255,255,0.35)", white:"#fff" };
const token = () => localStorage.getItem("sociomee_token");
const API = "https://sociomeeai.com/api";

const CONVERSIONS = [
  { id:"img-svg",  label:"Image → SVG",    desc:"Vectorize any image",    pro:true,  pp:false },
  { id:"img-pdf",  label:"Image → PDF",    desc:"Wrap image in a PDF",    pro:true,  pp:false },
  { id:"img-webp", label:"Image → WebP",   desc:"Convert to modern format", pro:true, pp:false },
  { id:"img-jpg",  label:"Image → JPG",    desc:"Convert to JPEG",        pro:true,  pp:false },
  { id:"img-png",  label:"Image → PNG",    desc:"Convert to PNG",         pro:true,  pp:false },
  { id:"img-gif",  label:"Images → GIF",   desc:"Animate multiple images", pro:true, pp:false },
  { id:"pdf-img",  label:"PDF → Images",   desc:"Export pages as PNGs",   pro:true,  pp:false },
];

function formatBytes(b) {
  if (!b) return ""; const u=["B","KB","MB"]; let i=0,n=b;
  while(n>=1024&&i<2){n/=1024;i++;} return `${n.toFixed(1)} ${u[i]}`;
}

export default function SocioMeeConvert({ user, creditStatus }) {
  const rawPlan = creditStatus?.plan || user?.plan || "free";
  const isPro = rawPlan.includes("pro") || rawPlan.includes("premium");
  const [active, setActive] = useState("img-svg");
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [threshold, setThreshold] = useState(128);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const multiRef = useRef(null);

  if (!isPro) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"70vh", padding:"32px 24px", fontFamily:FONT }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"24px", textAlign:"center", background:C.card, border:`1px solid ${C.border}`, borderRadius:"24px", padding:"52px 44px", maxWidth:"420px", width:"100%", backdropFilter:"blur(24px)" }}>
        <div style={{ width:"68px", height:"68px", borderRadius:"20px", background:"rgba(255,255,255,0.06)", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.7"><polyline points="23 7 13.5 16.5 8.5 11.5 1 19"/><polyline points="17 7 23 7 23 13"/></svg>
        </div>
        <div>
          <h3 style={{ fontSize:"22px", fontWeight:"700", color:C.white, margin:"0 0 10px", fontFamily:FONT }}>SocioMee Convert</h3>
          <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.4)", lineHeight:1.8, margin:0 }}>Convert images to SVG vectors, PDFs, WebP, GIF and more. Available on Pro and Pro+ plans.</p>
        </div>
        <a href="/pricing" style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"13px 0", borderRadius:"12px", background:C.white, color:C.bg, fontWeight:"700", fontSize:"14px", textDecoration:"none", width:"100%" }}>Upgrade to Pro</a>
      </div>
    </div>
  );

  const reset = () => { setFiles([]); setPreview(null); setResult(null); setError(""); };
  const switchTab = (id) => { setActive(id); reset(); };

  const handleSingleFile = (f) => {
    if (!f || !f.type.startsWith("image/")) return;
    setFiles([f]); setResult(null); setError("");
    const r = new FileReader(); r.onload = e => setPreview(e.target.result); r.readAsDataURL(f);
  };
  const handleMultiFiles = (fList) => {
    const imgs = Array.from(fList).filter(f=>f.type.startsWith("image/"));
    if (!imgs.length) return;
    setFiles(imgs); setResult(null); setError("");
    const r = new FileReader(); r.onload = e => setPreview(e.target.result); r.readAsDataURL(imgs[0]);
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
        setResult({ type:"svg", content: data.svg });
      } else {
        // Client-side conversions via canvas
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
          setResult({ type:"multi-img", files, note:"GIF creation requires a backend encoder. Download images as PNG to use externally." });
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
  const pill = (id, label) => (
    <button key={id} onClick={()=>switchTab(id)} style={{ padding:"8px 16px", borderRadius:"99px", flexShrink:0, whiteSpace:"nowrap", border:`1px solid ${active===id?"rgba(255,255,255,0.25)":C.border}`, background:active===id?"rgba(255,255,255,0.12)":C.card, color:active===id?C.white:C.muted, fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:FONT, transition:"all 0.2s" }}>{label}</button>
  );

  return (
    <div style={{ maxWidth:"860px", margin:"0 auto", padding:"32px 24px", fontFamily:FONT }}>
      <div style={{ marginBottom:"24px" }}>
        <h1 style={{ fontSize:"22px", fontWeight:"700", color:C.white, margin:"0 0 4px" }}>Convert</h1>
        <p style={{ fontSize:"13px", color:C.muted, margin:0 }}>All conversions in one place — no extra tabs, no paywalls</p>
      </div>
      <div style={{ display:"flex", gap:"8px", overflowX:"auto", paddingBottom:"4px", marginBottom:"24px", scrollbarWidth:"none" }}>
        {CONVERSIONS.map(c => pill(c.id, c.label))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"16px", overflow:"hidden" }}>
            {!files.length ? (
              <div
                onDragOver={e=>{e.preventDefault();setDragOver(true)}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={e=>{e.preventDefault();setDragOver(false);isMulti?handleMultiFiles(e.dataTransfer.files):handleSingleFile(e.dataTransfer.files[0])}}
                onClick={()=>(isMulti?multiRef:fileRef).current?.click()}
                style={{ padding:"44px 24px", textAlign:"center", cursor:"pointer", background:dragOver?"rgba(255,255,255,0.04)":"transparent", transition:"all 0.2s" }}>
                <div style={{ width:"56px", height:"56px", borderRadius:"16px", background:"rgba(255,255,255,0.06)", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.7"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <p style={{ fontSize:"14px", fontWeight:"600", color:C.white, margin:"0 0 6px" }}>{isMulti?"Drop multiple images":"Drop your image here"}</p>
                <p style={{ fontSize:"12px", color:C.muted, margin:"0 0 18px" }}>PNG, JPG, WEBP{isMulti?" · Select multiple":""}</p>
                <button style={{ padding:"9px 22px", borderRadius:"99px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.07)", color:"rgba(255,255,255,0.85)", fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:FONT }}>
                  Choose {isMulti?"Images":"Image"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={e=>handleSingleFile(e.target.files[0])}/>
                <input ref={multiRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={e=>handleMultiFiles(e.target.files)}/>
              </div>
            ) : (
              <div style={{ padding:"16px" }}>
                <p style={{ fontSize:"10px", fontWeight:"700", color:C.muted, letterSpacing:"1.5px", textTransform:"uppercase", margin:"0 0 10px" }}>
                  {isMulti?`${files.length} images selected`:"Source image"}
                </p>
                {preview && <img src={preview} alt="" style={{ width:"100%", borderRadius:"10px", objectFit:"contain", maxHeight:"280px", background:"rgba(255,255,255,0.02)" }}/>}
                {isMulti && files.length > 1 && <p style={{ fontSize:"11px", color:C.muted, margin:"8px 0 0" }}>+ {files.length-1} more</p>}
                <p style={{ fontSize:"11px", color:C.muted, margin:"8px 0 0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{files[0]?.name} · {formatBytes(files[0]?.size)}</p>
              </div>
            )}
          </div>
          {active === "img-svg" && files.length > 0 && (
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"16px", padding:"16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"10px" }}>
                <span style={{ fontSize:"12px", fontWeight:"600", color:C.white }}>Threshold</span>
                <span style={{ fontSize:"12px", color:C.muted }}>{threshold}</span>
              </div>
              <input type="range" min="50" max="220" value={threshold} onChange={e=>setThreshold(Number(e.target.value))}
                style={{ width:"100%", accentColor:"rgba(255,255,255,0.6)" }}/>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:"4px" }}>
                <span style={{ fontSize:"10px", color:C.muted }}>More detail</span>
                <span style={{ fontSize:"10px", color:C.muted }}>Less detail</span>
              </div>
            </div>
          )}
          {error && <div style={{ padding:"10px 14px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"10px", color:"rgba(239,68,68,0.8)", fontSize:"12px" }}>{error}</div>}
          <div style={{ display:"flex", gap:"10px" }}>
            {files.length > 0 && <button onClick={reset} style={{ padding:"11px 18px", borderRadius:"99px", border:`1px solid ${C.border}`, background:C.card, color:C.muted, fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:FONT }}>Clear</button>}
            <button onClick={files.length?convert:()=>(isMulti?multiRef:fileRef).current?.click()} disabled={loading}
              style={{ flex:1, padding:"11px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.25)", background:"rgba(255,255,255,0.14)", color:C.white, fontSize:"13px", fontWeight:"700", cursor:loading?"not-allowed":"pointer", fontFamily:FONT, display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
              {loading ? <><div style={{ width:"14px",height:"14px",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",animation:"spin 0.8s linear infinite" }}/> Converting...</> : files.length ? "Convert" : "Choose Image"}
            </button>
          </div>
        </div>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:"16px", padding:"16px", minHeight:"300px", display:"flex", flexDirection:"column" }}>
          <p style={{ fontSize:"10px", fontWeight:"700", color:C.muted, letterSpacing:"1.5px", textTransform:"uppercase", margin:"0 0 12px" }}>Result</p>
          {!result && !loading && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"8px" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"><polyline points="23 7 13.5 16.5 8.5 11.5 1 19"/><polyline points="17 7 23 7 23 13"/></svg>
              <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.2)", margin:0 }}>Converted file will appear here</p>
            </div>
          )}
          {loading && (
            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ width:"32px",height:"32px",borderRadius:"50%",border:"3px solid rgba(255,255,255,0.1)",borderTopColor:"rgba(255,255,255,0.6)",animation:"spin 0.8s linear infinite" }}/>
            </div>
          )}
          {result && result.type === "svg" && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"12px" }}>
              <div style={{ flex:1, background:"rgba(255,255,255,0.97)", borderRadius:"10px", padding:"12px", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}
                dangerouslySetInnerHTML={{ __html: result.content }}/>
              <button onClick={download} style={{ width:"100%", padding:"11px", borderRadius:"99px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.08)", color:C.white, fontSize:"13px", fontWeight:"700", cursor:"pointer", fontFamily:FONT }}>Download SVG</button>
            </div>
          )}
          {result && result.type === "image" && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"12px" }}>
              <img src={result.dataUrl} alt="result" style={{ width:"100%", borderRadius:"10px", objectFit:"contain", maxHeight:"280px" }}/>
              <button onClick={download} style={{ width:"100%", padding:"11px", borderRadius:"99px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.08)", color:C.white, fontSize:"13px", fontWeight:"700", cursor:"pointer", fontFamily:FONT }}>Download {active.split("-")[1].toUpperCase()}</button>
            </div>
          )}
          {result && result.type === "pdf" && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"16px" }}>
              <div style={{ width:"64px", height:"80px", borderRadius:"10px", background:"rgba(255,255,255,0.06)", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <p style={{ fontSize:"13px", color:C.white, margin:0, fontWeight:"600" }}>PDF ready</p>
              <button onClick={download} style={{ width:"100%", padding:"11px", borderRadius:"99px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.08)", color:C.white, fontSize:"13px", fontWeight:"700", cursor:"pointer", fontFamily:FONT }}>Download PDF</button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
