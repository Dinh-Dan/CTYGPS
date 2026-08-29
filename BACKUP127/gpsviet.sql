-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 12, 2026 at 06:59 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `gpsviet`
--

-- --------------------------------------------------------

--
-- Table structure for table `agency_collections`
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
-- Table structure for table `app_settings`
--

CREATE TABLE `app_settings` (
  `key` varchar(60) NOT NULL,
  `value` text DEFAULT NULL,
  `changed_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `changed_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `app_settings`
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
-- Table structure for table `badge_order_attachments`
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
-- Table structure for table `badge_order_charges`
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
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
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
-- Table structure for table `collections`
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
-- Dumping data for table `collections`
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
(13, 102, NULL, 2, 3000000, 'transfer', NULL, '2026-06-01 15:09:26', 1, 5, 0, NULL, NULL),
(14, 203, NULL, 2, 849960, 'cash', NULL, '2026-06-12 14:32:08', 0, NULL, 0, NULL, NULL),
(15, 224, NULL, 8, 972000, 'cash', NULL, '2026-06-15 18:12:08', 0, NULL, 0, NULL, NULL),
(16, 223, NULL, 8, 1728000, 'cash', NULL, '2026-06-15 18:18:18', 0, NULL, 0, NULL, NULL),
(17, 226, NULL, 2, 2000000, 'cash', NULL, '2026-06-16 15:47:03', 0, NULL, 0, NULL, NULL),
(18, 285, NULL, 2, 850000, 'cash', NULL, '2026-06-30 16:42:03', 0, NULL, 0, NULL, NULL),
(19, 341, NULL, 2, 1800000, 'cash', NULL, '2026-07-09 18:59:08', 0, NULL, 0, NULL, NULL),
(20, 334, NULL, 2, 500000, 'cash', NULL, '2026-07-09 18:59:58', 0, NULL, 0, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `conversations`
--

CREATE TABLE `conversations` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `last_message_at` datetime DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `conversation_members`
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
-- Table structure for table `customers`
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
-- Dumping data for table `customers`
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
(29, 'DL0012', 'dealer', 'GPSHOANGVI', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH ĐỖ THÙY DƯƠNG', NULL, 'CHỊ VI ĐÀ NẴNG', 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-25 09:46:00', '2026-06-11 01:30:47', NULL),
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
(40, 'KH0016', 'retail', 'HỘ KINH DOANH HKD PHƯỚC HOÀNG', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-27 02:32:02', '2026-07-03 02:07:50', NULL),
(41, 'KH0017', 'retail', 'Thái Thị Anh Thi bsx 70H00980', '0907972980', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-27 09:36:33', '2026-05-27 09:36:33', NULL),
(42, 'DL0017', 'dealer', 'HỢP TÁC XÃ DỊCH VỤ VẬN TẢI SỐ 39', NULL, NULL, NULL, NULL, NULL, 'HỢP TÁC XÃ DỊCH VỤ VẬN TẢI SỐ 39', '0316881259', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-27 10:14:08', '2026-05-27 10:14:08', NULL),
(43, 'KH0018', 'retail', 'Phạm Văn Hiền bsx 50H11449', '0906389640', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-27 10:26:29', '2026-05-27 10:26:29', NULL),
(44, 'KH0019', 'retail', 'VẬN TẢI HỮU NGUYÊN', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ VẬN TẢI HỮU NGUYÊN', '0313044252', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-27 10:28:18', '2026-05-27 10:28:18', NULL),
(45, 'DL0018', 'dealer', 'chị Trinh Tân Bình', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-28 01:33:40', '2026-05-28 01:33:40', NULL),
(46, 'DL0019', 'dealer', 'CÔNG TY TNHH ĐIỆN TỬ CÔNG NGHỆ 365 GPS', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH ĐIỆN TỬ CÔNG NGHỆ 365 GPS', '0318266890', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-28 06:10:30', '2026-05-28 06:10:30', NULL),
(47, 'KH0020', 'retail', 'Trần Tuấn Minh 51D21374', '0903715762', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-05-28 06:21:47', '2026-05-28 06:21:47', NULL),
(48, 'KH0021', 'retail', 'CÔNG TY TNHH NHỰA TÂN LẬP THÀNH', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH NHỰA TÂN LẬP THÀNH', '0301322113', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-28 06:31:32', '2026-05-28 06:31:32', NULL),
(49, 'KH0022', 'retail', 'CÔNG TY TNHH PHÁT TRIỂN AN AN PHÁT', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH PHÁT TRIỂN AN AN PHÁT', '0317539175', NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-07-03 09:09:03', '2026-05-28 06:48:40', '2026-07-03 02:09:03', NULL),
(50, 'KH0023', 'retail', 'CÔNG TY TNHH HOÀNG GIA LỢI', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH HOÀNG GIA LỢI', '0315254914', NULL, 0, 0, 0, 0.00, 2, NULL, 1, '2026-05-28 15:06:08', '2026-05-28 06:59:07', '2026-06-13 02:49:13', NULL),
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
(64, 'DL0024', 'dealer', 'CÔNG TY TNHH DU LỊCH VẬN TẢI TÍN PHÁT', '0911382486', NULL, NULL, NULL, NULL, 'CÔNG TY TNHH DU LỊCH VẬN TẢI TÍN PHÁT', '0315535376', 'anh Phong', 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-05-30 02:25:55', '2026-06-19 10:26:22', NULL),
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
(102, 'DL0029', 'dealer', 'DƯƠNG QUỐC THẮNG', '0907012698', NULL, '158/11/24 Đường Bà Hạt, Phường Vườn Lài, TP Hồ Chí Minh, Việt Nam', NULL, NULL, 'CÔNG TY TNHH KỸ THUẬT DỊCH VỤ PHÚC HƯNG', '0316336239', NULL, 0, 0, 0, 0.00, 2, NULL, 0, '2026-07-07 15:22:41', '2026-06-08 08:44:47', '2026-07-07 08:22:56', NULL),
(103, 'KH0066', 'retail', 'dulichhieu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-09 07:12:30', '2026-06-09 07:12:30', NULL),
(104, 'KH0067', 'retail', 'quoccuong25kh', 'quoccuong25kh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-09 07:14:19', '2026-06-09 07:14:19', NULL),
(105, 'KH0068', 'retail', 'Vận Tải Hoàng Phúc', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-09 07:15:59', '2026-06-09 07:15:59', NULL),
(106, 'KH0069', 'retail', 'CÔNG TY TNHH BỒN NƯỚC BÌNH MINH', '0903838535', NULL, 'Số 29 Đường 494, Ấp 3, Tổ 22, Xã Nhuận Đức, TP Hồ Chí Minh, Việt Nam', NULL, NULL, 'CÔNG TY TNHH BỒN NƯỚC BÌNH MINH', '0311479071', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-09 07:20:50', '2026-06-09 07:20:50', NULL),
(107, 'KH0070', 'retail', 'hung1987', '0906789263', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-09 09:20:20', '2026-06-09 09:20:20', NULL),
(108, 'KH0071', 'retail', 'buingoctran', '0921353789', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-10 01:45:09', '2026-06-10 01:45:09', NULL),
(109, 'DL0030', 'dealer', 'CÔNG TY CỔ PHẦN SKYCOOL VIỆT NAM', '0901 843 888', NULL, '32 đường số 5, Khu Đô Thị Vạn Phúc, Phường Hiệp Bình, Thành phố Hồ Chí Minh, Việt Nam', NULL, NULL, 'CÔNG TY CỔ PHẦN SKYCOOL VIỆT NAM', '0313671408', NULL, 0, 0, 0, 0.00, 3, NULL, 0, NULL, '2026-06-10 01:58:05', '2026-06-10 01:58:05', NULL),
(110, 'KH0072', 'retail', '51D21346', '0777393365', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-10 04:32:17', '2026-06-10 04:32:17', NULL),
(111, 'KH0066-OLD', 'retail', 'Thanh', '0903691345', NULL, NULL, NULL, NULL, 'CÔNG TY TNHH GIAO NHẬN VẬN TẢI CHÍ THẮNG', '0319290913', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-07 18:05:22', '2026-06-07 18:05:22', NULL),
(112, 'KH0067-OLD', 'retail', 'nguyenhaiau', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-07 18:22:46', '2026-06-07 18:22:46', NULL),
(113, 'KH0070-OLD', 'retail', 'Vận Tải Hoàng Phúc', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-08 21:45:28', '2026-06-08 21:45:28', NULL),
(114, 'KH0073', 'retail', 'leminhnghia1', '0967844368', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-10 07:50:36', '2026-06-10 07:50:36', NULL),
(115, 'KH0074', 'retail', 'Chị Thoa', '0777874379', 'congtycophanibs649@gmail.com', 'Lô A1, Đường số 2, Khu công nghiệp Nhựt Chánh, xã Bình Đức, Tỉnh Tây Ninh, Việt Nam', NULL, NULL, 'CÔNG TY CỔ PHẦN IBS', '1100903649', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-10 08:00:24', '2026-06-10 08:00:24', NULL),
(116, 'KH0075', 'retail', 'phantanhung', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 1, NULL, '2026-06-10 09:04:13', '2026-06-10 10:06:34', NULL),
(117, 'KH0076', 'retail', 'Đặng Thanh Tuấn', '0984693340', NULL, '27/37 HT45', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-11 00:57:02', '2026-06-11 00:57:02', NULL),
(118, 'KH0077', 'retail', 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ ÁNH SAO KIM', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ ÁNH SAO KIM', '0304136838', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-11 01:58:04', '2026-06-11 01:58:04', NULL),
(119, 'KH0078', 'retail', 'anh Tâm', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-11 02:04:34', '2026-06-11 02:04:34', NULL),
(120, 'KH0079', 'retail', 'anh Nam', '0902741314', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-11 02:56:12', '2026-06-11 02:56:12', NULL),
(121, 'KH0080', 'retail', 'dulichkimhan', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-11 03:21:47', '2026-06-11 03:21:47', NULL),
(122, 'KH0081', 'retail', 'CÔNG TY TNHH MAY MẶC - XUẤT NHẬP KHẨU YÊN CHI', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH MAY MẶC - XUẤT NHẬP KHẨU YÊN CHI', '0302326216', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-11 06:52:33', '2026-06-11 06:52:33', NULL),
(123, 'KH0082', 'retail', 'CÔNG TY TNHH SẢN XUẤT - THƯƠNG MẠI MINH LUẬN', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH SẢN XUẤT - THƯƠNG MẠI MINH LUẬN', '0306676772', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-11 09:07:09', '2026-06-11 09:07:09', NULL),
(124, 'KH0083', 'retail', 'Phạm Dũng', '0984563412', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-11 09:20:10', '2026-06-11 09:20:10', NULL),
(125, 'KH0084', 'retail', 'Hoàng Khang', '0933156155', NULL, 'Bình Tân', NULL, NULL, 'hoangkhang', NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-12 04:18:30', '2026-06-12 04:18:30', NULL),
(126, 'KH0085', 'retail', '61h04982', '0338598599', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-12 04:27:08', '2026-06-12 04:27:08', NULL),
(127, 'KH0086', 'retail', 'Chị Hoa', '0922955994', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-12 08:34:35', '2026-06-12 08:34:35', NULL),
(128, 'KH0087', 'retail', 'hieplienphat', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-13 01:21:13', '2026-06-13 01:21:13', NULL),
(129, 'KH0088', 'retail', 'CÔNG TY TNHH DỊCH VỤ VẬN TẢI NGỌC ANH NGUYỄN', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH DỊCH VỤ VẬN TẢI NGỌC ANH NGUYỄN', '0313308378', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-15 01:34:11', '2026-06-15 01:34:11', NULL),
(130, 'DL0031', 'dealer', 'GPSCUONGPHAT', NULL, NULL, NULL, NULL, NULL, 'GPSCUONGPHAT', NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-15 01:36:08', '2026-06-15 01:36:08', NULL),
(131, 'DL0032', 'dealer', 'HTX TÂN BÌNH', NULL, NULL, NULL, NULL, NULL, 'HTX TÂN BÌNH', NULL, 'ANH TẤN', 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-15 01:38:14', '2026-06-15 01:38:14', NULL),
(132, 'KH0089', 'retail', 'minhnhut1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-15 02:11:44', '2026-06-15 02:11:44', NULL),
(133, 'KH0090', 'retail', '56n5992', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-15 03:25:44', '2026-06-15 03:25:44', NULL),
(134, 'DL0033', 'dealer', 'ANH VĂN', '0942765739', NULL, NULL, NULL, NULL, 'dinhvingocphat', NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-15 03:49:37', '2026-06-15 03:49:37', NULL),
(135, 'KH0091', 'retail', 'Lữ Tấn Dư', '0776846901', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-15 06:21:39', '2026-06-15 06:21:39', NULL),
(136, 'KH0092', 'retail', 'levanthu1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-15 08:39:55', '2026-06-15 08:39:55', NULL),
(137, 'KH0093', 'retail', 'chú Phi', '0939184325', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-16 02:56:50', '2026-06-16 02:56:50', NULL),
(138, 'KH0094', 'retail', 'khách của dân', '04321290313', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-16 08:53:29', '2026-06-16 08:53:29', NULL),
(139, 'KH0095', 'retail', 'CÔNG TY CỔ PHẦN LƯỚI THÉP BÌNH TÂY', '0933462255', NULL, '117 âu Cơ, Phường Tân Phú, Thành phố Hồ Chí Minh, Việt Nam', NULL, NULL, 'CÔNG TY CỔ PHẦN LƯỚI THÉP BÌNH TÂY', '0303357746', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-16 09:08:02', '2026-06-16 09:08:02', NULL),
(140, 'KH0096', 'retail', 'CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ CAO TÍN', '0788363676', NULL, '81/12a Nguyễn Hữu Cầu, Phường Tân Định, Thành phố Hồ Chí Minh,  Việt Nam', NULL, NULL, 'CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ CAO TÍN', '0316086187', NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-06-17 08:44:55', '2026-06-17 01:42:41', '2026-06-17 01:45:08', NULL),
(141, 'KH0097', 'retail', 'ktdung', '0949155160', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-17 04:08:45', '2026-06-17 04:08:45', NULL),
(142, 'KH0098', 'retail', '50H24136', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-17 06:16:43', '2026-06-17 06:16:43', NULL),
(143, 'KH0099', 'retail', '51c75884', '0902551178', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-17 06:35:48', '2026-06-17 06:35:48', NULL),
(144, 'KH0100', 'retail', 'CÔNG TY TRÁCH NHIỆM HỮU HẠN BORAMTEK VIỆT NAM', '0989621917', NULL, 'Số 3, đường 16A, KCN Biên Hòa II, Phường Trấn Biên, Thành phố Đồng Nai, Việt Nam', NULL, NULL, 'CÔNG TY TRÁCH NHIỆM HỮU HẠN BORAMTEK VIỆT NAM', '3600249795', NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-06-18 15:46:54', '2026-06-18 03:14:22', '2026-06-18 08:47:23', NULL),
(145, 'KH0101', 'retail', 'Trường Trung Cấp Nghề Tổng hợp ASEAN', NULL, NULL, 'Số 20 Lê Quý Đôn, Xã Lao Bảo, Tỉnh Quảng Trị, Việt Nam', NULL, NULL, 'Trường Trung Cấp Nghề Tổng hợp ASEAN', '3200569141', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-18 08:36:39', '2026-06-18 08:36:39', NULL),
(146, 'KH0102', 'retail', 'Nguyễn Hồng Sơn', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-19 01:28:58', '2026-06-19 01:28:58', NULL),
(147, 'KH0103', 'retail', 'Vận Tải Duy Hằng', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-19 02:31:42', '2026-06-19 02:31:42', NULL),
(148, 'KH0104', 'retail', 'Anhnguyen2', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-19 02:43:49', '2026-06-19 02:43:49', NULL),
(149, 'KH0105', 'retail', 'CÔNG TY CỔ PHẦN VININOX', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY CỔ PHẦN VININOX', '0312266083', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-19 07:21:36', '2026-06-19 07:21:36', NULL),
(150, 'KH0106', 'retail', '61C50517', '0706951988', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-22 03:48:54', '2026-06-22 03:48:54', NULL),
(151, 'KH0107', 'retail', 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ VẬN TẢI HÙNG ĐẠT', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ VẬN TẢI HÙNG ĐẠT', '0316014513', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-23 03:26:42', '2026-06-23 03:26:42', NULL),
(152, 'KH0108', 'retail', 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ HỢP NHẤT TRANSPORT', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ HỢP NHẤT TRANSPORT', '0316793796', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-24 09:59:29', '2026-06-24 09:59:29', NULL),
(153, 'KH0109', 'retail', 'nguyenanhvu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-25 08:12:33', '2026-06-25 08:12:33', NULL),
(154, 'KH0110', 'retail', 'chị Nga Nguyễn Đào', '0933607288', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-25 08:47:02', '2026-06-25 08:47:02', NULL),
(155, 'KH0111', 'retail', '51c11428', '0938280398', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-26 01:47:51', '2026-06-26 01:47:51', NULL),
(156, 'DL0034', 'dealer', 'Nguyentuanan', NULL, NULL, NULL, NULL, NULL, 'Nguyễn Tuấn An', NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-26 03:48:32', '2026-06-26 03:48:32', NULL),
(157, 'KH0112', 'retail', '50E16780', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-27 01:24:47', '2026-06-27 01:24:47', NULL),
(158, 'KH0113', 'retail', 'Hoàng Đại Hoài Ân', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-27 01:26:48', '2026-06-27 01:26:48', NULL),
(159, 'KH0114', 'retail', 'Phùng Ngọc Hòa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-27 02:15:30', '2026-06-27 02:15:30', NULL),
(160, 'KH0115', 'retail', 'Thịnh Phú', '0919657606', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-29 07:59:58', '2026-06-29 07:59:58', NULL),
(161, 'KH0116', 'retail', 'huyenly', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-30 03:30:30', '2026-06-30 03:30:30', NULL),
(162, 'KH0117', 'retail', 'anhkim', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-30 06:31:44', '2026-06-30 06:31:44', NULL),
(163, 'KH0118', 'retail', 'CÔNG TY TNHH PHÁT TRIỂN CÔNG NGHỆ NEW WORLD', NULL, NULL, '35B Đường 12B, Cư Xá Ngân Hàng, Phường Tân Thuận, Thành phố Hồ Chí Minh, Việt Nam', NULL, NULL, 'CÔNG TY TNHH PHÁT TRIỂN CÔNG NGHỆ NEW WORLD', '0317792072', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-06-30 07:02:07', '2026-06-30 07:02:07', NULL),
(164, 'KH0119', 'retail', 'BÙI HẢI ÂU', '0903375975', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-06-30 10:18:57', '2026-06-30 10:18:57', NULL),
(165, 'KH0120', 'retail', 'CÔNG TY TNHH CƠ KHÍ XÂY DỰNG VÀ VẬN TẢI TÂN KHOA', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH CƠ KHÍ XÂY DỰNG VÀ VẬN TẢI TÂN KHOA', '0319116023', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-07-01 04:41:23', '2026-07-01 04:41:23', NULL),
(166, 'DL0035', 'dealer', 'CÔNG TY TNHH SẢN XUẤT THƯƠNG MẠI DỊCH VỤ THÀNH THÀNH CÔNG', NULL, 'ctccar@gmail.com', 'Số 36 đường Thới An 14, Khu phố 17, P.Thới An, TP Hồ Chí Minh', NULL, NULL, 'CÔNG TY TNHH SẢN XUẤT THƯƠNG MẠI DỊCH VỤ THÀNH THÀNH CÔNG', '0317070750', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-07-01 10:15:36', '2026-07-01 10:15:36', NULL),
(167, 'KH0121', 'retail', 'Đào Thanh Thùy', '0909068093', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-07-02 01:31:35', '2026-07-02 01:31:35', NULL),
(168, 'KH0122', 'retail', 'Kiều Văn Huy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-07-02 01:33:47', '2026-07-02 01:33:47', NULL),
(169, 'KH0123', 'retail', 'Nguyenvantrung', '0918489567', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-07-02 09:02:32', '2026-07-02 09:02:32', NULL),
(170, 'DL0036', 'dealer', 'QUÂN AZ', '0935202145', NULL, '35B Đường 12B, Cư Xá Ngân Hàng, Phường Tân Thuận, Thành phố Hồ Chí Minh, Vietnam', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 2, NULL, 0, NULL, '2026-07-03 02:27:56', '2026-07-03 02:27:56', NULL),
(171, 'KH0124', 'retail', '50h39774', '0938767686', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-07-03 02:50:57', '2026-07-03 02:50:57', NULL),
(172, 'KH0125', 'retail', 'CÔNG TY TNHH THƯƠNG MẠI LIÊN ĐAN', '0971537747', NULL, '151/67/49D Liên Khu 4-5, Khu phố 24, Phường Bình Tân, TP Hồ Chí Minh, Việt Nam', NULL, NULL, 'CÔNG TY TNHH THƯƠNG MẠI LIÊN ĐAN', '0317251796', NULL, 0, 0, 0, 0.00, 1, NULL, 0, '2026-07-03 13:45:31', '2026-07-03 03:23:42', '2026-07-03 06:45:38', NULL),
(173, 'KH0126', 'retail', 'CÔNG TY TNHH MỘT THÀNH VIÊN HASU VINA', '0906299400', NULL, NULL, NULL, NULL, 'CÔNG TY TNHH MỘT THÀNH VIÊN HASU VINA', '3702344695', 'anh Quang', 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-07-04 01:25:08', '2026-07-04 01:25:08', NULL),
(174, 'KH0127', 'retail', 'Thiên Phúc', '0907738877', NULL, 'Thủ Đức', NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-07-05 09:03:12', '2026-07-05 09:03:12', NULL),
(175, 'KH0128', 'retail', 'binhhoainhon', '0786931931', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-07-06 02:03:08', '2026-07-06 02:03:08', NULL),
(176, 'KH0129', 'retail', '50E93457', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-07-06 02:15:34', '2026-07-06 02:15:34', NULL),
(177, 'KH0130', 'retail', 'phamdinhdoanh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-07-06 02:32:00', '2026-07-06 02:32:00', NULL),
(178, 'KH0131', 'retail', '51d51547', '0901494227', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-07-06 04:00:02', '2026-07-06 04:00:02', NULL),
(179, 'KH0132', 'retail', 'Chị Lệ', '0907250729', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-07-07 01:26:33', '2026-07-07 01:26:33', NULL),
(180, 'KH0133', 'retail', 'Trần Hữu Quỳnh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-07-07 01:29:41', '2026-07-07 01:29:41', NULL),
(181, 'KH0134', 'retail', 'lamminhdat', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-07-07 01:54:04', '2026-07-07 01:54:04', NULL),
(182, 'KH0135', 'retail', 'tranvanthoi', '0908294413', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-07-07 01:57:42', '2026-07-07 01:57:42', NULL),
(183, 'KH0136', 'retail', 'Trần Văn An', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-07-07 02:25:19', '2026-07-07 02:25:19', NULL),
(184, 'KH0137', 'retail', 'hoangvanhoa1', '0388555666', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-07-07 03:07:50', '2026-07-07 03:07:50', NULL),
(185, 'KH0138', 'retail', 'CÔNG TY TNHH  THƯƠNG MẠI DỊCH VỤ VẬN TẢI ĐẠT THÀNH', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH  THƯƠNG MẠI DỊCH VỤ VẬN TẢI ĐẠT THÀNH', '0318871802', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-07-07 09:14:33', '2026-07-07 09:14:33', NULL),
(186, 'KH0139', 'retail', 'phamthuong', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-07-07 09:57:53', '2026-07-07 09:57:53', NULL),
(187, 'KH0140', 'retail', 'Nhà xe Khang Thịnh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-07-08 01:44:40', '2026-07-08 01:44:40', NULL),
(188, 'KH0141', 'retail', 'Huỳnh Chí Công', '0906307700', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-07-08 02:26:08', '2026-07-08 02:26:08', NULL),
(189, 'KH0142', 'retail', '51d67243', '0918982102', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-07-08 04:17:38', '2026-07-08 04:17:38', NULL),
(190, 'KH0143', 'retail', 'Duy Khánh', '0981751194', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-07-09 03:33:46', '2026-07-09 03:33:46', NULL),
(191, 'KH0144', 'retail', '51b03078', '0913880968', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-07-09 06:34:20', '2026-07-09 06:34:20', NULL),
(192, 'KH0145', 'retail', 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ VẬN TẢI SÀI THÀNH 24H', NULL, NULL, NULL, NULL, NULL, 'CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ VẬN TẢI SÀI THÀNH 24H', '0319421852', NULL, 0, 0, 0, 0.00, 1, NULL, 0, NULL, '2026-07-10 03:05:42', '2026-07-10 03:05:42', NULL),
(193, 'KH0146', 'retail', 'Nguyễn Văn Đoàn', '0919913998', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-07-10 03:27:57', '2026-07-10 03:27:57', NULL),
(194, 'KH0147', 'retail', 'Anh Phương', '0989302902', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-07-10 03:40:07', '2026-07-10 03:40:07', NULL),
(195, 'KH0148', 'retail', 'Quang Thịnh', '0989210327', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, 0.00, NULL, NULL, 0, NULL, '2026-07-11 06:43:43', '2026-07-11 06:43:43', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `customer_accounts`
--

CREATE TABLE `customer_accounts` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `account_name` varchar(255) NOT NULL,
  `note` varchar(500) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customer_accounts`
--

INSERT INTO `customer_accounts` (`id`, `customer_id`, `account_name`, `note`, `is_deleted`) VALUES
(6, 11, '34567890', NULL, 0),
(7, 13, 'Hotrunghieu1', NULL, 0),
(8, 18, 'Thepasia', NULL, 0),
(9, 15, 'Bapbo', NULL, 0),
(10, 24, 'vantaitansang', NULL, 1),
(11, 83, 'Thiengianganh', NULL, 0),
(12, 35, 'Nhan1979', NULL, 0),
(13, 60, 'Nguyenlehunglam', NULL, 0),
(14, 90, 'Thucphamaoao', NULL, 0),
(15, 21, 'Trinhthang', NULL, 1),
(16, 111, '106128', NULL, 0),
(17, 125, 'Hoangkhang', NULL, 0),
(18, 22, 'trankhachuy', NULL, 0),
(19, 130, 'nguyenducloc', NULL, 0),
(20, 136, 'levanthu1', NULL, 0),
(21, 21, 'truongvanthu', NULL, 1),
(22, 130, '0903763726', NULL, 0),
(23, 130, '0349230156', NULL, 0),
(24, 21, 'huynhvikiet', NULL, 1),
(25, 21, 'Ctynhattrungviet', NULL, 0),
(26, 153, 'Nguyenanhvu', NULL, 0),
(27, 154, 'Ctynguyendao', NULL, 0),
(28, 24, 'Honghuyphat', NULL, 0),
(29, 62, 'Lamtanquoc', NULL, 0),
(30, 171, '50h39774', NULL, 0),
(31, 182, 'Tranvanthoi', NULL, 0),
(32, 181, 'Lamminhdat', NULL, 0),
(33, 22, 'kiennghia', NULL, 0),
(34, 21, 'hienluong1', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `customer_old_debts`
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
-- Dumping data for table `customer_old_debts`
--

INSERT INTO `customer_old_debts` (`id`, `customer_id`, `amount`, `note`, `debt_date`, `created_at`, `created_by`) VALUES
(1, 40, 1000, 'test', '2026-05-27', '2026-05-27 10:27:16', 6),
(2, 40, 1000, 'data test', '2026-05-27', '2026-05-27 10:33:22', 6),
(3, 21, 21601200, NULL, '2026-05-27', '2026-05-27 11:14:23', 3),
(4, 63, 2365000, NULL, '2026-05-30', '2026-05-30 09:24:39', 3),
(5, 64, 7390000, NULL, '2026-05-30', '2026-05-30 09:26:24', 3),
(6, 36, 9275000, 'nợ gia hạn', '2026-05-01', '2026-06-01 09:41:45', 3),
(7, 29, 16826000, NULL, '2026-06-10', '2026-06-10 15:42:55', 3);

-- --------------------------------------------------------

--
-- Table structure for table `customer_product_prices`
--

CREATE TABLE `customer_product_prices` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `price` decimal(15,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customer_sims`
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
-- Table structure for table `customer_update_requests`
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
-- Dumping data for table `customer_update_requests`
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
(29, 21, 'account', 'update', 15, 'Trinhthang', NULL, 'kithuat', 2, 155, 'approved', NULL, '2026-06-07 03:48:42', NULL, 0),
(30, 111, 'account', 'add', NULL, '106128', NULL, 'kithuat', 8, 179, 'approved', NULL, '2026-06-10 06:42:35', NULL, 0),
(31, 125, 'account', 'add', NULL, 'Hoangkhang', NULL, 'kithuat', 2, 203, 'approved', NULL, '2026-06-12 07:32:59', NULL, 0),
(32, 125, 'vehicle', 'add', NULL, '50AF-330.56', NULL, 'kithuat', 2, 203, 'approved', NULL, '2026-06-12 07:32:59', NULL, 0),
(33, 22, 'account', 'add', NULL, 'trankhachuy', NULL, 'kithuat', 8, 205, 'approved', NULL, '2026-06-12 07:40:34', NULL, 0),
(34, 130, 'account', 'add', NULL, 'nguyenducloc', NULL, 'kithuat', 8, 215, 'approved', NULL, '2026-06-15 02:44:53', NULL, 0),
(35, 130, 'vehicle', 'add', NULL, '81H06417', NULL, 'kithuat', 8, 215, 'approved', NULL, '2026-06-15 02:44:53', NULL, 0),
(36, 136, 'account', 'add', NULL, 'levanthu1', NULL, 'kithuat', 8, 224, 'approved', NULL, '2026-06-15 11:12:12', NULL, 0),
(37, 136, 'vehicle', 'add', NULL, '61E03641', NULL, 'kithuat', 8, 224, 'approved', NULL, '2026-06-15 11:12:12', NULL, 0),
(38, 21, 'account', 'add', NULL, 'truongvanthu', NULL, 'kithuat', 8, 229, 'approved', NULL, '2026-06-16 04:32:56', NULL, 0),
(39, 21, 'vehicle', 'add', NULL, '86H03910', NULL, 'kithuat', 8, 229, 'approved', NULL, '2026-06-16 04:32:56', NULL, 0),
(40, 130, 'account', 'add', NULL, '0903763726', NULL, 'kithuat', 2, 226, 'approved', NULL, '2026-06-16 08:47:36', NULL, 0),
(41, 130, 'account', 'add', NULL, '0349230156', NULL, 'kithuat', 2, 226, 'approved', NULL, '2026-06-16 08:47:36', NULL, 0),
(42, 130, 'vehicle', 'add', NULL, '50E-886.62', NULL, 'kithuat', 2, 226, 'approved', NULL, '2026-06-16 08:47:36', NULL, 0),
(43, 21, 'account', 'add', NULL, 'huynhvikiet', NULL, 'kithuat', 8, 241, 'approved', NULL, '2026-06-17 10:20:03', NULL, 0),
(44, 21, 'vehicle', 'add', NULL, '50H-884.84', NULL, 'kithuat', 8, 241, 'approved', NULL, '2026-06-17 10:20:03', NULL, 0),
(45, 21, 'account', 'delete', 24, NULL, NULL, 'kithuat', 8, 265, 'approved', NULL, '2026-06-25 02:08:44', NULL, 0),
(46, 21, 'account', 'delete', 21, NULL, NULL, 'kithuat', 8, 265, 'approved', NULL, '2026-06-25 02:08:44', NULL, 0),
(47, 21, 'account', 'delete', 15, NULL, NULL, 'kithuat', 8, 265, 'approved', NULL, '2026-06-25 02:08:44', NULL, 0),
(48, 21, 'vehicle', 'delete', 18, NULL, NULL, 'kithuat', 8, 265, 'approved', NULL, '2026-06-25 02:08:44', NULL, 0),
(49, 21, 'vehicle', 'delete', 16, NULL, NULL, 'kithuat', 8, 265, 'approved', NULL, '2026-06-25 02:08:44', NULL, 0),
(50, 21, 'vehicle', 'delete', 12, NULL, NULL, 'kithuat', 8, 265, 'approved', NULL, '2026-06-25 02:08:44', NULL, 0),
(51, 21, 'account', 'add', NULL, 'Ctynhattrungviet', NULL, 'kithuat', 8, 265, 'approved', NULL, '2026-06-25 02:08:44', NULL, 0),
(52, 21, 'vehicle', 'add', NULL, '50E91085', NULL, 'kithuat', 8, 265, 'approved', NULL, '2026-06-25 02:08:44', NULL, 0),
(53, 153, 'account', 'add', NULL, 'Nguyenanhvu', NULL, 'kithuat', 8, 267, 'approved', NULL, '2026-06-25 09:29:20', NULL, 0),
(54, 153, 'vehicle', 'add', NULL, '51L79074', NULL, 'kithuat', 8, 267, 'approved', NULL, '2026-06-25 09:29:20', NULL, 0),
(55, 154, 'account', 'add', NULL, 'Ctynguyendao', NULL, 'kithuat', 8, 268, 'approved', NULL, '2026-06-27 06:10:54', NULL, 0),
(56, 154, 'vehicle', 'add', NULL, '51B-916.02', NULL, 'kithuat', 8, 268, 'approved', NULL, '2026-06-27 06:10:54', NULL, 0),
(57, 165, 'vehicle', 'add', NULL, '51L18628', NULL, 'kithuat', 8, 292, 'approved', NULL, '2026-07-01 10:26:25', NULL, 0),
(58, 24, 'account', 'delete', 10, NULL, NULL, 'kithuat', 8, 278, 'approved', NULL, '2026-07-01 10:29:30', NULL, 0),
(59, 24, 'account', 'add', NULL, 'Honghuyphat', NULL, 'kithuat', 8, 278, 'approved', NULL, '2026-07-01 10:29:30', NULL, 0),
(60, 62, 'account', 'add', NULL, 'Lamtanquoc', NULL, 'kithuat', 8, 301, 'approved', NULL, '2026-07-02 11:34:51', NULL, 0),
(61, 171, 'account', 'add', NULL, '50h39774', NULL, 'kithuat', 8, 305, 'approved', NULL, '2026-07-03 03:02:10', NULL, 0),
(62, 171, 'vehicle', 'add', NULL, '50E93021', NULL, 'kithuat', 8, 305, 'approved', NULL, '2026-07-03 03:02:10', NULL, 0),
(63, 182, 'account', 'add', NULL, 'Tranvanthoi', NULL, 'kithuat', 8, 325, 'approved', NULL, '2026-07-07 05:20:55', NULL, 0),
(64, 181, 'account', 'add', NULL, 'Lamminhdat', NULL, 'kithuat', 8, 324, 'approved', NULL, '2026-07-07 05:21:33', NULL, 0),
(65, 22, 'account', 'add', NULL, 'kiennghia', NULL, 'kithuat', 8, 322, 'approved', NULL, '2026-07-07 05:22:06', NULL, 0),
(66, 22, 'vehicle', 'add', NULL, '59N2-430.11', NULL, 'kithuat', 8, 322, 'approved', NULL, '2026-07-07 05:22:06', NULL, 0),
(67, 24, 'vehicle', 'add', NULL, '51d51961', NULL, 'kithuat', 8, 337, 'approved', NULL, '2026-07-08 07:54:13', NULL, 0),
(68, 21, 'account', 'add', NULL, 'hienluong1', NULL, 'kithuat', 8, 346, 'approved', NULL, '2026-07-10 01:39:44', NULL, 0),
(69, 21, 'vehicle', 'add', NULL, '93H06747', NULL, 'kithuat', 8, 346, 'approved', NULL, '2026-07-10 01:39:44', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `customer_vehicles`
--

CREATE TABLE `customer_vehicles` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `plate` varchar(30) NOT NULL,
  `note` varchar(500) DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customer_vehicles`
--

INSERT INTO `customer_vehicles` (`id`, `customer_id`, `plate`, `note`, `is_deleted`) VALUES
(6, 11, '34567890', NULL, 0),
(7, 13, '51C23456', NULL, 0),
(8, 15, '51S57789', NULL, 0),
(9, 83, '50E-158.87', NULL, 0),
(10, 35, '51C-845.38', NULL, 0),
(11, 60, '51H-307.93', NULL, 0),
(12, 21, '50h44671', NULL, 1),
(13, 125, '50AF-330.56', NULL, 0),
(14, 130, '81H06417', NULL, 0),
(15, 136, '61E03641', NULL, 0),
(16, 21, '86H03910', NULL, 1),
(17, 130, '50E-886.62', NULL, 0),
(18, 21, '50H-884.84', NULL, 1),
(19, 21, '50E91085', NULL, 0),
(20, 153, '51L79074', NULL, 0),
(21, 154, '51B-916.02', NULL, 0),
(22, 165, '51L18628', NULL, 0),
(23, 171, '50E93021', NULL, 0),
(24, 22, '59N2-430.11', NULL, 0),
(25, 24, '51d51961', NULL, 0),
(26, 21, '93H06747', NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `debt_settlements`
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
-- Table structure for table `inquiries`
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
-- Table structure for table `inquiry_items`
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
-- Table structure for table `messages`
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
-- Table structure for table `notifications`
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
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `type`, `title`, `message`, `link_url`, `ref_order_id`, `ref_customer_id`, `ref_staff_id`, `is_read`, `read_at`, `is_deleted`, `created_at`) VALUES
(77, 'order_receive_uploaded', 'ORD-1206-001: KTV upload ảnh', 'Nguyễn Lý Thoại — Hoàng Khang', '/admin/orders.html#order-203', 203, 125, 2, 1, '2026-06-15 09:12:34', 0, '2026-06-12 07:31:53'),
(78, 'order_completed', 'ORD-1206-001: KTV hoàn thành', 'Nguyễn Lý Thoại — Hoàng Khang — 849.960đ', '/admin/orders.html#order-203', 203, 125, 2, 1, '2026-06-15 09:12:34', 0, '2026-06-12 07:32:08'),
(79, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'Hoàng Khang: thêm tài khoản, thêm biển số', '/admin/customers.html?customer_id=125&tab=requests', 203, 125, 2, 1, '2026-06-15 09:12:34', 0, '2026-06-12 07:32:59'),
(80, 'order_receive_uploaded', 'ORD-1206-003: KTV upload ảnh', 'Trần Quốc Viện — ANH HÒA THÀNH ĐẠT', '/admin/orders.html#order-205', 205, 22, 8, 1, '2026-06-15 09:12:34', 0, '2026-06-12 07:40:04'),
(81, 'order_completed', 'ORD-1206-003: KTV hoàn thành', 'Trần Quốc Viện — ANH HÒA THÀNH ĐẠT — 750.000đ', '/admin/orders.html#order-205', 205, 22, 8, 1, '2026-06-15 09:12:34', 0, '2026-06-12 07:40:23'),
(82, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'ANH HÒA THÀNH ĐẠT: thêm tài khoản', '/admin/customers.html?customer_id=22&tab=requests', 205, 22, 8, 1, '2026-06-15 09:12:34', 0, '2026-06-12 07:40:34'),
(83, 'order_receive_uploaded', 'ORD-1506-004: KTV upload ảnh', 'Trần Quốc Viện — GPSCUONGPHAT', '/admin/orders.html#order-215', 215, 130, 8, 1, '2026-06-15 11:09:09', 0, '2026-06-15 02:44:40'),
(84, 'order_completed', 'ORD-1506-004: KTV hoàn thành', 'Trần Quốc Viện — GPSCUONGPHAT — 1.000.000đ', '/admin/orders.html#order-215', 215, 130, 8, 1, '2026-06-15 11:09:09', 0, '2026-06-15 02:44:48'),
(85, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'GPSCUONGPHAT: thêm tài khoản, thêm biển số', '/admin/customers.html?customer_id=130&tab=requests', 215, 130, 8, 1, '2026-06-15 11:09:09', 0, '2026-06-15 02:44:53'),
(86, 'order_receive_uploaded', 'ORD-1506-007: KTV upload ảnh', 'Trần Quốc Viện — ANH VĂN', '/admin/orders.html#order-218', 218, 134, 8, 1, '2026-06-15 13:06:25', 0, '2026-06-15 04:51:49'),
(87, 'order_completed', 'ORD-1506-007: KTV hoàn thành', 'Trần Quốc Viện — ANH VĂN — 748.000đ', '/admin/orders.html#order-218', 218, 134, 8, 1, '2026-06-15 13:06:25', 0, '2026-06-15 04:52:09'),
(88, 'order_receive_uploaded', 'ORD-1506-008: KTV upload ảnh', 'Nguyễn Lý Thoại — ANH VĂN', '/admin/orders.html#order-220', 220, 134, 2, 1, '2026-06-15 14:21:22', 0, '2026-06-15 07:09:58'),
(89, 'order_completed', 'ORD-1506-008: KTV hoàn thành', 'Nguyễn Lý Thoại — ANH VĂN — 748.000đ', '/admin/orders.html#order-220', 220, 134, 2, 1, '2026-06-15 14:21:22', 0, '2026-06-15 07:10:00'),
(90, 'order_receive_uploaded', 'ORD-1506-012: KTV upload ảnh', 'Trần Quốc Viện — levanthu1', '/admin/orders.html#order-224', 224, 136, 8, 1, '2026-06-16 08:55:38', 0, '2026-06-15 11:11:28'),
(91, 'order_completed', 'ORD-1506-012: KTV hoàn thành', 'Trần Quốc Viện — levanthu1 — 972.000đ', '/admin/orders.html#order-224', 224, 136, 8, 1, '2026-06-16 08:55:38', 0, '2026-06-15 11:12:08'),
(92, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'levanthu1: thêm tài khoản, thêm biển số', '/admin/customers.html?customer_id=136&tab=requests', 224, 136, 8, 1, '2026-06-16 08:55:38', 0, '2026-06-15 11:12:12'),
(93, 'order_receive_uploaded', 'ORD-1506-011: KTV upload ảnh', 'Trần Quốc Viện — CÔNG TY TNHH PHÁT TRIỂN AN AN PHÁT', '/admin/orders.html#order-223', 223, 49, 8, 1, '2026-06-16 08:55:38', 0, '2026-06-15 11:18:04'),
(94, 'order_completed', 'ORD-1506-011: KTV hoàn thành', 'Trần Quốc Viện — CÔNG TY TNHH PHÁT TRIỂN AN AN PHÁT — 1.728.000đ', '/admin/orders.html#order-223', 223, 49, 8, 1, '2026-06-16 08:55:38', 0, '2026-06-15 11:18:18'),
(95, 'order_receive_uploaded', 'ORD-1506-003: KTV upload ảnh', 'Nguyễn Lý Thoại — HTX TÂN BÌNH', '/admin/orders.html#order-214', 214, 131, 2, 1, '2026-06-16 08:55:38', 0, '2026-06-16 01:34:04'),
(96, 'order_completed', 'ORD-1506-003: KTV hoàn thành', 'Nguyễn Lý Thoại — HTX TÂN BÌNH — 750.000đ', '/admin/orders.html#order-214', 214, 131, 2, 1, '2026-06-16 08:55:38', 0, '2026-06-16 01:34:24'),
(97, 'order_completed', 'ORD-1506-013: KTV hoàn thành', 'Nguyễn Lý Thoại — Anh Luân — 800.000đ', '/admin/orders.html#order-225', 225, 21, 2, 1, '2026-06-16 08:55:38', 0, '2026-06-16 01:36:43'),
(98, 'order_receive_uploaded', 'ORD-1506-013: KTV upload ảnh', 'Nguyễn Lý Thoại — Anh Luân', '/admin/orders.html#order-225', 225, 21, 2, 1, '2026-06-16 08:55:38', 0, '2026-06-16 01:36:46'),
(99, 'order_receive_uploaded', 'ORD-1506-002: KTV upload ảnh', 'Nguyễn Lý Thoại — Anh Luân', '/admin/orders.html#order-213', 213, 21, 2, 1, '2026-06-16 08:55:38', 0, '2026-06-16 01:37:38'),
(100, 'order_completed', 'ORD-1506-002: KTV hoàn thành', 'Nguyễn Lý Thoại — Anh Luân — 750.000đ', '/admin/orders.html#order-213', 213, 21, 2, 1, '2026-06-16 08:55:38', 0, '2026-06-16 01:37:52'),
(101, 'order_receive_uploaded', 'ORD-1606-004: KTV upload ảnh', 'Trần Quốc Viện — Anh Luân', '/admin/orders.html#order-229', 229, 21, 8, 1, '2026-06-16 11:45:24', 0, '2026-06-16 04:32:10'),
(102, 'order_completed', 'ORD-1606-004: KTV hoàn thành', 'Trần Quốc Viện — Anh Luân — 810.000đ', '/admin/orders.html#order-229', 229, 21, 8, 1, '2026-06-16 11:45:24', 0, '2026-06-16 04:32:53'),
(103, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'Anh Luân: thêm tài khoản, thêm biển số', '/admin/customers.html?customer_id=21&tab=requests', 229, 21, 8, 1, '2026-06-16 11:45:24', 0, '2026-06-16 04:32:56'),
(104, 'order_receive_uploaded', 'ORD-1606-001: KTV upload ảnh', 'Nguyễn Lý Thoại — GPSCUONGPHAT', '/admin/orders.html#order-226', 226, 130, 2, 1, '2026-06-16 14:09:43', 0, '2026-06-16 06:45:13'),
(105, 'order_completed', 'ORD-1606-001: KTV hoàn thành', 'Nguyễn Lý Thoại — GPSCUONGPHAT — 2.000.000đ', '/admin/orders.html#order-226', 226, 130, 2, 1, '2026-06-16 16:12:50', 0, '2026-06-16 08:47:03'),
(106, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'GPSCUONGPHAT: thêm tài khoản, thêm tài khoản, thêm biển số', '/admin/customers.html?customer_id=130&tab=requests', 226, 130, 2, 1, '2026-06-16 16:12:50', 0, '2026-06-16 08:47:36'),
(107, 'order_receive_uploaded', 'ORD-1606-009: KTV upload ảnh', 'Nguyễn Lý Thoại — CÔNG TY CỔ PHẦN LƯỚI THÉP BÌNH TÂY', '/admin/orders.html#order-235', 235, 139, 2, 1, '2026-06-18 08:33:33', 0, '2026-06-17 08:43:23'),
(108, 'order_completed', 'ORD-1606-009: KTV hoàn thành', 'Nguyễn Lý Thoại — CÔNG TY CỔ PHẦN LƯỚI THÉP BÌNH TÂY — 3.780.000đ', '/admin/orders.html#order-235', 235, 139, 2, 1, '2026-06-18 08:33:33', 0, '2026-06-17 08:43:41'),
(109, 'order_completed', 'ORD-0706-001-OLD: KTV hoàn thành', 'Nguyễn Lý Thoại — Anh Luân — 810.000đ', '/admin/orders.html#order-178', 178, 21, 2, 1, '2026-06-17 16:58:05', 0, '2026-06-17 08:45:13'),
(110, 'order_receive_uploaded', 'ORD-1706-005: KTV upload ảnh', 'Trần Quốc Viện — Anh Luân', '/admin/orders.html#order-241', 241, 21, 8, 1, '2026-06-18 08:33:33', 0, '2026-06-17 10:19:54'),
(111, 'order_completed', 'ORD-1706-005: KTV hoàn thành', 'Trần Quốc Viện — Anh Luân — 750.000đ', '/admin/orders.html#order-241', 241, 21, 8, 1, '2026-06-18 08:33:33', 0, '2026-06-17 10:19:59'),
(112, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'Anh Luân: thêm tài khoản, thêm biển số', '/admin/customers.html?customer_id=21&tab=requests', 241, 21, 8, 1, '2026-06-18 08:33:33', 0, '2026-06-17 10:20:03'),
(113, 'order_receive_uploaded', 'ORD-1806-002: KTV upload ảnh', 'Nguyễn Lý Thoại — CÔNG TY TRÁCH NHIỆM HỮU HẠN BORAMTEK VIỆT NAM', '/admin/orders.html#order-243', 243, 144, 2, 1, '2026-06-18 13:19:15', 0, '2026-06-18 06:18:51'),
(114, 'order_completed', 'ORD-1806-002: KTV hoàn thành', 'Nguyễn Lý Thoại — CÔNG TY TRÁCH NHIỆM HỮU HẠN BORAMTEK VIỆT NAM — 972.000đ', '/admin/orders.html#order-243', 243, 144, 2, 1, '2026-06-18 14:15:45', 0, '2026-06-18 06:19:22'),
(115, 'order_receive_uploaded', 'ORD-2406-004: KTV upload ảnh', 'Trần Quốc Viện — Anh Luân', '/admin/orders.html#order-265', 265, 21, 8, 1, '2026-06-26 08:31:09', 0, '2026-06-25 02:07:28'),
(116, 'order_completed', 'ORD-2406-004: KTV hoàn thành', 'Trần Quốc Viện — Anh Luân — 810.000đ', '/admin/orders.html#order-265', 265, 21, 8, 1, '2026-06-26 08:31:09', 0, '2026-06-25 02:07:46'),
(117, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'Anh Luân: xoá tài khoản, xoá tài khoản, xoá tài khoản, xoá biển số, xoá biển số, xoá biển số, thêm tài khoản, thêm biển số', '/admin/customers.html?customer_id=21&tab=requests', 265, 21, 8, 1, '2026-06-26 08:31:09', 0, '2026-06-25 02:08:44'),
(118, 'order_receive_uploaded', 'ORD-2506-002: KTV upload ảnh', 'Trần Quốc Viện — nguyenanhvu', '/admin/orders.html#order-267', 267, 153, 8, 1, '2026-06-26 08:31:09', 0, '2026-06-25 09:28:44'),
(119, 'order_completed', 'ORD-2506-002: KTV hoàn thành', 'Trần Quốc Viện — nguyenanhvu — 972.000đ', '/admin/orders.html#order-267', 267, 153, 8, 1, '2026-06-26 08:31:09', 0, '2026-06-25 09:29:01'),
(120, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'nguyenanhvu: thêm tài khoản, thêm biển số', '/admin/customers.html?customer_id=153&tab=requests', 267, 153, 8, 1, '2026-06-26 08:31:09', 0, '2026-06-25 09:29:20'),
(121, 'order_completed', 'ORD-2506-003: KTV hoàn thành', 'Trần Quốc Viện — chị Nga Nguyễn Đào — 4.520.000đ', '/admin/orders.html#order-268', 268, 154, 8, 1, '2026-06-29 08:29:54', 0, '2026-06-27 06:10:24'),
(122, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'chị Nga Nguyễn Đào: thêm tài khoản, thêm biển số', '/admin/customers.html?customer_id=154&tab=requests', 268, 154, 8, 1, '2026-06-29 08:29:54', 0, '2026-06-27 06:10:54'),
(123, 'order_receive_uploaded', 'ORD-2506-003: KTV upload ảnh', 'Trần Quốc Viện — chị Nga Nguyễn Đào', '/admin/orders.html#order-268', 268, 154, 8, 1, '2026-06-29 08:29:54', 0, '2026-06-27 06:10:56'),
(124, 'order_completed', 'ORD-3006-003: KTV hoàn thành', 'Nguyễn Lý Thoại — anhkim — 850.000đ', '/admin/orders.html#order-285', 285, 162, 2, 1, '2026-07-01 08:53:49', 0, '2026-06-30 09:42:03'),
(125, 'order_receive_uploaded', 'ORD-3006-003: KTV upload ảnh', 'Nguyễn Lý Thoại — anhkim', '/admin/orders.html#order-285', 285, 162, 2, 1, '2026-07-01 08:53:49', 0, '2026-06-30 09:42:11'),
(126, 'order_receive_uploaded', 'ORD-0107-003: KTV upload ảnh', 'Trần Quốc Viện — CÔNG TY TNHH CƠ KHÍ XÂY DỰNG VÀ VẬN TẢI TÂN KHOA', '/admin/orders.html#order-292', 292, 165, 8, 1, '2026-07-02 08:30:47', 0, '2026-07-01 10:26:12'),
(127, 'order_completed', 'ORD-0107-003: KTV hoàn thành', 'Trần Quốc Viện — CÔNG TY TNHH CƠ KHÍ XÂY DỰNG VÀ VẬN TẢI TÂN KHOA — 850.000đ', '/admin/orders.html#order-292', 292, 165, 8, 1, '2026-07-02 08:30:47', 0, '2026-07-01 10:26:20'),
(128, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'CÔNG TY TNHH CƠ KHÍ XÂY DỰNG VÀ VẬN TẢI TÂN KHOA: thêm biển số', '/admin/customers.html?customer_id=165&tab=requests', 292, 165, 8, 1, '2026-07-02 08:30:47', 0, '2026-07-01 10:26:25'),
(129, 'order_completed', 'ORD-2906-001: KTV hoàn thành', 'Trần Quốc Viện — ANH PHONG 247 — 7.668.000đ', '/admin/orders.html#order-278', 278, 24, 8, 1, '2026-07-02 08:30:47', 0, '2026-07-01 10:27:33'),
(130, 'order_receive_uploaded', 'ORD-2906-001: KTV upload ảnh', 'Trần Quốc Viện — ANH PHONG 247', '/admin/orders.html#order-278', 278, 24, 8, 1, '2026-07-02 08:30:47', 0, '2026-07-01 10:27:34'),
(131, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'ANH PHONG 247: xoá tài khoản, thêm tài khoản', '/admin/customers.html?customer_id=24&tab=requests', 278, 24, 8, 1, '2026-07-02 08:30:47', 0, '2026-07-01 10:29:30'),
(132, 'order_completed', 'ORD-0207-006: KTV hoàn thành', 'Trần Quốc Viện — CÔNG TY TNHH TM&DV DU LỊCH LONG HOA — 4.536.000đ', '/admin/orders.html#order-301', 301, 62, 8, 1, '2026-07-03 08:34:21', 0, '2026-07-02 11:34:25'),
(133, 'order_receive_uploaded', 'ORD-0207-006: KTV upload ảnh', 'Trần Quốc Viện — CÔNG TY TNHH TM&DV DU LỊCH LONG HOA', '/admin/orders.html#order-301', 301, 62, 8, 1, '2026-07-03 08:34:21', 0, '2026-07-02 11:34:29'),
(134, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'CÔNG TY TNHH TM&DV DU LỊCH LONG HOA: thêm tài khoản', '/admin/customers.html?customer_id=62&tab=requests', 301, 62, 8, 1, '2026-07-03 08:34:21', 0, '2026-07-02 11:34:51'),
(135, 'order_completed', 'ORD-0307-003: KTV hoàn thành', 'Trần Quốc Viện — 50h39774 — 3.888.000đ', '/admin/orders.html#order-305', 305, 171, 8, 1, '2026-07-03 10:23:46', 0, '2026-07-03 03:01:39'),
(136, 'order_receive_uploaded', 'ORD-0307-003: KTV upload ảnh', 'Trần Quốc Viện — 50h39774', '/admin/orders.html#order-305', 305, 171, 8, 1, '2026-07-03 10:23:46', 0, '2026-07-03 03:01:42'),
(137, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', '50h39774: thêm tài khoản, thêm biển số', '/admin/customers.html?customer_id=171&tab=requests', 305, 171, 8, 1, '2026-07-03 10:23:46', 0, '2026-07-03 03:02:10'),
(138, 'order_receive_uploaded', 'ORD-0507-001: KTV upload ảnh', 'Nguyễn Lý Thoại — Thiên Phúc', '/admin/orders.html#order-311', 311, 174, 2, 1, '2026-07-06 16:15:45', 0, '2026-07-06 05:15:22'),
(139, 'order_completed', 'ORD-0507-001: KTV hoàn thành', 'Nguyễn Lý Thoại — Thiên Phúc — 0đ', '/admin/orders.html#order-311', 311, 174, 2, 1, '2026-07-06 16:15:45', 0, '2026-07-06 05:16:29'),
(140, 'order_receive_uploaded', 'ORD-0107-002: KTV upload ảnh', 'Nguyễn Lý Thoại — Anh Luân', '/admin/orders.html#order-290', 290, 21, 2, 1, '2026-07-06 16:15:45', 0, '2026-07-06 05:22:00'),
(141, 'order_completed', 'ORD-0107-002: KTV hoàn thành', 'Nguyễn Lý Thoại — Anh Luân — 810.000đ', '/admin/orders.html#order-290', 290, 21, 2, 1, '2026-07-06 16:15:45', 0, '2026-07-06 05:22:08'),
(142, 'order_completed', 'ORD-2906-003: KTV hoàn thành', 'Nguyễn Lý Thoại — Thịnh Phú — 972.000đ', '/admin/orders.html#order-280', 280, 160, 2, 1, '2026-07-06 16:15:45', 0, '2026-07-06 05:26:19'),
(143, 'order_receive_uploaded', 'ORD-2906-003: KTV upload ảnh', 'Nguyễn Lý Thoại — Thịnh Phú', '/admin/orders.html#order-280', 280, 160, 2, 1, '2026-07-06 16:15:45', 0, '2026-07-06 05:26:19'),
(144, 'order_completed', 'ORD-0707-005: KTV hoàn thành', 'Trần Quốc Viện — tranvanthoi — 3.500.000đ', '/admin/orders.html#order-325', 325, 182, 8, 1, '2026-07-07 15:58:56', 0, '2026-07-07 05:20:32'),
(145, 'order_receive_uploaded', 'ORD-0707-005: KTV upload ảnh', 'Trần Quốc Viện — tranvanthoi', '/admin/orders.html#order-325', 325, 182, 8, 1, '2026-07-07 15:58:56', 0, '2026-07-07 05:20:39'),
(146, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'tranvanthoi: thêm tài khoản', '/admin/customers.html?customer_id=182&tab=requests', 325, 182, 8, 1, '2026-07-07 15:58:56', 0, '2026-07-07 05:20:55'),
(147, 'order_completed', 'ORD-0707-004: KTV hoàn thành', 'Trần Quốc Viện — lamminhdat — 50.000đ', '/admin/orders.html#order-324', 324, 181, 8, 1, '2026-07-07 15:58:56', 0, '2026-07-07 05:21:20'),
(148, 'order_receive_uploaded', 'ORD-0707-004: KTV upload ảnh', 'Trần Quốc Viện — lamminhdat', '/admin/orders.html#order-324', 324, 181, 8, 1, '2026-07-07 15:58:56', 0, '2026-07-07 05:21:24'),
(149, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'lamminhdat: thêm tài khoản', '/admin/customers.html?customer_id=181&tab=requests', 324, 181, 8, 1, '2026-07-07 15:58:56', 0, '2026-07-07 05:21:33'),
(150, 'order_completed', 'ORD-0707-003: KTV hoàn thành', 'Trần Quốc Viện — ANH HÒA THÀNH ĐẠT — 710.000đ', '/admin/orders.html#order-322', 322, 22, 8, 1, '2026-07-07 15:58:56', 0, '2026-07-07 05:21:55'),
(151, 'order_receive_uploaded', 'ORD-0707-003: KTV upload ảnh', 'Trần Quốc Viện — ANH HÒA THÀNH ĐẠT', '/admin/orders.html#order-322', 322, 22, 8, 1, '2026-07-07 15:58:56', 0, '2026-07-07 05:22:00'),
(152, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'ANH HÒA THÀNH ĐẠT: thêm tài khoản, thêm biển số', '/admin/customers.html?customer_id=22&tab=requests', 322, 22, 8, 1, '2026-07-07 15:58:56', 0, '2026-07-07 05:22:06'),
(153, 'order_receive_uploaded', 'ORD-0607-006: KTV upload ảnh', 'Nguyễn Lý Thoại — ANH PHONG 247', '/admin/orders.html#order-318', 318, 24, 2, 1, '2026-07-08 09:37:44', 0, '2026-07-07 09:21:02'),
(154, 'order_completed', 'ORD-0607-006: KTV hoàn thành', 'Nguyễn Lý Thoại — ANH PHONG 247 — 11.770.000đ', '/admin/orders.html#order-318', 318, 24, 2, 1, '2026-07-08 09:37:44', 0, '2026-07-07 09:22:08'),
(155, 'order_completed', 'ORD-0707-010: KTV hoàn thành', 'Trần Quốc Viện — CÔNG TY TNHH  THƯƠNG MẠI DỊCH VỤ VẬN TẢI ĐẠT THÀNH — 972.000đ', '/admin/orders.html#order-330', 330, 185, 8, 1, '2026-07-08 09:37:44', 0, '2026-07-07 09:55:50'),
(156, 'order_completed', 'ORD-0807-004: KTV hoàn thành', 'Trần Quốc Viện — ANH PHONG 247 — 50.000đ', '/admin/orders.html#order-337', 337, 24, 8, 1, '2026-07-08 15:15:42', 0, '2026-07-08 07:54:06'),
(157, 'order_receive_uploaded', 'ORD-0807-004: KTV upload ảnh', 'Trần Quốc Viện — ANH PHONG 247', '/admin/orders.html#order-337', 337, 24, 8, 1, '2026-07-08 15:15:42', 0, '2026-07-08 07:54:08'),
(158, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'ANH PHONG 247: thêm biển số', '/admin/customers.html?customer_id=24&tab=requests', 337, 24, 8, 1, '2026-07-08 15:15:42', 0, '2026-07-08 07:54:13'),
(159, 'order_receive_uploaded', 'ORD-0907-003: KTV upload ảnh', 'Nguyễn Lý Thoại — 51b03078', '/admin/orders.html#order-341', 341, 191, 2, 1, '2026-07-10 08:46:00', 0, '2026-07-09 11:58:54'),
(160, 'order_completed', 'ORD-0907-003: KTV hoàn thành', 'Nguyễn Lý Thoại — 51b03078 — 1.800.000đ', '/admin/orders.html#order-341', 341, 191, 2, 1, '2026-07-10 08:46:00', 0, '2026-07-09 11:59:08'),
(161, 'order_completed', 'ORD-0807-001: KTV hoàn thành', 'Nguyễn Lý Thoại — Nhà xe Khang Thịnh — 500.000đ', '/admin/orders.html#order-334', 334, 187, 2, 1, '2026-07-10 08:46:00', 0, '2026-07-09 11:59:58'),
(162, 'order_receive_uploaded', 'ORD-0907-002: KTV upload ảnh', 'Nguyễn Lý Thoại — CÔNG TY TNHH THIÊN GIANG ANH TRANSPORT', '/admin/orders.html#order-339', 339, 83, 2, 1, '2026-07-10 08:46:00', 0, '2026-07-09 12:00:15'),
(163, 'order_completed', 'ORD-0907-002: KTV hoàn thành', 'Nguyễn Lý Thoại — CÔNG TY TNHH THIÊN GIANG ANH TRANSPORT — 3.888.000đ', '/admin/orders.html#order-339', 339, 83, 2, 1, '2026-07-10 08:46:00', 0, '2026-07-09 12:00:39'),
(164, 'order_completed', 'ORD-1007-001: KTV hoàn thành', 'Trần Quốc Viện — Anh Luân — 810.000đ', '/admin/orders.html#order-346', 346, 21, 8, 1, '2026-07-10 08:46:00', 0, '2026-07-10 01:39:09'),
(165, 'order_receive_uploaded', 'ORD-1007-001: KTV upload ảnh', 'Trần Quốc Viện — Anh Luân', '/admin/orders.html#order-346', 346, 21, 8, 1, '2026-07-10 08:46:00', 0, '2026-07-10 01:39:36'),
(166, 'customer_asset_request', '[Tự động] KTV đề xuất cập nhật thông tin khách', 'Anh Luân: thêm tài khoản, thêm biển số', '/admin/customers.html?customer_id=21&tab=requests', 346, 21, 8, 1, '2026-07-10 08:46:00', 0, '2026-07-10 01:39:44'),
(167, 'order_completed', 'ORD-1107-004: KTV hoàn thành', 'Trần Quốc Viện — Quang Thịnh — 972.000đ', '/admin/orders.html#order-357', 357, 195, 8, 0, NULL, 0, '2026-07-11 10:39:05'),
(168, 'order_receive_uploaded', 'ORD-1107-004: KTV upload ảnh', 'Trần Quốc Viện — Quang Thịnh', '/admin/orders.html#order-357', 357, 195, 8, 0, NULL, 0, '2026-07-11 10:39:30');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
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
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `code`, `customer_id`, `dealer_id`, `total_amount`, `subtotal`, `paid_amount`, `debt_carried_at`, `debt_settlement_id`, `payment_method`, `status`, `progress_note`, `payment_status`, `collected_for_dealer`, `has_return`, `seen_at`, `address`, `assigned_staff_id`, `due_at`, `started_at`, `completed_at`, `wage_amount`, `tech_commission_amount`, `tech_commission_approved_at`, `tech_commission_approved_by`, `tech_commission_note`, `ktv_note`, `note`, `creator_type`, `creator_id`, `confirmed_at`, `confirmed_by`, `is_deleted`, `created_at`, `end_customer_id`, `tech_commission_requested_by`, `tech_commission_requested_at`, `payslip_id`, `service_kind`) VALUES
(50, 'ORD-2505-001', 19, NULL, 3942000, 3942000, 3942000, '2026-05-28 15:02:48', NULL, 'debt', 'done', '[25/05/2026 11:47 - admin] Tạo đơn\n[25/05/2026 13:35 - admin] Chuyển trạng thái → done\n[07/07/2026 21:36 - admin] Ghi nhận thu 3.942.000đ (Tiền mặt)\n', 'paid', 0, 0, NULL, '31/2A Tân Trụ, Phường Tân Sơn, TP Hồ Chí Minh, Việt Nam', NULL, NULL, NULL, '2026-05-25 13:35:49', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-05-25 04:47:51', NULL, NULL, NULL, NULL, 'install'),
(52, 'ORD-2605-001', 13, NULL, 4752000, 4752000, 9504000, NULL, NULL, 'debt', 'done', '[26/05/2026 10:20 - ktv157123] KTV hoàn thành đơn\n[27/05/2026 15:04 - nv224895] NV nhận 4.752.000đ (Chuyển khoản) — NNT-2705-006\n[09/06/2026 09:48 - admin] Xác nhận nhận 4.752.000đ từ khách\n', 'paid', 0, 0, NULL, '985/71/12/27 Hương Lộ 2, Phường Bình Trị Đông, Thành phố Hồ Chí Minh, Việt Nam', 8, NULL, '2026-05-26 10:15:21', '2026-05-26 10:20:03', 600000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-05-26 03:11:51', NULL, NULL, NULL, NULL, 'install'),
(54, 'ORD-2605-002', 32, NULL, 11664000, 11664000, 0, NULL, NULL, 'debt', 'done', '[26/05/2026 11:05 - nv409671] Tạo đơn\n[26/05/2026 20:05 - admin] Xoá hoa hồng nhân viên\n[02/06/2026 15:36 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, '55 Đường 6B nối dài, KDC Vĩnh Lộc, Phường Bình Tân, TP Hồ Chí Minh, Việt Nam', 8, NULL, '2026-05-26 11:17:56', '2026-06-02 15:36:59', 750000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-05-26 04:05:20', NULL, NULL, NULL, NULL, 'install'),
(55, 'ORD-2605-003', 33, NULL, 972000, 972000, 972000, NULL, NULL, 'debt', 'done', '[26/05/2026 11:48 - nv224895] Tạo đơn\n[26/05/2026 11:49 - nv224895] NV nhận 972.000đ (Chuyển khoản) — NNT-2605-001\n[26/05/2026 11:49 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-26 11:49:27', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-26 04:48:39', NULL, NULL, NULL, NULL, 'install'),
(56, 'ORD-2605-004', 34, NULL, 3000000, 3000000, 3000000, NULL, NULL, 'debt', 'done', '[26/05/2026 15:02 - nv224895] Tạo đơn\n[26/05/2026 15:04 - nv224895] NV nhận 3.000.000đ (Chuyển khoản) — NNT-2605-002\n[26/05/2026 15:04 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-26 15:04:27', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-26 08:02:06', NULL, NULL, NULL, NULL, 'install'),
(57, 'ORD-2605-005', 35, NULL, 972000, 972000, 972000, '2026-07-07 02:39:12', NULL, 'debt', 'done', '[26/05/2026 15:19 - nv409671] Tạo đơn\n[26/05/2026 20:05 - admin] Xoá hoa hồng nhân viên\n[27/05/2026 09:36 - nv224895] NV nhận 972.000đ (Tiền mặt) — NNT-2705-003\n[27/05/2026 15:19 - nv224895] Chuyển trạng thái → in_progress\n[27/05/2026 15:20 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-05-27 15:20:09', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-05-26 08:19:11', NULL, NULL, NULL, 12, 'install'),
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
(79, 'ORD-2805-006', 49, NULL, 12425000, 12425000, 12425000, NULL, NULL, 'debt', 'confirmed', '[28/05/2026 13:49 - nv224895] Tạo đơn\n[24/06/2026 09:08 - nv224895] NV nhận 12.425.000đ (Chuyển khoản) — NNT-2406-002\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-28 06:49:41', NULL, NULL, NULL, NULL, 'install'),
(80, 'ORD-2805-007', 50, NULL, 3105000, 3105000, 3105000, NULL, NULL, 'debt', 'done', '[28/05/2026 13:59 - nv224895] Tạo đơn\n[28/05/2026 14:00 - nv224895] NV nhận 3.105.000đ (Chuyển khoản) — NNT-2805-006\n[28/05/2026 14:00 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-28 14:00:47', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-28 06:59:58', NULL, NULL, NULL, NULL, 'install'),
(81, 'ORD-2805-008', 51, NULL, 8000000, 8000000, 8000000, NULL, NULL, 'debt', 'done', '[28/05/2026 14:50 - admin] Tạo đơn\n[28/05/2026 14:56 - admin] Cập nhật thông tin đơn\n[28/05/2026 14:56 - admin] Cập nhật thông tin đơn\n[28/05/2026 14:56 - admin] Cập nhật thông tin đơn\n[28/05/2026 14:56 - admin] Cập nhật thông tin đơn\n[01/06/2026 16:12 - nv409671] NV nhận 8.000.000đ (Chuyển khoản) — NNT-0106-007\n[01/06/2026 16:12 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, 'Số 26/11 Đường Vĩnh Tân 21, Tổ 1, Khu phố 4, Phường Vĩnh Tân, Thành phố', NULL, NULL, NULL, '2026-06-01 16:12:49', 0, 0, NULL, NULL, NULL, NULL, 'Giá đã bao gồm VAT', 'admin', 1, NULL, NULL, 0, '2026-05-28 07:50:38', NULL, NULL, NULL, NULL, 'install'),
(83, 'ORD-2805-009', 52, NULL, 8100000, 8100000, 8100000, '2026-06-06 09:48:20', NULL, 'debt', 'done', '[28/05/2026 16:18 - nv409671] Tạo đơn\n[29/05/2026 09:14 - admin] Duyệt hoa hồng nhân viên: 100.000đ\n[30/05/2026 11:59 - nv224895] Gán KTV: Trần Quốc Viện\n[30/05/2026 12:00 - nv224895] Gán KTV: Trần Quốc Viện\n[02/06/2026 15:39 - ktv157123] KTV hoàn thành đơn\n[06/06/2026 09:48 - nv224895] NV nhận 8.316.000đ (Chuyển khoản) qua phiếu YC-0606-001 — NNT-0606-001\n', 'paid', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-02 15:39:38', 750000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-05-28 09:18:47', NULL, NULL, NULL, NULL, 'install'),
(84, 'ORD-2805-010', 53, NULL, 6272000, 6272000, 6272000, NULL, NULL, 'debt', 'done', '[28/05/2026 16:33 - nv409671] Tạo đơn\n[28/05/2026 16:33 - nv409671] Cập nhật nội dung dòng công việc\n[28/05/2026 17:07 - nv224895] Chuyển trạng thái → done\n[29/05/2026 08:59 - nv224895] NV nhận 6.272.000đ (Tiền mặt) — NNT-2905-002\n', 'paid', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-05-28 17:07:24', 400000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-05-28 09:33:22', NULL, NULL, NULL, NULL, 'install'),
(85, 'ORD-2905-001', 54, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[29/05/2026 08:52 - admin] Tạo đơn\n[29/05/2026 09:44 - admin] Chuyển trạng thái → done\n[29/05/2026 09:45 - admin] Ghi nhận thu 750.000đ (Tiền mặt)\n', 'paid', 0, 0, NULL, '50 Phạm Hữu Lầu, Phú Mỹ, Quận 7', NULL, NULL, NULL, '2026-05-29 09:44:46', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-05-29 01:52:57', NULL, NULL, NULL, NULL, 'install'),
(86, 'ORD-2905-002', 55, NULL, 1200000, 1200000, 1200000, NULL, NULL, 'debt', 'done', '[29/05/2026 08:58 - nv224895] Tạo đơn\n[29/05/2026 08:58 - nv224895] NV nhận 1.200.000đ (Chuyển khoản) — NNT-2905-001\n[29/05/2026 08:58 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-29 08:58:50', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-29 01:58:36', NULL, NULL, NULL, NULL, 'install'),
(87, 'ORD-2905-003', 56, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[29/05/2026 08:59 - admin] Tạo đơn\n[29/05/2026 09:01 - admin] Cập nhật thông tin đơn\n[29/05/2026 15:05 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-2905-005\n[29/05/2026 15:05 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, 'Số 7 đường 36 Linh Đông, HCM', NULL, NULL, NULL, '2026-05-29 15:05:59', 0, 0, NULL, NULL, NULL, NULL, '29H92515', 'admin', 1, NULL, NULL, 0, '2026-05-29 01:59:54', NULL, NULL, NULL, NULL, 'install'),
(88, 'ORD-2905-004', 57, NULL, 2250000, 2250000, 0, NULL, NULL, 'debt', 'confirmed', '[29/05/2026 09:59 - nv224895] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-29 02:59:52', NULL, NULL, NULL, NULL, 'install'),
(89, 'ORD-2905-005', 59, NULL, 20520000, 20520000, 0, NULL, NULL, 'debt', 'done', '[29/05/2026 13:50 - admin] Tạo đơn\n[29/05/2026 13:52 - admin] Thêm hoa hồng nhân viên Phương Quyên: 20.000đ\n[10/06/2026 13:51 - admin] Chuyển trạng thái → done\n', 'customer_owes', 0, 0, NULL, '96/4 Đường số 9, Phường Linh Xuân, HCM', NULL, NULL, NULL, '2026-06-10 13:51:07', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-05-29 06:50:11', NULL, NULL, NULL, NULL, 'install'),
(91, 'ORD-2905-006', 60, NULL, 810000, 810000, 810000, '2026-07-07 02:39:12', NULL, 'debt', 'done', '[29/05/2026 13:53 - nv224895] Tạo đơn\n[29/05/2026 13:53 - nv224895] NV nhận 810.000đ (Chuyển khoản) — NNT-2905-003\n[29/05/2026 13:53 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-05-29 13:53:24', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-29 06:53:10', NULL, NULL, NULL, 12, 'install'),
(92, 'ORD-2905-007', 61, NULL, 2500000, 2500000, 2500000, NULL, NULL, 'debt', 'done', '[29/05/2026 14:55 - nv224895] Tạo đơn\n[29/05/2026 14:55 - nv224895] NV nhận 2.500.000đ (Tiền mặt) — NNT-2905-004\n[29/05/2026 14:55 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-29 14:55:48', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-29 07:55:13', NULL, NULL, NULL, NULL, 'install'),
(93, 'ORD-2905-008', 62, NULL, 1800000, 1800000, 1800000, NULL, NULL, 'debt', 'done', '[29/05/2026 15:21 - nv409671] Tạo đơn\n[29/05/2026 15:21 - nv409671] Cập nhật thông tin đơn\n[29/05/2026 16:24 - nv224895] NV nhận 1.800.000đ (Chuyển khoản) — NNT-2905-006\n[29/05/2026 16:24 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-29 16:24:51', 0, 0, NULL, NULL, NULL, NULL, '50E15842', 'admin', 6, NULL, NULL, 0, '2026-05-29 08:21:11', NULL, NULL, NULL, NULL, 'install'),
(94, 'ORD-3005-001', 44, NULL, 972000, 972000, 0, '2026-07-07 02:39:12', NULL, 'debt', 'done', '[30/05/2026 08:22 - admin] Tạo đơn\n[30/05/2026 08:22 - admin] Thêm hoa hồng nhân viên Phương Quyên: 9.720đ\n[30/05/2026 08:33 - admin] Gán KTV: Trần Quốc Viện\n[30/05/2026 08:36 - admin] Gán KTV: Nguyễn Lý Thoại\n[30/05/2026 09:01 - ktv885380] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-05-30 09:01:31', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-05-30 01:22:23', NULL, NULL, NULL, 12, 'install'),
(95, 'ORD-3005-002', 65, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[30/05/2026 10:22 - nv224895] Tạo đơn\n[30/05/2026 10:44 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-3005-001\n[30/05/2026 10:44 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-30 10:44:48', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-30 03:22:10', NULL, NULL, NULL, NULL, 'install'),
(96, 'ORD-3005-003', 44, NULL, 3000000, 3000000, 0, NULL, NULL, 'debt', 'confirmed', '[30/05/2026 11:53 - admin] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-05-30 04:53:32', NULL, NULL, NULL, NULL, 'install'),
(97, 'ORD-3005-004', 66, NULL, 1200000, 1200000, 1200000, NULL, NULL, 'debt', 'done', '[30/05/2026 13:13 - admin] Tạo đơn\n[30/05/2026 13:13 - admin] Thêm hoa hồng nhân viên Phương Quyên: 12.000đ\n[30/05/2026 14:10 - nv224895] Cập nhật nội dung dòng công việc\n[30/05/2026 14:10 - nv224895] NV nhận 1.200.000đ (Chuyển khoản) — NNT-3005-002\n[30/05/2026 14:11 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-30 14:11:10', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-05-30 06:13:45', NULL, NULL, NULL, NULL, 'install'),
(98, 'ORD-3005-005', 67, NULL, 1320000, 1320000, 1320000, NULL, NULL, 'debt', 'done', '[30/05/2026 14:08 - nv224895] Tạo đơn\n[01/06/2026 09:32 - nv224895] NV nhận 1.320.000đ (Chuyển khoản) — NNT-0106-001\n[01/06/2026 09:32 - nv224895] Chuyển trạng thái → done\n[02/06/2026 09:47 - admin] Duyệt hoa hồng nhân viên: 10.000đ\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-01 09:32:22', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-30 07:08:44', NULL, NULL, NULL, NULL, 'install'),
(99, 'ORD-3005-006', 63, NULL, 2365000, 2365000, 2365000, NULL, NULL, 'debt', 'done', '[30/05/2026 17:51 - nv224895] Tạo đơn\n[30/05/2026 17:51 - nv224895] Chuyển trạng thái → done\n[30/05/2026 17:53 - nv224895] NV nhận 2.365.000đ (Chuyển khoản) — NNT-3005-003\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-05-30 17:51:44', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-05-30 10:51:38', NULL, NULL, NULL, NULL, 'install'),
(100, 'ORD-3005-007', 59, NULL, 23538000, 23538000, 0, NULL, NULL, 'debt', 'done', '[30/05/2026 20:56 - admin] Tạo đơn\n[10/06/2026 13:49 - admin] Chuyển trạng thái → done\n[10/06/2026 13:50 - admin] Thêm hoa hồng nhân viên Phương Quyên: 20.000đ\n', 'customer_owes', 0, 0, NULL, '96/4 Đường số 9, Phường Linh Xuân, HCM', NULL, NULL, NULL, '2026-06-10 13:49:42', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-05-30 13:56:18', NULL, NULL, NULL, NULL, 'install'),
(102, 'ORD-0106-001', 68, NULL, 3000000, 3000000, 3000000, '2026-07-07 02:39:12', NULL, 'debt', 'done', '[02/06/2026 16:35 - admin] Thêm hoa hồng nhân viên Nguyễn Lý Thoại: 150.000đ\n', 'paid', 0, 0, NULL, 'Gần nhà ga T3', 2, NULL, NULL, '2026-06-01 15:09:26', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-01 02:42:03', NULL, NULL, NULL, 12, 'install'),
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
(119, 'ORD-0306-002', 83, NULL, 3888000, 3888000, 3888000, NULL, NULL, 'debt', 'done', '[03/06/2026 09:03 - nv409671] Tạo đơn\n[03/06/2026 09:13 - nv409671] Gán KTV: Trần Quốc Viện\n[03/06/2026 10:49 - ktv157123] KTV hoàn thành đơn\n[15/06/2026 11:08 - nv409671] NV nhận 3.888.000đ (Chuyển khoản) — NNT-1506-004\n', 'paid', 0, 0, NULL, 'Ô 127-128 Đường D33, khu phố 4, Phường An Phú, TP Hồ Chí Minh, Việt Nam', 8, NULL, '2026-06-03 10:47:40', '2026-06-03 10:49:40', 150000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-03 02:03:13', NULL, NULL, NULL, NULL, 'install'),
(120, 'ORD-0306-003', 59, NULL, 22050000, 22050000, 0, NULL, NULL, 'debt', 'done', '[03/06/2026 09:47 - nv224895] Tạo đơn\n[03/06/2026 13:30 - nv224895] Chuyển trạng thái → done\n', 'customer_owes', 0, 0, NULL, '96/4 Đường số 9, Phường Linh Xuân, HCM', NULL, NULL, NULL, '2026-06-03 13:30:52', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-03 02:47:57', NULL, NULL, NULL, NULL, 'install'),
(121, 'ORD-0306-004', 42, NULL, 2322000, 2322000, 2322000, NULL, NULL, 'debt', 'confirmed', '[03/06/2026 10:23 - nv224895] Tạo đơn\n[03/06/2026 10:38 - nv224895] NV nhận 2.322.000đ (Chuyển khoản) — NNT-0306-002\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-03 03:23:11', NULL, NULL, NULL, NULL, 'install'),
(122, 'ORD-0306-005', 84, NULL, 2048000, 2048000, 0, NULL, NULL, 'debt', 'confirmed', '[03/06/2026 13:01 - admin] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-03 06:01:43', NULL, NULL, NULL, NULL, 'install'),
(123, 'ORD-0306-006', 42, NULL, 150000, 150000, 0, '2026-07-03 09:07:27', NULL, 'debt', 'done', '[03/06/2026 13:36 - nv409671] Tạo đơn\n[03/06/2026 13:38 - nv409671] Chuyển trạng thái → done\n', 'customer_owes', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-03 13:38:00', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-03 06:36:17', NULL, NULL, NULL, NULL, 'install'),
(124, 'ORD-0306-007', 21, NULL, 480000, 480000, 0, NULL, NULL, 'debt', 'done', '[03/06/2026 13:43 - nv224895] Tạo đơn\n[03/06/2026 13:44 - nv224895] Cập nhật nội dung dòng công việc\n[03/06/2026 13:44 - nv224895] Chuyển trạng thái → done\n', 'customer_owes', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-03 13:44:23', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-03 06:43:53', NULL, NULL, NULL, NULL, 'install'),
(125, 'ORD-0306-008', 78, NULL, 495000, 495000, 0, NULL, NULL, 'debt', 'done', '[03/06/2026 13:48 - nv409671] Tạo đơn\n[03/06/2026 15:23 - nv224895] Chuyển trạng thái → done\n', 'customer_owes', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-03 15:23:29', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-03 06:48:34', NULL, NULL, NULL, NULL, 'install'),
(127, 'ORD-0306-009', 59, NULL, 650000, 650000, 0, '2026-07-07 02:39:12', NULL, 'debt', 'done', '[03/06/2026 15:14 - nv224895] Tạo đơn\n[03/06/2026 15:14 - nv224895] Chuyển trạng thái → done\n', 'customer_owes', 0, 0, NULL, '96/4 Đường số 9, Phường Linh Xuân, HCM', 2, NULL, NULL, '2026-06-03 15:14:15', 150000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-03 08:14:06', NULL, NULL, NULL, 12, 'install'),
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
(142, 'ORD-0406-010', 90, NULL, 12659760, 12659760, 12659760, '2026-07-07 02:39:12', NULL, 'debt', 'done', '[05/06/2026 15:25 - ktv885380] KTV hoàn thành đơn\n[15/06/2026 11:07 - nv409671] NV nhận 12.659.760đ (Chuyển khoản) — NNT-1506-003\n', 'paid', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-06-05 15:25:46', 450000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-04 07:20:45', NULL, NULL, NULL, 12, 'install'),
(144, 'ORD-0406-011', 91, NULL, 7560000, 7560000, 7560000, '2026-07-07 02:39:12', NULL, 'debt', 'done', '[04/06/2026 14:42 - nv409671] Tạo đơn\n[04/06/2026 18:04 - ktv885380] KTV hoàn thành đơn\n[15/06/2026 11:07 - nv409671] NV nhận 7.560.000đ (Chuyển khoản) — NNT-1506-002\n', 'paid', 0, 0, NULL, '280B4 Lương Định Của, Khu Phố 1, Phường Bình Trưng, TP Hồ Chí Minh, Việt Nam', 2, NULL, NULL, '2026-06-04 18:04:41', 300000, 0, NULL, NULL, NULL, 'Không thu. Xe chưa có BS', NULL, 'admin', 6, NULL, NULL, 0, '2026-06-04 07:42:11', NULL, NULL, NULL, 12, 'install'),
(145, 'ORD-0406-012', 92, NULL, 750000, 750000, 0, NULL, NULL, 'debt', 'confirmed', '[04/06/2026 15:29 - nv224895] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-04 08:29:16', NULL, NULL, NULL, NULL, 'install'),
(147, 'ORD-0406-013', 93, NULL, 810000, 810000, 810000, '2026-07-06 22:09:40', NULL, 'debt', 'done', '[04/06/2026 18:00 - admin] Tạo đơn\n[04/06/2026 20:47 - ktv885380] KTV hoàn thành đơn\n[06/07/2026 22:10 - admin] Thu qua phiếu YC-0607-003 (HD-0607-002) 810.000đ [Tiền mặt]\n', 'paid', 0, 0, NULL, 'Đường Nguyễn Thị Thử X. Xuân Thới Sơn, TP. Hồ Chí Minh, Việt Nam', 2, NULL, NULL, '2026-06-04 20:47:09', 100000, 0, NULL, NULL, NULL, 'Không thu, khách hẹn chuyển khoản cty sau', NULL, 'admin', 1, NULL, NULL, 0, '2026-06-04 11:00:30', NULL, NULL, NULL, NULL, 'install'),
(148, 'ORD-0506-001', 94, NULL, 0, 0, 0, NULL, NULL, 'debt', 'done', '[05/06/2026 08:33 - nv224895] Tạo đơn\n[05/06/2026 08:42 - nv224895] Chuyển trạng thái → in_progress\n[05/06/2026 08:42 - nv224895] Chuyển trạng thái → done\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-05 08:42:13', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-05 01:33:46', NULL, NULL, NULL, NULL, 'install'),
(149, 'ORD-0506-002', 94, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[05/06/2026 08:43 - nv224895] Tạo đơn\n[05/06/2026 08:43 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-0506-001\n[05/06/2026 08:44 - nv224895] Cập nhật nội dung dòng công việc\n[05/06/2026 08:45 - nv224895] Chuyển trạng thái → in_progress\n[05/06/2026 11:20 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-05 11:20:11', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-05 01:43:49', NULL, NULL, NULL, NULL, 'install'),
(150, 'ORD-0506-003', 95, NULL, 3550000, 3550000, 3550000, NULL, NULL, 'debt', 'done', '[05/06/2026 13:38 - nv224895] Tạo đơn\n[05/06/2026 16:20 - nv224895] Chuyển trạng thái → done\n[09/06/2026 15:21 - nv224895] NV nhận 3.550.000đ (Chuyển khoản) — NNT-0906-003\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-05 16:20:59', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-05 06:38:21', NULL, NULL, NULL, NULL, 'install'),
(151, 'ORD-0506-004', 63, NULL, 1800000, 1800000, 0, NULL, NULL, 'debt', 'done', '[05/06/2026 13:41 - nv224895] Tạo đơn\n[05/06/2026 13:41 - nv224895] Cập nhật nội dung dòng công việc\n[05/06/2026 13:47 - nv224895] Cập nhật nội dung dòng công việc\n[05/06/2026 16:20 - nv224895] Chuyển trạng thái → done\n[05/06/2026 16:31 - admin] Thêm hoa hồng nhân viên Phương Quyên: 1.800đ\n[05/06/2026 16:34 - admin] Duyệt hoa hồng nhân viên: 18.000đ\n', 'customer_owes', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-05 16:20:16', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-05 06:41:24', NULL, NULL, NULL, NULL, 'install'),
(152, 'ORD-0506-005', 59, NULL, 605000, 605000, 0, NULL, NULL, 'debt', 'done', '[05/06/2026 18:13 - nv224895] Tạo đơn\n[06/06/2026 11:28 - nv224895] Chuyển trạng thái → done\n', 'customer_owes', 0, 0, NULL, '96/4 Đường số 9, Phường Linh Xuân, HCM', NULL, NULL, NULL, '2026-06-06 11:28:25', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-05 11:13:18', NULL, NULL, NULL, NULL, 'install'),
(153, 'ORD-0506-006', 97, NULL, 1080000, 1080000, 1080000, NULL, NULL, 'debt', 'done', '[05/06/2026 19:46 - nv224895] Tạo đơn\n[05/06/2026 19:46 - nv224895] Chuyển trạng thái → in_progress\n[05/06/2026 19:46 - nv224895] NV nhận 1.080.000đ (Tiền mặt) — NNT-0506-002\n[05/06/2026 20:18 - ktv157123] KTV hoàn thành đơn\n[05/06/2026 21:58 - admin] Thêm hoa hồng nhân viên Trần Quốc Viện: 100.000đ\n[11/06/2026 14:05 - admin] Duyệt hoa hồng nhân viên: 180.000đ\n', 'paid', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-05 20:18:05', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-05 12:46:25', NULL, NULL, NULL, NULL, 'install'),
(154, 'ORD-0506-007', 98, NULL, 1080000, 1080000, 0, NULL, NULL, 'debt', 'cancelled', '[05/06/2026 21:53 - admin] Tạo đơn\n[05/06/2026 21:57 - admin] Huỷ đơn\n', 'unpaid', 0, 0, NULL, NULL, 8, NULL, NULL, NULL, 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-05 14:53:40', NULL, NULL, NULL, NULL, 'install'),
(155, 'ORD-0606-001', 21, NULL, 810000, 810000, 0, '2026-07-07 02:39:12', NULL, 'debt', 'done', '[06/06/2026 08:20 - nv224895] Tạo đơn\n[06/06/2026 09:13 - ktv885380] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-06-06 09:13:57', 100000, 0, NULL, NULL, NULL, 'Không thu', NULL, 'admin', 3, NULL, NULL, 0, '2026-06-06 01:20:39', NULL, NULL, NULL, 12, 'install'),
(156, 'ORD-0606-002', 52, NULL, 216000, 216000, 216000, '2026-06-06 09:48:20', NULL, 'debt', 'done', '[06/06/2026 09:47 - nv224895] Tạo đơn\n[06/06/2026 09:48 - nv224895] Chuyển trạng thái → done\n[06/06/2026 09:48 - nv224895] NV nhận 8.316.000đ (Chuyển khoản) qua phiếu YC-0606-001 — NNT-0606-001\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-06 09:48:01', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-06 02:47:55', NULL, NULL, NULL, NULL, 'install'),
(157, 'ORD-0606-003', 99, NULL, 460000, 460000, 460000, NULL, NULL, 'debt', 'done', '[06/06/2026 10:09 - nv224895] Tạo đơn\n[06/06/2026 10:10 - nv224895] Chuyển trạng thái → done\n[06/06/2026 10:10 - nv224895] NV nhận 460.000đ (Tiền mặt) — NNT-0606-002\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-06 10:10:05', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-06 03:09:59', NULL, NULL, NULL, NULL, 'install'),
(158, 'ORD-0606-004', 19, NULL, 7056000, 7056000, 7056000, NULL, NULL, 'debt', 'confirmed', '[06/06/2026 11:35 - nv224895] Tạo đơn\n[09/06/2026 09:45 - admin] Thêm hoa hồng nhân viên Phương Quyên: 20.000đ\n[24/06/2026 11:10 - nv224895] NV nhận 7.056.000đ (Chuyển khoản) — NNT-2406-004\n', 'paid', 0, 0, NULL, '31/2A Tân Trụ, Phường Tân Sơn, TP Hồ Chí Minh, Việt Nam', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-06 04:35:44', NULL, NULL, NULL, NULL, 'install'),
(159, 'ORD-0606-005', 100, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[06/06/2026 11:51 - admin] Tạo đơn\n[06/06/2026 11:52 - admin] Cập nhật thông tin đơn\n[06/06/2026 12:04 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-0606-003\n[06/06/2026 12:06 - nv224895] Cập nhật nội dung dòng công việc\n[06/06/2026 12:06 - nv224895] Cập nhật nội dung dòng công việc\n[06/06/2026 12:06 - nv224895] Chuyển trạng thái → in_progress\n[06/06/2026 12:06 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, '0902369579', NULL, NULL, NULL, '2026-06-06 12:06:31', 0, 0, NULL, NULL, NULL, NULL, '51C89645', 'admin', 1, NULL, NULL, 0, '2026-06-06 04:51:00', NULL, NULL, NULL, NULL, 'install'),
(161, 'ORD-0606-006', 101, NULL, 100000, 100000, 100000, '2026-07-06 22:05:15', NULL, 'debt', 'done', '[06/06/2026 12:45 - nv224895] Tạo đơn\n[08/06/2026 15:11 - ktv157123] Bắt đầu làm việc\n[08/06/2026 15:12 - ktv157123] KTV hoàn thành đơn\n[06/07/2026 22:05 - admin] Thu qua phiếu YC-0607-001 (HD-0607-001) 100.000đ [Tiền mặt]\n', 'paid', 0, 0, NULL, NULL, 8, NULL, '2026-06-08 15:11:25', '2026-06-08 15:12:26', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-06 05:45:12', NULL, NULL, NULL, NULL, 'install'),
(162, 'ORD-0606-007', 84, NULL, 3128000, 3128000, 3128000, NULL, NULL, 'debt', 'done', '[06/06/2026 13:13 - nv224895] Tạo đơn\n[06/06/2026 14:09 - nv224895] Cập nhật nội dung dòng công việc\n[06/06/2026 14:10 - nv224895] Cập nhật nội dung dòng công việc\n[06/06/2026 19:43 - admin] Chuyển trạng thái → done\n[06/06/2026 19:45 - admin] Thêm hoa hồng nhân viên Phương Quyên: 20.000đ\n[06/06/2026 19:45 - admin] Ghi nhận thu 3.128.000đ (Chuyển khoản)\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-06 19:43:37', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-06 06:13:27', NULL, NULL, NULL, NULL, 'install'),
(163, 'ORD-0806-001', 102, NULL, 1620000, 1620000, 1620000, NULL, NULL, 'debt', 'done', '[08/06/2026 15:46 - admin] Tạo đơn\n[09/06/2026 09:42 - admin] Chuyển trạng thái → done\n[09/06/2026 09:42 - admin] Ghi nhận thu 1.620.000đ (Chuyển khoản)\n', 'paid', 0, 0, NULL, '158/11/24 Đường Bà Hạt, Phường Vườn Lài, TP Hồ Chí Minh, Việt Nam', NULL, NULL, NULL, '2026-06-09 09:42:16', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-08 08:46:01', NULL, NULL, NULL, NULL, 'install'),
(164, 'ORD-0906-001', 103, NULL, 1200000, 1200000, 0, NULL, NULL, 'debt', 'confirmed', '[09/06/2026 14:13 - nv409671] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-09 07:13:39', NULL, NULL, NULL, NULL, 'install'),
(165, 'ORD-0906-002', 104, NULL, 3600000, 3600000, 3600000, NULL, NULL, 'debt', 'done', '[09/06/2026 14:15 - nv409671] Tạo đơn\n[09/06/2026 14:17 - nv409671] NV nhận 3.600.000đ (Chuyển khoản) — NNT-0906-001\n[09/06/2026 14:17 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-09 14:17:11', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-09 07:15:20', NULL, NULL, NULL, NULL, 'install'),
(166, 'ORD-0906-003', 105, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[09/06/2026 14:16 - nv409671] Tạo đơn\n[09/06/2026 14:18 - nv409671] NV nhận 750.000đ (Chuyển khoản) — NNT-0906-002\n[09/06/2026 14:18 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-09 14:18:21', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-09 07:16:39', NULL, NULL, NULL, NULL, 'install'),
(167, 'ORD-0906-004', 106, NULL, 700000, 700000, 700000, NULL, NULL, 'debt', 'done', '[09/06/2026 14:22 - nv409671] Tạo đơn\n[10/06/2026 09:08 - nv224895] NV nhận 700.000đ (Chuyển khoản) — NNT-1006-002\n[10/06/2026 09:08 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, 'Số 29 Đường 494, Ấp 3, Tổ 22, Xã Nhuận Đức, TP Hồ Chí Minh, Việt Nam', NULL, NULL, NULL, '2026-06-10 09:08:43', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-09 07:22:27', NULL, NULL, NULL, NULL, 'install'),
(170, 'ORD-0906-005', 58, NULL, 7000000, 7000000, 7000000, NULL, NULL, 'debt', 'done', '[09/06/2026 15:47 - nv224895] Tạo đơn\n[09/06/2026 16:21 - nv224895] NV nhận 7.000.000đ (Chuyển khoản) — NNT-0906-004\n[09/06/2026 16:21 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-09 16:21:57', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-09 08:47:02', NULL, NULL, NULL, NULL, 'install'),
(171, 'ORD-0906-006', 107, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[09/06/2026 16:21 - nv409671] Tạo đơn\n[09/06/2026 16:22 - nv409671] NV nhận 750.000đ (Chuyển khoản) — NNT-0906-005\n[09/06/2026 16:22 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-09 16:22:17', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-09 09:21:10', NULL, NULL, NULL, NULL, 'install'),
(172, 'ORD-0906-007', 95, NULL, 4050000, 4050000, 4050000, NULL, NULL, 'debt', 'done', '[09/06/2026 16:24 - nv224895] Tạo đơn\n[19/06/2026 13:03 - nv224895] NV nhận 4.050.000đ (Chuyển khoản) — NNT-1906-002\n[19/06/2026 13:03 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-19 13:03:44', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-09 09:24:31', NULL, NULL, NULL, NULL, 'install'),
(173, 'ORD-0906-008', 61, NULL, 1850000, 1850000, 1850000, NULL, NULL, 'debt', 'done', '[09/06/2026 16:59 - nv224895] Tạo đơn\n[09/06/2026 16:59 - nv224895] NV nhận 1.850.000đ (Chuyển khoản) — NNT-0906-006\n[09/06/2026 16:59 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-09 16:59:35', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-09 09:59:06', NULL, NULL, NULL, NULL, 'install'),
(174, 'ORD-1006-001', 108, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[10/06/2026 08:46 - nv409671] Tạo đơn\n[10/06/2026 08:47 - nv409671] NV nhận 750.000đ (Chuyển khoản) — NNT-1006-001\n[10/06/2026 08:47 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-10 08:47:26', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-10 01:46:09', NULL, NULL, NULL, NULL, 'install');
INSERT INTO `orders` (`id`, `code`, `customer_id`, `dealer_id`, `total_amount`, `subtotal`, `paid_amount`, `debt_carried_at`, `debt_settlement_id`, `payment_method`, `status`, `progress_note`, `payment_status`, `collected_for_dealer`, `has_return`, `seen_at`, `address`, `assigned_staff_id`, `due_at`, `started_at`, `completed_at`, `wage_amount`, `tech_commission_amount`, `tech_commission_approved_at`, `tech_commission_approved_by`, `tech_commission_note`, `ktv_note`, `note`, `creator_type`, `creator_id`, `confirmed_at`, `confirmed_by`, `is_deleted`, `created_at`, `end_customer_id`, `tech_commission_requested_by`, `tech_commission_requested_at`, `payslip_id`, `service_kind`) VALUES
(175, 'ORD-1006-002', 109, NULL, 54000000, 54000000, 54000000, NULL, NULL, 'debt', 'confirmed', '[10/06/2026 09:00 - nv409671] Tạo đơn\n[13/06/2026 09:37 - admin] Cập nhật nội dung dòng công việc\n[13/06/2026 09:37 - admin] Thêm hoa hồng nhân viên Phương Quyên: 20.000đ\n[11/07/2026 10:58 - admin] Ghi nhận thu 54.000.000đ (Tiền mặt)\n', 'paid', 0, 0, NULL, '32 đường số 5, Khu Đô Thị Vạn Phúc, Phường Hiệp Bình, Thành phố Hồ Chí Minh, Việt Nam', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-10 02:00:11', NULL, NULL, NULL, NULL, 'install'),
(176, 'ORD-1006-003', 21, NULL, 864000, 864000, 0, NULL, NULL, 'debt', 'done', '[10/06/2026 10:51 - nv224895] Tạo đơn\n[10/06/2026 13:07 - nv224895] Cập nhật nội dung dòng công việc\n[10/06/2026 13:43 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-10 13:43:58', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-10 03:51:21', NULL, NULL, NULL, NULL, 'install'),
(177, 'ORD-1006-004', 110, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[10/06/2026 11:32 - nv224895] Tạo đơn\n[10/06/2026 11:37 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-1006-003\n[10/06/2026 11:37 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-10 11:37:35', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-10 04:32:49', NULL, NULL, NULL, NULL, 'install'),
(178, 'ORD-0706-001-OLD', 21, NULL, 810000, 810000, 0, '2026-07-07 02:39:12', NULL, 'debt', 'done', '[07/06/2026 16:52 - nv224895] Tạo đơn\n[17/06/2026 15:45 - ktv885380] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-06-17 15:45:13', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-07 02:52:13', NULL, NULL, NULL, 12, 'install'),
(179, 'ORD-0806-001-OLD', 111, NULL, 972000, 972000, 0, NULL, NULL, 'debt', 'done', '[08/06/2026 08:07 - admin] Tạo đơn\n[10/06/2026 13:42 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-10 13:42:08', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-07 18:07:21', NULL, NULL, NULL, NULL, 'install'),
(180, 'ORD-0806-002-OLD', 112, NULL, 1500000, 1500000, 1500000, NULL, NULL, 'debt', 'done', '[08/06/2026 08:23 - nv224895] Tạo đơn\n[08/06/2026 09:23 - nv224895] Cập nhật nội dung dòng công việc\n[08/06/2026 09:24 - nv224895] NV nhận 1.500.000đ (Chuyển khoản) — NNT-0806-001-OLD\n[08/06/2026 14:04 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-08 14:04:42', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-07 18:23:05', NULL, NULL, NULL, NULL, 'install'),
(181, 'ORD-0806-003-OLD', 21, NULL, 864000, 864000, 0, NULL, NULL, 'debt', 'done', '[08/06/2026 09:05 - nv224895] Tạo đơn\n[10/06/2026 13:40 - nv224895] Cập nhật nội dung dòng công việc\n[10/06/2026 13:41 - nv224895] Cập nhật nội dung dòng công việc\n[10/06/2026 13:43 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-10 13:43:23', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-07 19:05:22', NULL, NULL, NULL, NULL, 'install'),
(182, 'ORD-0906-002-OLD', 113, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[09/06/2026 11:46 - nv224895] Tạo đơn\n[09/06/2026 11:46 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-0906-002-OLD\n[09/06/2026 11:46 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-09 11:46:43', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-08 21:46:17', NULL, NULL, NULL, NULL, 'install'),
(183, 'ORD-1006-005', 61, NULL, 17958000, 17958000, 0, NULL, NULL, 'debt', 'done', '[10/06/2026 13:59 - nv224895] Tạo đơn\n[10/06/2026 17:07 - nv409671] Chuyển trạng thái → done\n', 'customer_owes', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-10 17:07:48', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-10 06:59:40', NULL, NULL, NULL, NULL, 'install'),
(184, 'ORD-1006-006', 61, NULL, 21400000, 21400000, 0, NULL, NULL, 'debt', 'done', '[10/06/2026 14:08 - nv224895] Tạo đơn\n[10/06/2026 14:18 - nv224895] Chuyển trạng thái → done\n', 'customer_owes', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-10 14:18:48', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-10 07:08:07', NULL, NULL, NULL, NULL, 'install'),
(185, 'ORD-1006-007', 114, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[10/06/2026 14:51 - nv409671] Tạo đơn\n[10/06/2026 14:51 - nv409671] Cập nhật nội dung dòng công việc\n[10/06/2026 14:52 - nv409671] NV nhận 750.000đ (Chuyển khoản) — NNT-1006-004\n[10/06/2026 14:52 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-10 14:52:25', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-10 07:51:07', NULL, NULL, NULL, NULL, 'install'),
(187, 'ORD-1006-008', 116, NULL, 750000, 750000, 0, NULL, NULL, 'debt', 'cancelled', '[10/06/2026 16:05 - nv224895] Tạo đơn\n[10/06/2026 16:05 - nv224895] Cập nhật nội dung dòng công việc\n[10/06/2026 16:45 - nv224895] Huỷ đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-10 09:05:05', NULL, NULL, NULL, NULL, 'install'),
(189, 'ORD-1006-009', 115, NULL, 18144000, 18144000, 0, NULL, NULL, 'debt', 'confirmed', '[10/06/2026 16:06 - admin] Tạo đơn\n', 'unpaid', 0, 0, NULL, 'Lô A1, Đường số 2, Khu công nghiệp Nhựt Chánh, xã Bình Đức, Tỉnh Tây Ninh, Việt Nam', NULL, NULL, NULL, NULL, 1000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-10 09:06:25', NULL, NULL, NULL, NULL, 'install'),
(190, 'ORD-1006-010', 77, NULL, 5724000, 5724000, 5724000, NULL, NULL, 'debt', 'done', '[10/06/2026 16:11 - admin] Tạo đơn\n[10/06/2026 16:11 - admin] Thêm hoa hồng nhân viên Như: 20.000đ\n[11/06/2026 10:09 - nv224895] NV nhận 5.724.000đ (Chuyển khoản) — NNT-1106-003\n[11/06/2026 10:09 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, '34 Trần Thị Tâm, Khu phố 1, Phường Quảng Trị, Tỉnh Quảng Trị, Việt Nam', NULL, NULL, NULL, '2026-06-11 10:09:40', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-10 09:11:17', NULL, NULL, NULL, NULL, 'install'),
(191, 'ORD-1006-011', 58, NULL, 9720000, 9720000, 9720000, NULL, NULL, 'debt', 'done', '[10/06/2026 16:19 - admin] Tạo đơn\n[10/06/2026 16:19 - admin] Thêm hoa hồng nhân viên Như: 20.000đ\n[10/06/2026 17:07 - nv409671] NV nhận 9.720.000đ (Chuyển khoản) — NNT-1006-005\n[11/06/2026 09:45 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-11 09:45:02', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-10 09:19:22', NULL, NULL, NULL, NULL, 'install'),
(193, 'ORD-1006-012', 59, NULL, 100000, 100000, 0, NULL, NULL, 'debt', 'done', '[10/06/2026 17:13 - nv409671] Tạo đơn\n[10/06/2026 17:15 - nv409671] Chuyển trạng thái → done\n', 'customer_owes', 0, 0, NULL, '96/4 Đường số 9, Phường Linh Xuân, HCM', 8, NULL, NULL, '2026-06-10 17:15:11', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-10 10:13:42', NULL, NULL, NULL, NULL, 'install'),
(194, 'ORD-1006-013', 59, NULL, 745000, 745000, 0, NULL, NULL, 'debt', 'done', '[10/06/2026 17:14 - nv409671] Tạo đơn\n[11/06/2026 09:41 - nv224895] Cập nhật nội dung dòng công việc\n[11/06/2026 14:07 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, '96/4 Đường số 9, Phường Linh Xuân, HCM', 8, NULL, NULL, '2026-06-11 14:07:29', 150000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-10 10:14:39', NULL, NULL, NULL, NULL, 'install'),
(195, 'ORD-1106-001', 117, NULL, 972000, 972000, 972000, NULL, NULL, 'debt', 'done', '[11/06/2026 07:57 - admin] Tạo đơn\n[11/06/2026 07:57 - admin] Chuyển trạng thái → done\n[11/06/2026 07:58 - admin] Cập nhật thông tin đơn\n[11/06/2026 10:30 - admin] Ghi nhận thu 972.000đ (Tiền mặt)\n', 'paid', 0, 0, NULL, '27/37 HT45', NULL, NULL, NULL, '2026-06-11 07:57:40', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-11 00:57:30', NULL, NULL, NULL, NULL, 'install'),
(196, 'ORD-1106-002', 118, NULL, 2250000, 2250000, 2250000, NULL, NULL, 'debt', 'done', '[11/06/2026 08:58 - nv224895] Tạo đơn\n[11/06/2026 15:28 - nv224895] NV nhận 2.250.000đ (Chuyển khoản) — NNT-1106-006\n[11/06/2026 15:28 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-11 15:28:47', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-11 01:58:51', NULL, NULL, NULL, NULL, 'install'),
(197, 'ORD-1106-003', 119, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[11/06/2026 09:04 - nv224895] Tạo đơn\n[11/06/2026 09:13 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-1106-002\n[11/06/2026 09:13 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-11 09:13:34', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-11 02:04:57', NULL, NULL, NULL, NULL, 'install'),
(198, 'ORD-1106-004', 120, NULL, 4400000, 4400000, 4400000, NULL, NULL, 'debt', 'done', '[11/06/2026 09:57 - nv224895] Tạo đơn\n[11/06/2026 14:08 - ktv157123] KTV hoàn thành đơn\n[12/06/2026 14:54 - nv224895] NV nhận 4.400.000đ (Chuyển khoản) — NNT-1206-002\n', 'paid', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-11 14:08:00', 200000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-11 02:57:43', NULL, NULL, NULL, NULL, 'install'),
(199, 'ORD-1106-005', 121, NULL, 2640000, 2640000, 2640000, NULL, NULL, 'debt', 'done', '[11/06/2026 10:23 - nv224895] Tạo đơn\n[11/06/2026 10:23 - nv224895] NV nhận 2.640.000đ (Chuyển khoản) — NNT-1106-004\n[11/06/2026 10:23 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-11 10:23:47', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-11 03:23:09', NULL, NULL, NULL, NULL, 'install'),
(200, 'ORD-1106-006', 122, NULL, 1700000, 1700000, 1700000, NULL, NULL, 'debt', 'done', '[11/06/2026 13:53 - nv224895] Tạo đơn\n[11/06/2026 14:32 - nv224895] NV nhận 1.700.000đ (Chuyển khoản) — NNT-1106-005\n[11/06/2026 14:32 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-11 14:32:58', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-11 06:53:25', NULL, NULL, NULL, NULL, 'install'),
(201, 'ORD-1106-007', 123, NULL, 3750000, 3750000, 3750000, NULL, NULL, 'debt', 'done', '[11/06/2026 16:07 - nv224895] Tạo đơn\n[22/06/2026 08:47 - nv224895] Chuyển trạng thái → done\n[06/07/2026 14:52 - nv224895] NV nhận 3.750.000đ (Chuyển khoản) — NNT-0607-006\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-22 08:47:42', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-11 09:07:46', NULL, NULL, NULL, NULL, 'install'),
(202, 'ORD-1106-008', 124, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[11/06/2026 16:21 - admin] Tạo đơn\n[11/06/2026 16:21 - admin] Thêm hoa hồng nhân viên Như: 7.500đ\n[11/06/2026 16:24 - admin] Cập nhật thông tin đơn\n[12/06/2026 08:55 - nv409671] NV nhận 750.000đ (Chuyển khoản) — NNT-1206-001\n[12/06/2026 08:56 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-12 08:56:08', 0, 0, NULL, NULL, NULL, NULL, '50H48655', 'admin', 1, NULL, NULL, 0, '2026-06-11 09:21:50', NULL, NULL, NULL, NULL, 'install'),
(203, 'ORD-1206-001', 125, NULL, 849960, 849960, 849960, '2026-07-07 02:39:12', NULL, 'debt', 'done', '[12/06/2026 11:20 - admin] Tạo đơn\n[12/06/2026 14:32 - ktv885380] KTV hoàn thành đơn\n[12/06/2026 15:06 - ktv885380] Vị trí lắp accquy ( gác chân)\n', 'staff_owes', 0, 0, NULL, 'Bình Tân', 2, NULL, NULL, '2026-06-12 14:32:08', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-12 04:20:22', NULL, NULL, NULL, 12, 'install'),
(204, 'ORD-1206-002', 126, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[12/06/2026 11:27 - nv224895] Tạo đơn\n[12/06/2026 11:27 - nv224895] Cập nhật nội dung dòng công việc\n[23/06/2026 08:25 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-2306-001\n[23/06/2026 08:25 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-23 08:25:48', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-12 04:27:11', NULL, NULL, NULL, NULL, 'install'),
(205, 'ORD-1206-003', 22, NULL, 750000, 750000, 0, NULL, NULL, 'debt', 'done', '[12/06/2026 13:11 - nv224895] Tạo đơn\n[12/06/2026 14:40 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-12 14:40:23', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-12 06:11:00', NULL, NULL, NULL, NULL, 'install'),
(206, 'ORD-1206-004', 124, NULL, 0, 0, 0, NULL, NULL, 'debt', 'cancelled', '[12/06/2026 14:16 - admin] Tạo đơn\n[12/06/2026 14:18 - admin] Huỷ đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-12 07:16:03', NULL, NULL, NULL, NULL, 'warranty'),
(207, 'ORD-1206-005', 127, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[12/06/2026 15:34 - nv224895] Tạo đơn\n[12/06/2026 15:35 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-1206-003\n[12/06/2026 15:35 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-12 15:35:28', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-12 08:34:57', NULL, NULL, NULL, NULL, 'install'),
(208, 'ORD-1206-006', 42, NULL, 969600, 969600, 969600, NULL, NULL, 'debt', 'done', '[12/06/2026 15:38 - nv224895] Tạo đơn\n[12/06/2026 16:12 - nv224895] NV nhận 969.600đ (Chuyển khoản) — NNT-1206-004\n[12/06/2026 16:20 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-12 16:20:20', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-12 08:38:44', NULL, NULL, NULL, NULL, 'install'),
(209, 'ORD-1306-001', 128, NULL, 1700000, 1700000, 1700000, NULL, NULL, 'debt', 'done', '[13/06/2026 08:21 - nv224895] Tạo đơn\n[13/06/2026 09:08 - nv224895] NV nhận 1.700.000đ (Chuyển khoản) — NNT-1306-001\n[13/06/2026 09:08 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-13 09:08:06', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-13 01:21:50', NULL, NULL, NULL, NULL, 'install'),
(210, 'ORD-1306-002', 37, NULL, 52920000, 52920000, 52920000, NULL, NULL, 'debt', 'confirmed', '[13/06/2026 09:33 - admin] Tạo đơn\n[26/06/2026 09:29 - nv224895] NV nhận 52.920.000đ (Chuyển khoản) — NNT-2606-003\n', 'paid', 0, 0, NULL, '0934269691', NULL, NULL, NULL, NULL, 20000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-13 02:33:17', NULL, NULL, NULL, NULL, 'install'),
(211, 'ORD-1306-003', 58, NULL, 9072000, 9072000, 9072000, NULL, NULL, 'debt', 'done', '[13/06/2026 09:50 - admin] Tạo đơn\n[13/06/2026 09:50 - admin] Thêm hoa hồng nhân viên Phương Quyên: 20.000đ\n[13/06/2026 10:06 - nv224895] NV nhận 9.072.000đ (Chuyển khoản) — NNT-1306-002\n[13/06/2026 10:06 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-13 10:06:12', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-13 02:50:44', NULL, NULL, NULL, NULL, 'install'),
(212, 'ORD-1506-001', 129, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[15/06/2026 08:35 - nv224895] Tạo đơn\n[15/06/2026 08:35 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-1506-001\n[15/06/2026 08:35 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-15 08:35:38', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-15 01:35:04', NULL, NULL, NULL, NULL, 'install'),
(213, 'ORD-1506-002', 21, NULL, 750000, 750000, 0, '2026-07-07 02:39:12', NULL, 'debt', 'done', '[15/06/2026 08:37 - nv224895] Tạo đơn\n[15/06/2026 09:42 - nv224895] Cập nhật nội dung dòng công việc\n[16/06/2026 08:37 - ktv885380] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-06-16 08:37:52', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-15 01:37:24', 132, NULL, NULL, 12, 'install'),
(214, 'ORD-1506-003', 131, NULL, 750000, 750000, 0, '2026-07-07 02:39:12', NULL, 'debt', 'done', '[15/06/2026 08:38 - nv224895] Tạo đơn\n[16/06/2026 08:34 - ktv885380] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-06-16 08:34:24', 150000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-15 01:38:51', NULL, NULL, NULL, 12, 'install'),
(215, 'ORD-1506-004', 130, NULL, 1000000, 1000000, 0, NULL, NULL, 'debt', 'done', '[15/06/2026 08:44 - nv224895] Tạo đơn\n[15/06/2026 09:41 - nv224895] Cập nhật nội dung dòng công việc\n[15/06/2026 09:42 - nv224895] Cập nhật nội dung dòng công việc\n[15/06/2026 09:44 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-15 09:44:48', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-15 01:44:02', NULL, NULL, NULL, NULL, 'install'),
(216, 'ORD-1506-005', 42, NULL, 1393200, 1393200, 1393200, NULL, NULL, 'debt', 'done', '[15/06/2026 09:10 - nv224895] Tạo đơn\n[16/06/2026 08:43 - nv224895] NV nhận 1.393.200đ (Chuyển khoản) — NNT-1606-001\n[16/06/2026 10:48 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-16 10:48:00', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-15 02:10:51', NULL, NULL, NULL, NULL, 'install'),
(217, 'ORD-1506-006', 133, NULL, 500000, 500000, 500000, NULL, NULL, 'debt', 'done', '[15/06/2026 10:26 - nv224895] Tạo đơn\n[16/06/2026 08:59 - nv224895] Cập nhật nội dung dòng công việc\n[16/06/2026 09:00 - nv224895] NV nhận 500.000đ (Chuyển khoản) — NNT-1606-002\n[16/06/2026 09:00 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-16 09:00:19', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-15 03:26:07', NULL, NULL, NULL, NULL, 'install'),
(218, 'ORD-1506-007', 134, NULL, 748000, 748000, 0, NULL, NULL, 'debt', 'done', '[15/06/2026 10:51 - admin] Tạo đơn\n[15/06/2026 10:51 - admin] Cập nhật thông tin đơn\n[15/06/2026 10:52 - admin] Cập nhật nội dung dòng công việc\n[15/06/2026 10:55 - admin] Cập nhật nội dung dòng công việc\n[15/06/2026 11:08 - admin] Cập nhật nội dung dòng công việc\n[15/06/2026 11:08 - admin] Cập nhật nội dung dòng công việc\n[15/06/2026 11:52 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-15 11:52:09', 100000, 0, NULL, NULL, NULL, NULL, 'tk doanngocha\n0908010050', 'admin', 1, NULL, NULL, 0, '2026-06-15 03:51:02', NULL, NULL, NULL, NULL, 'install'),
(220, 'ORD-1506-008', 134, NULL, 748000, 748000, 0, '2026-07-07 02:39:12', NULL, 'debt', 'done', '[15/06/2026 11:10 - admin] Tạo đơn\n[15/06/2026 11:11 - admin] Cập nhật thông tin đơn\n[15/06/2026 14:10 - ktv885380] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-06-15 14:10:00', 100000, 0, NULL, NULL, NULL, NULL, '65/44 Tăng Nhơn Phú\n0385791058', 'admin', 1, NULL, NULL, 0, '2026-06-15 04:10:19', NULL, NULL, NULL, 12, 'install'),
(221, 'ORD-1506-009', 84, NULL, 3528000, 3528000, 3528000, NULL, NULL, 'debt', 'done', '[15/06/2026 11:17 - admin] Tạo đơn\n[16/06/2026 09:05 - nv409671] NV nhận 3.528.000đ (Chuyển khoản) — NNT-1606-003\n[16/06/2026 09:06 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-16 09:06:01', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-15 04:17:23', NULL, NULL, NULL, NULL, 'install'),
(222, 'ORD-1506-010', 135, NULL, 850000, 850000, 850000, NULL, NULL, 'debt', 'done', '[15/06/2026 13:22 - nv224895] Tạo đơn\n[15/06/2026 13:34 - nv224895] NV nhận 850.000đ (Chuyển khoản) — NNT-1506-005\n[15/06/2026 13:34 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-15 13:34:40', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-15 06:22:04', NULL, NULL, NULL, NULL, 'install'),
(223, 'ORD-1506-011', 49, NULL, 1728000, 1728000, 1728000, NULL, NULL, 'debt', 'done', '[15/06/2026 14:29 - admin] Tạo đơn\n[15/06/2026 18:18 - ktv157123] KTV hoàn thành đơn\n', 'staff_owes', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-15 18:18:18', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-15 07:29:35', NULL, NULL, NULL, NULL, 'install'),
(224, 'ORD-1506-012', 136, NULL, 972000, 972000, 972000, NULL, NULL, 'debt', 'done', '[15/06/2026 15:40 - nv224895] Tạo đơn\n[15/06/2026 18:12 - ktv157123] KTV hoàn thành đơn\n', 'staff_owes', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-15 18:12:08', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-15 08:40:34', NULL, NULL, NULL, NULL, 'install'),
(225, 'ORD-1506-013', 21, NULL, 800000, 800000, 0, '2026-07-07 02:39:12', NULL, 'debt', 'done', '[15/06/2026 17:35 - nv224895] Tạo đơn\n[16/06/2026 08:36 - ktv885380] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-06-16 08:36:43', 150000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-15 10:35:46', NULL, NULL, NULL, 12, 'install'),
(226, 'ORD-1606-001', 130, NULL, 2000000, 2000000, 2000000, '2026-07-07 02:39:12', NULL, 'debt', 'done', '[16/06/2026 09:06 - nv224895] Tạo đơn\n[16/06/2026 15:47 - ktv885380] KTV hoàn thành đơn\n', 'staff_owes', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-06-16 15:47:03', 200000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-16 02:06:36', NULL, NULL, NULL, 12, 'install'),
(227, 'ORD-1606-002', 61, NULL, 6642000, 6642000, 0, NULL, NULL, 'debt', 'done', '[16/06/2026 09:13 - nv224895] Tạo đơn\n[16/06/2026 10:48 - nv224895] Chuyển trạng thái → done\n', 'customer_owes', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-16 10:48:05', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-16 02:13:13', NULL, NULL, NULL, NULL, 'install'),
(228, 'ORD-1606-003', 137, NULL, 850000, 850000, 850000, NULL, NULL, 'debt', 'done', '[16/06/2026 09:57 - nv224895] Tạo đơn\n[16/06/2026 10:05 - nv224895] NV nhận 850.000đ (Chuyển khoản) — NNT-1606-004\n[16/06/2026 10:05 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-16 10:05:49', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-16 02:57:22', NULL, NULL, NULL, NULL, 'install'),
(229, 'ORD-1606-004', 21, NULL, 810000, 810000, 0, NULL, NULL, 'debt', 'done', '[16/06/2026 10:58 - nv224895] Tạo đơn\n[16/06/2026 11:32 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-16 11:32:53', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-16 03:58:06', NULL, NULL, NULL, NULL, 'install'),
(230, 'ORD-1606-005', 21, NULL, 810000, 810000, 0, NULL, NULL, 'debt', 'confirmed', '[16/06/2026 11:38 - nv224895] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, 8, NULL, NULL, NULL, 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-16 04:38:13', NULL, NULL, NULL, NULL, 'install'),
(231, 'ORD-1606-006', 58, NULL, 12150000, 12150000, 12150000, NULL, NULL, 'debt', 'done', '[16/06/2026 15:15 - admin] Tạo đơn\n[16/06/2026 15:47 - nv224895] NV nhận 12.150.000đ (Chuyển khoản) — NNT-1606-005\n[16/06/2026 15:48 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-16 15:48:02', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-16 08:15:22', NULL, NULL, NULL, NULL, 'install'),
(232, 'ORD-1606-007', 138, NULL, 0, 0, 0, NULL, NULL, 'debt', 'cancelled', '[16/06/2026 15:53 - admin] Tạo đơn\n[16/06/2026 15:55 - admin] Huỷ đơn\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-16 08:53:54', NULL, NULL, NULL, NULL, 'warranty'),
(233, 'ORD-1606-008', 58, NULL, 8538000, 8538000, 0, NULL, NULL, 'debt', 'in_progress', '[16/06/2026 16:00 - admin] Tạo đơn\n[17/06/2026 10:55 - admin] Chuyển trạng thái → in_progress\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-16 09:00:51', NULL, NULL, NULL, NULL, 'warranty'),
(235, 'ORD-1606-009', 139, NULL, 3780000, 3780000, 3780000, '2026-07-07 02:39:12', NULL, 'debt', 'done', '[16/06/2026 16:09 - admin] Tạo đơn\n[17/06/2026 15:43 - ktv885380] KTV hoàn thành đơn\n[18/06/2026 11:02 - admin] Thêm hoa hồng nhân viên Trần Quốc Viện: 300.000đ\n[22/06/2026 14:13 - nv409671] NV nhận 3.780.000đ (Chuyển khoản) — NNT-2206-002\n', 'paid', 0, 0, NULL, '117 âu Cơ, Phường Tân Phú, Thành phố Hồ Chí Minh, Việt Nam', 2, NULL, NULL, '2026-06-17 15:43:41', 300000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-16 09:09:14', NULL, NULL, NULL, 12, 'install'),
(236, 'ORD-1606-010', 139, NULL, 3900000, 3900000, 0, NULL, NULL, 'debt', 'cancelled', '[16/06/2026 17:11 - admin] Tạo đơn\n[16/06/2026 17:11 - admin] Cập nhật nội dung dòng công việc\n[16/06/2026 17:12 - admin] Huỷ đơn\n', 'unpaid', 0, 0, NULL, '117 âu Cơ, Phường Tân Phú, Thành phố Hồ Chí Minh, Việt Nam', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-16 10:11:11', NULL, NULL, NULL, NULL, 'warranty'),
(237, 'ORD-1706-001', 61, NULL, 4428000, 4428000, 0, NULL, NULL, 'debt', 'done', '[17/06/2026 09:28 - nv224895] Tạo đơn\n[18/06/2026 09:01 - nv224895] Chuyển trạng thái → done\n', 'customer_owes', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-18 09:01:21', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-17 02:28:11', NULL, NULL, NULL, NULL, 'install'),
(238, 'ORD-1706-002', 141, NULL, 6930000, 6930000, 6930000, NULL, NULL, 'debt', 'confirmed', '[17/06/2026 11:13 - admin] Tạo đơn\n[24/06/2026 09:24 - nv224895] NV nhận 6.930.000đ (Chuyển khoản) — NNT-2406-003\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-17 04:13:04', NULL, NULL, NULL, NULL, 'install'),
(239, 'ORD-1706-003', 142, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[17/06/2026 13:17 - nv224895] Tạo đơn\n[17/06/2026 13:26 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-1706-001\n[17/06/2026 13:26 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-17 13:26:47', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-17 06:17:05', NULL, NULL, NULL, NULL, 'install'),
(240, 'ORD-1706-004', 143, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[17/06/2026 13:36 - nv224895] Tạo đơn\n[17/06/2026 13:39 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-1706-002\n[17/06/2026 13:39 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-17 13:39:36', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-17 06:36:04', NULL, NULL, NULL, NULL, 'install'),
(241, 'ORD-1706-005', 21, NULL, 750000, 750000, 0, NULL, NULL, 'debt', 'done', '[17/06/2026 14:20 - nv224895] Tạo đơn\n[17/06/2026 17:19 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-17 17:19:59', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-17 07:20:10', NULL, NULL, NULL, NULL, 'install'),
(242, 'ORD-1806-001', 37, NULL, 4590000, 4590000, 4590000, NULL, NULL, 'debt', 'done', '[18/06/2026 09:54 - nv224895] Tạo đơn\n[19/06/2026 13:32 - nv224895] NV nhận 4.590.000đ (Tiền mặt) — NNT-1906-003\n[19/06/2026 13:32 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, '0934269691', NULL, NULL, NULL, '2026-06-19 13:32:51', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-18 02:54:06', NULL, NULL, NULL, NULL, 'install'),
(243, 'ORD-1806-002', 144, NULL, 972000, 972000, 0, '2026-07-07 02:39:12', NULL, 'debt', 'done', '[18/06/2026 10:15 - nv409671] Tạo đơn\n[18/06/2026 13:19 - ktv885380] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, 'Số 3, đường 16A, KCN Biên Hòa II, Phường Trấn Biên, Tỉnh Đồng Nai, Việt Nam', 2, NULL, NULL, '2026-06-18 13:19:22', 150000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-18 03:15:26', NULL, NULL, NULL, 12, 'install'),
(244, 'ORD-1806-003', 145, NULL, 9072000, 9072000, 0, NULL, NULL, 'debt', 'confirmed', '[18/06/2026 15:37 - nv409671] Tạo đơn\n', 'unpaid', 0, 0, NULL, 'Số 20 Lê Quý Đôn, Xã Lao Bảo, Tỉnh Quảng Trị, Việt Nam', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-18 08:37:35', NULL, NULL, NULL, NULL, 'install'),
(245, 'ORD-1806-004', 36, NULL, 2764000, 2764000, 2764000, NULL, NULL, 'debt', 'done', '[18/06/2026 16:11 - nv224895] Tạo đơn\n[18/06/2026 16:19 - nv224895] Cập nhật dòng công việc\n[18/06/2026 16:31 - nv224895] NV nhận 2.764.000đ (Chuyển khoản) — NNT-1806-001\n[18/06/2026 16:31 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-18 16:31:18', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-18 09:11:52', NULL, NULL, NULL, NULL, 'install'),
(246, 'ORD-1906-001', 146, NULL, 850000, 850000, 850000, NULL, NULL, 'debt', 'done', '[19/06/2026 08:29 - nv224895] Tạo đơn\n[19/06/2026 08:29 - nv224895] NV nhận 850.000đ (Chuyển khoản) — NNT-1906-001\n[19/06/2026 08:29 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-19 08:29:56', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-19 01:29:29', NULL, NULL, NULL, NULL, 'install'),
(247, 'ORD-1906-002', 147, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[19/06/2026 09:32 - nv224895] Tạo đơn\n[19/06/2026 09:33 - nv224895] Cập nhật thông tin đơn (ghi chú)\n[26/06/2026 15:21 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-2606-005\n[26/06/2026 15:22 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-26 15:22:00', 0, 0, NULL, NULL, NULL, NULL, 'Hạn mới 04/07/2027', 'admin', 3, NULL, NULL, 0, '2026-06-19 02:32:07', NULL, NULL, NULL, NULL, 'install'),
(248, 'ORD-1906-003', 148, NULL, 600000, 600000, 600000, '2026-07-05 21:46:12', NULL, 'debt', 'done', '[19/06/2026 09:47 - nv409671] Tạo đơn\n[19/06/2026 09:50 - nv409671] Cập nhật dòng công việc (thêm: Dịch vụ phần mềm quản lý giám sát phương tiện 12 tháng ( gói ô tô) x1; bỏ: Dịch vụ phần mềm quản lý giám sát phương tiện 06 tháng ( gói ô tô) x1)\n[22/06/2026 08:38 - nv409671] Chuyển trạng thái → done\n[05/07/2026 21:46 - admin] Thu qua phiếu YC-0507-001 (HD-0507-001) 600.000đ [Tiền mặt]\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-22 08:38:51', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-19 02:47:05', NULL, NULL, NULL, NULL, 'install'),
(249, 'ORD-1906-004', 149, NULL, 3000000, 3000000, 3000000, NULL, NULL, 'debt', 'done', '[19/06/2026 14:22 - nv224895] Tạo đơn\n[19/06/2026 15:08 - nv224895] NV nhận 3.000.000đ (Chuyển khoản) — NNT-1906-004\n[19/06/2026 15:08 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-19 15:08:41', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-19 07:22:32', NULL, NULL, NULL, NULL, 'install'),
(250, 'ORD-1906-005', 61, NULL, 25020000, 25020000, 0, NULL, NULL, 'debt', 'confirmed', '[19/06/2026 17:39 - nv224895] Tạo đơn\n[24/06/2026 09:49 - nv224895] Cập nhật dòng công việc (thêm: Cảm biến mức dầu Model: LIGOBLE-PRO-RS232L7 x5)\n[24/06/2026 09:51 - nv224895] Cập nhật dòng công việc (thêm: Sim Viettel IP x3; bỏ: Sim Viettel IP x2)\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-19 10:39:15', NULL, NULL, NULL, NULL, 'install'),
(251, 'ORD-2006-001', 21, NULL, 4320000, 4320000, 0, NULL, NULL, 'debt', 'confirmed', '[20/06/2026 09:19 - nv224895] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-20 02:19:00', NULL, NULL, NULL, NULL, 'install'),
(252, 'ORD-2006-002', 33, NULL, 1400000, 1400000, 1400000, NULL, NULL, 'debt', 'done', '[20/06/2026 10:29 - nv224895] Tạo đơn\n[22/06/2026 08:22 - nv224895] NV nhận 1.400.000đ (Chuyển khoản) — NNT-2206-001\n[22/06/2026 08:22 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-22 08:22:13', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-20 03:29:55', NULL, NULL, NULL, NULL, 'install'),
(253, 'ORD-2006-003', 36, NULL, 4596000, 4596000, 4596000, NULL, NULL, 'debt', 'done', '[20/06/2026 10:32 - nv224895] Tạo đơn\n[20/06/2026 11:31 - nv224895] NV nhận 4.596.000đ (Chuyển khoản) — NNT-2006-001\n[20/06/2026 11:31 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-20 11:31:11', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-20 03:32:14', NULL, NULL, NULL, NULL, 'install'),
(254, 'ORD-2206-001', 36, NULL, 5118000, 5118000, 5118000, NULL, NULL, 'debt', 'done', '[22/06/2026 09:16 - nv224895] Tạo đơn\n[22/06/2026 09:17 - nv224895] Cập nhật dòng công việc (thêm: Sim Mobi 30IP x4; bỏ: Sim Mobi 30IP x2)\n[22/06/2026 09:29 - nv224895] Cập nhật dòng công việc (thêm: Thẻ nhớ Dahua 64GB cho Camera x2; bỏ: Thẻ nhớ Dahua 64GB cho Camera x1)\n[22/06/2026 11:11 - nv224895] Cập nhật dòng công việc (thêm: Camera quan sát lắp trong cabin ô tô GT-AHD806 x1)\n[22/06/2026 13:54 - nv224895] Cập nhật dòng công việc (thêm: Thiết bị giảm sát hành trình và ghi nhận hình ảnh người lài xe GT-MDVR02 live x1; bỏ: Thiết bị giảm sát hành trình và ghi nhận hình ảnh người lài xe GT-MDVR02 live x2)\n[22/06/2026 14:59 - nv224895] NV nhận 5.118.000đ (Chuyển khoản) — NNT-2206-004\n[22/06/2026 14:59 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-22 14:59:18', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-22 02:16:12', NULL, NULL, NULL, NULL, 'install'),
(255, 'ORD-2206-002', 150, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[22/06/2026 10:49 - nv224895] Tạo đơn\n[29/06/2026 09:23 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-2906-002\n[29/06/2026 09:23 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-29 09:23:09', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-22 03:49:21', NULL, NULL, NULL, NULL, 'install'),
(256, 'ORD-2206-003', 58, NULL, 8802000, 8802000, 8802000, NULL, NULL, 'debt', 'done', '[22/06/2026 14:23 - nv409671] Tạo đơn\n[22/06/2026 14:28 - nv409671] Cập nhật dòng công việc (bỏ: Đầu đọc thẻ thông tin lái xe RFID x5)\n[22/06/2026 14:37 - nv409671] NV nhận 8.802.000đ (Chuyển khoản) — NNT-2206-003\n[22/06/2026 14:37 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-22 14:37:55', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-22 07:23:08', NULL, NULL, NULL, NULL, 'install'),
(257, 'ORD-2306-001', 84, NULL, 2912000, 2912000, 2912000, NULL, NULL, 'debt', 'done', '[23/06/2026 08:47 - admin] Tạo đơn\n[24/06/2026 08:53 - nv409671] NV nhận 2.912.000đ (Chuyển khoản) — NNT-2406-001\n[24/06/2026 08:53 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-24 08:53:38', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-23 01:47:29', NULL, NULL, NULL, NULL, 'install'),
(258, 'ORD-2306-002', 45, NULL, 480000, 480000, 480000, NULL, NULL, 'debt', 'done', '[23/06/2026 08:49 - nv224895] Tạo đơn\n[23/06/2026 08:49 - nv224895] NV nhận 480.000đ (Chuyển khoản) — NNT-2306-002\n[23/06/2026 08:49 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-23 08:49:21', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-23 01:49:04', NULL, NULL, NULL, NULL, 'install'),
(259, 'ORD-2306-003', 27, NULL, 89262000, 89262000, 0, NULL, NULL, 'debt', 'cancelled', '[23/06/2026 09:48 - nv224895] Tạo đơn\n[23/06/2026 09:49 - nv224895] Cập nhật dòng công việc (thêm: Thiết bị giảm sát hành trình và ghi nhận hình ảnh người lài xe GT-MDVR02 live x15; bỏ: Thiết bị giảm sát hành trình và ghi nhận hình ảnh người lài xe GT-MDVR02 live x5)\n[23/06/2026 09:49 - nv224895] Cập nhật thông tin đơn (ghi chú)\n[23/06/2026 10:20 - nv224895] Huỷ đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, 'báo giá trên bao gồm VAT 8%', 'admin', 3, NULL, NULL, 0, '2026-06-23 02:48:35', NULL, NULL, NULL, NULL, 'install'),
(260, 'ORD-2306-004', 27, NULL, 96390000, 96390000, 96390000, NULL, NULL, 'debt', 'done', '[23/06/2026 10:22 - nv224895] Tạo đơn\n[23/06/2026 10:22 - nv224895] Cập nhật thông tin đơn (ghi chú)\n[23/06/2026 11:00 - nv224895] Cập nhật dòng công việc (bỏ: Thiết bị giảm sát hành trình và ghi nhận hình ảnh người lài xe GT-MDVR02 Chụp ảnh x5, Camera GT-AHD805 cam đơn có mic, có hồng ngoại x5)\n[23/06/2026 14:58 - nv224895] NV nhận 96.390.000đ (Chuyển khoản) — NNT-2306-004\n[24/06/2026 08:50 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-24 08:50:26', 0, 0, NULL, NULL, NULL, NULL, 'báo giá trên bao gồm VAT 8%', 'admin', 3, NULL, NULL, 0, '2026-06-23 03:22:44', NULL, NULL, NULL, NULL, 'install'),
(261, 'ORD-2306-005', 151, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[23/06/2026 10:27 - nv224895] Tạo đơn\n[23/06/2026 11:39 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-2306-003\n[23/06/2026 11:39 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-23 11:39:08', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-23 03:27:12', NULL, NULL, NULL, NULL, 'install'),
(262, 'ORD-2406-001', 37, NULL, 8000000, 8000000, 8000000, NULL, NULL, 'debt', 'done', '[24/06/2026 09:33 - nv224895] Tạo đơn\n[26/06/2026 09:07 - nv224895] NV nhận 8.000.000đ (Chuyển khoản) — NNT-2606-002\n[26/06/2026 09:07 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, '0934269691', NULL, NULL, NULL, '2026-06-26 09:07:50', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-24 02:33:25', NULL, NULL, NULL, NULL, 'install'),
(263, 'ORD-2406-002', 25, NULL, 5300000, 5300000, 5300000, NULL, NULL, 'debt', 'done', '[24/06/2026 15:10 - nv224895] Tạo đơn\n[24/06/2026 15:10 - nv224895] NV nhận 5.300.000đ (Chuyển khoản) — NNT-2406-005\n[24/06/2026 15:10 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-24 15:10:56', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-24 08:10:17', NULL, NULL, NULL, NULL, 'install'),
(264, 'ORD-2406-003', 152, NULL, 2550000, 2550000, 0, NULL, NULL, 'debt', 'confirmed', '[24/06/2026 17:00 - nv224895] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-24 10:00:25', NULL, NULL, NULL, NULL, 'install'),
(265, 'ORD-2406-004', 21, NULL, 810000, 810000, 0, NULL, NULL, 'debt', 'done', '[24/06/2026 17:02 - nv224895] Tạo đơn\n[25/06/2026 09:07 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-25 09:07:46', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-24 10:02:39', NULL, NULL, NULL, NULL, 'install'),
(266, 'ORD-2506-001', 37, NULL, 52920000, 52920000, 52920000, NULL, NULL, 'debt', 'confirmed', '[25/06/2026 09:15 - nv224895] Tạo đơn\n[08/07/2026 14:49 - nv224895] NV nhận 52.920.000đ (Chuyển khoản) — NNT-0807-004\n', 'paid', 0, 0, NULL, '0934269691', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-25 02:15:42', NULL, NULL, NULL, NULL, 'install'),
(267, 'ORD-2506-002', 153, NULL, 972000, 972000, 972000, NULL, NULL, 'debt', 'done', '[25/06/2026 15:13 - nv224895] Tạo đơn\n[25/06/2026 15:13 - nv224895] NV nhận 972.000đ (Chuyển khoản) — NNT-2506-001\n[25/06/2026 16:29 - ktv157123] KTV hoàn thành đơn\n', 'paid', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-25 16:29:01', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-25 08:13:25', NULL, NULL, NULL, NULL, 'install'),
(268, 'ORD-2506-003', 154, NULL, 4520000, 4520000, 4520000, NULL, NULL, 'debt', 'done', '[25/06/2026 15:48 - nv224895] Tạo đơn\n[27/06/2026 13:10 - ktv157123] KTV hoàn thành đơn\n[29/06/2026 08:42 - nv224895] NV nhận 4.520.000đ (Chuyển khoản) — NNT-2906-001\n', 'paid', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-06-27 13:10:24', 600000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-25 08:48:28', NULL, NULL, NULL, NULL, 'install'),
(269, 'ORD-2606-001', 155, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[26/06/2026 08:48 - nv224895] Tạo đơn\n[26/06/2026 09:00 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-2606-001\n[26/06/2026 09:00 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-26 09:00:07', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-26 01:48:17', NULL, NULL, NULL, NULL, 'install'),
(270, 'ORD-2606-002', 49, NULL, 4860000, 4860000, 4860000, NULL, NULL, 'debt', 'done', '[26/06/2026 10:49 - nv224895] Tạo đơn\n[26/06/2026 10:53 - nv224895] Cập nhật dòng công việc\n[27/06/2026 10:21 - nv224895] NV nhận 4.860.000đ (Chuyển khoản) — NNT-2706-004\n[27/06/2026 10:21 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-27 10:21:02', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-26 03:49:48', NULL, NULL, NULL, NULL, 'install'),
(271, 'ORD-2606-003', 58, NULL, 2160000, 2160000, 2160000, NULL, NULL, 'debt', 'done', '[26/06/2026 14:31 - nv224895] Tạo đơn\n[26/06/2026 14:44 - nv224895] NV nhận 2.160.000đ (Chuyển khoản) — NNT-2606-004\n[26/06/2026 14:44 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-26 14:44:38', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-26 07:31:43', NULL, NULL, NULL, NULL, 'install'),
(272, 'ORD-2606-004', 37, NULL, 7500000, 7500000, 7500000, NULL, NULL, 'debt', 'done', '[26/06/2026 16:04 - nv224895] Tạo đơn\n[26/06/2026 16:04 - nv224895] NV nhận 7.500.000đ (Chuyển khoản) — NNT-2606-006\n[26/06/2026 16:04 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, '0934269691', NULL, NULL, NULL, '2026-06-26 16:04:46', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-26 09:04:08', NULL, NULL, NULL, NULL, 'install'),
(273, 'ORD-2706-001', 157, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[27/06/2026 08:25 - nv224895] Tạo đơn\n[27/06/2026 08:26 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-2706-001\n[27/06/2026 08:26 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-27 08:26:22', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-27 01:25:04', NULL, NULL, NULL, NULL, 'install'),
(274, 'ORD-2706-002', 158, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[27/06/2026 08:27 - nv224895] Tạo đơn\n[27/06/2026 08:49 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-2706-002\n[27/06/2026 08:49 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-27 08:49:57', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-27 01:27:30', NULL, NULL, NULL, NULL, 'install'),
(275, 'ORD-2706-003', 61, NULL, 4860000, 4860000, 0, NULL, NULL, 'debt', 'confirmed', '[27/06/2026 08:36 - nv224895] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-27 01:36:34', NULL, NULL, NULL, NULL, 'install'),
(276, 'ORD-2706-004', 159, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[27/06/2026 09:16 - nv224895] Tạo đơn\n[27/06/2026 09:16 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-2706-003\n[27/06/2026 09:16 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-27 09:16:30', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-27 02:16:04', NULL, NULL, NULL, NULL, 'install'),
(277, 'ORD-2706-005', 49, NULL, 3348000, 3348000, 3348000, NULL, NULL, 'debt', 'confirmed', '[27/06/2026 11:00 - nv224895] Tạo đơn\n[29/06/2026 10:40 - nv224895] Cập nhật dòng công việc (thêm: Thiết bị giám sát hành trình INET03 x5)\n[03/07/2026 10:01 - admin] Cập nhật dòng công việc (thêm: Thiết bị giảm sát hành trình và ghi nhận hình ảnh người lài xe GT-MDVR02 live x1, Thẻ nhớ Dahua 64GB cho Camera x1; bỏ: Thiết bị giảm sát hành trình và ghi nhận hình ảnh người lài xe GT-MDVR02 live x6, Thẻ nhớ Dahua 64GB cho Camera x6, Thiết bị giám sát hành trình INET03 x5)\n[03/07/2026 14:52 - admin] Ghi nhận thu 3.348.000đ (Tiền mặt)\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-27 04:00:21', NULL, NULL, NULL, NULL, 'install'),
(278, 'ORD-2906-001', 24, NULL, 7668000, 7668000, 0, NULL, NULL, 'debt', 'done', '[29/06/2026 08:55 - nv224895] Tạo đơn\n[01/07/2026 17:27 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-07-01 17:27:33', 600000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-29 01:55:02', NULL, NULL, NULL, NULL, 'install'),
(279, 'ORD-2906-002', 95, NULL, 4000000, 4000000, 4000000, NULL, NULL, 'debt', 'done', '[29/06/2026 10:19 - nv224895] Tạo đơn\n[29/06/2026 17:14 - nv224895] NV nhận 4.000.000đ (Chuyển khoản) — NNT-2906-003\n[29/06/2026 17:14 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-29 17:14:12', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-29 03:19:45', NULL, NULL, NULL, NULL, 'install'),
(280, 'ORD-2906-003', 160, NULL, 972000, 972000, 0, '2026-07-06 22:11:19', NULL, 'debt', 'done', '[29/06/2026 15:00 - admin] Tạo đơn\n[06/07/2026 12:26 - ktv885380] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-07-06 12:26:19', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-29 08:00:31', NULL, NULL, NULL, NULL, 'install'),
(281, 'ORD-2906-004', 58, NULL, 12825000, 12825000, 0, NULL, NULL, 'debt', 'confirmed', '[29/06/2026 16:41 - nv224895] Tạo đơn\n[29/06/2026 16:45 - nv224895] Cập nhật dòng công việc (bỏ: Đầu đọc thẻ thông tin lái xe RFID x5)\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-29 09:41:49', NULL, NULL, NULL, NULL, 'install'),
(282, 'ORD-3006-001', 161, NULL, 770000, 770000, 770000, NULL, NULL, 'debt', 'done', '[30/06/2026 10:30 - nv224895] Tạo đơn\n[30/06/2026 10:31 - nv224895] NV nhận 770.000đ (Chuyển khoản) — NNT-3006-001\n[30/06/2026 10:43 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-06-30 10:43:22', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-30 03:30:56', NULL, NULL, NULL, NULL, 'install'),
(283, 'ORD-3006-002', 102, NULL, 3443000, 3443000, 3443000, NULL, NULL, 'debt', 'confirmed', '[30/06/2026 11:05 - admin] Tạo đơn\n[07/07/2026 15:19 - admin] Ghi nhận thu 3.443.000đ (Tiền mặt)\n', 'paid', 0, 0, NULL, '158/11/24 Đường Bà Hạt, Phường Vườn Lài, TP Hồ Chí Minh, Việt Nam', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-30 04:05:33', NULL, NULL, NULL, NULL, 'install'),
(285, 'ORD-3006-003', 162, NULL, 850000, 850000, 850000, '2026-07-07 02:39:12', NULL, 'debt', 'done', '[30/06/2026 13:33 - nv224895] Tạo đơn\n[30/06/2026 16:42 - ktv885380] KTV hoàn thành đơn\n', 'staff_owes', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-06-30 16:42:03', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-30 06:33:48', NULL, NULL, NULL, 12, 'install'),
(286, 'ORD-3006-004', 84, NULL, 2198000, 2198000, 0, NULL, NULL, 'debt', 'confirmed', '[30/06/2026 14:00 - admin] Tạo đơn\n[30/06/2026 14:01 - admin] Cập nhật dòng công việc (thêm: SIM ITEL x3)\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-06-30 07:00:30', NULL, NULL, NULL, NULL, 'install'),
(287, 'ORD-3006-005', 163, NULL, 5500000, 5500000, 5500000, NULL, NULL, 'debt', 'done', '[30/06/2026 14:02 - nv409671] Tạo đơn\n[01/07/2026 11:32 - nv409671] NV nhận 5.500.000đ (Chuyển khoản) — NNT-0107-001\n[01/07/2026 11:32 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, '35B Đường 12B, Cư Xá Ngân Hàng, Phường Tân Thuận, Thành phố Hồ Chí Minh, Việt Nam', NULL, NULL, NULL, '2026-07-01 11:32:29', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-06-30 07:02:48', NULL, NULL, NULL, NULL, 'install'),
(288, 'ORD-3006-006', 164, NULL, 600000, 600000, 0, NULL, NULL, 'debt', 'confirmed', '[30/06/2026 17:19 - nv224895] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-06-30 10:19:17', NULL, NULL, NULL, NULL, 'install');
INSERT INTO `orders` (`id`, `code`, `customer_id`, `dealer_id`, `total_amount`, `subtotal`, `paid_amount`, `debt_carried_at`, `debt_settlement_id`, `payment_method`, `status`, `progress_note`, `payment_status`, `collected_for_dealer`, `has_return`, `seen_at`, `address`, `assigned_staff_id`, `due_at`, `started_at`, `completed_at`, `wage_amount`, `tech_commission_amount`, `tech_commission_approved_at`, `tech_commission_approved_by`, `tech_commission_note`, `ktv_note`, `note`, `creator_type`, `creator_id`, `confirmed_at`, `confirmed_by`, `is_deleted`, `created_at`, `end_customer_id`, `tech_commission_requested_by`, `tech_commission_requested_at`, `payslip_id`, `service_kind`) VALUES
(289, 'ORD-0107-001', 61, NULL, 2916000, 2916000, 0, NULL, NULL, 'debt', 'confirmed', '[01/07/2026 09:22 - nv224895] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-01 02:22:43', NULL, NULL, NULL, NULL, 'install'),
(290, 'ORD-0107-002', 21, NULL, 810000, 810000, 0, '2026-07-07 02:39:12', NULL, 'debt', 'done', '[01/07/2026 11:40 - nv224895] Tạo đơn\n[06/07/2026 12:22 - ktv885380] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-07-06 12:22:08', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-01 04:40:38', NULL, NULL, NULL, 12, 'install'),
(292, 'ORD-0107-003', 165, NULL, 850000, 850000, 850000, NULL, NULL, 'debt', 'done', '[01/07/2026 11:42 - nv224895] Tạo đơn\n[01/07/2026 11:42 - nv224895] NV nhận 850.000đ (Chuyển khoản) — NNT-0107-002\n[01/07/2026 17:26 - ktv157123] KTV hoàn thành đơn\n', 'paid', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-07-01 17:26:20', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-01 04:42:18', NULL, NULL, NULL, NULL, 'install'),
(293, 'ORD-0107-004', 36, NULL, 13000000, 13000000, 13000000, NULL, NULL, 'debt', 'done', '[01/07/2026 11:44 - nv224895] Tạo đơn\n[01/07/2026 11:45 - nv224895] NV nhận 13.000.000đ (Chuyển khoản) — NNT-0107-003\n[01/07/2026 11:45 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-07-01 11:45:14', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-01 04:44:30', NULL, NULL, NULL, NULL, 'install'),
(294, 'ORD-0107-005', 77, NULL, 19046400, 19046400, 0, NULL, NULL, 'debt', 'confirmed', '[01/07/2026 17:11 - nv224895] Tạo đơn\n[01/07/2026 17:12 - nv224895] Cập nhật dòng công việc\n[01/07/2026 17:13 - nv224895] Cập nhật dòng công việc (thêm: Thiết bị giám sát hành trình GT-S8 x6; bỏ: Thiết bị giám sát hành trình GT-S8 x1)\n[02/07/2026 10:32 - nv224895] Cập nhật dòng công việc (thêm: Thiết bị giảm sát hành trình và ghi nhận hình ảnh người lài xe GT-MDVR02 live x4, Camera quan sát lắp trong cabin ô tô GT-AHD806 x4, Thẻ nhớ Dahua 64GB cho Camera x4, Sim Viettel IP x4; bỏ: Thiết bị giảm sát hành trình và ghi nhận hình ảnh người lài xe GT-MDVR02 live x3, Camera quan sát lắp trong cabin ô tô GT-AHD806 x3, Thẻ nhớ Dahua 64GB cho Camera x3, Sim Viettel IP x3)\n', 'unpaid', 0, 0, NULL, '34 Trần Thị Tâm, Khu phố 1, Phường Quảng Trị, Tỉnh Quảng Trị, Việt Nam', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-01 10:11:23', NULL, NULL, NULL, NULL, 'install'),
(295, 'ORD-0107-006', 166, NULL, 23000000, 23000000, 23000000, NULL, NULL, 'debt', 'done', '[01/07/2026 17:18 - nv409671] Tạo đơn\n[01/07/2026 17:18 - nv409671] NV nhận 23.000.000đ (Chuyển khoản) — NNT-0107-004\n[01/07/2026 17:19 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, 'Số 36 đường Thới An 14, Khu phố 17, P.Thới An, TP Hồ Chí Minh', NULL, NULL, NULL, '2026-07-01 17:19:05', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-07-01 10:18:01', NULL, NULL, NULL, NULL, 'install'),
(296, 'ORD-0207-001', 167, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[02/07/2026 08:32 - nv224895] Tạo đơn\n[02/07/2026 08:33 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-0207-001\n[02/07/2026 08:33 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-07-02 08:33:22', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-02 01:32:06', NULL, NULL, NULL, NULL, 'install'),
(297, 'ORD-0207-002', 168, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[02/07/2026 08:34 - nv224895] Tạo đơn\n[02/07/2026 08:34 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-0207-002\n[02/07/2026 08:34 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-07-02 08:34:44', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-02 01:34:07', NULL, NULL, NULL, NULL, 'install'),
(298, 'ORD-0207-003', 28, NULL, 6536000, 6536000, 6536000, NULL, NULL, 'debt', 'done', '[02/07/2026 08:47 - nv224895] Tạo đơn\n[02/07/2026 08:50 - nv224895] NV nhận 6.536.000đ (Chuyển khoản) — NNT-0207-003\n[02/07/2026 13:00 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-07-02 13:00:33', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-02 01:47:58', NULL, NULL, NULL, NULL, 'install'),
(299, 'ORD-0207-004', 58, NULL, 20988000, 20988000, 0, NULL, NULL, 'debt', 'cancelled', '[02/07/2026 14:52 - nv224895] Tạo đơn\n[02/07/2026 14:54 - nv224895] Huỷ đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-02 07:52:02', NULL, NULL, NULL, NULL, 'install'),
(300, 'ORD-0207-005', 77, NULL, 22668000, 22668000, 0, NULL, NULL, 'debt', 'confirmed', '[02/07/2026 14:56 - nv224895] Tạo đơn\n', 'unpaid', 0, 0, NULL, '34 Trần Thị Tâm, Khu phố 1, Phường Quảng Trị, Tỉnh Quảng Trị, Việt Nam', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-02 07:56:03', NULL, NULL, NULL, NULL, 'install'),
(301, 'ORD-0207-006', 62, NULL, 4536000, 4536000, 4536000, NULL, NULL, 'debt', 'done', '[02/07/2026 15:28 - nv224895] Tạo đơn\n[02/07/2026 18:34 - ktv157123] KTV hoàn thành đơn\n[03/07/2026 10:09 - nv224895] NV nhận 4.536.000đ (Chuyển khoản) — NNT-0307-002\n', 'paid', 0, 0, NULL, '59/29 Nguyễn Sơn, Phường Phú Thạnh, TP Hồ Chí Minh, Việt Nam', 8, NULL, NULL, '2026-07-02 18:34:25', 150000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-02 08:28:52', NULL, NULL, NULL, NULL, 'install'),
(302, 'ORD-0207-007', 169, NULL, 1200000, 1200000, 1200000, NULL, NULL, 'debt', 'done', '[02/07/2026 16:03 - nv224895] Tạo đơn\n[02/07/2026 16:29 - nv224895] NV nhận 1.200.000đ (Chuyển khoản) — NNT-0207-004\n[02/07/2026 16:29 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-07-02 16:29:55', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-02 09:03:05', NULL, NULL, NULL, NULL, 'install'),
(303, 'ORD-0307-001', 49, NULL, 5600000, 5600000, 5600000, NULL, NULL, 'debt', 'done', '[03/07/2026 09:18 - admin] Tạo đơn\n[03/07/2026 14:34 - admin] Cập nhật dòng công việc (thêm: Thiết bị giám sát hành trình INET03 x3, SIM ITEL x4; bỏ: Thiết bị giám sát hành trình INET03 x2, SIM ITEL x3)\n[10/07/2026 11:26 - admin] Ghi nhận thu 5.600.000đ (Tiền mặt)\n[10/07/2026 11:26 - admin] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-07-10 11:26:27', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-07-03 02:18:11', NULL, NULL, NULL, NULL, 'install'),
(304, 'ORD-0307-002', 170, NULL, 3152000, 3152000, 3152000, NULL, NULL, 'debt', 'confirmed', '[03/07/2026 09:30 - admin] Tạo đơn\n[03/07/2026 14:51 - admin] Ghi nhận thu 3.152.000đ (Tiền mặt)\n', 'paid', 0, 0, NULL, '35B Đường 12B, Cư Xá Ngân Hàng, Phường Tân Thuận, Thành phố Hồ Chí Minh, Vietnam', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-07-03 02:30:29', NULL, NULL, NULL, NULL, 'install'),
(305, 'ORD-0307-003', 171, NULL, 3888000, 3888000, 3888000, NULL, NULL, 'debt', 'done', '[03/07/2026 09:52 - nv224895] Tạo đơn\n[03/07/2026 10:01 - nv224895] NV nhận 3.888.000đ (Chuyển khoản) — NNT-0307-001\n[03/07/2026 10:01 - ktv157123] KTV hoàn thành đơn\n', 'paid', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-07-03 10:01:39', 200000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-03 02:52:23', NULL, NULL, NULL, NULL, 'install'),
(306, 'ORD-0307-004', 172, NULL, 5400000, 5400000, 5400000, NULL, NULL, 'debt', 'done', '[03/07/2026 10:25 - nv409671] Tạo đơn\n[03/07/2026 13:48 - nv409671] NV nhận 5.400.000đ (Chuyển khoản) — NNT-0307-003\n[03/07/2026 13:48 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, '151/67/49D Liên Khu 4-5, Khu phố 5, Phường Bình Tân, TP Hồ Chí Minh, Việt Nam', NULL, NULL, NULL, '2026-07-03 13:48:41', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-07-03 03:25:12', NULL, NULL, NULL, NULL, 'install'),
(307, 'ORD-0307-005', 61, NULL, 3996000, 3996000, 0, NULL, NULL, 'debt', 'confirmed', '[03/07/2026 11:04 - nv224895] Tạo đơn\n[03/07/2026 13:48 - nv224895] Cập nhật dòng công việc\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-03 04:04:02', NULL, NULL, NULL, NULL, 'install'),
(308, 'ORD-0307-006', 36, NULL, 7002000, 7002000, 0, NULL, NULL, 'debt', 'confirmed', '[03/07/2026 14:47 - nv224895] Tạo đơn\n[06/07/2026 09:52 - nv224895] Cập nhật dòng công việc (thêm: Thiết bị giảm sát hành trình và ghi nhận hình ảnh người lài xe GT-MDVR02 live x2; bỏ: Thiết bị giảm sát hành trình và ghi nhận hình ảnh người lài xe GT-MDVR02 live x1)\n[06/07/2026 15:23 - nv224895] Cập nhật dòng công việc (thêm: Sim Mobi 30IP x2; bỏ: Sim Viettel IP x2)\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-03 07:47:11', NULL, NULL, NULL, NULL, 'install'),
(309, 'ORD-0407-001', 173, NULL, 1500000, 1500000, 1500000, NULL, NULL, 'debt', 'done', '[04/07/2026 08:26 - nv224895] Tạo đơn\n[04/07/2026 08:26 - nv224895] NV nhận 1.500.000đ (Chuyển khoản) — NNT-0407-001\n[04/07/2026 08:26 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-07-04 08:26:27', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-04 01:26:05', NULL, NULL, NULL, NULL, 'install'),
(310, 'ORD-0407-002', 49, NULL, 18630000, 18630000, 18630000, NULL, NULL, 'debt', 'done', '[04/07/2026 10:20 - admin] Tạo đơn\n[04/07/2026 10:21 - admin] Cập nhật dòng công việc (bỏ: SIM ITEL x3)\n[10/07/2026 11:24 - admin] Ghi nhận thu 18.630.000đ (Chuyển khoản)\n[10/07/2026 11:24 - admin] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-07-10 11:24:44', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-07-04 03:20:35', NULL, NULL, NULL, NULL, 'install'),
(311, 'ORD-0507-001', 174, NULL, 0, 0, 0, '2026-07-07 02:39:12', NULL, 'debt', 'done', '[05/07/2026 16:07 - admin] Tạo đơn\n[06/07/2026 12:16 - ktv885380] KTV hoàn thành đơn\n[07/07/2026 16:32 - admin] Thêm hoa hồng nhân viên Nguyễn Lý Thoại: 200.000đ\n', 'paid', 0, 0, NULL, 'Thủ Đức', 2, NULL, NULL, '2026-07-06 12:16:29', 200000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-07-05 09:07:09', NULL, NULL, NULL, 12, 'install'),
(312, 'ORD-0607-001', 175, NULL, 600000, 600000, 600000, NULL, NULL, 'debt', 'done', '[06/07/2026 09:05 - nv409671] Tạo đơn\n[06/07/2026 09:06 - nv409671] NV nhận 600.000đ (Chuyển khoản) — NNT-0607-001\n[06/07/2026 09:06 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-07-06 09:06:08', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-07-06 02:05:03', NULL, NULL, NULL, NULL, 'install'),
(313, 'ORD-0607-002', 176, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[06/07/2026 09:16 - nv224895] Tạo đơn\n[06/07/2026 09:48 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-0607-003\n[06/07/2026 14:06 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-07-06 14:06:57', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-06 02:16:00', NULL, NULL, NULL, NULL, 'install'),
(314, 'ORD-0607-003', 177, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[06/07/2026 09:33 - nv409671] Tạo đơn\n[06/07/2026 09:33 - nv409671] NV nhận 750.000đ (Chuyển khoản) — NNT-0607-002\n[06/07/2026 09:34 - nv409671] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-07-06 09:34:11', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-07-06 02:33:13', NULL, NULL, NULL, NULL, 'install'),
(315, 'ORD-0607-004', 178, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[06/07/2026 11:00 - nv224895] Tạo đơn\n[06/07/2026 11:11 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-0607-004\n[06/07/2026 11:11 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-07-06 11:11:35', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-06 04:00:23', NULL, NULL, NULL, NULL, 'install'),
(316, 'ORD-0607-005', 45, NULL, 480000, 480000, 480000, NULL, NULL, 'debt', 'done', '[06/07/2026 14:27 - nv224895] Tạo đơn\n[06/07/2026 14:28 - nv224895] NV nhận 480.000đ (Chuyển khoản) — NNT-0607-005\n[06/07/2026 14:28 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-07-06 14:28:04', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-06 07:27:19', NULL, NULL, NULL, NULL, 'install'),
(318, 'ORD-0607-006', 24, NULL, 11770000, 11770000, 0, NULL, NULL, 'debt', 'done', '[06/07/2026 17:35 - nv224895] Tạo đơn\n[07/07/2026 16:22 - ktv885380] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-07-07 16:22:08', 450000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-06 10:35:02', NULL, NULL, NULL, NULL, 'install'),
(319, 'ORD-0707-001', 179, NULL, 1500000, 1500000, 1500000, NULL, NULL, 'debt', 'confirmed', '[07/07/2026 08:27 - nv224895] Tạo đơn\n[07/07/2026 08:27 - nv224895] Cập nhật thông tin đơn (ghi chú)\n[08/07/2026 08:41 - nv224895] NV nhận 1.500.000đ (Chuyển khoản) — NNT-0807-001\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, 'hạn mới 14/7/2027', 'admin', 3, NULL, NULL, 0, '2026-07-07 01:27:17', NULL, NULL, NULL, NULL, 'install'),
(320, 'ORD-0707-002', 180, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[07/07/2026 08:30 - nv224895] Tạo đơn\n[07/07/2026 08:30 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-0707-001\n[07/07/2026 08:30 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-07-07 08:30:32', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-07 01:30:09', NULL, NULL, NULL, NULL, 'install'),
(322, 'ORD-0707-003', 22, NULL, 710000, 710000, 0, NULL, NULL, 'debt', 'done', '[07/07/2026 08:38 - nv224895] Tạo đơn\n[07/07/2026 12:21 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-07-07 12:21:55', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-07 01:38:57', NULL, NULL, NULL, NULL, 'install'),
(324, 'ORD-0707-004', 181, NULL, 50000, 50000, 0, NULL, NULL, 'debt', 'done', '[07/07/2026 08:54 - nv224895] Tạo đơn\n[07/07/2026 12:21 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-07-07 12:21:20', 50000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-07 01:54:31', NULL, NULL, NULL, NULL, 'install'),
(325, 'ORD-0707-005', 182, NULL, 3500000, 3500000, 0, '2026-07-07 14:40:09', NULL, 'debt', 'done', '[07/07/2026 08:58 - nv224895] Tạo đơn\n[07/07/2026 12:20 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-07-07 12:20:32', 150000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-07 01:58:42', NULL, NULL, NULL, NULL, 'install'),
(326, 'ORD-0707-006', 183, NULL, 8424000, 8424000, 8424000, NULL, NULL, 'debt', 'done', '[07/07/2026 09:27 - nv224895] Tạo đơn\n[07/07/2026 09:27 - nv224895] NV nhận 8.424.000đ (Chuyển khoản) — NNT-0707-002\n[07/07/2026 09:28 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-07-07 09:28:25', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-07 02:27:16', NULL, NULL, NULL, NULL, 'install'),
(327, 'ORD-0707-007', 184, NULL, 1200000, 1200000, 1200000, NULL, NULL, 'debt', 'done', '[07/07/2026 10:10 - nv224895] Tạo đơn\n[07/07/2026 10:22 - nv224895] NV nhận 1.200.000đ (Chuyển khoản) — NNT-0707-003\n[07/07/2026 10:22 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-07-07 10:22:10', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-07 03:10:18', NULL, NULL, NULL, NULL, 'install'),
(328, 'ORD-0707-008', 59, NULL, 16686000, 16686000, 0, NULL, NULL, 'debt', 'confirmed', '[07/07/2026 14:12 - nv224895] Tạo đơn\n', 'unpaid', 0, 0, NULL, '96/4 Đường số 9, Phường Linh Xuân, HCM', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-07 07:12:00', NULL, NULL, NULL, NULL, 'install'),
(329, 'ORD-0707-009', 102, NULL, 4978800, 4978800, 0, NULL, NULL, 'debt', 'confirmed', '[07/07/2026 15:24 - admin] Tạo đơn\n', 'unpaid', 0, 0, NULL, '158/11/24 Đường Bà Hạt, Phường Vườn Lài, TP Hồ Chí Minh, Việt Nam', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-07-07 08:24:46', NULL, NULL, NULL, NULL, 'install'),
(330, 'ORD-0707-010', 185, NULL, 972000, 972000, 0, NULL, NULL, 'debt', 'done', '[07/07/2026 16:15 - nv224895] Tạo đơn\n[07/07/2026 16:55 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-07-07 16:55:50', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-07 09:15:04', NULL, NULL, NULL, NULL, 'install'),
(332, 'ORD-0707-011', 186, NULL, 50000, 50000, 0, NULL, NULL, 'debt', 'done', '[07/07/2026 16:58 - nv224895] Tạo đơn\n[07/07/2026 18:43 - ktv157123] Bắt đầu làm việc\n[07/07/2026 18:44 - ktv157123] KTV đã khắc phục sản phẩm\n', 'customer_owes', 0, 0, NULL, NULL, 8, NULL, '2026-07-07 18:43:59', '2026-07-07 18:44:27', 50000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-07 09:58:29', NULL, NULL, NULL, NULL, 'warranty'),
(333, 'ORD-0707-012', 19, NULL, 3531600, 3531600, 0, NULL, NULL, 'debt', 'confirmed', '[07/07/2026 21:38 - admin] Tạo đơn\n', 'unpaid', 0, 0, NULL, '31/2A Tân Trụ, Phường Tân Sơn, TP Hồ Chí Minh, Việt Nam', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-07-07 14:38:33', NULL, NULL, NULL, NULL, 'install'),
(334, 'ORD-0807-001', 187, NULL, 500000, 500000, 500000, NULL, NULL, 'debt', 'done', '[08/07/2026 08:45 - nv224895] Tạo đơn\n[09/07/2026 18:59 - ktv885380] KTV hoàn thành đơn\n', 'staff_owes', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-07-09 18:59:58', 500000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-08 01:45:23', NULL, NULL, NULL, NULL, 'install'),
(335, 'ORD-0807-002', 188, NULL, 850000, 850000, 850000, NULL, NULL, 'debt', 'done', '[08/07/2026 09:26 - nv224895] Tạo đơn\n[08/07/2026 09:27 - nv224895] NV nhận 850.000đ (Chuyển khoản) — NNT-0807-002\n[08/07/2026 09:27 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-07-08 09:27:06', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-08 02:26:36', NULL, NULL, NULL, NULL, 'install'),
(336, 'ORD-0807-003', 189, NULL, 750000, 750000, 750000, NULL, NULL, 'debt', 'done', '[08/07/2026 11:18 - nv224895] Tạo đơn\n[08/07/2026 11:19 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-0807-003\n[08/07/2026 11:19 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-07-08 11:19:15', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-08 04:18:31', NULL, NULL, NULL, NULL, 'install'),
(337, 'ORD-0807-004', 24, NULL, 50000, 50000, 0, NULL, NULL, 'debt', 'done', '[08/07/2026 11:44 - nv224895] Tạo đơn\n[08/07/2026 14:54 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-07-08 14:54:06', 50000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-08 04:44:37', NULL, NULL, NULL, NULL, 'install'),
(338, 'ORD-0907-001', 190, NULL, 600000, 600000, 0, NULL, NULL, 'debt', 'confirmed', '[09/07/2026 10:34 - nv224895] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-09 03:34:13', NULL, NULL, NULL, NULL, 'install'),
(339, 'ORD-0907-002', 83, NULL, 3888000, 3888000, 0, NULL, NULL, 'debt', 'done', '[09/07/2026 13:05 - nv409671] Tạo đơn\n[09/07/2026 19:00 - ktv885380] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, 'Ô 127-128 Đường D33, khu phố 4, Phường An Phú, TP Hồ Chí Minh, Việt Nam', 2, NULL, NULL, '2026-07-09 19:00:39', 150000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-07-09 06:05:51', NULL, NULL, NULL, NULL, 'install'),
(341, 'ORD-0907-003', 191, NULL, 1800000, 1800000, 1800000, NULL, NULL, 'debt', 'done', '[09/07/2026 13:35 - nv224895] Tạo đơn\n[09/07/2026 18:59 - ktv885380] KTV hoàn thành đơn\n', 'staff_owes', 0, 0, NULL, NULL, 2, NULL, NULL, '2026-07-09 18:59:08', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-09 06:35:08', NULL, NULL, NULL, NULL, 'install'),
(342, 'ORD-0907-004', 166, NULL, 12096000, 12096000, 0, NULL, NULL, 'debt', 'cancelled', '[09/07/2026 14:20 - nv224895] Tạo đơn\n[09/07/2026 14:27 - nv224895] Cập nhật dòng công việc\n[09/07/2026 14:37 - nv224895] Cập nhật dòng công việc\n[09/07/2026 14:50 - nv224895] Huỷ đơn\n', 'unpaid', 0, 0, NULL, 'Số 36 đường Thới An 14, Khu phố 17, P.Thới An, TP Hồ Chí Minh', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-09 07:20:10', NULL, NULL, NULL, NULL, 'install'),
(343, 'ORD-0907-005', 166, NULL, 21870000, 21870000, 21870000, NULL, NULL, 'debt', 'done', '[09/07/2026 14:52 - nv224895] Tạo đơn\n[09/07/2026 14:57 - nv224895] Cập nhật dòng công việc\n[09/07/2026 14:58 - nv224895] Cập nhật dòng công việc\n[09/07/2026 14:59 - nv224895] Cập nhật dòng công việc (thêm: Ligo Air Adapter sử dụng cho RS232 x2)\n[09/07/2026 16:07 - nv224895] NV nhận 21.870.000đ (Chuyển khoản) — NNT-0907-001\n[09/07/2026 16:07 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, 'Số 36 đường Thới An 14, Khu phố 17, P.Thới An, TP Hồ Chí Minh', NULL, NULL, NULL, '2026-07-09 16:07:24', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-09 07:52:43', NULL, NULL, NULL, NULL, 'install'),
(344, 'ORD-0907-006', 21, NULL, 810000, 810000, 0, NULL, NULL, 'debt', 'cancelled', '[09/07/2026 16:08 - nv224895] Tạo đơn\n[09/07/2026 16:08 - nv224895] Cập nhật dòng công việc\n[10/07/2026 08:37 - nv224895] Huỷ đơn\n', 'unpaid', 0, 0, NULL, NULL, 2, NULL, NULL, NULL, 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-09 09:08:35', NULL, NULL, NULL, NULL, 'install'),
(345, 'ORD-0907-007', 37, NULL, 57510000, 57510000, 0, NULL, NULL, 'debt', 'confirmed', '[09/07/2026 16:57 - nv409671] Tạo đơn\n', 'unpaid', 0, 0, NULL, '0934269691', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 6, NULL, NULL, 0, '2026-07-09 09:57:12', NULL, NULL, NULL, NULL, 'install'),
(346, 'ORD-1007-001', 21, NULL, 810000, 810000, 0, NULL, NULL, 'debt', 'done', '[10/07/2026 08:37 - nv224895] Tạo đơn\n[10/07/2026 08:39 - ktv157123] KTV hoàn thành đơn\n', 'customer_owes', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-07-10 08:39:09', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-10 01:37:49', NULL, NULL, NULL, NULL, 'install'),
(347, 'ORD-1007-002', 192, NULL, 972000, 972000, 0, NULL, NULL, 'debt', 'confirmed', '[10/07/2026 10:08 - nv224895] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, 2, NULL, NULL, NULL, 150000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-10 03:08:02', NULL, NULL, NULL, NULL, 'install'),
(348, 'ORD-1007-003', 193, NULL, 972000, 972000, 0, NULL, NULL, 'debt', 'confirmed', '[10/07/2026 10:28 - nv224895] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, 2, NULL, NULL, NULL, 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-10 03:28:15', NULL, NULL, NULL, NULL, 'install'),
(349, 'ORD-1007-004', 194, NULL, 750000, 750000, 0, NULL, NULL, 'debt', 'confirmed', '[10/07/2026 10:40 - nv224895] Tạo đơn\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-10 03:40:27', NULL, NULL, NULL, NULL, 'install'),
(350, 'ORD-1007-005', 49, NULL, 8280000, 8280000, 0, NULL, NULL, 'debt', 'confirmed', '[10/07/2026 11:23 - admin] Tạo đơn\n[10/07/2026 13:55 - nv409671] Cập nhật dòng công việc (thêm: Dịch vụ phần mềm quản lý giám sát phương tiện 12 tháng ( gói combo plus 2) x1)\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-07-10 04:23:29', NULL, NULL, NULL, NULL, 'install'),
(351, 'ORD-1007-006', 61, NULL, 13590000, 13590000, 0, NULL, NULL, 'debt', 'confirmed', '[10/07/2026 14:19 - nv224895] Tạo đơn\n[10/07/2026 16:42 - nv224895] Cập nhật dòng công việc (thêm: Sim Viettel IP x5)\n', 'unpaid', 0, 0, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-10 07:19:04', NULL, NULL, NULL, NULL, 'install'),
(352, 'ORD-1007-007', 36, NULL, 5175000, 5175000, 5175000, NULL, NULL, 'debt', 'done', '[10/07/2026 14:42 - nv224895] Tạo đơn\n[10/07/2026 15:50 - nv224895] Cập nhật dòng công việc (thêm: Thiết bị giảm sát hành trình và ghi nhận hình ảnh người lài xe GT-MDVR02 live x1, Camera quan sát lắp trong cabin ô tô GT-AHD806 x1, Sim Mobi 30IP x1, Thẻ nhớ Dahua 64GB cho Camera x1; bỏ: Thiết bị giảm sát hành trình và ghi nhận hình ảnh người lài xe GT-MDVR02 live x2, Camera quan sát lắp trong cabin ô tô GT-AHD806 x2, Sim Mobi 30IP x2, Thẻ nhớ Dahua 64GB cho Camera x2)\n[10/07/2026 16:51 - nv224895] Chuyển trạng thái → done\n[10/07/2026 16:51 - nv224895] NV nhận 5.175.000đ (Tiền mặt) — NNT-1007-002\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-07-10 16:51:26', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-10 07:42:31', NULL, NULL, NULL, NULL, 'install'),
(353, 'ORD-1007-008', 49, NULL, 1788000, 1788000, 1788000, NULL, NULL, 'debt', 'done', '[10/07/2026 16:50 - nv224895] Tạo đơn\n[10/07/2026 16:51 - nv224895] NV nhận 1.788.000đ (Chuyển khoản) — NNT-1007-001\n[10/07/2026 16:51 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, NULL, NULL, NULL, NULL, '2026-07-10 16:51:21', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-10 09:50:52', NULL, NULL, NULL, NULL, 'install'),
(354, 'ORD-1107-001', 109, NULL, 27000000, 27000000, 0, NULL, NULL, 'debt', 'confirmed', '[11/07/2026 10:59 - admin] Tạo đơn\n', 'unpaid', 0, 0, NULL, '32 đường số 5, Khu Đô Thị Vạn Phúc, Phường Hiệp Bình, Thành phố Hồ Chí Minh, Việt Nam', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-07-11 03:59:12', NULL, NULL, NULL, NULL, 'install'),
(355, 'ORD-1107-002', 37, NULL, 5040000, 5040000, 5040000, NULL, NULL, 'debt', 'done', '[11/07/2026 11:26 - nv224895] Tạo đơn\n[11/07/2026 11:30 - nv224895] NV nhận 5.040.000đ (Chuyển khoản) — NNT-1107-001\n[11/07/2026 11:30 - nv224895] Chuyển trạng thái → done\n', 'paid', 0, 0, NULL, '0934269691', NULL, NULL, NULL, '2026-07-11 11:30:27', 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-11 04:26:07', NULL, NULL, NULL, NULL, 'install'),
(356, 'ORD-1107-003', 109, NULL, 22446360, 22446360, 0, NULL, NULL, 'debt', 'confirmed', '[11/07/2026 11:49 - admin] Tạo đơn\n', 'unpaid', 0, 0, NULL, '32 đường số 5, Khu Đô Thị Vạn Phúc, Phường Hiệp Bình, Thành phố Hồ Chí Minh, Việt Nam', NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 1, NULL, NULL, 0, '2026-07-11 04:49:10', NULL, NULL, NULL, NULL, 'install'),
(357, 'ORD-1107-004', 195, NULL, 972000, 972000, 972000, NULL, NULL, 'debt', 'done', '[11/07/2026 13:44 - nv224895] Tạo đơn\n[11/07/2026 14:06 - nv224895] NV nhận 972.000đ (Chuyển khoản) — NNT-1107-002\n[11/07/2026 17:39 - ktv157123] KTV hoàn thành đơn\n', 'paid', 0, 0, NULL, NULL, 8, NULL, NULL, '2026-07-11 17:39:05', 100000, 0, NULL, NULL, NULL, NULL, NULL, 'admin', 3, NULL, NULL, 0, '2026-07-11 06:44:02', NULL, NULL, NULL, NULL, 'install');

-- --------------------------------------------------------

--
-- Table structure for table `order_attachments`
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
-- Table structure for table `order_charges`
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
-- Dumping data for table `order_charges`
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
(59, 176, NULL, 'fee', 'Công lắp', 100000, 1),
(60, 176, NULL, 'fee', 'Công lắp', 100000, 0),
(61, 178, NULL, 'fee', 'Công lắp', 100000, 0),
(62, 179, NULL, 'fee', 'Công lắp', 100000, 0),
(63, 181, NULL, 'fee', 'Công lắp', 100000, 1),
(64, 181, NULL, 'fee', 'Công lắp', 100000, 1),
(65, 181, NULL, 'fee', 'Công lắp', 100000, 0),
(66, 189, NULL, 'fee', 'Công lắp', 1000, 0),
(67, 193, NULL, 'fee', 'Công lắp', 100000, 0),
(68, 194, NULL, 'fee', 'Công lắp', 150000, 1),
(69, 194, NULL, 'fee', 'Công lắp', 150000, 0),
(70, 198, NULL, 'fee', 'Công lắp', 200000, 0),
(71, 203, NULL, 'fee', 'Công lắp', 100000, 0),
(72, 205, NULL, 'fee', 'Công lắp', 100000, 0),
(73, 210, NULL, 'fee', 'Công lắp', 20000, 0),
(74, 213, NULL, 'fee', 'Công lắp', 100000, 1),
(75, 214, NULL, 'fee', 'Công lắp', 150000, 0),
(76, 215, NULL, 'fee', 'Công lắp', 100000, 1),
(77, 215, NULL, 'fee', 'Công lắp', 100000, 1),
(78, 215, NULL, 'fee', 'Công lắp', 100000, 0),
(79, 213, NULL, 'fee', 'Công lắp', 100000, 0),
(80, 218, NULL, 'fee', 'Công lắp', 100000, 1),
(81, 218, NULL, 'fee', 'Công lắp', 100000, 1),
(82, 218, NULL, 'fee', 'Công lắp', 100000, 1),
(83, 218, NULL, 'fee', 'Công lắp', 100000, 1),
(84, 218, NULL, 'fee', 'Công lắp', 100000, 0),
(85, 220, NULL, 'fee', 'Công lắp', 100000, 0),
(86, 224, NULL, 'fee', 'Công lắp', 100000, 0),
(87, 225, NULL, 'fee', 'Công lắp', 150000, 0),
(88, 226, NULL, 'fee', 'Công lắp', 200000, 0),
(89, 229, NULL, 'fee', 'Công lắp', 100000, 0),
(90, 230, NULL, 'fee', 'Công lắp', 100000, 0),
(91, 235, NULL, 'fee', 'Công lắp', 300000, 0),
(92, 241, NULL, 'fee', 'Công lắp', 100000, 0),
(93, 243, NULL, 'fee', 'Công lắp', 150000, 0),
(94, 265, NULL, 'fee', 'Công lắp', 100000, 0),
(95, 267, NULL, 'fee', 'Công lắp', 100000, 0),
(96, 268, NULL, 'fee', 'Công lắp', 600000, 0),
(97, 278, NULL, 'fee', 'Công lắp', 600000, 0),
(98, 280, NULL, 'fee', 'Công lắp', 100000, 0),
(99, 285, NULL, 'fee', 'Công lắp', 100000, 0),
(100, 290, NULL, 'fee', 'Công lắp', 100000, 0),
(101, 292, NULL, 'fee', 'Công lắp', 100000, 0),
(102, 301, NULL, 'fee', 'Công lắp', 150000, 0),
(103, 305, NULL, 'fee', 'Công lắp', 200000, 0),
(104, 311, NULL, 'fee', 'Công lắp', 200000, 0),
(105, 318, NULL, 'fee', 'Công lắp', 450000, 0),
(106, 322, NULL, 'fee', 'Công lắp', 100000, 0),
(107, 324, NULL, 'fee', 'Công lắp', 50000, 0),
(108, 325, NULL, 'fee', 'Công lắp', 150000, 0),
(109, 330, NULL, 'fee', 'Công lắp', 100000, 0),
(110, 332, NULL, 'fee', 'Công lắp', 50000, 0),
(111, 334, NULL, 'fee', 'Công lắp', 500000, 0),
(112, 337, NULL, 'fee', 'Công lắp', 50000, 0),
(113, 339, NULL, 'fee', 'Công lắp', 150000, 0),
(114, 341, NULL, 'fee', 'Công lắp', 100000, 0),
(115, 344, NULL, 'fee', 'Công lắp', 100000, 1),
(116, 344, NULL, 'fee', 'Công lắp', 100000, 0),
(117, 346, NULL, 'fee', 'Công lắp', 100000, 0),
(118, 347, NULL, 'fee', 'Công lắp', 150000, 0),
(119, 348, NULL, 'fee', 'Công lắp', 100000, 0),
(120, 357, NULL, 'fee', 'Công lắp', 100000, 0);

-- --------------------------------------------------------

--
-- Table structure for table `order_checklist`
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
-- Table structure for table `order_field_values`
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
-- Dumping data for table `order_field_values`
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
(219, 177, 207, 325, NULL, 'Biển số xe', '51D21346', 1, 0),
(220, 176, 208, 326, NULL, 'Biển số xe', '', 1, 0),
(221, 176, 208, 326, NULL, 'IMEI', '', 2, 0),
(222, 176, 208, 326, NULL, 'Tên tài khoản', '', 3, 0),
(223, 176, 208, 326, NULL, 'Số SIM', '', 4, 0),
(224, 180, 211, 329, NULL, 'Biển số xe', '84F00386', 1, 0),
(226, 182, 213, 331, NULL, 'Biển số xe', '71C05959', 1, 0),
(228, 181, 215, 333, NULL, 'Biển số xe', '', 1, 0),
(229, 185, 219, 341, NULL, 'Biển số xe', '51C-265.91', 1, 0),
(230, 185, 219, 341, NULL, 'IMEI', '', 2, 0),
(231, 185, 219, 341, NULL, 'Tên tài khoản', '', 3, 0),
(232, 185, 219, 341, NULL, 'Số SIM', '', 4, 0),
(233, 187, 223, 346, NULL, 'Biển số xe', '51D09277', 1, 0),
(234, 187, 223, 346, NULL, 'IMEI', '', 2, 0),
(235, 187, 223, 346, NULL, 'Tên tài khoản', '', 3, 0),
(236, 187, 223, 346, NULL, 'Số SIM', '', 4, 0),
(239, 193, 228, 353, NULL, 'Biển số xe', '76E00676', 1, 0),
(240, 193, 228, 353, NULL, 'Tên tài khoản', 'nguyenthimy92', 2, 0),
(241, 196, 231, 356, NULL, 'Biển số xe', '50LD13526,50LD10566,50LD17388', 1, 0),
(242, 197, 232, 357, NULL, 'Biển số xe', '61h03731', 1, 0),
(243, 194, 233, 358, NULL, 'Biển số xe', '62h08849', 1, 0),
(244, 194, 233, 358, NULL, 'IMEI', '', 2, 0),
(245, 194, 233, 358, NULL, 'Tên tài khoản', 'thuonglocphat', 3, 0),
(246, 194, 233, 358, NULL, 'Số SIM', '', 4, 0),
(247, 200, 236, 363, NULL, 'Biển số xe', '51D20984,51C50525', 1, 0),
(248, 201, 237, 364, NULL, 'Biển số xe', '62C19145 51C81419 51C14614 51C19368 51C64280', 1, 0),
(249, 201, 237, 364, NULL, 'Tên tài khoản', 'vnminhluan', 2, 0),
(251, 204, 241, 368, NULL, 'Biển số xe', '61h04982', 1, 0),
(252, 205, 242, 369, NULL, 'Tên tài khoản', 'trankhachuy', 1, 0),
(253, 203, 239, 366, NULL, 'Biển số xe', '50AF-330.56', 1, 0),
(254, 203, 239, 366, NULL, 'IMEI', '', 2, 0),
(255, 203, 239, 366, NULL, 'Tên tài khoản', 'Hoangkhang', 3, 0),
(256, 203, 239, 366, NULL, 'Số SIM', '', 4, 0),
(257, 207, 244, 371, NULL, 'Biển số xe', '95C03523', 1, 0),
(258, 209, 246, 374, NULL, 'Biển số xe', '51C10890,51C67507', 1, 0),
(259, 175, 248, 376, NULL, 'Biển số xe', '', 1, 0),
(260, 175, 248, 376, NULL, 'IMEI', '', 2, 0),
(261, 175, 248, 376, NULL, 'Tên tài khoản', '', 3, 0),
(262, 175, 248, 376, NULL, 'Số SIM', '', 4, 0),
(263, 212, 250, 378, NULL, 'Biển số xe', '50E-203.33', 1, 0),
(265, 214, 252, 380, NULL, 'Tên tài khoản', '51D43937', 1, 0),
(270, 215, 256, 384, NULL, 'Biển số xe', '81H06417', 1, 0),
(271, 215, 256, 384, NULL, 'IMEI', '', 2, 0),
(272, 215, 256, 384, NULL, 'Tên tài khoản', 'nguyenducloc', 3, 0),
(273, 215, 256, 384, NULL, 'Số SIM', '', 4, 0),
(274, 213, 257, 385, NULL, 'Tên tài khoản', 'minhnhut1', 1, 0),
(296, 218, 263, 393, NULL, 'Biển số xe', '', 1, 0),
(297, 218, 263, 393, NULL, 'IMEI', '', 2, 0),
(298, 218, 263, 393, NULL, 'Tên tài khoản', '', 3, 0),
(299, 218, 263, 393, NULL, 'Số SIM', '', 4, 0),
(300, 218, 263, 394, NULL, 'Biển số xe', '', 1, 0),
(301, 218, 263, 394, NULL, 'IMEI', '', 2, 0),
(302, 218, 263, 394, NULL, 'Tên tài khoản', '', 3, 0),
(303, 218, 263, 394, NULL, 'Số SIM', '', 4, 0),
(304, 222, 267, 402, NULL, 'Biển số xe', '66c10362', 1, 0),
(305, 224, 269, 404, NULL, 'Biển số xe', '61E03641', 1, 0),
(306, 224, 269, 404, NULL, 'Tên tài khoản', 'levanthu1', 2, 0),
(307, 217, 271, 406, NULL, 'Biển số xe', '51K73413', 1, 0),
(308, 227, 273, 408, NULL, 'IMEI', '862051082911033 864299079415363 864299079418771', 1, 0),
(309, 228, 274, 409, NULL, 'Biển số xe', '51D56074', 1, 0),
(310, 228, 274, 409, NULL, 'Tên tài khoản', 'hungphi', 2, 0),
(311, 229, 275, 410, NULL, 'Biển số xe', '86H03910', 1, 0),
(312, 229, 275, 410, NULL, 'Tên tài khoản', 'truongvanthu', 2, 0),
(313, 230, 276, 411, NULL, 'Tên tài khoản', 'tranhaison1', 1, 0),
(314, 226, 272, 407, NULL, 'Biển số xe', '50E-886.62', 1, 0),
(315, 226, 272, 407, NULL, 'IMEI', '', 2, 0),
(316, 226, 272, 407, NULL, 'Tên tài khoản', '0903763726', 3, 0),
(317, 226, 272, 407, NULL, 'Số SIM', '', 4, 0),
(318, 220, 265, 397, NULL, 'Biển số xe', '51H-051.54', 1, 0),
(319, 220, 265, 397, NULL, 'IMEI', '', 2, 0),
(320, 220, 265, 397, NULL, 'Tên tài khoản', '51H05154', 3, 0),
(321, 220, 265, 397, NULL, 'Số SIM', '', 4, 0),
(322, 225, 270, 405, NULL, 'Biển số xe', '51D-244.94', 1, 0),
(323, 225, 270, 405, NULL, 'IMEI', '', 2, 0),
(324, 225, 270, 405, NULL, 'Tên tài khoản', 'Dangphuocdong', 3, 0),
(325, 225, 270, 405, NULL, 'Số SIM', '', 4, 0),
(342, 236, 284, 426, NULL, 'Biển số xe', '', 1, 0),
(343, 236, 284, 426, NULL, 'IMEI', '', 2, 0),
(344, 236, 284, 426, NULL, 'Tên tài khoản', '', 3, 0),
(345, 236, 284, 426, NULL, 'Số SIM', '', 4, 0),
(346, 236, 284, 427, NULL, 'Biển số xe', '', 1, 0),
(347, 236, 284, 427, NULL, 'IMEI', '', 2, 0),
(348, 236, 284, 427, NULL, 'Tên tài khoản', '', 3, 0),
(349, 236, 284, 427, NULL, 'Số SIM', '', 4, 0),
(350, 237, 285, 428, NULL, 'IMEI', '863982083981352 863982084032825', 1, 0),
(351, 239, 287, 434, NULL, 'Biển số xe', '50H24136', 1, 0),
(352, 239, 287, 434, NULL, 'Tên tài khoản', '50H24136', 2, 0),
(353, 240, 288, 435, NULL, 'Biển số xe', '51C75884', 1, 0),
(354, 241, 289, 436, NULL, 'Biển số xe', '50H-884.84', 1, 0),
(355, 241, 289, 436, NULL, 'Tên tài khoản', 'huynhvikiet', 2, 0),
(356, 242, 290, 437, NULL, 'IMEI', '355468593180706 355468593180052 355468591331764 355468593179401 355468593176928', 1, 0),
(357, 243, 291, 438, NULL, 'Biển số xe', '60K-985.03', 1, 0),
(358, 243, 291, 438, NULL, 'IMEI', '', 2, 0),
(359, 243, 291, 438, NULL, 'Tên tài khoản', 'Boramtek', 3, 0),
(360, 243, 291, 438, NULL, 'Số SIM', '', 4, 0),
(361, 245, 294, 443, NULL, 'Biển số xe', '', 1, 0),
(362, 245, 294, 443, NULL, 'IMEI', '863982083958111', 2, 0),
(363, 245, 294, 443, NULL, 'Tên tài khoản', '', 3, 0),
(364, 245, 294, 443, NULL, 'Số SIM', '', 4, 0),
(365, 245, 294, 444, NULL, 'Biển số xe', '', 1, 0),
(366, 245, 294, 444, NULL, 'IMEI', '', 2, 0),
(367, 245, 294, 444, NULL, 'Tên tài khoản', '', 3, 0),
(368, 245, 294, 444, NULL, 'Số SIM', '', 4, 0),
(369, 245, 294, 445, NULL, 'Biển số xe', '', 1, 0),
(370, 245, 294, 445, NULL, 'IMEI', '', 2, 0),
(371, 245, 294, 445, NULL, 'Tên tài khoản', '', 3, 0),
(372, 245, 294, 445, NULL, 'Số SIM', '', 4, 0),
(373, 246, 295, 446, NULL, 'Biển số xe', '50E20432', 1, 0),
(374, 246, 295, 446, NULL, 'Tên tài khoản', 'nguyenhongson', 2, 0),
(375, 247, 296, 447, NULL, 'Biển số xe', '51C41489', 1, 0),
(377, 248, 298, 449, NULL, 'Biển số xe', 'Huyndai', 1, 0),
(378, 249, 299, 450, NULL, 'Biển số xe', '51C05154 51C05153 51C43751 51C05155', 1, 0),
(379, 249, 299, 450, NULL, 'Tên tài khoản', 'thanhlamq12', 2, 0),
(380, 252, 302, 455, NULL, 'Biển số xe', '50H03183  49H02886', 1, 0),
(405, 255, 307, 467, NULL, 'Biển số xe', '61C50517', 1, 0),
(406, 255, 307, 467, NULL, 'Tên tài khoản', 'dinhhau', 2, 0),
(423, 254, 310, 472, NULL, 'Biển số xe', '', 1, 0),
(424, 254, 310, 472, NULL, 'IMEI', '', 2, 0),
(425, 254, 310, 472, NULL, 'Tên tài khoản', '', 3, 0),
(426, 254, 310, 472, NULL, 'Số SIM', '', 4, 0),
(427, 254, 310, 473, NULL, 'Biển số xe', '', 1, 0),
(428, 254, 310, 473, NULL, 'IMEI', '', 2, 0),
(429, 254, 310, 473, NULL, 'Tên tài khoản', '', 3, 0),
(430, 254, 310, 473, NULL, 'Số SIM', '', 4, 0),
(431, 254, 310, 474, NULL, 'Biển số xe', '', 1, 0),
(432, 254, 310, 474, NULL, 'IMEI', '', 2, 0),
(433, 254, 310, 474, NULL, 'Tên tài khoản', '', 3, 0),
(434, 254, 310, 474, NULL, 'Số SIM', '', 4, 0),
(435, 254, 311, 475, NULL, 'Biển số xe', '', 1, 0),
(436, 254, 311, 475, NULL, 'IMEI', '', 2, 0),
(437, 254, 311, 475, NULL, 'Tên tài khoản', '', 3, 0),
(438, 254, 311, 475, NULL, 'Số SIM', '', 4, 0),
(439, 256, 313, 479, NULL, 'Biển số xe', '', 1, 0),
(440, 256, 313, 479, NULL, 'IMEI', '', 2, 0),
(441, 256, 313, 479, NULL, 'Tên tài khoản', '', 3, 0),
(442, 256, 313, 479, NULL, 'Số SIM', '', 4, 0),
(443, 256, 313, 480, NULL, 'Biển số xe', '', 1, 0),
(444, 256, 313, 480, NULL, 'IMEI', '', 2, 0),
(445, 256, 313, 480, NULL, 'Tên tài khoản', '', 3, 0),
(446, 256, 313, 480, NULL, 'Số SIM', '', 4, 0),
(447, 258, 315, 483, NULL, 'Biển số xe', '51C40841', 1, 0),
(448, 259, 317, 488, NULL, 'Biển số xe', '', 1, 0),
(449, 259, 317, 488, NULL, 'IMEI', '', 2, 0),
(450, 259, 317, 488, NULL, 'Tên tài khoản', '', 3, 0),
(451, 259, 317, 488, NULL, 'Số SIM', '', 4, 0),
(452, 259, 317, 489, NULL, 'Biển số xe', '', 1, 0),
(453, 259, 317, 489, NULL, 'IMEI', '', 2, 0),
(454, 259, 317, 489, NULL, 'Tên tài khoản', '', 3, 0),
(455, 259, 317, 489, NULL, 'Số SIM', '', 4, 0),
(456, 259, 317, 490, NULL, 'Biển số xe', '', 1, 0),
(457, 259, 317, 490, NULL, 'IMEI', '', 2, 0),
(458, 259, 317, 490, NULL, 'Tên tài khoản', '', 3, 0),
(459, 259, 317, 490, NULL, 'Số SIM', '', 4, 0),
(460, 259, 317, 491, NULL, 'Biển số xe', '', 1, 0),
(461, 259, 317, 491, NULL, 'IMEI', '', 2, 0),
(462, 259, 317, 491, NULL, 'Tên tài khoản', '', 3, 0),
(463, 259, 317, 491, NULL, 'Số SIM', '', 4, 0),
(464, 261, 319, 498, NULL, 'Biển số xe', '50H45942', 1, 0),
(465, 260, 320, 499, NULL, 'Biển số xe', '', 1, 0),
(466, 260, 320, 499, NULL, 'IMEI', '', 2, 0),
(467, 260, 320, 499, NULL, 'Tên tài khoản', '', 3, 0),
(468, 260, 320, 499, NULL, 'Số SIM', '', 4, 0),
(469, 260, 320, 500, NULL, 'Biển số xe', '', 1, 0),
(470, 260, 320, 500, NULL, 'IMEI', '', 2, 0),
(471, 260, 320, 500, NULL, 'Tên tài khoản', '', 3, 0),
(472, 260, 320, 500, NULL, 'Số SIM', '', 4, 0),
(473, 260, 320, 501, NULL, 'Biển số xe', '', 1, 0),
(474, 260, 320, 501, NULL, 'IMEI', '', 2, 0),
(475, 260, 320, 501, NULL, 'Tên tài khoản', '', 3, 0),
(476, 260, 320, 501, NULL, 'Số SIM', '', 4, 0),
(477, 260, 320, 502, NULL, 'Biển số xe', '', 1, 0),
(478, 260, 320, 502, NULL, 'IMEI', '', 2, 0),
(479, 260, 320, 502, NULL, 'Tên tài khoản', '', 3, 0),
(480, 260, 320, 502, NULL, 'Số SIM', '', 4, 0),
(497, 250, 324, 508, NULL, 'Biển số xe', '', 1, 0),
(498, 250, 324, 508, NULL, 'IMEI', '', 2, 0),
(499, 250, 324, 508, NULL, 'Tên tài khoản', '', 3, 0),
(500, 250, 324, 508, NULL, 'Số SIM', '', 4, 0),
(501, 250, 324, 509, NULL, 'Biển số xe', '', 1, 0),
(502, 250, 324, 509, NULL, 'IMEI', '', 2, 0),
(503, 250, 324, 509, NULL, 'Tên tài khoản', '', 3, 0),
(504, 250, 324, 509, NULL, 'Số SIM', '', 4, 0),
(505, 250, 324, 510, NULL, 'Biển số xe', '', 1, 0),
(506, 250, 324, 510, NULL, 'IMEI', '', 2, 0),
(507, 250, 324, 510, NULL, 'Tên tài khoản', '', 3, 0),
(508, 250, 324, 510, NULL, 'Số SIM', '', 4, 0),
(509, 250, 325, 511, NULL, 'Biển số xe', '', 1, 0),
(510, 250, 325, 511, NULL, 'IMEI', '', 2, 0),
(511, 250, 325, 511, NULL, 'Tên tài khoản', '', 3, 0),
(512, 250, 325, 511, NULL, 'Số SIM', '', 4, 0),
(513, 264, 327, 514, NULL, 'Biển số xe', '64H02058', 1, 0),
(514, 265, 328, 515, NULL, 'Biển số xe', '50E91085', 1, 0),
(515, 267, 330, 517, NULL, 'Biển số xe', '51L79074', 1, 0),
(516, 269, 332, 520, NULL, 'Biển số xe', '51c11428', 1, 0),
(517, 270, 334, 522, NULL, 'Biển số xe', '', 1, 0),
(518, 270, 334, 522, NULL, 'IMEI', '', 2, 0),
(519, 270, 334, 522, NULL, 'Tên tài khoản', '', 3, 0),
(520, 270, 334, 522, NULL, 'Số SIM', '', 4, 0),
(521, 273, 337, 527, NULL, 'Biển số xe', '50E16780', 1, 0),
(522, 274, 338, 528, NULL, 'Biển số xe', '61E00907', 1, 0),
(523, 274, 338, 528, NULL, 'Tên tài khoản', 'anhoang', 2, 0),
(524, 276, 340, 530, NULL, 'Biển số xe', '51F85610', 1, 0),
(525, 276, 340, 530, NULL, 'Tên tài khoản', 'phamvancuonghcm', 2, 0),
(542, 281, 347, 547, NULL, 'Biển số xe', '', 1, 0),
(543, 281, 347, 547, NULL, 'IMEI', '', 2, 0),
(544, 281, 347, 547, NULL, 'Tên tài khoản', '', 3, 0),
(545, 281, 347, 547, NULL, 'Số SIM', '', 4, 0),
(546, 281, 347, 548, NULL, 'Biển số xe', '', 1, 0),
(547, 281, 347, 548, NULL, 'IMEI', '', 2, 0),
(548, 281, 347, 548, NULL, 'Tên tài khoản', '', 3, 0),
(549, 281, 347, 548, NULL, 'Số SIM', '', 4, 0),
(550, 282, 348, 549, NULL, 'Biển số xe', '50E-040.05', 1, 0),
(551, 282, 348, 549, NULL, 'Tên tài khoản', 'huyenly', 2, 0),
(552, 285, 351, 553, NULL, 'Biển số xe', '51K33304', 1, 0),
(553, 285, 351, 553, NULL, 'Tên tài khoản', 'anhkim', 2, 0),
(554, 286, 353, 555, NULL, 'Biển số xe', '', 1, 0),
(555, 286, 353, 555, NULL, 'IMEI', '', 2, 0),
(556, 286, 353, 555, NULL, 'Tên tài khoản', '', 3, 0),
(557, 286, 353, 555, NULL, 'Số SIM', '', 4, 0),
(558, 286, 353, 556, NULL, 'Biển số xe', '', 1, 0),
(559, 286, 353, 556, NULL, 'IMEI', '', 2, 0),
(560, 286, 353, 556, NULL, 'Tên tài khoản', '', 3, 0),
(561, 286, 353, 556, NULL, 'Số SIM', '', 4, 0),
(562, 288, 355, 558, NULL, 'Biển số xe', '64A-123.07', 1, 0),
(563, 289, 356, 559, NULL, 'IMEI', '863982083955232', 1, 0),
(564, 290, 357, 561, NULL, 'Tên tài khoản', 'phamhoaiphong', 1, 0),
(566, 292, 359, 563, NULL, 'Biển số xe', '51L18628', 1, 0),
(615, 296, 365, 588, NULL, 'Biển số xe', '50h90138', 1, 0),
(616, 297, 366, 589, NULL, 'Biển số xe', '50E17449', 1, 0),
(617, 294, 368, 592, NULL, 'Biển số xe', '', 1, 0),
(618, 294, 368, 592, NULL, 'IMEI', '', 2, 0),
(619, 294, 368, 592, NULL, 'Tên tài khoản', '', 3, 0),
(620, 294, 368, 592, NULL, 'Số SIM', '', 4, 0),
(621, 294, 368, 593, NULL, 'Biển số xe', '', 1, 0),
(622, 294, 368, 593, NULL, 'IMEI', '', 2, 0),
(623, 294, 368, 593, NULL, 'Tên tài khoản', '', 3, 0),
(624, 294, 368, 593, NULL, 'Số SIM', '', 4, 0),
(625, 294, 368, 594, NULL, 'Biển số xe', '', 1, 0),
(626, 294, 368, 594, NULL, 'IMEI', '', 2, 0),
(627, 294, 368, 594, NULL, 'Tên tài khoản', '', 3, 0),
(628, 294, 368, 594, NULL, 'Số SIM', '', 4, 0),
(629, 294, 368, 595, NULL, 'Biển số xe', '', 1, 0),
(630, 294, 368, 595, NULL, 'IMEI', '', 2, 0),
(631, 294, 368, 595, NULL, 'Tên tài khoản', '', 3, 0),
(632, 294, 368, 595, NULL, 'Số SIM', '', 4, 0),
(633, 294, 368, 596, NULL, 'Biển số xe', '', 1, 0),
(634, 294, 368, 596, NULL, 'IMEI', '', 2, 0),
(635, 294, 368, 596, NULL, 'Tên tài khoản', '', 3, 0),
(636, 294, 368, 596, NULL, 'Số SIM', '', 4, 0),
(637, 294, 368, 597, NULL, 'Biển số xe', '', 1, 0),
(638, 294, 368, 597, NULL, 'IMEI', '', 2, 0),
(639, 294, 368, 597, NULL, 'Tên tài khoản', '', 3, 0),
(640, 294, 368, 597, NULL, 'Số SIM', '', 4, 0),
(641, 302, 372, 606, NULL, 'Biển số xe', '51C42872', 1, 0),
(642, 302, 372, 606, NULL, 'Tên tài khoản', 'nguyenvantrung1', 2, 0),
(643, 305, 375, 617, NULL, 'Biển số xe', '50E93021', 1, 0),
(644, 277, 376, 620, NULL, 'Biển số xe', '', 1, 0),
(645, 277, 376, 620, NULL, 'IMEI', '', 2, 0),
(646, 277, 376, 620, NULL, 'Tên tài khoản', '', 3, 0),
(647, 277, 376, 620, NULL, 'Số SIM', '', 4, 0),
(648, 277, 376, 621, NULL, 'Biển số xe', '', 1, 0),
(649, 277, 376, 621, NULL, 'IMEI', '', 2, 0),
(650, 277, 376, 621, NULL, 'Tên tài khoản', '', 3, 0),
(651, 277, 376, 621, NULL, 'Số SIM', '', 4, 0),
(652, 277, 376, 622, NULL, 'Biển số xe', '', 1, 0),
(653, 277, 376, 622, NULL, 'IMEI', '', 2, 0),
(654, 277, 376, 622, NULL, 'Tên tài khoản', '', 3, 0),
(655, 277, 376, 622, NULL, 'Số SIM', '', 4, 0),
(656, 306, 377, 623, NULL, 'Biển số xe', '51D-252.93 ; 51D-218.97 ; 50H-010.08', 1, 0),
(657, 307, 379, 625, NULL, 'Biển số xe', '', 1, 0),
(658, 307, 379, 625, NULL, 'IMEI', '863982084032643 863982084031207', 2, 0),
(659, 307, 379, 625, NULL, 'Tên tài khoản', '', 3, 0),
(660, 307, 379, 625, NULL, 'Số SIM', '', 4, 0),
(661, 303, 380, 626, NULL, 'Biển số xe', '', 1, 0),
(662, 303, 380, 626, NULL, 'IMEI', '', 2, 0),
(663, 303, 380, 626, NULL, 'Tên tài khoản', '', 3, 0),
(664, 303, 380, 626, NULL, 'Số SIM', '', 4, 0),
(665, 303, 380, 627, NULL, 'Biển số xe', '', 1, 0),
(666, 303, 380, 627, NULL, 'IMEI', '', 2, 0),
(667, 303, 380, 627, NULL, 'Tên tài khoản', '', 3, 0),
(668, 303, 380, 627, NULL, 'Số SIM', '', 4, 0),
(669, 303, 380, 628, NULL, 'Biển số xe', '', 1, 0),
(670, 303, 380, 628, NULL, 'IMEI', '', 2, 0),
(671, 303, 380, 628, NULL, 'Tên tài khoản', '', 3, 0),
(672, 303, 380, 628, NULL, 'Số SIM', '', 4, 0),
(673, 303, 380, 629, NULL, 'Biển số xe', '', 1, 0),
(674, 303, 380, 629, NULL, 'IMEI', '', 2, 0),
(675, 303, 380, 629, NULL, 'Tên tài khoản', '', 3, 0),
(676, 303, 380, 629, NULL, 'Số SIM', '', 4, 0),
(677, 303, 380, 630, NULL, 'Biển số xe', '', 1, 0),
(678, 303, 380, 630, NULL, 'IMEI', '', 2, 0),
(679, 303, 380, 630, NULL, 'Tên tài khoản', '', 3, 0),
(680, 303, 380, 630, NULL, 'Số SIM', '', 4, 0),
(681, 303, 380, 631, NULL, 'Biển số xe', '', 1, 0),
(682, 303, 380, 631, NULL, 'IMEI', '', 2, 0),
(683, 303, 380, 631, NULL, 'Tên tài khoản', '', 3, 0),
(684, 303, 380, 631, NULL, 'Số SIM', '', 4, 0),
(685, 309, 382, 636, NULL, 'Biển số xe', '50E-457.91 61H063.76', 1, 0),
(686, 310, 384, 641, NULL, 'Biển số xe', '', 1, 0),
(687, 310, 384, 641, NULL, 'IMEI', '', 2, 0),
(688, 310, 384, 641, NULL, 'Tên tài khoản', '', 3, 0),
(689, 310, 384, 641, NULL, 'Số SIM', '', 4, 0),
(690, 310, 384, 642, NULL, 'Biển số xe', '', 1, 0),
(691, 310, 384, 642, NULL, 'IMEI', '', 2, 0),
(692, 310, 384, 642, NULL, 'Tên tài khoản', '', 3, 0),
(693, 310, 384, 642, NULL, 'Số SIM', '', 4, 0),
(694, 310, 384, 643, NULL, 'Biển số xe', '', 1, 0),
(695, 310, 384, 643, NULL, 'IMEI', '', 2, 0),
(696, 310, 384, 643, NULL, 'Tên tài khoản', '', 3, 0),
(697, 310, 384, 643, NULL, 'Số SIM', '', 4, 0),
(698, 312, 386, 645, NULL, 'Biển số xe', '51M-237.41', 1, 0),
(699, 312, 386, 645, NULL, 'IMEI', '861385071086584', 2, 0),
(700, 313, 387, 646, NULL, 'Biển số xe', '50E93457', 1, 0),
(701, 314, 388, 647, NULL, 'Biển số xe', '50E-192.15', 1, 0),
(702, 314, 388, 647, NULL, 'IMEI', '861385071008489', 2, 0),
(719, 315, 390, 652, NULL, 'Biển số xe', '51d51547', 1, 0),
(720, 316, 391, 653, NULL, 'Biển số xe', '51L72111', 1, 0),
(721, 316, 391, 653, NULL, 'Tên tài khoản', 'ctymina', 2, 0),
(722, 308, 392, 654, NULL, 'Biển số xe', '', 1, 0),
(723, 308, 392, 654, NULL, 'IMEI', '', 2, 0),
(724, 308, 392, 654, NULL, 'Tên tài khoản', '', 3, 0),
(725, 308, 392, 654, NULL, 'Số SIM', '', 4, 0),
(726, 308, 392, 655, NULL, 'Biển số xe', '', 1, 0),
(727, 308, 392, 655, NULL, 'IMEI', '', 2, 0),
(728, 308, 392, 655, NULL, 'Tên tài khoản', '', 3, 0),
(729, 308, 392, 655, NULL, 'Số SIM', '', 4, 0),
(730, 308, 392, 656, NULL, 'Biển số xe', '', 1, 0),
(731, 308, 392, 656, NULL, 'IMEI', '', 2, 0),
(732, 308, 392, 656, NULL, 'Tên tài khoản', '', 3, 0),
(733, 308, 392, 656, NULL, 'Số SIM', '', 4, 0),
(734, 308, 392, 657, NULL, 'Biển số xe', '', 1, 0),
(735, 308, 392, 657, NULL, 'IMEI', '', 2, 0),
(736, 308, 392, 657, NULL, 'Tên tài khoản', '', 3, 0),
(737, 308, 392, 657, NULL, 'Số SIM', '', 4, 0),
(739, 318, 394, 661, NULL, 'Tên tài khoản', 'ctyhoangnguyen1', 1, 0),
(740, 319, 395, 664, NULL, 'Biển số xe', '51D21450,50H81442', 1, 0),
(741, 319, 395, 664, NULL, 'Ghi chú', 'Hạn mới đến 14/7/2027', 2, 0),
(742, 320, 396, 665, NULL, 'Biển số xe', '61c25860', 1, 0),
(743, 320, 396, 665, NULL, 'Tên tài khoản', 'tranhuuquynh', 2, 0),
(746, 322, 398, 667, NULL, 'Biển số xe', '59N2-430.11', 1, 0),
(747, 322, 398, 667, NULL, 'Tên tài khoản', 'kiennghia', 2, 0),
(748, 327, 403, 674, NULL, 'Biển số xe', '61h08008', 1, 0),
(749, 327, 403, 674, NULL, 'Tên tài khoản', 'hoangvanhoa1', 2, 0),
(750, 330, 406, 681, NULL, 'Tên tài khoản', 'datthanh', 1, 0),
(751, 334, 410, 687, NULL, 'Biển số xe', '50F02753', 1, 0),
(752, 335, 411, 688, NULL, 'Biển số xe', '51C26965', 1, 0),
(753, 336, 412, 689, NULL, 'Biển số xe', '51d67243', 1, 0),
(754, 337, 413, 690, NULL, 'Biển số xe', '51d51961', 1, 0),
(755, 338, 414, 691, NULL, 'Biển số xe', '51k25267', 1, 0),
(757, 341, 417, 694, NULL, 'Biển số xe', '51b03078', 1, 0),
(762, 342, 420, 697, NULL, 'Biển số xe', '', 1, 0),
(763, 342, 420, 697, NULL, 'IMEI', '', 2, 0),
(764, 342, 420, 697, NULL, 'Tên tài khoản', '', 3, 0),
(765, 342, 420, 697, NULL, 'Số SIM', '', 4, 0),
(798, 343, 424, 710, NULL, 'Biển số xe', '', 1, 0),
(799, 343, 424, 710, NULL, 'IMEI', '', 2, 0),
(800, 343, 424, 710, NULL, 'Tên tài khoản', '', 3, 0),
(801, 343, 424, 710, NULL, 'Số SIM', '', 4, 0),
(802, 343, 424, 711, NULL, 'Biển số xe', '', 1, 0),
(803, 343, 424, 711, NULL, 'IMEI', '', 2, 0),
(804, 343, 424, 711, NULL, 'Tên tài khoản', '', 3, 0),
(805, 343, 424, 711, NULL, 'Số SIM', '', 4, 0),
(806, 343, 424, 712, NULL, 'Biển số xe', '', 1, 0),
(807, 343, 424, 712, NULL, 'IMEI', '', 2, 0),
(808, 343, 424, 712, NULL, 'Tên tài khoản', '', 3, 0),
(809, 343, 424, 712, NULL, 'Số SIM', '', 4, 0),
(810, 343, 424, 713, NULL, 'Biển số xe', '', 1, 0),
(811, 343, 424, 713, NULL, 'IMEI', '', 2, 0),
(812, 343, 424, 713, NULL, 'Tên tài khoản', '', 3, 0),
(813, 343, 424, 713, NULL, 'Số SIM', '', 4, 0),
(814, 343, 424, 714, NULL, 'Biển số xe', '', 1, 0),
(815, 343, 424, 714, NULL, 'IMEI', '', 2, 0),
(816, 343, 424, 714, NULL, 'Tên tài khoản', '', 3, 0),
(817, 343, 424, 714, NULL, 'Số SIM', '', 4, 0),
(820, 344, 426, 716, NULL, 'Biển số xe', '93H06747', 1, 0),
(821, 344, 426, 716, NULL, 'Tên tài khoản', '0865615478', 2, 0),
(822, 346, 428, 719, NULL, 'Biển số xe', '93H06747', 1, 0),
(823, 346, 428, 719, NULL, 'Tên tài khoản', 'hienluong1', 2, 0),
(824, 349, 431, 722, NULL, 'Biển số xe', '50E14676', 1, 0),
(825, 350, 433, 725, NULL, 'Biển số xe', '', 1, 0),
(826, 350, 433, 725, NULL, 'IMEI', '', 2, 0),
(827, 350, 433, 725, NULL, 'Tên tài khoản', '', 3, 0),
(828, 350, 433, 725, NULL, 'Số SIM', '', 4, 0),
(829, 350, 433, 726, NULL, 'Biển số xe', '', 1, 0),
(830, 350, 433, 726, NULL, 'IMEI', '', 2, 0),
(831, 350, 433, 726, NULL, 'Tên tài khoản', '', 3, 0),
(832, 350, 433, 726, NULL, 'Số SIM', '', 4, 0),
(833, 350, 433, 727, NULL, 'Biển số xe', '', 1, 0),
(834, 350, 433, 727, NULL, 'IMEI', '', 2, 0),
(835, 350, 433, 727, NULL, 'Tên tài khoản', '', 3, 0),
(836, 350, 433, 727, NULL, 'Số SIM', '', 4, 0),
(837, 352, 436, 736, NULL, 'Biển số xe', '', 1, 0),
(838, 352, 436, 736, NULL, 'IMEI', '', 2, 0),
(839, 352, 436, 736, NULL, 'Tên tài khoản', '', 3, 0),
(840, 352, 436, 736, NULL, 'Số SIM', '', 4, 0),
(841, 352, 436, 737, NULL, 'Biển số xe', '', 1, 0),
(842, 352, 436, 737, NULL, 'IMEI', '', 2, 0),
(843, 352, 436, 737, NULL, 'Tên tài khoản', '', 3, 0),
(844, 352, 436, 737, NULL, 'Số SIM', '', 4, 0),
(845, 352, 436, 738, NULL, 'Biển số xe', '', 1, 0),
(846, 352, 436, 738, NULL, 'IMEI', '', 2, 0),
(847, 352, 436, 738, NULL, 'Tên tài khoản', '', 3, 0),
(848, 352, 436, 738, NULL, 'Số SIM', '', 4, 0),
(849, 352, 436, 739, NULL, 'Biển số xe', '', 1, 0),
(850, 352, 436, 739, NULL, 'IMEI', '', 2, 0),
(851, 352, 436, 739, NULL, 'Tên tài khoản', '', 3, 0),
(852, 352, 436, 739, NULL, 'Số SIM', '', 4, 0),
(853, 352, 436, 740, NULL, 'Biển số xe', '', 1, 0),
(854, 352, 436, 740, NULL, 'IMEI', '', 2, 0),
(855, 352, 436, 740, NULL, 'Tên tài khoản', '', 3, 0),
(856, 352, 436, 740, NULL, 'Số SIM', '', 4, 0),
(857, 352, 436, 741, NULL, 'Biển số xe', '', 1, 0),
(858, 352, 436, 741, NULL, 'IMEI', '', 2, 0),
(859, 352, 436, 741, NULL, 'Tên tài khoản', '', 3, 0),
(860, 352, 436, 741, NULL, 'Số SIM', '', 4, 0),
(861, 351, 437, 742, NULL, 'Biển số xe', '', 1, 0),
(862, 351, 437, 742, NULL, 'IMEI', '', 2, 0),
(863, 351, 437, 742, NULL, 'Tên tài khoản', '', 3, 0),
(864, 351, 437, 742, NULL, 'Số SIM', '', 4, 0),
(865, 351, 437, 743, NULL, 'Biển số xe', '', 1, 0),
(866, 351, 437, 743, NULL, 'IMEI', '', 2, 0),
(867, 351, 437, 743, NULL, 'Tên tài khoản', '', 3, 0),
(868, 351, 437, 743, NULL, 'Số SIM', '', 4, 0),
(869, 351, 437, 744, NULL, 'Biển số xe', '', 1, 0),
(870, 351, 437, 744, NULL, 'IMEI', '', 2, 0),
(871, 351, 437, 744, NULL, 'Tên tài khoản', '', 3, 0),
(872, 351, 437, 744, NULL, 'Số SIM', '', 4, 0),
(873, 357, 442, 753, NULL, 'Tên tài khoản', 'lamsang', 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
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
-- Dumping data for table `order_items`
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
(325, 177, 207, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(326, 176, 208, 2, 1, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(327, 178, 209, 2, 1, 810000, 0.00, NULL, NULL, NULL, NULL, NULL),
(328, 179, 210, 2, 1, 972000, 0.00, NULL, NULL, NULL, NULL, NULL),
(329, 180, 211, 18, 2, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(331, 182, 213, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(333, 181, 215, 2, 1, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(334, 183, 216, 4, 2, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(335, 183, 216, 10, 5, 918000, 0.00, NULL, NULL, NULL, NULL, NULL),
(336, 183, 216, 12, 2, 420000, 0.00, NULL, NULL, NULL, NULL, NULL),
(337, 183, 216, 23, 5, 1620000, 0.00, NULL, NULL, NULL, NULL, NULL),
(338, 184, 217, 40, 50, 378000, 0.00, NULL, NULL, NULL, NULL, NULL),
(339, 184, 217, 39, 50, 50000, 0.00, NULL, NULL, NULL, NULL, NULL),
(341, 185, 219, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(346, 187, 223, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(347, 189, 224, 2, 4, 972000, 0.00, NULL, NULL, NULL, NULL, NULL),
(348, 189, 224, 8, 4, 3564000, 0.00, NULL, NULL, NULL, NULL, NULL),
(349, 190, 225, 2, 10, 572400, 0.00, NULL, NULL, NULL, NULL, NULL),
(350, 191, 226, 5, 5, 1647000, 0.00, NULL, NULL, NULL, NULL, NULL),
(351, 191, 226, 6, 5, 297000, 0.00, NULL, NULL, NULL, NULL, NULL),
(353, 193, 228, 24, 1, 100000, 0.00, NULL, NULL, NULL, NULL, NULL),
(355, 195, 230, 2, 1, 972000, 0.00, NULL, NULL, NULL, NULL, NULL),
(356, 196, 231, 18, 3, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(357, 197, 232, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(358, 194, 233, 2, 1, 745000, 0.00, NULL, NULL, NULL, NULL, NULL),
(359, 198, 234, 4, 1, 2942000, 0.00, NULL, NULL, NULL, NULL, NULL),
(360, 198, 234, 10, 1, 1080000, 0.00, NULL, NULL, NULL, NULL, NULL),
(361, 198, 234, 6, 1, 378000, 0.00, NULL, NULL, NULL, NULL, NULL),
(362, 199, 235, 42, 2, 1320000, 0.00, NULL, NULL, NULL, NULL, NULL),
(363, 200, 236, 18, 2, 850000, 0.00, NULL, NULL, NULL, NULL, NULL),
(364, 201, 237, 18, 5, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(365, 202, 238, 13, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(366, 203, 239, 28, 1, 849960, 0.00, NULL, NULL, NULL, NULL, NULL),
(368, 204, 241, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(369, 205, 242, 2, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(370, 206, 243, 38, 1, 0, 0.00, NULL, NULL, NULL, NULL, NULL),
(371, 207, 244, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(372, 208, 245, 2, 1, 669600, 0.00, NULL, NULL, NULL, NULL, NULL),
(373, 208, 245, 17, 2, 150000, 0.00, NULL, NULL, NULL, NULL, NULL),
(374, 209, 246, 18, 2, 850000, 0.00, NULL, NULL, NULL, NULL, NULL),
(375, 210, 247, 2, 100, 529200, 0.00, NULL, NULL, NULL, NULL, NULL),
(376, 175, 248, 2, 100, 540000, 0.00, NULL, NULL, NULL, NULL, NULL),
(377, 211, 249, 2, 15, 604800, 0.00, NULL, NULL, NULL, NULL, NULL),
(378, 212, 250, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(380, 214, 252, 2, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(382, 216, 254, 28, 3, 464400, 0.00, NULL, NULL, NULL, NULL, NULL),
(384, 215, 256, 2, 1, 1000000, 0.00, NULL, NULL, NULL, NULL, NULL),
(385, 213, 257, 2, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(393, 218, 263, 2, 1, 648000, 0.00, NULL, NULL, NULL, NULL, NULL),
(394, 218, 263, 24, 1, 100000, 0.00, NULL, NULL, NULL, NULL, NULL),
(397, 220, 265, 2, 1, 648000, 0.00, NULL, NULL, NULL, NULL, NULL),
(398, 220, 265, 24, 1, 100000, 0.00, NULL, NULL, NULL, NULL, NULL),
(399, 221, 266, 4, 1, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(400, 221, 266, 10, 1, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(401, 221, 266, 12, 1, 450000, 0.00, NULL, NULL, NULL, NULL, NULL),
(402, 222, 267, 26, 1, 850000, 0.00, NULL, NULL, NULL, NULL, NULL),
(403, 223, 268, 8, 1, 1728000, 0.00, NULL, NULL, NULL, NULL, NULL),
(404, 224, 269, 2, 1, 972000, 0.00, NULL, NULL, NULL, NULL, NULL),
(405, 225, 270, 2, 1, 800000, 0.00, NULL, NULL, NULL, NULL, NULL),
(406, 217, 271, 17, 1, 500000, 0.00, NULL, NULL, NULL, NULL, NULL),
(407, 226, 272, 2, 2, 1000000, 0.00, NULL, NULL, NULL, NULL, NULL),
(408, 227, 273, 4, 3, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(409, 228, 274, 18, 1, 850000, 0.00, NULL, NULL, NULL, NULL, NULL),
(410, 229, 275, 2, 1, 810000, 0.00, NULL, NULL, NULL, NULL, NULL),
(411, 230, 276, 2, 1, 810000, 0.00, NULL, NULL, NULL, NULL, NULL),
(412, 231, 277, 5, 5, 1647000, 0.00, NULL, NULL, NULL, NULL, NULL),
(413, 231, 277, 6, 5, 297000, 0.00, NULL, NULL, NULL, NULL, NULL),
(414, 231, 277, 9, 5, 486000, 0.00, NULL, NULL, NULL, NULL, NULL),
(415, 232, 278, 42, 1, 0, 0.00, NULL, NULL, NULL, NULL, NULL),
(416, 233, 279, 5, 2, 2622000, 0.00, NULL, NULL, NULL, NULL, NULL),
(417, 233, 279, 2, 3, 972000, 0.00, NULL, NULL, NULL, NULL, NULL),
(418, 233, 279, 6, 1, 378000, 0.00, NULL, NULL, NULL, NULL, NULL),
(424, 235, 282, 8, 1, 3780000, 0.00, NULL, NULL, NULL, NULL, NULL),
(426, 236, 284, 11, 1, 3900000, 0.00, NULL, NULL, NULL, NULL, NULL),
(427, 236, 284, 11, 1, 0, 0.00, NULL, NULL, NULL, NULL, NULL),
(428, 237, 285, 4, 2, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(429, 238, 286, 5, 1, 1998000, 0.00, NULL, NULL, NULL, NULL, NULL),
(430, 238, 286, 4, 1, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(431, 238, 286, 10, 2, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(432, 238, 286, 27, 2, 360000, 0.00, NULL, NULL, NULL, NULL, NULL),
(433, 238, 286, 31, 1, 270000, 0.00, NULL, NULL, NULL, NULL, NULL),
(434, 239, 287, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(435, 240, 288, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(436, 241, 289, 2, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(437, 242, 290, 37, 5, 918000, 0.00, NULL, NULL, NULL, NULL, NULL),
(438, 243, 291, 28, 1, 972000, 0.00, NULL, NULL, NULL, NULL, NULL),
(439, 244, 292, 28, 7, 1296000, 0.00, NULL, NULL, NULL, NULL, NULL),
(443, 245, 294, 4, 1, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(444, 245, 294, 31, 1, 300000, 0.00, NULL, NULL, NULL, NULL, NULL),
(445, 245, 294, 39, 5, 50000, 0.00, NULL, NULL, NULL, NULL, NULL),
(446, 246, 295, 18, 1, 850000, 0.00, NULL, NULL, NULL, NULL, NULL),
(447, 247, 296, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(449, 248, 298, 18, 1, 600000, 0.00, NULL, NULL, NULL, NULL, NULL),
(450, 249, 299, 18, 4, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(454, 251, 301, 18, 9, 480000, 0.00, NULL, NULL, NULL, NULL, NULL),
(455, 252, 302, 18, 2, 700000, 0.00, NULL, NULL, NULL, NULL, NULL),
(456, 253, 303, 5, 2, 1998000, 0.00, NULL, NULL, NULL, NULL, NULL),
(457, 253, 303, 31, 2, 300000, 0.00, NULL, NULL, NULL, NULL, NULL),
(467, 255, 307, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(472, 254, 310, 4, 1, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(473, 254, 310, 27, 4, 360000, 0.00, NULL, NULL, NULL, NULL, NULL),
(474, 254, 310, 31, 2, 300000, 0.00, NULL, NULL, NULL, NULL, NULL),
(475, 254, 311, 10, 1, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(479, 256, 313, 5, 5, 1647000, 0.00, NULL, NULL, NULL, NULL, NULL),
(480, 256, 313, 2, 1, 567000, 0.00, NULL, NULL, NULL, NULL, NULL),
(481, 257, 314, 5, 1, 2048000, 0.00, NULL, NULL, NULL, NULL, NULL),
(482, 257, 314, 10, 1, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(483, 258, 315, 18, 1, 480000, 0.00, NULL, NULL, NULL, NULL, NULL),
(488, 259, 317, 4, 15, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(489, 259, 317, 9, 5, 518400, 0.00, NULL, NULL, NULL, NULL, NULL),
(490, 259, 317, 23, 20, 1728000, 0.00, NULL, NULL, NULL, NULL, NULL),
(491, 259, 317, 43, 10, 1890000, 0.00, NULL, NULL, NULL, NULL, NULL),
(498, 261, 319, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(499, 260, 320, 4, 15, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(500, 260, 320, 10, 15, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(501, 260, 320, 23, 20, 1620000, 0.00, NULL, NULL, NULL, NULL, NULL),
(502, 260, 320, 43, 10, 1782000, 0.00, NULL, NULL, NULL, NULL, NULL),
(503, 262, 321, 17, 100, 80000, 0.00, NULL, NULL, NULL, NULL, NULL),
(508, 250, 324, 4, 5, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(509, 250, 324, 10, 5, 918000, 0.00, NULL, NULL, NULL, NULL, NULL),
(510, 250, 324, 12, 3, 420000, 0.00, NULL, NULL, NULL, NULL, NULL),
(511, 250, 325, 23, 5, 1620000, 0.00, NULL, NULL, NULL, NULL, NULL),
(512, 263, 326, 18, 10, 530000, 0.00, NULL, NULL, NULL, NULL, NULL),
(513, 264, 327, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(514, 264, 327, 20, 1, 1800000, 0.00, NULL, NULL, NULL, NULL, NULL),
(515, 265, 328, 2, 1, 810000, 0.00, NULL, NULL, NULL, NULL, NULL),
(516, 266, 329, 2, 100, 529200, 0.00, NULL, NULL, NULL, NULL, NULL),
(517, 267, 330, 2, 1, 972000, 0.00, NULL, NULL, NULL, NULL, NULL),
(518, 268, 331, 2, 1, 972000, 0.00, NULL, NULL, NULL, NULL, NULL),
(519, 268, 331, 23, 1, 3548000, 0.00, NULL, NULL, NULL, NULL, NULL),
(520, 269, 332, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(522, 270, 334, 40, 10, 486000, 0.00, NULL, NULL, NULL, NULL, NULL),
(523, 271, 335, 14, 5, 432000, 0.00, NULL, NULL, NULL, NULL, NULL),
(524, 272, 336, 18, 10, 250000, 0.00, NULL, NULL, NULL, NULL, NULL),
(525, 272, 336, 22, 5, 550000, 0.00, NULL, NULL, NULL, NULL, NULL),
(526, 272, 336, 20, 5, 450000, 0.00, NULL, NULL, NULL, NULL, NULL),
(527, 273, 337, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(528, 274, 338, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(529, 275, 339, 23, 3, 1620000, 0.00, NULL, NULL, NULL, NULL, NULL),
(530, 276, 340, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(534, 278, 342, 23, 2, 3024000, 0.00, NULL, NULL, NULL, NULL, NULL),
(535, 278, 342, 2, 2, 810000, 0.00, NULL, NULL, NULL, NULL, NULL),
(536, 279, 343, 18, 4, 250000, 0.00, NULL, NULL, NULL, NULL, NULL),
(537, 279, 343, 20, 6, 450000, 0.00, NULL, NULL, NULL, NULL, NULL),
(538, 279, 343, 44, 1, 300000, 0.00, NULL, NULL, NULL, NULL, NULL),
(543, 280, 345, 2, 1, 972000, 0.00, NULL, NULL, NULL, NULL, NULL),
(547, 281, 347, 5, 5, 1701000, 0.00, NULL, NULL, NULL, NULL, NULL),
(548, 281, 347, 10, 5, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(549, 282, 348, 18, 1, 770000, 0.00, NULL, NULL, NULL, NULL, NULL),
(550, 283, 349, 2, 5, 588600, 0.00, NULL, NULL, NULL, NULL, NULL),
(551, 283, 349, 39, 10, 50000, 0.00, NULL, NULL, NULL, NULL, NULL),
(553, 285, 351, 40, 1, 850000, 0.00, NULL, NULL, NULL, NULL, NULL),
(555, 286, 353, 5, 1, 2048000, 0.00, NULL, NULL, NULL, NULL, NULL),
(556, 286, 353, 39, 3, 50000, 0.00, NULL, NULL, NULL, NULL, NULL),
(557, 287, 354, 22, 10, 550000, 0.00, NULL, NULL, NULL, NULL, NULL),
(558, 288, 355, 17, 1, 600000, 0.00, NULL, NULL, NULL, NULL, NULL),
(559, 289, 356, 5, 1, 1998000, 0.00, NULL, NULL, NULL, NULL, NULL),
(560, 289, 356, 10, 1, 918000, 0.00, NULL, NULL, NULL, NULL, NULL),
(561, 290, 357, 2, 1, 810000, 0.00, NULL, NULL, NULL, NULL, NULL),
(563, 292, 359, 18, 1, 850000, 0.00, NULL, NULL, NULL, NULL, NULL),
(564, 293, 360, 18, 20, 250000, 0.00, NULL, NULL, NULL, NULL, NULL),
(565, 293, 360, 20, 11, 500000, 0.00, NULL, NULL, NULL, NULL, NULL),
(566, 293, 360, 19, 5, 500000, 0.00, NULL, NULL, NULL, NULL, NULL),
(585, 295, 364, 18, 20, 250000, 0.00, NULL, NULL, NULL, NULL, NULL),
(586, 295, 364, 19, 20, 450000, 0.00, NULL, NULL, NULL, NULL, NULL),
(587, 295, 364, 20, 20, 450000, 0.00, NULL, NULL, NULL, NULL, NULL),
(588, 296, 365, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(589, 297, 366, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(590, 298, 367, 2, 10, 588600, 0.00, NULL, NULL, NULL, NULL, NULL),
(591, 298, 367, 39, 13, 50000, 0.00, NULL, NULL, NULL, NULL, NULL),
(592, 294, 368, 4, 4, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(593, 294, 368, 10, 4, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(594, 294, 368, 31, 4, 250000, 0.00, NULL, NULL, NULL, NULL, NULL),
(595, 294, 368, 12, 4, 450000, 0.00, NULL, NULL, NULL, NULL, NULL),
(596, 294, 368, 2, 6, 572400, 0.00, NULL, NULL, NULL, NULL, NULL),
(597, 294, 368, 39, 10, 50000, 0.00, NULL, NULL, NULL, NULL, NULL),
(598, 299, 369, 4, 6, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(599, 299, 369, 12, 6, 420000, 0.00, NULL, NULL, NULL, NULL, NULL),
(600, 299, 369, 10, 6, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(601, 300, 370, 4, 6, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(602, 300, 370, 10, 6, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(603, 300, 370, 12, 6, 450000, 0.00, NULL, NULL, NULL, NULL, NULL),
(604, 300, 370, 31, 6, 250000, 0.00, NULL, NULL, NULL, NULL, NULL),
(605, 301, 371, 4, 1, 4536000, 0.00, NULL, NULL, NULL, NULL, NULL),
(606, 302, 372, 18, 2, 600000, 0.00, NULL, NULL, NULL, NULL, NULL),
(613, 304, 374, 5, 1, 1998000, 0.00, NULL, NULL, NULL, NULL, NULL),
(614, 304, 374, 10, 1, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(615, 304, 374, 39, 1, 0, 0.00, NULL, NULL, NULL, NULL, NULL),
(616, 304, 374, 31, 1, 290000, 0.00, NULL, NULL, NULL, NULL, NULL),
(617, 305, 375, 5, 1, 2430000, 0.00, NULL, NULL, NULL, NULL, NULL),
(618, 305, 375, 10, 1, 1080000, 0.00, NULL, NULL, NULL, NULL, NULL),
(619, 305, 375, 6, 1, 378000, 0.00, NULL, NULL, NULL, NULL, NULL),
(620, 277, 376, 4, 1, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(621, 277, 376, 10, 1, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(622, 277, 376, 31, 1, 270000, 0.00, NULL, NULL, NULL, NULL, NULL),
(623, 306, 377, 20, 3, 1800000, 0.00, NULL, NULL, NULL, NULL, NULL),
(625, 307, 379, 5, 2, 1998000, 0.00, NULL, NULL, NULL, NULL, NULL),
(626, 303, 380, 2, 1, 594000, 0.00, NULL, NULL, NULL, NULL, NULL),
(627, 303, 380, 4, 1, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(628, 303, 380, 40, 3, 486000, 0.00, NULL, NULL, NULL, NULL, NULL),
(629, 303, 380, 31, 1, 270000, 0.00, NULL, NULL, NULL, NULL, NULL),
(630, 303, 380, 39, 4, 50000, 0.00, NULL, NULL, NULL, NULL, NULL),
(631, 303, 380, 10, 1, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(636, 309, 382, 18, 2, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(641, 310, 384, 4, 7, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(642, 310, 384, 2, 3, 594000, 0.00, NULL, NULL, NULL, NULL, NULL),
(643, 310, 384, 31, 5, 270000, 0.00, NULL, NULL, NULL, NULL, NULL),
(644, 311, 385, 28, 1, 0, 0.00, NULL, NULL, NULL, NULL, NULL),
(645, 312, 386, 17, 1, 600000, 0.00, NULL, NULL, NULL, NULL, NULL),
(646, 313, 387, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(647, 314, 388, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(652, 315, 390, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(653, 316, 391, 18, 1, 480000, 0.00, NULL, NULL, NULL, NULL, NULL),
(654, 308, 392, 4, 2, 2050000, 0.00, NULL, NULL, NULL, NULL, NULL),
(655, 308, 392, 10, 2, 800000, 0.00, NULL, NULL, NULL, NULL, NULL),
(656, 308, 392, 27, 2, 360000, 0.00, NULL, NULL, NULL, NULL, NULL),
(657, 308, 392, 31, 2, 291000, 0.00, NULL, NULL, NULL, NULL, NULL),
(661, 318, 394, 4, 3, 3240000, 0.00, NULL, NULL, NULL, NULL, NULL),
(662, 318, 394, 27, 3, 600000, 0.00, NULL, NULL, NULL, NULL, NULL),
(663, 318, 394, 45, 1, 250000, 0.00, NULL, NULL, NULL, NULL, NULL),
(664, 319, 395, 18, 2, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(665, 320, 396, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(667, 322, 398, 34, 1, 710000, 0.00, NULL, NULL, NULL, NULL, NULL),
(669, 324, 400, 24, 1, 50000, 0.00, NULL, NULL, NULL, NULL, NULL),
(670, 325, 401, 5, 1, 2250000, 0.00, NULL, NULL, NULL, NULL, NULL),
(671, 325, 401, 6, 1, 250000, 0.00, NULL, NULL, NULL, NULL, NULL),
(672, 325, 401, 10, 1, 1000000, 0.00, NULL, NULL, NULL, NULL, NULL),
(673, 326, 402, 46, 4, 2106000, 0.00, NULL, NULL, NULL, NULL, NULL),
(674, 327, 403, 18, 2, 600000, 0.00, NULL, NULL, NULL, NULL, NULL),
(675, 328, 404, 4, 5, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(676, 328, 404, 10, 5, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(677, 328, 404, 14, 3, 432000, 0.00, NULL, NULL, NULL, NULL, NULL),
(678, 329, 405, 4, 1, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(679, 329, 405, 10, 1, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(680, 329, 405, 28, 4, 475200, 0.00, NULL, NULL, NULL, NULL, NULL),
(681, 330, 406, 2, 1, 972000, 0.00, NULL, NULL, NULL, NULL, NULL),
(683, 332, 408, 24, 1, 50000, 0.00, NULL, NULL, NULL, NULL, NULL),
(684, 333, 409, 4, 1, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(685, 333, 409, 10, 1, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(686, 333, 409, 12, 1, 453600, 0.00, NULL, NULL, NULL, NULL, NULL),
(687, 334, 410, 24, 1, 500000, 0.00, NULL, NULL, NULL, NULL, NULL),
(688, 335, 411, 18, 1, 850000, 0.00, NULL, NULL, NULL, NULL, NULL),
(689, 336, 412, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(690, 337, 413, 24, 1, 50000, 0.00, NULL, NULL, NULL, NULL, NULL),
(691, 338, 414, 17, 1, 600000, 0.00, NULL, NULL, NULL, NULL, NULL),
(692, 339, 415, 5, 1, 3888000, 0.00, NULL, NULL, NULL, NULL, NULL),
(694, 341, 417, 20, 1, 1800000, 0.00, NULL, NULL, NULL, NULL, NULL),
(697, 342, 420, 2, 20, 604800, 0.00, NULL, NULL, NULL, NULL, NULL),
(710, 343, 424, 2, 20, 604800, 0.00, NULL, NULL, NULL, NULL, NULL),
(711, 343, 424, 43, 2, 1512000, 0.00, NULL, NULL, NULL, NULL, NULL),
(712, 343, 424, 23, 3, 1350000, 0.00, NULL, NULL, NULL, NULL, NULL),
(713, 343, 424, 47, 2, 1350000, 0.00, NULL, NULL, NULL, NULL, NULL),
(714, 343, 424, 48, 2, 0, 0.00, NULL, NULL, NULL, NULL, NULL),
(716, 344, 426, 2, 1, 810000, 0.00, NULL, NULL, NULL, NULL, NULL),
(717, 345, 427, 2, 100, 529200, 0.00, NULL, NULL, NULL, NULL, NULL),
(718, 345, 427, 37, 5, 918000, 0.00, NULL, NULL, NULL, NULL, NULL),
(719, 346, 428, 2, 1, 810000, 0.00, NULL, NULL, NULL, NULL, NULL),
(720, 347, 429, 2, 1, 972000, 0.00, NULL, NULL, NULL, NULL, NULL),
(721, 348, 430, 2, 1, 972000, 0.00, NULL, NULL, NULL, NULL, NULL),
(722, 349, 431, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL),
(725, 350, 433, 40, 10, 486000, 0.00, NULL, NULL, NULL, NULL, NULL),
(726, 350, 433, 2, 5, 594000, 0.00, NULL, NULL, NULL, NULL, NULL),
(727, 350, 433, 20, 1, 450000, 0.00, NULL, NULL, NULL, NULL, NULL),
(736, 352, 436, 4, 1, 2214000, 0.00, NULL, NULL, NULL, NULL, NULL),
(737, 352, 436, 10, 1, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(738, 352, 436, 27, 1, 360000, 0.00, NULL, NULL, NULL, NULL, NULL),
(739, 352, 436, 31, 1, 291000, 0.00, NULL, NULL, NULL, NULL, NULL),
(740, 352, 436, 40, 3, 432000, 0.00, NULL, NULL, NULL, NULL, NULL),
(741, 352, 436, 39, 3, 50000, 0.00, NULL, NULL, NULL, NULL, NULL),
(742, 351, 437, 5, 5, 1998000, 0.00, NULL, NULL, NULL, NULL, NULL),
(743, 351, 437, 39, 30, 50000, 0.00, NULL, NULL, NULL, NULL, NULL),
(744, 351, 437, 12, 5, 420000, 0.00, NULL, NULL, NULL, NULL, NULL),
(745, 353, 438, 18, 1, 1188000, 0.00, NULL, NULL, NULL, NULL, NULL),
(746, 353, 438, 17, 6, 100000, 0.00, NULL, NULL, NULL, NULL, NULL),
(747, 354, 439, 2, 50, 540000, 0.00, NULL, NULL, NULL, NULL, NULL),
(748, 355, 440, 17, 63, 80000, 0.00, NULL, NULL, NULL, NULL, NULL),
(749, 356, 441, 5, 7, 1815480, 0.00, NULL, NULL, NULL, NULL, NULL),
(750, 356, 441, 10, 7, 864000, 0.00, NULL, NULL, NULL, NULL, NULL),
(751, 356, 441, 6, 7, 270000, 0.00, NULL, NULL, NULL, NULL, NULL),
(752, 356, 441, 20, 3, 600000, 0.00, NULL, NULL, NULL, NULL, NULL),
(753, 357, 442, 2, 1, 972000, 0.00, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `order_lines`
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
-- Dumping data for table `order_lines`
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
(207, 177, 2, NULL, 1, 750000, NULL, 0),
(208, 176, 1, NULL, 1, 864000, NULL, 0),
(209, 178, 1, NULL, 1, 810000, NULL, 0),
(210, 179, 1, NULL, 1, 972000, NULL, 0),
(211, 180, 2, NULL, 1, 1500000, NULL, 0),
(213, 182, 2, NULL, 1, 750000, NULL, 0),
(215, 181, 1, NULL, 1, 864000, NULL, 0),
(216, 183, 11, NULL, 1, 17958000, NULL, 0),
(217, 184, 11, NULL, 1, 21400000, NULL, 0),
(219, 185, 2, NULL, 1, 750000, NULL, 0),
(223, 187, 2, NULL, 1, 750000, NULL, 0),
(224, 189, 11, NULL, 1, 18144000, NULL, 0),
(225, 190, 11, NULL, 1, 5724000, NULL, 0),
(226, 191, 11, NULL, 1, 9720000, NULL, 0),
(228, 193, 3, NULL, 1, 100000, NULL, 0),
(230, 195, 1, NULL, 1, 972000, NULL, 0),
(231, 196, 2, NULL, 1, 2250000, NULL, 0),
(232, 197, 2, NULL, 1, 750000, NULL, 0),
(233, 194, 1, NULL, 1, 745000, NULL, 0),
(234, 198, 1, NULL, 1, 4400000, NULL, 0),
(235, 199, 2, NULL, 1, 2640000, NULL, 0),
(236, 200, 2, NULL, 1, 1700000, NULL, 0),
(237, 201, 2, NULL, 1, 3750000, NULL, 0),
(238, 202, 2, NULL, 1, 750000, NULL, 0),
(239, 203, 1, NULL, 1, 849960, NULL, 0),
(241, 204, 2, NULL, 1, 750000, NULL, 0),
(242, 205, 1, NULL, 1, 750000, NULL, 0),
(243, 206, 7, NULL, 1, 0, NULL, 0),
(244, 207, 2, NULL, 1, 750000, NULL, 0),
(245, 208, 11, NULL, 1, 969600, NULL, 0),
(246, 209, 2, NULL, 1, 1700000, NULL, 0),
(247, 210, 11, NULL, 1, 52920000, NULL, 0),
(248, 175, 11, NULL, 1, 54000000, NULL, 0),
(249, 211, 11, NULL, 1, 9072000, NULL, 0),
(250, 212, 2, NULL, 1, 750000, NULL, 0),
(252, 214, 1, NULL, 1, 750000, NULL, 0),
(254, 216, 11, NULL, 1, 1393200, NULL, 0),
(256, 215, 1, NULL, 1, 1000000, NULL, 0),
(257, 213, 1, NULL, 1, 750000, NULL, 0),
(263, 218, 1, NULL, 1, 748000, NULL, 0),
(265, 220, 1, NULL, 1, 748000, NULL, 0),
(266, 221, 11, NULL, 1, 3528000, NULL, 0),
(267, 222, 2, NULL, 1, 850000, NULL, 0),
(268, 223, 11, NULL, 1, 1728000, NULL, 0),
(269, 224, 1, NULL, 1, 972000, NULL, 0),
(270, 225, 1, NULL, 1, 800000, NULL, 0),
(271, 217, 2, NULL, 1, 500000, NULL, 0),
(272, 226, 1, NULL, 1, 2000000, NULL, 0),
(273, 227, 11, NULL, 1, 6642000, NULL, 0),
(274, 228, 2, NULL, 1, 850000, NULL, 0),
(275, 229, 1, NULL, 1, 810000, NULL, 0),
(276, 230, 1, NULL, 1, 810000, NULL, 0),
(277, 231, 11, NULL, 1, 12150000, NULL, 0),
(278, 232, 7, NULL, 1, 0, NULL, 0),
(279, 233, 7, NULL, 1, 8538000, NULL, 0),
(282, 235, 1, NULL, 1, 3780000, NULL, 0),
(284, 236, 7, NULL, 1, 3900000, NULL, 0),
(285, 237, 11, NULL, 1, 4428000, NULL, 0),
(286, 238, 11, NULL, 1, 6930000, NULL, 0),
(287, 239, 2, NULL, 1, 750000, NULL, 0),
(288, 240, 2, NULL, 1, 750000, NULL, 0),
(289, 241, 1, NULL, 1, 750000, NULL, 0),
(290, 242, 11, NULL, 1, 4590000, NULL, 0),
(291, 243, 1, NULL, 1, 972000, NULL, 0),
(292, 244, 1, NULL, 1, 9072000, NULL, 0),
(294, 245, 11, NULL, 1, 2764000, NULL, 0),
(295, 246, 2, NULL, 1, 850000, NULL, 0),
(296, 247, 2, NULL, 1, 750000, NULL, 0),
(298, 248, 2, NULL, 1, 600000, NULL, 0),
(299, 249, 2, NULL, 1, 3000000, NULL, 0),
(301, 251, 2, NULL, 1, 4320000, NULL, 0),
(302, 252, 2, NULL, 1, 1400000, NULL, 0),
(303, 253, 11, NULL, 1, 4596000, NULL, 0),
(307, 255, 2, NULL, 1, 750000, NULL, 0),
(310, 254, 11, NULL, 1, 4254000, NULL, 0),
(311, 254, 11, NULL, 2, 864000, NULL, 0),
(313, 256, 11, NULL, 1, 8802000, NULL, 0),
(314, 257, 11, NULL, 1, 2912000, NULL, 0),
(315, 258, 2, NULL, 1, 480000, NULL, 0),
(317, 259, 11, NULL, 1, 89262000, NULL, 0),
(319, 261, 2, NULL, 1, 750000, NULL, 0),
(320, 260, 11, NULL, 1, 96390000, NULL, 0),
(321, 262, 2, NULL, 1, 8000000, NULL, 0),
(324, 250, 11, NULL, 1, 16920000, NULL, 0),
(325, 250, 11, NULL, 2, 8100000, NULL, 0),
(326, 263, 2, NULL, 1, 5300000, NULL, 0),
(327, 264, 2, NULL, 1, 2550000, NULL, 0),
(328, 265, 1, NULL, 1, 810000, NULL, 0),
(329, 266, 11, NULL, 1, 52920000, NULL, 0),
(330, 267, 1, NULL, 1, 972000, NULL, 0),
(331, 268, 1, NULL, 1, 4520000, NULL, 0),
(332, 269, 2, NULL, 1, 750000, NULL, 0),
(334, 270, 11, NULL, 1, 4860000, NULL, 0),
(335, 271, 11, NULL, 1, 2160000, NULL, 0),
(336, 272, 2, NULL, 1, 7500000, NULL, 0),
(337, 273, 2, NULL, 1, 750000, NULL, 0),
(338, 274, 2, NULL, 1, 750000, NULL, 0),
(339, 275, 11, NULL, 1, 4860000, NULL, 0),
(340, 276, 2, NULL, 1, 750000, NULL, 0),
(342, 278, 1, NULL, 1, 7668000, NULL, 0),
(343, 279, 2, NULL, 1, 4000000, NULL, 0),
(345, 280, 1, NULL, 1, 972000, NULL, 0),
(347, 281, 11, NULL, 1, 12825000, NULL, 0),
(348, 282, 2, NULL, 1, 770000, NULL, 0),
(349, 283, 11, NULL, 1, 3443000, NULL, 0),
(351, 285, 1, NULL, 1, 850000, NULL, 0),
(353, 286, 11, NULL, 1, 2198000, NULL, 0),
(354, 287, 2, NULL, 1, 5500000, NULL, 0),
(355, 288, 2, NULL, 1, 600000, NULL, 0),
(356, 289, 11, NULL, 1, 2916000, NULL, 0),
(357, 290, 1, NULL, 1, 810000, NULL, 0),
(359, 292, 6, NULL, 1, 850000, NULL, 0),
(360, 293, 2, NULL, 1, 13000000, NULL, 0),
(364, 295, 2, NULL, 1, 23000000, NULL, 0),
(365, 296, 2, NULL, 1, 750000, NULL, 0),
(366, 297, 2, NULL, 1, 750000, NULL, 0),
(367, 298, 11, NULL, 1, 6536000, NULL, 0),
(368, 294, 11, NULL, 1, 19046400, NULL, 0),
(369, 299, 11, NULL, 1, 20988000, NULL, 0),
(370, 300, 11, NULL, 1, 22668000, NULL, 0),
(371, 301, 1, NULL, 1, 4536000, NULL, 0),
(372, 302, 2, NULL, 1, 1200000, NULL, 0),
(374, 304, 11, NULL, 1, 3152000, NULL, 0),
(375, 305, 1, NULL, 1, 3888000, NULL, 0),
(376, 277, 11, NULL, 1, 3348000, NULL, 0),
(377, 306, 2, NULL, 1, 5400000, NULL, 0),
(379, 307, 11, NULL, 1, 3996000, NULL, 0),
(380, 303, 11, NULL, 1, 5600000, NULL, 0),
(382, 309, 2, NULL, 1, 1500000, NULL, 0),
(384, 310, 11, NULL, 1, 18630000, NULL, 0),
(385, 311, 1, NULL, 1, 0, NULL, 0),
(386, 312, 2, NULL, 1, 600000, NULL, 0),
(387, 313, 2, NULL, 1, 750000, NULL, 0),
(388, 314, 2, NULL, 1, 750000, NULL, 0),
(390, 315, 2, NULL, 1, 750000, NULL, 0),
(391, 316, 2, NULL, 1, 480000, NULL, 0),
(392, 308, 11, NULL, 1, 7002000, NULL, 0),
(394, 318, 1, NULL, 1, 11770000, NULL, 0),
(395, 319, 2, NULL, 1, 1500000, NULL, 0),
(396, 320, 2, NULL, 1, 750000, NULL, 0),
(398, 322, 1, NULL, 1, 710000, NULL, 0),
(400, 324, 8, NULL, 1, 50000, NULL, 0),
(401, 325, 1, NULL, 1, 3500000, NULL, 0),
(402, 326, 11, NULL, 1, 8424000, NULL, 0),
(403, 327, 2, NULL, 1, 1200000, NULL, 0),
(404, 328, 11, NULL, 1, 16686000, NULL, 0),
(405, 329, 11, NULL, 1, 4978800, NULL, 0),
(406, 330, 1, NULL, 1, 972000, NULL, 0),
(408, 332, 7, NULL, 1, 50000, NULL, 0),
(409, 333, 11, NULL, 1, 3531600, NULL, 0),
(410, 334, 8, NULL, 1, 500000, NULL, 0),
(411, 335, 2, NULL, 1, 850000, NULL, 0),
(412, 336, 2, NULL, 1, 750000, NULL, 0),
(413, 337, 8, NULL, 1, 50000, NULL, 0),
(414, 338, 2, NULL, 1, 600000, NULL, 0),
(415, 339, 1, NULL, 1, 3888000, NULL, 0),
(417, 341, 3, NULL, 1, 1800000, NULL, 0),
(420, 342, 11, NULL, 1, 12096000, NULL, 0),
(424, 343, 11, NULL, 1, 21870000, NULL, 0),
(426, 344, 1, NULL, 1, 810000, NULL, 0),
(427, 345, 11, NULL, 1, 57510000, NULL, 0),
(428, 346, 1, NULL, 1, 810000, NULL, 0),
(429, 347, 1, NULL, 1, 972000, NULL, 0),
(430, 348, 1, NULL, 1, 972000, NULL, 0),
(431, 349, 2, NULL, 1, 750000, NULL, 0),
(433, 350, 11, NULL, 1, 8280000, NULL, 0),
(436, 352, 11, NULL, 1, 5175000, NULL, 0),
(437, 351, 11, NULL, 1, 13590000, NULL, 0),
(438, 353, 2, NULL, 1, 1788000, NULL, 0),
(439, 354, 11, NULL, 1, 27000000, NULL, 0),
(440, 355, 2, NULL, 1, 5040000, NULL, 0),
(441, 356, 11, NULL, 1, 22446360, NULL, 0),
(442, 357, 1, NULL, 1, 972000, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `order_payments`
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
-- Dumping data for table `order_payments`
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
(92, 177, 750000, 'staff_received', 1, '2026-06-10 11:37:33', NULL, NULL, NULL, 3, '2026-06-10 11:37:33', '[Chuyển khoản]', '[\"https://i.ibb.co/LDBTd8SD/sr-ord-177-1781066253026.jpg\"]', 0),
(93, 180, 1500000, 'staff_received', 1, '2026-06-08 09:24:23', NULL, NULL, NULL, 3, '2026-06-08 09:24:23', '[Chuyển khoản]', '[\"https://i.ibb.co/ymckJDrG/sr-ord-165-1780885458787.jpg\"]', 0),
(94, 182, 750000, 'staff_received', 1, '2026-06-09 11:46:41', NULL, NULL, NULL, 3, '2026-06-09 11:46:41', '[Chuyển khoản] ck 9.6', '[\"https://i.ibb.co/2Yg3py47/sr-ord-169-1780980395591.jpg\"]', 0),
(95, 185, 750000, 'staff_received', 1, '2026-06-10 14:52:19', NULL, NULL, NULL, 6, '2026-06-10 14:52:19', '[Chuyển khoản]', '[\"https://i.ibb.co/fd4kxycj/sr-ord-185-1781077932605.jpg\"]', 0),
(96, 191, 9720000, 'staff_received', 1, '2026-06-10 17:07:22', NULL, NULL, NULL, 6, '2026-06-10 17:07:22', '[Chuyển khoản]', NULL, 0),
(97, 197, 750000, 'staff_received', 1, '2026-06-11 09:13:32', NULL, NULL, NULL, 3, '2026-06-11 09:13:32', '[Chuyển khoản]', '[\"https://i.ibb.co/PvZqWtzn/sr-ord-197-1781144013160.jpg\"]', 0),
(98, 190, 5724000, 'staff_received', 1, '2026-06-11 10:09:33', NULL, NULL, NULL, 3, '2026-06-11 10:09:33', '[Chuyển khoản]', '[\"https://i.ibb.co/Xrbmq0sS/sr-ord-190-1781147373252.jpg\"]', 0),
(99, 199, 2640000, 'staff_received', 1, '2026-06-11 10:23:35', NULL, NULL, NULL, 3, '2026-06-11 10:23:35', '[Chuyển khoản]', '[\"https://i.ibb.co/9HBMs9S9/sr-ord-199-1781148214165.jpg\"]', 0),
(100, 195, 972000, 'admin_mark_paid', 1, '2026-06-11 10:30:36', 1, NULL, NULL, NULL, '2026-06-11 10:30:36', '[method=cash]', NULL, 0),
(101, 200, 1700000, 'staff_received', 1, '2026-06-11 14:32:54', NULL, NULL, NULL, 3, '2026-06-11 14:32:54', '[Chuyển khoản]', '[\"https://i.ibb.co/wFx4SymS/sr-ord-200-1781163172449.jpg\"]', 0),
(102, 196, 2250000, 'staff_received', 1, '2026-06-11 15:28:44', NULL, NULL, NULL, 3, '2026-06-11 15:28:44', '[Chuyển khoản]', '[\"https://i.ibb.co/fY6FH1ch/sr-ord-196-1781166489521.jpg\"]', 0),
(103, 202, 750000, 'staff_received', 1, '2026-06-12 08:55:58', NULL, NULL, NULL, 6, '2026-06-12 08:55:58', '[Chuyển khoản]', '[\"https://i.ibb.co/nq3hDRpH/sr-ord-202-1781229343351.jpg\"]', 0),
(104, 203, 849960, 'staff_collection', 1, NULL, NULL, 14, NULL, 2, '2026-06-12 14:32:08', NULL, NULL, 0),
(105, 198, 4400000, 'staff_received', 1, '2026-06-12 14:54:35', NULL, NULL, NULL, 3, '2026-06-12 14:54:35', '[Chuyển khoản]', NULL, 0),
(106, 207, 750000, 'staff_received', 1, '2026-06-12 15:35:25', NULL, NULL, NULL, 3, '2026-06-12 15:35:25', '[Chuyển khoản]', '[\"https://i.ibb.co/9HtwkSHm/sr-ord-207-1781253324906.jpg\"]', 0),
(107, 208, 969600, 'staff_received', 1, '2026-06-12 16:12:55', NULL, NULL, NULL, 3, '2026-06-12 16:12:55', '[Chuyển khoản]', NULL, 0),
(108, 209, 1700000, 'staff_received', 1, '2026-06-13 09:08:04', NULL, NULL, NULL, 3, '2026-06-13 09:08:04', '[Chuyển khoản]', '[\"https://i.ibb.co/5XWn3rk6/sr-ord-209-1781316485685.jpg\"]', 0),
(109, 211, 9072000, 'staff_received', 1, '2026-06-13 10:06:09', NULL, NULL, NULL, 3, '2026-06-13 10:06:09', '[Chuyển khoản] ck hóa đơn 340', '[\"https://i.ibb.co/HTTXzCdv/sr-ord-211-1781319972291.jpg\"]', 0),
(110, 212, 750000, 'staff_received', 1, '2026-06-15 08:35:35', NULL, NULL, NULL, 3, '2026-06-15 08:35:35', '[Chuyển khoản] HÓA ĐƠN 341', '[\"https://i.ibb.co/QvmCQyWF/sr-ord-212-1781487325852.jpg\"]', 0),
(111, 144, 7560000, 'staff_received', 1, '2026-06-15 11:07:07', NULL, NULL, NULL, 6, '2026-06-15 11:07:07', '[Chuyển khoản]', '[\"https://i.ibb.co/PG65Q86s/sr-ord-144-1781496421108.jpg\"]', 0),
(112, 142, 12659760, 'staff_received', 1, '2026-06-15 11:07:37', NULL, NULL, NULL, 6, '2026-06-15 11:07:37', '[Chuyển khoản]', '[\"https://i.ibb.co/prQ18NH0/sr-ord-142-1781496454373.jpg\"]', 0),
(113, 119, 3888000, 'staff_received', 1, '2026-06-15 11:08:31', NULL, NULL, NULL, 6, '2026-06-15 11:08:31', '[Chuyển khoản]', '[\"https://i.ibb.co/23L7HD0F/sr-ord-119-1781496509165.jpg\"]', 0),
(114, 222, 850000, 'staff_received', 1, '2026-06-15 13:34:37', NULL, NULL, NULL, 3, '2026-06-15 13:34:37', '[Chuyển khoản]', '[\"https://i.ibb.co/Y7DknhZN/sr-ord-222-1781505275464.jpg\"]', 0),
(115, 224, 972000, 'staff_collection', 1, NULL, NULL, 15, NULL, 8, '2026-06-15 18:12:08', NULL, NULL, 0),
(116, 223, 1728000, 'staff_collection', 1, NULL, NULL, 16, NULL, 8, '2026-06-15 18:18:18', NULL, NULL, 0),
(117, 216, 1393200, 'staff_received', 1, '2026-06-16 08:43:29', NULL, NULL, NULL, 3, '2026-06-16 08:43:29', '[Chuyển khoản]', '[\"https://i.ibb.co/jjDrSDt/sr-ord-216-1781574205112.jpg\"]', 0),
(118, 217, 500000, 'staff_received', 1, '2026-06-16 09:00:16', NULL, NULL, NULL, 3, '2026-06-16 09:00:16', '[Chuyển khoản]', '[\"https://i.ibb.co/5hQQFDZD/sr-ord-217-1781575213563.jpg\"]', 0),
(119, 221, 3528000, 'staff_received', 1, '2026-06-16 09:05:56', NULL, NULL, NULL, 6, '2026-06-16 09:05:56', '[Chuyển khoản]', '[\"https://i.ibb.co/cSYtxHzG/sr-ord-221-1781575553037.jpg\"]', 0),
(120, 228, 850000, 'staff_received', 1, '2026-06-16 10:05:45', NULL, NULL, NULL, 3, '2026-06-16 10:05:45', '[Chuyển khoản]', '[\"https://i.ibb.co/gLZhVJcR/sr-ord-228-1781579144194.jpg\"]', 0),
(121, 226, 2000000, 'staff_collection', 1, NULL, NULL, 17, NULL, 2, '2026-06-16 15:47:03', NULL, NULL, 0),
(122, 231, 12150000, 'staff_received', 1, '2026-06-16 15:47:59', NULL, NULL, NULL, 3, '2026-06-16 15:47:59', '[Chuyển khoản] ck hóa đơn 347', NULL, 0),
(123, 239, 750000, 'staff_received', 1, '2026-06-17 13:26:44', NULL, NULL, NULL, 3, '2026-06-17 13:26:44', '[Chuyển khoản] gh 50h24136', '[\"https://i.ibb.co/7xJkq5zJ/sr-ord-239-1781677601209.jpg\"]', 0),
(124, 240, 750000, 'staff_received', 1, '2026-06-17 13:39:33', NULL, NULL, NULL, 3, '2026-06-17 13:39:33', '[Chuyển khoản]', '[\"https://i.ibb.co/vCsv6Lkh/sr-ord-240-1781678373803.jpg\"]', 0),
(125, 245, 2764000, 'staff_received', 1, '2026-06-18 16:31:16', NULL, NULL, NULL, 3, '2026-06-18 16:31:16', '[Chuyển khoản]', NULL, 0),
(126, 246, 850000, 'staff_received', 1, '2026-06-19 08:29:52', NULL, NULL, NULL, 3, '2026-06-19 08:29:52', '[Chuyển khoản]', '[\"https://i.ibb.co/xSR68GJc/sr-ord-246-1781832590998.jpg\"]', 0),
(127, 172, 4050000, 'staff_received', 1, '2026-06-19 13:03:42', NULL, NULL, NULL, 3, '2026-06-19 13:03:42', '[Chuyển khoản]', '[\"https://i.ibb.co/WvZWJ3BL/sr-ord-172-1781849018109.jpg\"]', 0),
(128, 242, 4590000, 'staff_received', 1, '2026-06-19 13:32:47', NULL, NULL, NULL, 3, '2026-06-19 13:32:47', '[Tiền mặt]', NULL, 0),
(129, 249, 3000000, 'staff_received', 1, '2026-06-19 15:08:39', NULL, NULL, NULL, 3, '2026-06-19 15:08:39', '[Chuyển khoản]', NULL, 0),
(130, 253, 4596000, 'staff_received', 1, '2026-06-20 11:31:08', NULL, NULL, NULL, 3, '2026-06-20 11:31:08', '[Chuyển khoản]', '[\"https://i.ibb.co/yFtQqbBp/sr-ord-253-1781929867282.jpg\"]', 0),
(131, 252, 1400000, 'staff_received', 1, '2026-06-22 08:22:11', NULL, NULL, NULL, 3, '2026-06-22 08:22:11', '[Chuyển khoản]', '[\"https://i.ibb.co/R47kRs4j/sr-ord-252-1782091328102.jpg\"]', 0),
(132, 235, 3780000, 'staff_received', 1, '2026-06-22 14:13:51', NULL, NULL, NULL, 6, '2026-06-22 14:13:51', '[Chuyển khoản]', '[\"https://i.ibb.co/kV1kN9sn/sr-ord-235-1782112427434.jpg\"]', 0),
(133, 256, 8802000, 'staff_received', 1, '2026-06-22 14:37:36', NULL, NULL, NULL, 6, '2026-06-22 14:37:36', '[Chuyển khoản]', '[\"https://i.ibb.co/1YTyTLyk/sr-ord-256-1782113848089.jpg\"]', 0),
(134, 254, 5118000, 'staff_received', 1, '2026-06-22 14:59:12', NULL, NULL, NULL, 3, '2026-06-22 14:59:12', '[Chuyển khoản]', '[\"https://i.ibb.co/JRt70WDJ/sr-ord-254-1782115152281.jpg\"]', 0),
(135, 204, 750000, 'staff_received', 1, '2026-06-23 08:25:46', NULL, NULL, NULL, 3, '2026-06-23 08:25:46', '[Chuyển khoản]', '[\"https://i.ibb.co/HLsDsKqy/sr-ord-204-1782177943335.jpg\"]', 0),
(136, 258, 480000, 'staff_received', 1, '2026-06-23 08:49:19', NULL, NULL, NULL, 3, '2026-06-23 08:49:19', '[Chuyển khoản]', '[\"https://i.ibb.co/CpmR2XGw/sr-ord-258-1782179357519.jpg\"]', 0),
(137, 261, 750000, 'staff_received', 1, '2026-06-23 11:39:05', NULL, NULL, NULL, 3, '2026-06-23 11:39:05', '[Chuyển khoản]', '[\"https://i.ibb.co/gZVDWw5G/sr-ord-261-1782189541337.jpg\"]', 0),
(138, 260, 96390000, 'staff_received', 1, '2026-06-23 14:58:37', NULL, NULL, NULL, 3, '2026-06-23 14:58:37', '[Chuyển khoản]', '[\"https://i.ibb.co/pjgYPk1z/sr-ord-260-1782201513464.jpg\"]', 0),
(139, 257, 2912000, 'staff_received', 1, '2026-06-24 08:53:32', NULL, NULL, NULL, 6, '2026-06-24 08:53:32', '[Chuyển khoản]', '[\"https://i.ibb.co/9fJZz6t/sr-ord-257-1782266012986.jpg\"]', 0),
(140, 79, 12425000, 'staff_received', 1, '2026-06-24 09:08:44', NULL, NULL, NULL, 3, '2026-06-24 09:08:44', '[Chuyển khoản]', NULL, 0),
(141, 238, 6930000, 'staff_received', 1, '2026-06-24 09:24:48', NULL, NULL, NULL, 3, '2026-06-24 09:24:48', '[Chuyển khoản]', '[\"https://i.ibb.co/hxntH3v4/sr-ord-238-1782267884157.jpg\"]', 0),
(142, 158, 7056000, 'staff_received', 1, '2026-06-24 11:10:59', NULL, NULL, NULL, 3, '2026-06-24 11:10:59', '[Chuyển khoản] ck hóa đơn cty, 900k ck cá nhân', '[\"https://i.ibb.co/rKLJRyp2/sr-ord-158-1782274255867.jpg\"]', 0),
(143, 263, 5300000, 'staff_received', 1, '2026-06-24 15:10:52', NULL, NULL, NULL, 3, '2026-06-24 15:10:52', '[Chuyển khoản]', '[\"https://i.ibb.co/cK7q9qBW/sr-ord-263-1782288648333.jpg\"]', 0),
(144, 267, 972000, 'staff_received', 1, '2026-06-25 15:13:38', NULL, NULL, NULL, 3, '2026-06-25 15:13:38', '[Chuyển khoản]', '[\"https://i.ibb.co/pBH1BjM6/sr-ord-267-1782375214870.jpg\"]', 0),
(145, 269, 750000, 'staff_received', 1, '2026-06-26 09:00:05', NULL, NULL, NULL, 3, '2026-06-26 09:00:05', '[Chuyển khoản]', NULL, 0),
(146, 262, 8000000, 'staff_received', 1, '2026-06-26 09:07:48', NULL, NULL, NULL, 3, '2026-06-26 09:07:48', '[Chuyển khoản]', '[\"https://i.ibb.co/Gv4PxmwN/sr-ord-262-1782439668045.jpg\"]', 0),
(147, 210, 52920000, 'staff_received', 1, '2026-06-26 09:29:42', NULL, NULL, NULL, 3, '2026-06-26 09:29:42', '[Chuyển khoản]', '[\"https://i.ibb.co/994cNwwR/sr-ord-210-1782440978662.jpg\",\"https://i.ibb.co/q8HNk8C/sr-ord-210-1782440981486.jpg\"]', 0),
(148, 271, 2160000, 'staff_received', 1, '2026-06-26 14:44:34', NULL, NULL, NULL, 3, '2026-06-26 14:44:34', '[Chuyển khoản]', '[\"https://i.ibb.co/cKc6kCgx/sr-ord-271-1782459872448.jpg\"]', 0),
(149, 247, 750000, 'staff_received', 1, '2026-06-26 15:21:58', NULL, NULL, NULL, 3, '2026-06-26 15:21:58', '[Chuyển khoản]', '[\"https://i.ibb.co/R10Bm17/sr-ord-247-1782462116272.jpg\"]', 0),
(150, 272, 7500000, 'staff_received', 1, '2026-06-26 16:04:44', NULL, NULL, NULL, 3, '2026-06-26 16:04:44', '[Chuyển khoản]', '[\"https://i.ibb.co/TxHc74yn/sr-ord-272-1782464678572.jpg\"]', 0),
(151, 273, 750000, 'staff_received', 1, '2026-06-27 08:26:20', NULL, NULL, NULL, 3, '2026-06-27 08:26:20', '[Chuyển khoản]', '[\"https://i.ibb.co/LhDttsVc/sr-ord-273-1782523576011.jpg\"]', 0),
(152, 274, 750000, 'staff_received', 1, '2026-06-27 08:49:55', NULL, NULL, NULL, 3, '2026-06-27 08:49:55', '[Chuyển khoản]', '[\"https://i.ibb.co/XZyr1K2Y/sr-ord-274-1782524994237.jpg\"]', 0),
(153, 276, 750000, 'staff_received', 1, '2026-06-27 09:16:27', NULL, NULL, NULL, 3, '2026-06-27 09:16:27', '[Chuyển khoản]', '[\"https://i.ibb.co/MyKVYJvd/sr-ord-276-1782526585542.jpg\"]', 0),
(154, 270, 4860000, 'staff_received', 1, '2026-06-27 10:21:00', NULL, NULL, NULL, 3, '2026-06-27 10:21:00', '[Chuyển khoản]', '[\"https://i.ibb.co/nMPfTwsC/sr-ord-270-1782530457364.jpg\"]', 0),
(155, 268, 4520000, 'staff_received', 1, '2026-06-29 08:42:20', NULL, NULL, NULL, 3, '2026-06-29 08:42:20', '[Chuyển khoản]', '[\"https://i.ibb.co/1GKFV357/sr-ord-268-1782697333898.jpg\",\"https://i.ibb.co/XfGvfHyQ/sr-ord-268-1782697337524.jpg\"]', 0),
(156, 255, 750000, 'staff_received', 1, '2026-06-29 09:23:07', NULL, NULL, NULL, 3, '2026-06-29 09:23:07', '[Chuyển khoản]', '[\"https://i.ibb.co/gFFQxJSv/sr-ord-255-1782699783743.jpg\"]', 0),
(157, 279, 4000000, 'staff_received', 1, '2026-06-29 17:14:10', NULL, NULL, NULL, 3, '2026-06-29 17:14:10', '[Chuyển khoản]', '[\"https://i.ibb.co/5X3XB6ph/sr-ord-279-1782728046461.jpg\"]', 0),
(158, 282, 770000, 'staff_received', 1, '2026-06-30 10:31:25', NULL, NULL, NULL, 3, '2026-06-30 10:31:25', '[Chuyển khoản]', '[\"https://i.ibb.co/gMmVTCm4/sr-ord-282-1782790284566.jpg\"]', 0),
(159, 285, 850000, 'staff_collection', 1, NULL, NULL, 18, NULL, 2, '2026-06-30 16:42:03', NULL, NULL, 0),
(160, 287, 5500000, 'staff_received', 1, '2026-07-01 11:32:21', NULL, NULL, NULL, 6, '2026-07-01 11:32:21', '[Chuyển khoản]', '[\"https://i.ibb.co/TMNh89Zm/sr-ord-287-1782880339976.jpg\"]', 0),
(161, 292, 850000, 'staff_received', 1, '2026-07-01 11:42:56', NULL, NULL, NULL, 3, '2026-07-01 11:42:56', '[Chuyển khoản]', '[\"https://i.ibb.co/k2HLpmHT/sr-ord-292-1782880976703.jpg\"]', 0),
(162, 293, 13000000, 'staff_received', 1, '2026-07-01 11:45:11', NULL, NULL, NULL, 3, '2026-07-01 11:45:11', '[Chuyển khoản]', '[\"https://i.ibb.co/HfzXJt5c/sr-ord-293-1782881109280.jpg\",\"https://i.ibb.co/9kPtFL6d/sr-ord-293-1782881111886.jpg\"]', 0),
(163, 295, 23000000, 'staff_received', 1, '2026-07-01 17:18:46', NULL, NULL, NULL, 6, '2026-07-01 17:18:46', '[Chuyển khoản]', '[\"https://i.ibb.co/v6k0yCzF/sr-ord-295-1782901115464.jpg\"]', 0),
(164, 296, 750000, 'staff_received', 1, '2026-07-02 08:33:20', NULL, NULL, NULL, 3, '2026-07-02 08:33:20', '[Chuyển khoản]', NULL, 0),
(165, 297, 750000, 'staff_received', 1, '2026-07-02 08:34:42', NULL, NULL, NULL, 3, '2026-07-02 08:34:42', '[Chuyển khoản]', '[\"https://i.ibb.co/Z6k8mFbG/sr-ord-297-1782956084818.jpg\"]', 0),
(166, 298, 6536000, 'staff_received', 1, '2026-07-02 08:50:44', NULL, NULL, NULL, 3, '2026-07-02 08:50:44', '[Chuyển khoản]', '[\"https://i.ibb.co/gMXmkFB8/sr-ord-298-1782957042838.jpg\",\"https://i.ibb.co/TD6WR6rx/sr-ord-298-1782957045530.jpg\"]', 0),
(167, 302, 1200000, 'staff_received', 1, '2026-07-02 16:29:51', NULL, NULL, NULL, 3, '2026-07-02 16:29:51', '[Chuyển khoản]', NULL, 0),
(168, 305, 3888000, 'staff_received', 1, '2026-07-03 10:01:00', NULL, NULL, NULL, 3, '2026-07-03 10:01:00', '[Chuyển khoản]', '[\"https://i.ibb.co/zWKspsYC/sr-ord-305-1783047662429.jpg\"]', 0),
(169, 301, 4536000, 'staff_received', 1, '2026-07-03 10:09:56', NULL, NULL, NULL, 3, '2026-07-03 10:09:56', '[Chuyển khoản]', '[\"https://i.ibb.co/3t2yqf2/sr-ord-301-1783048197069.jpg\"]', 0),
(170, 306, 5400000, 'staff_received', 1, '2026-07-03 13:48:35', NULL, NULL, NULL, 6, '2026-07-03 13:48:35', '[Chuyển khoản]', '[\"https://i.ibb.co/Kzx8XzjP/sr-ord-306-1783061309111.jpg\"]', 0),
(171, 304, 3152000, 'admin_mark_paid', 1, '2026-07-03 14:51:44', 1, NULL, NULL, NULL, '2026-07-03 14:51:44', '[method=cash]', NULL, 0),
(172, 277, 3348000, 'admin_mark_paid', 1, '2026-07-03 14:52:12', 1, NULL, NULL, NULL, '2026-07-03 14:52:12', '[method=cash]', NULL, 0),
(173, 309, 1500000, 'staff_received', 1, '2026-07-04 08:26:25', NULL, NULL, NULL, 3, '2026-07-04 08:26:25', '[Chuyển khoản]', NULL, 0),
(174, 312, 600000, 'staff_received', 1, '2026-07-06 09:06:00', NULL, NULL, NULL, 6, '2026-07-06 09:06:00', '[Chuyển khoản]', '[\"https://i.ibb.co/gFyBRVQ6/sr-ord-312-1783303552616.jpg\"]', 0),
(175, 314, 750000, 'staff_received', 1, '2026-07-06 09:33:58', NULL, NULL, NULL, 6, '2026-07-06 09:33:58', '[Chuyển khoản]', '[\"https://i.ibb.co/cX8QZb5L/sr-ord-314-1783305232001.jpg\"]', 0),
(176, 313, 750000, 'staff_received', 1, '2026-07-06 09:48:32', NULL, NULL, NULL, 3, '2026-07-06 09:48:32', '[Chuyển khoản]', '[\"https://i.ibb.co/8nhVCpMF/sr-ord-313-1783306109759.jpg\"]', 0),
(177, 315, 750000, 'staff_received', 1, '2026-07-06 11:11:32', NULL, NULL, NULL, 3, '2026-07-06 11:11:32', '[Chuyển khoản]', '[\"https://i.ibb.co/35nBxK05/sr-ord-315-1783311091893.jpg\"]', 0),
(178, 316, 480000, 'staff_received', 1, '2026-07-06 14:28:01', NULL, NULL, NULL, 3, '2026-07-06 14:28:01', '[Chuyển khoản]', '[\"https://i.ibb.co/pFP8QTj/sr-ord-316-1783322877979.jpg\"]', 0),
(179, 201, 3750000, 'staff_received', 1, '2026-07-06 14:52:31', NULL, NULL, NULL, 3, '2026-07-06 14:52:31', '[Chuyển khoản]', '[\"https://i.ibb.co/tTQhK8mV/sr-ord-201-1783324349331.jpg\"]', 0),
(180, 320, 750000, 'staff_received', 1, '2026-07-07 08:30:30', NULL, NULL, NULL, 3, '2026-07-07 08:30:30', '[Chuyển khoản]', '[\"https://i.ibb.co/Gvv8BQyz/sr-ord-320-1783387827875.jpg\"]', 0),
(181, 326, 8424000, 'staff_received', 1, '2026-07-07 09:27:55', NULL, NULL, NULL, 3, '2026-07-07 09:27:55', '[Chuyển khoản]', '[\"https://i.ibb.co/gLmK9xSQ/sr-ord-326-1783391271021.jpg\"]', 0),
(182, 327, 1200000, 'staff_received', 1, '2026-07-07 10:22:07', NULL, NULL, NULL, 3, '2026-07-07 10:22:07', '[Chuyển khoản]', '[\"https://i.ibb.co/7tXSNdcR/sr-ord-327-1783394525603.jpg\"]', 0),
(183, 283, 3443000, 'admin_mark_paid', 1, '2026-07-07 15:19:57', 1, NULL, NULL, NULL, '2026-07-07 15:19:57', '[method=cash]', NULL, 0),
(184, 50, 3942000, 'admin_mark_paid', 1, '2026-07-07 21:36:13', 1, NULL, NULL, NULL, '2026-07-07 21:36:13', '[method=cash]', NULL, 0),
(185, 319, 1500000, 'staff_received', 1, '2026-07-08 08:41:26', NULL, NULL, NULL, 3, '2026-07-08 08:41:26', '[Chuyển khoản]', '[\"https://i.ibb.co/tGCDwGN/sr-ord-319-1783474880436.jpg\"]', 0),
(186, 335, 850000, 'staff_received', 1, '2026-07-08 09:27:01', NULL, NULL, NULL, 3, '2026-07-08 09:27:01', '[Chuyển khoản]', '[\"https://i.ibb.co/B53qcZ5H/sr-ord-335-1783477618173.jpg\"]', 0),
(187, 336, 750000, 'staff_received', 1, '2026-07-08 11:19:12', NULL, NULL, NULL, 3, '2026-07-08 11:19:12', '[Chuyển khoản]', '[\"https://i.ibb.co/3mLt9Wn7/sr-ord-336-1783484349059.jpg\"]', 0),
(188, 266, 52920000, 'staff_received', 1, '2026-07-08 14:49:43', NULL, NULL, NULL, 3, '2026-07-08 14:49:43', '[Chuyển khoản]', '[\"https://i.ibb.co/RktC5c0r/sr-ord-266-1783496977592.jpg\"]', 0),
(189, 343, 21870000, 'staff_received', 1, '2026-07-09 16:07:20', NULL, NULL, NULL, 3, '2026-07-09 16:07:20', '[Chuyển khoản]', '[\"https://i.ibb.co/dJ5syRCY/sr-ord-343-1783588032606.jpg\"]', 0),
(190, 341, 1800000, 'staff_collection', 1, NULL, NULL, 19, NULL, 2, '2026-07-09 18:59:08', NULL, NULL, 0),
(191, 334, 500000, 'staff_collection', 1, NULL, NULL, 20, NULL, 2, '2026-07-09 18:59:58', NULL, NULL, 0),
(192, 310, 18630000, 'admin_mark_paid', 1, '2026-07-10 11:24:29', 1, NULL, NULL, NULL, '2026-07-10 11:24:29', '[method=transfer]', '[\"https://i.ibb.co/z3fBWgN/pay-310-1783657465398.jpg\"]', 0),
(193, 303, 5600000, 'admin_mark_paid', 1, '2026-07-10 11:26:23', 1, NULL, NULL, NULL, '2026-07-10 11:26:23', '[method=cash]', '[\"https://i.ibb.co/1fTz6Z2N/pay-303-1783657586474.jpg\"]', 0),
(194, 353, 1788000, 'staff_received', 1, '2026-07-10 16:51:18', NULL, NULL, NULL, 3, '2026-07-10 16:51:18', '[Chuyển khoản]', '[\"https://i.ibb.co/9kLSFJK0/sr-ord-353-1783677074446.jpg\"]', 0),
(195, 352, 5175000, 'staff_received', 1, '2026-07-10 16:51:28', NULL, NULL, NULL, 3, '2026-07-10 16:51:28', '[Tiền mặt]', NULL, 0),
(196, 175, 54000000, 'admin_mark_paid', 1, '2026-07-11 10:58:10', 1, NULL, NULL, NULL, '2026-07-11 10:58:10', '[method=cash]', NULL, 0),
(197, 355, 5040000, 'staff_received', 1, '2026-07-11 11:30:18', NULL, NULL, NULL, 3, '2026-07-11 11:30:18', '[Chuyển khoản]', '[\"https://i.ibb.co/CK3q2c2y/sr-ord-355-1783744216982.jpg\"]', 0),
(198, 357, 972000, 'staff_received', 1, '2026-07-11 14:06:52', NULL, NULL, NULL, 3, '2026-07-11 14:06:52', '[Chuyển khoản]', '[\"https://i.ibb.co/RTwxQdqG/sr-ord-357-1783753610134.jpg\"]', 0);

-- --------------------------------------------------------

--
-- Table structure for table `order_staff_commissions`
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
-- Dumping data for table `order_staff_commissions`
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
(27, 102, 2, 150000, 'Thêm công lắp', '2026-06-02 16:35:21', 1, '2026-07-07 02:39:12', 0, NULL, NULL, 12),
(28, 142, 8, 450000, 'Lắp chung với Thoại', '2026-06-05 13:49:44', 1, NULL, 0, NULL, NULL, NULL),
(29, 151, 3, 18000, NULL, '2026-06-05 16:34:26', 1, NULL, 0, NULL, NULL, NULL),
(30, 153, 8, 180000, NULL, '2026-06-11 14:05:28', 1, NULL, 0, NULL, NULL, NULL),
(31, 162, 3, 20000, NULL, '2026-06-06 19:45:11', 1, NULL, 0, NULL, NULL, NULL),
(32, 158, 3, 20000, NULL, '2026-06-09 09:45:25', 1, NULL, 0, NULL, NULL, NULL),
(33, 100, 3, 20000, NULL, '2026-06-10 13:50:07', 1, NULL, 0, NULL, NULL, NULL),
(34, 190, 6, 20000, '', '2026-06-10 16:11:17', 1, NULL, 0, NULL, NULL, NULL),
(35, 191, 6, 20000, '', '2026-06-10 16:19:22', 1, NULL, 0, NULL, NULL, NULL),
(36, 202, 6, 7500, '', '2026-06-11 16:21:50', 1, NULL, 0, NULL, NULL, NULL),
(37, 175, 3, 20000, NULL, '2026-06-13 09:37:28', 1, NULL, 0, NULL, NULL, NULL),
(38, 211, 3, 20000, '', '2026-06-13 09:50:44', 1, NULL, 0, NULL, NULL, NULL),
(39, 235, 8, 300000, NULL, '2026-06-18 11:02:37', 1, NULL, 0, NULL, NULL, NULL),
(40, 311, 2, 200000, NULL, '2026-07-07 16:32:13', 1, NULL, 0, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `order_step_photos`
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
-- Dumping data for table `order_step_photos`
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
(74, 161, 'done', 'https://i.ibb.co/PZxFDV1V/order-161-done.jpg', NULL, 8, '2026-06-08 08:12:29', 0),
(75, 194, 'confirmed', 'https://i.ibb.co/kgfxT7N5/ff5a00d5b640.jpg', NULL, 8, '2026-06-11 07:07:17', 0),
(76, 194, 'confirmed', 'https://i.ibb.co/0VGNkMbL/6c9b77629287.jpg', NULL, 8, '2026-06-11 07:07:23', 0),
(77, 198, 'confirmed', 'https://i.ibb.co/PGpz8Yg8/bd62540d7b3e.jpg', NULL, 8, '2026-06-11 07:07:51', 0),
(78, 203, 'confirmed', 'https://i.ibb.co/8nSpyK8X/1560fe63e0b4.jpg', NULL, 2, '2026-06-12 07:31:53', 0),
(79, 203, 'confirmed', 'https://i.ibb.co/tMv3kHBB/33d7655808aa.jpg', NULL, 2, '2026-06-12 07:31:53', 0),
(80, 205, 'confirmed', 'https://i.ibb.co/hFjw4dPk/52bc54915734.jpg', NULL, 8, '2026-06-12 07:40:04', 0),
(81, 205, 'confirmed', 'https://i.ibb.co/2J5kgQ9/fb7a7fb0e57e.jpg', NULL, 8, '2026-06-12 07:40:07', 0),
(82, 205, 'confirmed', 'https://i.ibb.co/SXCpXffs/e0e91b571cd0.jpg', NULL, 8, '2026-06-12 07:40:14', 0),
(83, 215, 'confirmed', 'https://i.ibb.co/BVQhgMv6/b8aa6dda6db7.jpg', NULL, 8, '2026-06-15 02:44:40', 0),
(84, 215, 'confirmed', 'https://i.ibb.co/wNkzgMXC/f72619c82638.jpg', NULL, 8, '2026-06-15 02:44:41', 0),
(85, 215, 'confirmed', 'https://i.ibb.co/B2X4bK99/d447537f1b85.jpg', NULL, 8, '2026-06-15 02:44:42', 0),
(86, 215, 'confirmed', 'https://i.ibb.co/rRmFzPHF/0db13905302b.jpg', NULL, 8, '2026-06-15 02:44:43', 0),
(87, 218, 'confirmed', 'https://i.ibb.co/QvHGm5Yc/7824d7a8ff1a.jpg', NULL, 8, '2026-06-15 04:51:49', 0),
(88, 218, 'confirmed', 'https://i.ibb.co/tTgXwFJH/52985dadd2c0.jpg', NULL, 8, '2026-06-15 04:51:50', 0),
(89, 218, 'confirmed', 'https://i.ibb.co/FbWp4Lfm/b3fea5398e8f.jpg', NULL, 8, '2026-06-15 04:51:57', 0),
(90, 218, 'confirmed', 'https://i.ibb.co/tMb5gFw9/f747de7a33e2.jpg', NULL, 8, '2026-06-15 04:52:04', 0),
(91, 220, 'confirmed', 'https://i.ibb.co/bpBT9bX/59f9d7154cf4.jpg', NULL, 2, '2026-06-15 07:09:58', 0),
(92, 220, 'confirmed', 'https://i.ibb.co/chTj013w/aaeea92fc7a0.jpg', NULL, 2, '2026-06-15 07:09:58', 0),
(93, 224, 'confirmed', 'https://i.ibb.co/qMKh1yhd/62cd9d038d30.jpg', NULL, 8, '2026-06-15 11:11:28', 0),
(94, 224, 'confirmed', 'https://i.ibb.co/2Xrrqcq/484bbda25ff3.jpg', NULL, 8, '2026-06-15 11:11:38', 0),
(95, 224, 'confirmed', 'https://i.ibb.co/7tJhYBBM/f7367a811808.jpg', NULL, 8, '2026-06-15 11:11:47', 0),
(96, 223, 'confirmed', 'https://i.ibb.co/mCyfbdLH/6558a1b8843f.jpg', NULL, 8, '2026-06-15 11:18:04', 0),
(97, 214, 'confirmed', 'https://i.ibb.co/fdV6CY2L/9062c81ab7e9.jpg', NULL, 2, '2026-06-16 01:34:04', 0),
(98, 214, 'confirmed', 'https://i.ibb.co/LdsVLYsN/037a2ca7e572.jpg', NULL, 2, '2026-06-16 01:34:12', 0),
(99, 214, 'confirmed', 'https://i.ibb.co/tM81nw7B/232d1296878e.jpg', NULL, 2, '2026-06-16 01:34:23', 0),
(100, 225, 'confirmed', 'https://i.ibb.co/svNqVPvC/723202cb3eac.jpg', NULL, 2, '2026-06-16 01:36:46', 0),
(101, 225, 'confirmed', 'https://i.ibb.co/TMTkf0hn/76a210c79b0f.jpg', NULL, 2, '2026-06-16 01:36:48', 0),
(102, 213, 'confirmed', 'https://i.ibb.co/cKRBfZWX/cc9057f521e1.jpg', NULL, 2, '2026-06-16 01:37:38', 0),
(103, 213, 'confirmed', 'https://i.ibb.co/JRdghkH6/ad0d828c9fa0.jpg', NULL, 2, '2026-06-16 01:37:47', 0),
(104, 213, 'confirmed', 'https://i.ibb.co/0y7FXS4R/a2cf88882aea.jpg', NULL, 2, '2026-06-16 01:37:51', 0),
(105, 229, 'confirmed', 'https://i.ibb.co/67fRshDz/7c1485be7aac.jpg', NULL, 8, '2026-06-16 04:32:10', 0),
(106, 229, 'confirmed', 'https://i.ibb.co/ycDG3KzX/ca1b52e4c558.jpg', NULL, 8, '2026-06-16 04:32:14', 0),
(107, 229, 'confirmed', 'https://i.ibb.co/bMmj5vGn/1eb9de5bdfce.jpg', NULL, 8, '2026-06-16 04:32:20', 0),
(108, 229, 'confirmed', 'https://i.ibb.co/7t4KxVkF/54ae8a9dbe23.jpg', NULL, 8, '2026-06-16 04:32:26', 0),
(109, 226, 'confirmed', 'https://i.ibb.co/Q2HphrP/6f27ce651d9f.jpg', NULL, 2, '2026-06-16 06:45:13', 0),
(110, 226, 'confirmed', 'https://i.ibb.co/pv5FjVHJ/98732485ecc9.jpg', NULL, 2, '2026-06-16 06:45:15', 0),
(111, 226, 'confirmed', 'https://i.ibb.co/1Gg068Lt/22fd0cd090cf.jpg', NULL, 2, '2026-06-16 06:50:34', 0),
(112, 226, 'confirmed', 'https://i.ibb.co/7m5jMkG/f3cd1477f96c.jpg', NULL, 2, '2026-06-16 06:50:45', 0),
(113, 226, 'confirmed', 'https://i.ibb.co/DDsJytbX/fe5d2b87febd.jpg', NULL, 2, '2026-06-16 08:46:24', 0),
(114, 235, 'confirmed', 'https://i.ibb.co/yFvRdDzf/3e151404145d.jpg', NULL, 2, '2026-06-17 08:43:23', 0),
(115, 235, 'confirmed', 'https://i.ibb.co/B2rgmSM4/9ead9e1bc555.jpg', NULL, 2, '2026-06-17 08:43:26', 0),
(116, 235, 'confirmed', 'https://i.ibb.co/JRP4PGJR/fd06ba54072a.jpg', NULL, 2, '2026-06-17 08:43:31', 0),
(117, 241, 'confirmed', 'https://i.ibb.co/K8qg2CG/de9b14fe1368.jpg', NULL, 8, '2026-06-17 10:19:54', 0),
(118, 243, 'confirmed', 'https://i.ibb.co/Lh9nR1df/5c0b6e7fd1a7.jpg', NULL, 2, '2026-06-18 06:18:51', 0),
(119, 243, 'confirmed', 'https://i.ibb.co/XZd5nw8V/e65af8f8080b.jpg', NULL, 2, '2026-06-18 06:18:53', 0),
(120, 265, 'confirmed', 'https://i.ibb.co/qLZBbKRs/2d3a93c7db78.jpg', NULL, 8, '2026-06-25 02:07:28', 0),
(121, 265, 'confirmed', 'https://i.ibb.co/kpygWB2/03cb98ef6d58.jpg', NULL, 8, '2026-06-25 02:07:30', 0),
(122, 265, 'confirmed', 'https://i.ibb.co/0j9mhG6K/53ebeec30ce3.jpg', NULL, 8, '2026-06-25 02:07:38', 0),
(123, 267, 'confirmed', 'https://i.ibb.co/7J1X06YJ/83c50e4f9ff0.jpg', NULL, 8, '2026-06-25 09:28:44', 0),
(124, 267, 'confirmed', 'https://i.ibb.co/ZzjXZgqy/0e8aa6742d1f.jpg', NULL, 8, '2026-06-25 09:28:48', 0),
(125, 267, 'confirmed', 'https://i.ibb.co/4RLTJVtn/9cae952af2bd.jpg', NULL, 8, '2026-06-25 09:28:56', 0),
(126, 268, 'confirmed', 'https://i.ibb.co/sdd7QyD9/b4fec4a423a4.jpg', NULL, 8, '2026-06-27 06:10:56', 0),
(127, 285, 'done', 'https://i.ibb.co/RpMr1Fkg/order-285-done.jpg', NULL, 2, '2026-06-30 09:42:11', 0),
(128, 285, 'done', 'https://i.ibb.co/MDRQ00TS/order-285-done.jpg', NULL, 2, '2026-06-30 09:42:14', 0),
(129, 292, 'confirmed', 'https://i.ibb.co/q3pXYLxB/8f4097644f96.jpg', NULL, 8, '2026-07-01 10:26:12', 0),
(130, 292, 'confirmed', 'https://i.ibb.co/k2yKP5vX/6c72d75881c5.jpg', NULL, 8, '2026-07-01 10:26:15', 0),
(131, 278, 'done', 'https://i.ibb.co/h1cw9PTw/order-278-done.jpg', NULL, 8, '2026-07-01 10:27:34', 0),
(132, 278, 'done', 'https://i.ibb.co/4nBkfG09/order-278-done.jpg', NULL, 8, '2026-07-01 10:27:35', 0),
(133, 278, 'done', 'https://i.ibb.co/HDXySLN7/order-278-done.jpg', NULL, 8, '2026-07-01 10:27:36', 0),
(134, 278, 'done', 'https://i.ibb.co/qL83Qyvd/order-278-done.jpg', NULL, 8, '2026-07-01 10:27:37', 0),
(135, 278, 'done', 'https://i.ibb.co/xtHYCbZG/order-278-done.jpg', NULL, 8, '2026-07-01 10:27:40', 0),
(136, 278, 'done', 'https://i.ibb.co/PsWNV89X/order-278-done.jpg', NULL, 8, '2026-07-01 10:27:42', 0),
(137, 301, 'done', 'https://i.ibb.co/bMSjfx91/order-301-done.jpg', NULL, 8, '2026-07-02 11:34:29', 0),
(138, 305, 'done', 'https://i.ibb.co/k2r1ptsz/order-305-done.jpg', NULL, 8, '2026-07-03 03:01:42', 0),
(139, 305, 'done', 'https://i.ibb.co/tMzbSNmv/order-305-done.jpg', NULL, 8, '2026-07-03 03:01:43', 0),
(140, 305, 'done', 'https://i.ibb.co/YBpT2mCL/order-305-done.jpg', NULL, 8, '2026-07-03 03:01:46', 0),
(141, 311, 'confirmed', 'https://i.ibb.co/BKdRngYS/5a868544a989.jpg', NULL, 2, '2026-07-06 05:15:22', 0),
(142, 311, 'confirmed', 'https://i.ibb.co/9HVRfpfg/b76834e994d4.jpg', NULL, 2, '2026-07-06 05:15:29', 0),
(143, 290, 'confirmed', 'https://i.ibb.co/SXY1VWMC/59a01c9b3037.jpg', NULL, 2, '2026-07-06 05:21:59', 0),
(144, 290, 'confirmed', 'https://i.ibb.co/chQ8jV9Q/bfd18171d8f5.jpg', NULL, 2, '2026-07-06 05:22:02', 0),
(145, 280, 'confirmed', 'https://i.ibb.co/KjsjN2MJ/e9ff2090f777.jpg', NULL, 2, '2026-07-06 05:26:19', 0),
(146, 280, 'confirmed', 'https://i.ibb.co/yFm0JcxJ/88a8d895df55.jpg', NULL, 2, '2026-07-06 05:26:20', 0),
(147, 325, 'done', 'https://i.ibb.co/KzhBWyVH/order-325-done.jpg', NULL, 8, '2026-07-07 05:20:39', 0),
(148, 325, 'done', 'https://i.ibb.co/60PLZsDK/order-325-done.jpg', NULL, 8, '2026-07-07 05:20:43', 0),
(149, 324, 'done', 'https://i.ibb.co/FkL9j6LR/order-324-done.jpg', NULL, 8, '2026-07-07 05:21:24', 0),
(150, 322, 'done', 'https://i.ibb.co/vxKKQRj0/order-322-done.jpg', NULL, 8, '2026-07-07 05:22:00', 0),
(151, 322, 'done', 'https://i.ibb.co/rrHXpPb/order-322-done.jpg', NULL, 8, '2026-07-07 05:22:02', 0),
(152, 318, 'confirmed', 'https://i.ibb.co/7JfpY107/96061319532d.jpg', NULL, 2, '2026-07-07 09:21:02', 0),
(153, 318, 'confirmed', 'https://i.ibb.co/cKt6X04B/ac94feabb441.jpg', NULL, 2, '2026-07-07 09:21:09', 0),
(154, 318, 'confirmed', 'https://i.ibb.co/kg9rPFKt/b842dadcfba2.jpg', NULL, 2, '2026-07-07 09:21:24', 0),
(155, 318, 'confirmed', 'https://i.ibb.co/qFFqw1y6/889977f75357.jpg', NULL, 2, '2026-07-07 09:21:33', 0),
(156, 318, 'confirmed', 'https://i.ibb.co/fdc3SQKp/825e193885fe.jpg', NULL, 2, '2026-07-07 09:21:41', 0),
(157, 318, 'done', 'https://i.ibb.co/PvJXJwBg/256558c904a9.jpg', NULL, 2, '2026-07-07 09:23:11', 0),
(158, 337, 'done', 'https://i.ibb.co/GvtWppZy/order-337-done.jpg', NULL, 8, '2026-07-08 07:54:08', 0),
(159, 337, 'done', 'https://i.ibb.co/8gb38D5g/order-337-done.jpg', NULL, 8, '2026-07-08 07:54:10', 0),
(160, 341, 'confirmed', 'https://i.ibb.co/Z6G2Tk7g/498de90f75b0.jpg', NULL, 2, '2026-07-09 11:58:54', 0),
(161, 341, 'confirmed', 'https://i.ibb.co/bMFXThMF/58e9f3e7a207.jpg', NULL, 2, '2026-07-09 11:59:00', 0),
(162, 339, 'confirmed', 'https://i.ibb.co/7NK8k02y/f07e2efbb4e0.jpg', NULL, 2, '2026-07-09 12:00:15', 0),
(163, 339, 'confirmed', 'https://i.ibb.co/VRmxvZX/6898a80c30e6.jpg', NULL, 2, '2026-07-09 12:00:20', 0),
(164, 346, 'done', 'https://i.ibb.co/Cs3Kdc5M/order-346-done.jpg', NULL, 8, '2026-07-10 01:39:36', 0),
(165, 346, 'done', 'https://i.ibb.co/hRc8y362/order-346-done.jpg', NULL, 8, '2026-07-10 01:39:38', 0),
(166, 357, 'done', 'https://i.ibb.co/0Vds67y4/2b7ff05d97e9.jpg', NULL, 8, '2026-07-11 10:39:30', 0),
(167, 357, 'done', 'https://i.ibb.co/nqkfjg47/3ea571199f2f.jpg', NULL, 8, '2026-07-11 10:39:34', 0);

-- --------------------------------------------------------

--
-- Table structure for table `order_templates`
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
-- Dumping data for table `order_templates`
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
-- Table structure for table `order_template_fields`
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
-- Table structure for table `order_warranty_items`
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

--
-- Dumping data for table `order_warranty_items`
--

INSERT INTO `order_warranty_items` (`id`, `order_id`, `item_role`, `handling_type`, `customer_status`, `product_id`, `supplier_id`, `replacement_product_id`, `replacement_source_scope`, `replacement_staff_id`, `source_stock_scope`, `source_staff_id`, `qty`, `device_name`, `serial_no`, `imei`, `license_plate`, `account_name`, `sim_number`, `condition_note`, `note_text`, `additional_cost`, `charge_ref_id`, `current_status`, `current_location`, `holder_staff_id`, `last_supplier_id`, `last_move_at`, `release_receipt_id`, `completed_at`, `completed_by_staff_id`, `is_deleted`, `created_at`, `updated_at`) VALUES
(49, 206, 'faulty', 'pending', 'pending', 38, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 'intake', 'customer', NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-06-12 14:16:03', '2026-06-12 14:16:03'),
(50, 232, 'faulty', 'pending', 'pending', 42, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 'intake', 'customer', NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-06-16 15:53:54', '2026-06-16 15:53:54'),
(51, 233, 'faulty', 'supplier_return', 'pending', 5, NULL, NULL, NULL, NULL, NULL, NULL, 2, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 'company_warranty_stock', 'company_warranty_stock', NULL, NULL, '2026-06-17 11:07:38', NULL, NULL, NULL, 0, '2026-06-16 16:00:51', '2026-06-17 11:07:38'),
(52, 233, 'faulty', 'supplier_return', 'pending', 2, NULL, NULL, NULL, NULL, NULL, NULL, 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 'company_warranty_stock', 'company_warranty_stock', NULL, NULL, '2026-06-17 11:07:47', NULL, NULL, NULL, 0, '2026-06-16 16:00:51', '2026-06-17 11:07:47'),
(53, 233, 'faulty', 'supplier_return', 'pending', 6, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 'company_warranty_stock', 'company_warranty_stock', NULL, NULL, '2026-06-17 11:07:54', NULL, NULL, NULL, 0, '2026-06-16 16:00:51', '2026-06-17 11:07:54'),
(54, 236, 'faulty', 'pending', 'pending', 11, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 'intake', 'customer', NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-06-16 17:11:11', '2026-06-16 17:11:11'),
(56, 332, 'faulty', 'tech_fix', 'completed', 24, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, 'delivered', 'customer_returned', NULL, NULL, '2026-07-07 18:44:27', NULL, NULL, 8, 0, '2026-07-07 16:58:29', '2026-07-07 18:44:27');

-- --------------------------------------------------------

--
-- Table structure for table `order_warranty_meta`
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

--
-- Dumping data for table `order_warranty_meta`
--

INSERT INTO `order_warranty_meta` (`order_id`, `warranty_mode`, `default_supplier_id`, `current_stage`, `note_text`, `needs_review`, `created_at`, `updated_at`) VALUES
(206, 'repair', NULL, 'intake', NULL, 0, '2026-06-12 14:16:03', '2026-06-12 14:16:03'),
(232, 'repair', NULL, 'intake', NULL, 0, '2026-06-16 15:53:54', '2026-06-16 15:53:54'),
(233, 'repair', NULL, 'company_warranty_stock', NULL, 0, '2026-06-16 16:00:51', '2026-06-17 11:07:38'),
(236, 'repair', NULL, 'intake', NULL, 0, '2026-06-16 17:11:11', '2026-06-16 17:11:11'),
(332, 'repair', NULL, 'completed', NULL, 0, '2026-07-07 16:58:29', '2026-07-07 18:44:27');

-- --------------------------------------------------------

--
-- Table structure for table `order_warranty_moves`
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

--
-- Dumping data for table `order_warranty_moves`
--

INSERT INTO `order_warranty_moves` (`id`, `order_id`, `warranty_item_id`, `action_code`, `from_location`, `to_location`, `qty`, `product_id`, `supplier_id`, `holder_staff_id`, `receipt_id`, `note_text`, `photo_urls`, `occurred_at`, `created_by_staff_id`, `created_at`) VALUES
(97, 233, 51, 'receive_from_customer', 'customer', 'technician', 2, 5, NULL, NULL, NULL, NULL, NULL, '2026-06-17 11:07:37', 1, '2026-06-17 11:07:37'),
(98, 233, 51, 'move_to_company_stock', 'technician', 'company_warranty_stock', 2, 5, NULL, NULL, NULL, NULL, NULL, '2026-06-17 11:07:38', 1, '2026-06-17 11:07:38'),
(99, 233, 52, 'receive_from_customer', 'customer', 'technician', 3, 2, NULL, NULL, NULL, NULL, NULL, '2026-06-17 11:07:47', 1, '2026-06-17 11:07:47'),
(100, 233, 52, 'move_to_company_stock', 'technician', 'company_warranty_stock', 3, 2, NULL, NULL, NULL, NULL, NULL, '2026-06-17 11:07:47', 1, '2026-06-17 11:07:47'),
(101, 233, 53, 'receive_from_customer', 'customer', 'technician', 1, 6, NULL, NULL, NULL, NULL, NULL, '2026-06-17 11:07:54', 1, '2026-06-17 11:07:54'),
(102, 233, 53, 'move_to_company_stock', 'technician', 'company_warranty_stock', 1, 6, NULL, NULL, NULL, NULL, NULL, '2026-06-17 11:07:54', 1, '2026-06-17 11:07:54'),
(103, 332, 56, 'mark_fixed', 'customer', 'customer_returned', 1, 24, NULL, NULL, NULL, NULL, NULL, '2026-07-07 18:44:27', 8, '2026-07-07 18:44:27');

-- --------------------------------------------------------

--
-- Table structure for table `order_workflow_steps`
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
-- Table structure for table `payment_receipts`
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
-- Dumping data for table `payment_receipts`
--

INSERT INTO `payment_receipts` (`id`, `code`, `request_id`, `amount`, `pay_method`, `receipt_url`, `note`, `created_by`, `created_at`, `is_deleted`) VALUES
(4, 'HD-2405-001', 12, 5000000, 'cash', NULL, 'Trả trước', 1, '2026-05-24 21:02:22', 0),
(5, 'HD-2805-001', 16, 12546000, 'cash', NULL, 'Ghi nhận thu 12.546.000đ lúc 15:03 ngày 28/05/2026', 1, '2026-05-28 15:03:50', 0),
(6, 'HD-0307-001', 26, 2000, 'cash', NULL, 'Ghi nhận thu 2.000đ lúc 09:07 ngày 03/07/2026', 1, '2026-07-03 09:07:50', 0),
(7, 'HD-0507-001', 27, 600000, 'cash', NULL, 'Ghi nhận thu 600.000đ lúc 21:46 ngày 05/07/2026', 1, '2026-07-05 21:46:21', 0),
(8, 'HD-0607-001', 28, 100000, 'cash', NULL, 'Ghi nhận thu 100.000đ lúc 22:05 ngày 06/07/2026', 1, '2026-07-06 22:05:18', 0),
(9, 'HD-0607-002', 30, 810000, 'cash', NULL, 'Ghi nhận thu 810.000đ lúc 22:10 ngày 06/07/2026', 1, '2026-07-06 22:10:22', 0),
(10, 'HD-0707-001', 32, 972000, 'cash', NULL, 'Ghi nhận thu 972.000đ lúc 14:22 ngày 07/07/2026', 1, '2026-07-07 14:22:06', 0);

-- --------------------------------------------------------

--
-- Table structure for table `payment_requests`
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
-- Dumping data for table `payment_requests`
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
(22, 'YC-0606-001', 52, 8316000, 8316000, 0, 'paid', NULL, 'transfer', NULL, NULL, 3, '2026-06-06 09:48:20', NULL, '2026-06-06 09:48:48', 0),
(23, 'YC-1106-001', 29, 16826000, 16826000, 0, 'paid', NULL, 'transfer', NULL, NULL, 3, '2026-06-11 08:30:18', NULL, '2026-06-11 08:30:47', 0),
(24, 'YC-1906-001', 64, 7390000, 7390000, 0, 'paid', NULL, 'transfer', NULL, NULL, 3, '2026-06-19 17:25:44', NULL, '2026-06-19 17:26:22', 0),
(25, 'YC-0307-001', 42, 150000, 0, 150000, 'pending', NULL, NULL, NULL, NULL, 1, '2026-07-03 09:07:27', NULL, NULL, 0),
(26, 'YC-0307-002', 40, 2000, 2000, 0, 'paid', NULL, 'cash', NULL, NULL, 1, '2026-07-03 09:07:47', NULL, '2026-07-03 09:07:50', 0),
(27, 'YC-0507-001', 148, 600000, 600000, 0, 'paid', NULL, 'cash', NULL, NULL, 1, '2026-07-05 21:46:12', NULL, '2026-07-05 21:46:21', 0),
(28, 'YC-0607-001', 101, 100000, 100000, 0, 'paid', NULL, 'cash', NULL, NULL, 1, '2026-07-06 22:05:15', NULL, '2026-07-06 22:05:18', 0),
(29, 'YC-0607-002', 111, 972000, 0, 0, 'superseded', NULL, NULL, NULL, NULL, 1, '2026-07-06 22:07:29', NULL, NULL, 0),
(30, 'YC-0607-003', 93, 810000, 810000, 0, 'paid', NULL, 'cash', NULL, NULL, 1, '2026-07-06 22:09:40', NULL, '2026-07-06 22:10:22', 0),
(31, 'YC-0607-004', 160, 972000, 0, 972000, 'pending', NULL, NULL, NULL, NULL, 1, '2026-07-06 22:11:19', NULL, NULL, 0),
(32, 'YC-0707-001', 111, 972000, 972000, 0, 'paid', NULL, 'cash', NULL, NULL, 1, '2026-07-07 14:22:00', NULL, '2026-07-07 14:22:06', 0),
(33, 'YC-0707-002', 182, 3500000, 0, 3500000, 'pending', NULL, NULL, NULL, NULL, 1, '2026-07-07 14:40:09', NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `payment_request_items`
--

CREATE TABLE `payment_request_items` (
  `id` int(11) NOT NULL,
  `request_id` int(11) NOT NULL,
  `target_type` enum('order','warranty','opening_balance','payment_request') NOT NULL,
  `target_id` int(11) DEFAULT NULL,
  `amount` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_request_items`
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
(47, 22, 'order', 156, 216000),
(48, 23, 'opening_balance', 29, 16826000),
(49, 24, 'opening_balance', 64, 7390000),
(50, 25, 'order', 123, 150000),
(51, 26, 'opening_balance', 40, 2000),
(52, 27, 'order', 248, 600000),
(53, 28, 'order', 161, 100000),
(54, 29, 'order', 179, 972000),
(55, 30, 'order', 147, 810000),
(56, 31, 'order', 280, 972000),
(57, 32, 'payment_request', 29, 972000),
(58, 33, 'order', 325, 3500000);

-- --------------------------------------------------------

--
-- Table structure for table `price_tiers`
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
-- Dumping data for table `price_tiers`
--

INSERT INTO `price_tiers` (`id`, `code`, `name`, `sort_order`, `is_default`, `is_deleted`) VALUES
(1, 'retail', 'Bán lẻ', 1, 0, 0),
(2, 'wholesale', 'Đại lý cấp 1', 2, 0, 0),
(3, 'dealer', 'Đại lý', 3, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `products`
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
-- Dumping data for table `products`
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
(14, 'AHD262', 'Camera quan sát lắp trong cabin ô tô GT-AHD262', 1, '/uploads/products/1779681025623-e094aee044fa.jpg', '/uploads/products/1779681025661-16c1b86ade33.jpg', 12, 378000, NULL, 0),
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
(39, 'ITEL', 'SIM ITEL', 2, NULL, NULL, 12, 40000, NULL, 0),
(40, 'INET03', 'Thiết bị giám sát hành trình INET03', 6, NULL, NULL, 12, 280000, NULL, 0),
(41, 'VINA', 'SIM ĐỊNH VỊ VINA', 2, NULL, NULL, 12, 0, NULL, 0),
(42, 'PHICAMERA', 'Phí dịch vụ camera', 4, NULL, NULL, 12, 450000, NULL, 0),
(43, 'L10', 'Cảm biến mức dầu Model: LIGO-BLE-PRO-RS232L10', 5, NULL, NULL, 12, 1600000, NULL, 0),
(44, '8th', 'Dịch vụ phần mềm quản lý giám sát phương tiện 08 tháng (gói combo Plus 2)', 4, NULL, NULL, 12, 0, NULL, 0),
(45, 'DI CHUYỂN', 'Phí di chuyển', 4, NULL, NULL, 12, 100000, NULL, 0),
(46, 'RS23215', 'Cảm biến mức dầu Model: LIGO BLE-PRO- RS232L15', 5, NULL, NULL, 12, 1450000, NULL, 0),
(47, 'AIRL7S', 'Cảm biến mức dầu Model: LIGO AIR - L7S', 5, NULL, NULL, 12, 1296000, NULL, 0),
(48, 'adater', 'Ligo Air Adapter sử dụng cho RS232', 5, NULL, NULL, 12, 0, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `product_attributes`
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
-- Dumping data for table `product_attributes`
--

INSERT INTO `product_attributes` (`id`, `product_id`, `label`, `value`, `sort_order`, `position`) VALUES
(7, 2, 'Nhiệt độ Hoạt động', '-20÷85oC ±0.5%', 1, 'top'),
(8, 2, 'Độ ẩm', '5÷95%', 2, 'top'),
(9, 2, 'Dải hoạt động', '', 3, 'top');

-- --------------------------------------------------------

--
-- Table structure for table `product_blocks`
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
-- Dumping data for table `product_blocks`
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
-- Table structure for table `product_prices`
--

CREATE TABLE `product_prices` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `tier_id` int(11) NOT NULL,
  `price` bigint(20) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_prices`
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
(165, 4, 3, 2322000, 3),
(166, 14, 1, 650000, 1),
(167, 14, 2, 432000, 2),
(168, 14, 3, 464400, 3);

-- --------------------------------------------------------

--
-- Table structure for table `product_stock`
--

CREATE TABLE `product_stock` (
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_stock`
--

INSERT INTO `product_stock` (`product_id`, `quantity`) VALUES
(1, 200),
(2, 135),
(3, 16),
(4, 8),
(5, 16),
(6, 30),
(7, 100),
(8, 8),
(9, 9),
(10, 20),
(11, 0),
(12, 25),
(13, 19),
(14, 17),
(15, 3),
(16, 3),
(17, 1038),
(18, 976),
(19, 1),
(20, 53),
(22, 12),
(23, 27),
(24, 800),
(25, 1032),
(26, 992),
(27, 16),
(28, 71),
(29, 100),
(30, 20),
(31, 4),
(32, 999),
(33, 994),
(34, 249),
(35, 11),
(36, 2),
(37, 28),
(38, 100),
(39, 425),
(40, 134),
(41, 100),
(42, 98),
(43, 8),
(44, 99),
(45, 1000),
(46, 0),
(47, 0),
(48, 0);

-- --------------------------------------------------------

--
-- Table structure for table `release_pool`
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
-- Table structure for table `remittances`
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
-- Dumping data for table `remittances`
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
-- Table structure for table `staff`
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
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`id`, `username`, `password_hash`, `full_name`, `role`, `area`, `phone`, `cccd`, `email`, `avatar_url`, `is_deleted`, `created_at`, `updated_at`, `online_status`, `rating`, `opening_balance`) VALUES
(1, 'admin', '$2a$10$jAwDo3dwlc9qsmasMlTcSeBx1.ESciWJ1Zf6BZWGVs/hm2FZbFb6u', 'Quan tri vien', 'admin', NULL, NULL, NULL, NULL, NULL, 0, '2026-05-18 09:52:01', '2026-05-18 09:52:01', 'offline', 0.00, 0),
(2, 'ktv885380', '$2a$10$OSN.O2VlA3QtiKqlSxSVkuB.gGJzugHOSd65fFWvUQvPM8gMiIATy', 'Nguyễn Lý Thoại', 'kithuat', NULL, '0867948490', '080097000846', 'lythoai301599812@gmail.com', NULL, 0, '2026-05-18 10:37:35', '2026-06-12 07:34:12', 'offline', 0.00, 0),
(3, 'nv224895', '$2a$10$c0jC7Fx8rpZm/2p3kZqj.u5gT68.fNIYdTM1SmbhmL9Ji9l2mCpHe', 'Phương Quyên', 'staff', NULL, '0942155160', NULL, NULL, NULL, 0, '2026-05-18 12:54:39', '2026-05-19 14:17:07', 'offline', 0.00, 0),
(6, 'nv409671', '$2a$10$FlLgGfU1hYDHy94gqCZh2Oipg3XE6.su9X08FlpwwMENU5BYNTsuu', 'Như', 'staff', NULL, '0961813181', NULL, NULL, NULL, 0, '2026-05-21 01:47:35', '2026-05-21 01:47:35', 'offline', 0.00, 0),
(7, 'ktv840743', '$2a$10$ivyNl./Ethvx1GWjbFLOqOxy.MNzVqZFhuwGGPi4MDqk8VR6UZ15S', 'nhân sự của dân test', 'kithuat', NULL, NULL, NULL, NULL, '/uploads/avatars/1779467215905-42a3cc3a6190.png', 0, '2026-05-21 08:10:03', '2026-05-23 04:34:43', 'offline', 0.00, 0),
(8, 'ktv157123', '$2a$10$iX9qeFhy1NzKU1Jjl0MO/OfLHWxETu8GyuO1p6M8Pq.eJtHniax3G', 'Trần Quốc Viện', 'kithuat', NULL, '0949095858', NULL, NULL, NULL, 0, '2026-05-21 08:20:40', '2026-06-06 05:52:04', 'offline', 0.00, 0);

-- --------------------------------------------------------

--
-- Table structure for table `staff_advances`
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
-- Dumping data for table `staff_advances`
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
-- Table structure for table `staff_holdings`
--

CREATE TABLE `staff_holdings` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL,
  `first_held_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `staff_holdings`
--

INSERT INTO `staff_holdings` (`id`, `staff_id`, `product_id`, `qty`, `first_held_at`) VALUES
(10, 2, 2, 7, '2026-05-19 22:34:23'),
(12, 8, 2, 5, '2026-05-21 15:33:58'),
(13, 8, 8, 2, '2026-05-21 15:33:58'),
(18, 7, 8, 1, '2026-05-23 03:05:02'),
(23, 8, 16, 1, '2026-05-26 10:13:42'),
(29, 7, 33, 5, '2026-06-04 16:59:52'),
(31, 2, 5, 2, '2026-06-04 18:00:54'),
(34, 2, 28, 9, '2026-06-04 18:00:54'),
(35, 2, 31, 8, '2026-06-04 18:00:54'),
(42, 2, 9, 1, '2026-06-04 18:01:03'),
(45, 8, 10, 2, '2026-06-11 08:33:06'),
(46, 8, 28, 8, '2026-06-11 08:33:06'),
(47, 8, 31, 6, '2026-06-11 08:33:06'),
(48, 8, 15, 2, '2026-06-11 08:33:08'),
(50, 8, 4, 3, '2026-06-11 08:33:10'),
(53, 8, 12, 2, '2026-06-11 08:33:10'),
(61, 2, 10, 6, '2026-06-29 14:17:49'),
(62, 2, 4, 1, '2026-06-29 14:17:50'),
(64, 2, 40, 4, '2026-06-30 13:33:05'),
(65, 8, 40, 5, '2026-07-02 14:42:13'),
(70, 2, 27, 1, '2026-07-04 09:06:20'),
(73, 8, 24, 99, '2026-07-07 16:59:01'),
(74, 2, 24, 99, '2026-07-07 16:59:12'),
(77, 8, 23, 2, '2026-07-10 11:38:53');

-- --------------------------------------------------------

--
-- Table structure for table `staff_payroll_adjustments`
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
-- Dumping data for table `staff_payroll_adjustments`
--

INSERT INTO `staff_payroll_adjustments` (`id`, `staff_id`, `type`, `label`, `amount`, `sort_order`, `is_deleted`, `created_at`) VALUES
(1, 7, 'extra', '', 0, 0, 1, '2026-05-22 23:32:10'),
(2, 7, 'extra', 'tiền cộng cho đơn A mà quên', 0, 0, 1, '2026-05-22 23:32:23'),
(3, 7, 'extra', 'tiền cộng cho đơn A mà quên', 100000, 0, 1, '2026-05-22 23:32:26'),
(4, 7, 'extra', 'tiền cộng cho đơn A mà quên', 100000, 0, 1, '2026-05-22 23:32:27'),
(5, 7, 'extra', '', 0, 1, 1, '2026-05-22 23:32:27'),
(6, 7, 'extra', 'tiền cộng cho đơn A mà quên', 1000000, 0, 1, '2026-05-22 23:32:38'),
(7, 7, 'extra', '', 0, 1, 1, '2026-05-22 23:32:38'),
(8, 8, 'deduction', '', 0, 0, 0, '2026-06-06 12:56:20');

-- --------------------------------------------------------

--
-- Table structure for table `staff_payroll_periods`
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
-- Table structure for table `staff_payslips`
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
-- Dumping data for table `staff_payslips`
--

INSERT INTO `staff_payslips` (`id`, `staff_id`, `from_date`, `to_date`, `base_salary`, `extras_json`, `deductions_json`, `carried_debt`, `rows_json`, `total_wage`, `total_extras`, `total_deductions`, `gross_amount`, `note`, `finalized_at`, `finalized_by`, `paid_amount`, `paid_at`, `paid_by`, `paid_note`, `remaining_debt`, `debt_absorbed`, `is_deleted`, `total_advances`, `advances_json`) VALUES
(2, 6, '2026-05-21', '2026-05-23', 0, '[]', '[]', 0, '[{\"order_id\":1,\"sc_id\":1,\"code\":\"ORD-2105-001\",\"date\":\"2026-05-21 16:09:51\",\"service\":\"Lắp mới\",\"bien_so\":\"\",\"imei\":\"\",\"tai_khoan\":\"\",\"revenue\":3600000,\"wage\":0,\"commission\":500000,\"pay_note\":\"\",\"row_type\":\"commission\"},{\"order_id\":10,\"sc_id\":6,\"code\":\"ORD-2105-007\",\"date\":\"2026-05-21 18:07:46\",\"service\":\"Lắp mới\",\"bien_so\":\"\",\"imei\":\"\",\"tai_khoan\":\"\",\"revenue\":1620000,\"wage\":0,\"commission\":300000,\"pay_note\":\"\",\"row_type\":\"commission\"}]', 800000, 0, 0, 700000, '', '2026-05-23 00:49:26', 6, 0, NULL, NULL, NULL, 0, 0, 0, 100000, '[{\"id\":7,\"amount\":100000,\"note\":null,\"created_at\":\"2026-05-21 19:44:50\"}]'),
(3, 7, '2026-06-06', '2026-07-06', 0, '[{\"label\":\"tiền cộng cho đơn A mà quên\",\"amount\":1000000}]', '[]', 0, '[]', 0, 1000000, 0, 770000, '', '2026-07-06 23:53:35', 1, 0, NULL, NULL, NULL, 0, 0, 0, 230000, '[{\"id\":1,\"amount\":100000,\"note\":null,\"created_at\":\"2026-05-21 17:03:45\"},{\"id\":2,\"amount\":100000,\"note\":\"ăn mì tôm\",\"created_at\":\"2026-05-21 17:04:34\"},{\"id\":3,\"amount\":10000,\"note\":null,\"created_at\":\"2026-05-21 17:29:46\"},{\"id\":4,\"amount\":20000,\"note\":null,\"created_at\":\"2026-05-21 17:33:51\"}]'),
(12, 2, '2026-05-27', '2026-07-07', 0, '[]', '[]', 0, '[{\"order_id\":57,\"code\":\"ORD-2605-005\",\"date\":\"2026-05-27 15:20:09\",\"service\":\"Lắp mới\",\"bien_so\":\"\",\"imei\":\"\",\"tai_khoan\":\"\",\"revenue\":972000,\"wage\":100000,\"commission\":0,\"pay_note\":\"27/5 TM 972.000đ\",\"row_type\":\"order\"},{\"order_id\":91,\"code\":\"ORD-2905-006\",\"date\":\"2026-05-29 13:53:24\",\"service\":\"Lắp mới\",\"bien_so\":\"\",\"imei\":\"\",\"tai_khoan\":\"\",\"revenue\":810000,\"wage\":100000,\"commission\":0,\"pay_note\":\"29/5 TM 810.000đ\",\"row_type\":\"order\"},{\"order_id\":94,\"code\":\"ORD-3005-001\",\"date\":\"2026-05-30 09:01:31\",\"service\":\"Lắp mới\",\"bien_so\":\"50E-149.46\",\"imei\":\"\",\"tai_khoan\":\"Vantaihuunguyen\",\"revenue\":972000,\"wage\":100000,\"commission\":0,\"pay_note\":\"\",\"row_type\":\"order\"},{\"order_id\":102,\"code\":\"ORD-0106-001\",\"date\":\"2026-06-01 15:09:26\",\"service\":\"Lắp mới\",\"bien_so\":\"51B03352, \",\"imei\":\"\",\"tai_khoan\":\"kietvo, \",\"revenue\":3000000,\"wage\":0,\"commission\":0,\"pay_note\":\"1/6 CK 3.000.000đ\",\"row_type\":\"order\"},{\"order_id\":102,\"sc_id\":27,\"code\":\"ORD-0106-001\",\"date\":\"2026-06-02 16:35:21\",\"service\":\"Lắp mới\",\"bien_so\":\"\",\"imei\":\"\",\"tai_khoan\":\"\",\"revenue\":3000000,\"wage\":0,\"commission\":150000,\"pay_note\":\"Thêm công lắp\",\"row_type\":\"commission\"},{\"order_id\":127,\"code\":\"ORD-0306-009\",\"date\":\"2026-06-03 15:14:15\",\"service\":\"Lắp mới\",\"bien_so\":\"51g90049\",\"imei\":\"\",\"tai_khoan\":\"\",\"revenue\":650000,\"wage\":150000,\"commission\":0,\"pay_note\":\"\",\"row_type\":\"order\"},{\"order_id\":144,\"code\":\"ORD-0406-011\",\"date\":\"2026-06-04 18:04:41\",\"service\":\"Lắp mới\",\"bien_so\":\"\",\"imei\":\"\",\"tai_khoan\":\"Thucphamaoao\",\"revenue\":7560000,\"wage\":300000,\"commission\":0,\"pay_note\":\"15/6 TM 7.560.000đ\",\"row_type\":\"order\"},{\"order_id\":147,\"code\":\"ORD-0406-013\",\"date\":\"2026-06-04 20:47:09\",\"service\":\"Lắp mới\",\"bien_so\":\"64A-123.58\",\"imei\":\"\",\"tai_khoan\":\"Dongphuong1\",\"revenue\":810000,\"wage\":100000,\"commission\":0,\"pay_note\":\"\",\"row_type\":\"order\"},{\"order_id\":142,\"code\":\"ORD-0406-010\",\"date\":\"2026-06-05 15:25:46\",\"service\":\"Lắp mới\",\"bien_so\":\"\",\"imei\":\"\",\"tai_khoan\":\"Thucphamaoao, \",\"revenue\":12659760,\"wage\":450000,\"commission\":0,\"pay_note\":\"15/6 TM 12.659.760đ\",\"row_type\":\"order\"},{\"order_id\":155,\"code\":\"ORD-0606-001\",\"date\":\"2026-06-06 09:13:57\",\"service\":\"Lắp mới\",\"bien_so\":\"50h44671\",\"imei\":\"\",\"tai_khoan\":\"Trinhthang\",\"revenue\":810000,\"wage\":100000,\"commission\":0,\"pay_note\":\"\",\"row_type\":\"order\"},{\"order_id\":203,\"code\":\"ORD-1206-001\",\"date\":\"2026-06-12 14:32:08\",\"service\":\"Lắp mới\",\"bien_so\":\"50AF-330.56\",\"imei\":\"\",\"tai_khoan\":\"Hoangkhang\",\"revenue\":849960,\"wage\":100000,\"commission\":0,\"pay_note\":\"12/6 CK 849.960đ\",\"row_type\":\"order\"},{\"order_id\":220,\"code\":\"ORD-1506-008\",\"date\":\"2026-06-15 14:10:00\",\"service\":\"Lắp mới\",\"bien_so\":\"51H-051.54\",\"imei\":\"\",\"tai_khoan\":\"51H05154\",\"revenue\":748000,\"wage\":100000,\"commission\":0,\"pay_note\":\"\",\"row_type\":\"order\"},{\"order_id\":214,\"code\":\"ORD-1506-003\",\"date\":\"2026-06-16 08:34:24\",\"service\":\"Lắp mới\",\"bien_so\":\"\",\"imei\":\"\",\"tai_khoan\":\"51D43937\",\"revenue\":750000,\"wage\":150000,\"commission\":0,\"pay_note\":\"\",\"row_type\":\"order\"},{\"order_id\":225,\"code\":\"ORD-1506-013\",\"date\":\"2026-06-16 08:36:43\",\"service\":\"Lắp mới\",\"bien_so\":\"51D-244.94\",\"imei\":\"\",\"tai_khoan\":\"Dangphuocdong\",\"revenue\":800000,\"wage\":150000,\"commission\":0,\"pay_note\":\"\",\"row_type\":\"order\"},{\"order_id\":213,\"code\":\"ORD-1506-002\",\"date\":\"2026-06-16 08:37:52\",\"service\":\"Lắp mới\",\"bien_so\":\"\",\"imei\":\"\",\"tai_khoan\":\"minhnhut1\",\"revenue\":750000,\"wage\":100000,\"commission\":0,\"pay_note\":\"\",\"row_type\":\"order\"},{\"order_id\":226,\"code\":\"ORD-1606-001\",\"date\":\"2026-06-16 15:47:03\",\"service\":\"Lắp mới\",\"bien_so\":\"50E-886.62\",\"imei\":\"\",\"tai_khoan\":\"0903763726\",\"revenue\":2000000,\"wage\":200000,\"commission\":0,\"pay_note\":\"16/6 CK 2.000.000đ\",\"row_type\":\"order\"},{\"order_id\":235,\"code\":\"ORD-1606-009\",\"date\":\"2026-06-17 15:43:41\",\"service\":\"Lắp mới\",\"bien_so\":\"\",\"imei\":\"\",\"tai_khoan\":\"\",\"revenue\":3780000,\"wage\":300000,\"commission\":0,\"pay_note\":\"22/6 TM 3.780.000đ\",\"row_type\":\"order\"},{\"order_id\":178,\"code\":\"ORD-0706-001-OLD\",\"date\":\"2026-06-17 15:45:13\",\"service\":\"Lắp mới\",\"bien_so\":\"\",\"imei\":\"\",\"tai_khoan\":\"\",\"revenue\":810000,\"wage\":100000,\"commission\":0,\"pay_note\":\"\",\"row_type\":\"order\"},{\"order_id\":243,\"code\":\"ORD-1806-002\",\"date\":\"2026-06-18 13:19:22\",\"service\":\"Lắp mới\",\"bien_so\":\"60K-985.03\",\"imei\":\"\",\"tai_khoan\":\"Boramtek\",\"revenue\":972000,\"wage\":150000,\"commission\":0,\"pay_note\":\"\",\"row_type\":\"order\"},{\"order_id\":285,\"code\":\"ORD-3006-003\",\"date\":\"2026-06-30 16:42:03\",\"service\":\"Lắp mới\",\"bien_so\":\"51K33304\",\"imei\":\"\",\"tai_khoan\":\"anhkim\",\"revenue\":850000,\"wage\":100000,\"commission\":0,\"pay_note\":\"30/6 CK 850.000đ\",\"row_type\":\"order\"},{\"order_id\":311,\"code\":\"ORD-0507-001\",\"date\":\"2026-07-06 12:16:29\",\"service\":\"Lắp mới\",\"bien_so\":\"\",\"imei\":\"\",\"tai_khoan\":\"\",\"revenue\":0,\"wage\":200000,\"commission\":0,\"pay_note\":\"\",\"row_type\":\"order\"},{\"order_id\":290,\"code\":\"ORD-0107-002\",\"date\":\"2026-07-06 12:22:08\",\"service\":\"Lắp mới\",\"bien_so\":\"\",\"imei\":\"\",\"tai_khoan\":\"phamhoaiphong\",\"revenue\":810000,\"wage\":100000,\"commission\":0,\"pay_note\":\"\",\"row_type\":\"order\"},{\"order_id\":280,\"code\":\"ORD-2906-003\",\"date\":\"2026-07-06 12:26:19\",\"service\":\"Lắp mới\",\"bien_so\":\"\",\"imei\":\"\",\"tai_khoan\":\"\",\"revenue\":972000,\"wage\":100000,\"commission\":0,\"pay_note\":\"\",\"row_type\":\"order\"}]', 3400000, 0, 0, 3400000, '', '2026-07-07 02:39:12', 1, 0, NULL, NULL, NULL, 0, 0, 0, 0, '[]');

-- --------------------------------------------------------

--
-- Table structure for table `staff_receipts`
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
-- Dumping data for table `staff_receipts`
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
(59, 'NNT-0506-002', 153, NULL, 97, 1080000, 'cash', NULL, 'Anh V thu 1tr80', 3, 1, 1, '2026-06-15 16:09:58', '2026-06-05 19:46:55', 0, 'active', NULL, NULL, NULL),
(60, 'NNT-0606-001', NULL, 22, 52, 8316000, 'transfer', NULL, 'TT HÓA ĐƠN 8TR316', 3, 1, 1, '2026-06-06 19:46:25', '2026-06-06 09:48:48', 0, 'active', NULL, NULL, NULL),
(61, 'NNT-0606-002', 157, NULL, 99, 460000, 'cash', NULL, NULL, 3, 1, 1, '2026-06-11 15:41:01', '2026-06-06 10:10:28', 0, 'active', NULL, NULL, NULL),
(62, 'NNT-0606-003', 159, NULL, 100, 750000, 'transfer', '[\"https://i.ibb.co/bgzZnqJN/sr-ord-159-1780722298422.jpg\"]', 'ck cty 6/6', 3, 1, 1, '2026-06-06 12:59:50', '2026-06-06 12:04:55', 0, 'active', NULL, NULL, NULL),
(63, 'NNT-0906-001', 165, NULL, 104, 3600000, 'transfer', '[\"https://i.ibb.co/jk2GdtQg/sr-ord-168-1780979392027.jpg\"]', NULL, 6, 1, 1, '2026-06-10 13:33:37', '2026-06-09 14:17:07', 0, 'active', NULL, NULL, NULL),
(64, 'NNT-0906-002', 166, NULL, 105, 750000, 'transfer', '[\"https://i.ibb.co/2Yg3py47/sr-ord-169-1780980395591.jpg\"]', NULL, 6, 1, 1, '2026-06-10 13:32:40', '2026-06-09 14:18:15', 0, 'active', NULL, NULL, NULL),
(65, 'NNT-0906-003', 150, NULL, 95, 3550000, 'transfer', '[\"https://i.ibb.co/Xx94YZ70/sr-ord-150-1780993301577.jpg\"]', '9.6.26 ck cty', 3, 1, 1, '2026-06-10 13:33:21', '2026-06-09 15:21:44', 0, 'active', NULL, NULL, NULL),
(66, 'NNT-0906-004', 170, NULL, 58, 7000000, 'transfer', '[\"https://i.ibb.co/DfrW1FWy/sr-ord-170-1780996913778.jpg\"]', NULL, 3, 1, 1, '2026-06-10 13:32:49', '2026-06-09 16:21:55', 0, 'active', NULL, NULL, NULL),
(67, 'NNT-0906-005', 171, NULL, 107, 750000, 'transfer', '[\"https://i.ibb.co/PshJsWsB/sr-ord-171-1780996929899.jpg\"]', NULL, 6, 1, 1, '2026-06-10 13:32:08', '2026-06-09 16:22:11', 0, 'active', NULL, NULL, NULL),
(68, 'NNT-0906-006', 173, NULL, 61, 1850000, 'transfer', '[\"https://i.ibb.co/gbGhhZDK/sr-ord-173-1780999168822.jpg\"]', NULL, 3, 1, 1, '2026-06-10 13:31:54', '2026-06-09 16:59:32', 0, 'active', NULL, NULL, NULL),
(69, 'NNT-1006-001', 174, NULL, 108, 750000, 'transfer', '[\"https://i.ibb.co/7mf4S0k/sr-ord-174-1781056031648.jpg\"]', NULL, 6, 1, 1, '2026-06-10 13:31:26', '2026-06-10 08:47:15', 0, 'active', NULL, NULL, NULL),
(70, 'NNT-1006-002', 167, NULL, 106, 700000, 'transfer', '[\"https://i.ibb.co/sDRkZvr/sr-ord-167-1781057318988.jpg\"]', NULL, 3, 1, 1, '2026-06-10 13:30:47', '2026-06-10 09:08:41', 0, 'active', NULL, NULL, NULL),
(71, 'NNT-1006-003', 177, NULL, 110, 750000, 'transfer', '[\"https://i.ibb.co/LDBTd8SD/sr-ord-177-1781066253026.jpg\"]', NULL, 3, 1, 1, '2026-06-10 13:31:10', '2026-06-10 11:37:33', 0, 'active', NULL, NULL, NULL),
(72, 'NNT-0806-001-OLD', 180, NULL, 112, 1500000, 'transfer', '[\"https://i.ibb.co/ymckJDrG/sr-ord-165-1780885458787.jpg\"]', NULL, 3, 1, 1, '2026-06-09 22:45:45', '2026-06-08 09:24:23', 0, 'active', NULL, NULL, NULL),
(73, 'NNT-0906-002-OLD', 182, NULL, 113, 750000, 'transfer', '[\"https://i.ibb.co/2Yg3py47/sr-ord-169-1780980395591.jpg\"]', 'ck 9.6', 3, 1, 1, '2026-06-09 22:42:54', '2026-06-09 11:46:41', 0, 'active', NULL, NULL, NULL),
(74, 'NNT-1006-004', 185, NULL, 114, 750000, 'transfer', '[\"https://i.ibb.co/fd4kxycj/sr-ord-185-1781077932605.jpg\"]', NULL, 6, 1, 1, '2026-06-11 14:11:11', '2026-06-10 14:52:19', 0, 'active', NULL, NULL, NULL),
(75, 'NNT-1006-005', 191, NULL, 58, 9720000, 'transfer', NULL, NULL, 6, 1, 1, '2026-06-11 15:04:25', '2026-06-10 17:07:22', 0, 'active', NULL, NULL, NULL),
(76, 'NNT-1106-001', NULL, 23, 29, 16826000, 'transfer', NULL, 'ck 10/6', 3, 1, 1, '2026-06-11 15:04:15', '2026-06-11 08:30:47', 0, 'active', NULL, NULL, NULL),
(77, 'NNT-1106-002', 197, NULL, 119, 750000, 'transfer', '[\"https://i.ibb.co/PvZqWtzn/sr-ord-197-1781144013160.jpg\"]', NULL, 3, 1, 1, '2026-06-11 15:04:03', '2026-06-11 09:13:32', 0, 'active', NULL, NULL, NULL),
(78, 'NNT-1106-003', 190, NULL, 77, 5724000, 'transfer', '[\"https://i.ibb.co/Xrbmq0sS/sr-ord-190-1781147373252.jpg\"]', NULL, 3, 1, 1, '2026-06-11 15:03:50', '2026-06-11 10:09:33', 0, 'active', NULL, NULL, NULL),
(79, 'NNT-1106-004', 199, NULL, 121, 2640000, 'transfer', '[\"https://i.ibb.co/9HBMs9S9/sr-ord-199-1781148214165.jpg\"]', NULL, 3, 1, 1, '2026-06-11 15:04:31', '2026-06-11 10:23:35', 0, 'active', NULL, NULL, NULL),
(80, 'NNT-1106-005', 200, NULL, 122, 1700000, 'transfer', '[\"https://i.ibb.co/wFx4SymS/sr-ord-200-1781163172449.jpg\"]', NULL, 3, 1, 1, '2026-06-11 15:00:21', '2026-06-11 14:32:54', 0, 'active', NULL, NULL, NULL),
(81, 'NNT-1106-006', 196, NULL, 118, 2250000, 'transfer', '[\"https://i.ibb.co/fY6FH1ch/sr-ord-196-1781166489521.jpg\"]', NULL, 3, 1, 1, '2026-06-11 15:40:49', '2026-06-11 15:28:44', 0, 'active', NULL, NULL, NULL),
(82, 'NNT-1206-001', 202, NULL, 124, 750000, 'transfer', '[\"https://i.ibb.co/nq3hDRpH/sr-ord-202-1781229343351.jpg\"]', NULL, 6, 1, 1, '2026-06-15 15:36:24', '2026-06-12 08:55:58', 0, 'active', NULL, NULL, NULL),
(83, 'NNT-1206-002', 198, NULL, 120, 4400000, 'transfer', NULL, NULL, 3, 1, 1, '2026-06-18 11:57:02', '2026-06-12 14:54:35', 0, 'active', NULL, NULL, NULL),
(84, 'NNT-1206-003', 207, NULL, 127, 750000, 'transfer', '[\"https://i.ibb.co/9HtwkSHm/sr-ord-207-1781253324906.jpg\"]', NULL, 3, 1, 1, '2026-06-15 16:08:34', '2026-06-12 15:35:25', 0, 'active', NULL, NULL, NULL),
(85, 'NNT-1206-004', 208, NULL, 42, 969600, 'transfer', NULL, NULL, 3, 1, 1, '2026-06-18 11:57:04', '2026-06-12 16:12:55', 0, 'active', NULL, NULL, NULL),
(86, 'NNT-1306-001', 209, NULL, 128, 1700000, 'transfer', '[\"https://i.ibb.co/5XWn3rk6/sr-ord-209-1781316485685.jpg\"]', NULL, 3, 1, 1, '2026-06-15 16:08:48', '2026-06-13 09:08:04', 0, 'active', NULL, NULL, NULL),
(87, 'NNT-1306-002', 211, NULL, 58, 9072000, 'transfer', '[\"https://i.ibb.co/HTTXzCdv/sr-ord-211-1781319972291.jpg\"]', 'ck hóa đơn 340', 3, 1, 1, '2026-06-15 16:08:55', '2026-06-13 10:06:09', 0, 'active', NULL, NULL, NULL),
(88, 'NNT-1506-001', 212, NULL, 129, 750000, 'transfer', '[\"https://i.ibb.co/QvmCQyWF/sr-ord-212-1781487325852.jpg\"]', 'HÓA ĐƠN 341', 3, 1, 1, '2026-06-15 16:09:09', '2026-06-15 08:35:35', 0, 'active', NULL, NULL, NULL),
(89, 'NNT-1506-002', 144, NULL, 91, 7560000, 'transfer', '[\"https://i.ibb.co/PG65Q86s/sr-ord-144-1781496421108.jpg\"]', NULL, 6, 1, 1, '2026-06-15 16:09:18', '2026-06-15 11:07:07', 0, 'active', NULL, NULL, NULL),
(90, 'NNT-1506-003', 142, NULL, 90, 12659760, 'transfer', '[\"https://i.ibb.co/prQ18NH0/sr-ord-142-1781496454373.jpg\"]', NULL, 6, 1, 1, '2026-06-15 16:09:22', '2026-06-15 11:07:37', 0, 'active', NULL, NULL, NULL),
(91, 'NNT-1506-004', 119, NULL, 83, 3888000, 'transfer', '[\"https://i.ibb.co/23L7HD0F/sr-ord-119-1781496509165.jpg\"]', NULL, 6, 1, 1, '2026-06-15 16:09:28', '2026-06-15 11:08:31', 0, 'active', NULL, NULL, NULL),
(92, 'NNT-1506-005', 222, NULL, 135, 850000, 'transfer', '[\"https://i.ibb.co/Y7DknhZN/sr-ord-222-1781505275464.jpg\"]', NULL, 3, 1, 1, '2026-06-15 16:09:38', '2026-06-15 13:34:37', 0, 'active', NULL, NULL, NULL),
(93, 'NNT-1606-001', 216, NULL, 42, 1393200, 'transfer', '[\"https://i.ibb.co/jjDrSDt/sr-ord-216-1781574205112.jpg\"]', NULL, 3, 1, 1, '2026-06-16 14:20:14', '2026-06-16 08:43:29', 0, 'active', NULL, NULL, NULL),
(94, 'NNT-1606-002', 217, NULL, 133, 500000, 'transfer', '[\"https://i.ibb.co/5hQQFDZD/sr-ord-217-1781575213563.jpg\"]', NULL, 3, 1, 1, '2026-06-16 14:20:07', '2026-06-16 09:00:16', 0, 'active', NULL, NULL, NULL),
(95, 'NNT-1606-003', 221, NULL, 84, 3528000, 'transfer', '[\"https://i.ibb.co/cSYtxHzG/sr-ord-221-1781575553037.jpg\"]', NULL, 6, 1, 1, '2026-06-16 14:19:52', '2026-06-16 09:05:56', 0, 'active', NULL, NULL, NULL),
(96, 'NNT-1606-004', 228, NULL, 137, 850000, 'transfer', '[\"https://i.ibb.co/gLZhVJcR/sr-ord-228-1781579144194.jpg\"]', NULL, 3, 1, 1, '2026-06-16 14:19:42', '2026-06-16 10:05:45', 0, 'active', NULL, NULL, NULL),
(97, 'NNT-1606-005', 231, NULL, 58, 12150000, 'transfer', NULL, 'ck hóa đơn 347', 3, 1, 1, '2026-06-18 11:56:42', '2026-06-16 15:47:59', 0, 'active', NULL, NULL, NULL),
(98, 'NNT-1706-001', 239, NULL, 142, 750000, 'transfer', '[\"https://i.ibb.co/7xJkq5zJ/sr-ord-239-1781677601209.jpg\"]', 'gh 50h24136', 3, 1, 1, '2026-06-18 11:56:29', '2026-06-17 13:26:44', 0, 'active', NULL, NULL, NULL),
(99, 'NNT-1706-002', 240, NULL, 143, 750000, 'transfer', '[\"https://i.ibb.co/vCsv6Lkh/sr-ord-240-1781678373803.jpg\"]', NULL, 3, 1, 1, '2026-06-18 11:56:20', '2026-06-17 13:39:33', 0, 'active', NULL, NULL, NULL),
(100, 'NNT-1806-001', 245, NULL, 36, 2764000, 'transfer', NULL, NULL, 3, 0, NULL, NULL, '2026-06-18 16:31:16', 0, 'active', NULL, NULL, NULL),
(101, 'NNT-1906-001', 246, NULL, 146, 850000, 'transfer', '[\"https://i.ibb.co/xSR68GJc/sr-ord-246-1781832590998.jpg\"]', NULL, 3, 1, 1, '2026-06-19 09:02:51', '2026-06-19 08:29:52', 0, 'active', NULL, NULL, NULL),
(102, 'NNT-1906-002', 172, NULL, 95, 4050000, 'transfer', '[\"https://i.ibb.co/WvZWJ3BL/sr-ord-172-1781849018109.jpg\"]', NULL, 3, 0, NULL, NULL, '2026-06-19 13:03:42', 0, 'active', NULL, NULL, NULL),
(103, 'NNT-1906-003', 242, NULL, 37, 4590000, 'cash', NULL, NULL, 3, 0, NULL, NULL, '2026-06-19 13:32:47', 0, 'active', NULL, NULL, NULL),
(104, 'NNT-1906-004', 249, NULL, 149, 3000000, 'transfer', NULL, NULL, 3, 0, NULL, NULL, '2026-06-19 15:08:39', 0, 'active', NULL, NULL, NULL),
(105, 'NNT-1906-005', NULL, 24, 64, 7390000, 'transfer', NULL, NULL, 3, 0, NULL, NULL, '2026-06-19 17:26:22', 0, 'active', NULL, NULL, NULL),
(106, 'NNT-2006-001', 253, NULL, 36, 4596000, 'transfer', '[\"https://i.ibb.co/yFtQqbBp/sr-ord-253-1781929867282.jpg\"]', NULL, 3, 0, NULL, NULL, '2026-06-20 11:31:08', 0, 'active', NULL, NULL, NULL),
(107, 'NNT-2206-001', 252, NULL, 33, 1400000, 'transfer', '[\"https://i.ibb.co/R47kRs4j/sr-ord-252-1782091328102.jpg\"]', NULL, 3, 1, 1, '2026-06-29 10:43:18', '2026-06-22 08:22:11', 0, 'active', NULL, NULL, NULL),
(108, 'NNT-2206-002', 235, NULL, 139, 3780000, 'transfer', '[\"https://i.ibb.co/kV1kN9sn/sr-ord-235-1782112427434.jpg\"]', NULL, 6, 1, 1, '2026-06-29 10:43:12', '2026-06-22 14:13:51', 0, 'active', NULL, NULL, NULL),
(109, 'NNT-2206-003', 256, NULL, 58, 8802000, 'transfer', '[\"https://i.ibb.co/1YTyTLyk/sr-ord-256-1782113848089.jpg\"]', NULL, 6, 1, 1, '2026-06-29 10:43:06', '2026-06-22 14:37:36', 0, 'active', NULL, NULL, NULL),
(110, 'NNT-2206-004', 254, NULL, 36, 5118000, 'transfer', '[\"https://i.ibb.co/JRt70WDJ/sr-ord-254-1782115152281.jpg\"]', NULL, 3, 1, 1, '2026-06-29 10:42:44', '2026-06-22 14:59:12', 0, 'active', NULL, NULL, NULL),
(111, 'NNT-2306-001', 204, NULL, 126, 750000, 'transfer', '[\"https://i.ibb.co/HLsDsKqy/sr-ord-204-1782177943335.jpg\"]', NULL, 3, 1, 1, '2026-06-29 10:42:38', '2026-06-23 08:25:46', 0, 'active', NULL, NULL, NULL),
(112, 'NNT-2306-002', 258, NULL, 45, 480000, 'transfer', '[\"https://i.ibb.co/CpmR2XGw/sr-ord-258-1782179357519.jpg\"]', NULL, 3, 1, 1, '2026-06-29 10:42:33', '2026-06-23 08:49:19', 0, 'active', NULL, NULL, NULL),
(113, 'NNT-2306-003', 261, NULL, 151, 750000, 'transfer', '[\"https://i.ibb.co/gZVDWw5G/sr-ord-261-1782189541337.jpg\"]', NULL, 3, 1, 1, '2026-06-29 10:42:28', '2026-06-23 11:39:05', 0, 'active', NULL, NULL, NULL),
(114, 'NNT-2306-004', 260, NULL, 27, 96390000, 'transfer', '[\"https://i.ibb.co/pjgYPk1z/sr-ord-260-1782201513464.jpg\"]', NULL, 3, 1, 1, '2026-06-29 10:42:18', '2026-06-23 14:58:37', 0, 'active', NULL, NULL, NULL),
(115, 'NNT-2406-001', 257, NULL, 84, 2912000, 'transfer', '[\"https://i.ibb.co/9fJZz6t/sr-ord-257-1782266012986.jpg\"]', NULL, 6, 1, 1, '2026-06-29 10:42:09', '2026-06-24 08:53:32', 0, 'active', NULL, NULL, NULL),
(116, 'NNT-2406-002', 79, NULL, 49, 12425000, 'transfer', NULL, NULL, 3, 1, 1, '2026-06-29 10:42:02', '2026-06-24 09:08:44', 0, 'active', NULL, NULL, NULL),
(117, 'NNT-2406-003', 238, NULL, 141, 6930000, 'transfer', '[\"https://i.ibb.co/hxntH3v4/sr-ord-238-1782267884157.jpg\"]', NULL, 3, 1, 1, '2026-06-29 10:41:47', '2026-06-24 09:24:48', 0, 'active', NULL, NULL, NULL),
(118, 'NNT-2406-004', 158, NULL, 19, 7056000, 'transfer', '[\"https://i.ibb.co/rKLJRyp2/sr-ord-158-1782274255867.jpg\"]', 'ck hóa đơn cty, 900k ck cá nhân', 3, 1, 1, '2026-06-29 10:41:40', '2026-06-24 11:10:59', 0, 'active', NULL, NULL, NULL),
(119, 'NNT-2406-005', 263, NULL, 25, 5300000, 'transfer', '[\"https://i.ibb.co/cK7q9qBW/sr-ord-263-1782288648333.jpg\"]', NULL, 3, 1, 1, '2026-06-29 10:41:24', '2026-06-24 15:10:52', 0, 'active', NULL, NULL, NULL),
(120, 'NNT-2506-001', 267, NULL, 153, 972000, 'transfer', '[\"https://i.ibb.co/pBH1BjM6/sr-ord-267-1782375214870.jpg\"]', NULL, 3, 1, 1, '2026-06-29 10:41:15', '2026-06-25 15:13:38', 0, 'active', NULL, NULL, NULL),
(121, 'NNT-2606-001', 269, NULL, 155, 750000, 'transfer', NULL, NULL, 3, 0, NULL, NULL, '2026-06-26 09:00:05', 0, 'active', NULL, NULL, NULL),
(122, 'NNT-2606-002', 262, NULL, 37, 8000000, 'transfer', '[\"https://i.ibb.co/Gv4PxmwN/sr-ord-262-1782439668045.jpg\"]', NULL, 3, 1, 1, '2026-06-29 10:41:00', '2026-06-26 09:07:48', 0, 'active', NULL, NULL, NULL),
(123, 'NNT-2606-003', 210, NULL, 37, 52920000, 'transfer', '[\"https://i.ibb.co/994cNwwR/sr-ord-210-1782440978662.jpg\",\"https://i.ibb.co/q8HNk8C/sr-ord-210-1782440981486.jpg\"]', NULL, 3, 1, 1, '2026-06-29 10:40:45', '2026-06-26 09:29:42', 0, 'active', NULL, NULL, NULL),
(124, 'NNT-2606-004', 271, NULL, 58, 2160000, 'transfer', '[\"https://i.ibb.co/cKc6kCgx/sr-ord-271-1782459872448.jpg\"]', NULL, 3, 1, 1, '2026-06-29 10:40:37', '2026-06-26 14:44:34', 0, 'active', NULL, NULL, NULL),
(125, 'NNT-2606-005', 247, NULL, 147, 750000, 'transfer', '[\"https://i.ibb.co/R10Bm17/sr-ord-247-1782462116272.jpg\"]', NULL, 3, 1, 1, '2026-06-29 10:40:31', '2026-06-26 15:21:58', 0, 'active', NULL, NULL, NULL),
(126, 'NNT-2606-006', 272, NULL, 37, 7500000, 'transfer', '[\"https://i.ibb.co/TxHc74yn/sr-ord-272-1782464678572.jpg\"]', NULL, 3, 1, 1, '2026-06-29 10:40:28', '2026-06-26 16:04:44', 0, 'active', NULL, NULL, NULL),
(127, 'NNT-2706-001', 273, NULL, 157, 750000, 'transfer', '[\"https://i.ibb.co/LhDttsVc/sr-ord-273-1782523576011.jpg\"]', NULL, 3, 1, 1, '2026-06-29 10:40:16', '2026-06-27 08:26:20', 0, 'active', NULL, NULL, NULL),
(128, 'NNT-2706-002', 274, NULL, 158, 750000, 'transfer', '[\"https://i.ibb.co/XZyr1K2Y/sr-ord-274-1782524994237.jpg\"]', NULL, 3, 1, 1, '2026-06-29 10:40:00', '2026-06-27 08:49:55', 0, 'active', NULL, NULL, NULL),
(129, 'NNT-2706-003', 276, NULL, 159, 750000, 'transfer', '[\"https://i.ibb.co/MyKVYJvd/sr-ord-276-1782526585542.jpg\"]', NULL, 3, 1, 1, '2026-06-29 10:39:53', '2026-06-27 09:16:27', 0, 'active', NULL, NULL, NULL),
(130, 'NNT-2706-004', 270, NULL, 49, 4860000, 'transfer', '[\"https://i.ibb.co/nMPfTwsC/sr-ord-270-1782530457364.jpg\"]', NULL, 3, 1, 1, '2026-06-29 10:39:48', '2026-06-27 10:21:00', 0, 'active', NULL, NULL, NULL),
(131, 'NNT-2906-001', 268, NULL, 154, 4520000, 'transfer', '[\"https://i.ibb.co/1GKFV357/sr-ord-268-1782697333898.jpg\",\"https://i.ibb.co/XfGvfHyQ/sr-ord-268-1782697337524.jpg\"]', NULL, 3, 1, 1, '2026-06-29 10:39:38', '2026-06-29 08:42:20', 0, 'active', NULL, NULL, NULL),
(132, 'NNT-2906-002', 255, NULL, 150, 750000, 'transfer', '[\"https://i.ibb.co/gFFQxJSv/sr-ord-255-1782699783743.jpg\"]', NULL, 3, 1, 1, '2026-06-29 10:39:31', '2026-06-29 09:23:07', 0, 'active', NULL, NULL, NULL),
(133, 'NNT-2906-003', 279, NULL, 95, 4000000, 'transfer', '[\"https://i.ibb.co/5X3XB6ph/sr-ord-279-1782728046461.jpg\"]', NULL, 3, 1, 1, '2026-07-06 11:41:14', '2026-06-29 17:14:10', 0, 'active', NULL, NULL, NULL),
(134, 'NNT-3006-001', 282, NULL, 161, 770000, 'transfer', '[\"https://i.ibb.co/gMmVTCm4/sr-ord-282-1782790284566.jpg\"]', NULL, 3, 1, 1, '2026-07-06 11:41:04', '2026-06-30 10:31:25', 0, 'active', NULL, NULL, NULL),
(135, 'NNT-0107-001', 287, NULL, 163, 5500000, 'transfer', '[\"https://i.ibb.co/TMNh89Zm/sr-ord-287-1782880339976.jpg\"]', NULL, 6, 1, 1, '2026-07-06 11:40:59', '2026-07-01 11:32:21', 0, 'active', NULL, NULL, NULL),
(136, 'NNT-0107-002', 292, NULL, 165, 850000, 'transfer', '[\"https://i.ibb.co/k2HLpmHT/sr-ord-292-1782880976703.jpg\"]', NULL, 3, 1, 1, '2026-07-06 11:40:53', '2026-07-01 11:42:56', 0, 'active', NULL, NULL, NULL),
(137, 'NNT-0107-003', 293, NULL, 36, 13000000, 'transfer', '[\"https://i.ibb.co/HfzXJt5c/sr-ord-293-1782881109280.jpg\",\"https://i.ibb.co/9kPtFL6d/sr-ord-293-1782881111886.jpg\"]', NULL, 3, 1, 1, '2026-07-06 11:40:46', '2026-07-01 11:45:11', 0, 'active', NULL, NULL, NULL),
(138, 'NNT-0107-004', 295, NULL, 166, 23000000, 'transfer', '[\"https://i.ibb.co/v6k0yCzF/sr-ord-295-1782901115464.jpg\"]', NULL, 6, 1, 1, '2026-07-06 11:40:13', '2026-07-01 17:18:46', 0, 'active', NULL, NULL, NULL),
(139, 'NNT-0207-001', 296, NULL, 167, 750000, 'transfer', NULL, NULL, 3, 0, NULL, NULL, '2026-07-02 08:33:20', 0, 'active', NULL, NULL, NULL),
(140, 'NNT-0207-002', 297, NULL, 168, 750000, 'transfer', '[\"https://i.ibb.co/Z6k8mFbG/sr-ord-297-1782956084818.jpg\"]', NULL, 3, 1, 1, '2026-07-06 11:40:05', '2026-07-02 08:34:42', 0, 'active', NULL, NULL, NULL),
(141, 'NNT-0207-003', 298, NULL, 28, 6536000, 'transfer', '[\"https://i.ibb.co/gMXmkFB8/sr-ord-298-1782957042838.jpg\",\"https://i.ibb.co/TD6WR6rx/sr-ord-298-1782957045530.jpg\"]', NULL, 3, 1, 1, '2026-07-06 11:40:04', '2026-07-02 08:50:44', 0, 'active', NULL, NULL, NULL),
(142, 'NNT-0207-004', 302, NULL, 169, 1200000, 'transfer', NULL, NULL, 3, 0, NULL, NULL, '2026-07-02 16:29:51', 0, 'active', NULL, NULL, NULL),
(143, 'NNT-0307-001', 305, NULL, 171, 3888000, 'transfer', '[\"https://i.ibb.co/zWKspsYC/sr-ord-305-1783047662429.jpg\"]', NULL, 3, 1, 1, '2026-07-06 11:39:54', '2026-07-03 10:01:00', 0, 'active', NULL, NULL, NULL),
(144, 'NNT-0307-002', 301, NULL, 62, 4536000, 'transfer', '[\"https://i.ibb.co/3t2yqf2/sr-ord-301-1783048197069.jpg\"]', NULL, 3, 1, 1, '2026-07-06 11:39:52', '2026-07-03 10:09:56', 0, 'active', NULL, NULL, NULL),
(145, 'NNT-0307-003', 306, NULL, 172, 5400000, 'transfer', '[\"https://i.ibb.co/Kzx8XzjP/sr-ord-306-1783061309111.jpg\"]', NULL, 6, 1, 1, '2026-07-06 11:39:40', '2026-07-03 13:48:35', 0, 'active', NULL, NULL, NULL),
(146, 'NNT-0407-001', 309, NULL, 173, 1500000, 'transfer', NULL, NULL, 3, 1, 1, '2026-07-07 15:36:32', '2026-07-04 08:26:25', 0, 'active', NULL, NULL, NULL),
(147, 'NNT-0607-001', 312, NULL, 175, 600000, 'transfer', '[\"https://i.ibb.co/gFyBRVQ6/sr-ord-312-1783303552616.jpg\"]', NULL, 6, 1, 1, '2026-07-06 11:39:31', '2026-07-06 09:06:00', 0, 'active', NULL, NULL, NULL),
(148, 'NNT-0607-002', 314, NULL, 177, 750000, 'transfer', '[\"https://i.ibb.co/cX8QZb5L/sr-ord-314-1783305232001.jpg\"]', NULL, 6, 1, 1, '2026-07-06 11:39:22', '2026-07-06 09:33:58', 0, 'active', NULL, NULL, NULL),
(149, 'NNT-0607-003', 313, NULL, 176, 750000, 'transfer', '[\"https://i.ibb.co/8nhVCpMF/sr-ord-313-1783306109759.jpg\"]', NULL, 3, 1, 1, '2026-07-06 11:39:20', '2026-07-06 09:48:32', 0, 'active', NULL, NULL, NULL),
(150, 'NNT-0607-004', 315, NULL, 178, 750000, 'transfer', '[\"https://i.ibb.co/35nBxK05/sr-ord-315-1783311091893.jpg\"]', NULL, 3, 1, 1, '2026-07-06 11:39:18', '2026-07-06 11:11:32', 0, 'active', NULL, NULL, NULL),
(151, 'NNT-0607-005', 316, NULL, 45, 480000, 'transfer', '[\"https://i.ibb.co/pFP8QTj/sr-ord-316-1783322877979.jpg\"]', NULL, 3, 1, 1, '2026-07-07 15:47:12', '2026-07-06 14:28:01', 0, 'active', NULL, NULL, NULL),
(152, 'NNT-0607-006', 201, NULL, 123, 3750000, 'transfer', '[\"https://i.ibb.co/tTQhK8mV/sr-ord-201-1783324349331.jpg\"]', NULL, 3, 1, 1, '2026-07-07 15:36:20', '2026-07-06 14:52:31', 0, 'active', NULL, NULL, NULL),
(153, 'NNT-0707-001', 320, NULL, 180, 750000, 'transfer', '[\"https://i.ibb.co/Gvv8BQyz/sr-ord-320-1783387827875.jpg\"]', NULL, 3, 1, 1, '2026-07-07 15:36:03', '2026-07-07 08:30:30', 0, 'active', NULL, NULL, NULL),
(154, 'NNT-0707-002', 326, NULL, 183, 8424000, 'transfer', '[\"https://i.ibb.co/gLmK9xSQ/sr-ord-326-1783391271021.jpg\"]', NULL, 3, 1, 1, '2026-07-07 15:47:10', '2026-07-07 09:27:55', 0, 'active', NULL, NULL, NULL),
(155, 'NNT-0707-003', 327, NULL, 184, 1200000, 'transfer', '[\"https://i.ibb.co/7tXSNdcR/sr-ord-327-1783394525603.jpg\"]', NULL, 3, 1, 1, '2026-07-07 15:34:36', '2026-07-07 10:22:07', 0, 'active', NULL, NULL, NULL),
(156, 'NNT-0807-001', 319, NULL, 179, 1500000, 'transfer', '[\"https://i.ibb.co/tGCDwGN/sr-ord-319-1783474880436.jpg\"]', NULL, 3, 0, NULL, NULL, '2026-07-08 08:41:26', 0, 'active', NULL, NULL, NULL),
(157, 'NNT-0807-002', 335, NULL, 188, 850000, 'transfer', '[\"https://i.ibb.co/B53qcZ5H/sr-ord-335-1783477618173.jpg\"]', NULL, 3, 0, NULL, NULL, '2026-07-08 09:27:01', 0, 'active', NULL, NULL, NULL),
(158, 'NNT-0807-003', 336, NULL, 189, 750000, 'transfer', '[\"https://i.ibb.co/3mLt9Wn7/sr-ord-336-1783484349059.jpg\"]', NULL, 3, 0, NULL, NULL, '2026-07-08 11:19:12', 0, 'active', NULL, NULL, NULL),
(159, 'NNT-0807-004', 266, NULL, 37, 52920000, 'transfer', '[\"https://i.ibb.co/RktC5c0r/sr-ord-266-1783496977592.jpg\"]', NULL, 3, 0, NULL, NULL, '2026-07-08 14:49:43', 0, 'active', NULL, NULL, NULL),
(160, 'NNT-0907-001', 343, NULL, 166, 21870000, 'transfer', '[\"https://i.ibb.co/dJ5syRCY/sr-ord-343-1783588032606.jpg\"]', NULL, 3, 0, NULL, NULL, '2026-07-09 16:07:20', 0, 'active', NULL, NULL, NULL),
(161, 'NNT-1007-001', 353, NULL, 49, 1788000, 'transfer', '[\"https://i.ibb.co/9kLSFJK0/sr-ord-353-1783677074446.jpg\"]', NULL, 3, 0, NULL, NULL, '2026-07-10 16:51:18', 0, 'active', NULL, NULL, NULL),
(162, 'NNT-1007-002', 352, NULL, 36, 5175000, 'cash', NULL, NULL, 3, 0, NULL, NULL, '2026-07-10 16:51:28', 0, 'active', NULL, NULL, NULL),
(163, 'NNT-1107-001', 355, NULL, 37, 5040000, 'transfer', '[\"https://i.ibb.co/CK3q2c2y/sr-ord-355-1783744216982.jpg\"]', NULL, 3, 0, NULL, NULL, '2026-07-11 11:30:18', 0, 'active', NULL, NULL, NULL),
(164, 'NNT-1107-002', 357, NULL, 195, 972000, 'transfer', '[\"https://i.ibb.co/RTwxQdqG/sr-ord-357-1783753610134.jpg\"]', NULL, 3, 0, NULL, NULL, '2026-07-11 14:06:52', 0, 'active', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `staff_reviews`
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
-- Table structure for table `staff_salary_advances`
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
-- Dumping data for table `staff_salary_advances`
--

INSERT INTO `staff_salary_advances` (`id`, `staff_id`, `amount`, `note`, `payslip_id`, `carried_at`, `created_by`, `created_at`, `is_deleted`, `remittance_id`, `remitted_at`, `deduct_from_collection`, `status`, `approved_at`, `approved_by`, `reject_reason`) VALUES
(1, 7, 100000, NULL, 3, '2026-07-06 23:53:35', 1, '2026-05-21 17:03:45', 0, NULL, NULL, 0, 'approved', NULL, NULL, NULL),
(2, 7, 100000, 'ăn mì tôm', 3, '2026-07-06 23:53:35', 1, '2026-05-21 17:04:34', 0, NULL, NULL, 0, 'approved', NULL, NULL, NULL),
(3, 7, 10000, NULL, 3, '2026-07-06 23:53:35', 1, '2026-05-21 17:29:46', 0, NULL, NULL, 0, 'approved', NULL, NULL, NULL),
(4, 7, 20000, NULL, 3, '2026-07-06 23:53:35', 6, '2026-05-21 17:33:51', 0, NULL, NULL, 0, 'approved', NULL, NULL, NULL),
(5, 7, 100000, 'Ứng lương kỳ 2026-05', NULL, NULL, 1, '2026-05-21 18:45:44', 0, 7, '2026-06-05 22:01:31', 1, 'approved', NULL, NULL, NULL),
(6, 6, 400000, 'ứng tiền hihi', NULL, NULL, 6, '2026-05-21 19:42:49', 1, NULL, NULL, 0, 'approved', NULL, NULL, NULL),
(7, 6, 100000, NULL, 2, '2026-05-23 00:49:26', 6, '2026-05-21 19:44:50', 0, NULL, NULL, 0, 'approved', NULL, NULL, NULL),
(8, 6, 50000, NULL, NULL, NULL, 6, '2026-05-21 20:35:32', 0, NULL, NULL, 0, 'pending', NULL, NULL, NULL),
(9, 2, 500000, 'Ứng lương kỳ 2026-05', NULL, NULL, 1, '2026-05-22 22:43:20', 0, 5, '2026-06-02 16:32:16', 1, 'approved', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `staff_stock_consumptions`
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
-- Table structure for table `staff_stock_issues`
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
-- Dumping data for table `staff_stock_issues`
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
(14, 'CAP-0206-001', 8, 'approved', NULL, 3, '2026-06-02 03:10:44', 3, '2026-06-11 08:33:10', NULL, NULL, NULL, 151, 0),
(15, 'CAP-0206-002', 8, 'approved', NULL, 3, '2026-06-02 03:11:53', 3, '2026-06-11 08:33:08', NULL, NULL, NULL, 150, 0),
(16, 'CAP-0306-001', 8, 'approved', NULL, 3, '2026-06-03 02:48:59', 3, '2026-06-11 08:33:06', NULL, NULL, NULL, 149, 0),
(17, 'CAP-0306-002', 2, 'approved', NULL, 3, '2026-06-03 08:15:43', 1, '2026-06-04 18:01:01', NULL, NULL, NULL, 111, 0),
(18, 'CAP-0406-001', 2, 'approved', NULL, 3, '2026-06-04 03:55:49', 1, '2026-06-04 18:00:58', NULL, NULL, NULL, 110, 0),
(19, 'CAP-0406-002', 2, 'approved', NULL, 3, '2026-06-04 07:05:23', 1, '2026-06-04 18:00:54', NULL, NULL, NULL, 109, 0),
(20, 'CAP-1106-001', 8, 'approved', NULL, 3, '2026-06-11 01:33:01', 3, '2026-06-11 08:33:04', NULL, NULL, NULL, 148, 0),
(21, 'CAP-1106-002', 8, 'approved', NULL, 3, '2026-06-11 02:19:32', 3, '2026-07-02 14:42:17', NULL, NULL, NULL, 260, 0),
(22, 'CAP-1506-001', 2, 'approved', NULL, 3, '2026-06-15 02:17:05', 3, '2026-06-15 09:17:08', NULL, NULL, NULL, 170, 0),
(23, 'CAP-1806-001', 2, 'approved', NULL, 3, '2026-06-18 01:53:57', 3, '2026-06-18 08:54:00', NULL, NULL, NULL, 199, 0),
(24, 'CAP-1906-001', 8, 'approved', NULL, 3, '2026-06-19 09:08:02', 3, '2026-06-19 16:08:04', NULL, NULL, NULL, 211, 0),
(25, 'CAP-2606-001', 2, 'approved', NULL, 3, '2026-06-26 06:19:51', 3, '2026-06-29 14:17:50', NULL, NULL, NULL, 246, 0),
(26, 'CAP-2906-001', 2, 'approved', NULL, 3, '2026-06-29 07:17:46', 3, '2026-06-29 14:17:49', NULL, NULL, NULL, 245, 0),
(27, 'CAP-3006-001', 2, 'approved', NULL, 3, '2026-06-30 06:33:03', 3, '2026-06-30 13:33:05', NULL, NULL, NULL, 249, 0),
(28, 'CAP-0207-001', 8, 'approved', NULL, 3, '2026-07-02 07:42:10', 3, '2026-07-02 14:42:13', NULL, NULL, NULL, 259, 0),
(29, 'CAP-0407-001', 2, 'approved', NULL, 3, '2026-07-04 02:06:14', 3, '2026-07-04 09:06:20', NULL, NULL, NULL, 267, 0),
(30, 'CAP-0507-001', 2, 'approved', NULL, 1, '2026-07-05 09:06:18', 1, '2026-07-05 16:06:24', NULL, NULL, NULL, 268, 0),
(31, 'CAP-0707-001', 8, 'approved', NULL, 3, '2026-07-07 09:58:59', 3, '2026-07-07 16:59:01', NULL, NULL, NULL, 288, 0),
(32, 'CAP-0707-002', 2, 'approved', NULL, 3, '2026-07-07 09:59:11', 3, '2026-07-07 16:59:12', NULL, NULL, NULL, 289, 0),
(33, 'CAP-1007-001', 8, 'approved', NULL, 3, '2026-07-10 04:38:51', 3, '2026-07-10 11:38:53', NULL, NULL, NULL, 304, 0);

-- --------------------------------------------------------

--
-- Table structure for table `staff_stock_issue_items`
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
-- Dumping data for table `staff_stock_issue_items`
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
(21, 14, 4, 3, 3, '862051082886235\n862051082920869\n862051082887712', NULL),
(22, 14, 6, 3, 3, NULL, NULL),
(23, 14, 31, 3, 3, NULL, NULL),
(24, 14, 12, 2, 2, NULL, NULL),
(25, 14, 23, 3, 3, NULL, NULL),
(26, 14, 10, 3, 3, NULL, NULL),
(27, 15, 15, 2, 2, NULL, NULL),
(28, 15, 28, 4, 4, '860056083566753\n860056083563651\n860056083535360\n860056083526039', NULL),
(29, 16, 5, 1, 1, '862051082904335', NULL),
(30, 16, 28, 1, 1, '60056083525122', NULL),
(31, 16, 10, 1, 1, NULL, NULL),
(32, 16, 31, 1, 1, NULL, NULL),
(33, 17, 28, 4, 4, NULL, NULL),
(34, 18, 5, 2, 2, '862051082907825\n862051082905977', NULL),
(35, 18, 6, 2, 2, NULL, NULL),
(36, 18, 10, 2, 2, NULL, NULL),
(37, 18, 31, 2, 2, NULL, NULL),
(38, 19, 5, 2, 2, '862051082907692\n862051082907478', NULL),
(39, 19, 10, 2, 2, NULL, NULL),
(40, 19, 6, 2, 2, NULL, NULL),
(41, 19, 31, 2, 2, NULL, NULL),
(42, 19, 28, 10, 10, '860056083567306\n860056083533233\n860056083568049\n860056083567645\n860056083538356\n860056083568403\n860056083524018\n860056083566894\n860056083567710\n860056083567728', NULL),
(43, 20, 2, 6, 6, '860056084514638\n860056084584086\n860056084517391\n860056084545590\n860056084522839\n860056084598573', NULL),
(44, 21, 5, 1, 1, '862051082890211\n860108072884687', NULL),
(45, 22, 2, 5, 5, '860056084570879\n860056084576793\n860056084571018\n860056084079681\n860056084006007', NULL),
(46, 23, 2, 7, 7, '860056084512004\n860056084504290\n860056084502484\n860056084602540\n860056084525691\n860056084524298\n860056084601724', NULL),
(47, 24, 2, 7, 7, '860056084552364\n860056084601088\n860056084524561\n860056084504324\n860056084526632\n860056084601146\n860056084601203', NULL),
(48, 24, 28, 3, 3, '860056083563867\n860056083560459\n860056083562513', NULL),
(49, 25, 4, 1, 1, '863982083980891', NULL),
(50, 25, 10, 1, 1, NULL, NULL),
(51, 26, 5, 1, 1, '863982083980925', NULL),
(52, 26, 10, 1, 1, NULL, NULL),
(53, 27, 40, 5, 5, '860056083535832\n860056083553116\n860056083559402\n860056083551193\n860056083557067', NULL),
(54, 28, 40, 5, 5, '860056083549650\n860056083535543\n860056083557513\n860056083531054\n860056083569393', NULL),
(55, 29, 4, 3, 3, '863982083972500\n863982084031256\n863982083954482', NULL),
(56, 29, 5, 1, 1, '863982083979471', NULL),
(57, 29, 10, 4, 4, NULL, NULL),
(58, 29, 31, 4, 4, NULL, NULL),
(59, 29, 27, 4, 4, NULL, NULL),
(60, 30, 28, 5, 5, '860056083569583\n860056083552100\n860056083533068\n860056083551862\n860056083543653', NULL),
(61, 31, 24, 100, 100, NULL, NULL),
(62, 32, 24, 100, 100, NULL, NULL),
(63, 33, 4, 2, 2, '863982083973300\n862051082890211', NULL),
(64, 33, 31, 2, 2, NULL, NULL),
(65, 33, 10, 1, 1, NULL, NULL),
(66, 33, 23, 2, 2, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `stock_items`
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
-- Table structure for table `stock_receipts`
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
-- Dumping data for table `stock_receipts`
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
(135, 'PX-260610-003', 'out', 'order_consume', NULL, 177, NULL, NULL, NULL, NULL, 3, '2026-06-10 04:37:35', 0, NULL, NULL, NULL, NULL),
(136, 'PX-260610-004', 'out', 'order_consume', NULL, 179, 8, NULL, NULL, NULL, 8, '2026-06-10 06:42:08', 0, NULL, NULL, NULL, NULL),
(137, 'PX-260610-005', 'out', 'order_consume', NULL, 181, 8, NULL, NULL, NULL, 8, '2026-06-10 06:43:23', 0, NULL, NULL, NULL, NULL),
(138, 'PX-260610-006', 'out', 'order_consume', NULL, 176, 8, NULL, NULL, NULL, 8, '2026-06-10 06:43:58', 0, NULL, NULL, NULL, NULL),
(139, 'PX-260610-007', 'out', 'order_consume', NULL, 100, NULL, NULL, NULL, NULL, 1, '2026-06-10 06:49:42', 0, NULL, NULL, NULL, NULL),
(140, 'PX-260610-008', 'out', 'order_consume', NULL, 89, NULL, NULL, NULL, NULL, 1, '2026-06-10 06:51:07', 0, NULL, NULL, NULL, NULL),
(141, 'PN-260610-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-10 06:57:50', 0, NULL, NULL, NULL, NULL),
(142, 'PN-260610-002', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-10 07:07:21', 0, NULL, NULL, NULL, NULL),
(143, 'PX-260610-009', 'out', 'order_consume', NULL, 184, NULL, NULL, NULL, NULL, 3, '2026-06-10 07:18:48', 0, NULL, NULL, NULL, NULL),
(144, 'PX-260610-010', 'out', 'order_consume', NULL, 185, NULL, NULL, NULL, NULL, 6, '2026-06-10 07:52:25', 0, NULL, NULL, NULL, NULL),
(145, 'PX-260610-011', 'out', 'order_consume', NULL, 183, NULL, NULL, NULL, NULL, 6, '2026-06-10 10:07:48', 0, NULL, NULL, NULL, NULL),
(146, 'PN-260610-003', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 6, '2026-06-10 10:12:25', 0, NULL, NULL, NULL, NULL),
(147, 'PX-260611-001', 'out', 'order_consume', NULL, 195, NULL, NULL, NULL, NULL, 1, '2026-06-11 00:57:40', 0, NULL, NULL, NULL, NULL),
(148, 'PX-260611-002', 'out', 'staff_issue', 'Cấp SP cho KTV qua phiếu CAP-1106-001', NULL, 8, NULL, NULL, NULL, 3, '2026-06-11 01:33:04', 0, NULL, NULL, NULL, NULL),
(149, 'PX-260611-003', 'out', 'staff_issue', 'Cấp SP cho KTV qua phiếu CAP-0306-001', NULL, 8, NULL, NULL, NULL, 3, '2026-06-11 01:33:06', 0, NULL, NULL, NULL, NULL),
(150, 'PX-260611-004', 'out', 'staff_issue', 'Cấp SP cho KTV qua phiếu CAP-0206-002', NULL, 8, NULL, NULL, NULL, 3, '2026-06-11 01:33:08', 0, NULL, NULL, NULL, NULL),
(151, 'PX-260611-005', 'out', 'staff_issue', 'Cấp SP cho KTV qua phiếu CAP-0206-001', NULL, 8, NULL, NULL, NULL, 3, '2026-06-11 01:33:10', 0, NULL, NULL, NULL, NULL),
(152, 'PX-260611-006', 'out', 'order_consume', NULL, 197, NULL, NULL, NULL, NULL, 3, '2026-06-11 02:13:34', 0, NULL, NULL, NULL, NULL),
(153, 'PX-260611-007', 'out', 'order_consume', NULL, 191, NULL, NULL, NULL, NULL, 6, '2026-06-11 02:45:02', 0, NULL, NULL, NULL, NULL),
(154, 'PX-260611-008', 'out', 'order_consume', NULL, 190, NULL, NULL, NULL, NULL, 3, '2026-06-11 03:09:40', 0, NULL, NULL, NULL, NULL),
(155, 'PN-260611-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-11 03:22:49', 0, NULL, NULL, NULL, NULL),
(156, 'PX-260611-009', 'out', 'order_consume', NULL, 199, NULL, NULL, NULL, NULL, 3, '2026-06-11 03:23:47', 0, NULL, NULL, NULL, NULL),
(157, 'PX-260611-010', 'out', 'order_consume', NULL, 194, 8, NULL, NULL, NULL, 8, '2026-06-11 07:07:29', 0, NULL, NULL, NULL, NULL),
(158, 'PX-260611-011', 'out', 'order_consume', NULL, 198, 8, NULL, NULL, NULL, 8, '2026-06-11 07:08:00', 0, NULL, NULL, NULL, NULL),
(159, 'PX-260611-012', 'out', 'order_consume', NULL, 200, NULL, NULL, NULL, NULL, 3, '2026-06-11 07:32:58', 0, NULL, NULL, NULL, NULL),
(160, 'PX-260611-013', 'out', 'order_consume', NULL, 196, NULL, NULL, NULL, NULL, 3, '2026-06-11 08:28:47', 0, NULL, NULL, NULL, NULL),
(161, 'PX-260612-001', 'out', 'order_consume', NULL, 202, NULL, NULL, NULL, NULL, 6, '2026-06-12 01:56:08', 0, NULL, NULL, NULL, NULL),
(162, 'PX-260612-002', 'out', 'order_consume', NULL, 203, 2, NULL, NULL, NULL, 2, '2026-06-12 07:32:08', 0, NULL, NULL, NULL, NULL),
(163, 'PX-260612-003', 'out', 'order_consume', NULL, 205, 8, NULL, NULL, NULL, 8, '2026-06-12 07:40:23', 0, NULL, NULL, NULL, NULL),
(164, 'PX-260612-004', 'out', 'order_consume', NULL, 207, NULL, NULL, NULL, NULL, 3, '2026-06-12 08:35:27', 0, NULL, NULL, NULL, NULL),
(165, 'PX-260612-005', 'out', 'order_consume', NULL, 208, NULL, NULL, NULL, NULL, 3, '2026-06-12 09:20:20', 0, NULL, NULL, NULL, NULL),
(166, 'PX-260613-001', 'out', 'order_consume', NULL, 209, NULL, NULL, NULL, NULL, 3, '2026-06-13 02:08:06', 0, NULL, NULL, NULL, NULL),
(167, 'PN-260613-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-06-13 02:31:36', 0, NULL, NULL, NULL, NULL),
(168, 'PX-260613-002', 'out', 'order_consume', NULL, 211, NULL, NULL, NULL, NULL, 3, '2026-06-13 03:06:12', 0, NULL, NULL, NULL, NULL),
(169, 'PX-260615-001', 'out', 'order_consume', NULL, 212, NULL, NULL, NULL, NULL, 3, '2026-06-15 01:35:38', 0, NULL, NULL, NULL, NULL),
(170, 'PX-260615-002', 'out', 'staff_issue', 'Cấp SP cho KTV qua phiếu CAP-1506-001', NULL, 2, NULL, NULL, NULL, 3, '2026-06-15 02:17:07', 0, NULL, NULL, NULL, NULL),
(171, 'PX-260615-003', 'out', 'order_consume', NULL, 215, 8, NULL, NULL, NULL, 8, '2026-06-15 02:44:48', 0, NULL, NULL, NULL, NULL),
(172, 'PX-260615-004', 'out', 'order_consume', NULL, 218, 8, NULL, NULL, NULL, 8, '2026-06-15 04:52:09', 0, NULL, NULL, NULL, NULL),
(173, 'PX-260615-005', 'out', 'order_consume', NULL, 222, NULL, NULL, NULL, NULL, 3, '2026-06-15 06:34:40', 0, NULL, NULL, NULL, NULL),
(174, 'PX-260615-006', 'out', 'order_consume', NULL, 220, 2, NULL, NULL, NULL, 2, '2026-06-15 07:10:00', 0, NULL, NULL, NULL, NULL),
(175, 'PX-260615-007', 'out', 'order_consume', NULL, 224, 8, NULL, NULL, NULL, 8, '2026-06-15 11:12:08', 0, NULL, NULL, NULL, NULL),
(176, 'PX-260615-008', 'out', 'order_consume', NULL, 223, 8, NULL, NULL, NULL, 8, '2026-06-15 11:18:18', 0, NULL, NULL, NULL, NULL),
(177, 'PX-260616-001', 'out', 'order_consume', NULL, 214, 2, NULL, NULL, NULL, 2, '2026-06-16 01:34:24', 0, NULL, NULL, NULL, NULL),
(178, 'PX-260616-002', 'out', 'order_consume', NULL, 225, 2, NULL, NULL, NULL, 2, '2026-06-16 01:36:43', 0, NULL, NULL, NULL, NULL),
(179, 'PX-260616-003', 'out', 'order_consume', NULL, 213, 2, NULL, NULL, NULL, 2, '2026-06-16 01:37:52', 0, NULL, NULL, NULL, NULL),
(180, 'PX-260616-004', 'out', 'order_consume', NULL, 217, NULL, NULL, NULL, NULL, 3, '2026-06-16 02:00:19', 0, NULL, NULL, NULL, NULL),
(181, 'PX-260616-005', 'out', 'order_consume', NULL, 221, NULL, NULL, NULL, NULL, 6, '2026-06-16 02:06:01', 0, NULL, NULL, NULL, NULL),
(182, 'PN-260616-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-16 02:12:39', 0, NULL, NULL, NULL, NULL),
(183, 'PX-260616-006', 'out', 'order_consume', NULL, 228, NULL, NULL, NULL, NULL, 3, '2026-06-16 03:05:49', 0, NULL, NULL, NULL, NULL),
(184, 'PX-260616-007', 'out', 'order_consume', NULL, 216, NULL, NULL, NULL, NULL, 3, '2026-06-16 03:48:00', 0, NULL, NULL, NULL, NULL),
(185, 'PX-260616-008', 'out', 'order_consume', NULL, 227, NULL, NULL, NULL, NULL, 3, '2026-06-16 03:48:05', 0, NULL, NULL, NULL, NULL),
(186, 'PX-260616-009', 'out', 'order_consume', NULL, 229, 8, NULL, NULL, NULL, 8, '2026-06-16 04:32:53', 0, NULL, NULL, NULL, NULL),
(187, 'PN-260616-002', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-06-16 07:42:15', 0, NULL, NULL, NULL, NULL),
(188, 'PN-260616-003', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-06-16 07:42:58', 0, NULL, NULL, NULL, NULL),
(189, 'PN-260616-004', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-06-16 07:43:06', 0, NULL, NULL, NULL, NULL),
(190, 'PN-260616-005', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-06-16 07:43:25', 0, NULL, NULL, NULL, NULL),
(191, 'PN-260616-006', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-06-16 07:49:29', 0, NULL, NULL, NULL, NULL),
(192, 'PX-260616-010', 'out', 'order_consume', NULL, 226, 2, NULL, NULL, NULL, 2, '2026-06-16 08:47:03', 0, NULL, NULL, NULL, NULL),
(193, 'PX-260616-011', 'out', 'order_consume', NULL, 231, NULL, NULL, NULL, NULL, 3, '2026-06-16 08:48:02', 0, NULL, NULL, NULL, NULL),
(194, 'PX-260617-001', 'out', 'order_consume', NULL, 239, NULL, NULL, NULL, NULL, 3, '2026-06-17 06:26:47', 0, NULL, NULL, NULL, NULL),
(195, 'PX-260617-002', 'out', 'order_consume', NULL, 240, NULL, NULL, NULL, NULL, 3, '2026-06-17 06:39:36', 0, NULL, NULL, NULL, NULL),
(196, 'PX-260617-003', 'out', 'order_consume', NULL, 235, 2, NULL, NULL, NULL, 2, '2026-06-17 08:43:41', 0, NULL, NULL, NULL, NULL),
(197, 'PX-260617-004', 'out', 'order_consume', NULL, 178, 2, NULL, NULL, NULL, 2, '2026-06-17 08:45:13', 0, NULL, NULL, NULL, NULL),
(198, 'PX-260617-005', 'out', 'order_consume', NULL, 241, 8, NULL, NULL, NULL, 8, '2026-06-17 10:19:59', 0, NULL, NULL, NULL, NULL),
(199, 'PX-260618-001', 'out', 'staff_issue', 'Cấp SP cho KTV qua phiếu CAP-1806-001', NULL, 2, NULL, NULL, NULL, 3, '2026-06-18 01:54:00', 0, NULL, NULL, NULL, NULL),
(200, 'PX-260618-002', 'out', 'order_consume', NULL, 237, NULL, NULL, NULL, NULL, 3, '2026-06-18 02:01:21', 0, NULL, NULL, NULL, NULL),
(201, 'PX-260618-003', 'out', 'order_consume', NULL, 243, 2, NULL, NULL, NULL, 2, '2026-06-18 06:19:22', 0, NULL, NULL, NULL, NULL),
(202, 'PX-260618-004', 'out', 'order_consume', NULL, 245, NULL, NULL, NULL, NULL, 3, '2026-06-18 09:31:18', 0, NULL, NULL, NULL, NULL),
(203, 'PX-260619-001', 'out', 'order_consume', NULL, 246, NULL, NULL, NULL, NULL, 3, '2026-06-19 01:29:56', 0, NULL, NULL, NULL, NULL),
(204, 'PN-260619-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-19 03:09:54', 0, NULL, NULL, NULL, NULL),
(205, 'PN-260619-002', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-19 03:10:06', 0, NULL, NULL, NULL, NULL),
(206, 'PN-260619-003', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-19 03:10:17', 0, NULL, NULL, NULL, NULL),
(207, 'PN-260619-004', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-19 03:10:21', 0, NULL, NULL, NULL, NULL),
(208, 'PX-260619-002', 'out', 'order_consume', NULL, 172, NULL, NULL, NULL, NULL, 3, '2026-06-19 06:03:44', 0, NULL, NULL, NULL, NULL),
(209, 'PX-260619-003', 'out', 'order_consume', NULL, 242, NULL, NULL, NULL, NULL, 3, '2026-06-19 06:32:51', 0, NULL, NULL, NULL, NULL),
(210, 'PX-260619-004', 'out', 'order_consume', NULL, 249, NULL, NULL, NULL, NULL, 3, '2026-06-19 08:08:41', 0, NULL, NULL, NULL, NULL),
(211, 'PX-260619-005', 'out', 'staff_issue', 'Cấp SP cho KTV qua phiếu CAP-1906-001', NULL, 8, NULL, NULL, NULL, 3, '2026-06-19 09:08:04', 0, NULL, NULL, NULL, NULL),
(212, 'PX-260620-001', 'out', 'order_consume', NULL, 253, NULL, NULL, NULL, NULL, 3, '2026-06-20 04:31:11', 0, NULL, NULL, NULL, NULL),
(213, 'PX-260622-001', 'out', 'order_consume', NULL, 252, NULL, NULL, NULL, NULL, 3, '2026-06-22 01:22:13', 0, NULL, NULL, NULL, NULL),
(214, 'PX-260622-002', 'out', 'order_consume', NULL, 248, NULL, NULL, NULL, NULL, 6, '2026-06-22 01:38:51', 0, NULL, NULL, NULL, NULL),
(215, 'PX-260622-003', 'out', 'order_consume', NULL, 201, NULL, NULL, NULL, NULL, 3, '2026-06-22 01:47:42', 0, NULL, NULL, NULL, NULL),
(216, 'PX-260622-004', 'out', 'order_consume', NULL, 256, NULL, NULL, NULL, NULL, 6, '2026-06-22 07:37:55', 0, NULL, NULL, NULL, NULL),
(217, 'PX-260622-005', 'out', 'order_consume', NULL, 254, NULL, NULL, NULL, NULL, 3, '2026-06-22 07:59:18', 0, NULL, NULL, NULL, NULL),
(218, 'PX-260623-001', 'out', 'order_consume', NULL, 204, NULL, NULL, NULL, NULL, 3, '2026-06-23 01:25:48', 0, NULL, NULL, NULL, NULL),
(219, 'PX-260623-002', 'out', 'order_consume', NULL, 258, NULL, NULL, NULL, NULL, 3, '2026-06-23 01:49:21', 0, NULL, NULL, NULL, NULL),
(220, 'PN-260623-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-23 02:44:24', 0, NULL, NULL, NULL, NULL),
(221, 'PN-260623-002', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-23 02:47:10', 0, NULL, NULL, NULL, NULL),
(222, 'PX-260623-003', 'out', 'order_consume', NULL, 261, NULL, NULL, NULL, NULL, 3, '2026-06-23 04:39:08', 0, NULL, NULL, NULL, NULL),
(223, 'PN-260624-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-24 01:40:50', 0, NULL, NULL, NULL, NULL),
(224, 'PN-260624-002', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-24 01:41:00', 0, NULL, NULL, NULL, NULL),
(225, 'PN-260624-003', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-24 01:50:12', 0, NULL, NULL, NULL, NULL),
(226, 'PX-260624-001', 'out', 'order_consume', NULL, 260, NULL, NULL, NULL, NULL, 3, '2026-06-24 01:50:26', 0, NULL, NULL, NULL, NULL),
(227, 'PX-260624-002', 'out', 'order_consume', NULL, 257, NULL, NULL, NULL, NULL, 6, '2026-06-24 01:53:38', 0, NULL, NULL, NULL, NULL),
(228, 'PX-260624-003', 'out', 'order_consume', NULL, 263, NULL, NULL, NULL, NULL, 3, '2026-06-24 08:10:56', 0, NULL, NULL, NULL, NULL),
(229, 'PX-260625-001', 'out', 'order_consume', NULL, 265, 8, NULL, NULL, NULL, 8, '2026-06-25 02:07:46', 0, NULL, NULL, NULL, NULL),
(230, 'PX-260625-002', 'out', 'order_consume', NULL, 267, 8, NULL, NULL, NULL, 8, '2026-06-25 09:29:01', 0, NULL, NULL, NULL, NULL),
(231, 'PX-260626-001', 'out', 'order_consume', NULL, 269, NULL, NULL, NULL, NULL, 3, '2026-06-26 02:00:07', 0, NULL, NULL, NULL, NULL),
(232, 'PX-260626-002', 'out', 'order_consume', NULL, 262, NULL, NULL, NULL, NULL, 3, '2026-06-26 02:07:50', 0, NULL, NULL, NULL, NULL),
(233, 'PN-260626-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-26 03:48:52', 0, NULL, NULL, NULL, NULL),
(234, 'PX-260626-003', 'out', 'order_consume', NULL, 271, NULL, NULL, NULL, NULL, 3, '2026-06-26 07:44:38', 0, NULL, NULL, NULL, NULL),
(235, 'PX-260626-004', 'out', 'order_consume', NULL, 247, NULL, NULL, NULL, NULL, 3, '2026-06-26 08:22:00', 0, NULL, NULL, NULL, NULL),
(236, 'PX-260626-005', 'out', 'order_consume', NULL, 272, NULL, NULL, NULL, NULL, 3, '2026-06-26 09:04:46', 0, NULL, NULL, NULL, NULL),
(237, 'PX-260627-001', 'out', 'order_consume', NULL, 273, NULL, NULL, NULL, NULL, 3, '2026-06-27 01:26:22', 0, NULL, NULL, NULL, NULL),
(238, 'PN-260627-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-27 01:35:47', 0, NULL, NULL, NULL, NULL),
(239, 'PX-260627-002', 'out', 'order_consume', NULL, 274, NULL, NULL, NULL, NULL, 3, '2026-06-27 01:49:57', 0, NULL, NULL, NULL, NULL),
(240, 'PX-260627-003', 'out', 'order_consume', NULL, 276, NULL, NULL, NULL, NULL, 3, '2026-06-27 02:16:30', 0, NULL, NULL, NULL, NULL),
(241, 'PX-260627-004', 'out', 'order_consume', NULL, 270, NULL, NULL, NULL, NULL, 3, '2026-06-27 03:21:02', 0, NULL, NULL, NULL, NULL),
(242, 'PX-260627-005', 'out', 'order_consume', NULL, 268, 8, NULL, NULL, NULL, 8, '2026-06-27 06:10:24', 0, NULL, NULL, NULL, NULL),
(243, 'PX-260629-001', 'out', 'order_consume', NULL, 255, NULL, NULL, NULL, NULL, 3, '2026-06-29 02:23:09', 0, NULL, NULL, NULL, NULL),
(244, 'PN-260629-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-06-29 03:18:54', 0, NULL, NULL, NULL, NULL),
(245, 'PX-260629-002', 'out', 'staff_issue', 'Cấp SP cho KTV qua phiếu CAP-2906-001', NULL, 2, NULL, NULL, NULL, 3, '2026-06-29 07:17:49', 0, NULL, NULL, NULL, NULL),
(246, 'PX-260629-003', 'out', 'staff_issue', 'Cấp SP cho KTV qua phiếu CAP-2606-001', NULL, 2, NULL, NULL, NULL, 3, '2026-06-29 07:17:50', 0, NULL, NULL, NULL, NULL),
(247, 'PX-260629-004', 'out', 'order_consume', NULL, 279, NULL, NULL, NULL, NULL, 3, '2026-06-29 10:14:12', 0, NULL, NULL, NULL, NULL),
(248, 'PX-260630-001', 'out', 'order_consume', NULL, 282, NULL, NULL, NULL, NULL, 3, '2026-06-30 03:43:22', 0, NULL, NULL, NULL, NULL),
(249, 'PX-260630-002', 'out', 'staff_issue', 'Cấp SP cho KTV qua phiếu CAP-3006-001', NULL, 2, NULL, NULL, NULL, 3, '2026-06-30 06:33:05', 0, NULL, NULL, NULL, NULL),
(250, 'PX-260630-003', 'out', 'order_consume', NULL, 285, 2, NULL, NULL, NULL, 2, '2026-06-30 09:42:03', 0, NULL, NULL, NULL, NULL),
(251, 'PX-260701-001', 'out', 'order_consume', NULL, 287, NULL, NULL, NULL, NULL, 6, '2026-07-01 04:32:29', 0, NULL, NULL, NULL, NULL),
(252, 'PX-260701-002', 'out', 'order_consume', NULL, 293, NULL, NULL, NULL, NULL, 3, '2026-07-01 04:45:14', 0, NULL, NULL, NULL, NULL),
(253, 'PX-260701-003', 'out', 'order_consume', NULL, 295, NULL, NULL, NULL, NULL, 6, '2026-07-01 10:19:05', 0, NULL, NULL, NULL, NULL),
(254, 'PX-260701-004', 'out', 'order_consume', NULL, 292, 8, NULL, NULL, NULL, 8, '2026-07-01 10:26:20', 0, NULL, NULL, NULL, NULL),
(255, 'PX-260701-005', 'out', 'order_consume', NULL, 278, 8, NULL, NULL, NULL, 8, '2026-07-01 10:27:33', 0, NULL, NULL, NULL, NULL),
(256, 'PX-260702-001', 'out', 'order_consume', NULL, 296, NULL, NULL, NULL, NULL, 3, '2026-07-02 01:33:22', 0, NULL, NULL, NULL, NULL),
(257, 'PX-260702-002', 'out', 'order_consume', NULL, 297, NULL, NULL, NULL, NULL, 3, '2026-07-02 01:34:44', 0, NULL, NULL, NULL, NULL),
(258, 'PX-260702-003', 'out', 'order_consume', NULL, 298, NULL, NULL, NULL, NULL, 3, '2026-07-02 06:00:33', 0, NULL, NULL, NULL, NULL),
(259, 'PX-260702-004', 'out', 'staff_issue', 'Cấp SP cho KTV qua phiếu CAP-0207-001', NULL, 8, NULL, NULL, NULL, 3, '2026-07-02 07:42:13', 0, NULL, NULL, NULL, NULL),
(260, 'PX-260702-005', 'out', 'staff_issue', 'Cấp SP cho KTV qua phiếu CAP-1106-002', NULL, 8, NULL, NULL, NULL, 3, '2026-07-02 07:42:17', 0, NULL, NULL, NULL, NULL),
(261, 'PN-260702-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-07-02 07:51:13', 0, NULL, NULL, NULL, NULL),
(262, 'PX-260702-006', 'out', 'order_consume', NULL, 302, NULL, NULL, NULL, NULL, 3, '2026-07-02 09:29:55', 0, NULL, NULL, NULL, NULL),
(263, 'PX-260702-007', 'out', 'order_consume', NULL, 301, 8, NULL, NULL, NULL, 8, '2026-07-02 11:34:25', 0, NULL, NULL, NULL, NULL),
(264, 'PX-260703-001', 'out', 'order_consume', NULL, 305, 8, NULL, NULL, NULL, 8, '2026-07-03 03:01:39', 0, NULL, NULL, NULL, NULL),
(265, 'PX-260703-002', 'out', 'order_consume', NULL, 306, NULL, NULL, NULL, NULL, 6, '2026-07-03 06:48:41', 0, NULL, NULL, NULL, NULL),
(266, 'PX-260704-001', 'out', 'order_consume', NULL, 309, NULL, NULL, NULL, NULL, 3, '2026-07-04 01:26:27', 0, NULL, NULL, NULL, NULL),
(267, 'PX-260704-002', 'out', 'staff_issue', 'Cấp SP cho KTV qua phiếu CAP-0407-001', NULL, 2, NULL, NULL, NULL, 3, '2026-07-04 02:06:20', 0, NULL, NULL, NULL, NULL),
(268, 'PX-260705-001', 'out', 'staff_issue', 'Cấp SP cho KTV qua phiếu CAP-0507-001', NULL, 2, NULL, NULL, NULL, 1, '2026-07-05 09:06:24', 0, NULL, NULL, NULL, NULL),
(269, 'PX-260706-001', 'out', 'order_consume', NULL, 312, NULL, NULL, NULL, NULL, 6, '2026-07-06 02:06:08', 0, NULL, NULL, NULL, NULL),
(270, 'PX-260706-002', 'out', 'order_consume', NULL, 314, NULL, NULL, NULL, NULL, 6, '2026-07-06 02:34:11', 0, NULL, NULL, NULL, NULL),
(271, 'PX-260706-003', 'out', 'order_consume', NULL, 315, NULL, NULL, NULL, NULL, 3, '2026-07-06 04:11:35', 0, NULL, NULL, NULL, NULL),
(272, 'PX-260706-004', 'out', 'order_consume', NULL, 311, 2, NULL, NULL, NULL, 2, '2026-07-06 05:16:29', 0, NULL, NULL, NULL, NULL),
(273, 'PX-260706-005', 'out', 'order_consume', NULL, 290, 2, NULL, NULL, NULL, 2, '2026-07-06 05:22:08', 0, NULL, NULL, NULL, NULL),
(274, 'PX-260706-006', 'out', 'order_consume', NULL, 280, 2, NULL, NULL, NULL, 2, '2026-07-06 05:26:19', 0, NULL, NULL, NULL, NULL),
(275, 'PX-260706-007', 'out', 'order_consume', NULL, 313, NULL, NULL, NULL, NULL, 3, '2026-07-06 07:06:57', 0, NULL, NULL, NULL, NULL),
(276, 'PX-260706-008', 'out', 'order_consume', NULL, 316, NULL, NULL, NULL, NULL, 3, '2026-07-06 07:28:04', 0, NULL, NULL, NULL, NULL),
(277, 'PN-260706-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-07-06 10:34:00', 0, NULL, NULL, NULL, NULL),
(278, 'PX-260707-001', 'out', 'order_consume', NULL, 320, NULL, NULL, NULL, NULL, 3, '2026-07-07 01:30:32', 0, NULL, NULL, NULL, NULL),
(279, 'PN-260707-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-07-07 02:26:05', 0, NULL, NULL, NULL, NULL),
(280, 'PX-260707-002', 'out', 'order_consume', NULL, 326, NULL, NULL, NULL, NULL, 3, '2026-07-07 02:28:25', 0, NULL, NULL, NULL, NULL),
(281, 'PX-260707-003', 'out', 'order_consume', NULL, 327, NULL, NULL, NULL, NULL, 3, '2026-07-07 03:22:10', 0, NULL, NULL, NULL, NULL),
(282, 'PX-260707-004', 'out', 'order_consume', NULL, 325, 8, NULL, NULL, NULL, 8, '2026-07-07 05:20:31', 0, NULL, NULL, NULL, NULL),
(283, 'PX-260707-005', 'out', 'order_consume', NULL, 324, 8, NULL, NULL, NULL, 8, '2026-07-07 05:21:20', 0, NULL, NULL, NULL, NULL),
(284, 'PX-260707-006', 'out', 'order_consume', NULL, 322, 8, NULL, NULL, NULL, 8, '2026-07-07 05:21:55', 0, NULL, NULL, NULL, NULL),
(285, 'PX-260707-007', 'out', 'adjust_minus', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-07-07 08:52:07', 0, NULL, NULL, NULL, NULL),
(286, 'PX-260707-008', 'out', 'order_consume', NULL, 318, 2, NULL, NULL, NULL, 2, '2026-07-07 09:22:08', 0, NULL, NULL, NULL, NULL),
(287, 'PX-260707-009', 'out', 'order_consume', NULL, 330, 8, NULL, NULL, NULL, 8, '2026-07-07 09:55:50', 0, NULL, NULL, NULL, NULL),
(288, 'PX-260707-010', 'out', 'staff_issue', 'Cấp SP cho KTV qua phiếu CAP-0707-001', NULL, 8, NULL, NULL, NULL, 3, '2026-07-07 09:59:01', 0, NULL, NULL, NULL, NULL),
(289, 'PX-260707-011', 'out', 'staff_issue', 'Cấp SP cho KTV qua phiếu CAP-0707-002', NULL, 2, NULL, NULL, NULL, 3, '2026-07-07 09:59:12', 0, NULL, NULL, NULL, NULL),
(290, 'PX-260708-001', 'out', 'order_consume', NULL, 335, NULL, NULL, NULL, NULL, 3, '2026-07-08 02:27:06', 0, NULL, NULL, NULL, NULL),
(291, 'PX-260708-002', 'out', 'order_consume', NULL, 336, NULL, NULL, NULL, NULL, 3, '2026-07-08 04:19:15', 0, NULL, NULL, NULL, NULL),
(292, 'PX-260708-003', 'out', 'order_consume', NULL, 337, 8, NULL, NULL, NULL, 8, '2026-07-08 07:54:06', 0, NULL, NULL, NULL, NULL),
(293, 'PN-260709-001', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-07-09 07:19:37', 0, NULL, NULL, NULL, NULL),
(294, 'PN-260709-002', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-07-09 07:46:15', 0, NULL, NULL, NULL, NULL),
(295, 'PN-260709-003', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-07-09 07:51:04', 0, NULL, NULL, NULL, NULL),
(296, 'PN-260709-004', 'in', 'adjust_plus', NULL, NULL, NULL, NULL, NULL, NULL, 3, '2026-07-09 07:59:03', 0, NULL, NULL, NULL, NULL),
(297, 'PX-260709-001', 'out', 'order_consume', NULL, 343, NULL, NULL, NULL, NULL, 3, '2026-07-09 09:07:24', 0, NULL, NULL, NULL, NULL),
(298, 'PX-260709-002', 'out', 'order_consume', NULL, 341, 2, NULL, NULL, NULL, 2, '2026-07-09 11:59:08', 0, NULL, NULL, NULL, NULL),
(299, 'PX-260709-003', 'out', 'order_consume', NULL, 334, 2, NULL, NULL, NULL, 2, '2026-07-09 11:59:58', 0, NULL, NULL, NULL, NULL),
(300, 'PX-260709-004', 'out', 'order_consume', NULL, 339, 2, NULL, NULL, NULL, 2, '2026-07-09 12:00:39', 0, NULL, NULL, NULL, NULL),
(301, 'PX-260710-001', 'out', 'order_consume', NULL, 346, 8, NULL, NULL, NULL, 8, '2026-07-10 01:39:09', 0, NULL, NULL, NULL, NULL),
(302, 'PX-260710-002', 'out', 'order_consume', NULL, 310, NULL, NULL, NULL, NULL, 1, '2026-07-10 04:24:44', 0, NULL, NULL, NULL, NULL),
(303, 'PX-260710-003', 'out', 'order_consume', NULL, 303, NULL, NULL, NULL, NULL, 1, '2026-07-10 04:26:27', 0, NULL, NULL, NULL, NULL),
(304, 'PX-260710-004', 'out', 'staff_issue', 'Cấp SP cho KTV qua phiếu CAP-1007-001', NULL, 8, NULL, NULL, NULL, 3, '2026-07-10 04:38:53', 0, NULL, NULL, NULL, NULL),
(305, 'PX-260710-005', 'out', 'order_consume', NULL, 353, NULL, NULL, NULL, NULL, 3, '2026-07-10 09:51:21', 0, NULL, NULL, NULL, NULL),
(306, 'PX-260710-006', 'out', 'order_consume', NULL, 352, NULL, NULL, NULL, NULL, 3, '2026-07-10 09:51:26', 0, NULL, NULL, NULL, NULL),
(307, 'PX-260711-001', 'out', 'order_consume', NULL, 355, NULL, NULL, NULL, NULL, 3, '2026-07-11 04:30:27', 0, NULL, NULL, NULL, NULL),
(308, 'PX-260711-002', 'out', 'order_consume', NULL, 357, 8, NULL, NULL, NULL, 8, '2026-07-11 10:39:05', 0, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `stock_receipt_items`
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
-- Dumping data for table `stock_receipt_items`
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
(187, 135, 18, 1, NULL, NULL, NULL),
(188, 136, 2, 1, NULL, NULL, NULL),
(189, 137, 2, 1, NULL, NULL, NULL),
(190, 138, 2, 1, NULL, NULL, NULL),
(191, 139, 4, 6, NULL, NULL, NULL),
(192, 139, 14, 5, NULL, NULL, NULL),
(193, 139, 27, 10, NULL, NULL, NULL),
(194, 139, 30, 4, NULL, NULL, NULL),
(195, 139, 31, 10, NULL, NULL, NULL),
(196, 140, 4, 5, NULL, NULL, NULL),
(197, 140, 10, 5, NULL, NULL, NULL),
(198, 140, 27, 15, NULL, NULL, NULL),
(199, 141, 10, 20, NULL, NULL, NULL),
(200, 142, 40, 110, NULL, NULL, NULL),
(201, 143, 39, 50, NULL, NULL, NULL),
(202, 143, 40, 50, NULL, NULL, NULL),
(203, 144, 18, 1, NULL, NULL, NULL),
(204, 145, 4, 2, NULL, NULL, NULL),
(205, 145, 10, 5, NULL, NULL, NULL),
(206, 145, 12, 2, NULL, NULL, NULL),
(207, 145, 23, 5, NULL, NULL, NULL),
(208, 146, 41, 100, NULL, NULL, NULL),
(209, 147, 2, 1, NULL, NULL, NULL),
(210, 148, 2, 6, NULL, '860056084514638\n860056084584086\n860056084517391\n860056084545590\n860056084522839\n860056084598573', NULL),
(211, 149, 5, 1, NULL, '862051082904335', NULL),
(212, 149, 10, 1, NULL, NULL, NULL),
(213, 149, 28, 1, NULL, '60056083525122', NULL),
(214, 149, 31, 1, NULL, NULL, NULL),
(215, 150, 15, 2, NULL, NULL, NULL),
(216, 150, 28, 4, NULL, '860056083566753\n860056083563651\n860056083535360\n860056083526039', NULL),
(217, 151, 4, 3, NULL, '862051082886235\n862051082920869\n862051082887712', NULL),
(218, 151, 6, 3, NULL, NULL, NULL),
(219, 151, 10, 3, NULL, NULL, NULL),
(220, 151, 12, 2, NULL, NULL, NULL),
(221, 151, 23, 3, NULL, NULL, NULL),
(222, 151, 31, 3, NULL, NULL, NULL),
(223, 152, 18, 1, NULL, NULL, NULL),
(224, 153, 5, 5, NULL, NULL, NULL),
(225, 153, 6, 5, NULL, NULL, NULL),
(226, 154, 2, 10, NULL, NULL, NULL),
(227, 155, 42, 100, NULL, NULL, NULL),
(228, 156, 42, 2, NULL, NULL, NULL),
(229, 157, 2, 1, NULL, NULL, NULL),
(230, 158, 4, 1, NULL, NULL, NULL),
(231, 158, 6, 1, NULL, NULL, NULL),
(232, 158, 10, 1, NULL, NULL, NULL),
(233, 159, 18, 2, NULL, NULL, NULL),
(234, 160, 18, 3, NULL, NULL, NULL),
(235, 161, 13, 1, NULL, NULL, NULL),
(236, 162, 28, 1, NULL, NULL, NULL),
(237, 163, 2, 1, NULL, NULL, NULL),
(238, 164, 18, 1, NULL, NULL, NULL),
(239, 165, 2, 1, NULL, NULL, NULL),
(240, 165, 17, 2, NULL, NULL, NULL),
(241, 166, 18, 2, NULL, NULL, NULL),
(242, 167, 2, 100, NULL, NULL, NULL),
(243, 168, 2, 15, NULL, NULL, NULL),
(244, 169, 18, 1, NULL, NULL, NULL),
(245, 170, 2, 5, NULL, '860056084570879\n860056084576793\n860056084571018\n860056084079681\n860056084006007', NULL),
(246, 171, 2, 1, NULL, NULL, NULL),
(247, 172, 2, 1, NULL, NULL, NULL),
(248, 172, 24, 1, NULL, NULL, NULL),
(249, 173, 26, 1, NULL, NULL, NULL),
(250, 174, 2, 1, NULL, NULL, NULL),
(251, 174, 24, 1, NULL, NULL, NULL),
(252, 175, 2, 1, NULL, NULL, NULL),
(253, 176, 8, 1, NULL, NULL, NULL),
(254, 177, 2, 1, NULL, NULL, NULL),
(255, 178, 2, 1, NULL, NULL, NULL),
(256, 179, 2, 1, NULL, NULL, NULL),
(257, 180, 17, 1, NULL, NULL, NULL),
(258, 181, 4, 1, NULL, NULL, NULL),
(259, 181, 10, 1, NULL, NULL, NULL),
(260, 181, 12, 1, NULL, NULL, NULL),
(261, 182, 4, 20, NULL, NULL, NULL),
(262, 183, 18, 1, NULL, NULL, NULL),
(263, 184, 28, 3, NULL, NULL, NULL),
(264, 185, 4, 3, NULL, NULL, NULL),
(265, 186, 2, 1, NULL, NULL, NULL),
(266, 187, 5, 7, NULL, NULL, NULL),
(267, 188, 5, 8, NULL, NULL, NULL),
(268, 189, 5, 2, NULL, NULL, NULL),
(269, 190, 6, 20, NULL, NULL, NULL),
(270, 191, 31, 20, NULL, NULL, NULL),
(271, 192, 2, 2, NULL, NULL, NULL),
(272, 193, 5, 5, NULL, NULL, NULL),
(273, 193, 6, 5, NULL, NULL, NULL),
(274, 193, 9, 5, NULL, NULL, NULL),
(275, 194, 18, 1, NULL, NULL, NULL),
(276, 195, 18, 1, NULL, NULL, NULL),
(277, 196, 8, 1, NULL, NULL, NULL),
(278, 197, 2, 1, NULL, NULL, NULL),
(279, 198, 2, 1, NULL, NULL, NULL),
(280, 199, 2, 7, NULL, '860056084512004\n860056084504290\n860056084502484\n860056084602540\n860056084525691\n860056084524298\n860056084601724', NULL),
(281, 200, 4, 2, NULL, NULL, NULL),
(282, 201, 28, 1, NULL, NULL, NULL),
(283, 202, 4, 1, NULL, NULL, NULL),
(284, 202, 31, 1, NULL, NULL, NULL),
(285, 202, 39, 5, NULL, NULL, NULL),
(286, 203, 18, 1, NULL, NULL, NULL),
(287, 204, 2, 50, NULL, NULL, NULL),
(288, 205, 10, 20, NULL, NULL, NULL),
(289, 206, 4, 10, NULL, NULL, NULL),
(290, 207, 5, 10, NULL, NULL, NULL),
(291, 208, 18, 1, NULL, NULL, NULL),
(292, 208, 25, 13, NULL, NULL, NULL),
(293, 208, 26, 7, NULL, NULL, NULL),
(294, 209, 37, 5, NULL, NULL, NULL),
(295, 210, 18, 4, NULL, NULL, NULL),
(296, 211, 2, 7, NULL, '860056084552364\n860056084601088\n860056084524561\n860056084504324\n860056084526632\n860056084601146\n860056084601203', NULL),
(297, 211, 28, 3, NULL, '860056083563867\n860056083560459\n860056083562513', NULL),
(298, 212, 5, 2, NULL, NULL, NULL),
(299, 212, 31, 2, NULL, NULL, NULL),
(300, 213, 18, 2, NULL, NULL, NULL),
(301, 214, 18, 1, NULL, NULL, NULL),
(302, 215, 18, 5, NULL, NULL, NULL),
(303, 216, 2, 1, NULL, NULL, NULL),
(304, 216, 5, 5, NULL, NULL, NULL),
(305, 217, 4, 1, NULL, NULL, NULL),
(306, 217, 10, 1, NULL, NULL, NULL),
(307, 217, 27, 4, NULL, NULL, NULL),
(308, 217, 31, 2, NULL, NULL, NULL),
(309, 218, 18, 1, NULL, NULL, NULL),
(310, 219, 18, 1, NULL, NULL, NULL),
(311, 220, 9, 5, NULL, NULL, NULL),
(312, 221, 43, 10, NULL, NULL, NULL),
(313, 222, 18, 1, NULL, NULL, NULL),
(314, 223, 4, 15, NULL, NULL, NULL),
(315, 224, 10, 15, NULL, NULL, NULL),
(316, 225, 6, 15, NULL, NULL, NULL),
(317, 226, 4, 15, NULL, NULL, NULL),
(318, 226, 10, 15, NULL, NULL, NULL),
(319, 226, 23, 20, NULL, NULL, NULL),
(320, 226, 43, 10, NULL, NULL, NULL),
(321, 227, 5, 1, NULL, NULL, NULL),
(322, 227, 10, 1, NULL, NULL, NULL),
(323, 228, 18, 10, NULL, NULL, NULL),
(324, 229, 2, 1, NULL, NULL, NULL),
(325, 230, 2, 1, NULL, NULL, NULL),
(326, 231, 18, 1, NULL, NULL, NULL),
(327, 232, 17, 100, NULL, NULL, NULL),
(328, 233, 40, 100, NULL, NULL, NULL),
(329, 234, 14, 5, NULL, NULL, NULL),
(330, 235, 18, 1, NULL, NULL, NULL),
(331, 236, 18, 10, NULL, NULL, NULL),
(332, 236, 20, 5, NULL, NULL, NULL),
(333, 236, 22, 5, NULL, NULL, NULL),
(334, 237, 18, 1, NULL, NULL, NULL),
(335, 238, 23, 18, NULL, NULL, NULL),
(336, 239, 18, 1, NULL, NULL, NULL),
(337, 240, 18, 1, NULL, NULL, NULL),
(338, 241, 40, 10, NULL, NULL, NULL),
(339, 242, 2, 1, NULL, NULL, NULL),
(340, 242, 23, 1, NULL, NULL, NULL),
(341, 243, 18, 1, NULL, NULL, NULL),
(342, 244, 44, 100, NULL, NULL, NULL),
(343, 245, 5, 1, NULL, '863982083980925', NULL),
(344, 245, 10, 1, NULL, NULL, NULL),
(345, 246, 4, 1, NULL, '863982083980891', NULL),
(346, 246, 10, 1, NULL, NULL, NULL),
(347, 247, 18, 4, NULL, NULL, NULL),
(348, 247, 20, 6, NULL, NULL, NULL),
(349, 247, 44, 1, NULL, NULL, NULL),
(350, 248, 18, 1, NULL, NULL, NULL),
(351, 249, 40, 5, NULL, '860056083535832\n860056083553116\n860056083559402\n860056083551193\n860056083557067', NULL),
(352, 250, 40, 1, NULL, NULL, NULL),
(353, 251, 22, 10, NULL, NULL, NULL),
(354, 252, 18, 20, NULL, NULL, NULL),
(355, 252, 19, 5, NULL, NULL, NULL),
(356, 252, 20, 11, NULL, NULL, NULL),
(357, 253, 18, 20, NULL, NULL, NULL),
(358, 253, 19, 20, NULL, NULL, NULL),
(359, 253, 20, 20, NULL, NULL, NULL),
(360, 254, 18, 1, NULL, NULL, NULL),
(361, 255, 2, 2, NULL, NULL, NULL),
(362, 255, 23, 2, NULL, NULL, NULL),
(363, 256, 18, 1, NULL, NULL, NULL),
(364, 257, 18, 1, NULL, NULL, NULL),
(365, 258, 2, 10, NULL, NULL, NULL),
(366, 258, 39, 13, NULL, NULL, NULL),
(367, 259, 40, 5, NULL, '860056083549650\n860056083535543\n860056083557513\n860056083531054\n860056083569393', NULL),
(368, 260, 5, 1, NULL, '862051082890211\n860108072884687', NULL),
(369, 261, 12, 20, NULL, NULL, NULL),
(370, 262, 18, 2, NULL, NULL, NULL),
(371, 263, 4, 1, NULL, NULL, NULL),
(372, 264, 5, 1, NULL, NULL, NULL),
(373, 264, 6, 1, NULL, NULL, NULL),
(374, 264, 10, 1, NULL, NULL, NULL),
(375, 265, 20, 3, NULL, NULL, NULL),
(376, 266, 18, 2, NULL, NULL, NULL),
(377, 267, 4, 3, NULL, '863982083972500\n863982084031256\n863982083954482', NULL),
(378, 267, 5, 1, NULL, '863982083979471', NULL),
(379, 267, 10, 4, NULL, NULL, NULL),
(380, 267, 27, 4, NULL, NULL, NULL),
(381, 267, 31, 4, NULL, NULL, NULL),
(382, 268, 28, 5, NULL, '860056083569583\n860056083552100\n860056083533068\n860056083551862\n860056083543653', NULL),
(383, 269, 17, 1, NULL, NULL, NULL),
(384, 270, 18, 1, NULL, NULL, NULL),
(385, 271, 18, 1, NULL, NULL, NULL),
(386, 272, 28, 1, NULL, NULL, NULL),
(387, 273, 2, 1, NULL, NULL, NULL),
(388, 274, 2, 1, NULL, NULL, NULL),
(389, 275, 18, 1, NULL, NULL, NULL),
(390, 276, 18, 1, NULL, NULL, NULL),
(391, 277, 45, 1000, NULL, NULL, NULL),
(392, 278, 18, 1, NULL, NULL, NULL),
(393, 279, 46, 4, NULL, NULL, NULL),
(394, 280, 46, 4, NULL, NULL, NULL),
(395, 281, 18, 2, NULL, NULL, NULL),
(396, 282, 5, 1, NULL, NULL, NULL),
(397, 282, 6, 1, NULL, NULL, NULL),
(398, 282, 10, 1, NULL, NULL, NULL),
(399, 283, 24, 1, NULL, NULL, NULL),
(400, 284, 34, 1, NULL, NULL, NULL),
(401, 285, 2, 160, NULL, NULL, NULL),
(402, 286, 4, 3, NULL, NULL, NULL),
(403, 286, 27, 3, NULL, NULL, NULL),
(404, 286, 45, 1, NULL, NULL, NULL),
(405, 287, 2, 1, NULL, NULL, NULL),
(406, 288, 24, 100, NULL, NULL, NULL),
(407, 289, 24, 100, NULL, NULL, NULL),
(408, 290, 18, 1, NULL, NULL, NULL),
(409, 291, 18, 1, NULL, NULL, NULL),
(410, 292, 24, 1, NULL, NULL, NULL),
(411, 293, 2, 150, NULL, NULL, NULL),
(412, 294, 43, 10, NULL, NULL, NULL),
(413, 295, 47, 2, NULL, NULL, NULL),
(414, 296, 48, 2, NULL, NULL, NULL),
(415, 297, 2, 20, NULL, NULL, NULL),
(416, 297, 23, 3, NULL, NULL, NULL),
(417, 297, 43, 2, NULL, NULL, NULL),
(418, 297, 47, 2, NULL, NULL, NULL),
(419, 297, 48, 2, NULL, NULL, NULL),
(420, 298, 20, 1, NULL, NULL, NULL),
(421, 299, 24, 1, NULL, NULL, NULL),
(422, 300, 5, 1, NULL, NULL, NULL),
(423, 301, 2, 1, NULL, NULL, NULL),
(424, 302, 2, 3, NULL, NULL, NULL),
(425, 302, 4, 7, NULL, NULL, NULL),
(426, 302, 31, 5, NULL, NULL, NULL),
(427, 303, 2, 1, NULL, NULL, NULL),
(428, 303, 4, 1, NULL, NULL, NULL),
(429, 303, 10, 1, NULL, NULL, NULL),
(430, 303, 31, 1, NULL, NULL, NULL),
(431, 303, 39, 4, NULL, NULL, NULL),
(432, 303, 40, 3, NULL, NULL, NULL),
(433, 304, 4, 2, NULL, '863982083973300\n862051082890211', NULL),
(434, 304, 10, 1, NULL, NULL, NULL),
(435, 304, 23, 2, NULL, NULL, NULL),
(436, 304, 31, 2, NULL, NULL, NULL),
(437, 305, 17, 6, NULL, NULL, NULL),
(438, 305, 18, 1, NULL, NULL, NULL),
(439, 306, 4, 1, NULL, NULL, NULL),
(440, 306, 10, 1, NULL, NULL, NULL),
(441, 306, 27, 1, NULL, NULL, NULL),
(442, 306, 31, 1, NULL, NULL, NULL),
(443, 306, 39, 3, NULL, NULL, NULL),
(444, 306, 40, 3, NULL, NULL, NULL),
(445, 307, 17, 63, NULL, NULL, NULL),
(446, 308, 2, 1, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `stock_return_requests`
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
-- Dumping data for table `stock_return_requests`
--

INSERT INTO `stock_return_requests` (`id`, `staff_id`, `product_id`, `qty`, `note`, `status`, `created_at`, `reviewed_by_staff_id`, `reviewed_at`, `reject_reason`, `receipt_id`) VALUES
(1, 4, 2, 30, NULL, 'approved', '2026-05-26 22:15:51', 1, '2026-05-26 22:16:47', NULL, 76),
(2, 4, 1, 50, NULL, 'approved', '2026-05-26 22:15:57', 1, '2026-05-26 22:16:46', NULL, 75),
(3, 4, 4, 1, NULL, 'approved', '2026-05-26 22:16:03', 1, '2026-05-26 22:16:48', NULL, 77);

-- --------------------------------------------------------

--
-- Table structure for table `stock_takes`
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
-- Dumping data for table `stock_takes`
--

INSERT INTO `stock_takes` (`id`, `code`, `status`, `started_at`, `finished_at`, `by_staff_id`, `finished_by_staff_id`, `note`, `total_lines`, `total_variance_abs`, `is_deleted`) VALUES
(1, 'KK-260523-001', 'draft', '2026-05-23 03:04:45', NULL, 6, NULL, NULL, 0, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `stock_take_lines`
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
-- Table structure for table `suppliers`
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
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `name`, `phone`, `address`, `note`, `is_deleted`) VALUES
(1, 'Công Ty VINAGPS', NULL, NULL, NULL, 0),
(2, 'nhà cung cấp A )test', NULL, NULL, NULL, 0);

-- --------------------------------------------------------

--
-- Table structure for table `supplier_warranty_batches`
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
-- Table structure for table `supplier_warranty_batch_items`
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
-- Table structure for table `warehouse_logs`
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
-- Table structure for table `warranty_orders`
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
-- Dumping data for table `warranty_orders`
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
-- Table structure for table `warranty_order_charges`
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
-- Dumping data for table `warranty_order_charges`
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
-- Table structure for table `warranty_order_items`
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
-- Dumping data for table `warranty_order_items`
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
-- Table structure for table `warranty_order_photos`
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
-- Indexes for dumped tables
--

--
-- Indexes for table `agency_collections`
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
-- Indexes for table `app_settings`
--
ALTER TABLE `app_settings`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `badge_order_attachments`
--
ALTER TABLE `badge_order_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_battach_border` (`badge_order_id`,`is_deleted`),
  ADD KEY `idx_battach_kind` (`kind`);

--
-- Indexes for table `badge_order_charges`
--
ALTER TABLE `badge_order_charges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_bcharge_order` (`badge_order_id`,`is_deleted`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `collections`
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
-- Indexes for table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `customer_id` (`customer_id`),
  ADD KEY `idx_conv_deleted` (`is_deleted`),
  ADD KEY `idx_conv_last_msg` (`last_message_at`);

--
-- Indexes for table `conversation_members`
--
ALTER TABLE `conversation_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_conv_staff` (`conversation_id`,`staff_id`),
  ADD KEY `fk_cm_added_by` (`added_by`),
  ADD KEY `idx_cm_staff_active` (`staff_id`,`removed_at`);

--
-- Indexes for table `customers`
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
-- Indexes for table `customer_accounts`
--
ALTER TABLE `customer_accounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ca_customer` (`customer_id`,`is_deleted`);

--
-- Indexes for table `customer_old_debts`
--
ALTER TABLE `customer_old_debts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `customer_product_prices`
--
ALTER TABLE `customer_product_prices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_cust_prod` (`customer_id`,`product_id`),
  ADD KEY `fk_cpp_product` (`product_id`);

--
-- Indexes for table `customer_sims`
--
ALTER TABLE `customer_sims`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cs_customer` (`customer_id`,`is_deleted`);

--
-- Indexes for table `customer_update_requests`
--
ALTER TABLE `customer_update_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_cur_order` (`ref_order_id`),
  ADD KEY `idx_cur_customer` (`customer_id`),
  ADD KEY `idx_cur_status` (`status`,`is_deleted`),
  ADD KEY `idx_cur_kind` (`asset_kind`,`status`);

--
-- Indexes for table `customer_vehicles`
--
ALTER TABLE `customer_vehicles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cv_customer` (`customer_id`,`is_deleted`);

--
-- Indexes for table `debt_settlements`
--
ALTER TABLE `debt_settlements`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_settlement_customer` (`customer_id`,`is_deleted`),
  ADD KEY `idx_settlement_paid_at` (`paid_at`);

--
-- Indexes for table `inquiries`
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
-- Indexes for table `inquiry_items`
--
ALTER TABLE `inquiry_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_iitem_product` (`product_id`),
  ADD KEY `idx_iitem_inquiry` (`inquiry_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_msg_conv` (`conversation_id`,`sent_at`),
  ADD KEY `idx_msg_order` (`order_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notif_unread` (`is_deleted`,`is_read`,`id`),
  ADD KEY `idx_notif_created` (`created_at`),
  ADD KEY `idx_notif_ref_order` (`ref_order_id`),
  ADD KEY `fk_notif_customer` (`ref_customer_id`),
  ADD KEY `fk_notif_staff` (`ref_staff_id`);

--
-- Indexes for table `orders`
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
-- Indexes for table `order_attachments`
--
ALTER TABLE `order_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_att_order` (`order_id`),
  ADD KEY `idx_order_att_stage` (`order_id`,`stage`);

--
-- Indexes for table `order_charges`
--
ALTER TABLE `order_charges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_charge_order` (`order_id`,`is_deleted`),
  ADD KEY `idx_charge_line` (`line_id`);

--
-- Indexes for table `order_checklist`
--
ALTER TABLE `order_checklist`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_checklist_order` (`order_id`);

--
-- Indexes for table `order_field_values`
--
ALTER TABLE `order_field_values`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ofv_field` (`template_field_id`),
  ADD KEY `idx_ofv_order` (`order_id`,`is_deleted`),
  ADD KEY `idx_ofv_line` (`line_id`),
  ADD KEY `idx_ofv_item` (`item_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_oi_order` (`order_id`),
  ADD KEY `idx_oi_product` (`product_id`),
  ADD KEY `idx_oi_line` (`line_id`);

--
-- Indexes for table `order_lines`
--
ALTER TABLE `order_lines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_oline_order` (`order_id`,`is_deleted`),
  ADD KEY `idx_oline_template` (`template_id`);

--
-- Indexes for table `order_payments`
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
-- Indexes for table `order_staff_commissions`
--
ALTER TABLE `order_staff_commissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_osc_order` (`order_id`),
  ADD KEY `idx_osc_staff` (`staff_id`),
  ADD KEY `idx_osc_carried` (`carried_at`),
  ADD KEY `idx_osc_payslip` (`payslip_id`);

--
-- Indexes for table `order_step_photos`
--
ALTER TABLE `order_step_photos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ostepphoto_order` (`order_id`,`step_code`,`is_deleted`);

--
-- Indexes for table `order_templates`
--
ALTER TABLE `order_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_template_public` (`is_public`,`is_deleted`),
  ADD KEY `idx_template_deleted` (`is_deleted`);

--
-- Indexes for table `order_template_fields`
--
ALTER TABLE `order_template_fields`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_otfield_template` (`template_id`,`seq`);

--
-- Indexes for table `order_warranty_items`
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
-- Indexes for table `order_warranty_meta`
--
ALTER TABLE `order_warranty_meta`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `fk_owm_supplier` (`default_supplier_id`);

--
-- Indexes for table `order_warranty_moves`
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
-- Indexes for table `order_workflow_steps`
--
ALTER TABLE `order_workflow_steps`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_wfstep_seq` (`seq`,`is_deleted`);

--
-- Indexes for table `payment_receipts`
--
ALTER TABLE `payment_receipts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_receipt_request` (`request_id`,`is_deleted`);

--
-- Indexes for table `payment_requests`
--
ALTER TABLE `payment_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_pr_customer` (`customer_id`,`is_deleted`),
  ADD KEY `idx_pr_status` (`status`);

--
-- Indexes for table `payment_request_items`
--
ALTER TABLE `payment_request_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_pri_request` (`request_id`);

--
-- Indexes for table `price_tiers`
--
ALTER TABLE `price_tiers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_tier_code` (`code`),
  ADD UNIQUE KEY `uniq_default_tier` (`default_marker`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_products_category` (`category_id`),
  ADD KEY `idx_products_deleted` (`is_deleted`);

--
-- Indexes for table `product_attributes`
--
ALTER TABLE `product_attributes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_attrs_product` (`product_id`);

--
-- Indexes for table `product_blocks`
--
ALTER TABLE `product_blocks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_block_product` (`product_id`),
  ADD KEY `idx_block_sort` (`product_id`,`sort_order`);

--
-- Indexes for table `product_prices`
--
ALTER TABLE `product_prices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_product_tier` (`product_id`,`tier_id`),
  ADD KEY `idx_prices_product` (`product_id`),
  ADD KEY `fk_prices_tier` (`tier_id`);

--
-- Indexes for table `product_stock`
--
ALTER TABLE `product_stock`
  ADD PRIMARY KEY (`product_id`);

--
-- Indexes for table `release_pool`
--
ALTER TABLE `release_pool`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_release_pool_order_product` (`order_id`,`product_id`),
  ADD KEY `fk_release_pool_receipt` (`receipt_id`),
  ADD KEY `idx_release_pool_staff` (`staff_id`),
  ADD KEY `idx_release_pool_product` (`product_id`),
  ADD KEY `idx_release_pool_order` (`order_id`);

--
-- Indexes for table `remittances`
--
ALTER TABLE `remittances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_remit_approver` (`approved_by`),
  ADD KEY `idx_remit_staff` (`staff_id`),
  ADD KEY `idx_remit_status` (`status`),
  ADD KEY `idx_remit_deleted` (`is_deleted`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_staff_role` (`role`),
  ADD KEY `idx_staff_area` (`area`);

--
-- Indexes for table `staff_advances`
--
ALTER TABLE `staff_advances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_sa_created_by` (`created_by`),
  ADD KEY `idx_sa_staff_period` (`staff_id`,`period`),
  ADD KEY `idx_sa_carried` (`carried_at`),
  ADD KEY `idx_sa_status` (`status`),
  ADD KEY `fk_sa_approved_by` (`approved_by`);

--
-- Indexes for table `staff_holdings`
--
ALTER TABLE `staff_holdings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_staff_holdings_staff_product` (`staff_id`,`product_id`),
  ADD KEY `idx_staff_holdings_staff` (`staff_id`),
  ADD KEY `idx_staff_holdings_product` (`product_id`);

--
-- Indexes for table `staff_payroll_adjustments`
--
ALTER TABLE `staff_payroll_adjustments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_staff` (`staff_id`,`is_deleted`);

--
-- Indexes for table `staff_payroll_periods`
--
ALTER TABLE `staff_payroll_periods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_spp_finalizer` (`finalized_by`),
  ADD KEY `idx_spp_staff_period` (`staff_id`,`period`),
  ADD KEY `idx_spp_period` (`period`),
  ADD KEY `idx_spp_staff_dates` (`staff_id`,`from_date`,`to_date`,`is_deleted`);

--
-- Indexes for table `staff_payslips`
--
ALTER TABLE `staff_payslips`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_staff` (`staff_id`),
  ADD KEY `idx_dates` (`staff_id`,`to_date`);

--
-- Indexes for table `staff_receipts`
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
-- Indexes for table `staff_reviews`
--
ALTER TABLE `staff_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_review_staff` (`staff_id`),
  ADD KEY `idx_review_order` (`order_id`);

--
-- Indexes for table `staff_salary_advances`
--
ALTER TABLE `staff_salary_advances`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_adv_staff` (`staff_id`),
  ADD KEY `idx_adv_slip` (`payslip_id`),
  ADD KEY `idx_adv_remittance` (`remittance_id`),
  ADD KEY `idx_ssa_deduct` (`deduct_from_collection`);

--
-- Indexes for table `staff_stock_consumptions`
--
ALTER TABLE `staff_stock_consumptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ssc_staff` (`staff_id`),
  ADD KEY `idx_ssc_product` (`product_id`),
  ADD KEY `idx_ssc_ref` (`ref_kind`,`ref_id`),
  ADD KEY `idx_ssc_time` (`consumed_at`);

--
-- Indexes for table `staff_stock_issues`
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
-- Indexes for table `staff_stock_issue_items`
--
ALTER TABLE `staff_stock_issue_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_ssi_item_issue_product` (`issue_id`,`product_id`),
  ADD KEY `idx_ssi_item_issue` (`issue_id`),
  ADD KEY `idx_ssi_item_product` (`product_id`);

--
-- Indexes for table `stock_items`
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
-- Indexes for table `stock_receipts`
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
-- Indexes for table `stock_receipt_items`
--
ALTER TABLE `stock_receipt_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_receipt_items_receipt` (`receipt_id`),
  ADD KEY `idx_receipt_items_product` (`product_id`);

--
-- Indexes for table `stock_return_requests`
--
ALTER TABLE `stock_return_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_srr_staff` (`staff_id`),
  ADD KEY `idx_srr_status` (`status`);

--
-- Indexes for table `stock_takes`
--
ALTER TABLE `stock_takes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `fk_stock_takes_finished_by` (`finished_by_staff_id`),
  ADD KEY `idx_stock_takes_status_started` (`status`,`started_at`),
  ADD KEY `idx_stock_takes_by_staff` (`by_staff_id`);

--
-- Indexes for table `stock_take_lines`
--
ALTER TABLE `stock_take_lines`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_stock_take_lines_take_product` (`stock_take_id`,`product_id`),
  ADD KEY `fk_stock_take_lines_receipt` (`receipt_id`),
  ADD KEY `idx_stock_take_lines_take` (`stock_take_id`),
  ADD KEY `idx_stock_take_lines_product` (`product_id`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_suppliers_deleted` (`is_deleted`),
  ADD KEY `idx_suppliers_name` (`name`);

--
-- Indexes for table `supplier_warranty_batches`
--
ALTER TABLE `supplier_warranty_batches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_supplier_warranty_batches_code` (`code`),
  ADD KEY `fk_swb_supplier` (`supplier_id`),
  ADD KEY `fk_swb_creator` (`created_by_staff_id`);

--
-- Indexes for table `supplier_warranty_batch_items`
--
ALTER TABLE `supplier_warranty_batch_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_supplier_warranty_batch_item` (`batch_id`,`warranty_item_id`),
  ADD KEY `fk_swbi_product` (`product_id`),
  ADD KEY `idx_swbi_item` (`warranty_item_id`),
  ADD KEY `idx_swbi_order` (`order_id`);

--
-- Indexes for table `warehouse_logs`
--
ALTER TABLE `warehouse_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_log_staff` (`staff_id`),
  ADD KEY `idx_log_stock` (`stock_item_id`),
  ADD KEY `idx_log_kind` (`kind`),
  ADD KEY `idx_log_order` (`order_id`),
  ADD KEY `idx_log_created` (`created_at`);

--
-- Indexes for table `warranty_orders`
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
-- Indexes for table `warranty_order_charges`
--
ALTER TABLE `warranty_order_charges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_woc_order` (`warranty_order_id`,`is_deleted`);

--
-- Indexes for table `warranty_order_items`
--
ALTER TABLE `warranty_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_woi_product` (`product_id`),
  ADD KEY `fk_woi_receipt` (`release_receipt_id`),
  ADD KEY `idx_woi_order` (`warranty_order_id`,`is_deleted`),
  ADD KEY `idx_woi_kind` (`warranty_order_id`,`kind`,`is_deleted`);

--
-- Indexes for table `warranty_order_photos`
--
ALTER TABLE `warranty_order_photos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_wop_order` (`warranty_order_id`,`is_deleted`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `agency_collections`
--
ALTER TABLE `agency_collections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `badge_order_attachments`
--
ALTER TABLE `badge_order_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `badge_order_charges`
--
ALTER TABLE `badge_order_charges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `collections`
--
ALTER TABLE `collections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `conversation_members`
--
ALTER TABLE `conversation_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=196;

--
-- AUTO_INCREMENT for table `customer_accounts`
--
ALTER TABLE `customer_accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `customer_old_debts`
--
ALTER TABLE `customer_old_debts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `customer_product_prices`
--
ALTER TABLE `customer_product_prices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `customer_sims`
--
ALTER TABLE `customer_sims`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `customer_update_requests`
--
ALTER TABLE `customer_update_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=70;

--
-- AUTO_INCREMENT for table `customer_vehicles`
--
ALTER TABLE `customer_vehicles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `debt_settlements`
--
ALTER TABLE `debt_settlements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inquiries`
--
ALTER TABLE `inquiries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inquiry_items`
--
ALTER TABLE `inquiry_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=169;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=358;

--
-- AUTO_INCREMENT for table `order_attachments`
--
ALTER TABLE `order_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_charges`
--
ALTER TABLE `order_charges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=121;

--
-- AUTO_INCREMENT for table `order_checklist`
--
ALTER TABLE `order_checklist`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_field_values`
--
ALTER TABLE `order_field_values`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=874;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=754;

--
-- AUTO_INCREMENT for table `order_lines`
--
ALTER TABLE `order_lines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=443;

--
-- AUTO_INCREMENT for table `order_payments`
--
ALTER TABLE `order_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=199;

--
-- AUTO_INCREMENT for table `order_staff_commissions`
--
ALTER TABLE `order_staff_commissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `order_step_photos`
--
ALTER TABLE `order_step_photos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=168;

--
-- AUTO_INCREMENT for table `order_templates`
--
ALTER TABLE `order_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `order_template_fields`
--
ALTER TABLE `order_template_fields`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_warranty_items`
--
ALTER TABLE `order_warranty_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `order_warranty_moves`
--
ALTER TABLE `order_warranty_moves`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=104;

--
-- AUTO_INCREMENT for table `order_workflow_steps`
--
ALTER TABLE `order_workflow_steps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_receipts`
--
ALTER TABLE `payment_receipts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `payment_requests`
--
ALTER TABLE `payment_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `payment_request_items`
--
ALTER TABLE `payment_request_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=59;

--
-- AUTO_INCREMENT for table `price_tiers`
--
ALTER TABLE `price_tiers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `product_attributes`
--
ALTER TABLE `product_attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `product_blocks`
--
ALTER TABLE `product_blocks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `product_prices`
--
ALTER TABLE `product_prices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=169;

--
-- AUTO_INCREMENT for table `release_pool`
--
ALTER TABLE `release_pool`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `remittances`
--
ALTER TABLE `remittances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `staff_advances`
--
ALTER TABLE `staff_advances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `staff_holdings`
--
ALTER TABLE `staff_holdings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=79;

--
-- AUTO_INCREMENT for table `staff_payroll_adjustments`
--
ALTER TABLE `staff_payroll_adjustments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `staff_payroll_periods`
--
ALTER TABLE `staff_payroll_periods`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `staff_payslips`
--
ALTER TABLE `staff_payslips`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `staff_receipts`
--
ALTER TABLE `staff_receipts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=165;

--
-- AUTO_INCREMENT for table `staff_reviews`
--
ALTER TABLE `staff_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `staff_salary_advances`
--
ALTER TABLE `staff_salary_advances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `staff_stock_consumptions`
--
ALTER TABLE `staff_stock_consumptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `staff_stock_issues`
--
ALTER TABLE `staff_stock_issues`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `staff_stock_issue_items`
--
ALTER TABLE `staff_stock_issue_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

--
-- AUTO_INCREMENT for table `stock_items`
--
ALTER TABLE `stock_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_receipts`
--
ALTER TABLE `stock_receipts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=309;

--
-- AUTO_INCREMENT for table `stock_receipt_items`
--
ALTER TABLE `stock_receipt_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=447;

--
-- AUTO_INCREMENT for table `stock_return_requests`
--
ALTER TABLE `stock_return_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `stock_takes`
--
ALTER TABLE `stock_takes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `stock_take_lines`
--
ALTER TABLE `stock_take_lines`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `supplier_warranty_batches`
--
ALTER TABLE `supplier_warranty_batches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `supplier_warranty_batch_items`
--
ALTER TABLE `supplier_warranty_batch_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `warehouse_logs`
--
ALTER TABLE `warehouse_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `warranty_orders`
--
ALTER TABLE `warranty_orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `warranty_order_charges`
--
ALTER TABLE `warranty_order_charges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `warranty_order_items`
--
ALTER TABLE `warranty_order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `warranty_order_photos`
--
ALTER TABLE `warranty_order_photos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `agency_collections`
--
ALTER TABLE `agency_collections`
  ADD CONSTRAINT `fk_agcol_dealer` FOREIGN KEY (`dealer_id`) REFERENCES `customers` (`id`),
  ADD CONSTRAINT `fk_agcol_retail` FOREIGN KEY (`retail_customer_id`) REFERENCES `customers` (`id`),
  ADD CONSTRAINT `fk_agcol_settle` FOREIGN KEY (`debt_settlement_id`) REFERENCES `debt_settlements` (`id`),
  ADD CONSTRAINT `fk_agcol_staff` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`);

--
-- Constraints for table `collections`
--
ALTER TABLE `collections`
  ADD CONSTRAINT `fk_coll_warranty` FOREIGN KEY (`ref_warranty_order_id`) REFERENCES `warranty_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `order_warranty_items`
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
-- Constraints for table `order_warranty_meta`
--
ALTER TABLE `order_warranty_meta`
  ADD CONSTRAINT `fk_owm_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_owm_supplier` FOREIGN KEY (`default_supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `order_warranty_moves`
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
-- Constraints for table `staff_receipts`
--
ALTER TABLE `staff_receipts`
  ADD CONSTRAINT `fk_sr_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  ADD CONSTRAINT `fk_sr_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`),
  ADD CONSTRAINT `fk_sr_request` FOREIGN KEY (`request_id`) REFERENCES `payment_requests` (`id`);

--
-- Constraints for table `stock_receipts`
--
ALTER TABLE `stock_receipts`
  ADD CONSTRAINT `fk_receipt_warranty` FOREIGN KEY (`ref_warranty_order_id`) REFERENCES `warranty_orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `supplier_warranty_batches`
--
ALTER TABLE `supplier_warranty_batches`
  ADD CONSTRAINT `fk_swb_creator` FOREIGN KEY (`created_by_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_swb_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `supplier_warranty_batch_items`
--
ALTER TABLE `supplier_warranty_batch_items`
  ADD CONSTRAINT `fk_swbi_batch` FOREIGN KEY (`batch_id`) REFERENCES `supplier_warranty_batches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_swbi_item` FOREIGN KEY (`warranty_item_id`) REFERENCES `order_warranty_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_swbi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_swbi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `warranty_orders`
--
ALTER TABLE `warranty_orders`
  ADD CONSTRAINT `fk_wo_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_wo_staff` FOREIGN KEY (`assigned_staff_id`) REFERENCES `staff` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `warranty_order_charges`
--
ALTER TABLE `warranty_order_charges`
  ADD CONSTRAINT `fk_woc_order` FOREIGN KEY (`warranty_order_id`) REFERENCES `warranty_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `warranty_order_items`
--
ALTER TABLE `warranty_order_items`
  ADD CONSTRAINT `fk_woi_order` FOREIGN KEY (`warranty_order_id`) REFERENCES `warranty_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_woi_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_woi_receipt` FOREIGN KEY (`release_receipt_id`) REFERENCES `stock_receipts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `warranty_order_photos`
--
ALTER TABLE `warranty_order_photos`
  ADD CONSTRAINT `fk_wop_order` FOREIGN KEY (`warranty_order_id`) REFERENCES `warranty_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
