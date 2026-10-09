import http.server
import socketserver

PORT = 8080

# الدفعة الأولى: تصميم الواجهة الأمامية وهيكل التحكم الفاخر
HTML_PAGE = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>المُعالج والمُنسق الاحترافي للمستندات</title>
    <script src="https://jsdelivr.net"></script>
    <script src="https://tailwindcss.com"></script>
    <style>
        @import url('https://googleapis.com');
        body { font-family: 'Tajawal', 'Plus Jakarta Sans', sans-serif; }
        .ltr-block { font-family: 'Plus Jakarta Sans', sans-serif; direction: ltr; text-align: left; }
        @media print { .no-print { display: none !important; } body { background: white; } }
    </style>
</head>
<body class="bg-slate-50 min-h-screen text-slate-800 antialiased">

    <div id="setup-zone" class="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl shadow-xl border border-slate-100 no-print">
        <div class="text-center mb-8">
            <div class="text-4xl mb-2">🧠</div>
            <h2 class="text-2xl font-bold text-slate-900">مُطهر ومُنسق المحادثات الفاخر</h2>
            <p class="text-slate-500 text-sm mt-1">ارفع ملف المحادثة الضخم ونظمه بالكامل في كروت تفاعلية بلمحة بصر</p>
        </div>

        <div class="space-y-6">
            <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">1. اختر ملف المحادثة المنسوخ (.txt):</label>
                <input type="file" id="fileInput" accept=".txt" class="w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-dashed border-slate-300 rounded-xl p-2 cursor-pointer bg-slate-50">
            </div>

            <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">2. وجه نمط التصميم والثيم الهندسي:</label>
                <select id="themeSelect" class="w-full bg-slate-50 border border-slate-200 text-slate-700 py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="premium">💡 ثيم الشرح والملاحظات والأمثلة الملونة (Premium Cards)</option>
                    <option value="goethe">📝 ثيم الامتحانات الحديث والأنيق (Modern Goethe)</option>
                    <option value="royal">🏛️ الثيم الملكي الكلاسيكي بلمسات ذهبية (Royal Class)</option>
                </select>
            </div>

            <button onclick="processHugeFile()" class="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 hover:opacity-95 transition-all">
                ⚡ تطهير وتنسيق المستند بالكامل
            </button>
        </div>
    </div>

    <div id="output-zone" class="max-w-4xl mx-auto my-8 px-4 hidden">
        <div class="no-print flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <span class="text-sm text-slate-500 font-medium">✨ تم معالجة وتطهير كافة السطور بنجاح</span>
            <button onclick="window.print()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md transition-all text-sm">
                🖨️ طباعة أو حفظ كـ PDF فاخر
            </button>
        </div>
        <div id="document-canvas" class="space-y-6"></div>
    </div>
