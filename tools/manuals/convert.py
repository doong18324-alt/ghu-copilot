# 기존 학생용 원고(osrc/mXX.md, pandoc 변환본)를 새 원고 형식(md/mXX.md)으로 바꿉니다.
import re, sys, json, subprocess
sys.path.insert(0, '/home/claude/man')
from clean import fix_text

def unesc(t):
    for a, b in [("\\'", "'"), ('\\.', '.'), ('\\(', '('), ('\\)', ')'), ('\\!', '!'), ('\\+', '+'), ('\\=', '='), ('\\"', '"'), ('\\[', '['), ('\\]', ']'), ('\\-', '-'), ('\\~', '~'), ('\\*', '*'), ('\\#', '#'), ('\\_', '_'), ('\\<', '<'), ('\\>', '>'), ('\\|', '|'), ('\\&', '&'), ('\\$', '$'), ('\\@', '@'), ('\\^', '^'), ('\\`', '`')]:
        t = t.replace(a, b)
    return t

POLITE = [
    (r'너는 ', '당신은 '), (r'넌 ', '당신은 '), (r'내가 ', '제가 '), (r'내게 ', '저에게 '), (r'나에게 ', '저에게 '), (r'나는 ', '저는 '), (r'나의 ', '저의 '),
    (r'(?<=[가-힣\)\]])이야(?=[.\s,:]|$)', '입니다'), (r'(?<=[가-힣\)\]])야(?=[.,:]|$)', '입니다'),
    (r'해\s?줘(?=[.:!,\s]|$)', '해 주세요'), (r'(?<=[가-힣])\s?줘(?=[.:!,\s]|$)', ' 주세요'),
    (r'할 것(?=[.:]|$)', '해 주세요'), (r'하지 말 것', '하지 마세요'), (r'(?<=[가-힣])지 말 것', '지 마세요'), (r'말 것(?=[.:]|$)', '마세요'), (r'둘 것', '두세요'), (r'쓸 것', '써 주세요'), (r'줄 것', '주세요'), (r'올 것', '와 주세요'), (r'낼 것', '내 주세요'), (r'될 것(?=[.:]|$)', '되게 해 주세요'), (r'갈 것', '가 주세요'), (r'을 것(?=[.:]|$)', '어 주세요'),
    (r'해라(?=[.!\s]|$)', '해 주세요'), (r'대라(?=[.!\s]|$)', '알려 주세요'), (r'밝혀라', '밝혀 주세요'), (r'답해라', '답해 주세요'), (r'(?<=[가-힣])어라(?=[.!\s]|$)', '어 주세요'), (r'(?<=[가-힣])아라(?=[.!\s]|$)', '아 주세요'),
    (r'(?<=[가-힣])지\?', '나요?'), (r'뭐야\?', '무엇인가요?'), (r'(?<=[가-힣])니\?', '나요?'),
    (r'주세요 주세요', '주세요'), (r'  +', ' '),
]
def polite(t):
    for a, b in POLITE: t = re.sub(a, b, t, flags=re.M)
    return t

