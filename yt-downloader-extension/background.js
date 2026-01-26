const SERVER_URL = 'http://127.0.0.1:5000';

chrome.action.onClicked.addListener(async (tab) => {
    let windowId;
    if (tab && tab.windowId) {
        windowId = tab.windowId;
    } else {
        const currentWindow = await chrome.windows.getCurrent();
        windowId = currentWindow.id;
    }
    chrome.sidePanel.open({ windowId });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "quick_download") {
        fetch(`${SERVER_URL}/`)
            .then(res => {
                if (!res.ok) throw new Error("Server Offline");
                return fetch(`${SERVER_URL}/current-path`);
            })
            .then(res => res.json())
            .then(data => {
                return fetch(`${SERVER_URL}/download`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: message.url,
                        platform: 'youtube', // Mặc định nút này là YT
                        path: data.path,
                        type: 'video_audio',
                        quality: 'best', 
                        is_batch: false,
                        save_thumb: false
                    })
                });
            })
            .then(res => res.json())
            .then(data => sendResponse(data))
            .catch(err => {
                console.error("Lỗi:", err);
                sendResponse({ status: 'error', message: 'Vui lòng bật YT Pro Server!' });
            });  
        return true; 
    }
});