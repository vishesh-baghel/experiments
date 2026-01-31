# Worklog CLI Usage Guide

## Installation

The worklog CLI is part of the experiments monorepo. Build it from the package directory:

```bash
cd packages/worklog
pnpm build
```

The `worklog` binary is available after build via the `bin` field in `package.json` (`dist/cli.js`).

---

## Setup

### Environment Variables

Create a `.env` file in the worklog package directory:

```env
# Required
MEMORY_API_URL=https://memory.yourdomain.com
MEMORY_API_KEY=mem_xxxxxxxxxxxx
AI_GATEWAY_API_KEY=your-ai-gateway-key

# Optional
WORKLOG_ENRICHMENT_MODEL=anthropic/claude-3-5-haiku-latest   # default
WORKLOG_BLOCKED_PROJECTS=work-project-1,work-project-2
WORKLOG_BLOCKED_PATHS=/home/user/work,/opt/internal
WORKLOG_ALLOWED_PROJECTS=portfolio,experiments                # default
WORKLOG_BLOCKED_DOMAINS=internal.company.com,jira.company.com
```

Configuration loads from the `.env` file in the package directory (not CWD). Missing required variables cause an immediate error with a message naming the missing variable.

---

## Commands

### `worklog ingest`

Processes a Claude Code session and publishes it to Memory.

```bash
worklog ingest --project <absolute-path> [--session <id>] [--source <source>]
```

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--project` | Yes | — | Absolute path to the project directory |
| `--session` | No | latest | Specific session ID to process |
| `--source` | No | `claude-code` | Agent source (only `claude-code` supported) |

**Examples:**

```bash
# Ingest the latest session from a project
worklog ingest --project /home/vishesh/Documents/workspace/portfolio

# Ingest a specific session (supports prefix matching)
worklog ingest --project /home/vishesh/Documents/workspace/portfolio --session 69b5d588

# Or use the full UUID
worklog ingest --project /home/vishesh/Documents/workspace/portfolio --session 69b5d588-22ec-417f-9bba-cccadc06a1c5

# Explicit source (same as default)
worklog ingest --source claude-code --project /home/vishesh/Documents/workspace/portfolio
```

**What happens:**

1. Reads session transcript from `~/.claude/projects/{project}/`
2. Normalizes conversation (strips tool calls, keeps text only)
3. Sanitizes (redacts secrets, filters blocked content)
4. Calls LLM to judge significance and extract structured fields
5. Publishes to Memory API

**Output:**

```
[worklog] Ingesting session from: /home/vishesh/Documents/workspace/portfolio
[worklog] Session: abc123def456
[worklog] Summary: Added two-tier ISR caching to worklog page
[worklog] Messages: 7
[worklog] Date: 2025-01-22
[worklog] Processing...
[worklog] Published to Memory
[worklog] Significant: true
[worklog] Entry: Added two-tier ISR caching to worklog page
```

Sessions that don't meet the significance threshold still get context stored in Memory, but `metadata.public` is set to `false` (not shown on the portfolio).

---

### `worklog list-projects`

Lists all projects that have Claude Code sessions.

```bash
worklog list-projects
```

No flags. Scans `~/.claude/projects/` and outputs project paths:

```
Available projects:
  /home/vishesh/Documents/workspace/portfolio
  /home/vishesh/Documents/workspace/experiments
```

---

### `worklog list-sessions`

Lists recent sessions for a project.

```bash
worklog list-sessions --project <absolute-path> [--limit <n>]
```

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--project` | Yes | — | Absolute path to the project directory |
| `--limit` | No | `10` | Number of sessions to show |

**Example:**

```bash
worklog list-sessions --project /home/vishesh/Documents/workspace/portfolio --limit 5
```

**Output:**

```
Recent sessions for: /home/vishesh/Documents/workspace/portfolio

  abc123de  2025-01-22  7 msgs  Added two-tier ISR caching to worklog page
  def45678  2025-01-21  12 msgs Fixed authentication redirect issue
  ghi90123  2025-01-21  5 msgs  Updated TypeScript config
```

Sidechain and subagent sessions (`agent-*`) are excluded from the list.

---

## Automated Usage

### Claude Code SessionEnd Hook

The recommended way to run worklog is as a hook that fires after every Claude Code session:

