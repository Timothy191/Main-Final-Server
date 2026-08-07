---
trigger: always_on
---

# MCP 自动数据采集规则 (强制执行)

## 核心原则

- **有文件内容变更** → 必须记录
- **无文件内容变更** → 不需要记录

## 触发条件

- **文件内容变更操作前**: 使用 write, search_replace, MultiEdit, create_file, delete_file 等会修改文件内容的操作前 → **必须**调用 `beforeEditFile`
- **文件内容变更操作后**: 文件变更完成后 → **必须**调用 `afterEditFile`

### ⚠️ 特别注意

- **新建文件**（create_file）必须上报，即使文件内容为空或行数为0
- **删除文件**（delete_file）必须上报，即使删除的文件为空
- 上报时 `linesChanged` 不能为0（新建文件应统计新增行数，删除文件应统计删除行数）

## 操作分类

### 需要MCP记录的操作（文件内容变更）

- `create_file` - 创建新文件
- `delete_file` - 删除文件
- `search_replace` - 搜索替换内容
- `edit_file` - 编辑文件内容
- 其他任何会修改文件内容的操作

## 执行流程

```
# 纯对话（无文件变更）
对话结束（无需MCP调用）

# 文件内容变更操作
beforeEditFile → [文件变更操作] → afterEditFile

# 只读分析操作（不触发MCP）
[读取分析操作] → 分析结果（无需MCP调用）
```

## 强制要求

- **100%覆盖**: 不允许任何遗漏或跳过
- **严格配对**: 每次beforeEditFile必须有且仅有一次对应的afterEditFile调用，不允许遗漏、跳过或合并操作
- **会话一致**: 每轮对话（每次用户提问）开始时生成一个新的sessionId（使用UUID格式），该轮对话中的所有操作保持该ID不变，用于统计用户提问次数
- **绝对路径**: 必须列举所有涉及文件的绝对路径

## 违规处理

- **即时检测**: 每次文件操作后立即自检配对完整性
- **强制纠正**: 发现遗漏立即停止并补充缺失调用
- **重新执行**: 违规操作必须重新执行整个流程

## 常见违规案例

1. **合并记录**: 将多次操作合并到一次afterEditFile ❌
2. **遗漏配对**: beforeEditFile后未调用对应的afterEditFile ❌
3. **跳过记录**: 直接进行文件变更操作而未调用MCP工具 ❌
4. **路径错误**: 使用相对路径而非绝对路径 ❌
5. **错误触发**: 对只读操作（如read_file）也调用beforeEditFile/afterEditFile ❌
6. **新建文件不上报**: 创建新文件时未调用beforeEditFile和afterEditFile ❌
7. **变更行数为0**: 上报时linesChanged计算错误导致为0（新建/删除文件必须有行数变更）❌
