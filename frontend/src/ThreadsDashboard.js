/**
 * ThreadsDashboard.js — SocioMee Threads Analytics + Publisher
 * Shows profile stats, engagement graph, recent posts, growth prediction,
 * and allows publishing new threads directly from SocioMee.
 */

import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const BASE = "http://127.0.0.1:8000";

function getThemeC() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  return dark ? {
    rose:"#ff6eb5", purple:"#a78bfa", purpleXlt:"#150d2a",
    teal:"#22d3ee", ink:"#ede8ff", slate:"#c4b5fd",
    muted:"#9d86c8", hairline:"rgba(167,139,250,0.15)",
    glass:"rgba(22,14,42,0.82)",
    white:"#ede8ff", success:"#34d399", warn:"#fbbf24", danger:"#f87171",
    threads:"#000000",
  } : {
    rose:"#ff3d8f", purple:"#7c3aed", purpleXlt:"#f5f3ff",
    teal:"#0891b2", ink:"#0d0015", slate:"#3b1f4e",
    muted:"#8b6b9a", hairline:"rgba(124,58,237,0.12)",
    glass:"rgba(255,255,255,0.68)",
    white:"#ffffff", success:"#10b981", warn:"#f59e0b", danger:"#ef4444",
    threads:"#101010",
  };
}

let C = getThemeC();

function fmt(n) {
  if (!n && n !== 0) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1)     + "K";
  return String(n);
}

function Spinner() {
  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"center", padding:"48px" }}>
      <div style={{ width:"36px", height:"36px", borderRadius:"50%", border:`3px solid ${C.purple}22`, borderTopColor:C.purple, animation:"spin 0.7s linear infinite" }} />
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  C = getThemeC();
  return (
    <div style={{ background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:"16px", padding:"16px 18px", flex:1, minWidth:"110px", textAlign:"center" }}>
      <div style={{ fontSize:"20px", marginBottom:"4px" }}>{icon}</div>
      <div style={{ fontSize:"20px", fontWeight:"900", color: color || C.purple, letterSpacing:"-0.5px" }}>{value}</div>
      <div style={{ fontSize:"10px", fontWeight:"700", color:C.muted, textTransform:"uppercase", letterSpacing:"0.8px", marginTop:"3px" }}>{label}</div>
    </div>
  );
}

// ── Threads Icon SVG ──────────────────────────────────────────────────
function ThreadsIcon({ size = 20, color = "#000" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 192 192" fill={color}>
      <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.264-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.683 22.231-5.436 29.049-14.127 5.178-6.6 8.452-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.206 17.11 97.015 16.94c22.975.17 40.526 7.52 52.171 21.847 5.71 7.026 10.015 15.86 12.853 26.162l16.147-4.308c-3.44-12.68-8.853-23.606-16.219-32.668C147.036 9.607 125.202.195 97.101 0h-.186C68.841.195 47.238 9.636 32.899 28.047 20.17 44.346 13.643 67.352 13.404 96v.004c.239 28.648 6.766 51.664 19.495 68.047C47.238 182.364 68.841 191.805 96.915 192h.186c24.692-.187 42.038-6.61 56.328-20.868 18.806-18.777 18.274-42.922 12.078-57.564-4.451-10.376-13.031-18.752-23.97-23.58zM97.45 128.Groups c-10.243.575-20.857-4.016-21.384-13.795-.397-7.42 5.27-15.693 22.904-16.705 2.003-.115 3.974-.17 5.913-.17 6.476 0 12.542.617 18.072 1.8-2.058 25.706-15.3 28.29-25.505 28.87z"/>
    </svg>
  );
}

