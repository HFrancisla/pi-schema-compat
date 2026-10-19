# pi-schema-compat

[English](README.md) | [简体中文](README.zh-CN.md)

A small [Pi](https://github.com/earendil-works/pi) extension that fixes `Invalid schema for function '...': null is not of type "array"` errors from some strict OpenAI-compatible gateways.

## What It Does

- Uses Pi's `before_provider_request` hook to normalize Chat Completions tool schemas before HTTP requests are sent.
- Adds `"required": []` to JSON Schema object nodes missing a valid `required` array, including nested schemas.
- Preserves existing required fields without replacing tools, changing conversations, or logging prompt data.
- Leaves other request formats and unrelated gateway incompatibilities untouched.

## Install

Requires Pi >=1.2.0:

```bash
pi install npm:@hfrancisla/pi-schema-compat
```

Restart Pi or run `/reload`. The patch then applies automatically to compatible requests.

## Usage

Run `/schema-compat` in Pi to view process-local counters for requests, tools, and normalized schema objects. The extension does not record request bodies or credentials.

## Development

```bash
npm run verify       # Syntax check and tests
npm pack --dry-run   # Inspect publish contents
```

There is no build step or runtime dependency. See [VALIDATION.md](VALIDATION.md) for the local mock-gateway verification report.

## Release

Version: **0.1.0**.

```bash
npm publish --access public
```

MIT License. See [LICENSE](LICENSE).
