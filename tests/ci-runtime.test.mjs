import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, NODE, fixture, write, run, json, snapshot, git, policy } from './helpers.mjs';
import { preparedRuntime, runtimePackage } from './teamai-fixtures.mjs';
import { sourceFixture } from './source-fixtures.mjs';

test('TC-CI-001: trusted team base checker rejects candidate policy/tool weakening', t => {
  const f = sourceFixture(t);
  write(f.repo, 'governance.json', JSON.stringify(policy())); const base = f.commit();
  const invoke = b => run(NODE, [path.join(ROOT, 'scripts/ci-check.mjs'), '--repo', f.repo, '--base', b, '--policy', 'governance.json']);
  assert.equal(invoke(base).code, 0);
  write(f.repo, 'README.md', '[broken](missing.md)\n'); write(f.repo, 'governance.json', JSON.stringify(policy({ entrypoints: [], documentRoots: [] })));
  write(f.repo, 'skills/common/collaborative-foundation-infra/scripts/governance.mjs', 'console.log(JSON.stringify({status:"pass",findings:[]}));\n');
  const result = invoke(base); assert.equal(result.code, 1, result.stdout); const report = json(result); assert.equal(report.trustedBase, base); assert.equal(report.requiresGovernanceReview, true); assert(report.check.findings.some(v => v.code === 'BROKEN_LINK'));
  assert.equal(invoke('0'.repeat(40)).code, 2); assert.equal(invoke(base.slice(0, 7)).code, 2);
});

test('TC-CI-001: actual deployed business layout verifies without business npm lock', t => {
  const f = fixture(t);
  const distribution = run(NODE, [path.join(ROOT, 'scripts/teamai-sync.mjs'), '--repo', f.repo, '--source', ROOT, '--agent', 'codex', '--user-home', f.home, '--data-home', preparedRuntime().dataHome, '--teamai-entry', preparedRuntime().entry, '--apply'], { timeout: 60000, env: { ...process.env, HOME: f.home, USERPROFILE: f.home } });
  assert.equal(distribution.code, 0, distribution.stdout); write(f.repo, 'governance.json', JSON.stringify(policy())); const base = f.commit();
  const invoke = () => run(NODE, [path.join(ROOT, 'scripts/ci-check.mjs'), '--repo', f.repo, '--base', base, '--policy', 'governance.json', '--layout', 'codex']);
  const result = invoke(); assert.equal(result.code, 0, result.stdout); assert.equal(fs.existsSync(path.join(f.repo, 'package-lock.json')), false);
  write(f.repo, '.agents/skills/collaborative-foundation-infra/scripts/governance.mjs', 'console.log("weak candidate");\n'); write(f.repo, 'README.md', '[broken](missing.md)\n');
  const candidate = invoke(); assert.equal(candidate.code, 1, candidate.stdout); assert.equal(json(candidate).requiresGovernanceReview, true); assert(json(candidate).check.findings.some(v => v.code === 'BROKEN_LINK'));
});

function runtimeEnv(f, curlScript) {
  const bin = path.join(f.base, 'bin'); fs.mkdirSync(bin);
  for (const cmd of ['bash', 'dirname', 'mkdir', 'uname', 'mktemp', 'tar', 'sha256sum', 'mv', 'unlink', 'rmdir', 'xz', 'gzip', 'env']) {
    const location = ['/usr/bin', '/bin'].map(dir => path.join(dir, cmd)).find(file => fs.existsSync(file)); assert(location, cmd); fs.symlinkSync(location, path.join(bin, cmd));
  }
  if (curlScript) { write(bin, 'curl', `#!/bin/bash\n${curlScript}\n`); fs.chmodSync(path.join(bin, 'curl'), 0o755); }
  else fs.symlinkSync('/usr/bin/curl', path.join(bin, 'curl'));
  return { ...process.env, PATH: bin, HOME: f.home, USERPROFILE: f.home, XDG_CACHE_HOME: path.join(f.home, '.cache'), TMPDIR: f.base };
}
function runtime(f, kind, environment, args = [], timeout = 150000) {
  return run('/bin/bash', [path.join(ROOT, 'scripts/runtime'), '--runtime', kind, '--cache', path.join(f.home, 'runtimes'), ...args], { env: environment, timeout });
}

