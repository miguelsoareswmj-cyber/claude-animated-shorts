"""Soundtrack for "What if all of Earth's water teleported into the sky?"
Everything is synthesized here (numpy/scipy, the repo's own dsp/instrument kit in ./lib):
  * the three channel signature sounds (also written to audio/signature/ for reuse in every video)
  * the music bed (ducked under the voice)
  * every sound effect, placed from the picture's own key frames (frames/shots.json)
Usage: python sound.py <shots.json> <voice.wav> <out_dir>
"""
import json, os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, 'lib'))
from dsp import SR, TAU, ns, tt, rng, lp, hp, bp, reson, peq, colored, smooth_noise, fades, phase, modal, pan, st, place, widen, \
    make_ir, convolve_st, integrated, true_peak, read_wav, write_wav, dbg
from instruments import m2f, brass, glock, vibes, pluck, pad, timpani, cymbal, triangle, snare_roll, snare
from sfx_gen import whoosh, bubbles, splash_big, water_bed, creak, timber_tear, breeze

shots_path, voice_path, out = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out, exist_ok=True)
D = json.load(open(shots_path)); K = {k: v / 30.0 for k, v in D['key'].items()}
SH = {s['id']: (s['a'] / 30.0, s['b'] / 30.0) for s in D['shots']}
DUR = D['total'] / 30.0; N = ns(DUR)
R = rng(11)
def wd(x, r=None):
    x = np.asarray(x); return x if x.ndim == 2 else widen(x, R)

# =====================================================================================  signature sounds
def sig_sting(r=None):
    """water-drop plink + three rising marimba notes (D5, A5, D6): opens every video"""
    r = r or rng(1); n = ns(0.9); t = np.arange(n) / SR; y = np.zeros(n)
    f = 700 * np.exp(np.minimum(t, 0.05) / 0.05 * np.log(1900 / 700))
    drop = np.sin(phase(f)) * np.exp(-t / 0.045) * 0.8
    y += drop
    for i, m in enumerate([74, 81, 86]):
        k = ns(0.09 + i * 0.085); d = 0.6
        note = modal(d, [(m2f(m), 1.0, 0.32), (m2f(m) * 3.93, 0.35, 0.05), (m2f(m) * 9.2, 0.1, 0.012)], r)
        y[k:k + len(note)] += note[:n - k] * (0.55 + 0.12 * i)
    return fades(y, 0.0005, 0.08)

def sig_swoosh_pop(r=None):
    """the transition: short airy swoosh into a round pop"""
    r = r or rng(2)
    sw = whoosh(0.30, r, peak=0.17, f_lo=500, f_hi=3200, width=0.7, tail=0.07, air=0.22)
    n = ns(0.36); y = np.zeros(n); y[:len(sw)] += sw * 0.9
    t = tt(0.06); f = 950 * np.exp(-t / 0.02) + 260
    pop = np.sin(phase(f)) * np.exp(-t / 0.018); k = ns(0.17)
    y[k:k + len(pop)] += pop * 0.8
    return fades(y, 0.002, 0.03)

def sig_ding_wah(r=None):
    """the ending: a small bell ding, then a two-note muted-tuba "wah-wah" (falling)"""
    r = r or rng(3); n = ns(1.9); y = np.zeros(n)
    bell = modal(1.6, [(1568, 1.0, 0.9), (1568 * 2.76, 0.35, 0.25), (1568 * 5.4, 0.12, 0.08)], r)
    y[:len(bell)] += bell * 0.45
    for i, (m, d) in enumerate([(46, 0.34), (45, 0.75)]):
        b = brass(m2f(m), d, vel=0.75, r=r, kind='tuba', scoop=-30, fall=(-1.2 if i else 0))
        tb = np.arange(len(b)) / SR
        wah = 0.5 - 0.5 * np.cos(TAU * np.clip(tb / max(d, 0.2), 0, 1) * (1.0 if i == 0 else 1.5))
        b = lp(b, 600) * (1 - wah * 0.6) + bp(b, 700, 1600) * wah * 1.4
        if i: b *= 1 + 0.25 * np.sin(TAU * 5.5 * tb) * np.clip(tb / 0.25, 0, 1)
        k = ns(0.32 + i * 0.42); y[k:k + len(b)] += b[:n - k] * 0.9
    return fades(y, 0.001, 0.2)

