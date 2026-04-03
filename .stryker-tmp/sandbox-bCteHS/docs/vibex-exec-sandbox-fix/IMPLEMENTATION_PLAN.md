# IMPLEMENTATION_PLAN: vibex-exec-sandbox-fix

## 实施步骤

### Epic 1: Exec PATH 修复
1. 修改 exec 工具，在创建进程时注入 RESTORED_PATH
2. 验证：exec echo "test" 有输出

### Epic 2: PYTHONPATH 修复
1. 同样注入 PYTHONPATH
2. 验证：exec python3 -c "import openclaw" 正常

## 验收
exec 工具在 sandbox 环境下正常返回 stdout/stderr

## 实现记录

### Epic1: PATH 修复 ✅
- [x] openclaw.json: agents.defaults.sandbox.env.PATH + PYTHONPATH 配置
- [x] scripts/exec-wrapper.sh: RESTORED_PATH/RESTORED_PYTHONPATH 自动注入
- [x] .bashrc: 固化 PATH 配置（备用）
- [x] exec-health-check.sh: 验证通过

### 验证
- exec echo "test" → 正常输出
- python3 -c "import task_manager" → OK
- bash exec-health-check.sh → ALL TESTS PASSED
