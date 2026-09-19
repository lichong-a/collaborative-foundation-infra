import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { ROOT, NODE, GOVERNANCE, fixture, snapshot, write, git, hash, run, policy } from './helpers.mjs';
import { sourceFixture, expectedGuide, expectedSkillSnapshot, noSourceCopies } from './source-fixtures.mjs';
import { preparedRuntime } from './teamai-fixtures.mjs';
import { prepareSkills } from '../tools/sources.mjs';
import { skillResources, stageTeamResources } from '../tools/skill-resources.mjs';
import { verifyBuiltinSkills } from '../tools/teamai-execution.mjs';
import { syncTeam } from '../tools/distribution.mjs';

function reviseOfficial(f, transform) {
  const u = f.lock.upstreams.find(x => x.id === 'teamai-cli'), root = path.join(f.repo, u.path);
  const guide = path.join(root, 'docs/usage-guide.zh-CN.md'); fs.writeFileSync(guide, transform(fs.readFileSync(guide, 'utf8')));
  git(root, 'add', '--all'); git(root, 'commit', '-qm', 'Synthetic reviewed guide revision'); u.commit = git(root, 'rev-parse', 'HEAD');
  for (const pkg of f.lock.packages.filter(x => x.upstream === u.id)) pkg.commit = u.commit;
  for (const ref of f.lock.references) { ref.commit = u.commit; ref.sha256 = hash(fs.readFileSync(path.join(f.repo, ref.path))); }
  git(f.repo, 'update-index', '--cacheinfo', `160000,${u.commit},${u.path}`); write(f.repo, 'sources.lock.json', JSON.stringify(f.lock));
}

test('TC-TA-SOURCE-001/002: third upstream and both reference assets enforce exact identity without writes', t => {
  for (const kind of ['missing', 'gitlink', 'head', 'guide', 'license', 'extra', 'mode', 'reference-hardlink', 'mapping']) {
    const f = sourceFixture(t), u = f.lock.upstreams.find(x => x.id === 'teamai-cli'), upstream = path.join(f.repo, u.path);
    if (kind === 'missing') fs.renameSync(upstream, path.join(f.base, 'saved'));
    if (kind === 'gitlink') git(f.repo, 'update-index', '--cacheinfo', `160000,${'2'.repeat(40)},${u.path}`);
    if (kind === 'head') git(upstream, '-c', 'user.name=Fixture', '-c', 'user.email=test@example.invalid', 'commit', '--allow-empty', '-qm', 'Different HEAD');
    if (kind === 'guide') fs.appendFileSync(path.join(upstream, 'docs/usage-guide.zh-CN.md'), 'user change');
    if (kind === 'license') fs.unlinkSync(path.join(upstream, 'LICENSE'));
    if (kind === 'extra') write(upstream, 'skills/team-wiki-codebase/extra.txt', 'unknown');
    if (kind === 'mode') fs.chmodSync(path.join(upstream, 'skills/team-wiki-codebase/SKILL.md'), 0o755);
    if (kind === 'reference-hardlink') fs.linkSync(path.join(upstream, 'LICENSE'), path.join(f.base, 'license-link'));
    if (kind === 'mapping') { f.lock.references[0].destination.path = '../outside'; write(f.repo, 'sources.lock.json', JSON.stringify(f.lock)); }
    const before = snapshot(f.base); assert.throws(() => prepareSkills(f.repo)); assert.deepEqual(snapshot(f.base), before, kind);
  }
});

test('TC-TA-SKILLS-002: guide relocation changes only four reviewed targets and copies the original license', t => {
  const f = sourceFixture(t), before = snapshot(f.repo), team = path.join(f.base, 'team'); fs.mkdirSync(team);
  stageTeamResources(f.repo, team, skillResources(f.repo));
  const own = path.join(team, 'skills/common/teamai-cli');
  assert.deepEqual(fs.readFileSync(path.join(own, 'references/usage-guide.zh-CN.md')), expectedGuide(f.repo));
  assert.deepEqual(fs.readFileSync(path.join(own, 'LICENSE')), fs.readFileSync(path.join(f.repo, 'skills/upstreams/teamai-cli/LICENSE')));
  for (const [file, item] of Object.entries(expectedSkillSnapshot(f.repo, 'teamai-cli'))) if (item.type === 'file') assert.equal(hash(fs.readFileSync(path.join(own, file))), item.sha256);
  assert.deepEqual(snapshot(f.repo), before); noSourceCopies(f.repo);
});

