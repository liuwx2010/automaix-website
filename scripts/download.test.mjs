import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createWebsiteServer} from '../server.mjs';
const valid={company:'Example Test Ltd',name:'Test Person',email:'test@example.com',phone:'',locale:'zh',consent:true,website:''};
async function fixture(t,options={}){
 const server=createWebsiteServer(options);await new Promise(r=>server.listen(0,'127.0.0.1',r));
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
 assert.equal((await f.get('/downloads/product-catalog-3d-zh.pdf')).status,200);
});
test('invalid, cross-site and oversized input cannot unlock a download',async t=>{
 let sent=0;const f=await fixture(t,{sendRegistration:async()=>sent++});
 for(const patch of [{company:' '},{name:''},{email:'broken'},{consent:false},{locale:'xx'},{website:'spam'},{email:'a\r\nb@example.com'}])assert.equal((await f.post({...valid,...patch})).status,400);
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
