-- Import selected orders from old DB into new DB.
-- Scope:
--   ORD-0706-001
--   ORD-0806-001
--   ORD-0806-002
--   ORD-0806-003
--   ORD-0906-002
--
-- Rule:
--   Every imported order code gets suffix -OLD.
--   Related staff receipt codes also get suffix -OLD.
--   Existing ids in target DB remain auto-increment.
--
-- Target DB: gpsviet
-- Run directly with mysql client or cmd redirection.
-- Avoid piping this file through PowerShell because Unicode text can be mangled.
-- Example:
--   cmd /c ""C:\xampp\mysql\bin\mysql.exe" --default-character-set=utf8mb4 -u root gpsviet < "C:\Users\WINDOWS\Desktop\CTYGPS\backup\import_selected_old_orders_with_old_suffix.sql""

START TRANSACTION;

SET @now_ts = NOW();

-- ---------------------------------------------------------------------------
-- 1) Ensure conflicted old customers exist in target with distinct codes
-- ---------------------------------------------------------------------------
INSERT INTO `customers`
(`code`, `type`, `full_name`, `phone`, `email`, `address`, `avatar_url`, `note`,
 `company_name`, `tax_code`, `contact_person`, `debt_limit`, `credit_term_days`,
 `opening_balance`, `discount_rate`, `default_tier_id`, `password_hash`, `is_deleted`,
 `seen_at`, `created_at`, `updated_at`, `parent_id`)
SELECT
  'KH0066-OLD', 'retail', 'Thanh', '0903691345', NULL, NULL, NULL, NULL,
  'CÔNG TY TNHH GIAO NHẬN VẬN TẢI CHÍ THẮNG', '0319290913', NULL, 0, 0,
  0, 0.00, 1, NULL, 0, NULL, '2026-06-08 01:05:22', '2026-06-08 01:05:22', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `customers` WHERE `code` = 'KH0066-OLD'
);

INSERT INTO `customers`
(`code`, `type`, `full_name`, `phone`, `email`, `address`, `avatar_url`, `note`,
 `company_name`, `tax_code`, `contact_person`, `debt_limit`, `credit_term_days`,
 `opening_balance`, `discount_rate`, `default_tier_id`, `password_hash`, `is_deleted`,
 `seen_at`, `created_at`, `updated_at`, `parent_id`)
SELECT
  'KH0067-OLD', 'retail', 'nguyenhaiau', NULL, NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, 0, 0,
  0, 0.00, NULL, NULL, 0, NULL, '2026-06-08 01:22:46', '2026-06-08 01:22:46', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `customers` WHERE `code` = 'KH0067-OLD'
);

INSERT INTO `customers`
(`code`, `type`, `full_name`, `phone`, `email`, `address`, `avatar_url`, `note`,
 `company_name`, `tax_code`, `contact_person`, `debt_limit`, `credit_term_days`,
 `opening_balance`, `discount_rate`, `default_tier_id`, `password_hash`, `is_deleted`,
 `seen_at`, `created_at`, `updated_at`, `parent_id`)
SELECT
  'KH0070-OLD', 'retail', 'Vận Tải Hoàng Phúc', NULL, NULL, NULL, NULL, NULL,
  NULL, NULL, NULL, 0, 0,
  0, 0.00, NULL, NULL, 0, NULL, '2026-06-09 04:45:28', '2026-06-09 04:45:28', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `customers` WHERE `code` = 'KH0070-OLD'
);

SET @cust_dl0004 = (SELECT `id` FROM `customers` WHERE `code` = 'DL0004' LIMIT 1);
SET @cust_kh0066_old = (SELECT `id` FROM `customers` WHERE `code` = 'KH0066-OLD' LIMIT 1);
SET @cust_kh0067_old = (SELECT `id` FROM `customers` WHERE `code` = 'KH0067-OLD' LIMIT 1);
SET @cust_kh0070_old = (SELECT `id` FROM `customers` WHERE `code` = 'KH0070-OLD' LIMIT 1);

