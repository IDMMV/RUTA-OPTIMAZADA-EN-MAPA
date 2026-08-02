/**
 * Backend gratuito para sincronizar el catálogo de "ubicaciones guardadas"
 * (subestaciones) de Rutas de Inspección entre varios celulares/computadoras,
 * usando un Google Sheet como base de datos.
 *
 * CÓMO INSTALARLO:
 * 1. Crea un Google Sheet nuevo (vacío, cualquier nombre).
 * 2. Menú Extensiones → Apps Script.
 * 3. Borra el contenido de Code.gs que aparece por defecto y pega TODO este archivo.
 * 4. Guarda el proyecto (ícono de disquete).
 * 5. Implementar (arriba a la derecha) → Nueva implementación.
 *    - Tipo: Aplicación web.
 *    - Ejecutar como: Yo (tu cuenta).
 *    - Quién tiene acceso: Cualquier usuario.
 * 6. Autoriza los permisos que pida Google (es tu propio script, es seguro).
 * 7. Copia la URL que termina en /exec.
 * 8. En la app, ve a Configuración → "Sincronizar subestaciones (SE)" y pega esa URL.
 *    Repite el paso 8 en cada dispositivo donde uses la app, con la MISMA URL.
 *
 * El script crea automáticamente una hoja llamada "Subestaciones" con las
 * columnas: id, label, lat, lon, substation, updatedAt. No necesitas tocar
 * el Sheet manualmente.
 */

const SHEET_NAME = 'Subestaciones';
const HEADERS = ['id', 'label', 'lat', 'lon', 'substation', 'updatedAt'];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

function readAll_() {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1);
  return rows
    .filter(function (r) { return r[0]; })
    .map(function (r) {
      return {
        id: String(r[0]),
        label: String(r[1] || ''),
        lat: Number(r[2]),
        lon: Number(r[3]),
        substation: String(r[4] || ''),
        updatedAt: Number(r[5] || 0),
      };
    });
}

function writeAll_(records) {
  const sheet = getSheet_();
  sheet.clearContents();
  sheet.appendRow(HEADERS);
  if (!records.length) return;
  const rows = records.map(function (r) { return [r.id, r.label, r.lat, r.lon, r.substation, r.updatedAt]; });
  sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
}

function normalizeRecord_(raw) {
  return {
    id: String(raw.id || Utilities.getUuid()),
    label: String(raw.label || ''),
    lat: Number(raw.lat),
    lon: Number(raw.lon),
    substation: String(raw.substation || ''),
    updatedAt: Number(raw.updatedAt || Date.now()),
  };
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// GET: devuelve todo el catálogo actual (útil para revisar/depurar).
function doGet(e) {
  return jsonResponse_({ records: readAll_() });
}

// POST: recibe { action:'upsert', record } o { action:'bulkSync', records:[...] }
// y responde con el catálogo ya fusionado (gana el registro con updatedAt más reciente por id).
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || '{}');
    const action = body.action;
    const current = readAll_();
    const byId = {};
    current.forEach(function (r) { byId[r.id] = r; });

    function applyRecord(raw) {
      const rec = normalizeRecord_(raw);
      const existing = byId[rec.id];
      if (!existing || rec.updatedAt >= existing.updatedAt) byId[rec.id] = rec;
    }

    if (action === 'upsert' && body.record) {
      applyRecord(body.record);
    } else if (action === 'bulkSync' && Array.isArray(body.records)) {
      body.records.forEach(applyRecord);
    }

    const merged = Object.keys(byId).map(function (id) { return byId[id]; });
    writeAll_(merged);
    return jsonResponse_({ records: merged });
  } finally {
    lock.releaseLock();
  }
}
