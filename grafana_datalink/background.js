const API_URL = 'https://ai.kreditpintar.net/sql-mapping/original-sql?hash=';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'fetchSql') {
        fetch(API_URL + encodeURIComponent(message.hash))
            .then(res => res.json())
            .then(data => sendResponse({ success: true, data }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }
});
