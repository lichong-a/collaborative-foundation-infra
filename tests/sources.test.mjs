import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { ROOT, NODE, write, snapshot, git, hash, run } from './helpers.mjs';
import { sourceFixture, advanceSource, noSourceCopies, ownSkill, ownSkills, navigation, skillSource, expectedSkillSnapshot, expectedSkillBytes } from './source-fixtures.mjs';
import { prepareSkills, verifyUpstreams } from '../tools/sources.mjs';
import { skillResources, resourceIdentity, stageTeamResources } from '../tools/skill-resources.mjs';
const portable = root => Object.fromEntries(Object.entries(snapshot(root)).map(([file, { mode, ...item }]) => [file, { ...item, ...(item.type === 'file' ? { executable: Boolean(mode & 0o100) } : {}) }]));
function privateTeam(f, name = 'team') { const team = path.join(f.base, name); fs.mkdirSync(team, { mode: 0o700 }); return team; }

test('TC-SRC-001/002/004/006: direct sources validate read-only, including reviewed index migration and upgrade', t => {
  const f = sourceFixture(t); const before = snapshot(f.repo), head = git(f.repo, 'rev-parse', 'HEAD');
  for (let i = 0; i < 2; i++) { const result = prepareSkills(f.repo); assert.equal(result.status, 'verified'); assert.equal(result.layoutVersion, 4); assert.equal(result.packages.length, 9); assert.deepEqual(snapshot(f.repo), before); noSourceCopies(f.repo); }
  const verified = verifyUpstreams(f.repo); assert.equal(f.lock.schemaVersion, 4);
  for (const pkg of f.lock.packages) { assert.equal(Object.hasOwn(pkg, 'sourcePath'), false); assert(pkg.path.startsWith('skills/upstreams/')); assert.deepEqual(Object.keys(verified.packages[pkg.name].files), Object.keys(pkg.files)); }
  const oldDigest = skillResources(f.repo).distributionDigest; const staged = advanceSource(f);
  assert.notEqual(git(f.repo, 'rev-parse', `HEAD:${f.lock.upstreams[0].path}`), f.lock.upstreams[0].commit);
  const changed = snapshot(f.repo); assert.equal(prepareSkills(f.repo).status, 'verified'); assert.notEqual(skillResources(f.repo).distributionDigest, oldDigest); assert.deepEqual(snapshot(f.repo), changed); noSourceCopies(f.repo);
  const resources = skillResources(f.repo), team = privateTeam(f); stageTeamResources(f.repo, team, resources);
  assert.equal(fs.readFileSync(path.join(team, 'skills/common', staged.pkg.name, 'revision.txt'), 'utf8'), 'Second reviewed synthetic revision\n'); assert.equal(git(f.repo, 'rev-parse', 'HEAD'), head);
});

test('TC-SRC-002/003: missing initialization, index mismatch and dirty inputs fail without source or fallback writes', t => {
  for (const kind of ['missing', 'index', 'tracked', 'untracked', 'ignored']) {
    const f = sourceFixture(t), u = f.lock.upstreams[0], upstream = path.join(f.repo, u.path);
    if (kind === 'missing') fs.renameSync(upstream, path.join(f.base, 'saved-upstream'));
    if (kind === 'index') git(f.repo, 'update-index', '--cacheinfo', `160000,${'1'.repeat(40)},${u.path}`);
    if (kind === 'tracked') fs.appendFileSync(path.join(upstream, 'skills/ric-devflow/SKILL.md'), 'user edit\n');
    if (kind === 'untracked') write(upstream, 'unknown.txt', 'user content');
    if (kind === 'ignored') { write(upstream, '.gitignore', 'cache/\n'); git(upstream, 'add', '.gitignore'); git(upstream, 'commit', '-qm', 'Fixture ignore'); u.commit = git(upstream, 'rev-parse', 'HEAD'); for (const p of f.lock.packages.filter(p => p.upstream === u.id)) p.commit = u.commit; write(f.repo, 'sources.lock.json', JSON.stringify(f.lock)); git(f.repo, 'update-index', '--cacheinfo', `160000,${u.commit},${u.path}`); write(upstream, 'cache/data', 'ignored user bytes'); }
    const before = snapshot(f.repo); assert.throws(() => prepareSkills(f.repo), kind === 'missing' ? /git submodule update --init --recursive --checkout/ : /does not match|mismatch|Dirty/); assert.throws(() => skillResources(f.repo)); assert.deepEqual(snapshot(f.repo), before); noSourceCopies(f.repo);
  }
});

