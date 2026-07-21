import { useState, useEffect } from "react";
const BASE = process.env.REACT_APP_API_URL || "https://sociomeeai.com/api";
const FB = "#1877f2";
const C = {
  ink:"#ffffff", muted:"rgba(255,255,255,0.45)", glass:"rgba(255,255,255,0.04)",
  hairline:"rgba(255,255,255,0.08)", success:"#22c55e", danger:"#ef4444",
  warn:"rgba(255,193,7,0.8)", fb: FB,
};
function Skeleton({ h=48, r=12 }) {
  return <div style={{ height:h, borderRadius:r, background:"rgba(255,255,255,0.06)", animation:"skpulse 1.4s ease-in-out infinite" }}/>;
}
export default function FacebookDashboard({ user }) {
  const userId = user?.user_id || localStorage.getItem("sociomee_user_id") || "";
  const [status,     setStatus    ] = useState(null);
  const [loading,    setLoading   ] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [posts,      setPosts     ] = useState([]);
  const [postsLoad,  setPostsLoad ] = useState(false);
  const [text,       setText      ] = useState("");
  const [imgUrl,     setImgUrl    ] = useState("");
  const [posting,    setPosting   ] = useState(false);
  const [postResult, setPostResult] = useState(null);
  const [postErr,    setPostErr   ] = useState("");
  const [tab,        setTab       ] = useState("post");
  const [pageModal,  setPageModal ] = useState(false);
  const _t0 = Date.now();
  useEffect(() => {
    if (!userId) { setTimeout(() => setLoading(false), 600); return; }
    fetch(`${BASE}/facebook/status?user_id=${userId}`)
      .then(r => r.json())
      .then(d => setTimeout(() => { setStatus(d); setLoading(false); }, Math.max(0, 600-(Date.now()-_t0))))
      .catch(() => setTimeout(() => setLoading(false), Math.max(0, 600-(Date.now()-_t0))));
  }, [userId]);
  useEffect(() => {
    if (status?.connected && tab === "posts") loadPosts();
  }, [tab, status]);
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
          <div style={{ width:48, height:48, borderRadius:"50%", background:"rgba(24,119,242,0.1)", animation:"skpulse 1.4s ease-in-out infinite", flexShrink:0 }}/>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
            <div style={{ width:"40%", height:12, borderRadius:6, background:"rgba(255,255,255,0.06)", animation:"skpulse 1.4s ease-in-out infinite" }}/>
            <div style={{ width:"25%", height:10, borderRadius:6, background:"rgba(255,255,255,0.06)", animation:"skpulse 1.4s ease-in-out infinite" }}/>
          </div>
        </div>
        {[1,2,3].map(i=><Skeleton key={i}/>)}
      </div>
    </div>
  );
  if (!status?.connected) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"70vh", padding:24 }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, textAlign:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20, padding:"40px 32px", maxWidth:360, width:"100%" }}>
        <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(24,119,242,0.12)", border:"2px solid rgba(24,119,242,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <img src="/icons/facebook.png" style={{ width:32, height:32, objectFit:"contain" }} alt="Facebook"/>
        </div>
        <h3 style={{ fontSize:16, fontWeight:900, color:C.ink, margin:0 }}>Connect Facebook</h3>
        <p style={{ fontSize:12.5, color:C.muted, maxWidth:280, lineHeight:1.7, margin:0 }}>Publish posts to your Facebook Page, track engagement, and manage your content from SocioMee.</p>
        <button onClick={handleConnect} disabled={connecting} style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 24px", borderRadius:99, border:"none", background:FB, color:"#fff", fontWeight:800, fontSize:14, cursor:connecting?"not-allowed":"pointer", fontFamily:"inherit", boxShadow:"0 4px 20px rgba(24,119,242,0.35)", opacity:connecting?0.7:1 }}>
          <img src="/icons/facebook.png" style={{ width:16, height:16, objectFit:"contain" }} alt=""/>
          {connecting ? "Redirecting…" : "Connect Facebook Page"}
        </button>
      </div>
    </div>
  );
  const page = status.selected_page;
  const pages = status.pages || [];
  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", paddingBottom:20 }}>
      <style>{`@keyframes skpulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
      {/* Page header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:`rgba(24,119,242,0.06)`, border:`1px solid rgba(24,119,242,0.15)`, borderRadius:14, padding:"12px 16px", marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {page?.picture?.data?.url
            ? <img src={page.picture.data.url} alt="" style={{ width:40, height:40, borderRadius:"50%", objectFit:"cover", flexShrink:0 }}/>
            : <div style={{ width:40, height:40, borderRadius:"50%", background:FB, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <img src="/icons/facebook.png" style={{ width:22, height:22, objectFit:"contain" }} alt=""/>
              </div>
          }
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:C.ink }}>{page?.name || "No page selected"}</div>
            {page?.fan_count && <div style={{ fontSize:11, color:C.muted }}>{page.fan_count.toLocaleString()} followers</div>}
            {page?.category && <div style={{ fontSize:11, color:C.muted }}>{page.category}</div>}
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {pages.length > 1 && (
            <button onClick={() => setPageModal(true)} style={{ fontSize:11, fontWeight:700, color:FB, background:"rgba(24,119,242,0.08)", border:`1px solid rgba(24,119,242,0.2)`, borderRadius:99, padding:"6px 14px", cursor:"pointer", fontFamily:"inherit" }}>
              Switch Page
            </button>
          )}
          <button onClick={handleDisconnect} style={{ fontSize:11, fontWeight:700, color:C.danger, background:`rgba(239,68,68,0.08)`, border:`1px solid rgba(239,68,68,0.2)`, borderRadius:99, padding:"6px 14px", cursor:"pointer", fontFamily:"inherit" }}>
            Disconnect
          </button>
        </div>
      </div>
      {/* Page modal */}
      {pageModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999 }} onClick={() => setPageModal(false)}>
          <div style={{ background:"#111", border:"1px solid rgba(255,255,255,0.1)", borderRadius:16, padding:24, minWidth:300, maxWidth:400, width:"90%" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:14, fontWeight:700, color:C.ink, marginBottom:16 }}>Select a Page</div>
            {pages.map(p => (
              <div key={p.id} onClick={() => handleSelectPage(p)} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:10, border:`1px solid ${p.id===page?.id?"rgba(24,119,242,0.4)":C.hairline}`, background:p.id===page?.id?"rgba(24,119,242,0.08)":C.glass, marginBottom:8, cursor:"pointer" }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.ink }}>{p.name}</div>
                {p.id===page?.id && <span style={{ fontSize:10, color:FB, marginLeft:"auto" }}>Active</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:16 }}>
        {[["post","Post"],["posts","Recent Posts"],["schedule","Schedule"],["bulk","Bulk Schedule"]].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ padding:"8px 18px", borderRadius:99, border:`1.5px solid ${tab===v?"rgba(24,119,242,0.5)":C.hairline}`, background:tab===v?"rgba(24,119,242,0.1)":C.glass, color:tab===v?FB:C.muted, fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>{l}</button>
        ))}
      </div>
      {/* Post tab */}
      {tab==="post" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <div style={{ fontSize:13, fontWeight:700, color:C.ink, marginBottom:4 }}>Create Post</div>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder={`Write something for ${page?.name || "your Page"}…`} rows={5}
            style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:`1.5px solid ${C.hairline}`, background:"rgba(255,255,255,0.03)", color:C.ink, fontSize:13, fontFamily:"inherit", outline:"none", boxSizing:"border-box", resize:"vertical", lineHeight:1.6 }}/>
          <input value={imgUrl} onChange={e => setImgUrl(e.target.value)} placeholder="Image URL (optional)"
            style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${C.hairline}`, background:"rgba(255,255,255,0.03)", color:C.ink, fontSize:12.5, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}/>
          {postErr && <div style={{ background:"rgba(239,68,68,0.08)", border:`1px solid rgba(239,68,68,0.2)`, borderRadius:10, padding:"10px 14px", fontSize:12, color:C.danger }}>{postErr}</div>}
          {postResult && (
            <div style={{ background:"rgba(34,197,94,0.08)", border:`1px solid rgba(34,197,94,0.2)`, borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:13, fontWeight:700, color:C.success, marginBottom:4 }}>Posted to {postResult.page}!</div>
              <div style={{ fontSize:11, color:C.muted }}>Post ID: {postResult.post_id}</div>
            </div>
          )}
          <button onClick={handlePost} disabled={posting || !text.trim()} style={{ width:"100%", padding:14, borderRadius:99, border:"none", background:(posting||!text.trim())?"rgba(24,119,242,0.3)":`linear-gradient(135deg,${FB},#1a5fbf)`, color:"#fff", fontWeight:800, fontSize:14, cursor:(posting||!text.trim())?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {posting ? "Posting…" : "Post to Facebook Page"}
          </button>
        </div>
      )}
      {/* Recent posts tab */}
      {tab==="posts" && (
        <div>
          {postsLoad ? (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[1,2,3].map(i=><Skeleton key={i} h={80}/>)}
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign:"center", color:C.muted, fontSize:13, padding:"40px 0" }}>No posts yet on this Page.</div>
          ) : (
            posts.map(p => (
              <div key={p.id} style={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:12, padding:"14px 16px", marginBottom:10 }}>
                {p.full_picture && <img src={p.full_picture} alt="" style={{ width:"100%", maxHeight:180, objectFit:"cover", borderRadius:8, marginBottom:10 }}/>}
                <div style={{ fontSize:13, color:C.ink, lineHeight:1.6, marginBottom:8 }}>{p.message || "(no caption)"}</div>
                <div style={{ display:"flex", gap:12, fontSize:11, color:C.muted }}>
                  <span>{p.likes?.summary?.total_count || 0} likes</span>
                  <span>{p.comments?.summary?.total_count || 0} comments</span>
                  {p.shares && <span>{p.shares.count || 0} shares</span>}
                  <span style={{ marginLeft:"auto" }}>{new Date(p.created_time).toLocaleDateString("en-IN")}</span>
                </div>
                {p.permalink_url && <a href={p.permalink_url} target="_blank" rel="noreferrer" style={{ fontSize:11, color:FB, fontWeight:600, textDecoration:"none", display:"block", marginTop:6 }}>View on Facebook →</a>}
              </div>
            ))
          )}
        </div>
      )}
      {tab==="bulk" && (
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", backdropFilter:"blur(24px)", borderRadius:16, padding:28, textAlign:"center" }}>
          <div style={{ fontSize:16, fontWeight:800, color:"rgba(255,255,255,0.9)", marginBottom:8 }}>Bulk Schedule</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", lineHeight:1.7, marginBottom:20, maxWidth:400, margin:"0 auto 20px" }}>Schedule multiple Facebook Page posts in one go with AI timing. Exclusive to Pro+ members.</div>
          <a href="/pricing" style={{ display:"inline-block", padding:"10px 28px", borderRadius:99, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", color:"rgba(255,255,255,0.9)", fontWeight:700, fontSize:13, textDecoration:"none" }}>Upgrade to Pro+</a>
        </div>
      )}
      {tab==="schedule" && (
        <FacebookScheduleTab userId={userId} BASE={BASE} pageName={page?.name} />
      )}
    </div>
  );
}

