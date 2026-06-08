// Run the production readFileAsText logic on the real GBK CSV
// and write the result to a file for Python to verify.
const { readFileSync, writeFileSync } = require('node:fs')

function readFileAsTextFromBytes(bytes, fileName) {
  const len = bytes.length
  let bomEncoding = null
  if (len >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    bomEncoding = 'utf-8'
  } else if (len >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
    bomEncoding = 'utf-16le'
  } else if (len >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
    bomEncoding = 'utf-16be'
  }

  const countRepl = (s) => (s.match(/\uFFFD/g) || []).length
  const tryDecode = (enc) => {
    try { return new TextDecoder(enc).decode(bytes) }
    catch (e) { return null }
  }

  let text
  let chose
  if (bomEncoding) {
    text = tryDecode(bomEncoding) || tryDecode('utf-8') || ''
    chose = bomEncoding
  } else {
    const utf8 = tryDecode('utf-8')
    const utf8Repl = utf8 ? countRepl(utf8) : Infinity
    const gb = tryDecode('gb18030')
    const gbRepl = gb ? countRepl(gb) : Infinity
    if (gb && gbRepl < utf8Repl) { text = gb; chose = 'gb18030' }
    else if (utf8)             { text = utf8; chose = 'utf-8' }
    else                        { text = new TextDecoder('utf-8').decode(bytes); chose = 'utf-8(fb)' }
  }
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
  console.log(`[readFileAsText] file=${fileName}  size=${len}B  chose=${chose}`)
  return text
}

const path = 'd:\\wx_mini_backend_dev_dev_dev\\0000_python\\_test_real_gbk.csv'
const bytes = readFileSync(path)
const text = readFileAsTextFromBytes(new Uint8Array(bytes), '_test_real_gbk.csv')
writeFileSync('d:\\wx_mini_backend_dev_dev_dev\\0000_python\\_decoded_real.txt', text, 'utf-8')
console.log('Wrote decoded result to _decoded_real.txt')
console.log('Decoded first 80 chars:', JSON.stringify(text.slice(0, 80)))
