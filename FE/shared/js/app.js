// ================== SHARED DATA ==================
const PRODUCTS = [
  {id:'VT01', name:'Định vị xe máy VT-01', cat:'Định vị', price:990000, cost:650000, warranty:'12 tháng', stock:142, icon:'🛵',
   desc:'Thiết bị định vị nhỏ gọn, chống nước IP67, pin dự phòng 24h, tương thích app Fast Track GPS.',
   specs:['GPS/GSM 2G','Pin 800mAh','IP67','App iOS/Android','Chống trộm'],
   priceTiers:[
     {label:'Giá bán lẻ',     price:990000},
     {label:'Khách sỉ',       price:850000},
     {label:'Sỉ số lượng lớn',price:780000}
   ]},
  {id:'VT02', name:'Định vị ô tô VT-02 Pro', cat:'Định vị', price:1490000, cost:1050000, warranty:'24 tháng', stock:88, icon:'🚗',
   desc:'Giải pháp định vị ô tô tiêu chuẩn, hỗ trợ theo dõi hành trình 90 ngày, cảnh báo tốc độ.',
   specs:['GPS 4G','Cảnh báo tốc độ','Lịch sử 90 ngày','Ngắt nhiên liệu','Bảo hành 24T'],
   priceTiers:[
     {label:'Giá bán lẻ',     price:1490000},
     {label:'Khách sỉ',       price:1290000},
     {label:'Sỉ số lượng lớn',price:1150000},
     {label:'Đại lý',         price:1050000}
   ]},
  {id:'HD10', name:'Hộp đen Camera HD-10', cat:'Hộp đen', price:3290000, cost:2400000, warranty:'24 tháng', stock:45, icon:'📹',
   desc:'Hộp đen tích hợp camera hành trình 2 kênh trước/sau, lưu trữ thẻ nhớ 128GB.',
   specs:['2 kênh FullHD','Thẻ 128GB','Wifi + 4G','Nghị định 10','App xem online'],
   priceTiers:[
     {label:'Giá bán lẻ', price:3290000},
     {label:'Khách sỉ',   price:2900000},
     {label:'Đại lý',     price:2650000}
   ]},
  {id:'HD20', name:'Hộp đen xe tải HD-20', cat:'Hộp đen', price:4590000, cost:3500000, warranty:'24 tháng', stock:23, icon:'🚚',
   desc:'Chuyên dụng cho xe tải, xe khách, đạt chuẩn Nghị định 10 & QCVN 31.',
   specs:['Chuẩn QCVN 31','4 kênh camera','Cảm biến nhiên liệu','In lái','Hợp chuẩn'],
   priceTiers:[
     {label:'Giá bán lẻ', price:4590000},
     {label:'Khách sỉ',   price:4100000},
     {label:'Đại lý',     price:3800000}
   ]},
  {id:'CAM5', name:'Camera hành trình CM-5', cat:'Camera', price:2190000, cost:1600000, warranty:'12 tháng', stock:67, icon:'📸',
   desc:'Camera hành trình 4K, màn hình cảm ứng 3 inch, cảnh báo lệch làn.',
   specs:['4K UHD','Cảm ứng 3"','ADAS','Wifi','GPS'],
   priceTiers:[
     {label:'Giá bán lẻ', price:2190000},
     {label:'Khách sỉ',   price:1950000},
     {label:'Đại lý',     price:1750000}
   ]},
  {id:'ACC01', name:'Phụ kiện – Anten GPS ngoại', cat:'Phụ kiện', price:180000, cost:90000, warranty:'6 tháng', stock:300, icon:'📡',
   desc:'Anten GPS ngoại trợ giúp tăng độ nhạy cho thiết bị định vị.',
   specs:['Cable 3m','IP65','Tương thích mọi VT-*'],
   priceTiers:[
     {label:'Giá bán lẻ',     price:180000},
     {label:'Khách sỉ',       price:140000},
     {label:'Sỉ số lượng lớn',price:110000}
   ]}
];

