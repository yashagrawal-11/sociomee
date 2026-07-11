"""
invoice_generator.py — GST Invoice PDF generator for SocioMee
Generates B2C GST invoices compliant with Indian GST rules.
"""
import io
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from pathlib import Path

# ── Constants ─────────────────────────────────────────────────────────
SELLER = {
    "name":    "Mee Group",
    "legal":   "Yash Ajit Patil (Proprietor)",
    "gstin":   "27IPNPP2774C1ZF",
    "address": "G-2, B-Wing, Raghunath Apartment, Gopal Nagar,\nChinchpada, Kalyan, Thane, Maharashtra - 421306",
    "email":   "support@sociomeeai.com",
    "website": "sociomeeai.com",
    "state":   "Maharashtra",
    "state_code": "27",
}

GST_RATE = 18  # percent
HSN_CODE = "998314"  # IT software services
INVOICE_DIR = Path("/var/www/sociomee/backend/invoices")
INVOICE_DIR.mkdir(exist_ok=True)

# Sequential invoice counter
COUNTER_FILE = INVOICE_DIR / "counter.txt"

def _next_invoice_number() -> str:
    if COUNTER_FILE.exists():
        n = int(COUNTER_FILE.read_text().strip()) + 1
    else:
        n = 1
    COUNTER_FILE.write_text(str(n))
    year = datetime.now().year
    month = datetime.now().month
    fy = f"{year}-{str(year+1)[2:]}" if month >= 4 else f"{year-1}-{str(year)[2:]}"
    return f"MEE/{fy}/{n:04d}"

