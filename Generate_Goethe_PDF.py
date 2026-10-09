import os
import re
from pypdf import PdfReader
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

pdf_source = "Goethe_B1.pdf"
pdf_output = "Clean_Goethe_B1_Book.pdf"

if not os.path.exists(pdf_source):
    print("❌ خطأ: يرجى التأكد من وجود ملف Goethe_B1.pdf في نفس المجلد!")
    exit()

print("📖 جاري استخراج النص وتصفيته ذكياً وتوليد كتاب PDF رسمي ومنسق...")

reader = PdfReader(pdf_source)
full_text = ""
for page in reader.pages:
    text = page.extract_text()
    if text:
        full_text += text + "\n"

# المصافي المعتمدة لتطهير النص من تعليقات ومسودات الذكاء الاصطناعي
AI_TRASH_PATTERNS = [
    r"كما اتفقنا.*؟إليك", r"لقد قمت بصياغة.*؟االمتحان", r"لقد صغت هذا النص.*؟للممتحنين",
    r"صممت هذا النص.*؟الطبيعي", r"صيغ هذا النص بأسلوب.*؟المكثفة", r"صيغ هذا النص بأسلوب سلس.*؟معايير",
    r"صغت هذا النص ليكون واقعياً.*؟للممتحنين", r"نتابع على نفس النهج.*؟اتفقنا", r"نستمر بتطبيق نفس الهيكل.*؟هذا القسم",
    r"نتابع بنفس الدقة والمنهجية.*؟هذا القسم", r"نتابع بثبات على نفس الهيكل.*؟القسم الثاني", r"نواصل بنفس المنهجية.*؟هذا الموضوع",
    r"نستمر بخطواتنا الثابتة.*؟لهذا الموضوع", r"نستمر بتقديم القالب الشامل.*؟معايير", r"هذا النص يستثمر مجدداً.*؟وسهلة التذكر",
    r"هذا النص مصاغ ليعكس موقفك.*؟في االمتحان", r"هذا النص مصمم ليبرز قدرتك.*؟دقيقة", r"هذا النص مصاغ بدقة ليطابق.*؟المفردات",
    r"هذا الموضوع يتيح لك إظهار.*؟الجاهزية التامة", r"هذا الموضوع يتيح لك استخدام.*؟وأعلى العالمات",
    r"إليك التفاصيل الشاملة لهذا الموضوع لتغطية جميع متطلبات االمتحان", r"إليك التفاصيل الشاملة لهذا الموضوع",
    r"إليك التفاصيل", r"نحن مستمرون في طريقنا.*؟لهذا الموضوع", r"نحن مستمرون كما اتفقنا.*؟والبيئة",
    r"فكرة بفكرة.*؟الثاني", r"قيلولة الظهيرة.*؟تنظيم الوقت", r"الكمبيوتر وفرص العمل.*؟سوق العمل الحالي",
    r"الكتب اإللكترونية.*؟المهمة جداً", r"التسوق عبر اإلنترنت.*؟الشاملة لهذا الموضوع", r"مركز التسوق.*؟الشاملة لهذا الموضوع",
    r"موضوع نقاشي ممتع يتكرر دائماً", r"هو موضوع دافئ وإنساني جدا.*؟العالقات األسرية"
]

doc = SimpleDocTemplate(pdf_output, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
styles = getSampleStyleSheet()

# بناء الخطوط والأنماط البصرية الجمالية الرسمية لمعهد جوته
title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], fontSize=24, textColor=colors.HexColor('#005A3F'), alignment=1, spaceAfter=15)
topic_style = ParagraphStyle('TopicStyle', parent=styles['Heading2'], fontSize=16, textColor=colors.HexColor('#ffffff'), backColor=colors.HexColor('#005A3F'), borderPadding=10, spaceBefore=20, spaceAfter=15)
sub_style = ParagraphStyle('SubStyle', parent=styles['Heading3'], fontSize=13, textColor=colors.HexColor('#005A3F'), spaceBefore=12, spaceAfter=6)
text_ar_style = ParagraphStyle('TextArStyle', parent=styles['Normal'], fontSize=11, textColor=colors.HexColor('#2c3e50'), leading=16, alignment=2, spaceAfter=8)
text_de_style = ParagraphStyle('TextDeStyle', parent=styles['Normal'], fontSize=11, textColor=colors.HexColor('#1a202c'), leading=16, alignment=0, spaceAfter=10)

story = []

# ترويسة الكتاب الرئيسية الفخمة
story.append(Paragraph("<b>GOETHE-ZERTIFIKAT B1</b>", title_style))
story.append(Paragraph("<font color='#555555'>الدليل الشامل المنسق والمنقح تلقائياً - Sprechen Teil 2</font>", ParagraphStyle('Sub', alignment=1, fontSize=12)))
story.append(Spacer(1, 20))

topics_split = re.split(r'(:\s*[a-zA-Z\s\-–]+)', full_text)
current_topic = ""

for part in topics_split:
    part_stripped = part.strip()
    if not part_stripped:
        continue
    
    if part_stripped.startswith(':') and len(part_stripped) < 60:
        current_topic = part_stripped.replace(':', '').strip()
        story.append(Paragraph(f"<b>الموضوع: {current_topic}</b>", topic_style))
    else:
        lines = part_stripped.split('\n')
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
            
            is_ai_trash = False
            for pattern in AI_TRASH_PATTERNS:
                if re.search(pattern, line_str):
                    is_ai_trash = True
                    break
            if is_ai_trash:
                continue
            
            # فرز العناوين الداخلية وتغميقها
            if re.match(r'^(\d+\.|\u25cf)', line_str) or "النقاط الفرعية" in line_str or "القالب" in line_str or "مثال" in line_str or "نصيحة إضافية" in line_str:
                story.append(Paragraph(f"<b>{line_str}</b>", sub_style))
            # فرز النصوص الألمانية المستقلة لوضعها داخل صناديق حماية بصرياً (Tables) لمنع الانهيار والبعثرة
            elif re.search(r'[a-zA-Z]{3,}', line_str) and not any(ar_char in line_str for ar_char in ['أ','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','ه','و','ي']):
                p = Paragraph(line_str, text_de_style)
                t = Table([[p]], colWidths=[500])
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
                    ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
                    ('LINELEFT', (0,0), (0,-1), 5, colors.HexColor('#005A3F')),
                    ('PADDING', (0,0), (-1,-1), 10),
                ]))
                story.append(t)
                story.append(Spacer(1, 5))
            else:
                # صب المتن العربي العريض بشكل انسيابي سليم
                story.append(Paragraph(line_str, text_ar_style))

doc.build(story)
print("🎉 مبارك! تم إنهاء المسخرة البصرية وتوليد ملف PDF احترافي 100%!")
print("📁 اسم الملف الجديد المستقر: Clean_Goethe_B1_Book.pdf")

