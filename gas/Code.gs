/**
 * 부부 가계부 저장소.
 * 구글 시트에서 확장 프로그램 → Apps Script 에 이 파일을 붙여 넣고 웹 앱으로 배포합니다.
 * 설정 방법은 gas/README.md 를 보면 됩니다.
 *
 * 스크립트 속성
 * - APP_PASSWORD: 둘이 공유하는 비밀번호
 * - SPREADSHEET_ID: 시트에 묶인 스크립트면 비워 둡니다. 독립 스크립트면 시트 ID
 */

var HEADERS = {
  transactions: ["id", "date", "type", "amount", "asset_type", "memo", "category_id", "l1", "l2", "l3", "created_at", "updated_at"],
  categories: ["id", "l1", "l2", "l3"],
  asset_types: ["name"],
  memo_learn: ["keyword", "l1", "l2", "l3", "category_id", "updated_at"]
};

var DEFAULT_CATEGORIES = [
  ["생활비", "식비", "장보기"],
  ["생활비", "식비", "외식"],
  ["생활비", "교통", "대중교통"],
  ["고정비", "주거", "월세/관리비"],
  ["고정비", "통신", "휴대폰"],
  ["수입", "근로소득", "월급"]
];

var DEFAULT_ASSETS = ["현금", "토스뱅크", "하나은행", "파주페이"];

function doGet(e) {
  var body = {};
  if (e && e.parameter && e.parameter.body) {
    try {
      body = JSON.parse(e.parameter.body);
    } catch (err) {
      body = {};
    }
  }
  return respond_(handle_(body));
}

function doPost(e) {
  var body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (err) {
    body = {};
  }
  return respond_(handle_(body));
}

function respond_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function handle_(body) {
  var expected = PropertiesService.getScriptProperties().getProperty("APP_PASSWORD") || "";
  if (!expected) {
    return { ok: false, error: "스크립트 속성 APP_PASSWORD 가 비어 있습니다." };
  }
  var given = body && body.password != null ? String(body.password) : "";
  if (!passwordMatches_(given, String(expected))) {
    return { ok: false, error: "unauthorized" };
  }
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    lock.waitLock(20000);
    locked = true;
    var ss = openSpreadsheet_();
    ensureWorkbook_(ss);
    var action = String((body && body.action) || "load");
    if (action === "auth" || action === "load") {
      return { ok: true, data: loadAll_(ss) };
    }
    if (action === "saveTransaction") {
      saveTransaction_(ss, body.payload || {});
      return { ok: true, data: loadAll_(ss) };
    }
    if (action === "deleteTransaction") {
      deleteByColumn_(ss.getSheetByName("transactions"), "id", body.id);
      return { ok: true, data: loadAll_(ss) };
    }
    if (action === "saveCategory") {
      saveCategory_(ss, body.payload || {});
      return { ok: true, data: loadAll_(ss) };
    }
    if (action === "deleteCategory") {
      deleteByColumn_(ss.getSheetByName("categories"), "id", body.id);
      return { ok: true, data: loadAll_(ss) };
    }
    if (action === "saveAsset") {
      saveAsset_(ss, body.payload || {});
      return { ok: true, data: loadAll_(ss) };
    }
    if (action === "deleteAsset") {
      deleteByColumn_(ss.getSheetByName("asset_types"), "name", body.name);
      return { ok: true, data: loadAll_(ss) };
    }
    if (action === "saveMemoLearn") {
      saveMemoLearn_(ss, body.rows || []);
      return { ok: true, data: loadAll_(ss) };
    }
    return { ok: false, error: "알 수 없는 요청입니다." };
  } catch (err) {
    return { ok: false, error: String(err && err.message ? err.message : err) };
  } finally {
    if (locked) lock.releaseLock();
  }
}

