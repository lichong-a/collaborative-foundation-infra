<p align="center">
  <img src="docs/assets/readme/collaboration-workshop-v03.png" width="960" alt="三组独立资料通过共同索引册连接到分层档案架；维护者整理连接，审核者在旁观察，体现保留边界、共享规范和逐层可追溯的协作。">
</p>

<h1 align="center">collaborative-foundation-infra</h1>

<p align="center">
  <strong>让不同的人、Agent、模型与开发工具，围绕同一套工程规范协作。</strong><br>
  清晰的模块边界 · 渐进式文档导航 · 有据可查的交付
</p>

<p align="center">
  <a href="package.json"><img src="https://img.shields.io/badge/Node.js-24-4F7F9D?style=flat-square" alt="运行时：Node.js 24"></a>
  <a href="docs/integration.md"><img src="https://img.shields.io/badge/TeamAI-explicit_latest-171717?style=flat-square" alt="TeamAI：首次准备与显式升级解析 latest"></a>
  <a href="https://github.com/lichong-a/ric-dev-workflow-skills/blob/9ce34a0e9e6e06cbda2f6c4d76951248c7d27fcb/skills/ric-devflow/SKILL.md"><img src="https://img.shields.io/badge/Delivery-RIC_DevFlow-E84A3C?style=flat-square" alt="交付流程：RIC DevFlow"></a>
</p>

<p align="center">
  <a href="#quick-start">快速开始</a> ·
  <a href="skills/common/collaborative-foundation-infra/references/adoption.md">Agent 接入</a> ·
  <a href="#governance-tools">治理工具</a> ·
  <a href="#documentation">文档导航</a>
</p>

---

这是一个独立的**团队工程规范源仓库**。它通过 TeamAI 分发完整的 Skills 与规则，由每个主会话明确选择 RIC DevFlow 或基础工程规范，再用共同规范和轻量工具维护项目结构、文档链接与协作边界。安装资源本身不启用任何交付模式。

适用于新项目，也适用于中途接手的已有工程。接入从原仓库的实际结构和流程出发：先建立画像与导航，再逐步处理有依据的问题。

## 它解决什么问题

- **多人协作时，职责和修改范围难以对齐。** 明确模块所有者、允许路径、共享文件的串行修改规则，以及交付证据的归属。
- **资料越来越多，但新成员找不到入口。** 建立“项目入口 → 分类入口 → 专题 → 证据”的导航，让详细规范按当前任务渐进加载。
- **接手旧工程时，整理容易影响现有工作。** 先做只读诊断、流程映射和债务登记；确定性变更经过预览与基线复核后再应用。
- **不同工具上的规范版本容易漂移。** 任务前显式同步完整 Skill 包并记录来源，任务期间保持版本稳定。

<a id="how-it-works"></a>

## 职责分工

| 组成 | 负责的事情 | 关键边界 |
| --- | --- | --- |
| **TeamAI** | 团队资源订阅、解析与分发 | `engineering` 是资源订阅组；订阅不授予交付批准权 |
| **RIC DevFlow（会话选择后）** | Planner、Reviewer、Tester、Implementer 的职责、门禁与证据 | 完整保留入口和四角色共五份 Skills；交付状态沿用权威流程 |
| **工程规范 Skill** | 模块边界、代码约定、文档导航、项目画像与治理检查 | 复用原项目事实来源；自动整理只执行明确、可判定的动作 |
| **设计模式 Skill** | 按语言和真实变化点选择必要的抽象 | 决策进入既有 Spec / Decision，遵循原有交付流程 |

工程订阅一次分发 **11 份 Skills**：自有工程规范与 CLI 入口、DevFlow 入口及四角色、设计模式参考、三份 TeamAI 官方方法。两种模式均使用工程结构、代码、文档和验证规范；只有 devflow 模式才加载五份交付 Skill、准备四角色。固定来源和完整文件摘要见 [sources.lock.json](sources.lock.json)，集成细节见[职责边界说明](docs/integration.md)。

