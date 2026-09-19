---
schema_version: 2
root_issue_id: REQ-20260917-002
revision: 4
author: ric_devflow_tester
task_id: TASK-001
task_revision: 5
spec:
  path: .devflow/changes/REQ-20260917-002/attachments/spec-v4.md
  revision: 4
  sha256: 2aa07065100b48bc97e02d8edb02b83ce959ccc5c9687d6ca582280e16a05b83
baseline_sha: 53d29b7fc9906aa5556bb66e476568dc8a446815
main_head_sha: e094623ea9dd21b5d5ac69fcbaec093220cbb5e1
---

# 独立测试计划 v4：官方 Skills、十包分发与显式 CLI 准备

本计划绑定[Spec4](attachments/spec-v4.md)及[技术接口补充](attachments/technical-v5.md)（SHA256 `03fed80eb0bbad59fdf34ef59bbbe48c0c5ad7476a313c54a8651019688cadac`），须经独立 TEST_REVIEW 后作为本轮验收依据；计划本身不表示执行通过。继续原 TASK-001 revision5，执行报告由 Planner 原样加入[证据索引](evidence.md)。[TestPlan3](attachments/test-plan-v3.md)已存在且与被替换计划逐字一致，SHA256 `5783c10777c9695a1a337e2ee59bec846ce69450e3aad8fdd78325090f177f11`，本轮未改写历史附件。其未变会话、入口、工程规范、CI和文件保护 Oracle 通过下方映射继续适用；本计划明确覆盖与新版冲突的两源/七包/固定 CLI 版本/旧 schema 假设。

<a id="PLAN"></a>
## PLAN — 范围、基线与证据身份

范围为五项新 AC：三份固定子模块与八份上游包、十包真实分发及指南重定位、用户私有 CLI 首次 latest 与显式升级、官方方法的执行边界、可信 CI 和完整回归。重点风险是 npm 内置同名 Skill 覆盖、未知输出被误发布、运行时升级丢失旧安装、子模块与 CLI 两条版本线混淆。官方包保持原字节；只有自有 CLI 包内的指南副本按明确映射转换相对链接。

本阶段 Tester 只维护本文件与仓外基线证据，不改 tests、生产、来源锁、子模块或其他角色记录。生产作者冻结并释放窗口后，才在批准测试范围内实施与执行。主仓 HEAD/index、真实全局安装和用户数据、其他工程及历史证据受保护；不得为测试在真实会话写模式、修权限或绕过已有 namespace 拒绝。本会话沿用 DEC-004，不把隔离测试记录当用户选择。

本轮生产前已重新执行旧行为基线，非复用上轮结果：

- 精确代码基线 `53d29b7fc9906aa5556bb66e476568dc8a446815`，在其既有隔离候选执行 `npm test`；主仓 HEAD 仍为 `e094623ea9dd21b5d5ac69fcbaec093220cbb5e1`。
- 当前生产与9个测试文件对应该候选，只有 README 存在后来获准的一句话接入修改。该 README 和本轮 Root 记录不在这次旧代码 SHA 覆盖范围；不声称它是当前整个工作区或 Spec4 的 tested_sha。
- 2026-09-17T12:12:30.957160+00:00 至 2026-09-17T12:13:23.469673+00:00；Node v24.20.0、npm11.19.0、Git2.53.0、Linux x86_64；退出0，62 passed /0 failed /0 skipped /0 cancelled，52,354.272546ms；候选 tracked tree 前后干净，分类 clean。
- 基线 stdout SHA256 `ba0d597ef6a9b7f21e922775248d5c4e37c21de3b43edf41691d0f54a9c95bea`，stderr 为空；中性 baseline.json SHA256 `ecd23a3ca7204d42c7d4039ba919e820856819eb4e91f9ae3c1d00d8f57b8390`，由本轮私有证据目录保全并交 Planner 引用。身份守卫先发现 README 差异且未运行测试，属范围说明，不作为历史产品失败。

