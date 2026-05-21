const fs = require('fs')
const content = fs.readFileSync('electron/main.cjs', 'utf8')

// Find the html array
const start = content.indexOf("var html = [")
const end = content.indexOf("].join('") + 11
const htmlCode = content.substring(start, end)

// Variables needed for evaluation
const EDGE_TTS_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const EDGE_TTS_CHROMIUM_FULL_VERSION = '143.0.3650.75'
const EDGE_TTS_SEC_MS_GEC_VERSION = '1-' + EDGE_TTS_CHROMIUM_FULL_VERSION

// Evaluate just the array expression
const arrCode = htmlCode.substring(12) // remove "var html = "
const arr = eval(arrCode)
const htmlString = arr.join('\n')

// Extract script content
const scriptMatch = htmlString.match(/<script>([\s\S]*)<\/script>/)
if (!scriptMatch) {
  console.log('ERROR: Could not find script in HTML')
  process.exit(1)
}

// Check syntax
try {
  new Function(scriptMatch[1])
  console.log('Script syntax: OK')
} catch (e) {
  console.log('Syntax error:', e.message)
  const lines = scriptMatch[1].split('\n')
  const m = e.stack.match(/<anonymous>:(\d+)/)
  if (m) {
    const lineNum = parseInt(m[1])
    console.log('Around line ' + lineNum + ':')
    for (let i = Math.max(0, lineNum-3); i < Math.min(lines.length, lineNum+2); i++) {
      console.log((i+1) + ': ' + (i === lineNum-1 ? '>>> ' : '    ') + lines[i])
    }
  }
}
