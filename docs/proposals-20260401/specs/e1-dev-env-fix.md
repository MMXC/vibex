# Spec: E1 - 开发环境阻塞修复

## 概述
修复 3 个阻塞 CI/CD 的开发环境问题。

## F1.1: Backend TypeScript pre-test

### 问题
`pretest` 脚本因 `tsconfig.json` 的 `strict` 溢出导致 CI 失败。

### 规格
- 文件: `backend/package.json`
- 修复方式: 将 `pretest` 中的 `tsc --noEmit` 替换为 `tsc --noEmit --project tsconfig.json`
- 约束: 不得降低原有类型检查严格度

### 验收
```typescript
// e1-s1.test.ts
test('backend pretest passes', async () => {
  const result = await exec('npm run pretest', { cwd: 'backend' });
  expect(result.exitCode).toBe(0);
});
```

---

## F1.2: Frontend TypeScript pre-test

### 问题
`npx tsc --noEmit` 报出 0 error 后 CI pre-test 仍然失败。

### 规格
- 文件: `frontend/package.json`, `frontend/tsconfig.json`
- 修复方式: 调整 `tsconfig.json` 中 `include` 路径，排除 test 文件的 circular deps
- 验证: `npx tsc --noEmit` 返回 0 error

### 验收
```typescript
// e1-s2.test.ts
test('frontend tsc passes', async () => {
  const result = await exec('npx tsc --noEmit', { cwd: 'frontend' });
  expect(result.stderr).not.toContain('error TS');
  expect(result.exitCode).toBe(0);
});
```

---

## F1.3: task_manager.py 文件锁 Bug

### 问题
并发调用 `claim` 时，文件锁未正确释放导致 `FileNotFoundError`。

### 规格
- 文件: `~/.openclaw/skills/team-tasks/scripts/task_manager.py`
- 修复方式: 使用 `fcntl.flock()` 替代手写锁文件；`finally` 块确保释放
- 约束: 锁超时 30s，自动释放

### 验收
```typescript
// e1-s3.test.ts
test('concurrent claims do not deadlock', async () => {
  const results = await Promise.all([
    exec('python3 task_manager.py claim test-project s1 --agent dev'),
    exec('python3 task_manager.py claim test-project s2 --agent dev'),
    exec('python3 task_manager.py claim test-project s3 --agent dev'),
  ]);
  // 最多 1 个成功，其他应报锁占用
  const successes = results.filter(r => r.exitCode === 0);
  expect(successes.length).toBeLessThanOrEqual(1);
});
```
