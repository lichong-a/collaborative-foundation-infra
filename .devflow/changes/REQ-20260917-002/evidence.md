---
schema_version: 2
root_issue_id: REQ-20260917-002
---

# 交付证据

<a id="LOCAL-DELIVERY-004"></a>
## LOCAL-DELIVERY-004 — skills/upstreams 本地交付完成

这是当前技术修订 4 的结果；LOCAL-DELIVERY-003 及更早记录保留为迁移前历史。两个固定子模块现位于 skills/upstreams，根 upstreams 已移除；16 个关联生产文件与 3 个测试文件完成有界调整，六上游 Skill 仍不在 common 留副本。源码和分发侧导航分别校验。

- [作者报告 IMPL-20260917-002-006](attachments/implementation-v6.yaml)、[测试作者 IMPL-20260917-002-TEST-003](attachments/test-code-report-v3.yaml)、[TEST-20260917-002-003](attachments/test-report-v3.yaml)、[最终审核 REVIEW-CODE-20260917-002-004](attachments/review-code-v4.yaml) 已原样归档；审核 APPROVE，无新增 findings。
- 本轮测试和审核绑定隔离候选 53d29b7fc9906aa5556bb66e476568dc8a446815，真实父提交 c02f51cfe8c2e5cd1bd59b5b41228ebc1f6904fe；主仓 HEAD 仍为 e094623ea9dd21b5d5ac69fcbaec093220cbb5e1。本次没有主仓提交或推送。
- 实际新执行：npm test 62/62，独立补充 6/6，零失败/跳过/取消；离线 npm ci、prepare、build、check 和 diff 均退出 0，18/18 文档可达、0 finding。真实三目标 TeamAI 七包分发、新父目录软链保护及新旧 gitlink 治理检查通过。上轮结果不代替本次执行。
- 1145 条生产记录、9 个测试文件与主仓对应；725 个上游文件及两棵 Git 树保持。Git 移动同步 index/.gitmodules/gitfile/core.worktree，其他 index 内容保持；Tester 接手后主仓 HEAD/index 保持。新候选与两上游 bundle 实际恢复并完成来源校验。
- 正式测试报告 SHA256 78e213823260fae517958c95cbcc22daf9f0bc5cae9d81822a8f8eaff7a0be1e；测试作者报告 SHA256 cd51db6dedee5755e1ac1b176e29ed1fa0858431e849f4f1bd1ace022b7064ee；[30 项执行资产摘要](attachments/test-artifacts-v3.json) SHA256 f42e5e25d9c33ea1fa2e55749b9c2afd646fda2a15da0e4a736b34c03b44e513。报告内相对日志路径基于仓外 tester 目录，实际位置在私有交接；这些外部资产未作为仓内文件提交。
- 新宿主加载、真实模型会话/角色调用、其他操作系统和远端 CI 保持 not_run；正式主仓 G5–G10 未运行，Root/Task 正式状态保持，不用本地完成冒称 VERIFIED/DONE。后补 Planner 记录不改变已冻结生产/tests。

<a id="IMPL-20260917-002-006"></a>
## IMPL-20260917-002-006 — 子模块嵌套目录生产交接

[作者报告](attachments/implementation-v6.yaml) 已按原字节归档，SHA256 fad72ac284cfc7e700a9ade26c50806b4332d3d230af40e203cde02f65d7317a。生产 v5 清单 1145 条目，SHA256 088cd444b393eaa020ad1af5c0b140f9c36f78facd93990ed8c3eb2ab05c4820；两子模块迁移至 skills/upstreams，16 个关联生产文件调整。作者 prepare/build/check/两项 diff 检查退出 0，725 文件与两提交保持，Git 实际定位核验通过，9 个测试文件保全；作者结果不代替新的独立测试。生产已冻结，Tester 接手三个路径适配，Reviewer 对生产增量暂无阻断。

<a id="REVIEW-TECHNICAL-20260917-002-004"></a>
## REVIEW-TECHNICAL-20260917-002-004 — 路径迁移批准

[独立局部技术审核](attachments/review-technical-v4.yaml)，SHA256 3a52441c441c704d285d062d6a5375cdae12799fc508e895387ae92d0cb46542，APPROVE。该批准覆盖 [technical-v4](attachments/technical-v4.md) 的精确差异，并确认原 Spec3/TestPlan3 的未变行为和保护性 Oracle 继续适用；不冒称新执行结果。已复用原 Implementer 开始串行生产迁移，Tester 只读准备三个测试文件的路径适配，随后接手独立验证。

<a id="AUTH-004"></a>
## AUTH-004 — 将上游子模块移到 skills 下

用户明确要求把 upstreams 放到 skills 下并修正关联文档链接。属于来源定位的有界技术修订；保留 Spec3 功能与来源 SHA、七包临时分发、只读 prepare、旧内容保护及本地交付边界。实施前在仓外保全并逐字核验 87 个潜在受影响文件，另存 index 与两子模块位置元数据；完整旧备份保持。具体清单与位置仅在私有交接记录。上一 LOCAL-DELIVERY-003 是移动前历史，不作本轮验收。

<a id="LOCAL-DELIVERY-003"></a>
## LOCAL-DELIVERY-003 — 直接来源布局本地交付完成

本节是当前 Spec3 结果，以下 LOCAL-DELIVERY-002 及其附件仅为 Spec2 历史。主仓保持未提交的本地交付；完成实施、独立测试和只读审核，不宣称正式 Git 发布门禁通过。

- 最终 [实现报告 IMPL-20260917-002-005](attachments/implementation-v5.yaml) 对应生产 v4；[测试代码报告 IMPL-20260917-002-TEST-002](attachments/test-code-report-v2.yaml) 仅认领五个 tests 路径，SHA256 `d263af20585da8678bc359b9dd37cc7889989a80f5bbfb9a6402fe61cc7df77b`。
- 正式 [测试报告 TEST-20260917-002-002](attachments/test-report-v2.yaml)，schema 1，SHA256 `1a8598e2d55be5a186114c70d9c12555b798feed110a2fde8afd92f74ca99ae2`；[32 项外部执行资产摘要](attachments/test-artifacts-v2.json)，SHA256 `7660162d7b7efd10891498b3a0c61858af59e144b30c9d34e156b5ffbf1a64d1`。这三份文件均按 Tester 封存字节原样归档；其中相对执行路径以仓外 tester 证据目录为基准，实际位置保存在私有交接，不表示日志或 bundle 已进入本仓。
- 最终 [REVIEW-CODE-20260917-002-003](attachments/review-code-v3.yaml) 为 APPROVE，取代历史 -002；NOTE-VALIDATION-NAV-001 已关闭，无剩余 findings/defects。审核分别核对生产 v4、完整测试差异、两个正式测试报告及 32 项执行资产。
- 受测/审核对象均为隔离候选 `c02f51cfe8c2e5cd1bd59b5b41228ebc1f6904fe`，真实父提交 `a5aeac068367e2880cb9eeca0e253cc405c38c7e`；主仓基线 `e094623ea9dd21b5d5ac69fcbaec093220cbb5e1` 是祖先，不冒充候选直接父提交。生产 1145 条目及 9 个测试文件与本地交付一致，17 个保护路径、主仓 HEAD/index 保持。
- 原命令 npm test：62/62，零失败/跳过/取消；独立仓外补充：6/6。原 37 项回归保护保留，旧 59 项中的 9 组导出测试按已审矩阵替换为 11 组来源/临时分发测试，并增加 1 组回执保护。作者 smoke 和中间诊断子集不累加到独立最终用例数。
- npm ci --ignore-scripts --offline、npm run prepare:skills、npm run build、npm run check、git diff --check 均退出 0，18/18 文档可达、0 finding。真实 TeamAI 0.24.0 三种 harness 目标完整七包分发已执行；所有操作后 skills/common 仅含自有规范包，没有重建旧副本或准备状态。
- 两个子模块的 725 文件字节及执行位保持；移出的六份旧副本仍在仓外，725 文件类型/字节/完整权限核验一致。候选和两个上游的三份 bundle 不仅校验成功，也已实际恢复并执行 prepare，身份一致、工作区干净。
- 未运行：新安装包的原生宿主加载、真实新建/恢复/fork/子会话交互、四角色实际调用、人工状态接管、其他操作系统和远端 CI；正式主仓 G5–G10、commit/push/release 未执行。会话选择是协作协议，不能表述成系统权限沙箱；旧 schema2 成员安装保持并拒绝，未自动迁移。
- 本轮授权本地范围完成，state.local_delivery.status 为 complete；正式 Root/Task 状态保持。后补本节和报告索引只属于 Planner 的流程记录，不改变已审核生产/测试，也未为当前会话伪造模式选择。

