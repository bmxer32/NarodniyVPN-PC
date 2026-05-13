import { URL } from 'node:url'; 

// 🌍 БАЗА ДОМЕНОВ
export const APPS_RULES: Record<string, string[]> = {
  discord: [
    "discord.com", "discordapp.com", "discord.gg", "discord.co", "discord.gift", "discord.gifts",
    "discordapp.net", "discord.media", "discordcdn.com", "discord.app",
    "discord.dev", "discord.new", "discord.tools", "discord.store", "discord.design",
    "discord-activities.com", "discordactivities.com", "discordsays.com", "discordapp.io",
    "media.discordapp.net", "cdn.discordapp.com", "cdn.discordapp.net",
    "gateway.discord.gg", "status.discord.com", "dis.gd",
    "discord-attachments-uploads-prd.storage.googleapis.com",
    // Voice server regions — резолвятся при старте TUN для покрытия динамических voice-IP
    "brazil.discord.media", "dubai.discord.media", "hongkong.discord.media",
    "india.discord.media", "japan.discord.media", "rotterdam.discord.media",
    "singapore.discord.media", "south-korea.discord.media", "southafrica.discord.media",
    "stockholm.discord.media", "sydney.discord.media", "us-central.discord.media",
    "us-east.discord.media", "us-south.discord.media", "us-west.discord.media",
    "europe.discord.media", "russia.discord.media",
    // Новые регионы / алиасы (после апрельского апдейта 2026 voice-инфраструктуры)
    "newark.discord.media", "atlanta.discord.media", "dallas.discord.media",
    "seattle.discord.media", "santa-clara.discord.media", "saint-louis.discord.media",
    "montreal.discord.media", "buenos-aires.discord.media", "santiago.discord.media",
    "warsaw.discord.media", "madrid.discord.media", "milan.discord.media",
    "frankfurt.discord.media", "bucharest.discord.media", "tel-aviv.discord.media",
    "jakarta.discord.media", "taipei.discord.media", "tokyo.discord.media",
    // STUN-серверы (WebRTC ICE candidate discovery). КРИТИЧНО для split-tunnel:
    // если STUN-пакеты уходят мимо VPN — Discord видит несоответствие IP между WS и ICE,
    // блокирует voice/screen-share. Без этих доменов в TUN — голос не идёт.
    "stun.l.google.com", "stun1.l.google.com", "stun2.l.google.com",
    "stun3.l.google.com", "stun4.l.google.com",
    "stun.discord.gg", "stun.discord.media",
    "discord", "discordapp"
  ],
  telegram: [
    "telegram", "telegram.org", "telegram.me", "telegram.dog", 
    "t.me", "tx.me", "tg.me", 
    "telegra.ph", "telesco.pe", "graph.org",
    "cdn-telegram.org", "telegram-cdn.org", 
    "usercontent.telegram.org", "telegram-users.com",
    "stel.com", "ip-telegram.org", 
    "tdesktop.com", "desktop.telegram.org",
    "telegram.space", "telegram-dns.org"
  ],
  twitter: ["twitter", "x.com", "twimg.com", "t.co", "cms-twdigitalassets.com", "abs.twimg.com"],
  instagram: ["instagram", "cdninstagram", "facebook", "fbcdn", "meta", "fbsbx.com", "whatsapp.com"],
  facebook: ["facebook.com", "facebook.net", "fb.com", "fb.gg", "fbcdn.net", "fbsbx.com", "messenger.com"],
  linkedin: ["linkedin.com", "licdn.com", "linkedin.cn", "www.linkedin.com"],
  tiktok: ["tiktok.com", "tiktokv.com", "tiktokcdn.com", "byteoversea.com", "ibytedtos.com", "muscdn.com", "musical.ly"],
  youtube: [
    "youtube.com", "www.youtube.com", "youtu.be", "yt.be", "youtube-nocookie.com", "youtube-ui.l.google.com",
    "googlevideo.com", "googlevideo", "ytimg.l.google.com",
    "ytimg.com", "ggpht.com", "gstatic.com", "gvt1.com", "gvt2.com", "gvt3.com",
    "googleapis.com", "youtubei.googleapis.com", "youtube.googleapis.com", 
    "googleusercontent.com", "clients1.google.com", "video.google.com",
    "youtube"
  ],
  netflix: ["netflix.com", "netflix.net", "nflximg.net", "nflximg.com", "nflxvideo.net", "nflxso.net", "nflxext.com"],
  spotify: ["googleusercontent.com", "spotifycdn.com", "scdn.co", "spoti.fi", "audio-ak-spotify-com.akamaized.net"],
  roblox: [
      "roblox.com", "www.roblox.com", "rbxcdn.com", "rblx.com", "robloxlabs.com", "rbx.com",
      "setup.roblox.com", "cdn.roblox.com", "clientsettings.roblox.com", "versioncompatibility.api.roblox.com",
      "c5.rbxcdn.com", "c7.rbxcdn.com", "t0.rbxcdn.com", "t1.rbxcdn.com", "t2.rbxcdn.com", "t3.rbxcdn.com",
      "t4.rbxcdn.com", "t5.rbxcdn.com", "t6.rbxcdn.com", "t7.rbxcdn.com",
      "clientsettingscdn.roblox.com", "metrics.roblox.com", "apis.roblox.com",
      "s3.amazonaws.com", "roblox-setup.s3.amazonaws.com", "ecst.roblox.com",
      "digicert.com", "cacerts.digicert.com", "identrust.com"
  ],
  brawlstars: ["supercell.com", "brawlstars.com", "clashofclans.com", "clashroyale.com", "supercell.net", "brawlstarsgame.com"],
  openai: ["openai", "chatgpt", "ai.com", "oaistatic.com", "oaiusercontent.com", "auth0.com", "identrust.com", "openai.com"],
  gemini: ["gemini.google.com", "bard.google.com", "aistudio.google.com", "generativelanguage.googleapis.com", "deepmind.com", "deepmind.google", "makersuite.google.com"],
  canva: ["canva.com", "canva-design.com", "canva.cn", "canva.me"],
  grok: ["x.ai", "grok.x.ai"],
  claude: ["claude.ai", "anthropic.com", "api.anthropic.com", "statsig.anthropic.com", "cdn.anthropic.com"],
  twitch: ["twitch.tv", "www.twitch.tv", "static-cdn.jtvnw.net", "twitchapps.com", "clips.twitch.tv", "passport.twitch.tv", "usher.twitchapps.com"],
  reddit: ["reddit.com", "www.reddit.com", "old.reddit.com", "redd.it", "redditmedia.com", "redditstatic.com", "reddituploads.com", "preview.redd.it", "i.redd.it"],
  github: ["github.com", "githubusercontent.com", "githubassets.com", "github.io", "api.github.com", "raw.githubusercontent.com", "objects.githubusercontent.com"],
  pinterest: ["pinterest.com", "www.pinterest.com", "pinimg.com", "pinterest.ru"],
  steam: ["steampowered.com", "steamcommunity.com", "steamstatic.com", "steamgames.com", "steamusercontent.com", "store.steampowered.com", "api.steampowered.com", "steam.tv"],
  snapchat: ["snapchat.com", "snap.com", "sc-cdn.net", "snapkit.com", "snap-dev.net", "snapchat.com.cdn.cloudflare.net"],
  figma: ["figma.com", "www.figma.com", "static.figma.com", "figma-alpha-api.s3.us-west-2.amazonaws.com"],
  notion: ["notion.so", "www.notion.so", "notion.site", "api.notion.com"],
  medium: ["medium.com", "www.medium.com", "cdn-images-1.medium.com", "miro.medium.com", "medium.com"],
  zoom: ["zoom.us", "zoom.com", "zoomgov.com", "zmpm.cc", "zoom.com.cn"],
  soundcloud: ["soundcloud.com", "www.soundcloud.com", "sndcdn.com", "audio.soundcloud.com", "api.soundcloud.com"]
};