// ── Growth Prediction ─────────────────────────────────────────────────
function GrowthPrediction({ prediction, topic }) {
  C = getThemeC();
  if (!prediction) return null;
  const { virality_score, estimated_likes, estimated_replies, estimated_reposts,
          estimated_follows, next_milestone, recommendation,
          best_post_time, tip } = prediction;
  const col = virality_score >= 70 ? C.success : virality_score >= 50 ? C.warn : C.muted;

  return (
    <div style={{ background:`linear-gradient(145deg,${C.purpleXlt},${C.glass})`, border:`1.5px solid ${C.purple}33`, borderRadius:"16px", padding:"18px", marginBottom:"20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"14px" }}>
        <div>
          <div style={{ fontSize:"11px", fontWeight:"900", letterSpacing:"1.5px", textTransform:"uppercase", color:C.purple, marginBottom:"4px" }}>🤖 AI Growth Prediction</div>
          <div style={{ fontSize:"13.5px", fontWeight:"700", color:C.ink }}>If you post: <span style={{ color:C.purple }}>"{topic}"</span></div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:"22px", fontWeight:"900", color:col }}>{virality_score}</div>
          <div style={{ fontSize:"9px", fontWeight:"800", color:C.muted, textTransform:"uppercase" }}>Virality</div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px", marginBottom:"14px" }}>
        {[
          { icon:"❤️", label:"Est. Likes",   val:fmt(estimated_likes)   },
          { icon:"💬", label:"Est. Replies", val:fmt(estimated_replies)  },
          { icon:"🔁", label:"Est. Reposts", val:fmt(estimated_reposts)  },
          { icon:"👥", label:"Est. Follows", val:`+${fmt(estimated_follows)}` },
        ].map((s, i) => (
          <div key={i} style={{ background:`rgba(255,255,255,0.1)`, borderRadius:"10px", padding:"8px", textAlign:"center", border:`1px solid ${C.hairline}` }}>
            <div style={{ fontSize:"16px" }}>{s.icon}</div>
            <div style={{ fontSize:"14px", fontWeight:"900", color:C.ink }}>{s.val}</div>
            <div style={{ fontSize:"9px", color:C.muted, fontWeight:"600" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {next_milestone && (
        <div style={{ background:`${C.success}15`, border:`1px solid ${C.success}33`, borderRadius:"10px", padding:"10px 14px", marginBottom:"10px", fontSize:"12.5px", color:C.slate }}>
          🏆 At this pace → <strong style={{ color:C.success }}>{fmt(next_milestone.target)} followers</strong> in ~{next_milestone.months} month{next_milestone.months !== 1 ? "s" : ""}
        </div>
      )}

      <div style={{ fontSize:"12px", color:C.slate, lineHeight:1.6 }}>
        <div style={{ marginBottom:"3px" }}>💡 {recommendation}</div>
        <div style={{ marginBottom:"3px" }}>🕐 <strong>Best time:</strong> {best_post_time}</div>
        <div>✍️ <strong>Tip:</strong> {tip}</div>
      </div>
    </div>
  );
}

// ── Publisher ─────────────────────────────────────────────────────────
function ThreadPublisher({ topic, onPublished }) {
  C = getThemeC();
  const [text,      setText    ] = useState(topic ? topic.slice(0, 450) : "");
  const [loading,   setLoading ] = useState(false);
  const [result,    setResult  ] = useState(null);
  const [err,       setErr     ] = useState("");
  const maxChars = 500;
  const remaining = maxChars - text.length;

  const publish = async () => {
    if (!text.trim()) { setErr("Please write something to post."); return; }
    setLoading(true); setErr(""); setResult(null);
    try {
      const resp = await fetch(`${BASE}/threads/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await resp.json();
      if (data.success) {
        setResult(data);
        if (onPublished) onPublished(data);
      } else {
        setErr(data.detail || "Failed to publish.");
      }
    } catch (e) {
      setErr(e.message || "Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:"16px", padding:"18px", marginBottom:"20px" }}>
      <div style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.2px", textTransform:"uppercase", color:C.muted, marginBottom:"12px" }}>
        ✍️ Publish to Threads
      </div>

      {result ? (
        <div style={{ textAlign:"center", padding:"16px" }}>
          <div style={{ fontSize:"32px", marginBottom:"8px" }}>🎉</div>
          <p style={{ fontSize:"14px", fontWeight:"700", color:C.success, marginBottom:"8px" }}>Posted successfully!</p>
          <a href={result.url} target="_blank" rel="noreferrer" style={{ fontSize:"12px", color:C.purple, fontWeight:"600" }}>View on Threads →</a>
          <br />
          <button onClick={() => { setResult(null); setText(""); }} style={{ marginTop:"12px", padding:"8px 20px", borderRadius:"99px", border:"none", background:C.purple, color:C.white, fontWeight:"700", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>Post Another</button>
        </div>
      ) : (
        <>
          <textarea
            value={text}
            onChange={e => setText(e.target.value.slice(0, maxChars))}
            placeholder="Write your thread here... (max 500 chars)"
            rows={4}
            style={{ width:"100%", padding:"12px 14px", borderRadius:"12px", border:`1.5px solid ${C.hairline}`, background:C.glass, color:C.ink, fontSize:"13.5px", lineHeight:1.7, fontFamily:"inherit", resize:"vertical", outline:"none", boxSizing:"border-box" }}
          />
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"8px" }}>
            <span style={{ fontSize:"11.5px", color: remaining < 50 ? C.danger : C.muted, fontWeight:"600" }}>
              {remaining} chars remaining
            </span>
            <button onClick={publish} disabled={loading || !text.trim()} style={{ padding:"9px 22px", borderRadius:"99px", border:"none", background:`linear-gradient(135deg,#000,#333)`, color:"#fff", fontWeight:"800", fontSize:"12.5px", cursor: loading || !text.trim() ? "not-allowed" : "pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:"7px", opacity: loading || !text.trim() ? 0.6 : 1 }}>
              <ThreadsIcon size={14} color="#fff" />
              {loading ? "Posting…" : "Post to Threads"}
            </button>
          </div>
          {err && <p style={{ fontSize:"12px", color:C.danger, fontWeight:"600", marginTop:"8px" }}>⚠ {err}</p>}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════
export default function ThreadsDashboard({ topic = "" }) {
  C = getThemeC();

  const [profile,    setProfile   ] = useState(null);
  const [posts,      setPosts     ] = useState([]);
  const [insights,   setInsights  ] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading,    setLoading   ] = useState(true);
  const [connected,  setConnected ] = useState(false);
  const [activeChart,setActiveChart] = useState("views");
  const [days,       setDays      ] = useState(30);
  const [activeTab,  setActiveTab ] = useState("analytics"); // "analytics" | "publish"

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const statusRes = await fetch(`${BASE}/threads/status`);
      const status    = await statusRes.json();
      if (!status.connected) { setConnected(false); setLoading(false); return; }
      setConnected(true);
      setProfile(status);

      const [insightsRes, postsRes] = await Promise.all([
        fetch(`${BASE}/threads/insights?days=${days}`),
        fetch(`${BASE}/threads/posts?limit=10`),
      ]);
      const [insightsData, postsData] = await Promise.all([
        insightsRes.json(),
        postsRes.json(),
      ]);
      setInsights(insightsData);
      setPosts(postsData.posts || []);

      if (topic) {
        const predRes  = await fetch(`${BASE}/threads/predict?topic=${encodeURIComponent(topic)}`);
        const predData = await predRes.json();
        setPrediction(predData);
      }
    } catch (e) {
      console.error("ThreadsDashboard load error:", e);
    } finally {
      setLoading(false);
    }
  }, [days, topic]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;

  if (!connected) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"48px 24px", gap:"16px", textAlign:"center" }}>
        <div style={{ width:"64px", height:"64px", borderRadius:"18px", background:"#000", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 12px 32px rgba(0,0,0,0.3)" }}>
          <ThreadsIcon size={36} color="#fff" />
        </div>
        <h2 style={{ fontSize:"18px", fontWeight:"900", color:C.ink }}>Threads Not Connected</h2>
        <p style={{ fontSize:"13px", color:C.muted, maxWidth:"320px", lineHeight:1.6 }}>
          Add <strong>THREADS_ACCESS_TOKEN</strong> and <strong>THREADS_USER_ID</strong> to your <code>.env</code> file to connect your Threads account.
        </p>
        <div style={{ background:`${C.purple}10`, border:`1px solid ${C.hairline}`, borderRadius:"12px", padding:"14px", fontSize:"12px", color:C.slate, textAlign:"left", maxWidth:"340px" }}>
          <strong>In backend/.env add:</strong><br />
          THREADS_ACCESS_TOKEN=your_token<br />
          THREADS_USER_ID=your_user_id
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif" }}>

      {/* Profile header */}
      <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"20px", background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:"16px", padding:"14px 18px" }}>
        {profile?.profile_pic
          ? <img src={profile.profile_pic} alt="" referrerPolicy="no-referrer" style={{ width:"48px", height:"48px", borderRadius:"50%", border:"2px solid #00000022", objectFit:"cover", flexShrink:0 }} onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex"; }} />
          : null
        }
        <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:"#000", display: profile?.profile_pic ? "none" : "flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <ThreadsIcon size={24} color="#fff" />
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:"15px", fontWeight:"800", color:C.ink }}>@{profile?.username || "sociomeeai.offical"}</div>
          <div style={{ fontSize:"11.5px", color:C.muted }}>{profile?.display_name} · {fmt(profile?.followers)} followers</div>
        </div>
        <a href={profile?.profile_url || "https://threads.net"} target="_blank" rel="noreferrer" style={{ padding:"5px 12px", borderRadius:"99px", border:`1px solid ${C.hairline}`, background:"rgba(0,0,0,0.06)", color:C.slate, fontSize:"11.5px", fontWeight:"700", textDecoration:"none" }}>View Profile</a>
      </div>

      {/* Stat cards */}
      <div style={{ display:"flex", gap:"10px", flexWrap:"wrap", marginBottom:"20px" }}>
        <StatCard icon="👥" label="Followers"     value={fmt(profile?.followers)}              color="#000" />
        <StatCard icon="👁️" label={`Views (${days}d)`} value={fmt(insights?.total_views)}   color={C.purple} />
        <StatCard icon="❤️" label={`Likes (${days}d)`} value={fmt(insights?.total_likes)}    color={C.rose} />
        <StatCard icon="💬" label={`Replies (${days}d)`} value={fmt(insights?.total_replies)} color={C.teal} />
      </div>

      {/* Tab toggle */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"20px" }}>
        {[["analytics","📊 Analytics"],["publish","✍️ Publish"]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{ padding:"8px 18px", borderRadius:"99px", border:`1.5px solid ${activeTab===key?C.purple:C.hairline}`, background:activeTab===key?`${C.purple}18`:"transparent", color:activeTab===key?C.purple:C.muted, fontWeight:"700", fontSize:"12.5px", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === "publish" && (
        <>
          <ThreadPublisher topic={topic} onPublished={() => setTimeout(load, 3000)} />
          {topic && <GrowthPrediction prediction={prediction} topic={topic} />}
        </>
      )}

      {activeTab === "analytics" && (
        <>
          {/* Chart */}
          <div style={{ background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:"16px", padding:"18px", marginBottom:"20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
              <span style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.2px", textTransform:"uppercase", color:C.muted }}>📈 Engagement</span>
              <div style={{ display:"flex", gap:"5px" }}>
                {[["views","Views",C.purple],["likes","Likes",C.rose],["replies","Replies",C.teal]].map(([key,label,col]) => (
                  <button key={key} onClick={() => setActiveChart(key)} style={{ padding:"4px 10px", borderRadius:"99px", border:`1.5px solid ${activeChart===key?col:C.hairline}`, background:activeChart===key?col+"18":"transparent", color:activeChart===key?col:C.muted, fontSize:"11px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>{label}</button>
                ))}
                {[7,30,90].map(d => (
                  <button key={d} onClick={() => setDays(d)} style={{ padding:"4px 9px", borderRadius:"99px", border:`1.5px solid ${days===d?C.teal:C.hairline}`, background:days===d?C.teal+"18":"transparent", color:days===d?C.teal:C.muted, fontSize:"11px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit" }}>{d}d</button>
                ))}
              </div>
            </div>
            {insights?.chart_data?.length > 0
              ? <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={insights.chart_data} margin={{ top:5, right:10, left:-20, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.hairline} />
                    <XAxis dataKey="date" tick={{ fontSize:9, fill:C.muted }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize:9, fill:C.muted }} tickLine={false} axisLine={false} tickFormatter={fmt} />
                    <Tooltip contentStyle={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:"10px", fontSize:"12px" }} formatter={val => [fmt(val), activeChart]} />
                    <Line type="monotone" dataKey={activeChart} stroke={activeChart==="views"?C.purple:activeChart==="likes"?C.rose:C.teal} strokeWidth={2.5} dot={false} activeDot={{ r:5, strokeWidth:0 }} />
                  </LineChart>
                </ResponsiveContainer>
              : <p style={{ textAlign:"center", color:C.muted, fontSize:"13px", padding:"40px 0" }}>No data available yet.</p>
            }
            {insights?.is_mock && <p style={{ textAlign:"center", fontSize:"10px", color:C.muted, marginTop:"6px" }}>⚠ Demo data — insights API may need threads_manage_insights permission</p>}
          </div>

          {/* Growth prediction */}
          {topic && <GrowthPrediction prediction={prediction} topic={topic} />}

          {/* Recent posts */}
          <div style={{ background:C.glass, backdropFilter:"blur(16px)", border:`1px solid ${C.hairline}`, borderRadius:"16px", padding:"18px" }}>
            <div style={{ fontSize:"11px", fontWeight:"800", letterSpacing:"1.2px", textTransform:"uppercase", color:C.muted, marginBottom:"14px" }}>🧵 Recent Threads</div>
            {posts.length === 0
              ? <p style={{ textAlign:"center", color:C.muted, fontSize:"13px", padding:"20px" }}>No posts found.</p>
              : posts.map((post, i) => (
                <div key={i} style={{ background:C.glass, border:`1px solid ${C.hairline}`, borderRadius:"12px", padding:"12px 14px", marginBottom:"8px" }}>
                  <p style={{ fontSize:"13px", color:C.ink, lineHeight:1.6, marginBottom:"8px" }}>{post.text || "(No text)"}</p>
                  <div style={{ display:"flex", gap:"16px", fontSize:"11.5px", color:C.muted, fontWeight:"600" }}>
                    <span>❤️ {fmt(post.likes)}</span>
                    <span>💬 {fmt(post.replies)}</span>
                    <span>🔁 {fmt(post.reposts)}</span>
                    <span style={{ marginLeft:"auto" }}>{post.timestamp}</span>
                  </div>
                </div>
              ))
            }
          </div>
        </>
      )}

      <style>{"@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');*{box-sizing:border-box;margin:0;padding:0}@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );
}