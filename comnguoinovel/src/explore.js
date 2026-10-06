load('config.js');
function execute() {
    try {
        var filters = ["latest", "top", "completed"], titles = ["Mới cập nhật", "Đọc nhiều", "Hoàn thành"], sections = [];
        for (var i = 0; i < filters.length; i++) sections.push({ id: filters[i], title: titles[i], type: i === 1 ? "ranking" : "grid", items: listingData(filters[i], "1").items.slice(0, 10), more: { type: "list", name: titles[i], script: "listing.js", input: filters[i], data: "" } });
        return Response.success(sections);
    } catch (e) { return failure(e); }
}
