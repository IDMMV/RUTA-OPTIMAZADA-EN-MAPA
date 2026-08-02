/**
 * CATÁLOGO DE SUBESTACIONES PARA RUTAS DE INSPECCIÓN
 *
 * Crea automáticamente en Google Drive:
 *   Carpeta: Rutas de Inspección
 *   Hoja: Subestaciones - Rutas de Inspección
 *
 * Columnas:
 * ID | Subestación | Nombre/Dirección | Latitud | Longitud | Actualizado
 *
 * PUBLICACIÓN:
 * Implementar > Nueva implementación > Aplicación web
 * Ejecutar como: Yo
 * Quién tiene acceso: Cualquier persona
 */

const APP_FOLDER_NAME = 'Rutas de Inspección';
const SPREADSHEET_NAME = 'Subestaciones - Rutas de Inspección';
const SHEET_NAME = 'Subestaciones';
const HEADERS = ['ID', 'Subestación', 'Nombre/Dirección', 'Latitud', 'Longitud', 'Actualizado'];

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'places');
    const callback = String((e && e.parameter && e.parameter.callback) || '');
    let payload;

    if (action === 'places') {
      const info = getSpreadsheetInfo_();
      payload = {
        ok: true,
        records: readPlaces_(),
        sheetUrl: info.url,
        spreadsheetId: info.id
      };
    } else if (action === 'health') {
      const info = getSpreadsheetInfo_();
      payload = { ok: true, message: 'Conexión correcta', sheetUrl: info.url };
    } else {
      payload = { ok: false, error: 'Acción no reconocida.' };
    }

    const text = JSON.stringify(payload);
    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + text + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(text)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    const callback = String((e && e.parameter && e.parameter.callback) || '');
    const text = JSON.stringify({ ok: false, error: error.message });
    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + text + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(text)
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = String(body.action || '');
    const current = readPlaces_();
    const byId = {};

    current.forEach(function(record) {
      const normalized = normalizePlace_(record);
      byId[normalized.id] = normalized;
    });

    function applyRecord(raw) {
      const record = normalizePlace_(raw);
      if (!Number.isFinite(record.lat) || !Number.isFinite(record.lon)) return;
      const existing = byId[record.id];
      if (!existing || record.updatedAt >= existing.updatedAt) {
        byId[record.id] = record;
      }
    }

    if (action === 'upsert' && body.record) {
      applyRecord(body.record);
    } else if (action === 'bulkSync' && Array.isArray(body.records)) {
      body.records.forEach(applyRecord);
    } else if (action === 'delete' && body.id) {
      delete byId[String(body.id)];
    }

    const merged = Object.keys(byId)
      .map(function(id) { return byId[id]; })
      .sort(function(a, b) {
        return String(a.substation || a.label).localeCompare(
          String(b.substation || b.label),
          'es',
          { numeric: true, sensitivity: 'base' }
        );
      });

    writePlaces_(merged);
    const info = getSpreadsheetInfo_();

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      records: merged,
      sheetUrl: info.url
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateFolder_() {
  const folders = DriveApp.getFoldersByName(APP_FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(APP_FOLDER_NAME);
}

function getOrCreateSpreadsheet_() {
  const folder = getOrCreateFolder_();
  const files = folder.getFilesByName(SPREADSHEET_NAME);

  while (files.hasNext()) {
    const file = files.next();
    if (file.getMimeType() === MimeType.GOOGLE_SHEETS) {
      return SpreadsheetApp.openById(file.getId());
    }
  }

  const spreadsheet = SpreadsheetApp.create(SPREADSHEET_NAME);
  const file = DriveApp.getFileById(spreadsheet.getId());
  file.moveTo(folder);

  const sheet = spreadsheet.getSheets()[0];
  sheet.setName(SHEET_NAME);
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  formatSheet_(sheet);
  return spreadsheet;
}

function getSheet_() {
  const spreadsheet = getOrCreateSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    formatSheet_(sheet);
  }
  return sheet;
}

function getSpreadsheetInfo_() {
  const spreadsheet = getOrCreateSpreadsheet_();
  return {
    id: spreadsheet.getId(),
    url: spreadsheet.getUrl()
  };
}

function readPlaces_() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const rows = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  return rows
    .filter(function(row) {
      return row[0] || row[1] || row[2];
    })
    .map(function(row) {
      const updated = row[5] instanceof Date ? row[5].getTime() : Number(row[5] || 0);
      return normalizePlace_({
        id: row[0],
        substation: row[1],
        label: row[2],
        lat: row[3],
        lon: row[4],
        updatedAt: updated
      });
    })
    .filter(function(record) {
      return Number.isFinite(record.lat) && Number.isFinite(record.lon);
    });
}

function writePlaces_(records) {
  const sheet = getSheet_();
  sheet.clearContents();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);

  if (records.length) {
    const values = records.map(function(record) {
      const r = normalizePlace_(record);
      return [
        r.id,
        r.substation,
        r.label,
        r.lat,
        r.lon,
        new Date(r.updatedAt)
      ];
    });
    sheet.getRange(2, 1, values.length, HEADERS.length).setValues(values);
  }

  formatSheet_(sheet);
}

function normalizePlace_(raw) {
  const lat = Number(raw && raw.lat);
  const lon = Number(raw && (raw.lon !== undefined ? raw.lon : raw.lng));
  const substation = String((raw && raw.substation) || '').trim();
  const label = String((raw && raw.label) || '').trim();
  const stableKey = [substation.toLowerCase(), lat.toFixed(6), lon.toFixed(6)].join('|');

  return {
    id: String((raw && raw.id) || stableId_(stableKey)),
    substation: substation,
    label: label || substation || 'Ubicación guardada',
    lat: lat,
    lon: lon,
    updatedAt: Number((raw && raw.updatedAt) || Date.now())
  };
}

function stableId_(text) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5,
    text,
    Utilities.Charset.UTF_8
  );
  return bytes.map(function(byte) {
    const value = (byte + 256) % 256;
    return ('0' + value.toString(16)).slice(-2);
  }).join('');
}

function formatSheet_(sheet) {
  const existingFilter = sheet.getFilter();
  if (existingFilter) existingFilter.remove();
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#0b63e6')
    .setFontColor('#ffffff');
  sheet.getRange('D:E').setNumberFormat('0.000000');
  sheet.getRange('F:F').setNumberFormat('dd/mm/yyyy hh:mm:ss');
  sheet.autoResizeColumns(1, HEADERS.length);
  sheet.setColumnWidth(3, 360);
  sheet.getDataRange().createFilter();
}
