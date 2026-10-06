function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: "latest", script: "listing.js" },
        { title: "Đọc nhiều", input: "top", script: "listing.js" },
        { title: "Hoàn thành", input: "completed", script: "listing.js" }
    ]);
}