// Все 91.108.X/22 покрываются 91.108.0.0/16; 149.154.164/22 и 149.154.172/22 покрываются 149.154.160.0/20.
// Сокращено с 11 до 3 CIDR — меньше route add команд и не меняет покрытие.
export const TELEGRAM_IPS = [
  "91.108.0.0/16", "149.154.160.0/20", "5.28.192.0/18"
];

// 🇷🇺 Топ-домены RU-сервисов: банки, госы, маркетплейсы, Яндекс/VK/Mail, телеком-сервисы.
// Используются как Xray sniffing-rules — когда Xray видит TLS SNI / DNS этого домена,
// направляет в "direct" outbound (мимо VPN). В TUN-режиме дополнительно нужны Windows
// routes для CIDR — см. RU_BYPASS_CIDRS ниже.
export const RU_BYPASS_DOMAINS = [
  // Банки
  "sber.ru","sberbank.ru","sberbank-cards.ru","online.sberbank.ru","sberbusiness.ru",
  "sberdevices.ru","sberpay.ru","sbermarket.ru","sbermegamarket.ru","domclick.ru",
  "tinkoff.ru","tbank.ru","cdn-tinkoff.ru",
  "vtb.ru","vtb24.ru","online.vtb.ru",
  "alfabank.ru","alfa-bank.ru","click.alfabank.ru",
  "gazprombank.ru","raiffeisen.ru","raif.ru",
  "psbank.ru","open.ru","rshb.ru","rosbank.ru","mkb.ru","mtsbank.ru","sovcombank.ru",
  "homecredit.ru","yoomoney.ru","qiwi.com","qiwi.ru",
  "mir.ru","mironline.ru","nspk.ru",
  // Яндекс
  "yandex.ru","yandex.com","yandex.net","ya.ru","yastatic.net",
  "yandex-team.ru","yandexcloud.net","yastat.net","kinopoisk.ru","kp.ru",
  "drive2.ru","auto.ru","market.yandex.ru","music.yandex.ru","afisha.ru",
  // VK / OK / Mail.ru
  "vk.com","vk.ru","vkontakte.ru","userapi.com","vk-cdn.net","vkuser.net","vkuseraudio.net",
  "vkuservideo.net","vkmessenger.com","vkforms.ru","vkplay.live","vkplay.ru",
  "ok.ru","odnoklassniki.ru","ok-cdn.com","mycdn.me",
  "mail.ru","my.mail.ru","e.mail.ru","cloud.mail.ru","imgsmail.ru","mradx.net",
  "rambler.ru","lenta.ru","gazeta.ru","championat.com",
  // Госуслуги, налоги, МВД (только ASCII / punycode — Xray не парсит кириллицу в доменах)
  "gosuslugi.ru","esia.gosuslugi.ru","gu-st.ru","beta.gosuslugi.ru",
  "nalog.ru","nalog.gov.ru","gnivc.ru","fns.ru",
  "mvd.ru","rkn.gov.ru",
  "pfr.gov.ru","sfr.gov.ru","fss.ru","cbr.ru","minfin.ru",
  "pochta.ru","russianpost.ru",
  // Маркетплейсы
  "ozon.ru","ozonusercontent.com","ozcdn.ru",
  "wildberries.ru","wb.ru","wbcontent.net","wbstatic.net",
  "avito.ru","avito.ma","avito.st",
  "lamoda.ru","kazanexpress.ru","sbermegamarket.ru","mvideo.ru","eldorado.ru",
  "dns-shop.ru","citilink.ru","beru.ru",
  // СМИ / контент
  "rbc.ru","ria.ru","tass.ru","interfax.ru","kommersant.ru","vedomosti.ru",
  "rg.ru","1tv.ru","ren.tv","ntv.ru","vesti.ru","sport-express.ru",
  "habr.com","pikabu.ru","drom.ru","irecommend.ru","2gis.ru","2gis.com",
  // Телеком, контент-сервисы
  "rt.ru","rostelecom.ru","mts.ru","megafon.ru","beeline.ru","tele2.ru",
  "kion.ru","wink.ru","ivi.ru","okko.tv","more.tv","start.ru","kinopoisk.ru",
  // Soft / антивирусы
  "kaspersky.ru","kaspersky.com","drweb.ru","drweb.com","1c.ru","bitrix24.ru","bitrix.ru",
  // Образование
  "edu.ru","mos.ru","mosreg.ru","sferum.ru","uchi.ru","skysmart.ru","gto.ru",
  // Транспорт
  "rzd.ru","aeroflot.ru","s7.ru","pobeda.aero","gibdd.ru",
];

