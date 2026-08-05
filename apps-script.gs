/** RUTAS DE INSPECCIÓN V13.41 - Usuarios, dashboard y programación */
const FOLDER='Rutas de Inspección';
const BOOK='Base Central - Rutas de Inspección';
const SHEETS={places:'Subestaciones',history:'Historial',users:'Usuarios',planners:'Planificadores',assignments:'Programacion',audit:'Auditoria',sessions:'Sesiones',inspections:'Inspecciones',inspectionPhotos:'InspeccionFotos'};
let BOOK_CACHE_=null;
const SCHEMA={
  Subestaciones:['id','feeder','substation','address','lat','lon','technician','createdAt','updatedAt','coordinateSource','validationStatus','validatedAt','validationAddress','previousLat','previousLon','status','inspectedAt','inspectedBy','resultReason','rescheduledFor','resultNote','resultAt','resultBy'],
  Historial:['id','date','user','feeder','substation','address','order','distance','duration','status','lat','lon','resultReason','rescheduledFor','resultNote','resultAt','resultBy'],
  Usuarios:['username','name','pinHash','role','active','blocked','deleted','protected','technician','email','preferences','mustChangePin','recoveryCodeHash','recoveryExpires','createdBy','lastAccess','lastActivity','deletedAt','deletedBy','createdAt','updatedAt'],
  Planificadores:['userKey','userName','role','payload','updatedAt'],
  Programacion:['id','date','username','userName','technician','feeder','priority','substations','notes','status','createdBy','createdAt','updatedAt'],
  Auditoria:['id','date','username','action','entity','entityId','detail'],
  Sesiones:['token','username','expiresAt','createdAt','updatedAt'],
  Inspecciones:['id','assetKey','feeder','substation','voltageLevel','address','lat','lon','inspector','username','date','status','answers','photoCount','reportUrl','createdAt','updatedAt'],
  InspeccionFotos:['id','inspectionId','assetKey','category','photoOrder','fileName','url','fileId','createdAt']
};
function doGet(e){
  try{
    const action=String(e.parameter.action||'bootstrap');
    let data={ok:true};
    if(action==='login')return out_(login_(e.parameter.username,e.parameter.pin),e.parameter.callback);
    if(action==='requestReset')return out_(requestReset_(e.parameter.username),e.parameter.callback);
    if(action==='confirmReset')return out_(confirmReset_(e.parameter.username,e.parameter.code,e.parameter.pin),e.parameter.callback);
    const session=validateSession_(e.parameter.token||'');
    if(!session)return out_({ok:false,error:'Sesión inválida o vencida.'},e.parameter.callback);
    const current=findUser_(session.username);
    const admin=isAdminRole_(current&&current.role);
    if(action==='bootstrap'||action==='all'){
      data.history=readSheet_(SHEETS.history);
      const assignments=readSheet_(SHEETS.assignments);
      const inspections=readSheet_(SHEETS.inspections);
      data.assignments=admin?assignments:assignments.filter(x=>String(x.username)===String(session.username));
      data.inspections=admin?inspections:inspections.filter(x=>String(x.username)===String(session.username));
      data.users=admin?safeUsers_():[];
      data.currentUser=safeUser_(current);
      data.sheetUrl=admin?getBook_().getUrl():'';
      if(action==='all')data.places=readSheet_(SHEETS.places).slice(0,1000);
    }else if(action==='placesPage'){
      const offset=Math.max(0,Number(e.parameter.offset)||0);
      const limit=Math.min(1500,Math.max(100,Number(e.parameter.limit)||1000));
      const page=readSheetPage_(SHEETS.places,offset,limit);
      data.places=page.rows;data.offset=offset;data.limit=limit;data.total=page.total;data.hasMore=offset+page.rows.length<page.total;
    }else if(action==='places')data.places=readSheet_(SHEETS.places);
    else if(action==='history')data.history=readSheet_(SHEETS.history);
    else if(action==='users'){if(!admin)throw Error('Acceso restringido');data.users=safeUsers_()}
    else if(action==='assignments'){const rows=readSheet_(SHEETS.assignments);data.assignments=admin?rows:rows.filter(x=>String(x.username)===String(session.username))}
    else if(action==='planner'){const user=String(e.parameter.user||session.username);if(!admin&&user!==session.username)throw Error('Acceso restringido');data.planner=readSheet_(SHEETS.planners).find(x=>String(x.userKey)===user)||null}
    else if(action==='inspections'){const key=String(e.parameter.assetKey||'').toUpperCase();let inspections=readSheet_(SHEETS.inspections).filter(x=>!key||String(x.assetKey).toUpperCase()===key);if(!admin)inspections=inspections.filter(x=>String(x.username)===String(session.username));const photos=readSheet_(SHEETS.inspectionPhotos);data.inspections=inspections.map(r=>({...r,photos:photos.filter(p=>String(p.inspectionId)===String(r.id)).sort((a,b)=>Number(a.photoOrder)-Number(b.photoOrder))}))}
    return out_(data,e.parameter.callback)
  }catch(err){return out_({ok:false,error:err.message},e.parameter.callback)}
}
function doPost(e){const lock=LockService.getScriptLock();lock.waitLock(10000);try{const b=JSON.parse((e.postData&&e.postData.contents)||'{}');const session=validateSession_(b.token||'');if(!session)throw Error('Sesión inválida o vencida.');const actor=findUser_(session.username);if(!actor||String(actor.active).toLowerCase()==='false'||String(actor.deleted).toLowerCase()==='true')throw Error('Cuenta sin acceso.');const admin=isAdminRole_(actor.role);if(b.action==='place')upsert_(SHEETS.places,b.payload,'id');if(b.action==='places'&&Array.isArray(b.payload))b.payload.forEach(x=>upsert_(SHEETS.places,x,'id'));if(b.action==='history')upsert_(SHEETS.history,b.payload,'id');if(b.action==='planner')upsert_(SHEETS.planners,b.payload,'userKey');if(b.action==='assignment'){if(!admin)throw Error('Acceso restringido');upsert_(SHEETS.assignments,b.payload,'id')}if(b.action==='adminUser'){if(!admin)throw Error('Acceso restringido');saveUser_(b.payload,actor)}if(b.action==='preferences')savePreferences_(actor.username,b.payload&&b.payload.preferences);if(b.action==='transferPrimary'){if(!String(actor.role||'').toLowerCase().includes('principal'))throw Error('Solo el Administrador principal puede transferir el control.');transferPrimary_(actor,b.payload&&b.payload.targetUsername);}if(b.action==='audit')upsert_(SHEETS.audit,b.payload,'id');if(b.action==='inspection'){const p=b.payload||{};p.createdAt=p.createdAt||new Date().toISOString();p.updatedAt=new Date().toISOString();upsert_(SHEETS.inspections,p,'id')}if(b.action==='inspectionPhoto')saveInspectionPhoto_(b.payload||{});touchUser_(actor.username);return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON)}catch(err){return ContentService.createTextOutput(JSON.stringify({ok:false,error:err.message})).setMimeType(ContentService.MimeType.JSON)}finally{lock.releaseLock()}}
function hash_(s){const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(s||''),Utilities.Charset.UTF_8);return bytes.map(b=>(b+256)%256).map(b=>('0'+b.toString(16)).slice(-2)).join('')}
function login_(username,pin){const normalized=String(username||'').trim().toLowerCase();const u=findUser_(normalized);if(!u||String(u.active).toLowerCase()==='false'||String(u.blocked).toLowerCase()==='true'||String(u.deleted).toLowerCase()==='true')return{ok:false,error:'Cuenta inexistente, bloqueada o inactiva.'};let stored=String(u.pinHash||'').trim();if(!stored&&u.pin){stored=hash_(u.pin);u.pinHash=stored;delete u.pin;upsert_(SHEETS.users,u,'username')}if(!stored&&normalized==='admin'&&String(pin)==='1234'){u.pinHash=hash_('1234');u.role='Administrador principal';u.protected=true;u.active=true;u.name=u.name||'Administrador';u.technician=u.technician||'Administrador';u.updatedAt=new Date().toISOString();upsert_(SHEETS.users,u,'username');stored=u.pinHash}if(stored!==hash_(pin))return{ok:false,error:'Usuario o PIN incorrecto.'};const token=Utilities.getUuid()+Utilities.getUuid().replace(/-/g,'');const now=new Date();const expires=new Date(now.getTime()+30*24*60*60*1000).toISOString();upsert_(SHEETS.sessions,{token,username:u.username,expiresAt:expires,createdAt:now.toISOString(),updatedAt:now.toISOString()},'token');u.lastAccess=now.toISOString();u.lastActivity=now.toISOString();upsert_(SHEETS.users,u,'username');return{ok:true,user:{...safeUser_(u),token,sessionExpires:expires}}}

