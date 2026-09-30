const {spawn,execFileSync}=require('node:child_process');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const php=process.env.LASHMATCH_PHP||'C:/xampp/php/php.exe',chrome=process.env.LASHMATCH_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const baseUrl=process.env.LASHMATCH_TEST_URL||'http://localhost/Lashmatch-main';
const fixture=JSON.parse(execFileSync(php,[path.join(path.join(process.cwd(),'tests'),'browser-fixtures.php'),'create'],{encoding:'utf8',windowsHide:true}));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'lashmatch-browser-check-'));
const proc=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9225','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let socket;const pending=new Map();let seq=0;const errors=[];
async function send(method,params={},sessionId){const id=++seq;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method));},20000);pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});}
async function tab(){const {browserContextId}=await send('Target.createBrowserContext');const {targetId}=await send('Target.createTarget',{url:'about:blank',browserContextId});const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});await send('Runtime.enable',{},sessionId);await send('Network.enable',{},sessionId);await send('Network.setCacheDisabled',{cacheDisabled:true},sessionId);await send('Page.enable',{},sessionId);await send('Emulation.setDeviceMetricsOverride',{width:1533,height:1000,deviceScaleFactor:1,mobile:false},sessionId);return sessionId;}
async function evaluate(s,expression){const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},s);if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;}
async function until(s,expression,label){for(let n=0;n<80;n++){if(await evaluate(s,expression))return;await delay(150);}throw Error('Timed out: '+label+'; '+await evaluate(s,'document.body.innerText.slice(0,600)'));}
async function navigate(s,page){await send('Page.navigate',{url:baseUrl+'/'+page},s);await until(s,"document.readyState==='complete'",'load '+page);}
function assert(ok,label){if(!ok)throw Error(label);console.log('PASS '+label);}
async function login(s,role){await navigate(s,'login.html'+(role==='admin'?'?role=admin':''));await evaluate(s,`document.querySelector('#login-form').elements.email.value=${JSON.stringify(fixture.accounts[role].email)};document.querySelector('#password').value=${JSON.stringify(fixture.password)};document.querySelector('#login-form').requestSubmit();`);await until(s,role==='admin'?"document.body.classList.contains('live-ready')":"!!document.querySelector('.dashboard')&&!document.querySelector('.dashboard').hidden",role+' login');}

(async()=>{
 try{
  let meta;for(let i=0;i<60;i++){try{meta=await (await fetch('http://127.0.0.1:9225/json/version')).json();break;}catch{await delay(200);}}if(!meta)throw Error('Chrome did not start');
  socket=new WebSocket(meta.webSocketDebuggerUrl);await new Promise((res,rej)=>{socket.onopen=res;socket.onerror=rej;});
  socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);};
  const admin=await tab();await login(admin,'admin');await navigate(admin,'admin/admin-studios.html');await until(admin,"document.body.classList.contains('live-ready')",'admin studios');
  const records=await evaluate(admin,"fetch('../api.php?action=studios').then(r=>r.json()).then(r=>r.studios.map(({id,slug,image_kind,specialties,capabilities})=>({id,slug,image_kind,specialties,capabilities})))");
  const slugs=["jems-lashenails-aesthetic-tanza","glam-looks-beauty-studio-tanza","brow-fairy-sanja-mayor","hidden-beauty-luxe-imus","khitels-wax-eyelash-salon-bacoor"];
  for(const slug of slugs){
   const r=records.find(r=>r.slug===slug);assert(r&&r.image_kind==='illustration'&&r.specialties.length===0&&Object.keys(r.capabilities).length===0,slug+' added with illustration and empty capabilities');
  }
  await until(admin,"[...document.querySelectorAll('#studio-body img')].every(i=>i.complete&&i.naturalWidth>0)",'admin thumbnails decode');
  assert(await evaluate(admin,"document.querySelectorAll('#studio-body .studio-art-label').length===0"),'first page shows thumbnails without visible badges');
  await evaluate(admin,"document.querySelector('#close-editor').click()");
  let shot=await send('Page.captureScreenshot',{format:'png'},admin);fs.writeFileSync(path.join(process.cwd(),'tests','studio-covers-admin.png'),Buffer.from(shot.data,'base64'));
  await evaluate(admin,"document.querySelector('#next-page').click()");
  await until(admin,"document.querySelector('#studio-body').innerText.includes('Urban-C')",'second page');
  assert(await evaluate(admin,"!!document.querySelector('#studio-body img') && !document.querySelector('#studio-body .studio-art-label')"),'Urban-C now has illustrated thumbnail');
  await navigate(admin,'admin/admin-studio-capabilities.html');await until(admin,"document.body.classList.contains('live-ready')",'capabilities page');
  for(const slug of slugs){
   const id=records.find(r=>r.slug===slug).id;
   await evaluate(admin,"document.querySelector('[data-edit=\""+id+"\"]').click()");
   assert(await evaluate(admin,"!document.querySelector('#capability-editor').hidden && document.querySelectorAll('#capability-form input[type=checkbox]:checked').length===0 && !!document.querySelector('#capability-profile img')"),slug+' ready to configure');
  }
  assert(await evaluate(admin,"[...document.querySelectorAll('.capability-checks label')].every(el=>el.getBoundingClientRect().right<=document.querySelector('#capability-editor').getBoundingClientRect().right)"),'capability options stay inside editor');
  shot=await send('Page.captureScreenshot',{format:'png'},admin);fs.writeFileSync(path.join(process.cwd(),'tests','studio-covers-capabilities.png'),Buffer.from(shot.data,'base64'));
  const client=await tab();await login(client,'user');await navigate(client,'Fstudios.html');
  await until(client,"!document.querySelector('#studio-results').hidden",'client directory');
  assert(await evaluate(client,"document.querySelectorAll('.studio-card').length===7 && document.querySelectorAll('.studio-card .studio-art-label').length===0"),'all seven studios appear without visible image labels');
  await until(client,"[...document.querySelectorAll('.studio-card img')].every(i=>i.complete&&i.naturalWidth>0)",'client thumbnails decode');
  await evaluate(client,"document.querySelector('[data-select=\""+records.find(r=>r.slug===slugs[0]).id+"\"]').click()");
  assert(await evaluate(client,"!!document.querySelector('.detail-cover img') && !document.querySelector('.detail-cover .studio-art-label')"),'detail cover has no visible badge');
  assert(await evaluate(client,"document.querySelector('.detail-source a').textContent.includes('Public directory listing')"),'directory source not misrepresented as studio booking page');
  assert(errors.length===0,'no browser JavaScript exceptions');
 }finally{
  if(socket){try{await send('Browser.close');}catch{}socket.close();}proc.kill();
  console.log(execFileSync(php,[path.join(process.cwd(),'tests','browser-fixtures.php'),'cleanup',fixture.tag],{encoding:'utf8',windowsHide:true}));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
