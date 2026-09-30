import { VISUAL_PARAMS as P } from "./visual-config.js";

const STORAGE_KEY="visualaura.control-console.v4";

const controls=[
  {group:"Bloom",path:"bloom.strength",label:"Strength",min:0,max:2.5,step:.01},
  {group:"Bloom",path:"bloom.radius",label:"Radius",min:0,max:1,step:.01},
  {group:"Bloom",path:"bloom.threshold",label:"Threshold",min:0,max:1.5,step:.01},
  {group:"Bloom",path:"bloom.motionBoost",label:"Motion Boost",min:0,max:1,step:.01},

  {group:"Global Dither",path:"postfx.dither.strength",label:"Strength",min:0,max:1,step:.01},
  {group:"Global Dither",path:"postfx.dither.scale",label:"Scale",min:.5,max:8,step:.05},
  {group:"Global Dither",path:"postfx.dither.levels",label:"Color Levels",min:2,max:16,step:1},

  {group:"Amorphous Band",path:"composition.band.segments",label:"Segments",min:16,max:120,step:1,reload:true},
  {group:"Amorphous Band",path:"composition.band.radius",label:"Radius",min:.8,max:5,step:.01,reload:true},
  {group:"Amorphous Band",path:"composition.band.radiusNoise",label:"Radius Noise",min:0,max:1.5,step:.01,reload:true},
  {group:"Amorphous Band",path:"composition.band.width",label:"Band Width",min:.2,max:3,step:.01,reload:true},
  {group:"Amorphous Band",path:"composition.band.widthNoise",label:"Width Noise",min:0,max:1.5,step:.01,reload:true},
  {group:"Amorphous Band",path:"composition.band.yScale",label:"Y Scale",min:.2,max:1.5,step:.01,reload:true},
  {group:"Amorphous Band",path:"composition.band.depth",label:"Depth",min:0,max:2.5,step:.01,reload:true},
  {group:"Amorphous Band",path:"composition.band.fold",label:"Facet Fold",min:0,max:1.5,step:.01,reload:true},
  {group:"Amorphous Band",path:"composition.band.twist",label:"Base Twist",min:0,max:2.5,step:.01,reload:true},
  {group:"Amorphous Band",path:"composition.band.rotationX",label:"Rotation X",min:-1,max:1,step:.01,reload:true},
  {group:"Amorphous Band",path:"composition.band.rotationY",label:"Rotation Y",min:-1,max:1,step:.01,reload:true},
  {group:"Amorphous Band",path:"composition.band.rotationZ",label:"Rotation Z",min:-1,max:1,step:.01,reload:true},

  {group:"Band Material",path:"material.band.opacity",label:"Opacity",min:0,max:1,step:.01},
  {group:"Band Material",path:"material.band.brightness",label:"Brightness",min:0,max:3,step:.01},
  {group:"Band Material",path:"material.band.edgeGlow",label:"Edge Glow",min:0,max:4,step:.01},
  {group:"Band Material",path:"material.band.fresnelGlow",label:"Fresnel",min:0,max:3,step:.01},
  {group:"Band Material",path:"material.band.whiteSpecular",label:"White Specular",min:0,max:1.5,step:.01},
  {group:"Band Material",path:"material.band.speed",label:"Color Speed",min:0,max:1,step:.01},

  {group:"Wire Aura",path:"composition.wireAura.count",label:"Triangle Count",min:4,max:100,step:1,reload:true},
  {group:"Wire Aura",path:"composition.wireAura.radiusMin",label:"Radius Min",min:1,max:8,step:.01,reload:true},
  {group:"Wire Aura",path:"composition.wireAura.radiusMax",label:"Radius Max",min:1.5,max:10,step:.01,reload:true},
  {group:"Wire Aura",path:"composition.wireAura.yScale",label:"Y Scale",min:.2,max:1.5,step:.01,reload:true},
  {group:"Wire Aura",path:"composition.wireAura.zSpread",label:"Z Spread",min:0,max:8,step:.01,reload:true},
  {group:"Wire Aura",path:"composition.wireAura.sizeMin",label:"Size Min",min:.05,max:2,step:.01,reload:true},
  {group:"Wire Aura",path:"composition.wireAura.sizeMax",label:"Size Max",min:.1,max:4,step:.01,reload:true},
  {group:"Wire Aura",path:"composition.wireAura.networkStride",label:"Network Stride",min:2,max:12,step:1,reload:true},
  {group:"Wire Aura",path:"composition.wireAura.networkOpacity",label:"Network Opacity",min:0,max:1,step:.01},
  {group:"Wire Aura",path:"material.wire.opacity",label:"Wire Opacity",min:0,max:1,step:.01},
  {group:"Wire Aura",path:"material.wire.glow",label:"Wire Glow",min:0,max:3,step:.01},
  {group:"Wire Aura",path:"material.wire.speed",label:"Color Speed",min:0,max:1,step:.01},
  {group:"Wire Aura",path:"material.points.opacity",label:"Node Opacity",min:0,max:1,step:.01},
  {group:"Wire Aura",path:"material.points.size",label:"Node Size",min:.005,max:.12,step:.001},

  {group:"Typography",path:"composition.typography.scale",label:"Scale",min:.5,max:1.8,step:.01},
  {group:"Typography",path:"composition.typography.opacity",label:"Opacity",min:0,max:1,step:.01},

  {group:"Reaction",path:"reaction.root.pointerX",label:"Pointer X",min:0,max:.6,step:.01},
  {group:"Reaction",path:"reaction.root.pointerY",label:"Pointer Y",min:0,max:.6,step:.01},
  {group:"Reaction",path:"reaction.root.cameraX",label:"Camera X",min:0,max:.8,step:.01},
  {group:"Reaction",path:"reaction.root.cameraY",label:"Camera Y",min:0,max:.8,step:.01},

  {group:"Reaction",path:"reaction.band.xPush",label:"Band Push X",min:0,max:1,step:.01},
  {group:"Reaction",path:"reaction.band.yPush",label:"Band Push Y",min:0,max:1,step:.01},
  {group:"Reaction",path:"reaction.band.zPush",label:"Band Push Z",min:0,max:1,step:.01},
  {group:"Reaction",path:"reaction.band.velocityTilt",label:"Band Velocity",min:0,max:2,step:.01},
  {group:"Reaction",path:"reaction.band.scalePulse",label:"Band Pulse",min:0,max:.3,step:.001},

  {group:"Reaction",path:"reaction.wireAura.xPush",label:"Wire Push X",min:0,max:1,step:.01},
  {group:"Reaction",path:"reaction.wireAura.yPush",label:"Wire Push Y",min:0,max:1,step:.01},
  {group:"Reaction",path:"reaction.wireAura.zPush",label:"Wire Push Z",min:0,max:1,step:.01},
  {group:"Reaction",path:"reaction.wireAura.velocityTilt",label:"Wire Velocity",min:0,max:2,step:.01},
  {group:"Reaction",path:"reaction.wireAura.scalePulse",label:"Wire Pulse",min:0,max:.3,step:.001}
];

