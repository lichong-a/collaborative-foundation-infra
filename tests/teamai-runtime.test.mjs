import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, NODE, fixture, snapshot, run, write, hash } from './helpers.mjs';
import { prepareTeamai, resolveTeamaiRuntime, verifyTeamaiInstallation } from '../tools/teamai-runtime.mjs';
import { npmFixture, runtimeNamespace, cloneRuntime, preparedRuntime, runtimeMetadata, runtimePackage } from './teamai-fixtures.mjs';
import { cloneLegacyRuntime } from './teamai-legacy-fixtures.mjs';
import { sourceFixture } from './source-fixtures.mjs';

test('TC-TA-RUNTIME-006 / PROD-TA-RUNTIME-001: a failed cleanup preserves the prior current pointer and installation', t => {
  const f = fixture(t), dataHome = path.join(f.base, 'runtime'), options = { source: ROOT, dataHome };
  const first = prepareTeamai(options, npmFixture());
  const namespace = runtimeNamespace(dataHome), pointer = path.join(namespace, 'current.json');
  const priorPointer = fs.readFileSync(pointer), oldInstallation = path.join(namespace, 'installations', first.installationId);
  const priorInstallation = snapshot(oldInstallation);
  const original = fs.rmSync; let injected = false, failure;
  fs.rmSync = (target, ...rest) => {
    if (!injected && path.dirname(String(target)) === namespace && path.basename(String(target)).startsWith('.prepare-')) {
      injected = true; throw Object.assign(new Error('Synthetic cleanup EIO'), { code: 'EIO' });
    }
    return original(target, ...rest);
  };
  try { prepareTeamai({ ...options, upgrade: true }, npmFixture()); } catch (error) { failure = error; }
  finally { fs.rmSync = original; }
  assert(injected, 'the cleanup fault must be reached after a complete actual CLI candidate');
  assert(failure, 'the injected filesystem failure must be reported');
  assert.deepEqual(snapshot(oldInstallation), priorInstallation, 'old installation is immutable on failure');
  assert.deepEqual(fs.readFileSync(pointer), priorPointer, 'failure must not silently select the new runtime');
  assert.equal(fs.existsSync(path.join(namespace, 'prepare.lock')), false, 'own lock is released even when work cleanup fails');
});

test('TC-TA-RUNTIME-006: an independent reader cannot acquire an installation before preparation unlock succeeds', t => {
  const f = fixture(t), options = cloneRuntime(f), namespace = runtimeNamespace(options.dataHome);
  const pointer = path.join(namespace, 'current.json'), before = fs.readFileSync(pointer);
  const close = fs.closeSync, remove = fs.rmSync;
  let workRemoved = false, reader, failure, entryWasPresent = false;
  fs.rmSync = (target, ...rest) => {
    const result = remove(target, ...rest);
    if (path.dirname(String(target)) === namespace && path.basename(String(target)).startsWith('.prepare-')) workRemoved = true;
    return result;
  };
  fs.closeSync = fd => {
    if (!workRemoved || reader || !fs.existsSync(path.join(namespace, 'prepare.lock'))) return close(fd);
    const held = fs.fstatSync(fd), lock = fs.statSync(path.join(namespace, 'prepare.lock'));
    if (workRemoved && !reader && held.ino === lock.ino && held.dev === lock.dev) {
      const code = `import {resolveTeamaiRuntime} from ${JSON.stringify(new URL('../tools/teamai-runtime.mjs', import.meta.url).href)}; try { const runtime=resolveTeamaiRuntime(${JSON.stringify(options)}); console.log(JSON.stringify({entry:runtime.entry})); } catch(error) { console.log(JSON.stringify({error:error.message})); process.exitCode=2; }`;
      reader = run(NODE, ['--input-type=module', '-e', code]);
      if (reader.code === 0) entryWasPresent = fs.existsSync(JSON.parse(reader.stdout).entry);
      close(fd); throw Object.assign(new Error('Synthetic final lock close EIO'), { code: 'EIO' });
    }
    return close(fd);
  };
  try { prepareTeamai({ ...options, upgrade: true }, npmFixture()); } catch (error) { failure = error; }
  finally { fs.closeSync = close; fs.rmSync = remove; }
  t.diagnostic(JSON.stringify({ boundaryReached: Boolean(reader), workRemoved, failure: failure?.message }));
  assert(failure && reader, 'reader must run at the post-cleanup, pre-unlock publication boundary');
  const entryStillPresent = reader.code === 0 && fs.existsSync(JSON.parse(reader.stdout).entry);
  t.diagnostic(JSON.stringify({ reader, entryWasPresent, entryStillPresent, failure: failure.message }));
  assert.deepEqual(fs.readFileSync(pointer), before, 'writer failure restores the previous pointer');
  assert.equal(reader.code, 2, 'a separate reader must refuse the still-locked tentative publication');
});

