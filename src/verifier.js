import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, '..');

const SUPERPOWERS_START = '# --- SUPERPOWERS:START ---';
const SUPERPOWERS_PRINCIPLE_FINGERPRINT = 'Mental Model Execution';
const ACTIVATION_STEP_FINGERPRINT = 'Read .claude/instructions.md';

const TARGET_SKILLS = ['bmad-agent-dev', 'bmad-agent-architect', 'bmad-agent-pm'];
const SUPERPOWERS_SKILLS = ['superpowers-quality-architect', 'superpowers-sdet'];
const ROLE_FILES = ['developer.md', 'quality-architect.md', 'qa-engineer.md', 'sdet.md', 'orchestrator.md'];

// Non-execution agents — planning/design/docs phase, intentionally not superpowered
const INTENTIONALLY_SKIPPED_SKILLS = [
  'bmad-agent-analyst',
  'bmad-agent-tech-writer',
  'bmad-agent-ux-designer',
];

let errors = 0;
let warnings = 0;

function pass(msg) { console.log(`  ✅ ${msg}`); }
function warn(msg) { console.log(`  ⚠️  ${msg}`); warnings++; }
function fail(msg) { console.log(`  ❌ ${msg}`); errors++; }
function skip(msg) { console.log(`  ⏭️  ${msg}`); }
function section(msg) { console.log(`\n[${msg}]`); }

export async function verify(targetDir) {
  console.log('🔍 Verifying superpowers installation...');

  const bmadDir = path.join(targetDir, '_bmad');
  const skillsDir = path.join(targetDir, '.claude', 'skills');
  const customDir = path.join(targetDir, '_bmad', 'custom');
  const claudeDir = path.join(targetDir, '.claude');

  // Detect mode
  const isBmadV6 = detectBmadV6(bmadDir, skillsDir);
  if (!isBmadV6) {
    console.log('\n⚠️  BMAD v6 not detected — verify only supports BMAD v6 mode currently.');
    console.log('    Expected: _bmad/ dir AND .claude/skills/bmad-agent-*/SKILL.md');
    process.exit(1);
  }
  console.log('\n✅ BMAD v6 detected');

  // Layer 1: file existence
  section('Layer 1: File checks');
  const installedSkills = checkLayer1Files(customDir, skillsDir, claudeDir);

  // Layer 2: marker checks
  section('Layer 2: Superpowers markers');
  checkLayer2Markers(customDir, installedSkills);

  // Layer 3: resolver deep check
  section('Layer 3: Resolver ground-truth check');
  checkLayer3Resolver(targetDir, skillsDir, installedSkills);

  // Layer 4: coverage scan for new BMAD skills
  section('Layer 4: Coverage scan');
  checkLayer4Coverage(skillsDir, customDir);

  // Summary
  console.log(`\nSummary: ${errors} error(s), ${warnings} warning(s)`);
  if (errors > 0) {
    console.log('Run `npx @tongsitat/superpowers` to reinstall superpowers.');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('Run `npx @tongsitat/superpowers` to cover missing skills.');
  } else {
    console.log('\n🎉 All superpowers checks passed!');
  }
}

function detectBmadV6(bmadDir, skillsDir) {
  if (!fs.existsSync(bmadDir) || !fs.existsSync(skillsDir)) return false;
  return TARGET_SKILLS.some(skill =>
    fs.existsSync(path.join(skillsDir, skill, 'SKILL.md'))
  );
}

function checkLayer1Files(customDir, skillsDir, claudeDir) {
  const installedSkills = [];

  for (const skill of TARGET_SKILLS) {
    const skillInstalled = fs.existsSync(path.join(skillsDir, skill, 'SKILL.md'));
    if (!skillInstalled) {
      skip(`${skill} not installed in BMAD`);
      continue;
    }
    const tomlPath = path.join(customDir, `${skill}.toml`);
    if (fs.existsSync(tomlPath)) {
      pass(`_bmad/custom/${skill}.toml`);
      installedSkills.push(skill);
    } else {
      fail(`_bmad/custom/${skill}.toml — missing (superpowers not installed for this skill)`);
    }
  }

  for (const sp of SUPERPOWERS_SKILLS) {
    const skillPath = path.join(skillsDir, sp, 'SKILL.md');
    if (fs.existsSync(skillPath)) {
      pass(`.claude/skills/${sp}/`);
    } else {
      fail(`.claude/skills/${sp}/ — missing`);
    }
  }

  const instructionsPath = path.join(claudeDir, 'instructions.md');
  if (fs.existsSync(instructionsPath)) {
    pass('.claude/instructions.md');
  } else {
    fail('.claude/instructions.md — missing');
  }

  const rolesDir = path.join(claudeDir, 'roles');
  const presentRoles = ROLE_FILES.filter(r => fs.existsSync(path.join(rolesDir, r)));
  if (presentRoles.length === ROLE_FILES.length) {
    pass(`.claude/roles/ (${presentRoles.length} files)`);
  } else {
    const missing = ROLE_FILES.filter(r => !presentRoles.includes(r));
    fail(`.claude/roles/ — missing: ${missing.join(', ')}`);
  }

  return installedSkills;
}