const ORDERS = [
  {id:'DH-2025-0421', date:'2025-04-21', customer:'Nguyễn Văn An', phone:'0901234567', plate:'51H-123.45',
   type:'Lắp mới', productId:'VT02', product:'VT-02 Pro', qty:1, price:1490000, tax:'8%', total:1609200,
   payment:'Tiền mặt', status:'Đã hoàn thành', tech:'Trần Minh', address:'Q.1, TPHCM'},
  {id:'DH-2025-0420', date:'2025-04-22', customer:'Công ty Vận tải Phú Long', phone:'0283901234', plate:'50F-789.12',
   type:'Lắp mới', productId:'HD20', product:'HD-20', qty:3, price:4590000, tax:'10%', total:15147000,
   payment:'Chuyển khoản', status:'Đang lắp', tech:'Lê Hoàng', address:'Q.7, TPHCM'},
  {id:'DH-2025-0419', date:'2025-04-22', customer:'Phạm Thu Hà', phone:'0912345678', plate:'59A-456.78',
   type:'Gia hạn', productId:'VT01', product:'VT-01', qty:1, price:200000, tax:'KCT', total:200000,
   payment:'Chuyển khoản', status:'Đã hoàn thành', tech:'-', address:'Q.Bình Thạnh'},
  {id:'DH-2025-0418', date:'2025-04-23', customer:'Đại lý GPS Cần Thơ', phone:'0939111222', plate:'-',
   type:'Đại lý – Lấy hàng', productId:'VT02', product:'VT-02 Pro × 10', qty:10, price:1490000, tax:'10%', total:16390000,
   payment:'Nợ (30 ngày)', status:'Đã giao', tech:'-', address:'Ninh Kiều, Cần Thơ'},
  {id:'DH-2025-0417', date:'2025-04-23', customer:'Võ Minh Hoàng', phone:'0938777999', plate:'51K-222.33',
   type:'Sửa chữa', productId:'HD10', product:'HD-10', qty:1, price:350000, tax:'KCT', total:350000,
   payment:'Tiền mặt', status:'Chờ xử lý', tech:'Chưa gán', address:'Q.10, TPHCM'},
  {id:'DH-2025-0416', date:'2025-04-20', customer:'Trần Quang Huy', phone:'0981234567', plate:'61A-123.00',
   type:'Bảo hành', productId:'VT02', product:'VT-02 Pro', qty:1, price:0, tax:'KCT', total:0,
   payment:'-', status:'Đã hoàn thành', tech:'Trần Minh', address:'Bình Dương'},
  {id:'DH-2025-0423', date:'2025-04-24', customer:'Lê Thị Mai', phone:'0905112233', plate:'59C-888.99',
   type:'Lắp mới', productId:'VT02', product:'VT-02 Pro', qty:1, price:1490000, tax:'8%', total:1609200,
   payment:'Tiền mặt', status:'Chờ xuất kho', tech:'Chưa gán', address:'Q.Tân Bình, TPHCM'},
  {id:'DH-2025-0424', date:'2025-04-24', customer:'Đại lý Miền Tây', phone:'0946555777', plate:'-',
   type:'Đại lý – Lấy hàng', productId:'HD10', product:'HD-10 × 5', qty:5, price:2900000, tax:'10%', total:15950000,
   payment:'Nợ (30 ngày)', status:'Chờ xuất kho', tech:'-', address:'Vĩnh Long'},
  {id:'DH-2025-0425', date:'2025-04-24', customer:'Công ty Taxi Mai Linh', phone:'0283123456', plate:'-',
   type:'Lắp mới', productId:'VT01', product:'VT-01 × 4', qty:4, price:990000, tax:'8%', total:4276800,
   payment:'Chuyển khoản', status:'Chờ xuất kho', tech:'Trần Minh', address:'Q.3, TPHCM'}
];

