/* Rutas de Inspección V14.0.0-alpha · núcleo de rendimiento del mapa */
(()=>{
  'use strict';
  const V='14.0.0-alpha';
  const $id=id=>document.getElementById(id);
  const activeView=()=>document.querySelector('.view.active')?.id||'dashboard';
  const valid=x=>x&&Number.isFinite(+x.lat)&&Number.isFinite(+x.lon);
  const hasGeneralFilters=()=>Boolean(($id('gmSearch')?.value||'').trim()||($id('gmFeeder')?.value||'')||($id('gmTech')?.value||'').trim()||($id('gmDate')?.value||''));
  const perf={renders:0,lastRenderMs:0,markers:0,indexSize:0};
  let gm=null,gmTiles=null,gmFallback=null,gmLayer=null,gmCanvas=null,moveTimer=null,searchTimer=null;
  let indexedCatalog=null,indexedLength=-1,grid=null;
  const CELL=.05;

  function setInfo(msg){const el=$id('generalMapInfo');if(el)el.textContent=msg}
  function norm(v){return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase()}
  function codeNorm(v){return norm(v).replace(/[^a-z0-9]/g,'')}
  function statusColor(x){
    const s=typeof statusKey==='function'?statusKey(x?.status):norm(x?.status);
    if(s==='inspected'||s==='inspeccionada')return '#16a34a';
    if(s==='notinspected'||s==='no inspeccionada')return '#dc2626';
    if(s==='rescheduled'||s==='reprogramada')return '#ea580c';
    if(s==='observed'||s==='observada')return '#7c3aed';
    if(typeof inRoute==='function'&&inRoute(x))return '#0b63d8';
    return '#64748b';
  }
  function currentCatalog(){return Array.isArray(window.state?.catalog)?state.catalog:[]}
  function ensureIndex(){
    const cat=currentCatalog();
    if(indexedCatalog===cat&&indexedLength===cat.length&&grid)return;
    grid=new Map();
    for(const x of cat){
      if(!valid(x))continue;
      const a=Math.floor((+x.lat)/CELL),b=Math.floor((+x.lon)/CELL),k=a+','+b;
      let bucket=grid.get(k);if(!bucket)grid.set(k,bucket=[]);bucket.push(x);
      if(!x.__v14search)x.__v14search=norm([x.feeder,x.substation,x.address,x.technician].join(' '));
      if(!x.__v14sub)x.__v14sub=codeNorm(x.substation);
    }
    indexedCatalog=cat;indexedLength=cat.length;perf.indexSize=cat.length;
  }
  function viewportCandidates(){
    ensureIndex();
    if(!gm||!grid)return [];
    const b=gm.getBounds(); if(!b?.isValid?.())return [];
    const sw=b.getSouthWest(),ne=b.getNorthEast();
    const a0=Math.floor(sw.lat/CELL)-1,a1=Math.floor(ne.lat/CELL)+1,b0=Math.floor(sw.lng/CELL)-1,b1=Math.floor(ne.lng/CELL)+1;
    const out=[];
    for(let a=a0;a<=a1;a++)for(let c=b0;c<=b1;c++){const bucket=grid.get(a+','+c);if(bucket)out.push(...bucket)}
    return out.filter(x=>b.contains([+x.lat,+x.lon]));
  }
  function filteredFast(){
    ensureIndex();
    const q=norm($id('gmSearch')?.value||''),rawQ=($id('gmSearch')?.value||'').trim(),onlyDigits=/^\d+$/.test(rawQ);
    const feeder=$id('gmFeeder')?.value||'',tech=norm($id('gmTech')?.value||''),date=$id('gmDate')?.value||'';
    const source=hasGeneralFilters()?currentCatalog():viewportCandidates();
    const out=[];
    for(const x of source){
      if(!valid(x))continue;
      if(q){
        if(onlyDigits){if(!String(x.substation||'').replace(/\D/g,'').includes(rawQ))continue}
        else if(!(x.__v14search||norm([x.feeder,x.substation,x.address,x.technician].join(' '))).includes(q))continue;
      }
      if(feeder&&String(x.feeder||'')!==feeder)continue;
      if(tech&&!norm(x.technician).includes(tech))continue;
      if(date&&typeof catalogDate==='function'&&catalogDate(x)!==date)continue;
      out.push(x);
    }
    return out;
  }
  function popupHtml(x){
    const title=`${typeof esc==='function'?esc(x.feeder):x.feeder} · ${typeof esc==='function'?esc(x.substation):x.substation}`;
    const label=typeof locationLabel==='function'?locationLabel(x):(x.address||`${x.lat}, ${x.lon}`);
    const safe=v=>typeof esc==='function'?esc(v):String(v??'');
    const badge=typeof statusBadge==='function'?statusBadge(x):'';
    return `<div class="popup-card"><b>${title}</b><div class="popup-address">${safe(label)}</div>${x.technician?`<small>Técnico: ${safe(x.technician)}</small>`:''}${badge}<div class="map-popup-actions"><button class="btn gm-form" type="button">📄 Formulario</button><button class="btn gm-inspection" type="button">📷 Inspección MT</button><button class="btn gm-report" type="button">📑 Reportes</button><button class="btn gm-add" type="button">${typeof inRoute==='function'&&inRoute(x)?'✓ En la ruta':'Añadir a ruta'}</button><a class="maps-link" href="${typeof mapsUrl==='function'?mapsUrl(x):'#'}" target="_blank" rel="noopener">Maps</a><button class="btn gm-share" type="button">Compartir</button><button class="btn gm-status" type="button">✎ Cambiar estado</button></div></div>`;
  }
  function bindPopup(marker,x){
    marker.bindPopup(()=>popupHtml(x),{maxWidth:320});
    marker.on('popupopen',e=>{
      const root=e.popup.getElement();if(!root)return;
      const q=s=>root.querySelector(s);
      if(q('.gm-form'))q('.gm-form').onclick=()=>{try{rememberPopupForOverlay?.(marker,x)}catch{};openFormFor?.(x)};
      if(q('.gm-inspection'))q('.gm-inspection').onclick=()=>{try{rememberPopupForOverlay?.(marker,x)}catch{};openInspectionModule?.(x)};
      if(q('.gm-report'))q('.gm-report').onclick=()=>{try{rememberPopupForOverlay?.(marker,x)}catch{};openInspectionReports?.(x)};
      if(q('.gm-share'))q('.gm-share').onclick=()=>shareLocation?.(x);
      if(q('.gm-status'))q('.gm-status').onclick=()=>{try{rememberPopupForOverlay?.(marker,x)}catch{};openManualStatusDialog?.(x)};
      if(q('.gm-add'))q('.gm-add').onclick=()=>{if(typeof inRoute==='function'&&inRoute(x))return;addCatalogArray?.([x]);marker.closePopup();drawGeneral(false)};
    });
  }
  function ensureGeneralMap(){
    const host=$id('generalMap');if(!host||typeof L==='undefined')return null;
    if(gm&&gm._container===host)return gm;
    try{if(window.generalMap&&window.generalMap!==gm){window.generalMap.off?.();window.generalMap.remove?.()}}catch{}
    host.innerHTML='';
    gmCanvas=L.canvas({padding:.35});
    gm=L.map(host,{zoomControl:false,preferCanvas:true,renderer:gmCanvas,zoomAnimation:true,fadeAnimation:false,markerZoomAnimation:false,worldCopyJump:false}).setView([-12.0464,-77.0428],11);
    window.generalMap=gm;
    gmLayer=L.layerGroup().addTo(gm);window.generalMarkers=gmLayer;
    gmTiles=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{subdomains:'abc',maxZoom:19,minZoom:4,updateWhenIdle:true,keepBuffer:2,detectRetina:false,attribution:'© OpenStreetMap'});
    gmFallback=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:19,minZoom:4,updateWhenIdle:true,keepBuffer:2,detectRetina:false,attribution:'© OpenStreetMap © CARTO'});
    let loaded=0,errors=0,fallback=false;
    gmTiles.on('tileload',()=>loaded++);
    gmTiles.on('tileerror',()=>{errors++;if(errors>=8&&!fallback){fallback=true;try{gm.removeLayer(gmTiles)}catch{};gmFallback.addTo(gm);setInfo('Mapa base alternativo activado.')}});
    gmTiles.addTo(gm);
    gm.on('moveend zoomend',()=>{clearTimeout(moveTimer);moveTimer=setTimeout(()=>{if(activeView()==='generalmap'&&!hasGeneralFilters())drawGeneral(false)},90)});
    requestAnimationFrame(()=>gm.invalidateSize(false));
    setTimeout(()=>{if(loaded===0&&!fallback&&activeView()==='generalmap'){fallback=true;try{gm.removeLayer(gmTiles)}catch{};gmFallback.addTo(gm);gm.invalidateSize(false)}},3500);
    return gm;
  }
  function drawGeneral(fit=false){
    if(activeView()!=='generalmap')return;
    const map=ensureGeneralMap();if(!map)return;
    const t0=performance.now();
    ensureIndex();
    const matches=filteredFast();
    const filtered=hasGeneralFilters();
    const limit=filtered?1000:550;
    const shown=matches.slice(0,limit);
    gmLayer.clearLayers();
    for(const x of shown){
      const m=L.circleMarker([+x.lat,+x.lon],{renderer:gmCanvas,radius:6,weight:2,color:'#fff',fillColor:statusColor(x),fillOpacity:.92,bubblingMouseEvents:false});
      bindPopup(m,x);m.addTo(gmLayer);
    }
    perf.renders++;perf.markers=shown.length;perf.lastRenderMs=Math.round((performance.now()-t0)*10)/10;
    const total=filtered?matches.length:currentCatalog().filter(valid).length;
    if($id('generalMapCount'))$id('generalMapCount').textContent=`${total.toLocaleString('es-PE')} resultado(s)`;
    if($id('gmResultSummary'))$id('gmResultSummary').style.display=filtered?'flex':'none';
    if($id('gmResultCount'))$id('gmResultCount').textContent=`${matches.length.toLocaleString('es-PE')} punto${matches.length===1?'':'s'} encontrado${matches.length===1?'':'s'}`;
    if(filtered){
      setInfo(matches.length?`Mostrando ${shown.length.toLocaleString('es-PE')} de ${matches.length.toLocaleString('es-PE')} coincidencia(s).`:'No se encontraron subestaciones con esos datos.');
      if(fit&&shown.length){const b=L.latLngBounds(shown.map(x=>[+x.lat,+x.lon]));if(b.isValid())map.fitBounds(b,{padding:[35,35],maxZoom:17})}
    }else setInfo(`${currentCatalog().length.toLocaleString('es-PE')} ubicaciones disponibles · ${shown.length.toLocaleString('es-PE')} visibles en esta zona.`);
    requestAnimationFrame(()=>map.invalidateSize(false));
  }
  function goResults(){const arr=filteredFast();if(!arr.length)return;const map=ensureGeneralMap();const pts=arr.slice(0,1000).map(x=>[+x.lat,+x.lon]);if(pts.length===1)map.setView(pts[0],17);else{const b=L.latLngBounds(pts);if(b.isValid())map.fitBounds(b,{padding:[35,35],maxZoom:16})}drawGeneral(false)}
  function cleanShowView(id,btn){
    const admin=typeof isAdmin==='function'?isAdmin():true;
    if(['settings','users','programming','modifications'].includes(id)&&!admin){showToast?.('Acceso restringido','Solo el Administrador puede abrir este módulo.','warn');return}
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$id(id)?.classList.add('active');
    document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');
    const titles={planner:'Mi planificador',dashboard:'Panel principal',programming:'Programación',users:'Usuarios',generalmap:'Mapa general',history:'Historial',modifications:'Registro de modificaciones',settings:'Configuración'};
    if($id('pageTitle'))$id('pageTitle').textContent=titles[id]||'';
    document.body.classList.remove('menu-open');
    try{if(id==='dashboard')renderEnterpriseDashboard?.();if(id==='modifications')renderAuditLog?.();if(id==='users')renderUsers?.();if(id==='programming')renderAssignments?.()}catch(e){console.warn('vista',e)}
    if(id==='generalmap'){requestAnimationFrame(()=>{const m=ensureGeneralMap();m?.invalidateSize(false);drawGeneral(false)})}
    else if(id==='planner'){requestAnimationFrame(()=>window.map?.invalidateSize?.(false))}
    try{history.pushState({riV14:true,view:id},'',location.href)}catch{}
  }
  function bind(){
    window.initGeneralMap=()=>ensureGeneralMap();window.renderGeneralMap=(fit=false)=>drawGeneral(!!fit);window.showView=cleanShowView;window.activeViewId=activeView;
    document.querySelectorAll('.nav button[data-view]').forEach(b=>b.onclick=e=>{e.preventDefault();cleanShowView(b.dataset.view,b)});
    const search=$id('gmSearch');if(search){search.oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>drawGeneral(false),160)};search.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();drawGeneral(true)}}}
    if($id('gmFilterBtn'))$id('gmFilterBtn').onclick=e=>{e.preventDefault();drawGeneral(true)};
    if($id('gmGoResults'))$id('gmGoResults').onclick=e=>{e.preventDefault();goResults()};
    if($id('gmZoomIn'))$id('gmZoomIn').onclick=e=>{e.preventDefault();ensureGeneralMap()?.zoomIn()};
    if($id('gmZoomOut'))$id('gmZoomOut').onclick=e=>{e.preventDefault();ensureGeneralMap()?.zoomOut()};
    if($id('gmFitAll'))$id('gmFitAll').onclick=e=>{e.preventDefault();if(hasGeneralFilters())goResults();else ensureGeneralMap()?.setView([-12.0464,-77.0428],11)};
    if($id('gmReloadBtn'))$id('gmReloadBtn').onclick=async e=>{e.preventDefault();setInfo('Sincronizando catálogo…');try{await window.autoSync?.(true)}catch(err){console.warn(err)}ensureIndex();drawGeneral(false)};
    if($id('gmAddAllBtn'))$id('gmAddAllBtn').onclick=e=>{e.preventDefault();addCatalogArray?.(filteredFast())};
    window.addEventListener('popstate',()=>{
      try{if(document.fullscreenElement){document.exitFullscreen?.();return}}catch{}
      if(document.querySelector('.external-form-modal,.result-modal,.manual-status-modal,.inspection-modal,.reports-modal')){document.querySelector('.external-form-modal,.result-modal,.manual-status-modal,.inspection-modal,.reports-modal')?.remove();return}
      try{gm?.closePopup();window.map?.closePopup?.()}catch{}
      if(activeView()!=='planner')cleanShowView('planner',document.querySelector('.nav button[data-view="planner"]'));
    });
    const ver=document.querySelector('#userBadge')?.parentElement?.querySelector('small');if(ver)ver.textContent='v'+V;
    window.__V14_PERF__=perf;
    if(activeView()==='generalmap'){ensureGeneralMap();drawGeneral(false)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(bind,50),{once:true});else setTimeout(bind,50);
})();
