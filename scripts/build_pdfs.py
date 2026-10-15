from pathlib import Path
from io import BytesIO
from xml.sax.saxutils import escape
import json
from PIL import Image as PILImage
from lxml import html as LH
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor, white
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

repo=Path(__file__).resolve().parent.parent
pdfmetrics.registerFont(TTFont('JP',r'C:\Windows\Fonts\meiryo.ttc',subfontIndex=0))
pdfmetrics.registerFont(TTFont('JPB',r'C:\Windows\Fonts\meiryob.ttc',subfontIndex=0))
pdfmetrics.registerFont(TTFont('CN',r'C:\Windows\Fonts\msjh.ttc',subfontIndex=0))
blue=HexColor('#003d5c'); light=HexColor('#edf5f9'); grey=HexColor('#4f6576')
styles={
 'title':ParagraphStyle('title',fontName='JPB',fontSize=23,leading=34,textColor=blue,spaceAfter=16,wordWrap='CJK'),
 'sub':ParagraphStyle('sub',fontName='JP',fontSize=10,leading=17,textColor=grey,spaceAfter=12,wordWrap='CJK'),
 'h2':ParagraphStyle('h2',fontName='JPB',fontSize=14,leading=23,textColor=blue,spaceBefore=10,spaceAfter=10,wordWrap='CJK'),
 'body':ParagraphStyle('body',fontName='JP',fontSize=9.5,leading=17,textColor=HexColor('#172e40'),spaceAfter=9,wordWrap='CJK'),
 'small':ParagraphStyle('small',fontName='JP',fontSize=8,leading=13,textColor=grey,spaceAfter=8,wordWrap='CJK'),
 'cell':ParagraphStyle('cell',fontName='JP',fontSize=8.4,leading=14,textColor=HexColor('#172e40'),wordWrap='CJK'),
 'white':ParagraphStyle('white',fontName='JPB',fontSize=8.4,leading=14,textColor=white,wordWrap='CJK')}
def para(text,style='body'):
 text=escape(str(text)).replace('\n','<br/>').replace('江苏勒捷特自控科技有限公司','<font name="CN">江苏勒捷特自控科技有限公司</font>')
 return Paragraph(text,styles[style])