-- ---------------------------------------------------------------------------
-- 2) Insert orders
-- ---------------------------------------------------------------------------
INSERT INTO `orders`
(`code`, `customer_id`, `dealer_id`, `total_amount`, `subtotal`, `paid_amount`,
 `debt_carried_at`, `debt_settlement_id`, `payment_method`, `status`, `progress_note`,
 `payment_status`, `collected_for_dealer`, `has_return`, `seen_at`, `address`,
 `assigned_staff_id`, `due_at`, `started_at`, `completed_at`, `wage_amount`,
 `tech_commission_amount`, `tech_commission_approved_at`, `tech_commission_approved_by`,
 `tech_commission_note`, `ktv_note`, `note`, `creator_type`, `creator_id`,
 `confirmed_at`, `confirmed_by`, `is_deleted`, `created_at`, `end_customer_id`,
 `tech_commission_requested_by`, `tech_commission_requested_at`, `payslip_id`, `service_kind`)
SELECT
  'ORD-0706-001-OLD', @cust_dl0004, NULL, 810000, 810000, 0,
  NULL, NULL, 'debt', 'confirmed', '[07/06/2026 16:52 - nv224895] Tạo đơn\n',
  'unpaid', 0, 0, NULL, NULL,
  2, NULL, NULL, NULL, 100000,
  0, NULL, NULL,
  NULL, NULL, NULL, 'admin', 3,
  NULL, NULL, 0, '2026-06-07 09:52:13', NULL,
  NULL, NULL, NULL, 'install'
WHERE NOT EXISTS (
  SELECT 1 FROM `orders` WHERE `code` = 'ORD-0706-001-OLD'
);

INSERT INTO `orders`
(`code`, `customer_id`, `dealer_id`, `total_amount`, `subtotal`, `paid_amount`,
 `debt_carried_at`, `debt_settlement_id`, `payment_method`, `status`, `progress_note`,
 `payment_status`, `collected_for_dealer`, `has_return`, `seen_at`, `address`,
 `assigned_staff_id`, `due_at`, `started_at`, `completed_at`, `wage_amount`,
 `tech_commission_amount`, `tech_commission_approved_at`, `tech_commission_approved_by`,
 `tech_commission_note`, `ktv_note`, `note`, `creator_type`, `creator_id`,
 `confirmed_at`, `confirmed_by`, `is_deleted`, `created_at`, `end_customer_id`,
 `tech_commission_requested_by`, `tech_commission_requested_at`, `payslip_id`, `service_kind`)
SELECT
  'ORD-0806-001-OLD', @cust_kh0066_old, NULL, 972000, 972000, 0,
  NULL, NULL, 'debt', 'confirmed', '[08/06/2026 08:07 - admin] Tạo đơn\n',
  'unpaid', 0, 0, NULL, NULL,
  8, NULL, NULL, NULL, 100000,
  0, NULL, NULL,
  NULL, NULL, NULL, 'admin', 1,
  NULL, NULL, 0, '2026-06-08 01:07:21', NULL,
  NULL, NULL, NULL, 'install'
WHERE NOT EXISTS (
  SELECT 1 FROM `orders` WHERE `code` = 'ORD-0806-001-OLD'
);

INSERT INTO `orders`
(`code`, `customer_id`, `dealer_id`, `total_amount`, `subtotal`, `paid_amount`,
 `debt_carried_at`, `debt_settlement_id`, `payment_method`, `status`, `progress_note`,
 `payment_status`, `collected_for_dealer`, `has_return`, `seen_at`, `address`,
 `assigned_staff_id`, `due_at`, `started_at`, `completed_at`, `wage_amount`,
 `tech_commission_amount`, `tech_commission_approved_at`, `tech_commission_approved_by`,
 `tech_commission_note`, `ktv_note`, `note`, `creator_type`, `creator_id`,
 `confirmed_at`, `confirmed_by`, `is_deleted`, `created_at`, `end_customer_id`,
 `tech_commission_requested_by`, `tech_commission_requested_at`, `payslip_id`, `service_kind`)
SELECT
  'ORD-0806-002-OLD', @cust_kh0067_old, NULL, 1500000, 1500000, 1500000,
  NULL, NULL, 'debt', 'done',
  '[08/06/2026 08:23 - nv224895] Tạo đơn\n[08/06/2026 09:23 - nv224895] Cập nhật nội dung dòng công việc\n[08/06/2026 09:24 - nv224895] NV nhận 1.500.000đ (Chuyển khoản) — NNT-0806-001-OLD\n[08/06/2026 14:04 - nv224895] Chuyển trạng thái → done\n',
  'paid', 0, 0, NULL, NULL,
  NULL, NULL, NULL, '2026-06-08 14:04:42', 0,
  0, NULL, NULL,
  NULL, NULL, NULL, 'admin', 3,
  NULL, NULL, 0, '2026-06-08 01:23:05', NULL,
  NULL, NULL, NULL, 'install'
