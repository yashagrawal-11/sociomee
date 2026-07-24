import { useState, useRef } from "react";
const F = "'Poppins','DM Sans',sans-serif";
const C = { bg:"#0a0a0a", border:"rgba(255,255,255,0.08)", card:"rgba(255,255,255,0.03)", muted:"rgba(255,255,255,0.35)", white:"#fff" };
const token = () => localStorage.getItem("sociomee_token");
const API = "https://sociomeeai.com/api";
const mob = typeof window !== "undefined" && window.innerWidth <= 767;

const GROUPS = [
  { label:"Image", items:[
    { id:"img-svg",  label:"Image → SVG",   accept:"image/*", multi:false },
    { id:"img-pdf",  label:"Image → PDF",   accept:"image/*", multi:false },
    { id:"img-jpg",  label:"Image → JPG",   accept:"image/*", multi:false },
    { id:"img-png",  label:"Image → PNG",   accept:"image/*", multi:false },
    { id:"img-webp", label:"Image → WebP",  accept:"image/*", multi:false },
    { id:"img-gif",  label:"Images → GIF",  accept:"image/*", multi:true  },
    { id:"png-jpg",  label:"PNG → JPG",     accept:"image/png", multi:false },
    { id:"jpg-png",  label:"JPG → PNG",     accept:"image/jpeg,image/jpg", multi:false },
    { id:"webp-png", label:"WebP → PNG",    accept:"image/webp", multi:false },
    { id:"webp-jpg", label:"WebP → JPG",    accept:"image/webp", multi:false },
    { id:"png-webp", label:"PNG → WebP",    accept:"image/png", multi:false },
    { id:"jpg-webp", label:"JPG → WebP",    accept:"image/jpeg,image/jpg", multi:false },
  ]},
  { label:"PDF", items:[
    { id:"pdf-img",  label:"PDF → Images",  accept:"application/pdf", multi:false },
    { id:"imgs-pdf", label:"Images → PDF",  accept:"image/*", multi:true  },
  ]},
  { label:"Document", items:[
    { id:"doc-pdf",  label:"DOCX → PDF",    accept:".docx", multi:false },
    { id:"ppt-pdf",  label:"PPTX → PDF",    accept:".pptx", multi:false },
    { id:"xls-pdf",  label:"XLSX → PDF",    accept:".xlsx", multi:false },
  ]},
  { label:"Audio", items:[
    { id:"mp3-wav",  label:"MP3 → WAV",     accept:"audio/mpeg", multi:false, pp:true },
    { id:"wav-mp3",  label:"WAV → MP3",     accept:"audio/wav", multi:false, pp:true },
    { id:"mp4-mp3",  label:"MP4 → MP3",     accept:"video/mp4", multi:false, pp:true },
  ]},
  { label:"Video", items:[
    { id:"mp4-webm", label:"MP4 → WebM",    accept:"video/mp4", multi:false, pp:true },
    { id:"webm-mp4", label:"WebM → MP4",    accept:"video/webm", multi:false, pp:true },
    { id:"mov-mp4",  label:"MOV → MP4",     accept:"video/quicktime", multi:false, pp:true },
  ]},
];
const ALL = GROUPS.flatMap(g=>g.items);

function formatBytes(b) {
  if (!b) return "";
  const u=["B","KB","MB"]; let i=0,n=b;
  while(n>=1024&&i<2){n/=1024;i++;} return `${n.toFixed(1)} ${u[i]}`;
}

