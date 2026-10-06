var BASE_URL = "https://comnguoinovel.com";
try { if (DOMAIN) BASE_URL = String(DOMAIN).replace(/\/+$/, ""); } catch (e) {}
var API_URL = "https://api.comnguoinovel.com/api";
var ASSET_URL = "https://assets.comnguoinovel.com";
var CONTENT_CATEGORY = "general";
try { if (String(CATEGORY) === "boylove") CONTENT_CATEGORY = "boylove"; } catch (e) {}

function normalizeUrl(url) {
    var value = String(url || "");
    if (/^https?:\/\//i.test(value)) return value.replace(/^https?:\/\/[^/]+/i, BASE_URL);
    return BASE_URL + (value.charAt(0) === "/" ? "" : "/") + value;
}
function route(url, chapter) {
    var value = normalizeUrl(url).replace(/[?#].*$/, "");
    var match = value.substring(BASE_URL.length).match(chapter ? /^\/truyen\/([^/]+)\/chuong\/(\d+)\/?$/ : /^\/truyen\/([^/]+)\/?$/);
    if (!match) throw new Error("URL " + (chapter ? "chương" : "truyện") + " không hợp lệ.");
    var slug = decodeURIComponent(match[1]);
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("Slug truyện không hợp lệ.");
    var number = chapter ? Number(match[2]) : 0;
    if (chapter && (!isFinite(number) || number < 0 || Math.floor(number) !== number)) throw new Error("Số chương không hợp lệ.");
    return { slug: slug, number: number, url: value };
}
function escapeHtml(value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function paragraphHtml(value) {
    var lines = String(value || "").split(/\r?\n/);
    var out = [];
    for (var i = 0; i < lines.length; i++) if (lines[i].trim()) out.push("<p>" + escapeHtml(lines[i].trim()) + "</p>");
    return out.join("");
}
function slugify(value) {
    var text = String(value || "").trim().toLowerCase();
    if (text.normalize) text = text.normalize("NFD");
    var groups = ["àáạảãâầấậẩẫăằắặẳẵ", "èéẹẻẽêềếệểễ", "ìíịỉĩ", "òóọỏõôồốộổỗơờớợởỡ", "ùúụủũưừứựửữ", "ỳýỵỷỹ", "đ"];
    var chars = "aeiouyd";
    for (var i = 0; i < groups.length; i++) text = text.replace(new RegExp("[" + groups[i] + "]", "g"), chars.charAt(i));
    return text.replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function apiGet(path) {
    var response = fetch(API_URL + path, { headers: { Accept: "application/json" }, timeout: 15000 });
    if (!response.ok) {
        var status = Number(response.status);
        var hint = status === 429 ? "Website giới hạn truy cập; hãy thử lại sau." : status === 401 || status === 403 ? "Website từ chối truy cập." : status === 404 ? "Không tìm thấy dữ liệu." : "Không tải được dữ liệu.";
        throw new Error(hint + " HTTP " + status);
    }
    try { return response.json(); } catch (e) { throw new Error("API trả dữ liệu không phải JSON."); }
}
function ensureArray(value) {
    if (!Array.isArray(value)) throw new Error("Cấu trúc danh sách API đã thay đổi.");
    return value;
}
function coverUrl(value) {
    var text = String(value || "");
    if (!text) return "";
    return /^https?:\/\//i.test(text) ? text : ASSET_URL + "/" + text.replace(/^\/+/, "");
}
function bookItems(rows) {
    ensureArray(rows);
    var items = [];
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (!row || !row.title || !/^[a-z0-9-]+$/.test(String(row.slug || ""))) throw new Error("Dữ liệu truyện không hợp lệ.");
        items.push({ name: String(row.title), link: BASE_URL + "/truyen/" + row.slug, cover: coverUrl(row.poster_url), description: String(row.author_name || "") + (row.total_chapters != null ? " · " + row.total_chapters + " chương" : ""), tag: row.status === "completed" ? "Hoàn thành" : "" });
    }
    return items;
}
function pagination(data, requested, expectedLimit) {
    if (!data || !Array.isArray(data.results)) throw new Error("Cấu trúc phân trang API đã thay đổi.");
    var page = Number(data.page), pages = Number(data.totalPages), total = Number(data.totalResults), limit = Number(data.limit);
    if (page !== requested || !isFinite(pages) || pages < 0 || Math.floor(pages) !== pages || !isFinite(total) || total < 0 || Math.floor(total) !== total || limit !== expectedLimit || data.results.length > limit || (pages === 0 && total !== 0) || (pages > 0 && pages !== Math.ceil(total / limit)) || (requested < pages && data.results.length !== limit)) throw new Error("Thông tin phân trang API không hợp lệ.");
    return { rows: data.results, pages: pages, total: total };
}
function listingData(filter, page) {
    var number = Number(page || "1");
    if (!isFinite(number) || number < 1 || Math.floor(number) !== number) throw new Error("Trang không hợp lệ.");
    var sort = "last_update_chapter_at:desc", extra = "";
    if (filter === "top") sort = "view_count:desc";
    else if (filter === "completed") extra = "&status=completed";
    else if (String(filter).indexOf("genre:") === 0) {
        var slug = String(filter).substring(6);
        if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("Thể loại không hợp lệ.");
        extra = "&genres=" + encodeURIComponent(slug);
    } else if (filter && filter !== "latest") throw new Error("Bộ lọc không hợp lệ.");
    var data = pagination(apiGet("/novels?page=" + number + "&limit=20&sortBy=" + encodeURIComponent(sort) + "&category_type=" + CONTENT_CATEGORY + extra), number, 20);
    return { items: bookItems(data.rows), next: number < data.pages ? String(number + 1) : "" };
}
function failure(error) { return Response.error(String(error && error.message || "Không tải được dữ liệu; hãy thử lại sau.")); }
