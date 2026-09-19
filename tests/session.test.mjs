import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fixture, ROOT, GOVERNANCE, NODE, run, json, snapshot, write, git } from './helpers.mjs';
import { sessionAction } from '../tools/session.mjs';

const version = 'a'.repeat(64);
function setup(t) {
  const f = fixture(t); const state = path.join(f.home, 'state');
  const env = { userHome: f.home, stateHome: state, standardVersion: version };
  const options = { repo: f.repo, agent: 'codex', sessionId: 'synthetic-root' };
  const call = (action, extra = {}, environment = {}) => sessionAction({ ...options, action, ...extra }, { ...env, ...environment });
  const file = report => path.join(state, 'collaborative-foundation-infra/sessions', report.identity.project, report.identity.agent, report.identity.rootSession + '.json');
  const cli = (args, extraEnv = {}) => run(NODE, [GOVERNANCE, 'session', ...args, '--repo', f.repo, '--agent', 'codex', '--session-id', 'synthetic-cli'], { env: { ...process.env, HOME: f.home, USERPROFILE: f.home, XDG_STATE_HOME: state, ...extraEnv } });
  return { ...f, state, env, options, call, file, cli };
}

test('TC-SESSION-001/002: CLI returns explicit selection, success and error codes without implicit writes', t => {
  const f = setup(t); const before = snapshot(f.home), repo = snapshot(f.repo);
  const pending = f.cli(['status']); assert.equal(pending.code, 3); assert.equal(json(pending).persisted, false); assert.equal(json(pending).mode, null);
  assert.deepEqual(snapshot(f.home), before);
  for (const args of [['status', '--mode', 'basic'], ['select'], ['select', '--mode', 'unknown'], ['status', '--agent', 'claude'], ['status', '--unknown', 'x']]) {
    const result = f.cli(args); assert.equal(result.code, 2, JSON.stringify(args)); assert.equal(json(result).status, 'error'); assert.deepEqual(snapshot(f.home), before);
  }
  const selected = f.cli(['select', '--mode', 'basic']); assert.equal(selected.code, 0, selected.stdout); assert.equal(json(selected).mode, 'basic'); assert.equal(json(selected).hostLoading, 'not-verified');
  assert.deepEqual(snapshot(f.repo), repo); assert.equal(fs.existsSync(path.join(f.repo, '.devflow')), false);
  assert.equal(f.cli(['status'], { XDG_STATE_HOME: 'relative-state' }).code, 2);
  const defaultState = f.call('status', { sessionId: 'default-home' }, { stateHome: undefined }); assert.equal(defaultState.status, 'awaiting-selection');
  assert.equal(fs.existsSync(path.join(f.home, '.local')), false);
  f.call('select', { sessionId: 'default-home', mode: 'basic' }, { stateHome: undefined }); assert(fs.existsSync(path.join(f.home, '.local/state/collaborative-foundation-infra')));
});

test('TC-SESSION-003/006: explicit choice survives resume, no-op and controlled switch including standard upgrades', t => {
  const f = setup(t); assert.throws(() => f.call('switch', { mode: 'basic' }), /unselected/); assert.equal(fs.existsSync(f.state), false);
  const selected = f.call('select', { mode: 'basic' }); const filename = f.file(selected); const bytes = fs.readFileSync(filename);
  assert.equal(f.call('status').mode, 'basic'); assert.equal(f.call('select', { mode: 'basic' }).status, 'unchanged'); assert.equal(f.call('switch', { mode: 'basic' }).status, 'unchanged'); assert.deepEqual(fs.readFileSync(filename), bytes);
  assert.throws(() => f.call('select', { mode: 'devflow' }), /explicit session switch/); assert.deepEqual(fs.readFileSync(filename), bytes);
  const switched = f.call('switch', { mode: 'devflow' }); assert.equal(switched.status, 'switched'); assert.equal(switched.selection.selectedAt, selected.selection.selectedAt); assert.deepEqual(switched.selection.history.map(x => [x.action, x.mode]), [['select', 'basic'], ['switch', 'devflow']]);
  assert.throws(() => f.call('status', {}, { standardVersion: 'b'.repeat(64) }), /Standard version changed/);
  const upgrade = f.call('switch', { mode: 'devflow' }, { standardVersion: 'b'.repeat(64) }); assert.equal(upgrade.selection.history.length, 3); assert.equal(upgrade.selection.standardVersion, 'b'.repeat(64));
});

