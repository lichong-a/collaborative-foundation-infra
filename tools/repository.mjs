import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const OMIT_DIRS = new Set(['.git', 'node_modules', '.venv', '__pycache__', '.cache', '.worktree', '.worktrees']);
export const hash = value => crypto.createHash('sha256').update(value).digest('hex');
export function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
export const digest = value => hash(stable(value));
export const exists = file => { try { fs.lstatSync(file); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } };
export const under = (file, prefix) => prefix === '.' || file === prefix || file.startsWith(`${prefix}/`);

export function relativeName(name, allowRoot = false) {
  if (typeof name !== 'string' || !name || /[\\\0\r\n]/.test(name) || path.isAbsolute(name) || name.includes('%') || name.split('/').some(part => part === '..' || !part)) throw new Error(`Unsafe relative path: ${String(name)}`);
  if (name === '.' && allowRoot) return name;
  if (name.split('/').includes('.')) throw new Error(`Noncanonical path: ${name}`);
  return name;
}
export function repositoryRoot(repo) {
  if (!repo) throw new Error('--repo is required');
  const absolute = path.resolve(repo);
  if (!fs.statSync(absolute).isDirectory()) throw new Error('Repository must be a directory');
  // Reject symlinked roots and ancestors, rather than silently changing identity.
  if (fs.realpathSync(absolute) !== absolute) throw new Error('Repository path contains a symlink');
  return absolute;
}
export function safePath(root, name) {
  relativeName(name);
  let current = root;
  for (const part of name.split('/')) {
    current = path.join(current, part);
    if (exists(current) && fs.lstatSync(current).isSymbolicLink()) throw new Error(`Symlink refused: ${name}`);
  }
  return current;
}
export function inventory(root, { skipDirectories = OMIT_DIRS } = {}) {
  const files = {};
  function visit(directory, prefix = '') {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name, 'en'))) {
      const name = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (!prefix && entry.name === '.git' && skipDirectories.has('.git')) continue;
      const full = path.join(directory, entry.name);
      const stat = fs.lstatSync(full);
      if (entry.isDirectory()) {
        if (!skipDirectories.has(entry.name)) visit(full, name);
      } else if (entry.isSymbolicLink()) files[name] = { type: 'symlink', target: fs.readlinkSync(full), mode: stat.mode & 0o777 };
      else if (entry.isFile()) {
        if (stat.size > 128 * 1024 * 1024) throw new Error(`Snapshot file exceeds 128 MiB: ${name}`);
        files[name] = { type: 'file', hash: hash(fs.readFileSync(full)), mode: stat.mode & 0o777 };
      } else throw new Error(`Unsupported filesystem object: ${name}`);
    }
  }
  visit(root);
  return files;
}
export function git(root, args, optional = false) {
  try { return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8', env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' }, stdio: ['ignore','pipe','pipe'], maxBuffer: 20 * 1024 * 1024 }).trimEnd(); }
  catch (error) { if (optional) return null; throw new Error(`Git failed: ${args.join(' ')}: ${error.stderr?.toString().trim() || error.message}`); }
}
export const head = root => git(root, ['rev-parse', '--verify', 'HEAD'], true);
export function assertCleanTarget(root, name) {
  if (git(root, ['rev-parse', '--is-inside-work-tree'], true) !== 'true') throw new Error('apply requires a Git worktree for dirty-target protection');
  const status = git(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--', name]);
  if (status) throw new Error(`Dirty target refused: ${name}`);
  if (exists(path.join(root, name)) && !git(root, ['ls-files', '--error-unmatch', '--', name], true)) throw new Error(`Untracked or ignored target refused: ${name}`);
}
export function readText(root, name, overrides = new Map()) {
  if (overrides.has(name)) return overrides.get(name);
  const file = safePath(root, name);
  if (!exists(file)) return null;
  const stat = fs.statSync(file);
  if (!stat.isFile() || stat.size > 4 * 1024 * 1024) throw new Error(`Not a bounded text file: ${name}`);
  const bytes = fs.readFileSync(file);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
