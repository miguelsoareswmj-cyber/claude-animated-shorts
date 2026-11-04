"""Soundtrack for "Gravity just turned off" (Curly What If #1).
Channel signature sounds (sting, swoosh-pop on every cut, ding + wah-wah) + a bouncy bed that goes
floaty while gravity is off, and SFX placed from the picture's key frames.
Usage: python sound.py <shots.json> <keys.json> <voice.wav> <out_dir>"""
import json, os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(HERE, 'lib'))
from dsp import SR, TAU, ns, tt, rng, lp, hp, bp, colored, smooth_noise, fades, phase, modal, pan, st, place, widen, make_ir, convolve_st, integrated, true_peak, read_wav, write_wav, dbg
from instruments import m2f, brass, glock, vibes, pluck, pad, timpani, cymbal, snare
from sfx_gen import whoosh, bubbles, creak, breeze

shots, keys, voice_path, out = sys.argv[1:5]
D = json.load(open(shots)); KF = json.load(open(keys))
SH = {s['id']: (s['a'] / 30, s['b'] / 30) for s in D['shots']}; K = {k: v / 30 for k, v in KF.items()}
DUR = D['total'] / 30; N = ns(DUR); R = rng(5)
mus = np.zeros((2, N)); sfx = np.zeros((2, N))
def put(buf, x, t, g=1.0, p=0.0):
    x = np.asarray(x); place(buf, pan(x, p) if x.ndim == 1 else x, t, g)
def wd(x): x = np.asarray(x); return x if x.ndim == 2 else widen(x, R)
sig = {n: read_wav(os.path.join(HERE, 'signature', f'{n}.wav'))[0] for n in ('sting', 'swoosh_pop', 'ding_wah')}

