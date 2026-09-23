import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { standardVersion, verifyUpstreams } from '../tools/sources.mjs';
verifyUpstreams(process.cwd());
const check=process.argv.includes('--check'), outfile='skills/common/collaborative-foundation-infra/scripts/governance.mjs';
const result=await build({entryPoints:['tools/cli.mjs'],outfile,write:!check,metafile:true,bundle:true,platform:'node',target:'node24',format:'esm',define:{CFI_STANDARD_VERSION:JSON.stringify(standardVersion(process.cwd()))},banner:{js:"import { createRequire as __collaborativeFoundationInfraCreateRequire } from 'node:module'; const require = __collaborativeFoundationInfraCreateRequire(import.meta.url);"},legalComments:'eof'});
if(!check)fs.chmodSync(outfile,0o755);
if((fs.statSync(outfile).mode&0o111)!==0o111)throw new Error('Generated governance artifact must be executable; run npm run build');
if(check && !Buffer.from(result.outputFiles[0].contents).equals(fs.readFileSync(outfile)))throw new Error('Generated governance artifact is stale; run npm run build');
const packages=new Set();
for(const input of Object.keys(result.metafile.inputs)) {
  const segments=input.split('/');
  const index=segments.lastIndexOf('node_modules');
  if(index<0)continue;
  const length=segments[index+1].startsWith('@')?2:1;
  packages.add(segments.slice(0,index+1+length).join('/'));
}
let notices='THIRD-PARTY NOTICES\nGenerated from the actual esbuild input graph. Do not edit by hand.\n';
for(const directory of [...packages].sort()) {
  const manifest=JSON.parse(fs.readFileSync(path.join(directory,'package.json'),'utf8'));
  const licenses=fs.readdirSync(directory).filter(name=>/^(?:licen[sc]e|copying|notice)(?:$|[.-])/i.test(name) && fs.statSync(path.join(directory,name)).isFile()).sort();
  if(!licenses.length)throw new Error(`Bundled package has no license/notice text: ${manifest.name}`);
  notices+=`\n${'='.repeat(72)}\n${manifest.name}@${manifest.version} (${manifest.license ?? 'see license text'})\n`;
  for(const name of licenses)notices+=`\n--- ${name} ---\n${fs.readFileSync(path.join(directory,name),'utf8').trimEnd()}\n`;
}
const noticePath='skills/common/collaborative-foundation-infra/THIRD_PARTY_NOTICES.txt';
if(check) { if(fs.readFileSync(noticePath,'utf8')!==notices)throw new Error('Bundled third-party notices are stale; run npm run build'); }
else fs.writeFileSync(noticePath,notices);
