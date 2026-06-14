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

const CAT_COLORS = {milestone:'#f59e0b',drama:'#ef4444',trend:'#8b5cf6',platform:'#3b82f6',india:'#10b981',global:'#6366f1'}

function Skeleton() {
  return (
    <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'14px',padding:'14px',marginBottom:'10px'}}>
      {[80,100,60].map((w,i)=>(
        <div key={i} style={{height:'12px',borderRadius:'6px',marginBottom:'8px',width:`${w}%`,background:'linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.1) 40%,rgba(255,255,255,0.04) 80%)',backgroundSize:'400px 100%',animation:'shimmer 1.4s linear infinite'}}/>
      ))}
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
      <span style={{fontSize:'11px',color:'rgba(255,255,255,0.4)'}}>{mins===0?'just now':`${mins}m ago`}</span>
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
          <h3 style={{fontSize:'14px',fontWeight:600,color:'#fff',margin:0,lineHeight:1.4,flex:1}}>{news.title}</h3>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.08)',border:'none',color:'rgba(255,255,255,0.6)',width:'28px',height:'28px',borderRadius:'50%',cursor:'pointer',fontSize:'14px',marginLeft:'10px',flexShrink:0}}>✕</button>
        </div>
        <div style={{display:'flex',gap:'6px',marginBottom:'14px'}}>
          {[['instagram','📸 Instagram'],['twitter','🐦 Twitter'],['youtube_shorts','▶️ YT Shorts']].map(([p,l])=>(
            <button key={p} onClick={()=>setPlatform(p)} style={{flex:1,padding:'7px 4px',borderRadius:'8px',border:platform===p?'1px solid rgba(124,58,237,0.5)':'1px solid transparent',background:platform===p?'rgba(124,58,237,0.25)':'rgba(255,255,255,0.06)',color:platform===p?'#a78bfa':'rgba(255,255,255,0.5)',fontSize:'11px',fontWeight:platform===p?600:400,cursor:'pointer',fontFamily:'inherit'}}>
              {l}
            </button>
          ))}
        </div>
        {loading ? (
          <div style={{textAlign:'center',padding:'30px 0',color:'rgba(255,255,255,0.4)'}}>
            <div style={{fontSize:'22px',marginBottom:'8px'}}>⏳</div>
            <p style={{margin:0,fontSize:'13px'}}>Generating with Gemini...</p>
          </div>
        ) : idea ? (
          <>
            <div style={{background:'rgba(124,58,237,0.08)',border:'1px solid rgba(124,58,237,0.2)',borderRadius:'10px',padding:'10px',marginBottom:'10px'}}>
              <p style={{fontSize:'10px',color:'#a78bfa',fontWeight:700,margin:'0 0 4px',textTransform:'uppercase',letterSpacing:'1px'}}>Hook</p>
              <p style={{fontSize:'13px',color:'#fff',margin:0,lineHeight:1.5}}>{idea.hook}</p>
            </div>
            <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'10px',padding:'10px',marginBottom:'10px'}}>
              <p style={{fontSize:'10px',color:'rgba(255,255,255,0.4)',fontWeight:700,margin:'0 0 4px',textTransform:'uppercase',letterSpacing:'1px'}}>Content</p>
              <p style={{fontSize:'12px',color:'rgba(255,255,255,0.8)',margin:0,lineHeight:1.7,whiteSpace:'pre-wrap'}}>{idea.content}</p>
            </div>
            {idea.hashtags?.length>0 && (
              <div style={{display:'flex',flexWrap:'wrap',gap:'5px',marginBottom:'14px'}}>
                {idea.hashtags.map((t,i)=><span key={i} style={{fontSize:'11px',color:'#7c3aed',background:'rgba(124,58,237,0.1)',padding:'2px 7px',borderRadius:'99px'}}>{t}</span>)}
              </div>
            )}
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={copy} style={{flex:1,padding:'9px',borderRadius:'10px',cursor:'pointer',background:copied?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.08)',border:copied?'1px solid rgba(16,185,129,0.4)':'1px solid rgba(255,255,255,0.12)',color:copied?'#10b981':'rgba(255,255,255,0.7)',fontSize:'12px',fontFamily:'inherit'}}>
                {copied?'✓ Copied!':'📋 Copy'}
              </button>
              <button onClick={()=>onPublish(idea,platform)} style={{flex:2,padding:'9px',borderRadius:'10px',cursor:'pointer',background:'linear-gradient(135deg,#7c3aed,#a78bfa)',border:'none',color:'#fff',fontSize:'12px',fontWeight:600,fontFamily:'inherit'}}>
                ✦ Send to Publish
              </button>
            </div>
          </>
        ) : <p style={{color:'rgba(255,255,255,0.4)',textAlign:'center',padding:'20px 0'}}>No ideas available.</p>}
      </div>
    </div>
  )
}

