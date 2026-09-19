#!/usr/bin/env node
import { syncTeam } from '../tools/distribution.mjs';
try {
  const options={}, args=process.argv.slice(2);
  for(let index=0;index<args.length;index++) {
    const arg=args[index];
    if(arg==='--apply' || arg==='--install-entry') { const key=arg==='--apply'?'apply':'installEntry';if(options[key])throw new Error(`Duplicate argument: ${arg}`);options[key]=true; }
    else if(['--repo','--source','--agent','--user-home','--teamai-entry','--data-home'].includes(arg) && args[index+1]) options[{'--repo':'repo','--source':'source','--agent':'agent','--user-home':'userHome','--teamai-entry':'teamaiEntry','--data-home':'dataHome'}[arg]]=args[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if(!options.repo || !options.source || !options.agent) throw new Error('Usage: teamai-sync --repo PATH --source PATH --agent codex|zcode|claude [--apply] [--install-entry] [--data-home ABS] [--teamai-entry PREPARED_ENTRY]');
  console.log(JSON.stringify(syncTeam(options),null,2));
} catch(error) { console.log(JSON.stringify({status:'error',error:error.message})); process.exitCode=2; }
