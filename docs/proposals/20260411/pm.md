# PM 每日提案 — 2026-04-11

**Agent**: analyst
**日期**: 2026-04-11
**产出**: proposals/20260411/pm.md

---

## PM-P0-1: 游客体验 → 注册转化漏斗优化

**Summary**: 游客可使用基础功能但无明显注册引导，转化率低。

**Problem**: 游客创建画布后，无法保存/分享，挫败感强；注册入口不显眼。

**Solution**: 
1. 在游客首次"保存"时显示注册引导模态框
2. 增加"保存到我的项目" CTA（注册后自动关联）
3. 添加游客使用限制提示（"已创建 2 个画布，注册保存全部"）

**Impact**: 注册转化 +15%，2h
**Effort**: 2h

---

## PM-P0-2: design 页面 404 问题（vibex-homepage-improvements P0）

**Summary**: 导航中的"设计"链接指向不存在页面。

**Problem**: 从首页导航到 /design 时返回 404，用户体验断点。

**Solution**: 
1. 若 /design 是占位页 → 创建落地页或引导到 /editor
2. 若废弃 → 修改导航链接指向正确页面
3. 添加 404 页面引导用户返回 editor

**Impact**: 导航完整性，0.5h
**Effort**: 0.5h

---

## PM-P1-1: PRD 导出格式支持优先级

**Summary**: export/page.tsx 支持 Markdown/PDF/DOCX/HTML，但实际只实现了模拟导出。

**Problem**: 用户选择导出格式后，点击"导出 PRD"仅显示 alert，真实文件未生成。

**Solution**: 按优先级实现：
1. P1: Markdown 真实导出（fs/write 或 blob download）
2. P2: PDF 导出（需要 server-side rendering）
3. P3: DOCX/HTML

**Impact**: 核心功能完成度，3h（MD）/ 5h（PDF）
**Effort**: 3h

---

## PM-P1-2: 协作者邀请流程简化

**Summary**: 当前邀请协作者需要手动复制链接，流程繁琐。

**Problem**: 无邮件邀请内链，协作者收到链接后还需注册。

**Solution**: 
1. 添加邮箱邀请输入框
2. 发送含 token 的邀请邮件
3. 协作者点击链接后自动加入项目

**Impact**: 协作激活率 +20%，4h
**Effort**: 4h
