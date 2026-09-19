import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import { after } from 'node:test';
import { ROOT } from './helpers.mjs';
import { prepareTeamai, resolveTeamaiRuntime } from '../tools/teamai-runtime.mjs';

// Fixed development input, distinct from the separately recorded live latest query.
export const runtimePackage = JSON.parse(fs.readFileSync(path.join(ROOT, 'package-lock.json'))).packages['node_modules/teamai-cli'];
export const runtimeMetadata = { name: 'teamai-cli', version: runtimePackage.version, dist: { tarball: runtimePackage.resolved, integrity: runtimePackage.integrity } };
export const runtimeNamespace = dataHome => path.join(dataHome, 'collaborative-foundation-infra/teamai');
let shared, ownedDataHome;
after(() => { if (ownedDataHome) fs.rmSync(ownedDataHome, { recursive: true, force: true }); });
export function preparedRuntime() {
  if (!shared) {
    const supplied = process.env.COLLABORATIVE_FOUNDATION_INFRA_TEST_TEAMAI_DATA_HOME;
    const dataHome = supplied || (ownedDataHome = fs.mkdtempSync(path.join(os.tmpdir(), 'cfi-test-runtime-')));
    const runtime = supplied ? resolveTeamaiRuntime({ source: ROOT, dataHome }) : prepareTeamai({ source: ROOT, dataHome }, npmFixture());
    shared = { ...runtime, dataHome };
  }
  return shared;
}
export function cloneRuntime(f) {
  const original = preparedRuntime(), dataHome = path.join(f.base, 'runtime');
  fs.cpSync(original.dataHome, dataHome, { recursive: true });
  // cpSync creates directories using the process umask; private runtime receipts
  // also cover directory modes, so a relocation fixture must preserve them.
  const modes = (from, to) => {
    fs.chmodSync(to, fs.statSync(from).mode & 0o777);
    if (fs.statSync(from).isDirectory()) for (const name of fs.readdirSync(from)) modes(path.join(from, name), path.join(to, name));
  };
  modes(original.dataHome, dataHome);
  return { source: ROOT, dataHome };
}

export function npmFixture({ archive = process.env.COLLABORATIVE_FOUNDATION_INFRA_TEST_TEAMAI_ARCHIVE, intercept = () => undefined } = {}) {
  const calls = [];
  const runNpm = request => {
    calls.push(request.operation);
    const intercepted = intercept(request);
    if (intercepted !== undefined) return intercepted;
    if (request.operation === 'resolve') return JSON.stringify(runtimeMetadata);
    if (request.operation === 'pack' && archive) {
      const bytes = fs.readFileSync(archive);
      assert.equal('sha512-' + createHash('sha512').update(bytes).digest('base64'), runtimePackage.integrity, 'external test archive must match the development lock');
      const filename = `teamai-cli-${runtimePackage.version}.tgz`;
      fs.writeFileSync(path.join(request.cwd, filename), bytes);
      return JSON.stringify([{ filename }]);
    }
    return execFileSync('npm', request.args, { cwd: request.cwd, env: request.env, timeout: request.timeout, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  };
  return { runNpm, calls };
}
