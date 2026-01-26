const SERVER_URL = 'http://127.0.0.1:5000';
let isServerOnline = false;
let isQueueRunning = false;
let downloadQueue = [];
let currentQueueIndex = 0;

const ui = {
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    btnDownload: document.getElementById('btnDownload'),
    btnStop: document.getElementById('btnStop'),
    btnNewTask: document.getElementById('btnNewTask'),
    inputContainer: document.getElementById('input-container'),
    commonOptions: document.getElementById('common-options'), // Để ẩn khi qua tab Bili
    
    thumbImg: document.getElementById('thumbImg'),
    vidTitle: document.getElementById('vidTitle'),
    vidUrl: document.getElementById('vidUrl'),
    pathTxt: document.getElementById('pathTxt'),
    
    selType: document.getElementById('selType'),
    selQuality: document.getElementById('selQuality'),
    chkThumb: document.getElementById('chkThumb'),
    chkTrim: document.getElementById('chkTrim'),
    trimArea: document.getElementById('trimArea'),
    batchUrl: document.getElementById('batchUrl'),
    txtMultiLinks: document.getElementById('txtMultiLinks'),
    queueStatus: document.getElementById('queueStatus'),
    timeStart: document.getElementById('timeStart'),
    timeEnd: document.getElementById('timeEnd'),
    
    biliUrl: document.getElementById('biliUrl'), // Input mới cho Bili
    
    progArea: document.getElementById('progArea'),
    progBar: document.getElementById('progBar'),
    progSpeed: document.getElementById('progSpeed'),
    progEta: document.getElementById('progEta'),
    progStat: document.getElementById('progStat'),
    logBox: document.getElementById('logBox'),
    
    tabs: document.querySelectorAll('.tab-btn'),
    contents: {
        single: document.getElementById('tab-single'),
        queue: document.getElementById('tab-queue'),
        batch: document.getElementById('tab-batch'),
        bilibili: document.getElementById('tab-bilibili')
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initUI();
    fetchCurrentTab();
    setInterval(syncStateWithServer, 1000);
});

function initUI() {
    ui.chkTrim.addEventListener('change', (e) => ui.trimArea.style.display = e.target.checked ? 'block' : 'none');
    document.getElementById('btnRefreshTab').onclick = fetchCurrentTab;

    document.getElementById('btnChangePath').onclick = async () => {
        if (!isServerOnline) return;
        try {
            const res = await fetch(`${SERVER_URL}/choose-path`);
            const data = await res.json();
            ui.pathTxt.textContent = data.path;
        } catch(e) {}
    };

    ui.btnDownload.onclick = handleStartClick;

    ui.btnStop.onclick = async () => {
        if(confirm("Dừng tất cả tiến trình?")) {
            isQueueRunning = false;
            downloadQueue = [];
            ui.queueStatus.style.display = 'none';
            await fetch(`${SERVER_URL}/stop`, { method: 'POST' });
        }
    };
    
    ui.btnNewTask.onclick = async () => {
        await fetch(`${SERVER_URL}/reset-state`, { method: 'POST' });
        resetUIMode();
    };
}

async function syncStateWithServer() {
    try {
        const res = await fetch(`${SERVER_URL}/progress`);
        if (!res.ok) throw new Error("Offline");
        
        const data = await res.json();
        
        if (!isServerOnline) {
            isServerOnline = true;
            ui.statusDot.className = 'dot active';
            ui.statusText.textContent = 'Online';
            ui.statusText.style.color = '#00e676';
            if (ui.pathTxt.textContent === 'Đang tải...') {
                 fetch(`${SERVER_URL}/current-path`).then(r=>r.json()).then(d=>ui.pathTxt.textContent=d.path);
            }
        }

        updateUIFromState(data);
        updateLogs(data.logs);

        if (isQueueRunning && data.state === 'finished') {
            if (currentQueueIndex < downloadQueue.length - 1) {
                await fetch(`${SERVER_URL}/reset-state`, { method: 'POST' });
                currentQueueIndex++;
                setTimeout(() => processQueueItem(), 1500);
            } else {
                isQueueRunning = false;
                downloadQueue = [];
                ui.queueStatus.textContent = "✅ Đã tải xong toàn bộ danh sách!";
            }
        }

    } catch (e) {
        isServerOnline = false;
        ui.statusDot.className = 'dot error';
        ui.statusText.textContent = 'Disconnected';
        ui.statusText.style.color = '#ff1744';
        ui.btnDownload.disabled = true;
    }
}

function updateUIFromState(data) {
    const state = data.state;
    
    if (state === 'downloading' || state === 'converting' || state === 'starting') {
        ui.inputContainer.style.opacity = '0.5';
        ui.inputContainer.style.pointerEvents = 'none';
        
        ui.btnDownload.style.display = 'none';
        ui.btnStop.style.display = 'block';
        ui.btnNewTask.style.display = 'none';
        
        ui.progArea.style.display = 'block';
        ui.progBar.style.width = data.percent + '%';
        ui.progSpeed.textContent = data.speed;
        ui.progEta.textContent = data.eta;
        
        if (state === 'starting') ui.progStat.textContent = "Đang khởi tạo...";
        if (state === 'downloading') ui.progStat.textContent = `Downloading: ${data.task_name}`;
        if (state === 'converting') {
            ui.progStat.textContent = "Đang xử lý (Muxing)...";
            ui.progBar.style.background = '#ffd700';
        } else {
            ui.progBar.style.background = '#00e676';
        }

    } else if (state === 'finished') {
        ui.btnStop.style.display = 'none';
        if (!isQueueRunning) {
            ui.btnNewTask.style.display = 'block';
        }
        ui.progStat.textContent = "✅ HOÀN TẤT!";
        ui.progBar.style.width = '100%';
        ui.progBar.style.background = '#00e676';
        
    } else if (state === 'error') {
        ui.btnStop.style.display = 'none';
        ui.btnNewTask.style.display = 'block';
        ui.progStat.textContent = "❌ LỖI: " + data.error_msg;
        ui.progBar.style.background = '#ff1744';
        isQueueRunning = false;
    } else {
        resetUIMode();
    }
}

