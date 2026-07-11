import { useState, useEffect } from "react";

const BASE = "https://sociomeeai.com/api";

// ── Line icons ─────────────────────────────────────────────
function IconBell({ size=22, color="#a78bfa" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
}
function IconSparkle({ size=14, color="currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v5m0 8v5M4.2 4.2l3.5 3.5m8.6 8.6l3.5 3.5M3 12h5m8 0h5M4.2 19.8l3.5-3.5m8.6-8.6l3.5-3.5"/></svg>;
}
function IconCheck({ size=14, color="currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function IconClose({ size=13, color="currentColor" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function IconInboxEmpty({ size=32, color="rgba(167,139,250,0.5)" }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>;
}

export default function SocioMeeReminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState("");
  const [dateVal, setDateVal] = useState("");
  const [timeVal, setTimeVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const authHeaders = () => {
    const token = localStorage.getItem("sociomee_token") || "";
    return { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
  };

  const load = () => {
    setLoading(true);
    fetch(`${BASE}/reminders/list`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setReminders(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { setReminders([]); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!task.trim()) { setErr("Enter a task"); return; }
    if (!dateVal || !timeVal) { setErr("Pick a date and time"); return; }
    const dueAt = Math.floor(new Date(`${dateVal}T${timeVal}`).getTime() / 1000);
    if (dueAt <= Math.floor(Date.now() / 1000)) { setErr("Pick a time in the future"); return; }
    setBusy(true); setErr("");
    try {
      const r = await fetch(`${BASE}/reminders/create`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ task: task.trim(), due_at: dueAt }),
      });
      if (!r.ok) throw new Error("Could not create reminder");
      setTask(""); setDateVal(""); setTimeVal("");
      load();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const handleComplete = async (id) => {
    await fetch(`${BASE}/reminders/${id}/complete`, { method: "POST", headers: authHeaders() });
    load();
  };

  const handleDelete = async (id) => {
    await fetch(`${BASE}/reminders/${id}`, { method: "DELETE", headers: authHeaders() });
    load();
  };

  const fmtDue = (ts) => {
    const d = new Date(ts * 1000);
    const diffMin = Math.round((ts * 1000 - Date.now()) / 60000);
    const dateStr = d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
    const timeStr = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    if (diffMin < 0) return { text: `${dateStr}, ${timeStr} (overdue)`, color: "#ef4444" };
    if (diffMin < 60) return { text: `In ${diffMin} min`, color: "#f59e0b" };
    return { text: `${dateStr}, ${timeStr}`, color: "rgba(255,255,255,0.5)" };
  };

  const statusBadge = (status) => {
    const map = {
      pending:   { label: "Pending",   color: "#a78bfa", bg: "rgba(124,58,237,0.12)" },
      sent:      { label: "Sent",      color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
      completed: { label: "Done",      color: "#10b981", bg: "rgba(16,185,129,0.12)" },
      dismissed: { label: "Dismissed", color: "#9ca3af", bg: "rgba(107,114,128,0.12)" },
    };
    const s = map[status] || map.pending;
    return <span style={{ fontSize: "11px", fontWeight: "600", color: s.color, background: s.bg, padding: "3px 10px", borderRadius: "99px", whiteSpace: "nowrap" }}>{s.label}</span>;
  };

  const inputStyle = { width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: "14px", fontFamily: "Poppins, sans-serif", outline: "none", boxSizing: "border-box", colorScheme: "dark" };

  const visible = reminders.filter(r => r.status !== "dismissed" && r.status !== "completed");
  const history = reminders.filter(r => r.status === "completed" || r.status === "dismissed");

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#0a0a0a", fontFamily: "Poppins, sans-serif", color: "rgba(255,255,255,0.85)", display: "flex", justifyContent: "center", overflowY: "auto" }}>
      <div style={{ width: "100%", maxWidth: "640px", padding: "40px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconBell size={18} />
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#fff", margin: 0 }}>SocioMee Reminders</h1>
        </div>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "28px" }}>Get a push notification when it's time to act — post, follow up, or check back on something.</p>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "20px", marginBottom: "28px" }}>
          <input value={task} onChange={e => setTask(e.target.value)} placeholder="What should we remind you about? e.g. Post this on Instagram"
            style={{ ...inputStyle, marginBottom: "12px" }} />
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
            <input type="date" value={dateVal} onChange={e => setDateVal(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <input type="time" value={timeVal} onChange={e => setTimeVal(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          </div>
          {err && <p style={{ fontSize: "12px", color: "#ef4444", marginBottom: "10px" }}>{err}</p>}
          <button onClick={handleCreate} disabled={busy}
            style={{ width: "100%", padding: "12px", borderRadius: "99px", border: "1px solid rgba(255,255,255,0.08)", background: busy ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#9b5cf6,#7c3aed)", color: "#fff", fontWeight: "600", fontSize: "14px", cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <IconSparkle size={13} /> {busy ? "Creating…" : "Set Reminder"}
          </button>
        </div>

        {loading ? (
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>Loading reminders…</p>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}><IconInboxEmpty /></div>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: 0 }}>No reminders yet — add one above.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
            {visible.map(r => {
              const due = fmtDue(r.due_at);
              return (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "14px 16px", gap: "12px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", color: "#fff", marginBottom: "4px" }}>{r.task}</div>
                    <div style={{ fontSize: "12px", color: due.color }}>{due.text}</div>
                  </div>
                  {statusBadge(r.status)}
                  <button onClick={() => handleComplete(r.id)} title="Mark done"
                    style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1px solid rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.1)", color: "#10b981", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><IconCheck/></button>
                  <button onClick={() => handleDelete(r.id)} title="Dismiss"
                    style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.1)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><IconClose/></button>
                </div>
              );
            })}
          </div>
        )}

        {history.length > 0 && (
          <details>
            <summary style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", cursor: "pointer", marginBottom: "10px" }}>History ({history.length})</summary>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {history.map(r => (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "10px 14px", opacity: 0.6 }}>
                  <span style={{ fontSize: "13px" }}>{r.task}</span>
                  {statusBadge(r.status)}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
