import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { ROOT, NODE, fixture, write, run, json, snapshot, hash, git, document, policy } from './helpers.mjs';
import { verifySources } from '../tools/distribution.mjs';
import { prepareSkills } from '../tools/sources.mjs';
import { preparedRuntime, runtimePackage } from './teamai-fixtures.mjs';
import { sourceFixture, skillSource, expectedSkillSnapshot, stageFixtureTeam, noSourceCopies } from './source-fixtures.mjs';

const names = ['ric-devflow', 'ric-devflow-planner', 'ric-devflow-reviewer', 'ric-devflow-tester', 'ric-devflow-implementer', 'ric-design-patterns-skill', 'team-wiki-codebase', 'teamai-share-learnings', 'collaborative-foundation-infra', 'teamai-cli'];
function sync(f, agent = 'codex', apply = false) {
  return run(NODE, [path.join(ROOT, 'scripts/teamai-sync.mjs'), '--repo', f.repo, '--source', ROOT, '--agent', agent, '--user-home', f.home, '--data-home', preparedRuntime().dataHome, '--teamai-entry', preparedRuntime().entry, ...(apply ? ['--apply'] : [])], { timeout: 60000, env: { ...process.env, HOME: f.home, USERPROFILE: f.home, XDG_CONFIG_HOME: path.join(f.home, '.config'), CI: '1' } });
}
function portableSkillSnapshot(directory) {
  return Object.fromEntries(Object.entries(snapshot(directory)).map(([name, { mode, ...item }]) => [name, {
    ...item, ...(item.type === 'file' ? { executable: Boolean(mode & 0o100) } : {})
  }]));
}
function assertDistributed(repo, agent) {
  const folder = agent === 'claude' ? '.claude' : '.agents';
  for (const name of names) assert.deepEqual(portableSkillSnapshot(path.join(repo, folder, 'skills', name)), expectedSkillSnapshot(ROOT, name), `${agent}/${name} portable source identity differs`);
  const receipt = JSON.parse(fs.readFileSync(path.join(repo, '.collaborative-foundation-infra/teamai-installation.json')));
  assert.deepEqual(receipt.skills, names); assert.equal(receipt.agent, agent); assert.equal(receipt.teamai, runtimePackage.version);
  assert.equal(receipt.artifact.sha256, hash(fs.readFileSync(path.join(repo, folder, 'skills/collaborative-foundation-infra/scripts/governance.mjs'))));
  if (agent !== 'zcode') assert.deepEqual(fs.readFileSync(path.join(repo, `.${agent}/rules/collaborative-foundation-infra.md`)), fs.readFileSync(path.join(ROOT, 'rules/collaborative-foundation-infra.md')));
  assert(!fs.existsSync(path.join(repo, '.codex/agents'))); assert(!fs.existsSync(path.join(repo, '.claude/agents'))); assert(!fs.existsSync(path.join(repo, '.zcode/agents')));
}

test('TC-IDENTITY-001: package, dependency metadata, team and discoverable skill share the canonical identity', () => {
  const identity = 'collaborative-foundation-infra';
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json')));
  const lock = JSON.parse(fs.readFileSync(path.join(ROOT, 'package-lock.json')));
  const installedLock = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules/.package-lock.json')));
  const team = YAML.parse(fs.readFileSync(path.join(ROOT, 'teamai.yaml'), 'utf8'));
  const skill = fs.readFileSync(path.join(ROOT, 'skills/common', identity, 'SKILL.md'), 'utf8');
  const metadata = /^---\n([\s\S]*?)\n---\n/.exec(skill); assert(metadata);
  for (const name of [packageJson.name, lock.name, lock.packages[''].name, installedLock.name, team.team, YAML.parse(metadata[1]).name]) assert.equal(name, identity);
  assert.deepEqual(lock.packages[''].dependencies, packageJson.dependencies);
  assert.deepEqual(lock.packages[''].devDependencies, packageJson.devDependencies);
  assert(fs.existsSync(path.join(ROOT, 'rules', `${identity}.md`)));
});

