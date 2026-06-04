const CACHE="sociomee-v1";
self.addEventListener("install",e=>{self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(clients.claim());});
self.addEventListener("push",e=>{
  if(!e.data)return;
  let data={};
  try{data=e.data.json();}catch{data={title:"SocioMee",body:e.data.text()};}
  const title=data.title||"SocioMee";
  const options={body:data.body||"",icon:"/icons/youtube.png",badge:"/icons/youtube.png",tag:data.tag||"sociomee",renotify:true,requireInteraction:data.requireInteraction||false,data:{url:data.url||"https://sociomee.in/app"},vibrate:[200,100,200]};
  e.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener("notificationclick",e=>{
  e.notification.close();
  const url=e.notification.data?.url||"https://sociomee.in/app";
  e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
    for(const c of list){if(c.url.includes("sociomee.in")&&"focus"in c){c.navigate(url);return c.focus();}}
    if(clients.openWindow)return clients.openWindow(url);
  }));
});
