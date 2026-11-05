"""Soundtrack for "What if gravity turned off for 5 seconds?" (channel brief cut).
Music builds through the video, goes quiet + heartbeat ticks under the countdown, silence, then a huge boom.
Usage: python sound3.py <shots.json> <keys.json> <voice.wav> <out_dir>"""
import json, os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, 'lib'))
from dsp import SR, TAU, ns, tt, rng, lp, hp, bp, colored, fades, phase, modal, pan, place, widen, make_ir, convolve_st, integrated, true_peak, read_wav, write_wav, dbg
from instruments import m2f, brass, glock, vibes, pluck, pad, timpani, cymbal, snare
from sfx_gen import whoosh, bubbles, creak, breeze, splash_big

shots, keys, voice_path, out = sys.argv[1:5]
D = json.load(open(shots)); K = {k: v / 30 for k, v in json.load(open(keys)).items()}
SH = {s['id']: (s['a'] / 30, s['b'] / 30) for s in D['shots']}
DUR = D['total'] / 30; N = ns(DUR); R = rng(3)
mus = np.zeros((2, N)); sfx = np.zeros((2, N))
def put(buf, x, t, g=1.0, p=0.0):
    x = np.asarray(x); place(buf, pan(x, p) if x.ndim == 1 else x, t, g)
def wd(x): x = np.asarray(x); return x if x.ndim == 2 else widen(x, R)
sig = {n: read_wav(os.path.join(HERE, 'signature', f'{n}.wav'))[0] for n in ('sting', 'swoosh_pop', 'ding_wah')}
def boom(dur=3.0, f0=70, f1=26, crack=0.8, r=None):
    r = r or rng(5); t = tt(dur); f = f1 + (f0 - f1) * np.exp(-t / 0.25); y = np.sin(phase(f)) * np.exp(-t / (dur * 0.35))
    y += lp(colored(len(t), r, 1.0), 300) * np.exp(-t / 0.4) * 1.4 + hp(r.standard_normal(len(t)), 1500) * np.exp(-t / 0.05) * crack
    return fades(y, 0.001, 0.3)
def thud(r, f0=60, dur=0.7):
    t = tt(dur); y = np.sin(phase(f0 + 80 * np.exp(-t / 0.03))) * np.exp(-t / 0.2) + lp(r.standard_normal(len(t)), 500) * np.exp(-t / 0.04); return fades(y, 0.001, 0.05)
def clatter(r, n=8, dur=0.8):
    y = np.zeros(ns(dur))
    for k in range(n):
        f0 = r.uniform(900, 3500); m = modal(0.25, [(f0, 1, 0.05), (f0 * 2.3, 0.4, 0.03)], r) * r.uniform(0.3, 1); i = ns(r.uniform(0, dur - 0.26)); y[i:i + len(m)] += m
    return y

