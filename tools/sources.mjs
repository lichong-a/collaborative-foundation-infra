import fs from 'node:fs';
import path from 'node:path';
import { inventory, digest, hash, stable, safePath, relativeName, repositoryRoot, exists, git } from './repository.mjs';

export const IMPORTED_SKILLS=['ric-devflow','ric-devflow-planner','ric-devflow-reviewer','ric-devflow-tester','ric-devflow-implementer','ric-design-patterns-skill','team-wiki-codebase','teamai-share-learnings','teamai'];
export const OWN_SKILL='collaborative-foundation-infra';
export const OWN_SKILLS=[OWN_SKILL,'teamai-cli'];
const modeFor=mode=>(mode&0o100)?0o755:0o644;
const hex=value=>typeof value==='string' && /^[a-f0-9]{64}$/.test(value);
export function packageInventory(root,{skipGit=false}={}) {
  const output={};
  function visit(directory,prefix='') {
    const names=fs.readdirSync(directory).sort();
    if(prefix && !names.length)throw new Error(`Unknown empty package directory: ${prefix}`);
    for(const name of names) {
      if(!prefix && skipGit && name==='.git')continue;
      if(name==='.git')throw new Error('Git metadata cannot be exported as a package resource');
      const relative=prefix?`${prefix}/${name}`:name,full=safePath(root,relative),stat=fs.lstatSync(full);
      if(stat.isDirectory())visit(full,relative);
      else if(stat.isFile() && stat.nlink===1 && stat.size<=128*1024*1024)output[relative]={type:'file',hash:hash(fs.readFileSync(full)),mode:modeFor(stat.mode)};
      else throw new Error(`Package symlink, hard link or unsupported object refused: ${relative}`);
    }
  }
  if(!fs.lstatSync(root).isDirectory() || fs.realpathSync(root)!==root)throw new Error('Package root must be a real directory');
  visit(root);return output;
}
function expectedFiles(pkg) {
  if(!pkg.files || typeof pkg.files!=='object' || Array.isArray(pkg.files) || !Object.keys(pkg.files).length)throw new Error('Missing package file manifest');
  return Object.fromEntries(Object.entries(pkg.files).map(([name,file])=> {
    relativeName(name);
    if(name.split('/').includes('.git') || !hex(file.sha256) || !Number.isInteger(file.mode) || file.mode<0 || file.mode>0o777)throw new Error('Invalid package file identity');
    return [name,{type:'file',hash:file.sha256,mode:modeFor(file.mode)}];
  }));
}
export function loadSources(root) {
  const filename=safePath(root,'sources.lock.json'),stat=fs.lstatSync(filename);
  if(!stat.isFile() || stat.nlink!==1 || stat.size>4*1024*1024)throw new Error('Source lock must be an ordinary bounded unlinked file');
  const bytes=fs.readFileSync(filename);
  const lock=JSON.parse(bytes);
  if(lock.schemaVersion!==4 || stable(lock.teamai)!==stable({package:'teamai-cli',selection:'latest-on-first-prepare-or-explicit-upgrade',registry:'https://registry.npmjs.org'}) || !Array.isArray(lock.upstreams) || lock.upstreams.length!==3 || !Array.isArray(lock.packages) || lock.packages.length!==IMPORTED_SKILLS.length)throw new Error('Expected source schema 4, three upstreams and nine pinned packages');
  const expectedPaths={'ric-devflow':'skills/upstreams/ric-devflow','ric-design-patterns':'skills/upstreams/ric-design-patterns','teamai-cli':'skills/upstreams/teamai-cli'};
  if(new Set(lock.upstreams.map(item=>item.id)).size!==3 || new Set(lock.packages.map(item=>item.name)).size!==IMPORTED_SKILLS.length)throw new Error('Duplicate source mapping');
  for(const upstream of lock.upstreams)if(upstream.path!==expectedPaths[upstream.id] || !/^[a-f0-9]{40}$/.test(upstream.commit) || typeof upstream.url!=='string' || !upstream.url)throw new Error('Invalid upstream mapping');
  for(const pkg of lock.packages) {
    const id=pkg.name==='ric-design-patterns-skill'?'ric-design-patterns':pkg.name.startsWith('ric-devflow')?'ric-devflow':'teamai-cli';
    const upstream=lock.upstreams.find(item=>item.id===id);
    if(!IMPORTED_SKILLS.includes(pkg.name) || pkg.upstream!==id || pkg.path!==(id==='ric-design-patterns'?upstream.path:`${upstream.path}/skills/${pkg.name}`) || Object.hasOwn(pkg,'sourcePath') || pkg.commit!==upstream.commit || pkg.source!==upstream.url)throw new Error('Package does not match its upstream mapping');
    expectedFiles(pkg);
  }
  const references={'teamai-guide-zh':{path:'docs/usage-guide.zh-CN.md',destination:'references/usage-guide.zh-CN.md',transform:'pinned-markdown-links'},'teamai-license':{path:'LICENSE',destination:'LICENSE',transform:'identity'}};
  if(!Array.isArray(lock.references) || lock.references.length!==2 || new Set(lock.references.map(item=>item.id)).size!==2)throw new Error('Expected two unique official reference assets');
  const official=lock.upstreams.find(item=>item.id==='teamai-cli');
  for(const ref of lock.references) {
    const expected=references[ref.id];
    const anchors=ref.id==='teamai-guide-zh'?{'#项目级project-scope':'#项目级project-scope默认'}:undefined;
    if(stable(ref.anchorRepairs)!==stable(anchors))throw new Error('Unknown official guide anchor mapping');
    if(!expected || ref.upstream!==official.id || ref.path!==`${official.path}/${expected.path}` || ref.source!==official.url || ref.commit!==official.commit || ref.destination?.skill!=='teamai-cli' || ref.destination.path!==expected.destination || ref.transform!==expected.transform || !hex(ref.sha256) || !Number.isInteger(ref.mode) || ref.mode<0 || ref.mode>0o777)throw new Error('Invalid official reference mapping');
  }
  return {lock,lockDigest:hash(bytes)};
}
function rejectLegacySources(root) {
  const common=safePath(root,'skills/common');
  if(exists(common))for(const name of fs.readdirSync(common))if(!OWN_SKILLS.includes(name))throw new Error(`Legacy or unknown source copy preserved: skills/common/${name}; arrange an explicitly authorized archive migration`);
  const state=safePath(root,'.collaborative-foundation-infra');
  if(exists(state))for(const name of fs.readdirSync(state))if(['exports.json','prepare.lock','prepare-pending.json'].includes(name) || name.startsWith('prepare-'))throw new Error(`Legacy source preparation state preserved: ${name}; archive it explicitly, never treat it as source evidence`);
}
export function verifyUpstreams(root,source=loadSources(root)) {
  root=repositoryRoot(root);rejectLegacySources(root);
  const {lock}=source;
  const modules=safePath(root,'.gitmodules');
  if(!exists(modules) || !fs.lstatSync(modules).isFile() || fs.lstatSync(modules).nlink!==1)throw new Error('Missing or invalid .gitmodules file; restore the reviewed declarations, run git submodule update --init --recursive --checkout explicitly, then npm run prepare:skills');
  const declared=git(root,['config','--file',modules,'--get-regexp','^submodule\\..*\\.path$']).split('\n').sort();
  if(stable(declared)!==stable(lock.upstreams.map(item=>`submodule.${item.id}.path ${item.path}`).sort()))throw new Error('Unexpected .gitmodules declarations');
  // Check the complete index before suggesting initialization: Git cannot
  // initialize a declared submodule when its gitlink is absent from the source.
  for(const upstream of lock.upstreams) {
    const entries=git(root,['ls-files','--stage','-z','--',upstream.path]).split('\0').filter(Boolean);
    if(!entries.length)throw new Error(`Source is incomplete: missing index gitlink for ${upstream.path}; obtain a reviewed source containing all locked gitlinks before initializing submodules`);
    if(entries.length!==1 || entries[0]!==`160000 ${upstream.commit} 0\t${upstream.path}`)throw new Error(`Index gitlink does not match source lock: ${upstream.path}; expected ${upstream.commit}`);
  }
  for(const upstream of lock.upstreams) {
    const location=safePath(root,upstream.path);
    const instruction='Run git submodule update --init --recursive --checkout explicitly, then npm run prepare:skills';
    if(!exists(location) || !exists(path.join(location,'.git')))throw new Error(`Submodule is not initialized: ${upstream.path}. ${instruction}`);
    const metadata=fs.lstatSync(safePath(root,`${upstream.path}/.git`));
    if(!metadata.isDirectory() && (!metadata.isFile() || metadata.nlink!==1))throw new Error('Submodule Git metadata must be a regular unlinked file or real directory');
    if(git(root,['config','--file',modules,'--get',`submodule.${upstream.id}.path`])!==upstream.path || git(root,['config','--file',modules,'--get',`submodule.${upstream.id}.url`])!==upstream.url)throw new Error(`Submodule configuration mismatch: ${upstream.id}`);
    if(git(location,['rev-parse','--show-toplevel'])!==location || git(location,['rev-parse','HEAD'])!==upstream.commit)throw new Error(`Submodule HEAD mismatch: ${upstream.path}`);
    if(git(location,['status','--porcelain=v1','--untracked-files=all','--ignored']))throw new Error(`Dirty submodule preserved: ${upstream.path}`);
  }
  const packages={};
  for(const pkg of lock.packages) {
    const upstream=lock.upstreams.find(item=>item.id===pkg.upstream);
    const folder=safePath(root,pkg.path);
    if(!exists(folder))throw new Error(`Upstream lacks complete package: ${pkg.name}`);
    const files=packageInventory(folder,{skipGit:pkg.path===upstream.path});
    if(stable(files)!==stable(expectedFiles(pkg)))throw new Error(`Upstream package integrity mismatch: ${pkg.name}`);
    packages[pkg.name]={path:pkg.path,files};
  }
  const references={};
  for(const ref of lock.references) {
    const file=safePath(root,ref.path),stat=fs.lstatSync(file);
    if(!stat.isFile() || stat.nlink!==1 || stat.size>128*1024*1024 || hash(fs.readFileSync(file))!==ref.sha256 || modeFor(stat.mode)!==modeFor(ref.mode))throw new Error(`Official reference integrity mismatch: ${ref.id}`);
    references[ref.id]={path:ref.path,hash:ref.sha256,mode:modeFor(ref.mode),destination:ref.destination,transform:ref.transform};
  }
  return {...source,packages,references,sourcePackagesDigest:digest({packages,references})};
}
export function prepareSkills(root) {
  const source=verifyUpstreams(repositoryRoot(root));
  return {status:'verified',layoutVersion:4,upstreams:source.lock.upstreams,sourceLockDigest:source.lockDigest,sourcePackagesDigest:source.sourcePackagesDigest,packages:source.lock.packages.map(pkg=>({name:pkg.name,path:pkg.path,files:Object.keys(pkg.files).length}))};
}
export function standardVersion(root) {
  const names=['tools','scripts','rules','manifest','package.json','package-lock.json','sources.lock.json','teamai.yaml','skills/common/collaborative-foundation-infra/SKILL.md','skills/common/collaborative-foundation-infra/references','skills/common/collaborative-foundation-infra/templates','skills/common/teamai-cli'];
  const output={};
  for(const name of names) {
    const target=safePath(root,name);
    if(fs.lstatSync(target).isDirectory())for(const [file,entry] of Object.entries(inventory(target,{skipDirectories:new Set()})))output[`${name}/${file}`]={...entry,mode:modeFor(entry.mode)};
    else output[name]={type:'file',hash:hash(fs.readFileSync(target))};
  }
  return digest(output);
}
