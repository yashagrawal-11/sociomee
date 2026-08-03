/* eslint-disable */
import { useState, useEffect, useRef } from "react";
const BASE = "https://sociomeeai.com/api";
const DC = "rgba(255,255,255,0.8)";
const C = {
  glass:"rgba(255,255,255,0.03)",hairline:"rgba(255,255,255,0.08)",
  ink:"#ffffff",muted:"rgba(255,255,255,0.4)",success:"#34d399",danger:"#f87171",warn:"#fbbf24"
};
const GC = ({children,style={}})=><div style={{background:C.glass,border:`1px solid ${C.hairline}`,borderRadius:"16px",padding:"20px",...style}}>{children}</div>;
const Spinner=({size=16,color="#fff"})=><div style={{width:size,height:size,borderRadius:"50%",border:`2.5px solid ${color}33`,borderTopColor:color,animation:"dspin 0.7s linear infinite",display:"inline-block",flexShrink:0}}/>;

function LineChart({pts,keyX="date",keyY="posts",color="rgba(255,255,255,0.7)",dashed=false,height=80}){
  const [hov,setHov]=useState(null);
  if(!pts||!pts.length)return null;
  const W=600,H=height,pad=8;
  const maxV=Math.max(...pts.map(d=>d[keyY]),1);
  const xs=pts.map((_,i)=>pad+(i/(pts.length-1||1))*(W-pad*2));
  const ys=pts.map(d=>H-pad-(d[keyY]/maxV)*(H-pad*2));
  const path=pts.map((d,i)=>`${i===0?"M":"L"}${xs[i]},${ys[i]}`).join(" ");
  const area=`${path} L${xs[xs.length-1]},${H} L${xs[0]},${H} Z`;
  const gradId=`dcg${Math.random().toString(36).slice(2,6)}`;
  return(
    <div style={{position:"relative"}}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible",display:"block"}}>
        <defs><linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color.replace("0.7","0.15").replace("0.6","0.12")}/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </linearGradient></defs>
        <path d={area} fill={`url(#${gradId})`}/>
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dashed?"4 3":"none"}/>
        {pts.map((d,i)=>d[keyY]>0&&(
          <circle key={i} cx={xs[i]} cy={ys[i]} r={hov===i?5:3} fill={hov===i?"#fff":color}
            style={{cursor:"pointer"}} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}/>
        ))}
        {hov!==null&&pts[hov]&&(
          <g>
            <rect x={Math.min(xs[hov]-44,W-100)} y={ys[hov]-38} width="96" height="30" rx="6" fill="rgba(15,15,15,0.97)" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
            <text x={Math.min(xs[hov]-44,W-100)+8} y={ys[hov]-23} fill="rgba(255,255,255,0.5)" fontSize="9">{pts[hov][keyX]?.slice?.(5)||pts[hov][keyX]}</text>
            <text x={Math.min(xs[hov]-44,W-100)+8} y={ys[hov]-10} fill="#fff" fontSize="11" fontWeight="700">posts: {pts[hov][keyY]}</text>
          </g>
        )}
      </svg>
    </div>
  );
}

