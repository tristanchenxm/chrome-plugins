// replace below with real API URL
const API_URL = 'https://...';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'fetchSql') {
        fetch(API_URL + encodeURIComponent(message.hash))
            .then(res => res.json())
            .then(data => sendResponse({ success: true, data }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }
});