// 🇷🇺 CIDR-префиксы топ-RU сервисов (для TUN-режима — Windows routes через физ-шлюз).
// ОС маршрутизирует по dst-IP, не по домену, поэтому нужно явно прописать диапазоны.
// Источник: BGP/RIPE данные по основным AS российских сервисов.
// Не пытаемся покрыть весь geoip:ru (~5000 префиксов) — только реально нужное.
export const RU_BYPASS_CIDRS = [
  // Sberbank (AS35423, AS39174, AS41722)
  "194.84.224.0/19","213.247.232.0/22","185.41.36.0/22","5.143.224.0/20",
  "194.186.207.0/24","185.69.32.0/22",
  // Tinkoff / T-Bank (AS205638, AS204216)
  "91.194.226.0/23","91.218.140.0/22","185.215.4.0/22","91.218.230.0/24",
  // VTB (AS47629, AS44903)
  "194.107.106.0/23","194.84.94.0/24","194.135.232.0/22",
  // Alfa-Bank (AS56543, AS49404)
  "212.45.16.0/20","217.13.216.0/22",
  // Gazprombank, Raiffeisen, Otkritie, Rosbank, MKB, PSB, Sovcom
  "194.135.91.0/24","194.247.16.0/22","193.107.236.0/22","217.31.176.0/20",
  "212.5.95.0/24","185.97.248.0/22","91.216.61.0/24",
  // Yandex (AS13238) — основные блоки
  "5.45.192.0/18","5.255.192.0/18","37.9.64.0/18","37.140.128.0/18",
  "77.88.0.0/18","84.201.128.0/18","87.250.224.0/19","93.158.128.0/18",
  "95.108.128.0/17","100.43.64.0/19","141.8.128.0/18","178.154.128.0/17",
  "199.21.96.0/22","199.36.240.0/22","213.180.192.0/19",
  // Yandex.Cloud (AS200350)
  "51.250.0.0/16","62.84.96.0/19","84.252.128.0/21","158.160.0.0/15",
  // VK Group / VK.com / OK.ru (AS47541, AS47764)
  "87.240.128.0/18","93.186.224.0/19","95.213.0.0/17","185.212.144.0/22",
  "188.93.16.0/20","217.20.144.0/20","185.32.124.0/22",
  // Mail.ru / VK Cloud (AS47764, AS21051)
  "178.176.0.0/19","217.69.128.0/20","94.100.176.0/20","5.61.232.0/22",
  "62.76.224.0/20","185.30.176.0/22",
  // Wildberries (AS41843, AS207168)
  "178.176.176.0/20","178.218.140.0/22","212.220.51.0/24","185.116.252.0/22",
  // Avito (AS204538)
  "185.69.144.0/22",
  // Ozon (AS47764 partial, own AS204771)
  "217.144.96.0/20","37.230.140.0/22","185.171.4.0/22",
  // Lamoda, DNS-shop, Citilink, M.Video
  "194.176.13.0/24","185.131.200.0/22","91.227.16.0/22","31.13.144.0/22",
  // Rostelecom Hosting — gosuslugi.ru, nalog.ru, mvd.ru, pfr.gov.ru, court services
  "178.250.240.0/20","95.165.128.0/18","212.45.0.0/19","194.190.0.0/16",
  "212.46.224.0/19","91.144.144.0/20","91.232.224.0/19",
  // ЦБ РФ, Минфин, ФНС
  "194.84.95.0/24","193.36.131.0/24","193.0.190.0/24",
  // Pochta Russia (AS41877)
  "194.226.121.0/24","217.18.224.0/19",
  // Kaspersky (AS35095)
  "77.74.176.0/20","91.103.64.0/22","185.85.196.0/22",
  // Dr.Web (AS39134, AS44128)
  "195.211.84.0/22","217.65.96.0/20",
  // 1C / Bitrix24
  "193.34.114.0/24","91.232.96.0/22","178.248.232.0/22",
  // 2GIS (AS35311)
  "31.31.196.0/22","178.176.92.0/22",
  // RZD, Aeroflot
  "94.124.192.0/22","194.84.32.0/22",
  // ivi.ru, Okko, KION, Wink (стриминг-сервисы)
  "5.61.16.0/20","185.50.244.0/22","91.208.93.0/24","217.144.96.0/20",
  // MTS Cloud / Beeline Cloud / MegaFon enterprise
  "212.45.16.0/20","91.149.0.0/19","178.176.224.0/19",
  // Habr, Pikabu, Drom, прочие крупные .ru
  "178.248.232.0/22","5.181.108.0/22","178.21.16.0/22","176.99.10.0/24",
  // Yandex/Google public DNS used in RU (для совместимости — dns.yandex.ru)
  "77.88.8.0/24",
];