# ---------------- music: bouncy C major pluck bed; floaty (no bass, vibes + pad) while gravity is off -------------
BEAT = 60 / 116
off0, drop = K['off'], K['drop']
prog = [60, 57, 53, 55]  # C Am F G
t = 0.0; i = 0
while t < DUR - 0.3:
    root = prog[(i // 8) % 4]; floating = off0 <= t < drop
    rr = rng(100 + i)
    if not floating:
        if i % 2 == 0: put(mus, pluck(m2f(root - 12 + (7 if i % 4 == 2 else 0)), 0.8, rr, dur=0.4, bright=0.4), t, 0.55, -0.1)
        if i % 4 == 1: put(mus, snare(0.25, rr, dur=0.15), t, 0.12, 0.2)
        if i % 3 == 0: put(mus, glock(m2f(root + 12 + [0, 4, 7][i % 3 if i % 3 else (i // 3) % 3]), 0.4, rr, dur=0.7), t, 0.14, 0.3)
    else:
        if i % 4 == 0: put(mus, vibes(m2f(root + 12 + [0, 4, 7, 11][(i // 4) % 4]), 0.5, rr, dur=2.2), t, 0.22, -0.3)
        if i % 2 == 1: put(mus, glock(m2f(root + 24 + [7, 4, 12, 9][(i // 2) % 4]), 0.3, rr, dur=1.2), t, 0.08, 0.4)
    t += BEAT / 2; i += 1
p = pad([m2f(x) for x in (60, 64, 67, 71)], drop - off0, 0.45, rng(9), att=1.2, rel=0.3, warm=1200)
put(mus, wd(p), off0, 0.30)
# silence the bed for a beat right before the drop, then restart with a hit
gap = (ns(drop - 0.25), ns(drop + 0.05)); mus[:, gap[0]:gap[1]] *= np.linspace(1, 0, gap[1] - gap[0])
for x in (0, 7, 12, 16): put(mus, brass(m2f(48 + x), 0.5, 0.9, rng(x), 'stab'), drop, 0.18)

# ---------------- sfx ----------------
put(sfx, sig['sting'], 0.0, 0.9)
for sid in ['B', 'C', 'D', 'E', 'F', 'G1', 'G2', 'H', 'I']: put(sfx, sig['swoosh_pop'], SH[sid][0] - 0.17, 0.5)
# gravity off: a descending "bwoooop" with a shimmer
n = ns(1.2); tw = np.arange(n) / SR; f = 520 * np.exp(-tw / 0.5) + 120
bw = np.sin(phase(f)) * np.exp(-tw / 0.6) * (1 + 0.3 * np.sin(TAU * 7 * tw))
put(sfx, bw, off0 - 0.05, 0.45)
for k in range(8): put(sfx, glock(m2f(84 + k * 2), 0.5, rng(30 + k), dur=0.6), off0 + 0.04 * k, 0.07, -0.4 + k * 0.1)
# floating ambience: soft airy wind
put(sfx, wd(breeze(drop - off0, R, level=0.6, gust=0.2, bright=1800)), off0, 0.25)
# Earth spin whoosh + peel
put(sfx, wd(whoosh(1.4, R, peak=0.6, f_lo=150, f_hi=900, tail=0.6)), SH['B'][0] + 0.2, 0.4)
put(sfx, wd(whoosh(0.8, R, peak=0.2, f_lo=600, f_hi=3000, tail=0.3)), K['peel'], 0.35)
# coffee blob "blorp" + bubbles
n = ns(0.35); tw = np.arange(n) / SR; bl = np.sin(phase(180 + 500 * (tw / tw[-1]) ** 2)) * np.exp(-tw / 0.15)
put(sfx, bl, K['coffee'], 0.4, 0.2); put(sfx, bubbles(1.2, R, 14, f_lo=300, f_hi=1200), K['coffee'] + 0.1, 0.3, 0.2)
# cars lifting: suspension creaks
for k in range(5): put(sfx, creak(0.5, rng(60 + k), 90 + k * 15, 140 + k * 15) * 0.5, K['lift'] + k * 0.18, 0.3, -0.6 + k * 0.3)
# Jay rising: a cartoon slide whistle up
n = ns(1.4); tw = np.arange(n) / SR; sw = np.sin(phase(500 * (2.6 ** (tw / tw[-1]))))
put(sfx, fades(sw * (0.5 + 0.5 * tw / tw[-1]), 0.02, 0.1), K['jay'], 0.12, 0.3)
# gravity back: everything drops at once — big thud + many crashes + car alarms
def thud(r, f0=60, dur=0.8):
    t2 = tt(dur); y = np.sin(phase(f0 + 80 * np.exp(-t2 / 0.03))) * np.exp(-t2 / 0.2); y += lp(r.standard_normal(len(t2)), 500) * np.exp(-t2 / 0.04)
    return fades(y, 0.001, 0.05)
put(sfx, thud(R, 50, 1.4), drop, 1.0)
for k in range(10): put(sfx, thud(rng(80 + k), 80 + k * 9, 0.4) * 0.6 + hp(rng(k).standard_normal(ns(0.4)), 2500) * np.exp(-tt(0.4) / 0.03) * 0.3, drop + 0.02 + k * 0.035, 0.35, -0.8 + k * 0.17)
put(sfx, wd(cymbal(0.6, R, dur=2.0)), drop, 0.18)
for k, (f1, f2) in enumerate([(1100, 1500), (900, 1300)]):  # two car alarms
    n = ns(2.2); tw = np.arange(n) / SR; fr = np.where((tw * 4 % 1) < 0.5, f1, f2)
    al = np.sign(np.sin(phase(fr))) * 0.25 * np.clip(tw / 0.05, 0, 1) * np.clip((2.2 - tw) / 0.3, 0, 1)
    put(sfx, lp(al, 3000), drop + 0.45 + k * 0.3, 0.12, -0.5 + k)
# "Every cup": a splash
put(sfx, hp(R.standard_normal(ns(0.3)), 1200) * np.exp(-tt(0.3) / 0.06), SH['G2'][0] + 0.05, 0.4)
# high wind up with Jay
put(sfx, wd(breeze(SH['H'][1] - SH['H'][0], R, level=1.0, gust=0.4, bright=1200)), SH['H'][0], 0.4)
# ending signature
put(sfx, sig['ding_wah'], SH['I'][0] + 1.6, 0.9)

# ---------------- mix ----------------
v, vsr = read_wav(voice_path); assert vsr == SR
voice = np.zeros((2, N)); place(voice, v, 0.0); voice *= dbg(-16 - integrated(voice))
env = lp(np.abs(voice[0]), 8, 1); env /= env.max() + 1e-9; duck = 1 - 0.6 * np.clip(env * 4, 0, 1)
room = make_ir(0.9, 21, hf=1.4)
music = (mus + convolve_st(mus, room) * 0.15) * duck; music *= dbg(-23 - integrated(music + 1e-12))
fxm = sfx + convolve_st(sfx, room) * 0.1; fxm *= dbg(-21.5 - integrated(fxm + 1e-12))
mix = voice + music * dbg(3) + fxm
mix *= dbg(-13.4 - integrated(mix)); mix = np.tanh(mix * 1.15) / 1.15
pk = true_peak(mix)
if pk > -1: mix *= dbg(-1 - pk)
fo = ns(0.12); mix[:, -fo:] *= np.linspace(1, 0, fo)
os.makedirs(out, exist_ok=True); write_wav(os.path.join(out, 'mix.wav'), mix)
print('mix LUFS', round(integrated(mix), 2), 'TP', round(true_peak(mix), 2), 'dur', round(mix.shape[1] / SR, 2))
