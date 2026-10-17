from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from PIL import Image
root=Path(__file__).resolve().parents[1]
source=root/'output/pdf/halloween-night-cinematic-menu.png'
output=root/'output/pdf/halloween-night-cinematic-menu-a4.pdf'
image=Image.open(source)
w,h=A4
scale=min(w/image.width,h/image.height)
dw,dh=image.width*scale,image.height*scale
c=canvas.Canvas(str(output),pagesize=A4)
c.setTitle('DYRB Halloween Night - Main Course Menu')
c.setAuthor('DYRB')
c.setFillColorRGB(.03,.02,.025);c.rect(0,0,w,h,fill=1,stroke=0)
c.drawImage(ImageReader(image),(w-dw)/2,(h-dh)/2,dw,dh)
c.showPage();c.save()
print(f'A4 PDF saved. Source artwork: {image.width} x {image.height}px.')
