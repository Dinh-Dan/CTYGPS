// Helper checklist mac dinh cho don theo loai cong viec.
// Goi tu admin/orders.js#assign-staff sau khi gan KTV.

const KINDS = ['install', 'maintenance', 'renew', 'uninstall'];

function defaultChecklist(kind) {
  if (kind === 'install') {
    return [
      'Kiem tra thiet bi truoc khi lap',
      'Cap tai khoan / username cho khach',
      'Lap dat thiet bi len xe',
      'Test tin hieu GPS truc tiep',
      'Huong dan khach su dung app',
      'Chup anh thiet bi sau khi lap',
    ];
  }
  if (kind === 'maintenance') {
    return ['Kiem tra trang thai thiet bi', 'Khac phuc loi neu co', 'Bao cao tinh trang'];
  }
  if (kind === 'renew') {
    return ['Gia han goi cuoc', 'Xac nhan voi khach', 'Cap nhat thoi han trong he thong'];
  }
  if (kind === 'uninstall') {
    return ['Thao thiet bi', 'Tra ve kho', 'Dong tai khoan khach'];
  }
  return [];
}

// Insert default (hoac custom) checklist cho 1 don.
// Caller chiu trach nhiem transaction.
async function seedChecklistForOrder(conn, orderId, kind, custom) {
  const list = Array.isArray(custom) && custom.length ? custom : defaultChecklist(kind);
  for (let i = 0; i < list.length; i++) {
    const step = String(list[i]).trim();
    if (!step) continue;
    await conn.query(
      `INSERT INTO order_checklist (order_id, step, sort_order) VALUES (?, ?, ?)`,
      [orderId, step, i]
    );
  }
}

module.exports = { KINDS, defaultChecklist, seedChecklistForOrder };
