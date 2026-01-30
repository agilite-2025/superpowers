import fs from 'fs';
import YAML from 'yaml';

const SUPERPOWERS_START = '# --- SUPERPOWERS:START ---';
const SUPERPOWERS_END = '# --- SUPERPOWERS:END ---';

export async function injectIntoMarkdown(targetMdPath, patchMdPath) {
  const mdContent = fs.readFileSync(targetMdPath, 'utf8');
  const patchContent = fs.readFileSync(patchMdPath, 'utf8');

  // Check if already injected
  if (mdContent.includes(SUPERPOWERS_START)) {
    return { injected: false, skipped: true, description: 'already installed' };
  }

  // Extract description from patch file (first line after #)
  const descriptionMatch = patchContent.match(/^#\s*(.+)$/m);
  const description = descriptionMatch ? descriptionMatch[1].trim() : 'Superpowers';

  // Extract principles from patch (lines starting with -)
  const patchPrinciples = patchContent
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.trim())
    .join('\n');

  // Append superpowers to end of file
  const newContent = `${mdContent.trim()}

---

${SUPERPOWERS_START}
## Superpowers Enhancement

${patchPrinciples}
${SUPERPOWERS_END}
`;

  fs.writeFileSync(targetMdPath, newContent);
  return { injected: true, skipped: false, description };
}

export async function injectIntoBmad(targetYamlPath, patchMdPath) {
  const yamlContent = fs.readFileSync(targetYamlPath, 'utf8');
  const patchContent = fs.readFileSync(patchMdPath, 'utf8');

  // Check if already injected
  if (yamlContent.includes(SUPERPOWERS_START)) {
    return { injected: false, skipped: true, description: 'already installed' };
  }

  // Parse YAML
  const doc = YAML.parseDocument(yamlContent);
  const agent = doc.get('agent');

  if (!agent) {
    return { injected: false, skipped: true, description: 'no agent key found' };
  }

  const persona = agent.get('persona');
  if (!persona) {
    return { injected: false, skipped: true, description: 'no persona key found' };
  }

  // Get existing principles
  let principles = persona.get('principles') || '';

  // Extract description from patch file (first line after #)
  const descriptionMatch = patchContent.match(/^#\s*(.+)$/m);
  const description = descriptionMatch ? descriptionMatch[1].trim() : 'Superpowers';

  // Extract principles from patch (lines starting with -)
  const patchPrinciples = patchContent
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .join('\n');

  // Append superpowers to principles
  const newPrinciples = `${principles.trim()}
${SUPERPOWERS_START}
${patchPrinciples}
${SUPERPOWERS_END}`;

  persona.set('principles', newPrinciples);

  // Write back
  const newYamlContent = doc.toString();
  fs.writeFileSync(targetYamlPath, newYamlContent);

  return { injected: true, skipped: false, description };
}

export function removeSuperpowers(targetYamlPath) {
  const yamlContent = fs.readFileSync(targetYamlPath, 'utf8');

  if (!yamlContent.includes(SUPERPOWERS_START)) {
    return { removed: false, description: 'no superpowers found' };
  }

  // Remove superpowers block using regex
  const regex = new RegExp(
    `\\n?${escapeRegex(SUPERPOWERS_START)}[\\s\\S]*?${escapeRegex(SUPERPOWERS_END)}\\n?`,
    'g'
  );

  const cleanedContent = yamlContent.replace(regex, '');
  fs.writeFileSync(targetYamlPath, cleanedContent);

  return { removed: true, description: 'superpowers removed' };
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
