import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { injectIntoBmad, injectIntoMarkdown, injectViaBmadCustom } from './bmad-injector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, '..');

const SUPERPOWERS_MARKER = '# --- SUPERPOWERS:START ---';

export async function install(targetDir) {
  console.log('🔍 Detecting environment...\n');

  const bmadV6Path = detectBMAD_v6(targetDir);
  const bmadPath = detectBmad(targetDir);
  const claudePath = detectClaudeCode(targetDir);

  if (bmadV6Path) {
    console.log(`✅ BMAD v6 (Claude Code) detected at: ${bmadV6Path}\n`);
    await installBMAD_v6(targetDir, bmadV6Path);
  } else if (bmadPath) {
    console.log(`✅ BMAD detected at: ${bmadPath}\n`);
    await installBmadMode(targetDir, bmadPath);
  } else if (claudePath) {
    console.log(`✅ Claude Code detected at: ${claudePath}\n`);
    await installStandaloneMode(targetDir, claudePath);
  } else {
    console.log('⚠️  No BMAD or Claude Code setup found.');
    console.log('📦 Installing standalone mode with new .claude/ folder...\n');
    await installStandaloneMode(targetDir, path.join(targetDir, '.claude'));
  }
}

function detectBMAD_v6(targetDir) {
  const bmadDir = path.join(targetDir, '_bmad');
  const skillsDir = path.join(targetDir, '.claude', 'skills');

  if (!fs.existsSync(bmadDir) || !fs.existsSync(skillsDir)) return null;

  const bmadAgentSkills = ['bmad-agent-dev', 'bmad-agent-architect', 'bmad-agent-pm'];
  const hasAnySkill = bmadAgentSkills.some(skill =>
    fs.existsSync(path.join(skillsDir, skill, 'SKILL.md'))
  );

  return hasAnySkill ? skillsDir : null;
}

