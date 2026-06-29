import { useState, useEffect } from "react";

const BASE = "https://sociomee.in/api";

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
      pending:   { label: "Pending",   color: "#7c3aed", bg: "rgba(124,58,237,0.12)" },
      sent:      { label: "Sent",      color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
      completed: { label: "Done",      color: "#10b981", bg: "rgba(16,185,129,0.12)" },
      dismissed: { label: "Dismissed", color: "#6b7280", bg: "rgba(107,114,128,0.12)" },
    };
    const s = map[status] || map.pending;
    return <span style={{ fontSize: "11px", fontWeight: "600", color: s.color, background: s.bg, padding: "3px 10px", borderRadius: "99px", whiteSpace: "nowrap" }}>{s.label}</span>;
  };

  const inputStyle = { width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: "14px", fontFamily: "Poppins, sans-serif", outline: "none", boxSizing: "border-box" };

  const visible = reminders.filter(r => r.status !== "dismissed" && r.status !== "completed");
  const history = reminders.filter(r => r.status === "completed" || r.status === "dismissed");

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "Poppins, sans-serif", color: "rgba(255,255,255,0.85)", padding: "40px 24px" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <span style={{ fontSize: "22px" }}>⏰</span>
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
            style={{ width: "100%", padding: "12px", borderRadius: "99px", border: "1px solid rgba(255,255,255,0.08)", background: busy ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg,#9b5cf6,#7c3aed)", color: "#fff", fontWeight: "600", fontSize: "14px", cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>
            {busy ? "Creating…" : "✦ Set Reminder"}
          </button>
        </div>

        {loading ? (
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>Loading reminders…</p>
        ) : visible.length === 0 ? (
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", textAlign: "center", padding: "20px 0" }}>No reminders yet — add one above.</p>
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
                    style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1px solid rgba(16,185,129,0.4)", background: "rgba(16,185,129,0.1)", color: "#10b981", cursor: "pointer", fontSize: "14px" }}>✓</button>
                  <button onClick={() => handleDelete(r.id)} title="Dismiss"
                    style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.1)", color: "#ef4444", cursor: "pointer", fontSize: "14px" }}>✕</button>
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