test('TC-TA-SKILLS-002: the sole anchor repair cannot hide stale mappings or unrelated invalid guide links', t => {
  for (const kind of ['mapping', 'absent-old', 'missing-new', 'unknown-anchor', 'missing-file', 'outside-file']) {
    const f = sourceFixture(t);
    if (kind === 'mapping') { f.lock.references[0].anchorRepairs['#unreviewed'] = '#安装'; write(f.repo, 'sources.lock.json', JSON.stringify(f.lock)); }
    else reviseOfficial(f, text => {
      if (kind === 'absent-old') return text.replace('](#项目级project-scope)', '](#安装)');
      if (kind === 'missing-new') return text.replace('### 项目级（Project Scope，默认）', '### Changed title');
      if (kind === 'unknown-anchor') return text + '\n[invalid](#missing-anchor)\n';
      if (kind === 'missing-file') return text + '\n[invalid](missing-file.md)\n';
      return text + '\n[invalid](../../../outside.md)\n';
    });
    const before = snapshot(f.repo); assert.throws(() => skillResources(f.repo)); assert.deepEqual(snapshot(f.repo), before, kind);
  }
});

test('TC-TA-SKILLS-002: official guide reference links and images relocate, while fenced examples and external URLs retain bytes', t => {
  const f = sourceFixture(t); reviseOfficial(f, text => text.replace('[English](usage-guide.md)', '[English][en]') + '\n[en]: usage-guide.md\n![reference](usage-guide.md)\n```md\n[pseudo](missing.md)\n```\n[remote](https://example.invalid/document.md)\n');
  const prepared = skillResources(f.repo), team = path.join(f.base, 'team'); fs.mkdirSync(team); stageTeamResources(f.repo, team, prepared);
  const content = fs.readFileSync(path.join(team, 'skills/common/teamai-cli/references/usage-guide.zh-CN.md'), 'utf8');
  const u = f.lock.upstreams.find(x => x.id === 'teamai-cli'), target = `${u.url}/blob/${u.commit}/docs/usage-guide.md`;
  assert(content.includes(`[en]: ${target}`)); assert(content.includes(`![reference](${target})`));
  assert(content.includes('```md\n[pseudo](missing.md)\n```')); assert(content.includes('[remote](https://example.invalid/document.md)'));
});

test('TC-TA-SKILLS-003: real CLI builtin packages match the thirteen fixed source files; additional or customized bytes fail', t => {
  const runtime = preparedRuntime(), packageRoot = path.dirname(path.dirname(runtime.entry)), prepared = skillResources(ROOT);
  assert.match(verifyBuiltinSkills(prepared, packageRoot), /^[a-f0-9]{64}$/);
  for (const kind of ['extra-skill', 'extra-file', 'missing', 'bytes', 'mode']) {
    const f = fixture(t), copy = path.join(f.base, 'cli'); fs.mkdirSync(copy); fs.cpSync(path.join(packageRoot, 'skills'), path.join(copy, 'skills'), { recursive: true });
    const entry = path.join(copy, 'skills/team-wiki-codebase/SKILL.md');
    if (kind === 'extra-skill') write(copy, 'skills/unexpected/SKILL.md', '# Unknown');
    if (kind === 'extra-file') write(copy, 'skills/team-wiki-codebase/unknown.txt', 'unknown');
    if (kind === 'missing') fs.unlinkSync(entry);
    if (kind === 'bytes') fs.appendFileSync(entry, 'change');
    if (kind === 'mode') fs.chmodSync(entry, 0o755);
    const before = snapshot(copy); assert.throws(() => verifyBuiltinSkills(prepared, copy)); assert.deepEqual(snapshot(copy), before);
  }
});

