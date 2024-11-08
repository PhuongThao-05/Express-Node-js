console.log('Scan is loaded');

function Scan() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const qrResult = document.getElementById('qr-result');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const startScanButton = document.getElementById('start-scan');
    const ResetButton = document.getElementById('reset-scan');
    const visitLinkButton = document.getElementById('visit-link');
    const fileInput = document.getElementById('file-input');
    const fileNameElement = document.querySelector('.name-image');
    const previewImageElement = document.getElementById('preview-image');
    const label = document.getElementById('label-inputfile');
    let qrCodeContent = '';
    let scanningActive = false;

    function resetUI() {
        qrResult.textContent = '';
        visitLinkButton.hidden = true;
        video.hidden = true;
        canvas.hidden = true;
        ResetButton.hidden = true; // Ẩn nút Reset khi làm mới
        qrResult.classList.remove('qr-resultsc');
    }
    async function startQRScanner() {
        resetUI();
        startScanButton.disabled = true;
        scanningActive = true;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            video.srcObject = stream;
            video.setAttribute("playsinline", true);
            video.play();
            video.hidden = false;
    
            const scanDuration = 10000; 
            const scanTimeout = setTimeout(() => {
                if (scanningActive) {
                    stopScanning(scanTimeout); 
                    qrResult.textContent = "Không tìm thấy mã QR.";
                }
            }, scanDuration);
    
            requestAnimationFrame(() => tick(scanTimeout));
        } catch (err) {
            console.error("Lỗi khi truy cập camera: ", err);
        }
    }
    
    function tick(scanTimeout) {
        if (!scanningActive) return;
    
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            // Ghi lại hình ảnh vào canvas
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
    
            if (code) {
                qrResult.classList.add('qr-resultsc');
                const imageDataUrl = canvas.toDataURL('image/png');
                sendImageToServer(imageDataUrl, scanTimeout);
            } 
        }
    
        requestAnimationFrame(() => tick(scanTimeout));
    }
    
    let errorDisplayed = false;
    
    async function sendImageToServer(imageData, scanTimeout) {
        const response = await fetch('/scan_cam', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData }),
        });
    
        const result = await response.json();
        if (!response.ok) {
            if (!errorDisplayed) { // Chỉ hiển thị thông báo lỗi nếu chưa hiển thị
                console.error('Lỗi từ server:', result.error);
                errorDisplayed = true; // Đánh dấu là đã hiển thị thông báo lỗi
            }
        } else {
            errorDisplayed = false; // Reset biến đánh dấu khi nhận được kết quả thành công       
            handleQRCodeDetected(result.data, scanTimeout);
        }
    }
    
    function handleQRCodeDetected(data, scanTimeout) {
        stopScanning(scanTimeout); 
        qrCodeContent = data; 
        qrResult.textContent = `Nội dung mã QR: ${qrCodeContent}`;
        video.hidden = true; 
        video.srcObject.getTracks().forEach(track => track.stop());
        visitLinkButton.hidden = !isLink(qrCodeContent);
        ResetButton.hidden = false; // Hiển thị nút Reset
    }
    
    function stopScanning(scanTimeout) {
        qrResult.classList.add('qr-resultsc');
        scanningActive = false; 
        clearTimeout(scanTimeout); 
        video.srcObject.getTracks().forEach(track => track.stop()); 
        video.hidden = true; 
        ResetButton.hidden = false;
    }
    
    function isLink(content) {
        return content.startsWith('http://') || content.startsWith('https://');
    }
    
    if (startScanButton) {
        startScanButton.addEventListener('click', startQRScanner);
    } else {
        console.log("button start scan is not found!");
    }
    
    ResetButton.addEventListener('click', function(){
        if (fileInput) {
        fileInput.value=null;
        fileNameElement.textContent = '';
        previewImageElement.style.display = 'none';
        previewImageElement.src = '';
        fileNameElement.hidden=true;
        label.classList.remove('disabled-label');
        resetUI();
    }
        else if(startScanButton){
        startScanButton.disabled=false;
        resetUI();
        }
        else{
            resetUI();
        }
    });
    if (fileInput) {
    fileInput.addEventListener('change', function (event) {
        resetUI();
        const file = event.target.files[0];
        if (file) {
            fileNameElement.textContent = `Tên file: ${file.name}`;
            // Tạo URL để hiển thị ảnh
            const fileURL = URL.createObjectURL(file);
            previewImageElement.src = fileURL;

            // Hiển thị ảnh và đoạn <img>
            previewImageElement.style.display = 'block';
            const formData = new FormData();

            formData.append('file', file);
            qrResult.classList.add('qr-resultsc');
            fetch('/scan_image', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.ok) {
                    return response.text();
                }
                ResetButton.hidden = false; 
                fileNameElement.hidden=false;
                label.classList.add('disabled-label');
                throw new Error('Không tìm thấy mã QR');
            })
            .then(data => {
                qrCodeContent = data; 
                qrResult.textContent = `Nội dung mã QR: ${qrCodeContent}`;
                visitLinkButton.hidden = !isLink(qrCodeContent);
                ResetButton.hidden = false; // Hiển thị nút Reset
                label.classList.add('disabled-label');
                fileNameElement.hidden=false;
            })
            .catch(error => {
                qrResult.textContent = error.message; 
            });
        } else {
            fileNameElement.textContent = '';
            previewImageElement.style.display = 'none';
        }
    });  
} else {
    console.log("Input file image not found on this page.");
}

    visitLinkButton.addEventListener('click', () => {
        if (isLink(qrCodeContent)) {
            window.open(qrCodeContent, '_blank'); 
        }
    });
}
document.addEventListener('DOMContentLoaded', Scan);

