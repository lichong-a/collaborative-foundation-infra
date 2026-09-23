# collaborative-foundation-infra 维护规范

本仓是 TeamAI 团队规范源。读取 README 与 `skills/common/collaborative-foundation-infra/SKILL.md`，再按当前动作读主题参考。会话模式按下方入口查询；选择 devflow 后才使用已安装的 ric-devflow，basic 不加载/调用其角色；本仓 `.devflow` 是当前任务事实源，治理工具不能写入它。

`skills/upstreams/` 是九份上游 Skill 的唯一来源，固定子模块内容禁止手改。`skills/common/` 只保留自有规范；`npm run prepare:skills` 只读核验真实来源，不导出、不写回执、不联网或检出。来源映射在 `sources.lock.json`；TeamAI 所需扁平布局只在每次分发的私有临时目录组装。自有工具源码在 tools，分发产物通过 `npm run build` 更新。不要手改打包产物。修改来源版本必须独立审查。

CLI 默认从私有 prepare:teamai 回执读取；首次准备与显式 upgrade:teamai 才查询 latest，开发依赖仅作测试基线。三份官方 Skill 分发不等于调用，按 [CLI 边界](skills/common/teamai-cli/SKILL.md)确认知识输入/输出和分享授权。

使用 Node 24、`npm ci --ignore-scripts`、`npm run prepare:skills`、`npm run build`、`npm test`、`npm run check`。tests 由独立测试者维护。不得弱化检查以通过自审；候选治理变更需要独立 review。

本仓只维护通用工程规范，不保存具体业务工程的诊断、配置或交付记录。其他工程与全局安装默认只读；跨仓接入须有明确目标和授权，所有写入验收使用隔离仓库。

Git 提交、推送和远端配置需明确授权。文件安装、宿主加载、真实角色调用分别报告。

<!-- collaborative-foundation-infra:source-session:start -->
开始新的工程主会话前读取 [会话选择与恢复](skills/common/collaborative-foundation-infra/references/session.md)，定位真实根会话并查询持久化选择。未选择只做必要身份只读检查，等待明确选择；同根恢复复用，新主会话和 fork 重新选择，子 Agent 仅继承。两模式共用工程规范，只有 devflow 模式加载原交付正文及角色。来源更新和此文件的存在都不能替用户补造选择，也不证明宿主实际加载。
<!-- collaborative-foundation-infra:source-session:end -->
