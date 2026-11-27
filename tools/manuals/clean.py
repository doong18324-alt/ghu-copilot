import re, json, glob
from bs4 import BeautifulSoup, NavigableString

REPL = [
  (r'과제와 학습 효율을 200% 높이는', '과제와 학습 효율을 높이는'),
  (r'퀄리티는 200% 끌어올릴', '완성도는 높일'), (r'200% ', ''), (r'200%', ''),
  (r'10분 만에', '짧은 시간에'), (r'2배, 3배로 폭발합니다', '눈에 띄게 높아집니다'), (r'90% 줄이는', '줄이는'),
  (r'완벽하게 압도하기', '확실히 준비하기'), (r'완벽 가이드', '실전 가이드'), (r'완벽 패스', '통과하기'), (r'완벽 탈출', '벗어나기'),
  (r'완벽 활용법', '활용법'), (r'완벽 보완', '보완'), (r'완벽히 마스터했', '익혔'), (r'완벽히 마스터', '익히'), (r'완벽한 프로페셔널', '믿음직한 전문가'),
  (r'완벽히|완벽하게', '충분히'), (r'완벽한', '충실한'),
  (r'\(셀프뷰\) 100% 활용', '(셀프뷰)를 제대로 활용'), (r"'셀프뷰\(SelfView\)'의 100% 활용법", "'셀프뷰(SelfView)' 활용법"),
  (r'국시 합격률 100% 달성', '국시 합격률 높이기'), (r'네, 100% 가능합니다', '네, 가능합니다'), (r'100% 출제되는', '자주 나오는'), (r'AI 100% 활용법', 'AI 활용법'),
  (r'압도적으로', '훨씬'), (r'압도적인 분량', '방대한 분량'), (r'압도적 차별점', '뚜렷한 차별점'),
  (r'획기적으로', '크게'), (r'획기적인', '새로운'),
  (r'AI융학교육혁신원', 'AI융합교육혁신원'),
  (r'AI\s?대학혁신본부 홈페이지\s*>\s*AI 활용 허브\s*>\s*[^<\n|]*', 'GHU 바이탈 > AI 활용 자료 > AI 활용 매뉴얼'),
  (r'AI\s?대학혁신본부 홈페이지\s*>\s*AI 융합교육\s*>\s*[^<\n|]*', 'GHU 바이탈 > AI 활용 자료 > AI 활용 매뉴얼'),
  (r'AI\s?대학혁신본부 홈페이지\s*>[^<\n|]*', 'GHU 바이탈 > AI 활용 자료 > AI 활용 매뉴얼'),
  (r'출제 통계:\s*', '출제 특성: '), (r'\s*\|\s*전국 모의고사 평균 정답률:\s*[\d.]+%', ''), (r'국가고시 및 전국 모의고사에서 수험생 정답률 40~50% 미만을 기록한 ', '국가시험에서 자주 틀리는 '),
  (r'10초 만에', '빠르게'), (r'반복 잡무 90% 감축: ', ''), (r'\s*—\s*', ', '), (r'가장 친절하고 강력한', '친절한'),
  ('❌', '✕'), ('⭕', '○'), ('➔', '→'), ('⚠️', '주의:'), ('⚠', '주의:'),
]
EMOJI = re.compile('[\U0001F300-\U0001FAFF☀-⛿✀-➿️-‍]')

def fix_text(t):
    for a, b in REPL: t = re.sub(a, b, t)
    t = EMOJI.sub('', t)
    return t

PROMPT_START = re.compile(r'^(?:프롬프트\s*명령어|\[?프롬프트\]?\s*:?)\s*')
MARK = re.compile(r'^(\[(?:[^\]]{0,12})?프롬프트[^\]]*\]|프롬프트 예시)\s*:?')
ROLE = re.compile(r'(당신은|너는)\s')

