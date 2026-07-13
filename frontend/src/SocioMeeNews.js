import React, { useState, useEffect, useCallback, useRef } from 'react'

const API = 'https://sociomeeai.com/api/news'

const CATS = [
  {id:'all',    label:'All'},
  {id:'cricket',  label:'Cricket'},
  {id:'bollywood',label:'Bollywood'},
  {id:'sports',   label:'Sports'},
  {id:'tech',     label:'Tech'},
  {id:'stocks',   label:'Markets'},
  {id:'gaming',   label:'Gaming'},
  {id:'creator',  label:'Creators'},
  {id:'milestone',label:'Milestones'},
  {id:'drama',    label:'Drama'},
  {id:'business', label:'Business'},
  {id:'india',    label:'India'},
  {id:'global',   label:'World'},
  {id:'kpop',     label:'K-pop'},
]

const CAT_COLORS = {
  all:'#a78bfa', cricket:'#22c55e', bollywood:'#f472b6',
  sports:'#fb923c', tech:'#22d3ee', stocks:'#34d399',
  gaming:'#a78bfa', creator:'#fbbf24', milestone:'#facc15',
  drama:'#f87171', business:'#94a3b8', india:'#f97316', global:'#818cf8', kpop:'#f472b6'
}

function timeAgo(d) {
  if (!d) return ''
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  return `${Math.floor(m / 1440)}d ago`
}

