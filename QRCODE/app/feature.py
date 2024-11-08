import base64
from io import BytesIO
import os
import subprocess
import time
from bs4 import BeautifulSoup
from flask import Blueprint, request, jsonify, send_from_directory,current_app
import qrcode
from pyzbar.pyzbar import decode
from PIL import Image
import requests
from PIL import ImageFilter

event = Blueprint('event', __name__)

# Kiểm tra định dạng file hợp lệ
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

local_ngrok_url = ""  # Khai báo biến toàn cục để lưu trữ URL

def start_ngrok():
    global local_ngrok_url
     # Thêm auth token và khởi động ngrok
    subprocess.run(["ngrok", "config", "add-authtoken", "2nEBfxTHltWMRyRZS9FbKmMUcwY_2ijCTSKhXmk6jr2Jsh8UE"])
    
    # Chạy ngrok trên cổng 8080
    ngrok_process = subprocess.Popen(["ngrok", "http", "5000"], stdout=subprocess.PIPE)
    
    # Đợi một chút để ngrok khởi động
    time.sleep(2)
    
    # Lấy link public bằng cách gọi API ngrok localhost
    try:
        response = requests.get("http://localhost:4040/api/tunnels")
        public_url = response.json()['tunnels'][0]['public_url']
        print(f"Ngrok URL: {public_url}")
        local_ngrok_url=public_url
        return public_url
    except Exception as e:
        print(f"Failed to get ngrok URL: {e}")
        return None

# Route để tạo QR code từ vị trí bản đồ
@event.route('/generate_map_qr', methods=['POST'])
def generate_map_qr():
     # Kiểm tra xem request là dạng JSON hay Form Data
    google_link = request.form.get('google_link')
    latitude = request.form.get('latitude')
    longitude = request.form.get('longitude')
    
    # Nếu có link Google Maps
    if google_link:
        data = google_link
    # Nếu nhập tọa độ latitude và longitude
    elif latitude and longitude:
        try:
            lat = float(latitude)
            lon = float(longitude)
            data = f"https://www.google.com/maps?q={lat},{lon}"
        except ValueError:
            return jsonify({"error": "Tọa độ không hợp lệ"}), 400
    else:
        return jsonify({"error": "Vui lòng nhập link hoặc tọa độ hợp lệ"}), 400

    fill_color = request.form.get('fill_color', '#000000')  # Màu QR
    back_color = request.form.get('back_color', '#FFFFFF')  # Màu nền
    size = int(request.form.get('size', 300))  # Kích thước QR
    logo_file = request.files.get('logo')  # Logo tải lên
    logo_form=request.form.get('logo')
    if not data:
            return jsonify({"error": "Không thể tạo qr"}), 400
    try:
        img = qrwwithchange(data, fill_color, back_color, size, logo_file, logo_form, request.host_url)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    timestamp = time.strftime('%Y%m%d_%H%M%S')
    img_path = f"static/qr_code_{timestamp}.png"  # Đường dẫn lưu hình ảnh
    img.save(img_path)

    # Trả về đường dẫn đến hình ảnh QR code
    return jsonify({"qr_code_url": f"/{img_path}", "url": data}), 200

# Route upload file và tạo QR code
@event.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        # Lưu tệp
        new_filename = f"{os.path.splitext(file.filename)[0]}_{time.strftime('%Y%m%d_%H%M%S')}{os.path.splitext(file.filename)[1]}"
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'],new_filename)
        file.save(file_path)

        # Trả về URL tệp đã tải lên
        upload_url = f'{local_ngrok_url}/upload/{new_filename}'

        fill_color = request.form.get('fill_color', '#000000')  # Màu QR
        back_color = request.form.get('back_color', '#FFFFFF')  # Màu nền
        size = int(request.form.get('size', 300))  # Kích thước QR
        logo_file = request.files.get('logo')  # Logo tải lên
        logo_form=request.form.get('logo')
        if not upload_url:
            return jsonify({"error": "Không thể tạo qr"}), 400
        try:
            img = qrwwithchange(upload_url, fill_color, back_color, size, logo_file, logo_form, request.host_url)
        except Exception as e:
            return jsonify({"error": str(e)}), 500
        timestamp = time.strftime('%Y%m%d_%H%M%S')
        img_path = f"static/qr_code_{timestamp}.png"  # Đường dẫn lưu hình ảnh
        img.save(img_path)

    # Trả về đường dẫn đến hình ảnh QR code
    return jsonify({"qr_code_url": f"/{img_path}", "url": upload_url}), 200

# Serve file đã upload
@event.route('/upload/<filename>')
def uploaded_file(filename):
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    # Xác định loại nội dung của file (MIME type)
    mimetype = None
    if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
        mimetype = 'image/png' 
    elif filename.lower().endswith('.pdf'):
        mimetype = 'eventlication/pdf'
    elif filename.lower().endswith('.doc') or filename.lower().endswith('.docx'):
        mimetype = 'eventlication/msword'
    elif filename.lower().endswith('.xls') or filename.lower().endswith('.xlsx'):
        mimetype = 'eventlication/vnd.ms-excel'
    
    # Gửi file với loại nội dung đã xác định
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename, mimetype=mimetype)