// Lịch sử xuất/nhập kho
const WAREHOUSE_LOG = [
  {time:'2025-04-22 09:15', kind:'out', productId:'HD20', qty:3, orderId:'DH-2025-0420', reason:'Lắp mới – Cty Phú Long', user:'Đỗ Quyên Quỳnh'},
  {time:'2025-04-23 14:30', kind:'out', productId:'VT02', qty:10, orderId:'DH-2025-0418', reason:'Đại lý – GPS Cần Thơ', user:'Đỗ Quyên Quỳnh'},
  {time:'2025-04-20 08:00', kind:'in',  productId:'VT02', qty:50, orderId:'-',            reason:'Nhập hàng từ NCC An Khang', user:'Đỗ Quyên Quỳnh'}
];

const CUSTOMERS = [
  {code:'KH001', name:'Nguyễn Văn An', phone:'0901234567', type:'Khách lẻ', orders:3, debt:0, last:'2025-04-21'},
  {code:'KH002', name:'Phạm Thu Hà', phone:'0912345678', type:'Khách lẻ', orders:2, debt:0, last:'2025-04-22'},
  {code:'DL01',  name:'Đại lý GPS Cần Thơ', phone:'0939111222', type:'Đại lý', orders:18, debt:16390000, last:'2025-04-23'},
  {code:'DL02',  name:'Đại lý Miền Tây', phone:'0946555777', type:'Đại lý', orders:24, debt:4200000, last:'2025-04-18'},
  {code:'KH003', name:'Công ty Vận tải Phú Long', phone:'0283901234', type:'Doanh nghiệp', orders:6, debt:0, last:'2025-04-22'},
  {code:'KH004', name:'Võ Minh Hoàng', phone:'0938777999', type:'Khách lẻ', orders:1, debt:350000, last:'2025-04-23'}
];

