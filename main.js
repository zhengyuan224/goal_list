const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const Store = require('electron-store');

// ── Persistent store ────────────────────────────
const store = new Store({
  name: 'goal-tracker-data',
  defaults: { tasks: [] },
});

let mainWindow;

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();

  const winWidth  = 360;
  const winHeight = 600;

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: workArea.x + workArea.width - winWidth,
    y: workArea.y,
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    resizable: true,
    minWidth: 300,
    minHeight: 400,
    hasShadow: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // Uncomment to debug:
  // mainWindow.webContents.openDevTools({ mode: 'detach' });
}

// ── Window IPC ─────────────────────────────────
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-close',    () => mainWindow?.close());

ipcMain.handle('toggle-always-on-top', () => {
  if (!mainWindow) return false;
  const next = !mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(next);
  return next;
});

// ── Store IPC ───────────────────────────────────
ipcMain.handle('store-get-tasks', () => store.get('tasks'));
ipcMain.handle('store-set-tasks', (_event, tasks) => {
  store.set('tasks', tasks);
});

// ── App lifecycle ───────────────────────────────
app.whenReady().then(() => {
  // Auto-start on boot (Windows/Mac)
  app.setLoginItemSettings({
    openAtLogin: true,
    path: app.getPath('exe')
  });

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
