from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.lib.utils import ImageReader
import random
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/pdf/event-main-course-a4.pdf'
pdfmetrics.registerFont(TTFont('Georgia','C:/Windows/Fonts/georgia.ttf'))
pdfmetrics.registerFont(TTFont('GeorgiaBold','C:/Windows/Fonts/georgiab.ttf'))
pdfmetrics.registerFont(TTFont('Chinese','C:/Windows/Fonts/msjh.ttc',subfontIndex=0))
W,H=A4
c=canvas.Canvas(str(OUT),pagesize=A4)
c.setTitle('DYRB - Special Event Main Course')
c.setAuthor('DYRB')
gold=HexColor('#CEA765');cream=HexColor('#F1E9DA');muted=HexColor('#A58D68')
c.setFillColor(HexColor('#100F0C'));c.rect(0,0,W,H,fill=1,stroke=0)
rng=random.Random(8)
# Subtle scattered brass flecks at the outer edges, echoing the reference.
for i in range(1700):
 x=rng.uniform(0,W);y=rng.uniform(0,H)
 if x>24 and x<W-24 and y>28 and y<H-28:continue
 c.setFillColor(Color(.65,.46,.20,alpha=rng.uniform(.1,.35)))
 c.circle(x,y,rng.uniform(.15,.65),fill=1,stroke=0)
c.setStrokeColor(HexColor('#6C5432'));c.setLineWidth(.55);c.rect(17,17,W-34,H-34)
c.setFillColor(muted);c.setFont('Helvetica',9);c.drawCentredString(W/2,H-35,'D Y R B')
c.setFillColor(gold);c.setFont('Georgia',37);c.drawCentredString(W/2,H-78,'MAIN COURSE')
c.setFont('Chinese',15);c.drawCentredString(W/2,H-102,'主食')
c.setStrokeColor(gold);c.setLineWidth(.45)
c.line(47,H-97,W/2-35,H-97);c.line(W/2+35,H-97,W-47,H-97)

def photo(file,x,y,w,h):
 # Layout crop only; retain each original food photo's natural colour and texture.
 c.saveState();p=c.beginPath();p.roundRect(x,y,w,h,3);c.clipPath(p,stroke=0)
 from PIL import Image
 im=Image.open(ROOT/'public/images'/file);iw,ih=im.size
 scale=max(w/iw,h/ih);dw,dh=iw*scale,ih*scale
 c.drawImage(ImageReader(im),x+(w-dw)/2,y+(h-dh)/2,dw,dh,mask='auto')
 c.restoreState()
 c.setStrokeColor(HexColor('#6B5636'));c.setLineWidth(.45);c.roundRect(x,y,w,h,3,stroke=1,fill=0)

def label(code,lines,zh,price,x,y,w,size=11):
 c.setStrokeColor(gold);c.setLineWidth(.55);c.circle(x+12,y-11,12,stroke=1,fill=0)
 c.setFillColor(gold);c.setFont('Georgia',8.5);c.drawCentredString(x+12,y-14,code)
 tx=x+33
 c.setFillColor(cream);c.setFont('Georgia',size)
 for i,line in enumerate(lines):c.drawString(tx,y-8-i*14,line)
 bottom=y-8-(len(lines)-1)*14
 c.setFillColor(gold);c.setFont('Chinese',10);c.drawString(tx,bottom-17,zh)
 c.setFont('GeorgiaBold',16);c.drawRightString(x+w,y-58,f'RM {price}')

# Signature dish gets a wide lead photograph; four supporting dishes form a calm grid.
photo('food-f05.jpg',34,520,286,196)
c.setFillColor(muted);c.setFont('Helvetica',8);c.drawString(342,697,'SIGNATURE')
c.setFillColor(gold);c.setFont('Georgia',10);c.drawString(342,676,'F01')
c.setFillColor(cream);c.setFont('Georgia',15)
for i,line in enumerate(['Black Pepper','Grilled Chicken','Chop']):c.drawString(342,649-i*22,line)
c.setFillColor(gold);c.setFont('Chinese',12);c.drawString(342,566,'招牌黑胡椒烤鸡排')
c.setFont('GeorgiaBold',25);c.drawString(342,531,'RM 19')
c.setStrokeColor(HexColor('#57472D'));c.line(34,502,W-34,502)
col=(W-84)/2
photo('food-f02.jpg',34,333,col,151)
label('F02',['SIGNATURE FRIED RICE','WITH FRIED CHICKEN CHOP'],'招牌炸鸡排炒饭',21,34,319,col,10.7)
photo('food-f07.jpg',50+col,333,col,151)
label('F03',['SIGNATURE MALA SPICY','SPAGHETTI WITH CHICKEN CHOP'],'招牌麻辣意大利面配鸡排',21,50+col,319,col,9.4)
photo('event-aglio-olio.png',34,111,col,142)
label('F04',['SPAGHETTI AGLIO OLIO'],'蒜香橄榄油意大利面',21,34,97,col,10.9)
photo('food-f04.jpg',50+col,111,col,142)
label('F05',['SEAFOOD TOMYUM','FRIED RICE'],'海鲜冬阴功炒饭',21,50+col,97,col,10.9)
c.showPage();c.save()
print(OUT)
