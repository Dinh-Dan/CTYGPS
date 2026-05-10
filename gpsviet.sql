-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th5 10, 2026 lúc 08:27 PM
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

--
-- Đang đổ dữ liệu cho bảng `collections`
--

INSERT INTO `collections` (`id`, `order_id`, `staff_id`, `amount`, `method`, `receipt_url`, `collected_at`, `remitted`, `remittance_id`, `is_deleted`) VALUES
(1, 5, 3, 2500000, 'cash', NULL, '2026-04-28 01:54:33', 1, 1, 0),
(2, 6, 3, 123157000, 'cash', NULL, '2026-04-28 02:50:02', 1, 2, 0),
(3, 8, 3, 7040000, 'cash', NULL, '2026-04-28 13:54:37', 1, 3, 0),
(4, 14, 3, 260000, 'transfer', NULL, '2026-04-28 20:52:58', 1, 4, 0),
(5, 6, 3, 7777000, 'cash', NULL, '2026-04-29 10:52:51', 1, 5, 0),
(6, 15, 3, 5082002, 'cash', NULL, '2026-04-29 11:47:25', 1, 5, 0),
(7, 37, 2, 200000, 'cash', NULL, '2026-05-10 17:33:14', 1, 9, 0),
(8, 38, 2, 200000, 'cash', NULL, '2026-05-10 17:38:24', 1, 10, 0);

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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `customers`
--

