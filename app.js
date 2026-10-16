(() => {
  'use strict';
  const language = document.documentElement.lang;
  const messages = {
    ja: {
      menuOpen: 'メニューを開く', menuClose: 'メニューを閉じる', newsCount: '{count}件のお知らせを表示しています。', required: 'この項目を入力してください。', validEmail: 'メールアドレスの形式をご確認ください。',
      copied: 'コピーしました。', copyFailed: 'コピーできませんでした。表示された下書きまたはメールアドレスを選択し、手動でコピーしてください。',
      subject: '設備導入に関するお問い合わせ：{product}', greeting: '株式会社Automaix ご担当者様', intro: '下記のとおり、設備導入についてご相談いたします。',
      product: '製品', company: '会社名', name: 'お名前', email: 'メール', message: 'ご相談内容', notSpecified: '未記入', to: '宛先', subjectLabel: '件名',
      ready: 'メールの下書きを作成しました。内容をご確認のうえ、メールアプリから送信してください。この時点では送信されていません。', saved: 'メールの下書きの保存を開始しました。メールは送信されていません。'
    },
    en: {
      menuOpen: 'Open menu', menuClose: 'Close menu', newsCount: 'Showing {count} announcements.', required: 'Please complete this field.', validEmail: 'Please enter a valid email address.',
      copied: 'Copied.', copyFailed: 'Automatic copying was unavailable. Please select and copy the displayed draft or email address.',
      subject: 'Product implementation inquiry: {product}', greeting: 'Dear Automaix team,', intro: 'I would like to discuss the following.',
      product: 'Product', company: 'Company', name: 'Name', email: 'Email', message: 'Inquiry', notSpecified: 'Not provided', to: 'To', subjectLabel: 'Subject',
      ready: 'Your draft is ready. It has not been sent. Review and send it from your email app.', saved: 'Draft download started. The email has not been sent.'
    },
    'zh-CN': {
      menuOpen: '打开菜单', menuClose: '关闭菜单', newsCount: '当前显示{count}条公告。', required: '请填写此项。', validEmail: '请输入有效的邮箱地址。',
      copied: '已复制。', copyFailed: '无法自动复制，请选择页面中显示的文案或邮箱地址并手动复制。',
      subject: '产品导入咨询：{product}', greeting: 'Automaix团队：', intro: '我想咨询以下内容。',
      product: '产品', company: '公司名称', name: '姓名', email: '邮箱', message: '咨询内容', notSpecified: '未填写', to: '收件人', subjectLabel: '主题',
      ready: '草稿已准备好，尚未发送。请在邮件应用中确认内容并发送。', saved: '已开始保存文案，邮件尚未发送。'
    }
  };
  const copy = messages[language] || messages.ja;
  const message = (key, values = {}) => copy[key].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
  document.querySelectorAll('[data-language-link]').forEach(link => link.addEventListener('click', () => {
    const destination = new URL(link.href);
    destination.search = location.search;
    destination.hash = location.hash;
    link.href = destination.href;
  }));
  const menuButton = document.getElementById('hamburger');
  const menu = document.getElementById('mainNav');
  const languagePicker = document.querySelector('.language-picker');
  const closeMenu = () => { menu?.classList.remove('open'); menuButton?.setAttribute('aria-expanded', 'false'); menuButton?.setAttribute('aria-label', message('menuOpen')); };
  menuButton?.addEventListener('click', () => {
    if (languagePicker) languagePicker.open = false;
    const open = menu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', message(open ? 'menuClose' : 'menuOpen'));
  });
  menu?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu?.classList.contains('open')) { closeMenu(); menuButton.focus(); } });
  document.addEventListener('click', e => { if (!e.target.closest('.header-main')) closeMenu(); });
  languagePicker?.addEventListener('toggle', () => { if (languagePicker.open) closeMenu(); });
  document.addEventListener('click', e => { if (languagePicker && !e.target.closest('.language-picker')) languagePicker.open = false; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && languagePicker?.open) { languagePicker.open = false; languagePicker.querySelector('summary').focus(); } });
  matchMedia('(min-width:1101px)').addEventListener('change', e => { if (e.matches) closeMenu(); });

  const tabs = [...document.querySelectorAll('[data-category]')];
  const panels = [...document.querySelectorAll('.product-category')];
  const selectCategory = category => {
    if (!tabs.some(tab => tab.dataset.category === category)) return;
    tabs.forEach(tab => { const selected = tab.dataset.category === category; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1; });
    panels.forEach(panel => { panel.hidden = panel.id !== `products-${category}`; });
  };
  const legacyCategories = { robot: 'robot', sorting: 'sorters', separation: 'identification', conveyor: 'conveyors', special: 'peripherals', warehouse: 'conveyors', nanobelt: 'peripherals', modsorter: 'peripherals', putwall: 'robot' };
  const companyHashes = ['#manufacturing-partner', '#partner-projects', '#partner-support', '#company-history'];
  const syncHash = (scroll = false) => {
    const hash = location.hash;
    if (!tabs.length) return;
    if (companyHashes.includes(hash)) { location.replace(`company.html${hash}`); return; }
    if (hash === '#sortermx5-specs' || hash === '#sortermn3-specs') { location.replace(`product-${hash === '#sortermx5-specs' ? 'sortermx5' : 'sortermn3'}.html${hash}`); return; }
    let category = hash.startsWith('#products-') ? hash.slice(10) : hash === '#putwall' ? 'robot' : null;
    category = legacyCategories[category] || category;
    if (!category) return;
    selectCategory(category);
    if (scroll) requestAnimationFrame(() => document.getElementById(`products-${category}`)?.scrollIntoView({ block: 'start' }));
  };
  if (tabs.length) {
    selectCategory('robot');
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => { selectCategory(tab.dataset.category); history.replaceState(null, '', `#products-${tab.dataset.category}`); });
      tab.addEventListener('keydown', e => {
        let next = index;
        if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        else return;
        e.preventDefault(); tabs[next].focus(); tabs[next].click();
      });
    });
    window.addEventListener('hashchange', () => syncHash(true));
    document.querySelectorAll('a[href^="index.html#products-"], a[href^="#products-"]').forEach(a => a.addEventListener('click', e => {
      const destination = new URL(a.href);
      if (destination.pathname === location.pathname || (location.pathname.endsWith('/') && destination.pathname === `${location.pathname}index.html`)) {
        e.preventDefault(); history.pushState(null, '', destination.hash); syncHash(true);
      }
    }));
    syncHash(true);
    window.addEventListener('popstate', () => syncHash(true));
  }
  const newsButtons = [...document.querySelectorAll('[data-news-filter]')];
  newsButtons.forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.newsFilter;
    newsButtons.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    let count = 0;
    document.querySelectorAll('[data-news-category]').forEach(item => { item.hidden = filter !== 'all' && item.dataset.newsCategory !== filter; if (!item.hidden) count++; });
    document.getElementById('news-empty').hidden = count > 0;
    document.getElementById('news-count').textContent = message('newsCount', { count });
  }));
  document.querySelectorAll('video').forEach(video => video.addEventListener('play', () => document.querySelectorAll('video').forEach(other => { if (other !== video) other.pause(); })));
  let movieDialog, modalVideo, modalTitle, movieReturnFocus, previousOverflow;
  const movieLabels = language === 'en' ? {close:'Close video',omakase:'Omakase-kun',tsubame:'Tsubame-chan'} : language.startsWith('zh') ? {close:'关闭视频',omakase:'おまかせくん',tsubame:'つばめちゃん'} : {close:'動画を閉じる',omakase:'おまかせくん',tsubame:'つばめちゃん'};
  const ensureMovieDialog = () => {
    if (movieDialog) return;
    movieDialog = document.createElement('dialog');
    movieDialog.className = 'video-modal';
    movieDialog.setAttribute('aria-labelledby','video-modal-title');
    const panel = document.createElement('div'); panel.className='video-modal-panel';
    const heading = document.createElement('div'); heading.className='video-modal-heading';
    modalTitle = document.createElement('h2'); modalTitle.id='video-modal-title';
    const close = document.createElement('button'); close.type='button'; close.className='video-modal-close'; close.textContent='×'; close.setAttribute('aria-label',movieLabels.close);
    close.addEventListener('click',()=>movieDialog.close());
    modalVideo = document.createElement('video'); modalVideo.controls=true; modalVideo.playsInline=true; modalVideo.preload='metadata';
    modalVideo.addEventListener('play',()=>document.querySelectorAll('video').forEach(other=>{if(other!==modalVideo)other.pause();}));
    heading.append(modalTitle,close); panel.append(heading,modalVideo); movieDialog.append(panel); document.body.append(movieDialog);
    movieDialog.addEventListener('click',event=>{if(event.target===movieDialog)movieDialog.close();});
    movieDialog.addEventListener('close',()=>{
      modalVideo.pause(); modalVideo.removeAttribute('src'); modalVideo.load();
      document.body.style.overflow=previousOverflow;
      if(movieReturnFocus?.isConnected)movieReturnFocus.focus({preventScroll:true});
    });
  };
  const playProductMovie = (id, trigger) => {
    if (!['omakase','tsubame'].includes(id)) return;
    const video = document.querySelector(`[data-product-movie="${id}"]`);
    if (!video) return;
    video.scrollIntoView({behavior:'instant',block:'center'});
    ensureMovieDialog();
    document.querySelectorAll('video').forEach(other=>other.pause());
    if (!movieDialog.open) {
      movieReturnFocus=trigger || document.activeElement; previousOverflow=document.body.style.overflow;
      document.body.style.overflow='hidden'; movieDialog.showModal();
    }
    modalTitle.textContent=movieLabels[id];
    modalVideo.poster=video.poster;
    modalVideo.src=video.querySelector('source')?.src || video.currentSrc;
    modalVideo.muted=false;
    // Cross-page navigation may require muted playback under browser autoplay policy.
    modalVideo.play().catch(()=>{modalVideo.muted=true;return modalVideo.play();}).catch(()=>{});
  };
  document.addEventListener('click', event => {
    const link=event.target.closest('a[data-movie-link]');
    if(!link||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const destination=new URL(link.href);
    const currentPath=location.pathname.endsWith('/')?location.pathname+'index.html':location.pathname;
    if(destination.origin===location.origin&&destination.pathname===currentPath){
      event.preventDefault();history.pushState(null,'',destination.href);playProductMovie(link.dataset.movieLink, link);
    }
  });
  playProductMovie(new URLSearchParams(location.search).get('movie'));


  const writeClipboard = async (value, status) => {
    try { if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable'); await navigator.clipboard.writeText(value); status.textContent = message('copied'); }
    catch { status.textContent = message('copyFailed'); }
  };
  document.getElementById('copy-email')?.addEventListener('click', () => writeClipboard('info@automaix.co.jp', document.getElementById('copy-email-status')));
  const form = document.getElementById('inquiry-form');
  if (form) {
    const validationAlert = document.getElementById('form-validation-message');
    form.addEventListener('invalid', event => {
      const field = event.target;
      field.setCustomValidity('');
      if (field.validity.valueMissing) field.setCustomValidity(message('required'));
      else if (field.validity.typeMismatch && field.type === 'email') field.setCustomValidity(message('validEmail'));
      const firstInvalid = [...form.elements].find(control => control.willValidate && !control.validity.valid);
      if (field === firstInvalid && validationAlert) validationAlert.textContent = field.validationMessage;
    }, true);
    form.addEventListener('input', event => {
      if (event.target.setCustomValidity) event.target.setCustomValidity('');
      if (validationAlert) validationAlert.textContent = '';
    });
    // Never let a browser's default GET form submission put personal details into the URL.
    form.method = 'dialog';
    const selected = new URLSearchParams(location.search).get('product');
    const productSelect = document.getElementById('inquiry-product');
    const option = [...productSelect.options].find(item => item.dataset.productId === selected);
    if (option) productSelect.value = option.value;
    const prepare = () => {
      if (!form.reportValidity()) return null;
      const fields = new FormData(form);
      const subject = message('subject', { product: fields.get('product') });
      const body = `${message('greeting')}\n\n${message('intro')}\n\n${message('product')}: ${fields.get('product')}\n${message('company')}: ${fields.get('company') || message('notSpecified')}\n${message('name')}: ${fields.get('name')}\n${message('email')}: ${fields.get('email')}\n\n${message('message')}:\n${fields.get('message')}\n`;
      document.getElementById('inquiry-preview').value = `${message('to')}: info@automaix.co.jp\n${message('subjectLabel')}: ${subject}\n\n${body}`;
      document.getElementById('inquiry-mail-link').href = `mailto:info@automaix.co.jp?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      document.getElementById('inquiry-result').hidden = false;
      document.getElementById('inquiry-status').textContent = message('ready');
      return { subject, body };
    };
    form.addEventListener('submit', e => { e.preventDefault(); if (prepare()) document.getElementById('inquiry-result').scrollIntoView({ block: 'nearest' }); });
    document.getElementById('copy-inquiry').addEventListener('click', async () => { if (prepare()) await writeClipboard(document.getElementById('inquiry-preview').value, document.getElementById('inquiry-action-status')); });
    document.getElementById('download-inquiry').addEventListener('click', () => {
      if (!prepare()) return;
      const blob = new Blob(['\ufeff', document.getElementById('inquiry-preview').value], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'automaix-inquiry.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      document.getElementById('inquiry-action-status').textContent = message('saved');
    });
    form.addEventListener('input', () => { document.getElementById('inquiry-result').hidden = true; document.getElementById('inquiry-action-status').textContent = ''; });
  }
})();

// Document download registration: the server alone grants access after SMTP acceptance.
(() => {
  const form=document.getElementById('download-form');if(!form)return;
  const locale=document.documentElement.lang==='zh-CN'?'zh':document.documentElement.lang;
  const labels={
    ja:{busy:'登録内容を送信しています…',ready:'登録が完了しました。下のボタンから資料をダウンロードしてください（ダウンロード権限は10分間有効です）。',download:'資料をダウンロード',failed:'登録内容を送信できませんでした。入力内容は画面上に保持されています。時間をおいて、再度お試しください。',unavailable:'Webでの資料受付は現在準備中です。資料をご希望の方はinfo@automaix.co.jpまでお問い合わせください。',rate:'送信回数が上限に達しました。15分後に、再度お試しください。',invalid:'必須項目、メールアドレスの形式、および個人情報の利用に関する同意欄をご確認ください。'},
    en:{busy:'Sending your registration…',ready:'Registration complete. Download your selected document below within 10 minutes.',download:'Download PDF',failed:'We could not send your registration. Your entries are still here. Please try again shortly.',unavailable:'Online document requests are being prepared. Please contact info@automaix.co.jp to request materials.',rate:'Too many attempts. Please try again in 15 minutes.',invalid:'Please check required fields, your email and the consent checkbox.'},
    zh:{busy:'正在提交登记…',ready:'登记成功，请点击下方按钮下载所选资料（10 分钟内有效）。',download:'下载所选 PDF',failed:'登记发送失败，填写内容已保留，请稍后重试。',unavailable:'登记服务正在配置中，请联系 info@automaix.co.jp 获取资料。',rate:'提交过于频繁，请 15 分钟后再试。',invalid:'请检查必填资料、邮箱格式，并勾选个人信息使用同意项。'}
  }[locale];
  const documentSelect=form.elements.namedItem('documentType');
  if(new URLSearchParams(location.search).get('document')==='product-guide')documentSelect.value='product-guide';
  const status=document.getElementById('download-status'),file=document.getElementById('download-file'),button=form.querySelector('button[type="submit"]');
  let available=new Set();
  const updateAvailability=()=>{if(form.getAttribute('aria-busy')==='true')return;button.disabled=!available.has(documentSelect.value);status.textContent=button.disabled?labels.unavailable:'';};
  documentSelect.addEventListener('change',updateAvailability);
  updateAvailability();
  fetch('/api/download-status?locale='+encodeURIComponent(locale),{credentials:'same-origin',cache:'no-store'})
    .then(response=>response.ok?response.json():{available:[]})
    .then(result=>{available=new Set(Array.isArray(result.available)?result.available:[]);updateAvailability();})
    .catch(updateAvailability);
  let grantTimer;
  const expired={ja:'ダウンロード権限の有効期限が切れました。お手数ですが、再度ご登録ください。',en:'Your download permission has expired. Please submit the form again.',zh:'下载权限已过期，请重新提交登记。'}[locale];
  form.method='dialog';
  form.addEventListener('invalid',()=>{status.textContent=labels.invalid;},true);
  form.addEventListener('input',()=>{clearTimeout(grantTimer);if(!button.disabled)status.textContent='';file.hidden=true;});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(button.disabled||!form.reportValidity())return;
    clearTimeout(grantTimer);
    const values=new FormData(form),body={locale,documentType:values.get('documentType'),consent:values.get('consent')==='on'};
    for(const field of ['company','name','email','phone','website'])body[field]=String(values.get(field)||'').trim();
    if(!body.company||!body.name){status.textContent=labels.invalid;return;}
    button.disabled=true;documentSelect.disabled=true;form.setAttribute('aria-busy','true');file.hidden=true;status.textContent=labels.busy;
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),35000);
    try{
      const response=await fetch('/api/company-download',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(body),signal:controller.signal});
      if(!response.ok){status.textContent=response.status===429?labels.rate:response.status===503||response.status===404||response.status===501?labels.unavailable:response.status===400?labels.invalid:labels.failed;return;}
      const result=await response.json();if(result.download!==(body.documentType==='product-guide'?'/api/product-guide-file':'/api/company-file'))throw Error('Unexpected download route');
      file.href=result.download;file.textContent=labels.download;file.hidden=false;status.textContent=labels.ready;status.focus();
      grantTimer=setTimeout(()=>{file.hidden=true;status.textContent=expired;},600000);
    }catch{status.textContent=labels.failed;}
    finally{clearTimeout(timeout);documentSelect.disabled=false;button.disabled=!available.has(documentSelect.value);form.removeAttribute('aria-busy');}
  });
})();

// Mascots link to their product videos while the surrounding layer passes through clicks.
(() => {
  'use strict';
  const lang = document.documentElement.lang;
  const labels = lang === 'ja' ? ['アニメーションを停止','アニメーションを再生'] : lang.startsWith('zh') ? ['暂停动画','播放动画'] : ['Pause animation','Play animation'];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const assetBase = new URL('.', document.currentScript.src);
  const layer = document.createElement('div');
  layer.className = 'site-mascots';
  const toggle = document.createElement('button');
  toggle.type = 'button'; toggle.className = 'motion-toggle';
  let paused = false;
  try { paused = localStorage.getItem('automaix-motion-paused') === 'true'; } catch {}
  const movieNames=lang==='ja'?['おまかせくんの動画を再生','つばめちゃんの動画を再生']:lang.startsWith('zh')?['播放おまかせくん产品视频','播放つばめちゃん产品视频']:['Play Omakase-kun video','Play Tsubame-chan video'];
  const localePrefix=lang==='ja'?'':lang.startsWith('zh')?'zh/':'en/';
  const mascots = ['mascot-worker.png','mascot-penguin.png'].map((file,index) => {
    const element = document.createElement('a'); element.className = 'site-mascot';
    const movie=index?'tsubame':'omakase';
    element.dataset.movieLink=movie; element.href=new URL(`${localePrefix}index.html?movie=${movie}#movie-${movie}`,assetBase).href;
    element.setAttribute('aria-label',movieNames[index]);
    const img = document.createElement('img'); img.src = new URL('images/' + file,assetBase).href; img.alt = ''; img.width = 132; img.height = 156; img.decoding = 'async';
    element.append(img); layer.append(element);
    const item={element,index,x:0,y:0,animation:null,hovered:false,focused:false};
    for(const [event,key,value] of [['pointerenter','hovered',true],['pointerleave','hovered',false],['focus','focused',true],['blur','focused',false]])element.addEventListener(event,()=>{item[key]=value;update();});
    return item;
  });
  document.body.append(layer,toggle);
  function bounds(item) {
    const width = document.documentElement.clientWidth, height = innerHeight;
    return {maxX:Math.max(8,width-item.element.offsetWidth-8),minY:Math.min(130,height*.3),maxY:Math.max(140,height-item.element.offsetHeight-60)};
  }
  function place(item) {
    const b = bounds(item); item.x = item.index ? b.maxX : 8; item.y = b.maxY;
    item.element.style.transform = `translate3d(${item.x}px,${item.y}px,0)`;
  }
  function travel(item) {
    if (paused || reduced.matches || document.hidden || item.hovered || item.focused) return;
    const b = bounds(item), nextX = 8+Math.random()*Math.max(0,b.maxX-8), nextY = b.minY+Math.random()*Math.max(0,b.maxY-b.minY);
    const startX = item.x, startY = item.y, distance = Math.hypot(nextX-startX,nextY-startY);
    const animation = item.element.animate([{transform:`translate3d(${startX}px,${startY}px,0)`},{transform:`translate3d(${nextX}px,${nextY}px,0)`}],{duration:Math.max(4500,distance/35*1000),easing:'ease-in-out',fill:'forwards'});
    item.animation = animation;
    animation.onfinish = () => { item.x=nextX; item.y=nextY; item.element.style.transform=`translate3d(${nextX}px,${nextY}px,0)`; animation.cancel(); item.animation=null; travel(item); };
  }
  function update() {
    const stopped = paused || reduced.matches || document.hidden;
    document.documentElement.classList.toggle('motion-paused',stopped);
    toggle.textContent = paused ? '▶ ' + labels[1] : 'Ⅱ ' + labels[0];
    toggle.setAttribute('aria-pressed',String(paused));
    for (const item of mascots) {
      if (item.animation) { if(stopped||item.hovered||item.focused)item.animation.pause(); else item.animation.play(); }
      else if(!stopped) travel(item);
    }
  }
  toggle.addEventListener('click',() => { paused=!paused;try{localStorage.setItem('automaix-motion-paused',String(paused));}catch{}update(); });
  document.addEventListener('visibilitychange',update);
  reduced.addEventListener('change',update);
  let resizeFrame;
  addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{for(const item of mascots){if(item.animation)item.animation.cancel();item.animation=null;place(item);}update();});});
  mascots.forEach(place); update();
})();
