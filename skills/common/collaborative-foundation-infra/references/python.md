---
id: collaborative-foundation-infra-python
status: current
---
# Python 项目规则

[返回入口](../SKILL.md)

版本、运行命令和依赖管理服从项目 pyproject.toml、锁文件和 CI。使用项目既有 uv/Poetry 等工具；不混用包管理器，不因治理任务升级解释器或重写依赖。

公共边界使用准确类型，显式处理 None、未知枚举和错误；避免可变默认参数、宽泛 Any 和裸 except。资源使用上下文管理器，文件明确 UTF-8；密码和连接串不进入日志。

async 用于合适的 I/O，阻塞调用通过既有执行边界隔离。测试使用项目既有框架，覆盖异常释放、幂等、权限和外部超时；Mock 外部边界，不把真实业务规则全部替换。

需要选择 GoF 时读取设计模式 Skill 的 Python 索引；优先函数、Protocol、dataclass 和组合，按项目版本决定语法。辅助验证缺少 Python/uv 时先尝试用户目录安装，失败后记录未运行并进入人工协议。