test('TC-SESSION-004/005: Git worktrees share root choice while forks, harnesses and projects isolate it; child writes fail', t => {
  const f = setup(t); const chosen = f.call('select', { mode: 'devflow' }); const bytes = fs.readFileSync(f.file(chosen));
  const worktree = path.join(f.base, 'linked worktree'); git(f.repo, 'worktree', 'add', '--detach', worktree, 'HEAD');
  assert.deepEqual(f.call('status', { repo: worktree }).identity, chosen.identity);
  assert.equal(f.call('status', { sessionId: 'forked-session' }).status, 'awaiting-selection');
  for (const agent of ['zcode', 'claude']) assert.equal(f.call('status', { agent }).status, 'awaiting-selection');
  const other = fixture(t); assert.equal(f.call('status', { repo: other.repo }).status, 'awaiting-selection');
  const child = f.call('status', { sessionId: 'synthetic-child', rootSessionId: 'synthetic-root' }); assert.equal(child.mode, 'devflow'); assert.equal(child.inherited, true); assert.deepEqual(child.identity, chosen.identity);
  for (const action of ['select', 'switch']) assert.throws(() => f.call(action, { sessionId: 'synthetic-child', rootSessionId: 'synthetic-root', mode: 'basic' }), /Child agents/);
  assert.deepEqual(fs.readFileSync(f.file(chosen)), bytes);
  const plain = path.join(f.base, 'non-git'); fs.mkdirSync(plain); const nonGit = f.call('select', { repo: plain, mode: 'basic' }); assert.equal(f.call('status', { repo: plain }).identity.project, nonGit.identity.project); assert.notEqual(nonGit.identity.project, chosen.identity.project);
  write(plain, '.git', 'gitdir: /does-not-exist\n'); assert.throws(() => f.call('status', { repo: plain }));
});

test('TC-SESSION-006: corrupt, mismatched and malformed history records never become a fresh selection', t => {
  for (const mutate of [r => '{bad', r => JSON.stringify({ ...r, schemaVersion: 2 }), r => JSON.stringify({ ...r, identity: { ...r.identity, agent: 'claude' } }), r => JSON.stringify({ ...r, history: [] }), r => JSON.stringify({ ...r, mode: 'devflow' }), r => JSON.stringify({ ...r, hidden: true }), r => JSON.stringify({ ...r, selectedAt: 'yesterday' })]) {
    const f = setup(t); const filename = f.file(f.call('select', { mode: 'basic' })); const record = JSON.parse(fs.readFileSync(filename)); fs.writeFileSync(filename, mutate(record)); const before = snapshot(f.home);
    for (const action of ['status', 'select', 'switch']) assert.throws(() => f.call(action, action === 'status' ? {} : { mode: 'basic' }));
    assert.deepEqual(snapshot(f.home), before);
  }
});

test('TC-SESSION-007: private records, links, unsafe paths and manual history are protected', t => {
  for (const kind of ['public-record', 'public-directory', 'hardlink', 'symlink', 'manual', 'lock', 'directory-record']) {
    const f = setup(t); const filename = f.file(f.call('select', { mode: 'basic' }));
    assert.equal(fs.statSync(filename).mode & 0o777, 0o600); assert.equal(fs.statSync(path.dirname(filename)).mode & 0o777, 0o700);
    if (kind === 'public-record') fs.chmodSync(filename, 0o644);
    if (kind === 'public-directory') fs.chmodSync(path.dirname(filename), 0o755);
    if (kind === 'hardlink') fs.linkSync(filename, path.join(f.base, 'record-link'));
    if (kind === 'symlink') { const copy = path.join(f.base, 'saved-record'); fs.renameSync(filename, copy); fs.symlinkSync(copy, filename); }
    if (kind === 'directory-record') { fs.unlinkSync(filename); fs.mkdirSync(filename, { mode: 0o700 }); }
    if (kind === 'manual' || kind === 'lock') fs.writeFileSync(filename.replace(/\.json$/, kind === 'manual' ? '.manual.json' : '.lock'), '{}', { mode: 0o600 });
    const before = snapshot(f.home); assert.throws(() => f.call('status'));
    if (kind !== 'lock') for (const action of ['select', 'switch']) assert.throws(() => f.call(action, { mode: 'basic' }));
    else assert.throws(() => f.call('switch', { mode: 'devflow' }));
    assert.deepEqual(snapshot(f.home), before, kind);
  }
  const f = setup(t); const alias = path.join(f.base, 'alias'); fs.symlinkSync(f.home, alias);
  for (const stateHome of ['relative', `${f.home}/../escape`, alias]) assert.throws(() => f.call('select', { mode: 'basic' }, { stateHome }));
  for (const sessionId of ['', '../escape', 'a/b', '中文', 'x'.repeat(257)]) assert.throws(() => f.call('select', { mode: 'basic', sessionId }));
});

