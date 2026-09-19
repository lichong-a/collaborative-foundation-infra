import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {randomUUID,createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {safePath,repositoryRoot,relativeName,hash,stable,exists} from './repository.mjs';
import {packageInventory} from './sources.mjs';
import {skillResources,resourceIdentity} from './skill-resources.mjs';
import {isolatedEnvironment,verifyBuiltinSkills,cliVersion,verifyCompatibility} from './teamai-execution.mjs';

const ENTRY='install/node_modules/teamai-cli/dist/index.js',ID=/^[a-f0-9-]{36}$/,HEX=/^[a-f0-9]{64}$/;
const version=value=>typeof value==='string' && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(value);
function privateDirectory(directory,create=false) {
  if(!path.isAbsolute(directory))throw new Error('Runtime data root must be absolute');
  const normalized=path.resolve(directory);let current=path.parse(normalized).root;
  for(const part of normalized.slice(current.length).split(path.sep).filter(Boolean)) {
    current=path.join(current,part);
    if(!exists(current)) {if(!create)throw new Error('Prepared TeamAI CLI is missing; run npm run prepare:teamai');fs.mkdirSync(current,{mode:0o700});}
    const stat=fs.lstatSync(current);if(!stat.isDirectory() || stat.isSymbolicLink())throw new Error('Runtime path has an unsafe ancestor');
  }
  const stat=fs.lstatSync(normalized);
  if(stat.uid!==process.getuid?.() || (stat.mode&0o077)!==0)throw new Error('Runtime namespace must be user-owned and private; existing permissions are preserved');
  return normalized;
}
function location(dataHome,create=false) {
  const data=dataHome??process.env.XDG_DATA_HOME??path.join(os.homedir(),'.local/share');
  if(!path.isAbsolute(data))throw new Error('--data-home must be an absolute path');
  privateDirectory(path.join(data,'collaborative-foundation-infra'),create);
  return privateDirectory(path.join(data,'collaborative-foundation-infra/teamai'),create);
}
function ordinary(file,limit=4*1024*1024) {
  const stat=fs.lstatSync(file);if(!stat.isFile() || stat.nlink!==1 || stat.size>limit || stat.uid!==process.getuid?.())throw new Error('Runtime file must be user-owned, ordinary, bounded and without hard links');return fs.readFileSync(file);
}
function readJson(root,name) {const file=safePath(root,name);if(['receipt.json','current.json'].includes(name) && (fs.lstatSync(file).mode&0o777)!==0o600)throw new Error('Runtime state file must remain private');return JSON.parse(ordinary(file).toString());}
function syncDir(directory) {const fd=fs.openSync(directory,fs.constants.O_RDONLY|fs.constants.O_DIRECTORY);try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
function writeNew(file,bytes) {const fd=fs.openSync(file,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}if(!fs.readFileSync(file).equals(Buffer.from(bytes)))throw new Error('Runtime write readback failed');}
function files(root) {
  const output={};let total=0;
  function visit(dir,prefix='') {for(const name of fs.readdirSync(dir).sort()) {
    const relative=prefix?prefix+'/'+name:name,full=safePath(root,relative),stat=fs.lstatSync(full);
    if(stat.isDirectory()){output[relative]={type:'directory',mode:stat.mode&0o777};visit(full,relative);}
    else {const bytes=ordinary(full,128*1024*1024);total+=bytes.length;if(total>512*1024*1024)throw new Error('Runtime installation exceeds bounded size');output[relative]={type:'file',mode:stat.mode&0o777,sha256:hash(bytes)};}
  }}visit(root);return output;
}
function verifyPackageMetadata(value) {
  if(value?.name!=='teamai-cli' || !version(value.version) || typeof value.tarball!=='string' || !/^https:\/\/registry\.npmjs\.org\/teamai-cli\/-\/teamai-cli-[^/?#]+\.tgz$/.test(value.tarball) || !/^sha512-[A-Za-z0-9+/]{86}==$/.test(value.integrity??''))throw new Error('Invalid TeamAI registry package identity');
}
function archiveFiles(bytes,identity) {
  verifyPackageMetadata(identity);
  if('sha512-'+createHash('sha512').update(bytes).digest('base64')!==identity.integrity)throw new Error('TeamAI archive integrity mismatch');
  const tar=gunzipSync(bytes,{maxOutputLength:128*1024*1024}),result={};let offset=0,pax={};
  const string=(header,start,length)=>header.subarray(start,start+length).toString('utf8').split('\0')[0];
  const number=text=>{if(!/^[0-7\s]*$/.test(text))throw new Error('Unsupported archive number');const n=parseInt(text.trim()||'0',8);if(!Number.isSafeInteger(n) || n<0)throw new Error('Invalid archive size');return n;};
  while(offset+512<=tar.length) {
    const header=tar.subarray(offset,offset+512);if(header.every(byte=>byte===0))break;
    const sum=[...header].reduce((n,byte,index)=>n+(index>=148&&index<156?32:byte),0);if(sum!==number(string(header,148,8)))throw new Error('Invalid archive header checksum');
    const size=number(string(header,124,12)),type=string(header,156,1)||'0',prefix=string(header,345,155);let name=(prefix?prefix+'/':'')+string(header,0,100);offset+=512;
    if(offset+size>tar.length)throw new Error('Truncated archive');const body=tar.subarray(offset,offset+size);offset+=Math.ceil(size/512)*512;
    if(type==='x') {let cursor=0;pax={};while(cursor<body.length){const space=body.indexOf(32,cursor),length=Number(body.subarray(cursor,space).toString());if(space<cursor || !Number.isSafeInteger(length) || length<4 || cursor+length>body.length)throw new Error('Invalid archive extended header');const line=body.subarray(space+1,cursor+length-1).toString(),equal=line.indexOf('=');if(equal<1)throw new Error('Invalid archive field');pax[line.slice(0,equal)]=line.slice(equal+1);cursor+=length;}continue;}
    name=pax.path??name;if(pax.size && Number(pax.size)!==size)throw new Error('Ambiguous archive size');pax={};
    if(type==='5'){if(name!=='package/' && name!=='package')relativeName(name.replace(/\/$/,''));continue;}
    if(type!=='0' || !name.startsWith('package/'))throw new Error('Archive contains an unsupported object');
    const relative=relativeName(name.slice(8));if(Object.hasOwn(result,relative))throw new Error('Duplicate archive entry');
    result[relative]={type:'file',hash:hash(body),mode:number(string(header,100,8))&0o100?0o755:0o644};
  }
  if(!result['package.json'] || !result['dist/index.js'])throw new Error('Archive lacks the official CLI entry');return result;
}
function validatePackage(installation,identity,prepared) {
  const archive=ordinary(safePath(installation,'archive.tgz'),128*1024*1024),expected=archiveFiles(archive,identity),packageRoot=safePath(installation,'install/node_modules/teamai-cli');
  if(stable(packageInventory(packageRoot))!==stable(expected))throw new Error('Installed TeamAI package differs from its verified archive');
  const manifest=readJson(packageRoot,'package.json');if(manifest.name!==identity.name || manifest.version!==identity.version || manifest.bin?.teamai!=='dist/index.js')throw new Error('CLI package identity or bin ownership mismatch');
  const builtinSkillsDigest=verifyBuiltinSkills(prepared,packageRoot),entry=safePath(installation,ENTRY);
  if(cliVersion(entry)!==identity.version)throw new Error('Actual CLI version differs from package identity');
  return {entry,builtinSkillsDigest};
}
export function verifyTeamaiInstallation({source,installation}) {
  source=repositoryRoot(source);installation=privateDirectory(installation);const receipt=readJson(installation,'receipt.json');
  if(stable(fs.readdirSync(installation).sort())!==stable(['archive.tgz','install','receipt.json']))throw new Error('Unknown runtime installation content preserved');
  if(receipt.schemaVersion!==1 || !ID.test(receipt.installationId) || path.basename(installation)!==receipt.installationId || receipt.entry!==ENTRY || !HEX.test(receipt.installManifestDigest??'') || !HEX.test(receipt.packageLockDigest??'') || !HEX.test(receipt.builtinSkillsDigest??''))throw new Error('Invalid runtime installation receipt');
  const actual=files(safePath(installation,'install'));if(stable(actual)!==stable(receipt.files) || hash(stable(actual))!==receipt.installManifestDigest || hash(ordinary(safePath(installation,'install/package-lock.json'),16*1024*1024))!==receipt.packageLockDigest)throw new Error('Runtime installation content changed; preserve and review');
  const prepared=skillResources(source),verified=validatePackage(installation,receipt.package,prepared);
  if(verified.builtinSkillsDigest!==receipt.builtinSkillsDigest || receipt.compatibility?.status!=='verified' || !HEX.test(receipt.compatibility.sourceLockDigest??'') || !HEX.test(receipt.compatibility.distributionDigest??'') || stable(Object.keys(receipt.compatibility.agents??{}).sort())!==stable(['claude','codex','zcode']) || Object.values(receipt.compatibility.agents).some(item=>item.status!=='verified' || !HEX.test(item.logsSha256??'')))throw new Error('Invalid runtime compatibility receipt');
  const keys=['schemaVersion','installationId','package','entry','files','installManifestDigest','packageLockDigest','builtinSkillsDigest','compatibility'];if(Object.keys(receipt).some(key=>!keys.includes(key)))throw new Error('Unknown runtime receipt fields');
  return {...verified,installation,receipt,receiptDigest:hash(ordinary(safePath(installation,'receipt.json'))),package:{...receipt.package,manifestDigest:receipt.installManifestDigest,receiptDigest:hash(ordinary(safePath(installation,'receipt.json')))}};
}
function namespaceState(namespace) {
  const names=fs.readdirSync(namespace);if(names.some(name=>!['installations','current.json','prepare.lock'].includes(name)))throw new Error('Unknown runtime namespace content preserved');
  if(exists(safePath(namespace,'installations')))privateDirectory(safePath(namespace,'installations'));
  const current=exists(safePath(namespace,'current.json'))?readJson(namespace,'current.json'):null;
  if(current && (Object.keys(current).sort().join(',')!=='installationId,receiptSha256' || !ID.test(current.installationId) || !HEX.test(current.receiptSha256??'')))throw new Error('Invalid current runtime pointer');
  const namesInstalled=exists(safePath(namespace,'installations'))?fs.readdirSync(safePath(namespace,'installations')):[];
  if(!current && namesInstalled.length)throw new Error('Unowned runtime installation preserved');
  if(current && !namesInstalled.includes(current.installationId))throw new Error('Current runtime installation is missing');
  for(const name of namesInstalled){if(!ID.test(name))throw new Error('Unknown runtime installation preserved');const root=safePath(namespace,`installations/${name}`);privateDirectory(root);const r=readJson(root,'receipt.json');if(r.schemaVersion!==1 || r.installationId!==name || r.entry!==ENTRY || !HEX.test(r.installManifestDigest??'') || !r.files || stable(fs.readdirSync(root).sort())!==stable(['archive.tgz','install','receipt.json']))throw new Error('Unknown runtime installation identity');if(name===current?.installationId && hash(ordinary(safePath(root,'receipt.json')))!==current.receiptSha256)throw new Error('Current runtime receipt binding changed');}
  return current;
}
// Internal selection is separate from the public transaction visibility barrier.
function resolveInstallation(source,namespace,current,teamaiEntry) {
  let installation;
  if(teamaiEntry) {
    if(!path.isAbsolute(teamaiEntry))throw new Error('--teamai-entry must be absolute and belong to a prepared runtime');
    const relative=path.relative(namespace,path.resolve(teamaiEntry)).split(path.sep).join('/'),match=/^installations\/([a-f0-9-]{36})\/install\/node_modules\/teamai-cli\/dist\/index\.js$/.exec(relative);
    if(!match)throw new Error('Explicit CLI entry lacks prepared runtime provenance; run npm run prepare:teamai');installation=safePath(namespace,`installations/${match[1]}`);
  } else {if(!current)throw new Error('Prepared TeamAI CLI is missing; run npm run prepare:teamai');installation=safePath(namespace,`installations/${current.installationId}`);}
  const runtime=verifyTeamaiInstallation({source,installation});
  if((!teamaiEntry || runtime.receipt.installationId===current?.installationId) && runtime.receiptDigest!==current?.receiptSha256)throw new Error('Current runtime receipt binding changed');
  return runtime;
}
function assertNoPreparation(namespace) {
  if(exists(safePath(namespace,'prepare.lock')))throw new Error('TeamAI preparation transaction is incomplete; retry after its lock is released');
}
export function resolveTeamaiRuntime({source=process.cwd(),dataHome,teamaiEntry}={}) {
  const namespace=location(dataHome);assertNoPreparation(namespace);
  const owner=directoryIdentity(namespace),current=namespaceState(namespace),pointer=safePath(namespace,'current.json');
  const before=current?ordinary(pointer):null,pointerIdentity=current?objectIdentity(fs.lstatSync(pointer)):null;
  const runtime=resolveInstallation(source,namespace,current,teamaiEntry);
  assertDirectoryIdentity(owner);assertNoPreparation(namespace);
  if(stable(namespaceState(namespace))!==stable(current) || (current && (stable(objectIdentity(fs.lstatSync(pointer)))!==stable(pointerIdentity) || !ordinary(pointer).equals(before))))throw new Error('Runtime selection changed during resolution; retry after preparation completes');
  // A newly started transaction can only retire its own candidate; already
  // committed installations returned before it started remain available.
  assertNoPreparation(namespace);
  return runtime;
}
function npmProcess({args,cwd,env,timeout}) {return execFileSync('npm',args,{cwd,env,encoding:'utf8',timeout,maxBuffer:16*1024*1024});}
// Retain object and ancestor identities from creation; a pathname alone is not ownership.
function objectIdentity(stat) {return {dev:stat.dev,ino:stat.ino,mode:stat.mode,uid:stat.uid};}
function directoryIdentity(directory) {
  const entries=[];let current=path.resolve(directory);
  while(true) {
    const stat=fs.lstatSync(current);if(!stat.isDirectory() || stat.isSymbolicLink())throw new Error('Runtime directory identity is unsafe');
    entries.push({path:current,identity:objectIdentity(stat)});const parent=path.dirname(current);if(parent===current)break;current=parent;
  }
  return entries.reverse();
}
function assertDirectoryIdentity(entries) {
  for(const item of entries)if(stable(objectIdentity(fs.lstatSync(item.path)))!==stable(item.identity))throw new Error(`Runtime directory or parent replaced; preserve: ${item.path}`);
}
export function prepareTeamai({source=process.cwd(),dataHome,offline=false,upgrade=false}={}, {runNpm=npmProcess}={}) {
  source=repositoryRoot(source);const prepared=skillResources(source);
  let namespace;
  try {namespace=location(dataHome);}catch(error) {if(!String(error.message).startsWith('Prepared TeamAI CLI is missing'))throw error;if(offline)throw new Error('Offline: no prepared TeamAI runtime; run npm run prepare:teamai online');namespace=location(dataHome,true);}
  const prior=namespaceState(namespace),pointer=safePath(namespace,'current.json'),before=prior?ordinary(pointer):null,lock=safePath(namespace,'prepare.lock');
  const namespaceOwner=directoryIdentity(namespace),fd=fs.openSync(lock,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);
  let lockIdentity,work,workOwner,candidate,candidateOwner,next,pointerIdentity,result,published=false,closeAttempted=false;
  const errors=[];
  const attempt=(label,action)=>{try {action();return true;}catch(error){errors.push(new Error(`${label}: ${error.message}`,{cause:error}));return false;}};
  const assertLock=()=>{
    assertDirectoryIdentity(namespaceOwner);
    const stat=fs.lstatSync(lock);
    if(!lockIdentity || !stat.isFile() || stat.nlink!==1 || stable(objectIdentity(stat))!==stable(lockIdentity))throw new Error('Preparation lock replaced; preserve unknown resources');
    if(!closeAttempted && stable(objectIdentity(fs.fstatSync(fd)))!==stable(lockIdentity))throw new Error('Preparation lock descriptor changed');
  };
  const resolveHeldRuntime=()=>{
    assertLock();
    if(stable(namespaceState(namespace))!==stable(prior) || !ordinary(pointer).equals(before))throw new Error('Current runtime changed before held verification');
    const runtime=resolveInstallation(source,namespace,prior);
    assertLock();if(!ordinary(pointer).equals(before))throw new Error('Current runtime changed during held verification');
    return runtime;
  };
  const removeOwned=(directory,owner)=>{
    assertLock();assertDirectoryIdentity(owner);fs.rmSync(directory,{recursive:true,force:false});
  };
  const recover=()=>{
    if(!published)return;
    attempt('Pointer recovery',()=>{
      assertLock();
      if(stable(objectIdentity(fs.lstatSync(pointer)))!==stable(pointerIdentity) || !ordinary(pointer).equals(next))throw new Error('Current pointer changed after publication; preserve candidate');
      if(before) {
        // Recovery cannot depend on work, which may be gone or replaced.
        const restore=path.join(namespace,`.restore-${randomUUID()}.json`);writeNew(restore,before);
        const restoreIdentity=objectIdentity(fs.lstatSync(restore));
        assertLock();
        if(stable(objectIdentity(fs.lstatSync(pointer)))!==stable(pointerIdentity) || !ordinary(pointer).equals(next))throw new Error('Current pointer changed before recovery; preserve recovery file');
        if(stable(objectIdentity(fs.lstatSync(restore)))!==stable(restoreIdentity) || !ordinary(restore).equals(before))throw new Error('Recovery file changed; preserve it');
        fs.renameSync(restore,pointer);
      } else fs.unlinkSync(pointer);
      published=false;syncDir(namespace);
      if(before?!ordinary(pointer).equals(before):exists(pointer))throw new Error('Recovered pointer readback failed');
    });
  };
  attempt('Preparation',()=>{
    lockIdentity=objectIdentity(fs.fstatSync(fd));assertLock();
    result=(()=>{
    if(prior && !upgrade) {
      const runtime=resolveHeldRuntime();const compatibility=verifyCompatibility(source,prepared,runtime.entry);
      if(!ordinary(pointer).equals(before))throw new Error('Current runtime changed during verification');
      return {status:'reused',entry:runtime.entry,package:runtime.package,installationId:runtime.receipt.installationId,compatibility,receiptDigest:runtime.receiptDigest};
    }
    if(prior)resolveHeldRuntime();
    if(offline)throw new Error('Offline: explicit upgrade or first preparation requires registry access');
    const id=randomUUID();work=fs.mkdtempSync(path.join(namespace,'.prepare-'));workOwner=directoryIdentity(work);const home=path.join(work,'home');fs.mkdirSync(home,{mode:0o700});
    const userconfig=path.join(work,'user.npmrc'),globalconfig=path.join(work,'global.npmrc');writeNew(userconfig,'');writeNew(globalconfig,'');
    const env={...isolatedEnvironment(home),NPM_CONFIG_USERCONFIG:userconfig,NPM_CONFIG_GLOBALCONFIG:globalconfig,NPM_CONFIG_CACHE:path.join(work,'cache'),NPM_CONFIG_PREFIX:path.join(work,'prefix'),NPM_CONFIG_UPDATE_NOTIFIER:'false',NPM_CONFIG_IGNORE_SCRIPTS:'true',NPM_CONFIG_AUDIT:'false',NPM_CONFIG_FUND:'false',NPM_CONFIG_BIN_LINKS:'false'};
    const invoke=(operation,args,cwd=work)=>{
      assertLock();assertDirectoryIdentity(workOwner);if(candidateOwner)assertDirectoryIdentity(candidateOwner);
      const output=runNpm({operation,args:[...args,'--registry','https://registry.npmjs.org','--ignore-scripts','--no-audit','--no-fund','--no-bin-links'],cwd,env,timeout:300000});
      assertLock();assertDirectoryIdentity(workOwner);if(candidateOwner)assertDirectoryIdentity(candidateOwner);return output;
    };
    const metadata=JSON.parse(invoke('resolve',['view','teamai-cli@latest','--json']));const identity={name:metadata.name,version:metadata.version,tarball:metadata.dist?.tarball,integrity:metadata.dist?.integrity};verifyPackageMetadata(identity);
    const packed=JSON.parse(invoke('pack',['pack',identity.tarball,'--json','--pack-destination',work]));if(!Array.isArray(packed) || packed.length!==1 || typeof packed[0].filename!=='string' || path.basename(packed[0].filename)!==packed[0].filename)throw new Error('Invalid npm pack result');
    const archive=ordinary(safePath(work,packed[0].filename),128*1024*1024);archiveFiles(archive,identity);
    const installations=safePath(namespace,'installations');if(!exists(installations))fs.mkdirSync(installations,{mode:0o700});privateDirectory(installations);candidate=safePath(installations,id);fs.mkdirSync(candidate,{mode:0o700});candidateOwner=directoryIdentity(candidate);
    writeNew(path.join(candidate,'archive.tgz'),archive);const install=path.join(candidate,'install');fs.mkdirSync(install,{mode:0o700});writeNew(path.join(install,'package.json'),JSON.stringify({name:'cfi-private-teamai-runtime',private:true,version:'1.0.0'})+'\n');
    invoke('install',['install',path.join(candidate,'archive.tgz'),'--save-exact'],install);
    const verified=validatePackage(candidate,identity,prepared),compatibility=verifyCompatibility(source,prepared,verified.entry);
    if(resourceIdentity(source)!==prepared.sourceDigest)throw new Error('Source changed during runtime preparation');
    const manifest=files(install),receipt={schemaVersion:1,installationId:id,package:identity,entry:ENTRY,files:manifest,installManifestDigest:hash(stable(manifest)),packageLockDigest:hash(ordinary(path.join(install,'package-lock.json'),16*1024*1024)),builtinSkillsDigest:verified.builtinSkillsDigest,compatibility};
    writeNew(path.join(candidate,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');syncDir(candidate);const runtime=verifyTeamaiInstallation({source,installation:candidate});
    if(prior?!ordinary(pointer).equals(before):exists(pointer))throw new Error('Current runtime changed before switch');
    next=Buffer.from(JSON.stringify({installationId:id,receiptSha256:runtime.receiptDigest},null,2)+'\n');const temporary=path.join(work,'current.json');writeNew(temporary,next);
    // The result stays tentative until every fallible cleanup and unlock step completes.
    assertLock();assertDirectoryIdentity(workOwner);assertDirectoryIdentity(candidateOwner);
    pointerIdentity=objectIdentity(fs.lstatSync(temporary));
    fs.renameSync(temporary,pointer);published=true;syncDir(namespace);
    if(!ordinary(pointer).equals(next))throw new Error('Runtime pointer readback failed');
    return {status:prior?'upgraded':'installed',entry:runtime.entry,package:runtime.package,installationId:id,compatibility,receiptDigest:runtime.receiptDigest};
    })();
  });
  if(errors.length)recover();
  if(workOwner)attempt('Work cleanup',()=>removeOwned(work,workOwner));
  if(errors.length)recover();
  let candidateRemoved=false;
  const cleanupFailedCandidate=()=>{
    if(errors.length && !published && candidateOwner && !candidateRemoved)candidateRemoved=attempt('Candidate cleanup',()=>removeOwned(candidate,candidateOwner));
  };
  cleanupFailedCandidate();
  // A prior cleanup error must never skip close. Do not retry close after an
  // OS error: the descriptor may already have been released and reused.
  attempt('Lock descriptor close',()=>{closeAttempted=true;fs.closeSync(fd);});
  if(errors.length){recover();cleanupFailedCandidate();}
  // No fallible success work follows unlock. A failed unlink still has a
  // recovery path while the original lock identity can be proven.
  const unlocked=attempt('Lock release',()=>{assertLock();fs.unlinkSync(lock);});
  if(!unlocked){recover();cleanupFailedCandidate();}
  if(errors.length) {
    let state='unobservable';
    try {assertDirectoryIdentity(namespaceOwner);state=exists(pointer)?ordinary(pointer).equals(before??Buffer.alloc(0))?'previous':next && ordinary(pointer).equals(next)?'new':'changed':'absent';}catch(error){errors.push(new Error(`Pointer observation: ${error.message}`,{cause:error}));}
    throw new Error(`${errors.map(error=>error.message).join('; ')}; current state: ${state}; preserved residual resources require review`,{cause:new AggregateError(errors,'Runtime preparation or finalization failed')});
  }
  return result;
}
