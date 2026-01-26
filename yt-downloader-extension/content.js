// content.js
function injectDownloadButton() {
    if (document.getElementById('yt-dlp-quick-btn')) return;
    const controls = document.querySelector('.ytp-right-controls');
    if (!controls) return;
    const btn = document.createElement('button');
    btn.id = 'yt-dlp-quick-btn';
    btn.innerHTML = '⬇️ HD';
    btn.title = "Tải nhanh chất lượng cao nhất (Auto MKV/MP4)";
    btn.style.cssText = `background-color: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.4); border-radius: 12px; padding: 0 12px; height: 36px; margin-top: 6px; margin-right: 12px; font-weight: 600; font-size: 13px; cursor: pointer; vertical-align: top; float: left; transition: all 0.2s ease; display: flex; align-items: center; justify-content: center;`;
    btn.onmouseover = () => { btn.style.borderColor = '#fff'; btn.style.background = 'rgba(255,255,255,0.15)'; btn.style.transform = 'scale(1.05)'; };
    btn.onmouseout = () => { btn.style.borderColor = 'rgba(255,255,255,0.4)'; btn.style.background = 'transparent'; btn.style.transform = 'scale(1)'; };
    btn.onclick = () => {
        btn.innerHTML = '⏳...'; btn.style.cursor = 'wait'; btn.disabled = true;
        chrome.runtime.sendMessage({ action: "quick_download", url: window.location.href }, (response) => {
            if (response && (response.status === 'started' || response.status === 'busy')) {
                btn.innerHTML = '✅ OK'; btn.style.borderColor = '#4caf50'; btn.style.color = '#4caf50';
            } else {
                btn.innerHTML = '❌ Lỗi'; btn.style.borderColor = '#f44336'; btn.style.color = '#f44336';
            }
            setTimeout(() => {
                btn.innerHTML = '⬇️ HD'; btn.style.borderColor = 'rgba(255,255,255,0.4)'; btn.style.color = '#fff'; btn.style.cursor = 'pointer'; btn.disabled = false;
            }, 3000);
        });
    };
    controls.insertBefore(btn, controls.firstChild);
}
const observer = new MutationObserver(() => { if (window.location.href.includes('/watch')) { injectDownloadButton(); } });
observer.observe(document.body, { childList: true, subtree: true });