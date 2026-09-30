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
  const client=await tab();await login(client,'user');await navigate(client,'Fstudios.html');
  await until(client,"!document.querySelector('#studio-results').hidden && document.querySelectorAll('.studio-card').length>0",'studio listings');
  assert(await evaluate(client,"document.querySelector('[data-filter=all]').getAttribute('aria-pressed')==='true'"),'All filter matches initial display');
  const id=await evaluate(client,"Number([...document.querySelectorAll('.studio-card')].find(c=>c.innerText.includes('Urban-C')).dataset.select)");
  assert(!!id,'sourced studio appears from database');
  await until(client,"document.querySelectorAll('.lash-pin').length>=2",'map markers');
  await evaluate(client,"document.querySelector('[data-select=\""+id+"\"]').click()");
  assert(await evaluate(client,"!document.querySelector('#studio-detail').hidden && document.querySelector('.contact-primary').getAttribute('href')==='tel:+639241036086'"),'selection opens details and correct call number');
  assert(await evaluate(client,"document.querySelector('.contact-secondary').href==='https://facebook.com/urbanclashes2023'"),'correct Facebook link');
  assert(await evaluate(client,"new URL(document.querySelector('.directions-link').href).searchParams.get('destination')==='14.349933,120.80542'"),'directions use database coordinates');
  assert(await evaluate(client,"document.querySelectorAll('.detail-source a').length===2"),'contact and map provenance shown');
  await evaluate(client,"document.querySelector('#detail-save').click()");
  await until(client,"document.querySelector('#detail-save').getAttribute('aria-pressed')==='true'",'favorite save');
  await navigate(client,'Fstudios.html#studio-'+id);
  await until(client,"!!document.querySelector('#detail-save')",'deep link');
  assert(await evaluate(client,"document.querySelector('#detail-save').getAttribute('aria-pressed')==='true'"),'favorite persists and deep link restores detail');
  let shot=await send('Page.captureScreenshot',{format:'png'},client);fs.writeFileSync(path.join(process.cwd(),'tests','studio-detail-desktop.png'),Buffer.from(shot.data,'base64'));
  await evaluate(client,"document.querySelector('#detail-map').click()");
  await until(client,"!!document.querySelector('.leaflet-popup-content')",'selected map popup');
  assert(await evaluate(client,"document.querySelector('.studio-card.selected').dataset.select==='"+id+"' && document.querySelector('.leaflet-popup-content').innerText.includes('Urban-C')"),'view pin selects matching card and popup');
  await evaluate(client,"document.querySelector('.studio-map-popup button').click()");
  assert(await evaluate(client,"!document.querySelector('#studio-detail').hidden"),'map popup opens details');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true},client);await delay(250);
  assert(await evaluate(client,"document.documentElement.scrollWidth<=innerWidth+1 && document.querySelector('#studio-detail').scrollWidth<=document.querySelector('#studio-detail').clientWidth+1"),'mobile details have no horizontal overflow');
  shot=await send('Page.captureScreenshot',{format:'png'},client);fs.writeFileSync(path.join(process.cwd(),'tests','studio-detail-mobile.png'),Buffer.from(shot.data,'base64'));
  await evaluate(client,"document.querySelector('#detail-back').click()");
  assert(await evaluate(client,"document.documentElement.scrollWidth<=innerWidth+1"),'mobile listing fits viewport');
  await evaluate(client,"document.querySelector('#home-search').value='no-such-studio';document.querySelector('#home-search').dispatchEvent(new Event('input'))");
  assert(await evaluate(client,"document.querySelector('#matching-studios').innerText.includes('No Cavite studios found')"),'empty search state');
  assert(await evaluate(client,"studioWebURL('javascript:alert(1)')==='' && studioWebURL('https://facebook.com.evil.example/','facebook.com')===''"),'contact URLs reject unsafe protocols and lookalike domains');
  assert(errors.length===0,'no browser JavaScript exceptions');
 }finally{
  if(socket){try{await send('Browser.close');}catch{}socket.close();}proc.kill();
  console.log(execFileSync(php,[path.join(process.cwd(),'tests','browser-fixtures.php'),'cleanup',fixture.tag],{encoding:'utf8',windowsHide:true}));
 }
})().catch(e=>{console.error(e);process.exitCode=1});
