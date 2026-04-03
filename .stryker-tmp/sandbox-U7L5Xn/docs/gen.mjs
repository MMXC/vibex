// @ts-nocheck
import { execSync } from 'child_process';
import fs from 'fs';

const mmdcCmd = '/usr/bin/mmdc';

const config = {
  puppeteerConfig: {
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  }
};

// Write config to a temp file
fs.writeFileSync('/tmp/mmdc-config.json', JSON.stringify(config));

try {
  execSync(`${mmdcCmd} -i flow.mmd -o flow.png -w 2400 -H 1600 -b white -p /tmp/mmdc-config.json`, {
    stdio: 'inherit',
    env: { ...process.env, PUPPETEER_ARGS: '--no-sandbox --disable-setuid-sandbox' }
  });
  console.log('Image generated!');
} catch (e) {
  console.error('Error:', e.message);
}
