import fs from 'node:fs';
import path from 'node:path';
import { digest, hash, safePath, stable, repositoryRoot } from './repository.mjs';
import { verifyUpstreams, packageInventory, OWN_SKILL, OWN_SKILLS } from './sources.mjs';
import { parseDocument, replaceLink, resolveLink } from './markdown.mjs';

const OWN_PATH=`skills/common/${OWN_SKILL}`;
// Only these source navigations are relocated. Upstream bytes are never edited.
const LINK_PACKAGES={'SKILL.md':'ric-devflow','references/session.md':'ric-devflow','references/adoption.md':'ric-devflow','references/design.md':'ric-design-patterns-skill'};
const TEAM_RESOURCES=['teamai.yaml','manifest','hooks','rules'];
function identityFiles(root,names) {
  const result={};
  for(const name of names) {
    const full=safePath(root,name),stat=fs.lstatSync(full);
    if(stat.isDirectory())for(const [file,entry] of Object.entries(packageInventory(full)))result[`${name}/${file}`]=entry;
    else if(stat.isFile() && stat.nlink===1 && stat.size<=128*1024*1024)result[name]={type:'file',hash:hash(fs.readFileSync(full)),mode:stat.mode&0o100?0o755:0o644};
    else throw new Error(`Unsupported resource object: ${name}`);
  }
  return result;
}
function relocate(content,link,target) {
  try {return replaceLink(content,link,target);}
  catch(error) {const decoded=decodeURI(link);if(decoded===link)throw error;return replaceLink(content,decoded,target);}
}
function validateNavigation(root,name,link) {
  const resolved=resolveLink(root,name,link);
  if(resolved.external)return resolved;
  if(resolved.error || !resolved.exists || resolved.directory)throw new Error(`Invalid source Skill navigation: ${name} -> ${link}`);
  if(resolved.anchor && !parseDocument(fs.readFileSync(safePath(root,resolved.path),'utf8')).anchors.has(resolved.anchor))throw new Error(`Missing source navigation anchor: ${name} -> ${link}`);
  return resolved;
}
function guideResource(root,source,ref) {
  const upstream=source.lock.upstreams.find(item=>item.id===ref.upstream),base=safePath(root,upstream.path),name=ref.path.slice(upstream.path.length+1);
  let content=fs.readFileSync(safePath(root,ref.path),'utf8');
  for(const [old,target] of Object.entries(ref.anchorRepairs??{})) {
    const parsed=parseDocument(content),normalized=encodeURI(old);
    if(!parsed.links.includes(normalized) || parsed.anchors.has(old.slice(1)) || !parsed.anchors.has(target.slice(1)))throw new Error('Stale or invalid official guide anchor mapping');
    content=relocate(content,normalized,target);
  }
  for(const link of new Set(parseDocument(content).links)) {
    const resolved=validateNavigation(base,name,link);
    if(resolved.external || link.startsWith('#'))continue;
    if(link.includes('?'))throw new Error('Unknown official guide query navigation');
    const target=`${upstream.url}/blob/${upstream.commit}/${resolved.path.split('/').map(encodeURIComponent).join('/')}${resolved.anchor?'#'+encodeURIComponent(resolved.anchor):''}`;
    content=relocate(content,link,target);
  }
  return Buffer.from(content);
}
function ownResources(root,source,name) {
  const ownPath=`skills/common/${name}`,files=packageInventory(safePath(root,ownPath)),rewritten={},seen=new Set();
  for(const file of Object.keys(files).filter(item=>item.endsWith('.md'))) {
    const sourceName=`${ownPath}/${file}`,original=fs.readFileSync(safePath(root,sourceName));
    let content=new TextDecoder('utf-8',{fatal:true}).decode(original);
    for(const link of new Set(parseDocument(content).links)) {
      const resolved=validateNavigation(root,sourceName,link);
      if(resolved.external || resolved.path.startsWith(`${ownPath}/`))continue;
      if(OWN_SKILLS.some(other=>resolved.path===`skills/common/${other}/SKILL.md`))continue;
      const pkg=source.lock.packages.find(item=>resolved.path===`${item.path}/SKILL.md`);
      const ref=source.lock.references.find(item=>resolved.path===item.path && item.destination.skill===name);
      if(name===OWN_SKILL ? !pkg || pkg.name!==LINK_PACKAGES[file] : file!=='SKILL.md' || !(ref || pkg?.upstream==='teamai-cli'))throw new Error(`Unknown cross-package source navigation: ${file} -> ${link}`);
      const expected=path.posix.relative(path.posix.dirname(sourceName),resolved.path),fragment=link.includes('#')?link.slice(link.indexOf('#')):'';
      if(link!==expected+fragment)throw new Error(`Unreviewed source navigation spelling: ${file} -> ${link}`);
      const destination=ref?`skills/common/${name}/${ref.destination.path}`:`skills/common/${pkg.name}/SKILL.md`;
      content=relocate(content,link,path.posix.relative(path.posix.dirname(sourceName),destination)+fragment);seen.add(file);
    }
    if(!Buffer.from(content).equals(original)){rewritten[file]=Buffer.from(content);files[file]={...files[file],hash:hash(rewritten[file])};}
  }
  for(const file of name===OWN_SKILL?Object.keys(LINK_PACKAGES):['SKILL.md'])if(!seen.has(file))throw new Error(`Required source navigation mapping is missing: ${file}`);
  const additions={};
  for(const ref of source.lock.references.filter(item=>item.destination.skill===name)) {
    const file=ref.destination.path;if(Object.hasOwn(files,file))throw new Error(`Generated official reference conflicts with source: ${file}`);
    const bytes=ref.transform==='identity'?fs.readFileSync(safePath(root,ref.path)):guideResource(root,source,ref);
    additions[file]={sourcePath:ref.path,bytes};files[file]={type:'file',hash:hash(bytes),mode:ref.mode&0o100?0o755:0o644};
  }
  return {sourcePath:ownPath,files,rewritten,additions};
}
export function skillResources(root) {
  root=repositoryRoot(root);
  const source=verifyUpstreams(root),skills={};
  for(const pkg of source.lock.packages)skills[pkg.name]={sourcePath:pkg.path,files:source.packages[pkg.name].files,rewritten:{},additions:{}};
  for(const name of OWN_SKILLS)skills[name]=ownResources(root,source,name);
  const teamFiles=identityFiles(root,TEAM_RESOURCES),distributionFiles={...teamFiles};
  for(const [name,pkg] of Object.entries(skills))for(const [file,entry] of Object.entries(pkg.files))distributionFiles[`skills/common/${name}/${file}`]=entry;
  const distributionDigest=digest(distributionFiles);
  const sourceFiles=identityFiles(root,[...TEAM_RESOURCES,...OWN_SKILLS.map(name=>`skills/common/${name}`),'sources.lock.json','package-lock.json','.gitmodules']);
  const sourceDigest=digest({sourceFiles,sourcePackages:source.packages,references:source.references,distributionDigest});
  return {...source,skills,teamFiles,distributionFiles,distributionDigest,sourceDigest};
}
export function resourceIdentity(root) {return skillResources(root).sourceDigest;}
function readResource(root,name,expected) {
  const full=safePath(root,name),descriptor=fs.openSync(full,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
  try {
    const stat=fs.fstatSync(descriptor);
    if(!stat.isFile() || stat.nlink!==1 || stat.size>128*1024*1024 || (stat.mode&0o100?0o755:0o644)!==expected.mode)throw new Error(`Source resource changed type or mode: ${name}`);
    const bytes=fs.readFileSync(descriptor);
    if(hash(bytes)!==expected.hash)throw new Error(`Source resource changed bytes: ${name}`);
    return bytes;
  } finally {fs.closeSync(descriptor);}
}
export function stageTeamResources(source,team,expected) {
  team=repositoryRoot(team);
  if(fs.readdirSync(team).length)throw new Error('Private team staging directory must be empty');
  function publish(name,bytes,entry) {
    const filename=safePath(team,name);fs.mkdirSync(path.dirname(filename),{recursive:true});safePath(team,name);
    fs.writeFileSync(filename,bytes,{flag:'wx',mode:entry.mode});fs.chmodSync(filename,entry.mode);
  }
  for(const [name,entry] of Object.entries(expected.teamFiles))publish(name,readResource(source,name,entry),entry);
  for(const [name,pkg] of Object.entries(expected.skills))for(const [file,entry] of Object.entries(pkg.files)) {
    const bytes=pkg.additions[file]?.bytes??pkg.rewritten[file]??readResource(source,`${pkg.sourcePath}/${file}`,entry);
    if(hash(bytes)!==entry.hash)throw new Error('Relocated resource does not match its expected identity');
    publish(`skills/common/${name}/${file}`,bytes,entry);
  }
  if(stable(packageInventory(team))!==stable(expected.distributionFiles))throw new Error('Private TeamAI assembly does not match its complete expected manifest');
  if(resourceIdentity(source)!==expected.sourceDigest)throw new Error('Source changed during private TeamAI assembly');
}
