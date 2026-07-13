import { useState, useEffect } from "react";
const BASE = "https://sociomeeai.com/api";
const FONT = "'DM Sans','Syne',sans-serif";
const FONT_HEAD = "'Poppins',sans-serif";
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function daysInMonth(y,m){return new Date(y,m+1,0).getDate();}
function firstDay(y,m){return new Date(y,m,1).getDay();}
const urgency = (d) => {
  if(d<=7) return {color:"#f87171",bg:"rgba(248,113,113,0.1)"};
  if(d<=30) return {color:"#fb923c",bg:"rgba(251,146,60,0.08)"};
  return {color:"rgba(255,255,255,0.3)",bg:"rgba(255,255,255,0.03)"};
};
const UPGRADE_SCREEN = (FONT, FONT_HEAD) => (
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"32px 24px",fontFamily:FONT,background:"#080810"}}>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"20px",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"24px",padding:"48px 40px",maxWidth:"400px",width:"100%",backdropFilter:"blur(24px)"}}>
      <div style={{width:"68px",height:"68px",borderRadius:"20px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </div>
      <div>
        <h3 style={{fontSize:"20px",fontWeight:"700",color:"#fff",margin:"0 0 10px",fontFamily:FONT_HEAD}}>Festival Calendar</h3>
        <p style={{fontSize:"13px",color:"rgba(255,255,255,0.4)",lineHeight:1.8,margin:0}}>Plan content around Indian festivals with content ideas and optimal upload windows.</p>
      </div>
      <div style={{width:"100%",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"14px",padding:"16px 20px",display:"flex",flexDirection:"column",gap:"10px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:"12px",color:"rgba(255,255,255,0.4)",fontFamily:FONT}}>Pro</span><span style={{fontSize:"12px",color:"rgba(255,255,255,0.8)",fontWeight:"600",fontFamily:FONT}}>Calendar + Content Ideas + Personal Events</span></div>
        <div style={{height:"1px",background:"rgba(255,255,255,0.06)"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:"12px",color:"rgba(255,255,255,0.4)",fontFamily:FONT}}>Premium</span><span style={{fontSize:"12px",color:"rgba(255,255,255,0.8)",fontWeight:"600",fontFamily:FONT}}>Pro + AI Scripts + Reminders</span></div>
      </div>
      <a href="/pricing" style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"13px 0",borderRadius:"12px",background:"#fff",color:"#080810",fontWeight:"700",fontSize:"14px",textDecoration:"none",width:"100%",fontFamily:FONT}}>Upgrade to Pro</a>
    </div>
  </div>
);
export default function SocioMeeCalendar({ user }) {
  const rawPlan = user?.plan||user?.plan_label||"free";
  const plan = rawPlan.toLowerCase().includes("premium")?"premium":rawPlan.toLowerCase().includes("pro")?"pro":"free";
  const isPro = plan==="pro"||plan==="premium";
  const today = new Date();
  const [year,setYear] = useState(today.getFullYear());
  const [month,setMonth] = useState(today.getMonth());
  const [festivals,setFestivals] = useState([]);
  const [loading,setLoading] = useState(true);
  const [selected,setSelected] = useState(null);
  const [personalEvents,setPersonalEvents] = useState(()=>{try{return JSON.parse(localStorage.getItem("cal_pe")||"{}");}catch{return {};}});
  const [editingDay,setEditingDay] = useState(null);
  const [editText,setEditText] = useState("");
  useEffect(()=>{fetch(`${BASE}/festivals/upcoming`).then(r=>r.json()).then(d=>{setFestivals(Array.isArray(d)?d:d.festivals||[]);setLoading(false);}).catch(()=>setLoading(false));},[]);
  const festMap = {};
  festivals.forEach(f=>{const d=new Date(f.date);const k=`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;if(!festMap[k])festMap[k]=[];festMap[k].push(f);});
  const upcoming = [...festivals].map(f=>({...f,daysLeft:Math.ceil((new Date(f.date)-today)/86400000)})).filter(f=>f.daysLeft>=0).sort((a,b)=>a.daysLeft-b.daysLeft);
  const prevM = ()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);};
  const nextM = ()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);};
  const cells = Array(firstDay(year,month)).fill(null).concat(Array.from({length:daysInMonth(year,month)},(_,i)=>i+1));
  while(cells.length%7!==0) cells.push(null);
  const savePE = (u)=>{setPersonalEvents(u);try{localStorage.setItem("cal_pe",JSON.stringify(u));}catch{}};
  const startEdit = (day,e)=>{e.stopPropagation();const k=`${year}-${month}-${day}`;setEditingDay(k);setEditText(personalEvents[k]||"");};
  const saveEdit = ()=>{if(editingDay){const u={...personalEvents};if(editText.trim())u[editingDay]=editText.trim();else delete u[editingDay];savePE(u);}setEditingDay(null);setEditText("");};
  const sf = selected!==null?upcoming[selected]:null;
  if(!isPro) return UPGRADE_SCREEN(FONT, FONT_HEAD);
  return (
    <div style={{display:"flex",height:"100vh",background:"#080810",fontFamily:FONT,overflow:"hidden"}}>
      <style>{`
        @keyframes skpulse{0%,100%{opacity:0.4}50%{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        .cn:hover{background:rgba(255,255,255,0.07)!important;color:#fff!important;}
        .cd:hover .cp{opacity:1!important;}
        .cd:hover{background:rgba(255,255,255,0.05)!important;}
        .cf:hover{border-color:rgba(255,255,255,0.15)!important;background:rgba(255,255,255,0.06)!important;}
        ::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:99px}
      `}</style>
      {editingDay&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}} onClick={saveEdit}>
          <div style={{background:"rgba(20,20,30,0.95)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"18px",padding:"22px 24px",width:"340px",backdropFilter:"blur(20px)"}} onClick={e=>e.stopPropagation()}>
            <p style={{fontSize:"11px",color:"rgba(255,255,255,0.4)",fontFamily:FONT,margin:"0 0 12px",letterSpacing:"0.3px"}}>{editingDay?.split("-")[2]} {MONTHS[Number(editingDay?.split("-")[1])]} {editingDay?.split("-")[0]}</p>
            <input autoFocus value={editText} onChange={e=>setEditText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveEdit();if(e.key==="Escape")setEditingDay(null);}}
              placeholder="Add a note, task, reminder..."
              style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"10px 12px",color:"#fff",fontSize:"13px",fontFamily:FONT,outline:"none",boxSizing:"border-box",marginBottom:"12px"}}/>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={saveEdit} style={{flex:1,padding:"9px",borderRadius:"9px",border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.08)",color:"#fff",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:FONT}}>Save</button>
              {personalEvents[editingDay]&&<button onClick={()=>{const u={...personalEvents};delete u[editingDay];savePE(u);setEditingDay(null);}} style={{padding:"9px 14px",borderRadius:"9px",border:"1px solid rgba(239,68,68,0.2)",background:"transparent",color:"rgba(239,68,68,0.7)",fontSize:"12px",cursor:"pointer",fontFamily:FONT}}>Remove</button>}
              <button onClick={()=>setEditingDay(null)} style={{padding:"9px 14px",borderRadius:"9px",border:"1px solid rgba(255,255,255,0.08)",background:"transparent",color:"rgba(255,255,255,0.4)",fontSize:"12px",cursor:"pointer",fontFamily:FONT}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Left: Calendar full height */}
      <div style={{flex:"0 0 560px",display:"flex",flexDirection:"column",borderRight:"1px solid rgba(255,255,255,0.06)",padding:"22px 24px",overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"18px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"baseline",gap:"10px"}}>
            <h2 style={{fontSize:"24px",fontWeight:"800",color:"#fff",margin:0,fontFamily:FONT_HEAD}}>{MONTHS[month]}</h2>
            <span style={{fontSize:"15px",color:"rgba(255,255,255,0.3)",fontFamily:FONT}}>{year}</span>
          </div>
          <div style={{display:"flex",gap:"5px"}}>
            <button onClick={prevM} className="cn" style={{width:"30px",height:"30px",borderRadius:"8px",border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.03)",color:"rgba(255,255,255,0.4)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button onClick={()=>{setMonth(today.getMonth());setYear(today.getFullYear());}} className="cn" style={{padding:"5px 12px",borderRadius:"8px",border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.03)",color:"rgba(255,255,255,0.4)",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:FONT,transition:"all 0.15s"}}>Today</button>
            <button onClick={nextM} className="cn" style={{width:"30px",height:"30px",borderRadius:"8px",border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.03)",color:"rgba(255,255,255,0.4)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:"6px",flexShrink:0}}>
          {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:"9px",fontWeight:"700",color:"rgba(255,255,255,0.18)",padding:"3px 0",letterSpacing:"1px",textTransform:"uppercase"}}>{d}</div>)}
        </div>
        <div style={{flex:1,overflow:"hidden"}}>
          {loading?(
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"4px",height:"100%"}}>
              {Array(35).fill(0).map((_,i)=><div key={i} style={{borderRadius:"12px",background:"rgba(255,255,255,0.03)",animation:"skpulse 1.4s ease-in-out infinite"}}/>)}
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"4px",height:"100%"}}>
              {cells.map((day,i)=>{
                if(!day) return <div key={i}/>;
                const isToday=day===today.getDate()&&month===today.getMonth()&&year===today.getFullYear();
                const fk=`${year}-${month}-${day}`;
                const fests=festMap[fk]||[];
                const hasFest=fests.length>0;
                const hasPE=!!personalEvents[fk];
                const dl=hasFest?Math.ceil((new Date(year,month,day)-today)/86400000):null;
                const u=hasFest?urgency(dl):null;
                const fi=hasFest?upcoming.findIndex(f=>f.name===fests[0].name):-1;
                const isSel=selected===fi&&fi!==-1;
                return (
                  <div key={i} className="cd" onClick={()=>hasFest&&setSelected(isSel?null:fi)}
                    style={{borderRadius:"12px",border:`1px solid ${isToday?"rgba(255,255,255,0.22)":isSel?"rgba(255,255,255,0.16)":hasFest?"rgba(255,255,255,0.08)":"transparent"}`,background:isToday?"rgba(255,255,255,0.08)":isSel?"rgba(255,255,255,0.05)":"transparent",cursor:hasFest?"pointer":"default",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"5px",transition:"all 0.15s",position:"relative",minHeight:"52px"}}>
                    <span style={{fontSize:"13px",fontWeight:isToday?"800":"500",color:isToday?"#fff":"rgba(255,255,255,0.65)",fontFamily:isToday?FONT_HEAD:FONT,lineHeight:1}}>{day}</span>
                    {(hasFest||hasPE)&&<div style={{display:"flex",gap:"3px"}}>
                      {hasFest&&<div style={{width:"4px",height:"4px",borderRadius:"50%",background:u.color}}/>}
                      {hasPE&&<div style={{width:"4px",height:"4px",borderRadius:"50%",background:"rgba(96,165,250,0.8)"}}/>}
                    </div>}
                    {hasPE&&<div style={{position:"absolute",bottom:"3px",left:"3px",right:"3px",fontSize:"7px",color:"rgba(96,165,250,0.6)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"center",fontFamily:FONT,lineHeight:1}}>{personalEvents[fk]}</div>}
                    <button className="cp" onClick={e=>startEdit(day,e)} style={{position:"absolute",top:"3px",right:"3px",width:"15px",height:"15px",borderRadius:"4px",border:"none",background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.4)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity 0.15s",padding:0}}>
                      <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div style={{display:"flex",gap:"14px",padding:"12px 0 0",flexShrink:0}}>
          {[{color:"#f87171",l:"This week"},{color:"#fb923c",l:"This month"},{color:"rgba(255,255,255,0.3)",l:"Festival"},{color:"rgba(96,165,250,0.8)",l:"Personal"}].map(x=>(
            <div key={x.l} style={{display:"flex",alignItems:"center",gap:"5px"}}>
              <div style={{width:"5px",height:"5px",borderRadius:"50%",background:x.color}}/>
              <span style={{fontSize:"9px",color:"rgba(255,255,255,0.22)",fontFamily:FONT}}>{x.l}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Right: Festivals + Detail */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"22px 20px 12px",borderBottom:"1px solid rgba(255,255,255,0.06)",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:"11px",fontWeight:"700",color:"rgba(255,255,255,0.25)",textTransform:"uppercase",letterSpacing:"1px",fontFamily:FONT}}>Upcoming</span>
          <span style={{fontSize:"10px",color:"rgba(255,255,255,0.18)",fontFamily:FONT}}>{upcoming.length} festivals</span>
        </div>
        <div style={{flex:1,display:"flex",overflow:"hidden"}}>
          {/* Festival list */}
          <div style={{width:"210px",flexShrink:0,overflowY:"auto",borderRight:"1px solid rgba(255,255,255,0.06)",padding:"8px"}}>
            {loading?Array(8).fill(0).map((_,i)=><div key={i} style={{height:"48px",borderRadius:"10px",background:"rgba(255,255,255,0.03)",marginBottom:"3px",animation:"skpulse 1.4s ease-in-out infinite"}}/>):
            upcoming.slice(0,15).map((f,i)=>{
              const u=urgency(f.daysLeft);
              const isSel=selected===i;
              return (
                <div key={i} className="cf" onClick={()=>setSelected(isSel?null:i)}
                  style={{padding:"8px 10px",borderRadius:"10px",border:`1px solid ${isSel?"rgba(255,255,255,0.14)":"rgba(255,255,255,0.05)"}`,background:isSel?"rgba(255,255,255,0.06)":"transparent",cursor:"pointer",marginBottom:"3px",transition:"all 0.15s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"3px"}}>
                    <div style={{width:"5px",height:"5px",borderRadius:"50%",background:u.color,flexShrink:0}}/>
                    <span style={{fontSize:"11px",fontWeight:"600",color:"#fff",fontFamily:FONT,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",paddingLeft:"11px"}}>
                    <span style={{fontSize:"9px",color:"rgba(255,255,255,0.3)",fontFamily:FONT}}>{new Date(f.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span>
                    <span style={{fontSize:"9px",color:u.color,fontFamily:FONT,fontWeight:"600"}}>{f.daysLeft===0?"Today":f.daysLeft===1?"Tomorrow":`${f.daysLeft}d`}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Detail panel */}
          <div style={{flex:1,overflowY:"auto",padding:"20px"}}>
            {!sf?(
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:"12px",opacity:0.35}}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <div style={{textAlign:"center"}}>
                  <p style={{fontSize:"13px",fontWeight:"600",color:"#fff",margin:"0 0 5px",fontFamily:FONT_HEAD}}>Select a festival</p>
                  <p style={{fontSize:"11px",color:"rgba(255,255,255,0.4)",margin:0,fontFamily:FONT}}>Click any festival to see content ideas and the optimal upload window.</p>
                </div>
              </div>
            ):(
              <div style={{animation:"fadeUp 0.2s ease"}}>
                <div style={{marginBottom:"18px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"5px"}}>
                    <div style={{width:"7px",height:"7px",borderRadius:"50%",background:urgency(sf.daysLeft).color}}/>
                    <h3 style={{fontSize:"20px",fontWeight:"800",color:"#fff",margin:0,fontFamily:FONT_HEAD}}>{sf.name}</h3>
                  </div>
                  <p style={{fontSize:"12px",color:"rgba(255,255,255,0.4)",margin:0,fontFamily:FONT}}>{new Date(sf.date).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})} · {sf.daysLeft===0?"Today":sf.daysLeft===1?"Tomorrow":`${sf.daysLeft} days away`}</p>
                </div>
                {sf.daysLeft<=30&&(
                  <div style={{background:"rgba(251,146,60,0.07)",border:"1px solid rgba(251,146,60,0.18)",borderRadius:"12px",padding:"12px 14px",marginBottom:"14px",display:"flex",gap:"8px",alignItems:"flex-start"}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" style={{flexShrink:0,marginTop:"1px"}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <p style={{fontSize:"11px",color:"rgba(251,146,60,0.85)",margin:0,fontFamily:FONT,lineHeight:1.65}}>Start creating content <strong>{sf.daysLeft<=7?"immediately":"this week"}</strong>. Festival content performs best published 3 to 7 days before.</p>
                  </div>
                )}
                <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"14px",padding:"16px",marginBottom:"12px"}}>
                  <p style={{fontSize:"10px",fontWeight:"700",color:"rgba(255,255,255,0.25)",textTransform:"uppercase",letterSpacing:"1px",margin:"0 0 10px",fontFamily:FONT}}>Content Ideas</p>
                  <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                    {(sf.topics||[`Top 5 ways to celebrate ${sf.name} as a creator`,`${sf.name} special behind the scenes`,`My ${sf.name} content creation setup`,`How to grow your audience during ${sf.name}`]).map((t,i)=>(
                      <div key={i} style={{display:"flex",gap:"8px",padding:"7px 10px",borderRadius:"9px",background:"rgba(255,255,255,0.03)"}}>
                        <span style={{fontSize:"9px",color:"rgba(255,255,255,0.2)",flexShrink:0,marginTop:"2px",fontFamily:FONT}}>0{i+1}</span>
                        <p style={{fontSize:"11px",color:"rgba(255,255,255,0.65)",margin:0,fontFamily:FONT,lineHeight:1.65}}>{t}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"12px"}}>
                  {[{l:"Best time to post",v:"7 to 10 days before"},{l:"Peak engagement",v:"Day of the festival"},{l:"Best platforms",v:"YouTube, Instagram, Threads"},{l:"Content type",v:"Short + Long form both"}].map(x=>(
                    <div key={x.l} style={{padding:"10px 12px",borderRadius:"10px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                      <p style={{fontSize:"9px",color:"rgba(255,255,255,0.25)",margin:"0 0 3px",textTransform:"uppercase",letterSpacing:"0.5px",fontFamily:FONT}}>{x.l}</p>
                      <p style={{fontSize:"11px",fontWeight:"600",color:"#fff",margin:0,fontFamily:FONT}}>{x.v}</p>
                    </div>
                  ))}
                </div>
                <div style={{background:"rgba(110,231,183,0.05)",border:"1px solid rgba(110,231,183,0.12)",borderRadius:"11px",padding:"11px 13px",display:"flex",gap:"8px",alignItems:"flex-start"}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" style={{flexShrink:0,marginTop:"1px"}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p style={{fontSize:"11px",color:"rgba(110,231,183,0.75)",margin:0,fontFamily:FONT,lineHeight:1.65}}>Indian festival videos get <strong>3 to 8x more views</strong> than regular content. Add the festival name in your thumbnail for best CTR.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
