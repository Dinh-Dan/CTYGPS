// Seed du lieu mau de test toan bo flow.
// Chay: `node BE/scripts/seed-test-data.js`
// Co the chay nhieu lan — chi them khi chua co (check theo unique code/phone/username).
//
// Tao:
//   - 4 categories
//   - 5 products + giá Bán lẻ + Bán sỉ
//   - 3 suppliers (NCC)
//   - 4 customers retail + 2 dealers (có pwd 'dealer123')
//   - 1 admin (admin/admin123) + 3 KTV (area khác nhau, pwd 'ktv123')
//   - 12 stock_items (IMEI khac nhau, có cái không IMEI)
//   - 6 orders ở các status: pending_review / new / assigned / warehouse_released / done (paid full) / done (debt)
//   - 4 tasks (kèm checklist + 1 task in_progress, 1 task done, 1 collection)
//   - 3 badges (pending_review / submitted / delivered)

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/db');

const log = (msg) => console.log(msg);

// ---- Helper: tim hoac tao ------------------------------------
async function findOrCreate(table, where, insertValues) {
  const cols = Object.keys(where);
  const sql = `SELECT id FROM ${table} WHERE ${cols.map(c => `${c} = ?`).join(' AND ')} LIMIT 1`;
  const [rows] = await db.query(sql, cols.map(c => where[c]));
  if (rows.length) return { id: rows[0].id, created: false };

  const allCols = Object.keys(insertValues);
  const placeholders = allCols.map(() => '?').join(',');
  const [r] = await db.query(
    `INSERT INTO ${table} (${allCols.join(',')}) VALUES (${placeholders})`,
    allCols.map(c => insertValues[c])
  );
  return { id: r.insertId, created: true };
}

async function genCode(prefix, table, codeCol = 'code') {
  // Generate code dang PREFIX-DDMM-NNN
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const fullPrefix = `${prefix}-${dd}${mm}-`;
  const [rows] = await db.query(
    `SELECT ${codeCol} FROM ${table} WHERE ${codeCol} LIKE ? ORDER BY ${codeCol} DESC LIMIT 1`,
    [`${fullPrefix}%`]
  );
  let next = 1;
  if (rows.length) {
    const last = rows[0][codeCol].slice(fullPrefix.length);
    next = (parseInt(last) || 0) + 1;
  }
  return fullPrefix + String(next).padStart(3, '0');
}

