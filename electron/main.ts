import { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage, net, session } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import crypto from 'node:crypto'
import nodeNet from 'node:net'
import https from 'node:https'
import http from 'node:http'
import { spawn, execSync, exec } from 'node:child_process'
import dns from 'node:dns'
import { promisify } from 'node:util'
import { generateXrayConfig, APPS_RULES, KNOWN_APP_ROUTE_RANGES, IP_CHECK_DOMAINS, RU_BYPASS_CIDRS } from './vpnConfig'

const dnsLookup = promisify(dns.lookup);

// Неблокирующий exec — для коротких системных команд внутри hot path (route add,
// reg add, taskkill, netsh). execSync блокирует main process Electron и вызывает
// "программа не отвечает". fire-and-forget стиль: ошибки логируются, но не бросаются.
function execNB(cmd: string, timeoutMs = 3000): Promise<void> {
  return new Promise((resolve) => {
    exec(cmd, { timeout: timeoutMs, windowsHide: true }, () => resolve());
  });
}

async function resolveDomainsToIps(domains: string[]): Promise<string[]> {
  const unique = [...new Set(domains.filter(d => d.includes('.')))];
  const results = await Promise.allSettled(
    unique.slice(0, 100).map(d => new Promise<string[]>((resolve) => {
      dns.resolve4(d, (err, addrs) => resolve(err ? [] : addrs));
    }))
  );
  const ips: string[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') ips.push(...r.value);
  }
  return [...new Set(ips)];
}

const API_BASE_URL = "https://narodniyvpn.online";
const ACTIVATE_ENDPOINT = `${API_BASE_URL}/api/key/activate`;

app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-http-cache');

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null = null
let splash: BrowserWindow | null = null
let tray: Tray | null = null

let vpnProcess: any = null;
let zapretProcess: any = null;
let tun2socksProcess: any = null;
let tunAddedRoutes: string[] = [];
let routeInjectorTimer: ReturnType<typeof setInterval> | null = null;
let discordProcMonitorTimer: ReturnType<typeof setInterval> | null = null;
let discordDomainRefreshTimer: ReturnType<typeof setInterval> | null = null;
const injectedRoutes = new Set<string>();

let lastFinalLink: string | null = null;
let lastVpnArgs: { activeApps: string[]; isProxyAll: boolean; routingMode: string; bypassRu: boolean } | null = null;
let isIntentionalStop = false;
let reconnectCount = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const MAX_RECONNECTS = 5;

let isQuitting = false
let isToggling = false;
// Флаг отмены идущего vpn-start: vpn-stop может быть вызван пока connect ещё в процессе.
// vpn-start проверяет этот флаг на await-точках и аккуратно сворачивается.
let cancelRequested = false;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      if (!win.isVisible()) win.show();
      win.focus();
    }
  });

  const SPLASH_PHRASES = [
    "Прячем ваш IP под коврик...",
    "Котик запутывает следы...",
    "Агент Мяу выходит на связь...",
    "Ищем самый быстрый клубок...",
    "Прогоняем злых хакеров...",
    "Греем сервера пузиком..."
  ];

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const ENCRYPTION_KEY = "narodniy_vpn_super_secret_key_32"; 
  const IV_KEY = "narodniy_init_16";

  const CONFLICTING_APPS = [
    "winws.exe", "zapret.exe", "goodbyedpi.exe", "GoodbyeDPI.exe",
    "tun2socks.exe", "sing-box.exe", "clash.exe", "nekoray.exe", "v2rayN.exe"
  ];

  const ROBLOX_DOMAINS = [
      "roblox.com", "www.roblox.com", "rbxcdn.com", "rblx.com", "robloxlabs.com", "rbx.com",
      "setup.roblox.com", "cdn.roblox.com", "clientsettings.roblox.com", "versioncompatibility.api.roblox.com",
      "c5.rbxcdn.com", "c7.rbxcdn.com", "t0.rbxcdn.com", "t1.rbxcdn.com", "t2.rbxcdn.com", "t3.rbxcdn.com",
      "t4.rbxcdn.com", "t5.rbxcdn.com", "t6.rbxcdn.com", "t7.rbxcdn.com",
      "clientsettingscdn.roblox.com", "metrics.roblox.com", "apis.roblox.com",
      "s3.amazonaws.com", "roblox-setup.s3.amazonaws.com", "ecst.roblox.com",
      "digicert.com", "cacerts.digicert.com", "identrust.com"
  ];