# Route để tạo QR code cho text
@event.route('/generate_text_qr', methods=['POST'])
def generate_text_qr():
    data = request.form.get('data')
    fill_color = request.form.get('fill_color', '#000000')  # Màu QR
    back_color = request.form.get('back_color', '#FFFFFF')  # Màu nền
    size = int(request.form.get('size', 300))  # Kích thước cố định QR là 300x300
    logo_file = request.files.get('logo')  # Logo tải lên
    logo_form = request.form.get('logo')

    # Kiểm tra xem người dùng có nhập nội dung không
    if not data:
        return jsonify({"error": "Vui lòng nhập thông tin để tạo mã QR"}), 400

    # Loại bỏ các thẻ HTML khỏi dữ liệu
    data = BeautifulSoup(data, "html.parser").get_text()
    try:
        img = qrwwithchange(data, fill_color, back_color, size, logo_file, logo_form, request.host_url)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    timestamp = time.strftime('%Y%m%d_%H%M%S')
    img_path = f"static/qr_code_{timestamp}.png"  # Đường dẫn lưu hình ảnh
    img.save(img_path)

    # Trả về đường dẫn đến hình ảnh QR code
    return jsonify({"qr_code_url": f"/{img_path}"}), 200
    
#Router chức năng tạo mã qr với url
@event.route('/generate_qr', methods=['POST'])
def generate_qr():
    data = request.form.get('data')
    fill_color = request.form.get('fill_color', '#000000')  # Màu QR
    back_color = request.form.get('back_color', '#FFFFFF')  # Màu nền
    size = int(request.form.get('size', 300))  # Kích thước QR
    logo_file = request.files.get('logo')  # Logo tải lên
    logo_form=request.form.get('logo')
    if not data:
        return jsonify({"error": "Vui lòng nhập thông tin để tạo mã QR"}), 400

    try:
        img = qrwwithchange(data, fill_color, back_color, size, logo_file, logo_form, request.host_url)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    timestamp = time.strftime('%Y%m%d_%H%M%S')
    img_path = f"static/qr_code_{timestamp}.png"  # Đường dẫn lưu hình ảnh
    img.save(img_path)

    # Trả về đường dẫn đến hình ảnh QR code
    return jsonify({"qr_code_url": f"/{img_path}"}), 200

def qrwwithchange(data,fill_color='#000000', back_color='#FFFFFF', size=300, logo_file=None, logo_form=None,host_url=None):
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)

    # Tạo hình ảnh QR với màu và nền
    img = qr.make_image(fill_color=fill_color, back_color=back_color).convert('RGB')
    img = img.resize((size, size), Image.LANCZOS)

      # Kiểm tra nếu có logo từ file tải lên
    if logo_file:
        try:
            logo = Image.open(logo_file)
            if logo.mode != 'RGBA':
                logo = logo.convert('RGBA')
            logo_size = img.size[0] // 5  # Kích thước logo bằng 1/5 kích thước QR
            logo = logo.resize((logo_size, logo_size), Image.LANCZOS)

            # Chèn logo vào giữa QR
            logo_position = ((img.size[0] - logo_size) // 2, (img.size[1] - logo_size) // 2)
            img.paste(logo, logo_position, logo)
        except Exception as e:
            return jsonify({"error": f"Không thể xử lý logo từ file: {str(e)}"}), 500

    # Kiểm tra nếu có logo từ URL
    elif logo_form:
        try:
            if logo_form.startswith('/'):
                logo_form = request.host_url + logo_form.lstrip('/')

            logo = Image.open(requests.get(logo_form, stream=True).raw)
            logo_size = img.size[0] // 5  # Kích thước logo bằng 1/5 kích thước QR
            logo = logo.resize((logo_size, logo_size), Image.LANCZOS)

            # Chèn logo vào giữa QR
            logo_position = ((img.size[0] - logo_size) // 2, (img.size[1] - logo_size) // 2)
            img.paste(logo, logo_position, logo)
        except Exception as e:
            return jsonify({"error": f"Không thể xử lý logo từ URL: {str(e)}"}), 500
    return img

# Route để quét mã QR với camera
@event.route('/scan_cam', methods=['POST'])
def scan_cam():
    try:  
        if 'image' in request.json:
            # Lấy dữ liệu hình ảnh từ yêu cầu
            image_data = request.json['image'].split(",")[1]
            img_data = base64.b64decode(image_data)
            img = Image.open(BytesIO(img_data))

            # Giải mã mã QR
            decoded_objects = decode(img)

            if decoded_objects:
                # Trả về nội dung của mã QR
                return jsonify({"data": decoded_objects[0].data.decode("utf-8")}), 200
            else:
                return jsonify({"error": "Không tìm thấy mã QR"}), 400
        else:
            return jsonify({"error": "Yêu cầu không hợp lệ"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500 

# Route để quét mã QR với ảnh tải lên
@event.route('/scan_image', methods=['POST'])
def scan_image():
    img_file = request.files['file']
    
    try:
        img = Image.open(img_file)
        if img.mode != 'RGB':
            img = img.convert('RGB')
        img = img.filter(ImageFilter.SHARPEN)
        decoded_objects = decode(img)
        
        if decoded_objects:
            return decoded_objects[0].data.decode("utf-8"), 200  # Trả về nội dung mã QR nếu tìm thấy
        else:
            return "Không tìm thấy mã QR", 400  # Trả về thông báo nếu không tìm thấy mã QR
    except Exception as e:
        return str(e), 500  # Trả về lỗi nếu có bất kỳ vấn đề gì xảy ra
