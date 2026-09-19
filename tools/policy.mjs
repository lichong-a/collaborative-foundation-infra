import fs from 'node:fs';
import { relativeName, under } from './repository.mjs';

const fields = new Set(['schemaVersion','documentRoots','entrypoints','metadataRoots','exclude','allowedTopLevel','protectedPaths','pathRules','debt','indexEntries','pendingFile','linkRepairs','workflow']);
const base = { documentRoots: ['docs'], entrypoints: ['README.md'], metadataRoots: ['docs'], exclude: [], allowedTopLevel: [], protectedPaths: [], pathRules: [], debt: [], indexEntries: [], pendingFile: 'docs/pending-classification.md', linkRepairs: [], workflow: { authority: 'none', references: [] } };
export function validatePolicy(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || input.schemaVersion !== 1) throw new Error('policy.schemaVersion must equal 1');
  for (const key of Object.keys(input)) if (!fields.has(key)) throw new Error(`Unknown policy field: ${key}`);
  const policy = { ...base, ...input };
  for (const key of ['documentRoots','entrypoints','metadataRoots','exclude','allowedTopLevel','protectedPaths']) {
    if (!Array.isArray(policy[key])) throw new Error(`${key} must be an array`);
    for (const item of policy[key]) relativeName(item, ['documentRoots','metadataRoots','exclude'].includes(key));
  }
  relativeName(policy.pendingFile);
  if (!policy.pendingFile.endsWith('.md') || policy.pendingFile.split('/').includes('AGENTS.md')) throw new Error('pendingFile must be an ordinary Markdown file');
  if (!Array.isArray(policy.debt) || policy.debt.some(item => typeof item !== 'string' || !/^[a-f0-9]{64}$/.test(item))) throw new Error('debt must contain exact finding fingerprints');
  for (const key of ['indexEntries','linkRepairs','pathRules']) if (!Array.isArray(policy[key])) throw new Error(`${key} must be an array`);
  for (const rule of policy.pathRules) {
    relativeName(rule.prefix);
    if (!Array.isArray(rule.allowedExtensions) || rule.allowedExtensions.some(ext => typeof ext !== 'string' || !/^\.[a-zA-Z0-9]+$/.test(ext))) throw new Error('pathRules requires allowedExtensions');
  }
  for (const entry of policy.indexEntries) {
    relativeName(entry.index); relativeName(entry.target);
    if (!entry.index.endsWith('.md') || typeof entry.label !== 'string' || !entry.label.trim() || /[\r\n]/.test(entry.label)) throw new Error('Invalid index entry');
  }
  for (const repair of policy.linkRepairs) {
    relativeName(repair.source);
    if (!repair.source.endsWith('.md') || typeof repair.oldTarget !== 'string' || !repair.oldTarget || typeof repair.newTarget !== 'string' || !repair.newTarget || /[\r\n]/.test(repair.oldTarget + repair.newTarget)) throw new Error('Invalid link repair');
  }
  if (!policy.workflow || !['none','devflow','existing'].includes(policy.workflow.authority) || !Array.isArray(policy.workflow.references)) throw new Error('workflow requires authority and references');
  policy.workflow.references.forEach(item => relativeName(item));
  return policy;
}
export function loadPolicy(file) {
  if (!file) throw new Error('--policy is required');
  return validatePolicy(JSON.parse(fs.readFileSync(file, 'utf8')));
}
export function protectedPath(name, policy) {
  const parts = name.split('/');
  return parts.some(part => ['.git','.devflow','node_modules','.venv','.worktree','.worktrees'].includes(part)) || policy.protectedPaths.some(prefix => under(name, prefix));
}
export function assertWritable(name, policy) {
  relativeName(name);
  if (protectedPath(name, policy)) throw new Error(`Protected path refused: ${name}`);
  if (name.split('/').some(part => ['AGENTS.md','AGENTS.override.md','CLAUDE.md'].includes(part))) throw new Error(`Instruction file cannot be automatically rewritten: ${name}`);
}
