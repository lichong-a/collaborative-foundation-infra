#!/usr/bin/env node
import {prepareTeamai} from '../tools/teamai-runtime.mjs';
try {
  const args=process.argv.slice(2),action=args.shift(),options={upgrade:action==='upgrade'};
  if(!['prepare','upgrade'].includes(action))throw new Error('Usage: teamai-runtime prepare|upgrade [--source PATH] [--data-home ABS] [--offline]');
  for(let index=0;index<args.length;index++) {
    const arg=args[index];
    if(arg==='--offline'){if(options.offline)throw new Error('Duplicate --offline');options.offline=true;}
    else if(['--source','--data-home'].includes(arg) && args[index+1]){const key=arg==='--source'?'source':'dataHome';if(options[key])throw new Error(`Duplicate ${arg}`);options[key]=args[++index];}
    else throw new Error(`Unknown runtime argument: ${arg}`);
  }
  console.log(JSON.stringify(prepareTeamai(options),null,2));
} catch(error) {console.log(JSON.stringify({status:'error',error:error.message}));process.exitCode=2;}