(async () => {
  try {
    log('===== SEED TEST DATA =====\n');

    // 1) Categories ---------------------------------------------
    log('-- Categories --');
    const catNames = ['Định vị xe tải', 'Camera giám sát', 'Hộp đen MDVR', 'Phụ kiện'];
    const categories = {};
    for (const name of catNames) {
      const r = await findOrCreate('categories', { name }, { name });
      categories[name] = r.id;
      log(`  ${r.created ? '+' : '·'} ${name} (id=${r.id})`);
    }

    // 2) Products + prices --------------------------------------
    log('-- Products --');
    const productSeeds = [
      { code: 'VT-01', name: 'Định vị VT-01 cơ bản', cat: 'Định vị xe tải', cost: 800000, retail: 1500000, dealer: 1200000, warranty: 12 },
      { code: 'VT-02', name: 'Định vị VT-02 Pro (4G)', cat: 'Định vị xe tải', cost: 1200000, retail: 2500000, dealer: 2000000, warranty: 24 },
      { code: 'CAM-01', name: 'Camera AHD 1080p', cat: 'Camera giám sát', cost: 600000, retail: 1200000, dealer: 950000, warranty: 12 },
      { code: 'MDVR-04', name: 'Đầu ghi MDVR 4 kênh', cat: 'Hộp đen MDVR', cost: 2500000, retail: 4500000, dealer: 3800000, warranty: 24 },
      { code: 'CAB-OBD', name: 'Cáp OBD II', cat: 'Phụ kiện', cost: 80000, retail: 200000, dealer: 150000, warranty: 6 },
    ];
    const products = {};
    for (const p of productSeeds) {
      const r = await findOrCreate(
        'products',
        { code: p.code },
        {
          code: p.code, name: p.name, category_id: categories[p.cat],
          cost_price: p.cost, warranty_months: p.warranty,
          description: 'Sản phẩm mẫu cho test',
        }
      );
      products[p.code] = r.id;
      log(`  ${r.created ? '+' : '·'} ${p.code} ${p.name} (id=${r.id})`);

      // Prices
      const [exist] = await db.query(`SELECT COUNT(*) AS c FROM product_prices WHERE product_id = ?`, [r.id]);
      if (!exist[0].c) {
        await db.query(
          `INSERT INTO product_prices (product_id, label, price, sort_order) VALUES (?, 'Ban le', ?, 1), (?, 'Ban si', ?, 2)`,
          [r.id, p.retail, r.id, p.dealer]
        );
        log(`     + giá: Bán lẻ ${p.retail.toLocaleString()} / Bán sỉ ${p.dealer.toLocaleString()}`);
      }
    }

    // 3) Suppliers ----------------------------------------------
    log('-- Suppliers --');
    const supSeeds = [
      { name: 'Cty TNHH An Khang', phone: '0281234567', address: '123 Lê Lợi, Q.1, TP.HCM', note: 'NCC chính thiết bị định vị' },
      { name: 'Skycool Vietnam', phone: '0287654321', address: '45 Trần Hưng Đạo, Hà Nội', note: 'NCC camera + MDVR' },
      { name: 'TechGlobal', phone: '0901111222', address: '789 Phạm Văn Đồng, TP.HCM', note: 'NCC hộp đen + định vị' },
    ];
    const suppliers = {};
    for (const s of supSeeds) {
      const r = await findOrCreate('suppliers', { name: s.name }, s);
      suppliers[s.name] = r.id;
      log(`  ${r.created ? '+' : '·'} ${s.name} (id=${r.id})`);
    }

    // 4) Customers (retail + dealer) ----------------------------
    log('-- Customers --');
    const dealerHash = await bcrypt.hash('dealer123', 10);
    const customerSeeds = [
      { code: 'KH001', type: 'retail', full_name: 'Nguyễn Văn An', phone: '0901234567', address: 'Q.1, TP.HCM' },
      { code: 'KH002', type: 'retail', full_name: 'Trần Thị Bình', phone: '0912345678', address: 'Q.3, TP.HCM' },
      { code: 'KH003', type: 'retail', full_name: 'Lê Hoàng Cường', phone: '0923456789', address: 'Q.7, TP.HCM' },
      { code: 'KH004', type: 'retail', full_name: 'Phạm Thanh Dũng', phone: '0934567890', address: 'Bình Dương' },
      {
        code: 'DL001', type: 'dealer', full_name: 'Đỗ Quyên Quỳnh',
        phone: '0945678901', address: 'Đà Nẵng',
        company_name: 'Cty Định vị Miền Trung', tax_code: '0312345678',
        contact_person: 'Đỗ Quyên Quỳnh', debt_limit: 50000000,
        credit_term_days: 30, discount_rate: 5.00,
        password_hash: dealerHash,
      },
      {
        code: 'DL002', type: 'dealer', full_name: 'Hoàng Minh Tuấn',
        phone: '0956789012', address: 'Hà Nội',
        company_name: 'Cty Vận tải HMT', tax_code: '0398765432',
        contact_person: 'Hoàng Minh Tuấn', debt_limit: 30000000,
        credit_term_days: 15, discount_rate: 3.00,
        password_hash: dealerHash,
      },
    ];
    const customers = {};
    for (const c of customerSeeds) {
      const r = await findOrCreate('customers', { code: c.code }, c);
      customers[c.code] = r.id;
      log(`  ${r.created ? '+' : '·'} ${c.code} ${c.full_name}${c.type === 'dealer' ? ' (dealer)' : ''} (id=${r.id})`);
    }

    // 5) Staff --------------------------------------------------
    log('-- Staff --');
    const adminHash = await bcrypt.hash('admin123', 10);
    const ktvHash = await bcrypt.hash('ktv123', 10);
    const staffSeeds = [
      { username: 'admin', password_hash: adminHash, full_name: 'Quản trị viên', role: 'admin', phone: '0900000001', email: 'admin@gpsviet.vn' },
      { username: 'ktv01', password_hash: ktvHash, full_name: 'Trần Minh', role: 'kithuat', phone: '0911000001', email: 'ktv01@gpsviet.vn' },
      { username: 'ktv02', password_hash: ktvHash, full_name: 'Lê Văn Hùng', role: 'kithuat', phone: '0911000002', email: 'ktv02@gpsviet.vn' },
      { username: 'ktv03', password_hash: ktvHash, full_name: 'Nguyễn Đức Thành', role: 'kithuat', phone: '0911000003', email: 'ktv03@gpsviet.vn' },
    ];
    const staff = {};
    for (const s of staffSeeds) {
      const r = await findOrCreate('staff', { username: s.username }, s);
      staff[s.username] = r.id;
      log(`  ${r.created ? '+' : '·'} ${s.username} ${s.full_name} (id=${r.id}, role=${s.role})`);
    }
    // Update area + online_status + rating cho KTV (cot mo rong tu migration_005)
    await db.query(
      `UPDATE staff SET area='Quận 1, TP.HCM', online_status='online', rating=4.5
        WHERE username='ktv01'`
    );
    await db.query(
      `UPDATE staff SET area='Quận 7, TP.HCM', online_status='offline', rating=4.2
        WHERE username='ktv02'`
    );
    await db.query(
      `UPDATE staff SET area='Bình Dương', online_status='online', rating=4.8
        WHERE username='ktv03'`
    );

    // 6) Stock items --------------------------------------------
    log('-- Stock items --');
    const stockSeeds = [
      // VT-01: 5 cá thể (4 có IMEI + 1 không)
      { product: 'VT-01', supplier: 'Cty TNHH An Khang', identifier: '868290000000001', price: 800000 },
      { product: 'VT-01', supplier: 'Cty TNHH An Khang', identifier: '868290000000002', price: 800000 },
      { product: 'VT-01', supplier: 'Cty TNHH An Khang', identifier: '868290000000003', price: 800000 },
      { product: 'VT-01', supplier: 'Cty TNHH An Khang', identifier: '868290000000004', price: 800000 },
      { product: 'VT-01', supplier: 'Cty TNHH An Khang', identifier: null, price: 800000, note: 'Phụ kiện không IMEI' },
      // VT-02: 4
      { product: 'VT-02', supplier: 'TechGlobal', identifier: '868290000000101', price: 1200000 },
      { product: 'VT-02', supplier: 'TechGlobal', identifier: '868290000000102', price: 1200000 },
      { product: 'VT-02', supplier: 'TechGlobal', identifier: '868290000000103', price: 1200000 },
      { product: 'VT-02', supplier: 'TechGlobal', identifier: '868290000000104', price: 1200000 },
      // CAM-01: 2
      { product: 'CAM-01', supplier: 'Skycool Vietnam', identifier: 'CAM2024-001', price: 600000 },
      { product: 'CAM-01', supplier: 'Skycool Vietnam', identifier: 'CAM2024-002', price: 600000 },
      // CAB-OBD: 1 không IMEI
      { product: 'CAB-OBD', supplier: 'Cty TNHH An Khang', identifier: null, price: 80000, note: 'Cáp OBD' },
    ];
    let stockCreated = 0;
    const stockIds = []; // luu lai de gan vao task sau
    for (const s of stockSeeds) {
      const productId = products[s.product];
      const supplierId = suppliers[s.supplier];
      let id;
      if (s.identifier) {
        // Co IMEI -> check trung
        const [exist] = await db.query(
          `SELECT id FROM stock_items WHERE identifier = ? AND is_deleted = 0 LIMIT 1`,
          [s.identifier]
        );
        if (exist.length) { id = exist[0].id; }
        else {
          const [r] = await db.query(
            `INSERT INTO stock_items (product_id, supplier_id, identifier, status, import_price, import_date)
             VALUES (?, ?, ?, 'available', ?, CURDATE())`,
            [productId, supplierId, s.identifier, s.price]
          );
          id = r.insertId;
          await db.query(
            `INSERT INTO warehouse_logs (stock_item_id, kind, reason) VALUES (?, 'in', 'Seed test data')`,
            [id]
          );
          stockCreated++;
        }
      } else {
        // Khong IMEI -> chi check san pham + supplier + note de tranh trung khi chay lai
        const [exist] = await db.query(
          `SELECT id FROM stock_items
            WHERE product_id = ? AND supplier_id = ? AND identifier IS NULL
              AND note <=> ? AND is_deleted = 0 LIMIT 1`,
          [productId, supplierId, s.note || null]
        );
        if (exist.length) { id = exist[0].id; }
        else {
          const [r] = await db.query(
            `INSERT INTO stock_items (product_id, supplier_id, status, import_price, import_date, note)
             VALUES (?, ?, 'available', ?, CURDATE(), ?)`,
            [productId, supplierId, s.price, s.note || null]
          );
          id = r.insertId;
          stockCreated++;
        }
      }
      stockIds.push({ id, product: s.product });
    }
    log(`  + ${stockCreated} stock items mới`);

    // 7) Orders + items + tasks --------------------------------
    log('-- Orders + Tasks + Collections --');

    // Helper: skip neu order code mau da co
    async function ensureOrder(seedKey, seed) {
      const tag = `[seed:${seedKey}]`;
      const [exist] = await db.query(
        `SELECT id, code FROM orders WHERE note LIKE ? AND is_deleted = 0 LIMIT 1`,
        [`%${tag}%`]
      );
      if (exist.length) {
        log(`  · Order ${exist[0].code} đã tồn tại (skip)`);
        return null;
      }
      const code = await genCode('ORD', 'orders');
      const finalNote = (seed.note || '') + (seed.note ? '\n' : '') + tag;
      const [r] = await db.query(
        `INSERT INTO orders (code, customer_id, dealer_id, total_amount, subtotal, paid_amount,
                             payment_method, status, address,
                             note, creator_type, creator_id,
                             confirmed_at, confirmed_by)
         VALUES (?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          code, seed.customer_id, seed.dealer_id || null,
          seed.paid_amount || 0, seed.payment_method || 'cash',
          seed.status, seed.address || null,
          finalNote,
          seed.creator_type || 'admin', seed.creator_id || staff.admin,
          seed.confirmed_at || null, seed.confirmed_by || null,
        ]
      );
      const orderId = r.insertId;
      let subtotal = 0;
      for (const it of seed.items || []) {
        await db.query(
          `INSERT INTO order_items (order_id, product_id, qty, unit_price)
           VALUES (?, ?, ?, ?)`,
          [orderId, it.product_id, it.qty, it.unit_price]
        );
        subtotal += it.qty * it.unit_price;
      }
      let chargeSum = 0;
      for (const ch of seed.charges || []) {
        await db.query(
          `INSERT INTO order_charges (order_id, kind, label, amount) VALUES (?, ?, ?, ?)`,
          [orderId, ch.kind, ch.label, ch.amount]
        );
        chargeSum += ch.amount;
      }
      const total = Math.max(0, subtotal + chargeSum);
      await db.query(
        `UPDATE orders SET subtotal = ?, total_amount = ? WHERE id = ?`,
        [subtotal, total, orderId]
      );
      log(`  + Order ${code} status=${seed.status} total=${total.toLocaleString()}đ`);
      return { id: orderId, code, total };
    }

    async function createTask(orderId, seed) {
      const code = await genCode('TASK', 'tasks');
      const [r] = await db.query(
        `INSERT INTO tasks (code, order_id, kind, assigned_staff_id, status,
                            due_at, started_at, completed_at,
                            collect_amount, collect_method, wage_amount, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          code, orderId, seed.kind || 'install',
          seed.assigned_staff_id || null, seed.status || 'new',
          seed.due_at || null, seed.started_at || null, seed.completed_at || null,
          seed.collect_amount || 0, seed.collect_method || 'none',
          seed.wage_amount || 0, seed.note || null,
        ]
      );
      const taskId = r.insertId;
      // Default checklist
      const checklist = [
        'Kiểm tra thiết bị trước khi lắp',
        'Lắp đặt thiết bị lên xe',
        'Test tín hiệu GPS trực tiếp',
        'Hướng dẫn khách dùng app',
      ];
      for (let i = 0; i < checklist.length; i++) {
        await db.query(
          `INSERT INTO task_checklist (task_id, step, sort_order, is_done, done_at)
           VALUES (?, ?, ?, ?, ?)`,
          [taskId, checklist[i], i,
           seed.status === 'done' ? 1 : 0,
           seed.status === 'done' ? new Date() : null]
        );
      }
      return { id: taskId, code };
    }

    // (1) Đơn pending_review — khách KH001 vừa lên
    await ensureOrder('order1', {
      customer_id: customers.KH001,
      payment_method: 'debt',
      status: 'pending_review',
      service_kind: 'install',
      area: 'Quận 1, TP.HCM',
      address: '12 Nguyễn Huệ, Q.1',
      vehicle_plate: '51A-12345',
      creator_type: 'customer', creator_id: customers.KH001,
      note: 'Khách lên đơn online, cần tư vấn',
      items: [{ product_id: products['VT-02'], qty: 1, unit_price: 0 }],
    });

    // (2) Đơn pending_review — dealer DL001 đặt hộ
    await ensureOrder('order2', {
      customer_id: customers.KH002,
      dealer_id: customers.DL001,
      payment_method: 'debt',
      status: 'pending_review',
      service_kind: 'install',
      area: 'Quận 3, TP.HCM',
      address: '88 Võ Văn Tần, Q.3',
      vehicle_plate: '51B-23456',
      creator_type: 'dealer', creator_id: customers.DL001,
      note: 'Dealer DL001 đặt hộ khách KH002',
      items: [
        { product_id: products['VT-02'], qty: 1, unit_price: 0 },
        { product_id: products['CAB-OBD'], qty: 1, unit_price: 0 },
      ],
    });

    // (3) Đơn new — admin đã chốt giá + có phí ship + giảm giá
    await ensureOrder('order3', {
      customer_id: customers.KH003,
      payment_method: 'cash',
      status: 'new',
      service_kind: 'install',
      area: 'Quận 7, TP.HCM',
      address: '120 Nguyễn Thị Thập, Q.7',
      vehicle_plate: '51C-34567',
      creator_type: 'admin', creator_id: staff.admin,
      confirmed_at: new Date(), confirmed_by: staff.admin,
      note: 'Đơn admin tạo, đã chốt giá',
      items: [{ product_id: products['VT-02'], qty: 1, unit_price: 2500000 }],
      charges: [
        { kind: 'shipping', label: 'Phí ship Q.7', amount: 50000 },
        { kind: 'discount', label: 'Khuyến mãi tháng 4', amount: -100000 },
      ],
    });

    // (4) Đơn assigned — đã gán KTV ktv01, có task new
    const order4 = await ensureOrder('order4', {
      customer_id: customers.KH001,
      payment_method: 'cash',
      status: 'assigned',
      service_kind: 'install',
      area: 'Quận 1, TP.HCM',
      address: '12 Nguyễn Huệ, Q.1',
      vehicle_plate: '51A-99999',
      creator_type: 'admin', creator_id: staff.admin,
      confirmed_at: new Date(), confirmed_by: staff.admin,
      note: 'Đã gán KTV01',
      items: [{ product_id: products['VT-01'], qty: 1, unit_price: 1500000 }],
      charges: [{ kind: 'shipping', label: 'Phí ship', amount: 30000 }],
    });
    if (order4) {
      await createTask(order4.id, {
        kind: 'install', assigned_staff_id: staff.ktv01, status: 'new',
        wage_amount: 150000,
        note: 'Lắp tại 12 Nguyễn Huệ',
      });
    }

    // (5) Đơn done — paid full, có collection (KTV thu cash)
    const order5 = await ensureOrder('order5', {
      customer_id: customers.KH002,
      payment_method: 'cash',
      status: 'done',
      service_kind: 'install',
      area: 'Quận 3, TP.HCM',
      address: '88 Võ Văn Tần, Q.3',
      vehicle_plate: '51B-77777',
      creator_type: 'admin', creator_id: staff.admin,
      confirmed_at: new Date(Date.now() - 7 * 86400000), confirmed_by: staff.admin,
      note: 'KTV02 đã hoàn thành, khách trả cash',
      items: [{ product_id: products['VT-02'], qty: 1, unit_price: 2500000 }],
    });
    if (order5) {
      const task5 = await createTask(order5.id, {
        kind: 'install', assigned_staff_id: staff.ktv02, status: 'done',
        wage_amount: 200000,
        collect_amount: 2500000, collect_method: 'cash',
        started_at: new Date(Date.now() - 6 * 86400000),
        completed_at: new Date(Date.now() - 5 * 86400000),
        note: 'Đã lắp xong + test OK',
      });
      await db.query(
        `INSERT INTO collections (task_id, staff_id, amount, method, collected_at)
         VALUES (?, ?, ?, 'cash', ?)`,
        [task5.id, staff.ktv02, 2500000, new Date(Date.now() - 5 * 86400000)]
      );
      await db.query(
        `UPDATE orders SET paid_amount = total_amount WHERE id = ?`,
        [order5.id]
      );
    }

    // (6) Đơn done với debt — khách nợ, paid_amount < total
    const order6 = await ensureOrder('order6', {
      customer_id: customers.KH004,
      payment_method: 'debt',
      status: 'done',
      service_kind: 'install',
      area: 'Bình Dương',
      address: 'Khu CN Sóng Thần, Bình Dương',
      vehicle_plate: '61D-55555',
      creator_type: 'admin', creator_id: staff.admin,
      confirmed_at: new Date(Date.now() - 3 * 86400000), confirmed_by: staff.admin,
      paid_amount: 0,
      note: 'Khách nợ — trả sau',
      items: [{ product_id: products['VT-02'], qty: 1, unit_price: 2500000 }],
      charges: [{ kind: 'shipping', label: 'Ship Bình Dương', amount: 100000 }],
    });
    if (order6) {
      await createTask(order6.id, {
        kind: 'install', assigned_staff_id: staff.ktv03, status: 'done',
        wage_amount: 250000,
        collect_amount: 0, collect_method: 'none',
        started_at: new Date(Date.now() - 2 * 86400000),
        completed_at: new Date(Date.now() - 1 * 86400000),
        note: 'Khách hứa trả tuần sau',
      });
    }

    // 8) Badges -------------------------------------------------
    log('-- Badges --');
    const badgeSeeds = [
      {
        seed_key: 'badge1',
        customer_id: customers.KH001,
        vehicle_plate: '51A-12345',
        vehicle_type: 'truck_under_3.5t',
        status: 'pending_review',
        fee_amount: 800000,
        creator_type: 'customer', creator_id: customers.KH001,
        note: 'Khách yêu cầu phù hiệu',
      },
      {
        seed_key: 'badge2',
        customer_id: customers.KH002,
        dealer_id: customers.DL001,
        vehicle_plate: '51B-23456',
        vehicle_type: 'passenger',
        status: 'submitted',
        fee_amount: 1200000,
        submitted_at: new Date(Date.now() - 5 * 86400000),
        creator_type: 'dealer', creator_id: customers.DL001,
        note: 'Đã nộp Sở GTVT, chờ kết quả',
      },
      {
        seed_key: 'badge3',
        customer_id: customers.KH003,
        vehicle_plate: '51C-34567',
        vehicle_type: 'truck_over_3.5t',
        status: 'delivered',
        fee_amount: 1500000,
        paid_amount: 1500000,
        submitted_at: new Date(Date.now() - 14 * 86400000),
        result_at: new Date(Date.now() - 7 * 86400000),
        delivered_at: new Date(Date.now() - 3 * 86400000),
        creator_type: 'admin', creator_id: staff.admin,
        note: 'Đã giao tận nơi cho khách',
      },
    ];
    for (const b of badgeSeeds) {
      const tag = `[seed:${b.seed_key}]`;
      const [exist] = await db.query(
        `SELECT id, code FROM badges WHERE note LIKE ? AND is_deleted = 0 LIMIT 1`,
        [`%${tag}%`]
      );
      if (exist.length) {
        log(`  · Badge ${exist[0].code} đã tồn tại (skip)`);
        continue;
      }
      const code = await genCode('PH', 'badges');
      const finalNote = (b.note || '') + (b.note ? '\n' : '') + tag;
      await db.query(
        `INSERT INTO badges (code, customer_id, dealer_id, vehicle_plate, vehicle_type,
                             status, fee_amount, paid_amount,
                             submitted_at, result_at, delivered_at,
                             note, creator_type, creator_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          code, b.customer_id, b.dealer_id || null,
          b.vehicle_plate, b.vehicle_type,
          b.status, b.fee_amount, b.paid_amount || 0,
          b.submitted_at || null, b.result_at || null, b.delivered_at || null,
          finalNote, b.creator_type, b.creator_id,
        ]
      );
      log(`  + Badge ${code} status=${b.status}`);
    }

    log('\n===== DONE =====');
    log('\nTài khoản test:');
    log('  Admin:    username=admin     pwd=admin123');
    log('  KTV:      username=ktv01     pwd=ktv123');
    log('  KTV:      username=ktv02     pwd=ktv123');
    log('  KTV:      username=ktv03     pwd=ktv123');
    log('  Dealer:   code=DL001         pwd=dealer123');
    log('  Dealer:   code=DL002         pwd=dealer123');
    log('  Khách lẻ: phone=0901234567   (KH001 Nguyễn Văn An)');
    log('  Khách lẻ: phone=0912345678   (KH002 Trần Thị Bình)');
    log('  Khách lẻ: phone=0923456789   (KH003 Lê Hoàng Cường)');
    log('  Khách lẻ: phone=0934567890   (KH004 Phạm Thanh Dũng)');
  } catch (err) {
    console.error('[err]', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