test('TC-SESSION-008: disk write, fsync and publication failures never claim durable success', t => {
  for (const kind of ['write', 'fsync', 'rename', 'directory-fsync']) {
    const f = setup(t); const filename = f.file(f.call('select', { mode: 'basic' })); const before = fs.readFileSync(filename);
    const originals = { writeFileSync: fs.writeFileSync, fsyncSync: fs.fsyncSync, renameSync: fs.renameSync }; let triggered = false;
    try {
      if (kind === 'write') fs.writeFileSync = function (fd, value, ...args) { if (typeof fd === 'number' && Buffer.isBuffer(value)) { triggered = true; throw new Error('TEST_ENOSPC'); } return originals.writeFileSync.call(this, fd, value, ...args); };
      if (kind === 'fsync' || kind === 'directory-fsync') fs.fsyncSync = function (fd) { const directory = fs.fstatSync(fd).isDirectory(); if ((kind === 'directory-fsync') === directory) { triggered = true; throw new Error('TEST_FSYNC_FAILURE'); } return originals.fsyncSync.call(this, fd); };
      if (kind === 'rename') fs.renameSync = function (from, to) { if (to === filename) { triggered = true; throw new Error('TEST_RENAME_FAILURE'); } return originals.renameSync.call(this, from, to); };
      assert.throws(() => f.call('switch', { mode: 'devflow' })); assert(triggered);
    } finally { Object.assign(fs, originals); }
    if (kind === 'write' || kind === 'fsync') { assert.deepEqual(fs.readFileSync(filename), before); assert.equal(f.call('status').mode, 'basic'); assert.equal(fs.readdirSync(path.dirname(filename)).some(x => x.endsWith('.tmp') || x.endsWith('.lock')), false); }
    else { assert.throws(() => f.call('status'), /in progress or interrupted/); assert(fs.existsSync(filename.replace(/\.json$/, '.lock'))); }
  }
});

test('TC-SESSION-008: independent processes cannot overwrite a concurrent explicit selection', async t => {
  const f = setup(t);
  const child = mode => new Promise((resolve, reject) => {
    const p = spawn(NODE, [GOVERNANCE, 'session', 'select', '--repo', f.repo, '--agent', 'codex', '--session-id', 'race-root', '--mode', mode], { env: { ...process.env, HOME: f.home, USERPROFILE: f.home, XDG_STATE_HOME: f.state }, timeout: 30000 }); let stdout = '', stderr = '';
    p.stdout.on('data', value => stdout += value); p.stderr.on('data', value => stderr += value); p.on('error', reject); p.on('close', code => resolve({ code, stdout, stderr }));
  });
  const results = await Promise.all([child('basic'), child('devflow')]); assert.equal(results.filter(x => x.code === 0).length, 1, JSON.stringify(results)); assert.equal(results.filter(x => x.code === 2).length, 1);
  const selected = json(results.find(x => x.code === 0)); assert.equal(selected.selection.history.length, 1);
  const status = run(NODE, [GOVERNANCE, 'session', 'status', '--repo', f.repo, '--agent', 'codex', '--session-id', 'race-root'], { env: { ...process.env, HOME: f.home, USERPROFILE: f.home, XDG_STATE_HOME: f.state } }); assert.equal(status.code, 0); assert.deepEqual(json(status).selection, selected.selection);
});

test('TC-SESSION-007/008: denied writes and a concurrent record mutation are preserved without false persistence', t => {
  for (const kind of ['denied', 'changed']) {
    const f = setup(t); const filename = f.file(f.call('select', { mode: 'basic' })); const initial = fs.readFileSync(filename); const original = fs.writeFileSync; let triggered = false; let concurrent;
    try {
      fs.writeFileSync = function (fd, value, ...args) {
        if (!triggered && typeof fd === 'number' && Buffer.isBuffer(value)) {
          triggered = true;
          if (kind === 'denied') throw Object.assign(new Error('TEST_EACCES'), { code: 'EACCES' });
          concurrent = Buffer.concat([initial, Buffer.from(' \n')]); original(filename, concurrent);
        }
        return original.call(this, fd, value, ...args);
      };
      assert.throws(() => f.call('switch', { mode: 'devflow' }), kind === 'denied' ? /TEST_EACCES/ : /changed before atomic publication/); assert(triggered);
    } finally { fs.writeFileSync = original; }
    assert.deepEqual(fs.readFileSync(filename), concurrent ?? initial); assert.equal(f.call('status').mode, 'basic');
  }
});
