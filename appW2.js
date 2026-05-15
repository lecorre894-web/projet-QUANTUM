/*
TRILLIONS / BBB NEW GEN MASTER — REAL DATA + EMULATED HARDWARE
Version: V11_NEWGEN_REALDATA_STRICT
But:
- Fusion sérieuse des visuels TRILLIONS CORE/V9/V10/DUAL + BBB Runtime.
- Voir BTC, ETH, WETH, BNB, USDT, DOT, LINK et autres cryptos du launch/legacy.
- Matériel émulé, chiffres réels seulement si source connectée.
- Aucun minage caché, aucune clé privée, aucune seed, aucune transaction automatique.
*/

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const http = require("http");
const https = require("https");
const crypto = require("crypto");
const net = require("net");
const tls = require("tls");

let express, Server;
try {
  express = require("express");
  ({ Server } = require("socket.io"));
} catch (e) {
  console.error("Dépendances manquantes. Lance: npm install express socket.io");
  process.exit(1);
}

const APP_NAME = "TRILLIONS BBB NEW GEN MASTER";
const VERSION = "V11_NEWGEN_REALDATA_STRICT";
const PORT = Number(process.env.PORT || 3000);
const ROOT = process.cwd();
const BOOT_ID = crypto.randomBytes(8).toString("hex");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const CRYPTO_REGISTRY = [
  {
    "symbol": "BTC",
    "name": "Bitcoin",
    "cg": "bitcoin",
    "binance": "BTCUSDT",
    "chain": "bitcoin",
    "role": "core",
    "algo": "SHA256"
  },
  {
    "symbol": "ETH",
    "name": "Ethereum",
    "cg": "ethereum",
    "binance": "ETHUSDT",
    "chain": "ethereum",
    "role": "core",
    "algo": "PoS/Execution"
  },
  {
    "symbol": "WETH",
    "name": "Wrapped Ether",
    "cg": "weth",
    "binance": null,
    "chain": "ethereum",
    "role": "web3/defi",
    "algo": "ERC20"
  },
  {
    "symbol": "BNB",
    "name": "BNB",
    "cg": "binancecoin",
    "binance": "BNBUSDT",
    "chain": "bnb-chain",
    "role": "binance-launch",
    "algo": "BSC"
  },
  {
    "symbol": "USDT",
    "name": "Tether",
    "cg": "tether",
    "binance": "USDTUSDC",
    "chain": "multi-chain",
    "role": "stablecoin",
    "algo": "stable"
  },
  {
    "symbol": "USDC",
    "name": "USD Coin",
    "cg": "usd-coin",
    "binance": "USDCUSDT",
    "chain": "multi-chain",
    "role": "stablecoin",
    "algo": "stable"
  },
  {
    "symbol": "SOL",
    "name": "Solana",
    "cg": "solana",
    "binance": "SOLUSDT",
    "chain": "solana",
    "role": "market/runtime",
    "algo": "PoH/PoS"
  },
  {
    "symbol": "DOT",
    "name": "Polkadot",
    "cg": "polkadot",
    "binance": "DOTUSDT",
    "chain": "polkadot",
    "role": "launch-detected",
    "algo": "NPoS"
  },
  {
    "symbol": "LINK",
    "name": "Chainlink",
    "cg": "chainlink",
    "binance": "LINKUSDT",
    "chain": "ethereum",
    "role": "launch-detected",
    "algo": "oracle"
  },
  {
    "symbol": "XRP",
    "name": "XRP",
    "cg": "ripple",
    "binance": "XRPUSDT",
    "chain": "xrpl",
    "role": "market",
    "algo": "consensus"
  },
  {
    "symbol": "ADA",
    "name": "Cardano",
    "cg": "cardano",
    "binance": "ADAUSDT",
    "chain": "cardano",
    "role": "market",
    "algo": "PoS"
  },
  {
    "symbol": "DOGE",
    "name": "Dogecoin",
    "cg": "dogecoin",
    "binance": "DOGEUSDT",
    "chain": "dogecoin",
    "role": "pow",
    "algo": "Scrypt"
  },
  {
    "symbol": "LTC",
    "name": "Litecoin",
    "cg": "litecoin",
    "binance": "LTCUSDT",
    "chain": "litecoin",
    "role": "pow",
    "algo": "Scrypt"
  },
  {
    "symbol": "BCH",
    "name": "Bitcoin Cash",
    "cg": "bitcoin-cash",
    "binance": "BCHUSDT",
    "chain": "bitcoin-cash",
    "role": "pow",
    "algo": "SHA256"
  },
  {
    "symbol": "DASH",
    "name": "Dash",
    "cg": "dash",
    "binance": "DASHUSDT",
    "chain": "dash",
    "role": "pow",
    "algo": "X11"
  },
  {
    "symbol": "KAS",
    "name": "Kaspa",
    "cg": "kaspa",
    "binance": null,
    "chain": "kaspa",
    "role": "pow",
    "algo": "kHeavyHash"
  },
  {
    "symbol": "RVN",
    "name": "Ravencoin",
    "cg": "ravencoin",
    "binance": "RVNUSDT",
    "chain": "ravencoin",
    "role": "pow",
    "algo": "KawPow"
  },
  {
    "symbol": "XMR",
    "name": "Monero",
    "cg": "monero",
    "binance": null,
    "chain": "monero",
    "role": "pow/external-xmrig",
    "algo": "RandomX"
  },
  {
    "symbol": "ETC",
    "name": "Ethereum Classic",
    "cg": "ethereum-classic",
    "binance": "ETCUSDT",
    "chain": "etc",
    "role": "pow",
    "algo": "Etchash"
  },
  {
    "symbol": "ERG",
    "name": "Ergo",
    "cg": "ergo",
    "binance": null,
    "chain": "ergo",
    "role": "pow",
    "algo": "Autolykos"
  },
  {
    "symbol": "ZEC",
    "name": "Zcash",
    "cg": "zcash",
    "binance": "ZECUSDT",
    "chain": "zcash",
    "role": "pow",
    "algo": "Equihash"
  },
  {
    "symbol": "AVAX",
    "name": "Avalanche",
    "cg": "avalanche-2",
    "binance": "AVAXUSDT",
    "chain": "avalanche",
    "role": "market",
    "algo": "PoS"
  },
  {
    "symbol": "TRX",
    "name": "TRON",
    "cg": "tron",
    "binance": "TRXUSDT",
    "chain": "tron",
    "role": "market",
    "algo": "DPoS"
  },
  {
    "symbol": "MATIC",
    "name": "Polygon",
    "cg": "matic-network",
    "binance": "MATICUSDT",
    "chain": "polygon",
    "role": "market",
    "algo": "PoS"
  },
  {
    "symbol": "FET",
    "name": "Fetch.ai",
    "cg": "fetch-ai",
    "binance": "FETUSDT",
    "chain": "cosmos/eth",
    "role": "ai-satellite",
    "algo": "AI"
  },
  {
    "symbol": "AKT",
    "name": "Akash",
    "cg": "akash-network",
    "binance": null,
    "chain": "cosmos",
    "role": "compute-satellite",
    "algo": "DPoS"
  }
];

