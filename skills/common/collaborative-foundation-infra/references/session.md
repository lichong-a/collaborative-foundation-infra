---
id: collaborative-foundation-infra-session
status: current
---
# 会话选择与恢复

[返回工程入口](../SKILL.md) · [交付与职责](delivery.md) · [结构约定](structure.md) · [工具接口](tools.md)

开始工程工作前必须确认本主会话的模式。完整十一份 Skill 安装只是资源可用，不表示启用 DevFlow；推荐项、超时、历史任务和别的会话记录都不表示用户同意。未选择前只做定位目标、实际宿主、根会话身份、已有记录所需的只读检查，不进入开发、准备四角色或修改任务状态。

## 识别根会话

使用宿主提供的真实稳定根会话 ID；同一主对话恢复继续使用它。新建主会话或 fork 必须使用新的根 ID，禁止查询“最近选择”来推断模式。宿主不能提供稳定 ID 时，由 Agent 为该主会话建立明确 ID，并在恢复与子调用交接中持续携带；身份无法证实就建立新根身份重新选择，不能借用已知旧 ID 跳过选择。

每次调用显式传 `--repo`、`--agent codex|zcode|claude`、`--session-id`。ID 仅允许字母、数字及 `._:-`，以字母或数字开头，长度不超过 256；不接受路径。身份由共享 Git common-dir 的摘要（非 Git 用真实根路径）＋实际宿主＋根 ID 摘要构成。同一 Git worktree 家族可恢复同一根选择；不同根、宿主或仓库保持独立。

子 Agent 带自己的 `--session-id` 和父根的 `--root-session-id`，只查询并继承。带根参数的 select/switch 一律拒绝；子 Agent 不再次提问，不切换模式，不另建平行选择。这些参数是协作协议，不能阻止任意 shell 调用或伪造身份，不是系统权限沙箱。

## 先查询，再按用户选择记录

以下 `TOOL` 指向当前已核验包的 `scripts/governance.mjs`；使用实际路径，勿把占位符原样执行。

```sh
node "$TOOL" session status --repo "$TARGET_REPO" --agent codex --session-id "$ROOT_SESSION_ID"
```

status 严格只读，不创建目录。退出 0 表示已有有效选择，恢复该模式而不重复询问；退出 3 表示等待选择。此时按如下顺序提供两项：

1. **使用 RIC DevFlow（推荐）**：按原协议分类任务、准备宿主、复用四角色和门禁。
2. **使用基础工程规范**：按用户授权完成工作，遵循结构、文档与验证规则，不自动启动 DevFlow。

用户首条消息已经明确选择时直接记录，不再询问。否则等待明确回答；沉默或等待时长不会变成批准。选择 basic 的示例：

```sh
node "$TOOL" session select --repo "$TARGET_REPO" --agent codex --session-id "$ROOT_SESSION_ID" --mode basic
```

命令成功并读回选择后才继续。首次 select 排他创建；同一模式及规范版本的 select 幂等，不改写历史；不同模式或规范版本不能用 select 覆盖，必须显式 switch。JSON 损坏、身份/版本不匹配、权限或记录错误退出 2，不能当成等待选择或默认 DevFlow。

## 两种模式共享工程规范

**devflow**：读取 [ric-devflow](../../../upstreams/ric-devflow/skills/ric-devflow/SKILL.md)，按其原有准备、任务分类、轻量豁免、角色复用及交付规则执行。完整资源分发不免除原生加载与真实调用核验。

**basic**：不自动加载五份 DevFlow Skill 正文，不准备或调用四个 DevFlow 原生角色，不写 `.devflow`，也不建立替代任务状态机。可以继续用户已授权的既有工作；原约束、Spec 或历史证据只读引用，不能据此推进原 DevFlow 状态或宣称取得门禁批准。基本工程任务使用目标项目已有验证方法与证据位置。

两模式均遵循[模块与目录职责](structure.md)、[代码规则](code.md)、[文档导航](documents.md)及[验证证据](evidence.md)。会话模式不改项目 `policy.workflow` 的权威映射；用户明确会话选择优先于自有旧路由，但不覆盖宿主权限或用户保护范围，不改上游包原文。

## 显式切换与持久化

切换前停止本会话旧模式的活动执行者，保留他们及其他人的工作，不清理他人目录或未提交内容。之后运行：

```sh
node "$TOOL" session switch --repo "$TARGET_REPO" --agent codex --session-id "$ROOT_SESSION_ID" --mode devflow
```

不存在选择不能 switch。切回 DevFlow 时核对真实候选、原状态、Spec、测试计划和已有证据；switch 不授予任何交付批准。规范版本改变时 status 报错，停止旧执行者、核对差异后可以显式 switch 重新绑定版本，完整旧历史保留。同模式且同版本的 switch 不产生重复事件。

记录只存摘要身份、模式、时间、工具构建所绑定的规范版本和完整切换历史，不存原始对话、提示词或任务状态。状态根为绝对 `XDG_STATE_HOME`，未设置时为用户 `~/.local/state`，其下使用 `collaborative-foundation-infra/sessions/`。相对 XDG 路径拒绝；自有目录 0700、记录 0600，不通过扩大权限修复失败，不写业务依赖、系统或 shell 配置。

写操作使用每个根记录的独占锁和原子文件发布。源记录损坏、软链、硬链、未知类型或私有权限不满足时原样保留并报错。中断或原子发布后的同步不确定会保留私有锁，status 保守拒绝；只在核对对应写者已经停止、完整旧/新记录和预期历史后，按明确授权恢复并移除该锁，不自动抢锁。历史达到有界文件大小时拒绝追加并保留原记录，不截断历史。

持久化失败不能声称选择已保存。运行环境安装失败后，宿主如仍能安全持久化，可按[人工协议](manual.md)保存相同身份与模式含义的可核验交接记录；无法安全持久化才暂停开发。人工描述或口头记忆不等于持久化，工具恢复后必须核对并完整接管历史。
