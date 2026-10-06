load('config.js');
function execute(filter, page) {
    try { var data = listingData(filter, page); return Response.success(data.items, data.next); }
    catch (e) { return failure(e); }
}
