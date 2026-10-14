import { test, expect } from 'vitest';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { retrieveKnowledge, KNOWLEDGE_VERSION, type KnowledgeClaim } from '../packages/knowledge/src/index';

test('retrieval regression corpus covers context separation and unread-source abstention',()=>{
  const cases=readFileSync('research/retrieval-eval.jsonl','utf8').trim().split(/\r?\n/).map(line=>JSON.parse(line) as {id:string;question:string;scope:KnowledgeClaim['scope'];must_include:string[];must_exclude:string[];expect_empty?:boolean});
  const results=cases.map(c=>{const ids=retrieveKnowledge(c.question,c.scope).map(item=>item.id);return {id:c.id,returned:ids,passed:c.must_include.every(id=>ids.includes(id))&&c.must_exclude.every(id=>!ids.includes(id))&&(!c.expect_empty||ids.length===0)};});
  mkdirSync('output/qa',{recursive:true});writeFileSync('output/qa/retrieval-eval.json',JSON.stringify({version:KNOWLEDGE_VERSION,mode:'LOCAL_RETRIEVAL_REGRESSION_NOT_MODEL_ACCURACY',cases:results},null,2));
  expect(results.filter(r=>!r.passed)).toEqual([]);
});
