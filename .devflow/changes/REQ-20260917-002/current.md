---
schema_version: 2
root_issue_id: REQ-20260917-002
revision: 5
author: ric_devflow_planner
---

# 子模块、会话模式与独立工程规范

## 当前续作：Spec4 / Task revision 5

AUTH-005 已批准 TeamAI 官方 Skills 子模块、默认十包分发与首次/显式升级 latest。当前行为、边界及验收以 [Spec4](attachments/spec-v4.md) 为准，覆盖下列历史 Spec3 的相关限制。本轮继续原 Task；[独立规格审核](attachments/review-spec-v4.yaml) 与 [测试计划审核](attachments/review-test-v4.yaml) 已批准。当前已完成本地实现、[独立验收](attachments/test-report-v4.yaml)及[最终代码审核](attachments/review-code-v5.yaml)，三项运行时缺陷均在完整候选上复测关闭。历史证据保持原字节，不转作新实现的 PASS。

用户随后通过“提交推送”明确授权将当前已验收实现、测试、文档及本Root证据提交并普通推送到既有`origin/main`（AUTH-006）。以下本地交付快照和历史报告保持原义，不改绑SHA或补造正式门禁；实际发布身份以主仓Git记录和独立远端核验为准，授权及提交前核对见[证据索引](evidence.md#AUTH-006-PUBLISH)。

<a id="LOCAL-DELIVERY-005"></a>
## LOCAL-DELIVERY-005 — Spec4 本地交付完成

- 完整受测候选为 `8c1edc969f1264b6ffa147238457b65358904b5c`，真实父提交为 `53d29b7fc9906aa5556bb66e476568dc8a446815`；这是仓外隔离候选，主仓 HEAD 仍为 `e094623ea9dd21b5d5ac69fcbaec093220cbb5e1`。
- 当前生产1374文件及测试12文件与该候选字节/模式一致；三个子模块提交、八份上游738文件、用户既有内容和历史证据已核验。后续 Planner 归档的流程记录不冒充该候选所含内容。
- `npm test` 81/81、原补充6/6、已批准运行时分支补充5/5通过，0失败/跳过/取消。来源准备、运行时离线复用、构建、治理和差异检查通过；治理文档20/20可达，十份Skill结构校验通过。
- 已用实际 TeamAI 0.24.0 完成三种目标的真实十包分发；实际 latest 查询与受控元数据/故障分别记录。固定 Skill 来源不随 CLI 升级自动改变，未来版本兼容需各次验证。
- 四份 Git bundle 已验证并在新目录实际恢复，HEAD、树对象、三个上游及只读来源准备均匹配。原始日志、失败现场和补充测试资产保存在本轮仓外恢复档案，摘要见正式报告与[证据索引](evidence.md)。
- 未执行主仓提交/推送、正式G5–G10、原生宿主加载或角色调用、真实知识库生成/分享发布及远端CI。Root/Task正式状态因此不改写为DONE；`local_delivery.status: complete`仅描述本次已授权的本地交付。

<a id="INTAKE"></a>
## INTAKE

用户已明确批准完整实施会话中的《子模块管理、会话模式选择与独立工程规范》。本地交付，不提交或推送主仓，不升级上游，不改其他业务工程或全局 Skill，不启用后台同步、全局 hook 或统一启动器。此前计划中的“本轮形成方案”描述原计划阶段，最新实施指令已授权本地实现。

确认选择：Agent 入口门禁；推荐但不自动选择 DevFlow；用户状态目录持久化；同主会话恢复复用，新建/分叉重新选择，子 Agent 继承；完整七 Skill 分发；基础模式可继续已有任务但不推进原 DevFlow 状态。

用户随后明确修正：删除规范源码工作树中的六份 skills/common/ric-*，所有活动源码与文档直接引用 upstreams。Spec3 取代 Spec2 的持久展开方案。历史快照和报告原字节保留；当前仍是同一实施任务的续作，不生成用户未选择的会话模式。

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
## SPEC v3（技术修订 4）

### AC-SOURCE：固定子模块作为唯一来源

两个 submodule 位于 skills/upstreams/ric-devflow 与 skills/upstreams/ric-design-patterns，分别保持 9ce34a0e9e6e06cbda2f6c4d76951248c7d27fcb 与 46b183615afbfe3b1fffcbc9425ac3aea2c36d99。TeamAI 保持 0.24.0。六份上游 Skill 直接读取子模块真实目录；skills/common 只保留自有规范包，不再保存或生成六份上游副本。

npm run prepare:skills 保留为显式、只读来源校验命令：核对已初始化的 gitlink/HEAD/锁、干净上游、完整文件清单、字节与执行位，不联网、不执行上游代码、不生成回执/导出/缓存。重复执行仍只校验。build/check/sync 每次重新验证实际来源，不依赖旧 exports.json 成功状态；缺失子模块报告显式初始化步骤。

sources.lock 使用能区分新语义的版本，包路径为 upstreams 下真实来源，完整摘要保持原有 725 文件。五份 DevFlow 同 SHA；Git 元数据排除。子模块 gitlink 是版本依据，迁移未提交时核对 index 的实际候选。来源摘要绑定锁与实际资源字节，不包含机器相关 Git 指针。

删除生产中的持久导出归属、锁和回执依赖，保留来源安全、未知内容和并发来源变化拒绝。旧六目录与准备状态只在本轮授权迁移中逐项核验并移入仓外备份；普通命令不自动清理历史副本。若存在旧或未知副本，保留并明确报告，不把它们当来源，也不悄悄重建。固定来源、全局 Skill、其他工程和用户未提交内容保持保护。

### AC-DISTRIBUTION：完整分发与保护

保持七 Skill、命名、目标路径、真实隔离 TeamAI pull、原生角色所有权及拒绝定制/禁用的保护。完整分发不等于启用 DevFlow。submodules 仍为 false；分发时仅在本次私有临时团队目录中将六份固定来源与自有 Skill 组装为 TeamAI 所需扁平布局，不在规范源码树产生副本，不复制 Git 元数据或 DevFlow 外层任务/指令文件。

自有 Skill 的源码导航指向实际 upstreams 目录。临时分发组装只对自有 Markdown 中受控的上游本地导航目标做确定性重定位，使安装后的链接到同级完整包；不修改上游包字节，不误改代码块中的示例、外部网址或无关正文。对变换后的预期完整清单与真实 TeamAI 产物逐字核验，再按原整体预检发布。源侧与安装侧导航均须可用；缺失/未知映射不能以不检查链接通过。

安装回执明确来源布局版本、两个 SHA 和实际分发资源摘要；sourceDigest 绑定实际资源、确定性重定位结果与相关锁，不含本机 Git 路径、临时路径或用户会话状态。旧布局不同版本回执保留并拒绝覆盖，不自动升级既有项目。

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

CI 识别 .gitmodules、upstreams gitlink、来源/临时分发映射与准备脚本为需独立 review 的治理变更；候选不能自降门禁。更新仓库入口、Skill、主题参考、模板、TeamAI 角色说明、接入维护指引及可复现验收记录。README 上游导航使用固定提交网页链接，生成后的本地包相对链接仍完整。旧实际验证证据不改绑新版本。构建、全部测试、来源/check、独立审查及隔离实例是交付依据，真实宿主不能测则明确未验证。

<a id="DECISIONS"></a>
## DECISIONS

- DEC-001：按仓库建立两子模块，作为唯一上游来源；TeamAI 扁平契约仅在临时分发团队目录组装，不用 symlink、不持久展开。既有 .gitmodules、gitlink 和取消跟踪暂存保持；本轮核验后保全六份旧副本至仓外，不提交或推送。
- DEC-002：复用 Node 和现有 bundle，不新增运行时或依赖。源码分别封装来源准备、会话记录，CLI 与 TeamAI 分发只调用模块。已实际读取设计模式 Skill 与 JavaScript 索引；简单函数组合/适配现有接口足够，两个模式用枚举，不新增 State 类层级、角色或任务状态库。
- DEC-003：使用当前工作区单生产写入者，角色写入串行交接；用户要求本地工作区交付且不自动提交，当前基线与仓外恢复备份构成恢复依据，不创建主仓分支/任务提交。本地验收不是正式发布门禁，若使用隔离合成仓固定测试候选必须标明其身份。
- DEC-004：此次会话按实施前生效规范使用 DevFlow 协作；新门禁实现后不把这段流程推定为用户已选择未来会话的模式，不伪造选择记录。

<a id="TASK-001"></a>
## TASK-001 — 完成固定上游、十包分发与会话规范闭环

- revision: 5；depends_on: []；base_sha: e094623ea9dd21b5d5ac69fcbaec093220cbb5e1。
- 当前AC：[Spec4](attachments/spec-v4.md)的AC-TA-SOURCE、AC-TA-SKILLS、AC-TA-RUNTIME、AC-TA-BOUNDARY、AC-TA-VALIDATION；既有会话、结构、来源和权限保护按[TestPlan4](attachments/test-plan-v4.md)映射保留。上述Spec3内容仅记录历史版本。
- 生产允许：tools、scripts、包清单及锁、sources.lock.json、manifest/rules、README、AGENTS、自有Skill、docs、.gitmodules与第三TeamAI gitlink。原RIC固定包只读；不重复搬迁历史副本，不格式化无关文件。必要生成物通过build更新。
- Tester 独占 tests 和本 Root test-plan；Planner 独占本 Root current/state/evidence；Reviewer 全部只读。
- 保护：八份上游包738文件字节/执行位和三个固定提交，既有依赖版本/完整性、历史.devflow附件、其他仓库、全局Skill/原生角色、用户既有内容和所有远端。CLI开发依赖与运行时实际安装按Spec4分离。
- 交付：三子模块单一来源、离线只读来源核验、临时真实十包分发与双侧导航、首次latest及显式升级的私有CLI、保持会话工具和独立结构规范、独立测试与审查。
- 命令：npm run prepare:skills；隔离prepare:teamai/upgrade:teamai；npm run build；npm test；npm run check；Git差异、子模块与保护范围核验。
- 停止：具体冲突、来源不一致、范围外写入、不可恢复覆盖；仅暂停受影响动作，其他有界工作继续。


<a id="TECHNICAL-004"></a>
## TECHNICAL-004 — 上游目录归入 skills

用户 AUTH-004 要求将两个固定子模块移至 skills/upstreams，并同步关联引用。精确差异、权限范围与验收见 [技术修订 4](attachments/technical-v4.md)，它覆盖 Spec3 的来源位置；其余 AC 与 TestPlan3 的保护性 Oracle 保持。上一候选及报告仅为历史，本轮结果绑定新候选。主仓不提交、不推送，原根与全局安装保持保护。

<a id="LOCAL-DELIVERY-004"></a>
## LOCAL-DELIVERY-004 — 技术修订 4 本地完成

两个固定子模块已迁入 skills/upstreams，源码、来源锁、治理路径、CI 和文档导航同步完成。实际独立测试 62/62、补充 6/6，prepare/build/check/diff 通过，18/18 文档可达、0 finding；[最终审核](attachments/review-code-v4.yaml) APPROVE，无新增问题。详见 [当前交付证据](evidence.md#LOCAL-DELIVERY-004) 和 [独立测试报告](attachments/test-report-v3.yaml)。

新隔离候选为 53d29b7fc9906aa5556bb66e476568dc8a446815，真实父 c02f51cfe8c2e5cd1bd59b5b41228ebc1f6904fe；主仓 e094623ea9dd21b5d5ac69fcbaec093220cbb5e1 未提交或推送。生产和测试已冻结，后续仅归档本 Root 证据。真实宿主/原生角色及正式发布门禁继续标为未运行。下列 LOCAL-DELIVERY-003 及更早部分只记录历史布局。

<a id="LOCAL-DELIVERY-003"></a>
## LOCAL-DELIVERY-003 — Spec3 本地交付完成

六份上游 Skill 已从源码 skills/common 移出并在仓外保全；当前只保留自有规范包。活动工具、锁文件、规则和文档直接引用两个固定 upstreams，prepare 只读核验，七包扁平布局仅在每次 TeamAI 分发的私有临时目录组装。六包原字节及执行位不变，自有四处导航在源码侧和安装侧分别校验。

当前 [实现报告](attachments/implementation-v5.yaml)、[测试作者报告](attachments/test-code-report-v2.yaml)、[独立测试报告](attachments/test-report-v2.yaml) 和 [最终审核](attachments/review-code-v3.yaml) 共同绑定隔离候选 `c02f51cfe8c2e5cd1bd59b5b41228ebc1f6904fe`，真实父提交为上一隔离候选 `a5aeac068367e2880cb9eeca0e253cc405c38c7e`。仓内 62/62、仓外独立补充 6/6 通过，无失败、跳过或取消；离线安装、准备、构建、治理及 diff 检查退出 0，18/18 文档可达、0 finding。审核为 APPROVE，导航问题已关闭，无剩余 findings 或 defects。完整索引见 [交付证据](evidence.md#LOCAL-DELIVERY-003)。

主仓 HEAD 保持 `e094623ea9dd21b5d5ac69fcbaec093220cbb5e1`，index 未被本次修正改变，没有主仓提交或推送。1145 条生产记录与 9 个测试文件已和受测候选核对；后续 Planner 归档仅维护本 Root 流程证据。实际新宿主加载、真实会话交互、原生四角色、其他操作系统和远端 CI 未运行；正式 G5–G10 不以本地交付替代，Root/Task 正式状态保持。原 Spec2 证据保留用于追溯，不作为当前布局验收。

<a id="LOCAL-DELIVERY-002"></a>
## LOCAL-DELIVERY-002 — Spec2 历史交付

以下记录仅对应已冻结 Spec2，用户后续修正已按 Spec3 完成，不能将这些结果当作新布局验收。Spec2 本地实现、来源迁移、独立测试和代码审核已完成。生产说明为 [IMPL-20260917-002-003](attachments/implementation-v3.yaml)，[独立测试](attachments/test-report-v1.yaml) 与 [最终审核](attachments/review-code-v2.yaml) 共同绑定隔离候选 `a5aeac068367e2880cb9eeca0e253cc405c38c7e`；完整索引见 [交付证据](evidence.md#LOCAL-DELIVERY-002)。原 37 组测试保留，最终仓内 59/59、仓外补充 5/5 通过；准备、构建、检查通过，18/18 文档可达、0 finding。无剩余实现缺陷或待办生产工作。

主仓 HEAD 仍为 `e094623ea9dd21b5d5ac69fcbaec093220cbb5e1`。真实子模块迁移所需的 `.gitmodules`、两个 gitlink 及 725 个旧展开文件的取消跟踪已暂存，其余变更保留在工作区；没有在主仓提交或推送。隔离候选不是主仓提交，正式 G5–G10 未运行，不能把本次本地交付标成正式 VERIFIED/DONE。新规范下原生宿主加载、真实会话询问/恢复/fork/子调用和四角色运行未验证，文件分发和 CLI 测试不替代该层证据。

后续追加的本段及审核/测试索引仅是 Planner 的流程证据，不改变已冻结的生产和测试。源码或测试若再变更，应重新绑定候选和相关验证；本轮未写入任何实际会话模式选择。

## Change Log

| revision | 时间 | 作者 | 类型 | 对象 | 原因 |
|---|---|---|---|---|---|
| 1 | 2026-09-17T06:20:00Z | ric_devflow_planner | BEHAVIORAL | 全部 | 固定用户已批准的方案和本地交付边界 |
| 2 | 2026-09-17T06:26:00Z | ric_devflow_planner | TECHNICAL | AC-DISTRIBUTION / TASK-001 | 明确经批准的入口追加接口为显式 --install-entry，不改变默认分发行为或授权 |
| 3 | 2026-09-17T08:53:00Z | ric_devflow_planner | BEHAVIORAL | AC-SOURCE / AC-DISTRIBUTION / TASK-001 | 按用户修正删除持久副本、直接引用子模块，临时组装完整分发并保持双侧导航 |
