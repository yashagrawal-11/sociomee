import { useState, useEffect } from "react";
import { Pie, Cell, PieChart as RechartsPie } from "recharts";
const BASE = "https://sociomee.in/api";
const C = {purple:"#7c3aed",muted:"rgba(255,255,255,0.4)",glass:"rgba(255,255,255,0.03)"};
const PURPLE = ["#7c3aed","#9333ea","#a78bfa","#6d28d9","#c4b5fd"];
function fmt(n){if(!n)return"0";if(n>=1000000)return(n/1000000).toFixed(1)+"M";if(n>=1000)return(n/1000).toFixed(1)+"K";return String(n);}
function GC({children,style={}}){return <div style={{background:C.glass,border:"1px solid rgba(255,255,255,0.08)",borderRadius:"16px",padding:"20px",...style}}>{children}</div>;}

function VideoDonut({label,center,sub,data}){
  const [active,setActive]=useState(null);
  const filtered=data.filter(x=>x.value>0);
  const highlighted=active!==null?filtered[active]:null;
  return(
    <div style={{textAlign:"center",background:"rgba(124,58,237,0.06)",borderRadius:"14px",padding:"14px 8px",border:"1px solid rgba(124,58,237,0.15)",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <div style={{fontSize:"9px",fontWeight:"800",color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"10px"}}>{label}</div>
      <div style={{position:"relative"}}>
        <RechartsPie width={170} height={170}>
          <Pie data={filtered} cx={85} cy={85} innerRadius={54} outerRadius={76} paddingAngle={3} dataKey="value" strokeWidth={0}
            onMouseEnter={(_,i)=>setActive(i)} onMouseLeave={()=>setActive(null)} style={{cursor:"pointer"}}>
            {filtered.map((x,xi)=><Cell key={xi} fill={x.color||PURPLE[xi%PURPLE.length]} opacity={active===null||active===xi?1:0.15}/>)}
          </Pie>
        </RechartsPie>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center",pointerEvents:"none",width:"72px"}}>
          {highlighted?(<div style={{fontSize:"11px",fontWeight:"800",color:"#fff",lineHeight:1.3}}>{highlighted.name}</div>):(<>
            <div style={{fontSize:"15px",fontWeight:"900",color:"#fff",lineHeight:1}}>{center}</div>
            {sub&&<div style={{fontSize:"9px",color:"rgba(255,255,255,0.4)",marginTop:"2px"}}>{sub}</div>}
          </>)}
        </div>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:"6px",marginTop:"8px"}}>
        {filtered.map((x,xi)=><div key={xi} style={{display:"flex",alignItems:"center",gap:"4px"}}>
          <div style={{width:"6px",height:"6px",borderRadius:"99px",background:x.color||PURPLE[xi%PURPLE.length]}}/>
          <span style={{fontSize:"9px",color:"rgba(255,255,255,0.5)"}}>{x.name}</span>
        </div>)}
      </div>
    </div>
  );
}

