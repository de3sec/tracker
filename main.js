const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let nextProcess;

// Keep track of initialization to avoid creating multiple windows
let isReady = false;

// We need a free port for the Next.js server
function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

async function createWindow() {
  if (isReady) return;
  isReady = true;

  const isDev = !app.isPackaged;
  let port = 3000;

  if (!isDev) {
    port = await getFreePort();
    
    // In production, the standalone server is packaged into "standalone" folder
    const serverPath = path.join(__dirname, 'standalone', 'server.js');
    const dataDir = app.getPath('userData');
    
    nextProcess = spawn(process.execPath, [serverPath], {
      env: {
        ...process.env,
        PORT: port.toString(),
        NODE_ENV: 'production',
        DATA_DIR: dataDir
      },
      stdio: 'inherit'
    });
  }

  // Wait for the Next.js server to be ready before creating window
  const checkServer = () => {
    http.get(`http://localhost:${port}`, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        showWindow(port);
      } else {
        setTimeout(checkServer, 200);
      }
    }).on('error', () => {
      setTimeout(checkServer, 200);
    });
  };

  checkServer();
}

function showWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true
  });

  mainWindow.loadURL(`http://localhost:${port}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (nextProcess) {
    nextProcess.kill();
  }
});
