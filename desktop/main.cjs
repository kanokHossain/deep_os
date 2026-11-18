// DeepOS for Mac: a menu-bar app around the DeepOS web app.
// The mini timer floats above every app, on every desktop (Space), including full-screen apps,
// and ⌘⇧Space brings it to whichever screen your mouse is on.
const { app, BrowserWindow, Tray, Menu, globalShortcut, screen, ipcMain, shell, nativeImage } = require("electron");
const path = require("node:path");

const APP_URL = process.env.DEEPOS_URL || "https://deepos-ashy.vercel.app";
const SHORTCUT = "CommandOrControl+Shift+Space";
const MINI = { width: 340, height: 250, margin: 20 };

let tray = null;
let mainWin = null;
let miniWin = null;
// Where the user last dragged the mini window, relative to the top-right of its screen.
let miniOffset = null;

if (!app.requestSingleInstanceLock()) app.quit();

const webPreferences = {
  preload: path.join(__dirname, "preload.cjs"),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
};

function openLinksOutside(win) {
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

function createMain() {
  mainWin = new BrowserWindow({
    width: 1100,
    height: 780,
    minWidth: 420,
    minHeight: 560,
    title: "DeepOS",
    show: false,
    backgroundColor: "#eef2f0",
    webPreferences,
  });
  mainWin.loadURL(APP_URL);
  openLinksOutside(mainWin);
  mainWin.once("ready-to-show", () => mainWin.show());
  // Closing the window keeps DeepOS running in the menu bar.
  mainWin.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWin.hide();
    }
  });
}

function showMain() {
  if (!mainWin || mainWin.isDestroyed()) createMain();
  else {
    mainWin.show();
    mainWin.focus();
  }
}

function createMini() {
  miniWin = new BrowserWindow({
    width: MINI.width,
    height: MINI.height,
    frame: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    show: false,
    hasShadow: true,
    backgroundColor: "#eef2f0",
    webPreferences,
  });
  // Float above everything, on every desktop, even over full-screen apps.
  miniWin.setAlwaysOnTop(true, "screen-saver");
  miniWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true, skipTransformProcessType: true });
  miniWin.loadURL(`${APP_URL}/#mini`);
  openLinksOutside(miniWin);

  miniWin.on("moved", () => {
    const b = miniWin.getBounds();
    const d = screen.getDisplayMatching(b).workArea;
    miniOffset = { right: d.x + d.width - (b.x + b.width), top: b.y - d.y };
  });
  miniWin.on("closed", () => {
    miniWin = null;
  });
}

/** Put the mini window on the screen the mouse is on, at the spot the user last chose. */
function placeOnCursorScreen() {
  const d = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;
  const right = miniOffset ? miniOffset.right : MINI.margin;
  const top = miniOffset ? miniOffset.top : MINI.margin;
  const x = Math.round(Math.min(Math.max(d.x, d.x + d.width - MINI.width - right), d.x + d.width - MINI.width));
  const y = Math.round(Math.min(Math.max(d.y, d.y + top), d.y + d.height - MINI.height));
  miniWin.setBounds({ x, y, width: MINI.width, height: MINI.height });
}

function showMini() {
  if (!miniWin) createMini();
  placeOnCursorScreen();
  miniWin.show();
  miniWin.focus();
}

function toggleMini() {
  if (miniWin && miniWin.isVisible()) {
    // Visible on another screen? Bring it here instead of hiding it.
    const here = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).id;
    const there = screen.getDisplayMatching(miniWin.getBounds()).id;
    if (here !== there) showMini();
    else miniWin.hide();
  } else {
    showMini();
  }
}

function buildTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, "assets", "trayTemplate.png"));
  icon.setTemplateImage(true);
  tray = new Tray(icon);
  tray.setToolTip("DeepOS");
  const menu = () =>
    Menu.buildFromTemplate([
      { label: "Show mini timer here", accelerator: SHORTCUT, click: showMini },
      { label: "Hide mini timer", click: () => miniWin && miniWin.hide(), enabled: !!(miniWin && miniWin.isVisible()) },
      { type: "separator" },
      { label: "Open DeepOS", click: showMain },
      {
        label: "Open at login",
        type: "checkbox",
        checked: app.getLoginItemSettings().openAtLogin,
        click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }),
      },
      { type: "separator" },
      { label: "Quit DeepOS", accelerator: "CommandOrControl+Q", click: () => app.quit() },
    ]);
  tray.on("click", toggleMini);
  tray.on("right-click", () => tray.popUpContextMenu(menu()));
  // Left-click toggles the timer; right-click (or Control-click) opens the menu.
}

app.whenReady().then(() => {
  if (process.platform === "darwin" && app.dock) app.dock.hide();
  buildTray();
  createMini();
  createMain();
  globalShortcut.register(SHORTCUT, toggleMini);
  ipcMain.on("mini:toggle", toggleMini);
});

app.on("second-instance", showMain);
app.on("activate", showMain);
app.on("before-quit", () => {
  app.isQuitting = true;
});
app.on("will-quit", () => globalShortcut.unregisterAll());
// Stay alive in the menu bar when all windows are closed.
app.on("window-all-closed", () => {});

// Dev check: DEEPOS_SMOKE=1 opens both windows, saves screenshots, and quits.
if (process.env.DEEPOS_SMOKE) {
  app.whenReady().then(() =>
    setTimeout(async () => {
      const fs = require("node:fs");
      showMini();
      await new Promise((r) => setTimeout(r, 2500));
      fs.writeFileSync("/tmp/smoke-mini.png", (await miniWin.webContents.capturePage()).toPNG());
      fs.writeFileSync("/tmp/smoke-main.png", (await mainWin.webContents.capturePage()).toPNG());
      await miniWin.webContents.executeJavaScript(`(() => {
        const i = document.querySelector('.mini-start input');
        const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        set.call(i, 'Write the proposal intro'); i.dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('.mini-start').requestSubmit();
      })()`);
      await new Promise((r) => setTimeout(r, 2500));
      fs.writeFileSync("/tmp/smoke-mini-active.png", (await miniWin.webContents.capturePage()).toPNG());
      fs.writeFileSync("/tmp/smoke-main-active.png", (await mainWin.webContents.capturePage()).toPNG());
      console.log("SMOKE OK", JSON.stringify(miniWin.getBounds()), miniWin.isAlwaysOnTop());
      app.isQuitting = true;
      app.quit();
    }, 3000),
  );
}
