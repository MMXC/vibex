# Spec: E2 - heartbeat + changelog 自动化

## 概述
消除 heartbeat 幽灵任务误报 + 建立 changelog 自动生成体系。

## F2.1: 幽灵任务检测

### 规格
- 定义: startedAt 有值 + completedAt 为 null + 时间差 > 60min
- 检测: heartbeat 扫描时检查所有 active 任务
- 修复: 主动更新 completedAt 或标记 `ghost: true`

### 验收
```typescript
test('ghost task with activeMinutes > 60 is detected', () => {
  const tasks = [
    { id: 'task-1', startedAt: Date.now() - 65 * 60 * 1000, completedAt: null }
  ];
  const ghostTasks = detectGhostTasks(tasks);
  expect(ghostTasks.length).toBe(1);
  expect(ghostTasks[0].id).toBe('task-1');
});

test('active task with activeMinutes < 60 is NOT ghost', () => {
  const tasks = [
    { id: 'task-2', startedAt: Date.now() - 30 * 60 * 1000, completedAt: null }
  ];
  const ghostTasks = detectGhostTasks(tasks);
  expect(ghostTasks.length).toBe(0);
});
```

---

## F2.2: 虚假完成检测

### 规格
- 定义: 状态 done 但 output 文件不存在
- 检测: heartbeat 扫描时校验 output 路径
- 修复: 更新状态为 `fake-done` + 通知 coordinator

### 验收
```typescript
test('fake done task (done but no output) is detected', () => {
  const outputDir = 'projects/proposals-20260401-3/tasks/';
  // No file in outputDir for task create-prd
  const task = { id: 'create-prd', status: 'done' };
  const isFake = checkOutputExists(task, outputDir) === false;
  expect(isFake).toBe(true);
});
```

---

## F2.3: changelog-gen CLI

### 规格
- 命令: `changelog-gen --from=<tag> --to=HEAD`
- 输入: git log（Angular commit format: `type(scope): message`）
- 输出: CHANGELOG.md（按 type 分组：Features / Bug Fixes / Docs / etc.）
- 类型: feat, fix, docs, style, refactor, test, chore

### 验收
```typescript
test('changelog-gen exits with code 0', async () => {
  const result = await exec('changelog-gen --from=v1.0 --to=HEAD');
  expect(result.exitCode).toBe(0);
});

test('generated changelog contains Features section', async () => {
  const content = await exec('changelog-gen --from=v1.0 --to=HEAD').then(r => r.stdout);
  expect(content).toContain('## Features');
});

test('changelog respects Angular commit format', async () => {
  const log = execSync("git log --from=v1.0 --to=HEAD --format='%s'").toString();
  const lines = log.trim().split('\n');
  const angularPattern = /^(\w+)(\([\w-]+\))?: .+/;
  for (const line of lines) {
    if (line.trim()) expect(angularPattern.test(line)).toBe(true);
  }
});
```

---

## F2.4: commit-msg hook

### 规格
- 文件: `.git/hooks/commit-msg`
- 校验: commit message 必须符合 Angular format
- 失败: 非标准格式时 commit 被拒绝（exit 1）
- 安装: `npx simple-git-hooks add-commit-msg .git/hooks/commit-msg`

### 验收
```typescript
test('hook rejects non-angular commit message', async () => {
  const result = await exec("git commit -m 'fixed stuff' .gitignore", { expectFailure: true });
  expect(result.exitCode).not.toBe(0);
});

test('hook accepts angular commit message', async () => {
  const result = await exec("git commit -m 'fix(canvas): correct selection bug' .gitignore");
  expect(result.exitCode).toBe(0);
});
```
