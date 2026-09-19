# 本次维护证据

<a id="BACKUP-001"></a>
## BACKUP-001 — 完整恢复核验

- 外部归档身份：`migration-20260917T033224Z`，由交付说明提供仓外位置。
- 条目数：4805；实际恢复比对：通过（路径、类型、模式、文件摘要和符号链接目标）。
- archive_sha256: `24135e794dbe057fb281f6fa8b97cd249d04f5ec4b7ad203a8ed175bc3a56de4`
- manifest_sha256: `1315306ef88d1f58e59bed3efca0067acd6ec17f039e3afca3d3e3d10bf92013`
- 创建时间：2026-09-17T03:32:32.028697+00:00
- 仓外基线 base_sha: `d78b68779899fa9167ec24599a301902c91724cb`；当前仓库 HEAD 为空，二者不等同。
- 原历史记录原字节保全；本仓 Git 元数据未修改。

<a id="AUTH-001"></a>
## AUTH-001 — 本次授权边界

用户直接要求整体改名和去除特定业务工程内容，并明确允许修改 .devflow。普通本地修改、独立测试及隔离候选由既有授权覆盖；无本仓提交、推送、远端、全局安装或其他工程操作授权。

<a id="AUTH-002"></a>
## AUTH-002 — 工作目录路径

用户明确选择保留当前本地工作目录路径，仅改项目内容和对外标识。文档及正式记录不依赖该本机路径。

<a id="REVIEW-SPEC-20260917-001"></a>
## REVIEW-SPEC-20260917-001

独立审核 APPROVE；[原样审核结果](reviews/spec.yaml) 绑定 current.md 的 Spec 1 摘要。不代表代码或测试已通过。

<a id="REVIEW-TEST-20260917-001"></a>
## REVIEW-TEST-20260917-001

独立测试计划审核 APPROVE；[原样结论](reviews/test-plan.yaml) 绑定 test-plan.md v1 摘要。

<a id="BASELINE-TEST-001"></a>
## BASELINE-TEST-001 — 独立基线结果

测试者在仓外基线 `d78b68779899fa9167ec24599a301902c91724cb` 执行 npm ci --ignore-scripts、npm run build、npm test；退出均为 0，34/34 测试通过，0 skip。Node 24.20.0 / npm 11.19.0。构建未改变被审文件，三个阶段 Git 状态均干净。

npm run check 退出 1：32 项发现（1 FLOW_CONFLICT、31 BROKEN_LINK），均引用未装配至隔离候选的历史 .devflow 附件。分类为隔离装配环境缺口，未将旧附件重新引入当前交付树，也未放宽策略。原始日志保存在外部归档 tester-baseline/。该结果不证明最终改名候选通过。

<a id="EVENT-001"></a>
## EVENT-001 — 生产窗口

在用户授权、Spec 与测试计划独立批准、完整备份及基线检查齐备后，开放 Implementer 的唯一生产写入窗口。Tester 暂不改测试；Planner 维护流程记录。本仓正式 Git 状态仍为 PLANNED，局部执行结果与仓外候选另记，不伪造主仓 SHA。

<a id="DEFECT-BASELINE-001"></a>
## DEFECT-BASELINE-001 — 归因与处置

独立[基线报告](reports/baseline.json)按原字节保留；其 BLOCKED 仅指原隔离树未装配历史流程附件的文档图切片，34 项行为测试及构建已通过。

Planner 归因为 `environment`，缺口不阻断已批准的命名维护；不称为原仓历史失败，不补回项目专属附件。完整复现保存在外部归档 tester-baseline/defect-baseline-001.json，SHA256 `dc3e4ca8c93c6e436beed2840b83c70d7e762e94a03242efcc033d98aaf0b46f`。最终候选须以新的通用流程记录通过同一严格检查，未完成前不能视为已解决。

<a id="TEST-PROTECTION-001"></a>
## TEST-PROTECTION-001 — 独立恢复与保护范围核验

独立 Tester 重新计算归档/原清单摘要、枚举归档目录并扫描实际恢复树：4805 条目无差异；保护范围2612条目无变化，其中六份上游725个文件、Git元数据1548条目及sources.lock.json保持原样。[中性结果原文](reports/protection.json)。Git结论仅为元数据未改动，不表示清理内部历史。

仓外可复现脚本身份：tester-verification/verify-protection.py，SHA256 `89508a6ffbc5720f9ec10f0556aafe114297d740f782418e1d024a08a885a8ca`。最终交付前仍需对保护范围复查。

<a id="EVENT-002"></a>
## EVENT-002 — 独立测试窗口

2026-09-17T03:52:21.191523+00:00；操作者 ric_devflow_planner。实现者已释放生产窗口，测试者仅修改 tests 并在同一仓外候选继续追加测试变更。