const DEALERS = [
  {id:'DL01', name:'Đại lý GPS Cần Thơ', contact:'Nguyễn Thanh Phong', phone:'0939111222',
   addr:'45 Mậu Thân, Ninh Kiều, Cần Thơ', since:'2023-01-12',
   discount:15, creditLimit:50000000,
   bank:'Vietcombank · 0123 456 789 · NGUYEN THANH PHONG',
   topProducts:['VT-02 Pro','HD-10'],
   orders:[
     {id:'DH-2025-0426', date:'2025-04-25', productId:'ACC01', qty:30,
      unitPrice:110000, total:3300000, tax:0, grand:3300000,
      status:'new', tech:null, delivered:null, paidId:null, term:30},
     {id:'DH-2025-0425', date:'2025-04-25', productId:'VT02', qty:5,
      unitPrice:1150000, total:5750000, tax:575000, grand:6325000,
      status:'shipping', tech:'Trần Minh', delivered:null, paidId:null, term:30},
     {id:'DH-2025-0418', date:'2025-04-23', productId:'VT02', qty:10,
      unitPrice:1150000, total:11500000, tax:1150000, grand:12650000,
      status:'delivered', tech:'Lê Hoàng', delivered:'2025-04-24', paidId:null, term:30},
     {id:'DH-2025-0401', date:'2025-04-18', productId:'HD10', qty:3,
      unitPrice:2650000, total:7950000, tax:795000, grand:8745000,
      status:'paid', tech:'Trần Minh', delivered:'2025-04-19', paidId:'TT-2025-004', term:0},
     {id:'DH-2025-0385', date:'2025-04-10', productId:'VT01', qty:15,
      unitPrice:780000, total:11700000, tax:1170000, grand:12870000,
      status:'paid', tech:'Phạm Đức', delivered:'2025-04-11', paidId:'TT-2025-003', term:0},
     {id:'DH-2025-0371', date:'2025-04-03', productId:'ACC01', qty:40,
      unitPrice:110000, total:4400000, tax:0, grand:4400000,
      status:'paid', tech:'Lê Hoàng', delivered:'2025-04-04', paidId:'TT-2025-002', term:0}
   ],
   payments:[
     {id:'TT-2025-004', date:'2025-04-20', amount:8745000, method:'Chuyển khoản',
      bill:'VCB_20250420_001.jpg', covers:['DH-2025-0401'], note:'Thanh toán đơn 18/4'},
     {id:'TT-2025-003', date:'2025-04-13', amount:12870000, method:'Chuyển khoản',
      bill:'VCB_20250413_001.jpg', covers:['DH-2025-0385'], note:''},
     {id:'TT-2025-002', date:'2025-04-05', amount:4400000, method:'Tiền mặt',
      bill:'', covers:['DH-2025-0371'], note:'Thu tại đại lý'}
   ]},

  {id:'DL02', name:'Đại lý Miền Tây', contact:'Lê Thị Bích', phone:'0946555777',
   addr:'78 Hai Bà Trưng, Long Xuyên, An Giang', since:'2022-09-05',
   discount:15, creditLimit:50000000,
   bank:'ACB · 9988 7766 5544 · LE THI BICH',
   topProducts:['VT-01','CAM5'],
   orders:[
     {id:'DH-2025-0412', date:'2025-04-18', productId:'VT01', qty:20,
      unitPrice:780000, total:15600000, tax:1560000, grand:17160000,
      status:'paid', tech:'Phạm Đức', delivered:'2025-04-19', paidId:'TT-2025-005', term:0},
     {id:'DH-2025-0402', date:'2025-04-14', productId:'CAM5', qty:2,
      unitPrice:1950000, total:3900000, tax:390000, grand:4290000,
      status:'delivered', tech:'Trần Minh', delivered:'2025-04-15', paidId:null, term:15},
     {id:'DH-2025-0391', date:'2025-04-09', productId:'HD10', qty:4,
      unitPrice:2900000, total:11600000, tax:1160000, grand:12760000,
      status:'paid', tech:'Lê Hoàng', delivered:'2025-04-10', paidId:'TT-2025-006', term:0}
   ],
   payments:[
     {id:'TT-2025-005', date:'2025-04-20', amount:17160000, method:'Chuyển khoản',
      bill:'ACB_20250420.jpg', covers:['DH-2025-0412'], note:''},
     {id:'TT-2025-006', date:'2025-04-12', amount:12760000, method:'Chuyển khoản',
      bill:'ACB_20250412.jpg', covers:['DH-2025-0391'], note:''}
   ]},

  {id:'DL03', name:'Đại lý Biên Hoà', contact:'Trần Quốc Bảo', phone:'0908333111',
   addr:'12 Nguyễn Ái Quốc, Biên Hoà, Đồng Nai', since:'2023-03-20',
   discount:12, creditLimit:30000000,
   bank:'BIDV · 3344 5566 · TRAN QUOC BAO',
   topProducts:['HD-20','VT-02 Pro'],
   orders:[
     {id:'DH-2025-0410', date:'2025-04-17', productId:'HD20', qty:4,
      unitPrice:3800000, total:15200000, tax:1520000, grand:16720000,
      status:'paid', tech:'Lê Hoàng', delivered:'2025-04-18', paidId:'TT-2025-007', term:0},
     {id:'DH-2025-0388', date:'2025-04-08', productId:'VT02', qty:8,
      unitPrice:1050000, total:8400000, tax:840000, grand:9240000,
      status:'paid', tech:'Trần Minh', delivered:'2025-04-09', paidId:'TT-2025-008', term:0}
   ],
   payments:[
     {id:'TT-2025-007', date:'2025-04-18', amount:16720000, method:'Chuyển khoản',
      bill:'BIDV_20250418.jpg', covers:['DH-2025-0410'], note:''},
     {id:'TT-2025-008', date:'2025-04-10', amount:9240000, method:'Chuyển khoản',
      bill:'BIDV_20250410.jpg', covers:['DH-2025-0388'], note:''}
   ]},

  {id:'DL04', name:'Đại lý Bình Dương', contact:'Phạm Ngọc Hải', phone:'0919888777',
   addr:'55 Đại lộ Bình Dương, TDM, Bình Dương', since:'2024-08-14',
   discount:10, creditLimit:20000000,
   bank:'Techcombank · 7788 9900 · PHAM NGOC HAI',
   topProducts:['VT-01','ACC01'],
   orders:[
     {id:'DH-2025-0406', date:'2025-04-16', productId:'VT01', qty:12,
      unitPrice:850000, total:10200000, tax:1020000, grand:11220000,
      status:'delivered', tech:'Trần Minh', delivered:'2025-04-17', paidId:null, term:30},
     {id:'DH-2025-0372', date:'2025-04-03', productId:'ACC01', qty:25,
      unitPrice:140000, total:3500000, tax:0, grand:3500000,
      status:'paid', tech:'Phạm Đức', delivered:'2025-04-04', paidId:'TT-2025-001', term:0}
   ],
   payments:[
     {id:'TT-2025-001', date:'2025-04-04', amount:3500000, method:'Tiền mặt',
      bill:'', covers:['DH-2025-0372'], note:'Thu tại đại lý'}
   ]}
];