function SK(){return <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>{[1,2,3].map(i=><GC key={i}><div style={{height:"60px",borderRadius:"8px",background:"linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)",backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite"}}/></GC>)}<style>{`@keyframes shimmer{to{background-position:-200% 0}}`}</style></div>;}

export default function VideoPerformance({user}){
  const [data,setData]=useState(null);const [loading,setLoading]=useState(true);const [selected,setSelected]=useState(null);const [error,setError]=useState(null);

  useEffect(()=>{
    if(!user?.id)return;
    fetch(`${BASE}/youtube/video-performance/${user.id}`,{headers:{"Authorization":`Bearer ${localStorage.getItem("sociomee_token")||""}`}})
      .then(r=>r.json()).then(d=>{
        if(d.error){setError(d);} else {setData(d);if(d.videos?.length)setSelected(d.videos[0]);}
        setLoading(false);
      }).catch(()=>{setError({message:"Failed to load data"});setLoading(false);});
  },[user]);

  if(loading)return <div style={{maxWidth:"800px",margin:"0 auto",padding:"20px 16px"}}><SK/></div>;

  if(error?.error==="not_connected")return(
    <div style={{maxWidth:"800px",margin:"0 auto",padding:"40px 16px",textAlign:"center"}}>
      <div style={{fontSize:"48px",marginBottom:"16px"}}>📊</div>
      <h2 style={{color:"#fff",fontSize:"18px",marginBottom:"8px"}}>Connect Your YouTube Channel</h2>
      <p style={{color:C.muted,fontSize:"14px",marginBottom:"20px"}}>Connect your channel to see real video performance data — views, likes, comments and engagement rate.</p>
      <button onClick={()=>window.location.href="/app#youtube"} style={{padding:"12px 28px",borderRadius:"99px",border:"1.5px solid rgba(124,58,237,0.6)",background:"rgba(124,58,237,0.15)",color:"#fff",fontWeight:"700",fontSize:"14px",cursor:"pointer",fontFamily:"inherit"}}>Connect YouTube Channel</button>
    </div>
  );

  if(!data?.videos?.length)return(
    <div style={{maxWidth:"800px",margin:"0 auto",padding:"40px 16px",textAlign:"center"}}>
      <div style={{fontSize:"48px",marginBottom:"16px"}}>🎬</div>
      <p style={{color:C.muted}}>No videos found on your channel yet.</p>
    </div>
  );

  const s=data.summary;
  const v=selected;

  return(<div style={{maxWidth:"800px",margin:"0 auto",padding:"20px 16px"}}>
    <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"20px"}}>
      <span style={{fontSize:"20px"}}>📊</span>
      <h2 style={{fontSize:"18px",fontWeight:"900",color:"#fff",margin:0}}>Video Performance</h2>
    </div>

    {/* Summary Cards */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"10px",marginBottom:"16px"}}>
      {[
        {label:"Total Views",val:fmt(s.total_views),color:"#7c3aed",icon:"👁"},
        {label:"Total Likes",val:fmt(s.total_likes),color:"#a78bfa",icon:"❤️"},
        {label:"Comments",val:fmt(s.total_comments),color:"#6d28d9",icon:"💬"},
        {label:"Avg Engagement",val:s.avg_engagement+"%",color:"#c4b5fd",icon:"📈"},
      ].map((card,i)=><GC key={i} style={{textAlign:"center",padding:"14px 10px",borderLeft:`3px solid ${card.color}`}}>
        <div style={{fontSize:"18px",marginBottom:"4px"}}>{card.icon}</div>
        <div style={{fontSize:"18px",fontWeight:"900",color:card.color}}>{card.val}</div>
        <div style={{fontSize:"9px",color:C.muted,textTransform:"uppercase",letterSpacing:"0.5px",marginTop:"2px"}}>{card.label}</div>
      </GC>)}
    </div>

    {/* Video List */}
    <GC style={{marginBottom:"16px"}}>
      <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"12px"}}>YOUR VIDEOS</div>
      <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
        {data.videos.map((vid,i)=>{
          const isSel=selected?.id===vid.id;
          const maxV=data.videos[0].views||1;
          return(<div key={i} onClick={()=>setSelected(vid)} style={{display:"flex",gap:"12px",alignItems:"center",padding:"10px",borderRadius:"10px",background:isSel?"rgba(124,58,237,0.12)":"transparent",border:isSel?"1px solid rgba(124,58,237,0.3)":"1px solid transparent",cursor:"pointer",transition:"all 0.2s"}}>
            <img src={vid.thumbnail} alt="" style={{width:"80px",height:"45px",borderRadius:"6px",objectFit:"cover",flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:"12px",color:"#fff",fontWeight:"600",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:"4px"}}>{vid.title}</div>
              <div style={{height:"4px",borderRadius:"99px",background:"rgba(255,255,255,0.06)",marginBottom:"4px"}}>
                <div style={{height:"100%",borderRadius:"99px",background:"#7c3aed",width:`${vid.views/maxV*100}%`}}/>
              </div>
              <div style={{display:"flex",gap:"10px"}}>
                <span style={{fontSize:"10px",color:"#a78bfa",fontWeight:"600"}}>👁 {fmt(vid.views)}</span>
                <span style={{fontSize:"10px",color:"rgba(255,255,255,0.4)"}}>❤️ {fmt(vid.likes)}</span>
                <span style={{fontSize:"10px",color:"rgba(255,255,255,0.4)"}}>💬 {fmt(vid.comments)}</span>
                <span style={{fontSize:"10px",color:"#34d399",fontWeight:"600"}}>📈 {vid.engagement_rate}%</span>
              </div>
            </div>
          </div>);
        })}
      </div>
    </GC>

    {/* Selected Video Donuts */}
    {v&&<GC>
      <div style={{fontSize:"11px",fontWeight:"700",color:C.muted,textTransform:"uppercase",letterSpacing:"1px",marginBottom:"14px"}}>📹 {v.title.slice(0,60)}{v.title.length>60?"...":""}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"12px"}}>
        <VideoDonut label="VIEWS" center={fmt(v.views)} sub="total views"
          data={[{name:"This video",value:v.views,color:"#7c3aed"},{name:"Others",value:Math.max(0,(data.summary.total_views-v.views)),color:"rgba(124,58,237,0.2)"}]}/>
        <VideoDonut label="ENGAGEMENT" center={v.engagement_rate+"%"} sub="like rate"
          data={[{name:"Likes",value:v.likes,color:"#7c3aed"},{name:"Comments",value:v.comments,color:"#a78bfa"},{name:"Views",value:Math.max(0,v.views-v.likes-v.comments),color:"rgba(124,58,237,0.15)"}]}/>
        <VideoDonut label="INTERACTIONS" center={fmt(v.likes+v.comments)} sub="total"
          data={[{name:"Likes",value:v.likes,color:"#7c3aed"},{name:"Comments",value:v.comments,color:"#9333ea"}]}/>
      </div>
      <div style={{marginTop:"12px",padding:"10px 14px",borderRadius:"10px",background:"rgba(124,58,237,0.08)",borderLeft:"2px solid #7c3aed"}}>
        <span style={{fontSize:"11px",color:"rgba(255,255,255,0.6)"}}>✦ </span>
        <span style={{fontSize:"11px",color:"rgba(255,255,255,0.6)"}}>
          {v.engagement_rate>=5?"Strong engagement! This video is performing above average."
          :v.engagement_rate>=2?"Decent engagement. Try adding a stronger CTA in your description."
          :"Low engagement rate. Consider improving your thumbnail and title for better CTR."}
        </span>
      </div>
    </GC>}
  </div>);}
