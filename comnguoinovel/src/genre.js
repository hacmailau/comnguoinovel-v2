load('config.js');
function execute() {
    try {
        var rows = ensureArray(apiGet("/types/genres?type=" + CONTENT_CATEGORY)), items = [];
        for (var i = 0; i < rows.length; i++) {
            if (!rows[i].name || !/^[a-z0-9-]+$/.test(String(rows[i].slug || ""))) throw new Error("Dữ liệu thể loại không hợp lệ.");
            items.push({ title: String(rows[i].name), input: "genre:" + rows[i].slug, script: "listing.js" });
        }
        return Response.success(items);
    } catch (e) { return failure(e); }
}
