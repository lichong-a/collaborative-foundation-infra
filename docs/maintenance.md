---
id: collaborative-foundation-infra-maintenance
status: current
---
# 维护、CI 与恢复

[项目入口](../README.md) · [工具接口](../skills/common/collaborative-foundation-infra/references/tools.md) · [验证记录](validation.md)

普通 clone 后执行 `git submodule update --init --recursive --checkout`，再运行 `npm run prepare:skills` 只读检查。初始化是操作者的显式联网动作；prepare 只用本地固定提交，不写缓存、导出或回执。运行时 CLI 与固定来源分别升级，CLI 操作见[隔离运行时](teamai-runtime.md)。只有首次准备或显式升级查询 latest，已有 CLI 对新规范离线重核，不将旧兼容记录冒充新结果。修改自有规范后运行 `npm run build` 和 `npm run check`（包含构建产物与许可证一致性核验），再由独立测试者执行 `npm test`。导入包只能整体来自固定可信版本；来源升级先比较闭包、角色权限、平台配置、许可证和文档，再更新来源锁与测试，禁止手改原包凑兼容。

CI 的可信启动器必须来自目标基线 checkout，由平台从可信分支配置调用，不能执行候选 `scripts/ci-check.mjs`。示例：

```sh
node /trusted-checkout/scripts/ci-check.mjs --repo /candidate/repo --base FULL_TARGET_COMMIT_SHA --policy manifest/governance.json
```

入口从指定完整基线 SHA 抽取已构建检查器、policy、sources.lock、package-lock，在独立临时目录执行；候选修改 .gitmodules、skills/upstreams gitlink、工具、规则、Skills、策略和锁文件会单独报 `requiresGovernanceReview` 并失败。分支保护与审核放行需仓库平台实际配置，本地脚本不声称已经部署。不能用 PR 给出的 base SHA 替代 CI 自己解析的可信目标 SHA。

apply 使用保守串行协议与恢复日志，详见工具接口。目录改名和非协作并发写者不属于跨文件事务保证。已有目标脏、计划过期、路径越界、保护目录或符号链接拒绝写入。

同步发生部分发布失败时报告已创建的目标并保留现场；不会删除可能含并发内容的目录。先对照源锁与现场备份核验完整性，由操作者确认本次创建的残余文件后逐项恢复，再重新预检。禁止直接 force 覆盖定制内容。同源回执可追加已核验的另一宿主或项目入口；重复执行不重写相同回执。不同来源、旧 schema 或定制回执需要独立升级流程。入口的同目录 .cfi-entry-* 临时文件只保存本次完整候选；写入失败不会就地截断已有正文，检查归属和原字节后按授权处理残留。

Node 24 Linux x64/arm64 使用官方 v24.20.0 固定下载摘要。脚本只向明确用户缓存安装，不写系统或 profile；下载、摘要或权限失败后退出 2 并给出人工协议。`scripts/runtime --runtime python` 或 `uv` 仅用于明确需要的辅助动作，uv 固定 0.12.9，托管 Python 固定 3.12.14；普通治理无需安装 Python。默认缓存位于 `${XDG_CACHE_HOME:-$HOME/.cache}/collaborative-foundation-infra/runtimes`，需要离线运行时设置 `COLLABORATIVE_FOUNDATION_INFRA_RUNTIME_OFFLINE=1`；缺少可用缓存仍失败并进入人工协议，不把离线视为检查通过。

## 直接上游、升级与历史布局迁移

schemaVersion 4 的来源锁、.gitmodules、index gitlink 和三个子模块 HEAD 共同绑定唯一上游来源。packages.path 指向 skills/upstreams 下真实目录；RIC725文件、官方21文件及指南/许可的字节及执行位仍逐项核验。build/check/sync不依赖历史导出状态，不 fetch、不 checkout、不自动修复。skills/common 仅保留自有规范。

prepare:skills 现在严格只读，成功返回 verified，重复或并发执行不产生导出、准备锁或归属回执。缺少已初始化来源时给出明确初始化命令；已有副本、定制/未知同级目录、旧导出回执或 pending/lock 残留均保持原样并报告，不消费其内容证明来源有效，也不自动清理。

从旧布局迁移时先完整备份并恢复验证，再逐一核对获准的六份旧目录、文件集合、字节、执行位和准备状态，在串行窗口原子移到新的仓外归档位置；归档目标存在或内容不匹配则保留现场拒绝。此为专门授权的维护动作，不是任何普通命令的副作用。原 index 的取消跟踪和真实子模块登记保持；用户或邻近目录不能被顺带删除。