function DiscordAnalytics({userId}){
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    fetch(`${BASE}/discord/analytics?user_id=${userId}`)
      .then(r=>r.json()).then(d=>{setData(d);setLoading(false);}).catch(()=>setLoading(false));
  },[userId]);
  if(loading)return<div style={{padding:"60px",textAlign:"center",color:C.muted,fontSize:"13px"}}>Loading analytics...</div>;
  if(!data||data.detail)return<div style={{padding:"60px",textAlign:"center",color:C.muted,fontSize:"13px"}}>No data yet. Send your first post!</div>;
  const weekChange=data.last_week>0?Math.round(((data.this_week-data.last_week)/data.last_week)*100):data.this_week>0?100:0;
  const chanEntries=Object.entries(data.channel_breakdown||{});
  const totalChan=chanEntries.reduce((s,[,v])=>s+v,0)||1;
  const bestHourStr=data.best_hour!=null?`${data.best_hour}:00 - ${data.best_hour+1}:00`:"N/A";
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"10px"}} className="dc-stats-grid">
        {[
          {label:"TOTAL POSTS",value:data.total_posts||0,sub:"all time"},
          {label:"THIS WEEK",value:data.this_week||0,sub:weekChange>=0?`+${weekChange}% vs last week`:`${weekChange}% vs last week`,subColor:weekChange>=0?C.success:C.danger},
          {label:"MEMBERS",value:data.member_count!=null?data.member_count.toLocaleString():"0",sub:data.server_name||"server members"},
          {label:"SUCCESS RATE",value:`${data.success_rate||0}%`,sub:"posts delivered"},
        ].map((s,i)=>(
          <GC key={i} style={{textAlign:"center"}}>
            <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>{s.label}</div>
            <div style={{fontSize:"28px",fontWeight:"900",color:C.ink,marginBottom:"4px"}}>{s.value}</div>
            <div style={{fontSize:"11px",color:s.subColor||C.muted}}>{s.sub}</div>
          </GC>
        ))}
      </div>
      <GC>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
          <div>
            <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px"}}>Posts Last 30 Days</div>
            <div style={{fontSize:"28px",fontWeight:"900",color:C.ink,marginTop:"2px"}}>{(data.daily_posts||[]).reduce((s,d)=>s+d.posts,0)}</div>
          </div>
        </div>
        <LineChart pts={data.daily_posts||[]} keyX="date" keyY="posts"/>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:"4px"}}>
          <span style={{fontSize:"10px",color:C.muted}}>{(data.daily_posts||[])[0]?.date?.slice(5)}</span>
          <span style={{fontSize:"10px",color:C.muted}}>Today</span>
        </div>
      </GC>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}} className="dc-half-grid">
        <GC>
          <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>Weekly Trend</div>
          <LineChart pts={data.weekly_trend||[]} keyX="week" keyY="posts" height={60}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:"4px"}}>
            {(data.weekly_trend||[]).map((w,i)=><span key={i} style={{fontSize:"9px",color:C.muted,flex:1,textAlign:"center"}}>{w.week}</span>)}
          </div>
        </GC>
        <GC>
          <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>7-Day Prediction</div>
          <LineChart pts={(data.predictions||[]).map(p=>({...p,posts:p.predicted}))} keyX="date" keyY="posts" color="rgba(255,255,255,0.35)" dashed={true} height={60}/>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:"4px"}}>
            {(data.predictions||[]).map((p,i)=><span key={i} style={{fontSize:"9px",color:C.muted,flex:1,textAlign:"center"}}>{p.date.slice(5)}</span>)}
          </div>
          <div style={{marginTop:"8px",fontSize:"11px",color:C.muted}}>Avg/day: <span style={{color:C.ink,fontWeight:"700"}}>{data.avg_per_day||0}</span></div>
        </GC>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}} className="dc-half-grid">
        <GC>
          <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"14px"}}>Channel Breakdown</div>
          {chanEntries.length>0?chanEntries.map(([ch,count],i)=>(
            <div key={i} style={{marginBottom:"10px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                <span style={{fontSize:"12px",color:"rgba(255,255,255,0.8)",fontWeight:"600"}}>#{ch}</span>
                <span style={{fontSize:"12px",color:C.muted,fontWeight:"600"}}>{count}</span>
              </div>
              <div style={{height:"4px",borderRadius:"99px",background:"rgba(255,255,255,0.06)"}}>
                <div style={{height:"100%",borderRadius:"99px",background:"rgba(255,255,255,0.5)",width:`${(count/totalChan)*100}%`}}/>
              </div>
            </div>
          )):<div style={{fontSize:"12px",color:C.muted}}>No posts yet</div>}
        </GC>
        <GC>
          <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"14px"}}>Insights</div>
          {[
            {label:"Best Posting Time",value:bestHourStr},
            {label:"Scheduled Queue",value:`${data.scheduled_posts||0} posts`},
            {label:"Last Week Posts",value:`${data.last_week||0} posts`},
            {label:"Avg Per Day (30d)",value:data.avg_per_day||0},
          ].map((item,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<3?"1px solid rgba(255,255,255,0.05)":"none"}}>
              <span style={{fontSize:"12px",color:C.muted}}>{item.label}</span>
              <span style={{fontSize:"12px",color:C.ink,fontWeight:"700"}}>{item.value}</span>
            </div>
          ))}
        </GC>
      </div>
    </div>
  );
}

