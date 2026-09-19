import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, NODE, fixture, write, run, json, snapshot, git, policy } from './helpers.mjs';
import { preparedRuntime, runtimePackage } from './teamai-fixtures.mjs';
import { sourceFixture } from './source-fixtures.mjs';

const start = '<!-- collaborative-foundation-infra:session:start -->';
const end = '<!-- collaborative-foundation-infra:session:end -->';
function sync(f, agent, flags = []) {
  return run(NODE, [path.join(ROOT, 'scripts/teamai-sync.mjs'), '--repo', f.repo, '--source', ROOT, '--agent', agent, '--user-home', f.home, '--data-home', preparedRuntime().dataHome, '--teamai-entry', preparedRuntime().entry, ...flags], { timeout: 60000, env: { ...process.env, HOME: f.home, USERPROFILE: f.home, XDG_CONFIG_HOME: path.join(f.home, '.config'), XDG_STATE_HOME: path.join(f.home, 'state'), CI: '1' } });
}
const install = (f, agent = 'codex') => { const result = sync(f, agent, ['--apply', '--install-entry']); assert.equal(result.code, 0, result.stdout + result.stderr); return json(result); };
const entry = agent => agent === 'claude' ? 'CLAUDE.md' : 'AGENTS.md';

test('TC-DIST-004/006: explicit three-harness entry installation preserves original bytes and matched dirty text without writes', t => {
  for (const [agent, original] of [['codex', '# 中文规则\r\n用户正文\r\n'], ['zcode', '# 用户规则没有末尾换行'], ['claude', '']]) {
    const f = fixture(t, original ? { [entry(agent)]: original } : {}); const before = snapshot(f.repo), home = snapshot(f.home);
    for (const flags of [[], ['--install-entry']]) { const result = sync(f, agent, flags); assert.equal(result.code, 0, result.stdout); assert.equal(json(result).hostLoading, 'not-verified'); assert.deepEqual(snapshot(f.repo), before); assert.deepEqual(snapshot(f.home), home); }
    const resources = sync(f, agent, ['--apply']); assert.equal(resources.code, 0, resources.stdout); assert.equal(fs.existsSync(path.join(f.repo, entry(agent))), Boolean(original)); if (original) assert.equal(fs.readFileSync(path.join(f.repo, entry(agent)), 'utf8'), original);
    const installed = install(f, agent); assert.equal(installed.hostLoading, 'not-verified'); assert.equal(installed.nativeRoles, 'not-installed');
    const filename = path.join(f.repo, entry(agent)), bytes = fs.readFileSync(filename); assert.deepEqual(bytes.subarray(0, Buffer.byteLength(original)), Buffer.from(original));
    const text = bytes.toString('utf8'); assert.equal(text.split(start).length, 2); assert.equal(text.split(end).length, 2);
    const link = text.match(/\[会话选择协议\]\(([^)]+)\)/); assert(link); assert(fs.existsSync(path.resolve(f.repo, link[1])));
    fs.appendFileSync(filename, '\n用户未提交的继续编辑\n'); const dirty = snapshot(f.repo), stat = fs.statSync(filename, { bigint: true });
    assert.equal(install(f, agent).status, 'noop'); assert.deepEqual(snapshot(f.repo), dirty); assert.equal(fs.statSync(filename, { bigint: true }).ino, stat.ino); assert.equal(fs.statSync(filename, { bigint: true }).mtimeNs, stat.mtimeNs);
    const receipt = JSON.parse(fs.readFileSync(path.join(f.repo, '.collaborative-foundation-infra/teamai-installation.json'))); assert.equal(receipt.schemaVersion, 4); assert.equal(receipt.projectEntries[entry(agent)].status, 'matched'); assert.equal(receipt.upstreams.length, 3); assert.equal(receipt.sourceLayoutVersion, 4); assert.match(receipt.sourcePackagesDigest, /^[a-f0-9]{64}$/); assert.match(receipt.distributionDigest, /^[a-f0-9]{64}$/); assert.equal(fs.existsSync(path.join(f.home, 'state')), false); assert.deepEqual(snapshot(f.home), home);
  }
});

