import os
from flask import Flask

app = Flask(__name__)

# Cấu hình
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx'}

# Khởi tạo thư mục upload nếu chưa tồn tại
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Nhập các router
from app.router import router as main_routes
from app.feature import event as event_routes
from app.feature import start_ngrok

# Đăng ký blueprint
app.register_blueprint(main_routes)
app.register_blueprint(event_routes)
if __name__ == '__main__':
    start_ngrok()
    app.run(port=5000,debug=False)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
