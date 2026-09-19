import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import {safePath,exists} from './repository.mjs';
export const EVENTS=['Hook dispatch session-start','Hook dispatch stop','Hook dispatch post-tool-use wildcard','Hook dispatch post-tool-use Skill','Hook dispatch post-tool-use TodoWrite','Hook dispatch prompt-submit'];
export function verifyTeamConfiguration(source) {
  const team=YAML.parse(fs.readFileSync(safePath(source,'teamai.yaml'),'utf8'));
  const hooks=YAML.parse(fs.readFileSync(safePath(source,'hooks/hooks.yaml'),'utf8'));
  if(team.autoUpdate!==false || team.usageReport!==false || team.submodules!==false || team.sources?.length || team.sharing?.recall?.enabled!==false || team.sharing?.contributeHint?.enabled!==false || team.sharing?.env?.injectShellProfile!==false || team.sharing?.hooks?.autoApply!==false || team.sharing?.mcp?.autoApply!==false || hooks.hooks?.length || EVENTS.some(name=>!hooks.builtin?.disabled?.includes(name))) throw new Error('Team configuration enables unsupported automatic or executable behavior');
  for(const folder of ['agents','env','mcp','scripts','team-scripts']) if(exists(path.join(source,folder)) && ['agents','env','mcp','team-scripts'].includes(folder)) throw new Error(`Unexpected TeamAI executable resource: ${folder}`);
  if(team.toolPaths.codex.skills!=='.agents/skills' || team.toolPaths.zcode.skills!=='.agents/skills' || team.toolPaths.claude.skills!=='.claude/skills') throw new Error('Skill destinations differ from the reviewed adapter');
  for(const settings of Object.values(team.toolPaths)) if(Object.keys(settings).some(key=>!['skills','rules'].includes(key))) throw new Error('TeamAI native configuration ownership is forbidden');
}
