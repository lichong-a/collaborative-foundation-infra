import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { repositoryRoot, exists, hash, stable } from './repository.mjs';
import { standardVersion } from './sources.mjs';

const MODES=['devflow','basic'],AGENTS=['codex','zcode','claude'];
const HASH=/^[a-f0-9]{64}$/;
const installedVersion=()=>typeof CFI_STANDARD_VERSION==='undefined'?standardVersion(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')):CFI_STANDARD_VERSION;
function assertIdentifier(value,label) {
  if(typeof value!=='string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$/.test(value) || value==='.' || value==='..')throw new Error(`Invalid ${label}; use a stable explicit session identifier`);
}
function absolutePath(value,label) {
  if(typeof value!=='string' || !value || !path.isAbsolute(value) || /[\0\r\n]/.test(value) || value.split(path.sep).includes('..'))throw new Error(`${label} must be an absolute canonical path`);
  const absolute=path.resolve(value);
  let current=path.parse(absolute).root;
  for(const part of absolute.slice(current.length).split(path.sep).filter(Boolean)) {
    current=path.join(current,part);
    if(exists(current)) {
      const stat=fs.lstatSync(current);
      if(stat.isSymbolicLink())throw new Error(`${label} contains a symlink`);
      if(!stat.isDirectory() && current!==absolute)throw new Error(`${label} ancestor is not a directory`);
    }
  }
  return absolute;
}
function projectIdentity(root) {
  try {
    const common=execFileSync('git',['-C',root,'rev-parse','--path-format=absolute','--git-common-dir'],{encoding:'utf8',env:{...process.env,GIT_OPTIONAL_LOCKS:'0',LC_ALL:'C'},stdio:['ignore','pipe','pipe']}).trim();
    return hash(absolutePath(common,'Git common-dir'));
  } catch(error) {
    if(error.status!==128 || !error.stderr?.toString().includes('not a git repository'))throw error;
    let directory=root;
    while(true) {if(exists(path.join(directory,'.git')))throw new Error('Invalid Git metadata; project identity cannot be established');const parent=path.dirname(directory);if(parent===directory)break;directory=parent;}
    return hash(root);
  }
}
function context(options,environment) {
  if(!AGENTS.includes(options.agent))throw new Error('--agent must be codex, zcode, or claude');
  assertIdentifier(options.sessionId,'--session-id');
  if(options.rootSessionId!==undefined)assertIdentifier(options.rootSessionId,'--root-session-id');
  const root=repositoryRoot(options.repo),xdg=environment.stateHome;
  const state=absolutePath(xdg===undefined?path.join(environment.userHome,'.local','state'):xdg,'State home');
  const identity={project:projectIdentity(root),agent:options.agent,rootSession:hash(options.rootSessionId??options.sessionId)};
  const namespace=path.join(state,'collaborative-foundation-infra'),directory=path.join(namespace,'sessions',identity.project,identity.agent);
  const filename=path.join(directory,`${identity.rootSession}.json`),lockfile=path.join(directory,`${identity.rootSession}.lock`);
  return {identity,namespace,directory,filename,manualFilename:filename.replace(/\.json$/,'.manual.json'),lockfile,inherited:options.rootSessionId!==undefined,version:environment.standardVersion??installedVersion()};
}
function privateDirectory(directory,create=false) {
  absolutePath(directory,'Session directory');
  if(!exists(directory)) {
    if(!create)return false;
    const parent=path.dirname(directory);
    if(!exists(parent))privateDirectory(parent,true);
    fs.mkdirSync(directory,{mode:0o700});
  }
  const stat=fs.lstatSync(directory);
  if(!stat.isDirectory() || stat.uid!==process.getuid() || (stat.mode&0o077)!==0)throw new Error('Session namespace must be private and owned by this user');
  return true;
}
function checkDirectories(ctx,create=false) {
  absolutePath(ctx.directory,'Session directory');
  if(create) {
    const state=path.dirname(ctx.namespace);
    if(!exists(state))privateDirectory(state,true);
    if(!privateDirectory(ctx.namespace,true))return false;
  } else if(!exists(ctx.namespace))return false;
  const relative=path.relative(ctx.namespace,ctx.directory).split(path.sep);
  let directory=ctx.namespace;
  if(!privateDirectory(directory,create))return false;
  for(const part of relative) {directory=path.join(directory,part);if(!privateDirectory(directory,create))return false;}
  return true;
}
function readPrivate(filename) {
  absolutePath(filename,'Session file');
  if(!exists(filename))return null;
  const stat=fs.lstatSync(filename);
  if(!stat.isFile() || stat.nlink!==1 || stat.uid!==process.getuid() || (stat.mode&0o777)!==0o600 || stat.size>1024*1024)throw new Error('Session file must be an ordinary private 0600 file, without hard links');
  const descriptor=fs.openSync(filename,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
  try {
    const opened=fs.fstatSync(descriptor);
    if(opened.ino!==stat.ino || opened.dev!==stat.dev || opened.nlink!==1)throw new Error('Session file changed while opening');
    return {bytes:fs.readFileSync(descriptor),stat};
  } finally {fs.closeSync(descriptor);}
}
function validTime(value) {if(typeof value!=='string')return false;try{return new Date(value).toISOString()===value;}catch{return false;}}
function parseRecord(opened,ctx) {
  if(!opened)return null;
  const record=JSON.parse(opened.bytes);
  if(!record || record.schemaVersion!==1 || stable(record.identity)!==stable(ctx.identity) || !MODES.includes(record.mode) || !HASH.test(record.standardVersion) || !validTime(record.selectedAt) || !Array.isArray(record.history) || !record.history.length)throw new Error('Invalid or mismatched session record');
  const keys=['schemaVersion','identity','mode','selectedAt','standardVersion','history'];
  if(Object.keys(record).some(key=>!keys.includes(key)))throw new Error('Unknown session record field');
  for(const [index,event] of record.history.entries())if(!event || event.action!==(index===0?'select':'switch') || !MODES.includes(event.mode) || !HASH.test(event.standardVersion) || !validTime(event.selectedAt) || Object.keys(event).sort().join(',')!=='action,mode,selectedAt,standardVersion')throw new Error('Invalid session selection history');
  const last=record.history.at(-1);
  if(record.selectedAt!==record.history[0].selectedAt || last.mode!==record.mode || last.standardVersion!==record.standardVersion)throw new Error('Session history does not match its current selection');
  return record;
}
function syncDirectory(directory) {const fd=fs.openSync(directory,fs.constants.O_RDONLY|fs.constants.O_DIRECTORY);try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
function response(ctx,record,status) {
  return {schemaVersion:1,status,identity:ctx.identity,inherited:ctx.inherited,mode:record?.mode??null,selection:record,persisted:!!record,hostLoading:'not-verified'};
}
export function sessionAction(options,environment={}) {
  environment={userHome:os.homedir(),stateHome:process.env.XDG_STATE_HOME,...environment};
  if(!['status','select','switch'].includes(options.action))throw new Error('session action must be status, select, or switch');
  if(options.action==='status' && options.mode!==undefined)throw new Error('status does not accept --mode');
  if(options.action!=='status' && !MODES.includes(options.mode))throw new Error('--mode must be devflow or basic');
  if(options.action!=='status' && options.rootSessionId!==undefined)throw new Error('Child agents may only query and inherit the root session choice');
  const ctx=context(options,environment);
  if(!HASH.test(ctx.version))throw new Error('The current standard version is invalid');
  if(checkDirectories(ctx) && exists(ctx.manualFilename)) {
    readPrivate(ctx.manualFilename);
    throw new Error('A manual selection record requires explicit history-preserving reconciliation before using the session tool');
  }
  if(options.action==='status') {
    if(!checkDirectories(ctx))return response(ctx,null,'awaiting-selection');
    if(exists(ctx.lockfile)) {readPrivate(ctx.lockfile);throw new Error('Session update in progress or interrupted; inspect its private lock before recovery');}
    const record=parseRecord(readPrivate(ctx.filename),ctx);
    if(record && record.standardVersion!==ctx.version)throw new Error('Standard version changed; explicitly switch after stopping the previous session executors');
    return response(ctx,record,record?'selected':'awaiting-selection');
  }
  // Reading is mandatory before creating directories, so an invalid record or
  // absent switch cannot be turned into a new selection by a write operation.
  const directories=checkDirectories(ctx),initial=directories?parseRecord(readPrivate(ctx.filename),ctx):null;
  if(options.action==='switch' && !initial)throw new Error('Cannot switch an unselected session');
  if(initial && options.action==='select' && (initial.mode!==options.mode || initial.standardVersion!==ctx.version))throw new Error('Existing choice is preserved; use explicit session switch');
  checkDirectories(ctx,true);
  const lock=fs.openSync(ctx.lockfile,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);
  let temporary,publicationStarted=false,completed=false;
  try {
    fs.writeFileSync(lock,JSON.stringify({pid:process.pid,identity:ctx.identity,operation:options.action}));fs.fsyncSync(lock);
    const before=readPrivate(ctx.filename),record=parseRecord(before,ctx);
    if(stable(record)!==stable(initial))throw new Error('Session choice changed before lock acquisition');
    if(record && record.mode===options.mode && record.standardVersion===ctx.version) {completed=true;return response(ctx,record,'unchanged');}
    const event={action:record?'switch':'select',mode:options.mode,selectedAt:new Date().toISOString(),standardVersion:ctx.version};
    const next={schemaVersion:1,identity:ctx.identity,mode:options.mode,selectedAt:record?.selectedAt??event.selectedAt,standardVersion:ctx.version,history:[...(record?.history??[]),event]};
    const bytes=Buffer.from(JSON.stringify(next,null,2)+'\n');
    if(bytes.length>1024*1024)throw new Error('Session history limit reached; preserve the record and arrange explicit recovery');
    temporary=path.join(ctx.directory,`.${ctx.identity.rootSession}-${randomUUID()}.tmp`);
    const descriptor=fs.openSync(temporary,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);
    try{fs.writeFileSync(descriptor,bytes);fs.fsyncSync(descriptor);}finally{fs.closeSync(descriptor);}
    checkDirectories(ctx);
    const live=readPrivate(ctx.filename);
    if((before===null)!==(live===null) || before && (before.stat.ino!==live.stat.ino || before.stat.dev!==live.stat.dev || !before.bytes.equals(live.bytes)))throw new Error('Session record changed before atomic publication');
    publicationStarted=true;
    if(before)fs.renameSync(temporary,ctx.filename);
    else {fs.linkSync(temporary,ctx.filename);fs.unlinkSync(temporary);}
    temporary=null;syncDirectory(ctx.directory);
    const stored=readPrivate(ctx.filename);
    if(!stored || !stored.bytes.equals(bytes))throw new Error('Session readback verification failed');
    completed=true;return response(ctx,next,record?'switched':'selected');
  } finally {
    fs.closeSync(lock);
    if(completed || !publicationStarted) {
      if(temporary && exists(temporary))fs.unlinkSync(temporary);
      fs.unlinkSync(ctx.lockfile);
    }
    // An uncertain publication retains the lock. status refuses to present a
    // durable success until an operator has checked the real committed record.
  }
}
