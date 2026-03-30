# IMPLEMENTATION_PLAN: vibex-exec-sandbox-freeze

> **项目**: vibex-exec-sandbox-freeze
> **日期**: 2026-03-30
> **更新**: 2026-03-30 22:xx

---

## Epic 状态

| Epic | 名称 | 状态 | DoD |
|------|------|------|-----|
| Epic 1 | 健康检查机制 | ✅ Done | 3/3 |
| Epic 2 | 超时保护 | 🔄 In Progress | 0/3 |
| Epic 3 | 输出恢复 | ⬜ Pending | 0/3 |
| Epic 4 | OpenClaw 源码修复 | ⬜ Pending | 0/3 |

---

## Epic 1: 健康检查机制 ✅

**Commit**: `0f97056d`

### Stories

| Story | 功能 | 状态 | 产出文件 |
|-------|------|------|---------|
| F1.1 | 健康检查函数 | ✅ Done | `scripts/exec-health-check.sh` |
| F1.2 | 警告机制 | ✅ Done | `scripts/exec-wrapper.sh` |
| F1.3 | 状态报告 | ✅ Done | `scripts/exec-health-check.sh` |

### DoD
- [x] 健康检查函数存在且可调用
- [x] 能检测出当前 pipe 断裂问题
- [x] 警告输出到 stderr

---

## Epic 2: 超时保护 🔄

**依赖**: Epic 1

### Stories

| Story | 功能 | 状态 | 产出文件 |
|-------|------|------|---------|
| F2.1 | 超时包装器 | 🔄 Pending | `scripts/exec-wrapper.sh` |
| F2.2 | 可配置 timeout | 🔄 Pending | env: `COMMAND_TIMEOUT` |
| F2.3 | 超时错误处理 | 🔄 Pending | `scripts/exec-wrapper.sh` |

### DoD
- [ ] 默认 30s 超时
- [ ] 可配置超时时间
- [ ] 超时时正确终止进程

---

## Epic 3: 输出恢复 ⬜

**依赖**: Epic 2

### Stories

| Story | 功能 | 状态 | 产出文件 |
|-------|------|------|---------|
| F3.1 | stdout 捕获 | ⬜ Pending | OpenClaw source fix |
| F3.2 | stderr 捕获 | ⬜ Pending | OpenClaw source fix |
| F3.3 | 混合输出 | ⬜ Pending | OpenClaw source fix |

### DoD
- [ ] `echo "test"` 输出 "test"
- [ ] `2>&1` 重定向正常
- [ ] exit code 正确传递

---

## Epic 4: OpenClaw 源码修复 ⬜

**依赖**: Epic 3

### Stories

| Story | 功能 | 状态 | 产出文件 |
|-------|------|------|---------|
| F4.1 | exec.ts 分析 | ⬜ Pending | analysis.md |
| F4.2 | process.ts 修复 | ⬜ Pending | OpenClaw source |
| F4.3 | 测试覆盖 | ⬜ Pending | OpenClaw tests |

### DoD
- [ ] 根因分析完成
- [ ] 源码修复已提交
- [ ] 测试覆盖 100%

---

## 产出文件清单

```
scripts/
  exec-wrapper.sh        # 超时包装器
  exec-health-check.sh   # 健康检查脚本

docs/vibex-exec-sandbox-freeze/
  FIX.md                # 根因分析
  Epic1_health_check.md # Epic1 验收报告
  IMPLEMENTATION_PLAN.md # 本文件
```

---

## 快速验收

```bash
# Epic 1: 健康检查
bash /root/.openclaw/vibex/scripts/exec-health-check.sh

# Epic 2: 超时测试
bash /root/.openclaw/vibex/scripts/exec-wrapper.sh 2 sleep 10; echo "Exit: $?"

# Epic 3: 输出测试
bash /root/.openclaw/vibex/scripts/exec-wrapper.sh 5 echo "hello"
```
