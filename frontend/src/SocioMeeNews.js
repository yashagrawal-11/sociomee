import React, { useState, useEffect, useCallback, useRef } from 'react'

const API = 'https://sociomee.in/api/news'

const CATS = [
  {id:'all',label:'All'},
  {id:'milestone',label:'Milestone'},
  {id:'drama',label:'Drama'},
  {id:'trend',label:'Trend'},
  {id:'platform',label:'Platform'},
  {id:'india',label:'India'},
  {id:'global',label:'Global'},
]

// Proxy image through allorigins to bypass CORS
const CAT_COLORS = {
  milestone:'#f59e0b', drama:'#ef4444', trend:'#8b5cf6',
  platform:'#3b82f6', india:'#10b981', global:'#6366f1', all:'#7c3aed'
}

function Skeleton() {
  return (
    <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'16px',overflow:'hidden',marginBottom:'14px'}}>
      <div style={{height:'180px',background:'linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.08) 40%,rgba(255,255,255,0.04) 80%)',backgroundSize:'400px 100%',animation:'shimmer 1.4s linear infinite'}}/>
      <div style={{padding:'14px'}}>
        {[90,70,50].map((w,i)=><div key={i} style={{height:'11px',borderRadius:'6px',marginBottom:'8px',width:`${w}%`,background:'rgba(255,255,255,0.06)'}}/>)}
      </div>
    </div>
  )
}

function LiveCounter({lastUpdated}) {
  const [mins, setMins] = useState(0)
  useEffect(()=>{
    if(!lastUpdated) return
    const update = ()=>setMins(Math.floor((Date.now()-new Date(lastUpdated).getTime())/60000))
    update()
    const t = setInterval(update, 60000)
    return ()=>clearInterval(t)
  },[lastUpdated])
  return (
    <div style={{display:'flex',alignItems:'center',gap:'5px'}}>
      <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#10b981',animation:'pulse 2s infinite',display:'inline-block'}}/>
      <span style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',fontFamily:'Poppins,sans-serif'}}>{mins===0?'just now':`${mins}m ago`}</span>
    </div>
  )
}