// Compute outstanding debt for a dealer (delivered but unpaid orders)
function dealerDebt(d){
  return (d.orders||[]).filter(o=>o.status==='delivered')
                       .reduce((s,o)=>s+o.grand,0);
}
function dealerRevenue(d){
  return (d.orders||[]).filter(o=>o.status!=='new')
                       .reduce((s,o)=>s+o.grand,0);
}
function dealerQty(d){
  return (d.orders||[]).reduce((s,o)=>s+o.qty,0);
}

const TECHS = [
  {code:'KT01', name:'Trần Minh', phone:'0911222333', active:6, done:128, area:'Q.1, Q.3, Bình Thạnh'},
  {code:'KT02', name:'Lê Hoàng', phone:'0922333444', active:4, done:95, area:'Q.7, Nhà Bè, Q.4'},
  {code:'KT03', name:'Phạm Đức', phone:'0933444555', active:3, done:72, area:'Thủ Đức, Q.9'}
];

const TECH_TASKS = [
  {id:'CV-231', order:'DH-2025-0420', type:'Lắp mới', product:'HD-20 × 3', customer:'Cty Phú Long',
   phone:'0283901234', address:'123 Nguyễn Văn Linh, Q.7', plate:'50F-789.12',
   due:'2025-04-23 14:00', status:'Đang làm', collect:15147000, collectType:'Chuyển khoản'},
  {id:'CV-232', order:'DH-2025-0417', type:'Sửa chữa', product:'HD-10', customer:'Võ Minh Hoàng',
   phone:'0938777999', address:'45 Sư Vạn Hạnh, Q.10', plate:'51K-222.33',
   due:'2025-04-24 09:00', status:'Mới giao', collect:350000, collectType:'Tiền mặt'},
  {id:'CV-230', order:'DH-2025-0421', type:'Lắp mới', product:'VT-02 Pro', customer:'Nguyễn Văn An',
   phone:'0901234567', address:'78 Lê Lợi, Q.1', plate:'51H-123.45',
   due:'2025-04-21 10:00', status:'Hoàn thành', collect:1609200, collectType:'Tiền mặt'}
];

// ================== HELPERS ==================
const fmtVND = n => (n||0).toLocaleString('vi-VN') + '₫';
const fmtDate = d => new Date(d).toLocaleDateString('vi-VN');

function onReady(fn){
  if(document.readyState!=='loading') fn();
  else document.addEventListener('DOMContentLoaded',fn);
}

