# Feature: Next.js 升级验证与遗留项跟踪

## Jobs-To-Be-Done
- 作为开发者，我需要确认 Next.js 16.1.6 → 16.2.0 升级已完成且构建正常，以便系统安全补丁及时生效。

## Requirements
- [ ] (F1.1) 确认 package.json 声明 next@16.2.0
- [ ] (F1.2) npm run build 成功，35个页面全部构建
- [ ] (F1.3) @sentry/nextjs 兼容性验证（Sentry 功能正常）
- [ ] (F1.4) API routes 和 Middleware 功能验证

## Acceptance Criteria
- [ ] AC1: expect(JSON.parse(readFileSync('package.json')).dependencies.next).toMatch(/16\.2\.0/)
- [ ] AC2: expect(execSync('npm run build', {cwd: 'vibex-fronted'}).status).toBe(0)
- [ ] AC3: Sentry 错误追踪功能验证通过（生产环境）
- [ ] AC4: API routes 和 Middleware 手动测试通过
