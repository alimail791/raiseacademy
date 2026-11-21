"""Builds the downloadable NEET formula sheet PDFs in public/downloads/ from
src/formulas/formulaData.ts (the same data as the web pages).

Run from frontend/ after changing the formulas:
  node --experimental-strip-types -e "import('./src/formulas/formulaData.ts').then(m=>require('fs').writeFileSync('/tmp/formulas.json',JSON.stringify({physics:m.PHYSICS,chemistry:m.CHEMISTRY})))"
  python3 scripts/formula-pdfs.py /tmp/formulas.json
Needs reportlab and the DejaVu Sans fonts (for subscripts, Greek letters, √ etc.).
"""
import json
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from xml.sax.saxutils import escape

FONT_DIR = "/usr/share/fonts/truetype/dejavu"
pdfmetrics.registerFont(TTFont("DV", f"{FONT_DIR}/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DVB", f"{FONT_DIR}/DejaVuSans-Bold.ttf"))

INK = colors.HexColor("#14213D")
GOLD = colors.HexColor("#F2A93B")
LINE = colors.HexColor("#D9DEE8")
MUTED = colors.HexColor("#5B6478")

title_s = ParagraphStyle("t", fontName="DVB", fontSize=20, leading=24, textColor=INK)
sub_s = ParagraphStyle("s", fontName="DV", fontSize=9.5, leading=13, textColor=MUTED)
ch_s = ParagraphStyle("c", fontName="DVB", fontSize=12.5, leading=16, textColor=INK, spaceBefore=4)
what_s = ParagraphStyle("w", fontName="DVB", fontSize=8.6, leading=11, textColor=INK, alignment=TA_LEFT)
f_s = ParagraphStyle("f", fontName="DV", fontSize=8.8, leading=11.5, textColor=colors.black)
note_s = ParagraphStyle("n", fontName="DV", fontSize=7.6, leading=10, textColor=MUTED)


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(GOLD)
    canvas.rect(0, A4[1] - 6, A4[0], 6, fill=1, stroke=0)
    canvas.setFont("DV", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(15 * mm, 9 * mm, "YNeet · Free NEET practice, PYQs and mock tests · www.yneet.in")
    canvas.drawRightString(A4[0] - 15 * mm, 9 * mm, f"Page {doc.page}")
    canvas.restoreState()


def build(sheet, out):
    doc = SimpleDocTemplate(str(out), pagesize=A4, leftMargin=15 * mm, rightMargin=15 * mm, topMargin=14 * mm, bottomMargin=16 * mm,
                            title=f"{sheet['title']} | YNeet", author="YNeet (www.yneet.in)")
    story = [
        Paragraph(escape(f"{sheet['title']} — Chapter-wise for NEET 2027"), title_s),
        Spacer(0, 3),
        Paragraph(escape(f"Class 11 & 12 · NEET (UG) syllabus · Practise each chapter's previous year questions free at www.yneet.in{sheet['path']}"), sub_s),
        Spacer(0, 8),
    ]
    width = A4[0] - 30 * mm
    for i, ch in enumerate(sheet["chapters"], 1):
        rows = []
        for r in ch["rows"]:
            cell = [Paragraph(escape(r[1]), f_s)]
            if len(r) > 2 and r[2]:
                cell.append(Paragraph(escape(r[2]), note_s))
            rows.append([Paragraph(escape(r[0]), what_s), cell])
        t = Table(rows, colWidths=[width * 0.32, width * 0.68])
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LINEBELOW", (0, 0), (-1, -2), 0.4, LINE),
            ("BOX", (0, 0), (-1, -1), 0.6, LINE),
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F7F8FB")),
            ("TOPPADDING", (0, 0), (-1, -1), 3.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ]))
        head = Paragraph(escape(f"{i}. {ch['name']}  ") + f"<font name='DV' size='8' color='#5B6478'>Class {ch['cls']}</font>", ch_s)
        story.append(KeepTogether([head, Spacer(0, 3), t]) if len(rows) <= 14 else head)
        if len(rows) > 14:
            story += [Spacer(0, 3), t]
        story.append(Spacer(0, 8))
    story += [
        Spacer(0, 4),
        Paragraph("Formulas stick when you use them: take timed chapter tests and full NEET mocks with a mistake notebook on YNeet — 30 days free at www.yneet.in", sub_s),
    ]
    doc.build(story, onFirstPage=footer, onLaterPages=footer)


if __name__ == "__main__":
    data = json.loads(Path(sys.argv[1]).read_text())
    outdir = Path(__file__).resolve().parent.parent / "public" / "downloads"
    outdir.mkdir(parents=True, exist_ok=True)
    for key in ("physics", "chemistry"):
        out = outdir / f"yneet-neet-{key}-formula-sheet.pdf"
        build(data[key], out)
        print("wrote", out)
