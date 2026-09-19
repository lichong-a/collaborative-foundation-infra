---
schema_version: 2
root_issue_id: REQ-20260917-001
revision: 1
author: ric_devflow_planner
---
# collaborative-foundation-infra 名称与通用性维护

<a id="INTAKE"></a>
## INTAKE

用户授权将本仓整体名称统一为 `collaborative-foundation-infra`，检索并修正原项目标识，移出全部特定业务工程内容，明确允许整理 `.devflow`。只交付本地文件，不提交、推送、修改远端或全局安装，也不访问其他业务工程。既有“Agent 快速接入”指引保持通用、增量和权限边界。

<a id="BASELINE"></a>
## BASELINE

BROWNFIELD_CONTINUATION / refactor / STANDARD / medium。当前分支为 main，尚无首个提交，全部项目文件为已知未跟踪内容。先在仓外完整备份并实际恢复比对，再保存独立 Git 候选基线；该 SHA 不冒充本仓 HEAD。证据见 [BACKUP-001](evidence.md#BACKUP-001)。原始历史记录在仓外按原字节保留，不改写旧测试结果或哈希以适配新命名。

Node 24；生产入口 tools/、scripts/；自有 Skill 位于 skills/common/，规则位于 rules/；生成物由 npm run build 更新。TeamAI 0.24.0、五份 DevFlow 和一份设计参考固定来源不升级。DevFlow 仍为唯一流程事实源，治理工具始终不得写入 .devflow；本次是用户明确授权的 Planner 维护。

<a id="SPEC"></a>
## SPEC

Revision: 1.

- AC-001：完整仓外归档包含隐藏、忽略、未提交内容和 Git 元数据；恢复后的路径、类型、模式和字节摘要一致。保留当前 .git，禁止本仓 Git 提交或历史重写。
- AC-002：项目名称、npm 包名、TeamAI team、自有 Skill 名称统一为 collaborative-foundation-infra。目录、规则、导航、元数据、受管理区块、回执、缓存、环境变量和测试引用同步；不留下原项目标识或特定业务工程痕迹，包括隐藏文件和 .devflow。
- AC-003：移出特定业务诊断及历史附件，旧证据留在仓外可恢复；仓内只保存通用规范和本次真实维护记录。文档不沿用旧候选的通过结论证明新候选。
- AC-004：六份导入 Skill 及 sources.lock.json 字节不变；TeamAI 版本、依赖版本和权限边界不改变，源码构建生成物，npm 工具更新锁文件名。
- AC-005：新命名下 audit/check/plan/apply、TeamAI 分发、CI 可信基线、运行时安装及 Markdown 降级仍满足既有约束。不得覆盖定制或禁用配置，.devflow 写保护不变，既有行为回归完整执行。
- AC-006：渐进式入口链接完整，自有 Skill 分发后可读；接入指引不清空、强制重排、迁移原状态或覆盖用户文件。先按新规范在隔离项目验证，已有安装仅给出可审阅迁移方法，不自动删除旧包或复制第二套流程。
- AC-007：执行 build、test、check 和独立审查，测试与审核绑定完整候选身份；文件安装、宿主加载、真实调用分别报告。不能运行的项目明确 not_run；不声称正式 Git 门禁完成。
- AC-008：最终进行大小写不敏感的全树内容/路径复查（含隐藏与忽略条目），核对 .git 和上游包未变。只读检查不收集其他业务仓内容。新报告只用仓内相对路径与中性外部证据身份。

<a id="DECISIONS"></a>
## DECISIONS

- D-001：采用无新模式的直接重命名，保留现有模块边界；已读取设计模式参考，无真实新变化点，不引入抽象或依赖。
- D-002：自有 Skill 为 skills/common/collaborative-foundation-infra/；规则为 rules/collaborative-foundation-infra.md；回执命名空间为 .collaborative-foundation-infra/；环境变量为 COLLABORATIVE_FOUNDATION_INFRA_*。新安装基线不自动兼容迁移旧命名空间，不通过保留旧别名或编码拼接隐藏旧名称。
- D-003：本地有界维护使用仓外候选 Git 和不可变文档快照；本仓未提交，正式 G5–G10 不宣告完成。不创建第二套状态库。原历史记录原样归档属于本次明确授权；其他业务仓和全局安装无写入授权。
- D-004：写入串行。Planner 独占 .devflow 及仓外备份；Implementer 独占自有生产/规范；Tester 独占 tests；Reviewer 只读。默认一个完整 Task，无新节点。
- D-005：预算限于自有顶层元数据、docs、rules、manifest、tools、scripts、自有 Skill、tests 和 .devflow。删除仅限已保全的特定业务文档/旧记录和改名产生的旧自有路径；禁止语义重构、上游包改写、依赖升级、关闭检查、业务仓接入和全局改写。

<a id="TASK-001"></a>
## TASK-001 — 统一命名并移出项目专属记录

revision: 1。接受 AC-001..008；无依赖 Task。Planner 完成备份与记录清理；独立 Spec/测试计划审核后由 Implementer 完成生产名称、通用文档及生成物，Tester 随后串行更新和运行测试，Reviewer 审核完整候选。

允许：README.md、AGENTS.md、package.json、package-lock.json（npm 生成）、teamai.yaml、manifest/、rules/、docs/、tools/、scripts/、skills/common/ 自有包及生成物。tests/ 仅 Tester 可写，.devflow/ 仅 Planner 可写。保护：.git/、sources.lock.json、skills/common/ric-*、所有全局安装及其他工程。依赖安装可在本仓 node_modules 或隔离缓存中刷新生成元数据，不修改依赖版本。

交付：一致的工程命名、通用接入指引、没有业务案例遗留的文档树、本次候选身份与独立回归报告。审核发现返修沿同一 Task 继续，不扩大行为范围。
