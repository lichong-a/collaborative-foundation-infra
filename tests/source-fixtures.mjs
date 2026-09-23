import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { ROOT, fixture, git, write, hash, snapshot } from './helpers.mjs';

export const ownSkill = 'collaborative-foundation-infra';
export const ownSkills = [ownSkill, 'teamai-cli'];
export const navigation = {
  'SKILL.md': ['ric-devflow', '../../upstreams/ric-devflow/skills/ric-devflow/SKILL.md', '../ric-devflow/SKILL.md'],
  'references/session.md': ['ric-devflow', '../../../upstreams/ric-devflow/skills/ric-devflow/SKILL.md', '../../ric-devflow/SKILL.md'],
  'references/adoption.md': ['ric-devflow', '../../../upstreams/ric-devflow/skills/ric-devflow/SKILL.md', '../../ric-devflow/SKILL.md'],
  'references/design.md': ['ric-design-patterns-skill', '../../../upstreams/ric-design-patterns/SKILL.md', '../../ric-design-patterns-skill/SKILL.md']
};
export function skillSource(source, name) {
  if (ownSkills.includes(name)) return path.join(source, 'skills/common', name);
  const pkg = JSON.parse(fs.readFileSync(path.join(source, 'sources.lock.json'))).packages.find(p => p.name === name);
  assert(pkg, name); return path.join(source, pkg.path);
}
export function expectedSkillBytes(source, name, file) {
  if (name === 'teamai-cli' && file === 'references/usage-guide.zh-CN.md') return expectedGuide(source);
  if (name === 'teamai-cli' && file === 'LICENSE') return fs.readFileSync(path.join(source, 'skills/upstreams/teamai-cli/LICENSE'));
  const bytes = fs.readFileSync(path.join(skillSource(source, name), file));
  if (name === 'teamai-cli' && file === 'SKILL.md') {
    let text = bytes.toString();
    for (const [from, to] of [['docs/usage-guide.zh-CN.md', 'references/usage-guide.zh-CN.md'], ['LICENSE', 'LICENSE'], ['skills/teamai/SKILL.md', '../teamai/SKILL.md'], ['skills/team-wiki-codebase/SKILL.md', '../team-wiki-codebase/SKILL.md'], ['skills/teamai-share-learnings/SKILL.md', '../teamai-share-learnings/SKILL.md']]) {
      const target = `](../../upstreams/teamai-cli/${from})`;
      assert.equal(text.split(target).length, 2); text = text.replace(target, `](${to})`);
    }
    return Buffer.from(text);
  }
  if (name !== ownSkill || !navigation[file]) return bytes;
  const [label, from, to] = navigation[file]; const exact = `[${label}](${from})`; const original = bytes.toString('utf8');
  assert.equal(original.split(exact).length, 2, `fixture requires one reviewed navigation: ${file}`);
  return Buffer.from(original.replace(exact, `[${label}](${to})`));
}
export function expectedGuide(source) {
  const lock = JSON.parse(fs.readFileSync(path.join(source, 'sources.lock.json'))), u = lock.upstreams.find(x => x.id === 'teamai-cli');
  let text = fs.readFileSync(path.join(source, u.path, 'docs/usage-guide.zh-CN.md'), 'utf8');
  const targets = [
    ['#项目级project-scope', '#项目级project-scope默认'],
    ['usage-guide.md', `${u.url}/blob/${u.commit}/docs/usage-guide.md`],
    ['usage-guide.zh-CN.md', `${u.url}/blob/${u.commit}/docs/usage-guide.zh-CN.md`],
    ['providers.md#gitlab-provider含自托管', `${u.url}/blob/${u.commit}/docs/providers.md#${encodeURIComponent('gitlab-provider含自托管')}`]
  ];
  for (const [from, to] of targets) { const exact = `](${from})`; assert.equal(text.split(exact).length, 2, from); text = text.replace(exact, `](${to})`); }
  return Buffer.from(text);
}
export function expectedSkillSnapshot(source, name) {
  const tree = snapshot(skillSource(source, name));
  if (name === 'teamai-cli') {
    tree.references = { type: 'directory', mode: 0o755 };
    for (const file of ['LICENSE', 'references/usage-guide.zh-CN.md']) tree[file] = { type: 'file', mode: 0o644 };
  }
  return Object.fromEntries(Object.entries(tree).sort(([a], [b]) => a.localeCompare(b)).map(([file, { mode, ...item }]) => [file, {
    ...item, ...(item.type === 'file' ? { sha256: hash(expectedSkillBytes(source, name, file)), executable: Boolean(mode & 0o100) } : {})
  }]));
}
export function noSourceCopies(repo) {
  assert.deepEqual(fs.readdirSync(path.join(repo, 'skills/common')).sort(), [...ownSkills].sort());
  assert.equal(fs.existsSync(path.join(repo, 'upstreams')), false);
  for (const name of ['exports.json', 'prepare.lock', 'prepare-pending.json']) assert.equal(fs.existsSync(path.join(repo, '.collaborative-foundation-infra', name)), false);
}
// Independent fixture packaging, intentionally not the production transformer.
export function stageFixtureTeam(source, target) {
  fs.mkdirSync(target, { recursive: true });
  for (const name of ['teamai.yaml', 'manifest', 'hooks', 'rules']) fs.cpSync(path.join(source, name), path.join(target, name), { recursive: true });
  const names = [...JSON.parse(fs.readFileSync(path.join(source, 'sources.lock.json'))).packages.map(p => p.name), ...ownSkills];
  for (const name of names) for (const [file, item] of Object.entries(expectedSkillSnapshot(source, name))) if (item.type === 'file') {
    const destination = path.join(target, 'skills/common', name, file); write(target, path.relative(target, destination), expectedSkillBytes(source, name, file)); fs.chmodSync(destination, item.executable ? 0o755 : 0o644);
  }
}
export function sourceFixture(t, { real = false } = {}) {
  const f = fixture(t); const lock = JSON.parse(fs.readFileSync(path.join(ROOT, 'sources.lock.json')));
  for (const u of lock.upstreams) {
    const directory = path.join(f.repo, u.path); fs.mkdirSync(path.dirname(directory), { recursive: true });
    const actual = real || u.id === 'teamai-cli';
    if (actual) { git(f.repo, 'clone', '--no-hardlinks', path.join(ROOT, u.path), directory); git(directory, 'remote', 'remove', 'origin'); git(directory, 'config', 'user.name', 'Synthetic upstream'); git(directory, 'config', 'user.email', 'fixture@example.invalid'); git(directory, 'config', 'core.hooksPath', '/dev/null'); }
    else {
      fs.mkdirSync(directory); git(directory, 'init', '-q', '-b', 'main');
      git(directory, 'config', 'user.name', 'Synthetic upstream'); git(directory, 'config', 'user.email', 'fixture@example.invalid'); git(directory, 'config', 'core.hooksPath', '/dev/null');
      for (const pkg of lock.packages.filter(p => p.upstream === u.id)) write(f.repo, `${pkg.path}/SKILL.md`, `---\nname: ${pkg.name}\ndescription: Synthetic isolated package\n---\n# ${pkg.name}\n`);
      if (u.id === 'ric-devflow') { write(directory, 'AGENTS.md', 'Outer instructions must not be exported.\n'); write(directory, '.devflow/record.md', 'Outer state must not be exported.\n'); }
      git(directory, 'add', '--all'); git(directory, 'commit', '-qm', 'Synthetic upstream baseline');
      u.commit = git(directory, 'rev-parse', 'HEAD'); u.url = `https://example.invalid/${u.id}`;
    }
    git(f.repo, 'update-index', '--add', '--cacheinfo', `160000,${u.commit},${u.path}`);
    for (const pkg of lock.packages.filter(p => p.upstream === u.id)) {
      pkg.commit = u.commit; pkg.source = u.url;
      if (!actual) pkg.files = Object.fromEntries(Object.entries(snapshot(path.join(f.repo, pkg.path))).filter(([, item]) => item.type === 'file').map(([name, item]) => [name, { sha256: item.sha256, mode: item.mode & 0o100 ? 0o755 : 0o644 }]));
    }
  }
  write(f.repo, '.gitmodules', lock.upstreams.map(u => `[submodule "${u.id}"]\n\tpath = ${u.path}\n\turl = ${u.url}\n`).join(''));
  write(f.repo, '.gitignore', 'node_modules/\n'); write(f.repo, 'sources.lock.json', JSON.stringify(lock, null, 2) + '\n');
  for (const name of ['teamai.yaml', 'manifest', 'hooks', 'rules', 'package-lock.json']) fs.cpSync(path.join(ROOT, name), path.join(f.repo, name), { recursive: true });
  for (const name of ownSkills) fs.cpSync(path.join(ROOT, 'skills/common', name), path.join(f.repo, 'skills/common', name), { recursive: true });
  f.commit(); noSourceCopies(f.repo); return { ...f, lock };
}
export function advanceSource(f) {
  const u = f.lock.upstreams[0], source = path.join(f.repo, u.path), pkg = f.lock.packages.find(p => p.upstream === u.id);
  write(f.repo, `${pkg.path}/revision.txt`, 'Second reviewed synthetic revision\n');
  git(source, 'add', '--all'); git(source, 'commit', '-qm', 'Synthetic reviewed upgrade'); u.commit = git(source, 'rev-parse', 'HEAD');
  for (const p of f.lock.packages.filter(p => p.upstream === u.id)) p.commit = u.commit;
  pkg.files['revision.txt'] = { sha256: hash('Second reviewed synthetic revision\n'), mode: 0o644 };
  git(f.repo, 'update-index', '--cacheinfo', `160000,${u.commit},${u.path}`); write(f.repo, 'sources.lock.json', JSON.stringify(f.lock, null, 2) + '\n');
  return { source, pkg };
}