def clean(path):
    raw = open(path, encoding='utf-8').read()
    raw = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', raw)
    s = BeautifulSoup(raw, 'html.parser')
    # 원고의 구분선 자리(§BR§): 제목 뒤에 붙은 부제·본문을 떼어 냅니다
    for h in s.find_all(['h1', 'h2', 'h3', 'h4']):
        t = h.get_text()
        if '§BR§' not in t: continue
        parts = [x.strip() for x in t.split('§BR§') if x.strip()]
        if not parts: h.decompose(); continue
        h.clear(); h.append(parts[0])
        after = h
        for x in parts[1:]:
            if len(x) < 45 and ('/' in x or '&' in x):
                sp = s.new_tag('span', attrs={'class': 'sub'}); sp.string = x; h.append(sp)
            else:
                np_ = s.new_tag('p'); np_.string = x; after.insert_after(np_); after = np_
    for t in s.find_all(string=True):
        if isinstance(t, NavigableString) and t.strip(): t.replace_with(fix_text(str(t)))
    for bq in s.find_all('blockquote'): bq.unwrap()
    for h in s.find_all(['h1', 'h2', 'h3', 'h4', 'p']):
        if not h.get_text(strip=True): h.decompose()
    for p in s.find_all('p'):
        if re.match(r'^\s*\[(시각 자료 제안|그림|이미지)', p.get_text()): p.decompose()
    # 프롬프트 상자: 시작 문단부터 다음 제목 전까지 묶습니다
    blocks = list(s.find_all('p'))
    for p in blocks:
        if p.parent is None or p.find_parent(['table', 'pre', 'div']): continue
        rawtxt = p.get_text(); txt = rawtxt.replace('§BR§', '').strip()
        start = None; label = '복사해서 쓰는 프롬프트'
        mk = MARK.match(txt)
        if mk and not re.search(r'나쁜|좋은|시각 자료', mk.group(0)):
            start = 'mark'; label = mk.group(1).strip('[] ') if mk.group(1) else label
        elif PROMPT_START.match(txt) and ROLE.search(txt): start = 'label'
        else:
            m = re.search(r'(입력하세요|입력해 보세요|붙여 넣으세요|붙여넣으세요)\.\s*(당신은|너는)', txt)
            if m: start = 'split'
        if not start: continue
        box = s.new_tag('div', attrs={'class': 'prompt'})
        lab = s.new_tag('div', attrs={'class': 'plab'}); lab.string = label
        box.append(lab)
        if start == 'split':
            i = re.search(r'(입력하세요|입력해 보세요|붙여 넣으세요|붙여넣으세요)\.\s*', txt).end()
            body = txt[i:]
            intro = s.new_tag('p'); intro.string = txt[:i].strip()
            p.insert_before(intro)
        elif start == 'mark':
            body = txt[mk.end():].strip()
        else:
            body = PROMPT_START.sub('', txt)
        p.insert_before(box)
        if body: first = s.new_tag('p'); first.string = body; box.append(first)
        nxt = p.next_sibling
        p.decompose()
        while nxt is not None:
            cur = nxt; nxt = cur.next_sibling
            if isinstance(cur, NavigableString):
                if cur.strip(): box.append(cur.extract())
                else: cur.extract()
                continue
            if cur.name in ('h1', 'h2', 'h3', 'h4', 'table', 'hr', 'div'): break
            tx = cur.get_text()
            if tx.lstrip().startswith('§BR§') or (len(box.contents) > 2 and tx.rstrip().endswith('§BR§') and False): break
            if MARK.match(tx.replace('§BR§', '').strip()): break
            if cur.name == 'p' and re.match(r'^\s*(\d+\.\s|[가-하]\.\s)?\s*(Tip|팁|주의|활용 팁|결과 예시|AI의 답변|AI 답변)', tx): break
            if cur.name == 'p' and PROMPT_START.match(tx) and ROLE.search(tx): break
            box.append(cur.extract())
    for t in s.find_all(string=lambda x: x and '§BR§' in x): t.replace_with(str(t).replace('§BR§', ''))
    # 프롬프트 안 문장 사이 줄바꿈
    for box in s.find_all('div', class_='prompt'):
        for t in box.find_all(string=True):
            nt = re.sub(r'([.?!])(?=[가-힣\[\(“"])', r'\1\n', str(t))
            nt = re.sub(r'(?<=[^\s\n])(\[(?:[가-힣A-Za-z ]{2,14})\])', r'\n\1', nt)
            if nt != str(t): t.replace_with(nt)
    # 따옴표로 된 한 문단짜리 예시 프롬프트
    for p in s.find_all('p'):
        if p.find_parent(['div', 'table']): continue
        tx = p.get_text().strip()
        if re.match(r'^[“"]\s*(너는|당신은)', tx) and len(tx) > 40:
            p['class'] = p.get('class', []) + ['qprompt']
    return s

