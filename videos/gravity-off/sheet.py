import sys, glob
from PIL import Image, ImageDraw
d=sys.argv[1]; out=sys.argv[2]; cols=int(sys.argv[3]) if len(sys.argv)>3 else 7
fs=sorted(glob.glob(d+'/f*.png'))
w,h=240,427
rows=(len(fs)+cols-1)//cols
S=Image.new('RGB',(cols*w,rows*(h+18)),'white'); D=ImageDraw.Draw(S)
for i,f in enumerate(fs):
    im=Image.open(f).convert('RGB').resize((w,h)); x=(i%cols)*w; y=(i//cols)*(h+18)
    S.paste(im,(x,y+18)); D.text((x+4,y+3),f.split('/')[-1],fill='black')
S.save(out,quality=85)
