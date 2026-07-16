import { useState, useEffect } from "react";
const BASE = "https://sociomeeai.com/api";
const F = "'DM Sans','Syne',sans-serif";
const FH = "'Poppins',sans-serif";

function to12h(t){ if(!t)return ""; const [h,m]=t.split(":"); const hr=parseInt(h); return `${hr%12||12}:${m} ${hr>=12?"PM":"AM"}`; }
function fmt(ts) {
  return new Date(ts*1000).toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
}
function timeLeft(ts) {
  const diff = ts - Date.now()/1000;
  if(diff<0) return "Overdue";
  if(diff<3600) return `${Math.round(diff/60)}m left`;
  if(diff<86400) return `${Math.round(diff/3600)}h left`;
  return `${Math.round(diff/86400)}d left`;
}
function isOverdue(ts){ return ts < Date.now()/1000; }

export default function SocioMeeReminders({ user }) {
  const raw = user?.plan||user?.plan_label||"free";
  const plan = raw.toLowerCase().includes("premium")?"premium":raw.toLowerCase().includes("pro")?"pro":"free";
  const isPro = plan==="pro"||plan==="premium";
  const isPremium = plan==="premium";

  const [reminders,setReminders] = useState([]);
  const [loading,setLoading] = useState(true);
  const [task,setTask] = useState("");
  const [dateVal,setDateVal] = useState("");
  const [timeVal,setTimeVal] = useState("");
  const [busy,setBusy] = useState(false);
  const [err,setErr] = useState("");
  const [success,setSuccess] = useState("");
  const [filter,setFilter] = useState("upcoming");

  const userId = user?.id||user?.user_id||localStorage.getItem("sociomee_user_id")||"";

  useEffect(()=>{
    if(!userId||!isPro){setLoading(false);return;}
    fetch(`${BASE}/reminders?user_id=${userId}`,{credentials:"include"})
      .then(r=>r.json()).then(d=>setReminders(Array.isArray(d)?d:d.reminders||[])).catch(()=>{}).finally(()=>setLoading(false));
  },[userId,isPro]);

  const addReminder = async() => {
    if(!task.trim()||!dateVal||!timeVal){setErr("Please fill in all fields.");return;}
    const ts = Math.floor(new Date(`${dateVal}T${timeVal}`).getTime()/1000);
    if(ts<=Date.now()/1000){setErr("Please choose a future date and time.");return;}
    if(!isPremium&&reminders.length>=20){setErr("Pro plan allows up to 20 reminders. Upgrade to Pro+ for unlimited.");return;}
    setBusy(true);setErr("");
    try{
      const r = await fetch(`${BASE}/reminders`,{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({user_id:userId,task:task.trim(),scheduled_ts:ts})});
      const d = await r.json();
      if(d.reminder||d.id||d.success){
        setReminders(prev=>[...(d.reminder?[d.reminder]:[]),...(d.reminders||prev)]);
        setTask("");setDateVal("");setTimeVal("");
        setSuccess("Reminder set!");setTimeout(()=>setSuccess(""),3000);
        if("Notification" in window&&Notification.permission!=="granted") Notification.requestPermission();
      } else setErr(d.error||"Failed to set reminder.");
    }catch{setErr("Network error. Please try again.");}
    setBusy(false);
  };

  const deleteReminder = async(id)=>{
    try{
      await fetch(`${BASE}/reminders/${id}`,{method:"DELETE",credentials:"include",body:JSON.stringify({user_id:userId}),headers:{"Content-Type":"application/json"}});
      setReminders(prev=>prev.filter(r=>r.id!==id));
    }catch{}
  };

  const filtered = reminders.filter(r=>{
    if(filter==="upcoming") return !isOverdue(r.scheduled_ts);
    if(filter==="overdue") return isOverdue(r.scheduled_ts);
    return true;
  });

  const upcomingCount = reminders.filter(r=>!isOverdue(r.scheduled_ts)).length;
  const overdueCount = reminders.filter(r=>isOverdue(r.scheduled_ts)).length;

  if(!isPro) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"32px",fontFamily:F,background:"#080810"}}>
      <style>{`@keyframes skpulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"20px",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"24px",padding:"48px 40px",maxWidth:"400px",width:"100%",backdropFilter:"blur(24px)"}}>
        <div style={{width:"68px",height:"68px",borderRadius:"20px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </div>
        <div>
          <h3 style={{fontSize:"20px",fontWeight:"700",color:"#fff",margin:"0 0 10px",fontFamily:FH}}>Reminders</h3>
          <p style={{fontSize:"13px",color:"rgba(255,255,255,0.4)",lineHeight:1.8,margin:0}}>Set push reminders for posting, brand calls, deadlines, and more. Never miss a content moment.</p>
        </div>
        <div style={{width:"100%",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"14px",padding:"16px 20px",display:"flex",flexDirection:"column",gap:"10px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:"12px",color:"rgba(255,255,255,0.4)",fontFamily:F}}>Pro</span><span style={{fontSize:"12px",color:"rgba(255,255,255,0.8)",fontWeight:"600",fontFamily:F}}>Up to 20 reminders + push notifications</span></div>
          <div style={{height:"1px",background:"rgba(255,255,255,0.06)"}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:"12px",color:"rgba(255,255,255,0.4)",fontFamily:F}}>Pro+</span><span style={{fontSize:"12px",color:"rgba(255,255,255,0.8)",fontWeight:"600",fontFamily:F}}>Unlimited + festival auto-reminders</span></div>
        </div>
        <a href="/pricing" style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"13px 0",borderRadius:"12px",background:"#fff",color:"#080810",fontWeight:"700",fontSize:"14px",textDecoration:"none",width:"100%",fontFamily:F}}>Upgrade to Pro</a>
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#080810",fontFamily:F,padding:"32px 24px",overflowY:"auto"}}>
      <style>{`
        @keyframes skpulse{0%,100%{opacity:0.4}50%{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        .rb:hover{background:rgba(255,255,255,0.08)!important;color:#fff!important;}
        .rd:hover{color:rgba(239,68,68,0.7)!important;}
        input[type=date]::-webkit-calendar-picker-indicator,input[type=time]::-webkit-calendar-picker-indicator{filter:invert(0.4);cursor:pointer;}
        ::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:99px}
      `}</style>

      <div style={{width:"100%",maxWidth:"440px"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"28px"}}>
          <div style={{width:"36px",height:"36px",borderRadius:"10px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </div>
          <div>
            <h1 style={{fontSize:"18px",fontWeight:"800",color:"#fff",margin:0,fontFamily:FH}}>Reminders</h1>
            <p style={{fontSize:"11px",color:"rgba(255,255,255,0.35)",margin:0,fontFamily:F}}>{isPremium?"Unlimited reminders + festival auto-reminders":"Pro · Up to 20 reminders"}</p>
          </div>
          {!isPremium&&<div style={{marginLeft:"auto",fontSize:"10px",color:"rgba(255,255,255,0.3)",fontFamily:F}}>{reminders.length}/20 used</div>}
        </div>

        {/* Add reminder card */}
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"20px",padding:"24px 28px",marginBottom:"16px",backdropFilter:"blur(20px)"}}>
          <input value={task} onChange={e=>setTask(e.target.value)} placeholder="What should we remind you about? e.g. Post this on Instagram"
            onKeyDown={e=>e.key==="Enter"&&addReminder()}
            style={{width:"100%",background:"transparent",border:"none",borderBottom:"1px solid rgba(255,255,255,0.08)",padding:"0 0 12px",color:"#fff",fontSize:"14px",fontFamily:F,outline:"none",boxSizing:"border-box",marginBottom:"16px"}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}}>
            <div>
              <p style={{fontSize:"9px",color:"rgba(255,255,255,0.25)",fontFamily:F,margin:"0 0 5px",textTransform:"uppercase",letterSpacing:"0.8px"}}>Date</p>
              <input type="date" value={dateVal} onChange={e=>setDateVal(e.target.value)}
                style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"10px",padding:"9px 12px",color:"#fff",fontSize:"12px",fontFamily:F,outline:"none",boxSizing:"border-box",colorScheme:"dark"}}/>
            </div>
            <div>
              <p style={{fontSize:"9px",color:"rgba(255,255,255,0.25)",fontFamily:F,margin:"0 0 5px",textTransform:"uppercase",letterSpacing:"0.8px"}}>Time</p>
              <input type="time" value={timeVal} onChange={e=>setTimeVal(e.target.value)} step="60"
                style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"10px",padding:"9px 12px",color:"#fff",fontSize:"12px",fontFamily:F,outline:"none",boxSizing:"border-box",colorScheme:"dark"}}/>
            </div>
          </div>
          {err&&<p style={{fontSize:"11px",color:"#f87171",fontFamily:F,margin:"0 0 10px"}}>{err}</p>}
          {success&&<p style={{fontSize:"11px",color:"#4ade80",fontFamily:F,margin:"0 0 10px"}}>{success}</p>}
          <button onClick={addReminder} disabled={busy||!task.trim()||!dateVal||!timeVal}
            style={{width:"100%",padding:"11px",borderRadius:"11px",border:"none",background:busy||!task.trim()||!dateVal||!timeVal?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.1)",color:busy||!task.trim()||!dateVal||!timeVal?"rgba(255,255,255,0.3)":"#fff",fontSize:"13px",fontWeight:"700",cursor:busy||!task.trim()||!dateVal||!timeVal?"not-allowed":"pointer",fontFamily:F,transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
            {busy?<div style={{width:"14px",height:"14px",borderRadius:"50%",border:"2px solid rgba(255,255,255,0.2)",borderTopColor:"#fff",animation:"spin 0.8s linear infinite"}}/>:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>}
            Set Reminder
          </button>
        </div>

        {/* Premium festival auto-reminders badge */}
        {isPremium&&(
          <div style={{background:"rgba(110,231,183,0.05)",border:"1px solid rgba(110,231,183,0.12)",borderRadius:"12px",padding:"11px 14px",marginBottom:"20px",display:"flex",gap:"8px",alignItems:"flex-start",animation:"fadeUp 0.3s ease"}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" style={{flexShrink:0,marginTop:"1px"}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p style={{fontSize:"11px",color:"rgba(110,231,183,0.75)",margin:0,fontFamily:F,lineHeight:1.65}}>Festival auto-reminders are active. You will be notified 7 days before each major Indian festival.</p>
          </div>
        )}

        {/* Filter tabs */}
        {reminders.length>0&&(
          <div style={{display:"flex",gap:"4px",marginBottom:"14px",background:"rgba(255,255,255,0.03)",borderRadius:"10px",padding:"3px"}}>
            {[{k:"upcoming",l:`Upcoming (${upcomingCount})`},{k:"overdue",l:`Overdue (${overdueCount})`},{k:"all",l:`All (${reminders.length})`}].map(t=>(
              <button key={t.k} onClick={()=>setFilter(t.k)}
                style={{flex:1,padding:"6px 10px",borderRadius:"8px",border:"none",background:filter===t.k?"rgba(255,255,255,0.08)":"transparent",color:filter===t.k?"#fff":"rgba(255,255,255,0.35)",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:F,transition:"all 0.15s"}}>
                {t.l}
              </button>
            ))}
          </div>
        )}

        {/* Reminders list */}
        {loading?(
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {[1,2,3].map(i=><div key={i} style={{height:"64px",borderRadius:"12px",background:"rgba(255,255,255,0.04)",animation:"skpulse 1.4s ease-in-out infinite"}}/>)}
          </div>
        ):filtered.length===0?(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"12px",padding:"48px 24px",opacity:0.4}}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <p style={{fontSize:"13px",color:"rgba(255,255,255,0.5)",fontFamily:F,textAlign:"center",margin:0}}>{reminders.length===0?"No reminders yet — add one above.":filter==="upcoming"?"No upcoming reminders.":"No overdue reminders."}</p>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {filtered.sort((a,b)=>a.scheduled_ts-b.scheduled_ts).map(r=>{
              const overdue=isOverdue(r.scheduled_ts);
              return (
                <div key={r.id} style={{display:"flex",alignItems:"center",gap:"12px",padding:"14px 16px",borderRadius:"14px",border:`1px solid ${overdue?"rgba(248,113,113,0.15)":"rgba(255,255,255,0.07)"}`,background:overdue?"rgba(248,113,113,0.05)":"rgba(255,255,255,0.03)",animation:"fadeUp 0.25s ease",backdropFilter:"blur(10px)"}}>
                  <div style={{width:"36px",height:"36px",borderRadius:"10px",background:overdue?"rgba(248,113,113,0.1)":"rgba(255,255,255,0.05)",border:`1px solid ${overdue?"rgba(248,113,113,0.2)":"rgba(255,255,255,0.08)"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={overdue?"#f87171":"rgba(255,255,255,0.5)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:"13px",fontWeight:"600",color:overdue?"rgba(255,255,255,0.5)":"#fff",margin:"0 0 3px",fontFamily:F,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:overdue?"line-through":"none"}}>{r.task}</p>
                    <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                      <p style={{fontSize:"10px",color:"rgba(255,255,255,0.3)",margin:0,fontFamily:F}}>{fmt(r.scheduled_ts)}</p>
                      <span style={{fontSize:"9px",fontWeight:"700",color:overdue?"#f87171":"rgba(255,255,255,0.4)",fontFamily:F,background:overdue?"rgba(248,113,113,0.1)":"rgba(255,255,255,0.05)",padding:"2px 7px",borderRadius:"99px"}}>{timeLeft(r.scheduled_ts)}</span>
                    </div>
                  </div>
                  <button className="rd" onClick={()=>deleteReminder(r.id)}
                    style={{width:"28px",height:"28px",borderRadius:"8px",border:"none",background:"transparent",color:"rgba(255,255,255,0.2)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"color 0.15s",flexShrink:0}}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