for (const replace of ['candidate', 'work']) test(`TC-TA-RUNTIME-005/006 / PROD-TA-RUNTIME-002: preserve a concurrently replaced ${replace} directory`, t => {
  const f = fixture(t), dataHome = path.join(f.base, 'runtime');
  let replacement, moved, sentinel;
  const boundary = npmFixture({ intercept: request => {
    if ((replace === 'candidate' && request.operation === 'install') || (replace === 'work' && request.operation === 'resolve')) {
      replacement = replace === 'candidate' ? path.dirname(request.cwd) : request.cwd;
      moved = path.join(f.base, `original-${replace}`);
      fs.renameSync(replacement, moved); fs.mkdirSync(replacement, { mode: 0o700 });
      sentinel = path.join(replacement, 'unowned.txt'); fs.writeFileSync(sentinel, 'Concurrent writer owns these bytes.\n');
      throw new Error('Synthetic npm failure after concurrent directory replacement');
    }
  } });
  assert.throws(() => prepareTeamai({ source: ROOT, dataHome }, boundary));
  assert(replacement && fs.existsSync(moved), 'the directory identity really changed');
  assert.equal(fs.existsSync(sentinel), true, 'cleanup must not recursively delete replacement content');
  assert.equal(fs.readFileSync(sentinel, 'utf8'), 'Concurrent writer owns these bytes.\n');
  assert.equal(fs.existsSync(path.join(runtimeNamespace(dataHome), 'current.json')), false);
});

test('TC-TA-RUNTIME-001/002/003: verified preparation, offline reuse and explicit upgrade bind actual CLI identity and retain old installation', t => {
  const f = fixture(t), options = { source: ROOT, dataHome: path.join(f.base, 'runtime') };
  const npm = npmFixture({ intercept: request => {
    for (const flag of ['--ignore-scripts', '--no-audit', '--no-fund', '--no-bin-links']) assert(request.args.includes(flag));
    assert.equal(request.args[request.args.indexOf('--registry') + 1], 'https://registry.npmjs.org');
    for (const key of ['HOME', 'NPM_CONFIG_USERCONFIG', 'NPM_CONFIG_GLOBALCONFIG', 'NPM_CONFIG_CACHE', 'NPM_CONFIG_PREFIX']) assert(request.env[key].startsWith(runtimeNamespace(options.dataHome) + path.sep));
    assert.equal(request.env.NPM_CONFIG_IGNORE_SCRIPTS, 'true');
    if (request.operation === 'pack') assert.equal(request.args[1], runtimeMetadata.dist.tarball);
    if (request.operation === 'install') assert(request.args[1].endsWith('/archive.tgz'));
  } });
  const first = prepareTeamai(options, npm); assert.equal(first.status, 'installed'); assert.deepEqual(npm.calls, ['resolve', 'pack', 'install']);
  assert.equal(first.package.version, runtimePackage.version); assert.equal(first.package.integrity, runtimePackage.integrity);
  assert.deepEqual(Object.keys(first.compatibility.agents).sort(), ['claude', 'codex', 'zcode']);
  const namespace = runtimeNamespace(options.dataHome), before = snapshot(namespace);
  const noNpm = { runNpm() { assert.fail('offline reuse attempted npm'); } };
  const reused = prepareTeamai({ ...options, offline: true }, noNpm); assert.equal(reused.status, 'reused'); assert.equal(reused.entry, first.entry); assert.deepEqual(snapshot(namespace), before);
  assert.equal(resolveTeamaiRuntime({ ...options, teamaiEntry: first.entry }).entry, first.entry);
  const old = path.join(namespace, 'installations', first.installationId), bytes = snapshot(old);
  const upgraded = prepareTeamai({ ...options, upgrade: true }, npmFixture()); assert.equal(upgraded.status, 'upgraded'); assert.notEqual(upgraded.installationId, first.installationId);
  assert.deepEqual(snapshot(old), bytes); assert.equal(resolveTeamaiRuntime(options).entry, upgraded.entry);
  assert.equal(fs.statSync(namespace).mode & 0o777, 0o700); assert.equal(fs.statSync(path.join(namespace, 'current.json')).mode & 0o777, 0o600);
  assert.equal(fs.statSync(path.join(namespace, 'installations', upgraded.installationId, 'receipt.json')).mode & 0o777, 0o600);
});

