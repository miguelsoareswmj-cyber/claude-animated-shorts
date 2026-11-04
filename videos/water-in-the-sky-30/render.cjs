// Render frames with headless Chromium: node render.cjs [frames|""] [outdir] [step]
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const sel = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
  const out = process.argv[3] || 'frames';
  const range = process.argv[4] ? process.argv[4].split('-').map(Number) : null;
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('PAGE', m.text().slice(0, 300)); });
  p.on('pageerror', (e) => console.log('ERR', e.message));
  await p.goto('http://localhost:8767/web/index.html');
  await p.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
  const total = await p.evaluate(() => window.TOTAL);
  fs.writeFileSync(`${out}/shots.json`, JSON.stringify(await p.evaluate(() => ({ shots: window.SHOTS, key: window.KEY, total: window.TOTAL }))));
  let list = sel || [...Array(total).keys()];
  if (range) list = list.filter((f) => f >= range[0] && f < range[1]);
  const t0 = Date.now();
  for (const f of list) {
    await p.evaluate((f) => window.renderFrame(f), f);
    await p.screenshot({ path: `${out}/f${String(f).padStart(4, '0')}.png` });
    if (f % 50 === 0) console.log('frame', f, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  await b.close();
})();
