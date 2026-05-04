# Tài liệu Thiết kế API - Hệ thống GPS Việt

Tài liệu này mô tả thiết kế API RESTful cho hệ thống quản lý nội bộ GPS Việt, tích hợp dữ liệu giám sát từ GoTrack Open API v1.

## 1. Thông tin chung
- **Base URL:** `https://api.gpsviet.vn/v1`
- **Định dạng dữ liệu:** JSON
- **Xác thực:** Bearer Token (JWT) trong header `Authorization`.

---

## 2. Nhóm API Giám sát (Tích hợp GoTrack)
Các API này lấy dữ liệu trực tiếp hoặc thông qua proxy từ hệ thống GoTrack.

### 2.1. Danh sách phương tiện
- **Endpoint:** `GET /tracking/vehicles`
- **Mô tả:** Lấy danh sách xe thuộc tài khoản.
- **Dữ liệu trả về:** 
    ```json
    [
      { "id": "123", "imei": "8682...", "plate": "51H-123.45", "expiryDate": "2026-04-21", "status": "active" }
    ]
    ```

### 2.2. Trạng thái trực tuyến (Real-time)
- **Endpoint:** `GET /tracking/live`
- **Mô tả:** Lấy vị trí, vận tốc, trạng thái động cơ (ACC), điều hòa từ các xe.
- **Tham số:** `plate` (không bắt buộc).

### 2.3. Xem lại hành trình
- **Endpoint:** `GET /tracking/history`
- **Tham số:** `imei`, `startTime`, `endTime` (Giới hạn tối đa 7 ngày).

### 2.4. Video & Hình ảnh
- **Endpoint:** `GET /tracking/media/photo` (Ảnh mới nhất)
- **Endpoint:** `GET /tracking/media/video-link` (Link xem trực tiếp/phát lại)

---

## 3. Nhóm API Bán hàng & Kho (Quản lý nội bộ)

### 3.1. Sản phẩm & Bảng giá
- **Endpoint:** `GET /products`
- **Mô tả:** Danh sách thiết bị (VT-01, HD-20...), tồn kho, và các mức giá (Lẻ, Sỉ, Đại lý).

### 3.2. Quản lý Đơn hàng
- **Endpoint:** `GET /orders`
- **Endpoint:** `POST /orders` (Tạo đơn mới: Lắp mới, Gia hạn, Sửa chữa).
- **Trạng thái:** `pending` (Chờ), `doing` (Đang lắp), `done` (Xong), `debt` (Nợ).

### 3.3. Nhật ký Kho
- **Endpoint:** `GET /warehouse/logs`
- **Mô tả:** Lịch sử nhập/xuất kho liên quan đến đơn hàng hoặc nhập hàng từ NCC.

---

## 4. Nhóm API Khách hàng & Đối tác

### 4.1. Khách hàng lẻ
- **Endpoint:** `GET /customers`
- **Endpoint:** `GET /customers/{code}/history` (Lịch sử lắp đặt/gia hạn).

### 4.2. Đại lý & Công nợ
- **Endpoint:** `GET /dealers`
- **Endpoint:** `GET /dealers/{id}/debts` (Chi tiết nợ theo đơn hàng).
- **Endpoint:** `POST /dealers/{id}/payments` (Ghi nhận thanh toán).

---

## 5. Nhóm API Vận hành & Phù hiệu

### 5.1. Nhiệm vụ Kỹ thuật
- **Endpoint:** `GET /tech/tasks`
- **Mô tả:** Danh sách đầu việc cho nhân viên kỹ thuật (Lấy từ đơn hàng).
- **Cập nhật:** `PATCH /tech/tasks/{id}` (Cập nhật trạng thái, thu tiền).

### 5.2. Hồ sơ Phù hiệu xe (Nghị định 10)
- **Endpoint:** `GET /badges`
- **Mô tả:** Quản lý quy trình làm phù hiệu (Tiếp nhận -> Nộp sở -> Đã duyệt -> Trả khách).
- **Tham số lọc:** `status`, `badgeType`.

---

## 6. Sơ đồ thực thể (ERD Tóm tắt)
- **User:** Admin, Technician, Dealer staff.
- **Product:** ID, Name, Cost, PriceTiers[], Stock.
- **Order:** ID, Customer, Plate, Items[], Total, TechID, Status.
- **Device:** IMEI, ServiceExpiry, Plate, OrderID.
- **Payment:** ID, OrderID, Amount, Method, Date.

---

## 7. Mã lỗi phổ biến
- `200 OK`: Thành công.
- `401 Unauthorized`: Token hết hạn hoặc không hợp lệ.
- `403 Forbidden`: Không có quyền truy cập module.
- `404 Not Found`: Không tìm thấy xe/đơn hàng.
- `422 Unprocessable Entity`: Dữ liệu đầu vào sai (Ví dụ: Tra cứu history > 7 ngày).
