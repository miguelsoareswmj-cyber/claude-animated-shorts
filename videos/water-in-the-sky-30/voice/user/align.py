"""Build timings.json for the user's own voice-over: line windows come from the caption changes burned
into the user's video (frames), speech on/offsets from the audio envelope, and word times are shared
out inside each spoken span by each word's synthesized length (Piper)."""
import json, os, subprocess, sys, wave
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
PIPER, MODEL = sys.argv[1], sys.argv[2]
LINES = [
 ("h1", "What if all of Earth's water teleported into the sky?"),
 ("h2", "Instantly, it's midnight at noon."),
 ("s1", "Two and a half kilometers of ocean are floating over your head."),
 ("e3", "Fish swim over your house."),
 ("e5", "Planes are submarines now."),
 ("q1", "But the sky can't hold it."),
 ("y1", "That water is 250 times heavier than all the air."),
 ("f1", "So it falls."),
 ("f2", "For forty-five seconds, it rains fish, whales and ships."),
 ("i1", "Then it hits everywhere at once, and the waves are kilometers tall."),
 ("l1", "Luckily, it all drains back into the oceans."),
 ("l2", "Unluckily..."),
 ("l3", "so does your house."),
]
CAP = [0, 91, 152, 242, 298, 353, 402, 510, 542, 656, 759, 831, 863]  # caption start frames (30 fps)
with wave.open(f'{HERE}/voiceover.wav') as w:
    SR = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768.0
dur = len(x) / SR
env = np.convolve(np.abs(x), np.ones(int(SR * 0.02)) / (SR * 0.02), 'same')
thr = np.percentile(env, 90) * 0.08
act = env > thr
def span(a, b):
    i0, i1 = int(a * SR), int(min(b, dur) * SR)
    idx = np.where(act[i0:i1])[0]
    return (a, b) if not len(idx) else (i0 + idx[0]) / SR, (i0 + idx[-1]) / SR
def wlen(word):
    p = f'{HERE}/tmp.wav'
    subprocess.run([PIPER, '-m', MODEL, '-f', p], input=word.strip(',.?!').encode(), check=True, capture_output=True)
    with wave.open(p) as w2: y = np.frombuffer(w2.readframes(w2.getnframes()), np.int16) / 32768.0
    e = np.convolve(np.abs(y), np.ones(220) / 220, 'same'); i = np.where(e > 0.012)[0]; os.remove(p)
    return max(0.08, (i[-1] - i[0]) / 22050 if len(i) else 0.1) + (0.12 if word[-1] in ',.?!' else 0)
out = []
for k, (lid, text) in enumerate(LINES):
    a = CAP[k] / 30; b = CAP[k + 1] / 30 if k + 1 < len(CAP) else dur
    s, e = span(a, b)
    ws = text.split(' '); d = [wlen(w) for w in ws]; tot = sum(d); acc = 0; words = []
    for w, dd in zip(ws, d):
        words.append({'w': w, 's': round(s + acc / tot * (e - s), 3), 'e': round(s + (acc + dd) / tot * (e - s), 3)}); acc += dd
    out.append({'id': lid, 'text': text, 'start': round(s, 3), 'end': round(e, 3), 'words': words})
    print(lid, round(s * 30), round(e * 30), text)
json.dump({'duration': round(dur, 3), 'lines': out}, open(os.path.join(HERE, '..', 'timings.json'), 'w'), indent=1)
