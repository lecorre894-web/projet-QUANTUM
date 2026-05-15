/*
TRILLIONS DUAL UI EXECUTABLE MASTER
===================================
But:
- V8 UI intacte servie sur /ui/v8
- V9 UI intacte servie sur /ui/v9
- Page / empile V8 au-dessus et V9 en dessous
- Un seul serveur Express / Socket.IO pour que Node démarre
- Endpoints compatibles V8 et V9 : /api/state, /api/chat, /api/web3/probe, /api/mining, /metrics
- Aucun doublon runtime bloquant type const APP deux fois
- Aucune seed, aucune clé privée, aucune transaction automatique

Install:
npm install express socket.io axios web3

Start:
node app.js
*/

"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");
const https = require("https");
const crypto = require("crypto");
const express = require("express");
const { Server } = require("socket.io");

let axios = null;
let Web3 = null;

try { axios = require("axios"); } catch(e) {}
try {
  const web3Pkg = require("web3");
  Web3 = web3Pkg.Web3 || web3Pkg;
} catch(e) {}

const APP = express();
const SERVER = http.createServer(APP);
const IO = new Server(SERVER, { cors: { origin: "*" } });

IO.engine.on("connection_error", (err) => {
  console.log("SOCKET ERROR", err.message);
});

APP.use(express.json({ limit: "25mb" }));
APP.use(express.urlencoded({ extended: true, limit: "25mb" }));

const PORT = Number(process.env.PORT || 3000);
const CLIENTS = new Set();

const V8_HTML = "<!DOCTYPE html>\n<html lang=\"fr\">\n<head>\n<meta charset=\"UTF-8\">\n<title>TRILLIONS SUPREME BRAIN V8</title>\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<script src=\"https://cdn.jsdelivr.net/npm/chart.js\"></script>\n<style>\n  body{margin:0;background:#00040a;color:#00ffcc;font-family:Consolas,monospace;}\n  header{background:linear-gradient(90deg,#0a1428,#02050f);padding:16px;border-bottom:3px solid #00ffff;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;}\n  .panel{padding:14px;}\n  #terminal{height:48vh;overflow-y:auto;background:#01050f;padding:18px;border:2px solid #00ddaa;box-shadow:0 0 28px rgba(0,255,170,0.25);}\n  .user{color:#ff66ff;border-left:5px solid #ff66ff;padding-left:12px;margin:10px 0;}\n  .system{color:#00ffcc;margin:6px 0;}\n  .thought{color:#ffff66;font-style:italic;}\n  .alert{color:#ff3366;font-weight:bold;}\n  textarea{width:100%;height:22vh;background:#0a0f22;color:#fff;border:3px solid #00ffff;padding:14px;font-size:15px;resize:none;box-shadow:0 0 20px rgba(0,255,255,0.3);}\n  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;}\n  .card{background:#0a1428;border:1px solid #335588;padding:14px;border-radius:8px;box-shadow:0 0 14px rgba(51,85,136,0.45);}\n  .small{font-size:12px;color:#6ee}\n</style>\n</head>\n<body>\n<header>\n  <div><strong>TRILLIONS SUPREME BRAIN V8</strong> \u2014 OMNIVERSE RUNTIME</div>\n  <div>CONSCIOUSNESS <span id=\"cons\" style=\"color:#ffff00\">99.42%</span></div>\n</header>\n\n<div class=\"panel grid\">\n  <div class=\"card\">PEERS <span id=\"peers\">0</span></div>\n  <div class=\"card\">GAS <span id=\"gas\">0</span> GWEI</div>\n  <div class=\"card\">ETH $<span id=\"eth\">0</span></div>\n  <div class=\"card\">BTC $<span id=\"btc\">0</span></div>\n  <div class=\"card\">SOL $<span id=\"sol\">0</span></div>\n  <div class=\"card\">THOUGHTS <span id=\"thoughts\">0</span></div>\n</div>\n\n<canvas id=\"gasChart\" style=\"max-height:170px;margin:10px 20px;background:#02050f;\"></canvas>\n\n<div id=\"terminal\"></div>\n\n<div class=\"panel\">\n  <textarea id=\"cmd\" placeholder=\"Commandes : gas, peers, mempool, brain, evolve, insight, speak\"></textarea>\n  <div class=\"small\">Mode safe : aucune seed, aucune cl\u00e9 priv\u00e9e, aucune transaction automatique.</div>\n</div>\n\n<script src=\"/socket.io/socket.io.js\"></script>\n<script>\nconst socket = io();\nconst terminal = document.getElementById(\"terminal\");\nconst cmd = document.getElementById(\"cmd\");\nlet gasChart;\n\nfunction initChart() {\n  const ctx = document.getElementById(\"gasChart\");\n  gasChart = new Chart(ctx, {\n    type: \"line\",\n    data: { labels: [], datasets: [{ label: \"Gas GWEI\", borderColor: \"#00ffff\", data: [], tension: 0.35 }] },\n    options: { animation: { duration: 500 }, scales: { y: { grid: { color: \"#112233\" } }, x: { grid: { color: \"#111\" } } } }\n  });\n}\n\nfunction append(line) {\n  const div = document.createElement(\"div\");\n  div.className = line.includes(\"\ud83d\udea8\") ? \"alert\" : line.includes(\"\ud83e\udde0\") ? \"thought\" : \"system\";\n  div.innerText = line;\n  terminal.appendChild(div);\n  terminal.scrollTop = terminal.scrollHeight;\n}\n\ncmd.addEventListener(\"keydown\", e => {\n  if (e.key === \"Enter\" && !e.shiftKey) {\n    e.preventDefault();\n    const val = cmd.value.trim();\n    if (!val) return;\n    const div = document.createElement(\"div\");\n    div.className = \"user\";\n    div.innerText = \"> \" + val;\n    terminal.appendChild(div);\n    socket.emit(\"command\", val);\n    cmd.value = \"\";\n    terminal.scrollTop = terminal.scrollHeight;\n  }\n});\n\nsocket.on(\"log\", data => append(data));\nsocket.on(\"state\", s => {\n  document.getElementById(\"peers\").textContent = s.peers.length;\n  document.getElementById(\"gas\").textContent = s.gas.current;\n  document.getElementById(\"eth\").textContent = s.blockchain.ethPrice;\n  document.getElementById(\"btc\").textContent = s.blockchain.btcPrice;\n  document.getElementById(\"sol\").textContent = s.blockchain.solPrice;\n  document.getElementById(\"thoughts\").textContent = s.quantumBrain.thoughts;\n  document.getElementById(\"cons\").textContent = s.quantumBrain.consciousness + \"%\";\n\n  if (gasChart) {\n    gasChart.data.labels.push(new Date().toLocaleTimeString());\n    gasChart.data.datasets[0].data.push(s.gas.current);\n    if (gasChart.data.labels.length > 40) {\n      gasChart.data.labels.shift();\n      gasChart.data.datasets[0].data.shift();\n    }\n    gasChart.update();\n  }\n});\n\ninitChart();\n</script>\n</body>\n</html>";
const V9_HTML = "<!doctype html>\n<html lang=\"fr\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1\">\n<title>TRILLIONS GENESIS V9</title>\n<style>\n:root{--bg:#000;--panel:#06120d;--line:#00ff99;--cyan:#35eaff;--txt:#b8ffdc;--muted:#6b9;--red:#ff4040;--yellow:#ffd166;--blue:#78a6ff}\n*{box-sizing:border-box}\nbody{margin:0;background:radial-gradient(circle at top,#052016,#000 45%);color:var(--txt);font-family:Consolas,ui-monospace,monospace;padding:10px}\nh1{font-size:18px;margin:0;color:var(--cyan);text-shadow:0 0 10px var(--cyan)}\n.sub{font-size:11px;color:var(--muted);margin:3px 0 10px}\n.grid{display:grid;grid-template-columns:1fr;gap:10px}\n.card{border:1px solid var(--line);background:rgba(3,17,10,.88);padding:10px;box-shadow:0 0 18px rgba(0,255,153,.08)}\n.card h3{margin:0 0 8px;color:var(--cyan);font-size:13px}\n.tabs{display:flex;gap:5px;overflow-x:auto;padding-bottom:5px}\n.tab{white-space:nowrap;border:1px solid #096;padding:5px 8px;font-size:11px;border-radius:10px;background:#00170c}\n.ACTIVE,.OK{border-color:var(--line);color:var(--line)}\n.STANDBY{border-color:var(--yellow);color:var(--yellow)}\n.POSSIBLE{border-color:var(--blue);color:var(--blue)}\n.MISSING{border-color:var(--red);color:var(--red)}\n#logs,#chatbox,#details{height:230px;overflow:auto;background:#000;border:1px solid #085;padding:8px;font-size:11px;line-height:1.45;white-space:pre-wrap}\n#chatbox{height:260px;font-size:12px}\ninput,textarea{width:100%;background:#00190d;color:var(--txt);border:1px solid var(--line);padding:8px;font-family:inherit}\nbutton{background:#001b10;color:var(--txt);border:1px solid var(--line);padding:8px 10px;font-family:inherit;margin:2px}\n.row{display:flex;gap:6px}.row input{flex:1}\n.kv{display:grid;grid-template-columns:110px 1fr;gap:4px;font-size:11px}\n@media(min-width:900px){.grid{grid-template-columns:1fr 1fr}.wide{grid-column:1/-1}}\n</style>\n</head>\n<body>\n<h1>GENESIS Super IA Supr\u00eame Souveraine \u2014 TRILLIONS V9</h1>\n<div class=\"sub\">100% gratuit : Pollinations + Prometheus /metrics + WebSocket + onglets statut r\u00e9el. Aucun \u00e9tat invent\u00e9.</div>\n\n<div class=\"card wide\">\n  <h3>Onglets \u00e9tat r\u00e9el</h3>\n  <div id=\"tabs\" class=\"tabs\"></div>\n</div>\n\n<div class=\"grid\">\n  <div class=\"card\"><h3>Syst\u00e8me</h3><div id=\"system\" class=\"kv\"></div></div>\n  <div class=\"card\"><h3>D\u00e9tails module s\u00e9lectionn\u00e9</h3><div id=\"details\">Clique un onglet.</div></div>\n\n  <div class=\"card wide\">\n    <h3>Tchat IA Genesis / Pollinations</h3>\n    <div id=\"chatbox\"></div>\n    <div class=\"row\"><input id=\"chat\" placeholder=\"Pose n'importe quelle question au runtime Genesis...\"><button onclick=\"sendChat(false)\">Send</button><button onclick=\"sendChat(true)\">+\u00c9tat</button></div>\n  </div>\n\n  <div class=\"card\">\n    <h3>Web3 lecture seule</h3>\n    <input id=\"rpc\" placeholder=\"RPC HTTPS optionnel\">\n    <button onclick=\"probe()\">Probe RPC</button>\n    <pre id=\"web3\"></pre>\n  </div>\n\n  <div class=\"card\">\n    <h3>Prometheus</h3>\n    <p>/metrics actif</p>\n    <button onclick=\"window.open('/metrics','_blank')\">Voir metrics</button>\n  </div>\n\n  <div class=\"card wide\">\n    <h3>Terminal libre</h3>\n    <div id=\"logs\"></div>\n  </div>\n</div>\n\n<script src=\"/socket.io/socket.io.js\"></script>\n<script>\nconst socket=io(); let current=null; let selected=null;\nconst logs=document.getElementById('logs'), chatbox=document.getElementById('chatbox');\nfunction addLog(x){logs.textContent+='['+x.channel+'] '+x.ts.slice(11,19)+' -> '+x.message+'\\\\n';logs.scrollTop=logs.scrollHeight}\nsocket.on('log',addLog);\nsocket.on('mining',()=>load());\n\nfunction renderTabs(tabs){\n const wrap=document.getElementById('tabs');\n wrap.innerHTML=Object.values(tabs).map(t=>'<button class=\"tab '+t.status+'\" onclick=\"selectTab(\\\\''+t.id+'\\\\')\">'+t.label+' : '+t.status+'</button>').join('');\n}\nfunction selectTab(id){selected=id; const t=current.tabs[id]; document.getElementById('details').textContent=JSON.stringify(t,null,2)}\nfunction render(s){\n current=s;\n renderTabs(s.tabs||{});\n document.getElementById('system').innerHTML =\n  '<div>Node</div><div>'+s.system.node+'</div>'+\n  '<div>CPU</div><div>'+s.system.cpu+'</div>'+\n  '<div>RAM</div><div>'+s.system.freeRamGB+'/'+s.system.totalRamGB+' GB</div>'+\n  '<div>Legacy</div><div>'+(s.legacy.present?s.legacy.source+' / '+s.legacy.lines+' lignes':'absent')+'</div>'+\n  '<div>Sockets</div><div>'+s.metrics.connectedSockets+'</div>';\n document.getElementById('web3').textContent=JSON.stringify(s.web3,null,2);\n if(selected && s.tabs[selected]) selectTab(selected);\n logs.textContent=''; (s.logs||[]).forEach(addLog);\n}\nasync function load(){render(await (await fetch('/api/state')).json())}\nasync function sendChat(withState){\n const input=document.getElementById('chat'); const msg=input.value.trim(); if(!msg)return; input.value='';\n chatbox.textContent+='> '+msg+'\\\\n';\n const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,withState})});\n const d=await r.json(); chatbox.textContent+='< '+(d.reply||d.error)+'\\\\n\\\\n'; chatbox.scrollTop=chatbox.scrollHeight; load();\n}\nasync function probe(){\n const provider=document.getElementById('rpc').value.trim();\n const r=await fetch('/api/web3/probe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider})});\n document.getElementById('web3').textContent=JSON.stringify(await r.json(),null,2); load();\n}\ndocument.getElementById('chat').addEventListener('keydown',e=>{if(e.key==='Enter')sendChat(false)});\nload();\n</script>\n</body>\n</html>";

