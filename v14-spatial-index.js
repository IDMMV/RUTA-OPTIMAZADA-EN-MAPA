/* Rutas de Inspección V14.0-alpha3 · índice espacial inspirado en la versión React estable. */
(()=>{
'use strict';
class SpatialGridIndex{
  constructor(cellSize=.02){this.cellSize=cellSize;this.grid=new Map();this.items=[];this.source=null;this.length=-1}
  setItems(items){
    if(this.source===items&&this.length===items.length)return false;
    this.source=items;this.length=items.length;this.items=items;this.grid.clear();
    for(const item of items){
      const lat=+item?.lat,lon=+item?.lon;if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;
      const x=Math.floor(lat/this.cellSize),y=Math.floor(lon/this.cellSize),key=x+','+y;
      let bucket=this.grid.get(key);if(!bucket)this.grid.set(key,bucket=[]);bucket.push(item);
    }
    return true;
  }
  getInBounds(bounds,maxLimit=1000){
    if(!bounds||!this.items.length)return [];
    const sw=bounds.getSouthWest(),ne=bounds.getNorthEast();
    const x0=Math.floor(sw.lat/this.cellSize),x1=Math.floor(ne.lat/this.cellSize);
    const y0=Math.floor(sw.lng/this.cellSize),y1=Math.floor(ne.lng/this.cellSize);
    const out=[];
    for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){
      const bucket=this.grid.get(x+','+y);if(!bucket)continue;
      for(const item of bucket){
        const lat=+item.lat,lon=+item.lon;
        if(lat>=sw.lat&&lat<=ne.lat&&lon>=sw.lng&&lon<=ne.lng)out.push(item);
      }
    }
    if(out.length<=maxLimit)return out;
    const sampled=[],step=out.length/maxLimit;
    for(let i=0;i<maxLimit;i++)sampled.push(out[Math.floor(i*step)]);
    return sampled;
  }
}
window.RISpatialGridIndex=SpatialGridIndex;
})();