test('TC-DIST-006: Codex and ZCode share one unchanged AGENTS block in either order', t => {
  for (const agents of [['codex', 'zcode'], ['zcode', 'codex']]) {
    const f = fixture(t); install(f, agents[0]); const file = path.join(f.repo, 'AGENTS.md'), before = fs.readFileSync(file), stat = fs.statSync(file, { bigint: true });
    install(f, agents[1]); assert.deepEqual(fs.readFileSync(file), before); assert.equal(fs.statSync(file, { bigint: true }).mtimeNs, stat.mtimeNs); assert.doesNotMatch(before.toString(), /--agent (?:codex|zcode)/);
    const receipt = JSON.parse(fs.readFileSync(path.join(f.repo, '.collaborative-foundation-infra/teamai-installation.json'))); assert.deepEqual(receipt.agents, ['codex', 'zcode']);
  }
});

test('TC-DIST-005: all-resource preflight rejects dirty, malformed, linked and customized objects without partial installation', t => {
  for (const kind of ['dirty', 'staged', 'untracked', 'incomplete', 'different', 'duplicate', 'symlink', 'hardlink', 'directory', 'receipt', 'resource']) {
    const f = fixture(t, { 'AGENTS.md': '# Existing rule\n' }); const file = path.join(f.repo, 'AGENTS.md');
    if (kind === 'dirty' || kind === 'staged') { fs.appendFileSync(file, 'user edit'); if (kind === 'staged') git(f.repo, 'add', 'AGENTS.md'); }
    if (kind === 'untracked') write(f.repo, 'CLAUDE.md', 'Untracked content');
    if (kind === 'incomplete') write(f.repo, 'AGENTS.md', start + '\npartial');
    if (kind === 'different') write(f.repo, 'AGENTS.md', start + '\ncustom\n' + end + '\n');
    if (kind === 'duplicate') write(f.repo, 'AGENTS.md', `${start}\n${end}\n${start}\n${end}\n`);
    if (kind === 'symlink') { fs.unlinkSync(file); write(f.base, 'external', 'protected'); fs.symlinkSync(path.join(f.base, 'external'), file); }
    if (kind === 'hardlink') fs.linkSync(file, path.join(f.base, 'external'));
    if (kind === 'directory') { fs.unlinkSync(file); fs.mkdirSync(file); }
    if (kind === 'receipt') write(f.repo, '.collaborative-foundation-infra/teamai-installation.json', '{}');
    if (kind === 'resource') write(f.repo, '.agents/skills/ric-devflow/SKILL.md', 'custom resource');
    const before = snapshot(f.base), agent = kind === 'untracked' ? 'claude' : 'codex'; const result = sync(f, agent, ['--apply', '--install-entry']); assert.equal(result.code, 2, kind + result.stdout); assert.equal(json(result).status, 'error'); assert.deepEqual(snapshot(f.base), before, kind);
  }
});

test('PROD-ENTRY-001: resource-only sync rejects every stale recorded entry and preserves all user bytes', t => {
  for (const kind of ['deleted', 'removed', 'modified', 'other-entry']) {
    const f = fixture(t); install(f); const filename = path.join(f.repo, 'AGENTS.md');
    if (kind === 'other-entry') { install(f, 'claude'); fs.unlinkSync(path.join(f.repo, 'CLAUDE.md')); }
    if (kind === 'deleted') fs.unlinkSync(filename);
    if (kind === 'removed') fs.writeFileSync(filename, '# User intentionally removed the block\n');
    if (kind === 'modified') fs.writeFileSync(filename, fs.readFileSync(filename, 'utf8').replace('basic', 'custom-basic'));
    const before = snapshot(f.repo), home = snapshot(f.home); const result = sync(f, 'codex', ['--apply']); assert.equal(result.code, 2, kind + result.stdout); assert.equal(json(result).status, 'error'); assert.deepEqual(snapshot(f.repo), before, kind); assert.deepEqual(snapshot(f.home), home);
  }
});