def generate_invoice(
    customer_email: str,
    customer_name: str,
    plan_label: str,
    amount_with_gst: int,  # total amount in INR (GST inclusive)
    payment_id: str,
    order_id: str = "",
) -> tuple[bytes, str]:
    """
    Generate GST invoice PDF.
    Returns (pdf_bytes, invoice_number)
    """
    invoice_no = _next_invoice_number()
    invoice_date = datetime.now().strftime("%d %b %Y")

    # GST calculation (reverse from inclusive amount)
    base_amount = round(amount_with_gst * 100 / (100 + GST_RATE), 2)
    gst_amount = round(amount_with_gst - base_amount, 2)
    cgst = round(gst_amount / 2, 2)
    sgst = round(gst_amount / 2, 2)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15*mm,
        leftMargin=15*mm,
        topMargin=15*mm,
        bottomMargin=15*mm,
    )

    styles = getSampleStyleSheet()
    purple = colors.HexColor("#7c3aed")
    dark   = colors.HexColor("#0a0a0a")
    muted  = colors.HexColor("#666666")
    light  = colors.HexColor("#f5f5f5")

    title_style = ParagraphStyle("title", fontSize=22, fontName="Helvetica-Bold", textColor=purple, spaceAfter=2)
    sub_style   = ParagraphStyle("sub",   fontSize=9,  fontName="Helvetica",      textColor=muted)
    h2_style    = ParagraphStyle("h2",    fontSize=11, fontName="Helvetica-Bold", textColor=dark, spaceBefore=8, spaceAfter=4)
    body_style  = ParagraphStyle("body",  fontSize=9,  fontName="Helvetica",      textColor=dark, leading=14)
    right_style = ParagraphStyle("right", fontSize=9,  fontName="Helvetica",      textColor=dark, alignment=TA_RIGHT)
    bold_style  = ParagraphStyle("bold",  fontSize=10, fontName="Helvetica-Bold", textColor=dark)

    elems = []

    # ── Header ────────────────────────────────────────────────────────
    header_data = [[
        Paragraph(f"<b>SocioMee AI</b>", title_style),
        Paragraph(f"<b>TAX INVOICE</b>", ParagraphStyle("inv", fontSize=16, fontName="Helvetica-Bold", textColor=dark, alignment=TA_RIGHT)),
    ]]
    header_table = Table(header_data, colWidths=[90*mm, 90*mm])
    header_table.setStyle(TableStyle([("VALIGN", (0,0), (-1,-1), "MIDDLE")]))
    elems.append(header_table)
    elems.append(Spacer(1, 3*mm))
    elems.append(HRFlowable(width="100%", thickness=2, color=purple))
    elems.append(Spacer(1, 4*mm))

    # ── Seller + Invoice details ───────────────────────────────────────
    inv_details = [
        [Paragraph("<b>Invoice No:</b>",  body_style), Paragraph(invoice_no,     body_style)],
        [Paragraph("<b>Invoice Date:</b>", body_style), Paragraph(invoice_date,  body_style)],
        [Paragraph("<b>Payment ID:</b>",   body_style), Paragraph(payment_id,    body_style)],
    ]
    seller_block = [
        Paragraph("<b>Supplier Details</b>", h2_style),
        Paragraph(SELLER["name"],           bold_style),
        Paragraph(SELLER["legal"],          body_style),
        Paragraph(SELLER["address"].replace("\n","<br/>"), body_style),
        Paragraph(f"GSTIN: {SELLER['gstin']}", body_style),
        Paragraph(f"State: {SELLER['state']} ({SELLER['state_code']})", body_style),
        Paragraph(f"Email: {SELLER['email']}", body_style),
    ]

    inv_table = Table(
        [[seller_block, Table(inv_details, colWidths=[35*mm, 55*mm])]],
        colWidths=[95*mm, 90*mm]
    )
    inv_table.setStyle(TableStyle([("VALIGN", (0,0), (-1,-1), "TOP")]))
    elems.append(inv_table)
    elems.append(Spacer(1, 5*mm))
    elems.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#dddddd")))
    elems.append(Spacer(1, 4*mm))

    # ── Buyer ─────────────────────────────────────────────────────────
    elems.append(Paragraph("<b>Bill To</b>", h2_style))
    elems.append(Paragraph(customer_name or customer_email.split("@")[0].title(), bold_style))
    elems.append(Paragraph(customer_email, body_style))
    elems.append(Paragraph("Place of Supply: Maharashtra (27) — B2C Transaction", body_style))
    elems.append(Spacer(1, 5*mm))

    # ── Line items table ──────────────────────────────────────────────
    item_data = [
        ["#", "Description", "HSN/SAC", "Rate", "Qty", "Taxable Amt (₹)"],
        [
            "1",
            f"SocioMee AI\n{plan_label}\nSoftware as a Service (SaaS)",
            HSN_CODE,
            f"₹{base_amount:.2f}",
            "1",
            f"₹{base_amount:.2f}",
        ],
    ]
    item_table = Table(item_data, colWidths=[10*mm, 75*mm, 22*mm, 22*mm, 12*mm, 30*mm])
    item_table.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,0), purple),
        ("TEXTCOLOR",    (0,0), (-1,0), colors.white),
        ("FONTNAME",     (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",     (0,0), (-1,-1), 8.5),
        ("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white, light]),
        ("GRID",         (0,0), (-1,-1), 0.3, colors.HexColor("#dddddd")),
        ("VALIGN",       (0,0), (-1,-1), "MIDDLE"),
        ("TOPPADDING",   (0,0), (-1,-1), 5),
        ("BOTTOMPADDING",(0,0), (-1,-1), 5),
        ("LEFTPADDING",  (0,0), (-1,-1), 4),
    ]))
    elems.append(item_table)
    elems.append(Spacer(1, 4*mm))

    # ── Tax summary ───────────────────────────────────────────────────
    tax_data = [
        ["", "", "Taxable Amount:", f"₹{base_amount:.2f}"],
        ["", "", f"CGST @ {GST_RATE//2}%:", f"₹{cgst:.2f}"],
        ["", "", f"SGST @ {GST_RATE//2}%:", f"₹{sgst:.2f}"],
        ["", "", "Total GST:", f"₹{gst_amount:.2f}"],
        ["", "", "TOTAL AMOUNT:", f"₹{amount_with_gst:.2f}"],
    ]
    tax_table = Table(tax_data, colWidths=[60*mm, 45*mm, 45*mm, 30*mm])
    tax_table.setStyle(TableStyle([
        ("FONTSIZE",     (0,0), (-1,-1), 9),
        ("FONTNAME",     (0,4), (-1,4), "Helvetica-Bold"),
        ("BACKGROUND",   (0,4), (-1,4), light),
        ("TEXTCOLOR",    (2,4), (-1,4), purple),
        ("ALIGN",        (2,0), (-1,-1), "RIGHT"),
        ("TOPPADDING",   (0,0), (-1,-1), 3),
        ("BOTTOMPADDING",(0,0), (-1,-1), 3),
        ("LINEABOVE",    (2,4), (-1,4), 1, purple),
    ]))
    elems.append(tax_table)
    elems.append(Spacer(1, 6*mm))
    elems.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#dddddd")))
    elems.append(Spacer(1, 4*mm))

    # ── Footer ────────────────────────────────────────────────────────
    elems.append(Paragraph("This is a computer-generated invoice and does not require a physical signature.", sub_style))
    elems.append(Paragraph(f"For support: {SELLER['email']} | {SELLER['website']}", sub_style))
    elems.append(Spacer(1, 3*mm))
    elems.append(Paragraph(f"<b>Mee Group</b> | GSTIN: {SELLER['gstin']} | Registered under GST, Maharashtra", sub_style))

    doc.build(elems)
    pdf_bytes = buffer.getvalue()

    # Save to disk too
    safe_payment_id = payment_id.replace("/","_")
    (INVOICE_DIR / f"{invoice_no.replace('/','_')}_{safe_payment_id}.pdf").write_bytes(pdf_bytes)

    return pdf_bytes, invoice_no
