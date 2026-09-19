import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fixture, write, document, invoke, json, snapshot, savePlan, policy, run, NODE, GOVERNANCE, git } from './helpers.mjs';
import { validatePolicy } from '../tools/policy.mjs';
import { createPlan, applyPlan } from '../tools/plan.mjs';
import { digest } from '../tools/repository.mjs';

test('TC-CLI-001: explicit arguments, JSON/text and scan/check exit contract', t => {
  const f = fixture(t, { 'README.md': '[missing](docs/missing.md)\n' });
  const scan = invoke(f, 'audit'); assert.equal(scan.code, 0); assert.equal(json(scan).status, 'fail');
  assert.equal(invoke(f, 'check').code, 1);
  const text = run(NODE, [GOVERNANCE, 'audit', '--repo', f.repo, '--policy', f.policyFile]);
  assert.equal(text.code, 0); assert.match(text.stdout, /BROKEN_LINK/);
  for (const args of [[], ['audit'], ['audit', '--repo', f.repo], ['audit', '--repo', f.repo, '--policy', f.policyFile, '--format', 'bad'], ['apply', '--repo', f.repo, '--policy', f.policyFile]]) {
    assert.equal(run(NODE, [GOVERNANCE, ...args]).code, 2);
  }
  write(f.base, 'policy.json', '{broken'); assert.equal(invoke(f, 'check').code, 2);
});

test('TC-CHECK-001: debt only, new violation, resolved debt and declared path rules', t => {
  const f = fixture(t, { 'README.md': '[old](docs/old.md)\n', 'src/data.txt': 'fixture' }, { allowedTopLevel: ['README.md', 'src'], pathRules: [{ prefix: 'src', allowedExtensions: ['.mjs'] }] });
  const before = json(invoke(f, 'audit')); assert(before.findings.some(v => v.code === 'PATH_RULE'));
  const p = JSON.parse(fs.readFileSync(f.policyFile)); p.debt = before.findings.map(v => v.fingerprint); write(f.base, 'policy.json', JSON.stringify(p));
  assert.equal(invoke(f, 'check').code, 0); assert.equal(json(invoke(f, 'check')).status, 'debt');
  write(f.repo, 'README.md', '[old](docs/old.md)\n[new](docs/new.md)\n');
  const added = invoke(f, 'check'); assert.equal(added.code, 1); assert.equal(json(added).summary.newFindings, 1);
  write(f.repo, 'README.md', '# Resolved\n'); fs.unlinkSync(path.join(f.repo, 'src/data.txt'));
  assert.equal(json(invoke(f, 'check')).status, 'pass');

});

test('TC-DOC-001/002: Unicode, spaces, cross-tree, refs, HTML, anchors and code exclusion', t => {
  const f = fixture(t, {
    'README.md': '[docs](docs/)\n',
    'docs/README.md': document('index', '[中文][ref]\n[plan](../changes/plans/方案.md#进度)\n![img](../image.png)\n<a href="../changes/plans/方案.md#explicit">HTML</a>\n\n[ref]: <%E4%B8%AD%E6%96%87%20%E6%96%87%E6%A1%A3.md#标题>\n\n```md\n[not](missing-fenced.md)\n```\n\n    [not](missing-indent.md)\n\n`[not](missing-inline.md)`\n'),
    'docs/中文 文档.md': document('zh', '# 标题\n'),
    'changes/plans/方案.md': document('plan', '# 进度\n<a id="explicit"></a>\n', 'plan'),
    'image.png': 'synthetic-image'
  });
  const result = invoke(f, 'check'); assert.equal(result.code, 0, result.stdout); assert.equal(json(result).summary.documents, 4); assert.equal(json(result).summary.reachable, 4);
  write(f.repo, 'README.md', '[docs](docs/)\n[bad](changes/plans/方案.md#absent)\n');
  assert.deepEqual(json(invoke(f, 'audit')).findings.map(v => v.code), ['BROKEN_ANCHOR']);
});