最终验收必须固定包含新增生产、测试和三个真实 gitlink 的新完整隔离候选 SHA，并核验与交付工作区/已暂存 gitlink/固定上游/生成物对应；主仓不提交、推送。新候选的实际父提交和过程记录由交接确认，不能给移动工作树套用旧 SHA。外部测试资产另行固定摘要及恢复位置。正式 TEST_REPORT 与测试代码作者报告仍用 schema1新ID；本地切片结果不授主仓正式G5–G10。

每条执行记录真实命令、相对cwd、环境、完整tested_sha、退出码、实际 CLI 版本与包身份、输出及未运行项。失败创建可复现 Defect并给疑似分类，Planner归因；新失败、环境失败、历史失败分别记录。禁止弱化保护、Skip、无限重试、扩大既有超时或默认回退旧 CLI 后报成功。

<a id="ENVIRONMENTS"></a>
## ENVIRONMENTS — 权威层级与隔离

| 层级 | 必需证明 | 不可替代的范围 |
|---|---|---|
| 真实本地 Git/文件/Node 进程 | 三gitlink、锁、HEAD、原文件；只读准备、十包清单、持久化、并发、目录权限与原子发布 | 不证明远端宿主、真实模型或未来 CLI 兼容 |
| 受控 registry/npm/文件系统边界 | 首次/复用/升级的查询次数、固定元数据、防安装脚本、故障、完整性、竞态、失败保旧；成功切换使用实际 CLI 代码/归档或明确合成版本身份 | Mock registry或合成版本只证明该边界算法，不冒充真实 npm 发布版已兼容；不 Mock pull 成功来代替真实分发 |
| 实际 npm CLI 与真实 TeamAI pull | 至少一次实际 `latest` 元数据解析及其确切版本、tarball/integrity、隔离准备/兼容校验，Codex/ZCode/Claude十包真实输出、重复/离线使用 | 若实际 latest 不兼容，应清楚拒绝并保旧；不能改锁/原包或以直接复制让它通过。成功兼容结论只绑定实际通过版本 |
| 人工协议与结构校验 | CLI Skill短入口、官方方法调用授权、知识库输出边界、模式/角色/progress/分享发布路由；源与分发导航 | 文件存在、模板或人工审阅不等于宿主加载或真实原生调用 |
| 原生/远端 | 有独立环境及授权才执行新宿主加载、真实调用和远端CI | 本轮未实际执行则not_run，不计入本地PASS |

全部安装和会话选择使用隔离 HOME/USERPROFILE、XDG_DATA_HOME、XDG_STATE_HOME、配置/缓存/TMPDIR及合成ID，测试状态根彼此独立。用户目录目标只能是本轮创建的路径；默认路径行为通过隔离HOME核对。实际网络仅用于明确运行时准备/升级验证和既有受限运行时回归，不写系统/global/npm业务依赖，不修改全局代理/registry或Git配置。离线/普通操作用失败即计数的 registry、npm或子进程边界哨兵证明零网络尝试，不能仅凭很快返回判离线。

runtime结果的 source lock/指南/内置包 Oracle 由 Tester 从固定上游与已冻结声明建立，不能调用生产校验函数生成同一个期望。实际CLI验证记录npm包名、bin归属、真实版本、下载完整性及文件清单；伪造package.json或打印版本的自定义脚本不能取得“可信实际 CLI”结论。源码官方两包逐文件清单由固定提交读取；指南转换期望独立解析原文及明确目标，不做全局字符串替换。

npm进程的HOME、user/globalconfig与cache仅限私有候选，安装参数必须禁用scripts/audit/fund/bin-links；设置真实用户配置与缓存哨兵确认不读写。并发用真实独立进程、IPC或受控屏障；文件写/fsync/rename/清理失败在测试拥有资源下注入。原安装、current回执、外部哨兵和未知兄弟目录执行前后逐字/模式比较。只清理由本次创建且所有权明确的临时资源，不清理不明锁、孤儿版本或并发写者。必要外部资产保存在本轮私有证据目录，不把机器绝对路径写共享规范。特殊权限若无法真实复现，明确用注入层且不冒称真实EACCES。

<a id="CASES"></a>
## CASES — 新行为与 AC 追踪

以下均由 Tester 独立实施/执行；实现者自测作为辅助，不代替结果。每个稳定ID可含同一Oracle的参数化子场景。公开接口采用已确认technical-v5；下方未声明细节仍以冻结交接为准，必需行为、权限和观察标准不得放宽。

