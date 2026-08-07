/* Rutas de Inspección V14.0-alpha3
   Motor final del Mapa General.
   Principios tomados de la versión React estable del usuario:
   - una sola instancia Leaflet
   - Canvas
   - índice espacial por viewport
   - layerGroup persistente
   - render con debounce solo al terminar pan/zoom
   - cero reconstrucción del mapa durante búsquedas. */
(()=>{
'use strict';
const VERSION='14.0-alpha3';
const $=id=>document.getElementById(id);
const valid=x=>x&&Number.isFinite(+x.lat)&&Number.isFinite(+x.lon);
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const textCache=new WeakMap(),digitsCache=new WeakMap();
let index=new (window.RISpatialGridIndex||class{setItems(){} getInBounds(){return[]}})(.02);
let sourceRef=null,sourceLen=-1,canvas=null,moveTimer=0,inputTimer=0,boundMap=null,lastMatches=[];
const telemetry={version:VERSION,indexMs:0,renderMs:0,filterMs:0,visible:0,total:0,renders:0};

function catalog(){return Array.isArray(window.state?.catalog)?window.state.catalog:[]}
function isGeneralActive(){return $('generalmap')?.classList.contains('active')}
function info(msg){const el=$('generalMapInfo');if(el)el.textContent=msg}
function fields(){return {q:($('gmSearch')?.value||'').trim(),feeder:$('gmFeeder')?.value||'',tech:($('gmTech')?.value||'').trim(),date:$('gmDate')?.value||''}}
function filteredMode(){const f=fields();return !!(f.q||f.feeder||f.tech||f.date)}
function indexedText(x){let v=textCache.get(x);if(v===undefined){v=norm([x.feeder,x.substation,x.address,x.technician].join(' '));textCache.set(x,v)}return v}
function subDigits(x){let v=digitsCache.get(x);if(v===undefined){v=String(x.substation||'').replace(/\D/g,'');digitsCache.set(x,v)}return v}
function ensureIndex(){
  const cat=catalog();if(sourceRef===cat&&sourceLen===cat.length)return;
  const t=performance.now();index.setItems(cat);sourceRef=cat;sourceLen=cat.length;telemetry.total=cat.length;telemetry.indexMs=+(performance.now()-t).toFixed(1);
}
function ensureMap(){
  let gm=null;try{gm=typeof window.initGeneralMap==='function'?window.initGeneralMap(false):window.generalMap}catch(e){console.error('[V14] init map',e)}
  if(!gm)return null;
  if(!canvas&&window.L)canvas=L.canvas({padding:.5});
  if(boundMap!==gm){
    if(boundMap&&boundMap.__v14MoveHandler){try{boundMap.off('moveend zoomend',boundMap.__v14MoveHandler)}catch{}}
    const handler=()=>{if(!isGeneralActive()||filteredMode())return;clearTimeout(moveTimer);moveTimer=setTimeout(()=>render(false),60)};
    gm.on('moveend zoomend',handler);gm.__v14MoveHandler=handler;boundMap=gm;
  }
  return gm;
}
function filterAll(rows){
  const t=performance.now(),f=fields(),qn=norm(f.q),digitsOnly=/^\d+$/.test(f.q),tn=norm(f.tech),out=[];
  for(const x of rows){
    if(!valid(x))continue;
    if(f.q){if(digitsOnly){if(!subDigits(x).includes(f.q))continue}else if(!indexedText(x).includes(qn))continue}
    if(f.feeder&&String(x.feeder||'')!==f.feeder)continue;
    if(tn&&!norm(x.technician).includes(tn))continue;
    if(f.date&&typeof window.catalogDate==='function'&&window.catalogDate(x)!==f.date)continue;
    out.push(x);
  }
  telemetry.filterMs=+(performance.now()-t).toFixed(1);return out;
}
function statusColor(x){
  let k='';try{k=typeof window.statusKey==='function'?window.statusKey(x.status):norm(x.status)}catch{}
  if(k==='pending'&&typeof window.inRoute==='function'&&window.inRoute(x))k='inroute';
  return ({pending:'#94a3b8',inroute:'#2563eb',inspected:'#16a34a',notinspected:'#dc2626',rescheduled:'#f59e0b',observed:'#7c3aed',inspeccionada:'#16a34a',observada:'#7c3aed',reprogramada:'#f59e0b'}[k]||'#94a3b8');
}
function popupHtml(x){
  try{if(typeof window.unifiedPopup==='function')return window.unifiedPopup(x,'general')}catch{}
  const esc=v=>typeof window.esc==='function'?window.esc(v):String(v??'');
  return `<div class="popup-card"><b>${esc(x.feeder)} · ${esc(x.substation)}</b><div class="popup-address">${esc(x.address||'')}</div><div class="map-popup-actions"><button class="btn u-form">📄 Formulario</button><button class="btn u-inspection">📷 Inspección MT</button><button class="btn u-reports">📑 Reportes</button><button class="btn u-route">${window.inRoute?.(x)?'✓ En la ruta':'➕ Añadir a ruta'}</button><button class="btn u-share">Compartir</button><button class="btn u-status">✎ Cambiar estado</button><a class="maps-link" target="_blank" rel="noopener" href="${window.mapsUrl?.(x)||'#'}">Maps</a></div></div>`;
}
function bindPopup(marker,x){
  try{if(typeof window.bindUnifiedPopup==='function'){marker.bindPopup(window.unifiedPopup(x,'general'));window.bindUnifiedPopup(marker,x,'general');return}}catch{}
  marker.bindPopup(()=>popupHtml(x),{maxWidth:360});
  marker.on('popupopen',e=>{const root=e.popup.getElement();if(!root)return;root.querySelector('.u-form')?.addEventListener('click',()=>window.openFormFor?.(x),{once:true});root.querySelector('.u-inspection')?.addEventListener('click',()=>window.openInspectionModule?.(x),{once:true});root.querySelector('.u-reports')?.addEventListener('click',()=>window.openInspectionReports?.(x),{once:true});root.querySelector('.u-share')?.addEventListener('click',()=>window.shareLocation?.(x),{once:true});root.querySelector('.u-status')?.addEventListener('click',()=>window.openManualStatusDialog?.(x),{once:true});root.querySelector('.u-route')?.addEventListener('click',()=>{if(!window.inRoute?.(x))window.addCatalogArray?.([x]);marker.closePopup()},{once:true})});
}
function setCounts(total,shown,filtered){
  const count=$('generalMapCount');if(count)count.textContent=`${total.toLocaleString('es-PE')} resultado(s)`;
  const box=$('gmResultSummary'),label=$('gmResultCount');if(box)box.style.display=filtered?'flex':'none';if(label&&filtered)label.textContent=`${total.toLocaleString('es-PE')} punto${total===1?'':'s'} encontrado${total===1?'':'s'}`;
  if(filtered)info(total?`Mostrando ${shown.toLocaleString('es-PE')} de ${total.toLocaleString('es-PE')} coincidencia(s). Pulsa Ir para centrar.`:'No se encontraron subestaciones con esos filtros.');
  else info(`${catalog().length.toLocaleString('es-PE')} ubicaciones disponibles · ${shown.toLocaleString('es-PE')} visibles en esta zona.`);
}
function render(fit=false){
  if(!isGeneralActive()||!window.L)return;
  const gm=ensureMap();if(!gm)return;ensureIndex();
  const t=performance.now(),filtered=filteredMode();let matches;
  if(filtered){matches=filterAll(catalog());lastMatches=matches}
  else{matches=index.getInBounds(gm.getBounds(),1000);lastMatches=[]}
  const display=filtered?matches.slice(0,1000):matches;
  try{window.generalMarkers?.clearLayers?.()}catch(e){console.warn('[V14] clearLayers',e);return}
  for(const x of display){
    const marker=L.circleMarker([+x.lat,+x.lon],{renderer:canvas,radius:6,weight:1.4,color:'#fff',fillColor:statusColor(x),fillOpacity:.93,bubblingMouseEvents:false});bindPopup(marker,x);marker.addTo(window.generalMarkers||generalMarkers);
  }
  telemetry.visible=display.length;telemetry.renders++;telemetry.renderMs=+(performance.now()-t).toFixed(1);setCounts(filtered?matches.length:catalog().length,display.length,filtered);
  if(fit&&filtered&&matches.length){const pts=matches.slice(0,2000).map(x=>[+x.lat,+x.lon]);if(pts.length===1)gm.setView(pts[0],17);else{const b=L.latLngBounds(pts);if(b.isValid())gm.fitBounds(b,{padding:[30,30],maxZoom:16})}}
}
function go(){render(true)}
function bindControls(){
  window.renderGeneralMap=render;window.__V14_MAP_ENGINE__={render,go,telemetry,version:VERSION};
  const q=$('gmSearch');if(q){q.oninput=()=>{clearTimeout(inputTimer);inputTimer=setTimeout(()=>render(false),180)};q.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go()}}}
  for(const id of ['gmFeeder','gmTech','gmDate']){const el=$(id);if(el)el.oninput=()=>{clearTimeout(inputTimer);inputTimer=setTimeout(()=>render(false),180)}}
  if($('gmFilterBtn'))$('gmFilterBtn').onclick=e=>{e.preventDefault();go()};
  if($('gmGoResults'))$('gmGoResults').onclick=e=>{e.preventDefault();go()};
  if($('gmZoomIn'))$('gmZoomIn').onclick=e=>{e.preventDefault();ensureMap()?.zoomIn()};
  if($('gmZoomOut'))$('gmZoomOut').onclick=e=>{e.preventDefault();ensureMap()?.zoomOut()};
  if($('gmFitAll'))$('gmFitAll').onclick=e=>{e.preventDefault();if(filteredMode())go();else ensureMap()?.setView([-12.0464,-77.0428],11)};
  if($('gmAddAllBtn'))$('gmAddAllBtn').onclick=e=>{e.preventDefault();window.addCatalogArray?.(filterAll(catalog()))};
  if($('gmReloadBtn'))$('gmReloadBtn').onclick=async e=>{e.preventDefault();info('Sincronizando catálogo…');try{await window.autoSync?.(true)}catch(err){console.warn(err)}sourceRef=null;sourceLen=-1;render(false)};
  document.addEventListener('click',e=>{if(e.target.closest('.nav button[data-view="generalmap"]'))setTimeout(()=>{const gm=ensureMap();gm?.invalidateSize?.({pan:false});render(false)},80)},true);
  window.addEventListener('resize',()=>{clearTimeout(moveTimer);moveTimer=setTimeout(()=>{if(isGeneralActive())ensureMap()?.invalidateSize?.({pan:false})},120)},{passive:true});
}
function boot(){bindControls();if(isGeneralActive())setTimeout(()=>render(false),0)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