test('TC-TA-SKILLS-004: unknown or modified actual TeamAI output is rejected before any project publication', t => {
  const runtime = preparedRuntime();
  for (const kind of ['extra-skill', 'extra-file', 'missing-file', 'wrong-rule', 'symlink']) {
    const f = fixture(t), before = snapshot(f.repo), original = fs.readdirSync; let injected = false;
    fs.readdirSync = (target, ...args) => {
      if (!injected && typeof target === 'string' && target.includes('collaborative-foundation-infra-teamai-') && target.endsWith('/member/.agents/skills')) {
        injected = true; const home = path.resolve(target, '../..'), file = path.join(target, 'team-wiki-codebase/SKILL.md');
        if (kind === 'extra-skill') write(target, 'unexpected/SKILL.md', '# Unexpected');
        if (kind === 'extra-file') write(target, 'team-wiki-codebase/extra.txt', 'extra');
        if (kind === 'missing-file') fs.unlinkSync(file);
        if (kind === 'wrong-rule') fs.appendFileSync(path.join(home, '.codex/rules/collaborative-foundation-infra.md'), 'wrong');
        if (kind === 'symlink') { fs.renameSync(file, path.join(f.base, 'original-skill')); fs.symlinkSync(path.join(f.base, 'original-skill'), file); }
      }
      return original(target, ...args);
    };
    try { assert.throws(() => syncTeam({ repo: f.repo, source: ROOT, agent: 'codex', userHome: f.home, dataHome: runtime.dataHome, apply: true })); }
    finally { fs.readdirSync = original; }
    assert(injected, kind); assert.deepEqual(snapshot(f.repo), before); assert.equal(fs.readdirSync(f.home).length, 0);
  }
});

test('TC-TA-BOUNDARY-001/002/003: official method entry routes preserve authorization, roles, output navigation and inactive hooks', () => {
  const text = fs.readFileSync(path.join(ROOT, 'skills/common/teamai-cli/SKILL.md'), 'utf8');
  for (const phrase of ['普通开发不自动生成知识库', 'basic 不准备', '上游默认父目录不是写入授权', '生成文档链接回既有入口', '已有具体授权不重复询问', '活动 DevFlow 任务的子角色', '先收拢自身活动执行者', '不自动切换会话模式', '不创建第二套角色或状态库', '不映射交付 Gate', '先在受限用户目录尝试安装', '失败才转人工协议']) assert(text.includes(phrase), phrase);
  const hooks = YAML.parse(fs.readFileSync(path.join(ROOT, 'hooks/hooks.yaml'), 'utf8')); assert.deepEqual(hooks.hooks, []); assert.deepEqual(hooks.builtin.disabled, ['Hook dispatch session-start', 'Hook dispatch stop', 'Hook dispatch post-tool-use wildcard', 'Hook dispatch post-tool-use Skill', 'Hook dispatch post-tool-use TodoWrite', 'Hook dispatch prompt-submit']);
  const roles = YAML.parse(fs.readFileSync(path.join(ROOT, 'manifest/roles.yaml'), 'utf8')); assert(roles); // Content remains source-validated by every actual preparation.
});

test('TC-TA-SOURCE-003 / TC-TA-RUNTIME-008: source preparation, governance and trusted CI stay offline without a CLI installation', t => {
  const f = sourceFixture(t), marker = path.join(f.base, 'npm-called'), bin = path.join(f.base, 'bin');
  write(bin, 'npm', '#!/bin/sh\nprintf called > "$TEST_NPM_SENTINEL"\nexit 99\n'); fs.chmodSync(path.join(bin, 'npm'), 0o755);
  write(f.repo, 'governance.json', JSON.stringify(policy())); const base = f.commit();
  const before = snapshot(f.repo), user = snapshot(f.home), dataHome = path.join(f.base, 'absent-runtime');
  const env = { ...process.env, PATH: bin + path.delimiter + process.env.PATH, HOME: f.home, USERPROFILE: f.home, XDG_DATA_HOME: dataHome, TEST_NPM_SENTINEL: marker };
  for (const args of [[path.join(ROOT, 'scripts/prepare-skills.mjs')], [GOVERNANCE, 'check', '--repo', f.repo, '--policy', path.join(f.repo, 'governance.json')], [path.join(ROOT, 'scripts/ci-check.mjs'), '--repo', f.repo, '--base', base, '--policy', 'governance.json']]) {
    const result = run(NODE, args, { cwd: f.repo, env }); assert.equal(result.code, 0, result.stdout + result.stderr);
  }
  const business = fixture(t), targetBefore = snapshot(business.repo);
  const absent = run(NODE, [path.join(ROOT, 'scripts/teamai-sync.mjs'), '--source', f.repo, '--repo', business.repo, '--agent', 'codex', '--user-home', f.home, '--data-home', dataHome], { env });
  assert.equal(absent.code, 2); assert.match(absent.stdout, /prepare:teamai/); assert.equal(fs.existsSync(marker), false); assert.equal(fs.existsSync(dataHome), false);
  assert.deepEqual(snapshot(f.repo), before); assert.deepEqual(snapshot(business.repo), targetBefore); assert.deepEqual(snapshot(f.home), user); noSourceCopies(f.repo);
});
