const WARRANTY_SERVICE_KIND = 'warranty';
const SERVICE_KINDS = ['install', 'maintenance', 'warranty', 'renewal', 'badge', 'consult'];
const WARRANTY_MODES = ['repair', 'exchange', 'supplier_swap'];
const WARRANTY_HANDLING_TYPES = ['pending', 'tech_fix', 'exchange', 'supplier_return'];
const WARRANTY_CUSTOMER_STATUSES = ['pending', 'completed'];
const WARRANTY_REPLACEMENT_SOURCES = ['technician_stock', 'company_stock', 'supplier_returned_item'];
const WARRANTY_ITEM_ROLES = ['faulty', 'replacement', 'supplier_return'];
// Mot trang thai duy nhat (stage) = current_status.
// `current_location` va `customer_status` la gia tri SUY RA tu stage,
// khong luu doc lap de tranh lech nhau (single source of truth).
const WARRANTY_ITEM_STATUSES = [
  'intake',
  'technician_holding',
  'pending_company_receipt',
  'company_warranty_stock',
  'sent_to_supplier',
  'supplier_returned',
  'delivered',
  'cancelled',
];
const WARRANTY_ITEM_LOCATIONS = [
  'customer',
  'technician',
  'company_warranty_stock',
  'supplier',
  'customer_returned',
];

// Bang suy ra location + customer_status tu stage (current_status).
// Day la nguon duy nhat dinh nghia "stage nao thi hang o dau + khach xong chua".
const WARRANTY_STAGE_DERIVED = {
  intake:                  { location: 'customer',               customer_status: 'pending'   },
  technician_holding:      { location: 'technician',             customer_status: 'pending'   },
  // KTV da khai gui hang loi ve kho nhung kho CHUA xac nhan nhan -> van tinh la KTV dang giu.
  pending_company_receipt: { location: 'technician',             customer_status: 'pending'   },
  company_warranty_stock:  { location: 'company_warranty_stock', customer_status: 'pending'   },
  sent_to_supplier:        { location: 'supplier',               customer_status: 'pending'   },
  supplier_returned:       { location: 'company_warranty_stock', customer_status: 'pending'   },
  delivered:               { location: 'customer_returned',      customer_status: 'completed' },
  cancelled:               { location: null,                     customer_status: 'pending'   },
};

// Tra ve { current_location, customer_status } suy ra tu stage.
// `prev` dung de giu lai location cu khi stage = cancelled (khong co location rieng).
function deriveStageFields(stage, prev = {}) {
  const map = WARRANTY_STAGE_DERIVED[stage];
  if (!map) {
    return {
      current_location: prev.current_location || 'customer',
      customer_status: prev.customer_status || 'pending',
    };
  }
  return {
    current_location: map.location || prev.current_location || 'customer',
    customer_status: map.customer_status,
  };
}

// ==========================================================
// Warranty_State_Service: gom 7 stage noi bo thanh 4 trang thai hien thi.
// Cac ham nay THUAN (pure) - khong doc/ghi DB, dung khi load detail va migration.
// Display_State code: 'pending' | 'processing' | 'supplier' | 'delivered'
// ==========================================================
const DISPLAY_STATE_LABELS = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  supplier: 'Đang gửi NCC',
  delivered: 'Giao KH',
};

// Nhan dien item da dat hang doi (replacement) - khop dieu kien deliver_to_customer.
function hasReplacementReserved(item) {
  if (!item) return false;
  return ['company_stock', 'technician_stock', 'supplier_returned_item'].includes(item.replacement_source_scope)
    && !!normalizeId(item.replacement_product_id)
    && !!normalizeId(item.replacement_staff_id);
}

// Item duoc coi nhu da giao khach (delivered-equivalent): stage delivered HOAC
// du lieu cu customer_status='completed' nhung stage chua kip cap nhat.
function isItemDeliveredEquivalent(item) {
  if (!item) return false;
  if (item.current_status === 'delivered') return true;
  return item.customer_status === 'completed' && item.current_status !== 'cancelled';
}

function makeDisplayState(code) {
  return { code, label: DISPLAY_STATE_LABELS[code] || DISPLAY_STATE_LABELS.processing };
}

// Display_State cua tung item (R1.8).
function deriveItemDisplayState(item) {
  if (!item || item.current_status === 'cancelled') return makeDisplayState('processing');
  if (isItemDeliveredEquivalent(item)) return makeDisplayState('delivered');
  switch (item.current_status) {
    case 'sent_to_supplier':
    case 'supplier_returned':
      return makeDisplayState('supplier');
    case 'technician_holding':
    case 'pending_company_receipt':
    case 'company_warranty_stock':
      return hasReplacementReserved(item) ? makeDisplayState('processing') : makeDisplayState('pending');
    case 'intake':
    default:
      return makeDisplayState('processing');
  }
}

// Display_State o cap don (R1.1-R1.7). Uu tien: Giao KH > Dang gui NCC > Cho xu ly > Dang xu ly.
function deriveOrderDisplayState(items) {
  const active = (Array.isArray(items) ? items : []).filter((it) => it && it.current_status !== 'cancelled');
  if (!active.length) return makeDisplayState('processing');                       // rong / tat ca huy (R1.5)
  if (active.every((it) => isItemDeliveredEquivalent(it))) return makeDisplayState('delivered'); // R1.2, R8.3
  if (active.some((it) => ['sent_to_supplier', 'supplier_returned'].includes(it.current_status))) {
    return makeDisplayState('supplier');                                            // R1.3
  }
  if (active.some((it) =>
    ['technician_holding', 'pending_company_receipt', 'company_warranty_stock'].includes(it.current_status) && !hasReplacementReserved(it)
  )) {
    return makeDisplayState('pending');                                             // R1.4
  }
  return makeDisplayState('processing');                                            // R1.5 catch-all
}

// Nhan hien thi cho tung action_code tren timeline (R2.2).
const WARRANTY_ACTION_LABELS = {
  mark_fixed: 'KTV sửa xong, trả khách',
  receive_from_customer: 'Nhận sản phẩm từ khách vào túi KTV',
  handover_to_company: 'KTV gửi hàng lỗi về kho (chờ xác nhận)',
  move_to_company_stock: 'Đưa về kho bảo hành công ty',
  send_to_supplier: 'Gửi sản phẩm cho nhà cung cấp',
  receive_from_supplier: 'Nhận sản phẩm về từ nhà cung cấp',
  reserve_replacement_from_company: 'Phân hàng đổi từ kho công ty',
  reserve_replacement_from_technician: 'Phân hàng đổi từ túi KTV',
  deliver_to_customer: 'Giao thiết bị cho khách',
  cancel_item: 'Huỷ sản phẩm bảo hành',
  note: 'Ghi chú',
};

function warrantyActionLabel(actionCode) {
  return WARRANTY_ACTION_LABELS[actionCode] || 'Cập nhật bảo hành';
}

const WARRANTY_MOVE_ACTIONS = [
  'mark_fixed',
  'receive_from_customer',
  'handover_to_company',
  'move_to_company_stock',
  'send_to_supplier',
  'receive_from_supplier',
  'reserve_replacement_from_company',
  'reserve_replacement_from_technician',
  'deliver_to_customer',
  'cancel_item',
  'note',
];

let schemaReadyPromise = null;

function httpErr(status, message, details) {
  const err = new Error(message);
  err.status = status;
  if (details) err.details = details;
  return err;
}

function sanitizeText(input, { max, label, allowEmpty = false } = {}) {
  if (input == null) return null;
  const value = String(input);
  if (!allowEmpty && !value.trim()) return null;
  if (max && value.length > max) throw httpErr(400, `${label} quá dài (tối đa ${max})`);
  if (/[<>]/.test(value)) throw httpErr(400, `${label} chứa ký tự không hợp lệ`);
  return value.trim() || (allowEmpty ? '' : null);
}