# ---------------- music: tension builds; three layers enter over time ----------------
BEAT = 60 / 124; prog = [57, 53, 60, 55]  # Am F C G
zero = K['zero']; count = K['count']
t = 0.0; i = 0
while t < DUR - 0.3:
    root = prog[(i // 8) % 4]; rr = rng(200 + i)
    quiet = count - 0.2 <= t < zero + 0.15 or K['quiet'] - 0.1 <= t < K['drop'] - 0.4
    pre = t < K['boom']
    if not quiet:
        lvl = 0.5 if pre else min(1.0, 0.65 + 0.35 * (t / zero)) if t < zero else 0.85
        if i % 2 == 0: put(mus, pluck(m2f(root - 12 + (7 if i % 4 == 2 else 0)), 0.85, rr, dur=0.35, bright=0.45), t, 0.55 * lvl, -0.1)
        if not pre and i % 4 == 1: put(mus, snare(0.3, rr, dur=0.15), t, 0.14 * lvl, 0.2)
        if not pre and t > K['cars'] and i % 2 == 1: put(mus, hp(rr.standard_normal(ns(0.05)), 7000) * np.exp(-tt(0.05) / 0.012), t, 0.07 * lvl, 0.3)  # hats
        if i % 3 == 0: put(mus, glock(m2f(root + 12 + [0, 3, 7][(i // 3) % 3]), 0.4, rr, dur=0.6), t, 0.12 * lvl, 0.3)
        if t > K['terr'] and t < count and i % 8 == 0: put(mus, brass(m2f(root - 12), BEAT * 3.5, 0.6, rr, 'soft'), t, 0.18, 0)
    t += BEAT / 2; i += 1
# floating pad while gravity is off
put(mus, wd(pad([m2f(x) for x in (57, 60, 64, 67)], zero - K['boom'], 0.42, rng(9), att=1.0, rel=0.4, warm=1200)), K['boom'], 0.26)
# countdown: one heartbeat-tick per number, rising string-ish tone, total silence for the last beat
tick = (zero - count) / 5
for k in range(5):
    tk = count + k * tick
    put(mus, thud(rng(70 + k), 55, 0.5), tk, 0.6 + 0.08 * k); put(mus, modal(0.4, [(1760, 1, 0.08)], rng(k)), tk, 0.12 + 0.03 * k, 0.2)
n = ns(zero - count - 0.35); tw = np.arange(n) / SR; rise = np.sin(phase(220 * 2 ** (tw / tw[-1] * 1.0))) * (tw / tw[-1]) ** 2
put(mus, wd(lp(rise + 0.5 * np.sin(phase(330 * 2 ** (tw / tw[-1]))) * (tw / tw[-1]) ** 2, 3000)), count, 0.10)
# crash section: big brass hit + timpani
for x in (0, 7, 12, 15): put(mus, brass(m2f(45 + x), 0.8, 0.95, rng(x), 'stab'), zero, 0.2)
put(mus, timpani(m2f(33), 1.0, rng(9), dur=2.5), zero, 0.5)

# ---------------- sfx ----------------
put(sfx, sig['sting'], 0.0, 0.8)
for sid in ['H2', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'E1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'G1']:
    if sid in SH and SH[sid][1] - SH[sid][0] > 0.2: put(sfx, sig['swoosh_pop'], SH[sid][0] - 0.17, 0.32)
# the freeze: a reverse-swell into the boom
n = ns(K['boom'] - K['freeze']); tw = np.arange(n) / SR; sw = lp(R.standard_normal(n), 2500) * (tw / tw[-1]) ** 3
put(sfx, wd(sw), K['freeze'], 0.5)
put(sfx, boom(3.2, 90, 28, 1.0), K['boom'], 1.25); put(sfx, wd(cymbal(0.9, R, dur=2.5)), K['boom'], 0.25)
# floating whooshes + a light updraft for the whole floating section
put(sfx, wd(breeze(zero - K['boom'], R, level=0.8, gust=0.3, bright=1600)), K['boom'], 0.3)
for k, tk in enumerate(np.arange(K['pull'], count, 1.6)): put(sfx, wd(whoosh(0.9, rng(300 + k), peak=0.3, f_lo=200, f_hi=1500, tail=0.4)), tk, 0.18)
put(sfx, wd(whoosh(1.2, R, peak=0.25, f_lo=150, f_hi=2500, tail=0.6)), K['pull'], 0.55)
# vignettes
put(sfx, clatter(rng(11), 10, 0.9), SH['C2'][0] + 0.1, 0.3, 0.3)                       # keyboard + papers
put(sfx, clatter(rng(12), 14, 1.0), SH['C3'][0] + 0.05, 0.4, -0.3)                     # groceries burst
for k in range(4): put(sfx, bp(rng(20 + k).standard_normal(ns(0.12)), 500, 2500) * np.exp(-tt(0.12) / 0.04), SH['C4'][0] + 0.1 + k * 0.22, 0.5, 0.2)  # bark
put(sfx, modal(0.3, [(2400, 1, 0.12)], R) * 0.5, SH['C5'][0] + 0.1, 0.25, 0.4)          # bike bell
put(sfx, wd(bubbles(1.0, R, 30, f_lo=200, f_hi=900)), SH['C6'][0], 0.4)                  # pool water lifting
put(sfx, wd(creak(0.8, R, 80, 130)), SH['D1'][0] + 0.1, 0.35)                            # car suspension
put(sfx, wd(lp(colored(ns(1.4), R, 1.0), 900)), SH['D2'][0], 0.35)                       # ocean swell
put(sfx, clatter(rng(14), 6, 0.6), SH['D4'][0] + 0.1, 0.3)                               # cans in the market
put(sfx, wd(lp(R.standard_normal(ns(1.1)), 400) * 0.4), SH['D5'][0], 0.3)                 # cabin hum
put(sfx, wd(bubbles(1.1, R, 40, f_lo=500, f_hi=2000)), SH['D6'][0], 0.35)                 # fountain droplets
# zero: BOOOOOM, then the impacts list
put(sfx, boom(3.8, 80, 24, 1.2, rng(8)), zero, 1.4)
for k in range(12): put(sfx, thud(rng(40 + k), 70 + k * 8, 0.5), zero + 0.85 + k * 0.05, 0.5, -0.8 + k * 0.14)
for k, sid in enumerate(['F2', 'F3', 'F4', 'F5', 'F6', 'F7']):
    a = SH[sid][0]
    if sid == 'F5': put(sfx, wd(splash_big(R)), a + 0.1, 0.9)
    elif sid == 'F6': put(sfx, clatter(rng(60), 18, 1.2) + thud(rng(61), 60, 1.2)[:ns(1.2)] * 0.6, a + 0.12, 0.6)
    elif sid == 'F7': put(sfx, thud(rng(62), 110, 0.4) * 0.5, a + 0.5, 0.4)  # soft pillow flump
    elif sid == 'F4': put(sfx, thud(rng(63), 60, 0.6) + clatter(rng(64), 5, 0.6)[:ns(0.6)] * 0.8, a + 0.22, 0.8)
    else: put(sfx, thud(rng(65 + k), 55, 0.8), a + 0.08, 0.9)
for k in range(2):  # car alarms after the crash
    n = ns(3.0); tw = np.arange(n) / SR; fr = np.where((tw * 4 % 1) < 0.5, 1100 - k * 200, 1500 - k * 200)
    put(sfx, lp(np.sign(np.sin(phase(fr))) * 0.25 * np.clip((3 - tw) / 0.4, 0, 1), 3000), SH['F2'][0] + 0.4 + k * 0.5, 0.09, -0.5 + k)
# the twist: quiet, a single drip, plip, ending signature
put(sfx, wd(breeze(K['drop'] - K['quiet'], R, level=0.3, gust=0.1, bright=900)), K['quiet'], 0.25)
put(sfx, modal(0.5, [(1350, 1, 0.08), (2900, 0.3, 0.03)], R), K['drop'] + 0.28, 0.6)
put(sfx, sig['ding_wah'], K['drop'] + 1.25, 0.85)

# ---------------- mix ----------------
v, vsr = read_wav(voice_path); assert vsr == SR
voice = np.zeros((2, N)); place(voice, v, 0.0); voice *= dbg(-16 - integrated(voice))
env = lp(np.abs(voice[0]), 8, 1); env /= env.max() + 1e-9; duck = 1 - 0.55 * np.clip(env * 4, 0, 1)
room = make_ir(1.0, 21, hf=1.4)
music = (mus + convolve_st(mus, room) * 0.15) * duck; music *= dbg(-22 - integrated(music + 1e-12))
fxm = sfx + convolve_st(sfx, room) * 0.1; fxm *= dbg(-21 - integrated(fxm + 1e-12))
mix = voice + music * dbg(3) + fxm
mix *= dbg(-13.4 - integrated(mix)); mix = np.tanh(mix * 1.15) / 1.15
pk = true_peak(mix)
if pk > -1: mix *= dbg(-1 - pk)
fo = ns(0.15); mix[:, -fo:] *= np.linspace(1, 0, fo)
os.makedirs(out, exist_ok=True); write_wav(os.path.join(out, 'mix.wav'), mix)
print('mix LUFS', round(integrated(mix), 2), 'TP', round(true_peak(mix), 2), 'dur', round(mix.shape[1] / SR, 2))
