# pi-schema-compat

[English](README.md) | [简体中文](README.zh-CN.md)

修复 Pi 在部分严格校验的 OpenAI-compatible API 公益站上遇到的 `Invalid schema for function '...': null is not of type "array"` 错误。

## 问题来源

按照 JSON Schema 规范，若对象没有必填属性，完全可以省略 `required` 字段。Pi 自带的 `ls`、`pi-subagents` 的 `subagent` / `bg_wait`，以及部分 `pi-web-access`、`pi-lens` 工具都会生成这种合法 Schema。

但部分 OpenAI-compatible 网关要求每个对象 Schema 都显式带有数组形式的 `required`，缺失时会错误地按 `null` 校验，最终返回 400。由于工具定义通常随请求一起发送，即使模型还没开始调用工具，也可能报错。

## 安装

要求 **Pi 1.2.0 或更新版本**。npm 包发布后，运行：

```bash
pi install npm:@hfrancisla/pi-schema-compat
```

重启 Pi 或执行 `/reload`。无需替换原有的子代理、浏览器或 UI 插件。

本地单次测试可运行：

```bash
pi --no-extensions --extension ./index.js --tools ls -p "你好"
```

`--no-extensions` 不会禁用 `--extension` 显式加载的插件。

## 原理

使用 Pi 1.2.0 原生 `before_provider_request` 事件，在发送 HTTP 之前取得转换后的请求体，只处理 Chat Completions 的 `tools[].function.parameters`。

若 JSON Schema 对象没有合法的 `required` 数组，则补上 `"required": []`；若原本存在 `"required": ["path"]` 等必填字段，则完整保留。递归覆盖 `properties`、`items`、`anyOf` / `oneOf` / `allOf`、`$defs` 等嵌套 Schema。

该扩展不会注册/覆盖原有工具、改变必填参数语义，或修改对话内容与工具实际执行。处理过程不修改原始请求对象，重复处理也不会产生额外变更。

## 诊断

在交互模式执行 `/schema-compat`，查看当前进程中已处理的请求数、工具数与 Schema 对象数。插件不会记录提示词、HTTP 请求体或 API 密钥。

## 开发与发布

```bash
npm run verify
npm pack --dry-run
npm publish --access public
```

使用 MIT 协议，无运行时依赖，无须构建。发布需要对 `@hfrancisla` npm 命名空间拥有权限并完成账号认证。

## 范围和限制

仅修复缺失 `required` 数组的问题，不保证解决公益站的限流、网关路由不一致或其他不支持的 JSON Schema 字段。插件不启用 OpenAI strict mode，也不会把可选参数全部强制改为必填。
