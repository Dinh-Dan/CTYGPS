const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function backupClaudeConfig() {
    // 1. Xác định đường dẫn (Tự động lấy theo User hiện tại)
    const userProfile = process.env.USERPROFILE;
    const sourceDir = path.join(userProfile, '.claude');
    const backupDir = path.join(__dirname, 'claude_backup_folder');

    // 2. Kiểm tra thư mục nguồn
    if (!fs.existsSync(sourceDir)) {
        console.log(`❌ Không tìm thấy thư mục: ${sourceDir}`);
        return;
    }

    try {
        // 3. Đóng VS Code để tránh lỗi file đang bận (File Locking)
        console.log("⚠️  Đang đóng các tiến trình liên quan...");
        try {
            execSync('taskkill /f /im Code.exe', { stdio: 'ignore' });
            execSync('taskkill /f /im claude.exe', { stdio: 'ignore' });
        } catch (e) {
            // Nếu không có process nào đang chạy thì bỏ qua lỗi này
        }

        // 4. Xóa thư mục backup cũ nếu có
        if (fs.existsSync(backupDir)) {
            fs.rmSync(backupDir, { recursive: true, force: true });
        }

        // 5. Tiến hành copy toàn bộ thư mục
        console.log(`🚚 Đang sao chép dữ liệu từ ${sourceDir}...`);
        fs.cpSync(sourceDir, backupDir, { recursive: true });

        console.log("---------------------------------------");
        console.log(`✅ Thành công! Dữ liệu đã được lưu tại: ${backupDir}`);
        console.log("👉 Bạn có thể copy thư mục này sang máy khác.");
    } catch (err) {
        console.error("❌ Có lỗi xảy ra:", err.message);
    }
}

backupClaudeConfig();