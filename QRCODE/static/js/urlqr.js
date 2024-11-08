console.log('Urlqr is loaded');
function Urlqr() {
    const form = document.getElementById('qrCodeForm');
    const logo = document.getElementById('logo');
    const imageSelection = document.querySelectorAll('.qr-image-option');
    let selectedImage = null; // Biến lưu trữ hình ảnh đã chọn
    let islink=true;

    // Xử lý chọn hình ảnh từ các hình ảnh có sẵn
    imageSelection.forEach(image => {
        image.addEventListener('click', function() {
            selectedImage = this.getAttribute('data-image'); // Lưu đường dẫn hình ảnh đã chọn
            // Đánh dấu hình ảnh đã chọn
            console.log(selectedImage);
            imageSelection.forEach(img => img.classList.remove('custom-border-selected'));
            image.classList.add('custom-border-selected') // Đánh dấu hình ảnh được chọn
            logo.value = '';
            selectedImagePreview.style.display = 'none';
            TitleimgPreview.style.display='none';
        });
    });

    // Xử lý sự kiện tải ảnh từ máy tính
    uploadBtn.onclick= function(event) {
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
                TitleimgPreview.style.display='block';
                // Đánh dấu rằng hình ảnh tùy chọn đã được chọn
                imageSelection.forEach(img => img.classList.remove('custom-border-selected'));
            };
            reader.readAsDataURL(file);
        }
    });

    function checkLink() {
        const urlInput = document.getElementById('urlInput').value;
        const result = document.getElementById('result-valid');
        
        // Regular expression to match a valid URL pattern
        const urlPattern = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-zA-Z0-9$_.+!*\'(),;?&=-]+:)?([a-zA-Z0-9$_.+!*\'(),;?&=-]+)@)?' + // username:password (optional)
            '([a-zA-Z0-9.-]+)\\.([a-zA-Z]{2,})|' + // domain name
            '(\\d{1,3}\\.){3}\\d{1,3}|' + // OR IPv4
            '\\[([a-fA-F0-9:]+)\\])' + // OR IPv6
            '(\\:\\d+)?' + // port (optional)
            '(\\/[-a-zA-Z0-9$_.+!*\'(),;?&=-]*)*' + // path (optional)
            '(\\?[;&a-zA-Z0-9$_.+!*\'(),;?&=-]*)?' + // query string (optional)
            '(\\#[-a-zA-Z0-9_]*)?$'); // fragment (optional)
        
        if (urlPattern.test(urlInput)) {
             console.log('Is link');
             islink=true;
             result.textContent = "";
            result.style.display='none';
        } else {
            islink=false;
            result.textContent = "Invalid URL!";
            result.style.display='block';
            result.classList.add('custom-invalid-url');
        }
    }

    form.addEventListener('submit', function(event) {
        document.getElementById('qrResult').style.display = 'none'; 
        event.preventDefault(); // Ngăn không cho form tự động submit
        checkLink();
        if(islink){
        const formData = new FormData(this); // Lấy dữ liệu từ form
        if (selectedImage) {
            console.log(selectedImage);
            formData.append('logo', selectedImage); // Thêm hình ảnh đã chọn vào formData
        }
        fetch('/generate_qr', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json()) // Giả sử API trả về JSON
        .then(data => {
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
             } // Thực hiện tải xuống
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
                imageSelection[0].classList.add('custom-border-selected');
                logo.value = '';
            });
        })
        .catch(error => {
            console.error("Error fetching QR code:", error);
        });
    } else{
        console.log("Nhập lại link");
        downloadBtn.style.display = 'none'; // Ẩn nút tải xuống
        resetBtn.style.display = 'none'; // Ẩn nút reset
    }
    });
}
document.addEventListener('DOMContentLoaded', Urlqr);
