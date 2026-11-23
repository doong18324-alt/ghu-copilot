// 이력서를 워드(.docx) 파일로 만듭니다. 화면과 같은 구성(왼쪽 색 띠 + 오른쪽 내용)을 표로 짜서 워드에서 바로 고칠 수 있습니다.
import {
  AlignmentType, BorderStyle, Document, ImageRun, LeaderType, Packer, Paragraph, ShadingType, Table, TableCell, TableLayoutType,
  TableRow, TabStopType, TextRun, VerticalAlign, WidthType,
} from 'docx'

const FONT = '맑은 고딕'
const LEFT = 3100 // 왼쪽 띠 너비(1/20pt)
const RIGHT = 8806
const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const NO_BORDERS = { top: NONE, bottom: NONE, left: NONE, right: NONE }

const run = (text, opt = {}) => new TextRun({ text, font: FONT, ...opt })

function labelCell(color, title, en) {
  return new TableCell({
    width: { size: LEFT, type: WidthType.DXA },
    shading: { type: ShadingType.CLEAR, fill: color, color: 'auto' },
    borders: NO_BORDERS,
    margins: { top: 220, bottom: 220, left: 200, right: 260 },
    children: title
      ? [
          new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 20 }, children: [run(title, { bold: true, size: 26, color: 'FFFFFF' })] }),
          new Paragraph({ alignment: AlignmentType.RIGHT, children: [run(en, { size: 15, color: 'C9D3F0' })] }),
        ]
      : [new Paragraph({ children: [] })],
  })
}

function bodyCell(children, topLine = true) {
  return new TableCell({
    width: { size: RIGHT, type: WidthType.DXA },
    borders: { ...NO_BORDERS, top: topLine ? { style: BorderStyle.SINGLE, size: 6, color: 'C7CDE4' } : NONE },
    margins: { top: 220, bottom: 220, left: 420, right: 420 },
    verticalAlign: VerticalAlign.TOP,
    children: children.length ? children : [new Paragraph({ children: [] })],
  })
}

// 제목 ......... 기간 형태의 한 줄과, 그 아래 작은 설명
function entry(title, detail, period) {
  const out = [
    new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: RIGHT - 900, leader: LeaderType.DOT }],
      spacing: { before: 60, after: detail ? 0 : 100 },
      children: [run(title, { size: 22, bold: true, color: '222222' }), ...(period ? [run('\t' + period, { size: 19, color: '333333' })] : [])],
    }),
  ]
  if (detail) out.push(new Paragraph({ spacing: { after: 100 }, children: [run(detail, { size: 17, color: '8A8A8A' })] }))
  return out
}

const period = (from, to) => [from, to].filter(Boolean).join(' ~ ')

export async function buildResumeDocx(data, photoPng) {
  const color = (data.color || '#1D3A8A').replace('#', '')
  const nameLines = [
    ...(data.tagline ? [new Paragraph({ spacing: { after: 40 }, children: [run(data.tagline, { size: 24, color })] })] : []),
    new Paragraph({ children: [run(data.name || '[이름]', { size: 56, bold: true, color })] }),
  ]
  // 사진이 있으면 왼쪽에 원형 사진, 오른쪽에 소개와 이름을 나란히 둡니다.
  const head = photoPng
    ? [new Table({
        layout: TableLayoutType.FIXED, width: { size: RIGHT - 840, type: WidthType.DXA }, columnWidths: [2300, RIGHT - 840 - 2300],
        borders: { ...NO_BORDERS, insideHorizontal: NONE, insideVertical: NONE },
        rows: [new TableRow({ children: [
          new TableCell({ width: { size: 2300, type: WidthType.DXA }, borders: NO_BORDERS, verticalAlign: VerticalAlign.CENTER, children: [new Paragraph({ children: [new ImageRun({ type: 'png', data: photoPng, transformation: { width: 128, height: 128 } })] })] }),
          new TableCell({ width: { size: RIGHT - 840 - 2300, type: WidthType.DXA }, borders: NO_BORDERS, verticalAlign: VerticalAlign.CENTER, margins: { left: 200 }, children: nameLines }),
        ] })],
      }), new Paragraph({ children: [] })]
    : nameLines

  const basics = [
    data.birth && `생년월일  ${data.birth}`,
    [data.phone, data.email].filter(Boolean).join('  |  '),
    data.address && `주소  ${data.address}`,
  ].filter(Boolean).map(t => new Paragraph({ spacing: { after: 80 }, children: [run(t, { size: 21, color: '333333' })] }))

  const sections = [
    ['기본사항', 'Personal Information', basics],
    ['학력사항', 'Education', data.education.flatMap(e => entry(e.school, e.detail, period(e.from, e.to)))],
    ['보유자격증', 'License', data.licenses.flatMap(l => entry(l.name, '', l.date))],
    ['활동·경험', 'Experience', data.activities.flatMap(a => entry(a.title, a.detail, period(a.from, a.to)))],
    ['기술사항', 'Skills', data.skills.map(s => new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: RIGHT - 900, leader: LeaderType.DOT }],
      spacing: { after: 80 },
      children: [run(s.name, { size: 22, bold: true, color: '222222' }), run('\t' + '●'.repeat(s.level) + '○'.repeat(5 - s.level), { size: 19, color })],
    }))],
  ].filter(([, , children]) => children.length)

  const rows = [
    new TableRow({ children: [labelCell(color), new TableCell({ width: { size: RIGHT, type: WidthType.DXA }, borders: NO_BORDERS, margins: { top: 620, bottom: 200, left: 420, right: 420 }, children: head })] }),
    ...sections.map(([title, en, children]) => new TableRow({ children: [labelCell(color, title, en), bodyCell(children)] })),
  ]

  const doc = new Document({
    creator: 'GHU 바이탈',
    title: `${data.name || '이력서'} 이력서`,
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
      children: [new Table({ layout: TableLayoutType.FIXED, width: { size: LEFT + RIGHT, type: WidthType.DXA }, columnWidths: [LEFT, RIGHT], borders: { ...NO_BORDERS, insideHorizontal: NONE, insideVertical: NONE }, rows })],
    }],
  })
  return Packer.toBlob(doc)
}
