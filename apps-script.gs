/** RUTAS DE INSPECCIÓN V13.20 - Usuarios, dashboard y programación */
const FOLDER='Rutas de Inspección';
const BOOK='Base Central - Rutas de Inspección';
const SHEETS={places:'Subestaciones',history:'Historial',users:'Usuarios',planners:'Planificadores',assignments:'Programacion',audit:'Auditoria',inspections:'Inspecciones',inspectionPhotos:'InspeccionFotos'};
const SCHEMA={
  Subestaciones:['id','feeder','substation','address','lat','lon','technician','createdAt','updatedAt','coordinateSource','validationStatus','validatedAt','validationAddress','previousLat','previousLon','status','inspectedAt','inspectedBy','resultReason','rescheduledFor','resultNote','resultAt','resultBy'],
  Historial:['id','date','user','feeder','substation','address','order','distance','duration','status','lat','lon','resultReason','rescheduledFor','resultNote','resultAt','resultBy'],
  Usuarios:['username','name','pinHash','role','active','technician','lastAccess','createdAt','updatedAt'],
  Planificadores:['userKey','userName','role','payload','updatedAt'],
  Programacion:['id','date','username','userName','technician','feeder','priority','substations','notes','status','createdBy','createdAt','updatedAt'],
  Auditoria:['id','date','username','action','entity','entityId','detail'],
  Inspecciones:['id','assetKey','feeder','substation','voltageLevel','address','lat','lon','inspector','username','date','status','answers','photoCount','reportUrl','createdAt','updatedAt'],
  InspeccionFotos:['id','inspectionId','assetKey','category','photoOrder','fileName','url','fileId','createdAt']
};
function doGet(e){try{const action=String(e.parameter.action||'all');let data={ok:true};if(action==='login'){return out_(login_(e.parameter.username,e.parameter.pin),e.parameter.callback)}if(action==='all'){data.places=readSheet_(SHEETS.places);data.history=readSheet_(SHEETS.history);data.users=safeUsers_();data.assignments=readSheet_(SHEETS.assignments);data.sheetUrl=getBook_().getUrl()}else if(action==='places')data.places=readSheet_(SHEETS.places);else if(action==='history')data.history=readSheet_(SHEETS.history);else if(action==='users')data.users=safeUsers_();else if(action==='assignments')data.assignments=readSheet_(SHEETS.assignments);else if(action==='planner'){const user=String(e.parameter.user||'');data.planner=readSheet_(SHEETS.planners).find(x=>String(x.userKey)===user)||null}else if(action==='inspections'){const key=String(e.parameter.assetKey||'').toUpperCase();const inspections=readSheet_(SHEETS.inspections).filter(x=>!key||String(x.assetKey).toUpperCase()===key);const photos=readSheet_(SHEETS.inspectionPhotos);data.inspections=inspections.map(r=>({...r,photos:photos.filter(p=>String(p.inspectionId)===String(r.id)).sort((a,b)=>Number(a.photoOrder)-Number(b.photoOrder))}))}return out_(data,e.parameter.callback)}catch(err){return out_({ok:false,error:err.message},e.parameter.callback)}}
function doPost(e){const lock=LockService.getScriptLock();lock.waitLock(10000);try{const b=JSON.parse((e.postData&&e.postData.contents)||'{}');if(b.action==='place')upsert_(SHEETS.places,b.payload,'id');if(b.action==='places'&&Array.isArray(b.payload))b.payload.forEach(x=>upsert_(SHEETS.places,x,'id'));if(b.action==='history')upsert_(SHEETS.history,b.payload,'id');if(b.action==='planner')upsert_(SHEETS.planners,b.payload,'userKey');if(b.action==='assignment')upsert_(SHEETS.assignments,b.payload,'id');if(b.action==='adminUser')saveUser_(b.payload);if(b.action==='audit')upsert_(SHEETS.audit,b.payload,'id');if(b.action==='inspection'){const p=b.payload||{};p.createdAt=p.createdAt||new Date().toISOString();p.updatedAt=new Date().toISOString();upsert_(SHEETS.inspections,p,'id')}if(b.action==='inspectionPhoto')saveInspectionPhoto_(b.payload||{});return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON)}catch(err){return ContentService.createTextOutput(JSON.stringify({ok:false,error:err.message})).setMimeType(ContentService.MimeType.JSON)}finally{lock.releaseLock()}}
function hash_(s){const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(s||''),Utilities.Charset.UTF_8);return bytes.map(b=>(b+256)%256).map(b=>('0'+b.toString(16)).slice(-2)).join('')}
function login_(username,pin){
  const normalized=String(username||'').trim().toLowerCase();
  const users=readSheet_(SHEETS.users);
  const u=users.find(x=>String(x.username||'').trim().toLowerCase()===normalized);
  if(!u||String(u.active).toLowerCase()==='false')return{ok:false,error:'Cuenta inexistente o bloqueada.'};
  let stored=String(u.pinHash||'').trim();
  // Migración automática desde versiones antiguas que guardaban PIN en texto o no tenían pinHash.
  if(!stored&&u.pin){stored=hash_(u.pin);u.pinHash=stored;delete u.pin;upsert_(SHEETS.users,u,'username')}
  if(!stored&&normalized==='admin'&&String(pin)==='1234'){
    u.pinHash=hash_('1234');u.role='Administrador';u.active=true;u.name=u.name||'Administrador';u.technician=u.technician||'Administrador';u.updatedAt=new Date().toISOString();
    upsert_(SHEETS.users,u,'username');stored=u.pinHash;
  }
  if(stored!==hash_(pin))return{ok:false,error:'Usuario o PIN incorrecto.'};
  u.lastAccess=new Date().toISOString();upsert_(SHEETS.users,u,'username');
  return{ok:true,user:{username:u.username,name:u.name,role:u.role,technician:u.technician||u.name,active:true}}
}
function safeUsers_(){return readSheet_(SHEETS.users).map(({pinHash,...u})=>u)}
function saveUser_(obj){if(!obj||!obj.username)return;const existing=readSheet_(SHEETS.users).find(x=>String(x.username)===String(obj.username))||{};const row={...existing,...obj,username:String(obj.username).toLowerCase(),updatedAt:new Date().toISOString()};if(obj.pin)row.pinHash=hash_(obj.pin);delete row.pin;row.active=row.active===false||String(row.active).toLowerCase()==='false'?false:true;if(!row.createdAt)row.createdAt=new Date().toISOString();upsert_(SHEETS.users,row,'username')}
function getBook_(){const props=PropertiesService.getScriptProperties();const id=props.getProperty('BOOK_ID');if(id){try{const ss=SpreadsheetApp.openById(id);ensureSchema_(ss);ensureAdmin_();return ss}catch(e){}}const folders=DriveApp.getFoldersByName(FOLDER);const folder=folders.hasNext()?folders.next():DriveApp.createFolder(FOLDER);const ss=SpreadsheetApp.create(BOOK);DriveApp.getFileById(ss.getId()).moveTo(folder);props.setProperty('BOOK_ID',ss.getId());setup_(ss);ensureAdmin_();return ss}
function setup_(ss){Object.keys(SCHEMA).forEach((n,i)=>{let sh=i===0?ss.getSheets()[0]:ss.insertSheet();sh.setName(n);sh.getRange(1,1,1,SCHEMA[n].length).setValues([SCHEMA[n]]).setFontWeight('bold').setBackground('#dbeafe');sh.setFrozenRows(1);sh.autoResizeColumns(1,SCHEMA[n].length)})}
function ensureSchema_(ss){Object.keys(SCHEMA).forEach(name=>{let sh=ss.getSheetByName(name);if(!sh){sh=ss.insertSheet(name);sh.getRange(1,1,1,SCHEMA[name].length).setValues([SCHEMA[name]]).setFontWeight('bold').setBackground('#dbeafe');sh.setFrozenRows(1);return}const last=Math.max(1,sh.getLastColumn());const current=sh.getRange(1,1,1,last).getValues()[0].filter(String);const missing=SCHEMA[name].filter(h=>!current.includes(h));if(missing.length)sh.getRange(1,current.length+1,1,missing.length).setValues([missing]).setFontWeight('bold').setBackground('#dbeafe')})}
function ensureAdmin_(){
  const ss=SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('BOOK_ID'));
  const sh=ss.getSheetByName(SHEETS.users);
  const values=sh.getDataRange().getValues();
  const headers=values[0]||SCHEMA.Usuarios;
  const uidx=headers.indexOf('username');
  const pidx=headers.indexOf('pinHash');
  const now=new Date().toISOString();
  let rowIndex=-1;
  for(let i=1;i<values.length;i++)if(String(values[i][uidx]||'').trim().toLowerCase()==='admin'){rowIndex=i+1;break}
  if(rowIndex<0){
    const admin={username:'admin',name:'Administrador',pinHash:hash_('1234'),role:'Administrador',active:true,technician:'Administrador',lastAccess:'',createdAt:now,updatedAt:now};
    sh.appendRow(headers.map(h=>admin[h]??''));return;
  }
  // Repara cuentas admin antiguas sin hash, sin alterar un PIN moderno ya configurado.
  const row=sh.getRange(rowIndex,1,1,headers.length).getValues()[0];
  const obj={};headers.forEach((h,i)=>obj[h]=row[i]);
  const hash=String(obj.pinHash||'').trim();
  if(!hash||hash.length!==64){obj.pinHash=hash_('1234')}
  obj.name=obj.name||'Administrador';obj.role='Administrador';obj.active=true;obj.technician=obj.technician||'Administrador';obj.updatedAt=now;
  sh.getRange(rowIndex,1,1,headers.length).setValues([headers.map(h=>obj[h]??'')]);
}
function resetAdminAccess(){
  const ss=getBook_();ensureSchema_(ss);
  const sh=ss.getSheetByName(SHEETS.users);const values=sh.getDataRange().getValues();const headers=values[0];
  const uidx=headers.indexOf('username');let rowIndex=-1;
  for(let i=1;i<values.length;i++)if(String(values[i][uidx]||'').trim().toLowerCase()==='admin'){rowIndex=i+1;break}
  const now=new Date().toISOString();const admin={username:'admin',name:'Administrador',pinHash:hash_('1234'),role:'Administrador',active:true,technician:'Administrador',lastAccess:'',createdAt:now,updatedAt:now};
  const vals=headers.map(h=>admin[h]??'');
  if(rowIndex>0)sh.getRange(rowIndex,1,1,headers.length).setValues([vals]);else sh.appendRow(vals);
  return 'Acceso restablecido: admin / 1234';
}
function readSheet_(name){const sh=getBook_().getSheetByName(name);const v=sh.getDataRange().getValues();if(v.length<2)return[];const h=v[0];return v.slice(1).filter(r=>r.some(x=>x!=='' )).map(r=>{const o={};h.forEach((k,i)=>o[k]=r[i]);return o})}
function upsert_(name,obj,key){if(!obj)return;const sh=getBook_().getSheetByName(name);const v=sh.getDataRange().getValues();const h=v[0];const idx=h.indexOf(key);let row=-1;for(let i=1;i<v.length;i++)if(String(v[i][idx])===String(obj[key])){row=i+1;break}const vals=h.map(k=>obj[k]??'');if(row>0)sh.getRange(row,1,1,h.length).setValues([vals]);else sh.appendRow(vals)}
function out_(obj,cb){const json=JSON.stringify(obj);if(cb)return ContentService.createTextOutput(`${cb}(${json})`).setMimeType(ContentService.MimeType.JAVASCRIPT);return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON)}
function initializeDatabase(){const ss=getBook_();ensureSchema_(ss);ensureAdmin_();return ss.getUrl()}


