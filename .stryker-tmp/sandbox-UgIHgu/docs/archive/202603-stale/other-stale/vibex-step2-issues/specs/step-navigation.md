# Feature: 步骤回退与数据快照

## Jobs-To-Be-Done
- 作为用户，我希望走错步骤后能快速回退到上一步，回退后还能恢复前进，不丢失已填数据。

## User Stories
- US1: 作为用户，我希望能从当前步骤回退到已完成的上一步
- US2: 作为用户，我回退后再次前进时，能恢复到回退前的状态（数据快照保留）
- US3: 作为用户，我回退到 Step 1 时，后续所有步骤数据自动清除（防止数据不一致）

## Requirements
- [ ] (F4.1) `designStore` 支持 `stepHistory` 数组（记录访问过的步骤）
- [ ] (F4.2) `designStore` 支持 `stepSnapshots` 对象（每步骤一个数据快照）
- [ ] (F4.3) 回退到 index < currentStep 时：currentStep 设为 index，数据从快照恢复
- [ ] (F4.4) 前进到 index > currentStep 时：currentStep 前进，数据从快照恢复
- [ ] (F4.5) 回退到 Step 1 (clarification) 时：清除 steps 2-5 所有快照

## Technical Notes
- designStore 路径: `src/stores/designStore.ts`
- 需要修改: `currentStep`, 添加 `stepHistory`, `stepSnapshots`
- 路由跳转: `router.push('/design/' + stepName)`

## Acceptance Criteria
- [ ] AC1: 从 Step 3 (domain-model) 回退到 Step 2 (bounded-context)，currentStep = 1
- [ ] AC2: 回退后再次前进 Step 3，数据与回退前一致（快照恢复）
- [ ] AC3: 回退到 Step 1 后，expect(designStore.stepSnapshots).toEqual({}) — 后续快照清除
- [ ] AC4: expect(designStore.stepHistory).toEqual(expect.arrayContaining([0, 1, 2])) — 历史记录正确
