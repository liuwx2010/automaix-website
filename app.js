(() => {
  'use strict';
  const language = document.documentElement.lang;
  const messages = {
    ja: {
      menuOpen: 'メニューを開く', menuClose: 'メニューを閉じる', newsCount: '{count}件のお知らせを表示しています。', required: 'この項目を入力してください。', validEmail: '有効なメールアドレスを入力してください。',
      copied: 'コピーしました。', copyFailed: '自動コピーができませんでした。表示された文面またはメールアドレスを選択してコピーしてください。',
      subject: '製品の導入相談：{product}', greeting: '株式会社Automaix ご担当者様', intro: '下記の内容について相談します。',
      product: '製品', company: '会社名', name: 'お名前', email: 'メール', message: 'ご相談内容', notSpecified: '未記入', to: '宛先', subjectLabel: '件名',
      ready: '文面を準備しました。まだ送信していません。メールアプリで確認して送信してください。', saved: '文面の保存を開始しました。メールはまだ送信していません。'
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
  matchMedia('(min-width:801px)').addEventListener('change', e => { if (e.matches) closeMenu(); });

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

// Company brochure registration: the server alone grants access after SMTP acceptance.
(() => {
  const form=document.getElementById('download-form');if(!form)return;
  const locale=document.documentElement.lang==='zh-CN'?'zh':document.documentElement.lang;
  const labels={
    ja:{busy:'登録内容を送信しています…',ready:'登録が完了しました。下のボタンから会社資料をダウンロードできます（10分間有効）。',download:'会社紹介PDFをダウンロード',failed:'送信できませんでした。入力内容は保持されています。しばらくして再度お試しください。',unavailable:'現在、登録サービスの準備中です。info@automaix.co.jpへお問い合わせください。',rate:'送信回数が上限に達しました。15分後に再度お試しください。',invalid:'必須項目とメールアドレス、同意欄をご確認ください。'},
    en:{busy:'Sending your registration…',ready:'Registration complete. Download the brochure below within 10 minutes.',download:'Download company brochure PDF',failed:'We could not send your registration. Your entries are still here. Please try again shortly.',unavailable:'The registration service is being set up. Please contact info@automaix.co.jp.',rate:'Too many attempts. Please try again in 15 minutes.',invalid:'Please check required fields, your email and the consent checkbox.'},
    zh:{busy:'正在提交登记…',ready:'登记成功，请点击下方按钮下载公司资料（10 分钟内有效）。',download:'下载公司介绍 PDF',failed:'登记发送失败，填写内容已保留，请稍后重试。',unavailable:'登记服务正在配置中，请联系 info@automaix.co.jp 获取资料。',rate:'提交过于频繁，请 15 分钟后再试。',invalid:'请检查必填资料、邮箱格式，并勾选个人信息使用同意项。'}
  }[locale];
  const status=document.getElementById('download-status'),file=document.getElementById('download-file'),button=form.querySelector('button[type="submit"]');
  let grantTimer;
  const expired={ja:'ダウンロード期限が切れました。もう一度登録してください。',en:'Your download permission has expired. Please submit the form again.',zh:'下载权限已过期，请重新提交登记。'}[locale];
  form.method='dialog';
  form.addEventListener('invalid',()=>{status.textContent=labels.invalid;},true);
  form.addEventListener('input',()=>{clearTimeout(grantTimer);if(!button.disabled)status.textContent='';file.hidden=true;});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(button.disabled||!form.reportValidity())return;
    clearTimeout(grantTimer);
    const values=new FormData(form),body={locale,consent:values.get('consent')==='on'};
    for(const field of ['company','name','email','phone','website'])body[field]=String(values.get(field)||'').trim();
    if(!body.company||!body.name){status.textContent=labels.invalid;return;}
    button.disabled=true;form.setAttribute('aria-busy','true');file.hidden=true;status.textContent=labels.busy;
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),35000);
    try{
      const response=await fetch('/api/company-download',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(body),signal:controller.signal});
      if(!response.ok){status.textContent=response.status===429?labels.rate:response.status===503||response.status===404||response.status===501?labels.unavailable:response.status===400?labels.invalid:labels.failed;return;}
      const result=await response.json();if(result.download!=='/api/company-file')throw Error('Unexpected download route');
      file.href=result.download;file.textContent=labels.download;file.hidden=false;status.textContent=labels.ready;status.focus();
      grantTimer=setTimeout(()=>{file.hidden=true;status.textContent=expired;},600000);
    }catch{status.textContent=labels.failed;}
    finally{clearTimeout(timeout);button.disabled=false;form.removeAttribute('aria-busy');}
  });
})();
