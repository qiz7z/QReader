/**
 * 创建 QReader 便携免安装版
 * 输出到 QReader-Portable 文件夹，双击 QReader.bat 即可运行
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = __dirname;
// 使用时间戳的目录名避免文件锁定冲突
var ts = new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + 
         String(new Date().getHours()).padStart(2,'0') + String(new Date().getMinutes()).padStart(2,'0');
const OUT = path.join(ROOT, 'QReader-Portable-' + ts);

async function main() {
  // 1. Build Vite
  console.log('=== Build Vite ===');
  execSync(`"${path.join(ROOT, 'node_modules', '.bin', 'vite')}" build`, { stdio: 'inherit', cwd: ROOT });

  // 2. Clean output
  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true });

  // 3. Copy Electron binaries
  console.log('\n=== Copy files ===');
  copyDirSync(path.join(ROOT, 'node_modules', 'electron', 'dist'), OUT, { exclude: ['resources'] });
  var exePath = path.join(OUT, 'electron.exe');
  var qrExe = path.join(OUT, 'QReader.exe');
  if (fs.existsSync(exePath)) fs.renameSync(exePath, qrExe);

  // 4. App code
  var appDir = path.join(OUT, 'resources', 'app');
  fs.mkdirSync(appDir, { recursive: true });
  copyDirSync(path.join(ROOT, 'dist'), path.join(appDir, 'dist'));
  fs.cpSync(path.join(ROOT, 'electron', 'main.cjs'), path.join(appDir, 'main.cjs'));
  fs.cpSync(path.join(ROOT, 'electron', 'preload.cjs'), path.join(appDir, 'preload.cjs'));

  // ws module
  copyDirSync(path.join(ROOT, 'node_modules', 'ws'), path.join(appDir, 'node_modules', 'ws'));

  // package.json
  var pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
  fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify({
    name: pkg.name, version: pkg.version, main: 'main.cjs',
    dependencies: { 'ws': pkg.dependencies.ws }
  }, null, 2));

  // 5. Icon
  var icoPath = path.join(ROOT, 'public', 'app-icon.ico');
  if (fs.existsSync(icoPath)) fs.cpSync(icoPath, path.join(OUT, 'app-icon.ico'));

  // 6. 启动脚本
  var batContent = `@echo off
cd /d "%~dp0"
start "" "%~dp0QReader.exe"
exit
`;
  fs.writeFileSync(path.join(OUT, 'QReader.bat'), batContent);
  console.log('  [bat] QReader.bat created');

  // 7. 显示启动说明
  console.log('\n=== Done ===');
  console.log('Portable folder:', OUT);
  console.log('Run: double-click QReader.bat');
  console.log('');
  console.log('Total size:', getSize(OUT));
}

function getSize(dir) {
  var total = 0;
  walkDir(dir, f => total += fs.statSync(f).size);
  return (total / 1024 / 1024).toFixed(1) + ' MB';
}

function walkDir(dir, fn) {
  for (var e of fs.readdirSync(dir, { withFileTypes: true })) {
    var p = path.join(dir, e.name);
    if (e.isDirectory()) walkDir(p, fn);
    else fn(p);
  }
}

function copyDirSync(src, dest, opts) {
  var exclude = (opts && opts.exclude) || [];
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (var entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (exclude.includes(entry.name)) continue;
    var s = path.join(src, entry.name), d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirSync(s, d, opts);
    else fs.cpSync(s, d);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
