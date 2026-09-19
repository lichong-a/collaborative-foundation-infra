#!/usr/bin/env node
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { repositoryRoot } from './repository.mjs';
import { loadPolicy } from './policy.mjs';
import { audit } from './audit.mjs';
import { createPlan, applyPlan } from './plan.mjs';
import { sessionAction } from './session.mjs';

export function main(argv = process.argv.slice(2)) {
  let format='text';
  try {
    if(argv[0]==='session')format='json';
    if (Number(process.versions.node.split('.')[0]) !== 24) throw new Error('Node 24 is required; use the runtime bootstrap, then Markdown fallback if installation fails');
    if(argv[0]==='session') {
      const [,action,...args]=argv,options={action},keys={'--repo':'repo','--agent':'agent','--session-id':'sessionId','--root-session-id':'rootSessionId','--mode':'mode'};
      for(let index=0;index<args.length;index+=2) {
        const key=keys[args[index]];
        if(!key || !args[index+1] || args[index+1].startsWith('--') || Object.hasOwn(options,key))throw new Error(`Invalid session argument: ${args[index]}`);
        options[key]=args[index+1];
      }
      const report=sessionAction(options);
      console.log(JSON.stringify(report,null,2));
      return report.status==='awaiting-selection'?3:0;
    }
    const [action,...args]=argv, options={};
    if (!['audit','check','plan','apply'].includes(action)) throw new Error('Usage: governance audit|check|plan|apply --repo PATH --policy FILE [--format json|text] [--plan FILE]');
    for(let index=0;index<args.length;index+=2) {
      const key=args[index];
      if (!['--repo','--policy','--format','--plan'].includes(key) || !args[index+1] || args[index+1].startsWith('--') || Object.hasOwn(options,key)) throw new Error(`Invalid argument: ${key}`);
      options[key]=args[index+1];
    }
    format=options['--format'] ?? (action==='plan'?'json':'text');
    if (!['json','text'].includes(format)) throw new Error('format must be json or text');
    const root=repositoryRoot(options['--repo']), policy=loadPolicy(options['--policy']);
    let report;
    if (action==='plan') report=createPlan(root,policy);
    else if (action==='apply') {
      if (!options['--plan']) throw new Error('--plan is required for apply');
      report=applyPlan(root,policy,JSON.parse(fs.readFileSync(options['--plan'],'utf8')));
    } else report=audit(root,policy);
    if (format==='json' || action==='plan') console.log(JSON.stringify(report,null,2));
    else {
      console.log(`${report.status}: ${JSON.stringify(report.summary ?? {changed:report.changed})}`);
      for(const finding of report.findings??[]) console.log(`${finding.debt?'DEBT':'NEW'} ${finding.code} ${finding.path}${finding.target ? ` -> ${finding.target}` : ''}: ${finding.message}`);
      if(report.transaction) console.log(`Recovery journal: ${report.transaction}`);
    }
    return action==='check' && report.status==='fail' ? 1 : 0;
  } catch(error) {
    const report={schemaVersion:1,status:'error',error:error.message};
    console.log(format==='json' ? JSON.stringify(report) : `error: ${error.message}`);
    return 2;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode=main();
