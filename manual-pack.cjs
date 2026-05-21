/**
 * 手动打包 QReader（避免 @electron/packager 在线下载 Electron）
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
const ELECTRON_DIST = path.join(ROOT, 'node_modules', 'electron', 'dist');
const DIST_DIR = path.join(ROOT, 'dist');
const ELECTRON_DIR = path.join(ROOT, 'electron');

async function main() {
  // Step 1: Build Vite
  console.log('=== Step 1: Build Vite ===');
  execSync(`"${path.join(ROOT, 'node_modules', '.bin', 'vite')}" build`, { stdio: 'inherit', cwd: ROOT });

  // Step 2: Assembly (使用新目录，避免旧 app.asar 锁定)
  console.log('\n=== Step 2: Assemble app ===');
  const APP_NAME = 'QReader';
  const outDir = path.join(ROOT, 'release', `${APP_NAME}-win32-x64`);
  const cleanDir = outDir + '-fresh'; // 全新目录避免锁定
  if (fs.existsSync(cleanDir)) fs.rmSync(cleanDir, { recursive: true, force: true });

  // Copy Electron binaries (skip resources)
  console.log('  Copying Electron binaries...');
  copyDirSync(ELECTRON_DIST, cleanDir, { exclude: ['resources'] });

  // Rename electron.exe -> QReader.exe
  const exePath = path.join(cleanDir, 'electron.exe');
  if (fs.existsSync(exePath)) fs.renameSync(exePath, path.join(cleanDir, `${APP_NAME}.exe`));

  // Copy app code
  const appDir = path.join(cleanDir, 'resources', 'app');
  fs.mkdirSync(appDir, { recursive: true });
  console.log('  Copying dist...');
  copyDirSync(DIST_DIR, path.join(appDir, 'dist'));
  console.log('  Copying electron scripts...');
  fs.cpSync(path.join(ELECTRON_DIR, 'main.cjs'), path.join(appDir, 'main.cjs'));
  fs.cpSync(path.join(ELECTRON_DIR, 'preload.cjs'), path.join(appDir, 'preload.cjs'));

  // Copy ws module
  console.log('  Copying ws module...');
  copyDirSync(path.join(ROOT, 'node_modules', 'ws'), path.join(appDir, 'node_modules', 'ws'));

  // Package.json for Electron
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
  fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify({
    name: pkg.name, version: pkg.version, main: 'main.cjs',
    dependencies: { 'ws': pkg.dependencies.ws }
  }, null, 2));

  // Remove old dir and rename fresh to outDir
  if (fs.existsSync(outDir)) {
    try { fs.rmSync(outDir, { recursive: true, force: true }); } catch(e) { console.warn('  Could not delete old dir, using fresh path'); }
  }
  try { fs.renameSync(cleanDir, outDir); } catch(e) {
    // If rename fails, just use the fresh dir as the path
    console.warn('  Rename failed, using fresh directory:', cleanDir);
  }
  // 复制图标
  var icoPath = path.join(ROOT, 'public', 'app-icon.ico');
  if (fs.existsSync(icoPath)) {
    fs.cpSync(icoPath, path.join(cleanDir, 'app-icon.ico'));
    fs.cpSync(icoPath, path.join(appDir, 'app-icon.ico'));
    // 尝试替换 exe 图标（用 build-tools 里的 rcedit）
    var qrExePath2 = path.join(cleanDir, APP_NAME + '.exe');
    var rceditExe = path.join(ROOT, 'build-tools', 'rcedit', 'rcedit-x64.exe');
    if (fs.existsSync(rceditExe)) {
      try {
        execSync(`"${rceditExe}" "${qrExePath2}" --set-icon "${icoPath}"`, { stdio: 'pipe' });
        console.log('  Exe icon replaced');
      } catch(e) { console.warn('  Icon replacement skipped:', e.message); }
    }
  }

  // 始终使用全新目录避免旧文件锁定
  const finalDir = cleanDir;
  console.log('  App assembled at:', finalDir);

  // Step 3: Create NSIS Installer
  console.log('\n=== Step 3: Create NSIS Installer ===');
  const makensisPath = path.join(ROOT, 'build-tools', 'nsis', 'makensis.exe');
  if (!fs.existsSync(makensisPath)) {
    console.log('  NSIS not found, skipping installer. App at:', finalDir);
    return;
  }

  const nsisScript = path.join(ROOT, 'installer.nsi');
  const version = '0.0.0';
  const cmd = `"${makensisPath}" /DVERSION=${version} /DAPP_DIR="${finalDir}" /DOUTPUT_DIR="${ROOT}" "${nsisScript}"`;
  console.log('  Running:', cmd);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });

  console.log('\n=== SUCCESS! ===');
  const files = fs.readdirSync(ROOT).filter(f => f.endsWith('.exe') && f.includes('Setup'));
  if (!fs.existsSync(path.join(ROOT, 'release'))) fs.mkdirSync(path.join(ROOT, 'release'));
  files.forEach(f => {
    try { fs.renameSync(path.join(ROOT, f), path.join(ROOT, 'release', f)); console.log('Installer:', path.join(ROOT, 'release', f)); } catch(e) { console.error(e); }
  });
}

function copyDirSync(src, dest, opts = {}) {
  const exclude = opts.exclude || [];
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (exclude.includes(entry.name)) continue;
    const s = path.join(src, entry.name), d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirSync(s, d, opts);
    else fs.cpSync(s, d);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
