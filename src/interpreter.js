import * as THREE from "three";

function clamp01(v){
  return THREE.MathUtils.clamp(Number(v)||0,0,1);
}

function hash01(value,offset=0){
  const text=String(value||"case");
  let h=2166136261+offset*1013904223;
  for(let i=0;i<text.length;i++){
    h^=text.charCodeAt(i);
    h=Math.imul(h,16777619);
  }
  return ((h>>>0)%100000)/100000;
}

function autoPalette(entry){
  const seed=entry.id||entry.slug||entry.title||"case";
  const h=hash01(seed,1);
  return [
    new THREE.Color().setHSL(h,.82,.68),
    new THREE.Color().setHSL((h+.18+hash01(seed,2)*.08)%1,.78,.64),
    new THREE.Color().setHSL((h+.55+hash01(seed,3)*.08)%1,.82,.66)
  ];
}

function paletteFor(entry){
  const list=Array.isArray(entry.palette)?entry.palette.filter(Boolean):[];
  return list.length?list.map(c=>new THREE.Color(c)):autoPalette(entry);
}

export function createInterpreter(cases){
  const currentYear=new Date().getFullYear();
  const years=cases.map(c=>Number(c.year)||currentYear);
  const min=Math.min(...years);
  const max=Math.max(...years);

  return entry=>{
    const seed=entry.id||entry.slug||entry.title||"case";
    const year=Number(entry.year)||currentYear;
    const y=max===min?.5:(year-min)/(max-min);

    const intensity=entry.intensity==null
      ? .55+hash01(seed,4)*.32
      : clamp01(entry.intensity);

    const complexity=entry.complexity==null
      ? .5+hash01(seed,5)*.38
      : clamp01(entry.complexity);

    const tags=Array.isArray(entry.tags)?entry.tags:[];
    const location=entry.location||{};
    const lat=Number(location.lat)||0;
    const lng=Number(location.lng)||0;
    const visual=entry.visual||{};

    return {
      morph:THREE.MathUtils.lerp(.28,.96,y),
      density:.35+complexity*.9,
      distortion:.3+intensity*.74,
      glitch:.08+(tags.includes("Glitch")?.74:complexity*.2),
      moire:.65+complexity*.55+(Number(visual.moireBias)||0),
      zebra:.5+intensity*.4,
      rotationBias:THREE.MathUtils.mapLinear(lng,-180,180,-Math.PI,Math.PI),
      tiltBias:THREE.MathUtils.mapLinear(lat,-90,90,-.72,.72),
      intensity,
      complexity,
      palette:paletteFor(entry),

      heroScale:Number(visual.heroScale)||(.94+hash01(seed,10)*.16),
      moireScale:Number(visual.moireScale)||(.90+hash01(seed,11)*.20),
      auraScale:Number(visual.auraScale)||(.90+hash01(seed,12)*.24),
      wireScale:Number(visual.wireScale)||(.94+hash01(seed,13)*.14),
      bloomBias:Number(visual.bloomBias)||(-.05+hash01(seed,14)*.14),
      orbitBias:Number(visual.orbitBias)||(-.16+hash01(seed,15)*.32),
      iridescenceBias:Number(visual.iridescenceBias)||(.85+hash01(seed,16)*.35)
    };
  };
}
