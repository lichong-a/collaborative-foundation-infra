---
id: collaborative-foundation-infra-onboarding
status: current
---
# 团队接入

[项目入口](../README.md) · [集成边界](integration.md) · [工程规范](../skills/common/collaborative-foundation-infra/SKILL.md)

让 Agent 完成已有工程的画像、规范接入与文档导航，可使用[通用接入委托](../skills/common/collaborative-foundation-infra/references/adoption.md)。指引随 Skill 分发，区分只读诊断与范围内接入，保留原业务结构、未提交内容和既有流程；本页说明资源分发的实际命令。

维护者先取得并核验固定版本的本地 checkout；适配器的 --source 只接受本地目录，不 fetch 远端。它的隔离 self 模式真实 pull 证明资源解析、过滤和生成，不证明 Git 订阅传输。

维护者从[公开规范仓](https://github.com/lichong-a/collaborative-foundation-infra)取得本地 checkout，核对选定提交、固定来源、依赖锁和独立审核记录，任务期间保持该来源不变。安装仅作用于该规范仓，业务项目不增加 npm 依赖。

首次获取规范源：

```sh
git clone https://github.com/lichong-a/collaborative-foundation-infra.git
cd collaborative-foundation-infra
```

在已核验的规范仓根目录准备依赖并运行分发：

```sh
git submodule update --init --recursive --checkout
npm ci --ignore-scripts
npm run prepare:skills
npm run build
npm run prepare:teamai
node scripts/teamai-sync.mjs --repo /path/to/business --source /path/to/collaborative-foundation-infra --agent codex --install-entry
node scripts/teamai-sync.mjs --repo /path/to/business --source /path/to/collaborative-foundation-infra --agent codex --install-entry --apply
```

没有 --apply 时只预检，包含 --install-entry 也不写目标。--apply 单独仍只分发；--apply --install-entry 才追加项目入口。所有资源、入口和既有回执必须整体预检通过，才开始发布。显式 apply 后运行已准备并核验身份的实际 TeamAI CLI 在临时用户环境中的真实 pull，TeamAI 自己解析团队资源、engineering 订阅和生成目标。适配器只核验结果、冲突和限定发布；不会用复制源文件冒充 TeamAI 分发。Codex/ZCode 发布到项目 `.agents/skills`，Claude 到 `.claude/skills`。ZCode 实际宿主是否发现该入口仍需加载验证。

上游目录初始化后可显式 prepare 核验；prepare 是只读检查，构建、检查和同步每次重新验证实际来源，不依赖持久副本或旧准备回执。十份 Skills 必须完整安装。安装五份 DevFlow Skill 不表示用户选择了 devflow，basic 也不要求原生四角色已经可用。已有同名包必须与本次完整分发期望逐字一致；其中八上游包与子模块原字节一致，自有两包只允许受控导航和官方指南相对目标重定位。定制、版本差异、未知文件、软链或明确禁用一律保留并报错，不能先覆盖再提示。首次接入不更新既有全局 Skill，不反转禁用配置。冲突需独立 review 并人工制定迁移，不提供 force 覆盖。

源码自有包引用真实 skills/upstreams；临时组装只转换已登记的自有包导航和指南相对目标，不改正文、代码示例、外部 URL 或八上游包。默认预检在内存计算期望清单，不创建源码副本；实际 TeamAI pull 仅使用本次私有临时树。未知/缺失映射在目标发布前拒绝。

Skill 同源身份包含文件类型、完整字节和 Git 可恢复的执行位。普通文件按 owner-executable 归一为 0644 或 0755；不同用户 umask 造成的读写权限差异不表示版本不同。已有匹配目标保留实际权限，新创建文件使用上述规范权限。sources.lock 的原始 mode 保留为来源归档记录，核验时使用相同归一规则；字节、执行位变化和未知文件仍会拒绝。

同步默认仅发布 Skills 和团队规则；显式 --install-entry 可局部追加会话入口。不发布 TeamAI 原生 agents、settings、MCP、hooks 或 shell profile。仅会话选择 devflow 后，原生 DevFlow 配置由 ric-devflow 准备协议按原授权和同源检查管理；文件安装、宿主加载、真实调用分别验证。

不要直接在业务仓运行 TeamAI init/pull 来绕过预检：原生命令可能注册成员、产生远端写入或触及用户级 hooks。这里在隔离成员环境调用真实 pull，未触发远端发布，也不声称真实 home 的 hooks 已被修改或禁用。未来允许常规 TeamAI 接入时必须先检查该环境原有 hooks 和远端行为。

任务开始前显式同步并记录安装回执中的 sourceDigest；任务期间不再运行同步。回执在项目 `.collaborative-foundation-infra/teamai-installation.json`，不存任务状态。无原生自动事件被发布，因此规范不会在会话中后台变化。

schemaVersion 4 安装回执声明 sourceLayoutVersion:4；sourcePackagesDigest 绑定八份真实上游包与官方指南/许可，distributionDigest 绑定十份包的转换后完整清单及团队资源，sourceDigest 同时绑定实际源资源、确定性转换结果与 sources.lock、package-lock、.gitmodules。upstreams 明列三个固定 SHA，artifact 绑定实际工具；teamaiPackage 记录实际 CLI 版本、tarball、integrity 和可验证安装摘要。本机 Git 元数据、临时路径及用户会话状态不进入这些摘要。它不是远端 Git SHA。备份和治理 plan 使用的本地完整权限快照保持原义，不采用分发身份的权限归一。

Codex/ZCode 使用相同的 AGENTS.md 区块，Claude 单独使用 CLAUDE.md；正文按原字节保留。追加已有入口要求受跟踪且干净；未跟踪同名、不同/重复/残缺区块拒绝。已有完整相同块返回 matched 且不写入口，因此可保留块外未提交内容。matched 只表示该块字节相同。每次同步都会只读核验回执中所有已登记入口，包括本次未请求的另一个入口；已删除、移除或修改的区块使同步保守拒绝，不传播历史 matched，也不会为补证据恢复正文。不带 --install-entry 继续保持入口零写入。新块完整写入同目录私有临时文件并同步后，重查原 inode/字节再原子发布；失败保留现场，不就地截断正文。

回执分别记录 resourceFiles、projectEntries、hostLoading；实际宿主加载默认 not-verified。入口是模型可见协议，不是权限沙箱。首次进入目标工程，先按[会话协议](../skills/common/collaborative-foundation-infra/references/session.md)查询并记录明确模式；源码 checkout 使用 AGENTS 中的源码相对路由，已安装项目使用对应 .agents/.claude 路由。

CLI 首次准备、显式升级、离线复用、--data-home 与 --teamai-entry 的使用见[运行时指引](teamai-runtime.md)。普通分发不联网安装，缺少可验证 CLI 会给出准备命令；裸 node_modules 不再是可接受的显式入口。

多 worktree 分别预检和发布项目文件；共享用户级原生角色仍受 DevFlow 的串行升级约束。没有远端网络且依赖与来源已备齐时本地分发可以离线执行。

接入预检保留已验证的 TeamAI 项目分区两种命名检查（以共享主 worktree anchor 计算），保留 disabledAgents、enabledAgents 白名单和 excludedSkills；不调用可能自举或迁移写入的 TeamAI 配置检测。已有目标 harness 的 TeamAI 自动 hooks 会阻断接入，需要先人工明确唯一所有权；适配器不会静默改写真实 hooks。

业务 CI 的可执行接入步骤见 [维护指南](maintenance.md#业务仓的-ci-接入)。回执的 artifact 摘要绑定本次实际 TeamAI 生成的工具字节，来源/依赖摘要来自规范仓，不侵入业务依赖。

## 既有安装的迁移

当前 schemaVersion 4 与十包及实际 CLI 身份建立新的安装基线；schema2/3 回执不能直接复用；旧回执或来源版本不同一律保留并拒绝原地更新。规范源、自有 Skill 和 npm 包名均为 `collaborative-foundation-infra`；自有规则为 `collaborative-foundation-infra.md`，安装回执在 `.collaborative-foundation-infra/`。工具不提供旧命名别名，也不扫描、移动或删除以前命名空间下的安装；预检成功仅覆盖当前目标路径，不能据此判定旧安装与新安装可以并行生效。

检测到项目已经接入团队规范时，先读取其实际入口、安装回执、活动任务绑定的来源版本、规则与 CI 基线，确认有效事实源。若安装布局或版本不同，普通首次接入在这个步骤停下；输出逐项迁移清单与冲突，继续可确定的只读诊断。不能直接加装新包造成双重入口，也不能把删除旧目录作为解决冲突的默认办法。

迁移清单至少列出旧安装的实际路径、所有者与原字节摘要、拟新增或调整的路径、保留的定制内容、导航及 CI 调用更新、环境变量与缓存约定、验证和逐文件恢复方法。清单在目标项目的获准证据位置维护，不将业务资料复制回规范源仓。

在已有授权覆盖这些具体变化、活动任务已结束或进入明确停写窗口后，先于隔离副本演练新版本分发、完整 Skill 校验、导航和可信 CI。通过后再按批准清单逐项处理目标工程；需要移除既有入口或包时须有针对那些路径的明确授权。当前适配器仍只允许排他创建缺项，拒绝不同版本、定制或禁用目标，不提供原地升级操作。

迁移完成后分别核验新路径、源摘要、安装回执、宿主加载与原生调用，重新绑定后续任务使用的版本。保留原事实源、未提交内容和恢复证据；失败时只恢复能够证明属于本次动作且未被他人改动的文件，不全仓回滚，不在任务中途热更新共享原生角色。
