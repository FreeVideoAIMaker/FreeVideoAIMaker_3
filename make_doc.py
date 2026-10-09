import os

def create_styled_html():
    print("=========================================")
    print("   مُولد المستندات والاختبارات الاحترافي   ")
    print("=========================================")
    
    title = input("أدخل العنوان الرئيسي (مثل: GOETHE-ZERTIFIKAT B1): ")
    subtitle = input("أدخل العنوان الفرعي (مثل: MODUL: LESEN): ")
    time_limit = input("أدخل الوقت (مثل: Prüfungszeit: 65 Minuten): ")
    
    print("\n--- إعداد صندوق التعليمات ---")
    part_title = input("اسم الجزء (مثل: TEIL 1): ")
    part_time = input("وقت الجزء (مثل: Arbeitszeit: 10 Minuten): ")
    instructions = input("التعليمات (مثل: Lesen Sie den Text...): ")
    
    print("\n--- نص الموضوع ---")
    text_title = input("عنوان النص (مثل: Text: Mein Leben im Homeoffice): ")
    text_author = input("الكاتب/معلومات إضافية: ")
    print("أدخل نص الموضوع (اضغط Enter مرتين لإنهاء الكتابة):")
    paragraphs = []
    while True:
        line = input()
        if line == "":
            break
        paragraphs.append(line)
        
    print("\n--- الأسئلة (اختياري) ---")
    questions = []
    q_num = 1
    while True:
        q_text = input(f"أدخل السؤال رقم {q_num} (أو اضغط Enter للتجاوز): ")
        if not q_text:
            break
        questions.append(q_text)
        q_num += 1

    # بناء كود HTML المنسق بـ CSS يشابه الصورة تماماً
    html_content = f"""<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 40px auto;
            max-width: 800px;
            padding: 20px;
            background-color: #fff;
        }}
        .header {{
            text-align: center;
            margin-bottom: 30px;
        }}
        .header h1 {{
            font-size: 22px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }}
        .header h2 {{
            font-size: 16px;
            font-weight: normal;
            margin-top: 0;
        }}
        .time-limit {{
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 20px;
        }}
        .instruction-box {{
            border: 1px solid #000;
            padding: 15px;
            margin-bottom: 30px;
            font-size: 14px;
        }}
        .instruction-box h3 {{
            margin-top: 0;
            font-size: 16px;
            text-transform: uppercase;
        }}
        .text-section {{
            margin-bottom: 30px;
        }}
        .text-title {{
            font-weight: bold;
            font-size: 15px;
            margin-bottom: 5px;
        }}
        .text-author {{
            font-size: 13px;
            color: #555;
            margin-bottom: 15px;
        }}
        .content-p {{
            text-align: justify;
            text-indent: 0px;
            margin-bottom: 15px;
            font-size: 14px;
        }}
        .questions-section {{
            margin-top: 30px;
            border-top: 1px solid #ccc;
            padding-top: 20px;
        }}
        .question-item {{
            margin-bottom: 20px;
            font-size: 14px;
        }}
        .options {{
            margin-top: 8px;
            padding-left: 10px;
        }}
        .checkbox-item {{
            margin-bottom: 5px;
        }}
    </style>
</head>
<body>

    <div class="header">
        <h1>{title}</h1>
        <h2>{subtitle}</h2>
    </div>

    <div class="time-limit">{time_limit}</div>

    <div class="instruction-box">
        <h3>{part_title}</h3>
        <p><strong>{part_time}</strong></p>
        <p><strong>Anweisung:</strong><br>{instructions}</p>
    </div>

    <div class="text-section">
        <div class="text-title">{text_title}</div>
        <div class="text-author">{text_author}</div>
        {"".join([f'<p class="content-p">{p}</p>' for p in paragraphs])}
    </div>

    {f'<div class="questions-section"><h4>Aufgaben</h4>' if questions else ''}
    {"".join([f'<div class="question-item">{i+1}. {q}<div class="options"><div class="checkbox-item">[ ] Richtig</div><div class="checkbox-item">[ ] Falsch</div></div></div>' for i, q in enumerate(questions)])}
    {f'</div>' if questions else ''}

</body>
</html>
"""

    output_filename = "formatted_document.html"
    with open(output_filename, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    print(f"\n✨ تم الحفاظ على التنسيق بنجاح! الملف جاهز باسم: {output_filename}")
    print("يمكنك نقله لذاكرة الهاتف وفتحه عبر المتصفح لطباعته كـ PDF.")

if __name__ == "__main__":
    create_styled_html()

