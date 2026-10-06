load('config.js');
load('reader.js');
function execute(url) {
    var browser = null, target;
    try {
        target = route(url, true);
        var deadline = new Date().getTime() + 30000;
        browser = Engine.newBrowser();
        browser.launch(target.url, 10000);
        var code = "(" + probeChapter.toString() + ")(" + JSON.stringify(target.slug) + "," + target.number + ")";
        while (new Date().getTime() < deadline) {
            var remaining = deadline - new Date().getTime();
            var raw = browser.callJs(code, Math.max(1, Math.min(2000, remaining)));
            var result = null;
            try { result = parseBrowserResult(raw); } catch (ignored) {}
            if (result && result.state === "ready") {
                if (result.slug !== target.slug || Number(result.number) !== target.number || !result.content) throw new Error("Nội dung trả về không khớp chương.");
                var html = paragraphHtml(result.content);
                if (!html) throw new Error("Nội dung chương rỗng.");
                return Response.success(html);
            }
            if (result && result.state === "login") throw new Error("Cần đăng nhập website trong browser VBook có dùng chung phiên với extension.");
            if (result && result.state === "restricted") throw new Error("Website yêu cầu xác minh hoặc đang giới hạn đọc. Hãy xử lý thủ công trên website.");
            if (result && (result.state === "wrong-page" || result.state === "ambiguous")) throw new Error("Không xác nhận được đúng nội dung chương.");
            remaining = deadline - new Date().getTime();
            if (remaining > 0) sleep(Math.min(500, remaining));
        }
        throw new Error("Không lấy được toàn văn trong 30 giây. Phiên đăng nhập hoặc cấu trúc website có thể không tương thích.");
    } catch (e) {
        return Response.error(String(e && e.message || "Không đọc được chương trên browser VBook.") + (target ? "\nMở website: " + target.url : ""));
    } finally { if (browser) { try { browser.close(); } catch (ignoredClose) {} } }
}
