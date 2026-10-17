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
OUT=ROOT/'output/pdf/halloween-main-course-a4.pdf'
for name,file in [('Georgia','georgia.ttf'),('GeorgiaBold','georgiab.ttf')]:pdfmetrics.registerFont(TTFont(name,'C:/Windows/Fonts/'+file))
pdfmetrics.registerFont(TTFont('Chinese','C:/Windows/Fonts/msjh.ttc',subfontIndex=0))
W,H=A4
c=canvas.Canvas(str(OUT),pagesize=A4)
c.setTitle('DYRB - Halloween Night Menu');c.setAuthor('DYRB')
bg=HexColor('#100D17');gold=HexColor('#D7B479');cream=HexColor('#FFF2DE');orange=HexColor('#F26436')
c.setFillColor(bg);c.rect(0,0,W,H,fill=1,stroke=0)
# Restrained brass dust around the perimeter.
rng=random.Random(24)
for i in range(1300):
 x=rng.uniform(0,W);y=rng.uniform(0,H)
 if 20<x<W-20 and 24<y<H-24:continue
 c.setFillColor(Color(.78,.53,.24,alpha=rng.uniform(.1,.35)));c.circle(x,y,rng.uniform(.12,.7),fill=1,stroke=0)
c.setFillAlpha(1)
c.setStrokeColor(HexColor('#5B4930'));c.setLineWidth(.5);c.rect(15,15,W-30,H-30)
# Halloween artwork is vector drawn, leaving the natural dish photography intact.
import math

def bat(x,y,size):
 c.saveState();c.translate(x,y);c.scale(size,size)
 c.setFillColor(HexColor('#08070B'));p=c.beginPath();p.moveTo(-1,0)
 p.curveTo(-.8,.45,-.6,.4,-.25,.16);p.lineTo(-.12,.32);p.lineTo(0,.19);p.lineTo(.12,.32);p.lineTo(.25,.16)
 p.curveTo(.6,.4,.8,.45,1,0);p.curveTo(.65,.14,.65,-.2,.4,-.12);p.curveTo(.3,-.38,.12,-.16,0,-.4)
 p.curveTo(-.12,-.16,-.3,-.38,-.4,-.12);p.curveTo(-.65,-.2,-.65,.14,-1,0);p.close();c.drawPath(p,fill=1,stroke=0);c.restoreState()

def web(x,y,d,flip=1):
 c.saveState();c.translate(x,y);c.scale(flip,-1);c.setStrokeColor(HexColor('#63556E'));c.setLineWidth(.45)
 for angle in [0,18,36,54,72,90]:
  r=math.radians(angle);c.line(0,0,d*math.cos(r),d*math.sin(r))
 for radius in [d*.25,d*.5,d*.75,d]:
  for angle in range(0,90,18):
   r1=math.radians(angle);r2=math.radians(angle+18);rm=(r1+r2)/2
   p=c.beginPath();p.moveTo(radius*math.cos(r1),radius*math.sin(r1));p.curveTo(radius*.85*math.cos(rm),radius*.85*math.sin(rm),radius*.85*math.cos(rm),radius*.85*math.sin(rm),radius*math.cos(r2),radius*math.sin(r2));c.drawPath(p)
 c.restoreState()

def pumpkin(x,y,r):
 c.saveState();c.translate(x,y)
 c.setFillColor(HexColor('#80422D'));c.roundRect(-2,r*.55,4,r*.45,1,fill=1,stroke=0)
 for dx,col in [(-r*.35,'#CC4E20'),(r*.35,'#CC4E20'),(0,'#F47A26')]:
  c.setFillColor(HexColor(col));c.ellipse(dx-r*.55,-r*.6,dx+r*.55,r*.65,fill=1,stroke=0)
 c.setFillColor(HexColor('#241322'))
 for dx in [-r*.3,r*.3]:
  p=c.beginPath();p.moveTo(dx-r*.15,r*.12);p.lineTo(dx+r*.15,r*.12);p.lineTo(dx,r*.4);p.close();c.drawPath(p,fill=1,stroke=0)
 p=c.beginPath();p.moveTo(-r*.48,-r*.1);p.lineTo(-r*.18,-r*.18);p.lineTo(0,-r*.08);p.lineTo(r*.18,-r*.18);p.lineTo(r*.48,-r*.1);p.lineTo(r*.28,-r*.4);p.lineTo(-r*.28,-r*.4);p.close();c.drawPath(p,fill=1,stroke=0)
 c.restoreState()

# Amber moon, wing silhouettes and cobwebs establish the event at a glance.
c.setFillColor(HexColor('#292035'));c.circle(530,788,43,fill=1,stroke=0)
c.setFillColor(HexColor('#EFBC70'));c.circle(530,788,34,fill=1,stroke=0)
c.setFillColor(HexColor('#D99C54'))
for x,y,r in [(518,799,6),(542,777,8),(525,770,4),(544,801,3)]:c.circle(x,y,r,fill=1,stroke=0)
bat(524,797,24);bat(557,764,14);bat(486,821,12)
web(W-15,H-15,83,-1);web(15,H-15,25)
c.drawImage(str(ROOT/'public/images/dyrb-logo.png'),29,H-102,80,80,mask='auto')
c.setFillColor(orange);c.setFont('GeorgiaBold',31);c.drawString(126,H-51,'HALLOWEEN')
c.setFillColor(cream);c.setFont('Georgia',24);c.drawString(128,H-79,'NIGHT')
c.setFillColor(gold);c.setFont('Helvetica-Bold',9);c.drawString(245,H-76,'MAIN COURSE')
c.setFont('Chinese',11);c.drawString(128,H-100,'万圣节之夜 · 主食')
c.setStrokeColor(HexColor('#9E613B'));c.setLineWidth(.6);c.line(30,731,W-30,731)
# A small hanging spider sits outside the dish and caption area.
c.setStrokeColor(HexColor('#79627C'));c.setLineWidth(.5);c.line(580,726,580,655)
c.setFillColor(HexColor('#B17C5E'));c.ellipse(577,646,583,655,fill=1,stroke=0)
for d in [-1,1]:
 for k in range(3):c.line(580+d*2,650+k,580+d*(7+k),646+k*4)

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
pumpkin(46,37,18);pumpkin(W-46,37,18)
c.setFillColor(gold);c.setFont('Helvetica-Bold',7);c.drawCentredString(W/2,23,'DYRB  /  HALLOWEEN NIGHT')
c.showPage();c.save();print(OUT)