function resetUIMode() {
    ui.inputContainer.style.opacity = '1';
    ui.inputContainer.style.pointerEvents = 'auto';
    ui.btnDownload.style.display = 'block';
    ui.btnDownload.disabled = false;
    ui.btnDownload.textContent = isQueueRunning ? `Đang xử lý (${currentQueueIndex+1}/${downloadQueue.length})` : 'TẢI NGAY';
    ui.btnStop.style.display = 'none';
    ui.btnNewTask.style.display = 'none';
    ui.progArea.style.display = 'none';
    ui.progBar.style.width = '0%';
}

function updateLogs(logs) {
    if (!logs || logs.length === 0) return;
    ui.logBox.innerHTML = '';
    logs.slice().reverse().forEach(line => {
        const div = document.createElement('div');
        div.className = 'log-line';
        div.textContent = line;
        ui.logBox.appendChild(div);
    });
}

function initTabs() {
    ui.tabs.forEach(btn => {
        btn.addEventListener('click', () => {
            ui.tabs.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tabName = btn.dataset.tab;
            
            // Ẩn tất cả nội dung
            Object.values(ui.contents).forEach(el => el.style.display = 'none');
            // Hiện nội dung tab chọn
            ui.contents[tabName].style.display = 'block';
            
            // Xử lý logic hiển thị Common Options
            if (tabName === 'bilibili') {
                ui.commonOptions.style.display = 'none'; // Bilibili dùng BBDown tự động max quality
                ui.btnDownload.classList.add('btn-bili');
                ui.btnDownload.textContent = "Tải Bilibili";
            } else {
                ui.commonOptions.style.display = 'block';
                ui.btnDownload.classList.remove('btn-bili');
                ui.btnDownload.textContent = "Tải YouTube";
            }
        });
    });
}

async function handleStartClick() {
    const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
    
    // --- MODE: BILIBILI ---
    if (activeTab === 'bilibili') {
        const url = ui.biliUrl.value.trim();
        if(!url) return alert("Vui lòng nhập Link Video Bilibili!");
        
        await sendDownloadRequest(url, false, 'bilibili');
        return;
    }

    // --- MODE: YOUTUBE QUEUE ---
    if (activeTab === 'queue') {
        const raw = ui.txtMultiLinks.value;
        const links = raw.split('\n').map(l => l.trim()).filter(l => l.length > 5);
        if (links.length === 0) return alert("Vui lòng dán ít nhất 1 link!");
        
        downloadQueue = links;
        currentQueueIndex = 0;
        isQueueRunning = true;
        
        ui.queueStatus.style.display = 'block';
        processQueueItem();
        return;
    }

    // --- MODE: YOUTUBE SINGLE / BATCH ---
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const isBatch = activeTab === 'batch';
    let urlToDl = isBatch ? ui.batchUrl.value : tab.url;

    if (!urlToDl && !isBatch) return alert("Không tìm thấy URL!");

    sendDownloadRequest(urlToDl, isBatch, 'youtube');
}

async function processQueueItem() {
    if (!isQueueRunning) return;
    const url = downloadQueue[currentQueueIndex];
    ui.queueStatus.textContent = `⏳ Đang xử lý ${currentQueueIndex + 1} / ${downloadQueue.length}: ...${url.slice(-15)}`;
    
    await sendDownloadRequest(url, false, 'youtube');
}

async function sendDownloadRequest(url, isBatch, platform) {
    const payload = {
        url: url,
        platform: platform, // 'youtube' or 'bilibili'
        path: ui.pathTxt.textContent,
        type: ui.selType.value,
        quality: ui.selQuality.value,
        save_thumb: ui.chkThumb.checked,
        is_batch: isBatch,
        shorts: document.getElementById('chkShorts').checked,
        longs: document.getElementById('chkLongs').checked,
        trim: ui.chkTrim.checked ? {
            start: ui.timeStart.value,
            end: ui.timeEnd.value
        } : null
    };

    try {
        await fetch(`${SERVER_URL}/download`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
    } catch (e) {
        alert("Lỗi gửi lệnh: " + e);
        isQueueRunning = false;
    }
}

async function fetchCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
        if (tab.url.includes('bilibili.com')) {
             // Tự động chuyển tab nếu đang ở trang bilibili
             document.querySelector('.tab-btn[data-tab="bilibili"]').click();
             ui.biliUrl.value = tab.url;
        } else {
            ui.vidUrl.textContent = new URL(tab.url).hostname;
            ui.vidTitle.textContent = tab.title.replace(' - YouTube', '');
            const videoId = getYouTubeID(tab.url);
            if (videoId) {
                ui.thumbImg.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
            }
        }
    }
}

function getYouTubeID(url) {
    const reg = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(reg);
    return match ? match[1] : null;
}