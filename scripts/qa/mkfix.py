import sys,json
from PIL import Image, ImageDraw, ImageFont
RUN=sys.argv[1]; spec=json.load(open(f"spec_{RUN}.json"))
f=ImageFont.load_default(30)
im=Image.new("RGB",(1000,100+80*len(spec["img"])),"white"); d=ImageDraw.Draw(im)
for i,l in enumerate(spec["img"]): d.text((30,30+i*80),l,fill="black",font=f)
im.save(f"ans_{RUN}.png")
body=b"BT /F1 16 Tf 30 250 Td 22 TL "+b" ".join(b"("+l.encode()+b") Tj T*" for l in spec["pdf"])+b" ET"
objs=[b"<</Type/Catalog/Pages 2 0 R>>",b"<</Type/Pages/Kids[3 0 R]/Count 1>>",b"<</Type/Page/Parent 2 0 R/MediaBox[0 0 600 300]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>",b"<</Length %d>>stream\n"%len(body)+body+b"\nendstream",b"<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>"]
out=b"%PDF-1.4\n";offs=[]
for i,o in enumerate(objs): offs.append(len(out)); out+=b"%d 0 obj\n"%(i+1)+o+b"\nendobj\n"
x=len(out); out+=b"xref\n0 6\n0000000000 65535 f \n"+b"".join(b"%010d 00000 n \n"%o for o in offs)+b"trailer<</Size 6/Root 1 0 R>>\nstartxref\n%d\n%%%%EOF"%x
open(f"ans_{RUN}.pdf","wb").write(out)
C,P,I=[0.7,1],[0.2,0.8],[0,0.3]
fx={"s1":[{"kind":"correct","range":C,"text":spec["q1"]},{"kind":"correct","range":C,"file":f"ans_{RUN}.png"},{"kind":"correct","range":C,"file":f"ans_{RUN}.pdf"},{"kind":"partial","range":P,"text":spec["q4p"]}],
 "s2":[{"kind":"incorrect","range":I,"text":x} for x in spec["wrong"]]}
json.dump(fx,open(f"fixture_{RUN}.json","w"),indent=1)
