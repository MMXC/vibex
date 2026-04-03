# IMPLEMENTATION_PLAN: vibex-currentreport-modular

## 实施步骤

### Epic 1: 模块独立化
1. 创建 config.py 统一管理路径常量
2. task_manager.py 移除硬编码，改为 import
3. 验证：各项目正常输出报告

## 验收
无硬编码路径，统一配置

## 实现记录

### Epic 1: 模块独立化 ✅
- [x] 创建 config.py 统一管理路径常量
- [x] task_manager.py 移除硬编码，改为 import
- 验证：各项目正常输出报告

### 实现细节
- config.py 路径常量: TASK_LOCK_BASE, UPDATE_LOG, MAC_KEY_FILE, CURRENT_REPORT_PKG, DEFAULT_WORK_DIR
- task_manager.py: 3处硬编码 work_dir 默认值改为 DEFAULT_WORK_DIR
- 验证命令: `python3 -c "import sys; sys.path.insert(0, '/root/.openclaw/skills/team-tasks/scripts'); from config import *; print('OK')"`