const POOLS = [
  { name:"NiceHash SHA256 AUTO", algo:"SHA256", symbol:"BTC", host:"sha256.auto.nicehash.com", port:9200, tls:false },
  { name:"NiceHash SHA256 USA TLS", algo:"SHA256", symbol:"BTC", host:"sha256.usa.nicehash.com", port:3334, tls:true },
  { name:"PublicPool SHA256", algo:"SHA256", symbol:"BTC", host:"pool.public-pool.io", port:21496, tls:false },
  { name:"ZPool SHA256", algo:"SHA256", symbol:"BTC/BCH", host:"sha256.mine.zpool.ca", port:3333, tls:false },
  { name:"Ravencoin KawPow visible", algo:"KAWPOW", symbol:"RVN", host:"rvn.2miners.com", port:6060, tls:false },
  { name:"Kaspa kHeavyHash visible", algo:"KHEAVYHASH", symbol:"KAS", host:"kas.2miners.com", port:2020, tls:false },
  { name:"Dash X11 visible", algo:"X11", symbol:"DASH", host:"dash.2miners.com", port:6090, tls:false },
  { name:"Monero RandomX XMRig external", algo:"RANDOMX", symbol:"XMR", host:"xmr.2miners.com", port:2222, tls:false }
];

const HONESTY = Object.freeze({
  noHiddenMining: true,
  noFakeNumbers: true,
  noAutoStart: true,
  noPrivateKey: true,
  noSeed: true,
  noAutoTransaction: true,
  hardware: "EMULATED",
  data: "REAL_ONLY_WHEN_SOURCE_CONNECTED",
  rule: "EMU_HARDWARE_OK__FAKE_METRICS_BLOCKED"
});

const state = {
  app: APP_NAME,
  version: VERSION,
  bootId: BOOT_ID,
  boot: new Date().toISOString(),
  mode: "EMULATED_HARDWARE_REAL_DATA",
  tick: 0,
  honesty: HONESTY,
  runtime: {
    power: false,
    kernel: "STANDBY",
    selectedAlgo: "SHA256_VISIBLE",
    activePanel: "dashboard",
    hardwareStatus: "EMULATED",
    dataStatus: "WAITING_REAL_SOURCES"
  },
  repo: {
    scannedAt: null,
    files: [],
    stats: {},
    modules: {}
  },
  crypto: {
    registry: CRYPTO_REGISTRY,
    prices: {},
    binance: {},
    updatedAt: null,
    source: "PENDING",
    lastError: null
  },
  mining: {
    visibleOnly: true,
    hiddenMining: false,
    hashrate: null,
    unit: "SOURCE_REQUIRED",
    accepted: null,
    rejected: null,
    rigs: [],
    graph: [],
    xmrig: {
      status: "OFF",
      api: process.env.XMRIG_API || "http://127.0.0.1:18080/2/summary",
      summary: null,
      lastError: null
    }
  },
  pools: {
    registry: POOLS,
    selected: POOLS[0],
    status: "SELECTED",
    latencyMs: null,
    reconnects: 0,
    autoReconnect: false
  },
  stratum: {
    status: "CLOSED",
    connected: false,
    socketType: null,
    pool: null,
    subscribed: false,
    authorized: false,
    difficulty: null,
    jobs: [],
    lastMessages: [],
    lastError: null,
    reconnects: 0,
    requestId: 1
  },
  blockchain: {
    mode: "READONLY",
    btcRpcUrl: process.env.BTC_RPC_URL || "",
    btc: { status:"IDLE", height:null, peers:null, mempool:null, sync:"UNKNOWN", lastBlock:null, lastError:null },
    eth: { status:"IDLE", rpcUrl:process.env.ETH_RPC_URL || "", chainId:null, block:null, gas:null, lastError:null },
    readonlyOnly: true
  },
  ai: {
    provider: "pollinations",
    status: "READY",
    chat: [],
    lastReply: null,
    lastError: null
  },
  mesh: {
    mode: "P2P_RUNTIME",
    status: "READY",
    peers: 0,
    channel: "GENESIS_MESH",
    packets: 0
  },
  logs: [],
  events: [],
  metrics: {
    cpu: [],
    memory: [],
    eventRate: [],
    network: []
  }
};

let STRATUM_SOCKET = null;
let STRATUM_BUFFER = "";

function now(){ return new Date().toISOString(); }
function emit(topic, payload){ io.emit(topic, payload); }
function pushLimited(arr, item, max=600){ arr.push(item); while(arr.length>max) arr.shift(); }
function log(channel, message, extra={}){
  const item = { ts: now(), channel, message: String(message), ...extra };
  pushLimited(state.logs, item, 1000);
  console.log(`[${channel}] ${item.ts} -> ${item.message}`);
  emit("log", item);
  return item;
}
function event(type, title, data={}){
  const item = { ts: now(), type, title, data };
  pushLimited(state.events, item, 800);
  emit("event", item);
  return item;
}
function safeJoin(root, rel){
  const full = path.resolve(root, String(rel || "."));
  if(!full.startsWith(root)) throw new Error("Path blocked");
  return full;
}
function requestJson(url, timeoutMs=12000, headers={}){
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === "https:" ? https : http;
    const req = lib.request({
      hostname: u.hostname,
      port: u.port || (u.protocol === "https:" ? 443 : 80),
      path: u.pathname + u.search,
      method: "GET",
      timeout: timeoutMs,
      headers: { "User-Agent":"TRILLIONS-BBB-NEWGEN/1.0", ...headers }
    }, res => {
      let data="";
      res.on("data", c => data += c);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch(e){ reject(new Error("JSON parse error: "+e.message)); }
      });
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end();
  });
}
function postJson(url, body, timeoutMs=12000, headers={}){
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === "https:" ? https : http;
    const payload = JSON.stringify(body);
    const req = lib.request({
      hostname: u.hostname,
      port: u.port || (u.protocol === "https:" ? 443 : 80),
      path: u.pathname + u.search,
      method: "POST",
      timeout: timeoutMs,
      headers: { "Content-Type":"application/json", "Content-Length":Buffer.byteLength(payload), "User-Agent":"TRILLIONS-BBB-NEWGEN/1.0", ...headers }
    }, res => {
      let data="";
      res.on("data", c => data += c);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); }
        catch(e){ resolve(data); }
      });
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

