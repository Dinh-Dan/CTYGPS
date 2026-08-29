// ============================================================
// Backup database tich hop thang vao backend - KHONG cai them gi.
//   - Dump DB bang mysqldump (co san trong XAMPP)
//   - Nen .sql.gz bang zlib (built-in cua Node)
//   - Gui file ra ngoai VPS qua Telegram Bot (chi dung https built-in)
//   - Tu xoa ban cu o local
//
// Bat/tat va cau hinh hoan toan qua file .env (xem .env.example).
// Mac dinh TAT (BACKUP_ENABLED=false) de an toan.
// ============================================================

const fs = require('fs');
const path = require('path');
const os = require('os');
const zlib = require('zlib');
const https = require('https');
const { spawn } = require('child_process');

// Phat hien OS de chon duong dan mac dinh phu hop
const isWindows = os.platform() === 'win32';
const DEFAULT_BACKUP_DIR = isWindows ? path.join('C:', 'db-backups') : '/var/db-backups';
const DEFAULT_MYSQLDUMP = isWindows ? 'C:\\xampp\\mysql\\bin\\mysqldump.exe' : '/usr/bin/mysqldump';

const cfg = {
  enabled: String(process.env.BACKUP_ENABLED || 'false').toLowerCase() === 'true',
  intervalHours: Number(process.env.BACKUP_INTERVAL_HOURS) || 24,
  intervalMinutes: Number(process.env.BACKUP_INTERVAL_MINUTES) || 0,
  dir: process.env.BACKUP_DIR || DEFAULT_BACKUP_DIR,
  keepDays: Number(process.env.BACKUP_KEEP_DAYS) || 14,
  keepCount: Number(process.env.BACKUP_KEEP_COUNT) || 0,
  mysqldump: process.env.BACKUP_MYSQLDUMP || DEFAULT_MYSQLDUMP,

  dbHost: process.env.DB_HOST || 'localhost',
  dbPort: process.env.DB_PORT || '3306',
  dbUser: process.env.DB_USER || 'root',
  dbPass: process.env.DB_PASSWORD || '',
  dbName: process.env.DB_NAME || 'gpsviet',

  tgToken: process.env.TELEGRAM_BOT_TOKEN || '',
  tgChatId: process.env.TELEGRAM_CHAT_ID || '',
};

function log(msg) {
  console.log(`[backup] ${msg}`);
}

// Dump DB + gzip thang ra file .sql.gz, tra ve duong dan file
function dumpAndGzip() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(cfg.dir)) fs.mkdirSync(cfg.dir, { recursive: true });
    if (!fs.existsSync(cfg.mysqldump)) {
      return reject(new Error(`Khong tim thay mysqldump: ${cfg.mysqldump}`));
    }

    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const outFile = path.join(cfg.dir, `${cfg.dbName}_${ts}.sql.gz`);

    const args = [
      `--host=${cfg.dbHost}`,
      `--port=${cfg.dbPort}`,
      `--user=${cfg.dbUser}`,
      '--single-transaction',
      '--routines', '--triggers', '--events',
      '--default-character-set=utf8mb4',
      cfg.dbName,
    ];

    // Truyen password qua env MYSQL_PWD (an toan hon de trong command line)
    const env = { ...process.env };
    if (cfg.dbPass) env.MYSQL_PWD = cfg.dbPass;

    const child = spawn(cfg.mysqldump, args, { env });
    const gzip = zlib.createGzip();
    const out = fs.createWriteStream(outFile);

    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', reject);

    child.stdout.pipe(gzip).pipe(out);

    out.on('error', reject);
    out.on('finish', () => {
      if (child.exitCode && child.exitCode !== 0) {
        return reject(new Error(`mysqldump loi (exit ${child.exitCode}): ${stderr.trim()}`));
      }
      resolve(outFile);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        out.destroy();
        try { fs.unlinkSync(outFile); } catch (_) {}
        reject(new Error(`mysqldump loi (exit ${code}): ${stderr.trim()}`));
      }
    });
  });
}

