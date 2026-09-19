import path from 'node:path';
import { inventory, readText, digest, under, exists } from './repository.mjs';
import { parseDocument, resolveLink } from './markdown.mjs';

export function audit(root, policy, options = {}) {
  const files = options.files ?? inventory(root), overrides = options.overrides ?? new Map();
  const findings = [];
  function add(code, file, message, target = '') {
    const fingerprint = digest({ code, path: file, target });
    findings.push({ code, path: file, target, message, fingerprint, debt: policy.debt.includes(fingerprint) });
  }
  const ignored = name => name.split('/').includes('.devflow') || policy.exclude.some(prefix => under(name, prefix));
  const names = Object.keys(files).filter(name => files[name].type === 'file' && /\.md$/i.test(name) && !ignored(name) && (policy.documentRoots.some(prefix => under(name,prefix)) || policy.entrypoints.includes(name)));
  for (const name of overrides.keys()) if (!names.includes(name) && overrides.get(name) !== null && /\.md$/i.test(name) && !ignored(name) && policy.documentRoots.some(prefix => under(name,prefix))) names.push(name);
  const documents = new Map();
  for (const name of names.sort()) {
    const content = readText(root, name, overrides);
    if (content !== null) documents.set(name, parseDocument(content));
  }
  const ids = new Map(), edges = new Map();
  for (const [name, document] of documents) {
    if (policy.metadataRoots.some(prefix => under(name,prefix))) {
      if (document.metadataError || !document.metadata || typeof document.metadata !== 'object' || Array.isArray(document.metadata)) add('METADATA_MISSING',name,'Document requires valid YAML frontmatter with id and status');
      else {
        const { id, status } = document.metadata;
        if (typeof id !== 'string' || !id.trim() || !['current','proposal','plan','historical'].includes(status)) add('METADATA_INVALID',name,'id must be a nonempty string; status must be current, proposal, plan, or historical');
        if (typeof id === 'string' && id.trim()) {
          if (ids.has(id)) add('DUPLICATE_ID', name, `Document id is also used by ${ids.get(id)}`, id);
          else ids.set(id,name);
        }
      }
    }
    const outgoing = [];
    for (const target of document.links) {
      const resolved = resolveLink(root,name,target);
      if (resolved.external) continue;
      if (resolved.error || (!resolved.exists && !overrides.has(resolved.path))) { add('BROKEN_LINK',name,resolved.error ?? 'Link target does not exist',target); continue; }
      outgoing.push(resolved.path);
      if (resolved.anchor && resolved.path.endsWith('.md')) {
        const destination = documents.get(resolved.path) ?? parseDocument(readText(root,resolved.path,overrides) ?? '');
        if (!destination.anchors.has(resolved.anchor)) add('BROKEN_ANCHOR',name,'Anchor does not exist',target);
      }
    }
    edges.set(name,outgoing);
  }
  const visited = new Set(), queue = [...policy.entrypoints];
  while (queue.length) {
    const name = queue.shift();
    if (visited.has(name)) continue;
    visited.add(name); queue.push(...(edges.get(name) ?? []));
  }
  for (const entry of policy.entrypoints) if (!documents.has(entry)) add('BROKEN_LINK',entry,'Document entrypoint is missing',entry);
  for (const name of documents.keys()) if (!visited.has(name)) add('DOC_UNREACHABLE',name,'Document is unreachable from configured entrypoints');
  if (policy.allowedTopLevel.length) for (const name of [...new Set(Object.keys(files).map(file => file.split('/')[0]))].sort()) if (!policy.allowedTopLevel.includes(name)) add('UNREGISTERED_ROOT',name,'Top-level path has no registered responsibility');
  for (const name of Object.keys(files)) for (const rule of policy.pathRules) if (under(name,rule.prefix) && !rule.allowedExtensions.includes(path.extname(name))) add('PATH_RULE',name,'File extension violates explicit path rule',rule.prefix);
  const hasDevflow = Object.keys(files).some(name => name.startsWith('.devflow/'));
  const hasParallel = Object.keys(files).some(name => name.startsWith('.collaborative-foundation-infra/tasks/') || name.startsWith('.collaborative-foundation-infra/work-packages/'));
  if ((hasDevflow && policy.workflow.authority !== 'devflow') || (hasDevflow && hasParallel)) add('FLOW_CONFLICT','.devflow','Existing DevFlow and configured/parallel workflow require an authority mapping');
  for (const reference of policy.workflow.references) if (!exists(path.join(root,reference))) add('FLOW_CONFLICT',reference,'Workflow authority reference does not exist');
  const unique = [...new Map(findings.map(finding => [finding.fingerprint,finding])).values()].sort((a,b) => a.path.localeCompare(b.path,'en') || a.code.localeCompare(b.code,'en') || a.target.localeCompare(b.target,'en'));
  const newCount = unique.filter(finding => !finding.debt).length;
  return { schemaVersion: 1, status: newCount ? 'fail' : unique.length ? 'debt' : 'pass', summary: { documents: documents.size, reachable: [...documents.keys()].filter(name => visited.has(name)).length, findings: unique.length, newFindings: newCount, debt: unique.length-newCount }, findings: unique };
}
