import { useState, useEffect } from "react";
const BASE = "https://sociomee.in/api";

const DiscordIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

export default function DiscordScheduler({ user }) {
  const userId = user?.user_id || localStorage.getItem("sociomee_user_id") || "";
  const [status,      setStatus     ] = useState(null);
  const [loading,     setLoading    ] = useState(true);
  const [webhookUrl,  setWebhookUrl ] = useState("");
  const [serverName,  setServerName ] = useState("");
  const [channelName, setChannelName] = useState("");
  const [connecting,  setConnecting ] = useState(false);
  const [connErr,     setConnErr    ] = useState("");
  const [content,     setContent    ] = useState("");
  const [sending,     setSending    ] = useState(false);
  const [sendResult,  setSendResult ] = useState(null);
  const [schedType,   setSchedType  ] = useState("now");
  const [schedAt,     setSchedAt    ] = useState("");

  const DC = "#5865F2";

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetch(`${BASE}/discord/status?user_id=${userId}`)
      .then(r => r.json()).then(d => { setStatus(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  const connect = async () => {
    if (!webhookUrl.startsWith("https://discord.com/api/webhooks/") &&
        !webhookUrl.startsWith("https://discordapp.com/api/webhooks/")) {
      setConnErr("Please enter a valid Discord webhook URL"); return;
    }
    setConnecting(true); setConnErr("");
    try {
      const r = await fetch(`${BASE}/discord/connect`, {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ user_id: userId, webhook_url: webhookUrl, server_name: serverName, channel_name: channelName })
      });
      const d = await r.json();
      if (!r.ok) { setConnErr(d.detail || "Connection failed"); }
      else { setStatus({ connected: true, ...d, webhook_url: webhookUrl, server_name: serverName, channel_name: channelName }); }
    } catch(e) { setConnErr("Connection failed. Check the URL."); }
    setConnecting(false);
  };

  const disconnect = async () => {
    if (!window.confirm("Disconnect Discord?")) return;
    await fetch(`${BASE}/discord/disconnect?user_id=${userId}`, { method:"POST" });
    setStatus({ connected: false }); setWebhookUrl(""); setContent("");
  };

  const send = async () => {
    if (!content.trim()) return;
    setSending(true); setSendResult(null);
    try {
      const r = await fetch(`${BASE}/discord/send`, {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ user_id: userId, content, username: "SocioMee" })
      });
      const d = await r.json();
      if (r.ok) { setSendResult("sent"); setContent(""); setTimeout(() => setSendResult(null), 3000); }
      else { setSendResult("error"); }
    } catch { setSendResult("error"); }
    setSending(false);
  };

  const C = {
    bg: "rgba(88,101,242,0.08)", card: "rgba(255,255,255,0.04)",
    glass: "rgba(255,255,255,0.05)", hairline: "rgba(255,255,255,0.08)",
    ink: "#ffffff", muted: "rgba(255,255,255,0.45)",
    success: "#22c55e", danger: "#ef4444", purple: "#7c3aed",
  };

  if (loading) return <div style={{ padding:20, color:C.muted, fontSize:13 }}>Loading…</div>;

  if (!status?.connected) return (
    <div style={{ padding:"24px 20px", maxWidth:520, margin:"0 auto" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <div style={{ width:40, height:40, borderRadius:"50%", background:`${DC}22`, display:"flex", alignItems:"center", justifyContent:"center", color:DC }}>
          <DiscordIcon size={22}/>
        </div>
        <div>
          <div style={{ fontSize:15, fontWeight:800, color:C.ink }}>Connect Discord</div>
          <div style={{ fontSize:11, color:C.muted }}>Post to your server via webhook</div>
        </div>
      </div>

      {/* How to guide */}
      <div style={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:12, padding:"14px 16px", marginBottom:16, fontSize:12, color:C.muted, lineHeight:1.7 }}>
        <div style={{ color:C.ink, fontWeight:700, marginBottom:6 }}>📋 How to get your webhook URL:</div>
        <div>1. Open Discord → your server → a text channel</div>
        <div>2. Click ⚙️ Edit Channel → Integrations → Webhooks</div>
        <div>3. Click <strong style={{color:C.ink}}>New Webhook</strong> → Copy Webhook URL</div>
        <div>4. Paste it below</div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)}
          placeholder="https://discord.com/api/webhooks/..."
          style={{ padding:"11px 14px", borderRadius:10, border:`1.5px solid ${DC}44`, background:"rgba(255,255,255,0.05)", color:C.ink, fontSize:13, fontFamily:"inherit", outline:"none" }}/>
        <div style={{ display:"flex", gap:8 }}>
          <input value={serverName} onChange={e => setServerName(e.target.value)}
            placeholder="Server name (optional)"
            style={{ flex:1, padding:"9px 12px", borderRadius:10, border:`1px solid ${C.hairline}`, background:"rgba(255,255,255,0.04)", color:C.ink, fontSize:12, fontFamily:"inherit", outline:"none" }}/>
          <input value={channelName} onChange={e => setChannelName(e.target.value)}
            placeholder="#channel (optional)"
            style={{ flex:1, padding:"9px 12px", borderRadius:10, border:`1px solid ${C.hairline}`, background:"rgba(255,255,255,0.04)", color:C.ink, fontSize:12, fontFamily:"inherit", outline:"none" }}/>
        </div>
        {connErr && <div style={{ color:C.danger, fontSize:12 }}>⚠️ {connErr}</div>}
        <button onClick={connect} disabled={connecting || !webhookUrl}
          style={{ padding:"11px", borderRadius:10, border:"none", background:`linear-gradient(135deg,${DC},#4752c4)`, color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer", fontFamily:"inherit", opacity: connecting||!webhookUrl ? 0.6:1 }}>
          {connecting ? "Connecting…" : <><DiscordIcon size={14}/> &nbsp;Connect Discord</>}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding:"20px", maxWidth:560, margin:"0 auto" }}>
      {/* Connected header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, background:C.glass, border:`1px solid ${DC}33`, borderRadius:12, padding:"10px 14px", marginBottom:18 }}>
        <div style={{ width:34, height:34, borderRadius:"50%", background:`${DC}22`, display:"flex", alignItems:"center", justifyContent:"center", color:DC, flexShrink:0 }}>
          <DiscordIcon size={18}/>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, fontWeight:800, color:C.ink }}>
            {status.server_name || "Discord"} {status.channel_name ? `· #${status.channel_name}` : ""}
          </div>
          <div style={{ fontSize:10, color:DC, fontWeight:600 }}>✓ Webhook connected</div>
        </div>
        <button onClick={disconnect} style={{ padding:"4px 10px", borderRadius:99, border:`1px solid ${C.danger}44`, background:C.danger+"10", color:C.danger, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          Disconnect
        </button>
      </div>

      {/* Compose */}
      <div style={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:14, padding:16, marginBottom:14 }}>
        <div style={{ fontSize:11, fontWeight:700, color:C.muted, marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>
          <DiscordIcon size={11}/> &nbsp;Compose Message
        </div>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="Write your Discord message… supports markdown **bold**, *italic*, `code`"
          rows={5}
          style={{ width:"100%", padding:"11px 13px", borderRadius:10, border:`1.5px solid ${DC}33`, background:"rgba(255,255,255,0.04)", color:C.ink, fontSize:13, fontFamily:"inherit", outline:"none", resize:"vertical", boxSizing:"border-box", lineHeight:1.6 }}/>

        {/* Schedule type */}
        <div style={{ display:"flex", gap:6, marginTop:10, marginBottom:12 }}>
          {[["now","Send Now"],["custom","Schedule"]].map(([v,l]) => (
            <button key={v} onClick={() => setSchedType(v)}
              style={{ padding:"6px 14px", borderRadius:9, border:`1.5px solid ${schedType===v?DC:C.hairline}`, background:schedType===v?`${DC}18`:C.glass, color:schedType===v?DC:C.muted, fontWeight:700, fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
              {l}
            </button>
          ))}
        </div>

        {schedType==="custom" && (
          <input type="datetime-local" value={schedAt} onChange={e => setSchedAt(e.target.value)}
            style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1px solid ${DC}44`, background:"rgba(255,255,255,0.05)", color:C.ink, fontSize:12, fontFamily:"inherit", outline:"none", marginBottom:10, boxSizing:"border-box" }}/>
        )}

        {sendResult==="sent" && (
          <div style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:9, padding:"9px 13px", marginBottom:10, fontSize:12, fontWeight:700, color:C.success }}>
            ✅ Sent to Discord!
          </div>
        )}
        {sendResult==="error" && (
          <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:9, padding:"9px 13px", marginBottom:10, fontSize:12, fontWeight:700, color:C.danger }}>
            ❌ Failed to send. Check webhook URL.
          </div>
        )}

        <button onClick={send} disabled={sending || !content.trim()}
          style={{ width:"100%", padding:"11px", borderRadius:10, border:"none", background:sending||!content.trim()?"rgba(255,255,255,0.08)":`linear-gradient(135deg,${DC},#4752c4)`, color:"#fff", fontWeight:800, fontSize:13, cursor:sending||!content.trim()?"not-allowed":"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
          {sending ? "Sending…" : <><DiscordIcon size={14}/> &nbsp;{schedType==="custom"?"Schedule Post":"Send to Discord"}</>}
        </button>
      </div>

      <div style={{ fontSize:10, color:C.muted, textAlign:"center" }}>
        Messages are sent to your connected Discord channel via webhook
      </div>
    </div>
  );
}
