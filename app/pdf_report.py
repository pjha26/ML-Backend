"""
PDF Report Generator — creates downloadable session reports.
Uses reportlab for PDF generation.
"""
import io
import datetime

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, mm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    )
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


def generate_session_pdf(session_data: dict) -> bytes | None:
    """
    Generate a PDF report for a concentration session.
    Returns PDF bytes or None if reportlab is unavailable.
    """
    if not REPORTLAB_AVAILABLE:
        return None

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=30 * mm,
        leftMargin=30 * mm,
        topMargin=25 * mm,
        bottomMargin=25 * mm,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=24,
        spaceAfter=6,
        textColor=colors.HexColor('#1e293b'),
    )
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=20,
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=8,
        spaceBefore=16,
    )
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#374151'),
        spaceAfter=6,
        leading=16,
    )

    elements = []

    # Header
    elements.append(Paragraph('ConcentraAI — Session Report', title_style))

    timestamp = session_data.get('timestamp', 0)
    if timestamp:
        date_str = datetime.datetime.fromtimestamp(
            timestamp / 1000
        ).strftime('%B %d, %Y at %I:%M %p')
    else:
        date_str = datetime.datetime.now().strftime('%B %d, %Y at %I:%M %p')
    elements.append(Paragraph(f'Session Date: {date_str}', subtitle_style))

    elements.append(HRFlowable(
        width="100%", thickness=1,
        color=colors.HexColor('#e2e8f0'),
        spaceAfter=16
    ))

    # Summary Section
    elements.append(Paragraph('📊 Session Summary', heading_style))

    duration = session_data.get('duration', 0)
    minutes = int(duration // 60)
    seconds = int(duration % 60)
    avg_conc = session_data.get('avgConcentration', 0)
    focus_rate = session_data.get('focusRate', 0)
    samples = session_data.get('samples', 0)
    blinks = session_data.get('blinkCount', 0)

    summary_data = [
        ['Metric', 'Value'],
        ['Duration', f'{minutes}m {seconds}s'],
        ['Average Concentration', f'{avg_conc:.1f}%'],
        ['Focus Rate', f'{focus_rate:.1f}%'],
        ['Total Samples', str(samples)],
        ['Blink Count', str(blinks)],
    ]

    # Score assessment
    if avg_conc >= 70:
        assessment = '✅ Excellent Focus'
        assessment_color = colors.HexColor('#16a34a')
    elif avg_conc >= 50:
        assessment = '🟡 Good Focus'
        assessment_color = colors.HexColor('#ca8a04')
    elif avg_conc >= 30:
        assessment = '🟠 Needs Improvement'
        assessment_color = colors.HexColor('#ea580c')
    else:
        assessment = '🔴 Poor Focus'
        assessment_color = colors.HexColor('#dc2626')

    summary_data.append(['Overall Assessment', assessment])

    table = Table(summary_data, colWidths=[3 * inch, 3 * inch])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#475569')),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fafafa')]),
        ('TEXTCOLOR', (-1, -1), (-1, -1), assessment_color),
        ('FONTNAME', (-1, -1), (-1, -1), 'Helvetica-Bold'),
    ]))
    elements.append(table)

    # State Distribution
    state_dist = session_data.get('stateDistribution', {})
    if state_dist:
        elements.append(Spacer(1, 12))
        elements.append(Paragraph('📈 State Distribution', heading_style))

        state_data = [['State', 'Percentage']]
        for state, pct in sorted(state_dist.items(), key=lambda x: -x[1]):
            state_data.append([state, f'{pct:.1f}%'])

        state_table = Table(state_data, colWidths=[3 * inch, 3 * inch])
        state_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#475569')),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fafafa')]),
        ]))
        elements.append(state_table)

    # AI Insight
    ai_insight = session_data.get('aiInsight')
    if ai_insight:
        elements.append(Spacer(1, 12))
        elements.append(Paragraph('🤖 AI Study Recommendations', heading_style))
        for line in ai_insight.split('\n'):
            if line.strip():
                elements.append(Paragraph(line.strip(), body_style))

    # Footer
    elements.append(Spacer(1, 30))
    elements.append(HRFlowable(
        width="100%", thickness=1,
        color=colors.HexColor('#e2e8f0'),
        spaceAfter=8
    ))
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#94a3b8'),
        alignment=TA_CENTER,
    )
    elements.append(Paragraph(
        'Generated by ConcentraAI — AI-Powered Concentration Detection',
        footer_style
    ))

    doc.build(elements)
    return buffer.getvalue()
