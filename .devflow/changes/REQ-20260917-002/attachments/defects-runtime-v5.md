# 运行时缺陷复现索引

本页为 Planner 的中性索引；Tester 原始 `defects.json`、执行输出和三个完整现场保存在本轮仓外恢复归档的 `tester/runtime-defect-reproduction/`，不改写原始证据，也不把机器专属临时路径写入共享规范。

- 原始报告 SHA256：`dc13b0bbaa9e020bf5895ffad3ecde7d63d7b7971b0f0938bc19aa5c22e4f188`。
- 冻结生产清单：`f2ea9478629649c2156d55d1a7c12c544d2e3ac63d0e100cc09a08247945740d`，1374文件字节及模式匹配。
- `tests/teamai-fixtures.mjs`：`e8f35d59bdc46306ef306865fc5912f23b8803c5041dbb0384cfffdd4272a405`。
- `tests/teamai-runtime.test.mjs`：`d6eceb6f3e034609f0f887f1e444996ac714dc1a34e4a2cb16f20bad70c2bcba`。
- 诊断结果：3项测试，0通过、3失败、0跳过、0取消；绑定上述工作区冻结身份，未声称主仓旧HEAD为新增测试的受测SHA。

| Tester 缺陷 | 关联审核项 | 真实触发与观察 |
|---|---|---|
| TESTDEF-TA-RUNTIME-001 | PROD-TA-RUNTIME-001 | 实际npm安装与真实三宿主兼容检查后注入work清理EIO；操作报错，但current已指新安装，prepare.lock残留。旧安装字节及模式保持。 |
| TESTDEF-TA-RUNTIME-002 | PROD-TA-RUNTIME-002 | 分别在install与resolve边界改名candidate/work并放入未知哨兵后抛错；两个替换哨兵均被错误删除，改名原目录保持。 |

Planner 分类为实现缺陷，规格与Oracle保持不变。完整旧套件尚未执行，最小失败回归已保留；原实现者获得串行修复窗口，之后交独立Tester继续验证。见[预审原文](review-production-v5.yaml)及[根证据](../evidence.md)。
