/**
 * 00 早餐清單 — Google Apps Script 後端
 *
 * 貼到「早餐試算表 → 擴充功能 → Apps Script」裡使用。
 * 設定步驟請看 docs/部署說明.md。
 *
 * GET  ：回傳所有店家（網頁讀資料用，不需要密碼）
 * POST ：check（檢查密碼）、save（新增／修改）、delete（刪除），都需要密碼
 */

const SHEET_INDEX = 0;                        // 讀第一個工作表
const PHOTO_FOLDER_NAME = '00 早餐清單照片';   // 照片存在雲端硬碟的這個資料夾
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

// 網頁欄位 ↔ 試算表標題（第一列）
const FIELDS = {
  id: 'id',
  name: '店名',
  img: '照片',
  phone: '電話',
  addr: '地址',
  link: '線上點餐網址',
  note: '愛吃什麼',
  type: '類型',
  hours: '營業時間',
};

// 文字欄位長度上限，避免被塞入過長的資料
const MAX_LEN = { name: 60, phone: 30, addr: 120, note: 200, type: 60, hours: 60, img: 500, link: 500 };

/* ---------- 入口 ---------- */

function doGet() {
  try {
    const sheet = getSheet_();
    if (hasMissingIds_(sheet)) withLock_(() => ensureIds_(sheet));
    return json_({ ok: true, items: readAll_(sheet) });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  let req;
  try {
    req = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: '資料格式錯誤' });
  }

  const auth = checkPassword_(req.password);
  if (auth !== true) return json_({ ok: false, error: auth });

  try {
    return withLock_(() => {
      const sheet = getSheet_();
      switch (req.action) {
        case 'check':
          return json_({ ok: true });
        case 'save':
          return json_({ ok: true, item: save_(sheet, req.item || {}, req.photo) });
        case 'delete':
          remove_(sheet, req.id);
          return json_({ ok: true });
        default:
          return json_({ ok: false, error: '未知的動作' });
      }
    });
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) });
  }
}

/**
 * 第一次使用時，在 Apps Script 編輯器裡選這個函式按「執行」：
 * 補上缺少的欄位（id、類型、營業時間）、幫每家店編 id、猜類型、建立照片資料夾。
 */
function setup() {
  const sheet = getSheet_();
  ensureColumns_(sheet);
  ensureIds_(sheet);
  guessTypes_(sheet);

  const cols = headerMap_(sheet);
  sheet.getRange(2, cols.phone + 1, Math.max(sheet.getMaxRows() - 1, 1), 1).setNumberFormat('@');
  getPhotoFolder_();

  const pw = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  Logger.log(pw
    ? '設定完成！'
    : '設定完成，但還沒設定密碼：請到「專案設定 → 指令碼屬性」新增 ADMIN_PASSWORD。');
}

/* ---------- 讀取 ---------- */

function readAll_(sheet) {
  const values = sheet.getDataRange().getDisplayValues();
  const header = values.shift() || [];
  const idx = {};
  Object.keys(FIELDS).forEach((key) => { idx[key] = header.indexOf(FIELDS[key]); });

  return values
    .map((row) => {
      const item = {};
      Object.keys(FIELDS).forEach((key) => {
        item[key] = idx[key] >= 0 ? String(row[idx[key]] || '').trim() : '';
      });
      return item;
    })
    .filter((item) => item.name);
}

/* ---------- 寫入 ---------- */

function save_(sheet, input, photo) {
  ensureColumns_(sheet);
  const cols = headerMap_(sheet);
  const item = clean_(input);
  if (!item.name) throw new Error('店名不能空白');

  if (photo && photo.base64) item.img = savePhoto_(photo, item.name);

  let row;
  if (item.id) {
    row = findRow_(sheet, cols, item.id);
    if (!row) throw new Error('找不到這家店，可能已經被刪除了，請重新整理');
  } else {
    item.id = newId_();
    row = Math.max(sheet.getLastRow(), 1) + 1;
  }

  Object.keys(FIELDS).forEach((key) => {
    if (key === 'img' && !item.img && !input.clearImg) return; // 沒換照片就保留原本的
    const cell = sheet.getRange(row, cols[key] + 1);
    cell.setNumberFormat('@');
    cell.setValue(item[key] || '');
  });

  return readRow_(sheet, cols, row);
}

function remove_(sheet, id) {
  const cols = headerMap_(sheet);
  const row = findRow_(sheet, cols, String(id || ''));
  if (!row) throw new Error('找不到這家店，可能已經被刪除了');
  sheet.deleteRow(row);
}

