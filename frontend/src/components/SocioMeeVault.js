import { useState, useRef, useCallback } from "react";

const C = {
  bg: "#0a0a0a",
  panel: "rgba(6,4,15,0.97)",
  card: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.07)",
  purple: "#7c3aed",
  purpleLight: "#a78bfa",
  muted: "rgba(255,255,255,0.35)",
  white: "#fff",
  font: "Poppins, sans-serif",
};

const CATS = [
  { id:"all",      label:"All Files",  icon:"✦",  color:"#7c3aed", bg:"rgba(124,58,237,0.15)" },
  { id:"scripts",  label:"Scripts",    icon:"📝",  color:"#8b5cf6", bg:"rgba(139,92,246,0.12)" },
  { id:"images",   label:"Images",     icon:"🖼️",  color:"#ec4899", bg:"rgba(236,72,153,0.12)" },
  { id:"videos",   label:"Videos",     icon:"🎬",  color:"#f59e0b", bg:"rgba(245,158,11,0.12)" },
  { id:"pdfs",     label:"PDFs",       icon:"📄",  color:"#ef4444", bg:"rgba(239,68,68,0.12)"  },
  { id:"audio",    label:"Audio",      icon:"🎵",  color:"#10b981", bg:"rgba(16,185,129,0.12)" },
  { id:"shared",   label:"Received",   icon:"📥",  color:"#06d6a0", bg:"rgba(6,214,160,0.12)"  },
  { id:"other",    label:"Other",      icon:"📁",  color:"#6366f1", bg:"rgba(99,102,241,0.12)" },
];

const PLAN_LIMITS = { free: 100, pro: 500, premium: 2048 };

function formatBytes(b) {
  if (!b || b === 0) return "0 B";
  if (b < 1024) return `${b} B`;
  if (b < 1024*1024) return `${(b/1024).toFixed(1)} KB`;
  if (b < 1024*1024*1024) return `${(b/1024/1024).toFixed(1)} MB`;
  return `${(b/1024/1024/1024).toFixed(2)} GB`;
}

function timeAgo(ts) {
  if (!ts) return "";
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m/60)}h ago`;
  return `${Math.floor(m/1440)}d ago`;
}

function getCategory(file) {
  const t = file.type || "";
  if (t.startsWith("image/")) return "images";
  if (t.startsWith("video/")) return "videos";
  if (t.startsWith("audio/")) return "audio";
  if (t === "application/pdf") return "pdfs";
  if (t.startsWith("text/") || file.name?.endsWith(".txt") || file.name?.endsWith(".md")) return "scripts";
  if (file.source === "share") return "shared";
  return "other";
}

function getCatInfo(id) {
  return CATS.find(c => c.id === id) || CATS[CATS.length - 1];
}

function FileIcon({ cat, size = 36 }) {
  const info = getCatInfo(cat);
  return (
    <div style={{ width:size, height:size, borderRadius:size*0.25, background:info.bg, border:`1px solid ${info.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.45, flexShrink:0 }}>
      {info.icon}
    </div>
  );
}

function StorageMeter({ used, total }) {
  const pct = Math.min(100, (used / total) * 100);
  const color = pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#7c3aed";
  const r = 36, stroke = 6, norm = r - stroke/2;
  const circ = 2 * Math.PI * norm;
  const dash = circ * (1 - pct/100);
  return (
    <div style={{ position:"relative", width:80, height:80 }}>
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={norm} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
        <circle cx="40" cy="40" r={norm} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={dash}
          strokeLinecap="round" transform="rotate(-90 40 40)"
          style={{ transition:"stroke-dashoffset 0.6s ease" }}/>
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontSize:"14px", fontWeight:"800", color:C.white, fontFamily:C.font, lineHeight:1 }}>{Math.round(pct)}%</span>
        <span style={{ fontSize:"9px", color:C.muted, fontFamily:C.font }}>used</span>
      </div>
    </div>
  );
}

