import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
const BASE = process.env.REACT_APP_API_URL || "https://sociomeeai.com/api";
const FB = "#1877f2";
const C = {
  ink:"#f5f5f7", muted:"rgba(255,255,255,0.4)", glass:"rgba(255,255,255,0.02)",
  hairline:"rgba(255,255,255,0.07)", success:"#34d399", danger:"#f87171",
  warn:"#fbbf24", purple:"#a78bfa",
};
function fmt(n) {
  if (!n && n !== 0) return "—";
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1)+"M";
  if (n >= 1_000) return (n/1_000).toFixed(1)+"K";
  return String(n);
}
function Skeleton({ h=48, r=12 }) {
  return <div style={{ height:h, borderRadius:r, background:"rgba(255,255,255,0.05)", animation:"skpulse 1.4s ease-in-out infinite" }}/>;
}
function StatCard({ label, value }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"16px 18px", flex:1, minWidth:100, textAlign:"center" }}>
      <div style={{ fontSize:22, fontWeight:900, color:"#f5f5f7", letterSpacing:"-0.5px", lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:9.5, fontWeight:700, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"1.3px", marginTop:6 }}>{label}</div>
    </div>
  );
}
function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ padding:"7px 14px", borderRadius:99, border:`1.5px solid ${active?"rgba(255,255,255,0.25)":C.hairline}`, background:active?"rgba(255,255,255,0.08)":"transparent", color:active?"#f5f5f7":C.muted, fontWeight:700, fontSize:11.5, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", whiteSpace:"nowrap" }}>
      {label}
    </button>
  );
}
export default function FacebookDashboard({ user }) {
  const userId = user?.user_id || localStorage.getItem("sociomee_user_id") || "";
  const [status,     setStatus    ] = useState(null);
  const [loading,    setLoading   ] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [posts,      setPosts     ] = useState([]);
  const [postsLoad,  setPostsLoad ] = useState(false);
  const [insights,   setInsights  ] = useState(null);
  const [insLoad,    setInsLoad   ] = useState(false);
  const [text,       setText      ] = useState("");
  const [imgUrl,     setImgUrl    ] = useState("");
  const [posting,    setPosting   ] = useState(false);
  const [postResult, setPostResult] = useState(null);
  const [postErr,    setPostErr   ] = useState("");
  const [tab,        setTab       ] = useState("analytics");
  const [pageModal,  setPageModal ] = useState(false);
  const [chartMetric,setChartMetric] = useState("impressions");

  useEffect(() => {
    if (!userId) { setTimeout(() => setLoading(false), 600); return; }
    fetch(`${BASE}/facebook/status?user_id=${userId}`)
      .then(r => r.json())
      .then(d => { setStatus(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (status?.connected) {
      if (tab === "analytics") loadInsights();
      if (tab === "posts") loadPosts();
    }
  }, [tab, status]);

  const loadInsights = async () => {
    setInsLoad(true);
    try {
      const r = await fetch(`${BASE}/facebook/insights?user_id=${userId}`);
      const d = await r.json();
      if (d.ok) setInsights(d);
    } catch {}
    setInsLoad(false);
  };

  const loadPosts = async () => {
    setPostsLoad(true);
    try {
      const r = await fetch(`${BASE}/facebook/posts?user_id=${userId}`);
      const d = await r.json();
      setPosts(d.posts || []);
    } catch {}
    setPostsLoad(false);
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const r = await fetch(`${BASE}/facebook/auth-url?user_id=${userId}`);
      const d = await r.json();
      if (d.url) window.location.href = d.url;
    } catch { setConnecting(false); }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Disconnect Facebook?")) return;
    await fetch(`${BASE}/facebook/disconnect`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({user_id:userId}) });
    setStatus(null);
  };

  const handleSelectPage = async (page) => {
    await fetch(`${BASE}/facebook/select-page`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({user_id:userId, page_id:page.id}) });
    setStatus(s => ({...s, selected_page:page}));
    setPageModal(false);
  };

  const handlePost = async () => {
    if (!text.trim()) return;
    setPosting(true); setPostErr(""); setPostResult(null);
    try {
      const r = await fetch(`${BASE}/facebook/post`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({user_id:userId, message:text, image_url:imgUrl}) });
      const d = await r.json();
      if (d.ok) { setPostResult(d); setText(""); setImgUrl(""); }
      else setPostErr(d.detail || "Post failed");
    } catch (e) { setPostErr(String(e)); }
    setPosting(false);
  };

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"70vh", padding:24 }}>
      <div style={{ width:"100%", maxWidth:420, display:"flex", flexDirection:"column", gap:12 }}>
        <style>{`@keyframes skpulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
          <div style={{ width:48, height:48, borderRadius:"50%", background:"rgba(255,255,255,0.05)", animation:"skpulse 1.4s ease-in-out infinite", flexShrink:0 }}/>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
            <div style={{ width:"40%", height:12, borderRadius:6, background:"rgba(255,255,255,0.05)", animation:"skpulse 1.4s ease-in-out infinite" }}/>
            <div style={{ width:"25%", height:10, borderRadius:6, background:"rgba(255,255,255,0.05)", animation:"skpulse 1.4s ease-in-out infinite" }}/>
          </div>
        </div>
        {[1,2,3].map(i=><Skeleton key={i}/>)}
      </div>
    </div>
  );

  if (!status?.connected) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"70vh", padding:24 }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, textAlign:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:"40px 32px", maxWidth:360, width:"100%" }}>
        <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(24,119,242,0.1)", border:"2px solid rgba(24,119,242,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <img src="/icons/facebook.png" style={{ width:32, height:32, objectFit:"contain" }} alt="Facebook"/>
        </div>
        <h3 style={{ fontSize:16, fontWeight:900, color:C.ink, margin:0 }}>Connect Facebook</h3>
        <p style={{ fontSize:12.5, color:C.muted, maxWidth:280, lineHeight:1.7, margin:0 }}>Publish posts, track page analytics, and schedule content from SocioMee.</p>
        <button onClick={handleConnect} disabled={connecting} style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 24px", borderRadius:99, border:"none", background:"rgba(255,255,255,0.08)", color:"#fff", fontWeight:800, fontSize:14, cursor:connecting?"not-allowed":"pointer", fontFamily:"inherit", opacity:connecting?0.7:1 }}>
          <img src="/icons/facebook.png" style={{ width:16, height:16, objectFit:"contain" }} alt=""/>
          {connecting ? "Redirecting…" : "Connect Facebook Page"}
        </button>
      </div>
    </div>
  );

  const page = status.selected_page;
  const pages = status.pages || [];

  // Parse insights data
  const getMetricVal = (name) => {
    if (!insights?.insights) return 0;
    const m = insights.insights.find(i => i.name === name);
    return m?.values?.reduce((a,b) => a + (b.value||0), 0) || 0;
  };
  const getChartData = (name) => {
    if (!insights?.insights) return [];
    const m = insights.insights.find(i => i.name === name);
    return (m?.values || []).map(v => ({ date: v.end_time?.slice(0,10) || "", value: v.value || 0 }));
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", paddingBottom:20 }}>
      <style>{`@keyframes skpulse{0%,100%{opacity:0.4}50%{opacity:1}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Page header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"10px 14px", marginBottom:14, gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {page?.picture?.data?.url
            ? <img src={page.picture.data.url} alt="" style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover", flexShrink:0 }}/>
            : <div style={{ width:36, height:36, borderRadius:"50%", background:"rgba(24,119,242,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <img src="/icons/facebook.png" style={{ width:20, height:20, objectFit:"contain" }} alt=""/>
              </div>
          }
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:C.ink }}>{page?.name || "No page selected"}</div>
            <div style={{ fontSize:11, color:C.muted }}>{page?.fan_count ? fmt(page.fan_count)+" followers" : ""}{page?.category ? " · "+page.category : ""}</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:6, flexShrink:0 }}>
          {pages.length > 1 && (
            <button onClick={() => setPageModal(true)} style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.5)", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:99, padding:"5px 10px", cursor:"pointer", fontFamily:"inherit" }}>Switch Page</button>
          )}
          <button onClick={handleDisconnect} style={{ fontSize:10, fontWeight:700, color:C.danger, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:99, padding:"5px 10px", cursor:"pointer", fontFamily:"inherit" }}>Disconnect</button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
        <StatCard label="Fans" value={fmt(page?.fan_count)} />
        <StatCard label="Impressions (30d)" value={fmt(getMetricVal("page_impressions"))} />
        <StatCard label="Reach (30d)" value={fmt(getMetricVal("page_reach"))} />
        <StatCard label="Engaged (30d)" value={fmt(getMetricVal("page_engaged_users"))} />
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"nowrap", overflowX:"auto", WebkitOverflowScrolling:"touch", scrollbarWidth:"none", paddingBottom:2 }}>
        {[["analytics","Analytics"],["post","Post"],["posts","Recent Posts"],["schedule","Schedule"],["bulk","Bulk Schedule"]].map(([v,l]) => (
          <Tab key={v} label={l} active={tab===v} onClick={() => setTab(v)} />
        ))}
      </div>

      {/* Analytics tab */}
      {tab==="analytics" && (
        <div>
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:20, marginBottom:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16, flexWrap:"wrap", gap:8 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:800, letterSpacing:"1.2px", textTransform:"uppercase", color:C.muted }}>Page Analytics</div>
                <div style={{ fontSize:26, fontWeight:900, color:"#fff", marginTop:4, lineHeight:1 }}>
                  {fmt(getMetricVal(chartMetric==="impressions"?"page_impressions":chartMetric==="reach"?"page_reach":chartMetric==="engaged"?"page_engaged_users":"page_post_engagements"))}
                </div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:2 }}>Last 30 days</div>
              </div>
              <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                {[["impressions","Impressions"],["reach","Reach"],["engaged","Engaged"],["engagements","Engagements"]].map(([k,l]) => (
                  <button key={k} onClick={() => setChartMetric(k)} style={{ padding:"4px 10px", borderRadius:8, border:`1px solid ${chartMetric===k?"rgba(255,255,255,0.25)":C.hairline}`, background:chartMetric===k?"rgba(255,255,255,0.08)":"transparent", color:chartMetric===k?"#f5f5f7":C.muted, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
                ))}
              </div>
            </div>
            {insLoad ? (
              <div style={{ height:180, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ width:28, height:28, borderRadius:"50%", border:"3px solid rgba(255,255,255,0.06)", borderTopColor:"rgba(255,255,255,0.3)", animation:"spin 0.7s linear infinite" }}/>
              </div>
            ) : (
              <div style={{ height:180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={getChartData(chartMetric==="impressions"?"page_impressions":chartMetric==="reach"?"page_reach":chartMetric==="engaged"?"page_engaged_users":"page_post_engagements")} margin={{ top:4, right:4, left:-28, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="date" hide={true} />
                    <YAxis tick={{ fill:"rgba(255,255,255,0.25)", fontSize:9 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                    <Tooltip contentStyle={{ background:"rgba(15,15,15,0.95)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, fontSize:11 }} labelStyle={{ color:"rgba(255,255,255,0.5)" }} itemStyle={{ color:"#f5f5f7" }} formatter={v => [fmt(v)]} />
                    <Line type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          {!insights && !insLoad && (
            <div style={{ textAlign:"center", fontSize:12, color:C.muted, padding:"20px 0" }}>Analytics load automatically. If empty, ensure your Facebook Page has recent activity.</div>
          )}
        </div>
      )}

      {/* Post tab */}
      {tab==="post" && (
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:20, display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:"1.3px", textTransform:"uppercase", color:C.muted }}>Create Post</div>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder={`Write something for ${page?.name || "your Page"}…`} rows={5}
            style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:"1.5px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:C.ink, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box", resize:"vertical", lineHeight:1.6 }}/>
          <input value={imgUrl} onChange={e => setImgUrl(e.target.value)} placeholder="Image URL (optional)"
            style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:C.ink, fontSize:12.5, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}/>
          {postErr && <div style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:"10px 14px", fontSize:12, color:C.danger }}>{postErr}</div>}
          {postResult && (
            <div style={{ background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.success, marginBottom:4 }}>Posted to {postResult.page}!</div>
              <div style={{ fontSize:11, color:C.muted }}>Post ID: {postResult.post_id}</div>
            </div>
          )}
          <button onClick={handlePost} disabled={posting || !text.trim()} style={{ width:"100%", padding:14, borderRadius:99, border:"1px solid rgba(255,255,255,0.12)", background:(posting||!text.trim())?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.08)", color:"#fff", fontWeight:800, fontSize:13, cursor:(posting||!text.trim())?"not-allowed":"pointer", fontFamily:"inherit", opacity:(posting||!text.trim())?0.4:1 }}>
            {posting ? "Posting…" : "Post to Facebook Page"}
          </button>
        </div>
      )}

      {/* Recent posts tab */}
      {tab==="posts" && (
        <div>
          {postsLoad ? (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>{[1,2,3].map(i=><Skeleton key={i} h={80}/>)}</div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign:"center", color:C.muted, fontSize:13, padding:"40px 0" }}>No posts yet on this Page.</div>
          ) : (
            posts.map(p => (
              <div key={p.id} style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 16px", marginBottom:10 }}>
                {p.full_picture && <img src={p.full_picture} alt="" style={{ width:"100%", maxHeight:180, objectFit:"cover", borderRadius:8, marginBottom:10 }}/>}
                <div style={{ fontSize:13, color:C.ink, lineHeight:1.6, marginBottom:8 }}>{p.message || "(no caption)"}</div>
                <div style={{ display:"flex", gap:12, fontSize:11, color:C.muted }}>
                  <span>{p.likes?.summary?.total_count || 0} likes</span>
                  <span>{p.comments?.summary?.total_count || 0} comments</span>
                  {p.shares && <span>{p.shares.count || 0} shares</span>}
                  <span style={{ marginLeft:"auto" }}>{new Date(p.created_time).toLocaleDateString("en-IN")}</span>
                </div>
                {p.permalink_url && <a href={p.permalink_url} target="_blank" rel="noreferrer" style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:600, textDecoration:"none", display:"block", marginTop:6 }}>View on Facebook</a>}
              </div>
            ))
          )}
        </div>
      )}

      {tab==="bulk" && (
        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:28, textAlign:"center" }}>
          <div style={{ fontSize:16, fontWeight:800, color:C.ink, marginBottom:8 }}>Bulk Schedule</div>
          <div style={{ fontSize:13, color:C.muted, lineHeight:1.7, marginBottom:20, maxWidth:400, margin:"0 auto 20px" }}>Schedule multiple Facebook Page posts in one go. Exclusive to Pro+ members.</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.25)", fontWeight:500 }}>Available soon for Pro+ members</div>
        </div>
      )}

      {tab==="schedule" && <FacebookScheduleTab userId={userId} BASE={BASE} pageName={page?.name} />}

      {/* Page modal */}
      {pageModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }} onClick={() => setPageModal(false)}>
          <div style={{ background:"#111", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:24, minWidth:300, maxWidth:400, width:"90%" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:14, fontWeight:700, color:C.ink, marginBottom:16 }}>Select a Page</div>
            {pages.map(p => (
              <div key={p.id} onClick={() => handleSelectPage(p)} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10, border:`1px solid ${p.id===page?.id?"rgba(255,255,255,0.2)":C.hairline}`, background:p.id===page?.id?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.02)", marginBottom:8, cursor:"pointer" }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.ink }}>{p.name}</div>
                {p.id===page?.id && <span style={{ fontSize:10, color:"rgba(255,255,255,0.4)", marginLeft:"auto" }}>Active</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FBMiniCalendar({ value, onChange }) {
  const C_ = { glass:"rgba(255,255,255,0.02)", hairline:"rgba(255,255,255,0.07)", ink:"#f5f5f7", muted:"rgba(255,255,255,0.3)" };
  const today = new Date();
  const [viewDate, setViewDate] = useState(value || today);
  const year = viewDate.getFullYear(), month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const isPast = (d) => { const c = new Date(year,month,d); c.setHours(23,59,59,999); return c < new Date(); };
  const isSelected = (d) => value && value.getFullYear()===year && value.getMonth()===month && value.getDate()===d;
  const cells = [];
  for (let i=0;i<firstDay;i++) cells.push(null);
  for (let d=1;d<=daysInMonth;d++) cells.push(d);
  return (
    <div style={{ background:C_.glass, border:`1.5px solid ${C_.hairline}`, borderRadius:14, padding:16, maxWidth:320 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <button type="button" onClick={() => setViewDate(new Date(year,month-1,1))} style={{ background:"transparent", border:"none", color:C_.ink, fontSize:16, cursor:"pointer", padding:"4px 10px" }}>‹</button>
        <span style={{ fontSize:13, fontWeight:700, color:C_.ink }}>{viewDate.toLocaleString("default",{month:"long"})} {year}</span>
        <button type="button" onClick={() => setViewDate(new Date(year,month+1,1))} style={{ background:"transparent", border:"none", color:C_.ink, fontSize:16, cursor:"pointer", padding:"4px 10px" }}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:6 }}>
        {["S","M","T","W","T","F","S"].map((d,i) => <div key={i} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:C_.muted, padding:"4px 0" }}>{d}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
        {cells.map((d,i) => d===null ? <div key={i}/> : (
          <button key={i} type="button" disabled={isPast(d)} onClick={() => onChange(new Date(year,month,d,value?.getHours()??12,value?.getMinutes()??0))}
            style={{ aspectRatio:"1", borderRadius:8, border:"none", fontSize:12, fontFamily:"inherit", cursor:isPast(d)?"not-allowed":"pointer", background:isSelected(d)?"rgba(255,255,255,0.15)":"transparent", color:isPast(d)?C_.muted:(isSelected(d)?"#fff":C_.ink), fontWeight:isSelected(d)?700:500, opacity:isPast(d)?0.3:1 }}>{d}</button>
        ))}
      </div>
    </div>
  );
}

function FBTimePicker({ value, onChange }) {
  const C_ = { glass:"rgba(255,255,255,0.02)", hairline:"rgba(255,255,255,0.07)", ink:"#f5f5f7" };
  const h24 = value ? value.getHours() : 12;
  const m = value ? value.getMinutes() : 0;
  const h12 = ((h24%12)||12);
  const ampm = h24>=12?"PM":"AM";
  const setTime = (newH12, newM, newAmpm) => {
    let h = newH12%12; if(newAmpm==="PM") h+=12;
    const base = value||new Date();
    onChange(new Date(base.getFullYear(),base.getMonth(),base.getDate(),h,newM));
  };
  const sel = { padding:"10px 12px", borderRadius:10, border:`1.5px solid ${C_.hairline}`, background:C_.glass, color:C_.ink, fontSize:13, fontFamily:"inherit", outline:"none" };
  return (
    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
      <select value={h12} onChange={e => setTime(Number(e.target.value),m,ampm)} style={sel}>{[...Array(12)].map((_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select>
      <span style={{ color:"rgba(255,255,255,0.3)" }}>:</span>
      <select value={m} onChange={e => setTime(h12,Number(e.target.value),ampm)} style={sel}>{[0,15,30,45].map(mm=><option key={mm} value={mm}>{String(mm).padStart(2,"0")}</option>)}</select>
      <select value={ampm} onChange={e => setTime(h12,m,e.target.value)} style={sel}><option value="AM">AM</option><option value="PM">PM</option></select>
    </div>
  );
}

function FacebookScheduleTab({ userId, BASE, pageName }) {
  const C_ = { glass:"rgba(255,255,255,0.02)", hairline:"rgba(255,255,255,0.07)", ink:"#f5f5f7", muted:"rgba(255,255,255,0.4)", success:"#34d399", danger:"#f87171" };
  const [text, setText] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [when, setWhen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const schedule = () => {
    if (!text.trim() || !when) return;
    const nowPlus10 = new Date(Date.now()+10*60000);
    if (when < nowPlus10) { setMsg("Error: Facebook requires at least 10 minutes in advance."); return; }
    setLoading(true);
    const scheduled_time = Math.floor(when.getTime()/1000);
    fetch(`${BASE}/facebook/post`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({user_id:userId, message:text, image_url:imgUrl, scheduled_time}) })
      .then(r=>r.json()).then(d => { setLoading(false); if(d.ok){setMsg("Scheduled on Facebook!");setText("");setImgUrl("");setWhen(null);setTimeout(()=>setMsg(""),4000);}else setMsg("Error: "+(d.detail||"unknown")); })
      .catch(()=>{setLoading(false);setMsg("Network error");});
  };
  return (
    <div style={{ background:C_.glass, border:`1.5px solid ${C_.hairline}`, borderRadius:14, padding:20 }}>
      <div style={{ fontSize:11, fontWeight:800, letterSpacing:"1.3px", textTransform:"uppercase", color:C_.muted, marginBottom:14 }}>Schedule Post{pageName?` to ${pageName}`:""}</div>
      <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Write something for your Page…" rows={5}
        style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:`1.5px solid ${C_.hairline}`, background:"rgba(255,255,255,0.03)", color:C_.ink, fontSize:13, fontFamily:"inherit", outline:"none", resize:"vertical", boxSizing:"border-box", marginBottom:10, lineHeight:1.6 }}/>
      <input value={imgUrl} onChange={e=>setImgUrl(e.target.value)} placeholder="Image URL (optional)"
        style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C_.hairline}`, background:"rgba(255,255,255,0.03)", color:C_.ink, fontSize:12.5, fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginBottom:12 }}/>
      <div style={{ marginBottom:12 }}><FBMiniCalendar value={when} onChange={setWhen}/></div>
      <div style={{ marginBottom:12 }}><FBTimePicker value={when} onChange={setWhen}/></div>
      <button onClick={schedule} disabled={loading||!text.trim()||!when}
        style={{ width:"100%", padding:12, borderRadius:99, border:"1px solid rgba(255,255,255,0.12)", background:(loading||!text.trim()||!when)?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.08)", color:"#fff", fontWeight:800, fontSize:13, cursor:(loading||!text.trim()||!when)?"not-allowed":"pointer", fontFamily:"inherit", opacity:(loading||!text.trim()||!when)?0.4:1 }}>
        {loading?"Scheduling…":"Schedule Post"}
      </button>
      {msg && <div style={{ marginTop:10, fontSize:12, color:msg.startsWith("Error")?C_.danger:C_.success, fontWeight:600 }}>{msg}</div>}
      <div style={{ marginTop:12, fontSize:11, color:C_.muted, lineHeight:1.5 }}>Facebook schedules natively. Min 10 minutes, max 75 days in advance.</div>
    </div>
  );
}