<a id="IMPL-20260917-002-005"></a>
## IMPL-20260917-002-005 — 两处当前审核导航修复

[完整修复报告](attachments/implementation-v5.yaml) SHA256 `082378451b5974ebd1f47883c2a5e1a5f91f42761e7580af1aa787f269ed1bbd`。生产快照 v4 清单 SHA256 `ef56df9fc3d923ad47a0518b53aa8762aee4304d03fbd249b4953d03d49d9255`、树摘要 `9c04b3bcda066bf329b0c1f2f6c43503eec498d02e5364ec2cdcfe5142f2fcaf`，完整 1145 条目。相对 v3 仅 docs/validation.md 两个链接改变，文档新摘要 `60f91712ab17637c4d7b27b7c2bf9440614060be53509b118e1a4929679f52bb`；工具制品与来源、分发、规范版本摘要不变。

作者实读两份正确批准目标、check 和两项 diff 检查均通过；未重跑先前 20 项自测，不将其冒称为此次执行。生产 v4 再次释放后，Tester 基于该精确对象恢复独立 tests 适配及最终验收；原有已写 tests 保持字节和权限。Reviewer 将对已审 v3 与此单文档增量、最终完整候选及新测试证据一并核验。

<a id="AUTH-003"></a>
## AUTH-003 — 直接引用上游的用户修正

用户明确要求删除规范源码树 `skills/common/ric-*` 并将相关引用改为 `upstreams/`。该指令取代 Spec2 的持久导出方案；保持固定子模块版本、完整七 Skill、会话模式语义、业务/全局只读和本地不提交推送边界。活动 Spec/Task 升至 3；上一验收与审核仅对应历史候选，不能替代新布局验证。

修改前新增仓外内容快照，1183 条目按归档成员逐字/类型/权限核验通过，归档 SHA256 `4a1b114a7b76c2a6313bbe629723396cf3ea1552d22a085797f8f9c8c780098d`。本快照明确不含 `.git`、依赖目录和保持固定不变的两个子模块；它与上一轮完整备份/候选 bundle 共同保全当前工作，不能称为新一次全仓恢复验收。实际位置仅记于私有交接。

实现沿用原角色、单生产写入窗口和独立 Tester/Reviewer；本轮不会为当前真实会话补造模式选择。历史不可变快照、报告和证据中的旧路径保持原文，活动生产/文档引用将更新到子模块实际位置。生成物只在本轮获准清理时核验后移至仓外，普通 prepare/build/check/sync 不自动删除未知旧内容。

<a id="DIRECT-SOURCE-START"></a>
## DIRECT-SOURCE-START — Spec3 实施派发

已冻结 [Spec3](attachments/spec-v3.md)，SHA256 `cb01d871b49d9f6b46ec8056c573d667af60f666de69866f31cc7e5004e579b9`；独立 [规格审核](attachments/review-spec-v3.yaml) 为 `REVIEW-SPEC-20260917-002-003 / APPROVE`。独立 Tester 的 [TestPlan3](attachments/test-plan-v3.md)，SHA256 `5783c10777c9695a1a337e2ee59bec846ce69450e3aad8fdd78325090f177f11`，已获 [测试计划审核](attachments/review-test-v3.yaml) `REVIEW-TEST-20260917-002-002 / APPROVE`。

用户 AUTH-003 覆盖本增量，Task revision3 由原 Implementer 独占生产写入；Tester 暂不改 tests，Reviewer 保持只读。迁移前再调用旧来源校验，725 文件和两个固定提交匹配；旧回执及包清单只作为本次迁移保护证据，不能成为新生产的持久依赖。普通 prepare 改为 verified 且零写入；源码和临时分发分别建立身份，不用旧测试计数代替新验收。

<a id="IMPL-20260917-002-004"></a>
## IMPL-20260917-002-004 — 直接来源生产交接

[完整实现报告](attachments/implementation-v4.yaml) SHA256 `5e9bef257d519e0f2b6fee2a5bc2f3c745bb98d00c17df71a3f69a522a836824`，对应生产快照 v3：1145 条目、清单 SHA256 `47f597a9f3866afe542849b1958b71cf61f4070fc47410aa71026d26573f9998`、树摘要 `9a651a53fb153ebdd5340bfbb23b8e3d85e54ef937f6eab75439075cfdde0917`。六份旧副本已保全移出源码树，两个固定上游 725 文件不变；prepare 只读 verified、七包仅临时组装，源码与分发导航分开校验。

作者本轮 15 + 5 项 smoke、prepare/build/check/diff 均通过；check 18/18 可达、0 finding。这是作者交接，不是独立 TestPlan3 执行通过。主仓 HEAD/index/9 个初始测试文件保持不变。初次自测收集大型差异时遇到证据脚本 ENOBUFS，发生在行为断言前，原日志保留；仅扩大该证据收集缓冲区后完整重跑，不放宽测试超时或行为 Oracle。

Tester 接手后，Reviewer 对生产 v3 暂无阻断性发现，但指出 docs/validation.md 当前审核导航仍指 Spec2 两项批准。为避免最终验收后再改输入，Tester 在安全点暂停，由原 Implementer 仅修两个文档链接、保全所有已写 tests，再冻结新的单文档增量。自测结果只适用原对象；后续审核会分别绑定 v3 生产复用与该明确增量。

<a id="LOCAL-DELIVERY-002"></a>
## LOCAL-DELIVERY-002 — 本地实现与隔离验收完成

