#!/usr/bin/env node
// Run THIS entry from a trusted checkout; never execute a PR-provided bootstrap.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
let directory;
try {
  const options={},args=process.argv.slice(2);
  for(let index=0;index<args.length;index+=2) {
    if(!['--repo','--base','--policy','--layout'].includes(args[index]) || !args[index+1]) throw new Error('Usage: ci-check --repo PATH --base FULL_SHA --policy RELATIVE_PATH [--layout team|codex|zcode|claude]');
    options[args[index]]=args[index+1];
  }
  if(!options['--repo'] || !/^[a-f0-9]{40}$/.test(options['--base']??'')) throw new Error('An explicit repository and full trusted commit SHA are required');
  const policy=options['--policy'];
  if(!policy || path.isAbsolute(policy) || /[\\\0\r\n]/.test(policy) || policy.split('/').some(part=>!part || part==='.' || part==='..')) throw new Error('Policy must be a safe repository-relative path');
  const repo=fs.realpathSync(options['--repo']),base=options['--base'];
  const layout=options['--layout'] ?? 'team';
  if(!['team','codex','zcode','claude'].includes(layout))throw new Error('Unknown CI layout');
  const git=args=>execFileSync('git',['-C',repo,...args],{env:{...process.env,GIT_OPTIONAL_LOCKS:'0'},maxBuffer:64*1024*1024});
  git(['cat-file','-e',`${base}^{commit}`]);
  directory=fs.mkdtempSync(path.join(os.tmpdir(),'collaborative-foundation-infra-ci-'));
  const artifact=layout==='team'?'skills/common/collaborative-foundation-infra/scripts/governance.mjs':`${layout==='claude'?'.claude':'.agents'}/skills/collaborative-foundation-infra/scripts/governance.mjs`;
  const extract=(name,destination)=> {
    const tree=git(['ls-tree',base,'--',name]).toString();
    if(!/^100(?:644|755) blob /.test(tree)) throw new Error(`Trusted input must be a regular tracked file: ${name}`);
    fs.writeFileSync(path.join(directory,destination),git(['show',`${base}:${name}`]));
  };
  extract(artifact,'governance.mjs'); extract(policy,'policy.json');
  if(layout==='team') {
    extract('sources.lock.json','sources.lock.json'); extract('package-lock.json','package-lock.json');
    const sourceLock=JSON.parse(fs.readFileSync(path.join(directory,'sources.lock.json'),'utf8'));
    if(sourceLock.teamai?.package!=='teamai-cli' || sourceLock.teamai.selection!=='latest-on-first-prepare-or-explicit-upgrade')throw new Error('Trusted source lock has unexpected runtime selection policy');
    if(sourceLock.schemaVersion!==4 || !Array.isArray(sourceLock.upstreams) || sourceLock.upstreams.length!==3 || new Set(sourceLock.upstreams.map(item=>item.id)).size!==3)throw new Error('Trusted source lock lacks pinned submodule identities');
    extract('.gitmodules','gitmodules');
    for(const upstream of sourceLock.upstreams) {
      if(!['ric-devflow','ric-design-patterns','teamai-cli'].includes(upstream.id) || upstream.path!==`skills/upstreams/${upstream.id}` || !/^[a-f0-9]{40}$/.test(upstream.commit))throw new Error('Invalid trusted upstream mapping');
      if(git(['ls-tree',base,'--',upstream.path]).toString().trim()!==`160000 commit ${upstream.commit}\t${upstream.path}`)throw new Error('Trusted gitlink does not match its source lock');
      for(const key of ['path','url'])if(execFileSync('git',['config','--file',path.join(directory,'gitmodules'),'--get',`submodule.${upstream.id}.${key}`],{encoding:'utf8'}).trim()!==upstream[key])throw new Error('Trusted submodule configuration mismatch');
    }
  } else {
    extract('.collaborative-foundation-infra/teamai-installation.json','receipt.json');
    const receipt=JSON.parse(fs.readFileSync(path.join(directory,'receipt.json'),'utf8'));
    const artifactHash=createHash('sha256').update(fs.readFileSync(path.join(directory,'governance.mjs'))).digest('hex');
    const expectedSkills=['collaborative-foundation-infra','teamai-cli','ric-devflow','ric-devflow-planner','ric-devflow-reviewer','ric-devflow-tester','ric-devflow-implementer','ric-design-patterns-skill','team-wiki-codebase','teamai-share-learnings','teamai'].sort();
    if(!Array.isArray(receipt.skills) || JSON.stringify([...receipt.skills].sort())!==JSON.stringify(expectedSkills) || !Array.isArray(receipt.upstreams) || JSON.stringify(receipt.upstreams.map(item=>item.id).sort())!==JSON.stringify(['ric-design-patterns','ric-devflow','teamai-cli']) || receipt.upstreams.some(item=>item.path!==`skills/upstreams/${item.id}` || !/^[a-f0-9]{40}$/.test(item.commit)))throw new Error('Trusted receipt lacks the complete eleven-Skill, three-source identity');
    if(receipt.schemaVersion!==4 || receipt.sourceLayoutVersion!==4 || !/^[a-f0-9]{64}$/.test(receipt.sourcePackagesDigest??'') || !/^[a-f0-9]{64}$/.test(receipt.distributionDigest??'') || receipt.teamaiPackage?.name!=='teamai-cli' || receipt.teamaiPackage.version!==receipt.teamai || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(receipt.teamai??'') || !/^sha512-[A-Za-z0-9+/]{86}==$/.test(receipt.teamaiPackage.integrity??'') || !/^https:\/\/registry\.npmjs\.org\/teamai-cli\/-\/[^/?#]+\.tgz$/.test(receipt.teamaiPackage.tarball??'') || !/^[a-f0-9]{64}$/.test(receipt.teamaiPackage.manifestDigest??'') || !/^[a-f0-9]{64}$/.test(receipt.teamaiPackage.receiptDigest??'') || receipt.artifact?.pathWithinSkill!=='scripts/governance.mjs' || receipt.artifact?.sha256!==artifactHash || !/^[a-f0-9]{64}$/.test(receipt.sourceLockDigest??'') || !/^[a-f0-9]{64}$/.test(receipt.dependencyLockDigest??''))throw new Error('Trusted installation receipt does not bind this governance artifact');
  }
  const names=[...git(['diff','--name-only','-z',base,'--']).toString().split('\0'),...git(['ls-files','--others','--exclude-standard','-z']).toString().split('\0')].filter(Boolean);
  const governed=name=>name===policy || /^(?:tools|scripts|skills|upstreams|manifest|rules|hooks|\.github|\.agents|\.claude|\.collaborative-foundation-infra)(?:\/|$)/.test(name) || /^(?:AGENTS\.md|CLAUDE\.md|\.gitmodules|sources\.lock\.json|package(?:-lock)?\.json|teamai\.yaml)$/.test(name);
  const governanceChanges=[...new Set(names.filter(governed))].sort();
  const run=spawnSync(process.execPath,[path.join(directory,'governance.mjs'),'check','--repo',repo,'--policy',path.join(directory,'policy.json'),'--format','json'],{encoding:'utf8',timeout:120000,maxBuffer:20*1024*1024});
  if(run.error) throw run.error;
  if(run.status===null) throw new Error('Trusted checker terminated');
  let report;
  try {report=JSON.parse(run.stdout);} catch {throw new Error(`Trusted checker did not return JSON: ${run.stderr}`);}
  console.log(JSON.stringify({status:run.status!==0 || governanceChanges.length?'fail':report.status,trustedBase:base,layout,governanceChanges,requiresGovernanceReview:!!governanceChanges.length,check:report},null,2));
  process.exitCode=run.status===2?2:run.status!==0 || governanceChanges.length?1:0;
} catch(error) {console.log(JSON.stringify({status:'error',error:error.message}));process.exitCode=2;}
finally {if(directory)fs.rmSync(directory,{recursive:true,force:true});}
