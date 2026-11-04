const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', (e) => console.log('ERR', e.message)); p.on('console', (m) => { if (m.type() === 'error') console.log('PAGE', m.text()); });
  await p.goto('http://localhost:8768/web/index.html'); await p.waitForFunction(() => window.READY === true, null, { timeout: 120000 });
  for (const s of process.argv.slice(2)) { await p.evaluate((s) => window.shot(s), s); await p.screenshot({ path: `out/${s}.png` }); }
  await b.close();
})();
