import { app, BrowserWindow, shell, net, desktopCapturer, ipcMain, Menu } from "electron";
import path from "path";
import fs from "fs";
import { execFile } from "child_process";
import os from "os";

// Enable Copy/Paste/Cut/...
const template = [
    {
        label: "Edit",
        submenu: [
            { role: "undo" },
            { role: "redo" },
            { type: "separator" },
            { role: "cut" },
            { role: "copy" },
            { role: "paste" },
            { role: "delete" },
            { type: "separator" },
            { role: "selectAll" },
        ],
    },
];
const menu = Menu.buildFromTemplate(template as any);
Menu.setApplicationMenu(menu);

// ─── Config ──────────────────────────────────────────────
const DEV_URL = "http://localhost:3000";
const PROD_URL = "https://accord-production-fa47.up.railway.app";
const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

// ─── Splash Screen ──────────────────────────────────────
function createSplashWindow() {
    splashWindow = new BrowserWindow({
        width: 300,
        height: 350,
        frame: false,
        transparent: true,
        resizable: false,
        center: true,
        alwaysOnTop: true,
        skipTaskbar: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, "..", "resources", "icon.ico"),
    });

    splashWindow.loadFile(path.join(__dirname, "splash.html"));

    splashWindow.on("closed", () => {
        splashWindow = null;
    });
}

function updateSplashStatus(status: string) {
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.executeJavaScript(
            `document.getElementById('status').textContent = '${status}';`
        );
    }
}

function updateSplashProgress(percent: number) {
    if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.executeJavaScript(`
            const bar = document.getElementById('progressBar');
            const fill = document.getElementById('progressFill');
            bar.classList.remove('indeterminate');
            fill.style.width = '${percent}%';
        `);
    }
}

function closeSplashAndShowMain() {
    createMainWindow();
    // Wait for main window to be ready before closing splash
    if (mainWindow) {
        mainWindow.once("ready-to-show", () => {
            if (splashWindow && !splashWindow.isDestroyed()) {
                splashWindow.close();
            }
        });
    }
}

// ─── Main Window ─────────────────────────────────────────
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Accord",
        show: false, // Don't show until ready
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js"),
        },
        autoHideMenuBar: true,
        backgroundColor: "#313338",
        icon: path.join(__dirname, "..", "resources", "icon.ico"),
    });

    const url = isDev ? DEV_URL : PROD_URL;
    console.log(`Loading URL: ${url}`);
    mainWindow.loadURL(url).catch((err) => {
        console.error("Failed to load URL:", err);
    });

    // Handle Screen Share Requests
    mainWindow.webContents.session.setDisplayMediaRequestHandler((_request: any, callback: any) => {

        desktopCapturer.getSources({ types: ['screen', 'window'], thumbnailSize: { width: 320, height: 180 } }).then((sources: any[]) => {
            // Serialize NativeImage objects to data URLs before sending over IPC
            const serializedSources = sources.map((source: any) => ({
                id: source.id,
                name: source.name,
                thumbnail: source.thumbnail?.toDataURL?.() || "",
                display_id: source.display_id,
                appIcon: source.appIcon?.toDataURL?.() || null,
            }));
            // Send serialized sources to renderer to show picker
            mainWindow?.webContents.send("GET_SOURCES", serializedSources);

            // Listen for selection from renderer
            ipcMain.once("SOURCE_SELECTED", (_event: any, sourceId: any) => {
                if (!sourceId) {
                    // User cancelled — deny the request
                    callback(null);
                    return;
                }

                // Select the original source (not serialized)
                const source = sources.find((s: any) => s.id === sourceId);
                if (!source) {
                    callback(null);
                    return;
                }

                // Provide the selected source to Electron
                callback({ video: source });
            });
        }).catch((err: any) => {
            console.error("Error getting sources:", err);
            callback(null);
        });
    });

    mainWindow.once("ready-to-show", () => {
        mainWindow!.show();
    });

    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith("http:") || url.startsWith("https:")) {
            shell.openExternal(url);
            return { action: "deny" };
        }
        return { action: "allow" };
    });

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

// ─── Auto Update System ─────────────────────────────────
function checkForUpdates(): Promise<boolean> {
    return new Promise((resolve) => {
        if (isDev) {
            resolve(false);
            return;
        }

        const request = net.request(`${PROD_URL}/api/app-version`);

        request.on("response", (response) => {
            let data = "";
            response.on("data", (chunk) => {
                data += chunk;
            });

            response.on("end", () => {
                try {
                    const remoteInfo = JSON.parse(data);
                    const currentVersion = app.getVersion();

                    if (
                        remoteInfo.version &&
                        remoteInfo.version !== currentVersion &&
                        remoteInfo.downloadUrl
                    ) {
                        console.log(
                            `Update available: ${currentVersion} -> ${remoteInfo.version}`
                        );
                        updateSplashStatus("Güncelleme bulundu!");
                        downloadAndInstallUpdate(
                            remoteInfo.downloadUrl,
                            remoteInfo.version
                        );
                        // Don't resolve - the app will restart after install
                    } else {
                        console.log("App is up to date.");
                        resolve(false);
                    }
                } catch (e) {
                    console.error("Failed to parse version info", e);
                    resolve(false);
                }
            });
        });

        request.on("error", (err) => {
            console.error("Update check failed", err);
            resolve(false);
        });

        request.end();
    });
}