function inspectionFolder_(){
  const rootName='Inspecciones MT';
  const roots=DriveApp.getFoldersByName(rootName);
  return roots.hasNext()?roots.next():DriveApp.createFolder(rootName);
}
function childFolder_(parent,name){const it=parent.getFoldersByName(name);return it.hasNext()?it.next():parent.createFolder(name)}
function saveInspectionPhoto_(p){
  if(!p.inspectionId||!p.dataUrl)return;
  const m=String(p.dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);if(!m)return;
  const bytes=Utilities.base64Decode(m[2]);const mime=m[1];
  const year=String(new Date().getFullYear());const asset=(p.assetKey||'SIN-CODIGO').replace(/[^a-zA-Z0-9_-]+/g,'_');
  const folder=childFolder_(childFolder_(childFolder_(inspectionFolder_(),year),asset),String(p.inspectionId));
  const file=folder.createFile(Utilities.newBlob(bytes,mime,p.fileName||('foto-'+Date.now()+'.jpg')));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
  const row={id:String(p.inspectionId)+'-'+String(p.photoOrder||Date.now()),inspectionId:p.inspectionId,assetKey:p.assetKey||'',category:p.category||'',photoOrder:p.photoOrder||'',fileName:file.getName(),url:'https://drive.google.com/uc?export=view&id='+file.getId(),fileId:file.getId(),createdAt:p.createdAt||new Date().toISOString()};
  upsert_(SHEETS.inspectionPhotos,row,'id');
}
