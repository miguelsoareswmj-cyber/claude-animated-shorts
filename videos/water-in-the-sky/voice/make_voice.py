"""Synthesize the narration phrase by phrase with Piper (en_US-joe-medium, CC0),
trim silences, join with fixed gaps, and write voice.wav (48 kHz) + timings.json."""
import json, subprocess, sys, wave, os
import numpy as np
from scipy import signal
HERE = os.path.dirname(os.path.abspath(__file__))
PIPER, MODEL = sys.argv[1], sys.argv[2]
LS = float(sys.argv[3]) if len(sys.argv) > 3 else 0.86
lines = json.load(open(f'{HERE}/lines.json'))
SR = 48000; LEAD = 0.07
out = [np.zeros(int(LEAD * SR))]; t = LEAD; tim = []
for lid, text, gap in lines:
    wav = f'{HERE}/tmp_{lid}.wav'
    subprocess.run([PIPER, '-m', MODEL, '--length-scale', str(LS), '--noise-scale', '0.6', '--noise-w-scale', '0.7', '-f', wav],
                   input=text.encode(), check=True, capture_output=True)
    with wave.open(wav) as w: sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768.0
    x = signal.resample_poly(x, 320, 147)
    e = np.convolve(np.abs(x), np.ones(480) / 480, 'same'); thr = 0.012
    idx = np.where(e > thr)[0]; a = max(0, idx[0] - 480); b = min(len(x), idx[-1] + 960)
    x = x[a:b]
    tim.append({'id': lid, 'text': text, 'start': round(t, 3), 'end': round(t + len(x) / SR, 3)})
    out += [x, np.zeros(int(gap * SR))]; t += len(x) / SR + gap
    os.remove(wav)
v = np.concatenate(out + [np.zeros(int(0.25 * SR))])
# voice chain: highpass, gentle presence, compress
v = signal.sosfilt(signal.butter(2, 85, 'high', fs=SR, output='sos'), v)
pres = signal.sosfilt(signal.butter(2, [2500, 6000], 'band', fs=SR, output='sos'), v); v = v + 0.25 * pres
env = signal.sosfilt(signal.butter(1, 12, 'low', fs=SR, output='sos'), np.abs(v)) + 1e-6
g = np.minimum(1, (env / 0.12) ** -0.5); v = v * g
v *= 0.89 / np.max(np.abs(v))
with wave.open(f'{HERE}/voice.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((v * 32767).astype(np.int16).tobytes())
json.dump({'duration': round(len(v) / SR, 3), 'lines': tim}, open(f'{HERE}/timings.json', 'w'), indent=1)
words = sum(len(l[1].split()) for l in lines)
print('duration', len(v) / SR, 'words', words, 'wps', words / t)
for x in tim: print(x['id'], x['start'], x['end'])