test('TC-DOC-003: statuses, duplicate id, metadata and exemptions remain structural', t => {
  const files = { 'README.md': '' };
  for (const status of ['current', 'proposal', 'plan', 'historical']) { files[`docs/${status}.md`] = document(status, '# Doc\n', status); files['README.md'] += `[${status}](docs/${status}.md)\n`; }
  files['docs/duplicate.md'] = document('current'); files['docs/invalid.md'] = document('invalid', '# Invalid\n', 'accepted'); files['docs/missing.md'] = '# Missing\n';
  files['.devflow/legacy.md'] = 'Legacy state is untouched'; files['vendor/SKILL.md'] = '# Upstream\n';
  const f = fixture(t, files, { documentRoots: ['docs', '.devflow', 'vendor'], exclude: ['vendor'], workflow: { authority: 'devflow', references: ['.devflow/legacy.md'] } });
  const before = snapshot(f.repo); const result = json(invoke(f, 'audit')); const codes = result.findings.map(v => v.code);
  assert(codes.includes('DUPLICATE_ID')); assert(codes.includes('METADATA_INVALID')); assert(codes.includes('METADATA_MISSING')); assert.equal(codes.filter(v => v === 'DOC_UNREACHABLE').length, 3);
  assert(!result.findings.some(v => v.path.startsWith('.devflow/') || v.path.startsWith('vendor/'))); assert.deepEqual(snapshot(f.repo), before);
});

test('TC-DOC-002: commented HTML is not a link and generated heading anchors stay globally unique', t => {
  const f = fixture(t, { 'README.md': '[last](docs/headings.md#a-1-1)\n<!-- <a href="missing.md">comment only</a> -->\n', 'docs/headings.md': document('headings', '# A\n# A\n# A-1\n') });
  const result = invoke(f, 'check'); assert.equal(result.code, 0, result.stdout); assert.equal(json(result).status, 'pass');
});

function repairFixture(t) {
  return fixture(t, {
    'README.md': '# User heading\n\n[docs](docs/README.md)\n',
    'docs/README.md': document('docs-index', '# Docs\n[broken](../changes/old.md)\n```md\n[example](../changes/old.md)\n```\n'),
    'changes/new.md': document('new', '# Current plan\n', 'plan'),
    'docs/orphan.md': document('orphan', '# Orphan\n'),
    '.devflow/state.yaml': 'status: user-owned\n',
    'AGENTS.md': 'User instructions: preserve all bytes.\n'
  }, { workflow: { authority: 'devflow', references: ['.devflow/state.yaml'] }, linkRepairs: [{ source: 'docs/README.md', oldTarget: '../changes/old.md', newTarget: '../changes/new.md' }] });
}

test('TC-READONLY-001/TC-APPLY-001/002: preview, bounded repair and repeated application', t => {
  const f = repairFixture(t); const before = snapshot(f.repo);
  for (const action of ['audit', 'check', 'plan']) { invoke(f, action); assert.deepEqual(snapshot(f.repo), before); }
  const p = savePlan(f); const result = invoke(f, 'apply', ['--plan', p.file]); assert.equal(result.code, 0, result.stdout); assert.equal(json(result).status, 'applied');
  assert.equal(fs.readFileSync(path.join(f.repo, 'AGENTS.md'), 'utf8'), 'User instructions: preserve all bytes.\n');
  assert.equal(fs.readFileSync(path.join(f.repo, '.devflow/state.yaml'), 'utf8'), 'status: user-owned\n');
  const repaired = fs.readFileSync(path.join(f.repo, 'docs/README.md'), 'utf8'); assert.match(repaired, /\[broken\]\(\.\.\/changes\/new\.md\)/); assert.match(repaired, /\[example\]\(\.\.\/changes\/old\.md\)/);
  assert.equal(json(invoke(f, 'check')).status, 'pass');
  const pending = fs.readFileSync(path.join(f.repo, 'docs/pending.md'), 'utf8');
  assert.match(pending, /^id: collaborative-foundation-infra-pending-classification$/m);
  assert(pending.includes('<!-- collaborative-foundation-infra:pending:start -->'));
  assert(pending.includes('<!-- collaborative-foundation-infra:pending:end -->'));
  const entry = fs.readFileSync(path.join(f.repo, 'README.md'), 'utf8');
  assert(entry.includes('<!-- collaborative-foundation-infra:navigation:start -->'));
  assert(entry.includes('<!-- collaborative-foundation-infra:navigation:end -->'));
  const after = snapshot(f.repo); assert.equal(json(invoke(f, 'apply', ['--plan', p.file])).status, 'noop'); assert.deepEqual(snapshot(f.repo), after);
  assert.equal(json(invoke(f, 'plan')).operations.length, 0);
});

