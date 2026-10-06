function probeChapter(slug, number) {
    function pack(data) {
        // iOS wraps callJs output in HTML; keep chapter markup literal inside JSON.
        return JSON.stringify(data).replace(/[<>&]/g, function (ch) { return "\\u" + ("0000" + ch.charCodeAt(0).toString(16)).slice(-4); });
    }
    var path = location.pathname.replace(/\/+$/, "");
    if (location.href === "about:blank") return pack({ state: "waiting" });
    if (/^\/auth\/login/.test(path)) return pack({ state: "login" });
    if (path !== "/truyen/" + slug + "/chuong/" + number) return pack({ state: "wrong-page" });
    var bodyText = document.body ? document.body.textContent || "" : "";
    if (/Bạn cần đăng nhập để đọc chương|Đăng nhập để đọc chương/i.test(bodyText)) return pack({ state: "login" });
    if (/READING_COOLDOWN|ADS_REQUIRED|CHALLENGE_REQUIRED|xác minh để tiếp tục|xác minh tài khoản|quá nhiều yêu cầu/i.test(bodyText)) return pack({ state: "restricted" });
    var main = document.querySelector("main");
    if (!main) return pack({ state: "waiting" });
    var text = main.textContent || "";
    if (/Bạn cần đăng nhập để đọc chương|Đăng nhập để đọc chương/i.test(text)) return pack({ state: "login" });
    var keys = Object.keys(main), key = "";
    for (var k = 0; k < keys.length; k++) if (keys[k].indexOf("__reactFiber$") === 0) key = keys[k];
    if (!key) return pack({ state: "waiting" });
    var root = main[key], steps = 0;
    while (root.return && steps++ < 100) root = root.return;
    var candidates = [], visited = 0;
    function walk(node, scoped) {
        if (!node || visited++ > 15000) return;
        var props = node.memoizedProps || {};
        var ownsRoute = props.slug === slug && String(props.chapterSlug) === String(number);
        var inRoute = scoped || ownsRoute;
        if (inRoute) {
            var hook = node.memoizedState;
            for (var i = 0; hook && i < 100; i++, hook = hook.next) {
                var state = hook.memoizedState, data = state && state.data;
                if (data && Number(data.chapter_number) === number && data.novel_id && data.title && typeof data.content === "string" && data.content.trim()) candidates.push(data);
            }
        }
        walk(node.child, inRoute);
        walk(node.sibling, scoped);
    }
    walk(root, false);
    if (!candidates.length) return pack({ state: "waiting" });
    var chapter = candidates[0];
    for (var c = 1; c < candidates.length; c++) if (candidates[c].content !== chapter.content || candidates[c].novel_id !== chapter.novel_id) return pack({ state: "ambiguous" });
    var lines = chapter.content.split(/\r?\n/), paragraphs = [], missing = 0;
    for (var j = 0; j < lines.length; j++) if (lines[j].trim()) paragraphs.push(lines[j].trim());
    for (var n = 0; n < paragraphs.length; n++) if (text.indexOf(paragraphs[n]) < 0) missing++;
    if (missing !== main.querySelectorAll("canvas").length) return pack({ state: "waiting" });
    var nodes = main.querySelectorAll("p"), previous = -1, matched = 0;
    for (var p = 0; p < nodes.length; p++) {
        var value = (nodes[p].textContent || "").trim();
        if (!value) continue;
        var index = -1;
        for (var q = previous + 1; q < paragraphs.length; q++) if (paragraphs[q] === value) { index = q; break; }
        if (index >= 0) { previous = index; matched++; }
        else if (paragraphs.indexOf(value) >= 0) return pack({ state: "waiting" });
    }
    if (!paragraphs.length || (!matched && !missing)) return pack({ state: "waiting" });
    return pack({ state: "ready", slug: slug, number: number, content: chapter.content });
}

function parseBrowserResult(raw) {
    var text = String(raw || "");
    if (/^\s*</.test(text)) {
        var doc = Html.parse(text), body = doc.select("body");
        if (!body.size()) return null;
        text = String(body.text());
    }
    var value = JSON.parse(text);
    return typeof value === "string" ? JSON.parse(value) : value;
}