test('TC-SOURCE-001: source lock covers every imported file and only approved pinned packages', () => {
  const lock = JSON.parse(fs.readFileSync(path.join(ROOT, 'sources.lock.json')));
  assert.deepEqual(lock.teamai, { package: 'teamai-cli', selection: 'latest-on-first-prepare-or-explicit-upgrade', registry: 'https://registry.npmjs.org' });
  assert.equal(lock.packages.length, 8); assert.equal(lock.upstreams.length, 3);
  const counts = [];
  for (const pkg of lock.packages) {
    assert.equal(pkg.commit, pkg.upstream === 'teamai-cli' ? '0c059b2da6fe0fa3206ab1ce33978601a2a832e6' : pkg.name === 'ric-design-patterns-skill' ? '46b183615afbfe3b1fffcbc9425ac3aea2c36d99' : '9ce34a0e9e6e06cbda2f6c4d76951248c7d27fcb');
    const tree = snapshot(path.join(ROOT, pkg.path)); const files = Object.fromEntries(Object.entries(tree).filter(([, item]) => item.type === 'file'));
    assert.deepEqual(Object.keys(files).sort(), Object.keys(pkg.files).sort());
    for (const [name, expected] of Object.entries(pkg.files)) { assert.equal(files[name].sha256, expected.sha256); assert.equal(Boolean(files[name].mode & 0o100), Boolean(expected.mode & 0o100)); }
    counts.push(Object.keys(files).length);
  }
  assert.equal(counts.slice(0, 5).reduce((a, b) => a + b), 100); assert.equal(counts[5], 625); assert.equal(counts.slice(6).reduce((a, b) => a + b), 13);
});

test('TC-DISTRIBUTE-001/002: true TeamAI self distribution for all three harnesses, preview and idempotence', t => {
  for (const agent of ['codex', 'zcode', 'claude']) {
    const f = fixture(t); const before = snapshot(f.repo); const home = snapshot(f.home);
    const preview = sync(f, agent); assert.equal(preview.code, 0, preview.stdout); assert.equal(json(preview).status, 'ready'); assert.deepEqual(snapshot(f.repo), before);
    const applied = sync(f, agent, true); assert.equal(applied.code, 0, applied.stdout + applied.stderr); assert.equal(json(applied).status, 'installed');
    assertDistributed(f.repo, agent); assert.equal(json(applied).nativeRoles, 'not-installed'); assert.equal(json(applied).hostLoading, 'not-verified');
    assert.deepEqual(snapshot(f.home), home);
    fs.chmodSync(path.join(f.repo, agent === 'claude' ? '.claude' : '.agents', 'skills/ric-devflow/SKILL.md'), 0o640);
    const installed = snapshot(f.repo); const repeat = sync(f, agent, true); assert.equal(repeat.code, 0, repeat.stdout); assert.equal(json(repeat).status, 'noop'); assert.deepEqual(snapshot(f.repo), installed);
    for (const hook of ['.codex/hooks.json', '.claude/settings.json', '.zcode/cli/config.json']) assert(!fs.existsSync(path.join(f.repo, hook)));
  }
});

test('TC-NAVIGATION-001: actual distributed skill remains navigable after relocation and reports a missing topic', t => {
  const f = fixture(t); const installed = sync(f, 'codex', true);
  assert.equal(installed.code, 0, installed.stdout + installed.stderr);
  const relocated = path.join(f.base, 'relocated bundle', '中文 目录');
  fs.mkdirSync(relocated, { recursive: true });
  fs.renameSync(path.join(f.repo, '.agents/skills'), path.join(relocated, 'skills'));
  const self = 'skills/collaborative-foundation-infra';
  const policyFile = path.join(f.base, 'relocated-policy.json');
  fs.writeFileSync(policyFile, JSON.stringify(policy({ documentRoots: [self], entrypoints: [`${self}/SKILL.md`], metadataRoots: [`${self}/references`] })));
  const check = () => run(NODE, [path.join(relocated, self, 'scripts/governance.mjs'), 'check', '--repo', relocated, '--policy', policyFile, '--format', 'json']);
  const result = check(); assert.equal(result.code, 0, result.stdout + result.stderr);
  const report = json(result); assert.equal(report.status, 'pass'); assert.equal(report.summary.findings, 0);
  assert(report.summary.documents > 10); assert.equal(report.summary.reachable, report.summary.documents);
  assert.equal(fs.existsSync(path.join(f.repo, '.agents/skills')), false);
  fs.unlinkSync(path.join(relocated, self, 'references/adoption.md'));
  const broken = check(); assert.equal(broken.code, 1, broken.stdout);
  assert(json(broken).findings.some(item => item.code === 'BROKEN_LINK' && item.target === 'references/adoption.md'));
});

