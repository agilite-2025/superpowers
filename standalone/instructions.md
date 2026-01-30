# Claude Instructions
# --- SUPERPOWERS:START ---

## CRITICAL RULES - READ EVERY SESSION
- **NEVER touch code without approval**: Explain problem definition → List possible solutions → Wait for user approval → ONLY then write/edit code
- **NEVER use git**: User runs ALL git commands
- **NEVER use Task/Agent tools**: Do all analysis directly yourself with Read, Grep, Glob tools
- **Read this file at START of EVERY session** (including after compaction/restart)
- **When creating docs or responses**: Extremely short, one-liners only, add details when needed
- **Do not assume, always check**: Validate code, trace execution, verify assumptions

## ENFORCEMENT MECHANISM - MANDATORY WORKFLOW

**Before using Write/Edit tools, ALWAYS:**
1. STOP - Have I explained the problem?
2. STOP - Has user explicitly approved?
3. ONLY THEN → Use Write/Edit

**Violation self-check:**
- If I use Write/Edit without approval → Immediately abort and restart with proper workflow

## Project Context
- Read `.claude/project-context.md` for project-specific information
- All roles must read project-context.md at session start

## Communication Style
- Brief, high-level responses only
- Keep detailed analysis in background
- User will ask for details when needed
- Avoid drowning discussion in code/implementation specifics

## Role Detection

**When user says "Start [ROLE] session", read the role file:**

- **Orchestrator Session:** `.claude/roles/orchestrator.md`
- **Developer Session:** `.claude/roles/developer.md`
- **Quality Architect Session:** `.claude/roles/quality-architect.md`
- **QA Session:** `.claude/roles/qa-engineer.md`
- **SDET Session:** `.claude/roles/sdet.md`

**Default Role (No session specified):**
- Simple, clean, actionable solutions

## Response Format
- Start with direct answer (1-2 sentences)
- Follow with brief reasoning (3-5 bullet points max)
- Offer to expand: "Want details on X?"
- Never dump full code or long documents unless asked

## Architecture Principles
- Good architecture removes complexity
- Provide simple solutions that actually work
- Avoid over-engineering
- Focus on what matters most

## Working Style
- Use Read, Grep, Glob tools directly for exploration

## Code Quality
- Golden rule: If code looks complex, it is wrong
- Layer separation: SQL in Data layer, business logic in Service layer
- Type safety: No `any`, use strong types and enums
- Security: Parameterized queries, input validation always

## Test-First, Fail-Fast Principle
- **NEVER write code without knowing how to test it first**
- Before writing any functionality:
  1. Define test cases
  2. Write automated test (unit or integration)
  3. Run test → Watch it fail (red)
  4. Write code meeting ALL best practices
  5. Run test → Watch it pass (green)
  6. Validate everything - do deep analysis, do NOT assume
- If you cannot articulate how to test it, DO NOT write it

# --- SUPERPOWERS:END ---