生产候选 SHA `5be7d0c5e943bcb6d4233a51e2f74516f295bf69`，父提交 `d78b68779899fa9167ec24599a301902c91724cb`。该提交包含生产变更及 Planner 当时的通用流程记录，tests 尚未适配；不是最终受测候选。784文件对应清单存放在外部归档 tester-final/production-source-manifest.json，SHA256 `b4d1e989c0e9a22522a18c039bf51a1e2a8dabc445c214d87a5ab06e56006f8d`。生产作者范围与过程记录分别归属，不宣称整提交由单一作者完成。

<a id="IMPL-002"></a>
## IMPL-002 — 生产作者范围

[实现报告](reports/implementation.yaml)绑定生产候选 `5be7d0c5e943bcb6d4233a51e2f74516f295bf69`，43个生产文件与作者快照逐一一致；排除Planner流程记录和Tester后续变更。报告摘要 `4ba80a473c5d7e747171acdfb2409e318ebe182cf73c4a1aaeeab73bcbb01dfe`。首版对无空白问题的 diff 命令退出码表述不准确，现版本按实际结果记0/1；原版仅在仓外保留，未改变生产内容或候选身份。

<a id="CANDIDATE-001"></a>
## CANDIDATE-001 — 完整候选

包含生产与独立测试代码的完整仓外候选为 `c0830203fbb5a00b3a76f9e3e69d439e5320dd09`，直接父提交为上述生产候选。测试者仅修改原5个tests文件，保留34项并增加3项。本仓后续流程证据追加与已冻结代码身份分别记录；正在执行的测试不能提前标为通过。

<a id="TEST-FINAL-001"></a>
## TEST-FINAL-001 — 独立完整候选验证

[独立测试报告](reports/test-report.json) Verdict PASS，绑定 `c0830203fbb5a00b3a76f9e3e69d439e5320dd09`；`npm ci --ignore-scripts --offline`、build、test、check 均退出0。37/37测试通过，0失败、0跳过；受管理文档17/17可达、0发现。原34项行为与新增3项改名回归均由独立测试者执行。

[测试代码作者报告](reports/test-implementation-report.json) `IMPL-TEST-001`仅覆盖生产候选之后的5个tests文件。[完整树核验](reports/tree-report.json)记录当前工作树与候选扫描零残留、2612保护条目不变，排除Git/过程证据/安装依赖后两棵交付代码树逐路径、类型、mode和字节一致。[接入指引审核](reports/guide-review.json)区分当前目标预检与另行授权的既有安装迁移。

本次实际分发验证不证明新宿主加载或原生角色调用；这些切片、其他平台、远端CI保护及正式主仓Git门禁均按报告标记not_run。主仓无提交，仓外候选身份单列。

<a id="DEFECT-BASELINE-001-CLOSURE"></a>
## DEFECT-BASELINE-001-CLOSURE

2026-09-17T04:00:08.343555+00:00；Planner核对最终check退出0，当前通用流程记录的17份文档导航完整，原隔离装配缺口不再阻断本次交付。该诊断切片关闭；历史报告继续保留BLOCKED原义，不改写为PASS，也不宣称原始历史资料已重新测试。

<a id="REVIEW-CODE-20260917-001"></a>
## REVIEW-CODE-20260917-001 — 独立完整候选审核

[审核原文](reviews/code.yaml) Verdict APPROVE；真实base/生产/完整候选血缘、全部净差异、测试作者范围、37项结果、全树零残留及保护范围核验均已审阅。没有阻断发现。审批仅绑定仓外完整候选，不冒充主仓提交或正式Git门禁。

<a id="BUNDLE-001"></a>
## BUNDLE-001 — 完整候选持久恢复

[恢复回执](reports/bundle-receipt.json)记录外部 tester-final/candidate.bundle，SHA256 `18118ea878c53472e0fb8488641aa125e25112c8db4d63c21d9135c44d61adce`。git bundle verify、独立目录实际恢复、git fsck均通过；恢复HEAD为受测候选，784个blob逐字一致，tree为 `efefa4830b2eda97fb22d8909a8d4d0cd4573537`。原候选保留；历史父对象只在仓外归档中保全，未写入主仓Git。

<a id="LOCAL-DELIVERY-001"></a>
## LOCAL-DELIVERY-001 — 本地交付完成

2026-09-17T04:02:44.767624+00:00；操作者 ric_devflow_planner。用户授权的本地名称与通用性维护已实现、独立测试通过并经独立审核批准。完整工程名称、自有入口、回执、缓存、变量、规则与文档标识统一；特定业务材料原字节移至仓外，当前规范及过程记录保持通用。

后补过程证据不自动归入已冻结tested_sha；代码/测试对应性和归档身份分别记录。保留用户指定的物理工作目录，其他工程与全局安装未操作，本仓未提交或推送。正式root/task状态保持未完成Git门禁的原义，local_delivery仅记录本次已授权的本地交付结果。

可从 [README](../../../README.md)、[Agent接入指引](../../../skills/common/collaborative-foundation-infra/references/adoption.md) 与 [验证说明](../../../docs/validation.md)使用当前规范。