function requestReset_(username){
  const u=findUser_(username);if(!u||String(u.active).toLowerCase()==='false'||String(u.blocked).toLowerCase()==='true'||String(u.deleted).toLowerCase()==='true')return{ok:false,error:'Cuenta inexistente o sin acceso.'};
  const email=String(u.email||'').trim();if(!email)return{ok:false,error:'La cuenta no tiene correo de recuperación. Contacta al Administrador.'};
  const code=String(Math.floor(100000+Math.random()*900000));u.recoveryCodeHash=hash_(code);u.recoveryExpires=new Date(Date.now()+10*60*1000).toISOString();u.updatedAt=new Date().toISOString();upsert_(SHEETS.users,u,'username');
  MailApp.sendEmail({to:email,subject:'Código de recuperación - Rutas de Inspección',htmlBody:'<p>Tu código de recuperación es:</p><h2 style="letter-spacing:4px">'+code+'</h2><p>Vence en 10 minutos.</p><p>Si no solicitaste este cambio, ignora este mensaje.</p>'});
  return{ok:true,message:'Código enviado a '+maskEmail_(email)};
}
function confirmReset_(username,code,pin){
  const u=findUser_(username);if(!u)return{ok:false,error:'Usuario no encontrado.'};if(String(pin||'').length<4)return{ok:false,error:'La nueva contraseña debe tener al menos 4 caracteres.'};
  if(!u.recoveryCodeHash||u.recoveryCodeHash!==hash_(code)||new Date(u.recoveryExpires||0).getTime()<Date.now())return{ok:false,error:'Código incorrecto o vencido.'};
  u.pinHash=hash_(pin);u.recoveryCodeHash='';u.recoveryExpires='';u.mustChangePin=false;u.updatedAt=new Date().toISOString();upsert_(SHEETS.users,u,'username');return{ok:true};
}
function maskEmail_(email){const p=String(email).split('@');if(p.length!==2)return 'tu correo registrado';return p[0].slice(0,2)+'***@'+p[1]}