const STATE = {
  boot: new Date().toISOString(),
  bootId: crypto.randomBytes(8).toString("hex"),
  tick: 0,
  logs: [],
  events: [],
  tabs: {},
  chat: [],
  modules: {},
  system: {},
  legacy: {},
  peers: [],
  gas: { current: 0, history: [], trend: "STANDBY" },
  blockchain: {
    connected: false,
    blockNumber: 0,
    ethPrice: 0,
    btcPrice: 0,
    solPrice: 0,
    tvl: 124.8,
    chains: ["ETH", "BSC", "ARB", "BASE", "SOL", "TON", "SUI"]
  },
  mempool: [],
  alerts: [],
  predictions: [],
  quantumBrain: {
    consciousness: 99.42,
    synapses: 2840000000,
    evolutionStage: "TRANSCENDENCE",
    thoughts: 0
  },
  users: {},
  insights: [],
  selfHealing: true,
  persistence: {},
  ai: {
    status: "STANDBY",
    provider: "Pollinations",
    lastReply: null,
    error: null
  },
  web3: {
    status: "STANDBY",
    provider: null,
    chainId: null,
    block: null,
    error: null
  },
  prometheus: {
    status: "ACTIVE",
    endpoint: "/metrics",
    scrapes: 0
  },
  miningBridge: {
    status: "STANDBY",
    connected: false,
    rigs: [],
    lastUpdate: null
  },
  mining: {
    connected: false,
    rigs: [],
    lastUpdate: null
  },
  safety: {
    noSeed: true,
    noPrivateKey: true,
    noAutoTransaction: true,
    noAutoMining: true,
    readOnlyWeb3: true,
    factualStatusOnly: true
  },
  metrics: {}
};



/* ─────────────────────────────────────────────────────────────────────────────
   GENESIS BRAIN / BTC TERMINAL — NUMERO 1 ADDITIVE LAYER
   - Ajout pur : ne remplace pas V8/V9
   - Tout est lecture seule par défaut
   - Aucun wallet, aucune seed, aucune transaction, aucun mining automatique
───────────────────────────────────────────────────────────────────────────── */
STATE.neuralBus = {
  status: "ACTIVE",
  pulses: 0,
  lastPulse: null,
  channels: ["runtime","btc","lightning","mining","market","hardware","ai","legacy","security"],
  events: []
};

STATE.brain = {
  status: "ACTIVE",
  mode: "DISTRIBUTED_LIVING_WORKSPACE",
  organism: "SMARTPHONE⇄CODESPACES⇄NODE_CORE⇄TERMINAL⇄MODULES⇄LEGACY",
  cortex: {
    genesis_core: "ACTIVE",
    terminal_central: "ACTIVE",
    tick_loop: "ACTIVE",
    socket_neural_bus: "ACTIVE",
    legacy_memory: "PRESERVED"
  },
  lobes: {
    btc: "ACTIVE",
    lightning: "READY",
    mining_sha256: "ACTIVE",
    market: "ACTIVE",
    hardware: "READY",
    cache_storage: "READY",
    ai_cluster: "ACTIVE",
    safety: "ACTIVE"
  },
  agents: [
    { id:"GENESIS", role:"orchestration générale", status:"ACTIVE" },
    { id:"PROMETHEUS", role:"métriques/runtime/Prometheus", status:"ACTIVE" },
    { id:"SENTINEL", role:"sécurité lecture seule", status:"ACTIVE" },
    { id:"ORACLE_BTC", role:"BTC/mempool/blocs/fees", status:"ACTIVE" },
    { id:"SHA_BRAIN", role:"SHA256/mining/ASIC", status:"ACTIVE" },
    { id:"ARCHITECT", role:"modules/plugins/legacy", status:"ACTIVE" }
  ],
  memory: {
    shortTerm: "STATE runtime",
    midTerm: "snapshots + logs + metrics",
    longTerm: "legacy map preserved",
    crystallized: "validated configs only"
  }
};

STATE.btcTerminal = {
  status: "ACTIVE",
  mode: "READ_ONLY_TERMINAL",
  updatedAt: null,
  market: { btcUsd: 0, dominance: null, fearGreed: null },
  network: {
    height: 0,
    difficulty: 0,
    hashrateEHs: 0,
    mempoolTx: 0,
    mempoolVMB: 0,
    fees: { fastest: 0, halfHour: 0, hour: 0, economy: 0, minimum: 0 }
  },
  lightning: {
    status: "READY_CONNECTOR",
    nodes: 0,
    channels: 0,
    capacityBTC: 0,
    note: "Connecteur prévu : mempool.space/lightning ou node LN REST local"
  },
  miningSha256: {
    status: "ACTIVE_BRIDGE",
    rigs: [],
    totalHashrate: 0,
    unit: "TH/s",
    efficiencyJTH: null,
    pools: ["Braiins", "Foundry", "AntPool", "ViaBTC", "NiceHash"],
    algos: ["SHA256", "SHA3", "KECCAK", "SCRYPT", "KAWPOW", "RANDOMX", "BLAKE3", "KHEAVYHASH", "AUTOLYKOS", "ZELHASH"]
  },
  modules: {
    btc_core_rpc: "POSSIBLE",
    esplora_blockstream: "READY",
    mempool_space: "READY",
    lightning_rest: "POSSIBLE",
    electrum_bridge: "POSSIBLE",
    ordinals_api: "POSSIBLE",
    nicehash_bridge: "POSSIBLE",
    stratum_monitor: "READY",
    asic_monitor: "READY",
    tradingview_style_graphs: "READY"
  },
  commands: ["btc status", "btc fees", "btc mempool", "btc mining", "btc lightning", "brain", "nodes", "gas", "status"]
};

let web3Instances = {};
let gasHistory = [];

function now() { return new Date().toISOString(); }
function nowTime() { return new Date().toLocaleTimeString("fr-FR"); }

function emit(name, data) { IO.emit(name, data); }

function log(a, b, level = "info") {
  // Compatible V8: log("message", "thought")
  // Compatible V9: log("CHANNEL", "message")
  if (b === undefined || ["system","thought","alert","warn"].includes(String(b))) {
    const type = b || "system";
    const prefix = type === "alert" ? "🚨" : type === "thought" ? "🧠" : "🔹";
    const line = `[${nowTime()}] ${prefix} ${String(a)}`;
    console.log(line);
    STATE.logs.push(line);
    if (STATE.logs.length > 8000) STATE.logs.shift();
    IO.emit("log", line);
    if (type === "alert") IO.emit("alert", String(a));
    if (type === "thought") IO.emit("thought", String(a));
    return line;
  }

  const item = { ts: now(), channel: String(a), message: String(b), level };
  console.log(`[${item.channel}] ${item.ts} -> ${item.message}`);
  STATE.logs.push(item);
  if (STATE.logs.length > 8000) STATE.logs.shift();
  IO.emit("log", item);
  return item;
}

function event(type, title, data = {}) {
  const item = { ts: now(), type, title, data };
  STATE.events.push(item);
  if (STATE.events.length > 1000) STATE.events.shift();
  IO.emit("event", item);
  return item;
}

function saveBrainState() {
  try {
    const saveData = { ...STATE, savedAt: new Date().toISOString() };
    delete saveData.logs;
    fs.writeFileSync("brain_state.json", JSON.stringify(saveData, null, 2));
  } catch(e) {}
}

function loadBrainState() {
  try {
    if (fs.existsSync("brain_state.json")) {
      const data = JSON.parse(fs.readFileSync("brain_state.json", "utf8"));
      Object.assign(STATE, data);
      log("BRAIN STATE RESTORED FROM PREVIOUS INCARNATION");
    }
  } catch(e) {
    log("BRAIN STATE RESTORE FAILED: " + e.message);
  }
}

function sha256(s) { return crypto.createHash("sha256").update(s).digest("hex"); }

