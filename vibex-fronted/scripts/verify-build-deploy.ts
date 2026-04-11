/**
 * verify-build-deploy.ts — Epic3 F3.1 + F3.2 验证脚本
 *
 * 用法:
 *   npx ts-node scripts/verify-build-deploy.ts
 *
 * F3.1 构建验证: pnpm build exit code === 0
 * F3.2 部署验证: 静态导出产物检查
 *
 * 注意: Dev server (pnpm dev) 与 output:export + middleware 存在已知冲突。
 * 生产部署使用静态导出 (pnpm build → out/)，无需 dev server。
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

// 直接使用绝对路径，避免 __dirname 问题
const FRONTEND_DIR = '/root/.openclaw/vibex/vibex-fronted';

function log(label: string, status: 'PASS' | 'FAIL' | 'INFO', detail?: string) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : 'ℹ️';
  console.log(`${icon} ${label}: ${status}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  console.log('=== Epic3 Build & Deploy Verification ===\n');

  // F3.1: Build verification
  log('F3.1.1 Build 命令', 'INFO', '执行 pnpm build...');
  try {
    execSync('pnpm build', { cwd: FRONTEND_DIR, stdio: 'pipe', timeout: 300000 });
    log('F3.1.1 Build Exit Code', 'PASS', 'exit code = 0');
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    log('F3.1.1 Build Exit Code', 'FAIL', `exit code = ${err.status ?? 'unknown'}`);
    log('F3.1.2 Error', 'FAIL', err.message ?? String(e));
    process.exit(1);
  }

  // F3.1.2: 构建产物存在
  const outDir = join(FRONTEND_DIR, 'out');
  const hasOutDir = existsSync(outDir);
  log('F3.1.2 out/ 目录', hasOutDir ? 'PASS' : 'FAIL', hasOutDir ? '存在' : '不存在');

  if (hasOutDir) {
    const cssDir = join(outDir, '_next', 'static', 'css');
    const cssFiles = existsSync(cssDir) ? readdirSync(cssDir).filter(f => f.endsWith('.css')) : [];
    log('F3.1.3 CSS 文件数量', cssFiles.length > 0 ? 'PASS' : 'FAIL', `${cssFiles.length} 个 CSS 文件`);
  }

  // F3.1.4: CSS 中无 undefined
  try {
    const cssDir = join(outDir, '_next', 'static', 'chunks');
    if (existsSync(cssDir)) {
      const cssFiles = readdirSync(cssDir).filter(f => f.endsWith('.css'));
      let hasUndefined = false;
      for (const file of cssFiles) {
        const content = readFileSync(join(cssDir, file), 'utf-8');
        if (content.includes('undefined')) {
          hasUndefined = true;
          break;
        }
      }
      log('F3.1.4 CSS 无 undefined', hasUndefined ? 'FAIL' : 'PASS', hasUndefined ? '发现 undefined' : '无 undefined');
    }
  } catch {
    log('F3.1.4 CSS 检查', 'FAIL', '无法读取 CSS 文件');
  }

  // F3.2: 静态导出验证
  const canvasHtml = join(outDir, 'canvas.html');
  const hasCanvas = existsSync(canvasHtml);
  log('F3.2.1 canvas.html 存在', hasCanvas ? 'PASS' : 'FAIL', hasCanvas ? '存在' : '不存在');

  if (hasCanvas) {
    const content = readFileSync(canvasHtml, 'utf-8');
    const keyComponents = [
      { name: 'TabBar', pattern: 'tabbar-module__' },
      { name: 'ExportMenu', pattern: 'exportmenu-module__' },
      { name: 'leftDrawer', pattern: 'leftdrawer-module__' },
    ];
    for (const comp of keyComponents) {
      const hasClass = content.toLowerCase().includes(comp.pattern.toLowerCase());
      log(`F3.2.2 ${comp.name} CSS Module`, hasClass ? 'PASS' : 'FAIL', hasClass ? '存在' : '不存在');
    }
  }

  console.log('\n=== 验证完成 ===');
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
