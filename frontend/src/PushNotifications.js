const VAPID_PUBLIC="BEByuC2Mkl9PWIgaiOFEgIcXjn6GSmlBo4tstvA8TS9d-PJtFshfg5KVqGQr75hb3-AWnFTsKZOnc1hF0OjTXLY";
const BASE="https://sociomeeai.com/api";

function urlBase64ToUint8Array(b64){
  const pad="=".repeat((4-b64.length%4)%4);
  const raw=window.atob((b64+pad).replace(/-/g,"+").replace(/_/g,"/"));
  return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));
}

async function sendSubToBackend(userId,sub){
  try{
    await fetch(`${BASE}/push/subscribe`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({user_id:userId,subscription:sub.toJSON()})});
  }catch(e){console.warn("push sync failed:",e);}
}

async function doSubscribe(userId,reg){
  try{
    const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC)});
    await sendSubToBackend(userId,sub);
  }catch(e){console.warn("push subscribe failed:",e);}
}

function showPrompt(userId,reg){
  if(document.getElementById("sm-push-prompt"))return;
  const el=document.createElement("div");
  el.id="sm-push-prompt";
  el.style.cssText="position:fixed;bottom:24px;right:24px;z-index:99999;background:rgba(10,8,20,0.98);border:1px solid rgba(124,58,237,0.35);border-radius:20px;padding:20px 24px;max-width:320px;width:calc(100vw - 48px);box-shadow:0 20px 60px rgba(0,0,0,0.8),0 0 40px rgba(124,58,237,0.2);animation:smSlide 0.3s ease;font-family:system-ui,sans-serif;";
  el.innerHTML=`<style>@keyframes smSlide{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}#sm-push-prompt button{font-family:system-ui,sans-serif;cursor:pointer;}</style>
<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
  <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#ff3d8f);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">🔔</div>
  <div><div style="font-size:14px;font-weight:800;color:#fff;">Credit Alerts</div><div style="font-size:11px;color:rgba(255,255,255,0.4);">SocioMee notifications</div></div>
  <button id="sm-push-x" style="margin-left:auto;background:none;border:none;color:rgba(255,255,255,0.3);font-size:20px;padding:0;line-height:1;">×</button>
</div>
<p style="font-size:13px;color:rgba(255,255,255,0.6);line-height:1.6;margin:0 0 16px;">Get notified when your credits run out and when they reset each month. No spam, ever.</p>
<div style="display:flex;gap:8px;">
  <button id="sm-push-yes" style="flex:1;padding:10px;border-radius:10px;border:none;background:linear-gradient(135deg,#7c3aed,#9b5cf6);color:#fff;font-size:13px;font-weight:700;">🔔 Allow</button>
  <button id="sm-push-no" style="flex:1;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.4);font-size:13px;font-weight:600;">Not now</button>
</div>`;
  document.body.appendChild(el);
  document.getElementById("sm-push-yes").onclick=async()=>{el.remove();const p=await Notification.requestPermission();if(p==="granted")await doSubscribe(userId,reg);};
  const dismiss=()=>{el.remove();localStorage.setItem("sm_push_dismissed","1");};
  document.getElementById("sm-push-no").onclick=dismiss;
  document.getElementById("sm-push-x").onclick=dismiss;
}

export async function initPush(userId){
  if(!userId)return;
  if(!("serviceWorker"in navigator)||!("PushManager"in window))return;
  try{
    const reg=await navigator.serviceWorker.register("/sw.js",{scope:"/"});
    await navigator.serviceWorker.ready;
    const existing=await reg.pushManager.getSubscription();
    if(existing){await sendSubToBackend(userId,existing);return;}
    if(localStorage.getItem("sm_push_dismissed"))return;
    if(Notification.permission==="granted"){await doSubscribe(userId,reg);return;}
    if(Notification.permission==="denied")return;
    // Push prompt removed — subscriptions managed on landing page only
  }catch(e){console.warn("initPush:",e);}
}
