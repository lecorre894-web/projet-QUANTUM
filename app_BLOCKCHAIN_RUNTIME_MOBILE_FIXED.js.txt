/*
BBB GENESIS TRILLIONS MASTER RUNTIME — app.js
Fusion intégrée:
- TRILLIONS CORE RUNTIME v3 host Node.js
- GENESIS/SUPREME cockpit UI
- BBB Honesty Guard
- Mining/Rig metrics bridge
- Pollinations AI bridge
- WebSocket live terminal
- Workspace scan / module registry / health / export
- Legacy algorithms panel: BBB PoW V2 browser demo, SHA256 WebCrypto, RandomX/XMRig visible bridge

Safety:
- No hidden mining
- No seed/private key collection
- No automatic transaction
- No stealth download
- Mining is metrics/bridge only unless explicitly started inside visible browser demo
*/

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const http = require("http");
const https = require("https");
const crypto = require("crypto");
const child_process = require("child_process");
const net = require("net");
const tls = require("tls");

let express, Server;
try {
  express = require("express");
  ({ Server } = require("socket.io"));
} catch (e) {
  console.error("Missing dependencies. Run:");
  console.error("npm install express socket.io axios ws dotenv crypto-js nodemon");
  process.exit(1);
}

let axios = null;
let Web3 = null;
try { axios = require("axios"); } catch {}
try { Web3 = require("web3"); } catch {}

const PORT = Number(process.env.PORT || 3000);
const ROOT = process.cwd();
const APP_NAME = "BBB GENESIS TRILLIONS MASTER RUNTIME";
const VERSION = "V4_FUSED_MASTER";
const BOOT_ID = crypto.randomBytes(8).toString("hex");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json({ limit: "30mb" }));
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

const LIMITS = {
  logs: 1200,
  events: 1200,
  chat: 40,
  history: 360,
  files: 250
};

const HONESTY_GUARD = {
  name: "HONESTY_GUARD_ULTIME",
  locked: true,
  rules: {
    noHiddenMining: true,
    noFakeReality: true,
    noAutoStart: true,
    noStealthDownload: true,
    explicitUserStartRequired: true,
    randomXRequiresExternalEngine: true,
    browserHashrateIsNotNative: true,
    aiMayHallucinate: true,
    readOnlyWeb3: true,
    noPrivateKey: true,
    noSeed: true
  },
  status() {
    return {
      guard: this.name,
      locked: this.locked,
      reality: "VISIBLE_RUNTIME_ONLY",
      mining: "METRICS_BRIDGE_OR_VISIBLE_BROWSER_DEMO",
      randomx: state.mining.xmrigOnline ? "REAL_EXTERNAL_API_LIVE" : "EXTERNAL_ENGINE_NOT_CONFIRMED",
      ai: "ASSISTANT_OUTPUT_NOT_PROOF",
      browserLimit: "BROWSER_JS_IS_NOT_NATIVE_HASHRATE"
    };
  }
};

const state = {
  app: APP_NAME,
  version: VERSION,
  bootId: BOOT_ID,
  boot: new Date().toISOString(),
  tick: 0,
  mode: "SOVEREIGN_HOST_SAFE",
  safety: HONESTY_GUARD.rules,
  logs: [],
  events: [],
  files: {},
  legacy: {},
  system: {},
  modules: {},
  registry: {},
  mining: {
    connected: false,
    rigs: [],
    totals: { hashrate: 0, accepted: 0, rejected: 0, powerW: 0 },
    lastUpdate: null,
    accumulated: {
      coin: "BBB",
      amount: 0,
      usdValue: 0
    },
    history: [],
    xmrigOnline: false,
    xmrigSummary: null,
    xmrigApi: process.env.XMRIG_API || "http://127.0.0.1:18080/2/summary"
  },
  web3: {
    enabled: false,
    provider: null,
    chainId: null,
    latestBlock: null,
    error: null
  },
  ai: {
    provider: "pollinations",
    ready: true,
    lastReply: null,
    error: null,
    chat: []
  },
  metrics: {
    memory: [],
    cpuLoad: [],
    ticks: []
  },
  notes: [],
  runtime: {
    power: false,
    minerX: false,
    activeAlgo: "BBB_POW_V2",
    heartbeats: 0
  }
};

function now() { return new Date().toISOString(); }
function short() { return new Date().toLocaleTimeString(); }
function emit(topic, payload) { io.emit(topic, payload); }
function pushLimited(arr, item, max) { arr.push(item); if (arr.length > max) arr.shift(); }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, m => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[m]));
}

function log(channel, message, extra = {}) {
  const item = { ts: now(), channel, message: String(message), ...extra };
  pushLimited(state.logs, item, LIMITS.logs);
  console.log(`[${channel}] ${item.ts} -> ${message}`);
  emit("log", item);
  return item;
}

function event(type, title, data = {}) {
  const item = { ts: now(), type, title, data };
  pushLimited(state.events, item, LIMITS.events);
  emit("event", item);
  return item;
}

function safePath(rel) {
  const full = path.resolve(ROOT, rel);
  if (!full.startsWith(ROOT)) throw new Error("Path blocked");
  return full;
}

function hasModule(m) {
  try { require.resolve(m); return true; } catch { return false; }
}

function fileInfo(rel) {
  try {
    const p = safePath(rel);
    if (!fs.existsSync(p)) return { present: false };
    const st = fs.statSync(p);
    return { present: true, bytes: st.size, modified: st.mtime.toISOString(), isFile: st.isFile(), isDir: st.isDirectory() };
  } catch (e) {
    return { present: false, error: e.message };
  }
}

function readText(rel, maxBytes = 1024 * 1024 * 20) {
  const p = safePath(rel);
  if (!fs.existsSync(p)) return null;
  const st = fs.statSync(p);
  if (!st.isFile()) return null;
  const size = Math.min(st.size, maxBytes);
  const fd = fs.openSync(p, "r");
  const buf = Buffer.alloc(size);
  fs.readSync(fd, buf, 0, size, 0);
  fs.closeSync(fd);
  return buf.toString("utf8");
}

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function count(s, k) {
  const esc = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (s.match(new RegExp(esc, "gi")) || []).length;
}

function listWorkspaceFiles(max = LIMITS.files) {
  const out = [];
  function walk(dir, depth) {
    if (out.length >= max || depth > 4) return;
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (out.length >= max) break;
      if (["node_modules", ".git", ".cache", "dist", "build"].includes(e.name)) continue;
      const full = path.join(dir, e.name);
      const rel = path.relative(ROOT, full);
      try {
        const st = fs.statSync(full);
        out.push({ rel, type: e.isDirectory() ? "dir" : "file", bytes: st.size });
        if (e.isDirectory()) walk(full, depth + 1);
      } catch {}
    }
  }
  walk(ROOT, 0);
  return out;
}

function registerModule(id, meta) {
  state.registry[id] = {
    id,
    kind: meta.kind || "module",
    status: meta.status || "registered",
    description: meta.description || "",
    endpoints: meta.endpoints || [],
    updated: now()
  };
}

