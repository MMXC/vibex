#!/usr/bin/env node
// @ts-nocheck
/**
 * Component Registry Verification Script
 * 组件注册表验证脚本 - 用于 CI 检查
 * 
 * 用法: node scripts/verify-components.js
 */

const fs = require('fs');
const path = require('path');

// 扫描组件目录
function scanComponents() {
  const componentsDir = path.join(__dirname, '../src/components');
  const components = [];
  
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !file.startsWith('.')) {
        // 检查是否有对应的 index.tsx 或 Page
        const hasComponent = fs.existsSync(path.join(fullPath, 'index.tsx')) ||
                           fs.existsSync(path.join(fullPath, 'index.ts')) ||
                           fs.existsSync(path.join(fullPath, `${file}.tsx`));
        
        if (hasComponent) {
          components.push(file);
        }
        
        walk(fullPath);
      }
    }
  }
  
  walk(componentsDir);
  return components;
}

// 主验证逻辑
function verify() {
  console.log('\n🔍 Verifying Component Integration...\n');
  
  const components = scanComponents();
  console.log(`Found ${components.length} components in src/components/`);
  
  // 检查组件注册表
  let registryExists = false;
  let registryContent = '';
  
  try {
    const registryPath = path.join(__dirname, '../src/lib/componentRegistry.ts');
    registryExists = fs.existsSync(registryPath);
    if (registryExists) {
      registryContent = fs.readFileSync(registryPath, 'utf8');
    }
  } catch (e) {
    // ignore
  }
  
  console.log(`ComponentRegistry: ${registryExists ? '✅ exists' : '❌ missing'}`);
  
  // 检查每个主要组件是否被页面使用
  const pagesDir = path.join(__dirname, '../src/app');
  const usedComponents = new Set();
  
  function scanPages(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanPages(fullPath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // 检查组件导入
        const importMatches = content.match(/import\s+.*\s+from\s+['"]@\/components\/([^'"]+)['"]/g);
        if (importMatches) {
          importMatches.forEach(m => {
            const match = m.match(/from\s+['"]@\/components\/([^'"]+)['"]/);
            if (match) {
              usedComponents.add(match[1].split('/')[0]);
            }
          });
        }
      }
    }
  }
  
  scanPages(pagesDir);
  
  console.log(`\n📊 Integration Status:`);
  console.log(`   Components in src/components/: ${components.length}`);
  console.log(`   Components used in pages: ${usedComponents.size}`);
  
  const unused = components.filter(c => !usedComponents.has(c));
  if (unused.length > 0) {
    console.log(`\n⚠️  Potentially unused components:`);
    unused.forEach(c => console.log(`   - ${c}`));
  } else {
    console.log(`\n✅ All components are used in pages`);
  }
  
  // 输出结果
  console.log('\n' + '=' .repeat(50));
  
  if (registryExists && usedComponents.size > 0) {
    console.log('✅ Component verification PASSED\n');
    process.exit(0);
  } else if (!registryExists) {
    console.log('⚠️  ComponentRegistry not found - please create it\n');
    process.exit(1);
  } else {
    console.log('❌ Component verification FAILED\n');
    process.exit(1);
  }
}

verify();
