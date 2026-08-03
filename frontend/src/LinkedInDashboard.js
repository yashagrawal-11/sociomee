import React, { useState, useEffect } from "react";
const BASE = process.env.REACT_APP_API_URL || "https://sociomeeai.com/api";
const C = {
  ink:"#f5f5f7", muted:"rgba(255,255,255,0.4)", glass:"rgba(255,255,255,0.02)",
  hairline:"rgba(255,255,255,0.07)", success:"#34d399", danger:"#f87171", warn:"#fbbf24",
};
function Skeleton({ h=48, r=12 }) {
  return <div style={{ height:h, borderRadius:r, background:"rgba(255,255,255,0.05)", animation:"skpulse 1.4s ease-in-out infinite" }}/>;
}
function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ padding:"7px 16px", borderRadius:99, border:`1.5px solid ${active?"rgba(255,255,255,0.25)":C.hairline}`, background:active?"rgba(255,255,255,0.08)":"transparent", color:active?"#f5f5f7":C.muted, fontWeight:700, fontSize:11.5, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", whiteSpace:"nowrap" }}>
      {label}
    </button>
  );
}
function LIMiniCalendar({ value, onChange }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(value || today);
  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  const firstDay = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const isPast = d => { const c=new Date(year,month,d); c.setHours(23,59,59,999); return c<new Date(); };
  const isSelected = d => value && value.getFullYear()===year && value.getMonth()===month && value.getDate()===d;
  const cells = [];
  for(let i=0;i<firstDay;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);
  return (
    <div style={{ background:C.glass, border:`1.5px solid ${C.hairline}`, borderRadius:14, padding:16, maxWidth:320 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <button type="button" onClick={()=>setViewDate(new Date(year,month-1,1))} style={{ background:"transparent",border:"none",color:C.ink,fontSize:16,cursor:"pointer",padding:"4px 10px" }}>‹</button>
        <span style={{ fontSize:13, fontWeight:700, color:C.ink }}>{viewDate.toLocaleString("default",{month:"long"})} {year}</span>
        <button type="button" onClick={()=>setViewDate(new Date(year,month+1,1))} style={{ background:"transparent",border:"none",color:C.ink,fontSize:16,cursor:"pointer",padding:"4px 10px" }}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:6 }}>
        {["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{ textAlign:"center",fontSize:10,fontWeight:700,color:C.muted,padding:"4px 0" }}>{d}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
        {cells.map((d,i)=>d===null?<div key={i}/>:(
          <button key={i} type="button" disabled={isPast(d)} onClick={()=>onChange(new Date(year,month,d,value?.getHours()??9,value?.getMinutes()??0))}
            style={{ aspectRatio:"1",borderRadius:8,border:"none",fontSize:12,fontFamily:"inherit",cursor:isPast(d)?"not-allowed":"pointer",background:isSelected(d)?"rgba(255,255,255,0.15)":"transparent",color:isPast(d)?C.muted:(isSelected(d)?"#fff":C.ink),fontWeight:isSelected(d)?700:500,opacity:isPast(d)?0.3:1 }}>{d}</button>
        ))}
      </div>
    </div>
  );
}
function LITimePicker({ value, onChange }) {
  const h24=value?value.getHours():9, m=value?value.getMinutes():0;
  const h12=((h24%12)||12), ampm=h24>=12?"PM":"AM";
  const setTime=(newH12,newM,newAmpm)=>{ let h=newH12%12; if(newAmpm==="PM")h+=12; const b=value||new Date(); onChange(new Date(b.getFullYear(),b.getMonth(),b.getDate(),h,newM)); };
  const sel={ padding:"10px 12px",borderRadius:10,border:`1.5px solid ${C.hairline}`,background:C.glass,color:C.ink,fontSize:13,fontFamily:"inherit",outline:"none" };
  return (
    <div style={{ display:"flex",gap:8,alignItems:"center" }}>
      <select value={h12} onChange={e=>setTime(Number(e.target.value),m,ampm)} style={sel}>{[...Array(12)].map((_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select>
      <span style={{ color:C.muted }}>:</span>
      <select value={m} onChange={e=>setTime(h12,Number(e.target.value),ampm)} style={sel}>{[0,15,30,45].map(mm=><option key={mm} value={mm}>{String(mm).padStart(2,"0")}</option>)}</select>
      <select value={ampm} onChange={e=>setTime(h12,m,e.target.value)} style={sel}><option>AM</option><option>PM</option></select>
    </div>
  );
}
function LinkedInDashboard({ user }) {
  const userId = user?.user_id || user?.id || localStorage.getItem("sociomee_user_id") || "";
  const [status,      setStatus     ] = useState("checking");
  const [profile,     setProfile    ] = useState(null);
  const [tab,         setTab        ] = useState("analytics");
  const [text,        setText       ] = useState("");
  const [imgUrl,      setImgUrl     ] = useState("");
  const [imgPreview,  setImgPreview ] = useState("");
  const [imgLoading,  setImgLoading ] = useState(false);
  const [urlShare,    setUrlShare   ] = useState("");
  const [visibility,  setVisibility ] = useState("PUBLIC");
  const [visOpen,     setVisOpen    ] = useState(false);
  const [posting,     setPosting    ] = useState(false);
  const [postMsg,     setPostMsg    ] = useState("");
  const [schedText,   setSchedText  ] = useState("");
  const [schedImg,    setSchedImg   ] = useState("");
  const [schedImgPrev,setSchedImgPrev]=useState("");
  const [schedUrl,    setSchedUrl   ] = useState("");
  const [schedVis,    setSchedVis   ] = useState("PUBLIC");
  const [schedVisOpen,setSchedVisOpen]=useState(false);
  const [schedWhen,   setSchedWhen  ] = useState(null);
  const [schedLoading,setSchedLoading]=useState(false);
  const [schedMsg,    setSchedMsg   ] = useState("");
  const [schedJobs,   setSchedJobs  ] = useState([]);
  const [history,     setHistory    ] = useState([]);

  const HISTORY_KEY = "sociomee_li_post_history_"+userId;

  useEffect(() => {
    if (!userId) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")==="true") window.history.replaceState({},"",window.location.pathname);
    fetch(BASE+"/linkedin/status?user_id="+userId)
      .then(r=>r.json())
      .then(d=>{ if(d.connected){setProfile(d);setStatus("connected");}else setStatus("disconnected"); })
      .catch(()=>setStatus("disconnected"));
    try { setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]")); } catch {}
  }, [userId]);

  useEffect(() => {
    if (status==="connected" && tab==="schedule") loadJobs();
  }, [tab, status]);

  const loadJobs = () => {
    fetch(BASE+"/linkedin/scheduled?user_id="+userId)
      .then(r=>r.json()).then(d=>{ if(d.jobs) setSchedJobs(d.jobs); }).catch(()=>{});
  };

  const handleImageUpload = async (file, isSchedule=false) => {
    if (!file) return;
    if (isSchedule) {} else setImgLoading(true);
    const fd = new FormData(); fd.append("file", file);
    try {
      const r = await fetch(BASE+"/linkedin/upload-media?user_id="+userId,{method:"POST",body:fd});
      const d = await r.json();
      if (d.url) {
        if (isSchedule) { setSchedImg(d.url); setSchedImgPrev(URL.createObjectURL(file)); }
        else { setImgUrl(d.url); setImgPreview(URL.createObjectURL(file)); }
      }
    } catch(e) {}
    if (!isSchedule) setImgLoading(false);
  };

  const handlePost = async () => {
    if (!text.trim()) return;
    setPosting(true); setPostMsg("");
    try {
      const r = await fetch(BASE+"/linkedin/post",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:userId,text,image_url:imgUrl,url_share:urlShare,visibility})});
      const d = await r.json();
      if (d.success) {
        setPostMsg("Posted successfully!");
        const entry = {text, date:new Date().toISOString(), hasImage:!!imgUrl, hasUrl:!!urlShare};
        const updated = [entry,...history].slice(0,20);
        setHistory(updated);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        setText(""); setImgUrl(""); setImgPreview(""); setUrlShare("");
        setTimeout(()=>setPostMsg(""),3000);
      } else setPostMsg("Error: "+(d.error||"unknown"));
    } catch { setPostMsg("Network error"); }
    setPosting(false);
  };

  const handleSchedule = async () => {
    if (!schedText.trim() || !schedWhen) return;
    setSchedLoading(true); setSchedMsg("");
    try {
      const r = await fetch(BASE+"/linkedin/schedule",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:userId,text:schedText,scheduled_at:schedWhen.toISOString(),image_url:schedImg,url_share:schedUrl,visibility:schedVis})});
      const d = await r.json();
      if (d.ok) { setSchedMsg("Scheduled!"); setSchedText(""); setSchedImg(""); setSchedImgPrev(""); setSchedUrl(""); setSchedWhen(null); loadJobs(); setTimeout(()=>setSchedMsg(""),3000); }
      else setSchedMsg("Error: "+(d.error||"unknown"));
    } catch { setSchedMsg("Network error"); }
    setSchedLoading(false);
  };

  const statusColor = s => s==="done"?C.success:s==="error"?C.danger:s==="sending"?C.warn:C.muted;

  const VisDropdown = ({ value, open, setOpen, setValue }) => (
    <div style={{ position:"relative" }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:99,border:`1px solid ${C.hairline}`,background:C.glass,color:C.muted,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap" }}>
        {value==="PUBLIC"?"Anyone":"Connections only"}
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" style={{ transform:open?"rotate(180deg)":"none",transition:"transform 0.15s" }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && (
        <div style={{ position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:99,background:"rgba(18,18,18,0.97)",border:`1px solid ${C.hairline}`,borderRadius:12,backdropFilter:"blur(20px)",padding:4,minWidth:160,boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>
          {[["PUBLIC","Anyone"],["CONNECTIONS","Connections only"]].map(([val,label])=>(
            <button key={val} onClick={()=>{setValue(val);setOpen(false);}} style={{ display:"block",width:"100%",textAlign:"left",padding:"8px 12px",borderRadius:8,border:"none",background:value===val?"rgba(255,255,255,0.08)":"transparent",color:value===val?"#f5f5f7":"rgba(255,255,255,0.5)",fontSize:11.5,fontWeight:value===val?700:500,cursor:"pointer",fontFamily:"inherit" }}>{label}</button>
          ))}
        </div>
      )}
    </div>
  );

  if (status==="checking") return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"70vh",padding:24 }}>
      <div style={{ width:"100%",maxWidth:420,display:"flex",flexDirection:"column",gap:12 }}>
        <style>{`@keyframes skpulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
        <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:8 }}>
          <div style={{ width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,0.05)",animation:"skpulse 1.4s ease-in-out infinite",flexShrink:0 }}/>
          <div style={{ flex:1,display:"flex",flexDirection:"column",gap:6 }}>
            <div style={{ width:"40%",height:12,borderRadius:6,background:"rgba(255,255,255,0.05)",animation:"skpulse 1.4s ease-in-out infinite" }}/>
            <div style={{ width:"25%",height:10,borderRadius:6,background:"rgba(255,255,255,0.05)",animation:"skpulse 1.4s ease-in-out infinite" }}/>
          </div>
        </div>
        {[1,2,3].map(i=><Skeleton key={i}/>)}
      </div>
    </div>
  );

  if (status==="disconnected") return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"70vh",padding:24 }}>
      <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:16,textAlign:"center",background:"rgba(255,255,255,0.02)",border:`1px solid ${C.hairline}`,borderRadius:20,padding:"40px 32px",maxWidth:360,width:"100%" }}>
        <div style={{ width:64,height:64,borderRadius:"50%",background:"rgba(255,255,255,0.06)",border:"2px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <img src="/icons/linkedin.png" style={{ width:28,height:28,objectFit:"contain" }} alt="linkedin"/>
        </div>
        <h3 style={{ fontSize:16,fontWeight:900,color:C.ink,margin:0 }}>Connect LinkedIn</h3>
        <p style={{ fontSize:12.5,color:C.muted,lineHeight:1.6,maxWidth:280,margin:0 }}>Post text, images and articles to your LinkedIn feed.</p>
        <a href={BASE+"/linkedin/connect?user_id="+userId} style={{ display:"flex",alignItems:"center",gap:"8px",padding:"12px 24px",borderRadius:"12px",border:"none",background:"rgba(255,255,255,0.08)",color:"#fff",fontWeight:"800",fontSize:"14px",cursor:"pointer",fontFamily:"inherit",textDecoration:"none" }}>
          <img src="/icons/linkedin.png" style={{ width:16,height:16,objectFit:"contain" }} alt=""/> Connect LinkedIn
        </a>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", paddingBottom:20 }}>
      <style>{`@keyframes skpulse{0%,100%{opacity:0.4}50%{opacity:1}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Profile header */}
      <div style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:14,background:"rgba(255,255,255,0.02)",border:`1px solid ${C.hairline}`,marginBottom:14 }}>
        <div style={{ width:40,height:40,borderRadius:"50%",overflow:"hidden",flexShrink:0,background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center" }}>
          {profile?.picture
            ? <img src={`${BASE}/proxy-image?url=${encodeURIComponent(profile.picture)}`} style={{ width:"100%",height:"100%",objectFit:"cover" }} alt=""/>
            : <img src="/icons/linkedin.png" style={{ width:20,height:20,objectFit:"contain" }} alt="li"/>
          }
        </div>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:13,fontWeight:700,color:C.ink }}>{profile?.name||"Connected"}</div>
          <div style={{ fontSize:11,color:C.muted }}>{profile?.email||""}</div>
        </div>
        <button onClick={()=>fetch(BASE+"/linkedin/disconnect",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:userId})}).then(()=>{setStatus("disconnected");setProfile(null);})}
          style={{ padding:"6px 12px",borderRadius:99,border:`1px solid ${C.hairline}`,background:"transparent",color:C.muted,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Disconnect</button>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",gap:6,marginBottom:14,flexWrap:"nowrap",overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",paddingBottom:2 }}>
        {[["analytics","Analytics"],["post","Post"],["schedule","Schedule"],["history","Recent Posts"],["bulk","Bulk Schedule"]].map(([v,l])=>(
          <Tab key={v} label={l} active={tab===v} onClick={()=>setTab(v)} />
        ))}
      </div>

      {/* Post tab */}
      {tab==="post" && (
        <div style={{ background:"rgba(255,255,255,0.02)",border:`1px solid ${C.hairline}`,borderRadius:16,padding:20,display:"flex",flexDirection:"column",gap:12 }}>
          <div style={{ fontSize:11,fontWeight:800,letterSpacing:"1.3px",textTransform:"uppercase",color:C.muted }}>Create Post</div>
          <textarea value={text} onChange={e=>setText(e.target.value.slice(0,3000))} placeholder="What do you want to share?" rows={6}
            style={{ width:"100%",background:"rgba(255,255,255,0.03)",border:`1.5px solid ${C.hairline}`,borderRadius:12,padding:"12px 14px",color:C.ink,fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.7 }}/>

          {/* Image preview */}
          {imgPreview && (
            <div style={{ position:"relative",display:"inline-block" }}>
              <img src={imgPreview} alt="" style={{ maxHeight:160,maxWidth:"100%",borderRadius:10,border:`1px solid ${C.hairline}` }}/>
              <button onClick={()=>{setImgUrl("");setImgPreview("");}} style={{ position:"absolute",top:4,right:4,width:20,height:20,borderRadius:"50%",border:"none",background:"rgba(0,0,0,0.7)",color:"#fff",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>x</button>
            </div>
          )}

          {/* URL share input */}
          <input value={urlShare} onChange={e=>setUrlShare(e.target.value)} placeholder="Share a URL (optional — generates article preview)"
            style={{ width:"100%",padding:"9px 12px",borderRadius:10,border:`1.5px solid ${C.hairline}`,background:"rgba(255,255,255,0.03)",color:C.ink,fontSize:12,fontFamily:"inherit",outline:"none",boxSizing:"border-box" }}/>

          {/* Toolbar */}
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            {/* Image attach */}
            <label style={{ width:32,height:32,borderRadius:"50%",border:`1px solid ${C.hairline}`,background:"rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"center",cursor:imgLoading?"not-allowed":"pointer",flexShrink:0 }} title="Attach image">
              <input type="file" accept="image/*" style={{ display:"none" }} disabled={imgLoading} onChange={e=>handleImageUpload(e.target.files[0])} />
              {imgLoading
                ? <div style={{ width:14,height:14,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.1)",borderTopColor:"rgba(255,255,255,0.5)",animation:"spin 0.7s linear infinite" }}/>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              }
            </label>
            {/* Visibility */}
            <VisDropdown value={visibility} open={visOpen} setOpen={setVisOpen} setValue={setVisibility} />
            <span style={{ fontSize:11,color:text.length>2800?"#f87171":C.muted,fontWeight:600,marginLeft:"auto" }}>{text.length}/3000</span>
            <button onClick={handlePost} disabled={posting||!text.trim()}
              style={{ padding:"8px 20px",borderRadius:99,border:`1px solid ${C.hairline}`,background:(posting||!text.trim())?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.08)",color:"#f5f5f7",fontWeight:800,fontSize:12,cursor:(posting||!text.trim())?"not-allowed":"pointer",fontFamily:"inherit",opacity:(posting||!text.trim())?0.4:1,transition:"all 0.15s" }}>
              {posting?"Posting...":"Post to LinkedIn"}
            </button>
          </div>
          {postMsg && <div style={{ fontSize:12,color:postMsg.startsWith("Error")?"#f87171":"#34d399",fontWeight:600 }}>{postMsg}</div>}
        </div>
      )}

      {/* Schedule tab */}
      {tab==="schedule" && (
        <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
          <div style={{ background:"rgba(255,255,255,0.02)",border:`1px solid ${C.hairline}`,borderRadius:16,padding:20 }}>
            <div style={{ fontSize:11,fontWeight:800,letterSpacing:"1.3px",textTransform:"uppercase",color:C.muted,marginBottom:14 }}>Schedule a Post</div>
            <textarea value={schedText} onChange={e=>setSchedText(e.target.value.slice(0,3000))} placeholder="What do you want to share?" rows={5}
              style={{ width:"100%",background:"rgba(255,255,255,0.03)",border:`1.5px solid ${C.hairline}`,borderRadius:12,padding:"12px 14px",color:C.ink,fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.7,marginBottom:10 }}/>
            {schedImgPrev && (
              <div style={{ position:"relative",display:"inline-block",marginBottom:10 }}>
                <img src={schedImgPrev} alt="" style={{ maxHeight:120,maxWidth:"100%",borderRadius:10,border:`1px solid ${C.hairline}` }}/>
                <button onClick={()=>{setSchedImg("");setSchedImgPrev("");}} style={{ position:"absolute",top:4,right:4,width:20,height:20,borderRadius:"50%",border:"none",background:"rgba(0,0,0,0.7)",color:"#fff",fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>x</button>
              </div>
            )}
            <input value={schedUrl} onChange={e=>setSchedUrl(e.target.value)} placeholder="Share a URL (optional)"
              style={{ width:"100%",padding:"9px 12px",borderRadius:10,border:`1.5px solid ${C.hairline}`,background:"rgba(255,255,255,0.03)",color:C.ink,fontSize:12,fontFamily:"inherit",outline:"none",boxSizing:"border-box",marginBottom:12 }}/>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14 }}>
              <label style={{ width:32,height:32,borderRadius:"50%",border:`1px solid ${C.hairline}`,background:"rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0 }} title="Attach image">
                <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>handleImageUpload(e.target.files[0],true)} />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </label>
              <VisDropdown value={schedVis} open={schedVisOpen} setOpen={setSchedVisOpen} setValue={setSchedVis} />
            </div>
            <div style={{ marginBottom:12 }}><LIMiniCalendar value={schedWhen} onChange={setSchedWhen}/></div>
            <div style={{ marginBottom:14 }}><LITimePicker value={schedWhen} onChange={setSchedWhen}/></div>
            <button onClick={handleSchedule} disabled={schedLoading||!schedText.trim()||!schedWhen}
              style={{ width:"100%",padding:12,borderRadius:99,border:`1px solid ${C.hairline}`,background:(schedLoading||!schedText.trim()||!schedWhen)?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.08)",color:"#fff",fontWeight:800,fontSize:13,cursor:(schedLoading||!schedText.trim()||!schedWhen)?"not-allowed":"pointer",fontFamily:"inherit",opacity:(schedLoading||!schedText.trim()||!schedWhen)?0.4:1 }}>
              {schedLoading?"Scheduling...":"Schedule Post"}
            </button>
            {schedMsg && <div style={{ marginTop:8,fontSize:12,color:schedMsg.startsWith("Error")?C.danger:C.success,fontWeight:600 }}>{schedMsg}</div>}
          </div>

          {/* Scheduled jobs */}
          <div>
            <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:10 }}>Scheduled Posts ({schedJobs.length})</div>
            {schedJobs.length===0
              ? <div style={{ fontSize:12,color:C.muted }}>No scheduled posts yet.</div>
              : schedJobs.map(j=>(
                <div key={j.job_id} style={{ background:"rgba(255,255,255,0.02)",border:`1.5px solid ${statusColor(j.status)}44`,borderRadius:12,padding:12,marginBottom:8 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                    <span style={{ fontSize:11,fontWeight:800,color:statusColor(j.status),textTransform:"uppercase" }}>{j.status}</span>
                    <span style={{ fontSize:10,color:C.muted }}>{new Date(j.scheduled_at).toLocaleString("en-IN")}</span>
                  </div>
                  <div style={{ fontSize:12,color:"rgba(255,255,255,0.7)",lineHeight:1.5 }}>{j.text.slice(0,120)}{j.text.length>120?"...":""}</div>
                  {j.error && <div style={{ fontSize:11,color:C.danger,marginTop:4 }}>{j.error}</div>}
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* History tab */}
      {tab==="analytics" && <LinkedInAnalytics history={history}/>}
      {tab==="history" && (
        <div>
          <div style={{ fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:12 }}>Recent Posts ({history.length})</div>
          {history.length===0
            ? <div style={{ fontSize:12,color:C.muted,padding:"20px 0" }}>Posts you send from here will show up in this history.</div>
            : history.map((h,i)=>(
              <div key={i} style={{ background:"rgba(255,255,255,0.02)",border:`1px solid ${C.hairline}`,borderRadius:12,padding:"12px 14px",marginBottom:8 }}>
                <div style={{ fontSize:12,color:"rgba(255,255,255,0.75)",lineHeight:1.6,whiteSpace:"pre-line" }}>{h.text.length>200?h.text.slice(0,200)+"...":h.text}</div>
                <div style={{ display:"flex",gap:8,marginTop:6,alignItems:"center" }}>
                  {h.hasImage && <span style={{ fontSize:9.5,color:C.muted,fontWeight:600,textTransform:"uppercase" }}>Image</span>}
                  {h.hasUrl && <span style={{ fontSize:9.5,color:C.muted,fontWeight:600,textTransform:"uppercase" }}>Article</span>}
                  <span style={{ fontSize:10,color:C.muted,marginLeft:"auto" }}>{new Date(h.date).toLocaleString("en-IN")}</span>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Bulk schedule tab */}
      {tab==="bulk" && (
        <div style={{ background:"rgba(255,255,255,0.02)",border:`1px solid ${C.hairline}`,borderRadius:16,padding:28,textAlign:"center" }}>
          <div style={{ fontSize:16,fontWeight:800,color:C.ink,marginBottom:8 }}>Bulk Schedule</div>
          <div style={{ fontSize:13,color:C.muted,lineHeight:1.7,maxWidth:400,margin:"0 auto 12px" }}>Schedule multiple LinkedIn posts at once with AI timing. Exclusive to Pro+ members.</div>
          <div style={{ fontSize:12,color:"rgba(255,255,255,0.25)",fontWeight:500 }}>Available soon for Pro+ members</div>
        </div>
      )}
    </div>
  );
}

function LinkedInAnalytics({ history }) {
  const C = { muted:"rgba(255,255,255,0.4)", success:"#34d399", danger:"#f87171", ink:"#f5f5f7", hairline:"rgba(255,255,255,0.08)" };
  const GC = ({ children, style={} }) => <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${C.hairline}`, borderRadius:16, padding:20, ...style }}>{children}</div>;

  const total = history.length;
  const now = new Date();
  const weekAgo = new Date(now - 7*24*60*60*1000);
  const twoWeeksAgo = new Date(now - 14*24*60*60*1000);
  const thisWeek = history.filter(h => new Date(h.date) >= weekAgo).length;
  const lastWeek = history.filter(h => new Date(h.date) >= twoWeeksAgo && new Date(h.date) < weekAgo).length;
  const weekChange = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : thisWeek > 0 ? 100 : 0;
  const withImage = history.filter(h => h.hasImage).length;
  const withUrl = history.filter(h => h.hasUrl).length;
  const textOnly = total - withImage - withUrl + history.filter(h => h.hasImage && h.hasUrl).length;

  // Daily posts last 30 days
  const daily = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0,10);
    daily.push({ date: key, posts: history.filter(h => h.date && h.date.slice(0,10) === key).length });
  }

  // Weekly trend 8 weeks
  const weekly = [];
  for (let i = 7; i >= 0; i--) {
    const wStart = new Date(now - (i+1)*7*24*60*60*1000);
    const wEnd = new Date(now - i*7*24*60*60*1000);
    const label = `W${8-i}`;
    weekly.push({ week: label, posts: history.filter(h => new Date(h.date) >= wStart && new Date(h.date) < wEnd).length });
  }

  const SparkLine = ({ pts, valueKey, color="rgba(255,255,255,0.7)", dashed=false }) => {
    const W=300, H=70, pad=8;
    const vals = pts.map(p => p[valueKey]);
    const maxV = Math.max(...vals, 1);
    const xs = pts.map((_,i) => pad + (i/(pts.length-1||1))*(W-pad*2));
    const ys = pts.map(v => H - pad - (v/maxV)*(H-pad*2));
    const path = pts.map((_,i) => `${i===0?"M":"L"}${xs[i]},${ys[i]}`).join(" ");
    const area = `${path} L${xs[xs.length-1]},${H} L${xs[0]},${H} Z`;
    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow:"visible", display:"block" }}>
        <defs>
          <linearGradient id={`liGrad${valueKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#liGrad${valueKey})`}/>
        <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dashed?"4 3":undefined}/>
        {pts.map((p,i) => p[valueKey]>0 && <circle key={i} cx={xs[i]} cy={ys[i]} r="3" fill="rgba(255,255,255,0.5)"/>)}
      </svg>
    );
  };

  if (total === 0) return (
    <GC style={{ textAlign:"center", padding:"40px 24px" }}>
      <div style={{ fontSize:14, fontWeight:700, color:C.ink, marginBottom:8 }}>No posts yet</div>
      <div style={{ fontSize:12, color:C.muted }}>Post from the Post tab to see your analytics here.</div>
    </GC>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }} className="li-stats-grid">
        {[
          { label:"TOTAL POSTS", value:total, sub:"all time" },
          { label:"THIS WEEK", value:thisWeek, sub:weekChange>=0?`+${weekChange}% vs last week`:`${weekChange}% vs last week`, subColor:weekChange>=0?C.success:C.danger },
          { label:"WITH IMAGE", value:withImage, sub:"posts with media" },
          { label:"WITH ARTICLE", value:withUrl, sub:"link posts" },
        ].map((s,i) => (
          <GC key={i} style={{ textAlign:"center" }}>
            <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:900, color:C.ink, marginBottom:4 }}>{s.value}</div>
            <div style={{ fontSize:11, color:s.subColor||C.muted }}>{s.sub}</div>
          </GC>
        ))}
      </div>

      <GC>
        <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"1px", marginBottom:4 }}>Posts Last 30 Days</div>
        <div style={{ fontSize:28, fontWeight:900, color:C.ink, marginBottom:12 }}>{daily.reduce((s,d)=>s+d.posts,0)}</div>
        <SparkLine pts={daily} valueKey="posts"/>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
          <span style={{ fontSize:10, color:C.muted }}>{daily[0]?.date?.slice(5)}</span>
          <span style={{ fontSize:10, color:C.muted }}>Today</span>
        </div>
      </GC>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }} className="li-half-grid">
        <GC>
          <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Weekly Trend (8 Weeks)</div>
          <SparkLine pts={weekly} valueKey="posts"/>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
            {weekly.map((w,i) => <span key={i} style={{ fontSize:9, color:C.muted, flex:1, textAlign:"center" }}>{w.week}</span>)}
          </div>
        </GC>
        <GC>
          <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Content Type</div>
          {[["Text Only", textOnly], ["With Image", withImage], ["With Article", withUrl]].map(([label, count],i) => (
            <div key={i} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:12, color:"rgba(255,255,255,0.8)", fontWeight:600 }}>{label}</span>
                <span style={{ fontSize:12, color:C.muted, fontWeight:600 }}>{count}</span>
              </div>
              <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:99, height:4, overflow:"hidden" }}>
                <div style={{ width:`${total>0?(count/total)*100:0}%`, height:"100%", background:"rgba(255,255,255,0.4)", borderRadius:99, transition:"width 0.4s" }}/>
              </div>
            </div>
          ))}
        </GC>
      </div>
      <style>{`
        @media(max-width:768px){
          .li-stats-grid{grid-template-columns:repeat(2,1fr)!important}
          .li-half-grid{grid-template-columns:1fr!important}
        }
      `}</style>
    </div>
  );
}

export default LinkedInDashboard;
