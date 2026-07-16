import { useState, useRef, useEffect, useCallback } from "react";

const FONT = "'DM Sans','Syne',sans-serif";
const FONT_HEAD = "'Poppins',sans-serif";
const C = {
  bg: "#080810",
  border: "rgba(255,255,255,0.07)",
  card: "rgba(255,255,255,0.04)",
  cardHover: "rgba(255,255,255,0.07)",
  muted: "rgba(255,255,255,0.35)",
  dim: "rgba(255,255,255,0.18)",
  white: "#fff",
  sidebar: "rgba(255,255,255,0.02)",
};

const CATS = [
  { id:"all",     label:"All Notes",  icon:"M3 3h18v18H3z M3 9h18 M9 3v18" },
  { id:"ideas",   label:"Ideas",      icon:"M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7zM9 21h6 M10 17v1 M14 17v1" },
  { id:"scripts", label:"Scripts",    icon:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 13h6 M9 17h6" },
  { id:"hooks",   label:"Hooks",      icon:"M4 6h16M4 12h8m-8 6h16" },
  { id:"todo",    label:"To-Do",      icon:"M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
  { id:"sticky",  label:"Sticky",     icon:"M15 2H6a2 2 0 0 0-2 2v16l4-4h11a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" },
  { id:"drafts",  label:"Drafts",     icon:"M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" },
];

const COLORS = ["#fff","#f87171","#fb923c","#fbbf24","#4ade80","#60a5fa","#c084fc","#f472b6"];

function CatIcon({ d, size=14, color="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {d.split("M").filter(Boolean).map((p,i)=><path key={i} d={"M"+p}/>)}
    </svg>
  );
}

function timeAgo(ts) {
  if (!ts) return "";
  const d = (Date.now()-ts)/1000;
  if (d<60) return "just now";
  if (d<3600) return `${Math.floor(d/60)}m ago`;
  if (d<86400) return `${Math.floor(d/3600)}h ago`;
  return new Date(ts).toLocaleDateString("en-IN",{day:"numeric",month:"short"});
}

export default function SocioMeeNotes({ user, onSendToGenerator }) {
  const rawPlan = user?.plan || user?.plan_label || "free";
  const plan = rawPlan.toLowerCase().includes("premium") ? "premium" : rawPlan.toLowerCase().includes("pro") ? "pro" : "free";
  const isPro = plan === "pro" || plan === "premium";
  const isPremium = plan === "premium";

  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sociomee_notes_v2") || "[]"); } catch { return []; }
  });
  const [activeCat, setActiveCat] = useState("all");
  const [search, setSearch] = useState("");
  const [activeNote, setActiveNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [recordingText, setRecordingText] = useState("");
  const mediaRecRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { setTimeout(() => setLoading(false), 500); }, []);

  const save = (updated) => {
    setNotes(updated);
    try { localStorage.setItem("sociomee_notes_v2", JSON.stringify(updated)); } catch {}
  };

  const createNote = (type="note") => {
    const note = {
      id: Date.now(),
      type,
      title: type==="todo" ? "New To-Do" : type==="sticky" ? "Quick Note" : "Untitled",
      content: "",
      category: type==="todo" ? "todo" : type==="sticky" ? "sticky" : "drafts",
      color: "#fff",
      pinned: false,
      starred: false,
      image: null,
      todos: type==="todo" ? [{ id:Date.now(), text:"", done:false }] : [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [note, ...notes];
    save(updated);
    setActiveNote(note.id);
    setActiveCat(note.category);
  };

  const updateNote = (id, fields) => {
    const updated = notes.map(n => n.id===id ? {...n, ...fields, updatedAt:Date.now()} : n);
    save(updated);
    if (activeNote === id) setActiveNote(id);
  };

  const deleteNote = (id) => {
    save(notes.filter(n=>n.id!==id));
    if (activeNote===id) setActiveNote(null);
  };

  const addTodo = (noteId) => {
    const note = notes.find(n=>n.id===noteId);
    if (!note) return;
    updateNote(noteId, { todos:[...note.todos, {id:Date.now(),text:"",done:false}] });
  };

  const updateTodo = (noteId, todoId, fields) => {
    const note = notes.find(n=>n.id===noteId);
    if (!note) return;
    updateNote(noteId, { todos:note.todos.map(t=>t.id===todoId?{...t,...fields}:t) });
  };

  const deleteTodo = (noteId, todoId) => {
    const note = notes.find(n=>n.id===noteId);
    if (!note) return;
    updateNote(noteId, { todos:note.todos.filter(t=>t.id!==todoId) });
  };

  const startVoice = () => {
    if (!isPro) { alert("Voice to Note is available on Pro and Pro+ plans."); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported in this browser. Try Chrome."); return; }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-IN";
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r=>r[0].transcript).join(" ");
      setRecordingText(transcript);
    };
    rec.onend = () => {
      setRecording(false);
      if (recordingText.trim()) {
        const note = { id:Date.now(), type:"note", title:"Voice Note", content:recordingText.trim(), category:"drafts", color:"#fff", pinned:false, starred:false, image:null, todos:[], createdAt:Date.now(), updatedAt:Date.now() };
        const updated = [note, ...notes];
        save(updated);
        setActiveNote(note.id);
        setActiveCat("drafts");
        setRecordingText("");
      }
    };
    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  const handleImage = (noteId, file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => updateNote(noteId, { image:e.target.result });
    reader.readAsDataURL(file);
  };

  const filtered = notes.filter(n => {
    const matchCat = activeCat==="all" || n.category===activeCat;
    const matchSearch = !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a,b) => (b.pinned?1:0)-(a.pinned?1:0) || b.updatedAt-a.updatedAt);

  const catCounts = {};
  notes.forEach(n => { catCounts[n.category]=(catCounts[n.category]||0)+1; });

  const activeNoteObj = notes.find(n=>n.id===activeNote);

  const skel = { height:"60px", borderRadius:"10px", background:"rgba(255,255,255,0.04)", animation:"skpulse 1.4s ease-in-out infinite", marginBottom:"6px" };

  if (loading) return (
    <div style={{ display:"flex", height:"100vh", background:C.bg, fontFamily:FONT }}>
      <style>{`@keyframes skpulse{0%,100%{opacity:0.4}50%{opacity:1}}`}</style>
      <div style={{ width:"200px", flexShrink:0, borderRight:"1px solid rgba(255,255,255,0.06)", padding:"16px", display:"flex", flexDirection:"column", gap:"8px" }}>
        {[1,2,3,4,5,6,7].map(i=><div key={i} style={{ height:"32px", borderRadius:"8px", background:"rgba(255,255,255,0.04)", animation:"skpulse 1.4s ease-in-out infinite" }}/>)}
      </div>
      <div style={{ width:"260px", flexShrink:0, borderRight:"1px solid rgba(255,255,255,0.06)", padding:"12px", display:"flex", flexDirection:"column", gap:"6px" }}>
        <div style={{ height:"36px", borderRadius:"8px", background:"rgba(255,255,255,0.04)", animation:"skpulse 1.4s ease-in-out infinite", marginBottom:"8px" }}/>
        {[1,2,3,4].map(i=><div key={i} style={skel}/>)}
      </div>
      <div style={{ flex:1, padding:"24px", display:"flex", flexDirection:"column", gap:"12px" }}>
        <div style={{ height:"40px", borderRadius:"8px", background:"rgba(255,255,255,0.04)", animation:"skpulse 1.4s ease-in-out infinite", width:"40%" }}/>
        <div style={{ height:"200px", borderRadius:"12px", background:"rgba(255,255,255,0.03)", animation:"skpulse 1.4s ease-in-out infinite" }}/>
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", height:"100vh", background:C.bg, fontFamily:FONT, overflow:"hidden" }}>
      <style>{`
        @keyframes skpulse{0%,100%{opacity:0.4}50%{opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .nt-cat:hover{background:rgba(255,255,255,0.06)!important;}
        .nt-note:hover{background:rgba(255,255,255,0.06)!important;border-color:rgba(255,255,255,0.12)!important;}
        .nt-btn:hover{background:rgba(255,255,255,0.08)!important;color:#fff!important;}
        .nt-todo:hover .nt-del{opacity:1!important;}
        ::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.12);border-radius:99px}
      `}</style>

      {/* Sidebar */}
      <div style={{ width:"200px", flexShrink:0, borderRight:"1px solid rgba(255,255,255,0.06)", background:C.sidebar, backdropFilter:"blur(20px)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"14px 12px 10px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" }}>
            <span style={{ fontSize:"13px", fontWeight:"700", color:C.white, fontFamily:FONT_HEAD }}>Notes</span>
            <div style={{ display:"flex", gap:"3px" }}>
              {isPro && (
                <button onClick={recording?stopVoice:startVoice} className="nt-btn"
                  style={{ width:"26px", height:"26px", borderRadius:"7px", border:"none", background:recording?"rgba(239,68,68,0.15)":"transparent", color:recording?"#f87171":C.muted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s", animation:recording?"pulse 1s ease-in-out infinite":"none" }}
                  title={recording?"Stop Recording":"Voice to Note"}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>
                </button>
              )}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"3px" }}>
            {[{label:"New Note",type:"note"},{label:"New To-Do",type:"todo"},{label:"New Sticky",type:"sticky"}].map(item=>(
              <button key={item.type} onClick={()=>createNote(item.type)} className="nt-btn"
                style={{ width:"100%", padding:"6px 10px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.03)", color:C.muted, fontSize:"11px", fontWeight:"600", cursor:"pointer", fontFamily:FONT, textAlign:"left", transition:"all 0.15s", display:"flex", alignItems:"center", gap:"6px" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"8px 6px" }}>
          <p style={{ fontSize:"9px", fontWeight:"600", color:"rgba(255,255,255,0.2)", letterSpacing:"1.5px", textTransform:"uppercase", fontFamily:FONT, margin:"0 0 4px 6px" }}>Categories</p>
          {CATS.map(cat=>{
            const isActive = activeCat===cat.id;
            return (
              <button key={cat.id} className="nt-cat" onClick={()=>setActiveCat(cat.id)}
                style={{ width:"100%", display:"flex", alignItems:"center", gap:"8px", padding:"6px 8px", borderRadius:"8px", border:`1px solid ${isActive?"rgba(255,255,255,0.1)":"transparent"}`, background:isActive?"rgba(255,255,255,0.06)":"transparent", cursor:"pointer", transition:"all 0.15s", marginBottom:"1px" }}>
                <span style={{ color:isActive?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.3)" }}><CatIcon d={cat.icon} size={13}/></span>
                <span style={{ fontSize:"12px", fontWeight:isActive?"600":"400", color:isActive?"rgba(255,255,255,0.9)":C.muted, fontFamily:FONT, flex:1, textAlign:"left" }}>{cat.label}</span>
                {(cat.id==="all"?notes.length:catCounts[cat.id]||0) > 0 && <span style={{ fontSize:"9px", color:"rgba(255,255,255,0.2)", fontFamily:FONT }}>{cat.id==="all"?notes.length:catCounts[cat.id]}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes list */}
      <div style={{ width:"260px", flexShrink:0, borderRight:"1px solid rgba(255,255,255,0.06)", background:"rgba(255,255,255,0.01)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"10px 12px", borderBottom:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
          <div style={{ position:"relative" }}>
            <svg style={{ position:"absolute", left:"8px", top:"50%", transform:"translateY(-50%)", color:"rgba(255,255,255,0.2)" }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search notes..." style={{ width:"100%", padding:"7px 8px 7px 26px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.07)", background:"rgba(255,255,255,0.04)", color:C.white, fontSize:"11px", fontFamily:FONT, outline:"none", boxSizing:"border-box" }}/>
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"8px" }}>
          {filtered.length === 0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"200px", gap:"10px", opacity:0.4 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
              <p style={{ fontSize:"12px", color:C.muted, fontFamily:FONT, textAlign:"center", margin:0 }}>No notes yet.<br/>Create one.</p>
            </div>
          ) : filtered.map(note=>(
            <div key={note.id} className="nt-note" onClick={()=>setActiveNote(note.id)}
              style={{ padding:"10px 12px", borderRadius:"10px", border:`1px solid ${activeNote===note.id?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.06)"}`, background:activeNote===note.id?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.03)", cursor:"pointer", marginBottom:"4px", transition:"all 0.15s" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"4px" }}>
                {note.pinned && <svg width="9" height="9" viewBox="0 0 24 24" fill="rgba(255,255,255,0.5)" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>}
                <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:note.color==="whites"||note.color==="#fff"?"rgba(255,255,255,0.3)":note.color, flexShrink:0 }}/>
                <span style={{ fontSize:"12px", fontWeight:"600", color:C.white, fontFamily:FONT, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{note.title||"Untitled"}</span>
              </div>
              {note.content && <p style={{ fontSize:"10px", color:C.muted, fontFamily:FONT, margin:"0 0 4px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", lineHeight:1.5 }}>{note.content}</p>}
              {note.type==="todo" && note.todos?.length > 0 && <p style={{ fontSize:"10px", color:C.dim, fontFamily:FONT, margin:"0 0 4px" }}>{note.todos.filter(t=>t.done).length}/{note.todos.length} done</p>}
              <p style={{ fontSize:"9px", color:"rgba(255,255,255,0.2)", fontFamily:FONT, margin:0 }}>{timeAgo(note.updatedAt)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {!activeNoteObj ? (
          <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"14px", opacity:0.4 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
            <div style={{ textAlign:"center" }}>
              <p style={{ fontSize:"14px", fontWeight:"600", color:C.white, margin:"0 0 6px", fontFamily:FONT_HEAD }}>Select a note</p>
              <p style={{ fontSize:"12px", color:C.muted, margin:0, fontFamily:FONT }}>or create a new one from the sidebar</p>
            </div>
            <div style={{ display:"flex", gap:"8px" }}>
              {[{label:"New Note",type:"note"},{label:"To-Do",type:"todo"},{label:"Sticky",type:"sticky"}].map(item=>(
                <button key={item.type} onClick={()=>createNote(item.type)}
                  style={{ padding:"8px 16px", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.6)", fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:FONT }}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding:"10px 20px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", gap:"8px", flexShrink:0, background:"rgba(255,255,255,0.01)", backdropFilter:"blur(10px)" }}>
              <input value={activeNoteObj.title} onChange={e=>updateNote(activeNoteObj.id,{title:e.target.value})}
                placeholder="Title" style={{ flex:1, background:"transparent", border:"none", color:C.white, fontSize:"15px", fontWeight:"700", fontFamily:FONT_HEAD, outline:"none" }}/>
              <div style={{ display:"flex", gap:"4px", alignItems:"center" }}>
                {COLORS.map(col=>(
                  <button key={col} onClick={()=>updateNote(activeNoteObj.id,{color:col})}
                    style={{ width:"14px", height:"14px", borderRadius:"50%", background:col==="whites"||col==="#fff"?"rgba(255,255,255,0.3)":col, border:activeNoteObj.color===col?"2px solid rgba(255,255,255,0.8)":"2px solid transparent", cursor:"pointer", padding:0, flexShrink:0 }}/>
                ))}
                <div style={{ width:"1px", height:"16px", background:"rgba(255,255,255,0.08)", margin:"0 4px" }}/>
                <button onClick={()=>updateNote(activeNoteObj.id,{pinned:!activeNoteObj.pinned})} className="nt-btn"
                  style={{ width:"26px", height:"26px", borderRadius:"7px", border:"none", background:"transparent", color:activeNoteObj.pinned?"rgba(255,255,255,0.9)":C.muted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill={activeNoteObj.pinned?"currentColor":"none"} stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </button>
                <label className="nt-btn" style={{ width:"26px", height:"26px", borderRadius:"7px", border:"none", background:"transparent", color:C.muted, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  <input type="file" accept="image/*" style={{ display:"none" }} onChange={e=>handleImage(activeNoteObj.id,e.target.files[0])}/>
                </label>
                {onSendToGenerator && (
                  <button onClick={()=>onSendToGenerator(activeNoteObj.content)} className="nt-btn"
                    style={{ padding:"4px 10px", borderRadius:"7px", border:"1px solid rgba(255,255,255,0.1)", background:"rgba(255,255,255,0.05)", color:C.muted, fontSize:"10px", fontWeight:"600", cursor:"pointer", fontFamily:FONT, transition:"all 0.15s" }}>
                    ✦ Generate
                  </button>
                )}
                <button onClick={()=>deleteNote(activeNoteObj.id)} className="nt-btn"
                  style={{ width:"26px", height:"26px", borderRadius:"7px", border:"none", background:"transparent", color:"rgba(239,68,68,0.4)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                </button>
              </div>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"20px" }}>
              {activeNoteObj.image && (
                <div style={{ position:"relative", marginBottom:"16px", borderRadius:"12px", overflow:"hidden", maxHeight:"200px" }}>
                  <img src={activeNoteObj.image} alt="" style={{ width:"100%", objectFit:"cover", display:"block", maxHeight:"200px" }}/>
                  <button onClick={()=>updateNote(activeNoteObj.id,{image:null})}
                    style={{ position:"absolute", top:"8px", right:"8px", width:"24px", height:"24px", borderRadius:"6px", border:"none", background:"rgba(0,0,0,0.6)", color:"#fff", cursor:"pointer", fontSize:"12px", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                </div>
              )}

              {activeNoteObj.type==="todo" ? (
                <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                  {activeNoteObj.todos?.map(todo=>(
                    <div key={todo.id} className="nt-todo" style={{ display:"flex", alignItems:"center", gap:"10px", padding:"8px 10px", borderRadius:"9px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
                      <input type="checkbox" checked={todo.done} onChange={e=>updateTodo(activeNoteObj.id,todo.id,{done:e.target.checked})}
                        style={{ accentColor:"rgba(255,255,255,0.8)", cursor:"pointer", flexShrink:0 }}/>
                      <input value={todo.text} onChange={e=>updateTodo(activeNoteObj.id,todo.id,{text:e.target.value})}
                        placeholder="Task..." style={{ flex:1, background:"transparent", border:"none", color:todo.done?"rgba(255,255,255,0.3)":C.white, fontSize:"13px", fontFamily:FONT, outline:"none", textDecoration:todo.done?"line-through":"none" }}/>
                      <button className="nt-del" onClick={()=>deleteTodo(activeNoteObj.id,todo.id)}
                        style={{ opacity:0, border:"none", background:"transparent", color:"rgba(239,68,68,0.5)", cursor:"pointer", fontSize:"12px", transition:"opacity 0.15s", padding:0 }}>✕</button>
                    </div>
                  ))}
                  <button onClick={()=>addTodo(activeNoteObj.id)}
                    style={{ padding:"7px 12px", borderRadius:"9px", border:"1px dashed rgba(255,255,255,0.12)", background:"transparent", color:C.muted, fontSize:"12px", fontFamily:FONT, cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:"6px" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add task
                  </button>
                  <textarea value={activeNoteObj.content} onChange={e=>updateNote(activeNoteObj.id,{content:e.target.value})}
                    placeholder="Add notes..." rows={4}
                    style={{ width:"100%", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:"10px", padding:"12px", color:"rgba(255,255,255,0.6)", fontSize:"13px", fontFamily:FONT, resize:"none", outline:"none", boxSizing:"border-box", marginTop:"8px" }}/>
                </div>
              ) : (
                <textarea value={activeNoteObj.content} onChange={e=>updateNote(activeNoteObj.id,{content:e.target.value})}
                  placeholder="Start writing..." style={{ width:"100%", height:"100%", minHeight:"60vh", background:"transparent", border:"none", color:C.white, fontSize:"14px", fontFamily:FONT, lineHeight:"1.8", resize:"none", outline:"none", boxSizing:"border-box" }}/>
              )}
            </div>

            <div style={{ padding:"8px 20px", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
              <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.2)", fontFamily:FONT }}>
                {activeNoteObj.type==="todo" ? `${activeNoteObj.todos?.filter(t=>t.done).length||0}/${activeNoteObj.todos?.length||0} tasks` : `${activeNoteObj.content?.length||0} chars`}
              </span>
              <span style={{ fontSize:"10px", color:"rgba(255,255,255,0.2)", fontFamily:FONT }}>Saved {timeAgo(activeNoteObj.updatedAt)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
