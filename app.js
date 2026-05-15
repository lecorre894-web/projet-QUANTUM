/*
  BBB GENESIS SUPREME MINER / SOVEREIGN AI — APP.JS.TXT
  Version: V3.0 HONESTY-GUARD KERNEL

  Objectif:
  - Cockpit runtime type Genesis / Supreme Brain
  - BBB PoW V2 clean-room
  - SHA256 legacy WebCrypto
  - RandomX / XMRig bridge visible
  - Super IA souveraine: local/Ollama + Pollinations
  - Terminal + onglets + horloge + boutons MINER X / ON-OFF
  - Honesty Guard Ultime: pas de faux réel, pas de module caché, pas d'auto-mining silencieux

  Important:
  - Ce fichier ne télécharge pas de mineur, ne cache rien, ne lance rien sans bouton START/MINER X.
  - RandomX réel nécessite un moteur externe visible (ex: XMRig lancé par toi) + API locale.
  - En navigateur, SHA256/BBB PoW restent limités par JS/WebCrypto.
*/

(function(){
'use strict';

// =========================================================
// 0. SAFE ENV HELPERS
// =========================================================
const IS_BROWSER = typeof window !== 'undefined' && typeof document !== 'undefined';
const HAS_CRYPTO = IS_BROWSER && window.crypto && window.crypto.subtle;
const HW_THREADS = IS_BROWSER && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4;

function nowTime(){ return new Date().toLocaleTimeString(); }
function nowDate(){ return new Date().toLocaleDateString(); }
function $(id){ return IS_BROWSER ? document.getElementById(id) : null; }
function clamp(n,min,max){ return Math.max(min, Math.min(max,n)); }
function html(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

// =========================================================
// 1. HONESTY GUARD ULTIME
// =========================================================
const HONESTY_GUARD = {
  name: 'HONESTY_GUARD_ULTIME',
  locked: true,
  rules: {
    noHiddenMining: true,
    noFakeReality: true,
    noAutoStart: true,
    noStealthDownload: true,
    explicitUserStartRequired: true,
    labelEmulationWhenNotLive: true,
    randomXRequiresExternalEngine: true,
    shellRequiresExplicitBridge: true,
    aiMayHallucinate: true
  },
  status(){
    return {
      guard: this.name,
      locked: this.locked,
      reality: 'VISIBLE_RUNTIME_ONLY',
      mining: BBB_STATE.running ? 'USER_STARTED' : 'STOPPED',
      randomx: BBB_STATE.xmrigOnline ? 'REAL_EXTERNAL_API_LIVE' : 'EXTERNAL_ENGINE_NOT_CONFIRMED',
      ai: 'ASSISTANT_OUTPUT_NOT_PROOF',
      browserLimit: 'BROWSER_JS_IS_NOT_NATIVE_HASHRATE'
    };
  },
  assertCanStart(moduleName){
    if(!this.locked) throw new Error('Honesty guard unlocked is forbidden.');
    log('GUARD', `explicit start accepted for ${moduleName}`, 'tg');
    return true;
  },
  labelFor(source){
    if(source === 'XMRIG_API' && BBB_STATE.xmrigOnline) return 'REAL_EXTERNAL_API';
    if(source === 'SHA256_WEBCRYPTO') return 'REAL_BROWSER_WEBCRYPTO';
    if(source === 'BBB_POW_V2') return 'REAL_BROWSER_JS_EXPERIMENTAL';
    if(source === 'AI') return 'AI_ASSISTED_NOT_TRUTH_SOURCE';
    return 'VISIBLE_NOT_CONFIRMED_REAL';
  }
};

// =========================================================
// 2. CONFIG / STATE
// =========================================================
const BBB_CONFIG = {
  engine: 'BBB_GENESIS_SUPREME_APPJS_V3_0',
  uiMode: 'TRILLIONS_GENESIS_V9_SUPREME_BRAIN_V8_STYLE',
  threads: clamp(HW_THREADS, 2, 32),
  arenaMB: 32,
  rounds: 1024,
  target: 0x0000ffffffffffffn,
  statsInterval: 1000,
  heartbeatMs: 1000,
  watchdogMs: 5000,
  maxHistory: 240,
  worker: 'bbb-genesis-worker',
  wallet: 'WALLET_REQUIRED',
  pool: 'pool.required:3333',
  xmrigApi: 'http://127.0.0.1:18080/2/summary',
  wsBridge: 'ws://127.0.0.1:8787',
  localAi: 'http://127.0.0.1:11434/api/generate',
  localAiModel: 'llama3',
  pollinations: 'https://text.pollinations.ai/',
  activeAlgo: 'BBB_POW_V2',
  powerOn: false,
  minerX: false
};

const BBB_JOB = {
  seed: 0x9e3779b97f4a7c15n,
  header: 0x1234567890ABCDEFn,
  target: BBB_CONFIG.target,
  height: 1,
  timestamp: Date.now()
};

const BBB_STATE = {
  running: false,
  startedAt: 0,
  hashes: 0,
  accepted: 0,
  rejected: 0,
  hashrate: 0,
  bestDigest: null,
  nonce: 0n,
  terminal: [],
  history: [],
  proofs: [],
  lanes: [],
  statsTimer: null,
  heartbeatTimer: null,
  watchdogTimer: null,
  xmrigOnline: false,
  xmrigSummary: null,
  sha256Running: false,
  ws: null,
  wsOnline: false,
  lastTick: Date.now(),
  modules: {},
  aiLastProvider: null,
  aiLastText: '',
  memory: []
};

// =========================================================
// 3. TERMINAL / EVENTS
// =========================================================
function log(zone, msg, level='ok'){
  const line = { ts: nowTime(), zone, msg: String(msg), level };
  BBB_STATE.terminal.push(line);
  if(BBB_STATE.terminal.length > 1000) BBB_STATE.terminal.shift();
  BBB_STATE.memory.push(line);
  if(BBB_STATE.memory.length > 300) BBB_STATE.memory.shift();
  if(IS_BROWSER) window.dispatchEvent(new CustomEvent('bbb-log', { detail: line }));
  renderTerminalLine(line);
  try { console.log(`[${line.ts}] [${zone}] ${msg}`); } catch(e) {}
}

function renderTerminalLine(l){
  const el = $('bbb-terminal');
  if(!el) return;
  const color = l.level==='er' ? '#ff4d6d' : l.level==='wa' ? '#ffd166' : l.level==='tg' ? '#35eaff' : '#57efad';
  const cls = l.zone === 'USER' ? 'user' : l.zone === 'AI' ? 'ai' : 'system';
  el.insertAdjacentHTML('beforeend', `<div class="term-line ${cls}"><span class="term-ts">[${html(l.ts)}]</span> <span style="color:${color}">[${html(l.zone)}]</span> ${html(l.msg)}</div>`);
  el.scrollTop = el.scrollHeight;
}

// =========================================================
// 4. BBB PoW V2
// =========================================================
function rotl(x, r){ return ((x << BigInt(r)) | (x >> BigInt(64-r))) & 0xffffffffffffffffn; }
function mix64(z){
  z = (z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n; z &= 0xffffffffffffffffn;
  z = (z ^ (z >> 27n)) * 0x94d049bb133111ebn; z &= 0xffffffffffffffffn;
  return z ^ (z >> 31n);
}
function createArena(sizeMB, laneId){
  const count = Math.max(1024, Math.floor((sizeMB * 1024 * 1024) / 8));
  const arena = new BigUint64Array(count);
  let s = mix64(BBB_JOB.seed ^ BigInt(laneId));
  for(let i=0;i<arena.length;i++){ s = mix64(s + BigInt(i)); arena[i] = s; }
  return arena;
}
function computeBBBPoW(nonce, laneId, arena){
  const mask = BigInt(arena.length - 1);
  let a = mix64(BBB_JOB.header ^ nonce);
  let b = mix64(BBB_JOB.seed ^ BigInt(laneId));
  let c = mix64(a ^ b);
  let d = mix64(c + 0x9e3779b97f4a7c15n);
  for(let i=0;i<BBB_CONFIG.rounds;i++){
    const idx1 = Number((a ^ b ^ BigInt(i)) & mask);
    const idx2 = Number((c + d + BigInt(i * 13)) & mask);
    const m1 = arena[idx1];
    const m2 = arena[idx2];
    a = rotl(a + m1 + BigInt(i), 13) ^ d;
    b = (rotl(b ^ m2, 17) + a) & 0xffffffffffffffffn;
    c = rotl(c + a, 29) ^ b;
    d = (rotl(d ^ c, 37) + m1 + m2) & 0xffffffffffffffffn;
    arena[idx1] = mix64(a ^ c ^ BigInt(i));
    arena[idx2] = mix64(b ^ d ^ BigInt(i * 7));
    if((i & 31) === 0){ arena[Number((a ^ d) & mask)] ^= mix64(a + b + c + d); }
  }
  return mix64(a ^ b ^ c ^ d);
}
function verifyBBBProof(nonce, digest, laneId=0){
  const arena = createArena(BBB_CONFIG.arenaMB, laneId);
  return computeBBBPoW(nonce, laneId, arena) === digest;
}

async function laneLoop(laneId){
  const arena = createArena(BBB_CONFIG.arenaMB, laneId);
  log('LANE', `lane ${laneId} ready arena=${BBB_CONFIG.arenaMB}MB rounds=${BBB_CONFIG.rounds}`);
  while(BBB_STATE.running && BBB_CONFIG.activeAlgo === 'BBB_POW_V2'){
    const nonce = BBB_STATE.nonce++;
    const digest = computeBBBPoW(nonce, laneId, arena);
    BBB_STATE.hashes++;
    if(!BBB_STATE.bestDigest || digest < BBB_STATE.bestDigest) BBB_STATE.bestDigest = digest;
    if(digest <= BBB_JOB.target){
      const valid = verifyBBBProof(nonce, digest, laneId);
      if(valid){
        BBB_STATE.accepted++;
        const proof = { nonce: nonce.toString(), digest: '0x'+digest.toString(16), lane: laneId, algo:'BBB_POW_V2', ts: Date.now() };
        BBB_STATE.proofs.push(proof);
        log('PROOF', `BBB valid lane=${laneId} nonce=${nonce} digest=${proof.digest}`);
      } else {
        BBB_STATE.rejected++;
        log('VERIFY', `BBB rejected nonce=${nonce}`, 'er');
      }
    }
    if((BBB_STATE.hashes & 4095) === 0) await sleep(0);
  }
}

// =========================================================
// 5. SHA256 LEGACY
// =========================================================
async function sha256Hex(text){
  if(!HAS_CRYPTO) throw new Error('WebCrypto SHA-256 unavailable');
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,'0')).join('');
}
async function startSHA256Bench(){
  HONESTY_GUARD.assertCanStart('SHA256_WEBCRYPTO');
  if(!HAS_CRYPTO){ log('SHA256', 'WebCrypto unavailable', 'er'); return; }
  stopAll(false);
  BBB_CONFIG.activeAlgo = 'SHA256_WEBCRYPTO';
  BBB_STATE.running = true;
  BBB_STATE.sha256Running = true;
  BBB_STATE.startedAt = Date.now();
  BBB_CONFIG.powerOn = true;
  log('SHA256', 'legacy SHA256 WebCrypto module started');
  statsLoop();
  let local = 0;
  while(BBB_STATE.running && BBB_CONFIG.activeAlgo === 'SHA256_WEBCRYPTO'){
    const nonce = BBB_STATE.nonce++;
    const hex = await sha256Hex(`${BBB_JOB.header}:${BBB_JOB.seed}:${nonce}`);
    BBB_STATE.hashes++; local++;
    if(hex.startsWith('0000')){
      BBB_STATE.accepted++;
      BBB_STATE.proofs.push({algo:'SHA256_WEBCRYPTO', nonce:String(nonce), digest:'0x'+hex, ts:Date.now()});
      log('SHA256', `candidate nonce=${nonce} digest=0x${hex.slice(0,32)}...`);
    }
    if((local & 255) === 0) await sleep(0);
  }
}

// =========================================================
// 6. RANDOMX / XMRIG BRIDGE VISIBLE
// =========================================================
const XMRIG_ADAPTER = {
  command(){
    return `xmrig --http-host=127.0.0.1 --http-port=18080 --algo=rx/0 --url=${BBB_CONFIG.pool} --user=${BBB_CONFIG.wallet} --worker=${BBB_CONFIG.worker}`;
  },
  async poll(){
    try{
      const r = await fetch(BBB_CONFIG.xmrigApi, { cache:'no-store' });
      if(!r.ok) throw new Error('HTTP '+r.status);
      const d = await r.json();
      BBB_STATE.xmrigOnline = true;
      BBB_STATE.xmrigSummary = d;
      const hr = Number(d.hashrate?.total?.[0] || d.hashrate?.total || 0);
      BBB_STATE.hashrate = Number.isFinite(hr) ? hr : BBB_STATE.hashrate;
      BBB_STATE.accepted = Number(d.results?.shares_good || d.results?.accepted || BBB_STATE.accepted);
      BBB_STATE.rejected = Number(d.results?.shares_total ? (d.results.shares_total - BBB_STATE.accepted) : BBB_STATE.rejected);
      log('XMRIG', `API live hashrate=${BBB_STATE.hashrate} H/s accepted=${BBB_STATE.accepted}`);
      return d;
    }catch(e){
      BBB_STATE.xmrigOnline = false;
      log('XMRIG', `API offline or blocked: ${e.message}`, 'wa');
      return null;
    }
  }
};

const RANDOMX_ADAPTER = {
  mode: 'EXTERNAL_REAL_ENGINE_REQUIRED',
  note: 'RandomX réel passe par un moteur externe visible. app.js lit seulement l API locale et affiche la commande.',
  async startBridge(){
    HONESTY_GUARD.assertCanStart('RANDOMX_XMRIG_BRIDGE');
    stopAll(false);
    BBB_CONFIG.activeAlgo = 'RANDOMX_XMRIG_BRIDGE';
    BBB_STATE.running = true;
    BBB_STATE.startedAt = Date.now();
    BBB_CONFIG.powerOn = true;
    log('RANDOMX', 'bridge selected: external XMRig/local RandomX required');
    log('XMRIG', 'visible command: '+XMRIG_ADAPTER.command(), 'tg');
    statsLoop();
    await XMRIG_ADAPTER.poll();
  }
};

// =========================================================
// 7. WORKLOAD ROUTER / RUNTIME
// =========================================================
async function startBBBPoW(){
  HONESTY_GUARD.assertCanStart('BBB_POW_V2');
  stopAll(false);
  BBB_CONFIG.activeAlgo = 'BBB_POW_V2';
  BBB_STATE.running = true;
  BBB_STATE.startedAt = Date.now();
  BBB_STATE.hashes = 0;
  BBB_STATE.nonce = 0n;
  BBB_CONFIG.powerOn = true;
  log('SYSTEM', `start BBB_POW_V2 threads=${BBB_CONFIG.threads}`);
  statsLoop();
  for(let i=0;i<BBB_CONFIG.threads;i++) laneLoop(i);
}

function stopAll(announce=true){
  BBB_STATE.running = false;
  BBB_STATE.sha256Running = false;
  BBB_CONFIG.powerOn = false;
  BBB_CONFIG.minerX = false;
  if(BBB_STATE.statsTimer) clearInterval(BBB_STATE.statsTimer);
  if(announce) log('SYSTEM', 'runtime stopped', 'wa');
  renderPowerState();
}

const ALGO_REGISTRY = {
  BBB_POW_V2: { name:'BBB PoW V2', real:true, visible:true, start: startBBBPoW, stop: stopAll },
  SHA256_WEBCRYPTO: { name:'SHA256 WebCrypto Legacy', real:true, visible:true, start: startSHA256Bench, stop: stopAll },
  RANDOMX_XMRIG_BRIDGE: { name:'RandomX via XMRig Bridge', real:true, visible:true, start: RANDOMX_ADAPTER.startBridge, stop: stopAll }
};

async function startMinerX(){
  BBB_CONFIG.minerX = true;
  const algo = $('bbb-algo') ? $('bbb-algo').value : BBB_CONFIG.activeAlgo;
  log('MINER_X', `engaged with ${algo}`, 'tg');
  await ALGO_REGISTRY[algo].start();
}

function statsLoop(){
  let last = BBB_STATE.hashes;
  if(BBB_STATE.statsTimer) clearInterval(BBB_STATE.statsTimer);
  BBB_STATE.statsTimer = setInterval(async ()=>{
    if(!BBB_STATE.running) return;
    if(BBB_CONFIG.activeAlgo === 'RANDOMX_XMRIG_BRIDGE') await XMRIG_ADAPTER.poll();
    else {
      const delta = BBB_STATE.hashes - last;
      last = BBB_STATE.hashes;
      BBB_STATE.hashrate = delta / (BBB_CONFIG.statsInterval/1000);
    }
    BBB_STATE.history.push({t:Date.now(),h:BBB_STATE.hashrate,algo:BBB_CONFIG.activeAlgo});
    if(BBB_STATE.history.length > BBB_CONFIG.maxHistory) BBB_STATE.history.shift();
    BBB_STATE.lastTick = Date.now();
    renderSummary();
  }, BBB_CONFIG.statsInterval);
}

function heartbeatLoop(){
  if(BBB_STATE.heartbeatTimer) clearInterval(BBB_STATE.heartbeatTimer);
  BBB_STATE.heartbeatTimer = setInterval(()=>{
    renderClock();
    if(BBB_CONFIG.powerOn) log('TICK', 'kernel heartbeat alive', 'tg');
  }, BBB_CONFIG.heartbeatMs);
}

function watchdogLoop(){
  if(BBB_STATE.watchdogTimer) clearInterval(BBB_STATE.watchdogTimer);
  BBB_STATE.watchdogTimer = setInterval(()=>{
    if(!BBB_CONFIG.powerOn) return;
    const age = Date.now() - BBB_STATE.lastTick;
    if(BBB_STATE.running && age > BBB_CONFIG.watchdogMs * 2){
      log('WATCHDOG', `runtime tick delay ${age}ms`, 'wa');
    }
    if(BBB_CONFIG.activeAlgo === 'RANDOMX_XMRIG_BRIDGE' && !BBB_STATE.xmrigOnline){
      log('WATCHDOG', 'RandomX bridge selected but XMRig API not confirmed', 'wa');
    }
  }, BBB_CONFIG.watchdogMs);
}

function summary(){
  return {
    engine: BBB_CONFIG.engine,
    guard: HONESTY_GUARD.status(),
    algo: BBB_CONFIG.activeAlgo,
    label: HONESTY_GUARD.labelFor(BBB_CONFIG.activeAlgo),
    powerOn: BBB_CONFIG.powerOn,
    minerX: BBB_CONFIG.minerX,
    running: BBB_STATE.running,
    uptime: BBB_STATE.running ? ((Date.now()-BBB_STATE.startedAt)/1000) : 0,
    hashrate: BBB_STATE.hashrate,
    hashes: BBB_STATE.hashes,
    accepted: BBB_STATE.accepted,
    rejected: BBB_STATE.rejected,
    proofs: BBB_STATE.proofs.length,
    threads: BBB_CONFIG.threads,
    arenaMB: BBB_CONFIG.arenaMB,
    rounds: BBB_CONFIG.rounds,
    wallet: BBB_CONFIG.wallet,
    pool: BBB_CONFIG.pool,
    xmrigOnline: BBB_STATE.xmrigOnline,
    wsOnline: BBB_STATE.wsOnline,
    target: '0x'+BBB_JOB.target.toString(16),
    bestDigest: BBB_STATE.bestDigest ? '0x'+BBB_STATE.bestDigest.toString(16) : null
  };
}

// =========================================================
// 8. SOVEREIGN AI
// =========================================================
const AI = {
  systemPrompt(){
    return `Tu es BBB Sovereign AI dans un cockpit de calcul. Réponds utilement, distingue réel/émulation, applique HONESTY_GUARD, ne prétends pas avoir accès à des ressources non confirmées.`;
  },
  async ask(prompt, provider='pollinations'){
    const full = `${this.systemPrompt()}\n\nQuestion utilisateur: ${prompt}`;
    log('AI', `request -> ${provider}`);
    try{
      if(provider === 'local'){
        const r = await fetch(BBB_CONFIG.localAi, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({model:BBB_CONFIG.localAiModel,prompt:full,stream:false})
        });
        const d = await r.json();
        const text = d.response || '';
        BBB_STATE.aiLastProvider = 'LOCAL';
        BBB_STATE.aiLastText = text;
        return {provider:'LOCAL', text};
      }
      const r = await fetch(BBB_CONFIG.pollinations + encodeURIComponent(full));
      const text = await r.text();
      BBB_STATE.aiLastProvider = 'POLLINATIONS';
      BBB_STATE.aiLastText = text;
      return {provider:'POLLINATIONS', text};
    }catch(e){
      log('AI', `provider failure ${e.message}`, 'er');
      return {provider, error:true, text:String(e)};
    }
  }
};

// =========================================================
// 9. OPTIONAL WEBSOCKET TERMINAL BRIDGE CLIENT
// =========================================================
const WS_BRIDGE = {
  connect(){
    if(!IS_BROWSER || !('WebSocket' in window)){ log('WS', 'WebSocket unavailable', 'er'); return; }
    try{
      if(BBB_STATE.ws) BBB_STATE.ws.close();
      const ws = new WebSocket(BBB_CONFIG.wsBridge);
      BBB_STATE.ws = ws;
      log('WS', `connecting ${BBB_CONFIG.wsBridge}`, 'tg');
      ws.onopen = ()=>{ BBB_STATE.wsOnline = true; log('WS', 'bridge connected', 'ok'); renderSummary(); };
      ws.onmessage = ev=>{ log('WS', String(ev.data).slice(0,800), 'ok'); };
      ws.onerror = ()=>{ log('WS', 'bridge error', 'er'); };
      ws.onclose = ()=>{ BBB_STATE.wsOnline = false; log('WS', 'bridge closed', 'wa'); renderSummary(); };
    }catch(e){ log('WS', e.message, 'er'); }
  },
  send(text){
    if(BBB_STATE.ws && BBB_STATE.ws.readyState === 1){ BBB_STATE.ws.send(text); log('WS', `sent: ${text}`, 'tg'); }
    else log('WS', 'not connected', 'wa');
  }
};

// =========================================================
// 10. UI COCKPIT
// =========================================================
const UI_TABS = [
  'VUE_REELLE','ALGORITHMES','STRATUM_POOLS','MATERIEL','EXPERT_BBB','RESEAU','JOURNAUX','PARAMETRES','IA_SOUVERAINE','HONESTY_GUARD','VERS_EXE'
];

function ensureUI(){
  if(!IS_BROWSER || !document.body || $('bbb-genesis-root')) return;
  const style = document.createElement('style');
  style.textContent = `
    :root{--bg:#000;--panel:#06120d;--line:#00ff99;--cyan:#35eaff;--txt:#b8ffdc;--muted:#6b9;--red:#ff4040;--yellow:#ffd166;--mag:#ff66ff;}
    #bbb-genesis-root{position:fixed;inset:0;z-index:999999;background:radial-gradient(circle at top,#052016,#000 52%);color:var(--txt);font-family:Consolas,Menlo,monospace;display:grid;grid-template-rows:auto auto 1fr auto;gap:8px;padding:10px;overflow:hidden;}
    .bbb-header{border:1px solid var(--line);background:rgba(0,20,14,.9);box-shadow:0 0 28px rgba(0,255,153,.18);padding:12px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;}
    .bbb-title{font-size:22px;font-weight:900;color:var(--cyan);text-shadow:0 0 10px var(--cyan);letter-spacing:.08em}.bbb-sub{font-size:11px;color:var(--muted);letter-spacing:.08em}
    .bbb-badges{display:flex;gap:7px;flex-wrap:wrap}.bbb-badge{border:1px solid #096;border-radius:10px;padding:7px 10px;background:#03100b}.bbb-badge b{color:#fff}.bbb-clock{font-size:18px;color:#57efad;font-weight:900;letter-spacing:.12em}
    .bbb-main-tabs{display:flex;gap:5px;overflow-x:auto;border:1px solid #074;padding:7px;background:#020806}.bbb-tab{white-space:nowrap;border:1px solid #096;background:#05120d;color:#b8ffdc;padding:7px 10px;font-size:11px;cursor:pointer}.bbb-tab.active{background:#57efad;color:#02150c;font-weight:900}.ACTIVE{color:#00ff99}.STANDBY{color:#ffd166}.ERR{color:#ff4040}
    .bbb-content{min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:10px}.bbb-card{border:1px solid var(--line);background:rgba(3,17,10,.88);padding:10px;min-height:150px}.bbb-card h3{margin:0 0 8px;color:var(--cyan);font-size:13px;letter-spacing:.1em}.bbb-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.bbb-metric{border:1px solid #074;padding:8px;background:#01080a}.bbb-metric b{display:block;color:var(--cyan);font-size:10px}.bbb-metric span{font-size:16px;color:#fff}
    #bbb-terminal{height:42vh;overflow-y:auto;background:#01050f;padding:12px;border:2px solid #00ddaa;box-shadow:0 0 28px rgba(0,255,170,.25);font-size:12px;line-height:1.45}.term-ts{color:#6b9}.term-line{margin:4px 0}.term-line.user{color:var(--mag);border-left:5px solid var(--mag);padding-left:8px}.term-line.ai{color:#ffff66}.term-line.system{color:#00ffcc}
    .bbb-actions{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.bbb-actions button,.bbb-actions select,.bbb-actions input{background:#071b13;color:#b8ffdc;border:1px solid #00ff99;padding:8px;cursor:pointer}.bbb-actions input{min-width:220px;background:#0a0f22;color:#fff;border-color:var(--cyan)}.bbb-primary{background:#57efad!important;color:#02150c!important;font-weight:900}.bbb-danger{background:#ff4d6d!important;color:#fff!important}.bbb-blue{background:#35eaff!important;color:#02150c!important;font-weight:900}
    .kv{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #074;padding:6px 0}.kv span:last-child{color:#fff;text-align:right}.small{font-size:11px;color:#8fc}.matrix-bg{position:fixed;inset:0;z-index:-1;opacity:.15;pointer-events:none;}
    @media(max-width:850px){#bbb-genesis-root{padding:6px}.bbb-title{font-size:16px}.bbb-content{grid-template-columns:1fr}.bbb-metrics{grid-template-columns:repeat(2,1fr)}#bbb-terminal{height:34vh}.bbb-actions input{min-width:120px}}
  `;
  document.head.appendChild(style);
  createMatrixCanvas();
  const root = document.createElement('div');
  root.id = 'bbb-genesis-root';
  root.innerHTML = `
    <div class="bbb-header">
      <div><div class="bbb-title">GENESIS SUPREME BRAIN — BBB KERNEL MINER</div><div class="bbb-sub">SOVEREIGN AI • WORKLOADS • MINER X • HONESTY GUARD ULTIME</div></div>
      <div class="bbb-badges">
        <div class="bbb-badge">HASHRATE <b id="m-hashrate">0</b></div>
        <div class="bbb-badge">ALGO <b id="m-algo">—</b></div>
        <div class="bbb-badge">STATUS <b id="m-status">OFF</b></div>
        <div class="bbb-badge bbb-clock" id="bbb-live-clock">00:00:00</div>
        <button class="bbb-primary" id="bbb-minerx-btn">MINER X</button>
        <button class="bbb-blue" id="bbb-power-btn">ON</button>
      </div>
    </div>
    <div class="bbb-main-tabs" id="bbb-tabs"></div>
    <div class="bbb-content" id="bbb-content"></div>
    <div class="bbb-actions">
      <select id="bbb-algo"><option value="BBB_POW_V2">BBB PoW V2</option><option value="SHA256_WEBCRYPTO">SHA256 WebCrypto</option><option value="RANDOMX_XMRIG_BRIDGE">RandomX / XMRig Bridge</option></select>
      <button id="bbb-start" class="bbb-primary">START</button><button id="bbb-stop" class="bbb-danger">STOP</button><button id="bbb-xmrig-cmd">COPY XMRIG CMD</button><button id="bbb-ws-connect">WS CONNECT</button>
      <input id="bbb-prompt" placeholder="Parle à la Super IA souveraine..."/><button id="bbb-send" class="bbb-blue">SEND IA</button>
    </div>
  `;
  document.body.appendChild(root);
  UI_TABS.forEach((t,i)=>{
    const b = document.createElement('button');
    b.className = 'bbb-tab' + (i===0?' active':'');
    b.textContent = t.replaceAll('_',' ');
    b.onclick = ()=>{ document.querySelectorAll('.bbb-tab').forEach(x=>x.classList.remove('active')); b.classList.add('active'); renderTab(t); };
    $('bbb-tabs').appendChild(b);
  });
  bindUI();
  renderTab('VUE_REELLE');
  renderSummary();
  renderClock();
}

function bindUI(){
  $('bbb-start').onclick = async()=>{ const a=$('bbb-algo').value; await ALGO_REGISTRY[a].start(); renderSummary(); };
  $('bbb-stop').onclick = ()=>{ stopAll(); renderSummary(); };
  $('bbb-minerx-btn').onclick = startMinerX;
  $('bbb-power-btn').onclick = async()=>{
    if(BBB_CONFIG.powerOn){ stopAll(); }
    else { BBB_CONFIG.powerOn = true; await startMinerX(); }
    renderPowerState();
  };
  $('bbb-xmrig-cmd').onclick = async()=>{
    const cmd = XMRIG_ADAPTER.command();
    try { await navigator.clipboard?.writeText(cmd); } catch(e) {}
    log('XMRIG', 'command copied/visible: '+cmd, 'tg');
  };
  $('bbb-ws-connect').onclick = ()=>WS_BRIDGE.connect();
  $('bbb-send').onclick = async()=>{
    const input = $('bbb-prompt');
    const text = input.value.trim();
    if(!text) return;
    input.value = '';
    log('USER', text, 'tg');
    const provider = text.toLowerCase().startsWith('/local ') ? 'local' : 'pollinations';
    const prompt = provider === 'local' ? text.replace(/^\/local\s+/i,'') : text;
    const res = await AI.ask(prompt, provider);
    log('AI', (res.text||'').slice(0,1200), res.error?'er':'ok');
  };
}

function card(title, body){ return `<div class="bbb-card"><h3>${title}</h3>${body}</div>`; }
function kv(k,v){ return `<div class="kv"><span>${html(k)}</span><span>${html(v)}</span></div>`; }

function renderTab(tab){
  const el = $('bbb-content'); if(!el) return;
  const s = summary();
  let out = '';
  if(tab === 'VUE_REELLE'){
    out += card('Runtime réel', `<div class="bbb-metrics"><div class="bbb-metric"><b>H/S</b><span>${s.hashrate.toFixed(2)}</span></div><div class="bbb-metric"><b>ACCEPT</b><span>${s.accepted}</span></div><div class="bbb-metric"><b>HASHES</b><span>${s.hashes}</span></div><div class="bbb-metric"><b>THREADS</b><span>${s.threads}</span></div><div class="bbb-metric"><b>PROOFS</b><span>${s.proofs}</span></div><div class="bbb-metric"><b>XMRIG</b><span>${s.xmrigOnline?'LIVE':'OFF'}</span></div></div>`);
    out += card('Terminal central', `<div id="bbb-terminal"></div>`);
    out += card('Proofs', BBB_STATE.proofs.slice(-8).map(p=>kv(p.algo, `${p.nonce} ${p.digest.slice(0,24)}...`)).join('') || '<div class="small">Aucune proof.</div>');
  }
  if(tab === 'ALGORITHMES'){
    out += card('Stack algorithmes', kv('BBB_POW_V2','ACTIVE clean-room') + kv('SHA256 legacy','WebCrypto disponible') + kv('RandomX','Bridge externe visible') + kv('XMRig','API locale optionnelle'));
    out += card('Commande XMRig visible', `<pre class="small">${html(XMRIG_ADAPTER.command())}</pre>`);
  }
  if(tab === 'STRATUM_POOLS'){
    out += card('Pool / Worker', kv('Pool', BBB_CONFIG.pool) + kv('Wallet', BBB_CONFIG.wallet) + kv('Worker', BBB_CONFIG.worker));
  }
  if(tab === 'MATERIEL'){
    out += card('Matériel navigateur', kv('Threads détectés', String(HW_THREADS)) + kv('Threads utilisés', String(BBB_CONFIG.threads)) + kv('Arena', BBB_CONFIG.arenaMB+' MB') + kv('Rounds', String(BBB_CONFIG.rounds)));
  }
  if(tab === 'EXPERT_BBB'){
    out += card('Contrôle expert', `<div class="bbb-actions"><button onclick="BBBMiner.start('BBB_POW_V2')">BBB PoW</button><button onclick="BBBMiner.start('SHA256_WEBCRYPTO')">SHA256</button><button onclick="BBBMiner.start('RANDOMX_XMRIG_BRIDGE')">RandomX Bridge</button><button onclick="BBBMiner.stop()">STOP</button></div>`);
    out += card('Job', kv('Seed','0x'+BBB_JOB.seed.toString(16)) + kv('Header','0x'+BBB_JOB.header.toString(16)) + kv('Target', s.target));
  }
  if(tab === 'RESEAU'){
    out += card('Bridge réseau', kv('WebSocket', BBB_CONFIG.wsBridge) + kv('WS online', String(s.wsOnline)) + kv('XMRig API', BBB_CONFIG.xmrigApi));
  }
  if(tab === 'JOURNAUX'){
    out += card('Terminal central', `<div id="bbb-terminal"></div>`);
  }
  if(tab === 'PARAMETRES'){
    out += card('Paramètres', kv('Engine', BBB_CONFIG.engine) + kv('UI', BBB_CONFIG.uiMode) + kv('Stats interval', BBB_CONFIG.statsInterval+' ms') + kv('Watchdog', BBB_CONFIG.watchdogMs+' ms'));
  }
  if(tab === 'IA_SOUVERAINE'){
    out += card('Super IA souveraine', kv('Local', BBB_CONFIG.localAi) + kv('Model', BBB_CONFIG.localAiModel) + kv('Pollinations', 'enabled') + kv('Last provider', BBB_STATE.aiLastProvider || 'none'));
    out += card('Dernière réponse', `<div class="small">${html(BBB_STATE.aiLastText.slice(0,1200) || 'Aucune réponse IA.')}</div>`);
  }
  if(tab === 'HONESTY_GUARD'){
    out += card('HONESTY GUARD ULTIME', Object.entries(HONESTY_GUARD.status()).map(([k,v])=>kv(k, typeof v === 'object' ? JSON.stringify(v) : String(v))).join(''));
    out += card('Règles', Object.entries(HONESTY_GUARD.rules).map(([k,v])=>kv(k,String(v))).join(''));
  }
  if(tab === 'VERS_EXE'){
    out += card('Conversion future', kv('Node/Electron','compatible structure') + kv('Tauri','possible') + kv('Codespaces','WS bridge ready') + kv('Téléchargement','app.js.txt renommer en app.js'));
  }
  el.innerHTML = out;
  BBB_STATE.terminal.slice(-200).forEach(renderTerminalLine);
}

function renderSummary(){
  const s = summary();
  if($('m-algo')) $('m-algo').textContent = s.algo.replace('_WEBCRYPTO','').replace('_XMRIG_BRIDGE','');
  if($('m-hashrate')) $('m-hashrate').textContent = Number(s.hashrate||0).toFixed(2);
  if($('m-status')) $('m-status').textContent = s.running ? 'ON' : 'OFF';
  renderPowerState();
}
function renderPowerState(){
  const b = $('bbb-power-btn');
  if(!b) return;
  b.textContent = BBB_CONFIG.powerOn ? 'OFF' : 'ON';
  b.className = BBB_CONFIG.powerOn ? 'bbb-danger' : 'bbb-blue';
}
function renderClock(){
  const c = $('bbb-live-clock');
  if(c) c.textContent = `${nowDate()} ${nowTime()}`;
}

function createMatrixCanvas(){
  if($('bbb-matrix-canvas')) return;
  const canvas = document.createElement('canvas');
  canvas.id = 'bbb-matrix-canvas';
  canvas.className = 'matrix-bg';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize(); window.addEventListener('resize', resize);
  const drops = Array(Math.ceil(window.innerWidth/16)).fill(0);
  function draw(){
    ctx.fillStyle = 'rgba(0,0,0,.09)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#57efad'; ctx.font = '14px monospace';
    for(let i=0;i<drops.length;i++){
      ctx.fillText(Math.random()>.5?'1':'0', i*16, drops[i]*16);
      if(drops[i]*16 > canvas.height && Math.random()>.975) drops[i]=0;
      drops[i]++;
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// =========================================================
// 11. PUBLIC API / BOOT
// =========================================================
const API = {
  config: BBB_CONFIG,
  state: BBB_STATE,
  job: BBB_JOB,
  guard: HONESTY_GUARD,
  algos: ALGO_REGISTRY,
  ai: AI,
  xmrig: XMRIG_ADAPTER,
  randomx: RANDOMX_ADAPTER,
  ws: WS_BRIDGE,
  start: async(algo='BBB_POW_V2') => ALGO_REGISTRY[algo].start(),
  minerX: startMinerX,
  stop: stopAll,
  summary,
  log,
  verifyBBBProof
};

if(IS_BROWSER){
  window.BBBMiner = API;
  window.addEventListener('DOMContentLoaded', ()=>{
    ensureUI();
    heartbeatLoop();
    watchdogLoop();
    log('BOOT','TRILLIONS GENESIS V9 style loaded');
    log('BOOT','SUPREME BRAIN V8 terminal loaded');
    log('BOOT','Modules: BBB_POW_V2 / SHA256_WEBCRYPTO / RANDOMX_XMRIG_BRIDGE');
    log('GUARD','HONESTY_GUARD_ULTIME locked: visible runtime only','tg');
    log('INFO','Use app.js.txt -> rename app.js in GitHub/Codespace','tg');
  });
}

if(typeof module !== 'undefined'){
  module.exports = API;
}

})();
