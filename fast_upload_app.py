import http.server
import socketserver
import re

PORT = 8080

HTML_PAGE = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>المُعالج والمُنسق الفاخر للمستندات</title>
    <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; padding: 20px; background: #f0f4f8; color: #333; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { max-width: 650px; width: 100%; background: white; padding: 35px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e1e8ed; }
        h2 { color: #1a73e8; text-align: center; font-size: 24px; margin-bottom: 25px; font-weight: 700; }
        input[type="file"], select { width: 100%; padding: 14px; margin: 12px 0; border: 1px solid #cbd5e1; border-radius: 8px; box-sizing: border-box; background: #f8fafc; font-size: 15px; }
        button { width: 100%; background: linear-gradient(135deg, #1a73e8, #0d47a1); color: white; border: none; padding: 15px; font-size: 16px; font-weight: bold; border-radius: 8px; cursor: pointer; margin-top: 15px; box-shadow: 0 4px 12px rgba(26,115,232,0.3); }
        label { font-weight: 600; color: #475569; display: block; margin-top: 15px; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>🧠 مُنسق ومُطهر ملفات الذكاء الاصطناعي الفاخر</h2>
        <form action="/format" method="POST" enctype="multipart/form-data">
            <label>1. ارفع ملف المحادثة المنسوخ (.txt):</label>
            <input type="file" name="text_file" accept=".txt" required>
            <label>2. اختر الثيم الفاخر ونوع التنسيق الهندسي:</label>
            <select name="theme">
                <option value="explanation">💡 ثيم الشرح والملاحظات والأمثلة الملونة</option>
                <option value="modern_exam">📝 ثيم الامتحانات والشهادات الحديث (Goethe)</option>
                <option value="dark_premium">✨ ثيم التميز المظلم الفاخر (Premium Dark)</option>
            </select>
            <button type="submit">⚡ تطهير وتنسيق الملف بضغطة زر</button>
        </form>
    </div>
</body>
</html>"""

def is_arabic(text):
    arabic_characters = re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+')
    return bool(arabic_characters.search(text))

def clean_ai_garbage(text):
    text = re.sub(r'\[.*?\]', '', text)
    garbage_patterns = [
        r"(بالتأكيد! إليك.*?:|بالتأكيد، تفضل:|إليك التنسيق المطلق:|بالتأكيد، سأساعدك في ذلك:|بالتأكيد! تفضل التنسيق:)",
        r"(أتمنى أن يكون هذا الشرح مفيداً|في حال وجود أي استفسار آخر لا تتردد|بالتوفيق في دراستك|دمتم بخير)"
    ]
    for pattern in garbage_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    return text.strip()

class SmartFormatterHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(HTML_PAGE.encode('utf-8'))

    def do_POST(self):
        if self.path == "/format":
            content_type = self.headers.get('Content-Type')
            content_length = int(self.headers.get('Content-Length', 0))
            raw_body = self.rfile.read(content_length)
            
            theme = "explanation"
            if b'name="theme"' in raw_body:
                try:
                    theme = raw_body.split(b'name="theme"\r\n\r\n')[1].split(b'\r\n')[0].decode('utf-8').strip()
                except: pass

            try:
                boundary = b'--' + content_type.split('boundary=')[1].encode()
                parts = raw_body.split(boundary)
                raw_text = ""
                for part in parts:
                    if b'name="text_file"' in part:
                        raw_text = part.split(b'\r\n\r\n')[1].rsplit(b'\r\n', 1)[0].decode('utf-8', errors='ignore')
            except:
                raw_text = "خطأ في قراءة ملف المحادثة."

            lines = raw_text.split('\n')
            html_elements = []
            
            theme_styles = {
                "explanation": "background: #f4f7f6; font-family: 'Segoe UI', system-ui; padding: 40px;",
                "modern_exam": "background: #fafafa; font-family: Arial, sans-serif; padding: 35px;",
                "dark_premium": "background: #0f172a; font-family: 'Segoe UI', sans-serif; padding: 40px;"
            }
            card_styles = {
                "explanation": "background: #ffffff; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.04); border-right: 5px solid #10b981; padding: 18px; margin: 14px 0;",
                "modern_exam": "background: #ffffff; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; border-left: 4px solid #0f172a; padding: 18px; margin: 14px 0;",
                "dark_premium": "background: #1e293b; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); border: 1px solid #334155; color: #f8fafc; padding: 18px; margin: 14px 0;"
            }

            for line in lines:
                clean_line = clean_ai_garbage(line)
                if not clean_line or len(clean_line) < 2: continue
                
                dir_css = "direction: rtl; text-align: right;" if is_arabic(clean_line) else "direction: ltr; text-align: left;"
                current_card = card_styles.get(theme, card_styles['explanation'])
                
                if any(k in clean_line.lower() for k in ["hinweis", "mensch", "ملاحظة", "تنبيه", "شرح"]):
                    s = "background: #fff9db; border-right: 5px solid #fcc419; color: #664d03; padding: 16px; border-radius: 8px;" if theme != "dark_premium" else "background: #3b3a30; border-right: 5px solid #fcc419; color: #fff; padding: 16px; border-radius: 8px;"
                    html_elements.append(f"<div style='margin: 15px 0; {s} {dir_css}'>ℹ️ <b>{clean_line}</b></div>")
                elif any(k in clean_line.lower() for k in ["beispiel", "z.b.", "مثال", "توضيح"]):
                    s = "background: #e6fcf5; border-right: 5px solid #20c997; color: #099268; padding: 16px; border-radius: 8px;" if theme != "dark_premium" else "background: #1c3d37; border-right: 5px solid #20c997; color: #fff; padding: 16px; border-radius: 8px;"
                    html_elements.append(f"<div style='margin: 15px 0; {s} {dir_css}'>💡 {clean_line}</div>")
                elif re.match(r'^\s*\d+[\.\-\)]+', clean_line):
                    html_elements.append(f"<div style='{current_card} {dir_css}'>📝 <b>{clean_line}</b><br><small style='color:#64748b; display:block; margin-top:8px; direction:ltr; text-align:left;'>[ ] Richtig &nbsp;&nbsp;&nbsp;&nbsp; [ ] Falsch</small></div>")
                elif len(clean_line) < 60 and clean_line.endswith((':', '!', '؟', '?')):
                    ac = {"explanation": "#10b981", "modern_exam": "#0f172a", "dark_premium": "#38bdf8"}
                    html_elements.append(f"<h3 style='color:{ac.get(theme, '#1a73e8')}; margin-top:25px; font-weight:700; {dir_css}'>{clean_line}</h3>")
                else:
                    html_elements.append(f"<div style='{current_card} {dir_css}'>{clean_line}</div>")
            
            output_html = f"""<!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"><title>المستند الفاخر</title>
            <style>body{{margin:0; background:#eef2f5; padding:25px;}} @media print{{body{{background:white; padding:0;}} .no-print{{display:none;}}}}</style>
            </head>
            <body>
                <div style="max-width: 850px; margin: auto; border-radius: 16px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.05);">
                    <div style="{theme_styles.get(theme, theme_styles['explanation'])}">{"".join(html_elements)}</div>
                </div>
                <div class="no-print" style="text-align:center; margin-top:30px;">
                    <button onclick="window.print()" style="background: linear-gradient(135deg, #1a73e8, #0d47a1); color: white; border: none; padding: 14px 30px; font-size: 16px; border-radius: 8px; cursor: pointer; font-weight: bold;">📥 طباعة أو تصدير كـ PDF فاخر</button>
                </div>
            </body>
            </html>"""
            
            self.send_response(200)
            self.send_header("Content-type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(output_html.encode('utf-8'))

print(f"🚀 تم تشغيل المحرك والمنظف الفاخر والمكتمل!")
print(f"👉 افتح الرابط في المتصفح: http://localhost:{PORT}")

with socketserver.TCPServer(("", PORT), SmartFormatterHandler) as httpd:
    try: httpd.serve_forever()
    except KeyboardInterrupt: print("\n👋 تم إيقاف الخادم.")

