-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th5 16, 2026 lúc 01:58 PM
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
-- Cơ sở dữ liệu: `gpsviet`
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

--
-- Đang đổ dữ liệu cho bảng `agency_collections`
--

INSERT INTO `agency_collections` (`id`, `code`, `dealer_id`, `retail_customer_id`, `amount`, `source`, `staff_id`, `handed_over`, `handed_over_at`, `method`, `note`, `receipt_url`, `collected_at`, `debt_settlement_id`, `created_by`, `is_deleted`) VALUES
(1, 'TH-0705-001', 4, NULL, 500000, 'admin', NULL, 1, '2026-05-07 12:19:31', 'transfer', NULL, NULL, '2026-05-07 12:19:00', 4, 1, 0),
(2, 'TH-0805-001', 4, 6, 500000, 'admin', NULL, 1, '2026-05-08 22:19:26', 'cash', NULL, NULL, '2026-05-08 22:19:00', 4, 1, 0);

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
('assets.auto_approve', '1', '2026-05-16 00:05:19', 1),
('bank.account_name', 'coong ti', '2026-04-28 20:02:02', 1),
('bank.account_no', '092109128310398', '2026-04-28 20:02:02', 1),
('bank.bank_name', 'tên ngân hàng', '2026-04-28 20:02:02', 1),
('bank.default_qr_slot', '1', '2026-04-28 20:02:02', 1),
('qr.slot1.image_url', 'https://i.ibb.co/6c8pCmTJ/qr-slot-1.jpg', '2026-04-28 20:02:02', 1),
('qr.slot1.label', 'QR chinh', '2026-04-28 19:06:11', NULL),
('qr.slot2.image_url', '', '2026-04-28 19:06:11', NULL),
('qr.slot2.label', 'QR du phong 1', '2026-04-28 19:06:11', NULL),
('qr.slot3.image_url', '', '2026-04-28 19:06:11', NULL),
('qr.slot3.label', 'QR du phong 2', '2026-04-28 19:06:11', NULL),
('qr.slot4.image_url', '', '2026-04-28 19:06:11', NULL),
('qr.slot4.label', 'QR du phong 3', '2026-04-28 19:06:11', NULL),
('qr.slot5.image_url', '', '2026-04-28 19:06:11', NULL),
('qr.slot5.label', 'QR du phong 4', '2026-04-28 19:06:11', NULL);

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
(1, 'Dinh vi', 0),
(2, 'Camera nghi dinh 10', 0),
(3, 'Sim', 0),
(4, 'Phu kien', 0),
(5, 'Định vị xe tải', 0),
(6, 'Camera giám sát', 0),
(7, 'Hộp đen MDVR', 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `collections`
--

CREATE TABLE `collections` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `amount` bigint(20) NOT NULL,
  `method` enum('cash','transfer') NOT NULL,
  `receipt_url` varchar(500) DEFAULT NULL,
  `collected_at` datetime NOT NULL DEFAULT current_timestamp(),
  `remitted` tinyint(1) NOT NULL DEFAULT 0,
  `remittance_id` int(11) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

--
-- Đang đổ dữ liệu cho bảng `conversations`
--

INSERT INTO `conversations` (`id`, `customer_id`, `last_message_at`, `is_deleted`) VALUES
(1, 7, '2026-04-28 13:26:45', 0),
(2, 4, '2026-04-29 12:50:02', 0),
(3, 6, NULL, 0),
(4, 5, NULL, 0),
(5, 10, '2026-05-08 22:53:58', 0);

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

--
-- Đang đổ dữ liệu cho bảng `conversation_members`
--

INSERT INTO `conversation_members` (`id`, `conversation_id`, `staff_id`, `joined_at`, `removed_at`, `added_by`) VALUES
(1, 1, 3, '2026-04-29 10:46:05', NULL, 1),
(2, 2, 4, '2026-04-29 12:30:30', NULL, 1),
(5, 2, 3, '2026-05-05 23:28:44', NULL, 1),
(12, 3, 3, '2026-05-05 03:04:30', NULL, 1),
(14, 4, 3, '2026-05-06 00:51:24', NULL, 1),
(16, 1, 4, '2026-05-08 22:44:08', NULL, 1);

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
(1, 'KH001', 'retail', 'Nguyen Van An', '0901111111', 'an.nv@example.com', 'Ha Noi', NULL, 'Khach le mau', NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-04-26 02:30:52', '2026-04-25 10:35:28', '2026-05-11 15:59:47', NULL),
(2, 'KH002', 'retail', 'Tran Thi Binh', '0902222222', NULL, 'Hai Phong', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-04-26 02:30:52', '2026-04-25 10:35:28', '2026-04-26 11:54:41', NULL),
(3, 'DL001', 'dealer', 'DLR Test', '0903333333', NULL, NULL, NULL, 'Dai ly cap 1', 'Cong ty TNHH GPS Ha Noi', '0101234567', 'Le Van Cuong', 50000000, 30, 0, 5.00, 6, '$2a$10$e14olmdWTDynd6tIR142zeWPdoDPP7i6w3399iVIAwCfj9ocuV8pq', 0, '2026-04-26 02:30:52', '2026-04-25 10:35:28', '2026-05-10 11:10:13', NULL),
(4, 'DL002', 'dealer', 'Pham Thi Dung', '0904444444', 'dung@gpsdanang.vn', 'Da Nang', '/uploads/avatars/1777114898932-210d9bf706ab.png', 'Dai ly cap 2', 'GPS Mien Trung', '0107654321', 'Pham Thi Dung', 30000000, 15, 0, 3.00, 6, '$2a$10$xqlCwt5yCHrI8YFETYEp3e83C2IjbBbt6TDox2dasTd00jXI7I1Fm', 0, '2026-04-26 02:30:52', '2026-04-25 10:35:28', '2026-05-16 11:58:05', NULL),
(5, 'KH003', 'retail', 'Lê Hoàng Cường', '0923456789', NULL, 'Q.7, TP.HCM', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-04-26 02:30:52', '2026-04-25 16:30:31', '2026-04-26 11:54:41', NULL),
(6, 'KH004', 'retail', 'Phạm Thanh Dũng', '0934567890', NULL, 'Bình Dương', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-04-26 02:30:52', '2026-04-25 16:30:31', '2026-04-26 11:54:41', NULL),
(7, 'KH0005', 'retail', 'ngueyén van a', '0312313123', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-04-26 11:35:23', '2026-04-26 04:33:39', '2026-04-28 13:18:55', NULL),
(9, 'KH0006', 'retail', 'alo', '0362469321', NULL, 'đia chỉ', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-04-26 17:43:31', '2026-04-26 10:36:26', '2026-04-26 11:54:41', NULL),
(10, 'KH0007', 'retail', '123123', '0932743900', NULL, '123123', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, '2026-05-10 00:08:28', '2026-05-08 15:53:57', '2026-05-09 17:08:28', NULL),
(11, 'KH0008', 'retail', 'Khach Test Bot', '0900000901', NULL, '123 Le Loi, Q1', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-10 11:06:16', '2026-05-10 11:06:16', NULL),
(12, 'KH0009', 'retail', 'KH-Pentest-Customer', '0911222333', NULL, '55 Nguyen Trai, Q5', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-10 11:07:33', '2026-05-10 11:07:33', NULL),
(13, 'KH451494', 'retail', 'KH Pentest Admin', '0900000901', NULL, '99 Pentest Street, Q.99', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, '2026-05-12 11:08:05', '2026-05-10 11:08:04', '2026-05-12 04:08:05', NULL),
(14, 'KH312191', 'retail', 'BotKH-Tho', '0901900001', NULL, '99 Test Street, Q1, HCM', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-10 11:08:59', '2026-05-10 11:08:59', NULL),
(15, 'KH451495', 'retail', 'Race Test', '0938111222', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, '2026-05-11 00:39:24', '2026-05-10 11:12:06', '2026-05-10 17:39:24', NULL),
(16, 'DL0003', 'dealer', 'DL Test Staff', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 12345678, 15, 0, 0.00, NULL, NULL, 1, NULL, '2026-05-11 17:50:19', '2026-05-11 17:51:07', NULL),
(17, 'KH451496', 'retail', 'họ tên 1', '09876556789', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-12 19:06:18', '2026-05-12 19:06:18', NULL),
(18, 'KH451497', 'retail', 'họ tên 1', '09876556789', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, '2026-05-13 02:33:54', '2026-05-12 19:06:44', '2026-05-12 19:33:54', NULL),
(19, 'DL0004', 'dealer', 'KhachHangVIP', '0362469323', 'dinhdannguyen2003@gmail.com', '99 Test Street, Q1, HCM', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 6, NULL, 0, '2026-05-14 17:33:52', '2026-05-14 10:11:26', '2026-05-16 11:57:49', NULL),
(20, 'KH451498', 'retail', 'khách hàng của KHACHHANGVIP', '034567890', NULL, 'ưetyuiop', NULL, 'ègtyhụio0pl', NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, '2026-05-15 08:34:44', '2026-05-15 01:27:41', '2026-05-15 01:34:44', NULL);

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
(1, 10, 'nguyenavc', NULL, 0),
(2, 2, 'taikhoan3', NULL, 0),
(3, 2, 'taikhoan3', NULL, 0),
(4, 2, 'taikhoan3', NULL, 0),
(5, 2, 'taikhoan2', NULL, 0),
(6, 2, 'taikhoan1', NULL, 0),
(7, 14, 'taikhoan1', NULL, 0),
(8, 4, '123123123', NULL, 0),
(9, 19, '34567890', NULL, 0),
(10, 19, 'tentaikhoan01', NULL, 0);

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
(1, 4, 500, NULL, '2026-05-12', '2026-05-13 03:13:45', 1),
(2, 4, 500, NULL, '2026-05-12', '2026-05-13 03:14:20', 1),
(3, 4, 500, NULL, '2026-05-12', '2026-05-13 03:19:14', 1),
(4, 4, 6000000, NULL, '2026-05-12', '2026-05-13 03:21:37', 1),
(5, 19, 500000, NULL, '2026-05-15', '2026-05-15 21:41:30', 1);

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

--
-- Đang đổ dữ liệu cho bảng `customer_product_prices`
--

INSERT INTO `customer_product_prices` (`id`, `customer_id`, `product_id`, `price`) VALUES
(3, 4, 1, 0.00),
(4, 4, 8, 0.00);

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

--
-- Đang đổ dữ liệu cho bảng `customer_sims`
--

INSERT INTO `customer_sims` (`id`, `customer_id`, `sim_number`, `note`, `is_deleted`) VALUES
(1, 14, 'sosim1', NULL, 0),
(2, 18, '0961347751', 'BA BA-1778661347307', 0),
(3, 18, '0961944375', 'BA BA-1778661943963', 0),
(4, 19, '34567890', NULL, 0),
(5, 19, '40000', NULL, 0);

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
(1, 10, 'account', 'add', NULL, 'nguyenavc', NULL, 'kithuat', 3, NULL, 'approved', 1, '2026-05-10 08:31:23', NULL, 0),
(2, 2, 'account', 'add', NULL, 'taikhoan1', NULL, 'kithuat', 3, NULL, 'approved', 1, '2026-05-12 09:18:03', NULL, 0),
(3, 2, 'account', 'add', NULL, 'taikhoan2', NULL, 'kithuat', 3, NULL, 'approved', 1, '2026-05-12 09:18:02', NULL, 0),
(4, 2, 'account', 'add', NULL, 'taikhoan3', NULL, 'kithuat', 3, NULL, 'approved', 1, '2026-05-12 09:18:01', NULL, 0),
(5, 14, 'account', 'add', NULL, 'taikhoan1', NULL, 'kithuat', 3, NULL, 'approved', 1, '2026-05-12 09:22:40', NULL, 0),
(6, 14, 'vehicle', 'add', NULL, 'bsx1', NULL, 'kithuat', 3, NULL, 'approved', 1, '2026-05-12 09:22:40', NULL, 0),
(7, 14, 'sim', 'add', NULL, 'sosim1', NULL, 'kithuat', 3, NULL, 'approved', 1, '2026-05-12 09:22:39', NULL, 0),
(8, 4, 'account', 'add', NULL, '123123123', NULL, 'kithuat', 3, NULL, 'approved', 1, '2026-05-12 17:41:24', NULL, 0),
(9, 4, 'vehicle', 'add', NULL, 'aha213123', NULL, 'kithuat', 3, NULL, 'approved', NULL, '2026-05-12 18:16:26', NULL, 0),
(10, 18, 'sim', 'add', NULL, '0961347751', 'BA BA-1778661347307', 'kithuat', 3, NULL, 'approved', NULL, '2026-05-13 08:35:47', NULL, 0),
(11, 18, 'sim', 'add', NULL, '0961944375', 'BA BA-1778661943963', 'kithuat', 3, NULL, 'approved', NULL, '2026-05-13 08:45:44', NULL, 0),
(12, 19, 'account', 'add', NULL, '34567890', NULL, 'kithuat', 3, NULL, 'approved', NULL, '2026-05-15 01:30:45', NULL, 0),
(13, 19, 'vehicle', 'add', NULL, '23456789', NULL, 'kithuat', 3, NULL, 'approved', NULL, '2026-05-15 01:30:45', NULL, 0),
(14, 19, 'sim', 'add', NULL, '34567890', NULL, 'kithuat', 3, NULL, 'approved', NULL, '2026-05-15 01:30:45', NULL, 0),
(15, 19, 'vehicle', 'add', NULL, '123456', NULL, 'kithuat', 3, NULL, 'approved', NULL, '2026-05-15 01:47:07', NULL, 0),
(16, 19, 'sim', 'add', NULL, '40000', NULL, 'kithuat', 3, NULL, 'approved', NULL, '2026-05-15 01:47:07', NULL, 0),
(17, 4, 'vehicle', 'add', NULL, '200000', NULL, 'kithuat', 3, NULL, 'approved', NULL, '2026-05-15 01:49:21', NULL, 0),
(18, 19, 'account', 'add', NULL, 'tentaikhoan01', NULL, 'kithuat', 3, NULL, 'approved', NULL, '2026-05-15 17:04:59', NULL, 0),
(19, 19, 'vehicle', 'add', NULL, '234567890-', NULL, 'kithuat', 3, NULL, 'approved', NULL, '2026-05-15 17:04:59', NULL, 0);

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
(1, 14, 'bsx1', NULL, 0),
(2, 4, 'aha213123', NULL, 0),
(3, 19, '23456789', NULL, 0),
(4, 19, '123456', NULL, 0),
(5, 4, '200000', NULL, 0),
(6, 19, '234567890-', NULL, 0);

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

--
-- Đang đổ dữ liệu cho bảng `debt_settlements`
--

INSERT INTO `debt_settlements` (`id`, `code`, `customer_id`, `total_debt`, `amount_paid`, `remaining`, `qr_slot`, `pay_method`, `receipt_url`, `note`, `created_by`, `paid_at`, `is_deleted`) VALUES
(1, 'TT-2804-001', 4, 213000, 213000, 0, 1, 'mixed', NULL, NULL, 1, '2026-04-28 20:07:53', 0),
(2, 'TT-2804-002', 7, 389980, 200000, 189980, 1, 'transfer', NULL, NULL, 1, '2026-04-28 20:10:54', 0),
(3, 'TT-2804-003', 7, 189980, 189980, 0, 1, 'cash', NULL, NULL, 1, '2026-04-28 20:18:55', 0),
(4, 'TT-0805-001', 4, 581000, 581000, 0, 1, 'cash', NULL, NULL, 1, '2026-05-08 22:24:46', 0),
(5, 'TT-1005-001', 1, 200000, 105000, 95000, NULL, 'cash', NULL, NULL, 1, '2026-05-10 17:54:27', 0),
(6, 'TT-1105-001', 10, 10144333, 10144333, 0, 1, 'cash', NULL, NULL, 1, '2026-05-11 00:42:30', 0),
(7, 'TT-1105-002', 2, 4843000, 4843000, 0, 1, 'cash', NULL, NULL, 1, '2026-05-11 01:01:20', 0),
(8, 'TT-1105-003', 1, 95000, 95000, 0, 1, 'cash', NULL, NULL, 1, '2026-05-11 22:59:47', 0),
(9, 'TT-1205-001', 14, 500000, 500000, 0, 1, 'cash', NULL, NULL, 1, '2026-05-12 01:49:31', 0);

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

--
-- Đang đổ dữ liệu cho bảng `inquiries`
--

INSERT INTO `inquiries` (`id`, `code`, `full_name`, `phone`, `email`, `address`, `area`, `vehicle_plate`, `note`, `service_kind`, `source`, `status`, `seen_at`, `contacted_at`, `contacted_by_staff_id`, `converted_customer_id`, `converted_order_id`, `reject_reason`, `is_deleted`, `created_at`, `updated_at`) VALUES
(1, 'TV-2604-001', 'qqew', '0313123312', NULL, 'bang tex', 'mỹ', NULL, NULL, 'install', 'web', 'new', '2026-04-26 02:30:52', NULL, NULL, NULL, NULL, NULL, 0, '2026-04-25 17:47:27', '2026-04-25 19:30:52'),
(2, 'TV-2604-002', 'ngueyén van a', '0312313123', NULL, 'bang tex', 'mỹ', NULL, NULL, 'install', 'web', 'new', '2026-04-26 02:30:52', NULL, NULL, NULL, NULL, NULL, 0, '2026-04-25 18:11:59', '2026-04-25 19:30:52'),
(3, 'TV-2604-003', 'ngueyén van a', '0312313123', NULL, 'bang tex', 'mỹ', NULL, NULL, 'install', 'web', 'new', '2026-04-26 02:30:52', NULL, NULL, NULL, NULL, NULL, 0, '2026-04-25 18:28:18', '2026-04-25 19:30:52'),
(4, 'TV-2604-004', 'ngueyén van a', '0312313123', NULL, NULL, 'mỹ', NULL, NULL, 'renewal', 'web', 'new', '2026-04-26 02:30:52', NULL, NULL, NULL, NULL, NULL, 0, '2026-04-25 18:29:41', '2026-04-25 19:30:52'),
(5, 'TV-2604-005', 'ngueyén van a', '0312313123', NULL, NULL, 'mỹ', NULL, NULL, 'renewal', 'web', 'converted', '2026-04-26 10:55:17', '2026-04-26 10:55:08', 1, 7, 1, NULL, 0, '2026-04-25 19:34:54', '2026-04-26 04:33:39');

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

--
-- Đang đổ dữ liệu cho bảng `inquiry_items`
--

INSERT INTO `inquiry_items` (`id`, `inquiry_id`, `product_id`, `qty`, `note`) VALUES
(1, 1, 5, 2, NULL),
(2, 1, 2, 1, NULL),
(3, 2, 6, 1, NULL),
(4, 2, 5, 1, NULL),
(5, 3, 6, 1, NULL),
(6, 3, 5, 1, NULL),
(7, 4, 3, 1, NULL),
(8, 4, 5, 1, NULL),
(9, 5, 5, 1, NULL),
(10, 5, 3, 1, NULL);

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

--
-- Đang đổ dữ liệu cho bảng `messages`
--

INSERT INTO `messages` (`id`, `conversation_id`, `order_id`, `sender_type`, `sender_id`, `content`, `visibility`, `sent_at`, `read_at`) VALUES
(1, 1, NULL, 'customer', 7, 'Xin chào, mình quan tâm sản phẩm:\n• Thiet bi dinh vi VT-01 (Mã cccd)\n• Giá: 15.000đ\n• http://localhost:5170/customer/product-detail.html?id=8\nMình cần được tư vấn thêm.', 'all', '2026-04-28 13:26:26', '2026-04-28 13:26:35'),
(2, 1, NULL, 'staff', 1, 'tu cái gì mà tư', 'all', '2026-04-28 13:26:45', NULL),
(3, 2, NULL, 'customer', 4, 'aloo', 'all', '2026-04-29 12:43:41', '2026-04-29 12:43:46'),
(4, 2, NULL, 'staff', 1, 'dạ', 'all', '2026-04-29 12:43:49', NULL),
(5, 2, NULL, 'customer', 4, 'alooooooo', 'all', '2026-04-29 12:44:08', '2026-04-29 12:44:08'),
(6, 2, NULL, 'customer', 4, 'https://i.ibb.co/KczVZfjM/cv2-1777441761632.jpg', 'staff_only', '2026-04-29 12:49:23', '2026-04-29 12:49:24'),
(7, 2, NULL, 'customer', 4, 'https://i.ibb.co/KczVZfjM/cv2-1777441761632.jpg', 'staff_only', '2026-04-29 12:50:02', '2026-04-29 12:50:03'),
(8, 5, NULL, 'customer', 10, 'Xin chào, mình quan tâm sản phẩm:\n• Thiet bi dinh vi VT-01 (Mã cccd)\n• Giá: 15.000đ\n• http://localhost:5179/customer/product-detail.html?id=8\nMình cần được tư vấn thêm.', 'all', '2026-05-08 22:53:58', '2026-05-08 22:54:02');

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
(1, 'order_completed', 'ORD-2904-001: KTV hoàn thành', 'Lê Văn Hùng — Pham Thi Dung — 120.000đ', '/admin/orders.html#order-17', NULL, 4, 3, 1, '2026-04-29 12:31:44', 0, '2026-04-29 05:31:33'),
(2, 'order_new', 'Đơn mới ORD-2904-003', 'Pham Thi Dung vừa tạo đơn Bảo hành', '/admin/orders.html#order-19', NULL, 4, NULL, 1, '2026-04-29 12:32:51', 0, '2026-04-29 05:32:47'),
(3, 'order_receive_uploaded', 'ORD-0605-001: KTV đã chụp ảnh nhận hàng', 'Lê Văn Hùng — chờ xuất kho cho Lê Hoàng Cường', '/admin/orders.html#order-25', NULL, 5, 3, 1, '2026-05-08 22:36:52', 0, '2026-05-06 09:09:25');

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
  `tech_commission_requested_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_payments`
--

CREATE TABLE `order_payments` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `amount` bigint(20) NOT NULL,
  `source` enum('staff_collection','admin_mark_paid','customer_self_pay','admin_pending','refund') NOT NULL,
  `confirmed` tinyint(1) NOT NULL DEFAULT 1,
  `confirmed_at` datetime DEFAULT NULL,
  `confirmed_by` int(11) DEFAULT NULL,
  `collection_id` int(11) DEFAULT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `paid_at` datetime NOT NULL DEFAULT current_timestamp(),
  `note` text DEFAULT NULL,
  `proof_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`proof_urls`)),
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `approved_at` datetime NOT NULL DEFAULT current_timestamp(),
  `approved_by` int(11) DEFAULT NULL,
  `carried_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `requested_by` int(11) DEFAULT NULL,
  `requested_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(10, 'Kiểm tra', 'Kiểm tra tình trạng thiết bị', 1, 9, 0);

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

--
-- Đang đổ dữ liệu cho bảng `order_template_fields`
--

INSERT INTO `order_template_fields` (`id`, `template_id`, `seq`, `label`, `field_type`, `is_required`, `placeholder`, `is_deleted`) VALUES
(21, 1, 1, 'Biển số xe', 'text', 1, 'VD: 29A-12345', 0),
(22, 1, 2, 'IMEI', 'text', 0, NULL, 0),
(23, 1, 3, 'Ten tai khoan', 'text', 0, 'Ten tai khoan GoTrack', 0),
(24, 2, 1, 'Biển số xe', 'text', 1, NULL, 0),
(25, 2, 2, 'IMEI', 'text', 1, NULL, 0),
(26, 2, 3, 'Số năm', 'number', 1, 'VD: 1, 2, 3', 0),
(27, 3, 1, 'Biển số xe', 'text', 1, NULL, 0),
(28, 3, 2, 'IMEI', 'text', 1, NULL, 0),
(29, 3, 3, 'Số SIM mới', 'text', 1, NULL, 0),
(30, 4, 1, 'Biển số xe', 'text', 1, NULL, 0),
(31, 4, 2, 'IMEI', 'text', 1, NULL, 0),
(32, 5, 1, 'Biển số xe', 'text', 1, NULL, 0),
(33, 5, 2, 'Loại phù hiệu', 'text', 0, 'VD: kinh doanh vận tải...', 0),
(34, 1, 4, 'So SIM', 'text', 0, NULL, 0);

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

--
-- Đang đổ dữ liệu cho bảng `order_workflow_steps`
--

INSERT INTO `order_workflow_steps` (`id`, `seq`, `code`, `label`, `requires_photo`, `photo_min_count`, `update_roles`, `is_terminal`, `is_system`, `is_deleted`) VALUES
(9, 0, 'pending', 'Cho duyet', 0, 0, '[\"admin\", \"customer\"]', 0, 1, 0),
(10, 10, 'confirmed', 'Len don', 0, 0, '[\"admin\"]', 0, 0, 0),
(11, 20, 'in_progress', 'Dang xu ly', 0, 0, '[\"admin\", \"ktv\"]', 0, 0, 0),
(12, 30, 'done', 'Da xong', 0, 0, '[\"admin\", \"ktv\"]', 1, 0, 0),
(13, 99, 'cancelled', 'Da huy', 0, 0, '[\"admin\"]', 1, 1, 0);

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
  `status` enum('pending','paid','expired') NOT NULL DEFAULT 'pending',
  `qr_slot` tinyint(4) DEFAULT NULL,
  `pay_method` enum('cash','transfer','mixed') DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL,
  `paid_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `payment_requests`
--

INSERT INTO `payment_requests` (`id`, `code`, `customer_id`, `total_amount`, `paid_amount`, `remaining`, `status`, `qr_slot`, `pay_method`, `note`, `created_by`, `created_at`, `expires_at`, `paid_at`, `is_deleted`) VALUES
(1, 'YC-1505-001', 18, 280000, 0, 280000, 'pending', NULL, NULL, NULL, 1, '2026-05-15 02:17:50', '2026-05-18 02:17:50', NULL, 1),
(2, 'YC-1505-002', 19, 144506538, 144506538, 0, 'paid', NULL, 'cash', '', 1, '2026-05-15 09:12:32', '2026-05-18 09:12:32', '2026-05-15 09:12:57', 0),
(3, 'YC-1505-003', 19, 10681168, 5000000, 0, '', NULL, 'cash', '', 1, '2026-05-15 09:14:58', '2026-05-18 09:14:58', '2026-05-15 09:15:14', 0),
(4, 'YC-1505-004', 19, 155863046, 0, 155863046, 'pending', NULL, NULL, NULL, 1, '2026-05-15 20:25:26', '2026-05-18 20:25:26', NULL, 1),
(5, 'YC-1505-005', 4, 150000, 150000, 0, 'paid', NULL, 'cash', '', 1, '2026-05-15 20:35:20', '2026-05-18 20:35:20', '2026-05-15 21:15:02', 0),
(6, 'YC-1505-006', 19, 78717213, 0, 78717213, 'pending', NULL, NULL, NULL, 1, '2026-05-15 21:40:21', '2026-05-18 21:40:21', NULL, 1),
(7, 'YC-1505-007', 19, 179236, 0, 179236, 'pending', NULL, NULL, NULL, 1, '2026-05-15 22:23:43', '2026-05-18 22:23:43', NULL, 1),
(8, 'YC-05042060', 19, 165000, 0, 165000, 'pending', NULL, NULL, NULL, 1, '2026-05-16 11:17:22', '2026-05-19 11:17:22', NULL, 1),
(9, 'YC-05777723', 19, 119000, 0, 119000, 'pending', NULL, NULL, NULL, 1, '2026-05-16 11:29:37', '2026-05-19 11:29:37', NULL, 1),
(10, 'YC-32662215', 19, 6181168, 6181168, 0, 'paid', NULL, 'cash', '', 1, '2026-05-16 18:57:42', '2026-05-19 18:57:42', '2026-05-16 18:57:49', 0),
(11, 'YC-32679234', 4, 6001500, 6001500, 0, 'paid', NULL, 'cash', '', 1, '2026-05-16 18:57:59', '2026-05-19 18:57:59', '2026-05-16 18:58:05', 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `payment_request_items`
--

CREATE TABLE `payment_request_items` (
  `id` int(11) NOT NULL,
  `request_id` int(11) NOT NULL,
  `target_type` enum('order','opening_balance','previous_request') NOT NULL,
  `target_id` int(11) DEFAULT NULL,
  `amount` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `payment_request_items`
--

INSERT INTO `payment_request_items` (`id`, `request_id`, `target_type`, `target_id`, `amount`) VALUES
(1, 1, 'order', 81, 140000),
(2, 1, 'order', 82, 140000),
(3, 2, 'order', 106, 2585384),
(4, 2, 'order', 107, 141921154),
(5, 3, 'order', 108, 10681168),
(6, 4, 'order', 100, 5048926),
(7, 4, 'order', 101, 66186122),
(8, 4, 'order', 102, 5910785),
(9, 4, 'order', 103, 71004104),
(10, 4, 'order', 104, 7485298),
(11, 4, 'order', 105, 227811),
(12, 5, 'order', 77, 40000),
(13, 5, 'order', 78, 110000),
(14, 6, 'order', 103, 71004104),
(15, 6, 'order', 104, 7485298),
(16, 6, 'order', 105, 227811),
(17, 7, 'order', 97, 179236),
(18, 8, 'order', 118, 165000),
(19, 9, 'order', 113, 119000),
(20, 10, 'opening_balance', 19, 500000),
(21, 10, '', 3, 5681168),
(22, 11, 'opening_balance', 4, 6001500);

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
(1, 'retail', 'Khách lẻ', 1, 1, 0),
(2, 'wholesale', 'đại lí cấp 3', 2, 0, 0),
(3, 'dealer', 'đại lí cấp 2', 3, 0, 0),
(6, 'dai-li-cap-1', 'đại lí cấp 1', 0, 0, 0),
(7, 'i-l-c-p-2', 'khác', 5, 0, 1);

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
(1, 'VT-01', 'Thiet bi dinh vi VT-01', 1, NULL, NULL, 12, 1200000, 'Thiet bi dinh vi xe may, nguon DC 9-36V', 1),
(2, '123123', 'Thiet bi dinh vi VT-01', 1, '/uploads/products/1777119310327-10f8d5982ecb.jpg', '/uploads/products/1777119310330-ba53978a874d.jpg', 12, 2149000, NULL, 0),
(3, 'VT-02', 'Định vị VT-02 Pro (4G)', 5, NULL, NULL, 24, 1200000, 'Sản phẩm mẫu cho test', 0),
(4, 'CAM-01', 'Camera AHD 1080p', 6, NULL, NULL, 12, 600000, 'Sản phẩm mẫu cho test', 0),
(5, 'MDVR-04', 'Đầu ghi MDVR 4 kênh', 7, NULL, NULL, 24, 2500000, 'Sản phẩm mẫu cho test', 0),
(6, 'CAB-OBD', 'Cáp OBD II', 4, NULL, NULL, 6, 80000, 'Sản phẩm mẫu cho test', 0),
(7, 'HR21421', 'sản phẩm A', 1, '/uploads/products/1777353371046-24670025103b.jpg', '/uploads/products/1777353371046-24670025103b.jpg', 12, 10000000, 'đây là mô tả ngắn', 0),
(8, 'cccd', 'Thiet bi dinh vi VT-01', 1, '/uploads/products/1777177761437-82c5eebef5ef.jpg', '/uploads/products/1777177761440-e258f032044f.jpg', 12, 100000, 'Cách hoạt động: Thay vì gửi hình ảnh hay video (rất nặng), nó ghi lại toàn bộ sự thay đổi của mã HTML và chuyển động chuột dưới dạng dữ liệu JSON siêu nhẹ. Sau đó, ở phía bạn, hệ thống sẽ \"diễn\" lại các dữ liệu đó trên một trình duyệt ảo.', 0),
(9, 'RENEW', 'Phí gia hạn dịch vụ GPS', NULL, NULL, NULL, 0, 0, NULL, 0),
(10, 'REPAIR_SERVICE', 'Công sửa chữa GPS', NULL, NULL, NULL, 0, 0, NULL, 1),
(11, 'giahan12', 'gia hạn A (12 tháng)', NULL, NULL, NULL, 12, 457, NULL, 0);

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
(4, 1, 'Nguon', 'DC 9-36V', 1, 'top'),
(5, 1, 'Pin', 'Lithium 500mAh', 2, 'top'),
(6, 1, 'Cong dau ra', 'ACC, GND', 3, 'bottom'),
(9, 8, 'alo alo alo', 'dc -9-6', 1, 'top');

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
(1, 1, 'text', 'VT-01 la thiet bi dinh vi xe may nho gon, lap dat trong 15 phut, phu hop voi xe so/xe ga.', NULL, 1),
(2, 1, 'image', '/uploads/products/sample-vt01-1.jpg', 'Mat truoc thiet bi VT-01', 2),
(3, 1, 'text', 'Pin du phong 800mAh, hoat dong toi 24h khi mat nguon. Chong nuoc IP67 — di mua khong sao.', NULL, 3),
(13, 8, 'text', 'http://localhost:5170/customer/products.html', NULL, 1),
(14, 8, 'image', '/uploads/products/1777193897234-1445842b9599.jpg', 'http://localhost:5170/customer/products.html', 2),
(15, 8, 'text', 'http://localhost:5170/customer/products.html', NULL, 3),
(16, 8, 'image', '/uploads/products/1777193911482-69a411be1c4e.jpg', NULL, 4),
(25, 7, 'text', 'Cách hoạt động: Thay vì gửi hình ảnh hay video (rất nặng), nó ghi lại toàn bộ sự thay đổi của mã HTML và chuyển động chuột dưới dạng dữ liệu JSON siêu nhẹ. Sau đó, ở phía bạn, hệ thống sẽ \"diễn\" lại các dữ liệu đó trên một trình duyệt ảo.', NULL, 1),
(26, 7, 'image', 'https://dinhvitoancau.vn/uploads/2019/TC500-Tinh-nang-noi-bat.jpg', 'Cách hoạt động: Thay vì gửi hình ảnh hay video (rất nặng), nó ghi lại toàn bộ sự thay đổi của mã HTML và chuyển động chuột dưới dạng dữ liệu JSON siêu nhẹ. Sau đó, ở phía bạn, hệ thống sẽ \"diễn\" lại các dữ liệu đó trên một trình duyệt ảo.', 2),
(27, 7, 'text', 'Cách hoạt động: Thay vì gửi hình ảnh hay video (rất nặng), nó ghi lại toàn bộ sự thay đổi của mã HTML và chuyển động chuột dưới dạng dữ liệu JSON siêu nhẹ. Sau đó, ở phía bạn, hệ thống sẽ \"diễn\" lại các dữ liệu đó trên một trình duyệt ảo.', NULL, 3),
(28, 7, 'image', '/uploads/products/1777177480190-d688596cb16c.png', NULL, 4),
(29, 7, 'video', 'http://youtube.com/watch?v=UyhGJdyLVmU&list=RDUyhGJdyLVmU&start_radio=1', NULL, 5),
(30, 4, 'text', 'http://localhost:5170/customerhttp://localhost:5170/customerhttp://localhost:5170/customerhttp://localhost:5170/customerhttp://localhost:5170/customerhttp://localhost:5170/customer', NULL, 1);

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
(4, 1, 1, 1490000, 1),
(5, 1, 2, 1300000, 2),
(6, 1, 3, 1250000, 3),
(7, 2, 1, 123132000, 1),
(8, 3, 1, 2500000, 1),
(9, 3, 2, 2000000, 2),
(12, 5, 1, 4500000, 1),
(13, 5, 2, 3800000, 2),
(14, 6, 1, 200000, 1),
(15, 6, 2, 150000, 2),
(21, 8, 1, 15000, 1),
(22, 8, 2, 12000, 2),
(23, 8, 3, 10000, 3),
(27, 7, 1, 10000, 1),
(28, 4, 1, 100000, 1),
(29, 4, 6, 90000, 2);

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
(1, 16),
(2, 17),
(3, 4),
(4, 15),
(5, 84),
(6, 33),
(7, 85),
(8, 10);

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
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `remittances`
--

INSERT INTO `remittances` (`id`, `staff_id`, `amount`, `total_holding`, `remaining`, `method`, `receipt_url`, `note`, `remitted_at`, `approved_by`, `approved_at`, `reject_reason`, `status`, `is_deleted`) VALUES
(1, 3, 2500000, 0, 0, 'transfer', NULL, NULL, '2026-04-28 02:04:29', 1, '2026-04-28 02:56:32', NULL, 'approved', 0),
(2, 3, 123157000, 0, 0, 'cash', NULL, NULL, '2026-04-28 02:55:49', 1, '2026-04-28 02:56:25', NULL, 'approved', 0),
(3, 3, 7040000, 0, 0, 'cash', NULL, 'Admin xac nhan truc tiep tu don #8', '2026-04-28 14:30:23', 1, '2026-04-28 14:30:23', NULL, 'approved', 0),
(4, 3, 260000, 0, 0, 'transfer', NULL, 'Admin xac nhan truc tiep tu don #14', '2026-04-28 20:53:46', 1, '2026-04-28 20:53:46', NULL, 'approved', 0),
(5, 3, 1000000, 12859002, 11859002, 'cash', NULL, NULL, '2026-05-05 23:15:21', 1, '2026-05-05 23:15:21', NULL, 'approved', 0),
(6, 3, 1000000, 11859002, 10859002, 'cash', NULL, '1000000', '2026-05-05 23:48:23', 1, '2026-05-05 23:48:23', NULL, 'approved', 0),
(7, 3, 1000000, 10859002, 9859002, 'cash', NULL, NULL, '2026-05-05 23:48:35', 1, '2026-05-05 23:48:35', NULL, 'approved', 0),
(8, 3, 9000000, 9859002, 859002, 'cash', NULL, NULL, '2026-05-05 23:48:44', 1, '2026-05-05 23:48:44', NULL, 'approved', 0),
(9, 2, 200000, 200000, 0, 'cash', NULL, 'KTV nop tien thu ho', '2026-05-10 17:33:14', 1, '2026-05-10 17:33:14', NULL, 'approved', 0),
(10, 2, 200000, 200000, 0, 'cash', NULL, 'KTV nop tien thu ho', '2026-05-10 17:38:24', 1, '2026-05-10 17:38:24', NULL, 'approved', 0),
(11, 3, 2000000, 2859002, 859002, 'cash', NULL, NULL, '2026-05-12 01:40:54', 1, '2026-05-12 01:40:54', NULL, 'approved', 0),
(12, 2, 200000, 200000, 0, 'cash', NULL, 'KTV nop tien thu ho', '2026-05-13 15:06:07', 1, '2026-05-13 15:06:07', NULL, 'approved', 0),
(13, 2, 200000, 200000, 0, 'cash', NULL, 'KTV nop tien thu ho', '2026-05-13 15:24:04', 1, '2026-05-13 15:24:04', NULL, 'approved', 0),
(14, 3, 70000, 5929002, 5859002, 'cash', NULL, 'BA settle BA-1778661347307', '2026-05-13 15:35:47', 1, '2026-05-13 15:35:47', NULL, 'approved', 0),
(15, 3, 70000, 5929002, 5859002, 'cash', NULL, 'BA settle BA-1778661943963', '2026-05-13 15:45:44', 1, '2026-05-13 15:45:44', NULL, 'approved', 0),
(16, 3, 6859001, 6859001, 0, 'cash', NULL, NULL, '2026-05-15 08:33:52', 1, '2026-05-15 08:33:52', NULL, 'approved', 0),
(17, 3, 110000, 110000, 0, 'cash', NULL, NULL, '2026-05-15 08:50:57', 1, '2026-05-15 08:50:57', NULL, 'approved', 0),
(18, 3, 564761052, 564761052, 0, 'cash', NULL, NULL, '2026-05-15 09:14:21', 1, '2026-05-15 09:14:21', NULL, 'approved', 0);

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
(1, 'admin', '$2a$10$Mk1UHzWUfeTrGGykMmpckOZdKukgHcSqtRQvXAZpqyudD/HYkXrOq', 'Quan tri vien', 'admin', NULL, NULL, NULL, NULL, NULL, 0, '2026-04-25 10:36:15', '2026-05-10 11:10:42', 'offline', 0.00, 0),
(2, 'ktv01', '$2a$10$HRV2uqp5KUUOGmsnb1Z4nOk4dcDPf9uxDrPSibpA1/Nac5rXpmkKu', 'Trần Minh', 'kithuat', 'Quận 1, TP.HCM', '0911000001', NULL, 'ktv01@gpsviet.vn', NULL, 0, '2026-04-25 16:30:31', '2026-04-25 16:30:31', 'online', 4.50, 0),
(3, 'ktv02', '$2a$10$L4aIOLbgLmJAWHHrjqatQOPiQBtn3bmFhnhn2YmAe.8PnNS1itDjy', 'Lê Văn Hùng', 'kithuat', 'Quận 7, TP.HCM', '0911000002', NULL, 'ktv02@gpsviet.vn', '/uploads/avatars/1777307658207-576f07723087.jpg', 0, '2026-04-25 16:30:31', '2026-05-15 01:33:52', 'offline', 4.20, 0),
(4, 'ktv03', '$2a$10$HRV2uqp5KUUOGmsnb1Z4nOk4dcDPf9uxDrPSibpA1/Nac5rXpmkKu', 'Nguyễn Đức Thành', 'kithuat', 'Bình Dương', '0911000003', NULL, 'ktv03@gpsviet.vn', NULL, 0, '2026-04-25 16:30:31', '2026-04-25 16:30:31', 'online', 4.80, 0),
(5, 'botadmin', '$2a$10$NtsG/s/3Y3aoP/fvH6h1xuDvtQOOrVyH0pojC9Wrh0kOaMSQ5qKSK', 'Admin Bot Pentest', 'admin', NULL, '0900000099', NULL, 'botadmin@gpsviet.local', NULL, 0, '2026-05-10 11:06:38', '2026-05-10 11:11:12', 'offline', 0.00, 0),
(6, 'nv_test_001', '$2a$10$d1PspWzvTUqLM8p0Mr/xQund1pzOtFjF1Xtu3AI0tS6/EMOiy5Qn.', 'Nhan vien test', 'staff', NULL, NULL, NULL, NULL, NULL, 0, '2026-05-11 17:49:29', '2026-05-11 17:49:51', 'offline', 0.00, 0),
(7, 'nv338567', '$2a$10$sg5guJcSWZ0sCV5towJJ5eShELql82FH760NUiQ2foQljdDNGs2me', 'nhan vien', 'staff', 'Bình Dương', '0911000003', '00987654-0987', 'dinhdan45n2003@gmail.com', NULL, 0, '2026-05-11 18:34:10', '2026-05-11 18:34:10', 'offline', 0.00, 0);

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
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(21, 3, 1, 10, '2026-05-10 15:03:18'),
(24, 3, 7, 3, '2026-05-10 15:20:27'),
(25, 2, 6, 7, '2026-05-10 17:32:46');

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

--
-- Đang đổ dữ liệu cho bảng `staff_payroll_periods`
--

INSERT INTO `staff_payroll_periods` (`id`, `staff_id`, `period`, `from_date`, `to_date`, `base_salary`, `insurance_amount`, `advance_amount`, `extras_json`, `rows_json`, `total_revenue`, `total_wage`, `total_extras`, `final_amount`, `note`, `finalized_at`, `finalized_by`, `unfinalized_at`, `unfinalized_by`, `is_deleted`) VALUES
(1, 7, '2026-05', '2026-05-01', '2026-05-31', 5000000, 0, 0, '[{\"note\":\"ađâsd\",\"amount\":300000}]', '[]', 0, 0, 300000, 5300000, '', '2026-05-12 14:56:38', 1, NULL, NULL, 0);

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
) ;

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
(1, 'CAP-0605-001', 3, 'approved', NULL, 1, '2026-05-06 09:01:49', 1, '2026-05-06 16:01:54', NULL, NULL, NULL, 30, 0),
(2, 'CAP-0605-002', 3, 'received', NULL, 1, '2026-05-06 09:03:07', 1, '2026-05-06 16:03:09', '2026-05-08 22:35:23', 'https://i.ibb.co/DgpstHT4/issue-CAP-0605-002.png', NULL, 31, 0);

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
) ;

--
-- Đang đổ dữ liệu cho bảng `staff_stock_issue_items`
--

INSERT INTO `staff_stock_issue_items` (`id`, `issue_id`, `product_id`, `qty_requested`, `qty_approved`, `imei_list`, `note`) VALUES
(1, 1, 2, 1, 1, '1234', NULL),
(2, 2, 7, 10, 10, NULL, NULL);

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

--
-- Đang đổ dữ liệu cho bảng `stock_items`
--

INSERT INTO `stock_items` (`id`, `product_id`, `supplier_id`, `identifier`, `status`, `held_by_staff_id`, `import_price`, `import_date`, `note`, `is_deleted`, `held_since`) VALUES
(1, 1, 1, '868290000000001', 'available', NULL, 1200000, '2026-04-10', NULL, 0, NULL),
(2, 1, 1, '868290000000002', 'available', NULL, 1200000, '2026-04-10', NULL, 0, NULL),
(3, 1, 1, '868290000000003', 'available', NULL, 1200000, '2026-04-10', 'Hang demo', 0, NULL),
(4, 1, 1, NULL, 'available', NULL, 1200000, '2026-04-10', 'Phu kien khong co IMEI', 0, NULL),
(5, 1, 3, '868290000000004', 'available', NULL, 800000, '2026-04-25', NULL, 0, NULL),
(6, 1, 3, NULL, 'available', NULL, 800000, '2026-04-25', 'Phụ kiện không IMEI', 0, NULL),
(7, 3, 4, '868290000000101', 'available', NULL, 1200000, '2026-04-25', NULL, 0, NULL),
(8, 3, 4, '868290000000102', 'available', NULL, 1200000, '2026-04-25', NULL, 0, NULL),
(9, 3, 4, '868290000000103', 'available', NULL, 1200000, '2026-04-25', NULL, 0, NULL),
(10, 3, 4, '868290000000104', 'available', NULL, 1200000, '2026-04-25', NULL, 0, NULL),
(11, 4, 2, 'CAM2024-001', 'available', NULL, 600000, '2026-04-25', NULL, 0, NULL),
(12, 4, 2, 'CAM2024-002', 'available', NULL, 600000, '2026-04-25', NULL, 0, NULL),
(13, 6, 3, NULL, 'available', NULL, 80000, '2026-04-25', 'Cáp OBD', 0, NULL);

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
  `ref_stock_take_id` int(11) DEFAULT NULL,
  `supplier_id` int(11) DEFAULT NULL,
  `created_by_staff_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_voided` tinyint(1) NOT NULL DEFAULT 0,
  `voided_at` datetime DEFAULT NULL,
  `voided_reason` varchar(500) DEFAULT NULL,
  `voided_by_receipt_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `stock_receipts`
--

INSERT INTO `stock_receipts` (`id`, `code`, `kind`, `reason_code`, `reason_text`, `ref_order_id`, `ref_staff_id`, `ref_stock_take_id`, `supplier_id`, `created_by_staff_id`, `created_at`, `is_voided`, `voided_at`, `voided_reason`, `voided_by_receipt_id`) VALUES
(3, 'PN-260428-001', 'in', 'import_supplier', 'nhập kho', NULL, NULL, NULL, 3, 1, '2026-04-28 05:52:01', 0, NULL, NULL, NULL),
(4, 'PN-260428-002', 'in', 'import_supplier', 'MDVR-04', NULL, NULL, NULL, 2, 1, '2026-04-28 05:52:50', 0, NULL, NULL, NULL),
(9, 'PN-260428-004', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, 1, '2026-04-28 06:51:17', 0, NULL, NULL, NULL),
(15, 'PN-260428-005', 'in', 'technician_return', NULL, NULL, 3, NULL, NULL, 3, '2026-04-28 07:03:12', 0, NULL, NULL, NULL),
(16, 'PN-260428-006', 'in', 'technician_return', NULL, NULL, 3, NULL, NULL, 3, '2026-04-28 07:03:31', 0, NULL, NULL, NULL),
(17, 'PN-260428-007', 'in', 'technician_return', NULL, NULL, 3, NULL, NULL, 3, '2026-04-28 07:03:33', 0, NULL, NULL, NULL),
(18, 'PN-260428-008', 'in', 'technician_return', NULL, NULL, 3, NULL, NULL, 3, '2026-04-28 07:03:34', 0, NULL, NULL, NULL),
(20, 'PN-260428-009', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, 1, '2026-04-28 13:31:02', 0, NULL, NULL, NULL),
(23, 'PN-260429-001', 'in', 'import_supplier', NULL, NULL, NULL, NULL, 4, 1, '2026-04-29 03:45:37', 0, NULL, NULL, NULL),
(25, 'PN-260429-002', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, 1, '2026-04-29 04:11:16', 0, NULL, NULL, NULL),
(30, 'PX-260506-001', 'out', 'staff_issue', 'Cap SP cho KTV qua phieu CAP-0605-001', NULL, 3, NULL, NULL, 1, '2026-05-06 09:01:54', 0, NULL, NULL, NULL),
(31, 'PX-260506-002', 'out', 'staff_issue', 'Cap SP cho KTV qua phieu CAP-0605-002', NULL, 3, NULL, NULL, 1, '2026-05-06 09:03:09', 0, NULL, NULL, NULL),
(34, 'PN-260508-001', 'in', 'adjust_plus', 'thấy 12 cáu', NULL, NULL, NULL, NULL, 1, '2026-05-08 16:21:17', 0, NULL, NULL, NULL),
(37, 'PN-260510-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, 1, '2026-05-10 08:02:33', 0, NULL, NULL, NULL),
(38, 'PX-260510-001', 'out', 'staff_grant', NULL, NULL, 3, NULL, NULL, 1, '2026-05-10 08:03:18', 0, NULL, NULL, NULL),
(40, 'PN-260510-002', 'in', 'import_supplier', NULL, NULL, NULL, NULL, 3, 1, '2026-05-10 08:20:11', 0, NULL, NULL, NULL),
(41, 'PX-260510-002', 'out', 'staff_grant', NULL, NULL, 3, NULL, NULL, 1, '2026-05-10 08:20:27', 0, NULL, NULL, NULL),
(42, 'PX-260510-003', 'out', 'order_consume', NULL, 35, 3, NULL, NULL, 3, '2026-05-10 08:20:38', 0, NULL, NULL, NULL),
(43, 'PN-260510-003', 'in', 'import_supplier', 'E2E test nhap kho', NULL, NULL, NULL, 2, 1, '2026-05-10 10:32:46', 0, NULL, NULL, NULL),
(44, 'PX-260510-004', 'out', 'staff_grant', 'E2E test grant', NULL, 2, NULL, NULL, 1, '2026-05-10 10:32:46', 0, NULL, NULL, NULL),
(45, 'PN-260510-004', 'in', 'import_supplier', 'E2E test nhap kho', NULL, NULL, NULL, 2, 1, '2026-05-10 10:33:14', 0, NULL, NULL, NULL),
(46, 'PX-260510-005', 'out', 'staff_grant', 'E2E test grant', NULL, 2, NULL, NULL, 1, '2026-05-10 10:33:14', 0, NULL, NULL, NULL),
(47, 'PX-260510-006', 'out', 'order_consume', NULL, 37, 2, NULL, NULL, 2, '2026-05-10 10:33:14', 0, NULL, NULL, NULL),
(48, 'PN-260510-005', 'in', 'import_supplier', 'E2E test nhap kho', NULL, NULL, NULL, 2, 1, '2026-05-10 10:38:24', 0, NULL, NULL, NULL),
(49, 'PX-260510-007', 'out', 'staff_grant', 'E2E test grant', NULL, 2, NULL, NULL, 1, '2026-05-10 10:38:24', 0, NULL, NULL, NULL),
(50, 'PX-260510-008', 'out', 'order_consume', NULL, 38, 2, NULL, NULL, 2, '2026-05-10 10:38:24', 0, NULL, NULL, NULL),
(51, 'PN-260510-006', 'in', 'import_supplier', 'Nhap kho test boi admin-pentest', NULL, NULL, NULL, 3, 1, '2026-05-10 11:07:40', 0, NULL, NULL, NULL),
(52, 'PN-260510-007', 'in', 'import_supplier', NULL, NULL, NULL, NULL, 3, 1, '2026-05-10 11:07:54', 1, '2026-05-10 18:08:04', 'Phieu test bug IMEI khong validate', 53),
(53, 'PX-260510-009', 'out', 'import_supplier_void', 'Huy phieu PN-260510-007: Phieu test bug IMEI khong validate', NULL, NULL, NULL, 3, 1, '2026-05-10 11:08:04', 0, NULL, NULL, NULL),
(54, 'PX-260510-010', 'out', 'staff_grant', 'cap cho don 52', NULL, 2, NULL, NULL, 1, '2026-05-10 11:09:17', 0, NULL, NULL, NULL),
(55, 'PX-260511-001', 'out', 'staff_grant', NULL, NULL, 3, NULL, NULL, 1, '2026-05-11 13:07:13', 0, NULL, NULL, NULL),
(57, 'PX-260512-001', 'out', 'order_consume', NULL, 67, 3, NULL, NULL, 3, '2026-05-11 18:38:11', 0, NULL, NULL, NULL),
(58, 'PX-260512-002', 'out', 'staff_grant', NULL, NULL, 3, NULL, NULL, 7, '2026-05-12 03:43:48', 0, NULL, NULL, NULL),
(59, 'PX-260512-003', 'out', 'staff_grant', NULL, NULL, 3, NULL, NULL, 7, '2026-05-12 04:35:44', 0, NULL, NULL, NULL),
(60, 'PX-260512-004', 'out', 'staff_grant', NULL, NULL, 3, NULL, NULL, 7, '2026-05-12 05:09:12', 0, NULL, NULL, NULL),
(61, 'PX-260512-005', 'out', 'order_consume', NULL, 34, 3, NULL, NULL, 3, '2026-05-12 08:34:29', 0, NULL, NULL, NULL),
(62, 'PX-260512-006', 'out', 'order_consume', NULL, 71, 3, NULL, NULL, 3, '2026-05-12 10:48:17', 0, NULL, NULL, NULL),
(63, 'PX-260513-001', 'out', 'order_consume', NULL, 76, 3, NULL, NULL, 3, '2026-05-12 18:16:08', 0, NULL, NULL, NULL),
(64, 'PX-260513-002', 'out', 'order_consume', NULL, 78, 3, NULL, NULL, 3, '2026-05-12 19:52:29', 0, NULL, NULL, NULL),
(65, 'PN-260513-001', 'in', 'import_supplier', 'E2E test nhap kho', NULL, NULL, NULL, 2, 1, '2026-05-13 08:06:07', 0, NULL, NULL, NULL),
(66, 'PX-260513-003', 'out', 'staff_grant', 'E2E test grant', NULL, 2, NULL, NULL, 1, '2026-05-13 08:06:07', 0, NULL, NULL, NULL),
(67, 'PX-260513-004', 'out', 'order_consume', NULL, 79, 2, NULL, NULL, 2, '2026-05-13 08:06:07', 0, NULL, NULL, NULL),
(68, 'PN-260513-002', 'in', 'import_supplier', 'E2E test nhap kho', NULL, NULL, NULL, 2, 1, '2026-05-13 08:24:04', 0, NULL, NULL, NULL),
(69, 'PX-260513-005', 'out', 'staff_grant', 'E2E test grant', NULL, 2, NULL, NULL, 1, '2026-05-13 08:24:04', 0, NULL, NULL, NULL),
(70, 'PX-260513-006', 'out', 'order_consume', NULL, 80, 2, NULL, NULL, 2, '2026-05-13 08:24:04', 0, NULL, NULL, NULL),
(71, 'PN-260513-003', 'in', 'import_supplier', 'BA audit import BA-1778661347307', NULL, NULL, NULL, 2, 1, '2026-05-13 08:35:47', 0, NULL, NULL, NULL),
(72, 'PX-260513-007', 'out', 'staff_grant', 'BA audit grant BA-1778661347307', NULL, 3, NULL, NULL, 1, '2026-05-13 08:35:47', 0, NULL, NULL, NULL),
(73, 'PX-260513-008', 'out', 'order_consume', NULL, 81, 3, NULL, NULL, 3, '2026-05-13 08:35:47', 0, NULL, NULL, NULL),
(74, 'PN-260513-004', 'in', 'import_supplier', 'BA audit import BA-1778661943963', NULL, NULL, NULL, 2, 1, '2026-05-13 08:45:44', 0, NULL, NULL, NULL),
(75, 'PX-260513-009', 'out', 'staff_grant', 'BA audit grant BA-1778661943963', NULL, 3, NULL, NULL, 1, '2026-05-13 08:45:44', 0, NULL, NULL, NULL),
(76, 'PX-260513-010', 'out', 'order_consume', NULL, 82, 3, NULL, NULL, 3, '2026-05-13 08:45:44', 0, NULL, NULL, NULL),
(77, 'PX-260515-001', 'out', 'order_consume', NULL, 85, 3, NULL, NULL, 3, '2026-05-15 01:30:35', 0, NULL, NULL, NULL),
(78, 'PX-260515-002', 'out', 'order_consume', NULL, 87, 3, NULL, NULL, 3, '2026-05-15 01:46:54', 0, NULL, NULL, NULL),
(79, 'PX-260515-003', 'out', 'order_consume', NULL, 77, 3, NULL, NULL, 3, '2026-05-15 01:49:16', 0, NULL, NULL, NULL),
(80, 'PX-260515-004', 'out', 'order_consume', NULL, 89, 3, NULL, NULL, 3, '2026-05-15 02:03:55', 0, NULL, NULL, NULL),
(81, 'PX-260515-005', 'out', 'order_consume', NULL, 90, 3, NULL, NULL, 3, '2026-05-15 02:03:55', 0, NULL, NULL, NULL),
(82, 'PX-260515-006', 'out', 'order_consume', NULL, 91, 3, NULL, NULL, 3, '2026-05-15 02:03:55', 0, NULL, NULL, NULL),
(83, 'PX-260515-007', 'out', 'order_consume', NULL, 92, 3, NULL, NULL, 3, '2026-05-15 02:03:55', 0, NULL, NULL, NULL),
(84, 'PX-260515-008', 'out', 'order_consume', NULL, 93, 3, NULL, NULL, 3, '2026-05-15 02:03:55', 0, NULL, NULL, NULL),
(85, 'PX-260515-009', 'out', 'order_consume', NULL, 94, 3, NULL, NULL, 3, '2026-05-15 02:03:55', 0, NULL, NULL, NULL),
(86, 'PX-260515-010', 'out', 'order_consume', NULL, 95, 3, NULL, NULL, 3, '2026-05-15 02:03:55', 0, NULL, NULL, NULL),
(87, 'PX-260515-011', 'out', 'order_consume', NULL, 96, 3, NULL, NULL, 3, '2026-05-15 02:03:55', 0, NULL, NULL, NULL),
(88, 'PX-260515-012', 'out', 'order_consume', NULL, 97, 3, NULL, NULL, 3, '2026-05-15 02:03:55', 0, NULL, NULL, NULL),
(89, 'PX-260515-013', 'out', 'order_consume', NULL, 98, 3, NULL, NULL, 3, '2026-05-15 02:03:55', 0, NULL, NULL, NULL),
(90, 'PX-260515-014', 'out', 'order_consume', NULL, 99, 3, NULL, NULL, 3, '2026-05-15 02:03:55', 0, NULL, NULL, NULL),
(91, 'PX-260515-015', 'out', 'order_consume', NULL, 100, 3, NULL, NULL, 3, '2026-05-15 02:03:55', 0, NULL, NULL, NULL),
(92, 'PX-260515-016', 'out', 'order_consume', NULL, 101, 3, NULL, NULL, 3, '2026-05-15 02:03:55', 0, NULL, NULL, NULL),
(93, 'PX-260515-017', 'out', 'order_consume', NULL, 102, 3, NULL, NULL, 3, '2026-05-15 02:03:55', 0, NULL, NULL, NULL),
(94, 'PX-260515-018', 'out', 'order_consume', NULL, 103, 3, NULL, NULL, 3, '2026-05-15 02:03:55', 0, NULL, NULL, NULL),
(95, 'PX-260515-019', 'out', 'order_consume', NULL, 104, 3, NULL, NULL, 3, '2026-05-15 02:03:55', 0, NULL, NULL, NULL),
(96, 'PX-260515-020', 'out', 'order_consume', NULL, 105, 3, NULL, NULL, 3, '2026-05-15 02:03:55', 0, NULL, NULL, NULL),
(97, 'PX-260515-021', 'out', 'order_consume', NULL, 106, 3, NULL, NULL, 3, '2026-05-15 02:03:55', 0, NULL, NULL, NULL),
(98, 'PX-260515-022', 'out', 'order_consume', NULL, 107, 3, NULL, NULL, 3, '2026-05-15 02:03:55', 0, NULL, NULL, NULL),
(99, 'PX-260515-023', 'out', 'order_consume', NULL, 108, 3, NULL, NULL, 3, '2026-05-15 02:03:55', 0, NULL, NULL, NULL),
(100, 'PX-260516-001', 'out', 'order_consume', NULL, 113, 3, NULL, NULL, 3, '2026-05-15 17:04:41', 0, NULL, NULL, NULL);

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
(1, 1, 3, 1, NULL, NULL, NULL),
(2, 2, 3, 1, NULL, NULL, NULL),
(3, 3, 7, 13, 200000, NULL, NULL),
(4, 4, 5, 100, 100000, NULL, 'MDVR-04'),
(5, 5, 5, 1, NULL, '13123123123\n34534534535', NULL),
(6, 5, 7, 1, NULL, NULL, NULL),
(8, 7, 5, 1, NULL, NULL, NULL),
(9, 7, 7, 1, NULL, NULL, NULL),
(10, 8, 3, 1, NULL, NULL, NULL),
(11, 8, 5, 1, NULL, NULL, NULL),
(12, 9, 8, 10, NULL, NULL, NULL),
(13, 10, 4, 1, NULL, NULL, NULL),
(14, 10, 8, 1, NULL, NULL, NULL),
(15, 11, 3, 1, NULL, NULL, NULL),
(16, 12, 5, 1, NULL, NULL, NULL),
(17, 13, 4, 1, NULL, NULL, NULL),
(18, 14, 8, 1, NULL, NULL, NULL),
(19, 15, 3, 2, NULL, NULL, NULL),
(20, 16, 5, 1, NULL, NULL, NULL),
(21, 17, 4, 1, NULL, NULL, NULL),
(22, 18, 8, 1, NULL, NULL, NULL),
(23, 19, 6, 1, NULL, NULL, NULL),
(24, 20, 6, 10, NULL, NULL, NULL),
(25, 21, 6, 1, NULL, NULL, NULL),
(26, 22, 4, 1, NULL, NULL, NULL),
(27, 23, 2, 20, NULL, NULL, NULL),
(28, 24, 2, 1, NULL, NULL, NULL),
(29, 24, 8, 1, NULL, NULL, NULL),
(30, 25, 4, 20, NULL, NULL, NULL),
(31, 26, 4, 2, NULL, NULL, NULL),
(32, 26, 5, 1, NULL, NULL, NULL),
(33, 26, 6, 1, NULL, NULL, NULL),
(34, 27, 4, 1, NULL, NULL, NULL),
(35, 28, 4, 1, NULL, NULL, NULL),
(36, 29, 6, 3, NULL, NULL, NULL),
(37, 30, 2, 1, NULL, '1234', NULL),
(38, 31, 7, 10, NULL, NULL, NULL),
(39, 32, 2, 1, NULL, NULL, NULL),
(40, 32, 4, 1, NULL, NULL, NULL),
(41, 33, 4, 1, NULL, NULL, NULL),
(42, 33, 6, 1, NULL, NULL, NULL),
(43, 34, 8, 12, NULL, NULL, NULL),
(44, 37, 1, 20, NULL, NULL, NULL),
(45, 38, 1, 10, NULL, NULL, NULL),
(46, 38, 5, 5, NULL, NULL, NULL),
(47, 38, 8, 10, NULL, NULL, NULL),
(49, 40, 7, 100, NULL, NULL, NULL),
(50, 41, 7, 10, NULL, NULL, NULL),
(51, 42, 5, 1, NULL, NULL, NULL),
(52, 42, 7, 1, NULL, NULL, NULL),
(53, 42, 8, 2, NULL, NULL, NULL),
(54, 43, 6, 5, 80000, NULL, NULL),
(55, 44, 6, 2, NULL, NULL, NULL),
(56, 45, 6, 5, 80000, NULL, NULL),
(57, 46, 6, 2, NULL, NULL, NULL),
(58, 47, 6, 1, NULL, NULL, NULL),
(59, 48, 6, 5, 80000, NULL, NULL),
(60, 49, 6, 2, NULL, NULL, NULL),
(61, 50, 6, 1, NULL, NULL, NULL),
(62, 51, 6, 5, 80000, 'PENTEST-CAB-001,PENTEST-CAB-002,PENTEST-CAB-003,PENTEST-CAB-004,PENTEST-CAB-005', 'lo test pentest'),
(63, 52, 6, 5, NULL, 'DUPE-IMEI,DUPE-IMEI', NULL),
(64, 53, 6, 5, NULL, 'DUPE-IMEI,DUPE-IMEI', NULL),
(65, 54, 6, 1, NULL, 'PENTEST-CAB-001', NULL),
(66, 55, 5, 5, NULL, NULL, NULL),
(67, 57, 3, 1, NULL, NULL, NULL),
(68, 58, 8, 1, NULL, NULL, NULL),
(69, 59, 5, 5, NULL, '23456789\n3456789\n5678900', NULL),
(70, 60, 7, 8, NULL, '3456789\n4567890\n3456782', NULL),
(71, 61, 3, 2, NULL, NULL, NULL),
(72, 61, 4, 1, NULL, NULL, NULL),
(73, 62, 5, 1, NULL, NULL, NULL),
(74, 63, 5, 2, NULL, NULL, NULL),
(75, 64, 7, 1, NULL, NULL, NULL),
(76, 65, 6, 5, 80000, NULL, NULL),
(77, 66, 6, 2, NULL, NULL, NULL),
(78, 67, 6, 1, NULL, NULL, NULL),
(79, 68, 6, 5, 80000, NULL, NULL),
(80, 69, 6, 2, NULL, NULL, NULL),
(81, 70, 6, 1, NULL, NULL, NULL),
(82, 71, 6, 3, 80000, NULL, NULL),
(83, 72, 6, 1, NULL, NULL, NULL),
(84, 73, 6, 1, NULL, NULL, NULL),
(85, 74, 6, 3, 80000, NULL, NULL),
(86, 75, 6, 1, NULL, NULL, NULL),
(87, 76, 6, 1, NULL, NULL, NULL),
(88, 77, 3, 1, NULL, NULL, NULL),
(89, 78, 4, 1, NULL, NULL, NULL),
(90, 79, 4, 1, NULL, NULL, NULL),
(91, 79, 7, 1, NULL, NULL, NULL),
(92, 80, 4, 2, NULL, NULL, NULL),
(93, 80, 6, 1, NULL, NULL, NULL),
(94, 80, 8, 2, NULL, NULL, NULL),
(95, 81, 3, 2, NULL, NULL, NULL),
(96, 81, 5, 1, NULL, NULL, NULL),
(97, 81, 7, 3, NULL, NULL, NULL),
(98, 82, 2, 2, NULL, NULL, NULL),
(99, 82, 4, 1, NULL, NULL, NULL),
(100, 82, 6, 1, NULL, NULL, NULL),
(101, 83, 3, 1, NULL, NULL, NULL),
(102, 83, 5, 2, NULL, NULL, NULL),
(103, 83, 9, 2, NULL, NULL, NULL),
(104, 84, 2, 1, NULL, NULL, NULL),
(105, 84, 4, 3, NULL, NULL, NULL),
(106, 84, 8, 2, NULL, NULL, NULL),
(107, 85, 3, 1, NULL, NULL, NULL),
(108, 85, 7, 2, NULL, NULL, NULL),
(109, 85, 9, 1, NULL, NULL, NULL),
(110, 86, 2, 2, NULL, NULL, NULL),
(111, 86, 6, 2, NULL, NULL, NULL),
(112, 86, 8, 1, NULL, NULL, NULL),
(113, 87, 5, 2, NULL, NULL, NULL),
(114, 87, 7, 1, NULL, NULL, NULL),
(115, 87, 9, 3, NULL, NULL, NULL),
(116, 88, 4, 2, NULL, NULL, NULL),
(117, 88, 6, 1, NULL, NULL, NULL),
(118, 88, 8, 1, NULL, NULL, NULL),
(119, 89, 3, 2, NULL, NULL, NULL),
(120, 89, 5, 1, NULL, NULL, NULL),
(121, 89, 7, 2, NULL, NULL, NULL),
(122, 90, 2, 2, NULL, NULL, NULL),
(123, 90, 4, 1, NULL, NULL, NULL),
(124, 90, 6, 3, NULL, NULL, NULL),
(125, 91, 3, 1, NULL, NULL, NULL),
(126, 91, 5, 1, NULL, NULL, NULL),
(127, 91, 9, 2, NULL, NULL, NULL),
(128, 92, 2, 1, NULL, NULL, NULL),
(129, 92, 4, 2, NULL, NULL, NULL),
(130, 92, 8, 2, NULL, NULL, NULL),
(131, 93, 3, 3, NULL, NULL, NULL),
(132, 93, 7, 2, NULL, NULL, NULL),
(133, 93, 9, 1, NULL, NULL, NULL),
(134, 94, 2, 1, NULL, NULL, NULL),
(135, 94, 6, 2, NULL, NULL, NULL),
(136, 94, 8, 1, NULL, NULL, NULL),
(137, 95, 5, 2, NULL, NULL, NULL),
(138, 95, 7, 1, NULL, NULL, NULL),
(139, 95, 9, 2, NULL, NULL, NULL),
(140, 96, 4, 2, NULL, NULL, NULL),
(141, 96, 6, 1, NULL, NULL, NULL),
(142, 96, 8, 3, NULL, NULL, NULL),
(143, 97, 3, 2, NULL, NULL, NULL),
(144, 97, 5, 1, NULL, NULL, NULL),
(145, 97, 7, 1, NULL, NULL, NULL),
(146, 98, 2, 2, NULL, NULL, NULL),
(147, 98, 4, 1, NULL, NULL, NULL),
(148, 98, 6, 2, NULL, NULL, NULL),
(149, 99, 3, 1, NULL, NULL, NULL),
(150, 99, 5, 3, NULL, NULL, NULL),
(151, 99, 9, 2, NULL, NULL, NULL),
(152, 100, 4, 1, NULL, NULL, NULL);

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
(1, 'KK-260428-001', 'draft', '2026-04-28 03:09:54', NULL, 1, NULL, NULL, 0, 0, 0),
(2, 'KK-260508-001', 'draft', '2026-05-08 23:09:31', NULL, 1, NULL, NULL, 0, 0, 0),
(3, 'KK-260510-001', 'cancelled', '2026-05-10 17:32:46', NULL, 1, NULL, 'E2E kiem ke test', 0, 0, 0),
(4, 'KK-260510-002', 'cancelled', '2026-05-10 17:33:14', NULL, 1, NULL, 'E2E kiem ke test', 0, 0, 0),
(5, 'KK-260510-003', 'cancelled', '2026-05-10 17:38:24', NULL, 1, NULL, 'E2E kiem ke test', 0, 0, 0),
(6, 'KK-260513-001', 'cancelled', '2026-05-13 15:06:07', NULL, 1, NULL, 'E2E kiem ke test', 0, 0, 0),
(7, 'KK-260513-002', 'cancelled', '2026-05-13 15:24:04', NULL, 1, NULL, 'E2E kiem ke test', 0, 0, 0);

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

--
-- Đang đổ dữ liệu cho bảng `stock_take_lines`
--

INSERT INTO `stock_take_lines` (`id`, `stock_take_id`, `product_id`, `system_qty`, `counted_qty`, `receipt_id`, `note`) VALUES
(1, 3, 6, 13, 3, NULL, NULL),
(2, 4, 6, 16, 3, NULL, NULL),
(3, 5, 6, 19, 3, NULL, NULL),
(4, 6, 6, 26, 3, NULL, NULL),
(5, 7, 6, 29, 3, NULL, NULL);

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
(1, 'Cong ty TNHH An Khang', '0281234567', '123 Le Loi, Q.1, TP.HCM', 'NCC chinh thiet bi dinh vi', 0),
(2, 'Skycool Vietnam', '0287654321', '45 Tran Hung Dao, Ha Noi', 'NCC camera + dau ghi MDVR', 0),
(3, 'Cty TNHH An Khang', '0281234567', '123 Lê Lợi, Q.1, TP.HCM', 'NCC chính thiết bị định vị', 0),
(4, 'TechGlobal', '0901111222', '789 Phạm Văn Đồng, TP.HCM', 'NCC hộp đen + định vị', 0);

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

--
-- Đang đổ dữ liệu cho bảng `warehouse_logs`
--

INSERT INTO `warehouse_logs` (`id`, `stock_item_id`, `kind`, `reason`, `order_id`, `staff_id`, `created_at`) VALUES
(1, 5, 'in', 'Seed test data', NULL, NULL, '2026-04-25 16:30:31'),
(2, 7, 'in', 'Seed test data', NULL, NULL, '2026-04-25 16:30:31'),
(3, 8, 'in', 'Seed test data', NULL, NULL, '2026-04-25 16:30:31'),
(4, 9, 'in', 'Seed test data', NULL, NULL, '2026-04-25 16:30:31'),
(5, 10, 'in', 'Seed test data', NULL, NULL, '2026-04-25 16:30:31'),
(6, 11, 'in', 'Seed test data', NULL, NULL, '2026-04-25 16:30:31'),
(7, 12, 'in', 'Seed test data', NULL, NULL, '2026-04-25 16:30:31');

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
  ADD KEY `idx_coll_order` (`order_id`);

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
  ADD KEY `idx_orders_end_customer` (`end_customer_id`);

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
  ADD KEY `idx_payment_pending` (`order_id`,`source`,`confirmed`);

--
-- Chỉ mục cho bảng `order_staff_commissions`
--
ALTER TABLE `order_staff_commissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_osc_order` (`order_id`),
  ADD KEY `idx_osc_staff` (`staff_id`),
  ADD KEY `idx_osc_carried` (`carried_at`);

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
-- Chỉ mục cho bảng `order_workflow_steps`
--
ALTER TABLE `order_workflow_steps`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_wfstep_seq` (`seq`,`is_deleted`);

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
-- Chỉ mục cho bảng `staff_payroll_periods`
--
ALTER TABLE `staff_payroll_periods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_spp_finalizer` (`finalized_by`),
  ADD KEY `idx_spp_staff_period` (`staff_id`,`period`),
  ADD KEY `idx_spp_period` (`period`),
  ADD KEY `idx_spp_staff_dates` (`staff_id`,`from_date`,`to_date`,`is_deleted`);

--
-- Chỉ mục cho bảng `staff_reviews`
--
ALTER TABLE `staff_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_review_staff` (`staff_id`),
  ADD KEY `idx_review_order` (`order_id`);

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
  ADD KEY `idx_receipts_stock_take` (`ref_stock_take_id`);

--
-- Chỉ mục cho bảng `stock_receipt_items`
--
ALTER TABLE `stock_receipt_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_receipt_items_receipt` (`receipt_id`),
  ADD KEY `idx_receipt_items_product` (`product_id`);

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
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `agency_collections`
--
ALTER TABLE `agency_collections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `collections`
--
ALTER TABLE `collections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT cho bảng `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `conversation_members`
--
ALTER TABLE `conversation_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT cho bảng `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT cho bảng `customer_accounts`
--
ALTER TABLE `customer_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT cho bảng `customer_old_debts`
--
ALTER TABLE `customer_old_debts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `customer_product_prices`
--
ALTER TABLE `customer_product_prices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `customer_sims`
--
ALTER TABLE `customer_sims`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `customer_update_requests`
--
ALTER TABLE `customer_update_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT cho bảng `customer_vehicles`
--
ALTER TABLE `customer_vehicles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `debt_settlements`
--
ALTER TABLE `debt_settlements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT cho bảng `inquiries`
--
ALTER TABLE `inquiries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `inquiry_items`
--
ALTER TABLE `inquiry_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT cho bảng `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- AUTO_INCREMENT cho bảng `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=119;

--
-- AUTO_INCREMENT cho bảng `order_attachments`
--
ALTER TABLE `order_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT cho bảng `order_charges`
--
ALTER TABLE `order_charges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=389;

--
-- AUTO_INCREMENT cho bảng `order_checklist`
--
ALTER TABLE `order_checklist`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT cho bảng `order_field_values`
--
ALTER TABLE `order_field_values`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=383;

--
-- AUTO_INCREMENT cho bảng `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=216;

--
-- AUTO_INCREMENT cho bảng `order_lines`
--
ALTER TABLE `order_lines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=115;

--
-- AUTO_INCREMENT cho bảng `order_payments`
--
ALTER TABLE `order_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT cho bảng `order_staff_commissions`
--
ALTER TABLE `order_staff_commissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT cho bảng `order_step_photos`
--
ALTER TABLE `order_step_photos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT cho bảng `order_templates`
--
ALTER TABLE `order_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT cho bảng `order_template_fields`
--
ALTER TABLE `order_template_fields`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT cho bảng `order_workflow_steps`
--
ALTER TABLE `order_workflow_steps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT cho bảng `payment_requests`
--
ALTER TABLE `payment_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT cho bảng `payment_request_items`
--
ALTER TABLE `payment_request_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT cho bảng `price_tiers`
--
ALTER TABLE `price_tiers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT cho bảng `product_attributes`
--
ALTER TABLE `product_attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT cho bảng `product_blocks`
--
ALTER TABLE `product_blocks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT cho bảng `product_prices`
--
ALTER TABLE `product_prices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT cho bảng `release_pool`
--
ALTER TABLE `release_pool`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `remittances`
--
ALTER TABLE `remittances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT cho bảng `staff`
--
ALTER TABLE `staff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `staff_advances`
--
ALTER TABLE `staff_advances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `staff_holdings`
--
ALTER TABLE `staff_holdings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT cho bảng `staff_payroll_periods`
--
ALTER TABLE `staff_payroll_periods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `staff_reviews`
--
ALTER TABLE `staff_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `staff_stock_consumptions`
--
ALTER TABLE `staff_stock_consumptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `staff_stock_issues`
--
ALTER TABLE `staff_stock_issues`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `staff_stock_issue_items`
--
ALTER TABLE `staff_stock_issue_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `stock_items`
--
ALTER TABLE `stock_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT cho bảng `stock_receipts`
--
ALTER TABLE `stock_receipts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=101;

--
-- AUTO_INCREMENT cho bảng `stock_receipt_items`
--
ALTER TABLE `stock_receipt_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=153;

--
-- AUTO_INCREMENT cho bảng `stock_takes`
--
ALTER TABLE `stock_takes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `stock_take_lines`
--
ALTER TABLE `stock_take_lines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `warehouse_logs`
--
ALTER TABLE `warehouse_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

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
-- Các ràng buộc cho bảng `badge_order_attachments`
--
ALTER TABLE `badge_order_attachments`
  ADD CONSTRAINT `fk_battach_border` FOREIGN KEY (`badge_order_id`) REFERENCES `badge_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `badge_order_charges`
--
ALTER TABLE `badge_order_charges`
  ADD CONSTRAINT `fk_bcharge_order` FOREIGN KEY (`badge_order_id`) REFERENCES `badge_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `collections`
--
ALTER TABLE `collections`
  ADD CONSTRAINT `fk_coll_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_coll_remit` FOREIGN KEY (`remittance_id`) REFERENCES `remittances` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_coll_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `conversations`
--
ALTER TABLE `conversations`
  ADD CONSTRAINT `fk_conv_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `conversation_members`
--
ALTER TABLE `conversation_members`
  ADD CONSTRAINT `fk_cm_added_by` FOREIGN KEY (`added_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cm_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cm_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `fk_cust_tier` FOREIGN KEY (`default_tier_id`) REFERENCES `price_tiers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_customers_parent` FOREIGN KEY (`parent_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `customer_accounts`
--
ALTER TABLE `customer_accounts`
  ADD CONSTRAINT `fk_ca_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `customer_old_debts`
--
ALTER TABLE `customer_old_debts`
  ADD CONSTRAINT `customer_old_debts_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`);

--
-- Các ràng buộc cho bảng `customer_product_prices`
--
ALTER TABLE `customer_product_prices`
  ADD CONSTRAINT `fk_cpp_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cpp_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `customer_sims`
--
ALTER TABLE `customer_sims`
  ADD CONSTRAINT `fk_cs_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `customer_update_requests`
--
ALTER TABLE `customer_update_requests`
  ADD CONSTRAINT `fk_cur_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cur_order` FOREIGN KEY (`ref_order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `customer_vehicles`
--
ALTER TABLE `customer_vehicles`
  ADD CONSTRAINT `fk_cv_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `debt_settlements`
--
ALTER TABLE `debt_settlements`
  ADD CONSTRAINT `fk_settlement_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`);

--
-- Các ràng buộc cho bảng `inquiries`
--
ALTER TABLE `inquiries`
  ADD CONSTRAINT `fk_inquiry_contacted_by` FOREIGN KEY (`contacted_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inquiry_customer` FOREIGN KEY (`converted_customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inquiry_order` FOREIGN KEY (`converted_order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `inquiry_items`
--
ALTER TABLE `inquiry_items`
  ADD CONSTRAINT `fk_iitem_inquiry` FOREIGN KEY (`inquiry_id`) REFERENCES `inquiries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_iitem_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_msg_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_msg_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notif_customer` FOREIGN KEY (`ref_customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notif_order` FOREIGN KEY (`ref_order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notif_staff` FOREIGN KEY (`ref_staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_assigned_staff` FOREIGN KEY (`assigned_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orders_dealer` FOREIGN KEY (`dealer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orders_end_customer` FOREIGN KEY (`end_customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `order_attachments`
--
ALTER TABLE `order_attachments`
  ADD CONSTRAINT `fk_order_att_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `order_charges`
--
ALTER TABLE `order_charges`
  ADD CONSTRAINT `fk_charge_line` FOREIGN KEY (`line_id`) REFERENCES `order_lines` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_charge_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `order_checklist`
--
ALTER TABLE `order_checklist`
  ADD CONSTRAINT `fk_order_checklist_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `order_field_values`
--
ALTER TABLE `order_field_values`
  ADD CONSTRAINT `fk_ofv_field` FOREIGN KEY (`template_field_id`) REFERENCES `order_template_fields` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ofv_item` FOREIGN KEY (`item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ofv_line` FOREIGN KEY (`line_id`) REFERENCES `order_lines` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ofv_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_oi_line` FOREIGN KEY (`line_id`) REFERENCES `order_lines` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_oi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `order_lines`
--
ALTER TABLE `order_lines`
  ADD CONSTRAINT `fk_oline_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_oline_template` FOREIGN KEY (`template_id`) REFERENCES `order_templates` (`id`) ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `order_payments`
--
ALTER TABLE `order_payments`
  ADD CONSTRAINT `fk_payment_collection` FOREIGN KEY (`collection_id`) REFERENCES `collections` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `order_staff_commissions`
--
ALTER TABLE `order_staff_commissions`
  ADD CONSTRAINT `order_staff_commissions_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `order_staff_commissions_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`);

--
-- Các ràng buộc cho bảng `order_step_photos`
--
ALTER TABLE `order_step_photos`
  ADD CONSTRAINT `fk_ostepphoto_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `order_template_fields`
--
ALTER TABLE `order_template_fields`
  ADD CONSTRAINT `fk_otfield_template` FOREIGN KEY (`template_id`) REFERENCES `order_templates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `payment_requests`
--
ALTER TABLE `payment_requests`
  ADD CONSTRAINT `fk_pr_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`);

--
-- Các ràng buộc cho bảng `payment_request_items`
--
ALTER TABLE `payment_request_items`
  ADD CONSTRAINT `fk_pri_request` FOREIGN KEY (`request_id`) REFERENCES `payment_requests` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `product_attributes`
--
ALTER TABLE `product_attributes`
  ADD CONSTRAINT `fk_attrs_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `product_blocks`
--
ALTER TABLE `product_blocks`
  ADD CONSTRAINT `fk_block_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `product_prices`
--
ALTER TABLE `product_prices`
  ADD CONSTRAINT `fk_prices_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_prices_tier` FOREIGN KEY (`tier_id`) REFERENCES `price_tiers` (`id`);

--
-- Các ràng buộc cho bảng `product_stock`
--
ALTER TABLE `product_stock`
  ADD CONSTRAINT `fk_product_stock_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `release_pool`
--
ALTER TABLE `release_pool`
  ADD CONSTRAINT `fk_release_pool_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_release_pool_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_release_pool_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `stock_receipts` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_release_pool_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `remittances`
--
ALTER TABLE `remittances`
  ADD CONSTRAINT `fk_remit_approver` FOREIGN KEY (`approved_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_remit_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `staff_advances`
--
ALTER TABLE `staff_advances`
  ADD CONSTRAINT `fk_sa_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `staff` (`id`),
  ADD CONSTRAINT `fk_sa_created_by` FOREIGN KEY (`created_by`) REFERENCES `staff` (`id`),
  ADD CONSTRAINT `fk_sa_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`);

--
-- Các ràng buộc cho bảng `staff_holdings`
--
ALTER TABLE `staff_holdings`
  ADD CONSTRAINT `fk_staff_holdings_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_staff_holdings_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `staff_payroll_periods`
--
ALTER TABLE `staff_payroll_periods`
  ADD CONSTRAINT `fk_spp_finalizer` FOREIGN KEY (`finalized_by`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_spp_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `staff_reviews`
--
ALTER TABLE `staff_reviews`
  ADD CONSTRAINT `fk_review_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_review_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `staff_stock_consumptions`
--
ALTER TABLE `staff_stock_consumptions`
  ADD CONSTRAINT `fk_ssc_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ssc_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `staff_stock_issues`
--
ALTER TABLE `staff_stock_issues`
  ADD CONSTRAINT `fk_ssi_approver` FOREIGN KEY (`approved_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ssi_creator` FOREIGN KEY (`created_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ssi_receipt` FOREIGN KEY (`ref_receipt_id`) REFERENCES `stock_receipts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ssi_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `staff_stock_issue_items`
--
ALTER TABLE `staff_stock_issue_items`
  ADD CONSTRAINT `fk_ssi_item_issue` FOREIGN KEY (`issue_id`) REFERENCES `staff_stock_issues` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ssi_item_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `stock_items`
--
ALTER TABLE `stock_items`
  ADD CONSTRAINT `fk_stock_held_staff` FOREIGN KEY (`held_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stock_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stock_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `stock_receipts`
--
ALTER TABLE `stock_receipts`
  ADD CONSTRAINT `fk_receipt_creator` FOREIGN KEY (`created_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_receipt_ref_staff` FOREIGN KEY (`ref_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_receipt_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_receipts_stock_take` FOREIGN KEY (`ref_stock_take_id`) REFERENCES `stock_takes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `stock_receipt_items`
--
ALTER TABLE `stock_receipt_items`
  ADD CONSTRAINT `fk_receipt_item_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_receipt_item_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `stock_receipts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `stock_takes`
--
ALTER TABLE `stock_takes`
  ADD CONSTRAINT `fk_stock_takes_by_staff` FOREIGN KEY (`by_staff_id`) REFERENCES `staff` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stock_takes_finished_by` FOREIGN KEY (`finished_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `stock_take_lines`
--
ALTER TABLE `stock_take_lines`
  ADD CONSTRAINT `fk_stock_take_lines_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stock_take_lines_receipt` FOREIGN KEY (`receipt_id`) REFERENCES `stock_receipts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_stock_take_lines_take` FOREIGN KEY (`stock_take_id`) REFERENCES `stock_takes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `warehouse_logs`
--
ALTER TABLE `warehouse_logs`
  ADD CONSTRAINT `fk_log_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_log_stock` FOREIGN KEY (`stock_item_id`) REFERENCES `stock_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
