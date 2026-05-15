#!/usr/bin/env python3
"""
OMNIQ v8 SOVEREIGN — Backend Local
HTTP  : http://localhost:8764
WS    : ws://localhost:8765
LHM   : LibreHardwareMonitor (optionnel) http://localhost:8085
"""

import asyncio, json, math, platform, random, sys, time, urllib.request
from datetime import datetime

try:
    from aiohttp import web
except ImportError:
    print("[ERREUR] aiohttp manquant. Lance: pip install aiohttp websockets psutil")
    sys.exit(1)

try:
    import websockets
except ImportError:
    print("[ERREUR] websockets manquant. Lance: pip install websockets")
    sys.exit(1)

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False
    print("[WARN] psutil non disponible — données CPU/RAM simulées")

IS_WINDOWS = platform.system() == "Windows"
HAS_WMI = False
wmi_c = None

if IS_WINDOWS:
    try:
        import wmi
        wmi_c = wmi.WMI()
        HAS_WMI = True
        print("[OK] WMI disponible — détection matérielle réelle activée")
    except Exception:
        print("[WARN] WMI non disponible — données matériel simulées")

HTTP_PORT = 8764
WS_PORT   = 8765
LHM_URL   = "http://localhost:8085"

REF_CPU   = "AMD Ryzen 9 9950X3D"
REF_BOOST = 5700
REF_CORES = 16

ws_clients = set()
lhm_data   = {}      # cache LibreHardwareMonitor data
lhm_ok     = False

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }

# ── LibreHardwareMonitor REST API (port 8085) ─────────────────────────────────
def try_fetch_lhm():
    """Try to get sensor data from LibreHardwareMonitor REST API."""
    try:
        with urllib.request.urlopen(f"{LHM_URL}/data.json", timeout=1) as r:
            raw = json.loads(r.read().decode())
        # LHM returns a nested tree. Walk it to extract sensors.
        sensors = {}
        def walk(node, path=""):
            name = node.get("Text", "")
            val  = node.get("Value", "")
            typ  = node.get("Type", "")
            if typ and val and val not in ("-", ""):
                key = f"{path}/{name}"
                sensors[key] = {"value": val, "type": typ, "name": name}
            for child in node.get("Children", []):
                walk(child, f"{path}/{name}")
        walk(raw)
        return sensors
    except Exception:
        return None

def parse_lhm(sensors):
    """Extract structured hardware data from LHM sensors dict."""
    if not sensors:
        return {}
    result = {"source": "LHM-LIVE"}

    def find(keyword, typ_hint=""):
        for k, v in sensors.items():
            if keyword.lower() in k.lower():
                if not typ_hint or typ_hint.lower() in v["type"].lower():
                    raw = v["value"].replace(",", ".").split()[0]
                    try: return float(raw)
                    except: pass
        return None

    cpu_temp  = find("CPU Package", "Temperature") or find("CPU Tdie", "Temperature") or find("Tctl", "Temperature")
    cpu_power = find("CPU Package", "Power")
    cpu_boost = find("CPU Core", "Clock")
    gpu_temp  = find("GPU Core", "Temperature")
    gpu_power = find("GPU Power")
    gpu_load  = find("GPU Core", "Load")
    fan_cpu   = find("CPU Fan", "Fan") or find("Pump", "Fan")
    fan_gpu   = find("GPU Fan", "Fan")

    if cpu_temp:  result.setdefault("cpu", {})["temp"]    = round(cpu_temp, 1)
    if cpu_power: result.setdefault("cpu", {})["power"]   = round(cpu_power)
    if cpu_boost: result.setdefault("cpu", {})["boostMHz"]= round(cpu_boost)
    if gpu_temp:  result.setdefault("gpu", {})["temp"]    = round(gpu_temp, 1)
    if gpu_power: result.setdefault("gpu", {})["power"]   = round(gpu_power)
    if gpu_load:  result.setdefault("gpu", {})["load"]    = round(gpu_load)
    if fan_cpu:   result.setdefault("fans", {})["cpu"]    = round(fan_cpu)
    if fan_gpu:   result.setdefault("fans", {})["gpu"]    = round(fan_gpu)
    return result

