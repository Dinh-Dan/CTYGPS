-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th6 10, 2026 lúc 07:08 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `gpsviet2`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `agency_collections`
--

CREATE TABLE `agency_collections` (
  `id` int(11) NOT NULL,
  `code` varchar(30) NOT NULL,
  `dealer_id` int(11) NOT NULL,
  `retail_customer_id` int(11) DEFAULT NULL,
  `amount` bigint(20) NOT NULL,
  `source` enum('admin','staff') NOT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `handed_over` tinyint(1) NOT NULL DEFAULT 0,
  `handed_over_at` datetime DEFAULT NULL,
  `method` enum('cash','transfer') NOT NULL DEFAULT 'cash',
  `note` varchar(500) DEFAULT NULL,
  `receipt_url` varchar(500) DEFAULT NULL,
  `collected_at` datetime NOT NULL DEFAULT current_timestamp(),
  `debt_settlement_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `app_settings`
--

CREATE TABLE `app_settings` (
  `key` varchar(60) NOT NULL,
  `value` text DEFAULT NULL,
  `changed_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `changed_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `app_settings`
--

INSERT INTO `app_settings` (`key`, `value`, `changed_at`, `changed_by`) VALUES
('assets.auto_approve', '1', '2026-05-18 18:44:26', 1),
('assets.logo_url', 'https://i.ibb.co/ntDyYwR/company-logo.jpg', '2026-05-20 14:06:09', 1),
('bank.account_name', '', '2026-05-18 16:51:49', NULL),
('bank.account_no', '', '2026-05-18 16:51:49', NULL),
('bank.bank_name', '', '2026-05-18 16:51:49', NULL),
('bank.default_qr_slot', '1', '2026-05-18 22:42:12', 1),
('qr.slot1.account_name', 'CT TNHH VIEN THONG VINAGPS', '2026-05-24 21:07:57', 1),
('qr.slot1.account_no', '0441000720361', '2026-05-24 21:07:57', 1),
('qr.slot1.bank_name', 'Vietcombank', '2026-05-18 22:42:12', 1),
('qr.slot1.image_url', 'https://i.ibb.co/jX74cD9/qr-slot-1.jpg', '2026-05-25 07:05:01', 1),
('qr.slot1.label', 'QR chính', '2026-05-18 16:51:49', NULL),
('qr.slot2.image_url', '', '2026-05-18 16:51:49', NULL),
('qr.slot2.label', 'QR dự phòng 1', '2026-05-18 16:51:49', NULL),
('qr.slot3.image_url', '', '2026-05-18 16:51:49', NULL),
('qr.slot3.label', 'QR dự phòng 2', '2026-05-18 16:51:49', NULL),
('qr.slot4.image_url', '', '2026-05-18 16:51:49', NULL),
('qr.slot4.label', 'QR dự phòng 3', '2026-05-18 16:51:49', NULL),
('qr.slot5.image_url', '', '2026-05-18 16:51:49', NULL),
('qr.slot5.label', 'QR dự phòng 4', '2026-05-18 16:51:49', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `badge_order_attachments`
--

CREATE TABLE `badge_order_attachments` (
  `id` int(11) NOT NULL,
  `badge_order_id` int(11) NOT NULL,
  `uploader_type` enum('customer','dealer','admin','staff') NOT NULL,
  `uploader_id` int(11) DEFAULT NULL,
  `kind` enum('vehicle_reg','inspection','insurance','cccd','license','biz_license','biz_register','rent_contract','old_badge','other_in','dot_receipt','dot_result','badge_photo','delivery_proof','other_out') NOT NULL,
  `url` varchar(500) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `badge_order_charges`
--

CREATE TABLE `badge_order_charges` (
  `id` int(11) NOT NULL,
  `badge_order_id` int(11) NOT NULL,
  `kind` enum('service','dot_fee','delivery','fee','discount') NOT NULL DEFAULT 'fee',
  `label` varchar(150) NOT NULL,
  `amount` bigint(20) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `categories`
--

INSERT INTO `categories` (`id`, `name`, `is_deleted`) VALUES
(1, 'cammera', 0),
(2, 'sim', 0),
(3, 'gói bảo hiểm', 0),
(4, 'Dịch vụ', 0),
(5, 'Cảm biến', 0),
(6, 'Thiết bị', 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `collections`
--

CREATE TABLE `collections` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `ref_warranty_order_id` int(11) DEFAULT NULL,
  `staff_id` int(11) NOT NULL,
  `amount` bigint(20) NOT NULL,
  `method` enum('cash','transfer') NOT NULL,
  `receipt_url` varchar(500) DEFAULT NULL,
  `collected_at` datetime NOT NULL DEFAULT current_timestamp(),
  `remitted` tinyint(1) NOT NULL DEFAULT 0,
  `remittance_id` int(11) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `note` text DEFAULT NULL,
  `proof_urls` varchar(1000) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `collections`
--

INSERT INTO `collections` (`id`, `order_id`, `ref_warranty_order_id`, `staff_id`, `amount`, `method`, `receipt_url`, `collected_at`, `remitted`, `remittance_id`, `is_deleted`, `note`, `proof_urls`) VALUES
(1, 1, NULL, 4, 3000000, 'cash', NULL, '2026-05-21 14:32:15', 1, 4, 0, NULL, NULL),
(2, 2, NULL, 7, 1000000, 'cash', NULL, '2026-05-21 15:12:14', 1, 1, 0, NULL, NULL),
(3, 4, NULL, 7, 300000, 'cash', NULL, '2026-05-21 16:08:25', 1, 1, 0, NULL, NULL),
(4, 6, NULL, 7, 1000000, 'cash', NULL, '2026-05-21 16:18:32', 1, 1, 0, NULL, NULL),
(5, 8, NULL, 7, 100000, 'cash', NULL, '2026-05-21 16:43:38', 1, 2, 0, NULL, NULL),
(6, 10, NULL, 7, 1000000, 'cash', NULL, '2026-05-21 18:01:18', 1, 7, 0, NULL, NULL),
(7, 12, NULL, 2, 950000, 'cash', NULL, '2026-05-22 22:13:43', 1, 5, 0, NULL, NULL),
(8, 14, NULL, 2, 1000000, 'cash', NULL, '2026-05-22 22:27:06', 1, 5, 0, NULL, NULL),
(9, 17, NULL, 2, 977000, 'cash', NULL, '2026-05-22 23:15:23', 1, 5, 0, NULL, NULL),
(10, 20, NULL, 8, 6786000, 'cash', NULL, '2026-05-22 23:33:56', 1, 3, 0, NULL, NULL),
(11, 28, NULL, 7, 378000, 'cash', NULL, '2026-05-23 11:35:59', 1, 7, 0, NULL, NULL),
(12, 36, NULL, 8, 100000, 'cash', NULL, '2026-05-23 22:47:26', 1, 6, 0, NULL, NULL),
(13, 102, NULL, 2, 3000000, 'transfer', NULL, '2026-06-01 15:09:26', 1, 5, 0, NULL, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `conversations`
--

CREATE TABLE `conversations` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `last_message_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `conversation_members`
--

CREATE TABLE `conversation_members` (
  `id` int(11) NOT NULL,
  `conversation_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `joined_at` datetime NOT NULL DEFAULT current_timestamp(),
  `removed_at` datetime DEFAULT NULL,
  `added_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `type` enum('retail','dealer') NOT NULL DEFAULT 'retail',
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `tax_code` varchar(50) DEFAULT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `debt_limit` bigint(20) NOT NULL DEFAULT 0,
  `credit_term_days` int(11) NOT NULL DEFAULT 0,
  `opening_balance` bigint(20) NOT NULL DEFAULT 0,
  `discount_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `default_tier_id` int(11) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `seen_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `parent_id` int(11) DEFAULT NULL COMMENT 'ID cua dai ly cha (neu co)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `customers`
--

INSERT INTO `customers` (`id`, `code`, `type`, `full_name`, `phone`, `email`, `address`, `avatar_url`, `note`, `company_name`, `tax_code`, `contact_person`, `debt_limit`, `credit_term_days`, `opening_balance`, `discount_rate`, `default_tier_id`, `password_hash`, `is_deleted`, `seen_at`, `created_at`, `updated_at`, `parent_id`) VALUES
(13, 'KH0004', 'retail', 'Hồ Trung Hiếu', '0785411749', NULL, '985/71/12/27 Hương Lộ 2, Phường Bình Trị Đông, Thành phố Hồ Chí Minh, Việt Nam', '/uploads/avatars/1779471019081-d8cb8e43e43b.png', NULL, 'CÔNG TY TNHH TM DV VẬN TẢI HIẾU THÀNH ĐẠT', '0317318602', 'Quyên', 0, 0, 0, 0.00, 1, NULL, 0, '2026-05-23 00:30:14', '2026-05-22 15:51:49', '2026-05-23 03:57:51', NULL),
(19, 'KH0008', 'dealer', 'Trung', '0982031993', NULL, '31/2A Tân Trụ, Phường Tân Sơn, TP Hồ Chí Minh, Việt Nam', NULL, 'Địa chỉ giao hàng: 23/17A đường TL04, Phường Thạnh Lộc, Quận 12.\nTrung - 0982031993', 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ SẢN XUẤT CÔNG NGHỆ AT', '0316500665', NULL, 0, 0, 0, 0.00, 2, NULL, 0, '2026-05-25 10:40:59', '2026-05-25 03:39:17', '2026-05-25 03:42:22', NULL),
(20, 'KH0009', 'retail', 'Tran Thai Binh', '0911775069', NULL, '280B4 Lương Định Của, Khu Phố 1, Phường Bình Trưng, Thành phố Hồ Chí Minh, Việt Nam', NULL, NULL, 'CÔNG TY TNHH MTV THỰC PHẨM ÀO ÀO', '0315085254', NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-05-25 13:28:21', '2026-05-25 06:15:39', '2026-05-25 06:28:21', NULL),
(21, 'DL0004', 'dealer', 'Anh Luân', '0908597259', NULL, NULL, NULL, NULL, 'HỢP TÁC XÃ DỊCH VỤ DU LỊCH VẬN TẢI VÀ THƯƠNG MẠI CƯỜNG THỊNH', '0311978680', 'anh Luân', 0, 0, 0, 0.00, 2, NULL, 0, NULL, '2026-05-25 09:39:07', '2026-06-03 06:07:37', NULL),
(22, 'DL0005', 'dealer', 'ANH HÒA THÀNH ĐẠT', NULL, NULL, NULL, NULL, NULL, 'HTX THÀNH ĐẠT', NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-25 09:43:02', '2026-05-25 09:43:02', NULL),
(23, 'DL0006', 'dealer', 'ANH VIỄN', NULL, NULL, NULL, NULL, NULL, 'ĐL VIỄN NGUYỄN', NULL, NULL, 0, 0, 0, 0.00, 3, NULL, 0, NULL, '2026-05-25 09:43:19', '2026-05-25 09:43:19', NULL),
(24, 'DL0007', 'dealer', 'ANH PHONG 247', NULL, NULL, NULL, NULL, NULL, 'CTY TÍN PHÁT', NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-25 09:43:38', '2026-05-25 09:43:38', NULL),
(25, 'DL0008', 'dealer', 'ANH VỸ', NULL, NULL, NULL, NULL, NULL, 'HTX NGUYÊN VỸ', NULL, NULL, 0, 0, 0, 0.00, 2, NULL, 0, NULL, '2026-05-25 09:43:58', '2026-05-25 09:43:58', NULL),
(26, 'DL0009', 'dealer', 'ANH PHƯỜNG', NULL, NULL, NULL, NULL, NULL, 'DINHVI68', NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-25 09:44:10', '2026-05-25 09:44:10', NULL),
(27, 'DL0010', 'dealer', 'QUANGMINHGPS', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH ĐIỆN TỬ VIỄN THÔNG QUANG MINH GPS', NULL, 'CHỊ DUY', 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-25 09:44:48', '2026-05-25 09:44:48', NULL),
(28, 'DL0011', 'dealer', 'GPSKHANHVY', NULL, NULL, NULL, NULL, NULL, 'GPSKHANHVY', NULL, 'ANH ĐẠT', 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-25 09:45:23', '2026-05-25 09:45:23', NULL),
(29, 'DL0012', 'dealer', 'GPSHOANGVI', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH ĐỖ THÙY DƯƠNG', NULL, 'CHỊ VI ĐÀ NẴNG', 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-25 09:46:00', '2026-05-25 09:46:00', NULL),
(30, 'DL0013', 'dealer', 'GPSQUYNHON', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH DỊCH VỤ CÔNG NGHỆ CARGPS', NULL, 'CHÚ THÁI', 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-25 09:46:29', '2026-05-25 09:46:29', NULL),
(31, 'DL0014', 'dealer', 'NGUYENTUANAN', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH PHÁT TRIỂN AN AN PHÁT', '0317539175', 'ANH AN', 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-25 09:47:13', '2026-05-25 09:47:13', NULL),
(32, 'KH0010', 'retail', 'CHỊ THƠM', '0938161545', NULL, '55 Đường 6B nối dài, KDC Vĩnh Lộc, Phường Bình Tân, TP Hồ Chí Minh, Việt Nam', NULL, NULL, 'CÔNG TY TNHH DỊCH VỤ THƯƠNG MẠI VẬN TẢI TRỌNG NGHĨA', '0309036403', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-26 03:55:52', '2026-05-26 03:55:52', NULL),
(33, 'KH0011', 'retail', 'Chú Tám Cầm', '0918108807', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-05-26 15:03:10', '2026-05-26 04:48:33', '2026-05-26 08:03:33', NULL),
(34, 'KH0012', 'retail', 'hai007', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-26 08:01:40', '2026-05-26 08:01:40', NULL),
(35, 'KH0013', 'retail', 'ANH NHÂN', '0918176513', NULL, '64/2B Hoàng Diệu, Linh Xuân, Hồ Chí Minh, Việt Nam', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-05-26 15:21:05', '2026-05-26 08:18:27', '2026-05-26 08:21:53', NULL),
(36, 'DL0015', 'dealer', 'NTNHAN', '0941899629', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-26 08:20:34', '2026-06-01 02:42:25', NULL),
(37, 'DL0016', 'dealer', 'CÔNG TY TNHH ĐIỆN TỬ VIỄN THÔNG THIÊN PHƯƠNG', 'anh Mạnh', NULL, '0934269691', NULL, NULL, 'CÔNG TY TNHH ĐIỆN TỬ VIỄN THÔNG THIÊN PHƯƠNG', '0314591508', 'anh Mạnh', 0, 0, 0, 0.00, 3, NULL, 0, NULL, '2026-05-26 08:44:03', '2026-05-26 08:44:03', NULL),
(38, 'KH0014', 'retail', 'Trần Hữu Giang', '097 5009522', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-26 09:46:26', '2026-05-26 09:46:26', NULL),
(39, 'KH0015', 'retail', '51d26742', '0909759758', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-27 02:00:51', '2026-05-27 02:00:51', NULL),
(40, 'KH0016', 'retail', 'HỘ KINH DOANH HKD PHƯỚC HOÀNG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 2000, 0.00, NULL, NULL, 0, NULL, '2026-05-27 02:32:02', '2026-05-27 03:33:22', NULL),
(41, 'KH0017', 'retail', 'Thái Thị Anh Thi bsx 70H00980', '0907972980', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-27 09:36:33', '2026-05-27 09:36:33', NULL),
(42, 'DL0017', 'dealer', 'HỢP TÁC XÃ DỊCH VỤ VẬN TẢI SỐ 39', NULL, NULL, NULL, NULL, NULL, 'HỢP TÁC XÃ DỊCH VỤ VẬN TẢI SỐ 39', '0316881259', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-27 10:14:08', '2026-05-27 10:14:08', NULL),
(43, 'KH0018', 'retail', 'Phạm Văn Hiền bsx 50H11449', '0906389640', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-27 10:26:29', '2026-05-27 10:26:29', NULL),
(44, 'KH0019', 'retail', 'VẬN TẢI HỮU NGUYÊN', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ VẬN TẢI HỮU NGUYÊN', '0313044252', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-27 10:28:18', '2026-05-27 10:28:18', NULL),
(45, 'DL0018', 'dealer', 'chị Trinh Tân Bình', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-28 01:33:40', '2026-05-28 01:33:40', NULL),
(46, 'DL0019', 'dealer', 'CÔNG TY TNHH ĐIỆN TỬ CÔNG NGHỆ 365 GPS', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH ĐIỆN TỬ CÔNG NGHỆ 365 GPS', '0318266890', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-28 06:10:30', '2026-05-28 06:10:30', NULL),
(47, 'KH0020', 'retail', 'Trần Tuấn Minh 51D21374', '0903715762', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-28 06:21:47', '2026-05-28 06:21:47', NULL),
(48, 'KH0021', 'retail', 'CÔNG TY TNHH NHỰA TÂN LẬP THÀNH', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH NHỰA TÂN LẬP THÀNH', '0301322113', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-28 06:31:32', '2026-05-28 06:31:32', NULL),
(49, 'KH0022', 'retail', 'CÔNG TY TNHH PHÁT TRIỂN AN AN PHÁT', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH PHÁT TRIỂN AN AN PHÁT', '0317539175', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-28 06:48:40', '2026-05-28 06:48:40', NULL),
(50, 'KH0023', 'retail', 'CÔNG TY TNHH HOÀNG GIA LỢI', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH HOÀNG GIA LỢI', '0315254914', NULL, 0, 0, 0, 0.00, 2, NULL, 0, '2026-05-28 15:06:08', '2026-05-28 06:59:07', '2026-05-28 08:06:24', NULL),
(51, 'KH0024', 'retail', 'Hoàng Văn Minh', '0528111999', NULL, 'Số 26/11 Đường Vĩnh Tân 21, Tổ 1, Khu phố 4, Phường Vĩnh Tân, Thành phố Hồ Chí Minh', NULL, NULL, 'CÔNG TY CỔ PHẦN SẢN XUẤT NỆM ĐẠI THÀNH', '3703118297', NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-05-28 15:01:15', '2026-05-28 07:46:19', '2026-05-28 08:01:29', NULL),
(52, 'KH0025', 'retail', 'ngocphuong2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-28 09:16:05', '2026-05-28 09:16:05', NULL),
(53, 'KH0026', 'retail', 'CÔNG TY TNHH MỘT THÀNH VIÊN VẬN CHUYỂN HOÀNG PHÚ', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH MỘT THÀNH VIÊN VẬN CHUYỂN HOÀNG PHÚ', '0312070877', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-28 09:32:41', '2026-05-28 09:32:41', NULL),
(54, 'KH0027', 'retail', 'Phi Long', '0903169222', NULL, '50 Phạm Hữu Lầu, Phú Mỹ, Quận 7', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-29 01:52:00', '2026-05-29 01:52:00', NULL),
(55, 'KH0028', 'retail', 'camchutich', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-29 01:58:25', '2026-05-29 01:58:25', NULL),
(56, 'KH0029', 'retail', 'Bùi Văn Cường', '0358338296', NULL, 'Số 7 đường 36 Linh Đông, HCM', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-29 01:58:44', '2026-05-29 01:58:44', NULL),
(57, 'KH0030', 'retail', 'CÔNG TY TNHH CÁCH ÂM CÁCH NHIỆT ASEAN', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH CÁCH ÂM CÁCH NHIỆT ASEAN', '0313331553', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-29 02:59:25', '2026-05-29 02:59:25', NULL),
(58, 'DL0020', 'dealer', 'CÔNG TY TNHH HOÀNG GIA LỢI', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH HOÀNG GIA LỢI', '0315254914', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-29 04:15:18', '2026-05-29 04:15:18', NULL),
(59, 'DL0021', 'dealer', 'Nguyễn Hoàng Trung Viễn', '0766767272', NULL, '96/4 Đường số 9, Phường Linh Xuân, HCM', NULL, NULL, 'ĐẠI LÝ VIỄN NGUYỄN', NULL, NULL, 0, 0, 0, 0.00, 2, NULL, 0, '2026-05-29 13:45:57', '2026-05-29 06:44:39', '2026-05-29 06:46:02', NULL),
(60, 'KH0031', 'retail', 'nguyenlehunglam  51H-307.93', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-29 06:50:30', '2026-05-29 06:50:30', NULL),
(61, 'DL0022', 'dealer', 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ BẢO VIỆT TECHNOLOGY', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ BẢO VIỆT TECHNOLOGY', '0318996625', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-29 07:54:26', '2026-05-29 07:54:26', NULL),
(62, 'KH0032', 'retail', 'CÔNG TY TNHH TM&DV DU LỊCH LONG HOA', '0934080620', NULL, '59/29 Nguyễn Sơn, Phường Phú Thạnh, TP Hồ Chí Minh, Việt Nam', NULL, NULL, 'CÔNG TY TNHH TM&DV DU LỊCH LONG HOA', '0312293961', NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-05-29 15:34:21', '2026-05-29 08:19:10', '2026-05-29 08:44:00', NULL),
(63, 'DL0023', 'dealer', 'GARA HOÀI LINH', '0392395557', NULL, NULL, NULL, NULL, 'GARA HOÀI LINH', NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-30 02:24:18', '2026-06-01 03:02:11', NULL),
(64, 'DL0024', 'dealer', 'CÔNG TY TNHH DU LỊCH VẬN TẢI TÍN PHÁT', '0911382486', NULL, NULL, NULL, NULL, 'CÔNG TY TNHH DU LỊCH VẬN TẢI TÍN PHÁT', '0315535376', 'anh Phong', 0, 0, 7390000, 0.00, 1, NULL, 0, NULL, '2026-05-30 02:25:55', '2026-05-30 02:26:24', NULL),
(65, 'KH0033', 'retail', 'nguyenken', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-30 03:21:40', '2026-05-30 03:21:40', NULL),
(66, 'KH0034', 'retail', 'Bùi Thanh Tuấn', '0903603542', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-05-30 13:12:02', '2026-05-30 06:11:39', '2026-05-30 06:12:20', NULL),
(67, 'KH0035', 'retail', 'Diễm Châu', '0919075749', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-30 07:08:24', '2026-05-30 07:08:24', NULL),
(68, 'KH0036', 'retail', 'Tuấn Kiệt', '0913611940', NULL, 'Gần nhà ga T3', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-01 02:38:04', '2026-06-01 02:38:04', NULL),
(69, 'KH0037', 'retail', 'nguyenbaodung', '0703899038', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-01 03:14:20', '2026-06-01 03:14:20', NULL),
(70, 'KH0038', 'retail', 'CÔNG TY TNHH CÔNG NGHỆ PTECH', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH CÔNG NGHỆ PTECH', '0313657643', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-01 04:14:46', '2026-06-01 04:14:46', NULL),
(71, 'KH0039', 'retail', 'CÔNG TY TNHH XÂY DỰNG NỀN MÓNG VẬN TẢI CỬU LONG', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH XÂY DỰNG NỀN MÓNG VẬN TẢI CỬU LONG', '0313293900', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-01 06:59:03', '2026-06-01 06:59:03', NULL),
(72, 'KH0040', 'retail', '<img src=x onerror=\"window.confirm=()=>true;window.prompt=m=>m.includes(\'thu\')?\'http://test.image\':(m.includes(\'KTV\')?\'1\':\'\');console.log(\'STUBBED\')\">', NULL, NULL, NULL, 'https://i.ibb.co/hxj11jNy/dab4d4a4e322.png', NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-06-01 16:57:42', '2026-06-01 08:02:57', '2026-06-01 09:57:47', NULL),
(73, 'KH0041', 'retail', 'Tran Thi Binh', NULL, NULL, NULL, 'https://i.ibb.co/JFd5QP5z/a0f22d08217d.png', NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-06-01 16:56:33', '2026-06-01 08:06:42', '2026-06-01 09:57:37', NULL),
(74, 'KH0042', 'retail', 'doanvanthanh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-01 08:58:48', '2026-06-01 08:58:48', NULL),
(75, 'KH0043', 'retail', 'luchoang', '0972619538', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-01 09:06:17', '2026-06-01 09:06:17', NULL),
(76, 'KH0044', 'retail', 'PHẠM LỢI', '0909405359', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-06-01 16:57:16', '2026-06-01 09:47:41', '2026-06-01 09:57:16', NULL),
(77, 'DL0025', 'dealer', 'CÔNG TY TNHH MTV THƯƠNG MẠI DỊCH VỤ ÁNH MINH', '0915680005', NULL, '34 Trần Thị Tâm, Khu phố 1, Phường Quảng Trị, Tỉnh Quảng Trị, Việt Nam', NULL, NULL, 'CÔNG TY TNHH MTV THƯƠNG MẠI DỊCH VỤ ÁNH MINH', '3200740550', NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-02 02:15:32', '2026-06-02 02:15:32', NULL),
(78, 'DL0026', 'dealer', 'dinhvi68', NULL, NULL, NULL, NULL, NULL, 'dinhvi68', NULL, 'a. Phường', 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-02 02:40:18', '2026-06-02 02:40:18', NULL),
(79, 'KH0045', 'retail', 'phamquoccuong1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-02 04:00:00', '2026-06-02 04:00:00', NULL),
(80, 'KH0046', 'retail', 'Đình Dân Nguyễn)khách thử nghiệm', '0362469321', 'dinhdannguyen2003@gmail.com', '99 Test Street, Q1, HCM', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 3, NULL, 0, NULL, '2026-06-02 05:25:23', '2026-06-02 05:25:23', NULL),
(81, 'KH0047', 'retail', 'CÔNG TY TNHH LỮ HÀNH MẶT TRỜI VIỆT', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH LỮ HÀNH MẶT TRỜI VIỆT', '0306088629', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-02 10:13:49', '2026-06-02 10:13:49', NULL),
(82, 'KH0048', 'retail', 'CÔNG TY TNHH DỊCH VỤ VẬN CHUYỂN SÀI GÒN', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH DỊCH VỤ VẬN CHUYỂN SÀI GÒN', '0301440413', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-03 01:39:20', '2026-06-03 01:39:20', NULL),
(83, 'KH0049', 'retail', 'CÔNG TY TNHH THIÊN GIANG ANH TRANSPORT', '0915611244', NULL, 'Ô 127-128 Đường D33, khu phố 4, Phường An Phú, TP Hồ Chí Minh, Việt Nam', NULL, NULL, 'CÔNG TY TNHH THIÊN GIANG ANH TRANSPORT', '3703433027', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-03 01:59:36', '2026-06-03 01:59:36', NULL),
(84, 'DL0027', 'dealer', 'Viên', '0944855953', NULL, NULL, NULL, NULL, 'dlvien', NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-03 05:58:04', '2026-06-03 05:58:04', NULL),
(85, 'KH0050', 'retail', 'haiquanluu', '0902361163', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-03 08:18:53', '2026-06-03 08:18:53', NULL),
(86, 'KH0051', 'retail', 'phanvandung', '0916883637', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-03 09:57:26', '2026-06-03 09:57:26', NULL),
(87, 'KH0052', 'retail', '50h79438', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-04 01:32:32', '2026-06-04 01:32:32', NULL),
(88, 'KH0053', 'retail', 'voductan', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-04 02:04:12', '2026-06-04 02:04:12', NULL),
(89, 'KH0054', 'retail', 'minhhai1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-04 02:07:58', '2026-06-04 02:07:58', NULL),
(90, 'KH0055', 'retail', 'CÔNG TY TNHH MTV THỰC PHẨM ÀO ÀO', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH MTV THỰC PHẨM ÀO ÀO', '0315085254', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-04 07:03:59', '2026-06-04 07:03:59', NULL),
(91, 'KH0056', 'retail', 'CÔNG TY TNHH CHẾ BIẾN NÔNG HẢI SẢN BIỂN XANH', '02835355431', NULL, '280B4 Lương Định Của, Khu Phố 1, Phường Bình Trưng, TP Hồ Chí Minh, Việt Nam', NULL, NULL, 'CÔNG TY TNHH CHẾ BIẾN NÔNG HẢI SẢN BIỂN XANH', '0301792599', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-04 07:36:27', '2026-06-04 07:36:27', NULL),
(92, 'KH0057', 'retail', 'nguyenvantuan', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-04 08:28:47', '2026-06-04 08:28:47', NULL),
(93, 'KH0058', 'retail', 'Đông Phương', '0906310896', NULL, 'Đường Nguyễn Thị Thử X. Xuân Thới Sơn, TP. Hồ Chí Minh, Việt Nam', NULL, NULL, 'dongphuong1', NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-04 09:31:45', '2026-06-04 09:31:45', NULL),
(94, 'KH0059', 'retail', 'tathanhtuyen', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, '2026-06-05 08:44:58', '2026-06-05 01:33:12', '2026-06-05 01:44:58', NULL),
(95, 'KH0060', 'retail', 'CÔNG TY TNHH DỊCH VỤ VẬN TẢI PHAN TUẤN', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH DỊCH VỤ VẬN TẢI PHAN TUẤN', '0309413644', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-05 04:58:48', '2026-06-05 04:58:48', NULL),
(96, 'KH0061', 'retail', 'lxasean', NULL, NULL, 'Số 20 Lê Quý Đôn, Xã Lao Bảo, Tỉnh Quảng Trị, Việt Nam', NULL, NULL, 'TRƯỜNG TRUNG CẤP NGHỀ TỔNG HỢP ASEAN', '3200569141', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-05 07:42:19', '2026-06-05 07:42:19', NULL),
(97, 'KH0062', 'retail', 'Nghiale', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-05 12:45:23', '2026-06-05 12:45:23', NULL),
(98, 'KH0063', 'retail', 'nghiale', '0949095858', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-05 14:52:36', '2026-06-05 14:52:36', NULL),
(99, 'DL0028', 'dealer', 'daiphugps', '0357253328', NULL, NULL, NULL, NULL, NULL, NULL, 'anh Giàu', 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-06 03:08:31', '2026-06-06 03:08:31', NULL),
(100, 'KH0064', 'retail', 'Hiền Lê', '0902369579', NULL, '0902369579', NULL, NULL, 'hienle', NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-06 04:49:55', '2026-06-06 04:49:55', NULL),
(101, 'KH0065', 'retail', 'vovanle', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-06 05:44:34', '2026-06-06 05:44:34', NULL),
(102, 'DL0029', 'dealer', 'DƯƠNG QUỐC THẮNG', '0907012698', NULL, '158/11/24 Đường Bà Hạt, Phường Vườn Lài, TP Hồ Chí Minh, Việt Nam', NULL, NULL, 'CÔNG TY TNHH KỸ THUẬT DỊCH VỤ PHÚC HƯNG', '0316336239', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-08 08:44:47', '2026-06-08 08:44:47', NULL),
(103, 'KH0066', 'retail', 'dulichhieu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-09 07:12:30', '2026-06-09 07:12:30', NULL),
(104, 'KH0067', 'retail', 'quoccuong25kh', 'quoccuong25kh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-09 07:14:19', '2026-06-09 07:14:19', NULL),
(105, 'KH0068', 'retail', 'Vận Tải Hoàng Phúc', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-09 07:15:59', '2026-06-09 07:15:59', NULL),
(106, 'KH0069', 'retail', 'CÔNG TY TNHH BỒN NƯỚC BÌNH MINH', '0903838535', NULL, 'Số 29 Đường 494, Ấp 3, Tổ 22, Xã Nhuận Đức, TP Hồ Chí Minh, Việt Nam', NULL, NULL, 'CÔNG TY TNHH BỒN NƯỚC BÌNH MINH', '0311479071', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-09 07:20:50', '2026-06-09 07:20:50', NULL),
(107, 'KH0070', 'retail', 'hung1987', '0906789263', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-09 09:20:20', '2026-06-09 09:20:20', NULL),
(108, 'KH0071', 'retail', 'buingoctran', '0921353789', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-10 01:45:09', '2026-06-10 01:45:09', NULL),
(109, 'DL0030', 'dealer', 'CÔNG TY CỔ PHẦN SKYCOOL VIỆT NAM', '0901 843 888', NULL, '32 đường số 5, Khu Đô Thị Vạn Phúc, Phường Hiệp Bình, Thành phố Hồ Chí Minh, Việt Nam', NULL, NULL, 'CÔNG TY CỔ PHẦN SKYCOOL VIỆT NAM', '0313671408', NULL, 0, 0, 0, 0.00, 3, NULL, 0, NULL, '2026-06-10 01:58:05', '2026-06-10 01:58:05', NULL),
(110, 'KH0072', 'retail', '51D21346', '0777393365', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-10 04:32:17', '2026-06-10 04:32:17', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `customer_accounts`
--

CREATE TABLE `customer_accounts` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `account_name` varchar(255) NOT NULL,
  `note` varchar(500) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `customer_accounts`
--

INSERT INTO `customer_accounts` (`id`, `customer_id`, `account_name`, `note`, `is_deleted`) VALUES
(6, 11, '34567890', NULL, 0),
(7, 13, 'Hotrunghieu1', NULL, 0),
(8, 18, 'Thepasia', NULL, 0),
(9, 15, 'Bapbo', NULL, 0),
(10, 24, 'vantaitansang', NULL, 0),
(11, 83, 'Thiengianganh', NULL, 0),
(12, 35, 'Nhan1979', NULL, 0),
(13, 60, 'Nguyenlehunglam', NULL, 0),
(14, 90, 'Thucphamaoao', NULL, 0),
(15, 21, 'Trinhthang', NULL, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `customer_old_debts`
--

CREATE TABLE `customer_old_debts` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `amount` bigint(20) NOT NULL,
  `note` text DEFAULT NULL,
  `debt_date` date NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `customer_old_debts`
--

INSERT INTO `customer_old_debts` (`id`, `customer_id`, `amount`, `note`, `debt_date`, `created_at`, `created_by`) VALUES
(1, 40, 1000, 'test', '2026-05-27', '2026-05-27 10:27:16', 6),
(2, 40, 1000, 'data test', '2026-05-27', '2026-05-27 10:33:22', 6),
(3, 21, 21601200, NULL, '2026-05-27', '2026-05-27 11:14:23', 3),
(4, 63, 2365000, NULL, '2026-05-30', '2026-05-30 09:24:39', 3),
(5, 64, 7390000, NULL, '2026-05-30', '2026-05-30 09:26:24', 3),
(6, 36, 9275000, 'nợ gia hạn', '2026-05-01', '2026-06-01 09:41:45', 3);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `customer_product_prices`
--

CREATE TABLE `customer_product_prices` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `price` decimal(15,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `customer_sims`
--

CREATE TABLE `customer_sims` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `sim_number` varchar(30) NOT NULL,
  `note` varchar(500) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `customer_update_requests`
--

CREATE TABLE `customer_update_requests` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `asset_kind` enum('account','vehicle','sim') NOT NULL,
  `action` enum('add','update','delete') NOT NULL,
  `target_id` int(11) DEFAULT NULL,
  `value` varchar(255) DEFAULT NULL,
  `note` varchar(500) DEFAULT NULL,
  `requested_by_role` enum('admin','kithuat','customer','daily') NOT NULL,
  `requested_by_id` int(11) DEFAULT NULL,
  `ref_order_id` int(11) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `review_note` varchar(500) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `customer_update_requests`
--

INSERT INTO `customer_update_requests` (`id`, `customer_id`, `asset_kind`, `action`, `target_id`, `value`, `note`, `requested_by_role`, `requested_by_id`, `ref_order_id`, `status`, `reviewed_by`, `reviewed_at`, `review_note`, `is_deleted`) VALUES
(12, 11, 'account', 'add', NULL, '34567890', NULL, 'kithuat', 7, 8, 'approved', NULL, '2026-05-21 09:43:43', NULL, 0),
(13, 11, 'vehicle', 'add', NULL, '34567890', NULL, 'kithuat', 7, 8, 'approved', NULL, '2026-05-21 09:43:43', NULL, 0),
(14, 13, 'account', 'add', NULL, 'Hotrunghieu1', NULL, 'kithuat', 8, 36, 'approved', NULL, '2026-05-23 15:47:51', NULL, 0),
(15, 13, 'vehicle', 'add', NULL, '51C23456', NULL, 'kithuat', 8, 36, 'approved', NULL, '2026-05-23 15:47:51', NULL, 0),
(16, 18, 'account', 'add', NULL, 'Thepasia', NULL, 'kithuat', 2, 37, 'approved', NULL, '2026-05-24 14:33:57', NULL, 0),
(17, 15, 'account', 'add', NULL, 'Bapbo', NULL, 'kithuat', 2, 40, 'approved', NULL, '2026-05-24 15:05:24', NULL, 0),
(18, 15, 'vehicle', 'add', NULL, '51S57789', NULL, 'kithuat', 2, 40, 'approved', NULL, '2026-05-24 15:05:24', NULL, 0),
(19, 24, 'account', 'add', NULL, 'vantaitansang', NULL, 'kithuat', 8, 113, 'approved', NULL, '2026-06-02 08:37:28', NULL, 0),
(20, 83, 'account', 'add', NULL, 'Thiengianganh', NULL, 'kithuat', 8, 119, 'approved', NULL, '2026-06-03 03:49:41', NULL, 0),
(21, 83, 'vehicle', 'add', NULL, '50E-158.87', NULL, 'kithuat', 8, 119, 'approved', NULL, '2026-06-03 03:49:41', NULL, 0),
(22, 35, 'account', 'add', NULL, 'Nhan1979', NULL, 'kithuat', 2, 57, 'approved', NULL, '2026-06-05 09:35:49', NULL, 0),
(23, 35, 'vehicle', 'add', NULL, '51C-845.38', NULL, 'kithuat', 2, 57, 'approved', NULL, '2026-06-05 09:35:49', NULL, 0),
(24, 60, 'account', 'add', NULL, 'Nguyenlehunglam', NULL, 'kithuat', 2, 91, 'approved', NULL, '2026-06-05 09:39:41', NULL, 0),
(25, 60, 'vehicle', 'add', NULL, '51H-307.93', NULL, 'kithuat', 2, 91, 'approved', NULL, '2026-06-05 09:39:41', NULL, 0),
(26, 90, 'account', 'add', NULL, 'Thucphamaoao', NULL, 'kithuat', 2, 142, 'approved', NULL, '2026-06-05 09:51:44', NULL, 0),
(27, 21, 'account', 'add', NULL, 'Trinhthang1', NULL, 'kithuat', 2, 155, 'approved', NULL, '2026-06-06 02:14:18', NULL, 0),
(28, 21, 'vehicle', 'add', NULL, '50h44671', NULL, 'kithuat', 2, 155, 'approved', NULL, '2026-06-06 02:14:18', NULL, 0),
(29, 21, 'account', 'update', 15, 'Trinhthang', NULL, 'kithuat', 2, 155, 'approved', NULL, '2026-06-07 03:48:42', NULL, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `customer_vehicles`
--

CREATE TABLE `customer_vehicles` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `plate` varchar(30) NOT NULL,
  `note` varchar(500) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `customer_vehicles`
--

INSERT INTO `customer_vehicles` (`id`, `customer_id`, `plate`, `note`, `is_deleted`) VALUES
(6, 11, '34567890', NULL, 0),
(7, 13, '51C23456', NULL, 0),
(8, 15, '51S57789', NULL, 0),
(9, 83, '50E-158.87', NULL, 0),
(10, 35, '51C-845.38', NULL, 0),
(11, 60, '51H-307.93', NULL, 0),
(12, 21, '50h44671', NULL, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `debt_settlements`
--

CREATE TABLE `debt_settlements` (
  `id` int(11) NOT NULL,
  `code` varchar(30) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `total_debt` bigint(20) NOT NULL,
  `amount_paid` bigint(20) NOT NULL,
  `remaining` bigint(20) NOT NULL,
  `qr_slot` tinyint(4) DEFAULT NULL,
  `pay_method` enum('cash','transfer','mixed') NOT NULL DEFAULT 'cash',
  `receipt_url` varchar(500) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `paid_at` datetime NOT NULL DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `inquiries`
--

CREATE TABLE `inquiries` (
  `id` int(11) NOT NULL,
  `code` varchar(30) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `area` varchar(100) DEFAULT NULL,
  `vehicle_plate` varchar(20) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `service_kind` enum('install','renewal','maintenance','warranty','consult') NOT NULL DEFAULT 'install',
  `source` varchar(50) NOT NULL DEFAULT 'web',
  `status` enum('new','contacted','converted','rejected') NOT NULL DEFAULT 'new',
  `seen_at` datetime DEFAULT NULL,
  `contacted_at` datetime DEFAULT NULL,
  `contacted_by_staff_id` int(11) DEFAULT NULL,
  `converted_customer_id` int(11) DEFAULT NULL,
  `converted_order_id` int(11) DEFAULT NULL,
  `reject_reason` varchar(500) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `inquiry_items`
--

CREATE TABLE `inquiry_items` (
  `id` int(11) NOT NULL,
  `inquiry_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `qty` int(11) NOT NULL DEFAULT 1,
  `note` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `conversation_id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `sender_type` enum('customer','staff') NOT NULL,
  `sender_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `visibility` enum('all','staff_only') NOT NULL DEFAULT 'all',
  `sent_at` datetime NOT NULL DEFAULT current_timestamp(),
  `read_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` varchar(500) NOT NULL,
  `link_url` varchar(500) DEFAULT NULL,
  `ref_order_id` int(11) DEFAULT NULL,
  `ref_customer_id` int(11) DEFAULT NULL,
  `ref_staff_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `notifications`
--

INSERT INTO `notifications` (`id`, `type`, `title`, `message`, `link_url`, `ref_order_id`, `ref_customer_id`, `ref_staff_id`, `is_read`, `read_at`, `is_deleted`, `created_at`) VALUES
(1, 'order_completed', 'ORD-2105-001: KTV hoàn thành', 'Trần Quốc Viện — Đình Dân Nguyễn — 3.600.000đ', '/admin/orders.html#order-1', 1, 9, 4, 1, '2026-05-26 13:12:11', 0, '2026-05-21 07:32:15'),
(2, 'order_completed', 'ORD-2105-002: KTV hoàn thành', 'nhân sự của dân test — khách của dân test đừng xoá — 1.776.000đ', '/admin/orders.html#order-2', 2, 11, 7, 1, '2026-05-26 13:12:11', 0, '2026-05-21 08:12:14'),
(3, 'order_receive_uploaded', 'ORD-2105-003: KTV upload anh', 'Trần Quốc Viện — 0783666060', '/admin/orders.html#order-3', 3, 12, 8, 1, '2026-05-21 15:48:09', 0, '2026-05-21 08:42:12'),
(4, 'order_completed', 'ORD-2105-004: KTV hoàn thành', 'nhân sự của dân test — khách của dân test đừng xoá — 450.000đ', '/admin/orders.html#order-4', 4, 11, 7, 1, '2026-05-26 13:12:11', 0, '2026-05-21 09:08:27'),
(5, 'order_completed', 'ORD-2105-005: KTV hoàn thành', 'nhân sự của dân test — khách của dân test đừng xoá — 1.620.000đ', '/admin/orders.html#order-6', 6, 11, 7, 1, '2026-05-26 13:12:11', 0, '2026-05-21 09:18:33'),
(6, 'order_completed', 'ORD-2105-006: KTV hoàn thành', 'nhân sự của dân test — khách của dân test đừng xoá — 300.000đ', '/admin/orders.html#order-8', 8, 11, 7, 1, '2026-05-26 13:12:11', 0, '2026-05-21 09:43:39'),
(7, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'khách của dân test đừng xoá: thêm tài khoản, thêm biển số', '/admin/customers.html?customer_id=11&tab=requests', 8, 11, 7, 1, '2026-05-26 13:12:11', 0, '2026-05-21 09:43:43'),
(8, 'order_completed', 'ORD-2105-007: KTV hoàn thành', 'nhân sự của dân test — khách của dân test đừng xoá — 1.620.000đ', '/admin/orders.html#order-10', 10, 11, 7, 1, '2026-05-22 17:01:26', 0, '2026-05-21 11:01:19'),
(9, 'advance_request', 'Yêu cầu ứng lương mới', 'nhân sự của dân test yêu cầu ứng 100.000đ kỳ 2026-05', '/admin/staff.html', NULL, NULL, 7, 1, '2026-05-21 18:44:13', 0, '2026-05-21 11:44:07'),
(10, 'order_completed', 'ORD-2205-001: KTV hoàn thành', 'Nguyễn Lý Thoại — Đỗ Cương — 2.950.000đ', '/admin/orders.html#order-12', 12, 10, 2, 1, '2026-05-22 22:14:17', 0, '2026-05-22 15:13:43'),
(11, 'order_completed', 'ORD-2205-002: KTV hoàn thành', 'Nguyễn Lý Thoại — Đỗ Cương — 1.500.000đ', '/admin/orders.html#order-14', 14, 10, 2, 1, '2026-05-26 13:12:11', 0, '2026-05-22 15:27:06'),
(12, 'advance_request', 'Yêu cầu ứng lương mới', 'Nguyễn Lý Thoại yêu cầu ứng 500.000đ kỳ 2026-05', '/admin/staff.html', NULL, NULL, 2, 1, '2026-05-22 22:42:34', 0, '2026-05-22 15:42:29'),
(13, 'order_receive_uploaded', 'ORD-2205-003: KTV upload anh', 'Trần Quốc Viện — Hồ Trung Hiếu', '/admin/orders.html#order-15', 15, 13, 8, 1, '2026-05-26 13:12:11', 0, '2026-05-22 16:06:42'),
(14, 'order_completed', 'ORD-2205-003: KTV hoàn thành', 'Trần Quốc Viện — Hồ Trung Hiếu — 4.752.000đ', '/admin/orders.html#order-15', 15, 13, 8, 1, '2026-05-26 13:12:11', 0, '2026-05-22 16:08:50'),
(15, 'order_completed', 'ORD-2205-004: KTV hoàn thành', 'Nguyễn Lý Thoại — Đỗ Cương — 3.977.000đ', '/admin/orders.html#order-17', 17, 10, 2, 1, '2026-05-26 13:12:11', 0, '2026-05-22 16:15:23'),
(16, 'order_receive_uploaded', 'ORD-2205-005: KTV upload anh', 'Trần Quốc Viện — Hồ Trung Hiếu', '/admin/orders.html#order-20', 20, 13, 8, 1, '2026-05-26 13:12:11', 0, '2026-05-22 16:32:57'),
(17, 'order_completed', 'ORD-2205-005: KTV hoàn thành', 'Trần Quốc Viện — Hồ Trung Hiếu — 6.786.000đ', '/admin/orders.html#order-20', 20, 13, 8, 1, '2026-05-22 23:37:33', 0, '2026-05-22 16:33:56'),
(18, 'advance_request', 'Yêu cầu ứng lương mới', 'Như yêu cầu ứng 100.000đ kỳ 2026-05', '/admin/staff.html', NULL, NULL, 6, 1, '2026-05-26 13:12:11', 0, '2026-05-22 16:56:52'),
(19, 'order_receive_uploaded', 'ORD-2205-012: KTV upload anh', 'Trần Quốc Viện — Hồ Trung Hiếu', '/admin/orders.html#order-31', 31, 13, 8, 1, '2026-05-23 00:00:09', 0, '2026-05-22 17:00:00'),
(20, 'order_completed', 'ORD-2205-012: KTV hoàn thành', 'Trần Quốc Viện — Hồ Trung Hiếu — 3.594.000đ', '/admin/orders.html#order-31', 31, 13, 8, 1, '2026-05-23 00:31:28', 0, '2026-05-22 17:00:16'),
(21, 'advance_request', 'Yêu cầu ứng lương mới', 'Như yêu cầu ứng 100.000đ kỳ 2026-05', '/admin/staff.html', NULL, NULL, 6, 1, '2026-05-26 13:12:11', 0, '2026-05-23 04:05:16'),
(22, 'order_completed', 'ORD-2205-009: KTV hoàn thành', 'nhân sự của dân test — khách của dân test đừng xoá — 378.000đ', '/admin/orders.html#order-28', 28, 11, 7, 1, '2026-05-26 13:12:11', 0, '2026-05-23 04:35:59'),
(23, 'order_receive_uploaded', 'ORD-2205-009: KTV upload anh', 'nhân sự của dân test — khách của dân test đừng xoá', '/admin/orders.html#order-28', 28, 11, 7, 1, '2026-05-26 13:12:11', 0, '2026-05-23 04:36:01'),
(24, 'order_receive_uploaded', 'ORD-2305-004: KTV upload anh', 'Trần Quốc Viện — Hồ Trung Hiếu', '/admin/orders.html#order-36', 36, 13, 8, 1, '2026-05-26 13:12:11', 0, '2026-05-23 15:46:27'),
(25, 'order_completed', 'ORD-2305-004: KTV hoàn thành', 'Trần Quốc Viện — Hồ Trung Hiếu — 972.000đ', '/admin/orders.html#order-36', 36, 13, 8, 1, '2026-05-26 13:12:11', 0, '2026-05-23 15:47:26'),
(26, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'Hồ Trung Hiếu: thêm tài khoản, thêm biển số', '/admin/customers.html?customer_id=13&tab=requests', 36, 13, 8, 1, '2026-05-26 13:12:11', 0, '2026-05-23 15:47:52'),
(27, 'order_receive_uploaded', 'ORD-2405-001: KTV upload anh', 'Nguyễn Lý Thoại — Quyên Quyên', '/admin/orders.html#order-37', 37, 18, 2, 1, '2026-05-26 13:12:11', 0, '2026-05-24 14:31:36'),
(28, 'order_completed', 'ORD-2405-001: KTV hoàn thành', 'Nguyễn Lý Thoại — Quyên Quyên — 53.898.000đ', '/admin/orders.html#order-37', 37, 18, 2, 1, '2026-05-26 13:12:11', 0, '2026-05-24 14:33:36'),
(29, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'Quyên Quyên: thêm tài khoản', '/admin/customers.html?customer_id=18&tab=requests', 37, 18, 2, 1, '2026-05-26 13:12:11', 0, '2026-05-24 14:33:57'),
(30, 'order_receive_uploaded', 'ORD-2405-003: KTV upload anh', 'Nguyễn Lý Thoại — Huong Ly', '/admin/orders.html#order-40', 40, 15, 2, 1, '2026-05-26 13:12:11', 0, '2026-05-24 15:03:56'),
(31, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'Huong Ly: thêm tài khoản, thêm biển số', '/admin/customers.html?customer_id=15&tab=requests', 40, 15, 2, 1, '2026-05-25 13:30:11', 0, '2026-05-24 15:05:24'),
(32, 'order_receive_uploaded', 'ORD-2605-001: KTV upload anh', 'Trần Quốc Viện — Hồ Trung Hiếu', '/admin/orders.html#order-52', 52, 13, 8, 1, '2026-05-26 13:12:11', 0, '2026-05-26 03:16:18'),
(33, 'order_completed', 'ORD-2605-001: KTV hoàn thành', 'Trần Quốc Viện — Hồ Trung Hiếu — 4.752.000đ', '/admin/orders.html#order-52', 52, 13, 8, 1, '2026-05-26 13:12:11', 0, '2026-05-26 03:20:03'),
(34, 'order_completed', 'ORD-3005-001: KTV hoàn thành', 'Nguyễn Lý Thoại — VẬN TẢI HỮU NGUYÊN — 972.000đ', '/admin/orders.html#order-94', 94, 44, 2, 1, '2026-06-01 18:16:58', 0, '2026-05-30 02:01:31'),
(35, 'order_receive_uploaded', 'ORD-3005-001: KTV upload anh', 'Nguyễn Lý Thoại — VẬN TẢI HỮU NGUYÊN', '/admin/orders.html#order-94', 94, 44, 2, 1, '2026-05-30 11:44:58', 0, '2026-05-30 02:17:29'),
(36, 'order_receive_uploaded', 'ORD-2905-006: KTV upload anh', 'Nguyễn Lý Thoại — nguyenlehunglam  51H-307.93', '/admin/orders.html#order-91', 91, 60, 2, 1, '2026-06-01 18:16:58', 0, '2026-05-30 02:24:52'),
(37, 'order_receive_uploaded', 'ORD-2605-005: KTV upload anh', 'Nguyễn Lý Thoại — ANH NHÂN', '/admin/orders.html#order-57', 57, 35, 2, 1, '2026-06-01 18:07:16', 0, '2026-05-30 02:25:41'),
(38, 'order_receive_uploaded', 'ORD-0106-001: KTV upload anh', 'Nguyễn Lý Thoại — Tuấn Kiệt', '/admin/orders.html#order-102', 102, 68, 2, 1, '2026-06-01 18:07:00', 0, '2026-06-01 08:08:39'),
(39, 'order_completed', 'ORD-0106-001: KTV hoàn thành', 'Nguyễn Lý Thoại — Tuấn Kiệt — 3.000.000đ', '/admin/orders.html#order-102', 102, 68, 2, 1, '2026-06-01 16:42:16', 0, '2026-06-01 08:09:26'),
(40, 'order_receive_uploaded', 'ORD-2605-002: KTV upload anh', 'Trần Quốc Viện — CHỊ THƠM', '/admin/orders.html#order-54', 54, 32, 8, 1, '2026-06-03 13:27:56', 0, '2026-06-02 08:36:39'),
(41, 'order_completed', 'ORD-2605-002: KTV hoàn thành', 'Trần Quốc Viện — CHỊ THƠM — 11.664.000đ', '/admin/orders.html#order-54', 54, 32, 8, 1, '2026-06-03 13:27:56', 0, '2026-06-02 08:36:59'),
(42, 'order_completed', 'ORD-0206-003: KTV hoàn thành', 'Trần Quốc Viện — ANH PHONG 247 — 15.336.000đ', '/admin/orders.html#order-113', 113, 24, 8, 1, '2026-06-03 13:27:56', 0, '2026-06-02 08:37:24'),
(43, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'ANH PHONG 247: thêm tài khoản', '/admin/customers.html?customer_id=24&tab=requests', 113, 24, 8, 1, '2026-06-03 13:27:56', 0, '2026-06-02 08:37:28'),
(44, 'order_completed', 'ORD-2805-009: KTV hoàn thành', 'Trần Quốc Viện — ngocphuong2 — 8.100.000đ', '/admin/orders.html#order-83', 83, 52, 8, 1, '2026-06-03 13:27:56', 0, '2026-06-02 08:39:38'),
(45, 'order_receive_uploaded', 'ORD-2805-009: KTV upload anh', 'Trần Quốc Viện — ngocphuong2', '/admin/orders.html#order-83', 83, 52, 8, 1, '2026-06-03 13:27:56', 0, '2026-06-02 08:39:41'),
(46, 'order_receive_uploaded', 'ORD-0206-003: KTV upload anh', 'Trần Quốc Viện — ANH PHONG 247', '/admin/orders.html#order-113', 113, 24, 8, 1, '2026-06-02 16:25:03', 0, '2026-06-02 08:50:20'),
(47, 'order_receive_uploaded', 'ORD-0306-002: KTV upload anh', 'Trần Quốc Viện — CÔNG TY TNHH THIÊN GIANG ANH TRANSPORT', '/admin/orders.html#order-119', 119, 83, 8, 1, '2026-06-03 13:27:56', 0, '2026-06-03 03:49:29'),
(48, 'order_completed', 'ORD-0306-002: KTV hoàn thành', 'Trần Quốc Viện — CÔNG TY TNHH THIÊN GIANG ANH TRANSPORT — 3.888.000đ', '/admin/orders.html#order-119', 119, 83, 8, 1, '2026-06-03 13:27:56', 0, '2026-06-03 03:49:40'),
(49, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'CÔNG TY TNHH THIÊN GIANG ANH TRANSPORT: thêm tài khoản, thêm biển số', '/admin/customers.html?customer_id=83&tab=requests', 119, 83, 8, 1, '2026-06-03 13:27:45', 0, '2026-06-03 03:49:41'),
(50, 'order_receive_uploaded', 'ORD-0306-009: KTV upload anh', 'Nguyễn Lý Thoại — Nguyễn Hoàng Trung Viễn', '/admin/orders.html#order-127', 127, 59, 2, 1, '2026-06-04 09:05:08', 0, '2026-06-03 12:47:48'),
(51, 'order_receive_uploaded', 'ORD-0406-006: KTV upload anh', 'Trần Quốc Viện — Anh Luân', '/admin/orders.html#order-136', 136, 21, 8, 1, '2026-06-04 14:14:34', 0, '2026-06-04 07:13:45'),
(52, 'order_completed', 'ORD-0406-006: KTV hoàn thành', 'Trần Quốc Viện — Anh Luân — 810.000đ', '/admin/orders.html#order-136', 136, 21, 8, 1, '2026-06-04 14:52:24', 0, '2026-06-04 07:14:34'),
(53, 'order_receive_uploaded', 'ORD-0406-011: KTV upload anh', 'Nguyễn Lý Thoại — CÔNG TY TNHH CHẾ BIẾN NÔNG HẢI SẢN BIỂN XANH', '/admin/orders.html#order-144', 144, 91, 2, 1, '2026-06-05 09:07:31', 0, '2026-06-04 11:03:59'),
(54, 'order_completed', 'ORD-0406-011: KTV hoàn thành', 'Nguyễn Lý Thoại — CÔNG TY TNHH CHẾ BIẾN NÔNG HẢI SẢN BIỂN XANH — 7.560.000đ', '/admin/orders.html#order-144', 144, 91, 2, 1, '2026-06-05 09:07:31', 0, '2026-06-04 11:04:41'),
(55, 'order_receive_uploaded', 'ORD-0406-013: KTV upload anh', 'Nguyễn Lý Thoại — Đông Phương', '/admin/orders.html#order-147', 147, 93, 2, 1, '2026-06-05 09:07:31', 0, '2026-06-04 13:46:38'),
(56, 'order_completed', 'ORD-0406-013: KTV hoàn thành', 'Nguyễn Lý Thoại — Đông Phương — 810.000đ', '/admin/orders.html#order-147', 147, 93, 2, 1, '2026-06-05 09:07:31', 0, '2026-06-04 13:47:09'),
(57, 'order_receive_uploaded', 'ORD-0406-010: KTV upload anh', 'Nguyễn Lý Thoại — CÔNG TY TNHH MTV THỰC PHẨM ÀO ÀO', '/admin/orders.html#order-142', 142, 90, 2, 1, '2026-06-05 16:21:08', 0, '2026-06-05 06:57:04'),
(58, 'order_completed', 'ORD-0406-010: KTV hoàn thành', 'Nguyễn Lý Thoại — CÔNG TY TNHH MTV THỰC PHẨM ÀO ÀO — 12.659.760đ', '/admin/orders.html#order-142', 142, 90, 2, 1, '2026-06-05 16:21:08', 0, '2026-06-05 08:25:46'),
(59, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'ANH NHÂN: thêm tài khoản, thêm biển số', '/admin/customers.html?customer_id=35&tab=requests', 57, 35, 2, 1, '2026-06-05 16:40:58', 0, '2026-06-05 09:35:49'),
(60, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'nguyenlehunglam  51H-307.93: thêm tài khoản, thêm biển số', '/admin/customers.html?customer_id=60&tab=requests', 91, 60, 2, 1, '2026-06-05 16:40:58', 0, '2026-06-05 09:39:41'),
(61, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'CÔNG TY TNHH MTV THỰC PHẨM ÀO ÀO: thêm tài khoản', '/admin/customers.html?customer_id=90&tab=requests', 142, 90, 2, 1, '2026-06-08 13:16:37', 0, '2026-06-05 09:51:44'),
(62, 'order_completed', 'ORD-0506-006: KTV hoàn thành', 'Trần Quốc Viện — Nghiale — 1.080.000đ', '/admin/orders.html#order-153', 153, 97, 8, 1, '2026-06-08 13:16:37', 0, '2026-06-05 13:18:05'),
(63, 'order_receive_uploaded', 'ORD-0606-001: KTV upload anh', 'Nguyễn Lý Thoại — Anh Luân', '/admin/orders.html#order-155', 155, 21, 2, 1, '2026-06-08 13:16:37', 0, '2026-06-06 02:13:44'),
(64, 'order_completed', 'ORD-0606-001: KTV hoàn thành', 'Nguyễn Lý Thoại — Anh Luân — 810.000đ', '/admin/orders.html#order-155', 155, 21, 2, 1, '2026-06-08 13:16:37', 0, '2026-06-06 02:13:57'),
(65, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'Anh Luân: thêm tài khoản, thêm biển số', '/admin/customers.html?customer_id=21&tab=requests', 155, 21, 2, 1, '2026-06-08 13:16:37', 0, '2026-06-06 02:14:18'),
(66, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'Anh Luân: sửa tài khoản', '/admin/customers.html?customer_id=21&tab=requests', 155, 21, 2, 1, '2026-06-08 13:16:37', 0, '2026-06-07 03:48:42'),
(67, 'order_completed', 'ORD-0606-006: KTV hoàn thành', 'Trần Quốc Viện — vovanle — 100.000đ', '/admin/orders.html#order-161', 161, 101, 8, 1, '2026-06-08 15:17:29', 0, '2026-06-08 08:12:26'),
(68, 'order_receive_uploaded', 'ORD-0606-006: KTV upload ảnh', 'Trần Quốc Viện — vovanle', '/admin/orders.html#order-161', 161, 101, 8, 1, '2026-06-08 15:17:17', 0, '2026-06-08 08:12:29');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `code` varchar(30) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `dealer_id` int(11) DEFAULT NULL,
  `total_amount` bigint(20) NOT NULL DEFAULT 0,
  `subtotal` bigint(20) NOT NULL DEFAULT 0,
  `paid_amount` bigint(20) NOT NULL DEFAULT 0,
  `debt_carried_at` datetime DEFAULT NULL,
  `debt_settlement_id` int(11) DEFAULT NULL,
  `payment_method` enum('cash','transfer','debt') NOT NULL DEFAULT 'cash',
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `progress_note` text DEFAULT NULL,
  `payment_status` enum('unpaid','partial','paid','customer_owes','pending_admin_confirm','staff_owes','refunded') NOT NULL DEFAULT 'unpaid',
  `collected_for_dealer` tinyint(1) NOT NULL DEFAULT 0,
  `has_return` tinyint(1) NOT NULL DEFAULT 0,
  `seen_at` datetime DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `assigned_staff_id` int(11) DEFAULT NULL,
  `due_at` datetime DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `wage_amount` bigint(20) NOT NULL DEFAULT 0,
  `tech_commission_amount` bigint(20) NOT NULL DEFAULT 0,
  `tech_commission_approved_at` datetime DEFAULT NULL,
  `tech_commission_approved_by` int(11) DEFAULT NULL,
  `tech_commission_note` varchar(300) DEFAULT NULL,
  `ktv_note` text DEFAULT NULL,
  `note` text DEFAULT NULL,
  `creator_type` enum('customer','dealer','admin','staff') NOT NULL DEFAULT 'admin',
  `creator_id` int(11) DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `confirmed_by` int(11) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `end_customer_id` int(11) DEFAULT NULL COMMENT 'Khach hang dau cuoi cua dai ly (retail). NULL = chinh dai ly hoac khach le thong thuong',
  `tech_commission_requested_by` int(11) DEFAULT NULL,
  `tech_commission_requested_at` datetime DEFAULT NULL,
  `payslip_id` int(11) DEFAULT NULL,
  `service_kind` enum('install','maintenance','warranty','renewal','badge','consult') NOT NULL DEFAULT 'install'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `orders`
--

INSERT INTO `orders` (`id`, `code`, `customer_id`, `dealer_id`, `total_amount`, `subtotal`, `paid_amount`, `debt_carried_at`, `debt_settlement_id`, `payment_method`, `status`, `progress_note`, `payment_status`, `collected_for_dealer`, `has_return`, `seen_at`, `address`, `assigned_staff_id`, `due_at`, `started_at`, `completed_at`, `wage_amount`, `tech_commission_amount`, `tech_commission_approved_at`, `tech_commission_approved_by`, `tech_commission_note`, `ktv_note`, `note`, `creator_type`, `creator_id`, `confirmed_at`, `confirmed_by`, `is_deleted`, `created_at`, `end_customer_id`, `tech_commission_requested_by`, `tech_commission_requested_at`, `payslip_id`, `service_kind`) VALUES
(50, 'ORD-2505-001', 19, NULL, 3942000, 3942000, 0, '2026-05-28 15:02:48', NULL, 'debt', 'done', '[25/05/2026 11:47 - admin] Tạo đơn\n[25/05/2026 13:35 - admin] Chuyển trạng thái → done\n', 'customer_owes', 0, 0, NULL, '31/2A Tân Trụ, Phường Tân Sơn, TP Hồ Chí Minh, Việt Nam', NULL, NULL, NULL, '2026-05-25 13:35:49', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-05-25 04:47:51', NULL, NULL, NULL, NULL, 'install'),
(52, 'ORD-2605-001', 13, NULL, 4752000, 4752000, 9504000, NULL, NULL, 'debt', 'done', '[26/05/2026 10:20 - ktv157123] KTV hoàn thành đơn\n[27/05/2026 15:04 - nv224895] NV nhận 4.752.000đ (Chuyển khoản) — NNT-2705-006\n[09/06/2026 09:48 - admin] Xác nhận nhận 4.752.000đ từ khách\n', 'paid', 0, 0, NULL, '985/71/12/27 Hương Lộ 2, Phường Bình Trị Đông, Thành phố Hồ Chí Minh, Việt Nam', 8, NULL, '2026-05-26 10:15:21', '2026-05-26 10:20:03', 600000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-05-26 03:11:51', NULL, NULL, NULL, NULL, 'install'),
(54, 'ORD-2605-002', 32, NULL, 11664000, 11664000, 0, NULL, NULL, 'debt', 'done', '[26/05/2026 11:05 - nv409671] Tạo đơn\n[26/05/2026 20:05 - admin] Xoá hoa hồng nhân viên\n[02/06/2026 15:36 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, '55 Đường 6B nối dài, KDC Vĩnh Lộc, Phường Bình Tân, TP Hồ Chí Minh, Việt Nam', 8, NULL, '2026-05-26 11:17:56', '2026-06-02 15:36:59', 750000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-05-26 04:05:20', NULL, NULL, NULL, NULL, 'install'),
(55, 'ORD-2605-003', 33, NULL, 972000, 972000, 972000, NULL, NULL, 'debt', 'done', '[26/05/2026 11:48 - nv224895] Tạo đơn\n[26/05/2026 11:49 - nv224895] NV nhận 972.000đ (Chuyển khoản) — NNT-2605-001\n[26/05/2026 11:49 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-26 11:49:27', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-26 04:48:39', NULL, NULL, NULL, NULL, 'install'),
(56, 'ORD-2605-004', 34, NULL, 3000000, 3000000, 3000000, NULL, NULL, 'debt', 'done', '[26/05/2026 15:02 - nv224895] Tạo đơn\n[26/05/2026 15:04 - nv224895] NV nhận 3.000.000đ (Chuyển khoản) — NNT-2605-002\n[26/05/2026 15:04 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-26 15:04:27', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-26 08:02:06', NULL, NULL, NULL, NULL, 'install'),
(57, 'ORD-2605-005', 35, NULL, 972000, 972000, 972000, NULL, NULL, 'debt', 'done', '[26/05/2026 15:19 - nv409671] Tạo đơn\n[26/05/2026 20:05 - admin] Xoá hoa hồng nhân viên\n[27/05/2026 09:36 - nv224895] NV nhận 972.000đ (Tiền mặt) — NNT-2705-003\n[27/05/2026 15:19 - nv224895] Chuyển trạng thái → in_progress\n[27/05/2026 15:20 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-05-27 15:20:09', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-05-26 08:19:11', NULL, NULL, NULL, NULL, 'install'),
(58, 'ORD-2605-006', 36, NULL, 3213000, 3213000, 3213000, NULL, NULL, 'debt', 'done', '[26/05/2026 15:20 - nv224895] Tạo đơn\n[26/05/2026 15:21 - nv224895] NV nhận 3.213.000đ (Tiền mặt) — NNT-2605-003\n[26/05/2026 15:21 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-26 15:21:31', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-26 08:20:58', NULL, NULL, NULL, NULL, 'install'),
(59, 'ORD-2605-007', 37, NULL, 26460000, 26460000, 26460000, NULL, NULL, 'debt', 'done', '[26/05/2026 15:45 - nv224895] Tạo đơn\n[27/05/2026 15:04 - nv224895] NV nhận 26.460.000đ (Chuyển khoản) — NNT-2705-005\n[27/05/2026 15:04 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, '0934269691', NULL, NULL, NULL, '2026-05-27 15:04:14', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-26 08:45:45', NULL, NULL, NULL, NULL, 'install'),
(60, 'ORD-2605-008', 37, NULL, 5184000, 5184000, 5184000, NULL, NULL, 'debt', 'done', '[26/05/2026 16:27 - nv224895] Tạo đơn\n[27/05/2026 15:03 - nv224895] NV nhận 5.184.000đ (Chuyển khoản) — NNT-2705-004\n[27/05/2026 15:03 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, '0934269691', NULL, NULL, NULL, '2026-05-27 15:03:57', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-26 09:27:23', NULL, NULL, NULL, NULL, 'install'),
(61, 'ORD-2605-009', 38, NULL, 700000, 700000, 700000, NULL, NULL, 'debt', 'done', '[26/05/2026 16:47 - admin] Tạo đơn\n[27/05/2026 09:09 - nv224895] NV nhận 700.000đ (Chuyển khoản) — NNT-2705-001\n[27/05/2026 09:09 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-27 09:09:29', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-05-26 09:47:27', NULL, NULL, NULL, NULL, 'install'),
(64, 'ORD-2705-001', 39, NULL, 750000, 750000, 0, NULL, NULL, 'debt', 'cancelled', '[27/05/2026 09:01 - nv224895] Tạo đơn\n[27/05/2026 09:27 - nv224895] Huỷ đơn\n', 'unpaid', 0, 0, NULL, NULL, 2, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-27 02:01:58', NULL, NULL, NULL, NULL, 'install'),
(65, 'ORD-2705-002', 40, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[27/05/2026 09:32 - nv224895] Tạo đơn\n[27/05/2026 09:32 - nv224895] NV nhận 750.000đ (Tiền mặt) — NNT-2705-002\n[27/05/2026 09:32 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-27 09:32:50', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-27 02:32:12', NULL, NULL, NULL, NULL, 'install'),
(66, 'ORD-2705-003', 41, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[27/05/2026 16:36 - nv224895] Tạo đơn\n[27/05/2026 16:36 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-2705-007\n[27/05/2026 16:37 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-27 16:37:01', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-27 09:36:41', NULL, NULL, NULL, NULL, 'install'),
(67, 'ORD-2705-004', 42, NULL, 919600, 919600, 919600, NULL, NULL, 'debt', 'done', '[27/05/2026 17:15 - nv224895] Tạo đơn\n[27/05/2026 17:15 - nv224895] NV nhận 919.600đ (Chuyển khoản) — NNT-2705-008\n[27/05/2026 17:15 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-27 17:15:51', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-27 10:15:00', NULL, NULL, NULL, NULL, 'install'),
(68, 'ORD-2705-005', 28, NULL, 450000, 450000, 450000, NULL, NULL, 'debt', 'done', '[27/05/2026 17:24 - nv224895] Tạo đơn\n[27/05/2026 17:24 - nv224895] NV nhận 450.000đ (Chuyển khoản) — NNT-2705-009\n[27/05/2026 17:24 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-27 17:24:42', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-27 10:24:01', NULL, NULL, NULL, NULL, 'install'),
(70, 'ORD-2705-006', 43, NULL, 0, 0, 0, NULL, NULL, 'debt', 'done', '[27/05/2026 17:26 - nv224895] Tạo đơn\n[27/05/2026 17:26 - nv224895] Chuyển trạng thái → done\n', 'unpaid', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-05-27 17:26:43', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-27 10:26:33', NULL, NULL, NULL, NULL, 'install'),
(72, 'ORD-2705-007', 44, NULL, 11232000, 11232000, 11232000, NULL, NULL, 'debt', 'done', '[27/05/2026 17:33 - nv224895] Tạo đơn\n[27/05/2026 17:33 - nv224895] Chuyển trạng thái → in_progress\n[30/05/2026 08:18 - admin] Chuyển trạng thái → done\n[30/05/2026 08:19 - admin] Ghi nhận thu 11.232.000đ (Chuyển khoản)\n', 'paid', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-05-30 08:18:53', 1050000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-27 10:33:07', NULL, NULL, NULL, NULL, 'install'),
(73, 'ORD-2805-001', 45, NULL, 480000, 480000, 480000, NULL, NULL, 'debt', 'done', '[28/05/2026 08:33 - nv224895] Tạo đơn\n[28/05/2026 08:34 - nv224895] NV nhận 480.000đ (Tiền mặt) — NNT-2805-001\n[28/05/2026 08:34 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-28 08:34:15', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-28 01:33:58', NULL, NULL, NULL, NULL, 'install'),
(74, 'ORD-2805-002', 46, NULL, 4000000, 4000000, 4000000, NULL, NULL, 'debt', 'done', '[28/05/2026 13:11 - nv224895] Tạo đơn\n[28/05/2026 13:42 - nv224895] NV nhận 4.000.000đ (Chuyển khoản) — NNT-2805-005\n[28/05/2026 13:42 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-28 13:42:59', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-28 06:11:02', NULL, NULL, NULL, NULL, 'install'),
(75, 'ORD-2805-003', 47, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[28/05/2026 13:22 - nv224895] Tạo đơn\n[28/05/2026 13:22 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-2805-002\n[28/05/2026 13:22 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-28 13:22:16', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-28 06:22:00', NULL, NULL, NULL, NULL, 'install'),
(76, 'ORD-2805-004', 37, NULL, 8000000, 8000000, 8000000, NULL, NULL, 'debt', 'done', '[28/05/2026 13:30 - nv224895] Tạo đơn\n[28/05/2026 13:42 - nv224895] NV nhận 8.000.000đ (Chuyển khoản) — NNT-2805-004\n[28/05/2026 13:42 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, '0934269691', NULL, NULL, NULL, '2026-05-28 13:42:44', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-28 06:30:45', NULL, NULL, NULL, NULL, 'install'),
(78, 'ORD-2805-005', 48, NULL, 150000, 150000, 150000, NULL, NULL, 'debt', 'done', '[28/05/2026 13:33 - nv224895] Tạo đơn\n[28/05/2026 13:35 - nv224895] NV nhận 150.000đ (Tiền mặt) — NNT-2805-003\n[28/05/2026 13:55 - nv224895] Chuyển trạng thái → in_progress\n[28/05/2026 13:55 - nv224895] Chuyển trạng thái → done\n[30/05/2026 12:00 - admin] Thêm hoa hồng nhân viên Trần Quốc Viện: 100.000đ\n', 'paid', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-05-28 13:55:28', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-28 06:33:02', NULL, NULL, NULL, NULL, 'install'),
(79, 'ORD-2805-006', 49, NULL, 12425000, 12425000, 0, NULL, NULL, 'debt', 'confirmed', '[28/05/2026 13:49 - nv224895] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-28 06:49:41', NULL, NULL, NULL, NULL, 'install'),
(80, 'ORD-2805-007', 50, NULL, 3105000, 3105000, 3105000, NULL, NULL, 'debt', 'done', '[28/05/2026 13:59 - nv224895] Tạo đơn\n[28/05/2026 14:00 - nv224895] NV nhận 3.105.000đ (Chuyển khoản) — NNT-2805-006\n[28/05/2026 14:00 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-28 14:00:47', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-28 06:59:58', NULL, NULL, NULL, NULL, 'install'),
(81, 'ORD-2805-008', 51, NULL, 8000000, 8000000, 8000000, NULL, NULL, 'debt', 'done', '[28/05/2026 14:50 - admin] Tạo đơn\n[28/05/2026 14:56 - admin] Cập nhật thông tin đơn\n[28/05/2026 14:56 - admin] Cập nhật thông tin đơn\n[28/05/2026 14:56 - admin] Cập nhật thông tin đơn\n[28/05/2026 14:56 - admin] Cập nhật thông tin đơn\n[01/06/2026 16:12 - nv409671] NV nhận 8.000.000đ (Chuyển khoản) — NNT-0106-007\n[01/06/2026 16:12 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, 'Số 26/11 Đường Vĩnh Tân 21, Tổ 1, Khu phố 4, Phường Vĩnh Tân, Thành phố', NULL, NULL, NULL, '2026-06-01 16:12:49', 0, 0, NULL, NULL, NULL, NULL, 'Giá đã bao gồm VAT', 'admin', 1, NULL, NULL, 0, '2026-05-28 07:50:38', NULL, NULL, NULL, NULL, 'install'),
(83, 'ORD-2805-009', 52, NULL, 8100000, 8100000, 8100000, '2026-06-06 09:48:20', NULL, 'debt', 'done', '[28/05/2026 16:18 - nv409671] Tạo đơn\n[29/05/2026 09:14 - admin] Duyệt hoa hồng nhân viên: 100.000đ\n[30/05/2026 11:59 - nv224895] Gán KTV: Trần Quốc Viện\n[30/05/2026 12:00 - nv224895] Gán KTV: Trần Quốc Viện\n[02/06/2026 15:39 - ktv157123] KTV hoàn thành đơn\n[06/06/2026 09:48 - nv224895] NV nhận 8.316.000đ (Chuyển khoản) qua phiếu YC-0606-001 — NNT-0606-001\n', 'paid', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-02 15:39:38', 750000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-05-28 09:18:47', NULL, NULL, NULL, NULL, 'install'),
(84, 'ORD-2805-010', 53, NULL, 6272000, 6272000, 6272000, NULL, NULL, 'debt', 'done', '[28/05/2026 16:33 - nv409671] Tạo đơn\n[28/05/2026 16:33 - nv409671] Cập nhật nội dung dòng công việc\n[28/05/2026 17:07 - nv224895] Chuyển trạng thái → done\n[29/05/2026 08:59 - nv224895] NV nhận 6.272.000đ (Tiền mặt) — NNT-2905-002\n', 'paid', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-05-28 17:07:24', 400000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-05-28 09:33:22', NULL, NULL, NULL, NULL, 'install'),
(85, 'ORD-2905-001', 54, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[29/05/2026 08:52 - admin] Tạo đơn\n[29/05/2026 09:44 - admin] Chuyển trạng thái → done\n[29/05/2026 09:45 - admin] Ghi nhận thu 750.000đ (Tiền mặt)\n', 'paid', 0, 0, NULL, '50 Phạm Hữu Lầu, Phú Mỹ, Quận 7', NULL, NULL, NULL, '2026-05-29 09:44:46', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-05-29 01:52:57', NULL, NULL, NULL, NULL, 'install'),
(86, 'ORD-2905-002', 55, NULL, 1200000, 1200000, 1200000, NULL, NULL, 'debt', 'done', '[29/05/2026 08:58 - nv224895] Tạo đơn\n[29/05/2026 08:58 - nv224895] NV nhận 1.200.000đ (Chuyển khoản) — NNT-2905-001\n[29/05/2026 08:58 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-29 08:58:50', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-29 01:58:36', NULL, NULL, NULL, NULL, 'install'),
(87, 'ORD-2905-003', 56, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[29/05/2026 08:59 - admin] Tạo đơn\n[29/05/2026 09:01 - admin] Cập nhật thông tin đơn\n[29/05/2026 15:05 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-2905-005\n[29/05/2026 15:05 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, 'Số 7 đường 36 Linh Đông, HCM', NULL, NULL, NULL, '2026-05-29 15:05:59', 0, 0, NULL, NULL, NULL, NULL, '29H92515', 'admin', 1, NULL, NULL, 0, '2026-05-29 01:59:54', NULL, NULL, NULL, NULL, 'install'),
(88, 'ORD-2905-004', 57, NULL, 2250000, 2250000, 0, NULL, NULL, 'debt', 'confirmed', '[29/05/2026 09:59 - nv224895] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-29 02:59:52', NULL, NULL, NULL, NULL, 'install'),
(89, 'ORD-2905-005', 59, NULL, 20520000, 20520000, 0, NULL, NULL, 'debt', 'confirmed', '[29/05/2026 13:50 - admin] Tạo đơn\n[29/05/2026 13:52 - admin] Thêm hoa hồng nhân viên Phương Quyên: 20.000đ\n', 'unpaid', 0, 0, NULL, '96/4 Đường số 9, Phường Linh Xuân, HCM', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-05-29 06:50:11', NULL, NULL, NULL, NULL, 'install'),
(91, 'ORD-2905-006', 60, NULL, 810000, 810000, 810000, NULL, NULL, 'debt', 'done', '[29/05/2026 13:53 - nv224895] Tạo đơn\n[29/05/2026 13:53 - nv224895] NV nhận 810.000đ (Chuyển khoản) — NNT-2905-003\n[29/05/2026 13:53 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-05-29 13:53:24', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-29 06:53:10', NULL, NULL, NULL, NULL, 'install'),
(92, 'ORD-2905-007', 61, NULL, 2500000, 2500000, 2500000, NULL, NULL, 'debt', 'done', '[29/05/2026 14:55 - nv224895] Tạo đơn\n[29/05/2026 14:55 - nv224895] NV nhận 2.500.000đ (Tiền mặt) — NNT-2905-004\n[29/05/2026 14:55 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-29 14:55:48', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-29 07:55:13', NULL, NULL, NULL, NULL, 'install'),
(93, 'ORD-2905-008', 62, NULL, 1800000, 1800000, 1800000, NULL, NULL, 'debt', 'done', '[29/05/2026 15:21 - nv409671] Tạo đơn\n[29/05/2026 15:21 - nv409671] Cập nhật thông tin đơn\n[29/05/2026 16:24 - nv224895] NV nhận 1.800.000đ (Chuyển khoản) — NNT-2905-006\n[29/05/2026 16:24 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-29 16:24:51', 0, 0, NULL, NULL, NULL, NULL, '50E15842', 'admin', 6, NULL, NULL, 0, '2026-05-29 08:21:11', NULL, NULL, NULL, NULL, 'install'),
(94, 'ORD-3005-001', 44, NULL, 972000, 972000, 0, NULL, NULL, 'debt', 'done', '[30/05/2026 08:22 - admin] Tạo đơn\n[30/05/2026 08:22 - admin] Thêm hoa hồng nhân viên Phương Quyên: 9.720đ\n[30/05/2026 08:33 - admin] Gán KTV: Trần Quốc Viện\n[30/05/2026 08:36 - admin] Gán KTV: Nguyễn Lý Thoại\n[30/05/2026 09:01 - ktv885380] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-05-30 09:01:31', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-05-30 01:22:23', NULL, NULL, NULL, NULL, 'install'),
(95, 'ORD-3005-002', 65, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[30/05/2026 10:22 - nv224895] Tạo đơn\n[30/05/2026 10:44 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-3005-001\n[30/05/2026 10:44 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-30 10:44:48', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-30 03:22:10', NULL, NULL, NULL, NULL, 'install'),
(96, 'ORD-3005-003', 44, NULL, 3000000, 3000000, 0, NULL, NULL, 'debt', 'confirmed', '[30/05/2026 11:53 - admin] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-05-30 04:53:32', NULL, NULL, NULL, NULL, 'install'),
(97, 'ORD-3005-004', 66, NULL, 1200000, 1200000, 1200000, NULL, NULL, 'debt', 'done', '[30/05/2026 13:13 - admin] Tạo đơn\n[30/05/2026 13:13 - admin] Thêm hoa hồng nhân viên Phương Quyên: 12.000đ\n[30/05/2026 14:10 - nv224895] Cập nhật nội dung dòng công việc\n[30/05/2026 14:10 - nv224895] NV nhận 1.200.000đ (Chuyển khoản) — NNT-3005-002\n[30/05/2026 14:11 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-30 14:11:10', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-05-30 06:13:45', NULL, NULL, NULL, NULL, 'install'),
(98, 'ORD-3005-005', 67, NULL, 1320000, 1320000, 1320000, NULL, NULL, 'debt', 'done', '[30/05/2026 14:08 - nv224895] Tạo đơn\n[01/06/2026 09:32 - nv224895] NV nhận 1.320.000đ (Chuyển khoản) — NNT-0106-001\n[01/06/2026 09:32 - nv224895] Chuyển trạng thái → done\n[02/06/2026 09:47 - admin] Duyệt hoa hồng nhân viên: 10.000đ\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-01 09:32:22', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-30 07:08:44', NULL, NULL, NULL, NULL, 'install'),
(99, 'ORD-3005-006', 63, NULL, 2365000, 2365000, 2365000, NULL, NULL, 'debt', 'done', '[30/05/2026 17:51 - nv224895] Tạo đơn\n[30/05/2026 17:51 - nv224895] Chuyển trạng thái → done\n[30/05/2026 17:53 - nv224895] NV nhận 2.365.000đ (Chuyển khoản) — NNT-3005-003\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-30 17:51:44', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-30 10:51:38', NULL, NULL, NULL, NULL, 'install'),
(100, 'ORD-3005-007', 59, NULL, 23538000, 23538000, 0, NULL, NULL, 'debt', 'confirmed', '[30/05/2026 20:56 - admin] Tạo đơn\n', 'unpaid', 0, 0, NULL, '96/4 Đường số 9, Phường Linh Xuân, HCM', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-05-30 13:56:18', NULL, NULL, NULL, NULL, 'install'),
(102, 'ORD-0106-001', 68, NULL, 3000000, 3000000, 3000000, NULL, NULL, 'debt', 'done', '[02/06/2026 16:35 - admin] Thêm hoa hồng nhân viên Nguyễn Lý Thoại: 150.000đ\n', 'paid', 0, 0, NULL, 'Gần nhà ga T3', 2, NULL, NULL, '2026-06-01 15:09:26', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-01 02:42:03', NULL, NULL, NULL, NULL, 'install'),
(103, 'ORD-0106-002', 69, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[01/06/2026 10:14 - nv224895] Tạo đơn\n[01/06/2026 10:22 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-0106-004\n[01/06/2026 10:22 - nv224895] Chuyển trạng thái → done\n[02/06/2026 09:47 - admin] Duyệt hoa hồng nhân viên: 7.500đ\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-01 10:22:40', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-01 03:14:51', NULL, NULL, NULL, NULL, 'install'),
(104, 'ORD-0106-003', 70, NULL, 1800000, 1800000, 1800000, NULL, NULL, 'debt', 'done', '[01/06/2026 11:15 - nv224895] Tạo đơn\n[01/06/2026 11:16 - nv224895] Cập nhật nội dung dòng công việc\n[02/06/2026 08:35 - nv224895] NV nhận 1.800.000đ (Chuyển khoản) — NNT-0206-001\n[02/06/2026 16:31 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-02 16:31:17', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-01 04:15:44', NULL, NULL, NULL, NULL, 'install'),
(105, 'ORD-0106-004', 21, NULL, 810000, 810000, 0, '2026-06-03 13:06:41', NULL, 'debt', 'done', '[01/06/2026 11:50 - nv224895] Tạo đơn\n[01/06/2026 13:12 - nv224895] Chuyển trạng thái → done\n[03/06/2026 13:07 - nv224895] NV nhận 21.601.200đ (Tiền mặt) qua phiếu YC-0306-001 — NNT-0306-003\n', 'customer_owes', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-01 13:12:29', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-01 04:50:40', NULL, NULL, NULL, NULL, 'install'),
(106, 'ORD-0106-005', 71, NULL, 770000, 770000, 770000, NULL, NULL, 'debt', 'done', '[01/06/2026 13:59 - nv224895] Tạo đơn\n[01/06/2026 13:59 - nv224895] Cập nhật nội dung dòng công việc\n[01/06/2026 16:37 - nv224895] Cập nhật nội dung dòng công việc\n[01/06/2026 16:48 - nv224895] NV nhận 770.000đ (Chuyển khoản) — NNT-0106-008\n[01/06/2026 16:48 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-01 16:48:11', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-01 06:59:21', NULL, NULL, NULL, NULL, 'install'),
(107, 'ORD-0106-006', 74, NULL, 600000, 600000, 600000, NULL, NULL, 'debt', 'done', '[01/06/2026 15:59 - nv224895] Tạo đơn\n[01/06/2026 16:05 - nv224895] NV nhận 600.000đ (Chuyển khoản) — NNT-0106-005\n[01/06/2026 16:05 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-01 16:05:51', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-01 08:59:35', NULL, NULL, NULL, NULL, 'install'),
(108, 'ORD-0106-007', 75, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[01/06/2026 16:06 - nv224895] Tạo đơn\n[01/06/2026 16:10 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-0106-006\n[01/06/2026 16:10 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-01 16:10:57', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-01 09:06:42', NULL, NULL, NULL, NULL, 'install'),
(109, 'ORD-0106-008', 76, NULL, 1500000, 1500000, 1500000, NULL, NULL, 'debt', 'done', '[01/06/2026 16:49 - nv409671] Tạo đơn\n[01/06/2026 16:49 - nv409671] Cập nhật thông tin đơn\n[01/06/2026 16:51 - nv409671] NV nhận 1.500.000đ (Chuyển khoản) — NNT-0106-009\n[01/06/2026 16:51 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-01 16:51:32', 0, 0, NULL, NULL, NULL, NULL, '51D95565 - 51D95576', 'admin', 6, NULL, NULL, 0, '2026-06-01 09:49:10', NULL, NULL, NULL, NULL, 'install'),
(110, 'ORD-0206-001', 77, NULL, 2250000, 2250000, 2250000, NULL, NULL, 'debt', 'done', '[02/06/2026 09:17 - nv409671] Tạo đơn\n[02/06/2026 09:17 - nv409671] NV nhận 2.250.000đ (Chuyển khoản) — NNT-0206-002\n[02/06/2026 09:17 - nv409671] Chuyển trạng thái → done\n[02/06/2026 09:21 - nv409671] Cập nhật thông tin đơn\n', 'paid', 0, 0, NULL, '34 Trần Thị Tâm, Khu phố 1, Phường Quảng Trị, Tỉnh Quảng Trị, Việt Nam', NULL, NULL, NULL, '2026-06-02 09:17:37', 0, 0, NULL, NULL, NULL, NULL, '75H01927, 75H01551, 75H01541, 75H01558, 75H01535', 'admin', 6, NULL, NULL, 0, '2026-06-02 02:17:02', NULL, NULL, NULL, NULL, 'install'),
(111, 'ORD-0206-002', 78, NULL, 1680000, 1680000, 3360000, NULL, NULL, 'debt', 'done', '[02/06/2026 09:41 - nv224895] Tạo đơn\n[02/06/2026 09:41 - nv224895] Chuyển trạng thái → done\n[02/06/2026 09:41 - nv224895] NV nhận 1.680.000đ (Chuyển khoản) — NNT-0206-003\n[02/06/2026 09:41 - nv224895] NV nhận 1.680.000đ (Tiền mặt) — NNT-0206-004\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-02 09:41:03', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-02 02:41:00', NULL, NULL, NULL, NULL, 'install'),
(113, 'ORD-0206-003', 24, NULL, 15336000, 15336000, 0, NULL, NULL, 'debt', 'done', '[02/06/2026 10:08 - nv224895] Tạo đơn\n[02/06/2026 10:23 - nv224895] Cập nhật nội dung dòng công việc\n[02/06/2026 15:37 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-02 15:37:24', 1200000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-02 03:08:04', NULL, NULL, NULL, NULL, 'install'),
(114, 'ORD-0206-004', 79, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[02/06/2026 11:00 - nv224895] Tạo đơn\n[02/06/2026 11:01 - nv224895] Cập nhật nội dung dòng công việc\n[02/06/2026 11:20 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-0206-005\n[02/06/2026 11:20 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-02 11:20:23', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-02 04:00:30', NULL, NULL, NULL, NULL, 'install'),
(115, 'ORD-0206-005', 19, NULL, 11212000, 11212000, 0, NULL, NULL, 'debt', 'confirmed', '[02/06/2026 11:40 - admin] Tạo đơn\n[02/06/2026 13:53 - admin] Cập nhật nội dung dòng công việc\n', 'unpaid', 0, 0, NULL, '31/2A Tân Trụ, Phường Tân Sơn, TP Hồ Chí Minh, Việt Nam', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-02 04:40:05', NULL, NULL, NULL, NULL, 'install'),
(116, 'ORD-0206-006', 81, NULL, 1800000, 1800000, 1800000, NULL, NULL, 'debt', 'done', '[02/06/2026 17:14 - nv224895] Tạo đơn\n[02/06/2026 17:14 - nv224895] Chuyển trạng thái → done\n[02/06/2026 17:15 - nv224895] NV nhận 1.800.000đ (Chuyển khoản) — NNT-0206-006\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-02 17:14:30', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-02 10:14:27', NULL, NULL, NULL, NULL, 'install'),
(117, 'ORD-0206-007', 80, NULL, 0, 0, 0, NULL, NULL, 'debt', 'cancelled', '[02/06/2026 17:44 - admin] Tạo đơn\n[02/06/2026 17:44 - admin] Huỷ đơn\n', 'unpaid', 0, 0, NULL, '99 Test Street, Q1, HCM', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-02 10:44:31', NULL, NULL, NULL, NULL, 'install'),
(118, 'ORD-0306-001', 82, NULL, 13500000, 13500000, 13500000, NULL, NULL, 'debt', 'done', '[03/06/2026 08:40 - nv224895] Tạo đơn\n[03/06/2026 08:58 - nv224895] Chuyển trạng thái → done\n[03/06/2026 08:58 - nv224895] NV nhận 13.500.000đ (Chuyển khoản) — NNT-0306-001\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-03 08:58:18', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-03 01:40:14', NULL, NULL, NULL, NULL, 'install'),
(119, 'ORD-0306-002', 83, NULL, 3888000, 3888000, 0, NULL, NULL, 'debt', 'done', '[03/06/2026 09:03 - nv409671] Tạo đơn\n[03/06/2026 09:13 - nv409671] Gán KTV: Trần Quốc Viện\n[03/06/2026 10:49 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, 'Ô 127-128 Đường D33, khu phố 4, Phường An Phú, TP Hồ Chí Minh, Việt Nam', 8, NULL, '2026-06-03 10:47:40', '2026-06-03 10:49:40', 150000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-03 02:03:13', NULL, NULL, NULL, NULL, 'install'),
(120, 'ORD-0306-003', 59, NULL, 22050000, 22050000, 0, NULL, NULL, 'debt', 'done', '[03/06/2026 09:47 - nv224895] Tạo đơn\n[03/06/2026 13:30 - nv224895] Chuyển trạng thái → done\n', 'customer_owes', 0, 0, NULL, '96/4 Đường số 9, Phường Linh Xuân, HCM', NULL, NULL, NULL, '2026-06-03 13:30:52', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-03 02:47:57', NULL, NULL, NULL, NULL, 'install'),
(121, 'ORD-0306-004', 42, NULL, 2322000, 2322000, 2322000, NULL, NULL, 'debt', 'confirmed', '[03/06/2026 10:23 - nv224895] Tạo đơn\n[03/06/2026 10:38 - nv224895] NV nhận 2.322.000đ (Chuyển khoản) — NNT-0306-002\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-03 03:23:11', NULL, NULL, NULL, NULL, 'install'),
(122, 'ORD-0306-005', 84, NULL, 2048000, 2048000, 0, NULL, NULL, 'debt', 'confirmed', '[03/06/2026 13:01 - admin] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-03 06:01:43', NULL, NULL, NULL, NULL, 'install'),
(123, 'ORD-0306-006', 42, NULL, 150000, 150000, 0, NULL, NULL, 'debt', 'done', '[03/06/2026 13:36 - nv409671] Tạo đơn\n[03/06/2026 13:38 - nv409671] Chuyển trạng thái → done\n', 'customer_owes', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-03 13:38:00', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-03 06:36:17', NULL, NULL, NULL, NULL, 'install'),
(124, 'ORD-0306-007', 21, NULL, 480000, 480000, 0, NULL, NULL, 'debt', 'done', '[03/06/2026 13:43 - nv224895] Tạo đơn\n[03/06/2026 13:44 - nv224895] Cập nhật nội dung dòng công việc\n[03/06/2026 13:44 - nv224895] Chuyển trạng thái → done\n', 'customer_owes', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-03 13:44:23', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-03 06:43:53', NULL, NULL, NULL, NULL, 'install'),
(125, 'ORD-0306-008', 78, NULL, 495000, 495000, 0, NULL, NULL, 'debt', 'done', '[03/06/2026 13:48 - nv409671] Tạo đơn\n[03/06/2026 15:23 - nv224895] Chuyển trạng thái → done\n', 'customer_owes', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-03 15:23:29', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-03 06:48:34', NULL, NULL, NULL, NULL, 'install'),
(127, 'ORD-0306-009', 59, NULL, 650000, 650000, 0, NULL, NULL, 'debt', 'done', '[03/06/2026 15:14 - nv224895] Tạo đơn\n[03/06/2026 15:14 - nv224895] Chuyển trạng thái → done\n', 'customer_owes', 0, 0, NULL, '96/4 Đường số 9, Phường Linh Xuân, HCM', 2, NULL, NULL, '2026-06-03 15:14:15', 150000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-03 08:14:06', NULL, NULL, NULL, NULL, 'install'),
(129, 'ORD-0306-010', 85, NULL, 1080000, 1080000, 0, NULL, NULL, 'debt', 'confirmed', '[03/06/2026 15:23 - nv224895] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-03 08:23:10', NULL, NULL, NULL, NULL, 'install'),
(130, 'ORD-0306-011', 86, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[03/06/2026 16:57 - nv224895] Tạo đơn\n[03/06/2026 16:58 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-0306-004\n[03/06/2026 16:59 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-03 16:59:02', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-03 09:57:47', NULL, NULL, NULL, NULL, 'install'),
(131, 'ORD-0406-001', 87, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[04/06/2026 08:32 - nv224895] Tạo đơn\n[04/06/2026 09:48 - nv224895] Chuyển trạng thái → done\n[04/06/2026 09:49 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-0406-003\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-04 09:48:59', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-04 01:32:54', NULL, NULL, NULL, NULL, 'install'),
(132, 'ORD-0406-002', 22, NULL, 960000, 960000, 0, NULL, NULL, 'debt', 'done', '[04/06/2026 09:02 - nv224895] Tạo đơn\n[04/06/2026 09:02 - nv224895] Chuyển trạng thái → done\n', 'customer_owes', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-04 09:02:53', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-04 02:02:47', NULL, NULL, NULL, NULL, 'install'),
(133, 'ORD-0406-003', 88, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[04/06/2026 09:04 - nv224895] Tạo đơn\n[04/06/2026 09:04 - nv224895] Chuyển trạng thái → done\n[04/06/2026 09:04 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-0406-001\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-04 09:04:35', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-04 02:04:32', NULL, NULL, NULL, NULL, 'install'),
(134, 'ORD-0406-004', 89, NULL, 600000, 600000, 600000, NULL, NULL, 'debt', 'done', '[04/06/2026 09:08 - nv224895] Tạo đơn\n[04/06/2026 09:08 - nv224895] NV nhận 600.000đ (Chuyển khoản) — NNT-0406-002\n[04/06/2026 09:08 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-04 09:08:43', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-04 02:08:24', NULL, NULL, NULL, NULL, 'install'),
(135, 'ORD-0406-005', 36, NULL, 4428000, 4428000, 4428000, NULL, NULL, 'debt', 'done', '[04/06/2026 09:41 - nv224895] Tạo đơn\n[04/06/2026 09:50 - nv224895] Chuyển trạng thái → done\n[04/06/2026 09:50 - nv224895] NV nhận 4.428.000đ (Chuyển khoản) — NNT-0406-004\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-04 09:50:10', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-04 02:41:07', NULL, NULL, NULL, NULL, 'install'),
(136, 'ORD-0406-006', 21, NULL, 810000, 810000, 0, NULL, NULL, 'debt', 'done', '[04/06/2026 10:20 - nv224895] Tạo đơn\n[04/06/2026 14:14 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 8, NULL, '2026-06-04 14:13:31', '2026-06-04 14:14:34', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-04 03:20:29', NULL, NULL, NULL, NULL, 'install'),
(137, 'ORD-0406-007', 33, NULL, 700000, 700000, 700000, NULL, NULL, 'debt', 'done', '[04/06/2026 11:13 - nv224895] Tạo đơn\n[04/06/2026 11:14 - nv224895] Cập nhật nội dung dòng công việc\n[04/06/2026 11:17 - nv224895] NV nhận 700.000đ (Chuyển khoản) — NNT-0406-005\n[04/06/2026 11:17 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-04 11:17:07', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-04 04:13:19', NULL, NULL, NULL, NULL, 'install'),
(138, 'ORD-0406-008', 45, NULL, 480000, 480000, 480000, NULL, NULL, 'debt', 'done', '[04/06/2026 13:16 - nv224895] Tạo đơn\n[04/06/2026 13:17 - nv224895] NV nhận 480.000đ (Chuyển khoản) — NNT-0406-006\n[04/06/2026 13:17 - nv224895] Chuyển trạng thái → in_progress\n[04/06/2026 13:53 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-04 13:53:22', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-04 06:16:43', NULL, NULL, NULL, NULL, 'install'),
(140, 'ORD-0406-009', 90, NULL, 11460000, 11460000, 0, NULL, NULL, 'debt', 'cancelled', '[04/06/2026 14:12 - nv224895] Tạo đơn\n[04/06/2026 14:18 - nv224895] Huỷ đơn\n', 'unpaid', 0, 0, NULL, NULL, 8, NULL, NULL, NULL, 450000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-04 07:12:51', NULL, NULL, NULL, NULL, 'install'),
(142, 'ORD-0406-010', 90, NULL, 12659760, 12659760, 0, NULL, NULL, 'debt', 'done', '[05/06/2026 15:25 - ktv885380] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-06-05 15:25:46', 450000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-04 07:20:45', NULL, NULL, NULL, NULL, 'install'),
(144, 'ORD-0406-011', 91, NULL, 7560000, 7560000, 0, NULL, NULL, 'debt', 'done', '[04/06/2026 14:42 - nv409671] Tạo đơn\n[04/06/2026 18:04 - ktv885380] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, '280B4 Lương Định Của, Khu Phố 1, Phường Bình Trưng, TP Hồ Chí Minh, Việt Nam', 2, NULL, NULL, '2026-06-04 18:04:41', 300000, 0, NULL, NULL, NULL, 'Không thu. Xe chưa có BS', NULL, 'admin', 6, NULL, NULL, 0, '2026-06-04 07:42:11', NULL, NULL, NULL, NULL, 'install'),
(145, 'ORD-0406-012', 92, NULL, 750000, 750000, 0, NULL, NULL, 'debt', 'confirmed', '[04/06/2026 15:29 - nv224895] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-04 08:29:16', NULL, NULL, NULL, NULL, 'install'),
(147, 'ORD-0406-013', 93, NULL, 810000, 810000, 0, NULL, NULL, 'debt', 'done', '[04/06/2026 18:00 - admin] Tạo đơn\n[04/06/2026 20:47 - ktv885380] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, 'Đường Nguyễn Thị Thử X. Xuân Thới Sơn, TP. Hồ Chí Minh, Việt Nam', 2, NULL, NULL, '2026-06-04 20:47:09', 100000, 0, NULL, NULL, NULL, 'Không thu, khách hẹn chuyển khoản cty sau', NULL, 'admin', 1, NULL, NULL, 0, '2026-06-04 11:00:30', NULL, NULL, NULL, NULL, 'install'),
(148, 'ORD-0506-001', 94, NULL, 0, 0, 0, NULL, NULL, 'debt', 'done', '[05/06/2026 08:33 - nv224895] Tạo đơn\n[05/06/2026 08:42 - nv224895] Chuyển trạng thái → in_progress\n[05/06/2026 08:42 - nv224895] Chuyển trạng thái → done\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-05 08:42:13', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-05 01:33:46', NULL, NULL, NULL, NULL, 'install'),
(149, 'ORD-0506-002', 94, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[05/06/2026 08:43 - nv224895] Tạo đơn\n[05/06/2026 08:43 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-0506-001\n[05/06/2026 08:44 - nv224895] Cập nhật nội dung dòng công việc\n[05/06/2026 08:45 - nv224895] Chuyển trạng thái → in_progress\n[05/06/2026 11:20 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-05 11:20:11', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-05 01:43:49', NULL, NULL, NULL, NULL, 'install'),
(150, 'ORD-0506-003', 95, NULL, 3550000, 3550000, 3550000, NULL, NULL, 'debt', 'done', '[05/06/2026 13:38 - nv224895] Tạo đơn\n[05/06/2026 16:20 - nv224895] Chuyển trạng thái → done\n[09/06/2026 15:21 - nv224895] NV nhận 3.550.000đ (Chuyển khoản) — NNT-0906-003\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-05 16:20:59', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-05 06:38:21', NULL, NULL, NULL, NULL, 'install'),
(151, 'ORD-0506-004', 63, NULL, 1800000, 1800000, 0, NULL, NULL, 'debt', 'done', '[05/06/2026 13:41 - nv224895] Tạo đơn\n[05/06/2026 13:41 - nv224895] Cập nhật nội dung dòng công việc\n[05/06/2026 13:47 - nv224895] Cập nhật nội dung dòng công việc\n[05/06/2026 16:20 - nv224895] Chuyển trạng thái → done\n[05/06/2026 16:31 - admin] Thêm hoa hồng nhân viên Phương Quyên: 1.800đ\n[05/06/2026 16:34 - admin] Duyệt hoa hồng nhân viên: 18.000đ\n', 'customer_owes', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-05 16:20:16', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-05 06:41:24', NULL, NULL, NULL, NULL, 'install'),
(152, 'ORD-0506-005', 59, NULL, 605000, 605000, 0, NULL, NULL, 'debt', 'done', '[05/06/2026 18:13 - nv224895] Tạo đơn\n[06/06/2026 11:28 - nv224895] Chuyển trạng thái → done\n', 'customer_owes', 0, 0, NULL, '96/4 Đường số 9, Phường Linh Xuân, HCM', NULL, NULL, NULL, '2026-06-06 11:28:25', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-05 11:13:18', NULL, NULL, NULL, NULL, 'install'),
(153, 'ORD-0506-006', 97, NULL, 1080000, 1080000, 1080000, NULL, NULL, 'debt', 'done', '[05/06/2026 19:46 - nv224895] Tạo đơn\n[05/06/2026 19:46 - nv224895] Chuyển trạng thái → in_progress\n[05/06/2026 19:46 - nv224895] NV nhận 1.080.000đ (Tiền mặt) — NNT-0506-002\n[05/06/2026 20:18 - ktv157123] KTV hoàn thành đơn\n[05/06/2026 21:58 - admin] Thêm hoa hồng nhân viên Trần Quốc Viện: 100.000đ\n', 'paid', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-05 20:18:05', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-05 12:46:25', NULL, NULL, NULL, NULL, 'install'),
(154, 'ORD-0506-007', 98, NULL, 1080000, 1080000, 0, NULL, NULL, 'debt', 'cancelled', '[05/06/2026 21:53 - admin] Tạo đơn\n[05/06/2026 21:57 - admin] Huỷ đơn\n', 'unpaid', 0, 0, NULL, NULL, 8, NULL, NULL, NULL, 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-05 14:53:40', NULL, NULL, NULL, NULL, 'install'),
(155, 'ORD-0606-001', 21, NULL, 810000, 810000, 0, NULL, NULL, 'debt', 'done', '[06/06/2026 08:20 - nv224895] Tạo đơn\n[06/06/2026 09:13 - ktv885380] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-06-06 09:13:57', 100000, 0, NULL, NULL, NULL, 'Không thu', NULL, 'admin', 3, NULL, NULL, 0, '2026-06-06 01:20:39', NULL, NULL, NULL, NULL, 'install'),
(156, 'ORD-0606-002', 52, NULL, 216000, 216000, 216000, '2026-06-06 09:48:20', NULL, 'debt', 'done', '[06/06/2026 09:47 - nv224895] Tạo đơn\n[06/06/2026 09:48 - nv224895] Chuyển trạng thái → done\n[06/06/2026 09:48 - nv224895] NV nhận 8.316.000đ (Chuyển khoản) qua phiếu YC-0606-001 — NNT-0606-001\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-06 09:48:01', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-06 02:47:55', NULL, NULL, NULL, NULL, 'install'),
(157, 'ORD-0606-003', 99, NULL, 460000, 460000, 460000, NULL, NULL, 'debt', 'done', '[06/06/2026 10:09 - nv224895] Tạo đơn\n[06/06/2026 10:10 - nv224895] Chuyển trạng thái → done\n[06/06/2026 10:10 - nv224895] NV nhận 460.000đ (Tiền mặt) — NNT-0606-002\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-06 10:10:05', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-06 03:09:59', NULL, NULL, NULL, NULL, 'install'),
(158, 'ORD-0606-004', 19, NULL, 7056000, 7056000, 0, NULL, NULL, 'debt', 'confirmed', '[06/06/2026 11:35 - nv224895] Tạo đơn\n[09/06/2026 09:45 - admin] Thêm hoa hồng nhân viên Phương Quyên: 20.000đ\n', 'unpaid', 0, 0, NULL, '31/2A Tân Trụ, Phường Tân Sơn, TP Hồ Chí Minh, Việt Nam', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-06 04:35:44', NULL, NULL, NULL, NULL, 'install'),
(159, 'ORD-0606-005', 100, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[06/06/2026 11:51 - admin] Tạo đơn\n[06/06/2026 11:52 - admin] Cập nhật thông tin đơn\n[06/06/2026 12:04 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-0606-003\n[06/06/2026 12:06 - nv224895] Cập nhật nội dung dòng công việc\n[06/06/2026 12:06 - nv224895] Cập nhật nội dung dòng công việc\n[06/06/2026 12:06 - nv224895] Chuyển trạng thái → in_progress\n[06/06/2026 12:06 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, '0902369579', NULL, NULL, NULL, '2026-06-06 12:06:31', 0, 0, NULL, NULL, NULL, NULL, '51C89645', 'admin', 1, NULL, NULL, 0, '2026-06-06 04:51:00', NULL, NULL, NULL, NULL, 'install'),
(161, 'ORD-0606-006', 101, NULL, 100000, 100000, 0, NULL, NULL, 'debt', 'done', '[06/06/2026 12:45 - nv224895] Tạo đơn\n[08/06/2026 15:11 - ktv157123] Bắt đầu làm việc\n[08/06/2026 15:12 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 8, NULL, '2026-06-08 15:11:25', '2026-06-08 15:12:26', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-06 05:45:12', NULL, NULL, NULL, NULL, 'install'),
(162, 'ORD-0606-007', 84, NULL, 3128000, 3128000, 3128000, NULL, NULL, 'debt', 'done', '[06/06/2026 13:13 - nv224895] Tạo đơn\n[06/06/2026 14:09 - nv224895] Cập nhật nội dung dòng công việc\n[06/06/2026 14:10 - nv224895] Cập nhật nội dung dòng công việc\n[06/06/2026 19:43 - admin] Chuyển trạng thái → done\n[06/06/2026 19:45 - admin] Thêm hoa hồng nhân viên Phương Quyên: 20.000đ\n[06/06/2026 19:45 - admin] Ghi nhận thu 3.128.000đ (Chuyển khoản)\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-06 19:43:37', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-06 06:13:27', NULL, NULL, NULL, NULL, 'install'),
(163, 'ORD-0806-001', 102, NULL, 1620000, 1620000, 1620000, NULL, NULL, 'debt', 'done', '[08/06/2026 15:46 - admin] Tạo đơn\n[09/06/2026 09:42 - admin] Chuyển trạng thái → done\n[09/06/2026 09:42 - admin] Ghi nhận thu 1.620.000đ (Chuyển khoản)\n', 'paid', 0, 0, NULL, '158/11/24 Đường Bà Hạt, Phường Vườn Lài, TP Hồ Chí Minh, Việt Nam', NULL, NULL, NULL, '2026-06-09 09:42:16', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-08 08:46:01', NULL, NULL, NULL, NULL, 'install'),
(164, 'ORD-0906-001', 103, NULL, 1200000, 1200000, 0, NULL, NULL, 'debt', 'confirmed', '[09/06/2026 14:13 - nv409671] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-09 07:13:39', NULL, NULL, NULL, NULL, 'install'),
(165, 'ORD-0906-002', 104, NULL, 3600000, 3600000, 3600000, NULL, NULL, 'debt', 'done', '[09/06/2026 14:15 - nv409671] Tạo đơn\n[09/06/2026 14:17 - nv409671] NV nhận 3.600.000đ (Chuyển khoản) — NNT-0906-001\n[09/06/2026 14:17 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-09 14:17:11', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-09 07:15:20', NULL, NULL, NULL, NULL, 'install'),
(166, 'ORD-0906-003', 105, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[09/06/2026 14:16 - nv409671] Tạo đơn\n[09/06/2026 14:18 - nv409671] NV nhận 750.000đ (Chuyển khoản) — NNT-0906-002\n[09/06/2026 14:18 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-09 14:18:21', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-09 07:16:39', NULL, NULL, NULL, NULL, 'install'),
(167, 'ORD-0906-004', 106, NULL, 700000, 700000, 700000, NULL, NULL, 'debt', 'done', '[09/06/2026 14:22 - nv409671] Tạo đơn\n[10/06/2026 09:08 - nv224895] NV nhận 700.000đ (Chuyển khoản) — NNT-1006-002\n[10/06/2026 09:08 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, 'Số 29 Đường 494, Ấp 3, Tổ 22, Xã Nhuận Đức, TP Hồ Chí Minh, Việt Nam', NULL, NULL, NULL, '2026-06-10 09:08:43', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-09 07:22:27', NULL, NULL, NULL, NULL, 'install'),
(170, 'ORD-0906-005', 58, NULL, 7000000, 7000000, 7000000, NULL, NULL, 'debt', 'done', '[09/06/2026 15:47 - nv224895] Tạo đơn\n[09/06/2026 16:21 - nv224895] NV nhận 7.000.000đ (Chuyển khoản) — NNT-0906-004\n[09/06/2026 16:21 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-09 16:21:57', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-09 08:47:02', NULL, NULL, NULL, NULL, 'install'),
(171, 'ORD-0906-006', 107, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[09/06/2026 16:21 - nv409671] Tạo đơn\n[09/06/2026 16:22 - nv409671] NV nhận 750.000đ (Chuyển khoản) — NNT-0906-005\n[09/06/2026 16:22 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-09 16:22:17', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-09 09:21:10', NULL, NULL, NULL, NULL, 'install'),
(172, 'ORD-0906-007', 95, NULL, 4050000, 4050000, 0, NULL, NULL, 'debt', 'confirmed', '[09/06/2026 16:24 - nv224895] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-09 09:24:31', NULL, NULL, NULL, NULL, 'install'),
(173, 'ORD-0906-008', 61, NULL, 1850000, 1850000, 1850000, NULL, NULL, 'debt', 'done', '[09/06/2026 16:59 - nv224895] Tạo đơn\n[09/06/2026 16:59 - nv224895] NV nhận 1.850.000đ (Chuyển khoản) — NNT-0906-006\n[09/06/2026 16:59 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-09 16:59:35', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-09 09:59:06', NULL, NULL, NULL, NULL, 'install'),
(174, 'ORD-1006-001', 108, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[10/06/2026 08:46 - nv409671] Tạo đơn\n[10/06/2026 08:47 - nv409671] NV nhận 750.000đ (Chuyển khoản) — NNT-1006-001\n[10/06/2026 08:47 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-10 08:47:26', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-10 01:46:09', NULL, NULL, NULL, NULL, 'install'),
(175, 'ORD-1006-002', 109, NULL, 27000000, 27000000, 0, NULL, NULL, 'debt', 'confirmed', '[10/06/2026 09:00 - nv409671] Tạo đơn\n', 'unpaid', 0, 0, NULL, '32 đường số 5, Khu Đô Thị Vạn Phúc, Phường Hiệp Bình, Thành phố Hồ Chí Minh, Việt Nam', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-10 02:00:11', NULL, NULL, NULL, NULL, 'install'),
(176, 'ORD-1006-003', 21, NULL, 810000, 810000, 0, NULL, NULL, 'debt', 'confirmed', '[10/06/2026 10:51 - nv224895] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, 8, NULL, NULL, NULL, 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-10 03:51:21', NULL, NULL, NULL, NULL, 'install'),
(177, 'ORD-1006-004', 110, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[10/06/2026 11:32 - nv224895] Tạo đơn\n[10/06/2026 11:37 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-1006-003\n[10/06/2026 11:37 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-10 11:37:35', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-10 04:32:49', NULL, NULL, NULL, NULL, 'install');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_attachments`
--

CREATE TABLE `order_attachments` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `url` varchar(500) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `stage` enum('receive','deliver','other') NOT NULL DEFAULT 'other',
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_charges`
--

CREATE TABLE `order_charges` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `line_id` int(11) DEFAULT NULL,
  `kind` enum('shipping','discount','fee') NOT NULL DEFAULT 'fee',
  `label` varchar(150) NOT NULL,
  `amount` bigint(20) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_charges`
--

INSERT INTO `order_charges` (`id`, `order_id`, `line_id`, `kind`, `label`, `amount`, `is_deleted`) VALUES
(1, 1, NULL, 'fee', 'Công lắp', 100000, 1),
(2, 1, NULL, 'fee', 'Công lắp', 100000, 0),
(3, 3, NULL, 'fee', 'Công lắp', 600000, 1),
(4, 3, NULL, 'fee', 'Công lắp', 600000, 1),
(5, 3, NULL, 'fee', 'Công lắp', 600000, 0),
(6, 6, NULL, 'fee', 'Công lắp', 200000, 0),
(7, 8, NULL, 'fee', 'Công lắp', 400000, 0),
(8, 10, NULL, 'fee', 'Công lắp', 100000, 0),
(9, 12, NULL, 'fee', 'Công lắp', 100000, 0),
(10, 14, NULL, 'fee', 'Công lắp', 100000, 0),
(12, 17, 23, 'fee', 'giao hàng', 35000, 0),
(13, 17, NULL, 'fee', 'Công lắp', 200000, 0),
(14, 20, NULL, 'fee', 'Công lắp', 600000, 1),
(15, 22, NULL, 'fee', 'Công lắp', 300000, 0),
(16, 24, NULL, 'fee', 'Công lắp', 400000, 0),
(17, 26, NULL, 'fee', 'Công lắp', 100000, 0),
(18, 20, NULL, 'fee', 'Công lắp', 600000, 0),
(19, 28, NULL, 'fee', 'Công lắp', 100000, 0),
(20, 35, NULL, 'fee', 'Công lắp', 1000000, 1),
(21, 36, NULL, 'fee', 'Công lắp', 100000, 0),
(22, 37, NULL, 'fee', 'Công lắp', 2100000, 0),
(23, 40, NULL, 'fee', 'Công lắp', 500000, 0),
(24, 35, 50, 'fee', 'phí 1', 200000, 0),
(25, 35, NULL, 'fee', 'Công lắp', 1000000, 0),
(26, 45, NULL, 'fee', 'Công lắp', 100000, 0),
(27, 52, NULL, 'fee', 'Công lắp', 600000, 0),
(28, 54, NULL, 'fee', 'Công lắp', 750000, 0),
(29, 57, NULL, 'fee', 'Công lắp', 100000, 0),
(30, 70, NULL, 'fee', 'Công lắp', 100000, 0),
(31, 72, NULL, 'fee', 'Công lắp', 1050000, 0),
(32, 83, NULL, 'fee', 'Công lắp', 750000, 1),
(33, 84, NULL, 'fee', 'Công lắp', 400000, 1),
(34, 84, NULL, 'fee', 'Công lắp', 400000, 0),
(35, 91, NULL, 'fee', 'Công lắp', 100000, 0),
(36, 94, NULL, 'fee', 'Công lắp', 100000, 1),
(37, 94, NULL, 'fee', 'Công lắp', 100000, 1),
(38, 94, NULL, 'fee', 'Công lắp', 100000, 0),
(39, 83, NULL, 'fee', 'Công lắp', 750000, 1),
(40, 83, NULL, 'fee', 'Công lắp', 750000, 0),
(41, 105, NULL, 'fee', 'Công lắp', 100000, 0),
(42, 113, NULL, 'fee', 'Công lắp', 1200000, 1),
(43, 113, NULL, 'fee', 'Công lắp', 1200000, 0),
(44, 119, NULL, 'fee', 'Công lắp', 150000, 0),
(45, 127, NULL, 'fee', 'Công lắp', 150000, 0),
(46, 136, NULL, 'fee', 'Công lắp', 100000, 0),
(47, 140, NULL, 'fee', 'Công lắp', 450000, 0),
(48, 142, NULL, 'fee', 'Công lắp', 450000, 1),
(49, 144, NULL, 'fee', 'Công lắp', 300000, 0),
(50, 147, NULL, 'fee', 'Công lắp', 100000, 0),
(51, 142, NULL, 'fee', 'Công lắp', 450000, 1),
(52, 142, NULL, 'fee', 'Công lắp', 450000, 1),
(53, 142, NULL, 'fee', 'Công lắp', 450000, 0),
(54, 152, NULL, 'fee', 'Công lắp', 100000, 0),
(55, 153, NULL, 'fee', 'Công lắp', 100000, 0),
(56, 154, NULL, 'fee', 'Công lắp', 100000, 0),
(57, 155, NULL, 'fee', 'Công lắp', 100000, 0),
(58, 161, NULL, 'fee', 'Công lắp', 100000, 0),
(59, 176, NULL, 'fee', 'Công lắp', 100000, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_checklist`
--

CREATE TABLE `order_checklist` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `step` varchar(255) NOT NULL,
  `is_done` tinyint(1) NOT NULL DEFAULT 0,
  `done_at` datetime DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_field_values`
--

CREATE TABLE `order_field_values` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `line_id` int(11) NOT NULL,
  `item_id` int(11) DEFAULT NULL,
  `template_field_id` int(11) DEFAULT NULL,
  `label` varchar(150) NOT NULL,
  `value` text DEFAULT NULL,
  `seq` int(11) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_field_values`
--

INSERT INTO `order_field_values` (`id`, `order_id`, `line_id`, `item_id`, `template_field_id`, `label`, `value`, `seq`, `is_deleted`) VALUES
(1, 8, 8, 10, NULL, 'Biển số xe', '34567890', 1, 0),
(2, 8, 8, 10, NULL, 'IMEI', '', 2, 0),
(3, 8, 8, 10, NULL, 'Tên tài khoản', '34567890', 3, 0),
(4, 8, 8, 10, NULL, 'Số SIM', '', 4, 0),
(5, 10, 10, 13, NULL, 'Biển số xe', '3456789', 1, 0),
(6, 10, 10, 13, NULL, 'IMEI', '', 2, 0),
(7, 10, 10, 13, NULL, 'Tên tài khoản', '34567890', 3, 0),
(8, 10, 10, 13, NULL, 'Số SIM', '', 4, 0),
(11, 12, 13, 16, NULL, 'Biển số xe', '45aa21453', 1, 0),
(12, 12, 13, 16, NULL, 'Tên tài khoản', 'nhanvien', 2, 0),
(13, 12, 14, 17, NULL, 'Biển số xe', '45ss45215', 1, 0),
(14, 12, 14, 17, NULL, 'IMEI', '', 2, 0),
(15, 12, 14, 17, NULL, 'Tên tài khoản', 'thoainhap', 3, 0),
(16, 12, 14, 17, NULL, 'Số SIM', '', 4, 0),
(17, 14, 17, 21, NULL, 'Biển số xe', 'thoainhap1', 1, 0),
(18, 14, 17, 21, NULL, 'IMEI', '', 2, 0),
(19, 14, 17, 21, NULL, 'Tên tài khoản', 'thoainhap2', 3, 0),
(20, 14, 17, 21, NULL, 'Số SIM', '', 4, 0),
(21, 14, 17, 22, NULL, 'Biển số xe', 'thoainhap3', 1, 0),
(22, 14, 17, 22, NULL, 'IMEI', '', 2, 0),
(23, 14, 17, 22, NULL, 'Tên tài khoản', 'thoainhap4', 3, 0),
(24, 14, 17, 22, NULL, 'Số SIM', '', 4, 0),
(25, 14, 18, 23, NULL, 'Biển số xe', 'thoainhap5', 1, 0),
(26, 14, 18, 23, NULL, 'IMEI', '', 2, 0),
(27, 14, 18, 23, NULL, 'Tên tài khoản', 'thoainhap6', 3, 0),
(28, 14, 18, 23, NULL, 'Số SIM', '', 4, 0),
(29, 35, 50, 70, NULL, 'Biển số xe', '', 1, 0),
(30, 35, 50, 70, NULL, 'IMEI', '', 2, 0),
(31, 35, 50, 70, NULL, 'Tên tài khoản', '', 3, 0),
(32, 35, 50, 70, NULL, 'Số SIM', '', 4, 0),
(33, 52, 61, 85, NULL, 'Biển số xe', '51K21301', 1, 0),
(34, 52, 61, 85, NULL, 'IMEI', '', 2, 0),
(35, 52, 61, 85, NULL, 'Tên tài khoản', '', 3, 0),
(36, 52, 61, 85, NULL, 'Số SIM', '', 4, 0),
(37, 84, 94, 141, NULL, 'Biển số xe', '', 1, 0),
(38, 84, 94, 141, NULL, 'IMEI', '', 2, 0),
(39, 84, 94, 141, NULL, 'Tên tài khoản', '', 3, 0),
(40, 84, 94, 141, NULL, 'Số SIM', '', 4, 0),
(41, 93, 103, 154, NULL, 'Biển số xe', '50E15842', 1, 0),
(42, 95, 105, 156, NULL, 'Biển số xe', '51D16425', 1, 0),
(43, 98, 108, 159, NULL, 'Biển số xe', '51B13795', 1, 0),
(44, 97, 109, 160, NULL, 'Biển số xe', '50H92651', 1, 0),
(45, 97, 109, 160, NULL, 'IMEI', '', 2, 0),
(46, 97, 109, 160, NULL, 'Tên tài khoản', '', 3, 0),
(47, 97, 109, 160, NULL, 'Số SIM', '', 4, 0),
(48, 103, 115, 172, NULL, 'Biển số xe', '51G96801', 1, 0),
(50, 104, 117, 174, NULL, 'Biển số xe', '51G-071.76, 51L-481.63, 51D-722.78', 1, 0),
(63, 102, 122, 180, NULL, 'Biển số xe', '51B03352', 1, 0),
(64, 102, 122, 180, NULL, 'IMEI', '', 2, 0),
(65, 102, 122, 180, NULL, 'Tên tài khoản', 'kietvo', 3, 0),
(66, 102, 122, 180, NULL, 'Số SIM', '', 4, 0),
(67, 102, 122, 181, NULL, 'Biển số xe', '', 1, 0),
(68, 102, 122, 181, NULL, 'IMEI', '', 2, 0),
(69, 102, 122, 181, NULL, 'Tên tài khoản', '', 3, 0),
(70, 102, 122, 181, NULL, 'Số SIM', '', 4, 0),
(71, 107, 123, 182, NULL, 'Biển số xe', '86E00110', 1, 0),
(72, 108, 124, 183, NULL, 'Biển số xe', '61H03279', 1, 0),
(73, 106, 125, 184, NULL, 'Biển số xe', '50E15781', 1, 0),
(74, 106, 125, 184, NULL, 'IMEI', '', 2, 0),
(75, 106, 125, 184, NULL, 'Tên tài khoản', '', 3, 0),
(76, 106, 125, 184, NULL, 'Số SIM', '', 4, 0),
(77, 109, 126, 185, NULL, 'Biển số xe', '51D95565/51D95576', 1, 0),
(80, 113, 131, 197, NULL, 'Biển số xe', '', 1, 0),
(81, 113, 131, 197, NULL, 'IMEI', '', 2, 0),
(82, 113, 131, 197, NULL, 'Tên tài khoản', '', 3, 0),
(83, 113, 131, 197, NULL, 'Số SIM', '', 4, 0),
(84, 113, 131, 198, NULL, 'Biển số xe', '', 1, 0),
(85, 113, 131, 198, NULL, 'IMEI', '', 2, 0),
(86, 113, 131, 198, NULL, 'Tên tài khoản', '', 3, 0),
(87, 113, 131, 198, NULL, 'Số SIM', '', 4, 0),
(88, 113, 131, 199, NULL, 'Biển số xe', '', 1, 0),
(89, 113, 131, 199, NULL, 'IMEI', '', 2, 0),
(90, 113, 131, 199, NULL, 'Tên tài khoản', '', 3, 0),
(91, 113, 131, 199, NULL, 'Số SIM', '', 4, 0),
(92, 113, 131, 200, NULL, 'Tên tài khoản', 'vantaitansang', 1, 0),
(95, 114, 133, 202, NULL, 'Biển số xe', '51C01878', 1, 0),
(96, 114, 133, 202, NULL, 'Tên tài khoản', 'phamquoccuong1', 2, 0),
(97, 115, 135, 208, NULL, 'Biển số xe', '', 1, 0),
(98, 115, 135, 208, NULL, 'IMEI', '', 2, 0),
(99, 115, 135, 208, NULL, 'Tên tài khoản', '', 3, 0),
(100, 115, 135, 208, NULL, 'Số SIM', '', 4, 0),
(101, 115, 135, 209, NULL, 'Biển số xe', '', 1, 0),
(102, 115, 135, 209, NULL, 'IMEI', '', 2, 0),
(103, 115, 135, 209, NULL, 'Tên tài khoản', '', 3, 0),
(104, 115, 135, 209, NULL, 'Số SIM', '', 4, 0),
(105, 115, 135, 210, NULL, 'Biển số xe', '', 1, 0),
(106, 115, 135, 210, NULL, 'IMEI', '', 2, 0),
(107, 115, 135, 210, NULL, 'Tên tài khoản', '', 3, 0),
(108, 115, 135, 210, NULL, 'Số SIM', '', 4, 0),
(109, 115, 135, 211, NULL, 'Biển số xe', '', 1, 0),
(110, 115, 135, 211, NULL, 'IMEI', '', 2, 0),
(111, 115, 135, 211, NULL, 'Tên tài khoản', '', 3, 0),
(112, 115, 135, 211, NULL, 'Số SIM', '', 4, 0),
(113, 116, 136, 212, NULL, 'Biển số xe', '50E-150.03', 1, 0),
(114, 116, 136, 212, NULL, 'Tên tài khoản', 'mattroiviet', 2, 0),
(115, 119, 139, 215, NULL, 'Biển số xe', '50E-158.87', 1, 0),
(116, 119, 139, 215, NULL, 'IMEI', '', 2, 0),
(117, 119, 139, 215, NULL, 'Tên tài khoản', 'Thiengianganh', 3, 0),
(118, 119, 139, 215, NULL, 'Số SIM', '', 4, 0),
(119, 124, 145, 224, NULL, 'Biển số xe', '50E13657', 1, 0),
(120, 124, 145, 224, NULL, 'IMEI', '', 2, 0),
(121, 124, 145, 224, NULL, 'Tên tài khoản', '', 3, 0),
(122, 124, 145, 224, NULL, 'Số SIM', '', 4, 0),
(124, 127, 148, 228, NULL, 'Biển số xe', '51g90049', 1, 0),
(125, 130, 151, 232, NULL, 'Biển số xe', '62C11117', 1, 0),
(126, 131, 152, 233, NULL, 'Biển số xe', '50h79438', 1, 0),
(127, 132, 153, 234, NULL, 'Biển số xe', '51C85444,50H-935.94', 1, 0),
(128, 133, 154, 235, NULL, 'Biển số xe', '51D54469', 1, 0),
(129, 134, 155, 236, NULL, 'Biển số xe', 'số xe 22', 1, 0),
(130, 134, 155, 236, NULL, 'Tên tài khoản', 'minhhai1', 2, 0),
(131, 136, 157, 238, NULL, 'Tên tài khoản', '0908445044', 1, 0),
(133, 137, 159, 240, NULL, 'Biển số xe', '50H15962', 1, 0),
(134, 138, 160, 241, NULL, 'Biển số xe', '50E17467', 1, 0),
(135, 145, 167, 264, NULL, 'Biển số xe', '50E51391', 1, 0),
(136, 142, 170, 267, NULL, 'Biển số xe', '', 1, 0),
(137, 142, 170, 267, NULL, 'IMEI', '', 2, 0),
(138, 142, 170, 267, NULL, 'Tên tài khoản', 'Thucphamaoao', 3, 0),
(139, 142, 170, 267, NULL, 'Số SIM', '', 4, 0),
(140, 142, 170, 268, NULL, 'Biển số xe', '', 1, 0),
(141, 142, 170, 268, NULL, 'IMEI', '', 2, 0),
(142, 142, 170, 268, NULL, 'Tên tài khoản', '', 3, 0),
(143, 142, 170, 268, NULL, 'Số SIM', '', 4, 0),
(144, 142, 170, 269, NULL, 'Biển số xe', '', 1, 0),
(145, 142, 170, 269, NULL, 'IMEI', '', 2, 0),
(146, 142, 170, 269, NULL, 'Tên tài khoản', '', 3, 0),
(147, 142, 170, 269, NULL, 'Số SIM', '', 4, 0),
(148, 142, 170, 270, NULL, 'Biển số xe', '', 1, 0),
(149, 142, 170, 270, NULL, 'IMEI', '', 2, 0),
(150, 142, 170, 270, NULL, 'Tên tài khoản', '', 3, 0),
(151, 142, 170, 270, NULL, 'Số SIM', '', 4, 0),
(152, 148, 171, 271, NULL, 'Biển số xe', '63H-069.02', 1, 0),
(153, 149, 173, 273, NULL, 'Biển số xe', '63H-069.02', 1, 0),
(154, 149, 173, 273, NULL, 'IMEI', '', 2, 0),
(155, 149, 173, 273, NULL, 'Tên tài khoản', '', 3, 0),
(156, 149, 173, 273, NULL, 'Số SIM', '', 4, 0),
(159, 151, 177, 280, NULL, 'IMEI', '355468593179427,355468593178791', 1, 0),
(160, 147, 169, 266, NULL, 'Biển số xe', '64A-123.58', 1, 0),
(161, 147, 169, 266, NULL, 'IMEI', '', 2, 0),
(162, 147, 169, 266, NULL, 'Tên tài khoản', 'Dongphuong1', 3, 0),
(163, 147, 169, 266, NULL, 'Số SIM', '', 4, 0),
(164, 94, 104, 155, NULL, 'Biển số xe', '50E-149.46', 1, 0),
(165, 94, 104, 155, NULL, 'IMEI', '', 2, 0),
(166, 94, 104, 155, NULL, 'Tên tài khoản', 'Vantaihuunguyen', 3, 0),
(167, 94, 104, 155, NULL, 'Số SIM', '', 4, 0),
(168, 144, 166, 261, NULL, 'Biển số xe', '', 1, 0),
(169, 144, 166, 261, NULL, 'IMEI', '', 2, 0),
(170, 144, 166, 261, NULL, 'Tên tài khoản', 'Thucphamaoao', 3, 0),
(171, 144, 166, 261, NULL, 'Số SIM', '', 4, 0),
(172, 152, 178, 281, NULL, 'Tên tài khoản', 'Trandangvinhquang', 1, 0),
(173, 153, 179, 282, NULL, 'Biển số xe', '51l51218', 1, 0),
(174, 153, 179, 282, NULL, 'Tên tài khoản', 'Nghiale', 2, 0),
(175, 155, 181, 284, NULL, 'Biển số xe', '50h44671', 1, 0),
(180, 159, 187, 292, NULL, 'Biển số xe', '51C-896.45', 1, 0),
(181, 159, 187, 292, NULL, 'IMEI', '', 2, 0),
(182, 159, 187, 292, NULL, 'Tên tài khoản', '', 3, 0),
(183, 159, 187, 292, NULL, 'Số SIM', '', 4, 0),
(185, 161, 189, 294, NULL, 'Biển số xe', '94H-004.10', 1, 0),
(198, 162, 192, 302, NULL, 'Biển số xe', '', 1, 0),
(199, 162, 192, 302, NULL, 'IMEI', '', 2, 0),
(200, 162, 192, 302, NULL, 'Tên tài khoản', '', 3, 0),
(201, 162, 192, 302, NULL, 'Số SIM', '', 4, 0),
(202, 162, 192, 303, NULL, 'Biển số xe', '', 1, 0),
(203, 162, 192, 303, NULL, 'IMEI', '', 2, 0),
(204, 162, 192, 303, NULL, 'Tên tài khoản', '', 3, 0),
(205, 162, 192, 303, NULL, 'Số SIM', '', 4, 0),
(206, 162, 192, 304, NULL, 'Biển số xe', '', 1, 0),
(207, 162, 192, 304, NULL, 'IMEI', '', 2, 0),
(208, 162, 192, 304, NULL, 'Tên tài khoản', '', 3, 0),
(209, 162, 192, 304, NULL, 'Số SIM', '', 4, 0),
(210, 155, 181, 284, NULL, 'IMEI', '', 2, 0),
(211, 155, 181, 284, NULL, 'Tên tài khoản', 'Trinhthang', 3, 0),
(212, 155, 181, 284, NULL, 'Số SIM', '', 4, 0),
(213, 164, 194, 306, NULL, 'Biển số xe', '51B32736', 1, 0),
(214, 165, 195, 307, NULL, 'Biển số xe', '50H51632,50E19048', 1, 0),
(215, 166, 196, 308, NULL, 'Biển số xe', '71C05959', 1, 0),
(216, 167, 197, 309, NULL, 'Biển số xe', '51D-263.04', 1, 0),
(217, 171, 201, 316, NULL, 'Biển số xe', '50H88122', 1, 0),
(218, 174, 204, 322, NULL, 'Biển số xe', '63H-038.24', 1, 0),
(219, 177, 207, 325, NULL, 'Biển số xe', '51D21346', 1, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `line_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL DEFAULT 1,
  `unit_price` bigint(20) NOT NULL DEFAULT 0,
  `vat_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `vehicle_plate` varchar(200) DEFAULT NULL,
  `imei` varchar(100) DEFAULT NULL,
  `subscription_account` varchar(64) DEFAULT NULL,
  `years` tinyint(4) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `line_id`, `product_id`, `qty`, `unit_price`, `vat_percent`, `vehicle_plate`, `imei`, `subscription_account`, `years`, `phone`) VALUES
(80, 50, 59, 14, 2, 432000, 0.00, NULL, NULL, NULL, NULL, NULL),
(81, 50, 59, 10, 1, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(82, 50, 59, 4, 1, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(85, 52, 61, 16, 1, 3780000, 0.00, NULL, NULL, NULL, NULL, NULL),
(86, 52, 61, 2, 1, 972000, 0.00, NULL, NULL, NULL, NULL, NULL),
(91, 54, 63, 4, 1, 3120000, 0.00, NULL, NULL, NULL, NULL, NULL),
(92, 54, 63, 10, 1, 1200000, 0.00, NULL, NULL, NULL, NULL, NULL),
(93, 54, 63, 14, 1, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(94, 54, 63, 15, 4, 1620000, 0.00, NULL, NULL, NULL, NULL, NULL),
(95, 55, 64, 2, 1, 972000, 0.00, NULL, NULL, NULL, NULL, NULL),
(96, 56, 65, 17, 5, 600000, 0.00, NULL, NULL, NULL, NULL, NULL),
(97, 57, 66, 2, 1, 972000, 0.00, NULL, NULL, NULL, NULL, NULL),
(98, 58, 67, 2, 5, 642600, 0.00, NULL, NULL, NULL, NULL, NULL),
(99, 59, 68, 2, 50, 529200, 0.00, NULL, NULL, NULL, NULL, NULL),
(100, 60, 69, 23, 3, 1728000, 0.00, NULL, NULL, NULL, NULL, NULL),
(101, 61, 70, 13, 1, 700000, 0.00, NULL, NULL, NULL, NULL, NULL),
(104, 64, 73, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(105, 65, 74, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(106, 66, 75, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(107, 67, 76, 18, 1, 250000, 0.00, NULL, NULL, NULL, NULL, NULL),
(108, 67, 76, 2, 1, 669600, 0.00, NULL, NULL, NULL, NULL, NULL),
(109, 68, 77, 20, 1, 450000, 0.00, NULL, NULL, NULL, NULL, NULL),
(111, 70, 79, 24, 1, 0, 0.00, NULL, NULL, NULL, NULL, NULL),
(117, 72, 81, 2, 3, 972000, 0.00, NULL, NULL, NULL, NULL, NULL),
(118, 72, 81, 6, 1, 378000, 0.00, NULL, NULL, NULL, NULL, NULL),
(119, 72, 81, 10, 1, 1080000, 0.00, NULL, NULL, NULL, NULL, NULL),
(120, 72, 81, 23, 1, 3564000, 0.00, NULL, NULL, NULL, NULL, NULL),
(121, 72, 81, 4, 1, 3294000, 0.00, NULL, NULL, NULL, NULL, NULL),
(122, 73, 82, 18, 1, 480000, 0.00, NULL, NULL, NULL, NULL, NULL),
(123, 74, 83, 17, 50, 80000, 0.00, NULL, NULL, NULL, NULL, NULL),
(124, 75, 84, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(125, 76, 85, 17, 100, 80000, 0.00, NULL, NULL, NULL, NULL, NULL),
(127, 78, 87, 24, 1, 150000, 0.00, NULL, NULL, NULL, NULL, NULL),
(128, 79, 88, 18, 11, 250000, 0.00, NULL, NULL, NULL, NULL, NULL),
(129, 79, 88, 25, 43, 225000, 0.00, NULL, NULL, NULL, NULL, NULL),
(130, 80, 89, 2, 5, 621000, 0.00, NULL, NULL, NULL, NULL, NULL),
(131, 81, 90, 20, 5, 1600000, 0.00, NULL, NULL, NULL, NULL, NULL),
(136, 83, 92, 10, 1, 1080000, 0.00, NULL, NULL, NULL, NULL, NULL),
(137, 83, 92, 23, 1, 3564000, 0.00, NULL, NULL, NULL, NULL, NULL),
(138, 83, 92, 6, 1, 378000, 0.00, NULL, NULL, NULL, NULL, NULL),
(139, 83, 92, 4, 1, 3078000, 0.00, NULL, NULL, NULL, NULL, NULL),
(141, 84, 94, 2, 4, 1568000, 0.00, NULL, NULL, NULL, NULL, NULL),
(142, 85, 95, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(143, 86, 96, 17, 2, 600000, 0.00, NULL, NULL, NULL, NULL, NULL),
(144, 87, 97, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(145, 88, 98, 18, 3, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(146, 89, 99, 27, 15, 360000, 0.00, NULL, NULL, NULL, NULL, NULL),
(147, 89, 99, 4, 5, 2160000, 0.00, NULL, NULL, NULL, NULL, NULL),
(148, 89, 99, 10, 5, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(150, 91, 101, 28, 1, 810000, 0.00, NULL, NULL, NULL, NULL, NULL),
(151, 92, 102, 17, 9, 100000, 0.00, NULL, NULL, NULL, NULL, NULL),
(152, 92, 102, 18, 1, 250000, 0.00, NULL, NULL, NULL, NULL, NULL),
(153, 92, 102, 20, 3, 450000, 0.00, NULL, NULL, NULL, NULL, NULL),
(154, 93, 103, 20, 1, 1800000, 0.00, NULL, NULL, NULL, NULL, NULL),
(155, 94, 104, 2, 1, 972000, 0.00, NULL, NULL, NULL, NULL, NULL),
(156, 95, 105, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(157, 96, 106, 18, 4, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(159, 98, 108, 29, 1, 1320000, 0.00, NULL, NULL, NULL, NULL, NULL),
(160, 97, 109, 20, 1, 1200000, 0.00, NULL, NULL, NULL, NULL, NULL),
(161, 99, 110, 17, 5, 300000, 0.00, NULL, NULL, NULL, NULL, NULL),
(162, 99, 111, 2, 1, 865000, 0.00, NULL, NULL, NULL, NULL, NULL),
(163, 100, 112, 4, 6, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(164, 100, 112, 31, 10, 255000, 0.00, NULL, NULL, NULL, NULL, NULL),
(165, 100, 112, 30, 4, 486000, 0.00, NULL, NULL, NULL, NULL, NULL),
(166, 100, 112, 14, 5, 432000, 0.00, NULL, NULL, NULL, NULL, NULL),
(167, 100, 112, 27, 10, 360000, 0.00, NULL, NULL, NULL, NULL, NULL),
(172, 103, 115, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(174, 104, 117, 17, 3, 600000, 0.00, NULL, NULL, NULL, NULL, NULL),
(175, 105, 118, 2, 1, 810000, 0.00, NULL, NULL, NULL, NULL, NULL),
(180, 102, 122, 5, 1, 2350000, 0.00, NULL, NULL, NULL, NULL, NULL),
(181, 102, 122, 30, 1, 650000, 0.00, NULL, NULL, NULL, NULL, NULL),
(182, 107, 123, 32, 1, 600000, 0.00, NULL, NULL, NULL, NULL, NULL),
(183, 108, 124, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(184, 106, 125, 32, 1, 770000, 0.00, NULL, NULL, NULL, NULL, NULL),
(185, 109, 126, 18, 2, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(186, 110, 127, 20, 5, 450000, 0.00, NULL, NULL, NULL, NULL, NULL),
(187, 111, 128, 17, 4, 150000, 0.00, NULL, NULL, NULL, NULL, NULL),
(188, 111, 128, 28, 2, 540000, 0.00, NULL, NULL, NULL, NULL, NULL),
(197, 113, 131, 4, 2, 2754000, 0.00, NULL, NULL, NULL, NULL, NULL),
(198, 113, 131, 10, 2, 1080000, 0.00, NULL, NULL, NULL, NULL, NULL),
(199, 113, 131, 6, 2, 378000, 0.00, NULL, NULL, NULL, NULL, NULL),
(200, 113, 131, 23, 2, 3456000, 0.00, NULL, NULL, NULL, NULL, NULL),
(202, 114, 133, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(208, 115, 135, 4, 3, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(209, 115, 135, 10, 3, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(210, 115, 135, 14, 4, 432000, 0.00, NULL, NULL, NULL, NULL, NULL),
(211, 115, 135, 31, 1, 250000, 0.00, NULL, NULL, NULL, NULL, NULL),
(212, 116, 136, 20, 1, 1800000, 0.00, NULL, NULL, NULL, NULL, NULL),
(213, 117, 137, 32, 1, 0, 0.00, NULL, NULL, NULL, NULL, NULL),
(214, 118, 138, 18, 18, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(215, 119, 139, 5, 1, 3888000, 0.00, NULL, NULL, NULL, NULL, NULL),
(216, 120, 140, 4, 5, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(217, 120, 140, 30, 10, 486000, 0.00, NULL, NULL, NULL, NULL, NULL),
(218, 120, 140, 14, 10, 432000, 0.00, NULL, NULL, NULL, NULL, NULL),
(219, 120, 140, 27, 5, 360000, 0.00, NULL, NULL, NULL, NULL, NULL),
(220, 121, 141, 28, 5, 464400, 0.00, NULL, NULL, NULL, NULL, NULL),
(221, 122, 142, 5, 1, 2048000, 0.00, NULL, NULL, NULL, NULL, NULL),
(222, 123, 143, 17, 1, 150000, 0.00, NULL, NULL, NULL, NULL, NULL),
(224, 124, 145, 18, 1, 480000, 0.00, NULL, NULL, NULL, NULL, NULL),
(225, 125, 146, 17, 3, 165000, 0.00, NULL, NULL, NULL, NULL, NULL),
(228, 127, 148, 28, 1, 500000, 0.00, NULL, NULL, NULL, NULL, NULL),
(229, 127, 148, 24, 1, 150000, 0.00, NULL, NULL, NULL, NULL, NULL),
(231, 129, 150, 34, 1, 1080000, 0.00, NULL, NULL, NULL, NULL, NULL),
(232, 130, 151, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(233, 131, 152, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(234, 132, 153, 18, 2, 480000, 0.00, NULL, NULL, NULL, NULL, NULL),
(235, 133, 154, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(236, 134, 155, 17, 1, 600000, 0.00, NULL, NULL, NULL, NULL, NULL),
(237, 135, 156, 4, 2, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(238, 136, 157, 2, 1, 810000, 0.00, NULL, NULL, NULL, NULL, NULL),
(240, 137, 159, 18, 1, 700000, 0.00, NULL, NULL, NULL, NULL, NULL),
(241, 138, 160, 18, 1, 480000, 0.00, NULL, NULL, NULL, NULL, NULL),
(246, 140, 162, 5, 2, 2430000, 0.00, NULL, NULL, NULL, NULL, NULL),
(247, 140, 162, 28, 6, 650000, 0.00, NULL, NULL, NULL, NULL, NULL),
(248, 140, 162, 6, 2, 378000, 0.00, NULL, NULL, NULL, NULL, NULL),
(249, 140, 162, 10, 2, 972000, 0.00, NULL, NULL, NULL, NULL, NULL),
(261, 144, 166, 5, 2, 2430000, 0.00, NULL, NULL, NULL, NULL, NULL),
(262, 144, 166, 6, 2, 378000, 0.00, NULL, NULL, NULL, NULL, NULL),
(263, 144, 166, 10, 2, 972000, 0.00, NULL, NULL, NULL, NULL, NULL),
(264, 145, 167, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(266, 147, 169, 28, 1, 810000, 0.00, NULL, NULL, NULL, NULL, NULL),
(267, 142, 170, 5, 2, 2430000, 0.00, NULL, NULL, NULL, NULL, NULL),
(268, 142, 170, 6, 2, 378000, 0.00, NULL, NULL, NULL, NULL, NULL),
(269, 142, 170, 10, 2, 972000, 0.00, NULL, NULL, NULL, NULL, NULL),
(270, 142, 170, 28, 6, 849960, 0.00, NULL, NULL, NULL, NULL, NULL),
(271, 148, 171, 18, 1, 0, 0.00, NULL, NULL, NULL, NULL, NULL),
(273, 149, 173, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(274, 150, 174, 20, 2, 450000, 0.00, NULL, NULL, NULL, NULL, NULL),
(275, 150, 174, 25, 2, 225000, 0.00, NULL, NULL, NULL, NULL, NULL),
(276, 150, 174, 36, 2, 412500, 0.00, NULL, NULL, NULL, NULL, NULL),
(277, 150, 174, 35, 11, 125000, 0.00, NULL, NULL, NULL, NULL, NULL),
(280, 151, 177, 37, 2, 900000, 0.00, NULL, NULL, NULL, NULL, NULL),
(281, 152, 178, 2, 1, 605000, 0.00, NULL, NULL, NULL, NULL, NULL),
(282, 153, 179, 2, 1, 1080000, 0.00, NULL, NULL, NULL, NULL, NULL),
(283, 154, 180, 2, 1, 1080000, 0.00, NULL, NULL, NULL, NULL, NULL),
(284, 155, 181, 2, 1, 810000, 0.00, NULL, NULL, NULL, NULL, NULL),
(285, 156, 182, 24, 1, 216000, 0.00, NULL, NULL, NULL, NULL, NULL),
(286, 157, 183, 38, 2, 230000, 0.00, NULL, NULL, NULL, NULL, NULL),
(287, 158, 184, 4, 2, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(288, 158, 184, 10, 2, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(289, 158, 184, 12, 2, 450000, 0.00, NULL, NULL, NULL, NULL, NULL),
(292, 159, 187, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(294, 161, 189, 24, 1, 100000, 0.00, NULL, NULL, NULL, NULL, NULL),
(302, 162, 192, 4, 1, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(303, 162, 192, 10, 1, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(304, 162, 192, 39, 1, 50000, 0.00, NULL, NULL, NULL, NULL, NULL),
(305, 163, 193, 23, 1, 1620000, 0.00, NULL, NULL, NULL, NULL, NULL),
(306, 164, 194, 20, 1, 1200000, 0.00, NULL, NULL, NULL, NULL, NULL),
(307, 165, 195, 20, 2, 1800000, 0.00, NULL, NULL, NULL, NULL, NULL),
(308, 166, 196, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(309, 167, 197, 18, 1, 700000, 0.00, NULL, NULL, NULL, NULL, NULL),
(314, 170, 200, 20, 10, 450000, 0.00, NULL, NULL, NULL, NULL, NULL),
(315, 170, 200, 18, 10, 250000, 0.00, NULL, NULL, NULL, NULL, NULL),
(316, 171, 201, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(317, 172, 202, 18, 1, 250000, 0.00, NULL, NULL, NULL, NULL, NULL),
(318, 172, 202, 25, 13, 225000, 0.00, NULL, NULL, NULL, NULL, NULL),
(319, 172, 202, 26, 7, 125000, 0.00, NULL, NULL, NULL, NULL, NULL),
(320, 173, 203, 17, 16, 100000, 0.00, NULL, NULL, NULL, NULL, NULL),
(321, 173, 203, 18, 1, 250000, 0.00, NULL, NULL, NULL, NULL, NULL),
(322, 174, 204, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(323, 175, 205, 2, 50, 540000, 0.00, NULL, NULL, NULL, NULL, NULL),
(324, 176, 206, 2, 1, 810000, 0.00, NULL, NULL, NULL, NULL, NULL),
(325, 177, 207, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_lines`
--

CREATE TABLE `order_lines` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `template_id` int(11) DEFAULT NULL,
  `custom_name` varchar(120) DEFAULT NULL,
  `seq` int(11) NOT NULL DEFAULT 0,
  `subtotal` bigint(20) NOT NULL DEFAULT 0,
  `note` varchar(500) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_lines`
--

INSERT INTO `order_lines` (`id`, `order_id`, `template_id`, `custom_name`, `seq`, `subtotal`, `note`, `is_deleted`) VALUES
(1, 1, 1, NULL, 1, 3600000, NULL, 0),
(2, 2, 1, NULL, 1, 1776000, NULL, 0),
(3, 3, 1, NULL, 1, 4536000, NULL, 0),
(4, 4, 1, NULL, 1, 450000, NULL, 0),
(6, 6, 1, NULL, 1, 1620000, NULL, 0),
(8, 8, 1, NULL, 1, 300000, NULL, 0),
(10, 10, 1, NULL, 1, 1620000, NULL, 0),
(13, 12, 1, NULL, 1, 2400000, NULL, 0),
(14, 12, 2, NULL, 2, 550000, NULL, 0),
(17, 14, 2, NULL, 1, 1000000, NULL, 0),
(18, 14, 3, NULL, 2, 500000, NULL, 0),
(19, 15, 1, NULL, 1, 4752000, NULL, 0),
(22, 17, 3, NULL, 1, 3564000, NULL, 0),
(23, 17, 5, NULL, 2, 413000, NULL, 0),
(26, 20, 1, NULL, 1, 6786000, NULL, 0),
(28, 22, 1, NULL, 1, 0, NULL, 0),
(30, 24, 2, NULL, 1, 1500000, NULL, 0),
(32, 26, 5, NULL, 1, 1100000, NULL, 0),
(34, 28, 1, NULL, 1, 378000, NULL, 0),
(35, 29, 2, NULL, 1, 1800000, NULL, 0),
(36, 30, 3, NULL, 1, 600000, NULL, 0),
(37, 30, 4, NULL, 2, 8000000, NULL, 0),
(38, 31, 1, NULL, 1, 3594000, NULL, 0),
(39, 32, 1, NULL, 1, 2400000, NULL, 0),
(40, 33, 2, NULL, 1, 1200000, NULL, 0),
(43, 36, 1, NULL, 1, 972000, NULL, 0),
(44, 37, 1, NULL, 1, 53898000, NULL, 0),
(45, 38, 1, NULL, 1, 5400000, NULL, 0),
(48, 40, 1, NULL, 1, 1944000, NULL, 0),
(49, 41, 1, NULL, 1, 1950000, NULL, 0),
(50, 35, 1, NULL, 1, 1400000, NULL, 0),
(51, 42, 1, NULL, 1, 1200000, NULL, 0),
(52, 43, 1, NULL, 1, 750000, NULL, 0),
(54, 45, 1, NULL, 1, 1200000, NULL, 0),
(55, 46, 1, NULL, 1, 4764000, NULL, 0),
(56, 47, 1, NULL, 1, 1200000, NULL, 0),
(57, 48, 1, NULL, 1, 1200000, NULL, 0),
(58, 49, 1, NULL, 1, 1200000, NULL, 0),
(59, 50, 11, NULL, 1, 3942000, NULL, 0),
(61, 52, 1, NULL, 1, 4752000, NULL, 0),
(63, 54, 1, NULL, 1, 11664000, NULL, 0),
(64, 55, 11, NULL, 1, 972000, NULL, 0),
(65, 56, 2, NULL, 1, 3000000, NULL, 0),
(66, 57, 1, NULL, 1, 972000, NULL, 0),
(67, 58, 11, NULL, 1, 3213000, NULL, 0),
(68, 59, 11, NULL, 1, 26460000, NULL, 0),
(69, 60, 11, NULL, 1, 5184000, NULL, 0),
(70, 61, 2, NULL, 1, 700000, NULL, 0),
(73, 64, 2, NULL, 1, 750000, NULL, 0),
(74, 65, 2, NULL, 1, 750000, NULL, 0),
(75, 66, 2, NULL, 1, 750000, NULL, 0),
(76, 67, 2, NULL, 1, 919600, NULL, 0),
(77, 68, 2, NULL, 1, 450000, NULL, 0),
(79, 70, 8, NULL, 1, 0, NULL, 0),
(81, 72, 1, NULL, 1, 11232000, NULL, 0),
(82, 73, 2, NULL, 1, 480000, NULL, 0),
(83, 74, 2, NULL, 1, 4000000, NULL, 0),
(84, 75, 2, NULL, 1, 750000, NULL, 0),
(85, 76, 2, NULL, 1, 8000000, NULL, 0),
(87, 78, 8, NULL, 1, 150000, NULL, 0),
(88, 79, 2, NULL, 1, 12425000, NULL, 0),
(89, 80, 11, NULL, 1, 3105000, NULL, 0),
(90, 81, 2, NULL, 1, 8000000, NULL, 0),
(92, 83, 1, NULL, 1, 8100000, NULL, 0),
(94, 84, 1, NULL, 1, 6272000, NULL, 0),
(95, 85, 2, NULL, 1, 750000, NULL, 0),
(96, 86, 2, NULL, 1, 1200000, NULL, 0),
(97, 87, 2, NULL, 1, 750000, NULL, 0),
(98, 88, 2, NULL, 1, 2250000, NULL, 0),
(99, 89, 11, NULL, 1, 20520000, NULL, 0),
(101, 91, 1, NULL, 1, 810000, NULL, 0),
(102, 92, 2, NULL, 1, 2500000, NULL, 0),
(103, 93, 2, NULL, 1, 1800000, NULL, 0),
(104, 94, 1, NULL, 1, 972000, NULL, 0),
(105, 95, 2, NULL, 1, 750000, NULL, 0),
(106, 96, 2, NULL, 1, 3000000, NULL, 0),
(108, 98, 2, NULL, 1, 1320000, NULL, 0),
(109, 97, 2, NULL, 1, 1200000, NULL, 0),
(110, 99, 2, NULL, 1, 1500000, NULL, 0),
(111, 99, 11, NULL, 2, 865000, NULL, 0),
(112, 100, 11, NULL, 1, 23538000, NULL, 0),
(115, 103, 2, NULL, 1, 750000, NULL, 0),
(117, 104, 2, NULL, 1, 1800000, NULL, 0),
(118, 105, 1, NULL, 1, 810000, NULL, 0),
(122, 102, 1, NULL, 1, 3000000, NULL, 0),
(123, 107, 2, NULL, 1, 600000, NULL, 0),
(124, 108, 2, NULL, 1, 750000, NULL, 0),
(125, 106, 2, NULL, 1, 770000, NULL, 0),
(126, 109, 2, NULL, 1, 1500000, NULL, 0),
(127, 110, 2, NULL, 1, 2250000, NULL, 0),
(128, 111, 2, NULL, 1, 1680000, NULL, 0),
(131, 113, 1, NULL, 1, 15336000, NULL, 0),
(133, 114, 2, NULL, 1, 750000, NULL, 0),
(135, 115, 11, NULL, 1, 11212000, NULL, 0),
(136, 116, 2, NULL, 1, 1800000, NULL, 0),
(137, 117, 1, NULL, 1, 0, NULL, 0),
(138, 118, 2, NULL, 1, 13500000, NULL, 0),
(139, 119, 1, NULL, 1, 3888000, NULL, 0),
(140, 120, 11, NULL, 1, 22050000, NULL, 0),
(141, 121, 11, NULL, 1, 2322000, NULL, 0),
(142, 122, 11, NULL, 1, 2048000, NULL, 0),
(143, 123, 2, NULL, 1, 150000, NULL, 0),
(145, 124, 2, NULL, 1, 480000, NULL, 0),
(146, 125, 2, NULL, 1, 495000, NULL, 0),
(148, 127, 1, NULL, 1, 650000, NULL, 0),
(150, 129, 11, NULL, 1, 1080000, NULL, 0),
(151, 130, 2, NULL, 1, 750000, NULL, 0),
(152, 131, 2, NULL, 1, 750000, NULL, 0),
(153, 132, 2, NULL, 1, 960000, NULL, 0),
(154, 133, 2, NULL, 1, 750000, NULL, 0),
(155, 134, 2, NULL, 1, 600000, NULL, 0),
(156, 135, 11, NULL, 1, 4428000, NULL, 0),
(157, 136, 1, NULL, 1, 810000, NULL, 0),
(159, 137, 2, NULL, 1, 700000, NULL, 0),
(160, 138, 2, NULL, 1, 480000, NULL, 0),
(162, 140, 1, NULL, 1, 11460000, NULL, 0),
(166, 144, 1, NULL, 1, 7560000, NULL, 0),
(167, 145, 2, NULL, 1, 750000, NULL, 0),
(169, 147, 1, NULL, 1, 810000, NULL, 0),
(170, 142, 1, NULL, 1, 12659760, NULL, 0),
(171, 148, 2, NULL, 1, 0, NULL, 0),
(173, 149, 2, NULL, 1, 750000, NULL, 0),
(174, 150, 2, NULL, 1, 3550000, NULL, 0),
(177, 151, 11, NULL, 1, 1800000, NULL, 0),
(178, 152, 1, NULL, 1, 605000, NULL, 0),
(179, 153, 1, NULL, 1, 1080000, NULL, 0),
(180, 154, 1, NULL, 1, 1080000, NULL, 0),
(181, 155, 1, NULL, 1, 810000, NULL, 0),
(182, 156, 10, NULL, 1, 216000, NULL, 0),
(183, 157, 2, NULL, 1, 460000, NULL, 0),
(184, 158, 11, NULL, 1, 7056000, NULL, 0),
(187, 159, 2, NULL, 1, 750000, NULL, 0),
(189, 161, 8, NULL, 1, 100000, NULL, 0),
(192, 162, 11, NULL, 1, 3128000, NULL, 0),
(193, 163, 11, NULL, 1, 1620000, NULL, 0),
(194, 164, 2, NULL, 1, 1200000, NULL, 0),
(195, 165, 2, NULL, 1, 3600000, NULL, 0),
(196, 166, 2, NULL, 1, 750000, NULL, 0),
(197, 167, 2, NULL, 1, 700000, NULL, 0),
(200, 170, 2, NULL, 1, 7000000, NULL, 0),
(201, 171, 2, NULL, 1, 750000, NULL, 0),
(202, 172, 2, NULL, 1, 4050000, NULL, 0),
(203, 173, 2, NULL, 1, 1850000, NULL, 0),
(204, 174, 2, NULL, 1, 750000, NULL, 0),
(205, 175, 11, NULL, 1, 27000000, NULL, 0),
(206, 176, 1, NULL, 1, 810000, NULL, 0),
(207, 177, 2, NULL, 1, 750000, NULL, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_payments`
--

CREATE TABLE `order_payments` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `amount` bigint(20) NOT NULL,
  `source` enum('staff_collection','admin_mark_paid','customer_self_pay','admin_pending','refund','staff_received') NOT NULL,
  `confirmed` tinyint(1) NOT NULL DEFAULT 1,
  `confirmed_at` datetime DEFAULT NULL,
  `confirmed_by` int(11) DEFAULT NULL,
  `collection_id` int(11) DEFAULT NULL,
  `task_id` int(11) DEFAULT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `paid_at` datetime NOT NULL DEFAULT current_timestamp(),
  `note` text DEFAULT NULL,
  `proof_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`proof_urls`)),
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_payments`
--

INSERT INTO `order_payments` (`id`, `order_id`, `amount`, `source`, `confirmed`, `confirmed_at`, `confirmed_by`, `collection_id`, `task_id`, `staff_id`, `paid_at`, `note`, `proof_urls`, `is_deleted`) VALUES
(24, 52, 4752000, 'admin_pending', 1, '2026-06-09 09:48:08', 1, NULL, NULL, 8, '2026-05-26 10:20:03', 'KTV bao khach da tra admin truc tiep — doi admin xac nhan', NULL, 0),
(25, 55, 972000, 'staff_received', 1, '2026-05-26 11:49:22', NULL, NULL, NULL, 3, '2026-05-26 11:49:22', '[Chuyển khoản] ck cty 26.5', '[\"https://i.ibb.co/gZDhWHpT/sr-ord-55-1779770958958.jpg\"]', 0),
(26, 56, 3000000, 'staff_received', 1, '2026-05-26 15:04:20', NULL, NULL, NULL, 3, '2026-05-26 15:04:20', '[Chuyển khoản] ck 26.5', NULL, 0),
(27, 58, 3213000, 'staff_received', 1, '2026-05-26 15:21:27', NULL, NULL, NULL, 3, '2026-05-26 15:21:27', '[Tiền mặt]', '[\"https://i.ibb.co/tTwqs5tP/sr-ord-58-1779783685429.jpg\"]', 0),
(29, 61, 700000, 'staff_received', 1, '2026-05-27 09:09:24', NULL, NULL, NULL, 3, '2026-05-27 09:09:24', '[Chuyển khoản] ck cty 27.5', '[\"https://i.ibb.co/TB8gvbFT/sr-ord-61-1779847762894.jpg\"]', 0),
(30, 65, 750000, 'staff_received', 1, '2026-05-27 09:32:47', NULL, NULL, NULL, 3, '2026-05-27 09:32:47', '[Tiền mặt]', '[\"https://i.ibb.co/Ndb9ts6z/sr-ord-65-1779849165277.jpg\"]', 0),
(31, 57, 972000, 'staff_received', 1, '2026-05-27 09:36:18', NULL, NULL, NULL, 3, '2026-05-27 09:36:18', '[Tiền mặt] anh Thoại thu', NULL, 0),
(32, 60, 5184000, 'staff_received', 1, '2026-05-27 15:03:53', NULL, NULL, NULL, 3, '2026-05-27 15:03:53', '[Chuyển khoản] ck cty  31tr644', NULL, 0),
(33, 59, 26460000, 'staff_received', 1, '2026-05-27 15:04:10', NULL, NULL, NULL, 3, '2026-05-27 15:04:10', '[Chuyển khoản] ck cty  31tr644', NULL, 0),
(34, 52, 4752000, 'staff_received', 1, '2026-05-27 15:04:53', NULL, NULL, NULL, 3, '2026-05-27 15:04:53', '[Chuyển khoản] ck 25.5 4tr752', NULL, 0),
(35, 66, 750000, 'staff_received', 1, '2026-05-27 16:36:59', NULL, NULL, NULL, 3, '2026-05-27 16:36:59', '[Chuyển khoản] 27.5 Thai Thi Anh Thi ck', NULL, 0),
(36, 67, 919600, 'staff_received', 1, '2026-05-27 17:15:44', NULL, NULL, NULL, 3, '2026-05-27 17:15:44', '[Chuyển khoản] 2 HÓA ĐƠN SỐ 285,286', '[\"https://i.ibb.co/3m0dCph4/sr-ord-67-1779876942530.jpg\"]', 0),
(37, 68, 450000, 'staff_received', 1, '2026-05-27 17:24:38', NULL, NULL, NULL, 3, '2026-05-27 17:24:38', '[Chuyển khoản]', '[\"https://i.ibb.co/35Yv9DSw/sr-ord-68-1779877477091.jpg\"]', 0),
(38, 73, 480000, 'staff_received', 1, '2026-05-28 08:34:11', NULL, NULL, NULL, 3, '2026-05-28 08:34:11', '[Tiền mặt] ck anh Cương 27.5', NULL, 0),
(39, 75, 750000, 'staff_received', 1, '2026-05-28 13:22:13', NULL, NULL, NULL, 3, '2026-05-28 13:22:13', '[Chuyển khoản] ck 750k 28.5.2026', NULL, 0),
(40, 78, 150000, 'staff_received', 1, '2026-05-28 13:35:47', NULL, NULL, NULL, 3, '2026-05-28 13:35:47', '[Tiền mặt] anh Viện thu công', NULL, 0),
(41, 76, 8000000, 'staff_received', 1, '2026-05-28 13:42:40', NULL, NULL, NULL, 3, '2026-05-28 13:42:40', '[Chuyển khoản]', NULL, 0),
(42, 74, 4000000, 'staff_received', 1, '2026-05-28 13:42:56', NULL, NULL, NULL, 3, '2026-05-28 13:42:56', '[Chuyển khoản]', '[\"https://i.ibb.co/27H1rhYv/sr-ord-74-1779950579303.jpg\"]', 0),
(43, 80, 3105000, 'staff_received', 1, '2026-05-28 14:00:43', NULL, NULL, NULL, 3, '2026-05-28 14:00:43', '[Chuyển khoản] ck 28.5 hóa đơn 289', '[\"https://i.ibb.co/p6HK19kw/sr-ord-80-1779951642912.jpg\"]', 0),
(44, 86, 1200000, 'staff_received', 1, '2026-05-29 08:58:48', NULL, NULL, NULL, 3, '2026-05-29 08:58:48', '[Chuyển khoản] 29.5 ck cty 1tr2 2 xe', NULL, 0),
(45, 84, 6272000, 'staff_received', 1, '2026-05-29 08:59:08', NULL, NULL, NULL, 3, '2026-05-29 08:59:08', '[Tiền mặt] 29.5 Q nhận 6tr272 tiền mặt, đưa sếp', NULL, 0),
(46, 85, 750000, 'admin_mark_paid', 1, '2026-05-29 09:45:25', 1, NULL, NULL, NULL, '2026-05-29 09:45:25', '[method=cash]', NULL, 0),
(47, 91, 810000, 'staff_received', 1, '2026-05-29 13:53:21', NULL, NULL, NULL, 3, '2026-05-29 13:53:21', '[Chuyển khoản] ck cty 29.5 810k', NULL, 0),
(48, 92, 2500000, 'staff_received', 1, '2026-05-29 14:55:46', NULL, NULL, NULL, 3, '2026-05-29 14:55:46', '[Tiền mặt] ck anh Cương 29.5', '[\"https://i.ibb.co/QvqhVdhT/sr-ord-92-1780041346083.jpg\"]', 0),
(49, 87, 750000, 'staff_received', 1, '2026-05-29 15:05:57', NULL, NULL, NULL, 3, '2026-05-29 15:05:57', '[Chuyển khoản] ck cty 29.5', NULL, 0),
(50, 93, 1800000, 'staff_received', 1, '2026-05-29 16:24:48', NULL, NULL, NULL, 3, '2026-05-29 16:24:48', '[Chuyển khoản] ck cty 29.5 1tr8', NULL, 0),
(51, 72, 11232000, 'admin_mark_paid', 1, '2026-05-30 08:19:44', 1, NULL, NULL, NULL, '2026-05-30 08:19:44', '[method=transfer]', '[\"https://i.ibb.co/QjHQ1xv9/pay-72-1780103985575.jpg\"]', 0),
(52, 95, 750000, 'staff_received', 1, '2026-05-30 10:44:45', NULL, NULL, NULL, 3, '2026-05-30 10:44:45', '[Chuyển khoản]', '[\"https://i.ibb.co/277DgLMN/sr-ord-95-1780112688576.jpg\"]', 0),
(53, 97, 1200000, 'staff_received', 1, '2026-05-30 14:10:55', NULL, NULL, NULL, 3, '2026-05-30 14:10:55', '[Chuyển khoản] 30.5 ck cty 1tr2', NULL, 0),
(54, 99, 2365000, 'staff_received', 1, '2026-05-30 17:53:12', NULL, NULL, NULL, 3, '2026-05-30 17:53:12', '[Chuyển khoản]', '[\"https://i.ibb.co/DgPykngd/sr-ord-99-1780138396747.jpg\"]', 0),
(55, 98, 1320000, 'staff_received', 1, '2026-06-01 09:32:20', NULL, NULL, NULL, 3, '2026-06-01 09:32:20', '[Chuyển khoản] ck cty 1.6.2026', '[\"https://i.ibb.co/HfF6CbTp/sr-ord-98-1780281133896.jpg\"]', 0),
(56, 103, 750000, 'staff_received', 1, '2026-06-01 10:22:25', NULL, NULL, NULL, 3, '2026-06-01 10:22:25', '[Chuyển khoản]', NULL, 0),
(57, 102, 3000000, 'staff_collection', 1, NULL, NULL, 13, NULL, 2, '2026-06-01 15:09:26', NULL, NULL, 0),
(58, 107, 600000, 'staff_received', 1, '2026-06-01 16:05:49', NULL, NULL, NULL, 3, '2026-06-01 16:05:49', '[Chuyển khoản] ck cá nhân anh C 1.6', NULL, 0),
(59, 108, 750000, 'staff_received', 1, '2026-06-01 16:10:54', NULL, NULL, NULL, 3, '2026-06-01 16:10:54', '[Chuyển khoản] ck 1.6', NULL, 0),
(60, 81, 8000000, 'staff_received', 1, '2026-06-01 16:12:43', NULL, NULL, NULL, 6, '2026-06-01 16:12:43', '[Chuyển khoản]', '[\"https://i.ibb.co/4gw0Xw5y/order-81-1780305140955.jpg\"]', 0),
(61, 106, 770000, 'staff_received', 1, '2026-06-01 16:48:06', NULL, NULL, NULL, 3, '2026-06-01 16:48:06', '[Chuyển khoản]', NULL, 0),
(62, 109, 1500000, 'staff_received', 1, '2026-06-01 16:51:28', NULL, NULL, NULL, 6, '2026-06-01 16:51:28', '[Chuyển khoản]', '[\"https://i.ibb.co/gM7SQ6g7/sr-ord-109-1780307476457.jpg\"]', 0),
(63, 104, 1800000, 'staff_received', 1, '2026-06-02 08:35:24', NULL, NULL, NULL, 3, '2026-06-02 08:35:24', '[Chuyển khoản] 2.6.2026 ck 1tr8', NULL, 0),
(64, 110, 2250000, 'staff_received', 1, '2026-06-02 09:17:23', NULL, NULL, NULL, 6, '2026-06-02 09:17:23', '[Chuyển khoản]', '[\"https://i.ibb.co/23kshK0y/sr-ord-110-1780366641630.jpg\"]', 0),
(65, 111, 1680000, 'staff_received', 1, '2026-06-02 09:41:12', NULL, NULL, NULL, 3, '2026-06-02 09:41:12', '[Chuyển khoản] ck anh Cương 2.6', NULL, 0),
(66, 111, 1680000, 'staff_received', 1, '2026-06-02 09:41:14', NULL, NULL, NULL, 3, '2026-06-02 09:41:14', '[Tiền mặt]', NULL, 0),
(67, 114, 750000, 'staff_received', 1, '2026-06-02 11:20:19', NULL, NULL, NULL, 3, '2026-06-02 11:20:19', '[Chuyển khoản] ck cty 2.6', NULL, 0),
(68, 116, 1800000, 'staff_received', 1, '2026-06-02 17:15:01', NULL, NULL, NULL, 3, '2026-06-02 17:15:01', '[Chuyển khoản] ck cty 2.6', '[\"https://i.ibb.co/zTX23JTR/sr-ord-116-1780395299654.jpg\"]', 0),
(69, 118, 13500000, 'staff_received', 1, '2026-06-03 08:58:40', NULL, NULL, NULL, 3, '2026-06-03 08:58:40', '[Chuyển khoản] 3.6 thu gh 13tr500', NULL, 0),
(70, 121, 2322000, 'staff_received', 1, '2026-06-03 10:38:54', NULL, NULL, NULL, 3, '2026-06-03 10:38:54', '[Chuyển khoản] ck 3.6.26', '[\"https://i.ibb.co/sdtyBKFM/sr-ord-121-1780457932663.jpg\"]', 0),
(71, 130, 750000, 'staff_received', 1, '2026-06-03 16:58:59', NULL, NULL, NULL, 3, '2026-06-03 16:58:59', '[Chuyển khoản] ck cty 3.6.26', NULL, 0),
(72, 133, 750000, 'staff_received', 1, '2026-06-04 09:04:44', NULL, NULL, NULL, 3, '2026-06-04 09:04:44', '[Chuyển khoản] ck cty 4.6 ductan', NULL, 0),
(73, 134, 600000, 'staff_received', 1, '2026-06-04 09:08:40', NULL, NULL, NULL, 3, '2026-06-04 09:08:40', '[Chuyển khoản] ck 600k 4.6', NULL, 0),
(74, 131, 750000, 'staff_received', 1, '2026-06-04 09:49:12', NULL, NULL, NULL, 3, '2026-06-04 09:49:12', '[Chuyển khoản] ck cty 4.6', '[\"https://i.ibb.co/fdNNfkFQ/sr-ord-131-1780541350121.jpg\"]', 0),
(75, 135, 4428000, 'staff_received', 1, '2026-06-04 09:50:14', NULL, NULL, NULL, 3, '2026-06-04 09:50:14', '[Chuyển khoản]', NULL, 0),
(76, 137, 700000, 'staff_received', 1, '2026-06-04 11:17:05', NULL, NULL, NULL, 3, '2026-06-04 11:17:05', '[Chuyển khoản] ck cty', '[\"https://i.ibb.co/JWtFh09r/sr-ord-137-1780546625897.jpg\"]', 0),
(77, 138, 480000, 'staff_received', 1, '2026-06-04 13:17:16', NULL, NULL, NULL, 3, '2026-06-04 13:17:16', '[Chuyển khoản] ck anh Cương 4.6', '[\"https://i.ibb.co/TjchYJq/sr-ord-138-1780553836690.jpg\"]', 0),
(78, 149, 750000, 'staff_received', 1, '2026-06-05 08:43:59', NULL, NULL, NULL, 3, '2026-06-05 08:43:59', '[Chuyển khoản]', NULL, 0),
(79, 153, 1080000, 'staff_received', 1, '2026-06-05 19:46:55', NULL, NULL, NULL, 3, '2026-06-05 19:46:55', '[Tiền mặt] Anh V thu 1tr80', NULL, 0),
(80, 157, 460000, 'staff_received', 1, '2026-06-06 10:10:28', NULL, NULL, NULL, 3, '2026-06-06 10:10:28', '[Tiền mặt]', NULL, 0),
(81, 159, 750000, 'staff_received', 1, '2026-06-06 12:04:55', NULL, NULL, NULL, 3, '2026-06-06 12:04:55', '[Chuyển khoản] ck cty 6/6', '[\"https://i.ibb.co/bgzZnqJN/sr-ord-159-1780722298422.jpg\"]', 0),
(82, 162, 3128000, 'admin_mark_paid', 1, '2026-06-06 19:45:32', 1, NULL, NULL, NULL, '2026-06-06 19:45:32', '[method=transfer]', NULL, 0),
(83, 163, 1620000, 'admin_mark_paid', 1, '2026-06-09 09:42:45', 1, NULL, NULL, NULL, '2026-06-09 09:42:45', '[method=transfer]', NULL, 0),
(84, 165, 3600000, 'staff_received', 1, '2026-06-09 14:17:07', NULL, NULL, NULL, 6, '2026-06-09 14:17:07', '[Chuyển khoản]', '[\"https://i.ibb.co/jk2GdtQg/sr-ord-168-1780979392027.jpg\"]', 0),
(85, 166, 750000, 'staff_received', 1, '2026-06-09 14:18:15', NULL, NULL, NULL, 6, '2026-06-09 14:18:15', '[Chuyển khoản]', '[\"https://i.ibb.co/2Yg3py47/sr-ord-169-1780980395591.jpg\"]', 0),
(86, 150, 3550000, 'staff_received', 1, '2026-06-09 15:21:44', NULL, NULL, NULL, 3, '2026-06-09 15:21:44', '[Chuyển khoản] 9.6.26 ck cty', '[\"https://i.ibb.co/Xx94YZ70/sr-ord-150-1780993301577.jpg\"]', 0),
(87, 170, 7000000, 'staff_received', 1, '2026-06-09 16:21:55', NULL, NULL, NULL, 3, '2026-06-09 16:21:55', '[Chuyển khoản]', '[\"https://i.ibb.co/DfrW1FWy/sr-ord-170-1780996913778.jpg\"]', 0),
(88, 171, 750000, 'staff_received', 1, '2026-06-09 16:22:11', NULL, NULL, NULL, 6, '2026-06-09 16:22:11', '[Chuyển khoản]', '[\"https://i.ibb.co/PshJsWsB/sr-ord-171-1780996929899.jpg\"]', 0),
(89, 173, 1850000, 'staff_received', 1, '2026-06-09 16:59:32', NULL, NULL, NULL, 3, '2026-06-09 16:59:32', '[Chuyển khoản]', '[\"https://i.ibb.co/gbGhhZDK/sr-ord-173-1780999168822.jpg\"]', 0),
(90, 174, 750000, 'staff_received', 1, '2026-06-10 08:47:15', NULL, NULL, NULL, 6, '2026-06-10 08:47:15', '[Chuyển khoản]', '[\"https://i.ibb.co/7mf4S0k/sr-ord-174-1781056031648.jpg\"]', 0),
(91, 167, 700000, 'staff_received', 1, '2026-06-10 09:08:41', NULL, NULL, NULL, 3, '2026-06-10 09:08:41', '[Chuyển khoản]', '[\"https://i.ibb.co/sDRkZvr/sr-ord-167-1781057318988.jpg\"]', 0),
(92, 177, 750000, 'staff_received', 1, '2026-06-10 11:37:33', NULL, NULL, NULL, 3, '2026-06-10 11:37:33', '[Chuyển khoản]', '[\"https://i.ibb.co/LDBTd8SD/sr-ord-177-1781066253026.jpg\"]', 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_staff_commissions`
--

CREATE TABLE `order_staff_commissions` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `amount` bigint(20) NOT NULL DEFAULT 0,
  `note` varchar(300) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `carried_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `requested_by` int(11) DEFAULT NULL,
  `requested_at` datetime DEFAULT NULL,
  `payslip_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_staff_commissions`
--

INSERT INTO `order_staff_commissions` (`id`, `order_id`, `staff_id`, `amount`, `note`, `approved_at`, `approved_by`, `carried_at`, `is_deleted`, `requested_by`, `requested_at`, `payslip_id`) VALUES
(18, 54, 3, 116000, NULL, NULL, NULL, NULL, 1, 6, '2026-05-26 11:12:54', NULL),
(19, 57, 3, 97000, NULL, NULL, NULL, NULL, 1, 6, '2026-05-26 15:23:39', NULL),
(20, 83, 8, 100000, NULL, '2026-05-29 09:14:56', 1, NULL, 0, 3, '2026-05-29 09:13:18', NULL),
(21, 89, 3, 20000, NULL, '2026-05-29 13:52:57', 1, NULL, 0, NULL, NULL, NULL),
(22, 94, 3, 9720, '', '2026-05-30 08:22:24', 1, NULL, 0, NULL, NULL, NULL),
(23, 78, 8, 100000, NULL, '2026-05-30 12:00:25', 1, NULL, 0, NULL, NULL, NULL),
(24, 97, 3, 12000, '', '2026-05-30 13:13:45', 1, NULL, 0, NULL, NULL, NULL),
(25, 98, 3, 10000, NULL, '2026-06-02 09:47:10', 1, NULL, 0, 3, '2026-05-30 14:11:29', NULL),
(26, 103, 3, 7500, NULL, '2026-06-02 09:47:12', 1, NULL, 0, 3, '2026-06-01 10:22:36', NULL),
(27, 102, 2, 150000, 'Thêm công lắp', '2026-06-02 16:35:21', 1, NULL, 0, NULL, NULL, NULL),
(28, 142, 8, 450000, 'Lắp chung với Thoại', '2026-06-05 13:49:44', 1, NULL, 0, NULL, NULL, NULL),
(29, 151, 3, 18000, NULL, '2026-06-05 16:34:26', 1, NULL, 0, NULL, NULL, NULL),
(30, 153, 8, 100000, NULL, '2026-06-05 21:58:23', 1, NULL, 0, NULL, NULL, NULL),
(31, 162, 3, 20000, NULL, '2026-06-06 19:45:11', 1, NULL, 0, NULL, NULL, NULL),
(32, 158, 3, 20000, NULL, '2026-06-09 09:45:25', 1, NULL, 0, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_step_photos`
--

CREATE TABLE `order_step_photos` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `step_code` varchar(50) NOT NULL,
  `url` varchar(500) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_step_photos`
--

INSERT INTO `order_step_photos` (`id`, `order_id`, `step_code`, `url`, `caption`, `uploaded_by`, `uploaded_at`, `is_deleted`) VALUES
(1, 3, 'in_progress', 'https://i.ibb.co/Nnb0zpSd/4c877f0979ac.jpg', NULL, 8, '2026-05-21 08:42:12', 0),
(2, 3, 'in_progress', 'https://i.ibb.co/qL37q5w0/9fc40a542567.jpg', NULL, 8, '2026-05-21 08:42:27', 0),
(3, 3, 'in_progress', 'https://i.ibb.co/dsZy7k6g/951da186b53f.jpg', NULL, 8, '2026-05-21 08:42:39', 0),
(4, 15, 'in_progress', 'https://i.ibb.co/FLnBsxP7/2a5568ed0d82.jpg', NULL, 8, '2026-05-22 16:06:42', 0),
(5, 15, 'in_progress', 'https://i.ibb.co/gZ19zBTQ/9811ed457cd3.jpg', NULL, 8, '2026-05-22 16:06:48', 0),
(6, 15, 'in_progress', 'https://i.ibb.co/PsHr50xv/d3b65b071536.jpg', NULL, 8, '2026-05-22 16:07:00', 0),
(7, 15, 'done', 'https://i.ibb.co/PsHr50xv/d3b65b071536.jpg', NULL, 8, '2026-05-22 16:08:52', 0),
(8, 20, 'in_progress', 'https://i.ibb.co/FLnBsxP7/2a5568ed0d82.jpg', NULL, 8, '2026-05-22 16:32:57', 0),
(9, 20, 'in_progress', 'https://i.ibb.co/PsHr50xv/d3b65b071536.jpg', NULL, 8, '2026-05-22 16:33:04', 0),
(10, 31, 'in_progress', 'https://i.ibb.co/FLnBsxP7/2a5568ed0d82.jpg', NULL, 8, '2026-05-22 17:00:00', 0),
(11, 35, '', 'https://i.ibb.co/WWmDw5d2/087d4c0ff69e.png', NULL, 6, '2026-05-22 17:44:09', 0),
(12, 28, 'done', 'https://i.ibb.co/svdFz9wB/order-28-done.png', NULL, 7, '2026-05-23 04:36:01', 0),
(13, 36, 'in_progress', 'https://i.ibb.co/zVS27pjp/3e5776aa5ece.jpg', NULL, 8, '2026-05-23 15:46:27', 0),
(14, 36, 'in_progress', 'https://i.ibb.co/Kc21pKh3/18dfbd4b9753.jpg', NULL, 8, '2026-05-23 15:46:41', 0),
(15, 37, 'in_progress', 'https://i.ibb.co/fzsxp6JD/f778b522c51b.jpg', NULL, 2, '2026-05-24 14:31:36', 0),
(16, 37, 'in_progress', 'https://i.ibb.co/5gKP2fSJ/55850637f84f.jpg', NULL, 2, '2026-05-24 14:31:47', 0),
(17, 37, 'in_progress', 'https://i.ibb.co/VW6Nn00g/7ee1716889df.jpg', NULL, 2, '2026-05-24 14:32:01', 0),
(18, 37, 'in_progress', 'https://i.ibb.co/Xx9Pggb4/a489132b501c.jpg', NULL, 2, '2026-05-24 14:32:23', 0),
(19, 37, 'in_progress', 'https://i.ibb.co/2f4jdkT/4111c0771009.jpg', NULL, 2, '2026-05-24 14:32:29', 0),
(20, 37, 'in_progress', 'https://i.ibb.co/m5p9ykNQ/19f5041f7ce5.jpg', NULL, 2, '2026-05-24 14:32:38', 0),
(21, 37, 'in_progress', 'https://i.ibb.co/2f4jdkT/4111c0771009.jpg', NULL, 2, '2026-05-24 14:32:58', 0),
(22, 37, 'in_progress', 'https://i.ibb.co/9k3w5n6v/53a29f7ee673.jpg', NULL, 2, '2026-05-24 14:33:01', 0),
(23, 37, 'in_progress', 'https://i.ibb.co/9k3w5n6v/53a29f7ee673.jpg', NULL, 2, '2026-05-24 14:33:12', 0),
(24, 40, 'confirmed', 'https://i.ibb.co/TD82J7Nm/bdd54aea5792.jpg', NULL, 2, '2026-05-24 15:03:56', 0),
(25, 52, 'in_progress', 'https://i.ibb.co/rKZBwqqF/b015780a96c1.jpg', NULL, 8, '2026-05-26 03:16:18', 0),
(26, 52, 'in_progress', 'https://i.ibb.co/BK3YkLN7/71d752f94a50.jpg', NULL, 8, '2026-05-26 03:16:50', 0),
(27, 52, 'in_progress', 'https://i.ibb.co/wFqxGLWW/4615a3007bd3.jpg', NULL, 8, '2026-05-26 03:16:57', 0),
(28, 52, 'done', 'https://i.ibb.co/7NS3BSqj/order-52-done.jpg', NULL, 8, '2026-05-26 03:20:15', 0),
(29, 94, 'done', 'https://i.ibb.co/hJqj493V/672adb84748d.jpg', NULL, 2, '2026-05-30 02:17:29', 0),
(30, 94, 'done', 'https://i.ibb.co/V0pCYQSc/3cba54087187.jpg', NULL, 2, '2026-05-30 02:17:30', 0),
(31, 91, 'done', 'https://i.ibb.co/JFtPyN2m/5c72d7bb6f16.jpg', NULL, 2, '2026-05-30 02:24:52', 0),
(32, 91, 'done', 'https://i.ibb.co/4gWx73z0/0745d3008904.jpg', NULL, 2, '2026-05-30 02:24:53', 0),
(33, 57, 'done', 'https://i.ibb.co/ymkxRhsd/78127cf0bc24.jpg', NULL, 2, '2026-05-30 02:25:41', 0),
(34, 57, 'done', 'https://i.ibb.co/Xrwcc7xv/104f9aef8d49.jpg', NULL, 2, '2026-05-30 02:25:46', 0),
(35, 102, 'confirmed', 'https://i.ibb.co/s91KPgyf/436f9522161f.jpg', NULL, 2, '2026-06-01 08:08:39', 0),
(36, 102, 'confirmed', 'https://i.ibb.co/gL77J66Y/a60815a00b6e.jpg', NULL, 2, '2026-06-01 08:08:48', 0),
(37, 102, 'confirmed', 'https://i.ibb.co/gL77J66Y/a60815a00b6e.jpg', NULL, 2, '2026-06-01 08:08:54', 0),
(38, 102, 'confirmed', 'https://i.ibb.co/0j481Z9M/6e63fd6a904f.jpg', NULL, 2, '2026-06-01 08:08:56', 0),
(39, 81, '', 'https://i.ibb.co/4gw0Xw5y/order-81-1780305140955.jpg', NULL, 6, '2026-06-01 09:12:21', 0),
(40, 54, 'in_progress', 'https://i.ibb.co/LbQG31q/b1dccab64653.jpg', NULL, 8, '2026-06-02 08:36:39', 0),
(41, 54, 'in_progress', 'https://i.ibb.co/2RpD3Y8/a1af521843fc.jpg', NULL, 8, '2026-06-02 08:36:44', 0),
(42, 54, 'in_progress', 'https://i.ibb.co/xtzG04sX/80f03e15bfd2.jpg', NULL, 8, '2026-06-02 08:36:57', 0),
(43, 83, 'done', 'https://i.ibb.co/QFnP7vrK/order-83-done.jpg', NULL, 8, '2026-06-02 08:39:41', 0),
(44, 113, 'done', 'https://i.ibb.co/XrrQWhxC/38edafaf51b9.jpg', NULL, 8, '2026-06-02 08:50:20', 0),
(45, 113, 'done', 'https://i.ibb.co/xSGtpbhv/b54637321aba.jpg', NULL, 8, '2026-06-02 08:50:23', 0),
(46, 113, 'done', 'https://i.ibb.co/vxLTVVc6/508273a7f4e1.jpg', NULL, 8, '2026-06-02 08:50:30', 0),
(47, 113, 'done', 'https://i.ibb.co/YFsZ1xZr/4d8790843d27.jpg', NULL, 8, '2026-06-02 08:50:33', 0),
(48, 119, 'in_progress', 'https://i.ibb.co/fc06LXr/8c3fa87dfc69.jpg', NULL, 8, '2026-06-03 03:49:29', 0),
(49, 127, 'done', 'https://i.ibb.co/gLVRMDzY/5482e94240ca.jpg', NULL, 2, '2026-06-03 12:47:48', 0),
(50, 127, 'done', 'https://i.ibb.co/FLkDgXDD/0698fa591f90.jpg', NULL, 2, '2026-06-03 12:47:49', 0),
(51, 136, 'in_progress', 'https://i.ibb.co/yFfzh0sN/883aa74c9327.jpg', NULL, 8, '2026-06-04 07:13:45', 0),
(52, 144, 'confirmed', 'https://i.ibb.co/8gkY4JYg/a4bb76775456.jpg', NULL, 2, '2026-06-04 11:03:59', 0),
(53, 144, 'confirmed', 'https://i.ibb.co/v46BD3wj/0ec18ee4fdb7.jpg', NULL, 2, '2026-06-04 11:04:02', 0),
(54, 147, 'confirmed', 'https://i.ibb.co/S70vpyB9/648f40516878.jpg', NULL, 2, '2026-06-04 13:46:38', 0),
(55, 147, 'confirmed', 'https://i.ibb.co/CpHS5tGK/11d96c7811af.jpg', NULL, 2, '2026-06-04 13:46:39', 0),
(56, 142, 'confirmed', 'https://i.ibb.co/DDPqGjTg/6d094df0fa61.jpg', NULL, 2, '2026-06-05 06:57:04', 0),
(57, 142, 'confirmed', 'https://i.ibb.co/9mJr3j1V/74b9882fa733.jpg', NULL, 2, '2026-06-05 06:57:05', 0),
(58, 142, 'confirmed', 'https://i.ibb.co/QFrYXGkn/8375d7feeac3.jpg', NULL, 2, '2026-06-05 06:57:14', 0),
(59, 142, 'confirmed', 'https://i.ibb.co/0yMPhvTz/17d63893d4e1.jpg', NULL, 2, '2026-06-05 06:57:33', 0),
(60, 142, 'confirmed', 'https://i.ibb.co/kgKnV3t4/a14431974c1c.jpg', NULL, 2, '2026-06-05 06:57:57', 0),
(61, 142, 'confirmed', 'https://i.ibb.co/FTHJ8mv/3e9cbba57c8a.jpg', NULL, 2, '2026-06-05 06:58:01', 0),
(62, 142, 'confirmed', 'https://i.ibb.co/RpN4T2fT/95541ba7f22c.jpg', NULL, 2, '2026-06-05 06:58:13', 0),
(63, 142, 'confirmed', 'https://i.ibb.co/21BWJTLz/12b7a18bc00a.jpg', NULL, 2, '2026-06-05 06:58:19', 0),
(64, 142, 'confirmed', 'https://i.ibb.co/jZ5GrFPb/274b76f939f5.jpg', NULL, 2, '2026-06-05 06:58:40', 0),
(65, 142, 'confirmed', 'https://i.ibb.co/2YND98WD/1eac0e3406ff.jpg', NULL, 2, '2026-06-05 06:58:43', 0),
(66, 142, 'confirmed', 'https://i.ibb.co/Z1wH6mCS/fc00d4e1f999.jpg', NULL, 2, '2026-06-05 06:58:54', 0),
(67, 142, 'confirmed', 'https://i.ibb.co/Wv4hWV2L/e880d75645cb.jpg', NULL, 2, '2026-06-05 06:58:56', 0),
(68, 142, 'confirmed', 'https://i.ibb.co/KjtrpCZK/5c896f41ab06.jpg', NULL, 2, '2026-06-05 06:59:08', 0),
(69, 142, 'confirmed', 'https://i.ibb.co/HfbNhG5w/eb54053dee68.jpg', NULL, 2, '2026-06-05 06:59:10', 0),
(70, 142, 'confirmed', 'https://i.ibb.co/gZcyrvnm/b1ecd9fc5424.jpg', NULL, 2, '2026-06-05 06:59:19', 0),
(71, 142, 'confirmed', 'https://i.ibb.co/cnJwzGT/ba61bb6202ed.jpg', NULL, 2, '2026-06-05 06:59:20', 0),
(72, 155, 'confirmed', 'https://i.ibb.co/NnNqxtGJ/fdaa333c4b17.jpg', NULL, 2, '2026-06-06 02:13:44', 0),
(73, 155, 'confirmed', 'https://i.ibb.co/LzN3qBVx/bd7d43c9e498.jpg', NULL, 2, '2026-06-06 02:13:53', 0),
(74, 161, 'done', 'https://i.ibb.co/PZxFDV1V/order-161-done.jpg', NULL, 8, '2026-06-08 08:12:29', 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_templates`
--

CREATE TABLE `order_templates` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_templates`
--

INSERT INTO `order_templates` (`id`, `name`, `description`, `is_public`, `sort_order`, `is_deleted`) VALUES
(1, 'Lắp mới', 'Lắp đặt thiết bị GPS mới', 1, 1, 0),
(2, 'Gia hạn', 'Gia hạn gói cước dịch vụ', 1, 2, 0),
(3, 'Thay SIM', 'Thay SIM cho thiết bị', 1, 3, 0),
(4, 'Thay camera', 'Thay camera giám sát', 1, 4, 0),
(5, 'Phù hiệu', 'Làm phù hiệu xe', 1, 5, 0),
(6, 'Thay thiết bị', 'Thay thế thiết bị GPS mới', 1, 4, 0),
(7, 'Bảo hành', 'Xử lý bảo hành thiết bị', 1, 6, 0),
(8, 'Sửa chữa', 'Sửa chữa thiết bị hỏng hóc', 1, 7, 0),
(9, 'Thu hồi', 'Thu hồi thiết bị', 1, 8, 0),
(10, 'Kiểm tra', 'Kiểm tra tình trạng thiết bị', 1, 9, 0),
(11, 'Giao Hàng', 'Giao hàng cho khách', 1, 10, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_template_fields`
--

CREATE TABLE `order_template_fields` (
  `id` int(11) NOT NULL,
  `template_id` int(11) NOT NULL,
  `seq` int(11) NOT NULL DEFAULT 0,
  `label` varchar(150) NOT NULL,
  `field_type` enum('text','number','date','textarea') NOT NULL DEFAULT 'text',
  `is_required` tinyint(1) NOT NULL DEFAULT 0,
  `placeholder` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_warranty_items`
--

CREATE TABLE `order_warranty_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `item_role` enum('faulty','replacement','supplier_return') NOT NULL DEFAULT 'faulty',
  `handling_type` enum('pending','tech_fix','exchange','supplier_return') NOT NULL DEFAULT 'pending',
  `customer_status` enum('pending','completed') NOT NULL DEFAULT 'pending',
  `product_id` int(11) DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `replacement_product_id` int(11) DEFAULT NULL,
  `replacement_source_scope` enum('technician_stock','company_stock','supplier_returned_item') DEFAULT NULL,
  `replacement_staff_id` int(11) DEFAULT NULL,
  `source_stock_scope` enum('customer','company_stock','technician_stock','company_warranty_stock','supplier','external') DEFAULT NULL,
  `source_staff_id` int(11) DEFAULT NULL,
  `qty` int(11) NOT NULL DEFAULT 1,
  `device_name` varchar(200) DEFAULT NULL,
  `serial_no` varchar(120) DEFAULT NULL,
  `imei` varchar(120) DEFAULT NULL,
  `license_plate` varchar(50) DEFAULT NULL,
  `account_name` varchar(120) DEFAULT NULL,
  `sim_number` varchar(50) DEFAULT NULL,
  `condition_note` text DEFAULT NULL,
  `note_text` text DEFAULT NULL,
  `additional_cost` decimal(12,0) NOT NULL DEFAULT 0,
  `charge_ref_id` int(11) DEFAULT NULL,
  `current_status` enum('intake','technician_holding','pending_company_receipt','company_warranty_stock','sent_to_supplier','supplier_returned','delivered','cancelled') NOT NULL DEFAULT 'intake',
  `current_location` enum('customer','technician','company_warranty_stock','supplier','customer_returned') NOT NULL DEFAULT 'customer',
  `holder_staff_id` int(11) DEFAULT NULL,
  `last_supplier_id` int(11) DEFAULT NULL,
  `last_move_at` datetime DEFAULT NULL,
  `release_receipt_id` int(11) DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `completed_by_staff_id` int(11) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_warranty_meta`
--

CREATE TABLE `order_warranty_meta` (
  `order_id` int(11) NOT NULL,
  `warranty_mode` enum('repair','exchange','supplier_swap') NOT NULL DEFAULT 'repair',
  `default_supplier_id` int(11) DEFAULT NULL,
  `current_stage` varchar(50) NOT NULL DEFAULT 'intake',
  `note_text` text DEFAULT NULL,
  `needs_review` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_warranty_moves`
--

CREATE TABLE `order_warranty_moves` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `warranty_item_id` int(11) DEFAULT NULL,
  `action_code` enum('mark_fixed','receive_from_customer','handover_to_company','move_to_company_stock','send_to_supplier','receive_from_supplier','reserve_replacement_from_company','reserve_replacement_from_technician','deliver_to_customer','cancel_item','note') NOT NULL,
  `from_location` varchar(50) DEFAULT NULL,
  `to_location` varchar(50) DEFAULT NULL,
  `qty` int(11) NOT NULL DEFAULT 1,
  `product_id` int(11) DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `holder_staff_id` int(11) DEFAULT NULL,
  `receipt_id` int(11) DEFAULT NULL,
  `note_text` text DEFAULT NULL,
  `photo_urls` longtext DEFAULT NULL,
  `occurred_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_by_staff_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_workflow_steps`
--

CREATE TABLE `order_workflow_steps` (
  `id` int(11) NOT NULL,
  `seq` int(11) NOT NULL DEFAULT 0,
  `code` varchar(50) NOT NULL,
  `label` varchar(150) NOT NULL,
  `requires_photo` tinyint(1) NOT NULL DEFAULT 0,
  `photo_min_count` int(11) NOT NULL DEFAULT 0,
  `update_roles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`update_roles`)),
  `is_terminal` tinyint(1) NOT NULL DEFAULT 0,
  `is_system` tinyint(1) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payment_receipts`
--

CREATE TABLE `payment_receipts` (
  `id` int(11) NOT NULL,
  `code` varchar(30) NOT NULL,
  `request_id` int(11) NOT NULL,
  `amount` bigint(20) NOT NULL,
  `pay_method` enum('cash','transfer','mixed') NOT NULL DEFAULT 'cash',
  `receipt_url` varchar(500) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `payment_receipts`
--

INSERT INTO `payment_receipts` (`id`, `code`, `request_id`, `amount`, `pay_method`, `receipt_url`, `note`, `created_by`, `created_at`, `is_deleted`) VALUES
(4, 'HD-2405-001', 12, 5000000, 'cash', NULL, 'Trả trước', 1, '2026-05-24 21:02:22', 0),
(5, 'HD-2805-001', 16, 12546000, 'cash', NULL, 'Ghi nhận thu 12.546.000đ lúc 15:03 ngày 28/05/2026', 1, '2026-05-28 15:03:50', 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payment_requests`
--

CREATE TABLE `payment_requests` (
  `id` int(11) NOT NULL,
  `code` varchar(30) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `total_amount` bigint(20) NOT NULL DEFAULT 0,
  `paid_amount` bigint(20) NOT NULL DEFAULT 0,
  `remaining` bigint(20) NOT NULL DEFAULT 0,
  `status` enum('pending','partially_paid','paid','expired','cancelled','superseded') NOT NULL DEFAULT 'pending',
  `qr_slot` tinyint(4) DEFAULT NULL,
  `pay_method` enum('cash','transfer','mixed') DEFAULT NULL,
  `note` text DEFAULT NULL,
  `receipt_url` varchar(500) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `payment_requests`
--

INSERT INTO `payment_requests` (`id`, `code`, `customer_id`, `total_amount`, `paid_amount`, `remaining`, `status`, `qr_slot`, `pay_method`, `note`, `receipt_url`, `created_by`, `created_at`, `expires_at`, `paid_at`, `is_deleted`) VALUES
(12, 'YC-2405-001', 13, 13818000, 5000000, 0, 'superseded', NULL, 'cash', NULL, NULL, 1, '2026-05-24 21:01:51', NULL, '2026-05-24 21:02:22', 0),
(13, 'YC-2405-002', 13, 21364000, 0, 21364000, 'superseded', NULL, NULL, NULL, NULL, 6, '2026-05-24 21:10:38', NULL, NULL, 0),
(15, 'YC-2505-001', 13, 21364000, 0, 21364000, 'cancelled', NULL, NULL, NULL, NULL, 6, '2026-05-25 15:25:52', NULL, NULL, 1),
(16, 'YC-2505-002', 13, 12546000, 12546000, 0, 'paid', NULL, 'cash', NULL, NULL, 1, '2026-05-25 15:43:57', NULL, '2026-05-28 15:03:50', 0),
(17, 'YC-2805-001', 19, 3942000, 0, 3942000, 'pending', NULL, NULL, NULL, NULL, 1, '2026-05-28 15:02:48', NULL, NULL, 0),
(18, 'YC-3005-001', 21, 21601200, 0, 21601200, 'superseded', NULL, NULL, NULL, NULL, 3, '2026-05-30 11:07:01', NULL, NULL, 0),
(19, 'YC-0106-001', 36, 9275000, 7000000, 2275000, 'partially_paid', NULL, 'transfer', NULL, NULL, 3, '2026-06-01 09:42:06', NULL, '2026-06-01 09:42:25', 0),
(20, 'YC-0106-002', 63, 2365000, 2365000, 0, 'paid', NULL, 'cash', NULL, NULL, 3, '2026-06-01 10:01:30', NULL, '2026-06-01 10:02:11', 0),
(21, 'YC-0306-001', 21, 22411200, 21601200, 810000, 'partially_paid', NULL, 'cash', NULL, NULL, 3, '2026-06-03 13:06:41', NULL, '2026-06-03 13:07:37', 0),
(22, 'YC-0606-001', 52, 8316000, 8316000, 0, 'paid', NULL, 'transfer', NULL, NULL, 3, '2026-06-06 09:48:20', NULL, '2026-06-06 09:48:48', 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payment_request_items`
--

CREATE TABLE `payment_request_items` (
  `id` int(11) NOT NULL,
  `request_id` int(11) NOT NULL,
  `target_type` enum('order','warranty','opening_balance','payment_request') NOT NULL,
  `target_id` int(11) DEFAULT NULL,
  `amount` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `payment_request_items`
--

INSERT INTO `payment_request_items` (`id`, `request_id`, `target_type`, `target_id`, `amount`) VALUES
(26, 12, 'order', 36, 872000),
(27, 12, 'payment_request', 7, 10546000),
(28, 12, 'payment_request', 10, 2400000),
(29, 13, 'order', 15, 4752000),
(30, 13, 'order', 29, 1800000),
(31, 13, 'order', 31, 3594000),
(32, 13, 'order', 32, 2400000),
(33, 13, 'payment_request', 12, 8818000),
(35, 15, 'payment_request', 13, 21364000),
(36, 16, 'order', 15, 4752000),
(37, 16, 'order', 29, 1800000),
(38, 16, 'order', 31, 3594000),
(39, 16, 'order', 32, 2400000),
(40, 17, 'order', 50, 3942000),
(41, 18, 'opening_balance', 21, 21601200),
(42, 19, 'opening_balance', 36, 9275000),
(43, 20, 'opening_balance', 63, 2365000),
(44, 21, 'order', 105, 810000),
(45, 21, 'opening_balance', 21, 21601200),
(46, 22, 'order', 83, 8100000),
(47, 22, 'order', 156, 216000);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `price_tiers`
--

CREATE TABLE `price_tiers` (
  `id` int(11) NOT NULL,
  `code` varchar(40) NOT NULL,
  `name` varchar(100) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `default_marker` tinyint(1) GENERATED ALWAYS AS (if(`is_default` = 1,1,NULL)) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `price_tiers`
--

INSERT INTO `price_tiers` (`id`, `code`, `name`, `sort_order`, `is_default`, `is_deleted`) VALUES
(1, 'retail', 'Bán lẻ', 1, 0, 0),
(2, 'wholesale', 'Đại lý cấp 1', 2, 0, 0),
(3, 'dealer', 'Đại lý', 3, 0, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `thumbnail_url` varchar(500) DEFAULT NULL,
  `warranty_months` int(11) NOT NULL DEFAULT 12,
  `cost_price` bigint(20) NOT NULL DEFAULT 0,
  `description` text DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `products`
--

INSERT INTO `products` (`id`, `code`, `name`, `category_id`, `image_url`, `thumbnail_url`, `warranty_months`, `cost_price`, `description`, `is_deleted`) VALUES
(1, 'THELAIXE', 'Thẻ Lái Xe', NULL, '/uploads/products/1779700868579-05c536a453b4.jpg', '/uploads/products/1779700868579-05c536a453b4.jpg', 12, 12000, NULL, 0),
(2, 'GT-S8', 'Thiết bị giám sát hành trình GT-S8', NULL, '/uploads/products/1779677028567-1d8703f3e3e7.jpg', '/uploads/products/1779677028567-1d8703f3e3e7.jpg', 24, 450000, NULL, 0),
(3, 'BASIC', 'Phần mềm cơ bản 12 Tháng', NULL, '/uploads/products/1779676989764-1b34b2e82209.jpg', '/uploads/products/1779676989764-1b34b2e82209.jpg', 12, 70000, NULL, 0),
(4, 'MDVR02-live', 'Thiết bị giảm sát hành trình và ghi nhận hình ảnh người lài xe GT-MDVR02 live', NULL, '/uploads/products/1779676569506-1294b0a1943a.jpg', '/uploads/products/1779676569506-1294b0a1943a.jpg', 12, 1836000, 'Thiết bị giảm sát hành trình và ghi nhận hình ảnh người lài xe GT-MDVR02 phù hợp QCVN 06:2024/BCA', 0),
(5, 'MDVR02-Anh', 'Thiết bị giảm sát hành trình và ghi nhận hình ảnh người lài xe GT-MDVR02 Chụp ảnh', NULL, '/uploads/products/1779676552224-6513c29f54b9.jpg', '/uploads/products/1779676552224-6513c29f54b9.jpg', 12, 1620000, 'Thiết bị giảm sát hành trình và ghi nhận hình ảnh người lài xe GT-MDVR02 phù hợp QCVN 06:2024/BCA', 0),
(6, 'RFID V3', 'Đầu đọc thẻ thông tin lái xe RFID', NULL, '/uploads/products/1779676584675-a5923b3af1d4.jpg', '/uploads/products/1779676584675-a5923b3af1d4.jpg', 12, 270000, NULL, 0),
(7, 'ComboBasic', 'Phần mềm Combo Basic 12 Tháng', NULL, '/uploads/products/1779677214842-bf36f78048de.jpg', '/uploads/products/1779677214842-bf36f78048de.jpg', 12, 300000, NULL, 0),
(8, 'LIGOL7', 'Cảm biến mức dầu Model: Ligo SPRS232L7', NULL, '/uploads/products/1779676515718-8af508901fa0.jpg', '/uploads/products/1779676515718-8af508901fa0.jpg', 60, 1296000, NULL, 0),
(9, 'AHD805', 'Camera GT-AHD805 cam đơn có mic, có hồng ngoại', 1, '/uploads/products/1779676215068-db3ea1644751.jpg', '/uploads/products/1779676215068-db3ea1644751.jpg', 12, 432000, NULL, 0),
(10, 'AHD806', 'Camera quan sát lắp trong cabin ô tô GT-AHD806', 1, '/uploads/products/1779676196033-cec25c053c2d.jpg', '/uploads/products/1779676196033-cec25c053c2d.jpg', 12, 756000, NULL, 0),
(11, 'Dashcam-Al', 'Thiết bị giảm sát hành trình tích hợp đầu ghi camera, Model: TLS- Dashcam-Al', 1, '/uploads/products/1779673145418-9bb58c9a706c.png', '/uploads/products/1779673145418-9bb58c9a706c.png', 12, 2700000, NULL, 0),
(12, 'VIETTELIP', 'Sim Viettel IP', NULL, '/uploads/products/1779676068708-22466065d225.jpg', '/uploads/products/1779676068708-22466065d225.jpg', 12, 390000, NULL, 0),
(13, 'CAR', 'Phần mềm ô tô  12 Tháng', NULL, '/uploads/products/1779677237312-16f6fc701725.jpg', '/uploads/products/1779677237617-0668b7be4c3a.jpg', 0, 150000, NULL, 0),
(14, 'AHD262', 'Camers quan sát GT-AHD262', 1, '/uploads/products/1779681025623-e094aee044fa.jpg', '/uploads/products/1779681025661-16c1b86ade33.jpg', 12, 378000, NULL, 0),
(15, 'TL7', 'Màn hình hiển thị TL7', NULL, '/uploads/products/1779701060607-9167aaf9dd3e.jpg', '/uploads/products/1779701060427-1108918bfc2a.jpg', 12, 750000, NULL, 0),
(16, 'LIGOL10', 'Cảm biến mức dầu Model: Ligo SPRS232L10', NULL, '/uploads/products/1779702222430-b7c0af48eed3.jpg', '/uploads/products/1779702222360-62d1924cbb90.jpg', 12, 1458000, NULL, 0),
(17, 'DV01', 'Dịch vụ phần mềm quản lý giám sát phương tiện 12 tháng ( gói cơ bản)', 4, NULL, NULL, 12, 110000, NULL, 0),
(18, 'DV02', 'Dịch vụ phần mềm quản lý giám sát phương tiện 12 tháng ( gói ô tô)', 4, NULL, NULL, 12, 150000, 'Dịch vụ phần mềm quản lý giám sát phương tiện 12 tháng ( gói ô tô)', 0),
(19, 'DV03', 'Dịch vụ phần mềm quản lý giám sát phương tiện 12 tháng ( gói combo basic 2)', 4, NULL, NULL, 12, 300000, NULL, 0),
(20, 'DV04', 'Dịch vụ phần mềm quản lý giám sát phương tiện 12 tháng ( gói combo plus 2)', 4, NULL, NULL, 12, 300000, NULL, 0),
(21, 'DV05', 'Dịch vụ phần mềm quản lý giám sát phương tiện 12 tháng ( gói combo basic 4)', 4, NULL, NULL, 12, 350000, NULL, 0),
(22, 'DV06', 'Dịch vụ phần mềm quản lý giám sát phương tiện 12 tháng ( gói combo plus 4)', 4, NULL, NULL, 12, 450000, NULL, 0),
(23, 'L7', 'Cảm biến mức dầu Model: LIGOBLE-PRO-RS232L7', 5, NULL, NULL, 12, 1404000, NULL, 0),
(24, 'SC', 'Dịch vụ sửa chữa,bảo hành thiết bị', 4, NULL, NULL, 12, 100000, NULL, 0),
(25, 'DV07', 'Dịch vụ phần mềm quản lý giám sát phương tiện 6 tháng ( gói combo plus 2)', 4, NULL, NULL, 6, 225000, NULL, 0),
(26, 'DV08', 'Dịch vụ phần mềm quản lý giám sát phương tiện 6 tháng ( gói ô tô)', 4, NULL, NULL, 6, 125000, NULL, 0),
(27, 'MOBI30IP', 'Sim Mobi 30IP', 1, '/uploads/products/1780036692341-07673a03f2c8.jpg', '/uploads/products/1780036692258-305fcf3297ca.jpg', 12, 320000, NULL, 0),
(28, 'G400LV', 'Thiết bị giám sát hành trình G400LV', 6, NULL, NULL, 12, 378000, NULL, 0),
(29, 'DV09', 'Dịch vụ data viễn thông (Dành cho Camera giám sát hành trình theo NĐ 10)', 4, NULL, NULL, 12, 450000, NULL, 0),
(30, 'GT-688B', 'GT-688B Không hồng ngoại, kèm cáp 3,3M', 1, NULL, NULL, 12, 400000, NULL, 0),
(31, 'DAHUA-64GB', 'Thẻ nhớ Dahua 64GB cho Camera', 1, NULL, NULL, 12, 250000, NULL, 0),
(32, 'DV10', 'Phí dịch vụ định vị GPS ( ô tô)', 4, NULL, NULL, 12, 250000, NULL, 0),
(33, 'Test_01', 'Sản phẩm thử nghiệm', NULL, NULL, NULL, 12, 1000000, NULL, 0),
(34, 'LITE 4G', 'Thiết bị định vị GPS (Thiết bị đầu cuối thông tin di động mặt đất); Model: Wetrack lite 4G', 6, NULL, NULL, 12, 540000, NULL, 0),
(35, 'DV11', 'Dịch vụ phần mềm quản lý giám sát phương tiện 06 tháng ( gói ô tô)', 4, NULL, NULL, 6, 75000, NULL, 0),
(36, 'DV12', 'Dịch vụ phần mềm quản lý giám sát phương tiện 11 tháng (gói combo Plus 2)', 4, NULL, NULL, 11, 275000, NULL, 0),
(37, 'A9+', 'Thiết bị định vị GPS A9+', 6, NULL, NULL, 12, 0, NULL, 0),
(38, 'DV13', 'Phí dịch vụ định vị GPS ( xe máy)', 4, NULL, NULL, 12, 80000, NULL, 0),
(39, 'ITEL', 'SIM ITEL', 2, NULL, NULL, 12, 40000, NULL, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `product_attributes`
--

CREATE TABLE `product_attributes` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `label` varchar(100) NOT NULL,
  `value` varchar(500) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `position` enum('top','bottom') NOT NULL DEFAULT 'top'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `product_attributes`
--

INSERT INTO `product_attributes` (`id`, `product_id`, `label`, `value`, `sort_order`, `position`) VALUES
(7, 2, 'Nhiệt độ Hoạt động', '-20÷85oC ±0.5%', 1, 'top'),
(8, 2, 'Độ ẩm', '5÷95%', 2, 'top'),
(9, 2, 'Dải hoạt động', '', 3, 'top');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `product_blocks`
--

CREATE TABLE `product_blocks` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `block_type` enum('text','image','video') NOT NULL,
  `content` text DEFAULT NULL,
  `caption` varchar(500) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `product_blocks`
--

INSERT INTO `product_blocks` (`id`, `product_id`, `block_type`, `content`, `caption`, `sort_order`) VALUES
(24, 2, 'image', '/uploads/products/1779337412859-4b62a4904567.jpg', NULL, 1),
(25, 4, 'image', '/uploads/products/1779337136398-b8a7d720b72f.jpg', NULL, 1),
(26, 4, 'text', 'Thiết bị GT-MDVR02 là giải pháp quản trị thông minh đối với doanh nghiệp vận tải, giúp cho hệ thống quản lý và vận hành đội xe trở nên toàn diện, giám sát mọi vấn đề dữ liệu hành trình, hình ảnh trực quan của hàng hóa, hành khách hay những vấn đề khi lưu thông trên đường. Nhận được những cảnh báo sớm để hạn chế rủi ro khi điều khiển xe, tối giảm những vi phạm hành chính và phát sinh khác.', NULL, 2),
(27, 4, 'image', '/uploads/products/1779337131234-845fe12fe236.jpg', NULL, 3),
(28, 4, 'text', 'GoTrack GT-MDVR02 với Module được nâng cấp lên tính năng ghi video trực tuyến và tích hợp Module định vị GPS đạt quy chuẩn QCVN 06:2024/BCA, mọi dữ liệu đều được theo dõi từ xa qua hệ thống phần mềm thông minh của GoTrack', NULL, 4),
(29, 4, 'image', '/uploads/products/1779337221651-30f07d380cee.jpg', NULL, 5);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `product_prices`
--

CREATE TABLE `product_prices` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `tier_id` int(11) NOT NULL,
  `price` bigint(20) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `product_prices`
--

INSERT INTO `product_prices` (`id`, `product_id`, `tier_id`, `price`, `sort_order`) VALUES
(97, 11, 1, 3900000, 1),
(98, 11, 2, 3100000, 2),
(99, 11, 3, 3350000, 3),
(100, 12, 1, 600000, 1),
(101, 12, 2, 450000, 2),
(102, 12, 3, 450000, 3),
(103, 10, 1, 1200000, 1),
(104, 10, 2, 864000, 2),
(105, 10, 3, 918000, 3),
(106, 9, 1, 750000, 1),
(107, 9, 2, 486000, 2),
(108, 9, 3, 540000, 3),
(109, 8, 1, 3564000, 1),
(110, 8, 2, 1620000, 2),
(111, 8, 3, 1620000, 3),
(118, 6, 1, 378000, 1),
(119, 6, 2, 324000, 2),
(120, 6, 3, 324000, 3),
(121, 3, 1, 600000, 1),
(122, 3, 2, 150000, 2),
(123, 3, 3, 150000, 3),
(124, 2, 1, 972000, 1),
(125, 2, 2, 490000, 2),
(126, 2, 3, 510000, 3),
(130, 7, 1, 1200000, 1),
(131, 7, 2, 450000, 2),
(132, 7, 3, 450000, 3),
(133, 13, 1, 750000, 1),
(134, 13, 2, 250000, 2),
(135, 13, 3, 250000, 3),
(136, 14, 1, 650000, 1),
(137, 14, 2, 432000, 2),
(138, 14, 3, 464400, 3),
(141, 15, 1, 1500000, 1),
(142, 1, 1, 54000, 1),
(143, 1, 2, 16200, 2),
(144, 1, 3, 16200, 3),
(145, 16, 1, 3780000, 1),
(146, 16, 2, 1890000, 2),
(147, 16, 3, 1890000, 3),
(148, 27, 1, 600000, 1),
(149, 27, 3, 360000, 2),
(150, 27, 2, 360000, 3),
(154, 31, 1, 350000, 1),
(155, 31, 2, 290000, 2),
(156, 31, 3, 280000, 3),
(157, 30, 1, 650000, 1),
(158, 30, 2, 486000, 2),
(159, 30, 3, 486000, 3),
(160, 5, 1, 2622000, 1),
(161, 5, 2, 1998000, 2),
(162, 5, 3, 1998000, 3),
(163, 4, 1, 3222000, 1),
(164, 4, 2, 2214000, 2),
(165, 4, 3, 2322000, 3);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `product_stock`
--

CREATE TABLE `product_stock` (
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `product_stock`
--

INSERT INTO `product_stock` (`product_id`, `quantity`) VALUES
(1, 200),
(2, 82),
(3, 16),
(4, 17),
(5, 11),
(6, 8),
(7, 100),
(8, 8),
(9, 9),
(10, 6),
(11, 0),
(12, 10),
(13, 20),
(14, 27),
(15, 5),
(16, 3),
(17, 1211),
(18, 1094),
(19, 26),
(20, 98),
(22, 27),
(23, 42),
(24, 1000),
(25, 1045),
(26, 1000),
(27, 50),
(28, 87),
(29, 100),
(30, 24),
(31, 16),
(32, 999),
(33, 994),
(34, 249),
(35, 11),
(36, 2),
(37, 33),
(38, 100),
(39, 500);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `release_pool`
--

CREATE TABLE `release_pool` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL,
  `receipt_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `remittances`
--

CREATE TABLE `remittances` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `amount` bigint(20) NOT NULL,
  `total_holding` bigint(20) NOT NULL DEFAULT 0,
  `remaining` bigint(20) NOT NULL DEFAULT 0,
  `method` enum('cash','transfer') NOT NULL,
  `receipt_url` varchar(500) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `remitted_at` datetime NOT NULL DEFAULT current_timestamp(),
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `reject_reason` varchar(500) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `advances_deducted_json` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `remittances`
--

INSERT INTO `remittances` (`id`, `staff_id`, `amount`, `total_holding`, `remaining`, `method`, `receipt_url`, `note`, `remitted_at`, `approved_by`, `approved_at`, `reject_reason`, `status`, `is_deleted`, `advances_deducted_json`) VALUES
(1, 7, 2300000, 2300000, 0, 'cash', NULL, NULL, '2026-05-21 16:22:00', 1, '2026-05-21 16:22:00', NULL, 'approved', 0, NULL),
(2, 7, 100000, 100000, 0, 'cash', NULL, NULL, '2026-05-21 16:45:10', 1, '2026-05-21 16:45:10', NULL, 'approved', 0, NULL),
(3, 8, 6786000, 6786000, 0, 'cash', NULL, NULL, '2026-05-22 23:44:20', 1, '2026-05-22 23:44:20', NULL, 'approved', 0, NULL),
(4, 4, 4000000, 4000000, 0, 'cash', NULL, NULL, '2026-05-22 23:44:25', 1, '2026-05-22 23:44:25', NULL, 'approved', 0, NULL),
(5, 2, 5427000, 5927000, 0, 'cash', NULL, NULL, '2026-06-02 16:32:16', 1, '2026-06-02 16:32:16', NULL, 'approved', 0, '[{\"id\":9,\"amount\":500000,\"note\":\"Ứng lương kỳ 2026-05\",\"created_at\":\"2026-05-22 22:43:20\"}]'),
(6, 8, 1000, 100000, 99000, 'cash', NULL, 'nộp cho đơn abc', '2026-06-02 16:59:55', 1, '2026-06-02 16:59:55', NULL, 'approved', 0, NULL),
(7, 7, 1278000, 1378000, 0, 'cash', NULL, NULL, '2026-06-05 22:01:31', 1, '2026-06-05 22:01:31', NULL, 'approved', 0, '[{\"id\":5,\"amount\":100000,\"note\":\"Ứng lương kỳ 2026-05\",\"created_at\":\"2026-05-21 18:45:44\"}]'),
(8, 8, 99000, 99000, 0, 'cash', NULL, NULL, '2026-06-05 22:01:35', 1, '2026-06-05 22:01:35', NULL, 'approved', 0, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `staff`
--

CREATE TABLE `staff` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `role` enum('admin','kithuat','staff') NOT NULL DEFAULT 'kithuat',
  `area` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `cccd` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `online_status` enum('online','offline') NOT NULL DEFAULT 'offline',
  `rating` decimal(3,2) NOT NULL DEFAULT 0.00,
  `opening_balance` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `staff`
--

INSERT INTO `staff` (`id`, `username`, `password_hash`, `full_name`, `role`, `area`, `phone`, `cccd`, `email`, `avatar_url`, `is_deleted`, `created_at`, `updated_at`, `online_status`, `rating`, `opening_balance`) VALUES
(1, 'admin', '$2a$10$jAwDo3dwlc9qsmasMlTcSeBx1.ESciWJ1Zf6BZWGVs/hm2FZbFb6u', 'Quan tri vien', 'admin', NULL, NULL, NULL, NULL, NULL, 0, '2026-05-18 09:52:01', '2026-05-18 09:52:01', 'offline', 0.00, 0),
(2, 'ktv885380', '$2a$10$OSN.O2VlA3QtiKqlSxSVkuB.gGJzugHOSd65fFWvUQvPM8gMiIATy', 'Nguyễn Lý Thoại', 'kithuat', NULL, '0867948490', '080097000846', 'lythoai301599812@gmail.com', NULL, 0, '2026-05-18 10:37:35', '2026-06-04 13:29:41', 'offline', 0.00, 0),
(3, 'nv224895', '$2a$10$c0jC7Fx8rpZm/2p3kZqj.u5gT68.fNIYdTM1SmbhmL9Ji9l2mCpHe', 'Phương Quyên', 'staff', NULL, '0942155160', NULL, NULL, NULL, 0, '2026-05-18 12:54:39', '2026-05-19 14:17:07', 'offline', 0.00, 0),
(6, 'nv409671', '$2a$10$FlLgGfU1hYDHy94gqCZh2Oipg3XE6.su9X08FlpwwMENU5BYNTsuu', 'Như', 'staff', NULL, '0961813181', NULL, NULL, NULL, 0, '2026-05-21 01:47:35', '2026-05-21 01:47:35', 'offline', 0.00, 0),
(7, 'ktv840743', '$2a$10$ivyNl./Ethvx1GWjbFLOqOxy.MNzVqZFhuwGGPi4MDqk8VR6UZ15S', 'nhân sự của dân test', 'kithuat', NULL, NULL, NULL, NULL, '/uploads/avatars/1779467215905-42a3cc3a6190.png', 0, '2026-05-21 08:10:03', '2026-05-23 04:34:43', 'offline', 0.00, 0),
(8, 'ktv157123', '$2a$10$iX9qeFhy1NzKU1Jjl0MO/OfLHWxETu8GyuO1p6M8Pq.eJtHniax3G', 'Trần Quốc Viện', 'kithuat', NULL, '0949095858', NULL, NULL, NULL, 0, '2026-05-21 08:20:40', '2026-06-06 05:52:04', 'offline', 0.00, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `staff_advances`
--

CREATE TABLE `staff_advances` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `period` char(7) NOT NULL,
  `amount` bigint(20) NOT NULL,
  `note` varchar(300) NOT NULL DEFAULT '',
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'approved',
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `reject_reason` varchar(300) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `carried_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deduct_from_collection` tinyint(4) NOT NULL DEFAULT 0 COMMENT '1 = admin duyet se tu tru vao collections chua nop thay vi ghi vao phieu luong'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `staff_advances`
--

INSERT INTO `staff_advances` (`id`, `staff_id`, `period`, `amount`, `note`, `status`, `approved_by`, `approved_at`, `reject_reason`, `created_by`, `created_at`, `carried_at`, `is_deleted`, `deduct_from_collection`) VALUES
(1, 7, '2026-05', 100000, 'ăn mì tôm', 'approved', 1, '2026-05-21 17:04:34', NULL, 7, '2026-05-21 17:04:12', NULL, 0, 0),
(2, 7, '2026-05', 10000, '', 'rejected', 1, '2026-05-21 17:08:41', 'không cho', 7, '2026-05-21 17:04:59', NULL, 0, 0),
(3, 7, '2026-05', 10000, '', 'rejected', 1, '2026-05-21 17:08:44', NULL, 7, '2026-05-21 17:05:44', NULL, 0, 0),
(4, 7, '2026-05', 100000, '', 'approved', 1, '2026-05-21 18:45:44', NULL, 7, '2026-05-21 18:44:07', NULL, 0, 1),
(5, 6, '2026-05', 30000, '', 'rejected', 1, '2026-05-22 22:43:29', 'ko đủ', 6, '2026-05-21 21:46:17', NULL, 0, 0),
(6, 2, '2026-05', 500000, '', 'approved', 1, '2026-05-22 22:43:20', NULL, 2, '2026-05-22 22:42:29', NULL, 0, 1),
(7, 3, '2026-05', 500000, '', 'approved', 1, '2026-05-22 23:35:24', NULL, 3, '2026-05-22 23:34:49', NULL, 0, 0),
(8, 3, '2026-05', 100000, '', 'approved', 1, '2026-05-22 23:39:24', NULL, 3, '2026-05-22 23:38:28', NULL, 0, 0),
(9, 6, '2026-05', 100000, 'test thông báo ứng lương nhân viên', 'pending', NULL, NULL, NULL, 6, '2026-05-22 23:56:51', NULL, 0, 0),
(10, 6, '2026-05', 100000, '205', 'pending', NULL, NULL, NULL, 6, '2026-05-23 11:05:16', NULL, 0, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `staff_holdings`
--

CREATE TABLE `staff_holdings` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL,
  `first_held_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `staff_holdings`
--

INSERT INTO `staff_holdings` (`id`, `staff_id`, `product_id`, `qty`, `first_held_at`) VALUES
(10, 2, 2, 4, '2026-05-19 22:34:23'),
(12, 8, 2, 10, '2026-05-21 15:33:58'),
(13, 8, 8, 3, '2026-05-21 15:33:58'),
(18, 7, 8, 1, '2026-05-23 03:05:02'),
(23, 8, 16, 1, '2026-05-26 10:13:42'),
(29, 7, 33, 5, '2026-06-04 16:59:52'),
(31, 2, 5, 1, '2026-06-04 18:00:54'),
(34, 2, 28, 7, '2026-06-04 18:00:54'),
(35, 2, 31, 4, '2026-06-04 18:00:54'),
(42, 2, 9, 1, '2026-06-04 18:01:03');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `staff_payroll_adjustments`
--

CREATE TABLE `staff_payroll_adjustments` (
  `id` int(10) UNSIGNED NOT NULL,
  `staff_id` int(10) UNSIGNED NOT NULL,
  `type` enum('extra','deduction') NOT NULL,
  `label` varchar(200) NOT NULL DEFAULT '',
  `amount` bigint(20) NOT NULL DEFAULT 0,
  `sort_order` smallint(6) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `staff_payroll_adjustments`
--

INSERT INTO `staff_payroll_adjustments` (`id`, `staff_id`, `type`, `label`, `amount`, `sort_order`, `is_deleted`, `created_at`) VALUES
(1, 7, 'extra', '', 0, 0, 1, '2026-05-22 23:32:10'),
(2, 7, 'extra', 'tiền cộng cho đơn A mà quên', 0, 0, 1, '2026-05-22 23:32:23'),
(3, 7, 'extra', 'tiền cộng cho đơn A mà quên', 100000, 0, 1, '2026-05-22 23:32:26'),
(4, 7, 'extra', 'tiền cộng cho đơn A mà quên', 100000, 0, 1, '2026-05-22 23:32:27'),
(5, 7, 'extra', '', 0, 1, 1, '2026-05-22 23:32:27'),
(6, 7, 'extra', 'tiền cộng cho đơn A mà quên', 1000000, 0, 0, '2026-05-22 23:32:38'),
(7, 7, 'extra', '', 0, 1, 0, '2026-05-22 23:32:38'),
(8, 8, 'deduction', '', 0, 0, 0, '2026-06-06 12:56:20');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `staff_payroll_periods`
--

CREATE TABLE `staff_payroll_periods` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `period` char(7) NOT NULL,
  `from_date` date DEFAULT NULL,
  `to_date` date DEFAULT NULL,
  `base_salary` bigint(20) NOT NULL DEFAULT 0,
  `insurance_amount` bigint(20) NOT NULL DEFAULT 0,
  `advance_amount` bigint(20) NOT NULL DEFAULT 0,
  `extras_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`extras_json`)),
  `rows_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`rows_json`)),
  `total_revenue` bigint(20) NOT NULL DEFAULT 0,
  `total_wage` bigint(20) NOT NULL DEFAULT 0,
  `total_extras` bigint(20) NOT NULL DEFAULT 0,
  `final_amount` bigint(20) NOT NULL DEFAULT 0,
  `note` varchar(500) DEFAULT NULL,
  `finalized_at` datetime NOT NULL DEFAULT current_timestamp(),
  `finalized_by` int(11) DEFAULT NULL,
  `unfinalized_at` datetime DEFAULT NULL,
  `unfinalized_by` int(11) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `staff_payslips`
--

CREATE TABLE `staff_payslips` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `from_date` date NOT NULL,
  `to_date` date NOT NULL,
  `base_salary` bigint(20) NOT NULL DEFAULT 0,
  `extras_json` longtext DEFAULT NULL,
  `deductions_json` longtext DEFAULT NULL,
  `carried_debt` bigint(20) NOT NULL DEFAULT 0,
  `rows_json` longtext DEFAULT NULL,
  `total_wage` bigint(20) NOT NULL DEFAULT 0,
  `total_extras` bigint(20) NOT NULL DEFAULT 0,
  `total_deductions` bigint(20) NOT NULL DEFAULT 0,
  `gross_amount` bigint(20) NOT NULL DEFAULT 0,
  `note` varchar(500) DEFAULT NULL,
  `finalized_at` datetime DEFAULT NULL,
  `finalized_by` int(11) DEFAULT NULL,
  `paid_amount` bigint(20) NOT NULL DEFAULT 0,
  `paid_at` datetime DEFAULT NULL,
  `paid_by` int(11) DEFAULT NULL,
  `paid_note` varchar(300) DEFAULT NULL,
  `remaining_debt` bigint(20) NOT NULL DEFAULT 0,
  `debt_absorbed` tinyint(4) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `total_advances` bigint(20) NOT NULL DEFAULT 0,
  `advances_json` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `staff_payslips`
--

INSERT INTO `staff_payslips` (`id`, `staff_id`, `from_date`, `to_date`, `base_salary`, `extras_json`, `deductions_json`, `carried_debt`, `rows_json`, `total_wage`, `total_extras`, `total_deductions`, `gross_amount`, `note`, `finalized_at`, `finalized_by`, `paid_amount`, `paid_at`, `paid_by`, `paid_note`, `remaining_debt`, `debt_absorbed`, `is_deleted`, `total_advances`, `advances_json`) VALUES
(2, 6, '2026-05-21', '2026-05-23', 0, '[]', '[]', 0, '[{\"order_id\":1,\"sc_id\":1,\"code\":\"ORD-2105-001\",\"date\":\"2026-05-21 16:09:51\",\"service\":\"Lắp mới\",\"bien_so\":\"\",\"imei\":\"\",\"tai_khoan\":\"\",\"revenue\":3600000,\"wage\":0,\"commission\":500000,\"pay_note\":\"\",\"row_type\":\"commission\"},{\"order_id\":10,\"sc_id\":6,\"code\":\"ORD-2105-007\",\"date\":\"2026-05-21 18:07:46\",\"service\":\"Lắp mới\",\"bien_so\":\"\",\"imei\":\"\",\"tai_khoan\":\"\",\"revenue\":1620000,\"wage\":0,\"commission\":300000,\"pay_note\":\"\",\"row_type\":\"commission\"}]', 800000, 0, 0, 700000, '', '2026-05-23 00:49:26', 6, 0, NULL, NULL, NULL, 0, 0, 0, 100000, '[{\"id\":7,\"amount\":100000,\"note\":null,\"created_at\":\"2026-05-21 19:44:50\"}]');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `staff_receipts`
--

CREATE TABLE `staff_receipts` (
  `id` int(11) NOT NULL,
  `code` varchar(30) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `request_id` int(11) DEFAULT NULL,
  `customer_id` int(11) NOT NULL,
  `amount` bigint(20) NOT NULL,
  `pay_method` enum('cash','transfer','mixed') NOT NULL DEFAULT 'cash',
  `proof_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`proof_urls`)),
  `note` text DEFAULT NULL,
  `staff_id` int(11) NOT NULL,
  `reviewed` tinyint(1) NOT NULL DEFAULT 0,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('active','cancelled') NOT NULL DEFAULT 'active',
  `cancel_reason` text DEFAULT NULL,
  `cancelled_by` int(11) DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `staff_receipts`
--

INSERT INTO `staff_receipts` (`id`, `code`, `order_id`, `request_id`, `customer_id`, `amount`, `pay_method`, `proof_urls`, `note`, `staff_id`, `reviewed`, `reviewed_by`, `reviewed_at`, `created_at`, `is_deleted`, `status`, `cancel_reason`, `cancelled_by`, `cancelled_at`) VALUES
(5, 'NNT-2605-001', 55, NULL, 33, 972000, 'transfer', '[\"https://i.ibb.co/gZDhWHpT/sr-ord-55-1779770958958.jpg\"]', 'ck cty 26.5', 3, 1, 1, '2026-06-06 08:16:37', '2026-05-26 11:49:22', 0, 'active', NULL, NULL, NULL),
(6, 'NNT-2605-002', 56, NULL, 34, 3000000, 'transfer', NULL, 'ck 26.5', 3, 1, 1, '2026-06-06 08:16:37', '2026-05-26 15:04:20', 0, 'active', NULL, NULL, NULL),
(7, 'NNT-2605-003', 58, NULL, 36, 3213000, 'cash', '[\"https://i.ibb.co/tTwqs5tP/sr-ord-58-1779783685429.jpg\"]', NULL, 3, 1, 1, '2026-06-06 08:16:36', '2026-05-26 15:21:27', 0, 'active', NULL, NULL, NULL),
(9, 'NNT-2705-001', 61, NULL, 38, 700000, 'transfer', '[\"https://i.ibb.co/TB8gvbFT/sr-ord-61-1779847762894.jpg\"]', 'ck cty 27.5', 3, 1, 1, '2026-06-06 08:16:36', '2026-05-27 09:09:24', 0, 'active', NULL, NULL, NULL),
(10, 'NNT-2705-002', 65, NULL, 40, 750000, 'cash', '[\"https://i.ibb.co/Ndb9ts6z/sr-ord-65-1779849165277.jpg\"]', NULL, 3, 1, 1, '2026-06-06 08:16:36', '2026-05-27 09:32:47', 0, 'active', NULL, NULL, NULL),
(11, 'NNT-2705-003', 57, NULL, 35, 972000, 'cash', NULL, 'anh Thoại thu', 3, 1, 1, '2026-06-06 08:16:35', '2026-05-27 09:36:18', 0, 'active', NULL, NULL, NULL),
(12, 'NNT-2705-004', 60, NULL, 37, 5184000, 'transfer', NULL, 'ck cty  31tr644', 3, 1, 1, '2026-06-06 08:16:34', '2026-05-27 15:03:53', 0, 'active', NULL, NULL, NULL),
(13, 'NNT-2705-005', 59, NULL, 37, 26460000, 'transfer', NULL, 'ck cty  31tr644', 3, 1, 1, '2026-06-06 08:16:33', '2026-05-27 15:04:10', 0, 'active', NULL, NULL, NULL),
(14, 'NNT-2705-006', 52, NULL, 13, 4752000, 'transfer', NULL, 'ck 25.5 4tr752', 3, 1, 1, '2026-06-06 08:16:32', '2026-05-27 15:04:53', 0, 'active', NULL, NULL, NULL),
(15, 'NNT-2705-007', 66, NULL, 41, 750000, 'transfer', NULL, '27.5 Thai Thi Anh Thi ck', 3, 1, 1, '2026-06-06 08:16:31', '2026-05-27 16:36:59', 0, 'active', NULL, NULL, NULL),
(16, 'NNT-2705-008', 67, NULL, 42, 919600, 'transfer', '[\"https://i.ibb.co/3m0dCph4/sr-ord-67-1779876942530.jpg\"]', '2 HÓA ĐƠN SỐ 285,286', 3, 1, 1, '2026-06-06 08:16:29', '2026-05-27 17:15:44', 0, 'active', NULL, NULL, NULL),
(17, 'NNT-2705-009', 68, NULL, 28, 450000, 'transfer', '[\"https://i.ibb.co/35Yv9DSw/sr-ord-68-1779877477091.jpg\"]', NULL, 3, 1, 1, '2026-06-06 08:16:27', '2026-05-27 17:24:38', 0, 'active', NULL, NULL, NULL),
(18, 'NNT-2805-001', 73, NULL, 45, 480000, 'cash', NULL, 'ck anh Cương 27.5', 3, 1, 1, '2026-06-06 08:16:26', '2026-05-28 08:34:11', 0, 'active', NULL, NULL, NULL),
(19, 'NNT-2805-002', 75, NULL, 47, 750000, 'transfer', NULL, 'ck 750k 28.5.2026', 3, 1, 1, '2026-06-06 08:16:24', '2026-05-28 13:22:13', 0, 'active', NULL, NULL, NULL),
(20, 'NNT-2805-003', 78, NULL, 48, 150000, 'cash', NULL, 'anh Viện thu công', 3, 1, 1, '2026-06-06 08:16:21', '2026-05-28 13:35:47', 0, 'active', NULL, NULL, NULL),
(21, 'NNT-2805-004', 76, NULL, 37, 8000000, 'transfer', NULL, NULL, 3, 1, 1, '2026-06-06 08:16:20', '2026-05-28 13:42:40', 0, 'active', NULL, NULL, NULL),
(22, 'NNT-2805-005', 74, NULL, 46, 4000000, 'transfer', '[\"https://i.ibb.co/27H1rhYv/sr-ord-74-1779950579303.jpg\"]', NULL, 3, 1, 1, '2026-06-06 08:16:18', '2026-05-28 13:42:56', 0, 'active', NULL, NULL, NULL),
(23, 'NNT-2805-006', 80, NULL, 50, 3105000, 'transfer', '[\"https://i.ibb.co/p6HK19kw/sr-ord-80-1779951642912.jpg\"]', 'ck 28.5 hóa đơn 289', 3, 1, 1, '2026-06-06 08:16:15', '2026-05-28 14:00:43', 0, 'active', NULL, NULL, NULL),
(24, 'NNT-2905-001', 86, NULL, 55, 1200000, 'transfer', NULL, '29.5 ck cty 1tr2 2 xe', 3, 1, 1, '2026-05-29 09:38:10', '2026-05-29 08:58:48', 0, 'active', NULL, NULL, NULL),
(25, 'NNT-2905-002', 84, NULL, 53, 6272000, 'cash', NULL, '29.5 Q nhận 6tr272 tiền mặt, đưa sếp', 3, 1, 1, '2026-05-29 09:38:10', '2026-05-29 08:59:08', 0, 'active', NULL, NULL, NULL),
(26, 'NNT-2905-003', 91, NULL, 60, 810000, 'transfer', NULL, 'ck cty 29.5 810k', 3, 1, 1, '2026-06-06 08:16:13', '2026-05-29 13:53:21', 0, 'active', NULL, NULL, NULL),
(27, 'NNT-2905-004', 92, NULL, 61, 2500000, 'cash', '[\"https://i.ibb.co/QvqhVdhT/sr-ord-92-1780041346083.jpg\"]', 'ck anh Cương 29.5', 3, 1, 1, '2026-06-06 08:16:11', '2026-05-29 14:55:46', 0, 'active', NULL, NULL, NULL),
(28, 'NNT-2905-005', 87, NULL, 56, 750000, 'transfer', NULL, 'ck cty 29.5', 3, 1, 1, '2026-06-06 08:16:05', '2026-05-29 15:05:57', 0, 'active', NULL, NULL, NULL),
(29, 'NNT-2905-006', 93, NULL, 62, 1800000, 'transfer', NULL, 'ck cty 29.5 1tr8', 3, 1, 1, '2026-06-06 08:16:03', '2026-05-29 16:24:48', 0, 'active', NULL, NULL, NULL),
(30, 'NNT-3005-001', 95, NULL, 65, 750000, 'transfer', '[\"https://i.ibb.co/277DgLMN/sr-ord-95-1780112688576.jpg\"]', NULL, 3, 1, 1, '2026-05-30 11:57:29', '2026-05-30 10:44:45', 0, 'active', NULL, NULL, NULL),
(31, 'NNT-3005-002', 97, NULL, 66, 1200000, 'transfer', NULL, '30.5 ck cty 1tr2', 3, 1, 1, '2026-06-06 08:15:58', '2026-05-30 14:10:55', 0, 'active', NULL, NULL, NULL),
(32, 'NNT-3005-003', 99, NULL, 63, 2365000, 'transfer', '[\"https://i.ibb.co/DgPykngd/sr-ord-99-1780138396747.jpg\"]', NULL, 3, 1, 1, '2026-06-06 08:15:54', '2026-05-30 17:53:12', 0, 'active', NULL, NULL, NULL),
(33, 'NNT-0106-001', 98, NULL, 67, 1320000, 'transfer', '[\"https://i.ibb.co/HfF6CbTp/sr-ord-98-1780281133896.jpg\"]', 'ck cty 1.6.2026', 3, 1, 1, '2026-06-02 09:54:25', '2026-06-01 09:32:20', 0, 'active', NULL, NULL, NULL),
(34, 'NNT-0106-002', NULL, 19, 36, 7000000, 'transfer', NULL, 'ck cty 1.6 7tr', 3, 1, 1, '2026-06-02 14:01:38', '2026-06-01 09:42:25', 0, 'active', NULL, NULL, NULL),
(35, 'NNT-0106-003', NULL, 20, 63, 2365000, 'cash', '[\"https://i.ibb.co/b5s2qqrV/sr-receipt.jpg\"]', 'ck 30.5', 3, 1, 1, '2026-06-02 14:01:52', '2026-06-01 10:02:11', 0, 'active', NULL, NULL, NULL),
(36, 'NNT-0106-004', 103, NULL, 69, 750000, 'transfer', NULL, NULL, 3, 1, 1, '2026-06-05 11:00:51', '2026-06-01 10:22:25', 0, 'active', NULL, NULL, NULL),
(37, 'NNT-0106-005', 107, NULL, 74, 600000, 'transfer', NULL, 'ck cá nhân anh C 1.6', 3, 1, 1, '2026-06-05 11:00:52', '2026-06-01 16:05:49', 0, 'active', NULL, NULL, NULL),
(38, 'NNT-0106-006', 108, NULL, 75, 750000, 'transfer', NULL, 'ck 1.6', 3, 1, 1, '2026-06-05 11:00:53', '2026-06-01 16:10:54', 0, 'active', NULL, NULL, NULL),
(39, 'NNT-0106-007', 81, NULL, 51, 8000000, 'transfer', '[\"https://i.ibb.co/4gw0Xw5y/order-81-1780305140955.jpg\"]', NULL, 6, 1, 1, '2026-06-02 13:58:40', '2026-06-01 16:12:43', 0, 'active', NULL, NULL, NULL),
(40, 'NNT-0106-008', 106, NULL, 71, 770000, 'transfer', NULL, NULL, 3, 1, 1, '2026-06-05 11:00:39', '2026-06-01 16:48:06', 0, 'active', NULL, NULL, NULL),
(41, 'NNT-0106-009', 109, NULL, 76, 1500000, 'transfer', '[\"https://i.ibb.co/gM7SQ6g7/sr-ord-109-1780307476457.jpg\"]', NULL, 6, 1, 1, '2026-06-02 13:59:46', '2026-06-01 16:51:28', 0, 'active', NULL, NULL, NULL),
(42, 'NNT-0206-001', 104, NULL, 70, 1800000, 'transfer', NULL, '2.6.2026 ck 1tr8', 3, 1, 1, '2026-06-02 14:00:24', '2026-06-02 08:35:25', 0, 'active', NULL, NULL, NULL),
(43, 'NNT-0206-002', 110, NULL, 77, 2250000, 'transfer', '[\"https://i.ibb.co/23kshK0y/sr-ord-110-1780366641630.jpg\"]', NULL, 6, 1, 1, '2026-06-02 09:47:34', '2026-06-02 09:17:23', 0, 'active', NULL, NULL, NULL),
(44, 'NNT-0206-003', 111, NULL, 78, 1680000, 'transfer', NULL, 'ck anh Cương 2.6', 3, 1, 1, '2026-06-02 13:59:02', '2026-06-02 09:41:12', 0, 'active', NULL, NULL, NULL),
(45, 'NNT-0206-004', 111, NULL, 78, 1680000, 'cash', NULL, NULL, 3, 1, 1, '2026-06-02 13:59:00', '2026-06-02 09:41:14', 0, 'active', NULL, NULL, NULL),
(46, 'NNT-0206-005', 114, NULL, 79, 750000, 'transfer', NULL, 'ck cty 2.6', 3, 1, 1, '2026-06-05 11:00:36', '2026-06-02 11:20:19', 0, 'active', NULL, NULL, NULL),
(47, 'NNT-0206-006', 116, NULL, 81, 1800000, 'transfer', '[\"https://i.ibb.co/zTX23JTR/sr-ord-116-1780395299654.jpg\"]', 'ck cty 2.6', 3, 1, 1, '2026-06-05 11:00:32', '2026-06-02 17:15:01', 0, 'active', NULL, NULL, NULL),
(48, 'NNT-0306-001', 118, NULL, 82, 13500000, 'transfer', NULL, '3.6 thu gh 13tr500', 3, 1, 1, '2026-06-05 11:00:21', '2026-06-03 08:58:40', 0, 'active', NULL, NULL, NULL),
(49, 'NNT-0306-002', 121, NULL, 42, 2322000, 'transfer', '[\"https://i.ibb.co/sdtyBKFM/sr-ord-121-1780457932663.jpg\"]', 'ck 3.6.26', 3, 1, 1, '2026-06-05 11:00:13', '2026-06-03 10:38:54', 0, 'active', NULL, NULL, NULL),
(50, 'NNT-0306-003', NULL, 21, 21, 21601200, 'cash', NULL, 'ck hoa don 260 259  3.6.2026', 3, 1, 1, '2026-06-05 11:00:11', '2026-06-03 13:07:37', 0, 'active', NULL, NULL, NULL),
(51, 'NNT-0306-004', 130, NULL, 86, 750000, 'transfer', NULL, 'ck cty 3.6.26', 3, 1, 1, '2026-06-05 11:00:07', '2026-06-03 16:58:59', 0, 'active', NULL, NULL, NULL),
(52, 'NNT-0406-001', 133, NULL, 88, 750000, 'transfer', NULL, 'ck cty 4.6 ductan', 3, 1, 1, '2026-06-05 10:40:20', '2026-06-04 09:04:44', 0, 'active', NULL, NULL, NULL),
(53, 'NNT-0406-002', 134, NULL, 89, 600000, 'transfer', NULL, 'ck 600k 4.6', 3, 1, 1, '2026-06-04 16:59:28', '2026-06-04 09:08:40', 0, 'active', NULL, NULL, NULL),
(54, 'NNT-0406-003', 131, NULL, 87, 750000, 'transfer', '[\"https://i.ibb.co/fdNNfkFQ/sr-ord-131-1780541350121.jpg\"]', 'ck cty 4.6', 3, 1, 1, '2026-06-05 10:40:13', '2026-06-04 09:49:12', 0, 'active', NULL, NULL, NULL),
(55, 'NNT-0406-004', 135, NULL, 36, 4428000, 'transfer', NULL, NULL, 3, 1, 1, '2026-06-04 16:59:31', '2026-06-04 09:50:14', 0, 'active', NULL, NULL, NULL),
(56, 'NNT-0406-005', 137, NULL, 33, 700000, 'transfer', '[\"https://i.ibb.co/JWtFh09r/sr-ord-137-1780546625897.jpg\"]', 'ck cty', 3, 1, 1, '2026-06-05 10:40:09', '2026-06-04 11:17:05', 0, 'active', NULL, NULL, NULL),
(57, 'NNT-0406-006', 138, NULL, 45, 480000, 'transfer', '[\"https://i.ibb.co/TjchYJq/sr-ord-138-1780553836690.jpg\"]', 'ck anh Cương 4.6', 3, 1, 1, '2026-06-05 10:40:06', '2026-06-04 13:17:16', 0, 'active', NULL, NULL, NULL),
(58, 'NNT-0506-001', 149, NULL, 94, 750000, 'transfer', NULL, NULL, 3, 1, 1, '2026-06-05 10:39:41', '2026-06-05 08:43:59', 0, 'active', NULL, NULL, NULL),
(59, 'NNT-0506-002', 153, NULL, 97, 1080000, 'cash', NULL, 'Anh V thu 1tr80', 3, 0, NULL, NULL, '2026-06-05 19:46:55', 0, 'active', NULL, NULL, NULL),
(60, 'NNT-0606-001', NULL, 22, 52, 8316000, 'transfer', NULL, 'TT HÓA ĐƠN 8TR316', 3, 1, 1, '2026-06-06 19:46:25', '2026-06-06 09:48:48', 0, 'active', NULL, NULL, NULL),
(61, 'NNT-0606-002', 157, NULL, 99, 460000, 'cash', NULL, NULL, 3, 0, NULL, NULL, '2026-06-06 10:10:28', 0, 'active', NULL, NULL, NULL),
(62, 'NNT-0606-003', 159, NULL, 100, 750000, 'transfer', '[\"https://i.ibb.co/bgzZnqJN/sr-ord-159-1780722298422.jpg\"]', 'ck cty 6/6', 3, 1, 1, '2026-06-06 12:59:50', '2026-06-06 12:04:55', 0, 'active', NULL, NULL, NULL),
(63, 'NNT-0906-001', 165, NULL, 104, 3600000, 'transfer', '[\"https://i.ibb.co/jk2GdtQg/sr-ord-168-1780979392027.jpg\"]', NULL, 6, 0, NULL, NULL, '2026-06-09 14:17:07', 0, 'active', NULL, NULL, NULL),
(64, 'NNT-0906-002', 166, NULL, 105, 750000, 'transfer', '[\"https://i.ibb.co/2Yg3py47/sr-ord-169-1780980395591.jpg\"]', NULL, 6, 0, NULL, NULL, '2026-06-09 14:18:15', 0, 'active', NULL, NULL, NULL),
(65, 'NNT-0906-003', 150, NULL, 95, 3550000, 'transfer', '[\"https://i.ibb.co/Xx94YZ70/sr-ord-150-1780993301577.jpg\"]', '9.6.26 ck cty', 3, 0, NULL, NULL, '2026-06-09 15:21:44', 0, 'active', NULL, NULL, NULL),
(66, 'NNT-0906-004', 170, NULL, 58, 7000000, 'transfer', '[\"https://i.ibb.co/DfrW1FWy/sr-ord-170-1780996913778.jpg\"]', NULL, 3, 0, NULL, NULL, '2026-06-09 16:21:55', 0, 'active', NULL, NULL, NULL),
(67, 'NNT-0906-005', 171, NULL, 107, 750000, 'transfer', '[\"https://i.ibb.co/PshJsWsB/sr-ord-171-1780996929899.jpg\"]', NULL, 6, 0, NULL, NULL, '2026-06-09 16:22:11', 0, 'active', NULL, NULL, NULL),
(68, 'NNT-0906-006', 173, NULL, 61, 1850000, 'transfer', '[\"https://i.ibb.co/gbGhhZDK/sr-ord-173-1780999168822.jpg\"]', NULL, 3, 0, NULL, NULL, '2026-06-09 16:59:32', 0, 'active', NULL, NULL, NULL),
(69, 'NNT-1006-001', 174, NULL, 108, 750000, 'transfer', '[\"https://i.ibb.co/7mf4S0k/sr-ord-174-1781056031648.jpg\"]', NULL, 6, 0, NULL, NULL, '2026-06-10 08:47:15', 0, 'active', NULL, NULL, NULL),
(70, 'NNT-1006-002', 167, NULL, 106, 700000, 'transfer', '[\"https://i.ibb.co/sDRkZvr/sr-ord-167-1781057318988.jpg\"]', NULL, 3, 0, NULL, NULL, '2026-06-10 09:08:41', 0, 'active', NULL, NULL, NULL),
(71, 'NNT-1006-003', 177, NULL, 110, 750000, 'transfer', '[\"https://i.ibb.co/LDBTd8SD/sr-ord-177-1781066253026.jpg\"]', NULL, 3, 0, NULL, NULL, '2026-06-10 11:37:33', 0, 'active', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `staff_reviews`
--

CREATE TABLE `staff_reviews` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `rating` tinyint(4) NOT NULL,
  `comment` text DEFAULT NULL,
  `reviewed_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `staff_salary_advances`
--

CREATE TABLE `staff_salary_advances` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `amount` bigint(20) NOT NULL DEFAULT 0,
  `note` varchar(300) DEFAULT NULL,
  `payslip_id` int(11) DEFAULT NULL,
  `carried_at` datetime DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0,
  `remittance_id` int(11) DEFAULT NULL,
  `remitted_at` datetime DEFAULT NULL,
  `deduct_from_collection` tinyint(4) NOT NULL DEFAULT 0,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'approved',
  `approved_at` datetime DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `reject_reason` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `staff_salary_advances`
--

INSERT INTO `staff_salary_advances` (`id`, `staff_id`, `amount`, `note`, `payslip_id`, `carried_at`, `created_by`, `created_at`, `is_deleted`, `remittance_id`, `remitted_at`, `deduct_from_collection`, `status`, `approved_at`, `approved_by`, `reject_reason`) VALUES
(1, 7, 100000, NULL, NULL, NULL, 1, '2026-05-21 17:03:45', 0, NULL, NULL, 0, 'approved', NULL, NULL, NULL),
(2, 7, 100000, 'ăn mì tôm', NULL, NULL, 1, '2026-05-21 17:04:34', 0, NULL, NULL, 0, 'approved', NULL, NULL, NULL),
(3, 7, 10000, NULL, NULL, NULL, 1, '2026-05-21 17:29:46', 0, NULL, NULL, 0, 'approved', NULL, NULL, NULL),
(4, 7, 20000, NULL, NULL, NULL, 6, '2026-05-21 17:33:51', 0, NULL, NULL, 0, 'approved', NULL, NULL, NULL),
(5, 7, 100000, 'Ứng lương kỳ 2026-05', NULL, NULL, 1, '2026-05-21 18:45:44', 0, 7, '2026-06-05 22:01:31', 1, 'approved', NULL, NULL, NULL),
(6, 6, 400000, 'ứng tiền hihi', NULL, NULL, 6, '2026-05-21 19:42:49', 1, NULL, NULL, 0, 'approved', NULL, NULL, NULL),
(7, 6, 100000, NULL, 2, '2026-05-23 00:49:26', 6, '2026-05-21 19:44:50', 0, NULL, NULL, 0, 'approved', NULL, NULL, NULL),
(8, 6, 50000, NULL, NULL, NULL, 6, '2026-05-21 20:35:32', 0, NULL, NULL, 0, 'pending', NULL, NULL, NULL),
(9, 2, 500000, 'Ứng lương kỳ 2026-05', NULL, NULL, 1, '2026-05-22 22:43:20', 0, 5, '2026-06-02 16:32:16', 1, 'approved', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `staff_stock_consumptions`
--

CREATE TABLE `staff_stock_consumptions` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL,
  `ref_kind` enum('order','warranty_order','repair_order') NOT NULL,
  `ref_id` int(11) NOT NULL,
  `imei` varchar(120) DEFAULT NULL,
  `consumed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `staff_stock_issues`
--

CREATE TABLE `staff_stock_issues` (
  `id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `status` enum('draft','approved','received','rejected','cancelled') NOT NULL DEFAULT 'draft',
  `note` varchar(500) DEFAULT NULL,
  `created_by_staff_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `approved_by_staff_id` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `received_at` datetime DEFAULT NULL,
  `received_photo_url` varchar(500) DEFAULT NULL,
  `rejected_reason` varchar(500) DEFAULT NULL,
  `ref_receipt_id` int(11) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `staff_stock_issues`
--

INSERT INTO `staff_stock_issues` (`id`, `code`, `staff_id`, `status`, `note`, `created_by_staff_id`, `created_at`, `approved_by_staff_id`, `approved_at`, `received_at`, `received_photo_url`, `rejected_reason`, `ref_receipt_id`, `is_deleted`) VALUES
(1, 'CAP-1805-001', 2, 'received', NULL, 1, '2026-05-18 10:38:37', 1, '2026-05-18 17:38:41', '2026-05-18 17:40:03', 'https://i.ibb.co/MDh266z0/issue-CAP-1805-001.png', NULL, 2, 0),
(2, 'CAP-1805-002', 2, 'received', NULL, 1, '2026-05-18 11:23:48', 1, '2026-05-18 18:23:52', '2026-05-18 18:28:35', 'https://i.ibb.co/MDh266z0/issue-CAP-1805-001.png', NULL, 6, 0),
(3, 'CAP-1805-003', 4, 'received', NULL, 1, '2026-05-18 13:00:45', 1, '2026-05-18 20:01:19', '2026-05-19 22:12:43', 'https://i.ibb.co/35N75ZrT/issue-CAP-1805-004.jpg', NULL, 16, 0),
(4, 'CAP-1805-004', 4, 'received', NULL, 1, '2026-05-18 13:00:45', 1, '2026-05-18 20:01:07', '2026-05-19 22:12:28', 'https://i.ibb.co/35N75ZrT/issue-CAP-1805-004.jpg', NULL, 15, 0),
(5, 'CAP-2205-001', 8, 'received', NULL, 1, '2026-05-22 15:56:48', 1, '2026-05-22 22:57:02', '2026-05-23 23:02:42', 'https://i.ibb.co/Pv2yFcX6/issue-CAP-2205-001.jpg', NULL, 40, 0),
(6, 'CAP-2205-002', 8, 'received', NULL, 6, '2026-05-22 16:22:55', 1, '2026-05-22 23:26:24', '2026-05-23 23:02:17', 'https://i.ibb.co/dwSMpPN6/issue-CAP-2205-002.jpg', NULL, 43, 0),
(7, 'CAP-2205-003', 8, 'received', NULL, 6, '2026-05-22 16:58:41', 1, '2026-05-22 23:59:01', '2026-05-23 23:01:54', 'https://i.ibb.co/HTLDQPRd/issue-CAP-2205-003.jpg', NULL, 45, 0),
(8, 'CAP-2405-001', 2, 'received', NULL, 1, '2026-05-24 14:23:39', 1, '2026-05-24 21:28:10', '2026-05-24 21:28:42', 'https://i.ibb.co/hRstT8n3/issue-CAP-2405-001.jpg', NULL, 60, 0),
(9, 'CAP-2405-002', 2, 'received', NULL, 3, '2026-05-24 14:54:04', 3, '2026-05-24 21:54:29', '2026-05-24 21:55:03', 'https://i.ibb.co/XkdzHbbD/issue-CAP-2405-002.jpg', NULL, 62, 0),
(10, 'CAP-2605-001', 8, 'received', NULL, 1, '2026-05-26 03:13:40', 1, '2026-05-26 10:13:42', '2026-06-05 20:17:15', 'https://i.ibb.co/fdMtq7tY/issue-CAP-2605-001.jpg', NULL, 69, 0),
(11, 'CAP-2605-002', 8, 'received', NULL, 6, '2026-05-26 04:07:19', 6, '2026-05-26 11:07:30', '2026-06-05 20:16:57', 'https://i.ibb.co/HfRkZ9Tx/issue-CAP-2605-002.jpg', NULL, 72, 0),
(12, 'CAP-2805-001', 8, 'received', NULL, 3, '2026-05-28 07:47:29', 3, '2026-05-28 14:47:32', '2026-06-05 20:16:38', 'https://i.ibb.co/hJdwHLPj/issue-CAP-2805-001.jpg', NULL, 85, 0),
(13, 'CAP-0106-001', 2, 'approved', NULL, 3, '2026-06-01 02:49:41', 1, '2026-06-04 18:01:03', NULL, NULL, NULL, 112, 0),
(14, 'CAP-0206-001', 8, 'draft', NULL, 3, '2026-06-02 03:10:44', NULL, NULL, NULL, NULL, NULL, NULL, 0),
(15, 'CAP-0206-002', 8, 'draft', NULL, 3, '2026-06-02 03:11:53', NULL, NULL, NULL, NULL, NULL, NULL, 0),
(16, 'CAP-0306-001', 8, 'draft', NULL, 3, '2026-06-03 02:48:59', NULL, NULL, NULL, NULL, NULL, NULL, 0),
(17, 'CAP-0306-002', 2, 'approved', NULL, 3, '2026-06-03 08:15:43', 1, '2026-06-04 18:01:01', NULL, NULL, NULL, 111, 0),
(18, 'CAP-0406-001', 2, 'approved', NULL, 3, '2026-06-04 03:55:49', 1, '2026-06-04 18:00:58', NULL, NULL, NULL, 110, 0),
(19, 'CAP-0406-002', 2, 'approved', NULL, 3, '2026-06-04 07:05:23', 1, '2026-06-04 18:00:54', NULL, NULL, NULL, 109, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `staff_stock_issue_items`
--

CREATE TABLE `staff_stock_issue_items` (
  `id` int(11) NOT NULL,
  `issue_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty_requested` int(11) NOT NULL,
  `qty_approved` int(11) DEFAULT NULL,
  `imei_list` text DEFAULT NULL,
  `note` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `staff_stock_issue_items`
--

INSERT INTO `staff_stock_issue_items` (`id`, `issue_id`, `product_id`, `qty_requested`, `qty_approved`, `imei_list`, `note`) VALUES
(1, 1, 1, 5, 5, NULL, NULL),
(2, 2, 3, 5, 5, '123456789\n000000010\n000000011\n000000012\n000000013', NULL),
(3, 3, 2, 10, 10, NULL, NULL),
(4, 4, 2, 10, 10, NULL, NULL),
(5, 5, 8, 2, 2, NULL, NULL),
(6, 5, 2, 10, 10, NULL, NULL),
(7, 6, 4, 1, 1, NULL, NULL),
(8, 7, 5, 2, 2, NULL, NULL),
(9, 8, 11, 5, 5, NULL, NULL),
(10, 8, 10, 9, 9, NULL, NULL),
(11, 8, 5, 9, 9, NULL, NULL),
(12, 9, 2, 5, 5, NULL, NULL),
(13, 10, 16, 2, 2, NULL, NULL),
(14, 11, 14, 1, 1, NULL, NULL),
(15, 11, 4, 1, 1, NULL, NULL),
(16, 11, 15, 4, 4, NULL, NULL),
(17, 11, 10, 1, 1, NULL, NULL),
(18, 12, 2, 1, 1, '860056084077180\n860056084075945\n860056084012617\n860056084078808\n860056084066712\n860056084079772\n860056084092684', NULL),
(19, 13, 5, 1, 1, '862051082925843', NULL),
(20, 13, 9, 1, 1, NULL, NULL),
(21, 14, 4, 3, NULL, '862051082886235\n862051082920869\n862051082887712', NULL),
(22, 14, 6, 3, NULL, NULL, NULL),
(23, 14, 31, 3, NULL, NULL, NULL),
(24, 14, 12, 2, NULL, NULL, NULL),
(25, 14, 23, 3, NULL, NULL, NULL),
(26, 14, 10, 3, NULL, NULL, NULL),
(27, 15, 15, 2, NULL, NULL, NULL),
(28, 15, 28, 4, NULL, '860056083566753\n860056083563651\n860056083535360\n860056083526039', NULL),
(29, 16, 5, 1, NULL, '862051082904335', NULL),
(30, 16, 28, 1, NULL, '60056083525122', NULL),
(31, 16, 10, 1, NULL, NULL, NULL),
(32, 16, 31, 1, NULL, NULL, NULL),
(33, 17, 28, 4, 4, NULL, NULL),
(34, 18, 5, 2, 2, '862051082907825\n862051082905977', NULL),
(35, 18, 6, 2, 2, NULL, NULL),
(36, 18, 10, 2, 2, NULL, NULL),
(37, 18, 31, 2, 2, NULL, NULL),
(38, 19, 5, 2, 2, '862051082907692\n862051082907478', NULL),
(39, 19, 10, 2, 2, NULL, NULL),
(40, 19, 6, 2, 2, NULL, NULL),
(41, 19, 31, 2, 2, NULL, NULL),
(42, 19, 28, 10, 10, '860056083567306\n860056083533233\n860056083568049\n860056083567645\n860056083538356\n860056083568403\n860056083524018\n860056083566894\n860056083567710\n860056083567728', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `stock_items`
--

CREATE TABLE `stock_items` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `identifier` varchar(100) DEFAULT NULL,
  `status` enum('available','reserved','sold','damaged','returned') NOT NULL DEFAULT 'available',
  `held_by_staff_id` int(11) DEFAULT NULL,
  `import_price` bigint(20) DEFAULT NULL,
  `import_date` date DEFAULT NULL,
  `note` text DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `held_since` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `stock_receipts`
--

CREATE TABLE `stock_receipts` (
  `id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `kind` enum('in','out') NOT NULL,
  `reason_code` varchar(40) NOT NULL,
  `reason_text` varchar(500) DEFAULT NULL,
  `ref_order_id` int(11) DEFAULT NULL,
  `ref_staff_id` int(11) DEFAULT NULL,
  `ref_warranty_order_id` int(11) DEFAULT NULL,
  `ref_stock_take_id` int(11) DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `created_by_staff_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_voided` tinyint(1) NOT NULL DEFAULT 0,
  `voided_at` datetime DEFAULT NULL,
  `voided_reason` varchar(500) DEFAULT NULL,
  `voided_by_receipt_id` int(11) DEFAULT NULL,
  `photo_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photo_urls`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `stock_receipts`
--

INSERT INTO `stock_receipts` (`id`, `code`, `kind`, `reason_code`, `reason_text`, `ref_order_id`, `ref_staff_id`, `ref_warranty_order_id`, `ref_stock_take_id`, `supplier_id`, `created_by_staff_id`, `created_at`, `is_voided`, `voided_at`, `voided_reason`, `voided_by_receipt_id`, `photo_urls`) VALUES
(1, 'PN-260518-001', 'in', 'import_supplier', NULL, NULL, NULL, NULL, NULL, 1, 1, '2026-05-18 10:36:32', 0, NULL, NULL, NULL, NULL),
(2, 'PX-260518-001', 'out', 'staff_issue', 'Cap SP cho KTV qua phieu CAP-1805-001', NULL, 2, NULL, NULL, NULL, 1, '2026-05-18 10:38:41', 0, NULL, NULL, NULL, NULL),
(3, 'PX-260518-002', 'out', 'order_consume', NULL, 1, 2, NULL, NULL, NULL, 2, '2026-05-18 10:46:06', 0, NULL, NULL, NULL, NULL),
(4, 'PN-260518-002', 'in', 'import_supplier', NULL, NULL, NULL, NULL, NULL, 1, 1, '2026-05-18 11:19:21', 0, NULL, NULL, NULL, NULL),
(5, 'PN-260518-003', 'in', 'import_supplier', NULL, NULL, NULL, NULL, NULL, 1, 1, '2026-05-18 11:20:34', 0, NULL, NULL, NULL, NULL),
(6, 'PX-260518-003', 'out', 'staff_issue', 'Cap SP cho KTV qua phieu CAP-1805-002', NULL, 2, NULL, NULL, NULL, 1, '2026-05-18 11:23:52', 0, NULL, NULL, NULL, NULL),
(7, 'PX-260518-004', 'out', 'technician_take_direct', NULL, NULL, 2, NULL, NULL, NULL, 2, '2026-05-18 11:30:03', 0, NULL, NULL, NULL, NULL),
(8, 'PX-260518-005', 'out', 'order_consume', NULL, 2, 2, NULL, NULL, NULL, 2, '2026-05-18 11:42:42', 0, NULL, NULL, NULL, NULL),
(9, 'PX-260518-006', 'out', 'order_consume', NULL, 4, 2, NULL, NULL, NULL, 2, '2026-05-18 12:03:12', 0, NULL, NULL, NULL, NULL),
(10, 'PX-260518-007', 'out', 'order_consume', NULL, 6, 2, NULL, NULL, NULL, 2, '2026-05-18 12:25:38', 0, NULL, NULL, NULL, NULL),
(11, 'PX-260518-008', 'out', 'order_consume', NULL, 8, 2, NULL, NULL, NULL, 2, '2026-05-18 12:42:01', 0, NULL, NULL, NULL, NULL),
(12, 'PN-260518-004', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-05-18 12:52:57', 0, NULL, NULL, NULL, NULL),
(13, 'PN-260518-005', 'in', 'import_supplier', NULL, NULL, NULL, NULL, NULL, 1, 1, '2026-05-18 12:53:23', 0, NULL, NULL, NULL, NULL),
(14, 'PN-260518-006', 'in', 'import_supplier', NULL, NULL, NULL, NULL, NULL, 1, 3, '2026-05-18 12:58:38', 0, NULL, NULL, NULL, NULL),
(15, 'PX-260518-009', 'out', 'staff_issue', 'Cap SP cho KTV qua phieu CAP-1805-004', NULL, 4, NULL, NULL, NULL, 1, '2026-05-18 13:01:07', 0, NULL, NULL, NULL, NULL),
(16, 'PX-260518-010', 'out', 'staff_issue', 'Cap SP cho KTV qua phieu CAP-1805-003', NULL, 4, NULL, NULL, NULL, 1, '2026-05-18 13:01:19', 0, NULL, NULL, NULL, NULL),
(17, 'PX-260518-011', 'out', 'staff_grant', NULL, NULL, 4, NULL, NULL, NULL, 3, '2026-05-18 13:07:14', 0, NULL, NULL, NULL, NULL),
(18, 'PN-260519-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-05-19 14:12:59', 0, NULL, NULL, NULL, NULL),
(19, 'PX-260519-001', 'out', 'staff_grant', NULL, NULL, 4, NULL, NULL, NULL, 3, '2026-05-19 15:08:44', 0, NULL, NULL, NULL, NULL),
(20, 'PX-260519-002', 'out', 'order_consume', NULL, 16, 4, NULL, NULL, NULL, 4, '2026-05-19 15:15:51', 0, NULL, NULL, NULL, NULL),
(21, 'PX-260519-003', 'out', 'staff_grant', NULL, NULL, 2, NULL, NULL, NULL, 3, '2026-05-19 15:34:23', 0, NULL, NULL, NULL, NULL),
(22, 'PX-260520-001', 'out', 'order_consume', NULL, 20, 2, NULL, NULL, NULL, 2, '2026-05-20 14:17:29', 0, NULL, NULL, NULL, NULL),
(23, 'PX-260521-001', 'out', 'order_consume', NULL, 1, 4, NULL, NULL, NULL, 4, '2026-05-21 07:32:15', 0, NULL, NULL, NULL, NULL),
(24, 'PX-260521-002', 'out', 'order_consume', NULL, 2, 7, NULL, NULL, NULL, 7, '2026-05-21 08:12:13', 0, NULL, NULL, NULL, NULL),
(25, 'PN-260521-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 6, '2026-05-21 08:21:51', 0, NULL, NULL, NULL, NULL),
(26, 'PN-260521-002', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 6, '2026-05-21 08:23:48', 0, NULL, NULL, NULL, NULL),
(27, 'PN-260521-003', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-05-21 08:32:02', 0, NULL, NULL, NULL, NULL),
(28, 'PN-260521-004', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-05-21 08:32:10', 0, NULL, NULL, NULL, NULL),
(29, 'PN-260521-005', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-05-21 08:32:17', 0, NULL, NULL, NULL, NULL),
(30, 'PX-260521-003', 'out', 'staff_grant', NULL, NULL, 8, NULL, NULL, NULL, 6, '2026-05-21 08:33:58', 0, NULL, NULL, NULL, NULL),
(31, 'PN-260521-006', 'in', 'technician_return', NULL, NULL, 8, NULL, NULL, NULL, 8, '2026-05-21 08:46:30', 0, NULL, NULL, NULL, NULL),
(32, 'PX-260521-004', 'out', 'order_consume', NULL, 4, 7, NULL, NULL, NULL, 7, '2026-05-21 09:08:25', 0, NULL, NULL, NULL, NULL),
(33, 'PX-260521-005', 'out', 'order_consume', NULL, 6, 7, NULL, NULL, NULL, 7, '2026-05-21 09:18:32', 0, NULL, NULL, NULL, NULL),
(34, 'PX-260521-006', 'out', 'order_consume', NULL, 8, 7, NULL, NULL, NULL, 7, '2026-05-21 09:43:38', 0, NULL, NULL, NULL, NULL),
(35, 'PX-260521-007', 'out', 'order_consume', NULL, 10, 7, NULL, NULL, NULL, 7, '2026-05-21 11:01:18', 0, NULL, NULL, NULL, NULL),
(36, 'PN-260522-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-05-22 14:17:34', 0, NULL, NULL, NULL, NULL),
(37, 'PX-260522-001', 'out', 'adjust_minus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-05-22 14:18:31', 0, NULL, NULL, NULL, NULL),
(38, 'PX-260522-002', 'out', 'order_consume', NULL, 12, 2, NULL, NULL, NULL, 2, '2026-05-22 15:13:43', 0, NULL, NULL, NULL, NULL),
(39, 'PX-260522-003', 'out', 'order_consume', NULL, 14, 2, NULL, NULL, NULL, 2, '2026-05-22 15:27:06', 0, NULL, NULL, NULL, NULL),
(40, 'PX-260522-004', 'out', 'staff_issue', 'Cap SP cho KTV qua phieu CAP-2205-001', NULL, 8, NULL, NULL, NULL, 1, '2026-05-22 15:57:02', 0, NULL, NULL, NULL, NULL),
(41, 'PX-260522-005', 'out', 'order_consume', NULL, 15, 8, NULL, NULL, NULL, 8, '2026-05-22 16:08:50', 0, NULL, NULL, NULL, NULL),
(42, 'PX-260522-006', 'out', 'order_consume', NULL, 17, 2, NULL, NULL, NULL, 2, '2026-05-22 16:15:23', 0, NULL, NULL, NULL, NULL),
(43, 'PX-260522-007', 'out', 'staff_issue', 'Cap SP cho KTV qua phieu CAP-2205-002', NULL, 8, NULL, NULL, NULL, 1, '2026-05-22 16:26:24', 0, NULL, NULL, NULL, NULL),
(44, 'PX-260522-008', 'out', 'order_consume', NULL, 20, 8, NULL, NULL, NULL, 8, '2026-05-22 16:33:56', 0, NULL, NULL, NULL, NULL),
(45, 'PX-260522-009', 'out', 'staff_issue', 'Cap SP cho KTV qua phieu CAP-2205-003', NULL, 8, NULL, NULL, NULL, 1, '2026-05-22 16:59:01', 0, NULL, NULL, NULL, NULL),
(46, 'PX-260523-001', 'out', 'order_consume', NULL, 31, 8, NULL, NULL, NULL, 8, '2026-05-22 17:00:16', 0, NULL, NULL, NULL, NULL),
(47, 'PN-260523-001', 'in', 'import_supplier', NULL, NULL, NULL, NULL, NULL, 1, 1, '2026-05-22 17:11:50', 0, NULL, NULL, NULL, NULL),
(48, 'PN-260523-002', 'in', 'import_supplier', '6', NULL, NULL, NULL, NULL, 1, 6, '2026-05-22 20:04:34', 0, NULL, NULL, NULL, NULL),
(49, 'PX-260523-002', 'out', 'staff_grant', NULL, NULL, 7, NULL, NULL, NULL, 6, '2026-05-22 20:05:01', 0, NULL, NULL, NULL, NULL),
(50, 'PX-260523-003', 'out', 'order_consume', NULL, 28, 7, NULL, NULL, NULL, 7, '2026-05-23 04:35:59', 0, NULL, NULL, NULL, NULL),
(51, 'PN-260523-003', 'in', 'technician_return', NULL, NULL, 8, NULL, NULL, NULL, 8, '2026-05-23 15:35:40', 0, NULL, NULL, NULL, NULL),
(52, 'PX-260523-004', 'out', 'order_consume', NULL, 36, 8, NULL, NULL, NULL, 8, '2026-05-23 15:47:26', 0, NULL, NULL, NULL, NULL),
(53, 'PN-260523-004', 'in', 'adjust_plus', 'Nhập hàng', NULL, NULL, NULL, NULL, NULL, 1, '2026-05-23 15:55:32', 0, NULL, NULL, NULL, NULL),
(54, 'PN-260523-005', 'in', 'adjust_plus', 'Nhập hàng', NULL, NULL, NULL, NULL, NULL, 1, '2026-05-23 15:56:09', 0, NULL, NULL, NULL, NULL),
(55, 'PX-260523-005', 'out', 'send_warranty', 'gửi bảo hành', NULL, NULL, NULL, NULL, NULL, 1, '2026-05-23 15:57:01', 0, NULL, NULL, NULL, '[\"https://i.ibb.co/wr6xNhCp/345819bd21e2.png\"]'),
(56, 'PN-260523-006', 'in', 'technician_return', NULL, NULL, 8, NULL, NULL, NULL, 8, '2026-05-23 16:03:31', 0, NULL, NULL, NULL, NULL),
(57, 'PN-260523-007', 'in', 'dealer_warranty_return', 'đại lí nó gửi', NULL, NULL, NULL, NULL, NULL, 1, '2026-05-23 16:37:26', 0, NULL, NULL, NULL, '[\"https://i.ibb.co/FRpHLPJ/d40c25221060.png\",\"https://i.ibb.co/x8MtBySv/f97307b8032d.png\",\"https://i.ibb.co/7d97thM3/0c24409d9442.png\"]'),
(58, 'PX-260524-001', 'out', 'adjust_minus', 'Gửi bảo hành Gotrack', NULL, NULL, NULL, NULL, NULL, 1, '2026-05-24 14:08:56', 0, NULL, NULL, NULL, NULL),
(59, 'PN-260524-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-05-24 14:22:14', 0, NULL, NULL, NULL, NULL),
(60, 'PX-260524-002', 'out', 'staff_issue', 'Cap SP cho KTV qua phieu CAP-2405-001', NULL, 2, NULL, NULL, NULL, 1, '2026-05-24 14:28:10', 0, NULL, NULL, NULL, NULL),
(61, 'PX-260524-003', 'out', 'order_consume', NULL, 37, 2, NULL, NULL, NULL, 2, '2026-05-24 14:33:36', 0, NULL, NULL, NULL, NULL),
(62, 'PX-260524-004', 'out', 'staff_issue', 'Cap SP cho KTV qua phieu CAP-2405-002', NULL, 2, NULL, NULL, NULL, 3, '2026-05-24 14:54:29', 0, NULL, NULL, NULL, NULL),
(63, 'PN-260525-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 6, '2026-05-25 02:29:00', 0, NULL, NULL, NULL, NULL),
(64, 'PN-260525-002', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-05-25 02:50:49', 0, NULL, NULL, NULL, NULL),
(65, 'PN-260525-003', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-05-25 02:51:10', 0, NULL, NULL, NULL, NULL),
(66, 'PN-260525-004', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-05-25 03:53:19', 0, NULL, NULL, NULL, NULL),
(67, 'PN-260525-005', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-05-25 09:27:42', 0, NULL, NULL, NULL, NULL),
(68, 'PN-260525-006', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 6, '2026-05-25 09:46:25', 0, NULL, NULL, NULL, NULL),
(69, 'PX-260526-001', 'out', 'staff_issue', 'Cap SP cho KTV qua phieu CAP-2605-001', NULL, 8, NULL, NULL, NULL, 1, '2026-05-26 03:13:42', 0, NULL, NULL, NULL, NULL),
(70, 'PX-260526-002', 'out', 'order_consume', NULL, 52, 8, NULL, NULL, NULL, 8, '2026-05-26 03:20:03', 0, NULL, NULL, NULL, NULL),
(71, 'PN-260526-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-05-26 04:03:06', 0, NULL, NULL, NULL, NULL),
(72, 'PX-260526-003', 'out', 'staff_issue', 'Cap SP cho KTV qua phieu CAP-2605-002', NULL, 8, NULL, NULL, NULL, 6, '2026-05-26 04:07:30', 0, NULL, NULL, NULL, NULL),
(73, 'PN-260526-002', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-05-26 08:01:09', 0, NULL, NULL, NULL, NULL),
(74, 'PN-260526-003', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-05-26 09:26:36', 0, NULL, NULL, NULL, NULL),
(75, 'PN-260526-004', 'in', 'technician_return', NULL, NULL, 4, NULL, NULL, NULL, 1, '2026-05-26 15:16:46', 0, NULL, NULL, NULL, NULL),
(76, 'PN-260526-005', 'in', 'technician_return', NULL, NULL, 4, NULL, NULL, NULL, 1, '2026-05-26 15:16:47', 0, NULL, NULL, NULL, NULL),
(77, 'PN-260526-006', 'in', 'technician_return', NULL, NULL, 4, NULL, NULL, NULL, 1, '2026-05-26 15:16:48', 0, NULL, NULL, NULL, NULL),
(78, 'PN-260527-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-05-27 02:01:08', 0, NULL, NULL, NULL, NULL),
(79, 'PN-260527-002', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-05-27 02:53:58', 0, NULL, NULL, NULL, NULL),
(80, 'PN-260527-003', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-05-27 10:27:07', 0, NULL, NULL, NULL, NULL),
(81, 'PN-260528-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-05-28 06:11:17', 0, NULL, NULL, NULL, NULL),
(82, 'PN-260528-002', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-05-28 06:11:25', 0, NULL, NULL, NULL, NULL),
(83, 'PN-260528-003', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-05-28 06:12:58', 0, NULL, NULL, NULL, NULL),
(84, 'PN-260528-004', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-05-28 06:13:02', 0, NULL, NULL, NULL, NULL),
(85, 'PX-260528-001', 'out', 'staff_issue', 'Cap SP cho KTV qua phieu CAP-2805-001', NULL, 8, NULL, NULL, NULL, 3, '2026-05-28 07:47:32', 0, NULL, NULL, NULL, NULL),
(86, 'PN-260528-005', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-05-28 07:49:10', 0, NULL, NULL, NULL, NULL),
(87, 'PN-260529-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-05-29 06:41:44', 0, NULL, NULL, NULL, NULL),
(88, 'PN-260529-002', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-05-29 06:52:40', 0, NULL, NULL, NULL, NULL),
(89, 'PX-260530-001', 'out', 'order_consume', NULL, 94, 2, NULL, NULL, NULL, 2, '2026-05-30 02:01:31', 0, NULL, NULL, NULL, NULL),
(90, 'PN-260530-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-05-30 07:07:56', 0, NULL, NULL, NULL, NULL),
(91, 'PN-260530-002', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-05-30 13:45:25', 0, NULL, NULL, NULL, NULL),
(92, 'PN-260530-003', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-05-30 13:51:54', 0, NULL, NULL, NULL, NULL),
(93, 'PN-260601-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-01 06:59:42', 0, NULL, NULL, NULL, NULL),
(94, 'PX-260601-001', 'out', 'order_consume', NULL, 102, 2, NULL, NULL, NULL, 2, '2026-06-01 08:09:26', 0, NULL, NULL, NULL, NULL),
(95, 'PX-260602-001', 'out', 'warranty_exchange_out', 'Xuất thiết bị thay thế bảo hành', NULL, NULL, 10, NULL, NULL, 1, '2026-06-02 03:55:33', 0, NULL, NULL, NULL, NULL),
(96, 'PN-260602-001', 'in', 'import_supplier', '+ thêm sản phẩm thử nghiệm', NULL, NULL, NULL, NULL, 1, 1, '2026-06-02 03:58:56', 0, NULL, NULL, NULL, NULL),
(97, 'PX-260602-002', 'out', 'order_consume', NULL, 54, 8, NULL, NULL, NULL, 8, '2026-06-02 08:36:59', 0, NULL, NULL, NULL, NULL),
(98, 'PX-260602-003', 'out', 'order_consume', NULL, 113, 8, NULL, NULL, NULL, 8, '2026-06-02 08:37:24', 0, NULL, NULL, NULL, NULL),
(99, 'PX-260602-004', 'out', 'order_consume', NULL, 83, 8, NULL, NULL, NULL, 8, '2026-06-02 08:39:38', 0, NULL, NULL, NULL, NULL),
(100, 'PN-260603-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-03 03:20:45', 0, NULL, NULL, NULL, NULL),
(101, 'PN-260603-002', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-03 03:20:58', 0, NULL, NULL, NULL, NULL),
(102, 'PN-260603-003', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-03 03:21:15', 0, NULL, NULL, NULL, NULL),
(103, 'PX-260603-001', 'out', 'order_consume', NULL, 119, 8, NULL, NULL, NULL, 8, '2026-06-03 03:49:40', 0, NULL, NULL, NULL, NULL),
(104, 'PN-260603-004', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-03 08:21:01', 0, NULL, NULL, NULL, NULL),
(105, 'PN-260604-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-04 01:48:45', 0, NULL, NULL, NULL, NULL),
(106, 'PX-260604-001', 'out', 'order_consume', NULL, 136, 8, NULL, NULL, NULL, 8, '2026-06-04 07:14:34', 0, NULL, NULL, NULL, NULL),
(107, 'PX-260604-002', 'out', 'staff_grant', NULL, NULL, 7, NULL, NULL, NULL, 1, '2026-06-04 09:59:52', 0, NULL, NULL, NULL, NULL),
(108, 'PX-260604-003', 'out', 'staff_grant', NULL, NULL, 7, NULL, NULL, NULL, 1, '2026-06-04 10:00:32', 0, NULL, NULL, NULL, NULL),
(109, 'PX-260604-004', 'out', 'staff_issue', 'Cap SP cho KTV qua phieu CAP-0406-002', NULL, 2, NULL, NULL, NULL, 1, '2026-06-04 11:00:54', 0, NULL, NULL, NULL, NULL),
(110, 'PX-260604-005', 'out', 'staff_issue', 'Cap SP cho KTV qua phieu CAP-0406-001', NULL, 2, NULL, NULL, NULL, 1, '2026-06-04 11:00:58', 0, NULL, NULL, NULL, NULL),
(111, 'PX-260604-006', 'out', 'staff_issue', 'Cap SP cho KTV qua phieu CAP-0306-002', NULL, 2, NULL, NULL, NULL, 1, '2026-06-04 11:01:01', 0, NULL, NULL, NULL, NULL),
(112, 'PX-260604-007', 'out', 'staff_issue', 'Cap SP cho KTV qua phieu CAP-0106-001', NULL, 2, NULL, NULL, NULL, 1, '2026-06-04 11:01:03', 0, NULL, NULL, NULL, NULL),
(113, 'PX-260604-008', 'out', 'order_consume', NULL, 144, 2, NULL, NULL, NULL, 2, '2026-06-04 11:04:41', 0, NULL, NULL, NULL, NULL),
(114, 'PX-260604-009', 'out', 'order_consume', NULL, 147, 2, NULL, NULL, NULL, 2, '2026-06-04 13:47:09', 0, NULL, NULL, NULL, NULL),
(115, 'PN-260605-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-05 06:31:36', 0, NULL, NULL, NULL, NULL),
(116, 'PN-260605-002', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-05 06:35:58', 0, NULL, NULL, NULL, NULL),
(117, 'PN-260605-003', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-05 06:36:15', 0, NULL, NULL, NULL, NULL),
(118, 'PN-260605-004', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-05 06:36:28', 0, NULL, NULL, NULL, NULL),
(119, 'PN-260605-005', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-05 06:36:41', 0, NULL, NULL, NULL, NULL),
(120, 'PN-260605-006', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-05 06:37:00', 0, NULL, NULL, NULL, NULL),
(121, 'PN-260605-007', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-05 06:40:31', 0, NULL, NULL, NULL, NULL),
(122, 'PX-260605-001', 'out', 'order_consume', NULL, 142, 2, NULL, NULL, NULL, 2, '2026-06-05 08:25:46', 0, NULL, NULL, NULL, NULL),
(123, 'PX-260605-002', 'out', 'order_consume', NULL, 153, 8, NULL, NULL, NULL, 8, '2026-06-05 13:18:05', 0, NULL, NULL, NULL, NULL),
(124, 'PX-260606-001', 'out', 'order_consume', NULL, 155, 2, NULL, NULL, NULL, 2, '2026-06-06 02:13:57', 0, NULL, NULL, NULL, NULL),
(125, 'PN-260606-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-06 03:09:33', 0, NULL, NULL, NULL, NULL),
(126, 'PN-260606-002', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-06 07:10:24', 0, NULL, NULL, NULL, NULL),
(127, 'PX-260608-001', 'out', 'order_consume', NULL, 161, 8, NULL, NULL, NULL, 8, '2026-06-08 08:12:26', 0, NULL, NULL, NULL, NULL),
(128, 'PX-260609-001', 'out', 'order_consume', NULL, 163, NULL, NULL, NULL, NULL, 1, '2026-06-09 02:42:16', 0, NULL, NULL, NULL, NULL),
(129, 'PX-260609-002', 'out', 'order_consume', NULL, 165, NULL, NULL, NULL, NULL, 6, '2026-06-09 07:17:11', 0, NULL, NULL, NULL, NULL),
(130, 'PX-260609-003', 'out', 'order_consume', NULL, 166, NULL, NULL, NULL, NULL, 6, '2026-06-09 07:18:21', 0, NULL, NULL, NULL, NULL),
(131, 'PX-260609-004', 'out', 'order_consume', NULL, 171, NULL, NULL, NULL, NULL, 6, '2026-06-09 09:22:17', 0, NULL, NULL, NULL, NULL),
(132, 'PX-260609-005', 'out', 'order_consume', NULL, 173, NULL, NULL, NULL, NULL, 3, '2026-06-09 09:59:35', 0, NULL, NULL, NULL, NULL),
(133, 'PX-260610-001', 'out', 'order_consume', NULL, 174, NULL, NULL, NULL, NULL, 6, '2026-06-10 01:47:26', 0, NULL, NULL, NULL, NULL),
(134, 'PX-260610-002', 'out', 'order_consume', NULL, 167, NULL, NULL, NULL, NULL, 3, '2026-06-10 02:08:43', 0, NULL, NULL, NULL, NULL),
(135, 'PX-260610-003', 'out', 'order_consume', NULL, 177, NULL, NULL, NULL, NULL, 3, '2026-06-10 04:37:35', 0, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `stock_receipt_items`
--

CREATE TABLE `stock_receipt_items` (
  `id` int(11) NOT NULL,
  `receipt_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL,
  `unit_price` bigint(20) DEFAULT NULL,
  `imei_list` text DEFAULT NULL,
  `note` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `stock_receipt_items`
--

INSERT INTO `stock_receipt_items` (`id`, `receipt_id`, `product_id`, `qty`, `unit_price`, `imei_list`, `note`) VALUES
(1, 1, 1, 5, NULL, NULL, NULL),
(2, 2, 1, 5, NULL, NULL, NULL),
(3, 3, 1, 5, NULL, NULL, NULL),
(4, 4, 2, 10, NULL, NULL, NULL),
(5, 5, 3, 20, NULL, NULL, NULL),
(6, 6, 3, 5, NULL, '123456789\n000000010\n000000011\n000000012\n000000013', NULL),
(7, 7, 2, 5, NULL, NULL, NULL),
(8, 8, 2, 1, NULL, NULL, NULL),
(9, 8, 3, 2, NULL, NULL, NULL),
(10, 9, 1, 1, NULL, NULL, NULL),
(11, 9, 2, 1, NULL, NULL, NULL),
(12, 9, 3, 2, NULL, NULL, NULL),
(13, 10, 1, 2, NULL, NULL, NULL),
(14, 10, 2, 2, NULL, NULL, NULL),
(15, 10, 3, 2, NULL, NULL, NULL),
(16, 11, 1, 1, NULL, NULL, NULL),
(17, 11, 2, 2, NULL, NULL, NULL),
(18, 11, 3, 1, NULL, NULL, NULL),
(19, 12, 4, 8, NULL, NULL, NULL),
(20, 13, 4, 1, NULL, NULL, NULL),
(21, 14, 2, 100, 450000, NULL, NULL),
(22, 15, 2, 10, NULL, NULL, NULL),
(23, 16, 2, 10, NULL, NULL, NULL),
(24, 17, 2, 1, NULL, NULL, NULL),
(25, 18, 1, 200, NULL, NULL, NULL),
(26, 19, 1, 50, NULL, NULL, NULL),
(27, 19, 2, 10, NULL, NULL, NULL),
(28, 19, 4, 3, NULL, NULL, NULL),
(29, 20, 2, 1, NULL, NULL, NULL),
(30, 20, 4, 1, NULL, NULL, NULL),
(31, 21, 2, 1, NULL, NULL, NULL),
(32, 21, 4, 1, NULL, NULL, NULL),
(33, 22, 4, 1, NULL, NULL, NULL),
(34, 23, 4, 1, NULL, NULL, NULL),
(35, 24, 4, 1, NULL, NULL, NULL),
(36, 25, 4, 8, NULL, NULL, NULL),
(37, 26, 5, 3, NULL, NULL, NULL),
(38, 27, 8, 10, NULL, NULL, NULL),
(39, 28, 7, 100, NULL, NULL, NULL),
(40, 29, 6, 12, NULL, NULL, NULL),
(41, 30, 2, 8, NULL, NULL, NULL),
(42, 30, 8, 3, NULL, NULL, NULL),
(43, 31, 2, 1, NULL, NULL, NULL),
(44, 32, 7, 1, NULL, NULL, NULL),
(45, 33, 8, 1, NULL, NULL, NULL),
(46, 34, 3, 2, NULL, NULL, NULL),
(47, 35, 8, 1, NULL, NULL, NULL),
(48, 36, 9, 6, NULL, NULL, NULL),
(49, 37, 9, 6, NULL, NULL, NULL),
(50, 38, 7, 1, NULL, NULL, NULL),
(51, 38, 8, 1, NULL, NULL, NULL),
(52, 39, 3, 2, NULL, NULL, NULL),
(53, 39, 7, 1, NULL, NULL, NULL),
(54, 40, 2, 10, NULL, NULL, NULL),
(55, 40, 8, 2, NULL, NULL, NULL),
(56, 41, 2, 1, NULL, NULL, NULL),
(57, 41, 8, 1, NULL, NULL, NULL),
(58, 42, 6, 1, NULL, NULL, NULL),
(59, 42, 8, 1, NULL, NULL, NULL),
(60, 43, 4, 1, NULL, NULL, NULL),
(61, 44, 4, 1, NULL, NULL, NULL),
(62, 44, 8, 1, NULL, NULL, NULL),
(63, 45, 5, 2, NULL, NULL, NULL),
(64, 46, 2, 1, NULL, NULL, NULL),
(65, 46, 5, 1, NULL, NULL, NULL),
(66, 47, 2, 1, 100000, NULL, NULL),
(67, 47, 9, 10, 432000, NULL, NULL),
(68, 48, 3, 1, NULL, NULL, NULL),
(69, 49, 8, 1, NULL, NULL, NULL),
(70, 50, 6, 1, NULL, NULL, NULL),
(71, 51, 2, 1, NULL, NULL, NULL),
(72, 52, 2, 1, NULL, NULL, NULL),
(73, 53, 10, 20, NULL, NULL, 'Nhập hàng'),
(74, 54, 5, 20, NULL, NULL, 'Nhập hàng'),
(75, 55, 5, 1, NULL, NULL, NULL),
(76, 56, 2, 1, NULL, NULL, NULL),
(77, 57, 5, 5, NULL, NULL, NULL),
(78, 58, 2, 1, NULL, NULL, 'Gửi bảo hành Gotrack'),
(79, 59, 11, 5, NULL, NULL, NULL),
(80, 60, 5, 9, NULL, NULL, NULL),
(81, 60, 10, 9, NULL, NULL, NULL),
(82, 60, 11, 5, NULL, NULL, NULL),
(83, 61, 5, 9, NULL, NULL, NULL),
(84, 61, 10, 9, NULL, NULL, NULL),
(85, 61, 11, 5, NULL, NULL, NULL),
(86, 62, 2, 5, NULL, NULL, NULL),
(87, 63, 12, 10, NULL, NULL, NULL),
(88, 64, 8, 4, NULL, NULL, NULL),
(89, 65, 13, 20, NULL, NULL, NULL),
(90, 66, 14, 8, NULL, NULL, NULL),
(91, 67, 15, 3, NULL, NULL, NULL),
(92, 68, 16, 5, NULL, NULL, NULL),
(93, 69, 16, 2, NULL, NULL, NULL),
(94, 70, 2, 1, NULL, NULL, NULL),
(95, 70, 16, 1, NULL, NULL, NULL),
(96, 71, 15, 1, NULL, NULL, NULL),
(97, 72, 4, 1, NULL, NULL, NULL),
(98, 72, 10, 1, NULL, NULL, NULL),
(99, 72, 14, 1, NULL, NULL, NULL),
(100, 72, 15, 4, NULL, NULL, NULL),
(101, 73, 17, 100, NULL, NULL, NULL),
(102, 74, 23, 43, NULL, NULL, NULL),
(103, 75, 1, 50, NULL, NULL, NULL),
(104, 76, 2, 30, NULL, NULL, NULL),
(105, 77, 4, 1, NULL, NULL, NULL),
(106, 78, 18, 100, NULL, NULL, NULL),
(107, 79, 15, 5, NULL, NULL, NULL),
(108, 80, 24, 1000, NULL, NULL, NULL),
(109, 81, 17, 1000, NULL, NULL, NULL),
(110, 82, 18, 1000, NULL, NULL, NULL),
(111, 83, 26, 1000, NULL, NULL, NULL),
(112, 84, 25, 1000, NULL, NULL, NULL),
(113, 85, 2, 1, NULL, '860056084077180\n860056084075945\n860056084012617\n860056084078808\n860056084066712\n860056084079772\n860056084092684', NULL),
(114, 86, 20, 100, NULL, NULL, NULL),
(115, 87, 27, 50, NULL, NULL, NULL),
(116, 88, 28, 55, NULL, NULL, NULL),
(117, 89, 2, 1, NULL, NULL, NULL),
(118, 90, 29, 100, NULL, NULL, NULL),
(119, 91, 30, 4, NULL, NULL, NULL),
(120, 92, 31, 20, NULL, NULL, NULL),
(121, 93, 32, 1000, NULL, NULL, NULL),
(122, 94, 5, 1, NULL, NULL, NULL),
(123, 94, 30, 1, NULL, NULL, NULL),
(124, 95, 32, 1, 0, NULL, NULL),
(125, 96, 33, 999, NULL, NULL, NULL),
(126, 97, 4, 1, NULL, NULL, NULL),
(127, 97, 10, 1, NULL, NULL, NULL),
(128, 97, 14, 1, NULL, NULL, NULL),
(129, 97, 15, 4, NULL, NULL, NULL),
(130, 98, 4, 2, NULL, NULL, NULL),
(131, 98, 6, 2, NULL, NULL, NULL),
(132, 98, 10, 2, NULL, NULL, NULL),
(133, 98, 23, 2, NULL, NULL, NULL),
(134, 99, 4, 1, NULL, NULL, NULL),
(135, 99, 6, 1, NULL, NULL, NULL),
(136, 99, 10, 1, NULL, NULL, NULL),
(137, 99, 23, 1, NULL, NULL, NULL),
(138, 100, 14, 20, NULL, NULL, NULL),
(139, 101, 28, 46, NULL, NULL, NULL),
(140, 102, 4, 5, NULL, NULL, NULL),
(141, 103, 5, 1, NULL, NULL, NULL),
(142, 104, 34, 249, NULL, NULL, NULL),
(143, 105, 30, 20, NULL, NULL, NULL),
(144, 106, 2, 1, NULL, NULL, NULL),
(145, 107, 33, 1, NULL, NULL, NULL),
(146, 108, 33, 4, NULL, NULL, NULL),
(147, 109, 5, 2, NULL, '862051082907692\n862051082907478', NULL),
(148, 109, 6, 2, NULL, NULL, NULL),
(149, 109, 10, 2, NULL, NULL, NULL),
(150, 109, 28, 10, NULL, '860056083567306\n860056083533233\n860056083568049\n860056083567645\n860056083538356\n860056083568403\n860056083524018\n860056083566894\n860056083567710\n860056083567728', NULL),
(151, 109, 31, 2, NULL, NULL, NULL),
(152, 110, 5, 2, NULL, '862051082907825\n862051082905977', NULL),
(153, 110, 6, 2, NULL, NULL, NULL),
(154, 110, 10, 2, NULL, NULL, NULL),
(155, 110, 31, 2, NULL, NULL, NULL),
(156, 111, 28, 4, NULL, NULL, NULL),
(157, 112, 5, 1, NULL, '862051082925843', NULL),
(158, 112, 9, 1, NULL, NULL, NULL),
(159, 113, 5, 2, NULL, NULL, NULL),
(160, 113, 6, 2, NULL, NULL, NULL),
(161, 113, 10, 2, NULL, NULL, NULL),
(162, 114, 28, 1, NULL, NULL, NULL),
(163, 115, 36, 2, NULL, NULL, NULL),
(164, 116, 17, 127, NULL, NULL, NULL),
(165, 117, 22, 27, NULL, NULL, NULL),
(166, 118, 25, 45, NULL, NULL, NULL),
(167, 119, 19, 26, NULL, NULL, NULL),
(168, 120, 35, 11, NULL, NULL, NULL),
(169, 121, 37, 33, NULL, NULL, NULL),
(170, 122, 5, 2, NULL, NULL, NULL),
(171, 122, 6, 2, NULL, NULL, NULL),
(172, 122, 10, 2, NULL, NULL, NULL),
(173, 122, 28, 6, NULL, NULL, NULL),
(174, 123, 2, 1, NULL, NULL, NULL),
(175, 124, 2, 1, NULL, NULL, NULL),
(176, 125, 38, 100, NULL, NULL, NULL),
(177, 126, 39, 500, NULL, NULL, NULL),
(178, 127, 24, 1, NULL, NULL, NULL),
(179, 128, 23, 1, NULL, NULL, NULL),
(180, 129, 20, 2, NULL, NULL, NULL),
(181, 130, 18, 1, NULL, NULL, NULL),
(182, 131, 18, 1, NULL, NULL, NULL),
(183, 132, 17, 16, NULL, NULL, NULL),
(184, 132, 18, 1, NULL, NULL, NULL),
(185, 133, 18, 1, NULL, NULL, NULL),
(186, 134, 18, 1, NULL, NULL, NULL),
(187, 135, 18, 1, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `stock_return_requests`
--

CREATE TABLE `stock_return_requests` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL,
  `note` varchar(300) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `reviewed_by_staff_id` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `reject_reason` varchar(300) DEFAULT NULL,
  `receipt_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `stock_return_requests`
--

INSERT INTO `stock_return_requests` (`id`, `staff_id`, `product_id`, `qty`, `note`, `status`, `created_at`, `reviewed_by_staff_id`, `reviewed_at`, `reject_reason`, `receipt_id`) VALUES
(1, 4, 2, 30, NULL, 'approved', '2026-05-26 22:15:51', 1, '2026-05-26 22:16:47', NULL, 76),
(2, 4, 1, 50, NULL, 'approved', '2026-05-26 22:15:57', 1, '2026-05-26 22:16:46', NULL, 75),
(3, 4, 4, 1, NULL, 'approved', '2026-05-26 22:16:03', 1, '2026-05-26 22:16:48', NULL, 77);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `stock_takes`
--

CREATE TABLE `stock_takes` (
  `id` int(11) NOT NULL,
  `code` varchar(20) NOT NULL,
  `status` enum('draft','finished','cancelled') NOT NULL DEFAULT 'draft',
  `started_at` datetime NOT NULL DEFAULT current_timestamp(),
  `finished_at` datetime DEFAULT NULL,
  `by_staff_id` int(11) NOT NULL,
  `finished_by_staff_id` int(11) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `total_lines` int(11) NOT NULL DEFAULT 0,
  `total_variance_abs` int(11) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `stock_takes`
--

INSERT INTO `stock_takes` (`id`, `code`, `status`, `started_at`, `finished_at`, `by_staff_id`, `finished_by_staff_id`, `note`, `total_lines`, `total_variance_abs`, `is_deleted`) VALUES
(1, 'KK-260523-001', 'draft', '2026-05-23 03:04:45', NULL, 6, NULL, NULL, 0, 0, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `stock_take_lines`
--

CREATE TABLE `stock_take_lines` (
  `id` int(11) NOT NULL,
  `stock_take_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `system_qty` int(11) NOT NULL,
  `counted_qty` int(11) NOT NULL,
  `receipt_id` int(11) DEFAULT NULL,
  `note` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `suppliers`
--

CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `suppliers`
--

INSERT INTO `suppliers` (`id`, `name`, `phone`, `address`, `note`, `is_deleted`) VALUES
(1, 'Công Ty VINAGPS', NULL, NULL, NULL, 0),
(2, 'nhà cung cấp A )test', NULL, NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `supplier_warranty_batches`
--

CREATE TABLE `supplier_warranty_batches` (
  `id` int(11) NOT NULL,
  `code` varchar(40) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `status` enum('draft','sent','received','cancelled') NOT NULL DEFAULT 'draft',
  `note_text` text DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `received_at` datetime DEFAULT NULL,
  `created_by_staff_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `supplier_warranty_batch_items`
--

CREATE TABLE `supplier_warranty_batch_items` (
  `id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `warranty_item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `qty` int(11) NOT NULL DEFAULT 1,
  `note_text` text DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `warehouse_logs`
--

CREATE TABLE `warehouse_logs` (
  `id` int(11) NOT NULL,
  `stock_item_id` int(11) NOT NULL,
  `kind` enum('in','out','damaged','returned') NOT NULL,
  `reason` varchar(500) DEFAULT NULL,
  `order_id` int(11) DEFAULT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `warranty_orders`
--

CREATE TABLE `warranty_orders` (
  `id` int(11) NOT NULL,
  `code` varchar(30) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `warranty_type` enum('exchange','send_manufacturer') NOT NULL DEFAULT 'send_manufacturer',
  `license_plate` varchar(30) DEFAULT NULL,
  `device_name` varchar(100) DEFAULT NULL,
  `imei_search` varchar(100) DEFAULT NULL,
  `reason_text` text NOT NULL,
  `note_text` text DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `assigned_staff_id` int(11) DEFAULT NULL,
  `recovered_image_url` varchar(500) DEFAULT NULL,
  `delivered_image_url` varchar(500) DEFAULT NULL,
  `warranty_partner` varchar(200) DEFAULT NULL,
  `sent_at` date DEFAULT NULL,
  `returned_at` date DEFAULT NULL,
  `cost_amount` bigint(20) NOT NULL DEFAULT 0,
  `wage_amount` bigint(20) NOT NULL DEFAULT 0,
  `paid_amount` bigint(20) NOT NULL DEFAULT 0,
  `debt_carried_at` datetime DEFAULT NULL,
  `payslip_id` int(11) DEFAULT NULL,
  `status` enum('pending','received','recovered','awaiting_warranty','warranty_done','delivering','completed','cancelled') NOT NULL DEFAULT 'pending',
  `request_date` date NOT NULL,
  `creator_type` enum('customer','dealer','admin','staff') NOT NULL DEFAULT 'admin',
  `creator_id` int(11) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `warranty_orders`
--

INSERT INTO `warranty_orders` (`id`, `code`, `customer_id`, `warranty_type`, `license_plate`, `device_name`, `imei_search`, `reason_text`, `note_text`, `address`, `assigned_staff_id`, `recovered_image_url`, `delivered_image_url`, `warranty_partner`, `sent_at`, `returned_at`, `cost_amount`, `wage_amount`, `paid_amount`, `debt_carried_at`, `payslip_id`, `status`, `request_date`, `creator_type`, `creator_id`, `is_deleted`) VALUES
(1, 'BH-2705-001', 41, 'send_manufacturer', NULL, 'Cảm biến mức dầu Model: LIGOBLE-PRO-RS232L7', NULL, 'Thiet bi khong len nguon', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, NULL, NULL, 'pending', '2026-05-27', 'admin', 1, 0),
(2, 'BH-2705-002', 41, 'send_manufacturer', NULL, 'Cảm biến mức dầu Model: LIGOBLE-PRO-RS232L7', NULL, 'Kiem tra cam bien dau hoat dong khong on dinh', 'Ghi chu kiem tra bao hanh', NULL, 8, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, NULL, NULL, 'received', '2026-05-27', 'admin', 1, 0),
(3, 'BH-0106-001', 41, 'exchange', NULL, 'GT-688B Không hồng ngoại, kèm cáp 3,3M', NULL, 'Mat tin hieu GPS', NULL, NULL, NULL, 'http://test.image', NULL, NULL, NULL, NULL, 0, 0, 0, NULL, NULL, 'completed', '2026-06-01', 'admin', 1, 0),
(4, 'BH-0106-002', 73, 'send_manufacturer', NULL, 'Cảm biến mức dầu Model: LIGOBLE-PRO-RS232L7', NULL, 'Hong', NULL, NULL, NULL, 'http://test.image', NULL, NULL, NULL, NULL, 0, 0, 0, NULL, NULL, 'completed', '2026-06-01', 'admin', 1, 0),
(5, 'BH-0106-003', 73, 'send_manufacturer', NULL, 'Cảm biến mức dầu Model: LIGOBLE-PRO-RS232L7', NULL, 'Hong', NULL, NULL, NULL, 'http://test.image', NULL, NULL, NULL, NULL, 0, 0, 0, NULL, NULL, 'completed', '2026-06-01', 'admin', 1, 0),
(6, 'BH-0106-004', 35, 'send_manufacturer', NULL, 'Thẻ nhớ Dahua 64GB cho Camera', NULL, 'lỗi', 'Ghi chu kiem tra bao hanh', NULL, 1, 'http://test.image', NULL, NULL, NULL, NULL, 0, 0, 0, NULL, NULL, 'cancelled', '2026-06-01', 'admin', 1, 0),
(7, 'BH-0106-005', 73, 'send_manufacturer', NULL, 'Thẻ nhớ Dahua 64GB cho Camera', NULL, '0', NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, NULL, NULL, 'pending', '2026-06-01', 'admin', 1, 0),
(8, 'BH-0106-006', 73, 'send_manufacturer', NULL, 'Cảm biến mức dầu Model: LIGOBLE-PRO-RS232L7', NULL, 'áđá', NULL, NULL, 7, NULL, NULL, 'Google Manufacturer', NULL, NULL, 100000, 0, 0, NULL, NULL, 'awaiting_warranty', '2026-06-01', 'admin', 1, 0),
(9, 'BH-0206-001', 78, 'exchange', NULL, 'Phí dịch vụ định vị GPS ( ô tô)', NULL, 'Test bao hanh doi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, NULL, NULL, 'recovered', '2026-06-02', 'admin', 1, 0),
(10, 'BH-0206-002', 78, 'exchange', NULL, 'Phí dịch vụ định vị GPS ( ô tô)', NULL, 'Test bao hanh doi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 10000, 0, 0, NULL, NULL, 'cancelled', '2026-06-02', 'admin', 1, 0),
(11, 'BH-0206-003', 78, 'send_manufacturer', NULL, 'Sản phẩm thử nghiệm', NULL, 'ád', NULL, NULL, 7, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, NULL, NULL, 'pending', '2026-06-02', 'admin', 1, 0),
(12, 'BH-0206-004', 80, 'send_manufacturer', NULL, 'Sản phẩm thử nghiệm', NULL, 'a', NULL, '99 Test Street, Q1, HCM', 7, NULL, NULL, NULL, NULL, NULL, 110000, 0, 0, NULL, NULL, 'completed', '2026-06-02', 'admin', 1, 0),
(13, 'BH-0206-005', 80, 'send_manufacturer', NULL, 'Sản phẩm thử nghiệm', NULL, 'sadhnklnsadj;lsad;l', NULL, '99 Test Street, Q1, HCM', 7, NULL, NULL, NULL, NULL, NULL, 60000, 0, 0, NULL, NULL, 'awaiting_warranty', '2026-06-02', 'admin', 1, 0),
(14, 'BH-0206-006', 78, 'send_manufacturer', NULL, 'Sản phẩm thử nghiệm', NULL, 'Loi GPS', NULL, NULL, 8, NULL, NULL, NULL, NULL, NULL, 0, 150000, 0, NULL, NULL, 'completed', '2026-06-02', 'admin', 1, 0),
(15, 'BH-0206-007', 80, 'send_manufacturer', NULL, 'Sản phẩm thử nghiệm', NULL, 'ưqd', NULL, NULL, 7, NULL, NULL, NULL, NULL, NULL, 20000, 200000, 0, NULL, NULL, 'pending', '2026-06-02', 'admin', 1, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `warranty_order_charges`
--

CREATE TABLE `warranty_order_charges` (
  `id` int(11) NOT NULL,
  `warranty_order_id` int(11) NOT NULL,
  `kind` enum('fee','discount','shipping') NOT NULL DEFAULT 'fee',
  `label` varchar(150) NOT NULL,
  `amount` bigint(20) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `warranty_order_charges`
--

INSERT INTO `warranty_order_charges` (`id`, `warranty_order_id`, `kind`, `label`, `amount`, `is_deleted`) VALUES
(1, 8, 'fee', 'phí1', 100000, 0),
(2, 10, 'shipping', 'chi phí 1 ', 10000, 0),
(3, 11, 'fee', 'chi phí khác', 0, 0),
(4, 12, 'fee', 'chi phí 1', 10000, 0),
(5, 12, 'fee', 'chi phí 2', 100000, 0),
(6, 13, 'fee', 'chi phí khác', 60000, 0),
(7, 15, 'fee', 'Chi phí bảo hành', 20000, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `warranty_order_items`
--

CREATE TABLE `warranty_order_items` (
  `id` int(11) NOT NULL,
  `warranty_order_id` int(11) NOT NULL,
  `kind` enum('received_from_customer','sent_to_partner','received_back','delivered_to_customer','replacement') NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `imei` varchar(50) DEFAULT NULL,
  `qty` int(11) NOT NULL DEFAULT 1,
  `unit_price` bigint(20) NOT NULL DEFAULT 0,
  `note` varchar(255) DEFAULT NULL,
  `released_at` datetime DEFAULT NULL,
  `release_receipt_id` int(11) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `warranty_order_items`
--

INSERT INTO `warranty_order_items` (`id`, `warranty_order_id`, `kind`, `product_id`, `name`, `imei`, `qty`, `unit_price`, `note`, `released_at`, `release_receipt_id`, `is_deleted`) VALUES
(1, 2, 'received_from_customer', NULL, 'L7', '123456789012345', 1, 0, NULL, NULL, NULL, 0),
(2, 2, 'replacement', NULL, 'L7', '987654321098765', 1, 0, NULL, NULL, NULL, 0),
(3, 3, 'received_from_customer', 30, 'GT-688B Không hồng ngoại, kèm cáp 3,3M', NULL, 1, 650000, '[{\"label\":\"Biển số xe\",\"value\":\"\"},{\"label\":\"IMEI\",\"value\":\"\"},{\"label\":\"Tên tài khoản\",\"value\":\"\"},{\"label\":\"Số SIM\",\"value\":\"\"}]', NULL, NULL, 0),
(4, 3, 'replacement', 30, 'GT-688B Không hồng ngoại, kèm cáp 3,3M', NULL, 1, 650000, '[{\"label\":\"Biển số xe\",\"value\":\"\"},{\"label\":\"IMEI\",\"value\":\"\"},{\"label\":\"Tên tài khoản\",\"value\":\"\"},{\"label\":\"Số SIM\",\"value\":\"\"}]', NULL, NULL, 0),
(5, 4, 'received_from_customer', 23, 'Cảm biến mức dầu Model: LIGOBLE-PRO-RS232L7', NULL, 1, 0, '[{\"label\":\"Biển số xe\",\"value\":\"\"},{\"label\":\"IMEI\",\"value\":\"\"},{\"label\":\"Tên tài khoản\",\"value\":\"\"},{\"label\":\"Số SIM\",\"value\":\"\"}]', NULL, NULL, 0),
(6, 5, 'received_from_customer', 23, 'Cảm biến mức dầu Model: LIGOBLE-PRO-RS232L7', NULL, 1, 0, '[{\"label\":\"Biển số xe\",\"value\":\"\"},{\"label\":\"IMEI\",\"value\":\"\"},{\"label\":\"Tên tài khoản\",\"value\":\"\"},{\"label\":\"Số SIM\",\"value\":\"\"}]', NULL, NULL, 0),
(7, 6, 'received_from_customer', 28, 'Thiết bị giám sát hành trình G400LV', NULL, 1, 0, '[{\"label\":\"Biển số xe\",\"value\":\"\"},{\"label\":\"IMEI\",\"value\":\"\"},{\"label\":\"Tên tài khoản\",\"value\":\"\"},{\"label\":\"Số SIM\",\"value\":\"\"}]', NULL, NULL, 0),
(8, 6, 'replacement', 27, 'Sim Mobi 30IP', NULL, 1, 600000, '[{\"label\":\"Biển số xe\",\"value\":\"\"},{\"label\":\"IMEI\",\"value\":\"\"},{\"label\":\"Tên tài khoản\",\"value\":\"\"},{\"label\":\"Số SIM\",\"value\":\"\"}]', NULL, NULL, 0),
(9, 7, 'received_from_customer', 31, 'Thẻ nhớ Dahua 64GB cho Camera', NULL, 1, 350000, '[{\"label\":\"Biển số xe\",\"value\":\"\"},{\"label\":\"IMEI\",\"value\":\"\"},{\"label\":\"Tên tài khoản\",\"value\":\"\"},{\"label\":\"Số SIM\",\"value\":\"\"}]', NULL, NULL, 0),
(10, 8, 'received_from_customer', 23, 'Cảm biến mức dầu Model: LIGOBLE-PRO-RS232L7', NULL, 1, 0, '[{\"label\":\"Biển số xe\",\"value\":\"\"},{\"label\":\"IMEI\",\"value\":\"\"},{\"label\":\"Tên tài khoản\",\"value\":\"\"},{\"label\":\"Số SIM\",\"value\":\"\"}]', NULL, NULL, 0),
(11, 9, 'received_from_customer', 32, 'Phí dịch vụ định vị GPS ( ô tô)', NULL, 1, 0, '[{\"label\":\"Biển số xe\",\"value\":\"\"},{\"label\":\"IMEI\",\"value\":\"\"},{\"label\":\"Tên tài khoản\",\"value\":\"\"},{\"label\":\"Số SIM\",\"value\":\"\"}]', NULL, NULL, 0),
(12, 9, 'replacement', 32, 'Phí dịch vụ định vị GPS ( ô tô)', NULL, 1, 0, '[{\"label\":\"Biển số xe\",\"value\":\"\"},{\"label\":\"IMEI\",\"value\":\"\"},{\"label\":\"Tên tài khoản\",\"value\":\"\"},{\"label\":\"Số SIM\",\"value\":\"\"}]', NULL, NULL, 0),
(13, 10, 'received_from_customer', 32, 'Phí dịch vụ định vị GPS ( ô tô)', NULL, 1, 0, '[{\"label\":\"Biển số xe\",\"value\":\"\"},{\"label\":\"IMEI\",\"value\":\"\"},{\"label\":\"Tên tài khoản\",\"value\":\"\"},{\"label\":\"Số SIM\",\"value\":\"\"}]', NULL, NULL, 0),
(14, 10, 'replacement', 32, 'Phí dịch vụ định vị GPS ( ô tô)', NULL, 1, 0, '[{\"label\":\"Biển số xe\",\"value\":\"\"},{\"label\":\"IMEI\",\"value\":\"\"},{\"label\":\"Tên tài khoản\",\"value\":\"\"},{\"label\":\"Số SIM\",\"value\":\"\"}]', '2026-06-02 10:55:33', 95, 0),
(15, 11, 'received_from_customer', 33, 'Sản phẩm thử nghiệm', NULL, 1, 0, '[{\"label\":\"Biển số xe\",\"value\":\"\"},{\"label\":\"IMEI\",\"value\":\"\"},{\"label\":\"Tên tài khoản\",\"value\":\"\"},{\"label\":\"Số SIM\",\"value\":\"\"}]', NULL, NULL, 0),
(16, 12, 'received_from_customer', 33, 'Sản phẩm thử nghiệm', NULL, 1, 0, '[{\"label\":\"Biển số xe\",\"value\":\"\"},{\"label\":\"IMEI\",\"value\":\"\"},{\"label\":\"Tên tài khoản\",\"value\":\"\"},{\"label\":\"Số SIM\",\"value\":\"\"}]', NULL, NULL, 0),
(17, 13, 'received_from_customer', 33, 'Sản phẩm thử nghiệm', NULL, 1, 0, '[{\"label\":\"Biển số xe\",\"value\":\"\"},{\"label\":\"IMEI\",\"value\":\"\"},{\"label\":\"Tên tài khoản\",\"value\":\"\"},{\"label\":\"Số SIM\",\"value\":\"\"}]', NULL, NULL, 0),
(18, 14, 'received_from_customer', 33, 'Sản phẩm thử nghiệm', NULL, 1, 0, '[]', NULL, NULL, 0),
(19, 15, 'received_from_customer', 33, 'Sản phẩm thử nghiệm', NULL, 1, 0, '[{\"label\":\"Biển số xe\",\"value\":\"\"},{\"label\":\"IMEI\",\"value\":\"\"},{\"label\":\"Tên tài khoản\",\"value\":\"\"},{\"label\":\"Số SIM\",\"value\":\"\"}]', NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `warranty_order_photos`
--

CREATE TABLE `warranty_order_photos` (
  `id` int(11) NOT NULL,
  `warranty_order_id` int(11) NOT NULL,
  `url` varchar(500) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `agency_collections`
--
ALTER TABLE `agency_collections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `fk_agcol_retail` (`retail_customer_id`),
  ADD KEY `fk_agcol_settle` (`debt_settlement_id`),
  ADD KEY `idx_agcol_dealer` (`dealer_id`,`debt_settlement_id`,`is_deleted`),
  ADD KEY `idx_agcol_staff` (`staff_id`,`handed_over`,`is_deleted`),
  ADD KEY `idx_agcol_collected_at` (`collected_at`);

--
-- Chỉ mục cho bảng `app_settings`
--
ALTER TABLE `app_settings`
  ADD PRIMARY KEY (`key`);

--
-- Chỉ mục cho bảng `badge_order_attachments`
--
ALTER TABLE `badge_order_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_battach_border` (`badge_order_id`,`is_deleted`),
  ADD KEY `idx_battach_kind` (`kind`);

--
-- Chỉ mục cho bảng `badge_order_charges`
--
ALTER TABLE `badge_order_charges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_bcharge_order` (`badge_order_id`,`is_deleted`);

--
-- Chỉ mục cho bảng `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `collections`
--
ALTER TABLE `collections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_coll_staff` (`staff_id`),
  ADD KEY `idx_coll_remit` (`remitted`),
  ADD KEY `idx_coll_deleted` (`is_deleted`),
  ADD KEY `fk_coll_remit` (`remittance_id`),
  ADD KEY `idx_coll_order` (`order_id`),
  ADD KEY `idx_coll_warranty` (`ref_warranty_order_id`);

--
-- Chỉ mục cho bảng `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `customer_id` (`customer_id`),
  ADD KEY `idx_conv_deleted` (`is_deleted`),
  ADD KEY `idx_conv_last_msg` (`last_message_at`);

--
-- Chỉ mục cho bảng `conversation_members`
--
ALTER TABLE `conversation_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_conv_staff` (`conversation_id`,`staff_id`),
  ADD KEY `fk_cm_added_by` (`added_by`),
  ADD KEY `idx_cm_staff_active` (`staff_id`,`removed_at`);

--
-- Chỉ mục cho bảng `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_customers_type` (`type`),
  ADD KEY `idx_customers_deleted` (`is_deleted`),
  ADD KEY `idx_customers_phone` (`phone`),
  ADD KEY `idx_customers_name` (`full_name`),
  ADD KEY `idx_customers_seen` (`seen_at`),
  ADD KEY `fk_cust_tier` (`default_tier_id`),
  ADD KEY `idx_customers_parent` (`parent_id`);

--
-- Chỉ mục cho bảng `customer_accounts`
--
ALTER TABLE `customer_accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ca_customer` (`customer_id`,`is_deleted`);

--
-- Chỉ mục cho bảng `customer_old_debts`
--
ALTER TABLE `customer_old_debts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Chỉ mục cho bảng `customer_product_prices`
--
ALTER TABLE `customer_product_prices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_cust_prod` (`customer_id`,`product_id`),
  ADD KEY `fk_cpp_product` (`product_id`);

--
-- Chỉ mục cho bảng `customer_sims`
--
ALTER TABLE `customer_sims`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cs_customer` (`customer_id`,`is_deleted`);

--
-- Chỉ mục cho bảng `customer_update_requests`
--
ALTER TABLE `customer_update_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_cur_order` (`ref_order_id`),
  ADD KEY `idx_cur_customer` (`customer_id`),
  ADD KEY `idx_cur_status` (`status`,`is_deleted`),
  ADD KEY `idx_cur_kind` (`asset_kind`,`status`);

--
-- Chỉ mục cho bảng `customer_vehicles`
--
ALTER TABLE `customer_vehicles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cv_customer` (`customer_id`,`is_deleted`);

--
-- Chỉ mục cho bảng `debt_settlements`
--
ALTER TABLE `debt_settlements`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_settlement_customer` (`customer_id`,`is_deleted`),
  ADD KEY `idx_settlement_paid_at` (`paid_at`);

--
-- Chỉ mục cho bảng `inquiries`
--
ALTER TABLE `inquiries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `fk_inquiry_contacted_by` (`contacted_by_staff_id`),
  ADD KEY `fk_inquiry_customer` (`converted_customer_id`),
  ADD KEY `fk_inquiry_order` (`converted_order_id`),
  ADD KEY `idx_inquiry_status` (`status`),
  ADD KEY `idx_inquiry_phone` (`phone`),
  ADD KEY `idx_inquiry_created` (`created_at`),
  ADD KEY `idx_inquiry_deleted` (`is_deleted`),
  ADD KEY `idx_inquiries_seen` (`seen_at`);

--
-- Chỉ mục cho bảng `inquiry_items`
--
ALTER TABLE `inquiry_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_iitem_product` (`product_id`),
  ADD KEY `idx_iitem_inquiry` (`inquiry_id`);

--
-- Chỉ mục cho bảng `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_msg_conv` (`conversation_id`,`sent_at`),
  ADD KEY `idx_msg_order` (`order_id`);

--
-- Chỉ mục cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notif_unread` (`is_deleted`,`is_read`,`id`),
  ADD KEY `idx_notif_created` (`created_at`),
  ADD KEY `idx_notif_ref_order` (`ref_order_id`),
  ADD KEY `fk_notif_customer` (`ref_customer_id`),
  ADD KEY `fk_notif_staff` (`ref_staff_id`);

--
-- Chỉ mục cho bảng `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_orders_customer` (`customer_id`),
  ADD KEY `idx_orders_dealer` (`dealer_id`),
  ADD KEY `idx_orders_deleted` (`is_deleted`),
  ADD KEY `idx_orders_creator` (`creator_type`,`creator_id`),
  ADD KEY `idx_orders_seen` (`seen_at`),
  ADD KEY `idx_orders_has_return` (`has_return`),
  ADD KEY `idx_orders_debt_carried` (`customer_id`,`debt_carried_at`),
  ADD KEY `idx_orders_created` (`created_at`),
  ADD KEY `idx_orders_assigned_staff` (`assigned_staff_id`),
  ADD KEY `idx_orders_completed_at` (`completed_at`),
  ADD KEY `idx_orders_status` (`status`),
  ADD KEY `idx_orders_payment_status` (`payment_status`),
  ADD KEY `idx_orders_collected_for_dealer` (`collected_for_dealer`),
  ADD KEY `idx_orders_end_customer` (`end_customer_id`),
  ADD KEY `idx_order_payslip` (`payslip_id`),
  ADD KEY `idx_orders_service_kind` (`service_kind`);

--
-- Chỉ mục cho bảng `order_attachments`
--
ALTER TABLE `order_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_att_order` (`order_id`),
  ADD KEY `idx_order_att_stage` (`order_id`,`stage`);

--
-- Chỉ mục cho bảng `order_charges`
--
ALTER TABLE `order_charges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_charge_order` (`order_id`,`is_deleted`),
  ADD KEY `idx_charge_line` (`line_id`);

--
-- Chỉ mục cho bảng `order_checklist`
--
ALTER TABLE `order_checklist`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_checklist_order` (`order_id`);

--
-- Chỉ mục cho bảng `order_field_values`
--
ALTER TABLE `order_field_values`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ofv_field` (`template_field_id`),
  ADD KEY `idx_ofv_order` (`order_id`,`is_deleted`),
  ADD KEY `idx_ofv_line` (`line_id`),
  ADD KEY `idx_ofv_item` (`item_id`);

--
-- Chỉ mục cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_oi_order` (`order_id`),
  ADD KEY `idx_oi_product` (`product_id`),
  ADD KEY `idx_oi_line` (`line_id`);

--
-- Chỉ mục cho bảng `order_lines`
--
ALTER TABLE `order_lines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_oline_order` (`order_id`,`is_deleted`),
  ADD KEY `idx_oline_template` (`template_id`);

--
-- Chỉ mục cho bảng `order_payments`
--
ALTER TABLE `order_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_payment_collection` (`collection_id`),
  ADD KEY `idx_payment_order` (`order_id`),
  ADD KEY `idx_payment_paid_at` (`paid_at`),
  ADD KEY `idx_payment_source` (`source`),
  ADD KEY `idx_payment_active` (`is_deleted`,`paid_at`),
  ADD KEY `idx_payment_pending` (`order_id`,`source`,`confirmed`),
  ADD KEY `idx_payment_task` (`task_id`);

--
-- Chỉ mục cho bảng `order_staff_commissions`
--
ALTER TABLE `order_staff_commissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_osc_order` (`order_id`),
  ADD KEY `idx_osc_staff` (`staff_id`),
  ADD KEY `idx_osc_carried` (`carried_at`),
  ADD KEY `idx_osc_payslip` (`payslip_id`);

--
-- Chỉ mục cho bảng `order_step_photos`
--
ALTER TABLE `order_step_photos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ostepphoto_order` (`order_id`,`step_code`,`is_deleted`);

--
-- Chỉ mục cho bảng `order_templates`
--
ALTER TABLE `order_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_template_public` (`is_public`,`is_deleted`),
  ADD KEY `idx_template_deleted` (`is_deleted`);

--
-- Chỉ mục cho bảng `order_template_fields`
--
ALTER TABLE `order_template_fields`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_otfield_template` (`template_id`,`seq`);

--
-- Chỉ mục cho bảng `order_warranty_items`
--
ALTER TABLE `order_warranty_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_owi_product` (`product_id`),
  ADD KEY `fk_owi_supplier` (`supplier_id`),
  ADD KEY `fk_owi_source_staff` (`source_staff_id`),
  ADD KEY `fk_owi_holder_staff` (`holder_staff_id`),
  ADD KEY `fk_owi_last_supplier` (`last_supplier_id`),
  ADD KEY `fk_owi_release_receipt` (`release_receipt_id`),
  ADD KEY `idx_owi_order` (`order_id`,`is_deleted`),
  ADD KEY `idx_owi_role` (`order_id`,`item_role`,`is_deleted`);

--
-- Chỉ mục cho bảng `order_warranty_meta`
--
ALTER TABLE `order_warranty_meta`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `fk_owm_supplier` (`default_supplier_id`);

--
-- Chỉ mục cho bảng `order_warranty_moves`
--
ALTER TABLE `order_warranty_moves`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_owmv_product` (`product_id`),
  ADD KEY `fk_owmv_supplier` (`supplier_id`),
  ADD KEY `fk_owmv_holder_staff` (`holder_staff_id`),
  ADD KEY `fk_owmv_receipt` (`receipt_id`),
  ADD KEY `fk_owmv_created_by` (`created_by_staff_id`),
  ADD KEY `idx_owmv_order` (`order_id`,`occurred_at`,`id`),
  ADD KEY `idx_owmv_item` (`warranty_item_id`,`occurred_at`,`id`);

--
-- Chỉ mục cho bảng `order_workflow_steps`
--
ALTER TABLE `order_workflow_steps`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_wfstep_seq` (`seq`,`is_deleted`);

--
-- Chỉ mục cho bảng `payment_receipts`
--
ALTER TABLE `payment_receipts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_receipt_request` (`request_id`,`is_deleted`);

--
-- Chỉ mục cho bảng `payment_requests`
--
ALTER TABLE `payment_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_pr_customer` (`customer_id`,`is_deleted`),
  ADD KEY `idx_pr_status` (`status`);

--
-- Chỉ mục cho bảng `payment_request_items`
--
ALTER TABLE `payment_request_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_pri_request` (`request_id`);

--
-- Chỉ mục cho bảng `price_tiers`
--
ALTER TABLE `price_tiers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_tier_code` (`code`),
  ADD UNIQUE KEY `uniq_default_tier` (`default_marker`);

--
-- Chỉ mục cho bảng `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_products_category` (`category_id`),
  ADD KEY `idx_products_deleted` (`is_deleted`);

--
-- Chỉ mục cho bảng `product_attributes`
--
ALTER TABLE `product_attributes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_attrs_product` (`product_id`);

--
-- Chỉ mục cho bảng `product_blocks`
--
ALTER TABLE `product_blocks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_block_product` (`product_id`),
  ADD KEY `idx_block_sort` (`product_id`,`sort_order`);

--
-- Chỉ mục cho bảng `product_prices`
--
ALTER TABLE `product_prices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_product_tier` (`product_id`,`tier_id`),
  ADD KEY `idx_prices_product` (`product_id`),
  ADD KEY `fk_prices_tier` (`tier_id`);

--
-- Chỉ mục cho bảng `product_stock`
--
ALTER TABLE `product_stock`
  ADD PRIMARY KEY (`product_id`);

--
-- Chỉ mục cho bảng `release_pool`
--
ALTER TABLE `release_pool`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_release_pool_order_product` (`order_id`,`product_id`),
  ADD KEY `fk_release_pool_receipt` (`receipt_id`),
  ADD KEY `idx_release_pool_staff` (`staff_id`),
  ADD KEY `idx_release_pool_product` (`product_id`),
  ADD KEY `idx_release_pool_order` (`order_id`);

--
-- Chỉ mục cho bảng `remittances`
--
ALTER TABLE `remittances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_remit_approver` (`approved_by`),
  ADD KEY `idx_remit_staff` (`staff_id`),
  ADD KEY `idx_remit_status` (`status`),
  ADD KEY `idx_remit_deleted` (`is_deleted`);

--
-- Chỉ mục cho bảng `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_staff_role` (`role`),
  ADD KEY `idx_staff_area` (`area`);

--
-- Chỉ mục cho bảng `staff_advances`
--
ALTER TABLE `staff_advances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_sa_created_by` (`created_by`),
  ADD KEY `idx_sa_staff_period` (`staff_id`,`period`),
  ADD KEY `idx_sa_carried` (`carried_at`),
  ADD KEY `idx_sa_status` (`status`),
  ADD KEY `fk_sa_approved_by` (`approved_by`);

--
-- Chỉ mục cho bảng `staff_holdings`
--
ALTER TABLE `staff_holdings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_staff_holdings_staff_product` (`staff_id`,`product_id`),
  ADD KEY `idx_staff_holdings_staff` (`staff_id`),
  ADD KEY `idx_staff_holdings_product` (`product_id`);

--
-- Chỉ mục cho bảng `staff_payroll_adjustments`
--
ALTER TABLE `staff_payroll_adjustments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_staff` (`staff_id`,`is_deleted`);

--
-- Chỉ mục cho bảng `staff_payroll_periods`
--
ALTER TABLE `staff_payroll_periods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_spp_finalizer` (`finalized_by`),
  ADD KEY `idx_spp_staff_period` (`staff_id`,`period`),
  ADD KEY `idx_spp_period` (`period`),
  ADD KEY `idx_spp_staff_dates` (`staff_id`,`from_date`,`to_date`,`is_deleted`);

--
-- Chỉ mục cho bảng `staff_payslips`
--
ALTER TABLE `staff_payslips`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_staff` (`staff_id`),
  ADD KEY `idx_dates` (`staff_id`,`to_date`);

--
-- Chỉ mục cho bảng `staff_receipts`
--
ALTER TABLE `staff_receipts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `fk_sr_customer` (`customer_id`),
  ADD KEY `idx_sr_staff` (`staff_id`),
  ADD KEY `idx_sr_order` (`order_id`),
  ADD KEY `idx_sr_request` (`request_id`),
  ADD KEY `idx_sr_reviewed` (`reviewed`,`created_at`),
  ADD KEY `idx_sr_created` (`created_at`),
  ADD KEY `idx_sr_status` (`status`,`created_at`);

--
-- Chỉ mục cho bảng `staff_reviews`
--
ALTER TABLE `staff_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_review_staff` (`staff_id`),
  ADD KEY `idx_review_order` (`order_id`);

--
-- Chỉ mục cho bảng `staff_salary_advances`
--
ALTER TABLE `staff_salary_advances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_adv_staff` (`staff_id`),
  ADD KEY `idx_adv_slip` (`payslip_id`),
  ADD KEY `idx_adv_remittance` (`remittance_id`),
  ADD KEY `idx_ssa_deduct` (`deduct_from_collection`);

--
-- Chỉ mục cho bảng `staff_stock_consumptions`
--
ALTER TABLE `staff_stock_consumptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ssc_staff` (`staff_id`),
  ADD KEY `idx_ssc_product` (`product_id`),
  ADD KEY `idx_ssc_ref` (`ref_kind`,`ref_id`),
  ADD KEY `idx_ssc_time` (`consumed_at`);

--
-- Chỉ mục cho bảng `staff_stock_issues`
--
ALTER TABLE `staff_stock_issues`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `fk_ssi_creator` (`created_by_staff_id`),
  ADD KEY `fk_ssi_approver` (`approved_by_staff_id`),
  ADD KEY `fk_ssi_receipt` (`ref_receipt_id`),
  ADD KEY `idx_ssi_staff` (`staff_id`),
  ADD KEY `idx_ssi_status` (`status`),
  ADD KEY `idx_ssi_created` (`created_at`);

--
-- Chỉ mục cho bảng `staff_stock_issue_items`
--
ALTER TABLE `staff_stock_issue_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_ssi_item_issue_product` (`issue_id`,`product_id`),
  ADD KEY `idx_ssi_item_issue` (`issue_id`),
  ADD KEY `idx_ssi_item_product` (`product_id`);

--
-- Chỉ mục cho bảng `stock_items`
--
ALTER TABLE `stock_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_stock_identifier` (`identifier`),
  ADD KEY `idx_stock_product` (`product_id`),
  ADD KEY `idx_stock_supplier` (`supplier_id`),
  ADD KEY `idx_stock_status` (`status`),
  ADD KEY `idx_stock_deleted` (`is_deleted`),
  ADD KEY `idx_stock_held` (`held_by_staff_id`);

--
-- Chỉ mục cho bảng `stock_receipts`
--
ALTER TABLE `stock_receipts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `fk_receipt_creator` (`created_by_staff_id`),
  ADD KEY `fk_receipt_ref_staff` (`ref_staff_id`),
  ADD KEY `idx_receipts_kind` (`kind`),
  ADD KEY `idx_receipts_reason` (`reason_code`),
  ADD KEY `idx_receipts_created` (`created_at`),
  ADD KEY `idx_receipts_order` (`ref_order_id`),
  ADD KEY `idx_receipts_supplier` (`supplier_id`),
  ADD KEY `idx_receipts_voided` (`is_voided`),
  ADD KEY `idx_receipts_stock_take` (`ref_stock_take_id`),
  ADD KEY `idx_receipts_warranty` (`ref_warranty_order_id`);

--
-- Chỉ mục cho bảng `stock_receipt_items`
--
ALTER TABLE `stock_receipt_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_receipt_items_receipt` (`receipt_id`),
  ADD KEY `idx_receipt_items_product` (`product_id`);

--
-- Chỉ mục cho bảng `stock_return_requests`
--
ALTER TABLE `stock_return_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_srr_staff` (`staff_id`),
  ADD KEY `idx_srr_status` (`status`);

--
-- Chỉ mục cho bảng `stock_takes`
--
ALTER TABLE `stock_takes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `fk_stock_takes_finished_by` (`finished_by_staff_id`),
  ADD KEY `idx_stock_takes_status_started` (`status`,`started_at`),
  ADD KEY `idx_stock_takes_by_staff` (`by_staff_id`);

--
-- Chỉ mục cho bảng `stock_take_lines`
--
ALTER TABLE `stock_take_lines`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_stock_take_lines_take_product` (`stock_take_id`,`product_id`),
  ADD KEY `fk_stock_take_lines_receipt` (`receipt_id`),
  ADD KEY `idx_stock_take_lines_take` (`stock_take_id`),
  ADD KEY `idx_stock_take_lines_product` (`product_id`);

--
-- Chỉ mục cho bảng `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_suppliers_deleted` (`is_deleted`),
  ADD KEY `idx_suppliers_name` (`name`);

--
-- Chỉ mục cho bảng `supplier_warranty_batches`
--
ALTER TABLE `supplier_warranty_batches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_supplier_warranty_batches_code` (`code`),
  ADD KEY `fk_swb_supplier` (`supplier_id`),
  ADD KEY `fk_swb_creator` (`created_by_staff_id`);

--
-- Chỉ mục cho bảng `supplier_warranty_batch_items`
--
ALTER TABLE `supplier_warranty_batch_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_supplier_warranty_batch_item` (`batch_id`,`warranty_item_id`),
  ADD KEY `fk_swbi_product` (`product_id`),
  ADD KEY `idx_swbi_item` (`warranty_item_id`),
  ADD KEY `idx_swbi_order` (`order_id`);

--
-- Chỉ mục cho bảng `warehouse_logs`
--
ALTER TABLE `warehouse_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_log_staff` (`staff_id`),
  ADD KEY `idx_log_stock` (`stock_item_id`),
  ADD KEY `idx_log_kind` (`kind`),
  ADD KEY `idx_log_order` (`order_id`),
  ADD KEY `idx_log_created` (`created_at`);

--
-- Chỉ mục cho bảng `warranty_orders`
--
ALTER TABLE `warranty_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_wo_status` (`status`),
  ADD KEY `idx_wo_customer` (`customer_id`),
  ADD KEY `idx_wo_staff` (`assigned_staff_id`),
  ADD KEY `idx_wo_request` (`request_date`),
  ADD KEY `idx_wo_deleted` (`is_deleted`),
  ADD KEY `idx_wo_debt_carried` (`debt_carried_at`),
  ADD KEY `idx_wo_plate` (`license_plate`),
  ADD KEY `idx_wo_imei` (`imei_search`),
  ADD KEY `payslip_id` (`payslip_id`);

--
-- Chỉ mục cho bảng `warranty_order_charges`
--
ALTER TABLE `warranty_order_charges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_woc_order` (`warranty_order_id`,`is_deleted`);

--
-- Chỉ mục cho bảng `warranty_order_items`
--
ALTER TABLE `warranty_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_woi_product` (`product_id`),
  ADD KEY `fk_woi_receipt` (`release_receipt_id`),
  ADD KEY `idx_woi_order` (`warranty_order_id`,`is_deleted`),
  ADD KEY `idx_woi_kind` (`warranty_order_id`,`kind`,`is_deleted`);

--
-- Chỉ mục cho bảng `warranty_order_photos`
--
ALTER TABLE `warranty_order_photos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_wop_order` (`warranty_order_id`,`is_deleted`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `agency_collections`
--
ALTER TABLE `agency_collections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `badge_order_attachments`
--
ALTER TABLE `badge_order_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `badge_order_charges`
--
ALTER TABLE `badge_order_charges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `collections`
--
ALTER TABLE `collections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT cho bảng `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `conversation_members`
--
ALTER TABLE `conversation_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=111;

--
-- AUTO_INCREMENT cho bảng `customer_accounts`
--
ALTER TABLE `customer_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT cho bảng `customer_old_debts`
--
ALTER TABLE `customer_old_debts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `customer_product_prices`
--
ALTER TABLE `customer_product_prices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `customer_sims`
--
ALTER TABLE `customer_sims`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `customer_update_requests`
--
ALTER TABLE `customer_update_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT cho bảng `customer_vehicles`
--
ALTER TABLE `customer_vehicles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT cho bảng `debt_settlements`
--
ALTER TABLE `debt_settlements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `inquiries`
--
ALTER TABLE `inquiries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `inquiry_items`
--
ALTER TABLE `inquiry_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT cho bảng `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=178;

--
-- AUTO_INCREMENT cho bảng `order_attachments`
--
ALTER TABLE `order_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `order_charges`
--
ALTER TABLE `order_charges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT cho bảng `order_checklist`
--
ALTER TABLE `order_checklist`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `order_field_values`
--
ALTER TABLE `order_field_values`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=220;

--
-- AUTO_INCREMENT cho bảng `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=326;

--
-- AUTO_INCREMENT cho bảng `order_lines`
--
ALTER TABLE `order_lines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=208;

--
-- AUTO_INCREMENT cho bảng `order_payments`
--
ALTER TABLE `order_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=93;

--
-- AUTO_INCREMENT cho bảng `order_staff_commissions`
--
ALTER TABLE `order_staff_commissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT cho bảng `order_step_photos`
--
ALTER TABLE `order_step_photos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=75;

--
-- AUTO_INCREMENT cho bảng `order_templates`
--
ALTER TABLE `order_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT cho bảng `order_template_fields`
--
ALTER TABLE `order_template_fields`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `order_warranty_items`
--
ALTER TABLE `order_warranty_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT cho bảng `order_warranty_moves`
--
ALTER TABLE `order_warranty_moves`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=97;

--
-- AUTO_INCREMENT cho bảng `order_workflow_steps`
--
ALTER TABLE `order_workflow_steps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `payment_receipts`
--
ALTER TABLE `payment_receipts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `payment_requests`
--
ALTER TABLE `payment_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT cho bảng `payment_request_items`
--
ALTER TABLE `payment_request_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT cho bảng `price_tiers`
--
ALTER TABLE `price_tiers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT cho bảng `product_attributes`
--
ALTER TABLE `product_attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT cho bảng `product_blocks`
--
ALTER TABLE `product_blocks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT cho bảng `product_prices`
--
ALTER TABLE `product_prices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=166;

--
-- AUTO_INCREMENT cho bảng `release_pool`
--
ALTER TABLE `release_pool`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `remittances`
--
ALTER TABLE `remittances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `staff`
--
ALTER TABLE `staff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `staff_advances`
--
ALTER TABLE `staff_advances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT cho bảng `staff_holdings`
--
ALTER TABLE `staff_holdings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT cho bảng `staff_payroll_adjustments`
--
ALTER TABLE `staff_payroll_adjustments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `staff_payroll_periods`
--
ALTER TABLE `staff_payroll_periods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `staff_payslips`
--
ALTER TABLE `staff_payslips`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `staff_receipts`
--
ALTER TABLE `staff_receipts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=72;

--
-- AUTO_INCREMENT cho bảng `staff_reviews`
--
ALTER TABLE `staff_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `staff_salary_advances`
--
ALTER TABLE `staff_salary_advances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT cho bảng `staff_stock_consumptions`
--
ALTER TABLE `staff_stock_consumptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `staff_stock_issues`
--
ALTER TABLE `staff_stock_issues`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT cho bảng `staff_stock_issue_items`
--
ALTER TABLE `staff_stock_issue_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT cho bảng `stock_items`
--
ALTER TABLE `stock_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `stock_receipts`
--
ALTER TABLE `stock_receipts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=136;

--
-- AUTO_INCREMENT cho bảng `stock_receipt_items`
--
ALTER TABLE `stock_receipt_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=188;

--
-- AUTO_INCREMENT cho bảng `stock_return_requests`
--
ALTER TABLE `stock_return_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `stock_takes`
--
ALTER TABLE `stock_takes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `stock_take_lines`
--
ALTER TABLE `stock_take_lines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `supplier_warranty_batches`
--
ALTER TABLE `supplier_warranty_batches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `supplier_warranty_batch_items`
--
ALTER TABLE `supplier_warranty_batch_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `warehouse_logs`
--
ALTER TABLE `warehouse_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `warranty_orders`
--
ALTER TABLE `warranty_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT cho bảng `warranty_order_charges`
--
ALTER TABLE `warranty_order_charges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `warranty_order_items`
--
ALTER TABLE `warranty_order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT cho bảng `warranty_order_photos`
--
ALTER TABLE `warranty_order_photos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `agency_collections`
--
ALTER TABLE `agency_collections`
  ADD CONSTRAINT `fk_agcol_dealer` FOREIGN KEY (`dealer_id`) REFERENCES `customers` (`id`),
  ADD CONSTRAINT `fk_agcol_retail` FOREIGN KEY (`retail_customer_id`) REFERENCES `customers` (`id`),
  ADD CONSTRAINT `fk_agcol_settle` FOREIGN KEY (`debt_settlement_id`) REFERENCES `debt_settlements` (`id`),
  ADD CONSTRAINT `fk_agcol_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`);

--
-- Các ràng buộc cho bảng `collections`
--
ALTER TABLE `collections`
  ADD CONSTRAINT `fk_coll_warranty` FOREIGN KEY (`ref_warranty_order_id`) REFERENCES `warranty_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `order_warranty_items`
--
ALTER TABLE `order_warranty_items`
  ADD CONSTRAINT `fk_owi_holder_staff` FOREIGN KEY (`holder_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_owi_last_supplier` FOREIGN KEY (`last_supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_owi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_owi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_owi_release_receipt` FOREIGN KEY (`release_receipt_id`) REFERENCES `stock_receipts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_owi_source_staff` FOREIGN KEY (`source_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_owi_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `order_warranty_meta`
--
ALTER TABLE `order_warranty_meta`
  ADD CONSTRAINT `fk_owm_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_owm_supplier` FOREIGN KEY (`default_supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `order_warranty_moves`
--
ALTER TABLE `order_warranty_moves`
  ADD CONSTRAINT `fk_owmv_created_by` FOREIGN KEY (`created_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_owmv_holder_staff` FOREIGN KEY (`holder_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_owmv_item` FOREIGN KEY (`warranty_item_id`) REFERENCES `order_warranty_items` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_owmv_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_owmv_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_owmv_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `stock_receipts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_owmv_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `staff_receipts`
--
ALTER TABLE `staff_receipts`
  ADD CONSTRAINT `fk_sr_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  ADD CONSTRAINT `fk_sr_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `fk_sr_request` FOREIGN KEY (`request_id`) REFERENCES `payment_requests` (`id`);

--
-- Các ràng buộc cho bảng `stock_receipts`
--
ALTER TABLE `stock_receipts`
  ADD CONSTRAINT `fk_receipt_warranty` FOREIGN KEY (`ref_warranty_order_id`) REFERENCES `warranty_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `supplier_warranty_batches`
--
ALTER TABLE `supplier_warranty_batches`
  ADD CONSTRAINT `fk_swb_creator` FOREIGN KEY (`created_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_swb_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `supplier_warranty_batch_items`
--
ALTER TABLE `supplier_warranty_batch_items`
  ADD CONSTRAINT `fk_swbi_batch` FOREIGN KEY (`batch_id`) REFERENCES `supplier_warranty_batches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_swbi_item` FOREIGN KEY (`warranty_item_id`) REFERENCES `order_warranty_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_swbi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_swbi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `warranty_orders`
--
ALTER TABLE `warranty_orders`
  ADD CONSTRAINT `fk_wo_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_wo_staff` FOREIGN KEY (`assigned_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `warranty_order_charges`
--
ALTER TABLE `warranty_order_charges`
  ADD CONSTRAINT `fk_woc_order` FOREIGN KEY (`warranty_order_id`) REFERENCES `warranty_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `warranty_order_items`
--
ALTER TABLE `warranty_order_items`
  ADD CONSTRAINT `fk_woi_order` FOREIGN KEY (`warranty_order_id`) REFERENCES `warranty_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_woi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_woi_receipt` FOREIGN KEY (`release_receipt_id`) REFERENCES `stock_receipts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `warranty_order_photos`
--
ALTER TABLE `warranty_order_photos`
  ADD CONSTRAINT `fk_wop_order` FOREIGN KEY (`warranty_order_id`) REFERENCES `warranty_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
