import http.server
import socketserver
import urllib.parse
import re
import os

PORT = 8080

HTML_PAGE = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>المُنسق السريع للملفات</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 20px; background: #f4f6f9; color: #333; }
        .container { max-width: 700px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        h2 { color: #1a73e8; text-align: center; }
        textarea, select { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        button { width: 100%; background: #1a73e8; color: white; border: none; padding: 12px; font-size: 16px; border-radius: 4px; cursor: pointer; }
        button:hover { background: #1557b0; }
        .result-box { margin-top: 20px; padding: 15px; border: 1px solid #ddd; background: #fff; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>🧠 المُنسق الذكي والسريع جداً</h2>
        <form action="/format" method="POST">
            <label><b>1. الصق نص ملفك الضخم هنا:</b></label>
            <textarea name="text_content" rows="10" placeholder="ضع النص هنا..." required></textarea>
            
            <label><b>2. وجه الذكاء واشحن الثيم والسياق:</b></label>
            <select name="theme">
                <option value="exam">ثيم الاختبارات والشهادات (Goethe / Exams)</option>
                <option value="novel">ثيم الروايات والقصص الأدبية</option>
                <option value="technical">ثيم التقارير التقنية والأكواد (Dark Mode)</option>
                <option value="classic">التنسيق الرسمي الكلاسيكي</option>
            </select>
            
            <button type="submit">⚡ ابدأ الفرز والتنسيق فوراً</button>
        </form>
    </div>
</body>
</html>"""

class SmartFormatterHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(HTML_PAGE.encode('utf-8'))

    def do_POST(self):
        if self.path == "/format":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            params = urllib.parse.parse_qs(post_data)
            
            raw_text = params.get('text_content', [''])[0]
            theme = params.get('theme', ['classic'])[0]
            
            # معالجة وتنسيق ديناميكي للمستند بناء على التوجيه المختار
            lines = raw_text.split('\r\n')
            if len(lines) == 1: lines = raw_text.split('\n')
            
            html_elements = []
            
            # تحديد الستايل البصري للثيم المختار
            styles = {
                "exam": "background:#fff; color:#111; font-family:Arial; padding:30px; border:2px solid #000;",
                "novel": "background:#fdfaf2; color:#2b221a; font-family:Georgia,serif; padding:40px; text-align:justify; line-height:1.9;",
                "technical": "background:#1e1e1e; color:#a9b7c6; font-family:monospace; padding:20px; text-align:left;",
                "classic": "background:#fafafa; color:#333; font-family:sans-serif; padding:30px; text-align:justify;"
            }
            
            for line in lines:
                clean_line = line.strip()
                if not clean_line: continue
                
                if theme == "exam" and re.match(r'^\s*\d+[\.\-\)]+', clean_line):
                    html_elements.append(f"<div style='margin:20px 0; padding:10px; border-left:4px solid #0056b3; background:#f0f4f8; font-weight:bold;'>{clean_line}<br><small style='color:#555;'>[ ] Richtig &nbsp;&nbsp;&nbsp;&nbsp; [ ] Falsch</small></div>")
                elif len(clean_line) < 50 and clean_line.endswith((':', '!', '؟', '?')):
                    html_elements.append(f"<h3 style='color:#1a73e8; margin-top:20px;'>{clean_line}</h3>")
                else:
                    if theme == "technical":
                        html_elements.append(f"<p style='background:#2b2b2b; padding:8px; border-left:3px solid #6a8759; margin:4px 0;'>{clean_line}</p>")
                    else:
                        html_elements.append(f"<p style='margin-bottom:12px;'>{clean_line}</p>")
            
            output_html = f"""<!DOCTYPE html>
            <html lang="auto">
            <head><meta charset="UTF-8"><title>المستند المنسق</title></head>
            <body style="margin:0; background:#f0f0f0; padding:20px;">
                <div style="max-width:800px; margin:auto; background:white; border-radius:8px; box-shadow:0 4px 10px rgba(0,0,0,0.1); overflow:hidden;">
                    <div style="{styles[theme]}">{"".join(html_elements)}</div>
                </div>
                <div style="text-align:center; margin-top:20px;">
                    <button onclick="window.print()" style="background:#1a73e8; color:white; border:none; padding:10px 20px; font-size:16px; border-radius:4px; cursor:pointer;">📥 حفظ كـ PDF أو طباعة المستند</button>
                </div>
            </body>
            </html>"""
            
            self.send_response(200)
            self.send_header("Content-type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(output_html.encode('utf-8'))

print(f"🚀 الخادم السريع يعمل الآن! افتح الرابط التالي في متصفح هاتفك:")
print(f"👉 http://localhost:{PORT}")

with socketserver.TCPServer(("", PORT), SmartFormatterHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 تم إيقاف الخادم.")