function getPath(path){
  return path.split(".").reduce((obj,key)=>obj?.[key],P);
}

function setPath(path,value){
  const keys=path.split(".");
  const last=keys.pop();
  const parent=keys.reduce((obj,key)=>obj?.[key],P);
  if(parent==null)return false;
  parent[last]=value;
  return true;
}

function snapshot(){
  const data={};
  controls.forEach(item=>{
    data[item.path]=getPath(item.path);
  });
  data["generation.randomizeEachLoad"]=P.generation.randomizeEachLoad;
  data["generation.seed"]=P.generation.seed;
  return data;
}

function persist(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(snapshot()));
}

export function applyStoredVisualParams(){
  try{
    const stored=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
    if(!stored)return;
    Object.entries(stored).forEach(([path,value])=>setPath(path,value));
  }catch(err){
    console.warn("VISUALAURA: invalid stored console parameters",err);
  }
}

export function createControlConsole({visual,onStructuralChange}={}){
  const panel=document.createElement("aside");
  panel.className="va-console";

  panel.innerHTML=
    '<div class="va-console__header">'+
      '<div><strong>VISUAL AURA</strong><span>AMORPHOUS TRIANGLE RIBBON</span></div>'+
      '<button class="va-console__collapse" type="button" aria-label="Konsole ein-/ausklappen">−</button>'+
    '</div>'+
    '<div class="va-console__body"></div>'+
    '<div class="va-console__footer">'+
      '<label class="va-console__toggle"><input type="checkbox" data-randomize /><span>new seed on reload</span></label>'+
      '<div class="va-console__seed"><span>seed</span><input type="number" data-seed min="0" step="1" /></div>'+
      '<button type="button" data-rebuild>REGENERATE</button>'+
      '<button type="button" data-reset>RESET SAVED</button>'+
    '</div>';

  const body=panel.querySelector(".va-console__body");
  const grouped=new Map();

  controls.forEach(item=>{
    if(!grouped.has(item.group))grouped.set(item.group,[]);
    grouped.get(item.group).push(item);
  });

  const rebuildButton=panel.querySelector("[data-rebuild]");

  const markStructural=()=>{
    rebuildButton.classList.add("dirty");
    rebuildButton.textContent="REGENERATE *";
  };

  const applyRuntime=()=>{
    persist();
    visual?.applyParams?.();
  };

  grouped.forEach((items,groupName)=>{
    const details=document.createElement("details");
    details.className="va-console__group";
    details.open=[
      "Global Dither",
      "Amorphous Band",
      "Band Material",
      "Wire Aura",
      "Typography"
    ].includes(groupName);

    const summary=document.createElement("summary");
    summary.textContent=groupName;
    details.appendChild(summary);

    items.forEach(item=>{
      const row=document.createElement("label");
      row.className="va-console__row";

      const name=document.createElement("span");
      name.className="va-console__label";
      name.textContent=item.label+(item.reload?" ↻":"");

      const slider=document.createElement("input");
      slider.type="range";
      slider.min=item.min;
      slider.max=item.max;
      slider.step=item.step;
      slider.value=getPath(item.path);

      const value=document.createElement("input");
      value.type="number";
      value.min=item.min;
      value.max=item.max;
      value.step=item.step;
      value.value=getPath(item.path);

      const update=raw=>{
        const next=Number(raw);
        if(!Number.isFinite(next))return;
        if(!setPath(item.path,next))return;

        slider.value=next;
        value.value=next;

        if(item.reload)markStructural();
        applyRuntime();
      };

      slider.addEventListener("input",()=>update(slider.value));
      value.addEventListener("change",()=>update(value.value));

      const inputs=document.createElement("span");
      inputs.className="va-console__inputs";
      inputs.append(slider,value);
      row.append(name,inputs);
      details.appendChild(row);
    });

    body.appendChild(details);
  });

  const randomize=panel.querySelector("[data-randomize]");
  randomize.checked=P.generation.randomizeEachLoad;
  randomize.addEventListener("change",()=>{
    P.generation.randomizeEachLoad=randomize.checked;
    markStructural();
    persist();
  });

  const seed=panel.querySelector("[data-seed]");
  seed.value=Math.round(P.generation.seed);
  seed.addEventListener("change",()=>{
    P.generation.seed=Number(seed.value)||0;
    P.generation.randomizeEachLoad=false;
    randomize.checked=false;
    markStructural();
    persist();
  });

  rebuildButton.addEventListener("click",()=>{
    persist();
    onStructuralChange?.();
    if(!onStructuralChange)location.reload();
  });

  panel.querySelector("[data-reset]").addEventListener("click",()=>{
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("visualaura.control-console.v3");
    localStorage.removeItem("visualaura.control-console.v2");
    localStorage.removeItem("visualaura.control-console.v1");
    location.reload();
  });

  panel.querySelector(".va-console__collapse").addEventListener("click",e=>{
    panel.classList.toggle("collapsed");
    e.currentTarget.textContent=panel.classList.contains("collapsed")?"+":"−";
  });

  document.body.appendChild(panel);

  const launcher=document.createElement("button");
  launcher.className="va-console-launcher";
  launcher.type="button";
  launcher.textContent="PARAMS";
  launcher.addEventListener("click",()=>panel.classList.toggle("hidden"));
  document.body.appendChild(launcher);

  addEventListener("keydown",e=>{
    if(e.code==="Backquote")panel.classList.toggle("hidden");
  });

  return {panel};
}