test('TC-SRC-009: absent gitlinks report incomplete source before initialization and preserve the index', t => {
  for (const directoryPresent of [true, false]) {
    const f = sourceFixture(t), upstream = f.lock.upstreams[0];
    git(f.repo, 'update-index', '--force-remove', '--', upstream.path);
    if (!directoryPresent) fs.renameSync(path.join(f.repo, upstream.path), path.join(f.base, 'saved-upstream'));
    const before = snapshot(f.repo), index = git(f.repo, 'ls-files', '--stage');
    for (const operation of [prepareSkills, verifyUpstreams, skillResources]) {
      assert.throws(() => operation(f.repo), error => {
        assert.match(error.message, /(?:missing|absent|incomplete).*gitlink|gitlink.*(?:missing|absent|incomplete)/i);
        assert(error.message.includes(upstream.path));
        assert.doesNotMatch(error.message, /Submodule is not initialized/);
        return true;
      });
    }
    assert.deepEqual(snapshot(f.repo), before); assert.equal(git(f.repo, 'ls-files', '--stage'), index); noSourceCopies(f.repo);
  }
});

test('TC-SRC-005: legacy or unknown copies and preparation records are preserved and never used as authority', t => {
  for (const name of ['skills/common/ric-devflow/SKILL.md', 'skills/common/unrelated/SKILL.md', '.collaborative-foundation-infra/exports.json', '.collaborative-foundation-infra/prepare.lock', '.collaborative-foundation-infra/prepare-pending.json', '.collaborative-foundation-infra/prepare-old/partial']) {
    const f = sourceFixture(t); write(f.repo, name, 'unknown user bytes'); const before = snapshot(f.repo);
    for (const operation of [prepareSkills, verifyUpstreams, skillResources]) assert.throws(() => operation(f.repo), /Legacy|unknown source copy/);
    assert.deepEqual(snapshot(f.repo), before);
  }
});

test('TC-DIST-001/002: private assembly exactly matches independent eleven-package expectations without source copies', t => {
  const f = sourceFixture(t, { real: true }); const before = snapshot(f.repo), team = privateTeam(f); const resources = skillResources(f.repo); stageTeamResources(f.repo, team, resources);
  assert.equal(Object.keys(resources.skills).length, 11); assert.deepEqual(fs.readdirSync(path.join(team, 'skills/common')).sort(), [...f.lock.packages.map(p => p.name), ...ownSkills].sort());
  for (const name of Object.keys(resources.skills)) assert.deepEqual(portable(path.join(team, 'skills/common', name)), expectedSkillSnapshot(f.repo, name), name);
  assert.equal(fs.existsSync(path.join(team, '.git')), false); assert.equal(fs.existsSync(path.join(team, 'upstreams')), false); assert.equal(fs.existsSync(path.join(team, 'skills/upstreams')), false); assert.equal(fs.existsSync(path.join(team, 'skills/common/ric-devflow/.devflow')), false);
  assert.deepEqual(snapshot(f.repo), before); noSourceCopies(f.repo);
  assert.throws(() => stageTeamResources(f.repo, team, resources), /must be empty/);
});

test('TC-DOC-001: controlled navigation relocation leaves code examples, external URLs and unrelated bytes unchanged', t => {
  const f = sourceFixture(t); const file = 'SKILL.md'; const [label, from, to] = navigation[file]; const source = path.join(skillSource(f.repo, ownSkill), file); const expected = expectedSkillBytes(f.repo, ownSkill, file);
  const examples = `\n\n\x60\x60\x60md\n[${label}](${from})\n\x60\x60\x60\nInline \x60[${label}](${from})\x60 and [website](https://example.invalid/${from})\n`;
  fs.appendFileSync(source, examples); const before = snapshot(f.repo), resources = skillResources(f.repo), team = privateTeam(f); stageTeamResources(f.repo, team, resources);
  assert.deepEqual(fs.readFileSync(path.join(team, 'skills/common', ownSkill, file)), Buffer.concat([expected, Buffer.from(examples)])); assert.deepEqual(snapshot(f.repo), before); assert(resources.skills[ownSkill].rewritten[file].includes(Buffer.from(`](${to})`)));
});

