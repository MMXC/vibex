// @ts-nocheck
import puppeteer from '/usr/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer-core/index.js';
import fs from 'fs';

const mermaidChart = fs.readFileSync('flow.mmd', 'utf8');

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/chromium-browser',
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
});

const page = await browser.newPage();
await page.setViewport({ width: 2400, height: 1600 });

const html = `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
</head>
<body>
<pre class="mermaid">
${mermaidChart}
</pre>
<script>
  mermaid.initialize({ startOnLoad: true, theme: 'default' });
</script>
</body>
</html>`;

await page.setContent(html);
await page.waitForSelector('.mermaid svg', { timeout: 30000 });
await page.screenshot({ path: 'flow.png', fullPage: false });

await browser.close();
console.log('Image generated: flow.png');