function NewsCard({item, userId, onGenerate}) {
  const [saved, setSaved] = useState(false)
  const timeAgo = d=>{
    if(!d) return ''
    const m = Math.floor((Date.now()-new Date(d).getTime())/60000)
    if(m<60) return `${m}m ago`
    if(m<1440) return `${Math.floor(m/60)}h ago`
    return `${Math.floor(m/1440)}d ago`
  }
  const col = CAT_COLORS[item.category]||'#7c3aed'

  return (
    <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'14px',padding:'14px',marginBottom:'10px',transition:'border-color 0.2s'}}
      onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.14)'}
      onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'}
    >
      <div style={{display:'flex',gap:'10px'}}>
        {item.image_url&&<img src={item.image_url} alt="" style={{width:'72px',height:'72px',borderRadius:'8px',objectFit:'cover',flexShrink:0}} onError={e=>e.target.style.display='none'}/>}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:'5px',marginBottom:'5px',flexWrap:'wrap'}}>
            <span style={{fontSize:'10px',fontWeight:700,padding:'1px 7px',borderRadius:'99px',background:`${col}22`,color:col,textTransform:'uppercase'}}>{item.category}</span>
            <span style={{fontSize:'10px',color:'rgba(255,255,255,0.3)'}}>{item.region==='india'?'🇮🇳':'🌍'}</span>
            <span style={{fontSize:'10px',color:'rgba(255,255,255,0.3)',marginLeft:'auto'}}>{timeAgo(item.published_at)}</span>
          </div>
          <p style={{fontSize:'12px',fontWeight:600,color:'#fff',margin:'0 0 5px',lineHeight:1.4,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{item.title}</p>
          <p style={{fontSize:'11px',color:'rgba(255,255,255,0.5)',margin:'0 0 8px',lineHeight:1.5,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{item.ai_summary}</p>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <a href={item.url} target="_blank" rel="noopener noreferrer" style={{fontSize:'10px',color:'rgba(255,255,255,0.3)',textDecoration:'none'}}>{item.source_name} ↗</a>
            <div style={{display:'flex',gap:'5px'}}>
              <button onClick={()=>{setSaved(!saved);fetch(`${API}/interaction?news_id=${item.id}&user_id=${userId}&action=saved`,{method:'POST'}).catch(()=>{})}} style={{background:saved?'rgba(124,58,237,0.2)':'rgba(255,255,255,0.06)',border:saved?'1px solid rgba(124,58,237,0.4)':'1px solid transparent',color:saved?'#a78bfa':'rgba(255,255,255,0.4)',borderRadius:'7px',padding:'4px 7px',cursor:'pointer',fontSize:'11px'}}>🔖</button>
              <button onClick={()=>onGenerate(item)} style={{background:'rgba(124,58,237,0.2)',border:'1px solid rgba(124,58,237,0.4)',color:'#a78bfa',borderRadius:'7px',padding:'4px 10px',cursor:'pointer',fontSize:'11px',fontWeight:600,fontFamily:'inherit'}}>✦ Generate</button>
            </div>
          </div>
        </div>
      </div>
    </div>
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
    alert(`Sent to ${platform} publish pipeline! ✦`)
  }

  return (
    <>
      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <div style={{fontFamily:'Poppins,sans-serif',color:'rgba(255,255,255,0.85)',maxWidth:'100%',padding:'4px 0'}}
        onTouchStart={e=>{touchX.current=e.touches[0].clientX}}
        onTouchEnd={e=>{const d=e.changedTouches[0].clientX-touchX.current;if(Math.abs(d)>50){const idx=CATS.findIndex(c=>c.id===cat);if(d<0&&idx<CATS.length-1)setCat(CATS[idx+1].id);else if(d>0&&idx>0)setCat(CATS[idx-1].id)}}}
      >
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'14px'}}>
          <div>
            <h2 style={{fontSize:'16px',fontWeight:700,color:'#fff',margin:'0 0 2px'}}>⚡ SocioMee News</h2>
            <p style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',margin:0}}>Creator world, live</p>
          </div>
          <LiveCounter lastUpdated={lastUpdated}/>
        </div>
        <div style={{display:'flex',gap:'5px',marginBottom:'14px',overflowX:'auto',paddingBottom:'4px'}}>
          {CATS.map(c=>(
            <button key={c.id} onClick={()=>setCat(c.id)} style={{padding:'5px 12px',borderRadius:'99px',border:cat===c.id?'1px solid rgba(124,58,237,0.4)':'1px solid transparent',background:cat===c.id?'rgba(124,58,237,0.25)':'rgba(255,255,255,0.05)',color:cat===c.id?'#a78bfa':'rgba(255,255,255,0.5)',fontSize:'11px',fontWeight:cat===c.id?600:400,cursor:'pointer',whiteSpace:'nowrap',fontFamily:'inherit',transition:'all 0.2s'}}>
              {c.label}
            </button>
          ))}
        </div>
        {loading ? [...Array(4)].map((_,i)=><Skeleton key={i}/>) :
         items.length===0 ? (
          <div style={{textAlign:'center',padding:'40px 0',color:'rgba(255,255,255,0.3)'}}>
            <p style={{fontSize:'28px',margin:'0 0 8px'}}>📭</p>
            <p style={{fontSize:'13px',margin:0}}>No news yet. Updates every 15 min.</p>
            <button onClick={()=>fetch(`${API}/trigger`,{method:'POST'})} style={{marginTop:'12px',padding:'7px 16px',borderRadius:'99px',background:'rgba(124,58,237,0.2)',border:'1px solid rgba(124,58,237,0.4)',color:'#a78bfa',fontSize:'12px',cursor:'pointer',fontFamily:'inherit'}}>Fetch Now</button>
          </div>
         ) : items.map(item=><NewsCard key={item.id} item={item} userId={userId} onGenerate={handleGenerate}/>)
        }
        {!loading&&items.length>0&&(
          <div style={{textAlign:'center',marginTop:'12px'}}>
            <button onClick={()=>fetchNews(cat)} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.5)',padding:'7px 20px',borderRadius:'99px',cursor:'pointer',fontSize:'11px',fontFamily:'inherit'}}>↻ Refresh</button>
          </div>
        )}
      </div>
      {modal&&<GenerateModal news={modal} ideas={ideas} loading={ideasLoading} onClose={()=>{setModal(null);setIdeas(null)}} onPublish={handlePublish}/>}
    </>
  )
}
