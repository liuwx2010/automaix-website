import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import nodemailer from 'nodemailer';

const root=dirname(fileURLToPath(import.meta.url));
const recipient='info@automaix.co.jp';
export function mailerFromEnvironment(env=process.env){
  if(!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM)return null;
  const port=Number(env.SMTP_PORT||587);
  const transport=nodemailer.createTransport({host:env.SMTP_HOST,port,secure:port===465,requireTLS:port!==465,
    auth:{user:env.SMTP_USER,pass:env.SMTP_PASS},connectionTimeout:15000,greetingTimeout:15000,socketTimeout:20000,
    disableFileAccess:true,disableUrlAccess:true});
  return async data=>{
    const result=await transport.sendMail({from:env.SMTP_FROM,to:recipient,replyTo:data.email,
      subject:'[AUTOMAIX] 資料ダウンロード登録 / Document download request',
      text:`公司 / Company: ${data.company}\n姓名 / Name: ${data.name}\n邮箱 / Email: ${data.email}\n电话 / Phone: ${data.phone||'-'}\n资料 / Document: ${data.documentType==='product-guide'?'3D sorting product guide':'Company introduction'}\n资料语言 / Language: ${data.locale}\n登记时间 / UTC: ${new Date().toISOString()}\n用途: 公司资料提供与相关业务联系。已同意个人信息处理说明。`});
    if(!result.accepted?.some(address=>String(address).toLowerCase()===recipient))throw Error('Mail not accepted');
  };
}
export function createWebsiteServer({sendRegistration=mailerFromEnvironment(),origin=process.env.PUBLIC_ORIGIN,secureCookie=process.env.COOKIE_SECURE==='true',now=Date.now,documentRoot=resolve(root,'private/brochures')}={}){
  const grants=new Map(), attempts=new Map();
  const lifetime=10*60*1000;
  const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
  return http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','same-origin');
    try{
      const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      if(path.startsWith('/api/')){
        res.setHeader('Cache-Control','no-store, private');
        for(const [key,value] of grants)if(value.expires<=now())grants.delete(key);
        for(const [key,value] of attempts)if(value.expires<=now())attempts.delete(key);
        if(path==='/api/download-status'&&req.method==='GET'){
          const locale=new URL(req.url,'http://localhost').searchParams.get('locale');
          if(!['ja','en','zh'].includes(locale))return json(res,400,{error:'validation'});
          const available=[];
          if(sendRegistration)for(const [type,name] of [['company','company-brochure-2026'],['product-guide','product-catalog-3d']]){
            try{await stat(resolve(documentRoot,`${name}${locale==='ja'?'':'-'+locale}.pdf`));available.push(type);}catch{}
          }
          return json(res,200,{available});
        }
        if(path==='/api/company-download'&&req.method==='POST'){
          const expectedOrigin=origin||`http://${req.headers.host}`;
          if(req.headers.origin!==expectedOrigin)return json(res,403,{error:'origin'});
          if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return json(res,415,{error:'type'});
          let ip=req.socket.remoteAddress;
          if(process.env.TRUST_LOOPBACK_PROXY==='true'&&['127.0.0.1','::1','::ffff:127.0.0.1'].includes(ip)){
            ip=String(req.headers['x-forwarded-for']||ip).split(',').at(-1).trim();
          }
          const attempt=attempts.get(ip)||{count:0,expires:now()+15*60*1000};
          if(attempt.count>=10 || attempts.size>10000){res.setHeader('Retry-After','900');return json(res,429,{error:'rate'});}
          attempt.count++;attempts.set(ip,attempt);
          const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>8192)return json(res,413,{error:'size'});chunks.push(chunk);}
          const raw=Buffer.concat(chunks).toString('utf8');
          let data;try{data=JSON.parse(raw);}catch{return json(res,400,{error:'validation'});}
          const clean=(key,max)=>typeof data?.[key]==='string'&&data[key].trim().length<=max&&!/[\x00-\x1f\x7f]/.test(data[key])?data[key].trim():'';
          const entry={company:clean('company',150),name:clean('name',100),email:clean('email',254),phone:clean('phone',50),locale:data?.locale,documentType:data?.documentType??'company'};
          if(!entry.company||!entry.name||!entry.email||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(entry.email)||!['ja','en','zh'].includes(entry.locale)||!['company','product-guide'].includes(entry.documentType)||data.consent!==true||data.website)return json(res,400,{error:'validation'});
          if(!sendRegistration)return json(res,503,{error:'unavailable'});
          const fileName=`${entry.documentType==='product-guide'?'product-catalog-3d':'company-brochure-2026'}${entry.locale==='ja'?'':'-'+entry.locale}.pdf`;
          try{await stat(resolve(documentRoot,fileName));}catch{return json(res,503,{error:'unavailable'});}
          // Issue a grant only after the company's mail server accepts the registration.
          try{await sendRegistration(entry);}catch{return json(res,502,{error:'delivery'});}
          if(grants.size>=10000)return json(res,503,{error:'unavailable'});
          const token=randomBytes(32).toString('hex');
          grants.set(token,{locale:entry.locale,documentType:entry.documentType,expires:now()+lifetime});
          res.setHeader('Set-Cookie',`automaix_brochure=${token}; HttpOnly; SameSite=Strict; Path=/api/; Max-Age=600${secureCookie?'; Secure':''}`);
          return json(res,200,{download:entry.documentType==='product-guide'?'/api/product-guide-file':'/api/company-file'});
        }
        if(['/api/company-file','/api/product-guide-file'].includes(path)&&req.method==='GET'){
          const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('automaix_brochure='))?.split('=')[1];
          const grant=grants.get(token);
          const documentType=path==='/api/product-guide-file'?'product-guide':'company';
          if(!grant||grant.documentType!==documentType)return json(res,403,{error:'registration_required'});
          const filename=`${documentType==='product-guide'?'product-catalog-3d':'company-brochure-2026'}${grant.locale==='ja'?'':'-'+grant.locale}.pdf`;
          const file=await readFile(resolve(documentRoot,filename));
          res.writeHead(200,{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${filename}"`});return res.end(file);
        }
        return json(res,404,{error:'not_found'});
      }
      if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
      const pathname=path.endsWith('/')?path+'index.html':path;
      // An explicit public route list also protects SMTP settings, source files and brochure originals.
      const publicPage=/^\/(?:en\/|zh\/)?[a-z0-9-]+\.html$/.test(pathname);
      const publicAsset=/^\/(?:images|videos)\/[a-zA-Z0-9_.-]+$/.test(pathname);
      if(!publicPage&&!publicAsset&&!['/app.js','/styles.css','/robots.txt','/sitemap.xml'].includes(pathname)){res.writeHead(404);return res.end('Not found');}
      const file=resolve(root,'.'+pathname);
      const meta=await stat(file);
      const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.pdf':'application/pdf','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.xml':'application/xml','.txt':'text/plain'};
      res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');
      res.setHeader('Cache-Control',publicPage?'no-cache':'public, max-age=3600');
      // Keep seeking available for product videos.
      const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
      const buffer=req.method==='HEAD'?null:await readFile(file);
      if(range){const start=Number(range[1]),end=range[2]?Math.min(Number(range[2]),meta.size-1):meta.size-1;
        if(start>end||start>=meta.size){res.writeHead(416,{'Content-Range':`bytes */${meta.size}`});return res.end();}
        res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${meta.size}`,'Content-Length':end-start+1,'Accept-Ranges':'bytes'});return res.end(buffer?.subarray(start,end+1));}
      res.writeHead(200,{'Content-Length':meta.size,'Accept-Ranges':'bytes'});res.end(buffer);
    }catch{if(!res.headersSent)res.writeHead(404);res.end();}
  });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||8767);
  createWebsiteServer().listen(port,host,()=>console.log(`Website: http://${host}:${port} (SMTP ${process.env.SMTP_HOST?'configured':'not configured; downloads remain locked'})`));
}