/* ---------------- Repository loader ---------------- */
const IGNORE_DIRS = new Set(["node_modules",".git",".next","dist","build","__pycache__"]);
function scanRepository(root=ROOT, maxDepth=10){
  const files = [];
  function walk(dir, depth=0){
    if(depth > maxDepth) return;
    let entries=[];
    try { entries = fs.readdirSync(dir, { withFileTypes:true }); } catch { return; }
    for(const e of entries){
      if(IGNORE_DIRS.has(e.name)) continue;
      const full = path.join(dir, e.name);
      let st;
      try { st = fs.statSync(full); } catch { continue; }
      const rel = path.relative(root, full);
      if(e.isDirectory()){
        files.push({ type:"dir", rel, bytes:0, depth });
        walk(full, depth+1);
      } else {
        files.push({ type:"file", rel, ext:path.extname(e.name).toLowerCase(), bytes:st.size, modified:st.mtime.toISOString(), depth });
      }
    }
  }
  walk(root, 0);
  const stats = { total:files.length, js:0, html:0, json:0, yml:0, mht:0, txt:0, images:0 };
  const modules = { ai:false, blockchain:false, stratum:false, websocket:false, mining:false, trillions:false, bbb:false, binance:false, weth:false };
  for(const f of files){
    const p = f.rel.toLowerCase();
    if(f.type === "file"){
      if(f.ext === ".js") stats.js++;
      if(f.ext === ".html") stats.html++;
      if(f.ext === ".json") stats.json++;
      if(f.ext === ".yml" || f.ext === ".yaml") stats.yml++;
      if(f.ext === ".mht") stats.mht++;
      if(f.ext === ".txt") stats.txt++;
      if([".png",".jpg",".jpeg",".webp",".gif",".svg"].includes(f.ext)) stats.images++;
    }
    if(p.includes("ai") || p.includes("pollinations") || p.includes("openai")) modules.ai = true;
    if(p.includes("blockchain") || p.includes("wallet") || p.includes("btc") || p.includes("eth")) modules.blockchain = true;
    if(p.includes("stratum")) modules.stratum = true;
    if(p.includes("socket") || p.includes("websocket")) modules.websocket = true;
    if(p.includes("mining") || p.includes("xmrig") || p.includes("pool")) modules.mining = true;
    if(p.includes("trillions")) modules.trillions = true;
    if(p.includes("bbb") || p.includes("genesis")) modules.bbb = true;
    if(p.includes("binance") || p.includes("bnb")) modules.binance = true;
    if(p.includes("weth")) modules.weth = true;
  }
  state.repo = { scannedAt: now(), files: files.slice(0, 1000), stats, modules };
  event("repo", "Repository scanned", { stats, modules });
  return state.repo;
}

/* ---------------- Real crypto data ---------------- */
async function updateCoinGecko(){
  const ids = CRYPTO_REGISTRY.map(x => x.cg).filter(Boolean).join(",");
  const url = "https://api.coingecko.com/api/v3/simple/price?ids="+encodeURIComponent(ids)+"&vs_currencies=usd&include_24hr_change=true&include_market_cap=true";
  const data = await requestJson(url, 15000);
  const out = {};
  for(const c of CRYPTO_REGISTRY){
    if(c.cg && data[c.cg]){
      out[c.symbol] = {
        usd: data[c.cg].usd ?? null,
        usd_24h_change: data[c.cg].usd_24h_change ?? null,
        usd_market_cap: data[c.cg].usd_market_cap ?? null,
        source: "coingecko"
      };
    }
  }
  state.crypto.prices = out;
  state.crypto.updatedAt = now();
  state.crypto.source = "COINGECKO";
  state.crypto.lastError = null;
  log("CRYPTO", "CoinGecko prices loaded");
  return out;
}
async function updateBinanceTickers(){
  const pairs = CRYPTO_REGISTRY.map(x => x.binance).filter(Boolean);
  const results = {};
  for(const pair of pairs.slice(0, 40)){
    try {
      const d = await requestJson("https://api.binance.com/api/v3/ticker/24hr?symbol="+pair, 9000);
      results[pair] = {
        price: d.lastPrice ? Number(d.lastPrice) : null,
        changePercent: d.priceChangePercent ? Number(d.priceChangePercent) : null,
        volume: d.volume ? Number(d.volume) : null,
        quoteVolume: d.quoteVolume ? Number(d.quoteVolume) : null,
        source: "binance"
      };
    } catch(e) {
      results[pair] = { error: e.message, source:"binance" };
    }
  }
  state.crypto.binance = results;
  state.crypto.updatedAt = now();
  log("CRYPTO", "Binance ticker pass completed");
  return results;
}

/* ---------------- XMRig external visible bridge ---------------- */
async function probeXmrig(){
  try {
    const d = await requestJson(state.mining.xmrig.api, 6000);
    state.mining.xmrig.status = "LIVE";
    state.mining.xmrig.summary = d;
    state.mining.xmrig.lastError = null;
    const hs = d.hashrate?.total?.[0] ?? d.hashrate?.total?.[1] ?? null;
    if(typeof hs === "number"){
      state.mining.hashrate = hs;
      state.mining.unit = "H/s";
      pushLimited(state.mining.graph, { ts: now(), value: hs, source:"xmrig" }, 360);
    }
    log("XMRIG", "External XMRig API live");
    return d;
  } catch(e){
    state.mining.xmrig.status = "OFF";
    state.mining.xmrig.lastError = e.message;
    throw e;
  }
}

