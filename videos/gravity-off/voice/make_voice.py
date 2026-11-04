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
    subprocess.run([PIPER, '-m', MODEL, '--length-scale', str(LS), '--noise-scale', '0.72', '--noise-w-scale', '0.8', '-f', wav],
                   input=text.encode(), check=True, capture_output=True)
    with wave.open(wav) as w: sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768.0
    x = signal.resample_poly(x, 320, 147)
    e = np.convolve(np.abs(x), np.ones(480) / 480, 'same'); thr = 0.012
    idx = np.where(e > thr)[0]; a = max(0, idx[0] - 480); b = min(len(x), idx[-1] + 960)
    x = x[a:b]
    # word timings: synthesize each word alone, share the phrase duration by those durations
    ws = text.split(' '); wd = []
    for wi, wtxt in enumerate(ws):
        ww = f'{HERE}/tmp_w.wav'
        subprocess.run([PIPER, '-m', MODEL, '--length-scale', str(LS), '-f', ww], input=wtxt.strip(',.?!').encode(), check=True, capture_output=True)
        with wave.open(ww) as w2: y = np.frombuffer(w2.readframes(w2.getnframes()), np.int16) / 32768.0
        ey = np.convolve(np.abs(y), np.ones(220) / 220, 'same'); iy = np.where(ey > thr)[0]
        wd.append(max(0.08, (iy[-1] - iy[0]) / 22050 if len(iy) else 0.1) + (0.12 if wtxt[-1] in ',.?!' else 0))
        os.remove(ww)
    tot = sum(wd); dur = len(x) / SR; acc = 0; words = []
    for wtxt, d in zip(ws, wd):
        words.append({'w': wtxt, 's': round(t + acc / tot * dur, 3), 'e': round(t + (acc + d) / tot * dur, 3)}); acc += d
    tim.append({'id': lid, 'text': text, 'start': round(t, 3), 'end': round(t + len(x) / SR, 3), 'words': words})
    out += [x, np.zeros(int(gap * SR))]; t += len(x) / SR + gap
    os.remove(wav)
v = np.concatenate(out + [np.zeros(int(0.25 * SR))])
# match the reference narrator: ~+2 semitones, a touch brighter (measured: F0 125 Hz vs 99 Hz, more 1-4 kHz)
SHIFT = float(os.environ.get('VOICE_SHIFT', '2.0'))
if SHIFT:
    import librosa
    v = librosa.effects.pitch_shift(v.astype(np.float32), sr=SR, n_steps=SHIFT, res_type='soxr_hq').astype(float)
# voice chain: highpass, gentle presence, compress
v = signal.sosfilt(signal.butter(2, 85, 'high', fs=SR, output='sos'), v)
pres = signal.sosfilt(signal.butter(2, [1800, 5000], 'band', fs=SR, output='sos'), v); v = v + 0.45 * pres
env = signal.sosfilt(signal.butter(1, 12, 'low', fs=SR, output='sos'), np.abs(v)) + 1e-6
g = np.minimum(1, (env / 0.12) ** -0.5); v = v * g
v *= 0.89 / np.max(np.abs(v))
with wave.open(f'{HERE}/voice.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((v * 32767).astype(np.int16).tobytes())
json.dump({'duration': round(len(v) / SR, 3), 'lines': tim}, open(f'{HERE}/timings.json', 'w'), indent=1)
words = sum(len(l[1].split()) for l in lines)
print('duration', len(v) / SR, 'words', words, 'wps', words / t)
for x in tim: print(x['id'], x['start'], x['end'])