// ================== CHAT WIDGET ==================
function installChat(){
  if(document.getElementById('chat-fab')) return;
  const fab = document.createElement('button');
  fab.id='chat-fab'; fab.className='chat-fab'; fab.title='Chat hỗ trợ'; fab.innerHTML='💬';
  const box = document.createElement('div');
  box.id='chat-box'; box.className='chat-box';
  box.innerHTML = `
    <div class="chat-head">
      <div>🟢 Hỗ trợ VinaGPS</div>
      <span class="close" id="chat-close">×</span>
    </div>
    <div class="chat-msgs" id="chat-msgs">
      <div class="msg them">Chào bạn 👋 Bạn cần hỗ trợ về <b>mua mới</b>, <b>gia hạn</b>, <b>bảo hành</b> hay <b>sửa chữa</b>? <span class="time">Vừa xong</span></div>
    </div>
    <div class="chat-quick">
      <button data-q="Tôi muốn gia hạn gói">Gia hạn gói</button>
      <button data-q="Báo giá lắp mới">Báo giá lắp mới</button>
      <button data-q="Kiểm tra bảo hành">Tra bảo hành</button>
      <button data-q="Thiết bị mất kết nối">Mất kết nối</button>
    </div>
    <div class="chat-input">
      <input id="chat-txt" placeholder="Nhập tin nhắn..." />
      <button id="chat-send">Gửi</button>
    </div>`;
  document.body.appendChild(fab);
  document.body.appendChild(box);

  const msgs = box.querySelector('#chat-msgs');
  const txt = box.querySelector('#chat-txt');

  fab.onclick = () => box.classList.toggle('open');
  box.querySelector('#chat-close').onclick = () => box.classList.remove('open');

  const now = () => new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});

  function addMsg(text,who){
    const d = document.createElement('div');
    d.className = 'msg ' + who;
    d.innerHTML = text + `<span class="time">${now()}</span>`;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function reply(q){
    const s = q.toLowerCase();
    setTimeout(()=>{
      if(s.includes('gia hạn'))
        addMsg('Phí gia hạn: <b>200.000₫/năm</b> (xe máy), <b>300.000₫/năm</b> (ô tô). Vui lòng vào <a href="order.html">Đặt dịch vụ → Gia hạn</a> hoặc cho mình xin <b>biển số</b> để tra nhé!','them');
      else if(s.includes('báo giá')||s.includes('bao gia')||s.includes('lắp mới'))
        addMsg('Xem bảng giá đầy đủ tại <a href="products.html">trang sản phẩm</a>. Nhà bạn ở đâu để mình báo công lắp & cử kỹ thuật gần nhất nhé!','them');
      else if(s.includes('bảo hành')||s.includes('hư')||s.includes('mất kết nối'))
        addMsg('Bạn vào <a href="order.html">tạo đơn yêu cầu</a> nhập biển số hoặc mã thiết bị để kiểm tra, hoặc cho mình xin biển số xe nhé.','them');
      else
        addMsg('Mình đã ghi nhận. Nhân viên sẽ phản hồi trong ít phút. Trong lúc đợi bạn có thể xem <a href="guide.html">hướng dẫn sử dụng</a> nhé 🙂','them');
    }, 600);
  }

  function send(){
    const v = txt.value.trim(); if(!v) return;
    addMsg(v,'me'); txt.value=''; reply(v);
  }
  box.querySelector('#chat-send').onclick = send;
  txt.addEventListener('keydown',e=>{ if(e.key==='Enter') send(); });
  box.querySelectorAll('.chat-quick button').forEach(b=>{
    b.onclick = () => { const q = b.dataset.q; addMsg(q,'me'); reply(q); };
  });
}

// ================== MODAL ==================
function openModal(title, body, actions){
  let mb = document.getElementById('modal-bg');
  if(!mb){
    mb = document.createElement('div'); mb.id='modal-bg'; mb.className='modal-bg';
    mb.innerHTML = `<div class="modal">
      <div class="modal-head"><h3 id="m-title"></h3><button type="button" class="modal-close" id="m-close" aria-label="Đóng">×</button></div>
      <div class="modal-body" id="m-body"></div>
      <div class="modal-foot" id="m-actions"></div>
    </div>`;
    document.body.appendChild(mb);
    mb.addEventListener('click', e=>{ if(e.target===mb) mb.classList.remove('open'); });
    mb.querySelector('#m-close').onclick = () => mb.classList.remove('open');
  }
  mb.querySelector('#m-title').textContent = title;
  mb.querySelector('#m-body').innerHTML = body;
  const a = mb.querySelector('#m-actions'); a.innerHTML = '';
  (actions||[{label:'Đóng',cls:'btn ghost',fn:()=>mb.classList.remove('open')}]).forEach(btn=>{
    const b = document.createElement('button'); b.className = btn.cls||'btn'; b.textContent = btn.label;
    b.onclick = () => { if(btn.fn) btn.fn(); else mb.classList.remove('open'); };
    a.appendChild(b);
  });
  mb.classList.add('open');
}