export const IP_CHECK_DOMAINS = [
  "2ip.ru", "www.2ip.ru", "ipwho.is", "ipinfo.io", "whoer.net", "ifconfig.me", "api.ipify.org", 
  "ip-api.com", "ident.me", "icanhazip.com"
];

// Известные IP-диапазоны для TUN split routing (маршруты удаляются автоматически при падении NarodniyVPN)
export const KNOWN_APP_ROUTE_RANGES: Record<string, string[]> = {
  telegram:  ["91.108.0.0/16","149.154.160.0/20","5.28.192.0/18"],
  discord:   [
    // Discord ASN (AS36459) — основной диапазон + новые /24 (доп. подсети 2026)
    "66.22.192.0/18","198.246.16.0/21","205.166.176.0/22",
    "195.62.89.0/24",
    // i3D.net (AS49544) — главный хостер *.discord.media voice-серверов в EU/Asia/Americas.
    // Discord в апреле 2026 переключил часть voice-нагрузки на новые подсети i3D.net,
    // из-за чего split-туннель перестал ловить голосовой трафик. Без этих ranges голос идёт мимо TUN.
    "5.200.0.0/19","31.204.128.0/19","89.104.160.0/21",
    "109.200.192.0/19","130.254.64.0/19","188.122.64.0/19",
    "213.163.64.0/19","213.179.192.0/19",
    "203.132.16.0/20","212.104.192.0/20","216.98.48.0/20",
    "43.239.136.0/22","103.194.164.0/22","104.153.84.0/22",
    "138.128.136.0/22","138.128.140.0/22","162.245.204.0/22",
    "185.38.20.0/22","185.41.140.0/22","185.50.104.0/22",
    "185.52.12.0/22","185.77.208.0/22","185.162.56.0/22",
    "185.171.240.0/22","185.172.132.0/22","185.185.212.0/22",
    "185.191.240.0/22","199.27.212.0/22","212.19.224.0/22",
    // Cloudflare полный список (https://www.cloudflare.com/ips-v4) — voice серверы *.discord.media
    // 162.158.0.0/15 разбит на два /16, т.к. Windows New-NetRoute может отклонять /15 молча
    "162.158.0.0/16","162.159.0.0/16","104.16.0.0/13","104.24.0.0/14","172.64.0.0/13",
    "173.245.48.0/20","108.162.192.0/18","141.101.64.0/18",
    "188.114.96.0/20","190.93.240.0/20","197.234.240.0/22",
    "198.41.128.0/17","131.0.72.0/22",
    "103.21.244.0/22","103.22.200.0/22","103.31.4.0/22",
    // 🔥 КРИТИЧНО: Cloudflare Spectrum — новый voice-блок Discord (после апрель-2026 апдейта).
    // Подтверждено WebRTC-логом Discord: voice/screen-share подключаются к 104.29.140.x и 104.29.155.x
    // на портах 19327/19334. Этого диапазона НЕ БЫЛО в стандартных Cloudflare /13 и /14, поэтому
    // UDP-голос привязывался к физическому адаптеру → утечка реального IP → Discord блокировал voice.
    "104.28.0.0/14",
    // 🔥 КРИТИЧНО: Google Cloud Platform (AS396982) — Discord переключил часть voice на GCP в мае 2026.
    // Подтверждено WebRTC-логом: TryConnect 35.217.5.93:50008 → Force Close в state RTC_CONNECTING.
    // GCP IP не было в routes → UDP-echo discovery уходил через физ-адаптер → server видел реальный
    // IP юзера ≠ VPN exit IP → handshake fail. /16 ranges покрывают us-central1, europe-west, asia-east
    // кластеры где Discord держит voice. Узко, чтобы не тащить весь GCP (Spotify, Netflix) через VPN.
    "35.214.0.0/16","35.215.0.0/16","35.216.0.0/16","35.217.0.0/16",
    "35.234.0.0/16","35.235.0.0/16","35.236.0.0/16","35.237.0.0/16",
    "35.246.0.0/16","35.247.0.0/16",
    // OVH EU (Netherlands, France, Germany, Canada) — Discord голосовые серверы Europe/Russia регионов
    "51.68.0.0/16","51.75.0.0/16","51.77.0.0/16","51.89.0.0/16",
    "54.36.0.0/16","54.38.0.0/16",
    "135.125.0.0/16","141.94.0.0/16","141.95.0.0/16",
    "162.19.0.0/16","188.165.0.0/16","192.99.0.0/16",
    "194.135.0.0/16",
    // Hetzner (Germany/Finland) — ещё один хостинг Discord EU voice
    "5.9.0.0/16","88.99.0.0/16","95.216.0.0/16",
    "116.203.0.0/16","138.201.0.0/16","157.90.0.0/16",
    // DigitalOcean / Vultr — EU и US voice серверы
    "104.248.0.0/16","161.35.0.0/16","165.232.0.0/16",
    "45.63.0.0/16","45.76.0.0/16","45.77.0.0/16","149.28.0.0/16","207.246.0.0/16",
    // Google STUN + Discord auth/Drive endpoints — anycast диапазоны.
    // 173.194.0.0/16 и 108.177.0.0/17 добавлены: ранее они инжектились через netstat:443
    // постфактум, первые пакеты утекали мимо VPN → ICE-leak → Discord блокировал voice.
    "74.125.0.0/16","142.250.0.0/15","172.217.0.0/16","216.58.192.0/19","64.233.160.0/19",
    "173.194.0.0/16","108.177.0.0/17",
    // Публичные DNS (Cloudflare 1.1.1.1, 1.0.0.1; Google 8.8.8.8, 8.8.4.4) — DNS-запросы
    // обязаны идти через VPN, иначе ISP-DNS вернёт регион-оптимизированные Discord-IP,
    // не покрытые маршрутами → voice утекает. См. netsh dnsservers конфиг в startTun2Socks.
    "1.1.1.0/24","1.0.0.0/24","8.8.8.0/24","8.8.4.0/24"
  ],
  youtube:   ["142.250.0.0/15","172.217.0.0/16","216.58.0.0/16","74.125.0.0/16","64.233.160.0/19"],
  gemini:    ["142.250.0.0/15","172.217.0.0/16","74.125.0.0/16"],
  twitter:   ["104.244.40.0/21","192.133.77.0/24"],
  instagram: ["157.240.0.0/16","31.13.24.0/21"],
  facebook:  ["157.240.0.0/16","31.13.24.0/21"],
  openai:    ["104.18.0.0/16","104.16.0.0/16"],
  tiktok:    ["161.117.0.0/16","23.214.0.0/16"],
  netflix:   ["198.38.96.0/19","198.45.48.0/20","208.75.76.0/22"],
  spotify:   ["35.186.0.0/17"],
  canva:     ["104.18.0.0/16","104.16.0.0/16"],
  linkedin:  ["108.174.0.0/20","185.63.144.0/22"],
  claude:    ["104.18.0.0/16","104.16.0.0/16"],
  twitch:    ["23.160.0.0/18","199.9.250.0/24","23.227.38.0/24"],
  reddit:    ["151.101.0.0/16"],
  github:    ["140.82.112.0/20","185.199.108.0/22","192.30.252.0/22"],
  pinterest: ["151.101.0.0/16","64.242.242.0/24"],
  steam:     ["208.64.200.0/22","192.69.96.0/22","104.64.0.0/10"],
  snapchat:  ["216.52.0.0/14","34.160.0.0/11"],
  figma:     ["104.18.0.0/16","104.16.0.0/16"],
  notion:    ["104.18.0.0/16","104.16.0.0/16"],
  medium:    ["162.159.152.0/23","104.28.0.0/16"],
  zoom:      ["149.137.0.0/17","3.208.72.0/22","99.79.20.0/24","103.122.166.0/23"],
  soundcloud:["34.240.0.0/13","151.101.0.0/16"],
};

