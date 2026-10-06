load('config.js');
function execute(url) {
    try {
        var target = route(url, false);
        var book = apiGet("/novels/" + target.slug);
        if (!book || book.slug !== target.slug || !book.title) throw new Error("Thông tin truyện trả về không khớp.");
        var names = [];
        if (Array.isArray(book.genres)) for (var i = 0; i < book.genres.length; i++) if (book.genres[i].name) names.push(escapeHtml(book.genres[i].name));
        return Response.success({ name: String(book.title), author: String(book.author_name || ""), cover: coverUrl(book.poster_url), description: paragraphHtml(book.description), detail: "Số chương: " + escapeHtml(book.total_chapters) + "<br>Trạng thái: " + (book.status === "completed" ? "Hoàn thành" : book.status === "ongoing" ? "Đang cập nhật" : escapeHtml(book.status)) + (names.length ? "<br>Thể loại: " + names.join(", ") : ""), url: BASE_URL + "/truyen/" + target.slug, type: "novel", format: "novel", ongoing: book.status !== "completed" });
    } catch (e) { return failure(e); }
}