test('TC-CONFLICT-001: custom source, extra file, legacy/user disables and allowed-agent whitelist are preserved', t => {
  const cases = [
    ['custom-skill', 'repo', '.agents/skills/ric-devflow/SKILL.md', '# My customized skill\n'],
    ['official-custom', 'repo', '.agents/skills/team-wiki-codebase/SKILL.md', '# User wiki method\n'],
    ['official-unknown', 'repo', '.agents/skills/teamai-share-learnings/unknown.txt', 'user bytes\n'],
    ['official-excluded', 'repo', '.teamai/config.yaml', 'excludedSkills: [team-wiki-codebase]\n'],
    ['unknown-file', 'repo', '.agents/skills/ric-devflow/unknown.txt', 'not owned\n'],
    ['excluded', 'repo', '.teamai/config.yaml', 'excludedSkills: [ric-devflow]\n'],
    ['disabled', 'home', '.teamai/config.yaml', 'disabledAgents: [codex]\n'],
    ['whitelist', 'repo', '.teamai/config.yaml', 'enabledAgents: [claude]\n'],
    ['native-disabled', 'home', '.codex/config.toml', '[agents]\nenabled = false\n'],
    ['skill-disabled', 'home', '.codex/config.toml', '[[skills.config]]\npath = "/example/ric-devflow"\nenabled = false\n']
  ];
  for (const [name, base, file, content] of cases) {
    const f = fixture(t); write(f[base], file, content); const repoBefore = snapshot(f.repo); const homeBefore = snapshot(f.home);
    const result = sync(f, 'codex', true); assert.equal(result.code, 2, `${name}: ${result.stdout}`); assert.match(json(result).error, /preserved|disabled/i); assert.deepEqual(snapshot(f.repo), repoBefore); assert.deepEqual(snapshot(f.home), homeBefore);
  }
});

test('TC-CONFLICT-001: 0.24 project partition and shared worktree anchor obey explicit disable', t => {
  const f = fixture(t); const anchor = fs.realpathSync(f.repo);
  const slug = anchor.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') + '-' + hash(anchor).slice(0, 16);
  write(f.home, `.teamai/projects/${slug}/config.yaml`, YAML.stringify({ enabledAgents: ['claude'], excludedSkills: ['ric-devflow'], projectRoot: anchor }));
  const homeBefore = snapshot(f.home); const repoBefore = snapshot(f.repo);
  const direct = sync(f, 'codex', true); assert.equal(direct.code, 2, direct.stdout); assert.match(json(direct).error, /project-partition/);
  const worktree = path.join(f.base, 'linked'); git(f.repo, 'worktree', 'add', '--detach', worktree, 'HEAD');
  const linked = sync({ ...f, repo: worktree }, 'codex', true); assert.equal(linked.code, 2, linked.stdout); assert.match(json(linked).error, /project-partition/);
  assert.deepEqual(snapshot(f.repo), repoBefore); assert.deepEqual(snapshot(f.home), homeBefore);
});

test('TC-SESSION-001: existing SessionStart/pull hooks are reported without mutation', t => {
  for (const base of ['repo', 'home']) {
    const f = fixture(t); write(f[base], '.codex/hooks.json', JSON.stringify({ hooks: { SessionStart: [{ hooks: [{ type: 'command', command: 'teamai pull --force' }] }] } }));
    const beforeRepo = snapshot(f.repo); const beforeHome = snapshot(f.home); const result = sync(f, 'codex', true);
    assert.equal(result.code, 2, result.stdout); assert.match(json(result).error, /automatic hooks/); assert.deepEqual(snapshot(f.repo), beforeRepo); assert.deepEqual(snapshot(f.home), beforeHome);
  }
});

