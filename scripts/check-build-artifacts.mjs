import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

// Next's file tracing may include local data via filesystem fallback paths.
// Remove private development inputs from every trace, including on Windows
// where Next's glob excludes do not normalize path separators consistently.
const root=path.resolve(import.meta.dirname,'..');
const output=path.join(root,'apps/web',process.env.PLANTCARE_BUILD_DIR||'.next');
const privateRoots=['.data','.git','output','test-results','source'].map(p=>path.join(root,p));
function privateInput(file){return path.basename(file).startsWith('.env')||privateRoots.some(p=>file===p||file.startsWith(p+path.sep));}
let removed=0,checked=0;
async function visit(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()){await visit(file);continue;}
    if(!entry.name.endsWith('.nft.json'))continue;
    const trace=JSON.parse(await readFile(file,'utf8'));
    const safe=trace.files.filter(f=>!privateInput(path.resolve(dir,f.replaceAll('\\',path.sep))));
    removed+=trace.files.length-safe.length;checked++;
    await writeFile(file,JSON.stringify({...trace,files:safe}));
    assert(safe.every(f=>!privateInput(path.resolve(dir,f.replaceAll('\\',path.sep)))));
  }
}
await visit(output);
console.log(`Build artifacts: ${checked} traces checked; ${removed} local/private file references excluded.`);