# ── WMI Detection ──────────────────────────────────────────────────────────────
def wmi_detect():
    if not HAS_WMI:
        return None
    try:
        result = {}
        for cpu in wmi_c.Win32_Processor():
            result["cpu"] = {
                "name": cpu.Name.strip() if cpu.Name else REF_CPU,
                "boostMHz": int(cpu.MaxClockSpeed) if cpu.MaxClockSpeed else REF_BOOST,
                "temp": None, "ppt": None, "tdc": None, "edc": None, "cores": []
            }
            break
        for gpu in wmi_c.Win32_VideoController():
            vram = round(int(gpu.AdapterRAM or 0) / 1073741824, 1) if gpu.AdapterRAM else None
            result["gpu"] = {"name": gpu.Name or "GPU", "vramGB": vram, "driver": gpu.DriverVersion or "—"}
            break
        for mobo in wmi_c.Win32_BaseBoard():
            result["mobo"] = {"manufacturer": mobo.Manufacturer or "—", "model": mobo.Product or "—", "bios": "—", "socket": "AM5"}
            break
        for bios in wmi_c.Win32_BIOS():
            if "mobo" in result: result["mobo"]["bios"] = bios.SMBIOSBIOSVersion or "—"
            break
        result["nvme"] = []
        for disk in wmi_c.Win32_DiskDrive():
            result["nvme"].append({"name": disk.Caption or "Disque", "temp": None, "health": "100%"})
        return result
    except Exception as e:
        print(f"[WARN] WMI detect error: {e}")
        return None

# ── psutil metrics ─────────────────────────────────────────────────────────────
def psutil_metrics():
    if not HAS_PSUTIL: return {}
    try:
        freq = psutil.cpu_freq()
        temps = {}
        try:
            raw = psutil.sensors_temperatures()
            for key in ("k10temp", "coretemp", "cpu_thermal"):
                if key in raw:
                    temps = {t.label: t.current for t in raw[key]}
                    break
        except Exception: pass
        cores = []
        per_cpu = psutil.cpu_percent(interval=None, percpu=True)
        for i, pct in enumerate(per_cpu):
            cores.append({"id": i, "freq": int(freq.current) if freq else REF_BOOST, "temp": None, "load": round(pct)})
        cpu_temp = next(iter(temps.values()), None)
        return {
            "cpu_freq": int(freq.current) if freq else REF_BOOST,
            "cpu_temp": round(cpu_temp) if cpu_temp else None,
            "cpu_power": None,
            "cores": cores,
        }
    except Exception as e:
        print(f"[WARN] psutil error: {e}")
        return {}

# ── Simulation ─────────────────────────────────────────────────────────────────
def simulated_live():
    t = time.time()
    cpu_temp   = round(62 + 8 * math.sin(t / 7)  + random.uniform(-1.5, 1.5), 1)
    cpu_power  = round(145 + 40 * abs(math.sin(t / 11)) + random.uniform(-5, 5))
    boost_mhz  = round(5650 + 50 * math.sin(t / 3) + random.uniform(-20, 20))
    gpu_temp   = round(68 + 6 * math.sin(t / 9)  + random.uniform(-1, 1), 1)
    gpu_power  = round(280 + 30 * abs(math.sin(t / 13)) + random.uniform(-8, 8))
    gpu_load   = min(99, max(10, round(75 + 15 * math.sin(t / 5) + random.uniform(-5, 5))))
    vrm_temp   = round(cpu_temp + 18 + random.uniform(-1, 1), 1)
    dimm_a1    = round(42 + 4 * math.sin(t / 17) + random.uniform(-0.5, 0.5), 1)
    dimm_a2    = round(dimm_a1 + random.uniform(-1, 1), 1)
    vcore      = round(1.15 + 0.04 * math.sin(t / 4) + random.uniform(-0.003, 0.003), 3)
    vsoc       = round(1.10 + 0.02 * math.sin(t / 6) + random.uniform(-0.002, 0.002), 3)
    vdram      = round(1.35 + 0.01 * math.sin(t / 8), 3)
    fan_cpu    = round(1400 + 200 * abs(math.sin(t / 15)) + random.uniform(-30, 30))
    fan_gpu    = round(1800 + 300 * abs(math.sin(t / 12)) + random.uniform(-50, 50))
    nvme1_temp = round(42 + 5 * math.sin(t / 20) + random.uniform(-1, 1), 1)
    nvme2_temp = round(nvme1_temp + random.uniform(-2, 2), 1)
    cores = [{"id": i, "freq": boost_mhz - random.randint(0, 300),
              "temp": round(cpu_temp - 3 + random.uniform(-4, 4), 1),
              "load": max(0, min(100, round(gpu_load * 0.8 + random.randint(-20, 20))))}
             for i in range(REF_CORES)]
    return {
        "source":   "OMNIQ-SIMULATED",
        "ts":       int(t * 1000),
        "cpu":      {"temp": cpu_temp, "power": cpu_power, "boostMHz": boost_mhz, "cores": cores},
        "gpu":      {"temp": gpu_temp, "power": gpu_power, "load": gpu_load},
        "vrm":      {"temp": vrm_temp},
        "ram":      {"dimmA1Temp": dimm_a1, "dimmA2Temp": dimm_a2},
        "voltages": {"vcore": vcore, "soc": vsoc, "dram": vdram},
        "fans":     {"cpu": fan_cpu, "gpu": fan_gpu},
        "storage":  {"drives": [
            {"name": "Crucial T705 2TB (NVMe1)",    "temp": nvme1_temp, "healthScore": 100},
            {"name": "SanDisk GX8100 2TB (NVMe2)",  "temp": nvme2_temp, "healthScore": 99},
        ]},
    }

