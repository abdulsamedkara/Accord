import { app, BrowserWindow, shell } from "electron";
import path from "path";

// Define the URLs
const DEV_URL = "http://localhost:3000";
// TODO: Replace with your actual production URL when deployed
const PROD_URL = "https://accord-production-fa47.up.railway.app/";

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        title: "Accord",
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            // preload: path.join(__dirname, "preload.js"), 
        },
        autoHideMenuBar: true,
        backgroundColor: "#313338", // Discord-like dark background
        // titleBarStyle: "hidden", // Commented out to restore standard window frame for dragging
        // titleBarOverlay: {
        //     color: '#1e1f22',
        //     symbolColor: '#b5bac1'
        // }
    });

    // In development: Load the local running server
    // In production: Load the remote URL (Client Mode) to ensure sync with web users
    const url = isDev ? DEV_URL : PROD_URL;

    console.log(`Loading URL: ${url}`);
    mainWindow.loadURL(url).catch(err => {
        console.error("Failed to load URL:", err);
    });

    // Open external links in default browser, not Electron
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith("http:")) {
            shell.openExternal(url);
            return { action: "deny" };
        }
        return { action: "allow" };
    });

    if (isDev) {
        // Open DevTools in development
        // mainWindow.webContents.openDevTools();
    }

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}


import { net, dialog } from "electron";

function checkForUpdates() {
    if (isDev) return; // Don't check in dev mode

    const request = net.request(`${PROD_URL}/api/app-version`);

    request.on('response', (response) => {
        let data = '';
        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            try {
                const remoteInfo = JSON.parse(data);
                const currentVersion = app.getVersion();

                // transform "1.0.0" -> number approximation or use semver lib if available.
                // Simple string comparison for now, or just not equal.
                if (remoteInfo.version !== currentVersion) {
                    dialog.showMessageBox(mainWindow!, {
                        type: 'info',
                        title: 'Update Available',
                        message: `A new version (${remoteInfo.version}) of the Accord Desktop App is available.`,
                        detail: 'Your current version is ' + currentVersion + '. Please download the latest version to get new features.',
                        buttons: ['Download', 'Later'],
                        defaultId: 0
                    }).then(({ response }) => {
                        if (response === 0) {
                            shell.openExternal(remoteInfo.downloadUrl || PROD_URL);
                        }
                    });
                }
            } catch (e) {
                console.error("Failed to parse version info", e);
            }
        });
    });

    request.on('error', (err) => {
        console.error("Update check failed", err);
    });

    request.end();
}

app.on("ready", () => {
    createWindow();
    // Check for updates after a short delay
    setTimeout(checkForUpdates, 3000);
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
});