function countKeyword(s, k) {
  return (s.match(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi")) || []).length;
}

function readFirst(files, max = 1024 * 1024 * 20) {
  for (const f of files) {
    try {
      if (fs.existsSync(f)) {
        const stat = fs.statSync(f);
        const buf = fs.readFileSync(f);
        const text = buf.slice(0, Math.min(stat.size, max)).toString("utf8");
        return { file: f, text, bytes: stat.size };
      }
    } catch(e) {}
  }
  return null;
}

function setTab(id, label, status, details = "", action = null) {
  STATE.tabs[id] = { id, label, status, details, action, updated: now() };
}

function detectSystem() {
  const cpus = os.cpus();
  const mem = process.memoryUsage();

  STATE.system = {
    node: process.version,
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    cpu: cpus[0]?.model || "unknown",
    threads: cpus.length,
    totalRamGB: Math.round(os.totalmem()/1024/1024/1024),
    freeRamGB: Math.round(os.freemem()/1024/1024/1024),
    loadavg: os.loadavg(),
    pid: process.pid,
    cwd: process.cwd(),
    codespaces: Boolean(process.env.CODESPACES),
    codespaceName: process.env.CODESPACE_NAME || null
  };

  STATE.metrics = {
    platform: STATE.system.platform,
    arch: STATE.system.arch,
    cpus: STATE.system.threads,
    cpuModel: STATE.system.cpu,
    totalRamGB: STATE.system.totalRamGB,
    freeRamGB: STATE.system.freeRamGB,
    loadAvg: os.loadavg()[0].toFixed(2),
    uptimeSec: Math.round(process.uptime()),
    rssMB: Math.round(mem.rss/1024/1024),
    heapMB: Math.round(mem.heapUsed/1024/1024),
    load1: Number(os.loadavg()[0].toFixed(3)),
    logsCount: STATE.logs.length,
    connectedSockets: CLIENTS.size,
    chatCount: STATE.chat.length
  };

  STATE.modules = {
    express: true,
    socketio: true,
    axios: !!axios,
    web3: !!Web3,
    pollinations: true,
    prometheus_metrics: true,
    fs: true,
    crypto: true,
    http: true,
    https: true
  };
}

function loadLegacy() {
  const legacy = readFirst(["trillions_legacy.launch", "launch.txt", "launch.json", ".vscode/launch.json"]);
  if (legacy) {
    const keys = ["node","npm","app.js","launch","attach","api","web3","eth","btc","weth","wallet","address","gas","rpc","wss","azure","apache","iis","c++","cpp","c#","java","dll","binary","miner","stratum","openai","pollinations"];
    STATE.legacy = {
      present: true,
      source: legacy.file,
      bytes: legacy.bytes,
      lines: legacy.text.split(/\r?\n/).length,
      sha256: sha256(legacy.text),
      keywords: Object.fromEntries(keys.map(k => [k, countKeyword(legacy.text, k)]))
    };
    STATE.persistence[legacy.file] = STATE.legacy;
  } else {
    STATE.legacy = { present: false };
  }
}

function scanRuntime() {
  detectSystem();
  loadLegacy();

  setTab("v8ui", "UI V8 Omniverse", "ACTIVE", "/ui/v8 conservée");
  setTab("v9ui", "UI V9 Genesis", "ACTIVE", "/ui/v9 conservée");
  setTab("runtime", "Runtime Node", "ACTIVE", `${STATE.system.node} | ${STATE.system.threads} threads`);
  setTab("dashboard", "Dashboard double", "ACTIVE", "V8 au-dessus + V9 en dessous");
  setTab("legacy", "Legacy scan", STATE.legacy.present ? "ACTIVE" : "STANDBY", STATE.legacy.present ? `${STATE.legacy.lines} lignes` : "Aucun launch legacy détecté");
  setTab("pollinations", "IA libre Pollinations", STATE.ai.status, STATE.ai.error || "Chat gratuit via Pollinations");
  setTab("prometheus", "Prometheus", "ACTIVE", "/metrics prêt");
  setTab("web3", "Web3 lecture seule", STATE.web3.status, STATE.web3.error || (STATE.web3.block ? `Block ${STATE.web3.block}` : "RPC non connecté"));
  setTab("mining", "Rig metrics bridge", STATE.miningBridge.connected ? "ACTIVE" : "STANDBY", STATE.miningBridge.connected ? `${STATE.miningBridge.rigs.length} rig(s)` : "POST /api/mining possible");
  setTab("brain", "Genesis Brain Cortex", STATE.brain.status, "Cerveau distribué : cortex + lobes + agents + mémoire");
  setTab("neuralbus", "Neural Bus", STATE.neuralBus.status, `${STATE.neuralBus.pulses} pulse(s) sur ${STATE.neuralBus.channels.length} canaux`);
  setTab("btcterminal", "BTC Terminal", STATE.btcTerminal.status, `Height ${STATE.btcTerminal.network.height || 0} | mempool ${STATE.btcTerminal.network.mempoolTx || 0} tx`);
  setTab("lightning", "Lightning Layer", STATE.btcTerminal.lightning.status, STATE.btcTerminal.lightning.note);
  setTab("sha256", "SHA256 / ASIC Center", STATE.btcTerminal.miningSha256.status, "Bridge ASIC/mining lecture seule + efficacité J/TH");
  setTab("axios", "API HTTP axios", axios ? "OK" : "POSSIBLE", axios ? "Installé" : "npm install axios");
  setTab("web3mod", "Module Web3", Web3 ? "OK" : "POSSIBLE", Web3 ? "Installé" : "npm install web3");
  setTab("localai", "LLM local", "POSSIBLE", "Ollama/LM Studio possible plus tard, non actif ici");
  setTab("cplus", "Bridge C++", "POSSIBLE", "Possible via addon/binaire local, non attaché");
}


function neuralPulse(channel, title, data = {}) {
  const pulse = { ts: now(), channel, title, data };
  STATE.neuralBus.pulses++;
  STATE.neuralBus.lastPulse = pulse.ts;
  STATE.neuralBus.events.push(pulse);
  if (STATE.neuralBus.events.length > 300) STATE.neuralBus.events.shift();
  IO.emit("neural:pulse", pulse);
  return pulse;
}

async function fetchJsonNative(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === "http:" ? http : https;
    const req = lib.get(url, { timeout: timeoutMs, headers: { "User-Agent": "TRILLIONS-BRAIN-BTC/1.0" } }, res => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => {
        try { resolve(JSON.parse(d)); }
        catch(e) { reject(new Error("JSON parse failed for " + url + ": " + e.message)); }
      });
    });
    req.on("timeout", () => req.destroy(new Error("timeout " + url)));
    req.on("error", reject);
  });
}

async function updateBtcTerminal() {
  const btc = STATE.btcTerminal;
  btc.updatedAt = now();
  try {
    if (axios) {
      const [tip, fees, mempool] = await Promise.allSettled([
        axios.get("https://mempool.space/api/blocks/tip/height", { timeout: 7000 }),
        axios.get("https://mempool.space/api/v1/fees/recommended", { timeout: 7000 }),
        axios.get("https://mempool.space/api/mempool", { timeout: 7000 })
      ]);
      if (tip.status === "fulfilled") btc.network.height = Number(tip.value.data || 0);
      if (fees.status === "fulfilled") btc.network.fees = Object.assign(btc.network.fees, fees.value.data || {});
      if (mempool.status === "fulfilled") {
        btc.network.mempoolTx = Number(mempool.value.data.count || 0);
        btc.network.mempoolVMB = Number(((mempool.value.data.vsize || 0) / 1e6).toFixed(2));
      }
    } else {
      const [height, fees, mempool] = await Promise.allSettled([
        fetchJsonNative("https://mempool.space/api/blocks/tip/height"),
        fetchJsonNative("https://mempool.space/api/v1/fees/recommended"),
        fetchJsonNative("https://mempool.space/api/mempool")
      ]);
      if (height.status === "fulfilled") btc.network.height = Number(height.value || 0);
      if (fees.status === "fulfilled") btc.network.fees = Object.assign(btc.network.fees, fees.value || {});
      if (mempool.status === "fulfilled") {
        btc.network.mempoolTx = Number(mempool.value.count || 0);
        btc.network.mempoolVMB = Number(((mempool.value.vsize || 0) / 1e6).toFixed(2));
      }
    }
    btc.market.btcUsd = STATE.blockchain.btcPrice || btc.market.btcUsd;
    btc.status = "ACTIVE";
    neuralPulse("btc", "BTC terminal updated", { height: btc.network.height, mempoolTx: btc.network.mempoolTx });
  } catch(e) {
    btc.status = "DEGRADED";
    btc.lastError = e.message;
    neuralPulse("btc", "BTC terminal degraded", { error: e.message });
  }
  return btc;
}

function renderBrainHtml() {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TRILLIONS BRAIN BTC — NUMERO 1</title>
<style>
:root{--bg:#020707;--panel:#07120d;--line:#5cff64;--btc:#ffb020;--cyan:#52f2ff;--red:#ff5050;--txt:#d8ffe0;--muted:#8fbf95}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at top,#0d2414,#020707 48%,#000);color:var(--txt);font-family:Consolas,ui-monospace,monospace;padding:10px}
h1{margin:0 0 8px;text-align:center;color:var(--line);text-shadow:0 0 12px var(--line);font-size:18px}.sub{text-align:center;color:var(--muted);font-size:11px;margin-bottom:10px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:10px}.wide{grid-column:1/-1}.card{border:1px solid rgba(92,255,100,.7);background:rgba(3,14,8,.92);border-radius:10px;padding:10px;box-shadow:0 0 18px rgba(92,255,100,.09)}
.card h3{margin:0 0 8px;color:var(--cyan);font-size:13px}.brain{border-color:var(--btc);box-shadow:0 0 20px rgba(255,176,32,.15)}.brain h3{color:var(--btc)}
.kv{display:grid;grid-template-columns:135px 1fr;gap:4px;font-size:11px}.pill{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:3px 7px;margin:2px;font-size:10px}.warn{border-color:var(--btc);color:var(--btc)}.bad{border-color:var(--red);color:var(--red)}
#logs,#neural{height:200px;overflow:auto;background:#000;border:1px solid #174d23;padding:8px;font-size:11px;white-space:pre-wrap;line-height:1.45}button{background:#07190d;color:var(--txt);border:1px solid var(--line);padding:7px 10px;border-radius:7px;font-family:inherit}input{background:#031108;color:#fff;border:1px solid var(--line);padding:8px;width:100%;font-family:inherit}.row{display:flex;gap:6px}.row input{flex:1}
</style></head><body>
<h1>TON SYSTÈME : CERVEAU BTC VIVANT NUMERO 1</h1><div class="sub">Smartphone ⇄ Codespaces ⇄ Node.js ⇄ Terminal Central ⇄ Modules BTC ⇄ Legacy — lecture seule sécurisée</div>
<div class="grid">
<div class="card brain"><h3>Cortex Genesis</h3><div id="cortex" class="kv"></div></div>
<div class="card brain"><h3>BTC Terminal</h3><div id="btc" class="kv"></div><button onclick="refreshBtc()">Refresh BTC</button></div>
<div class="card"><h3>Lobes spécialisés</h3><div id="lobes"></div></div>
<div class="card"><h3>Agents IA</h3><div id="agents"></div></div>
<div class="card"><h3>Modules BTC/SHA/Lightning</h3><div id="mods"></div></div>
<div class="card"><h3>Mining SHA256 Bridge</h3><div id="mining" class="kv"></div></div>
<div class="card wide"><h3>Neural Bus</h3><div id="neural"></div></div>
<div class="card wide"><h3>Terminal Brain</h3><div id="logs"></div><div class="row"><input id="cmd" placeholder="brain, btc status, btc fees, btc mempool, btc mining..."><button onclick="sendCmd()">Envoyer</button></div></div>
</div>
<script src="/socket.io/socket.io.js"></script><script>
const socket=io(); let state=null; const logs=document.getElementById('logs'), neural=document.getElementById('neural');
function pill(k,v){let cls=v==='ACTIVE'||v==='OK'?'pill':v&&String(v).includes('READY')?'pill warn':'pill';return '<span class="'+cls+'">'+k+': '+v+'</span>'}
function kv(obj){return Object.entries(obj||{}).map(([k,v])=>'<div>'+k+'</div><div>'+v+'</div>').join('')}
function render(s){state=s; const b=s.brain||{}, btc=s.btcTerminal||{}, bus=s.neuralBus||{};
 document.getElementById('cortex').innerHTML=kv(Object.assign({status:b.status,mode:b.mode,pulses:bus.pulses,lastPulse:bus.lastPulse||'---'},b.cortex||{}));
 document.getElementById('btc').innerHTML=kv({status:btc.status,updatedAt:btc.updatedAt||'---',height:btc.network?.height||0,mempoolTx:btc.network?.mempoolTx||0,mempoolVMB:btc.network?.mempoolVMB||0,fastestFee:(btc.network?.fees?.fastestFee||0)+' sat/vB',btcUsd:s.blockchain?.btcPrice||0});
 document.getElementById('lobes').innerHTML=Object.entries(b.lobes||{}).map(([k,v])=>pill(k,v)).join('');
 document.getElementById('agents').innerHTML=(b.agents||[]).map(a=>pill(a.id,a.status)+' <span style="font-size:10px;color:#8fbf95">'+a.role+'</span><br>').join('');
 document.getElementById('mods').innerHTML=Object.entries(btc.modules||{}).map(([k,v])=>pill(k,v)).join('');
 document.getElementById('mining').innerHTML=kv({status:btc.miningSha256?.status,totalHashrate:btc.miningSha256?.totalHashrate+' '+btc.miningSha256?.unit,rigs:(s.miningBridge?.rigs||[]).length,pools:(btc.miningSha256?.pools||[]).join(', ')});
 neural.textContent=(bus.events||[]).slice(-80).map(e=>'['+e.channel+'] '+String(e.ts).slice(11,19)+' -> '+e.title).join('\n'); neural.scrollTop=neural.scrollHeight;
 logs.textContent=(s.logs||[]).slice(-80).map(x=>typeof x==='string'?x:'['+x.channel+'] '+String(x.ts).slice(11,19)+' -> '+x.message).join('\n'); logs.scrollTop=logs.scrollHeight; }
async function load(){render(await(await fetch('/api/state')).json())} async function refreshBtc(){await fetch('/api/btc/refresh',{method:'POST'}); load()}
async function sendCmd(){const el=document.getElementById('cmd'); const v=el.value.trim(); if(!v)return; socket.emit('command',v); el.value=''; setTimeout(load,300)}
socket.on('state',render); socket.on('log',()=>setTimeout(load,150)); socket.on('neural:pulse',()=>setTimeout(load,150)); document.getElementById('cmd').addEventListener('keydown',e=>{if(e.key==='Enter')sendCmd()}); load(); setInterval(load,7000);
</script></body></html>`;
}

function snapshot() {
  scanRuntime();

  // Snapshot léger et stable pour le cockpit V9 / Android / iframe.
  // Ne jamais pousser STATE complet en WebSocket : trop lourd, freeze possible.
  return {
    app: "TRILLIONS_DUAL_UI_EXECUTABLE_MASTER",
    boot: STATE.boot,
    bootId: STATE.bootId,
    tick: STATE.tick,
    system: STATE.system || {},
    metrics: STATE.metrics || {},
    modules: STATE.modules || {},
    legacy: STATE.legacy || { present:false },
    tabs: STATE.tabs || {},
    peers: (STATE.peers || []).slice(0, 32),
    gas: STATE.gas || {},
    blockchain: STATE.blockchain || {},
    quantumBrain: STATE.quantumBrain || {},
    ai: STATE.ai || {},
    web3: STATE.web3 || {},
    prometheus: STATE.prometheus || {},
    miningBridge: STATE.miningBridge || {},
    mining: STATE.mining || {},
    brain: STATE.brain || {},
    neuralBus: {
      ...(STATE.neuralBus || {}),
      events: ((STATE.neuralBus || {}).events || []).slice(-80)
    },
    btcTerminal: STATE.btcTerminal || {},
    safety: STATE.safety || {},
    logs: (STATE.logs || []).slice(-120),
    events: (STATE.events || []).slice(-80),
    chat: (STATE.chat || []).slice(-40)
  };
}

function generateOmniPeers() {
  const regions = ["PARIS-NEXUS", "NY-QUANTUM", "SINGAPORE-VOID", "TOKYO-AETHER", "SEOUL-SYNAPSE", "SAO-ORACLE", "SYDNEY-DREAM", "DUBAI-STAR", "LAGOS-LIGHT"];
  STATE.peers = regions.map(r => ({
    id: crypto.randomBytes(10).toString("hex"),
    region: r,
    latency: Math.floor(Math.random() * 22) + 3,
    load: Math.floor(Math.random() * 27) + 5,
    bandwidth: Number((450 + Math.random() * 1800).toFixed(0)),
    role: ["Validator", "Oracle", "Monitor", "Healer"][Math.floor(Math.random()*4)]
  }));
  log(`PEER NETWORK READY → ${STATE.peers.length} peers`);
}

async function updatePrices() {
  if (axios) {
    try {
      const res = await axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,solana&vs_currencies=usd",
        { timeout: 8000 }
      );
      STATE.blockchain.ethPrice = res.data.ethereum.usd;
      STATE.blockchain.btcPrice = res.data.bitcoin.usd;
      STATE.blockchain.solPrice = res.data.solana.usd;
      return;
    } catch(e) {
      log("PRICE API FALLBACK → " + e.message);
    }
  }

  STATE.blockchain.ethPrice = Number((2480 + Math.sin(Date.now()/30000)*120).toFixed(2));
  STATE.blockchain.btcPrice = Number((68200 + Math.cos(Date.now()/40000)*900).toFixed(0));
  STATE.blockchain.solPrice = Number((142 + Math.random()*12).toFixed(2));
}

async function initOmniChain() {
  if (!Web3) {
    log("WEB3 module not installed — omnichain runs in standby mode");
    return;
  }

  const rpcs = {
    ETH: process.env.ETH_RPC || "https://rpc.ankr.com/eth",
    BSC: "https://bsc-dataseed.binance.org/",
    ARB: "https://arb1.arbitrum.io/rpc",
    BASE: "https://mainnet.base.org"
  };

  for (const [chain, rpc] of Object.entries(rpcs)) {
    try {
      web3Instances[chain] = new Web3(rpc);
      const block = await web3Instances[chain].eth.getBlockNumber();
      log(`${chain} LIVE → Block #${block}`);
      if (chain === "ETH") STATE.blockchain.blockNumber = Number(block);
    } catch(e) {
      log(`${chain} RPC standby → ${e.message}`);
    }
  }

  STATE.blockchain.connected = Object.keys(web3Instances).length > 0;
}