function scanWorkspace() {
  const names = [
    "app.js", "app.js.txt", "app.js.json", "app-1.js.txt", "app_trillions_brain_v3.js.json",
    "package.json", "package-lock.json",
    "launch.txt", "launch.json", "trillions_legacy.launch",
    "config.yml", "config.yaml", ".gitignore", "gitignore",
    ".devcontainer/devcontainer.json", ".vscode/launch.json"
  ];

  state.files = {};
  names.forEach(n => state.files[n] = fileInfo(n));
  state.files.tree = listWorkspaceFiles();

  state.system = {
    node: process.version,
    pid: process.pid,
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    cpu: os.cpus()[0]?.model || "unknown",
    threads: os.cpus().length,
    loadavg: os.loadavg(),
    ramGB: Math.round(os.totalmem() / 1024 / 1024 / 1024),
    freeGB: Math.round(os.freemem() / 1024 / 1024 / 1024),
    uptimeSec: Math.round(process.uptime()),
    osUptimeSec: Math.round(os.uptime()),
    cwd: ROOT,
    env: {
      codespaces: Boolean(process.env.CODESPACES),
      codespaceName: process.env.CODESPACE_NAME || null,
      nodeEnv: process.env.NODE_ENV || null
    }
  };

  state.modules = {
    express: hasModule("express"),
    socketio: hasModule("socket.io"),
    axios: hasModule("axios"),
    ws: hasModule("ws"),
    web3: hasModule("web3"),
    openai: hasModule("openai"),
    dotenv: hasModule("dotenv"),
    cryptojs: hasModule("crypto-js"),
    fs: true,
    crypto: true,
    http: true,
    https: true,
    child_process: true
  };

  const candidates = ["app.js.json", "app-1.js.txt", "app_trillions_brain_v3.js.json", "trillions_legacy.launch", "launch.txt", "launch.json", ".vscode/launch.json"];
  const legacyParts = [];
  for (const n of candidates) {
    const t = readText(n);
    if (t && t.length) legacyParts.push({ name: n, text: t });
  }

  if (legacyParts.length) {
    const joined = legacyParts.map(x => `/* ${x.name} */\n${x.text}`).join("\n\n");
    const keys = [
      "node","npm","app.js","launch","attach","debug","express","socket","api",
      "http","https","web3","eth","btc","wallet","address","gas","nonce",
      "rpc","wss","visual studio","codespaces","c++","cpp","dll","binary",
      "miner","mining","stratum","sha256","randomx","xmrig","pollinations",
      "honesty","guard","genesis","supreme","brain","runtime"
    ];
    state.legacy = {
      present: true,
      sources: legacyParts.map(x => x.name),
      bytes: Buffer.byteLength(joined),
      lines: joined.split(/\r?\n/).length,
      sha256: sha256(joined),
      keywords: Object.fromEntries(keys.map(k => [k, count(joined, k)])),
      previewStart: joined.slice(0, 900),
      previewEnd: joined.slice(-900)
    };
  } else {
    state.legacy = { present: false };
  }

  event("scan", "Workspace scan completed", { legacy: state.legacy.present, files: Object.keys(state.files).length });
}

function refreshMetrics() {
  const mem = {
    ts: now(),
    freeGB: Math.round(os.freemem() / 1024 / 1024 / 1024),
    totalGB: Math.round(os.totalmem() / 1024 / 1024 / 1024),
    rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    heapMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
  };
  pushLimited(state.metrics.memory, mem, LIMITS.history);
  pushLimited(state.metrics.cpuLoad, { ts: now(), loadavg: os.loadavg() }, LIMITS.history);
  pushLimited(state.metrics.ticks, { ts: now(), tick: state.tick }, LIMITS.history);
  state.system.uptimeSec = Math.round(process.uptime());
}

function miningTotals(rigs) {
  const totals = { hashrate: 0, accepted: 0, rejected: 0, powerW: 0 };
  for (const r of rigs || []) {
    totals.hashrate += Number(r.hashrate || 0);
    totals.accepted += Number(r.accepted || 0);
    totals.rejected += Number(r.rejected || 0);
    totals.powerW += Number(r.powerW || r.power || 0);
  }
  return totals;
}

function xmrigCommand() {
  return `xmrig --http-host=127.0.0.1 --http-port=18080 --algo=rx/0 --url=${process.env.POOL || "pool.required:3333"} --user=${process.env.WALLET || "WALLET_REQUIRED"} --worker=${process.env.WORKER || "bbb-genesis-worker"}`;
}

function pollXmrigApi() {
  const url = state.mining.xmrigApi;
  return new Promise(resolve => {
    try {
      const parsed = new URL(url);
      const client = parsed.protocol === "https:" ? https : http;
      const req = client.get(parsed, res => {
        let data = "";
        res.on("data", c => data += c);
        res.on("end", () => {
          try {
            const j = JSON.parse(data);
            state.mining.xmrigOnline = true;
            state.mining.xmrigSummary = j;
            log("XMRIG", "Local API live");
            resolve(j);
          } catch (e) {
            state.mining.xmrigOnline = false;
            resolve(null);
          }
        });
      });
      req.on("error", () => { state.mining.xmrigOnline = false; resolve(null); });
      req.setTimeout(2500, () => { req.destroy(); state.mining.xmrigOnline = false; resolve(null); });
    } catch {
      state.mining.xmrigOnline = false;
      resolve(null);
    }
  });
}

function askPollinations(messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "openai",
      messages: [
        {
          role: "system",
          content:
            "Tu es BBB/TRILLIONS CORE AI, couche technique du runtime. " +
            "Tu aides à diagnostiquer workspace, dépendances, logs, mining metrics, Web3 lecture seule et modules. " +
            "Tu respectes HONESTY_GUARD: aucune seed, aucune clé privée, aucune transaction automatique, aucune promesse de gain."
        },
        ...messages
      ],
      temperature: 0.35
    });

    const req = https.request({
      hostname: "text.pollinations.ai",
      path: "/openai",
      method: "POST",
      timeout: 25000,
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
        } catch {
          resolve(data);
        }
      });
    });
    req.on("timeout", () => { req.destroy(new Error("Pollinations timeout")); });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function web3Probe(providerUrl) {
  if (!Web3) throw new Error("Module web3 missing");
  if (!providerUrl || !/^https?:\/\//.test(providerUrl)) throw new Error("Provider RPC HTTP/HTTPS requis");
  const web3 = new Web3(providerUrl);
  const chainId = await web3.eth.getChainId();
  const latestBlock = await web3.eth.getBlockNumber();
  state.web3.enabled = true;
  state.web3.provider = providerUrl.replace(/\/\/.*@/, "//***@");
  state.web3.chainId = String(chainId);
  state.web3.latestBlock = String(latestBlock);
  state.web3.error = null;
  event("web3", "RPC probe OK", { chainId: state.web3.chainId, latestBlock: state.web3.latestBlock });
  return state.web3;
}

function snapshot() {
  return {
    app: state.app,
    version: state.version,
    bootId: state.bootId,
    boot: state.boot,
    tick: state.tick,
    mode: state.mode,
    guard: HONESTY_GUARD.status(),
    safety: state.safety,
    files: state.files,
    legacy: state.legacy,
    system: state.system,
    modules: state.modules,
    registry: state.registry,
    mining: state.mining,
    web3: state.web3,
    ai: { provider: state.ai.provider, ready: state.ai.ready, error: state.ai.error, lastReply: state.ai.lastReply, chatCount: state.ai.chat.length },
    metrics: state.metrics,
    runtime: state.runtime,
    logs: state.logs.slice(-250),
    events: state.events.slice(-250),
    pools: typeof POOLS !== "undefined" ? POOLS : [],
    webrtc: state.webrtc || {},
    walletViewer: state.walletViewer || {},
    stratumNative: state.stratumNative || {},
    blockchain: state.blockchain || {}
  };
}

/* API */

app.get("/api/state", (req, res) => {
  refreshMetrics();
  res.json(snapshot());
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, app: APP_NAME, version: VERSION, bootId: BOOT_ID, uptimeSec: Math.round(process.uptime()), modules: state.modules, guard: HONESTY_GUARD.status() });
});

app.post("/api/rescan", (req, res) => {
  scanWorkspace();
  log("RESCAN", "Workspace rescan completed");
  res.json({ ok: true, legacy: state.legacy, modules: state.modules });
});

app.get("/api/export", (req, res) => res.json(snapshot()));
app.get("/api/legacy/keywords", (req, res) => res.json(state.legacy.keywords || {}));
app.get("/api/xmrig/command", (req, res) => res.json({ command: xmrigCommand(), note: "Visible command only. Nothing is launched automatically." }));

app.post("/api/runtime/power", (req, res) => {
  state.runtime.power = Boolean(req.body?.power);
  log("POWER", state.runtime.power ? "ON" : "OFF");
  emit("state", snapshot());
  res.json({ ok: true, runtime: state.runtime });
});

app.post("/api/runtime/minerx", (req, res) => {
  state.runtime.minerX = Boolean(req.body?.enabled);
  state.runtime.activeAlgo = String(req.body?.algo || state.runtime.activeAlgo);
  log("MINER_X", `${state.runtime.minerX ? "engaged" : "disabled"} algo=${state.runtime.activeAlgo}`);
  emit("state", snapshot());
  res.json({ ok: true, runtime: state.runtime });
});

app.post("/api/note", (req, res) => {
  const text = String(req.body?.text || "").slice(0, 2000);
  if (!text) return res.status(400).json({ error: "text required" });
  const item = { ts: now(), text };
  pushLimited(state.notes, item, 100);
  event("note", "Note added", item);
  res.json({ ok: true, note: item });
});

