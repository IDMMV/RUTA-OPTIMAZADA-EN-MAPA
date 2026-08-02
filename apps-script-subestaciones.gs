/**
 * ESTE ES TU SCRIPT ACTUAL + lo necesario para sincronizar el catálogo de
 * subestaciones (SE) de Rutas de Inspección. No se tocó nada de lo que ya
 * tenías (loadAppState / saveAppState / deleteAppState siguen igual);
 * solo se reemplazó doGet por una versión que además puede responder JSON,
 * y se agregó doPost + funciones nuevas al final.
 *
 * QUÉ HACER:
 * 1. Abre tu proyecto de Apps Script (el que ya tiene este código).
 * 2. Reemplaza TODO el contenido de tu archivo .gs por este archivo completo.
 * 3. Guarda (ícono de disquete).
 * 4. Implementar → Gestionar implementaciones → ✏️ (editar) tu implementación
 *    existente → en "Versión" elige "Nueva versión" → Implementar.
 *    (Esto actualiza el código SIN cambiarte la URL /exec que ya tenías.)
 * 5. Usa esa misma URL /exec en la app, en Configuración → Sincronizar SE.
 */

const APP_FOLDER_NAME = 'Rutas de Inspección';
const STATE_FILE_NAME = 'datos-rutas-inspeccion.json';
const PLACES_FILE_NAME = 'subestaciones-rutas-inspeccion.json';

function doGet(e) {
  // Si viene ?action=places, responde el catálogo de subestaciones en JSON
  // (llamado por fetch() desde la web, no abre ninguna pantalla).
  if (e && e.parameter && e.parameter.action === 'places') {
    return jsonResponse_({ records: readPlaces_() });
  }
  // Comportamiento original: sirve la página HTML de la app.
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Rutas de Inspección')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function loadAppState() {
  const file = getStateFile_();
  return {
    data: file ? file.getBlob().getDataAsString('UTF-8') : '',
    updatedAt: file ? file.getLastUpdated().toISOString() : null,
    folderUrl: getOrCreateFolder_().getUrl()
  };
}

function saveAppState(jsonText) {
  if (typeof jsonText !== 'string' || jsonText.length > 5000000) {
    throw new Error('Los datos enviados no son válidos o exceden el límite permitido.');
  }
  JSON.parse(jsonText);
  const folder = getOrCreateFolder_();
  const file = getStateFile_();
  if (file) {
    file.setContent(jsonText);
  } else {
    folder.createFile(STATE_FILE_NAME, jsonText, MimeType.PLAIN_TEXT);
  }
  return { ok: true, savedAt: new Date().toISOString(), folderUrl: folder.getUrl() };
}

function deleteAppState() {
  const file = getStateFile_();
  if (file) file.setTrashed(true);
  return { ok: true };
}

function getOrCreateFolder_() {
  const folders = DriveApp.getFoldersByName(APP_FOLDER_NAME);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(APP_FOLDER_NAME);
}

function getStateFile_() {
  const folder = getOrCreateFolder_();
  const files = folder.getFilesByName(STATE_FILE_NAME);
  return files.hasNext() ? files.next() : null;
}

// ---------------------------------------------------------------------
// A partir de aquí: nuevo, para sincronizar el catálogo de subestaciones
// entre dispositivos. Usa un archivo JSON aparte en la misma carpeta,
// así no toca ni reemplaza tu respaldo completo (datos-rutas-inspeccion.json).
// ---------------------------------------------------------------------

// POST: recibe { action:'upsert', record } o { action:'bulkSync', records:[...] }
// y responde con el catálogo ya fusionado (gana el registro con updatedAt
// más reciente por id). Es lo que llama la app desde Configuración → Sincronizar SE.
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || '{}');
    const action = body.action;
    const current = readPlaces_();
    const byId = {};
    current.forEach(function (r) { byId[r.id] = r; });

    function applyRecord(raw) {
      const rec = normalizePlace_(raw);
      const existing = byId[rec.id];
      if (!existing || rec.updatedAt >= existing.updatedAt) byId[rec.id] = rec;
    }

    if (action === 'upsert' && body.record) {
      applyRecord(body.record);
    } else if (action === 'bulkSync' && Array.isArray(body.records)) {
      body.records.forEach(applyRecord);
    }

    const merged = Object.keys(byId).map(function (id) { return byId[id]; });
    writePlaces_(merged);
    return jsonResponse_({ records: merged });
  } finally {
    lock.releaseLock();
  }
}

function getPlacesFile_() {
  const folder = getOrCreateFolder_();
  const files = folder.getFilesByName(PLACES_FILE_NAME);
  return files.hasNext() ? files.next() : null;
}

function readPlaces_() {
  const file = getPlacesFile_();
  if (!file) return [];
  try {
    const data = JSON.parse(file.getBlob().getDataAsString('UTF-8'));
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}

function writePlaces_(records) {
  const folder = getOrCreateFolder_();
  const file = getPlacesFile_();
  const json = JSON.stringify(records);
  if (file) {
    file.setContent(json);
  } else {
    folder.createFile(PLACES_FILE_NAME, json, MimeType.PLAIN_TEXT);
  }
}

function normalizePlace_(raw) {
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