test('TC-APPLY-003: dirty, staged, stale target/non-target and stale HEAD refuse all writes', t => {
  for (const kind of ['dirty', 'staged', 'stale-target', 'stale-other', 'head']) {
    const f = repairFixture(t); let p;
    if (kind === 'dirty' || kind === 'staged') { write(f.repo, 'README.md', '# User edit\n'); if (kind === 'staged') git(f.repo, 'add', 'README.md'); p = savePlan(f); }
    else { p = savePlan(f); if (kind === 'stale-target') write(f.repo, 'docs/README.md', '# Concurrent target edit\n'); if (kind === 'stale-other') write(f.repo, 'unrelated.txt', 'concurrent'); if (kind === 'head') git(f.repo, 'commit', '--allow-empty', '-qm', 'Advance HEAD'); }
    const before = snapshot(f.repo); const result = invoke(f, 'apply', ['--plan', p.file]); assert.equal(result.code, 2, `${kind}: ${result.stdout}`); assert.deepEqual(snapshot(f.repo), before);
  }
});

test('TC-APPLY-004: tampered plans reject, including recomputed digests', t => {
  const f = repairFixture(t); const p = savePlan(f); const before = snapshot(f.repo);
  for (const recompute of [false, true]) {
    const plan = structuredClone(p.plan); plan.operations[0].content = '# Unauthorized replacement\n';
    if (recompute) { const { planDigest, ...rest } = plan; plan.planDigest = digest(rest); }
    write(f.base, 'bad-plan.json', JSON.stringify(plan)); assert.equal(invoke(f, 'apply', ['--plan', path.join(f.base, 'bad-plan.json')]).code, 2); assert.deepEqual(snapshot(f.repo), before);
  }
});

test('TC-APPLY-004: protected, traversal, encoded and instruction destinations cannot be written', t => {
  for (const target of ['.devflow/register.md', '.git/register.md', 'AGENTS.md', 'docs/AGENTS.override.md', '../outside.md', '/tmp/outside.md', 'docs/%2e%2e/register.md', 'node_modules/register.md']) {
    const f = repairFixture(t); const p = JSON.parse(fs.readFileSync(f.policyFile)); p.pendingFile = target; write(f.base, 'policy.json', JSON.stringify(p)); const before = snapshot(f.repo);
    assert.equal(invoke(f, 'plan').code, 2, target); assert.deepEqual(snapshot(f.repo), before);
  }
});

test('TC-APPLY-004/005: parent and final symlinks preserve external sentinels', t => {
  const f = repairFixture(t); const plan = savePlan(f);
  write(f.base, 'outside/sentinel', 'outside'); write(f.base, 'outside/README.md', 'outside readme');
  fs.renameSync(path.join(f.repo, 'docs'), path.join(f.repo, 'original-docs')); fs.symlinkSync(path.join(f.base, 'outside'), path.join(f.repo, 'docs'));
  const outside = snapshot(path.join(f.base, 'outside')); assert.equal(invoke(f, 'apply', ['--plan', plan.file]).code, 2); assert.deepEqual(snapshot(path.join(f.base, 'outside')), outside);
});

function caughtApply(f, fault) {
  const settings = validatePolicy(JSON.parse(fs.readFileSync(f.policyFile))); const plan = createPlan(f.repo, settings);
  let error; try { fault(() => applyPlan(f.repo, settings, plan), plan, settings); } catch (e) { error = e; }
  assert(error, 'failure must propagate'); const match = /recovery=([^;]+);/.exec(error.message); assert(match, error.message);
  const journal = JSON.parse(fs.readFileSync(path.join(match[1], 'progress.json')));
  return { error, journal, plan };
}

