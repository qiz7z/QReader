/**
 * 在 manual-pack.cjs 中用过，生成 QReader 的 .ico 文件并替换 exe 图标
 * 纯 Node.js 实现，零依赖
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZES = [256, 48, 32, 16];

// ============ 图标绘制（纯像素操作） ============
function makeIconData(w, h) {
  var buf = Buffer.alloc(w * h * 4, 0); // RGBA

  function setPx(x, y, r, g, b, a) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    var i = (y * w + x) * 4;
    buf[i] = r; buf[i+1] = g; buf[i+2] = b; buf[i+3] = a;
  }

  function fillCircle(cx, cy, r, cr, cg, cb, ca) {
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var dx = x - cx, dy = y - cy;
        if (dx*dx + dy*dy <= r*r) setPx(x, y, cr, cg, cb, ca);
      }
    }
  }

  function fillRect(rx, ry, rw, rh, cr, cg, cb, ca) {
    for (var y = ry; y < ry + rh; y++) {
      for (var x = rx; x < rx + rw; x++) {
        setPx(x, y, cr, cg, cb, ca);
      }
    }
  }

  // --- 绘制图标 ---
  var cx = w / 2, cy = h / 2;

  // 1. 蓝色圆形背景（深蓝渐变近似）
  var bgR = 22, bgG = 22, bgB = 46;
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      var dx = x - cx, dy = y - cy, dist = Math.sqrt(dx*dx + dy*dy);
      var maxR = w * 0.46;
      if (dist <= maxR) {
        var t = dist / maxR;
        var r = Math.round(bgR + t * (15 - bgR));
        var g = Math.round(bgG + t * (52 - bgG));
        var b = Math.round(bgB + t * (96 - bgB));
        setPx(x, y, r, g, b, 255);
      }
    }
  }

  // 2. 书本轮廓（简化）
  var bookW = w * 0.5, bookH = h * 0.55;
  var bookX = cx - bookW/2, bookY = cy - bookH/2 + h * 0.05;
  var bookR = 201, bookG = 168, bookB = 92;

  // 书脊
  fillRect(Math.round(bookX), Math.round(bookY), Math.round(bookW), Math.round(bookH), bookR, bookG, bookB, 255);
  // 左页
  fillRect(Math.round(bookX + 2), Math.round(bookY + 3), Math.round(bookW/2 - 3), Math.round(bookH - 6), 250, 245, 235, 255);
  // 右页
  fillRect(Math.round(bookX + bookW/2 + 1), Math.round(bookY + 3), Math.round(bookW/2 - 3), Math.round(bookH - 6), 250, 245, 235, 255);
  // 书签（红色小三角）
  for (var y = Math.round(bookY - h*0.06); y < Math.round(bookY + h*0.04); y++) {
    for (var x = Math.round(cx - 3); x < Math.round(cx + 4); x++) {
      var dy = y - (bookY - h*0.06);
      var halfW = 3 - Math.round(dy / 4);
      if (x >= cx - halfW && x <= cx + halfW) setPx(x, y, 231, 76, 60, 255);
    }
  }

  return buf;
}

// ============ PNG 编码 ============
function createPNG(w, h, rgbaBuf) {
  // 转换 RGBA → BGRA + 翻转 Y（PNG 是 top-down，ICO BMP 需要 bottom-up）
  // 这里我们输出标准的 RGBA PNG
  var raw = Buffer.alloc(w * h * 4 + h);
  for (var y = 0; y < h; y++) {
    var srcY = h - 1 - y; // 翻转
    raw[y * (w*4+1)] = 0; // filter byte
    for (var x = 0; x < w; x++) {
      var si = (srcY * w + x) * 4;
      var di = (y * (w*4+1)) + 1 + x * 4;
      raw[di] = rgbaBuf[si];     // R
      raw[di+1] = rgbaBuf[si+1]; // G
      raw[di+2] = rgbaBuf[si+2]; // B
      raw[di+3] = rgbaBuf[si+3]; // A
    }
  }

  // IHDR
  var ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT - compress raw data
  var compressed = zlib.deflateSync(raw);
  var idat = compressed;

  function makeChunk(type, data) {
    var len = data.length;
    var buf = Buffer.alloc(12 + len);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    // CRC
    var crc = crc32(buf.slice(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  var signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ============ CRC32 ============
var crcTable = null;
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n >>> 0;
      for (var k = 0; k < 8; k++) {
        if (c & 1) c = (0xEDB88320 ^ (c >>> 1)) >>> 0;
        else c = (c >>> 1) >>> 0;
      }
      crcTable[n] = c;
    }
  }
  var crc = 0xFFFFFFFF >>> 0;
  for (var i = 0; i < buf.length; i++) {
    crc = ((crcTable[((crc ^ buf[i]) & 0xFF) >>> 0] ^ (crc >>> 8)) >>> 0);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ============ ICO 创建 ============
function createICO(sizes) {
  var images = sizes.map(function(size) {
    var rgba = makeIconData(size, size);
    var png = createPNG(size, size, rgba);
    return { w: size, h: size, data: png };
  });

  // ICO header
  var header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);   // reserved
  header.writeUInt16LE(1, 2);   // type: 1=ICO
  header.writeUInt16LE(images.length, 4); // count

  // Directory entries
  var dirSize = images.length * 16;
  var dir = Buffer.alloc(dirSize);
  var offset = 6 + dirSize;

  for (var i = 0; i < images.length; i++) {
    var img = images[i];
    var w = img.w >= 256 ? 0 : img.w; // 0 means 256
    var h = img.h >= 256 ? 0 : img.h;
    dir[i * 16] = w;
    dir[i * 16 + 1] = h;
    dir[i * 16 + 2] = 0; // colors
    dir[i * 16 + 3] = 0; // reserved
    dir[i * 16 + 4] = 1; // planes
    dir[i * 16 + 5] = 0;
    dir[i * 16 + 6] = 32; // bpp
    dir[i * 16 + 7] = 0;
    dir.writeUInt32LE(img.data.length, i * 16 + 8);  // size
    dir.writeUInt32LE(offset, i * 16 + 12);          // offset
    offset += img.data.length;
  }

  // Image data
  var imageData = Buffer.concat(images.map(function(i) { return i.data; }));

  return Buffer.concat([header, dir, imageData]);
}

// ============ 主流程 ============
function generateIcon(outputPath) {
  var ico = createICO(SIZES);
  fs.writeFileSync(outputPath, ico);
  console.log('ICO created:', outputPath, '(' + ico.length + ' bytes)');
}

function applyIcon(exePath, icoPath) {
  // 尝试使用 rcedit
  var rceditPath = path.join(__dirname, 'node_modules', '@electron', 'rcedit');
  if (!fs.existsSync(rceditPath)) {
    console.warn('  @electron/rcedit not installed, skipping icon replacement');
    return false;
  }
  
  try {
    var rcedit = require('@electron/rcedit');
    rcedit(exePath, { icon: icoPath });
    console.log('  Icon applied to:', exePath);
    return true;
  } catch (e) {
    console.warn('  Failed to apply icon:', e.message);
    return false;
  }
}

// 如果直接运行则生成 ICO
if (require.main === module) {
  var out = path.join(__dirname, '..', 'public', 'app-icon.ico');
  generateIcon(out);
}

module.exports = { generateIcon, applyIcon, createICO };
