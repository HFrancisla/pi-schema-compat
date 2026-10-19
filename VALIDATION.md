# Validation — Pi 1.2.0 (2026-10-14)

Environment: Pi `@earendil-works/pi-coding-agent` 1.2.0 on the user's WSL, working directory `/home/hzf/workspace`. All provider calls below used a **loopback HTTP mock** configured through a temporary independent `PI_CODING_AGENT_DIR`; no user API credentials or Pi settings were read or modified.

## Unit tests

`npm test` — 6 passed, 0 failed.

## Real Pi CLI + strict OpenAI-compatible mock gateway

| Case | Without extension | With pi-schema-compat |
| --- | --- | --- |
| `--no-extensions --tools ls` | HTTP 400 (`required` absent) | Success (`required: []` sent) |
| `--no-extensions --tools read` | Success | Success (existing `required: ["path"]` preserved) |
| Full set of 13 accessible user-listed extensions, 26 tool definitions | HTTP 400 (`subagent`) | Success (all 26 tool schemas passed recursive `required` validation) |

Other relevant findings from the earlier full audit:

- 13 extension packages loaded successfully in isolation and simultaneously using `-e`; the 14th configured local browser path was not present in this workspace.
- Before normalization, eight tools had a missing top-level `required`: `subagent`, `bg_wait`, `ls`, `lens_diagnostics`, `effective_config`, `project_report`, `web_search`, `fetch_content`.
- `contact_supervisor` had a nested object with missing `required` (as did `subagent`), which is why the patch is recursive.
- A test using a local gateway intentionally rejecting every missing `required` array reproduced the same class of 400 as the user's public gateway logs.

## Limitations

This confirms the extension intercepts outgoing request bodies and fixes the **specific missing `required` arrays** in real Pi 1.2.0. It does **not** confirm that the upstream public DeepSeek endpoint will accept every request, nor does it validate actual subagent execution or web search behavior. The gateway may reject other JSON Schema keywords or vary by backend. The local diagnostic mock only tests request validation and streaming a short answer.

## npm release artifact validation (2026-10-14)

- The package is configured as `@hfrancisla/pi-schema-compat@0.1.0`, MIT, `publishConfig.access=public`, with a lightweight plain-JS Pi extension entry point.
- `npm run verify`: 6 unit tests passed, JS syntax check passed.
- `npm pack --dry-run`: package validated, no application files outside the publish whitelist.
- Extracted the `.tgz` and loaded its `package` folder into **real Pi 1.2.0**, against an isolated local gateway rejecting every object schema without `required`:
  - `ls` only: 200 success, missing-required count 0.
  - all other 13 available extensions + tarball: 200 success, 26 tools, missing-required count 0.
- `npm publish --access public`: attempted from the AgentDock service account, blocked with `ENEEDAUTH` (no npm login for that account). Package has **not** been published to npm. The `hzf` user must run the publish command with their own npm identity.
