// Explicit release check: creates four disposable hosted sample gateways.
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { useCases } from '../lib/use-cases';
import { argsFromSchema } from '../lib/sandbox';
const base = process.env.ACCORD_LIVE_URL || 'https://mcp.edenbuilds.me';
const report = [];
for (const uc of useCases) {
  const res = await fetch(`${base}/api/gateways`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({input:uc.input}) });
  assert.equal(res.status,201,await res.clone().text());
  const gateway = await res.json();
  const client = new Client({name:'accord-hosted-release-check',version:'1.0.0'});
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(gateway.url)));
    const {tools} = await client.listTools();
    if(uc.slug==='devops') assert.deepEqual(tools.map(t=>t.name),['list_incidents','restart_staging_server']);
    const checks=[];
    for (const tool of tools) {
      const result=await client.callTool({name:tool.name,arguments:argsFromSchema(tool.inputSchema,tool.name)});
      const held=uc.policy.requireApproval?.some(p=>new RegExp('^'+p.replaceAll('*','.*')+'$').test(tool.name));
      assert.equal(!!result.isError,!!held,tool.name);
      checks.push({tool:tool.name,held:!!held});
    }
    if (uc.slug==='data-bi') {
      const tool=tools[0];
      for(let i=1;i<6;i++) {
        const result=await client.callTool({name:tool.name,arguments:argsFromSchema(tool.inputSchema,tool.name)});
        assert.equal(!!result.isError,i===5);
      }
    }
    const activity=await (await fetch(`${base}/api/gateways/${gateway.id}`)).json();
    assert.ok(activity.receipts.length>=tools.length);
    if(uc.slug==='customer-success') assert.ok(activity.receipts.some((r:{redacted:number})=>r.redacted>0));
    if(uc.slug==='data-bi') {
      assert.ok(activity.receipts.some((r:{cached:boolean})=>r.cached));
      assert.ok(activity.receipts.some((r:{rule:string})=>r.rule==='loop.repeat'));
    }
    report.push({template:uc.slug,id:gateway.id,url:gateway.url,checks,receipts:activity.receipts.length});
  } finally { await client.close(); }
}
mkdirSync('qa',{recursive:true});
writeFileSync('qa/hosted-release.json',JSON.stringify(report,null,2));
writeFileSync('qa/claude-mcp.json',JSON.stringify({mcpServers:{accord:{type:'http',url:report[0].url}}}));
console.log(JSON.stringify(report,null,2));
