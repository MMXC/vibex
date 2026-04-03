// @ts-nocheck
const puppeteer = require('/usr/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer-core');
const fs = require('fs');

const BASE = '/root/.openclaw/vibex/docs';

async function screenshot(htmlPath, outPath) {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 800 });
  const html = fs.readFileSync(htmlPath, 'utf8');
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: outPath, fullPage: false });
  await browser.close();
  console.log('Saved:', outPath);
}

(async () => {
  await screenshot(BASE + '/homepage-collapsed.html', BASE + '/homepage-collapsed.png');
  await screenshot(BASE + '/homepage-expanded.html', BASE + '/homepage-expanded.png');
})().catch(console.error);