function detectBmad(targetDir) {
  const possiblePaths = [
    path.join(targetDir, 'src', 'bmm', 'agents'),
    path.join(targetDir, '_bmad', 'bmm', 'agents'),
    path.join(targetDir, '.bmad', 'agents'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

function detectClaudeCode(targetDir) {
  const possiblePaths = [
    path.join(targetDir, '.claude'),
    path.join(targetDir, 'CLAUDE.md'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p.endsWith('.md') ? path.dirname(p) : p;
    }
  }
  return null;
}

async function installBMAD_v6(targetDir, skillsDir) {
  console.log('📦 Injecting superpowers into BMAD v6 agents via _bmad/custom/...\n');

  const patchesDir = path.join(PACKAGE_ROOT, 'src', 'patches');
  const customDir = path.join(targetDir, '_bmad', 'custom');

  const skillMappings = [
    { skill: 'bmad-agent-dev', patch: 'dev.principles.md' },
    { skill: 'bmad-agent-architect', patch: 'architect.principles.md' },
    { skill: 'bmad-agent-pm', patch: 'sm.principles.md' },
  ];

  const activationSteps = ['Read .claude/instructions.md before starting any task.'];

  for (const { skill, patch } of skillMappings) {
    const skillDir = path.join(skillsDir, skill);
    const patchFile = path.join(patchesDir, patch);

    if (!fs.existsSync(path.join(skillDir, 'SKILL.md'))) {
      console.log(`  ⏭️  ${skill} not installed, skipping`);
      continue;
    }

    if (!fs.existsSync(patchFile)) {
      console.log(`  ⚠️  patch file ${patch} not found, skipping`);
      continue;
    }

    const patchContent = fs.readFileSync(patchFile, 'utf8');
    const principleLines = patchContent
      .split('\n')
      .filter(line => line.trim().startsWith('-'));

    const result = injectViaBmadCustom(customDir, skill, principleLines, activationSteps);
    if (result.injected) {
      console.log(`  ✅ ${skill} (${result.description})`);
    } else if (result.skipped) {
      console.log(`  ⏭️  ${skill} (already has superpowers)`);
    }
  }

  // Copy new superpowers skill dirs into .claude/skills/
  const bmadSkillsDir = path.join(PACKAGE_ROOT, 'src', 'bmad-skills');
  if (!fs.existsSync(bmadSkillsDir)) {
    console.log(`  ⚠️  src/bmad-skills/ not found in package — skipping extra skill installation`);
  } else {
    const newSkills = fs.readdirSync(bmadSkillsDir);
    for (const skillName of newSkills) {
      const src = path.join(bmadSkillsDir, skillName);
      const dest = path.join(skillsDir, skillName);
      if (fs.statSync(src).isDirectory()) {
        if (!fs.existsSync(dest)) {
          copyDirSync(src, dest);
          console.log(`  ✅ Added: .claude/skills/${skillName}/`);
        } else {
          console.log(`  ⏭️  .claude/skills/${skillName}/ already exists`);
        }
      }
    }
  }

  // Install guardrails and roles
  const claudeDir = path.join(targetDir, '.claude');
  await installGuardrails(claudeDir);
  await installRoles(claudeDir);
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function installBmadMode(targetDir, bmadAgentsPath) {
  console.log('📦 Injecting superpowers into BMAD agents...\n');

  const patchesDir = path.join(PACKAGE_ROOT, 'src', 'patches');
  const additionsDir = path.join(PACKAGE_ROOT, 'bmad-additions');

  // Inject patches into existing agents (supports both .yaml and .md formats)
  const patchMappings = [
    { patch: 'dev.principles.md', targets: ['dev.agent.yaml', 'dev.md'] },
    { patch: 'architect.principles.md', targets: ['architect.agent.yaml', 'architect.md'] },
    { patch: 'sm.principles.md', targets: ['sm.agent.yaml', 'sm.md'] },
  ];

  for (const { patch, targets } of patchMappings) {
    const patchFile = path.join(patchesDir, patch);
    let injected = false;

    for (const target of targets) {
      const targetFile = path.join(bmadAgentsPath, target);

      if (fs.existsSync(targetFile) && fs.existsSync(patchFile)) {
        const isYaml = target.endsWith('.yaml') || target.endsWith('.yml');
        const result = isYaml
          ? await injectIntoBmad(targetFile, patchFile)
          : await injectIntoMarkdown(targetFile, patchFile);

        if (result.injected) {
          console.log(`  ✅ ${target} (${result.description})`);
          injected = true;
          break;
        } else if (result.skipped) {
          console.log(`  ⏭️  ${target} (already has superpowers)`);
          injected = true;
          break;
        }
      }
    }

    if (!injected) {
      console.log(`  ⚠️  ${targets.join(' or ')} not found, skipping`);
    }
  }

  // Add new agents
  const newAgents = ['quality-architect.agent.yaml', 'sdet.agent.yaml'];
  for (const agent of newAgents) {
    const src = path.join(additionsDir, agent);
    const dest = path.join(bmadAgentsPath, agent);

    if (fs.existsSync(src)) {
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
        console.log(`  ✅ Added: ${agent} (NEW)`);
      } else {
        console.log(`  ⏭️  ${agent} already exists`);
      }
    }
  }

  // Also install guardrails to .claude if it exists or create it
  const claudeDir = path.join(targetDir, '.claude');
  await installGuardrails(claudeDir);
}

async function installStandaloneMode(targetDir, claudePath) {
  console.log('📦 Installing standalone superpowers...\n');

  const standaloneDir = path.join(PACKAGE_ROOT, 'standalone');

  // Ensure .claude directory exists
  if (!fs.existsSync(claudePath)) {
    fs.mkdirSync(claudePath, { recursive: true });
  }

  // Copy instructions.md
  await installGuardrails(claudePath);

  // Copy roles
  await installRoles(claudePath);

  // Install project-context.md template (standalone only — BMAD projects use BMAD's generated artifact)
  const contextSrc = path.join(PACKAGE_ROOT, 'standalone', 'project-context.md');
  const contextDest = path.join(claudePath, 'project-context.md');
  if (fs.existsSync(contextSrc) && !fs.existsSync(contextDest)) {
    fs.copyFileSync(contextSrc, contextDest);
    console.log(`  ✅ .claude/project-context.md (template — fill in your project details)`);
  } else if (fs.existsSync(contextDest)) {
    console.log(`  ⏭️  project-context.md already exists`);
  }

  // Create CLAUDE.md if it doesn't exist
  const claudeMdPath = path.join(targetDir, 'CLAUDE.md');
  if (!fs.existsSync(claudeMdPath)) {
    const claudeMdContent = `# Project Instructions

**IMPORTANT: At the start of every session, read:**

[.claude/instructions.md](.claude/instructions.md) - Session startup and role detection

After reading, confirm to the user that you have read the instructions.
`;
    fs.writeFileSync(claudeMdPath, claudeMdContent);
    console.log(`  ✅ CLAUDE.md`);
  }
}

async function installRoles(claudePath) {
  const rolesSourceDir = path.join(PACKAGE_ROOT, 'standalone', 'roles');
  const rolesTargetDir = path.join(claudePath, 'roles');

  if (!fs.existsSync(rolesTargetDir)) {
    fs.mkdirSync(rolesTargetDir, { recursive: true });
  }

  const roles = [
    'developer.md',
    'quality-architect.md',
    'qa-engineer.md',
    'sdet.md',
    'orchestrator.md',
  ];

  for (const role of roles) {
    const src = path.join(rolesSourceDir, role);
    const dest = path.join(rolesTargetDir, role);

    if (fs.existsSync(src)) {
      if (!fs.existsSync(dest) || !isSuperpowersInstalled(dest)) {
        fs.copyFileSync(src, dest);
        console.log(`  ✅ .claude/roles/${role}`);
      } else {
        console.log(`  ⏭️  roles/${role} already exists`);
      }
    }
  }
}

async function installGuardrails(claudePath) {
  if (!fs.existsSync(claudePath)) {
    fs.mkdirSync(claudePath, { recursive: true });
  }

  const src = path.join(PACKAGE_ROOT, 'standalone', 'instructions.md');
  const dest = path.join(claudePath, 'instructions.md');

  if (fs.existsSync(src)) {
    if (!fs.existsSync(dest) || !isSuperpowersInstalled(dest)) {
      fs.copyFileSync(src, dest);
      console.log(`  ✅ .claude/instructions.md (guardrails)`);
    } else {
      console.log(`  ⏭️  instructions.md already has superpowers`);
    }
  }

}

function isSuperpowersInstalled(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes(SUPERPOWERS_MARKER) || content.includes('SUPERPOWERS');
}