已有工程采用其他交付流程时，先建立映射并保留原状态。TeamAI 的资源安装、宿主发现与加载、原生角色真实调用，分别验证和记录。

<a id="quick-start"></a>

## 快速开始

### 让 Agent 接入已有工程

在目标工程中，将下面这句话发给 Agent：

> 根据 [https://github.com/lichong-a/collaborative-foundation-infra/blob/main/skills/common/collaborative-foundation-infra/references/adoption.md](https://github.com/lichong-a/collaborative-foundation-infra/blob/main/skills/common/collaborative-foundation-infra/references/adoption.md) 的接入流程，将 collaborative-foundation-infra 工程规范引入当前工程。

### 准备规范源

前置条件为 **Node.js 24** 和 npm。首次使用时，从公开仓库取得规范源：

```sh
git clone https://github.com/lichong-a/collaborative-foundation-infra.git
cd collaborative-foundation-infra
```

核对选定提交及来源锁后，在规范仓根目录执行以下命令。业务工程无需为治理工具增加 npm 依赖，接入与任务执行期间保持规范来源版本不变：

```sh
git submodule update --init --recursive --checkout
npm ci --ignore-scripts
npm run prepare:skills
npm run build
npm run check
npm run prepare:teamai # 首次显式准备实际 latest；已有安装离线重核
```

九份上游 Skill 直接位于三个固定提交的 `skills/upstreams/` 子模块中，初始化后即可读取；源码树不另建副本。`prepare:skills` 只离线核验来源，不写导出、回执或缓存，不 fetch、切换提交或执行上游代码。

缺少运行时时，先运行 `scripts/runtime --runtime node`。它会尝试在用户缓存中安装并核验，输出可用的 Node 路径；将该路径所在目录加入当前命令的 `PATH` 后再执行上述命令。安装失败后按[人工协议](skills/common/collaborative-foundation-infra/references/manual.md)继续，自动检查仍记为未完成。Python / uv 仅在辅助动作确有需要时准备，采用相同的“先尝试安装，再降级”规则。

### 预检并分发资源

先根据接入指引确认目标、允许路径和既有安装。以下示例使用 Codex；`--agent` 也支持 `zcode`、`claude`。

```sh
CFI_SOURCE="$(pwd -P)"
TARGET_REPO="/absolute/path/to/your-project"

# 默认只预检；请将 TARGET_REPO 替换为实际目标
node scripts/teamai-sync.mjs \
  --repo "$TARGET_REPO" \
  --source "$CFI_SOURCE" \
  --agent codex \
  --install-entry
```

在项目级接入已获授权且预检通过后，使用相同参数显式应用：

```sh
node scripts/teamai-sync.mjs \
  --repo "$TARGET_REPO" \
  --source "$CFI_SOURCE" \
  --agent codex \
  --install-entry \
  --apply
```

`--install-entry` 仅提出追加入口；没有 `--apply` 一律只预览。`--apply` 单独只分发资源，二者同时指定才在 Codex/ZCode 的 `AGENTS.md` 或 Claude 的 `CLAUDE.md` 追加短会话入口，保留既有正文。相同完整块为 `matched` 且不写入口，不代表加载或选择已完成。

适配器仅在私有临时团队目录组装十一包并转换自有包的受控导航，在隔离用户环境中调用已准备且核验的实际 TeamAI CLI；逐字核验转换后的期望结果后发布 Skills、适用规则和安装回执。它不会向源码树重建上游副本。同名定制内容、不同版本、未知文件和禁用配置会保留并报告冲突。**已有安装须先按[迁移指引](docs/onboarding.md#既有安装的迁移)核对**；当前预检不自动发现或迁移其他命名空间下的旧安装。

| Harness | 项目级 Skill 路径 |
| --- | --- |
| Codex | `.agents/skills/` |
| ZCode | `.agents/skills/` |
| Claude Code | `.claude/skills/` |

这些路径描述资源发布位置。宿主是否实际加载，以及 DevFlow 原生角色是否可调用，继续按[验证层级](docs/validation.md)核验。完整命令、回执和多 worktree 说明见[团队接入](docs/onboarding.md)。

### 每个主会话先选择模式

按[会话协议](skills/common/collaborative-foundation-infra/references/session.md)先查询根会话记录；缺少记录时依次提供“使用 RIC DevFlow（推荐）”和“使用基础工程规范”，等待明确选择。记录安全保存在用户状态目录，不写业务仓；同根恢复复用，新建或 fork 重新选择，子 Agent 继承。

```sh
node "$TARGET_REPO/.agents/skills/collaborative-foundation-infra/scripts/governance.mjs" \
  session status --repo "$TARGET_REPO" --agent codex --session-id "$ROOT_SESSION_ID"
# status 退出 3 才表示未选择；0 已选择；2 是必须处理的记录或环境错误
```

选择 basic 时仍完成用户已授权工作，但不自动加载 DevFlow 正文、准备四角色或写 `.devflow`。选择和切换的具体命令、身份、版本绑定及人工降级见会话协议。

<a id="governance-tools"></a>

## 治理工具

配套命令以目标仓库和项目策略为输入，支持文本与 JSON 报告。检查覆盖目录登记、路径规则、文档可达性、链接与锚点、元数据、重复标识及流程冲突。

| 动作 | 用途 | 是否写入目标 |
| --- | --- | --- |
| `audit` | 只读诊断，输出问题与已登记债务 | 否 |
| `check` | 执行相同检查，用于本地或 CI 门禁 | 否；新增违规退出 `1` |
| `plan` | 生成绑定基线、策略和文件摘要的整理预览 | 否；预览保存到目标仓之外 |
| `apply` | 复核基线、原字节与写入范围，应用已生成的计划 | 是；仅限计划中的确定性动作 |

```sh
# 在规范仓中检查目标；policy 应按目标工程的事实配置
scripts/governance audit \
  --repo /absolute/path/to/your-project \
  --policy /absolute/path/to/project-policy.json \
  --format json

# 检查规范仓自身
npm run audit:self
```

从[策略模板](skills/common/collaborative-foundation-infra/templates/policy.json)开始配置；完整参数、退出码、保护范围与恢复方式见[工具接口](skills/common/collaborative-foundation-infra/references/tools.md)。`audit` 退出 `0` 只表示扫描完成；输入、环境或安全拒绝退出 `2`。结构检查通过后，文档真实性和架构语义仍需独立审核。

自动整理覆盖三类动作：**补充明确的索引条目、登记待分类文档、按已确认映射修复链接**。文件移动、合并、语义分类和历史状态重写只形成建议。治理工具始终保护 `.devflow/`，保留既有指令正文、业务代码和原交付状态。

CI 使用可信目标基线中的检查器、锁文件和策略；候选对治理规则的修改需要单独审核。平台无关的入口和接入步骤见 [CI 维护指南](docs/maintenance.md#业务仓的-ci-接入)。

<a id="documentation"></a>

## 文档导航

| 你想做什么 | 从这里开始 |
| --- | --- |
| 选择、恢复或切换本会话模式 | [会话协议](skills/common/collaborative-foundation-infra/references/session.md) |
| 让 Agent 接手已有工程 | [通用接入委托与步骤](skills/common/collaborative-foundation-infra/references/adoption.md) |
| 建立模块边界与仓库画像 | [工程结构](skills/common/collaborative-foundation-infra/references/structure.md) |
| 按当前任务加载工程规范 | [工程 Skill 入口](skills/common/collaborative-foundation-infra/SKILL.md) |
| 整理文档入口、状态与引用 | [渐进式文档治理](skills/common/collaborative-foundation-infra/references/documents.md) |
| 准备、离线复用或显式升级 CLI | [隔离 CLI 运行时](docs/teamai-runtime.md) |
| 配置团队分发与处理既有安装 | [团队接入](docs/onboarding.md) |
| 理解 TeamAI / DevFlow 的配合方式 | [职责边界与版本来源](docs/integration.md) |
| 升级规范、接入 CI 或执行恢复 | [维护指南](docs/maintenance.md) |
| 判断一项能力实际验证到哪一层 | [验证层级与记录](docs/validation.md) |

## 仓库布局

```text
.
├── skills/
│   ├── common/          # 两份自有工程与 CLI 入口 Skill
│   └── upstreams/       # 三个固定提交的真实 Git 子模块
├── rules/               # 指向详细规范的短规则入口
├── manifest/            # TeamAI 订阅与本仓治理策略
├── hooks/               # 自动事件的显式禁用配置
├── tools/               # 治理与分发工具源码
├── scripts/             # 构建、接入、运行时和 CI 入口
├── tests/               # 独立行为测试
├── docs/                # 接入、维护、验证与配图
├── teamai.yaml          # 团队资源分发配置
└── sources.lock.json    # 导入包的固定版本与完整性记录
```

## 开发与贡献

先阅读 [AGENTS.md](AGENTS.md) 和[工程 Skill](skills/common/collaborative-foundation-infra/SKILL.md)，确认修改范围与验证方式。自有工具修改在 `tools/` 完成，通过构建更新分发产物；固定来源的 `skills/upstreams/` 保持原包，是唯一上游来源；十一包扁平结构仅由适配器在私有临时团队目录组装。自有包导航及官方指南的相对目标在分发时确定性转换，源码引用直接指向子模块。版本与映射升级独立审查。

```sh
npm run prepare:skills # 只读检查子模块、index gitlink、锁与完整九包
npm run build    # 生成随 Skill 分发的治理工具与依赖许可记录
npm run check    # 核验来源、构建一致性、语法与文档治理
npm test         # 运行行为测试；测试维护遵循独立测试者职责
```

变更应同步更新相关规范、入口与示例。测试描述、文件安装、宿主加载和外部验收分别报告，实际执行结果及适用范围写入原有证据体系。

## 分发与许可

当前以**规范源仓库 + TeamAI + Skill 内置工具**分发，尚未提供独立的 npm CLI 包。根 `package.json` 使用 `private: true`，也未声明 `bin` 命令入口；日常接入使用上面的仓内脚本和随 Skill 分发的 `governance.mjs`。如果将来需要脱离规范源、通过 `npx` 单独运行检查，可另行设计精简的治理工具包。

本仓尚未声明覆盖自有内容的根级开源许可证。导入包按固定来源保留原始内容，其中已有的许可声明一并保留；构建依赖的许可见 [THIRD_PARTY_NOTICES](skills/common/collaborative-foundation-infra/THIRD_PARTY_NOTICES.txt)。

## 致谢

- [Tencent / TeamAI](https://github.com/Tencent/teamai-cli)：团队资源管理与分发。
- [RIC DevFlow](https://github.com/lichong-a/ric-dev-workflow-skills/tree/9ce34a0e9e6e06cbda2f6c4d76951248c7d27fcb)：交付角色、流程与证据协议。
- [RIC Design Patterns](https://github.com/lichong-a/ric-design-patterns-skill/blob/46b183615afbfe3b1fffcbc9425ac3aea2c36d99/SKILL.md)：按语言组织的设计模式参考。
- [RIC Visual](https://github.com/lichong-a/ric-visual)：首图的编辑漫画视觉规范；图片通过 Codex 内置图片生成能力制作。

<details>
<summary>首图的可编辑 brief 与制作记录</summary>

首图用“独立资料 → 共同索引 → 分层档案”表现协作与渐进式导航，必需文字全部保留在正文。可从 [visual brief](docs/assets/readme/collaboration-workshop-v01.brief.json) 和[制作记录](docs/assets/readme/collaboration-workshop-v03.production.json)复用构图、色板与生成提示词。

</details>