test('TC-DOC-001: reference-style links and valid anchors relocate while unknown or missing mappings fail before staging', t => {
  for (const kind of ['reference', 'anchor', 'unknown', 'missing']) {
    const f = sourceFixture(t); const filename = path.join(skillSource(f.repo, ownSkill), 'SKILL.md'), original = fs.readFileSync(filename, 'utf8'); const [label, from, to] = navigation['SKILL.md']; let expected;
    if (kind === 'reference') { const content = original.replace(`[${label}](${from})`, `[${label}][source-ref]`) + `\n[source-ref]: ${from}\n`; fs.writeFileSync(filename, content); expected = content.replace(`[source-ref]: ${from}`, `[source-ref]: ${to}`); }
    if (kind === 'anchor') { const content = original.replace(`](${from})`, `](${from}#ric-devflow)`); fs.writeFileSync(filename, content); expected = content.replace(`](${from}#ric-devflow)`, `](${to}#ric-devflow)`); }
    if (kind === 'unknown') write(f.repo, `skills/common/${ownSkill}/references/unmapped.md`, `[source](../../../upstreams/ric-devflow/skills/ric-devflow/SKILL.md)\n`);
    if (kind === 'missing') fs.writeFileSync(filename, original.replace(`[${label}](${from})`, label));
    const before = snapshot(f.repo);
    if (expected) { const team = privateTeam(f); stageTeamResources(f.repo, team, skillResources(f.repo)); assert.equal(fs.readFileSync(path.join(team, 'skills/common', ownSkill, 'SKILL.md'), 'utf8'), expected); }
    else assert.throws(() => skillResources(f.repo), /Unknown cross-package|Required source navigation/);
    assert.deepEqual(snapshot(f.repo), before); noSourceCopies(f.repo);
  }
});

test('TC-SRC-007: source mutation during private assembly and partial writes cannot return a complete distribution', t => {
  for (const kind of ['source-change', 'write-failure']) {
    const f = sourceFixture(t); const team = privateTeam(f), expected = skillResources(f.repo), original = fs.writeFileSync; let triggered = false;
    try {
      fs.writeFileSync = function (filename, bytes, ...args) {
        if (!triggered && typeof filename === 'string' && filename.startsWith(team + path.sep)) {
          triggered = true;
          if (kind === 'write-failure') throw new Error('TEST_PRIVATE_WRITE_FAILURE');
          fs.appendFileSync(path.join(f.repo, f.lock.packages[0].path, 'SKILL.md'), 'concurrent source change');
        }
        return original.call(this, filename, bytes, ...args);
      };
      assert.throws(() => stageTeamResources(f.repo, team, expected)); assert(triggered);
    } finally { fs.writeFileSync = original; }
    noSourceCopies(f.repo); assert.equal(fs.existsSync(path.join(f.repo, '.collaborative-foundation-infra')), false);
    if (kind === 'source-change') assert.match(fs.readFileSync(path.join(f.repo, f.lock.packages[0].path, 'SKILL.md'), 'utf8'), /concurrent source change$/);
    else assert.doesNotThrow(() => verifyUpstreams(f.repo));
  }
});

test('TC-SRC-007: concurrent read-only preparation succeeds independently without locks or source changes', async t => {
  const f = sourceFixture(t), before = snapshot(f.repo);
  const child = () => new Promise((resolve, reject) => { const p = spawn(NODE, [path.join(ROOT, 'scripts/prepare-skills.mjs')], { cwd: f.repo, timeout: 30000 }); let stdout = '', stderr = ''; p.stdout.on('data', x => stdout += x); p.stderr.on('data', x => stderr += x); p.on('error', reject); p.on('close', code => resolve({ code, stdout, stderr })); });
  const results = await Promise.all([child(), child()]); for (const r of results) { assert.equal(r.code, 0, r.stdout + r.stderr); assert.equal(JSON.parse(r.stdout).status, 'verified'); }
  assert.deepEqual(snapshot(f.repo), before); noSourceCopies(f.repo);
});

