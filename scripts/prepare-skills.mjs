#!/usr/bin/env node
import { prepareSkills } from '../tools/sources.mjs';
try {console.log(JSON.stringify(prepareSkills(process.cwd()),null,2));}
catch(error) {console.log(JSON.stringify({status:'error',error:error.message}));process.exitCode=2;}
