const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const version = JSON.parse(fs.readFileSync(path.join(root, 'version.json'))).version;
for (const f of ['index.html', 'reparar.html', 'lecturas-bridge.html']) {
  for (const m of fs.readFileSync(path.join(root, f), 'utf8').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) new vm.Script(m[1], {filename:f});
}
for (const f of ['sw.js', 'demo-data.js']) new vm.Script(fs.readFileSync(path.join(root, f), 'utf8'));
assert(html.includes(`v${version}`)); assert(worker.includes(`'${version}'`));
let legacy = false;
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) {res.writeHead(403).end();return;}
  try {
    let body = fs.readFileSync(file);
    if (legacy && file.endsWith('/index.html')) body = html.replaceAll(version, '0.34.3').replace("$$('[data-deck-start]').forEach", "$('[data-deck-start]').forEach");
    if (legacy && file.endsWith('/sw.js')) body = fs.readFileSync(path.join(__dirname, 'fixtures/sw-0.34.3.js'));
    const ext = path.extname(file);
    res.setHeader('Content-Type', ({'.html':'text/html','.js':'application/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.png':'image/png','.ttf':'font/ttf'})[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control','no-store');res.end(body);
  } catch {res.writeHead(404).end();}
});
async function boot(page) {
  try {await page.waitForFunction(() => window.__repasosBoot?.ready === true);} catch(e){console.error('BOOT FAILURE',page.url(),await page.content());throw e;}
  await page.evaluate(() => startupReadyPromise);
  try {await page.waitForSelector('#globalStartBtn');}catch(e){console.error('HOME FAILURE',page.url(),await page.content());throw e;}
}
async function checkDeckAppearance(page, touch) {
  const press = selector => touch ? page.locator(selector).tap() : page.locator(selector).click();
  await press('#decksStartBtn');
  assert.equal(await page.locator('#deckModalConfirm').isEnabled(),false);
  const selected=[];
  for(const deck of ['Música','Literatura','Miscelánea']) {
    await press(`[data-deck-start="${deck}"]`);selected.push(deck);
    const appearance=await page.locator('[data-deck-start]').evaluateAll(buttons=>buttons.map(button=>{
      const style=getComputedStyle(button);
      return {deck:button.dataset.deckStart,selected:button.getAttribute('aria-pressed'),border:style.borderTopWidth,color:style.borderTopColor,background:style.backgroundColor,mark:getComputedStyle(button,'::after').content};
    }));
    const plain=appearance.find(item=>!selected.includes(item.deck));
    for(const item of appearance.filter(item=>selected.includes(item.deck))) {
      assert.equal(item.selected,'true');assert.equal(item.border,'2px');
      assert.notEqual(item.color,'rgba(0, 0, 0, 0)');assert.notEqual(item.background,plain.background);
      assert(['none','normal'].includes(item.mark),'Selected decks must not show a tick');
    }
    if(selected.length===3 && process.env.DECK_SCREENSHOT)await page.screenshot({path:process.env.DECK_SCREENSHOT});
  }
  const buttons=await page.locator('.deck-modal-actions').evaluate(container=>{
    const [cancel,confirm]=[...container.children],a=cancel.getBoundingClientRect(),b=confirm.getBoundingClientRect(),box=container.getBoundingClientRect();
    return {fontA:getComputedStyle(cancel).fontSize,fontB:getComputedStyle(confirm).fontSize,heightA:a.height,heightB:b.height,center:(a.left+b.right)/2,expected:box.left+box.width/2};
  });
  assert.equal(buttons.fontA,buttons.fontB);assert.equal(buttons.heightA,buttons.heightB);assert(buttons.heightA>=44);assert(Math.abs(buttons.center-buttons.expected)<1);
  for(const deck of selected)await press(`[data-deck-start="${deck}"]`);
  assert.equal(await page.locator('#deckModalConfirm').isEnabled(),false);
  await press('#deckModalCancel');
}
async function readSentinel(page) {
  return page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('repaso-slick-db',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});try{return await new Promise((resolve,reject)=>{const r=db.transaction('items').objectStore('items').get('test-preserved');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}finally{db.close()}});
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=`http://127.0.0.1:${server.address().port}`;
 const deadline=setTimeout(()=>{console.error('Browser suite exceeded 90 seconds');process.exit(1)},90000);
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 try {
  for (const {arcade,touch} of [{arcade:false,touch:false},{arcade:true,touch:false},{arcade:false,touch:true}]) {
   const context=await browser.newContext(touch?{viewport:{width:390,height:844},isMobile:true,hasTouch:true}:{});const page=await context.newPage();page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR',e.stack)});
   await context.addInitScript(arcade=>{if(!localStorage.getItem('repaso-settings'))localStorage.setItem('repaso-settings',JSON.stringify({demoMode:true,arcadeMode:arcade,theme:arcade?'arcade':'violet'}))},arcade);
   await page.goto(url);await boot(page);
   // Wait for first service-worker activation/reload before interacting.
   await page.waitForFunction(async()=>{const registration=await navigator.serviceWorker.getRegistration();return registration?.active?.state==='activated' && navigator.serviceWorker.controller!==null;});await page.waitForLoadState('networkidle');await page.reload();await boot(page);
   await checkDeckAppearance(page,touch);
   await page.locator('[data-go="settings"]').click();await page.locator('[data-language-display="text"]').click();assert.equal(await page.locator('[data-language-display="text"]').getAttribute('class').then(x=>x.includes('active')),true);
   await page.locator('[data-action="back"]').click();await page.evaluate(async()=>{await putItems(['Literatura','Sistemas de escritura'].map(deck=>({...newItem('Pregunta '+deck,'Respuesta '+deck),deck})));});await page.locator('#decksStartBtn').click();
   for(const deck of ['Literatura','Sistemas de escritura'])await page.locator(`[data-deck-start="${deck}"]`).click();
   assert.equal(await page.locator('#deckModalConfirm').isEnabled(),true);assert.equal(await page.locator('#deckModal').isVisible(),true);
   await page.locator('#deckModalConfirm').click();await page.waitForSelector('#currentCard');
   assert(await page.evaluate(async()=>{const units=await getReviewUnits(activeSessionDeck);return activeSessionDeck.length===2 && ['Literatura','Sistemas de escritura'].includes(currentItem.deck) && units.every(u=>activeSessionDeck.includes(u.deck)) && new Set(units.map(u=>u.deck)).size===2}));
   const before=await page.locator('#currentCard .word').innerHTML();await page.locator('#currentCard').click();await page.waitForFunction(()=>currentFlipped);assert.notEqual(await page.locator('#currentCard .word').innerHTML(),before);
   await page.locator('[data-action="game-back"]').click();if(await page.locator('#arcadeSummaryModal').isVisible())await page.locator('#arcadeSummaryFinish').click();
   await page.locator('#decksStartBtn').click();assert.equal(await page.locator('[data-deck-start].selected').count(),2);await page.locator('#deckModalCancel').click();
   // Exercise a real music card with the application's audio controls.
   await page.evaluate(async()=>{const catalog=await loadMusicCatalog();await putItem(musicCatalogCard(catalog[0]));});
   await page.locator('#decksStartBtn').click();for(const deck of ['Literatura','Sistemas de escritura','Música'])await page.locator(`[data-deck-start="${deck}"]`).click();await page.locator('#deckModalConfirm').click();await page.waitForSelector('#currentCard');
   if(!await page.locator('#currentCard audio').count())await page.locator('#currentCard').click();
   await page.waitForFunction(()=>{const a=document.querySelector('#currentCard audio');return a && a.currentTime>0 && !a.paused});
   await context.setOffline(true);await page.reload();await boot(page);assert.deepEqual(errors,[]);await context.close();console.log(`PASS UI, multiple decks, flip, settings, music, offline (${arcade?'Arcade':touch?'mobile touch':'normal'})`);
  }
  // Reproduce broken 0.34.3, update its SW without the broken UI, retain IndexedDB.
  legacy=true;const context=await browser.newContext();const page=await context.newPage();page.setDefaultTimeout(10000);await page.goto(url+'/reparar.html');
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;await new Promise(resolve=>{if(r.active?.state==='activated')return resolve();r.active.addEventListener('statechange',()=>{if(r.active.state==='activated')resolve()})})});
  await page.goto(url);
  await page.waitForSelector('[role="alert"]');assert((await page.locator('[role="alert"]').innerText()).includes('forEach'));
  const sentinel={id:'test-preserved',text:'Tarjeta sintética',hint:'Respuesta',deck:'Miscelánea',paused:false,bidirectional:true,yes:7,nope:2,history:[{answer:'yes',at:123456}],reverseProgress:{yes:4,nope:1,history:[{answer:'nope',at:123457}]}};
  await page.evaluate(async sentinel=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('repaso-slick-db',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('items')){const store=r.result.createObjectStore('items',{keyPath:'id'});store.createIndex('createdAt','createdAt');store.createIndex('dueAt','dueAt')}};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});await new Promise((resolve,reject)=>{const t=db.transaction('items','readwrite');t.objectStore('items').put(sentinel);t.oncomplete=resolve;t.onerror=()=>reject(t.error)});db.close();localStorage.setItem('test-preserved','sentinel');localStorage.setItem('repaso-settings',JSON.stringify({demoMode:false}));localStorage.setItem('repaso-decks-music-v1','1');localStorage.setItem('repaso-usage',JSON.stringify({'2026-01-01':{yes:7,nope:2,seconds:123}}))},sentinel);
  const updateErrors=[];page.on('pageerror',e=>updateErrors.push(e.message));legacy=false;await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();await r.update()});await boot(page);await page.waitForFunction(v=>document.title.includes(v),version);
  assert.deepEqual(await readSentinel(page),sentinel);assert.equal(await page.evaluate(()=>localStorage.getItem('test-preserved')),'sentinel');
  await page.goto(url+'/reparar.html');await page.locator('#repair').click();await page.waitForURL(/index.html\?recuperacion=/);await boot(page);assert.deepEqual(await readSentinel(page),sentinel);
  await context.setOffline(true);await page.reload();await boot(page);assert.deepEqual(await readSentinel(page),sentinel);
  const cached=await page.evaluate(async()=>{const c=await caches.open('repasos-'+document.title.match(/v([\d.]+)/)[1]);return (await (await c.match('./index.html')).text()).includes('<title>Aprendizaje')});assert(cached);
  assert.deepEqual(updateErrors,[]);assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('repaso-usage'))),{'2026-01-01':{yes:7,nope:2,seconds:123}});
  await context.close();console.log('PASS broken-version update, recovery, offline and exact IndexedDB/localStorage preservation');
 } finally {clearTimeout(deadline);await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
