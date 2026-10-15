"""Check generated pages, local destinations and public content with Python stdlib."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json
import re

root = Path(__file__).resolve().parent.parent
class Document(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids, self.references, self.errors = [], [], []
        self.h1, self.main = 0, 0
        self.language, self.alternates, self.canonical = None, {}, None
        self.json_mode, self.json_text = False, ''
        self.feed(text)
    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if 'id' in attrs: self.ids.append(attrs['id'])
        if tag == 'h1': self.h1 += 1
        if tag == 'main': self.main += 1
        if tag == 'html': self.language = attrs.get('lang')
        if tag == 'link' and attrs.get('rel') == 'alternate':
            key = attrs.get('hreflang')
            if key in self.alternates: self.errors.append('Duplicate language alternate')
            self.alternates[key] = attrs.get('href')
        if tag == 'link' and attrs.get('rel') == 'canonical': self.canonical = attrs.get('href')
        if tag == 'script' and attrs.get('type') == 'application/ld+json': self.json_mode, self.json_text = True, ''
        if tag == 'img' and 'alt' not in attrs: self.errors.append('Image missing alt')
        if tag == 'a' and attrs.get('href') in ('', '#', None): self.errors.append('Empty link')
        if tag == 'form' and attrs.get('method') != 'dialog': self.errors.append('Unexpected network form submission')
        for key in ('src', 'href', 'poster'):
            if key in attrs: self.references.append(attrs[key])
        if 'srcset' in attrs:
            self.references.extend(part.strip().split()[0] for part in attrs['srcset'].split(','))
    def handle_data(self, data):
        if self.json_mode: self.json_text += data
    def handle_endtag(self, tag):
        if tag == 'script' and self.json_mode:
            try: json.loads(self.json_text)
            except json.JSONDecodeError: self.errors.append('Invalid JSON-LD')
            self.json_mode = False

documents = {}
errors = []
for file in sorted(list(root.glob('*.html')) + list((root/'en').glob('*.html')) + list((root/'zh').glob('*.html'))):
    text = file.read_text(encoding='utf-8')
    doc = Document(text)
    documents[file.resolve()] = doc
    if doc.h1 != 1 or doc.main != 1: doc.errors.append('Expected exactly one h1 and main')
    if len(doc.ids) != len(set(doc.ids)): doc.errors.append('Duplicate IDs')
    locale = file.parent.name if file.parent != root else 'ja'
    if doc.language != {'ja':'ja','en':'en','zh':'zh-CN'}[locale]: doc.errors.append('Incorrect page language')
    for lang, prefix in [('ja',''),('en','en/'),('zh-CN','zh/'),('x-default','')]:
        expected = 'https://www.automaix.co.jp/' + prefix + ('' if file.name == 'index.html' else file.name)
        if doc.alternates.get(lang) != expected: doc.errors.append('Incorrect language alternate: ' + lang)
    expected = 'https://www.automaix.co.jp/' + ('' if locale == 'ja' else locale + '/') + ('' if file.name == 'index.html' else file.name)
    if doc.canonical != expected: doc.errors.append('Incorrect canonical URL')
    if 'placeholder.webp' in text or '{{' in text: doc.errors.append('Unfinished generated content')
    if file.parent == root and re.search('多种|复杂|読码|分拣|较大|标准|承载', text): doc.errors.append('Mixed-language product wording')
    errors.extend(f'{file.name}: {err}' for err in doc.errors)
for file, doc in documents.items():
    for reference in doc.references:
        parts = urlsplit(reference)
        if parts.scheme or parts.netloc: continue
        if parts.path == '/api/company-file': continue  # Authenticated server route, tested separately.
        destination = (file.parent / unquote(parts.path)).resolve() if parts.path else file
        if not destination.is_file():
            errors.append(f'{file.name}: missing file {reference}')
        elif parts.fragment and destination in documents and unquote(parts.fragment) not in documents[destination].ids:
            errors.append(f'{file.name}: missing anchor {reference}')
products = json.loads((root / 'content/products.json').read_text(encoding='utf-8'))
if len({p['id'] for p in products}) != len(products): errors.append('Duplicate product IDs')
for product in products:
    if not (root / f'product-{product["id"]}.html').is_file(): errors.append(f'Missing product page: {product["id"]}')
if errors:
    print('\n'.join(errors))
    raise SystemExit(1)
print(f'Passed: {len(documents)} HTML pages, {len(products)} products, local links/anchors/assets, metadata, semantics and inquiry form safety.')
