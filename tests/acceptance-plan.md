# 测试入口与计划来源

当前维护的正式测试范围、AC 映射、环境权威层级、基线和退出条件统一记录在[独立测试计划](../.devflow/changes/REQ-20260917-002/test-plan.md)。计划批准不代表执行通过；实际审核与执行结果由[证据索引](../.devflow/changes/REQ-20260917-002/evidence.md)绑定完整候选。此前维护记录沿各 Root 的历史索引保留。

`npm test` 使用 Node 原生测试框架执行 `tests/*.test.mjs`。原有 62 组中的有效行为与保护性 Oracle 保留；当前来源为三个固定子模块，分发在私有临时目录组装十包。旧导出回执、发布锁等专属用例按计划矩阵替代，会话私有持久化、项目入口安装、可信治理与故障保护继续保留。真实 Git 刷新在隔离组装团队源中执行，以成员已拉取 clone 为分发源，逐文件比较完整 POSIX 模式与字节；来源包与跨平台分发另独立验证字节和执行位。

- `sources.test.mjs`、`source-fixtures.mjs`：合成 Git 上游、index gitlink、只读校验、临时组装、未知旧副本保全、升级、故障与并发。八上游包直接比对真实来源；原四处导航、CLI 入口及官方指南的限定转换采用独立明确映射构造预期，不用生产转换函数生成 Oracle。
- `session.test.mjs`：隔离 HOME/XDG、根身份、跨 worktree 恢复、子调用限制、私有权限、历史与原子写失败。
- `entry.test.mjs`：真实三 harness 分发、显式入口追加、用户正文保全、陈旧回执拒绝与可信 CI 治理识别。

- `governance.test.mjs`：文档解析、状态与债务、四动作 CLI、确定性整理、并发和写入保护。
- `distribution.test.mjs`：来源完整性、真实 TeamAI 分发、禁用与定制保护、版本刷新、工程身份和分发后导航。
- `ci-runtime.test.mjs`：可信 Git 基线、已分发布局、受限安装、离线和 Markdown 降级。
- `teamai-resources.test.mjs`：第三子模块、官方指南与许可、唯一锚点修复、真实 CLI 内置包和实际 pull 未知输出拒绝，以及官方方法的授权路由。
- `teamai-runtime.test.mjs`：首次准备、离线复用、显式升级、失败保旧、权限/完整性、锁和目录身份、原子发布及独立进程读者。
- `teamai-fixtures.mjs`：锁定开发版的 npm 元数据边界；真实归档及 npm 安装、CLI 身份和 pull 不伪造。普通套件不在线查询 latest。可用 `COLLABORATIVE_FOUNDATION_INFRA_TEST_TEAMAI_ARCHIVE` 指定预先获取的归档（先核对开发锁 SRI），用 `COLLABORATIVE_FOUNDATION_INFRA_TEST_TEAMAI_DATA_HOME` 指定测试者创建的完整隔离准备安装（仍验证来源）。未提供时在测试临时目录获取固定归档并准备；需要 npm 安装所需网络。实际 latest 查询及其完整性记录作为单列验收证据。
- `helpers.mjs`：独立合成仓、执行器和文件清单；`COLLABORATIVE_FOUNDATION_INFRA_KEEP_FIXTURES=1` 可保留本次临时测试现场，默认在测试结束后清理自身资源。

测试者仅修改测试代码；生产改动与测试写入串行。仓外验证资产执行完整恢复、保护范围与待移除标识扫描，不在产品测试中重新写入历史项目数据。所有真实命令、退出码、未运行项和受测 SHA 均以执行报告为准；本页不声明测试已通过。