function checkLayer2Markers(customDir, installedSkills) {
  for (const skill of installedSkills) {
    const tomlPath = path.join(customDir, `${skill}.toml`);
    const content = fs.readFileSync(tomlPath, 'utf8');
    if (content.includes(SUPERPOWERS_START)) {
      pass(`${skill}.toml has marker`);
    } else {
      fail(`${skill}.toml — SUPERPOWERS marker missing (file may have been overwritten)`);
    }
  }
}

function checkLayer3Resolver(targetDir, skillsDir, installedSkills) {
  const resolverScript = path.join(targetDir, '_bmad', 'scripts', 'resolve_customization.py');

  if (!fs.existsSync(resolverScript)) {
    warn('resolve_customization.py not found — BMAD may have restructured its scripts/. Skipping deep check.');
    warn('Manually confirm principles merge correctly after any BMAD update.');
    return;
  }

  for (const skill of installedSkills) {
    const skillPath = path.join(skillsDir, skill);
    try {
      const output = execSync(
        `python3 "${resolverScript}" --skill "${skillPath}"`,
        { encoding: 'utf8', timeout: 10000 }
      );
      const resolved = JSON.parse(output);
      const agentSection = resolved.agent || resolved;

      const principles = agentSection.principles || [];
      const activationSteps = agentSection.activation_steps_prepend || [];

      // Activation step is injected into every skill — use it as primary indicator
      const hasActivationStep = activationSteps.some(s =>
        typeof s === 'string' && s.includes(ACTIVATION_STEP_FINGERPRINT)
      );

      // Count principles that look like superpowers content (any of our known phrases)
      const SUPERPOWERS_PHRASES = [
        'Mental Model Execution',
        'No code without approval',
        'No git commands',
        'No Task/Agent',
        'Validate, don\'t assume',
        'Independent quality enforcer',
        'Blunt and direct communication',
        'Evidence-based criticism',
        'Mental execution traces',
        'Coding guidelines are non-negotiable',
      ];
      const superPrincipleCount = principles.filter(p =>
        typeof p === 'string' && SUPERPOWERS_PHRASES.some(phrase => p.includes(phrase))
      ).length;

      if (hasActivationStep) {
        pass(`${skill}: activation step active + ${superPrincipleCount} superpowers principle(s) in resolved output`);
      } else if (superPrincipleCount > 0) {
        warn(`${skill}: principles present but activation_steps_prepend missing from resolved output`);
      } else {
        fail(`${skill}: superpowers not found in resolved output — BMAD schema may have changed or principles key renamed`);
      }
    } catch (err) {
      if (err.message.includes('JSON')) {
        warn(`${skill}: resolver returned unexpected output — BMAD resolver API may have changed`);
      } else {
        warn(`${skill}: resolver failed (${err.message.split('\n')[0]})`);
      }
    }
  }
}

function checkLayer4Coverage(skillsDir, customDir) {
  let allEntries;
  try {
    allEntries = fs.readdirSync(skillsDir);
  } catch {
    warn('Could not read .claude/skills/ directory');
    return;
  }

  const bmadAgentSkills = allEntries.filter(name =>
    name.startsWith('bmad-agent-') &&
    fs.existsSync(path.join(skillsDir, name, 'SKILL.md'))
  );

  // Only warn about execution-phase skills not in our target list or the intentional skip list
  const unknownUncovered = bmadAgentSkills.filter(skill =>
    !TARGET_SKILLS.includes(skill) &&
    !INTENTIONALLY_SKIPPED_SKILLS.includes(skill) &&
    !fs.existsSync(path.join(customDir, `${skill}.toml`))
  );

  const skippedCount = bmadAgentSkills.filter(s => INTENTIONALLY_SKIPPED_SKILLS.includes(s)).length;
  pass(`Execution agents covered (${skippedCount} non-execution agent(s) intentionally skipped)`);

  if (unknownUncovered.length > 0) {
    warn(`Unknown new BMAD execution skills detected: ${unknownUncovered.join(', ')}`);
    console.log(`     These may be new execution-phase agents. Review and add to installer if appropriate.`);
  }
}
