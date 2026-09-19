import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const NODE = process.execPath;
export const GOVERNANCE = path.join(ROOT, 'skills/common/collaborative-foundation-infra/scripts/governance.mjs');
export const hash = value => crypto.createHash('sha256').update(value).digest('hex');
export function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 30000, maxBuffer: 20 * 1024 * 1024, ...options });
  if (result.error) throw result.error;
  return { code: result.status, signal: result.signal, stdout: result.stdout, stderr: result.stderr };
}
export function git(repo, ...args) {
  const result = run('git', ['-C', repo, ...args], { env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', GIT_OPTIONAL_LOCKS: '0' } });
  if (result.code !== 0) throw new Error(`git ${args.join(' ')}: ${result.stderr}`);
  return result.stdout.trim();
}
export function write(root, name, text) {
  const file = path.join(root, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}
export const document = (id, body = '# Title\n', status = 'current') => `---\nid: ${id}\nstatus: ${status}\n---\n${body}`;
export function policy(overrides = {}) {
  return { schemaVersion: 1, documentRoots: ['docs', 'changes'], entrypoints: ['README.md'], metadataRoots: ['docs', 'changes'], allowedTopLevel: [], protectedPaths: [], exclude: [], debt: [], pathRules: [], indexEntries: [], pendingFile: 'docs/pending.md', linkRepairs: [], workflow: { authority: 'none', references: [] }, ...overrides };
}
export function fixture(t, files = {}, settings = {}) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'collaborative-foundation-infra-test-'));
  const repo = path.join(base, 'repo');
  const home = path.join(base, 'user');
  fs.mkdirSync(repo); fs.mkdirSync(home);
  git(repo, 'init', '-q', '-b', 'main');
  git(repo, 'config', 'user.email', 'tester@example.invalid');
  git(repo, 'config', 'user.name', 'collaborative-foundation-infra Test Fixture');
  git(repo, 'config', 'core.hooksPath', '/dev/null');
  for (const [name, content] of Object.entries({ 'README.md': '# Fixture\n', ...files })) write(repo, name, content);
  git(repo, 'add', '--all'); git(repo, 'commit', '-qm', 'Synthetic fixture baseline');
  const policyFile = path.join(base, 'policy.json');
  fs.writeFileSync(policyFile, JSON.stringify(policy(settings)));
  t.diagnostic(`fixture=${base}`);
  if (process.env.COLLABORATIVE_FOUNDATION_INFRA_KEEP_FIXTURES !== '1') t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  return { base, repo, home, policyFile, commit: () => { git(repo, 'add', '--all'); git(repo, 'commit', '-qm', 'Synthetic fixture update'); return git(repo, 'rev-parse', 'HEAD'); } };
}
export function invoke(f, action, extra = []) { return run(NODE, [GOVERNANCE, action, '--repo', f.repo, '--policy', f.policyFile, '--format', 'json', ...extra]); }
export function json(result) { try { return JSON.parse(result.stdout); } catch { throw new Error(`Invalid JSON; exit=${result.code}; stdout=${result.stdout}; stderr=${result.stderr}`); } }
export function snapshot(root, omit = new Set(['.git'])) {
  const out = {};
  function visit(directory, prefix = '') {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (omit.has(entry.name)) continue;
      const name = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = path.join(directory, entry.name); const st = fs.lstatSync(full);
      if (st.isSymbolicLink()) out[name] = { type: 'symlink', target: fs.readlinkSync(full), mode: st.mode & 0o777 };
      else if (st.isDirectory()) { out[name] = { type: 'directory', mode: st.mode & 0o777 }; visit(full, name); }
      else out[name] = { type: 'file', mode: st.mode & 0o777, sha256: hash(fs.readFileSync(full)) };
    }
  }
  visit(root); return out;
}
export function savePlan(f) {
  const result = invoke(f, 'plan'); if (result.code !== 0) throw new Error(result.stdout);
  const name = path.join(f.base, 'plan.json'); fs.writeFileSync(name, result.stdout); return { file: name, plan: json(result) };
}
