# BMAD Superpowers

Superpower enhancements for [BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD) and Claude Code.

> Maintained fork of [agilite-2025/superpowers](https://github.com/agilite-2025/superpowers) — extended with BMAD v6.9 compatibility.

## What's Included

### Core Superpowers

| Superpower | Description |
|------------|-------------|
| **Mental Model Execution** | Trace 2-3 scenarios step-by-step before submitting code |
| **Approval Workflow** | No code changes without explicit user approval |
| **Guardrails** | No git, no Task/Agent spawning, brief responses |
| **Quality Architect** | Independent, adversarial code reviewer |
| **SDET Role** | Separates test design (QA) from test automation |
| **Meta-Orchestrator** | Fixes the system, not just symptoms |

### Enhanced Roles

- **Developer** - Mental Model Execution + strict guardrails
- **Quality Architect** - Blunt, evidence-based reviewer (NEW)
- **QA Engineer** - Testing + validation focus
- **SDET** - Test automation engineer (NEW)
- **Orchestrator** - Meta-role that improves role definitions

## Installation

### Quick Install (npx)

```bash
npx @tongsitat/superpowers
```

### Verify Installation

After install (or when a new team member checks out the repo), confirm superpowers are active:

```bash
npx @tongsitat/superpowers verify
```

This checks four layers:
1. TOML override files exist in `_bmad/custom/`
2. SUPERPOWERS markers are present in each file
3. BMAD's resolver confirms principles appear in merged agent output
4. Scans for new `bmad-agent-*` skills that aren't yet covered

Exits 0 if all good (CI-safe). Exits 1 with actionable output if anything is broken or missing.

### What Happens

The installer auto-detects your environment and picks the right mode:

**BMAD v6 + Claude Code** (detected by `_bmad/` dir + `.claude/skills/bmad-agent-*/SKILL.md`):
```
🔍 Detecting environment...
✅ BMAD v6 (Claude Code) detected at: .claude/skills

📦 Injecting superpowers into BMAD v6 agents via _bmad/custom/...
  ✅ bmad-agent-dev (wrote bmad-agent-dev.toml)
  ✅ bmad-agent-architect (wrote bmad-agent-architect.toml)
  ⏭️  bmad-agent-pm not installed, skipping
  ✅ Added: .claude/skills/superpowers-quality-architect/
  ✅ Added: .claude/skills/superpowers-sdet/
  ✅ .claude/instructions.md (guardrails)
  ✅ .claude/roles/developer.md
  ...

🎉 Superpowers activated!
```

Writes non-destructive TOML override files to `_bmad/custom/` — your existing BMAD config is preserved and BMAD updates will never overwrite superpowers.

**Legacy BMAD** (detected by `src/bmm/agents/`, `_bmad/bmm/agents/`, or `.bmad/agents/`):
```
🔍 Detecting environment...
✅ BMAD detected at: ./_bmad/bmm/agents

📦 Injecting superpowers into BMAD agents...
  ✅ dev.agent.yaml (Mental Model Execution)
  ✅ architect.agent.yaml (Quality Architect mode)
  ✅ sm.agent.yaml (Meta-Orchestrator)
  ✅ Added: quality-architect.agent.yaml (NEW)
  ✅ Added: sdet.agent.yaml (NEW)
  ✅ .claude/instructions.md (guardrails)

🎉 Superpowers activated!
```

**Claude Code only (no BMAD):**
```
🔍 Detecting environment...
✅ Claude Code detected

📦 Installing standalone superpowers...
  ✅ .claude/instructions.md
  ✅ .claude/roles/developer.md
  ✅ .claude/roles/quality-architect.md
  ✅ .claude/roles/qa-engineer.md
  ✅ .claude/roles/sdet.md
  ✅ .claude/roles/orchestrator.md
  ✅ .claude/project-context.md (template)
  ✅ CLAUDE.md

🎉 Superpowers activated!
```

## Usage

### With BMAD v6 (Claude Code)

Superpowers are injected via `_bmad/custom/*.toml` override files — BMAD's official customization layer. Your existing config is preserved and survives BMAD updates.

- `bmad-agent-dev` gains Mental Model Execution + approval workflow principles
- `bmad-agent-architect` gains Quality Architect mode principles
- New skills added: `superpowers-quality-architect`, `superpowers-sdet`

### With Legacy BMAD

Your existing agent YAML/MD files are patched directly:
- Developer now requires Mental Model Execution traces
- Architect has Quality Architect mode
- New agents: `quality-architect`, `sdet`

### Standalone (Claude Code)

Start a role session:
```
"Start Developer session"
"Start Quality Architect session"
"Start QA session"
```

Or just use Claude Code normally - guardrails apply automatically.

## Superpowers Explained

### Mental Model Execution

Before submitting code, trace 2-3 scenarios:
```
Scenario: User clicks "Submit"
Step 1: onClick → handleSubmit()
  ✅ Function exists
  ✅ Parameters match
Step 2: API call → POST /api/submit
  ⚠️ Missing error handling for timeout
Step 3: Response → update state
  ✅ State update correct
```

### Approval Workflow

Agents MUST:
1. Explain the problem
2. List possible solutions
3. Wait for explicit approval
4. ONLY THEN write/edit code

### Quality Architect Mode

Blunt, evidence-based reviews:
```
❌ BAD: "There might be a small concern..."
✅ GOOD: "The error handling is broken. Users see blank screens."
```

Every criticism includes:
- Problem summary
- File:line location
- Impact (Financial/User/Operational)
- Priority (CRITICAL/HIGH/MEDIUM/LOW)

## Uninstall

Superpowers are marked with comments in every file they touch:
```
# --- SUPERPOWERS:START ---
...
# --- SUPERPOWERS:END ---
```

- **BMAD v6**: delete `_bmad/custom/bmad-agent-dev.toml` (and similar) and remove `.claude/skills/superpowers-*/`
- **Legacy BMAD / Standalone**: delete the marked block from each patched file

## Requirements

- Node.js 18+
- BMAD v6+ (optional - works standalone with Claude Code)

## License

MIT

## Contributing

Issues and PRs welcome at [github.com/tongsitat/superpowers](https://github.com/tongsitat/superpowers)

## Credits

This project is a maintained fork of [agilite-2025/superpowers](https://github.com/agilite-2025/superpowers) by [@agilite-2025](https://github.com/agilite-2025), extended with BMAD v6.9 compatibility and the `verify` subcommand.
