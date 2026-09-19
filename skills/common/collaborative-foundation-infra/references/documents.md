---
id: collaborative-foundation-infra-documents
status: current
---
# 渐进式文档与真实性

[返回入口](../SKILL.md)

导航采用项目入口 → 分类入口 → 专题 → 证据。每份新增正式文档必须有一个可达入口；专题链接到相关需求、设计、计划、实现依据和验收记录，避免同一事实复制多份。

普通受管理文档使用 YAML frontmatter：id 是稳定字符串，status 为 current、proposal、plan、historical 之一。current 是有当前实现/运行证据的事实；proposal 是未批准或未落地设计；plan 描述待执行工作；historical 保存旧事实与替代入口。检查器只能检查结构，真实性由作者和独立审核结合证据判断。

外部导入 Skills、DevFlow 产物和已明确豁免的历史分区保留原格式；在 policy.exclude 中登记范围及在画像中说明原因，禁止为通过检查扩大豁免。普通历史文档可使用 historical 状态，不等于自动免检。

旧债务按实际 finding fingerprint 逐条登记。修复后删除对应债务记录由审核决定；新增违规不得被模糊路径或数量基线掩盖。

索引跨树链接（例如 docs 到 changes）与中文/空格路径同样属于真实依赖。移动/合并文件需要入链和出链影响分析、人工逐项确认及回归测试；v1 工具不移动文件。

自动动作只有补明确索引、登记待分类、按明确映射修失效链接。待分类清单只表示可找到，不宣称语义归属已判定。AGENTS 正文和文档真实性状态不自动改写。