PROMPT_HEAD = re.compile(r'프롬프트|Copy & Paste|명령어|템플릿')
def convert(mid):
    src = unesc(open(f'/home/claude/man/osrc/{mid}.md', encoding='utf-8').read())
    src = src.replace('\r', '')
    # 제목 줄의 §BR§ 분리: '# §BR§Chapter 01. 제목§BR§**부제**본문' -> '# 제목' + 본문
    out = []
    for line in src.split('\n'):
        m = re.match(r'^(#+)\s*(.*)$', line)
        if m and '§BR§' in line:
            parts = [p.strip() for p in m.group(2).split('§BR§') if p.strip()]
            if parts:
                out.append(f'{m.group(1)} {parts[0]}')
                rest = ' '.join(parts[1:])
                rest = re.sub(r'^\*\*[^*]{0,40}\*\*', '', rest).strip()
                if rest: out.append(''); out.append(rest)
            continue
        out.append(line.replace('§BR§', ''))
    lines = out
    # 앞부분(제목, 발행 정보, 목차) 잘라내기
    start = 0
    for i, l in enumerate(lines):
        if re.match(r'^# \S', l) and '목차' not in l:
            start = i; break
    lines = lines[start:]
    import difflib
    mtitle = json.loads(subprocess.run(['node','-e',"import('/home/claude/ghu-copilot/src/data/library.js').then(m=>console.log(JSON.stringify(m.MANUALS.find(x=>x.id==='%s').title)))" % mid],capture_output=True,text=True).stdout)
    norm = lambda x: re.sub(r'[^가-힣A-Za-z0-9]', '', x)
    while True:
        hs = [i for i, l in enumerate(lines) if re.match(r'^# \S', l)]
        if len(hs) < 2: break
        h = lines[hs[0]][2:]
        seg = '\n'.join(lines[hs[0]:hs[1]])
        if re.search(r'마스터 코스 \d|가이드북 시리즈|핸드북\]|\[.*(핸드북|워크북|소책자|툴킷)\]', h) or difflib.SequenceMatcher(None, norm(h), norm(mtitle)).ratio() > 0.6 or (len(re.sub(r'\s','',seg)) < 400 and re.search(r'발행|적용 대상', seg)):
            body_len = len(re.sub(r'\s', '', '\n'.join(l for l in lines[hs[0]+1:hs[1]] if not re.search(r'발행|적용 대상|^#', l))))
            if body_len > 150:
                lines = ['# 이 책을 쓰는 방법'] + lines[hs[0]+1:]
                break
            lines = lines[hs[1]:]
        else: break
    lines = [l for l in lines if not re.match(r'^>?\s*\**(발행 및 기획|발행처|발행 및 총괄|적용 대상|발행일|문서 성격|문서 규격|시리즈 단계|대상 학과)\**\s*[:：]', l.strip('> '))]
    # 목차 절 제거
    res, skip = [], False
    for l in lines:
        if re.match(r'^#+ ', l):
            skip = '목차' in l
        if not skip: res.append(l)
    lines = res
    text = '\n'.join(lines)
    # 빈 제목, 시각 자료 제안
    text = re.sub(r'^#+\s*$', '', text, flags=re.M)
    text = re.sub(r'^>?\s*\**\[시각 자료 제안[^\n]*\n', '', text, flags=re.M)
    text = re.sub(r'^>?\s*-?\s*\[화면 시각 자료[^\n]*\n', '', text, flags=re.M)
    # 블록 단위 처리
    blocks = re.split(r'\n\s*\n', text)
    new = []
    last_head = ''
    for b in blocks:
        s = b.strip()
        if not s: continue
        if s.startswith('#'):
            h = re.match(r'^(#+)\s*(.*)', s.split('\n')[0])
            lvl, title = len(h.group(1)), h.group(2).strip().strip('*').strip()
            title = re.sub(r'^(Chapter|Module|Part|Section|Vol\.?|STEP|Step)\s*0?\d+[.:]?\s*', '', title)
            title = re.sub(r'^제\s*\d+\s*장[.:]?\s*', '', title)
            title = title.replace('실제 AI 출력 결과 예시', '기대하는 결과의 모습').replace('[Copy & Paste 실전 프롬프트]', '복사해서 쓰는 프롬프트')
            title = re.sub(r'^\[([^\]]{1,20})\]\s*', '', title).strip()
            title = title.replace('완성도 200%를 만드는', '완성도를 높이는').replace('200%', '')
            lvl = min(max(lvl, 1), 3)
            last_head = title
            new.append('#' * lvl + ' ' + fix_text(title))
            rest = '\n'.join(s.split('\n')[1:]).strip()
            if rest: new.append(rest)
            continue
        if s.startswith('>'):
            body = re.sub(r'^>\s?', '', s, flags=re.M)
            first = body.strip().split('\n')[0]
            if '🔍' in first and re.search(r'실제 (임상 사례|대학병원 합격|대학가 적발)', first):
                continue  # 확인되지 않은 실제 사례는 뺍니다
            lab = re.match(r'^\s*\**\[([^\]]{2,60})\]\**\\?\s*$', first)
            is_prompt = bool(re.search(r'너는|해 줘|해줘|줘\.|할 것|당신은|해 주세요', body)) and (lab or PROMPT_HEAD.search(last_head))
            if is_prompt:
                label = lab.group(1) if lab else '복사해서 쓰는 프롬프트'
                if lab: body = '\n'.join(body.split('\n')[1:])
                body = re.sub(r'\\\s*$', '', body, flags=re.M)
                body = polite(body).strip()
                new.append('```prompt ' + fix_text(label) + '\n' + body + '\n```')
                continue
            body = re.sub(r'\\\s*$', '', body, flags=re.M)
            body = body.replace('🔍 실제 분해 사례', '분해 예시').replace('🔍 실제 자소서 비교', '자소서 비교 예시').replace('🔍', '')
            new.append('\n'.join('> ' + x if x.strip() else '>' for x in body.split('\n')))
            continue
        # 일반 문단: [Role]로 시작하는 프롬프트 문단
        if re.match(r'^\[(Role|역할)', s) or (PROMPT_HEAD.search(last_head) and re.search(r'너는|해 줘|줘\.', s) and not s.startswith('<') and not s.startswith('|') and not s.startswith('-')):
            if new and new[-1].startswith('```prompt') and new[-1].endswith('```'):
                new[-1] = new[-1][:-3].rstrip() + '\n\n' + polite(re.sub(r'\\\s*$', '', s, flags=re.M)) + '\n```'
            else:
                new.append('```prompt 복사해서 쓰는 프롬프트\n' + polite(re.sub(r'\\\s*$', '', s, flags=re.M)) + '\n```')
            continue
        _last = new[-1][:-3].rstrip().split('\n')[-1] if new and new[-1].startswith('```prompt') else ''
        prev_colon = _last.endswith(':') or (bool(re.match(r'^\d+\.\s', _last)) and bool(re.match(r'^\d+\.', s)))
        if new and new[-1].startswith('```prompt') and re.match(r'^(\[|-|\d+\.|\*)', s) and not s.startswith('<') and not s.startswith('|') and len(s) < 600 and (prev_colon or re.search(r'줘|할 것|주세요|\[', s)):
            new[-1] = new[-1][:-3].rstrip() + '\n' + polite(re.sub(r'\\\s*$', '', s, flags=re.M)) + '\n```'
            continue
        s = re.sub(r'\\\s*$', '', s, flags=re.M)
        new.append(s)
    text = '\n\n'.join(new)
    # 표 안 프롬프트 문장도 존댓말로
    def tpol(m): return polite(m.group(0))
    text = re.sub(r'"[^"\n]{8,400}?(줘|할 것|해라|야\.)[^"\n]{0,200}"', tpol, text)
    def cellpol(m):
        c = m.group(0)
        return polite(c) if re.search(r'너는|해 ?줘|줘\.|할 것', c) else c
    text = re.sub(r'<t[hd][^>]*>.*?</t[hd]>', cellpol, text, flags=re.S)
    # 텍스트 전체 정리
    text = '\n'.join(fix_text(l) if not l.startswith('```') else l for l in text.split('\n'))
    text = re.sub(r'\s*\|\s*전국 모의고사 평균 정답률:\s*\**[\d.]+%\**', '', text)
    text = text.replace('국가고시 빈출 킬러 대표 문항', '대표 유형 연습 문항(새로 만든 문항)').replace('빈출 킬러 대표 문항', '대표 유형 연습 문항')
    text = text.replace('—', ', ')
    # 제목 정리: 빈 제목 제거, 앞쪽의 책 제목·구호 제목 제거, 제목 단계 맞추기
    text = re.sub(r'^#+[ \t]*$\n?', '', text, flags=re.M)
    heads = [m for m in re.finditer(r'^(#+) (.+)$', text, re.M)][:4]
    drop = []
    for m in heads:
        h = m.group(2).strip()
        if difflib.SequenceMatcher(None, norm(h), norm(mtitle)).ratio() > 0.55 or re.search(r'가이드북.*(시리즈|통합|\d+주차)|가이드북: ?\d주차|마스터 코스$|로드맵 \d단계 가이드', h):
            drop.append((m.start(), m.end(), None))
        elif h.startswith('"') and h.endswith('"'):
            drop.append((m.start(), m.end(), '> **' + h.strip('"') + '**'))
    for a, b, rep in reversed(drop):
        text = text[:a] + (rep or '') + text[b:]
    levels = [len(m.group(1)) for m in re.finditer(r'^(#+) ', text, re.M)]
    if levels and levels.count(1) <= 1 and levels.count(2) >= 3:
        text = re.sub(r'^(#{2,}) ', lambda m: '#' * (len(m.group(1)) - 1) + ' ', text, flags=re.M)
        levels = [len(m.group(1)) for m in re.finditer(r'^(#+) ', text, re.M)]
    if levels and min(levels) > 1:
        k = min(levels) - 1
        text = re.sub(r'^(#+) ', lambda m: '#' * max(1, len(m.group(1)) - k) + ' ', text, flags=re.M)
    text = re.sub(r'^#{4,} ', '### ', text, flags=re.M)
    first_h1 = re.search(r'^# ', text, re.M)
    if first_h1:
        text = re.sub(r'^## ', '# ', text[:first_h1.start()], flags=re.M) + text[first_h1.start():]
    text = re.sub(r'^>[ \t]*\n(?=\s*\n|#)', '', text, flags=re.M)
    text = re.sub(r'\n{3,}', '\n\n', text).strip() + '\n'
    return text

if __name__ == '__main__':
    for mid in sys.argv[1:]:
        t = convert(mid)
        open(f'/home/claude/man/body_{mid}.md', 'w').write(t)
        print(mid, len(re.sub(r'\s', '', t)))
