---
name: teamai-cli
description: 在本规范内按需使用 TeamAI CLI、官方知识库方法和经验分享 Skill。用于显式准备或升级隔离 CLI、任务前分发，以及有范围授权的文档专项；不自动调用官方流程或发布团队内容。
---
# TeamAI CLI 与官方方法

先遵循 [工程规范与会话协议](../collaborative-foundation-infra/SKILL.md)，确认当前模式、任务和允许写入范围。分发十一包不表示调用这些方法，也不证明宿主已加载。普通开发不自动生成知识库或分享经验，basic 不准备 DevFlow 原生四角色。

按当前动作读取，不预加载全部资料：

- 用户显式调用 `/teamai` 时：[官方 TeamAI 入口](../../upstreams/teamai-cli/skills/teamai/SKILL.md)。普通接入、开发和资源分发不触发该流程；其全局安装、自动 hooks 和分享默认值不扩大本次授权，仍使用本规范的隔离 runtime 与明确项目范围。
- CLI 参数和资源模型：[固定官方中文指南](../../upstreams/teamai-cli/docs/usage-guide.zh-CN.md)。指南来自固定子模块；分发时相对导航转换为该固定提交，不能当作本项目的额外权限。
- 已获范围授权的知识文档专项：[team-wiki-codebase](../../upstreams/teamai-cli/skills/team-wiki-codebase/SKILL.md)。先确认输入工程、输出目录、修改预算和导航接入位置；上游默认父目录不是写入授权。生成文档链接回既有入口，不创建无法发现的平行文档树。
- 经验总结与分享：[teamai-share-learnings](../../upstreams/teamai-cli/skills/teamai-share-learnings/SKILL.md)。本地草稿与向团队提交、推送或发布分别处理；已有具体授权不重复询问，缺少发布授权时只完成可审阅草稿。
- 官方内容许可：[MIT LICENSE](../../upstreams/teamai-cli/LICENSE)。九份上游包保持原字节，不改它们的原生配置与角色职责。

活动 DevFlow 任务的子角色可以引用局部方法，不能启动上游完整代理流程。完整知识生成由主会话作为独立文档专项安排，先收拢自身活动执行者，沿用既有文档任务豁免；不自动切换会话模式，不创建第二套角色或状态库。上游 progress 文件只表示专项生成进度，不映射交付 Gate，也不写 `.devflow`。

## CLI 准备与分发

在规范仓中运行 `npm run prepare:teamai`：首次显式解析 `teamai-cli@latest`，固定实际版本与归档完整性，在用户数据目录的本项目私有 namespace 中安装并验证。已有完整安装离线复用；规范变化只离线重核兼容性，不自动追随 latest。只有明确调用 `npm run upgrade:teamai` 才查询升级，失败保留原安装及回执。

prepare 输出可验证的 `entry`；分发默认从同一数据根回执读取它，显式 `--teamai-entry` 也必须指向已准备安装。裸 `node_modules`、任意脚本或只返回版本号的入口不能替代来源证明。当前开发依赖是测试基线，不是用户首次 latest 的来源。

来源升级后，旧 runtime 若不兼容，普通 prepare 和分发会保留旧安装并提示显式 upgrade。upgrade 先验证旧安装的归档、文件清单和原回执，再对新候选核验当前来源与三宿主输出；不会要求旧版本先通过新来源的 Skill 清单。只有新候选全部通过才切换 current。

任务开始前显式同步、核验并绑定版本；执行期间不热更新。后台同步、自动升级、recall、贡献提示保持关闭。CLI 产生的 hooks、agents 与配置留在隔离运行目录，不向业务仓发布。知识库辅助需要 Python 时，先在受限用户目录尝试安装；失败才转人工协议，明确哪些自动检查未执行。

官方指南绑定子模块提交，与已安装 CLI 版本不必相同；使用具体命令或参数前核对实际 CLI 的 `--help`，指南中的新适配能力不能充当本次宿主加载或调用的验证。