let retryCount = 0;
const MAX_RETRIES = 5;

function retryUpdate(url: string, version: string, seconds: number = 10) {
    retryCount++;
    if (retryCount > MAX_RETRIES) {
        updateSplashStatus("Güncelleme başarısız. Lütfen manuel indirin.");
        return;
    }
    let countdown = seconds;
    const interval = setInterval(() => {
        countdown--;
        updateSplashStatus(`GÜNCELLEME BAŞARISIZ — ${countdown} SN SONRA TEKRAR DENENİYOR`);
        if (countdown <= 0) {
            clearInterval(interval);
            downloadAndInstallUpdate(url, version);
        }
    }, 1000);
}

function downloadAndInstallUpdate(url: string, version: string) {
    const tempPath = path.join(os.tmpdir(), `Accord-Setup-${version}.exe`);

    // If already downloaded, install directly
    if (fs.existsSync(tempPath)) {
        const stats = fs.statSync(tempPath);
        if (stats.size > 1000000) {
            // Make sure file is > 1MB (not corrupted)
            console.log("Update already downloaded, installing...");
            updateSplashStatus("Güncelleme yükleniyor...");
            updateSplashProgress(100);
            setTimeout(() => runInstaller(tempPath), 500);
            return;
        }
        fs.unlinkSync(tempPath); // Remove corrupted file
    }

    console.log(`Downloading update from: ${url}`);
    updateSplashStatus("Güncelleme indiriliyor...");

    const request = net.request(url);

    request.on("response", (response) => {
        // Handle redirects (GitHub releases use redirects)
        if (response.statusCode === 302 || response.statusCode === 301) {
            const redirectUrl = response.headers["location"];
            if (redirectUrl) {
                const actualUrl = Array.isArray(redirectUrl)
                    ? redirectUrl[0]
                    : redirectUrl;
                downloadAndInstallUpdate(actualUrl, version);
                return;
            }
        }

        if (response.statusCode !== 200) {
            console.error(`Download failed with status: ${response.statusCode}`);
            retryUpdate(url, version);
            return;
        }

        const contentLength = parseInt(
            (response.headers["content-length"] as string) || "0",
            10
        );
        let downloaded = 0;
        const fileStream = fs.createWriteStream(tempPath);

        response.on("data", (chunk) => {
            fileStream.write(chunk);
            downloaded += chunk.length;
            if (contentLength > 0) {
                const percent = Math.round((downloaded / contentLength) * 100);
                updateSplashProgress(percent);
                updateSplashStatus(`İndiriliyor... %${percent}`);
            }
        });

        response.on("end", () => {
            fileStream.end(() => {
                console.log("Update downloaded successfully.");
                updateSplashStatus("Güncelleme yükleniyor...");
                updateSplashProgress(100);
                setTimeout(() => runInstaller(tempPath), 500);
            });
        });

        response.on("error", (err) => {
            console.error("Download error:", err);
            fileStream.close();
            try { fs.unlinkSync(tempPath); } catch { }
            retryUpdate(url, version);
        });
    });

    request.on("error", (err) => {
        console.error("Download request failed", err);
        retryUpdate(url, version);
    });

    request.end();
}

function runInstaller(installerPath: string) {
    console.log("Running silent installer...");
    updateSplashStatus("Yükleniyor, uygulama yeniden başlatılacak...");

    const appExePath = process.execPath;

    execFile(
        installerPath,
        ["/VERYSILENT", "/SUPPRESSMSGBOXES", "/NORESTART", "/CLOSEAPPLICATIONS", "/FORCECLOSEAPPLICATIONS"],
        (err) => {
            if (err) {
                console.error("Installer failed:", err);
                return;
            }
            // Installer finished — relaunch the updated app
            console.log("Installer completed, relaunching app...");
            require("child_process").spawn(appExePath, [], {
                detached: true,
                stdio: "ignore"
            }).unref();
            app.quit();
        }
    );

    // Quit the current app so the installer can replace files
    setTimeout(() => {
        app.quit();
    }, 2000);
}

// ─── App Lifecycle ───────────────────────────────────────
app.on("ready", async () => {
    createSplashWindow();

    // Wait a moment for splash to render, then check updates
    setTimeout(async () => {
        updateSplashStatus("Güncelleme kontrol ediliyor...");

        const noUpdate = await checkForUpdates();

        if (noUpdate === false) {
            // No update found or error — open main app
            updateSplashStatus("Accord başlatılıyor...");
            setTimeout(() => closeSplashAndShowMain(), 800);
        }
        // If update is found, downloadAndInstallUpdate handles the rest
    }, 1500);
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (mainWindow === null) {
        createMainWindow();
    }
});