function FBMiniCalendar({ value, onChange }) {
  const C_ = { glass:"rgba(255,255,255,0.03)", hairline:"rgba(255,255,255,0.08)", ink:"#f5f5f7", muted:"#8a8a94" };
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
    <div style={{ background:C_.glass, border:`1.5px solid ${C_.hairline}`, borderRadius:14, padding:16, maxWidth:320 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))}
          style={{ background:"transparent", border:"none", color:C_.ink, fontSize:16, cursor:"pointer", padding:"4px 10px" }}>‹</button>
        <span style={{ fontSize:13, fontWeight:700, color:C_.ink }}>{monthName} {year}</span>
        <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))}
          style={{ background:"transparent", border:"none", color:C_.ink, fontSize:16, cursor:"pointer", padding:"4px 10px" }}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4, marginBottom:6 }}>
        {["S","M","T","W","T","F","S"].map((d,i) => (
          <div key={i} style={{ textAlign:"center", fontSize:10, fontWeight:700, color:C_.muted, padding:"4px 0" }}>{d}</div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
        {cells.map((d, i) => d === null ? <div key={i} /> : (
          <button key={i} type="button" disabled={isPast(d)}
            onClick={() => onChange(new Date(year, month, d, value?.getHours()??12, value?.getMinutes()??0))}
            style={{
              aspectRatio:"1", borderRadius:8, border:"none", fontSize:12, fontFamily:"inherit",
              cursor:isPast(d) ? "not-allowed" : "pointer",
              background:isSelected(d) ? "#1877f2" : "transparent",
              color:isPast(d) ? C_.muted : (isSelected(d) ? "#fff" : C_.ink),
              fontWeight:isSelected(d) ? 700 : 500,
              opacity:isPast(d) ? 0.35 : 1,
            }}>{d}</button>
        ))}
      </div>
    </div>
  );
}

function FBTimePicker({ value, onChange }) {
  const C_ = { glass:"rgba(255,255,255,0.03)", hairline:"rgba(255,255,255,0.08)", ink:"#f5f5f7", muted:"#8a8a94" };
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
  const selStyle = { padding:"10px 12px", borderRadius:10, border:`1.5px solid ${C_.hairline}`, background:C_.glass, color:C_.ink, fontSize:13, fontFamily:"inherit", outline:"none" };
  return (
    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
      <select value={h12} onChange={e => setTime(Number(e.target.value), m, ampm)} style={selStyle}>
        {[...Array(12)].map((_,i) => <option key={i+1} value={i+1}>{i+1}</option>)}
      </select>
      <span style={{ color:C_.muted }}>:</span>
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

function FacebookScheduleTab({ userId, BASE, pageName }) {
  const C_ = { glass:"rgba(255,255,255,0.03)", hairline:"rgba(255,255,255,0.08)", ink:"#f5f5f7", muted:"#8a8a94", success:"#34d399", danger:"#f87171" };
  const [text, setText] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [when, setWhen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const schedule = () => {
    if (!text.trim() || !when) return;
    const nowPlus10 = new Date(Date.now() + 10 * 60000);
    if (when < nowPlus10) { setMsg("Error: Facebook requires scheduling at least 10 minutes in advance."); return; }
    setLoading(true);
    const scheduled_time = Math.floor(when.getTime() / 1000);
    fetch(`${BASE}/facebook/post`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, message: text, image_url: imgUrl, scheduled_time }),
    })
      .then(r => r.json())
      .then(d => {
        setLoading(false);
        if (d.ok) { setMsg("Scheduled on Facebook!"); setText(""); setImgUrl(""); setWhen(null); setTimeout(() => setMsg(""), 4000); }
        else setMsg("Error: " + (d.detail || "unknown"));
      })
      .catch(() => { setLoading(false); setMsg("Network error"); });
  };

  return (
    <div style={{ background: C_.glass, border: `1.5px solid ${C_.hairline}`, borderRadius: 14, padding: 16 }}>
      <div style={{ fontSize:13, fontWeight:700, color:C_.ink, marginBottom:12 }}>Schedule Post {pageName ? `to ${pageName}` : ""}</div>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Write something for your Page…" rows={5}
        style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${C_.hairline}`, background: "rgba(255,255,255,0.04)", color: C_.ink, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 10, lineHeight:1.6 }} />
      <input value={imgUrl} onChange={e => setImgUrl(e.target.value)} placeholder="Image URL (optional)"
        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C_.hairline}`, background: "rgba(255,255,255,0.04)", color: C_.ink, fontSize: 12.5, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
      <div style={{ marginBottom: 12 }}>
        <FBMiniCalendar value={when} onChange={setWhen} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <FBTimePicker value={when} onChange={setWhen} />
      </div>
      <button onClick={schedule} disabled={loading || !text.trim() || !when}
        style={{ width: "100%", padding: 12, borderRadius: 99, border: "none", background: (loading || !text.trim() || !when) ? "rgba(255,255,255,0.08)" : "#1877f2", color: "#fff", fontWeight: 800, fontSize: 13, cursor: (loading || !text.trim() || !when) ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
        {loading ? "Scheduling…" : "Schedule Post"}
      </button>
      {msg && <div style={{ marginTop: 10, fontSize: 12, color: msg.startsWith("Error") ? C_.danger : C_.success, fontWeight: 600 }}>{msg}</div>}
      <div style={{ marginTop: 12, fontSize: 11, color: C_.muted, lineHeight:1.5 }}>Facebook schedules this natively — no need to keep this tab open. Minimum 10 minutes, maximum 75 days in advance.</div>
    </div>
  );
}