def meta(s, fallback_title):
    """앞부분 메타 문단과 문서정보 표를 떼어 내고 정보만 돌려줍니다."""
    info = {}
    # 문서 정보 표
    for tb in s.find_all('table')[:2]:
        txt = tb.get_text(' ', strip=True)
        if '문서 정보' in txt or ('발행 부서' in txt and len(txt) < 400):
            for tr in tb.find_all('tr'):
                cells = [c.get_text(' ', strip=True) for c in tr.find_all(['td', 'th'])]
                if len(cells) >= 2 and cells[0] not in ('문서 정보',): info[cells[0]] = cells[1]
            tb.decompose(); break
    # 첫 본문 제목 이전의 표지용 문구를 떼어 냅니다
    norm = lambda x: re.sub(r'[^가-힣A-Za-z0-9]', '', x)
    tn = norm(fallback_title)
    FRONT = re.compile(r'(마스터 코스|가이드북 시리즈|Vol\.|가이드 Vol|\[워크북\]|소책자|^\[[^\]]{2,30}\]$|가이드북$|코스 \d+$|^\[[^\]]*가이드[^\]]*\])')
    intro = []
    for el in list(s.children):
        name = getattr(el, 'name', None)
        if not name: continue
        t = el.get_text(' ', strip=True)
        if not t:
            if name in ('hr', 'p', 'h1', 'h2', 'h3'): el.decompose()
            continue
        if name == 'table': break
        m = re.match(r'^(발행처|발행 및 기획|발행 및 총괄|발행 부서|적용 대상|대상 학과|발행일|문서 규격|문서 성격|시리즈 단계|적용 메뉴)\s*[:：]?\s*(.*)', t)
        tt = norm(t)
        if m: info[m.group(1)] = m.group(2); el.decompose(); continue
        if '|' in t and '발행 부서' in t:
            for part in t.split('|'):
                mm = re.match(r'\s*(발행 부서|대상 학과|적용 메뉴)\s*(.*)', part)
                if mm: info[mm.group(1)] = mm.group(2).strip()
            el.decompose(); continue
        import difflib
        if (len(tt) >= 6 and (tt in tn or tn in tt or difflib.SequenceMatcher(None, tt, tn).ratio() > 0.6) and len(t) < 120) or (FRONT.search(t) and len(t) < 90):
            el.decompose(); continue
        if name in ('h1', 'h2', 'h3'):
            nx = el.find_next_sibling()
            while nx is not None and not nx.get_text(strip=True): nx = nx.find_next_sibling()
            if nx is not None and re.match(r'^(발행|적용 대상|대상|문서 |시리즈)', nx.get_text(' ', strip=True)):
                intro.append(t); el.decompose(); continue
            break
        if name == 'p' and len(t) < 90 and not re.search(r'[.다요]$', t):  # 부제 한 줄
            intro.append(t); el.decompose(); continue
        break
    return info, intro

def mark_quotes(s):
    for t in list(s.find_all(string=True)):
        if t.find_parent(['div', 'table']) and t.find_parent('div', class_='prompt'): continue
        st = str(t)
        if not re.search(r'["“][^"”]{25,}?(줘|주세요|해 줘|해줘)[.!?]?["”]', st): continue
        parts = re.split(r'(["“][^"”]{25,}?(?:줘|주세요)[.!?]?["”])', st)
        new = []
        for i, part in enumerate(parts):
            if i % 2 == 1:
                sp = s.new_tag('span', attrs={'class': 'q'}); sp.string = part.strip('"“”'); new.append(sp)
            elif part: new.append(NavigableString(part))
        for n in new: t.insert_before(n)
        t.extract()
