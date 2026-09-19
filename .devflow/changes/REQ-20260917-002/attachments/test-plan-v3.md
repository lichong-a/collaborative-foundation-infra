---
schema_version: 2
root_issue_id: REQ-20260917-002
revision: 3
author: ric_devflow_tester
task_id: TASK-001
spec:
  path: .devflow/changes/REQ-20260917-002/attachments/spec-v3.md
  revision: 3
  sha256: cb01d871b49d9f6b46ec8056c573d667af60f666de69866f31cc7e5004e579b9
baseline_sha: e094623ea9dd21b5d5ac69fcbaec093220cbb5e1
---

# 独立测试计划：直接子模块来源、临时分发与会话选择

本版绑定[已冻结 Spec v3](attachments/spec-v3.md#SPEC)，等待独立 TEST_REVIEW；审核前不得作为新增验收依据。工作仍在原 TASK-001，Task revision 3；执行结果由 Planner 原样追加[证据账本](evidence.md)。历史 [Spec v2](attachments/spec-v2.md#SPEC)、[TestPlan v2](attachments/test-plan-v2.md)及已有报告保持原字节。

## 范围、职责与基线

验证六项 AC：两个固定子模块直接作为唯一上游来源、完整七 Skill 临时组装并分发、私有会话记录、模式与恢复路由、两模式共用的工程结构约定、可信 CI 与文档。源码工作树不保留六份 skills/common/ric-* 副本；prepare:skills 只读校验源，不创建导出目录、归属回执或准备锁。自有 Skill 在源码中引用实际 upstreams，在分发隔离临时树中仅对明确链接做确定性转换，指向安装后同级包；上游六包725文件保持原字节及执行位。保留既有行为与保护性 Oracle，因需求已明确改变而失效的旧导出机制用例按下文逐项替代，不机械保留旧目录假设。

本阶段 Tester 仅写本文件。生产作者交接后，由 Planner 单独开放 tests/ 独占写入窗口；生产、生成工具、已批准 Spec、state/current/evidence、上游原包、历史流程产物、全局安装与其他工程均不是 Tester 写入范围。测试仅使用本次创建的隔离用户状态目录、临时仓、真实本地 Git 子模块和合成数据；不在当前真实会话建立伪造的模式选择。

已执行新的 Brownfield 基线：

- 完整 baseline SHA：`e094623ea9dd21b5d5ac69fcbaec093220cbb5e1`；执行前 tracked/index 无差异，新增本 Root 流程文件不属于受测代码。
- 时间：2026-09-17T06:20:32.927090+00:00 至 2026-09-17T06:20:45.645461+00:00。
- 环境：Node v24.20.0、npm 11.19.0、Git 2.53.0、Linux x86_64。
- `cwd: .`；命令 `npm test`；退出码 0；37 passed / 0 failed / 0 skipped / 0 cancelled，tracked 文件字节前后一致；分类 `clean`。
- 初始基线无历史失败。后续失败分别记录新增、环境或未知归因；不得以先前 Root 的通过记录替代本次执行。
- 原始 stdout/stderr、环境、执行时间及前后 tracked 摘要由本轮仓外基线证据保全；交接给 Planner 固定中性制品身份，不在共享文件写机器位置。

本次修正前的第二个回归锚点是隔离完整候选 `a5aeac068367e2880cb9eeca0e253cc405c38c7e`，其执行报告为 `TEST-20260917-002-001`（[原报告](attachments/test-report-v1.yaml)，SHA256 `4740d578554b96fb9e2b11a89d8f7f41e960057374981a4a22f5173994ed9fe7`）：59 项仓内测试及 5 组摘要绑定外部测试通过，prepare/build/check 通过。该候选及两个上游已通过 bundle 验证与实际恢复。此前高负载超时和测试 fixture 修正保留在原诊断记录，不改为历史产品缺陷，也不隐去失败。此证据只证明 Spec v2；不重跑即将失效的完整旧套件，不把旧通过写为 Spec v3 验收。

## 身份与证据规则

主仓没有本轮 commit 授权。主仓已有基线 SHA 只证明旧代码，未提交实现和测试不得标为该 SHA 的正式 PASS。最终可在已授权隔离候选固定包含实际生产与测试代码的真实完整 SHA，保存与交付工作区、暂存 gitlink、子模块 HEAD、来源锁、临时组装清单、分发回执和构建产物的对应清单；或者明确报告冻结工作区快照身份及其验收限制。两者均不冒称主仓正式 G5–G10 完成。

每次实际执行记录命令、相对 cwd、环境版本、完整输入身份、退出码、结果、原始证据和未运行项。prepare 必须只读；对 prepare/build/check/sync 分别记录操作前后源码树与六个旧目录的不存在性，build 只允许其原已批准制品路径变化，其他动作不得写回源码。临时组装结果单独记录规范化清单及摘要，不能用已删除导出目录或陈旧 exports.json 证明来源。测试执行本身不能悄悄改变受测源码。子模块在基线、构建和分发前后均核对真实 gitlink/HEAD，工作区路径和暂存状态不能替代提交身份。

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
| TC-SRC-001 | AC-SOURCE | 检查 .gitmodules、实际 index gitlink、子模块 HEAD、schema3来源锁、实际upstreams包路径及六包清单；从 upstreams 直接读取并运行 prepare:skills | 两个批准 SHA 一致、五 DevFlow 同源、725 文件字节和执行位精确匹配；源码树六个旧副本不存在；无 .git 或上游外层 AGENTS/任务文档混入包 | 静态＋真实 Git |
| TC-SRC-002 | AC-SOURCE | 真实 fixture 的 HEAD/index 不同、缺失/冲突 gitlink、HEAD/锁/声明不匹配 | 使用实际候选 index 与上游 HEAD/锁交叉核验；错误明确失败，源及分发目标零覆盖，不能退回旧副本继续 | 真实 Git/index |
| TC-SRC-003 | AC-SOURCE | 缺失/未初始化/脏 tracked-untracked-ignored 子模块，缺件、类型、执行位或字节变化；预置伪完整旧副本作为诱饵 | prepare/build/check/sync 均不能从诱饵通过；提示显式初始化，不自行 fetch/update/checkout，不运行上游 hooks；失败不写源码或认领旧副本 | 真实 Git＋失败哨兵 |
| TC-SRC-004 | AC-SOURCE | 没有旧六目录或 exports.json 的干净源码离线校验、重复校验、并发校验；逐项运行 build/check/分发预览/实际同步 | prepare 返回 verified、退出0，严格只读且同输入结论一致，所有动作前后六目录仍不存在，不创建导出、回执或准备锁；build仅更新已批准制品；已初始化源可离线，未初始化不得假通过 | 真实文件/进程 |
| TC-SRC-005 | AC-SOURCE | 在隔离 fixture 放未知、定制、额外文件或不完整旧副本，以及旧/损坏 exports.json、pending/lock；核对当前移除清单 | 工具保留并明确报告这些残留，不自动删除、覆盖、认领或消费；不能当源事实或静默忽略冲突。实际迁移仅处理已核验并已备份、获明确授权的六个指定目录；相邻和用户文件不受影响 | 文件保护＋迁移证据 |
| TC-SRC-006 | AC-SOURCE | 合成上游固定新提交，并分别同步或故意不同步其锁/index/文件清单；不创建导出回执 | 一致的新源可只读校验并临时组装新内容，分发摘要随实际版本改变；任一不一致拒绝，旧副本不能兜底。实际两个生产 SHA 保持不变 | 真实本地升级 |
| TC-SRC-007 | AC-SOURCE、AC-DISTRIBUTION | 并发只读prepare、并发临时组装/同步；通过屏障在读取、复制、TeamAI运行、发布前改变源/锁；对临时复制、写、同步、rename注入失败 | 只读校验无导出写入或共享准备锁；源漂移不能取得成功安装回执；各次临时树隔离、不交织。故障不改源码/上游和原用户内容，目标残留按既有发布保护可解释；不得清理其他调用临时树或用户残留 | 真实并发＋故障注入 |
| TC-SRC-008 | AC-SOURCE、AC-DISTRIBUTION | 源/临时目标最终或祖先软链、源硬链、越界映射、未知类型；外部哨兵与相邻临时目录 | 拒绝不安全路径、类型与逃逸；复制/转换/清理不修改外部哨兵；原包不经链接重写或可写共享映射接入 | 真实文件边界 |
| TC-DIST-001 | AC-DISTRIBUTION | 从无旧副本的源码分别执行 Codex/ZCode/Claude 真实TeamAI预览、分发和重复运行；观察受控临时团队树 | 临时树完整七包，六包与upstreams逐字/执行位相同，自有包仅含明确转换差异；不带.git或上游外层文件，submodules=false；目标安装完整、预览不写目标、重复无漂移、源码不重建旧目录 | 真实 TeamAI＋临时制品 |
| TC-DIST-002 | AC-DISTRIBUTION | 两个物理路径不同但固定源相同的源码树临时组装；改变真实资源/锁/自有链接转换输入，再改变本机Git定位、临时路径和无关用户状态 | 相同分发资源摘要一致；相关源/锁/转换结果变化进入摘要，临时路径与用户状态不污染。schema3安装回执绑定上游SHA、sourcePackagesDigest、distributionDigest和实际制品；旧schema2回执明确保留拒绝。不能以源码自有包与转换后字节不相等误判失效 | 真实目录/回执 |
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
| TC-CI-001 | AC-CI-DOC | 可信团队基线下候选分别改 .gitmodules、upstreams gitlink、来源/临时组装映射、链接转换和只读校验模块；同时削弱候选 policy/checker | 所有指定治理变化被识别并要求独立 review；执行可信基线，不接受候选自降；包含 staged gitlink 与未跟踪准备脚本场景；业务已分发布局旧门禁不退化 | 真实 Git＋CLI |
| TC-DOC-001 | AC-CI-DOC、AC-DISTRIBUTION、AC-MODE | 无旧副本时扫描活动源码/规范路由；校验源码自有Skill→upstreams与分发自有Skill→同级包；解析链接/锚点并保留反例 | 两侧链接均可达；活动消费者不读取旧目录。只按明确映射转换自有包目标，不广泛替换正文/代码/示例，不改上游原文。中文/空格、引用式链接、锚点及代码伪链接均有覆盖；历史档案/禁止说明/分发目标字段不误算成源码消费 | 结构检查＋确定性转换＋人工复核 |
| TC-REG-001 | 全部 | 在新的完整隔离候选执行只读prepare、build、完整适配后npm test、check、可信CI和保护核验；对照原37及Spec2新增行为 | 保留仍有效Oracle，旧导出机制按明确矩阵替代且无Skip/降级；上游725文件/固定版本、依赖和历史证据不变，六旧目录不重建；主仓无新commit/push，报告绑定新候选，不能复用a5aeac旧PASS | 完整回归＋独立核验 |

## 安全失败与边界解释

- 权限失败只在隔离状态根制造，不改真实用户/系统目录权限；若当前执行用户特权使权限模拟失效，采用明确的文件系统错误注入并披露该层级，不能称为真实普通用户权限验证。
- 源锁、实际子模块与临时组装结果必须互相一致；旧归属回执不构成自动删除旧目录或迁移用户安装的授权。测试对未知旧副本设保护哨兵；本次明确删除仅限授权、备份和核验过的六份源码副本。合成升级不授权生产跟随上游分支。
- 持久化工具只能保障其自己接受的参数和文件操作；不得将 child 参数拒绝、入口协议或用户选择描述为阻止任意 shell/伪造身份的系统沙箱。
- 测试中的会话选择只发生在合成状态根。当前实施会话使用旧流程，不因此为未来真实会话自动写 devflow 选择。
- 原生宿主行为若无法安全真实复现，单列环境切片和精确缺口；CLI记录、配置文本或资源分发通过均不能替代该切片。

## 执行顺序与退出条件

1. 固定此计划并由独立 Reviewer 执行 TEST_REVIEW。基线已执行，正式新增验收须等计划批准。
2. 生产作者先完成实现并固定其身份，释放窗口后 Tester 仅修改 tests；需要生产修复或补 Hook 时回交 Planner，不自改。
3. 先核验直接来源/index/无副本及单进程会话契约，再验证保护、故障和并发，随后执行真实 TeamAI 分发与模式/结构协议复核。
4. 在包含所有测试的冻结完整候选上执行 prepare/build/完整回归/check/可信CI；保存临时组装清单、分发回执及子模块身份。检查源码和测试在执行前后未发生未解释变化。
5. 最后核验原包、依赖、历史流程、全局与跨仓边界，将报告和必要 Defect 交 Planner；独立代码审核针对完整生产加测试候选。

报告 Verdict 仅使用 PASS、FAIL、BLOCKED。全部必需本地用例通过且无阻断缺陷时，可对声明的本地切片给 PASS；任一 Oracle 违反为 FAIL；缺少必需环境、来源或可恢复身份则对应切片 BLOCKED。无法执行的原生宿主、其他操作系统及远端平台明确 not_run，不与本地结论混淆。不把一次完整测试描述成正式 Git 发布门禁完成。


## v2 技术增量（历史说明）

下段保留 v2 版本说明的原意，当前实际绑定以本文件 frontmatter 中 Spec v3 为准。

v1 原字节保全于 [test-plan-v1.md](attachments/test-plan-v1.md)，SHA256 `1e393ee4dfcd24f730d6734c56d20ce6a8bae4c158fbb93de422cd3eee568830`。本版只绑定 Spec v2 并新增 TC-DIST-004 至 TC-DIST-006，明确 `teamai-sync --install-entry` 的显式追加、整体预检、三 harness 共用/独立入口、正文保留与回执层级；其他用例、基线和验收 Oracle 未变。无需重跑已经完成的同一代码基线，也不新增 Task；本版仍须独立 TEST_REVIEW 后才执行新增验收。

## v3 行为增量与旧用例替代

TestPlan v2 已原字节冻结于 [test-plan-v2.md](attachments/test-plan-v2.md)，SHA256 `9f5ababb25d516cc454cc7e0ec860bab28fe80e3fa6237b01ccecdb59c8b01b4`。本版是用户明确改变来源布局后的行为增量，仍属原 Task；不修改历史 Spec、计划或报告的含义，不把旧目录假设移除当成放宽保护。

| v2 用例或假设 | v3 保留的保护意义与替代方式 |
|---|---|
| prepare生成六目录、忽略规则和重复导出noop | prepare只读验证；所有正常入口都不生成六目录；任何源码写入、成功兜底旧目录均失败 |
| exports.json证明导出归属、允许更新已知旧导出 | 不再依赖源码导出归属；上游锁/index/HEAD/725文件直接验证。未知旧副本/回执保全，不自动删改；成员安装定制保护继续保留 |
| 复制失败、并发发布和prepare-pending恢复 | 复制/转换/失败/并发保护迁至实际临时组装与目标发布边界；prepare并发自身严格无写入；源漂移检测继续在发布前执行 |
| 正确旧回执基础上升级 | 合成源新commit＋锁/index/文件清单一致性，再比较新组装资源和分发回执；不涉及实际固定上游升级 |
| installed与源码六个flat目录逐字相等 | installed六包与对应upstreams路径逐字/执行位相等；自有包按手工确认映射比较预期转换差异，独立于生产转换函数生成期望值 |
| 自有源码与已分发Skill同一相对路径布局 | 源码引用真实upstreams，分发时转换成同级包；分别解析两侧真实链接/锚点。源码不能为通过导航先重建副本 |
| 直接TeamAI pull原始规范checkout即可取得七flat包 | 真实分发验证以经适配器组装的隔离团队树为源；保留实际TeamAI子进程、七包完整性和固定版本Oracle，不再要求原始源码暴露旧flat副本 |

旧37项及Spec2新增会话、入口、可信CI、权限、故障和元数据Oracle仍保留。只修正依赖已取消flat-source布局的fixture和期望来源；不删除定制内容、明确禁用、脏入口、PROD-ENTRY-001、原子写、跨worktree及运行时降级等回归。全部替代关系在后续测试代码署名报告中列明，具体数量按实际case组织报告，不以维持旧数量而保留失效测试。

自有链接转换应覆盖入口和相关参考中真实上游引用，支持原有有效链接语法与锚点；安装后的上游原包内部引用保持原样并可达。未知或歧义跨包链接必须报错，不能猜测转换或静默输出悬空链接。链接转换只作用于自有文件的明确目标，不得对六上游包做内容重写。预览、安装与重复运行必须使用相同转换规则，规范化资源摘要不包含临时绝对路径。

已确认技术接口另作严格契约断言：sources.lock 的 schemaVersion 为3，六个 packages.path 是 upstreams 下真实路径，不保留 sourcePath 冗余；prepare 成功状态为 verified。安装回执 schemaVersion 为3，分别验证 sourcePackagesDigest 与 distributionDigest；旧 schema2、缺失必需摘要或篡改摘要的回执拒绝且目标零变动。sourceDigest 仍须绑定真实资源、锁及确定性转换结果。schema版本变更属于本次行为修正，不通过宽松接受旧回执规避迁移。

链接转换允许范围为自有 SKILL.md、references/session.md、references/design.md、references/adoption.md 中四处已确认导航目标；按当前语法与显式映射独立建立期望清单。测试核对仅这些目标变动，代码块/行内代码中的同形字符串、外部URL、普通说明及六份上游原包保持原字节。任何新增真实跨包引用但无映射必须报错；转换失败在目标发布前发生，临时制品不能作为成功安装证据。

临时团队目录只用于资源分发，不成为项目的第二权威源。正常结束及失败路径的清理均限工具自己创建的目录；保留必要故障证据时明确临时产物，不回写源码副本。现有成员旧版本/定制安装仍按原预检规则保守拒绝，本次删除源码副本不授权清理成员安装。

当前阶段仅发布已绑定 Spec3 的计划；不运行旧完整测试，不删除六目录，不实现测试或生产变更。独立 TEST_REVIEW 批准、生产作者冻结新实现并释放窗口后，Tester才适配tests并执行上述验收。

## Change Log

| revision | 时间 | 作者 | 类型 | 对象 | 原因 |
|---|---|---|---|---|---|
| 1 | 2026-09-17T06:22:00Z | ric_devflow_tester | BEHAVIORAL | 全部六项 AC；TC-SRC-001 至 TC-REG-001 | 首次独立送审，包含新基线、来源迁移、会话身份与持久化、模式和结构协议及既有回归 |
| 2 | 2026-09-17T06:27:38.716439+00:00 | ric_devflow_tester | TECHNICAL | Spec v2；TC-DIST-004 至 TC-DIST-006 | 明确可选项目入口追加接口与整体预检保护，其余 AC 和基线不变 |
| 3 | 2026-09-17T08:54:40.840343+00:00 | ric_devflow_tester | BEHAVIORAL | 直接来源、只读prepare、临时组装、源码/安装双侧链接 | 按用户修正取消源码六副本；替代旧导出机制Oracle，保留其他保护，已绑定Spec3，待独立TEST_REVIEW |
