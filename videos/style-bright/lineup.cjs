const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', (e) => console.log('ERR', e.message));
  await p.goto('http://localhost:8768/web/index.html'); await p.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
  const d = await p.evaluate(() => window.lineup()); fs.writeFileSync('out/lineup.jpg', Buffer.from(d.split(',')[1], 'base64'));
  await b.close();
})();
