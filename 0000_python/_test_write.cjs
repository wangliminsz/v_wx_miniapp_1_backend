// Verify the round-trip is actually correct by writing to a file
const chinese = '黑色平光环氧防腐粉末涂料'
const pyGbk = [
  0xBA, 0xDA, 0xC9, 0xAB, 0xC6, 0xBD, 0xB9, 0xE2,
  0xBB, 0xB7, 0xD1, 0xF5, 0xB7, 0xC0, 0xB8, 0xAF,
  0xB7, 0xDB, 0xC4, 0xA9, 0xCD, 0xBF, 0xC1, 0xCF
]
const bytes = new Uint8Array(pyGbk)
const decoded = new TextDecoder('gb18030').decode(bytes)
const fs = require('fs')
fs.writeFileSync('decoded_gbk.txt', decoded, 'utf-8')
console.log('Wrote decoded result to decoded_gbk.txt')
console.log('Expected: ' + chinese)
console.log('Got     : ' + decoded)
console.log('Match?  : ' + (decoded === chinese))

// Also: write the original 黑色 in UTF-8, then re-encode as gb18030
// and verify the bytes are the SAME
const utf8Bytes = new TextEncoder().encode(chinese)
console.log()
console.log('Original UTF-8 bytes :', Array.from(utf8Bytes).map(b => b.toString(16)).join(' '))
console.log('GBK bytes from Python:', pyGbk.map(b => b.toString(16).padStart(2, '0')).join(' '))
