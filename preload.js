const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize:         ()        => ipcRenderer.send('window-minimize'),
  close:            ()        => ipcRenderer.send('window-close'),
  toggleAlwaysOnTop: ()       => ipcRenderer.invoke('toggle-always-on-top'),

  // Persistent store (electron-store via main process)
  getTasks: ()        => ipcRenderer.invoke('store-get-tasks'),
  setTasks: (tasks)   => ipcRenderer.invoke('store-set-tasks', tasks),
});
