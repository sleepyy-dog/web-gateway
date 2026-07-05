# OpenCLI Routing

Use OpenCLI as an embedded route inside `web-gateway`, not as a separate active skill.

## When to consider OpenCLI

Consider OpenCLI when the user asks to search, read, scrape, download, summarize, inspect comments, inspect feeds, or retrieve logged-in content from a named website that may have a site adapter. Typical examples include Xiaohongshu, Zhihu, WeChat official accounts, Weibo, Bilibili, Douban, YouTube, CNKI, arXiv, Taobao, JD, Xianyu, Xueqiu, and similar platform-style sites.

Do not require exact site-list recall. First infer the likely site and task from the user request, then query the live registry.

## Dynamic registry check

Use the registry as the source of truth:

```powershell
opencli list -f json
```

Relevant fields:

| Field | Use |
|------|-----|
| `site` | Adapter namespace used as `opencli <site> ...` |
| `name` / `command` | Command name and full `site/name` command |
| `aliases` | Alternate names that may match user wording |
| `domain` | Website domain; useful when the user gives a URL |
| `description` | Natural-language match for the requested task |
| `access` | `read` or `write`; writes usually need explicit confirmation |
| `strategy` | `public`, `cookie`, `intercept`, `ui`, or `local` |
| `browser` | Whether OpenCLI browser bridge is required |
| `args` | Required positionals/options |
| `example` | Known-good command shape |

Selection rule:

1. Match by URL domain or obvious site name.
2. Match the requested action to command name/description (`search`, `note`, `comments`, `download`, `hot`, `question`, `answer-detail`, etc.).
3. Prefer `read` commands for information tasks.
4. Use `-f json` by default for agent consumption.
5. Respect command-specific `--limit`; keep smoke and exploratory runs low.

## Running commands

Inspect help before using a new command:

```powershell
opencli <site> --help
opencli <site> <command> --help
```

Run structured output:

```powershell
opencli <site> <command> <args> -f json
```

For known brittle or recently changed adapters, retain trace evidence:

```powershell
opencli <site> <command> <args> -f json --trace retain-on-failure
```

If `strategy` is `cookie`, `intercept`, or `ui`, check the bridge when needed:

```powershell
opencli doctor
```

If the bridge is not connected, report the specific `doctor` issue instead of falling back blindly.

## Fallback rules

Fall back to the normal `web-gateway` flow when:

- No OpenCLI adapter or command matches the task.
- The adapter output lacks the required information.
- The task requires arbitrary DOM eval, internal page functions, or custom extraction not exposed by an adapter.
- The user needs a one-off website flow rather than a supported platform command.
- `opencli` fails and trace evidence suggests fixing the adapter is not worth it for the current request.

When falling back after an OpenCLI failure, mention the failed command and the reason briefly in the final answer.

## Safety

- Keep exploratory limits small.
- Do not use write commands (`access: write`) without explicit user confirmation at action time.
- Preserve full platform URLs when commands require them. For Xiaohongshu details/comments, full URLs with `xsec_token` are more reliable than bare note ids.