function passwordMatches_(given, expected) {
  if (!given || given.length !== expected.length) return false;
  var diff = 0;
  for (var i = 0; i < given.length; i++) {
    diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

function openSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID") || "";
  if (id) return SpreadsheetApp.openById(id);
  var active = SpreadsheetApp.getActive();
  if (!active) {
    throw new Error("스프레드시트를 찾지 못했습니다. 시트에서 스크립트를 열거나 SPREADSHEET_ID 를 넣어 주세요.");
  }
  return active;
}

function ensureWorkbook_(ss) {
  if (!ss.getSheetByName("categories")) {
    var cat = ensureSheet_(ss, "categories", HEADERS.categories);
    DEFAULT_CATEGORIES.forEach(function (row) {
      cat.appendRow([Utilities.getUuid(), row[0], row[1], row[2]]);
    });
  } else {
    ensureSheet_(ss, "categories", HEADERS.categories);
  }
  if (!ss.getSheetByName("asset_types")) {
    var assets = ensureSheet_(ss, "asset_types", HEADERS.asset_types);
    DEFAULT_ASSETS.forEach(function (name) {
      assets.appendRow([name]);
    });
  } else {
    ensureSheet_(ss, "asset_types", HEADERS.asset_types);
  }
  ensureSheet_(ss, "transactions", HEADERS.transactions);
  ensureSheet_(ss, "memo_learn", HEADERS.memo_learn);
}

function ensureSheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
  }
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
    return sh;
  }
  var current = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), headers.length)).getValues()[0]
    .map(function (cell) { return String(cell || "").trim(); });
  var same = headers.every(function (key, idx) { return current[idx] === key; });
  if (!same) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function loadAll_(ss) {
  return {
    categories: readObjects_(ss.getSheetByName("categories"), HEADERS.categories).map(function (row) {
      return { id: row.id, l1: row.l1, l2: row.l2, l3: row.l3 };
    }),
    assetTypes: readObjects_(ss.getSheetByName("asset_types"), HEADERS.asset_types)
      .map(function (row) { return row.name; })
      .filter(Boolean),
    transactions: readObjects_(ss.getSheetByName("transactions"), HEADERS.transactions).map(function (row) {
      return {
        id: row.id,
        date: row.date,
        type: row.type,
        amount: Number(row.amount || 0),
        assetType: row.asset_type,
        memo: row.memo,
        categoryId: row.category_id || "",
        l1: row.l1,
        l2: row.l2,
        l3: row.l3,
        createdAt: row.created_at
      };
    }),
    memoLearn: readObjects_(ss.getSheetByName("memo_learn"), HEADERS.memo_learn).map(function (row) {
      return {
        keyword: row.keyword,
        l1: row.l1,
        l2: row.l2,
        l3: row.l3,
        category_id: row.category_id || "",
        updated_at: row.updated_at
      };
    })
  };
}

function saveTransaction_(ss, payload) {
  var sh = ss.getSheetByName("transactions");
  var id = String(payload.id || Utilities.getUuid());
  var type = String(payload.type || "");
  if (type !== "income" && type !== "expense") {
    throw new Error("거래 유형은 수입 또는 지출이어야 합니다.");
  }
  var amount = Number(payload.amount || 0);
  if (!isFinite(amount) || amount < 0) throw new Error("금액이 올바르지 않습니다.");
  var now = new Date().toISOString();
  var rowNum = findRow_(sh, "id", id);
  var created = now;
  if (rowNum > 0) {
    var existing = rowAt_(sh, rowNum, HEADERS.transactions);
    created = existing.created_at || now;
  }
  var row = [
    id,
    String(payload.date || ""),
    type,
    amount,
    String(payload.assetType || payload.asset_type || ""),
    String(payload.memo || ""),
    String(payload.categoryId || payload.category_id || ""),
    String(payload.l1 || ""),
    String(payload.l2 || ""),
    String(payload.l3 || ""),
    created,
    now
  ];
  writeRow_(sh, rowNum, row);
  if (payload.memoLearn && payload.memoLearn.length) {
    saveMemoLearn_(ss, payload.memoLearn);
  }
}

function saveCategory_(ss, payload) {
  var sh = ss.getSheetByName("categories");
  var l1 = String(payload.l1 || "").trim();
  var l2 = String(payload.l2 || "").trim();
  var l3 = String(payload.l3 || "").trim();
  if (!l1 || !l2 || !l3) throw new Error("분류 이름이 비어 있습니다.");
  var id = String(payload.id || Utilities.getUuid());
  var rowNum = findRow_(sh, "id", id);
  writeRow_(sh, rowNum, [id, l1, l2, l3]);
  var tx = ss.getSheetByName("transactions");
  var headers = HEADERS.transactions;
  var idCol = headers.indexOf("category_id");
  var values = tx.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idCol] || "") !== id) continue;
    values[i][headers.indexOf("l1")] = l1;
    values[i][headers.indexOf("l2")] = l2;
    values[i][headers.indexOf("l3")] = l3;
    values[i][headers.indexOf("updated_at")] = new Date().toISOString();
  }
  if (values.length > 1) {
    tx.getRange(1, 1, values.length, headers.length).setValues(values);
  }
}

