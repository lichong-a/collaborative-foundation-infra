import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import YAML from 'yaml';
import { parse as parseToml } from 'smol-toml';
import { stable, safePath, exists, hash, repositoryRoot, git, assertCleanTarget } from './repository.mjs';
import { verifyUpstreams, packageInventory, IMPORTED_SKILLS, OWN_SKILLS } from './sources.mjs';
import { skillResources, resourceIdentity } from './skill-resources.mjs';
import {verifyTeamConfiguration} from './teamai-config.mjs';
import {resolveTeamaiRuntime,verifyTeamaiInstallation} from './teamai-runtime.mjs';
import {withTeamaiOutput} from './teamai-execution.mjs';

export const SKILLS=[...IMPORTED_SKILLS,...OWN_SKILLS];
export {EVENTS} from './teamai-config.mjs';
function skillInventory(directory) {return packageInventory(directory);}
export function verifySources(source) {const result=verifyUpstreams(source);verifyTeamConfiguration(source);return result.lock;}
function disabledTree(value) {
  if(!value || typeof value!=='object') return false;
  if(value.enabled===false && (value.name && SKILLS.includes(value.name) || typeof value.path==='string' && SKILLS.some(name=>value.path.includes(name)))) return true;
  return Object.entries(value).some(([key,child]) => (SKILLS.includes(key) && (child===false || child?.enabled===false)) || (child && typeof child==='object' && disabledTree(child)));
}
function checkDisabled(repo,agent,userHome) {
  const teamConfigs=[];
  const worktrees=git(repo,['worktree','list','--porcelain','-z'],true);
  const anchorEntry=worktrees?.split('\0').find(line=>line.startsWith('worktree '));
  if(anchorEntry) {
    const anchor=fs.realpathSync(anchorEntry.slice(9));
    // Same 0.24.0 prefix/hash scheme, read-only: inspect both case spellings
    // rather than running TeamAI's filesystem-writing case probe/migration.
    for(const normalized of new Set([anchor,anchor.toLowerCase()])) {
      let prefix=normalized.replace(/[^A-Za-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'') || 'project';
      if(prefix.length>180)prefix=prefix.slice(prefix.length-180).replace(/^[^-]*-/,'');
      const legacy=(path.basename(normalized).replace(/[^A-Za-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'') || 'project').slice(0,40);
      for(const name of new Set([prefix,legacy]))teamConfigs.push([userHome,`.teamai/projects/${name}-${hash(normalized).slice(0,16)}/config.yaml`]);
    }
  }
  for(const base of [...new Set([repo,userHome])]) {
    const configNames=['.teamai/config.yaml',...({codex:['.codex/config.toml','.codex/hooks.json'],zcode:['.zcode/cli/config.json'],claude:['.claude/settings.json']}[agent])];
    for(const name of configNames) {
      const file=safePath(base,name);
      if(!exists(file)) continue;
      const text=fs.readFileSync(file,'utf8');
      const config=name.endsWith('.toml')?parseToml(text):name.endsWith('.yaml')?YAML.parse(text):JSON.parse(text);
      if(config?.disabledAgents?.includes(agent) || config?.enabledAgents && !config.enabledAgents.includes(agent) || config?.excludedSkills?.some(name=>SKILLS.includes(name)) || (agent==='codex' && name.endsWith('config.toml') && config?.agents?.enabled===false) || disabledTree(config)) throw new Error(`Explicit disabled configuration preserved: ${name}`);
      if(/teamai[^\n]*(?:hook-dispatch|session-start|pull)/i.test(JSON.stringify(config?.hooks ?? {}))) throw new Error(`Existing TeamAI automatic hooks require manual ownership review: ${name}`);
    }
  }
  for(const [base,name] of teamConfigs) {
    const file=safePath(base,name);
    if(!exists(file))continue;
    const config=YAML.parse(fs.readFileSync(file,'utf8'));
    if(config?.disabledAgents?.includes(agent) || config?.enabledAgents && !config.enabledAgents.includes(agent) || config?.excludedSkills?.some(name=>SKILLS.includes(name)) || disabledTree(config))throw new Error(`Explicit disabled project-partition configuration preserved: ${name}`);
  }
}
function ownTree(directory) { return exists(directory) ? skillInventory(directory) : null; }
function destinations(source,repo,agent,resources) {
  const skillRoot=agent==='claude'?'.claude/skills':'.agents/skills';
  const output=SKILLS.map(name=>({name,relative:`${skillRoot}/${name}`,source:resources.skills[name].sourcePath,kind:'directory'}));
  if(agent!=='zcode') output.push({name:'collaborative-foundation-infra-rule',relative:`.${agent}/rules/collaborative-foundation-infra.md`,source:'rules/collaborative-foundation-infra.md',kind:'file'});
  for(const item of output) {
    const original=safePath(source,item.source), target=safePath(repo,item.relative);
    if(item.kind==='directory') {
      item.expected=resources.skills[item.name].files;
      if(exists(target) && stable(ownTree(target))!==stable(item.expected)) throw new Error(`Customized or different-version destination preserved: ${item.relative}`);
    } else {
      item.expected=hash(fs.readFileSync(original));
      if(exists(target) && (!fs.lstatSync(target).isFile() || fs.lstatSync(target).nlink!==1 || hash(fs.readFileSync(target))!==item.expected)) throw new Error(`Customized rule preserved: ${item.relative}`);
    }
    item.present=exists(target);
  }
  return output;
}
function entryBlock(agent) {
  const folder=agent==='claude'?'.claude':'.agents';
  return `<!-- collaborative-foundation-infra:session:start -->\n工程任务开始前，先读取 [会话选择协议](${folder}/skills/collaborative-foundation-infra/references/session.md)，核对根会话身份并查询已持久化的选择。未选择时仅做必要的身份只读检查，等待用户明确选择；同根恢复复用选择，新主会话或分叉重新选择，子 Agent 仅继承。两模式都遵循 [工程规范](${folder}/skills/collaborative-foundation-infra/SKILL.md)；只有 devflow 模式才准备原生角色并加载其交付协议，basic 保留原流程状态且不写入它。\n<!-- collaborative-foundation-infra:session:end -->\n`;
}
function preflightEntry(repo,agent,requested) {
  const relative=agent==='claude'?'CLAUDE.md':'AGENTS.md';
  if(!requested)return {relative,requested:false,change:false,matched:false};
  const block=entryBlock(agent),blockDigest=hash(block),target=safePath(repo,relative);
  let before=null,mode=0o644,identity=null;
  if(exists(target)) {
    const stat=fs.lstatSync(target);
    if(!stat.isFile() || stat.nlink!==1 || stat.size>4*1024*1024)throw new Error('Entry must be an ordinary bounded file without hard links');
    before=fs.readFileSync(target);mode=stat.mode&0o777;identity={ino:stat.ino,dev:stat.dev};
    const text=new TextDecoder('utf-8',{fatal:true}).decode(before),start='<!-- collaborative-foundation-infra:session:start -->',end='<!-- collaborative-foundation-infra:session:end -->';
    if(text.includes(start) || text.includes(end)) {
      if(text.split(start).length!==2 || text.split(end).length!==2 || !text.includes(block))throw new Error(`Customized, duplicate or incomplete entry block preserved: ${relative}`);
      return {relative,requested:true,change:false,matched:true,blockDigest,before,mode,identity};
    }
    assertCleanTarget(repo,relative);
  }
  const separator=before?.length?(before.at(-1)===10?'\n':'\n\n'):'';
  return {relative,requested:true,change:true,matched:false,blockDigest,before,mode,identity,content:Buffer.concat([before??Buffer.alloc(0),Buffer.from(separator+block)])};
}
function recheckEntry(repo,agent,requested,expected) {
  const actual=preflightEntry(repo,agent,requested);
  if(stable(actual)!==stable(expected))throw new Error('Project entry changed before publication');
}
function syncDirectory(directory) {const fd=fs.openSync(directory,fs.constants.O_RDONLY|fs.constants.O_DIRECTORY);try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
function entryReport(entry) {return {path:entry.relative,status:entry.matched?'matched':entry.requested?'planned':'not-requested',hostLoading:'not-verified'};}
function verifyProjectEntries(repo,entries) {
  for(const name of Object.keys(entries)) {
    const actual=preflightEntry(repo,name==='CLAUDE.md'?'claude':'codex',true);
    if(!actual.matched)throw new Error(`Previously recorded project entry is no longer matched: ${name}; preserve and review before recovery`);
  }
}
function preflightReceipt(repo,sourceDigest,prepared,agent,output) {
  const target=safePath(repo,'.collaborative-foundation-infra/teamai-installation.json');
  if(!exists(target))return null;
  const stat=fs.lstatSync(target);
  if(!stat.isFile() || stat.nlink!==1 || stat.size>1024*1024)throw new Error('Customized installation receipt object preserved');
  const bytes=fs.readFileSync(target),record=JSON.parse(bytes);
  if(record.schemaVersion!==4 || record.teamai!==prepared.runtime.package.version || stable(record.teamaiPackage)!==stable(prepared.runtime.package) || record.sourceDigest!==sourceDigest || record.sourceLockDigest!==prepared.lockDigest || record.sourceLayoutVersion!==4 || record.sourcePackagesDigest!==prepared.sourcePackagesDigest || record.distributionDigest!==prepared.distributionDigest || stable(record.upstreams)!==stable(prepared.lock.upstreams) || stable(record.skills)!==stable(SKILLS) || record.manualSync!==true || record.resourceFiles!=='verified' || record.nativeRoles!=='not-installed' || record.hostLoading!=='not-verified' || !Array.isArray(record.agents) || !record.agents.length || record.agents.some(item=>!['codex','zcode','claude'].includes(item)) || !record.agents.includes(record.agent) || !record.projectEntries || typeof record.projectEntries!=='object' || Array.isArray(record.projectEntries))throw new Error('Customized or old/different-version installation receipt preserved; independent migration is required');
  for(const [name,entry] of Object.entries(record.projectEntries))if(!['AGENTS.md','CLAUDE.md'].includes(name) || entry.status!=='matched' || entry.hostLoading!=='not-verified' || entry.blockDigest!==hash(entryBlock(name==='CLAUDE.md'?'claude':'codex')))throw new Error('Customized entry receipt preserved');
  const keys=['schemaVersion','teamai','teamaiPackage','sourceDigest','agent','agents','skills','manualSync','resourceFiles','projectEntries','artifact','sourceLockDigest','dependencyLockDigest','upstreams','sourceLayoutVersion','sourcePackagesDigest','distributionDigest','generatedBy','nativeRoles','hostLoading','logsSha256'];
  if(Object.keys(record).some(key=>!keys.includes(key)) || new Set(record.agents).size!==record.agents.length || record.artifact?.pathWithinSkill!=='scripts/governance.mjs' || record.artifact.sha256!==prepared.artifactHash || record.dependencyLockDigest!==prepared.dependencyLockDigest || record.generatedBy!=='teamai pull --force in isolated environment' || !/^[a-f0-9]{64}$/.test(record.logsSha256??''))throw new Error('Customized installation receipt fields preserved');
  verifyProjectEntries(repo,record.projectEntries);
  if(record.agents.includes(agent) && output.some(item=>!item.present))throw new Error('Previously installed resources are incomplete; preserve and review before recovery');
  return {record,hash:hash(bytes),identity:{ino:stat.ino,dev:stat.dev}};
}

export function syncTeam({repo,source,agent,apply=false,installEntry=false,userHome=os.homedir(),teamaiEntry,dataHome}) {
  repo=repositoryRoot(repo); source=repositoryRoot(source); userHome=repositoryRoot(userHome);
  if(!['codex','zcode','claude'].includes(agent)) throw new Error('--agent must be codex, zcode, or claude');
  if(repo===source || repo===userHome) throw new Error('A separate business repository is required; user-scope publishing is unsupported');
  verifySources(source);
  checkDisabled(repo,agent,userHome);
  const prepared=skillResources(source),sourceDigest=prepared.sourceDigest;
  const output=destinations(source,repo,agent,prepared);
  prepared.artifactHash=hash(fs.readFileSync(safePath(source,'skills/common/collaborative-foundation-infra/scripts/governance.mjs')));
  prepared.dependencyLockDigest=hash(fs.readFileSync(safePath(source,'package-lock.json')));
  const runtime=resolveTeamaiRuntime({source,dataHome,teamaiEntry});prepared.runtime=runtime;
  const entry=preflightEntry(repo,agent,installEntry),prior=preflightReceipt(repo,sourceDigest,prepared,agent,output);
  if(!apply) return {status:'ready',teamai:runtime.package.version,teamaiPackage:runtime.package,distributionExecution:'not-run',agent,sourceDigest,skills:SKILLS,changes:[...output.filter(item=>!item.present).map(item=>item.relative),...(entry.change?[entry.relative]:[])],projectEntry:entryReport(entry),nativeRoles:'not-installed',hostLoading:'not-verified'};
  const version=runtime.package.version;
  return withTeamaiOutput({source,prepared,agent,entry:runtime.entry},({home,root,logs})=> {
    for(const item of output) {
      const generated=safePath(home,item.relative);
      if(!exists(generated)) throw new Error(`TeamAI did not generate: ${item.relative}`);
      if(item.kind==='directory' ? stable(skillInventory(generated))!==stable(item.expected) : hash(fs.readFileSync(generated))!==item.expected) throw new Error(`TeamAI output changed the source bytes: ${item.relative}`);
    }
    if(sourceDigest!==resourceIdentity(source)) throw new Error('Source changed during TeamAI pull');
    checkDisabled(repo,agent,userHome);
    destinations(source,repo,agent,prepared);
    const receiptPath=safePath(repo,'.collaborative-foundation-infra/teamai-installation.json');
    recheckEntry(repo,agent,installEntry,entry);
    if(stable(preflightReceipt(repo,sourceDigest,prepared,agent,output))!==stable(prior))throw new Error('Installation receipt changed during TeamAI pull');
    const publishLock=path.join(os.tmpdir(),`collaborative-foundation-infra-sync-${hash(repo)}.lock`);
    const descriptor=fs.openSync(publishLock,'wx',0o600);
    const created=[];
    try {
      const currentRuntime=verifyTeamaiInstallation({source,installation:runtime.installation});
      if(stable(currentRuntime.package)!==stable(runtime.package))throw new Error('Runtime changed before publication');
      const currentSource=skillResources(source);
      if(currentSource.lockDigest!==prepared.lockDigest || currentSource.sourcePackagesDigest!==prepared.sourcePackagesDigest || currentSource.distributionDigest!==prepared.distributionDigest || resourceIdentity(source)!==sourceDigest)throw new Error('Source changed before resource publication');
      checkDisabled(repo,agent,userHome);
      destinations(source,repo,agent,prepared);
      recheckEntry(repo,agent,installEntry,entry);
      if(stable(preflightReceipt(repo,sourceDigest,prepared,agent,output))!==stable(prior))throw new Error('Installation receipt changed before publication');
      for(const item of output) {
        const target=safePath(repo,item.relative), generated=safePath(home,item.relative);
        if(exists(target)) continue;
        fs.mkdirSync(path.dirname(target),{recursive:true}); safePath(repo,item.relative);
        // Exclusive file creation plus a private directory prevents overwrites.
        if(item.kind==='directory') {
          fs.mkdirSync(target);
          created.push({item,target});
          for(const [name,entry] of Object.entries(item.expected)) {
            if(entry.type!=='file') throw new Error('Distributed symlinks are unsupported');
            const destination=safePath(target,name);
            fs.mkdirSync(path.dirname(destination),{recursive:true});
            fs.copyFileSync(safePath(generated,name),destination,fs.constants.COPYFILE_EXCL); fs.chmodSync(destination,entry.mode);
          }
        } else { fs.copyFileSync(generated,target,fs.constants.COPYFILE_EXCL); created.push({item,target}); }
      }
      destinations(source,repo,agent,prepared);
      recheckEntry(repo,agent,installEntry,entry);
      if(entry.change) {
        const target=safePath(repo,entry.relative);
        const temporary=path.join(repo,`.cfi-entry-${randomUUID()}.tmp`);
        const descriptor=fs.openSync(temporary,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);
        try {
          fs.writeFileSync(descriptor,entry.content);fs.fchmodSync(descriptor,entry.mode);fs.fsyncSync(descriptor);
        } finally {fs.closeSync(descriptor);}
        if(!fs.readFileSync(temporary).equals(entry.content))throw new Error('Staged entry bytes are incomplete; original entry preserved');
        recheckEntry(repo,agent,installEntry,entry);
        if(entry.before===null) {fs.linkSync(temporary,target);fs.unlinkSync(temporary);}
        else fs.renameSync(temporary,target);
        syncDirectory(repo);
        if(!fs.readFileSync(target).equals(entry.content))throw new Error('Entry readback failed');
        created.push({item:{relative:entry.relative},target});
      }
      const projectEntries={...(prior?.record.projectEntries??{})};
      if(installEntry)projectEntries[entry.relative]={status:'matched',blockDigest:entry.blockDigest,hostLoading:'not-verified'};
      const receipt={schemaVersion:4,teamai:version,teamaiPackage:runtime.package,sourceDigest,agent:prior?.record.agent??agent,agents:[...new Set([...(prior?.record.agents??[]),agent])].sort(),skills:SKILLS,manualSync:true,resourceFiles:'verified',projectEntries,artifact:{pathWithinSkill:'scripts/governance.mjs',sha256:hash(fs.readFileSync(safePath(home,`${root}/collaborative-foundation-infra/scripts/governance.mjs`)))},sourceLockDigest:hash(fs.readFileSync(safePath(source,'sources.lock.json'))),dependencyLockDigest:hash(fs.readFileSync(safePath(source,'package-lock.json'))),upstreams:prepared.lock.upstreams,sourceLayoutVersion:4,sourcePackagesDigest:prepared.sourcePackagesDigest,distributionDigest:prepared.distributionDigest,generatedBy:'teamai pull --force in isolated environment',nativeRoles:'not-installed',hostLoading:'not-verified',logsSha256:prior?.record.logsSha256??hash(logs)};
      verifyUpstreams(source);
      if(stable(verifyTeamaiInstallation({source,installation:runtime.installation}).package)!==stable(runtime.package))throw new Error('Runtime changed before receipt commit');
      if(resourceIdentity(source)!==sourceDigest)throw new Error('Source changed before installation receipt commit');
      if(stable(preflightReceipt(repo,sourceDigest,prepared,agent,output))!==stable(prior))throw new Error('Installation receipt changed before commit');
      verifyProjectEntries(repo,projectEntries);
      if(!prior || stable(receipt)!==stable(prior.record)) {
        fs.mkdirSync(path.dirname(receiptPath),{recursive:true});safePath(repo,'.collaborative-foundation-infra/teamai-installation.json');
        const temporary=path.join(path.dirname(receiptPath),`.receipt-${process.pid}-${hash(logs).slice(0,12)}.tmp`);
        const fd=fs.openSync(temporary,'wx',0o600);
        try {fs.writeFileSync(fd,JSON.stringify(receipt,null,2)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
        if(stable(preflightReceipt(repo,sourceDigest,prepared,agent,output))!==stable(prior))throw new Error('Installation receipt changed before atomic publication');
        if(prior)fs.renameSync(temporary,receiptPath);
        else {fs.linkSync(temporary,receiptPath);fs.unlinkSync(temporary);}
        syncDirectory(path.dirname(receiptPath));
        if(!fs.readFileSync(receiptPath).equals(Buffer.from(JSON.stringify(receipt,null,2)+'\n')))throw new Error('Installation receipt readback failed');
      }
      verifyProjectEntries(repo,projectEntries);
      return {status:created.length?'installed':'noop',...receipt,agent,projectEntry:entryReport(installEntry?{...entry,change:false,matched:true}:entry),changed:created.map(({item})=>item.relative)};
    } catch(error) {
      // Preserve partial output as evidence; never recursively remove a directory
      // another process could now have modified. The next preflight refuses it.
      throw new Error(`${error.message}; partial publication: ${created.map(({item})=>item.relative).join(',') || 'none'}; inspect before retry`);
    } finally { fs.closeSync(descriptor); fs.unlinkSync(publishLock); }
  });
}
