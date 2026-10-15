import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Anchor, Crosshair, Download, MapPin, Navigation, Trash2, Upload, X } from "lucide-react";

const STORAGE_KEY = "hummerkart-sogne-pots-v2";
const SOGNE_CENTER = [58.075, 7.79];

function markerIcon(selected=false){
  return L.divIcon({
    className: "pot-marker-wrap",
    html: `<div class="pot-marker ${selected ? "selected" : ""}">âš“</div>`,
    iconSize:[36,36], iconAnchor:[18,18]
  });
}

export default function App(){
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markerLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const placingRef = useRef(false);
  const [placing,setPlacing] = useState(false);
  const [selected,setSelected] = useState(null);
  const [status,setStatus] = useState("Klar");
  const [pots,setPots] = useState(()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch{return[]}});
  const selectedPot = useMemo(()=>pots.find(p=>p.id===selected),[pots,selected]);

  useEffect(()=>{placingRef.current=placing},[placing]);
  useEffect(()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(pots)),[pots]);

  useEffect(()=>{
    if(mapRef.current) return;
    const map=L.map(mapEl.current,{zoomControl:true}).setView(SOGNE_CENTER,13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{
      maxZoom:19,
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    L.control.scale({imperial:false}).addTo(map);
    markerLayerRef.current=L.layerGroup().addTo(map);
    map.on("click",e=>{
      if(!placingRef.current) return;
      const id=Date.now();
      setPots(prev=>[...prev,{id,lat:e.latlng.lat,lng:e.latlng.lng,depth:"",catchCount:0,note:"",setAt:new Date().toISOString()}]);
      setSelected(id); setPlacing(false); setStatus("Teine registrert pÃ¥ kartet");
    });
    mapRef.current=map;
    setTimeout(()=>map.invalidateSize(),100);
    return ()=>{map.remove();mapRef.current=null};
  },[]);

  useEffect(()=>{
    const layer=markerLayerRef.current; if(!layer) return;
    layer.clearLayers();
    pots.forEach(p=>{
      L.marker([p.lat,p.lng],{icon:markerIcon(p.id===selected)})
        .addTo(layer)
        .bindTooltip(`Teine #${String(p.id).slice(-4)}${p.depth!==""?` Â· ${p.depth} m`:""}`)
        .on("click",()=>setSelected(p.id));
    });
  },[pots,selected]);

  function locate(){
    if(!navigator.geolocation){setStatus("GPS stÃ¸ttes ikke");return;}
    setStatus("Henter GPS-posisjon â€¦");
    navigator.geolocation.getCurrentPosition(pos=>{
      const ll=[pos.coords.latitude,pos.coords.longitude];
      const map=mapRef.current;
      if(userMarkerRef.current) userMarkerRef.current.remove();
      userMarkerRef.current=L.circleMarker(ll,{radius:8,color:"white",weight:3,fillColor:"#3b82f6",fillOpacity:1}).addTo(map).bindPopup("Din posisjon");
      L.circle(ll,{radius:pos.coords.accuracy,color:"#60a5fa",weight:1,fillOpacity:.12}).addTo(map);
      map.setView(ll,16); setStatus(`GPS funnet, nÃ¸yaktighet ca. ${Math.round(pos.coords.accuracy)} m`);
    },()=>setStatus("Kunne ikke hente GPS. Tillat posisjon i nettleseren."),{enableHighAccuracy:true,timeout:12000});
  }
  function update(patch){setPots(prev=>prev.map(p=>p.id===selected?{...p,...patch}:p))}
  function remove(){setPots(prev=>prev.filter(p=>p.id!==selected));setSelected(null);setStatus("Teine slettet")}
  function exportData(){const b=new Blob([JSON.stringify({version:2,exportedAt:new Date().toISOString(),pots},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`hummerkart-sogne-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href)}
  function importData(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d.pots))throw new Error();setPots(d.pots);setStatus("Data importert")}catch{setStatus("Ugyldig importfil")}};r.readAsText(f);e.target.value=""}

  return <div className="app-shell"><main className="layout">
    <header><div><div className="eyebrow"><Anchor size={17}/> SÃ¸gne</div><h1>Hummerkart</h1><p>Interaktivt kart for teine- og fangstregistrering.</p></div>
      <div className="actions"><button onClick={locate} className="secondary"><Crosshair size={18}/> Min posisjon</button><button onClick={()=>setPlacing(v=>!v)} className={placing?"placing primary":"primary"}><MapPin size={18}/>{placing?"Trykk i kartet":"Sett teine"}</button></div>
    </header>
    <div className="content-grid"><section className="map-card"><div ref={mapEl} className={placing?"map placing-cursor":"map"}/><div className="map-badge">Ekte interaktivt kart Â· SÃ¸gne</div><div className="warning">Ikke til navigasjon</div></section>
      <aside><div className="aside-title"><h2>Teiner</h2><span>{pots.length}</span></div>
        {!selectedPot?<p className="hint">Trykk <b>Sett teine</b>, og trykk deretter pÃ¥ korrekt sted i kartet. Du kan zoome og panorere.</p>:<div className="form">
          <div className="selected-title"><div><small>Valgt teine</small><b>Teine #{String(selectedPot.id).slice(-4)}</b><em>{selectedPot.lat.toFixed(5)}, {selectedPot.lng.toFixed(5)}</em></div><button className="icon" onClick={()=>setSelected(null)}><X size={18}/></button></div>
          <label>Dybde (m)<input type="number" value={selectedPot.depth} onChange={e=>update({depth:e.target.value})}/></label>
          <label>Fangst, hummer<input type="number" min="0" value={selectedPot.catchCount} onChange={e=>update({catchCount:+e.target.value})}/></label>
          <label>Kommentar<textarea value={selectedPot.note} onChange={e=>update({note:e.target.value})} placeholder="Bunnforhold, agn, observasjoner ..."/></label>
          <button onClick={remove} className="danger"><Trash2 size={17}/> Slett teine</button>
        </div>}
        <div className="data-actions"><button onClick={exportData}><Download size={16}/> Eksporter</button><label className="file-button"><Upload size={16}/> Importer<input type="file" accept="application/json" onChange={importData}/></label></div>
        <div className="status"><Navigation size={14}/> {status}. Teinedata lagres lokalt.</div>
      </aside>
    </div>
  </main></div>
}