export default function SocioMeeVault() {
  const [files, setFiles]       = useState(() => {
    try { return JSON.parse(localStorage.getItem("vault_files") || "[]"); } catch { return []; }
  });
  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch]     = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [preview, setPreview]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const plan = "pro"; // get from user context
  const limitMB = PLAN_LIMITS[plan];
  const limitBytes = limitMB * 1024 * 1024;
  const usedBytes = files.reduce((a, f) => a + (f.size || 0), 0);

  const saveFiles = (f) => {
    setFiles(f);
    try { localStorage.setItem("vault_files", JSON.stringify(f.map(x => ({...x, data: undefined})))); } catch {}
  };

  const addFiles = useCallback(async (fileList) => {
    setUploading(true);
    const newFiles = [];
    for (const file of Array.from(fileList)) {
      if (usedBytes + file.size > limitBytes) {
        alert(`Storage limit reached. Upgrade to add more files.`); break;
      }
      const data = await new Promise(res => {
        const r = new FileReader();
        r.onload = e => res(e.target.result);
        r.readAsDataURL(file);
      });
      newFiles.push({
        id: Date.now() + Math.random(),
        name: file.name,
        type: file.type,
        size: file.size,
        data,
        source: "upload",
        category: getCategory({ type: file.type, name: file.name }),
        addedAt: Date.now(),
        starred: false,
      });
    }
    const updated = [...newFiles, ...files];
    saveFiles(updated);
    setUploading(false);
  }, [files, usedBytes, limitBytes]);

  const deleteFile = (id) => {
    const updated = files.filter(f => f.id !== id);
    saveFiles(updated);
    if (preview?.id === id) setPreview(null);
  };

  const starFile = (id) => {
    const updated = files.map(f => f.id === id ? {...f, starred: !f.starred} : f);
    saveFiles(updated);
  };

  const downloadFile = (file) => {
    const a = document.createElement("a");
    a.href = file.data;
    a.download = file.name;
    a.click();
  };

  const filtered = files.filter(f => {
    const matchCat = activeCat === "all" || f.category === activeCat;
    const matchSearch = !search || f.name?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const catCounts = {};
  files.forEach(f => { catCounts[f.category] = (catCounts[f.category] || 0) + 1; });

  const recent = [...files].sort((a,b) => b.addedAt - a.addedAt).slice(0, 4);

  return (
    <div style={{ display:"flex", height:"100vh", background:C.bg, fontFamily:C.font, overflow:"hidden" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .vault-cat:hover{background:rgba(124,58,237,0.1)!important;border-color:rgba(124,58,237,0.3)!important;}
        .vault-file:hover{border-color:rgba(124,58,237,0.25)!important;transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.3);}
        .vault-file-list:hover{background:rgba(124,58,237,0.05)!important;border-color:rgba(124,58,237,0.2)!important;}
        .vault-icon-btn:hover{background:rgba(255,255,255,0.1)!important;}
        .vault-upload-zone:hover{border-color:rgba(124,58,237,0.5)!important;background:rgba(124,58,237,0.06)!important;}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.3);border-radius:99px}
      `}</style>

      {/* Left Sidebar */}
      <div style={{ width:"220px", flexShrink:0, borderRight:`1px solid ${C.border}`, background:C.panel, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ padding:"16px 14px 12px", borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"12px" }}>
            <div style={{ width:"28px", height:"28px", borderRadius:"8px", background:"rgba(124,58,237,0.2)", border:"1px solid rgba(124,58,237,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px" }}>🔒</div>
            <span style={{ fontSize:"13px", fontWeight:"800", color:C.white, fontFamily:C.font }}>SocioMee Vault</span>
          </div>

          {/* Upload button */}
          <button onClick={()=>fileInputRef.current?.click()}
            style={{ width:"100%", padding:"8px", borderRadius:"10px", border:"1px solid rgba(124,58,237,0.4)", background:"rgba(124,58,237,0.15)", color:"#a78bfa", fontSize:"12px", fontWeight:"700", cursor:"pointer", fontFamily:C.font, display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
            {uploading ? <div style={{ width:"12px", height:"12px", borderRadius:"50%", border:"2px solid rgba(124,58,237,0.3)", borderTopColor:"#a78bfa", animation:"spin 0.8s linear infinite" }}/> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>}
            Upload Files
          </button>
          <input ref={fileInputRef} type="file" multiple style={{ display:"none" }} onChange={e=>{addFiles(e.target.files);e.target.value="";}}/>
        </div>

        {/* Categories */}
        <div style={{ flex:1, overflowY:"auto", padding:"10px 10px" }}>
          <p style={{ fontSize:"9px", fontWeight:"700", color:"rgba(255,255,255,0.25)", letterSpacing:"1.5px", textTransform:"uppercase", fontFamily:C.font, margin:"0 0 8px 4px" }}>Categories</p>
          {CATS.map(cat => (
            <button key={cat.id} className="vault-cat" onClick={()=>setActiveCat(cat.id)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:"8px", padding:"7px 10px", borderRadius:"8px", border:`1px solid ${activeCat===cat.id?"rgba(124,58,237,0.35)":"transparent"}`, background:activeCat===cat.id?"rgba(124,58,237,0.12)":"transparent", cursor:"pointer", transition:"all 0.15s", marginBottom:"2px" }}>
              <span style={{ fontSize:"14px" }}>{cat.icon}</span>
              <span style={{ fontSize:"12px", fontWeight:activeCat===cat.id?"700":"400", color:activeCat===cat.id?"#a78bfa":C.muted, fontFamily:C.font, flex:1, textAlign:"left" }}>{cat.label}</span>
              {cat.id !== "all" && catCounts[cat.id] && (
                <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.2)", fontFamily:C.font }}>{catCounts[cat.id]}</span>
              )}
              {cat.id === "all" && files.length > 0 && (
                <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.2)", fontFamily:C.font }}>{files.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Storage meter */}
        <div style={{ padding:"12px 14px", borderTop:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <StorageMeter used={usedBytes} total={limitBytes}/>
            <div>
              <p style={{ fontSize:"11px", fontWeight:"700", color:C.white, margin:"0 0 2px", fontFamily:C.font }}>Storage</p>
              <p style={{ fontSize:"10px", color:C.muted, margin:"0 0 6px", fontFamily:C.font }}>{formatBytes(usedBytes)} / {limitMB} MB</p>
              <a href="/pricing" style={{ fontSize:"10px", color:"#a78bfa", fontFamily:C.font, fontWeight:"600", textDecoration:"none" }}>Upgrade ↗</a>
            </div>
          </div>
          {/* Storage bar */}
          <div style={{ marginTop:"10px", height:"3px", borderRadius:"99px", background:"rgba(255,255,255,0.08)", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${Math.min(100,(usedBytes/limitBytes)*100)}%`, background:"linear-gradient(90deg,#7c3aed,#a78bfa)", borderRadius:"99px", transition:"width 0.5s ease" }}/>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Top bar */}
        <div style={{ padding:"12px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:"12px", flexShrink:0 }}>
          {/* Search */}
          <div style={{ flex:1, maxWidth:"400px", position:"relative" }}>
            <svg style={{ position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search files..."
              style={{ width:"100%", paddingLeft:"32px", padding:"8px 12px 8px 32px", borderRadius:"10px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.04)", color:C.white, fontSize:"13px", fontFamily:C.font, outline:"none", boxSizing:"border-box" }}/>
          </div>

          <div style={{ display:"flex", gap:"4px", marginLeft:"auto" }}>
            <button className="vault-icon-btn" onClick={()=>setViewMode("grid")}
              style={{ width:"32px", height:"32px", borderRadius:"8px", border:`1px solid ${viewMode==="grid"?"rgba(124,58,237,0.4)":C.border}`, background:viewMode==="grid"?"rgba(124,58,237,0.12)":"transparent", color:viewMode==="grid"?"#a78bfa":C.muted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>
            <button className="vault-icon-btn" onClick={()=>setViewMode("list")}
              style={{ width:"32px", height:"32px", borderRadius:"8px", border:`1px solid ${viewMode==="list"?"rgba(124,58,237,0.4)":C.border}`, background:viewMode==="list"?"rgba(124,58,237,0.12)":"transparent", color:viewMode==="list"?"#a78bfa":C.muted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"20px" }}>

          {/* Category cards row */}
          {activeCat === "all" && !search && (
            <div style={{ marginBottom:"24px" }}>
              <p style={{ fontSize:"12px", fontWeight:"700", color:"rgba(255,255,255,0.5)", letterSpacing:"1px", textTransform:"uppercase", fontFamily:C.font, marginBottom:"12px" }}>Categories</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"10px" }}>
                {CATS.filter(c=>c.id!=="all").map(cat => (
                  <button key={cat.id} onClick={()=>setActiveCat(cat.id)}
                    style={{ padding:"14px 12px", borderRadius:"14px", border:`1px solid ${cat.color}25`, background:cat.bg, cursor:"pointer", textAlign:"left", transition:"all 0.2s", display:"flex", flexDirection:"column", gap:"6px" }}
                    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 24px ${cat.color}20`;}}
                    onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                    <span style={{ fontSize:"22px" }}>{cat.icon}</span>
                    <span style={{ fontSize:"12px", fontWeight:"700", color:C.white, fontFamily:C.font }}>{cat.label}</span>
                    <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.3)", fontFamily:C.font }}>{catCounts[cat.id] || 0} files</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent files */}
          {activeCat === "all" && !search && recent.length > 0 && (
            <div style={{ marginBottom:"24px" }}>
              <p style={{ fontSize:"12px", fontWeight:"700", color:"rgba(255,255,255,0.5)", letterSpacing:"1px", textTransform:"uppercase", fontFamily:C.font, marginBottom:"12px" }}>Recent Files</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"10px" }}>
                {recent.map(file => (
                  <div key={file.id} onClick={()=>setPreview(file)}
                    style={{ borderRadius:"12px", border:`1px solid ${C.border}`, background:C.card, overflow:"hidden", cursor:"pointer", transition:"all 0.2s" }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(124,58,237,0.3)";e.currentTarget.style.transform="translateY(-2px)";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="none";}}>
                    {file.type?.startsWith("image/") && file.data ? (
                      <img src={file.data} alt={file.name} style={{ width:"100%", height:"80px", objectFit:"cover", display:"block" }}/>
                    ) : (
                      <div style={{ height:"80px", background:getCatInfo(file.category).bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px" }}>
                        {getCatInfo(file.category).icon}
                      </div>
                    )}
                    <div style={{ padding:"8px 10px" }}>
                      <p style={{ fontSize:"11px", fontWeight:"600", color:C.white, margin:"0 0 2px", fontFamily:C.font, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</p>
                      <p style={{ fontSize:"10px", color:C.muted, margin:0, fontFamily:C.font }}>{timeAgo(file.addedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All files / filtered */}
          <div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
              <p style={{ fontSize:"12px", fontWeight:"700", color:"rgba(255,255,255,0.5)", letterSpacing:"1px", textTransform:"uppercase", fontFamily:C.font, margin:0 }}>
                {activeCat === "all" ? "All Files" : CATS.find(c=>c.id===activeCat)?.label} · {filtered.length}
              </p>
            </div>

            {files.length === 0 ? (
              /* Empty state */
              <div className="vault-upload-zone"
                onDragOver={e=>{e.preventDefault();setDragOver(true)}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={e=>{e.preventDefault();setDragOver(false);addFiles(e.dataTransfer.files)}}
                onClick={()=>fileInputRef.current?.click()}
                style={{ padding:"60px 24px", border:`2px dashed ${dragOver?"rgba(124,58,237,0.6)":"rgba(255,255,255,0.1)"}`, borderRadius:"20px", background:dragOver?"rgba(124,58,237,0.06)":"rgba(255,255,255,0.02)", cursor:"pointer", textAlign:"center", transition:"all 0.2s" }}>
                <div style={{ fontSize:"48px", marginBottom:"16px" }}>🔒</div>
                <h3 style={{ fontSize:"18px", fontWeight:"800", color:C.white, margin:"0 0 8px", fontFamily:C.font }}>Your Vault is empty</h3>
                <p style={{ fontSize:"13px", color:C.muted, margin:"0 0 20px", lineHeight:1.7, fontFamily:C.font }}>Upload scripts, images, videos, PDFs and any creator files. Everything in one secure place.</p>
                <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", padding:"10px 22px", borderRadius:"99px", background:"rgba(124,58,237,0.15)", border:"1px solid rgba(124,58,237,0.3)", color:"#a78bfa", fontSize:"13px", fontWeight:"700", fontFamily:C.font }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Upload or Drop Files
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 0" }}>
                <p style={{ fontSize:"32px", marginBottom:"8px" }}>🔍</p>
                <p style={{ fontSize:"14px", color:C.muted, fontFamily:C.font }}>No files found in this category.</p>
              </div>
            ) : viewMode === "grid" ? (
              /* Grid view */
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:"12px" }}>
                {filtered.map(file => (
                  <div key={file.id} className="vault-file"
                    style={{ borderRadius:"14px", border:`1px solid ${C.border}`, background:C.card, overflow:"hidden", cursor:"pointer", transition:"all 0.2s" }}>
                    <div onClick={()=>setPreview(file)}>
                      {file.type?.startsWith("image/") && file.data ? (
                        <img src={file.data} alt={file.name} style={{ width:"100%", height:"110px", objectFit:"cover", display:"block" }}/>
                      ) : (
                        <div style={{ height:"110px", background:getCatInfo(file.category).bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"36px" }}>
                          {getCatInfo(file.category).icon}
                        </div>
                      )}
                    </div>
                    <div style={{ padding:"10px 12px" }}>
                      <p style={{ fontSize:"12px", fontWeight:"600", color:C.white, margin:"0 0 2px", fontFamily:C.font, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</p>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <span style={{ fontSize:"10px", color:C.muted, fontFamily:C.font }}>{formatBytes(file.size)}</span>
                        <div style={{ display:"flex", gap:"2px" }}>
                          <button onClick={()=>starFile(file.id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"13px", opacity:file.starred?1:0.4, padding:"2px" }}>{file.starred?"⭐":"☆"}</button>
                          <button onClick={()=>downloadFile(file)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.4)", padding:"2px" }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          </button>
                          <button onClick={()=>deleteFile(file.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(239,68,68,0.5)", padding:"2px", fontSize:"12px" }}>✕</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List view */
              <div style={{ display:"flex", flexDirection:"column", gap:"4px" }}>
                {/* Header */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 100px 100px 80px", gap:"12px", padding:"6px 12px", marginBottom:"4px" }}>
                  {["Name","Type","Size","Added"].map(h => (
                    <span key={h} style={{ fontSize:"10px", fontWeight:"700", color:"rgba(255,255,255,0.2)", textTransform:"uppercase", letterSpacing:"1px", fontFamily:C.font }}>{h}</span>
                  ))}
                </div>
                {filtered.map(file => (
                  <div key={file.id} className="vault-file-list"
                    style={{ display:"grid", gridTemplateColumns:"1fr 100px 100px 80px", gap:"12px", padding:"10px 12px", borderRadius:"10px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.02)", alignItems:"center", cursor:"pointer", transition:"all 0.15s" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px" }} onClick={()=>setPreview(file)}>
                      <FileIcon cat={file.category} size={32}/>
                      <div style={{ minWidth:0 }}>
                        <p style={{ fontSize:"13px", fontWeight:"600", color:C.white, margin:0, fontFamily:C.font, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.name}</p>
                        <p style={{ fontSize:"10px", color:C.muted, margin:0, fontFamily:C.font }}>{timeAgo(file.addedAt)}</p>
                      </div>
                    </div>
                    <span style={{ fontSize:"11px", color:C.muted, fontFamily:C.font }}>{getCatInfo(file.category).label}</span>
                    <span style={{ fontSize:"11px", color:C.muted, fontFamily:C.font }}>{formatBytes(file.size)}</span>
                    <div style={{ display:"flex", gap:"4px" }}>
                      <button onClick={()=>starFile(file.id)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"13px", opacity:file.starred?1:0.3, padding:"2px" }}>{file.starred?"⭐":"☆"}</button>
                      <button onClick={()=>downloadFile(file)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.3)", padding:"2px" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </button>
                      <button onClick={()=>deleteFile(file.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(239,68,68,0.4)", padding:"2px", fontSize:"12px" }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File Preview Panel */}
      {preview && (
        <div style={{ width:"280px", flexShrink:0, borderLeft:`1px solid ${C.border}`, background:C.panel, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          <div style={{ padding:"14px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:"12px", fontWeight:"700", color:C.white, fontFamily:C.font }}>Preview</span>
            <button onClick={()=>setPreview(null)} style={{ background:"rgba(255,255,255,0.06)", border:"none", color:C.muted, width:"24px", height:"24px", borderRadius:"6px", cursor:"pointer", fontSize:"14px" }}>✕</button>
          </div>
          <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>
            {/* Preview */}
            {preview.type?.startsWith("image/") && preview.data ? (
              <img src={preview.data} alt={preview.name} style={{ width:"100%", borderRadius:"10px", marginBottom:"14px", display:"block" }}/>
            ) : (
              <div style={{ height:"140px", borderRadius:"10px", background:getCatInfo(preview.category).bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"48px", marginBottom:"14px" }}>
                {getCatInfo(preview.category).icon}
              </div>
            )}

            {/* File info */}
            <p style={{ fontSize:"14px", fontWeight:"700", color:C.white, margin:"0 0 4px", fontFamily:C.font, wordBreak:"break-all" }}>{preview.name}</p>
            <p style={{ fontSize:"11px", color:C.muted, margin:"0 0 16px", fontFamily:C.font }}>{formatBytes(preview.size)} · {getCatInfo(preview.category).label}</p>

            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {[
                ["Type", preview.type || "Unknown"],
                ["Size", formatBytes(preview.size)],
                ["Added", new Date(preview.addedAt).toLocaleDateString("en-IN", {day:"numeric",month:"short",year:"numeric"})],
                ["Source", preview.source || "upload"],
              ].map(([k, v]) => (
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 10px", borderRadius:"8px", background:"rgba(255,255,255,0.03)" }}>
                  <span style={{ fontSize:"11px", color:C.muted, fontFamily:C.font }}>{k}</span>
                  <span style={{ fontSize:"11px", color:C.white, fontFamily:C.font, maxWidth:"140px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textAlign:"right" }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:"6px", marginTop:"16px" }}>
              <button onClick={()=>downloadFile(preview)}
                style={{ width:"100%", padding:"9px", borderRadius:"99px", border:"none", background:"linear-gradient(135deg,#7c3aed,#9b5cf6)", color:"#fff", fontSize:"12px", fontWeight:"700", cursor:"pointer", fontFamily:C.font, display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download
              </button>
              <button onClick={()=>{starFile(preview.id);setPreview(f=>({...f,starred:!f.starred}))}}
                style={{ width:"100%", padding:"9px", borderRadius:"99px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.04)", color:C.muted, fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:C.font }}>
                {preview.starred ? "★ Unstar" : "☆ Star"}
              </button>
              <button onClick={()=>deleteFile(preview.id)}
                style={{ width:"100%", padding:"9px", borderRadius:"99px", border:"1px solid rgba(239,68,68,0.2)", background:"rgba(239,68,68,0.06)", color:"rgba(239,68,68,0.7)", fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:C.font }}>
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
