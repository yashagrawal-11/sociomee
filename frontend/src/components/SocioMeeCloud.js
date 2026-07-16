import { useState, useRef, useCallback } from "react";

const FONT = "'DM Sans','Syne',sans-serif";
const FONT_HEAD = "'Poppins',sans-serif";

const C = {
  bg: "#080810",
  sidebar: "rgba(255,255,255,0.025)",
  card: "rgba(255,255,255,0.04)",
  cardHover: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.07)",
  borderHover: "rgba(255,255,255,0.15)",
  muted: "rgba(255,255,255,0.35)",
  dim: "rgba(255,255,255,0.18)",
  white: "#fff",
  accent: "#fff",
};

function Ic({ d, size=16, stroke=1.7 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
}
function IconAll({ size=16, color="rgba(255,255,255,0.85)" }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>; }
function IconScript({ size=16, color="rgba(255,255,255,0.85)" }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>; }
function IconImage({ size=16, color="rgba(255,255,255,0.85)" }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>; }
function IconVideo({ size=16, color="rgba(255,255,255,0.85)" }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="15" height="14" rx="2"/><path d="M17 10l5-3v10l-5-3"/></svg>; }
function IconPDF({ size=16, color="rgba(255,255,255,0.85)" }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>; }
function IconAudio({ size=16, color="rgba(255,255,255,0.85)" }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>; }
function IconReceived({ size=16, color="rgba(255,255,255,0.85)" }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v12"/><path d="M6 12l6 6 6-6"/><path d="M4 20h16"/></svg>; }
function IconOther({ size=16, color="rgba(255,255,255,0.85)" }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>; }
function IconUpload({ size=14 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function IconSearch({ size=13 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>; }
function IconGrid({ size=13 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>; }
function IconList({ size=13 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>; }
function IconStar({ size=13, filled=false }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill={filled?"#fff":"none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }
function IconTrash({ size=13 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>; }
function IconDownload({ size=13 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function IconCloud({ size=18 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>; }

const CATS = [
  { id:"all",     label:"All Files",  Icon:IconAll,      accent:"rgba(255,255,255,0.9)" },
  { id:"scripts", label:"Scripts",    Icon:IconScript,   accent:"rgba(255,255,255,0.7)" },
  { id:"images",  label:"Images",     Icon:IconImage,    accent:"rgba(255,255,255,0.7)" },
  { id:"videos",  label:"Videos",     Icon:IconVideo,    accent:"rgba(255,255,255,0.7)" },
  { id:"pdfs",    label:"PDFs",       Icon:IconPDF,      accent:"rgba(255,255,255,0.7)" },
  { id:"audio",   label:"Audio",      Icon:IconAudio,    accent:"rgba(255,255,255,0.7)" },
  { id:"shared",  label:"Received",   Icon:IconReceived, accent:"rgba(255,255,255,0.7)" },
  { id:"other",   label:"Other",      Icon:IconOther,    accent:"rgba(255,255,255,0.7)" },
];

const PLAN_LIMITS = { free: 0, pro: 2048, premium: 8192 };

function formatBytes(b) {
  if (!b || b === 0) return "0 B";
  if (b < 1024) return `${b} B`;
  if (b < 1024*1024) return `${(b/1024).toFixed(1)} KB`;
  if (b < 1024*1024*1024) return `${(b/1024/1024).toFixed(1)} MB`;
  return `${(b/1024/1024/1024).toFixed(2)} GB`;
}
function timeAgo(ts) {
  if (!ts) return "";
  const d = (Date.now()-ts)/1000;
  if (d<60) return "just now";
  if (d<3600) return `${Math.floor(d/60)}m ago`;
  if (d<86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
}
function getCatInfo(cat) { return CATS.find(c=>c.id===cat) || CATS[CATS.length-1]; }
function detectCat(file) {
  const t = file.type || "";
  if (t.startsWith("image/")) return "images";
  if (t.startsWith("video/")) return "videos";
  if (t.startsWith("audio/")) return "audio";
  if (t === "application/pdf") return "pdfs";
  if (t.includes("text") || t.includes("script") || file.name?.match(/\.(txt|md|js|py|html|css|json|ts|tsx|jsx)$/i)) return "scripts";
  return "other";
}

export default function SocioMeeCloud({ user }) {
  const [files, setFiles] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cloud_files") || "[]"); } catch { return []; }
  });
  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const rawPlan = user?.plan || user?.plan_label || "free";
  const plan = rawPlan.toLowerCase().includes("premium") ? "premium" : rawPlan.toLowerCase().includes("pro") ? "pro" : "free";
  const limitMB = PLAN_LIMITS[plan];
  const limitBytes = limitMB * 1024 * 1024;
  const usedBytes = files.reduce((a, f) => a + (f.size || 0), 0);
  const usedPct = limitBytes > 0 ? Math.min(100, (usedBytes/limitBytes)*100) : 0;

  const saveFiles = (f) => {
    setFiles(f);
    try { localStorage.setItem("cloud_files", JSON.stringify(f.map(x => ({...x, data:undefined})))); } catch {}
  };
  const addFiles = useCallback(async (fileList) => {
    setUploading(true);
    const newFiles = [];
    for (const file of Array.from(fileList)) {
      if (usedBytes + file.size > limitBytes) { alert("Storage limit reached."); break; }
      const data = await new Promise(res => { const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(file); });
      newFiles.push({ id:Date.now()+Math.random(), name:file.name, size:file.size, type:file.type, category:detectCat(file), addedAt:Date.now(), starred:false, data });
    }
    saveFiles([...files, ...newFiles]);
    setUploading(false);
  }, [files, usedBytes, limitBytes]);

  const deleteFile = (id) => { saveFiles(files.filter(f=>f.id!==id)); if(preview?.id===id) setPreview(null); };
  const starFile = (id) => saveFiles(files.map(f=>f.id===id?{...f,starred:!f.starred}:f));
  const downloadFile = (file) => { const a=document.createElement("a"); a.href=file.data; a.download=file.name; a.click(); };

  const filtered = files.filter(f => {
    const matchCat = activeCat==="all" || f.category===activeCat;
    const matchSearch = !search || f.name?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });
  const catCounts = {};
  files.forEach(f => { catCounts[f.category]=(catCounts[f.category]||0)+1; });
  const recent = [...files].sort((a,b)=>b.addedAt-a.addedAt).slice(0,4);

  if (plan === "free") return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"70vh", padding:"32px 24px", fontFamily:FONT }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"24px", textAlign:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"24px", padding:"52px 44px", maxWidth:"420px", width:"100%", backdropFilter:"blur(24px)" }}>
        <div style={{ width:"68px", height:"68px", borderRadius:"20px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <IconCloud size={28}/>
        </div>
        <div>
          <h3 style={{ fontSize:"22px", fontWeight:"700", color:"#fff", margin:"0 0 10px", fontFamily:FONT_HEAD }}>SocioMee Cloud</h3>
          <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.4)", lineHeight:1.8, margin:0 }}>Store your scripts, images, videos and audio files securely. Available on Pro and Pro+ plans.</p>
        </div>
        <div style={{ width:"100%", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", padding:"18px 20px", display:"flex", flexDirection:"column", gap:"12px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:"13px", color:"rgba(255,255,255,0.5)", fontFamily:FONT }}>Pro</span>
            <span style={{ fontSize:"13px", color:"rgba(255,255,255,0.85)", fontWeight:"600", fontFamily:FONT }}>2 GB Storage</span>
          </div>
          <div style={{ height:"1px", background:"rgba(255,255,255,0.06)" }}/>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontSize:"13px", color:"rgba(255,255,255,0.5)", fontFamily:FONT }}>Pro+</span>
            <span style={{ fontSize:"13px", color:"rgba(255,255,255,0.85)", fontWeight:"600", fontFamily:FONT }}>8 GB Storage</span>
          </div>
        </div>
        <a href="/pricing" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", padding:"13px 0", borderRadius:"12px", background:"#fff", color:"#080810", fontWeight:"700", fontSize:"14px", textDecoration:"none", width:"100%", fontFamily:FONT }}>Upgrade to Pro</a>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", height:"100vh", background:C.bg, fontFamily:FONT, overflow:"hidden" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .cl-cat:hover{background:rgba(255,255,255,0.06)!important;border-color:rgba(255,255,255,0.12)!important;}
        .cl-cat.active{background:rgba(255,255,255,0.08)!important;border-color:rgba(255,255,255,0.15)!important;}
        .cl-file:hover{border-color:rgba(255,255,255,0.15)!important;background:rgba(255,255,255,0.07)!important;}
        .cl-btn:hover{background:rgba(255,255,255,0.08)!important;}
        .cl-action:hover{background:rgba(255,255,255,0.08)!important;color:#fff!important;}
        ::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:99px}
      `}</style>

      {/* Sidebar */}
      <div style={{ width:"210px", flexShrink:0, borderRight:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.02)", backdropFilter:"blur(20px)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"18px 16px 14px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"9px", marginBottom:"14px" }}>
            <IconCloud size={16}/>
            <span style={{ fontSize:"13px", fontWeight:"600", color:C.white, letterSpacing:"0.2px" }}>Cloud</span>
          </div>
          <button onClick={()=>fileInputRef.current?.click()}
            style={{ width:"100%", padding:"9px", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.8)", fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:FONT, display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", transition:"all 0.15s" }}>
            {uploading ? <div style={{ width:"12px", height:"12px", borderRadius:"50%", border:"2px solid rgba(255,255,255,0.2)", borderTopColor:"#fff", animation:"spin 0.8s linear infinite" }}/> : <IconUpload size={12}/>}
            Upload Files
          </button>
          <input ref={fileInputRef} type="file" multiple style={{ display:"none" }} onChange={e=>{addFiles(e.target.files);e.target.value="";}}/>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"10px 8px" }}>
          <p style={{ fontSize:"9px", fontWeight:"600", color:"rgba(255,255,255,0.2)", letterSpacing:"1.5px", textTransform:"uppercase", fontFamily:FONT, margin:"0 0 6px 8px" }}>Categories</p>
          {CATS.map(cat => {
            const Icon = cat.Icon;
            const isActive = activeCat === cat.id;
            return (
              <button key={cat.id} className={`cl-cat${isActive?" active":""}`} onClick={()=>setActiveCat(cat.id)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:"8px", padding:"7px 10px", borderRadius:"8px", border:`1px solid ${isActive?"rgba(255,255,255,0.12)":"transparent"}`, background:isActive?"rgba(255,255,255,0.06)":"transparent", cursor:"pointer", transition:"all 0.15s", marginBottom:"1px" }}>
                <span style={{color:isActive?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.35)"}}><Icon size={14}/></span>
                <span style={{ fontSize:"12px", fontWeight:isActive?"600":"400", color:isActive?"rgba(255,255,255,0.9)":C.muted, fontFamily:FONT, flex:1, textAlign:"left" }}>{cat.label}</span>
                {cat.id !== "all" && catCounts[cat.id] ? <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.2)", fontFamily:FONT }}>{catCounts[cat.id]}</span> : null}
                {cat.id === "all" && files.length > 0 ? <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.2)", fontFamily:FONT }}>{files.length}</span> : null}
              </button>
            );
          })}
        </div>

        <div style={{ padding:"14px 16px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:"8px" }}>
            <span style={{ fontSize:"11px", fontWeight:"600", color:C.white, fontFamily:FONT }}>Storage</span>
            <span style={{ fontSize:"10px", color:C.muted, fontFamily:FONT }}>{formatBytes(usedBytes)} / {limitMB>=1024?(limitMB/1024).toFixed(0)+"GB":limitMB+"MB"}</span>
          </div>
          <div style={{ height:"3px", borderRadius:"99px", background:"rgba(255,255,255,0.07)", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${usedPct}%`, background:"rgba(255,255,255,0.6)", borderRadius:"99px", transition:"width 0.5s ease" }}/>
          </div>
          <a href="/pricing" style={{ display:"block", fontSize:"10px", color:"rgba(255,255,255,0.35)", fontFamily:FONT, fontWeight:"500", textDecoration:"none", marginTop:"8px" }}>Upgrade plan ↗</a>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:"12px", flexShrink:0 }}>
          <div style={{ flex:1, maxWidth:"380px", position:"relative" }}>
            <div style={{ position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.25)" }}><IconSearch/></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search files..."
              style={{ width:"100%", padding:"8px 12px 8px 32px", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.04)", color:C.white, fontSize:"12px", fontFamily:FONT, outline:"none", boxSizing:"border-box" }}/>
          </div>
          <div style={{ display:"flex", gap:"3px", marginLeft:"auto" }}>
            {["grid","list"].map(m => (
              <button key={m} className="cl-btn" onClick={()=>setViewMode(m)}
                style={{ width:"30px", height:"30px", borderRadius:"8px", border:`1px solid ${viewMode===m?"rgba(255,255,255,0.15)":C.border}`, background:viewMode===m?"rgba(255,255,255,0.08)":"transparent", color:viewMode===m?"#fff":C.muted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
                {m==="grid"?<IconGrid/>:<IconList/>}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"20px" }}
          onDragOver={e=>{e.preventDefault();setDragOver(true);}}
          onDragLeave={()=>setDragOver(false)}
          onDrop={e=>{e.preventDefault();setDragOver(false);addFiles(e.dataTransfer.files);}}>

          {dragOver && (
            <div style={{ position:"absolute", inset:0, background:"rgba(255,255,255,0.04)", border:"2px dashed rgba(255,255,255,0.2)", borderRadius:"16px", zIndex:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <p style={{ fontSize:"16px", fontWeight:"600", color:"rgba(255,255,255,0.6)", fontFamily:FONT_HEAD }}>Drop files here</p>
            </div>
          )}

          {activeCat === "all" && !search && (
            <div style={{ marginBottom:"28px" }}>
              <p style={{ fontSize:"11px", fontWeight:"600", color:"rgba(255,255,255,0.3)", letterSpacing:"1px", textTransform:"uppercase", fontFamily:FONT, marginBottom:"12px" }}>Categories</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px" }}>
                {CATS.filter(c=>c.id!=="all").map(cat => {
                  const Icon = cat.Icon;
                  return (
                    <button key={cat.id} onClick={()=>setActiveCat(cat.id)}
                      style={{ padding:"16px 14px", borderRadius:"14px", border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.03)", cursor:"pointer", textAlign:"left", transition:"all 0.2s", display:"flex", flexDirection:"column", gap:"10px", backdropFilter:"blur(10px)" }}
                      onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.borderColor="rgba(255,255,255,0.12)";e.currentTarget.style.transform="translateY(-2px)";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.03)";e.currentTarget.style.borderColor="rgba(255,255,255,0.07)";e.currentTarget.style.transform="none";}}>
                      <span style={{color:"rgba(255,255,255,0.85)"}}><Icon size={20}/></span>
                      <div>
                        <div style={{ fontSize:"12px", fontWeight:"600", color:C.white, fontFamily:FONT }}>{cat.label}</div>
                        <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.25)", fontFamily:FONT, marginTop:"2px" }}>{catCounts[cat.id]||0} files</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeCat === "all" && !search && recent.length > 0 && (
            <div style={{ marginBottom:"28px" }}>
              <p style={{ fontSize:"11px", fontWeight:"600", color:"rgba(255,255,255,0.3)", letterSpacing:"1px", textTransform:"uppercase", fontFamily:FONT, marginBottom:"12px" }}>Recent</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px" }}>
                {recent.map(file => {
                  const info = getCatInfo(file.category);
                  const Icon = info.Icon;
                  return (
                    <div key={file.id} className="cl-file" onClick={()=>setPreview(file)}
                      style={{ borderRadius:"12px", border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.03)", overflow:"hidden", cursor:"pointer", transition:"all 0.2s" }}>
                      {file.type?.startsWith("image/") && file.data ? (
                        <img src={file.data} alt={file.name} style={{ width:"100%", height:"72px", objectFit:"cover", display:"block" }}/>
                      ) : (
                        <div style={{ height:"72px", background:"rgba(255,255,255,0.03)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span style={{color:"rgba(255,255,255,0.6)"}}><Icon size={22}/></span>
                        </div>
                      )}
                      <div style={{ padding:"8px 10px" }}>
                        <p style={{ fontSize:"11px", fontWeight:"500", color:C.white, margin:"0 0 2px", fontFamily:FONT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</p>
                        <p style={{ fontSize:"10px", color:C.dim, margin:0, fontFamily:FONT }}>{timeAgo(file.addedAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"300px", gap:"16px", opacity:0.5 }}>
              <IconCloud size={36}/>
              <div style={{ textAlign:"center" }}>
                <p style={{ fontSize:"15px", fontWeight:"600", color:C.white, margin:"0 0 6px", fontFamily:FONT_HEAD }}>Your Cloud is empty</p>
                <p style={{ fontSize:"12px", color:C.muted, margin:0, fontFamily:FONT }}>Upload scripts, images, videos, PDFs and any creator files.</p>
              </div>
              <button onClick={()=>fileInputRef.current?.click()}
                style={{ padding:"10px 24px", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.8)", fontSize:"13px", fontWeight:"600", cursor:"pointer", fontFamily:FONT, display:"flex", alignItems:"center", gap:"8px" }}>
                <IconUpload size={13}/> Upload or Drop Files
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize:"11px", fontWeight:"600", color:"rgba(255,255,255,0.3)", letterSpacing:"1px", textTransform:"uppercase", fontFamily:FONT, marginBottom:"12px" }}>
                {activeCat === "all" ? "All Files" : CATS.find(c=>c.id===activeCat)?.label} &middot; {filtered.length}
              </p>
              {viewMode === "grid" ? (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:"8px" }}>
                  {filtered.map(file => {
                    const info = getCatInfo(file.category);
                    const Icon = info.Icon;
                    return (
                      <div key={file.id} className="cl-file" onClick={()=>setPreview(file)}
                        style={{ borderRadius:"12px", border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.03)", overflow:"hidden", cursor:"pointer", transition:"all 0.2s", animation:"fadeUp 0.3s ease" }}>
                        {file.type?.startsWith("image/") && file.data ? (
                          <img src={file.data} alt={file.name} style={{ width:"100%", height:"80px", objectFit:"cover", display:"block" }}/>
                        ) : (
                          <div style={{ height:"80px", background:"rgba(255,255,255,0.02)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <span style={{color:"rgba(255,255,255,0.6)"}}><Icon size={24}/></span>
                          </div>
                        )}
                        <div style={{ padding:"8px 10px" }}>
                          <p style={{ fontSize:"11px", fontWeight:"500", color:C.white, margin:"0 0 2px", fontFamily:FONT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</p>
                          <p style={{ fontSize:"10px", color:C.dim, margin:0, fontFamily:FONT }}>{formatBytes(file.size)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
                  {filtered.map(file => {
                    const info = getCatInfo(file.category);
                    const Icon = info.Icon;
                    return (
                      <div key={file.id} className="cl-file" onClick={()=>setPreview(file)}
                        style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 14px", borderRadius:"10px", border:"1px solid transparent", background:"transparent", cursor:"pointer", transition:"all 0.15s", animation:"fadeUp 0.3s ease" }}>
                        <div style={{ width:"32px", height:"32px", borderRadius:"8px", background:"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <Icon size={14} color="rgba(255,255,255,0.5)"/>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:"13px", fontWeight:"500", color:C.white, margin:"0 0 2px", fontFamily:FONT, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</p>
                          <p style={{ fontSize:"11px", color:C.dim, margin:0, fontFamily:FONT }}>{formatBytes(file.size)} &middot; {timeAgo(file.addedAt)}</p>
                        </div>
                        <div style={{ display:"flex", gap:"4px" }}>
                          <button className="cl-action" onClick={e=>{e.stopPropagation();starFile(file.id);}} style={{ width:"28px", height:"28px", borderRadius:"6px", border:"none", background:"transparent", color:file.starred?"#fff":"rgba(255,255,255,0.25)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}><IconStar size={12} filled={file.starred}/></button>
                          <button className="cl-action" onClick={e=>{e.stopPropagation();downloadFile(file);}} style={{ width:"28px", height:"28px", borderRadius:"6px", border:"none", background:"transparent", color:"rgba(255,255,255,0.25)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}><IconDownload size={12}/></button>
                          <button className="cl-action" onClick={e=>{e.stopPropagation();deleteFile(file.id);}} style={{ width:"28px", height:"28px", borderRadius:"6px", border:"none", background:"transparent", color:"rgba(255,255,255,0.25)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}><IconTrash size={12}/></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview panel */}
      {preview && (
        <div style={{ width:"280px", flexShrink:0, borderLeft:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.02)", backdropFilter:"blur(20px)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:"12px", fontWeight:"600", color:C.white, fontFamily:FONT }}>Preview</span>
            <button onClick={()=>setPreview(null)} style={{ width:"24px", height:"24px", borderRadius:"6px", border:"none", background:"transparent", color:C.muted, cursor:"pointer", fontSize:"14px", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>
            {preview.type?.startsWith("image/") && preview.data ? (
              <img src={preview.data} alt={preview.name} style={{ width:"100%", borderRadius:"10px", marginBottom:"16px", display:"block" }}/>
            ) : (
              <div style={{ height:"120px", background:"rgba(255,255,255,0.03)", borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"16px" }}>
                {(() => { const I = getCatInfo(preview.category).Icon; return <I size={32} color="rgba(255,255,255,0.2)"/>; })()}
              </div>
            )}
            <p style={{ fontSize:"13px", fontWeight:"600", color:C.white, margin:"0 0 4px", fontFamily:FONT, wordBreak:"break-word" }}>{preview.name}</p>
            <p style={{ fontSize:"11px", color:C.muted, margin:"0 0 16px", fontFamily:FONT }}>{formatBytes(preview.size)} &middot; {timeAgo(preview.addedAt)}</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
              <button onClick={()=>downloadFile(preview)} style={{ width:"100%", padding:"9px", borderRadius:"9px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.8)", fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:FONT, display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}><IconDownload size={12}/> Download</button>
              <button onClick={()=>starFile(preview.id)} style={{ width:"100%", padding:"9px", borderRadius:"9px", border:"1px solid rgba(255,255,255,0.08)", background:"transparent", color:"rgba(255,255,255,0.5)", fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:FONT, display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}><IconStar size={12} filled={preview.starred}/>{preview.starred?"Unstar":"Star"}</button>
              <button onClick={()=>deleteFile(preview.id)} style={{ width:"100%", padding:"9px", borderRadius:"9px", border:"1px solid rgba(255,61,61,0.2)", background:"rgba(255,61,61,0.05)", color:"rgba(255,100,100,0.7)", fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:FONT, display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}><IconTrash size={12}/> Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
