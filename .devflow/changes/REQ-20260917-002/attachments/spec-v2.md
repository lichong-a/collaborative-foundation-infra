---
schema_version: 2
root_issue_id: REQ-20260917-002
revision: 2
author: ric_devflow_planner
---

# 子模块、会话模式与独立工程规范

<a id="INTAKE"></a>
## INTAKE

用户已明确批准完整实施会话中的《子模块管理、会话模式选择与独立工程规范》。本地交付，不提交或推送主仓，不升级上游，不改其他业务工程或全局 Skill，不启用后台同步、全局 hook 或统一启动器。此前计划中的“本轮形成方案”描述原计划阶段，最新实施指令已授权本地实现。

确认选择：Agent 入口门禁；推荐但不自动选择 DevFlow；用户状态目录持久化；同主会话恢复复用，新建/分叉重新选择，子 Agent 继承；完整七 Skill 分发；基础模式可继续已有任务但不推进原 DevFlow 状态。

<a id="BASELINE"></a>
## BASELINE

- BROWNFIELD，Node 24.20.0 / npm 11.19.0，ESM / Node test / esbuild；不新增依赖。
- main / origin/main；HEAD e094623ea9dd21b5d5ac69fcbaec093220cbb5e1，开始时工作区与暂存区干净。
- 基线 `npm run check` 退出 0，17/17 文档可达，0 finding。先前 37 项测试不是本轮执行证据，独立 Tester 将重跑受影响基线及最终套件。
- 已在仓外完整备份并实际恢复核对：4834 条目，包括隐藏、忽略内容及 Git；归档 SHA256 14d441292cece9b9859c51076ab9dd54c97c120d103a23a2c774c9a9c590dcc4。恢复位置仅记录于本地交接，不写入共享文档。
- 原模块：tools/distribution.mjs 为隔离 TeamAI 分发和冲突保护；repository.mjs 为文件/Git 基础操作；cli.mjs 路由治理接口；scripts/build.mjs 生成随 Skill 分发的单文件工具；tests 独立维护。
- 现有分发绑定六个普通目录，禁止 submodules 自动更新，逐字校验源和结果。会话机制尚未实现；当前自有规则有无条件 DevFlow 路由，必须一起修正。
- 既有流程记录保持原样，当前 Root 采用相同四文件布局。主仓不授权 commit，正式 G5–G10 不能用工作区摘要冒充通过；本轮交付真实本地实现、独立测试/审查与不可变证据，正式 Git 发布门禁不宣称完成。

<a id="SPEC"></a>
## SPEC v2

### AC-SOURCE：固定来源与可重复准备

两个 submodule 位于 upstreams/ric-devflow 与 upstreams/ric-design-patterns，分别固定 9ce34a0e9e6e06cbda2f6c4d76951248c7d27fcb 与 46b183615afbfe3b1fffcbc9425ac3aea2c36d99。TeamAI 固定 0.24.0。迁移后主仓不跟踪六份展开文件，保留原有 skills/common 布局作为精确忽略的生成物。

新增 npm run prepare:skills：仅从已初始化、gitlink/HEAD/锁一致且工作区干净的本地子模块生成，不联网、不运行上游代码、不跟随分支。锁记录仓库与子目录映射，六包完整字节及执行位保持不变；五个 DevFlow 包同源同 SHA。排除 .git 元数据，其余完整包不裁剪。不导出 DevFlow 仓库的外层 AGENTS、任务记录和文档。未知/人为修改的现有导出目录拒绝覆盖；工具自己的未改动旧导出凭回执可更新；中断和部分输出不能冒充成功。并发准备排他，源变化必须拒绝。

子模块 gitlink 是版本依据，锁与其交叉校验。准备在未提交迁移期间可核对 index 的 gitlink；同路径 HEAD 旧状态不能覆盖 index 的实际候选。缺失子模块给出 git submodule update --init --recursive --checkout 的明确操作，不自动执行。

### AC-DISTRIBUTION：完整分发与保护

