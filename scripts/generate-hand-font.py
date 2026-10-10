import argparse
from PIL import Image, ImageDraw, ImageFont
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from pathlib import Path
parser=argparse.ArgumentParser(description='Build Inn Hand from the openly licensed Gaegu Bold source.')
parser.add_argument('source',type=Path);parser.add_argument('license',type=Path);parser.add_argument('output',type=Path)
args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
source=ImageFont.truetype(str(args.source),40)
codes=list(range(32,384))+[8211,8212,8216,8217,8220,8221,8230,8592,8593,8594,8595,10003]
names=['.notdef']+[f'uni{code:04X}' for code in codes]
glyphs={};metrics={};scale=25
for code,name in [(63,'.notdef')]+list(zip(codes,names[1:])):
    image=Image.new('L',(72,72));ImageDraw.Draw(image).text((4,46),chr(code),font=source,fill=255,anchor='ls')
    pen=TTGlyphPen(None)
    for y in range(72):
        x=0
        while x<72:
            if image.getpixel((x,y))<100:x+=1;continue
            start=x
            while x<72 and image.getpixel((x,y))>=100:x+=1
            left=(start-4)*scale;right=(x-4)*scale;bottom=(45-y)*scale;top=bottom+scale
            pen.moveTo((left,bottom));pen.lineTo((right,bottom));pen.lineTo((right,top));pen.lineTo((left,top));pen.closePath()
    glyphs[name]=pen.glyph();metrics[name]=(round(source.getlength(chr(code))*scale)+25,0)
fb=FontBuilder(1000,isTTF=True);fb.setupGlyphOrder(names);fb.setupCharacterMap(dict(zip(codes,names[1:])));fb.setupGlyf(glyphs);fb.setupHorizontalMetrics(metrics);fb.setupHorizontalHeader(ascent=850,descent=-250)
fb.setupNameTable({'familyName':'Inn Hand','styleName':'Regular','uniqueFontIdentifier':'PasteInn-InnHand-1','fullName':'Inn Hand Regular','psName':'InnHand-Regular','version':'Version 1.000','copyright':'Copyright 2018 The Gaegu Project Authors; pixel outlines adapted for Paste Inn. Licensed under SIL OFL 1.1.'});fb.setupOS2(sTypoAscender=850,sTypoDescender=-250,usWinAscent=1000,usWinDescent=350);fb.setupPost();fb.setupMaxp()
# Positive pair spacing gives crowded handwritten pairs room to breathe.
addOpenTypeFeaturesFromString(fb.font, "feature kern { pos uni0074 uni0068 75; pos uni0054 uni0068 75; pos uni0073 uni0070 75; pos uni0053 uni0070 75; pos uni0074 uni0069 75; pos uni0054 uni0069 75; pos uni0074 uni006F 75; pos uni0054 uni006F 75; } kern;")
fb.font.flavor='woff2' ;fb.save(args.output/'inn-hand.woff2')
(args.output/'inn-hand-LICENSE.txt').write_text(args.license.read_text()+'\nInn Hand is a renamed derivative of Gaegu Bold. Latin glyphs rasterized and traced into pixel outlines for Paste Inn.\n')