function clean_(input) {
  const item = {};
  Object.keys(FIELDS).forEach((key) => {
    let v = String(input[key] == null ? '' : input[key]).trim();
    if (MAX_LEN[key]) v = v.slice(0, MAX_LEN[key]);
    item[key] = v;
  });
  // 網址只接受 http(s)，避免奇怪的連結
  ['img', 'link'].forEach((key) => {
    if (item[key] && !/^https?:\/\//i.test(item[key])) item[key] = '';
  });
  return item;
}

function savePhoto_(photo, storeName) {
  const mime = String(photo.mime || 'image/jpeg');
  if (!/^image\/(jpeg|png|webp|gif)$/.test(mime)) throw new Error('照片格式不支援');
  const bytes = Utilities.base64Decode(photo.base64);
  if (bytes.length > MAX_PHOTO_BYTES) throw new Error('照片太大了（上限 5MB）');

  const ext = mime.split('/')[1].replace('jpeg', 'jpg');
  const name = storeName.replace(/[\\/:*?"<>|]/g, '') + '_' + Date.now() + '.' + ext;
  const file = getPhotoFolder_().createFile(Utilities.newBlob(bytes, mime, name));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://lh3.googleusercontent.com/d/' + file.getId() + '=w1000';
}

/* ---------- 試算表工具 ---------- */

function getSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[SHEET_INDEX];
  if (!sheet) throw new Error('找不到工作表');
  return sheet;
}

function headerMap_(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const header = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
  const cols = {};
  Object.keys(FIELDS).forEach((key) => { cols[key] = header.indexOf(FIELDS[key]); });
  return cols;
}

function ensureColumns_(sheet) {
  const cols = headerMap_(sheet);
  let next = Math.max(sheet.getLastColumn(), 0) + 1;
  Object.keys(FIELDS).forEach((key) => {
    if (cols[key] < 0) {
      sheet.getRange(1, next).setValue(FIELDS[key]);
      next += 1;
    }
  });
}

function hasMissingIds_(sheet) {
  const cols = headerMap_(sheet);
  if (cols.id < 0 || cols.name < 0) return cols.name >= 0 && sheet.getLastRow() > 1;
  const last = sheet.getLastRow();
  if (last < 2) return false;
  const ids = sheet.getRange(2, cols.id + 1, last - 1, 1).getDisplayValues();
  const names = sheet.getRange(2, cols.name + 1, last - 1, 1).getDisplayValues();
  return names.some((n, i) => n[0] && !ids[i][0]);
}

function ensureIds_(sheet) {
  ensureColumns_(sheet);
  const cols = headerMap_(sheet);
  const last = sheet.getLastRow();
  if (last < 2) return;
  const range = sheet.getRange(2, cols.id + 1, last - 1, 1);
  const ids = range.getDisplayValues();
  const names = sheet.getRange(2, cols.name + 1, last - 1, 1).getDisplayValues();
  let changed = false;
  ids.forEach((row, i) => {
    if (names[i][0] && !row[0]) { row[0] = newId_(); changed = true; }
  });
  if (changed) range.setValues(ids);
}

function guessTypes_(sheet) {
  const rules = [
    ['蛋餅', /蛋餅/],
    ['漢堡', /漢堡|堡|麥味登|拉亞|摩斯|麥當勞/],
    ['飯糰', /飯糰/],
    ['中式', /豆漿|小籠包|饅頭|燒餅|包子/],
    ['早午餐', /早午餐/],
    ['超商', /7-11|7-ELEVEN|全家|萊爾富|OK超商/i],
  ];
  const cols = headerMap_(sheet);
  const last = sheet.getLastRow();
  if (last < 2) return;
  const typeRange = sheet.getRange(2, cols.type + 1, last - 1, 1);
  const types = typeRange.getDisplayValues();
  const names = sheet.getRange(2, cols.name + 1, last - 1, 1).getDisplayValues();
  const notes = sheet.getRange(2, cols.note + 1, last - 1, 1).getDisplayValues();
  types.forEach((row, i) => {
    if (row[0] || !names[i][0]) return;
    const text = names[i][0] + ' ' + notes[i][0];
    row[0] = rules.filter((r) => r[1].test(text)).map((r) => r[0]).join('、');
  });
  typeRange.setValues(types);
}

function findRow_(sheet, cols, id) {
  if (!id || cols.id < 0) return 0;
  const last = sheet.getLastRow();
  if (last < 2) return 0;
  const ids = sheet.getRange(2, cols.id + 1, last - 1, 1).getDisplayValues();
  const i = ids.findIndex((r) => r[0] === id);
  return i >= 0 ? i + 2 : 0;
}

function readRow_(sheet, cols, row) {
  const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const item = {};
  Object.keys(FIELDS).forEach((key) => { item[key] = cols[key] >= 0 ? String(values[cols[key]] || '') : ''; });
  return item;
}

function getPhotoFolder_() {
  const it = DriveApp.getFoldersByName(PHOTO_FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(PHOTO_FOLDER_NAME);
}

/* ---------- 其他 ---------- */

// 密碼錯太多次就暫停 10 分鐘，避免被亂猜
function checkPassword_(password) {
  const expected = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!expected) return '後台還沒設定密碼（ADMIN_PASSWORD）';

  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get('fails') || 0);
  if (fails >= 10) return '密碼錯太多次，請 10 分鐘後再試';

  if (String(password || '') === expected) return true;
  cache.put('fails', String(fails + 1), 600);
  Utilities.sleep(800);
  return '密碼錯誤';
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function newId_() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 10);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
