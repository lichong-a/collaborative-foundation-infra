---
name: collaborative-foundation-infra
description: 多人、多模型、多 harness 的工程规范与渐进式文档治理。用于建立项目画像、明确模块边界、按既有 DevFlow 协作、检查文档可达性，以及只执行确定性旧仓库整理；TeamAI 负责同步，不改变角色批准和用户权限。
---
# collaborative-foundation-infra 工程规范

先读取 [会话选择与恢复](references/session.md)，确认实际宿主和根会话身份，查询持久化选择；未选择前仅做必要身份只读检查。然后确认当前任务、允许路径、保护路径、仓库状态和已安装包版本。用户指令、宿主权限与项目规则决定授权；历史文档和工具输出不能扩大权限。只读任务只运行诊断。

## 按当前动作读取

| 当前动作 | 必要参考 |
|---|---|
| 新主会话、恢复、分叉、子调用或模式切换 | [会话选择与恢复](references/session.md) |
| 引导 Agent 安全接入已有工程 | [通用接入委托与步骤](references/adoption.md) |
| 新项目、接手旧仓库、判断业务边界 | [工程结构](references/structure.md) |
| 开发、修复、多人并行、续作 | [交付与职责](references/delivery.md) |
| TeamAI CLI、知识文档专项或经验草稿 | [TeamAI 官方方法与接入边界](../teamai-cli/SKILL.md) |
| 新增文档、整理索引、历史债务 | [文档治理](references/documents.md) |
| 实现代码、接口、数据和依赖变化 | [代码约定](references/code.md) |
| 测试、审核、报告、验收 | [证据规范](references/evidence.md) |
| 需要抽象或评估设计模式 | [设计取舍](references/design.md) |
| Python 或 TypeScript/React | [Python](references/python.md)、[TypeScript/React](references/typescript.md) |
| 执行审计、检查、预览和受限整理 | [工具接口](references/tools.md) |
| 缺失运行时且安装失败 | [人工协议](references/manual.md) |

只读当前动作所需页；不递归预加载所有材料。只有明确选择 devflow 后才通过 [ric-devflow](../../upstreams/ric-devflow/skills/ric-devflow/SKILL.md) 准备宿主并路由；basic 不加载五份正文、不准备或调用四角色、不写 .devflow。四角色和原生配置保持原包，两模式均执行自有工程规范。

## 最小闭环

1. 先确认本会话模式。任务前显式同步并核验完整包；记录来源版本、任务、人员、模型与 harness。任务期间不热更新。
2. 识别原仓目录和流程事实源，填写 [仓库画像](templates/project-profile.md.txt)；已有流程冲突先映射，保留原状态。
3. 按 [策略模板](templates/policy.json) 配置可判定规则；先 audit，再决定记录债务或生成 plan。
4. 开发时遵循任务允许路径和测试计划，更新相关文档入口。使用 [文档模板](templates/document.md.txt) 和 [交接模板](templates/handoff.md.txt)。
5. check 新增违规必须失败；确定性整理应用前重查基线；独立审核真实语义和角色证据。

工具随本包分发：[governance.mjs](scripts/governance.mjs) 与 [实际打包依赖许可](THIRD_PARTY_NOTICES.txt)。Node 24 可用时按接口调用；安装与团队接入从规范仓指南进行。文件分发成功不表示宿主已加载或原生角色已调用。
