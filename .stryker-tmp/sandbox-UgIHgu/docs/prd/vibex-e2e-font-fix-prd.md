# E2E 截图中文字体修复 PRD

**项目**: vibex-e2e-font-fix  
**版本**: 1.0  
**日期**: 2026-03-05  
**状态**: Draft

---

## 1. Problem Statement

服务器 (Ubuntu 24.04) 缺少中文字体，导致 Playwright 截图时中文显示为乱码或方框。

**问题根因**:
- 服务器仅安装 DejaVu 字体（西方字符）
- 无中文字体可用
- Chromium fallback 到不支持中文的字体

---

## 2. Goals & Non-Goals

### 2.1 Goals
- 安装中文字体库
- 验证截图中文显示正常

### 2.2 Non-Goals
- 不修改 Playwright 配置（除非必要）
- 不添加新测试用例

---

## 3. Font Installation Steps

### 3.1 安装命令

```bash
# 更新包索引
sudo apt-get update

# 安装 Noto CJK 中文字体
sudo apt-get install -y fonts-noto-cjk

# 刷新字体缓存
fc-cache -fv
```

### 3.2 备选方案（磁盘空间有限时）

```bash
# 安装精简版
sudo apt-get install -y fonts-noto-cjk-extra
```

### 3.3 验证命令

```bash
# 检查中文字体是否安装成功
fc-list :lang=zh
```

**预期输出**: 包含 `Noto Sans CJK` 的字体列表

---

## 4. Implementation Steps

### 步骤 1: SSH 到服务器

```bash
ssh user@aliyun-fuzhou
```

### 步骤 2: 安装字体

```bash
sudo apt-get update && sudo apt-get install -y fonts-noto-cjk && fc-cache -fv
```

### 步骤 3: 验证安装

```bash
fc-list :lang=zh | head -5
```

### 步骤 4: 运行 E2E 测试验证

```bash
cd /root/.openclaw/vibex/vibex-fronted
npx playwright test tests/e2e/
```

### 步骤 5: 检查截图

- 确认截图中中文正常显示
- 无方框或乱码

---

## 5. Acceptance Criteria (验收标准)

### 5.1 字体安装

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-01 | fonts-noto-cjk 安装成功 | `dpkg -l fonts-noto-cjk` |
| AC-02 | 中文字体检索成功 | `fc-list :lang=zh` 有输出 |
| AC-03 | 字体缓存已刷新 | 无报错 |

### 5.2 截图验证

| # | 验收条件 | 验证方法 |
|---|---------|---------|
| AC-04 | E2E 测试截图生成成功 | 文件存在 |
| AC-05 | 截图中中文正常显示 | 视觉检查 |
| AC-06 | 无方框或乱码 | 视觉检查 |

---

## 6. Definition of Done (DoD)

### 6.1 功能 DoD

| # | 条件 |
|---|------|
| DoD-1 | fonts-noto-cjk 安装成功 |
| DoD-2 | fc-list :lang=zh 有输出 |
| DoD-3 | E2E 截图中文正常显示 |
| DoD-4 | 无方框或乱码问题 |

### 6.2 回归测试

| 场景 | 预期 |
|------|------|
| E2E 截图 | 中文正常显示 |
| 现有功能 | 无影响 |

---

## 7. Disk Space Consideration

| 方案 | 磁盘占用 |
|-----|---------|
| fonts-noto-cjk | ~1.2 GB |
| fonts-noto-cjk-extra | ~200 MB |

**建议**: 使用完整版确保所有字符覆盖

---

## 8. Timeline Estimate

| 步骤 | 工作量 |
|------|--------|
| 安装字体 | 5 min |
| 刷新缓存 | 1 min |
| 验证测试 | 5 min |
| **总计** | **15 min** |

---

## 9. Dependencies

- **前置**: analyze-font-issue (已完成)
- **依赖**: Ubuntu apt 包管理器

---

## 10. Risk Mitigation

| 风险 | 缓解措施 |
|------|----------|
| 磁盘空间不足 | 使用精简版 fonts-noto-cjk-extra |
| 安装超时 | 设置 apt timeout |

---

*PRD 完成于 2026-03-05 (PM Agent)*