// ================== TOAST ==================
function toast(msg, type='success'){
  let t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = `position:fixed;top:20px;right:20px;background:${type==='success'?'#16a34a':'#dc2626'};color:#fff;padding:12px 18px;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.2);z-index:300;font-weight:600;font-size:14px`;
  document.body.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transition='.3s';},2500);
  setTimeout(()=>t.remove(),3000);
}

// ================== DỊCH VỤ PHÙ HIỆU XE ==================
// Phù hiệu vận tải theo Nghị định 10/2020/NĐ-CP
const BADGE_TYPES = [
  {id:'truck-small', name:'Phù hiệu xe tải (dưới 3.5 tấn)',  price:800000,  days:5,  color:'#0284c7'},
  {id:'truck-big',   name:'Phù hiệu xe tải (trên 3.5 tấn)',  price:900000,  days:7,  color:'#0369a1'},
  {id:'contract',    name:'Phù hiệu xe hợp đồng',             price:900000,  days:7,  color:'#7c3aed'},
  {id:'tour',        name:'Phù hiệu xe du lịch',              price:1200000, days:10, color:'#c026d3'},
  {id:'bus',         name:'Phù hiệu xe khách tuyến cố định',  price:1200000, days:10, color:'#d97706'},
  {id:'container',   name:'Phù hiệu xe container / đầu kéo',  price:1500000, days:10, color:'#b91c1c'},
  {id:'taxi',        name:'Phù hiệu xe taxi',                 price:1000000, days:7,  color:'#f59e0b'},
  {id:'renew',       name:'Gia hạn phù hiệu (mọi loại)',      price:500000,  days:3,  color:'#16a34a'}
];

// Workflow: received → reviewing → submitted → approved → ready → delivered
const BADGE_STATUS = {
  received:  {label:'Mới tiếp nhận',      pill:'gray',  step:1},
  reviewing: {label:'Kiểm tra hồ sơ',     pill:'amber', step:2},
  submitted: {label:'Đã nộp sở GTVT',     pill:'blue',  step:3},
  approved:  {label:'Sở đã duyệt',        pill:'blue',  step:4},
  ready:     {label:'Có phù hiệu – chờ giao', pill:'amber', step:5},
  delivered: {label:'Đã giao khách',      pill:'green', step:6},
  rejected:  {label:'Bị từ chối',         pill:'red',   step:0}
};

const BADGES = [
  {id:'PH-2025-0013', date:'2025-04-25', customer:'Lê Văn Bình', phone:'0932555666',
   addr:'Thủ Đức, TPHCM', plates:['51C-999.88'], ownerCccd:'079555666777',
   badgeTypeId:'truck-small', vehicles:1, price:800000, paid:false,
   status:'reviewing', submittedDate:null, expectedDate:null,
   docs:{regCert:true, bizLicense:false, gpsCert:true, cccd:true},
   notes:'KH thiếu giấy phép KD vận tải, đã nhắc bổ sung'},
  {id:'PH-2025-0012', date:'2025-04-22', customer:'Công ty Vận tải Phú Long', phone:'0283901234',
   addr:'123 Nguyễn Văn Linh, Q.7, TPHCM', plates:['50F-789.12','50F-789.13','50F-789.14'],
   ownerCccd:'0316123456', badgeTypeId:'truck-big', vehicles:3, price:2700000, paid:true,
   status:'submitted', submittedDate:'2025-04-24', expectedDate:'2025-05-01',
   docs:{regCert:true, bizLicense:true, gpsCert:true, cccd:true},
   notes:''},
  {id:'PH-2025-0011', date:'2025-04-18', customer:'Công ty Taxi Mai Linh', phone:'0283123456',
   addr:'Q.3, TPHCM', plates:['51A-111.22','51A-111.23','51A-111.24','51A-111.25'],
   ownerCccd:'0312345678', badgeTypeId:'contract', vehicles:4, price:3600000, paid:true,
   status:'approved', submittedDate:'2025-04-19', expectedDate:'2025-04-26',
   docs:{regCert:true, bizLicense:true, gpsCert:true, cccd:true},
   notes:'Đã có kết quả, đang chờ đóng dấu'},
  {id:'PH-2025-0010', date:'2025-04-10', customer:'Nguyễn Văn An', phone:'0901234567',
   addr:'Q.1, TPHCM', plates:['51H-123.45'], ownerCccd:'079111222333',
   badgeTypeId:'truck-small', vehicles:1, price:800000, paid:true,
   status:'delivered', submittedDate:'2025-04-11', expectedDate:'2025-04-16',
   deliveredDate:'2025-04-16',
   docs:{regCert:true, bizLicense:true, gpsCert:true, cccd:true},
   notes:''},
  {id:'PH-2025-0009', date:'2025-04-05', customer:'HTX Vận tải Tân Tiến', phone:'0911223344',
   addr:'Bình Dương', plates:['61C-456.78','61C-456.79'],
   ownerCccd:'0320987654', badgeTypeId:'renew', vehicles:2, price:1000000, paid:true,
   status:'delivered', submittedDate:'2025-04-06', expectedDate:'2025-04-09',
   deliveredDate:'2025-04-09',
   docs:{regCert:true, bizLicense:true, gpsCert:true, cccd:true},
   notes:'Khách cũ - gia hạn'}
];