- 当前生产说明：[IMPL-20260917-002-003](attachments/implementation-v3.yaml)。独立测试代码说明：[IMPL-20260917-002-TEST-001](attachments/test-code-report-v1.yaml)。
- 正式测试：[TEST-20260917-002-001](attachments/test-report-v1.yaml)，详细执行索引：[TEST-REPORT-20260917-002-001](attachments/test-evidence-detail.json)。两者是不同文件，各自的 schema、ID 和摘要不得混用。
- 最终只读审核：[REVIEW-CODE-20260917-002-002](attachments/review-code-v2.yaml)，`APPROVE`，绑定真实隔离候选 `a5aeac068367e2880cb9eeca0e253cc405c38c7e`。`PROD-ENTRY-001` 和 `NOTE-PROFILE-001` 已关闭，无剩余 findings。
- [历史审核 -001](attachments/review-code-v1.yaml) 按 Reviewer 重发的原文保留；其误将详细证据元数据与正式报告摘要混用而产生的 `NOTE-EVIDENCE-001` 已被 -002 明确撤销。该更正仅涉及证据元数据，不涉及代码/测试变更或重跑，Tester 原报告未改写。
- 原始 `npm test`：59/59、0 失败、0 跳过（原 37 + 新增 22）；仓外补充：5/5。准备、构建、治理及 diff 检查通过，18/18 文档可达、0 finding。外部补充用例以自身摘要绑定，不冒充候选提交内文件。
- 主仓 HEAD 仍为基线 `e094623ea9dd21b5d5ac69fcbaec093220cbb5e1`，没有提交/推送；隔离候选含真实基线父提交与两个固定 gitlink，生产和测试内容已与本地交付逐项对应。主仓必要的子模块迁移暂存不等于创建提交。
- 本轮授权范围已完成，Root 的 `local_delivery.status` 为 `complete`。正式主仓 G5–G10、远端 CI/发布未运行；保持正式 Root/Task 原状态，不伪造 VERIFIED/DONE。
- 三种 harness 的真实 TeamAI 文件分发已验证；新规范下宿主加载、真实会话询问/恢复/fork/子调用及四角色调用没有运行，继续标记 `not_run`。会话门禁是 Agent 协议，不是系统工具权限拦截。
- 后补流程证据由 Planner 维护，不在已审核生产/测试同一性范围内；如再修改生产或测试，需要重新绑定验证。本轮没有给当前真实会话伪造模式选择。

<a id="REVIEW-TEST-20260917-002-001"></a>
## REVIEW-TEST-20260917-002-001

```yaml
schema_version: 1
review_id: REVIEW-TEST-20260917-002-001
supersedes: null
mode: TEST_REVIEW
reviewer: ric_devflow_reviewer
created_at: "2026-09-17T06:29:16Z"

target:
  root_issue_id: REQ-20260917-002
  task_id: TASK-001
  task_revision: 2
  test_plan_version: 2
  path: .devflow/changes/REQ-20260917-002/attachments/test-plan-v2.md
  sha256: 9f5ababb25d516cc454cc7e0ec860bab28fe80e3fa6237b01ccecdb59c8b01b4
  current_matches_snapshot: true
  approved_spec:
    version: 2
    path: .devflow/changes/REQ-20260917-002/attachments/spec-v2.md
    sha256: c73d9a274b7c3a645fe340061a9584886689958e2d5be3c1a4f60e54a13c6203
    review_id: REVIEW-SPEC-20260917-002-002
  baseline_sha: e094623ea9dd21b5d5ac69fcbaec093220cbb5e1

verdict: APPROVE
summary: >-
  28 个唯一稳定用例覆盖六项 AC，包含真实 Git/index、导出归属、
  真实 TeamAI 分发、入口整体预检、会话身份与并发持久化、
  模式协议和可信 CI。正常、冲突、故障、恢复及回归 Oracle 明确，
  层级限制如实区分，未发现阻断测试实施的计划缺口。

findings: []

coverage_review:
  source:
    cases: TC-SRC-001..TC-SRC-008
    conclusion: >-
      覆盖 gitlink/HEAD/锁交叉校验、index 候选优先、缺失和脏子模块、
      完整 725 文件身份、离线与幂等、导出归属、更新、并发、
      中断及路径攻击。生产固定上游与合成升级 fixture 明确隔离。
  distribution:
    cases: TC-DIST-001..TC-DIST-006
    conclusion: >-
      保留真实七包分发与定制/禁用保护，验证资源摘要不受定位和会话状态污染。
      四种参数组合、三种 harness、入口/资源/回执任一冲突的整体零写入、
      CRLF 和无末尾换行正文、共享 AGENTS 区块及幂等均有明确 Oracle。
  session:
    cases: TC-SESSION-001..TC-SESSION-008
    conclusion: >-
      覆盖 CLI 退出码、严格只读 status、首次与重复选择、显式切换历史、
      worktree/root/harness/项目身份隔离、子调用只读继承、
      损坏记录、私有权限、软硬链接、并发及原子发布故障。
      不使用最近记录推断，不把落盘失败当作有效选择。
  mode_and_structure:
    cases:
      - TC-MODE-001
      - TC-MODE-002
      - TC-STRUCT-001
    conclusion: >-
      未选择、明确选择、恢复、新建、fork 和子 Agent 均有协议场景；
      basic 不准备或调用四角色、不写原状态及第二生命周期。
      切换保留他人工作，结构约定不强制迁移、不新增审批链。
  ci_documentation_regression:
    cases:
      - TC-CI-001
      - TC-DOC-001
      - TC-REG-001
    conclusion: >-
      覆盖子模块配置、staged gitlink、来源映射及未跟踪准备脚本的治理识别，
      保持可信基线执行。检查分发后相对引用、固定提交导航、
      自有路由一致性，并要求原 37 项正确 Oracle 全部保留。

oracle_interpretation:
  - case: TC-SRC-005
    requirement: >-
      “已核验相同导出”须同时具有合法匹配回执。
      无回执已有目录即使与来源逐字相同也属于不可自动认领对象，
      普通 prepare 必须拒绝且保留原字节；这与 Planner 已明确的实施约束一致。
  - case: TC-SRC-002
    requirement: >-
      首次迁移通过保全并移出既有展开目录后从空路径生成真实回执，
      不将旧 tracked 身份或内容相同作为普通 prepare 的隐式覆盖授权。
  - cases: TC-DIST-003..TC-DIST-006
    requirement: >-
      验证资源安装、入口区块存在或匹配、实际宿主加载是独立结果；
      入口工具不能写入模式选择记录，也不能由预检成功推定用户选择。
  - cases: TC-MODE-001..TC-MODE-002
    requirement: >-
      人工协议复核、CLI 状态与哨兵仅证明各自层级；
      不替代真实 Agent 询问、宿主加载或角色调用证据。

evidence_and_execution:
  baseline:
    observation: 计划记录本轮基线 37/37、零跳过及 tracked 字节不变。
    boundary: 本审核未重复执行基线，基线通过不证明新增行为。
  test_ownership: Tester 在生产窗口释放后仅修改获准 tests 路径。
  fault_injection: 隔离文件或进程边界，屏障控制时序，不要求未批准生产后门。
  final_identity: >-
    最终执行必须绑定实际生产、测试、index gitlink、子模块 HEAD、
    锁、导出回执及构建产物；隔离候选与主仓对应关系单独保全。
  failure_policy: >-
    失败保留最小复现和输入身份；不 Skip、不弱化断言、
    不无限重试，不把权限注入描述为真实普通用户权限验证。

non_blocking_notes:
  - 当前实施会话不得被测试伪造为未来会话的真实模式选择。
  - 缺少原生宿主条件时单列 not_run，不能以文件分发或协议文本通过代替。
  - 对生产固定来源、历史流程和全局范围的保护须在最终执行后再次核验。

review_boundary:
  - 仅批准测试设计，不表示测试代码或新增实现已通过。
  - 未修改文件、重新运行套件、建立真实会话记录或派生代理。
  - 本地冻结候选验证不冒称主仓提交、推送或正式 Git 发布门禁完成。

unblock_conditions: []
```

## BASELINE-003 — 独立基线与迁移保护复核

