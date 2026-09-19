---
id: collaborative-foundation-infra-tools
status: current
---
# 治理工具接口

[返回入口](../SKILL.md)

运行 Node 24 与随包脚本，不需要业务仓安装 npm 依赖：

```sh
node /path/to/collaborative-foundation-infra/scripts/governance.mjs audit --repo /path/to/repo --policy /path/to/policy.json --format json
node /path/to/collaborative-foundation-infra/scripts/governance.mjs check --repo /path/to/repo --policy /path/to/policy.json --format json
node /path/to/collaborative-foundation-infra/scripts/governance.mjs plan --repo /path/to/repo --policy /path/to/policy.json > /outside/repo/plan.json
node /path/to/collaborative-foundation-infra/scripts/governance.mjs apply --repo /path/to/repo --policy /path/to/policy.json --plan /outside/repo/plan.json --format json
```

上述 audit/check/plan/apply 的 `--repo` 和 `--policy` 必填；`--format` 是 text 或 json；apply 额外需要 `--plan`。audit 的退出 0 表示扫描完成，报告 status 仍可能 fail；check 的 pass/debt 退出 0，新增违规退出 1；输入、环境、安全拒绝退出 2。plan 输出 JSON 到 stdout，重定向必须在目标仓之外。

策略 schemaVersion=1。documentRoots 定义 Markdown 分区，entrypoints 定义根入口，metadataRoots 定义必须 id/status 的文档范围，exclude 仅排除明确文档前缀。allowedTopLevel 登记根级责任；pathRules 为 `{prefix,allowedExtensions}`。debt 是精确 finding fingerprint 列表，不能用模式忽略新增问题。workflow 包含 authority=devflow|existing|none 和 references 路径，只诊断、不读写状态。

indexEntries 为 `{index,target,label}`，linkRepairs 为 `{source,oldTarget,newTarget}`，pendingFile 指定待分类登记位置。protectedPaths 可增加保护，不能解除 `.git`、`.devflow`、依赖和 worktree 目录保护。自动 apply 拒绝指令文件 AGENTS/CLAUDE 的改写。路径使用仓内规范相对路径；链接可包含 URL 编码中文/空格、跨树和锚点。

检查支持 CommonMark、表格、删除线、引用链接、图片、HTML 链接和 GitHub 风格标题锚点；HTML 注释中的伪链接忽略；代码内容不当作 Markdown 链接。外部 URL 不联网检查。语义归属、文档真实性和未声明的模块依赖需要独立 review。

计划绑定实路径、Git HEAD（无提交为 null）、完整受支持树摘要、策略摘要和操作内容。快照跳过 `.git`、node_modules、.venv、缓存和嵌套 worktree；这些区域不允许自动写入。每个文本文件限制 4 MiB，快照单文件限制 128 MiB，超限以环境错误报告。

apply 要求 Git 工作树，拒绝链接计数不为 1 的已有硬链接目标，避免修改仓库外同 inode 内容；已有目标必须受跟踪且无暂存/未暂存/未跟踪更改。计划后任一快照文件变化都会拒绝；完整已应用计划重复执行返回 noop，部分应用不会冒充完成。不会移动、合并、自动标 current 或猜文档归属。修链还必须保持非链接的 Markdown 文本、代码、HTML 和节点结构不变；含歧义正文或不支持语法时整项拒绝，转人工逐项处理。

失败恢复日志位于返回的系统临时目录 `collaborative-foundation-infra-transaction-*`，私有权限；plan.json 保存原字节、目标字节和摘要，progress.json 记录 attempted/changed/recovered/conflicts。只对本进程成功打开并通过所有权复核、且当前仍为预期字节的文件自动恢复；独占创建失败时绝不删除其他写者的文件；检测到其他写者或部分未知字节时保留冲突并退出 2，人工对照原字节恢复后重新生成计划。重要失败日志由操作者复制到其授权的长期证据位置。

使用串行写入窗口与仓级协作锁。每次写前后复核路径和字节，拒绝已经发现的父/末级软链。Node 路径 API 无法为敌对非协作写者提供完整多文件事务或消除所有系统级 TOCTOU；不要同时运行其他目录改名/写入进程。发生进程中断或残留锁时检查日志和 PID，由操作者确认写者已退出后仅移除该锁，不自动抢锁。

## 会话选择接口

同一脚本增加 session 子命令，不需要 policy，固定输出 JSON。所有动作必须提供 --repo、--agent codex|zcode|claude、--session-id；select/switch 还需 --mode devflow|basic。status 禁止 --mode，未知、重复或缺值参数拒绝。子调用额外提供 --root-session-id，只可 status，不可 select/switch。

```sh
node "$TOOL" session status --repo "$TARGET_REPO" --agent codex --session-id "$ROOT_SESSION_ID"
node "$TOOL" session select --repo "$TARGET_REPO" --agent codex --session-id "$ROOT_SESSION_ID" --mode basic
node "$TOOL" session switch --repo "$TARGET_REPO" --agent codex --session-id "$ROOT_SESSION_ID" --mode devflow
```

status 不创建目录；有效已选择退出 0，awaiting-selection 退出 3，环境/记录错误退出 2。select/switch 成功退出 0，错误退出 2；只有明确用户选择或切换才能调用写操作。JSON 的 persisted 表示选择记录已持久化，hostLoading 仍为 not-verified。身份、私有状态、历史、版本与切换规则见[会话协议](session.md)。这不是任务状态机，也不会修改 workflow 策略或 .devflow。
