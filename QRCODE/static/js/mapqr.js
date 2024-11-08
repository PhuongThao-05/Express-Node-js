function MapQR(){
let map;
let selectedLocation = { lat: 14.0583, lng: 108.2772 };  // Default location: Vietnam
let marker;
const googleLink = document.getElementById('maps-link');
const latitude = document.getElementById('latitude');
const longitude = document.getElementById('longitude');
const form = document.getElementById('mapForm');
const logo = document.getElementById('logo');
const imageSelection = document.querySelectorAll('.qr-image-option');
const selectedImagePreview = document.getElementById('selectedImagePreview');
const TitleimgPreview = document.getElementById('TitleimgPreview');
let selectedImage = null; // Biến lưu trữ hình ảnh đã chọn

// Khởi tạo bản đồ khi DOM đã sẵn sàng
setTimeout(function() {
    console.log("Khởi tạo bản đồ...");
    map = L.map('map').setView([selectedLocation.lat, selectedLocation.lng], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    googleLink.addEventListener('input', function() {
        if (googleLink.value.trim() !== "") {
            latitude.disabled = true;
            longitude.disabled = true;
            latitude.value=''
            longitude.value=''
            if (marker) {
                map.removeLayer(marker);
                marker = null;
            }
        } else {
            latitude.disabled = false;
            longitude.disabled = false;
        }
    });
    
    latitude.addEventListener('change', function() {
        if (latitude.value.trim() !== "" || longitude.value.trim() !== "") {
            googleLink.disabled = true;
        } else {
            googleLink.disabled = false;
        }
    });
    
    longitude.addEventListener('change', function() {
        if (latitude.value.trim() !== "" || longitude.value.trim() !== "") {
            googleLink.disabled = true;
        } else {
            googleLink.disabled = false;
        }
    });
    // Sự kiện click để chọn vị trí trên bản đồ
    map.on('click', function(e) {
        selectedLocation = { lat: e.latlng.lat, lng: e.latlng.lng };

        // Cập nhật giá trị trong input tọa độ
        latitude.value = selectedLocation.lat;
        longitude.value = selectedLocation.lng;
        googleLink.value=''
        googleLink.disabled=true
        latitude.disabled=false
        longitude.disabled=false
        // Thêm hoặc di chuyển marker đến vị trí đã chọn
        if (marker) {
            marker.setLatLng(selectedLocation);
        } else {
            marker = L.marker(selectedLocation).addTo(map);
        }
    });
},500);

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
function isValidGoogleMapsLink(url) {
        const regex = /^(https?:\/\/)?(www\.)?(google\.com\/maps|maps\.app\.goo\.gl)\/.+/;
        return regex.test(url);   
}
form.addEventListener('submit', async function(event) {
    event.preventDefault(); // Ngăn không cho form tự động submit
    const formData = new FormData(this); // Lấy dữ liệu từ form

    // Thêm logo nếu có
    if (selectedImage) {
        formData.append('logo', selectedImage);
    }

    // Kiểm tra nếu người dùng nhập link Google Maps hoặc chọn tọa độ
    if (googleLink.value) {
        formData.append('google_link', googleLink.value); // Thêm link Google Maps vào formData
        formData.delete('latitude'); // Xóa tọa độ nếu có
        formData.delete('longitude');
    } else if (latitude.value && longitude.value) {
        formData.append('latitude', latitude.value); // Thêm latitude vào formData
        formData.append('longitude', longitude.value); // Thêm longitude vào formData
        formData.delete('google_link'); // Xóa Google Maps link nếu có
    } else {
        alert('Please enter a valid Google Maps link or coordinates.');
        return;
    }
    if (googleLink.value) {
        if (!isValidGoogleMapsLink(googleLink.value)) {
            alert('Vui lòng nhập một đường dẫn Google Maps hợp lệ.');
            return; // Dừng việc submit nếu link không hợp lệ
        }
    }

    try {
        const response = await fetch('/generate_map_qr', {
            method: 'POST',
            body: formData, // Gửi formData thay vì JSON
        });

        const data = await response.json(); // Giả sử API trả về JSON

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
            const now = new Date();
            const timestamp = now.toISOString().replace(/[:.]/g, '-'); // Định dạng thời gian
            link.download = `qr_code_${timestamp}.png`; // Tên tệp với thời gian
            link.click();
        };

        // Cập nhật nút reset
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
            googleLink.disabled=false;
            latitude.disabled=false; 
            longitude.disabled=false;
            if (marker) {
                map.removeLayer(marker);
                marker = null;
            }
        });
    } catch (error) {
        console.error("Error fetching QR code:", error);
    }
});
}
document.addEventListener("DOMContentLoaded",MapQR)
