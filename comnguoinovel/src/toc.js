load('config.js');
function chapterName(title, number) {
    var text = String(title).trim();
    var prefix = text.match(/^Chương\s+(\d+)(?=\s|:|$)/i);
    if (prefix && Number(prefix[1]) === number) return text;
    return "Chương " + number + ": " + text;
}
function execute(url) {
    try {
        var target = route(url, false), chapters = [], seen = {}, expected = -1, pages = 1, limit = 1000;
        for (var page = 1; page <= pages; page++) {
            var data = pagination(apiGet("/novels/" + target.slug + "/chapters?limit=" + limit + "&page=" + page + "&sortBy=chapter_number%3Aasc"), page, limit);
            if (expected >= 0 && (expected !== data.total || pages !== data.pages)) throw new Error("Mục lục vừa thay đổi; hãy tải lại.");
            expected = data.total;
            pages = data.pages;
            for (var i = 0; i < data.rows.length; i++) {
                var row = data.rows[i], number = Number(row && row.chapter_number);
                if (!row || !row.title || row.chapter_number == null || !isFinite(number) || number < 0 || Math.floor(number) !== number) throw new Error("Dữ liệu chương không hợp lệ.");
                if (seen["c" + number]) throw new Error("Mục lục trùng chương; hãy tải lại.");
                seen["c" + number] = true;
                chapters.push({ name: chapterName(row.title, number), url: BASE_URL + "/truyen/" + target.slug + "/chuong/" + number, lock: row.is_locked === true, pay: false, number: number });
            }
        }
        if (chapters.length !== expected) throw new Error("Mục lục thiếu hoặc trùng chương; hãy tải lại.");
        chapters.sort(function (a, b) { return a.number - b.number; });
        for (var j = 0; j < chapters.length; j++) delete chapters[j].number;
        return Response.success(chapters);
    } catch (e) { return failure(e); }
}