// --- Умное определение страны и кода ---
  function getCountryInfo(name: string): { code: string | null, emoji: string } {
    
    // 1. ПРЯМОЕ ЧТЕНИЕ ЭМОДЗИ (Если ты уже поставил флаг прямо в название)
    const emojiMap: Record<string, string> = {
        '🇳🇱': 'nl', '🇩🇪': 'de', '🇺🇸': 'us', '🇫🇮': 'fi', '🇷🇺': 'ru',
        '🇹🇷': 'tr', '🇰🇿': 'kz', '🇬🇧': 'gb', '🇫🇷': 'fr', '🇸🇪': 'se', '🇵🇱': 'pl'
    };
    
    // Проверяем, есть ли в названии готовый эмодзи флага
    for (const [emj, code] of Object.entries(emojiMap)) {
        if (name.includes(emj)) return { code: code, emoji: emj };
    }

    const n = name.toLowerCase();

    // 2. ПОЛНЫЕ СЛОВА И КИРИЛЛИЦА
    if (n.includes('russia') || n.includes('moscow') || n.includes('ру') || n.includes('запасной') || n.includes('основной')) return { code: 'ru', emoji: '🇷🇺' };
    if (n.includes('netherlands') || n.includes('amsterdam') || n.includes('holland') || n.includes('нл')) return { code: 'nl', emoji: '🇳🇱' };
    if (n.includes('germany') || n.includes('frankfurt') || n.includes('berlin') || n.includes('falkenstein')) return { code: 'de', emoji: '🇩🇪' };
    if (n.includes('america') || n.includes('usa') || n.includes('new york') || n.includes('california')) return { code: 'us', emoji: '🇺🇸' };
    if (n.includes('finland') || n.includes('helsinki')) return { code: 'fi', emoji: '🇫🇮' };
    if (n.includes('turkey') || n.includes('istanbul')) return { code: 'tr', emoji: '🇹🇷' };
    if (n.includes('kazakhstan') || n.includes('almaty') || n.includes('astana')) return { code: 'kz', emoji: '🇰🇿' };
    if (n.includes('united kingdom') || n.includes('london')) return { code: 'gb', emoji: '🇬🇧' };
    if (n.includes('france') || n.includes('paris')) return { code: 'fr', emoji: '🇫🇷' };
    if (n.includes('sweden') || n.includes('stockholm')) return { code: 'se', emoji: '🇸🇪' };
    if (n.includes('poland') || n.includes('warsaw')) return { code: 'pl', emoji: '🇵🇱' };

    // 3. УМНЫЙ ПОИСК КОДА СТРАНЫ (nl, NL, de, fr и т.д.)
    const match = name.match(/(?:^|[^a-zA-Z])(nl|de|us|fi|ru|tr|kz|gb|uk|fr|se|pl|it|es|ch)(?![a-zA-Z])/i);
    if (match) {
        let code = match[1].toLowerCase();
        if (code === 'uk') code = 'gb'; 
        
        const char1 = code.charCodeAt(0) - 97 + 127462;
        const char2 = code.charCodeAt(1) - 97 + 127462;
        const emoji = String.fromCodePoint(char1, char2);
        
        return { code, emoji };
    }

    return { code: null, emoji: '🌐' };
  }

  // ✅ ФУНКЦИЯ ЗАМЕРА (Одиночный пинг)
  async function measureTcpLatency(host: string, port: number): Promise<number> {
    return new Promise((resolve) => {
        const start = Date.now();
        const socket = new nodeNet.Socket();
        
        socket.setTimeout(1500); // Таймаут 1.5 сек

        socket.on('connect', () => {
            const duration = Date.now() - start;
            socket.destroy();
            resolve(duration);
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve(-1);
        });

        socket.on('error', () => {
            socket.destroy();
            resolve(-1);
        });

        try {
            socket.connect(port, host);
        } catch (e) {
            resolve(-1);
        }
    });
  }

  function isUserAdmin(): boolean {
    try {
        const result = execSync(
            'powershell -NoProfile -Command "[bool](([System.Security.Principal.WindowsPrincipal][System.Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator))"',
            { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
        ).trim();
        return result === 'True';
    } catch (e) {
        try {
            execSync('net session', { stdio: 'ignore' });
            return true;
        } catch (e2) {
            return false;
        }
    }
  }

  function getFriendlyError(error: any): string {
    const msg = error.toString().toLowerCase();

    if (msg.includes('enotfound') || 
        msg.includes('net::err_internet_disconnected') || 
        msg.includes('net::err_name_not_resolved') ||
        msg.includes('net::err_connection_failed') ||
        msg.includes('eai_again')) {
        return "Отсутствует подключение к интернету. Проверьте сеть.";
    }
    
    if (msg.includes('etimedout') || msg.includes('esockettimedout')) {
        return "Сервер не отвечает (TimeOut). Попробуйте позже.";
    }

    if (msg.includes('econnrefused')) {
        return "Сервер активации недоступен. Технические работы?";
    }

    if (error.status === 404) return "Ключ не найден или срок действия истёк.";
    if (error.status === 403) return "Доступ запрещен. Проверьте ключ.";
    if (error.status === 500) return "Ошибка на сервере VPN. Мы уже чиним.";
    if (error.status === 409) return "Ключ уже используется на другом устройстве.";

    if (msg.includes('xray missing')) return "Файл xray.exe не найден. Переустановите программу.";
    if (msg.includes('config gen error')) return "Ошибка обработки ключа. Неверный формат.";

    return msg.length > 100 ? "Неизвестная ошибка сети" : msg;
  }

  function getHardwareId(): string {
    try {
      const platform = os.platform();
      const arch = os.arch();
      const hostname = os.hostname();
      const cpus = os.cpus().map(cpu => cpu.model).join('');
      const totalMem = os.totalmem();
      const rawId = `${platform}-${arch}-${hostname}-${cpus}-${totalMem}`;
      return crypto.createHash('sha256').update(rawId).digest('hex');
    } catch (e) {
      return "fallback-hwid-" + Math.random().toString(36).substring(7);
    }
  }

  function decryptPayload(inputLink: string): string {
    let link = inputLink.trim().replace(/["\\]/g, "");
    if (link.startsWith('narodniy://')) {
      try {
        const encryptedPayload = link.replace('narodniy://', '');
        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, IV_KEY);
        let decrypted = decipher.update(encryptedPayload, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted.trim();
      } catch (e) { return link; }
    }
    return link;
  }

  function sanitizeUrl(rawUrl: string): string {
    let url = rawUrl.trim();
    if (url.startsWith("http://")) url = url.replace("http://", "https://");
    if (url.includes("api.narodniyvpn.online")) url = url.replace("api.narodniyvpn.online", "narodniyvpn.online");
    if (url.includes(":8443")) url = url.replace(":8443", "");
    return url;
  }

  async function apiRequest(url: string, method: 'GET' | 'POST', body: any = null): Promise<any> {
      return new Promise((resolve, reject) => {
          const request = net.request({ method, url, useSessionCookies: false });
          if (body) {
              request.setHeader('Content-Type', 'application/json');
              request.write(JSON.stringify(body));
          }
          request.on('response', (response) => {
              let data = '';
              response.on('data', (chunk) => data += chunk.toString('utf8'));
              response.on('end', () => {
                  if (response.statusCode === 200) {
                      try {
                          if (data.trim().startsWith('{') || data.trim().startsWith('[')) resolve(JSON.parse(data));
                          else resolve(data); 
                      } catch (e) { resolve(data); }
                  } else reject({ status: response.statusCode, data });
              });
          });
          request.on('error', (error) => reject(error));
          request.end();
      });
  }

  async function fetchSubscriptionConfig(subUrl: string, isMaskingMode: boolean): Promise<string> {
      console.log(`🌍 Fetching sub from: ${subUrl}, Masking: ${isMaskingMode}`);
      const base64Data = await apiRequest(subUrl, 'GET');
      let decoded = base64Data;
      try {
          if (!base64Data.includes('vless://') && !base64Data.includes('ss://')) {
              decoded = Buffer.from(base64Data, 'base64').toString('utf-8');
          }
      } catch(e) {}
      
      const lines = decoded.split(/\r?\n/);
      const validLinks: string[] = [];
      const serverNames: string[] = [];

      for (const line of lines) {
          const clean = line.trim();
          if (clean.startsWith('vless://') || clean.startsWith('ss://')) {
              validLinks.push(clean);
              try {
                  const fragment = clean.split('#')[1] || "No Name";
                  serverNames.push(decodeURIComponent(fragment));
              } catch (e) {
                  serverNames.push(clean.split('#')[1] || "Raw Name");
              }
          }
      }

      if (validLinks.length === 0) throw new Error("Пустой ответ от сервера");
      console.log("📋 Available Servers:", serverNames);

      if (isMaskingMode) {
          const targetServer = validLinks.find(link => {
              try {
                  if (link.includes('📄')) return true;
                  const urlDecoded = decodeURIComponent(link);
                  if (urlDecoded.includes('📄')) return true;
                  if (urlDecoded.toLowerCase().includes('moscow') || urlDecoded.includes('Москва')) return true;
              } catch (e) { return false; }
              return false;
          });

          if (targetServer) {
              console.log("✅ [MASKING MODE] Target server found:", targetServer.split('#')[1]);
              return targetServer;
          }
          console.warn("⚠️ [MASKING MODE] Target server (📄) not found. Available names:", serverNames);
      }
      return validLinks[0];
  }

  async function killConflictingApps(): Promise<void> {
    if (process.platform !== 'win32') return;
    // Параллельно — было 9 синхронных taskkill (~50мс каждый = ~450мс),
    // стало одно ожидание самого медленного (~80мс).
    await Promise.all(CONFLICTING_APPS.map(appName =>
      new Promise<void>((resolve) => {
        exec(`taskkill /F /IM "${appName}" /T`, { timeout: 2000 }, () => resolve());
      })
    ));
  }
  
  // Async: убирает блокировку UI на ~200-400мс при выключении/реконнекте VPN.
  // process.kill() сигнализирует мгновенно (NodeJS внутри async), taskkill — fallback
  // на случай если xray/winws висит (запускаем параллельно).
  async function forceKillXray() {
    if (vpnProcess) { try { vpnProcess.kill(); } catch (e) {} vpnProcess = null; }
    if (zapretProcess) { try { zapretProcess.kill(); } catch (e) {} zapretProcess = null; }
    stopTun2Socks();
    if (process.platform === 'win32') {
      await Promise.all([
        execNB('taskkill /F /IM xray.exe /T'),
        execNB('taskkill /F /IM winws.exe /T'),
      ]);
    }
  }

  function getDefaultGateway(): string | null {
    try {
      const out = execSync(
        'powershell -NoProfile -Command "Get-NetRoute -DestinationPrefix \'0.0.0.0/0\' | Sort-Object RouteMetric | Select-Object -First 1 -ExpandProperty NextHop"',
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
      ).trim();
      if (out && out !== '0.0.0.0') return out;
      return null;
    } catch (e) {
      return null;
    }
  }

  // --- Crash Cleanup ---
  function saveServerRouteCache(serverIp: string) {
    try {
      const cacheFile = path.join(app.getPath('userData'), 'tun-routes.json');
      fs.writeFileSync(cacheFile, JSON.stringify({ serverIp }));
    } catch (e) {}
  }

  function clearServerRouteCache() {
    try {
      const cacheFile = path.join(app.getPath('userData'), 'tun-routes.json');
      if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile);
    } catch (e) {}
  }

  async function cleanupCrashedRoutes() {
    try {
      const cacheFile = path.join(app.getPath('userData'), 'tun-routes.json');
      if (!fs.existsSync(cacheFile)) return;
      const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      const tasks: Promise<void>[] = [disableKillSwitch()];
      if (data.serverIp) {
        tasks.push(execNB(`route delete ${data.serverIp}`));
        console.log(`[CRASH CLEANUP] Removed stale route for ${data.serverIp}`);
      }
      await Promise.all(tasks);
      try { fs.unlinkSync(cacheFile); } catch {}
    } catch (e) {}
  }

  // --- Kill Switch (только для полного туннеля) ---
  // Параллельно — раньше было 2 sequential execSync (~150мс блокировки).
  async function enableKillSwitch() {
    await Promise.all([
      execNB('route add 0.0.0.0 mask 128.0.0.0 127.0.0.1 metric 900'),
      execNB('route add 128.0.0.0 mask 128.0.0.0 127.0.0.1 metric 900'),
    ]);
    console.log('[KILLSWITCH] Enabled (metric 900 blackhole routes)');
  }

  async function disableKillSwitch() {
    await Promise.all([
      execNB('route delete 0.0.0.0 mask 128.0.0.0 127.0.0.1'),
      execNB('route delete 128.0.0.0 mask 128.0.0.0 127.0.0.1'),
    ]);
    console.log('[KILLSWITCH] Disabled');
  }

  // --- Auto-reconnect ---
  function onVpnProcessClose() {
    vpnProcess = null;
    if (zapretProcess) { try { zapretProcess.kill(); } catch (e) {} zapretProcess = null; }
    setSystemProxy(false);

    if (!isIntentionalStop && lastFinalLink && lastVpnArgs) {
      console.log('[RECONNECT] Unexpected VPN close, starting auto-reconnect...');
      attemptReconnect();
    } else {
      stopTun2Socks();
    }
  }

  async function attemptReconnect() {
    if (reconnectCount >= MAX_RECONNECTS) {
      console.log('[RECONNECT] Max attempts reached, giving up');
      reconnectCount = 0;
      lastFinalLink = null;
      lastVpnArgs = null;
      stopTun2Socks();
      win?.webContents.send('vpn-auto-disconnected');
      return;
    }

    reconnectCount++;
    console.log(`[RECONNECT] Attempt ${reconnectCount}/${MAX_RECONNECTS} in 5s...`);
    win?.webContents.send('vpn-reconnecting', { attempt: reconnectCount, max: MAX_RECONNECTS });

    reconnectTimer = setTimeout(async () => {
      if (!lastFinalLink || !lastVpnArgs) return;
      try {
        await forceKillXray();
        await sleep(500);

        const { activeApps, isProxyAll, routingMode, bypassRu } = lastVpnArgs;
        const configJson = generateXrayConfig(lastFinalLink, activeApps, isProxyAll, 10808, false, routingMode, bypassRu);
        if (!configJson) throw new Error('Config gen error');

        const xrayPath = app.isPackaged
          ? path.join(process.resourcesPath, 'bin', 'xray.exe')
          : path.join(process.env.APP_ROOT, 'bin', 'xray.exe');

        const xrayProc = spawn(xrayPath, ['-c', 'stdin:'], { cwd: path.dirname(xrayPath) });
        vpnProcess = xrayProc;
        xrayProc.stdout?.on('data', (d: any) => console.log(`[XRAY STDOUT]: ${d.toString().trim()}`));
        xrayProc.stderr?.on('data', (d: any) => console.error(`[XRAY STDERR]: ${d.toString().trim()}`));
        if (xrayProc.stdin) { xrayProc.stdin.write(configJson); xrayProc.stdin.end(); }
        xrayProc.on('close', () => { if (vpnProcess === xrayProc) onVpnProcessClose(); });

        if (!(await waitForXrayHealthy(300))) throw new Error('VPN process exited immediately');

        if (routingMode === 'tun') {
          let serverHost = '';
          try { serverHost = new URL(lastFinalLink).hostname; } catch (e) {}
          stopTun2Socks();
          const tunResult = await startTun2Socks(serverHost, isProxyAll, activeApps, bypassRu);
          if (!tunResult.ok) throw new Error(`TUN: ${tunResult.error}`);
        } else {
          setSystemProxy(true);
        }

        reconnectCount = 0;
        console.log('[RECONNECT] Success!');
        win?.webContents.send('vpn-reconnected');
      } catch (e) {
        console.error('[RECONNECT] Attempt failed:', e);
        attemptReconnect();
      }
    }, 5000);
  }

  function ipToNum(ip: string): number {
    return ip.split('.').reduce((acc: number, o: string) => (acc * 256) + parseInt(o), 0) >>> 0;
  }

  function isIpInCidrs(ip: string, cidrs: string[]): boolean {
    const n = ipToNum(ip);
    for (const cidr of cidrs) {
      const s = cidr.indexOf('/');
      if (s < 0) continue;
      const prefix = parseInt(cidr.slice(s + 1));
      const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
      if ((n & mask) === (ipToNum(cidr.slice(0, s)) & mask)) return true;
    }
    return false;
  }

  function isPrivateOrLoopback(ip: string): boolean {
    const o = ip.split('.').map(Number);
    if (o[0] === 10 || o[0] === 127 || o[0] === 0) return true;
    if (o[0] === 172 && o[1] >= 16 && o[1] <= 31) return true;
    if (o[0] === 192 && o[1] === 168) return true;
    if (o[0] === 169 && o[1] === 254) return true;
    if (o[0] === 198 && o[1] === 18) return true;
    return false;
  }

  // Async fire-and-forget: НЕ блокирует event loop (раньше execSync вызывал
  // микро-зависания UI каждый раз когда injector добавлял IP).
  function injectRoute(ip: string, tunIfIndex: string, baseCidrs: string[], source: string) {
    if (injectedRoutes.has(ip)) return;
    injectedRoutes.add(ip);
    if (isPrivateOrLoopback(ip)) return;
    if (isIpInCidrs(ip, baseCidrs)) return;
    exec(`route add ${ip} mask 255.255.255.255 198.18.0.1 metric 1 IF ${tunIfIndex}`,
      { timeout: 2000, windowsHide: true },
      (err) => {
        if (!err) console.log(`[TUN] Injected route (${source}): ${ip}/32`);
      }
    );
  }

  // Мониторит TCP:443 соединения и добавляет /32 маршруты для voice-IP Discord,
  // не попавших в статические диапазоны.
  // ВАЖНО (оптимизация): все три таймера теперь async (exec) — раньше execSync('netstat -n')
  // блокировал main process на 30-200мс каждые 300мс, что и вызывало "программа не отвечает".
  // Интервал увеличен 300→1500мс: handshake voice занимает 500-1500мс, успеваем.
  function startRouteInjector(tunIfIndex: string, baseCidrs: string[], voiceDomains: string[]) {
    if (routeInjectorTimer) clearInterval(routeInjectorTimer);
    if (discordProcMonitorTimer) clearInterval(discordProcMonitorTimer);
    if (discordDomainRefreshTimer) clearInterval(discordDomainRefreshTimer);
    injectedRoutes.clear();

    // 1. Async netstat-сканер (TCP:443 SYN_SENT/ESTABLISHED) — общий fallback.
    // Lock от parallel runs: на медленной машине netstat может занять >1.5с,
    // следующий interval не должен запускаться поверх предыдущего.
    let netstatRunning = false;
    routeInjectorTimer = setInterval(() => {
      if (netstatRunning) return;
      netstatRunning = true;
      exec('netstat -n',
        { encoding: 'utf8', timeout: 3000, maxBuffer: 10 * 1024 * 1024, windowsHide: true },
        (err, stdout) => {
          netstatRunning = false;
          if (err || !stdout) return;
          const re = /TCP\s+\S+\s+(\d+\.\d+\.\d+\.\d+):443\s+(?:ESTABLISHED|SYN_SENT)/gi;
          let m;
          while ((m = re.exec(stdout)) !== null) {
            injectRoute(m[1], tunIfIndex, baseCidrs, 'netstat:443');
          }
        }
      );
    }, 1500);

    // 2. Discord-process foreign IPs (tasklist + netstat -ano).
    // Интервал 1500→3000мс — Discord обычно подключает voice-регион один раз
    // в начале звонка, после чего IP стабилен. Раньше создавал двойную нагрузку.
    let discordProcRunning = false;
    discordProcMonitorTimer = setInterval(() => {
      if (discordProcRunning) return;
      discordProcRunning = true;
      exec('tasklist /NH /FO CSV /FI "IMAGENAME eq Discord.exe"',
        { encoding: 'utf8', timeout: 3000, maxBuffer: 10 * 1024 * 1024, windowsHide: true },
        (err1, stdout1) => {
          if (err1 || !stdout1 || !/Discord\.exe/i.test(stdout1)) {
            // Discord не запущен — пропускаем тяжёлый netstat -ano
            discordProcRunning = false;
            return;
          }
          const pids = new Set<string>();
          for (const line of stdout1.split(/\r?\n/)) {
            const m = line.match(/^"Discord\.exe","(\d+)"/i);
            if (m) pids.add(m[1]);
          }
          if (pids.size === 0) { discordProcRunning = false; return; }

          exec('netstat -ano',
            { encoding: 'utf8', timeout: 3000, maxBuffer: 10 * 1024 * 1024, windowsHide: true },
            (err2, stdout2) => {
              discordProcRunning = false;
              if (err2 || !stdout2) return;
              for (const line of stdout2.split(/\r?\n/)) {
                const m = line.match(/^\s*TCP\s+\S+\s+(\d+\.\d+\.\d+\.\d+):\d+\s+(?:ESTABLISHED|SYN_SENT)\s+(\d+)/);
                if (m && pids.has(m[2])) {
                  injectRoute(m[1], tunIfIndex, baseCidrs, 'discord-proc');
                }
              }
            }
          );
        }
      );
    }, 3000);

    // 3. Периодический ре-резолв voice-доменов: 5000→30000мс (voice-регион
    // меняется редко, в норме раз за звонок). Раньше резолвили 30+ доменов
    // каждые 5 сек = ~360 DNS-запросов в минуту, грузило DNS и CPU.
    if (voiceDomains.length > 0) {
      discordDomainRefreshTimer = setInterval(async () => {
        try {
          const ips = await resolveDomainsToIps(voiceDomains);
          for (const ip of ips) injectRoute(ip, tunIfIndex, baseCidrs, 'dns-refresh');
        } catch {}
      }, 30000);
    }
  }

  function stopRouteInjector() {
    if (routeInjectorTimer) { clearInterval(routeInjectorTimer); routeInjectorTimer = null; }
    if (discordProcMonitorTimer) { clearInterval(discordProcMonitorTimer); discordProcMonitorTimer = null; }
    if (discordDomainRefreshTimer) { clearInterval(discordDomainRefreshTimer); discordDomainRefreshTimer = null; }
    injectedRoutes.clear();
  }

  // Async — раньше до 5 sequential execSync (~200-400мс блокировки UI при отключении).
  // Все таски здесь идемпотентные/независимые, безопасно параллелить.
  function stopTun2Socks() {
    stopRouteInjector();
    // Сохраняем копию tunAddedRoutes до чистки + сразу обнуляем (анти-race при reconnect).
    const routesToDelete = [...tunAddedRoutes];
    tunAddedRoutes = [];
    // Убиваем процесс синхронно через .kill() (мгновенно), taskkill — async fallback.
    if (tun2socksProcess) { try { tun2socksProcess.kill(); } catch (e) {} tun2socksProcess = null; }
    clearServerRouteCache();
    if (process.platform === 'win32') {
      // Fire-and-forget: вызывающий код не ждёт полной очистки маршрутов.
      // /1 маршруты сами удалятся когда NarodniyVPN интерфейс упадёт.
      Promise.all([
        ...routesToDelete.map(r => execNB(`route delete ${r}`)),
        disableKillSwitch(),
        execNB('netsh interface ipv6 delete route ::/0 "Loopback Pseudo-Interface 1"'),
        execNB('taskkill /F /IM tun2socks.exe /T'),
      ]).catch(() => {});
    }
  }

  // Поллинг netsh interface ipv4 show interfaces (~30-80мс на вызов) до появления
  // нашего TUN-адаптера. Заодно вытаскивает ifIndex из того же вывода — экономит
  // отдельный вызов PowerShell Get-NetAdapter (~500-1500мс).
  async function waitForTunAdapter(name: string, timeoutMs: number): Promise<string | null> {
    const start = Date.now();
    const re = new RegExp(`^\\s*(\\d+)\\s+\\d+\\s+\\d+\\s+\\S+\\s+${name}\\s*$`, 'm');
    while (Date.now() - start < timeoutMs) {
      if (!tun2socksProcess || tun2socksProcess.exitCode !== null) return null;
      const out: string = await new Promise((resolve) => {
        exec('netsh interface ipv4 show interfaces',
          { encoding: 'utf8', timeout: 2000, maxBuffer: 5 * 1024 * 1024 },
          (err, stdout) => resolve(err ? '' : stdout));
      });
      const m = out.match(re);
      if (m) return m[1];
      await sleep(150);
    }
    return null;
  }

  // Быстрая проверка стартапа Xray — поллинг exitCode вместо фикс. sleep(1000)
  async function waitForXrayHealthy(timeoutMs: number): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (!vpnProcess || vpnProcess.killed || vpnProcess.exitCode !== null) return false;
      await sleep(50);
    }
    return !!vpnProcess && vpnProcess.exitCode === null && !vpnProcess.killed;
  }

  async function startTun2Socks(serverHost: string, isProxyAll: boolean = true, activeApps: string[] = [], bypassRu: boolean = false): Promise<{ ok: boolean; error?: string }> {
    let lastStderrLine = '';
    try {
      const binPath = app.isPackaged
        ? path.join(process.resourcesPath, 'bin')
        : path.join(process.env.APP_ROOT, 'bin');
      const tun2socksPath = path.join(binPath, 'tun2socks.exe');

      if (!fs.existsSync(tun2socksPath)) {
        return { ok: false, error: 'tun2socks.exe не найден' };
      }

      const physGateway = getDefaultGateway();
      if (!physGateway) {
        return { ok: false, error: 'Не удалось определить шлюз по умолчанию' };
      }
      console.log(`[TUN] Physical gateway: ${physGateway}`);

      // Запускаем tun2socks — он создаёт Wintun адаптер
      tun2socksProcess = spawn(tun2socksPath, [
        '-device', 'tun://NarodniyVPN',
        '-proxy', 'socks5://127.0.0.1:10808',
        '-loglevel', 'info',
        '-udp-timeout', '180s',
      ], { cwd: binPath, stdio: ['ignore', 'pipe', 'pipe'] });

      tun2socksProcess.stdout?.on('data', (d: any) => {
        const line = d.toString().trim();
        console.log(`[TUN2SOCKS]: ${line}`);
      });
      tun2socksProcess.stderr?.on('data', (d: any) => {
        const line = d.toString().trim();
        console.log(`[TUN2SOCKS ERR]: ${line}`);
        if (line) lastStderrLine = line;
      });
      tun2socksProcess.on('close', (code: number) => {
        console.log(`[TUN2SOCKS EXIT] Code: ${code}`);
        tun2socksProcess = null;
      });

      // Параллельно: резолвим serverIp + ждём поднятие адаптера.
      // ВАЖНО: домены приложений резолвим ПОЗЖЕ — после netsh DNS=1.1.1.1 на TUN,
      // иначе берутся ISP-DNS значения (регион-оптимизированные IP), и /32 маршруты
      // добавляются на IP, которые Discord потом не использует (он-то резолвит через 1.1.1.1).
      const isSplit = !isProxyAll && activeApps.length > 0;
      const serverIpPromise: Promise<string | null> = (async () => {
        if (/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(serverHost)) return serverHost;
        try { return (await dnsLookup(serverHost)).address; } catch { return null; }
      })();
      const adapterPromise = waitForTunAdapter('NarodniyVPN', 8000);

      const [serverIp, tunIfIndex] = await Promise.all([serverIpPromise, adapterPromise]);

      if (!tunIfIndex) {
        const reason = lastStderrLine || (tun2socksProcess?.exitCode != null
          ? `exit code: ${tun2socksProcess.exitCode}`
          : 'TUN-адаптер не поднялся за 8с');
        console.error(`tun2socks startup failed: ${reason}`);
        return { ok: false, error: `tun2socks: ${reason}` };
      }
      console.log(`[TUN] NarodniyVPN ifIndex: ${tunIfIndex} (adapter ready)`);

      // Grace-период: адаптер появился в netsh, но tun2socks ещё инициализирует
      // свой userspace-стек (UDP NAT таблица, SOCKS5 connection pool, Wintun StartSession).
      // Без этой паузы первые UDP-пакеты Discord (voice handshake) дропаются → "вечное
      // подключение к RTC". 400мс достаточно — по логам SOCKS5 pool готов через ~200мс
      // после появления адаптера, 400мс даёт 2x запас.
      await sleep(400);

      // Параллельно: IP-адрес, MTU, DNS (1.1.1.1+8.8.8.8), interface metric, server-route.
      // Раньше 6+ sequential execSync = ~600-1200мс блокировки UI. Все эти netsh-команды
      // оперируют разными сущностями TUN-адаптера и не конфликтуют между собой.
      // КРИТИЧНО: вешаем публичный DNS на TUN с metric=1 — Windows предпочитает TUN-DNS
      // физическому. Без этого Discord резолвится через ISP-DNS → регион-оптимизированные
      // IP не покрыты маршрутами → voice утекает.
      const setupTasks: Promise<void>[] = [
        execNB('netsh interface ip set address name="NarodniyVPN" source=static addr=198.18.0.1 mask=255.255.0.0'),
        execNB('netsh interface ipv4 set subinterface "NarodniyVPN" mtu=1400 store=active'),
        execNB('netsh interface ipv4 set dnsservers name="NarodniyVPN" static 1.1.1.1 primary validate=no'),
        execNB('netsh interface ipv4 add dnsservers name="NarodniyVPN" address=8.8.8.8 index=2 validate=no'),
        execNB('netsh interface ipv4 set interface "NarodniyVPN" metric=1'),
      ];
      // Маршрут до VPN-сервера через физический шлюз (предотвращает routing loop)
      if (serverIp) {
        setupTasks.push(execNB(`route add ${serverIp} mask 255.255.255.255 ${physGateway} metric 1`));
        tunAddedRoutes.push(serverIp);
        saveServerRouteCache(serverIp);
      }
      await Promise.all(setupTasks);
      console.log(`[TUN] Adapter configured: DNS=1.1.1.1+8.8.8.8, MTU=1400, server-route=${serverIp || 'none'}`);

      // 🇷🇺 Bypass-RU: добавляем Windows-маршруты для RU CIDR через физ-шлюз.
      // Виндовс выберет эти /16-/22 маршруты вместо TUN /1 (longest-prefix match) —
      // RU-сервисы пойдут через физический интерфейс мимо VPN. Без этого "direct"
      // outbound Xray попадал бы под TUN-маршруты и зацикливался.
      if (bypassRu && physGateway) {
        const ruLines: string[] = ['@echo off'];
        let ruCount = 0;
        for (const cidr of RU_BYPASS_CIDRS) {
          const slash = cidr.indexOf('/');
          if (slash === -1) continue;
          const network = cidr.slice(0, slash);
          const prefix = parseInt(cidr.slice(slash + 1));
          if (isNaN(prefix) || prefix < 0 || prefix > 32) continue;
          const m = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
          const mask = [(m >>> 24) & 0xff, (m >>> 16) & 0xff, (m >>> 8) & 0xff, m & 0xff].join('.');
          ruLines.push(`route add ${network} mask ${mask} ${physGateway} metric 1 >nul 2>&1`);
          tunAddedRoutes.push(network);
          ruCount++;
        }
        const ruBatPath = path.join(app.getPath('temp'), `narodniy-ru-bypass-${Date.now()}.bat`);
        try {
          fs.writeFileSync(ruBatPath, ruLines.join('\r\n'), 'utf8');
          await execNB(`"${ruBatPath}"`, 30000);
          console.log(`[TUN] RU bypass: ${ruCount} routes added via ${physGateway}`);
        } catch (e: any) {
          console.warn('[TUN] RU bypass routes failed:', e?.message);
        } finally {
          try { fs.unlinkSync(ruBatPath); } catch {}
        }
      }

      const ifPart = ` IF ${tunIfIndex}`;
      if (!isSplit) {
        // Параллельно: enable killSwitch + 2 catch-all /1 маршрута.
        await Promise.all([
          enableKillSwitch(),
          execNB(`route add 0.0.0.0 mask 128.0.0.0 198.18.0.1 metric 1${ifPart}`),
          execNB(`route add 128.0.0.0 mask 128.0.0.0 198.18.0.1 metric 1${ifPart}`),
        ]);
        console.log('[TUN] Full tunnel routes added');
      } else {
        // Split туннель: только выбранные приложения идут через TUN
        // Остальной трафик идёт напрямую через физический шлюз — без loop!
        const cidrs: string[] = [];
        const domainsForDns: string[] = [];

        for (const appKey of activeApps) {
          if (KNOWN_APP_ROUTE_RANGES[appKey]) {
            cidrs.push(...KNOWN_APP_ROUTE_RANGES[appKey]);
          }
          // Домены резолвятся ВСЕГДА, даже если есть статические IP
          if (APPS_RULES[appKey]) {
            domainsForDns.push(...APPS_RULES[appKey].filter(d => d.includes('.')));
          }
        }

        // Резолвим IP_CHECK_DOMAINS и app-домены ПАРАЛЛЕЛЬНО — netsh DNS уже настроен,
        // OS resolver смотрит в TUN-DNS (1.1.1.1, metric=1). Фильтруем serverIp чтобы
        // не создать routing loop через TUN.
        const dnsPromises: Promise<string[]>[] = [
          resolveDomainsToIps(IP_CHECK_DOMAINS)
        ];
        if (domainsForDns.length > 0) {
          console.log(`[TUN] Resolving app domain IPs...`);
          dnsPromises.push(resolveDomainsToIps(domainsForDns));
        }
        const dnsResults = await Promise.all(dnsPromises);
        for (const ips of dnsResults) {
          cidrs.push(...ips.filter(ip => ip !== serverIp).map(ip => `${ip}/32`));
        }

        const uniqueCidrs = [...new Set(cidrs)];
        if (uniqueCidrs.length > 0) {
          // Батчинг через временный .bat: раньше было 80+ sequential execSync route add =
          // 1-3 секунды блокировки UI (каждый spawn cmd.exe ~10-30мс + сам route add).
          // Теперь — 1 spawn, route add внутри bat выполняются sequential (как раньше),
          // что сохраняет надёжность (параллельные route add иногда проваливаются молча).
          const lines: string[] = ['@echo off'];
          let validCount = 0;
          for (const cidr of uniqueCidrs) {
            const slash = cidr.indexOf('/');
            if (slash === -1) continue;
            const network = cidr.slice(0, slash);
            const prefix = parseInt(cidr.slice(slash + 1));
            if (isNaN(prefix) || prefix < 0 || prefix > 32) continue;
            const m = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
            const mask = [(m >>> 24) & 0xff, (m >>> 16) & 0xff, (m >>> 8) & 0xff, m & 0xff].join('.');
            lines.push(`route add ${network} mask ${mask} 198.18.0.1 metric 1${ifPart} >nul 2>&1`);
            validCount++;
          }
          const batPath = path.join(app.getPath('temp'), `narodniy-routes-${Date.now()}.bat`);
          try {
            fs.writeFileSync(batPath, lines.join('\r\n'), 'utf8');
            await execNB(`"${batPath}"`, 30000);
            console.log(`[TUN] Split routes: ${validCount} prefixes added for [${activeApps.join(', ')}] (batch)`);
          } catch (e: any) {
            console.warn('[TUN] Batch route add failed:', e?.message);
          } finally {
            try { fs.unlinkSync(batPath); } catch {}
          }
        } else {
          // Fallback: нет маршрутов — переходим в полный туннель
          console.warn('[TUN] No routes for selected apps, falling back to full tunnel');
          await Promise.all([
            execNB(`route add 0.0.0.0 mask 128.0.0.0 198.18.0.1 metric 1${ifPart}`),
            execNB(`route add 128.0.0.0 mask 128.0.0.0 198.18.0.1 metric 1${ifPart}`),
          ]);
        }

        // Discord: фоновый route injector. 3 механизма (см. startRouteInjector):
        // netstat:443 (1.5с), Discord-proc IPs (3с), DNS re-resolve voice (30с) — всё async.
        if (activeApps.includes('discord')) {
          const voiceDomains = (APPS_RULES['discord'] || []).filter(d => d.endsWith('.discord.media'));
          // КРИТИЧНО: IP VPN-сервера в skip-list — иначе routing loop через TUN.
          const injectorBaseCidrs = serverIp ? [...uniqueCidrs, `${serverIp}/32`] : [...uniqueCidrs];
          startRouteInjector(tunIfIndex, injectorBaseCidrs, voiceDomains);
          // Async flushdns + IPv6 block — не ждём (fire-and-forget), не критично для готовности TUN.
          execNB('ipconfig /flushdns');
          console.log(`[TUN] Discord: route injector started (server skip: ${serverIp || 'none'})`);
        }
      }
      // Маршруты через NarodniyVPN удалятся автоматически при падении интерфейса

      // Блокируем IPv6 через loopback — async fire-and-forget, не блокирует возврат.
      execNB('netsh interface ipv6 add route ::/0 "Loopback Pseudo-Interface 1" metric=1')
        .then(() => console.log('[TUN] IPv6 blocked via loopback'));

      console.log('[TUN] TUN mode active');
      return { ok: true };
    } catch (e: any) {
      console.error('TUN start error:', e);
      stopTun2Socks();
      return { ok: false, error: e?.message || String(e) };
    }
  }

  // Async fire-and-forget — UWP loopback exempt не критичен для готовности VPN
  function allowLoopbackForApps() {
    if (process.platform !== 'win32') return;
    console.log("🔓 Allowing Loopback for UWP/Store Apps...");
    execNB('CheckNetIsolation.exe LoopbackExempt -a -n="Microsoft.Roblox_8wekyb3d8bbwe"');
    execNB('CheckNetIsolation.exe LoopbackExempt -c');
  }

  // Async — раньше 3 sequential execSync (~150мс блокировки UI на старте VPN).
  // Порядок при enable: сначала disable+server, потом enable — не критично для
  // Windows (Internet Settings reg keys атомарны), reg add можно параллелить.
  async function setSystemProxy(enable: boolean) {
    if (process.platform !== 'win32') return;
    try {
      if (enable) {
        await Promise.all([
          execNB('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d "socks=127.0.0.1:10808;http=127.0.0.1:10809" /f'),
          execNB('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f'),
        ]);
        allowLoopbackForApps();
      } else {
        await execNB('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f');
      }
    } catch (e) { console.error('Proxy Config Error:', e); }
  }

  function startZapret(enableRoblox: boolean) {
    try {
        const binPath = app.isPackaged 
            ? path.join(process.resourcesPath, 'bin') 
            : path.join(process.env.APP_ROOT, 'bin');
        const winwsPath = path.join(binPath, 'winws.exe');
        if (!fs.existsSync(winwsPath)) return false;

        const args: string[] = [];

        // Профиль только для Roblox
        if (enableRoblox) {
            const listPath = path.join(app.getPath('userData'), 'roblox-list.txt');
            fs.writeFileSync(listPath, ROBLOX_DOMAINS.join('\n'));
            args.push(
                `--hostlist=${listPath}`,
                '--wf-tcp=80,443',
                '--wf-udp=443', 
                '--dpi-desync=fake', 
                '--dpi-desync-fooling=badsum'
            );
        } else {
            return false;
        }

        zapretProcess = spawn(winwsPath, args);
        zapretProcess.stdout.on('data', (data: any) => console.log(`[WINWS OUT]: ${data}`));
        zapretProcess.stderr.on('data', (data: any) => console.error(`[WINWS ERR]: ${data}`));
        zapretProcess.on('close', (code: number) => {
            console.log(`[WINWS EXIT] Code: ${code}`);
            zapretProcess = null;
        });
        return true;
    } catch (e) {
        console.error("Zapret Start Fail:", e);
        return false;
    }
  }

  // --- UI ---
  function createTray() {
    const iconPath = path.join(process.env.VITE_PUBLIC, 'tray.ico');
    if (!fs.existsSync(iconPath)) return;
    const trayIcon = nativeImage.createFromPath(iconPath);
    tray = new Tray(trayIcon);
    tray.setToolTip('Народный VPN');
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Открыть', click: () => showWindow() },
      { type: 'separator' },
      { label: 'Выход', click: () => { isQuitting = true; app.quit(); } }
    ]);
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => showWindow());
  }

  function showWindow() {
    if (splash) { splash.close(); splash = null; }
    if (win) {
      win.show();
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  }

  function createSplash() {
    splash = new BrowserWindow({
      width: 320, height: 350, transparent: true, frame: false, alwaysOnTop: true, 
      show: false, skipTaskbar: true, resizable: false,
      icon: path.join(process.env.VITE_PUBLIC, 'tray.ico'),
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    });
    const splashUrl = path.join(process.env.VITE_PUBLIC, 'splash.html');
    const phrase = SPLASH_PHRASES[Math.floor(Math.random() * SPLASH_PHRASES.length)];
    splash.loadFile(splashUrl, { query: { text: phrase } });
    splash.once('ready-to-show', () => { setTimeout(() => { if (splash && !splash.isDestroyed()) { splash.show(); splash.focus(); } }, 200); });
  }

  function createWindow() {
    const isWin = process.platform === 'win32';
    win = new BrowserWindow({
      width: 800, height: 550, minWidth: 720, minHeight: 500, title: "Народный VPN",
      icon: path.join(process.env.VITE_PUBLIC, 'tray.ico'),
      autoHideMenuBar: true, show: false, backgroundColor: '#09090b',
      ...(isWin ? {
        titleBarStyle: 'hidden' as const,
        titleBarOverlay: { color: '#09090b', symbolColor: '#ffffff', height: 32 },
      } : {}),
      webPreferences: { preload: path.join(__dirname, 'preload.mjs'), nodeIntegration: false, contextIsolation: true },
    })
    win.setMenu(null);

    // Показываем главное окно по первому из событий: ready-to-show / did-finish-load.
    // Плюс таймаут-страховка на 4с — на случай если оба события не приходят
    // (бывает с titleBarStyle:'hidden' + show:false в редких билдах Windows).
    let shown = false;
    const showWin = () => {
      if (shown || !win || win.isDestroyed()) return;
      shown = true;
      if (splash) { splash.close(); splash = null; }
      win.show();
    };
    win.once('ready-to-show', showWin);
    win.webContents.once('did-finish-load', showWin);
    setTimeout(showWin, 4000);

    win.on('close', (event) => {
      if (!isQuitting) { event.preventDefault(); win?.hide(); return false; }
      return true;
    });
    if (VITE_DEV_SERVER_URL) win.loadURL(VITE_DEV_SERVER_URL);
    else win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  app.on('before-quit', () => { isQuitting = true; });
  app.on('will-quit', () => { forceKillXray(); setSystemProxy(false); });

  async function startApp() {
      if (process.argv.includes('--autostart')) {
          await sleep(15000);
      }
      // Увеличиваем лимит сокетных буферов Windows — без этого при активном VPN
      // Discord получает ENOBUFS и зависает на "подключение к голосовому каналу" вечно.
      execNB('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\AFD\\Parameters" /v DefaultReceiveWindow /t REG_DWORD /d 65536 /f');
      execNB('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\AFD\\Parameters" /v DefaultSendWindow /t REG_DWORD /d 65536 /f');
      cleanupCrashedRoutes();
      forceKillXray();
      setSystemProxy(false);
      createSplash();
      createWindow();
      createTray();
  }

  app.whenReady().then(async () => {
      // В dev-режиме НЕ делаем UAC relaunch: env-переменная VITE_DEV_SERVER_URL
      // не передаётся через elevation (UAC sandbox), и elevated процесс грузит
      // старый dist/index.html вместо Vite dev server. Если нужны админ-функции
      // в dev — запусти `npm run dev` из терминала, открытого под админом.
      const isDev = !!VITE_DEV_SERVER_URL;
      if (!isDev && !isUserAdmin()) {
          app.releaseSingleInstanceLock();
          // Прокидываем --autostart через relaunch — иначе после elevation флаг
          // теряется и frontend думает что юзер открыл прогу руками (срабатывает autoConnect).
          const isAutostart = process.argv.includes('--autostart');
          const extraArg = isAutostart ? ", '--autostart'" : '';
          let command = "";
          if (app.isPackaged) {
              const appPath = app.getPath('exe');
              command = `powershell -Command "Start-Process -FilePath '${appPath}' -ArgumentList '--relaunch-admin'${extraArg} -Verb RunAs"`;
          } else {
              const electronPath = process.execPath;
              const appFolder = app.getAppPath();
              command = `powershell -Command "Start-Process -FilePath '${electronPath}' -ArgumentList '${appFolder}', '--relaunch-admin'${extraArg} -Verb RunAs"`;
          }
          exec(command, (error) => {
              if (error) {
                  app.requestSingleInstanceLock();
                  startApp();
              } else {
                  app.quit();
              }
          });
          return;
      }
      startApp();
  });

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); else showWindow(); });

  // === HANDLERS ===
  ipcMain.on('set-titlebar-theme', (_, isDark: boolean) => {
    if (!win || win.isDestroyed()) return;
    if (process.platform !== 'win32') return;
    try {
      win.setTitleBarOverlay({
        color: isDark ? '#09090b' : '#F2F4F6',
        symbolColor: isDark ? '#ffffff' : '#262626',
        height: 32,
      });
    } catch { /* старая Windows / неподдерживаемая платформа */ }
  });

  ipcMain.handle('open-external', async (_, url) => {
    try {
        const parsed = new URL(url);
        if (['http:', 'https:'].includes(parsed.protocol)) {
            await shell.openExternal(url);
        } else {
            console.warn(`Blocked unsafe URL attempt: ${url}`);
        }
    } catch (e) {
        console.error("Invalid URL passed to open-external", e);
    }
  });
  
  ipcMain.handle('get-autostart', () => {
    return app.getLoginItemSettings({ args: ['--autostart'] }).openAtLogin;
  });

  ipcMain.handle('set-autostart', (_, enable) => {
    try {
        const appPath = app.getPath('exe'); 
        app.setLoginItemSettings({ openAtLogin: enable, path: appPath, args: ['--autostart'] });
        return true;
    } catch (e) { return false; }
  });

