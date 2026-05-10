// E2E test - mo phong admin + KTV thao tac qua API that.
// Chay: node scripts/e2e-test.js
// Yeu cau: BE da chay o port 5179, da seed data co ban (admin/ktv01/customer/product).

const BASE = process.env.BASE_URL || 'http://localhost:5179';
const ADMIN_USER = 'admin', ADMIN_PWD = 'admin123';
const KTV_USER   = 'ktv01', KTV_PWD   = 'ktv123';

const errors = [];
let stepNo = 0;

function pad(n) { return String(n).padStart(2, '0'); }
function color(c, s) { const C={r:31,g:32,y:33,b:34,m:35,c:36}; return `\x1b[${C[c]}m${s}\x1b[0m`; }

async function req(method, path, body, token) {
  stepNo++;
  const tag = `#${pad(stepNo)} ${method.padEnd(6)} ${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const opts = { method, headers };
  if (body !== undefined && body !== null && method !== 'GET' && method !== 'HEAD') {
    opts.body = JSON.stringify(body);
  }
  let res, text, json = null;
  try {
    res = await fetch(BASE + path, opts);
    text = await res.text();
    try { json = JSON.parse(text); } catch (_) {}
  } catch (e) {
    console.log(color('r', `${tag}  NETWORK FAIL: ${e.message}`));
    errors.push({ step: stepNo, path, err: e.message });
    return { ok: false, status: 0, body: null };
  }
  const ok = res.status >= 200 && res.status < 300;
  const c = ok ? 'g' : 'r';
  let preview = '';
  if (json) {
    const s = JSON.stringify(json);
    preview = s.length > 200 ? s.slice(0, 197) + '...' : s;
  } else if (text) {
    preview = text.slice(0, 100);
  }
  console.log(color(c, `${tag}  ${res.status}  ${preview}`));
  if (!ok) errors.push({ step: stepNo, method, path, status: res.status, body: json || text });
  return { ok, status: res.status, body: json };
}

function section(label) {
  console.log('\n' + color('c', '===== ' + label + ' ====='));
}

async function login(role, user, pwd) {
  const r = await req('POST', '/api/auth/login-staff', { username: user, password: pwd });
  if (!r.ok) throw new Error(`Login ${role} fail`);
  return r.body.token;
}

(async () => {
  console.log(color('m', `\n[E2E TEST] target=${BASE}\n`));

  // ============================================================
  // STEP 1: LOGIN
  // ============================================================
  section('1) LOGIN admin + KTV01');
  const adminTok = await login('admin', ADMIN_USER, ADMIN_PWD);
  const ktvTok   = await login('ktv',   KTV_USER,   KTV_PWD);

  // ============================================================
  // STEP 2: LAY DATA TAI NGUYEN
  // ============================================================
  section('2) ADMIN: lay danh sach customers, products, staff');
  const customers = (await req('GET', '/api/admin/customers?type=retail&limit=10', null, adminTok)).body;
  const products  = (await req('GET', '/api/admin/inventory/products/all', null, adminTok)).body;
  const staff     = (await req('GET', '/api/admin/staff', null, adminTok)).body;
  const tpls      = (await req('GET', '/api/admin/order-templates', null, adminTok)).body;

  const custList = Array.isArray(customers) ? customers : (customers?.items || customers?.data || []);
  const prodList = Array.isArray(products) ? products : (products?.items || []);
  const staffList = Array.isArray(staff) ? staff : (staff?.items || []);
  const tplList = Array.isArray(tpls) ? tpls : (tpls?.items || []);

  const cust = custList.find(c => c.full_name?.includes('Nguyễn Văn An')) || custList[0];
  const prodCheap = prodList.find(p => p.code === 'CAB-OBD') || prodList.find(p => Number(p.cost_price) < 500000) || prodList[0];
  const ktv01 = staffList.find(s => s.username === 'ktv01');
  const tpl = tplList[0];

  console.log(`  -> cust=${cust?.id}/${cust?.full_name}  prod=${prodCheap?.id}/${prodCheap?.code}  ktv=${ktv01?.id}  tpl=${tpl?.id}/${tpl?.name}`);
  if (!cust || !prodCheap || !ktv01 || !tpl) {
    console.log(color('r', 'Thieu data co ban — dung script.'));
    process.exit(1);
  }

  // ============================================================
  // STEP 3: NHAP KHO san pham (de co ton kho)
  // ============================================================
  section('3) ADMIN: nhap kho 5 cai san pham');
  await req('POST', '/api/admin/inventory/receipts', {
    reason_code: 'import_supplier',
    supplier_id: 2, // Skycool theo seed
    items: [{ product_id: prodCheap.id, qty: 5, unit_price: prodCheap.cost_price || 80000 }],
    reason_text: 'E2E test nhap kho',
  }, adminTok);

  // ============================================================
  // STEP 4: GAN HANG cho KTV01 (staff_holdings)
  // ============================================================
  section('4) ADMIN: gan 2 cai cho KTV01 (pre-stock)');
  await req('POST', '/api/admin/staff-stock/grant', {
    staff_id: ktv01.id,
    items: [{ product_id: prodCheap.id, qty: 2 }],
    note: 'E2E test grant',
  }, adminTok);

  // ============================================================
  // STEP 5: TAO DON HANG (admin tao, gan KTV luon)
  // ============================================================
  section('5) ADMIN: tao don hang lap dat + gan KTV01');
  const orderRes = await req('POST', '/api/admin/orders', {
    customer_id: cust.id,
    payment_method: 'cash',
    address: '123 Test Street, Q.1, TP.HCM',
    note: 'E2E test order',
    wage_amount: 100000,
    assigned_staff_id: ktv01.id,
    approve: true, // -> confirmed luon
    lines: [{
      template_id: tpl.id,
      items: [{
        product_id: prodCheap.id,
        qty: 1,
        unit_price: 200000,
        vat_percent: 0,
      }],
      field_values: [{ label: 'Bien so', value: '51A-99999' }],
    }],
  }, adminTok);

  if (!orderRes.ok) {
    console.log(color('r', '!!! Tao don fail, dung som de xem cause'));
    finish();
    return;
  }
  const orderId = orderRes.body.id;
  const orderCode = orderRes.body.code;
  console.log(`  -> Don ID=${orderId} code=${orderCode}`);

  // ============================================================
  // STEP 6: ADMIN VIEW DON
  // ============================================================
  section('6) ADMIN: xem chi tiet don');
  await req('GET', `/api/admin/orders/${orderId}`, null, adminTok);

  // ============================================================
  // STEP 7: KTV LOGIN, LIST DON DUOC GAN
  // ============================================================
  section('7) KTV: list don');
  const ktvOrders = await req('GET', '/api/kithuat/orders', null, ktvTok);
  const myOrder = (ktvOrders.body?.items || ktvOrders.body || []).find(o => o.id === orderId);
  console.log(`  -> KTV thay don: ${myOrder ? 'YES' : 'NO'}`);

  // ============================================================
  // STEP 8: KTV XEM CHI TIET DON
  // ============================================================
  section('8) KTV: xem chi tiet don');
  await req('GET', `/api/kithuat/orders/${orderId}`, null, ktvTok);

  // ============================================================
  // STEP 9: KTV CHUYEN DON SANG in_progress
  // ============================================================
  section('9) KTV: transition -> in_progress');
  await req('POST', `/api/kithuat/orders/${orderId}/transition`, {
    step_code: 'in_progress',
    progress_note: 'KTV bat dau lap dat',
  }, ktvTok);

  // ============================================================
  // STEP 10: KTV upload anh (mock URL imgbb)
  // ============================================================
  section('10) KTV: upload anh');
  await req('POST', `/api/kithuat/orders/${orderId}/photos`, {
    url: 'https://i.ibb.co/abc1234/test-photo.jpg',
    caption: 'Anh truoc khi lap',
  }, ktvTok);

  // ============================================================
  // STEP 11: KTV HOAN THANH DON (KTV thu cash)
  // ============================================================
  section('11) KTV: complete don (KTV thu cash 200k)');
  await req('PATCH', `/api/kithuat/orders/${orderId}/complete`, {
    to_staff_amount: 200000,
    to_staff_method: 'cash',
    to_admin_amount: 0,
    debt_amount: 0,
    expected_amount: 200000, // wage 100k an khoi bill, total = 200k product
    note: 'KTV thu du cash',
  }, ktvTok);

  // ============================================================
  // STEP 12: ADMIN: xem lai don sau khi done
  // ============================================================
  section('12) ADMIN: xem don sau khi done');
  await req('GET', `/api/admin/orders/${orderId}`, null, adminTok);

  // ============================================================
  // STEP 13: ADMIN: cong no KTV (KTV dang giu tien)
  // ============================================================
  section('13) ADMIN: cong no KTV');
  await req('GET', '/api/admin/debts/staff', null, adminTok);
  await req('GET', `/api/admin/debts/staff/${ktv01.id}`, null, adminTok);

  // ============================================================
  // STEP 14: ADMIN: settle KTV (KTV nop tien lai admin)
  // ============================================================
  section('14) ADMIN: settle 200k tu KTV01');
  await req('POST', `/api/admin/debts/staff/${ktv01.id}/settle`, {
    amount: 200000,
    method: 'cash',
    note: 'KTV nop tien thu ho',
  }, adminTok);

  // ============================================================
  // STEP 15: REPORTS
  // ============================================================
  section('15) ADMIN: bao cao');
  await req('GET', '/api/admin/reports/revenue', null, adminTok);
  await req('GET', '/api/admin/reports/top-products', null, adminTok);
  await req('GET', '/api/admin/reports/orders-by-status', null, adminTok);
  await req('GET', '/api/admin/reports/customer-debts', null, adminTok);
  await req('GET', '/api/admin/reports/staff-debts', null, adminTok);

  // ============================================================
  // STEP 16: STOCKTAKE
  // ============================================================
  section('16) ADMIN: kiem ke');
  const stRes = await req('POST', '/api/admin/inventory/stocktakes', {
    note: 'E2E kiem ke test',
  }, adminTok);
  if (stRes.ok && stRes.body?.id) {
    const stId = stRes.body.id;
    await req('GET', `/api/admin/inventory/stocktakes/${stId}`, null, adminTok);
    await req('PUT', `/api/admin/inventory/stocktakes/${stId}/lines`, {
      lines: [{ product_id: prodCheap.id, counted_qty: 3 }],
    }, adminTok);
    await req('POST', `/api/admin/inventory/stocktakes/${stId}/cancel`, null, adminTok);
  }

  // ============================================================
  // STEP 17: KTV history + wages
  // ============================================================
  section('17) KTV: history + wages');
  await req('GET', '/api/kithuat/history', null, ktvTok);
  await req('GET', '/api/kithuat/wages', null, ktvTok);
  await req('GET', '/api/kithuat/inventory', null, ktvTok);

  // ============================================================
  // STEP 18: KTV chat list
  // ============================================================
  section('18) KTV: conversations');
  await req('GET', '/api/kithuat/conversations', null, ktvTok);

  finish();
})().catch(e => {
  console.log(color('r', '\n[FATAL] ' + e.message));
  console.log(e.stack);
  finish();
});

function finish() {
  console.log('\n' + color('c', '===== KET QUA ====='));
  console.log(`Tong call: ${stepNo}`);
  console.log(`Loi: ${color(errors.length ? 'r' : 'g', errors.length)}`);
  if (errors.length) {
    console.log('\nDanh sach loi:');
    for (const e of errors) {
      console.log(color('r', `  #${pad(e.step)} ${e.method} ${e.path} -> ${e.status}`));
      console.log('     ' + JSON.stringify(e.body).slice(0, 300));
    }
  }
  process.exit(errors.length ? 1 : 0);
}
