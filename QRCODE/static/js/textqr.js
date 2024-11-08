console.log('Textqr is loaded');
function TextGenerate() {
    const form = document.getElementById('qrCodeForm');
    const logo = document.getElementById('logo');
    const imageSelection = document.querySelectorAll('.qr-image-option');
    let selectedImage = null; // Biến lưu trữ hình ảnh đã chọn
    let isnotnull=true;
    
    $('#summernote').summernote({
        height: 200,  // Chiều cao của trình soạn thảo
        placeholder: 'Nhập văn bản ở đây...',
        width: 780,
        toolbar: [
            ['history', ['undo', 'redo']],
            ['heading', ['style', 'h1', 'h2', 'h3']],
            ['style', ['bold', 'italic', 'underline', 'clear']],
            ['font', ['strikethrough', 'fontname', 'fontsize']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['insert', ['link']],
        ],
        fontNames: ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'],
        fontNamesIgnoreCheck: ['Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'],
        fontSize: 14,
        callbacks: {
        onInit: function() {
            // Thiết lập giá trị mặc định cho fontname
            $('.note-current-fontname').text('sans-serif'); // hoặc giá trị bạn mong muốn
            $('#summernote').summernote('fontSize', 14);
            $('#summernote').summernote('reset'); 
        },
        onChange: function(contents, $editable) {
        var plainText = $editable.text(); // Lấy văn bản thuần túy

        // Đếm từ
        var wordCount = plainText.trim().split(/\s+/).filter(Boolean).length; // Đếm từ

        // Cập nhật số lượng từ
        $('#word-count').text('Words: ' + wordCount + '/150');

        // Giới hạn số lượng từ
        if (wordCount > 150) {
            alert('You can only enter up to 150 words.');
            var truncatedText = plainText.split(/\s+/).slice(0, 150).join(' '); // Cắt bớt văn bản
            $(this).summernote('code', truncatedText); // Cập nhật lại văn bản
            $('#word-count').text('Words: 150/150'); // Cập nhật số lượng từ về 150
        }   
    }        
    }
    });

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

    function checknull() {
        const content = $('#summernote').summernote('code').trim(); 
        const result = document.getElementById('result-valid');
    
        if (content === "<p><br></p>" || content === "" || content === "<br>"|| content === " ") { 
            isnotnull = false; // Thiết lập là false nếu nội dung rỗng
            result.textContent = "You must enter content!";
            result.style.display = 'block'; // Hiển thị thông báo lỗi
            result.classList.add('custom-invalid-url'); // Thêm class lỗi
        } else {
            console.log('Is not null'); // Nếu có nội dung
            isnotnull = true; // Thiết lập là true nếu có nội dung
            result.textContent = ""; // Xóa thông báo lỗi
            result.style.display = 'none'; // Ẩn thông báo lỗi
        }
    }

    form.addEventListener('submit', function(event) {
        document.getElementById('qrResult').style.display = 'none'; 
        event.preventDefault(); // Ngăn không cho form tự động submit
       checknull();
       if(isnotnull){
        const formData = new FormData(this); // Lấy dữ liệu từ form
        if (selectedImage) {
            console.log(selectedImage);
            formData.append('logo', selectedImage); // Thêm hình ảnh đã chọn vào formData
        }
        fetch('/generate_text_qr', {
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
                $('#summernote').summernote('reset'); 
                $('.note-current-fontname').text('Sans-serif');
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
        console.log("Nhập nội dung");
        downloadBtn.style.display = 'none'; // Ẩn nút tải xuống
        resetBtn.style.display = 'none'; // Ẩn nút reset
    }
    });
}
document.addEventListener('DOMContentLoaded', TextGenerate);