def table(rows,widths,header=False):
 cells=[[para(c,'white' if header and i==0 else 'cell') for c in row] for i,row in enumerate(rows)]
 t=Table(cells,colWidths=widths,repeatRows=1 if header else 0,hAlign='LEFT')
 commands=[('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8),('GRID',(0,0),(-1,-1),.4,HexColor('#d7e3eb'))]
 if header:commands += [('BACKGROUND',(0,0),(-1,0),blue),('ROWBACKGROUNDS',(0,1),(-1,-1),[white,light])]
 else:commands += [('BACKGROUND',(0,0),(0,-1),light)]
 t.setStyle(TableStyle(commands));return t
def picture(file,width=174*mm,height=76*mm):
 im=PILImage.open(repo/'images'/file).convert('RGB'); im.thumbnail((1800,1200));buff=BytesIO();im.save(buff,format='JPEG',quality=90,optimize=True);buff.seek(0);scale=min(width/im.width,height/im.height);return Image(buff,width=im.width*scale,height=im.height*scale,hAlign='CENTER')
def furniture(canvas,doc):
 canvas.saveState();canvas.setFillColor(blue);canvas.rect(0,285*mm,210*mm,12*mm,fill=1,stroke=0);canvas.setFont('JP',8);canvas.setFillColor(white);canvas.drawString(18*mm,289*mm,'AUTOMAIX  /  2026.10');canvas.setFillColor(grey);canvas.setFont('JP',7);canvas.drawString(18*mm,11*mm,'www.automaix.co.jp   |   info@automaix.co.jp   |   050-6864-1858');canvas.drawRightString(192*mm,11*mm,str(doc.page));canvas.restoreState()
def build(path,story,title):
 doc=SimpleDocTemplate(str(path),pagesize=(210*mm,297*mm),leftMargin=18*mm,rightMargin=18*mm,topMargin=24*mm,bottomMargin=23*mm,title=title,author='株式会社Automaix')
 doc.build(story,onFirstPage=furniture,onLaterPages=furniture)

story=[para('会社紹介','title'),para('日本法人と中国製造パートナーの事業・製造体制をご案内します。','sub'),para('株式会社Automaix','h2'),table([
 ['会社名','株式会社Automaix / Automaix Co., Ltd.'],['代表者','代表取締役 安田 純'],['所在地','〒507-0814 岐阜県多治見市市之倉町12丁目353番地の307'],['設立','2026年9月18日'],['資本金','990万円'],['連絡先','050-6864-1858\ninfo@automaix.co.jp'],['事業内容','物流自動化設備の企画・開発・製造・販売、輸入販売、システム設計・カスタマイズ、導入支援、据付・試運転・保守・技術サポート、技術コンサルティング']],[38*mm,136*mm]),Spacer(1,12*mm),para('日本の窓口と、中国の製造体制','h2'),para('中国製造パートナーである江苏勒捷特自控科技有限公司と連携し、お客様の荷物や現場条件に合う設備・構成を検討します。'),para('以下の製造規模・沿革・技術実績・施工事例は、中国製造パートナーの情報です。日本法人の実績とは区分してご案内します。','small'),PageBreak()]
story += [para('製造パートナーの体制','title'),para('江苏勒捷特自控科技有限公司','sub'),para('江蘇省常州市武進区を拠点に、物流搬送設備・自動化ラインの製造と販売を手がける企業です。常州武進・鎮江丹陽の2生産拠点に加え、蘇州にも法人を置いています。'),table([['項目','製造パートナーの規模'],['2拠点の生産面積','62,000 m²'],['施工プロジェクト数','1,000件以上'],['主要顧客との取引','10社以上'],['累計特許数','110件以上'],['研究開発・技術人材比率','40%以上']],[76*mm,98*mm],True),para('規模データは2026年9月30日時点の同社資料に基づきます。','small'),para('製造設備と品質管理','h2'),picture('factory-coating.webp',height=60*mm),Spacer(1,3*mm),para('レーザー切断機6台、曲げ加工機4台、ロボット溶接2・手動溶接11ステーション、自動塗装ライン1基。ISO9001品質マネジメントシステムに基づく管理と、顧客基準の研修・評価、実技訓練を実施しています。'),PageBreak()]
story += [para('技術実績と沿革','title'),para('以下は中国製造パートナーの情報です。','small'),table([['年','主な沿革'],['2017','会社設立。ZTO Express B類、BEST Express・STO Express A類サプライヤー。'],['2018','YTO Express A類サプライヤー。'],['2019','Yunda Expressのサプライヤーに。'],['2020','中国郵政・J&T Expressのサプライヤーに。'],['2021','SF Expressのサプライヤー審査に合格。'],['2022','菜鳥（Cainiao）A類サプライヤー。'],['2024','SF Expressの自動化設備サプライヤーに。'],['2025','美団（Meituan）のサプライヤー、SF Expressの包括調達サプライヤーに。']],[24*mm,150*mm],True),para('技術認定・評価','h2'),para('2020年に中国の高新技術企業に認定、2023年に再認定。2025年に江蘇省の「専精特新」中小企業に選定。2019年に常州市武進区スマート物流搬送工程技術研究センターとして承認。'),para('年間売上高（単位：百万米ドル）','h2'),table([['2022','2023','2024','2025'],['29.87','34.35','52.28','76.17']],[43.5*mm]*4,True),PageBreak()]
story += [para('導入事例とサポート','title'),para('中国製造パートナーのシステム導入事例','h2'),picture('project-spain-cainiao.webp',height=65*mm),Spacer(1,4*mm),table([['案件','完工日'],['ベトナム BEST Express','2020年12月21日'],['スペイン 菜鳥（Cainiao）','2025年8月1日'],['イスラエル 菜鳥（Cainiao）','2025年9月5日'],['ベトナム通信事業者向け','2025年5月10日']],[110*mm,64*mm],True),Spacer(1,4*mm),para('中国国内では武漢・蕪湖・盤錦の完工事例があります。淮安・合肥は2026年版会社紹介資料では建設中として掲載されています。','small'),para('導入・保守のご相談','h2'),para('製造パートナーは常州・虎門・貴陽・鄭州・廊坊に中国国内のサービス拠点を配置。海外案件では契約上の現地常駐期間終了後もリモート技術サポートを提供します。'),para('日本での導入、仕様、お見積り、保守に関するご相談はAutomaixへ。提供範囲、電源・温度帯、据付・保守条件は案件ごとに確認します。'),para('050-6864-1858  /  info@automaix.co.jp','h2')]
(repo/'private/brochures').mkdir(parents=True,exist_ok=True)
build(repo/'private/brochures/company-brochure-2026.pdf',story,'AUTOMAIX 会社紹介 2026.10')

data=json.loads((repo/'content/products.json').read_text(encoding='utf-8'))
story=[para('3D仕分け 製品ガイド','title'),para('SorterMX-5・SorterMN-3 と国内取扱モデルの選定案内','sub'),picture('sortermx5-system.webp',height=76*mm),Spacer(1,5*mm),para('シリーズ・モデルの選び方','h2'),table([['名称','構成・選定の目安'],['SorterMX-5','製造パートナーのシリーズ。S01/S02/S03/D01/D02の5モデル。キャリッジ構成と投入方式から選定。'],['SorterMN-3','製造パートナーのコンパクト一体型。C01、半自動投入。'],['おまかせくん','国内取扱モデル T-MX-72-J。構成・仕様は個別確認。'],['つばめちゃん / SLシリーズ','国内取扱モデル T-M-48-J、T-SL-50-J / T-SL-60-J。構成・仕様は個別確認。']],[64*mm,110*mm],True),Spacer(1,5*mm),para('国内取扱モデルと製造パートナーのシリーズは、各名称でご案内しています。名称が似ていても同一の構成・性能とは限りません。用途に合う設備の選定はお問い合わせください。','small'),PageBreak()]
mx=LH.fromstring((repo/'product-sortermx5.html').read_text(encoding='utf-8'))
tabs=mx.xpath('//table[contains(@class,"putwall-table")]')
for i,t in enumerate(tabs):
 name='Sシリーズ' if i==0 else 'Dシリーズ'
 story += [para('SorterMX-5 / '+name,'title'),para('支柱1本にキャリッジ'+('1台。S01・S02・S03の3モデル。' if i==0 else '2台。D01・D02の2モデル。'),'sub')]
 rows=[]
 for row in t.xpath('.//tr'):
  cells=[]
  for cell in row.xpath('./th|./td'):
   for br in cell.xpath('.//br'): br.tail='\n'+(br.tail or '')
   cells.append(cell.text_content().strip())
  rows.append(cells)
 widths=[48*mm]+[126*mm/(len(rows[0])-1)]*(len(rows[0])-1)
 story += [table(rows,widths,True),Spacer(1,5*mm),para('最大荷物高さは仕分け間口の段数によって異なります。実際の寸法・レイアウトは現場条件に合わせて設計します。処理能力は単一ゾーンの最大値です。S01・D01の推奨走行速度は1.2 m/sです。','small'),para('構成・駆動','h2'),para('キャリッジは通常・横桟付き・サイドガード付きから選択・カスタマイズ。昇降ストローク1,900 / 2,900 mm。サーボモーター、サーボ電動ローラーによる昇降・仕分け制御に対応します。'),PageBreak()]
story += [para('SorterMN-3 / C01','title'),para('省スペースの一体型。作業者による投入後、注文別の間口へ自動仕分け。','sub'),picture('sortermn3-system.webp',height=68*mm),Spacer(1,5*mm),table([['項目','C01'],['最大仕分け能力','1,600 個/時'],['最大走行速度','2.5 m/s'],['投入方式','半自動投入'],['キャリッジ','通常タイプ / 横桟付き'],['構造','省スペース一体型、複数の間口構成に対応']],[58*mm,116*mm],True),para('選定・仕様確認のために','h2'),para('最小・最大荷物寸法と重量、必要処理量、仕分け先数、設置スペース、電源、温度帯、既存設備との接続条件をお知らせください。'),para('数値は製造パートナーの2026年10月版製品資料に基づきます。実際の能力は対象荷物や投入・運転条件、設備構成によって異なります。国内取扱モデルの詳細仕様と、保守・据付範囲は案件ごとにご確認ください。','small'),para('050-6864-1858  /  info@automaix.co.jp','h2')]
build(repo/'downloads/product-catalog-3d.pdf',story,'AUTOMAIX 3D仕分け 製品ガイド 2026.10')
print('Built company and 3D sorting PDFs.')
import runpy
runpy.run_path(str(repo/'scripts/build_localized_pdfs.py'),run_name='__main__')