SIG = os.path.join(HERE, 'signature'); os.makedirs(SIG, exist_ok=True)
STING, SWOOSH, DINGWAH = sig_sting(), sig_swoosh_pop(), sig_ding_wah()
for name, x in [('sting', STING), ('swoosh_pop', SWOOSH), ('ding_wah', DINGWAH)]:
    write_wav(os.path.join(SIG, f'{name}.wav'), st(x / (np.abs(x).max() + 1e-9) * 0.9))

# =====================================================================================  music
mus = np.zeros((2, N))
def put(x, t, g=1.0, p=0.0):
    place(mus, pan(x, p) if np.ndim(x) == 1 else x, t, g)
BEAT = 0.5  # 120 bpm
sec = lambda a: SH[a][0]
# section table: (start, end, kind, root midi)
SECT = [
    (0.0, K['teleport'], 'hook', 62),
    (K['teleport'], sec('B'), 'lift', 62),
    (sec('B'), sec('C'), 'under', 50),
    (sec('C'), sec('D'), 'sunny', 53),
    (sec('D'), sec('H'), 'under', 50),
    (sec('H'), sec('J'), 'explain', 53),
    (sec('J'), K['hits'], 'fall', 50),
    (K['hits'], sec('M'), 'wave', 50),
    (sec('M'), sec('N'), 'heat', 55),
    (sec('N'), K['unluck'], 'drain', 53),
]
CH = {  # chord tones relative to root
    'hook': [0, 3, 7], 'lift': [0, 3, 7], 'under': [0, 3, 7, 10], 'sunny': [0, 4, 7], 'explain': [0, 4, 7],
    'fall': [0, 1, 7], 'wave': [0, 3, 7], 'heat': [0, 4, 7, 9], 'drain': [0, 4, 7]}
