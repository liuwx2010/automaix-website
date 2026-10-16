import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFile(resolve(root,p),'utf8');
const write=(p,s)=>writeFile(resolve(root,p),s,'utf8');
const dictionary=JSON.parse(await read('content/translations.json'));
const pages=JSON.parse(await read('content/pages.json'));
const products=JSON.parse(await read('content/products.json'));
const files=[...pages.map(p=>p.file),...products.map(p=>`product-${p.id}.html`)];
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const decode=value=>value.replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&apos;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
const translate=(text,locale)=>{
 const key=text.trim();if(!key)return text;
 if(dictionary[key])return text.replace(key,dictionary[key][locale]);
 if(!/[\u3040-\u30ff\u3400-\u9fff]/.test(key))return text;
 throw new Error(`Missing ${locale} translation: ${key}`);
};
const names={ja:'日本語',en:'English',zh:'简体中文'};
const code={ja:'ja',en:'en',zh:'zh-CN'};
const og={ja:'ja_JP',en:'en_US',zh:'zh_CN'};
const url=(file,locale)=>`https://www.automaix.co.jp/${locale==='ja'?'':locale+'/'}${file==='index.html'?'':file}`;
const switcher=(file,locale)=>{
 const label=locale==='en'?'Choose language':locale==='zh'?'选择语言':'言語を選択';
 return `<details class="language-picker"><summary aria-label="${label}">${names[locale]}</summary><nav class="language-options" aria-label="${label}">${Object.keys(names).map(lang=>`<a data-language-link href="${locale==='ja'?'':'../'}${lang==='ja'?'':lang+'/'}${file}" lang="${code[lang]}" hreflang="${code[lang]}"${lang===locale?' aria-current="page"':''}>${names[lang]}</a>`).join('')}</nav></details>`;
};
const jsonTranslate=(value,locale)=>{
 if(Array.isArray(value))return value.map(v=>jsonTranslate(v,locale));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,jsonTranslate(v,locale)]));
 if(typeof value==='string'&&dictionary[value])return dictionary[value][locale];
 return value;
};
const alternates=file=>['ja','en','zh'].map(locale=>`<link rel="alternate" hreflang="${code[locale]}" href="${url(file,locale)}">`).join('')+`<link rel="alternate" hreflang="x-default" href="${url(file,'ja')}">`;
const localizeHTML=(original,locale)=>{
 const blocks=original.split(/(<script\b[^>]*>[\s\S]*?<\/script>|<style\b[^>]*>[\s\S]*?<\/style>)/gi);
 return blocks.map(block=>{
  if(/^<script\b/i.test(block)){
   if(!/application\/ld\+json/i.test(block))return block;
   const match=block.match(/^(<script[^>]*>)([\s\S]*?)(<\/script>)$/i);
   return match[1]+JSON.stringify(jsonTranslate(JSON.parse(match[2]),locale)).replaceAll('<','\\u003c')+match[3];
  }
  if(/^<style\b/i.test(block))return block;
  return block.split(/(<[^>]*>)/g).map(part=>{
   if(part.startsWith('<'))return part.replace(/\b(alt|aria-label|placeholder|title|value|content)="([^"]*)"/g,(all,name,value)=>{
    const decoded=decode(value);
    if(!/[\u3040-\u30ff\u3400-\u9fff]/.test(decoded))return all;
    return `${name}="${escape(translate(decoded,locale))}"`;
   });
   return escape(translate(decode(part),locale));
  }).join('');
 }).join('');
};
for(const file of files){
 const original=(await read(file)).replace(/<details class="language-picker">[\s\S]*?<\/details>/g,'').replace(/<link rel="alternate"[^>]*>/g,'').replace(/<meta property="og:locale"[^>]*>/g,'');
 for(const locale of ['ja','en','zh']){
  if(locale!=='ja')await mkdir(resolve(root,locale),{recursive:true});
  let html=locale==='ja'?original:localizeHTML(original,locale);
  html=html.replace('<html lang="ja">',`<html lang="${code[locale]}">`);
  html=html.replace(/<link rel="canonical" href="[^"]+">/,`<link rel="canonical" href="${url(file,locale)}">${alternates(file)}<meta property="og:locale" content="${og[locale]}">`);
  html=html.replace(/<meta property="og:url" content="[^"]+">/,`<meta property="og:url" content="${url(file,locale)}">`);
  html=html.replace("</ul></nav></div></header>",`</ul></nav>${switcher(file,locale)}</div></header>`);
  if(!html.includes('data-language-link'))throw new Error(`Language switch missing: ${file} / ${locale}`);
  if(locale!=='ja'){
   html=html.replaceAll('tel:05068641858','tel:+815068641858').replaceAll('050-6864-1858','+81-50-6864-1858');
   html=html.replace(/<p class="small"><a href="privacy\.html">[^<]+<\/a>[^<]+<\/p>/,locale==='en'
    ? '<p class="small">Please review our <a href="privacy.html">privacy information</a> before sending your email. Preparing a draft does not send your information to this website’s server.</p>'
    : '<p class="small">请阅读<a href="privacy.html">个人信息处理说明</a>后发送邮件。这里输入的内容不会提交至本网站服务器。</p>');
   if(locale==='en')html=html.replaceAll('>、<','>, <');
   html=html.replace(/\b(src|href|poster|srcset)="((?:images|videos|downloads)\/[^\"]+|(?:styles\.css|app\.js)(?:\?v=[a-f0-9]+)?)"/g,'$1="../$2"');
   html=html.replace(/downloads\/(company-brochure-2026|product-catalog-3d)\.pdf/g,`downloads/$1-${locale}.pdf`);
   html=html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,(_,json)=>{
    const schema=JSON.parse(json);if(schema['@type']==='Product')schema.url=url(file,locale);
    return `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>`;
   });
  }
  await write(`${locale==='ja'?'':locale+'/'}${file}`,html);
 }
}
const pdfs=[];
const entries=[];
for(const file of files)for(const locale of ['ja','en','zh'])entries.push(`<url><loc>${url(file,locale)}</loc></url>`);
for(const name of pdfs)for(const locale of ['ja','en','zh'])entries.push(`<url><loc>https://www.automaix.co.jp/downloads/${name}${locale==='ja'?'':'-'+locale}.pdf</loc></url>`);
await write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`);
console.log(`Localized ${files.length} pages into Japanese, English and Simplified Chinese (${files.length*3} pages).`);