export function generateXrayConfig(
  finalLink: string,
  activeApps: string[] = [],
  isProxyAll: boolean = false,
  localPort: number = 10808,
  useZapretForRoblox: boolean = false,
  routingMode: string = 'proxy',
  bypassRu: boolean = false
) {
  try {
    let outboundConfig = null;
    let remoteHost = ""; 

    if (finalLink.startsWith('ss://')) {
        let link = finalLink;
        if (link.includes('#')) link = link.split('#')[0];
        if (!link.includes('@')) {
           try {
             const payload = link.replace('ss://', '');
             const decoded = Buffer.from(payload, 'base64').toString('utf8');
             link = `ss://${decoded}`;
           } catch (e) {}
        }
        const url = new URL(link);
        remoteHost = url.hostname;
        let userInfo = url.username; 
        if (!url.password && userInfo) {
          try {
            let decoded = Buffer.from(userInfo, 'base64').toString('utf8');
            if (decoded.includes(':')) userInfo = decoded;
          } catch (e) {}
        }
        const parts = userInfo.split(':');
        const port = Number(url.port);
        if (!parts[0] || !parts[1] || isNaN(port)) return null;

        outboundConfig = {
          protocol: "shadowsocks",
          tag: "proxy",
          settings: {
            servers: [{ address: url.hostname, port: port, method: parts[0], password: parts[1], level: 0 }]
          }
        };
    } 
    else if (finalLink.startsWith('vless://')) {
        const url = new URL(finalLink);
        const params = url.searchParams;
        remoteHost = url.hostname;
        const port = Number(url.port);
        if (isNaN(port)) return null;

        const networkType = params.get('type') || 'tcp';
        const securityType = params.get('security') || 'none';
        const flow = params.get('flow') || ""; 

        outboundConfig = {
          protocol: "vless",
          tag: "proxy",
          settings: {
            vnext: [{
                address: url.hostname,
                port: port,
                users: [{
                    id: url.username,
                    encryption: "none",
                    flow: flow
                }]
            }]
          },
          streamSettings: {
            network: networkType,
            security: securityType,
            realitySettings: securityType === 'reality' ? {
              publicKey: params.get('pbk') || params.get('publickey') || '',
              shortId: params.get('sid') || params.get('shortId') || '',
              serverName: params.get('sni') || params.get('serverName') || '',
              fingerprint: params.get('fp') || 'chrome'
            } : undefined,
            tlsSettings: securityType === 'tls' ? {
                serverName: params.get('sni') || '',
                fingerprint: params.get('fp') || 'chrome',
                allowInsecure: params.get('allowInsecure') === '1'
            } : undefined,
            tcpSettings: networkType === 'tcp' ? { header: { type: params.get('headerType') || 'none' } } : undefined,
            grpcSettings: networkType === 'grpc' ? { serviceName: params.get('serviceName') || params.get('path') || '', multiMode: params.get('mode') === 'multi' } : undefined,
            wsSettings: networkType === 'ws' ? { path: params.get('path') || '/', headers: { Host: params.get('host') || '' } } : undefined
          },
          // XUDP: форвардит UDP (Discord голос, RTC, шаринг экрана) через VLESS туннель.
          // enabled: true — необходимо для активации xudpConcurrency (xray требует enabled=true).
          // concurrency: -1 — TCP mux отключён (несовместим с xtls-rprx-vision), только XUDP.
          // xudpConcurrency: 32 — Discord открывает много параллельных UDP-стримов: voice (default),
          // stream/screen-share, RTCP feedback, ICE-keepalive, camera. С лимитом 16 был jitter
          // из-за блокировки на новых стримах. 32 — с запасом, не нагружает сервер.
          mux: {
            enabled: true,
            concurrency: -1,
            xudpConcurrency: 32,
            xudpProxyUDP443: "allow"
          }
        };
    } else {
        return null;
    }

    let rules: any[] = [];

    rules.push({ type: "field", ip: ["::/0"], outboundTag: "block" });
    // Блокируем broadcast/multicast — Windows NetBIOS шум создаёт сотни UDP-сокетов в tun2socks
    rules.push({ type: "field", ip: ["224.0.0.0/4", "255.255.255.255/32", "198.18.255.255/32"], outboundTag: "block" });
    rules.push({ type: "field", ip: ["geoip:private"], outboundTag: "direct" });

    // В TUN-режиме маршрут до VPN-сервера управляется ОС (route add), не Xray
    // Иначе direct -> default route -> TUN -> tun2socks -> Xray -> loop
    if (routingMode !== 'tun' && remoteHost) {
      const isIp = /^[0-9.]+$|^[a-fA-F0-9:]+$/.test(remoteHost);
      if (isIp) rules.push({ type: "field", ip: [remoteHost], outboundTag: "direct" });
      else rules.push({ type: "field", domain: [remoteHost], outboundTag: "direct" });
    }

    if (useZapretForRoblox && APPS_RULES['roblox']) {
        rules.push({ type: "field", domain: APPS_RULES['roblox'], outboundTag: "direct" });
    }

    // Блокируем QUIC только в proxy-режиме — в TUN режиме QUIC проксируется через xudp, блокировать нельзя
    // В proxy-режиме QUIC из браузера всё равно идёт мимо SOCKS, поэтому блок безвреден и помогает fallback
    if (routingMode !== 'tun') {
      rules.push({ type: "field", network: "udp", port: "443", outboundTag: "block" });
    }

    rules.push({ type: "field", domain: IP_CHECK_DOMAINS, outboundTag: "proxy" });

    // В TUN-режиме весь публичный трафик идёт через proxy.
    // "direct" для публичных IP создал бы loop: Xray -> default route -> TUN -> tun2socks -> Xray
    if (routingMode === 'tun' || isProxyAll) {
      // 🇷🇺 Bypass-RU rules ТОЛЬКО в pure-proxy режиме (isProxyAll && !tun).
      //
      // Почему НЕ в TUN: Xray domain match (TLS SNI) ловит, например, sber.ru → решает
      // "direct" → открывает обычный сокет к IP который sber.ru резолвится. Если этот
      // IP вне RU_BYPASS_CIDRS (CDN, edge, новый блок) — Windows-маршрута для него нет,
      // ОС роутит по TUN /1 catch-all → tun2socks → SOCKS5 → Xray → "direct" → TUN → ...
      // Бесконечный loop, эфемерные порты Windows исчерпаны за секунды.
      //
      // В TUN режиме bypass обеспечивается ИСКЛЮЧИТЕЛЬНО Windows routes (RU_BYPASS_CIDRS
      // через физ-шлюз — добавляются в startTun2Socks). Xray такие пакеты вообще не видит,
      // т.к. ОС их разруливает на уровне routing table до попадания в TUN-адаптер.
      //
      // Минус: покрытие в TUN ограничено CIDR-списком — RU-сервис чьи IP не в списке
      // пойдёт через VPN (может получить geo-блок). Лечится расширением RU_BYPASS_CIDRS.
      if (bypassRu && routingMode !== 'tun') {
        rules.push({ type: "field", domain: RU_BYPASS_DOMAINS, outboundTag: "direct" });
        rules.push({ type: "field", ip: RU_BYPASS_CIDRS, outboundTag: "direct" });
      }
      rules.push({ type: "field", network: "tcp,udp", outboundTag: "proxy" });
    } else {
      let targetDomains: string[] = [];
      let addTelegramIps = false;

      activeApps.forEach(appKey => {
        if (useZapretForRoblox && appKey === 'roblox') return;
        if (appKey === 'telegram') addTelegramIps = true;
        if (APPS_RULES[appKey]) targetDomains.push(...APPS_RULES[appKey]);
      });

      if (bypassRu) {
        rules.push({ type: "field", domain: RU_BYPASS_DOMAINS, outboundTag: "direct" });
        rules.push({ type: "field", ip: RU_BYPASS_CIDRS, outboundTag: "direct" });
      }

      if (targetDomains.length > 0) {
        rules.push({ type: "field", domain: targetDomains, outboundTag: "proxy" });
      }

      // Discord voice UDP через SOCKS5/XUDP: добавляем IP-диапазоны голосовых серверов
      if (activeApps.includes('discord') && KNOWN_APP_ROUTE_RANGES['discord']) {
        rules.push({ type: "field", ip: KNOWN_APP_ROUTE_RANGES['discord'], outboundTag: "proxy" });
      }

      if (addTelegramIps) {
          rules.push({ type: "field", ip: TELEGRAM_IPS, outboundTag: "proxy" });
      }

      rules.push({ type: "field", network: "tcp,udp", outboundTag: "direct" });
    }

    const inbounds: any[] = [
      {
        tag: "socks-in",
        port: localPort,
        listen: "127.0.0.1",
        protocol: "socks",
        settings: { udp: true },
        sniffing: { enabled: true, destOverride: ["http", "tls"], routeOnly: routingMode === 'tun' }
      },
      {
        tag: "http-in",
        port: localPort + 1,
        listen: "127.0.0.1",
        protocol: "http",
        sniffing: { enabled: false }
      }
    ];

    return JSON.stringify({
      log: { loglevel: "warning" },
      dns: {
        servers: ["1.1.1.1", "8.8.8.8"],
        queryStrategy: "UseIPv4"
      },
      inbounds: inbounds,
      outbounds: [
          { ...outboundConfig, domainStrategy: "UseIPv4" },
          { protocol: "freedom", tag: "direct", domainStrategy: "UseIPv4" },
          { protocol: "blackhole", tag: "block" }
      ],
      // domainMatcher: "linear" вместо дефолтного "mph" (minimal perfect hash) —
      // mph периодически паникует "index out of range" на наборах доменов с
      // определёнными комбинациями длин/символов (баг Xray в strmatcher/ac_automaton).
      // Linear чуть медленнее на старте (~5мс на 200 доменов), но не падает.
      routing: { domainMatcher: "linear", domainStrategy: "IPIfNonMatch", rules: rules }
    }, null, 2);

  } catch (e) {
    console.error("Config Gen Error:", e);
    return null;
  }
}