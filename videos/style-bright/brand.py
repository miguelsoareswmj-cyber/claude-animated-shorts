"""Channel art: banner 2560x1440 (all text/mascots inside YouTube's 1546x423 safe area) and an 800x800 profile picture."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
F = '/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf'; FB = '/usr/share/fonts/opentype/inter/Inter-Bold.otf'
INK = (38, 32, 46); Y = (255, 209, 58); WH = (255, 255, 255); BLUE = (76, 201, 240)
def outlined(d, xy, text, font, fill, stroke=None, shadow=True, anchor='mm'):
    sw = stroke or max(4, font.size // 9)
    if shadow: d.text((xy[0] + font.size * 0.05, xy[1] + font.size * 0.07), text, font=font, fill=INK, stroke_width=sw, stroke_fill=INK, anchor=anchor)
    d.text(xy, text, font=font, fill=fill, stroke_width=sw, stroke_fill=INK, anchor=anchor)
def cast(name, h):
    im = Image.open(f'out/cast_{name}.png').convert('RGBA'); bb = im.getbbox(); im = im.crop(bb)
    return im.resize((int(im.width * h / im.height), h), Image.LANCZOS)

# ---------------- banner ----------------
bg = Image.open('out/banner_bg.png').convert('RGB')
bg = ImageEnhance.Color(bg).enhance(1.2)
W, H = bg.size; S = (507, 508, 2053, 931)  # safe area
blur = bg.filter(ImageFilter.GaussianBlur(3))
band = Image.new('L', (W, H), 0); db = ImageDraw.Draw(band); db.rounded_rectangle((S[0] - 40, S[1] - 20, S[2] + 40, S[3] + 20), 70, fill=190)
band = band.filter(ImageFilter.GaussianBlur(40))
img = Image.composite(Image.new('RGB', (W, H), (255, 255, 255)), blur, band).convert('RGBA')
d = ImageDraw.Draw(img)
# mascots at the two ends of the safe area
c1 = cast('curly', 405); img.alpha_composite(c1, (S[0] + 10, S[3] - c1.height - 8))
c2 = cast('jay', 395); img.alpha_composite(c2, (S[2] - c2.width - 10, S[3] - c2.height - 8))
c3 = cast('mia', 300); img.alpha_composite(c3.transpose(Image.FLIP_LEFT_RIGHT), (S[2] - c2.width - c3.width + 60, S[3] - c3.height - 12))
cx = (S[0] + S[2]) // 2 - 60
outlined(d, (cx, 630), 'CURLY WHAT IF', ImageFont.truetype(F, 120), Y)
outlined(d, (cx, 745), 'What if it happened to YOU?', ImageFont.truetype(F, 54), WH)
# little badge
bf = ImageFont.truetype(FB, 40); t = 'New "what if" every week'; tw = d.textlength(t, font=bf)
d.rounded_rectangle((cx - tw / 2 - 30, 810, cx + tw / 2 + 30, 870), 30, fill=BLUE, outline=INK, width=6)
d.text((cx, 840), t, font=bf, fill=WH, anchor='mm')
img.convert('RGB').save('../../channel/banner_2560x1440.jpg', quality=93)
# preview with safe-area guides (for checking only)
pv = img.convert('RGB').copy(); dp = ImageDraw.Draw(pv); dp.rectangle(S, outline=(255, 0, 0), width=6)
pv.resize((1280, 720)).save('out/banner_preview_guides.jpg', quality=85)

# ---------------- profile picture ----------------
P = 800
pfp = Image.new('RGBA', (P, P)); dg = ImageDraw.Draw(pfp)
for y in range(P):
    t = y / P; col = tuple(int(a + (b - a) * t) for a, b in zip((124, 200, 255), (110, 230, 200))); dg.line([(0, y), (P, y)], fill=col + (255,))
for r, a in [(330, 60), (260, 60)]: dg.ellipse((P / 2 - r, P / 2 - r + 40, P / 2 + r, P / 2 + r + 40), fill=(255, 255, 255, a))
head = Image.open('out/cast_pfp.png').convert('RGBA').crop((60, 0, 540, 560))
head = head.resize((int(head.width * 1.42), int(head.height * 1.42)), Image.LANCZOS)
pfp.alpha_composite(head, ((P - head.width) // 2, 40))
mask = Image.new('L', (P, P), 0); ImageDraw.Draw(mask).ellipse((0, 0, P, P), fill=255)
out = Image.new('RGBA', (P, P), (0, 0, 0, 0)); out.paste(pfp, (0, 0), mask)
pfp.convert('RGB').save('../../channel/profile_800.png')
out.save('out/pfp_circle_preview.png')
print('ok')
