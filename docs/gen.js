const puppeteer = require('/usr/lib/node_modules/@mermaid-js/mermaid-cli/node_modules/puppeteer-core');
const fs = require('fs');

async function gen(inFile, outFile) {
  const chart = fs.readFileSync(inFile, 'utf8');
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 2400, height: 1600 });
  
  const mermaidJs = await page.goto('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js', {
    waitUntil: 'networkidle0',
    timeout: 60000
  });
  const mermaidCode = await mermaidJs.buffer();
  
  const html = '<!DOCTYPE html><html><head><style>body{margin:20px;background:white}</style></head><body><pre class="mermaid">'+chart.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</pre><script>'+mermaidCode.toString()+'</script><script>mermaid.initialize({startOnLoad:true})</script></body></html>';
  
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForSelector('.mermaid svg', { timeout: 60000 });
  await page.screenshot({ path: outFile, fullPage: false });
  await browser.close();
  console.log('Generated:', outFile);
}

const args = process.argv.slice(2);
gen(args[0], args[1]).catch(console.error);
