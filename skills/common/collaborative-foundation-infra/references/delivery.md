---
id: collaborative-foundation-infra-delivery
status: current
---
# 交付、角色与并发

[返回入口](../SKILL.md) · [先确认会话模式](session.md)

TeamAI 的 engineering 是资源订阅组，包含完整五份 DevFlow Skills、自有规范和设计模式包。订阅不授予批准、写状态或验收权限。TeamAI 不生成同名原生 agents；只有 devflow 模式由 ric-devflow 准备协议完成原生安装、加载核验和角色路由。

本页关于四角色和交付门禁的规定仅在明确选择 devflow 后启用。basic 只读引用既有约束，不加载五份 Skill 正文、不准备或调用四角色、不写 .devflow；按用户授权和项目原命令继续开发，不另建生命周期。两模式均保留模块范围、测试和文档义务。

devflow 模式的完整开发使用原 DevFlow 门禁：唯一 Planner 决定范围和权威状态，Implementer 只实现一个已批准 Task 或已归因实现缺陷，Reviewer 独立审核，Tester 独立设计/执行测试。解释、只读审核和低风险任务沿用原 Skill 的豁免，不能为流程形式制造需求。

每个 Root 只有一套权威任务记录。已有 DevFlow 的 state/current/evidence 均只引用，不复制成另一套状态。治理脚本永不写 .devflow；有授权的 Planner 仍按原协议维护交付状态。

并行前登记任务、允许路径、受保护路径、真实 base SHA、worktree、负责人、模型/harness、依赖和候选身份。共享文件保持一个写入者；不靠模型或订阅名称推导权限。devflow 模式的任务状态和认领放在既有 DevFlow；basic 不推进其状态。禁止增设 collaborative-foundation-infra 工作包状态机。

任务开始前同步并绑定团队版本；执行期间同一任务所有角色复用原会话和规范版本。不为改名、报告或规避拒绝新建角色；devflow 模式的单层调度与原生平级交接按原包执行。模式切换前停止本会话原执行者，不清理他人的工作；切回时核对证据，不自动授予门禁。

旧仓有第二流程时仅记录原路径、责任人、状态含义和证据对应。没有明确迁移决定前，不覆盖原事实源或进行状态映射写入。

## 既有 DevFlow 的只读映射

接入先验证现有 schema 及路径基准，下面是已识别的 v2 字段示例，不是新的 collaborative-foundation-infra 状态定义。

| 权威字段 | 工程规范及交接如何使用 |
|---|---|
| state.root_issue.id / status | 引用 Root 标识及原状态文件位置；不复制状态值为第二事实源 |
| state.tasks[].id / ref / status | 交接 Task ID 与精确 Task ref，状态仍从原 state 读取；缺证据不能推导 accepted |
| state.tasks[].base_sha / head_sha | 交接原来源与候选完整 SHA，核验对象存在及对应关系；本地摘要不冒充 Commit |
| versions / approvals | 引用当前 Spec、测试计划版本及批准证据位置，按原协议验证有效性 |
| artifacts.current / test_plan / evidence | 从原 schema 和作者约定解析文档路径，保持权威记录不变 |

某些 v2 仓同时存在 `current.md` 这样的 Root 相对路径和仓库相对长路径。接管时核对每个原值的基准并在仓库画像记录，不自动标准化、搬迁或改写 state。未知 schema、悬空 ref、无 SHA 或缺批准证据列为映射待决，由原 Planner 判断。

交接模板填写 Root/Task、Task ref、原 Spec/测试计划 ref 与版本、实际 base/head/tested SHA；链接指向原权威文件或对象，不另存一份生命周期。交接快照中的观察值只作证据，不授予状态迁移权。