test('TC-CI-001: trusted checker detects new source, gitlink and project entry governance changes', t => {
  const f = sourceFixture(t); write(f.repo, 'governance.json', JSON.stringify(policy())); const base = f.commit();
  const invoke = () => run(NODE, [path.join(ROOT, 'scripts/ci-check.mjs'), '--repo', f.repo, '--base', base, '--policy', 'governance.json']);
  assert.equal(invoke().code, 0);
  const changes = ['AGENTS.md', 'CLAUDE.md', 'scripts/prepare-skills.mjs', 'tools/sources.mjs', 'scripts/teamai-runtime.mjs', 'tools/teamai-runtime.mjs', 'tools/teamai-execution.mjs', 'tools/teamai-config.mjs'];
  for (const name of changes) write(f.repo, name, '# Synthetic candidate governance change\n');
  fs.appendFileSync(path.join(f.repo, '.gitmodules'), '\n# Candidate edit\n'); git(f.repo, 'update-index', '--cacheinfo', `160000,${'1'.repeat(40)},skills/upstreams/teamai-cli`);
  const result = invoke(); assert.equal(result.code, 1, result.stdout); const report = json(result); assert.equal(report.requiresGovernanceReview, true); for (const name of [...changes, '.gitmodules', 'skills/upstreams/teamai-cli']) assert(report.governanceChanges.includes(name), name); assert.equal(report.trustedBase, base);
  const legacy = sourceFixture(t); write(legacy.repo, 'governance.json', JSON.stringify(policy())); const legacyBase = legacy.commit(); write(legacy.repo, 'upstreams/reintroduced.txt', 'Unreviewed source fallback\n');
  const legacyResult = run(NODE, [path.join(ROOT, 'scripts/ci-check.mjs'), '--repo', legacy.repo, '--base', legacyBase, '--policy', 'governance.json']);
  assert.equal(legacyResult.code, 1, legacyResult.stdout); const legacyReport = json(legacyResult); assert.equal(legacyReport.requiresGovernanceReview, true); assert.deepEqual(legacyReport.governanceChanges, ['upstreams/reintroduced.txt']); assert.equal(legacyReport.trustedBase, legacyBase);
});

test('TC-DIST-002/005: old-layout and tampered digest receipts cannot silently upgrade existing installations', t => {
  for (const kind of ['old-layout', 'schema3', 'source-digest', 'distribution-digest', 'missing-cli', 'cli-integrity']) {
    const f = fixture(t); install(f); const filename = path.join(f.repo, '.collaborative-foundation-infra/teamai-installation.json'); const receipt = JSON.parse(fs.readFileSync(filename));
    if (kind === 'old-layout') { receipt.schemaVersion = 2; receipt.exportsDigest = receipt.sourcePackagesDigest; delete receipt.sourceLayoutVersion; delete receipt.sourcePackagesDigest; delete receipt.distributionDigest; }
    if (kind === 'schema3') receipt.schemaVersion = 3;
    if (kind === 'missing-cli') delete receipt.teamaiPackage;
    if (kind === 'cli-integrity') receipt.teamaiPackage.integrity = 'sha512-invalid';
    if (kind === 'source-digest') receipt.sourcePackagesDigest = '0'.repeat(64);
    if (kind === 'distribution-digest') receipt.distributionDigest = '0'.repeat(64);
    fs.writeFileSync(filename, JSON.stringify(receipt)); const before = snapshot(f.repo), home = snapshot(f.home); const result = sync(f, 'codex', ['--apply']);
    assert.equal(result.code, 2, result.stdout); assert.match(json(result).error, /Customized or old\/different-version/); assert.deepEqual(snapshot(f.repo), before); assert.deepEqual(snapshot(f.home), home);
  }
});