- Tester 在变更前以基线 `e094623ea9dd21b5d5ac69fcbaec093220cbb5e1` 重跑 `npm test`：37/37 通过、0 跳过；执行前后 tracked 文件摘要均为 `f8bbe90054703565c93c60a0bd90fe93caf09ac36f2568e12dfc50c942368765`。完整日志已经复制到仓外恢复目录，路径仅保存在本地交接。
- 独立基线结果 JSON SHA256：`845f85037763876486568ead88aa4c20fedf7faf1ef9e657d67638a3d35a9529`；测试标准输出 SHA256：`5476772f860c97238c319a14fb1d58e2206c3d34ff4aad17cac3bd7d301928be`。
- Planner 对照完整恢复副本中的来源锁，逐文件核验仓外 `legacy-exports`：725 个文件全部匹配，无遗漏或字节差异。两个新 gitlink 均保持 Spec 固定提交，`.gitmodules` 使用官方仓库 URL。
- 迁移进行期间再次核验依赖锁及原有 Root 记录共 16 个受保护文件，未发现字节变化。该观察是阶段检查，不替代完成后的保护范围复核。
- 此处只记录既有基线和已完成的恢复核验，不代表新功能通过测试、宿主加载或角色调用。

## EVENT-002-CLARIFICATION — 幂等与人工降级边界

- 已有完整入口块完全匹配时，匹配分支保持零写入，保留块外正文和未提交字节；不能要求工具刚创建的入口先提交才能重复执行。需要真实追加或修改入口时，重叠脏内容仍拒绝；不同、残缺或重复块一律拒绝。该澄清已同步 Implementer 与 Tester，保持 Spec v2 的幂等及不覆盖约束。
- 无 Node 的人工协议仍需先完成受限安装尝试；只有可确认相同项目、宿主与根会话身份，且能安全持久化、读回记录时才继续。口头选择不是持久化，损坏或不明的既有记录不能被人工路径绕过。自动工具恢复后必须核对并保留原选择及切换历史，不能静默重新选择。
- 两种项目常驻入口 `AGENTS.md` 与 `CLAUDE.md` 作为治理规则纳入 CI 变更识别。此处记录实施约束，不代表这些行为已经通过验收。

## IMPL-002-V1 — 生产交接身份

- Implementer 已明确释放生产写入窗口，后续测试阶段生产保持只读；Tester 独占 `tests/`。基线与主仓 HEAD 仍为 `e094623ea9dd21b5d5ac69fcbaec093220cbb5e1`，没有新增主仓提交。
- 仓外 `production-snapshot-v1` 包含 2209 条目，已隔离恢复逐项核对。清单 SHA256：`3c868383bf2919dc2571a9e9cca2004a12b6b6e4ea8f88a165a7f50e6f3bb2c7`；树摘要：`3332c7e2379dd85c6c9fb9d8e53729cec241f9eb45ae2c0da59b62dc02ae2eeb`。基线和两上游的 Git bundle 已验证；机器路径仅记录于本地交接。
- 规范版本：`4f16f4d3b890e09ec60fec57070c77d7e50108dc434e30df4033c6c322af965d`；工具制品 SHA256：`f88e8801fbe498acdb579e8c8d43f233d89f34fb7aee51259ad7653fb8d1fb1e`；六包导出摘要：`6a945f580b4c4233758c10ccffff354ab1c33f5b5fa317f196bd07427d20c136`。
- Implementer 最初进展报告记为 23 组隔离 smoke，正式报告核对实际结果数组后更正为 **22 组**（12 + 7 + 3），全部通过，包括三种 harness 的真实 TeamAI 文件分发、会话记录与来源拒绝路径；`prepare:skills` 为 noop，build、check、两种 diff check 均退出 0。check 为 18/18 文档可达、0 finding。原依赖、725 文件内容、历史流程和测试代码均未被生产实现修改。
- Planner 另对新生成的六份目录与迁移前来源锁逐一比较，725 个文件的路径集合、字节及执行位全部一致。
- 上述均为实现者交接及保护核验，尚不是独立 Tester 报告或 CODE_REVIEW；文件安装与宿主加载、真实角色调用保持分开，主仓正式 Git 发布门禁未运行。

完整 [IMPL-20260917-002-002](attachments/implementation-v2.yaml) 已按原字节冻结，SHA256 为 `16c4b08d1049b7434c1a43b6bdd65d078868121f2c1b25dbc47df9a0c9b58db8`，取代初版计数错误。该修正不改变生产候选身份；失败的快照辅助脚本日志及最终修正结果保留在仓外证据目录。

## REVIEW-PRODUCTION-20260917-002-001 — 生产预审要求修复

完整 [只读预审载荷](attachments/review-production-v1.yaml) 绑定 `production-snapshot-v1`，结论 `REQUEST_CHANGES`。Reviewer 重新核验 2209 条目及清单摘要，未发现身份差异。

- `PROD-ENTRY-001`（P2）：普通资源同步可能把未重新验证的历史入口 `matched` 当作当前匹配返回，包含非当前宿主的历史入口。必须复核或如实区分历史状态，不得为使证据成立而改写用户入口。
- `NOTE-PROFILE-001`（P3）：画像只需路由会话协议，具体根身份、选择和历史留在私有状态及必要交接；生产工具未自动复制会话状态到画像，属文档澄清。
- Planner 已接收必须修复项，通知 Tester 在安全点释放测试写入窗口，再由原 Implementer 串行修复。Tester 尚在执行不构成本轮 finding；生产预审不代替最终完整候选的独立审核。

## TEST-002-INTERIM — 修复前测试交接

Tester 已保存独立来源、会话测试及原有来源 fixture 的适配，并明确暂停写入和运行，保留全部测试内容。来源诊断共 7 组：6 通过，1 个测试实现的错误文案正则不匹配；实际工具已正确拒绝不一致的 index gitlink。该错误需按真实契约修正测试文字匹配，零写入和拒绝行为断言保持不变，不归因为生产缺陷。原始日志保存在仓外 `tester/sources-diagnostic.log`。

本次未运行会话新测试，未给出最终通过结论。可信 CI 的旧 fixture 需按新来源契约补齐真实 `.gitmodules` 与 gitlink，保留原有候选不能削弱检查的 Oracle。Planner 已将 `PROD-ENTRY-001` 和最小画像澄清交给原 Implementer，在串行窗口修复并冻结新的生产身份，之后 Tester 恢复独立验收。

## IMPL-002-V2 — 陈旧入口证据修复候选

完整 [IMPL-20260917-002-003](attachments/implementation-v3.yaml) 的 SHA256 为 `8e740738b33611ead402788b9665413158c27e58efadc25609b8e38fb4de6969`。它取代上一实现报告作为当前候选说明，旧报告和快照保持原字节。

- 对回执中所有声明匹配的入口进行实际只读核验，缺失、修改或陈旧时保守拒绝；不改写用户入口修复证据，相同完整块与脏正文仍保持 no-write。
- 共享画像及接入说明只链接会话协议，具体根身份、选择记录与历史留在私有状态和必要会话交接中。
- 实现者运行 10 项直接关联回归并用 v1 冻结实现真实复现旧问题；prepare/build/check/diff 通过，check 18/18 可达、0 finding。v1 的 22 项自测是历史结果，不冒称在 v2 重跑。
- 新 `production-snapshot-v2` 经 2209 条目复核；manifest SHA256 `054377a8936304157d5ab479064868d09e952965ee4d7ca9b15736c3d82f75f3`，tree digest `e6146fcf6111ccb5dfce969f9f3f73a2aa1d9e7b79aa313fe32e898bb497b1b8`。
- 制品 SHA256 `7a6ce4b6e240f6cdc2da0409ce05dd58058ed1b75afde0e55c858848f5deb259`；规范版本 `531926db20d4d7d11e7dba3834ea8ce276bc729eca51c7dae133f0ab88db43d8`。仅五个获准生产文件变化，Tester 已写内容、index 和主仓 HEAD 保持原样。
- 生产窗口再次释放，Tester 已恢复独立验收。`PROD-ENTRY-001` 保持待独立确认，作者自测不自行关闭审核发现。

