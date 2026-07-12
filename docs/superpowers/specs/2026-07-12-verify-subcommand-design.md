# Design: verify subcommand + BMAD update detection

Date: 2026-07-12

## Problem

When a second team member checks out the repo after superpowers was installed by the first, they have no way to confirm the injection is still active. BMAD v6.9 is under heavy active development — agent skill schemas, the resolver script, and skill names may change between BMAD updates, silently breaking the injection.

## Goals

- `npx @tongsitat/superpowers verify` — read-only health check, safe to run anytime
- Exit 0 = all good; non-zero = actionable report (CI-friendly)
- Detect four failure classes:
  1. TOML files missing or marker absent
  2. Principles not appearing in resolver output (schema changed, key renamed)
  3. Resolver script gone (BMAD restructured its scripts/)
  4. New uncovered `bmad-agent-*` skills installed since last `install` run

## Non-Goals

- Auto-fix (verify never writes files)
- Legacy BMAD mode verification (YAML/MD injection; separate concern)
- Windsurf/Cursor support (Claude Code only, matching the installer scope)

---

## Architecture

### CLI routing (`bin/cli.js`)

Parse `process.argv[2]`:
- `verify` → import and run `verify(cwd)`
- anything else (or absent) → existing `install(cwd)`

### `src/verifier.js`

Single exported `verify(targetDir)` function. Four sequential layers; later layers only run if earlier ones pass for a given skill.

```
Layer 1 — File existence
  _bmad/custom/{skill}.toml exists          (per installed skill)
  .claude/skills/superpowers-quality-architect/SKILL.md
  .claude/skills/superpowers-sdet/SKILL.md
  .claude/instructions.md
  .claude/roles/ (all 5 role files)

Layer 2 — Marker checks
  Each TOML contains SUPERPOWERS:START marker
  Each role/instructions file contains SUPERPOWERS or known content

Layer 3 — Resolver deep check (when resolve_customization.py available)
  Run: python3 _bmad/scripts/resolve_customization.py --skill .claude/skills/{skill}
  Parse JSON; assert agent.principles contains at least one superpowers principle
  Assert agent.activation_steps_prepend contains our step
  If resolver absent: emit WARNING (not error) — note BMAD may have restructured

Layer 4 — Coverage scan
  List all bmad-agent-* dirs in .claude/skills/
  For each: check _bmad/custom/{skill}.toml exists
  Emit WARNING for any gap — new BMAD skills not covered by superpowers
```

### Output format

```
🔍 Verifying superpowers installation...

✅ BMAD v6 detected

[Layer 1] File checks
  ✅ _bmad/custom/bmad-agent-dev.toml
  ✅ _bmad/custom/bmad-agent-architect.toml
  ⏭️  bmad-agent-pm not installed
  ✅ .claude/skills/superpowers-quality-architect/
  ✅ .claude/skills/superpowers-sdet/
  ✅ .claude/instructions.md
  ✅ .claude/roles/ (5 files)

[Layer 2] Superpowers markers
  ✅ bmad-agent-dev.toml
  ✅ bmad-agent-architect.toml

[Layer 3] Resolver ground-truth check
  ✅ bmad-agent-dev: 4 superpowers principles active
  ✅ bmad-agent-architect: principles active

[Layer 4] Coverage scan
  ⚠️  Uncovered BMAD skills: bmad-agent-ux-designer, bmad-agent-tech-writer
     Run `npx @tongsitat/superpowers` to inject superpowers into these skills.

Summary: 0 error(s), 1 warning(s)
```

### Exit codes

| Code | Meaning |
|------|---------|
| 0 | All checks passed (warnings allowed) |
| 1 | One or more errors (missing files, missing markers, principles absent from resolver output) |

Warnings (uncovered new skills, resolver absent) do not cause non-zero exit — they are advisory.

---

## Fork & package rename

Rename `@agilite-2025/superpowers` → `@tongsitat/superpowers` in:
- `package.json` (name, repository URL, author)
- `README.md` (all install command examples)

The fork lives at `git@github.com-personal:tongsitat/superpowers.git`. Original repo credited in README for attribution.
