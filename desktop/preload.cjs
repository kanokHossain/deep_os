// Exposes a tiny, safe bridge to the DeepOS web app. Nothing else from Node is reachable.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("deeposDesktop", {
  toggleMini: () => ipcRenderer.send("mini:toggle"),
  platform: process.platform,
});