function GenerateModal({news, ideas, loading, onClose, onPublish}) {
  const [platform, setPlatform] = useState('instagram')
  const [copied, setCopied] = useState(false)
  const idea = ideas?.[platform]

  const copy = async()=>{
    if(!idea) return
    await navigator.clipboard.writeText(`${idea.hook}\n\n${idea.content}\n\n${(idea.hashtags||[]).join(' ')}`)
    setCopied(true); setTimeout(()=>setCopied(false),2000)
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}} onClick={onClose}>
      <div style={{background:'#111',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'20px',padding:'22px',maxWidth:'520px',width:'100%',maxHeight:'88vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'14px'}}>
          <h3 style={{fontSize:'14px',fontWeight:600,color:'#fff',margin:0,lineHeight:1.4,flex:1,fontFamily:'Poppins,sans-serif'}}>{news.title}</h3>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.08)',border:'none',color:'rgba(255,255,255,0.6)',width:'28px',height:'28px',borderRadius:'50%',cursor:'pointer',fontSize:'14px',marginLeft:'10px',flexShrink:0}}>✕</button>
        </div>
        <div style={{display:'flex',gap:'6px',marginBottom:'14px'}}>
          {[['instagram','Instagram'],['twitter','Twitter'],['youtube_shorts','YT Shorts']].map(([p,l])=>(
            <button key={p} onClick={()=>setPlatform(p)} style={{flex:1,padding:'7px 4px',borderRadius:'8px',border:platform===p?'1px solid rgba(124,58,237,0.5)':'1px solid transparent',background:platform===p?'rgba(124,58,237,0.25)':'rgba(255,255,255,0.06)',color:platform===p?'#a78bfa':'rgba(255,255,255,0.5)',fontSize:'11px',fontWeight:platform===p?600:400,cursor:'pointer',fontFamily:'Poppins,sans-serif'}}>
              {l}
            </button>
          ))}
        </div>
        {loading ? (
          <div style={{textAlign:'center',padding:'30px 0',color:'rgba(255,255,255,0.4)'}}>
            <p style={{margin:0,fontSize:'13px',fontFamily:'Poppins,sans-serif'}}>Generating with Gemini...</p>
          </div>
        ) : idea ? (
          <>
            <div style={{background:'rgba(124,58,237,0.08)',border:'1px solid rgba(124,58,237,0.2)',borderRadius:'10px',padding:'10px',marginBottom:'10px'}}>
              <p style={{fontSize:'10px',color:'#a78bfa',fontWeight:700,margin:'0 0 4px',textTransform:'uppercase',letterSpacing:'1px',fontFamily:'Poppins,sans-serif'}}>Hook</p>
              <p style={{fontSize:'13px',color:'#fff',margin:0,lineHeight:1.5,fontFamily:'Poppins,sans-serif'}}>{idea.hook}</p>
            </div>
            <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',padding:'10px',marginBottom:'10px'}}>
              <p style={{fontSize:'10px',color:'rgba(255,255,255,0.4)',fontWeight:700,margin:'0 0 4px',textTransform:'uppercase',letterSpacing:'1px',fontFamily:'Poppins,sans-serif'}}>Content</p>
              <p style={{fontSize:'12px',color:'rgba(255,255,255,0.8)',margin:0,lineHeight:1.7,whiteSpace:'pre-wrap',fontFamily:'Poppins,sans-serif'}}>{idea.content}</p>
            </div>
            {idea.hashtags?.length>0&&(
              <div style={{marginBottom:'12px'}}>
                <p style={{fontSize:'10px',color:'rgba(255,255,255,0.4)',fontWeight:700,margin:'0 0 6px',textTransform:'uppercase',letterSpacing:'1px',fontFamily:'Poppins,sans-serif'}}>Hashtags</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
                  {idea.hashtags.map((h,i)=><span key={i} style={{fontSize:'11px',color:'#a78bfa',background:'rgba(124,58,237,0.12)',padding:'2px 8px',borderRadius:'99px',fontFamily:'Poppins,sans-serif'}}>{h}</span>)}
                </div>
              </div>
            )}
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={copy} style={{flex:1,padding:'9px',borderRadius:'99px',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.7)',fontSize:'12px',cursor:'pointer',fontFamily:'Poppins,sans-serif',fontWeight:600}}>{copied?'Copied!':'Copy'}</button>
              <button onClick={()=>onPublish(idea,platform)} style={{flex:1,padding:'9px',borderRadius:'99px',background:'linear-gradient(135deg,#7c3aed,#9b5cf6)',border:'none',color:'#fff',fontSize:'12px',cursor:'pointer',fontFamily:'Poppins,sans-serif',fontWeight:700}}>✦ Publish</button>
            </div>
          </>
        ) : <p style={{color:'rgba(255,255,255,0.3)',textAlign:'center',fontFamily:'Poppins,sans-serif'}}>No ideas generated yet.</p>}
      </div>
    </div>
  )
}