WHERE NOT EXISTS (
  SELECT 1 FROM `orders` WHERE `code` = 'ORD-0806-002-OLD'
);

INSERT INTO `orders`
(`code`, `customer_id`, `dealer_id`, `total_amount`, `subtotal`, `paid_amount`,
 `debt_carried_at`, `debt_settlement_id`, `payment_method`, `status`, `progress_note`,
 `payment_status`, `collected_for_dealer`, `has_return`, `seen_at`, `address`,
 `assigned_staff_id`, `due_at`, `started_at`, `completed_at`, `wage_amount`,
 `tech_commission_amount`, `tech_commission_approved_at`, `tech_commission_approved_by`,
 `tech_commission_note`, `ktv_note`, `note`, `creator_type`, `creator_id`,
 `confirmed_at`, `confirmed_by`, `is_deleted`, `created_at`, `end_customer_id`,
 `tech_commission_requested_by`, `tech_commission_requested_at`, `payslip_id`, `service_kind`)
SELECT
  'ORD-0806-003-OLD', @cust_dl0004, NULL, 810000, 810000, 0,
  NULL, NULL, 'debt', 'confirmed', '[08/06/2026 09:05 - nv224895] Tạo đơn\n',
  'unpaid', 0, 0, NULL, NULL,
  8, NULL, NULL, NULL, 100000,
  0, NULL, NULL,
  NULL, NULL, NULL, 'admin', 3,
  NULL, NULL, 0, '2026-06-08 02:05:22', NULL,
  NULL, NULL, NULL, 'install'
WHERE NOT EXISTS (
  SELECT 1 FROM `orders` WHERE `code` = 'ORD-0806-003-OLD'
);

INSERT INTO `orders`
(`code`, `customer_id`, `dealer_id`, `total_amount`, `subtotal`, `paid_amount`,
 `debt_carried_at`, `debt_settlement_id`, `payment_method`, `status`, `progress_note`,
 `payment_status`, `collected_for_dealer`, `has_return`, `seen_at`, `address`,
 `assigned_staff_id`, `due_at`, `started_at`, `completed_at`, `wage_amount`,
 `tech_commission_amount`, `tech_commission_approved_at`, `tech_commission_approved_by`,
 `tech_commission_note`, `ktv_note`, `note`, `creator_type`, `creator_id`,
 `confirmed_at`, `confirmed_by`, `is_deleted`, `created_at`, `end_customer_id`,
 `tech_commission_requested_by`, `tech_commission_requested_at`, `payslip_id`, `service_kind`)
SELECT
  'ORD-0906-002-OLD', @cust_kh0070_old, NULL, 750000, 750000, 750000,
  NULL, NULL, 'debt', 'done',
  '[09/06/2026 11:46 - nv224895] Tạo đơn\n[09/06/2026 11:46 - nv224895] NV nhận 750.000đ (Chuyển khoản) — NNT-0906-002-OLD\n[09/06/2026 11:46 - nv224895] Chuyển trạng thái → done\n',
  'paid', 0, 0, NULL, NULL,
  NULL, NULL, NULL, '2026-06-09 11:46:43', 0,
  0, NULL, NULL,
  NULL, NULL, NULL, 'admin', 3,
  NULL, NULL, 0, '2026-06-09 04:46:17', NULL,
  NULL, NULL, NULL, 'install'
WHERE NOT EXISTS (
  SELECT 1 FROM `orders` WHERE `code` = 'ORD-0906-002-OLD'
);

SET @ord_0706 = (SELECT `id` FROM `orders` WHERE `code` = 'ORD-0706-001-OLD' LIMIT 1);
SET @ord_0806_001 = (SELECT `id` FROM `orders` WHERE `code` = 'ORD-0806-001-OLD' LIMIT 1);
SET @ord_0806_002 = (SELECT `id` FROM `orders` WHERE `code` = 'ORD-0806-002-OLD' LIMIT 1);
SET @ord_0806_003 = (SELECT `id` FROM `orders` WHERE `code` = 'ORD-0806-003-OLD' LIMIT 1);
SET @ord_0906_002 = (SELECT `id` FROM `orders` WHERE `code` = 'ORD-0906-002-OLD' LIMIT 1);