for a, b, kind, root in SECT:
    nb = int((b - a) / (BEAT / 2)); tones = CH[kind]
    for i in range(nb):
        t = a + i * BEAT / 2; beat = i // 2; off = i % 2
        rr = rng(1000 + int(t * 100))
        if kind in ('hook', 'under', 'drain', 'explain', 'heat', 'sunny') and off == 0:
            # plucked bass on beats, octave bounce
            m = root - 12 + (12 if beat % 2 else 0) + (tones[2] if beat % 4 == 3 else 0)
            put(pluck(m2f(m), 0.75, rr, dur=0.45, bright=0.35), t, 0.5 if kind != 'under' else 0.42, -0.1)
        if kind == 'explain' and off == 0:
            put(brass(m2f(root - 24 + (7 if beat % 2 else 0)), 0.22, 0.6, rr, 'tuba'), t, 0.28, 0.0)
            if beat % 2: put(snare(0.25, rr, dur=0.18), t, 0.16, 0.2)
        if kind in ('hook', 'sunny', 'explain', 'heat') and (i % 3 == 0 or (kind == 'hook' and i % 4 == 1)):
            m = root + 12 + tones[(i // 3) % len(tones)] + (12 if kind == 'sunny' else 0)
            put(glock(m2f(m), 0.45, rr, dur=1.0), t, 0.17, 0.3)
        if kind == 'under' and i % 8 == 4:
            put(vibes(m2f(root + 12 + tones[(i // 8) % len(tones)]), 0.5, rr, dur=1.8), t, 0.22, -0.3)
        if kind == 'drain' and off == 0:
            put(brass(m2f(root - 12 - beat), 0.2, 0.5, rr, 'tuba', scoop=-35), t, 0.22, 0.0)
    # sustained pads
    if kind in ('under', 'fall', 'wave', 'lift'):
        p = pad([m2f(root + x) for x in tones], b - a + 0.4, 0.5, rng(int(a * 10)), att=0.4 if kind != 'fall' else (b - a) * 0.8, rel=0.5, warm=700)
        put(wd(p, R), a, 0.20 if kind == 'under' else 0.28)
# hook: playful rising glock run into the teleport, then a big rising gliss
for i, m in enumerate([62, 65, 69, 72, 74, 77, 81, 86]):
    put(glock(m2f(m), 0.5, rng(i), dur=0.8), K['teleport'] - 0.42 + i * 0.05, 0.16, 0.2)
# fall: timpani roll crescendo + rising brass
for k in range(int((K['hits'] - sec('J')) / 0.06)):
    t = sec('J') + k * 0.06; a = (t - sec('J')) / (K['hits'] - sec('J'))
    put(timpani(m2f(38), 0.2 + 0.6 * a, rng(k), dur=0.4), t, 0.12 * (0.4 + a), 0)
for i, m in enumerate([50, 51, 53, 55, 56, 58, 60, 62]):
    t = sec('J2') + i * (K['hits'] - sec('J2')) / 8
    put(brass(m2f(m), 0.45, 0.6 + i * 0.04, rng(50 + i), 'horn'), t, 0.11 + i * 0.012, 0.15)
# waves: brass stabs on "five hundred" and a huge one on "kilometers"
for t, m, g in [(K['five'], 50, 0.30), (K['km'], 38, 0.5)]:
    for x in [0, 7, 12, 15]: put(brass(m2f(m + x), 1.1, 0.9, rng(int(t * 7) + x), 'stab', fall=-0.5), t, g * 0.45, (x - 7) * 0.05)
    put(timpani(m2f(m - 12 if m > 40 else m), 1.0, rng(9), dur=2.5), t, 0.6, 0)
    put(wd(cymbal(0.8, rng(int(t)), dur=2.8), R), t, 0.22)
# heat: little rising thermometer whistle into "warmer"
t0 = SH['M2'][0] + 0.15; n = ns(K['warmer'] - t0 + 0.3); tw = np.arange(n) / SR
fwh = 600 * np.exp(tw / tw[-1] * np.log(2400 / 600)); wh = np.sin(phase(fwh)) * (0.3 + 0.7 * tw / tw[-1]) * (1 + 0.1 * np.sin(TAU * 6 * tw))
put(fades(lp(wh, 4000), 0.05, 0.05), t0, 0.06, 0.25)

# =====================================================================================  sfx
sfx = np.zeros((2, N))
def fx(x, t, g=1.0, p=0.0):
    place(sfx, pan(x, p) if np.ndim(x) == 1 else x, t, g)
def boom(dur=2.0, f0=70, f1=32, r=None, crack=0.6):
    r = r or rng(5); t = tt(dur); f = f1 + (f0 - f1) * np.exp(-t / 0.25)
    y = np.sin(phase(f)) * np.exp(-t / (dur * 0.35))
    y += lp(colored(len(t), r, 1.0), 300) * np.exp(-t / 0.4) * 1.4
    y += hp(r.standard_normal(len(t)), 1500) * np.exp(-t / 0.05) * crack
    return fades(y, 0.001, 0.3)
def sonar(r=None):
    t = tt(1.6); y = np.sin(TAU * 1480 * t) * np.exp(-t / 0.12)
    for k, (d, g) in enumerate([(0.38, 0.45), (0.76, 0.2), (1.14, 0.08)]):
        i = ns(d); y[i:] += np.sin(TAU * 1480 * t[:len(t) - i]) * np.exp(-t[:len(t) - i] / 0.12) * g
    return fades(y * 0.6, 0.002, 0.2)
def whale_call(r=None):
    r = r or rng(7); t = tt(1.8)
    f = 180 + 160 * np.sin(np.pi * np.clip(t / 1.4, 0, 1)) ** 1.5 - 40 * t
    y = sum(np.sin(phase(f * h)) * g for h, g in [(1, 1), (2, 0.4), (3, 0.15)]) * np.sin(np.pi * np.clip(t / 1.8, 0, 1)) ** 0.8
    return lp(y, 1800) * 0.5
def slide(f0, f1, dur, r=None):
    t = tt(dur); f = f0 * (f1 / f0) ** (t / dur); y = np.sin(phase(f)) * np.sin(np.pi * t / dur) ** 0.5
    return fades(y + 0.15 * np.sin(phase(2 * f)), 0.01, 0.02)
def thud(r=None, f=55, dur=0.6):
    r = r or rng(8); t = tt(dur); y = np.sin(phase(f + 60 * np.exp(-t / 0.03))) * np.exp(-t / 0.14)
    y += lp(r.standard_normal(len(t)), 600) * np.exp(-t / 0.03) * 0.8
    return fades(y, 0.001, 0.05)
def clang(r=None):
    r = r or rng(9); return modal(1.4, [(420, 1, 0.5), (420 * 2.4, 0.6, 0.35), (420 * 3.9, 0.4, 0.2), (420 * 5.6, 0.25, 0.1)], r) * 0.5
def boing(r=None, f0=180, f1=520, dur=0.45):
    t = tt(dur); f = f0 + (f1 - f0) * (1 - np.exp(-t / 0.08)); vib = 1 + 0.08 * np.sin(TAU * 18 * t) * np.exp(-t / 0.25)
    return fades(np.sin(phase(f * vib)) * np.exp(-t / 0.22), 0.002, 0.05)
def tear(r=None, dur=0.55):
    r = r or rng(10); n = ns(dur); t = np.arange(n) / SR
    cr = np.zeros(n); k = 0
    while k < n:
        cr[k] = r.uniform(0.4, 1); k += int(SR * r.uniform(0.0015, 0.006) * (1 + 2 * k / n))
    y = bp(cr, 1500, 7000) * 2.5 + bp(r.standard_normal(n), 2000, 6000) * 0.3
    return fades(y * np.exp(-t / (dur * 0.6)), 0.002, 0.05)
def rain(dur, r, density=180):
    n = ns(dur); y = np.zeros(n)
    for _ in range(int(density * dur)):
        k = r.integers(0, n - 800); d = tt(r.uniform(0.004, 0.012)); f = r.uniform(2500, 7000)
        y[k:k + len(d)] += np.sin(TAU * f * d) * np.exp(-d / 0.002) * r.uniform(0.2, 1)
    return y + bp(r.standard_normal(n), 1500, 8000) * 0.08
def ship_horn(r=None, dur=1.2):
    t = tt(dur); y = sum(np.sin(phase(np.full(len(t), f))) * g for f, g in [(110, 1), (220, 0.6), (330, 0.4), (440, 0.25), (550, 0.15)])
    return fades(lp(y, 1400) * np.clip(t / 0.08, 0, 1) * 0.4, 0.01, 0.2)
def sizzle(dur, r):
    n = ns(dur); y = hp(r.standard_normal(n), 3500) * (0.6 + 0.4 * smooth_noise(n, r, 8.0))
    crack = np.zeros(n); idx = r.integers(0, n, int(dur * 60)); crack[idx] = r.uniform(0.3, 1, len(idx))
    return y * 0.5 + bp(crack, 2000, 8000) * 1.5
def roar(dur, r, lo=80, hi=1400):
    n = ns(dur); y = bp(colored(n, r, 1.2), lo, hi) * (0.7 + 0.3 * smooth_noise(n, r, 2.0)); return y

# signature: sting at 0, swoosh-pop on every place change
fx(STING, 0.0, 0.9)
for sid in ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'M2', 'N']:
    fx(wd(SWOOSH, R), SH[sid][0] - 0.17, 0.55)
# 1 teleport
fx(wd(whoosh(0.7, R, peak=0.12, f_lo=200, f_hi=4000, tail=0.3), R), K['teleport'] - 0.1, 0.7)
fx(bubbles(1.0, R, 60), K['teleport'], 0.35, 0.3)
for i in range(6): fx(glock(m2f(86 + i * 2), 0.6, rng(70 + i), dur=0.7), K['teleport'] + 0.03 * i, 0.10, 0.4 - i * 0.15)
# 2 dark at noon: low "dun" + lights-off clunk
fx(thud(R, 45, 1.2), K['dark'], 0.9); fx(hp(clang(R), 800) * 0.4, K['dark'] + 0.02, 0.25, -0.3)
# under-ocean ambience under all under-shots
for a, b in [SH['B'], SH['D'], SH['E'], SH['G'], (SH['J'][0], SH['J'][1])]:
    wb = water_bed(b - a + 0.3, R, close=0.4); wb = lp(wb, 900); fx(wb, a, 0.16)
    fx(bubbles(b - a, R, 4, f_lo=200, f_hi=900), a, 0.12, -0.2)
fx(thud(R, 38, 1.5), K['thick'] + 0.1, 0.75); fx(wd(whoosh(1.0, R, peak=0.25, f_lo=150, f_hi=900, tail=0.5), R), K['thick'] - 0.05, 0.5)
# 3 rain gauge
a, b = SH['C']; fx(wd(rain(b - a, R), R), a, 0.35)
fx(modal(0.6, [(1900, 1, 0.12), (1900 * 2.7, 0.3, 0.04)], R), K['inch'], 0.4, -0.2)
# 4 whale, fish, plane
fx(whale_call(R), K['pacific'] - 0.2, 0.55, 0.1)
fx(bubbles(1.0, R, 25, f_lo=500, f_hi=2000), K['house'], 0.4, 0.2)
a, b = SH['F']; n = ns(b - a); eng = lp(np.sin(phase(np.full(n, 62.0))) + 0.5 * np.sign(np.sin(phase(np.full(n, 62.0)))), 300) * 0.25
fx(eng + lp(water_bed(b - a, R, close=0.8), 1200) * 0.5, a, 0.35); fx(bubbles(b - a, R, 18), a, 0.3, 0.3)
fx(wd(convolve_st(sonar(R), make_ir(1.6, 4)), R)[0] * 0.5 + sonar(R), K['sub'], 0.35)
# 5 question: slide-whistle "huh?"
fx(slide(500, 900, 0.35), K['why'], 0.22, 0.2)
# 6 scale: water block drops, slam + clang; air cloud boings up
fx(whoosh(0.3, R, peak=0.25, f_lo=200, f_hi=1200, tail=0.05), K['twoHundred'] - 0.3, 0.5)
fx(boom(1.2, 90, 40, R, 0.4), K['twoHundred'], 0.8); fx(clang(R), K['twoHundred'] + 0.01, 0.45, 0.25)
fx(boing(R), K['twoHundred'] + 0.04, 0.4, -0.3)
# 7 bathtub: lower creak, towel stretch, tear
fx(creak(0.8, R, 90, 140) * 0.4, SH['I'][0] + 0.2, 0.25, 0.1)
fx(creak(0.9, R, 140, 260) * 0.5, K['towel'] - 0.3, 0.3, -0.1)
fx(tear(R, 0.5), SH['J'][0] - 0.12, 0.7)
# 8 the sky falls
fx(boom(2.5, 50, 28, R, 0.2), K['falls'] - 0.05, 0.8)
fx(wd(roar(SH['J2'][0] - K['falls'] + 0.3, R, 100, 2500), R), K['falls'], 0.35)
a, b = SH['J2']; n = ns(b - a); wind = breeze(b - a, R, level=1.4, gust=0.4, bright=1500); fx(wd(wind, R), a, 0.6)
for i in range(6): fx(bubbles(0.15, rng(80 + i), 30), K['fish'] + 0.08 * i, 0.3, -0.5 + i * 0.2)
fx(whale_call(rng(12)) * 0.8, K['whales'], 0.5, -0.3)
fx(ship_horn(R), K['ships'], 0.45, 0.4); fx(creak(0.8, R, 60, 90), K['ships'] + 0.2, 0.3, 0.4)
# 9 impact: the planet-wide hit
fx(boom(3.5, 80, 26, R, 1.0), K['hits'], 1.2); fx(wd(splash_big(R), R), K['hits'] + 0.03, 0.9)
fx(wd(cymbal(1.0, R, dur=3.0), R), K['hits'], 0.3); fx(wd(roar(2.0, R, 60, 3000) * np.linspace(1, 0, ns(2.0)) ** 2, R), K['hits'] + 0.1, 0.5)
# 10 waves: approaching roar, giant rumble on "kilometers"
a, b = SH['L']; n = ns(b - a); rr = roar(b - a, R, 60, 1800) * np.linspace(0.3, 1.0, n) ** 1.5; fx(wd(rr, R), a, 0.55)
fx(boom(3.0, 40, 22, R, 0.3), K['km'], 0.9)
# 11 heat: steam hiss
a, b = SH['M']; fx(wd(sizzle(b - a + 0.5, R), R), a + 0.1, 0.3)
a, b = SH['M2']; fx(wd(sizzle(b - a, R) * 0.7, R), a, 0.25); fx(bubbles(b - a, R, 12, f_lo=400, f_hi=1500), a, 0.3)
fx(modal(1.0, [(2093, 1, 0.5), (2093 * 2.76, 0.3, 0.15)], R) * 0.5, K['warmer'] + 0.1, 0.3, 0.3)
# 12 drain: rushing water, house creak, signature ending
a, b = SH['N']; fx(wd(water_bed(DUR - a, R, close=1.0, slosh_rate=1.6), R), a, 0.45)
fx(wd(roar(DUR - a, R, 150, 2500) * 0.5, R), a, 0.3)
fx(creak(1.0, R, 70, 120), SH['N2'][0] + 0.2, 0.4, 0.2)
fx(DINGWAH, K['yourHouse'] + 0.05, 0.95)

# =====================================================================================  mix
v, vsr = read_wav(voice_path); assert vsr == SR
voice = np.zeros((2, N)); place(voice, v, 0.0)
voice *= dbg(-16 - integrated(voice))
env = lp(np.abs(voice[0]), 8, 1); env = env / (env.max() + 1e-9)
duck = 1 - 0.6 * np.clip(env * 4, 0, 1)                  # ~ -8 dB under speech
room = make_ir(1.1, 21, hf=1.4)
mus_wet = convolve_st(mus, room) * 0.18
music = (mus + mus_wet) * duck
music *= dbg(-23 - integrated(music + 1e-12))
sfx_wet = convolve_st(sfx, room) * 0.12
fxmix = sfx + sfx_wet
fxmix *= dbg(-21.5 - integrated(fxmix + 1e-12))
# user rule: music +3 dB, SFX -6 dB relative to that base, voice unchanged
mix = voice + music * dbg(3) + fxmix * dbg(-6 + 6)  # sfx bed is designed hot; net -0 against its own -24 base
mix *= dbg(-13.4 - integrated(mix))
# soft limiter + true-peak ceiling
mix = np.tanh(mix * 1.15) / 1.15
peak = true_peak(mix)
if peak > -1.0: mix *= dbg(-1.0 - peak)
fade = ns(0.15); mix[:, -fade:] *= np.linspace(1, 0, fade)
write_wav(os.path.join(out, 'mix.wav'), mix)
write_wav(os.path.join(out, 'stem_voice.wav'), voice); write_wav(os.path.join(out, 'stem_music.wav'), music * dbg(3))
write_wav(os.path.join(out, 'stem_sfx.wav'), fxmix)
print('mix LUFS', round(integrated(mix), 2), 'TP', round(true_peak(mix), 2), 'dur', round(mix.shape[1] / SR, 2))