function Skeleton() {
  return (
    <div style={{borderRadius:'12px',overflow:'hidden',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)'}}>
      <div style={{height:'180px',background:'linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.08) 40%,rgba(255,255,255,0.04) 80%)',backgroundSize:'400px',animation:'shimmer 1.4s linear infinite'}}/>
      <div style={{padding:'14px'}}>
        {[85,65,45].map((w,i)=><div key={i} style={{height:'10px',borderRadius:'6px',marginBottom:'8px',width:`${w}%`,background:'rgba(255,255,255,0.05)'}}/>)}
      </div>
    </div>
  )
}

function LiveDot({lastUpdated}) {
  const [mins, setMins] = useState(0)
  useEffect(()=>{
    if (!lastUpdated) return
    const upd = ()=>setMins(Math.floor((Date.now()-new Date(lastUpdated).getTime())/60000))
    upd(); const t=setInterval(upd,60000); return ()=>clearInterval(t)
  },[lastUpdated])
  return (
    <span style={{display:'flex',alignItems:'center',gap:'5px'}}>
      <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#22c55e',animation:'pulse 2s infinite',display:'inline-block'}}/>
      <span style={{fontSize:'11px',color:'rgba(255,255,255,0.35)',fontFamily:'Poppins,sans-serif'}}>{mins===0?'Live':`${mins}m ago`}</span>
    </span>
  )
}

// Featured card — large, full width, image top
function CardFeatured({item, onGenerate}) {
  const [imgErr, setImgErr] = useState(false)
  const img = item.image_url || item.image
  const col = CAT_COLORS[item.category] || '#a78bfa'
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      style={{display:'block',textDecoration:'none',borderRadius:'14px',overflow:'hidden',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',transition:'border-color 0.2s,transform 0.2s'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(167,139,250,0.3)';e.currentTarget.style.transform='translateY(-2px)'}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.07)';e.currentTarget.style.transform='translateY(0)'}}>
      {/* Image */}
      <div style={{position:'relative',height:'220px',background:'rgba(255,255,255,0.04)',overflow:'hidden'}}>
        {img && !imgErr
          ? <img src={img} alt={item.title} onError={()=>setImgErr(true)} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          : <div style={{width:'100%',height:'100%',background:`linear-gradient(135deg,${col}18,rgba(0,0,0,0.5))`,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{fontSize:'36px',opacity:0.2}}>📰</span>
            </div>
        }
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 50%)'}}/>
        <span style={{position:'absolute',top:'12px',left:'12px',fontSize:'10px',fontWeight:700,fontFamily:'Poppins,sans-serif',letterSpacing:'1px',textTransform:'uppercase',color:'#fff',background:col,padding:'3px 10px',borderRadius:'99px'}}>
          {item.category || 'news'}
        </span>
      </div>
      {/* Text */}
      <div style={{padding:'16px'}}>
        <p style={{fontSize:'15px',fontWeight:700,color:'#fff',margin:'0 0 6px',lineHeight:1.45,fontFamily:'Poppins,sans-serif',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
          {item.title}
        </p>
        <p style={{fontSize:'12px',color:'rgba(255,255,255,0.45)',margin:'0 0 12px',lineHeight:1.6,fontFamily:'Poppins,sans-serif',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
          {item.original_summary || item.ai_summary || ''}
        </p>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{fontSize:'11px',color:'rgba(255,255,255,0.25)',fontFamily:'Poppins,sans-serif'}}>{item.source_name}</span>
            <span style={{fontSize:'11px',color:'rgba(255,255,255,0.2)',fontFamily:'Poppins,sans-serif'}}>{timeAgo(item.published_at||item.publishedAt)}</span>
          </div>
          <button onClick={e=>{e.preventDefault();e.stopPropagation();onGenerate(item)}}
            style={{padding:'5px 14px',borderRadius:'99px',background:'rgba(167,139,250,0.15)',border:'1px solid rgba(167,139,250,0.35)',color:'#a78bfa',fontSize:'11px',fontWeight:700,fontFamily:'Poppins,sans-serif',cursor:'pointer'}}>
            ✦ Generate
          </button>
        </div>
      </div>
    </a>
  )
}

// Grid card — compact, image top, for 3-col grid
function CardGrid({item, onGenerate}) {
  const [imgErr, setImgErr] = useState(false)
  const img = item.image_url || item.image
  const col = CAT_COLORS[item.category] || '#a78bfa'
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      style={{display:'flex',flexDirection:'column',textDecoration:'none',borderRadius:'12px',overflow:'hidden',background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.06)',transition:'border-color 0.2s,transform 0.2s'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(167,139,250,0.25)';e.currentTarget.style.transform='translateY(-2px)'}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.06)';e.currentTarget.style.transform='translateY(0)'}}>
      <div style={{position:'relative',height:'150px',background:'rgba(255,255,255,0.04)',overflow:'hidden',flexShrink:0}}>
        {img && !imgErr
          ? <img src={img} alt={item.title} onError={()=>setImgErr(true)} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          : <div style={{width:'100%',height:'100%',background:`linear-gradient(135deg,${col}18,rgba(0,0,0,0.5))`,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{fontSize:'28px',opacity:0.2}}>📰</span>
            </div>
        }
        <span style={{position:'absolute',top:'8px',left:'8px',fontSize:'9px',fontWeight:700,fontFamily:'Poppins,sans-serif',letterSpacing:'0.8px',textTransform:'uppercase',color:'#fff',background:col,padding:'2px 8px',borderRadius:'99px'}}>
          {item.category || 'news'}
        </span>
      </div>
      <div style={{padding:'12px',flex:1,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
        <p style={{fontSize:'12.5px',fontWeight:600,color:'rgba(255,255,255,0.9)',margin:'0 0 8px',lineHeight:1.45,fontFamily:'Poppins,sans-serif',display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
          {item.title}
        </p>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:'10px',color:'rgba(255,255,255,0.2)',fontFamily:'Poppins,sans-serif'}}>{timeAgo(item.published_at||item.publishedAt)}</span>
          <button onClick={e=>{e.preventDefault();e.stopPropagation();onGenerate(item)}}
            style={{padding:'3px 10px',borderRadius:'99px',background:'rgba(167,139,250,0.12)',border:'1px solid rgba(167,139,250,0.25)',color:'#a78bfa',fontSize:'10px',fontWeight:700,fontFamily:'Poppins,sans-serif',cursor:'pointer'}}>
            ✦
          </button>
        </div>
      </div>
    </a>
  )
}

// Horizontal list card — no image, text only for bottom section
function CardList({item, onGenerate}) {
  const col = CAT_COLORS[item.category] || '#a78bfa'
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      style={{display:'flex',alignItems:'flex-start',gap:'12px',textDecoration:'none',padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,0.05)',transition:'opacity 0.2s'}}
      onMouseEnter={e=>e.currentTarget.style.opacity='0.75'}
      onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
      <div style={{width:'3px',height:'40px',borderRadius:'99px',background:col,flexShrink:0,marginTop:'2px'}}/>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:'12.5px',fontWeight:600,color:'rgba(255,255,255,0.85)',margin:'0 0 4px',lineHeight:1.4,fontFamily:'Poppins,sans-serif',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
          {item.title}
        </p>
        <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
          <span style={{fontSize:'10px',fontWeight:700,color:col,fontFamily:'Poppins,sans-serif',textTransform:'uppercase',letterSpacing:'0.5px'}}>{item.category}</span>
          <span style={{fontSize:'10px',color:'rgba(255,255,255,0.2)',fontFamily:'Poppins,sans-serif'}}>{item.source_name}</span>
          <span style={{fontSize:'10px',color:'rgba(255,255,255,0.2)',fontFamily:'Poppins,sans-serif'}}>{timeAgo(item.published_at||item.publishedAt)}</span>
        </div>
      </div>
      <button onClick={e=>{e.preventDefault();e.stopPropagation();onGenerate(item)}}
        style={{padding:'3px 8px',borderRadius:'6px',background:'rgba(167,139,250,0.1)',border:'none',color:'#a78bfa',fontSize:'10px',fontWeight:700,fontFamily:'Poppins,sans-serif',cursor:'pointer',flexShrink:0}}>✦</button>
    </a>
  )
}

function GenerateModal({news, onClose}) {
  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}} onClick={onClose}>
      <div style={{background:'#111',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'20px',padding:'24px',maxWidth:'480px',width:'100%'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'16px'}}>
          <h3 style={{fontSize:'14px',fontWeight:700,color:'#fff',margin:0,lineHeight:1.4,flex:1,fontFamily:'Poppins,sans-serif'}}>{news.title}</h3>
          <button onClick={onClose} style={{background:'rgba(255,255,255,0.08)',border:'none',color:'rgba(255,255,255,0.5)',width:'28px',height:'28px',borderRadius:'50%',cursor:'pointer',fontSize:'14px',marginLeft:'12px',flexShrink:0}}>✕</button>
        </div>
        <p style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',fontFamily:'Poppins,sans-serif',lineHeight:1.6,marginBottom:'16px'}}>
          {news.ai_summary || news.original_summary || ''}
        </p>
        <button onClick={()=>{
          window.dispatchEvent(new CustomEvent('sociomee:generate',{detail:{content:news.title+'. '+(news.ai_summary||news.original_summary||'')}}))
          onClose()
        }} style={{width:'100%',padding:'11px',borderRadius:'99px',background:'linear-gradient(135deg,#7c3aed,#9b5cf6)',border:'none',color:'#fff',fontSize:'13px',fontWeight:700,fontFamily:'Poppins,sans-serif',cursor:'pointer'}}>
          ✦ Generate Content from this News
        </button>
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
  const pillsRef = useRef(null)

  const fetchNews = useCallback(async(category)=>{
    setLoading(true)
    try {
      const r = await fetch(`${API}/feed?category=${category}&limit=30`)
      if (r.ok) {
        const d = await r.json()
        setItems(d.items || [])
        if (d.last_updated) setLastUpdated(d.last_updated)
      }
    } catch(e){console.error(e)}
    finally{setLoading(false)}
  },[])

  useEffect(()=>{
    fetch(`${API}/status`).then(r=>r.json()).then(d=>setLastUpdated(d.last_updated)).catch(()=>{})
    const t = setInterval(()=>fetch(`${API}/status`).then(r=>r.json()).then(d=>setLastUpdated(d.last_updated)).catch(()=>{}),60000)
    return ()=>clearInterval(t)
  },[])

  useEffect(()=>{fetchNews(cat)},[cat,fetchNews])

  const featured = items.slice(0,2)
  const grid = items.slice(2,8)
  const list = items.slice(8)

  return (
    <>
      <style>{`
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .news-pills::-webkit-scrollbar{height:5px}
        .news-pills::-webkit-scrollbar-track{background:rgba(255,255,255,0.04);border-radius:99px}
        .news-pills::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.18);border-radius:99px}
        .news-pills::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.28)}
        .news-pills{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.18) rgba(255,255,255,0.04)}
        @media (max-width:768px){
          .news-pills::-webkit-scrollbar{display:none}
          .news-pills{scrollbar-width:none}
        }
        @media (max-width:768px){
          .news-grid-2{grid-template-columns:1fr 1fr!important;gap:10px!important}
          .news-grid-3{grid-template-columns:1fr 1fr!important;gap:10px!important}
        }
      `}</style>

      <div style={{fontFamily:'Poppins,sans-serif',color:'rgba(255,255,255,0.85)',maxWidth:'100%'}}>

        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'flex-end',marginBottom:'14px'}}>
          <LiveDot lastUpdated={lastUpdated}/>
        </div>

        {/* Category pills — horizontal scroll */}
        <div ref={pillsRef} className="news-pills"
          style={{display:'flex',gap:'6px',marginBottom:'20px',overflowX:'auto',paddingBottom:'8px',WebkitOverflowScrolling:'touch'}}>
          {CATS.map(c=>{
            const active = cat===c.id
            const col = CAT_COLORS[c.id]||'#a78bfa'
            return (
              <button key={c.id} onClick={()=>setCat(c.id)}
                style={{padding:'6px 16px',borderRadius:'99px',border:`1px solid ${active?col:'rgba(255,255,255,0.08)'}`,background:active?`${col}18`:'transparent',color:active?col:'rgba(255,255,255,0.4)',fontSize:'12px',fontWeight:active?700:400,cursor:'pointer',whiteSpace:'nowrap',fontFamily:'Poppins,sans-serif',transition:'all 0.15s',flexShrink:0}}>
                {c.label}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
            {[...Array(6)].map((_,i)=><Skeleton key={i}/>)}
          </div>
        ) : items.length===0 ? (
          <div style={{textAlign:'center',padding:'50px 0',color:'rgba(255,255,255,0.3)'}}>
            <p style={{fontSize:'32px',margin:'0 0 8px'}}>📭</p>
            <p style={{fontSize:'13px',margin:'0 0 14px',fontFamily:'Poppins,sans-serif'}}>No news yet. Updates every 2 hours.</p>
            <button onClick={()=>fetch(`${API}/trigger`,{method:'POST'}).then(()=>setTimeout(()=>fetchNews(cat),5000))}
              style={{padding:'8px 20px',borderRadius:'99px',background:'rgba(124,58,237,0.2)',border:'1px solid rgba(124,58,237,0.4)',color:'#a78bfa',fontSize:'12px',cursor:'pointer',fontFamily:'Poppins,sans-serif',fontWeight:600}}>
              ↻ Fetch Now
            </button>
          </div>
        ) : (
          <>
            {/* Featured — 2 col */}
            {featured.length > 0 && (
              <div className="news-grid-2" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'20px'}}>
                {featured.map(item=><CardFeatured key={item.id} item={item} onGenerate={setModal}/>)}
              </div>
            )}

            {/* Grid — 3 col */}
            {grid.length > 0 && (
              <>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
                  <span style={{fontSize:'11px',fontWeight:700,color:'rgba(255,255,255,0.3)',fontFamily:'Poppins,sans-serif',textTransform:'uppercase',letterSpacing:'1px'}}>More Stories</span>
                  <div style={{flex:1,height:'1px',background:'rgba(255,255,255,0.06)'}}/>
                </div>
                <div className="news-grid-3" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'20px'}}>
                  {grid.map(item=><CardGrid key={item.id} item={item} onGenerate={setModal}/>)}
                </div>
              </>
            )}

            {/* List — remaining, shown as grid on mobile */}
            {list.length > 0 && (
              <>
                <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
                  <span style={{fontSize:'11px',fontWeight:700,color:'rgba(255,255,255,0.3)',fontFamily:'Poppins,sans-serif',textTransform:'uppercase',letterSpacing:'1px'}}>Latest</span>
                  <div style={{flex:1,height:'1px',background:'rgba(255,255,255,0.06)'}}/>
                </div>
                <div className="news-grid-3" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px'}}>
                  {list.map(item=><CardGrid key={item.id} item={item} onGenerate={setModal}/>)}
                </div>
              </>
            )}

            <div style={{textAlign:'center',marginTop:'16px'}}>
              <button onClick={()=>fetchNews(cat)}
                style={{background:'transparent',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.3)',padding:'7px 24px',borderRadius:'99px',cursor:'pointer',fontSize:'11px',fontFamily:'Poppins,sans-serif',fontWeight:600}}>
                ↻ Refresh
              </button>
            </div>
          </>
        )}
      </div>

      {modal && <GenerateModal news={modal} onClose={()=>setModal(null)}/>}
    </>
  )
}
