/*
TRILLIONS CORE RUNTIME v2
- Dashboard monitoring
- Chat IA via Pollinations (gratuit, sans clé)
- Bridge mining : rigservd POST ses stats ici via /api/mining
- Aucune seed, aucune transaction, aucun mining automatique
*/

const fs = require("fs");
const path = require("path");
const os = require("os");
const http = require("http");
const https = require("https");
const crypto = require("crypto");
const express = require("express");
const { Server } = require("socket.io");

const PORT = Number(process.env.PORT || 3000);
const ROOT = process.cwd();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.json());

const state = {
  boot: new Date().toISOString(),
  tick: 0,
  logs: [],
  files: {},
  legacy: {},
  system: {},
  mining: { connected: false, rigs: [], lastUpdate: null },
  chat: []
};

function now(){ return new Date().toISOString(); }
function log(channel, message){
  const item = { ts: now(), channel, message };
  state.logs.push(item);
  if(state.logs.length > 300) state.logs.shift();
  console.log(`[${channel}] ${item.ts} -> ${message}`);
  io.emit("log", item);
}
function fileInfo(name){
  const p = path.join(ROOT, name);
  if(!fs.existsSync(p)) return { present:false };
  const st = fs.statSync(p);
  return { present:true, bytes:st.size, modified:st.mtime.toISOString() };
}
function readFirst(names){
  for(const n of names){
    const p = path.join(ROOT,n);
    if(fs.existsSync(p)) return { name:n, text:fs.readFileSync(p,"utf8") };
  }
  return null;
}
function hash(s){ return crypto.createHash("sha256").update(s).digest("hex"); }
function count(s,k){ return (s.match(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"gi"))||[]).length; }
function hasModule(m){ try{ require.resolve(m); return true; }catch{ return false; } }

function scan(){
  const names = ["launch.txt","launch.json","trillions_legacy.launch","config.yml","config.yaml",".gitignore","package.json","app.js"];
  state.files = {};
  names.forEach(n => state.files[n] = fileInfo(n));
  state.system = {
    node: process.version,
    platform: os.platform(),
    arch: os.arch(),
    cpu: os.cpus()[0]?.model || "unknown",
    threads: os.cpus().length,
    ramGB: Math.round(os.totalmem()/1024/1024/1024),
    uptimeSec: Math.round(process.uptime()),
    modules: {
      express: hasModule("express"),
      socketio: hasModule("socket.io"),
      axios: hasModule("axios"),
      ws: hasModule("ws"),
      web3: hasModule("web3"),
      openai: hasModule("openai")
    }
  };
  const legacy = readFirst(["trillions_legacy.launch","launch.txt","launch.json"]);
  if(legacy){
    const keys = ["node","npm","app.js","launch","express","api","http","https","web3","eth","btc","wallet","address","gas","nonce","weth","rpc","wss","c++","cpp","dll","binary","miner","stratum"];
    state.legacy = {
      present:true, source:legacy.name,
      bytes:Buffer.byteLength(legacy.text),
      lines:legacy.text.split(/\r?\n/).length,
      sha256:hash(legacy.text),
      keywords:Object.fromEntries(keys.map(k=>[k,count(legacy.text,k)]))
    };
  } else { state.legacy = { present:false }; }
}

