"""Build English/Chinese brochures from the same localized site content."""
from pathlib import Path
from io import BytesIO
from xml.sax.saxutils import escape
from lxml import html as H
from PIL import Image as PILImage
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor, white
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

repo=Path(__file__).resolve().parent.parent
pdfmetrics.registerFont(TTFont('CN',r'C:\Windows\Fonts\msjh.ttc',subfontIndex=0))
pdfmetrics.registerFont(TTFont('CNB',r'C:\Windows\Fonts\msjhbd.ttc',subfontIndex=0))
pdfmetrics.registerFont(TTFont('EN',r'C:\Windows\Fonts\segoeui.ttf'))
pdfmetrics.registerFont(TTFont('ENB',r'C:\Windows\Fonts\segoeuib.ttf'))
blue=HexColor('#003d5c');grey=HexColor('#4f6576');light=HexColor('#edf5f9')
def load(locale,file):return H.fromstring((repo/locale/file).read_text(encoding='utf-8'))
def text(node):return ' '.join(node.text_content().split())
def first(doc,xpath):return doc.xpath(xpath)[0]
def celltext(node):
    for br in node.xpath('.//br'):br.tail='\n'+(br.tail or '')
    return node.text_content().strip()
def rows(table):return [[celltext(c) for c in row.xpath('./th|./td')] for row in table.xpath('.//tr')]
def image(name,width=174*mm,height=65*mm):
    im=PILImage.open(repo/'images'/name).convert('RGB');im.thumbnail((1500,1000));buf=BytesIO();im.save(buf,'JPEG',quality=90,optimize=True);buf.seek(0);scale=min(width/im.width,height/im.height);return Image(buf,width=im.width*scale,height=im.height*scale,hAlign='CENTER')
