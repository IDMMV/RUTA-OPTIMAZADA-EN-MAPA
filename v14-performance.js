/* Rutas de Inspección V14.0-alpha2
   Rendimiento del Mapa General sin crear una segunda instancia de Leaflet.
   El mapa base queda bajo un único propietario: v1366-final-map-route-fix-script. */
(()=>{
  'use strict';
  const V='14.0-alpha2';
  const $=id=>document.getElementById(id);
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  const valid=x=>x&&Number.isFinite(+x.lat)&&Number.isFinite(+x.lon);
  const CELL=.04;
  let grid=null, indexedCatalog=null, indexedLength=-1, renderTimer=0, searchTimer=0;
  const perf={version:V,renders:0,lastRenderMs:0,lastFilterMs:0,markers:0,total:0};

  function activeGeneral(){return document.getElementById('generalmap')?.classList.contains('active')}
  function catalog(){return Array.isArray(window.state?.catalog)?state.catalog:[]}
  function info(t){const el=$('generalMapInfo');if(el)el.textContent=t}
  function filters(){return {
    q:($('gmSearch')?.value||'').trim(), feeder:$('gmFeeder')?.value||'', tech:($('gmTech')?.value||'').trim(), date:$('gmDate')?.value||''
  }}
  function hasFilters(){const f=filters();return !!(f.q||f.feeder||f.tech||f.date)}

  function ensureIndex(){
    const cat=catalog();
    if(grid && indexedCatalog===cat && indexedLength===cat.length)return;
    const t=performance.now();
    grid=new Map();
    for(const x of cat){
      if(!valid(x))continue;
      const a=Math.floor((+x.lat)/CELL), b=Math.floor((+x.lon)/CELL), k=a+','+b;
      let bucket=grid.get(k); if(!bucket)grid.set(k,bucket=[]); bucket.push(x);
      if(!x.__v14text)x.__v14text=norm([x.feeder,x.substation,x.address,x.technician].join(' '));
      if(!x.__v14subdigits)x.__v14subdigits=String(x.substation||'').replace(/\D/g,'');
    }
    indexedCatalog=cat; indexedLength=cat.length; perf.total=cat.length;
    perf.indexMs=Math.round((performance.now()-t)*10)/10;
  }

  function visibleCandidates(map){
    ensureIndex();
    if(!map||!grid)return [];
    const bounds=map.getBounds?.(); if(!bounds?.isValid?.())return [];
    const sw=bounds.getSouthWest(), ne=bounds.getNorthEast();
    const a0=Math.floor(sw.lat/CELL)-1,a1=Math.floor(ne.lat/CELL)+1;
    const b0=Math.floor(sw.lng/CELL)-1,b1=Math.floor(ne.lng/CELL)+1;
    const out=[];
    for(let a=a0;a<=a1;a++)for(let b=b0;b<=b1;b++){
      const bucket=grid.get(a+','+b); if(bucket)out.push(...bucket);
    }
    return out.filter(x=>bounds.contains([+x.lat,+x.lon]));
  }

  function filterRows(source){
    const t0=performance.now(),f=filters();
    const qn=norm(f.q), onlyDigits=/^\d+$/.test(f.q), tech=norm(f.tech);
    const out=[];
    for(const x of source){
      if(!valid(x))continue;
      if(f.q){
        if(onlyDigits){ if(!(x.__v14subdigits||String(x.substation||'').replace(/\D/g,'')).includes(f.q))continue; }
        else if(!(x.__v14text||norm([x.feeder,x.substation,x.address,x.technician].join(' '))).includes(qn))continue;
      }
      if(f.feeder && String(x.feeder||'')!==f.feeder)continue;
      if(tech && !norm(x.technician).includes(tech))continue;
      if(f.date && typeof window.catalogDate==='function' && catalogDate(x)!==f.date)continue;
      out.push(x);
    }
    perf.lastFilterMs=Math.round((performance.now()-t0)*10)/10;
    return out;
  }

  function colorFor(x){
    try{
      const key=typeof statusKey==='function'?statusKey(x.status):norm(x.status);
      if(key==='inspected'||key==='inspeccionada')return '#16a34a';
      if(key==='notinspected'||key==='no inspeccionada')return '#ef4444';
      if(key==='rescheduled'||key==='reprogramada')return '#f59e0b';
      if(key==='observed'||key==='observada')return '#7c3aed';
      if(typeof inRoute==='function'&&inRoute(x))return '#1677e8';
    }catch{}
    return '#94a3b8';
  }

  function popupHtml(x){
    try{if(typeof unifiedPopup==='function')return unifiedPopup(x,'general')}catch{}
    const escv=v=>typeof esc==='function'?esc(v):String(v??'');
    const location=typeof locationLabel==='function'?locationLabel(x):(x.address||`${x.lat}, ${x.lon}`);
    return `<div class="popup-card"><b>${escv(x.feeder)} · ${escv(x.substation)}</b><div class="popup-address">${escv(location)}</div><div class="map-popup-actions"><button class="btn gm-form">📄 Formulario</button><button class="btn gm-inspection">📷 Inspección MT</button><button class="btn gm-report">📑 Reportes</button><button class="btn gm-add">${typeof inRoute==='function'&&inRoute(x)?'✓ En la ruta':'Añadir a ruta'}</button><a class="maps-link" href="${typeof mapsUrl==='function'?mapsUrl(x):'#'}" target="_blank" rel="noopener">Maps</a><button class="btn gm-share">Compartir</button><button class="btn gm-status">✎ Cambiar estado</button></div></div>`;
  }

  function bindPopup(marker,x){
    try{if(typeof bindUnifiedPopup==='function'){bindUnifiedPopup(marker,x,'general');return}}catch{}
    marker.bindPopup(()=>popupHtml(x),{maxWidth:340});
    marker.on('popupopen',e=>{
      const root=e.popup.getElement(); if(!root)return;
      const q=s=>root.querySelector(s);
      q('.gm-form')?.addEventListener('click',()=>openFormFor?.(x),{once:true});
      q('.gm-inspection')?.addEventListener('click',()=>openInspectionModule?.(x),{once:true});
      q('.gm-report')?.addEventListener('click',()=>openInspectionReports?.(x),{once:true});
      q('.gm-share')?.addEventListener('click',()=>shareLocation?.(x),{once:true});
      q('.gm-status')?.addEventListener('click',()=>openManualStatusDialog?.(x),{once:true});
      const add=q('.gm-add'); if(add)add.onclick=()=>{if(typeof inRoute==='function'&&inRoute(x))return;addCatalogArray?.([x]);marker.closePopup();render(false)};
    });
  }

  function getMap(){
    try{return typeof initGeneralMap==='function'?initGeneralMap(false):window.generalMap}catch(e){console.error('V14 map init',e);return null}
  }

  function render(fit=false){
    if(!activeGeneral())return;
    const map=getMap(); if(!map)return;
    ensureIndex();
    const t0=performance.now(), filtered=hasFilters();
    const source=filtered?catalog():visibleCandidates(map);
    const matches=filterRows(source);
    const max=filtered?850:450, shown=matches.slice(0,max);
    try{generalMarkers?.clearLayers?.()}catch(e){console.warn('clear markers',e)}
    const canvas=L.canvas({padding:.25});
    for(const x of shown){
      const m=L.circleMarker([+x.lat,+x.lon],{renderer:canvas,radius:5.5,weight:1.5,color:'#fff',fillColor:colorFor(x),fillOpacity:.92,bubblingMouseEvents:false});
      bindPopup(m,x); m.addTo(generalMarkers);
    }
    perf.renders++; perf.markers=shown.length; perf.lastRenderMs=Math.round((performance.now()-t0)*10)/10;
    const total=filtered?filterRows(catalog()).length:catalog().filter(valid).length;
    const count=$('generalMapCount'); if(count)count.textContent=`${total.toLocaleString('es-PE')} resultado(s)`;
    const summary=$('gmResultSummary'), label=$('gmResultCount');
    if(summary)summary.style.display=filtered?'flex':'none';
    if(label&&filtered)label.textContent=`${total.toLocaleString('es-PE')} punto${total===1?'':'s'} encontrado${total===1?'':'s'}`;
    if(filtered){
      info(total?`Mostrando ${shown.length.toLocaleString('es-PE')} de ${total.toLocaleString('es-PE')} coincidencia(s).`:'No se encontraron subestaciones con esos filtros.');
      if(fit&&shown.length){const b=L.latLngBounds(shown.map(x=>[+x.lat,+x.lon]));if(b.isValid())map.fitBounds(b,{padding:[30,30],maxZoom:17});}
    }else info(`${catalog().length.toLocaleString('es-PE')} ubicaciones cargadas · ${shown.length.toLocaleString('es-PE')} visibles en esta zona.`);
    requestAnimationFrame(()=>{try{map.invalidateSize(false)}catch{}});
  }

  function go(){
    ensureIndex(); const all=filterRows(catalog()); if(!all.length)return render(false);
    const map=getMap(), pts=all.slice(0,850).map(x=>[+x.lat,+x.lon]);
    if(pts.length===1)map.setView(pts[0],17);else{const b=L.latLngBounds(pts);if(b.isValid())map.fitBounds(b,{padding:[30,30],maxZoom:16});}
    render(false);
  }

  function bindControls(){
    // Override only General Map rendering/search. Do not own/recreate Leaflet.
    window.renderGeneralMap=render;
    try{renderGeneralMap=render}catch{}
    const search=$('gmSearch');
    if(search){search.oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>render(false),180)};search.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go()}}}
    const feeder=$('gmFeeder'),tech=$('gmTech'),date=$('gmDate');
    [feeder,tech,date].filter(Boolean).forEach(el=>el.oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>render(false),180)});
    if($('gmFilterBtn'))$('gmFilterBtn').onclick=e=>{e.preventDefault();go()};
    if($('gmGoResults'))$('gmGoResults').onclick=e=>{e.preventDefault();go()};
    if($('gmZoomIn'))$('gmZoomIn').onclick=e=>{e.preventDefault();getMap()?.zoomIn()};
    if($('gmZoomOut'))$('gmZoomOut').onclick=e=>{e.preventDefault();getMap()?.zoomOut()};
    if($('gmFitAll'))$('gmFitAll').onclick=e=>{e.preventDefault();hasFilters()?go():getMap()?.setView([-12.0464,-77.0428],11)};
    if($('gmAddAllBtn'))$('gmAddAllBtn').onclick=e=>{e.preventDefault();addCatalogArray?.(filterRows(catalog()))};
    if($('gmReloadBtn'))$('gmReloadBtn').onclick=async e=>{e.preventDefault();info('Sincronizando catálogo…');try{await window.autoSync?.(true)}catch(err){console.warn(err)}indexedCatalog=null;grid=null;render(false)};

    // One lightweight viewport listener. v1366 already owns base-map lifecycle.
    const map=getMap();
    if(map&&!map.__v14PerfBound){
      map.__v14PerfBound=true;
      map.on('moveend zoomend',()=>{if(hasFilters()||!activeGeneral())return;clearTimeout(renderTimer);renderTimer=setTimeout(()=>render(false),100)});
    }
    window.__V14_PERF__=perf;
  }

  function boot(){
    bindControls();
    // Ensure version label is unmistakable.
    document.querySelectorAll('body *').forEach(()=>{});
    if(activeGeneral())setTimeout(()=>render(false),80);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
