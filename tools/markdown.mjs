import MarkdownIt from 'markdown-it';
import YAML from 'yaml';
import path from 'node:path';
import fs from 'node:fs';
import { safePath, exists, readText } from './repository.mjs';

const markdown = new MarkdownIt('commonmark', { html: true }).enable(['table','strikethrough']);
export function slug(text) {
  return text.toLowerCase().replace(/<[^>]*>/g, '').replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '').replace(/\s/g, '-');
}
export function parseDocument(content) {
  let body = content, metadata = null, metadataError = null;
  const front = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(content);
  if (front) {
    try { metadata = YAML.parse(front[1], { uniqueKeys: true }); }
    catch (error) { metadataError = error.message; }
    body = content.slice(front[0].length);
  }
  const environment = {};
  const tokens = markdown.parse(body, environment);
  const links = [], anchors = new Set(), generatedAnchors = new Set(), used = new Map();
  const html = source => {
    source = source.replace(/<!--[\s\S]*?(?:-->|$)/g, '');
    for (const match of source.matchAll(/\b(?:id|name)\s*=\s*["']([^"']+)["']/gi)) anchors.add(match[1]);
    for (const match of source.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) links.push(match[1]);
  };
  function visit(token) {
    if (token.type === 'link_open') links.push(token.attrGet('href'));
    if (token.type === 'image') links.push(token.attrGet('src'));
    if (token.type === 'html_inline' || token.type === 'html_block') html(token.content);
    token.children?.forEach(visit);
  }
  tokens.forEach((token, index) => {
    if (token.type === 'heading_open') {
      const inline = tokens[index + 1];
      const label = inline.children?.map(child => child.type === 'html_inline' ? '' : child.content).join('') ?? inline.content;
      const base = slug(label);
      let count = used.get(base) ?? 0, candidate = count ? `${base}-${count}` : base;
      while (generatedAnchors.has(candidate)) { count++; candidate = `${base}-${count}`; }
      used.set(base, count + 1); generatedAnchors.add(candidate); anchors.add(candidate);
    }
    visit(token);
  });
  return { metadata, metadataError, links, anchors, tokens, body, prefix: content.slice(0, content.length-body.length) };
}
export function resolveLink(root, source, target) {
  if (/^(?:https?:|mailto:|tel:|data:)/i.test(target) || target.startsWith('//')) return { external: true };
  if (/^[a-z][a-z0-9+.-]*:/i.test(target)) return { error: 'unsupported URI scheme' };
  let destination, anchor;
  try {
    const split = target.indexOf('#');
    destination = decodeURIComponent((split < 0 ? target : target.slice(0, split)).split('?')[0]);
    anchor = split < 0 ? '' : decodeURIComponent(target.slice(split + 1));
  } catch { return { error: 'invalid URL encoding' }; }
  if (/[\\\0]/.test(destination)) return { error: 'unsafe path' };
  const relative = destination.startsWith('/') ? destination.slice(1) : path.posix.join(path.posix.dirname(source), destination || path.posix.basename(source));
  let normalized = path.posix.normalize(relative).replace(/\/+$/, '') || '.';
  if (normalized === '..' || normalized.startsWith('../')) return { error: 'path escapes repository' };
  try {
    let absolute = normalized === '.' ? root : safePath(root, normalized);
    if (exists(absolute) && fs.statSync(absolute).isDirectory()) {
      const entry = ['README.md','index.md'].find(name => exists(path.join(absolute, name)));
      if (!entry) return { path: normalized, anchor, directory: true, exists: true };
      normalized = path.posix.join(normalized, entry); absolute = safePath(root, normalized);
    }
    return { path: normalized, anchor, exists: exists(absolute) };
  } catch (error) { return { error: error.message }; }
}

// Repair only syntax-bearing destinations. Markdown-it provides the block ranges;
// its own inline parser recognizes links, images, references, and code exclusions.
export function replaceLink(content, oldTarget, newTarget) {
  const document = parseDocument(content);
  const oldNormalized = markdown.normalizeLink(oldTarget), newNormalized = markdown.normalizeLink(newTarget);
  const lines = document.body.split('\n');
  const excluded = new Set();
  for (const token of document.tokens) if (['fence','code_block','html_block'].includes(token.type) && token.map) for (let line = token.map[0]; line < token.map[1]; line++) excluded.add(line);
  let changes = 0;
  const escaped = oldTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const destination = new RegExp(`(\\]\\(\\s*<?)${escaped}(>?)(?=\\s|\\))`, 'g');
  const reference = new RegExp(`(^ {0,3}\\[[^\\]]+\\]:\\s*<?)${escaped}(>?)(?=\\s|$)`, 'g');
  const output = lines.map((line, index) => {
    if (excluded.has(index)) return line;
    // Work on text outside inline-code spans; backtick runs can contain spaces.
    const spans = line.split(/(`+[^`]*`+)/g);
    return spans.map((span, part) => {
      if (part % 2) return span;
      return span.replace(destination, (_, start, end) => { changes++; return `${start}${newTarget}${end}`; }).replace(reference, (_, start, end) => { changes++; return `${start}${newTarget}${end}`; });
    }).join('');
  }).join('\n');
  const proposed = document.prefix + output;
  const before = document.links.map(link => link === oldNormalized ? newNormalized : link).sort();
  const after = parseDocument(proposed).links.sort();
  const expectedCount = document.links.filter(link => link === oldNormalized).length;
  // A conservative rejection is preferable to editing prose/unsupported syntax.
  function semantic(token) {
    const attrs = (token.attrs ?? []).filter(([name]) => !(token.type === 'link_open' && name === 'href') && !(token.type === 'image' && name === 'src'));
    return {type:token.type,tag:token.tag,nesting:token.nesting,markup:token.markup,info:token.info,hidden:token.hidden,attrs,content:token.type === 'inline' ? null : token.content,children:token.children?.map(semantic)};
  }
  const parsedAfter = parseDocument(proposed);
  if (!changes || !expectedCount || JSON.stringify(before) !== JSON.stringify(after) || parsedAfter.links.includes(oldNormalized) || JSON.stringify(document.tokens.map(semantic)) !== JSON.stringify(parsedAfter.tokens.map(semantic))) throw new Error(`Repair cannot safely identify all link destinations without modifying prose: ${oldTarget}`);
  return proposed;
}
