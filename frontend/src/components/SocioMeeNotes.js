import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "sociomee_notes_v2";

const NOTE_COLORS = [
  { id: "dark",   card: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)", accent: "#a78bfa" },
  { id: "purple", card: "linear-gradient(135deg,#4c1d95,#6d28d9)", border: "rgba(124,58,237,0.4)", accent: "#c4b5fd" },
  { id: "pink",   card: "linear-gradient(135deg,#9d174d,#ec4899)", border: "rgba(236,72,153,0.4)", accent: "#f9a8d4" },
  { id: "blue",   card: "linear-gradient(135deg,#1e3a5f,#3b82f6)", border: "rgba(59,130,246,0.4)", accent: "#93c5fd" },
  { id: "green",  card: "linear-gradient(135deg,#064e3b,#10b981)", border: "rgba(16,185,129,0.4)", accent: "#6ee7b7" },
  { id: "orange", card: "linear-gradient(135deg,#78350f,#f59e0b)", border: "rgba(245,158,11,0.4)", accent: "#fcd34d" },
  { id: "rose",   card: "linear-gradient(135deg,#7f1d1d,#ef4444)", border: "rgba(239,68,68,0.4)", accent: "#fca5a5" },
];

const CATEGORIES = [
  { id: "all",     label: "All Notes",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { id: "ideas",   label: "Ideas",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> },
  { id: "scripts", label: "Scripts",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  { id: "hooks",   label: "Hooks",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h8m-8 6h16"/></svg> },
  { id: "tasks",   label: "To-Do",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  { id: "sticky",  label: "Sticky",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9z"/><polyline points="15 3 15 9 21 9"/></svg> },
  { id: "drafts",  label: "Drafts",
    icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
];

function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function timeAgo(ts) {
  const d = Date.now() - ts, m = Math.floor(d/60000), h = Math.floor(d/3600000), dy = Math.floor(d/86400000);
  if (m < 1) return "just now"; if (m < 60) return `${m}m ago`; if (h < 24) return `${h}h ago`; return `${dy}d ago`;
}

function shareNote(note) {
  const text = `${note.title}\n\n${note.body || note.todos?.map(t=>(t.done?"✓ ":"• ")+t.text).join("\n") || ""}`;
  if (navigator.share) { navigator.share({ title: note.title, text }); }
  else {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }
}

function TodoItem({ item, onChange, onDelete }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"6px" }}>
      <input type="checkbox" checked={item.done} onChange={e => onChange({ ...item, done: e.target.checked })}
        style={{ width:"14px", height:"14px", accentColor:"#7c3aed", cursor:"pointer", flexShrink:0 }}/>
      <input value={item.text} onChange={e => onChange({ ...item, text: e.target.value })}
        style={{ flex:1, background:"transparent", border:"none", outline:"none", color:item.done?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.85)", fontSize:"13px", fontFamily:"Poppins,sans-serif", textDecoration:item.done?"line-through":"none" }}
        placeholder="Add task..."/>
      <button onClick={onDelete} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.25)", cursor:"pointer", fontSize:"16px", padding:"0 2px", lineHeight:1 }}>×</button>
    </div>
  );
}

function NoteCard({ note, onClick, onDelete, onPin }) {
  const [hov, setHov] = useState(false);
  const col = NOTE_COLORS.find(c => c.id === note.color) || NOTE_COLORS[0];
  const todos = note.todos || [];

  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background:col.card, borderRadius:"14px", padding:"16px", cursor:"pointer", position:"relative",
        transform:hov?"translateY(-3px)":"translateY(0)",
        boxShadow:hov?"0 16px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.2)":"0 4px 16px rgba(0,0,0,0.3)",
        transition:"all 0.2s ease", minHeight:"150px", display:"flex", flexDirection:"column", gap:"8px",
        border:`1px solid ${hov?"rgba(124,58,237,0.35)":col.border}`,
        backdropFilter:note.color==="dark"?"blur(16px)":"none",
        WebkitBackdropFilter:note.color==="dark"?"blur(16px)":"none",
      }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        {note.category && note.category !== "all" && (
          <span style={{ fontSize:"9px", fontWeight:"700", padding:"2px 8px", borderRadius:"99px", background:"rgba(255,255,255,0.12)", color:"rgba(255,255,255,0.75)", letterSpacing:"1px", textTransform:"uppercase", fontFamily:"Poppins,sans-serif" }}>
            {CATEGORIES.find(c => c.id === note.category)?.label}
          </span>
        )}
        <span style={{ fontSize:"9px", color:"rgba(255,255,255,0.35)", marginLeft:"auto", fontFamily:"Poppins,sans-serif" }}>{timeAgo(note.updatedAt)}</span>
      </div>

      <h3 style={{ fontSize:"14px", fontWeight:"800", color:"#fff", margin:0, lineHeight:1.3, fontFamily:"Poppins,sans-serif" }}>
        {note.title || "Untitled"}
        {note.pinned && <span style={{ marginLeft:"6px", fontSize:"10px" }}>📌</span>}
      </h3>

      {note.type === "todo" && todos.length > 0 ? (
        <div style={{ flex:1 }}>
          {todos.slice(0, 4).map(t => (
            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"4px" }}>
              <div style={{ width:"11px", height:"11px", borderRadius:"3px", border:"1px solid rgba(255,255,255,0.35)", background:t.done?"rgba(124,58,237,0.6)":"transparent", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {t.done && <svg width="7" height="7" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth="2" fill="none"/></svg>}
              </div>
              <span style={{ fontSize:"11px", color:t.done?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.8)", textDecoration:t.done?"line-through":"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"Poppins,sans-serif" }}>{t.text}</span>
            </div>
          ))}
          {todos.length > 4 && <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.3)", fontFamily:"Poppins,sans-serif" }}>+{todos.length-4} more</span>}
          <div style={{ marginTop:"6px", fontSize:"10px", color:"rgba(255,255,255,0.4)", fontFamily:"Poppins,sans-serif" }}>{todos.filter(t=>t.done).length}/{todos.length} done</div>
        </div>
      ) : (
        <p style={{ fontSize:"12px", color:"rgba(255,255,255,0.65)", lineHeight:1.65, margin:0, flex:1, display:"-webkit-box", WebkitLineClamp:4, WebkitBoxOrient:"vertical", overflow:"hidden", fontFamily:"Poppins,sans-serif" }}>
          {note.body || "Empty note..."}
        </p>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:"8px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
        <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.3)", fontFamily:"Poppins,sans-serif" }}>
          {note.type === "todo" ? "To-Do" : note.type === "sticky" ? "Sticky" : "Note"}
        </span>
        <div style={{ display:"flex", gap:"4px" }}>
          <button onClick={e=>{e.stopPropagation();shareNote(note);}} title="Share"
            style={{ background:"rgba(255,255,255,0.07)", border:"none", borderRadius:"6px", padding:"3px 7px", color:"rgba(255,255,255,0.5)", cursor:"pointer" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          </button>
          <button onClick={e=>{e.stopPropagation();onPin(note.id);}} title={note.pinned?"Unpin":"Pin"}
            style={{ background:"rgba(255,255,255,0.07)", border:"none", borderRadius:"6px", padding:"3px 7px", color:"rgba(255,255,255,0.5)", cursor:"pointer" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </button>
          <button onClick={e=>{e.stopPropagation();onDelete(note.id);}} title="Delete"
            style={{ background:"rgba(239,68,68,0.15)", border:"none", borderRadius:"6px", padding:"3px 7px", color:"rgba(239,68,68,0.7)", cursor:"pointer" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function NoteEditor({ note, onSave, onClose }) {
  const [title, setTitle]       = useState(note?.title    || "");
  const [body, setBody]         = useState(note?.body     || "");
  const [color, setColor]       = useState(note?.color    || "dark");
  const [category, setCategory] = useState(note?.category || "ideas");
  const [type, setType]         = useState(note?.type     || "note");
  const [todos, setTodos]       = useState(note?.todos    || []);
  const [saved, setSaved]       = useState(true);
  const timer = useRef(null);
  const col = NOTE_COLORS.find(c => c.id === color) || NOTE_COLORS[0];

  function autoSave(fields) {
    setSaved(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { onSave(fields); setSaved(true); }, 500);
  }

  function addTodo() {
    const n = [...todos, { id:generateId(), text:"", done:false }];
    setTodos(n); autoSave({ title, body, color, category, type, todos:n });
  }

  function updateTodo(id, upd) {
    const n = todos.map(t => t.id===id ? upd : t);
    setTodos(n); autoSave({ title, body, color, category, type, todos:n });
  }

  function deleteTodo(id) {
    const n = todos.filter(t => t.id!==id);
    setTodos(n); autoSave({ title, body, color, category, type, todos:n });
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ width:"100%", maxWidth:"660px", maxHeight:"88vh", background:col.card, borderRadius:"20px", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.7)", border:`1px solid ${col.border}`, backdropFilter:color==="dark"?"blur(24px)":"none", WebkitBackdropFilter:color==="dark"?"blur(24px)":"none" }}>

        {/* Toolbar */}
        <div style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.08)", display:"flex", alignItems:"center", gap:"8px", flexWrap:"wrap", background:"rgba(0,0,0,0.15)" }}>
          {/* Type */}
          {[["Note","note"],["To-Do","todo"],["Sticky","sticky"]].map(([l,t]) => (
            <button key={t} onClick={() => { setType(t); autoSave({ title, body, color, category, type:t, todos }); }}
              style={{ padding:"4px 12px", borderRadius:"99px", border:`1px solid ${type===t?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.1)"}`, background:type===t?"rgba(255,255,255,0.15)":"transparent", color:type===t?"#fff":"rgba(255,255,255,0.45)", fontSize:"11px", fontWeight:"700", cursor:"pointer", fontFamily:"Poppins,sans-serif" }}>{l}</button>
          ))}
          <div style={{ width:"1px", height:"18px", background:"rgba(255,255,255,0.1)" }}/>
          {/* Category */}
          <select value={category} onChange={e => { setCategory(e.target.value); autoSave({ title, body, color, category:e.target.value, type, todos }); }}
            style={{ padding:"4px 10px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"#fff", fontSize:"11px", fontFamily:"Poppins,sans-serif", cursor:"pointer", outline:"none" }}>
            {CATEGORIES.filter(c=>c.id!=="all").map(c=><option key={c.id} value={c.id} style={{background:"#1a1a2e"}}>{c.label}</option>)}
          </select>
          <div style={{ width:"1px", height:"18px", background:"rgba(255,255,255,0.1)" }}/>
          {/* Colors */}
          <div style={{ display:"flex", gap:"5px", alignItems:"center" }}>
            {NOTE_COLORS.map(nc => (
              <button key={nc.id} onClick={() => { setColor(nc.id); autoSave({ title, body, color:nc.id, category, type, todos }); }}
                style={{ width:"16px", height:"16px", borderRadius:"50%", border:color===nc.id?"2px solid #fff":"2px solid transparent", background:nc.id==="dark"?"rgba(255,255,255,0.2)":nc.accent, cursor:"pointer", padding:0, outline:color===nc.id?"2px solid rgba(255,255,255,0.25)":"none", transition:"all 0.15s" }}/>
            ))}
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:"8px", alignItems:"center" }}>
            <span style={{ fontSize:"10px", color:saved?"#6ee7b7":"rgba(255,255,255,0.35)", fontFamily:"Poppins,sans-serif" }}>{saved?"✓ Saved":"Saving..."}</span>
            <button onClick={() => shareNote({ title, body, todos })}
              style={{ padding:"4px 10px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.7)", fontSize:"11px", cursor:"pointer", fontFamily:"Poppins,sans-serif", display:"flex", alignItems:"center", gap:"4px" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Share
            </button>
            <button onClick={onClose} style={{ padding:"4px 12px", borderRadius:"99px", border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.7)", fontSize:"11px", cursor:"pointer", fontFamily:"Poppins,sans-serif" }}>Close</button>
          </div>
        </div>

        {/* Title */}
        <input value={title} onChange={e=>{setTitle(e.target.value);autoSave({title:e.target.value,body,color,category,type,todos});}}
          placeholder="Note title..." autoFocus
          style={{ padding:"18px 20px 8px", fontSize:"21px", fontWeight:"800", color:"#fff", background:"transparent", border:"none", outline:"none", fontFamily:"Poppins,sans-serif", width:"100%", boxSizing:"border-box" }}/>

        {/* Body */}
        <div style={{ flex:1, overflowY:"auto", padding:"4px 20px 16px" }}>
          {type==="todo" ? (
            <div>
              {todos.map(t => <TodoItem key={t.id} item={t} onChange={u=>updateTodo(t.id,u)} onDelete={()=>deleteTodo(t.id)}/>)}
              <button onClick={addTodo} style={{ display:"flex", alignItems:"center", gap:"6px", background:"rgba(255,255,255,0.05)", border:"1px dashed rgba(255,255,255,0.15)", borderRadius:"8px", padding:"7px 14px", color:"rgba(255,255,255,0.4)", fontSize:"12px", cursor:"pointer", fontFamily:"Poppins,sans-serif", marginTop:"8px", width:"100%" }}>+ Add task</button>
            </div>
          ) : (
            <textarea value={body} onChange={e=>{setBody(e.target.value);autoSave({title,body:e.target.value,color,category,type,todos});}}
              placeholder={type==="sticky"?"Quick thought...":"Write your idea, script, hook or caption..."}
              style={{ width:"100%", minHeight:"220px", background:"transparent", border:"none", outline:"none", resize:"none", color:"rgba(255,255,255,0.82)", fontSize:"14px", fontFamily:"Poppins,sans-serif", lineHeight:1.9, boxSizing:"border-box" }}/>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"8px 20px", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", gap:"12px", background:"rgba(0,0,0,0.1)" }}>
          <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.2)", fontFamily:"Poppins,sans-serif" }}>{body.trim().split(/\s+/).filter(Boolean).length} words</span>
          <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.2)", fontFamily:"Poppins,sans-serif" }}>{body.length} chars</span>
          {type==="todo" && <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.2)", fontFamily:"Poppins,sans-serif" }}>{todos.filter(t=>t.done).length}/{todos.length} done</span>}
        </div>
      </div>
    </div>
  );
}

export default function SocioMeeNotes({ onSendToGenerator }) {
  const [notes, setNotes]           = useState([]);
  const [activeCat, setActiveCat]   = useState("all");
  const [search, setSearch]         = useState("");
  const [editingNote, setEditingNote] = useState(null);
  const [viewMode, setViewMode]     = useState("grid");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = "Notes | SocioMee";
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) setNotes(JSON.parse(s)); } catch {}
    return () => { document.title = "SocioMee"; };
  }, []);

  function persist(updated) { setNotes(updated); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {} }

  function createNote(type="note") {
    const n = { id:generateId(), title:"", body:"", color:"dark", category:"ideas", type, todos:[], pinned:false, createdAt:Date.now(), updatedAt:Date.now() };
    const upd = [n, ...notes]; persist(upd); setEditingNote(n);
  }

  function saveNote(id, fields) {
    const upd = notes.map(n => n.id===id ? { ...n, ...fields, updatedAt:Date.now() } : n);
    persist(upd); setEditingNote(p => p?.id===id ? { ...p, ...fields } : p);
  }

  function deleteNote(id) { persist(notes.filter(n=>n.id!==id)); if (editingNote?.id===id) setEditingNote(null); }
  function pinNote(id)    { persist(notes.map(n => n.id===id ? { ...n, pinned:!n.pinned } : n)); }

  const filtered = notes.filter(n => {
    const mc = activeCat==="all" || n.category===activeCat;
    const ms = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase());
    return mc && ms;
  }).sort((a,b) => (b.pinned?1:0)-(a.pinned?1:0) || b.updatedAt-a.updatedAt);

  const counts = {};
  CATEGORIES.forEach(c => { counts[c.id] = c.id==="all" ? notes.length : notes.filter(n=>n.category===c.id).length; });

  return (
    <div style={{ display:"flex", width:"100%", height:"100vh", background:"#0a0a0a", fontFamily:"Poppins,sans-serif", overflow:"hidden" }}>

      {/* Notes Sidebar — flush next to app sidebar */}
      {mobileSidebarOpen && <div onClick={()=>setMobileSidebarOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9997,display:"none"}} className="notes-mob-overlay"/>}
      <div className="notes-mobile-sidebar" style={{ width:"180px", flexShrink:0, borderRight:"1px solid rgba(255,255,255,0.06)", background:"rgba(6,4,15,0.97)", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"14px 12px 10px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"12px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.8)" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            <span style={{ fontSize:"12px", fontWeight:"800", color:"#fff", fontFamily:"Poppins,sans-serif" }}>Notes</span>
            <span style={{ fontSize:"9px", background:"rgba(124,58,237,0.25)", color:"#a78bfa", padding:"1px 6px", borderRadius:"99px", fontWeight:"700" }}>{notes.length}</span>
            <button className="notes-mobile-close" onClick={()=>setMobileSidebarOpen(false)}
              style={{ marginLeft:"auto", background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer", padding:"2px", display:"none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"3px" }}>
            {[
              ["note",   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>, "New Note"],
              ["todo",   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>, "New To-Do"],
              ["sticky", <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9z"/><polyline points="15 3 15 9 21 9"/></svg>, "New Sticky"],
            ].map(([type, icon, label]) => (
              <button key={type} onClick={() => createNote(type)}
                style={{ display:"flex", alignItems:"center", gap:"7px", padding:"6px 9px", borderRadius:"7px", border:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.03)", color:"rgba(255,255,255,0.5)", fontSize:"11px", fontWeight:"600", cursor:"pointer", fontFamily:"Poppins,sans-serif", textAlign:"left", transition:"all 0.15s" }}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(124,58,237,0.1)";e.currentTarget.style.color="rgba(255,255,255,0.8)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.03)";e.currentTarget.style.color="rgba(255,255,255,0.5)";}}>
                {icon}{label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div style={{ flex:1, overflowY:"auto", padding:"6px 6px" }}>
          <div style={{ fontSize:"9px", fontWeight:"700", color:"rgba(255,255,255,0.18)", letterSpacing:"1.5px", padding:"8px 6px 4px", textTransform:"uppercase", fontFamily:"Poppins,sans-serif" }}>Categories</div>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCat(cat.id)}
              style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 9px", borderRadius:"7px", border:"none", borderLeft:activeCat===cat.id?"2px solid #7c3aed":"2px solid transparent", background:activeCat===cat.id?"rgba(124,58,237,0.12)":"transparent", color:activeCat===cat.id?"#c4b5fd":"rgba(255,255,255,0.4)", fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:"Poppins,sans-serif", marginBottom:"1px", transition:"all 0.15s" }}>
              <span style={{ display:"flex", alignItems:"center", gap:"7px" }}>{cat.icon}{cat.label}</span>
              <span style={{ fontSize:"9px", background:"rgba(255,255,255,0.05)", padding:"1px 5px", borderRadius:"99px", color:"rgba(255,255,255,0.25)" }}>{counts[cat.id]||0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Topbar */}
        <div style={{ padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:"10px" }}>
          <button className="notes-menu-btn" onClick={()=>setMobileSidebarOpen(true)}
            style={{ display:"none", background:"none", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"7px", padding:"6px 8px", color:"rgba(255,255,255,0.5)", cursor:"pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div style={{ flex:1, position:"relative" }}>
            <svg style={{ position:"absolute", left:"10px", top:"50%", transform:"translateY(-50%)", opacity:0.3 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search notes..."
              style={{ width:"100%", padding:"7px 12px 7px 30px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"8px", color:"#fff", fontSize:"12px", fontFamily:"Poppins,sans-serif", outline:"none", boxSizing:"border-box" }}/>
          </div>
          <button onClick={() => setViewMode(v=>v==="grid"?"list":"grid")}
            style={{ padding:"6px 11px", borderRadius:"7px", border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.03)", color:"rgba(255,255,255,0.45)", fontSize:"11px", cursor:"pointer", fontFamily:"Poppins,sans-serif", fontWeight:"600", display:"flex", alignItems:"center", gap:"5px" }}>
            {viewMode==="grid"
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
            {viewMode==="grid"?"List":"Grid"}
          </button>
          <span style={{ fontSize:"11px", color:"rgba(255,255,255,0.2)", fontFamily:"Poppins,sans-serif", whiteSpace:"nowrap" }}>{filtered.length} notes</span>
        </div>

        {/* Grid */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>
          {filtered.length===0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60%", gap:"14px" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.25)", margin:0, fontFamily:"Poppins,sans-serif" }}>{notes.length===0?"No notes yet. Create one!":"No matching notes."}</p>
              {notes.length===0 && (
                <div style={{ display:"flex", gap:"8px" }}>
                  {[["Note","note"],["To-Do","todo"],["Sticky","sticky"]].map(([l,t]) => (
                    <button key={t} onClick={()=>createNote(t)}
                      style={{ padding:"7px 14px", borderRadius:"99px", border:"1px solid rgba(124,58,237,0.35)", background:"rgba(124,58,237,0.1)", color:"#a78bfa", fontSize:"11px", fontWeight:"600", cursor:"pointer", fontFamily:"Poppins,sans-serif" }}>{l}</button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display:viewMode==="grid"?"grid":"flex", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:"12px", flexDirection:"column" }}>
              {filtered.map(note => <NoteCard key={note.id} note={note} onClick={()=>setEditingNote(note)} onDelete={deleteNote} onPin={pinNote}/>)}
            </div>
          )}
        </div>
      </div>

      {editingNote && <NoteEditor note={editingNote} onSave={fields=>saveNote(editingNote.id,fields)} onClose={()=>setEditingNote(null)}/>}

      <style>{`
        @media(max-width:768px){
          .notes-menu-btn{ display:flex!important; }
          .notes-mobile-close{ display:flex!important; }
          .notes-mobile-sidebar{
            position:fixed!important; left:0!important; top:0!important;
            height:100vh!important; z-index:9998!important; width:220px!important;
            transition:transform 0.3s ease!important;
            box-shadow:4px 0 20px rgba(0,0,0,0.5)!important;
          }
        }
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.25);border-radius:99px}
      `}</style>
    </div>
  );
}
