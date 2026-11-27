import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs'
import { execFileSync } from 'child_process'
import fs from 'fs'
const ids = process.argv.slice(2)
const b = await chromium.launch(); const pg = await b.newPage()
const titles = JSON.parse(fs.readFileSync('/home/claude/man/out/titles.json', 'utf8'))
for (const id of ids) {
  const o = '/home/claude/man/out/'
  await pg.goto(`file://${o}${id}_head.html`, { waitUntil: 'load' })
  await pg.pdf({ path: `${o}${id}_head.pdf`, format: 'A4', printBackground: true })
  await pg.goto(`file://${o}${id}_body.html`, { waitUntil: 'load' })
  const t = (titles[id] || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
  await pg.pdf({ path: `${o}${id}_body.pdf`, format: 'A4', printBackground: true, displayHeaderFooter: true,
    margin: { top: '20mm', bottom: '20mm', left: '24mm', right: '20mm' },
    headerTemplate: `<div style="width:100%;font-family:'Noto Sans CJK KR';font-size:7px;color:#999;padding:0 20mm 0 24mm;display:flex;justify-content:space-between"><span>광주보건대학교 AI대학혁신본부</span><span>${t}</span></div>`,
    footerTemplate: `<div style="width:100%;font-family:'Noto Sans CJK KR';font-size:8px;padding:0 20mm 0 24mm;display:flex;justify-content:flex-end"><span style="color:#F05A3C;font-weight:700" class="pageNumber"></span></div>` })
  execFileSync('qpdf', ['--empty', '--pages', `${o}${id}_head.pdf`, `${o}${id}_body.pdf`, '--', `${o}${id}.pdf`])
  console.log(id)
}
await b.close()