test('TC-TA-RUNTIME-003/004: registry, fixed archive, integrity, install and offline upgrade failures preserve prior runtime bytes', t => {
  for (const kind of ['registry', 'metadata', 'pack', 'integrity', 'install', 'offline']) {
    const f = fixture(t), options = cloneRuntime(f), before = snapshot(options.dataHome);
    const npm = npmFixture({ intercept: request => {
      if (kind === 'registry' && request.operation === 'resolve') throw new Error('Synthetic registry unavailable');
      if (kind === 'metadata' && request.operation === 'resolve') return JSON.stringify({ ...runtimeMetadata, name: 'untrusted-cli' });
      if (kind === 'pack' && request.operation === 'pack') return JSON.stringify([{ filename: '../outside.tgz' }]);
      if (kind === 'integrity' && request.operation === 'pack') { fs.writeFileSync(path.join(request.cwd, 'corrupt.tgz'), 'not the SRI archive'); return JSON.stringify([{ filename: 'corrupt.tgz' }]); }
      if (kind === 'install' && request.operation === 'install') throw new Error('Synthetic npm install failure');
    } });
    assert.throws(() => prepareTeamai({ ...options, upgrade: true, offline: kind === 'offline' }, npm));
    assert.deepEqual(snapshot(options.dataHome), before, kind); assert(fs.existsSync(resolveTeamaiRuntime(options).entry));
    if (kind === 'offline') assert.deepEqual(npm.calls, []);
  }
});

test('TC-TA-RUNTIME-004/007: missing, foreign, tampered, linked and unknown runtime state is rejected without repairs', t => {
  for (const kind of ['bare-entry', 'receipt', 'pointer', 'file', 'archive', 'package-lock', 'unknown-install', 'unknown-namespace', 'linked-current', 'permissions', 'lock']) {
    const f = fixture(t), options = cloneRuntime(f), namespace = runtimeNamespace(options.dataHome), runtime = resolveTeamaiRuntime(options), pointer = path.join(namespace, 'current.json');
    if (kind === 'receipt') fs.appendFileSync(path.join(runtime.installation, 'receipt.json'), ' ');
    if (kind === 'pointer') fs.writeFileSync(pointer, '{"installationId":"bad"}');
    if (kind === 'file') fs.appendFileSync(runtime.entry, '// mutation');
    if (kind === 'archive') fs.appendFileSync(path.join(runtime.installation, 'archive.tgz'), 'mutation');
    if (kind === 'package-lock') fs.appendFileSync(path.join(runtime.installation, 'install/package-lock.json'), ' ');
    if (kind === 'unknown-install') write(runtime.installation, 'unknown.txt', 'user bytes');
    if (kind === 'unknown-namespace') write(namespace, 'unknown.txt', 'user bytes');
    if (kind === 'linked-current') fs.linkSync(pointer, path.join(f.base, 'linked.json'));
    if (kind === 'permissions') fs.chmodSync(namespace, 0o755);
    if (kind === 'lock') write(namespace, 'prepare.lock', 'other writer');
    const before = snapshot(f.base);
    assert.throws(() => resolveTeamaiRuntime({ ...options, ...(kind === 'bare-entry' ? { teamaiEntry: path.join(ROOT, 'node_modules/teamai-cli/dist/index.js') } : {}) }), undefined, kind);
    assert.deepEqual(snapshot(f.base), before, kind);
  }
});

