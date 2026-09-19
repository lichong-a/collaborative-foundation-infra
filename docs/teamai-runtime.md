---
id: collaborative-foundation-infra-teamai-runtime
status: current
---
# 隔离 TeamAI CLI 运行时

[项目入口](../README.md) · [团队接入](onboarding.md) · [官方方法边界](../skills/common/teamai-cli/SKILL.md)

固定子模块决定八份上游 Skill、中文指南和许可证的来源；CLI 的 npm 版本是另一条版本线。运行时升级不改来源锁或 gitlink。官方指南绑定子模块提交，与已安装 CLI 版本不必相同；使用具体命令或参数前核对实际 CLI 的 `--help`，指南中的新适配能力不能充当本次宿主加载或调用的验证。开发依赖中的 0.24.0 仅用于可复现测试，生产不会因 npm ci 安装了它就跳过下面的准备过程，也不承诺任意未来 latest 兼容。

## 首次准备、复用和升级

```sh
npm run prepare:teamai
npm run prepare:teamai -- --offline
# 只有用户明确要升级时调用：
npm run upgrade:teamai
```

`--source PATH` 默认当前规范仓；`--data-home ABS` 指定用户数据根，默认绝对 XDG_DATA_HOME 或 `~/.local/share`。实际 namespace 是该根下的 `collaborative-foundation-infra/teamai/`，与会话选择的 state namespace 分离。相对路径、软链、损坏或不明内容、非私有 namespace 会拒绝，不通过改权限或删除旧目录恢复。

首次准备只解析一次 `teamai-cli@latest`，固定该次实际版本、tarball、SHA512 integrity；隔离下载并核验归档，禁止 npm 生命周期脚本、audit、fund 和 bin links。HOME、npm user/global 配置与缓存均在本次私有准备目录，不写真实用户配置、缓存、全局安装或业务依赖。

安装包名称、bin 归属、归档与安装字节、实际版本及两份内置 Skill 必须一致；额外或变化的内置 Skill 会拒绝。随后对 Codex、ZCode、Claude 运行真实隔离 pull，逐一核对十包和规则。全部成功才原子切换 current 回执。失败保留原 CLI 和回执并报错，不自动降级后报升级成功。

已有完整安装的 prepare 不查询 registry、不重装。自有规范变化后使用原 CLI 离线重新验证当前来源的兼容性，旧安装回执保留原验证身份；新执行结果单独返回。明确 upgrade 才再次查询 latest，并使用独立候选。`--offline` 在没有可验证安装或请求升级时拒绝联网。未知锁和他人候选不自动清理。

## 分发和显式入口

```sh
npm run prepare:teamai -- --data-home /absolute/private/data
node scripts/teamai-sync.mjs --repo /absolute/project --source /absolute/source \
  --agent codex --data-home /absolute/private/data
```

prepare 的 JSON 输出包含实际 `entry`、`package`、`installationId` 和兼容结果。需要显式选择该安装时，将输出中的 entry 原样用于同一数据根下的 `--teamai-entry`，例如：

```sh
node scripts/teamai-sync.mjs --repo /absolute/project --source /absolute/source \
  --agent codex --data-home /absolute/private/data --teamai-entry /absolute/prepared/entry
```

最后一个路径是占位符，必须替换为 prepare 的真实输出。显式参数只选择已准备安装，不能绕过来源证明。裸 `node_modules/teamai-cli/dist/index.js`、复制出的脚本、只输出版本号的伪入口及没有完整回执的目录均拒绝。这是对旧显式入口的兼容收紧；先完成隔离准备再调整调用方，不给旧入口自动补造回执。

预览只验证可用身份和目标冲突，不执行 pull 或写目标；缺少 CLI 提示准备命令。`prepare:skills`、治理 check 与可信 CI 不安装 CLI、不解析 latest。实际 apply 才验证该次隔离输出，保持原有 `--apply` / `--install-entry` 授权语义。官方知识方法仍按需执行，不因安装而自动调用。

## 回执与证据

运行时安装 receipt schema1 记录 package、相对 entry、完整安装文件清单与摘要、package-lock、内置包摘要、三宿主兼容证据及 installationId。current 仅引用 installationId 和 receiptSha256；不能拿旧兼容证据声明新来源已经通过。

业务安装回执 schema4 / sourceLayoutVersion4 记录实际 teamaiPackage、三个上游固定提交、十包清单、来源/分发/工具摘要以及资源、入口和宿主加载层级。旧 schema2/3 或不同身份保留拒绝，需要另行评审迁移。文件安装和实际 pull 仍不证明模型加载或原生角色调用。
