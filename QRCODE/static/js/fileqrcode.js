function Upload() {
    const form = document.getElementById('uploadfileForm');
    const logo = document.getElementById('logo');
    const imageSelection = document.querySelectorAll('.qr-image-option');
    const selectedImagePreview = document.getElementById('selectedImagePreview'); // Element preview hình ảnh đã chọn
    const TitleimgPreview = document.getElementById('TitleimgPreview'); // Element title của hình ảnh đã chọn
    let selectedImage = null; // Biến lưu trữ hình ảnh đã chọn
    const fileInput = document.getElementById('file-upload');
    const fileNameElement = document.querySelector('.name-file');
    const previewImageElement = document.getElementById('preview-image');
    let isImage= false;
    // Xử lý chọn hình ảnh từ các hình ảnh có sẵn
    imageSelection.forEach(image => {
        image.addEventListener('click', function() {
            selectedImage = this.getAttribute('data-image'); // Lưu đường dẫn hình ảnh đã chọn
            console.log(selectedImage);
            imageSelection.forEach(img => img.classList.remove('custom-border-selected'));
            image.classList.add('custom-border-selected'); // Đánh dấu hình ảnh được chọn
            logo.value = ''; // Đặt lại giá trị của input logo
            selectedImagePreview.style.display = 'none';
            TitleimgPreview.style.display = 'none';
        });
    });

    // Xử lý sự kiện tải ảnh từ máy tính
    const uploadBtn = document.getElementById('uploadBtn');
    uploadBtn.onclick = function(event) {
        event.preventDefault();
        logo.click(); // Mở hộp thoại chọn file
    };

    logo.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                selectedImage = e.target.result; // Lưu đường dẫn hình ảnh từ file
                selectedImagePreview.src = selectedImage; // Cập nhật preview cho hình ảnh đã chọn
                selectedImagePreview.style.display = 'block'; // Hiển thị hình ảnh đã chọn
                TitleimgPreview.style.display = 'block'; // Hiển thị tiêu đề của hình ảnh đã chọn
                imageSelection.forEach(img => img.classList.remove('custom-border-selected')); // Bỏ đánh dấu tất cả hình ảnh
            };
            reader.readAsDataURL(file);
        }
    });

    fileInput.addEventListener('change', function() {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            fileNameElement.textContent = `Tên file: ${file.name}`; // Hiển thị tên file
            fileNameElement.hidden = false; // Hiển thị phần tử chứa tên file
            if(file.type.startsWith('image/'))
                {
                isImage=true;
                const fileURL = URL.createObjectURL(file);
                previewImageElement.src = fileURL;
                previewImageElement.style.display='block';
                }
        } else {
            fileNameElement.hidden = true; // Ẩn nếu không có file nào được chọn
        }
    });

    form.addEventListener('submit', async function(event) {
        document.getElementById('qrResult').style.display = 'none'; 
        event.preventDefault(); // Ngăn không cho form tự động submit
        const formData = new FormData(this); // Lấy dữ liệu từ form
        if (selectedImage) {
            console.log(selectedImage);
            formData.append('logo', selectedImage); // Thêm hình ảnh đã chọn vào formData
        }
        
        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json(); // Giả sử API trả về JSON
            
            console.log("Response Data:", data);
        
            // Xóa nội dung cũ của div
            const qrResultDiv = document.getElementById('qrResult');
            qrResultDiv.innerHTML = ''; // Xóa nội dung cũ
            
            // Tạo thẻ img mới và cập nhật src
            const img = document.createElement('img');
            img.src = data.qr_code_url + '?t=' + new Date().getTime(); 
            img.alt = "QR Code"; // Thêm alt cho ảnh
            qrResultDiv.appendChild(img); // Thêm thẻ img vào div
            
            // Hiển thị div
            qrResultDiv.style.display = 'block'; 

            // Cập nhật nút tải xuống
            const downloadBtn = document.getElementById('downloadBtn');
            downloadBtn.style.display = 'block'; // Hiển thị nút tải xuống
            downloadBtn.onclick = function() {
                const link = document.createElement('a');
                link.href = data.qr_code_url; // Đường dẫn đến hình ảnh QR
                // Tạo tên tệp với thời gian
                const now = new Date();
                const timestamp = now.toISOString().replace(/[:.]/g, '-'); // Định dạng thời gian
                link.download = `qr_code_${timestamp}.png`; // Tên tệp với thời gian
                link.click();
            }; // Thực hiện tải xuống

            const resetBtn = document.getElementById('resetBtn');
            resetBtn.style.display = 'block'; // Hiển thị nút reset
            resetBtn.addEventListener('click', function() {
                qrResultDiv.innerHTML = ''; // Xóa nội dung cũ
                qrResultDiv.style.display = 'none'; // Ẩn div kết quả
                downloadBtn.style.display = 'none'; // Ẩn nút tải xuống
                resetBtn.style.display = 'none'; // Ẩn nút reset
                form.reset(); // Đặt lại form về trạng thái ban đầu
                selectedImage = null; // Đặt lại hình ảnh đã chọn
                selectedImagePreview.style.display = 'none'; // Ẩn preview hình ảnh đã chọn
                imageSelection.forEach(img => img.classList.remove('custom-border-selected')); // Bỏ đánh dấu tất cả hình ảnh
                imageSelection[0].classList.add('custom-border-selected'); // Đánh dấu hình ảnh đầu tiên
                logo.value = ''; // Đặt lại giá trị của input logo
                fileNameElement.textContent = '';
                fileNameElement.hidden=true;
                if (isImage) {
                    previewImageElement.style.display = 'none';
                    previewImageElement.src = '';
                    console.log('Loại bỏ ảnh');
                    isImage=false
                }
            });
        } catch (error) {
            console.error("Error fetching QR code:", error);
        }
    });
}
document.addEventListener("DOMContentLoaded",Upload);
