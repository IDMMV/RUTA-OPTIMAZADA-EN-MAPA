const APP_FOLDER_NAME = 'Rutas de Inspección';
const STATE_FILE_NAME = 'datos-rutas-inspeccion.json';

function doGet() {
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
