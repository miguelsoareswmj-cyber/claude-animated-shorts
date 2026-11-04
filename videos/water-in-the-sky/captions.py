"""Word-by-word captions (ASS) from voice/timings.json.
Style: 1-3 words at a time, bold white, thick black outline, lower-middle, pop-in on each swap,
numbers written as digits and key words in yellow.
Usage: python captions.py voice/timings.json out/captions.ass
"""
import json, re, sys

src, dst = sys.argv[1], sys.argv[2]
T = json.load(open(src))

# spoken number phrases -> digits (matched on the lower-cased words)
NUM = [(['two', 'and', 'a', 'half'], '2.5'), (['two', 'hundred', 'and', 'fifty'], '250'), (['five', 'hundred', 'and', 'twenty', 'four'], '524'),
       (['forty', 'five'], '45'), (['ten'], '10'), (['twenty'], '20')]
KEYWORDS = {'25', 'teleported', 'sky', 'dark', 'noon', 'thick', 'inch', 'pacific', 'house', 'submarines', 'why', '250', 'air',
            'bathtub', 'paper', 'towel', 'falls', 'fish', 'whales', 'ships', 'hits', 'everywhere', '524', 'kilometers',
            'heat', '20', 'warmer', 'luckily', 'unluckily', 'water', '10', '45', 'midnight'}

def clean(w):
    return re.sub(r"[^\w']", '', w).lower()

# flatten words with times, then merge number phrases
words = []
for l in T['lines']:
    ws = l['words']; i = 0
    while i < len(ws):
        hit = None
        for pat, rep in NUM:
            seg = [clean(x['w']) for x in ws[i:i + len(pat)]]
            if seg == pat:
                hit = (rep, len(pat)); break
        if hit:
            rep, n = hit; last = ws[i + n - 1]
            punct = re.findall(r'[,.?!]+$', last['w'])
            words.append({'w': rep + (punct[0] if punct else ''), 's': ws[i]['s'], 'e': last['e'], 'end_line': i + n == len(ws)})
            i += n
        else:
            words.append({'w': ws[i]['w'], 's': ws[i]['s'], 'e': ws[i]['e'], 'end_line': i == len(ws) - 1}); i += 1

# group: break after punctuation / line ends; at most 3 words, and only 2 if they are long
chunks, cur = [], []
for w in words:
    cur.append(w)
    txt = ' '.join(x['w'] for x in cur)
    brk = w['end_line'] or re.search(r'[,.?!]$', w['w']) or len(cur) == 3 or len(txt) > 15
    if brk:
        chunks.append(cur); cur = []
if cur: chunks.append(cur)

def ts(t):
    t = max(0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f'{h}:{m:02d}:{s:05.2f}'

def styled(w):
    raw = w.upper().replace('?', '?').strip()
    core = clean(w)
    if core in KEYWORDS:
        return r'{\c&H3AD8FF&}' + raw + r'{\c&HFFFFFF&}'
    return raw

head = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Inter ExtraBold,104,&H00FFFFFF,&H00FFFFFF,&H00000000,&H64000000,1,0,0,0,100,100,1,0,1,9,4,2,60,60,610,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
ev = []
for i, c in enumerate(chunks):
    s = c[0]['s'] - 0.03
    nxt = chunks[i + 1][0]['s'] - 0.03 if i + 1 < len(chunks) else c[-1]['e'] + 0.4
    e = min(nxt, c[-1]['e'] + 0.45)
    txt = ' '.join(styled(x['w']) for x in c)
    pop = r'{\fscx118\fscy118\t(0,90,\fscx100\fscy100)}'
    ev.append(f'Dialogue: 0,{ts(s)},{ts(e)},Cap,,0,0,0,,{pop}{txt}')
open(dst, 'w').write(head + '\n'.join(ev) + '\n')
print(len(chunks), 'caption chunks')
