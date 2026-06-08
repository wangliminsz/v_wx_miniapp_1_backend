// Build the GBK bytes, dump them, then decode with both labels
const chinese = '黑色平光环氧防腐粉末涂料'
const pyGbk = [
  0xBA, 0xDA, 0xC9, 0xAB, 0xC6, 0xBD, 0xB9, 0xE2,
  0xBB, 0xB7, 0xD1, 0xF5, 0xB7, 0xC0, 0xB8, 0xAF,
  0xB7, 0xDB, 0xC4, 0xA9, 0xCD, 0xBF, 0xC1, 0xCF
]
const bytes = new Uint8Array(pyGbk)
console.log('bytes hex:', Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(' '))
console.log('bytes length:', bytes.length, '(expected:', 24, 'for 12 Chinese chars in GBK)')

for (const enc of ['utf-8', 'gbk', 'gb18030', 'gb2312']) {
  try {
    const t = new TextDecoder(enc).decode(bytes)
    console.log(enc.padEnd(10), '->', JSON.stringify(t))
  } catch (e) {
    console.log(enc.padEnd(10), '-> ERROR:', e.message)
  }
}

// And encode a single char to see if Node's view of GBK matches Python's
console.log()
console.log('Round-trip from a known good char 黑色:')
for (const enc of ['gbk', 'gb18030']) {
  try {
    const t = new TextDecoder(enc).decode(new Uint8Array([0xBA, 0xDA]))
    console.log('  ' + enc + ' decode of [BA DA] =', JSON.stringify(t),
                'U+' + t.codePointAt(0).toString(16).toUpperCase())
  } catch (e) {}
}
console.log('  expected: ' + JSON.stringify('黑') + ' U+9ED1')
