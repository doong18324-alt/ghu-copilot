# 새로 쓴 마크다운 원고(md/mXX.md)를 표지·본문 HTML로 만듭니다.
# 원고 규칙: 첫머리 YAML(summary, who, tools), '# 장', '## 절', '### 소절',
# ```prompt 라벨 ... ``` 은 프롬프트 상자, '> ' 는 참고 상자, '!!! 라벨' 다음 줄들은 점검 상자.
import re, json, sys, subprocess, html as H
sys.path.insert(0, '/home/claude/man')
import build
from build import M, head_html, CSS

def md_to_html(md):
    blocks = []
    def keep(html):
        blocks.append(html); return f'\n\nXXBLOCK{len(blocks)-1}XX\n\n'
    def prompt(m):
        label = m.group(1).strip() or '복사해서 쓰는 프롬프트'
        body = m.group(2).strip('\n')
        paras = ''.join(f'<p>{H.escape(p)}</p>' for p in re.split(r'\n\s*\n', body))
        return keep(f'<div class="prompt"><div class="plab">{H.escape(label)}</div>{paras}</div>')
    md = re.sub(r'```prompt[ \t]*([^\n]*)\n(.*?)\n```', prompt, md, flags=re.S)
    def check(m):
        label = m.group(1).strip()
        items = [re.sub(r'^[-*]\s*', '', x).strip() for x in m.group(2).strip().split('\n') if x.strip()]
        lis = ''.join(f'<li>{inline(x)}</li>' for x in items)
        return keep(f'<div class="check"><div class="clab">{H.escape(label)}</div><ul>{lis}</ul></div>')
    md = re.sub(r'^!!! ([^\n]+)\n((?:[-*] [^\n]+\n?)+)', check, md, flags=re.M)
    html = subprocess.run(['pandoc', '-f', 'markdown-auto_identifiers+pipe_tables', '-t', 'html'], input=md, capture_output=True, text=True).stdout
    for i, b in enumerate(blocks):
        html = re.sub(rf'<p>XXBLOCK{i}XX</p>', lambda _: b, html)
    return html

def inline(x):
    x = H.escape(x)
    return re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', x)

def run(mid):
    m = next(x for x in M['M'] if x['id'] == mid)
    src = open(f'/home/claude/man/md/{mid}.md', encoding='utf-8').read()
    fm, body = re.match(r'---\n(.*?)\n---\n(.*)', src, re.S).groups()
    meta = {}
    for line in fm.split('\n'):
        k, _, v = line.partition(':'); meta[k.strip()] = v.strip()
    assert '—' not in body, f'{mid}: em-dash'
    html = md_to_html(body)
    # 장 번호
    n = [0]
    def h1(mm):
        n[0] += 1
        cls = ' class="next"' if n[0] > 1 else ''
        return f'<h1{cls}><i>{n[0]:02d}</i> {mm.group(1)}</h1>'
    html = re.sub(r'<h1>(.*?)</h1>', h1, html)
    info = {'대상': meta.get('who', '')}
    tools = [t.strip() for t in meta.get('tools', '').split(',') if t.strip()]
    open(f'/home/claude/man/out/{mid}_head.html', 'w').write(head_html(m, info, [meta['summary']], tools))
    open(f'/home/claude/man/out/{mid}_body.html', 'w').write(f'<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>{CSS}</style></head><body class="bodydoc">{html}</body></html>')
    print(mid, len(re.sub(r'\s', '', re.sub(r'<[^>]+>', '', html))), 'chars')

if __name__ == '__main__':
    for mid in sys.argv[1:]: run(mid)