function findUser_(username){const n=String(username||'').trim().toLowerCase();return readSheet_(SHEETS.users).find(x=>String(x.username||'').trim().toLowerCase()===n)||null}
function isAdminRole_(role){const r=String(role||'').toLowerCase();return r.includes('administrador')}
function safeUser_(u){if(!u)return null;const {pinHash,...safe}=u;return safe}
function safeUsers_(){return readSheet_(SHEETS.users).map(safeUser_)}
function validateSession_(token){if(!token)return null;const row=readSheet_(SHEETS.sessions).find(x=>String(x.token)===String(token));if(!row)return null;if(new Date(row.expiresAt).getTime()<Date.now())return null;return row}
function touchUser_(username){const u=findUser_(username);if(!u)return;u.lastActivity=new Date().toISOString();upsert_(SHEETS.users,u,'username')}
function transferPrimary_(actor,targetUsername){const target=findUser_(targetUsername);if(!target)throw Error('Usuario destino no encontrado.');if(String(target.deleted).toLowerCase()==='true')throw Error('No se puede transferir a una cuenta eliminada.');target.role='Administrador principal';target.protected=true;target.active=true;target.blocked=false;target.deleted=false;target.updatedAt=new Date().toISOString();upsert_(SHEETS.users,target,'username');const current=findUser_(actor.username);current.role='Administrador secundario';current.protected=false;current.updatedAt=new Date().toISOString();upsert_(SHEETS.users,current,'username');upsert_(SHEETS.audit,{id:Utilities.getUuid(),date:new Date().toISOString(),username:actor.username,action:'TRANSFERIR_ADMIN_PRINCIPAL',entity:'Usuario',entityId:target.username,detail:'Nuevo Administrador principal'},'id')}
function savePreferences_(username,prefs){const u=findUser_(username);if(!u)return;u.preferences=JSON.stringify(prefs||{});u.updatedAt=new Date().toISOString();upsert_(SHEETS.users,u,'username')}

