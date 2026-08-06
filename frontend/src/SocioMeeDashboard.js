import React,{useState,useEffect,useRef,useCallback} from "react";
import {LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer} from "recharts";
const BASE="https://sociomeeai.com/api";
const PLATS=[
  {id:"youtube",  label:"YouTube",  color:"#ff0000",statLabel:"Subscribers",stat2Label:"Views",
   icon:({s=18})=><svg viewBox="0 0 24 24" width={s} height={s}><path fill="#ff0000" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8z"/><path fill="#fff" d="M9.8 15.5V8.5l6.4 3.5-6.4 3.5z"/></svg>},
  {id:"instagram",label:"Instagram",color:"#e1306c",statLabel:"Followers",stat2Label:"Posts",   icon:({s=18})=><img src="/icons/instagram.png" width={s} height={s} style={{objectFit:"contain"}} alt=""/>},
  {id:"threads",  label:"Threads",  color:"#e0e0e0",statLabel:"Followers",stat2Label:"",        icon:({s=18})=><img src="/icons/threads.png"   width={s} height={s} style={{objectFit:"contain"}} alt=""/>},
  {id:"facebook", label:"Facebook", color:"#1877f2",statLabel:"Page Fans",stat2Label:"",        icon:({s=18})=><img src="/icons/facebook.png"  width={s} height={s} style={{objectFit:"contain"}} alt=""/>},
  {id:"linkedin", label:"LinkedIn", color:"#0a66c2",statLabel:"Connected", stat2Label:"",       icon:({s=18})=><img src="/icons/linkedin.png"  width={s} height={s} style={{objectFit:"contain"}} alt=""/>},
  {id:"pinterest",label:"Pinterest",color:"#e60023",statLabel:"Followers",stat2Label:"Pins",    icon:({s=18})=><img src="/icons/pinterest.png" width={s} height={s} style={{objectFit:"contain"}} alt=""/>},
  {id:"telegram", label:"Telegram", color:"#2aabee",statLabel:"Members",  stat2Label:"Posts",
   icon:({s=18})=><svg viewBox="0 0 24 24" width={s} height={s} fill="#2aabee"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>},
  {id:"discord",  label:"Discord",  color:"#5865f2",statLabel:"Members",  stat2Label:"Posts",   icon:({s=18})=><svg viewBox="0 0 24 24" width={s} height={s} fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>},
];;
const fmt=n=>n==null?"0":n>=1e6?(n/1e6).toFixed(1)+"M":n>=1e3?(n/1e3).toFixed(1)+"K":String(n);
const Glass=({children,style={},onClick})=>(<div onClick={onClick} style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,transition:"border-color 0.2s,background 0.2s",...style,cursor:onClick?"pointer":undefined}} onMouseEnter={onClick?e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.18)";e.currentTarget.style.background="rgba(255,255,255,0.07)";}:undefined} onMouseLeave={onClick?e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";e.currentTarget.style.background=style.background||"rgba(255,255,255,0.04)";}:undefined}>{children}</div>);
const Skel=({w="100%",h=14,r=6,style={}})=>(<div style={{width:w,height:h,borderRadius:r,background:"rgba(255,255,255,0.06)",overflow:"hidden",...style}}><div style={{width:"100%",height:"100%",backgroundImage:"linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0) 100%)",backgroundSize:"200% 100%",animation:"shimmer 1.4s ease infinite"}}/></div>);
function SparkMini({vals=[],color,h=24}){if(!vals.length)return null;const W=160,H=h,p=2,max=Math.max(...vals,1);const xs=vals.map((_,i)=>p+(i/(vals.length-1||1))*(W-p*2));const ys=vals.map(v=>H-p-(v/max)*(H-p*2));const path=vals.map((_,i)=>`${i===0?"M":"L"}${xs[i]},${ys[i]}`).join(" ");const area=`${path} L${xs[xs.length-1]},${H} L${xs[0]},${H} Z`;const gid=`sm${color.replace(/\W/g,"")}${h}`;return(<svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"><defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs><path d={area} fill={`url(#${gid})`}/><path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>);}
function MultiLineChart({datasets,height=130}){const[hov,setHov]=useState(null);const[hovX,setHovX]=useState(null);const W=600,H=height,pad=8;const allVals=datasets.flatMap(d=>d.vals);const maxV=Math.max(...allVals,1);const len=Math.max(...datasets.map(d=>d.vals.length),1);const xs=Array.from({length:len},(_,i)=>pad+(i/(len-1||1))*(W-pad*2));const paths=datasets.map(ds=>{const ys=ds.vals.map(v=>H-pad-(v/maxV)*(H-pad*2));const path=ds.vals.map((_,i)=>`${i===0?"M":"L"}${xs[i]},${ys[i]}`).join(" ");const area=`${path} L${xs[ds.vals.length-1]},${H} L${xs[0]},${H} Z`;return{...ds,ys,path,area};});const handleMove=e=>{const rect=e.currentTarget.getBoundingClientRect();const mx=(e.clientX-rect.left)/rect.width*W;const idx=Math.round((mx-pad)/(W-pad*2)*(len-1));setHovX(Math.max(0,Math.min(len-1,idx)));};return(<div style={{position:"relative"}}><svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{display:"block",overflow:"visible",cursor:"crosshair"}} onMouseMove={handleMove} onMouseLeave={()=>setHovX(null)}><defs>{paths.map((p,i)=>(<linearGradient key={i} id={`mlg${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={p.color} stopOpacity="0.18"/><stop offset="100%" stopColor={p.color} stopOpacity="0"/></linearGradient>))}</defs>{paths.map((p,i)=>(<g key={i}><path d={p.area} fill={`url(#mlg${i})`}/><path d={p.path} fill="none" stroke={p.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={hov!=null&&hov!==i?0.25:1} style={{transition:"opacity 0.2s"}}/></g>))}{hovX!=null&&(<><line x1={xs[hovX]} y1={pad} x2={xs[hovX]} y2={H} stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="3 3"/>{paths.map((p,i)=>(p.vals[hovX]>0&&<circle key={i} cx={xs[hovX]} cy={p.ys[hovX]} r="4" fill={p.color} stroke="#000" strokeWidth="1.5"/>))}<rect x={Math.min(xs[hovX]+8,W-130)} y={pad} width="122" height={paths.length*16+10} rx="6" fill="rgba(8,8,8,0.96)" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>{paths.map((p,i)=>(<g key={i}><rect x={Math.min(xs[hovX]+14,W-124)} y={pad+6+i*16} width="6" height="6" rx="2" fill={p.color}/><text x={Math.min(xs[hovX]+24,W-114)} y={pad+13+i*16} fill="rgba(255,255,255,0.8)" fontSize="10" fontFamily="DM Sans,sans-serif">{p.label}: {fmt(p.vals[hovX])}</text></g>))}</>)}</svg><div style={{display:"flex",gap:16,marginTop:8,flexWrap:"wrap"}}>{paths.map((p,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",opacity:hov!=null&&hov!==i?0.3:1,transition:"opacity 0.2s"}} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}><div style={{width:20,height:2,borderRadius:99,background:p.color}}/><span style={{fontSize:10,color:"rgba(255,255,255,0.45)"}}>{p.label}</span></div>))}</div></div>);}
function PlatDonut({p:plt,d,size}){
  size=size||88;
  const[hov,setHov]=React.useState(null);
  const cx=size/2,cy=size/2,R=size*0.34,sw=size*0.14;
  const connected=d&&d.connected;
  const segs=[];
  if(!connected){segs.push({label:"Offline",v:1,color:"rgba(255,255,255,0.05)"});}
  else{
    const f=d.subscribers!=null?d.subscribers:d.followers!=null?d.followers:d.member_count!=null?d.member_count:0;
    const p2=d.media_count!=null?d.media_count:d.pin_count!=null?d.pin_count:d.total_posts!=null?d.total_posts:0;
    const v=d.total_views||0;
    if(plt.id==="youtube"){segs.push({label:"Subs",v:Math.max(f,1),color:plt.color});segs.push({label:"Views",v:Math.max(Math.round(v/1000)||1,1),color:plt.color+"55"});}
    else if(plt.id==="linkedin"){segs.push({label:"Active",v:3,color:plt.color});segs.push({label:"Network",v:7,color:plt.color+"44"});}
    else{segs.push({label:plt.statLabel,v:Math.max(f,1),color:plt.color});if(p2>0)segs.push({label:plt.stat2Label||"Posts",v:Math.max(p2,1),color:plt.color+"44"});else segs.push({label:"No posts",v:1,color:"rgba(255,255,255,0.04)"});}
  }
  const total=segs.reduce((s,x)=>s+x.v,0)||1;
  let angle=-90;
  const arcs=segs.map((seg,i)=>{
    const pct=seg.v/total,deg=Math.max(pct*360,2);
    const r1=angle*Math.PI/180,r2=(angle+deg)*Math.PI/180;
    const x1=cx+R*Math.cos(r1),y1=cy+R*Math.sin(r1),x2=cx+R*Math.cos(r2),y2=cy+R*Math.sin(r2);
    const arcD="M "+x1+" "+y1+" A "+R+" "+R+" 0 "+(deg>180?1:0)+" 1 "+x2+" "+y2;
    angle+=deg;
    return Object.assign({},seg,{d:arcD,pct:Math.round(pct*100),i});
  });
  const active=hov!=null?arcs[hov]:null;
  const mainStat=connected?(d.subscribers!=null?d.subscribers:d.followers!=null?d.followers:d.member_count!=null?d.member_count:0):null;
  const vb="0 0 "+size+" "+size;
  return(
    <svg width={size} height={size} viewBox={vb}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={sw}/>
      {arcs.map((a,i)=>(<path key={i} d={a.d} fill="none" stroke={a.color} strokeWidth={hov===i?sw*1.25:sw} strokeLinecap="butt" style={{cursor:"pointer",transition:"stroke-width 0.15s"}} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}/>))}
      <circle cx={cx} cy={cy} r={R-sw/2} fill="rgba(0,0,0,0.75)"/>
      {active?(<><text x={cx} y={cy-3} textAnchor="middle" fill="#ffffff" fontSize={size*0.13} fontWeight="900" fontFamily="DM Sans,sans-serif">{active.pct}%</text><text x={cx} y={cy+size*0.13} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={size*0.09} fontFamily="DM Sans,sans-serif">{active.label.slice(0,7)}</text></>)
      :connected?(<><text x={cx} y={cy-2} textAnchor="middle" fill="#ffffff" fontSize={size*0.16} fontWeight="900" fontFamily="DM Sans,sans-serif">{fmt(mainStat)}</text><text x={cx} y={cy+size*0.14} textAnchor="middle" fill="rgba(255,255,255,0.28)" fontSize={size*0.09} fontFamily="DM Sans,sans-serif">{plt.statLabel.slice(0,7)}</text></>)
      :(<text x={cx} y={cy+4} textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize={size*0.1} fontFamily="DM Sans,sans-serif">Offline</text>)}
    </svg>
  );
}

function PlatCard({p,d,onClick,loading}){const connected=d?.connected;const stat=d?.subscribers??d?.followers??d?.member_count??null;const stat2=d?.media_count??d?.pin_count??d?.total_posts??null;const Icon=p.icon;return(<Glass onClick={connected?onClick:undefined} style={{padding:16,position:"relative",overflow:"hidden",background:"rgba(255,255,255,0.03)"}}><div style={{position:"absolute",top:0,left:0,right:0,height:2,background:connected?`linear-gradient(90deg,${p.color},${p.color}44)`:"rgba(255,255,255,0.04)",borderRadius:"16px 16px 0 0"}}/><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:24,height:24,borderRadius:7,background:`${p.color}18`,border:`1px solid ${p.color}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon s={14}/></div><span style={{fontSize:12,fontWeight:800,color:connected?"#f5f5f7":"rgba(255,255,255,0.3)"}}>{p.label}</span></div><div style={{width:8,height:8,borderRadius:"50%",background:connected?"#34d399":"rgba(255,255,255,0.15)",boxShadow:connected?"0 0 8px #34d399,0 0 16px #34d39933":undefined,flexShrink:0}}/></div>{loading?(<div style={{display:"flex",justifyContent:"center",marginBottom:10}}><Skel w={88} h={88} r={44}/></div>):(<div style={{display:"flex",justifyContent:"center",marginBottom:10}}><PlatDonut p={p} d={d} size={88}/></div>)}{connected&&!loading&&(<div style={{borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:8}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div>{stat!=null&&<div style={{fontSize:14,fontWeight:900,color:"#f5f5f7"}}>{fmt(stat)}<span style={{fontSize:8,color:"rgba(255,255,255,0.3)",marginLeft:3}}>{p.statLabel}</span></div>}{stat2!=null&&p.stat2Label&&<div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:1}}>{stat2} {p.stat2Label}</div>}</div>{d.week_change!=null&&<div style={{fontSize:10,fontWeight:800,color:d.week_change>=0?"#34d399":"#f87171"}}>{d.week_change>=0?"+":""}{d.week_change}%</div>}</div></div>)}</Glass>);}
function StatCard({label,value,sub,color,loading,icon}){return(<Glass style={{padding:"16px 18px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}><div style={{fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:"1.2px",color:"rgba(255,255,255,0.3)"}}>{label}</div><div style={{padding:7,borderRadius:8,background:`${color}18`,color}}>{icon}</div></div>{loading?<Skel h={28} r={6} style={{marginBottom:6}}/>:<div style={{fontSize:26,fontWeight:900,color:"#f5f5f7",lineHeight:1,marginBottom:5}}>{value}</div>}{loading?<Skel h={10} w="55%"/>:<div style={{fontSize:10,color,fontWeight:600}}>{sub}</div>}<div style={{marginTop:12,height:1.5,background:"rgba(255,255,255,0.05)",borderRadius:99}}><div style={{height:"100%",width:"65%",background:color,borderRadius:99,opacity:0.4}}/></div></Glass>);}
function InsightsPanel({data,conn}){const topP=[...conn].sort((a,b)=>{const da=data[a.id],db=data[b.id];return(db?.subscribers??db?.followers??db?.member_count??0)-(da?.subscribers??da?.followers??da?.member_count??0);})[0];const tw=data.telegram?.this_week||0,wc=data.telegram?.week_change??0;const connPct=Math.round((conn.length/8)*100);const totalReach=conn.reduce((s,p)=>{const d=data[p.id];return s+(d?.subscribers??d?.followers??d?.member_count??0);},0);const metrics=[{label:"Platform Coverage",v:conn.length,max:8,color:"#a78bfa"},{label:"Telegram Activity",v:Math.min(tw,10),max:10,color:"#2aabee"},{label:"IG Posts",v:Math.min(data.instagram?.media_count||0,50),max:50,color:"#e1306c"},{label:"Pinterest Pins",v:Math.min(data.pinterest?.pin_count||0,100),max:100,color:"#e60023"}];const tip=conn.length===0?"Connect a platform to get AI tips.":conn.length<4?`On ${conn.length} platforms. Creators on 5+ grow 3x faster.`:tw===0?"Post to Telegram consistently to build momentum.":wc>50?"Great momentum! Cross-post to Instagram now.":"Analyze best content and double down on it.";return(<div style={{display:"flex",flexDirection:"column",gap:10}}><div style={{fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:"1.5px",color:"rgba(255,255,255,0.3)",marginBottom:2}}>AI Insights</div><Glass style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:14,background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.15)"}}><svg width="58" height="58" viewBox="0 0 58 58" style={{flexShrink:0}}><circle cx="29" cy="29" r="23" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7"/><circle cx="29" cy="29" r="23" fill="none" stroke="#a78bfa" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(connPct/100)*144.5} 144.5`} transform="rotate(-90 29 29)"/><text x="29" y="34" textAnchor="middle" fill="#a78bfa" fontSize="12" fontWeight="900" fontFamily="DM Sans,sans-serif">{conn.length}/8</text></svg><div><div style={{fontSize:13,fontWeight:900,color:"#f5f5f7"}}>Coverage</div><div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:2}}>{conn.length===8?"All active!":`${8-conn.length} to connect`}</div><div style={{fontSize:10,color:"#a78bfa",marginTop:4,fontWeight:700}}>{fmt(totalReach)} total reach</div></div></Glass>{metrics.map((b,i)=>(<Glass key={i} style={{padding:"10px 14px"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}><span style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>{b.label}</span><span style={{fontSize:10,fontWeight:800,color:"#f5f5f7"}}>{b.v}<span style={{color:"rgba(255,255,255,0.2)"}}>/{b.max}</span></span></div><div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min((b.v/b.max)*100,100)}%`,background:`linear-gradient(90deg,${b.color},${b.color}88)`,borderRadius:99,transition:"width 0.8s ease"}}/></div></Glass>))}{topP&&(<Glass style={{padding:"10px 14px",background:`${topP.color}0a`,border:`1px solid ${topP.color}22`}}><div style={{fontSize:8,fontWeight:800,textTransform:"uppercase",letterSpacing:"1px",color:"rgba(255,255,255,0.3)",marginBottom:6}}>Top Platform</div><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:topP.color,boxShadow:`0 0 6px ${topP.color}`}}/><span style={{fontSize:12,fontWeight:800,color:"#f5f5f7"}}>{topP.label}</span><span style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginLeft:"auto"}}>{fmt(data[topP.id]?.subscribers??data[topP.id]?.followers??data[topP.id]?.member_count??0)}</span></div></Glass>)}{tw>0&&(<Glass style={{padding:"10px 14px",background:wc>=0?"rgba(52,211,153,0.06)":"rgba(248,113,113,0.06)",border:`1px solid ${wc>=0?"rgba(52,211,153,0.18)":"rgba(248,113,113,0.18)"}`}}><div style={{display:"flex",alignItems:"center",gap:8}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={wc>=0?"#34d399":"#f87171"} strokeWidth="2.5"><polyline points={wc>=0?"22 7 13.5 15.5 8.5 10.5 2 17":"2 7 10.5 15.5 15.5 10.5 22 17"}/></svg><span style={{fontSize:11,fontWeight:800,color:"#f5f5f7"}}>{tw} posts this week</span><span style={{fontSize:10,fontWeight:700,color:wc>=0?"#34d399":"#f87171",marginLeft:"auto"}}>{wc>=0?"+":""}{wc}%</span></div></Glass>)}<Glass style={{padding:"10px 14px"}}><div style={{fontSize:8,fontWeight:800,textTransform:"uppercase",letterSpacing:"1px",color:"rgba(255,255,255,0.25)",marginBottom:5}}>Smart Tip</div><div style={{fontSize:11,color:"rgba(255,255,255,0.48)",lineHeight:1.6}}>{tip}</div></Glass></div>);}

function UnifiedChart({userId,tgDaily,data}){
  const[days,setDays]=React.useState(30);
  const[chartType,setChartType]=React.useState("line");
  const[viewMode,setViewMode]=React.useState("combined");
  const[hovBar,setHovBar]=React.useState(null);
  const[hovPie,setHovPie]=React.useState(null);
  const[ytData,setYtData]=React.useState([]);
  const[loading,setLoading]=React.useState(true);
  const[hovX,setHovX]=React.useState(null);
  const[hov,setHov]=React.useState(null);

  const[allData,setAllData]=React.useState({});
  React.useEffect(()=>{
    setLoading(true);
    Promise.all([
      fetch(`${BASE}/youtube/analytics/${userId}?days=${days}`).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(`${BASE}/threads/insights?user_id=${userId}&days=${days}`).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(`${BASE}/instagram/insights?user_id=${userId}&days=${days}`).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(`${BASE}/pinterest/insights?user_id=${userId}&days=${days}`).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch(`${BASE}/discord/analytics?user_id=${userId}`).then(r=>r.ok?r.json():null).catch(()=>null),
    ]).then(([yt,th,ig,pi,dc])=>{
      setAllData({yt,th,ig,pi,dc});
      setYtData(yt?.chart_data||[]);
      setLoading(false);
    });
  },[userId,days]);

  // LinkedIn: flat line at 1 if connected (no time-series data available)
  const liConn=data?.linkedin?.connected;
  const liVals=liConn?Array(days).fill(1):[];
  // Discord: use total_posts as flat signal
  const dcData=allData.dc;
  const dcPosts=dcData?.total_posts||0;
  const dcConn=data?.discord?.connected;
  const dcVals=dcConn?[...Array(days-1).fill(0),dcPosts>0?dcPosts:0]:[]; 
  const PLAT_DATASETS=[
    {key:"yt",  label:"YouTube Views",   color:"#ff0000", vals:(allData.yt?.chart_data||[]).map(d=>d.views||0)},
    {key:"th",  label:"Threads Views",   color:"#e0e0e0", vals:(allData.th?.chart_data||[]).map(d=>d.views||0)},
    {key:"ig",  label:"Instagram Reach", color:"#e1306c", vals:(allData.ig?.chart_data||[]).map(d=>d.reach||d.impressions||d.views||0)},
    {key:"pi",  label:"Pinterest Impr",  color:"#e60023", vals:(allData.pi?.chart_data||[]).map(d=>d.impressions||d.views||0)},
    {key:"tg",  label:"Telegram Posts",  color:"#2aabee", vals:tgDaily.slice(-days)},
  ];
  const datasets=PLAT_DATASETS.filter(d=>d.vals.length>0&&d.vals.some(v=>v>0));

  const H=chartType==="donut"?280:chartType==="bar"?280:chartType==="pie"?280:300;
  const W=1000,pad=10;
  const allVals=datasets.flatMap(d=>d.vals);
  const maxV=Math.max(...allVals,1);
  const len=Math.max(...datasets.map(d=>d.vals.length),1);
  const xs=Array.from({length:len},(_,i)=>pad+(i/(len-1||1))*(W-pad*2));
  const smoothPath=(xs,ys,yMin,yMax)=>{
    const clamp=v=>Math.max(yMin,Math.min(yMax,v));
    if(xs.length<2)return"";
    if(xs.length===2)return`M${xs[0]},${ys[0]} L${xs[1]},${ys[1]}`;
    let d=`M${xs[0]},${ys[0]}`;
    for(let i=0;i<xs.length-1;i++){
      const x0=xs[i-1]??xs[i],y0=ys[i-1]??ys[i];
      const x1=xs[i],y1=ys[i];
      const x2=xs[i+1],y2=ys[i+1];
      const x3=xs[i+2]??x2,y3=ys[i+2]??y2;
      const cp1x=x1+(x2-x0)/6,cp1y=clamp(y1+(y2-y0)/6);
      const cp2x=x2-(x3-x1)/6,cp2y=clamp(y2-(y3-y1)/6);
      d+=` C${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`;
    }
    return d;
  };
  const paths=datasets.map(ds=>{
    const ys=ds.vals.map(v=>H-pad-(v/maxV)*(H-pad*2));
    const pts=smoothPath(xs.slice(0,ds.vals.length),ys,pad,H-pad);
    const area=`${pts} L${xs[ds.vals.length-1]},${H} L${xs[0]},${H} Z`;
    return{...ds,ys,path:pts,area};
  });

  const total=datasets.reduce((s,d)=>s+d.vals.reduce((a,v)=>a+v,0),0);
  const labels=ytData.length?{start:ytData[0]?.date?.slice(5),end:ytData[ytData.length-1]?.date?.slice(5)}:{start:"",end:"Today"};
  const hasMeaningfulData=datasets.some(d=>d.vals.filter(v=>v>0).length>=2);
  const rcData=Array.from({length:len},(_,i)=>{
    const row={idx:i};
    datasets.forEach(d=>{row[d.key]=d.vals[i]||0;});
    return row;
  });
  const NO_TREND_SUPPORT={linkedin:{label:"LinkedIn",color:"#0a66c2"},facebook:{label:"Facebook",color:"#1877f2"},discord:{label:"Discord",color:"#5865f2"}};
  const UNSUPPORTED_PLATFORMS=Object.keys(NO_TREND_SUPPORT).filter(k=>data?.[k]?.connected).map(k=>NO_TREND_SUPPORT[k]);
  const ALL_TREND_DATASETS=[
    {key:"yt",label:"YouTube Views",color:"#ff0000",connKey:"youtube"},
    {key:"th",label:"Threads Views",color:"#e0e0e0",connKey:"threads"},
    {key:"ig",label:"Instagram Reach",color:"#e1306c",connKey:"instagram"},
    {key:"pi",label:"Pinterest Impr",color:"#e60023",connKey:"pinterest"},
    {key:"tg",label:"Telegram Posts",color:"#2aabee",connKey:"telegram"},
  ].filter(d=>data?.[d.connKey]?.connected);
  const rcDataCombined=Array.from({length:len},(_,i)=>{
    const row={idx:i,total:datasets.reduce((s,d)=>s+(d.vals[i]||0),0)};
    datasets.forEach(d=>{row[d.key]=d.vals[i]||0;});
    return row;
  });
  const CombinedTooltip=({active,payload})=>{
    if(!active||!payload||!payload.length)return null;
    const row=payload[0].payload;
    const total=row.total||0;
    return(
      <div style={{background:"rgba(15,15,15,0.97)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"10px 12px",fontSize:11,minWidth:170,maxWidth:220,boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
        <div style={{fontWeight:900,color:"#f5f5f7",marginBottom:6,fontSize:12}}>Total activity: {fmt(total)}</div>
        {ALL_TREND_DATASETS.map(d=>{
          const v=row[d.key]||0;
          const pct=total>0?Math.round((v/total)*100):0;
          return(
            <div key={d.key} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:d.color,flexShrink:0}}/>
              <span style={{color:"rgba(255,255,255,0.7)",flex:1}}>{d.label}</span>
              <span style={{color:"#f5f5f7",fontWeight:700}}>{fmt(v)} ({pct}%)</span>
            </div>
          );
        })}
        {UNSUPPORTED_PLATFORMS.length>0&&(
          <div style={{marginTop:6,paddingTop:6,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
            {UNSUPPORTED_PLATFORMS.map(p=>(
              <div key={p.label} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:p.color,opacity:0.4,flexShrink:0}}/>
                <span style={{color:"rgba(255,255,255,0.35)",flex:1}}>{p.label}</span>
                <span style={{color:"rgba(255,255,255,0.3)",fontSize:10}}>Not supported</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return(
    <Glass style={{width:"100%",padding:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <div style={{fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:"1.2px",color:"rgba(255,255,255,0.28)",marginBottom:4}}>Channel Analytics</div>
          <div style={{fontSize:22,fontWeight:900,color:"#f5f5f7"}}>{fmt(total)}</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:2}}>Last {days} days</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,alignItems:"flex-end"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
            <div style={{display:"flex",gap:3,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:99,padding:3}}>
              {[["line","Line"],["bar","Bar"],["donut","Donut"],["pie","Pie"]].map(([k,l])=>(
                <button key={k} onClick={()=>setChartType(k)} style={{padding:"4px 10px",borderRadius:99,border:"none",background:chartType===k?"rgba(255,255,255,0.14)":"transparent",color:chartType===k?"#f5f5f7":"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>{l}</button>
              ))}
            </div>
            {chartType==="line"&&(
              <div style={{display:"flex",gap:3,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:99,padding:3}}>
                {[["combined","All Platforms"],["split","By Platform"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setViewMode(k)} style={{padding:"4px 10px",borderRadius:99,border:"none",background:viewMode===k?"rgba(255,255,255,0.14)":"transparent",color:viewMode===k?"#f5f5f7":"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>{l}</button>
                ))}
              </div>
            )}
            <div style={{display:"flex",gap:3,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:99,padding:3}}>
              {[7,30,90].map(d=>(
                <button key={d} onClick={()=>setDays(d)} style={{padding:"4px 10px",borderRadius:99,border:"none",background:days===d?"rgba(255,255,255,0.14)":"transparent",color:days===d?"#f5f5f7":"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>{d}d</button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {loading?<Skel h={H} r={8}/>:(hasMeaningfulData&&paths.length>0)?(
        <div>
          {chartType==="line"&&viewMode==="combined"&&(
            <div style={{height:H,background:"transparent"}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rcDataCombined} margin={{top:4,right:4,left:-28,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="idx" hide={true}/>
                  <YAxis tick={{fill:"rgba(255,255,255,0.25)",fontSize:9}} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CombinedTooltip/>}/>
                  <Line type="monotone" dataKey="total" stroke="#f5f5f7" strokeWidth={2.5} dot={false} activeDot={{r:5,fill:"#f5f5f7",stroke:"#0a0a0a",strokeWidth:2}}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {chartType==="line"&&viewMode==="split"&&(
            <div style={{height:H,background:"transparent"}}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rcData} margin={{top:4,right:4,left:-28,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                  <XAxis dataKey="idx" hide={true}/>
                  <YAxis tick={{fill:"rgba(255,255,255,0.25)",fontSize:9}} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{background:"rgba(10,5,20,0.95)",border:"1px solid rgba(124,58,237,0.3)",borderRadius:"12px",fontSize:"11px",boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}} labelStyle={{display:"none"}} formatter={(value,name)=>{const ds=datasets.find(d=>d.key===name);return[fmt(value),ds?ds.label:name];}}/>
                  {datasets.map(ds=>(
                    <Line key={ds.key} type="monotone" dataKey={ds.key} stroke={ds.color} strokeWidth={2.5} dot={false} activeDot={{r:5,fill:ds.color,stroke:"#fff",strokeWidth:2}}/>
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {chartType==="line"&&(()=>{
            const trendCount=ALL_TREND_DATASETS.length;
            const appreciation=total>200?"Your social media game is looking strong right now.":total>0?"You're building real momentum, keep it up.":"Time to get your first post tracked here.";
            const smartTip=trendCount<3?"Connect more platforms like Instagram or Pinterest to see your full reach.":"Stay consistent, steady posting compounds over time.";
            return(
              <div style={{marginTop:14,padding:"10px 14px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,fontFamily:"Poppins,sans-serif"}}>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.55)",marginBottom:3}}>{appreciation}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>{smartTip}</div>
              </div>
            );
          })()}
          {chartType==="bar"&&(()=>{
            const BW=600,BH=H,bpad=10,grpGap=4,barGap=1;
            const barLen=Math.min(len,days===7?7:days===30?14:20);
            const barDatasets=datasets.map((d,di)=>({...d,vals:d.vals.slice(-barLen)}));
            const allValsFlat=barDatasets.flatMap(d=>d.vals).filter(v=>v>0);
            const maxBV=Math.max(...allValsFlat,1);
            const minBV=Math.max(Math.min(...allValsFlat,maxBV),0);
            // log scale: makes small values visible
            const logScale=v=>v<=0?0:Math.log1p(v)/Math.log1p(maxBV);
            const totalBars=barDatasets.length;
            const slotW=(BW-bpad*2)/Math.max(barLen,1);
            const bw=Math.max((slotW-grpGap-(barGap*(totalBars-1)))/totalBars,10);
            const drawH=BH-bpad-24;
            // get date labels from ytData
            const dateLabels=ytData.slice(-barLen).map(d=>d.date?d.date.slice(5):"");
            return(
              <div style={{position:"relative"}}>
                <svg width="100%" height={BH} viewBox={"0 0 "+BW+" "+BH} style={{display:"block",overflow:"visible"}}>
                  <defs>{barDatasets.map((ds,di)=>(<linearGradient key={di} id={"bg"+di} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ds.color} stopOpacity="0.95"/><stop offset="100%" stopColor={ds.color} stopOpacity="0.3"/></linearGradient>))}</defs>
                  {[0.25,0.5,0.75,1].map(f=>(<g key={f}><line x1={bpad} y1={bpad+(1-f)*drawH} x2={BW-bpad} y2={bpad+(1-f)*drawH} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/><text x={8} y={bpad+(1-f)*drawH+4} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="DM Sans,sans-serif">{fmt(Math.round(maxBV*f))}</text></g>))}
                  {barDatasets.map((ds,di)=>ds.vals.map((v,i)=>{
                    const grpX=bpad+i*slotW+grpGap/2;
                    const x=grpX+di*(bw+barGap);
                    const bh=Math.max(logScale(v)*drawH,v>0?4:0);
                    const y=bpad+drawH-bh;
                    const isHov=hovBar&&hovBar.i===i&&hovBar.di===di;
                    const date=dateLabels[i]||"";
                    return(
                      <g key={di+"-"+i} style={{cursor:"pointer"}}
                        onMouseEnter={()=>setHovBar({i,di,v,label:ds.label,color:ds.color,x:grpX+slotW/2,y,date})}
                        onMouseLeave={()=>setHovBar(null)}>
                        <rect x={x} y={y} width={bw} height={bh} fill={"url(#bg"+di+")"} rx="0" opacity={hovBar&&!isHov?0.25:1} style={{transition:"opacity 0.15s"}}/>
                        {isHov&&<rect x={x-1} y={y-1} width={bw+2} height={bh+2} fill="none" stroke={ds.color} strokeWidth="1.5" rx="3" opacity="0.8"/>}
                      </g>
                    );
                  }))}
                  <line x1={bpad} y1={bpad+drawH} x2={BW-bpad} y2={bpad+drawH} stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
                  {hovBar&&(
                    <g>
                      <rect x={Math.min(Math.max(hovBar.x-55,bpad),BW-120)} y={Math.max(hovBar.y-52,2)} width="110" height="46" rx="8" fill="rgba(6,6,6,0.97)" stroke={hovBar.color} strokeWidth="1" style={{filter:"drop-shadow(0 4px 12px rgba(0,0,0,0.8))"}}/>
                      <text x={Math.min(Math.max(hovBar.x-55,bpad),BW-120)+55} y={Math.max(hovBar.y-52,2)+14} textAnchor="middle" fill={hovBar.color} fontSize="9" fontWeight="800" fontFamily="DM Sans,sans-serif" letterSpacing="0.5">{hovBar.label.toUpperCase()}</text>
                      <text x={Math.min(Math.max(hovBar.x-55,bpad),BW-120)+55} y={Math.max(hovBar.y-52,2)+28} textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" fontFamily="DM Sans,sans-serif">{fmt(hovBar.v)}</text>
                      <text x={Math.min(Math.max(hovBar.x-55,bpad),BW-120)+55} y={Math.max(hovBar.y-52,2)+40} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="DM Sans,sans-serif">{hovBar.date}</text>
                    </g>
                  )}
                </svg>
              </div>
            );
          })()}
          {chartType==="donut"&&(()=>{
            const totals=datasets.map(ds=>({label:ds.label,color:ds.color,v:ds.vals.reduce((s,x)=>s+x,0)})).filter(d=>d.v>0);
            const grandTotal=totals.reduce((s,d)=>s+d.v,0)||1;
            const sz=H,cx=sz/2,cy=sz/2,R=sz*0.38,sw=sz*0.13;
            let angle=-90;
            const arcs=totals.map((seg,i)=>{
              const pct=seg.v/grandTotal,deg=Math.max(pct*360,2);
              const r1=angle*Math.PI/180,r2=(angle+deg)*Math.PI/180;
              const x1=cx+R*Math.cos(r1),y1=cy+R*Math.sin(r1),x2=cx+R*Math.cos(r2),y2=cy+R*Math.sin(r2);
              const arcD="M "+x1+" "+y1+" A "+R+" "+R+" 0 "+(deg>180?1:0)+" 1 "+x2+" "+y2;
              angle+=deg;
              return{...seg,d:arcD,pct:Math.round(pct*100)};
            });
            return(
              <div style={{display:"flex",alignItems:"center",gap:32}}>
                <svg width={sz} height={sz} viewBox={"0 0 "+sz+" "+sz} style={{flexShrink:0}}>
                  <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={sw}/>
                  {arcs.map((a,i)=>(<path key={i} d={a.d} fill="none" stroke={a.color} strokeWidth={sw} strokeLinecap="butt" style={{filter:`drop-shadow(0 0 4px ${a.color}66)`}}/>))}
                  <circle cx={cx} cy={cy} r={R-sw/2} fill="rgba(0,0,0,0.8)"/>
                  <text x={cx} y={cy-8} textAnchor="middle" fill="#f5f5f7" fontSize={sz*0.1} fontWeight="900" fontFamily="DM Sans,sans-serif">{fmt(grandTotal)}</text>
                  <text x={cx} y={cy+sz*0.08} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={sz*0.065} fontFamily="DM Sans,sans-serif">Total Activity</text>
                </svg>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}>
                  {arcs.map((a,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                      <div style={{width:10,height:10,borderRadius:3,background:a.color,flexShrink:0,boxShadow:"0 0 6px "+a.color+"88"}}/>
                      <span style={{fontSize:11,color:"rgba(255,255,255,0.6)",flex:1}}>{a.label}</span>
                      <span style={{fontSize:12,fontWeight:900,color:"#f5f5f7"}}>{fmt(a.v)}</span>
                      <span style={{fontSize:10,color:a.color,fontWeight:700,minWidth:32,textAlign:"right"}}>{a.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          {chartType==="pie"&&(()=>{
            const totals=datasets.map(ds=>({label:ds.label,color:ds.color,v:ds.vals.reduce((s,x)=>s+x,0)})).filter(d=>d.v>0);
            const grandTotal=totals.reduce((s,d)=>s+d.v,0)||1;
            const cx=190,cy=H/2,R=H/2-10,BW=600;
            let angle=-90;
            const slices=totals.map((seg,i)=>{
              const pct=seg.v/grandTotal,deg=Math.max(pct*360,4);
              const r1=angle*Math.PI/180,r2=(angle+deg)*Math.PI/180;
              const x1=cx+R*Math.cos(r1),y1=cy+R*Math.sin(r1);
              const x2=cx+R*Math.cos(r2),y2=cy+R*Math.sin(r2);
              const mx=cx+(R*0.65)*Math.cos((r1+r2)/2),my=cy+(R*0.65)*Math.sin((r1+r2)/2);
              const arcD="M "+cx+" "+cy+" L "+x1+" "+y1+" A "+R+" "+R+" 0 "+(deg>180?1:0)+" 1 "+x2+" "+y2+" Z";
              angle+=deg;
              return{...seg,d:arcD,pct:Math.round(pct*100),mx,my};
            });
            return(
              <div style={{display:"flex",alignItems:"center",gap:24}}>
                <svg width={cx*2+10} height={H} viewBox={"0 0 "+(cx*2)+" "+H} style={{flexShrink:0}}>
                  <defs>{slices.map((s,i)=>(<linearGradient key={i} id={"pg"+i} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={s.color} stopOpacity="1"/><stop offset="100%" stopColor={s.color} stopOpacity="0.6"/></linearGradient>))}</defs>
                  {slices.map((s,i)=>(
                    <g key={i} style={{cursor:"pointer",transition:"transform 0.2s",transformOrigin:`${cx}px ${cy}px`,transform:hovPie===i?"scale(1.04)":"scale(1)"}} onMouseEnter={()=>setHovPie(i)} onMouseLeave={()=>setHovPie(null)}>
                      <path d={s.d} fill={"url(#pg"+i+")"} stroke="rgba(0,0,0,0.4)" strokeWidth="1.5"/>
                    </g>
                  ))}
                  {hovPie!=null&&slices[hovPie]&&(
                    <g>
                      <rect x={Math.min(slices[hovPie].mx-50,BW-110)} y={slices[hovPie].my-28} width="100" height="34" rx="6" fill="rgba(8,8,8,0.95)" stroke={slices[hovPie].color} strokeWidth="1"/>
                      <text x={Math.min(slices[hovPie].mx-50,BW-110)+50} y={slices[hovPie].my-13} textAnchor="middle" fill={slices[hovPie].color} fontSize="10" fontWeight="800" fontFamily="DM Sans,sans-serif">{slices[hovPie].label}</text>
                      <text x={Math.min(slices[hovPie].mx-50,BW-110)+50} y={slices[hovPie].my+2} textAnchor="middle" fill="#fff" fontSize="12" fontWeight="900" fontFamily="DM Sans,sans-serif">{fmt(slices[hovPie].v)} · {slices[hovPie].pct}%</text>
                    </g>
                  )}
                </svg>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:8}}>
                  {slices.map((s,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:10,background:hovPie===i?`${s.color}12`:"rgba(255,255,255,0.03)",border:`1px solid ${hovPie===i?s.color+"33":"rgba(255,255,255,0.06)"}`,cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={()=>setHovPie(i)} onMouseLeave={()=>setHovPie(null)}>
                      <div style={{width:10,height:10,borderRadius:"50%",background:s.color,flexShrink:0,boxShadow:`0 0 6px ${s.color}88`}}/>
                      <span style={{fontSize:11,color:"rgba(255,255,255,0.6)",flex:1}}>{s.label}</span>
                      <span style={{fontSize:12,fontWeight:900,color:"#f5f5f7"}}>{fmt(s.v)}</span>
                      <span style={{fontSize:10,color:s.color,fontWeight:700,minWidth:32,textAlign:"right"}}>{s.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          {!(chartType==="line"&&viewMode==="combined")&&(
          <div style={{display:"flex",gap:10,marginTop:10,flexWrap:"wrap"}}>
            {paths.map((p,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",opacity:hov!=null&&hov!==i?0.3:1,transition:"opacity 0.2s"}} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}><div style={{width:7,height:7,borderRadius:"50%",background:p.color,boxShadow:`0 0 6px ${p.color},0 0 12px ${p.color}66`,flexShrink:0}}/><span style={{fontSize:9,color:"rgba(255,255,255,0.45)",whiteSpace:"nowrap"}}>{p.label}</span></div>))}
          </div>
          )}
        </div>
      ):(
        <div style={{height:H,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8,fontSize:11,color:"rgba(255,255,255,0.18)",borderRadius:8,border:"1px dashed rgba(255,255,255,0.06)"}}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          {datasets.length===0?"Connect a platform to see analytics":"Not enough activity yet to show a trend"}
        </div>
      )}
    </Glass>
  );
}

function InsightsHorizontal({data,conn}){
  const topP=[...conn].sort((a,b)=>{const da=data[a.id],db=data[b.id];return(db?.subscribers??db?.followers??db?.member_count??0)-(da?.subscribers??da?.followers??da?.member_count??0);})[0];
  const tw=data.telegram?.this_week||0,wc=data.telegram?.week_change??0;
  const totalReach=conn.reduce((s,p)=>{const d=data[p.id];return s+(d?.subscribers??d?.followers??d?.member_count??0);},0);
  const connPct=Math.round((conn.length/8)*100);
  const cards=[
    {color:"#a78bfa",label:"Coverage",value:`${conn.length}/8`,sub:conn.length===8?"All platforms active!":`${8-conn.length} more to connect`},
    {color:"#34d399",label:"Total Reach",value:fmt(totalReach),sub:"across all platforms"},
    {color:wc>=0?"#34d399":"#f87171",label:"This Week",value:tw+" posts",sub:wc>=0?`+${wc}% vs last week`:`${wc}% vs last week`},
    {color:"#60a5fa",label:"Top Platform",value:topP?topP.label:"None",sub:topP?fmt(data[topP.id]?.subscribers??data[topP.id]?.followers??data[topP.id]?.member_count??0)+" reach":"Connect platforms"},
  ];
  const tip=conn.length===0?"Connect a platform to get AI tips.":conn.length<4?`On ${conn.length} platforms. Creators on 5+ grow 3x faster.`:tw===0?"Post to Telegram consistently to build momentum.":wc>50?"Great momentum! Cross-post to Instagram now.":"Analyze best content and double down on it.";
  return(
    <div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
        <span style={{fontSize:13,fontWeight:900,color:"#f5f5f7"}}>SocioMee AI Insights</span>
        <div style={{width:8,height:8,borderRadius:"50%",background:"#34d399",boxShadow:"0 0 10px #34d399,0 0 20px #34d39944"}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:14}} className="d-ins-grid">
        {cards.map((card,i)=>(
          <div key={i} style={{padding:"14px 16px",borderRadius:12,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
            <div style={{marginBottom:8}}>
              <span style={{fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:"1px",color:"rgba(255,255,255,0.35)"}}>{card.label}</span>
            </div>
            <div style={{fontSize:20,fontWeight:900,color:"#f5f5f7",marginBottom:3}}>{card.value}</div>
            <div style={{fontSize:10,color:card.color,fontWeight:600}}>{card.sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}} className="d-ins-grid">
        {[
          {label:"Platform Coverage",v:conn.length,max:8,color:"#a78bfa"},
          {label:"Telegram Activity",v:Math.min(tw,10),max:10,color:"#2aabee"},
          {label:"IG Posts",v:Math.min(data.instagram?.media_count||0,50),max:50,color:"#e1306c"},
          {label:"Smart Tip",v:null,color:"#f5f5f7",tip},
        ].map((b,i)=>(
          <div key={i} style={{padding:"12px 14px",borderRadius:12,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
            <div style={{fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:"1px",color:"rgba(255,255,255,0.3)",marginBottom:8}}>{b.label}</div>
            {b.tip?(
              <div style={{fontSize:11,color:"rgba(255,255,255,0.55)",lineHeight:1.6}}>{b.tip}</div>
            ):(
              <>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:13,fontWeight:900,color:"#f5f5f7"}}>{b.v}</span>
                  <span style={{fontSize:10,color:"rgba(255,255,255,0.25)"}}>/{b.max}</span>
                </div>
                <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:99,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${Math.min((b.v/b.max)*100,100)}%`,background:`linear-gradient(90deg,${b.color},${b.color}88)`,borderRadius:99,transition:"width 0.8s ease"}}/>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
export default function SocioMeeDashboard({userId,onNavigate}){
  const[data,setData]=useState({});const[loading,setLoading]=useState(true);const[hov,setHov]=useState(null);const timerRef=useRef(null);
  const fetchAll=useCallback(async()=>{if(!userId)return;const R={};const safe=async(k,fn)=>{try{R[k]=await fn();}catch{R[k]={connected:false};}};await Promise.all([safe("youtube",async()=>{const r=await fetch(`${BASE}/youtube/channels/${userId}`,{credentials:"include"});if(!r.ok)return{connected:false};const d=await r.json();const ch=d?.channels?.[0]||d;if(!ch?.channel_id)return{connected:false};return{connected:true,name:ch.channel_title||ch.title,subscribers:ch.subscriber_count??0,total_views:ch.view_count??0,sparkline:ch.recent_views||[]};}),safe("instagram",async()=>{const r=await fetch(`${BASE}/instagram/status?user_id=${userId}`);if(!r.ok)return{connected:false};const d=await r.json();if(!d?.connected)return{connected:false};return{connected:true,name:d.username?`@${d.username}`:null,followers:d.followers??0,media_count:d.media_count??0};}),safe("threads",async()=>{const r=await fetch(`${BASE}/threads/status?user_id=${userId}`);if(!r.ok)return{connected:false};const d=await r.json();if(!d?.connected)return{connected:false};return{connected:true,name:d.username?`@${d.username}`:null,followers:d.followers??0};}),safe("facebook",async()=>{const r=await fetch(`${BASE}/facebook/status?user_id=${userId}`);if(!r.ok)return{connected:false};const d=await r.json();if(!d?.connected)return{connected:false};const pg=d.selected_page||d.pages?.[0];return{connected:true,name:pg?.name||d.fb_name||null,followers:pg?.fan_count??0};}),safe("linkedin",async()=>{const r=await fetch(`${BASE}/linkedin/status?user_id=${userId}`);if(!r.ok)return{connected:false};const d=await r.json();if(!d?.connected)return{connected:false};return{connected:true,name:d.name||null,followers:1};}),safe("pinterest",async()=>{const r=await fetch(`${BASE}/pinterest/status?user_id=${userId}`);if(!r.ok)return{connected:false};const d=await r.json();if(!d?.connected)return{connected:false};return{connected:true,name:d.username?`@${d.username}`:null,followers:d.followers??0,pin_count:d.pin_count??0};}),safe("telegram",async()=>{const r=await fetch(`${BASE}/telegram/analytics?user_id=${userId}`);if(!r.ok)return{connected:false};const d=await r.json();if(d?.error)return{connected:false};const pts=(d.daily_posts||[]).slice(-7).map(x=>x.posts);const lw=d.last_week||0,tw=d.this_week||0;return{connected:true,name:d.channel?`@${d.channel}`:null,member_count:d.member_count??0,followers:d.member_count??0,total_posts:d.total_posts??0,this_week:tw,week_change:lw>0?Math.round(((tw-lw)/lw)*100):tw>0?100:0,sparkline:pts,daily_posts:d.daily_posts||[]};}),safe("discord",async()=>{const r=await fetch(`${BASE}/discord/analytics?user_id=${userId}`);if(!r.ok)return{connected:false};const d=await r.json();if(d?.error||!d?.server_name)return{connected:false};return{connected:true,name:d.server_name,member_count:d.member_count??0,followers:d.member_count??0,total_posts:d.total_posts??0};})]);setData(R);setLoading(false);},[userId]);
  useEffect(()=>{fetchAll();timerRef.current=setInterval(fetchAll,30000);return()=>clearInterval(timerRef.current);},[fetchAll]);
  const conn=PLATS.filter(p=>data[p.id]?.connected);
  const totalReach=conn.reduce((s,p)=>{const d=data[p.id];return s+(d?.subscribers??d?.followers??d?.member_count??0);},0);
  const totalPosts=conn.reduce((s,p)=>s+(data[p.id]?.total_posts??data[p.id]?.media_count??data[p.id]?.pin_count??0),0);
  const tw=data.telegram?.this_week||0,wc=data.telegram?.week_change??0;
  const tgDaily=(data.telegram?.daily_posts||[]).map(d=>d.posts);

  return(
    <div style={{fontFamily:"'DM Sans','Syne',sans-serif",paddingBottom:48}}>
      <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}} @media(max-width:900px){.d-top{grid-template-columns:repeat(2,1fr)!important}.d-plat{grid-template-columns:repeat(2,1fr)!important}.d-body{flex-direction:column!important}.d-ins-grid{grid-template-columns:repeat(2,1fr)!important}}`}</style>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28}}><div><div style={{fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:"2.5px",color:"rgba(255,255,255,0.28)",marginBottom:4}}>Creator OS</div><div style={{fontSize:26,fontWeight:900,color:"#f5f5f7",letterSpacing:"-0.5px"}}>Dashboard</div></div><div style={{width:8,height:8,borderRadius:"50%",background:"#34d399",boxShadow:"0 0 10px #34d399,0 0 20px #34d39944"}}/></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}} className="d-top">
        <StatCard label="Platforms" value={conn.length} sub="of 8 connected" color="#a78bfa" loading={loading} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>}/>
        <StatCard label="Total Reach" value={fmt(totalReach)} sub="across all platforms" color="#34d399" loading={loading} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}/>
        <StatCard label="Total Posts" value={fmt(totalPosts)} sub="via SocioMee" color="#60a5fa" loading={loading} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}/>
        <StatCard label="This Week" value={tw} sub={wc>=0?`+${wc}% vs last week`:`${wc}% vs last week`} color={wc>=0?"#34d399":"#f87171"} loading={loading} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}/>
      </div>
      <div style={{marginBottom:20}}>
        <UnifiedChart userId={userId} tgDaily={tgDaily} data={data}/>
      </div>
      <Glass style={{padding:20,marginBottom:24}}>
        {loading?<div style={{display:"flex",gap:12}}>{[1,2,3,4].map(i=><Skel key={i} h={80} r={10} style={{flex:1}}/>)}</div>:<InsightsHorizontal data={data} conn={conn}/>}
      </Glass>
      <div style={{fontSize:9,fontWeight:800,textTransform:"uppercase",letterSpacing:"1.5px",color:"rgba(255,255,255,0.28)",marginBottom:14}}>All Platforms</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}} className="d-plat">
        {PLATS.map(p=>(<PlatCard key={p.id} p={p} d={data[p.id]||{}} onClick={()=>onNavigate&&onNavigate(p.id)} loading={loading}/>))}
      </div>
    </div>
  );
}
