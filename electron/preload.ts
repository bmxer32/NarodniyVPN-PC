import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel: string, args: any[]) => ipcRenderer.send(channel, args),
    on: (channel: string, func: any) => {
      const subscription = (_event: any, ...args: any[]) => func(...args)
      ipcRenderer.on(channel, subscription)
      return () => ipcRenderer.removeListener(channel, subscription)
    },
    once: (channel: string, func: any) => {
      ipcRenderer.once(channel, (_event, ...args) => func(...args))
    }
  }
})

contextBridge.exposeInMainWorld('api', {
  // 7-й аргумент — bypassRu (RU сервисы напрямую, мимо VPN).
  startVpn: (
    key: string,
    activeApps: string[],
    isProxyAll: boolean,
    isMaskingMode: boolean,
    selectedServerUrl?: string,
    routingMode: string = 'proxy',
    bypassRu: boolean = false
  ) =>
    ipcRenderer.invoke('vpn-start', key, activeApps, isProxyAll, isMaskingMode, selectedServerUrl, routingMode, bypassRu),
    
  stopVpn: () => ipcRenderer.invoke('vpn-stop'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  setTitlebarTheme: (isDark: boolean) => ipcRenderer.send('set-titlebar-theme', isDark),
  
  // Управление автозапуском
  setAutostart: (enable: boolean) => ipcRenderer.invoke('set-autostart', enable),
  getAutostart: () => ipcRenderer.invoke('get-autostart'),
  
  checkVpnIp: () => ipcRenderer.invoke('check-vpn-ip'),
  validateKey: (key: string) => ipcRenderer.invoke('validate-key', key),
  checkRelaunch: () => ipcRenderer.invoke('check-relaunch-flag'),

  // Функция пинга
  pingServer: (url: string) => ipcRenderer.invoke('ping-server', url),

  // Получение списка серверов из подписки
  getServers: (key: string) => ipcRenderer.invoke('get-servers', key),

  // Проверка обновлений
  checkUpdates: () => ipcRenderer.invoke('check-updates'),

  // Авто-обновление: скачать .exe в фоне с прогрессом, потом установить (silent NSIS).
  downloadUpdate: (downloadUrl: string, version: string) =>
    ipcRenderer.invoke('download-update', downloadUrl, version),
  cancelUpdateDownload: () => ipcRenderer.invoke('cancel-update-download'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  // Подписка на прогресс. Возвращает функцию отписки.
  onUpdateProgress: (cb: (data: { percent: number; downloaded: number; total: number; done: boolean }) => void) => {
    const subscription = (_event: any, data: any) => cb(data);
    ipcRenderer.on('update-progress', subscription);
    return () => ipcRenderer.removeListener('update-progress', subscription);
  },
})