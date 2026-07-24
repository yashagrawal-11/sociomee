import { useState, useRef } from "react";
const F = "'Poppins','DM Sans',sans-serif";
const C = { bg:"#0a0a0a", border:"rgba(255,255,255,0.08)", card:"rgba(255,255,255,0.03)", muted:"rgba(255,255,255,0.35)", white:"#fff" };
const token = () => localStorage.getItem("sociomee_token");
const API = "https://sociomeeai.com/api";
const GROUPS = [
  { label:"Image", items:[
    { id:"img-svg",  label:"Image → SVG",   accept:"image/*", multi:false },
    { id:"img-jpg",  label:"Image → JPG",   accept:"image/*", multi:false },
    { id:"img-png",  label:"Image → PNG",   accept:"image/*", multi:false },
    { id:"img-webp", label:"Image → WebP",  accept:"image/*", multi:false },
    { id:"img-gif",  label:"Images → GIF",  accept:"image/*", multi:true  },
    { id:"img-pdf",  label:"Image → PDF",   accept:"image/*", multi:false },
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
  { label:"Video", pp:true, items:[
    { id:"mp4-mp3",  label:"MP4 → MP3",     accept:"video/mp4", multi:false, pp:true },
    { id:"mp4-mp3b", label:"MP4 → MP3",     accept:"video/mp4", multi:false, pp:true },
    { id:"mov-mp4",  label:"MOV → MP4",     accept:"video/quicktime", multi:false, pp:true },
    { id:"mov-mp4b", label:"MOV → MP4",     accept:"video/quicktime", multi:false, pp:true },
  ]},
];
const ALL = GROUPS.flatMap(g=>g.items);
function formatBytes(b) { if(b<1024)return b+"B"; if(b<1048576)return(b/1024).toFixed(1)+"KB"; return(b/1048576).toFixed(1)+"MB"; }

export default function SocioMeeConvert({ user, creditStatus }) {
  const [active, setActive]   = useState("img-jpg");
  const [files,  setFiles]    = useState([]);
  const [result, setResult]   = useState(null);
  const [loading,setLoading]  = useState(false);
  const [error,  setError]    = useState("");
  const [dragOver,setDragOver]= useState(false);
  const [preview,setPreview]  = useState(null);
  const fileRef = useRef();
  const plan = creditStatus?.plan || user?.plan || "free";
  const isPro = plan !== "free";
  const conv = ALL.find(c=>c.id===active) || ALL[0];

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
    if (!files.length) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append("files", f));
      fd.append("conversion", active);
      fd.append("user_id", user?.user_id || "");
      const res = await fetch(`${API}/convert/file`, { method:"POST", headers:{"Authorization":`Bearer ${token()}`}, body:fd });
      if (!res.ok) { const d = await res.json().catch(()=>({detail:"Failed"})); throw new Error(d.detail||"Conversion failed"); }
      const ct = res.headers.get("content-type")||"";
      if (ct.includes("application/json")) {
        const d = await res.json();
        if (d.svg) { setResult({ type:"svg", content:d.svg, filename:`converted.svg`, size:d.svg.length }); }
        else if (d.images) { setResult({ type:"images", images:d.images, filename:"converted-pages" }); }
        else { throw new Error(d.detail||"No output"); }
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const ext = active.split("-").pop();
        setResult({ type: ct.startsWith("image/") ? "image" : ct.startsWith("video/") ? "video" : "file", url, dataUrl:url, filename:`converted.${ext}`, size:blob.size });
      }
    } catch(e) { setError(e.message||"Conversion failed"); }
    finally { setLoading(false); }
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    if (result.type==="svg") { a.href=URL.createObjectURL(new Blob([result.content],{type:"image/svg+xml"})); }
    else { a.href=result.url||result.dataUrl; }
    a.download=result.filename; a.click();
  };

  const reset = () => { setFiles([]); setResult(null); setError(""); setPreview(null); };

  return (
    <div style={{ display:"flex", width:"100%", height:"100vh", fontFamily:F, background:C.bg, overflow:"hidden" }}>
      {/* Main area */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:"10px", flexShrink:0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
          <span style={{ fontSize:13, fontWeight:700, color:"#fff" }}>Convert</span>
          <span style={{ fontSize:10, color:C.muted, marginLeft:4 }}>{conv.label}</span>
          <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)", marginLeft:"auto" }}>1 credit / file</span>
        </div>

        {/* Drop zone */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20, overflow:"auto" }}>
          {!result ? (
            <div
              onDrop={e=>{e.preventDefault();setDragOver(false);handleFiles(e.dataTransfer.files);}}
              onDragOver={e=>{e.preventDefault();setDragOver(true);}}
              onDragLeave={()=>setDragOver(false)}
              onClick={()=>fileRef.current?.click()}
              style={{ width:"100%", maxWidth:480, borderRadius:18, border:`1px solid ${dragOver?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.07)"}`, background:dragOver?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.02)", padding:"40px 24px", textAlign:"center", cursor:"pointer", transition:"all 0.2s" }}>
              <input ref={fileRef} type="file" accept={conv.accept} multiple={conv.multi} style={{ display:"none" }} onChange={e=>handleFiles(e.target.files)}/>
              {preview ? (
                <img src={preview} alt="" style={{ width:"100%", maxHeight:200, objectFit:"contain", borderRadius:12, marginBottom:16 }}/>
              ) : (
                <div style={{ width:48, height:48, borderRadius:14, background:"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:22 }}>+</div>
              )}
              {files.length > 0 ? (
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"#fff", marginBottom:4 }}>{files.length} file{files.length>1?"s":""} selected</div>
                  <div style={{ fontSize:11, color:C.muted }}>{files.map(f=>f.name).join(", ").slice(0,60)}</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:"#fff", marginBottom:6 }}>Drop file here</div>
                  <div style={{ fontSize:11, color:C.muted }}>or click to choose</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ width:"100%", maxWidth:480, textAlign:"center" }}>
              {result.type==="image" && <img src={result.url||result.dataUrl} alt="" style={{ width:"100%", borderRadius:12, marginBottom:16 }}/>}
              {result.type==="svg" && <div dangerouslySetInnerHTML={{ __html:result.content.replace(/<svg /,'<svg style="width:100%;height:auto;max-height:260px;" ') }} style={{ marginBottom:16 }}/>}
              {result.type==="video" && <video controls src={result.url} style={{ width:"100%", borderRadius:10, marginBottom:16 }}/>}
              {result.type==="images" && result.images?.map((img,i)=><img key={i} src={img} alt="" style={{ width:"100%", borderRadius:8, marginBottom:8 }}/>)}
              <div style={{ fontSize:13, fontWeight:600, color:"#fff", marginBottom:4 }}>{result.filename}</div>
              {result.size && <div style={{ fontSize:11, color:C.muted, marginBottom:16 }}>{formatBytes(result.size)}</div>}
              <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
                <button onClick={download} style={{ padding:"10px 24px", borderRadius:99, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer", fontFamily:F }}>Download</button>
                <button onClick={reset} style={{ padding:"10px 24px", borderRadius:99, background:"transparent", border:"1px solid rgba(255,255,255,0.08)", color:C.muted, fontSize:12, cursor:"pointer", fontFamily:F }}>Convert another</button>
              </div>
            </div>
          )}

          {error && <div style={{ marginTop:16, fontSize:12, color:"#f87171", background:"rgba(248,113,113,0.08)", border:"1px solid rgba(248,113,113,0.2)", borderRadius:10, padding:"10px 16px", maxWidth:480, width:"100%" }}>{error}</div>}

          {files.length > 0 && !result && (
            <button onClick={convert} disabled={loading}
              style={{ marginTop:20, padding:"12px 40px", borderRadius:99, border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.06)", color:"#fff", fontWeight:700, fontSize:14, cursor:loading?"not-allowed":"pointer", fontFamily:F, display:"flex", alignItems:"center", gap:8 }}>
              {loading ? <><div style={{ width:14, height:14, borderRadius:"50%", border:"2px solid rgba(255,255,255,0.2)", borderTopColor:"#fff", animation:"spin 0.7s linear infinite" }}/> Converting...</> : `Convert to ${conv.label.split("→")[1]?.trim()||"file"}`}
            </button>
          )}
        </div>
      </div>

      {/* Right sidebar - format picker */}
      <div style={{ width:220, flexShrink:0, borderLeft:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.01)", overflowY:"auto", scrollbarWidth:"none", padding:"12px 8px" }}>
        {GROUPS.map(g => (
          <div key={g.label} style={{ marginBottom:16 }}>
            <div style={{ fontSize:"9.5px", fontWeight:700, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:"1.3px", padding:"0 8px", marginBottom:6 }}>{g.label}</div>
            {g.items.map(item => (
              <button key={item.id} onClick={()=>{ setActive(item.id); reset(); }}
                style={{ display:"flex", alignItems:"center", width:"100%", padding:"8px 10px", borderRadius:10, border:"none", background:active===item.id?"rgba(255,255,255,0.08)":"transparent", color:active===item.id?"#fff":"rgba(255,255,255,0.45)", fontSize:12, fontWeight:active===item.id?"600":"400", cursor:"pointer", fontFamily:F, textAlign:"left", transition:"all 0.1s", marginBottom:1, gap:8 }}>
                {active===item.id && <div style={{ width:3, height:14, borderRadius:99, background:"rgba(255,255,255,0.5)", flexShrink:0 }}/>}
                <span style={{ flex:1 }}>{item.label}</span>
                {item.pp && <span style={{ fontSize:9, color:"rgba(167,139,250,0.7)", fontWeight:700 }}>Pro+</span>}
              </button>
            ))}
          </div>
        ))}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