test('TC-TA-RUNTIME-005: relative and linked roots, offline absence and a concurrent writer fail without taking ownership', t => {
  const f = fixture(t); const missing = path.join(f.base, 'missing'); const before = snapshot(f.base);
  assert.throws(() => prepareTeamai({ source: ROOT, dataHome: missing, offline: true }), /Offline/);
  assert.throws(() => prepareTeamai({ source: ROOT, dataHome: 'relative' }), /absolute/); assert.deepEqual(snapshot(f.base), before);
  const outside = path.join(f.base, 'outside'); fs.mkdirSync(outside); const linked = path.join(f.base, 'linked'); fs.symlinkSync(outside, linked);
  const linkedBefore = snapshot(f.base); assert.throws(() => prepareTeamai({ source: ROOT, dataHome: linked }), /unsafe/); assert.deepEqual(snapshot(f.base), linkedBefore);
  const options = { source: ROOT, dataHome: path.join(f.base, 'contended') }; let rival;
  const npm = npmFixture({ intercept: request => {
    if (request.operation === 'resolve') {
      rival = run(NODE, [path.join(ROOT, 'scripts/teamai-runtime.mjs'), 'prepare', '--source', ROOT, '--data-home', options.dataHome, '--offline']);
      throw new Error('Stop owning writer after concurrent observation');
    }
  } });
  assert.throws(() => prepareTeamai(options, npm)); assert.equal(rival.code, 2); assert.deepEqual(npm.calls, ['resolve']);
  assert.equal(fs.existsSync(path.join(runtimeNamespace(options.dataHome), 'current.json')), false);
  assert.equal(fs.existsSync(path.join(runtimeNamespace(options.dataHome), 'prepare.lock')), false);
});

test('TC-TA-RUNTIME-006: lock unlink failure restores old selection; replaced lock and work remain untouched', t => {
  for (const kind of ['unlink', 'replacement']) {
    const f = fixture(t), options = cloneRuntime(f), namespace = runtimeNamespace(options.dataHome), pointer = path.join(namespace, 'current.json'), before = fs.readFileSync(pointer);
    const initial = resolveTeamaiRuntime(options), previousInstallation = snapshot(initial.installation), unlink = fs.unlinkSync; let hit = false;
    const npm = npmFixture({ intercept: request => {
      if (kind === 'replacement' && request.operation === 'resolve') {
        const lock = path.join(namespace, 'prepare.lock'); fs.renameSync(lock, path.join(f.base, 'owned-lock')); fs.writeFileSync(lock, 'unowned lock', { mode: 0o600 }); hit = true; throw new Error('Stop after lock replacement');
      }
    } });
    if (kind === 'unlink') fs.unlinkSync = target => { if (!hit && target === path.join(namespace, 'prepare.lock')) { hit = true; throw new Error('Synthetic lock release EIO'); } return unlink(target); };
    let failure; try { prepareTeamai({ ...options, upgrade: true }, npm); } catch (error) { failure = error; } finally { fs.unlinkSync = unlink; }
    assert(hit && failure); assert.deepEqual(fs.readFileSync(pointer), before); assert.deepEqual(snapshot(initial.installation), previousInstallation);
    assert.equal(verifyTeamaiInstallation({ source: ROOT, installation: initial.installation }).entry, initial.entry);
    assert.throws(() => resolveTeamaiRuntime(options), /progress|pending|lock|Unknown/i);
    if (kind === 'replacement') assert.equal(fs.readFileSync(path.join(namespace, 'prepare.lock'), 'utf8'), 'unowned lock');
  }
});

