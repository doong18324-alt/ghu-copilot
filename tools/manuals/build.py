import re, json, subprocess, html as H
from clean import clean, meta, mark_quotes, fix_text
M = json.loads(subprocess.run(['node', '-e', "import('/home/claude/ghu-copilot/src/data/library.js').then(m=>console.log(JSON.stringify({M:m.MANUALS,G:m.MANUAL_GROUPS})))"], capture_output=True, text=True).stdout)
GROUPS = {g[0]: g for g in M['G']}
ROLE = {'student': '학생', 'faculty': '교수', 'staff': '직원'}
OR = '#F05A3C'
TOOLS = ['ChatGPT', 'Gemini', 'Claude', 'NotebookLM', '클로바노트', 'Copilot', 'Perplexity', 'Canva', '감마', 'Gamma', '셀프뷰']
LINK = {
  'AI 실전 프롬프트 가이드북': '프롬프트 라이브러리 0-1, 1-1~1-8', 'AI 자기주도학습': '프롬프트 라이브러리 1-1~1-3, 국시 문제은행', '자기주도학습 마스터 코스': '국시 문제은행, 성찰일지 코치, 개념 쉽게 풀기',
  '교수자 AI 활용 매뉴얼': '프롬프트 라이브러리 2-1~2-9, 평가 도우미, 문항 분석기', '직원 AI 활용 매뉴얼': '프롬프트 라이브러리 3-1~3-12, 보도자료·회의록 앱, 민원 응대 앱',
  'X × AI 전공융합': '프롬프트 라이브러리 4-1~4-7', '전공수업 AI 설계지원': '프롬프트 라이브러리 2-1, 0-3', 'AI 윤리·보안': '프롬프트 라이브러리 0-2, 개인정보 가명처리기', 'AI의 이해와 활용': '프롬프트 라이브러리 0-1~0-3',
}
CSS = open('/home/claude/man/manual.css').read()

def num_in_group(m):
    same = [x for x in M['M'] if x['group'] == m['group']]
    return f"{same.index(m) + 1:02d}"