test('TC-ENV-004: documented wrappers and generated governance entry preserve executable command contracts', t => {
  const f = fixture(t), env = { ...process.env, PATH: `${path.dirname(NODE)}:${process.env.PATH}`, HOME: f.home, USERPROFILE: f.home };
  for (const file of ['scripts/runtime', 'scripts/governance', 'skills/common/collaborative-foundation-infra/scripts/governance.mjs']) assert(fs.statSync(path.join(ROOT, file)).mode & 0o100, file);
  const runtimeResult = run(path.join(ROOT, 'scripts/runtime'), ['--runtime', 'node', '--', '--version'], { env });
  assert.equal(runtimeResult.code, 0, runtimeResult.stderr); assert.match(runtimeResult.stdout, /^v24\./);
  for (const executable of [path.join(ROOT, 'scripts/governance'), path.join(ROOT, 'skills/common/collaborative-foundation-infra/scripts/governance.mjs')]) {
    const result = run(executable, ['check', '--repo', f.repo, '--policy', f.policyFile, '--format', 'json'], { env });
    assert.equal(result.code, 0, result.stdout + result.stderr); assert.equal(json(result).status, 'pass');
  }
  assert.equal(fs.existsSync(path.join(f.home, '.cache')), false);
});

test('TC-ENV-001: existing Node 24 is reused without cache or dependency writes', t => {
  const f = fixture(t); const before = snapshot(f.repo); const environment = { ...process.env, PATH: `${path.dirname(NODE)}:${process.env.PATH}`, HOME: f.home };
  const result = runtime(f, 'node', environment, ['--', '--version']); assert.equal(result.code, 0, result.stderr); assert.match(result.stdout, /^v24\./); assert.equal(fs.existsSync(path.join(f.home, 'runtimes')), false); assert.deepEqual(snapshot(f.repo), before);
});

test('TC-ENV-002: network/checksum/offline failures fall back after attempting user install', t => {
  for (const kind of ['network', 'checksum', 'offline']) {
    const f = fixture(t); const fake = kind === 'checksum' ? 'while (($#)); do if [[ "$1" == --output ]]; then printf bad > "$2"; exit 0; fi; shift; done; exit 1' : 'exit 22';
    const environment = runtimeEnv(f, fake); if (kind === 'offline') environment.COLLABORATIVE_FOUNDATION_INFRA_RUNTIME_OFFLINE = '1';
    const before = snapshot(f.repo); const result = runtime(f, 'node', environment); assert.equal(result.code, 2, `${kind}: ${result.stderr}`); assert.match(result.stderr, /Attempting verified user-directory installation/); assert.match(result.stderr, /Markdown fallback/); assert.match(result.stderr, /Automated checks did NOT pass/); assert.deepEqual(snapshot(f.repo), before);
  }
});

test('TC-RUNTIME-001: canonical offline variable prevents download and uses the default user cache namespace', t => {
  const f = fixture(t); const sentinel = path.join(f.base, 'network-called');
  const environment = runtimeEnv(f, 'printf attempted > "$TEST_CURL_SENTINEL"; exit 22');
  environment.TEST_CURL_SENTINEL = sentinel;
  environment.COLLABORATIVE_FOUNDATION_INFRA_RUNTIME_OFFLINE = '1';
  const before = snapshot(f.repo);
  const result = run('/bin/bash', [path.join(ROOT, 'scripts/runtime'), '--runtime', 'node', '--', '--version'], { env: environment });
  assert.equal(result.code, 2, result.stdout + result.stderr);
  assert.match(result.stderr, /offline: runtime is unavailable locally/);
  assert.match(result.stderr, /Markdown fallback: read the distributed collaborative-foundation-infra\/SKILL\.md/);
  assert.equal(fs.existsSync(sentinel), false, 'offline mode attempted a network download');
  assert(fs.statSync(path.join(f.home, '.cache/collaborative-foundation-infra/runtimes')).isDirectory());
  assert.deepEqual(snapshot(f.repo), before); assert.equal(fs.existsSync(path.join(f.home, '.bashrc')), false);
});