test('TC-TA-RUNTIME-005/006: early write and fsync failures do not publish a partial runtime or leak an owned lock', t => {
  for (const operation of ['writeFileSync', 'fsyncSync']) {
    const f = fixture(t), options = cloneRuntime(f), before = snapshot(options.dataHome), original = fs[operation]; let hit = false;
    fs[operation] = (...args) => { if (!hit) { hit = true; throw Object.assign(new Error('Synthetic early IO failure'), { code: 'EIO' }); } return original(...args); };
    try { assert.throws(() => prepareTeamai({ ...options, upgrade: true }, npmFixture())); } finally { fs[operation] = original; }
    assert(hit); assert.deepEqual(snapshot(options.dataHome), before);
  }
});

test('TC-TA-RUNTIME-002/008: changed standards reverify the same CLI offline and default XDG discovery preserves its receipt', t => {
  const f = sourceFixture(t), options = cloneRuntime(f), initial = resolveTeamaiRuntime(options);
  const record = fs.readFileSync(path.join(initial.installation, 'receipt.json'));
  fs.appendFileSync(path.join(f.repo, 'rules/collaborative-foundation-infra.md'), '\nSynthetic updated standard.\n');
  const changed = prepareTeamai({ ...options, source: f.repo, offline: true }, { runNpm() { assert.fail('standard revalidation queried npm'); } });
  assert.equal(changed.status, 'reused'); assert.equal(changed.entry, initial.entry);
  assert.notEqual(changed.compatibility.distributionDigest, initial.receipt.compatibility.distributionDigest);
  assert.deepEqual(fs.readFileSync(path.join(initial.installation, 'receipt.json')), record);
  const defaultCall = run(NODE, [path.join(ROOT, 'scripts/teamai-runtime.mjs'), 'prepare', '--source', ROOT, '--offline'], { env: { ...process.env, HOME: f.home, USERPROFILE: f.home, XDG_DATA_HOME: options.dataHome } });
  assert.equal(defaultCall.code, 0, defaultCall.stdout + defaultCall.stderr); assert.equal(JSON.parse(defaultCall.stdout).entry, initial.entry);
  assert.equal(fs.readdirSync(f.home).length, 0);
});


test('TC-TA-RUNTIME-009: real 0.24 installation remains unchanged until explicit upgrade verifies 0.25 and all three clients', t => {
  const f = fixture(t), legacy = cloneLegacyRuntime(f), namespace = runtimeNamespace(legacy.dataHome);
  const before = snapshot(legacy.dataHome), old = snapshot(legacy.installation), pointer = fs.readFileSync(path.join(namespace, 'current.json'));
  const noNpm = { runNpm() { assert.fail('ordinary preparation must not query npm to replace an incompatible runtime'); } };
  for (const offline of [true, false]) {
    assert.throws(() => prepareTeamai({ ...legacy, offline }, noNpm), error => {
      assert.match(error.message, /0\.24\.0/); assert.match(error.message, /teamai/); assert.match(error.message, /upgrade:teamai/); return true;
    });
    assert.deepEqual(snapshot(legacy.dataHome), before);
  }
  assert.throws(() => resolveTeamaiRuntime(legacy), /upgrade:teamai/);
  const npm = npmFixture(), upgraded = prepareTeamai({ ...legacy, upgrade: true }, npm);
  assert.deepEqual(npm.calls, ['resolve', 'pack', 'install']); assert.equal(upgraded.status, 'upgraded'); assert.equal(upgraded.package.version, '0.25.0');
  assert.deepEqual(Object.keys(upgraded.compatibility.agents).sort(), ['claude', 'codex', 'zcode']);
  for (const agent of Object.values(upgraded.compatibility.agents)) assert.equal(agent.status, 'verified');
  assert.deepEqual(snapshot(legacy.installation), old); assert.notDeepEqual(fs.readFileSync(path.join(namespace, 'current.json')), pointer);
  assert.equal(resolveTeamaiRuntime(legacy).entry, upgraded.entry); assert.equal(prepareTeamai({ ...legacy, offline: true }, noNpm).entry, upgraded.entry);
});

