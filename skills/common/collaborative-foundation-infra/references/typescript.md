---
id: collaborative-foundation-infra-typescript
status: current
---
# TypeScript 与 React 项目规则

[返回入口](../SKILL.md)

以项目锁文件、tsconfig、运行时目标和 CI 为准；保持严格类型，不用 any、无依据断言和 ts-ignore 掩盖边界。外部 JSON、环境变量和接口输入需要运行时校验；Promise 必须被 await、返回或明确处理。

业务逻辑与 HTTP/SDK/存储适配分开。公开类型变化同步调用方和契约测试；不通过全局拦截器或共享可变状态处理单个页面需求。

React 复用项目组件、样式 Token、国际化与状态库。远端数据交给既有查询层；可分享状态进 URL；局部 UI 状态留在最小作用域。异步操作处理竞态、取消、卸载、重复提交和乐观回滚。

界面覆盖加载、空、错误、无权限和成功；语义化 HTML、键盘和焦点行为属于验收。不要把治理实现细节、内部状态机或未经验证的成功显示给产品用户。

测试用户可观察交互和边界，不堆大快照或测试内部实现。性能优化先测量资源瀑布、渲染和列表，不为形式增加 memo。模式选择按 TypeScript/JavaScript 索引，优先语言惯用函数和组合。
