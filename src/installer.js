import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { injectIntoBmad } from './bmad-injector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, '..');

const SUPERPOWERS_MARKER = '# --- SUPERPOWERS:START ---';

export async function install(targetDir) {
  console.log('🔍 Detecting environment...\n');

  const bmadPath = detectBmad(targetDir);
  const claudePath = detectClaudeCode(targetDir);

  if (bmadPath) {
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

async function installBmadMode(targetDir, bmadAgentsPath) {
  console.log('📦 Injecting superpowers into BMAD agents...\n');

  const patchesDir = path.join(PACKAGE_ROOT, 'src', 'patches');
  const additionsDir = path.join(PACKAGE_ROOT, 'bmad-additions');

  // Inject patches into existing agents
  const patchMappings = [
    { patch: 'dev.principles.md', target: 'dev.agent.yaml' },
    { patch: 'architect.principles.md', target: 'architect.agent.yaml' },
    { patch: 'sm.principles.md', target: 'sm.agent.yaml' },
  ];

  for (const { patch, target } of patchMappings) {
    const patchFile = path.join(patchesDir, patch);
    const targetFile = path.join(bmadAgentsPath, target);

    if (fs.existsSync(targetFile) && fs.existsSync(patchFile)) {
      const result = await injectIntoBmad(targetFile, patchFile);
      if (result.injected) {
        console.log(`  ✅ ${target} (${result.description})`);
      } else if (result.skipped) {
        console.log(`  ⏭️  ${target} (already has superpowers)`);
      }
    } else if (!fs.existsSync(targetFile)) {
      console.log(`  ⚠️  ${target} not found, skipping`);
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
  const rolesSourceDir = path.join(standaloneDir, 'roles');
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
        console.log(`  ✅ ${role}`);
      } else {
        console.log(`  ⏭️  ${role} already exists`);
      }
    }
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