test('TC-APPLY-005: partial write failure records attempted target and unresolved bytes', t => {
  const f = repairFixture(t); const original = fs.writeFileSync; let injected = false;
  const result = caughtApply(f, apply => {
    fs.writeFileSync = function (file, content, ...options) {
      if (typeof file === 'number' && typeof content === 'string' && !content.startsWith('{') && !injected) { injected = true; fs.writeSync(file, content.slice(0, 7)); throw new Error('TEST_PARTIAL_WRITE'); }
      return original.call(this, file, content, ...options);
    };
    try { apply(); } finally { fs.writeFileSync = original; }
  });
  assert(injected); assert(result.journal.attempted.length > 0); assert(result.journal.conflicts.length > 0); assert.match(result.error.message, /TEST_PARTIAL_WRITE/);
});

test('TC-APPLY-005: fsync failure after complete write restores original bytes', t => {
  const f = repairFixture(t); const before = snapshot(f.repo); const original = fs.fsyncSync; let injected = false;
  const result = caughtApply(f, apply => {
    fs.fsyncSync = function (fd) { if (!injected) { injected = true; throw new Error('TEST_FSYNC_FAILURE'); } return original.call(this, fd); };
    try { apply(); } finally { fs.fsyncSync = original; }
  });
  assert(injected); assert(result.journal.attempted.length > 0); assert(result.journal.recovered.length > 0); assert.deepEqual(result.journal.conflicts, []); assert.deepEqual(snapshot(f.repo), before);
});

test('TC-APPLY-005: cooperative mid-apply target change is preserved with prior writes recovered', t => {
  const f = repairFixture(t); const settings = validatePolicy(JSON.parse(fs.readFileSync(f.policyFile))); const plan = createPlan(f.repo, settings);
  let altered;
  assert.throws(() => applyPlan(f.repo, settings, plan, { beforeWrite(op, index) { if (index === 1) { altered = op.path; write(f.repo, altered, 'Other writer owns this\n'); } } }), /Target changed during apply/);
  assert.equal(fs.readFileSync(path.join(f.repo, altered), 'utf8'), 'Other writer owns this\n');
  if (plan.operations[0].beforeContent === null) assert.equal(fs.existsSync(path.join(f.repo, plan.operations[0].path)), false);
  else assert.equal(fs.readFileSync(path.join(f.repo, plan.operations[0].path), 'utf8'), plan.operations[0].beforeContent);
});

test('TC-FLOW-001: existing DevFlow authority conflict is diagnostic and read-only', t => {
  const f = fixture(t, { '.devflow/state.yaml': 'status: active\n', '.collaborative-foundation-infra/tasks/duplicate.md': '# Competing authority\n' }, { workflow: { authority: 'devflow', references: ['.devflow/state.yaml'] } });
  write(f.repo, '.devflow/state.yaml', 'status: user-uncommitted\n'); const before = snapshot(f.repo);
  for (const authority of ['none', 'devflow']) {
    const settings = JSON.parse(fs.readFileSync(f.policyFile)); settings.workflow.authority = authority;
    fs.writeFileSync(f.policyFile, JSON.stringify(settings));
    assert(json(invoke(f, 'audit')).findings.some(v => v.code === 'FLOW_CONFLICT')); assert.deepEqual(snapshot(f.repo), before);
  }
  fs.unlinkSync(path.join(f.repo, '.collaborative-foundation-infra/tasks/duplicate.md'));
  assert(!json(invoke(f, 'audit')).findings.some(v => v.code === 'FLOW_CONFLICT'));
  assert.equal(fs.readFileSync(path.join(f.repo, '.devflow/state.yaml'), 'utf8'), 'status: user-uncommitted\n');
});

