const C='moach-v48',F=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png','favicon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==location.origin)return;
 e.respondWith(fetch(r).then(x=>{const y=x.clone();caches.open(C).then(c=>c.put(r,y));return x}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))))});
self.addEventListener('push',e=>{let d={};try{d=e.data?e.data.json():{}}catch(x){d={body:e.data?e.data.text():''}}
 e.waitUntil(self.registration.showNotification(d.title||'M.oach',{body:d.body||'',tag:d.tag||'moach',icon:'icon-192.png',renotify:true,data:{tab:d.tab||''}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const tab=(e.notification.data||{}).tab||'';
 e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{
  const c=cs.find(x=>x.url.startsWith(self.registration.scope))||cs[0];
  if(c){c.postMessage({t:'push',tab});return c.focus()}
  return self.clients.openWindow(self.registration.scope+(tab?'?tab='+tab:''))}))});