## TEST-20260917-002-001 — 独立本地验收通过

Tester 已释放测试窗口。正式 [测试报告](attachments/test-report-v1.yaml) 为 schema 1、ID `TEST-20260917-002-001`，SHA256 `4740d578554b96fb9e2b11a89d8f7f41e960057374981a4a22f5173994ed9fe7`。独立 [测试代码署名](attachments/test-code-report-v1.yaml) 为 `IMPL-20260917-002-TEST-001`，SHA256 `dec87aef4fe236a6948205c71bf0c06dbcd52f0da045bc0399de7070a860152e`，仅认领七个修改的 tests 路径。

- 受测候选 `a5aeac068367e2880cb9eeca0e253cc405c38c7e` 是隔离验收仓的真实提交，parent 为 `e094623ea9dd21b5d5ac69fcbaec093220cbb5e1`；主仓 HEAD 未改变。
- 原 `npm test` 命令退出 0：59/59 通过，0 失败、0 跳过、0 取消；原 37 项 Oracle 保留，新增 22 组。prepare、build、check、diff 检查全部退出 0；18/18 文档可达、0 finding。
- 五组仓外补充资产通过，覆盖并发、冲突 index、真实 EACCES、特殊文件/祖先链接及入口短写/EIO；它们有独立摘要，不冒充候选提交内测试。实际入口四种陈旧场景的独立真实 TeamAI 回归已通过，用户原字节保留。
- 执行后候选干净；2209 生产条目和 9 个测试文件与交付工作区一致。725 个导入文件、15 个原历史流程文件、依赖与主仓 index/HEAD 均保持。候选和两上游 bundle 已验证，并在新目录实际恢复到相同 HEAD/tree，恢复 prepare 通过。
- 前期 fixture 文案/装配问题及高负载 ETIMEDOUT 均保留原日志。经有界诊断后，完整原命令在既有限制内通过；未增加超时、Skip 或无限重试。
- 新规范的真实宿主加载、恢复/fork/子调用和四角色调用、远端 CI、其他操作系统及主仓正式 G5–G10 未运行。协议阅读、CLI 与文件分发不代替这些证据。

[详细执行证据](attachments/test-evidence-detail.json) 是另一个 schema 2 文件，ID `TEST-REPORT-20260917-002-001`，SHA256 `3274de6db2efde738b74e609a7c2a4b93692150d2bb8790bdeac8f6e0defd379`，不能与正式 schema 1 报告的 ID/摘要混用。原始日志和恢复凭据保存在仓外，私有定位信息见本地交接。

<a id="EVENT-002-START"></a>
## EVENT-002-START

author: ric_devflow_planner；2026-09-17T06:30:00Z。

G2 Spec2 和 G4 测试计划2 获独立 APPROVE，G3 用户实施授权 AUTH-002 有效。TASK-001 开放实现者唯一生产写入窗口，测试代码窗口尚未开放。Root PLANNED → IMPLEMENTING，Task PLANNED → READY → IN_PROGRESS；基线保持 e094623ea9dd21b5d5ac69fcbaec093220cbb5e1。本地实现身份与正式 Git 发布门禁分开记录，不授权主仓提交。

<a id="AUTH-002"></a>
## AUTH-002 — 用户实施授权

author: user / recorded by ric_devflow_planner

用户以 PLEASE IMPLEMENT THIS PLAN 明确批准完整方案。新主会话强制选择、用户状态目录、同会话复用、完整七份资源、基础模式保留历史状态继续开发均已逐项明确选择。本次只做本地实现及隔离验收，不自动提交推送或操作其他工程。

<a id="BASELINE-002"></a>
## BASELINE-002 — 基线与恢复

author: ric_devflow_planner

基线 e094623ea9dd21b5d5ac69fcbaec093220cbb5e1；main 跟踪 origin/main，工作区和 index 开始时干净。Node 24.20.0、npm 11.19.0。npm run check 退出 0，17/17 文档可达，0 finding。已核对用户级五份 DevFlow Skill 与固定来源 100 文件逐字一致，宿主实际提供四种原生角色类型；调用证据在后续角色输出记录。

仓外完整备份 archive SHA256: 14d441292cece9b9859c51076ab9dd54c97c120d103a23a2c774c9a9c590dcc4。实际恢复后 4834 条目路径、类型、权限、链接和字节全部一致，备份期间源未变化。备份绝对位置和会话映射仅保存在本地交接。

<a id="REVIEW-SPEC-20260917-002-001"></a>
## REVIEW-SPEC-20260917-002-001

以下为审核者完整原始载荷；仅批准 Spec，不代表实现和测试通过。