test('TC-APPLY-001: ordinary prose and escaped links are preserved or conservatively refused', t => {
  for (const prose of ['text ](missing.md)', '\\[literal](missing.md)']) {
    const f = fixture(t, { 'README.md': `[real](missing.md)\n\n${prose}\n`, 'docs/new.md': document('new') }, { linkRepairs: [{ source: 'README.md', oldTarget: 'missing.md', newTarget: 'docs/new.md' }] });
    const before = snapshot(f.repo); const result = invoke(f, 'plan');
    if (result.code === 2) { assert.deepEqual(snapshot(f.repo), before); continue; }
    assert.equal(result.code, 0, result.stdout); const change = json(result).operations.find(op => op.path === 'README.md');
    assert(change); assert(change.content.includes(prose), `non-link prose changed: ${JSON.stringify(change.content)}`);
  }
});

test('TC-APPLY-004: hard-linked tracked target cannot modify an outside sentinel', t => {
  const f = fixture(t, { 'README.md': '# User content\n', 'docs/new.md': document('new') }, { indexEntries: [{ index: 'README.md', target: 'docs/new.md', label: 'New' }] });
  const sentinel = path.join(f.base, 'outside-sentinel'); fs.linkSync(path.join(f.repo, 'README.md'), sentinel); const before = fs.readFileSync(sentinel);
  assert.equal(git(f.repo, 'status', '--porcelain'), ''); const preview = invoke(f, 'plan');
  if (preview.code === 2) { assert.deepEqual(fs.readFileSync(sentinel), before); return; }
  assert.equal(preview.code, 0, preview.stdout); const file = path.join(f.base, 'plan.json'); fs.writeFileSync(file, preview.stdout);
  const applied = invoke(f, 'apply', ['--plan', file]); assert([0, 2].includes(applied.code)); assert.deepEqual(fs.readFileSync(sentinel), before);
});

test('TC-APPLY-005: EEXIST before opening a new target never removes another writer file', t => {
  const f = repairFixture(t); const original = fs.openSync; let target, ownedBytes;
  const result = caughtApply(f, (apply, plan) => {
    const op = plan.operations.find(v => v.beforeContent === null); assert(op); target = path.join(f.repo, op.path); ownedBytes = op.content;
    fs.openSync = function (file, flags, ...rest) {
      if (file === target && typeof flags === 'number' && (flags & fs.constants.O_EXCL)) { fs.writeFileSync(target, ownedBytes); const error = new Error('TEST_OTHER_WRITER_EEXIST'); error.code = 'EEXIST'; throw error; }
      return original.call(this, file, flags, ...rest);
    };
    try { apply(); } finally { fs.openSync = original; }
  });
  assert.match(result.error.message, /TEST_OTHER_WRITER_EEXIST/); assert.equal(fs.existsSync(target), true, 'another writer file was removed'); assert.equal(fs.readFileSync(target, 'utf8'), ownedBytes);
});

test('TC-WORKTREE-001: independent worktrees bind plans and reject cross-worktree application', t => {
  const f = repairFixture(t); const other = path.join(f.base, 'worktree'); git(f.repo, 'worktree', 'add', '--detach', other, 'HEAD');
  const p = savePlan(f); const otherFixture = { ...f, repo: other }; const before = snapshot(other);
  assert.equal(invoke(otherFixture, 'apply', ['--plan', p.file]).code, 2); assert.deepEqual(snapshot(other), before);
  const pOther = savePlan(otherFixture); write(f.repo, 'unrelated.txt', 'changes only first');
  assert.equal(invoke(f, 'apply', ['--plan', p.file]).code, 2); assert.equal(invoke(otherFixture, 'apply', ['--plan', pOther.file]).code, 0);
  assert.equal(fs.readFileSync(path.join(f.repo, 'unrelated.txt'), 'utf8'), 'changes only first');
});

test('TC-WORKTREE-001: linked Git metadata is not an unregistered project path', t => {
  const f = fixture(t, {}, { allowedTopLevel: ['README.md'] }); const other = path.join(f.base, 'linked'); git(f.repo, 'worktree', 'add', '--detach', other, 'HEAD');
  const result = invoke({ ...f, repo: other }, 'check'); assert.equal(result.code, 0, result.stdout); assert.equal(json(result).status, 'pass');
});
