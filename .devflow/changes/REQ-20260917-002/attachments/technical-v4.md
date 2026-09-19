---
schema_version: 2
root_issue_id: REQ-20260917-002
revision: 4
change_type: TECHNICAL
author: ric_devflow_planner
---

# TASK-001 rev4 — 上游目录归入 skills

用户 AUTH-004：明确要求将 upstreams 放到 skills 下，并修正关联文档链接。本修订覆盖 Spec3 中上游目录位置，其他 AC、来源版本、分发结果、会话模式和权限边界继续适用；不新增 Task 或依赖。先由原 Reviewer 对本局部技术修订及原 TestPlan3 适用性确认，再由原 Implementer、Tester 串行实施和验证。

## 精确差异

- 仅将 upstreams/ric-devflow 与 upstreams/ric-design-patterns 移到 skills/upstreams 下同名目录。使用 Git 子模块移动能力维护 index gitlink、.gitmodules、工作树 Git 指针及内部 core.worktree；保留子模块名称、URL、固定 SHA、全部内容及主仓其他暂存状态，不提交或推送。
- .gitmodules 的 path、sources.lock.json 两上游与六包 path、tools/sources.mjs 严格路径、scripts/ci-check.mjs 的可信路径随之调整；schema3 语义、固定身份核验和不可信候选保护不变。CI 对 skills 下 gitlink 的变化仍需治理复核；历史根 upstreams 的回退或重新引入仍受治理识别，不放宽检查。
- manifest/governance.json 的保护路径改为 skills/upstreams；允许顶层清单移除 upstreams。同源包 725 文件摘要、执行位、依赖锁及原生会话/分发保护保持。
- 自有 Skill 的四处源码链接按实际深度调整：入口由 ../../../upstreams 变为 ../../upstreams；references 由 ../../../../upstreams 变为 ../../../upstreams。分发侧仍是普通同级七包，不给安装后目标引入 skills/upstreams 依赖。
- README 目录树、AGENTS、接入/维护/验证文档中当前有效目录与说明一起调整。历史已封存 Spec、报告和证据的路径原文保留，通过当前记录说明新位置。新目录下上游仓库的指令文件仅归上游范围，不导入本仓规则。
- 使用 npm run build 更新制品，禁止手改生成文件。prepare 仍只读且不建副本；迁移过程中不联网、不执行上游代码、不更新来源版本。

## 所有权和验收

Implementer 只写上述生产路径、关联自有文档、必要子模块迁移元数据和构建制品；Tester 独占 tests，Planner 独占本 Root 流程记录。所有人保留他人工作，不改其他业务工程、全局安装或原历史 Root。

独立 Tester 在已批准 TestPlan3 的相同 Oracle 下适配路径常量，验证两 gitlink/HEAD/文件不变、根 upstreams 消失、新旧来源和分发导航正确、prepare 不写、可信 CI 识别新 gitlink、三目标 TeamAI 完整分发及回归。路径迁移不增加功能或替换原保护性断言；对新增父目录的安全边界执行适用验证。

必要命令为 prepare、build、npm test、check 和 Git diff 检查；全部结果绑定新隔离候选（真实父提交为上轮 c02f51cfe8c2e5cd1bd59b5b41228ebc1f6904fe）及主仓对应范围。继续只交付本地工作区，主仓 HEAD 保持 e094623ea9dd21b5d5ac69fcbaec093220cbb5e1，不声称正式 G5–G10、真实宿主加载或远端发布完成。旧 62+6 结果是历史，不能当新布局执行。

## 恢复

移动前已在仓外复制潜在修改文件、index 和两个子模块位置元数据并逐字核验；原有完整恢复资产保持。出现异常时先保全现场，仅恢复本次拥有的精确差异，不重置、清理或覆盖其他写者内容。正常交付不自动回退或提交。
