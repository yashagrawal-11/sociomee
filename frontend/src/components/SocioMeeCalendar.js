import { useState, useEffect } from "react";
const BASE = "https://sociomeeai.com/api";
const F = "'DM Sans','Syne',sans-serif";
const FH = "'Poppins',sans-serif";
const DAYS = ["S","M","T","W","T","F","S"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const dim = (y,m) => new Date(y,m+1,0).getDate();
const fst = (y,m) => new Date(y,m,1).getDay();
const urg = d => d<=7?{c:"#f87171",bg:"rgba(248,113,113,0.15)",border:"rgba(248,113,113,0.3)"}:d<=30?{c:"#fb923c",bg:"rgba(251,146,60,0.12)",border:"rgba(251,146,60,0.25)"}:{c:"rgba(255,255,255,0.5)",bg:"rgba(255,255,255,0.06)",border:"rgba(255,255,255,0.12)"};

export default function SocioMeeCalendar({ user }) {
  const raw = user?.plan||user?.plan_label||"free";
  const plan = raw.toLowerCase().includes("premium")?"premium":raw.toLowerCase().includes("pro")?"pro":"free";
  const isPro = plan==="pro"||plan==="premium";
  const today = new Date();
  const [yr,setYr] = useState(today.getFullYear());
  const [mo,setMo] = useState(today.getMonth());
  const [fests,setFests] = useState([]);
  const [loading,setLoading] = useState(true);
  const [sel,setSel] = useState(null);
  const [pe,setPe] = useState(()=>{try{return JSON.parse(localStorage.getItem("cal_pe")||"{}");}catch{return {};}});
  const [ek,setEk] = useState(null);
  const [et,setEt] = useState("");

  useEffect(()=>{
    fetch(`${BASE}/festivals/upcoming`)
      .then(r=>r.json())
      .then(d=>{setFests(Array.isArray(d)?d:d.festivals||[]);setLoading(false);})
      .catch(()=>setLoading(false));
  },[]);

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
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:"32px",fontFamily:F,background:"#080810"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"20px",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"24px",padding:"48px 40px",maxWidth:"400px",width:"100%"}}>
        <div style={{width:"68px",height:"68px",borderRadius:"20px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <div>
          <h3 style={{fontSize:"20px",fontWeight:"700",color:"#fff",margin:"0 0 10px",fontFamily:FH}}>Festival Calendar</h3>
          <p style={{fontSize:"13px",color:"rgba(255,255,255,0.4)",lineHeight:1.8,margin:0}}>Plan content around Indian festivals with content ideas and optimal upload windows.</p>
        </div>
        <a href="/pricing" style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"13px 0",borderRadius:"12px",background:"#fff",color:"#080810",fontWeight:"700",fontSize:"14px",textDecoration:"none",width:"100%",fontFamily:F}}>Upgrade to Pro</a>
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",height:"100vh",background:"#080810",fontFamily:F,overflow:"hidden"}}>
      <style>{`
        @keyframes skpulse{0%,100%{opacity:0.3}50%{opacity:0.7}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
        .cm:hover{background:rgba(255,255,255,0.07)!important;color:#fff!important;}
        .cd:hover{background:rgba(255,255,255,0.05)!important;}
        .cd:hover .cp{opacity:1!important;}
        .pill:hover{border-color:rgba(255,255,255,0.2)!important;background:rgba(255,255,255,0.08)!important;}
        .nb:hover{background:rgba(255,255,255,0.07)!important;color:#fff!important;}
        ::-webkit-scrollbar{width:2px;height:2px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:99px}
      `}</style>

      {ek&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}} onClick={()=>setEk(null)}>
          <div style={{background:"rgba(12,12,20,0.98)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"18px",padding:"22px 24px",width:"340px"}} onClick={e=>e.stopPropagation()}>
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

      {/* LEFT: Month list sidebar */}
      <div style={{width:"120px",flexShrink:0,borderRight:"1px solid rgba(255,255,255,0.06)",display:"flex",flexDirection:"column",padding:"20px 8px",gap:"2px",overflowY:"auto"}}>
        <p style={{fontSize:"9px",fontWeight:"700",color:"rgba(255,255,255,0.18)",letterSpacing:"1.5px",textTransform:"uppercase",fontFamily:F,margin:"0 0 10px 8px"}}>Months</p>
        {MONTHS.map((m,i)=>{
          const isActive = mo===i && yr===today.getFullYear();
          const hasFestThisMonth = fests.some(f=>{const d=new Date(f.date);return d.getMonth()===i&&d.getFullYear()===yr;});
          return (
            <button key={i} className="cm" onClick={()=>setMo(i)}
              style={{width:"100%",padding:"7px 10px",borderRadius:"9px",border:`1px solid ${isActive?"rgba(255,255,255,0.15)":"transparent"}`,background:isActive?"rgba(255,255,255,0.08)":"transparent",color:isActive?"#fff":"rgba(255,255,255,0.35)",fontSize:"12px",fontWeight:isActive?"700":"400",cursor:"pointer",fontFamily:F,textAlign:"left",transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span>{SHORT[i]}</span>
              {hasFestThisMonth&&<div style={{width:"4px",height:"4px",borderRadius:"50%",background:"#fb923c",flexShrink:0}}/>}
            </button>
          );
        })}
      </div>

      {/* RIGHT: Calendar + Festivals */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* Calendar header */}
        <div style={{padding:"18px 24px 12px",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{display:"flex",alignItems:"baseline",gap:"10px"}}>
            <h2 style={{fontSize:"22px",fontWeight:"800",color:"#fff",margin:0,fontFamily:FH}}>{MONTHS[mo]}</h2>
            <span style={{fontSize:"14px",color:"rgba(255,255,255,0.25)",fontFamily:F}}>{yr}</span>
          </div>
          <div style={{display:"flex",gap:"5px"}}>
            <button onClick={()=>{if(mo===0){setMo(11);setYr(y=>y-1);}else setMo(m=>m-1);}} className="nb" style={{width:"28px",height:"28px",borderRadius:"8px",border:"1px solid rgba(255,255,255,0.08)",background:"transparent",color:"rgba(255,255,255,0.35)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button onClick={()=>{setMo(today.getMonth());setYr(today.getFullYear());}} className="nb" style={{padding:"4px 10px",borderRadius:"8px",border:"1px solid rgba(255,255,255,0.08)",background:"transparent",color:"rgba(255,255,255,0.35)",fontSize:"10px",fontWeight:"700",cursor:"pointer",fontFamily:F,transition:"all 0.15s",letterSpacing:"0.3px"}}>Today</button>
            <button onClick={()=>{if(mo===11){setMo(0);setYr(y=>y+1);}else setMo(m=>m+1);}} className="nb" style={{width:"28px",height:"28px",borderRadius:"8px",border:"1px solid rgba(255,255,255,0.08)",background:"transparent",color:"rgba(255,255,255,0.35)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"1px solid rgba(255,255,255,0.06)",flexShrink:0}}>
          {DAYS.map((d,i)=><div key={i} style={{textAlign:"center",fontSize:"10px",fontWeight:"700",color:"rgba(255,255,255,0.18)",padding:"8px 0",letterSpacing:"1px"}}>{d}</div>)}
        </div>

        {/* Calendar grid */}
        <div style={{flex:"0 0 auto"}}>
          {loading?(
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
              {Array(35).fill(0).map((_,i)=>(
                <div key={i} style={{height:"70px",borderRight:"1px solid rgba(255,255,255,0.05)",borderBottom:"1px solid rgba(255,255,255,0.05)",background:i%3===0?"rgba(255,255,255,0.02)":"transparent"}}/>
              ))}
            </div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
              {cells.map((day,i)=>{
                if(!day) return <div key={i} style={{height:"70px",borderRight:"1px solid rgba(255,255,255,0.05)",borderBottom:"1px solid rgba(255,255,255,0.05)"}}/>;
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
                  <div key={i} className="cd" onClick={()=>hasFest&&setSel(isSel?null:fi)}
                    style={{height:"70px",borderRight:"1px solid rgba(255,255,255,0.05)",borderBottom:"1px solid rgba(255,255,255,0.05)",background:isToday?"rgba(255,255,255,0.07)":hasFest?u.bg:isSel?"rgba(255,255,255,0.04)":"transparent",cursor:hasFest?"pointer":"default",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"3px",transition:"background 0.15s",position:"relative",boxSizing:"border-box",outline:isSel?`2px solid ${u?.c||"rgba(255,255,255,0.3)"}`:"none",outlineOffset:"-2px"}}>
                    <span style={{fontSize:"13px",fontWeight:isToday||hasFest?"700":"400",color:isToday?"#fff":hasFest?u.c:"rgba(255,255,255,0.55)",fontFamily:F,lineHeight:1}}>{day}</span>
                    {hasFest&&<span style={{fontSize:"8px",color:u.c,fontFamily:F,fontWeight:"600",textAlign:"center",lineHeight:1.2,padding:"0 4px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%"}}>{dayFests[0].name.split(" ").slice(0,2).join(" ")}</span>}
                    {hasPE&&<div style={{width:"4px",height:"4px",borderRadius:"50%",background:"rgba(96,165,250,0.8)"}}/>}
                    <button className="cp" onClick={e=>{e.stopPropagation();setEk(fk);setEt(pe[fk]||"");}}
                      style={{position:"absolute",top:"3px",right:"3px",width:"14px",height:"14px",borderRadius:"4px",border:"none",background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.35)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity 0.15s",padding:0}}>
                      <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{height:"1px",background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.07) 10%,rgba(255,255,255,0.07) 90%,transparent)",flexShrink:0,margin:"0"}}/>

        {/* Festival pills + detail */}
        <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column",padding:"12px 24px 16px",gap:"10px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"6px",flexShrink:0}}>
            <span style={{fontSize:"9px",fontWeight:"700",color:"rgba(255,255,255,0.18)",textTransform:"uppercase",letterSpacing:"1.5px",fontFamily:F}}>Upcoming Festivals</span>
            <span style={{fontSize:"9px",color:"rgba(255,255,255,0.15)",fontFamily:F}}>{up.length} this year</span>
          </div>

          <div style={{overflowX:"auto",display:"flex",gap:"7px",flexShrink:0,paddingBottom:"4px"}}>
            {loading?Array(7).fill(0).map((_,i)=><div key={i} style={{width:"110px",height:"44px",borderRadius:"99px",background:"rgba(255,255,255,0.04)",animation:"skpulse 1.4s ease-in-out infinite",flexShrink:0}}/>):
            up.slice(0,14).map((f,i)=>{
              const u=urg(f.dl);
              const isSel=sel===i;
              return (
                <button key={i} className="pill" onClick={()=>setSel(isSel?null:i)}
                  style={{padding:"7px 14px",borderRadius:"99px",border:`1px solid ${isSel?u.border:"rgba(255,255,255,0.08)"}`,background:isSel?u.bg:"rgba(255,255,255,0.04)",backdropFilter:"blur(10px)",cursor:"pointer",display:"flex",flexDirection:"column",gap:"1px",flexShrink:0,transition:"all 0.2s",textAlign:"left"}}>
                  <span style={{fontSize:"11px",fontWeight:"600",color:isSel?u.c:"rgba(255,255,255,0.7)",fontFamily:F,whiteSpace:"nowrap"}}>{f.name}</span>
                  <span style={{fontSize:"9px",color:isSel?u.c:"rgba(255,255,255,0.3)",fontFamily:F}}>{f.dl===0?"Today":f.dl===1?"Tomorrow":`${f.dl}d`}</span>
                </button>
              );
            })}
          </div>

          {sf&&(
            <div style={{flex:1,overflowY:"auto",animation:"fadeUp 0.2s ease"}}>
              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"14px",padding:"16px 20px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"3px"}}>
                    <div style={{width:"6px",height:"6px",borderRadius:"50%",background:urg(sf.dl).c}}/>
                    <h3 style={{fontSize:"16px",fontWeight:"800",color:"#fff",margin:0,fontFamily:FH}}>{sf.name}</h3>
                  </div>
                  <p style={{fontSize:"11px",color:"rgba(255,255,255,0.35)",margin:"0 0 12px",fontFamily:F}}>{new Date(sf.date).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})} · {sf.dl===0?"Today":sf.dl===1?"Tomorrow":`${sf.dl} days away`}</p>
                  <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
                    {(sf.topics||[`Top 5 ways to celebrate ${sf.name} as a creator`,`${sf.name} special behind the scenes`,`My ${sf.name} content creation setup`,`How to grow your audience during ${sf.name}`]).map((t,i)=>(
                      <div key={i} style={{display:"flex",gap:"7px",padding:"6px 9px",borderRadius:"8px",background:"rgba(255,255,255,0.03)"}}>
                        <span style={{fontSize:"9px",color:"rgba(255,255,255,0.2)",flexShrink:0,marginTop:"1px",fontFamily:F}}>0{i+1}</span>
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