test('TC-TA-RUNTIME-010: failed cross-source upgrade preserves real 0.24 pointer and all prior installation bytes', t => {
  for (const kind of ['registry', 'candidate-content', 'cleanup']) {
    const f = fixture(t), legacy = cloneLegacyRuntime(f), namespace = runtimeNamespace(legacy.dataHome), pointer = path.join(namespace, 'current.json');
    const oldPointer = fs.readFileSync(pointer), oldInstallation = snapshot(legacy.installation), original = fs.rmSync;
    let injected = false;
    const npm = npmFixture({ intercept: request => {
      if (kind === 'registry' && request.operation === 'resolve') { injected = true; throw new Error('Synthetic registry outage'); }
      if (kind === 'candidate-content' && request.operation === 'install') {
        const output = execFileSync('npm', request.args, { cwd: request.cwd, env: request.env, timeout: request.timeout, encoding: 'utf8' });
        fs.appendFileSync(path.join(request.cwd, 'node_modules/teamai-cli/skills/teamai/SKILL.md'), '\nUnreviewed candidate bytes\n'); injected = true; return output;
      }
    } });
    if (kind === 'cleanup') fs.rmSync = (target, ...args) => {
      if (!injected && path.dirname(String(target)) === namespace && path.basename(String(target)).startsWith('.prepare-')) { injected = true; throw new Error('Synthetic cross-source cleanup failure'); }
      return original(target, ...args);
    };
    try { assert.throws(() => prepareTeamai({ ...legacy, upgrade: true }, npm)); } finally { fs.rmSync = original; }
    assert(injected, `must reach ${kind} after old installation integrity validation`);
    assert.deepEqual(fs.readFileSync(pointer), oldPointer); assert.deepEqual(snapshot(legacy.installation), oldInstallation);
    assert.deepEqual(npm.calls, kind === 'registry' ? ['resolve'] : ['resolve', 'pack', 'install']);
    assert.equal(fs.existsSync(path.join(namespace, 'prepare.lock')), false);
  }
});

test('TC-TA-RUNTIME-011: legacy source incompatibility never bypasses saved archive, receipt, files or lock integrity', t => {
  for (const kind of ['receipt-binding', 'builtin-digest', 'archive', 'file', 'lock']) {
    const f = fixture(t), legacy = cloneLegacyRuntime(f), namespace = runtimeNamespace(legacy.dataHome), receiptPath = path.join(legacy.installation, 'receipt.json');
    if (kind === 'receipt-binding') fs.appendFileSync(receiptPath, ' ');
    if (kind === 'archive') fs.appendFileSync(path.join(legacy.installation, 'archive.tgz'), 'tampered');
    if (kind === 'file') fs.appendFileSync(legacy.entry, '// tampered');
    if (kind === 'lock') fs.writeFileSync(path.join(namespace, 'prepare.lock'), 'another writer', { mode: 0o600 });
    if (kind === 'builtin-digest') {
      const receipt = JSON.parse(fs.readFileSync(receiptPath)); receipt.builtinSkillsDigest = '0'.repeat(64);
      const bytes = JSON.stringify(receipt); fs.writeFileSync(receiptPath, bytes);
      fs.writeFileSync(path.join(namespace, 'current.json'), JSON.stringify({ installationId: receipt.installationId, receiptSha256: hash(bytes) }));
    }
    const before = snapshot(legacy.dataHome), npm = { runNpm() { assert.fail('corrupt or locked prior runtime must fail before registry access'); } };
    assert.throws(() => prepareTeamai({ ...legacy, upgrade: true }, npm)); assert.deepEqual(snapshot(legacy.dataHome), before, kind);
  }
});
