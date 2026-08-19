const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('specpulseApi', {
  build: (prompt) => ipcRenderer.invoke('build', { prompt }),
  reference: (imagePath, additionalPrompt) => ipcRenderer.invoke('reference', { imagePath, additionalPrompt }),
  adjust: (id, instruction) => ipcRenderer.invoke('adjust', { id, instruction }),
  getEnv: () => ipcRenderer.invoke('get-env'),
  saveEnv: (config) => ipcRenderer.invoke('save-env', config),
  generateStarters: () => ipcRenderer.invoke('generate-starters'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  listGenerated: () => ipcRenderer.invoke('list-generated'),
  loadGenerated: (id) => ipcRenderer.invoke('load-generated', { id }),
  deleteGenerated: (id) => ipcRenderer.invoke('delete-generated', { id }),
  clearGenerated: () => ipcRenderer.invoke('clear-generated'),
  exportGenerated: (id) => ipcRenderer.invoke('export-generated', { id }),
  getSpec: (id) => ipcRenderer.invoke('get-spec', { id }),
  saveSpec: (id, spec) => ipcRenderer.invoke('save-spec', { id, spec }),
})