function DiscordCompose({userId,guilds,activeGuild,setActiveGuild,activeChan,setActiveChan}){
  const [content,setContent]=useState("");
  const [media,setMedia]=useState(null);
  const [mediaPreview,setMediaPreview]=useState("");
  const [sending,setSending]=useState(false);
  const [result,setResult]=useState(null);
  const [schedType,setSchedType]=useState("now");
  const [schedAt,setSchedAt]=useState("");
  const fileRef=useRef(null);
  const charLimit=2000;

  const handleMedia=e=>{
    const f=e.target.files[0];
    if(!f)return;
    setMedia(f);
    const reader=new FileReader();
    reader.onload=ev=>setMediaPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const send=async()=>{
    if(!content.trim()||!activeGuild||!activeChan)return;
    setSending(true);setResult(null);
    try{
      let imageUrl=null;
      if(media){
        const fd=new FormData();
        fd.append("file",media);
        fd.append("user_id",userId);
        const ur=await fetch(`${BASE}/telegram/upload-media`,{method:"POST",body:fd});
        const ud=await ur.json();
        imageUrl=ud.url||null;
      }
      const r=await fetch(`${BASE}/discord/bot-send`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({user_id:userId,guild_id:activeGuild.guild_id,channel_id:activeChan.id,
          content,image_url:imageUrl||""})});
      const d=await r.json();
      setResult(d.ok||d.success?{ok:true,msg:"Posted successfully!"}:{ok:false,msg:d.error||"Failed"});
      if(d.ok||d.success){setContent("");setMedia(null);setMediaPreview("");}
    }catch(e){setResult({ok:false,msg:"Network error"});}
    setSending(false);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      <GC>
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"12px"}}>Compose Post</div>
        <textarea value={content} onChange={e=>setContent(e.target.value.slice(0,charLimit))}
          placeholder="Write your message..."
          style={{width:"100%",minHeight:"120px",padding:"14px",borderRadius:"12px",border:`1px solid ${C.hairline}`,
            background:"rgba(255,255,255,0.02)",color:C.ink,fontSize:"13px",fontFamily:"inherit",
            outline:"none",resize:"none",boxSizing:"border-box",lineHeight:1.6}}/>
        <div style={{textAlign:"right",fontSize:"11px",color:C.muted,marginTop:"4px",marginBottom:"10px"}}>{content.length}/{charLimit}</div>

        {/* Media attach row */}
        <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px"}}>
          <input ref={fileRef} type="file" accept="image/*,video/*,image/gif" style={{display:"none"}} onChange={handleMedia}/>
          <button onClick={()=>fileRef.current?.click()}
            style={{width:"36px",height:"36px",borderRadius:"50%",border:`1.5px solid ${C.hairline}`,
              background:"rgba(255,255,255,0.04)",color:C.muted,fontSize:"20px",cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,lineHeight:1}}>
            +
          </button>
          {mediaPreview?(
            <div style={{position:"relative",display:"inline-block"}}>
              <img src={mediaPreview} style={{height:"48px",borderRadius:"8px",objectFit:"cover",maxWidth:"120px"}} alt=""/>
              <button onClick={()=>{setMedia(null);setMediaPreview("");}}
                style={{position:"absolute",top:"-6px",right:"-6px",width:"18px",height:"18px",borderRadius:"50%",
                  background:"rgba(248,113,113,0.9)",border:"none",color:"#fff",fontSize:"11px",cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"700"}}>x</button>
            </div>
          ):(
            <span style={{fontSize:"12px",color:C.muted}}>Attach image, video or GIF</span>
          )}
        </div>

        {/* When to send */}
        <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"8px"}}>When to Send</div>
        <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
          {["now","scheduled"].map(t=>(
            <button key={t} onClick={()=>setSchedType(t)} style={{padding:"7px 16px",borderRadius:"99px",
              border:`1.5px solid ${schedType===t?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.08)"}`,
              background:schedType===t?"rgba(255,255,255,0.08)":"transparent",
              color:schedType===t?C.ink:C.muted,fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit"}}>
              {t==="now"?"Send Now":"Schedule"}
            </button>
          ))}
        </div>
        {schedType==="scheduled"&&(
          <div style={{marginBottom:"12px",background:"rgba(255,255,255,0.02)",border:`1px solid ${C.hairline}`,borderRadius:"12px",padding:"12px"}}>
            <TGMiniCalendar value={schedAt?new Date(schedAt):null} onChange={d=>setSchedAt(d.toISOString().slice(0,16))}/>
            <TGTimePicker value={schedAt?new Date(schedAt):null} onChange={d=>setSchedAt(d.toISOString().slice(0,16))}/>
          </div>
        )}

        <button onClick={send} disabled={sending||!content.trim()||!activeGuild||!activeChan}
          style={{width:"100%",padding:"13px",borderRadius:"12px",border:"none",
            background:"rgba(255,255,255,0.08)",color:C.ink,fontSize:"13px",fontWeight:"700",
            cursor:sending||!content.trim()?"default":"pointer",fontFamily:"inherit",
            opacity:!content.trim()||!activeGuild||!activeChan?0.4:1,
            display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
          {sending?<><Spinner size={14}/> Sending...</>:schedType==="scheduled"?"Schedule Post":"Send to Discord"}
        </button>
        {result&&<div style={{marginTop:"10px",padding:"10px 14px",borderRadius:"10px",fontSize:"13px",fontWeight:"600",
          background:result.ok?"rgba(52,211,153,0.08)":"rgba(248,113,113,0.08)",
          border:`1px solid ${result.ok?"rgba(52,211,153,0.2)":"rgba(248,113,113,0.2)"}`,
          color:result.ok?C.success:C.danger}}>{result.msg}</div>}
        {activeGuild&&activeChan&&<div style={{marginTop:"8px",fontSize:"11px",color:C.muted,textAlign:"center"}}>
          Sends to #{activeChan.name} in {activeGuild.guild_name}
        </div>}
      </GC>
    </div>
  );
}

function DiscordPosts({userId}){
  const [jobs,setJobs]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    fetch(`${BASE}/discord/scheduled?user_id=${userId}`)
      .then(r=>r.json()).then(d=>{setJobs(d.jobs||d||[]);setLoading(false);}).catch(()=>setLoading(false));
  },[userId]);
  if(loading)return<div style={{padding:"40px",textAlign:"center",color:C.muted,fontSize:"13px"}}>Loading...</div>;
  if(!jobs.length)return<div style={{padding:"60px",textAlign:"center",color:C.muted,fontSize:"13px"}}>No posts yet.</div>;
  return(
    <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
      {jobs.map((j,i)=>{
        const col=j.status==="done"?C.success:j.status==="scheduled"?C.warn:j.status==="error"?C.danger:"rgba(255,255,255,0.5)";
        return(
          <div key={i} style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${C.hairline}`,borderRadius:"12px",padding:"14px 16px",display:"flex",alignItems:"flex-start",gap:"12px"}}>
            <div style={{width:"8px",height:"8px",borderRadius:"50%",background:col,flexShrink:0,marginTop:"5px"}}/>
            <div style={{flex:1}}>
              <div style={{fontSize:"13px",fontWeight:"600",color:"rgba(255,255,255,0.85)",marginBottom:"6px",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>
                {j.content||j.text||"(no content)"}
              </div>
              <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                <span style={{fontSize:"10px",fontWeight:"700",color:col,padding:"2px 8px",borderRadius:"99px",background:`${col}18`,border:`1px solid ${col}30`,textTransform:"uppercase"}}>{j.status}</span>
                {j.channel_name&&<span style={{fontSize:"11px",color:C.muted}}>#{j.channel_name}</span>}
                {j.sent_at&&<span style={{fontSize:"11px",color:C.muted}}>{new Date(j.sent_at).toLocaleDateString()}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TGMiniCalendar({ value, onChange }) {
  const C = {glass:"rgba(255,255,255,0.05)",hairline:"rgba(255,255,255,0.08)",ink:"#ffffff",muted:"rgba(255,255,255,0.4)",success:"#34d399",danger:"#f87171",warn:"#fbbf24"};
  const today = new Date();
  const [viewDate, setViewDate] = useState(value || today);
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName  = viewDate.toLocaleString("default", { month: "long" });
  const isPast = (d) => {
    const cmp = new Date(year, month, d); cmp.setHours(23,59,59,999);
    return cmp < new Date();
  };
  const isSelected = (d) => value && value.getFullYear()===year && value.getMonth()===month && value.getDate()===d;
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return (
    <div style={{ background:C.glass, border:`1.5px solid ${C.hairline}`, borderRadius:14, padding:16, maxWidth:320 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))}
          style={{ background:"transparent", border:"none", color:C.ink, fontSize:16, cursor:"pointer", padding:"4px 10px" }}>‹</button>
        <span style={{ fontSize:13, fontWeight:700, color:C.ink }}>{monthName} {year}</span>
        <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))}
          style={{ background:"transparent", border:"none", color:C.ink, fontSize:16, cursor:"pointer", padding:"4px 10px" }}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:6 }}>
        {["S","M","T","W","T","F","S"].map((d,i) => (
          <div key={i} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:C.muted, padding:"4px 0" }}>{d}</div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
        {cells.map((d, i) => d === null ? <div key={i} /> : (
          <button key={i} type="button" disabled={isPast(d)}
            onClick={() => onChange(new Date(year, month, d, value?.getHours()??12, value?.getMinutes()??0))}
            style={{
              aspectRatio:"1", borderRadius:8, border:"none", fontSize:12, fontFamily:"inherit",
              cursor:isPast(d) ? "not-allowed" : "pointer",
              background:isSelected(d) ? "rgba(255,255,255,0.15)" : "transparent",
              color:isPast(d) ? C.muted : (isSelected(d) ? "#fff" : C.ink),
              fontWeight:isSelected(d) ? 700 : 500,
              opacity:isPast(d) ? 0.35 : 1,
            }}>{d}</button>
        ))}
      </div>
    </div>
  );
}


function TGTimePicker({ value, onChange }) {
  const C = {glass:"rgba(255,255,255,0.05)",hairline:"rgba(255,255,255,0.08)",ink:"#ffffff",muted:"rgba(255,255,255,0.4)"};
  const h24 = value ? value.getHours() : 12;
  const m   = value ? value.getMinutes() : 0;
  const h12 = ((h24 % 12) || 12);
  const ampm = h24 >= 12 ? "PM" : "AM";
  const setTime = (newH12, newM, newAmpm) => {
    let h = newH12 % 12;
    if (newAmpm === "PM") h += 12;
    const base = value || new Date();
    onChange(new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, newM));
  };
  const selStyle = { padding:"10px 12px", borderRadius:10, border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:13, fontFamily:"inherit", outline:"none" };
  return (
    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
      <select value={h12} onChange={e => setTime(Number(e.target.value), m, ampm)} style={selStyle}>
        {[...Array(12)].map((_,i) => <option key={i+1} value={i+1}>{i+1}</option>)}
      </select>
      <span style={{ color:C.muted }}>:</span>
      <select value={m} onChange={e => setTime(h12, Number(e.target.value), ampm)} style={selStyle}>
        {[0,15,30,45].map(mm => <option key={mm} value={mm}>{String(mm).padStart(2,"0")}</option>)}
      </select>
      <select value={ampm} onChange={e => setTime(h12, m, e.target.value)} style={selStyle}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

export default function DiscordScheduler({ user }) {
  const userId = user?.user_id || localStorage.getItem("sociomee_user_id") || "";
  const [loading,setLoading]=useState(true);
  const [guilds,setGuilds]=useState([]);
  const [activeGuild,setActiveGuild]=useState(null);
  const [activeChan,setActiveChan]=useState(null);
  const [connecting,setConnecting]=useState(false);
  const [activeTab,setActiveTab]=useState("analytics");

  const loadGuilds=()=>{
    if(!userId){setTimeout(()=>setLoading(false),600);return;}
    fetch(`${BASE}/discord/guilds?user_id=${userId}`)
      .then(r=>r.json()).then(d=>{
        const list=d.guilds||[];
        setGuilds(list);
        if(list.length){
          setActiveGuild(g=>g&&list.find(x=>x.guild_id===g.guild_id)?g:list[0]);
          if(list[0]?.channels?.length)setActiveChan(c=>c||list[0].channels[0]);
        }
        setLoading(false);
      }).catch(()=>setLoading(false));
  };

  useEffect(()=>{loadGuilds();},[userId]);
  useEffect(()=>{if(activeGuild?.channels?.length&&!activeChan)setActiveChan(activeGuild.channels[0]);},[activeGuild]);

  const connectBot=async()=>{
    setConnecting(true);
    const r=await fetch(`${BASE}/discord/oauth-url?user_id=${userId}`).then(r=>r.json()).catch(()=>({}));
    if(r.url)window.open(r.url,"_blank","width=500,height=700");
    setConnecting(false);
  };

  const refreshChannels=async(guildId)=>{
    await fetch(`${BASE}/discord/refresh-channels?user_id=${userId}&guild_id=${guildId}`,{method:"POST"});
    loadGuilds();
  };

  if(loading)return<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"300px",color:C.muted,fontSize:"13px"}}>Loading...</div>;

  const noGuilds=!guilds.length;

  return(
    <div style={{fontFamily:"'DM Sans','Syne',sans-serif",maxWidth:"860px",margin:"0 auto",padding:"20px 16px"}}>
      <style>{`@keyframes dspin{to{transform:rotate(360deg)}} *{box-sizing:border-box;margin:0} @media(max-width:768px){.dc-stats-grid{grid-template-columns:repeat(2,1fr)!important}.dc-half-grid{grid-template-columns:1fr!important}.dc-tabs::-webkit-scrollbar{display:none}.dc-tabs{-ms-overflow-style:none;scrollbar-width:none}.dc-connected-card{flex-wrap:wrap!important;align-items:flex-start!important}.dc-channels-wrap{order:2;width:100%!important}.dc-connected-card>button:last-child{align-self:flex-start}}`}</style>

      {/* Server selector */}
      {!noGuilds && <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"16px",flexWrap:"wrap"}}>
        {guilds.map(g=>(
          <button key={g.guild_id} onClick={()=>{setActiveGuild(g);setActiveChan(g.channels?.[0]||null);}}
            style={{display:"flex",alignItems:"center",gap:"8px",padding:"8px 14px",borderRadius:"99px",
              border:`1.5px solid ${activeGuild?.guild_id===g.guild_id?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.08)"}`,
              background:activeGuild?.guild_id===g.guild_id?"rgba(255,255,255,0.08)":"transparent",
              color:C.ink,fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit"}}>
            {g.guild_icon&&<img src={g.guild_icon} style={{width:18,height:18,borderRadius:"50%",objectFit:"cover"}} alt=""/>}
            {g.guild_name}
          </button>
        ))}
        <button onClick={connectBot} disabled={connecting}
          style={{padding:"8px 14px",borderRadius:"99px",border:"1px solid rgba(255,255,255,0.08)",
            background:"transparent",color:C.muted,fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit"}}>
          {connecting?<Spinner size={12}/>:"+ Add Server"}
        </button>
      </div>}

      {activeGuild&&(
        <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"12px 16px",borderRadius:"12px",
          background:"rgba(255,255,255,0.02)",border:`1px solid ${C.hairline}`,marginBottom:"16px"}} className="dc-connected-card">
          {activeGuild.guild_icon&&<img src={activeGuild.guild_icon} style={{width:32,height:32,borderRadius:"50%"}} alt=""/>}
          <div style={{flex:1}}>
            <div style={{fontSize:"13px",fontWeight:"800",color:C.ink}}>{activeGuild.guild_name}</div>
            <div style={{fontSize:"11px",color:C.muted}}>Bot connected</div>
          </div>
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}} className="dc-channels-wrap">
            {activeGuild.channels?.map(ch=>(
              <button key={ch.id} onClick={()=>setActiveChan(ch)}
                style={{padding:"4px 10px",borderRadius:"99px",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit",
                  border:`1px solid ${activeChan?.id===ch.id?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.08)"}`,
                  background:activeChan?.id===ch.id?"rgba(255,255,255,0.08)":"transparent",
                  color:activeChan?.id===ch.id?C.ink:C.muted}}>
                #{ch.name}
              </button>
            ))}
            <button onClick={()=>refreshChannels(activeGuild.guild_id)}
              style={{padding:"4px 10px",borderRadius:"99px",fontSize:"11px",cursor:"pointer",fontFamily:"inherit",
                border:"1px solid rgba(255,255,255,0.06)",background:"transparent",color:C.muted}}>
              Refresh
            </button>
          </div>
          <button onClick={async()=>{await fetch(`${BASE}/discord/remove-guild?user_id=${userId}&guild_id=${activeGuild.guild_id}`,{method:"POST"});loadGuilds();}}
            style={{padding:"6px 14px",borderRadius:"99px",border:"1px solid rgba(248,113,113,0.3)",
              background:"rgba(248,113,113,0.08)",color:C.danger,fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit"}}>
            Disconnect
          </button>
        </div>
      )}

      {noGuilds?(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"70vh",padding:"24px"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"20px",padding:"40px 32px",maxWidth:"360px",width:"100%"}}>
            <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(255,255,255,0.06)",border:"2px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width={30} height={30} viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
            </div>
            <h3 style={{fontSize:16,fontWeight:900,color:C.ink,margin:0}}>Connect Discord</h3>
            <p style={{fontSize:12.5,color:C.muted,maxWidth:280,lineHeight:1.6,margin:0}}>Add SocioMee bot to your server to start posting and viewing analytics.</p>
            <button onClick={connectBot} style={{display:"flex",alignItems:"center",gap:"8px",padding:"12px 24px",borderRadius:"12px",border:"none",background:"rgba(255,255,255,0.08)",color:"#fff",fontWeight:"800",fontSize:"14px",cursor:"pointer",fontFamily:"inherit"}}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="#fff"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              Connect Discord
            </button>
          </div>
        </div>
      ):(
        <>
          {/* Tabs */}
          <div style={{display:"flex",gap:"6px",marginBottom:"16px",overflowX:"auto"}} className="dc-tabs">
            {[["analytics","Analytics"],["compose","Compose"],["posts","Posts"]].map(([id,label])=>(
              <button key={id} onClick={()=>setActiveTab(id)}
                style={{padding:"7px 16px",borderRadius:"99px",border:`1.5px solid ${activeTab===id?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.08)"}`,
                  background:activeTab===id?"rgba(255,255,255,0.08)":"transparent",
                  color:activeTab===id?C.ink:C.muted,fontWeight:"700",fontSize:"12px",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                {label}
              </button>
            ))}
          </div>
          {activeTab==="analytics"&&<DiscordAnalytics userId={userId}/>}
          {activeTab==="compose"&&<DiscordCompose userId={userId} guilds={guilds} activeGuild={activeGuild} setActiveGuild={setActiveGuild} activeChan={activeChan} setActiveChan={setActiveChan}/>}
          {activeTab==="posts"&&<DiscordPosts userId={userId}/>}
        </>
      )}
    </div>
  );
}