-- ---------------------------------------------------------------------------
-- 3) Insert order_lines
-- ---------------------------------------------------------------------------
INSERT INTO `order_lines` (`order_id`, `template_id`, `custom_name`, `seq`, `subtotal`, `note`, `is_deleted`)
SELECT @ord_0706, 1, NULL, 1, 810000, NULL, 0
WHERE NOT EXISTS (SELECT 1 FROM `order_lines` WHERE `order_id` = @ord_0706 AND `seq` = 1 AND `subtotal` = 810000);

INSERT INTO `order_lines` (`order_id`, `template_id`, `custom_name`, `seq`, `subtotal`, `note`, `is_deleted`)
SELECT @ord_0806_001, 1, NULL, 1, 972000, NULL, 0
WHERE NOT EXISTS (SELECT 1 FROM `order_lines` WHERE `order_id` = @ord_0806_001 AND `seq` = 1 AND `subtotal` = 972000);

INSERT INTO `order_lines` (`order_id`, `template_id`, `custom_name`, `seq`, `subtotal`, `note`, `is_deleted`)
SELECT @ord_0806_002, 2, NULL, 1, 1500000, NULL, 0
WHERE NOT EXISTS (SELECT 1 FROM `order_lines` WHERE `order_id` = @ord_0806_002 AND `seq` = 1 AND `subtotal` = 1500000);

INSERT INTO `order_lines` (`order_id`, `template_id`, `custom_name`, `seq`, `subtotal`, `note`, `is_deleted`)
SELECT @ord_0806_003, 1, NULL, 1, 810000, NULL, 0
WHERE NOT EXISTS (SELECT 1 FROM `order_lines` WHERE `order_id` = @ord_0806_003 AND `seq` = 1 AND `subtotal` = 810000);

INSERT INTO `order_lines` (`order_id`, `template_id`, `custom_name`, `seq`, `subtotal`, `note`, `is_deleted`)
SELECT @ord_0906_002, 2, NULL, 1, 750000, NULL, 0
WHERE NOT EXISTS (SELECT 1 FROM `order_lines` WHERE `order_id` = @ord_0906_002 AND `seq` = 1 AND `subtotal` = 750000);

SET @line_0706 = (SELECT `id` FROM `order_lines` WHERE `order_id` = @ord_0706 ORDER BY `id` ASC LIMIT 1);
SET @line_0806_001 = (SELECT `id` FROM `order_lines` WHERE `order_id` = @ord_0806_001 ORDER BY `id` ASC LIMIT 1);
SET @line_0806_002 = (SELECT `id` FROM `order_lines` WHERE `order_id` = @ord_0806_002 ORDER BY `id` ASC LIMIT 1);
SET @line_0806_003 = (SELECT `id` FROM `order_lines` WHERE `order_id` = @ord_0806_003 ORDER BY `id` ASC LIMIT 1);
SET @line_0906_002 = (SELECT `id` FROM `order_lines` WHERE `order_id` = @ord_0906_002 ORDER BY `id` ASC LIMIT 1);

-- ---------------------------------------------------------------------------
-- 4) Insert order_items
-- ---------------------------------------------------------------------------
INSERT INTO `order_items`
(`order_id`, `line_id`, `product_id`, `qty`, `unit_price`, `vat_percent`, `vehicle_plate`, `imei`, `subscription_account`, `years`, `phone`)
SELECT @ord_0706, @line_0706, 2, 1, 810000, 0.00, NULL, NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM `order_items` WHERE `order_id` = @ord_0706 AND `line_id` = @line_0706 AND `product_id` = 2 AND `qty` = 1 AND `unit_price` = 810000);

INSERT INTO `order_items`
(`order_id`, `line_id`, `product_id`, `qty`, `unit_price`, `vat_percent`, `vehicle_plate`, `imei`, `subscription_account`, `years`, `phone`)
SELECT @ord_0806_001, @line_0806_001, 2, 1, 972000, 0.00, NULL, NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM `order_items` WHERE `order_id` = @ord_0806_001 AND `line_id` = @line_0806_001 AND `product_id` = 2 AND `qty` = 1 AND `unit_price` = 972000);

INSERT INTO `order_items`
(`order_id`, `line_id`, `product_id`, `qty`, `unit_price`, `vat_percent`, `vehicle_plate`, `imei`, `subscription_account`, `years`, `phone`)
SELECT @ord_0806_002, @line_0806_002, 18, 2, 750000, 0.00, NULL, NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM `order_items` WHERE `order_id` = @ord_0806_002 AND `line_id` = @line_0806_002 AND `product_id` = 18 AND `qty` = 2 AND `unit_price` = 750000);

