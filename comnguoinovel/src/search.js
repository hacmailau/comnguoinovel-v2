load('config.js');
function execute(query, page) {
    try {
        if (page && String(page) !== "1") return Response.success([], "");
        var keyword = slugify(query);
        if (!keyword) return Response.success([], "");
        return Response.success(bookItems(apiGet("/novels/search?limit=100&q=" + encodeURIComponent(keyword) + "&category_type=" + CONTENT_CATEGORY)), "");
    } catch (e) { return failure(e); }
}
