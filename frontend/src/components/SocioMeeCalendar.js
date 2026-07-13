import { useState, useEffect } from "react";
const BASE = "https://sociomeeai.com/api";
const FONT = "'DM Sans','Syne',sans-serif";
const FONT_HEAD = "'Poppins',sans-serif";
const C = { bg:"#080810", border:"rgba(255,255,255,0.07)", muted:"rgba(255,255,255,0.35)", dim:"rgba(255,255,255,0.18)", white:"#fff" };
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function daysInMonth(y,m){ return new Date(y,m+1,0).getDate(); }
function firstDay(y,m){ return new Date(y,m,1).getDay(); }

const URGENCY = (daysLeft) => {
  if (daysLeft <= 7) return { color:"#f87171", label:"This week" };
  if (daysLeft <= 30) return { color:"#fb923c", label:"This month" };
  return { color:"rgba(255,255,255,0.35)", label:"Upcoming" };
};

export default function SocioMeeCalendar({ user }) {
  const rawPlan = user?.plan || user?.plan_label || "free";
  const plan = rawPlan.toLowerCase().includes("premium") ? "premium" : rawPlan.toLowerCase().includes("pro") ? "pro" : "free";
  const isPro = plan === "pro" || plan === "premium";

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("calendar");

  useEffect(() => {
    fetch(`${BASE}/festivals/upcoming`)
      .then(r => r.json())
      .then(data => { setFestivals(Array.isArray(data) ? data : data.festivals || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const festMap = {};
  festivals.forEach(f => {
    const d = new Date(f.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!festMap[key]) festMap[key] = [];
    festMap[key].push(f);
  });

  const upcoming = [...festivals]
    .map(f => ({ ...f, daysLeft: Math.ceil((new Date(f.date) - today) / 86400000) }))
    .filter(f => f.daysLeft >= 0)
    .sort((a,b) => a.daysLeft - b.daysLeft);

  const prevMonth = () => { if (month===0) { setMonth(11); setYear(y=>y-1); } else setMonth(m=>m-1); };
  const nextMonth = () => { if (month===11) { setMonth(0); setYear(y=>y+1); } else setMonth(m=>m+1); };

  const totalDays = daysInMonth(year, month);
  const startDay = firstDay(year, month);
  const cells = Array(startDay).fill(null).concat(Array.from({length:totalDays},(_,i)=>i+1));
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedFest = selected !== null ? upcoming[selected] : null;

  const skel = (w="100%",h="40px") => ({ width:w, height:h, borderRadius:"8px", background:"rgba(255,255,255,0.04)", animation:"skpulse 1.4s ease-in-out infinite", display:"block" });

  return (
    <div style={{ display:"flex", height:"100vh", background:C.bg, fontFamily:FONT, overflow:"hidden" }}>
      <style>{`
        @keyframes skpulse{0%,100%{opacity:0.4}50%{opacity:1}}
        .cal-day:hover{background:rgba(255,255,255,0.06)!important;}
        .cal-fest:hover{background:rgba(255,255,255,0.07)!important;border-color:rgba(255,255,255,0.15)!important;}
        .cal-btn:hover{background:rgba(255,255,255,0.08)!important;color:#fff!important;}
        ::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:99px}
      `}</style>

      {/* Left — Calendar */}
      <div style={{ flex:"0 0 500px", display:"flex", flexDirection:"column", borderRight:"1px solid rgba(255,255,255,0.06)", overflow:"hidden" }}>
        {/* Header */}
        <div style={{ padding:"16px 20px 12px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div>
            <h2 style={{ fontSize:"20px", fontWeight:"700", color:C.white, margin:"0 0 2px", fontFamily:FONT_HEAD }}>{MONTHS[month]} {year}</h2>
            <p style={{ fontSize:"11px", color:C.muted, margin:0 }}>Indian Festival Calendar</p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
            <button onClick={prevMonth} className="cal-btn" style={{ width:"30px", height:"30px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", color:C.muted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button onClick={()=>{setMonth(today.getMonth());setYear(today.getFullYear());}} className="cal-btn" style={{ padding:"5px 12px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", color:C.muted, fontSize:"11px", fontWeight:"600", cursor:"pointer", fontFamily:FONT, transition:"all 0.15s" }}>Today</button>
            <button onClick={nextMonth} className="cal-btn" style={{ width:"30px", height:"30px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", color:C.muted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", padding:"10px 16px 0", flexShrink:0 }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign:"center", fontSize:"10px", fontWeight:"700", color:"rgba(255,255,255,0.25)", padding:"4px 0", letterSpacing:"0.5px", textTransform:"uppercase" }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ flex:1, overflowY:"auto", padding:"4px 16px 16px" }}>
          {loading ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"3px", marginTop:"4px" }}>
              {Array(35).fill(0).map((_,i)=><div key={i} style={{ height:"52px", borderRadius:"10px", background:"rgba(255,255,255,0.03)", animation:"skpulse 1.4s ease-in-out infinite" }}/>)}
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"3px", marginTop:"4px" }}>
              {cells.map((day, i) => {
                if (!day) return <div key={i}/>;
                const isToday = day===today.getDate() && month===today.getMonth() && year===today.getFullYear();
                const key = `${year}-${month}-${day}`;
                const fests = festMap[key] || [];
                const hasFest = fests.length > 0;
                const urgency = hasFest ? URGENCY(Math.ceil((new Date(year,month,day) - today)/86400000)) : null;
                return (
                  <div key={i} className="cal-day" onClick={()=>hasFest&&setSelected(upcoming.findIndex(f=>f.name===fests[0].name))}
                    style={{ height:"52px", borderRadius:"10px", border:`1px solid ${isToday?"rgba(255,255,255,0.25)":hasFest?"rgba(255,255,255,0.1)":"transparent"}`, background:isToday?"rgba(255,255,255,0.08)":hasFest?"rgba(255,255,255,0.04)":"transparent", cursor:hasFest?"pointer":"default", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"4px", transition:"all 0.15s", position:"relative" }}>
                    <span style={{ fontSize:"13px", fontWeight:isToday?"800":"500", color:isToday?"#fff":"rgba(255,255,255,0.7)", fontFamily:isToday?FONT_HEAD:FONT }}>{day}</span>
                    {hasFest && <div style={{ display:"flex", gap:"2px" }}>
                      {fests.slice(0,3).map((_,j)=><div key={j} style={{ width:"4px", height:"4px", borderRadius:"50%", background:urgency.color }}/>)}
                    </div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Legend */}
        <div style={{ padding:"10px 20px", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", gap:"16px", flexShrink:0 }}>
          {[{color:"#f87171",label:"This week"},{color:"#fb923c",label:"This month"},{color:"rgba(255,255,255,0.35)",label:"Upcoming"}].map(l=>(
            <div key={l.label} style={{ display:"flex", alignItems:"center", gap:"5px" }}>
              <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:l.color }}/>
              <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.35)", fontFamily:FONT }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Festival detail */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"16px 20px 12px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <span style={{ fontSize:"13px", fontWeight:"700", color:C.white, fontFamily:FONT_HEAD }}>Upcoming Festivals</span>
          <span style={{ fontSize:"11px", color:C.muted }}>{upcoming.length} festivals</span>
        </div>

        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
          {/* Festival list */}
          <div style={{ width:"220px", flexShrink:0, borderRight:"1px solid rgba(255,255,255,0.06)", overflowY:"auto", padding:"10px 8px" }}>
            {loading ? (
              [1,2,3,4,5].map(i=><div key={i} style={{ ...skel(),height:"52px",marginBottom:"4px" }}/>)
            ) : upcoming.slice(0,15).map((f,i) => {
              const u = URGENCY(f.daysLeft);
              const isSel = selected===i;
              return (
                <div key={i} className="cal-fest" onClick={()=>setSelected(isSel?null:i)}
                  style={{ padding:"9px 10px", borderRadius:"10px", border:`1px solid ${isSel?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.06)"}`, background:isSel?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.02)", cursor:"pointer", marginBottom:"3px", transition:"all 0.15s" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"7px" }}>
                    <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:u.color, flexShrink:0 }}/>
                    <span style={{ fontSize:"12px", fontWeight:"600", color:C.white, fontFamily:FONT, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:"4px", paddingLeft:"13px" }}>
                    <span style={{ fontSize:"10px", color:C.muted, fontFamily:FONT }}>{new Date(f.date).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</span>
                    <span style={{ fontSize:"10px", color:u.color, fontFamily:FONT }}>{f.daysLeft===0?"Today":f.daysLeft===1?"Tomorrow":`${f.daysLeft}d`}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Festival detail */}
          <div style={{ flex:1, overflowY:"auto", padding:"20px" }}>
            {!selectedFest ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:"14px", opacity:0.4 }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <div style={{ textAlign:"center" }}>
                  <p style={{ fontSize:"14px", fontWeight:"600", color:C.white, margin:"0 0 6px", fontFamily:FONT_HEAD }}>Select a festival</p>
                  <p style={{ fontSize:"12px", color:C.muted, margin:0, fontFamily:FONT }}>Click any festival to see content ideas and the optimal upload window.</p>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom:"20px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"6px" }}>
                    <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:URGENCY(selectedFest.daysLeft).color }}/>
                    <h2 style={{ fontSize:"22px", fontWeight:"800", color:C.white, margin:0, fontFamily:FONT_HEAD }}>{selectedFest.name}</h2>
                  </div>
                  <p style={{ fontSize:"13px", color:C.muted, margin:0, fontFamily:FONT }}>
                    {new Date(selectedFest.date).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})} · {selectedFest.daysLeft===0?"Today":selectedFest.daysLeft===1?"Tomorrow":`${selectedFest.daysLeft} days away`}
                  </p>
                </div>

                {selectedFest.daysLeft <= 30 && (
                  <div style={{ background:"rgba(251,146,60,0.08)", border:"1px solid rgba(251,146,60,0.2)", borderRadius:"12px", padding:"14px 16px", marginBottom:"16px", display:"flex", gap:"10px" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:"2px" }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <p style={{ fontSize:"12px", color:"rgba(251,146,60,0.9)", margin:0, fontFamily:FONT, lineHeight:1.6 }}>
                      Start creating content <strong>{selectedFest.daysLeft <= 7 ? "immediately" : "this week"}</strong>. Festival content performs best when published 3 to 7 days before the event.
                    </p>
                  </div>
                )}

                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", padding:"16px", marginBottom:"14px" }}>
                  <p style={{ fontSize:"11px", fontWeight:"700", color:C.muted, textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 12px", fontFamily:FONT }}>Content Ideas</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                    {(selectedFest.topics || [
                      `Top 5 ways to celebrate ${selectedFest.name} as a creator`,
                      `${selectedFest.name} special: behind the scenes`,
                      `My ${selectedFest.name} content creation setup`,
                      `How to grow your audience during ${selectedFest.name}`,
                    ]).map((topic, i) => (
                      <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:"8px", padding:"8px 10px", borderRadius:"9px", background:"rgba(255,255,255,0.03)" }}>
                        <span style={{ fontSize:"10px", color:C.dim, fontFamily:FONT, marginTop:"2px", flexShrink:0 }}>0{i+1}</span>
                        <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.7)", margin:0, fontFamily:FONT, lineHeight:1.6 }}>{topic}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", padding:"16px", marginBottom:"14px" }}>
                  <p style={{ fontSize:"11px", fontWeight:"700", color:C.muted, textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 12px", fontFamily:FONT }}>Optimal Upload Window</p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                    {[
                      { label:"Best time to post", value:"7 to 10 days before" },
                      { label:"Peak engagement", value:"Day of the festival" },
                      { label:"Best platforms", value:"YouTube, Instagram, Threads" },
                      { label:"Content type", value:"Short + Long form both" },
                    ].map(item=>(
                      <div key={item.label} style={{ padding:"10px 12px", borderRadius:"10px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
                        <p style={{ fontSize:"9px", color:C.dim, fontFamily:FONT, margin:"0 0 3px", textTransform:"uppercase", letterSpacing:"0.5px" }}>{item.label}</p>
                        <p style={{ fontSize:"12px", fontWeight:"600", color:C.white, margin:0, fontFamily:FONT }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background:"rgba(110,231,183,0.06)", border:"1px solid rgba(110,231,183,0.15)", borderRadius:"12px", padding:"12px 14px", display:"flex", gap:"8px" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:"1px" }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <p style={{ fontSize:"11px", color:"rgba(110,231,183,0.8)", margin:0, fontFamily:FONT, lineHeight:1.7 }}>Indian festival videos get <strong>3 to 8x more views</strong> than regular content. Add the festival name in your thumbnail for best CTR.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