// Featured card — large image top, text below (like Windows news)
function NewsCardFeatured({item, userId, onGenerate}) {
  const [saved, setSaved] = useState(false)
  const [imgErr, setImgErr] = useState(false)
  const col = CAT_COLORS[(item.category || "global")]||'#7c3aed'
  const timeAgo = d=>{
    if(!d) return ''
    const m = Math.floor((Date.now()-new Date(d).getTime())/60000)
    if(m<60) return `${m}m ago`
    if(m<1440) return `${Math.floor(m/60)}h ago`
    return `${Math.floor(m/1440)}d ago`
  }

  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      style={{display:'block',textDecoration:'none',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'18px',overflow:'hidden',marginBottom:'14px',transition:'all 0.2s',cursor:'pointer'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(124,58,237,0.3)';e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 12px 40px rgba(0,0,0,0.4)'}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
      {/* Image */}
      {item.image && !imgErr ? (
        <div style={{position:'relative',height:'200px',overflow:'hidden',background:'rgba(255,255,255,0.03)'}}>
          <img src={item.image} alt={item.title} onError={()=>setImgErr(true)}
            style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform 0.3s ease'}}
            onMouseEnter={e=>e.target.style.transform='scale(1.03)'}
            onMouseLeave={e=>e.target.style.transform='scale(1)'}/>
          {/* Category badge over image */}
          <div style={{position:'absolute',top:'10px',left:'10px',padding:'3px 10px',borderRadius:'99px',background:`${col}dd`,color:'#fff',fontSize:'10px',fontWeight:'800',fontFamily:'Poppins,sans-serif',letterSpacing:'0.5px',textTransform:'uppercase',backdropFilter:'blur(4px)'}}>
            {(item.category || "global")}
          </div>
          {/* Source badge */}
          <div style={{position:'absolute',bottom:'10px',right:'10px',padding:'3px 10px',borderRadius:'99px',background:'rgba(0,0,0,0.7)',color:'rgba(255,255,255,0.8)',fontSize:'10px',fontFamily:'Poppins,sans-serif',backdropFilter:'blur(4px)'}}>
            {(item.source?.name || item.source || "")} ↗
          </div>
        </div>
      ) : (
        <div style={{height:'120px',background:`linear-gradient(135deg,${col}22,rgba(0,0,0,0.3))`,display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
          <span style={{fontSize:'40px',opacity:0.3}}>📰</span>
          <div style={{position:'absolute',top:'10px',left:'10px',padding:'3px 10px',borderRadius:'99px',background:`${col}dd`,color:'#fff',fontSize:'10px',fontWeight:'800',fontFamily:'Poppins,sans-serif',textTransform:'uppercase'}}>
            {(item.category || "global")}
          </div>
        </div>
      )}
      {/* Content */}
      <div style={{padding:'14px 16px'}}>
        <p style={{fontSize:'14px',fontWeight:'700',color:'#fff',margin:'0 0 6px',lineHeight:1.45,fontFamily:'Poppins,sans-serif',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
          {item.title}
        </p>
        {(item.description || "") && (
          <p style={{fontSize:'12px',color:'rgba(255,255,255,0.5)',margin:'0 0 12px',lineHeight:1.6,fontFamily:'Poppins,sans-serif',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
            {(item.description || "")}
          </p>
        )}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <span style={{fontSize:'10px',color:'rgba(255,255,255,0.25)',fontFamily:'Poppins,sans-serif'}}>{(item.region || "global")==='india'?'🇮🇳 India':'🌍 Global'}</span>
            <span style={{fontSize:'10px',color:'rgba(255,255,255,0.25)',fontFamily:'Poppins,sans-serif'}}>{timeAgo(item.publishedAt)}</span>
          </div>
          <div style={{display:'flex',gap:'6px'}}>
            <button onClick={e=>{e.preventDefault();e.stopPropagation();setSaved(!saved);fetch(`${API}/interaction?news_id=${item.id}&user_id=${userId}&action=saved`,{method:'POST'}).catch(()=>{})}}
              style={{background:saved?'rgba(124,58,237,0.2)':'rgba(255,255,255,0.06)',border:saved?'1px solid rgba(124,58,237,0.4)':'1px solid rgba(255,255,255,0.08)',color:saved?'#a78bfa':'rgba(255,255,255,0.4)',borderRadius:'8px',padding:'5px 10px',cursor:'pointer',fontSize:'11px',fontFamily:'Poppins,sans-serif',fontWeight:'600'}}>
              {saved?'Saved':'Save'}
            </button>
            <button onClick={e=>{e.preventDefault();e.stopPropagation();onGenerate(item)}}
              style={{background:'rgba(124,58,237,0.2)',border:'1px solid rgba(124,58,237,0.4)',color:'#a78bfa',borderRadius:'8px',padding:'5px 12px',cursor:'pointer',fontSize:'11px',fontWeight:'700',fontFamily:'Poppins,sans-serif'}}>
              ✦ Generate
            </button>
          </div>
        </div>
      </div>
    </a>
  )
}

// Compact card — horizontal, small image right
function NewsCardCompact({item, userId, onGenerate}) {
  const [saved, setSaved] = useState(false)
  const [imgErr, setImgErr] = useState(false)
  const col = CAT_COLORS[(item.category || "global")]||'#7c3aed'
  const timeAgo = d=>{
    if(!d) return ''
    const m = Math.floor((Date.now()-new Date(d).getTime())/60000)
    if(m<60) return `${m}m ago`
    if(m<1440) return `${Math.floor(m/60)}h ago`
    return `${Math.floor(m/1440)}d ago`
  }

  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      style={{display:'flex',gap:'12px',textDecoration:'none',background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'14px',padding:'12px',marginBottom:'10px',transition:'all 0.2s',cursor:'pointer'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(124,58,237,0.25)';e.currentTarget.style.background='rgba(124,58,237,0.04)'}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.06)';e.currentTarget.style.background='rgba(255,255,255,0.02)'}}>
      {/* Text */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'5px'}}>
          <span style={{fontSize:'9px',fontWeight:'800',padding:'2px 7px',borderRadius:'99px',background:`${col}20`,color:col,textTransform:'uppercase',fontFamily:'Poppins,sans-serif',letterSpacing:'0.5px'}}>{(item.category || "global")}</span>
          <span style={{fontSize:'10px',color:'rgba(255,255,255,0.2)',fontFamily:'Poppins,sans-serif',marginLeft:'auto'}}>{timeAgo(item.publishedAt)}</span>
        </div>
        <p style={{fontSize:'12.5px',fontWeight:'600',color:'rgba(255,255,255,0.9)',margin:'0 0 4px',lineHeight:1.4,fontFamily:'Poppins,sans-serif',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
          {item.title}
        </p>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'8px'}}>
          <span style={{fontSize:'10px',color:'rgba(255,255,255,0.2)',fontFamily:'Poppins,sans-serif'}}>{(item.source?.name || item.source || "")} ↗</span>
          <div style={{display:'flex',gap:'5px'}}>
            <button onClick={e=>{e.preventDefault();e.stopPropagation();setSaved(!saved)}}
              style={{background:'transparent',border:'none',color:saved?'#a78bfa':'rgba(255,255,255,0.3)',cursor:'pointer',fontSize:'13px',padding:'2px 4px'}}>
              {saved?'🔖':'🔖'}
            </button>
            <button onClick={e=>{e.preventDefault();e.stopPropagation();onGenerate(item)}}
              style={{background:'rgba(124,58,237,0.15)',border:'1px solid rgba(124,58,237,0.3)',color:'#a78bfa',borderRadius:'6px',padding:'3px 8px',cursor:'pointer',fontSize:'10px',fontWeight:'700',fontFamily:'Poppins,sans-serif'}}>
              ✦
            </button>
          </div>
        </div>
      </div>
      {/* Thumbnail */}
      {item.image && !imgErr && (
        <div style={{width:'80px',height:'80px',flexShrink:0,borderRadius:'10px',overflow:'hidden',background:'rgba(255,255,255,0.04)'}}>
          <img src={item.image} alt="" onError={()=>setImgErr(true)}
            style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        </div>
      )}
    </a>
  )
}

export default function SocioMeeNews({userId='anonymous'}) {
  const [cat, setCat] = useState('all')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [modal, setModal] = useState(null)
  const [ideas, setIdeas] = useState(null)
  const [ideasLoading, setIdeasLoading] = useState(false)
  const touchX = useRef(0)

  const fetchNews = useCallback(async(category)=>{
    setLoading(true)
    try {
      const r = await fetch(`${API}/feed?category=${category}&limit=20`)
      if(r.ok){const d=await r.json();setItems(d.items||[]);if(d.last_updated)setLastUpdated(d.last_updated)}
    } catch(e){console.error(e)}
    finally{setLoading(false)}
  },[])

  useEffect(()=>{
    fetch(`${API}/status`).then(r=>r.json()).then(d=>setLastUpdated(d.last_updated)).catch(()=>{})
    const t = setInterval(()=>fetch(`${API}/status`).then(r=>r.json()).then(d=>setLastUpdated(d.last_updated)).catch(()=>{}),60000)
    return ()=>clearInterval(t)
  },[])

  useEffect(()=>{fetchNews(cat)},[cat,fetchNews])

  const handleGenerate = async(item)=>{
    setModal(item); setIdeas(null); setIdeasLoading(true)
    try{const r=await fetch(`${API}/${item.id}/ideas`);if(r.ok){const d=await r.json();setIdeas(d.ideas)}}
    catch(e){}finally{setIdeasLoading(false)}
  }

  const handlePublish = (idea, platform)=>{
    window.dispatchEvent(new CustomEvent('sociomee:publish',{detail:{content:idea.content,platform,hashtags:idea.hashtags,hook:idea.hook}}))
    setModal(null)
  }

  // First 2 items as featured, rest as compact
  const featured = items.slice(0, 2)
  const compact = items.slice(2)

  return (
    <>
      <style>{`
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>
      <div style={{fontFamily:'Poppins,sans-serif',color:'rgba(255,255,255,0.85)',maxWidth:'100%'}}
        onTouchStart={e=>{touchX.current=e.touches[0].clientX}}
        onTouchEnd={e=>{const d=e.changedTouches[0].clientX-touchX.current;if(Math.abs(d)>50){const idx=CATS.findIndex(c=>c.id===cat);if(d<0&&idx<CATS.length-1)setCat(CATS[idx+1].id);else if(d>0&&idx>0)setCat(CATS[idx-1].id)}}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
          <div>
            <h2 style={{fontSize:'16px',fontWeight:800,color:'#fff',margin:'0 0 2px',fontFamily:'Poppins,sans-serif'}}>⚡ SocioMee News</h2>
            <p style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',margin:0,fontFamily:'Poppins,sans-serif'}}>Creator world, live</p>
          </div>
          <LiveCounter lastUpdated={lastUpdated}/>
        </div>

        {/* Category pills */}
        <div style={{display:'flex',gap:'5px',marginBottom:'16px',overflowX:'auto',paddingBottom:'4px',scrollbarWidth:'none'}}>
          {CATS.map(c=>(
            <button key={c.id} onClick={()=>setCat(c.id)}
              style={{padding:'5px 14px',borderRadius:'99px',border:cat===c.id?`1px solid ${CAT_COLORS[c.id]||'rgba(124,58,237,0.4)'}40`:'1px solid transparent',background:cat===c.id?`${CAT_COLORS[c.id]||'rgba(124,58,237,0.25)'}22`:'rgba(255,255,255,0.05)',color:cat===c.id?(CAT_COLORS[c.id]||'#a78bfa'):'rgba(255,255,255,0.45)',fontSize:'11px',fontWeight:cat===c.id?700:400,cursor:'pointer',whiteSpace:'nowrap',fontFamily:'Poppins,sans-serif',transition:'all 0.2s'}}>
              {c.label}
            </button>
          ))}
        </div>

        {/* News content */}
        {loading ? (
          [...Array(3)].map((_,i)=><Skeleton key={i}/>)
        ) : items.length===0 ? (
          <div style={{textAlign:'center',padding:'40px 0',color:'rgba(255,255,255,0.3)'}}>
            <p style={{fontSize:'32px',margin:'0 0 8px'}}>📭</p>
            <p style={{fontSize:'13px',margin:'0 0 12px',fontFamily:'Poppins,sans-serif'}}>No news yet. Updates every 2 hours.</p>
            <button onClick={()=>fetch(`${API}/trigger`,{method:'POST'}).then(()=>setTimeout(()=>fetchNews(cat),3000))}
              style={{padding:'7px 18px',borderRadius:'99px',background:'rgba(124,58,237,0.2)',border:'1px solid rgba(124,58,237,0.4)',color:'#a78bfa',fontSize:'12px',cursor:'pointer',fontFamily:'Poppins,sans-serif',fontWeight:600}}>
              ↻ Fetch Now
            </button>
          </div>
        ) : (
          <>
            {/* Featured — large cards with image on top */}
            {featured.map(item=><NewsCardFeatured key={item.id} item={item} userId={userId} onGenerate={handleGenerate}/>)}
            {/* Divider */}
            {compact.length>0&&<div style={{height:'1px',background:'rgba(255,255,255,0.06)',margin:'6px 0 14px'}}/>}
            {/* Compact list */}
            {compact.map(item=><NewsCardCompact key={item.id} item={item} userId={userId} onGenerate={handleGenerate}/>)}
          </>
        )}

        {!loading&&items.length>0&&(
          <div style={{textAlign:'center',marginTop:'14px'}}>
            <button onClick={()=>fetchNews(cat)}
              style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.4)',padding:'7px 22px',borderRadius:'99px',cursor:'pointer',fontSize:'11px',fontFamily:'Poppins,sans-serif',fontWeight:600}}>
              ↻ Refresh
            </button>
          </div>
        )}
      </div>
      {modal&&<GenerateModal news={modal} ideas={ideas} loading={ideasLoading} onClose={()=>{setModal(null);setIdeas(null)}} onPublish={handlePublish}/>}
    </>
  )
}
