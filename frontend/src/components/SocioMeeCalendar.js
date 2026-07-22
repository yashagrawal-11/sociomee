import { useState, useEffect, useRef } from "react";
const BASE = "https://sociomeeai.com/api";
const F = "'DM Sans','Syne',sans-serif";
const FH = "'Poppins',sans-serif";
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const dim = (y,m) => new Date(y,m+1,0).getDate();
const fst = (y,m) => new Date(y,m,1).getDay();
const urg = d => d<=7?{c:"#f87171",bg:"rgba(248,113,113,0.14)",border:"rgba(248,113,113,0.3)"}:d<=30?{c:"#fb923c",bg:"rgba(251,146,60,0.1)",border:"rgba(251,146,60,0.25)"}:{c:"rgba(255,255,255,0.4)",bg:"rgba(255,255,255,0.05)",border:"rgba(255,255,255,0.1)"};

export default function SocioMeeCalendar({ user }) {
  const mob = typeof window !== "undefined" && window.innerWidth <= 767;
  const raw = user?.plan||user?.plan_label||"free";
  const plan = raw.toLowerCase().includes("premium")?"premium":raw.toLowerCase().includes("pro")?"pro":"free";
  const isPro = plan==="pro"||plan==="premium";
  const today = new Date();
  const yr = today.getFullYear();
  const [mo,setMo] = useState(today.getMonth());
  const [fests,setFests] = useState([]);
  const [loading,setLoading] = useState(true);
  const [sel,setSel] = useState(null);
  const [pe,setPe] = useState(()=>{try{return JSON.parse(localStorage.getItem("cal_pe")||"{}");}catch{return {};}});
  const [ek,setEk] = useState(null);
  const [et,setEt] = useState("");
  const [showMonths, setShowMonths] = useState(false)
  const monthListRef = useRef(null);

  useEffect(()=>{
    fetch(`${BASE}/festivals/upcoming`)
      .then(r=>r.json())
      .then(d=>{setFests(Array.isArray(d)?d:d.festivals||[]);setLoading(false);})
      .catch(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    if(monthListRef.current){
      const el = monthListRef.current.children[mo];
      if(el) el.scrollIntoView({behavior:"smooth",block:"center"});
    }
  },[mo]);

  const fm = {};
  fests.forEach(f=>{
    const d=new Date(f.date);
    const k=`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if(!fm[k])fm[k]=[];
    fm[k].push(f);
  });

  const up = [...fests]
    .map(f=>({...f,dl:Math.ceil((new Date(f.date)-today)/86400000)}))
    .filter(f=>f.dl>=0)
    .sort((a,b)=>a.dl-b.dl);

  const cells=[...Array(fst(yr,mo)).fill(null),...Array.from({length:dim(yr,mo)},(_,i)=>i+1)];
  while(cells.length%7!==0) cells.push(null);

  const savePe=u=>{setPe(u);try{localStorage.setItem("cal_pe",JSON.stringify(u));}catch{}};
  const sf = sel!==null?up[sel]:null;

  if(!isPro) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"32px",fontFamily:F,background:"#0a0a0a"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"20px",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"24px",padding:"48px 40px",maxWidth:"400px",width:"100%"}}>
        <div style={{width:"68px",height:"68px",borderRadius:"20px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <div>
          <h3 style={{fontSize:"20px",fontWeight:"700",color:"#fff",margin:"0 0 10px",fontFamily:FH}}>Festival Calendar</h3>
          <p style={{fontSize:"13px",color:"rgba(255,255,255,0.4)",lineHeight:1.8,margin:0}}>Plan content around Indian festivals with content ideas and optimal upload windows.</p>
        </div>
        <a href="/pricing" style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"13px 0",borderRadius:"12px",background:"#fff",color:"#0a0a0a",fontWeight:"700",fontSize:"14px",textDecoration:"none",width:"100%",fontFamily:F}}>Upgrade to Pro</a>
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",height:"100vh",background:"#0a0a0a",fontFamily:F,overflow:"hidden"}}>
      <style>{`
        @keyframes skpulse{0%,100%{opacity:0.3}50%{opacity:0.7}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
        .cd:hover{background:rgba(255,255,255,0.05)!important;}
        .cd:hover .cp{opacity:1!important;}
        .pill:hover{background:rgba(255,255,255,0.08)!important;border-color:rgba(255,255,255,0.18)!important;}
        .nb:hover{color:#fff!important;}
        .mitem:hover{color:rgba(255,255,255,0.7)!important;}
        ::-webkit-scrollbar{width:0px;height:0px;display:none}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:99px}
        .cal-pills::-webkit-scrollbar{display:none}
        .cal-pills{-ms-overflow-style:none;scrollbar-width:none;}
      `}</style>

      {ek&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}} onClick={()=>setEk(null)}>
          <div style={{background:"rgba(8,8,8,0.98)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"20px",padding:"22px 24px",width:"340px"}} onClick={e=>e.stopPropagation()}>
            <p style={{fontSize:"11px",color:"rgba(255,255,255,0.4)",fontFamily:F,margin:"0 0 12px"}}>{ek?.split("-")[2]} {MONTHS[Number(ek?.split("-")[1])]} {ek?.split("-")[0]}</p>
            <input autoFocus value={et} onChange={e=>setEt(e.target.value)}
              onKeyDown={e=>{
                if(e.key==="Enter"){const u={...pe};if(et.trim())u[ek]=et.trim();else delete u[ek];savePe(u);setEk(null);}
                if(e.key==="Escape")setEk(null);
              }}
              placeholder="Add a note, task, reminder..."
              style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"10px 12px",color:"#fff",fontSize:"13px",fontFamily:F,outline:"none",boxSizing:"border-box",marginBottom:"12px"}}/>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>{const u={...pe};if(et.trim())u[ek]=et.trim();else delete u[ek];savePe(u);setEk(null);}} style={{flex:1,padding:"9px",borderRadius:"9px",border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.08)",color:"#fff",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:F}}>Save</button>
              {pe[ek]&&<button onClick={()=>{const u={...pe};delete u[ek];savePe(u);setEk(null);}} style={{padding:"9px 14px",borderRadius:"9px",border:"1px solid rgba(239,68,68,0.2)",background:"transparent",color:"rgba(239,68,68,0.7)",fontSize:"12px",cursor:"pointer",fontFamily:F}}>Remove</button>}
              <button onClick={()=>setEk(null)} style={{padding:"9px 14px",borderRadius:"9px",border:"1px solid rgba(255,255,255,0.07)",background:"transparent",color:"rgba(255,255,255,0.35)",fontSize:"12px",cursor:"pointer",fontFamily:F}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT: Month picker — large scrollable list */}
      <div style={{width:mob?"100%":"160px",flexShrink:0,display:mob&&!showMonths?"none":"flex",flexDirection:"column",position:mob?"fixed":"relative",inset:mob?"0":undefined,zIndex:mob?300:undefined,background:mob?"rgba(10,10,10,0.98)":undefined,overflow:"hidden"}}>
        {/* Top fade */}
        <div style={{position:"absolute",top:0,left:0,right:0,height:"80px",background:"linear-gradient(to bottom,#0a0a0a,transparent)",zIndex:2,pointerEvents:"none"}}/>
        {/* Bottom fade */}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:"80px",background:"linear-gradient(to top,#0a0a0a,transparent)",zIndex:2,pointerEvents:"none"}}/>
        {/* Year + nav */}
        <div style={{padding:"20px 16px 10px",flexShrink:0,zIndex:3,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          {mob&&<button onClick={()=>setShowMonths(false)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",padding:"5px 10px",color:"rgba(255,255,255,0.6)",fontSize:"12px",cursor:"pointer",fontFamily:F,marginLeft:"52px"}}>Done</button>}
          <span style={{fontSize:"13px",fontWeight:"700",color:"rgba(255,255,255,0.25)",fontFamily:FH}}>{yr}</span>

        </div>
        {/* Month scroll list */}
        <div ref={monthListRef} style={{flex:1,overflowY:"auto",padding:"40px 0",display:"flex",flexDirection:"column",gap:"2px"}}>
          {MONTHS.map((m,i)=>{
            const isActive=mo===i;
            const hasFest=fests.some(f=>{const d=new Date(f.date);return d.getMonth()===i&&d.getFullYear()===yr;});
            const dist=Math.abs(mo-i);
            const opacity=dist===0?1:dist===1?0.55:dist===2?0.35:0.2;
            const size=dist===0?22:dist===1?16:14;
            return (
              <button key={i} className="mitem" onClick={()=>setMo(i)}
                style={{padding:"6px 16px",border:"none",background:"transparent",color:isActive?"#fff":`rgba(255,255,255,${opacity})`,fontSize:`${size}px`,fontWeight:isActive?"800":"400",cursor:"pointer",fontFamily:FH,textAlign:"left",transition:"all 0.2s",display:"flex",alignItems:"center",gap:"8px",lineHeight:isActive?1.2:1}}>
                {m}
                {hasFest&&<div style={{width:"4px",height:"4px",borderRadius:"50%",background:isActive?"#fb923c":"rgba(251,146,60,0.5)",flexShrink:0}}/>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Curved separator */}
      <div style={{width:"24px",flexShrink:0,position:"relative",overflow:"visible",display:mob?"none":"block"}}>
        <svg width="24" height="100%" viewBox="0 0 24 800" preserveAspectRatio="none" style={{position:"absolute",inset:0,width:"24px",height:"100%"}}>
          <path d="M0 0 Q24 400 0 800 L24 800 L24 0 Z" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" vectorEffect="non-scaling-stroke"/>
        </svg>
      </div>

      {/* RIGHT: Calendar + Festivals */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",padding:"20px 24px 0"}}>

        {/* Calendar header */}
        <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px",flexShrink:0,paddingLeft:mob?"52px":"0"}}>
          {mob&&<button onClick={()=>setShowMonths(true)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"99px",padding:"4px 10px",color:"rgba(255,255,255,0.6)",fontSize:"10px",cursor:"pointer",fontFamily:F,flexShrink:0}}>{MONTHS[mo]}</button>}
          <h2 style={{fontSize:mob?"15px":"20px",fontWeight:"800",color:"#fff",margin:0,fontFamily:FH,flexShrink:0}}>{!mob&&MONTHS[mo].substring(0,3)+" "}{today.getDate()},</h2>
          <span style={{fontSize:mob?"12px":"14px",color:"rgba(255,255,255,0.35)",fontFamily:F,flexShrink:0}}>{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][today.getDay()]}</span>
          <span style={{fontSize:mob?"11px":"13px",color:"rgba(255,255,255,0.2)",fontFamily:F,flexShrink:0}}>{yr}</span>
          <div style={{flex:1}}/>
          <button onClick={()=>{setMo(today.getMonth());setYr(today.getFullYear());}} className="nb" style={{padding:"4px 10px",borderRadius:"8px",border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.03)",color:"rgba(255,255,255,0.3)",fontSize:"10px",fontWeight:"700",cursor:"pointer",fontFamily:F,flexShrink:0}}>Today</button>
        </div>

        {/* Day headers */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:"4px",flexShrink:0}}>
          {DAYS.map((d,i)=><div key={i} style={{textAlign:"center",fontSize:mob?"8px":"10px",fontWeight:"700",color:"rgba(255,255,255,0.18)",padding:mob?"2px 0":"4px 0",letterSpacing:"0.5px",textTransform:"uppercase"}}>{d[0]}</div>)}
        </div>

        {/* Calendar grid */}
        <div style={{flexShrink:0}}>
          {loading?(
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:mob?"1px":"3px"}}>
              {Array(35).fill(0).map((_,i)=><div key={i} style={{height:mob?"38px":"64px",borderRadius:"10px",background:"rgba(255,255,255,0.025)",animation:"skpulse 1.4s ease-in-out infinite"}}/>)}
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:mob?"2px":"3px",gridAutoRows:mob?"38px":"64px"}}>
              {cells.map((day,i)=>{
                if(!day) return <div key={i}/>;
                const isToday=day===today.getDate()&&mo===today.getMonth()&&yr===today.getFullYear();
                const fk=`${yr}-${mo}-${day}`;
                const dayFests=fm[fk]||[];
                const hasFest=dayFests.length>0;
                const hasPE=!!pe[fk];
                const dl=hasFest?Math.ceil((new Date(yr,mo,day)-today)/86400000):null;
                const u=hasFest?urg(dl):null;
                const fi=hasFest?up.findIndex(f=>f.name===dayFests[0].name):-1;
                const isSel=sel===fi&&fi!==-1;
                return (
                  <div key={i} className="cd" onClick={()=>{ if(hasFest){ setSel(isSel?null:fi); } else { setEk(fk); setEt(pe[fk]||""); } }}
                    style={{borderRadius:"8px",border:day?`1px solid ${isToday?"rgba(255,255,255,0.2)":hasFest?u.border:isSel?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.04)"}`:undefined,background:day?(isToday?"rgba(255,255,255,0.09)":hasFest?u.bg:isSel?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.02)"):undefined,cursor:day&&hasFest?"pointer":"default",display:day?"flex":"block",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"3px",transition:"background 0.15s",position:"relative",padding:day?"4px":0,pointerEvents:day?"auto":"none"}}>
                    <span style={{fontSize:mob?"11px":"13px",fontWeight:isToday||hasFest?"700":"400",color:isToday?"#fff":hasFest?u.c:"rgba(255,255,255,0.5)",fontFamily:F,lineHeight:1}}>{day}</span>
                    {hasFest&&<span style={{fontSize:"8px",color:u.c,fontFamily:F,fontWeight:"600",textAlign:"center",lineHeight:1.1,padding:"0 2px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"90%"}}>{dayFests[0].name.split(" ").slice(0,2).join(" ")}</span>}
                    {hasPE&&!hasFest&&<div style={{width:"3px",height:"3px",borderRadius:"50%",background:"rgba(96,165,250,0.7)"}}/>}
                    <button className="cp" onClick={e=>{e.stopPropagation();setEk(fk);setEt(pe[fk]||"");}}
                      style={{position:"absolute",top:"3px",right:"3px",width:"13px",height:"13px",borderRadius:"4px",border:"none",background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.3)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity 0.15s",padding:0}}>
                      <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{height:"1px",background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.07) 20%,rgba(255,255,255,0.07) 80%,transparent)",margin:"12px 0",flexShrink:0}}/>

        {/* Festival pills */}
        <div style={{flex:1,overflow:"visible",display:"flex",flexDirection:"column",gap:"10px",paddingBottom:"16px"}}>
          <div className="cal-pills" style={{overflowX:"auto",display:"flex",gap:"6px",flexShrink:0,paddingBottom:"0",scrollbarWidth:"none",msOverflowStyle:"none"}}>
            {loading?Array(6).fill(0).map((_,i)=><div key={i} style={{width:"100px",height:"40px",borderRadius:"99px",background:"rgba(255,255,255,0.04)",animation:"skpulse 1.4s ease-in-out infinite",flexShrink:0}}/>):
            up.slice(0,14).map((f,i)=>{
              const u=urg(f.dl);
              const isSel=sel===i;
              return (
                <button key={i} className="pill" onClick={()=>setSel(isSel?null:i)}
                  style={{padding:"6px 14px",borderRadius:"99px",border:`1px solid ${isSel?u.border:"rgba(255,255,255,0.08)"}`,background:isSel?u.bg:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",cursor:"pointer",display:"flex",flexDirection:"column",gap:"1px",flexShrink:0,transition:"all 0.2s",textAlign:"left"}}>
                  <span style={{fontSize:"11px",fontWeight:"600",color:isSel?u.c:"rgba(255,255,255,0.65)",fontFamily:F,whiteSpace:"nowrap"}}>{f.name}</span>
                  <span style={{fontSize:"9px",color:isSel?u.c:"rgba(255,255,255,0.28)",fontFamily:F}}>{f.dl===0?"Today":f.dl===1?"Tomorrow":`${f.dl}d away`}</span>
                </button>
              );
            })}
          </div>

          {sf&&(
            <div style={{flex:1,overflowY:"auto",animation:"fadeUp 0.2s ease"}}>
              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"14px",padding:mob?"10px 12px":"16px 20px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:mob?"10px":"16px"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"3px"}}>
                    <div style={{width:"6px",height:"6px",borderRadius:"50%",background:urg(sf.dl).c}}/>
                    <h3 style={{fontSize:"16px",fontWeight:"800",color:"#fff",margin:0,fontFamily:FH}}>{sf.name}</h3>
                  </div>
                  <p style={{fontSize:"11px",color:"rgba(255,255,255,0.35)",margin:"0 0 12px",fontFamily:F}}>{new Date(sf.date).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})} · {sf.dl===0?"Today":sf.dl===1?"Tomorrow":`${sf.dl} days away`}</p>
                  <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
                    {(sf.topics||[`Top 5 ways to celebrate ${sf.name} as a creator`,`${sf.name} special behind the scenes`,`My ${sf.name} content creation setup`,`How to grow your audience during ${sf.name}`]).map((t,idx)=>(
                      <div key={idx} style={{display:"flex",gap:"7px",padding:"6px 9px",borderRadius:"8px",background:"rgba(255,255,255,0.03)"}}>
                        <span style={{fontSize:"9px",color:"rgba(255,255,255,0.2)",flexShrink:0,marginTop:"1px",fontFamily:F}}>0{idx+1}</span>
                        <p style={{fontSize:"11px",color:"rgba(255,255,255,0.6)",margin:0,fontFamily:F,lineHeight:1.6}}>{t}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:"7px"}}>
                  {sf.dl<=30&&<div style={{background:"rgba(251,146,60,0.07)",border:"1px solid rgba(251,146,60,0.18)",borderRadius:"10px",padding:"10px 12px"}}>
                    <p style={{fontSize:"11px",color:"rgba(251,146,60,0.85)",margin:0,fontFamily:F,lineHeight:1.6}}>Start creating <strong>{sf.dl<=7?"immediately":"this week"}</strong>. Publish 3 to 7 days before for best reach.</p>
                  </div>}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>
                    {[{l:"Best time",v:"7 to 10 days before"},{l:"Peak day",v:"Day of festival"},{l:"Platforms",v:"YouTube, Instagram"},{l:"Format",v:"Short + Long form"}].map(x=>(
                      <div key={x.l} style={{padding:"8px 10px",borderRadius:"9px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                        <p style={{fontSize:"8px",color:"rgba(255,255,255,0.22)",margin:"0 0 2px",textTransform:"uppercase",letterSpacing:"0.5px",fontFamily:F}}>{x.l}</p>
                        <p style={{fontSize:"10px",fontWeight:"600",color:"#fff",margin:0,fontFamily:F}}>{x.v}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{background:"rgba(110,231,183,0.05)",border:"1px solid rgba(110,231,183,0.1)",borderRadius:"9px",padding:"9px 11px"}}>
                    <p style={{fontSize:"10px",color:"rgba(110,231,183,0.7)",margin:0,fontFamily:F,lineHeight:1.65}}>Festival videos get <strong>3 to 8x more views</strong>. Add festival name in thumbnail for best CTR.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
