import json, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
W,H=2048,1024
img=Image.new('L',(W,H),0); d=ImageDraw.Draw(img)
g=json.load(open('land.geojson'))
def P(ring):
    return [((lon+180)/360*W,(90-lat)/180*H) for lon,lat in ring]
feats=g['features'] if 'features' in g else [g]
for f in feats:
    geom=f['geometry']; polys=geom['coordinates'] if geom['type']=='MultiPolygon' else [geom['coordinates']]
    for poly in polys:
        for k,ring in enumerate(poly):
            u=[list(ring[0])]
            for lon,lat in ring[1:]:
                pl=u[-1][0]
                while lon-pl>180: lon-=360
                while lon-pl<-180: lon+=360
                u.append([lon,lat])
            for off in (-360,0,360):
                pts=[(lo+off,la) for lo,la in u]
                if max(abs(p[0]) for p in pts)>540: continue
                d.polygon(P(pts),fill=255 if k==0 else 0)
land=np.array(img)>127
# antarctica fill bottom
land[int(H*0.93):,:]=True
# distance from coast in km (approx, scale x by cos lat)
lat=(0.5-(np.arange(H)+0.5)/H)*np.pi
km_per_px=40075/W
# periodic in x: tile
big=np.concatenate([~land[:,-256:],~land,~land[:,:256]],axis=1)
dist=ndimage.distance_transform_edt(big)[:,256:-256]*km_per_px
dist*=np.clip(np.cos(lat)[:,None]*0.6+0.4,0.4,1)
rng=np.random.default_rng(3)
def noise(sc,oct=4):
    out=np.zeros((H,W))
    for o in range(oct):
        s=sc*2**o; n=rng.standard_normal((int(H/s)+3,int(W/s)+3))
        n=ndimage.zoom(n,s,order=3)[:H,:W]; out+=n/(1.7**o)
    return out
n=noise(64)
# depth profile (m, negative)
shelf=np.clip(dist/120,0,1)*-180
slope=np.clip((dist-120)/220,0,1)**0.8*-3800
abyss=np.clip((dist-340)/900,0,1)*-1500
depth=shelf+slope+abyss+n*350*np.clip(dist/400,0,1)
# mid-ocean ridges: local maxima of distance -> ridge
dmax=ndimage.maximum_filter(dist,size=41,mode='wrap')
ridge=np.exp(-((dmax-dist)/60)**2)*np.clip((dist-500)/400,0,1)
depth+=ridge*2600
# trenches (lon,lat path, width)
tr=[[(142,12),(146,18),(147,25),(142,33),(144,40),(150,46),(160,52),(175,51),(190,51),(205,55)],
    [(-80,-5),(-78,-12),(-73,-20),(-72,-30),(-74,-40),(-76,-48)],
    [(105,-10),(115,-11),(125,-10)],[(-175,-15),(-174,-22),(-177,-30),(-178,-37)],[(-62,19),(-66,20)]]
T=Image.new('L',(W,H),0); td=ImageDraw.Draw(T)
for p in tr:
    for off in (0,-360): td.line(P([(a+off,b) for a,b in p]),fill=255,width=10)
Tm=ndimage.gaussian_filter(np.array(T)/255.0,4)
depth-=Tm*5500*np.clip(dist/150,0,1)
depth=np.where(land,0,np.minimum(depth,-20))
dep=np.clip(-depth/11000,0,1)
# land elevation-ish noise for coloring
ln=(noise(48,5)*0.5+0.5).clip(0,1)
Image.fromarray(np.dstack([land*255,(dep*255),(ln*255),ridge.clip(0,1)*255]).astype(np.uint8),'RGBA').save('earthmap.png')
print(depth.min(), (dep>0).mean())
Image.fromarray((dep*255).astype(np.uint8)).resize((1024,512)).save('dep_preview.png')
# land distance-from-coast (km / 3000) for the inland tsunami fronts
ld = ndimage.distance_transform_edt(np.concatenate([land[:, -256:], land, land[:, :256]], axis=1))[:, 256:-256] * km_per_px
ld *= np.clip(np.cos(lat)[:, None] * 0.6 + 0.4, 0.4, 1)
Image.fromarray((np.clip(ld / 3000, 0, 1) * 255).astype(np.uint8)).save('landdist.png')
print('landdist max km', ld.max())