test('TC-ENV-001/002: real verified Node user install and offline cache reuse', t => {
  const f = fixture(t); const environment = runtimeEnv(f); const before = snapshot(f.repo);
  const installed = runtime(f, 'node', environment, ['--', '--version']); assert.equal(installed.code, 0, installed.stderr); assert.equal(installed.stdout.trim(), 'v24.20.0'); assert.match(installed.stderr, /Attempting verified/);
  const cached = runtime(f, 'node', { ...environment, COLLABORATIVE_FOUNDATION_INFRA_RUNTIME_OFFLINE: '1' }, ['--', '--version']); assert.equal(cached.code, 0, cached.stderr); assert.equal(cached.stdout.trim(), 'v24.20.0'); assert.deepEqual(snapshot(f.repo), before);
  assert.equal(fs.existsSync(path.join(f.home, '.bashrc')), false);
});

test('TC-ENV-003: Python auxiliary action reuses installed Python and does not install uv unnecessarily', t => {
  const f = fixture(t); const result = runtime(f, 'python', { ...process.env, HOME: f.home }, ['--', '--version']); assert.equal(result.code, 0, result.stderr); assert.match(result.stdout, /^Python 3\./); assert.equal(fs.existsSync(path.join(f.home, 'runtimes')), false);
});

test('TC-ENV-003: Python offline managed cache is used without attempting network', t => {
  const f = fixture(t); const environment = runtimeEnv(f, 'exit 99'); environment.COLLABORATIVE_FOUNDATION_INFRA_RUNTIME_OFFLINE = '1';
  const cache = path.join(f.home, 'runtimes'); const python = path.join(cache, 'python/cpython-3.12.14-linux-x86_64-gnu/bin/python3.12');
  write(f.home, 'runtimes/python/cpython-3.12.14-linux-x86_64-gnu/bin/python3.12', '#!/bin/bash\nif [[ "$1" == -c ]]; then exit 0; fi\nprintf "Python 3.12.14\\n"\n'); fs.chmodSync(python, 0o755);
  const uv = path.join(environment.PATH, 'uv'); write(environment.PATH, 'uv', `#!/bin/bash\nif [[ "$1" == --version ]]; then printf 'uv 0.12.9 (fixture)\\n'; exit 0; fi\nfor arg in "$@"; do if [[ "$arg" == find ]]; then printf '%s\\n' '${python}'; exit 0; fi; done\nexit 98\n`); fs.chmodSync(uv, 0o755);
  const result = runtime(f, 'python', environment, ['--', '--version']); assert.equal(result.code, 0, result.stderr); assert.equal(result.stdout.trim(), 'Python 3.12.14');
});

test('TC-ENV-002: incompatible uv cache is rejected rather than executed', t => {
  const f = fixture(t); const environment = runtimeEnv(f, 'exit 99'); environment.COLLABORATIVE_FOUNDATION_INFRA_RUNTIME_OFFLINE = '1';
  const executable = path.join(f.home, 'runtimes/uv-x86_64-unknown-linux-gnu/uv');
  write(f.home, 'runtimes/uv-x86_64-unknown-linux-gnu/uv', '#!/bin/bash\nprintf "uv 0.10.0 (old fixture)\\n"\n'); fs.chmodSync(executable, 0o755);
  const result = runtime(f, 'uv', environment); assert.equal(result.code, 2, result.stdout + result.stderr); assert.match(result.stderr, /Markdown fallback/);
});