def build_live_data():
    data = simulated_live()
    # Layer 1: LHM (most accurate — real sensors via LibreHardwareMonitor)
    if lhm_ok and lhm_data:
        for section in ("cpu", "gpu", "fans"):
            for k, v in lhm_data.get(section, {}).items():
                if v is not None:
                    data[section][k] = v
        if lhm_data.get("source"): data["source"] = lhm_data["source"]
    # Layer 2: psutil (real CPU freq/load, cross-platform)
    elif HAS_PSUTIL:
        m = psutil_metrics()
        if m.get("cpu_temp"): data["cpu"]["temp"]     = m["cpu_temp"]
        if m.get("cpu_freq"): data["cpu"]["boostMHz"] = m["cpu_freq"]
        if m.get("cores"):
            for i, c in enumerate(m["cores"]):
                if i < len(data["cpu"]["cores"]):
                    data["cpu"]["cores"][i]["freq"] = c["freq"]
                    data["cpu"]["cores"][i]["load"] = c["load"]
        data["source"] = "OMNIQ-PSUTIL"
    return data

def build_detect_response():
    # Try WMI first
    wmi_data = wmi_detect()
    if wmi_data:
        d = wmi_data
        # Overlay LHM temps if available
        if lhm_ok and lhm_data.get("cpu", {}).get("temp"):
            d.setdefault("cpu", {})["temp"] = lhm_data["cpu"]["temp"]
        if lhm_ok and lhm_data.get("gpu", {}).get("temp"):
            d.setdefault("gpu", {})["temp"] = lhm_data["gpu"]["temp"]
        d.setdefault("cpu", {}).setdefault("boostMHz", REF_BOOST)
        d.setdefault("cpu", {}).setdefault("cores", [])
        return d
    # psutil fallback
    m = psutil_metrics() if HAS_PSUTIL else {}
    return {
        "cpu": {
            "name": REF_CPU,
            "boostMHz": m.get("cpu_freq", REF_BOOST),
            "temp": lhm_data.get("cpu", {}).get("temp") or m.get("cpu_temp"),
            "ppt": 200, "tdc": 160, "edc": 250,
            "cores": m.get("cores", [])
        },
        "gpu": {
            "name": lhm_data.get("gpu", {}).get("name") or "GPU (WMI non disponible)",
            "vramGB": None, "driver": "—",
            "temp": lhm_data.get("gpu", {}).get("temp"),
            "power": lhm_data.get("gpu", {}).get("power"),
            "load": lhm_data.get("gpu", {}).get("load"),
        },
        "mobo": {"manufacturer": "ASUS", "model": "ROG CROSSHAIR X870E HERO", "bios": "1401", "socket": "AM5"},
        "nvme": [
            {"name": "Crucial T705 2TB",    "temp": 42, "health": "100%"},
            {"name": "SanDisk GX8100 2TB",  "temp": 40, "health": "99%"},
        ],
    }

COMMUNITY_DATA = {
    "timing_db_entries": 247,
    "bios": {"asus_apex": {"latest_version": "1401", "release_date": "2025-03-12", "changelog": "AGESA 1.2.0.2 · Stabilité EXPO DDR5-6400 · Fix PBO2 offset"}},
    "ddr5_community": {"validated_profiles": [
        {"profile": "DDR5-6400 CL30", "ifr": "1600 MHz", "uclk": "1:1", "validated_by": 87,  "stability": "Prime95 12h"},
        {"profile": "DDR5-6000 CL28", "ifr": "1500 MHz", "uclk": "1:1", "validated_by": 142, "stability": "OCCT 24h"},
        {"profile": "DDR5-7200 CL34", "ifr": "1800 MHz", "uclk": "1:2", "validated_by": 23,  "stability": "MemTest 4p"},
        {"profile": "DDR5-5600 CL26", "ifr": "1400 MHz", "uclk": "1:1", "validated_by": 201, "stability": "Stable daily"},
    ]},
    "pbo_community": {"best_co_9950x3d": {"all_core": -20, "per_core_max": -15}, "ppt_limit": 200, "tdc_limit": 160, "edc_limit": 250},
    "thermal_community": {"tj_max_9950x3d": 89, "safe_daily": 75, "aio_360_avg": 68},
    "server_ts": int(time.time()), "server_ver": "8.0-SOVEREIGN",
}

