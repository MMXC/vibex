// @ts-nocheck
const puppeteer = require('/usr/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

const MERMAID_PATH = '/usr/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/mermaid/dist/mermaid.min.js';

async function gen(inFile, outFile) {
  const chart = fs.readFileSync(inFile, 'utf8');
  
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 2400, height: 1800 });
  
  const mermaidCode = fs.readFileSync(MERMAID_PATH, 'utf8');
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <style>body{margin:20px;background:white}</style>
</head>
<body>
<pre class="mermaid">${chart.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
<script>${mermaidCode}</script>
<script>mermaid.initialize({startOnLoad:true, theme:'default'});</script>
</body>
</html>`;
  
  await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  // Wait for mermaid to render
  await new Promise(r => setTimeout(r, 5000));
  
  await page.waitForSelector('.mermaid svg', { timeout: 30000 });
  await page.screenshot({ path: outFile, fullPage: false });
  
  await browser.close();
  console.log('Generated:', outFile);
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node gen-local.cjs <input.mmd> <output.png>');
  process.exit(1);
}
gen(args[0], args[1]).catch(e => { console.error(e.message); process.exit(1); });
