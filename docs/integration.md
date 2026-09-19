---
id: collaborative-foundation-infra-integration
status: current
---
# TeamAI、官方方法与 DevFlow 的职责

[项目入口](../README.md) · [接入](onboarding.md) · [隔离 CLI](teamai-runtime.md)

TeamAI 负责共享资源解析和分发；engineering 是订阅组，默认获得完整十份 Skill，不表示调用或授予批准权。CLI 首次 prepare 与显式 upgrade 查询 latest，实际允许执行的版本必须通过包身份、内置同名资源和真实十包分发验证。开发依赖 0.24.0 是当前可复现测试基线，不是生产永久许可或首次安装的替代来源。

会话明确选择 devflow 后，DevFlow 负责 Planner、Reviewer、Tester、Implementer 的权限、门禁和状态。完整保留其入口与四角色五包，不按订阅拆散。TeamAI 不能覆盖同名 native agents；原生准备由原 DevFlow 协议管理。文件分发、宿主加载、真实角色调用分别报告。

basic 只用共同工程规范，不自动准备四角色、读取五份交付正文或维护 .devflow。根选择保存于用户状态目录，不替代项目流程状态；模式与 policy.workflow 权威引用是不同事实。详见[会话模式](../skills/common/collaborative-foundation-infra/references/session.md)。

## 固定来源与十包

| 来源 | 固定提交 | 内容 |
|---|---|---|
| skills/upstreams/ric-devflow | 9ce34a0e9e6e06cbda2f6c4d76951248c7d27fcb | 五包100文件 |
| skills/upstreams/ric-design-patterns | 46b183615afbfe3b1fffcbc9425ac3aea2c36d99 | 设计模式625文件 |
| skills/upstreams/teamai-cli | 0c059b2da6fe0fa3206ab1ce33978601a2a832e6 | 官方两包13文件、中文指南、MIT LICENSE |

schema4 [来源锁](../sources.lock.json)记录三个真实 gitlink、八份上游包完整文件及两份参考资产的来源、摘要、执行位和分发目的。`skills/common` 仅维护工程规范与 CLI 短入口两包，不复制上游源码。clone 后显式初始化子模块，`prepare:skills` 离线只读核验，不 fetch、不执行上游脚本、不写缓存/副本/归属回执。缺件、未知对象、版本漂移或脏来源保持报错。

TeamAI 的 submodules:false 保持不变。每次调用只在私有临时团队目录组装十包，八份上游包原字节与执行位不变，不复制 .git、外层指令或上游 agents。自有导航确定性重定位；官方中文指南进入 CLI 包的 references/usage-guide.zh-CN.md，LICENSE 进入该包根目录，源码和分发侧分别验证。

指南的相对文件/图片/引用目标映射到同一固定提交的 GitHub blob URL，本地有效锚点保留，外链与代码正文不改。固定指南唯一已证实坏锚由来源锁的精确映射修复：`#项目级project-scope` → `#项目级project-scope默认`；旧目标必须存在、新目标必须有效，其他未知/陈旧映射拒绝。此例外只改分发副本的目标，不改上游原文。

## 调用、权限与输出

自有 [CLI Skill](../skills/common/teamai-cli/SKILL.md) 路由到两份官方方法。普通开发不自动建知识库或分享经验；生成前确认输入和输出范围，上游默认父目录不是写入授权。知识文档进入既有渐进导航，progress 只表示专项进度，不映射 Gate 或 .devflow。

活动 DevFlow 子角色可引用局部方法，不启动上游完整代理流程；完整知识生成由主会话收拢自身活动执行者后作为独立文档专项安排，沿用既有文档豁免，不自动切换模式或创建第二流程。经验草稿与团队提交/推送分开；已有具体授权不重复询问，缺授权不发布。

六类内置自动事件、后台同步/升级、recall、贡献提示与统计继续关闭。实际适配器只发布核验后的 Skills 和规则，CLI 临时 hooks、agents、config 不进入目标。两份内置 Skill 与固定来源不符、出现额外 Skill 或实际输出与预期不符，均在发布前拒绝，不能改源包凑兼容。

[TeamAI 固定来源](https://github.com/Tencent/teamai-cli/tree/0c059b2da6fe0fa3206ab1ce33978601a2a832e6) · [DevFlow 固定来源](https://github.com/lichong-a/ric-dev-workflow-skills/tree/9ce34a0e9e6e06cbda2f6c4d76951248c7d27fcb) · [设计模式固定来源](https://github.com/lichong-a/ric-design-patterns-skill/tree/46b183615afbfe3b1fffcbc9425ac3aea2c36d99)