```yaml
schema_version: 1
review_id: REVIEW-SPEC-20260917-002-001
supersedes: null
mode: SPEC_REVIEW
reviewer: ric_devflow_reviewer
created_at: "2026-09-17T06:20:45Z"

target:
  root_issue_id: REQ-20260917-002
  task_id: TASK-001
  spec_version: 1
  path: .devflow/changes/REQ-20260917-002/attachments/spec-v1.md
  sha256: 254321b2daf4318bed0cbb6bb1b34832afcbe9f67726efbc114359e2a32ed135
  current_path: .devflow/changes/REQ-20260917-002/current.md
  current_matches_snapshot: true
  base_sha: e094623ea9dd21b5d5ac69fcbaec093220cbb5e1

verdict: APPROVE
summary: >-
  规格覆盖已批准的来源管理、完整分发、会话选择与持久化、
  基础模式隔离、独立工程约定及可信 CI。
  对照现有实现，必要修改点、保持行为、写入所有权和本地交付边界明确，
  未发现阻断实施的规格缺口。

findings: []

verified:
  - criterion: AC-SOURCE
    conclusion: >-
      两个固定子模块与六包映射明确，gitlink、子模块 HEAD 和来源锁交叉校验；
      未提交迁移以 index 中真实 gitlink 为候选依据。
      仅从干净本地源准备，不联网、不执行上游代码、不跟随分支。
      导出完整包内容及执行身份，排除上游外层非包内容。
      未知或已改动导出拒绝覆盖，只有可由回执证明未改动的自有导出可更新；
      并发、中断和源变化均有失败要求。
  - criterion: AC-DISTRIBUTION
    conclusion: >-
      保留七份 Skill、现有目标路径、真实隔离 TeamAI pull
      和定制/禁用保护。新摘要范围明确排除本机路径及会话状态，
      回执区分资源安装、项目常驻入口与实际宿主加载。
      入口追加沿用授权、脏文件和局部标记保护，不交由治理 apply 改写指令文件。
  - criterion: AC-SESSION
    conclusion: >-
      项目身份、宿主和 root session ID 构成独立键；
      worktree 家族共享项目身份，但新建和分叉会话不得继承旧选择。
      status 严格只读，选择前不创建持久化目录；
      损坏记录与环境错误不降为默认选择。
      select、switch、历史、私有权限、原子落盘和并发拒绝具备明确约束，
      子调用只查询并继承 root 记录。
  - criterion: AC-MODE
    conclusion: >-
      推荐不等于同意，未选择前只允许必要身份检查；
      同会话恢复复用，身份无法证实重新询问。
      basic 不加载 DevFlow 正文、不准备或调用四角色、不写流程状态，
      仅只读引用原约束继续获准开发。
      模式切换停止本会话执行者，不能清理他人工作或自动取得门禁批准。
  - criterion: AC-STRUCTURE
    conclusion: >-
      两模式共享结构与文档约定。
      旧仓仅画像和推荐最小调整，新项目结构纳入当前方案确认；
      不强制模板、自动搬移或新增独立审批链。
  - criterion: AC-CI-DOC
    conclusion: >-
      子模块配置、gitlink、来源映射及准备脚本列为需独立审核的治理输入，
      不允许候选自降门禁。
      来源网页使用固定提交链接，生成包保留本地相对引用。
      验收要求当前候选构建、全部测试、检查及独立审查，
      不借用历史通过结论。

source_alignment:
  - path: tools/distribution.mjs
    observation: >-
      当前来源校验绑定六份展开目录，sourceDigest 扫描范围较宽；
      新规格明确要求改为子模块一致性校验及实际资源摘要，
      同时保留既有目标冲突与真实分发保护。
  - path: tools/cli.mjs
    observation: >-
      当前只路由四项治理动作并读取 policy；
      新 session 接口有独立参数和退出码约定，
      实施需保留原四动作兼容性。
  - path: scripts/build.mjs
    observation: >-
      当前生成单文件分发工具，规格复用该分发方式，
      不新增运行时或业务依赖。
  - path: scripts/ci-check.mjs
    observation: >-
      当前治理路径识别尚未包含子模块配置与上游 gitlink；
      AC-CI-DOC 已要求同步补齐。
  - path: rules/collaborative-foundation-infra.md
    observation: 当前默认 DevFlow 路由须按已批准会话选择门禁改写。
  - path: skills/common/collaborative-foundation-infra/references/delivery.md
    observation: 当前无条件交付职责描述须与 basic 模式边界同步。
  - path: sources.lock.json
    observation: 现有固定提交及六包共 725 文件与规格保护范围一致。

non_blocking_notes:
  - >-
    session 选择是 Agent 协议；规格已明确不宣称能够防止伪造参数
    或通过任意 shell 工具绕过，不应在实现文档中扩大为系统级权限沙箱。
  - >-
    固定来源迁移与导出更新必须保留旧导出归属判定，
    不能把目录已存在或被忽略当作工具拥有该目录的证据。
  - >-
    项目常驻入口写入与资源分发是不同动作，
    实施和测试应分别核对授权、冲突、回执及未验证的宿主加载状态。
  - >-
    本轮现有角色协作不构成未来会话的模式选择；
    不得为本轮执行自动补造用户选择记录。

evidence_reviewed:
  - .devflow/changes/REQ-20260917-002/attachments/spec-v1.md
  - .devflow/changes/REQ-20260917-002/current.md
  - tools/distribution.mjs
  - tools/repository.mjs
  - tools/cli.mjs
  - scripts/teamai-sync.mjs
  - scripts/verify.mjs
  - scripts/ci-check.mjs
  - package.json
  - sources.lock.json
  - rules/collaborative-foundation-infra.md
  - skills/common/collaborative-foundation-infra/references/delivery.md

review_boundary:
  - 本结论只批准固定版本规格，不表示新实现、测试或宿主运行已通过。
  - 已核验当前 HEAD 与声明基线一致；未运行会写入的准备、分发或安装动作。
  - 未修改文件，未派生代理，未访问其他业务工程或旧 Root 历史。
  - 本地冻结候选可用于独立验证；主仓提交、推送及正式发布门禁不在本批准范围。

unblock_conditions: []
```

<a id="REVIEW-SPEC-20260917-002-002"></a>
## REVIEW-SPEC-20260917-002-002

```yaml
schema_version: 1
review_id: REVIEW-SPEC-20260917-002-002
supersedes: REVIEW-SPEC-20260917-002-001
mode: SPEC_REVIEW
reviewer: ric_devflow_reviewer
created_at: "2026-09-17T06:26:35Z"

target:
  root_issue_id: REQ-20260917-002
  task_id: TASK-001
  task_revision: 2
  spec_version: 2
  path: .devflow/changes/REQ-20260917-002/attachments/spec-v2.md
  sha256: c73d9a274b7c3a645fe340061a9584886689958e2d5be3c1a4f60e54a13c6203
  current_matches_snapshot: true
  base_sha: e094623ea9dd21b5d5ac69fcbaec093220cbb5e1

verdict: APPROVE
summary: >-
  新增接口将已批准的入口追加行为变成显式、可测试的操作，
  保持原分发默认行为与授权边界。
  预览、资源安装、入口追加三种情况区分明确，
  整体预检及正文保护要求足以约束实现，未发现阻断规格问题。

findings: []

delta_review:
  changed_scope:
    - AC-DISTRIBUTION 新增入口追加技术契约
    - TASK-001 revision 更新为 2
    - 版本及变更记录
  verified:
    - 无 --apply 时仅预览，不因 --install-entry 创建项目文件。
    - 单独 --apply 保持现有资源分发行为，不隐式追加常驻入口。
    - 只有 --apply 与 --install-entry 同时出现才执行已授权的局部追加。
    - Codex 与 ZCode 共用不硬编码宿主名的 AGENTS.md 区块，Claude 使用 CLAUDE.md。
    - 任何写入前整体核对资源、入口及回执，不能先安装资源再发现入口冲突。
    - 入口重叠脏内容、软硬链接及不完整或定制区块拒绝，保留原正文并保持重复操作幂等。
    - 源码检出与分发安装使用各自真实相对路径，不混用两种布局。
    - 回执只能证明区块存在或匹配，不能由此推定宿主已加载。
    - 新接口不是任意指令文件编辑器，治理 apply 的既有禁止范围不变。
  source_alignment:
    path: scripts/teamai-sync.mjs
    observation: >-
      当前解析器只有资源分发的 --apply 行为；
      新接口是显式增量，不要求改变原参数含义。
      实施时应将入口纳入分发的整体预检与写前复核。

prior_review_reuse:
  review_id: REVIEW-SPEC-20260917-002-001
  prior_spec_sha256: 254321b2daf4318bed0cbb6bb1b34832afcbe9f67726efbc114359e2a32ed135
  basis: 已核对完整 v1..v2 文档差异，除声明增量外其余行为及保护范围未变。
  retained_scope:
    - 固定来源与导出归属保护
    - 会话身份、选择和持久化
    - 基础模式隔离及恢复
    - 独立工程约定
    - 可信 CI、本地验证与发布边界

review_boundary:
  - 仅批准固定版本规格，不表示新增接口已经实现或测试通过。
  - 实现及测试仍须绑定后续真实候选身份。
  - 本轮只读，未修改文件、执行安装或派生代理。
  - 本地交付审查不冒称主仓提交、推送或正式 Git 发布门禁完成。

unblock_conditions: []
```


<a id="AUTH-005"></a>
## AUTH-005 — TeamAI 官方 Skills 与 latest 实施授权

