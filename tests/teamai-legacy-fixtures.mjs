import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID, createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { after } from 'node:test';
import assert from 'node:assert/strict';
import YAML from 'yaml';
import { ROOT, NODE, hash, snapshot, write } from './helpers.mjs';
import { stageFixtureTeam } from './source-fixtures.mjs';
import { runtimeNamespace } from './teamai-fixtures.mjs';

// Historical schema-1 input, independently built from the real fixed archive.
// This does not call the current source validator or fabricate a compatibility result.
const legacyPackage = {
  name: 'teamai-cli', version: '0.24.0',
  tarball: 'https://registry.npmjs.org/teamai-cli/-/teamai-cli-0.24.0.tgz',
  integrity: 'sha512-h8asWWBkYH1XxAKr/KzrpSgt/bhnGu9hLXisKU/6CFolknOcp1F684P3dlZqJ4RPBcSlPIIhB0lvmOBa/R7RDg=='
};
const legacySkills = ['team-wiki-codebase', 'teamai-share-learnings'];
// Independently calculated from the 13 reviewed files at the old fixed source.
const legacyBuiltinDigest = 'a71a821f1b10f453d65aec251baccad5a94f15d9a7bd4f1661c4383690ee5636';
const canonical = value => Array.isArray(value) ? `[${value.map(canonical).join(',')}]` : value && typeof value === 'object' ? `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` : JSON.stringify(value);
const identity = directory => Object.fromEntries(Object.entries(snapshot(directory)).filter(([, item]) => item.type === 'file').map(([name, item]) => [name, { type: 'file', hash: item.sha256, mode: item.mode & 0o100 ? 0o755 : 0o644 }]));
const privateWrite = (filename, bytes) => fs.writeFileSync(filename, bytes, { mode: 0o600, flag: 'wx' });
let ownedRoot, shared;
after(() => { if (ownedRoot) fs.rmSync(ownedRoot, { recursive: true, force: true }); });
function environment(home) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (/^(?:npm_config_|TEAMAI_)/i.test(key) || ['NODE_OPTIONS', 'NODE_PATH'].includes(key)) delete env[key];
  return { ...env, HOME: home, USERPROFILE: home, XDG_CONFIG_HOME: path.join(home, '.config'), XDG_CACHE_HOME: path.join(home, '.cache'), XDG_DATA_HOME: path.join(home, '.local/share'), XDG_STATE_HOME: path.join(home, '.local/state'), TEAMAI_HOOKS_DISABLED: '1', TEAMAI_RECALL_DISABLED: '1', TEAMAI_CONTRIBUTE_HINT_DISABLED: '1', TEAMAI_PACKAGE_HINT_DISABLED: '1', TEAMAI_MR_HINT_DISABLED: '1', TEAMAI_DISABLE_REMOTE_CMD: '1', CI: '1' };
}
function buildLegacyRuntime() {
  ownedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cfi-test-legacy-runtime-'));
  const dataHome = path.join(ownedRoot, 'data'), namespace = runtimeNamespace(dataHome), id = randomUUID();
  const installation = path.join(namespace, 'installations', id), install = path.join(installation, 'install');
  for (const directory of [dataHome, path.dirname(namespace), namespace, path.dirname(installation), installation, install]) fs.mkdirSync(directory, { mode: 0o700 });
  const home = path.join(ownedRoot, 'npm-home'); fs.mkdirSync(home, { mode: 0o700 });
  const userconfig = path.join(ownedRoot, 'user.npmrc'), globalconfig = path.join(ownedRoot, 'global.npmrc'); privateWrite(userconfig, ''); privateWrite(globalconfig, '');
  const env = { ...environment(home), NPM_CONFIG_USERCONFIG: userconfig, NPM_CONFIG_GLOBALCONFIG: globalconfig, NPM_CONFIG_CACHE: path.join(ownedRoot, 'npm-cache'), NPM_CONFIG_PREFIX: path.join(ownedRoot, 'npm-prefix'), NPM_CONFIG_UPDATE_NOTIFIER: 'false' };
  const npm = (args, cwd = ownedRoot) => execFileSync('npm', [...args, '--registry', 'https://registry.npmjs.org', '--ignore-scripts', '--no-audit', '--no-fund', '--no-bin-links'], { cwd, env, timeout: 300000, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  let archive = process.env.COLLABORATIVE_FOUNDATION_INFRA_TEST_LEGACY_TEAMAI_ARCHIVE;
  if (!archive) { const packed = JSON.parse(npm(['pack', legacyPackage.tarball, '--json'])); assert.equal(packed.length, 1); archive = path.join(ownedRoot, packed[0].filename); }
  const bytes = fs.readFileSync(archive); assert.equal('sha512-' + createHash('sha512').update(bytes).digest('base64'), legacyPackage.integrity);
  privateWrite(path.join(installation, 'archive.tgz'), bytes);
  privateWrite(path.join(install, 'package.json'), JSON.stringify({ name: 'cfi-private-teamai-runtime', private: true, version: '1.0.0' }) + '\n');
  npm(['install', path.join(installation, 'archive.tgz'), '--save-exact'], install);
  const entry = path.join(install, 'node_modules/teamai-cli/dist/index.js'), packageRoot = path.dirname(path.dirname(entry));
  assert.equal(execFileSync(NODE, [entry, '--version'], { cwd: home, env, encoding: 'utf8' }).trim(), '0.24.0');
  const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'))); assert.equal(manifest.version, legacyPackage.version); assert.equal(manifest.bin.teamai, 'dist/index.js');
  assert.deepEqual(fs.readdirSync(path.join(packageRoot, 'skills')).sort(), [...legacySkills].sort());
  const builtin = Object.fromEntries(legacySkills.map(name => [name, identity(path.join(packageRoot, 'skills', name))]));
  assert.equal(Object.values(builtin).reduce((count, files) => count + Object.keys(files).length, 0), 13);
  assert.equal(hash(canonical(builtin)), legacyBuiltinDigest);

  // A synthetic historical team contains ten real packages; only the two old
  // official packages come from 0.24.0. The actual CLI must produce every byte.
  const team = path.join(ownedRoot, 'team'); stageFixtureTeam(ROOT, team);
  fs.rmSync(path.join(team, 'skills/common/teamai'), { recursive: true });
  for (const name of legacySkills) { const target = path.join(team, 'skills/common', name); fs.rmSync(target, { recursive: true }); fs.cpSync(path.join(packageRoot, 'skills', name), target, { recursive: true }); }
  const expected = fs.readdirSync(path.join(team, 'skills/common')).sort(); assert.equal(expected.length, 10);
  const agents = {};
  for (const agent of ['codex', 'zcode', 'claude']) {
    const member = path.join(ownedRoot, agent); fs.mkdirSync(member, { mode: 0o700 });
    write(member, '.teamai/config.yaml', YAML.stringify({ repo: { localPath: team, remote: '', kind: 'self', businessRepoRoot: ownedRoot }, username: 'isolated-legacy-tester', scope: 'user', primaryRole: 'engineering', additionalRoles: [], resourceProfileVersion: 1, updatePolicy: 'skip', recallEnabled: false, contributeHintEnabled: false, inheritUserScope: false, enabledAgents: [agent], disabledAgents: ['codex', 'zcode', 'claude'].filter(name => name !== agent) }));
    const folder = agent === 'claude' ? '.claude/skills' : '.agents/skills'; fs.mkdirSync(path.join(member, folder), { recursive: true });
    if (agent !== 'zcode') fs.mkdirSync(path.join(member, `.${agent}/rules`), { recursive: true });
    const logs = execFileSync(NODE, [entry, 'pull', '--force'], { cwd: ownedRoot, env: environment(member), timeout: 120000, encoding: 'utf8' });
    assert.deepEqual(fs.readdirSync(path.join(member, folder)).sort(), expected);
    for (const name of expected) assert.deepEqual(identity(path.join(member, folder, name)), identity(path.join(team, 'skills/common', name)));
    if (agent !== 'zcode') assert.deepEqual(fs.readFileSync(path.join(member, `.${agent}/rules/collaborative-foundation-infra.md`)), fs.readFileSync(path.join(team, 'rules/collaborative-foundation-infra.md')));
    agents[agent] = { status: 'verified', logsSha256: hash(logs) };
  }
  const files = snapshot(install), compatibility = { status: 'verified', sourceLockDigest: hash(canonical({ upstream: '0c059b2da6fe0fa3206ab1ce33978601a2a832e6', skills: builtin })), distributionDigest: hash(canonical(identity(team))), agents };
  const receipt = { schemaVersion: 1, installationId: id, package: legacyPackage, entry: 'install/node_modules/teamai-cli/dist/index.js', files, installManifestDigest: hash(canonical(files)), packageLockDigest: hash(fs.readFileSync(path.join(install, 'package-lock.json'))), builtinSkillsDigest: legacyBuiltinDigest, compatibility };
  const record = JSON.stringify(receipt, null, 2) + '\n'; privateWrite(path.join(installation, 'receipt.json'), record);
  privateWrite(path.join(namespace, 'current.json'), JSON.stringify({ installationId: id, receiptSha256: hash(record) }, null, 2) + '\n');
  return { dataHome, installation, entry };
}
export function cloneLegacyRuntime(f) {
  if (!shared) {
    const dataHome = process.env.COLLABORATIVE_FOUNDATION_INFRA_TEST_LEGACY_TEAMAI_DATA_HOME;
    if (dataHome) {
      const namespace = runtimeNamespace(dataHome), pointer = JSON.parse(fs.readFileSync(path.join(namespace, 'current.json'))), installation = path.join(namespace, 'installations', pointer.installationId);
      const record = fs.readFileSync(path.join(installation, 'receipt.json')), receipt = JSON.parse(record);
      assert.equal(receipt.package.version, '0.24.0'); assert.equal(receipt.package.integrity, legacyPackage.integrity); assert.equal(hash(record), pointer.receiptSha256); assert.equal(receipt.builtinSkillsDigest, legacyBuiltinDigest);
      shared = { dataHome, installation, entry: path.join(installation, receipt.entry) };
    } else shared = buildLegacyRuntime();
  }
  const dataHome = path.join(f.base, 'legacy-runtime'); fs.cpSync(shared.dataHome, dataHome, { recursive: true });
  const modes = (from, to) => { fs.chmodSync(to, fs.statSync(from).mode & 0o777); if (fs.statSync(from).isDirectory()) for (const name of fs.readdirSync(from)) modes(path.join(from, name), path.join(to, name)); };
  modes(shared.dataHome, dataHome);
  const installation = path.join(dataHome, path.relative(shared.dataHome, shared.installation));
  return { source: ROOT, dataHome, installation, entry: path.join(installation, 'install/node_modules/teamai-cli/dist/index.js') };
}