保持七 Skill、命名、目标路径、真实隔离 TeamAI pull、原生角色所有权及拒绝定制/禁用的保护。完整分发不等于启用 DevFlow。submodules 仍为 false，由显式准备负责，隔离临时团队目录不复制 .git。回执增加上游 SHA 与导出摘要；sourceDigest 绑定实际分发资源与相关锁，不含本机 Git 路径、临时准备状态和用户会话记录。

基础模式不要求原生四角色可用；Skill 安装遇到已有定制/禁用仍保持原样，不用会话选择反转配置。新增门禁不以安装成功代替加载：回执区分资源文件、项目常驻入口及实际宿主加载，未经真实验证均不得标已生效。入口追加遵守 existing adoption 的授权、局部标记、脏文件和冲突保护，治理 apply 仍禁止自动改写指令文件。

入口追加的显式接口为 teamai-sync --install-entry：无 --apply 时只预览，单独 --apply 只分发资源，--apply --install-entry 才追加项目常驻入口块。Codex/ZCode 目标为 AGENTS.md，Claude 为 CLAUDE.md；两共享 AGENTS 的宿主使用同一不硬编码宿主名的区块。必须在任何写入前对资源、入口及回执完成整体预检；与入口重叠的脏文件、软/硬链、定制或不完整区块拒绝，原正文与字节保持不变，相同区块幂等。源码检出自有入口与分发安装后的入口使用各自真实相对路径。回执仅能声明区块存在/匹配，不能据此声明宿主已加载。该技术接口不扩大原授权的追加范围。

### AC-SESSION：必选、独立身份与持久化

在现有分发工具增加 session status/select/switch；明确 --repo、--agent codex|zcode|claude、--session-id；select/switch 还需 --mode devflow|basic。JSON 输出；status 已选择 0，等待选择 3，记录/环境错误 2；现有四动作保持兼容。

状态目录使用绝对 XDG_STATE_HOME 或用户 .local/state 下 collaborative-foundation-infra。身份为共享 Git common-dir（非 Git 用根路径）的摘要 + 宿主 + root session ID 摘要；同工作树家族共享项目身份但不同根会话绝不继承。记录模式、选择时间、规范版本、切换历史；不记录原始对话或任务状态。新建/分叉必须采用真实新身份；稳定宿主 ID 不可用时由 Agent 建立并在交接携带显式 ID，身份无法证实重新选择，禁止最近记录推断。

status 严格只读，不创建目录；损坏/不匹配记录不能当无选择或默认 DevFlow。select 首次排他创建，相同选择幂等，不同选择必须显式 switch；switch 保存完整选择历史；不存在选择不能 switch。文件私有、原子持久化、并发排他，软链/硬链/越界/未知文件类型拒绝，不改系统或 shell 配置。无法落盘不可宣称持久化，不继续开发。

子 Agent 只查询并继承 root 的记录；接口支持显式 --root-session-id 用于子调用，携带该参数时 select/switch 拒绝。这仍是 Agent 协议，不承诺对伪造参数或任意 shell 工具提供系统沙箱。

### AC-MODE：路由与会话恢复

自有常驻入口先引导读取 session 协议，未选择前只允许必要身份只读检查，任何推荐/超时不视为同意。用户首条消息明确选择时直接记录。第一项“使用 RIC DevFlow（推荐）”，第二项“使用基础工程规范”。同一对话恢复不重新询问；新主会话和 fork 重问；子 Agent 不提问不切换。

DevFlow 模式沿用原入口与轻量豁免。basic 不自动加载五 Skill 正文、不准备/调用四角色、不写 .devflow，不建立平行生命周期；保留原状态并只读引用约束继续用户授权开发。切换先停止本会话旧执行者，不清理他人工作，切回核对真实候选/证据不自动授予门禁。选择不改 policy.workflow 的既有权威映射。上游原 Skill 原文不改，仅自有路由声明用户本会话明确选择优先。

### AC-STRUCTURE：独立工程约定

