const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', (e) => console.log('ERR', e.message));
  await p.goto('http://localhost:8768/web/index.html'); await p.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
  const save = (f, d) => fs.writeFileSync(f, Buffer.from(d.split(',')[1], 'base64'));
  const cast = {
    curly: { mood: 'happy', arms: 'up' },
    mia: { shirt: '#ffc93c', shirt2: '#4cc9f0', pants: '#2a9d8f', shoe: '#7b5cff', hair: '#e07a2b', skin: '#f6d2b0', mood: 'smug', arms: 'point' },
    jay: { shirt: '#7b5cff', shirt2: '#ffd166', pants: '#ff8fab', shoe: '#2ec4b6', hair: '#1b1b2f', skin: '#c98a5a', mood: 'shock', arms: 'up', prop: 'sweat' },
    pfp: { mood: 'happy', arms: 'down' },
  };
  for (const [k, o] of Object.entries(cast)) save(`out/cast_${k}.png`, await p.evaluate((o) => window.personPNG(o), o));
  save('out/banner_bg.png', await p.evaluate(() => window.renderAt(2560, 1440, 'banner')));
  await b.close();
})();
