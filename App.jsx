import React, { useEffect, useMemo, useState } from "react";
import { Anchor, Crosshair, Download, MapPin, Navigation, Trash2, Upload, Waves, X } from "lucide-react";

const STORAGE_KEY = "hummerkart-sogne-pots-v1";
const initialPots = [{ id: 1001, x: 62, y: 58, depth: 12, catchCount: 2, note: "Testpunkt", setAt: new Date().toISOString() }];

export default function App() {
  const [pots, setPots] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || initialPots; }
    catch { return initialPots; }
  });
  const [placing, setPlacing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [gps, setGps] = useState(false);
  const [status, setStatus] = useState("Klar");
  const selectedPot = useMemo(() => pots.find(p => p.id === selected), [pots, selected]);

  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(pots)), [pots]);

  function addPot(e) {
    if (!placing) return;
    const r = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    const pot = { id, x: ((e.clientX-r.left)/r.width)*100, y: ((e.clientY-r.top)/r.height)*100, depth: 10, catchCount: 0, note: "", setAt: new Date().toISOString() };
    setPots(p => [...p, pot]); setSelected(id); setPlacing(false); setStatus("Teine registrert lokalt");
  }
  function update(patch){ setPots(p=>p.map(x=>x.id===selected?{...x,...patch}:x)); }
  function remove(){ setPots(p=>p.filter(x=>x.id!==selected)); setSelected(null); setStatus("Teine slettet"); }
  function toggleGps(){
    if (!navigator.geolocation) { setStatus("GPS støttes ikke av nettleseren"); return; }
    if (gps) { setGps(false); setStatus("GPS av"); return; }
    setStatus("Henter posisjon …");
    navigator.geolocation.getCurrentPosition(
      () => { setGps(true); setStatus("GPS-posisjon funnet"); },
      () => { setGps(false); setStatus("Kunne ikke hente GPS-posisjon"); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }
  function exportData(){
    const blob = new Blob([JSON.stringify({version:1, exportedAt:new Date().toISOString(), pots}, null, 2)], {type:"application/json"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`hummerkart-sogne-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(a.href);
  }
  function importData(e){
    const f=e.target.files?.[0]; if(!f) return;
    const reader=new FileReader(); reader.onload=()=>{ try { const d=JSON.parse(reader.result); if(!Array.isArray(d.pots)) throw new Error(); setPots(d.pots); setStatus("Data importert"); } catch { setStatus("Ugyldig importfil"); } }; reader.readAsText(f); e.target.value="";
  }

  return <div className="app-shell">
    <main className="layout">
      <header>
        <div><div className="eyebrow"><Anchor size={17}/> Søgne</div><h1>Hummerkart</h1><p>Prototype for teine- og fangstregistrering i Søgne.</p></div>
        <div className="actions">
          <button onClick={toggleGps} className={gps?"active secondary":"secondary"}><Crosshair size={18}/> Min posisjon</button>
          <button onClick={()=>setPlacing(!placing)} className={placing?"placing primary":"primary"}><MapPin size={18}/> {placing?"Trykk i kartet":"Sett teine"}</button>
        </div>
      </header>
      <div className="content-grid">
        <section onClick={addPot} className={placing?"map placing-cursor":"map"} aria-label="Prototypekart over Søgne">
          <div className="contours"/><div className="land"/>
          <div className="map-label"><b>Søgne-skjærgården</b><span>Prototypekart</span></div>
          {[5,10,20,30].map((d,i)=><span key={d} className="depth" style={{left:`${44+i*11}%`,top:`${25+i*14}%`}}>{d} m</span>)}
          {gps&&<div className="gps-ring"><div className="gps-dot"/></div>}
          {pots.map(p=><button key={p.id} onClick={e=>{e.stopPropagation();setSelected(p.id)}} style={{left:`${p.x}%`,top:`${p.y}%`}} className={selected===p.id?"pot selected":"pot"} title={`Teine, ${p.depth} m`}><Anchor size={17}/></button>)}
          <div className="warning"><Waves size={14}/> Ikke til navigasjon</div>
        </section>
        <aside>
          <div className="aside-title"><h2>Teiner</h2><span>{pots.length}</span></div>
          {!selectedPot?<p className="hint">Velg en teine, eller trykk <b>Sett teine</b> og plasser den i kartet.</p>:<div className="form">
            <div className="selected-title"><div><small>Valgt teine</small><b>Teine #{String(selectedPot.id).slice(-4)}</b></div><button className="icon" onClick={()=>setSelected(null)}><X size={18}/></button></div>
            <label>Dybde (m)<input type="number" value={selectedPot.depth} onChange={e=>update({depth:+e.target.value})}/></label>
            <label>Fangst, hummer<input type="number" min="0" value={selectedPot.catchCount} onChange={e=>update({catchCount:+e.target.value})}/></label>
            <label>Kommentar<textarea value={selectedPot.note} onChange={e=>update({note:e.target.value})} placeholder="Bunnforhold, agn, observasjoner ..."/></label>
            <button onClick={remove} className="danger"><Trash2 size={17}/> Slett teine</button>
          </div>}
          <div className="data-actions"><button onClick={exportData}><Download size={16}/> Eksporter</button><label className="file-button"><Upload size={16}/> Importer<input type="file" accept="application/json" onChange={importData}/></label></div>
          <div className="status"><Navigation size={14}/> {status}. Data lagres lokalt i nettleseren.</div>
        </aside>
      </div>
    </main>
  </div>;
}
