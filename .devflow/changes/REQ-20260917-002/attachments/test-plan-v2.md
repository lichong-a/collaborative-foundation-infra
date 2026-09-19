---
schema_version: 2
root_issue_id: REQ-20260917-002
revision: 2
author: ric_devflow_tester
task_id: TASK-001
spec:
  path: .devflow/changes/REQ-20260917-002/attachments/spec-v2.md
  revision: 2
  sha256: c73d9a274b7c3a645fe340061a9584886689958e2d5be3c1a4f60e54a13c6203
baseline_sha: e094623ea9dd21b5d5ac69fcbaec093220cbb5e1
---

# 独立测试计划：来源准备与会话选择

本计划等待独立 TEST_REVIEW；计划及基线结果不表示新增行为通过。权威需求为[已批准 Spec](attachments/spec-v2.md#SPEC)，工作范围为其中 TASK-001；执行结果由 Planner 原样追加[证据账本](evidence.md)。

## 范围、职责与基线

验证六项 AC：两个固定子模块和六包生成、完整七 Skill 分发、私有会话记录、模式与恢复路由、两模式共用的工程结构约定、可信 CI 与文档。保留原 37 项自动测试的正确行为与保护性断言，按新增真实风险补充测试，不新增框架或运行时。

本阶段 Tester 仅写本文件。生产作者交接后，由 Planner 单独开放 tests/ 独占写入窗口；生产、生成工具、已批准 Spec、state/current/evidence、上游原包、历史流程产物、全局安装与其他工程均不是 Tester 写入范围。测试仅使用本次创建的隔离用户状态目录、临时仓、真实本地 Git 子模块和合成数据；不在当前真实会话建立伪造的模式选择。

已执行新的 Brownfield 基线：

- 完整 baseline SHA：`e094623ea9dd21b5d5ac69fcbaec093220cbb5e1`；执行前 tracked/index 无差异，新增本 Root 流程文件不属于受测代码。
- 时间：2026-09-17T06:20:32.927090+00:00 至 2026-09-17T06:20:45.645461+00:00。
- 环境：Node v24.20.0、npm 11.19.0、Git 2.53.0、Linux x86_64。
- `cwd: .`；命令 `npm test`；退出码 0；37 passed / 0 failed / 0 skipped / 0 cancelled，tracked 文件字节前后一致；分类 `clean`。
- 尚无本轮已证实的历史失败。后续失败分别记录新增、环境或未知归因；不得以先前 Root 的通过记录替代本次执行。
- 原始 stdout/stderr、环境、执行时间及前后 tracked 摘要由本轮仓外基线证据保全；交接给 Planner 固定中性制品身份，不在共享文件写机器位置。

## 身份与证据规则

主仓没有本轮 commit 授权。主仓已有基线 SHA 只证明旧代码，未提交实现和测试不得标为该 SHA 的正式 PASS。最终可在已授权隔离候选固定包含实际生产与测试代码的真实完整 SHA，保存与交付工作区、暂存 gitlink、子模块 HEAD、来源锁、生成包回执和构建产物的对应清单；或者明确报告冻结工作区快照身份及其验收限制。两者均不冒称主仓正式 G5–G10 完成。

每次实际执行记录命令、相对 cwd、环境版本、完整输入身份、退出码、结果、原始证据和未运行项。准备工具会改变未跟踪生成物，因此同时记录生成前后导出摘要；测试执行本身不能悄悄改变受测源码。子模块在基线、构建和分发前后均核对真实 gitlink/HEAD，工作区路径和暂存状态不能替代提交身份。

每项失败保留最小复现和完整受测身份，创建不可变 Defect，Tester 仅给疑似分类，由 Planner 归因。不得通过跳过、改弱断言、无限重试或放大既有超时得到通过。测试内部失败注入只针对隔离进程/文件，不能要求生产增加未批准的后门。

## 层级、隔离与确定性

| 层级 | 实际验证 | 限制 |
|---|---|---|
| 静态及人工协议复核 | 来源映射、Git/index、配置、入口路由、结构建议、权限约束及文档导航 | 不证明 Agent 实际遵守提示或原生角色已加载 |
| 隔离文件与进程边界 | 真实 Node CLI、文件权限、记录读写、故障、并发、真实 Git/worktree/本地 submodule | 不替代真实远端平台或多操作系统验收 |
| 真实分发与安装 | 固定 TeamAI 0.24.0 子进程及现有运行时安装/降级回归，隔离成员目录 | 文件安装、项目常驻入口、宿主加载分别有证据；互不替代 |
| 原生宿主 | 可用且获准的宿主对新入口加载与真实同/新/子会话行为 | 无法执行时独立记 not_run，不用文本断言或 Mock 冒充 |

所有会话测试显式设置独立 HOME、XDG_STATE_HOME 及合成 session ID，保证只向测试拥有的目录持久化；测试中的 XDG_STATE_HOME 值分别覆盖绝对、相对、缺失和无权限。只清理本次创建的资源，不跟随软链清理外部目标。并发采用事件、IPC 或受控文件系统屏障，不用固定 sleep 猜时序。用户状态目录原子写不能仅用文件存在作通过依据，必须读回可解析的完整记录并比较成功操作历史。

子模块升级场景仅使用测试自建仓中的明确新提交及相应锁，生产两个固定 SHA 均保持不变。离线准备设置失败即留痕的网络/remote 调用哨兵；不通过实际修改全局 Git 配置、禁用真实网络或连接业务仓实施。外层仓的 hooks/脚本放合成可执行哨兵，验证准备不运行它们。

## 验收追踪与用例

以下用例默认由 Tester 实现和执行，人工项由 Tester 独立核对，均进入最终报告。每个 ID 内的多个输入为同一 Oracle 的参数化场景。

| ID | AC | 前提与动作 | 可观察 Oracle | 层级 |
|---|---|---|---|---|
| TC-SRC-001 | AC-SOURCE | 检查两个 .gitmodules 项、实际 index gitlink、子模块 HEAD、固定来源锁与包映射；运行 prepare:skills | 两个批准 SHA 一致，五 DevFlow 同源；六包共 725 文件逐字及执行位一致，无 .git、外层 AGENTS/任务/仓库文档泄入导出；非生产内容不升级 | 静态＋真实 Git |
| TC-SRC-002 | AC-SOURCE | 在真实临时仓构造初次迁移：HEAD 仍有旧普通目录，index 已切为新 gitlink；另构造 HEAD 与 index gitlink 不同、index 冲突或缺失、HEAD/锁不匹配 | 正确采用实际候选 index gitlink，与锁和子模块 HEAD 交叉验证；旧 HEAD 不能掩盖不匹配；非法/冲突状态失败且目标零覆盖 | 真实 Git/index |
| TC-SRC-003 | AC-SOURCE | 空白、缺失、未初始化子模块；脏 tracked/untracked 子模块；缺少包、类型/执行位/字节变化 | 明确失败，缺件提示显式 submodule update --init --recursive --checkout；不自动联网/更新/检出，不运行上游脚本，不把部分包记为完整来源 | 真实 Git＋失败哨兵 |
| TC-SRC-004 | AC-SOURCE | 在已初始化固定源下离线准备、再次准备；核对六包路径、ignore/index 分类及完整清单 | prepare 离线成功且幂等；六包展开目录精确忽略且不作为 tracked 普通文件，新 gitlink 可追溯；自有包和邻接无关内容不被扩大忽略 | 真实文件/Git |
| TC-SRC-005 | AC-SOURCE | 已有未知、手改、额外文件、缺件或部分输出；伪造/损坏/不匹配准备回执；已核验相同导出 | 不覆盖未知/定制/部分状态，不把失败称为成功；已知相同源可无破坏复用，合法回执与实际导出共同证明归属；既有用户字节和模式不变 | 真实文件 |
| TC-SRC-006 | AC-SOURCE | 合成源旧版本已由工具准备，随后固定新提交并同步测试锁/gitlink；分别保留完整旧回执、修改旧导出、删回执 | 仅能依据合法回执更新工具自身未改动旧导出；新内容/摘要/SHA 与新源一致；另外两种冲突保守拒绝；实际固定上游不升级 | 真实本地升级 |
| TC-SRC-007 | AC-SOURCE | 两个 prepare 并发；准备中通过屏障改变源/HEAD/锁；注入复制/rename/write/fsync 失败和中断 | 排他发布，无交织输出或错误成功回执；源变化失败；每个失败保留或恢复可解释现场，后续操作必须识别不完整状态，用户内容不丢失 | 真实并发＋故障注入 |
| TC-SRC-008 | AC-SOURCE | 源或目标最终/祖先软链、硬链接文件、越界映射、未知文件类型，外部哨兵 | 拒绝不安全路径和类型；不读写越界业务内容，不通过复制或清理修改外部哨兵 | 真实文件边界 |
| TC-DIST-001 | AC-DISTRIBUTION | 准备完整资源后分别执行 Codex/ZCode/Claude 的真实 TeamAI 预检与分发、重复执行 | 七包齐全且命名/路径/字节/执行身份正确；原生配置所有权不改变；submodules=false，临时团队树不带 .git；预检零写入、重复无漂移 | 真实 TeamAI |
| TC-DIST-002 | AC-DISTRIBUTION | 对照两个等价但物理路径不同的已准备源；改变实际资源/锁，再只改变本机 Git 定位、临时准备数据和用户会话状态 | 相同资源得到相同 sourceDigest；相关资源/锁变化反映到摘要；纯定位、临时准备状态和会话记录不污染分发摘要。回执绑定上游 SHA、导出摘要和实际工具制品 | 真实目录/回执 |
| TC-DIST-003 | AC-DISTRIBUTION、AC-MODE | basic 和 devflow 选择下分别预置定制 Skill、禁用配置、脏/定制常驻入口、自动 hook 和无四原生角色环境 | 选择不能绕过定制/禁用保护；basic 不因原生角色缺失被拒为不可开发。Skill 资源、常驻入口、加载分别报告，未验证不标已生效；入口不授权自动覆盖，治理 apply 仍拒改指令文件 | 隔离分发＋人工协议 |
| TC-DIST-004 | AC-DISTRIBUTION、AC-MODE | Codex/ZCode/Claude 分别执行普通预览、仅 --install-entry 预览、单独 --apply、--apply --install-entry；覆盖不存在和已跟踪干净的入口文件 | 所有不带 --apply 的调用只预览且目标/用户配置零写入；单独 --apply 只分发，不新增或修改入口；组合参数才新增或局部追加 AGENTS.md/CLAUDE.md。回执区分资源与区块匹配，不声明宿主已加载或模式已选择 | 真实 TeamAI＋CLI/文件 |
| TC-DIST-005 | AC-DISTRIBUTION | 显式安装入口前分别在资源、入口、回执三处注入冲突；入口覆盖重叠 staged/unstaged/untracked 修改、最终/祖先软链、硬链、非普通类型、不同/重复/不完整区块 | 对资源、入口和回执整体预检；任一冲突均在目标发布前拒绝，七包、规则、原入口、回执、用户配置及外部哨兵全部保持原字节/模式。不能先分发部分资源后才发现入口冲突，也不能重写回执掩盖未知状态 | 真实文件边界 |
| TC-DIST-006 | AC-DISTRIBUTION、AC-CI-DOC | 干净入口含中文正文、无末尾换行或 CRLF；重复 --apply --install-entry；Codex 后接 ZCode 与逆序；分别核对源码自有入口及分发入口真实引用 | 原正文作为原字节前缀完整保留，仅追加最小区块；相同区块幂等，不替换旧正文或产生重复块。共享 AGENTS 区块不硬编码某个宿主，两种顺序共用同一区块。源码与已分发入口各自指向实际可达的 session 协议；治理 apply 仍拒改指令文件 | 真实三 harness＋链接/人工核验 |
| TC-SESSION-001 | AC-SESSION | 对公开分发工具的 session status/select/switch 使用合法参数及缺 repo/agent/session-id/mode、非法动作/宿主/模式、重复或多余参数 | JSON 可解析；待选 status=3，已有有效选择 status=0，输入/记录/环境错误=2；select/switch 必需参数有效；原四动作参数与退出码兼容 | CLI 进程 |
| TC-SESSION-002 | AC-SESSION | 全新用户目录执行 status；绝对 XDG_STATE_HOME、未设置时 HOME 默认、相对 XDG_STATE_HOME；不存在/非法目标仓 | status 严格只读、无目录和锁文件创建；正确绝对状态根下寻址；相对/非法环境拒绝，不退回错误位置，也不默认选择 devflow | 真实文件 |
| TC-SESSION-003 | AC-SESSION、AC-MODE | 首次 basic/devflow 各一次 select；跨进程 status 恢复；相同 select；不同 select；有记录 switch 再切回；无记录 switch | 首次排他创建，模式/时间/规范版本/身份齐备；同选幂等不重写历史，不同 select 拒绝且不改旧选择；显式 switch 保存完整历史；无记录不得 switch。status 只读恢复 | 真实 CLI/记录 |
| TC-SESSION-004 | AC-SESSION、AC-MODE | 同根 session 在主仓及 linked worktree 查询；不同 root ID、不同 harness、不同仓/common-dir及非Git目录；fork 使用新根 ID | 同 worktree 家族和同根/宿主共享身份；新会话、fork、其他仓和其他 harness 保持隔离，无“最近记录”回退；非Git根规范化稳定，不能串用同名目录 | 真实 Git/worktree |
| TC-SESSION-005 | AC-SESSION、AC-MODE | 子调用携带自己的 session-id 和显式 root-session-id；分别查询已选父根、未选父根，并尝试 select/switch | 子调用只继承指定根；没有父记录不自行选择；所有带 root-session-id 的 select/switch 拒绝，即便模式相同；原记录/历史零改动 | CLI/记录＋协议 |
| TC-SESSION-006 | AC-SESSION | 损坏 JSON、截断记录、非法 schema/mode/身份/规范版本/历史、与 key 不匹配记录、未知文件类型 | 明确错误=2，原字节保留；不能当待选=3、不能兜底 devflow、不能用同选 select 覆盖错误记录 | 真实文件 |
| TC-SESSION-007 | AC-SESSION | 新记录权限与目录所有权；无写权限、只读位置；最终/祖先软链、记录硬链、目录替代记录、路径穿越输入与外部哨兵 | 新私有命名空间目录0700、记录0600；拒绝不安全/无权限条件且不通过扩大权限修复；外部哨兵不变、无越界文件，失败不能声称已持久化或允许继续开发 | POSIX 文件边界 |
| TC-SESSION-008 | AC-SESSION | 跨进程并发 select（同/不同模式）、并发 switch；写入/同步/原子发布前后故障和中断，用 barrier 精确制造竞态 | 排他处理，失败者明确错误/忙碌；读者只见完整旧或新记录；成功操作的历史不丢失/互相覆盖；失败不能留伪成功选择，临时残留不能被 status 当有效记录；重试按真实已提交状态决定，禁止无限重试 | 真实并发＋故障注入 |
| TC-MODE-001 | AC-MODE、AC-DISTRIBUTION | 沿 AGENTS/rules/Skill 实际入口走未选、首消息明确选择、同主会话恢复、新主/fork、子 Agent 场景；检查分发后的相同协议 | 未选仅必要只读身份检查；按指定顺序提供两选项且不自动采用推荐/超时；明确选择直接记录；同根恢复不再问，新根重选，子 Agent 不提问/切换；ID不可信则回到选择而非猜最近记录 | 人工协议＋CLI；原生单列 |
| TC-MODE-002 | AC-MODE、AC-STRUCTURE | basic 下引用进行中的旧 DevFlow 任务、执行授权小变更的合成情境；devflow 情境走原入口；切换时有本会话和他人执行者 | basic 不加载五包正文、不准备/调用四角色、不写 .devflow/第二生命周期；原约束可只读引用。devflow 沿原轻量豁免；切换先停本会话旧执行者，保留他人工作，切回核对证据但不授 Gate。policy.workflow 不随选择改变 | 人工场景复核＋状态哨兵；原生单列 |
| TC-STRUCT-001 | AC-STRUCTURE | 两模式下检查旧工程混合布局、已有架构画像、无画像的新技术栈/部署需求场景 | 旧工程先画像和最小建议，不强制移动/合并/删除；新工程推荐职责与依赖方向，进入既有方案确认，无新增审批角色/链；复用既有入口，仅缺少时给最小文档；文档/结构检查不宣称语义正确 | 人工规范/模板审阅 |
| TC-CI-001 | AC-CI-DOC | 可信团队基线下候选分别改 .gitmodules、upstreams gitlink、来源/导出映射、准备模块；同时削弱候选 policy/checker | 所有指定治理变化被识别并要求独立 review；执行可信基线，不接受候选自降；包含 staged gitlink 与未跟踪准备脚本场景；业务已分发布局旧门禁不退化 | 真实 Git＋CLI |
| TC-DOC-001 | AC-CI-DOC、AC-DISTRIBUTION、AC-MODE | 全仓导航、README 固定提交网页链接、生成/实际分发七包局部引用、会话命令样例、人工降级与入口描述 | 新入口可达且语义一致；本地未准备包不导致 README 上游主导航悬空；相对包引用移位后可读；无无条件强制 DevFlow 的自有旁路，无伪“安装即生效”；历史记录原义保留 | 结构检查＋人工复核 |
| TC-REG-001 | 全部 | prepare 后 build、完整 npm test、check、来源/子模块验证、Git diff --check；对照旧37项及保护清单 | 原37项正确 Oracle保留，新案例真实执行；上游725文件字节/执行位及版本不变、依赖无升级、历史流程无改动；主仓无新提交/远端写入，最终证据绑定当前完整候选而非基线 | 完整回归＋独立核验 |

## 安全失败与边界解释

- 权限失败只在隔离状态根制造，不改真实用户/系统目录权限；若当前执行用户特权使权限模拟失效，采用明确的文件系统错误注入并披露该层级，不能称为真实普通用户权限验证。
- 准备工具的回执不是覆盖任意目录的授权；源锁、实际源、已有导出与归属回执必须互相一致。版本升级 fixture 不代表自动跟随上游分支，也不授权生产升级。
- 持久化工具只能保障其自己接受的参数和文件操作；不得将 child 参数拒绝、入口协议或用户选择描述为阻止任意 shell/伪造身份的系统沙箱。
- 测试中的会话选择只发生在合成状态根。当前实施会话使用旧流程，不因此为未来真实会话自动写 devflow 选择。
- 原生宿主行为若无法安全真实复现，单列环境切片和精确缺口；CLI记录、配置文本或资源分发通过均不能替代该切片。

## 执行顺序与退出条件

1. 固定此计划并由独立 Reviewer 执行 TEST_REVIEW。基线已执行，正式新增验收须等计划批准。
2. 生产作者先完成实现并固定其身份，释放窗口后 Tester 仅修改 tests；需要生产修复或补 Hook 时回交 Planner，不自改。
3. 先核验真实来源/index/导出及单进程会话契约，再验证保护、故障和并发，随后执行真实 TeamAI 分发与模式/结构协议复核。
4. 在包含所有测试的冻结完整候选上执行 prepare/build/完整回归/check/可信CI；保存生成包、回执及子模块身份。检查源码和测试在执行前后未发生未解释变化。
5. 最后核验原包、依赖、历史流程、全局与跨仓边界，将报告和必要 Defect 交 Planner；独立代码审核针对完整生产加测试候选。

报告 Verdict 仅使用 PASS、FAIL、BLOCKED。全部必需本地用例通过且无阻断缺陷时，可对声明的本地切片给 PASS；任一 Oracle 违反为 FAIL；缺少必需环境、来源或可恢复身份则对应切片 BLOCKED。无法执行的原生宿主、其他操作系统及远端平台明确 not_run，不与本地结论混淆。不把一次完整测试描述成正式 Git 发布门禁完成。


## v2 技术增量

v1 原字节保全于 [test-plan-v1.md](attachments/test-plan-v1.md)，SHA256 `1e393ee4dfcd24f730d6734c56d20ce6a8bae4c158fbb93de422cd3eee568830`。本版只绑定 Spec v2 并新增 TC-DIST-004 至 TC-DIST-006，明确 `teamai-sync --install-entry` 的显式追加、整体预检、三 harness 共用/独立入口、正文保留与回执层级；其他用例、基线和验收 Oracle 未变。无需重跑已经完成的同一代码基线，也不新增 Task；本版仍须独立 TEST_REVIEW 后才执行新增验收。

## Change Log

| revision | 时间 | 作者 | 类型 | 对象 | 原因 |
|---|---|---|---|---|---|
| 1 | 2026-09-17T06:22:00Z | ric_devflow_tester | BEHAVIORAL | 全部六项 AC；TC-SRC-001 至 TC-REG-001 | 首次独立送审，包含新基线、来源迁移、会话身份与持久化、模式和结构协议及既有回归 |
| 2 | 2026-09-17T06:27:38.716439+00:00 | ric_devflow_tester | TECHNICAL | Spec v2；TC-DIST-004 至 TC-DIST-006 | 明确可选项目入口追加接口与整体预检保护，其余 AC 和基线不变 |