INSERT INTO `order_items`
(`order_id`, `line_id`, `product_id`, `qty`, `unit_price`, `vat_percent`, `vehicle_plate`, `imei`, `subscription_account`, `years`, `phone`)
SELECT @ord_0806_003, @line_0806_003, 2, 1, 810000, 0.00, NULL, NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM `order_items` WHERE `order_id` = @ord_0806_003 AND `line_id` = @line_0806_003 AND `product_id` = 2 AND `qty` = 1 AND `unit_price` = 810000);

INSERT INTO `order_items`
(`order_id`, `line_id`, `product_id`, `qty`, `unit_price`, `vat_percent`, `vehicle_plate`, `imei`, `subscription_account`, `years`, `phone`)
SELECT @ord_0906_002, @line_0906_002, 18, 1, 750000, 0.00, NULL, NULL, NULL, NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM `order_items` WHERE `order_id` = @ord_0906_002 AND `line_id` = @line_0906_002 AND `product_id` = 18 AND `qty` = 1 AND `unit_price` = 750000);

SET @item_0806_002 = (SELECT `id` FROM `order_items` WHERE `order_id` = @ord_0806_002 AND `line_id` = @line_0806_002 AND `product_id` = 18 ORDER BY `id` ASC LIMIT 1);
SET @item_0806_003 = (SELECT `id` FROM `order_items` WHERE `order_id` = @ord_0806_003 AND `line_id` = @line_0806_003 AND `product_id` = 2 ORDER BY `id` ASC LIMIT 1);
SET @item_0906_002 = (SELECT `id` FROM `order_items` WHERE `order_id` = @ord_0906_002 AND `line_id` = @line_0906_002 AND `product_id` = 18 ORDER BY `id` ASC LIMIT 1);

-- ---------------------------------------------------------------------------
-- 5) Insert order_field_values
-- ---------------------------------------------------------------------------
INSERT INTO `order_field_values`
(`order_id`, `line_id`, `item_id`, `template_field_id`, `label`, `value`, `seq`, `is_deleted`)
SELECT @ord_0806_002, @line_0806_002, @item_0806_002, NULL, 'Biển số xe', '84F00386', 1, 0
WHERE NOT EXISTS (
  SELECT 1 FROM `order_field_values`
  WHERE `order_id` = @ord_0806_002 AND `line_id` = @line_0806_002 AND `label` = 'Biển số xe' AND `value` = '84F00386'
);

INSERT INTO `order_field_values`
(`order_id`, `line_id`, `item_id`, `template_field_id`, `label`, `value`, `seq`, `is_deleted`)
SELECT @ord_0806_003, @line_0806_003, @item_0806_003, NULL, 'Biển số xe', '51C42755', 1, 0
WHERE NOT EXISTS (
  SELECT 1 FROM `order_field_values`
  WHERE `order_id` = @ord_0806_003 AND `line_id` = @line_0806_003 AND `label` = 'Biển số xe' AND `value` = '51C42755'
);

INSERT INTO `order_field_values`
(`order_id`, `line_id`, `item_id`, `template_field_id`, `label`, `value`, `seq`, `is_deleted`)
SELECT @ord_0906_002, @line_0906_002, @item_0906_002, NULL, 'Biển số xe', '71C05959', 1, 0
WHERE NOT EXISTS (
  SELECT 1 FROM `order_field_values`
  WHERE `order_id` = @ord_0906_002 AND `line_id` = @line_0906_002 AND `label` = 'Biển số xe' AND `value` = '71C05959'
);

-- ---------------------------------------------------------------------------
-- 6) Insert order_charges
-- ---------------------------------------------------------------------------
INSERT INTO `order_charges` (`order_id`, `line_id`, `kind`, `label`, `amount`, `is_deleted`)
SELECT @ord_0706, NULL, 'fee', 'Công lắp', 100000, 0
WHERE NOT EXISTS (SELECT 1 FROM `order_charges` WHERE `order_id` = @ord_0706 AND `kind` = 'fee' AND `label` = 'Công lắp' AND `amount` = 100000);

INSERT INTO `order_charges` (`order_id`, `line_id`, `kind`, `label`, `amount`, `is_deleted`)
SELECT @ord_0806_001, NULL, 'fee', 'Công lắp', 100000, 0
WHERE NOT EXISTS (SELECT 1 FROM `order_charges` WHERE `order_id` = @ord_0806_001 AND `kind` = 'fee' AND `label` = 'Công lắp' AND `amount` = 100000);

