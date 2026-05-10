-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th4 29, 2026 lúc 09:15 AM
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
-- Cấu trúc bảng cho bảng `badges`
--

CREATE TABLE `badges` (
  `id` int(11) NOT NULL,
  `code` varchar(30) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `dealer_id` int(11) DEFAULT NULL,
  `order_id` int(11) DEFAULT NULL,
  `vehicle_plate` varchar(30) NOT NULL,
  `vehicle_type` enum('truck_under_3.5t','truck_over_3.5t','passenger','contract','taxi','other') NOT NULL DEFAULT 'truck_under_3.5t',
  `status` enum('pending_review','submitted','approved','rejected','delivered','cancelled') NOT NULL DEFAULT 'pending_review',
  `fee_amount` bigint(20) NOT NULL DEFAULT 0,
  `paid_amount` bigint(20) NOT NULL DEFAULT 0,
  `submitted_at` datetime DEFAULT NULL,
  `result_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `reject_reason` varchar(500) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `creator_type` enum('customer','dealer','admin','staff') NOT NULL DEFAULT 'admin',
  `creator_id` int(11) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `badge_attachments`
--

CREATE TABLE `badge_attachments` (
  `id` int(11) NOT NULL,
  `badge_id` int(11) NOT NULL,
  `url` varchar(500) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `kind` enum('vehicle_reg','cccd','license','other') NOT NULL DEFAULT 'other',
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
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
(5, 6, 3, 7777000, 'cash', NULL, '2026-04-29 10:52:51', 0, NULL, 0),
(6, 15, 3, 5082002, 'cash', NULL, '2026-04-29 11:47:25', 0, NULL, 0);

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
(2, 4, '2026-04-29 12:50:02', 0);

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
(5, 2, 3, '2026-04-29 12:36:04', NULL, 1);

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
(1, 'KH001', 'retail', 'Nguyen Van An', '0901111111', 'an.nv@example.com', 'Ha Noi', NULL, 'Khach le mau', NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-04-26 02:30:52', '2026-04-25 10:35:28', '2026-04-26 11:54:41'),
(2, 'KH002', 'retail', 'Tran Thi Binh', '0902222222', NULL, 'Hai Phong', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-04-26 02:30:52', '2026-04-25 10:35:28', '2026-04-26 11:54:41'),
(3, 'DL001', 'dealer', 'Le Van Cuong', '0903333333', 'cuong@gpshanoi.vn', 'Ha Noi', NULL, 'Dai ly cap 1', 'Cong ty TNHH GPS Ha Noi', '0101234567', 'Le Van Cuong', 50000000, 30, 0, 5.00, 6, '$2a$10$e14olmdWTDynd6tIR142zeWPdoDPP7i6w3399iVIAwCfj9ocuV8pq', 0, '2026-04-26 02:30:52', '2026-04-25 10:35:28', '2026-04-26 14:01:40'),
(4, 'DL002', 'dealer', 'Pham Thi Dung', '0904444444', 'dung@gpsdanang.vn', 'Da Nang', '/uploads/avatars/1777114898932-210d9bf706ab.png', 'Dai ly cap 2', 'GPS Mien Trung', '0107654321', 'Pham Thi Dung', 30000000, 15, 0, 3.00, 6, '$2a$10$xqlCwt5yCHrI8YFETYEp3e83C2IjbBbt6TDox2dasTd00jXI7I1Fm', 0, '2026-04-26 02:30:52', '2026-04-25 10:35:28', '2026-04-28 10:01:54'),
(5, 'KH003', 'retail', 'Lê Hoàng Cường', '0923456789', NULL, 'Q.7, TP.HCM', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-04-26 02:30:52', '2026-04-25 16:30:31', '2026-04-26 11:54:41'),
(6, 'KH004', 'retail', 'Phạm Thanh Dũng', '0934567890', NULL, 'Bình Dương', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-04-26 02:30:52', '2026-04-25 16:30:31', '2026-04-26 11:54:41'),
(7, 'KH0005', 'retail', 'ngueyén van a', '0312313123', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-04-26 11:35:23', '2026-04-26 04:33:39', '2026-04-28 13:18:55'),
(9, 'KH0006', 'retail', 'alo', '0362469321', NULL, 'đia chỉ', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-04-26 17:43:31', '2026-04-26 10:36:26', '2026-04-26 11:54:41');

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
(3, 4, 1, 0.00);

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
(3, 'TT-2804-003', 7, 189980, 189980, 0, 1, 'cash', NULL, NULL, 1, '2026-04-28 20:18:55', 0);

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
  `repair_order_id` int(11) DEFAULT NULL,
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

INSERT INTO `messages` (`id`, `conversation_id`, `order_id`, `repair_order_id`, `sender_type`, `sender_id`, `content`, `visibility`, `sent_at`, `read_at`) VALUES
(1, 1, NULL, NULL, 'customer', 7, 'Xin chào, mình quan tâm sản phẩm:\n• Thiet bi dinh vi VT-01 (Mã cccd)\n• Giá: 15.000đ\n• http://localhost:5170/customer/product-detail.html?id=8\nMình cần được tư vấn thêm.', 'all', '2026-04-28 13:26:26', '2026-04-28 13:26:35'),
(2, 1, NULL, NULL, 'staff', 1, 'tu cái gì mà tư', 'all', '2026-04-28 13:26:45', NULL),
(3, 2, NULL, NULL, 'customer', 4, 'aloo', 'all', '2026-04-29 12:43:41', '2026-04-29 12:43:46'),
(4, 2, NULL, NULL, 'staff', 1, 'dạ', 'all', '2026-04-29 12:43:49', NULL),
(5, 2, NULL, NULL, 'customer', 4, 'alooooooo', 'all', '2026-04-29 12:44:08', '2026-04-29 12:44:08'),
(6, 2, NULL, NULL, 'customer', 4, 'https://i.ibb.co/KczVZfjM/cv2-1777441761632.jpg', 'staff_only', '2026-04-29 12:49:23', '2026-04-29 12:49:24'),
(7, 2, NULL, NULL, 'customer', 4, 'https://i.ibb.co/KczVZfjM/cv2-1777441761632.jpg', 'staff_only', '2026-04-29 12:50:02', '2026-04-29 12:50:03');

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
(1, 'order_completed', 'ORD-2904-001: KTV hoàn thành', 'Lê Văn Hùng — Pham Thi Dung — 120.000đ', '/admin/orders.html#order-17', 17, 4, 3, 1, '2026-04-29 12:31:44', 0, '2026-04-29 05:31:33'),
(2, 'order_new', 'Đơn mới ORD-2904-003', 'Pham Thi Dung vừa tạo đơn Bảo hành', '/admin/orders.html#order-19', 19, 4, NULL, 1, '2026-04-29 12:32:51', 0, '2026-04-29 05:32:47');

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
  `status` enum('pending_review','new','assigned','warehouse_released','in_progress','done','cancelled','customer_owes','pending_admin_confirm','staff_owes','quoted','awaiting_payment','payment_reported') NOT NULL DEFAULT 'new',
  `has_return` tinyint(1) NOT NULL DEFAULT 0,
  `seen_at` datetime DEFAULT NULL,
  `area` varchar(100) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `vehicle_plate` varchar(30) DEFAULT NULL,
  `subscription_account` varchar(64) DEFAULT NULL,
  `public_token` varchar(64) DEFAULT NULL,
  `service_kind` enum('install','maintenance','warranty','renewal','badge') NOT NULL DEFAULT 'install',
  `assigned_staff_id` int(11) DEFAULT NULL,
  `kind` enum('install','maintenance','renew','uninstall') NOT NULL DEFAULT 'install',
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

INSERT INTO `orders` (`id`, `code`, `customer_id`, `dealer_id`, `total_amount`, `subtotal`, `paid_amount`, `debt_carried_at`, `debt_settlement_id`, `payment_method`, `status`, `has_return`, `seen_at`, `area`, `address`, `vehicle_plate`, `subscription_account`, `public_token`, `service_kind`, `assigned_staff_id`, `kind`, `due_at`, `started_at`, `completed_at`, `wage_amount`, `ktv_note`, `note`, `creator_type`, `creator_id`, `confirmed_at`, `confirmed_by`, `is_deleted`, `created_at`) VALUES
(1, 'ORD-2604-001', 7, NULL, 7100000, 7000000, 0, NULL, NULL, 'debt', 'new', 0, '2026-04-26 11:34:07', 'mỹ', NULL, NULL, NULL, NULL, 'renewal', NULL, 'install', NULL, NULL, NULL, 0, NULL, '[Tu van TV-2604-005]', 'admin', 1, '2026-04-27 23:24:09', 1, 0, '2026-04-27 16:24:09'),
(2, 'ORD-2604-002', 9, NULL, 248378002, 246379000, 0, NULL, NULL, 'debt', 'cancelled', 0, '2026-04-26 22:30:46', NULL, 'hehehe', NULL, NULL, NULL, 'install', 3, 'install', NULL, '2026-04-28 00:55:33', NULL, 0, NULL, '[CANCEL] không có lí do gì', 'customer', 9, '2026-04-27 18:20:46', 1, 0, '2026-04-27 11:20:46'),
(3, 'ORD-2704-001', 7, NULL, 16000000, 16000000, 0, NULL, NULL, 'debt', 'new', 0, '2026-04-27 18:53:20', NULL, 'bang tex', NULL, NULL, NULL, 'install', NULL, 'install', NULL, NULL, NULL, 0, NULL, NULL, 'customer', 7, '2026-04-27 22:53:18', 1, 0, '2026-04-27 15:53:18'),
(4, 'ORD-2804-001', 7, NULL, 7790000, 7100000, 0, NULL, NULL, 'debt', 'new', 0, '2026-04-28 01:36:50', NULL, 'bang tex', NULL, NULL, NULL, 'install', NULL, 'install', NULL, NULL, NULL, 0, NULL, 'ghi chú', 'customer', 7, '2026-04-28 01:37:39', 1, 0, '2026-04-27 18:37:39'),
(5, 'ORD-2804-002', 7, NULL, 2500000, 2500000, 2500000, NULL, NULL, 'debt', 'done', 0, '2026-04-28 01:39:12', 'quậnk 2', 'wqeda ád ác', NULL, NULL, NULL, 'install', 3, 'install', NULL, NULL, '2026-04-28 01:54:33', 10000, NULL, 'áđưa', 'customer', 7, '2026-04-28 01:44:08', 1, 0, '2026-04-27 18:44:08'),
(6, 'ORD-2804-003', 7, NULL, 130934000, 123147000, 130934000, NULL, NULL, 'debt', 'staff_owes', 0, '2026-04-28 02:09:14', NULL, 'bang tex', NULL, NULL, NULL, 'install', 3, 'install', NULL, '2026-04-29 10:51:45', '2026-04-29 10:52:51', 50000, NULL, 'ghi chú', 'customer', 7, '2026-04-28 02:18:31', 1, 0, '2026-04-27 19:18:31'),
(7, 'ORD-2804-004', 7, NULL, 4510000, 4510000, 0, NULL, NULL, 'debt', 'cancelled', 0, '2026-04-28 12:41:45', NULL, 'jmjhmm', NULL, NULL, NULL, 'install', 3, 'install', NULL, NULL, NULL, 200000, NULL, '[CANCEL] sad', 'customer', 7, '2026-04-28 12:42:23', 1, 0, '2026-04-28 05:42:23'),
(8, 'ORD-2804-005', 7, NULL, 7040000, 7000000, 7040000, NULL, NULL, 'debt', 'done', 0, '2026-04-28 13:14:17', NULL, 'frg tfrt', NULL, NULL, NULL, 'install', 3, 'install', NULL, '2026-04-28 13:49:58', '2026-04-28 13:54:37', 330000, NULL, NULL, 'customer', 7, '2026-04-28 13:16:07', 1, 0, '2026-04-28 06:16:07'),
(9, 'ORD-2804-006', 7, NULL, 515000, 115000, 0, NULL, NULL, 'debt', 'pending_admin_confirm', 0, '2026-04-28 13:34:43', NULL, 'ssfsdf', NULL, NULL, NULL, 'install', 3, 'install', NULL, '2026-04-28 13:53:42', '2026-04-28 14:27:20', 60000, NULL, NULL, 'customer', 7, '2026-04-28 13:39:28', 1, 0, '2026-04-28 06:39:28'),
(10, 'ORD-2804-007', 7, NULL, 389980, 200000, 0, '2026-04-28 20:10:54', 2, 'debt', 'done', 0, '2026-04-28 14:40:42', 'uk', 'k,', NULL, NULL, NULL, 'install', 3, 'install', NULL, '2026-04-28 15:06:45', '2026-04-28 23:54:35', 200000, NULL, NULL, 'customer', 7, '2026-04-28 14:41:30', 1, 0, '2026-04-28 07:41:30'),
(11, 'ORD-2804-008', 4, NULL, 90000, 90000, 90000, NULL, NULL, 'transfer', 'done', 0, '2026-04-28 19:48:44', NULL, NULL, '34432', 'rvsdg', 'e68e51c673e2975b39b5937a5d96165925897c843dc2a617', 'renewal', NULL, 'install', NULL, NULL, '2026-04-28 23:54:35', 0, NULL, 'Gia hạn 1 năm\nSự cố: ưqưdq\ndưqđứ', 'dealer', 4, '2026-04-28 19:49:50', 1, 0, '2026-04-28 12:49:50'),
(12, 'ORD-2804-009', 4, NULL, 213000, 213000, 0, '2026-04-28 20:07:53', 1, 'debt', 'done', 0, '2026-04-28 20:00:07', NULL, NULL, '34432', 'rvsdg', '639f40e00d8ae51898ce4a8b5a4c4357acf0ce29b3cde2ec', 'renewal', NULL, 'install', NULL, NULL, '2026-04-28 23:54:35', 0, NULL, 'Gia hạn 1 năm', 'dealer', 4, '2026-04-28 20:01:09', 1, 0, '2026-04-28 12:59:42'),
(14, 'ORD-2804-010', 4, NULL, 260000, 200000, 260000, NULL, NULL, 'debt', 'done', 0, '2026-04-28 20:20:42', NULL, 'đáád', NULL, NULL, NULL, 'install', 3, 'install', NULL, '2026-04-28 20:31:47', '2026-04-28 20:52:58', 100000, NULL, 'áđá', 'dealer', 4, '2026-04-28 20:21:09', 1, 0, '2026-04-28 13:18:10'),
(15, 'ORD-2804-011', 4, NULL, 5082002, 4880000, 5082002, NULL, NULL, 'debt', 'staff_owes', 0, '2026-04-28 20:22:30', NULL, 'Da Nang', NULL, NULL, NULL, 'install', 3, 'install', NULL, '2026-04-29 11:11:36', '2026-04-29 11:47:25', 200002, NULL, 'ád', 'dealer', 4, '2026-04-28 20:23:27', 1, 0, '2026-04-28 13:22:24'),
(16, 'ORD-2804-012', 4, NULL, 110000, 90000, 0, NULL, NULL, 'debt', 'customer_owes', 0, '2026-04-28 21:37:30', NULL, 'Da Nang', NULL, NULL, NULL, 'install', 3, 'install', NULL, '2026-04-29 10:29:22', '2026-04-29 11:09:37', 20000, NULL, NULL, 'dealer', 4, '2026-04-28 21:37:37', 1, 0, '2026-04-28 14:37:26'),
(17, 'ORD-2904-001', 4, NULL, 120000, 100000, 0, NULL, NULL, 'debt', 'customer_owes', 0, '2026-04-29 11:01:40', NULL, 'Da Nang', NULL, NULL, NULL, 'install', 3, 'install', NULL, '2026-04-29 12:30:56', '2026-04-29 12:31:33', 20000, NULL, 'qưeqưeqưe', 'dealer', 4, '2026-04-29 12:30:30', 1, 0, '2026-04-29 03:43:56'),
(18, 'ORD-2904-002', 4, NULL, 1351000, 100000, 0, NULL, NULL, 'debt', 'customer_owes', 0, '2026-04-29 11:19:53', NULL, 'iôi.', '34432', 'rvsdg', NULL, 'maintenance', 3, 'install', NULL, '2026-04-29 11:30:17', '2026-04-29 11:31:19', 20000, NULL, 'Sự cố: oyi;.', 'dealer', 4, '2026-04-29 11:20:45', 1, 0, '2026-04-29 04:19:17'),
(19, 'ORD-2904-003', 4, NULL, 100000, 100000, 0, NULL, NULL, 'debt', 'assigned', 0, '2026-04-29 12:32:52', NULL, NULL, '34432', 'rvsdg', NULL, 'warranty', 3, 'install', NULL, NULL, NULL, 0, NULL, 'Sự cố: 56ụ5ỵ\n565rjhr', 'dealer', 4, '2026-04-29 12:35:49', 1, 0, '2026-04-29 05:32:47');

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
(16, 17, 'https://i.ibb.co/xSM3BCkG/order-17-deliver.jpg', NULL, 'deliver', '2026-04-29 05:31:28');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_charges`
--

CREATE TABLE `order_charges` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `kind` enum('shipping','discount','fee') NOT NULL DEFAULT 'fee',
  `label` varchar(150) NOT NULL,
  `amount` bigint(20) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_charges`
--

INSERT INTO `order_charges` (`id`, `order_id`, `kind`, `label`, `amount`, `is_deleted`) VALUES
(2, 1, 'shipping', 'ship', 100000, 0),
(9, 2, 'shipping', 'phí bảo hành', 1000002, 0),
(10, 2, 'fee', 'Lắp đặt', 1000000, 0),
(11, 2, 'discount', 'Giảm giá', -1000, 0),
(13, 4, 'fee', 'Lắp đặt', 590000, 0),
(14, 4, 'fee', 'phí khác', 100000, 0),
(19, 8, 'fee', 'phí khác', 40000, 0),
(20, 9, 'fee', 'Công lắp', 400000, 0),
(24, 10, 'discount', 'Giảm giá', -10000, 0),
(25, 10, 'fee', 'Công lắp', 200000, 0),
(26, 10, 'discount', 'Vận chuyển', -20, 0),
(34, 15, 'fee', 'Công lắp', 200002, 0),
(35, 15, 'shipping', 'Vận chuyển', 2000, 0),
(38, 14, 'fee', 'Công lắp', 100000, 0),
(39, 14, 'fee', 'tièn khác', 10000, 0),
(40, 14, 'discount', 'tiền khác nữa', -50000, 0),
(41, 16, 'fee', 'Công lắp', 20000, 0),
(46, 6, 'fee', 'Lắp đặt', 10000, 0),
(47, 6, 'fee', 'Công lắp', 50000, 0),
(48, 6, 'shipping', 'Vận chuyển', 70000, 0),
(49, 6, 'fee', 'khác', 7657000, 0),
(50, 18, 'fee', 'phí', 1231000, 0),
(51, 18, 'fee', 'Công lắp', 20000, 1),
(52, 18, 'fee', 'Công lắp', 20000, 1),
(53, 18, 'fee', 'Công lắp', 20000, 1),
(54, 18, 'fee', 'Công lắp', 20000, 0),
(55, 17, 'fee', 'Công lắp', 20000, 0);

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
(78, 19, 'Chup anh thiet bi sau khi lap', 0, NULL, 5);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL DEFAULT 1,
  `unit_price` bigint(20) NOT NULL DEFAULT 0,
  `vehicle_plate` varchar(200) DEFAULT NULL,
  `imei` varchar(100) DEFAULT NULL,
  `subscription_account` varchar(64) DEFAULT NULL,
  `years` tinyint(4) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `qty`, `unit_price`, `vehicle_plate`, `imei`, `subscription_account`, `years`, `phone`) VALUES
(1, 1, 5, 1, 4500000, NULL, NULL, NULL, NULL, NULL),
(2, 1, 3, 1, 2500000, NULL, NULL, NULL, NULL, NULL),
(5, 3, 5, 3, 4500000, NULL, NULL, NULL, NULL, NULL),
(6, 3, 3, 1, 2500000, NULL, NULL, NULL, NULL, NULL),
(21, 2, 2, 2, 123132000, NULL, NULL, NULL, NULL, NULL),
(22, 2, 4, 1, 100000, NULL, NULL, NULL, NULL, NULL),
(23, 2, 8, 1, 15000, NULL, NULL, NULL, NULL, NULL),
(26, 4, 5, 1, 4500000, NULL, NULL, NULL, NULL, NULL),
(27, 4, 3, 1, 2500000, NULL, NULL, NULL, NULL, NULL),
(28, 4, 4, 1, 100000, NULL, NULL, NULL, NULL, NULL),
(29, 5, 3, 1, 2500000, NULL, NULL, NULL, NULL, NULL),
(30, 6, 8, 1, 15000, NULL, NULL, NULL, NULL, NULL),
(31, 6, 2, 1, 123132000, NULL, NULL, NULL, NULL, NULL),
(32, 7, 5, 1, 4500000, NULL, NULL, NULL, NULL, NULL),
(33, 7, 7, 1, 10000, NULL, NULL, NULL, NULL, NULL),
(34, 8, 5, 1, 4500000, NULL, NULL, NULL, NULL, NULL),
(35, 8, 3, 1, 2500000, NULL, NULL, NULL, NULL, NULL),
(36, 9, 8, 1, 15000, NULL, NULL, NULL, NULL, NULL),
(37, 9, 4, 1, 100000, NULL, NULL, NULL, NULL, NULL),
(38, 10, 6, 1, 200000, NULL, NULL, NULL, NULL, NULL),
(40, 11, 4, 1, 90000, NULL, NULL, NULL, 1, NULL),
(42, 12, 4, 1, 90000, '22213', '123123123', '213123', 1, NULL),
(43, 12, 6, 1, 123000, '123123', '123123', '123123', 1, NULL),
(45, 15, 4, 2, 90000, NULL, NULL, NULL, NULL, NULL),
(46, 15, 5, 1, 4500000, NULL, NULL, NULL, NULL, NULL),
(47, 15, 6, 1, 200000, NULL, NULL, NULL, NULL, NULL),
(50, 14, 6, 1, 200000, NULL, NULL, NULL, NULL, NULL),
(51, 16, 4, 1, 90000, NULL, NULL, NULL, NULL, NULL),
(53, 18, 4, 1, 100000, NULL, NULL, NULL, NULL, NULL),
(56, 17, 4, 1, 100000, NULL, NULL, NULL, NULL, NULL),
(57, 19, 4, 1, 100000, NULL, NULL, NULL, NULL, NULL);

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
  `is_deleted` tinyint(4) NOT NULL DEFAULT 0
) ;

--
-- Đang đổ dữ liệu cho bảng `order_payments`
--

INSERT INTO `order_payments` (`id`, `order_id`, `amount`, `source`, `confirmed`, `confirmed_at`, `confirmed_by`, `collection_id`, `staff_id`, `paid_at`, `note`, `is_deleted`) VALUES
(1, 5, 2500000, 'staff_collection', 1, NULL, NULL, 1, 3, '2026-04-28 01:54:33', NULL, 0),
(2, 6, 123157000, 'staff_collection', 1, NULL, NULL, 2, 3, '2026-04-28 02:50:02', NULL, 0),
(3, 8, 7040000, 'staff_collection', 1, NULL, NULL, 3, 3, '2026-04-28 13:54:37', NULL, 0),
(4, 9, 515000, 'admin_pending', 0, NULL, NULL, NULL, 3, '2026-04-28 14:27:20', 'KTV bao khach da tra admin truc tiep — doi admin xac nhan', 0),
(5, 11, 90000, 'admin_mark_paid', 1, '2026-04-28 19:50:48', 1, NULL, 1, '2026-04-28 19:50:48', 'Hoan tat gia han', 0),
(6, 14, 260000, 'staff_collection', 1, NULL, NULL, 4, 3, '2026-04-28 20:52:58', NULL, 0),
(7, 6, 7777000, 'staff_collection', 1, NULL, NULL, 5, 3, '2026-04-29 10:52:51', NULL, 0),
(8, 15, 5082002, 'staff_collection', 1, NULL, NULL, 6, 3, '2026-04-29 11:47:25', NULL, 0);

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
) ;

--
-- Đang đổ dữ liệu cho bảng `product_stock`
--

INSERT INTO `product_stock` (`product_id`, `quantity`) VALUES
(1, 6),
(2, 19),
(3, 4),
(4, 17),
(5, 99),
(6, 11),
(7, 13),
(8, 9);

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
) ;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `remittances`
--

CREATE TABLE `remittances` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `amount` bigint(20) NOT NULL,
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

INSERT INTO `remittances` (`id`, `staff_id`, `amount`, `method`, `receipt_url`, `note`, `remitted_at`, `approved_by`, `approved_at`, `reject_reason`, `status`, `is_deleted`) VALUES
(1, 3, 2500000, 'transfer', NULL, NULL, '2026-04-28 02:04:29', 1, '2026-04-28 02:56:32', NULL, 'approved', 0),
(2, 3, 123157000, 'cash', NULL, NULL, '2026-04-28 02:55:49', 1, '2026-04-28 02:56:25', NULL, 'approved', 0),
(3, 3, 7040000, 'cash', NULL, 'Admin xac nhan truc tiep tu don #8', '2026-04-28 14:30:23', 1, '2026-04-28 14:30:23', NULL, 'approved', 0),
(4, 3, 260000, 'transfer', NULL, 'Admin xac nhan truc tiep tu don #14', '2026-04-28 20:53:46', 1, '2026-04-28 20:53:46', NULL, 'approved', 0);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `repair_charges`
--

CREATE TABLE `repair_charges` (
  `id` int(11) NOT NULL,
  `repair_order_id` int(11) NOT NULL,
  `kind` enum('service','fee','discount') NOT NULL DEFAULT 'service',
  `label` varchar(150) NOT NULL,
  `amount` bigint(20) NOT NULL DEFAULT 0,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `repair_items`
--

CREATE TABLE `repair_items` (
  `id` int(11) NOT NULL,
  `repair_order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL DEFAULT 1,
  `unit_price` bigint(20) NOT NULL DEFAULT 0,
  `imei` varchar(50) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `repair_orders`
--

CREATE TABLE `repair_orders` (
  `id` int(11) NOT NULL,
  `code` varchar(30) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `license_plate` varchar(30) DEFAULT NULL,
  `device_name` varchar(100) DEFAULT NULL,
  `imei_search` varchar(100) DEFAULT NULL,
  `reason_text` text NOT NULL,
  `note_text` text DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `assigned_staff_id` int(11) DEFAULT NULL,
  `recovered_image_url` varchar(500) DEFAULT NULL,
  `delivered_image_url` varchar(500) DEFAULT NULL,
  `diagnose_text` text DEFAULT NULL,
  `service_fee` bigint(20) NOT NULL DEFAULT 0,
  `parts_total` bigint(20) NOT NULL DEFAULT 0,
  `total_amount` bigint(20) NOT NULL DEFAULT 0,
  `paid_amount` bigint(20) NOT NULL DEFAULT 0,
  `quoted_at` datetime DEFAULT NULL,
  `customer_sent_at` datetime DEFAULT NULL,
  `customer_decided_at` datetime DEFAULT NULL,
  `repairing_at` datetime DEFAULT NULL,
  `done_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `debt_carried_at` datetime DEFAULT NULL,
  `debt_settlement_id` int(11) DEFAULT NULL,
  `status` enum('pending','assigned','diagnosing','quoted','awaiting_customer','approved','rejected','repairing','done','delivering','completed','cancelled') NOT NULL DEFAULT 'pending',
  `request_date` date NOT NULL,
  `creator_type` enum('customer','dealer','admin','staff') NOT NULL DEFAULT 'admin',
  `creator_id` int(11) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  `rating` decimal(3,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `staff`
--

INSERT INTO `staff` (`id`, `username`, `password_hash`, `full_name`, `role`, `area`, `phone`, `cccd`, `email`, `avatar_url`, `is_deleted`, `created_at`, `updated_at`, `online_status`, `rating`) VALUES
(1, 'admin', '$2a$10$Mk1UHzWUfeTrGGykMmpckOZdKukgHcSqtRQvXAZpqyudD/HYkXrOq', 'Quan tri vien', 'admin', NULL, NULL, NULL, NULL, NULL, 0, '2026-04-25 10:36:15', '2026-04-25 10:36:15', 'offline', 0.00),
(2, 'ktv01', '$2a$10$HRV2uqp5KUUOGmsnb1Z4nOk4dcDPf9uxDrPSibpA1/Nac5rXpmkKu', 'Trần Minh', 'kithuat', 'Quận 1, TP.HCM', '0911000001', NULL, 'ktv01@gpsviet.vn', NULL, 0, '2026-04-25 16:30:31', '2026-04-25 16:30:31', 'online', 4.50),
(3, 'ktv02', '$2a$10$L4aIOLbgLmJAWHHrjqatQOPiQBtn3bmFhnhn2YmAe.8PnNS1itDjy', 'Lê Văn Hùng', 'kithuat', 'Quận 7, TP.HCM', '0911000002', NULL, 'ktv02@gpsviet.vn', '/uploads/avatars/1777307658207-576f07723087.jpg', 0, '2026-04-25 16:30:31', '2026-04-27 18:09:40', 'offline', 4.20),
(4, 'ktv03', '$2a$10$HRV2uqp5KUUOGmsnb1Z4nOk4dcDPf9uxDrPSibpA1/Nac5rXpmkKu', 'Nguyễn Đức Thành', 'kithuat', 'Bình Dương', '0911000003', NULL, 'ktv03@gpsviet.vn', NULL, 0, '2026-04-25 16:30:31', '2026-04-25 16:30:31', 'online', 4.80);

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
) ;

--
-- Đang đổ dữ liệu cho bảng `staff_holdings`
--

INSERT INTO `staff_holdings` (`id`, `staff_id`, `product_id`, `qty`, `first_held_at`) VALUES
(8, 3, 4, 3, '2026-04-28 21:58:51'),
(9, 3, 2, 1, '2026-04-29 10:46:35'),
(10, 3, 8, 1, '2026-04-29 10:46:35'),
(12, 3, 5, 1, '2026-04-29 11:11:23'),
(14, 4, 4, 2, '2026-04-29 11:29:08');

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
  `ref_warranty_order_id` int(11) DEFAULT NULL,
  `ref_repair_order_id` int(11) DEFAULT NULL,
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

INSERT INTO `stock_receipts` (`id`, `code`, `kind`, `reason_code`, `reason_text`, `ref_order_id`, `ref_staff_id`, `ref_warranty_order_id`, `ref_repair_order_id`, `ref_stock_take_id`, `supplier_id`, `created_by_staff_id`, `created_at`, `is_voided`, `voided_at`, `voided_reason`, `voided_by_receipt_id`) VALUES
(1, 'PX-260428-001', 'out', 'order_release', NULL, 5, 3, NULL, NULL, NULL, NULL, 1, '2026-04-27 18:53:23', 0, NULL, NULL, NULL),
(2, 'PX-260428-002', 'out', 'technician_take', NULL, 5, 3, NULL, NULL, NULL, NULL, 3, '2026-04-28 05:10:40', 0, NULL, NULL, NULL),
(3, 'PN-260428-001', 'in', 'import_supplier', 'nhập kho', NULL, NULL, NULL, NULL, NULL, 3, 1, '2026-04-28 05:52:01', 0, NULL, NULL, NULL),
(4, 'PN-260428-002', 'in', 'import_supplier', 'MDVR-04', NULL, NULL, NULL, NULL, NULL, 2, 1, '2026-04-28 05:52:50', 0, NULL, NULL, NULL),
(5, 'PX-260428-003', 'out', 'order_release', NULL, 7, 3, NULL, NULL, NULL, NULL, 1, '2026-04-28 05:53:15', 0, NULL, NULL, NULL),
(7, 'PN-260428-003', 'in', 'order_cancel_return', 'sad [good]', 7, NULL, NULL, NULL, NULL, NULL, 1, '2026-04-28 06:10:05', 0, NULL, NULL, NULL),
(8, 'PX-260428-004', 'out', 'order_release', NULL, 8, 3, NULL, NULL, NULL, NULL, 1, '2026-04-28 06:21:21', 0, NULL, NULL, NULL),
(9, 'PN-260428-004', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-04-28 06:51:17', 0, NULL, NULL, NULL),
(10, 'PX-260428-005', 'out', 'order_release', NULL, 9, 3, NULL, NULL, NULL, NULL, 1, '2026-04-28 06:53:29', 0, NULL, NULL, NULL),
(11, 'PX-260428-006', 'out', 'technician_take', NULL, 8, 3, NULL, NULL, NULL, NULL, 3, '2026-04-28 06:57:26', 0, NULL, NULL, NULL),
(12, 'PX-260428-007', 'out', 'technician_take', NULL, 8, 3, NULL, NULL, NULL, NULL, 3, '2026-04-28 06:57:28', 0, NULL, NULL, NULL),
(13, 'PX-260428-008', 'out', 'technician_take', NULL, 9, 3, NULL, NULL, NULL, NULL, 3, '2026-04-28 06:57:30', 0, NULL, NULL, NULL),
(14, 'PX-260428-009', 'out', 'technician_take', NULL, 9, 3, NULL, NULL, NULL, NULL, 3, '2026-04-28 06:57:31', 0, NULL, NULL, NULL),
(15, 'PN-260428-005', 'in', 'technician_return', NULL, NULL, 3, NULL, NULL, NULL, NULL, 3, '2026-04-28 07:03:12', 0, NULL, NULL, NULL),
(16, 'PN-260428-006', 'in', 'technician_return', NULL, NULL, 3, NULL, NULL, NULL, NULL, 3, '2026-04-28 07:03:31', 0, NULL, NULL, NULL),
(17, 'PN-260428-007', 'in', 'technician_return', NULL, NULL, 3, NULL, NULL, NULL, NULL, 3, '2026-04-28 07:03:33', 0, NULL, NULL, NULL),
(18, 'PN-260428-008', 'in', 'technician_return', NULL, NULL, 3, NULL, NULL, NULL, NULL, 3, '2026-04-28 07:03:34', 0, NULL, NULL, NULL),
(19, 'PX-260428-010', 'out', 'order_release', NULL, 10, 3, NULL, NULL, NULL, NULL, 1, '2026-04-28 08:00:32', 0, NULL, NULL, NULL),
(20, 'PN-260428-009', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-04-28 13:31:02', 0, NULL, NULL, NULL),
(21, 'PX-260428-011', 'out', 'order_release', NULL, 14, 3, NULL, NULL, NULL, NULL, 1, '2026-04-28 13:31:22', 0, NULL, NULL, NULL),
(22, 'PX-260428-012', 'out', 'order_release', NULL, 16, 3, NULL, NULL, NULL, NULL, 1, '2026-04-28 14:58:51', 0, NULL, NULL, NULL),
(23, 'PN-260429-001', 'in', 'import_supplier', NULL, NULL, NULL, NULL, NULL, NULL, 4, 1, '2026-04-29 03:45:37', 0, NULL, NULL, NULL),
(24, 'PX-260429-001', 'out', 'order_release', NULL, 6, 3, NULL, NULL, NULL, NULL, 1, '2026-04-29 03:46:35', 0, NULL, NULL, NULL),
(25, 'PN-260429-002', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-04-29 04:11:16', 0, NULL, NULL, NULL),
(26, 'PX-260429-002', 'out', 'order_release', NULL, 15, 3, NULL, NULL, NULL, NULL, 1, '2026-04-29 04:11:23', 0, NULL, NULL, NULL),
(27, 'PX-260429-003', 'out', 'order_release', NULL, 18, 4, NULL, NULL, NULL, NULL, 1, '2026-04-29 04:29:08', 0, NULL, NULL, NULL),
(28, 'PX-260429-004', 'out', 'order_release', NULL, 17, 4, NULL, NULL, NULL, NULL, 1, '2026-04-29 05:30:35', 0, NULL, NULL, NULL),
(29, 'PN-260429-003', 'in', 'technician_return', NULL, 17, 3, NULL, NULL, NULL, NULL, 3, '2026-04-29 05:31:33', 0, NULL, NULL, NULL);

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
) ;

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
(36, 29, 6, 3, NULL, NULL, NULL);

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
(1, 'KK-260428-001', 'draft', '2026-04-28 03:09:54', NULL, 1, NULL, NULL, 0, 0, 0);

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
) ;

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

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `warranty_orders`
--

CREATE TABLE `warranty_orders` (
  `id` int(11) NOT NULL,
  `code` varchar(30) NOT NULL,
  `customer_id` int(11) NOT NULL,
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
  `paid_amount` bigint(20) NOT NULL DEFAULT 0,
  `debt_carried_at` datetime DEFAULT NULL,
  `debt_settlement_id` int(11) DEFAULT NULL,
  `status` enum('pending','received','recovered','awaiting_warranty','warranty_done','delivering','completed','cancelled') NOT NULL DEFAULT 'pending',
  `request_date` date NOT NULL,
  `creator_type` enum('customer','dealer','admin','staff') NOT NULL DEFAULT 'admin',
  `creator_id` int(11) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `app_settings`
--
ALTER TABLE `app_settings`
  ADD PRIMARY KEY (`key`);

--
-- Chỉ mục cho bảng `badges`
--
ALTER TABLE `badges`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_badge_status` (`status`),
  ADD KEY `idx_badge_customer` (`customer_id`),
  ADD KEY `idx_badge_dealer` (`dealer_id`),
  ADD KEY `idx_badge_plate` (`vehicle_plate`),
  ADD KEY `idx_badge_deleted` (`is_deleted`),
  ADD KEY `idx_badge_order` (`order_id`);

--
-- Chỉ mục cho bảng `badge_attachments`
--
ALTER TABLE `badge_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_battach_badge` (`badge_id`);

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
-- Chỉ mục cho bảng `customer_product_prices`
--
ALTER TABLE `customer_product_prices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_cust_prod` (`customer_id`,`product_id`),
  ADD KEY `fk_cpp_product` (`product_id`);

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
  ADD KEY `idx_msg_order` (`order_id`),
  ADD KEY `idx_msg_repair` (`repair_order_id`);

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
  ADD UNIQUE KEY `public_token` (`public_token`),
  ADD KEY `idx_orders_status` (`status`),
  ADD KEY `idx_orders_area` (`area`),
  ADD KEY `idx_orders_customer` (`customer_id`),
  ADD KEY `idx_orders_dealer` (`dealer_id`),
  ADD KEY `idx_orders_deleted` (`is_deleted`),
  ADD KEY `idx_orders_creator` (`creator_type`,`creator_id`),
  ADD KEY `idx_orders_service_kind` (`service_kind`),
  ADD KEY `idx_orders_seen` (`seen_at`),
  ADD KEY `idx_orders_has_return` (`has_return`),
  ADD KEY `idx_orders_debt_carried` (`customer_id`,`debt_carried_at`),
  ADD KEY `idx_orders_created` (`created_at`),
  ADD KEY `idx_orders_assigned_staff` (`assigned_staff_id`),
  ADD KEY `idx_orders_kind` (`kind`),
  ADD KEY `idx_orders_completed_at` (`completed_at`);

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
  ADD KEY `idx_charge_order` (`order_id`,`is_deleted`);

--
-- Chỉ mục cho bảng `order_checklist`
--
ALTER TABLE `order_checklist`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_checklist_order` (`order_id`);

--
-- Chỉ mục cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_oi_order` (`order_id`),
  ADD KEY `idx_oi_product` (`product_id`);

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
-- Chỉ mục cho bảng `repair_charges`
--
ALTER TABLE `repair_charges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_rcharge_order` (`repair_order_id`,`is_deleted`);

--
-- Chỉ mục cho bảng `repair_items`
--
ALTER TABLE `repair_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ritem_product` (`product_id`),
  ADD KEY `idx_ritem_order` (`repair_order_id`,`is_deleted`);

--
-- Chỉ mục cho bảng `repair_orders`
--
ALTER TABLE `repair_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_ro_status` (`status`),
  ADD KEY `idx_ro_customer` (`customer_id`),
  ADD KEY `idx_ro_staff` (`assigned_staff_id`),
  ADD KEY `idx_ro_request` (`request_date`),
  ADD KEY `idx_ro_deleted` (`is_deleted`),
  ADD KEY `idx_ro_debt_carried` (`debt_carried_at`),
  ADD KEY `idx_ro_settlement` (`debt_settlement_id`),
  ADD KEY `idx_ro_plate` (`license_plate`),
  ADD KEY `idx_ro_imei` (`imei_search`);

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
-- Chỉ mục cho bảng `staff_reviews`
--
ALTER TABLE `staff_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_review_staff` (`staff_id`),
  ADD KEY `idx_review_order` (`order_id`);

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
  ADD KEY `idx_receipts_warranty` (`ref_warranty_order_id`),
  ADD KEY `idx_receipts_repair` (`ref_repair_order_id`);

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
  ADD KEY `idx_wo_settlement` (`debt_settlement_id`),
  ADD KEY `idx_wo_plate` (`license_plate`),
  ADD KEY `idx_wo_imei` (`imei_search`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `badges`
--
ALTER TABLE `badges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `badge_attachments`
--
ALTER TABLE `badge_attachments`
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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `conversation_members`
--
ALTER TABLE `conversation_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT cho bảng `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT cho bảng `customer_product_prices`
--
ALTER TABLE `customer_product_prices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `debt_settlements`
--
ALTER TABLE `debt_settlements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT cho bảng `order_attachments`
--
ALTER TABLE `order_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT cho bảng `order_charges`
--
ALTER TABLE `order_charges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT cho bảng `order_checklist`
--
ALTER TABLE `order_checklist`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=79;

--
-- AUTO_INCREMENT cho bảng `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT cho bảng `order_payments`
--
ALTER TABLE `order_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `repair_charges`
--
ALTER TABLE `repair_charges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `repair_items`
--
ALTER TABLE `repair_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `repair_orders`
--
ALTER TABLE `repair_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `staff`
--
ALTER TABLE `staff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `staff_holdings`
--
ALTER TABLE `staff_holdings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `staff_reviews`
--
ALTER TABLE `staff_reviews`
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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT cho bảng `stock_receipt_items`
--
ALTER TABLE `stock_receipt_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT cho bảng `warehouse_logs`
--
ALTER TABLE `warehouse_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `warranty_orders`
--
ALTER TABLE `warranty_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `badges`
--
ALTER TABLE `badges`
  ADD CONSTRAINT `fk_badge_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_badge_dealer` FOREIGN KEY (`dealer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_badge_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `badge_attachments`
--
ALTER TABLE `badge_attachments`
  ADD CONSTRAINT `fk_battach_badge` FOREIGN KEY (`badge_id`) REFERENCES `badges` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
-- Các ràng buộc cho bảng `customer_product_prices`
--
ALTER TABLE `customer_product_prices`
  ADD CONSTRAINT `fk_cpp_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cpp_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

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
  ADD CONSTRAINT `fk_msg_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_msg_repair` FOREIGN KEY (`repair_order_id`) REFERENCES `repair_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
  ADD CONSTRAINT `fk_charge_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `order_checklist`
--
ALTER TABLE `order_checklist`
  ADD CONSTRAINT `fk_order_checklist_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_oi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `order_payments`
--
ALTER TABLE `order_payments`
  ADD CONSTRAINT `fk_payment_collection` FOREIGN KEY (`collection_id`) REFERENCES `collections` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_payment_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
-- Các ràng buộc cho bảng `repair_charges`
--
ALTER TABLE `repair_charges`
  ADD CONSTRAINT `fk_rcharge_order` FOREIGN KEY (`repair_order_id`) REFERENCES `repair_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `repair_items`
--
ALTER TABLE `repair_items`
  ADD CONSTRAINT `fk_ritem_order` FOREIGN KEY (`repair_order_id`) REFERENCES `repair_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ritem_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `repair_orders`
--
ALTER TABLE `repair_orders`
  ADD CONSTRAINT `fk_ro_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ro_settlement` FOREIGN KEY (`debt_settlement_id`) REFERENCES `debt_settlements` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ro_staff` FOREIGN KEY (`assigned_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `staff_holdings`
--
ALTER TABLE `staff_holdings`
  ADD CONSTRAINT `fk_staff_holdings_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_staff_holdings_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Các ràng buộc cho bảng `staff_reviews`
--
ALTER TABLE `staff_reviews`
  ADD CONSTRAINT `fk_review_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_review_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
  ADD CONSTRAINT `fk_receipt_repair` FOREIGN KEY (`ref_repair_order_id`) REFERENCES `repair_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_receipt_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_receipt_warranty` FOREIGN KEY (`ref_warranty_order_id`) REFERENCES `warranty_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
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

--
-- Các ràng buộc cho bảng `warranty_orders`
--
ALTER TABLE `warranty_orders`
  ADD CONSTRAINT `fk_wo_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_wo_settlement` FOREIGN KEY (`debt_settlement_id`) REFERENCES `debt_settlements` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_wo_staff` FOREIGN KEY (`assigned_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
