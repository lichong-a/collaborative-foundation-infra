import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import YAML from 'yaml';
import {safePath,hash,stable,exists} from './repository.mjs';
import {packageInventory} from './sources.mjs';
import {verifyTeamConfiguration} from './teamai-config.mjs';
import {stageTeamResources,resourceIdentity} from './skill-resources.mjs';

export const OFFICIAL_SKILLS=['team-wiki-codebase','teamai-share-learnings','teamai'];
export function isolatedEnvironment(home) {
  const env={...process.env};
  for(const key of Object.keys(env))if(/^(?:npm_config_|TEAMAI_)/i.test(key) || ['NODE_OPTIONS','NODE_PATH'].includes(key))delete env[key];
  return {...env,HOME:home,USERPROFILE:home,XDG_CONFIG_HOME:path.join(home,'.config'),XDG_CACHE_HOME:path.join(home,'.cache'),XDG_DATA_HOME:path.join(home,'.local/share'),XDG_STATE_HOME:path.join(home,'.local/state'),TEAMAI_HOOKS_DISABLED:'1',TEAMAI_RECALL_DISABLED:'1',TEAMAI_CONTRIBUTE_HINT_DISABLED:'1',TEAMAI_PACKAGE_HINT_DISABLED:'1',TEAMAI_MR_HINT_DISABLED:'1',TEAMAI_DISABLE_REMOTE_CMD:'1',CI:'1'};
}
export function builtinSkillsInventory(packageRoot) {
  const root=safePath(packageRoot,'skills');
  return Object.fromEntries(fs.readdirSync(root).sort().map(name=>[name,packageInventory(safePath(root,name))]));
}
export function verifyBuiltinSkills(prepared,packageRoot,version='unknown') {
  const root=safePath(packageRoot,'skills'),actual=fs.readdirSync(root).sort();
  const missing=OFFICIAL_SKILLS.filter(name=>!actual.includes(name)),additional=actual.filter(name=>!OFFICIAL_SKILLS.includes(name));
  if(missing.length || additional.length)throw new Error(`TeamAI ${version}: CLI has missing or additional built-in Skills; missing=[${missing.join(', ')}], additional=[${additional.join(', ')}]; source update requires separate review`);
  const files={};
  for(const name of OFFICIAL_SKILLS) {
    files[name]=packageInventory(safePath(root,name));
    const expected=prepared.skills[name].files;
    if(stable(files[name])!==stable(expected)) {
      const first=[...new Set([...Object.keys(files[name]),...Object.keys(expected)])].sort().find(file=>stable(files[name][file])!==stable(expected[file]));
      throw new Error(`TeamAI ${version}: CLI built-in Skill differs from fixed source: ${name}/${first}; source update requires separate review`);
    }
  }
  return hash(stable(files));
}
export function cliVersion(entry) {
  const home=fs.mkdtempSync(path.join(os.tmpdir(),'cfi-teamai-version-'));fs.chmodSync(home,0o700);
  try {return execFileSync(process.execPath,[entry,'--version'],{cwd:home,env:isolatedEnvironment(home),encoding:'utf8',timeout:30000,maxBuffer:1024*1024}).trim();}
  finally {fs.rmSync(home,{recursive:true,force:true});}
}
export function withTeamaiOutput({source,prepared,agent,entry},consume) {
  verifyTeamConfiguration(source);
  const staging=fs.mkdtempSync(path.join(os.tmpdir(),'collaborative-foundation-infra-teamai-'));fs.chmodSync(staging,0o700);
  try {
    const home=path.join(staging,'member'),team=path.join(staging,'team');fs.mkdirSync(home,{mode:0o700});fs.mkdirSync(team,{mode:0o700});stageTeamResources(source,team,prepared);
    fs.mkdirSync(path.join(home,'.teamai'),{mode:0o700});
    const local={repo:{localPath:team,remote:'',kind:'self',businessRepoRoot:staging},username:'collaborative-foundation-infra-isolated',scope:'user',primaryRole:'engineering',additionalRoles:[],resourceProfileVersion:1,updatePolicy:'skip',recallEnabled:false,contributeHintEnabled:false,inheritUserScope:false,enabledAgents:[agent],disabledAgents:['codex','zcode','claude'].filter(name=>name!==agent)};
    fs.writeFileSync(path.join(home,'.teamai/config.yaml'),YAML.stringify(local),{flag:'wx',mode:0o600});
    const root=agent==='claude'?'.claude/skills':'.agents/skills';fs.mkdirSync(path.join(home,root),{recursive:true});if(agent!=='zcode')fs.mkdirSync(path.join(home,`.${agent}/rules`),{recursive:true});
    const logs=execFileSync(process.execPath,[entry,'pull','--force'],{cwd:staging,env:isolatedEnvironment(home),encoding:'utf8',timeout:120000,maxBuffer:10*1024*1024});
    const expected=Object.keys(prepared.skills).sort();
    if(stable(fs.readdirSync(safePath(home,root)).sort())!==stable(expected))throw new Error('TeamAI output has missing or extra Skills');
    for(const name of expected)if(stable(packageInventory(safePath(home,`${root}/${name}`)))!==stable(prepared.skills[name].files))throw new Error(`TeamAI output changed expected bytes: ${name}`);
    for(const other of ['.agents/skills','.claude/skills'])if(other!==root && exists(safePath(home,other)) && fs.readdirSync(safePath(home,other)).length)throw new Error('TeamAI produced resources for an unselected harness');
    for(const folder of ['.codex/rules','.claude/rules','.zcode/rules']) {
      const target=safePath(home,folder),wanted=agent!=='zcode' && folder===`.${agent}/rules`?['collaborative-foundation-infra.md']:[];
      if(stable(exists(target)?fs.readdirSync(target).sort():[])!==stable(wanted))throw new Error('TeamAI output has unexpected rules');
      if(wanted.length) {const file=safePath(target,wanted[0]),stat=fs.lstatSync(file);if(!stat.isFile() || stat.nlink!==1 || hash(fs.readFileSync(file))!==hash(fs.readFileSync(safePath(source,'rules/collaborative-foundation-infra.md'))))throw new Error('TeamAI changed rule bytes or object identity');}
    }
    if(resourceIdentity(source)!==prepared.sourceDigest)throw new Error('Source changed during TeamAI execution');
    return consume({home,root,logs,logsSha256:hash(logs)});
  } finally {fs.rmSync(staging,{recursive:true,force:true});}
}
export function verifyCompatibility(source,prepared,entry) {
  const agents={};for(const agent of ['codex','zcode','claude'])agents[agent]=withTeamaiOutput({source,prepared,entry,agent},output=>({status:'verified',logsSha256:output.logsSha256}));
  return {status:'verified',sourceLockDigest:prepared.lockDigest,distributionDigest:prepared.distributionDigest,agents};
}