test('TC-DISTRIBUTE-001: real TeamAI Git refresh advances member clone and distributes the new revision', t => {
  const f = fixture(t); const team = path.join(f.base, 'team-author'); fs.mkdirSync(team);
  stageFixtureTeam(ROOT, team); noSourceCopies(ROOT);
  git(team, 'init', '-q', '-b', 'main'); git(team, 'config', 'user.email', 'tester@example.invalid'); git(team, 'config', 'user.name', 'Tester'); git(team, 'config', 'core.hooksPath', '/dev/null'); git(team, 'add', '--all'); git(team, 'commit', '-qm', 'Team baseline');
  const remote = path.join(f.base, 'team.git'); git(f.base, 'clone', '--bare', team, remote);
  const clone = path.join(f.base, 'member-clone'); git(f.base, 'clone', remote, clone); const oldSha = git(clone, 'rev-parse', 'HEAD');
  const config = { repo: { localPath: clone, remote, kind: 'git' }, username: 'isolated-tester', scope: 'user', primaryRole: 'engineering', additionalRoles: [], resourceProfileVersion: 1, updatePolicy: 'skip', recallEnabled: false, contributeHintEnabled: false, inheritUserScope: false, enabledAgents: ['codex'], disabledAgents: ['zcode', 'claude'] };
  write(f.home, '.teamai/config.yaml', YAML.stringify(config)); fs.mkdirSync(path.join(f.home, '.agents/skills'), { recursive: true }); fs.mkdirSync(path.join(f.home, '.codex/rules'), { recursive: true });
  write(team, 'skills/common/collaborative-foundation-infra/references/test-refresh.md', document('test-refresh', '# Deliberate test-only new resource\n'));
  git(team, 'add', '--all'); git(team, 'commit', '-qm', 'Team resource update'); git(team, 'push', remote, 'main'); const expectedSha = git(team, 'rev-parse', 'HEAD'); assert.notEqual(expectedSha, oldSha);
  const environment = { ...process.env, HOME: f.home, USERPROFILE: f.home, XDG_CONFIG_HOME: path.join(f.home, '.config'), CI: '1', TEAMAI_RECALL_DISABLED: '1', TEAMAI_CONTRIBUTE_HINT_DISABLED: '1', TEAMAI_PACKAGE_HINT_DISABLED: '1', TEAMAI_MR_HINT_DISABLED: '1', TEAMAI_DISABLE_REMOTE_CMD: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
  const result = run(NODE, [preparedRuntime().entry, 'pull', '--force'], { cwd: f.repo, env: environment, timeout: 60000 }); assert.equal(result.code, 0, result.stdout + result.stderr);
  assert.equal(git(clone, 'rev-parse', 'HEAD'), expectedSha);
  for (const name of names) assert.deepEqual(snapshot(path.join(f.home, '.agents/skills', name)), snapshot(path.join(clone, 'skills/common', name)), name);
  assert(fs.existsSync(path.join(f.home, '.agents/skills/collaborative-foundation-infra/references/test-refresh.md')));
  assert.equal(git(f.repo, 'status', '--porcelain'), '');
  t.diagnostic(`TeamAI actual Git refresh ${oldSha} -> ${expectedSha}`);
});

test('TC-SOURCE-001/TC-DISTRIBUTE-001: umask 022 Git clone remains distributable while bytes and executable identity remain strict', t => {
  const f = fixture(t); const author = sourceFixture(t, { real: true }).repo;
  const clone = path.join(f.base, 'source-clone');
  const cloned = run('/bin/bash', ['-c', 'umask 022; exec git clone --no-hardlinks -- "$1" "$2"', 'clone-with-umask', author, clone], { env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' } });
  assert.equal(cloned.code, 0, cloned.stderr);
  const sourceLock = JSON.parse(fs.readFileSync(path.join(clone, 'sources.lock.json')));
  for (const upstream of sourceLock.upstreams) {
    const copied = run('/bin/bash', ['-c', 'umask 022; exec git clone --no-hardlinks -- "$1" "$2"', 'upstream-with-umask', path.join(author, upstream.path), path.join(clone, upstream.path)], { env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' } });
    assert.equal(copied.code, 0, copied.stderr);
  }
  assert.equal(prepareSkills(clone).status, 'verified'); noSourceCopies(clone);
  assert.equal(fs.statSync(path.join(skillSource(clone, 'ric-devflow'), 'SKILL.md')).mode & 0o777, 0o644);
  assert.doesNotThrow(() => verifySources(clone));
  const args = [path.join(ROOT, 'scripts/teamai-sync.mjs'), '--repo', f.repo, '--source', clone, '--agent', 'codex', '--user-home', f.home, '--data-home', preparedRuntime().dataHome, '--teamai-entry', preparedRuntime().entry, '--apply'];
  const installed = run(NODE, args, { timeout: 60000, env: { ...process.env, HOME: f.home, USERPROFILE: f.home } }); assert.equal(installed.code, 0, installed.stdout + installed.stderr);
  for (const name of names) {
    const source = expectedSkillSnapshot(clone, name); const target = portableSkillSnapshot(path.join(f.repo, '.agents/skills', name));
    assert.deepEqual(Object.keys(target), Object.keys(source));
    for (const file of Object.keys(source)) {
      assert.equal(target[file].type, source[file].type); assert.equal(target[file].sha256, source[file].sha256);
      if (source[file].type === 'file') assert.equal(target[file].executable, source[file].executable);
    }
  }
  const changed = path.join(skillSource(clone, 'ric-devflow'), 'SKILL.md'); const original = fs.readFileSync(changed);
  fs.appendFileSync(changed, '\nUnapproved change\n'); assert.throws(() => verifySources(clone), /integrity|Dirty/i); fs.writeFileSync(changed, original);
  fs.chmodSync(changed, 0o755); assert.throws(() => verifySources(clone), /integrity|Dirty/i); fs.chmodSync(changed, 0o644);
  assert.doesNotThrow(() => verifySources(clone));
});