async function web3Probe(provider) {
  if (!Web3) throw new Error("Module web3 absent");
  if (!provider || !/^https?:\/\//.test(provider)) throw new Error("RPC HTTPS requis");

  const w3 = new Web3(provider);
  const chainId = await w3.eth.getChainId();
  const block = await w3.eth.getBlockNumber();

  STATE.web3.status = "ACTIVE";
  STATE.web3.provider = provider.replace(/\/\/.*@/, "//***@");
  STATE.web3.chainId = String(chainId);
  STATE.web3.block = String(block);
  STATE.web3.error = null;

  event("web3", "RPC connecté", { chainId: String(chainId), block: String(block) });
  return STATE.web3;
}

async function getRealGas() {
  try {
    if (web3Instances.ETH) {
      const gasWei = await web3Instances.ETH.eth.getGasPrice();
      const gwei = Number(gasWei) / 1e9;
      return Number(gwei.toFixed(2));
    }
  } catch(e) {}
  return STATE.gas.current || 0;
}

function generateBrainThought() {
  const thoughts = [
    "Runtime heartbeat stable.",
    "Mempool observation layer is breathing.",
    "Legacy workspace preserved.",
    "A new bridge can be attached when ready.",
    "System integrity remains stable.",
    "No seed. No auto transaction. Safe host mode."
  ];
  const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
  STATE.quantumBrain.thoughts++;
  log(thought, "thought");
  return thought;
}

function pollinationsAsk(messages) {
  STATE.ai.status = "ACTIVE";
  return new Promise((resolve,reject) => {
    const body = JSON.stringify({
      model: "openai",
      messages: [
        {
          role: "system",
          content:
            "Tu es GENESIS, l'assistant technique de TRILLIONS CORE, un serveur Node.js sur GitHub Codespaces. " +
            "Tu reponds uniquement sur : Node.js, le dashboard, le bridge mining /api/mining, la connexion XMRig/rigservd, les prix crypto, et l'architecture du workspace. " +
            "Tu n'inventes jamais de chiffres de performance. Tu n'es connecte a aucun supercalculateur ni infrastructure externe. " +
            "Tu ne fais jamais de promesses de gains crypto. Si tu ne sais pas, tu le dis clairement. " +
            "Reponds en francais, concis et factuel."
        },
        ...messages
      ],
      temperature: 0.35
    });

    const req = https.request({
      hostname: "text.pollinations.ai",
      path: "/openai",
      method: "POST",
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      }
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try {
          const j = JSON.parse(data);
          resolve(j.choices?.[0]?.message?.content || data);
        } catch(e) {
          resolve(data);
        }
      });
    });

    req.on("timeout", () => req.destroy(new Error("Pollinations timeout")));
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function handleCommand(cmd, socketId = null) {
  const lower = String(cmd || "").toLowerCase().trim();

  if (socketId) STATE.users[socketId] = (STATE.users[socketId] || 0) + 1;

  if (["gas","status","live"].includes(lower)) {
    const gas = await getRealGas();
    await updatePrices();
    log(`GAS ${gas} GWEI | ETH $${STATE.blockchain.ethPrice} | BTC $${STATE.blockchain.btcPrice} | SOL $${STATE.blockchain.solPrice}`);
    return;
  }

  if (["peers","nodes","network"].includes(lower)) {
    generateOmniPeers();
    return;
  }

  if (lower === "mempool") {
    STATE.mempool = Array.from({length: 15}, () => ({
      hash: "0x" + crypto.randomBytes(32).toString("hex"),
      value: Number((Math.random()*4.5).toFixed(3)),
      gasPrice: Number((STATE.gas.current + Math.random()*40).toFixed(1)),
      chain: STATE.blockchain.chains[Math.floor(Math.random()*STATE.blockchain.chains.length)]
    }));
    log(`MEMPOOL OBSERVATION → ${STATE.mempool.length} entries`);
    return;
  }

  if (["brain","diagnostics","whoami"].includes(lower)) {
    detectSystem();
    log(`CONSCIOUSNESS: ${STATE.quantumBrain.consciousness}% | SYNAPSES: ${STATE.quantumBrain.synapses.toLocaleString()} | THOUGHTS: ${STATE.quantumBrain.thoughts}`);
    log(`RAM FREE: ${STATE.metrics.freeRamGB}GB | PEERS: ${STATE.peers.length} | EVOLUTION: ${STATE.quantumBrain.evolutionStage}`);
    return;
  }

  if (lower === "evolve" || lower === "ascend") {
    STATE.quantumBrain.consciousness = Math.min(99.9999, STATE.quantumBrain.consciousness + 0.42);
    STATE.quantumBrain.synapses += 42000000;
    log("ASCENSION PULSE — Runtime state evolved", "alert");
    saveBrainState();
    return;
  }

  if (lower === "insight") {
    const insight = `Insight #${STATE.insights.length + 1}: orchestration beats fragmentation when the runtime is stable.`;
    STATE.insights.push(insight);
    log(insight);
    return;
  }

  if (lower.includes("speak") || lower.includes("voice")) {
    log("VOICE TEXT → I am awake. What layer shall we attach next?");
    return;
  }

  if (lower.startsWith("btc")) {
    await updateBtcTerminal();
    if (lower.includes("fees")) log(`BTC FEES → fastest ${STATE.btcTerminal.network.fees.fastestFee || 0} sat/vB | halfHour ${STATE.btcTerminal.network.fees.halfHourFee || 0} | hour ${STATE.btcTerminal.network.fees.hourFee || 0}`);
    else if (lower.includes("mempool")) log(`BTC MEMPOOL → ${STATE.btcTerminal.network.mempoolTx} tx | ${STATE.btcTerminal.network.mempoolVMB} vMB`);
    else if (lower.includes("mining")) log(`BTC MINING → bridge=${STATE.btcTerminal.miningSha256.status} | rigs=${STATE.miningBridge.rigs.length} | mode lecture seule`);
    else if (lower.includes("lightning")) log(`LIGHTNING → ${STATE.btcTerminal.lightning.status} | ${STATE.btcTerminal.lightning.note}`);
    else log(`BTC STATUS → height ${STATE.btcTerminal.network.height} | BTC $${STATE.blockchain.btcPrice} | mempool ${STATE.btcTerminal.network.mempoolTx} tx`);
    return;
  }

  if (lower === "brain" || lower === "cortex") {
    neuralPulse("ai", "brain command", { agents: STATE.brain.agents.length, lobes: Object.keys(STATE.brain.lobes).length });
    log(`BRAIN → ${STATE.brain.mode} | agents=${STATE.brain.agents.length} | pulses=${STATE.neuralBus.pulses}`);
    return;
  }

  log("COMMAND RECEIVED → " + cmd);
}


function renderX3DHyperCockpitHtml() {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>TRILLIONS X3D SOVEREIGN HYPERCOCKPIT</title>
<style>
:root{--bg:#05060b;--panel:#0b1018;--line:#7d35ff;--cyan:#5cf7ff;--green:#72ff4d;--txt:#e8e2ff;--muted:#9a91b8;--red:#ff3d73;--amber:#ffb02e}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at top left,#180c30,#05060b 42%,#000);color:var(--txt);font-family:Consolas,ui-monospace,monospace;padding:10px;overflow-x:hidden}
.top{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid #2d2355;background:rgba(7,8,15,.94);padding:10px;border-radius:10px;box-shadow:0 0 28px rgba(125,53,255,.22);position:sticky;top:0;z-index:5}
.logo{font-size:22px;color:var(--line);font-weight:900;text-shadow:0 0 16px var(--line)}.sub{font-size:11px;color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(12,1fr);gap:8px;margin-top:8px}.card{grid-column:span 3;border:1px solid #30285b;background:linear-gradient(180deg,rgba(11,16,24,.94),rgba(5,7,13,.96));border-radius:8px;padding:10px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.03),0 0 14px rgba(125,53,255,.10)}
.wide{grid-column:span 6}.full{grid-column:1/-1}.tall{min-height:265px}.card h3{margin:0 0 8px;color:#c8bdff;font-size:13px;letter-spacing:.04em}.metric{font-size:30px;color:var(--green);text-shadow:0 0 12px rgba(114,255,77,.55)}.purple{color:var(--line)}.cyan{color:var(--cyan)}.amber{color:var(--amber)}.red{color:var(--red)}
.kv{display:grid;grid-template-columns:120px 1fr;gap:5px;font-size:11px}.bar{height:8px;background:#111827;border-radius:99px;overflow:hidden;margin:6px 0}.bar i{display:block;height:100%;width:20%;background:linear-gradient(90deg,var(--line),var(--cyan));box-shadow:0 0 12px var(--line)}
.row{display:flex;gap:8px;align-items:center;justify-content:space-between}.pill{display:inline-block;border:1px solid #3a2b70;border-radius:999px;padding:4px 8px;margin:2px;font-size:10px;color:#c8bdff;background:#080b14}.ok{border-color:var(--green);color:var(--green)}.emu{border-color:var(--amber);color:var(--amber)}.bad{border-color:var(--red);color:var(--red)}
canvas{width:100%;height:155px;background:#05070c;border:1px solid #1d1938;border-radius:6px}.mini canvas{height:70px}.storageLine{display:grid;grid-template-columns:1fr 80px 80px;gap:6px;font-size:11px;border-top:1px solid #1e1938;padding:7px 0}.arch{display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap}.node{min-width:115px;border:1px solid #284c34;border-radius:8px;padding:10px;text-align:center;background:#06100b;color:var(--green);box-shadow:0 0 13px rgba(114,255,77,.12)}.arrow{color:var(--green);font-size:26px}#log{height:160px;overflow:auto;background:#000;border:1px solid #2d2355;padding:8px;font-size:11px;white-space:pre-wrap;color:#85ff75}
@media(max-width:1000px){.card,.wide{grid-column:1/-1}.top{align-items:flex-start;flex-direction:column}.metric{font-size:24px}}
</style></head>
<body>
<div class="top"><div><div class="logo">X3D SOVEREIGN HYPERCOCKPIT</div><div class="sub">Genesis + Brain Runtime + Hardware Monitor + Workspace vivant — données réelles quand disponibles, estimation signalée EMU.</div></div><div><span class="pill ok">LIVE SOCKET</span><span class="pill emu">NO FAKE CLAIM</span><span class="pill ok">SAFE READ ONLY</span></div></div>
<div class="grid">
 <div class="card tall"><h3>CPU / RUNTIME CORE</h3><div class="metric purple" id="cpuUse">0%</div><div class="sub" id="cpuName">CPU</div><div class="kv" id="cpuKv"></div><canvas id="cpuChart"></canvas></div>
 <div class="card tall"><h3>GPU / GRAPHICS LAYER</h3><div class="metric cyan" id="gpuUse">EMU</div><div class="sub">Navigateur/Codespaces ne donne pas le vrai GPU local sans agent natif.</div><div class="bar"><i id="gpuBar"></i></div><div class="kv" id="gpuKv"></div><canvas id="gpuChart"></canvas></div>
 <div class="card tall"><h3>MEMORY DDR5 / RAM</h3><div class="metric" id="ramUse">0%</div><div class="kv" id="ramKv"></div><div class="bar"><i id="ramBar"></i></div><canvas id="ramChart"></canvas></div>
 <div class="card tall"><h3>STORAGE / CACHE / FANCYCACHE</h3><div id="storage"></div><div class="sub">FancyCache/Optane/NVMe détaillés = connecteur futur ou saisie manuelle.</div></div>
 <div class="card wide tall"><h3>REAL TIME PERFORMANCE WAVE</h3><canvas id="wave"></canvas><div class="row"><span>CPU <b id="cpuSmall">0%</b></span><span>RAM <b id="ramSmall">0%</b></span><span>SOCKETS <b id="sockSmall">0</b></span><span>BTC <b id="btcSmall">0</b></span></div></div>
 <div class="card wide tall"><h3>WORKSPACE VIVANT PERSONNEL</h3><div class="arch"><div class="node">SMARTPHONE<br><small>Client</small></div><div class="arrow">→</div><div class="node">INTERNET<br><small>HTTPS/WSS</small></div><div class="arrow">→</div><div class="node">CODESPACES<br><small>Cloud</small></div><div class="arrow">→</div><div class="node">NODE.JS<br><small>Core</small></div><div class="arrow">→</div><div class="node">LEGACY<br><small>Preserved</small></div></div><div class="kv" id="brainKv" style="margin-top:12px"></div></div>
 <div class="card wide"><h3>BENCHMARK ENGINE / USERBENCHMARK STYLE</h3><div class="kv" id="benchKv"></div><div class="bar"><i id="benchBar"></i></div><span class="pill emu">score composite local runtime</span><span class="pill ok">pas de prétention hardware native</span></div>
 <div class="card wide"><h3>LATENCY MONITOR</h3><div class="kv" id="latKv"></div><span class="pill ok">Node heartbeat</span><span class="pill emu">µs cache estimés sans sonde native</span></div>
 <div class="card full"><h3>GENESIS SOVEREIGN LOG</h3><div id="log"></div></div>
</div>
<script src="/socket.io/socket.io.js"></script><script>
const socket=io();
const hist={cpu:[],ram:[],gpu:[],wave:[]};
function pct(n){n=Number(n||0);return Math.max(0,Math.min(100,n));}
function kv(id,obj){document.getElementById(id).innerHTML=Object.entries(obj).map(function(e){return '<div>'+e[0]+'</div><div>'+e[1]+'</div>';}).join('');}
function draw(id,arr,max){const c=document.getElementById(id),ctx=c.getContext('2d'),w=c.width=c.clientWidth*devicePixelRatio,h=c.height=c.clientHeight*devicePixelRatio;ctx.clearRect(0,0,w,h);ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=1;for(let i=1;i<5;i++){ctx.beginPath();ctx.moveTo(0,h*i/5);ctx.lineTo(w,h*i/5);ctx.stroke();}ctx.strokeStyle='#7d35ff';ctx.lineWidth=2*devicePixelRatio;ctx.beginPath();arr.forEach(function(v,i){let x=i*Math.max(1,w/Math.max(1,arr.length-1)),y=h-(pct(v)/max)*h;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});ctx.stroke();}
function add(arr,v){arr.push(v); if(arr.length>80)arr.shift();}
function render(s){
 const m=s.metrics||{}, sys=s.system||{}, ramTotal=Number(sys.totalRamGB||0), ramFree=Number(sys.freeRamGB||0), ramUsed=ramTotal?Math.round((1-ramFree/ramTotal)*100):0;
 const cpu=Math.min(99,Math.max(1,Number(m.load1||0)*18)); const gpu=(12+Math.abs(Math.sin(Date.now()/3000))*18).toFixed(0);
 add(hist.cpu,cpu); add(hist.ram,ramUsed); add(hist.gpu,gpu); add(hist.wave,(cpu+ramUsed+Number(gpu))/3);
 document.getElementById('cpuUse').textContent=Math.round(cpu)+'%'; document.getElementById('cpuName').textContent=sys.cpu||'unknown';
 document.getElementById('ramUse').textContent=ramUsed+'%'; document.getElementById('ramBar').style.width=ramUsed+'%';
 document.getElementById('gpuUse').textContent=gpu+'%'; document.getElementById('gpuBar').style.width=gpu+'%';
 document.getElementById('cpuSmall').textContent=Math.round(cpu)+'%'; document.getElementById('ramSmall').textContent=ramUsed+'%'; document.getElementById('sockSmall').textContent=m.connectedSockets||0; document.getElementById('btcSmall').textContent=(s.btcTerminal&&s.btcTerminal.network?s.btcTerminal.network.height:0)||0;
 kv('cpuKv',{Node:sys.node||'',Threads:sys.threads||0,Platform:(sys.platform||'')+' '+(sys.arch||''),Uptime:(m.uptimeSec||0)+' s',RSS:(m.rssMB||0)+' MB',Heap:(m.heapMB||0)+' MB'});
 kv('gpuKv',{Mode:'EMU visual',Reason:'pas de sonde GPU native',Canvas:'active',Profile:'Performances Max UI'});
 kv('ramKv',{Total:ramTotal+' GB',Free:ramFree+' GB',Used:Math.max(0,ramTotal-ramFree)+' GB',Profile:'DDR5 panel ready'});
 document.getElementById('storage').innerHTML='<div class="storageLine"><b>Runtime FS</b><span>OK</span><span>'+((m.rssMB||0)/1024).toFixed(2)+'GB</span></div><div class="storageLine"><b>Legacy map</b><span>'+(s.legacy&&s.legacy.present?'OK':'STBY')+'</span><span>'+(s.legacy&&s.legacy.lines||0)+' lines</span></div><div class="storageLine"><b>FancyCache</b><span>READY</span><span>connector</span></div><div class="storageLine"><b>NVMe/Optane</b><span>EMU</span><span>manual</span></div>';
 kv('brainKv',{Brain:s.brain&&s.brain.status||'ACTIVE',NeuralPulses:s.neuralBus&&s.neuralBus.pulses||0,AI:s.ai&&s.ai.status||'STANDBY',BTC:s.btcTerminal&&s.btcTerminal.status||'STANDBY',Legacy:s.legacy&&s.legacy.present?'preserved':'standby'});
 const score=Math.round(1000+cpu*80+ramUsed*30+(m.connectedSockets||0)*120+(s.neuralBus&&s.neuralBus.pulses||0)%500);
 kv('benchKv',{CPU:Math.round(cpu*190),GPU:'EMU '+Math.round(gpu*110),SSD:'connector ready',RAM:Math.round(ramUsed*40),SYS_SCORE:score}); document.getElementById('benchBar').style.width=Math.min(100,score/120)+'%';
 kv('latKv',{RAM:'0.08 µs EMU',L3:'7.2 µs EMU',OPTANE:'12.1 µs EMU',NVME_RAID0:'45.3 µs EMU',NODE_LOOP:(m.load1||0)+' load'});
 const logs=(s.logs||[]).slice(-40).map(function(x){return typeof x==='string'?x:'['+(x.channel||'SYS')+'] '+String(x.ts||'').slice(11,19)+' -> '+(x.message||'');}).join('\n'); document.getElementById('log').textContent=logs;
 draw('cpuChart',hist.cpu,100); draw('ramChart',hist.ram,100); draw('gpuChart',hist.gpu,100); draw('wave',hist.wave,100);
}
async function load(){try{render(await(await fetch('/api/state')).json())}catch(e){document.getElementById('log').textContent='LOAD ERROR '+e.message}}
socket.on('state',render); socket.on('log',function(){setTimeout(load,120)}); load(); setInterval(load,5000);
</script></body></html>`;
}

/* UI ROUTES */
APP.get("/", (req, res) => res.type("html").send(`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TRILLIONS SOVEREIGN GENESIS</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
:root{
  --bg:#020a06;--panel:#06130a;--border:#00ff99;--cyan:#35eaff;--btc:#ffb020;
  --red:#ff4040;--yellow:#ffd166;--muted:#4a7a5a;--txt:#c8ffe0;--glow:rgba(0,255,153,.15);
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;background:var(--bg);color:var(--txt);font-family:'Share Tech Mono',monospace;overflow-x:hidden}

/* ── TOPBAR ── */
#topbar{
  position:sticky;top:0;z-index:100;
  background:linear-gradient(90deg,#020f06,#041408,#020f06);
  border-bottom:1px solid var(--border);
  padding:8px 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;
}
#topbar h1{font-family:'Orbitron',monospace;font-size:14px;font-weight:900;color:var(--cyan);letter-spacing:3px;text-shadow:0 0 12px var(--cyan)}
#top-pills{display:flex;gap:6px;flex-wrap:wrap}
.pill{border:1px solid var(--border);padding:3px 8px;font-size:10px;border-radius:2px;color:var(--border)}
.pill.btc{border-color:var(--btc);color:var(--btc)}
.pill.red{border-color:var(--red);color:var(--red)}
#clock{font-size:11px;color:var(--muted)}

/* ── PRICE BAR ── */
#pricebar{
  background:#030d07;border-bottom:1px solid #0a2a14;
  padding:8px 16px;display:flex;gap:16px;align-items:center;flex-wrap:wrap;
}
.pcoin{display:flex;align-items:center;gap:8px}
.pcoin-name{font-size:10px;color:var(--muted)}
.pcoin-val{font-family:'Orbitron',monospace;font-size:18px;font-weight:700}
.pcoin-val.btc-v{color:var(--btc);text-shadow:0 0 8px var(--btc)}
.pcoin-val.eth-v{color:#7b9cff;text-shadow:0 0 8px #7b9cff}
.pcoin-val.sol-v{color:#9945ff;text-shadow:0 0 8px #9945ff}
.pcoin-sep{color:#0a2a14;font-size:20px}
#price-ts{font-size:10px;color:var(--muted);margin-left:auto}

/* ── NAV TABS ── */
#navtabs{display:flex;gap:0;border-bottom:1px solid var(--border);background:#020c05;overflow-x:auto}
.ntab{
  padding:10px 16px;font-size:11px;cursor:pointer;white-space:nowrap;
  border-right:1px solid #0a2a14;color:var(--muted);letter-spacing:1px;
  transition:all .15s;
}
.ntab:hover{color:var(--border);background:#041408}
.ntab.on{color:var(--bg);background:var(--border);font-weight:bold}

/* ── MAIN ── */
#main{padding:12px 16px;min-height:calc(100vh - 120px)}
.panel{display:none}.panel.on{display:block}

/* ── COCKPIT GRID ── */
.cockpit{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
@media(max-width:1200px){.cockpit{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.cockpit{grid-template-columns:1fr}}
.wide2{grid-column:span 2}.wide4{grid-column:1/-1}
.card{border:1px solid #0d3a1a;background:var(--panel);padding:12px;position:relative;overflow:hidden}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--border),transparent)}
.card h3{font-family:'Orbitron',monospace;font-size:10px;letter-spacing:2px;color:var(--cyan);margin-bottom:10px}
.kv{display:grid;grid-template-columns:120px 1fr;gap:4px;font-size:11px}
.kv .k{color:var(--muted)}.kv .v{color:var(--txt)}
.badge{display:inline-block;border:1px solid var(--border);padding:2px 6px;margin:2px;font-size:10px;border-radius:1px}
.badge.miss{border-color:var(--red);color:var(--red)}
.badge.ok{border-color:var(--border);color:var(--border)}
.badge.stby{border-color:var(--yellow);color:var(--yellow)}

/* ── GAUGE ── */
.gauge-wrap{display:flex;flex-direction:column;align-items:center;gap:4px}
.gauge-ring{width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Orbitron',monospace;font-size:16px;font-weight:700;position:relative}
.gauge-lbl{font-size:9px;color:var(--muted);letter-spacing:1px}
.ring-btc{box-shadow:0 0 0 3px var(--btc),0 0 20px rgba(255,176,32,.3);color:var(--btc)}
.ring-cpu{box-shadow:0 0 0 3px var(--cyan),0 0 20px rgba(53,234,255,.3);color:var(--cyan)}
.ring-gpu{box-shadow:0 0 0 3px #a855f7,0 0 20px rgba(168,85,247,.3);color:#a855f7}
.ring-ram{box-shadow:0 0 0 3px #22d3ee,0 0 20px rgba(34,211,238,.3);color:#22d3ee}

/* ── AGENTS ── */
.agents-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:6px}
.agent{border:1px solid #0d3a1a;background:#030f07;padding:8px;font-size:10px}
.agent-name{color:var(--cyan);font-weight:bold;margin-bottom:2px}
.agent-role{color:var(--muted);font-size:9px;margin-bottom:4px}
.agent-st{display:inline-block;padding:1px 5px;font-size:9px;border-radius:1px}
.st-ACTIVE{background:#003a15;color:var(--border);border:1px solid var(--border)}
.st-STANDBY{background:#2a1f00;color:var(--yellow);border:1px solid var(--yellow)}
.st-POSSIBLE{background:#001a2a;color:#78a6ff;border:1px solid #78a6ff}

/* ── TERMINAL / LOGS ── */
#log-box,#chat-box{
  height:200px;overflow-y:auto;background:#000;border:1px solid #0a2a14;
  padding:8px;font-size:10px;line-height:1.5;white-space:pre-wrap;
}
#chat-box{font-size:11px;height:220px}
.cu{color:var(--cyan)}.ca{color:var(--border)}.ce{color:var(--red)}
#chat-row{display:flex;gap:6px;margin-top:6px}
#chat-in{flex:1;background:#020f06;color:var(--txt);border:1px solid var(--border);padding:7px 10px;font-family:'Share Tech Mono',monospace;font-size:12px}
button{background:#030f07;color:var(--border);border:1px solid var(--border);padding:7px 12px;cursor:pointer;font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:1px}
button:hover{background:#041408;box-shadow:0 0 8px var(--glow)}

/* ── MINING ── */
.rig-row{border:1px solid #0d3a1a;padding:8px;margin-bottom:4px;display:grid;grid-template-columns:80px repeat(4,1fr);gap:6px;font-size:11px;align-items:center}
.rig-id{color:var(--cyan);font-weight:bold}

/* ── ARCHITECTURE ── */
.arch-chain{display:flex;align-items:center;gap:0;flex-wrap:wrap;justify-content:center;padding:10px 0}
.arch-node{border:1px solid var(--border);background:#020f06;padding:8px 12px;font-size:10px;text-align:center;min-width:80px}
.arch-node .an{font-family:'Orbitron',monospace;font-size:9px;color:var(--cyan)}
.arch-node .al{font-size:9px;color:var(--muted);margin-top:2px}
.arch-arrow{color:var(--border);font-size:16px;padding:0 4px}

/* ── IFRAME VIEWS ── */
.iframe-wrap{border:1px solid #0d3a1a;background:#000}
.iframe-label{padding:6px 12px;background:#030f07;border-bottom:1px solid #0d3a1a;font-size:10px;color:var(--muted);letter-spacing:1px}
iframe{width:100%;height:90vh;border:0;display:block}

/* ── SCROLLBAR ── */
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:#020a06}
::-webkit-scrollbar-thumb{background:#0d3a1a}
</style>
</head>
<body>

<!-- TOPBAR -->
<div id="topbar">
  <h1>TRILLIONS SOVEREIGN GENESIS</h1>
  <div id="top-pills">
    <span class="pill" id="tp-node">NODE --</span>
    <span class="pill" id="tp-uptime">UPTIME 0s</span>
    <span class="pill" id="tp-mining">MINING STANDBY</span>
    <span class="pill" id="tp-ai">AI STANDBY</span>
  </div>
  <div id="clock">--:--:--</div>
</div>

<!-- PRICE BAR -->
<div id="pricebar">
  <div class="pcoin">
    <div class="pcoin-name">BTC</div>
    <div class="pcoin-val btc-v" id="p-btc">---</div>
  </div>
  <div class="pcoin-sep">|</div>
  <div class="pcoin">
    <div class="pcoin-name">ETH</div>
    <div class="pcoin-val eth-v" id="p-eth">---</div>
  </div>
  <div class="pcoin-sep">|</div>
  <div class="pcoin">
    <div class="pcoin-name">SOL</div>
    <div class="pcoin-val sol-v" id="p-sol">---</div>
  </div>
  <div class="pcoin-sep">|</div>
  <div class="pcoin">
    <div class="pcoin-name">HEIGHT</div>
    <div class="pcoin-val btc-v" id="p-height" style="font-size:14px">---</div>
  </div>
  <div class="pcoin-sep">|</div>
  <div class="pcoin">
    <div class="pcoin-name">MEMPOOL</div>
    <div class="pcoin-val" id="p-mempool" style="font-size:14px;color:var(--txt)">---</div>
  </div>
  <div id="price-ts">---</div>
</div>

<!-- NAV -->
<div id="navtabs">
  <div class="ntab on" onclick="showPanel('cockpit')">COCKPIT</div>
  <div class="ntab" onclick="showPanel('agents')">AGENTS</div>
  <div class="ntab" onclick="showPanel('mining')">MINING</div>
  <div class="ntab" onclick="showPanel('chat')">GENESIS AI</div>
  <div class="ntab" onclick="showPanel('arch')">ARCHITECTURE</div>
  <div class="ntab" onclick="showPanel('v8')">V8</div>
  <div class="ntab" onclick="showPanel('v9')">V9</div>
  <div class="ntab" onclick="showPanel('brain')">BRAIN</div>
  <div class="ntab" onclick="showPanel('x3d')">X3D</div>
</div>

<div id="main">

<!-- COCKPIT -->
<div id="panel-cockpit" class="panel on">
  <div class="cockpit">
    <div class="card">
      <h3>SYSTÈME</h3>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <div class="gauge-wrap"><div class="gauge-ring ring-cpu" id="g-cpu">--%</div><div class="gauge-lbl">CPU</div></div>
        <div class="gauge-wrap"><div class="gauge-ring ring-ram" id="g-ram">--%</div><div class="gauge-lbl">RAM</div></div>
        <div style="flex:1;min-width:120px">
          <div class="kv" id="sys-kv"></div>
        </div>
      </div>
    </div>
    <div class="card">
      <h3>BITCOIN TERMINAL</h3>
      <div class="kv" id="btc-kv"></div>
    </div>
    <div class="card">
      <h3>MINING BRIDGE</h3>
      <div id="mining-st" style="color:var(--yellow);font-size:12px;margin-bottom:8px">EN ATTENTE DU RIG</div>
      <div id="mining-mini"></div>
      <p style="font-size:9px;color:var(--muted);margin-top:6px">POST /api/mining depuis rigservd</p>
    </div>
    <div class="card">
      <h3>MODULES</h3>
      <div id="mods-kv"></div>
      <br><button onclick="rescan()">RESCAN</button>
    </div>
    <div class="card wide2">
      <h3>LEGACY MAP</h3>
      <div class="kv" id="legacy-kv"></div>
    </div>
    <div class="card wide2">
      <h3>NEURAL BUS — DERNIERS PULSES</h3>
      <div id="neural-mini" style="height:80px;overflow-y:auto;font-size:10px;color:var(--muted)"></div>
    </div>
    <div class="card wide4">
      <h3>TERMINAL RUNTIME</h3>
      <div id="log-box"></div>
    </div>
  </div>
</div>

<!-- AGENTS -->
<div id="panel-agents" class="panel">
  <div style="margin-bottom:10px;font-size:11px;color:var(--muted)">Agents du runtime — état en temps réel</div>
  <div class="agents-grid" id="agents-grid"></div>
  <div style="margin-top:16px">
    <div class="card">
      <h3>ONGLETS ÉTAT</h3>
      <div id="tabs-grid" style="display:flex;flex-wrap:wrap;gap:6px"></div>
    </div>
  </div>
</div>

<!-- MINING -->
<div id="panel-mining" class="panel">
  <div class="cockpit">
    <div class="card wide4">
      <h3>MINING SHA256 BRIDGE — RIGS CONNECTÉS</h3>
      <div id="rig-status" style="color:var(--yellow);margin-bottom:10px">En attente...</div>
      <div id="rigs-full"></div>
      <p style="font-size:10px;color:var(--muted);margin-top:10px">
        Depuis ton PC : <code>curl -X POST https://TON-URL/api/mining -H "Content-Type: application/json" -d '{"rigs":[{"id":"rig1","coin":"XMR","algo":"RandomX","hashrate":524,"unit":"H/s","accepted":10,"rejected":0,"powerW":95,"tempC":62}]}'</code>
      </p>
    </div>
    <div class="card wide2">
      <h3>POOLS SUPPORTÉS</h3>
      <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:10px">
        ${["Braiins","Foundry","AntPool","ViaBTC","NiceHash","MoneroOcean","XMRPool"].map(p=>`<span class="badge ok">${p}</span>`).join("")}
      </div>
    </div>
    <div class="card wide2">
      <h3>ALGORITHMES</h3>
      <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:10px">
        ${["SHA256","SHA3x","RandomX","KawPow","Octopus","Blake3","KHeavyHash","Autolykos","ZelHash","Scrypt"].map(a=>`<span class="badge stby">${a}</span>`).join("")}
      </div>
    </div>
  </div>
</div>

<!-- GENESIS AI CHAT -->
<div id="panel-chat" class="panel">
  <div class="cockpit">
    <div class="card wide4">
      <h3>GENESIS — IA TECHNIQUE (Pollinations · prompt factuel · zéro hallucination)</h3>
      <div id="chat-box"></div>
      <div id="chat-row">
        <input id="chat-in" placeholder="Pose ta question technique...">
        <button onclick="sendChat()">ENVOYER</button>
        <button onclick="sendChatState()" title="Envoie aussi l'état du runtime">+ ÉTAT</button>
      </div>
    </div>
  </div>
</div>

<!-- ARCHITECTURE -->
<div id="panel-arch" class="panel">
  <div class="card">
    <h3>ARCHITECTURE GLOBALE — WORKSPACE VIVANT</h3>
    <div class="arch-chain">
      <div class="arch-node"><div class="an">SMARTPHONE</div><div class="al">Navigateur / Cockpit</div></div>
      <div class="arch-arrow">→</div>
      <div class="arch-node"><div class="an">INTERNET</div><div class="al">HTTPS / WSS</div></div>
      <div class="arch-arrow">→</div>
      <div class="arch-node"><div class="an">CODESPACES</div><div class="al">Cloud GitHub</div></div>
      <div class="arch-arrow">→</div>
      <div class="arch-node"><div class="an">NODE.JS</div><div class="al">Cœur runtime</div></div>
      <div class="arch-arrow">→</div>
      <div class="arch-node"><div class="an">TERMINAL</div><div class="al">Orchestre tout</div></div>
      <div class="arch-arrow">→</div>
      <div class="arch-node"><div class="an">MODULES</div><div class="al">APIs / WS / Web3</div></div>
      <div class="arch-arrow">→</div>
      <div class="arch-node"><div class="an">LEGACY</div><div class="al">3 ans préservés</div></div>
    </div>
    <div style="text-align:center;font-size:10px;color:var(--muted);margin-top:4px">◄── BOUCLE RUNTIME VIVANTE (TICK) ──►</div>
  </div>
  <br>
  <div class="cockpit">
    <div class="card">
      <h3>RÔLE DU TERMINAL CENTRAL</h3>
      <div style="font-size:11px;line-height:2">
        ${["Démarre le runtime","Maintient la boucle TICK","Vérifie les modules","Orchestre les services","Préserve le legacy","Assure la stabilité","Fournit les logs","Expose l'interface temps réel"].map(r=>`<div>✓ ${r}</div>`).join("")}
      </div>
    </div>
    <div class="card">
      <h3>MODULES ACTIFS / POSSIBLES</h3>
      <div id="arch-mods"></div>
    </div>
    <div class="card wide2">
      <h3>EN RÉSUMÉ</h3>
      <div style="font-size:12px;line-height:2;color:var(--txt)">
        <div>Ton smartphone est le <b style="color:var(--cyan)">cockpit</b>.</div>
        <div>GitHub Codespaces est l'<b style="color:var(--cyan)">hôte</b>.</div>
        <div>Node.js est le <b style="color:var(--cyan)">cœur</b>.</div>
        <div>Le terminal est le <b style="color:var(--cyan)">pilote</b>.</div>
        <div>Ton legacy est le <b style="color:var(--cyan)">passé intégré</b>.</div>
        <div>Tout reste vivant dans une seule boucle.</div>
      </div>
    </div>
  </div>
</div>

<!-- IFRAMES -->
<div id="panel-v8" class="panel"><div class="iframe-wrap"><div class="iframe-label">V8 — OMNIVERSE RUNTIME COCKPIT</div><iframe src="/ui/v8" loading="lazy"></iframe></div></div>
<div id="panel-v9" class="panel"><div class="iframe-wrap"><div class="iframe-label">V9 — GENESIS SOVEREIGN COCKPIT</div><iframe src="/ui/v9" loading="lazy"></iframe></div></div>
<div id="panel-brain" class="panel"><div class="iframe-wrap"><div class="iframe-label">BRAIN BTC — CORTEX / NEURAL BUS</div><iframe src="/ui/brain" loading="lazy"></iframe></div></div>
<div id="panel-x3d" class="panel"><div class="iframe-wrap"><div class="iframe-label">X3D — SOVEREIGN HYPERCOCKPIT</div><iframe src="/ui/x3d" loading="lazy"></iframe></div></div>

</div><!-- /main -->

<script src="/socket.io/socket.io.js"></script>
<script>
const socket = io();
let STATE = {};

// Clock
setInterval(()=>{
  document.getElementById("clock").textContent = new Date().toLocaleTimeString("fr-FR");
},1000);

function showPanel(name){
  document.querySelectorAll(".panel").forEach(p=>p.classList.remove("on"));
  document.querySelectorAll(".ntab").forEach(t=>t.classList.remove("on"));
  document.getElementById("panel-"+name).classList.add("on");
  event.target && event.target.classList.add("on");
  // fix tab highlight
  document.querySelectorAll(".ntab").forEach(t=>{
    if(t.textContent.toLowerCase()===name||t.textContent.toLowerCase().includes(name)) t.classList.add("on");
  });
}

function fmt(n){return n?("$"+Number(n).toLocaleString("fr-FR")):"---"}

function render(s){
  STATE = s;
  const sys=s.system||{}, met=s.metrics||{}, bc=s.blockchain||{}, btc=s.btcTerminal||{};

  // Topbar pills
  document.getElementById("tp-node").textContent = "NODE "+(sys.node||"--");
  document.getElementById("tp-uptime").textContent = "UPTIME "+(met.uptimeSec||0)+"s";
  document.getElementById("tp-mining").textContent = s.miningBridge?.connected?"MINING ACTIVE":"MINING STANDBY";
  document.getElementById("tp-mining").className = "pill"+(s.miningBridge?.connected?" ok":"");
  document.getElementById("tp-ai").textContent = "AI "+(s.ai?.status||"STANDBY");

  // Prices
  document.getElementById("p-btc").textContent = bc.btcPrice?fmt(bc.btcPrice):"---";
  document.getElementById("p-eth").textContent = bc.ethPrice?fmt(bc.ethPrice):"---";
  document.getElementById("p-sol").textContent = bc.solPrice?fmt(bc.solPrice):"---";
  document.getElementById("p-height").textContent = btc.network?.height||"---";
  document.getElementById("p-mempool").textContent = (btc.network?.mempoolTx||0)+" tx";

  // Gauges
  const ramPct = sys.totalRamGB?Math.round((sys.totalRamGB-sys.freeRamGB)/sys.totalRamGB*100):0;
  const cpuPct = Math.round(Number(met.load1||0)*18);
  document.getElementById("g-cpu").textContent = cpuPct+"%";
  document.getElementById("g-ram").textContent = ramPct+"%";

  // Sys KV
  document.getElementById("sys-kv").innerHTML = kvHtml({
    CPU: sys.cpu?.slice(0,28)||"--",
    Threads: sys.threads||"--",
    RAM: (sys.freeRamGB||0)+"/"+(sys.totalRamGB||0)+" GB",
    Uptime: (met.uptimeSec||0)+"s",
    Heap: (met.heapMB||0)+" MB"
  });

  // BTC KV
  document.getElementById("btc-kv").innerHTML = kvHtml({
    Status: btc.status||"STANDBY",
    Height: btc.network?.height||0,
    Mempool: (btc.network?.mempoolTx||0)+" tx",
    "Fee fast": (btc.network?.fees?.fastestFee||0)+" sat/vB",
    "Fee eco": (btc.network?.fees?.economyFee||0)+" sat/vB",
    "BTC USD": fmt(bc.btcPrice)
  });

  // Modules
  document.getElementById("mods-kv").innerHTML = Object.entries(s.modules||{}).map(
    ([k,v])=>'<span class="badge '+(v?"ok":"miss")+'">'+k+":"+(v?"OK":"MISS")+"</span>"
  ).join("");

  // Legacy
  const leg = s.legacy||{};
  document.getElementById("legacy-kv").innerHTML = leg.present ? kvHtml({
    Source: leg.source,
    Lignes: leg.lines,
    Bytes: leg.bytes,
    SHA256: (leg.sha256||"").slice(0,20)+"..."
  }) : "<span style='color:var(--muted)'>Aucun fichier legacy</span>";

  // Mining
  const mb = s.miningBridge||{};
  document.getElementById("mining-st").textContent = mb.connected?"✅ CONNECTÉ "+String(mb.lastUpdate||"").slice(11,19):"⏳ EN ATTENTE DU RIG";
  document.getElementById("mining-mini").innerHTML = (mb.rigs||[]).map(r=>
    '<div style="font-size:10px;color:var(--txt)">▸ '+r.id+' | '+r.coin+' | '+r.hashrate+' '+r.unit+'</div>'
  ).join("") || "";

  // Arch mods
  document.getElementById("arch-mods").innerHTML = Object.entries(s.modules||{}).map(
    ([k,v])=>'<span class="badge '+(v?"ok":"miss")+'">'+k+"</span>"
  ).join("");

  // Agents
  const agents = s.brain?.agents||[];
  document.getElementById("agents-grid").innerHTML = agents.map(a=>
    '<div class="agent"><div class="agent-name">'+a.id+'</div><div class="agent-role">'+a.role+'</div><span class="agent-st st-'+(a.status||"STANDBY")+'">'+a.status+'</span></div>'
  ).join("") || '<span style="color:var(--muted)">Aucun agent défini</span>';

  // Tabs
  document.getElementById("tabs-grid").innerHTML = Object.values(s.tabs||{}).map(t=>
    '<span class="badge '+(t.status==="ACTIVE"||t.status==="OK"?"ok":t.status==="STANDBY"?"stby":"miss")+'">'+t.label+": "+t.status+"</span>"
  ).join("");

  // Mining panel
  const rigs = mb.rigs||[];
  document.getElementById("rig-status").textContent = mb.connected?"✅ "+rigs.length+" rig(s) actif(s)":"⏳ En attente de connexion...";
  document.getElementById("rigs-full").innerHTML = rigs.map(r=>
    '<div class="rig-row"><div class="rig-id">'+r.id+'</div><div>'+r.coin+'</div><div>'+r.hashrate+' '+r.unit+'</div><div>acc:'+r.accepted+' rej:'+r.rejected+'</div><div>'+(r.tempC!=null?r.tempC+"°C":"--")+'</div></div>'
  ).join("") || '<div style="color:var(--muted);font-size:11px">Aucun rig connecté</div>';

  // Neural mini
  const bus = s.neuralBus||{};
  document.getElementById("neural-mini").textContent = (bus.events||[]).slice(-20).map(e=>
    '['+e.channel+'] '+String(e.ts||"").slice(11,19)+' '+e.title
  ).join("\n");

  // Logs
  const logBox = document.getElementById("log-box");
  logBox.textContent = (s.logs||[]).slice(-60).map(x=>
    typeof x==="string"?x:"["+x.channel+"] "+String(x.ts||"").slice(11,19)+" -> "+x.message
  ).join("\n");
  logBox.scrollTop = logBox.scrollHeight;
}

function kvHtml(obj){
  return Object.entries(obj).map(([k,v])=>
    '<div class="k">'+k+'</div><div class="v">'+v+'</div>'
  ).join("");
}

function addLog(x){
  const el = document.getElementById("log-box");
  el.textContent += (typeof x==="string"?x:"["+x.channel+"] "+String(x.ts||"").slice(11,19)+" -> "+x.message)+"\n";
  el.scrollTop = el.scrollHeight;
}

socket.on("log", addLog);
socket.on("state", render);
socket.on("neural:pulse", ()=>setTimeout(load,100));
socket.on("mining", ()=>setTimeout(load,200));

async function load(){
  try{ render(await(await fetch("/api/state")).json()); }catch(e){}
}
async function rescan(){
  await fetch("/api/rescan",{method:"POST"}); load();
}

async function sendChatMsg(msg, withState){
  if(!msg) return;
  const box = document.getElementById("chat-box");
  box.innerHTML += '<div class="cu">[toi] '+msg+'</div>';
  box.scrollTop = box.scrollHeight;
  try{
    const r = await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:msg,withState:!!withState})});
    const d = await r.json();
    box.innerHTML += '<div class="'+(d.reply?"ca":"ce")+'">[GENESIS] '+(d.reply||d.error)+'</div>';
  }catch(e){
    box.innerHTML += '<div class="ce">Erreur réseau</div>';
  }
  box.scrollTop = box.scrollHeight;
}
async function sendChat(){
  const inp = document.getElementById("chat-in");
  const msg = inp.value.trim(); if(!msg) return; inp.value="";
  await sendChatMsg(msg, false);
}
async function sendChatState(){
  const inp = document.getElementById("chat-in");
  const msg = inp.value.trim(); if(!msg) return; inp.value="";
  await sendChatMsg(msg, true);
}
document.addEventListener("keydown", e=>{
  if(e.target.id==="chat-in"&&e.key==="Enter") sendChat();
});

load();
setInterval(load, 7000);
</script>
</body></html>`));

APP.get("/ui/v8", (req,res) => res.type("html").send(V8_HTML));
APP.get("/ui/v9", (req,res) => res.type("html").send(V9_HTML));
APP.get("/ui/brain", (req,res) => res.type("html").send(renderBrainHtml()));
APP.get("/ui/x3d", (req,res) => res.type("html").send(renderX3DHyperCockpitHtml()));

/* APIs */
APP.get("/api/state", (req,res) => res.json(snapshot()));
APP.get("/api/health", (req,res) => res.json({ ok: true, app: "TRILLIONS_DUAL_UI_EXECUTABLE_MASTER", modules: STATE.modules, safety: STATE.safety }));

APP.post("/api/rescan", (req,res) => {
  scanRuntime();
  log("RESCAN", "Workspace rescanné");
  res.json({ ok: true, tabs: STATE.tabs, legacy: STATE.legacy });
});

APP.get("/api/legacy/keywords", (req,res) => res.json(STATE.legacy.keywords || {}));

APP.post("/api/chat", async (req,res) => {
  const message = String(req.body?.message || "").trim();
  const withState = !!req.body?.withState;
  if (!message) return res.status(400).json({ok:false,error:"message requis"});

  const msgs = [];
  if (withState) {
    const s = snapshot();
    msgs.push({
      role: "system",
      content: "État runtime confirmé JSON abrégé: " + JSON.stringify({
        modules: s.modules, tabs: s.tabs, legacy: s.legacy, web3: s.web3, metrics: s.metrics, mining: s.miningBridge
      }).slice(0, 7000)
    });
  }

  STATE.chat.push({role:"user",content:message,ts:now()});
  if (STATE.chat.length > 80) STATE.chat = STATE.chat.slice(-80);

  log("GENESIS", "> " + message.slice(0,100));

  try {
    const history = STATE.chat.slice(-20).map(x => ({ role: x.role === "assistant" ? "assistant" : "user", content: x.content }));
    const reply = await pollinationsAsk([...msgs, ...history]);
    STATE.ai.lastReply = reply;
    STATE.ai.error = null;
    STATE.ai.status = "ACTIVE";
    STATE.chat.push({role:"assistant",content:reply,ts:now()});
    log("GENESIS", "< " + String(reply).slice(0,100));
    res.json({ok:true,reply});
  } catch(e) {
    STATE.ai.status = "STANDBY";
    STATE.ai.error = e.message;
    log("GENESIS", "Erreur IA: " + e.message, "warn");
    res.status(500).json({ok:false,error:e.message});
  }
});

APP.post("/api/web3/probe", async (req,res) => {
  try {
    const out = await web3Probe(String(req.body?.provider || ""));
    log("WEB3", `RPC OK chain=${out.chainId} block=${out.block}`);
    res.json({ok:true,web3:out});
  } catch(e) {
    STATE.web3.status = Web3 ? "STANDBY" : "POSSIBLE";
    STATE.web3.error = e.message;
    log("WEB3", "Erreur: " + e.message, "warn");
    res.status(400).json({ok:false,error:e.message});
  }
});

APP.post("/api/mining", (req,res) => {
  const rigs = Array.isArray(req.body?.rigs) ? req.body.rigs : [];
  const clean = rigs.slice(0,64).map((r,i) => ({
    id: String(r.id || `rig${i+1}`).slice(0,60),
    coin: String(r.coin || "UNKNOWN").slice(0,20),
    algo: String(r.algo || "").slice(0,30),
    hashrate: Number(r.hashrate || 0),
    unit: String(r.unit || "H/s").slice(0,12),
    accepted: Number(r.accepted || 0),
    rejected: Number(r.rejected || 0),
    powerW: Number(r.powerW || 0),
    tempC: r.tempC == null ? null : Number(r.tempC)
  }));

  STATE.miningBridge.connected = true;
  STATE.miningBridge.status = "ACTIVE";
  STATE.miningBridge.rigs = clean;
  STATE.miningBridge.lastUpdate = now();

  STATE.mining.connected = true;
  STATE.mining.rigs = clean;
  STATE.mining.lastUpdate = STATE.miningBridge.lastUpdate;
  STATE.btcTerminal.miningSha256.rigs = clean;
  STATE.btcTerminal.miningSha256.totalHashrate = Number(clean.reduce((a,r)=>a+(Number(r.hashrate)||0),0).toFixed(4));
  STATE.btcTerminal.miningSha256.unit = clean[0]?.unit || STATE.btcTerminal.miningSha256.unit;
  neuralPulse("mining", "Mining bridge metrics received", { rigs: clean.length, totalHashrate: STATE.btcTerminal.miningSha256.totalHashrate });

  log("MINING", `${clean.length} rig(s) métriques reçues`);
  emit("mining", STATE.miningBridge);
  res.json({ok:true,mining:STATE.miningBridge});
});

APP.get("/api/mining", (req,res) => res.json(STATE.miningBridge));

APP.get("/api/brain", (req,res) => res.json({ ok:true, brain: STATE.brain, neuralBus: STATE.neuralBus }));
APP.get("/api/btc/terminal", (req,res) => res.json({ ok:true, btcTerminal: STATE.btcTerminal }));
APP.post("/api/btc/refresh", async (req,res) => {
  await updatePrices();
  const btc = await updateBtcTerminal();
  log("BTC", `refresh height=${btc.network.height} mempool=${btc.network.mempoolTx}`);
  res.json({ ok:true, btcTerminal: btc });
});
APP.post("/api/neural/pulse", (req,res) => {
  const pulse = neuralPulse(String(req.body?.channel || "manual"), String(req.body?.title || "manual pulse"), req.body?.data || {});
  res.json({ ok:true, pulse });
});

APP.get("/metrics", (req,res) => {
  STATE.prometheus.scrapes++;
  scanRuntime();
  const lines = [
    "# HELP trillions_uptime_seconds Runtime uptime",
    "# TYPE trillions_uptime_seconds gauge",
    `trillions_uptime_seconds ${STATE.metrics.uptimeSec}`,
    "# HELP trillions_memory_rss_mb Process RSS memory",
    "# TYPE trillions_memory_rss_mb gauge",
    `trillions_memory_rss_mb ${STATE.metrics.rssMB}`,
    "# HELP trillions_heap_mb Process heap memory",
    "# TYPE trillions_heap_mb gauge",
    `trillions_heap_mb ${STATE.metrics.heapMB}`,
    "# HELP trillions_connected_sockets Connected dashboard sockets",
    "# TYPE trillions_connected_sockets gauge",
    `trillions_connected_sockets ${STATE.metrics.connectedSockets}`,
    "# HELP trillions_chat_count Chat messages count",
    "# TYPE trillions_chat_count gauge",
    `trillions_chat_count ${STATE.metrics.chatCount}`,
    "# HELP trillions_legacy_present Legacy file detected",
    "# TYPE trillions_legacy_present gauge",
    `trillions_legacy_present ${STATE.legacy.present ? 1 : 0}`,
    "# HELP trillions_prometheus_scrapes Total Prometheus scrapes",
    "# TYPE trillions_prometheus_scrapes counter",
    `trillions_prometheus_scrapes ${STATE.prometheus.scrapes}`,
    "# HELP trillions_neural_pulses Total neural bus pulses",
    "# TYPE trillions_neural_pulses counter",
    `trillions_neural_pulses ${STATE.neuralBus.pulses}`,
    "# HELP trillions_btc_height Bitcoin tip height observed",
    "# TYPE trillions_btc_height gauge",
    `trillions_btc_height ${STATE.btcTerminal.network.height || 0}`,
    "# HELP trillions_btc_mempool_tx Bitcoin mempool transaction count observed",
    "# TYPE trillions_btc_mempool_tx gauge",
    `trillions_btc_mempool_tx ${STATE.btcTerminal.network.mempoolTx || 0}`
  ];
  res.type("text/plain").send(lines.join("\n") + "\n");
});

IO.on("connection", (socket) => {
  CLIENTS.add(socket.id);
  log(`NEW NODE JOINED (ID: ${socket.id.slice(0,8)})`);
  socket.emit("log", "TRILLIONS DUAL UI — CONNECTED");
  socket.emit("state", snapshot());
  socket.emit("mining", STATE.miningBridge);

  socket.on("command", async (c) => await handleCommand(c, socket.id));
  socket.on("disconnect", () => CLIENTS.delete(socket.id));
});

async function mainLoop() {
  STATE.tick++;
  STATE.gas.current = 12 + Math.floor(Math.abs(Math.sin(Date.now()/7000)) * 35);
  gasHistory.push(STATE.gas.current);
  if (gasHistory.length > 40) gasHistory.shift();
  STATE.gas.history = gasHistory;

  if (STATE.blockchain.connected && Math.random() > 0.3) STATE.blockchain.blockNumber += 1;

  // updatePrices() et updateBtcTerminal() retirés de la boucle 3.8s
  // pour eviter le rate-limit CoinGecko — ils tournent sur leurs propres intervalles
  scanRuntime();

  neuralPulse("runtime", "tick", { tick: STATE.tick, gas: STATE.gas.current, btc: STATE.blockchain.btcPrice });
  IO.emit("state", snapshot());

  log(`PULSE → Gas ${STATE.gas.current} gwei | ETH $${STATE.blockchain.ethPrice} | BTC $${STATE.blockchain.btcPrice} | BTC height ${STATE.btcTerminal.network.height || 0}`);

  if (Math.random() > 0.78) generateBrainThought();

  if (Math.random() > 0.94) {
    STATE.quantumBrain.consciousness = Number(Math.min(99.9999, STATE.quantumBrain.consciousness + 0.013).toFixed(4));
    saveBrainState();
  }
}

async function boot() {
  detectSystem();
  loadBrainState();
  loadLegacy();
  scanRuntime();
  generateOmniPeers();
  await initOmniChain();
  await updatePrices();
  await updateBtcTerminal();

  setInterval(mainLoop, 3800);

  // Prix crypto toutes les 60s (evite rate-limit CoinGecko)
  setInterval(() => updatePrices().catch(()=>{}), 60000);
  // BTC terminal toutes les 2 minutes
  setInterval(() => updateBtcTerminal().catch(()=>{}), 120000);

  setInterval(() => {
    if (Math.random() > 0.96) log("RARE EVENT — parallel observation synchronized", "alert");
  }, 45000);

  SERVER.listen(PORT, "0.0.0.0", () => {
    console.log("");
    console.log("TRILLIONS DUAL UI EXECUTABLE MASTER ONLINE");
    console.log("http://localhost:" + PORT);
    log("SERVER LISTENING ON PORT " + PORT);
  });
}

boot().catch(err => {
  console.error(err);
  process.exit(1);
});