function normalizeId(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalizeQty(value, label = 'So luong') {
  const qty = Number(value);
  if (!Number.isFinite(qty) || qty <= 0 || Math.floor(qty) !== qty) {
    throw httpErr(400, `${label} phải là số nguyên > 0`);
  }
  return qty;
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function normalizeServiceKind(raw) {
  return SERVICE_KINDS.includes(raw) ? raw : 'install';
}

function normalizeWarrantyMode(raw) {
  return WARRANTY_MODES.includes(raw) ? raw : 'repair';
}

function normalizeHandlingType(raw) {
  return WARRANTY_HANDLING_TYPES.includes(raw) ? raw : 'pending';
}

function normalizeCustomerStatus(raw) {
  return WARRANTY_CUSTOMER_STATUSES.includes(raw) ? raw : 'pending';
}

function normalizeReplacementSource(raw) {
  return WARRANTY_REPLACEMENT_SOURCES.includes(raw) ? raw : null;
}

function normalizeMoney(raw, label = 'So tien') {
  if (raw == null || raw === '') return 0;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw httpErr(400, `${label} không hợp lệ`);
  return Math.round(value);
}

function normalizeWarrantyPhotoUrls(raw) {
  if (!Array.isArray(raw)) return null;
  const urls = raw
    .map((url) => String(url || '').trim())
    .filter((url) => /^https?:\/\//i.test(url));
  return urls.length ? JSON.stringify(urls) : null;
}

function normalizeOccurredAt(raw) {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) throw httpErr(400, 'Thời điểm không hợp lệ');
  return value.length <= 10 ? `${value} 00:00:00` : value.slice(0, 19).replace('T', ' ');
}

function parseJsonList(raw) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (_) {
    return [];
  }
}

async function ensureColumn(dbOrConn, tableName, columnName, ddl) {
  const [rows] = await dbOrConn.query(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [columnName]);
  if (!rows.length) {
    await dbOrConn.query(`ALTER TABLE ${tableName} ADD COLUMN ${ddl}`);
  }
}

async function ensureWarrantySchema(dbOrConn) {
  if (schemaReadyPromise) return schemaReadyPromise;
  schemaReadyPromise = (async () => {
    const [serviceKindCols] = await dbOrConn.query(`SHOW COLUMNS FROM orders LIKE 'service_kind'`);
    if (!serviceKindCols.length) {
      await dbOrConn.query(`
        ALTER TABLE orders
          ADD COLUMN service_kind ENUM('install','maintenance','warranty','renewal','badge','consult')
            NOT NULL DEFAULT 'install' AFTER status
      `);
      await dbOrConn.query(`ALTER TABLE orders ADD INDEX idx_orders_service_kind (service_kind)`);
    } else {
      const colType = String(serviceKindCols[0].Type || '');
      const requiredKinds = ['install', 'maintenance', 'warranty', 'renewal', 'badge', 'consult'];
      const missingKinds = requiredKinds.filter((kind) => !colType.includes(`'${kind}'`));
      if (missingKinds.length) {
        await dbOrConn.query(`
          ALTER TABLE orders
            MODIFY COLUMN service_kind ENUM('install','maintenance','warranty','renewal','badge','consult')
              NOT NULL DEFAULT 'install'
        `);
      }
      const [serviceKindIndexes] = await dbOrConn.query(`SHOW INDEX FROM orders WHERE Key_name = 'idx_orders_service_kind'`);
      if (!serviceKindIndexes.length) {
        await dbOrConn.query(`ALTER TABLE orders ADD INDEX idx_orders_service_kind (service_kind)`);
      }
    }

    await dbOrConn.query(`
      CREATE TABLE IF NOT EXISTS order_warranty_meta (
        order_id INT NOT NULL,
        warranty_mode ENUM('repair','exchange','supplier_swap') NOT NULL DEFAULT 'repair',
        default_supplier_id INT NULL,
        current_stage VARCHAR(50) NOT NULL DEFAULT 'intake',
        note_text TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (order_id),
        CONSTRAINT fk_owm_order
          FOREIGN KEY (order_id) REFERENCES orders(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_owm_supplier
          FOREIGN KEY (default_supplier_id) REFERENCES suppliers(id)
          ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);

    await dbOrConn.query(`
      CREATE TABLE IF NOT EXISTS order_warranty_items (
        id INT NOT NULL AUTO_INCREMENT,
        order_id INT NOT NULL,
        item_role ENUM('faulty','replacement','supplier_return') NOT NULL DEFAULT 'faulty',
        handling_type ENUM('pending','tech_fix','exchange','supplier_return') NOT NULL DEFAULT 'pending',
        customer_status ENUM('pending','completed') NOT NULL DEFAULT 'pending',
        product_id INT NULL,
        supplier_id INT NULL,
        replacement_product_id INT NULL,
        replacement_source_scope ENUM('technician_stock','company_stock','supplier_returned_item') NULL,
        replacement_staff_id INT NULL,
        source_stock_scope ENUM(
          'customer',
          'company_stock',
          'technician_stock',
          'company_warranty_stock',
          'supplier',
          'external'
        ) NULL,
        source_staff_id INT NULL,
        qty INT NOT NULL DEFAULT 1,
        device_name VARCHAR(200) NULL,
        serial_no VARCHAR(120) NULL,
        imei VARCHAR(120) NULL,
        license_plate VARCHAR(50) NULL,
        account_name VARCHAR(120) NULL,
        sim_number VARCHAR(50) NULL,
        condition_note TEXT NULL,
        note_text TEXT NULL,
        additional_cost DECIMAL(12,0) NOT NULL DEFAULT 0,
        charge_ref_id INT NULL,
        current_status ENUM(
          'intake',
          'technician_holding',
          'pending_company_receipt',
          'company_warranty_stock',
          'sent_to_supplier',
          'supplier_returned',
          'delivered',
          'cancelled'
        ) NOT NULL DEFAULT 'intake',
        current_location ENUM(
          'customer',
          'technician',
          'company_warranty_stock',
          'supplier',
          'customer_returned'
        ) NOT NULL DEFAULT 'customer',
        holder_staff_id INT NULL,
        last_supplier_id INT NULL,
        last_move_at DATETIME NULL,
        release_receipt_id INT NULL,
        completed_at DATETIME NULL,
        completed_by_staff_id INT NULL,
        is_deleted TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_owi_order
          FOREIGN KEY (order_id) REFERENCES orders(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_owi_product
          FOREIGN KEY (product_id) REFERENCES products(id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_owi_replacement_product
          FOREIGN KEY (replacement_product_id) REFERENCES products(id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_owi_supplier
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_owi_source_staff
          FOREIGN KEY (source_staff_id) REFERENCES staff(id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_owi_holder_staff
          FOREIGN KEY (holder_staff_id) REFERENCES staff(id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_owi_replacement_staff
          FOREIGN KEY (replacement_staff_id) REFERENCES staff(id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_owi_last_supplier
          FOREIGN KEY (last_supplier_id) REFERENCES suppliers(id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_owi_release_receipt
          FOREIGN KEY (release_receipt_id) REFERENCES stock_receipts(id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_owi_completed_by
          FOREIGN KEY (completed_by_staff_id) REFERENCES staff(id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_owi_order (order_id, is_deleted),
        INDEX idx_owi_role (order_id, item_role, is_deleted)
      )
    `);

    await dbOrConn.query(`
      CREATE TABLE IF NOT EXISTS order_warranty_moves (
        id INT NOT NULL AUTO_INCREMENT,
        order_id INT NOT NULL,
        warranty_item_id INT NULL,
        action_code ENUM(
          'mark_fixed',
          'receive_from_customer',
          'handover_to_company',
          'move_to_company_stock',
          'send_to_supplier',
          'receive_from_supplier',
          'reserve_replacement_from_company',
          'reserve_replacement_from_technician',
          'deliver_to_customer',
          'cancel_item',
          'note'
        ) NOT NULL,
        from_location VARCHAR(50) NULL,
        to_location VARCHAR(50) NULL,
        qty INT NOT NULL DEFAULT 1,
        product_id INT NULL,
        supplier_id INT NULL,
        holder_staff_id INT NULL,
        receipt_id INT NULL,
        note_text TEXT NULL,
        photo_urls LONGTEXT NULL,
        occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_by_staff_id INT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_owmv_order
          FOREIGN KEY (order_id) REFERENCES orders(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_owmv_item
          FOREIGN KEY (warranty_item_id) REFERENCES order_warranty_items(id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_owmv_product
          FOREIGN KEY (product_id) REFERENCES products(id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_owmv_supplier
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_owmv_holder_staff
          FOREIGN KEY (holder_staff_id) REFERENCES staff(id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_owmv_receipt
          FOREIGN KEY (receipt_id) REFERENCES stock_receipts(id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT fk_owmv_created_by
          FOREIGN KEY (created_by_staff_id) REFERENCES staff(id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_owmv_order (order_id, occurred_at, id),
        INDEX idx_owmv_item (warranty_item_id, occurred_at, id)
      )
    `);

    await ensureColumn(
      dbOrConn,
      'order_warranty_items',
      'handling_type',
      `handling_type ENUM('pending','tech_fix','exchange','supplier_return') NOT NULL DEFAULT 'pending' AFTER item_role`
    );
    await ensureColumn(
      dbOrConn,
      'order_warranty_items',
      'customer_status',
      `customer_status ENUM('pending','completed') NOT NULL DEFAULT 'pending' AFTER handling_type`
    );
    await ensureColumn(
      dbOrConn,
      'order_warranty_items',
      'replacement_product_id',
      `replacement_product_id INT NULL AFTER supplier_id`
    );
    await ensureColumn(
      dbOrConn,
      'order_warranty_items',
      'replacement_source_scope',
      `replacement_source_scope ENUM('technician_stock','company_stock','supplier_returned_item') NULL AFTER replacement_product_id`
    );
    await ensureColumn(
      dbOrConn,
      'order_warranty_items',
      'replacement_staff_id',
      `replacement_staff_id INT NULL AFTER replacement_source_scope`
    );
    await ensureColumn(
      dbOrConn,
      'order_warranty_items',
      'additional_cost',
      `additional_cost DECIMAL(12,0) NOT NULL DEFAULT 0 AFTER note_text`
    );
    await ensureColumn(
      dbOrConn,
      'order_warranty_items',
      'charge_ref_id',
      `charge_ref_id INT NULL AFTER additional_cost`
    );
    await ensureColumn(
      dbOrConn,
      'order_warranty_items',
      'completed_at',
      `completed_at DATETIME NULL AFTER release_receipt_id`
    );
    await ensureColumn(
      dbOrConn,
      'order_warranty_items',
      'completed_by_staff_id',
      `completed_by_staff_id INT NULL AFTER completed_at`
    );

    // R8.6: co don du lieu loi khong suy ra duoc Display_State -> danh dau cho review thu cong.
    await ensureColumn(
      dbOrConn,
      'order_warranty_meta',
      'needs_review',
      `needs_review TINYINT(1) NOT NULL DEFAULT 0 AFTER note_text`
    );

    // Stage la nguon su that duy nhat: bo gia tri chet 'ready_to_ship',
    // chuan hoa enum + dong bo lai location/customer_status suy ra tu stage.
    const [statusCol] = await dbOrConn.query(`SHOW COLUMNS FROM order_warranty_items LIKE 'current_status'`);
    const statusColType = String(statusCol[0] && statusCol[0].Type || '');
    if (statusColType.includes(`'ready_to_ship'`)) {
      await dbOrConn.query(
        `UPDATE order_warranty_items SET current_status = 'supplier_returned' WHERE current_status = 'ready_to_ship'`
      );
      await dbOrConn.query(`
        ALTER TABLE order_warranty_items
          MODIFY COLUMN current_status ENUM(
            'intake','technician_holding','company_warranty_stock',
            'sent_to_supplier','supplier_returned','delivered','cancelled'
          ) NOT NULL DEFAULT 'intake'
      `);
    }

    const [moveActionCol] = await dbOrConn.query(`SHOW COLUMNS FROM order_warranty_moves LIKE 'action_code'`);
    const moveActionType = String(moveActionCol[0] && moveActionCol[0].Type || '');
    if (!moveActionType.includes(`'mark_fixed'`)) {
      await dbOrConn.query(`
        ALTER TABLE order_warranty_moves
          MODIFY COLUMN action_code ENUM(
            'mark_fixed',
            'receive_from_customer',
            'move_to_company_stock',
            'send_to_supplier',
            'receive_from_supplier',
            'reserve_replacement_from_company',
            'reserve_replacement_from_technician',
            'deliver_to_customer',
            'cancel_item',
            'note'
          ) NOT NULL
      `);
    }

    // Bo sung stage trung gian 'pending_company_receipt' (KTV gui hang loi ve kho, cho xac nhan).
    const [statusCol2] = await dbOrConn.query(`SHOW COLUMNS FROM order_warranty_items LIKE 'current_status'`);
    if (!String(statusCol2[0] && statusCol2[0].Type || '').includes(`'pending_company_receipt'`)) {
      await dbOrConn.query(`
        ALTER TABLE order_warranty_items
          MODIFY COLUMN current_status ENUM(
            'intake','technician_holding','pending_company_receipt','company_warranty_stock',
            'sent_to_supplier','supplier_returned','delivered','cancelled'
          ) NOT NULL DEFAULT 'intake'
      `);
    }

    // Bo sung action 'handover_to_company' (KTV khai gui hang loi ve kho).
    const [moveActionCol2] = await dbOrConn.query(`SHOW COLUMNS FROM order_warranty_moves LIKE 'action_code'`);
    if (!String(moveActionCol2[0] && moveActionCol2[0].Type || '').includes(`'handover_to_company'`)) {
      await dbOrConn.query(`
        ALTER TABLE order_warranty_moves
          MODIFY COLUMN action_code ENUM(
            'mark_fixed',
            'receive_from_customer',
            'handover_to_company',
            'move_to_company_stock',
            'send_to_supplier',
            'receive_from_supplier',
            'reserve_replacement_from_company',
            'reserve_replacement_from_technician',
            'deliver_to_customer',
            'cancel_item',
            'note'
          ) NOT NULL
      `);
    }

    await dbOrConn.query(`
      CREATE TABLE IF NOT EXISTS supplier_warranty_batches (
        id INT NOT NULL AUTO_INCREMENT,
        code VARCHAR(40) NOT NULL,
        supplier_id INT NOT NULL,
        status ENUM('draft','sent','received','cancelled') NOT NULL DEFAULT 'draft',
        note_text TEXT NULL,
        sent_at DATETIME NULL,
        received_at DATETIME NULL,
        created_by_staff_id INT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_supplier_warranty_batches_code (code),
        CONSTRAINT fk_swb_supplier
          FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_swb_creator
          FOREIGN KEY (created_by_staff_id) REFERENCES staff(id)
          ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);

    await dbOrConn.query(`
      CREATE TABLE IF NOT EXISTS supplier_warranty_batch_items (
        id INT NOT NULL AUTO_INCREMENT,
        batch_id INT NOT NULL,
        warranty_item_id INT NOT NULL,
        order_id INT NOT NULL,
        product_id INT NULL,
        qty INT NOT NULL DEFAULT 1,
        note_text TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_supplier_warranty_batch_item (batch_id, warranty_item_id),
        CONSTRAINT fk_swbi_batch
          FOREIGN KEY (batch_id) REFERENCES supplier_warranty_batches(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_swbi_item
          FOREIGN KEY (warranty_item_id) REFERENCES order_warranty_items(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_swbi_order
          FOREIGN KEY (order_id) REFERENCES orders(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_swbi_product
          FOREIGN KEY (product_id) REFERENCES products(id)
          ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_swbi_item (warranty_item_id),
        INDEX idx_swbi_order (order_id)
      )
    `);
  })().catch((err) => {
    schemaReadyPromise = null;
    throw err;
  });
  return schemaReadyPromise;
}

async function fetchSupplierMap(conn, supplierIds) {
  const ids = [...new Set((supplierIds || []).map(normalizeId).filter(Boolean))];
  if (!ids.length) return new Map();
  const [rows] = await conn.query(
    `SELECT id, name FROM suppliers WHERE id IN (?) AND is_deleted = 0`,
    [ids]
  );
  return new Map(rows.map((row) => [Number(row.id), row]));
}

async function validateProductIds(conn, productIds) {
  const ids = [...new Set((productIds || []).map(normalizeId).filter(Boolean))];
  if (!ids.length) return new Set();
  const [rows] = await conn.query(
    `SELECT id FROM products WHERE id IN (?) AND is_deleted = 0`,
    [ids]
  );
  return new Set(rows.map((row) => Number(row.id)));
}

async function validateStaffIds(conn, staffIds) {
  const ids = [...new Set((staffIds || []).map(normalizeId).filter(Boolean))];
  if (!ids.length) return new Set();
  const [rows] = await conn.query(
    `SELECT id FROM staff WHERE id IN (?) AND is_deleted = 0`,
    [ids]
  );
  return new Set(rows.map((row) => Number(row.id)));
}

function normalizeWarrantyItem(raw) {
  const itemRole = WARRANTY_ITEM_ROLES.includes(raw && raw.item_role) ? raw.item_role : 'faulty';
  const currentStatus = WARRANTY_ITEM_STATUSES.includes(raw && raw.current_status)
    ? raw.current_status
    : 'intake';
  // location luon suy ra tu stage; customer_status doc lap (nhan tu input/giu nguyen).
  const derived = deriveStageFields(currentStatus, {
    current_location: raw && raw.current_location,
    customer_status: raw && raw.customer_status,
  });
  const handlingType = normalizeHandlingType(raw && raw.handling_type);
  const customerStatus = normalizeCustomerStatus(raw && raw.customer_status);
  const sourceStockScope = raw && raw.source_stock_scope
    ? String(raw.source_stock_scope)
    : null;
  return {
    id: normalizeId(raw && raw.id),
    item_role: itemRole,
    handling_type: handlingType,
    customer_status: customerStatus,
    product_id: normalizeId(raw && raw.product_id),
    supplier_id: normalizeId(raw && raw.supplier_id),
    replacement_product_id: normalizeId(raw && raw.replacement_product_id),
    replacement_source_scope: normalizeReplacementSource(raw && raw.replacement_source_scope),
    replacement_staff_id: normalizeId(raw && raw.replacement_staff_id),
    source_stock_scope: sourceStockScope || null,
    source_staff_id: normalizeId(raw && raw.source_staff_id),
    qty: normalizeQty((raw && raw.qty) || 1),
    device_name: sanitizeText(raw && raw.device_name, { max: 200, label: 'Tên thiết bị' }),
    serial_no: sanitizeText(raw && raw.serial_no, { max: 120, label: 'Serial' }),
    imei: sanitizeText(raw && raw.imei, { max: 120, label: 'IMEI' }),
    license_plate: sanitizeText(raw && raw.license_plate, { max: 50, label: 'Biển số' }),
    account_name: sanitizeText(raw && raw.account_name, { max: 120, label: 'Tài khoản' }),
    sim_number: sanitizeText(raw && raw.sim_number, { max: 50, label: 'SIM' }),
    condition_note: sanitizeText(raw && raw.condition_note, { max: 1000, label: 'Tình trạng' }),
    note_text: sanitizeText(raw && raw.note_text, { max: 1000, label: 'Ghi chú item' }),
    additional_cost: normalizeMoney(raw && raw.additional_cost, 'Chi phí item'),
    current_status: currentStatus,
    current_location: derived.current_location,
    holder_staff_id: normalizeId(raw && raw.holder_staff_id),
    last_supplier_id: normalizeId(raw && raw.last_supplier_id),
    release_receipt_id: normalizeId(raw && raw.release_receipt_id),
    charge_ref_id: normalizeId(raw && raw.charge_ref_id),
    completed_at: normalizeOccurredAt(raw && raw.completed_at),
    completed_by_staff_id: normalizeId(raw && raw.completed_by_staff_id),
  };
}

async function upsertWarrantyMeta(conn, orderId, rawMeta = {}) {
  await ensureWarrantySchema(conn);
  const meta = {
    warranty_mode: normalizeWarrantyMode(rawMeta.warranty_mode),
    default_supplier_id: normalizeId(rawMeta.default_supplier_id),
    current_stage: sanitizeText(rawMeta.current_stage || 'intake', {
      max: 50,
      label: 'Giai đoạn bảo hành',
    }) || 'intake',
    note_text: sanitizeText(rawMeta.note_text, { max: 1000, label: 'Ghi chú bảo hành' }),
  };

  if (meta.default_supplier_id) {
    const supplierMap = await fetchSupplierMap(conn, [meta.default_supplier_id]);
    if (!supplierMap.has(meta.default_supplier_id)) {
      throw httpErr(400, 'Nhà cung cấp bảo hành không hợp lệ');
    }
  }

  await conn.query(
    `INSERT INTO order_warranty_meta
       (order_id, warranty_mode, default_supplier_id, current_stage, note_text)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       warranty_mode = VALUES(warranty_mode),
       default_supplier_id = VALUES(default_supplier_id),
       current_stage = VALUES(current_stage),
       note_text = VALUES(note_text)`,
    [
      orderId,
      meta.warranty_mode,
      meta.default_supplier_id,
      meta.current_stage,
      meta.note_text,
    ]
  );
}

async function syncWarrantyItemCharge(conn, orderId, itemId) {
  const [rows] = await conn.query(
    `SELECT wi.id, wi.additional_cost, wi.charge_ref_id, wi.device_name,
            p.name AS product_name
       FROM order_warranty_items wi
       LEFT JOIN products p ON p.id = wi.product_id
      WHERE wi.id = ? AND wi.order_id = ?`,
    [itemId, orderId]
  );
  if (!rows.length) return;
  const row = rows[0];
  const amount = Math.max(0, Math.round(Number(row.additional_cost) || 0));
  const chargeRefId = normalizeId(row.charge_ref_id);
  const itemLabel = row.product_name || row.device_name || `Item #${itemId}`;
  const chargeLabel = `Chi phí bảo hành - ${itemLabel}`;

  if (amount > 0) {
    if (chargeRefId) {
      await conn.query(
        `UPDATE order_charges
            SET kind = 'fee',
                label = ?,
                amount = ?,
                is_deleted = 0
          WHERE id = ? AND order_id = ?`,
        [chargeLabel, amount, chargeRefId, orderId]
      );
      return;
    }
    const [ins] = await conn.query(
      `INSERT INTO order_charges (order_id, line_id, kind, label, amount)
       VALUES (?, NULL, 'fee', ?, ?)`,
      [orderId, chargeLabel, amount]
    );
    await conn.query(
      `UPDATE order_warranty_items
          SET charge_ref_id = ?
        WHERE id = ? AND order_id = ?`,
      [ins.insertId, itemId, orderId]
    );
    return;
  }

  if (chargeRefId) {
    await conn.query(
      `UPDATE order_charges
          SET is_deleted = 1
        WHERE id = ? AND order_id = ?`,
      [chargeRefId, orderId]
    );
    await conn.query(
      `UPDATE order_warranty_items
          SET charge_ref_id = NULL
        WHERE id = ? AND order_id = ?`,
      [itemId, orderId]
    );
  }
}

async function replaceWarrantyItems(conn, orderId, rawItems = []) {
  await ensureWarrantySchema(conn);
  const items = Array.isArray(rawItems)
    ? rawItems.map((raw) => ({ raw: raw || {}, data: normalizeWarrantyItem(raw || {}) }))
    : [];
  const productIds = items.map((entry) => entry.data.product_id).filter(Boolean);
  const supplierIds = items.map((entry) => entry.data.supplier_id).filter(Boolean);
  const staffIds = items
    .flatMap((entry) => [
      entry.data.source_staff_id,
      entry.data.holder_staff_id,
      entry.data.replacement_staff_id,
      entry.data.completed_by_staff_id,
    ])
    .filter(Boolean);

  const validProducts = await validateProductIds(conn, productIds);
  for (const productId of productIds) {
    if (!validProducts.has(productId)) throw httpErr(400, `Sản phẩm ${productId} không hợp lệ`);
  }
  const supplierMap = await fetchSupplierMap(conn, supplierIds);
  for (const supplierId of supplierIds) {
    if (!supplierMap.has(supplierId)) throw httpErr(400, `Nhà cung cấp ${supplierId} không hợp lệ`);
  }
  const validStaff = await validateStaffIds(conn, staffIds);
  for (const staffId of staffIds) {
    if (!validStaff.has(staffId)) throw httpErr(400, `Nhân viên ${staffId} không hợp lệ`);
  }

  const [existingRows] = await conn.query(
    `SELECT id, item_role, handling_type, customer_status, product_id, supplier_id,
            replacement_product_id, replacement_source_scope, replacement_staff_id,
            additional_cost, charge_ref_id,
            qty, source_stock_scope, source_staff_id,
            device_name, serial_no, imei, license_plate, account_name, sim_number,
            condition_note, note_text,
            current_status, current_location, holder_staff_id, last_supplier_id, release_receipt_id,
            completed_at, completed_by_staff_id
       FROM order_warranty_items
      WHERE order_id = ? AND is_deleted = 0`,
    [orderId]
  );
  const existingIds = new Set(existingRows.map((row) => Number(row.id)));
  const existingMap = new Map(existingRows.map((row) => [Number(row.id), row]));
  const keepIds = new Set(items.map((entry) => entry.data.id).filter(Boolean));

  for (const existingId of existingIds) {
    if (keepIds.has(existingId)) continue;
    const [[moveCount]] = await conn.query(
      `SELECT COUNT(*) AS cnt
         FROM order_warranty_moves
        WHERE warranty_item_id = ?`,
      [existingId]
    );
    if (Number(moveCount.cnt) > 0) {
      throw httpErr(409, 'Không thể xoá item bảo hành đã có lịch sử kho');
    }
    const existing = existingMap.get(existingId);
    if (normalizeId(existing && existing.charge_ref_id)) {
      await conn.query(
        `UPDATE order_charges SET is_deleted = 1 WHERE id = ? AND order_id = ?`,
        [existing.charge_ref_id, orderId]
      );
    }
    await conn.query(
      `UPDATE order_warranty_items
          SET is_deleted = 1,
              charge_ref_id = NULL
        WHERE id = ? AND order_id = ?`,
      [existingId, orderId]
    );
  }

  for (const entry of items) {
    const raw = entry.raw || {};
    const item = entry.data;
    if (item.id && existingMap.has(item.id)) {
      const existing = existingMap.get(item.id);
      if (!hasOwn(raw, 'handling_type')) item.handling_type = normalizeHandlingType(existing.handling_type);
      if (!hasOwn(raw, 'source_stock_scope')) item.source_stock_scope = existing.source_stock_scope || null;
      if (!hasOwn(raw, 'source_staff_id')) item.source_staff_id = normalizeId(existing.source_staff_id);
      if (!hasOwn(raw, 'serial_no')) item.serial_no = existing.serial_no || null;
      if (!hasOwn(raw, 'replacement_product_id')) item.replacement_product_id = normalizeId(existing.replacement_product_id);
      if (!hasOwn(raw, 'replacement_source_scope')) item.replacement_source_scope = normalizeReplacementSource(existing.replacement_source_scope);
      if (!hasOwn(raw, 'replacement_staff_id')) item.replacement_staff_id = normalizeId(existing.replacement_staff_id);
      if (!hasOwn(raw, 'additional_cost')) item.additional_cost = normalizeMoney(existing.additional_cost, 'Chi phí item');
      if (!hasOwn(raw, 'current_status')) item.current_status = existing.current_status || 'intake';
      // customer_status doc lap: giu nguyen khi khong gui len; location suy ra tu stage
      if (!hasOwn(raw, 'customer_status')) item.customer_status = normalizeCustomerStatus(existing.customer_status);
      {
        const d = deriveStageFields(item.current_status, {
          current_location: existing.current_location,
          customer_status: existing.customer_status,
        });
        item.current_location = d.current_location;
      }
      if (!hasOwn(raw, 'holder_staff_id')) item.holder_staff_id = normalizeId(existing.holder_staff_id);
      if (!hasOwn(raw, 'last_supplier_id')) item.last_supplier_id = normalizeId(existing.last_supplier_id);
      if (!hasOwn(raw, 'release_receipt_id')) item.release_receipt_id = normalizeId(existing.release_receipt_id);
      if (!hasOwn(raw, 'charge_ref_id')) item.charge_ref_id = normalizeId(existing.charge_ref_id);
      if (!hasOwn(raw, 'completed_at')) item.completed_at = normalizeOccurredAt(existing.completed_at);
      if (!hasOwn(raw, 'completed_by_staff_id')) item.completed_by_staff_id = normalizeId(existing.completed_by_staff_id);
    }
    const params = [
      item.item_role,
      item.handling_type,
      item.customer_status,
      item.product_id,
      item.supplier_id,
      item.replacement_product_id,
      item.replacement_source_scope,
      item.replacement_staff_id,
      item.source_stock_scope,
      item.source_staff_id,
      item.qty,
      item.device_name,
      item.serial_no,
      item.imei,
      item.license_plate,
      item.account_name,
      item.sim_number,
      item.condition_note,
      item.note_text,
      item.additional_cost,
      item.current_status,
      item.current_location,
      item.holder_staff_id,
      item.last_supplier_id,
      item.release_receipt_id,
      item.charge_ref_id,
      item.completed_at,
      item.completed_by_staff_id,
    ];
    if (item.id) {
      if (!existingIds.has(item.id)) throw httpErr(404, 'Item bảo hành không tồn tại');
      const existing = existingMap.get(item.id);
      const [[moveCount]] = await conn.query(
        `SELECT COUNT(*) AS cnt
           FROM order_warranty_moves
          WHERE warranty_item_id = ?`,
        [item.id]
      );
      if (
        Number(moveCount.cnt) > 0
        && (
          String(existing.item_role) !== String(item.item_role)
          || Number(existing.product_id || 0) !== Number(item.product_id || 0)
          || Number(existing.qty || 0) !== Number(item.qty || 0)
        )
      ) {
        throw httpErr(409, 'Không thể đổi role, sản phẩm hoặc số lượng của item đã có lịch sử kho');
      }
      await conn.query(
        `UPDATE order_warranty_items
            SET item_role = ?,
                handling_type = ?,
                customer_status = ?,
                product_id = ?,
                supplier_id = ?,
                replacement_product_id = ?,
                replacement_source_scope = ?,
                replacement_staff_id = ?,
                source_stock_scope = ?,
                source_staff_id = ?,
                qty = ?,
                device_name = ?,
                serial_no = ?,
                imei = ?,
                license_plate = ?,
                account_name = ?,
                sim_number = ?,
                condition_note = ?,
                note_text = ?,
                additional_cost = ?,
                current_status = ?,
                current_location = ?,
                holder_staff_id = ?,
                last_supplier_id = ?,
                release_receipt_id = ?,
                charge_ref_id = ?,
                completed_at = ?,
                completed_by_staff_id = ?,
                is_deleted = 0
          WHERE id = ? AND order_id = ?`,
        [...params, item.id, orderId]
      );
      await syncWarrantyItemCharge(conn, orderId, item.id);
    } else {
      const [ins] = await conn.query(
        `INSERT INTO order_warranty_items
           (order_id, item_role, handling_type, customer_status, product_id, supplier_id,
            replacement_product_id, replacement_source_scope, replacement_staff_id,
            source_stock_scope, source_staff_id,
            qty, device_name, serial_no, imei, license_plate, account_name, sim_number,
            condition_note, note_text, additional_cost, current_status, current_location, holder_staff_id,
            last_supplier_id, release_receipt_id, charge_ref_id, completed_at, completed_by_staff_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
        [orderId, ...params]
      );
      await syncWarrantyItemCharge(conn, orderId, ins.insertId);
    }
  }
}

async function loadWarrantyDetail(conn, orderId) {
  await ensureWarrantySchema(conn);
  const [metaRows] = await conn.query(
    `SELECT wm.order_id, wm.warranty_mode, wm.default_supplier_id, wm.current_stage, wm.note_text,
            wm.created_at, wm.updated_at,
            s.name AS default_supplier_name
       FROM order_warranty_meta wm
       LEFT JOIN suppliers s ON s.id = wm.default_supplier_id
      WHERE wm.order_id = ?`,
    [orderId]
  );
  const [itemRows] = await conn.query(
    `SELECT wi.id, wi.order_id, wi.item_role, wi.handling_type, wi.customer_status,
            wi.product_id, wi.supplier_id, wi.replacement_product_id, wi.replacement_source_scope,
            wi.replacement_staff_id, wi.source_stock_scope, wi.source_staff_id, wi.qty,
            wi.device_name, wi.serial_no, wi.imei, wi.license_plate, wi.account_name, wi.sim_number,
            wi.condition_note, wi.note_text, wi.additional_cost, wi.charge_ref_id,
            wi.current_status, wi.current_location, wi.holder_staff_id,
            wi.last_supplier_id, wi.last_move_at, wi.release_receipt_id,
            wi.completed_at, wi.completed_by_staff_id, wi.created_at, wi.updated_at,
            p.code AS product_code, p.name AS product_name, p.thumbnail_url,
            rp.code AS replacement_product_code, rp.name AS replacement_product_name,
            ss.full_name AS source_staff_name,
            hs.full_name AS holder_staff_name,
            rs.full_name AS replacement_staff_name,
            sup.name AS supplier_name,
            ls.name AS last_supplier_name,
            cb.full_name AS completed_by_name,
            sr.code AS release_receipt_code
       FROM order_warranty_items wi
       LEFT JOIN products p ON p.id = wi.product_id
       LEFT JOIN products rp ON rp.id = wi.replacement_product_id
       LEFT JOIN staff ss ON ss.id = wi.source_staff_id
       LEFT JOIN staff hs ON hs.id = wi.holder_staff_id
       LEFT JOIN staff rs ON rs.id = wi.replacement_staff_id
       LEFT JOIN suppliers sup ON sup.id = wi.supplier_id
       LEFT JOIN suppliers ls ON ls.id = wi.last_supplier_id
       LEFT JOIN staff cb ON cb.id = wi.completed_by_staff_id
       LEFT JOIN stock_receipts sr ON sr.id = wi.release_receipt_id
      WHERE wi.order_id = ? AND wi.is_deleted = 0
      ORDER BY wi.id`,
    [orderId]
  );
  const [moveRows] = await conn.query(
    `SELECT mv.id, mv.order_id, mv.warranty_item_id, mv.action_code, mv.from_location, mv.to_location,
            mv.qty, mv.product_id, mv.supplier_id, mv.holder_staff_id, mv.receipt_id,
            mv.note_text, mv.photo_urls, mv.occurred_at, mv.created_at, mv.created_by_staff_id,
            p.code AS product_code, p.name AS product_name,
            s.name AS supplier_name,
            hs.full_name AS holder_staff_name,
            cb.full_name AS created_by_name,
            sr.code AS receipt_code
       FROM order_warranty_moves mv
       LEFT JOIN products p ON p.id = mv.product_id
       LEFT JOIN suppliers s ON s.id = mv.supplier_id
       LEFT JOIN staff hs ON hs.id = mv.holder_staff_id
       LEFT JOIN staff cb ON cb.id = mv.created_by_staff_id
       LEFT JOIN stock_receipts sr ON sr.id = mv.receipt_id
      WHERE mv.order_id = ?
      ORDER BY mv.occurred_at DESC, mv.id DESC`,
    [orderId]
  );

  const meta = metaRows[0] || {
    order_id: orderId,
    warranty_mode: 'repair',
    default_supplier_id: null,
    default_supplier_name: null,
    current_stage: 'intake',
    note_text: null,
    created_at: null,
    updated_at: null,
  };

  const items = itemRows.map((row) => ({
    ...row,
    display_state: deriveItemDisplayState(row),
    available_actions: buildWarrantyItemActions(row),
  }));

  const orderDisplayState = deriveOrderDisplayState(itemRows);

  // Timeline (R2): da sap xep occurred_at DESC, id DESC tu query.
  const timeline = moveRows.map((row) => {
    const entry = {
      id: row.id,
      warranty_item_id: row.warranty_item_id,
      action_code: row.action_code,
      action_label: warrantyActionLabel(row.action_code),
      actor_name: row.created_by_name || null,
      from_location: row.from_location,
      to_location: row.to_location,
      product_name: row.product_name || null,
      supplier_name: row.supplier_name || null,
      receipt_code: row.receipt_code || null,
      occurred_at: row.occurred_at,
      photo_urls: parseJsonList(row.photo_urls),
    };
    const note = (row.note_text || '').trim();
    if (note) entry.note_text = note;           // bo qua khi rong (R2.4)
    return entry;
  });

  return {
    meta: { ...meta, display_state: orderDisplayState },
    display_state: orderDisplayState,
    items,
    timeline,
    timeline_empty: timeline.length === 0,      // R2.6
    moves: moveRows.map((row) => ({
      ...row,
      photo_urls: parseJsonList(row.photo_urls),
    })),
  };
}

function deriveWarrantyMoveState(actionCode, orderRow, item, payload) {
  const holderStaffId = normalizeId(payload.holder_staff_id)
    || normalizeId(payload.replacement_staff_id)
    || item.holder_staff_id
    || item.replacement_staff_id
    || orderRow.assigned_staff_id
    || null;
  const supplierId = normalizeId(payload.supplier_id) || item.supplier_id || null;
  const replacementProductId = normalizeId(payload.replacement_product_id) || item.replacement_product_id || null;
  const sourceMode = String(payload.source_mode || '').trim();
  const completedAt = normalizeOccurredAt(payload.completed_at || payload.occurred_at);

  // Moi nhanh chi set STAGE (current_status) + handling/replacement/completed.
  // current_location va customer_status duoc suy ra tu stage o cuoi ham,
  // nen khong the lech nhau (single source of truth).
  let state;
  switch (actionCode) {
    case 'mark_fixed':
      state = {
        handling_type: 'tech_fix',
        current_status: 'delivered',
        holder_staff_id: null,
        supplier_id: supplierId,
        replacement_product_id: null,
        replacement_source_scope: null,
        replacement_staff_id: null,
        completed_at: completedAt,
        completed_by_staff_id: holderStaffId || null,
      };
      break;
    case 'receive_from_customer':
      state = {
        handling_type: payload.handling_type ? normalizeHandlingType(payload.handling_type) : (item.handling_type === 'pending' ? 'supplier_return' : item.handling_type),
        current_status: 'technician_holding',
        holder_staff_id: holderStaffId,
        supplier_id: supplierId,
        replacement_product_id: item.replacement_product_id,
        replacement_source_scope: item.replacement_source_scope,
        replacement_staff_id: item.replacement_staff_id,
        completed_at: item.completed_at,
        completed_by_staff_id: item.completed_by_staff_id,
      };
      break;
    case 'handover_to_company':
      // KTV khai da gui hang loi ve kho -> CHO kho/admin xac nhan. Van giu holder = KTV.
      state = {
        handling_type: item.handling_type,
        current_status: 'pending_company_receipt',
        holder_staff_id: item.holder_staff_id || holderStaffId,
        supplier_id: supplierId,
        replacement_product_id: item.replacement_product_id,
        replacement_source_scope: item.replacement_source_scope,
        replacement_staff_id: item.replacement_staff_id,
        completed_at: item.completed_at,
        completed_by_staff_id: item.completed_by_staff_id,
      };
      break;
    case 'move_to_company_stock':
      state = {
        handling_type: item.handling_type,
        current_status: 'company_warranty_stock',
        holder_staff_id: null,
        supplier_id: supplierId,
        replacement_product_id: item.replacement_product_id,
        replacement_source_scope: item.replacement_source_scope,
        replacement_staff_id: item.replacement_staff_id,
        completed_at: item.completed_at,
        completed_by_staff_id: item.completed_by_staff_id,
      };
      break;
    case 'send_to_supplier':
      if (!supplierId) throw httpErr(400, 'Cần chọn nhà cung cấp để gửi đổi trả');
      state = {
        handling_type: item.handling_type === 'pending' ? 'supplier_return' : item.handling_type,
        current_status: 'sent_to_supplier',
        holder_staff_id: null,
        supplier_id: supplierId,
        replacement_product_id: item.replacement_product_id,
        replacement_source_scope: item.replacement_source_scope,
        replacement_staff_id: item.replacement_staff_id,
        completed_at: item.completed_at,
        completed_by_staff_id: item.completed_by_staff_id,
      };
      break;
    case 'receive_from_supplier':
      state = {
        handling_type: item.handling_type === 'pending' ? 'supplier_return' : item.handling_type,
        current_status: 'supplier_returned',
        holder_staff_id: null,
        supplier_id: supplierId,
        replacement_product_id: item.replacement_product_id,
        replacement_source_scope: item.replacement_source_scope,
        replacement_staff_id: item.replacement_staff_id,
        completed_at: item.completed_at,
        completed_by_staff_id: item.completed_by_staff_id,
      };
      break;
    case 'reserve_replacement_from_company':
      // Giu nguyen stage hien tai, chi dat thong tin hang doi
      state = {
        handling_type: item.handling_type === 'pending' ? 'exchange' : item.handling_type,
        current_status: item.current_status,
        holder_staff_id: item.holder_staff_id,
        supplier_id: supplierId,
        replacement_product_id: sourceMode === 'supplier_returned_item' ? (item.product_id || replacementProductId) : replacementProductId,
        replacement_source_scope: sourceMode === 'supplier_returned_item' ? 'supplier_returned_item' : 'company_stock',
        replacement_staff_id: holderStaffId,
        completed_at: item.completed_at,
        completed_by_staff_id: item.completed_by_staff_id,
      };
      break;
    case 'reserve_replacement_from_technician':
      if (!holderStaffId) throw httpErr(400, 'Cần xác định KTV đang giữ hàng để xuất');
      state = {
        handling_type: 'exchange',
        current_status: 'technician_holding',
        holder_staff_id: holderStaffId,
        supplier_id: supplierId,
        replacement_product_id: replacementProductId,
        replacement_source_scope: 'technician_stock',
        replacement_staff_id: holderStaffId,
        completed_at: item.completed_at,
        completed_by_staff_id: item.completed_by_staff_id,
      };
      break;
    case 'deliver_to_customer': {
      // Doi hang: khach nhan may moi (xong), nhung MAY LOI cu van giu lai de thu ve kho -> gui NCC.
      // Cac truong hop khac (sua xong tra lai / hang NCC tra ve giao khach): dong don.
      const isExchangeLeftover = ['technician_stock', 'company_stock'].includes(item.replacement_source_scope)
        && item.replacement_product_id && item.replacement_staff_id;
      state = {
        handling_type: isExchangeLeftover ? 'supplier_return' : item.handling_type,
        current_status: isExchangeLeftover ? 'technician_holding' : 'delivered',
        holder_staff_id: isExchangeLeftover ? (normalizeId(item.replacement_staff_id) || holderStaffId || null) : null,
        supplier_id: supplierId,
        replacement_product_id: item.replacement_product_id,
        replacement_source_scope: item.replacement_source_scope,
        replacement_staff_id: item.replacement_staff_id,
        completed_at: completedAt,
        completed_by_staff_id: holderStaffId || item.completed_by_staff_id || null,
      };
      break;
    }
    case 'cancel_item':
      state = {
        handling_type: item.handling_type,
        current_status: 'cancelled',
        holder_staff_id: item.holder_staff_id,
        supplier_id: supplierId,
        replacement_product_id: item.replacement_product_id,
        replacement_source_scope: item.replacement_source_scope,
        replacement_staff_id: item.replacement_staff_id,
        completed_at: item.completed_at,
        completed_by_staff_id: item.completed_by_staff_id,
      };
      break;
    case 'note':
      state = {
        handling_type: item.handling_type,
        current_status: item.current_status,
        holder_staff_id: item.holder_staff_id,
        supplier_id: supplierId,
        replacement_product_id: item.replacement_product_id,
        replacement_source_scope: item.replacement_source_scope,
        replacement_staff_id: item.replacement_staff_id,
        completed_at: item.completed_at,
        completed_by_staff_id: item.completed_by_staff_id,
      };
      break;
    default:
      throw httpErr(400, 'Tác vụ bảo hành không hợp lệ');
  }

  // customer_status doc lap voi stage: chi 'completed' khi khach da duoc giai quyet
  // (sua xong tra khach, hoac giao hang doi/thay cho khach). Cac thao tac kho khac giu nguyen.
  if (actionCode === 'mark_fixed' || actionCode === 'deliver_to_customer') {
    state.customer_status = 'completed';
  } else {
    state.customer_status = item.customer_status || 'pending';
  }
  // location luon suy ra tu stage (giu location cu khi cancel)
  const derived = deriveStageFields(state.current_status, {
    current_location: item.current_location,
    customer_status: item.customer_status,
  });
  state.current_location = derived.current_location;
  return state;
}

function validateWarrantyMoveAction(item, actionCode, payload = {}) {
  if (actionCode === 'note') return;
  if (item.current_status === 'cancelled') throw httpErr(409, 'Item bảo hành đã huỷ');

  switch (actionCode) {
    case 'mark_fixed':
      if (item.customer_status === 'completed') throw httpErr(409, 'Sản phẩm này đã xong bên phía khách');
      return;
    case 'receive_from_customer':
      if (item.current_status !== 'intake' || item.current_location !== 'customer') {
        throw httpErr(409, 'Sản phẩm hiện không nằm ở khách để đưa vào túi KTV');
      }
      return;
    case 'handover_to_company':
      if (item.current_status !== 'technician_holding' || item.current_location !== 'technician') {
        throw httpErr(409, 'Sản phẩm hiện không ở túi KTV để gửi về kho');
      }
      return;
    case 'move_to_company_stock':
      // Cho phep tu túi KTV (admin nhan truc tiep) HOAC tu trang thai cho xac nhan (xac nhan da nhan).
      if (item.current_status === 'pending_company_receipt') return;
      if (item.current_status !== 'technician_holding' || item.current_location !== 'technician') {
        throw httpErr(409, 'Sản phẩm hiện không ở túi KTV để trả về kho công ty');
      }
      return;
    case 'send_to_supplier':
      if (item.current_status !== 'company_warranty_stock' || item.current_location !== 'company_warranty_stock') {
        throw httpErr(409, 'Sản phẩm hiện không ở kho bảo hành công ty');
      }
      return;
    case 'receive_from_supplier':
      if (item.current_status !== 'sent_to_supplier' || item.current_location !== 'supplier') {
        throw httpErr(409, 'Sản phẩm hiện chưa ở trạng thái đang gửi nhà cung cấp');
      }
      return;
    case 'reserve_replacement_from_company':
      if (item.customer_status === 'completed') throw httpErr(409, 'Sản phẩm này đã xong bên phía khách');
      if (String(payload.source_mode || '').trim() === 'supplier_returned_item') {
        if (item.current_status !== 'supplier_returned' || item.current_location !== 'company_warranty_stock') {
          throw httpErr(409, 'Chỉ có thể phân KTV đi giao khi sản phẩm đã nhận về từ NCC');
        }
        return;
      }
      return;
    case 'reserve_replacement_from_technician':
      if (item.customer_status === 'completed') throw httpErr(409, 'Sản phẩm này đã xong bên phía khách');
      return;
    case 'deliver_to_customer':
      if (item.customer_status === 'completed') throw httpErr(409, 'Sản phẩm này đã xong bên phía khách');
      if (['company_stock', 'technician_stock', 'supplier_returned_item'].includes(item.replacement_source_scope) && item.replacement_product_id && item.replacement_staff_id) return;
      if (item.current_status === 'supplier_returned') return;
      if (item.handling_type === 'tech_fix') return;
      throw httpErr(409, 'Sản phẩm chưa đủ điều kiện trả bảo hành cho khách');
    case 'cancel_item':
      if (item.customer_status === 'completed') throw httpErr(409, 'Không thể huỷ sản phẩm đã xong');
      return;
    default:
      return;
  }
}

async function genReceiptCode(conn, kind) {
  const prefix = kind === 'in' ? 'PN' : 'PX';
  const now = new Date();
  const datePart = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const like = `${prefix}-${datePart}-%`;
  const [rows] = await conn.query(
    `SELECT code FROM stock_receipts WHERE code LIKE ? ORDER BY code DESC LIMIT 1`,
    [like]
  );
  let next = 1;
  if (rows.length) {
    const tail = rows[0].code.slice(`${prefix}-${datePart}-`.length);
    next = (parseInt(tail, 10) || 0) + 1;
  }
  return `${prefix}-${datePart}-${String(next).padStart(3, '0')}`;
}

async function createReplacementReceipt(conn, {
  reasonCode,
  orderId,
  productId,
  qty,
  createdByStaffId,
  refStaffId = null,
  reasonText = null,
}) {
  const code = await genReceiptCode(conn, 'out');
  const [receiptRes] = await conn.query(
    `INSERT INTO stock_receipts
       (code, kind, reason_code, reason_text, ref_order_id, ref_staff_id, created_by_staff_id)
     VALUES (?, 'out', ?, ?, ?, ?, ?)`,
    [code, reasonCode, reasonText, orderId, refStaffId, createdByStaffId]
  );
  const receiptId = receiptRes.insertId;
  await conn.query(
    `INSERT INTO stock_receipt_items (receipt_id, product_id, qty)
     VALUES (?, ?, ?)`,
    [receiptId, productId, qty]
  );
  return { id: receiptId, code };
}

// R7.x: NCC tra hang OK ve kho chinh -> sinh phieu nhap (kind='in') + cong ton product_stock.
async function createWarrantyReturnReceipt(conn, {
  orderId,
  productId,
  qty,
  createdByStaffId,
  supplierId = null,
  reasonText = null,
}) {
  const code = await genReceiptCode(conn, 'in');
  const [receiptRes] = await conn.query(
    `INSERT INTO stock_receipts
       (code, kind, reason_code, reason_text, ref_order_id, supplier_id, created_by_staff_id)
     VALUES (?, 'in', 'warranty_supplier_return', ?, ?, ?, ?)`,
    [code, reasonText, orderId, supplierId, createdByStaffId]
  );
  const receiptId = receiptRes.insertId;
  await conn.query(
    `INSERT INTO stock_receipt_items (receipt_id, product_id, qty)
     VALUES (?, ?, ?)`,
    [receiptId, productId, qty]
  );
  await conn.query(
    `INSERT INTO product_stock (product_id, quantity) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
    [productId, qty]
  );
  return { id: receiptId, code };
}

async function consumeTechnicianHolding(conn, staffId, productId, qty) {
  const [holdingRows] = await conn.query(
    `SELECT id, qty FROM staff_holdings
      WHERE staff_id = ? AND product_id = ? FOR UPDATE`,
    [staffId, productId]
  );
  const available = holdingRows.length ? Number(holdingRows[0].qty) : 0;
  if (available < qty) {
    throw httpErr(409, `Hiện tại bạn không có thiết bị đổi trả, liên hệ kho để cấp thêm (còn ${available}, cần ${qty})`);
  }
  if (available === qty) {
    await conn.query(`DELETE FROM staff_holdings WHERE id = ?`, [holdingRows[0].id]);
  } else {
    await conn.query(
      `UPDATE staff_holdings SET qty = qty - ? WHERE id = ?`,
      [qty, holdingRows[0].id]
    );
  }
}

async function addTechnicianHolding(conn, staffId, productId, qty) {
  await conn.query(
    `INSERT INTO staff_holdings (staff_id, product_id, qty, first_held_at)
     VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)`,
    [staffId, productId, qty]
  );
}

async function issueCompanyStockToTechnician(conn, orderRow, productId, qty, actorId, staffId, noteText) {
  const [stockRows] = await conn.query(
    `SELECT quantity FROM product_stock WHERE product_id = ? FOR UPDATE`,
    [productId]
  );
  const available = stockRows.length ? Number(stockRows[0].quantity) : 0;
  if (available < qty) {
    throw httpErr(409, `Kho công ty không đủ hàng (còn ${available}, cần ${qty})`);
  }
  await conn.query(
    `UPDATE product_stock SET quantity = quantity - ? WHERE product_id = ?`,
    [qty, productId]
  );
  await addTechnicianHolding(conn, staffId, productId, qty);
  return createReplacementReceipt(conn, {
    reasonCode: 'warranty_staff_issue',
    orderId: orderRow.id,
    productId,
    qty,
    createdByStaffId: actorId,
    refStaffId: staffId,
    reasonText: noteText,
  });
}

async function consumeTechnicianReplacement(conn, orderRow, productId, qty, actorId, staffId, noteText, reasonCode) {
  await consumeTechnicianHolding(conn, staffId, productId, qty);
  return createReplacementReceipt(conn, {
    reasonCode,
    orderId: orderRow.id,
    productId,
    qty,
    createdByStaffId: actorId,
    refStaffId: staffId,
    reasonText: noteText,
  });
}

function buildWarrantyItemActions(item) {
  if (!item) return ['note'];
  const actions = new Set();
  if (item.current_status !== 'cancelled') actions.add('note');
  const customerPending = item.customer_status !== 'completed';
  if (customerPending && (!item.handling_type || item.handling_type === 'pending' || item.handling_type === 'tech_fix')) {
    actions.add('mark_fixed');
  }
  if (item.current_status === 'intake' && item.current_location === 'customer') {
    actions.add('receive_from_customer');
    if (customerPending && (!item.handling_type || item.handling_type === 'pending' || item.handling_type === 'exchange')) {
      actions.add('reserve_replacement_from_technician');
    }
  }
  if (item.current_status === 'technician_holding' && item.current_location === 'technician') {
    actions.add('handover_to_company');
    if (customerPending && (!item.handling_type || item.handling_type === 'pending' || item.handling_type === 'exchange' || item.handling_type === 'supplier_return')) {
      actions.add('reserve_replacement_from_technician');
    }
  }
  // KTV da gui hang loi ve kho, dang cho kho/admin xac nhan da nhan.
  if (item.current_status === 'pending_company_receipt') {
    actions.add('move_to_company_stock'); // = xac nhan da nhan ve kho
  }
  if (customerPending && item.current_status === 'company_warranty_stock' && item.current_location === 'company_warranty_stock') {
    actions.add('reserve_replacement_from_company');
  }
  if (item.current_status === 'supplier_returned' && item.current_location === 'company_warranty_stock') {
    if (customerPending) {
      actions.add('reserve_replacement_from_company');
      actions.add('deliver_to_customer');
    }
  }
  if (customerPending && ['company_stock', 'technician_stock', 'supplier_returned_item'].includes(item.replacement_source_scope) && item.replacement_product_id && item.replacement_staff_id) {
    actions.add('deliver_to_customer');
  }
  if (item.current_status !== 'cancelled' && customerPending) actions.add('cancel_item');
  return Array.from(actions);
}

async function syncWarrantyOrderState(conn, orderId) {
  const [[agg]] = await conn.query(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN customer_status = 'completed' OR current_status = 'delivered' OR current_location = 'customer_returned' THEN 1 ELSE 0 END) AS completed_count,
            SUM(CASE WHEN customer_status <> 'completed'
                      AND (current_status <> 'intake' OR current_location <> 'customer' OR handling_type <> 'pending')
                     THEN 1 ELSE 0 END) AS touched_count,
            SUM(CASE WHEN current_status = 'sent_to_supplier' THEN 1 ELSE 0 END) AS sent_count,
            SUM(CASE WHEN current_status = 'supplier_returned' THEN 1 ELSE 0 END) AS returned_count,
            SUM(CASE WHEN current_status = 'company_warranty_stock' THEN 1 ELSE 0 END) AS company_count,
            SUM(CASE WHEN current_status = 'technician_holding' THEN 1 ELSE 0 END) AS technician_count
       FROM order_warranty_items
      WHERE order_id = ? AND is_deleted = 0`,
    [orderId]
  );
  const total = Number(agg.total || 0);
  const completedCount = Number(agg.completed_count || 0);
  const touchedCount = Number(agg.touched_count || 0);

  let currentStage = 'intake';
  if (Number(agg.sent_count || 0) > 0) currentStage = 'sent_to_supplier';
  else if (Number(agg.returned_count || 0) > 0) currentStage = 'supplier_returned';
  else if (Number(agg.company_count || 0) > 0) currentStage = 'company_warranty_stock';
  else if (Number(agg.technician_count || 0) > 0) currentStage = 'technician_holding';
  else if (total > 0 && completedCount === total) currentStage = 'completed';

  await conn.query(
    `INSERT INTO order_warranty_meta (order_id, warranty_mode, current_stage)
     VALUES (?, 'repair', ?)
     ON DUPLICATE KEY UPDATE current_stage = VALUES(current_stage)`,
    [orderId, currentStage]
  );

  if (total > 0 && completedCount === total) {
    await conn.query(
      `UPDATE orders
          SET status = 'done',
              completed_at = COALESCE(completed_at, NOW())
        WHERE id = ? AND status <> 'cancelled'`,
      [orderId]
    );
  } else if (touchedCount > 0) {
    await conn.query(
      `UPDATE orders
          SET status = CASE WHEN status = 'done' THEN 'in_progress' WHEN status IN ('pending','confirmed') THEN 'in_progress' ELSE status END,
              completed_at = CASE WHEN status = 'done' THEN NULL ELSE completed_at END
        WHERE id = ? AND status <> 'cancelled'`,
      [orderId]
    );
  }
}

async function createWarrantyMove(conn, orderRow, rawPayload, actorId) {
  await ensureWarrantySchema(conn);
  const itemId = normalizeId(rawPayload.warranty_item_id);
  if (!itemId) throw httpErr(400, 'Thiếu warranty_item_id');
  const actionCode = String(rawPayload.action_code || '').trim();
  if (!WARRANTY_MOVE_ACTIONS.includes(actionCode)) throw httpErr(400, 'action_code không hợp lệ');

  const [itemRows] = await conn.query(
    `SELECT *
       FROM order_warranty_items
      WHERE id = ? AND order_id = ? AND is_deleted = 0
      FOR UPDATE`,
    [itemId, orderRow.id]
  );
  if (!itemRows.length) throw httpErr(404, 'Không tìm thấy item bảo hành');
  const item = itemRows[0];
  validateWarrantyMoveAction(item, actionCode, rawPayload);

  const qty = normalizeQty(rawPayload.qty || item.qty, 'Số lượng di chuyển');
  const state = deriveWarrantyMoveState(actionCode, orderRow, item, rawPayload);
  const noteText = sanitizeText(rawPayload.note_text, { max: 1000, label: 'Ghi chú thao tác' });
  const photoUrls = normalizeWarrantyPhotoUrls(rawPayload.photo_urls);
  const occurredAt = normalizeOccurredAt(rawPayload.occurred_at);
  const additionalCost = hasOwn(rawPayload, 'additional_cost')
    ? normalizeMoney(rawPayload.additional_cost, 'Chi phí item')
    : normalizeMoney(item.additional_cost, 'Chi phí item');

  let receipt = null;
  let supplierReturnReceipt = null;
  let moveProductId = item.product_id;
  let fromLocation = item.current_location;
  let toLocation = state.current_location;

  if (actionCode === 'reserve_replacement_from_technician') {
    const replacementProductId = normalizeId(state.replacement_product_id) || normalizeId(rawPayload.replacement_product_id);
    if (!replacementProductId) throw httpErr(400, 'Cần chọn sản phẩm đổi từ kho KTV');
    const replacementStaffId = normalizeId(state.replacement_staff_id) || normalizeId(orderRow.assigned_staff_id) || normalizeId(actorId);
    if (!replacementStaffId) throw httpErr(400, 'Không xác định được KTV để xuất hàng');
    moveProductId = replacementProductId;
    fromLocation = 'technician_stock';
    toLocation = 'technician';
  } else if (actionCode === 'reserve_replacement_from_company') {
    const replacementStaffId = normalizeId(state.replacement_staff_id) || normalizeId(orderRow.assigned_staff_id) || normalizeId(actorId);
    if (!replacementStaffId) throw httpErr(400, 'Không xác định được KTV để cấp hàng');
    if (state.replacement_source_scope === 'supplier_returned_item') {
      moveProductId = state.replacement_product_id || item.product_id;
      fromLocation = 'company_warranty_stock';
      toLocation = 'technician';
    } else {
      const replacementProductId = normalizeId(state.replacement_product_id) || normalizeId(rawPayload.replacement_product_id);
      if (!replacementProductId) throw httpErr(400, 'Cần chọn sản phẩm cấp từ kho công ty');
      receipt = await issueCompanyStockToTechnician(
        conn,
        orderRow,
        replacementProductId,
        qty,
        actorId,
        replacementStaffId,
        noteText
      );
      moveProductId = replacementProductId;
      fromLocation = 'company_stock';
      toLocation = 'technician';
    }
  } else if (actionCode === 'deliver_to_customer' && ['company_stock', 'technician_stock'].includes(item.replacement_source_scope) && item.replacement_product_id && item.replacement_staff_id) {
    receipt = await consumeTechnicianReplacement(
      conn,
      orderRow,
      normalizeId(item.replacement_product_id),
      qty,
      actorId,
      normalizeId(item.replacement_staff_id),
      noteText,
      'warranty_customer_delivery'
    );
    moveProductId = normalizeId(item.replacement_product_id);
    fromLocation = 'technician';
    toLocation = 'customer_returned';
  } else if (actionCode === 'mark_fixed') {
    moveProductId = item.product_id;
    fromLocation = item.current_location;
    toLocation = 'customer_returned';
  } else if (actionCode === 'receive_from_supplier' && normalizeId(item.product_id)) {
    // NCC tra hang OK -> nhap ve kho chinh: sinh phieu nhap + cong ton product_stock.
    supplierReturnReceipt = await createWarrantyReturnReceipt(conn, {
      orderId: orderRow.id,
      productId: normalizeId(item.product_id),
      qty,
      createdByStaffId: actorId,
      supplierId: state.supplier_id || item.last_supplier_id || item.supplier_id || null,
      reasonText: noteText,
    });
  }

  await conn.query(
    `INSERT INTO order_warranty_moves
       (order_id, warranty_item_id, action_code, from_location, to_location, qty,
        product_id, supplier_id, holder_staff_id, receipt_id, note_text, photo_urls,
        occurred_at, created_by_staff_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, NOW()), ?)`,
    [
      orderRow.id,
      itemId,
      actionCode,
      fromLocation,
      toLocation,
      qty,
      moveProductId,
      state.supplier_id,
      state.holder_staff_id || state.replacement_staff_id || item.holder_staff_id || item.replacement_staff_id || null,
      receipt ? receipt.id : (supplierReturnReceipt ? supplierReturnReceipt.id : null),
      noteText,
      photoUrls,
      occurredAt,
      actorId,
    ]
  );

  await conn.query(
    `UPDATE order_warranty_items
        SET current_status = ?,
            current_location = ?,
            holder_staff_id = ?,
            handling_type = ?,
            customer_status = ?,
            supplier_id = COALESCE(?, supplier_id),
            last_supplier_id = COALESCE(?, last_supplier_id),
            replacement_product_id = ?,
            replacement_source_scope = ?,
            replacement_staff_id = ?,
            additional_cost = ?,
            last_move_at = COALESCE(?, NOW()),
            release_receipt_id = COALESCE(?, release_receipt_id),
            completed_at = ?,
            completed_by_staff_id = ?
      WHERE id = ?`,
    [
      state.current_status,
      state.current_location,
      state.holder_staff_id,
      state.handling_type,
      state.customer_status,
      state.supplier_id,
      state.supplier_id,
      state.replacement_product_id,
      state.replacement_source_scope,
      state.replacement_staff_id,
      additionalCost,
      occurredAt,
      receipt ? receipt.id : item.release_receipt_id,
      state.completed_at || item.completed_at,
      state.completed_by_staff_id || item.completed_by_staff_id,
      itemId,
    ]
  );

  await syncWarrantyItemCharge(conn, orderRow.id, itemId);
  await syncWarrantyOrderState(conn, orderRow.id);

  return { receipt: receipt || supplierReturnReceipt };
}

// ==========================================================
// R6: Giao thiet bi moi cho khach (don dang "Cho xu ly").
// Nguon hang: tui KTV (from_technician_bag=true) hoac kho cua hang (false -> tao phieu xuat).
// ==========================================================
async function deliverWarrantyReplacement(conn, orderRow, rawPayload, actorId) {
  await ensureWarrantySchema(conn);
  const itemId = normalizeId(rawPayload.warranty_item_id);
  if (!itemId) throw httpErr(400, 'Thiếu warranty_item_id');

  const qtyRaw = Number(rawPayload.qty || 1);
  if (!Number.isFinite(qtyRaw) || qtyRaw < 1 || qtyRaw > 999999 || Math.floor(qtyRaw) !== qtyRaw) {
    throw httpErr(400, 'Số lượng giao phải là số nguyên từ 1 đến 999999');
  }
  const qty = qtyRaw;

  const [itemRows] = await conn.query(
    `SELECT * FROM order_warranty_items
      WHERE id = ? AND order_id = ? AND is_deleted = 0
      FOR UPDATE`,
    [itemId, orderRow.id]
  );
  if (!itemRows.length) throw httpErr(404, 'Không tìm thấy item bảo hành');
  const item = itemRows[0];
  if (item.current_status === 'cancelled') throw httpErr(409, 'Item bảo hành đã huỷ');
  if (item.customer_status === 'completed') throw httpErr(409, 'Sản phẩm này đã xong bên phía khách');

  // Mac dinh lap dung san pham cua thiet bi loi (item.product_id) neu FE khong chi dinh.
  const replacementProductId = normalizeId(rawPayload.replacement_product_id) || normalizeId(item.product_id);
  if (!replacementProductId) throw httpErr(400, 'Cần chọn thiết bị để lắp cho khách');

  const validProducts = await validateProductIds(conn, [replacementProductId]);
  if (!validProducts.has(replacementProductId)) throw httpErr(400, 'Thiết bị lắp không hợp lệ');

  // ---- Tu dong chon nguon hang ----
  // Neu FE chi dinh ro from_technician_bag thi ton trong; khong thi tu kiem tra:
  //   con trong tui KTV (du so luong) -> lay tui KTV; nguoc lai -> xuat kho cua hang.
  const assignedStaffId = normalizeId(orderRow.assigned_staff_id);
  let fromTechnicianBag;
  const explicitBag = rawPayload.from_technician_bag;
  if (explicitBag === true || explicitBag === 'true' || explicitBag === 1) {
    fromTechnicianBag = true;
  } else if (explicitBag === false || explicitBag === 'false' || explicitBag === 0) {
    fromTechnicianBag = false;
  } else {
    let bagQty = 0;
    if (assignedStaffId) {
      const [bagRows] = await conn.query(
        `SELECT qty FROM staff_holdings WHERE staff_id = ? AND product_id = ?`,
        [assignedStaffId, replacementProductId]
      );
      bagQty = bagRows.length ? Number(bagRows[0].qty) : 0;
    }
    fromTechnicianBag = bagQty >= qty;
  }

  const noteText = sanitizeText(rawPayload.note_text, { max: 1000, label: 'Ghi chú giao thiết bị' });
  const occurredAt = normalizeOccurredAt(rawPayload.occurred_at);

  let receipt = null;
  let holderStaffId = null;

  if (fromTechnicianBag) {
    if (!assignedStaffId) throw httpErr(400, 'Đơn chưa có KTV phụ trách để lấy hàng từ túi KTV');
    await consumeTechnicianHolding(conn, assignedStaffId, replacementProductId, qty); // R6.4
    holderStaffId = assignedStaffId;
  } else {
    receipt = await issueStoreStockExport(conn, orderRow, replacementProductId, qty, actorId, noteText); // R6.5, R6.6
  }

  await conn.query(
    `INSERT INTO order_warranty_moves
       (order_id, warranty_item_id, action_code, from_location, to_location, qty,
        product_id, supplier_id, holder_staff_id, receipt_id, note_text, photo_urls,
        occurred_at, created_by_staff_id)
     VALUES (?, ?, 'deliver_to_customer', ?, 'customer_returned', ?, ?, ?, ?, ?, ?, NULL, COALESCE(?, NOW()), ?)`,
    [
      orderRow.id,
      itemId,
      fromTechnicianBag ? 'technician' : 'company_stock',
      qty,
      replacementProductId,
      item.supplier_id || null,
      holderStaffId,
      receipt ? receipt.id : null,
      noteText,
      occurredAt,
      actorId,
    ]
  );

  await conn.query(
    `UPDATE order_warranty_items
        SET current_status = 'delivered',
            current_location = 'customer_returned',
            customer_status = 'completed',
            replacement_product_id = ?,
            replacement_source_scope = ?,
            replacement_staff_id = ?,
            last_move_at = COALESCE(?, NOW()),
            release_receipt_id = COALESCE(?, release_receipt_id),
            completed_at = COALESCE(?, NOW()),
            completed_by_staff_id = ?
      WHERE id = ?`,
    [
      replacementProductId,
      fromTechnicianBag ? 'technician_stock' : 'company_stock',
      holderStaffId,
      occurredAt,
      receipt ? receipt.id : null,
      occurredAt,
      holderStaffId || actorId || null,
      itemId,
    ]
  );

  await syncWarrantyOrderState(conn, orderRow.id);
  return { receipt, fromTechnicianBag };
}

// Xuat hang tu kho cua hang (product_stock) + tao phieu xuat day du (R6.5/R6.6).
async function issueStoreStockExport(conn, orderRow, productId, qty, actorId, noteText) {
  const [stockRows] = await conn.query(
    `SELECT quantity FROM product_stock WHERE product_id = ? FOR UPDATE`,
    [productId]
  );
  const available = stockRows.length ? Number(stockRows[0].quantity) : 0;
  if (available < qty) {
    throw httpErr(409, `Kho cửa hàng không đủ hàng (còn ${available}, cần ${qty})`);
  }
  await conn.query(
    `UPDATE product_stock SET quantity = quantity - ? WHERE product_id = ?`,
    [qty, productId]
  );
  return createReplacementReceipt(conn, {
    reasonCode: 'warranty_customer_delivery',
    orderId: orderRow.id,
    productId,
    qty,
    createdByStaffId: actorId,
    refStaffId: null,
    reasonText: noteText,
  });
}

// ==========================================================
// R7: Keo hang tu tui KTV ve kho bao hanh cong ty (thao tac kho doc lap).
// Dung chung createWarrantyMove (move_to_company_stock) de timeline dong bo.
// ==========================================================
async function pullItemToCompanyStock(conn, itemId, actorId) {
  await ensureWarrantySchema(conn);
  const id = normalizeId(itemId);
  if (!id) throw httpErr(400, 'Thiếu warranty_item_id');
  const [rows] = await conn.query(
    `SELECT wi.id, o.id AS order_id, o.code, o.service_kind, o.assigned_staff_id, o.status
       FROM order_warranty_items wi
       JOIN orders o ON o.id = wi.order_id
      WHERE wi.id = ? AND wi.is_deleted = 0`,
    [id]
  );
  if (!rows.length) throw httpErr(404, 'Không tìm thấy item bảo hành');
  const orderRow = {
    id: rows[0].order_id,
    code: rows[0].code,
    service_kind: rows[0].service_kind,
    assigned_staff_id: rows[0].assigned_staff_id,
    status: rows[0].status,
  };
  return createWarrantyMove(conn, orderRow, { warranty_item_id: id, action_code: 'move_to_company_stock' }, actorId);
}

module.exports = {
  WARRANTY_SERVICE_KIND,
  WARRANTY_MODES,
  WARRANTY_HANDLING_TYPES,
  WARRANTY_CUSTOMER_STATUSES,
  WARRANTY_REPLACEMENT_SOURCES,
  WARRANTY_ITEM_ROLES,
  WARRANTY_ITEM_STATUSES,
  WARRANTY_ITEM_LOCATIONS,
  WARRANTY_MOVE_ACTIONS,
  SERVICE_KINDS,
  ensureWarrantySchema,
  normalizeServiceKind,
  upsertWarrantyMeta,
  replaceWarrantyItems,
  loadWarrantyDetail,
  createWarrantyMove,
  syncWarrantyOrderState,
  buildWarrantyItemActions,
  deriveItemDisplayState,
  deriveOrderDisplayState,
  hasReplacementReserved,
  warrantyActionLabel,
  deliverWarrantyReplacement,
  pullItemToCompanyStock,
  DISPLAY_STATE_LABELS,
};
