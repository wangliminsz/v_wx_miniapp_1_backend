// Replicate the production logic and verify with correct GBK bytes
// (from Python's 'gbk' encoder: 0xBA,0xDA,0xC9,0xAB,0xC6,0xBD,0xB9,0xE2,
// 0xBB,0xB7,0xD1,0xF5,0xB7,0xC0,0xB8,0xAF,0xB7,0xDB,0xC4,0xA9,0xCD,0xBF,0xC1,0xCF)

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
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
    chose = bomEncoding
  } else {
    const utf8 = tryDecode('utf-8')
    const utf8Repl = utf8 ? countRepl(utf8) : Infinity
    const gb = tryDecode('gb18030')
    const gbRepl = gb ? countRepl(gb) : Infinity
    if (gb && gbRepl < utf8Repl) { text = gb; chose = 'gb18030' }
    else if (utf8)             { text = utf8; chose = 'utf-8' }
    else                        { text = new TextDecoder('utf-8').decode(bytes); chose = 'utf-8(fb)' }
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
  }

  console.log(`[readFileAsText] file=${fileName}  size=${len}B  chose=${chose}`)
  return text
}

// Test 1: UTF-8 + BOM
{
  const bom = Buffer.from([0xEF, 0xBB, 0xBF])
  const body = Buffer.from('productName\n白色砂纹聚酯型粉末涂料\n', 'utf-8')
  const text = readFileAsTextFromBytes(Buffer.concat([bom, body]), 'utf8-bom.csv')
  console.log('  UTF-8 + BOM  ->', JSON.stringify(text))
  console.log('    contains 白色? ', text.includes('白色'))
  console.log('    contains 涂料? ', text.includes('涂料'))
}

// Test 2: UTF-8 no BOM
{
  const bytes = Buffer.from('productName\n白色砂纹聚酯型粉末涂料\n', 'utf-8')
  const text = readFileAsTextFromBytes(bytes, 'utf8-nobom.csv')
  console.log('  UTF-8 no BOM ->', JSON.stringify(text))
  console.log('    contains 白色? ', text.includes('白色'))
  console.log('    contains 涂料? ', text.includes('涂料'))
}

// Test 3: GBK no BOM (correct bytes from Python)
{
  const line1 = 'productSlug,variantSku,variantName,variantPrice,taxCategoryName,variantFacetValues,stockLevels,variantAssets,variantFeaturedAsset,options\n'
  const ascii = '"he1086l-g20-002","HE1086L-G20-002","[HE1086L-G20-002] '
  const gbkChinese = Buffer.from([
    0xBA, 0xDA, 0xC9, 0xAB, 0xC6, 0xBD, 0xB9, 0xE2,
    0xBB, 0xB7, 0xD1, 0xF5, 0xB7, 0xC0, 0xB8, 0xAF,
    0xB7, 0xDB, 0xC4, 0xA9, 0xCD, 0xBF, 0xC1, 0xCF
  ])
  const tail = '","29","Zero Tax","","HE1086L-G20-002: 1000","","","spec-package:20kg"\n'
  const bytes = Buffer.concat([Buffer.from(line1, 'utf-8'), Buffer.from(ascii, 'utf-8'), gbkChinese, Buffer.from(tail, 'utf-8')])
  const text = readFileAsTextFromBytes(bytes, 'gbk-nobom.csv')
  console.log('  GBK  no BOM ->', JSON.stringify(text))
  console.log('    contains 黑色? ', text.includes('黑色'))
  console.log('    contains 涂料? ', text.includes('涂料'))
}

// Test 4: pure ASCII
{
  const text = readFileAsTextFromBytes(Buffer.from('a,b,c\n1,2,3\n', 'utf-8'), 'ascii.csv')
  console.log('  ASCII        ->', JSON.stringify(text))
}