function saveAsset_(ss, payload) {
  var name = String(payload.name || "").trim();
  var oldName = String(payload.oldName || "").trim();
  if (!name) throw new Error("자산 이름이 비어 있습니다.");
  var sh = ss.getSheetByName("asset_types");
  if (!oldName) {
    if (findRow_(sh, "name", name) < 0) sh.appendRow([name]);
    return;
  }
  var rowNum = findRow_(sh, "name", oldName);
  if (rowNum < 0) throw new Error("수정할 자산 종류를 찾지 못했습니다.");
  sh.getRange(rowNum, 1).setValue(name);
  if (name === oldName) return;
  var tx = ss.getSheetByName("transactions");
  var headers = HEADERS.transactions;
  var col = headers.indexOf("asset_type");
  var values = tx.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][col] || "").trim() !== oldName) continue;
    values[i][col] = name;
    values[i][headers.indexOf("updated_at")] = new Date().toISOString();
  }
  if (values.length > 1) {
    tx.getRange(1, 1, values.length, headers.length).setValues(values);
  }
}

function saveMemoLearn_(ss, rows) {
  var sh = ss.getSheetByName("memo_learn");
  var now = new Date().toISOString();
  (rows || []).forEach(function (row) {
    var keyword = String(row.keyword || "").trim();
    if (!keyword) return;
    var record = [
      keyword,
      String(row.l1 || ""),
      String(row.l2 || ""),
      String(row.l3 || ""),
      String(row.category_id || row.categoryId || ""),
      now
    ];
    writeRow_(sh, findRow_(sh, "keyword", keyword), record);
  });
}

function deleteByColumn_(sh, columnName, value) {
  if (!sh) return;
  var key = String(value || "").trim();
  if (!key) return;
  var rowNum = findRow_(sh, columnName, key);
  if (rowNum > 1) sh.deleteRow(rowNum);
}

function readObjects_(sh, headers) {
  if (!sh || sh.getLastRow() < 2) return [];
  var values = sh.getDataRange().getValues();
  var head = values[0].map(function (cell) { return String(cell || "").trim(); });
  var out = [];
  for (var r = 1; r < values.length; r++) {
    var blank = true;
    for (var c = 0; c < values[r].length; c++) {
      if (String(values[r][c] == null ? "" : values[r][c]).trim() !== "") {
        blank = false;
        break;
      }
    }
    if (blank) continue;
    var obj = {};
    headers.forEach(function (key) {
      var idx = head.indexOf(key);
      obj[key] = idx >= 0 ? formatCell_(values[r][idx], key) : "";
    });
    out.push(obj);
  }
  return out;
}

function formatCell_(value, key) {
  if (value instanceof Date) {
    var pattern = key.indexOf("_at") >= 0 ? "yyyy-MM-dd'T'HH:mm:ss" : "yyyy-MM-dd";
    return Utilities.formatDate(value, "Asia/Seoul", pattern);
  }
  if (key === "amount") return Number(value || 0);
  return value == null ? "" : String(value).trim();
}

function findRow_(sh, columnName, value) {
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var idx = -1;
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i] || "").trim() === columnName) {
      idx = i;
      break;
    }
  }
  if (idx < 0 || sh.getLastRow() < 2) return -1;
  var vals = sh.getRange(2, idx + 1, sh.getLastRow() - 1, 1).getValues();
  var target = String(value);
  for (var r = 0; r < vals.length; r++) {
    if (String(vals[r][0] == null ? "" : vals[r][0]).trim() === target) return r + 2;
  }
  return -1;
}

function rowAt_(sh, rowNum, headers) {
  var values = sh.getRange(rowNum, 1, 1, headers.length).getValues()[0];
  var obj = {};
  headers.forEach(function (key, idx) {
    obj[key] = formatCell_(values[idx], key);
  });
  return obj;
}

function writeRow_(sh, rowNum, row) {
  if (rowNum > 0) {
    sh.getRange(rowNum, 1, 1, row.length).setValues([row]);
  } else {
    sh.appendRow(row);
  }
}