用户批准最终计划：新增固定 TeamAI 子模块，默认十包，首次安装或显式升级获取 latest，CLI/Skill 来源分离；维持权限保护、独立测试审核和仅本地交付。Spec4 的来源与同名覆盖判断基于前一轮对官方固定提交和本地 npm 包的只读核对，13个Skill文件相同；实现后仍须重新验证。当前工作区5159条目已完整备份且实际恢复一致；详细摘要见 Spec4。未写真实模式选择、未修改现有状态目录权限。


## REVIEW-SPEC-20260917-002-004

[独立规格审核原文](attachments/review-spec-v4.yaml)：APPROVE，findings为空。仅批准Spec4，不是实现、测试或发布通过。


## TESTPLAN-004 — 本轮独立测试计划

[TestPlan4快照](attachments/test-plan-v4.md)，SHA256 91b6de0e395fdccf631701511a3bb7db491e83728ab31e7e0cdd8486937d220a，绑定Spec4和技术接口补充，待独立TEST_REVIEW。前序隔离候选53d29b7fc9906aa5556bb66e476568dc8a446815新运行62/62通过，52.354s，0失败/跳过/取消；仅作前序代码基线，README后续差异不含在该SHA，不是Spec4验收。原始基线记录摘要ecd23a3ca7204d42c7d4039ba919e820856819eb4e91f9ae3c1d00d8f57b8390。


## REVIEW-TEST-20260917-002-003 / EVENT-005-START

[独立测试计划审核原文](attachments/review-test-v4.yaml)：APPROVE，无findings。AUTH-005、Spec4审核和TestPlan4审核齐备；开放原实现者唯一生产写入窗口，Tester暂不写tests。主仓不提交，本地候选的正式Git门禁仍不冒报。


## DEC-005 — 固定指南的精确导航映射

2026-09-17T12:34:45Z，Planner 只读确认固定 TeamAI 提交中 `docs/usage-guide.zh-CN.md` 第17行目录的 `#项目级project-scope` 与第117行实际标题“项目级（Project Scope，默认）”不匹配。允许在来源锁中对该指南登记唯一目标映射至 `#项目级project-scope默认`，仅在临时分发指南中转换链接目标；子模块原文件、两份官方 Skill 与指南正文保持不变。这是 Spec4 已授权的受登记导航转换，不扩大为自动修改未知断链。旧目标必须存在、新目标必须唯一有效；陈旧映射、其他未知或歧义链接继续报错。独立 Tester 与 Reviewer 在最终候选核对这条映射及拒绝行为。


## TESTINPUT-004 — 独立输入与预期清单

Tester 在仓外直接从三个固定 Git 提交生成八包738文件的字节/执行位清单，未调用生产校验或转换函数。原 RIC 725文件与上一隔离候选锁记录零差；官方两包13文件与实际 npm latest 0.24.0归档零差。2026-09-17T12:25:32Z 查询得到的归档472550字节，SHA256 `ee197830867cbd3b88509a3aa094cb7e33672318eb5af6588882e9874e2fe631`，声明的 SHA512 SRI 与 SHA1 均核验一致；这是固定测试输入，不代表新增准备/升级实现已验收。

独立指南预期包含73唯一标题、3相对目标、25本地锚和6外部链接，只有 DEC-005 登记的目录目标需修复。三条相对目标映射到固定提交，其他正文/代码/外链保持。仓外输入索引摘要 `db05dc4bfa210122f9a08cbdb34e313276d5e0afce246135884ec340f1fa2986`；上游包清单 `f95d801caf65e8fcd22379fdf38f2f4b68b29b193f3f1dc503993a066d5b93e8`；指南导航预期 `8be51624f3e5674a01c9bcfe5d58759df4fdd48b70e39241f70ecac9e8b5306c`。后续执行仍须绑定最终生产及测试候选。


## EVENT-005-TEST — 生产冻结与独立测试窗口

实现者冻结1374文件生产清单，SHA256 `f2ea9478629649c2156d55d1a7c12c544d2e3ac63d0e100cc09a08247945740d`，仓外快照已恢复核对。artifact `4b71b251cc801781c94a1b1dc9db4daa24956b8bf57eef3672663179f2396147`，standardVersion `6a3419c49c4e6647a49df7af3d26a906a314e2e259f5e178cb1fcbb731ca9b71`；作者完成首次 latest 准备及8项冒烟自检，三种宿主目标均经真实 TeamAI 核对十包760文件。这是作者自检，不是独立验收或原生加载证明。

生产写入窗口关闭，独立 Tester 接管 tests；Reviewer 只读预审冻结生产，最终 CODE_REVIEW 等待完整候选与测试报告。Planner 对照实施前备份核对 index，增量仅 `.gitmodules` 和新 TeamAI gitlink；原有暂存内容与主仓 HEAD 保持。


## IMPL-20260917-002-007 / REVIEW-PRODUCTION-20260917-002-001

[作者实现报告](attachments/implementation-v7.yaml) 已原样归档，SHA256 `489bb8b7b87fb02e7daec9b6a12c5f4924721d5901b34a58bf6e9f28e854543c`。[冻结生产预审](attachments/review-production-v5.yaml) 为 REQUEST_CHANGES，两项 P1：切换 current 后清理失败可能报错却已切新版；失败清理未核对目录身份可能删除被并发替换的未知内容。Planner 确认属于实现缺陷，Spec4 与测试 Oracle 保持；Tester 正在独立复现并补回归，随后串行交原实现者修复。未将作者通过记录转为最终交付通过。


## TESTDEF-TA-RUNTIME-001 / TESTDEF-TA-RUNTIME-002

独立复现确认两项实现缺陷，3项最小回归全部FAIL。[可移植证据索引](attachments/defects-runtime-v5.md)绑定冻结生产和测试字节，原始报告/现场完整保留于仓外，未运行完整套件。Tester明确释放测试窗口，Planner开放原实现者唯一生产修复窗口，范围限runtime及必要构建制品；测试、上游、Root与用户内容保持保护。修复不得吞错、弱化Oracle或扩大未知目录删除范围。


## EVENT-005-RETEST — 运行时修复冻结

生产v7清单1374文件，SHA256 `ca49201954c23179d5b54af9a339dd6693891875c19c4a361990999d051097ef`，相对v6仅runtime源码和构建生成bundle改变；11个测试文件、index、主仓HEAD及其他生产保持。作者重跑原3项失败回归3/3通过，锁释放EIO与锁替换补充自检2/2通过；prepare/build/check/diff通过。新artifact `fcd398972a57b413463c5891808835ef9bbf2199d58e96c2b7abf7e445c00bf1`，standardVersion `86c77ec3ec153cfd3b8e8feb893d175dbea52306094f29ad806a3fdaa9be08f1`。

生产再次关闭写入，独立Tester恢复完整测试窗口，Reviewer并行只读复核修复。两项缺陷等待独立复测与最终候选审核，不因作者自检自动关闭。


## IMPL-20260917-002-008 / REVIEW-PRODUCTION-20260917-002-002

[有界修复作者报告](attachments/implementation-v8.yaml)，SHA256 `7e938373adc002f9bfd9f4ac7d4153263c5fc40fab60009c32941ff3a6606a88`。[增量预审原文](attachments/review-production-v6.yaml)确认两项原P1直接路径已处理、等待独立验证；另发现P2 PROD-TA-RUNTIME-003：锁释放前对外解析可能拿到B入口，随后writer收尾失败回滚并删除B，导致已返回入口消失。Planner分类为同一原子发布边界的实现问题，交独立Tester优先最小并发复现；生产仍冻结，Spec/Oracle不变。