// Gui file len Telegram qua sendDocument (multipart/form-data thuan https)
function sendToTelegram(filePath) {
  return new Promise((resolve, reject) => {
    if (process.env.NODE_ENV === 'development') {
      log('Dang chay o moi truong local (development) -> Khong gui len Telegram.');
      return resolve(false);
    }

    if (!cfg.tgToken || !cfg.tgChatId) {
      log('Chua cau hinh Telegram -> chi luu local, khong gui ra ngoai.');
      return resolve(false);
    }

    const fileBuf = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const boundary = '----KiroBackup' + Date.now().toString(16);
    const caption = `Backup ${cfg.dbName} - ${os.hostname()} - ${new Date().toLocaleString()}`;

    const pre = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="chat_id"\r\n\r\n${cfg.tgChatId}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="document"; filename="${fileName}"\r\n` +
      `Content-Type: application/gzip\r\n\r\n`,
      'utf8'
    );
    const post = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
    const body = Buffer.concat([pre, fileBuf, post]);

    const req = https.request({
      method: 'POST',
      hostname: 'api.telegram.org',
      path: `/bot${cfg.tgToken}/sendDocument`,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    }, (res) => {
      let data = '';
      res.on('data', (d) => { data += d; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          log('Da gui backup len Telegram.');
          let msgId = null;
          try { msgId = JSON.parse(data).result.message_id; } catch (_) {}
          resolve(msgId);
        } else {
          reject(new Error(`Telegram tra ve ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Xoa 1 tin nhan tren Telegram (bot tu xoa tin chinh no gui)
function deleteTelegramMessage(messageId) {
  return new Promise((resolve) => {
    if (!cfg.tgToken || !cfg.tgChatId || !messageId) return resolve(false);
    const url = `https://api.telegram.org/bot${cfg.tgToken}/deleteMessage` +
      `?chat_id=${encodeURIComponent(cfg.tgChatId)}&message_id=${messageId}`;
    https.get(url, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve(res.statusCode === 200));
    }).on('error', () => resolve(false));
  });
}

// Trang thai: luu danh sach message_id da gui de con xoa bot cu
const STATE_FILE = () => path.join(cfg.dir, 'telegram-msgs.json');
function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE(), 'utf8')); } catch (_) { return []; }
}
function writeState(arr) {
  try { fs.writeFileSync(STATE_FILE(), JSON.stringify(arr)); } catch (_) {}
}

// Xoa ban .sql.gz cu o local
function cleanupLocal() {
  try {
    const files = fs.readdirSync(cfg.dir)
      .filter((f) => f.endsWith('.sql.gz'))
      .map((f) => ({ f, fp: path.join(cfg.dir, f), mt: fs.statSync(path.join(cfg.dir, f)).mtimeMs }))
      .sort((a, b) => b.mt - a.mt); // moi nhat truoc

    if (cfg.keepCount > 0) {
      // Giu lai keepCount ban moi nhat, xoa phan con lai
      for (const item of files.slice(cfg.keepCount)) {
        fs.unlinkSync(item.fp);
        log(`Xoa local cu: ${item.f}`);
      }
    } else {
      // Khong dat keepCount -> xoa theo so ngay
      const cutoff = Date.now() - cfg.keepDays * 24 * 60 * 60 * 1000;
      for (const item of files) {
        if (item.mt < cutoff) {
          fs.unlinkSync(item.fp);
          log(`Xoa local cu: ${item.f}`);
        }
      }
    }
  } catch (err) {
    log(`Don ban cu loi: ${err.message}`);
  }
}

async function runBackup() {
  try {
    log(`Bat dau backup ${cfg.dbName}...`);
    const file = await dumpAndGzip();
    const sizeMB = (fs.statSync(file).size / 1024 / 1024).toFixed(2);
    log(`Da tao ${path.basename(file)} (${sizeMB} MB)`);

    const msgId = await sendToTelegram(file);

    // Quan ly so ban giu tren Telegram: gui xong xoa tin cu vuot keepCount
    if (msgId) {
      const keep = cfg.keepCount > 0 ? cfg.keepCount : 14;
      const ids = readState();
      ids.push(msgId);
      while (ids.length > keep) {
        const old = ids.shift();
        const ok = await deleteTelegramMessage(old);
        if (ok) log(`Da xoa backup cu tren Telegram (msg ${old}).`);
      }
      writeState(ids);
    }

    cleanupLocal();
    log('Backup hoan tat.');
    return file;
  } catch (err) {
    log(`LOI: ${err.message}`);
    // Bao loi ra Telegram neu co cau hinh, de biet ma xu ly
    if (cfg.tgToken && cfg.tgChatId) {
      try {
        https.get(
          `https://api.telegram.org/bot${cfg.tgToken}/sendMessage` +
          `?chat_id=${encodeURIComponent(cfg.tgChatId)}` +
          `&text=${encodeURIComponent('[Backup LOI] ' + err.message)}`
        );
      } catch (_) {}
    }
    throw err;
  }
}

function start() {
  if (!cfg.enabled) {
    log('BACKUP_ENABLED=false -> bo qua (chua bat backup tu dong).');
    return;
  }
  // Uu tien BACKUP_INTERVAL_MINUTES neu co, neu khong dung gio.
  const periodMs = cfg.intervalMinutes > 0
    ? cfg.intervalMinutes * 60 * 1000
    : cfg.intervalHours * 60 * 60 * 1000;
  const human = cfg.intervalMinutes > 0
    ? `${cfg.intervalMinutes} phut`
    : `${cfg.intervalHours} gio`;
  log(`Bat backup tu dong: moi ${human}, giu ${cfg.keepDays} ngay.`);
  // Chay 1 lan sau khi server on dinh 30s, sau do theo chu ky
  setTimeout(() => { runBackup().catch(() => {}); }, 30 * 1000);
  setInterval(() => { runBackup().catch(() => {}); }, periodMs);
}

module.exports = { start, runBackup };