版本升级仍先独立审查上游提交、五 Skill 闭包、配置权限、引用和许可证，再按批准范围显式调整子模块提交、gitlink 与 schema4 来源清单。prepare/build/check 每次读取新真实来源，不通过重建源码副本完成升级；主仓是否提交仍由当次授权决定。

TeamAI适配器只在各次调用独占的私有临时目录组装十一包。九上游包原字节不变，自有包导航转换为安装侧同级包，官方指南相对目标绑定固定提交；精确坏锚映射见[集成边界](integration.md)。源码锁、复制前后来源、转换后完整清单和真实 TeamAI 输出均需一致；未知链接映射或来源变化拒绝发布。临时失败清理只涉及本调用创建的目录，不清理成员安装或其他调用。安装回执schema4绑定来源与分发摘要；旧安装回执按迁移流程保留拒绝，不擅自升级。

源码侧和安装侧导航分别检查，不能为了让源码链接通过先创建六份副本。候选对转换表、准备/分发工具、来源锁和gitlink的变化仍需独立治理审核。

## 仓外备份与隔离恢复

备份位置由当前任务授权指定，放在工作区之外并限制访问。归档完整树而非仅依赖 Git：清单记录每条路径、类型、完整权限模式、普通文件摘要和符号链接目标，涵盖隐藏、忽略和未提交内容。先实际恢复并逐项比对，再执行需要保全的变更。

当前维护的归档身份与实际恢复记录见[证据索引](../.devflow/changes/REQ-20260917-002/evidence.md)。这个记录只证明其中声明的归档和观察窗口，其他项目应生成自己的清单与回执，不复制本次机器位置、文件数量或历史摘要作为验收。

恢复演练按以下顺序进行；演练目标必须是仓库外新建的空目录：

1. 根据已登记的归档身份找到归档、清单和回执，核对实际归档摘要。先列出条目并检查与清单一致；绝对路径、越界路径或未登记对象出现时停止。
2. 在仓库外创建仅当前用户可访问的新目录，将已核验归档解包到其中，保留文件模式和链接类型，不复制原所有者身份，不覆盖已有路径。不在活动工作区、真实用户 home 或其他工程解包，也不执行恢复目录中的脚本或 Git hooks。
3. 逐项比较恢复树与清单的路径集合、类型、完整 mode、符号链接目标和文件 SHA256；包括 `.git`、隐藏、忽略和未提交内容。所有差异均须解释，不能用 Git mode 归一掩盖恢复权限差异。
4. 验证成功后保留恢复清单与结果。替换活动工作区时另行安排停写窗口、先备份当前状态，并取得覆盖现有文件的明确授权；本指南的隔离恢复步骤不授权清空或覆盖任何工程。

如用 Git bundle 保存受审候选，应另外记录真实 SHA、bundle 摘要、实际恢复和对象比较结果。候选 bundle 与完整工作区归档作用不同：Git 不能代替完整 POSIX mode、忽略文件及未提交内容的保全。历史报告与附件按原字节留在外部归档，不通过替换名称改写其证据身份。

Git 提交、远端创建和推送仍需明确授权；本地备份与恢复不扩大这些权限。

## 业务仓的 CI 接入

业务仓先按[接入指南](onboarding.md)显式分发，再把已分发包、`.collaborative-foundation-infra/teamai-installation.json` 回执和审核后的项目 policy 纳入自己的可信 Git 基线。是否提交由项目授权决定；接入工具不会替业务仓执行提交。

```sh
node /trusted-checkout/scripts/ci-check.mjs --repo /candidate/business --base FULL_TRUSTED_BUSINESS_SHA --policy governance-policy.json --layout codex
```

`--layout team` 为默认规范仓模式。codex/zcode 从业务基线 `.agents/skills/collaborative-foundation-infra/scripts/governance.mjs` 取工具，claude 从 `.claude/skills/collaborative-foundation-infra/scripts/governance.mjs` 取工具。业务模式验证同一基线回执的 `artifact.sha256` 及来源锁/依赖锁摘要；不读取、不修改业务根 package-lock。所有 `.agents`、`.claude`、`.collaborative-foundation-infra` 以及项目 policy 的候选变化均需单独治理审核，不能自改放宽。

回执只绑定工具版本与分发证据，不表示宿主已加载或业务验收完成。既有回执缺少 artifact 摘要或安装布局不同，CI 保守拒绝；按[既有安装的迁移](onboarding.md#既有安装的迁移)独立审查，不手写摘要绕过来源核验，也不把旧基线当成当前布局已验证。

分发产物的 [THIRD_PARTY_NOTICES](../skills/common/collaborative-foundation-infra/THIRD_PARTY_NOTICES.txt) 由 esbuild 实际输入图生成，随包保留每个实际打包依赖的完整 LICENSE/NOTICE。直接上游九包仍保留原字节，不将整个 node_modules 分发。
