const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const toolsDir = path.join(__dirname, 'build-tools');
fs.mkdirSync(toolsDir, { recursive: true });

const artifacts = [
  {
    name: 'nsis-3.0.4.1',
    url: 'https://cdn.npmmirror.com/binaries/electron-builder-binaries/nsis-3.0.4.1/nsis-3.0.4.1.7z',
  },
  {
    name: 'nsis-resources-3.4.1',
    url: 'https://cdn.npmmirror.com/binaries/electron-builder-binaries/nsis-resources-3.4.1/nsis-resources-3.4.1.7z',
  },
];

const sevenZipPath = path.join(__dirname, 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    console.log('Downloading:', url);
    const parsed = new URL(url);
    https.get({ hostname: parsed.hostname, path: parsed.pathname, rejectUnauthorized: false }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        console.log('Redirect to:', res.headers.location);
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      let size = 0;
      res.on('data', (chunk) => { file.write(chunk); size += chunk.length; });
      res.on('end', () => {
        file.end();
        console.log('Downloaded:', (size / 1024 / 1024).toFixed(2), 'MB');
        resolve(size > 100000);
      });
    }).on('error', (e) => { file.close(); reject(e); });
  });
}

(async () => {
  for (const art of artifacts) {
    const archive = path.join(toolsDir, art.name + '.7z');
    const targetDir = path.join(toolsDir, art.name);

    // Download
    if (!fs.existsSync(archive)) {
      await download(art.url, archive);
    }

    // Extract
    if (!fs.existsSync(path.join(targetDir, 'makensis.exe'))) {
      execSync(`"${sevenZipPath}" x "${archive}" -o"${targetDir}" -y`, { stdio: 'pipe' });
      console.log(art.name, 'extracted');
    } else {
      console.log(art.name, 'already extracted');
    }
  }

  // Verify makensis.exe
  const makensisPath = path.join(toolsDir, 'nsis-3.0.4.1', 'makensis.exe');
  if (fs.existsSync(makensisPath)) {
    console.log('\nmakensis.exe found at:', makensisPath);
  } else {
    // Check subdirectories
    const nsisDir = path.join(toolsDir, 'nsis-3.0.4.1');
    const files = fs.readdirSync(nsisDir, { withFileTypes: true });
    for (const f of files) {
      if (f.isDirectory()) {
        const subMakensis = path.join(nsisDir, f.name, 'makensis.exe');
        if (fs.existsSync(subMakensis)) {
          console.log('makensis.exe found at:', subMakensis);
        }
      }
    }
  }

  console.log('\nDone!');
})();
