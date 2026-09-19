---
schema_version: 2
root_issue_id: REQ-20260917-002
revision: 4
task_revision: 5
author: ric_devflow_planner
---

# Spec 4 — TeamAI 官方 Skills 与显式最新版 CLI

本版记录用户已批准的《TeamAI 官方 Skills 子模块与最新版 CLI 接入方案》，取代 Spec3 中两子模块、七包和固定 TeamAI 0.24.0 的相关限制。其余已实现的会话、权限、来源、治理及目标保护约束保持。本地交付，不提交推送主仓、不改其他工程或现有全局安装。

## 基线与授权

- AUTH-005：用户明确要求实施最终修订方案；两份 TeamAI 官方 Skill 默认一起分发；CLI 只在首次安装或明确升级时查询 latest。
- 主仓 HEAD 仍为 e094623ea9dd21b5d5ac69fcbaec093220cbb5e1；已有暂存和未提交内容是批准的前序工作，必须保留。Spec3 修订4的历史报告只证明旧候选。
- 本轮工作区完整备份及实际恢复核对 5159 条目；归档 SHA256 6c601f2d11ebd638b9cf7478b13069037a7c8324ce6d8db4b546a13e82a732fa；清单 SHA256 cc721090b8f4c206a61f8e3bf6bfc2b4faa72f0eb0c32f494350bca656ded411。机器位置仅用于本地交接。
- 当前仍是实现会话门禁前开始的同一主对话，继续已有 DEC-004 协作，不生成用户没有选择的模式。真实 session status 本轮因既有状态 namespace 非私有而退出2，未修权限、未写模式，也不以此声称新门禁生效；本功能验收只用隔离身份。

## AC-TA-SOURCE：三个子模块与单一来源

新增 skills/upstreams/teamai-cli 子模块，仓库为 https://github.com/Tencent/teamai-cli，提交固定 0c059b2da6fe0fa3206ab1ce33978601a2a832e6。两个 RIC 子模块及其六包725文件保持固定。只为新增 gitlink 和 .gitmodules 进行必要 index 更新，不提交、不改其他 index 条目。

直接登记官方 skills/team-wiki-codebase、skills/teamai-share-learnings 的完整13文件；官方指南 docs/usage-guide.zh-CN.md 及 LICENSE 也来自同一子模块。不复制上游源码到 skills/common，不执行上游脚本/外层指令，不把上游 agents 配置安装为本仓角色。

sources.lock schemaVersion 4：三个固定 upstreams、八个上游 packages，并登记官方参考资料路径、身份和分发目的。校验确切映射、唯一名称、来源URL、gitlink/HEAD、干净状态、完整摘要与执行位；未知内容保留拒绝。prepare:skills 保持离线只读，不生成导出/缓存/回执。

## AC-TA-SKILLS：十份完整分发与真实输出

自有 skills/common/teamai-cli 保留短入口和本项目使用边界；现有自有工程规范增加路由。源码链接指向真实子模块；临时分发组装时将官方指南与许可证放入自有 CLI 包，并确定性重定位指南相对链接到固定上游提交。两份官方 Skill 与其他六份上游 Skill 原字节/模式保持不变。

engineering 订阅默认完整十包。临时团队布局、目标路径和回执使用显式包清单；不扩大自动扫描范围。真实隔离 TeamAI pull 输出必须和预期完整清单一致，不得以直接复制原包冒充真实分发。来源/目标在发布前重查，已有禁用、定制、旧版本回执、脏入口、软/硬链和并发改动仍保全拒绝。

TeamAI 自带同名 Skill 会在 pull 时覆盖临时资源。CLI 包中两份内置 Skill 与锁定来源不一致或出现额外 Skill 时保守报错；隔离输出的任何内容/未知文件差异在目标写入之前报错，不替换来源、不放宽校验、不静默降级。只发布明确登记的 Skills 与规则，不发布 CLI 生成的自动 hooks/agents/config。

安装回执 schemaVersion 4、sourceLayoutVersion 4，记录实际 CLI 版本与包完整性、三个上游提交、源/分发/工具摘要和十包清单。旧回执只读识别并明确提示需独立迁移，不自动覆盖。工具参数与审计/check/plan/apply/session原接口兼容。

