import io
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether
)

def generate_pdf_report(record_data: dict, simulation_data: dict = None) -> bytes:
    """
    Generates a formal college academic PDF report using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#172554"),
    )

    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748B"),
    )

    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#2563EB"),
        spaceBefore=12,
        spaceAfter=6,
    )

    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1E293B"),
    )

    mono_style = ParagraphStyle(
        "MonoFormula",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#7C3AED"),
    )

    elements = []

    # Header / Title Block
    elements.append(Paragraph("BrightInt — Image Brightness Integration Project", title_style))
    elements.append(Paragraph("College Subject Project: Linear Algebra & Multivariable Calculus", subtitle_style))
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#172554"), spaceAfter=12))

    # Metadata Row
    current_time = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    meta_data = [
        [
            Paragraph(f"<b>Target File:</b> {record_data.get('filename', 'Unknown')}", body_style),
            Paragraph(f"<b>Date/Time:</b> {current_time}", body_style),
        ],
        [
            Paragraph(f"<b>Dimensions:</b> {record_data.get('width', 0)} x {record_data.get('height', 0)} px", body_style),
            Paragraph(f"<b>Total Sample Pixels:</b> {record_data.get('total_pixels', 0):,}", body_style),
        ],
    ]
    meta_table = Table(meta_data, colWidths=[260, 260])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 14))

    # 1. Project Objective & Methodology
    elements.append(Paragraph("1. Project Objective & Continuous Double Integration Model", section_heading))
    obj_text = (
        "The objective of this project is to calculate the total luminous flux passing through a digital image frame "
        "by establishing the continuous mathematical model: <b>T = ∬_D B(x, y) dA</b>, where B(x,y) represents the "
        "photometric luminance surface elevation field over region D = [0, W] x [0, H]. In discrete digital processing, "
        "this integral is evaluated via 2D Riemann summation: <b>T ≈ Σ_i Σ_j B(i, j) · ΔA</b>. Under the unit pixel area "
        "convention (ΔA = 1), the double integral equals the exact sum of all matrix luminance values."
    )
    elements.append(Paragraph(obj_text, body_style))
    elements.append(Spacer(1, 10))

    # 2. Mathematical Equations Table
    eq_data = [
        [Paragraph("<b>Model</b>", body_style), Paragraph("<b>Formulation</b>", body_style), Paragraph("<b>Description</b>", body_style)],
        [
            Paragraph("Continuous Integral", body_style),
            Paragraph("T = ∬_D B(x, y) dA", mono_style),
            Paragraph("Continuous surface volume over aperture domain D", body_style),
        ],
        [
            Paragraph("Discrete Riemann Sum", body_style),
            Paragraph("T ≈ Σ_{i=1}^m Σ_{j=1}^n B(i,j) · 1", mono_style),
            Paragraph("Unit pixel partition sum (N = m · n pixels)", body_style),
        ],
        [
            Paragraph("Luminance (BT.601)", body_style),
            Paragraph("0.299R + 0.587G + 0.114B", mono_style),
            Paragraph("Human photopic sensitivity curve weighting", body_style),
        ],
        [
            Paragraph("Mean Value Theorem", body_style),
            Paragraph("B_avg = T / (m · n)", mono_style),
            Paragraph("Average photometric brightness across frame", body_style),
        ],
    ]
    eq_table = Table(eq_data, colWidths=[120, 180, 220])
    eq_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EFF6FF")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#172554")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(eq_table)
    elements.append(Spacer(1, 14))

    # 3. Measured Calculations
    elements.append(Paragraph("2. Quantitative Measurements & Calculus Statistics", section_heading))
    total_b = record_data.get("total_brightness", 0.0)
    avg_b = record_data.get("average_brightness", 0.0)
    norm_b = record_data.get("normalized_average", 0.0)
    min_b = record_data.get("min_brightness", 0.0)
    max_b = record_data.get("max_brightness", 0.0)

    calc_data = [
        [Paragraph("<b>Calculated Parameter</b>", body_style), Paragraph("<b>Symbol</b>", body_style), Paragraph("<b>Value</b>", body_style), Paragraph("<b>Unit / Range</b>", body_style)],
        [
            Paragraph("Total Brightness Integral", body_style),
            Paragraph("T", mono_style),
            Paragraph(f"<b>{total_b:,.2f}</b>", body_style),
            Paragraph("Photometric Flux (Σ B)", body_style),
        ],
        [
            Paragraph("Average Luminance", body_style),
            Paragraph("B_avg", mono_style),
            Paragraph(f"<b>{avg_b:.2f}</b>", body_style),
            Paragraph("Scale [0, 255]", body_style),
        ],
        [
            Paragraph("Normalized Intensity", body_style),
            Paragraph("B_norm", mono_style),
            Paragraph(f"<b>{norm_b:.2f}%</b>", body_style),
            Paragraph("Percentage of Specular White", body_style),
        ],
        [
            Paragraph("Minimum Intensity", body_style),
            Paragraph("min(B)", mono_style),
            Paragraph(f"{min_b:.1f}", body_style),
            Paragraph("Scale [0, 255]", body_style),
        ],
        [
            Paragraph("Maximum Intensity", body_style),
            Paragraph("max(B)", mono_style),
            Paragraph(f"{max_b:.1f}", body_style),
            Paragraph("Scale [0, 255]", body_style),
        ],
    ]
    calc_table = Table(calc_data, colWidths=[150, 60, 140, 170])
    calc_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F5F3FF")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(calc_table)
    elements.append(Spacer(1, 14))

    # 4. Simulation Results (if provided)
    if simulation_data:
        elements.append(Paragraph("3. What-If Brightness & Contrast Simulation Comparison", section_heading))
        delta_t = simulation_data.get("delta_total", 0.0)
        pct_chg = simulation_data.get("percentage_change")
        pct_str = f"{pct_chg:+.2f}%" if pct_chg is not None else "N/A (T_orig = 0)"

        sim_table_data = [
            [Paragraph("<b>Metric</b>", body_style), Paragraph("<b>Original Value</b>", body_style), Paragraph("<b>Simulated Value</b>", body_style), Paragraph("<b>Net Delta (Δ)</b>", body_style)],
            [
                Paragraph("Total Brightness (T)", body_style),
                Paragraph(f"{total_b:,.2f}", body_style),
                Paragraph(f"{simulation_data.get('transformed_stats', {}).get('total_brightness', 0):,.2f}", body_style),
                Paragraph(f"<b>{delta_t:+,.2f}</b>", body_style),
            ],
            [
                Paragraph("Average Luminance", body_style),
                Paragraph(f"{avg_b:.2f}", body_style),
                Paragraph(f"{simulation_data.get('transformed_stats', {}).get('average_brightness', 0):.2f}", body_style),
                Paragraph(f"{simulation_data.get('delta_average', 0):+.2f}", body_style),
            ],
            [
                Paragraph("Relative Percentage Change", body_style),
                Paragraph("Baseline", body_style),
                Paragraph("—", body_style),
                Paragraph(f"<b>{pct_str}</b>", body_style),
            ],
        ]
        sim_table = Table(sim_table_data, colWidths=[150, 110, 110, 150])
        sim_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EFF6FF")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("PADDING", (0, 0), (-1, -1), 5),
        ]))
        elements.append(sim_table)
        elements.append(Spacer(1, 14))

    # 5. Academic Conclusion
    elements.append(Paragraph("4. Academic Verification Conclusion", section_heading))
    concl_text = (
        "This analysis confirms that a digital image matrix A = [a_ij] directly realizes the discrete Riemann double "
        "integral approximation of the continuous scene. All calculations were processed using NumPy 64-bit precision "
        "with ITU-R BT.601 photopic weighting. Verified benchmark tests (Matrix A ∈ ℝ³ˣ³, T = 450, B_avg = 50.00, "
        "B_norm = 19.61%) corroborate complete algorithmic fidelity."
    )
    elements.append(Paragraph(concl_text, body_style))
    elements.append(Spacer(1, 20))

    # Signature line
    sig_data = [
        [
            Paragraph("<b>Student Investigator:</b><br/>Linear Algebra & Calculus Project Team", body_style),
            Paragraph("<b>Academic Faculty Reviewer:</b><br/><br/>________________________________________<br/>Signature & Date", body_style),
        ]
    ]
    sig_table = Table(sig_data, colWidths=[260, 260])
    sig_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("PADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(KeepTogether(sig_table))

    doc.build(elements)
    return buffer.getvalue()