for locale in ['en','zh']:
    english=locale=='en';font='EN' if english else 'CN';bold='ENB' if english else 'CNB'
    style={
      'title':ParagraphStyle('title',fontName=bold,fontSize=23,leading=31,textColor=blue,spaceAfter=14,wordWrap=None if english else 'CJK'),
      'h2':ParagraphStyle('h2',fontName=bold,fontSize=13,leading=19,textColor=blue,spaceBefore=10,spaceAfter=8,wordWrap=None if english else 'CJK'),
      'body':ParagraphStyle('body',fontName=font,fontSize=9.5,leading=15,textColor=HexColor('#172e40'),spaceAfter=9,wordWrap=None if english else 'CJK'),
      'small':ParagraphStyle('small',fontName=font,fontSize=8,leading=12,textColor=grey,spaceAfter=8,wordWrap=None if english else 'CJK'),
      'cell':ParagraphStyle('cell',fontName=font,fontSize=8.2,leading=12.5,textColor=HexColor('#172e40'),wordWrap=None if english else 'CJK'),
      'white':ParagraphStyle('white',fontName=bold,fontSize=8.2,leading=12.5,textColor=white,wordWrap=None if english else 'CJK')}
    def p(value,kind='body'):
        if english:value=str(value).replace('〜','–').replace('※','*')
        value=escape(str(value)).replace('\n','<br/>')
        if english:
            for name in ['安田 純']:value=value.replace(name,f'<font name="CN">{name}</font>')
        return Paragraph(value,style[kind])
    def table(data,widths,header=False):
        t=Table([[p(c,'white' if header and j==0 else 'cell') for c in row] for j,row in enumerate(data)],colWidths=widths,repeatRows=1 if header else 0,hAlign='LEFT')
        commands=[('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('GRID',(0,0),(-1,-1),.4,HexColor('#d7e3eb'))]
        commands += [('BACKGROUND',(0,0),(-1,0),blue),('ROWBACKGROUNDS',(0,1),(-1,-1),[white,light])] if header else [('BACKGROUND',(0,0),(0,-1),light)]
        t.setStyle(TableStyle(commands));return t
    def furniture(canvas,doc):
        canvas.saveState();canvas.setFillColor(blue);canvas.rect(0,285*mm,210*mm,12*mm,fill=1,stroke=0);canvas.setFillColor(white);canvas.setFont('Helvetica',8);canvas.drawString(18*mm,289*mm,'AUTOMAIX  /  2026.10  /  '+locale.upper());canvas.setFillColor(grey);canvas.setFont('Helvetica',7);canvas.drawString(18*mm,11*mm,'www.automaix.co.jp   |   info@automaix.co.jp   |   +81-50-6864-1858');canvas.drawRightString(192*mm,11*mm,str(doc.page));canvas.restoreState()
    def build(file,story,title):
        folder=repo/'private/brochures'
        folder.mkdir(parents=True,exist_ok=True)
        document=SimpleDocTemplate(str(folder/file),pagesize=(210*mm,297*mm),leftMargin=18*mm,rightMargin=18*mm,topMargin=24*mm,bottomMargin=23*mm,title=title,author='Automaix Co., Ltd.')
        document.build(story,onFirstPage=furniture,onLaterPages=furniture)
    company=load(locale,'company.html')
    partner=first(company,'//*[@id="manufacturing-partner"]')
    story=[p('Company introduction' if english else '公司介绍','title'),p(text(first(company,'//table[contains(@class,"profile-table")]/preceding::h2[1]')),'h2'),table(rows(first(company,'//table[contains(@class,"profile-table")]')),[44*mm,130*mm]),Spacer(1,7*mm),p(text(first(company,'//*[@id="company-history"]')),'small'),PageBreak()]
    story += [p('Manufacturing capabilities' if english else '自有工厂体系','title'),p(text(first(partner,'.//*[@id="partner-title"]')),'h2'),p(text(first(partner,'.//p[@class="partner-lead"]')))]
    metrics=[[text(first(div,'./dt')),text(first(div,'./dd'))] for div in partner.xpath('.//dl[@class="partner-metrics"]/div')]
    story += [table(metrics,[104*mm,70*mm]),p(text(first(partner,'.//p[@class="partner-scope"]')),'small'),Spacer(1,4*mm),image('factory-coating.webp',height=52*mm),Spacer(1,4*mm),p('; '.join(text(f) for f in partner.xpath('.//div[@class="factory-gallery"]//figcaption')),'small'),PageBreak()]
    history=first(partner,'.//details[@class="partner-history"]')
    historyrows=[[text(first(row,'./dt')),text(first(row,'./dd'))] for row in history.xpath('./dl/div')]
    story += [p('History & technical recognition' if english else '发展历程与技术资质','title'),p('our factories in China' if english else '以下为自有工厂信息','small'),table(historyrows,[22*mm,152*mm]),Spacer(1,5*mm)]
    sales=first(history,'.//table');story += [p(text(first(sales,'./caption')),'h2'),table(rows(sales),[85*mm,89*mm],True),p(text(first(partner,'.//div[@class="partner-quality"]/div[2]/h5')),'h2')]
    story += [p(text(li),'small') for li in partner.xpath('.//div[@class="partner-quality"]/div[2]//li')]
    story += [PageBreak()]
    cases=first(company,'//*[@id="partner-projects"]');support=first(company,'//*[@id="partner-support"]')
    caserows=[['Project' if english else '项目','Completion' if english else '完工日期']]+[[text(first(figure,'.//strong')),text(first(figure,'.//time'))] for figure in cases.xpath('.//figure')]
    story += [p('Projects & support' if english else '项目案例与售后支持','title'),p(text(first(cases,'./p')),'small'),image('project-spain-cainiao.webp',height=52*mm),Spacer(1,4*mm),table(caserows,[100*mm,74*mm],True),Spacer(1,3*mm),p(text(first(cases,'.//div[@class="partner-project-list"]')),'small'),p(text(first(support,'./h4')),'h2')]
    story += [p(text(par),'small') for par in support.xpath('./p')]
    story += [p('+81-50-6864-1858 / info@automaix.co.jp','h2')]
    build(f'company-brochure-2026-{locale}.pdf',story,'AUTOMAIX / '+('Company introduction' if english else '公司介绍'))

    mx=load(locale,'product-sortermx5.html');mn=load(locale,'product-sortermn3.html')
    titles=['Series / model','Selection guidance'] if english else ['系列／型号','选型说明']
    modelrows=[titles,['SorterMX-5','In-house manufacturing series: S01 / S02 / S03 / D01 / D02. Choose the carriage and induction configuration.' if english else '自有工厂系列，包含S01／S02／S03／D01／D02五款型号，按小车结构和供包方式选择。'],['SorterMN-3','Compact integrated in-house series. C01 with semi-automatic induction.' if english else '自有工厂紧凑一体式系列，C01采用半自动供包。'],['Omakase-kun','Japan-offered model: T-MX-72-J. Specifications confirmed for each project.' if english else '日本市场销售型号T-MX-72-J，规格按项目单独确认。'],['Tsubame-chan / SL','Japan-offered models: T-M-48-J, T-SL-50-J / T-SL-60-J. Specifications confirmed for each project.' if english else '日本市场销售型号T-M-48-J、T-SL-50-J／T-SL-60-J，规格按项目单独确认。']]
    condition=text(first(mx,'//div[@class="detail-intro"]//p[@class="small"]'))
    story=[p('3D sorting product guide' if english else '3D分拣产品指南','title'),p('In-house series and models offered in Japan' if english else '自有工厂系列及日本市场销售型号','small'),image('sortermx5-system.webp',height=70*mm),Spacer(1,5*mm),table(modelrows,[53*mm,121*mm],True),Spacer(1,5*mm),p('The models offered in Japan and the in-house manufacturing series are described separately. Similar names do not establish identical configurations or performance. Contact us for selection support.' if english else '日本市场销售型号与自有工厂系列分别介绍，名称相近不代表配置或性能相同。具体选型请咨询确认。','small'),PageBreak()]
    for index,t in enumerate(mx.xpath('//table[@class="putwall-table"]')):
        data=rows(t);widths=[48*mm]+[126*mm/(len(data[0])-1)]*(len(data[0])-1)
        story += [p('SorterMX-5 / '+('S series' if index==0 else 'D series') if english else 'SorterMX-5／'+('S系列' if index==0 else 'D系列'),'title'),p('One carriage per mast.' if english and index==0 else 'Two carriages per mast.' if english else '一杆单车。' if index==0 else '一杆双车。','small'),table(data,widths,True),Spacer(1,5*mm),p(text(first(mx,'//p[@class="putwall-note"]')),'small'),p(text(first(mx,'//*[@id="sortermx5-specs"]//h3[last()]')),'h2'),p(text(first(mx,'//*[@id="sortermx5-specs"]//h3[last()]/following-sibling::p[1]')),'small'),PageBreak()]
    mntable=first(mn,'//table[@class="putwall-table"]')
    story += [p('SorterMN-3 / C01','title'),p(text(first(mn,'//div[@class="detail-intro"]//p[1]'))),image('sortermn3-system.webp',height=62*mm),Spacer(1,5*mm),table(rows(mntable),[62*mm,112*mm],True),p('Implementation conditions' if english else '导入条件','h2'),p(text(first(mn,'//section[@class="detail-consult"]/p')),'small'),p(condition,'small'),p('+81-50-6864-1858 / info@automaix.co.jp','h2')]
    build(f'product-catalog-3d-{locale}.pdf',story,'AUTOMAIX / '+('3D sorting guide' if english else '3D分拣产品指南'))
    print('Built',locale,'company and product PDFs.')
