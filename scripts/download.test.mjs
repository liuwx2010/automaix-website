import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWebsiteServer} from '../server.mjs';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const valid={company:'Example Test Ltd',name:'Test Person',email:'test@example.com',phone:'',locale:'zh',consent:true,website:''};
async function fixture(t,options={}){
 const documentRoot=await mkdtemp(join(tmpdir(),'automaix-download-test-'));
 t.after(()=>rm(documentRoot,{recursive:true,force:true}));
 for(const name of ['company-brochure-2026','product-catalog-3d'])for(const locale of ['ja','en','zh'])await writeFile(join(documentRoot,name+(locale==='ja'?'':'-'+locale)+'.pdf'),'%PDF fixture '+name+' '+locale);
 const server=createWebsiteServer({...options,documentRoot});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(()=>new Promise(r=>server.close(r)));const base=`http://127.0.0.1:${server.address().port}`;
 return {get:(p,opts)=>fetch(base+p,opts),post:(data,headers={})=>fetch(base+'/api/company-download',{method:'POST',headers:{Origin:base,'Content-Type':'application/json',...headers},body:JSON.stringify(data)})};
}
test('registration gates all three files and expires after ten minutes',async t=>{
 let timestamp=1000;const sent=[];const f=await fixture(t,{sendRegistration:async d=>sent.push(d),now:()=>timestamp});
 assert.equal((await f.get('/api/company-file')).status,403);
 for(const locale of ['ja','en','zh']){
  const response=await f.post({...valid,locale});assert.equal(response.status,200);
  const cookie=response.headers.get('set-cookie').split(';')[0];
  assert.match(response.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
  const download=await f.get('/api/company-file',{headers:{Cookie:cookie}});assert.equal(download.status,200);
  assert.match(download.headers.get('content-disposition'),new RegExp(`2026${locale==='ja'?'':'-'+locale}\\.pdf`));
  assert.equal((await download.text()).slice(0,4),'%PDF');
  timestamp+=600001;assert.equal((await f.get('/api/company-file',{headers:{Cookie:cookie}})).status,403);
 }
 assert.equal(sent.length,3);
 for(const path of ['/downloads/company-brochure-2026.pdf','/downloads/company-brochure-2026-en.pdf','/downloads/company-brochure-2026-zh.pdf','/private/brochures/company-brochure-2026.pdf','/content/pages.json','/.env','/server.mjs','/templates/index.html'])assert.equal((await f.get(path)).status,404,path);
 for(const locale of ['','-en','-zh'])assert.equal((await f.get('/downloads/product-catalog-3d'+locale+'.pdf')).status,404);
});
test('invalid, cross-site and oversized input cannot unlock a download',async t=>{
 let sent=0;const f=await fixture(t,{sendRegistration:async()=>sent++});
 for(const patch of [{company:' '},{name:''},{email:'broken'},{consent:false},{locale:'xx'},{documentType:'unknown'},{website:'spam'},{email:'a\r\nb@example.com'}])assert.equal((await f.post({...valid,...patch})).status,400);
 assert.equal((await f.post(valid,{Origin:'https://foreign.example'})).status,403);
 assert.equal((await f.post({...valid,company:'x'.repeat(9000)})).status,413);
 assert.equal(sent,0);assert.equal((await f.get('/api/company-file')).status,403);
});
test('unconfigured SMTP and rejected email both keep downloads locked',async t=>{
 for(const sendRegistration of [null,async()=>{throw Error('SMTP failure');}]){
  const f=await fixture(t,{sendRegistration});const response=await f.post(valid);
  assert.ok([502,503].includes(response.status));assert.equal(response.headers.get('set-cookie'),null);
  assert.equal((await f.get('/api/company-file')).status,403);
 }
});
test('submission abuse is limited',async t=>{
 const f=await fixture(t,{sendRegistration:async()=>{}});
 for(let i=0;i<10;i++)assert.equal((await f.post(valid)).status,200);
 assert.equal((await f.post(valid)).status,429);
});

test('product guide registration limits the grant to the selected document and language',async t=>{
 const sent=[];let timestamp=1000;
 const f=await fixture(t,{sendRegistration:async d=>sent.push(d),now:()=>timestamp});
 assert.equal((await f.get('/api/product-guide-file')).status,403);
 for(const locale of ['ja','en','zh']){
  assert.deepEqual((await (await f.get('/api/download-status?locale='+locale)).json()).available,['company','product-guide']);
  const registration=await f.post({...valid,locale,documentType:'product-guide'});
  assert.equal(registration.status,200);
  assert.equal((await registration.json()).download,'/api/product-guide-file');
  const headers={Cookie:registration.headers.get('set-cookie').split(';')[0]};
  const guide=await f.get('/api/product-guide-file',{headers});
  assert.equal(guide.status,200);
  assert.match(guide.headers.get('content-disposition'),/product-catalog-3d/);
  assert.equal(await guide.text(),'%PDF fixture product-catalog-3d '+locale);
  assert.equal((await f.get('/api/company-file',{headers})).status,403);
  timestamp+=600001;assert.equal((await f.get('/api/product-guide-file',{headers})).status,403);
 }
 const company=await f.post({...valid,documentType:'company'});
 assert.equal((await f.get('/api/product-guide-file',{headers:{Cookie:company.headers.get('set-cookie').split(';')[0]}})).status,403);
 assert.deepEqual(sent.slice(0,3).map(e=>e.documentType),['product-guide','product-guide','product-guide']);
 for(const suffix of ['','-en','-zh'])assert.equal((await f.get('/private/brochures/product-catalog-3d'+suffix+'.pdf')).status,404);
});
test('download service reports unavailable without SMTP',async t=>{
 const f=await fixture(t,{sendRegistration:null});
 assert.deepEqual(await (await f.get('/api/download-status?locale=ja')).json(),{available:[]});
 assert.equal((await f.get('/api/download-status?locale=xx')).status,400);
});
