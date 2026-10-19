# pi-schema-compat

[English](README.md) | [简体中文](README.zh-CN.md)

一个轻量的 [Pi](https://github.com/earendil-works/pi) 扩展，修复部分严格校验的 OpenAI-compatible 网关返回的 `Invalid schema for function '...': null is not of type "array"` 错误。

## 功能

- 通过 Pi 的 `before_provider_request` 钩子，在 HTTP 请求发送前规范化 Chat Completions 工具 Schema。
- 对缺少合法 `required` 数组的 JSON Schema 对象（含嵌套对象）补充 `"required": []`。
- 保留原本的必填字段，不重注册工具、不修改对话内容，也不记录提示词。
- 不处理其他请求格式或无关的网关兼容性问题。

## 安装

要求 Pi >=1.2.0：

```bash
pi install npm:@hfrancisla/pi-schema-compat
```

重启 Pi 或执行 `/reload`，兼容请求会自动应用修复。

## 使用

执行 `/schema-compat` 查看当前进程中处理的请求数、工具数和规范化 Schema 对象数。不会保存请求体或 API 凭证。

## 开发

```bash
npm run verify       # JS 语法检查 + 测试
npm pack --dry-run   # 检查发布内容
```

无构建步骤或运行时依赖；本地模拟网关验证记录见 [VALIDATION.md](VALIDATION.md)。

## 发布

版本：**0.1.0**。

```bash
npm publish --access public
```

MIT 协议，详见 [LICENSE](LICENSE)。