// --- Получение списка серверов ---
  ipcMain.handle('get-servers', async (_, rawKey) => {
    try {
        const decrypted = decryptPayload(rawKey);
        let data = "";
        
        if (decrypted.startsWith('http')) {
            const cleanUrl = sanitizeUrl(decrypted);
            data = await apiRequest(cleanUrl, 'GET');
        } else {
            data = decrypted;
        }

        let decodedData = data;
        if (!data.trim().startsWith('vless://') && !data.trim().startsWith('ss://')) {
            try { decodedData = Buffer.from(data, 'base64').toString('utf-8'); } catch(e) {}
        }

        const lines = decodedData.split(/\r?\n/);
        const serverList = [];

        for (const line of lines) {
            const clean = line.trim();
            if (clean.startsWith('vless://') || clean.startsWith('ss://')) {
                try {
                    const url = new URL(clean);
                    const name = decodeURIComponent(url.hash.replace('#', '')) || "Server";
                    
                    // 👇 1. ГРУППИРОВКА: В "Обход блокировок" попадают только серверы с 📄
                    const isRescue = name.includes('📄');
                    
                    // 👇 2. ФЛАГИ: Считываем страну из названия по умолчанию
                    let { code, emoji } = getCountryInfo(name);
                    
                    // 👇 3. РУССКИЙ ФЛАГ: Ставим ПРИНУДИТЕЛЬНО только если есть листик 📄
                    if (isRescue) {
                        code = 'ru'; 
                        emoji = '🇷🇺';
                    }

                    serverList.push({
                        name: name,
                        url: clean,
                        flag: emoji,
                        code: code,
                        isRescue: isRescue
                    });
                } catch(e) {
                    serverList.push({ name: "Server", url: clean, flag: "🌐", code: null, isRescue: false });
                }
            }
        }

        // 👇 4. СОРТИРОВКА (Только по цифрам внутри своей категории)
        serverList.sort((a, b) => {
            // Сортируем по числам (например, NL 1, NL 2)
            const numA = parseInt(a.name.match(/\d+/)?.[0] || "9999", 10);
            const numB = parseInt(b.name.match(/\d+/)?.[0] || "9999", 10);
            return numA - numB;
        });

        // Возвращаем список (Фронтенд сам разделит их на 2 категории)
        return serverList;
    } catch (e) {
        console.error("Get Servers Error:", e);
        return [];
    }
  });

  // ✅ ФУНКЦИЯ ПИНГА
  ipcMain.handle('ping-server', async (_, serverUrl: string) => {
    try {
        let temp = serverUrl.replace(/^vless:\/\//, '').replace(/^ss:\/\//, '').replace(/^trojan:\/\//, '');
        if (temp.includes('@')) temp = temp.split('@')[1];
        
        const hostPortStr = temp.split('/')[0].split('?')[0].split('#')[0];
        const lastColonIndex = hostPortStr.lastIndexOf(':');
        
        if (lastColonIndex === -1) return -1;

        const host = hostPortStr.substring(0, lastColonIndex);
        const port = parseInt(hostPortStr.substring(lastColonIndex + 1));

        if (!host || !port || isNaN(port)) return -1;

        // 1. Прогрев (один холостой запрос, чтобы поднять маршрут)
        await measureTcpLatency(host, port);

        // 2. Делаем 5 замеров
        const samples: number[] = [];
        const attempts = 5;

        for (let i = 0; i < attempts; i++) {
            const res = await measureTcpLatency(host, port);
            if (res !== -1) {
                samples.push(res);
            }
            // Пауза 50мс между пакетами, чтобы не забить буфер
            await sleep(50); 
        }

        if (samples.length === 0) return -1;

        // 3. Сортируем от меньшего к большему: [40, 41, 45, 150, 400]
        samples.sort((a, b) => a - b);

        // 4. Фильтрация:
        // Если у нас 5 замеров, берем только топ-3 (отбрасываем 2 самых медленных)
        // Если замеров мало (например 2), берем все что есть.
        const bestSamples = samples.length >= 3 ? samples.slice(0, 3) : samples;

        // 5. Считаем среднее по лучшим
        const sum = bestSamples.reduce((a, b) => a + b, 0);
        return Math.round(sum / bestSamples.length);

    } catch (e) {
        return -1;
    }
  });

  ipcMain.handle('validate-key', async (_, rawKey) => {
    try {
      const hwid = getHardwareId();
      const decrypted = decryptPayload(rawKey);

      if (decrypted.startsWith('vless://') || decrypted.startsWith('ss://') || decrypted.startsWith('trojan://')) {
          return { success: true, cleanKey: decrypted };
      }

      if (!decrypted.startsWith('http')) return { success: false, msg: "Неверный формат ключа." };
      const cleanUrl = sanitizeUrl(decrypted);
      
      await apiRequest(ACTIVATE_ENDPOINT, 'POST', { vless_key: cleanUrl, hardware_id: hwid });
      return { success: true, cleanKey: cleanUrl };

    } catch (e: any) {
      if (e.status === 409) return { success: true, msg: "Ключ активен." }; 
      if (e.status === 404) return { success: true, msg: "Подписка активна." };
      if (e.toString().includes('enotfound')) return { success: false, msg: "Нет интернета" };
      return { success: false, msg: "Ошибка сервера" };
    }
  });

  ipcMain.handle('vpn-start', async (_, key, activeApps, isProxyAll, isMaskingMode, selectedServerUrl, routingMode, bypassRu = false) => {
    if (isToggling) return { success: false, msg: "Обработка..." };
    isToggling = true;
    cancelRequested = false;
    execNB('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\AFD\\Parameters" /v DefaultReceiveWindow /t REG_DWORD /d 65536 /f');
    execNB('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\AFD\\Parameters" /v DefaultSendWindow /t REG_DWORD /d 65536 /f');

    // Если на любом await-шаге cancelRequested=true → выкидываем спец-ошибку,
    // catch ниже превратит её в { success: false, msg: 'Отменено' }.
    const checkCancel = () => {
      if (cancelRequested) throw new Error('__cancelled__');
    };

    const isRobloxEnabled = activeApps.includes('roblox') && !isProxyAll;

    // Параллельно: forceKillXray (taskkill xray/winws) + killConflictingApps (taskkill 9 апп).
    // Раньше было sequential = ~600мс блокировки старта.
    await Promise.all([forceKillXray(), killConflictingApps()]);
    await sleep(100);

    try {
        checkCancel();
        const hwid = getHardwareId();
        const decrypted = decryptPayload(key);
        
        let finalVpnLink = "";

        if (selectedServerUrl) {
             console.log("🔑 Используем выбранный сервер:", selectedServerUrl);
             finalVpnLink = selectedServerUrl;
        } 
        else {
            if (decrypted.startsWith('vless://') || decrypted.startsWith('ss://') || decrypted.startsWith('trojan://')) {
                console.log("🔑 Используем прямой ключ (Raw Key)");
                finalVpnLink = decrypted;
            } else if (decrypted.startsWith('http')) {
                console.log("🌍 Используем подписку (Subscription)");
                const cleanUrl = sanitizeUrl(decrypted);
                
                try { await apiRequest(ACTIVATE_ENDPOINT, 'POST', { vless_key: cleanUrl, hardware_id: hwid }); } 
                catch(e: any) { if (e.toString().includes('enotfound')) throw e; }

                finalVpnLink = await fetchSubscriptionConfig(cleanUrl, isMaskingMode);
            } else {
                 throw new Error("Неверный формат ключа (не http и не vless/ss)");
            }
        }

        checkCancel();

        let useZapretRoblox = false;
        if (isRobloxEnabled) {
             useZapretRoblox = startZapret(isRobloxEnabled);
        }

        const configJson = generateXrayConfig(finalVpnLink, activeApps, isProxyAll, 10808, useZapretRoblox, routingMode, bypassRu);
        if (!configJson) throw new Error("Ошибка генерации конфига");

        const xrayPath = app.isPackaged ? path.join(process.resourcesPath, 'bin', 'xray.exe') : path.join(process.env.APP_ROOT, 'bin', 'xray.exe');
        if (!fs.existsSync(xrayPath)) throw new Error("Файл Xray.exe не найден");

        const binDir = path.dirname(xrayPath);

        lastFinalLink = finalVpnLink;
        lastVpnArgs = { activeApps, isProxyAll, routingMode, bypassRu };
        isIntentionalStop = false;
        reconnectCount = 0;

        const xrayProc = spawn(xrayPath, ['-c', 'stdin:'], { cwd: binDir });
        vpnProcess = xrayProc;

        xrayProc.stdout.on('data', (data: any) => {
        console.log(`[XRAY STDOUT]: ${data.toString().trim()}`);
        });
        xrayProc.stderr.on('data', (data: any) => {
            console.error(`[XRAY STDERR]: ${data.toString().trim()}`);
        });

        if (xrayProc.stdin) {
            xrayProc.stdin.write(configJson);
            xrayProc.stdin.end();
        }

        xrayProc.on('close', () => { if (vpnProcess === xrayProc) onVpnProcessClose(); });

        if (!(await waitForXrayHealthy(300))) throw new Error("Процесс VPN закрылся.");
        checkCancel();

        if (routingMode === 'tun') {
            // Извлекаем хост VPN-сервера для specific route (защита от routing loop)
            let serverHost = "";
            try { serverHost = new URL(finalVpnLink).hostname; } catch (e) {}
            const tunResult = await startTun2Socks(serverHost, isProxyAll, activeApps, bypassRu);
            checkCancel();
            if (!tunResult.ok) {
                await forceKillXray();
                throw new Error(`TUN: ${tunResult.error || 'неизвестная ошибка'}`);
            }
        } else {
            setSystemProxy(true);
        }

        isToggling = false;
        return { success: true };

    } catch (e: any) {
        // Отмена пользователем — чистим всё и возвращаем без ошибочного сообщения
        if (e?.message === '__cancelled__' || cancelRequested) {
            try { stopTun2Socks(); } catch {}
            try { await forceKillXray(); } catch {}
            try { await setSystemProxy(false); } catch {}
            lastFinalLink = null;
            lastVpnArgs = null;
            cancelRequested = false;
            isToggling = false;
            return { success: false, msg: "Отменено", cancelled: true };
        }
        isToggling = false;
        const userMsg = getFriendlyError(e);
        return { success: false, msg: userMsg };
    }
  });

  ipcMain.handle('vpn-stop', async () => {
    // Раньше: если идёт connect (isToggling=true), stop возвращал {success:false} —
    // юзер не мог отменить подключение и должен был ждать. Теперь stop всегда работает:
    // 1) Если идёт connect — выставляем cancelRequested, vpn-start ловит на checkCancel().
    // 2) Если уже подключено — обычный disconnect.
    execNB('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\AFD\\Parameters" /v DefaultReceiveWindow /t REG_DWORD /d 65536 /f');
    execNB('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\AFD\\Parameters" /v DefaultSendWindow /t REG_DWORD /d 65536 /f');
    isIntentionalStop = true;
    cancelRequested = true;
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    lastFinalLink = null;
    lastVpnArgs = null;
    stopTun2Socks();
    await forceKillXray();
    await setSystemProxy(false);
    return { success: true };
  });

  ipcMain.handle('check-relaunch-flag', () => {
    // При autostart возвращаем false → frontend не сделает autoConnect.
    // Юзер сам нажмёт кнопку подключения когда захочет.
    if (process.argv.includes('--autostart')) return false;
    return process.argv.includes('--relaunch-admin') || process.argv.includes('--relaunch-roblox');
  });

  // Проверка обновлений через JSON API
  ipcMain.handle('check-updates', async () => {
    try {
        const data = await apiRequest('https://narodniyvpn.online/api/version.json', 'GET');

        if (data && data.windows && data.windows.version && data.windows.download_url) {
            return {
                version: data.windows.version,
                downloadUrl: data.windows.download_url,
                // fallback_url из JSON если задан, иначе дефолтный Telegram-канал.
                // Используется как ручной fallback когда автоскачивание провалилось
                // (без VPN GitHub блокируется в РФ → юзер открывает Telegram пост и качает оттуда).
                fallbackUrl: data.windows.fallback_url || 'https://t.me/Narodniy_guide/10',
                // Минимальная поддерживаемая версия — управляется через env-переменную APP_MIN_SUPPORTED_WINDOWS.
                // Если текущая версия клиента ниже этого значения — UI показывает блокирующий экран.
                minSupportedVersion: data.windows.min_supported_version || '1.0.0',
            };
        }
        return null;
    } catch (e) {
        console.error("Ошибка при проверке обновлений:", e);
        return null;
    }
  });

  // === АВТО-ОБНОВЛЕНИЕ ===
  // Скачивает .exe инсталлятор в фоне с прогрессом, потом install-update
  // запускает его silent-режимом и завершает приложение — NSIS сам обновит файлы и
  // перезапустит свежую версию (см. nsis.runAfterFinish=true в package.json).

  let updateDownloadAbort: { aborted: boolean } | null = null;
  let updateDownloadedPath: string | null = null;
  // In-flight promise: второй параллельный вызов download-update переиспользует первый.
  // Защита от дубликатов когда фронт стартует две проверки (StrictMode + кнопка одновременно).
  let updateDownloadInFlight: Promise<{ ok: boolean; filePath?: string; error?: string }> | null = null;

  function getUpdateFilePath(version: string): string {
    return path.join(app.getPath('temp'), `narodniy-vpn-update-${version}.exe`);
  }

  // Скачивание одной попытки через Node https/http (НЕ Electron net.request — тот падает
  // с ERR_NETWORK_CHANGED когда меняются routes/DNS, что у нас постоянно происходит при
  // подключении/отключении VPN). Node-модуль ничего не знает о network state, читает поток
  // пока ОС не разорвёт соединение.
  function downloadOnce(url: string, filePath: string, abortFlag: { aborted: boolean }, onProgress: (downloaded: number, total: number) => void, redirectsLeft = 5): Promise<{ ok: boolean; error?: string }> {
    return new Promise((resolve) => {
      try {
        const shortUrl = url.length > 80 ? url.slice(0, 80) + '...' : url;
        console.log(`[UPDATE-DL] GET ${shortUrl}`);
        const lib = url.startsWith('https:') ? https : http;
        const req = lib.get(url, { headers: { 'User-Agent': 'NarodniyVPN-Updater/1.0' } }, (res) => {
          console.log(`[UPDATE-DL] Response ${res.statusCode} from ${shortUrl}`);
          // Ручной follow redirects (GitHub Releases делает цепочку через CDN)
          if ([301, 302, 303, 307, 308].includes(res.statusCode || 0)) {
            const next = res.headers.location;
            if (!next || redirectsLeft <= 0) {
              resolve({ ok: false, error: `Слишком много редиректов или нет Location` });
              return;
            }
            console.log(`[UPDATE-DL] Redirect ${res.statusCode} → ${(next || '').slice(0, 80)}`);
            res.resume();
            downloadOnce(next, filePath, abortFlag, onProgress, redirectsLeft - 1).then(resolve);
            return;
          }
          if (res.statusCode !== 200) {
            res.resume();
            resolve({ ok: false, error: `HTTP ${res.statusCode}` });
            return;
          }

          const total = parseInt(String(res.headers['content-length'] || '0'), 10) || 0;
          console.log(`[UPDATE-DL] Streaming body, content-length=${total}`);
          let downloaded = 0;
          let firstChunkLogged = false;
          const fileStream = fs.createWriteStream(filePath);

          res.on('data', (chunk: Buffer) => {
            if (abortFlag.aborted) {
              try { req.destroy(); } catch {}
              try { fileStream.close(); } catch {}
              return;
            }
            if (!firstChunkLogged) {
              firstChunkLogged = true;
              console.log(`[UPDATE-DL] First chunk received (${chunk.length} bytes)`);
            }
            downloaded += chunk.length;
            fileStream.write(chunk);
            onProgress(downloaded, total);
          });

          res.on('end', () => {
            console.log(`[UPDATE-DL] Stream end, total downloaded ${downloaded} bytes`);
            fileStream.end(() => {
              if (abortFlag.aborted) {
                try { fs.unlinkSync(filePath); } catch {}
                resolve({ ok: false, error: 'aborted' });
              } else {
                resolve({ ok: true });
              }
            });
          });

          res.on('error', (e: any) => {
            console.warn(`[UPDATE-DL] Response error: ${e?.message}`);
            try { fileStream.close(); } catch {}
            resolve({ ok: false, error: e?.message || 'response error' });
          });
        });

        req.on('error', (e: any) => {
          console.warn(`[UPDATE-DL] Request error: ${e?.message}`);
          resolve({ ok: false, error: e?.message || 'request error' });
        });

        // 60с idle-timeout — если за минуту нет НИ ОДНОГО байта или события на сокете,
        // считаем зависшим. Раньше было 180с — слишком долго ждать впустую.
        req.setTimeout(60000, () => {
          console.warn(`[UPDATE-DL] Timeout (60s no activity)`);
          try { req.destroy(new Error('timeout')); } catch {}
        });
      } catch (e: any) {
        resolve({ ok: false, error: e?.message || String(e) });
      }
    });
  }

  // Скачивание через Electron net с SOCKS5/HTTP прокси Xray (10808/10809) — fallback
  // когда прямое соединение не работает (Роскомнадзор режет GitHub CDN). Использует
  // session с прокси-настройкой. Когда VPN не подключён — Xray на 10809 не отвечает,
  // эта функция возвращает ошибку и мы откатываемся на прямой Node-https.
  function downloadViaVpnProxy(url: string, filePath: string, abortFlag: { aborted: boolean }, onProgress: (downloaded: number, total: number) => void): Promise<{ ok: boolean; error?: string }> {
    return new Promise((resolve) => {
      try {
        const ses = session.fromPartition('update-download');
        ses.setProxy({ proxyRules: 'http://127.0.0.1:10809', proxyBypassRules: '<-loopback>' }).then(() => {
          const request = net.request({ method: 'GET', url, session: ses, redirect: 'follow' });
          let downloaded = 0;
          let total = 0;
          let fileStream: fs.WriteStream | null = null;

          request.on('response', (response) => {
            if (response.statusCode !== 200) {
              try { fileStream?.close(); } catch {}
              resolve({ ok: false, error: `HTTP ${response.statusCode} (via VPN)` });
              return;
            }
            const cl = response.headers['content-length'];
            if (typeof cl === 'string') total = parseInt(cl, 10) || 0;
            else if (Array.isArray(cl) && cl.length > 0) total = parseInt(cl[0], 10) || 0;
            fileStream = fs.createWriteStream(filePath);

            response.on('data', (chunk: Buffer) => {
              if (abortFlag.aborted) {
                try { request.abort(); } catch {}
                try { fileStream?.close(); } catch {}
                return;
              }
              downloaded += chunk.length;
              fileStream?.write(chunk);
              onProgress(downloaded, total);
            });
            response.on('end', () => {
              try { fileStream?.end(); } catch {}
              if (abortFlag.aborted) resolve({ ok: false, error: 'aborted' });
              else resolve({ ok: true });
            });
            response.on('error', (e: any) => {
              try { fileStream?.close(); } catch {}
              resolve({ ok: false, error: e?.message || 'response error (via VPN)' });
            });
          });
          request.on('error', (e: any) => {
            resolve({ ok: false, error: e?.message || 'request error (via VPN)' });
          });
          request.end();
        }).catch((e) => {
          resolve({ ok: false, error: e?.message || 'proxy setup failed' });
        });
      } catch (e: any) {
        resolve({ ok: false, error: e?.message || String(e) });
      }
    });
  }

  ipcMain.handle('download-update', async (_, downloadUrl: string, version: string) => {
    // Dedup: если уже идёт скачивание — переиспользуем его promise, не запускаем второй
    // параллельный download. Иначе два потока пишут в один файл и шлют конкурирующие
    // progress-события → UI прыгает 60→67→62→72→...
    if (updateDownloadInFlight) {
      console.log('[UPDATE] download-update: reusing in-flight promise (dedup)');
      return updateDownloadInFlight;
    }

    updateDownloadInFlight = (async () => {
    const filePath = getUpdateFilePath(version);
    // Переиспользуем уже скачанный файл, ТОЛЬКО если он валидный.
    // Минимум 5 MB — если файл меньше, это битый/недокачанный остаток предыдущего сбоя.
    // Реальный NSIS-инсталлятор VPN весит ~80-150 MB.
    const MIN_VALID_SIZE = 5 * 1024 * 1024;
    if (fs.existsSync(filePath)) {
      try {
        const st = fs.statSync(filePath);
        if (st.size >= MIN_VALID_SIZE) {
          updateDownloadedPath = filePath;
          win?.webContents.send('update-progress', { percent: 100, downloaded: st.size, total: st.size, done: true });
          return { ok: true, filePath };
        }
        // Битый кеш — удаляем и качаем заново
        console.warn(`[UPDATE] Cached file too small (${st.size} bytes), redownloading`);
        try { fs.unlinkSync(filePath); } catch {}
      } catch {}
    }

    const abortFlag = { aborted: false };
    updateDownloadAbort = abortFlag;
    let lastEmit = 0;
    const onProgress = (downloaded: number, total: number) => {
      const now = Date.now();
      // 1500мс throttle — UI обновляется ~раз в 1.5 секунды, плавно без дёрганий.
      // Меньшие интервалы (150мс) приводили к "тряске" процентов из-за частых re-renders.
      if (now - lastEmit > 1500) {
        lastEmit = now;
        const percent = total > 0 ? Math.min(99, Math.floor((downloaded / total) * 100)) : 0;
        win?.webContents.send('update-progress', { percent, downloaded, total, done: false });
      }
    };

    // Стратегия с учётом режима VPN:
    // - TUN+VPN: Node https прозрачно идёт через TUN → VPN. 3 попытки, паузы 1с.
    // - Proxy+VPN: HTTP-прокси Xray (10809). 3 попытки, паузы 1с.
    // - Без VPN: ровно 1 попытка direct. Без VPN GitHub в РФ почти всегда падает с
    //   ECONNRESET, тратить время на 3 retry бесполезно — сразу даём фидбек юзеру.
    const vpnAtStart = !!vpnProcess;
    const MAX_ATTEMPTS = vpnAtStart ? 3 : 1;
    let lastError = 'unknown';
    let everHadVpn = vpnAtStart;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      if (abortFlag.aborted) break;
      try { fs.unlinkSync(filePath); } catch {}

      const vpnActiveNow = !!vpnProcess;
      const routingMode = lastVpnArgs?.routingMode || '';
      if (vpnActiveNow) everHadVpn = true;

      let r: { ok: boolean; error?: string };
      if (vpnActiveNow && routingMode === 'tun') {
        console.log(`[UPDATE] Attempt ${attempt}/${MAX_ATTEMPTS}: direct via TUN (VPN active)`);
        r = await downloadOnce(downloadUrl, filePath, abortFlag, onProgress);
      } else if (vpnActiveNow) {
        console.log(`[UPDATE] Attempt ${attempt}/${MAX_ATTEMPTS}: via VPN proxy (xray HTTP :10809)`);
        r = await downloadViaVpnProxy(downloadUrl, filePath, abortFlag, onProgress);
      } else {
        console.log(`[UPDATE] Attempt ${attempt}/${MAX_ATTEMPTS}: direct (no VPN)`);
        r = await downloadOnce(downloadUrl, filePath, abortFlag, onProgress);
      }

      if (r.ok) {
        updateDownloadAbort = null;
        updateDownloadedPath = filePath;
        try {
          const st = fs.statSync(filePath);
          win?.webContents.send('update-progress', { percent: 100, downloaded: st.size, total: st.size, done: true });
        } catch {}
        return { ok: true, filePath };
      }
      lastError = r.error || 'unknown';
      console.warn(`[UPDATE] Attempt ${attempt}/${MAX_ATTEMPTS} failed: ${lastError}`);
      if (attempt < MAX_ATTEMPTS && !abortFlag.aborted) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    updateDownloadAbort = null;
    try { fs.unlinkSync(filePath); } catch {}
    // Подсказка про РКН-блок GitHub если все попытки были без VPN
    const hint = !everHadVpn
      ? 'Подключите VPN и попробуйте снова — GitHub часто блокируется в РФ без VPN'
      : lastError;
    return { ok: false, error: hint };
    })(); // конец IIFE updateDownloadInFlight

    try {
      return await updateDownloadInFlight;
    } finally {
      updateDownloadInFlight = null;
    }
  });

  ipcMain.handle('cancel-update-download', () => {
    if (updateDownloadAbort) updateDownloadAbort.aborted = true;
    updateDownloadAbort = null;
    return { ok: true };
  });

  ipcMain.handle('install-update', async () => {
    if (!updateDownloadedPath || !fs.existsSync(updateDownloadedPath)) {
      return { ok: false, error: 'Файл обновления не найден' };
    }
    try {
      // Валидируем что файл — настоящий PE/EXE (первые 2 байта = "MZ").
      try {
        const fd = fs.openSync(updateDownloadedPath, 'r');
        const buf = Buffer.alloc(2);
        fs.readSync(fd, buf, 0, 2, 0);
        fs.closeSync(fd);
        if (buf[0] !== 0x4D || buf[1] !== 0x5A) {
          try { fs.unlinkSync(updateDownloadedPath); } catch {}
          updateDownloadedPath = null;
          return { ok: false, error: 'Файл обновления повреждён (не EXE). Скачайте заново.' };
        }
      } catch (e: any) {
        return { ok: false, error: `Не удалось прочитать файл: ${e?.message || e}` };
      }

      // Копируем .exe в гарантированно ASCII путь C:\Windows\Temp\.
      // %TEMP% юзера может содержать кириллицу — cmd/PowerShell на русской винде ломаются
      // на таких путях из-за рассинхрона между UTF-8 (Node argv) и OEM cp866 (cmd parser).
      const winDir = process.env.WINDIR || 'C:\\Windows';
      const asciiInstallerPath = path.join(winDir, 'Temp', 'narodniy-vpn-setup.exe');
      const launcherBatPath = path.join(winDir, 'Temp', 'narodniy-vpn-launch.bat');

      try {
        fs.copyFileSync(updateDownloadedPath, asciiInstallerPath);
        console.log(`[UPDATE] Copied installer: ${asciiInstallerPath}`);
      } catch (e: any) {
        return { ok: false, error: `Не удалось скопировать установщик: ${e?.message || e}` };
      }

      // Bat-launcher: ждёт 3 сек, запускает NSIS, ВСЁ ЛОГИРУЕТ в файл.
      // Без /S — пусть NSIS oneClick покажет свой UI (мини-прогресс), чтобы юзер увидел
      // что установка реально идёт. С /S при тихом провале (AV блокирует, файл битый и т.д.)
      // пользователь думает что обновление "не работает".
      // Лог в C:\Windows\Temp\narodniy-launch.log — диагностика что именно произошло.
      const launcherLogPath = path.join(winDir, 'Temp', 'narodniy-launch.log');
      const batContent = [
        '@echo off',
        `echo [%date% %time%] === Launcher started === > "${launcherLogPath}"`,
        `echo Waiting 3 seconds for parent app to exit... >> "${launcherLogPath}"`,
        'timeout /t 3 /nobreak >nul',
        `echo [%date% %time%] Checking installer exists... >> "${launcherLogPath}"`,
        `if not exist "${asciiInstallerPath}" (`,
        `  echo ERROR: Installer file not found at ${asciiInstallerPath} >> "${launcherLogPath}"`,
        '  exit /b 1',
        ')',
        `for %%A in ("${asciiInstallerPath}") do echo Installer size: %%~zA bytes >> "${launcherLogPath}"`,
        `echo [%date% %time%] Launching installer... >> "${launcherLogPath}"`,
        `"${asciiInstallerPath}"`,
        `echo [%date% %time%] Installer exited with code %errorlevel% >> "${launcherLogPath}"`,
        'exit /b %errorlevel%',
      ].join('\r\n');
      try {
        fs.writeFileSync(launcherBatPath, batContent, 'utf8');
        console.log(`[UPDATE] Wrote launcher bat: ${launcherBatPath}`);
      } catch (e: any) {
        return { ok: false, error: `Не удалось создать launcher: ${e?.message || e}` };
      }

      // Останавливаем VPN — иначе xray.exe/tun2socks.exe держат файлы.
      try { stopTun2Socks(); } catch {}
      try { await forceKillXray(); } catch {}
      try { await setSystemProxy(false); } catch {}

      // Запускаем bat detached. Через cmd.exe — он сам обработает аргументы корректно.
      // Все пути ASCII, никаких unicode-проблем.
      const launcher = spawn('cmd.exe', ['/c', launcherBatPath], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
      launcher.unref();
      console.log(`[UPDATE] Launcher spawned (PID ${launcher.pid}), bat will run installer in 3s. Exiting app in 1s...`);

      // 1 секунда — даём cmd.exe время "отвязаться" от нашего процесса
      isQuitting = true;
      setTimeout(() => app.quit(), 1000);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || String(e) };
    }
  });

  ipcMain.handle('check-vpn-ip', async () => {
    const ses = session.fromPartition('vpn-check');
    await ses.clearCache();
    await ses.closeAllConnections();

    // Xray HTTP-прокси на 10809 работает в обоих режимах (proxy и TUN) —
    // всегда проверяем IP через него, чтобы не зависеть от готовности TUN-маршрутов.
    await ses.setProxy({ proxyRules: 'http://127.0.0.1:10809', proxyBypassRules: '<-loopback>' });

    const fetchGeo = (url: string, mapFn: (json: any) => any, timeoutMs = 7000) =>
      new Promise<any>((resolve, reject) => {
        const request = net.request({ method: 'GET', url, session: ses });
        request.on('response', (response) => {
          let data = '';
          response.on('data', (chunk) => data += chunk);
          response.on('end', () => {
            try {
              const json = JSON.parse(data);
              const result = mapFn(json);
              if (result?.ip && result?.code && result.code.length === 2) resolve(result);
              else reject(new Error('no geo'));
            } catch (e) { reject(e); }
          });
        });
        request.on('error', reject);
        setTimeout(() => { request.abort(); reject(new Error('timeout')); }, timeoutMs);
        request.end();
      });

    // Запускаем все геопровайдеры параллельно — берём первый ответивший
    // Cache-buster: CDN может закешировать ответ предыдущей сессии (другая страна).
    // Date.now() гарантирует fresh-запрос при каждом вызове check-vpn-ip.
    const cb = Date.now();
    try {
      const results = await Promise.allSettled([
        fetchGeo(`https://ipwho.is/?_=${cb}`, (j) => ({
          ip: j.ip, country: j.country || "VPN",
          city: j.city || j.country || "Secure",
          flag: j.flag?.emoji || "🛡️",
          code: (j.country_code || "").toUpperCase() || null,
        })),
        fetchGeo(`https://ipapi.co/json?_=${cb}`, (j) => ({
          ip: j.ip, country: j.country_name || "VPN",
          city: j.city || j.country_name || "Secure",
          flag: "🛡️",
          code: (j.country_code || "").toUpperCase() || null,
        })),
        fetchGeo(`http://ip-api.com/json?_=${cb}`, (j) => ({
          ip: j.query, country: j.country || "VPN",
          city: j.city || j.country || "Secure",
          flag: "🛡️",
          code: (j.countryCode || "").toUpperCase() || null,
        })),
      ]);
      const fulfilled = results.find(r => r.status === 'fulfilled') as PromiseFulfilledResult<any> | undefined;
      if (fulfilled) return fulfilled.value;
    } catch (e) {}

    // Резерв — хотя бы IP без геоданных
    try {
      const result = await new Promise<any>((resolve, reject) => {
        const req = net.request({ method: 'GET', url: 'https://api.ipify.org?format=json', session: ses });
        req.on('response', (res) => {
          let d = '';
          res.on('data', (c) => d += c);
          res.on('end', () => { try { const j = JSON.parse(d); resolve(j); } catch(e) { reject(e); } });
        });
        req.on('error', reject);
        setTimeout(() => { req.abort(); reject('timeout'); }, 4000);
        req.end();
      });
      if (result?.ip) return { ip: result.ip, country: "VPN", city: "Приватный", flag: "🛡️", code: "SEC" };
    } catch (e) {}

    return { ip: "Защищено", country: "VPN", city: "Приватный", flag: "🔒", code: "SEC" };
  });
}