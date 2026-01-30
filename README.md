# BMAD Superpowers

Superpower enhancements for [BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD) and Claude Code.

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
npx @agilite-2025/superpowers
```

### What Happens

The installer auto-detects your environment:

**If BMAD is installed:**
```
🔍 Detecting environment...
✅ BMAD v6 detected at ./src/bmm/

📦 Injecting superpowers into BMAD agents...
  ✅ dev.agent.yaml (Mental Model Execution)
  ✅ architect.agent.yaml (Quality Architect mode)
  ✅ sm.agent.yaml (Meta-Orchestrator)
  ✅ Added: quality-architect.agent.yaml (NEW)
  ✅ Added: sdet.agent.yaml (NEW)
  ✅ .claude/instructions.md (guardrails)

🎉 Superpowers activated!
```

**If Claude Code only (no BMAD):**
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
  ✅ CLAUDE.md

🎉 Superpowers activated!
```

## Usage

### With BMAD

Your existing BMAD agents are enhanced. Use them normally:
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

Superpowers are marked with comments:
```
# --- SUPERPOWERS:START ---
...
# --- SUPERPOWERS:END ---
```

To remove, delete content between these markers or reinstall BMAD.

## Requirements

- Node.js 18+
- BMAD v6+ (optional - works standalone with Claude Code)

## License

MIT

## Contributing

Issues and PRs welcome at [github.com/agilite-2025/superpowers](https://github.com/agilite-2025/superpowers)
