import threading
import os
import sys
import time
import subprocess
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
import yt_dlp
import tkinter as tk
from tkinter import filedialog
import pystray
from PIL import Image

app = Flask(__name__)
CORS(app)

# --- TRẠNG THÁI TOÀN CỤC ---
current_status = {
    "state": "idle", "percent": 0, "speed": "0", 
    "eta": "--:--", "error_msg": "", "task_name": "",
    "logs": [] 
}
should_stop = False
process_handle = None # Giữ handle của process con (ffmpeg hoặc bbdown) để kill nếu cần

# --- CẤU HÌNH ĐƯỜNG DẪN ---
# Đường dẫn mặc định khi build file exe hoặc chạy code
if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS # Khi chạy trong file EXE (PyInstaller)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

FFMPEG_PATH = os.path.join(BASE_DIR, 'ffmpeg.exe') 
BBDOWN_PATH = os.path.join(BASE_DIR, 'BBDown.exe')

# Mặc định lưu vào Downloads
save_path = os.path.join(os.path.expanduser("~"), "Downloads")

def add_log(msg):
    timestamp = time.strftime("%H:%M:%S")
    log_entry = f"[{timestamp}] {msg}"
    print(log_entry)
    current_status['logs'].append(log_entry)
    if len(current_status['logs']) > 50:
        current_status['logs'].pop(0)

def str_to_seconds(time_str):
    if not time_str: return None
    try:
        parts = list(map(int, time_str.split(':')))
        if len(parts) == 3: return parts[0]*3600 + parts[1]*60 + parts[2]
        if len(parts) == 2: return parts[0]*60 + parts[1]
        return int(parts[0])
    except: return None

# --- XỬ LÝ YOUTUBE (YT-DLP) ---
def progress_hook_yt(d):
    global current_status
    if should_stop: raise ValueError("STOPPED_BY_USER")
    
    if d['status'] == 'downloading':
        p = d.get('_percent_str', '0%').replace('%','').strip()
        try: current_status['percent'] = float(p)
        except: pass
        current_status['state'] = 'downloading'
        current_status['speed'] = d.get('_speed_str', 'N/A')
        current_status['eta'] = d.get('_eta_str', 'N/A')
        current_status['task_name'] = d.get('filename', '').split('/')[-1]
            
    elif d['status'] == 'finished':
        current_status['state'] = 'converting'
        current_status['percent'] = 100
        add_log("Tải xong, đang xử lý (Muxing)...")

def run_youtube_download(data):
    global current_status, should_stop
    should_stop = False
    
    url = data['url']
    path = data['path']
    dl_type = data['type']
    quality = data['quality']
    
    add_log(f"Youtube Task: {url}")
    
    save_thumb = data.get('save_thumb', False)
    is_batch = data.get('is_batch', False)
    trim_data = data.get('trim')
    
    if not os.path.exists(path): os.makedirs(path)
    
    out_tmpl = f'{path}/%(title)s/%(title)s.%(ext)s' if save_thumb else f'{path}/%(title)s.%(ext)s'

    opts = {
        'outtmpl': out_tmpl,
        'noplaylist': not is_batch,
        'progress_hooks': [progress_hook_yt],
        'writethumbnail': save_thumb,
        'ffmpeg_location': FFMPEG_PATH if os.path.exists(FFMPEG_PATH) else None,
        'quiet': True,
        'no_warnings': True,
        'add_metadata': True,
        'embed_thumbnail': True,
    }

    if dl_type == 'audio':
        opts.update({
            'format': 'bestaudio/best', 
            'postprocessors': [{'key': 'FFmpegExtractAudio','preferredcodec': 'mp3'}, {'key': 'FFmpegMetadata'}, {'key': 'EmbedThumbnail'}]
        })
    elif dl_type == 'video_only':
        opts.update({'format': f'bestvideo[height<={quality}]', 'merge_output_format': 'mp4'})
    else: 
        if quality in ['best', '2160', '1440']:
            fmt = f"bestvideo[height<={quality}]+bestaudio/best" if quality != 'best' else "bestvideo+bestaudio/best"
            opts.update({'format': fmt, 'merge_output_format': 'mp4'})
        else:
            fmt = f"bestvideo[height<={quality}][vcodec^=avc1]+bestaudio[ext=m4a]/best"
            opts.update({'format': fmt, 'merge_output_format': 'mp4'})

    if trim_data:
        s, e = str_to_seconds(trim_data.get('start')), str_to_seconds(trim_data.get('end'))
        if s is not None and e is not None:
            opts['download_ranges'] = lambda info, ydl: [{'start_time': s, 'end_time': e}]
            opts['force_keyframes_at_cuts'] = True

    try:
        current_status['state'] = 'starting'
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([url])
        current_status['state'] = 'finished'
        add_log("Hoàn tất tác vụ Youtube!")
    except Exception as e:
        if str(e) == "STOPPED_BY_USER":
            add_log("Đã dừng bởi người dùng.")
            current_status['state'] = 'idle'
        else:
            current_status['state'] = 'error'
            current_status['error_msg'] = str(e)
            add_log(f"Lỗi Youtube: {e}")

