console.log('Scan js loading')
document.addEventListener('DOMContentLoaded', function () {
    const filterItems = document.querySelectorAll('.filter-item');
    const filtersContent = document.querySelector('.filters-content .grid');
    const defaultActiveItem = document.querySelector('.filter-item.selectitem-active');

    // Tải nội dung của nút được chọn mặc định
    if (defaultActiveItem) {
        const defaultUrl = defaultActiveItem.getAttribute('data-url');
        fetchAndDisplayContent(defaultUrl); // Tải nội dung từ URL mặc định
    }
    // Lắng nghe sự kiện click cho từng nút
    filterItems.forEach(item => {
        item.addEventListener('click', function () {
            // Loại bỏ lớp active khỏi tất cả các nút
            filterItems.forEach(i => i.classList.remove('selectitem-active'));

            // Thêm lớp active cho nút hiện tại
            item.classList.add('selectitem-active');

            // Lấy URL từ data-url và truyền nội dung vào filters-content
            const url = item.getAttribute('data-url');
            fetchAndDisplayContent(url); // Tải nội dung từ URL
        });
    });
    let currentScript = null;
// Hàm sử dụng AJAX để lấy nội dung từ URL và hiển thị
function fetchAndDisplayContent(url) {
$.ajax({
    url: url,
    method: 'GET',
    success: function (data) {
        const formWrapper = document.createElement('div');
        formWrapper.innerHTML = data; // Chèn form vào container độc lập

        // Xóa nội dung cũ
        filtersContent.innerHTML = '';
        filtersContent.appendChild(formWrapper);
        if (url === '/camera'||url === '/scimage') {
                // Xóa script hiện tại nếu có
                if (currentScript) {
                    currentScript.parentNode.removeChild(currentScript); // Loại bỏ script cũ
                }

                // Tạo thẻ script mới
                currentScript = document.createElement('script');
                currentScript.src = '/static/js/scanning.js'; 

                currentScript.onload = function() {
                    console.log("Script loaded successfully.");
                    if (typeof Scan === 'function') {
                        Scan(); // Gọi hàm callback nếu nó là một hàm
                    }
                };
                currentScript.onerror = function() {
                    console.error("Failed to load the script at: " + currentScript.src);
                };

                document.head.appendChild(currentScript);
            }
    },
    error: function (xhr, status, error) {
        console.error('Error fetching content:', error);
        filtersContent.innerHTML = '<p>Error loading content</p>'; // Hiển thị lỗi
    }
});
}               
});
