import assert from 'node:assert/strict';
import {Client,StreamableHTTPClientTransport} from '@modelcontextprotocol/client';
import {isCallToolResult} from '@modelcontextprotocol/server';
import {defaultPolicy} from '../lib/policy';
const base=process.env.ACCORD_LIVE_URL||'https://mcp.edenbuilds.me';
const client=new Client({name:'accord-release-verification',version:'1.0.0'});
try{
 await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`)));
 const tools=await client.listTools();assert.deepEqual(tools.tools.map(t=>t.name),['accord_describe','accord_evaluate']);
 const describe=await client.callTool({name:'accord_describe',arguments:{}});assert.ok(isCallToolResult(describe)&&!describe.isError);
 const results=[];for(const [tool,count,expected] of [['github.list_issues',3,'allow'],['github.create_issue',3,'approval_required'],['database.drop',3,'deny'],['github.list_issues',30,'deny']] as const){const result=await client.callTool({name:'accord_evaluate',arguments:{policy:defaultPolicy,request:{tool,callsInWindow:count,payloadBytes:128}}});assert.ok(isCallToolResult(result));const content=result.content.find(c=>c.type==='text');assert.ok(content&&content.type==='text');const decision=JSON.parse(content.text);assert.equal(decision.effect,expected);results.push({tool,effect:decision.effect});}
 const checks=await Promise.all(['','/workbench','/docs','/roadmap','/robots.txt','/sitemap.xml'].map(async path=>{const response=await fetch(base+path);assert.equal(response.status,200);return {path:path||'/',status:response.status}}));
 const origin=await fetch(`${base}/mcp`,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://untrusted.example'},body:'{}'});assert.equal(origin.status,403);
 const large=await fetch(`${base}/mcp`,{method:'POST',headers:{'Content-Type':'application/json'},body:'x'.repeat(65537)});assert.equal(large.status,413);
 console.log(JSON.stringify({base,tools:tools.tools.map(t=>t.name),results,routes:checks,originRejection:origin.status,oversizedRejection:large.status},null,2));
}finally{await client.close()}
