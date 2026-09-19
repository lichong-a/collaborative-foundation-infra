import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { audit } from './audit.mjs';
import { parseDocument, replaceLink, resolveLink } from './markdown.mjs';
import { inventory, readText, hash, digest, stable, safePath, exists, head, assertCleanTarget } from './repository.mjs';
import { assertWritable } from './policy.mjs';

function markdownLink(source,target,label) {
  const relative = path.posix.relative(path.posix.dirname(source),target);
  return `[${label.replace(/[\\[\]]/g,'\\$&')}](<${relative.replaceAll('>','%3E')}>)`;
}
function appendEntries(content, entries, marker) {
  const start = `<!-- collaborative-foundation-infra:${marker}:start -->`, end = `<!-- collaborative-foundation-infra:${marker}:end -->`;
  const opening = content.indexOf(start), closing = content.indexOf(end);
  if ((opening < 0) !== (closing < 0) || (opening >= 0 && closing < opening) || content.split(start).length > 2 || content.split(end).length > 2) throw new Error(`Malformed managed block: ${marker}`);
  if (!entries.length) return content;
  const lines = entries.map(entry => `- ${entry}`).filter(line => !content.split('\n').includes(line));
  if (!lines.length) return content;
  if (opening >= 0) return `${content.slice(0,closing)}${lines.join('\n')}\n${content.slice(closing)}`;
  return `${content}${content.endsWith('\n') ? '' : '\n'}\n${start}\n${lines.join('\n')}\n${end}\n`;
}
function operationsFor(root,policy,files,overrides) {
  const proposed = new Map(), originals = new Map();
  const get = name => proposed.has(name) ? proposed.get(name) : readText(root,name,overrides);
  function put(name,content) {
    assertWritable(name,policy); safePath(root,name);
    if (!originals.has(name)) originals.set(name,readText(root,name,overrides));
    proposed.set(name,content);
  }
  for (const repair of policy.linkRepairs) {
    assertWritable(repair.source,policy);
    const content = get(repair.source);
    if (content === null) throw new Error(`Missing repair source: ${repair.source}`);
    const links = parseDocument(content).links;
    if (!links.includes(repair.oldTarget)) {
      if (links.includes(repair.newTarget)) continue;
      throw new Error(`Old repair target not found: ${repair.oldTarget}`);
    }
    const target = resolveLink(root,repair.source,repair.newTarget);
    if (target.error || target.external || !target.exists) throw new Error(`New repair target must exist in repository: ${repair.newTarget}`);
    const previous = resolveLink(root,repair.source,repair.oldTarget);
    if (previous.external || (!previous.error && previous.exists)) throw new Error(`Repair is limited to broken links: ${repair.oldTarget}`);
    if (target.anchor && !parseDocument(readText(root,target.path,overrides)).anchors.has(target.anchor)) throw new Error(`New repair anchor does not exist: ${repair.newTarget}`);
    put(repair.source,replaceLink(content,repair.oldTarget,repair.newTarget));
  }
  for (const entry of policy.indexEntries) {
    const content = get(entry.index);
    if (content === null) throw new Error(`Index must already exist: ${entry.index}`);
    const target = resolveLink(root,entry.index,path.posix.relative(path.posix.dirname(entry.index),entry.target));
    if (!target.exists || target.error) throw new Error(`Index target must exist: ${entry.target}`);
    const linked = parseDocument(content).links.some(link => resolveLink(root,entry.index,link).path === entry.target);
    if (!linked) put(entry.index,appendEntries(content,[markdownLink(entry.index,entry.target,entry.label)],'navigation'));
  }
  const combined = new Map([...overrides,...proposed]);
  const report = audit(root,policy,{files,overrides:combined});
  const orphans = report.findings.filter(item => item.code === 'DOC_UNREACHABLE' && item.path !== policy.pendingFile).map(item => item.path);
  if (orphans.length) {
    const original = get(policy.pendingFile);
    const content = original ?? '---\nid: collaborative-foundation-infra-pending-classification\nstatus: plan\n---\n# 待分类文档\n\n这里只登记位置；归属、合并、移动和真实性状态由审核决定。\n';
    put(policy.pendingFile,appendEntries(content,orphans.map(name => markdownLink(policy.pendingFile,name,name)),'pending'));
    const entrypoint = policy.entrypoints[0];
    if (!entrypoint) throw new Error('A pending register requires an entrypoint');
    const index = get(entrypoint);
    if (index === null) throw new Error(`Missing entrypoint: ${entrypoint}`);
    if (!parseDocument(index).links.some(link => resolveLink(root,entrypoint,link).path === policy.pendingFile)) put(entrypoint,appendEntries(index,[markdownLink(entrypoint,policy.pendingFile,'待分类文档')],'navigation'));
  }
  return [...proposed].filter(([name,content]) => content !== originals.get(name)).sort(([a],[b]) => a.localeCompare(b,'en')).map(([name,content]) => ({ path:name,beforeContent:originals.get(name),beforeHash:originals.get(name) === null ? null : hash(originals.get(name)),afterHash:hash(content),mode:files[name]?.mode ?? 0o644,content }));
}
function composePlan(root,policy,baseline,baselineHead,overrides = new Map()) {
  const operations = operationsFor(root,policy,baseline,overrides), after = structuredClone(baseline);
  for (const operation of operations) after[operation.path] = {type:'file',hash:operation.afterHash,mode:operation.mode};
  const payload = {schemaVersion:1,repo:root,head:baselineHead,policyDigest:digest(policy),snapshot:digest(baseline),baseline,afterSnapshot:digest(after),operations};
  return {...payload,planDigest:digest(payload)};
}
export function createPlan(root,policy) { return composePlan(root,policy,inventory(root),head(root)); }

