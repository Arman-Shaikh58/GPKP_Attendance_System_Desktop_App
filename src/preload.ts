// preload.ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("deviceAPI", {
  getDeviceInfo: () =>
    ipcRenderer.invoke("get-device-info")
});

contextBridge.exposeInMainWorld("secureAPI", {
  encrypt: (text: string) => ipcRenderer.invoke("encrypt", text),
  decrypt: (text: string) => ipcRenderer.invoke("decrypt", text),
});


contextBridge.exposeInMainWorld("storeAPI", {
  get: (key: string) => ipcRenderer.invoke("store-get", key),
  set: (key: string, value: any) =>
    ipcRenderer.invoke("store-set", { key, value }),
  delete: (key: string) => ipcRenderer.invoke("store-delete", key),
  has: (key: string) => ipcRenderer.invoke("store-has", key),
});
