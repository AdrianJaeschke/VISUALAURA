import { VISUAL_PARAMS as P } from "./visual-config.js";

const STORAGE_KEY="visualaura.control-console.v2";

const controls=[
  {group:"Bloom",path:"bloom.strength",label:"Strength",min:0,max:2.5,step:.01},
  {group:"Bloom",path:"bloom.radius",label:"Radius",min:0,max:1,step:.01},
  {group:"Bloom",path:"bloom.threshold",label:"Threshold",min:0,max:1.5,step:.01},
  {group:"Bloom",path:"bloom.motionBoost",label:"Motion Boost",min:0,max:1,step:.01},

  {group:"Hero Mirror",path:"composition.hero.size",label:"Size",min:.5,max:5,step:.01,reload:true},
  {group:"Hero Mirror",path:"composition.hero.z",label:"Depth Z",min:-3,max:3,step:.01,reload:true},
  {group:"Hero Mirror",path:"composition.hero.tiltX",label:"Tilt X",min:-1,max:1,step:.01,reload:true},
  {group:"Hero Mirror",path:"composition.hero.tiltY",label:"Tilt Y",min:-1,max:1,step:.01,reload:true},
  {group:"Hero Mirror",path:"material.reflection.saturation",label:"Saturation",min:0,max:1.5,step:.01},
  {group:"Hero Mirror",path:"material.reflection.brightness",label:"Brightness",min:0,max:3,step:.01},
  {group:"Hero Mirror",path:"material.reflection.baseLift",label:"Base Lift",min:0,max:.5,step:.005},
  {group:"Hero Mirror",path:"material.reflection.edgeGlow",label:"Edge Glow",min:0,max:4,step:.01},
  {group:"Hero Mirror",path:"material.reflection.fresnelGlow",label:"Fresnel",min:0,max:2,step:.01},
  {group:"Hero Mirror",path:"material.reflection.opacity",label:"Opacity",min:0,max:1,step:.01},
  {group:"Hero Mirror",path:"dither.hero.strength",label:"Dither",min:0,max:1,step:.01},
  {group:"Hero Mirror",path:"dither.hero.scale",label:"Dither Scale",min:.5,max:8,step:.1},

  {group:"3 Moire",path:"composition.moire.radius",label:"Radius",min:.3,max:5,step:.01,reload:true},
  {group:"3 Moire",path:"composition.moire.sizeMin",label:"Size Min",min:.2,max:3,step:.01,reload:true},
  {group:"3 Moire",path:"composition.moire.sizeMax",label:"Size Max",min:.2,max:4,step:.01,reload:true},
  {group:"3 Moire",path:"composition.moire.zStart",label:"Depth Start",min:-3,max:2,step:.01,reload:true},
  {group:"3 Moire",path:"composition.moire.zStep",label:"Depth Step",min:-1,max:1,step:.01,reload:true},
  {group:"3 Moire",path:"composition.moire.yRatio",label:"Y Ratio",min:.2,max:1.5,step:.01,reload:true},
  {group:"3 Moire",path:"material.moire.black",label:"Black",min:0,max:.25,step:.001},
  {group:"3 Moire",path:"material.moire.white",label:"White",min:.2,max:1.5,step:.01},
  {group:"3 Moire",path:"material.moire.opacity",label:"Opacity",min:0,max:1,step:.01},
  {group:"3 Moire",path:"material.moire.frequencyA",label:"Freq A",min:4,max:120,step:1},
  {group:"3 Moire",path:"material.moire.frequencyB",label:"Freq B",min:4,max:120,step:1},
  {group:"3 Moire",path:"material.moire.radialFrequency",label:"Radial Freq",min:4,max:160,step:1},
  {group:"3 Moire",path:"material.moire.zebraMix",label:"Zebra Mix",min:0,max:1,step:.01},
  {group:"3 Moire",path:"material.moire.edgeGlow",label:"Edge Glow",min:0,max:3,step:.01},
  {group:"3 Moire",path:"dither.moire.strength",label:"Dither",min:0,max:1,step:.01},
  {group:"3 Moire",path:"dither.moire.scale",label:"Dither Scale",min:.5,max:8,step:.1},

  {group:"Iridescent Aura",path:"composition.aura.count",label:"Count",min:12,max:360,step:1,reload:true},
  {group:"Iridescent Aura",path:"composition.aura.radiusMin",label:"Radius Min",min:.5,max:7,step:.01,reload:true},
  {group:"Iridescent Aura",path:"composition.aura.radiusMax",label:"Radius Max",min:1,max:10,step:.01,reload:true},
  {group:"Iridescent Aura",path:"composition.aura.ellipsoid.0",label:"Ellipsoid X",min:.3,max:2,step:.01,reload:true},
  {group:"Iridescent Aura",path:"composition.aura.ellipsoid.1",label:"Ellipsoid Y",min:.3,max:2,step:.01,reload:true},
  {group:"Iridescent Aura",path:"composition.aura.ellipsoid.2",label:"Ellipsoid Z",min:.3,max:2,step:.01,reload:true},
  {group:"Iridescent Aura",path:"composition.aura.sizeMin",label:"Size Min",min:.01,max:.8,step:.005,reload:true},
  {group:"Iridescent Aura",path:"composition.aura.sizeMax",label:"Size Max",min:.03,max:1.5,step:.01,reload:true},
  {group:"Iridescent Aura",path:"composition.aura.depthSpread",label:"Depth Spread",min:0,max:7,step:.01,reload:true},
  {group:"Iridescent Aura",path:"material.iridescent.brightness",label:"Brightness",min:0,max:3,step:.01},
  {group:"Iridescent Aura",path:"material.iridescent.opacity",label:"Opacity",min:0,max:1,step:.01},
  {group:"Iridescent Aura",path:"material.iridescent.edgeGlow",label:"Edge Glow",min:0,max:4,step:.01},
  {group:"Iridescent Aura",path:"material.iridescent.fresnelGlow",label:"Fresnel",min:0,max:2,step:.01},
  {group:"Iridescent Aura",path:"material.iridescent.speed",label:"Color Speed",min:0,max:1,step:.01},
  {group:"Iridescent Aura",path:"dither.aura.strength",label:"Dither",min:0,max:1,step:.01},
  {group:"Iridescent Aura",path:"dither.aura.scale",label:"Dither Scale",min:.5,max:8,step:.1},

  {group:"Outer Wire",path:"composition.outerWire.size",label:"Size",min:2,max:14,step:.01,reload:true},
  {group:"Outer Wire",path:"composition.outerWire.z",label:"Depth Z",min:-6,max:3,step:.01,reload:true},
  {group:"Outer Wire",path:"composition.outerWire.tubeRadius",label:"Tube Radius",min:.003,max:.09,step:.001,reload:true},
  {group:"Outer Wire",path:"composition.outerWire.emissiveIntensity",label:"Glow",min:0,max:.4,step:.005},
  {group:"Outer Wire",path:"composition.outerWire.metalness",label:"Metalness",min:0,max:1,step:.01},
  {group:"Outer Wire",path:"composition.outerWire.roughness",label:"Roughness",min:0,max:1,step:.01},
  {group:"Outer Wire",path:"composition.outerWire.clearcoat",label:"Clearcoat",min:0,max:1,step:.01},
  {group:"Outer Wire",path:"composition.outerWire.clearcoatRoughness",label:"Coat Roughness",min:0,max:1,step:.01},

  {group:"Reaction",path:"reaction.root.pointerX",label:"Pointer X",min:0,max:.6,step:.01},
  {group:"Reaction",path:"reaction.root.pointerY",label:"Pointer Y",min:0,max:.6,step:.01},
  {group:"Reaction",path:"reaction.root.cameraX",label:"Camera X",min:0,max:.8,step:.01},
  {group:"Reaction",path:"reaction.root.cameraY",label:"Camera Y",min:0,max:.8,step:.01},
  {group:"Reaction",path:"reaction.hero.xPush",label:"Hero Push X",min:0,max:1,step:.01},
  {group:"Reaction",path:"reaction.hero.yPush",label:"Hero Push Y",min:0,max:1,step:.01},
  {group:"Reaction",path:"reaction.hero.zPush",label:"Hero Push Z",min:0,max:1,step:.01},
  {group:"Reaction",path:"reaction.hero.velocityTilt",label:"Hero Tilt",min:0,max:4,step:.01},
  {group:"Reaction",path:"reaction.moire.xPush",label:"Moire Push X",min:0,max:1,step:.01},
  {group:"Reaction",path:"reaction.moire.yPush",label:"Moire Push Y",min:0,max:1,step:.01},
  {group:"Reaction",path:"reaction.aura.xPush",label:"Aura Push X",min:0,max:1,step:.01},
  {group:"Reaction",path:"reaction.aura.yPush",label:"Aura Push Y",min:0,max:1,step:.01},
  {group:"Reaction",path:"reaction.outerWire.xPush",label:"Wire Push X",min:0,max:.4,step:.005},
  {group:"Reaction",path:"reaction.outerWire.yPush",label:"Wire Push Y",min:0,max:.4,step:.005}
];

const colors=[
  {group:"Outer Wire",path:"composition.outerWire.darkColor",label:"Base Color"},
  {group:"Outer Wire",path:"composition.outerWire.emissiveColor",label:"Emissive"}
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
  [...controls,...colors].forEach(item=>{
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
      '<div><strong>VISUAL AURA</strong><span>1 / 3 / MANY / 1</span></div>'+
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

  colors.forEach(item=>{
    if(!grouped.has(item.group))grouped.set(item.group,[]);
    grouped.get(item.group).push({...item,color:true});
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
    details.open=["Bloom","Hero Mirror","3 Moire","Iridescent Aura"].includes(groupName);

    const summary=document.createElement("summary");
    summary.textContent=groupName;
    details.appendChild(summary);

    items.forEach(item=>{
      const row=document.createElement("label");
      row.className="va-console__row";

      const name=document.createElement("span");
      name.className="va-console__label";
      name.textContent=item.label+(item.reload?" ↻":"");

      if(item.color){
        const input=document.createElement("input");
        input.type="color";
        input.value=getPath(item.path)||"#000000";
        input.addEventListener("input",()=>{
          setPath(item.path,input.value);
          applyRuntime();
        });
        row.append(name,input);
      }else{
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
      }

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