INSERT INTO `customers` (`id`, `code`, `type`, `full_name`, `phone`, `email`, `address`, `avatar_url`, `note`, `company_name`, `tax_code`, `contact_person`, `debt_limit`, `credit_term_days`, `opening_balance`, `discount_rate`, `default_tier_id`, `password_hash`, `is_deleted`, `seen_at`, `created_at`, `updated_at`) VALUES
(1, 'KH001', 'retail', 'Nguyen Van An', '0901111111', 'an.nv@example.com', 'Ha Noi', NULL, 'Khach le mau', NULL, NULL, NULL, 0, 0, 95000, 0.00, 1, NULL, 0, '2026-04-26 02:30:52', '2026-04-25 10:35:28', '2026-05-10 10:54:27'),
(2, 'KH002', 'retail', 'Tran Thi Binh', '0902222222', NULL, 'Hai Phong', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-04-26 02:30:52', '2026-04-25 10:35:28', '2026-04-26 11:54:41'),
(3, 'DL001', 'dealer', 'DLR Test', '0903333333', NULL, NULL, NULL, 'Dai ly cap 1', 'Cong ty TNHH GPS Ha Noi', '0101234567', 'Le Van Cuong', 50000000, 30, 0, 5.00, 6, '$2a$10$e14olmdWTDynd6tIR142zeWPdoDPP7i6w3399iVIAwCfj9ocuV8pq', 0, '2026-04-26 02:30:52', '2026-04-25 10:35:28', '2026-05-10 11:10:13'),
(4, 'DL002', 'dealer', 'Pham Thi Dung', '0904444444', 'dung@gpsdanang.vn', 'Da Nang', '/uploads/avatars/1777114898932-210d9bf706ab.png', 'Dai ly cap 2', 'GPS Mien Trung', '0107654321', 'Pham Thi Dung', 30000000, 15, 0, 3.00, 6, '$2a$10$xqlCwt5yCHrI8YFETYEp3e83C2IjbBbt6TDox2dasTd00jXI7I1Fm', 0, '2026-04-26 02:30:52', '2026-04-25 10:35:28', '2026-04-28 10:01:54'),
(5, 'KH003', 'retail', 'Lê Hoàng Cường', '0923456789', NULL, 'Q.7, TP.HCM', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-04-26 02:30:52', '2026-04-25 16:30:31', '2026-04-26 11:54:41'),
(6, 'KH004', 'retail', 'Phạm Thanh Dũng', '0934567890', NULL, 'Bình Dương', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-04-26 02:30:52', '2026-04-25 16:30:31', '2026-04-26 11:54:41'),
(7, 'KH0005', 'retail', 'ngueyén van a', '0312313123', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-04-26 11:35:23', '2026-04-26 04:33:39', '2026-04-28 13:18:55'),
(9, 'KH0006', 'retail', 'alo', '0362469321', NULL, 'đia chỉ', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-04-26 17:43:31', '2026-04-26 10:36:26', '2026-04-26 11:54:41'),
(10, 'KH0007', 'retail', '123123', '0932743900', NULL, '123123', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, '2026-05-10 00:08:28', '2026-05-08 15:53:57', '2026-05-09 17:08:28'),
(11, 'KH0008', 'retail', 'Khach Test Bot', '0900000901', NULL, '123 Le Loi, Q1', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-10 11:06:16', '2026-05-10 11:06:16'),
(12, 'KH0009', 'retail', 'KH-Pentest-Customer', '0911222333', NULL, '55 Nguyen Trai, Q5', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-10 11:07:33', '2026-05-10 11:07:33'),
(13, 'KH451494', 'retail', 'KH Pentest Admin', '0900000901', NULL, '99 Pentest Street, Q.99', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-10 11:08:04', '2026-05-10 11:08:04'),
(14, 'KH312191', 'retail', 'BotKH-Tho', '0901900001', NULL, '99 Test Street, Q1, HCM', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-10 11:08:59', '2026-05-10 11:08:59'),
(15, 'KH451495', 'retail', 'Race Test', '0938111222', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, '2026-05-11 00:39:24', '2026-05-10 11:12:06', '2026-05-10 17:39:24');

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
(1, 10, 'nguyenavc', NULL, 0);

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
(1, 10, 'account', 'add', NULL, 'nguyenavc', NULL, 'kithuat', 3, 35, 'approved', 1, '2026-05-10 08:31:23', NULL, 0);

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
(7, 'TT-1105-002', 2, 4843000, 4843000, 0, 1, 'cash', NULL, NULL, 1, '2026-05-11 01:01:20', 0);

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
(3, 'order_receive_uploaded', 'ORD-0605-001: KTV đã chụp ảnh nhận hàng', 'Lê Văn Hùng — chờ xuất kho cho Lê Hoàng Cường', '/admin/orders.html#order-25', NULL, 5, 3, 1, '2026-05-08 22:36:52', 0, '2026-05-06 09:09:25'),
(4, 'order_completed', 'ORD-1005-004: KTV hoàn thành', 'Lê Văn Hùng — 123123 — 7.184.333đ', '/admin/orders.html#order-35', 35, 10, 3, 0, NULL, 0, '2026-05-10 08:20:38'),
(5, 'customer_asset_request', 'KTV de xuat them tai khoan', '123123: nguyenavc', '/admin/customers.html?customer_id=10&tab=requests', 35, 10, 3, 1, '2026-05-10 15:31:08', 0, '2026-05-10 08:22:40'),
(6, 'order_receive_uploaded', 'ORD-1005-005: KTV upload anh', 'Trần Minh — 123123', '/admin/orders.html#order-36', 36, 10, 2, 0, NULL, 0, '2026-05-10 10:32:46'),
(7, 'order_receive_uploaded', 'ORD-1005-006: KTV upload anh', 'Trần Minh — 123123', '/admin/orders.html#order-37', 37, 10, 2, 0, NULL, 0, '2026-05-10 10:33:14'),
(8, 'order_completed', 'ORD-1005-006: KTV hoàn thành', 'Trần Minh — 123123 — 200.000đ', '/admin/orders.html#order-37', 37, 10, 2, 0, NULL, 0, '2026-05-10 10:33:14'),
(9, 'order_receive_uploaded', 'ORD-1005-007: KTV upload anh', 'Trần Minh — 123123', '/admin/orders.html#order-38', 38, 10, 2, 0, NULL, 0, '2026-05-10 10:38:24'),
(10, 'order_completed', 'ORD-1005-007: KTV hoàn thành', 'Trần Minh — 123123 — 200.000đ', '/admin/orders.html#order-38', 38, 10, 2, 0, NULL, 0, '2026-05-10 10:38:24'),
(11, 'order_new', 'Don moi ORD-1005-008', 'Nguyen Van An vua tao don Lắp mới', '/admin/orders.html#order-39', 39, 1, NULL, 0, NULL, 0, '2026-05-10 10:54:27'),
(12, 'order_new', 'Don moi ORD-1005-009', 'Nguyen Van An vua tao don Lắp mới', '/admin/orders.html#order-40', 40, 1, NULL, 0, NULL, 0, '2026-05-10 10:54:27'),
(13, 'order_new', 'Don moi ORD-1005-010', 'Nguyen Van An vua tao don Lắp mới', '/admin/orders.html#order-41', 41, 1, NULL, 0, NULL, 0, '2026-05-10 10:54:27'),
(14, 'order_new', 'Don moi ORD-1005-011', 'Nguyen Van An vua tao don Lắp mới', '/admin/orders.html#order-42', 42, 1, NULL, 0, NULL, 0, '2026-05-10 10:54:27'),
(15, 'order_new', 'Don moi ORD-1005-012', 'Tran Thi Binh vua tao don Lắp mới', '/admin/orders.html#order-43', 43, 2, NULL, 0, NULL, 0, '2026-05-10 10:54:27'),
(16, 'order_new', 'Don moi ORD-1005-013', 'Nguyen Van An vua tao don Lắp mới', '/admin/orders.html#order-44', 44, 1, NULL, 1, '2026-05-10 17:55:03', 0, '2026-05-10 10:54:27'),
(17, 'order_new', 'Don moi ORD-1005-014', 'Nguyen Van An vua tao don Lắp mới', '/admin/orders.html#order-45', 45, 1, NULL, 0, NULL, 0, '2026-05-10 10:55:10'),
(18, 'order_new', 'Don moi ORD-1005-015', 'Khach Test Bot vua tao don Lắp mới', '/admin/orders.html#order-46', 46, 11, NULL, 0, NULL, 0, '2026-05-10 11:07:01'),
(19, 'order_new', 'Don moi ORD-1005-016', 'Khach Test Bot vua tao don Lắp mới', '/admin/orders.html#order-47', 47, 11, NULL, 0, NULL, 0, '2026-05-10 11:07:01'),
(20, 'order_new', 'Don moi ORD-1005-017', 'Khach Test Bot vua tao don Lắp mới', '/admin/orders.html#order-48', 48, 11, NULL, 0, NULL, 0, '2026-05-10 11:07:01'),
(21, 'order_new', 'Don moi ORD-1005-018', 'Khach Test Bot vua tao don Lắp mới', '/admin/orders.html#order-49', 49, 11, NULL, 0, NULL, 0, '2026-05-10 11:07:01'),
(22, 'order_new', 'Don moi ORD-1005-019', 'Khach Test Bot vua tao don Lắp mới', '/admin/orders.html#order-50', 50, 11, NULL, 0, NULL, 0, '2026-05-10 11:07:01'),
(23, 'order_new', 'Don moi ORD-1005-020', 'KH-Pentest-Customer vua tao don Lắp mới', '/admin/orders.html#order-51', 51, 12, NULL, 0, NULL, 0, '2026-05-10 11:07:41'),
(24, 'order_new', 'Don moi ORD-1005-023', 'Le Van Cuong vua tao don Lắp mới', '/admin/orders.html#order-54', 54, 3, NULL, 0, NULL, 0, '2026-05-10 11:09:50'),
(25, 'order_new', 'Don moi ORD-1005-024', 'Le Van Cuong vua tao don Lắp mới', '/admin/orders.html#order-55', 55, 3, NULL, 0, NULL, 0, '2026-05-10 11:10:13'),
(26, 'order_new', 'Don moi ORD-1005-026', 'BotKH-Tho vua tao don Lắp mới', '/admin/orders.html#order-57', 57, 14, NULL, 0, NULL, 0, '2026-05-10 11:10:25'),
(27, 'order_new', 'Don moi ORD-1005-027', 'BotKH-Tho vua tao don Lắp mới', '/admin/orders.html#order-58', 58, 14, NULL, 0, NULL, 0, '2026-05-10 11:10:25'),
(28, 'order_new', 'Don moi ORD-1005-028', 'DLR Test vua tao don Lắp mới', '/admin/orders.html#order-59', 59, 3, NULL, 0, NULL, 0, '2026-05-10 11:10:53'),
(29, 'order_new', 'Don moi ORD-1005-029', 'DLR Test vua tao don Lắp mới', '/admin/orders.html#order-60', 60, 3, NULL, 0, NULL, 0, '2026-05-10 11:10:53'),
(30, 'order_new', 'Don moi ORD-1005-030', 'DLR Test vua tao don Lắp mới', '/admin/orders.html#order-61', 61, 3, NULL, 0, NULL, 0, '2026-05-10 11:10:53'),
(31, 'order_new', 'Don moi ORD-1005-031', 'DLR Test vua tao don Lắp mới', '/admin/orders.html#order-62', 62, 3, NULL, 0, NULL, 0, '2026-05-10 11:11:13'),
(32, 'order_new', 'Don moi ORD-1005-032', 'DLR Test vua tao don Lắp mới', '/admin/orders.html#order-63', 63, 3, NULL, 0, NULL, 0, '2026-05-10 11:11:14'),
(33, 'order_new', 'Don moi ORD-1005-033', 'DLR Test vua tao don Lắp mới', '/admin/orders.html#order-64', 64, 3, NULL, 1, '2026-05-11 01:27:31', 0, '2026-05-10 11:11:14');

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
  `ktv_note` text DEFAULT NULL,
  `note` text DEFAULT NULL,
  `creator_type` enum('customer','dealer','admin','staff') NOT NULL DEFAULT 'admin',
  `creator_id` int(11) DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `confirmed_by` int(11) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `orders`
--

INSERT INTO `orders` (`id`, `code`, `customer_id`, `dealer_id`, `total_amount`, `subtotal`, `paid_amount`, `debt_carried_at`, `debt_settlement_id`, `payment_method`, `status`, `progress_note`, `payment_status`, `collected_for_dealer`, `has_return`, `seen_at`, `address`, `assigned_staff_id`, `due_at`, `started_at`, `completed_at`, `wage_amount`, `ktv_note`, `note`, `creator_type`, `creator_id`, `confirmed_at`, `confirmed_by`, `is_deleted`, `created_at`) VALUES
(32, 'ORD-1005-001', 10, NULL, 2640000, 2580000, 0, '2026-05-11 00:42:30', 6, 'cash', 'confirmed', NULL, 'paid', 0, 0, NULL, 'đia chỉ', 3, NULL, NULL, NULL, 200000, NULL, 'ghi chú', 'admin', 1, NULL, NULL, 0, '2026-05-10 04:38:07'),
(33, 'ORD-1005-002', 2, NULL, 4843000, 4510000, 0, '2026-05-11 01:01:20', 7, 'debt', 'in_progress', NULL, 'paid', 0, 0, NULL, 'Da Nang', 3, NULL, NULL, NULL, 200000, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-05-10 05:08:06'),
(34, 'ORD-1005-003', 10, NULL, 5120000, 5100000, 0, '2026-05-11 00:42:30', 6, 'debt', 'confirmed', NULL, 'paid', 0, 0, NULL, '123123', 3, NULL, NULL, NULL, 20000, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-05-10 05:36:39'),
(35, 'ORD-1005-004', 10, NULL, 7184333, 4540000, 0, '2026-05-11 00:42:30', 6, 'debt', 'done', 'đang cập nhật\n', 'paid', 0, 0, NULL, '123123', 3, NULL, '2026-05-10 14:18:33', '2026-05-10 15:20:38', 20000, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-05-10 06:38:14'),
(36, 'ORD-1005-005', 10, NULL, 200000, 200000, 0, '2026-05-11 00:42:30', 6, 'cash', 'in_progress', 'KTV bat dau lap dat', 'paid', 0, 0, NULL, '123 Test Street, Q.1, TP.HCM', 2, NULL, '2026-05-10 17:32:46', NULL, 100000, NULL, 'E2E test order', 'admin', 1, NULL, NULL, 0, '2026-05-10 10:32:46'),
(37, 'ORD-1005-006', 10, NULL, 200000, 200000, 200000, NULL, NULL, 'cash', 'done', 'KTV bat dau lap dat', 'paid', 0, 0, NULL, '123 Test Street, Q.1, TP.HCM', 2, NULL, '2026-05-10 17:33:14', '2026-05-10 17:33:14', 100000, 'KTV thu du cash', 'E2E test order', 'admin', 1, NULL, NULL, 0, '2026-05-10 10:33:14'),
(38, 'ORD-1005-007', 10, NULL, 200000, 200000, 200000, NULL, NULL, 'cash', 'done', 'KTV bat dau lap dat', 'paid', 0, 0, NULL, '123 Test Street, Q.1, TP.HCM', 2, NULL, '2026-05-10 17:38:24', '2026-05-10 17:38:24', 100000, 'KTV thu du cash', 'E2E test order', 'admin', 1, NULL, NULL, 0, '2026-05-10 10:38:24'),
(39, 'ORD-1005-008', 1, NULL, 100000, 100000, 0, '2026-05-10 17:54:27', 5, 'cash', 'confirmed', NULL, 'paid', 0, 0, NULL, '12 Nguyen Hue, Q.1, TP.HCM', NULL, NULL, NULL, NULL, 0, NULL, 'Test don boi persona-pentest', 'customer', 1, NULL, NULL, 0, '2026-05-10 10:54:27'),
(40, 'ORD-1005-009', 1, NULL, 100000, 100000, 0, NULL, NULL, 'cash', 'pending', NULL, 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 'customer', 1, NULL, NULL, 0, '2026-05-10 10:54:27'),
(41, 'ORD-1005-010', 1, NULL, 0, 0, 0, NULL, NULL, 'cash', 'pending', NULL, 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 'customer', 1, NULL, NULL, 0, '2026-05-10 10:54:27'),
(42, 'ORD-1005-011', 1, NULL, 100000, 100000, 0, NULL, NULL, 'cash', 'cancelled', NULL, 'unpaid', 0, 0, NULL, '12 Nguyen Hue, Q.1, TP.HCM', NULL, NULL, NULL, NULL, 0, NULL, 'Test don boi persona-pentest', 'customer', 1, NULL, NULL, 1, '2026-05-10 10:54:27'),
(43, 'ORD-1005-012', 2, NULL, 100000, 100000, 0, NULL, NULL, 'cash', 'pending', NULL, 'unpaid', 0, 0, NULL, '12 Nguyen Hue, Q.1, TP.HCM', NULL, NULL, NULL, NULL, 0, NULL, 'Test don boi persona-pentest', 'customer', 2, NULL, NULL, 0, '2026-05-10 10:54:27'),
(44, 'ORD-1005-013', 1, NULL, 100000, 100000, 0, '2026-05-10 17:54:27', 5, 'cash', 'confirmed', NULL, 'paid', 0, 0, NULL, '12 Nguyen Hue, Q.1, TP.HCM', NULL, NULL, NULL, NULL, 0, NULL, 'Test don boi persona-pentest', 'customer', 1, NULL, NULL, 0, '2026-05-10 10:54:27'),
(45, 'ORD-1005-014', 1, NULL, 1490000, 1490000, 0, NULL, NULL, 'cash', 'pending', NULL, 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 'customer', 1, NULL, NULL, 0, '2026-05-10 10:55:10'),
(46, 'ORD-1005-015', 11, NULL, 2500000, 2500000, 0, NULL, NULL, 'cash', 'pending', NULL, 'unpaid', 0, 0, NULL, '123 Le Loi, Q1', NULL, NULL, NULL, NULL, 0, NULL, 'Don test khach', 'customer', 11, NULL, NULL, 0, '2026-05-10 11:07:01'),
(47, 'ORD-1005-016', 11, NULL, 2500000, 2500000, 0, NULL, NULL, 'cash', 'pending', NULL, 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 'customer', 11, NULL, NULL, 0, '2026-05-10 11:07:01'),
(48, 'ORD-1005-017', 11, NULL, 2499997500000, 2499997500000, 0, NULL, NULL, 'cash', 'pending', NULL, 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 'customer', 11, NULL, NULL, 0, '2026-05-10 11:07:01'),
(49, 'ORD-1005-018', 11, NULL, 0, 0, 0, NULL, NULL, 'cash', 'pending', NULL, 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 'customer', 11, NULL, NULL, 0, '2026-05-10 11:07:01'),
(50, 'ORD-1005-019', 11, NULL, 0, 0, 0, NULL, NULL, 'cash', 'pending', NULL, 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 'customer', 11, NULL, NULL, 0, '2026-05-10 11:07:01'),
(51, 'ORD-1005-020', 12, NULL, 2700000, 2700000, 0, NULL, NULL, 'cash', 'pending', NULL, 'unpaid', 0, 0, NULL, '55 Nguyen Trai, Q5', NULL, NULL, NULL, NULL, 0, NULL, 'Don pentest cua KH-Pentest-Customer', 'customer', 12, NULL, NULL, 0, '2026-05-10 11:07:41'),
(52, 'ORD-1005-021', 13, NULL, 200000, 200000, 200000, NULL, NULL, 'cash', 'done', NULL, 'paid', 0, 0, NULL, '99 Pentest Street, Q.99', 2, NULL, NULL, '2026-05-10 18:09:29', 50000, NULL, 'Don pentest cua admin#1', 'admin', 1, NULL, NULL, 0, '2026-05-10 11:08:25'),
(53, 'ORD-1005-022', 14, NULL, 1500000, 1500000, 1500000, NULL, NULL, 'cash', 'cancelled', NULL, 'paid', 0, 0, NULL, '99 Test Street, Q1, HCM', 2, NULL, NULL, '2026-05-10 18:09:52', 50000, NULL, '[BOT] don end-to-end test', 'admin', 5, NULL, NULL, 1, '2026-05-10 11:09:38'),
(54, 'ORD-1005-023', 3, NULL, 1890000, 1890000, 0, NULL, NULL, 'cash', 'pending', NULL, 'unpaid', 0, 0, NULL, 'Test DL001', NULL, NULL, NULL, NULL, 0, NULL, '[DLR-PENTEST] don thuc te dau tien', 'dealer', 3, NULL, NULL, 0, '2026-05-10 11:09:50'),
(55, 'ORD-1005-024', 3, NULL, 200000, 200000, 0, NULL, NULL, 'cash', 'pending', NULL, 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 'dealer', 3, NULL, NULL, 0, '2026-05-10 11:10:13'),
(56, 'ORD-1005-025', 13, NULL, 100, 100, 0, NULL, NULL, 'cash', 'confirmed', NULL, 'customer_owes', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, '<script>alert(1)</script><img src=x onerror=alert(1)>', 'admin', 1, NULL, NULL, 1, '2026-05-10 11:10:21'),
(57, 'ORD-1005-026', 14, NULL, 1490000, 1490000, 0, NULL, NULL, 'cash', 'pending', NULL, 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 'customer', 14, NULL, NULL, 0, '2026-05-10 11:10:25'),
(58, 'ORD-1005-027', 14, NULL, 1490000, 1490000, 0, NULL, NULL, 'cash', 'pending', NULL, 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 'customer', 14, NULL, NULL, 0, '2026-05-10 11:10:25'),
(59, 'ORD-1005-028', 3, NULL, 250000000, 250000000, 0, NULL, NULL, 'cash', 'pending', NULL, 'unpaid', 0, 0, NULL, 'DLR debt overflow', NULL, NULL, NULL, NULL, 0, NULL, '[DLR-PENTEST] debt vu?t h?n', 'dealer', 3, NULL, NULL, 0, '2026-05-10 11:10:53'),
(60, 'ORD-1005-029', 3, NULL, 1490000000200000, 1490000000200000, 0, NULL, NULL, 'cash', 'pending', NULL, 'unpaid', 0, 0, NULL, 'DLR qty', NULL, NULL, NULL, NULL, 0, NULL, '[DLR-PENTEST] qty edge', 'dealer', 3, NULL, NULL, 0, '2026-05-10 11:10:53'),
(61, 'ORD-1005-030', 3, NULL, 200000, 200000, 0, NULL, NULL, 'cash', 'pending', NULL, 'unpaid', 0, 0, NULL, '<script>alert(1)</script>', NULL, NULL, NULL, NULL, 0, NULL, '<img src=x onerror=alert(1)>', 'dealer', 3, NULL, NULL, 0, '2026-05-10 11:10:53');
INSERT INTO `orders` (`id`, `code`, `customer_id`, `dealer_id`, `total_amount`, `subtotal`, `paid_amount`, `debt_carried_at`, `debt_settlement_id`, `payment_method`, `status`, `progress_note`, `payment_status`, `collected_for_dealer`, `has_return`, `seen_at`, `address`, `assigned_staff_id`, `due_at`, `started_at`, `completed_at`, `wage_amount`, `ktv_note`, `note`, `creator_type`, `creator_id`, `confirmed_at`, `confirmed_by`, `is_deleted`, `created_at`) VALUES
(62, 'ORD-1005-031', 3, NULL, 200000, 200000, 0, NULL, NULL, 'cash', 'pending', NULL, 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'dealer', 3, NULL, NULL, 0, '2026-05-10 11:11:13');
INSERT INTO `orders` (`id`, `code`, `customer_id`, `dealer_id`, `total_amount`, `subtotal`, `paid_amount`, `debt_carried_at`, `debt_settlement_id`, `payment_method`, `status`, `progress_note`, `payment_status`, `collected_for_dealer`, `has_return`, `seen_at`, `address`, `assigned_staff_id`, `due_at`, `started_at`, `completed_at`, `wage_amount`, `ktv_note`, `note`, `creator_type`, `creator_id`, `confirmed_at`, `confirmed_by`, `is_deleted`, `created_at`) VALUES
(63, 'ORD-1005-032', 3, NULL, 0, 0, 0, NULL, NULL, 'cash', 'pending', NULL, 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 'dealer', 3, NULL, NULL, 0, '2026-05-10 11:11:14'),
(64, 'ORD-1005-033', 3, NULL, 400000, 400000, 0, NULL, NULL, 'cash', 'pending', NULL, 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 'dealer', 3, NULL, NULL, 0, '2026-05-10 11:11:14'),
(65, 'ORD-1005-034', 14, NULL, 1500000, 1500000, 1000000, NULL, NULL, 'cash', 'confirmed', NULL, 'customer_owes', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 'admin', 5, NULL, NULL, 0, '2026-05-10 11:11:34');

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

--
-- Đang đổ dữ liệu cho bảng `order_attachments`
--

INSERT INTO `order_attachments` (`id`, `order_id`, `url`, `caption`, `stage`, `uploaded_at`) VALUES
(1, 2, 'https://i.ibb.co/8nRkqRn5/task-1-receive.jpg', NULL, 'receive', '2026-04-27 17:55:24'),
(2, 2, 'https://i.ibb.co/mVwfHKgk/task-1-deliver.jpg', NULL, 'deliver', '2026-04-27 17:56:27'),
(3, 5, 'https://i.ibb.co/jPtmW5dh/task-2-receive.jpg', NULL, 'receive', '2026-04-27 18:51:14'),
(4, 5, 'https://i.ibb.co/5hRfKcvT/task-2-receive.jpg', NULL, 'receive', '2026-04-27 18:52:30'),
(5, 6, 'https://i.ibb.co/KjGfqPGD/task-3-receive.jpg', NULL, 'receive', '2026-04-27 19:41:52'),
(6, 9, 'https://i.ibb.co/HwTJx3J/task-6-receive.jpg', NULL, 'receive', '2026-04-28 06:50:14'),
(7, 8, 'https://i.ibb.co/DPyMTX3c/task-5-deliver.jpg', NULL, 'deliver', '2026-04-28 06:54:34'),
(8, 10, 'https://i.ibb.co/SwMFH6s5/task-7-receive.jpg', NULL, 'receive', '2026-04-28 07:55:15'),
(9, 14, 'https://i.ibb.co/DPyMTX3c/task-5-deliver.jpg', NULL, 'receive', '2026-04-28 13:28:16'),
(10, 6, 'https://i.ibb.co/20FB1SMR/order-6-deliver.jpg', NULL, 'deliver', '2026-04-29 03:52:47'),
(11, 16, 'https://i.ibb.co/DPyMTX3c/task-5-deliver.jpg', NULL, 'deliver', '2026-04-29 04:09:30'),
(12, 15, 'https://i.ibb.co/3yyV3Jtj/order-15-receive.jpg', NULL, 'receive', '2026-04-29 04:09:58'),
(13, 15, 'https://i.ibb.co/DPyMTX3c/task-5-deliver.jpg', NULL, 'receive', '2026-04-29 04:10:13'),
(14, 18, 'https://i.ibb.co/DPyMTX3c/task-5-deliver.jpg', NULL, 'deliver', '2026-04-29 04:31:14'),
(15, 15, 'https://i.ibb.co/WpgWkkpj/order-15-deliver.jpg', NULL, 'deliver', '2026-04-29 04:47:24'),
(16, 17, 'https://i.ibb.co/xSM3BCkG/order-17-deliver.jpg', NULL, 'deliver', '2026-04-29 05:31:28'),
(17, 25, 'https://i.ibb.co/N6KgpC9f/order-25-receive.jpg', NULL, 'receive', '2026-05-06 09:09:25');

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
(85, 32, 1, 'fee', 'phí 1', 20000, 0),
(86, 32, 2, 'fee', 'phí 2', 20000, 0),
(87, 32, NULL, 'shipping', 'phí khác', 20000, 0),
(88, 32, NULL, 'fee', 'Công lắp', 200000, 0),
(89, 33, 3, 'fee', 'phí 1', 123000, 0),
(90, 33, 4, 'fee', 'phí 2', 200000, 0),
(91, 33, NULL, 'shipping', 'phí ship 11', 10000, 0),
(92, 33, NULL, 'fee', 'Công lắp', 200000, 0),
(93, 34, 6, 'fee', 'phsi 1', 20000, 0),
(94, 34, NULL, 'fee', 'Công lắp', 20000, 0),
(95, 35, 7, 'fee', 'edvhet', 333333, 0),
(96, 35, 8, 'fee', '21edưca', 2311000, 0),
(97, 35, NULL, 'fee', 'Công lắp', 20000, 0),
(98, 36, NULL, 'fee', 'Công lắp', 100000, 0),
(99, 37, NULL, 'fee', 'Công lắp', 100000, 0),
(100, 38, NULL, 'fee', 'Công lắp', 100000, 0),
(101, 52, NULL, 'fee', 'Công lắp', 50000, 1),
(102, 52, NULL, 'fee', 'Công lắp', 50000, 0),
(103, 53, NULL, 'fee', 'Công lắp', 50000, 0);

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

--
-- Đang đổ dữ liệu cho bảng `order_checklist`
--

INSERT INTO `order_checklist` (`id`, `order_id`, `step`, `is_done`, `done_at`, `sort_order`) VALUES
(1, 2, 'Kiem tra thiet bi truoc khi lap', 1, '2026-04-28 00:52:49', 0),
(2, 2, 'Cap tai khoan / username cho khach', 1, '2026-04-28 00:53:02', 1),
(3, 2, 'Lap dat thiet bi len xe', 1, '2026-04-28 00:53:02', 2),
(4, 2, 'Test tin hieu GPS truc tiep', 1, '2026-04-28 00:53:03', 3),
(5, 2, 'Huong dan khach su dung app', 1, '2026-04-28 00:53:03', 4),
(6, 2, 'Chup anh thiet bi sau khi lap', 1, '2026-04-28 00:53:04', 5),
(7, 5, 'Kiem tra thiet bi truoc khi lap', 0, NULL, 0),
(8, 5, 'Cap tai khoan / username cho khach', 0, NULL, 1),
(9, 5, 'Lap dat thiet bi len xe', 0, NULL, 2),
(10, 5, 'Test tin hieu GPS truc tiep', 0, NULL, 3),
(11, 5, 'Huong dan khach su dung app', 0, NULL, 4),
(12, 5, 'Chup anh thiet bi sau khi lap', 0, NULL, 5),
(13, 6, 'Kiem tra thiet bi truoc khi lap', 0, NULL, 0),
(14, 6, 'Cap tai khoan / username cho khach', 0, NULL, 1),
(15, 6, 'Lap dat thiet bi len xe', 0, NULL, 2),
(16, 6, 'Test tin hieu GPS truc tiep', 0, NULL, 3),
(17, 6, 'Huong dan khach su dung app', 0, NULL, 4),
(18, 6, 'Chup anh thiet bi sau khi lap', 0, NULL, 5),
(19, 7, 'Kiem tra thiet bi truoc khi lap', 0, NULL, 0),
(20, 7, 'Cap tai khoan / username cho khach', 0, NULL, 1),
(21, 7, 'Lap dat thiet bi len xe', 0, NULL, 2),
(22, 7, 'Test tin hieu GPS truc tiep', 0, NULL, 3),
(23, 7, 'Huong dan khach su dung app', 0, NULL, 4),
(24, 7, 'Chup anh thiet bi sau khi lap', 0, NULL, 5),
(25, 8, 'Kiem tra thiet bi truoc khi lap', 0, NULL, 0),
(26, 8, 'Cap tai khoan / username cho khach', 0, NULL, 1),
(27, 8, 'Lap dat thiet bi len xe', 0, NULL, 2),
(28, 8, 'Test tin hieu GPS truc tiep', 0, NULL, 3),
(29, 8, 'Huong dan khach su dung app', 0, NULL, 4),
(30, 8, 'Chup anh thiet bi sau khi lap', 0, NULL, 5),
(31, 9, 'Kiem tra thiet bi truoc khi lap', 0, NULL, 0),
(32, 9, 'Cap tai khoan / username cho khach', 0, NULL, 1),
(33, 9, 'Lap dat thiet bi len xe', 0, NULL, 2),
(34, 9, 'Test tin hieu GPS truc tiep', 0, NULL, 3),
(35, 9, 'Huong dan khach su dung app', 0, NULL, 4),
(36, 9, 'Chup anh thiet bi sau khi lap', 0, NULL, 5),
(37, 10, 'Kiem tra thiet bi truoc khi lap', 0, NULL, 0),
(38, 10, 'Cap tai khoan / username cho khach', 0, NULL, 1),
(39, 10, 'Lap dat thiet bi len xe', 0, NULL, 2),
(40, 10, 'Test tin hieu GPS truc tiep', 0, NULL, 3),
(41, 10, 'Huong dan khach su dung app', 0, NULL, 4),
(42, 10, 'Chup anh thiet bi sau khi lap', 0, NULL, 5),
(43, 14, 'Kiem tra thiet bi truoc khi lap', 0, NULL, 0),
(44, 14, 'Cap tai khoan / username cho khach', 0, NULL, 1),
(45, 14, 'Lap dat thiet bi len xe', 0, NULL, 2),
(46, 14, 'Test tin hieu GPS truc tiep', 0, NULL, 3),
(47, 14, 'Huong dan khach su dung app', 0, NULL, 4),
(48, 14, 'Chup anh thiet bi sau khi lap', 0, NULL, 5),
(49, 15, 'Kiem tra thiet bi truoc khi lap', 0, NULL, 0),
(50, 15, 'Cap tai khoan / username cho khach', 0, NULL, 1),
(51, 15, 'Lap dat thiet bi len xe', 0, NULL, 2),
(52, 15, 'Test tin hieu GPS truc tiep', 0, NULL, 3),
(53, 15, 'Huong dan khach su dung app', 0, NULL, 4),
(54, 15, 'Chup anh thiet bi sau khi lap', 0, NULL, 5),
(55, 16, 'Kiem tra thiet bi truoc khi lap', 0, NULL, 0),
(56, 16, 'Cap tai khoan / username cho khach', 0, NULL, 1),
(57, 16, 'Lap dat thiet bi len xe', 0, NULL, 2),
(58, 16, 'Test tin hieu GPS truc tiep', 0, NULL, 3),
(59, 16, 'Huong dan khach su dung app', 0, NULL, 4),
(60, 16, 'Chup anh thiet bi sau khi lap', 0, NULL, 5),
(61, 18, 'Kiem tra thiet bi truoc khi lap', 0, NULL, 0),
(62, 18, 'Cap tai khoan / username cho khach', 0, NULL, 1),
(63, 18, 'Lap dat thiet bi len xe', 0, NULL, 2),
(64, 18, 'Test tin hieu GPS truc tiep', 0, NULL, 3),
(65, 18, 'Huong dan khach su dung app', 0, NULL, 4),
(66, 18, 'Chup anh thiet bi sau khi lap', 0, NULL, 5),
(67, 17, 'Kiem tra thiet bi truoc khi lap', 0, NULL, 0),
(68, 17, 'Cap tai khoan / username cho khach', 0, NULL, 1),
(69, 17, 'Lap dat thiet bi len xe', 0, NULL, 2),
(70, 17, 'Test tin hieu GPS truc tiep', 0, NULL, 3),
(71, 17, 'Huong dan khach su dung app', 0, NULL, 4),
(72, 17, 'Chup anh thiet bi sau khi lap', 0, NULL, 5),
(73, 19, 'Kiem tra thiet bi truoc khi lap', 0, NULL, 0),
(74, 19, 'Cap tai khoan / username cho khach', 0, NULL, 1),
(75, 19, 'Lap dat thiet bi len xe', 0, NULL, 2),
(76, 19, 'Test tin hieu GPS truc tiep', 0, NULL, 3),
(77, 19, 'Huong dan khach su dung app', 0, NULL, 4),
(78, 19, 'Chup anh thiet bi sau khi lap', 0, NULL, 5),
(79, 23, 'Kiem tra thiet bi truoc khi lap', 0, NULL, 0),
(80, 23, 'Cap tai khoan / username cho khach', 0, NULL, 1),
(81, 23, 'Lap dat thiet bi len xe', 0, NULL, 2),
(82, 23, 'Test tin hieu GPS truc tiep', 0, NULL, 3),
(83, 23, 'Huong dan khach su dung app', 0, NULL, 4),
(84, 23, 'Chup anh thiet bi sau khi lap', 0, NULL, 5),
(85, 24, 'Kiem tra thiet bi truoc khi lap', 0, NULL, 0),
(86, 24, 'Cap tai khoan / username cho khach', 0, NULL, 1),
(87, 24, 'Lap dat thiet bi len xe', 0, NULL, 2),
(88, 24, 'Test tin hieu GPS truc tiep', 0, NULL, 3),
(89, 24, 'Huong dan khach su dung app', 0, NULL, 4),
(90, 24, 'Chup anh thiet bi sau khi lap', 0, NULL, 5),
(91, 25, 'Kiem tra trang thai thiet bi', 0, NULL, 0),
(92, 25, 'Khac phuc loi neu co', 0, NULL, 1),
(93, 25, 'Bao cao tinh trang', 0, NULL, 2),
(94, 29, 'Kiem tra thiet bi truoc khi lap', 0, NULL, 0),
(95, 29, 'Cap tai khoan / username cho khach', 0, NULL, 1),
(96, 29, 'Lap dat thiet bi len xe', 0, NULL, 2),
(97, 29, 'Test tin hieu GPS truc tiep', 0, NULL, 3),
(98, 29, 'Huong dan khach su dung app', 0, NULL, 4),
(99, 29, 'Chup anh thiet bi sau khi lap', 0, NULL, 5);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_field_values`
--

CREATE TABLE `order_field_values` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `line_id` int(11) NOT NULL,
  `template_field_id` int(11) DEFAULT NULL,
  `label` varchar(150) NOT NULL,
  `value` text DEFAULT NULL,
  `seq` int(11) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_field_values`
--

INSERT INTO `order_field_values` (`id`, `order_id`, `line_id`, `template_field_id`, `label`, `value`, `seq`, `is_deleted`) VALUES
(3, 33, 3, 21, 'Bien so xe', '1234567890-=', 1, 0),
(4, 33, 3, 22, 'IMEI', '23452345', 2, 0),
(5, 33, 3, 23, 'Dia chi lap', '34566575876', 3, 0),
(6, 35, 7, 21, 'Biển số xe', '1234567890-=', 1, 0),
(7, 35, 7, 22, 'IMEI', '23452345', 2, 0),
(8, 35, 7, 23, 'Địa chỉ lắp', 'ethgjb', 3, 0),
(9, 35, 8, 27, 'Biển số xe', '2345', 1, 0),
(10, 35, 8, 28, 'IMEI', '23435467', 2, 0),
(11, 35, 8, 29, 'Số SIM mới', '24354365789', 3, 0),
(12, 36, 9, NULL, 'Bien so', '51A-99999', 1, 0),
(13, 37, 10, NULL, 'Bien so', '51A-99999', 1, 0),
(14, 38, 11, NULL, 'Bien so', '51A-99999', 1, 0),
(15, 39, 12, NULL, 'Bien so', '51A-99999', 1, 0),
(16, 40, 13, NULL, 'x', 'y', 1, 0),
(17, 41, 14, NULL, 'x', 'y', 1, 0),
(18, 42, 15, NULL, 'Bien so', '51A-99999', 1, 0),
(19, 43, 16, NULL, 'Bien so', '51A-99999', 1, 0),
(20, 44, 17, NULL, 'Bien so', '51A-99999', 1, 0),
(21, 45, 18, NULL, 'a', 'b', 1, 0),
(22, 46, 19, NULL, 'Bien so', '51A-12345', 1, 0),
(23, 51, 24, NULL, 'Bien so', '51F-99999', 1, 0),
(24, 51, 24, NULL, 'Loai xe', 'Tai 5 tan', 2, 0),
(25, 52, 25, NULL, 'Bien so', '99X-PENTEST', 1, 0),
(26, 53, 26, NULL, 'Bien so', '51K-12345', 1, 0),
(27, 61, 34, NULL, '<svg/onload=alert(1)>', 'javascript:alert(1)', 1, 0),
(28, 65, 39, NULL, '<script>alert(1)</script>', '<img src=x onerror=alert(1)>', 1, 0);

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
(72, 32, 1, 5, 1, 2500000, 0.00, NULL, NULL, NULL, NULL, NULL),
(73, 32, 2, 6, 1, 80000, 0.00, NULL, NULL, NULL, NULL, NULL),
(74, 33, 3, 5, 1, 4500000, 0.00, NULL, NULL, NULL, NULL, NULL),
(75, 33, 4, 7, 1, 10000, 0.00, NULL, NULL, NULL, NULL, NULL),
(76, 34, 5, 4, 1, 100000, 0.00, NULL, NULL, NULL, NULL, NULL),
(77, 34, 5, 3, 1, 2500000, 0.00, NULL, NULL, NULL, NULL, NULL),
(78, 34, 6, 3, 1, 2500000, 0.00, NULL, NULL, NULL, NULL, NULL),
(79, 35, 7, 7, 1, 10000, 0.00, NULL, NULL, NULL, NULL, NULL),
(80, 35, 7, 8, 1, 15000, 0.00, NULL, NULL, NULL, NULL, NULL),
(81, 35, 7, 8, 1, 15000, 0.00, NULL, NULL, NULL, NULL, NULL),
(82, 35, 8, 5, 1, 4500000, 0.00, NULL, NULL, NULL, NULL, NULL),
(83, 36, 9, 6, 1, 200000, 0.00, NULL, NULL, NULL, NULL, NULL),
(84, 37, 10, 6, 1, 200000, 0.00, NULL, NULL, NULL, NULL, NULL),
(85, 38, 11, 6, 1, 200000, 0.00, NULL, NULL, NULL, NULL, NULL),
(86, 39, 12, 4, 1, 100000, 0.00, NULL, NULL, NULL, NULL, NULL),
(87, 40, 13, 4, 1, 100000, 0.00, NULL, NULL, NULL, NULL, NULL),
(88, 42, 15, 4, 1, 100000, 0.00, NULL, NULL, NULL, NULL, NULL),
(89, 43, 16, 4, 1, 100000, 0.00, NULL, NULL, NULL, NULL, NULL),
(90, 44, 17, 4, 1, 100000, 0.00, NULL, NULL, NULL, NULL, NULL),
(91, 45, 18, 1, 1, 1490000, 0.00, NULL, NULL, NULL, NULL, NULL),
(92, 46, 19, 3, 1, 2500000, 0.00, NULL, NULL, NULL, NULL, NULL),
(93, 47, 20, 3, 1, 2500000, 0.00, NULL, NULL, NULL, NULL, NULL),
(94, 48, 21, 3, 999999, 2500000, 0.00, NULL, NULL, NULL, NULL, NULL),
(95, 49, 22, 10, 1, 0, 0.00, NULL, NULL, NULL, NULL, NULL),
(96, 51, 24, 3, 1, 2500000, 0.00, NULL, NULL, NULL, NULL, NULL),
(97, 51, 24, 6, 1, 200000, 0.00, NULL, NULL, NULL, NULL, NULL),
(98, 52, 25, 6, 1, 200000, 0.00, NULL, NULL, NULL, NULL, NULL),
(99, 53, 26, 1, 1, 1500000, 0.00, NULL, NULL, NULL, NULL, NULL),
(100, 54, 27, 6, 2, 200000, 0.00, NULL, NULL, NULL, NULL, NULL),
(101, 54, 27, 1, 1, 1490000, 0.00, NULL, NULL, NULL, NULL, NULL),
(102, 55, 28, 6, 1, 200000, 0.00, NULL, NULL, NULL, NULL, NULL),
(103, 56, 29, 6, 1, 100, 0.00, NULL, NULL, NULL, NULL, NULL),
(104, 57, 30, 1, 1, 1490000, 0.00, NULL, NULL, NULL, NULL, NULL),
(105, 58, 31, 1, 1, 1490000, 0.00, NULL, NULL, NULL, NULL, NULL),
(106, 59, 32, 3, 100, 2500000, 0.00, NULL, NULL, NULL, NULL, NULL),
(107, 60, 33, 6, 1, 200000, 0.00, NULL, NULL, NULL, NULL, NULL),
(108, 60, 33, 1, 1000000000, 1490000, 0.00, NULL, NULL, NULL, NULL, NULL),
(109, 61, 34, 6, 1, 200000, 0.00, NULL, NULL, NULL, NULL, NULL),
(110, 62, 35, 6, 1, 200000, 0.00, NULL, NULL, NULL, NULL, NULL),
(111, 64, 37, 6, 1, 200000, 0.00, NULL, NULL, NULL, NULL, NULL),
(112, 64, 38, 6, 1, 200000, 0.00, NULL, NULL, NULL, NULL, NULL),
(113, 65, 39, 1, 1, 1500000, 0.00, NULL, NULL, NULL, NULL, NULL);

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
(1, 32, 4, NULL, 1, 2520000, NULL, 0),
(2, 32, 1, NULL, 2, 100000, NULL, 0),
(3, 33, 1, NULL, 1, 4623000, NULL, 0),
(4, 33, 3, NULL, 2, 210000, NULL, 0),
(5, 34, 4, NULL, 1, 2600000, NULL, 0),
(6, 34, 4, NULL, 2, 2520000, NULL, 0),
(7, 35, 1, NULL, 1, 373333, NULL, 0),
(8, 35, 3, NULL, 2, 6811000, NULL, 0),
(9, 36, 1, NULL, 1, 200000, NULL, 0),
(10, 37, 1, NULL, 1, 200000, NULL, 0),
(11, 38, 1, NULL, 1, 200000, NULL, 0),
(12, 39, 1, NULL, 1, 0, 'Don thu nghiem', 0),
(13, 40, 1, NULL, 1, 0, NULL, 0),
(14, 41, 1, NULL, 1, 0, NULL, 0),
(15, 42, 1, NULL, 1, 0, 'Don thu nghiem', 0),
(16, 43, 1, NULL, 1, 0, 'Don thu nghiem', 0),
(17, 44, 1, NULL, 1, 0, 'Don thu nghiem', 0),
(18, 45, 1, NULL, 1, 0, NULL, 0),
(19, 46, 1, NULL, 1, 0, NULL, 0),
(20, 47, 1, NULL, 1, 0, NULL, 0),
(21, 48, 1, NULL, 1, 0, NULL, 0),
(22, 49, 1, NULL, 1, 0, NULL, 0),
(23, 50, 1, NULL, 1, 0, NULL, 0),
(24, 51, 1, NULL, 1, 0, NULL, 0),
(25, 52, 1, NULL, 1, 200000, 'lap moi cab', 0),
(26, 53, 1, NULL, 1, 1500000, NULL, 0),
(27, 54, 1, NULL, 1, 0, 'line lap dat', 0),
(28, 55, 1, NULL, 1, 0, NULL, 0),
(29, 56, 1, NULL, 1, 100, NULL, 0),
(30, 57, 1, NULL, 1, 0, NULL, 0),
(31, 58, 1, NULL, 1, 0, NULL, 0),
(32, 59, 1, NULL, 1, 0, NULL, 0),
(33, 60, 1, NULL, 1, 0, NULL, 0),
(34, 61, 1, NULL, 1, 0, NULL, 0),
(35, 62, 1, NULL, 1, 0, NULL, 0),
(36, 63, 1, NULL, 1, 0, NULL, 0),
(37, 64, 1, NULL, 1, 0, NULL, 0),
(38, 64, 1, NULL, 2, 0, NULL, 0),
(39, 65, 1, NULL, 1, 1500000, NULL, 0);

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

--
-- Đang đổ dữ liệu cho bảng `order_payments`
--

INSERT INTO `order_payments` (`id`, `order_id`, `amount`, `source`, `confirmed`, `confirmed_at`, `confirmed_by`, `collection_id`, `staff_id`, `paid_at`, `note`, `proof_urls`, `is_deleted`) VALUES
(9, 35, 5000000, 'admin_pending', 0, NULL, NULL, NULL, 3, '2026-05-10 15:20:38', 'KTV bao khach da tra admin truc tiep — doi admin xac nhan', NULL, 0),
(10, 37, 200000, 'staff_collection', 1, NULL, NULL, 7, 2, '2026-05-10 17:33:14', NULL, NULL, 0),
(11, 38, 200000, 'staff_collection', 1, NULL, NULL, 8, 2, '2026-05-10 17:38:24', NULL, NULL, 0),
(12, 52, 200000, 'admin_mark_paid', 1, '2026-05-10 18:09:29', 1, NULL, NULL, '2026-05-10 18:09:29', '[method=cash] thu tien tu KH pentest', NULL, 0),
(13, 53, 1500000, 'admin_mark_paid', 1, '2026-05-10 18:09:47', 5, NULL, NULL, '2026-05-10 18:09:47', '[method=cash] BOT end-to-end', NULL, 0),
(14, 65, 1000000, 'admin_mark_paid', 1, '2026-05-10 18:11:53', 5, NULL, NULL, '2026-05-10 18:11:53', '[method=cash]', NULL, 0);

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
(1, 35, '', 'https://i.ibb.co/VWbXG661/order-35-1778397227551.png', NULL, 1, '2026-05-10 07:13:53', 0),
(2, 35, '', 'https://i.ibb.co/PsJJ2rz3/order-35-1778397579681.jpg', NULL, 1, '2026-05-10 07:19:42', 0),
(3, 35, '', 'https://i.ibb.co/WvbtYt2L/70a561a5147f.png', 'mô tả', 3, '2026-05-10 07:24:38', 0),
(4, 36, '', 'https://i.ibb.co/abc1234/test-photo.jpg', 'Anh truoc khi lap', 2, '2026-05-10 10:32:46', 0),
(5, 37, '', 'https://i.ibb.co/abc1234/test-photo.jpg', 'Anh truoc khi lap', 2, '2026-05-10 10:33:14', 0),
(6, 38, '', 'https://i.ibb.co/abc1234/test-photo.jpg', 'Anh truoc khi lap', 2, '2026-05-10 10:38:24', 0);

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
(5, 'Phù hiệu', 'Làm phù hiệu xe', 1, 5, 0);

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
(23, 1, 3, 'Địa chỉ lắp', 'textarea', 0, 'Địa chỉ lắp đặt thực tế', 0),
(24, 2, 1, 'Biển số xe', 'text', 1, NULL, 0),
(25, 2, 2, 'IMEI', 'text', 1, NULL, 0),
(26, 2, 3, 'Số năm', 'number', 1, 'VD: 1, 2, 3', 0),
(27, 3, 1, 'Biển số xe', 'text', 1, NULL, 0),
(28, 3, 2, 'IMEI', 'text', 1, NULL, 0),
(29, 3, 3, 'Số SIM mới', 'text', 1, NULL, 0),
(30, 4, 1, 'Biển số xe', 'text', 1, NULL, 0),
(31, 4, 2, 'IMEI', 'text', 1, NULL, 0),
(32, 5, 1, 'Biển số xe', 'text', 1, NULL, 0),
(33, 5, 2, 'Loại phù hiệu', 'text', 0, 'VD: kinh doanh vận tải...', 0);

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
(1, 'VT-01', 'Thiet bi dinh vi VT-01', 1, NULL, NULL, 12, 1200000, 'Thiet bi dinh vi xe may, nguon DC 9-36V', 0),
(2, '123123', 'Thiet bi dinh vi VT-01', 1, '/uploads/products/1777119310327-10f8d5982ecb.jpg', '/uploads/products/1777119310330-ba53978a874d.jpg', 12, 2149000, NULL, 0),
(3, 'VT-02', 'Định vị VT-02 Pro (4G)', 5, NULL, NULL, 24, 1200000, 'Sản phẩm mẫu cho test', 0),
(4, 'CAM-01', 'Camera AHD 1080p', 6, NULL, NULL, 12, 600000, 'Sản phẩm mẫu cho test', 0),
(5, 'MDVR-04', 'Đầu ghi MDVR 4 kênh', 7, NULL, NULL, 24, 2500000, 'Sản phẩm mẫu cho test', 0),
(6, 'CAB-OBD', 'Cáp OBD II', 4, NULL, NULL, 6, 80000, 'Sản phẩm mẫu cho test', 0),
(7, 'HR21421', 'sản phẩm A', 1, '/uploads/products/1777353371046-24670025103b.jpg', '/uploads/products/1777353371046-24670025103b.jpg', 12, 10000000, 'đây là mô tả ngắn', 0),
(8, 'cccd', 'Thiet bi dinh vi VT-01', 1, '/uploads/products/1777177761437-82c5eebef5ef.jpg', '/uploads/products/1777177761440-e258f032044f.jpg', 12, 100000, 'Cách hoạt động: Thay vì gửi hình ảnh hay video (rất nặng), nó ghi lại toàn bộ sự thay đổi của mã HTML và chuyển động chuột dưới dạng dữ liệu JSON siêu nhẹ. Sau đó, ở phía bạn, hệ thống sẽ \"diễn\" lại các dữ liệu đó trên một trình duyệt ảo.', 0),
(9, 'RENEW', 'Phí gia hạn dịch vụ GPS', NULL, NULL, NULL, 0, 0, NULL, 0),
(10, 'REPAIR_SERVICE', 'Công sửa chữa GPS', NULL, NULL, NULL, 0, 0, NULL, 0);

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
(5, 94),
(6, 23),
(7, 93),
(8, 11);

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
(10, 2, 200000, 200000, 0, 'cash', NULL, 'KTV nop tien thu ho', '2026-05-10 17:38:24', 1, '2026-05-10 17:38:24', NULL, 'approved', 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `staff`
--

CREATE TABLE `staff` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `role` enum('admin','kithuat') NOT NULL DEFAULT 'kithuat',
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
(3, 'ktv02', '$2a$10$L4aIOLbgLmJAWHHrjqatQOPiQBtn3bmFhnhn2YmAe.8PnNS1itDjy', 'Lê Văn Hùng', 'kithuat', 'Quận 7, TP.HCM', '0911000002', NULL, 'ktv02@gpsviet.vn', '/uploads/avatars/1777307658207-576f07723087.jpg', 0, '2026-04-25 16:30:31', '2026-05-10 08:05:38', 'offline', 4.20, 859002),
(4, 'ktv03', '$2a$10$HRV2uqp5KUUOGmsnb1Z4nOk4dcDPf9uxDrPSibpA1/Nac5rXpmkKu', 'Nguyễn Đức Thành', 'kithuat', 'Bình Dương', '0911000003', NULL, 'ktv03@gpsviet.vn', NULL, 0, '2026-04-25 16:30:31', '2026-04-25 16:30:31', 'online', 4.80, 0),
(5, 'botadmin', '$2a$10$NtsG/s/3Y3aoP/fvH6h1xuDvtQOOrVyH0pojC9Wrh0kOaMSQ5qKSK', 'Admin Bot Pentest', 'admin', NULL, '0900000099', NULL, 'botadmin@gpsviet.local', NULL, 0, '2026-05-10 11:06:38', '2026-05-10 11:11:12', 'offline', 0.00, 0);

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
(22, 3, 5, 4, '2026-05-10 15:03:18'),
(23, 3, 8, 8, '2026-05-10 15:03:18'),
(24, 3, 7, 9, '2026-05-10 15:20:27'),
(25, 2, 6, 5, '2026-05-10 17:32:46');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `staff_payroll_periods`
--

CREATE TABLE `staff_payroll_periods` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `period` char(7) NOT NULL,
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
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
(54, 'PX-260510-010', 'out', 'staff_grant', 'cap cho don 52', NULL, 2, NULL, NULL, 1, '2026-05-10 11:09:17', 0, NULL, NULL, NULL);

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
(65, 54, 6, 1, NULL, 'PENTEST-CAB-001', NULL);

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
(5, 'KK-260510-003', 'cancelled', '2026-05-10 17:38:24', NULL, 1, NULL, 'E2E kiem ke test', 0, 0, 0);

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
(3, 5, 6, 19, 3, NULL, NULL);

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
  ADD KEY `fk_cust_tier` (`default_tier_id`);

--
-- Chỉ mục cho bảng `customer_accounts`
--
ALTER TABLE `customer_accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ca_customer` (`customer_id`,`is_deleted`);

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
  ADD KEY `idx_orders_collected_for_dealer` (`collected_for_dealer`);

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
  ADD KEY `idx_ofv_line` (`line_id`);

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
  ADD KEY `idx_spp_period` (`period`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT cho bảng `customer_accounts`
--
ALTER TABLE `customer_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `customer_product_prices`
--
ALTER TABLE `customer_product_prices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `customer_sims`
--
ALTER TABLE `customer_sims`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `customer_update_requests`
--
ALTER TABLE `customer_update_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `customer_vehicles`
--
ALTER TABLE `customer_vehicles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `debt_settlements`
--
ALTER TABLE `debt_settlements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT cho bảng `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

--
-- AUTO_INCREMENT cho bảng `order_attachments`
--
ALTER TABLE `order_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT cho bảng `order_charges`
--
ALTER TABLE `order_charges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=104;

--
-- AUTO_INCREMENT cho bảng `order_checklist`
--
ALTER TABLE `order_checklist`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT cho bảng `order_field_values`
--
ALTER TABLE `order_field_values`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT cho bảng `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=114;

--
-- AUTO_INCREMENT cho bảng `order_lines`
--
ALTER TABLE `order_lines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT cho bảng `order_payments`
--
ALTER TABLE `order_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT cho bảng `order_step_photos`
--
ALTER TABLE `order_step_photos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `order_templates`
--
ALTER TABLE `order_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `order_template_fields`
--
ALTER TABLE `order_template_fields`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT cho bảng `order_workflow_steps`
--
ALTER TABLE `order_workflow_steps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT cho bảng `price_tiers`
--
ALTER TABLE `price_tiers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT cho bảng `staff`
--
ALTER TABLE `staff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `staff_holdings`
--
ALTER TABLE `staff_holdings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT cho bảng `staff_payroll_periods`
--
ALTER TABLE `staff_payroll_periods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT cho bảng `stock_receipt_items`
--
ALTER TABLE `stock_receipt_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT cho bảng `stock_takes`
--
ALTER TABLE `stock_takes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `stock_take_lines`
--
ALTER TABLE `stock_take_lines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
  ADD CONSTRAINT `fk_cust_tier` FOREIGN KEY (`default_tier_id`) REFERENCES `price_tiers` (`id`) ON DELETE SET NULL;

--
-- Các ràng buộc cho bảng `customer_accounts`
--
ALTER TABLE `customer_accounts`
  ADD CONSTRAINT `fk_ca_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
  ADD CONSTRAINT `fk_orders_dealer` FOREIGN KEY (`dealer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
