import { useState, useEffect } from "react";
const BASE = "https://sociomeeai.com/api";

const DiscordIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const Spinner = ({ size = 16, color = "#fff" }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", border: `2.5px solid ${color}33`, borderTopColor: color, animation: "dspin 0.7s linear infinite", display: "inline-block", flexShrink: 0 }} />
);

export default function DiscordScheduler({ user }) {
  const userId = user?.user_id || localStorage.getItem("sociomee_user_id") || "";
  const [loading,    setLoading   ] = useState(true);
  const [guilds,     setGuilds    ] = useState([]);
  const [activeGuild,setActiveGuild] = useState(null);
  const [activeChan, setActiveChan] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [content,    setContent   ] = useState("");
  const [imageUrl,   setImageUrl  ] = useState("");
  const [sending,    setSending   ] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [schedType,  setSchedType ] = useState("now");
  const [schedAt,    setSchedAt   ] = useState("");

  const DC = "#5865F2";
  const C = {
    glass: "rgba(255,255,255,0.05)", hairline: "rgba(255,255,255,0.08)",
    ink: "#ffffff", muted: "rgba(255,255,255,0.45)",
    success: "#22c55e", danger: "#ef4444",
  };

  const loadGuilds = () => {
    const _t0 = Date.now();
    if (!userId) { setTimeout(()=>setLoading(false), 600); return; }
    fetch(`${BASE}/discord/guilds?user_id=${userId}`)
      .then(r => r.json())
      .then(d => {
        const list = d.guilds || [];
        setGuilds(list);
        if (list.length) {
          setActiveGuild(g => g && list.find(x => x.guild_id === g.guild_id) ? g : list[0]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadGuilds(); /* eslint-disable-next-line */ }, [userId]);

  useEffect(() => {
    if (activeGuild && activeGuild.channels?.length) {
      setActiveChan(c => c && activeGuild.channels.find(x => x.id === c.id) ? c : activeGuild.channels[0]);
    } else {
      setActiveChan(null);
    }
  }, [activeGuild]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dstatus = params.get("discord");
    if (dstatus === "connected") {
      loadGuilds();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (dstatus === "limit_reached") {
      setConnectErr("Server limit reached for your plan. Upgrade to connect more servers.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (dstatus === "no_guild_selected") {
      setConnectErr("No server was selected. Please try again.");
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line
  }, []);

  const [connectErr, setConnectErr] = useState("");

  const connect = async () => {
    setConnecting(true); setConnectErr("");
    try {
      const r = await fetch(`${BASE}/discord/oauth-url?user_id=${userId}`);
      const d = await r.json();
      if (r.ok && d.url) {
        window.location.href = d.url;
      } else {
        setConnectErr(d.detail || "Could not start connection.");
        setConnecting(false);
      }
    } catch { setConnectErr("Something went wrong."); setConnecting(false); }
  };

  const [refreshing, setRefreshing] = useState(false);

  const refreshChannels = async () => {
    setRefreshing(true);
    try {
      const r = await fetch(`${BASE}/discord/refresh-channels?user_id=${userId}&guild_id=${activeGuild.guild_id}`, { method: "POST" });
      const d = await r.json();
      if (d.ok) {
        setGuilds(gs => gs.map(g => g.guild_id === activeGuild.guild_id ? { ...g, channels: d.channels } : g));
        setActiveGuild(g => ({ ...g, channels: d.channels }));
      }
    } catch {}
    setRefreshing(false);
  };

  const removeGuild = async (guildId) => {
    if (!window.confirm("Remove this server?")) return;
    await fetch(`${BASE}/discord/remove-guild?user_id=${userId}&guild_id=${guildId}`, { method: "POST" });
    loadGuilds();
  };

  const send = async () => {
    if (!content.trim() && !imageUrl.trim()) return;
    if (!activeGuild || !activeChan) return;

    if (schedType === "custom") {
      if (!schedAt) { setSendResult("error"); return; }
      setSending(true); setSendResult(null);
      try {
        const r = await fetch(`${BASE}/discord/bot-schedule`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            guild_id: activeGuild.guild_id,
            channel_id: activeChan.id,
            content,
            image_url: imageUrl,
            scheduled_at: new Date(schedAt).toISOString(),
          })
        });
        const d = await r.json();
        if (r.ok && d.ok) {
          setSendResult("scheduled"); setContent(""); setImageUrl(""); setSchedAt("");
          setTimeout(() => setSendResult(null), 3000);
        } else {
          setSendResult("error");
        }
      } catch { setSendResult("error"); }
      setSending(false);
      return;
    }

    setSending(true); setSendResult(null);
    try {
      const r = await fetch(`${BASE}/discord/bot-send`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          guild_id: activeGuild.guild_id,
          channel_id: activeChan.id,
          content,
          image_url: imageUrl,
        })
      });
      const d = await r.json();
      if (r.ok && d.ok) {
        setSendResult("sent"); setContent(""); setImageUrl("");
        setTimeout(() => setSendResult(null), 3000);
      } else {
        setSendResult("error");
      }
    } catch { setSendResult("error"); }
    setSending(false);
  };

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"70vh", padding:"24px" }}>
      <div style={{ width:"100%", maxWidth:"420px", display:"flex", flexDirection:"column", gap:12 }}>
      <style>{`@keyframes skpulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
        <div style={{ width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,0.06)",animation:"skpulse 1.4s ease-in-out infinite",flexShrink:0 }}/>
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
          <div style={{ width:"40%",height:12,borderRadius:6,background:"rgba(255,255,255,0.06)",animation:"skpulse 1.4s ease-in-out infinite" }}/>
          <div style={{ width:"25%",height:10,borderRadius:6,background:"rgba(255,255,255,0.06)",animation:"skpulse 1.4s ease-in-out infinite" }}/>
        </div>
      </div>
      {[1,2,3].map(i=><div key={i} style={{ height:48,borderRadius:12,background:"rgba(255,255,255,0.06)",animation:"skpulse 1.4s ease-in-out infinite" }}/>)}
    </div>
      </div>
  );

  const styleTag = (
    <style>{`@keyframes dspin { to { transform: rotate(360deg); } }`}</style>
  );

  if (!guilds.length) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"70vh", padding:"24px" }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"16px", textAlign:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"20px", padding:"40px 32px", maxWidth:"360px", width:"100%" }}>
        {styleTag}
        <div style={{ width:"64px", height:"64px", borderRadius:"50%", background:`${DC}18`, border:`2px solid ${DC}44`, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <DiscordIcon size={28} color={DC}/>
        </div>
        <h3 style={{ fontSize:"16px", fontWeight:"900", color:"#fff", margin:0 }}>Connect Discord</h3>
        <p style={{ fontSize:"12.5px", color:"rgba(255,255,255,0.45)", lineHeight:1.6, maxWidth:"280px", margin:0 }}>Post messages, images, and schedule content directly to your Discord server channels.</p>
        {connectErr && (
          <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"10px 14px", fontSize:"12.5px", fontWeight:600, color:"#ef4444", width:"100%" }}>
            {connectErr}
          </div>
        )}
        <button onClick={connect} disabled={connecting}
          style={{ display:"flex", alignItems:"center", gap:"8px", padding:"12px 24px", borderRadius:99, border:"none", background:`linear-gradient(135deg,${DC},#4752c4)`, color:"#fff", fontWeight:"800", fontSize:"14px", cursor:connecting?"not-allowed":"pointer", fontFamily:"inherit", opacity:connecting?0.7:1, boxShadow:`0 4px 20px ${DC}44` }}>
          {connecting ? <><Spinner size={16}/>Connecting…</> : <><DiscordIcon size={16} color="#fff"/>Connect Discord</>}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "20px", maxWidth: 560, margin: "0 auto" }}>
      {styleTag}

      <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
        {guilds.map(g => (
          <button key={g.guild_id} onClick={() => setActiveGuild(g)}
            style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 999, border: `1.5px solid ${activeGuild?.guild_id === g.guild_id ? DC : C.hairline}`, background: activeGuild?.guild_id === g.guild_id ? `linear-gradient(135deg,${DC},#4752c4)` : C.glass, color: activeGuild?.guild_id === g.guild_id ? "#fff" : C.muted, fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            <DiscordIcon size={12} />{g.guild_name}
          </button>
        ))}
        <button onClick={connect} disabled={connecting}
          style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 999, border: `1.5px dashed ${C.hairline}`, background: "transparent", color: C.muted, fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
          + Add Server
        </button>
      </div>

      {activeGuild && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.glass, border: `1px solid ${DC}33`, borderRadius: 12, padding: "10px 14px", marginBottom: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${DC}22`, display: "flex", alignItems: "center", justifyContent: "center", color: DC, flexShrink: 0 }}>
              <DiscordIcon size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>{activeGuild.guild_name}</div>
              <div style={{ fontSize: 10, color: DC, fontWeight: 600 }}>Bot connected</div>
            </div>
            <button onClick={() => removeGuild(activeGuild.guild_id)}
              style={{ fontSize: 11, fontWeight: 700, color: C.danger, background: `${C.danger}14`, border: `1px solid ${C.danger}40`, borderRadius: 999, padding: "6px 16px", cursor: "pointer", fontFamily: "inherit" }}>
              Disconnect
            </button>
          </div>

          {activeGuild.channels?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Channel</div>
                <button onClick={refreshChannels} disabled={refreshing}
                  style={{ fontSize: 10.5, fontWeight: 700, color: DC, background: "transparent", border: "none", cursor: refreshing ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: refreshing ? 0.5 : 1 }}>
                  {refreshing ? "Refreshing…" : "Refresh"}
                </button>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {activeGuild.channels.map(c => (
                  <button key={c.id} onClick={() => setActiveChan(c)}
                    style={{ padding: "7px 14px", borderRadius: 999, border: `1.5px solid ${activeChan?.id === c.id ? DC : C.hairline}`, background: activeChan?.id === c.id ? `${DC}18` : C.glass, color: activeChan?.id === c.id ? DC : C.muted, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                    #{c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: C.glass, border: `1px solid ${C.hairline}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
              Compose Message
            </div>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="Write your Discord message… supports markdown **bold**, *italic*, `code`"
              rows={5}
              style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${DC}33`, background: "rgba(255,255,255,0.04)", color: C.ink, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box", lineHeight: 1.6 }} />

            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
              placeholder="Image URL (optional)"
              style={{ width: "100%", padding: "10px 13px", borderRadius: 10, border: `1px solid ${C.hairline}`, background: "rgba(255,255,255,0.04)", color: C.ink, fontSize: 12.5, fontFamily: "inherit", outline: "none", marginTop: 8, boxSizing: "border-box" }} />

            <div style={{ display: "flex", gap: 6, marginTop: 12, marginBottom: 12 }}>
              {[["now", "Send Now"], ["custom", "Schedule"]].map(([v, l]) => (
                <button key={v} onClick={() => setSchedType(v)}
                  style={{ padding: "8px 18px", borderRadius: 999, border: `1.5px solid ${schedType === v ? DC : C.hairline}`, background: schedType === v ? `linear-gradient(135deg,${DC},#4752c4)` : C.glass, color: schedType === v ? "#fff" : C.muted, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit", boxShadow: schedType === v ? `0 2px 10px ${DC}44` : "none" }}>
                  {l}
                </button>
              ))}
            <a href="/pricing" style={{ display:"inline-flex", alignItems:"center", padding:"8px 16px", borderRadius:999, border:`1.5px solid ${DC}44`, background:`${DC}10`, color:DC, fontWeight:700, fontSize:12, textDecoration:"none", whiteSpace:"nowrap" }}>Bulk Schedule ✶ — Pro+</a>
            </div>

            {schedType === "custom" && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ marginBottom:8 }}>
                  <DCMiniCalendar value={schedAt?new Date(schedAt):null} onChange={(d)=>setSchedAt(d.toISOString().slice(0,16))} />
                </div>
                <DCTimePicker value={schedAt?new Date(schedAt):null} onChange={(d)=>setSchedAt(d.toISOString().slice(0,16))} />
              </div>
            )}

            {sendResult === "sent" && (
              <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 10, fontSize: 12, fontWeight: 700, color: C.success }}>
                Sent to Discord!
              </div>
            )}
            {sendResult === "scheduled" && (
              <div style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 10, fontSize: 12, fontWeight: 700, color: C.success }}>
                Post scheduled!
              </div>
            )}
            {sendResult === "error" && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 10, fontSize: 12, fontWeight: 700, color: C.danger }}>
                Failed to send. Try again.
              </div>
            )}

            <button onClick={send} disabled={sending || (!content.trim() && !imageUrl.trim()) || !activeChan}
              style={{ width: "100%", padding: "14px", borderRadius: 999, border: "none", background: (sending || (!content.trim() && !imageUrl.trim()) || !activeChan) ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg,${DC},#4752c4)`, color: "#fff", fontWeight: 800, fontSize: 14, cursor: (sending || (!content.trim() && !imageUrl.trim()) || !activeChan) ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: (sending || (!content.trim() && !imageUrl.trim()) || !activeChan) ? "none" : `0 4px 20px ${DC}44` }}>
              {sending ? <><Spinner size={16} />Sending…</> : <><DiscordIcon size={16} />{schedType === "custom" ? "Schedule Post" : "Send to Discord"}</>}
            </button>
          </div>

          <div style={{ fontSize: 10, color: C.muted, textAlign: "center" }}>
            Posted as SocioMee AI bot to #{activeChan?.name || "…"} in {activeGuild.guild_name}
          </div>
        </>
      )}
    </div>
  );
}

function DCMiniCalendar({ value, onChange }) {
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
              background:isSelected(d) ? "#5865F2" : "transparent",
              color:isPast(d) ? C_.muted : (isSelected(d) ? "#fff" : C_.ink),
              fontWeight:isSelected(d) ? 700 : 500,
              opacity:isPast(d) ? 0.35 : 1,
            }}>{d}</button>
        ))}
      </div>
    </div>
  );
}

function DCTimePicker({ value, onChange }) {
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