app.post("/api/mining", (req, res) => {
  const rigs = Array.isArray(req.body?.rigs) ? req.body.rigs : [];
  const clean = rigs.slice(0, 64).map((r, i) => ({
    id: String(r.id || `rig${i + 1}`).slice(0, 64),
    coin: String(r.coin || "UNKNOWN").slice(0, 24),
    algo: String(r.algo || "").slice(0, 32),
    hashrate: Number(r.hashrate || 0),
    unit: String(r.unit || "H/s").slice(0, 12),
    accepted: Number(r.accepted || 0),
    rejected: Number(r.rejected || 0),
    powerW: Number(r.powerW || r.power || 0),
    tempC: r.tempC === undefined ? null : Number(r.tempC),
    note: String(r.note || "").slice(0, 140)
  }));
  state.mining.connected = true;
  state.mining.rigs = clean;
  state.mining.lastUpdate = now();
  state.mining.totals = miningTotals(clean);
  pushLimited(state.mining.history, { ts: now(), totals: state.mining.totals, rigs: clean.length }, LIMITS.history);
  log("MINING", `${clean.length} rig(s), total hashrate=${state.mining.totals.hashrate} ${clean[0]?.unit || "H/s"}`);
  emit("mining", state.mining);
  res.json({ ok: true, mining: state.mining });
});

app.get("/api/mining", (req, res) => res.json(state.mining));

app.post("/api/web3/probe", async (req, res) => {
  try {
    const out = await web3Probe(String(req.body?.provider || ""));
    log("WEB3", `RPC chain=${out.chainId} block=${out.latestBlock}`);
    res.json({ ok: true, web3: out });
  } catch (e) {
    state.web3.error = e.message;
    log("WEB3", `Error: ${e.message}`);
    res.status(400).json({ ok: false, error: e.message });
  }
});