/* ---------------- BTC RPC readonly ---------------- */
function btcRpc(method, params=[], auth={}){
  return new Promise((resolve, reject) => {
    const url = auth.url || state.blockchain.btcRpcUrl || process.env.BTC_RPC_URL;
    if(!url) return reject(new Error("BTC_RPC_URL missing"));
    const u = new URL(url);
    const payload = JSON.stringify({ jsonrpc:"1.0", id:"bbb", method, params });
    const user = auth.user || process.env.BTC_RPC_USER || "";
    const pass = auth.pass || process.env.BTC_RPC_PASS || "";
    const headers = { "Content-Type":"application/json", "Content-Length":Buffer.byteLength(payload) };
    if(user || pass) headers.Authorization = "Basic "+Buffer.from(user+":"+pass).toString("base64");
    const lib = u.protocol === "https:" ? https : http;
    const req = lib.request({ hostname:u.hostname, port:u.port || (u.protocol==="https:"?443:80), path:u.pathname || "/", method:"POST", timeout:8000, headers }, res => {
      let data="";
      res.on("data", c => data += c);
      res.on("end", () => {
        try {
          const j = JSON.parse(data);
          if(j.error) return reject(new Error(JSON.stringify(j.error)));
          resolve(j.result);
        } catch(e){ reject(new Error("RPC parse error: "+e.message)); }
      });
    });
    req.on("timeout", () => req.destroy(new Error("RPC timeout")));
    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}
async function probeBtcRpc(auth={}){
  if(auth.url) state.blockchain.btcRpcUrl = auth.url;
  state.blockchain.btc.status = "CONNECTING";
  try {
    const height = await btcRpc("getblockcount", [], auth);
    const peers = await btcRpc("getconnectioncount", [], auth).catch(() => null);
    const mempool = await btcRpc("getmempoolinfo", [], auth).catch(() => null);
    const hash = await btcRpc("getbestblockhash", [], auth).catch(() => null);
    state.blockchain.btc = {
      status:"ONLINE", height, peers,
      mempool: mempool?.size ?? null,
      sync:"RPC_OK",
      lastBlock: hash,
      lastError:null,
      updatedAt:now()
    };
    log("BTC_RPC", "readonly probe OK height="+height);
    return state.blockchain.btc;
  } catch(e){
    state.blockchain.btc.status = "ERROR";
    state.blockchain.btc.lastError = e.message;
    log("BTC_RPC_ERROR", e.message);
    throw e;
  }
}

/* ---------------- ETH RPC readonly ---------------- */
async function probeEthRpc(rpcUrl){
  const url = rpcUrl || state.blockchain.eth.rpcUrl || process.env.ETH_RPC_URL;
  if(!url) throw new Error("ETH_RPC_URL missing");
  state.blockchain.eth.status = "CONNECTING";
  try {
    const [chainId, block, gas] = await Promise.all([
      postJson(url, { jsonrpc:"2.0", id:1, method:"eth_chainId", params:[] }),
      postJson(url, { jsonrpc:"2.0", id:2, method:"eth_blockNumber", params:[] }),
      postJson(url, { jsonrpc:"2.0", id:3, method:"eth_gasPrice", params:[] })
    ]);
    state.blockchain.eth = {
      status:"ONLINE",
      rpcUrl:url,
      chainId: chainId.result ? parseInt(chainId.result, 16) : null,
      block: block.result ? parseInt(block.result, 16) : null,
      gas: gas.result ? Number(BigInt(gas.result) / 1000000000n) : null,
      lastError:null,
      updatedAt:now()
    };
    log("ETH_RPC", "readonly probe OK block="+state.blockchain.eth.block);
    return state.blockchain.eth;
  } catch(e){
    state.blockchain.eth.status = "ERROR";
    state.blockchain.eth.lastError = e.message;
    log("ETH_RPC_ERROR", e.message);
    throw e;
  }
}

/* ---------------- Stratum visible client ---------------- */
function rememberStratum(kind, data){
  pushLimited(state.stratum.lastMessages, { ts: now(), kind, data }, 100);
}
function stratumDisconnect(reason="MANUAL_CLOSE"){
  if(STRATUM_SOCKET){ try { STRATUM_SOCKET.destroy(); } catch {} }
  STRATUM_SOCKET = null;
  STRATUM_BUFFER = "";
  state.stratum.connected = false;
  state.stratum.status = reason;
  emit("state", snapshot());
  log("STRATUM", reason);
}
function stratumWrite(method, params=[]){
  if(!STRATUM_SOCKET || !state.stratum.connected) return false;
  const msg = { id: state.stratum.requestId++, method, params };
  STRATUM_SOCKET.write(JSON.stringify(msg)+"\n");
  rememberStratum("TX", msg);
  log("STRATUM_TX", method);
  return true;
}
function parseStratumLine(line){
  if(!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch { rememberStratum("RAW", line.slice(0,400)); return; }
  rememberStratum("RX", msg);
  if(msg.method === "mining.set_difficulty") state.stratum.difficulty = msg.params?.[0] ?? null;
  if(msg.method === "mining.notify"){
    pushLimited(state.stratum.jobs, { ts:now(), jobId:msg.params?.[0] ?? "?", raw:msg.params }, 80);
  }
  if(msg.result && Array.isArray(msg.result)) state.stratum.subscribed = true;
  if(msg.id && msg.result === true) state.stratum.authorized = true;
  if(msg.error) state.stratum.lastError = JSON.stringify(msg.error);
  emit("state", snapshot());
}
function connectStratum(poolIndex=0){
  const pool = POOLS[poolIndex] || POOLS[0];
  return new Promise(resolve => {
    stratumDisconnect("RECONNECTING");
    state.stratum.pool = pool;
    state.stratum.status = "CONNECTING";
    state.stratum.lastError = null;
    state.stratum.subscribed = false;
    state.stratum.authorized = false;
    const started = Date.now();
    const sock = pool.tls ? tls.connect({ host:pool.host, port:pool.port, servername:pool.host, timeout:12000 }) : net.connect({ host:pool.host, port:pool.port, timeout:12000 });
    STRATUM_SOCKET = sock;
    state.stratum.socketType = pool.tls ? "TLS" : "TCP";
    sock.setEncoding("utf8");
    sock.setKeepAlive(true, 30000);
    sock.setNoDelay(true);
    sock.on(pool.tls ? "secureConnect" : "connect", () => {
      state.stratum.connected = true;
      state.stratum.status = "CONNECTED";
      state.pools.selected = pool;
      state.pools.status = "NATIVE_CONNECTED";
      state.pools.latencyMs = Date.now() - started;
      log("STRATUM", "connected "+pool.name+" "+pool.host+":"+pool.port);
      const worker = process.env.STRATUM_USER || process.env.WALLET || "WORKER_REQUIRED";
      const pass = process.env.STRATUM_PASS || "x";
      stratumWrite("mining.subscribe", ["TRILLIONS-BBB/11.0"]);
      stratumWrite("mining.authorize", [worker, pass]);
      resolve(true);
    });
    sock.on("data", chunk => {
      STRATUM_BUFFER += chunk;
      let idx;
      while((idx = STRATUM_BUFFER.indexOf("\n")) >= 0){
        const line = STRATUM_BUFFER.slice(0, idx);
        STRATUM_BUFFER = STRATUM_BUFFER.slice(idx+1);
        parseStratumLine(line);
      }
    });
    sock.on("error", err => {
      state.stratum.status = "ERROR";
      state.stratum.lastError = err.message;
      log("STRATUM_ERROR", err.message);
      resolve(false);
    });
    sock.on("close", () => {
      if(state.stratum.connected) state.stratum.reconnects++;
      state.stratum.connected = false;
      state.stratum.status = "CLOSED";
      state.pools.status = "CLOSED";
      log("STRATUM", "socket closed");
      emit("state", snapshot());
    });
  });
}

/* ---------------- AI ---------------- */
async function askPollinations(message, withState=false){
  const messages = [
    { role:"system", content:"Tu es l'assistant technique du cockpit TRILLIONS BBB. Tu restes rigoureux. Matériel émulé, données réelles uniquement si source connectée. Ne demande jamais seed/private key. Ne promets jamais de gains." }
  ];
  if(withState){
    messages.push({ role:"system", content:"Etat runtime abrégé: "+JSON.stringify({
      mode:state.mode, honesty:state.honesty, crypto:Object.keys(state.crypto.prices), pools:state.pools.status,
      stratum:{status:state.stratum.status, jobs:state.stratum.jobs.length},
      blockchain:state.blockchain, repo:state.repo.stats
    }).slice(0,6000) });
  }
  messages.push({ role:"user", content:message });
  const data = await postJson("https://text.pollinations.ai/openai", { model:"openai", messages, temperature:0.25 }, 25000);
  return data?.choices?.[0]?.message?.content || String(data).slice(0,4000);
}

/* ---------------- Snapshot + metrics ---------------- */
function refreshMetrics(){
  const m = process.memoryUsage();
  pushLimited(state.metrics.memory, { ts:now(), rssMB:Math.round(m.rss/1024/1024), heapMB:Math.round(m.heapUsed/1024/1024), freeGB:Math.round(os.freemem()/1024/1024/1024), totalGB:Math.round(os.totalmem()/1024/1024/1024) }, 360);
  pushLimited(state.metrics.cpu, { ts:now(), loadavg:os.loadavg(), threads:os.cpus().length }, 360);
  pushLimited(state.metrics.eventRate, { ts:now(), logs:state.logs.length, events:state.events.length }, 360);
}
function snapshot(){
  refreshMetrics();
  return {
    app:state.app, version:state.version, boot:state.boot, bootId:state.bootId, tick:state.tick,
    mode:state.mode, honesty:state.honesty, runtime:state.runtime, repo:state.repo,
    crypto:state.crypto, mining:state.mining, pools:state.pools, stratum:state.stratum,
    blockchain:state.blockchain, ai:{ provider:state.ai.provider, status:state.ai.status, lastReply:state.ai.lastReply, lastError:state.ai.lastError },
    mesh:state.mesh, metrics:state.metrics, logs:state.logs.slice(-300), events:state.events.slice(-300),
    system:{ node:process.version, platform:os.platform(), arch:os.arch(), uptimeSec:Math.round(process.uptime()), cwd:ROOT, hostname:os.hostname(), ramGB:Math.round(os.totalmem()/1024/1024/1024), cpu:os.cpus()[0]?.model || "unknown" }
  };
}

/* ---------------- API ---------------- */
app.get("/api/state", (req,res) => res.json(snapshot()));
app.get("/api/health", (req,res) => res.json({ ok:true, app:APP_NAME, version:VERSION, honesty:HONESTY, uptimeSec:Math.round(process.uptime()) }));
app.post("/api/repo/scan", (req,res) => res.json({ ok:true, repo:scanRepository(ROOT, Number(req.body?.maxDepth || 10)) }));
app.get("/api/crypto/registry", (req,res) => res.json({ ok:true, registry:CRYPTO_REGISTRY }));
app.post("/api/crypto/update", async (req,res) => {
  try {
    const prices = await updateCoinGecko();
    emit("state", snapshot());
    res.json({ ok:true, source:"coingecko", prices });
  } catch(e){
    state.crypto.lastError = e.message;
    res.status(500).json({ ok:false, error:e.message });
  }
});
app.post("/api/crypto/binance", async (req,res) => {
  try {
    const tickers = await updateBinanceTickers();
    emit("state", snapshot());
    res.json({ ok:true, source:"binance", tickers });
  } catch(e){
    res.status(500).json({ ok:false, error:e.message });
  }
});
app.post("/api/runtime/power", (req,res) => {
  state.runtime.power = !!req.body?.power;
  state.runtime.kernel = state.runtime.power ? "ONLINE" : "STANDBY";
  log("POWER", state.runtime.power ? "ON" : "OFF");
  emit("state", snapshot());
  res.json({ ok:true, runtime:state.runtime });
});
app.post("/api/mining/xmrig", async (req,res) => {
  try { const d=await probeXmrig(); emit("state", snapshot()); res.json({ ok:true, xmrig:state.mining.xmrig, summary:d }); }
  catch(e){ res.status(500).json({ ok:false, error:e.message, xmrig:state.mining.xmrig }); }
});
app.get("/api/pools", (req,res) => res.json({ ok:true, pools:POOLS, state:state.pools }));
app.post("/api/pools/select", (req,res) => {
  const id = Number(req.body?.id || 0);
  const pool = POOLS[id];
  if(!pool) return res.status(404).json({ ok:false, error:"pool not found" });
  state.pools.selected = pool;
  state.pools.status = "SELECTED_READY_NATIVE_CONNECT";
  log("POOL", "selected "+pool.name);
  emit("state", snapshot());
  res.json({ ok:true, pool });
});
app.post("/api/stratum/connect", async (req,res) => {
  const ok = await connectStratum(Number(req.body?.poolIndex || 0));
  emit("state", snapshot());
  res.json({ ok, stratum:state.stratum });
});
app.post("/api/stratum/disconnect", (req,res) => { stratumDisconnect("MANUAL_DISCONNECT"); res.json({ ok:true, stratum:state.stratum }); });
app.post("/api/stratum/ping", (req,res) => res.json({ ok:stratumWrite("mining.extranonce.subscribe", []), stratum:state.stratum }));
app.post("/api/blockchain/btc", async (req,res) => {
  try { const btc=await probeBtcRpc({ url:String(req.body?.url || ""), user:String(req.body?.user || ""), pass:String(req.body?.pass || "") }); emit("state", snapshot()); res.json({ ok:true, btc }); }
  catch(e){ res.status(500).json({ ok:false, error:e.message, btc:state.blockchain.btc }); }
});
app.post("/api/blockchain/eth", async (req,res) => {
  try { const eth=await probeEthRpc(String(req.body?.url || "")); emit("state", snapshot()); res.json({ ok:true, eth }); }
  catch(e){ res.status(500).json({ ok:false, error:e.message, eth:state.blockchain.eth }); }
});
app.post("/api/chat", async (req,res) => {
  const msg = String(req.body?.message || "").trim();
  if(!msg) return res.status(400).json({ ok:false, error:"message required" });
  state.ai.chat.push({ role:"user", content:msg, ts:now() });
  try {
    const reply = await askPollinations(msg, !!req.body?.withState);
    state.ai.lastReply = reply;
    state.ai.lastError = null;
    state.ai.chat.push({ role:"assistant", content:reply, ts:now() });
    log("AI", String(reply).slice(0,140));
    emit("state", snapshot());
    res.json({ ok:true, reply });
  } catch(e){
    state.ai.lastError = e.message;
    res.status(500).json({ ok:false, error:e.message });
  }
});

/* ---------------- UI ---------------- */
const CLIENT = "\nconst qs = s => document.querySelector(s);\nconst esc = s => String(s==null?\"\":s).replace(/[&<>\"']/g,function(m){return {\"&\":\"&amp;\",\"<\":\"&lt;\",\">\":\"&gt;\",\"\\\"\":\"&quot;\",\"'\":\"&#039;\"}[m];});\nconst api = (u,o={}) => fetch(u,Object.assign({headers:{\"Content-Type\":\"application/json\"}},o)).then(r=>r.json().catch(()=>({ok:false,error:\"non-json\"})));\nlet S=null, active=\"dashboard\", logs=[];\nconst tabs=[\"dashboard\",\"crypto\",\"pools\",\"stratum\",\"blockchain\",\"emulation\",\"mesh\",\"ai\",\"files\",\"terminal\",\"legacy\"];\nfunction card(t,b,cls){return '<section class=\"card '+(cls||'')+'\"><h2>'+esc(t)+'</h2>'+b+'</section>';}\nfunction kv(k,v){return '<div class=\"kv\"><span>'+esc(k)+'</span><b>'+esc(v)+'</b></div>';}\nfunction spark(arr,key){\n  const vals=(arr||[]).map(x=>Number(x[key||\"value\"]||x.value||0)).filter(x=>Number.isFinite(x));\n  if(vals.length<2) return '<div class=\"spark empty\"></div>';\n  const max=Math.max.apply(null,vals.concat([1])), min=Math.min.apply(null,vals.concat([0])), span=Math.max(max-min,1);\n  const take=vals.slice(-48);\n  const pts=take.map(function(v,i){return (i*100/Math.max(take.length-1,1))+\",\"+(36-((v-min)/span)*30);}).join(\" \");\n  return '<svg class=\"spark\" viewBox=\"0 0 100 40\" preserveAspectRatio=\"none\"><polyline points=\"'+pts+'\"/></svg>';\n}\nfunction coinLine(sym){\n  const p=S.crypto.prices&&S.crypto.prices[sym]; const b=S.crypto.registry.find(x=>x.symbol===sym);\n  return '<div class=\"coinline\"><b>'+sym+'</b><span>'+(b?esc(b.name):'')+'</span><em>'+(p&&p.usd ? \"$\"+p.usd : \"SOURCE_REQUIRED\")+'</em></div>';\n}\nfunction coinCard(c){\n  const p=S.crypto.prices&&S.crypto.prices[c.symbol], b=c.binance && S.crypto.binance ? S.crypto.binance[c.binance] : null;\n  return '<div class=\"coin\"><b>'+esc(c.symbol)+'</b><span>'+esc(c.name)+'</span><small>'+esc(c.role)+' \u2022 '+esc(c.algo)+'</small><strong>'+(p&&p.usd ? \"$\"+p.usd : \"SOURCE_REQUIRED\")+'</strong><em>'+(b&&b.price ? \"Binance $\"+b.price : \"pair \"+(c.binance||\"n/a\"))+'</em></div>';\n}\nfunction line(l){return '<div class=\"log\"><span>['+esc((l.ts||\"\").slice(11,19))+']</span> <b>['+esc(l.channel)+']</b> '+esc(l.message)+'</div>';}\nfunction render(){\n  if(!S) return;\n  qs(\"#mode\").textContent=S.mode||\"--\";\n  qs(\"#time\").textContent=new Date().toLocaleTimeString();\n  qs(\"#status\").textContent=S.runtime&&S.runtime.power?\"ONLINE\":\"STANDBY\";\n  qs(\"#data\").textContent=(S.crypto&&S.crypto.source)||\"PENDING\";\n  qs(\"#tabs\").innerHTML=tabs.map(function(t){return '<button class=\"'+(active===t?'on':'')+'\" onclick=\"active=\\''+t+'\\';render()\">'+t.toUpperCase()+'</button>';}).join(\"\");\n  let h=\"\";\n  if(active===\"dashboard\"){\n    h+=card(\"SYSTEM STATUS\", kv(\"Kernel\",S.runtime.kernel)+kv(\"Hardware\",S.runtime.hardwareStatus)+kv(\"Data\",S.runtime.dataStatus)+kv(\"Honesty\",\"LOCKED\"));\n    h+=card(\"RUNTIME METRICS\", kv(\"Uptime\",(S.system&&S.system.uptimeSec||0)+\"s\")+kv(\"Memory\",((S.metrics.memory.slice(-1)[0]||{}).heapMB||\"-\")+\" MB heap\")+spark(S.metrics.memory,\"heapMB\"));\n    h+=card(\"CRYPTO CORE\", [\"BTC\",\"ETH\",\"WETH\",\"BNB\",\"USDT\",\"DOT\",\"LINK\",\"SOL\"].map(coinLine).join(\"\"));\n    h+=card(\"POOL / STRATUM\", kv(\"Pool\",S.pools.selected&&S.pools.selected.name||\"-\")+kv(\"Stratum\",S.stratum.status)+kv(\"Jobs\",(S.stratum.jobs||[]).length)+kv(\"Difficulty\",S.stratum.difficulty||\"-\"));\n    h+=card(\"BLOCKCHAIN READONLY\", kv(\"BTC\",S.blockchain.btc.status)+kv(\"BTC height\",S.blockchain.btc.height==null?\"-\":S.blockchain.btc.height)+kv(\"ETH\",S.blockchain.eth.status)+kv(\"ETH block\",S.blockchain.eth.block==null?\"-\":S.blockchain.eth.block));\n    h+=card(\"AI CORE\", kv(\"Provider\",S.ai.provider)+kv(\"Status\",S.ai.status)+'<div class=\"reply\">'+esc(S.ai.lastReply||\"Ready\")+'</div>');\n  }\n  if(active===\"crypto\"){\n    h+=card(\"CRYPTO REGISTRY\", '<button onclick=\"updateCrypto()\">UPDATE COINGECKO</button><button onclick=\"updateBinance()\">UPDATE BINANCE</button><div class=\"gridcoins\">'+S.crypto.registry.map(coinCard).join(\"\")+'</div>',\"wide\");\n  }\n  if(active===\"pools\"){\n    h+=card(\"POOL MANAGER\", kv(\"Status\",S.pools.status)+kv(\"Selected\",S.pools.selected&&S.pools.selected.name||\"-\")+kv(\"Latency\",S.pools.latencyMs==null?\"SOURCE_REQUIRED\":S.pools.latencyMs)+kv(\"Reconnects\",S.pools.reconnects));\n    h+=card(\"AVAILABLE POOLS\", S.pools.registry.map(function(p,i){return '<div class=\"pool\"><b>'+esc(p.name)+'</b><span>'+esc(p.symbol)+' / '+esc(p.algo)+'</span><button onclick=\"selectPool('+i+')\">SELECT</button></div>';}).join(\"\"),\"wide\");\n  }\n  if(active===\"stratum\"){\n    h+=card(\"TCP/TLS STRATUM NATIF\", kv(\"Status\",S.stratum.status)+kv(\"Socket\",S.stratum.connected?\"CONNECTED\":\"DISCONNECTED\")+kv(\"Subscribed\",S.stratum.subscribed)+kv(\"Authorized\",S.stratum.authorized)+kv(\"Jobs\",S.stratum.jobs.length)+kv(\"Last error\",S.stratum.lastError||\"-\"));\n    h+=card(\"CONTROL\", '<button onclick=\"stratumConnect()\">CONNECT NATIVE</button><button onclick=\"stratumPing()\">PING</button><button class=\"danger\" onclick=\"stratumDisconnect()\">DISCONNECT</button><p>Visible only. No private key. No hidden hash.</p>');\n    h+=card(\"JOBS\", '<pre>'+esc(JSON.stringify(S.stratum.jobs.slice(-20),null,2))+'</pre>',\"wide\");\n  }\n  if(active===\"blockchain\"){\n    h+=card(\"BTC RPC READONLY\", '<input id=\"btcUrl\" placeholder=\"BTC_RPC_URL http://127.0.0.1:8332\"><div class=\"row\"><input id=\"btcUser\" placeholder=\"user\"><input id=\"btcPass\" placeholder=\"pass\" type=\"password\"></div><button onclick=\"probeBTC()\">PROBE BTC</button>'+kv(\"Status\",S.blockchain.btc.status)+kv(\"Height\",S.blockchain.btc.height==null?\"-\":S.blockchain.btc.height)+kv(\"Peers\",S.blockchain.btc.peers==null?\"-\":S.blockchain.btc.peers)+kv(\"Error\",S.blockchain.btc.lastError||\"-\"));\n    h+=card(\"ETH RPC READONLY\", '<input id=\"ethUrl\" placeholder=\"ETH_RPC_URL\"><button onclick=\"probeETH()\">PROBE ETH</button>'+kv(\"Status\",S.blockchain.eth.status)+kv(\"ChainId\",S.blockchain.eth.chainId==null?\"-\":S.blockchain.eth.chainId)+kv(\"Block\",S.blockchain.eth.block==null?\"-\":S.blockchain.eth.block)+kv(\"Gas\",S.blockchain.eth.gas==null?\"-\":S.blockchain.eth.gas));\n  }\n  if(active===\"emulation\"){\n    h+=card(\"POLITIQUE STRICTE\", kv(\"Hardware\",\"EMULATED\")+kv(\"Data\",\"REAL ONLY WHEN SOURCE CONNECTED\")+kv(\"Fake hashrate\",\"BLOCKED\")+kv(\"Fake wallet\",\"BLOCKED\")+kv(\"Private key\",\"BLOCKED\")+kv(\"Auto transaction\",\"BLOCKED\"));\n    h+=card(\"EMULATED HARDWARE LAYER\", '<div class=\"rigart\"><div></div><div></div><div></div><div></div><div></div><div></div></div><p>CPU/GPU/ASIC clusters are modeled as architecture only. Metrics remain pending until real source/API is connected.</p>');\n  }\n  if(active===\"mesh\"){\n    let nodes=\"\"; for(let i=0;i<9;i++) nodes+='<i style=\"--x:'+(15+(i*23)%80)+'%;--y:'+(20+(i*37)%60)+'%\"></i>';\n    h+=card(\"WEBRTC / NODE MESH\", kv(\"Mode\",S.mesh.mode)+kv(\"Status\",S.mesh.status)+kv(\"Peers\",S.mesh.peers)+kv(\"Channel\",S.mesh.channel)+'<div class=\"mesh\">'+nodes+'</div>');\n  }\n  if(active===\"ai\"){\n    h+=card(\"AI ASSISTANT\", '<div class=\"chat\">'+esc(S.ai.lastReply||\"IA ready\")+'</div><input id=\"msg\" placeholder=\"Question runtime...\"><button onclick=\"chat(false)\">SEND</button><button onclick=\"chat(true)\">SEND + STATE</button>',\"wide\");\n  }\n  if(active===\"files\"){\n    h+=card(\"REPOSITORY SCAN\", '<button onclick=\"scanRepo()\">SCAN REPO</button>'+kv(\"Scanned\",S.repo.scannedAt||\"-\")+kv(\"Files\",S.repo.stats.total||0)+kv(\"JS\",S.repo.stats.js||0)+kv(\"MHT\",S.repo.stats.mht||0)+kv(\"TXT\",S.repo.stats.txt||0));\n    h+=card(\"MODULES DETECTED\", '<pre>'+esc(JSON.stringify(S.repo.modules,null,2))+'</pre>');\n    h+=card(\"FILES\", '<pre>'+esc((S.repo.files||[]).slice(0,180).map(function(f){return f.type+\" \"+f.rel+\" \"+(f.bytes||\"\");}).join(\"\\\\n\"))+'</pre>',\"wide\");\n  }\n  if(active===\"terminal\"){ h+=card(\"SYSTEM LOGS LIVE\", '<div id=\"terminal\">'+logs.slice(-260).map(line).join(\"\")+'</div>',\"wide\"); }\n  if(active===\"legacy\"){\n    h+=card(\"VISUELS INT\u00c9GR\u00c9S\", '<a href=\"/legacy/core\">TRILLIONS CORE</a><a href=\"/legacy/v9\">GENESIS V9</a><a href=\"/legacy/v10\">SUPREME V10</a><a href=\"/legacy/dual\">DUAL STACK</a><a href=\"/legacy/bbb\">BBB RUNTIME</a>',\"wide\");\n    h+=card(\"RAW STATE\", '<pre>'+esc(JSON.stringify(S,null,2).slice(0,10000))+'</pre>',\"wide\");\n  }\n  qs(\"#content\").innerHTML=h;\n}\nasync function load(){S=await api(\"/api/state\");render();}\nasync function updateCrypto(){await api(\"/api/crypto/update\",{method:\"POST\",body:\"{}\"});await load();}\nasync function updateBinance(){await api(\"/api/crypto/binance\",{method:\"POST\",body:\"{}\"});await load();}\nasync function scanRepo(){await api(\"/api/repo/scan\",{method:\"POST\",body:JSON.stringify({maxDepth:10})});await load();}\nasync function selectPool(id){await api(\"/api/pools/select\",{method:\"POST\",body:JSON.stringify({id})});await load();}\nasync function stratumConnect(){await api(\"/api/stratum/connect\",{method:\"POST\",body:JSON.stringify({poolIndex:0})});await load();}\nasync function stratumPing(){await api(\"/api/stratum/ping\",{method:\"POST\",body:\"{}\"});await load();}\nasync function stratumDisconnect(){await api(\"/api/stratum/disconnect\",{method:\"POST\",body:\"{}\"});await load();}\nasync function probeBTC(){await api(\"/api/blockchain/btc\",{method:\"POST\",body:JSON.stringify({url:qs(\"#btcUrl\").value,user:qs(\"#btcUser\").value,pass:qs(\"#btcPass\").value})});await load();}\nasync function probeETH(){await api(\"/api/blockchain/eth\",{method:\"POST\",body:JSON.stringify({url:qs(\"#ethUrl\").value})});await load();}\nasync function chat(withState){const m=qs(\"#msg\").value;qs(\"#msg\").value=\"\";await api(\"/api/chat\",{method:\"POST\",body:JSON.stringify({message:m,withState:withState})});await load();}\nasync function power(){await api(\"/api/runtime/power\",{method:\"POST\",body:JSON.stringify({power:!(S&&S.runtime&&S.runtime.power)})});await load();}\nfunction matrix(){const c=qs(\"#matrix\"),x=c.getContext(\"2d\");function r(){c.width=innerWidth;c.height=innerHeight}r();addEventListener(\"resize\",r);const d=Array(Math.ceil(innerWidth/14)).fill(0);setInterval(function(){x.fillStyle=\"rgba(0,0,0,.08)\";x.fillRect(0,0,c.width,c.height);x.fillStyle=\"#00ff99\";x.font=\"12px monospace\";d.forEach(function(v,i){x.fillText(Math.random()>.5?\"1\":\"0\",i*14,v*14);if(v*14>c.height&&Math.random()>.98)d[i]=0;d[i]++;});},45);}\nconst socket=io();\nsocket.on(\"log\",function(l){logs.push(l);if(logs.length>700)logs.shift();if(active===\"terminal\")render();});\nsocket.on(\"state\",function(s){S=s;render();});\ndocument.addEventListener(\"DOMContentLoaded\",function(){matrix();load();setInterval(load,20000);});\n";


function htmlPage(){
return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><title>${APP_NAME}</title>
<style>
:root{--bg:#02040a;--panel:#071120;--panel2:#0a1828;--line:#1f3b5c;--neon:#39ff88;--cyan:#35eaff;--violet:#8b4dff;--text:#e9f6ff;--muted:#8ca3bb;--red:#ff4d6d;--yellow:#ffd166}
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#02040a;color:var(--text);font-family:Inter,Consolas,monospace;overflow-x:hidden}#matrix{position:fixed;inset:0;opacity:.09;z-index:-1}
.layout{display:grid;grid-template-columns:260px 1fr;min-height:100vh}.side{border-right:1px solid var(--line);background:linear-gradient(180deg,#070b16,#03050a);padding:16px;position:sticky;top:0;height:100vh;overflow:auto}
.brand{font-weight:900;color:#fff;line-height:1.2}.brand b{color:var(--cyan);display:block;font-size:18px}.brand small{color:var(--yellow)}
.nav button,#tabs button,.card button,.card a{background:#0b1324;color:#dff;border:1px solid #24476d;border-radius:6px;padding:10px 12px;margin:4px;text-decoration:none;cursor:pointer}.nav button{display:block;width:100%;text-align:left}.nav button:hover,#tabs button.on,.card button:hover,.card a:hover{background:linear-gradient(135deg,#5436ff,#20e6ff);border-color:#7cf;color:#fff}
.main{padding:20px;min-width:0}.top{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:start}.title h1{margin:0;font-size:28px;letter-spacing:.03em}.title span{color:var(--cyan)}.pillbar{display:flex;gap:10px;flex-wrap:wrap}.pill{border:1px solid var(--line);background:#071120;border-radius:12px;padding:10px 14px;min-width:110px}.pill b{display:block;color:var(--neon)}
#tabs{display:flex;overflow-x:auto;gap:6px;margin:18px 0;border-bottom:1px solid var(--line);padding-bottom:10px}
.grid{display:grid;grid-template-columns:repeat(12,1fr);gap:12px}.card{grid-column:span 4;background:linear-gradient(180deg,rgba(12,24,42,.96),rgba(5,10,18,.96));border:1px solid #1b3554;border-radius:10px;padding:14px;box-shadow:0 0 24px rgba(0,0,0,.25);min-height:160px}.card.wide{grid-column:1/-1}.card h2{margin:0 0 12px;color:#fff;font-size:14px;letter-spacing:.04em}.kv,.coinline{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid #15304f;padding:8px 0}.kv b,.coinline em{color:#fff}.coinline b{color:var(--neon)}.reply,.chat,pre{background:#03070f;border:1px solid #173153;border-radius:8px;padding:10px;white-space:pre-wrap;max-height:420px;overflow:auto}.spark{width:100%;height:44px}.spark polyline{fill:none;stroke:var(--cyan);stroke-width:2}.spark.empty{height:44px;border:1px dashed #1b3554}
.gridcoins{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px}.coin{border:1px solid #1b3554;background:#050b14;border-radius:9px;padding:10px;display:flex;flex-direction:column;gap:5px}.coin b{color:var(--cyan);font-size:20px}.coin strong{color:var(--neon)}.coin small,.coin em{color:var(--muted)}
.pool{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;border-bottom:1px solid #15304f;padding:10px}.pool b{color:#fff}.pool span{color:var(--muted)}input{background:#03070f;color:#fff;border:1px solid #2a527b;border-radius:6px;padding:10px;width:100%;margin:5px 0}.row{display:flex;gap:8px}.danger{background:var(--red)!important}.log{font-size:13px;padding:4px 0}.log span{color:var(--muted)}.log b{color:var(--neon)}.rigart{height:160px;background:radial-gradient(circle at center,#182e69,#03070f 70%);position:relative;border-radius:10px;overflow:hidden}.rigart div{position:absolute;width:70px;height:44px;border:1px solid #35eaff;background:#0a1633;box-shadow:0 0 20px #5436ff;border-radius:8px}.rigart div:nth-child(1){left:8%;top:30%}.rigart div:nth-child(2){left:25%;top:18%}.rigart div:nth-child(3){left:42%;top:36%}.rigart div:nth-child(4){left:58%;top:22%}.rigart div:nth-child(5){left:75%;top:38%}.rigart div:nth-child(6){left:36%;top:62%}.mesh{height:250px;position:relative;background:radial-gradient(circle at center,#0b2835,#03070f);border-radius:10px}.mesh i{position:absolute;left:var(--x);top:var(--y);width:18px;height:18px;border-radius:50%;background:var(--neon);box-shadow:0 0 20px var(--neon)}
.footer{margin-top:14px;color:var(--muted);display:flex;justify-content:space-between;border-top:1px solid var(--line);padding-top:10px}
@media(max-width:900px){.layout{grid-template-columns:1fr}.side{position:relative;height:auto}.top{grid-template-columns:1fr}.card{grid-column:1/-1}.main{padding:10px}.title h1{font-size:20px}.pool{grid-template-columns:1fr}.row{flex-direction:column}}
</style></head><body><canvas id="matrix"></canvas><div class="layout"><aside class="side"><div class="brand"><b>BBB GENESIS</b>TRILLIONS MASTER<br><small>NEW GEN REAL DATA</small></div><div class="nav"><button onclick="active='dashboard';render()">Cockpit</button><button onclick="active='crypto';render()">BTC / Crypto</button><button onclick="active='emulation';render()">Emulation HW</button><button onclick="active='terminal';render()">Logs</button><button onclick="power()">POWER ON/OFF</button></div><div class="pillbar" style="margin-top:18px"><div class="pill">HONESTY<b>LOCKED</b></div><div class="pill">HW<b>EMULATED</b></div><div class="pill">DATA<b>REAL ONLY</b></div></div></aside><main class="main"><div class="top"><div class="title"><h1>COCKPIT <span>BBB GENESIS NEW GEN</span></h1><div>Fusion TRILLIONS CORE / V9 / V10 / Dual Stack / Runtime BBB</div></div><div class="pillbar"><div class="pill">STATUS<b id="status">--</b></div><div class="pill">DATA<b id="data">--</b></div><div class="pill">MODE<b id="mode">--</b></div><div class="pill">TIME<b id="time">--</b></div></div></div><div id="tabs"></div><div id="content" class="grid"></div><div class="footer"><span>EMULATION HARDWARE — REAL DATA ONLY — NO FAKE VALUES</span><span>HONESTY_GUARD_ULTIME LOCKED</span></div></main></div><script src="/socket.io/socket.io.js"></script><script>${CLIENT}</script></body></html>`;
}
app.get("/", (req,res) => res.type("html").send(htmlPage()));

/* legacy visual placeholder pages */
app.get("/legacy/:name", (req,res) => {
  const name = String(req.params.name || "core").toUpperCase();
  res.type("html").send(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#000;color:#00ffcc;font-family:Consolas;padding:20px}.box{border:1px solid #0ff;padding:20px;background:#020812}h1{color:#35eaff}</style></head><body><div class="box"><h1>TRILLIONS ${name}</h1><p>Legacy visual route preserved inside NEW GEN MASTER.</p><p>Runtime principal: <a href="/" style="color:#ff0">Retour cockpit</a></p></div></body></html>`);
});

/* ---------------- Boot ---------------- */
function boot(){
  scanRepository(ROOT, 10);
  log("BOOT", `${APP_NAME} ${VERSION}`);
  log("HONESTY", "Hardware emulated, real data only, fake values blocked");
  log("CRYPTO", "Registry loaded: "+CRYPTO_REGISTRY.map(x=>x.symbol).join(", "));
  log("RUNTIME", "Cockpit New Gen ready");
}
setInterval(() => {
  state.tick++;
  refreshMetrics();
  const msgs = ["kernel heartbeat","repo map preserved","crypto registry standing by","real data guard locked","emulated hardware layer OK","stratum manual control ready","blockchain readonly ready","AI core standing by"];
  log("TICK", msgs[state.tick % msgs.length]);
  emit("state", snapshot());
}, 7000);
io.on("connection", socket => {
  socket.emit("log", { ts:now(), channel:"SOCKET", message:"dashboard connected" });
  socket.emit("state", snapshot());
});
process.on("uncaughtException", e => log("RECOVERY", e.message));
process.on("unhandledRejection", e => log("PROMISE_RECOVERY", String(e)));
boot();
server.listen(PORT, "0.0.0.0", () => log("HTTP", `Port ${PORT} actif`));
