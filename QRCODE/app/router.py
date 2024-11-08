from flask import Blueprint, render_template

router = Blueprint('router', __name__)
# Route để hiển thị trang chủ
@router.route('/')
def home():
    return render_template('home.html')
# Route để hiển thị chức năng create qr
@router.route('/createqr')
def create():
    return  render_template('createqr.html')
# Route để hiển thị chức năng tạo qr cho url/link
@router.route('/urlqrcode')
def urlqr():
    return render_template('urlqrcode.html')
# Route để hiển thị chức năng tạo qr cho image
@router.route('/imgqrcode')
def imgqrcode():
    return render_template('imgqrcode.html')
# Route để hiển thị chức năng tạo qr cho file
@router.route('/fileqrcode')
def fileqrcode():
    return render_template('fileqrcode.html')
# Route để hiển thị chức năng scanqr
@router.route('/scanqr')
def scanqr():
    return render_template('scanqr.html')
# Route để hiển thị chức năng scan bằng camera
@router.route('/camera')
def camera():
    return render_template('camerasc.html')
# Route để hiển thị chức năng scan bằng hình ảnh
@router.route('/scimage')
def scimage():
    return render_template('scimage.html')
# Route để hiển thị chức năng tạo QR từ vị trí bản đồ
@router.route('/mapqrcode')
def mapqrcode():
    return render_template('mapqrcode.html')

# Route để hiển thị chức năng tạo qr code từ text
@router.route('/textqrcode')
def textqrcode():
    return render_template('textqrcode.html')
