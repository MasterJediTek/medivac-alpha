/**
 * MediVac One Desktop Companion Service
 * Electron-based desktop application configuration for Windows and macOS
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// Desktop App Types
// ==========================================

export interface DesktopAppConfig {
  appId: string;
  productName: string;
  version: string;
  description: string;
  author: AuthorInfo;
  repository: string;
  homepage: string;
  license: string;
  main: string;
  build: BuildConfig;
  features: DesktopFeatures;
  shortcuts: KeyboardShortcut[];
  tray: TrayConfig;
  autoUpdate: AutoUpdateConfig;
  security: DesktopSecurityConfig;
}

export interface AuthorInfo {
  name: string;
  email: string;
  url: string;
}

export interface BuildConfig {
  appId: string;
  productName: string;
  copyright: string;
  directories: {
    output: string;
    buildResources: string;
  };
  files: string[];
  extraResources: string[];
  mac: MacBuildConfig;
  win: WindowsBuildConfig;
  linux: LinuxBuildConfig;
  publish: PublishConfig[];
}

export interface MacBuildConfig {
  category: string;
  target: MacTarget[];
  icon: string;
  hardenedRuntime: boolean;
  gatekeeperAssess: boolean;
  entitlements: string;
  entitlementsInherit: string;
  notarize: NotarizeConfig;
  darkModeSupport: boolean;
  minimumSystemVersion: string;
}

export type MacTarget = 'dmg' | 'pkg' | 'zip' | 'mas' | 'mas-dev';

export interface NotarizeConfig {
  teamId: string;
}

export interface WindowsBuildConfig {
  target: WindowsTarget[];
  icon: string;
  publisherName: string;
  verifyUpdateCodeSignature: boolean;
  requestedExecutionLevel: 'asInvoker' | 'highestAvailable' | 'requireAdministrator';
  signAndEditExecutable: boolean;
  certificateFile?: string;
  certificatePassword?: string;
}

export type WindowsTarget = 'nsis' | 'nsis-web' | 'portable' | 'appx' | 'msi' | 'squirrel';

export interface LinuxBuildConfig {
  target: LinuxTarget[];
  icon: string;
  category: string;
  maintainer: string;
  vendor: string;
  synopsis: string;
  description: string;
}

export type LinuxTarget = 'AppImage' | 'snap' | 'deb' | 'rpm' | 'flatpak' | 'tar.gz';

export interface PublishConfig {
  provider: 'github' | 's3' | 'spaces' | 'generic';
  owner?: string;
  repo?: string;
  bucket?: string;
  region?: string;
  url?: string;
  channel?: string;
}

export interface DesktopFeatures {
  systemTray: boolean;
  notifications: boolean;
  autoLaunch: boolean;
  deepLinks: boolean;
  fileAssociations: FileAssociation[];
  protocols: ProtocolHandler[];
  contextMenu: boolean;
  printing: boolean;
  clipboard: boolean;
  screenCapture: boolean;
  globalShortcuts: boolean;
}

export interface FileAssociation {
  ext: string;
  name: string;
  description: string;
  mimeType: string;
  icon: string;
}

export interface ProtocolHandler {
  name: string;
  schemes: string[];
}

export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  accelerator: string;
  action: string;
  global: boolean;
}

export interface TrayConfig {
  enabled: boolean;
  icon: string;
  iconPressed?: string;
  tooltip: string;
  menu: TrayMenuItem[];
  clickAction: 'show' | 'toggle' | 'menu';
  doubleClickAction: 'show' | 'toggle' | 'menu';
}

export interface TrayMenuItem {
  id: string;
  label: string;
  type: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
  accelerator?: string;
  enabled?: boolean;
  visible?: boolean;
  checked?: boolean;
  submenu?: TrayMenuItem[];
  action?: string;
}

export interface AutoUpdateConfig {
  enabled: boolean;
  checkOnStartup: boolean;
  checkInterval: number;
  allowPrerelease: boolean;
  allowDowngrade: boolean;
  autoDownload: boolean;
  autoInstallOnAppQuit: boolean;
  provider: 'github' | 's3' | 'generic';
  feedUrl?: string;
}

export interface DesktopSecurityConfig {
  contentSecurityPolicy: string;
  nodeIntegration: boolean;
  contextIsolation: boolean;
  sandbox: boolean;
  webSecurity: boolean;
  allowRunningInsecureContent: boolean;
  enableRemoteModule: boolean;
}

// ==========================================
// Window Management Types
// ==========================================

export interface WindowConfig {
  id: string;
  title: string;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  x?: number;
  y?: number;
  center: boolean;
  resizable: boolean;
  movable: boolean;
  minimizable: boolean;
  maximizable: boolean;
  closable: boolean;
  focusable: boolean;
  alwaysOnTop: boolean;
  fullscreen: boolean;
  fullscreenable: boolean;
  skipTaskbar: boolean;
  kiosk: boolean;
  frame: boolean;
  transparent: boolean;
  hasShadow: boolean;
  opacity: number;
  backgroundColor: string;
  titleBarStyle: 'default' | 'hidden' | 'hiddenInset' | 'customButtonsOnHover';
  titleBarOverlay?: TitleBarOverlay;
  trafficLightPosition?: { x: number; y: number };
  vibrancy?: VibrancyType;
  visualEffectState?: 'followWindow' | 'active' | 'inactive';
}

export interface TitleBarOverlay {
  color: string;
  symbolColor: string;
  height: number;
}

export type VibrancyType =
  | 'appearance-based'
  | 'light'
  | 'dark'
  | 'titlebar'
  | 'selection'
  | 'menu'
  | 'popover'
  | 'sidebar'
  | 'medium-light'
  | 'ultra-dark'
  | 'header'
  | 'sheet'
  | 'window'
  | 'hud'
  | 'fullscreen-ui'
  | 'tooltip'
  | 'content'
  | 'under-window'
  | 'under-page';

// ==========================================
// Default Configurations
// ==========================================

const DEFAULT_DESKTOP_CONFIG: DesktopAppConfig = {
  appId: 'space.manus.medivac.one.desktop',
  productName: 'MediVac One',
  version: '4.0.0',
  description: 'MediVac One Desktop Companion - Virtual Hospital Management System',
  author: {
    name: 'MediVac One',
    email: 'support@medivac.one',
    url: 'https://medivac.one',
  },
  repository: 'https://github.com/medivac-one/desktop',
  homepage: 'https://medivac.one',
  license: 'Proprietary',
  main: 'dist/main/index.js',
  build: {
    appId: 'space.manus.medivac.one.desktop',
    productName: 'MediVac One',
    copyright: '© 2026 MediVac One. All rights reserved.',
    directories: {
      output: 'release',
      buildResources: 'build',
    },
    files: [
      'dist/**/*',
      'package.json',
    ],
    extraResources: [
      'assets/**/*',
    ],
    mac: {
      category: 'public.app-category.medical',
      target: ['dmg', 'zip'],
      icon: 'build/icon.icns',
      hardenedRuntime: true,
      gatekeeperAssess: false,
      entitlements: 'build/entitlements.mac.plist',
      entitlementsInherit: 'build/entitlements.mac.plist',
      notarize: {
        teamId: 'XXXXXXXXXX',
      },
      darkModeSupport: true,
      minimumSystemVersion: '10.15',
    },
    win: {
      target: ['nsis', 'portable'],
      icon: 'build/icon.ico',
      publisherName: 'MediVac One',
      verifyUpdateCodeSignature: true,
      requestedExecutionLevel: 'asInvoker',
      signAndEditExecutable: true,
    },
    linux: {
      target: ['AppImage', 'deb', 'rpm'],
      icon: 'build/icons',
      category: 'Medical',
      maintainer: 'MediVac One <support@medivac.one>',
      vendor: 'MediVac One',
      synopsis: 'Virtual Hospital Management System',
      description: 'MediVac One Desktop Companion - Complete virtual hospital management solution',
    },
    publish: [
      {
        provider: 'github',
        owner: 'medivac-one',
        repo: 'desktop',
      },
    ],
  },
  features: {
    systemTray: true,
    notifications: true,
    autoLaunch: true,
    deepLinks: true,
    fileAssociations: [
      {
        ext: 'mvac',
        name: 'MediVac Document',
        description: 'MediVac One Document',
        mimeType: 'application/x-medivac',
        icon: 'build/file-icon.icns',
      },
    ],
    protocols: [
      {
        name: 'MediVac One',
        schemes: ['medivac', 'medivac-one'],
      },
    ],
    contextMenu: true,
    printing: true,
    clipboard: true,
    screenCapture: true,
    globalShortcuts: true,
  },
  shortcuts: [
    {
      id: 'toggle-window',
      name: 'Toggle Window',
      description: 'Show or hide the main window',
      accelerator: 'CommandOrControl+Shift+M',
      action: 'toggleWindow',
      global: true,
    },
    {
      id: 'new-patient',
      name: 'New Patient',
      description: 'Create a new patient record',
      accelerator: 'CommandOrControl+N',
      action: 'newPatient',
      global: false,
    },
    {
      id: 'search',
      name: 'Search',
      description: 'Open global search',
      accelerator: 'CommandOrControl+K',
      action: 'openSearch',
      global: false,
    },
    {
      id: 'quick-note',
      name: 'Quick Note',
      description: 'Create a quick clinical note',
      accelerator: 'CommandOrControl+Shift+N',
      action: 'quickNote',
      global: true,
    },
    {
      id: 'emergency-alert',
      name: 'Emergency Alert',
      description: 'Trigger emergency alert',
      accelerator: 'CommandOrControl+Shift+E',
      action: 'emergencyAlert',
      global: true,
    },
    {
      id: 'refresh',
      name: 'Refresh',
      description: 'Refresh current view',
      accelerator: 'CommandOrControl+R',
      action: 'refresh',
      global: false,
    },
    {
      id: 'settings',
      name: 'Settings',
      description: 'Open settings',
      accelerator: 'CommandOrControl+,',
      action: 'openSettings',
      global: false,
    },
    {
      id: 'dev-tools',
      name: 'Developer Tools',
      description: 'Toggle developer tools',
      accelerator: 'CommandOrControl+Shift+I',
      action: 'toggleDevTools',
      global: false,
    },
  ],
  tray: {
    enabled: true,
    icon: 'build/tray-icon.png',
    iconPressed: 'build/tray-icon-pressed.png',
    tooltip: 'MediVac One',
    menu: [
      {
        id: 'show',
        label: 'Show MediVac One',
        type: 'normal',
        accelerator: 'CommandOrControl+Shift+M',
        action: 'showWindow',
      },
      {
        id: 'separator-1',
        label: '',
        type: 'separator',
      },
      {
        id: 'patients',
        label: 'Patients',
        type: 'submenu',
        submenu: [
          {
            id: 'new-patient',
            label: 'New Patient',
            type: 'normal',
            accelerator: 'CommandOrControl+N',
            action: 'newPatient',
          },
          {
            id: 'search-patients',
            label: 'Search Patients',
            type: 'normal',
            action: 'searchPatients',
          },
        ],
      },
      {
        id: 'quick-actions',
        label: 'Quick Actions',
        type: 'submenu',
        submenu: [
          {
            id: 'quick-note',
            label: 'Quick Note',
            type: 'normal',
            accelerator: 'CommandOrControl+Shift+N',
            action: 'quickNote',
          },
          {
            id: 'emergency',
            label: 'Emergency Alert',
            type: 'normal',
            accelerator: 'CommandOrControl+Shift+E',
            action: 'emergencyAlert',
          },
        ],
      },
      {
        id: 'separator-2',
        label: '',
        type: 'separator',
      },
      {
        id: 'status',
        label: 'Status: Connected',
        type: 'normal',
        enabled: false,
      },
      {
        id: 'sync',
        label: 'Sync Now',
        type: 'normal',
        action: 'syncNow',
      },
      {
        id: 'separator-3',
        label: '',
        type: 'separator',
      },
      {
        id: 'preferences',
        label: 'Preferences...',
        type: 'normal',
        accelerator: 'CommandOrControl+,',
        action: 'openPreferences',
      },
      {
        id: 'check-updates',
        label: 'Check for Updates...',
        type: 'normal',
        action: 'checkUpdates',
      },
      {
        id: 'separator-4',
        label: '',
        type: 'separator',
      },
      {
        id: 'quit',
        label: 'Quit MediVac One',
        type: 'normal',
        accelerator: 'CommandOrControl+Q',
        action: 'quit',
      },
    ],
    clickAction: 'show',
    doubleClickAction: 'show',
  },
  autoUpdate: {
    enabled: true,
    checkOnStartup: true,
    checkInterval: 3600000,
    allowPrerelease: false,
    allowDowngrade: false,
    autoDownload: true,
    autoInstallOnAppQuit: true,
    provider: 'github',
  },
  security: {
    contentSecurityPolicy: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.medivac.one wss://api.medivac.one;",
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    enableRemoteModule: false,
  },
};