| ID | AC | 前提与动作 | 可观察 Oracle、失败保护 | 层级/证据 |
|---|---|---|---|---|
| TC-TA-SOURCE-001 | AC-TA-SOURCE、AC-TA-VALIDATION | 新增官方子模块固定`0c059b2da6fe0fa3206ab1ce33978601a2a832e6`；读三源schema4锁、.gitmodules/index/HEAD/工作树指针、八包和guide/LICENSE清单 | 三固定身份一致；原RIC六包725文件与旧版本逐字/执行位相同；官方两包完整13文件无重写；官方参考与同一提交一致；名称/URL/路径/摘要/目的地唯一明确。第三gitlink以外原index保留；不执行上游脚本/外层指令或加载其agents | 真实Git、独立清单、前后范围摘要 |
| TC-TA-SOURCE-002 | AC-TA-SOURCE | 缺失第三子模块、锁/index/HEAD不符、官方包/指南/许可缺件、额外或未知对象、字节/执行位变化、tracked/untracked/ignored脏内容、映射越界/重复 | 明确拒绝，源和目标保持；不退回副本、不认领未知对象、不联网修复或改变子模块提交。父目录软/硬链与原源保护继续覆盖第三源及参考路径 | 文件/Git失败矩阵与哨兵 |
| TC-TA-SOURCE-003 | AC-TA-SOURCE、AC-TA-RUNTIME | 无npm CLI安装时重复及并发prepare:skills；同时跑普通预览、check/可信CI的只读分支，设置registry/remote调用哨兵 | 来源准备仍可离线只读成功，不安装CLI或写导出/缓存/回执；没有CLI时分发不冒称实跑成功，给准备命令；各动作不联网、不建旧副本、不写会话状态，build只写批准制品 | 真实CLI、网络边界零调用、目录前后清单 |
| TC-TA-SKILLS-001 | AC-TA-SKILLS、AC-TA-VALIDATION | 按明确engineering清单，从三源组装十包，用实际兼容CLI分别运行Codex/ZCode/Claude预览/应用/重跑 | 八上游包原字节/执行位保持，自有两包与独立期望相符；十包目标路径、规则与回执正确；记录真实pull命令/输出。预览不发布、幂等保留用户字节；不能用直接复制原包冒称pull | 真实隔离TeamAI，独立expected manifest |
| TC-TA-SKILLS-002 | AC-TA-SKILLS、AC-TA-SOURCE | 自有CLI入口与工程入口路由；guide/LICENSE从固定源进入临时CLI包；实际指南全部相对链接与测试反例 | 源码导航可达，安装后入口可达；指南相对文件/图片/引用式链接/锚点按明确规则指向固定提交或自身有效锚点，不指main/master/临时路径；外部URL、正文、代码示例及上游原文保持。未知/歧义/越界目标不能静默输出坏链接 | 独立链接解析/对照，构建与分发副本检查 |
| TC-TA-SKILLS-003 | AC-TA-SKILLS、AC-TA-RUNTIME | 实际npm CLI的两份内置同名Skill与固定官方13文件比较；构造缺失、改字节/模式、同名嵌套额外文件或额外第三内置Skill | 相同内容才允许兼容；差异在目标发布/运行时current切换前明确拒绝，原包/原安装/旧回执不动；不替换固定源、不过滤额外Skill使检查通过。已发布npm版本成功场景必须是真实包 | 实际内置清单＋边界故障fixture |
| TC-TA-SKILLS-004 | AC-TA-SKILLS | 在实际pull后、发布前检查完整隔离输出；注入未知Skill、包内额外/缺失文件、错误规则、输出软链及漂移 | 预期十包/规则之外的资源或内容差异报错且目标零发布。CLI产生的hooks/agents/config不得进入目标；已明确知道的CLI私有配置若仅用于运行，必须隔离且不能假冒资源合格。来源和目标写前复核 | 真实pull＋发布前边界注入，目标/用户快照 |
| TC-TA-SKILLS-005 | AC-TA-SKILLS、AC-TA-RUNTIME | schema4新回执；schema2/3历史回执、缺实际CLI/version/integrity/三个SHA/摘要/十包项，篡改source或distribution/工具身份 | 新回执准确绑定实际使用CLI及源/输出；旧回执保全拒绝并提示独立迁移；伪造/不完整回执不能通过。无需业务npm锁；升级CLI不自动升级用户项目旧安装 | 真实安装读回、可信CI、负例 |
| TC-TA-SKILLS-006 | AC-TA-SKILLS | 已有官方同名定制、额外文件、显式禁用、宿主白名单、项目分区配置；脏/残缺/不同入口、陈旧跨harness projectEntry | 新增两官方包与CLI自有包同受整体预检，任何冲突不发布其他9包或改配置；原PROD-ENTRY-001保护、matched+脏正文零写继续成立；不运行背景hook/recall/提示配置 | 原入口/禁用/定制回归，三harness真实输出 |
| TC-TA-RUNTIME-001 | AC-TA-RUNTIME | 空隔离数据根执行prepare:teamai；registry latest从A切B的受控响应；至少一个实际npm latest请求 | 首次解析一次，将本次实际版本/tarball/integrity固定用于安装和后续校验，不二次追随变化latest；候选隔离、禁止生命周期脚本；来源锁/gitlink不变；只有来源/内置包/实际分发兼容均过后发布可复用记录 | 实际npm/CLI＋可计数registry边界；脚本执行哨兵 |
| TC-TA-RUNTIME-002 | AC-TA-RUNTIME | 完整已准备安装后断网/registry失败，重复prepare和普通sync；自有规范更新后重新准备；篡改当前记录或安装文件再重复 | 完整安装核验后复用不查registry、不重装或暗中升级；损坏/不明内容保持报错，不以重装掩盖；实际版本/完整性/清单匹配才可运行。自有规范改变时用当前CLI离线重核新来源，旧兼容证据不冒充新规范通过，不因distributionDigest变化查latest；新兼容失败仍保旧且报错。普通缺CLI分支提示prepare，不借开发依赖自动兜底 | 可计数零请求、安装/回执前后摘要 |
| TC-TA-RUNTIME-003 | AC-TA-RUNTIME | 已有A安装时显式upgrade，给兼容B；也覆盖latest仍A；分别核对普通prepare和后台事件 | 仅显式upgrade解析latest。B在独立候选完成与首次相同检查后原子切换；同版本允许可解释幂等且不破坏原安装。普通操作不触发upgrade；任何受测版本结论仅绑定实际身份，不承诺未来兼容 | 真实CLI归档/受控registry；切换边界读者与receipt |
| TC-TA-RUNTIME-004 | AC-TA-RUNTIME、AC-TA-SKILLS | 对upgrade分别注入registry超时/无效元数据、下载失败/integrity不符、npm失败、内置包不符、真实分发差异 | 退出非零并保留完整A与current原字节，不切到B、不回退A后报upgrade成功。失败首次prepare无伪成功current。保留清晰失败层级，不修改来源版本来兼容CLI | 网络/npm/输出边界故障矩阵 |
| TC-TA-RUNTIME-005 | AC-TA-RUNTIME | absolute XDG_DATA_HOME、缺失时隔离HOME默认、相对根；非私有/无写权限目录，最终/祖先软链、硬链、未知或损坏current、已有不明版本目录 | 使用项目专属数据namespace，与会话state、业务node_modules、global分离；相对/不安全/不明状态保守拒绝且外部哨兵、原文件/权限不变，不chmod兜底、不覆盖未知目标 | 真实POSIX/Git外部哨兵＋权限失败 |
| TC-TA-RUNTIME-006 | AC-TA-RUNTIME | 两prepare、prepare与upgrade、两upgrade并发；写/同步/current原子切换前后故障或进程中断；来源在兼容检查前后漂移 | 排他或明确竞争失败，读者只见完整旧/新安装身份；不丢旧回执、没有半安装伪成功。临时清理只限自己创建目录；保留未知锁/目录、他人候选和成功方文件；重入按真实完整状态处理 | 多进程屏障、fs故障、目标快照 |
| TC-TA-RUNTIME-007 | AC-TA-RUNTIME、AC-TA-SKILLS | --teamai-entry指向已准备且具有有效安装回执的私有入口；指向裸node_modules入口、伪脚本、改package.json、错误bin/version、脱离包的拷贝或软/硬链入口 | 只有可验证准备安装中的入口可用，裸node_modules即使是真实已锁定包也拒绝。证明包归属、实际版本、内置内容和完整性；显式路径不是跳过来源回执授权，成功路径必须实际pull后验输出 | 实际已冻结CLI与合成不可信入口 |
| TC-TA-RUNTIME-008 | AC-TA-RUNTIME、AC-TA-VALIDATION | 普通preview/check/prepare:skills/CI中registry哨兵；开发依赖版本与运行时已核验版本不同；CLI升级后固定官方资源不变 | 生产默认只读取准备回执，开发包仅作为可复现的测试安装输入且也须经过准备；删除“唯一许可0.24.0”判断但仍做实际包/输出验证；CI从可信固定数据离线检查，不查询latest、不执行候选bootstrap。CLI安装与source gitlink升级独立 | 实际CLI、静态输入追踪、可信CI负例 |
| TC-TA-BOUNDARY-001 | AC-TA-BOUNDARY | 沿工程Skill→CLI短入口→两个官方Skill，普通开发/basic/活动DevFlow子角色场景 | 安装不等于调用；不自动生成wiki/分享、不在basic准备四角色。活动子角色不启动上游完整代理流程；完整生成作为主会话独立文档专项、收拢自己活动执行者，保持模式及原文档豁免，不派生第二流程状态 | 人工协议场景审阅＋配置静态检查；不冒充模型执行 |
| TC-TA-BOUNDARY-002 | AC-TA-BOUNDARY、AC-TA-SKILLS | 官方默认父目录输出、进度文件与分享步骤；已有明确输出/发布授权和没有授权两类情境 | 确认输入和输出范围，不能因上游默认值写父目录；生成文档路由回既有导航。progress仅专项进度不映射Gate/.devflow；经验草稿与提交/推送分开，未授权不发布、已有具体授权不重复询问 | 人工协议/模板/路由；实际发布not_run |
| TC-TA-BOUNDARY-003 | AC-TA-BOUNDARY、AC-TA-RUNTIME | 检查团队hooks/recall/contributeHint/自动同步升级配置；Python辅助缺失/安装失败边界 | 后台行为继续关闭，只发布声明资源；Python受限安装尝试后才人工降级，保留未运行记录。规则不宣称底层沙箱或宿主已加载 | 配置/普通回归、协议审阅 |
| TC-TA-CI-001 | AC-TA-VALIDATION、AC-TA-RUNTIME、AC-TA-SOURCE | 可信基线与不可信候选分别修改第三gitlink、schema4锁/官方引用映射、runtime准备入口/记录策略、npm依赖或checker/policy | 可信checker/锁/策略决定检查，新治理改动需独立review，候选不能自降；团队三源与已分发布局都验证，不依赖业务npm锁或live latest；新违规返回失败，环境失败不当成功 | 真实Git/CLI、registry零调用 |
| TC-TA-REG-001 | 全部 | 新固定完整候选执行来源准备、显式CLI准备、build、完整npm test、check、Skill校验、保护与分发核验 | 新旧有效Oracle全部覆盖；原RIC725与官方13原包、源码不复制、三gitlink和CLI记录相符；全局/业务/历史/主仓未授权Git不变。结果计数按真实测试组织，旧62+6不是新验收 | 新SHA、独立清单、实际命令、报告 |

