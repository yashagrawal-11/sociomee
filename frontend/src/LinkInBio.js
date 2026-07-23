/* eslint-disable */
import React, { useState, useEffect } from "react";

const BASE = window.location.hostname === "localhost" ? "http://localhost:8000" : "/api";

const s = {
  wrap: { fontFamily:"Poppins,sans-serif", color:"#fff", maxWidth:"560px", margin:"0 auto" },
  label: { fontSize:"12px", fontWeight:"600", color:"rgba(255,255,255,0.5)", marginBottom:"6px", display:"block", letterSpacing:"0.5px", textTransform:"uppercase" },
  input: { width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", padding:"12px 14px", color:"#fff", fontSize:"13px", fontFamily:"Poppins,sans-serif", outline:"none", marginBottom:"16px", boxSizing:"border-box" },
  btn: { width:"100%", padding:"13px", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.12)", background:"rgba(255,255,255,0.07)", color:"#fff", fontSize:"13px", fontWeight:"700", cursor:"pointer", fontFamily:"Poppins,sans-serif", transition:"all 0.2s" },
  linkRow: { display:"flex", gap:"8px", alignItems:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"10px", padding:"10px 12px", marginBottom:"8px" },
};

export default function LinkInBio({ user }) {
  const [handle, setHandle] = useState("");
  const [handleStatus, setHandleStatus] = useState(null); // null | "checking" | "available" | "taken" | "invalid"
  const [name, setName] = useState(user?.name || user?.display_name || "");
  const [bio, setBio] = useState("");
  const [links, setLinks] = useState([{ title:"", url:"", emoji:"" }]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [bioUrl, setBioUrl] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.user_id) return;
    fetch(`${BASE}/bio/me/${user.user_id}`, { credentials:"include" })
      .then(r => r.json())
      .then(d => {
        if (d.exists) {
          setHandle(d.handle || "");
          setName(d.name || "");
          setBio(d.bio || "");
          setLinks(d.links?.length ? d.links : [{ title:"", url:"", emoji:"" }]);
          setBioUrl(`https://sociomeeai.com/bio/${d.handle}`);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [user]);

  const checkHandle = async (h) => {
    if (!h || h.length < 3) { setHandleStatus("invalid"); return; }
    setHandleStatus("checking");
    try {
      const r = await fetch(`${BASE}/bio/check-handle/${h}`, { credentials:"include" });
      const d = await r.json();
      setHandleStatus(d.available ? "available" : "taken");
      if (!d.available && d.reason) setError(d.reason);
    } catch { setHandleStatus(null); }
  };

  const addLink = () => setLinks(l => [...l, { title:"", url:"", emoji:"" }]);
  const removeLink = (i) => setLinks(l => l.filter((_,idx) => idx !== i));
  const updateLink = (i, field, val) => setLinks(l => l.map((item, idx) => idx === i ? {...item, [field]: val} : item));

  const save = async () => {
    setError("");
    if (!handle || handleStatus === "taken" || handleStatus === "invalid") { setError("Please choose a valid, available handle."); return; }
    if (!name.trim()) { setError("Name is required."); return; }
    const validLinks = links.filter(l => l.title.trim() && l.url.trim());
    if (!validLinks.length) { setError("Add at least one link."); return; }

    setSaving(true);
    try {
      const r = await fetch(`${BASE}/bio/save`, {
        method:"POST", credentials:"include",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          user_id: user?.user_id || "",
          user_email: user?.email || "",
          handle, name, bio, links: validLinks
        })
      });
      const d = await r.json();
      if (d.success) {
        setBioUrl(d.url);
        setSaved(true);
      } else {
        setError(d.detail || "Failed to save. Try again.");
      }
    } catch { setError("Network error. Try again."); }
    setSaving(false);
  };

  if (!loaded) return <div style={{textAlign:"center",padding:"40px",color:"rgba(255,255,255,0.4)"}}>Loading...</div>;

  if (saved) return (
    <div style={{...s.wrap, textAlign:"center", padding:"32px 0"}}>
      <div style={{fontSize:"44px",marginBottom:"16px"}}>🔗</div>
      <div style={{fontSize:"18px",fontWeight:"800",color:"#fff",marginBottom:"8px"}}>Your Link in Bio is live!</div>
      <div style={{fontSize:"13px",color:"rgba(255,255,255,0.5)",marginBottom:"24px"}}>Share this link in your Instagram bio</div>
      <div style={{background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.25)",borderRadius:"12px",padding:"16px 20px",marginBottom:"20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px"}}>
        <span style={{fontSize:"14px",fontWeight:"700",color:"#a78bfa",wordBreak:"break-all"}}>{bioUrl}</span>
        <button onClick={()=>navigator.clipboard.writeText(bioUrl)} style={{flexShrink:0,padding:"6px 14px",borderRadius:"8px",border:"1px solid rgba(124,58,237,0.3)",background:"rgba(124,58,237,0.15)",color:"#a78bfa",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"Poppins,sans-serif"}}>Copy</button>
      </div>
      <a href={bioUrl} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginBottom:"16px",color:"rgba(255,255,255,0.5)",fontSize:"13px"}}>Preview your page →</a>
      <br/>
      <button onClick={()=>setSaved(false)} style={{...s.btn,width:"auto",padding:"10px 24px",marginTop:"8px"}}>Edit Links</button>
    </div>
  );

  return (
    <div style={s.wrap}>
      <div style={{marginBottom:"24px"}}>
        <div style={{fontSize:"18px",fontWeight:"800",color:"#fff",marginBottom:"4px"}}>Link in Bio</div>
        <div style={{fontSize:"13px",color:"rgba(255,255,255,0.4)"}}>One link for all your links. Put it in your Instagram bio.</div>
      </div>

      <label style={s.label}>Your Handle <span style={{color:"rgba(255,255,255,0.3)"}}>· sociomeeai.com/bio/</span></label>
      <div style={{position:"relative",marginBottom:"16px"}}>
        <input
          style={{...s.input, marginBottom:0, paddingRight:"90px", borderColor: handleStatus==="available"?"rgba(16,185,129,0.5)":handleStatus==="taken"?"rgba(239,68,68,0.5)":"rgba(255,255,255,0.1)"}}
          placeholder="yourname"
          value={handle}
          onChange={e=>{setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,""));setHandleStatus(null);}}
          onBlur={()=>checkHandle(handle)}
        />
        <div style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",fontSize:"11px",fontWeight:"700",color:handleStatus==="available"?"#10b981":handleStatus==="taken"?"#ef4444":handleStatus==="checking"?"rgba(255,255,255,0.4)":"rgba(255,255,255,0.2)"}}>
          {handleStatus==="available"?"✓ Available":handleStatus==="taken"?"✗ Taken":handleStatus==="checking"?"...":""}
        </div>
      </div>

      <label style={s.label}>Display Name</label>
      <input style={s.input} placeholder="Your Name" value={name} onChange={e=>setName(e.target.value)}/>

      <label style={s.label}>Bio <span style={{color:"rgba(255,255,255,0.3)"}}>· optional</span></label>
      <input style={s.input} placeholder="Creator • Filmmaker • Based in Mumbai" value={bio} onChange={e=>setBio(e.target.value)}/>

      <label style={s.label}>Your Links <span style={{color:"rgba(255,255,255,0.3)"}}>· up to 20</span></label>
      {links.map((link, i) => (
        <div key={i} style={s.linkRow}>
          <input style={{width:"36px",background:"transparent",border:"none",outline:"none",color:"#fff",fontSize:"18px",textAlign:"center",cursor:"text",fontFamily:"Poppins,sans-serif"}} placeholder="🔗" value={link.emoji} onChange={e=>updateLink(i,"emoji",e.target.value)} maxLength={2}/>
          <input style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#fff",fontSize:"13px",fontFamily:"Poppins,sans-serif"}} placeholder="Title (e.g. My YouTube)" value={link.title} onChange={e=>updateLink(i,"title",e.target.value)}/>
          <input style={{flex:2,background:"transparent",border:"none",borderLeft:"1px solid rgba(255,255,255,0.08)",paddingLeft:"10px",outline:"none",color:"rgba(255,255,255,0.6)",fontSize:"12px",fontFamily:"Poppins,sans-serif"}} placeholder="https://..." value={link.url} onChange={e=>updateLink(i,"url",e.target.value)}/>
          {links.length > 1 && <button onClick={()=>removeLink(i)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.25)",cursor:"pointer",fontSize:"16px",padding:"0 4px",lineHeight:1}}>×</button>}
        </div>
      ))}
      {links.length < 20 && (
        <button onClick={addLink} style={{width:"100%",padding:"10px",borderRadius:"10px",border:"1px dashed rgba(255,255,255,0.12)",background:"transparent",color:"rgba(255,255,255,0.35)",fontSize:"13px",fontWeight:"600",cursor:"pointer",fontFamily:"Poppins,sans-serif",marginBottom:"16px"}}>+ Add Link</button>
      )}

      {error && <div style={{color:"#f87171",fontSize:"13px",marginBottom:"12px"}}>{error}</div>}

      <button style={s.btn} onClick={save} disabled={saving}>
        {saving ? "Saving... (1 credit)" : bioUrl ? "Update Link in Bio (1 credit)" : "Create Link in Bio (1 credit)"}
      </button>

      {bioUrl && (
        <div style={{marginTop:"12px",textAlign:"center"}}>
          <a href={bioUrl} target="_blank" rel="noopener noreferrer" style={{color:"rgba(255,255,255,0.35)",fontSize:"12px",textDecoration:"none"}}>
            Preview: {bioUrl}
          </a>
        </div>
      )}
    </div>
  );
}
