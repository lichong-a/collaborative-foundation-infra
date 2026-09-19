# Spec4 技术接口补充

此页细化已批准行为，不改变AUTH-005范围与Spec4验收。

- `npm run prepare:teamai -- --source PATH --data-home ABS [--offline]`；`upgrade:teamai` 同参。source默认cwd；data-home为XDG_DATA_HOME根，默认环境值或用户`.local/share`。相对根拒绝。
- 私有namespace为`<data-home>/collaborative-foundation-infra/teamai/`。运行时安装记录与真实会话namespace隔离。先独占锁，再新候选，全部身份、SRI、字节与三harness真实分发兼容检查成功后原子切换current；失败保留旧值。
- sync新增`--data-home`，保留`--teamai-entry`。显式entry也必须来自已准备且可验证的私有安装；无来源回执的裸node_modules或伪入口拒绝。文档需说明收紧与prepare后取得entry的方式。
- prepare已有完整安装不联网；自有规范变更时允许对当前来源重新执行离线兼容检查，不因旧兼容记录的distributionDigest不同而自动获取latest。旧安装记录中的证据绑定保持原义，不把它当新规范的通过证明。
- 运行时安装receipt schema1记录包身份、entry相对路径、文件清单摘要、package-lock与内置包摘要、兼容证据及installationId；current只绑定installationId和receipt摘要。分发receipt schema4新增teamaiPackage实际身份，保留其他来源、制品、入口与执行层级字段。
- 可测试模块边界：prepareTeamai(options,{runNpm})、resolveTeamaiRuntime(options)、verifyTeamaiInstallation。只有npm进程可注入故障，校验与真实pull不设跳过开关；正式验收采用真实npm包和CLI，fixtures结果明确标注。
- npm运行的HOME、user/globalconfig、cache均限本次私有目录；禁用安装scripts/audit/fund/bin-links，不读取或改写真实用户npm配置和缓存。未知、损坏、软链及并发状态保留报错，不通过修权限或删除他人文件恢复。