## AC-TA-RUNTIME：首次 latest 与显式升级

新增 npm run prepare:teamai 与 npm run upgrade:teamai，默认当前规范仓，支持隔离用户数据根用于测试。CLI 位于 XDG_DATA_HOME 或 ~/.local/share 下本项目专属数据目录，不占用业务依赖、全局安装或会话状态目录；相对根路径拒绝。首次 prepare 解析 teamai-cli@latest，一次固定实际版本、tarball及integrity，在独立候选位置安装，禁止生命周期安装脚本。已有完整安装离线核验后复用，不查询 registry。

upgrade 仅由明确调用触发；在新目录安装并完成相同的来源/内置包/真实隔离分发兼容检查后原子切换当前回执。失败保留原 CLI/回执和清晰错误，不自动降级后报成功。并发安装、损坏/未知/软链目标和完整性失败安全拒绝；清理仅限当前进程创建的临时目录。普通 preview/prepare:skills/check/CI 不安装、不联网；缺少 CLI 报准备命令，预览不冒报实际分发通过。

分发保留 --teamai-entry 显式入口；必须核对包身份、实际版本、内置包内容和完整性。拒绝无法证明来源的自定义伪入口。开发依赖中的 TeamAI 仅作可复现测试基线，生产默认运行时从准备回执读取。移除生产与CI的版本等于0.24.0判断；当前已测版本的事实记录可保留，但不得声称任意未来版本兼容。

CLI运行时安装与官方Skill gitlink升级分开。CLI latest不修改来源锁或子模块。sources.lock只记录选择策略与固定官方资源，不把某一运行时版本当永久唯一许可。CI仍从可信基线取得检查器、锁和策略；不在线解析latest，不执行候选bootstrap，不允许候选放宽门禁。

## AC-TA-BOUNDARY：按需执行与职责

默认分发不等于调用。普通开发不自动生成知识库或分享经验；basic不准备DevFlow原生角色。知识库生成前确认输入和输出范围，不能因上游默认目录擅自写仓库父目录；生成文档接入既有导航。progress只表示专项生成进度，不映射Gate、不写.devflow。

活动DevFlow任务内可引用方法，不让子角色启动上游完整代理流程。完整知识生成作为独立文档专项，收拢当前活动执行者后由主会话按原文档豁免进行，不自动切换会话模式。经验草稿与向团队提交/推送区分，已获具体授权无需重复询问，未获授权不得自行发布。

后台同步/升级hook、recall、贡献提示继续关闭。需要Python的辅助动作遵循受限安装尝试、失败后人工协议，并真实记录未运行项。规范属于Agent协议，不宣称从底层阻止任意工具或证明宿主已经加载。

## AC-TA-VALIDATION：测试与交付

独立 Tester 维护测试，覆盖三源、十包、两份官方13文件、双侧导航、同名覆盖、未知内置Skill、latest刷新时机、离线、权限/并发/完整性/升级失败和旧回执。保留原62组中仍有效的行为保护；变化的七包/固定版本Oracle按新批准行为替代并说明。

执行来源核验、构建、完整测试、治理检查、Skill校验和独立review。真实TeamAI分发、宿主加载、原生执行分别记录。原生宿主、远端CI和正式Git门禁没有实际执行就not_run；不凭模板、模拟或文件安装标通过。

## 实现边界与设计

继续 TASK-001，revision 5，不新增交付状态机。主代理只协调和维护本Root证据；Implementer独占生产及必要第三子模块Git动作；Tester独占tests及本Root test-plan；Reviewer只读。公共允许范围为 tools/scripts、包清单锁、sources锁、manifest/rules、AGENTS/README/docs、自有Skill与新增子模块。旧固定包、业务仓、全局安装、历史附件和远端受保护。

设计依据：Node ESM，使用既有文件摘要、路径保护和隔离适配器。对真实变化点按函数拆分来源、资源组装、运行时准备、发布；没有模式基线已经足够，不新增类层级、插件平台或后台服务。流程门禁遵循既有本地交付例外，不能以未提交工作树摘要宣称主仓正式G5-G10。