test('TC-SRC-008: source hard links, source symlinks and unsafe mappings preserve external bytes', t => {
  for (const kind of ['hardlink', 'symlink', 'upstreams-parent', 'skills-parent', 'mapping']) {
    const f = sourceFixture(t); const sentinel = path.join(f.base, 'sentinel'); write(f.base, 'sentinel', 'outside');
    if (kind === 'hardlink') { fs.unlinkSync(sentinel); fs.linkSync(path.join(f.repo, f.lock.packages[0].path, 'SKILL.md'), sentinel); }
    if (kind === 'symlink') { const location = path.join(f.repo, f.lock.upstreams[0].path); fs.renameSync(location, path.join(f.base, 'saved-upstream')); fs.symlinkSync(path.join(f.base, 'saved-upstream'), location); }
    if (kind === 'upstreams-parent' || kind === 'skills-parent') { const location = path.join(f.repo, kind === 'upstreams-parent' ? 'skills/upstreams' : 'skills'); fs.renameSync(location, path.join(f.base, 'saved-parent')); fs.symlinkSync(path.join(f.base, 'saved-parent'), location); }
    if (kind === 'mapping') { f.lock.packages[0].path = '../../sentinel'; write(f.repo, 'sources.lock.json', JSON.stringify(f.lock)); }
    const bytes = fs.readFileSync(sentinel), before = snapshot(f.repo), external = snapshot(f.base); assert.throws(() => prepareSkills(f.repo)); assert.deepEqual(fs.readFileSync(sentinel), bytes); assert.deepEqual(snapshot(f.repo), before); assert.deepEqual(snapshot(f.base), external);
  }
});

test('TC-DIST-002: equal Git source clones bind equal resources independent of physical Git and session paths', t => {
  const f = sourceFixture(t); const before = resourceIdentity(f.repo), clone = path.join(f.base, 'relocated source'); git(f.repo, 'clone', '--no-hardlinks', f.repo, clone);
  for (const u of f.lock.upstreams) git(clone, 'clone', '--no-hardlinks', path.join(f.repo, u.path), path.join(clone, u.path));
  assert.equal(resourceIdentity(clone), before); write(f.repo, '.collaborative-foundation-infra/unrelated-session.json', '{}'); write(f.repo, '.git/fixture-local-path', '/synthetic/location'); assert.equal(resourceIdentity(f.repo), before);
  write(clone, 'rules/added.md', '# Different resource'); assert.notEqual(resourceIdentity(clone), before); noSourceCopies(f.repo); noSourceCopies(clone);
});

test('TC-SRC-003/004: direct validation neither runs outer hooks nor attempts remote fetching', t => {
  const f = sourceFixture(t), marker = path.join(f.base, 'hook-called');
  for (const u of f.lock.upstreams) { const repo = path.join(f.repo, u.path); git(repo, 'remote', 'add', 'origin', 'https://example.invalid/unavailable'); const hooks = path.join(f.base, u.id + '-hooks'); write(hooks, 'post-checkout', `#!/bin/sh\nprintf called > '${marker}'\n`); fs.chmodSync(path.join(hooks, 'post-checkout'), 0o755); git(repo, 'config', 'core.hooksPath', hooks); }
  const before = snapshot(f.repo); assert.equal(prepareSkills(f.repo).status, 'verified'); assert.equal(fs.existsSync(marker), false); assert.deepEqual(snapshot(f.repo), before); noSourceCopies(f.repo);
  for (const file of [`skills/common/${ownSkill}/SKILL.md`, 'skills/common/unrelated/SKILL.md', 'skills/common/ric-devflow/SKILL.md']) assert.equal(run('git', ['-C', f.repo, 'check-ignore', file]).code, 1);
});
