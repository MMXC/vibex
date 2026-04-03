// @ts-nocheck
const puppeteer = require('/usr/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

const HTML_PATH = '/root/.openclaw/vibex/docs/homepage-demo.html';

async function takeScreenshot(outPath) {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  
  await new Promise(r => setTimeout(r, 1000));
  
  await page.screenshot({ path: outPath, fullPage: false });
  await browser.close();
  console.log('Screenshot saved:', outPath);
}

takeScreenshot('/root/.openclaw/vibex/docs/homepage-collapsed.png')
  .then(() => takeScreenshot('/root/.openclaw/vibex/docs/homepage-expanded.png'))
  .catch(console.error);
