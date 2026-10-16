import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFile(resolve(root, path), 'utf8');
const write = (path, value) => writeFile(resolve(root, path), value, 'utf8');
const products = JSON.parse(await read('content/products.json'));
const pages = JSON.parse(await read('content/pages.json'));
const version = async file => createHash('sha256').update(await read(file)).digest('hex').slice(0,12);
const shell = (await read('templates/page.html')).replace('href="styles.css"',`href="styles.css?v=${await version('styles.css')}"`).replace('src="app.js"',`src="app.js?v=${await version('app.js')}"`);
const groups = [['robot','3D仕分け'],['sorters','ソーター'],['conveyors','搬送設備'],['identification','投入・計測・識別'],['peripherals','周辺機器']];
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const url = file => `https://www.automaix.co.jp/${file === 'index.html' ? '' : file}`;
const render = async (file, title, description, body, schema) => {
  const slots = { TITLE:escape(title), DESCRIPTION:escape(description), URL:escape(url(file)), SCHEMA:JSON.stringify(schema).replaceAll('<','\\u003c'), CONTENT:body };
  await write(file, shell.replace(/\{\{(TITLE|DESCRIPTION|URL|SCHEMA|CONTENT)\}\}/g, (_, key) => slots[key]));
};
const card = p => `<article class="product-card"><a class="product-image" href="product-${p.id}.html" aria-label="${escape(p.name)}の詳細"><img src="images/${escape(p.image)}" alt="${escape(p.name)}" loading="lazy" decoding="async" width="${p.width}" height="${p.height}"></a><div class="product-body"><p class="product-model">${escape(p.model)}</p><h4><a href="product-${p.id}.html">${escape(p.name)}</a></h4><p>${escape(p.description)}</p><a class="text-link" href="product-${p.id}.html">製品詳細・仕様を見る <span aria-hidden="true">→</span></a></div></article>`;
const catalog = `<section class="section" id="products"><div class="container"><div class="section-heading"><p class="eyebrow">PRODUCTS</p><h2>製品ラインナップ</h2></div><p class="section-intro">対象荷物の特性と物流工程に応じて、適切な設備をご検討いただけます。</p><div class="product-tabs" role="tablist" aria-label="製品カテゴリー">${groups.map(([id,label])=>`<button type="button" role="tab" id="tab-${id}" aria-controls="products-${id}" aria-selected="${id==='robot'}" data-category="${id}">${label}</button>`).join('')}</div>${groups.map(([id,label])=>`<section class="product-category" id="products-${id}" role="tabpanel" aria-labelledby="tab-${id}"><h3>${label}</h3><div class="product-grid">${products.filter(p=>p.category===id).map(card).join('')}</div></section>`).join('')}</div></section>`;
const options = '<option value="未定（機種選定から相談）">未定（機種選定から相談）</option>'+products.map(p=>`<option data-product-id="${p.id}" value="${escape(p.name+' / '+p.model)}">${escape(p.name+' / '+p.model)}</option>`).join('');
for (const page of pages) {
  let body = await read(`templates/${page.file}`);
  body=body.replace('{{CATALOG}}', catalog).replace('{{PRODUCT_OPTIONS}}',options);
  await render(page.file,page.title,page.description,body,page.schema);
}
for (const p of products) {
  if (!/^[a-z0-9-]+$/.test(p.id) || !groups.some(([id])=>id===p.category)) throw new Error(`Invalid product: ${p.id}`);
  const condition=p.specificationNote || (p.legacy?'国内取扱モデルの設備構成、性能、電源仕様、使用温度範囲、据付条件は、案件ごとに確認のうえご案内します。':'掲載値は、自社工場の2026年10月版製品資料に基づきます。実際の処理能力は、荷物の寸法・重量、投入条件、仕分け先数、ライン構成により異なります。');
  const inquiry=`index.html?product=${p.id}#contact`;
  const body=`<section class="page-title"><div class="container"><a class="breadcrumb" href="index.html">ホーム</a><p class="eyebrow">PRODUCT DETAIL</p><h1>${escape(p.name)}</h1><p>${escape(p.model)}</p></div></section><div class="container section product-detail"><div class="detail-intro"><img src="images/${escape(p.image)}" alt="${escape(p.name)}の製品写真・全体図" width="${p.width}" height="${p.height}" decoding="async"><div><p>${escape(p.description)}</p><p class="small">${condition}</p><a class="btn btn-primary" href="${inquiry}">この製品の導入について相談する</a><a class="text-link" href="index.html#products-${p.category}">製品一覧へ戻る →</a></div></div><section class="feature-list"><h2>製品の特長</h2>${p.features.map(([name,description])=>`<div><h3>${escape(name)}</h3><p>${escape(description)}</p></div>`).join('')}</section><h2>主要仕様・選定条件</h2><div class="table-scroll" role="region" aria-label="製品仕様" tabindex="0"><table class="spec-table"><caption>${escape(p.name)} 主な仕様</caption><tbody>${p.specs.map(([key,value])=>`<tr><th scope="row">${escape(key)}</th><td>${escape(value)}</td></tr>`).join('')}</tbody></table></div><p class="small">${condition}</p>${p.extra||''}<section class="detail-consult"><h2>導入検討時の確認事項</h2><p>対象荷物の最小・最大寸法および重量、必要処理能力、仕分け先数、設置スペース、電源仕様、使用温度範囲、既存設備との接続条件をお知らせください。保守範囲と据付・試運転工程についても、案件ごとに確認します。</p><a class="btn btn-primary" href="${inquiry}">仕様・お見積りについて相談する</a></section></div>`;
  const schema={'@context':'https://schema.org','@type':'Product',name:p.name,model:p.model,description:p.description,image:`https://www.automaix.co.jp/images/${p.image}`,url:url(`product-${p.id}.html`)};
  if (!p.legacy) schema.manufacturer={'@type':'Organization',name:'Automaix自社工場'};
  await render(`product-${p.id}.html`,`${p.name} 製品仕様`,p.description,body,schema);
}
const all=[...pages.map(p=>p.file),...products.map(p=>`product-${p.id}.html`)];
await write('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${all.map(file=>`<url><loc>${escape(url(file))}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Built ${pages.length+products.length} HTML pages from shared templates.`);
await import('./localize.mjs');