def head_html(m, info, summary, tools):
    title = fix_text(m['title'])
    who = info.get('대상') or info.get('적용 대상') or info.get('대상 학과') or ', '.join(ROLE[r] for r in m['roles'])
    series = m['group']
    no = num_in_group(m)
    # 표지 제목: 길면 두세 줄로, 가운데 줄을 주황으로
    words = re.split(r'(?<=[ ])', re.sub(r'\s*\((feat\.[^)]*)\)', '', title))
    lines, cur = [], ''
    for w in words:
        if len(cur + w) > 11 and cur: lines.append(cur.strip()); cur = w
        else: cur += w
    if cur.strip(): lines.append(cur.strip())
    if len(lines) > 4: lines = [' '.join(lines[:len(lines)//2]), ' '.join(lines[len(lines)//2:])]
    hi = 1 if len(lines) >= 3 else len(lines) - 1
    h1 = ''.join(f'<em>{H.escape(l)}</em>' if i == hi else f'<span>{H.escape(l)}</span>' for i, l in enumerate(lines))
    meta_rows = [('대상', who), ('분류', f"{series} {no}"), ('쓸 수 있는 도구', ', '.join(tools) or '생성형 AI 도구 전반'), ('바이탈에서 함께 쓰기', LINK.get(series, '프롬프트 라이브러리'))]
    dl = ''.join(f'<div><dt>{a}</dt><dd>{H.escape(b)}</dd></div>' for a, b in meta_rows)
    summ = ''.join(f'<p>{H.escape(x)}</p>' for x in summary[:2])
    return f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>@page {{ size: A4; margin: 0 }} {CSS}</style></head><body>
<section class="page cover"><div class="vl"></div><div class="hl"></div>
<div class="no">{H.escape(series)}<b>{no}</b></div><div class="who">광주보건대학교 AI대학혁신본부</div>
<h1>{h1}</h1><div class="org">2026. 11. 개정 · GHU 바이탈 AI 활용 매뉴얼</div></section>
<section class="page open"><div class="blk"><span class="k">바이탈에서 찾기</span><span>GHU 바이탈 &gt; AI 활용 자료 &gt; AI 활용 매뉴얼</span></div><div class="vl"></div>
<div class="chap">{H.escape(series)} {no}</div><h2>{H.escape(title)}</h2>
<div class="summary">{summ}</div><dl class="meta">{dl}</dl></section></body></html>'''

def body_html(m, s):
    return f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>{CSS}</style></head><body class="bodydoc">{re.sub(r'\s*\|\s*전국 모의고사 평균 정답률:\s*(?:<strong>)?[\d.]+%(?:</strong>)?', '', str(s))}</body></html>'''

def run(m):
    src = f"/home/claude/man/{m['id']}.html"
    s = clean(src)
    info, intro = meta(s, m['title'])
    summary = []
    h = s.find(lambda t: t.name in ('h1', 'h2') and '핵심 요약' in t.get_text())
    if h:
        nxt = h.find_next_sibling()
        if nxt is not None and nxt.name == 'p': summary.append(nxt.get_text(' ', strip=True)); nxt.decompose()
        h.decompose()
    if not summary:
        intro2 = [x for x in intro if len(x) > 20 and not x.startswith('[')]
        summary = intro2[:1]
        if not summary:
            p = s.find('p')
            if p and len(p.get_text()) > 30 and not p.find_parent('div'): summary = [p.get_text(' ', strip=True)[:260]]
    if not summary or not summary[0].strip():
        for p in s.find_all('p')[:8]:
            t = p.get_text(' ', strip=True)
            if len(t) > 30 and not p.find_parent(['div', 'table']): summary = [t]; break
    OVR = {'m52': 'AI 융합 수업설계 1:1 컨설팅을 신청할 때 쓰는 양식입니다. 워드 양식도 함께 내려받을 수 있습니다.', 'm53': 'X × AI 전공융합 수업의 교안을 쓰는 표준 양식입니다. 워드 양식도 함께 내려받을 수 있습니다.', 'm54': '수업과 실습에서 AI를 정직하고 안전하게 쓰겠다는 서약서와 과제 출처 표기 양식입니다. 워드 양식도 함께 내려받을 수 있습니다.'}
    if m['id'] in OVR: summary = [OVR[m['id']]]
    summary = [re.sub(r'^(부제|슬로건)\s*:\s*', '', fix_text(x)).strip(' "“”') for x in summary]
    summary = [x if len(x) < 230 else (x[:230].rsplit('.', 1)[0] + '.' if '.' in x[:230] else x[:228] + '…') for x in summary]
    mark_quotes(s)
    text = s.get_text(' ')
    tools = [t for t in TOOLS if t in text][:5]
    # 장 제목 번호 꾸미기
    for h1 in s.find_all('h1'):
        sub = h1.find('span', class_='sub'); sub = sub.extract() if sub else None
        t = h1.get_text(' ', strip=True)
        mm = re.match(r'^(Chapter\s*\d+|Module\s*\d+|Part\s*\d+|Section\s*\d+|\d+)\s*[.:]?\s*(.*)', t)
        if mm:
            h1.clear(); n = s.new_tag('i'); n.string = re.sub(r'\D', '', mm.group(1)).zfill(2); h1.append(n); h1.append(' ' + mm.group(2))
        if sub: h1.append(sub)
    long = m['pages'] >= 9
    if long:
        for i, h1 in enumerate(s.find_all('h1')):
            if i: h1['class'] = h1.get('class', []) + ['brk']
    open(f"/home/claude/man/out/{m['id']}_head.html", 'w').write(head_html(m, info, summary, tools))
    open(f"/home/claude/man/out/{m['id']}_body.html", 'w').write(body_html(m, s))
    return {'id': m['id'], 'summary': summary[0] if summary else '', 'tools': tools}

if __name__ == '__main__':
    import sys
    ids = sys.argv[1:] or [x['id'] for x in M['M']]
    res = [run(x) for x in M['M'] if x['id'] in ids]
    json.dump(res, open('/home/claude/man/out/summary.json', 'w'), ensure_ascii=False, indent=1)
    print(len(res))
