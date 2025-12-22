import { app, BrowserWindow, ipcMain,dialog } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import fs from 'fs';
import crypto from 'crypto';
import si from 'systeminformation';
import dotenv from 'dotenv';
import Store from "electron-store";
import { autoUpdater } from "electron-updater";
import log from "electron-log";


dotenv.config({
  path: path.join(process.resourcesPath, ".env")
});

log.transports.file.level = "info";
autoUpdater.logger = log;

autoUpdater.autoDownload = true;
const SECRET_KEY="qxBvfG9MgW4ps8%mdrkv$KFn3ht!7x02";
// const SECRET_KEY=process.env.SECRET_KEY;
const IV_LENGTH = 16;


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

//for storage
const store = new Store();

ipcMain.handle("store-get", (_, key) => {
  return store.get(key);
});

ipcMain.handle("store-set", (_, { key, value }) => {
  store.set(key, value);
  return true;
});

ipcMain.handle("store-delete", (_, key) => {
  store.delete(key);
  return true;
});

ipcMain.handle("store-has", (_, key) => {
  return store.has(key);
});


// --- ENCRYPT ---
function encryptData(text:string) {
  if (!SECRET_KEY) throw new Error("SECRET_KEY not found");

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(SECRET_KEY), iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

// --- DECRYPT ---
function decryptData(text:string) {
  if (!SECRET_KEY) throw new Error("SECRET_KEY not found");

  const [ivHex, encrypted] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(SECRET_KEY), iv);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// IPC HANDLERS (Renderer can use, but key stays hidden!)
ipcMain.handle("encrypt", (_, text) => encryptData(text));
ipcMain.handle("decrypt", (_, text) => decryptData(text));

//this function generates a unqiue id of the device and save in the computer
function getDeviceId() {
  //i suppose path will be this C:\Users\<you>\AppData\Roaming\<app-name>\device.json
  const file = path.join(app.getPath("userData"), "device_id.txt");

  if (fs.existsSync(file)) {
    return fs.readFileSync(file, "utf8");
  }

  const newId = crypto.randomUUID();
  fs.writeFileSync(file, newId);
  return newId;
}

ipcMain.handle("get-device-info", async () => {
  const system = await si.system();
  const os = await si.osInfo();

  return {
    deviceId: getDeviceId(),
    brand: system.manufacturer || "unknown",
    model: system.model || "unknown",
    systemName: os.platform || "unknown",
    systemVersion: os.release || "unknown",
  };
});

function initAutoUpdater() {
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on("update-available", () => {
    dialog.showMessageBox({
      title: "Update Available",
      message: "A new version is downloading..."
    });
  });

  autoUpdater.on("update-downloaded", () => {
    dialog.showMessageBox({
      title: "Update Ready",
      message: "Restart to apply update?",
      buttons: ["Restart", "Later"]
    }).then(res => {
      if (res.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  autoUpdater.on("error", err => {
    log.error("Updater error:", err);
  });
}



const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "../assets/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
};

app.whenReady().then(() => {
  createWindow();
  initAutoUpdater();
});



app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
