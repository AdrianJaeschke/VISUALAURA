import * as THREE from "three";
export function createInterpreter(cases){
  const years=cases.map(c=>c.year), min=Math.min(...years), max=Math.max(...years);
  return entry=>{
    const y=max===min?.5:(entry.year-min)/(max-min);
    return {
      morph:THREE.MathUtils.lerp(.28,.96,y),
      density:.35+entry.complexity*.9,
      distortion:.3+entry.intensity*.74,
      glitch:.08+(entry.tags.includes("Glitch")?.74:entry.complexity*.2),
      moire:.65+entry.complexity*.55,
      zebra:.5+entry.intensity*.4,
      rotationBias:THREE.MathUtils.mapLinear(entry.location.lng,-180,180,-Math.PI,Math.PI),
      tiltBias:THREE.MathUtils.mapLinear(entry.location.lat,-90,90,-.72,.72),
      intensity:entry.intensity,
      palette:entry.palette.map(c=>new THREE.Color(c))
    };
  };
}