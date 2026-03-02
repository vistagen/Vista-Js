const fs = require('fs');
const path = require('path');

const webDir = path.resolve(__dirname, '..');
const vistaTarget = path.resolve(webDir, '../../packages/vista');
const vistaLink = path.resolve(webDir, 'node_modules/vista');

function realpathWorks(linkPath) {
  try {
    fs.realpathSync(linkPath);
    return true;
  } catch {
    return false;
  }
}

function removeIfExists(targetPath) {
  try {
    fs.rmSync(targetPath, { recursive: true, force: true });
  } catch {
    // fallback
  }
}

function ensureVistaLink() {
  if (!fs.existsSync(vistaTarget)) {
    console.warn(`[web] Vista target not found: ${vistaTarget}`);
    return;
  }

  if (fs.existsSync(vistaLink) && realpathWorks(vistaLink)) {
    return;
  }

  removeIfExists(vistaLink);

  const type = process.platform === 'win32' ? 'junction' : 'dir';
  fs.symlinkSync(vistaTarget, vistaLink, type);
  console.log(`[web] Repaired vista link (${type}) -> ${vistaTarget}`);
}

ensureVistaLink();