INSERT INTO `order_charges` (`order_id`, `line_id`, `kind`, `label`, `amount`, `is_deleted`)
SELECT @ord_0806_003, NULL, 'fee', 'Công lắp', 100000, 0
WHERE NOT EXISTS (SELECT 1 FROM `order_charges` WHERE `order_id` = @ord_0806_003 AND `kind` = 'fee' AND `label` = 'Công lắp' AND `amount` = 100000);

-- ---------------------------------------------------------------------------
-- 7) Insert order_payments and staff_receipts for paid imported orders
-- ---------------------------------------------------------------------------
INSERT INTO `order_payments`
(`order_id`, `amount`, `source`, `confirmed`, `confirmed_at`, `confirmed_by`, `collection_id`, `task_id`, `staff_id`, `paid_at`, `note`, `proof_urls`, `is_deleted`)
SELECT
  @ord_0806_002, 1500000, 'staff_received', 1, '2026-06-08 09:24:23', NULL, NULL, NULL, 3,
  '2026-06-08 09:24:23', '[Chuyển khoản]', '[\"https://i.ibb.co/ymckJDrG/sr-ord-165-1780885458787.jpg\"]', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `order_payments`
  WHERE `order_id` = @ord_0806_002 AND `amount` = 1500000 AND `paid_at` = '2026-06-08 09:24:23'
);

INSERT INTO `order_payments`
(`order_id`, `amount`, `source`, `confirmed`, `confirmed_at`, `confirmed_by`, `collection_id`, `task_id`, `staff_id`, `paid_at`, `note`, `proof_urls`, `is_deleted`)
SELECT
  @ord_0906_002, 750000, 'staff_received', 1, '2026-06-09 11:46:41', NULL, NULL, NULL, 3,
  '2026-06-09 11:46:41', '[Chuyển khoản] ck 9.6', '[\"https://i.ibb.co/2Yg3py47/sr-ord-169-1780980395591.jpg\"]', 0
WHERE NOT EXISTS (
  SELECT 1 FROM `order_payments`
  WHERE `order_id` = @ord_0906_002 AND `amount` = 750000 AND `paid_at` = '2026-06-09 11:46:41'
);

INSERT INTO `staff_receipts`
(`code`, `order_id`, `request_id`, `customer_id`, `amount`, `pay_method`, `proof_urls`, `note`, `staff_id`,
 `reviewed`, `reviewed_by`, `reviewed_at`, `created_at`, `is_deleted`, `status`, `cancel_reason`, `cancelled_by`, `cancelled_at`)
SELECT
  'NNT-0806-001-OLD', @ord_0806_002, NULL, @cust_kh0067_old, 1500000, 'transfer',
  '[\"https://i.ibb.co/ymckJDrG/sr-ord-165-1780885458787.jpg\"]', NULL, 3,
  1, 1, '2026-06-09 22:45:45', '2026-06-08 09:24:23', 0, 'active', NULL, NULL, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `staff_receipts` WHERE `code` = 'NNT-0806-001-OLD'
);

INSERT INTO `staff_receipts`
(`code`, `order_id`, `request_id`, `customer_id`, `amount`, `pay_method`, `proof_urls`, `note`, `staff_id`,
 `reviewed`, `reviewed_by`, `reviewed_at`, `created_at`, `is_deleted`, `status`, `cancel_reason`, `cancelled_by`, `cancelled_at`)
SELECT
  'NNT-0906-002-OLD', @ord_0906_002, NULL, @cust_kh0070_old, 750000, 'transfer',
  '[\"https://i.ibb.co/2Yg3py47/sr-ord-169-1780980395591.jpg\"]', 'ck 9.6', 3,
  1, 1, '2026-06-09 22:42:54', '2026-06-09 11:46:41', 0, 'active', NULL, NULL, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM `staff_receipts` WHERE `code` = 'NNT-0906-002-OLD'
);

COMMIT;

-- Quick verification:
-- SELECT id, code, customer_id, total_amount, paid_amount, status, payment_status
-- FROM orders
-- WHERE code IN (
--   'ORD-0706-001-OLD',
--   'ORD-0806-001-OLD',
--   'ORD-0806-002-OLD',
--   'ORD-0806-003-OLD',
--   'ORD-0906-002-OLD'
-- );