## TESTDEF-TA-RUNTIME-003 — 独立读者竞态复现

Tester在生产v7真实准备完成、work删除之后和锁close之前启动独立Node读者。读者退出0并返回当时存在的B入口；writer随后的close EIO恢复旧current并删除B，已返回入口随之消失。1项回归FAIL、0跳过/取消；原3项缺陷回归独立3/3通过、来源适配11/11通过，不用于关闭003。仓外 `tester/runtime-reader-race-v7-boundary/defect.json` 摘要 `481078057238bfec7a7e8606a97d9354f042f82bcedddd4eee7201f413bb14d3`，完整现场及输出保留。前两次未触发边界的测试装配错误另行保留，未改产品断言或生产。

测试者明确释放窗口，原实现者仅修runtime的公开读取事务边界及必要构建制品。内部持锁核验不导出跳过参数；保持前两缺陷的恢复/归属保护。主仓正式状态与Git发布门禁仍不冒报完成。


## IMPL-20260917-002-009 / EVENT-005-FULLTEST

[003修复作者报告](attachments/implementation-v9.yaml)原样归档，SHA256 `b93deece3b8b85199e236f3064ec345be2e94ac2e1edf5e70b42280e1efc3c56`。生产v8清单1374文件，SHA256 `28ae10c0160bcd990e575b0794fc70f721664abdb2290695a2bfa4edaef158e3`；相对v7仍仅runtime与正常构建制品变化。artifact `951f64b0e306db7b301787b72198d9d54c10c270808da72b243344c994c9547b`，standardVersion `44040143c90c3d669397441e111611614f10cc4bb218ffb0de853f3ca7efa765`。

作者重跑四项原runtime回归4/4通过；稳定读取/离线复用、成功升级且旧安装可用、经公开resolver十包分发的作者场景通过，prepare/build/check/diff退出0。11个tests、index与主仓HEAD保持。已恢复独立Tester完整验收窗口，Reviewer只读复核增量；三项发现的最终关闭继续等待完整候选和独立证据。


## REVIEW-PRODUCTION-20260917-002-003

[有界生产修复审核](attachments/review-production-v7.yaml)：APPROVE，仅批准v8的修复增量。Reviewer逐项核对1374文件及两文件差异，三项原发现代码路径已处理，无新增finding。陈旧或未知锁继续保留并拒绝，不自动删锁或修权限。完整候选、独立测试与最终CODE_REVIEW仍待交付，本条不提前关闭验收或Git发布门禁。


## TEST-20260917-002-004 / IMPL-20260917-002-TEST-004

独立 Tester 完成并封存[执行报告](attachments/test-report-v4.yaml)，SHA256 `c5b5f8c35b27fcd7785382462d1b1e428759cd6945b250c13427dfacbc9bdabf`；[测试代码报告](attachments/test-code-report-v4.yaml)，SHA256 `ab8d05daa363c060afb07021411f6beda4c8209a176f31656092204edef084f7`。两份 schema1 原文归档，绑定受测候选 `8c1edc969f1264b6ffa147238457b65358904b5c` 及真实父 `53d29b7fc9906aa5556bb66e476568dc8a446815`，判定 PASS，仅限声明的本地 Linux 验证范围。

完整 `npm test` 81/81、原补充6/6、计划内运行时补充5/5，0失败/跳过/取消；未重复运行已通过的完整套件。来源准备、运行时离线复用、build、check及diff退出0；治理20/20可达、0finding，十份Skill结构和738个固定上游文件/执行位全部通过。三项运行时缺陷在最终候选独立复测关闭，原始失败证据保持。

实际版本证据为2026-09-17T12:25:32.166456Z一次独立官方latest查询的0.24.0及固定SRI归档，随后执行真实npm安装与三种目标的真实TeamAI pull。合成生命周期元数据、开发基线版本差异与故障注入独立标注，不冒充未来发布版已兼容。共享报告与原始执行日志区分，报告不含机器绝对路径。

Tester 的 `correspondence-final.json` 摘要 `e4f22dcc0cc4843f4f1d7bfbd097b496980216e3291ed72b1c19855cb94b6ffb`：1374生产及12测试字节/模式匹配、41历史记录保全，主仓HEAD不变。Planner独立重查相同结果，并与本轮实际恢复的开始状态比较逻辑index，变化仅为授权的`.gitmodules`和第三gitlink；索引缓存字节变化不当作内容变更。

`recovery-receipt.json` 摘要 `c13f69638b75ebfbc8c6b9d2ce8254fa7c6bf32ee918c1fbbf495a3ad73e5342`，四bundle逐一验证后实际恢复到新目录，HEAD/tree/三个固定SHA及readonly prepare通过。`candidate.bundle` 摘要 `4fc0cd6a7a08d257ff272030af064fd4a02f401a6b9a5286f9f75737afeb4e22`。原始日志、资产与失败现场位于本轮私有恢复档案 `teamai-official-20260917T120800Z-i0e11mkg/tester/`；14项直接资产摘要由Planner回读核验，与正式报告一致。


## REVIEW-CODE-20260917-002-005 / LOCAL-DELIVERY-005

[最终CODE_REVIEW原文](attachments/review-code-v5.yaml)，SHA256 `e1627f19c63c12cf3b61e0c1684e797f17dcdb94e6c15b2b6a173ed75013d297`：APPROVE。Reviewer直接核对完整候选身份、生产/测试增量、92组独立结果、补充资产、实际恢复及30项直接证据和日志摘要，无剩余阻断finding。PROD-TA-RUNTIME-001/002/003及对应TESTDEF均有独立闭合证据，历史预审不改写。

Planner据此将本轮`local_delivery`记为complete，记录当前实现/测试/审核ID和精确候选；Root/Task正式状态和主仓Git身份保持，不用仓外候选冒充主仓新提交或G5–G10通过。未运行原生宿主/角色、实际知识生成/团队发布、未来CLI或其他OS、远端CI；其他工程与已有全局安装未改。之后只追加本Root交付记录，不修改已冻结生产或测试。


<a id="AUTH-006-PUBLISH"></a>
## AUTH-006-PUBLISH — 提交与普通推送授权

用户在本地交付后明确要求“提交推送”。本次授权覆盖当前已验收的上游子模块迁移、会话模式、十包分发、私有CLI准备/升级，以及配套测试、文档和本Root证据；目标为既有`origin/main`。不更改上游版本、其他工程或全局安装，不强推、不改写历史，不创建远端或标签。

提交前重新核对：本地HEAD、tracking和实际远端main均为`e094623ea9dd21b5d5ac69fcbaec093220cbb5e1`，无冲突和未完成Git操作。1374生产文件及全部12测试文件与已审候选逐字/模式一致；49份未跟踪Root记录、11个生产文件和7个测试文件均属于本轮交付。暂存的725个旧展开文件删除项逐一对应固定上游的原文件和摘要，不丢失原包内容。

本轮重新运行`npm run prepare:skills`、`npm run check`通过，20/20文档可达、0finding；构建一致性在check中通过。原完整81项及6+5项补充仍绑定同一未变生产/测试候选，不重复执行或改写报告。对全部待提交文件检查私钥、常见令牌、含凭据URL、机器Home路径、旧项目标识与合并标记，所检模式无命中；未发现新增符号链接或高风险凭据文件名。本条仅记录授权和提交前证据；提交及推送结果以实际Git对象与远端核验记录为准。