# --- XỬ LÝ BILIBILI (BBDown) ---
def run_bilibili_download(data):
    global current_status, should_stop, process_handle
    should_stop = False
    
    url = data['url']
    path = data['path']
    
    # Check BBDown exists
    real_bbdown = BBDOWN_PATH
    # Nếu chạy source code python thuần (chưa build) thì check đường dẫn hiện tại
    if not os.path.exists(real_bbdown):
        real_bbdown = "BBDown.exe" # Fallback local
        if not os.path.exists(real_bbdown):
            current_status['state'] = 'error'
            current_status['error_msg'] = "Không tìm thấy BBDown.exe"
            add_log("Missing BBDown.exe")
            return

    add_log(f"Bilibili Task: {url}")
    current_status['state'] = 'starting'
    current_status['task_name'] = "Bilibili Video"
    
    # Cấu trúc lệnh BBDown
    # BBDown [url] --work-dir [path] --multi-thread
    cmd = [real_bbdown, url, "--work-dir", path]

    # Nếu người dùng muốn TV API (đôi khi cần để lấy 1080P không cần login) - Tạm thời dùng mặc định
    # Có thể thêm flag --tv-api nếu cần
    
    try:
        process_handle = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            stdin=subprocess.PIPE,
            creationflags=subprocess.CREATE_NO_WINDOW,
            universal_newlines=True,
            encoding='utf-8',
            errors='ignore' 
        )

        current_status['state'] = 'downloading'
        
        # Parse output của BBDown để lấy %
        # BBDown output mẫu: "Progress: 15.55%"
        while True:
            if should_stop:
                process_handle.terminate()
                add_log("Đã dừng BBDown.")
                current_status['state'] = 'idle'
                return

            output = process_handle.stdout.readline()
            if output == '' and process_handle.poll() is not None:
                break
            
            if output:
                # Tìm mẫu phần trăm
                match = re.search(r'Progress:\s*(\d+\.?\d*)%', output)
                if match:
                    try:
                        percent = float(match.group(1))
                        current_status['percent'] = percent
                        current_status['speed'] = "BBDown Mode" # BBDown khó parse speed chuẩn
                    except: pass
                
                # Check nếu đang muxing
                if "Muxing" in output:
                    current_status['state'] = 'converting'
                    current_status['percent'] = 99
                    add_log("BBDown: Muxing...")

        if process_handle.returncode == 0:
            current_status['state'] = 'finished'
            current_status['percent'] = 100
            add_log("Hoàn tất tác vụ Bilibili!")
        else:
            if not should_stop:
                current_status['state'] = 'error'
                current_status['error_msg'] = "BBDown exited with error code"
                add_log(f"BBDown Error Code: {process_handle.returncode}")

    except Exception as e:
        current_status['state'] = 'error'
        current_status['error_msg'] = str(e)
        add_log(f"Lỗi BBDown: {e}")

# --- ROUTES ---
@app.route('/', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'version': '9.8.0'}) # Bump version

@app.route('/download', methods=['POST'])
def start_download():
    data = request.json
    dl_platform = data.get('platform', 'youtube') # 'youtube' or 'bilibili'
    
    # Reset logs for new task
    current_status['logs'] = []
    
    if dl_platform == 'bilibili':
        threading.Thread(target=run_bilibili_download, args=(data,), daemon=True).start()
    else:
        threading.Thread(target=run_youtube_download, args=(data,), daemon=True).start()
        
    return jsonify({'status': 'started'})

@app.route('/stop', methods=['POST'])
def stop_download():
    global should_stop, process_handle
    should_stop = True
    if process_handle:
        try:
            process_handle.terminate()
        except: pass
    return jsonify({'status': 'stopped'})

@app.route('/progress', methods=['GET'])
def get_progress():
    return jsonify(current_status)

@app.route('/choose-path', methods=['GET'])
def choose_path():
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    d = filedialog.askdirectory()
    root.destroy()
    global save_path
    if d: save_path = d
    add_log(f"Đổi thư mục lưu: {save_path}")
    return jsonify({'path': save_path})

@app.route('/current-path', methods=['GET'])
def get_path():
    return jsonify({'path': save_path})

@app.route('/reset-state', methods=['POST'])
def reset_state():
    global current_status
    current_status['state'] = 'idle'
    current_status['percent'] = 0
    current_status['task_name'] = ""
    return jsonify({'status': 'reset'})

def run_flask():
    app.run(port=5000, use_reloader=False)

if __name__ == '__main__':
    threading.Thread(target=run_flask, daemon=True).start()
    image = Image.new('RGB', (64, 64), (0, 161, 214)) # Màu xanh Bilibili
    menu = pystray.Menu(pystray.MenuItem('Thoát Server', lambda icon, item: os._exit(0)))
    icon = pystray.Icon("YTProServer", image, "YT & Bilibili Server Running...", menu)
    icon.run()