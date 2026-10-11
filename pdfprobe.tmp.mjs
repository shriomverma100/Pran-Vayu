import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { readFileSync } from 'node:fs'
const [file, page] = [process.argv[2], +process.argv[3]]
const doc = await getDocument({ data: new Uint8Array(readFileSync(file)), verbosity: 0 }).promise
console.log('pages', doc.numPages)
const p = await doc.getPage(page)
const tc = await p.getTextContent()
console.log(tc.items.map(i => i.str).join(' ').replace(/\s+/g, ' ').slice(0, 1500))