"""
# الدفعة الثانية: محرك الفرز الذكي والتطهير اللغوي وعزل الاتجاهات
JS_ENGINE = """
    <script>
        function isArabic(text) {
            const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
            return arabicPattern.test(text);
        }

        function cleanAiGarbage(text) {
            let cleaned = text.replace(/\[.*?\]/g, '');
            const garbagePatterns = [
                /بالتأكيد! إليك.*?:/gi, /بالتأكيد، تفضل:/gi, /إليك التنسيق المطلق:/gi,
                /أتمنى أن يكون هذا الشرح مفيداً/gi, /في حال وجود أي استفسار آخر/gi, /بالتوفيق في دراستك/gi
            ];
            garbagePatterns.forEach(pattern => { cleaned = cleaned.replace(pattern, ''); });
            return cleaned.trim();
        }

        function processHugeFile() {
            const fileInput = document.getElementById('fileInput');
            const theme = document.getElementById('themeSelect').value;
            
            if (!fileInput.files[0]) {
                alert('الرجاء اختيار ملف النص أولاً!');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const fullText = e.target.result;
                const lines = fullText.split(/\\r?\\n/);
                const canvas = document.getElementById('document-canvas');
                canvas.innerHTML = '';

                lines.forEach(line => {
                    const cleanLine = cleanAiGarbage(line);
                    if (!cleanLine || cleanLine.length < 2) return;

                    const isAr = isArabic(cleanLine);
                    const dirClass = isAr ? 'direction: rtl; text-align: right;' : 'ltr-block';
                    
                    let cardHtml = '';

                    if (theme === 'premium') {
                        if (cleanLine.toLowerCase().includes('hinweis') || cleanLine.includes('ملاحظة') || cleanLine.includes('تنبيه')) {
                            cardHtml = `<div class="p-5 bg-amber-50 border-r-4 border-amber-500 rounded-xl shadow-sm text-amber-900 font-medium" style="\${dirClass}">ℹ️ \${cleanLine}</div>`;
                        } else if (cleanLine.toLowerCase().includes('beispiel') || cleanLine.includes('مثال') || cleanLine.includes('توضيح')) {
                            cardHtml = `<div class="p-5 bg-emerald-50 border-r-4 border-emerald-500 rounded-xl shadow-sm text-emerald-900" style="\${dirClass}">💡 \${cleanLine}</div>`;
                        } else if (/^\\s*\\d+[\\.\\-\\)]+/.test(cleanLine)) {
                            cardHtml = `<div class="p-6 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all" style="\${dirClass}">
                                           <span class="text-blue-600 font-bold">📝 \${cleanLine}</span>
                                           <div class="mt-4 flex gap-4 text-xs font-semibold text-slate-400 select-none" style="direction: ltr; text-align: left;">
                                               <label class="border p-2 rounded-md bg-slate-50">[ ] Richtig</label>
                                               <label class="border p-2 rounded-md bg-slate-50">[ ] Falsch</label>
                                           </div>
                                        </div>`;
                        } else if (cleanLine.endsWith(':') || cleanLine.endsWith('؟') || cleanLine.endsWith('?')) {
                            cardHtml = `<h3 class="text-xl font-bold text-blue-700 mt-6 mb-2" style="\${dirClass}">\${cleanLine}</h3>`;
                        } else {
                            cardHtml = `<div class="p-5 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-700 leading-relaxed" style="\${dirClass}">\${cleanLine}</div>`;
                        }
                    } 
                    else if (theme === 'goethe') {
                        if (/^\\s*\\d+[\\.\\-\\)]+/.test(cleanLine)) {
                            cardHtml = `<div class="p-6 bg-white border-l-4 border-slate-900 rounded-lg shadow-sm" style="\${dirClass}">
                                           <span class="font-bold text-slate-900">\${cleanLine}</span>
                                           <div class="mt-3 flex gap-6 text-sm font-medium text-slate-700" style="direction: ltr; text-align: left;">
                                               <label class="cursor-pointer">[ ] Richtig</label>
                                               <label class="cursor-pointer">[ ] Falsch</label>
                                           </div>
                                        </div>`;
                        } else if (cleanLine.endsWith(':')) {
                            cardHtml = `<h3 class="text-lg font-bold text-slate-900 border-b border-slate-900 pb-1 mt-6" style="\${dirClass}">\${cleanLine}</h3>`;
                        } else {
                            cardHtml = `<div class="p-4 bg-slate-50 border border-slate-200 rounded-md text-slate-800" style="\${dirClass}">\${cleanLine}</div>`;
                        }
                    }
                    else if (theme === 'royal') {
                        if (cleanLine.endsWith(':') || cleanLine.endsWith('؟')) {
                            cardHtml = `<h3 class="text-xl font-bold text-amber-800 border-b-2 border-amber-200 pb-2 text-center my-6" style="\${dirClass}">\${cleanLine}</h3>`;
                        } else {
                            cardHtml = `<div class="p-6 bg-white border-t-4 border-amber-600 shadow-sm text-stone-800 leading-loose" style="\${dirClass}">\${cleanLine}</div>`;
                        }
                    }

                    canvas.insertAdjacentHTML('beforeend', cardHtml);
                });

                document.getElementById('setup-zone').classList.add('hidden');
                document.getElementById('output-zone').classList.remove('hidden');
                document.body.className = "bg-slate-100 min-h-screen pb-12";
            };

            reader.readAsText(fileInput.files[0]);
        }
    </script>
</body>
</html>"""
# الدفعة الثالثة: السيرفر المدمج وبدء بث الخدمة المحلية
class SmartFormatterHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html; charset=utf-8")
        self.end_headers()
        # دمج الأجزاء المكتوبة وبثها للمتصفح كتلة واحدة
        full_page = HTML_PAGE + JS_ENGINE
        self.wfile.write(full_page.encode('utf-8'))

print(f"🚀 تم دمج الحزم الثلاث وتشغيل المحرك والمنظف الفاخر!")
print(f"👉 افتح متصفح هاتفك الآن واكتب: http://localhost:{PORT}")

with socketserver.TCPServer(("", PORT), SmartFormatterHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 تم إيقاف الخادم.")