两模式均遵循目录职责、依赖方向、业务/共享边界、测试和渐进式文档。旧工程先画像并推荐最小调整，不套固定目录，不自动移动/合并/删除；新项目依需求、技术栈与部署推荐目录树和职责，纳入当前方案确认，不新增独立审批链。复用既有架构/画像入口，没有才建最小文档。结构检查不等于架构合理，用户允许/保护范围持续生效。

### AC-CI-DOC：可信检查、说明与隔离验收

CI 识别 .gitmodules、upstreams gitlink、来源/导出映射与准备脚本为需独立 review 的治理变更；候选不能自降门禁。更新仓库入口、Skill、主题参考、模板、TeamAI 角色说明、接入维护指引及可复现验收记录。README 上游导航使用固定提交网页链接，生成后的本地包相对链接仍完整。旧实际验证证据不改绑新版本。构建、全部测试、来源/check、独立审查及隔离实例是交付依据，真实宿主不能测则明确未验证。

<a id="DECISIONS"></a>
## DECISIONS

- DEC-001：按仓库而非六目录建立两子模块；生成物保留 TeamAI 扁平契约，不用 symlink。全备份验证之后才移除六包的 Git 跟踪，暂存 .gitmodules、gitlink 和这些删除是建立真实子模块所必需，不创建提交。其余产物不自动暂存。
- DEC-002：复用 Node 和现有 bundle，不新增运行时或依赖。源码分别封装来源准备、会话记录，CLI 与 TeamAI 分发只调用模块。已实际读取设计模式 Skill 与 JavaScript 索引；简单函数组合/适配现有接口足够，两个模式用枚举，不新增 State 类层级、角色或任务状态库。
- DEC-003：使用当前工作区单生产写入者，角色写入串行交接；用户要求本地工作区交付且不自动提交，当前基线与仓外恢复备份构成恢复依据，不创建主仓分支/任务提交。本地验收不是正式发布门禁，若使用隔离合成仓固定测试候选必须标明其身份。
- DEC-004：此次会话按实施前生效规范使用 DevFlow 协作；新门禁实现后不把这段流程推定为用户已选择未来会话的模式，不伪造选择记录。

<a id="TASK-001"></a>
## TASK-001 — 完成子模块与会话规范闭环

- revision: 2；depends_on: []；base_sha: e094623ea9dd21b5d5ac69fcbaec093220cbb5e1。
- AC：AC-SOURCE、AC-DISTRIBUTION、AC-SESSION、AC-MODE、AC-STRUCTURE、AC-CI-DOC。
- 生产允许：tools、scripts、package.json（只新增命令）、sources.lock.json、manifest、rules、hooks、README、AGENTS、自有 Skill、docs、.gitignore、.gitmodules、两子模块及六份生成目录。只增加必要模块与参考，不格式化无关文件。
- Tester 独占 tests 和本 Root test-plan；Planner 独占本 Root current/state/evidence；Reviewer 全部只读。
- 保护：上游 725 文件字节/执行位和固定版本、依赖版本/完整性、既有历史 .devflow、其他仓库、全局 Skill/原生角色、用户内容和所有远端。
- 交付：真实子模块、可重复准备和分发、会话工具及协议、独立结构规范、必要文档/测试和真实验证记录。
- 命令：npm run prepare:skills；npm run build；npm test；npm run check；Git 差异/子模块与保护范围核验。
- 停止：具体冲突、来源不一致、范围外写入、不可恢复覆盖；仅暂停受影响动作，其他有界工作继续。

## Change Log

| revision | 时间 | 作者 | 类型 | 对象 | 原因 |
|---|---|---|---|---|---|
| 1 | 2026-09-17T06:20:00Z | ric_devflow_planner | BEHAVIORAL | 全部 | 固定用户已批准的方案和本地交付边界 |
| 2 | 2026-09-17T06:26:00Z | ric_devflow_planner | TECHNICAL | AC-DISTRIBUTION / TASK-001 | 明确经批准的入口追加接口为显式 --install-entry，不改变默认分发行为或授权 |