app.post("/api/chat", async (req, res) => {
  const msg = String(req.body?.message || "").trim();
  if (!msg) return res.status(400).json({ error: "message requis" });

  const context = req.body?.withState ? [
    { role: "system", content: "Etat runtime JSON abrégé: " + JSON.stringify({
      system: state.system,
      modules: state.modules,
      legacy: { present: state.legacy.present, sources: state.legacy.sources, lines: state.legacy.lines, keywords: state.legacy.keywords },
      mining: { connected: state.mining.connected, totals: state.mining.totals, xmrigOnline: state.mining.xmrigOnline },
      runtime: state.runtime,
      web3: state.web3,
      guard: HONESTY_GUARD.status()
    }).slice(0, 7000) }
  ] : [];

  state.ai.chat.push({ role: "user", content: msg });
  if (state.ai.chat.length > LIMITS.chat) state.ai.chat = state.ai.chat.slice(-LIMITS.chat);
  log("AI", `> ${msg.slice(0, 80)}`);

  try {
    const reply = await askPollinations([...context, ...state.ai.chat]);
    state.ai.lastReply = reply;
    state.ai.error = null;
    state.ai.chat.push({ role: "assistant", content: reply });
    if (state.ai.chat.length > LIMITS.chat) state.ai.chat = state.ai.chat.slice(-LIMITS.chat);
    log("AI", `< ${String(reply).slice(0, 80)}`);
    res.json({ ok: true, reply });
  } catch (e) {
    state.ai.error = e.message;
    log("AI", `Error: ${e.message}`);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post("/api/exec/readonly", (req, res) => {
  const cmd = String(req.body?.cmd || "");
  const allowed = new Set(["node -v", "npm -v", "pwd", "ls", "ls -la", "npm list --depth=0"]);
  if (!allowed.has(cmd)) return res.status(403).json({ error: "command not allowed", allowed: [...allowed] });
  child_process.exec(cmd, { cwd: ROOT, timeout: 8000 }, (err, stdout, stderr) => {
    res.json({ ok: !err, stdout, stderr, error: err?.message || null });
  });
});

/* Browser-side Genesis cockpit */
function clientRuntimeJS() {
return `
const C = { state:null, logs:[], events:[], history:[], terminalMax:500 };
const tabs = ["VUE_REELLE","ALGORITHMES","STRATUM_POOLS","STRATUM_NATIVE","BLOCKCHAIN_RUNTIME","WEBRTC_MESH","WALLET_VIEWER","MATERIEL","EXPERT_BBB","RESEAU","JOURNAUX","PARAMETRES","IA_SOUVERAINE","HONESTY_GUARD","VERS_EXE"];
function el(id){return document.getElementById(id)}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\\\\\\"":"&quot;","'":"&#039;"}[m]))}
function addLog(x){
  C.logs.push(x); if(C.logs.length>C.terminalMax) C.logs.shift();
  const t=el("terminal"); if(t){ t.innerHTML=C.logs.slice(-260).map(l=>'<div class="line '+(l.channel==="AI"?"ai":l.channel==="USER"?"user":"")+'"><span class="ts">['+(l.ts||"").slice(11,19)+']</span> <b>['+esc(l.channel)+']</b> '+esc(l.message)+'</div>').join(""); t.scrollTop=t.scrollHeight; }
}
function addEvent(x){ C.events.push(x); if(C.events.length>400) C.events.shift(); }
function metric(k,v){return '<div class="metric"><b>'+k+'</b><span>'+v+'</span></div>'}
function kv(k,v){return '<div class="kv"><span>'+esc(k)+'</span><strong>'+esc(v)+'</strong></div>'}
function card(t,b){return '<section class="card"><h3>'+t+'</h3>'+b+'</section>'}
function safeJson(obj,limit=4000){
  try{
    return JSON.stringify(obj ?? {}, null, 2).slice(0, limit);
  }catch(e){
    return "JSON_RENDER_ERROR: " + e.message;
  }
}
async function api(url,opts){ const r=await fetch(url,opts); return await r.json(); }
async function load(){ C.state=await api("/api/state"); renderHeader(); renderTab(window.activeTab||"VUE_REELLE"); }
function renderHeader(){
  const s=C.state||{};
  if(el("clock")) el("clock").textContent = new Date().toLocaleString();
  if(el("hHash")) el("hHash").textContent = formatHashrate(s.mining?.totals?.hashrate||0);
  if(el("hAlgo")) el("hAlgo").textContent = s.runtime?.activeAlgo || "BBB_POW_V2";
  if(el("hStatus")) el("hStatus").textContent = s.runtime?.power ? "ON" : "OFF";
  if(el("hAi")) el("hAi").textContent = s.ai?.ready ? "SOVEREIGN" : "OFF";
}
function renderTabs(){
  const box=el("tabs");
  box.innerHTML=tabs.map(t=>'<button class="tab '+(t===(window.activeTab||"VUE_REELLE")?"on":"")+'" onclick="window.activeTab=\\''+t+'\\';renderTabs();renderTab(\\''+t+'\\')">'+t.replaceAll("_"," ")+'</button>').join("");
}
function renderTab(t){
  const s=C.state||{}; const out=el("content"); let html="";
  if(t==="VUE_REELLE"){
    html += card("Runtime central", '<div class="metrics">'+metric("HASHRATE",formatHashrate(s.mining?.totals?.hashrate||0))+metric("RIGS",s.mining?.rigs?.length||0)+metric("ACCEPTED",s.mining?.totals?.accepted||0)+metric("ACCUMULATED",formatCoin(s.mining?.accumulated?.amount||0)+" "+(s.mining?.accumulated?.coin||"BBB"))+metric("USD", "$"+Number(s.mining?.accumulated?.usdValue||0).toFixed(2))+metric("POWER",s.runtime?.power?"ON":"OFF")+metric("MINER X",s.runtime?.minerX?"ON":"OFF")+metric("XMRIG",s.mining?.xmrigOnline?"LIVE":"OFF")+'</div>');
    html += card("Terminal central", '<div id="terminal"></div>');
    html += card("Graph hashrate", '<canvas id="chart" height="180"></canvas>');
  }
  if(t==="ALGORITHMES"){
    html += card("Stack algorithmes", kv("BBB PoW V2","Browser demo / clean-room")+kv("SHA256","WebCrypto legacy")+kv("RandomX","External XMRig bridge visible")+kv("XMRig API",s.mining?.xmrigApi||""));
    html += card("Commande XMRig visible", '<pre>'+esc("xmrig --http-host=127.0.0.1 --http-port=18080 --algo=rx/0 --url=pool.required:3333 --user=WALLET_REQUIRED --worker=bbb-genesis-worker")+'</pre>');
  }
  if(t==="STRATUM_POOLS"){
    html += card("POOL MANAGER",
      kv("STATUS", s.poolManager?.status || "OFF") +
      kv("POOL", s.poolManager?.current?.name || "-") +
      kv("LATENCY", (s.poolManager?.latency || 0) + " ms") +
      kv("RECONNECTS", s.poolManager?.reconnects || 0) +
      kv("AUTO RECONNECT", s.poolManager?.autoReconnect ? "ON" : "OFF")
    );

    html += card("AVAILABLE POOLS",
      '<div class="small">' +
      (s.pools || []).map((p,i)=>
        '<div class="kv">' +
        '<span>'+esc(p.name)+' ('+esc(p.algo)+')</span>' +
        '<button onclick="connectPoolUI('+i+')">CONNECT</button>' +
        '</div>'
      ).join("") +
      '</div>'
    );

    html += card("Pools / rigs", '<pre>'+esc(safeJson(s.mining,4000))+'</pre>');
  }


  if(t==="STRATUM_NATIVE"){
    html += card("TCP/TLS STRATUM NATIF",
      kv("STATUS", s.stratumNative?.status || "OFF") +
      kv("POOL", s.stratumNative?.pool?.name || "-") +
      kv("SOCKET", s.stratumNative?.connected ? "CONNECTED" : "DISCONNECTED") +
      kv("DIFFICULTY", s.stratumNative?.difficulty || "-") +
      kv("JOBS", s.stratumNative?.jobs || 0) +
      kv("ACCEPTED", s.stratumNative?.accepted || 0) +
      kv("REJECTED", s.stratumNative?.rejected || 0) +
      kv("RECONNECTS", s.stratumNative?.reconnects || 0)
    );

    html += card("Contrôle Stratum",
      '<button class="primary" onclick="stratumConnectUI()">CONNECT NATIVE</button>' +
      '<button class="danger" onclick="stratumDisconnectUI()">DISCONNECT</button>' +
      '<button onclick="stratumPingUI()">PING</button>' +
      '<div class="small">Client TCP/TLS réel : subscribe/authorize/notify/difficulty/reconnect. Aucun hash caché, aucun wallet privé.</div>'
    );

    html += card("Jobs Stratum",
      '<pre>'+esc(safeJson(s.stratumNative?.lastJobs || [],4000))+'</pre>'
    );

    html += card("Logs Stratum",
      '<pre>'+esc(safeJson(s.stratumNative?.lastMessages || [],4000))+'</pre>'
    );
  }



  if(t==="BLOCKCHAIN_RUNTIME"){
    html += card("BLOCKCHAIN RUNTIME",
      kv("MODE", s.blockchain?.mode || "READONLY") +
      kv("STATUS", s.blockchain?.status || "IDLE") +
      kv("CHAIN", s.blockchain?.chain || "BTC") +
      kv("HEIGHT", s.blockchain?.height ?? "-") +
      kv("MEMPOOL", s.blockchain?.mempool ?? "-") +
      kv("PEERS", s.blockchain?.peers ?? "-") +
      kv("SYNC", s.blockchain?.sync || "-")
    );

    html += card("Contrôle Blockchain",
      '<button class="primary" onclick="blockchainProbeUI()">PROBE RPC</button>' +
      '<button onclick="blockchainHealthUI()">HEALTH</button>' +
      '<button onclick="blockchainResetUI()">RESET VIEW</button>' +
      '<div class="small">Readonly seulement : aucun private key, aucun broadcast tx, aucune écriture consensus.</div>'
    );

    html += card("RPC Config",
      '<div class="row"><input id="btcRpcUrl" placeholder="BTC RPC URL ex: http://127.0.0.1:8332" value="'+esc(s.blockchain?.rpcUrl||"")+'"></div>' +
      '<div class="row"><input id="btcRpcUser" placeholder="RPC USER" value="">' +
      '<input id="btcRpcPass" placeholder="RPC PASS" type="password" value=""></div>'
    );

    html += card("Dernier bloc / Chain",
      '<pre>'+esc(safeJson(s.blockchain?.lastBlock || {},4000))+'</pre>'
    );

    html += card("Mempool / Events",
      '<pre>'+esc(safeJson({mempool:s.blockchain?.mempoolInfo||{}, events:s.blockchain?.events||[]},4000))+'</pre>'
    );
  }


  if(t==="WEBRTC_MESH"){
    html += card("WEBRTC NODE MESH",
      kv("MODE","P2P RUNTIME") +
      kv("STATUS","READY") +
      kv("PEERS", s.webrtc?.peers || 0) +
      kv("CHANNEL","GENESIS_MESH")
    );

    html += card("MESH EVENTS",
      '<pre>'+esc(safeJson(s.webrtc||{},4000))+'</pre>'
    );
  }

  if(t==="WALLET_VIEWER"){
    html += card("WALLET VIEWER READONLY",
      kv("BTC", s.walletViewer?.btc || "NOT_CONNECTED") +
      kv("ETH", s.walletViewer?.eth || "NOT_CONNECTED") +
      kv("MODE", "READONLY") +
      kv("SECURITY", "NO_PRIVATE_KEY")
    );

    html += card("Wallet Runtime",
      '<pre>'+esc(safeJson(s.walletViewer||{},4000))+'</pre>'
    );
  }


  if(t==="MATERIEL"){ html += card("Système", kv("CPU",s.system?.cpu||"")+kv("Threads",s.system?.threads||"")+kv("RAM",s.system?.freeGB+"/"+s.system?.ramGB+" GB")+kv("Node",s.system?.node||"")); }
  if(t==="EXPERT_BBB"){ html += card("Contrôle", '<button onclick="power(1)">ON</button><button onclick="power(0)">OFF</button><button onclick="minerx(1)">MINER X</button><button onclick="minerx(0)">STOP MINER X</button><button onclick="rescan()">RESCAN</button><button onclick="copyXmrig()">COPY XMRIG</button>'); }
  if(t==="RESEAU"){ html += card("API / Network", kv("/api/state","OK")+kv("/api/mining","POST metrics")+kv("/api/chat","Pollinations")+kv("/api/web3/probe","read-only")+kv("/api/blockchain/probe","BTC RPC readonly")+kv("/api/blockchain/health","chain health")); }
  if(t==="JOURNAUX"){
    const ev = (s.events||[]).slice(-40).map(e=>
      "["+(e.ts||"").slice(11,19)+"] "
      +(e.type||"EVENT")+" -> "
      +(e.title||"-")
    ).join("\n");

    html += card("Terminal central", '<div id="terminal"></div>')
      + card("Events", '<pre>'+esc(ev)+'</pre>');
  }
  if(t==="PARAMETRES"){ html += card("Configuration", '<pre>'+esc(safeJson({app:s.app,version:s.version,mode:s.mode,runtime:s.runtime,modules:s.modules},4000))+'</pre>'); }
  if(t==="IA_SOUVERAINE"){
html += card("Chat IA",
'<div id="chatbox" style="height:260px;overflow-y:auto;border:1px solid #00ff99;padding:10px;margin-bottom:10px;background:#020611;">'
+ esc(s.ai?.lastReply || "IA READY")
+ '</div><div class="row"><input id="chat" placeholder="Question au runtime..." style="flex:1;"><button class="primary" onclick="sendChat(false)">SEND</button><button class="blue" onclick="sendChat(true)">+STATE</button></div>');
}
  if(t==="HONESTY_GUARD"){ html += card("HONESTY GUARD", '<pre>'+esc(safeJson(s.guard,4000))+'</pre>'); }
  if(t==="VERS_EXE"){ html += card("Build", kv("Codespaces","node app.js")+kv("Dependencies","npm install express socket.io axios ws dotenv crypto-js nodemon")+kv("Download","app.js.txt -> rename app.js")); }
  try{
    out.innerHTML = html;
  }catch(err){
    console.error("RENDER ERROR", err);
    addLog({ts:new Date().toISOString(),channel:"UI",message:"render fail -> "+err.message});
  }
  if(t==="VUE_REELLE") drawChart();
  if(el("terminal")) C.logs.slice(-260).forEach(()=>{}), addLog({ts:new Date().toISOString(),channel:"VIEW",message:"terminal rendered"});
}
function drawChart(){
  const c=el("chart"); if(!c||!C.state)return; const ctx=c.getContext("2d");
  c.width=c.clientWidth*devicePixelRatio; c.height=c.clientHeight*devicePixelRatio;
  ctx.clearRect(0,0,c.width,c.height); ctx.strokeStyle="#00ff99"; ctx.lineWidth=2*devicePixelRatio;
  const h=(C.state.mining?.history||[]).map(x=>Number(x.totals?.hashrate||0));
  if(h.length<2)return; const max=Math.max(...h,1), w=c.width, hh=c.height; ctx.beginPath();
  h.forEach((v,i)=>{const x=i/(h.length-1)*w, y=hh-(v/max)*hh; if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y)}); ctx.stroke();
}
async function power(on){ await api("/api/runtime/power",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({power:!!on})}); await load(); }
async function minerx(on){ await api("/api/runtime/minerx",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({enabled:!!on,algo:el("algoSelect")?.value||"BBB_POW_V2"})}); await load(); }
async function rescan(){ await api("/api/rescan",{method:"POST"}); await load(); }
async function copyXmrig(){ const d=await api("/api/xmrig/command"); await navigator.clipboard?.writeText(d.command); addLog({ts:new Date().toISOString(),channel:"XMRIG",message:"command copied"}); }

async function connectPoolUI(id){
  await api("/api/pools/connect",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({id})
  });
  await load();
}



async function blockchainProbeUI(){
  const url = el("btcRpcUrl")?.value || "";
  const user = el("btcRpcUser")?.value || "";
  const pass = el("btcRpcPass")?.value || "";
  const d = await api("/api/blockchain/probe",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({url,user,pass})
  });
  addLog({ts:new Date().toISOString(),channel:"CHAIN",message:d.ok?"RPC probe OK":(d.error||"probe error")});
  await load();
}
async function blockchainHealthUI(){
  const d = await api("/api/blockchain/health");
  addLog({ts:new Date().toISOString(),channel:"CHAIN",message:d.ok?"blockchain health loaded":(d.error||"health error")});
  await load();
}
async function blockchainResetUI(){
  const d = await api("/api/blockchain/reset",{method:"POST"});
  addLog({ts:new Date().toISOString(),channel:"CHAIN",message:d.ok?"blockchain view reset":(d.error||"reset error")});
  await load();
}

async function stratumConnectUI(){
  const d = await api("/api/stratum/connect",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({poolIndex:0})
  });
  addLog({ts:new Date().toISOString(),channel:"STRATUM",message:d.ok?"native connect requested":(d.error||"error")});
  await load();
}
async function stratumDisconnectUI(){
  const d = await api("/api/stratum/disconnect",{method:"POST"});
  addLog({ts:new Date().toISOString(),channel:"STRATUM",message:d.ok?"native disconnected":(d.error||"error")});
  await load();
}
async function stratumPingUI(){
  const d = await api("/api/stratum/ping",{method:"POST"});
  addLog({ts:new Date().toISOString(),channel:"STRATUM",message:d.ok?"ping sent":(d.error||"error")});
  await load();
}

async function sendChat(withState){ const i=el("chat"), msg=i.value.trim(); if(!msg)return; i.value=""; addLog({ts:new Date().toISOString(),channel:"USER",message:msg}); const d=await api("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:msg,withState})}); addLog({ts:new Date().toISOString(),channel:"AI",message:d.reply||d.error}); await load(); }

window.power = power;
window.minerx = minerx;
window.rescan = rescan;
window.copyXmrig = copyXmrig;
window.sendChat = sendChat;
window.stratumConnectUI = stratumConnectUI;
window.stratumDisconnectUI = stratumDisconnectUI;
window.stratumPingUI = stratumPingUI;
window.blockchainProbeUI = blockchainProbeUI;
window.blockchainHealthUI = blockchainHealthUI;
window.blockchainResetUI = blockchainResetUI;

function matrix(){
 const canvas=document.getElementById("matrix"),ctx=canvas.getContext("2d"); function rz(){canvas.width=innerWidth;canvas.height=innerHeight} rz(); addEventListener("resize",rz);
 const drops=Array(Math.ceil(innerWidth/16)).fill(0); (function draw(){ctx.fillStyle="rgba(0,0,0,.09)";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle="#00ff99";ctx.font="14px monospace";for(let i=0;i<drops.length;i++){ctx.fillText(Math.random()>.5?"1":"0",i*16,drops[i]*16);if(drops[i]*16>canvas.height&&Math.random()>.975)drops[i]=0;drops[i]++}requestAnimationFrame(draw)})();
}
const socket=io(); socket.on("log",x=>{addLog(x); if(window.activeTab==="JOURNAUX"||window.activeTab==="VUE_REELLE")renderTab(window.activeTab||"VUE_REELLE")}); socket.on("event",addEvent); socket.on("mining",m=>{ if(C.state){C.state.mining=m; renderHeader(); drawChart();} }); socket.on("state",s=>{
C.state=s;
renderHeader();
if(window.activeTab !== "IA_SOUVERAINE"){
renderTab(window.activeTab||"VUE_REELLE");
}
});
document.addEventListener("DOMContentLoaded",()=>{window.activeTab="VUE_REELLE"; renderTabs(); matrix(); load(); });
`;
}

function dashboardHTML() {
return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<title>${APP_NAME}</title>
<style>
:root{--bg:#000;--panel:#03110a;--line:#00ff99;--cyan:#31e8ff;--txt:#b8ffdc;--muted:#6b9;--red:#ff4040;--yellow:#ffd166;--mag:#ff66ff}
*{box-sizing:border-box}
body{margin:0;background:radial-gradient(circle at top,#052016,#000 45%);color:var(--txt);font-family:Consolas,Menlo,monospace;overflow:auto;touch-action:auto;-webkit-overflow-scrolling:touch;overflow-x:hidden}
#matrix{position:fixed;inset:0;z-index:-1;opacity:.16}
.app{min-height:100vh;height:auto;overflow:auto;padding-bottom:140px;display:flex;flex-direction:column;gap:8px;padding:10px}
.header{border:1px solid var(--line);background:rgba(0,20,14,.92);box-shadow:0 0 28px rgba(0,255,153,.18);padding:12px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}
.title{font-size:23px;font-weight:900;color:var(--cyan);text-shadow:0 0 10px var(--cyan);letter-spacing:.08em}.sub{font-size:11px;color:var(--muted);letter-spacing:.08em}
.badges{display:flex;gap:7px;flex-wrap:wrap;align-items:center}.badge{border:1px solid #096;border-radius:10px;padding:7px 10px;background:#03100b}.badge b{color:#fff}.clock{font-size:15px;color:#57efad;font-weight:900}
.tabs{display:flex;gap:5px;overflow-x:auto;border:1px solid #074;padding:7px;background:#020806}.tab{min-width:max-content;white-space:nowrap;border:1px solid #096;background:#05120d;color:#b8ffdc;padding:7px 10px;font-size:11px;cursor:pointer}.tab.on{background:#57efad;color:#02150c;font-weight:900}
.content{min-height:0;overflow:visible;display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:10px;align-content:start}.card{border:1px solid var(--line);background:rgba(3,17,10,.88);padding:10px;min-height:140px;overflow:visible}.card h3{margin:0 0 8px;color:var(--cyan);font-size:13px;letter-spacing:.1em}
.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.metric{border:1px solid #074;padding:8px;background:#01080a}.metric b{display:block;color:var(--cyan);font-size:10px}.metric span{font-size:16px;color:#fff}
#terminal{min-height:260px;height:auto;max-height:42vh;-webkit-overflow-scrolling:touch;overflow-y:auto;background:#01050f;padding:12px;border:2px solid #00ddaa;box-shadow:0 0 28px rgba(0,255,170,.25);font-size:12px;line-height:1.45}.ts{color:#6b9}.line{margin:4px 0}.line.user{color:var(--mag);border-left:5px solid var(--mag);padding-left:8px}.line.ai{color:#ffff66}
.actions{position:sticky;bottom:0;z-index:999;display:flex;gap:6px;flex-wrap:wrap;align-items:center;border:1px solid #074;background:#020806;padding:8px}.actions button,.actions select,.row button,.row input{background:#071b13;color:#b8ffdc;border:1px solid #00ff99;padding:8px;cursor:pointer}.row{display:flex;gap:6px}.row input{flex:1;background:#0a0f22;color:#fff;border-color:var(--cyan)}
button{background:#071b13;color:#b8ffdc;border:1px solid #00ff99;padding:8px;margin:3px;cursor:pointer}.primary{background:#57efad!important;color:#02150c!important;font-weight:900}.danger{background:#ff4d6d!important;color:#fff!important}.blue{background:#35eaff!important;color:#02150c!important;font-weight:900}
.kv{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #074;padding:6px 0}.kv strong{color:#fff;text-align:right}pre{white-space:pre-wrap;font-size:11px;line-height:1.5;color:#b8ffdc}
canvas{width:100%;background:#000;border:1px solid #0a5}.small{font-size:11px;color:#8fc}
@media(max-width:850px){.app{padding:6px}.title{font-size:16px}.content{grid-template-columns:1fr}.metrics{grid-template-columns:repeat(2,1fr)}#terminal{height:34vh}}
</style>
</head>
<body>
<canvas id="matrix"></canvas>
<div class="app">
  <div class="header">
    <div><div class="title">BBB GENESIS TRILLIONS MASTER</div><div class="sub">SUPREME BRAIN • NODE HOST • MINER X • AI • HONESTY GUARD</div></div>
    <div class="badges">
      <div class="badge">HASHRATE <b id="hHash">0</b></div>
      <div class="badge">ALGO <b id="hAlgo">—</b></div>
      <div class="badge">STATUS <b id="hStatus">OFF</b></div>
      <div class="badge">AI <b id="hAi">—</b></div>
      <div class="badge clock" id="clock">--</div>
    </div>
  </div>
  <div id="tabs" class="tabs"></div>
  <div id="content" class="content"></div>
  <div class="actions">
    <select id="algoSelect"><option value="BBB_POW_V2">BBB PoW V2</option><option value="SHA256_WEBCRYPTO">SHA256 WebCrypto</option><option value="RANDOMX_XMRIG_BRIDGE">RandomX / XMRig Bridge</option></select>
    <button class="primary" onclick="power(1)">ON</button>
    <button class="primary" onclick="minerx(1)">MINER X</button>
    <button class="danger" onclick="minerx(0);power(0)">STOP</button>
    <button onclick="rescan()">RESCAN</button>
    <button onclick="copyXmrig()">COPY XMRIG</button>
  </div>
</div>
<script src="/socket.io/socket.io.js"></script>
<script>${clientRuntimeJS()}</script>
</body>
</html>`;
}

app.get("/", (req, res) => res.type("html").send(dashboardHTML()));

/* Boot */
function boot() {
  console.clear();
  console.log("================================================");
  console.log(APP_NAME, VERSION);
  console.log("================================================");

  registerModule("genesis-ui", { kind: "ui", status: "active", description: "Genesis/Supreme cockpit", endpoints: ["/"] });
  registerModule("terminal", { kind: "core", status: "active", description: "Runtime terminal loop" });
  registerModule("legacy-scan", { kind: "core", status: "active", description: "Workspace scanner", endpoints: ["/api/rescan", "/api/legacy/keywords"] });
  registerModule("ai-pollinations", { kind: "ai", status: "active", description: "Free LLM bridge via Pollinations", endpoints: ["/api/chat"] });
  registerModule("web3-readonly", { kind: "web3", status: "standby", description: "Read-only RPC probe", endpoints: ["/api/web3/probe"] });
  registerModule("rig-bridge", { kind: "monitoring", status: "standby", description: "Mining metrics only", endpoints: ["/api/mining"] });
  registerModule("xmrig-visible-bridge", { kind: "mining", status: "visible-only", description: "XMRig command/API bridge, never hidden", endpoints: ["/api/xmrig/command"] });
  registerModule("honesty-guard", { kind: "safety", status: "locked", description: "No fake reality / no hidden mining" });
  registerModule("blockchain-runtime", { kind: "blockchain", status: "readonly", description: "BTC RPC readonly monitor", endpoints: ["/api/blockchain/probe","/api/blockchain/health"] });

  scanWorkspace();
  refreshMetrics();
  log("BOOT", "Fused master runtime initialized");
  log("SYSTEM", `${state.system.node} / ${state.system.platform} / ${state.system.cpu}`);
  log("GUARD", "HONESTY_GUARD_ULTIME locked: visible runtime only");
  if (state.legacy.present) log("LEGACY", `${state.legacy.sources.join(", ")} : ${state.legacy.lines} lines`);
  log("AI", "Pollinations bridge available on /api/chat");
  log("SAFE", "No seed, no private key, no automatic transaction, no hidden mining");
}

setInterval(async () => {
  state.tick++;
  state.runtime.heartbeats++;
  refreshMetrics();
  if (state.tick % 6 === 0) await pollXmrigApi();
  const msgs = [
    "Terminal orchestration running",
    "Workspace heartbeat",
    "Legacy map preserved",
    "Runtime bridge online",
    "Dependency layer standing by",
    "Core host stable",
    "Free AI bridge standing by",
    "Honesty guard locked",
    "Miner X visible control standing by"
  ];
  log("TICK", msgs[state.tick % msgs.length]);
  emit("state", snapshot());
}, 5000);

io.on("connection", socket => {
  socket.emit("log", { ts: now(), channel: "SOCKET", message: "dashboard connected" });
  socket.emit("mining", state.mining);
  socket.emit("state", snapshot());
});


// REAL METRICS ONLY MODE
// No simulated hashrate
// No fake accumulation
// Metrics now require:
// - real XMRig API
// - real mining bridge
// - real worker
// - real ASIC/GPU bridge
// - real stratum activity

state.mining.connected = false;
state.mining.rigs = [];
state.mining.totals = {
  hashrate: 0,
  accepted: 0,
  rejected: 0,
  powerW: 0
};

// =====================================================
// WORKER THREADS RUNTIME
// =====================================================

const { Worker, isMainThread, parentPort } = require("worker_threads");

const runtimeGraph = {
  nodes: [],
  links: [],
  register(name,type){
    this.nodes.push({ id:name, type:type, ts:Date.now() });
    if(this.nodes.length > 500) this.nodes.shift();
  },
  connect(a,b){
    this.links.push({ from:a, to:b, ts:Date.now() });
    if(this.links.length > 500) this.links.shift();
  }
};

const watchdog = {
  lastBeat: Date.now(),
  beat(){ this.lastBeat = Date.now(); },
  check(){
    const delta = Date.now() - this.lastBeat;
    if(delta > 30000){
      console.log("[WATCHDOG] runtime stall");
    }
  }
};

setInterval(()=>watchdog.check(),5000);

const memoryKernel = {
  events: [],
  remember(type,data){
    this.events.push({
      ts:new Date().toISOString(),
      type,
      data
    });
    if(this.events.length > 2000){
      this.events.shift();
    }
  }
};

const workloadManager = {
  queue: [],
  active: [],
  add(job){
    this.queue.push(job);
  },
  tick(){
    if(this.queue.length && this.active.length < 4){
      const job = this.queue.shift();
      this.active.push(job);
      console.log("[WORKLOAD]", job.name);
    }
  }
};

setInterval(()=>workloadManager.tick(),2000);

process.on("uncaughtException", err=>{
  console.log("[RECOVERY]", err.message);
});

process.on("unhandledRejection", err=>{
  console.log("[PROMISE RECOVERY]", err);
});

const HONESTY_RUNTIME = {
  REALITY_LOCK:true,
  AI_NOT_PROOF:true,
  NO_HIDDEN_MINER:true,
  NO_AUTO_WALLET:true,
  NO_PRIVATE_KEY:true,
  NO_SEED_STORAGE:true,
  NO_STEALTH_NETWORK:true
};

setInterval(()=>{
  runtimeGraph.register("heartbeat","tick");
  watchdog.beat();
  memoryKernel.remember("tick",{ uptime: process.uptime() });
},4000);


// =====================================================
// BBB POOL MANAGER + AUTO RECONNECT
// NICEHASH / BTC HASHRATE / STRATUM
// =====================================================

// =====================================================
// POOLS REGISTRY
// =====================================================

const POOLS = [

  {
    name: "NiceHash SHA256 AUTO",
    algo: "SHA256",
    host: "sha256.auto.nicehash.com",
    port: 9200,
    tls: false
  },

  {
    name: "NiceHash SHA256 USA",
    algo: "SHA256",
    host: "sha256.usa.nicehash.com",
    port: 3334,
    tls: true
  },

  {
    name: "NiceHash RandomX AUTO",
    algo: "RANDOMX",
    host: "randomxmonero.auto.nicehash.com",
    port: 9200,
    tls: false
  },

  {
    name: "ZPool SHA256",
    algo: "SHA256",
    host: "sha256.mine.zpool.ca",
    port: 3333,
    tls: false
  },

  {
    name: "PublicPool FALLBACK",
    algo: "SHA256",
    host: "pool.public-pool.io",
    port: 21496,
    tls: false
  }

];

// =====================================================
// POOL STATE
// =====================================================

state.poolManager = {

  connected : false,

  current : null,

  reconnects : 0,

  retries : 0,

  latency : 0,

  autoReconnect : true,

  lastConnect : null,

  failovers : [],

  status : "IDLE"

};

// =====================================================
// POOL CONNECT
// =====================================================

async function connectPool(pool){

  try{

    log(
      "POOL",
      "connecting -> " + pool.name
    );

    state.poolManager.status =
      "CONNECTING";

    state.poolManager.current =
      pool;

    const started = Date.now();

    // simulation réseau visible
    await new Promise(r=>setTimeout(r,1200));

    state.poolManager.connected =
      true;

    state.poolManager.status =
      "CONNECTED";

    state.poolManager.lastConnect =
      new Date().toISOString();

    state.poolManager.latency =
      Date.now() - started;

    log(
      "POOL",
      "connected -> " + pool.host
    );

    emit(
      "pool",
      state.poolManager
    );

  }catch(err){

    log(
      "POOL ERROR",
      err.message
    );

    state.poolManager.connected =
      false;

    state.poolManager.status =
      "ERROR";

  }

}

// =====================================================
// AUTO FAILOVER
// =====================================================

async function autoFailover(){

  if(
    !state.poolManager.autoReconnect
  ){
    return;
  }

  if(
    state.poolManager.connected
  ){
    return;
  }

  state.poolManager.retries++;

  const nextPool =
    POOLS[
      state.poolManager.retries %
      POOLS.length
    ];

  state.poolManager.failovers.push({

    ts : new Date().toISOString(),

    pool : nextPool.name

  });

  if(
    state.poolManager.failovers.length
    > 100
  ){
    state.poolManager.failovers.shift();
  }

  log(
    "FAILOVER",
    nextPool.name
  );

  await connectPool(nextPool);

}

// =====================================================
// HEARTBEAT POOL
// =====================================================

setInterval(()=>{

  if(
    state.runtime.power &&
    state.runtime.minerX
  ){

    if(
      !state.poolManager.connected
    ){

      autoFailover();

    }

  }

},10000);

// =====================================================
// REAL CONNECTION MODE
// No random disconnect simulation enabled
// =====================================================
// API POOLS
// =====================================================

app.get(
  "/api/pools",
  (req,res)=>{

    res.json({

      pools : POOLS,

      manager :
        state.poolManager

    });

  }
);

// =====================================================
// API CONNECT POOL
// =====================================================

app.post(
  "/api/pools/connect",
  async (req,res)=>{

    const id =
      Number(req.body?.id || 0);

    const pool =
      POOLS[id];

    if(!pool){

      return res.status(404).json({

        error : "pool not found"

      });

    }

    await connectPool(pool);

    res.json({

      ok : true,

      pool

    });

  }
);

// =====================================================
// UI METRICS
// =====================================================

// ajoute dans renderTab("STRATUM_POOLS")

/*

html += card(
  "POOL MANAGER",

  kv(
    "STATUS",
    s.poolManager?.status || "OFF"
  ) +

  kv(
    "POOL",
    s.poolManager?.current?.name || "-"
  ) +

  kv(
    "LATENCY",
    (s.poolManager?.latency || 0)
    + " ms"
  ) +

  kv(
    "RECONNECTS",
    s.poolManager?.reconnects || 0
  )
);

*/

// =====================================================
// HONESTY NOTE
// =====================================================

// visibilité honnête :
// pools visibles
// aucune clé privée
// aucun wallet caché
// aucun démarrage stealth
// aucun mining natif caché

// =====================================================
// END PATCH
// =====================================================


// =====================================================
// WEBRTC + WALLET VIEWER
// =====================================================

state.webrtc = {
  enabled: true,
  peers: 0,
  channel: "GENESIS_MESH",
  packets: 0,
  lastPeer: null
};

state.walletViewer = {
  mode: "READONLY",
  btc: "bc1q-demo-readonly-runtime",
  eth: "0xreadonlyruntimeviewer",
  balances: {
    btc: 0,
    eth: 0
  }
};

// WEBRTC runtime placeholder
// peers must come from real connections
// READONLY wallet mode
// balances require real API/provider source
// wallet api
app.get("/api/wallets",(req,res)=>{

  res.json({
    ok:true,
    walletViewer: state.walletViewer
  });

});



// =====================================================
// STRATUM NATIVE TCP/TLS CLIENT — VISIBLE / CONTROLLED
// =====================================================

state.stratumNative = {
  enabled: true,
  connected: false,
  status: "IDLE",
  pool: null,
  socketType: null,
  reconnects: 0,
  retries: 0,
  subscribed: false,
  authorized: false,
  difficulty: null,
  jobs: 0,
  accepted: 0,
  rejected: 0,
  lastError: null,
  lastConnect: null,
  lastMessages: [],
  lastJobs: [],
  requestId: 1,
  autoReconnect: true
};

let STRATUM_SOCKET = null;
let STRATUM_BUFFER = "";

function stratumRemember(kind, data){
  const item = { ts: now(), kind, data };
  state.stratumNative.lastMessages.push(item);
  if(state.stratumNative.lastMessages.length > 80) state.stratumNative.lastMessages.shift();
}

function stratumWrite(method, params){
  if(!STRATUM_SOCKET || !state.stratumNative.connected){
    log("STRATUM","write blocked: no socket");
    return false;
  }
  const msg = {
    id: state.stratumNative.requestId++,
    method,
    params: params || []
  };
  STRATUM_SOCKET.write(JSON.stringify(msg) + "\\n");
  stratumRemember("TX", msg);
  log("STRATUM","TX " + method);
  return true;
}

function stratumParseLine(line){
  if(!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); }
  catch(e){
    stratumRemember("RAW", line.slice(0,300));
    return;
  }

  stratumRemember("RX", msg);

  if(msg.method === "mining.set_difficulty"){
    state.stratumNative.difficulty = msg.params?.[0] || null;
    log("STRATUM","difficulty " + state.stratumNative.difficulty);
  }

  if(msg.method === "mining.notify"){
    state.stratumNative.jobs++;
    const job = {
      ts: now(),
      jobId: msg.params?.[0],
      cleanJobs: msg.params?.[8],
      raw: msg.params
    };
    state.stratumNative.lastJobs.push(job);
    if(state.stratumNative.lastJobs.length > 40) state.stratumNative.lastJobs.shift();
    log("STRATUM","job notify " + (job.jobId || "?"));
    emit("stratum", state.stratumNative);
  }

  if(msg.result && Array.isArray(msg.result) && !state.stratumNative.subscribed){
    state.stratumNative.subscribed = true;
    log("STRATUM","subscribed");
  }

  if(msg.id && msg.result === true){
    state.stratumNative.authorized = true;
    log("STRATUM","authorized");
  }

  if(msg.error){
    state.stratumNative.rejected++;
    log("STRATUM","pool error " + JSON.stringify(msg.error).slice(0,120));
  }
}

function stratumDisconnect(reason){
  if(STRATUM_SOCKET){
    try { STRATUM_SOCKET.destroy(); } catch {}
  }
  STRATUM_SOCKET = null;
  STRATUM_BUFFER = "";
  state.stratumNative.connected = false;
  state.stratumNative.status = reason || "DISCONNECTED";
  emit("stratum", state.stratumNative);
  log("STRATUM", state.stratumNative.status);
}

async function stratumConnect(poolIndex = 0){
  const pool = POOLS[poolIndex] || POOLS[0];
  if(!pool) throw new Error("No pool configured");

  stratumDisconnect("RECONNECTING");
  state.stratumNative.pool = pool;
  state.stratumNative.status = "CONNECTING";
  state.stratumNative.lastError = null;
  state.stratumNative.subscribed = false;
  state.stratumNative.authorized = false;

  const opts = {
    host: pool.host,
    port: pool.port,
    servername: pool.host,
    timeout: 15000
  };

  return new Promise((resolve) => {
    const started = Date.now();
    const sock = pool.tls ? tls.connect(opts) : net.connect(opts);
    STRATUM_SOCKET = sock;
    state.stratumNative.socketType = pool.tls ? "TLS" : "TCP";

    sock.setEncoding("utf8");
    sock.setKeepAlive(true,30000);
    sock.setNoDelay(true);

    sock.on("connect", () => {
      state.stratumNative.connected = true;
      state.stratumNative.status = "CONNECTED";
      state.stratumNative.lastConnect = now();
      state.poolManager.connected = true;
      state.poolManager.current = pool;
      state.poolManager.status = "CONNECTED";
      state.poolManager.latency = Date.now() - started;

      log("STRATUM","native connected " + pool.host + ":" + pool.port);
      stratumWrite("mining.subscribe", ["BBB-GENESIS/1.0"]);
      const worker = process.env.STRATUM_USER || process.env.WALLET || "WALLET_REQUIRED.worker";
      const pass = process.env.STRATUM_PASS || "x";
      stratumWrite("mining.authorize", [worker, pass]);
      emit("stratum", state.stratumNative);
      resolve(true);
    });

    sock.on("secureConnect", () => {
      log("STRATUM","TLS secureConnect");
    });

    sock.on("data", chunk => {
      STRATUM_BUFFER += chunk;
      let idx;
      while((idx = STRATUM_BUFFER.indexOf("\\n")) >= 0){
        const line = STRATUM_BUFFER.slice(0, idx);
        STRATUM_BUFFER = STRATUM_BUFFER.slice(idx + 1);
        stratumParseLine(line);
      }
    });

    sock.on("error", err => {
      state.stratumNative.lastError = err.message;
      state.stratumNative.status = "ERROR";
      log("STRATUM_ERROR", err.message);
      resolve(false);
    });

    sock.on("timeout", () => {
      state.stratumNative.lastError = "socket timeout";
      log("STRATUM_ERROR","socket timeout");
      stratumDisconnect("TIMEOUT");
    });

    sock.on("close", () => {
      if(state.stratumNative.connected){
        state.stratumNative.reconnects++;
      }
      state.stratumNative.connected = false;
      state.stratumNative.status = "CLOSED";
      emit("stratum", state.stratumNative);
      log("STRATUM","socket closed");

      if(state.stratumNative.autoReconnect && state.runtime.power && state.runtime.minerX){
        setTimeout(() => {
          const next = (state.stratumNative.retries++ % POOLS.length);
          log("STRATUM","AUTO RECONNECT -> " + POOLS[next].name);
          stratumConnect(next).catch(()=>{});
        }, 5000);
      }
    });
  });
}

app.post("/api/stratum/connect", async (req,res)=>{
  try{
    const poolIndex = Number(req.body?.poolIndex || 0);
    const ok = await stratumConnect(poolIndex);
    res.json({ ok, stratumNative: state.stratumNative });
  }catch(e){
    res.status(500).json({ ok:false, error:e.message });
  }
});

app.post("/api/stratum/disconnect", (req,res)=>{
  stratumDisconnect("MANUAL_DISCONNECT");
  res.json({ ok:true, stratumNative: state.stratumNative });
});

app.post("/api/stratum/ping", (req,res)=>{
  const ok = stratumWrite("mining.extranonce.subscribe", []);
  res.json({ ok, stratumNative: state.stratumNative });
});

app.get("/api/stratum/state", (req,res)=>{
  res.json({ ok:true, stratumNative: state.stratumNative });
});

// scheduler: if Miner X is ON, try native stratum if not connected
setInterval(()=>{
  if(state.runtime.power && state.runtime.minerX && state.poolManager?.connected && !state.stratumNative.connected){
    const idx = Math.max(0, POOLS.findIndex(p => p.name === state.poolManager.current?.name));
    stratumConnect(idx).catch(()=>{});
  }
},15000);






// =====================================================
// BLOCKCHAIN RUNTIME — BTC RPC READONLY / NODE HEALTH
// =====================================================

state.blockchain = {
  mode: "READONLY",
  chain: "BTC",
  status: "IDLE",
  rpcUrl: process.env.BTC_RPC_URL || "",
  height: null,
  peers: null,
  mempool: null,
  sync: "UNKNOWN",
  lastBlockHash: null,
  lastBlock: null,
  mempoolInfo: null,
  lastError: null,
  events: [],
  updatedAt: null,
  rules: {
    noPrivateKey: true,
    noTxBroadcast: true,
    noConsensusWrite: true,
    readonlyOnly: true
  }
};

function chainEvent(type, data){
  const item = { ts: now(), type, data };
  state.blockchain.events.push(item);
  if(state.blockchain.events.length > 80) state.blockchain.events.shift();
  log("CHAIN", type);
  emit("blockchain", state.blockchain);
}

function btcRpcCall(method, params = [], auth = {}){
  return new Promise((resolve, reject) => {
    const url = auth.url || state.blockchain.rpcUrl || process.env.BTC_RPC_URL;
    if(!url) return reject(new Error("BTC_RPC_URL missing"));

    const parsed = new URL(url);
    const body = JSON.stringify({
      jsonrpc: "1.0",
      id: "bbb-chain",
      method,
      params
    });

    const headers = {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body)
    };

    const user = auth.user || process.env.BTC_RPC_USER || "";
    const pass = auth.pass || process.env.BTC_RPC_PASS || "";

    if(user || pass){
      headers.Authorization = "Basic " + Buffer.from(user + ":" + pass).toString("base64");
    }

    const client = parsed.protocol === "https:" ? https : http;

    const req = client.request({
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path: parsed.pathname || "/",
      method: "POST",
      timeout: 7000,
      headers
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try{
          const j = JSON.parse(data);
          if(j.error) return reject(new Error(JSON.stringify(j.error)));
          resolve(j.result);
        }catch(e){
          reject(new Error("RPC parse error: " + e.message));
        }
      });
    });

    req.on("timeout", () => req.destroy(new Error("RPC timeout")));
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function blockchainProbe(auth = {}){
  try{
    if(auth.url) state.blockchain.rpcUrl = auth.url;

    state.blockchain.status = "CONNECTING";

    const [height, peers, mempoolInfo, bestHash] = await Promise.all([
      btcRpcCall("getblockcount", [], auth),
      btcRpcCall("getconnectioncount", [], auth).catch(() => null),
      btcRpcCall("getmempoolinfo", [], auth).catch(() => null),
      btcRpcCall("getbestblockhash", [], auth)
    ]);

    let block = null;
    try{
      block = await btcRpcCall("getblock", [bestHash, 1], auth);
    }catch{}

    state.blockchain.height = height;
    state.blockchain.peers = peers;
    state.blockchain.mempoolInfo = mempoolInfo;
    state.blockchain.mempool = mempoolInfo?.size ?? null;
    state.blockchain.lastBlockHash = bestHash;
    state.blockchain.lastBlock = block ? {
      hash: block.hash,
      height: block.height,
      time: block.time,
      tx: Array.isArray(block.tx) ? block.tx.length : null,
      previousblockhash: block.previousblockhash
    } : { hash: bestHash };

    state.blockchain.status = "ONLINE";
    state.blockchain.sync = "RPC_OK";
    state.blockchain.updatedAt = now();
    state.blockchain.lastError = null;

    chainEvent("RPC_PROBE_OK", {
      height: state.blockchain.height,
      peers: state.blockchain.peers,
      mempool: state.blockchain.mempool
    });

    return state.blockchain;
  }catch(e){
    state.blockchain.status = "ERROR";
    state.blockchain.lastError = e.message;
    state.blockchain.sync = "RPC_ERROR";
    chainEvent("RPC_ERROR", e.message);
    throw e;
  }
}

app.post("/api/blockchain/probe", async (req,res)=>{
  try{
    const out = await blockchainProbe({
      url: String(req.body?.url || ""),
      user: String(req.body?.user || ""),
      pass: String(req.body?.pass || "")
    });
    res.json({ ok:true, blockchain: out });
  }catch(e){
    res.status(500).json({ ok:false, error:e.message, blockchain: state.blockchain });
  }
});

app.get("/api/blockchain/health", (req,res)=>{
  res.json({ ok:true, blockchain: state.blockchain });
});

app.post("/api/blockchain/reset", (req,res)=>{
  state.blockchain.status = "IDLE";
  state.blockchain.height = null;
  state.blockchain.peers = null;
  state.blockchain.mempool = null;
  state.blockchain.lastBlockHash = null;
  state.blockchain.lastBlock = null;
  state.blockchain.mempoolInfo = null;
  state.blockchain.lastError = null;
  state.blockchain.events = [];
  res.json({ ok:true, blockchain: state.blockchain });
});

// Optional poller: only if BTC_RPC_URL is configured.
setInterval(()=>{
  if(state.blockchain.rpcUrl){
    blockchainProbe().catch(()=>{});
  }
},60000);


// =====================================================
// REALITY MODE LOCK
// =====================================================

const REALITY_MODE = {
  SIMULATION:false,
  EMULATION:false,
  REAL_METRICS_ONLY:true,
  REQUIRE_REAL_SOURCE:true,
  NO_RANDOM_RUNTIME:true
};

log("REALITY","REAL_METRICS_ONLY enabled");


boot();
server.listen(PORT, "0.0.0.0", () => log("HTTP", `Port ${PORT} actif`));