```json
{
  "hooks": {
    "SessionEnd": [{
      "command": "worklog ingest --source claude-code --project $PROJECT"
    }]
  }
}
```

This automatically ingests the latest session from whatever project the session ran in. No manual invocation needed.

---

## Session Eligibility

Not all sessions are processed. The CLI applies these filters:

| Filter | Rule |
|--------|------|
| Minimum messages | Session must have 5+ messages in the index |
| Sidechain | Sessions with `isSidechain: true` are skipped |
| Subagent | Sessions with IDs starting with `agent-` are skipped |
| Allowed projects | Project must be in `WORKLOG_ALLOWED_PROJECTS` |
| Minimum turns | 3+ turns after normalization, 2+ after sanitization |

Sessions that fail these checks exit silently (code 0) with a skip reason.

---

## Sanitization Rules

Before any content reaches the LLM or Memory, rule-based sanitization runs:

- **Secrets**: API keys, tokens (`sk_*`, `ghp_*`, Bearer tokens, JWTs) are redacted
- **Internal URLs**: localhost, private IPs (`10.*`, `192.168.*`, `172.16-31.*`) are removed
- **IP addresses**: All `x.x.x.x` patterns are removed
- **Blocked content**: Turns containing blocked project names, paths, or domains are dropped entirely

---

## Significance Criteria

The LLM judges whether a session deserves a public entry:

**Included (public=true):**
- Architectural decisions were made
- Non-trivial feature implemented
- Meaningful bug solved
- Design trade-off evaluated
- Novel learning applied

**Excluded (public=false, context still stored):**
- Fewer than 3 meaningful actions
- Only trivial work (typos, formatting, single-line changes)
- Purely exploratory with no concrete outcome
- Abandoned or very short

---

## Published Entry Format

Each session creates one document in Memory at `/worklog/{YYYY-MM-DD}/{session-id}`:

```
metadata:
  source: "claude-code"
  sessionId: "abc123def456"
  project: "portfolio"
  date: "2025-01-22"
  public: true | false
  summary: "Implemented two-tier ISR caching"         # null if not significant
  decision: "Used 5min TTL for today, 1hr for past…"  # null if not significant
  problem: "Worklog page hitting Memory API on every…" # null if not significant
  entryTags: "performance,frontend"
  links: '{"pr":"123"}' | ""

content: (full markdown context document with prompts, decisions, insights)
tags: ["worklog", "portfolio", "performance", "frontend"]
```

---

## Error Reference

| Error | Cause | Exit Code |
|-------|-------|-----------|
| `Missing required environment variable: X` | `.env` missing a required key | 1 |
| `--project is required` | `ingest` called without `--project` | 1 |
| `required option '--project <path>' not specified` | `list-sessions` called without `--project` (enforced by Commander) | 1 |
| `Unsupported source: X` | Source other than `claude-code` | 1 |
| `No eligible session found` | No sessions match filters, `--session` ID not found, or prefix matches multiple sessions | 1 |
| `No sessions found for project: <path>` | `--project` path has no Claude Code sessions | 1 |
| `Skipped: Too few turns after normalization` | Session too short after stripping tool calls | 0 |
| `Skipped: Filtered by sanitization rules` | All content removed by sanitization | 0 |
| `Enrichment failed: X` | LLM call failed | 0 |
| `Publish failed: X` | Memory API returned non-2xx | 0 |

### Known Issues

_No known issues at this time._

### Resolved Issues

- ~~Invalid project paths crash with a raw stack trace~~ — Now returns a clean error message: `No sessions found for project: <path>`.
- ~~`--session` requires the full UUID~~ — Now supports prefix matching (e.g., first 8 chars from `list-sessions` output). Ambiguous prefixes matching multiple sessions return "No eligible session found".

---

## Typical Workflow

```bash
# 1. See what projects are available
worklog list-projects

# 2. Check recent sessions for a project
worklog list-sessions --project /home/vishesh/Documents/workspace/portfolio

# 3. Ingest the latest session
worklog ingest --project /home/vishesh/Documents/workspace/portfolio

# 4. Or re-process a specific older session (prefix or full UUID)
worklog ingest --project /home/vishesh/Documents/workspace/portfolio --session 69b5d588
```

For day-to-day use, the SessionEnd hook handles everything automatically. Manual commands are for debugging or re-processing.