### 已有用例的保留与替代矩阵

以下对[已冻结v3矩阵](attachments/test-plan-v3.md#验收追踪与用例)做精确增量；保留原ID和行为，涉及新增数量/布局/版本的输入按本版更新。原TestPlan3的28个ID仍可追踪，不靠新增计划页宣布它们自动通过。

| 旧ID/假设 | 当前保留或替代行为 | 新AC映射 |
|---|---|---|
| TC-SRC-001至008；两源六包/schema3 | 来源变三源八包/schema4，原RIC725保护保持，增加官方13与guide/LICENSE；只读、离线、未知副本、升级一致性、链/并发/故障继续覆盖 | AC-TA-SOURCE、AC-TA-RUNTIME、AC-TA-VALIDATION |
| TC-DIST-001/002；七包、同源摘要/schema3回执 | 明确十包清单、两个自有包与八原包；新增指南独立重定位；回执schema4/layout4带实际CLI身份；schema2/3保全拒绝，固定源与CLI两条版本线不混用 | AC-TA-SKILLS、AC-TA-RUNTIME |
| TC-DIST-003至006、PROD-ENTRY-001 | 定制/禁用/整体预检、入口四种flags、原正文、matched脏文本no-op、陈旧所有入口重查、跨harness同块保护全部保留，并扩展新增包 | AC-TA-SKILLS、AC-TA-BOUNDARY |
| TC-SESSION-001至008 | 参数/0-3-2退出码、无写status、选择/恢复/切换历史、worktree/fork/harness/子调用、损坏/manual拒绝、0700/0600、原子写与并发均保持；仅实际standardVersion随新规范合理更新 | AC-TA-VALIDATION、AC-TA-BOUNDARY |
| TC-MODE-001/002、TC-STRUCT-001 | 原授权/模式/共用工程结构规则不变；新增官方知识工作/分享不得绕过模式、角色和输出范围 | AC-TA-BOUNDARY、AC-TA-VALIDATION |
| TC-CI-001、TC-DOC-001、TC-REG-001 | 原可信基线、候选削弱失败、两侧导航、旧根重新引入识别及回归保持；增加第三源、参考资料和runtime输入，去固定CLI版本常量 | AC-TA-VALIDATION、AC-TA-SOURCE、AC-TA-RUNTIME、AC-TA-SKILLS |
| 原固定0.24.0默认入口/允许版本 | 开发测试基线可保留固定版本作为安装输入；生产默认和显式入口都须来自可验证的私有准备安装，旧裸node_modules入口明确拒绝；核验来源/内置包/真实输出，不接受任意版本盲跑 | AC-TA-RUNTIME、AC-TA-SKILLS |
| 原独立4处源码链接转换 | 四处既有链接保护保留；新增自有CLI路由及guide相对链接独立期望。不得为统一引用改八份上游包原字节 | AC-TA-SKILLS |
| 原6组仓外补充 | index冲突/HEAD不符、特殊文件/祖先软链、session并发选择/切换、真实EACCES、入口短写/EIO和并发私有组装保护保持；仅数量/入口身份/路径fixture适配 | AC-TA-SOURCE、AC-TA-SKILLS、AC-TA-RUNTIME、AC-TA-VALIDATION |

原62组中仍有效行为不删除、不降级；因需求取消的七包/schema3/固定CLI常量按本矩阵替代，并在作者报告逐项解释。组数可以随合理参数化调整，不以凑数量或保留失效断言为目标。现有Node/Python受限安装/离线/人工降级和governance四动作全部保留。

## 实施前接口事实与执行顺序

已确认的技术接口纳入以上Oracle：

- `npm run prepare:teamai -- --source PATH --data-home ABS [--offline]`，`upgrade:teamai`同参；source默认cwd，data-home默认绝对XDG_DATA_HOME或隔离HOME下`.local/share`，专属namespace为`collaborative-foundation-infra/teamai/`。测试覆盖省略参数、显式数据根、相对根拒绝与offline首次缺失/已有复用/显式upgrade行为；离线无可验证候选时应拒绝，不能暗中联网。
- sync的`--data-home`与`--teamai-entry`都解析到有效私有准备安装；无来源回执的裸node_modules入口不再可信。旧调用方/测试fixture必须改走准备流程，文档说明收紧与取得entry方式。
- 运行时安装receipt schema1核验包身份、entry相对路径、文件清单摘要、package-lock/内置包摘要、兼容证据及installationId；current仅绑定installationId与receipt摘要。分别篡改两层绑定，拒绝伪装完成/外部入口；分发schema4的teamaiPackage记录实际身份。
- 测试可调用`prepareTeamai(options,{runNpm})`、`resolveTeamaiRuntime(options)`及`verifyTeamaiInstallation`。只有npm进程边界可注入registry/安装故障；身份、SRI、文件校验和真实pull不跳过。单元测试无需真实网络，至少一次真实包准备/分发及单列live latest事实记录仍独立完成。

生产冻结交接仅需补充实际文件位置/错误接口、npm进程协议和官方参考分发路径/相对链接转换规则；不需要再次决定上述行为。改变用户行为或权限须回到Spec/计划审核，单纯参数落点不新增Task。

1. 本计划独立TEST_REVIEW；与Spec4所涉来源/分发/运行时接口一起核对。生产和tests写入串行，Reviewer只读；无子角色派生。
2. 实现者冻结源/上游/构建身份后Tester先核对保护与公开接口，按最小调整实施来源/运行时/分发测试；需生产修复或hook回交Planner，不自行改。
3. 先执行只读来源、路径与内置包拒绝，再准备一次实际npm CLI并记录实际版本/完整性/真实兼容输出；随后跑受控失败/并发和三harness真实分发、旧保护回归。actual latest若不兼容必须如实记失败/阻断及保旧，不能改源包配合。
4. 固定包含测试的新完整隔离候选；执行`npm run prepare:skills`、按已核验当前runtime的准备/复用检查、`npm run build`、原`npm test`、`npm run check`、适用Skill结构/导航校验与`git diff --check`。默认完整套件不依赖每次live latest；live准备与故障fixture单独记录，确保重跑可复现。
5. 最后对照源文件/固定SHA/产物/真实CLI及安装回执、主仓对应范围和受保护资源，封存schema1新TEST_REPORT与测试作者报告交Planner/Reviewer。独立审核针对完整候选；不把本地工作区或旧结果称作正式Git门禁。

## 退出、失败与未运行项

本地PASS必须满足全部必需映射Oracle、新固定SHA及可恢复证据，无阻断缺陷；至少一个真实CLI完整准备与三harness真实pull证明实际分发。Mock成功不能代替这一条。原子切换与故障保旧可使用明确合成版本/registry边界，但必须与真实已测试npm版本结论分开。当前live latest若因网络/来源不完整无法验证，对应切片BLOCKED；若确有兼容差异并正确拒绝，可证明拒绝行为PASS，但不能把当前latest成功安装或整个所需成功闭环写PASS，交Planner说明可用版本和范围决定。

实际行为违反必需Oracle为FAIL；必需可信条件缺失为BLOCKED。失败证据不可抹去，是否接受残余风险交Planner/Reviewer，Tester不自行豁免。原生宿主加载/真实模型/角色调用、实际知识库生成/团队分享发布、远端CI、其他OS与主仓正式G5–G10没有执行就not_run；其未运行不由静态文本、资源存在或CLI记录替代。真实全局namespace权限问题保持原样，不纳入本轮隔离成功声明。

## Change Log

| revision | 时间 | 作者 | 类型 | 对象 | 原因 |
|---|---|---|---|---|---|
| 1 | 2026-09-17T06:22:00Z | ric_devflow_tester | BEHAVIORAL | 全部六项 AC；TC-SRC-001 至 TC-REG-001 | 首次独立送审，包含新基线、来源迁移、会话身份与持久化、模式和结构协议及既有回归 |
| 2 | 2026-09-17T06:27:38.716439+00:00 | ric_devflow_tester | TECHNICAL | Spec v2；TC-DIST-004 至 TC-DIST-006 | 明确可选项目入口追加接口与整体预检保护，其余 AC 和基线不变 |
| 3 | 2026-09-17T08:54:40.840343+00:00 | ric_devflow_tester | BEHAVIORAL | 直接来源、只读prepare、临时组装、源码/安装双侧链接 | 按用户修正取消源码六副本；替代旧导出机制Oracle，保留其他保护，已绑定Spec3，待独立TEST_REVIEW |
| 4 | 2026-09-17T12:17:36.342069+00:00 | ric_devflow_tester | BEHAVIORAL | Spec4全部五项AC；新增TC-TA-*；保留原28追踪ID与有效62组/6补充保护 | 三源/十包/官方指南、latest准备与升级、内置覆盖和调用边界；生产前基线已重跑，待独立TEST_REVIEW |
