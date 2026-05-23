// BA-style API audit: admin + KTV flow with business assertions.
// Run: node scripts/ba-audit-admin-ktv.js

const BASE = process.env.BASE_URL || 'http://localhost:5179';
const ADMIN = { username: 'admin', password: 'admin123' };
const REQUESTED_KTV = { username: 'ktv002', password: 'ktv002' };
const FALLBACK_KTV = { username: 'ktv02', password: 'ktv02' };

const checks = [];

function addCheck(name, ok, detail) {
  checks.push({ name, ok, detail: detail || '' });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${name}${detail ? ` :: ${detail}` : ''}`);
}

async function api(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body == null || method === 'GET' ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch (_) { data = text; }
  return { status: res.status, ok: res.ok, data };
}

async function loginStaff(creds) {
  return api('POST', '/api/auth/login-staff', creds);
}

function pick(arr, fallback = null) {
  return Array.isArray(arr) && arr.length ? arr[0] : fallback;
}

function findKtvStaff(items, username) {
  return (items || []).find(s => s.username === username) || null;
}

(async () => {
  console.log(`\n[BA AUDIT] target=${BASE}\n`);
  const runTag = `BA-${Date.now()}`;

  // 0) Health
  const health = await api('GET', '/api/health');
  addCheck('Health check', health.ok && health.data && health.data.ok === true,
    `status=${health.status}`);
  if (!health.ok) process.exit(1);

  // 1) Login admin
  const adminLogin = await loginStaff(ADMIN);
  addCheck('Login admin/admin123', adminLogin.ok, `status=${adminLogin.status}`);
  if (!adminLogin.ok) process.exit(1);
  const adminToken = adminLogin.data.token;

  // 2) Login requested KTV credentials
  const requestedKtvLogin = await loginStaff(REQUESTED_KTV);
  addCheck(
    'Login requested KTV ktv002/ktv002',
    requestedKtvLogin.ok,
    requestedKtvLogin.ok ? 'accepted' : `rejected status=${requestedKtvLogin.status}`
  );

  // 3) Determine working KTV account for full flow
  let ktvToken = null;
  let ktvUser = null;
  if (requestedKtvLogin.ok) {
    ktvToken = requestedKtvLogin.data.token;
    ktvUser = requestedKtvLogin.data.user;
  } else {
    const fallbackLogin = await loginStaff(FALLBACK_KTV);
    addCheck(`Fallback login ${FALLBACK_KTV.username}/${FALLBACK_KTV.password}`,
      fallbackLogin.ok, `status=${fallbackLogin.status}`);
    if (!fallbackLogin.ok) process.exit(1);
    ktvToken = fallbackLogin.data.token;
    ktvUser = fallbackLogin.data.user;
  }

  // 4) Load master data as admin
  const staffRes = await api('GET', '/api/admin/staff?role=kithuat&limit=200', null, adminToken);
  const custRes = await api('GET', '/api/admin/customers?type=retail&limit=20', null, adminToken);
  const productRes = await api('GET', '/api/admin/inventory/products/all', null, adminToken);
  const tplRes = await api('GET', '/api/admin/order-templates', null, adminToken);
  addCheck('Load staff/customers/products/templates', staffRes.ok && custRes.ok && productRes.ok && tplRes.ok);
  if (!(staffRes.ok && custRes.ok && productRes.ok && tplRes.ok)) process.exit(1);

  const staffItems = staffRes.data.items || [];
  const ktvStaff = findKtvStaff(staffItems, ktvUser.username);
  const customer = pick(custRes.data.items);
  const product = (productRes.data.items || []).find(p => p.code === 'CAB-OBD') || pick(productRes.data.items);
  const tpl = pick(tplRes.data.items);

  addCheck('Resolve KTV staff record', !!ktvStaff, ktvStaff ? `id=${ktvStaff.id}` : 'not found');
  addCheck('Resolve retail customer', !!customer, customer ? `id=${customer.id}` : 'not found');
  addCheck('Resolve product', !!product, product ? `id=${product.id}/${product.code}` : 'not found');
  addCheck('Resolve order template', !!tpl, tpl ? `id=${tpl.id}/${tpl.name}` : 'not found');
  if (!ktvStaff || !customer || !product || !tpl) process.exit(1);

  // 5) Ensure stock + grant for this KTV
  const importRes = await api('POST', '/api/admin/inventory/receipts', {
    reason_code: 'import_supplier',
    supplier_id: 2,
    items: [{ product_id: product.id, qty: 3, unit_price: product.cost_price || 80000 }],
    reason_text: `BA audit import ${runTag}`,
  }, adminToken);
  addCheck('Admin nhập kho chuẩn bị test', importRes.ok, `status=${importRes.status}`);

  const grantRes = await api('POST', '/api/admin/staff-stock/grant', {
    staff_id: ktvStaff.id,
    items: [{ product_id: product.id, qty: 1 }],
    note: `BA audit grant ${runTag}`,
  }, adminToken);
  addCheck('Admin cấp hàng cho KTV', grantRes.ok, `status=${grantRes.status}`);
  if (!grantRes.ok) process.exit(1);

  // 6) Create order (approved + assigned)
  const unitPrice = 210000;
  const orderCreate = await api('POST', '/api/admin/orders', {
    customer_id: customer.id,
    payment_method: 'cash',
    address: 'BA audit address',
    note: `BA audit order ${runTag}`,
    wage_amount: 123000,
    assigned_staff_id: ktvStaff.id,
    approve: true,
    lines: [{
      template_id: tpl.id,
      items: [{ product_id: product.id, qty: 1, unit_price: unitPrice, vat_percent: 0 }],
      field_values: [{ label: 'Bien so', value: `51A-${String(Date.now()).slice(-5)}` }],
    }],
  }, adminToken);
  addCheck('Admin tạo đơn + gán KTV + duyệt', orderCreate.ok, `status=${orderCreate.status}`);
  if (!orderCreate.ok) process.exit(1);
  const orderId = orderCreate.data.id;
  const orderCode = orderCreate.data.code;

  const adminDetail1 = await api('GET', `/api/admin/orders/${orderId}`, null, adminToken);
  const total1 = Number(adminDetail1.data.total_amount || 0);
  addCheck('Admin xem chi tiết đơn', adminDetail1.ok, `status=${adminDetail1.status}`);
  addCheck('Tổng tiền đơn đúng kỳ vọng', total1 === unitPrice, `total=${total1}, expected=${unitPrice}`);

  // 7) KTV visibility + status transition
  const ktvList = await api('GET', '/api/kithuat/orders?bucket=active', null, ktvToken);
  const inList = (ktvList.data.items || []).some(o => o.id === orderId);
  addCheck('KTV nhìn thấy đơn được gán', ktvList.ok && inList, `visible=${inList}`);

  const transRes = await api('POST', `/api/kithuat/orders/${orderId}/transition`, {
    step_code: 'in_progress',
    progress_note: `start ${runTag}`,
  }, ktvToken);
  addCheck('KTV chuyển trạng thái in_progress', transRes.ok, `status=${transRes.status}`);

  // 8) Photo upload validation
  const badPhoto = await api('POST', `/api/kithuat/orders/${orderId}/photos`, {
    url: 'https://i.ibb.co/abc1234/test-photo.jpg',
    caption: 'missing step code',
  }, ktvToken);
  addCheck('Ảnh thiếu step_code bị chặn', badPhoto.status === 400, `status=${badPhoto.status}`);

  const goodPhoto = await api('POST', `/api/kithuat/orders/${orderId}/photos`, {
    step_code: 'in_progress',
    url: 'https://i.ibb.co/abc1234/test-photo.jpg',
    caption: 'BA upload',
  }, ktvToken);
  addCheck('Ảnh có step_code hợp lệ được nhận', goodPhoto.ok, `status=${goodPhoto.status}`);

  // 9) KTV update field values
  const ktvDetail1 = await api('GET', `/api/kithuat/orders/${orderId}`, null, ktvToken);
  addCheck('KTV xem chi tiết đơn', ktvDetail1.ok, `status=${ktvDetail1.status}`);
  const firstLine = pick(ktvDetail1.data.lines || []);
  const firstFv = firstLine && pick(firstLine.field_values || []);
  let fvUpdated = false;
  if (firstLine && firstFv && firstFv.id) {
    const patchFv = await api('PATCH', `/api/kithuat/orders/${orderId}/field-values`, {
      updates: [{ id: firstFv.id, line_id: firstLine.id, label: firstFv.label, value: `BA-updated-${Date.now()}` }],
    }, ktvToken);
    fvUpdated = patchFv.ok;
  } else if (firstLine) {
    const addFv = await api('POST', `/api/kithuat/orders/${orderId}/field-values`, {
      line_id: firstLine.id, label: 'So may', value: `SM-${Date.now()}`,
    }, ktvToken);
    fvUpdated = addFv.ok;
  }
  addCheck('KTV cập nhật thông số đơn', fvUpdated);

  // 10) Complete with partial payment to create debt
  const expected = unitPrice;
  const toStaff = 70000;
  const toAdmin = 0;
  const debt = expected - toStaff - toAdmin;
  const completeRes = await api('PATCH', `/api/kithuat/orders/${orderId}/complete`, {
    expected_amount: expected,
    to_staff_amount: toStaff,
    to_staff_method: 'cash',
    to_admin_amount: toAdmin,
    debt_amount: debt,
    note: `BA complete ${runTag}`,
  }, ktvToken);
  addCheck('KTV hoàn thành đơn', completeRes.ok, `status=${completeRes.status}`);

  const adminDetail2 = await api('GET', `/api/admin/orders/${orderId}`, null, adminToken);
  const paid2 = Number(adminDetail2.data.paid_amount || 0);
  addCheck('Sau complete: paid_amount đúng', paid2 === toStaff, `paid=${paid2}, expected=${toStaff}`);
  addCheck('Sau complete: status là done', String(adminDetail2.data.status) === 'done', `status=${adminDetail2.data.status}`);

  // 11) Staff debt and settlement
  const debtBefore = await api('GET', `/api/admin/debts/staff/${ktvStaff.id}`, null, adminToken);
  const totalToCollectBefore = Number(debtBefore.data.total_to_collect || 0);
  addCheck('Công nợ KTV phát sinh sau thu hộ', debtBefore.ok && totalToCollectBefore >= toStaff,
    `total_to_collect=${totalToCollectBefore}`);

  const settleRes = await api('POST', `/api/admin/debts/staff/${ktvStaff.id}/settle`, {
    amount_paid: toStaff,
    method: 'cash',
    note: `BA settle ${runTag}`,
  }, adminToken);
  addCheck('Admin tất toán khoản KTV vừa giữ', settleRes.ok, `status=${settleRes.status}`);

  const debtAfter = await api('GET', `/api/admin/debts/staff/${ktvStaff.id}`, null, adminToken);
  const totalToCollectAfter = Number(debtAfter.data.total_to_collect || 0);
  addCheck('Sau tất toán: tổng phải thu KTV giảm', totalToCollectAfter <= Math.max(0, totalToCollectBefore - toStaff),
    `before=${totalToCollectBefore}, after=${totalToCollectAfter}`);

  // 12) Wage visibility
  const wageRes = await api('GET', '/api/kithuat/wages', null, ktvToken);
  const wageRow = (wageRes.data.items || []).find(w => w.id === orderId);
  addCheck('KTV thấy dòng lương của đơn', wageRes.ok && !!wageRow, wageRow ? `wage=${wageRow.wage_amount}` : 'missing');
  addCheck('Lương KTV đúng cấu hình đơn', !!wageRow && Number(wageRow.wage_amount) === 123000,
    wageRow ? `wage=${wageRow.wage_amount}` : 'missing');

  // 13) KTV asset request -> Admin review/apply
  const newSim = `09${String(Date.now()).slice(-8)}`;
  const reqBatch = await api('POST', `/api/kithuat/customers/${customer.id}/asset-requests/batch`, {
    changes: [{ asset_kind: 'sim', action: 'add', value: newSim, note: `BA ${runTag}` }],
    ref_order_id: orderId,
  }, ktvToken);
  addCheck('KTV gửi đề xuất cập nhật thông tin khách', reqBatch.ok, `status=${reqBatch.status}`);

  let assetApplied = false;
  if (reqBatch.ok && reqBatch.data.auto_approved === true) {
    const assets = await api('GET', `/api/admin/customer-assets/${customer.id}`, null, adminToken);
    assetApplied = (assets.data.sims || []).some(s => s.sim_number === newSim);
    addCheck('Auto-approve bật: SIM mới xuất hiện ngay', assetApplied);
  } else {
    const pendingList = await api('GET', `/api/admin/customer-assets/requests/list?status=pending&customer_id=${customer.id}&limit=50`, null, adminToken);
    const reqRow = (pendingList.data.items || []).find(r => r.value === newSim && Number(r.ref_order_id) === Number(orderId));
    addCheck('Admin nhìn thấy request pending từ KTV', pendingList.ok && !!reqRow);
    if (reqRow) {
      const approve = await api('POST', `/api/admin/customer-assets/requests/${reqRow.id}/approve`, { review_note: `ok ${runTag}` }, adminToken);
      addCheck('Admin duyệt request KTV', approve.ok, `status=${approve.status}`);
      const assets2 = await api('GET', `/api/admin/customer-assets/${customer.id}`, null, adminToken);
      assetApplied = (assets2.data.sims || []).some(s => s.sim_number === newSim);
      addCheck('Sau duyệt: SIM mới xuất hiện', assetApplied);
    }
  }

  // 14) Public data leakage check (basic)
  const pubOrder = await api('GET', `/api/public/orders/${encodeURIComponent(orderCode)}`);
  const hasWageLeak = pubOrder.ok && Object.prototype.hasOwnProperty.call(pubOrder.data || {}, 'wage_amount');
  addCheck('Public order không lộ wage_amount', pubOrder.ok && !hasWageLeak, `status=${pubOrder.status}`);

  // Summary
  const failed = checks.filter(c => !c.ok);
  console.log('\n===== BA AUDIT SUMMARY =====');
  console.log(`Total checks: ${checks.length}`);
  console.log(`Pass: ${checks.length - failed.length}`);
  console.log(`Fail: ${failed.length}`);
  if (failed.length) {
    console.log('\nFailed checks:');
    for (const f of failed) console.log(`- ${f.name}${f.detail ? ` :: ${f.detail}` : ''}`);
  }
  process.exit(failed.length ? 1 : 0);
})().catch((err) => {
  console.error('[FATAL]', err.message);
  console.error(err.stack);
  process.exit(1);
});