const DEFAULT_MAIN_WINDOW_CONFIG: WindowConfig = {
  id: 'main',
  title: 'MediVac One',
  width: 1400,
  height: 900,
  minWidth: 1024,
  minHeight: 768,
  center: true,
  resizable: true,
  movable: true,
  minimizable: true,
  maximizable: true,
  closable: true,
  focusable: true,
  alwaysOnTop: false,
  fullscreen: false,
  fullscreenable: true,
  skipTaskbar: false,
  kiosk: false,
  frame: true,
  transparent: false,
  hasShadow: true,
  opacity: 1,
  backgroundColor: '#ffffff',
  titleBarStyle: 'hiddenInset',
  titleBarOverlay: {
    color: '#ffffff',
    symbolColor: '#000000',
    height: 40,
  },
  trafficLightPosition: { x: 16, y: 16 },
  vibrancy: 'sidebar',
};

// ==========================================
// Desktop Companion Service Class
// ==========================================

class DesktopCompanionService {
  private config: DesktopAppConfig;
  private mainWindowConfig: WindowConfig;
  private windows: Map<string, WindowConfig> = new Map();

  constructor() {
    this.config = DEFAULT_DESKTOP_CONFIG;
    this.mainWindowConfig = DEFAULT_MAIN_WINDOW_CONFIG;
    this.windows.set('main', this.mainWindowConfig);
    this.loadConfigs();
  }