export default function SocioMeeConvert({ user, creditStatus }) {
  const [active, setActive] = useState("img-svg");
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();

  const plan = creditStatus?.plan || user?.plan || "free";
  const isPro = plan !== "free";
  const isPP = plan === "premium_monthly" || plan === "premium_annual";
  const conv = ALL.find(c=>c.id===active) || ALL[0];
  const isMedia = conv.pp;

  if (!isPro) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"80vh", fontFamily:F }}>
      <div style={{ textAlign:"center", padding:"48px 32px" }}>
        <div style={{ fontSize:"32px", marginBottom:"16px" }}>🔄</div>
        <h2 style={{ color:"#fff", fontFamily:F, marginBottom:"8px" }}>Convert is Pro+</h2>
        <p style={{ color:C.muted, fontSize:"14px", marginBottom:"24px" }}>Upgrade to convert files between 23 formats.</p>
        <a href="/pricing" style={{ padding:"12px 28px", borderRadius:"99px", background:"#fff", color:"#000", fontWeight:"700", textDecoration:"none", fontSize:"14px", fontFamily:F }}>Upgrade to Pro</a>
      </div>
    </div>
  );

  const handleFiles = (fl) => {
    setError(""); setResult(null);
    const arr = Array.from(fl);
    const big = arr.find(f=>f.size>100*1024*1024);
    if (big) { setError(`File too large (${formatBytes(big.size)}). Max 100MB.`); return; }
    setFiles(arr);
    if (arr[0] && arr[0].type.startsWith("image/")) {
      const r = new FileReader(); r.onload = e => setPreview(e.target.result); r.readAsDataURL(arr[0]);
    } else { setPreview(null); }
  };

  const convert = async () => {
    if (!files.length) { fileRef.current?.click(); return; }
    if (isMedia && !isPP) { setError("Audio/Video conversion requires Pro+."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      if (active === "img-svg") {
        const resp = await fetch(`${API}/convert/img-to-svg`, {
          method:"POST", headers:{"Content-Type":"application/json","Authorization":`Bearer ${token()}`},
          body: JSON.stringify({ image: preview }),
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.detail || "Failed");
        const svgFixed = data.svg.replace(/<svg /, '<svg style="width:100%;height:auto;max-height:260px;" ');
        setResult({ type:"svg", content:svgFixed, filename:"converted.svg" });
      } else if (["doc-pdf","ppt-pdf","xls-pdf"].includes(active)) {
        const fd = new FormData(); fd.append("file", files[0]);
        const resp = await fetch(`${API}/convert/doc-to-pdf`, { method:"POST", headers:{Authorization:`Bearer ${token()}`}, body:fd });
        if (!resp.ok) throw new Error((await resp.json().catch(()=>({detail:"Failed"}))).detail||"Failed");
        const blob = await resp.blob();
        setResult({ type:"pdf-blob", blob, filename:`converted.pdf`, url:URL.createObjectURL(blob), size:blob.size });
      } else if (active === "pdf-img") {
        const fd = new FormData(); fd.append("file", files[0]);
        const resp = await fetch(`${API}/convert/pdf-to-images`, { method:"POST", headers:{Authorization:`Bearer ${token()}`}, body:fd });
        if (!resp.ok) throw new Error((await resp.json().catch(()=>({detail:"Failed"}))).detail||"Failed");
        const data = await resp.json();
        setResult({ type:"pdf-images", images:data.images, filename:"pdf_pages.zip" });
      } else if (["mp3-wav","wav-mp3","mp4-mp3","mp4-webm","webm-mp4","mov-mp4"].includes(active)) {
        const fd = new FormData(); fd.append("file", files[0]); fd.append("conversion", active);
        const resp = await fetch(`${API}/convert/media`, { method:"POST", headers:{Authorization:`Bearer ${token()}`}, body:fd });
        if (!resp.ok) throw new Error((await resp.json().catch(()=>({detail:"Failed"}))).detail||"Failed");
        const blob = await resp.blob();
        const ext = active.split("-")[1];
        setResult({ type:blob.type, blob, filename:`converted.${ext}`, url:URL.createObjectURL(blob), size:blob.size });
      } else {
        // Client-side canvas conversions
        if (!preview) throw new Error("No image loaded");
        const img = new Image(); img.src = preview;
        await new Promise(res => { img.onload = res; });
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d"); ctx.drawImage(img, 0, 0);
        if (active === "img-pdf") {
          const { jsPDF } = await import("jspdf");
          const pdf = new jsPDF({ orientation:img.naturalWidth>img.naturalHeight?"landscape":"portrait", unit:"px", format:[img.naturalWidth,img.naturalHeight] });
          pdf.addImage(preview,"JPEG",0,0,img.naturalWidth,img.naturalHeight);
          const blob = pdf.output("blob");
          setResult({ type:"pdf-blob", blob, filename:`converted.pdf`, url:URL.createObjectURL(blob), size:blob.size });
        } else if (active === "imgs-pdf") {
          const { jsPDF } = await import("jspdf");
          const pdf = new jsPDF(); let first = true;
          for (const f of files) {
            const src = await new Promise(res=>{const r=new FileReader();r.onload=e=>res(e.target.result);r.readAsDataURL(f);});
            const i2 = new Image(); i2.src = src; await new Promise(res=>{i2.onload=res;});
            if (!first) pdf.addPage(); first=false;
            pdf.addImage(src,"JPEG",0,0,pdf.internal.pageSize.getWidth(),pdf.internal.pageSize.getHeight());
          }
          const blob = pdf.output("blob");
          setResult({ type:"pdf-blob", blob, filename:"combined.pdf", url:URL.createObjectURL(blob), size:blob.size });
        } else {
          const mimeMap = {"img-webp":"image/webp","img-jpg":"image/jpeg","img-png":"image/png","png-jpg":"image/jpeg","jpg-png":"image/png","webp-png":"image/png","webp-jpg":"image/jpeg","png-webp":"image/webp","jpg-webp":"image/webp"};
          const mime = mimeMap[active]||"image/png";
          const ext = mime.split("/")[1].replace("jpeg","jpg");
          const dataUrl = canvas.toDataURL(mime, 0.92);
          setResult({ type:"image", dataUrl, filename:`converted.${ext}` });
        }
      }
    } catch(e) { setError(e.message||"Conversion failed"); }
    finally { setLoading(false); }
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    if (result.type==="svg") { a.href=URL.createObjectURL(new Blob([result.content],{type:"image/svg+xml"})); }
    else if (result.type==="image") { a.href=result.dataUrl; }
    else { a.href=result.url; }
    a.download=result.filename; a.click();
  };

  const reset = () => { setFiles([]); setResult(null); setError(""); };



  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", fontFamily:F, background:C.bg, overflowY:"auto" }}>
      {/* Header */}
      <div style={{ padding:mob?"8px 10px 8px 64px":"14px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, background:"rgba(255,255,255,0.01)", backdropFilter:"blur(12px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
          <span style={{ fontSize:mob?"11px":"13px", fontWeight:"700", color:C.white }}>Convert</span>
          <span style={{ fontSize:"10px", color:C.muted }}>1 cr / file</span>
        </div>
        <button onClick={()=>setShowPicker(true)}
          style={{ display:"flex", alignItems:"center", gap:"6px", padding:mob?"5px 10px":"6px 14px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.08)", backdropFilter:"blur(8px)", color:C.white, fontSize:mob?"10px":"12px", fontWeight:"600", cursor:"pointer", fontFamily:F }}>
          {conv.label}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>

      {/* Format picker bottom sheet */}
      {showPicker && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:400, display:"flex", flexDirection:"column", justifyContent:"flex-end" }} onClick={()=>setShowPicker(false)}>
          <div style={{ background:"#111", borderRadius:"20px 20px 0 0", padding:"16px 16px 32px", maxHeight:"75vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:"36px", height:"3px", background:"rgba(255,255,255,0.15)", borderRadius:"99px", margin:"0 auto 20px" }}/>
            {GROUPS.map(g=>(
              <div key={g.label}>
                <p style={{ fontSize:"9px", fontWeight:"700", color:"rgba(255,255,255,0.25)", letterSpacing:"1.5px", textTransform:"uppercase", margin:"16px 0 8px", fontFamily:F }}>{g.label}</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                  {g.items.map(item=>(
                    <button key={item.id} onClick={()=>{ setActive(item.id); setFiles([]); setResult(null); setError(""); setShowPicker(false); }}
                      style={{ padding:"7px 14px", borderRadius:"99px", border:`1px solid ${active===item.id?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.08)"}`, background:active===item.id?"rgba(255,255,255,0.1)":"transparent", color:active===item.id?"#fff":C.muted, fontSize:"12px", cursor:"pointer", fontFamily:F, display:"flex", alignItems:"center", gap:"4px" }}>
                      {item.label}
                      {item.pp && <span style={{ fontSize:"9px", color:"rgba(167,139,250,0.8)" }}>Pro+</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main area */}
      <div style={{ flex:1, padding:mob?"12px":"20px", display:"flex", flexDirection:mob?"column":"row", gap:"16px" }}>
        {/* Source */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"12px" }}>

          <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${dragOver?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.06)"}`, borderRadius:"16px", flex:1, minHeight:mob?"160px":"200px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:mob?"16px":"24px", textAlign:"center", cursor:"pointer", transition:"all 0.2s", backdropFilter:"blur(8px)" }}
            onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{e.preventDefault();setDragOver(false);handleFiles(e.dataTransfer.files);}}
            onClick={()=>fileRef.current?.click()}>
            {files.length ? (
              <div style={{ width:"100%", textAlign:"center" }}>
                {preview && <img src={preview} alt="preview" style={{ width:"100%", maxHeight:"140px", objectFit:"contain", borderRadius:"10px", marginBottom:"10px" }}/>}
                <p style={{ color:C.white, fontWeight:"600", fontSize:"13px", margin:"0 0 4px" }}>{files.length} file{files.length>1?"s":""} ready</p>
                <p style={{ color:C.muted, fontSize:"11px", margin:"0 0 12px" }}>{files[0]?.name?.substring(0,40)}</p>
                <button onClick={e=>{e.stopPropagation();reset();}} style={{ fontSize:"11px", color:C.muted, background:"transparent", border:"none", cursor:"pointer", fontFamily:F }}>Clear</button>
              </div>
            ) : (
              <>
                <div style={{ width:"48px", height:"48px", borderRadius:"14px", background:"rgba(255,255,255,0.06)", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"16px" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.7"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <p style={{ color:C.white, fontWeight:"600", fontSize:"13px", margin:"0 0 6px" }}>
                  {conv.multi?"Drop files here":"Drop file here"}
                </p>
                <p style={{ color:C.muted, fontSize:"11px", margin:"0 0 16px" }}>Max 100MB</p>
                <button style={{ padding:"8px 22px", borderRadius:"99px", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", backdropFilter:"blur(10px)", color:"#fff", fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:F }}>
                  Choose {conv.multi?"Files":"File"}
                </button>
              </>
            )}
          </div>

          {error && <div style={{ padding:"10px 14px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"10px", color:"rgba(239,68,68,0.8)", fontSize:"12px" }}>{error}</div>}

          <button onClick={convert} disabled={loading}
            style={{ padding:"12px", borderRadius:"99px", background:loading?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", backdropFilter:"blur(10px)", color:loading?"rgba(255,255,255,0.3)":"#fff", fontWeight:"700", fontSize:"13px", cursor:loading?"default":"pointer", fontFamily:F, display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
            {loading ? <><div style={{ width:"14px",height:"14px",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.2)",borderTopColor:"rgba(255,255,255,0.6)",animation:"spin 0.8s linear infinite" }}/> Converting...</> : `Convert to ${conv.label.split("→")[1]?.trim()||""}`}
          </button>
        </div>

        {/* Result */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"12px" }}>

          <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${C.border}`, borderRadius:"16px", flex:1, minHeight:"200px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px", textAlign:"center" }}>
            {!result ? (
              <>
                <div style={{ width:"48px", height:"48px", borderRadius:"14px", background:"rgba(255,255,255,0.04)", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"16px" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.7"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                </div>
                <p style={{ color:"rgba(255,255,255,0.2)", fontSize:"13px", margin:0 }}>Converted file will appear here</p>
              </>
            ) : (
              <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:"12px" }}>
                {result.type==="svg" && <div dangerouslySetInnerHTML={{__html:result.content}} style={{ width:"100%" }}/>}
                {result.type==="image" && <img src={result.dataUrl} alt="result" style={{ width:"100%", borderRadius:"10px", maxHeight:"200px", objectFit:"contain" }}/>}
                {result.type==="pdf-blob" && <div style={{ fontSize:"12px", color:C.muted }}>PDF ready — {formatBytes(result.size)}</div>}
                {result.type==="pdf-images" && result.images?.map((img,i)=><img key={i} src={`data:image/png;base64,${img}`} alt={`page ${i+1}`} style={{ width:"100%", borderRadius:"8px", marginBottom:"8px" }}/>)}
                {result.type?.startsWith("audio") && <audio controls src={result.url} style={{ width:"100%" }}/>}
                {result.type?.startsWith("video") && <video controls src={result.url} style={{ width:"100%", borderRadius:"10px" }}/>}
                <p style={{ color:C.white, fontWeight:"600", fontSize:"13px", margin:0, wordBreak:"break-all" }}>{result.filename}</p>
                <p style={{ color:C.muted, fontSize:"11px", margin:0 }}>{formatBytes(result.size)}</p>
                <button onClick={download} style={{ padding:"11px", borderRadius:"99px", background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.15)", backdropFilter:"blur(10px)", color:"#fff", fontWeight:"700", fontSize:"13px", cursor:"pointer", fontFamily:F }}>
                  Download
                </button>
                <button onClick={reset} style={{ padding:"8px", borderRadius:"99px", background:"transparent", border:`1px solid ${C.border}`, color:C.muted, fontSize:"12px", cursor:"pointer", fontFamily:F }}>
                  Convert another
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <input ref={fileRef} type="file" accept={conv.accept} multiple={conv.multi} style={{ display:"none" }} onChange={e=>handleFiles(e.target.files)}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