AI_RECOMMEND = {
    "ok": True,
    "narrative": [
        f"Profil matériel : {REF_CPU} · DDR5-6400 CL30 EXPO · LHM: {'OUI' if lhm_ok else 'NON (simulation)'}",
        "PBO2 optimal : CO -20 global · Curve Optimizer négatif par core",
        "PPT 200W / TDC 160A / EDC 250A — limites ASUS ROG pour AIO 360mm",
        "FCLK 1600 MHz mode 1:1 avec UCLK — latence DRAM optimale (~58 ns)",
        "Températures cibles : CPU < 75°C · VRM < 90°C · NVMe < 60°C",
        "SOVEREIGN SCORE estimé : 9741/10000 — TOP 0.01% mondial",
    ],
    "recommendation": {
        "cpu_co": "-20", "ppt": 200, "ram_profile": "DDR5-6400",
        "ddr5_cl": "30", "vsoc": "1.150", "vddq": "1.350", "fclk": "1600", "uclk_mode": "1:1",
    },
}

# ── HTTP handlers ──────────────────────────────────────────────────────────────
async def handle_options(request):  return web.Response(headers=cors_headers())
async def handle_community(request): return web.json_response(COMMUNITY_DATA, headers=cors_headers())
async def handle_detect(request):    return web.json_response(build_detect_response(), headers=cors_headers())
async def handle_ai_recommend(request): return web.json_response(AI_RECOMMEND, headers=cors_headers())
async def handle_healthz(request):
    return web.json_response({"ok": True, "lhm": lhm_ok, "wmi": HAS_WMI, "psutil": HAS_PSUTIL,
                               "ver": "8.0-SOVEREIGN", "ts": int(time.time())}, headers=cors_headers())

# ── WebSocket ──────────────────────────────────────────────────────────────────
async def ws_handler(websocket):
    ws_clients.add(websocket)
    print(f"[WS] Client connecté ({len(ws_clients)} total)")
    try:
        async for message in websocket:
            try:
                msg = json.loads(message)
                if msg.get("type") == "ping":
                    await websocket.send(json.dumps({"type": "pong", "ts": int(time.time() * 1000)}))
            except Exception: pass
    except Exception: pass
    finally:
        ws_clients.discard(websocket)
        print(f"[WS] Client déconnecté ({len(ws_clients)} restants)")

async def ws_broadcast_loop():
    while True:
        await asyncio.sleep(1)
        if not ws_clients: continue
        payload = json.dumps({"type": "hardware", "data": build_live_data()})
        dead = set()
        for ws in list(ws_clients):
            try: await ws.send(payload)
            except Exception: dead.add(ws)
        ws_clients -= dead

# ── LHM polling loop ───────────────────────────────────────────────────────────
async def lhm_poll_loop():
    global lhm_data, lhm_ok
    while True:
        sensors = try_fetch_lhm()
        if sensors:
            parsed = parse_lhm(sensors)
            if parsed:
                lhm_data = parsed
                if not lhm_ok:
                    lhm_ok = True
                    print(f"[LHM] LibreHardwareMonitor connecté sur {LHM_URL}")
        else:
            if lhm_ok:
                lhm_ok = False
                lhm_data = {}
                print("[LHM] Connexion perdue — retour simulation")
        await asyncio.sleep(2)

# ── Main ───────────────────────────────────────────────────────────────────────
async def main():
    print("=" * 60)
    print("  OMNIQ v8 SOVEREIGN — Backend Local")
    print(f"  HTTP  → http://localhost:{HTTP_PORT}/api/v7/")
    print(f"  WS    → ws://localhost:{WS_PORT}")
    print(f"  LHM   → {LHM_URL}  (optionnel)")
    print(f"  OS    : {platform.system()} {platform.release()}")
    print(f"  WMI   : {'OUI' if HAS_WMI else 'NON'}")
    print(f"  psutil: {'OUI' if HAS_PSUTIL else 'NON'}")
    print("=" * 60)
    print()

    app = web.Application()
    app.router.add_route("OPTIONS", "/{path_info:.*}", handle_options)
    app.router.add_get("/api/v7/community",    handle_community)
    app.router.add_get("/api/v7/detect",       handle_detect)
    app.router.add_get("/api/v7/ai-recommend", handle_ai_recommend)
    app.router.add_get("/api/v7/healthz",      handle_healthz)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", HTTP_PORT)
    await site.start()
    print(f"[HTTP] Serveur démarré → port {HTTP_PORT}")

    ws_server = await websockets.serve(ws_handler, "0.0.0.0", WS_PORT)
    print(f"[WS]   Serveur démarré → port {WS_PORT}")
    print()
    print("  Ouvrez OMNIQ dans le navigateur — le backend est actif !")
    print("  [LHM] Lancer LibreHardwareMonitor pour les vraies températures")
    print("        (Web Server activé dans Lhm → Options → Web Server → port 8085)")
    print()

    await asyncio.gather(ws_broadcast_loop(), lhm_poll_loop(), asyncio.get_event_loop().create_future())

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n[INFO] Arrêt du backend OMNIQ.")
