// @ts-nocheck
const puppeteer = require('/usr/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer-core');
const fs = require('fs');

async function generate() {
  const mermaidChart = fs.readFileSync('flow.mmd', 'utf8');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 2400, height: 1600 });

  // Download mermaid locally
  const mermaidJs = await page.goto('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js', {
    waitUntil: 'networkidle0',
    timeout: 60000
  });
  
  const mermaidCode = await mermaidJs.buffer();
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 20px; background: white; }
    pre.mermaid { display: flex; justify-content: center; }
  </style>
</head>
<body>
<pre class="mermaid">
${mermaidChart}
</pre>
<script>
${mermaidCode}
</script>
<script>
  mermaid.initialize({ startOnLoad: true, theme: 'default' });
</script>
</body>
</html>`;

  await page.setContent(html);
  await page.waitForSelector('.mermaid svg', { timeout: 60000 });
  await page.screenshot({ path: 'flow.png', fullPage: false });

  await browser.close();
  console.log('Image generated: flow.png');
}

generate().catch(console.error);
