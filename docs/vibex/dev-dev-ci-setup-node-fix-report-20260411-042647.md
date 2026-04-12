# 阶段任务报告：dev-ci-setup-node-fix
**项目**: vibex
**领取 agent**: dev
**领取时间**: 2026-04-10T20:26:47.940580+00:00
**版本**: rev 32 → 33

## 项目目标
认证报错重定向至登录页，登录成功后跳转回原页面

## 阶段任务
调查并修复 GitHub Actions Review Gate 中 actions/setup-node@v4 的失败。失败现象：Tests/Code Quality/Security Scan 三个 job 均在 setup-node 步骤失败（最近5个 commit 全面受影响）。已知：workflow 配置 node-version: 20, cache: pnpm, cache-dependency-path: '**/pnpm-lock.yaml'。任务：(1) 检查 pnpm-lock.yaml 路径匹配问题 (2) 检查是否有子目录 pnpm-lock.yaml 缺失 (3) 尝试移除 cache 配置或改用 node-version-file 方案 (4) 推送修复并验证 Review Gate 在 main 分支通过。

## 🔴 约束清单
- 必须有代码改动提交
- Review Gate 全部通过
- Test Gate 不退化

## 📦 产出路径
git push 验证