export function applyPlan(root,policy,plan,hooks = {}) {
  if (!plan || plan.schemaVersion !== 1 || plan.repo !== root || plan.policyDigest !== digest(policy) || !Array.isArray(plan.operations) || !plan.baseline) throw new Error('Plan identity or policy mismatch');
  const {planDigest,...payload} = plan;
  if (planDigest !== digest(payload) || plan.snapshot !== digest(plan.baseline)) throw new Error('Plan digest mismatch');
  for (const operation of plan.operations) {
    assertWritable(operation.path,policy);
    const target = safePath(root,operation.path);
    if (exists(target) && fs.lstatSync(target).nlink !== 1) throw new Error(`Hard-linked target refused: ${operation.path}`);
  }
  const current = inventory(root), currentDigest = digest(current);
  if (head(root) !== plan.head) throw new Error('Stale plan: Git HEAD changed');
  if (currentDigest !== plan.snapshot && currentDigest !== plan.afterSnapshot) throw new Error('Stale plan: repository snapshot changed');
  const overrides = new Map(plan.operations.map(operation => [operation.path,operation.beforeContent]));
  const expected = composePlan(root,policy,plan.baseline,plan.head,overrides);
  if (stable(expected) !== stable(plan)) throw new Error('Plan does not match deterministic policy actions');
  if (currentDigest === plan.afterSnapshot) return {status:'noop',changed:[],planDigest};
  for (const operation of plan.operations) assertCleanTarget(root,operation.path);
  const transaction = fs.mkdtempSync(path.join(os.tmpdir(),'collaborative-foundation-infra-transaction-'));
  fs.chmodSync(transaction,0o700);
  fs.writeFileSync(path.join(transaction,'plan.json'),JSON.stringify(plan,null,2),{mode:0o600});
  const changed = [], attempted = [], owned = new Set(), createdDirectories = [];
  let lock;
  const lockPath = path.join(os.tmpdir(),`collaborative-foundation-infra-${hash(root)}.lock`);
  try {
    lock = fs.openSync(lockPath,'wx',0o600);
    fs.writeFileSync(lock,JSON.stringify({pid:process.pid,repo:root,transaction}));
    for (const operation of plan.operations) {
      hooks.beforeWrite?.(operation,changed.length);
      if (head(root) !== plan.head) throw new Error('Git HEAD changed during apply');
      const target = safePath(root,operation.path), actual = exists(target) ? fs.readFileSync(target) : null;
      if (exists(target) && fs.lstatSync(target).nlink !== 1) throw new Error(`Hard-linked target refused: ${operation.path}`);
      if ((actual === null ? null : hash(actual)) !== operation.beforeHash) throw new Error(`Target changed during apply: ${operation.path}`);
      assertCleanTarget(root,operation.path);
      let directory = path.dirname(target);
      const missing = [];
      while (!exists(directory)) { missing.unshift(directory); directory=path.dirname(directory); }
      for (const item of missing) { fs.mkdirSync(item); createdDirectories.push(item); }
      safePath(root,operation.path);
      // Holding an fd avoids following a final symlink. Every write is checked
      // again immediately before use; cooperative writers must respect the lock.
      attempted.push(operation.path);
      fs.writeFileSync(path.join(transaction,'progress.json'),JSON.stringify({status:'applying',attempted,changed}),{mode:0o600});
      const descriptor = fs.openSync(target,fs.constants.O_WRONLY | fs.constants.O_NOFOLLOW | (actual === null ? fs.constants.O_CREAT|fs.constants.O_EXCL : 0),operation.mode);
      try {
        if (fs.fstatSync(descriptor).nlink !== 1) throw new Error(`Hard-linked opened target refused: ${operation.path}`);
        if (actual !== null) {
          const opened = fs.fstatSync(descriptor), live = fs.lstatSync(target);
          if (opened.ino !== live.ino || opened.dev !== live.dev || hash(fs.readFileSync(target)) !== operation.beforeHash) throw new Error(`Target replaced during apply: ${operation.path}`);
        }
        owned.add(operation.path);
        fs.writeFileSync(descriptor,operation.content); fs.ftruncateSync(descriptor,Buffer.byteLength(operation.content)); fs.fsyncSync(descriptor);
      } finally { fs.closeSync(descriptor); }
      changed.push(operation.path);
      fs.writeFileSync(path.join(transaction,'progress.json'),JSON.stringify({status:'applying',changed}),{mode:0o600});
      if (hash(fs.readFileSync(safePath(root,operation.path))) !== operation.afterHash) throw new Error(`Post-write verification failed: ${operation.path}`);
    }
    if (digest(inventory(root)) !== plan.afterSnapshot) throw new Error('Repository changed during apply');
    fs.writeFileSync(path.join(transaction,'progress.json'),JSON.stringify({status:'applied',changed}),{mode:0o600});
    return {status:'applied',changed,planDigest,transaction};
  } catch (error) {
    const recovered=[], conflicts=[];
    for (const name of [...attempted].reverse()) {
      const operation=plan.operations.find(item=>item.path===name);
      try {
        const target=safePath(root,name);
        if (!owned.has(name)) { if (exists(target)) conflicts.push(name); continue; }
        if (!exists(target)) { if (operation.beforeContent!==null) conflicts.push(name); continue; }
        if (fs.lstatSync(target).nlink !== 1) { conflicts.push(name); continue; }
        const actualHash=hash(fs.readFileSync(target));
        if(actualHash===operation.beforeHash) { recovered.push(name); continue; }
        if(actualHash!==operation.afterHash) { conflicts.push(name); continue; }
        if (operation.beforeContent === null) fs.unlinkSync(target);
        else fs.writeFileSync(target,operation.beforeContent);
        recovered.push(name);
      } catch { conflicts.push(name); }
    }
    for (const directory of createdDirectories.reverse()) { try { fs.rmdirSync(directory); } catch { /* Nonempty directory may now belong to another writer. */ } }
    fs.writeFileSync(path.join(transaction,'progress.json'),JSON.stringify({status:'failed',attempted,changed,recovered,conflicts,error:error.message}),{mode:0o600});
    throw new Error(`${error.message}; recovery=${transaction}; recovered=${recovered.length}; conflicts=${conflicts.join(',') || 'none'}`);
  } finally {
    if (lock !== undefined) { fs.closeSync(lock); fs.unlinkSync(lockPath); }
  }
}