function saveUser_(obj,actor){if(!obj||!obj.username)return;const existing=findUser_(obj.username)||{};const existingPrimary=String(existing.protected).toLowerCase()==='true'||String(existing.role||'').toLowerCase().includes('principal');if(existingPrimary&&String(actor.username)!==String(existing.username))throw Error('La cuenta principal está protegida.');let requestedRole=String(obj.role||existing.role||'Inspector');if(requestedRole.toLowerCase().includes('principal')&&!String(actor.role||'').toLowerCase().includes('principal'))throw Error('Solo el Administrador principal puede asignar ese rol.');const row={...existing,...obj,username:String(obj.username).toLowerCase(),updatedAt:new Date().toISOString()};if(obj.pin)row.pinHash=hash_(obj.pin);delete row.pin;if(existingPrimary){row.role='Administrador principal';row.protected=true;row.active=true;row.blocked=false;row.deleted=false}row.active=row.active===false||String(row.active).toLowerCase()==='false'?false:true;row.blocked=String(row.blocked).toLowerCase()==='true';row.deleted=String(row.deleted).toLowerCase()==='true';row.protected=String(row.protected).toLowerCase()==='true';if(!row.createdAt)row.createdAt=new Date().toISOString();if(!row.createdBy)row.createdBy=actor.username;upsert_(SHEETS.users,row,'username');upsert_(SHEETS.audit,{id:Utilities.getUuid(),date:new Date().toISOString(),username:actor.username,action:'GESTION_USUARIO',entity:'Usuario',entityId:row.username,detail:JSON.stringify({role:row.role,active:row.active,blocked:row.blocked,deleted:row.deleted})},'id')}
function getBook_(){
  if(BOOK_CACHE_)return BOOK_CACHE_;
  const props=PropertiesService.getScriptProperties();
  const id=props.getProperty('BOOK_ID');
  if(id){
    try{BOOK_CACHE_=SpreadsheetApp.openById(id);return BOOK_CACHE_}catch(e){}
  }
  const folders=DriveApp.getFoldersByName(FOLDER);
  const folder=folders.hasNext()?folders.next():DriveApp.createFolder(FOLDER);
  const ss=SpreadsheetApp.create(BOOK);
  DriveApp.getFileById(ss.getId()).moveTo(folder);
  props.setProperty('BOOK_ID',ss.getId());
  BOOK_CACHE_=ss;
  setup_(ss);
  ensureAdmin_();
  return ss;
}
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
    const admin={username:'admin',name:'Administrador',pinHash:hash_('1234'),role:'Administrador principal',active:true,blocked:false,deleted:false,protected:true,technician:'Administrador',lastAccess:'',createdAt:now,updatedAt:now};
    sh.appendRow(headers.map(h=>admin[h]??''));return;
  }
  // Repara cuentas admin antiguas sin hash, sin alterar un PIN moderno ya configurado.
  const row=sh.getRange(rowIndex,1,1,headers.length).getValues()[0];
  const obj={};headers.forEach((h,i)=>obj[h]=row[i]);
  const hash=String(obj.pinHash||'').trim();
  if(!hash||hash.length!==64){obj.pinHash=hash_('1234')}
  obj.name=obj.name||'Administrador';obj.role='Administrador principal';obj.active=true;obj.blocked=false;obj.deleted=false;obj.protected=true;obj.technician=obj.technician||'Administrador';obj.updatedAt=now;
  sh.getRange(rowIndex,1,1,headers.length).setValues([headers.map(h=>obj[h]??'')]);
}
function resetAdminAccess(){
  const ss=getBook_();ensureSchema_(ss);
  const sh=ss.getSheetByName(SHEETS.users);const values=sh.getDataRange().getValues();const headers=values[0];
  const uidx=headers.indexOf('username');let rowIndex=-1;
  for(let i=1;i<values.length;i++)if(String(values[i][uidx]||'').trim().toLowerCase()==='admin'){rowIndex=i+1;break}
  const now=new Date().toISOString();const admin={username:'admin',name:'Administrador',pinHash:hash_('1234'),role:'Administrador principal',active:true,blocked:false,deleted:false,protected:true,technician:'Administrador',lastAccess:'',createdAt:now,updatedAt:now};
  const vals=headers.map(h=>admin[h]??'');
  if(rowIndex>0)sh.getRange(rowIndex,1,1,headers.length).setValues([vals]);else sh.appendRow(vals);
  return 'Acceso restablecido: admin / 1234';
}
function readSheetPage_(name,offset,limit){
  const sh=getBook_().getSheetByName(name);
  const lastRow=sh.getLastRow(),lastCol=sh.getLastColumn();
  if(lastRow<2||lastCol<1)return{rows:[],total:0};
  const headers=sh.getRange(1,1,1,lastCol).getValues()[0];
  const total=lastRow-1;
  if(offset>=total)return{rows:[],total};
  const count=Math.min(limit,total-offset);
  const values=sh.getRange(offset+2,1,count,lastCol).getValues();
  const rows=values.filter(r=>r.some(x=>x!=='' )).map(r=>{const o={};headers.forEach((k,i)=>o[k]=r[i]);return o});
  return{rows,total};
}
function readSheet_(name){const sh=getBook_().getSheetByName(name);const v=sh.getDataRange().getValues();if(v.length<2)return[];const h=v[0];return v.slice(1).filter(r=>r.some(x=>x!=='' )).map(r=>{const o={};h.forEach((k,i)=>o[k]=r[i]);return o})}
function upsert_(name,obj,key){if(!obj)return;const sh=getBook_().getSheetByName(name);const v=sh.getDataRange().getValues();const h=v[0];const idx=h.indexOf(key);let row=-1;for(let i=1;i<v.length;i++)if(String(v[i][idx])===String(obj[key])){row=i+1;break}const vals=h.map(k=>obj[k]??'');if(row>0)sh.getRange(row,1,1,h.length).setValues([vals]);else sh.appendRow(vals)}
function out_(obj,cb){const json=JSON.stringify(obj);if(cb)return ContentService.createTextOutput(`${cb}(${json})`).setMimeType(ContentService.MimeType.JAVASCRIPT);return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON)}
function initializeDatabase(){const ss=getBook_();ensureSchema_(ss);repairUsersSheet_();ensureAdmin_();return ss.getUrl()}
function repairUsersSheet_(){
  const ss=getBook_();
  let sh=ss.getSheetByName(SHEETS.users);
  if(!sh){sh=ss.insertSheet(SHEETS.users);sh.getRange(1,1,1,SCHEMA.Usuarios.length).setValues([SCHEMA.Usuarios]);return}
  const values=sh.getDataRange().getValues();
  if(!values.length)return;
  const oldHeaders=values[0].map(x=>String(x||'').trim());
  const rows=values.slice(1).filter(r=>r.some(v=>v!==''));
  const normalized=rows.map(r=>{const o={};oldHeaders.forEach((h,i)=>{if(h)o[h]=r[i]});return SCHEMA.Usuarios.map(h=>o[h]??'')});
  sh.clearContents();
  sh.getRange(1,1,1,SCHEMA.Usuarios.length).setValues([SCHEMA.Usuarios]).setFontWeight('bold').setBackground('#dbeafe');
  if(normalized.length)sh.getRange(2,1,normalized.length,SCHEMA.Usuarios.length).setValues(normalized);
  sh.setFrozenRows(1);sh.autoResizeColumns(1,SCHEMA.Usuarios.length);
}
function repairUserDatabase(){const ss=getBook_();ensureSchema_(ss);repairUsersSheet_();ensureAdmin_();return 'Usuarios reparados. Prueba admin / 1234.'}


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
  // Archivo privado por defecto. El acceso se controla desde la cuenta propietaria y el sistema.
  const row={id:String(p.inspectionId)+'-'+String(p.photoOrder||Date.now()),inspectionId:p.inspectionId,assetKey:p.assetKey||'',category:p.category||'',photoOrder:p.photoOrder||'',fileName:file.getName(),url:'',fileId:file.getId(),createdAt:p.createdAt||new Date().toISOString()};
  upsert_(SHEETS.inspectionPhotos,row,'id');
}
