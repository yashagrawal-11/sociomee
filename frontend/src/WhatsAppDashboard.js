import React, { useState } from "react";

const API = "/api";
const tabs = ["Send Content", "Quick Message", "Best Times"];

export default function WhatsAppDashboard({ userId }) {
  const [activeTab, setActiveTab] = useState("Send Content");
  const [phone, setPhone]         = useState("");
  const [topic, setTopic]         = useState("");
  const [platform, setPlatform]   = useState("youtube");
  const [quickText, setQuickText] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState("");
  const [bestTimes, setBestTimes] = useState(null);

  const platforms = ["youtube","instagram","tiktok","threads","pinterest","telegram","reddit","linkedin","facebook","whatsapp"];
  const clearState = () => { setResult(null); setError(""); };

  const handleSendContent = async () => {
    if (!phone.trim()) return setError("Please enter a phone number.");
    if (!topic.trim()) return setError("Please enter a topic.");
    clearState(); setLoading(true);
    try {
      const res = await fetch(`${API}/whatsapp/send-content`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_number: phone.trim(), topic: topic.trim(), platform }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send");
      setResult({ type: "content", data });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleQuickSend = async () => {
    if (!quickPhone.trim()) return setError("Please enter a phone number.");
    if (!quickText.trim())  return setError("Please enter a message.");
    clearState(); setLoading(true);
    try {
      const res = await fetch(`${API}/whatsapp/send-quick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_number: quickPhone.trim(), text: quickText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send");
      setResult({ type: "quick", data });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleBestTimes = async () => {
    clearState(); setLoading(true);
    try {
      const res  = await fetch(`${API}/whatsapp/best-times`);
      const data = await res.json();
      setBestTimes(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const s = {
    container: { minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "'Poppins', sans-serif", padding: "32px 24px" },
    header: { display: "flex", alignItems: "center", gap: 14, marginBottom: 32 },
    icon: { width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#25d366,#128c7e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 },
    title: { fontSize: 22, fontWeight: 700, margin: 0 },
    subtitle: { fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 2 },
    badge: { marginLeft: "auto", background: "rgba(37,211,102,0.15)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: 20, padding: "4px 14px", fontSize: 12, color: "#25d366" },
    tabs: { display: "flex", gap: 8, marginBottom: 28 },
    tab: (active) => ({ padding: "8px 20px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: active ? "linear-gradient(135deg,#25d366,#128c7e)" : "rgba(255,255,255,0.06)", color: active ? "#fff" : "rgba(255,255,255,0.6)" }),
    card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, marginBottom: 20 },
    label: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6, display: "block" },
    input: { width: "100%", padding: "11px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" },
    select: { width: "100%", padding: "11px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" },
    textarea: { width: "100%", padding: "11px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", resize: "vertical", minHeight: 100 },
    btn: { width: "100%", padding: "13px", background: "linear-gradient(135deg,#25d366,#128c7e)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 16 },
    error: { background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,60,60,0.3)", borderRadius: 10, padding: "12px 16px", marginTop: 16, color: "#ff6b6b", fontSize: 13 },
    success: { background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: 10, padding: "16px", marginTop: 16, fontSize: 13 },
    infoRow: { display: "flex", justifyContent: "space-between", marginBottom: 8 },
    infoLabel: { color: "rgba(255,255,255,0.5)", fontSize: 12 },
    infoVal: { color: "#fff", fontSize: 13, fontWeight: 500 },
    timeCard: { background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 10 },
    note: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "flex-start", gap: 10 },
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={s.icon}>💬</div>
        <div>
          <p style={s.title}>WhatsApp</p>
          <p style={s.subtitle}>Send AI content directly to WhatsApp</p>
        </div>
        <div style={s.badge}>● Live</div>
      </div>

      <div style={s.note}>
        <span>ℹ️</span>
        <span>SocioMee sends content from our WhatsApp Business account directly to your number. No setup required.</span>
      </div>

      <div style={s.tabs}>
        {tabs.map(t => (
          <button key={t} style={s.tab(activeTab === t)} onClick={() => { setActiveTab(t); clearState(); }}>{t}</button>
        ))}
      </div>

      {activeTab === "Send Content" && (
        <div style={s.card}>
          <h3 style={{ margin: "0 0 20px", fontSize: 16 }}>📦 Send AI Content Pack</h3>
          <label style={s.label}>Your WhatsApp Number</label>
          <input style={s.input} placeholder="+91 98765 43210 or 9876543210" value={phone} onChange={e => setPhone(e.target.value)} />
          <div style={{ marginTop: 14 }}>
            <label style={s.label}>Topic / Keyword</label>
            <input style={s.input} placeholder="e.g. 10 ways to grow on YouTube" value={topic} onChange={e => setTopic(e.target.value)} />
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={s.label}>Platform</label>
            <select style={s.select} value={platform} onChange={e => setPlatform(e.target.value)}>
              {platforms.map(p => <option key={p} value={p} style={{ background: "#1a1a1a" }}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <button style={s.btn} onClick={handleSendContent} disabled={loading}>{loading ? "Sending…" : "📤 Send Content to WhatsApp"}</button>
          {error && <div style={s.error}>⚠️ {error}</div>}
          {result?.type === "content" && (
            <div style={s.success}>
              <div style={{ color: "#25d366", fontWeight: 600, marginBottom: 8 }}>✅ Content Sent!</div>
              <div style={s.infoRow}><span style={s.infoLabel}>Messages sent</span><span style={s.infoVal}>{result.data.messages_sent}</span></div>
              <div style={s.infoRow}><span style={s.infoLabel}>To</span><span style={s.infoVal}>+{result.data.to}</span></div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 8 }}>Check your WhatsApp — content delivered! 🎉</div>
            </div>
          )}
        </div>
      )}

      {activeTab === "Quick Message" && (
        <div style={s.card}>
          <h3 style={{ margin: "0 0 20px", fontSize: 16 }}>⚡ Send Quick Message</h3>
          <label style={s.label}>WhatsApp Number</label>
          <input style={s.input} placeholder="+91 98765 43210 or 9876543210" value={quickPhone} onChange={e => setQuickPhone(e.target.value)} />
          <div style={{ marginTop: 14 }}>
            <label style={s.label}>Message</label>
            <textarea style={s.textarea} placeholder="Type your message here…" value={quickText} onChange={e => setQuickText(e.target.value)} />
          </div>
          <button style={s.btn} onClick={handleQuickSend} disabled={loading}>{loading ? "Sending…" : "💬 Send Message"}</button>
          {error && <div style={s.error}>⚠️ {error}</div>}
          {result?.type === "quick" && (
            <div style={s.success}>
              <div style={{ color: "#25d366", fontWeight: 600, marginBottom: 8 }}>✅ Message Sent!</div>
              <div style={s.infoRow}><span style={s.infoLabel}>To</span><span style={s.infoVal}>+{result.data.to}</span></div>
            </div>
          )}
        </div>
      )}

      {activeTab === "Best Times" && (
        <div style={s.card}>
          <h3 style={{ margin: "0 0 20px", fontSize: 16 }}>🕐 Best Times to Send</h3>
          {!bestTimes ? (
            <button style={s.btn} onClick={handleBestTimes} disabled={loading}>{loading ? "Loading…" : "📊 Get Best Send Times"}</button>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>🇮🇳 PEAK HOURS (India)</div>
                <div style={{ ...s.timeCard, background: "rgba(37,211,102,0.15)" }}>
                  <div style={{ color: "#25d366", fontWeight: 600 }}>{bestTimes.india_peak}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{bestTimes.tip}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>✅ BEST DAYS & TIMES</div>
              {bestTimes.best_times?.map((t, i) => (
                <div key={i} style={s.timeCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600 }}>{t.day}</span>
                    <span style={{ color: "#25d366", fontSize: 13 }}>{t.time}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{t.reason}</div>
                </div>
              ))}
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: "16px 0 10px" }}>❌ AVOID</div>
              {bestTimes.avoid?.map((a, i) => (
                <div key={i} style={{ ...s.timeCard, background: "rgba(255,60,60,0.08)", border: "1px solid rgba(255,60,60,0.2)" }}>
                  <div style={{ fontWeight: 600, color: "#ff6b6b" }}>{a.time}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{a.reason}</div>
                </div>
              ))}
            </>
          )}
          {error && <div style={s.error}>⚠️ {error}</div>}
        </div>
      )}
    </div>
  );
}
