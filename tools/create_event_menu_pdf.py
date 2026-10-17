from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from PIL import Image
import random
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'output/pdf/event-main-course-a4-v2.pdf'
for name,file in [('Georgia','georgia.ttf'),('GeorgiaBold','georgiab.ttf')]:pdfmetrics.registerFont(TTFont(name,'C:/Windows/Fonts/'+file))
pdfmetrics.registerFont(TTFont('Chinese','C:/Windows/Fonts/msjh.ttc',subfontIndex=0))
W,H=A4
c=canvas.Canvas(str(OUT),pagesize=A4)
c.setTitle('DYRB - Main Course Menu');c.setAuthor('DYRB')
bg=HexColor('#10100F');gold=HexColor('#D7B479');cream=HexColor('#FFF2DE');orange=HexColor('#F26436')
c.setFillColor(bg);c.rect(0,0,W,H,fill=1,stroke=0)
# Restrained brass dust around the perimeter.
rng=random.Random(24)
for i in range(1300):
 x=rng.uniform(0,W);y=rng.uniform(0,H)
 if 20<x<W-20 and 24<y<H-24:continue
 c.setFillColor(Color(.78,.53,.24,alpha=rng.uniform(.1,.35)));c.circle(x,y,rng.uniform(.12,.7),fill=1,stroke=0)
c.setFillAlpha(1)
c.setStrokeColor(HexColor('#5B4930'));c.setLineWidth(.5);c.rect(15,15,W-30,H-30)
# Actual supplied brand mark, reused from the matching clean website asset.
c.drawImage(str(ROOT/'public/images/dyrb-logo.png'),29,H-102,80,80,mask='auto')
c.setFillColor(cream);c.setFont('Georgia',35);c.drawString(126,H-55,'MAIN COURSE')
c.setFillColor(gold);c.setFont('Chinese',14);c.drawString(128,H-81,'主食')
c.setFillColor(orange);c.setFont('Helvetica-Bold',8);c.drawRightString(W-32,H-80,'DYRB  /  SPECIAL EVENT MENU')
c.setStrokeColor(gold);c.setLineWidth(.6);c.line(30,731,W-30,731)

def photo(file,x,y,w,h,r=11):
 c.saveState();p=c.beginPath();p.roundRect(x,y,w,h,r);c.clipPath(p,stroke=0)
 im=Image.open(ROOT/'public/images'/file);iw,ih=im.size;s=max(w/iw,h/ih)
 c.drawImage(ImageReader(im),x+(w-iw*s)/2,y+(h-ih*s)/2,iw*s,ih*s,mask='auto');c.restoreState()
 c.setStrokeColor(HexColor('#6F5331'));c.setLineWidth(.6);c.roundRect(x,y,w,h,r,stroke=1,fill=0)

def badge(price,x,y,w=76):
 c.setFillColor(bg);c.roundRect(x,y,w,32,8,fill=1,stroke=0)
 c.setFillColor(gold);c.setFont('Helvetica-Bold',8);c.drawString(x+10,y+12,'RM')
 c.setFillColor(orange);c.setFont('GeorgiaBold',23);c.drawRightString(x+w-9,y+8,str(price))

def item(file,code,lines,zh,price,x,y,w):
 photo(file,x,y,w,151)
 # Numbering belongs to the menu, and price is attached directly to its dish.
 c.setFillColor(bg);c.circle(x+19,y+20,13,fill=1,stroke=0)
 c.setFillColor(gold);c.setFont('Helvetica-Bold',8);c.drawCentredString(x+19,y+17,code)
 badge(price,x+w-83,y+7)
 c.setFillColor(cream);c.setFont('Georgia',12)
 for i,line in enumerate(lines):
  assert pdfmetrics.stringWidth(line,'Georgia',12)<=w, line
  c.drawString(x,y-19-i*15,line)
 c.setFillColor(gold);c.setFont('Chinese',10);c.drawString(x,y-19-len(lines)*15,zh)

# Feature dish: a larger photograph and generous, easy-to-read caption.
photo('food-f05.jpg',30,503,327,213,14)
c.setFillColor(orange);c.setFont('Helvetica-Bold',8);c.drawString(375,697,'F01  /  SIGNATURE')
c.setFillColor(cream);c.setFont('Georgia',20)
for i,line in enumerate(['Black Pepper','Grilled','Chicken Chop']):c.drawString(375,663-i*27,line)
c.setFillColor(gold);c.setFont('Chinese',11);c.drawString(375,566,'招牌黑胡椒烤鸡排')
c.setFillColor(gold);c.setFont('Helvetica-Bold',10);c.drawString(375,526,'RM')
c.setFillColor(orange);c.setFont('GeorgiaBold',34);c.drawString(400,521,'19')
c.setStrokeColor(HexColor('#58462E'));c.setLineWidth(.5);c.line(30,484,W-30,484)
col=(W-76)/2
item('food-f02.jpg','F02',['Signature Fried Rice','with Fried Chicken Chop'],'招牌炸鸡排炒饭',21,30,320,col)
item('food-f07.jpg','F03',['Signature Mala Spicy Spaghetti','with Chicken Chop'],'招牌麻辣意大利面配鸡排',21,46+col,320,col)
item('event-aglio-olio.png','F04',['Spaghetti Aglio Olio'],'蒜香橄榄油意大利面',21,30,95,col)
item('food-f04.jpg','F05',['Seafood Tomyum Fried Rice'],'海鲜冬阴功炒饭',21,46+col,95,col)
# Fine footer rule echoes the circular geometry in the logo.
c.setStrokeColor(HexColor('#705432'));c.line(30,31,W-30,31)
c.setFillColor(orange);c.circle(W/2,31,2,fill=1,stroke=0)
c.showPage();c.save();print(OUT)