// ── IA Pollinations (gratuit, sans clé) ─────────────────────────────────────
function askPollinations(messages){
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "openai",
      messages: [
        { role:"system", content:"Tu es le runtime IA de TRILLIONS CORE. Tu aides a piloter le workspace et le mining. Sois concis et technique." },
        ...messages
      ]
    });
    const req = https.request({
      hostname:"text.pollinations.ai", path:"/openai", method:"POST",
      headers:{ "Content-Type":"application/json", "Content-Length":Buffer.byteLength(body) }
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try { resolve(JSON.parse(data).choices?.[0]?.message?.content || data); }
        catch { resolve(data); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ── API ──────────────────────────────────────────────────────────────────────
app.get("/api/state", (req,res) => {
  state.system.uptimeSec = Math.round(process.uptime());
  res.json(state);
});
app.post("/api/rescan", (req,res) => {
  scan(); log("RESCAN","Workspace rescan done"); res.json({ok:true});
});
app.get("/api/legacy/keywords", (req,res) => res.json(state.legacy.keywords||{}));

// ── Bridge mining ─────────────────────────────────────────────────────────────
// Depuis ton PC : curl -X POST https://TON-URL/api/mining \
//   -H "Content-Type: application/json" \
//   -d '{"rigs":[{"id":"rig1","coin":"XMR","hashrate":524,"accepted":10,"rejected":0}]}'
app.post("/api/mining", (req,res) => {
  state.mining.connected = true;
  state.mining.rigs = req.body.rigs || [];
  state.mining.lastUpdate = now();
  log("MINING", `${state.mining.rigs.length} rig(s) | ${JSON.stringify(state.mining.rigs).slice(0,80)}`);
  io.emit("mining", state.mining);
  res.json({ok:true});
});
app.get("/api/mining", (req,res) => res.json(state.mining));

// ── Chat IA ──────────────────────────────────────────────────────────────────
app.post("/api/chat", async (req,res) => {
  const { message } = req.body;
  if(!message) return res.status(400).json({error:"message requis"});
  state.chat.push({role:"user", content:message});
  if(state.chat.length > 20) state.chat = state.chat.slice(-20);
  log("CHAT", `> ${message.slice(0,60)}`);
  try {
    const reply = await askPollinations(state.chat);
    state.chat.push({role:"assistant", content:reply});
    log("CHAT", `< ${reply.slice(0,60)}`);
    res.json({reply});
  } catch(err) {
    log("CHAT", `Erreur: ${err.message}`);
    res.status(500).json({error:err.message});
  }
});

io.on("connection", socket => {
  socket.emit("log",{ts:now(),channel:"SOCKET",message:"dashboard connected"});
  socket.emit("mining", state.mining);
});

// ── Dashboard ────────────────────────────────────────────────────────────────
app.get("/", (req,res) => res.type("html").send(`<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TRILLIONS CORE v2</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#000;color:#00ff99;font-family:Consolas,monospace;padding:14px}
h1{color:#31e8ff;text-shadow:0 0 10px #31e8ff;margin:0 0 2px}
.sub{color:#446;font-size:11px;margin-bottom:12px}
.grid{display:grid;gap:10px}
.card{border:1px solid #00ff99;background:#03110a;padding:12px}
pre{white-space:pre-wrap;font-size:11px;line-height:1.5;margin:0}
.badge{display:inline-block;border:1px solid #00ff99;padding:2px 7px;margin:2px;font-size:11px}
.miss{border-color:#ff4040!important;color:#ff4040!important}
#logs{height:150px;overflow-y:auto;font-size:10px;padding:6px;border:1px solid #0a2a1a}
#mining-status{color:#ffcc00;font-size:12px;margin-bottom:6px}
#chat-box{height:150px;overflow-y:auto;font-size:12px;padding:6px;border:1px solid #0a2a1a;margin-bottom:6px}
.u{color:#31e8ff}.a{color:#00ff99}.err{color:#f44}
#chat-row{display:flex;gap:6px}
#chat-in{flex:1;background:#001a0a;color:#00ff99;border:1px solid #00ff99;padding:6px;font-family:Consolas,monospace;font-size:12px}
button{background:#001b10;color:#00ff99;border:1px solid #00ff99;padding:7px 12px;cursor:pointer;font-family:Consolas,monospace}
button:hover{background:#003020}
h3{margin:0 0 8px;font-size:13px;color:#31e8ff}
@media(min-width:700px){.grid{grid-template-columns:1fr 1fr}.wide{grid-column:1/-1}}
</style></head><body>
<h1>TRILLIONS CORE RUNTIME v2</h1>
<p class="sub">Smartphone -> Cloud -> Mining local. POST /api/mining depuis rigservd.</p>
<div class="grid">

<div class="card">
<h3>Systeme</h3><pre id="sys">...</pre>
</div>

<div class="card">
<h3>Mining Bridge</h3>
<div id="mining-status">En attente du rig...</div>
<div id="rigs-list" style="font-size:11px"></div>
<p style="font-size:10px;color:#336;margin:8px 0 0">POST /api/mining depuis ton PC</p>
</div>

<div class="card">
<h3>Modules</h3><div id="mods"></div>
<br><button onclick="rescan()">Rescan</button>
</div>

<div class="card">
<h3>Legacy</h3><pre id="leg">...</pre>
</div>

<div class="card wide">
<h3>Chat IA (Pollinations)</h3>
<div id="chat-box"></div>
<div id="chat-row">
<input id="chat-in" placeholder="Question au runtime...">
<button onclick="sendChat()">Send</button>
</div>
</div>

<div class="card wide">
<h3>Terminal</h3><div id="logs"></div>
</div>

</div>
<script src="/socket.io/socket.io.js"></script>
<script>
const socket=io();
const logsEl=document.getElementById("logs");
const chatBox=document.getElementById("chat-box");

function addLog(x){
  logsEl.textContent+="["+x.channel+"] "+x.ts.slice(11,19)+" -> "+x.message+"\\n";
  logsEl.scrollTop=logsEl.scrollHeight;
}
socket.on("log",addLog);
socket.on("mining",renderMining);

function renderMining(m){
  const st=document.getElementById("mining-status");
  const rl=document.getElementById("rigs-list");
  if(m.connected){
    st.textContent="CONNECTE "+m.lastUpdate.slice(11,19);
    rl.innerHTML=(m.rigs||[]).map(r=>
      "<div>> "+r.id+" | "+r.coin+" | "+r.hashrate+" H/s | acc:"+r.accepted+"</div>"
    ).join("")||"<div style='color:#446'>payload vide</div>";
  } else {
    st.textContent="En attente du rig...";
    rl.innerHTML="";
  }
}

async function load(){
  const s=await(await fetch("/api/state")).json();
  document.getElementById("sys").textContent=
    "Node "+s.system.node+" | "+s.system.platform+"/"+s.system.arch+"\\n"+
    s.system.cpu+"\\n"+
    s.system.threads+" threads | "+s.system.ramGB+"GB | uptime "+s.system.uptimeSec+"s";
  document.getElementById("leg").textContent=s.legacy.present
    ?"Source: "+s.legacy.source+"\\nLignes: "+s.legacy.lines+" | "+s.legacy.bytes+" bytes\\nSHA: "+s.legacy.sha256.slice(0,20)+"..."
    :"Aucun fichier legacy";
  document.getElementById("mods").innerHTML=Object.entries(s.system.modules||{}).map(
    ([k,v])=>'<span class="badge'+(v?"":" miss")+'">'+k+":"+(v?"OK":"MISSING")+"</span>"
  ).join("");
  renderMining(s.mining);
  logsEl.textContent="";
  (s.logs||[]).forEach(addLog);
}

async function rescan(){ await fetch("/api/rescan",{method:"POST"}); load(); }

async function sendChat(){
  const inp=document.getElementById("chat-in");
  const msg=inp.value.trim(); if(!msg) return;
  inp.value="";
  chatBox.innerHTML+='<div class="u">> '+msg+'</div>';
  chatBox.scrollTop=chatBox.scrollHeight;
  try{
    const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:msg})});
    const d=await r.json();
    chatBox.innerHTML+='<div class="'+(d.reply?"a":"err")+'">< '+(d.reply||d.error)+'</div>';
  }catch(e){ chatBox.innerHTML+='<div class="err">Erreur reseau</div>'; }
  chatBox.scrollTop=chatBox.scrollHeight;
}
document.getElementById("chat-in").addEventListener("keydown",e=>{if(e.key==="Enter")sendChat();});
load();
</script></body></html>`));

// ── Boot ─────────────────────────────────────────────────────────────────────
function boot(){
  console.log("================================================");
  console.log(" TRILLIONS CORE RUNTIME v2");
  console.log("================================================");
  scan();
  log("BOOT","Runtime v2 initialized");
  log("SYSTEM",`${state.system.node} / ${state.system.platform} / ${state.system.cpu}`);
  if(state.legacy.present) log("LEGACY",`${state.legacy.source} : ${state.legacy.lines} lignes`);
  log("MINING","Bridge /api/mining actif — en attente du rigservd");
  log("AI","Chat Pollinations actif sur /api/chat");
  log("SAFE","Aucune seed / transaction automatique");
}

setInterval(()=>{
  state.tick++;
  const m=["Terminal orchestration running","Workspace heartbeat","Legacy map preserved","Runtime bridge online","Dependency layer standing by","Core host stable"];
  log("TICK",m[state.tick%m.length]);
},5000);

boot();
server.listen(PORT,"0.0.0.0",()=>log("HTTP",`Port ${PORT} actif`));
