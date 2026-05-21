const packager = require('@electron/packager');
const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function getVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
  return pkg.version;
}

async function main() {
  console.log('=== Step 1: Build Vite ===');
  execSync(`"${path.join(__dirname, 'node_modules', '.bin', 'vite')}" build`, { stdio: 'inherit', cwd: __dirname });

  console.log('\n=== Step 2: Package Electron app ===');
  const appPaths = await packager.packager({
    dir: __dirname,
    name: 'QReader',
    platform: 'win32',
    arch: 'x64',
    electronVersion: '33.4.11',
    out: 'release_build',
    overwrite: true,
    asar: false,
    prune: true,
    ignore: [/\/src\//, /\.git/, /\/build-tools\//, /packager\.cjs/, /download-/,
             /getnsis\.cjs/, /\.gitignore/, /README/, /tsconfig/, /vite\.config/],
  });

  const appDir = appPaths[0];
  console.log('App packaged to:', appDir);

  console.log('\n=== Step 3: Create NSIS Installer ===');
  const makensisPath = path.join(__dirname, 'build-tools', 'nsis', 'makensis.exe');
  const nsisScript = path.join(__dirname, 'installer.nsi');
  const version = getVersion();
  const outputDir = __dirname;

  const result = spawnSync(
    makensisPath,
    [`/DVERSION=${version}`, `/DAPP_DIR=${appDir}`, `/DOUTPUT_DIR=${outputDir}`, nsisScript],
    { stdio: 'inherit', cwd: __dirname }
  );

  if (result.status === 0) {
    console.log('\n=== SUCCESS! ===');
    const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.exe') && f.includes('Setup'));
    files.forEach(f => {
      const src = path.join(__dirname, f);
      const dst = path.join(__dirname, 'release', f);
      if (!fs.existsSync(path.join(__dirname, 'release'))) fs.mkdirSync(path.join(__dirname, 'release'));
      fs.renameSync(src, dst);
      console.log('Installer created:', dst);
    });
  } else {
    console.error('NSIS build failed with code:', result.status);
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
