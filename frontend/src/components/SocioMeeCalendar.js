import { useState, useEffect } from "react";

const BASE = "https://sociomee.in/api";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const urgencyColor = (days) => {
  if (days <= 0) return "#10b981";
  if (days <= 7) return "#ef4444";
  if (days <= 30) return "#f59e0b";
  return "#7c3aed";
};

const urgencyLabel = (days) => {
  if (days < 0) return "Happening now!";
  if (days === 0) return "Today!";
  if (days === 1) return "Tomorrow!";
  if (days <= 7) return `${days} days left`;
  return `${days} days away`;
};

// ── Line icons ─────────────────────────────────────────────
function IconCalendar({ size=18, color="currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function IconList({ size=14, color="currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
}
function IconChevronLeft({ size=15, color="rgba(255,255,255,0.6)" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
}
function IconChevronRight({ size=15, color="rgba(255,255,255,0.6)" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
}
function IconSparkle({ size=12, color="currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v5m0 8v5M4.2 4.2l3.5 3.5m8.6 8.6l3.5 3.5M3 12h5m8 0h5M4.2 19.8l3.5-3.5m8.6-8.6l3.5-3.5"/></svg>;
}
function IconVideo({ size=13, color="currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="15" height="14" rx="2"/><path d="M17 10l5-3v10l-5-3"/></svg>;
}
function IconBolt({ size=13, color="currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
}
function IconLightbulb({ size=13, color="currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>;
}
function IconClose({ size=12, color="currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}

export default function SocioMeeCalendar() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [view, setView] = useState("calendar"); // calendar | list

  useEffect(() => {
    fetch(`${BASE}/festivals/upcoming`)
      .then(r => r.json())
      .then(d => { setFestivals(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { setFestivals([]); setLoading(false); });
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const festivalMap = {};
  festivals.forEach(f => {
    const d = new Date(f.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!festivalMap[day]) festivalMap[day] = [];
      festivalMap[day].push(f);
    }
  });

  const upcoming = [...festivals]
    .filter(f => f.daysUntil >= -1)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 12);

  const selectedFest = selected !== null ? festivals.find((f,i) => i === selected) : null;

  return (
    <div style={{ display:"flex", height:"100vh", background:"#0a0a0a", fontFamily:"Poppins, sans-serif", overflow:"hidden" }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .cal-day:hover { background: rgba(124,58,237,0.12) !important; border-color: rgba(124,58,237,0.3) !important; }
        .fest-item:hover { background: rgba(124,58,237,0.08) !important; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 99px; }
      `}</style>

      {/* Left — Calendar + upcoming list */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", borderRight:"1px solid rgba(255,255,255,0.06)" }}>

        {/* Header */}
        <div style={{ padding:"16px 20px 12px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ width:"30px", height:"30px", borderRadius:"9px", background:"rgba(124,58,237,0.15)", border:"1px solid rgba(124,58,237,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}><IconCalendar size={15} color="#a78bfa"/></div>
            <div>
              <div style={{ fontSize:"14px", fontWeight:"800", color:"#fff", fontFamily:"Poppins,sans-serif" }}>SocioMee Calendar</div>
              <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.35)", margin:0, fontFamily:"Poppins,sans-serif" }}>Plan content around Indian festivals</p>
            </div>
          </div>
          <div style={{ display:"flex", gap:"4px", background:"rgba(255,255,255,0.04)", borderRadius:"10px", padding:"3px" }}>
            <button onClick={()=>setView("calendar")}
              style={{ display:"flex", alignItems:"center", gap:"6px", padding:"6px 14px", borderRadius:"8px", border:"none", background:view==="calendar"?"rgba(124,58,237,0.2)":"transparent", color:view==="calendar"?"#a78bfa":"rgba(255,255,255,0.35)", fontSize:"11px", fontWeight:"700", cursor:"pointer", fontFamily:"Poppins,sans-serif", transition:"all 0.15s" }}>
              <IconCalendar size={13}/> Calendar
            </button>
            <button onClick={()=>setView("list")}
              style={{ display:"flex", alignItems:"center", gap:"6px", padding:"6px 14px", borderRadius:"8px", border:"none", background:view==="list"?"rgba(124,58,237,0.2)":"transparent", color:view==="list"?"#a78bfa":"rgba(255,255,255,0.35)", fontSize:"11px", fontWeight:"700", cursor:"pointer", fontFamily:"Poppins,sans-serif", transition:"all 0.15s" }}>
              <IconList size={13}/> List
            </button>
          </div>
        </div>

        {view === "calendar" ? (
          <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column", alignItems:"center" }}>
            <div style={{ width:"100%", maxWidth:"480px", display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
              {/* Month nav */}
              <div style={{ padding:"16px 20px 12px", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
                <button onClick={prevMonth} style={{ width:"32px", height:"32px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><IconChevronLeft/></button>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:"16px", fontWeight:"800", color:"#fff", fontFamily:"Orbitron,monospace", letterSpacing:"1px" }}>{MONTHS[month].toUpperCase()}</div>
                  <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.3)", fontFamily:"Poppins,sans-serif" }}>{year}</div>
                </div>
                <button onClick={nextMonth} style={{ width:"32px", height:"32px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}><IconChevronRight/></button>
              </div>

              {/* Day headers */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"6px", padding:"0 20px 8px", flexShrink:0 }}>
                {DAYS.map(d => (
                  <div key={d} style={{ textAlign:"center", fontSize:"10px", fontWeight:"700", color:"rgba(255,255,255,0.25)", fontFamily:"Poppins,sans-serif", letterSpacing:"0.5px" }}>{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"6px", padding:"0 20px", flex:1, alignContent:"start" }}>
                {Array(firstDay).fill(null).map((_,i) => <div key={`e${i}`}/>)}
                {Array(daysInMonth).fill(null).map((_,i) => {
                  const day = i + 1;
                  const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                  const fests = festivalMap[day] || [];
                  const hasFest = fests.length > 0;
                  const festColor = hasFest ? urgencyColor(fests[0].daysUntil) : null;
                  return (
                    <div key={day} className="cal-day"
                      onClick={() => hasFest && setSelected(festivals.indexOf(fests[0]))}
                      style={{ aspectRatio:"1", borderRadius:"10px", border:`1px solid ${isToday?"rgba(124,58,237,0.5)":hasFest?`${festColor}40`:"rgba(255,255,255,0.05)"}`, background:isToday?"rgba(124,58,237,0.15)":hasFest?`${festColor}10`:"rgba(255,255,255,0.02)", cursor:hasFest?"pointer":"default", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"3px", transition:"all 0.15s", position:"relative" }}>
                      <span style={{ fontSize:"12px", fontWeight:isToday?"800":hasFest?"700":"400", color:isToday?"#a78bfa":hasFest?"#fff":"rgba(255,255,255,0.4)", fontFamily:"Poppins,sans-serif" }}>{day}</span>
                      {hasFest && <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:festColor }}/>}
                      {isToday && <div style={{ position:"absolute", bottom:"3px", left:"50%", transform:"translateX(-50%)", width:"4px", height:"4px", borderRadius:"50%", background:"#7c3aed" }}/>}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ padding:"14px 20px", borderTop:"1px solid rgba(255,255,255,0.04)", display:"flex", gap:"14px", flexShrink:0, justifyContent:"center" }}>
                {[["#ef4444","Within 7 days"],["#f59e0b","This month"],["#7c3aed","Upcoming"]].map(([c,l]) => (
                  <div key={l} style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                    <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:c }}/>
                    <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.3)", fontFamily:"Poppins,sans-serif" }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* List view */
          <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", justifyContent:"center" }}>
            <div style={{ width:"100%", maxWidth:"560px" }}>
              {loading ? (
                <div style={{ textAlign:"center", padding:"40px", color:"rgba(255,255,255,0.3)", fontSize:"13px" }}>Loading festivals…</div>
              ) : upcoming.map((f, i) => {
                const col = urgencyColor(f.daysUntil);
                const isSel = selected === festivals.indexOf(f);
                return (
                  <div key={i} className="fest-item"
                    onClick={() => setSelected(isSel ? null : festivals.indexOf(f))}
                    style={{ padding:"12px 14px", borderRadius:"12px", border:`1px solid ${isSel?col:"rgba(255,255,255,0.06)"}`, background:isSel?`${col}08`:"rgba(255,255,255,0.02)", marginBottom:"6px", cursor:"pointer", transition:"all 0.15s", animation:"fadeIn 0.3s ease" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                      <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:`${f.color||col}18`, border:`1px solid ${f.color||col}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>{f.emoji}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:"13px", fontWeight:"700", color:"#fff", fontFamily:"Poppins,sans-serif" }}>{f.name}</div>
                        <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.35)", fontFamily:"Poppins,sans-serif" }}>{new Date(f.date).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</div>
                      </div>
                      <div style={{ fontSize:"11px", fontWeight:"700", color:col, padding:"3px 8px", background:`${col}15`, borderRadius:"99px", border:`1px solid ${col}30`, flexShrink:0, fontFamily:"Poppins,sans-serif" }}>{urgencyLabel(f.daysUntil)}</div>
                    </div>
                    {isSel && f.topics?.length > 0 && (
                      <div style={{ marginTop:"10px", paddingTop:"10px", borderTop:"1px solid rgba(255,255,255,0.06)", animation:"fadeIn 0.2s ease" }}>
                        <p style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"10px", fontWeight:"700", color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 8px", fontFamily:"Poppins,sans-serif" }}><IconSparkle/> Recommended Topics</p>
                        <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
                          {f.topics.map((t,j) => (
                            <div key={j} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(124,58,237,0.06)", border:"1px solid rgba(124,58,237,0.15)", borderRadius:"8px", padding:"6px 10px" }}>
                              <span style={{ display:"flex", alignItems:"center", gap:"7px", fontSize:"12px", color:"rgba(255,255,255,0.8)", fontFamily:"Poppins,sans-serif" }}><IconVideo color="#a78bfa"/> {t}</span>
                              <button onClick={e=>{e.stopPropagation();navigator.clipboard.writeText(t)}}
                                style={{ fontSize:"10px", padding:"2px 8px", borderRadius:"6px", border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"rgba(255,255,255,0.35)", cursor:"pointer", fontFamily:"Poppins,sans-serif", flexShrink:0 }}>Copy</button>
                            </div>
                          ))}
                        </div>
                        {f.daysUntil <= 14 && f.daysUntil > 0 && (
                          <div style={{ marginTop:"8px", display:"flex", alignItems:"center", gap:"7px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"8px", padding:"8px 10px", fontSize:"11px", color:"rgba(255,255,255,0.6)", fontFamily:"Poppins,sans-serif" }}>
                            <IconBolt color="#ef4444"/> <span><strong>Upload NOW</strong> — {f.daysUntil} days left. Videos need 5-7 days to rank!</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right panel — Selected festival detail */}
      <div style={{ width:"300px", flexShrink:0, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {selectedFest ? (
          <div style={{ flex:1, overflowY:"auto", padding:"20px 16px", animation:"fadeIn 0.25s ease" }}>
            <button onClick={()=>setSelected(null)} style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"16px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.5)", fontSize:"11px", padding:"6px 12px", borderRadius:"8px", cursor:"pointer", fontFamily:"Poppins,sans-serif" }}><IconClose/> Close</button>

            <div style={{ textAlign:"center", marginBottom:"20px" }}>
              <div style={{ fontSize:"48px", marginBottom:"8px" }}>{selectedFest.emoji}</div>
              <h2 style={{ fontSize:"18px", fontWeight:"800", color:"#fff", margin:"0 0 4px", fontFamily:"Poppins,sans-serif" }}>{selectedFest.name}</h2>
              <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.4)", margin:"0 0 10px", fontFamily:"Poppins,sans-serif" }}>{new Date(selectedFest.date).toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
              <div style={{ display:"inline-flex", padding:"5px 14px", borderRadius:"99px", background:`${urgencyColor(selectedFest.daysUntil)}18`, border:`1px solid ${urgencyColor(selectedFest.daysUntil)}35`, fontSize:"12px", fontWeight:"700", color:urgencyColor(selectedFest.daysUntil), fontFamily:"Poppins,sans-serif" }}>{urgencyLabel(selectedFest.daysUntil)}</div>
            </div>

            <div style={{ background:"rgba(124,58,237,0.08)", border:"1px solid rgba(124,58,237,0.2)", borderRadius:"12px", padding:"14px", marginBottom:"14px" }}>
              <p style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"10px", fontWeight:"700", color:"rgba(124,58,237,0.8)", textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 8px", fontFamily:"Poppins,sans-serif" }}><IconSparkle color="#a78bfa"/> Optimal Upload Window</p>
              {selectedFest.daysUntil > 10 ? (
                <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)", margin:0, fontFamily:"Poppins,sans-serif" }}>Upload <strong style={{color:"#a78bfa"}}>{Math.max(1,selectedFest.daysUntil-8)} – {Math.max(1,selectedFest.daysUntil-5)} days before</strong> for maximum views at the peak.</p>
              ) : selectedFest.daysUntil > 0 ? (
                <p style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", color:"#ef4444", margin:0, fontFamily:"Poppins,sans-serif" }}><IconBolt/> Upload <strong>TODAY</strong> — Only {selectedFest.daysUntil} days left and videos need 5-7 days to rank!</p>
              ) : (
                <p style={{ fontSize:"12px", color:"#10b981", margin:0, fontFamily:"Poppins,sans-serif" }}>Festival is happening now! Post real-time content for maximum engagement.</p>
              )}
            </div>

            {selectedFest.topics?.length > 0 && (
              <div>
                <p style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"10px", fontWeight:"700", color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 8px", fontFamily:"Poppins,sans-serif" }}><IconSparkle/> Recommended Topics</p>
                <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                  {selectedFest.topics.map((t,j) => (
                    <div key={j} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"10px", padding:"8px 12px" }}>
                      <span style={{ display:"flex", alignItems:"center", gap:"7px", fontSize:"12px", color:"rgba(255,255,255,0.75)", fontFamily:"Poppins,sans-serif" }}><IconVideo color="#a78bfa"/> {t}</span>
                      <button onClick={()=>navigator.clipboard.writeText(t)}
                        style={{ fontSize:"10px", padding:"3px 8px", borderRadius:"6px", border:"1px solid rgba(255,255,255,0.08)", background:"transparent", color:"rgba(255,255,255,0.3)", cursor:"pointer", fontFamily:"Poppins,sans-serif", flexShrink:0 }}>Copy</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop:"14px", display:"flex", gap:"8px", background:"rgba(6,214,160,0.06)", border:"1px solid rgba(6,214,160,0.15)", borderRadius:"10px", padding:"10px 12px", fontSize:"11px", color:"rgba(255,255,255,0.5)", fontFamily:"Poppins,sans-serif", lineHeight:1.7 }}>
              <IconLightbulb size={14} color="#6ee7b7"/> <span>Indian festival videos get <strong style={{color:"#6ee7b7"}}>3–8x more views</strong> than regular content. Add festival name in your thumbnail for best CTR.</span>
            </div>
          </div>
        ) : (
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px", textAlign:"center" }}>
            <div style={{ width:"64px", height:"64px", borderRadius:"16px", background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.2)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"16px" }}><IconCalendar size={28} color="rgba(167,139,250,0.6)"/></div>
            <p style={{ fontSize:"14px", fontWeight:"700", color:"rgba(255,255,255,0.3)", margin:"0 0 8px", fontFamily:"Poppins,sans-serif" }}>Select a festival</p>
            <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.2)", margin:0, fontFamily:"Poppins,sans-serif", lineHeight:1.6 }}>Click any festival to see recommended topics and the optimal upload window.</p>

            {upcoming.slice(0,3).map((f,i) => (
              <div key={i} onClick={()=>setSelected(festivals.indexOf(f))}
                style={{ width:"100%", marginTop:"8px", padding:"10px 12px", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.02)", cursor:"pointer", display:"flex", alignItems:"center", gap:"8px", textAlign:"left" }}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(124,58,237,0.08)"}
                onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}>
                <span style={{ fontSize:"20px" }}>{f.emoji}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:"12px", fontWeight:"700", color:"#fff", margin:0, fontFamily:"Poppins,sans-serif", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</p>
                  <p style={{ fontSize:"10px", color:"rgba(255,255,255,0.3)", margin:0, fontFamily:"Poppins,sans-serif" }}>{urgencyLabel(f.daysUntil)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
