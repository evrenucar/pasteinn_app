"""Turkish glyphs built from Inn Hand's own outlines on its 25-unit pixel grid."""
from fontTools.pens.ttGlyphPen import TTGlyphPen


def add_turkish_glyphs(font):
    glyf = font['glyf']
    cmap = font.getBestCmap()

    def rectangle(pen, x, y, w, h):
        pen.moveTo((x, y))
        pen.lineTo((x + w, y))
        pen.lineTo((x + w, y + h))
        pen.lineTo((x, y + h))
        pen.closePath()

    for char, base, accent in [
        ('ı', 'i', 'dotless'), ('İ', 'I', 'dot'),
        ('ğ', 'g', 'breve'), ('Ğ', 'G', 'breve'),
        ('ş', 's', 'cedilla'), ('Ş', 'S', 'cedilla'),
        ('ç', 'c', 'cedilla'), ('Ç', 'C', 'cedilla'),
        ('ö', 'o', 'diaeresis'), ('Ö', 'O', 'diaeresis'),
        ('ü', 'u', 'diaeresis'), ('Ü', 'U', 'diaeresis'),
    ]:
        original = glyf[cmap[ord(base)]]
        pen = TTGlyphPen(None)
        center = round((original.xMin + original.xMax) / 50) * 25
        if accent == 'dotless':
            # Each contour is a horizontal pixel run. Keep the stem, omit the dot.
            start = 0
            for end in original.endPtsOfContours:
                points = original.coordinates[start:end + 1]
                if max(y for x, y in points) <= 325:
                    pen.moveTo(points[0])
                    for point in points[1:]:
                        pen.lineTo(point)
                    pen.closePath()
                start = end + 1
        else:
            original.draw(pen, glyf)
            if accent == 'dot':
                rectangle(pen, center - 50, original.yMax + 100, 75, 75)
            elif accent == 'diaeresis':
                rectangle(pen, center - 125, original.yMax + 100, 75, 75)
                rectangle(pen, center + 50, original.yMax + 100, 75, 75)
            elif accent == 'breve':
                y = original.yMax + 100
                rectangle(pen, center - 125, y + 50, 50, 75)
                rectangle(pen, center - 75, y, 150, 50)
                rectangle(pen, center + 75, y + 50, 50, 75)
            else:
                y = original.yMin - 25
                rectangle(pen, center, y - 50, 50, 50)
                rectangle(pen, center + 25, y - 100, 50, 50)
                rectangle(pen, center - 50, y - 150, 100, 50)
        name = cmap[ord(char)]
        glyph = pen.glyph()
        glyph.recalcBounds(glyf)
        glyf[name] = glyph
        advance, bearing = font['hmtx'][cmap[ord(base)]]
        font['hmtx'][name] = (advance, bearing + glyph.xMin - original.xMin)
    font['name'].setName('Version 1.002; Turkish glyphs', 5, 3, 1, 0x409)
