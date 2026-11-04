"""Vertical Shorts covers (1080x1920) from rendered frames + bold outlined text."""
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
FONT = '/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf'
def make(frame, lines, out, y0=150, arrow=None):
    im = Image.open(frame).convert('RGB')
    im = ImageEnhance.Color(im).enhance(1.25); im = ImageEnhance.Contrast(im).enhance(1.08)
    # darken the text band a little so the words pop
    shade = Image.new('L', im.size, 0); ds = ImageDraw.Draw(shade)
    for i in range(560): ds.line([(0, y0 - 80 + i), (1080, y0 - 80 + i)], fill=int(120 * (1 - abs(i - 280) / 280)))
    im = Image.composite(Image.new('RGB', im.size, (0, 0, 0)), im, shade.filter(ImageFilter.GaussianBlur(30)))
    d = ImageDraw.Draw(im); y = y0
    for text, size, col in lines:
        f = ImageFont.truetype(FONT, size)
        while d.textlength(text, font=f) > 1000: size -= 4; f = ImageFont.truetype(FONT, size)
        w = d.textlength(text, font=f); x = (1080 - w) / 2
        d.text((x + 8, y + 10), text, font=f, fill=(0, 0, 0), stroke_width=int(size * 0.11), stroke_fill=(0, 0, 0))
        d.text((x, y), text, font=f, fill=col, stroke_width=int(size * 0.09), stroke_fill=(0, 0, 0))
        y += int(size * 1.08)
    if arrow:  # simple bold red arrow (x0,y0)->(x1,y1)
        (ax, ay), (bx, by) = arrow
        import math
        a = math.atan2(by - ay, bx - ax); L = 70
        for wdt, colr in [(44, (0, 0, 0)), (30, (235, 40, 40))]:
            d.line([(ax, ay), (bx, by)], fill=colr, width=wdt)
            p1 = (bx + L * math.cos(a + 2.5), by + L * math.sin(a + 2.5)); p2 = (bx + L * math.cos(a - 2.5), by + L * math.sin(a - 2.5))
            d.polygon([(bx + 18 * math.cos(a), by + 18 * math.sin(a)), p1, p2], fill=colr)
    im.save(out, quality=95)
Y = (255, 216, 58); Wt = (255, 255, 255)
make('frames/f0630.png', [("ALL OF EARTH'S WATER", 104, Wt), ("IS IN THE SKY", 150, Y)], 'final/thumbnail_whale.jpg', y0=170)
make('frames/f0760.png', [("THE WAVES ARE", 120, Wt), ("KILOMETERS TALL", 132, Y)], 'final/thumbnail_wave.jpg', y0=170)
