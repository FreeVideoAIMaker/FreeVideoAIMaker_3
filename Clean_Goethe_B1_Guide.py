import os
import re
from pypdf import PdfReader

# حدد اسم ملف الـ PDF الخاص بك هنا
pdf_filename = "Goethe_B1.pdf" 

if not os.path.exists(pdf_filename):
    print("❌ خطأ: يرجى التأكد من وجود ملف Goethe_B1.pdf في نفس المجلد!")
    exit()

print("📖 جاري معالجة وفصل النصوص بدقة فائقة وتوليد التصميم الاحترافي المستقر...")

reader = PdfReader(pdf_filename)
full_text = ""
for page in reader.pages:
    text = page.extract_text()
    if text:
        full_text += text + "\n"

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

topics_split = re.split(r'(:\s*[a-zA-Z\s\-–]+)', full_text)
formatted_html_body = ""
current_topic = "دليل امتحان المحادثة Goethe B1"
topic_content = ""

for part in topics_split:
    part_stripped = part.strip()
    if not part_stripped:
        continue
    
    if part_stripped.startswith(':') and len(part_stripped) < 60:
        if topic_content.strip():
            formatted_html_body += f"""
            <div class="topic-section">
                <div class="topic-title">{current_topic}</div>
                <div class="topic-content">{topic_content}</div>
            </div>
            """
        current_topic = part_stripped.replace(':', '').strip()
        topic_content = ""
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
                
            if re.match(r'^(\d+\.|\u25cf)', line_str) or "النقاط الفرعية" in line_str or "القالب" in line_str or "مثال" in line_str or "نصيحة إضافية" in line_str:
                topic_content += f'<div class="sub-title">{line_str}</div>\n'
            # فحص ذكي: إذا كان السطر يحتوي على كلمات ألمانية صرفة وبدون أي حرف عربي
            elif re.search(r'[a-zA-Z]{3,}', line_str) and not any(ar_char in line_str for ar_char in ['أ','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','ه','و','ي']):
                topic_content += f'<div class="german-box">{line_str}</div>\n'
            else:
                # النصوص العربية أو المختلطة تعرض بشكل مستقر وعريض يمنع الانهيار العمودي
                topic_content += f'<div class="normal-text">{line_str}</div>\n'

if topic_content.strip():
    formatted_html_body += f"""
    <div class="topic-section">
        <div class="topic-title">{current_topic}</div>
        <div class="topic-content">{topic_content}</div>
    </div>
    """

html_template = f"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Goethe-Zertifikat B1 Guide</title>
    <style>
        * {{
            box-sizing: border-box;
        }}
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f2f6f5;
            color: #2c3e50;
            margin: 0;
            padding: 15px;
            line-height: 1.8;
        }}
        .main-container {{
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 4px 25px rgba(0,0,0,0.04);
            padding: 25px;
            border-top: 12px solid #005A3F;
        }}
        .app-header {{
            text-align: center;
            border-bottom: 2px solid #005A3F;
            padding-bottom: 15px;
            margin-bottom: 30px;
        }}
        .app-header h1 {{
            color: #005A3F;
            font-size: 26px;
            margin: 0 0 5px 0;
            font-weight: 800;
        }}
        .app-header p {{
            color: #555;
            font-size: 14px;
            margin: 0;
        }}
        .topic-section {{
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            margin-bottom: 35px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.015);
            overflow: hidden;
            width: 100%;
        }}
        .topic-title {{
            background: linear-gradient(135deg, #005A3F, #00402c);
            color: #ffffff;
            padding: 14px 20px;
            font-size: 19px;
            font-weight: bold;
        }}
        .topic-content {{
            padding: 22px;
            width: 100%;
            display: flex;
            flex-direction: column;
        }}
        .sub-title {{
            font-size: 16px;
            font-weight: bold;
            color: #005A3F;
            background: #f0f7f4;
            padding: 10px 14px;
            border-right: 5px solid #005A3F;
            margin: 20px 0 15px 0;
            border-radius: 0 6px 6px 0;
            width: 100%;
            display: block;
        }}
        .normal-text {{
            font-size: 15px;
            margin-bottom: 12px;
            text-align: right;
            color: #34495e;
            width: 100%;
            display: block;
            white-space: normal;
            word-wrap: break-word;
        }}
        /* صندوق التنسيق الألماني المنفصل والآمن تماماً */
        .german-box {{
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-left: 5px solid #005A3F;
            padding: 14px;
            margin: 12px 0;
            border-radius: 6px;
            font-size: 15px;
            color: #1a202c;
            direction: ltr;
            text-align: left;
            width: 100%;
            display: block;
            white-space: normal;
            word-wrap: break-word;
        }}
    </style>
</head>
<body>
<div class="main-container">
    <div class="app-header">
        <h1>GOETHE-ZERTIFIKAT B1</h1>
        <p>الدليل الشامل المنسق والمنقح تلقائياً - Sprechen Teil 2</p>
    </div>
    {formatted_html_body}
</div>
</body>
</html>
"""

with open("Clean_Goethe_B1_Guide.html", "w", encoding="utf-8") as f:
    f.write(html_template)

print("🎉 تم تعديل التنسيق الجمالي بالكامل وحل مشكلة النصوص العمودية!")