  async loadConfigs(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('medivac_desktop_config');
      if (stored) {
        const configs = JSON.parse(stored);
        this.config = configs.app || this.config;
        this.mainWindowConfig = configs.mainWindow || this.mainWindowConfig;
      }
    } catch (error) {
      console.error('Failed to load desktop configs:', error);
    }
  }

  async saveConfigs(): Promise<void> {
    try {
      await AsyncStorage.setItem('medivac_desktop_config', JSON.stringify({
        app: this.config,
        mainWindow: this.mainWindowConfig,
      }));
    } catch (error) {
      console.error('Failed to save desktop configs:', error);
    }
  }

  // ==========================================
  // Configuration Getters/Setters
  // ==========================================

  getConfig(): DesktopAppConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<DesktopAppConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfigs();
  }

  getMainWindowConfig(): WindowConfig {
    return { ...this.mainWindowConfig };
  }

  updateMainWindowConfig(config: Partial<WindowConfig>): void {
    this.mainWindowConfig = { ...this.mainWindowConfig, ...config };
    this.windows.set('main', this.mainWindowConfig);
    this.saveConfigs();
  }

  getShortcuts(): KeyboardShortcut[] {
    return [...this.config.shortcuts];
  }

  updateShortcut(id: string, shortcut: Partial<KeyboardShortcut>): void {
    const index = this.config.shortcuts.findIndex(s => s.id === id);
    if (index >= 0) {
      this.config.shortcuts[index] = { ...this.config.shortcuts[index], ...shortcut };
      this.saveConfigs();
    }
  }

  getTrayConfig(): TrayConfig {
    return { ...this.config.tray };
  }

  updateTrayConfig(config: Partial<TrayConfig>): void {
    this.config.tray = { ...this.config.tray, ...config };
    this.saveConfigs();
  }

  // ==========================================
  // Configuration File Generation
  // ==========================================

  generatePackageJson(): string {
    return JSON.stringify({
      name: 'medivac-one-desktop',
      version: this.config.version,
      description: this.config.description,
      main: this.config.main,
      author: this.config.author,
      license: this.config.license,
      repository: {
        type: 'git',
        url: this.config.repository,
      },
      homepage: this.config.homepage,
      scripts: {
        dev: 'electron-vite dev',
        build: 'electron-vite build',
        'build:mac': 'electron-builder --mac',
        'build:win': 'electron-builder --win',
        'build:linux': 'electron-builder --linux',
        'build:all': 'electron-builder -mwl',
        preview: 'electron-vite preview',
        lint: 'eslint .',
        typecheck: 'tsc --noEmit',
        test: 'vitest',
      },
      dependencies: {
        'electron-updater': '^6.1.7',
        'electron-store': '^8.1.0',
        'electron-log': '^5.0.3',
      },
      devDependencies: {
        electron: '^28.1.0',
        'electron-builder': '^24.9.1',
        'electron-vite': '^2.0.0',
        '@electron-toolkit/preload': '^3.0.0',
        '@electron-toolkit/utils': '^3.0.0',
        typescript: '^5.3.3',
        vite: '^5.0.10',
        '@types/node': '^20.10.6',
      },
      build: this.config.build,
    }, null, 2);
  }

  generateMainProcess(): string {
    return `/**
 * MediVac One Desktop - Main Process
 * Auto-generated by Desktop Companion Service
 */

import { app, BrowserWindow, ipcMain, Menu, Tray, shell, globalShortcut, nativeTheme } from 'electron';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';
import log from 'electron-log';
import path from 'path';

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Initialize store
const store = new Store({
  name: 'medivac-one-config',
  defaults: {
    windowBounds: { width: ${this.mainWindowConfig.width}, height: ${this.mainWindowConfig.height} },
    autoLaunch: ${this.config.features.autoLaunch},
    theme: 'system',
  },
});

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

// Security: Disable navigation to external URLs
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, url) => {
    const parsedUrl = new URL(url);
    if (parsedUrl.origin !== 'https://medivac.one') {
      event.preventDefault();
    }
  });

  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});

function createMainWindow(): BrowserWindow {
  const { width, height } = store.get('windowBounds') as { width: number; height: number };

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: ${this.mainWindowConfig.minWidth || 1024},
    minHeight: ${this.mainWindowConfig.minHeight || 768},
    center: ${this.mainWindowConfig.center},
    resizable: ${this.mainWindowConfig.resizable},
    frame: ${this.mainWindowConfig.frame},
    titleBarStyle: '${this.mainWindowConfig.titleBarStyle}',
    ${this.mainWindowConfig.titleBarOverlay ? `titleBarOverlay: ${JSON.stringify(this.mainWindowConfig.titleBarOverlay)},` : ''}
    ${this.mainWindowConfig.vibrancy ? `vibrancy: '${this.mainWindowConfig.vibrancy}',` : ''}
    backgroundColor: '${this.mainWindowConfig.backgroundColor}',
    webPreferences: {
      nodeIntegration: ${this.config.security.nodeIntegration},
      contextIsolation: ${this.config.security.contextIsolation},
      sandbox: ${this.config.security.sandbox},
      webSecurity: ${this.config.security.webSecurity},
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Save window bounds on resize
  mainWindow.on('resize', () => {
    if (mainWindow) {
      const { width, height } = mainWindow.getBounds();
      store.set('windowBounds', { width, height });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

function createTray(): void {
  const iconPath = path.join(__dirname, '../${this.config.tray.icon}');
  tray = new Tray(iconPath);
  tray.setToolTip('${this.config.tray.tooltip}');

  const contextMenu = Menu.buildFromTemplate([
    ${this.config.tray.menu.map(item => {
      if (item.type === 'separator') {
        return `{ type: 'separator' },`;
      }
      return `{
      label: '${item.label}',
      ${item.accelerator ? `accelerator: '${item.accelerator}',` : ''}
      ${item.enabled !== undefined ? `enabled: ${item.enabled},` : ''}
      click: () => handleTrayAction('${item.action || item.id}'),
    },`;
    }).join('\n    ')}
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    ${this.config.tray.clickAction === 'show' ? 'showWindow();' : 
      this.config.tray.clickAction === 'toggle' ? 'toggleWindow();' : 
      'tray?.popUpContextMenu();'}
  });

  tray.on('double-click', () => {
    ${this.config.tray.doubleClickAction === 'show' ? 'showWindow();' : 
      this.config.tray.doubleClickAction === 'toggle' ? 'toggleWindow();' : 
      'tray?.popUpContextMenu();'}
  });
}

function handleTrayAction(action: string): void {
  switch (action) {
    case 'showWindow':
      showWindow();
      break;
    case 'quit':
      app.quit();
      break;
    case 'syncNow':
      mainWindow?.webContents.send('sync-now');
      break;
    case 'openPreferences':
      mainWindow?.webContents.send('open-preferences');
      showWindow();
      break;
    case 'checkUpdates':
      autoUpdater.checkForUpdates();
      break;
    case 'newPatient':
      mainWindow?.webContents.send('new-patient');
      showWindow();
      break;
    case 'quickNote':
      mainWindow?.webContents.send('quick-note');
      showWindow();
      break;
    case 'emergencyAlert':
      mainWindow?.webContents.send('emergency-alert');
      showWindow();
      break;
    default:
      console.log('Unknown tray action:', action);
  }
}

function showWindow(): void {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  } else {
    createMainWindow();
  }
}

function toggleWindow(): void {
  if (mainWindow?.isVisible()) {
    mainWindow.hide();
  } else {
    showWindow();
  }
}

function registerGlobalShortcuts(): void {
  ${this.config.shortcuts.filter(s => s.global).map(shortcut => `
  globalShortcut.register('${shortcut.accelerator}', () => {
    handleTrayAction('${shortcut.action}');
  });`).join('')}
}

// Auto-updater events
autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info);
  mainWindow?.webContents.send('update-available', info);
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded:', info);
  mainWindow?.webContents.send('update-downloaded', info);
});

autoUpdater.on('error', (err) => {
  log.error('Auto-updater error:', err);
});

// IPC handlers
ipcMain.handle('get-version', () => app.getVersion());
ipcMain.handle('get-platform', () => process.platform);
ipcMain.handle('get-store', (_, key) => store.get(key));
ipcMain.handle('set-store', (_, key, value) => store.set(key, value));
ipcMain.handle('check-updates', () => autoUpdater.checkForUpdates());
ipcMain.handle('install-update', () => autoUpdater.quitAndInstall());
ipcMain.handle('get-theme', () => nativeTheme.shouldUseDarkColors ? 'dark' : 'light');

ipcMain.on('set-theme', (_, theme: 'light' | 'dark' | 'system') => {
  nativeTheme.themeSource = theme;
  store.set('theme', theme);
});

// App lifecycle
app.whenReady().then(() => {
  createMainWindow();
  ${this.config.features.systemTray ? 'createTray();' : ''}
  ${this.config.features.globalShortcuts ? 'registerGlobalShortcuts();' : ''}

  ${this.config.autoUpdate.checkOnStartup ? 'autoUpdater.checkForUpdates();' : ''}

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    showWindow();
  });
}

// Protocol handler
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('medivac', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('medivac');
}

app.on('open-url', (event, url) => {
  event.preventDefault();
  mainWindow?.webContents.send('deep-link', url);
  showWindow();
});
`;
  }

  generatePreloadScript(): string {
    return `/**
 * MediVac One Desktop - Preload Script
 * Auto-generated by Desktop Companion Service
 */

import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getVersion: () => ipcRenderer.invoke('get-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // Store
  getStore: (key: string) => ipcRenderer.invoke('get-store', key),
  setStore: (key: string, value: unknown) => ipcRenderer.invoke('set-store', key, value),

  // Updates
  checkUpdates: () => ipcRenderer.invoke('check-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateAvailable: (callback: (info: unknown) => void) => {
    ipcRenderer.on('update-available', (_, info) => callback(info));
  },
  onUpdateDownloaded: (callback: (info: unknown) => void) => {
    ipcRenderer.on('update-downloaded', (_, info) => callback(info));
  },

  // Theme
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme: 'light' | 'dark' | 'system') => ipcRenderer.send('set-theme', theme),

  // Events from main process
  onSyncNow: (callback: () => void) => {
    ipcRenderer.on('sync-now', callback);
  },
  onOpenPreferences: (callback: () => void) => {
    ipcRenderer.on('open-preferences', callback);
  },
  onNewPatient: (callback: () => void) => {
    ipcRenderer.on('new-patient', callback);
  },
  onQuickNote: (callback: () => void) => {
    ipcRenderer.on('quick-note', callback);
  },
  onEmergencyAlert: (callback: () => void) => {
    ipcRenderer.on('emergency-alert', callback);
  },
  onDeepLink: (callback: (url: string) => void) => {
    ipcRenderer.on('deep-link', (_, url) => callback(url));
  },

  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

// Type definitions for renderer
declare global {
  interface Window {
    electronAPI: {
      getVersion: () => Promise<string>;
      getPlatform: () => Promise<string>;
      getStore: (key: string) => Promise<unknown>;
      setStore: (key: string, value: unknown) => Promise<void>;
      checkUpdates: () => Promise<void>;
      installUpdate: () => Promise<void>;
      onUpdateAvailable: (callback: (info: unknown) => void) => void;
      onUpdateDownloaded: (callback: (info: unknown) => void) => void;
      getTheme: () => Promise<'light' | 'dark'>;
      setTheme: (theme: 'light' | 'dark' | 'system') => void;
      onSyncNow: (callback: () => void) => void;
      onOpenPreferences: (callback: () => void) => void;
      onNewPatient: (callback: () => void) => void;
      onQuickNote: (callback: () => void) => void;
      onEmergencyAlert: (callback: () => void) => void;
      onDeepLink: (callback: (url: string) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}
`;
  }

  generateMacEntitlements(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.network.server</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
    <key>com.apple.security.files.downloads.read-write</key>
    <true/>
    <key>com.apple.security.device.camera</key>
    <true/>
    <key>com.apple.security.device.microphone</key>
    <true/>
    <key>com.apple.security.personal-information.location</key>
    <true/>
</dict>
</plist>`;
  }

  generateNsisConfig(): string {
    return `!macro customHeader
  !system "echo '' > 'customHeader'""
!macroend

!macro preInit
  ; This macro is inserted at the beginning of the NSIS .OnInit callback
  SetRegView 64
!macroend

!macro customInit
  ; Custom initialization
!macroend

!macro customInstall
  ; Custom install actions
  WriteRegStr HKLM "Software\\MediVacOne" "InstallPath" "$INSTDIR"
  
  ; Create desktop shortcut
  CreateShortCut "$DESKTOP\\MediVac One.lnk" "$INSTDIR\\MediVac One.exe"
  
  ; Create start menu shortcuts
  CreateDirectory "$SMPROGRAMS\\MediVac One"
  CreateShortCut "$SMPROGRAMS\\MediVac One\\MediVac One.lnk" "$INSTDIR\\MediVac One.exe"
  CreateShortCut "$SMPROGRAMS\\MediVac One\\Uninstall.lnk" "$INSTDIR\\Uninstall MediVac One.exe"
!macroend

!macro customUnInstall
  ; Custom uninstall actions
  Delete "$DESKTOP\\MediVac One.lnk"
  RMDir /r "$SMPROGRAMS\\MediVac One"
  DeleteRegKey HKLM "Software\\MediVacOne"
!macroend
`;
  }
}

// Export singleton instance
export const desktopCompanion = new DesktopCompanionService();

// Export class for custom instances
export { DesktopCompanionService };