function badgeType(id){ return BADGE_TYPES.find(t=>t.id===id); }

// ================== GIÁ GIA HẠN (theo sản phẩm / năm) ==================
// TODO: sau này thay bằng API từ nhà cung cấp
const RENEWAL_PRICES = {
  VT01: 150000,   // Định vị xe máy
  VT02: 200000,   // Định vị ô tô
  HD10: 300000,   // Hộp đen HD-10
  HD20: 350000,   // Hộp đen xe tải
  CAM5: 250000    // Camera hành trình
};
function renewalPrice(productId, years){
  const y = Math.max(1, +years||1);
  const base = RENEWAL_PRICES[productId] || 0;
  // Chiết khấu nhẹ nếu đóng nhiều năm
  const disc = y>=3 ? 0.8 : y===2 ? 0.9 : 1;
  return Math.round(base * y * disc);
}

// ================== LOẠI ĐƠN CHỜ BÁO GIÁ ==================
// Các loại đơn này KHÔNG có giá khi tiếp nhận – kỹ thuật đến khảo sát rồi báo giá
const QUOTE_NEEDED_TYPES = ['Sửa chữa','Bảo hành','Phù hiệu xe'];
function needsQuote(type){ return QUOTE_NEEDED_TYPES.includes(type); }

// ================== ĐĂNG NHẬP ==================
// Quy tắc tài khoản cho demo:
//   - Khách (lẻ / DN):  username = SĐT,  password = biển số xe (không dấu, không khoảng trắng)
//   - Đại lý:            username = mã ĐL, password = field `password` (mặc định = SĐT nếu chưa đặt)
function normalizePlate(p){ return (p||'').toUpperCase().replace(/[\s\.\-]/g,''); }
function customerPassword(c){ return normalizePlate(c.plate); }
function dealerPassword(d){ return d.password || d.phone; }

function loginCustomer(phone, plate){
  const c = CUSTOMERS.find(x=>x.phone===phone);
  if(!c) return null;
  return normalizePlate(plate)===normalizePlate(c.plate) ? c : null;
}
function loginDealer(id, pw){
  const d = DEALERS.find(x=>x.id.toUpperCase()===(id||'').toUpperCase());
  if(!d) return null;
  return pw===dealerPassword(d) ? d : null;
}

// ================== AUTO CHAT (DEPRECATED) ==================
// Chatbot demo cu (canned replies, khong goi BE, khong can login).
// Da thay bang widget thuc trong /shared/js/chat-with-admin.js
// (auto-mount FAB + form dang ky guest + chat realtime voi admin).
// KHONG goi installChat() nua de tranh xung dot 2 nut FAB.
