import { VISUAL_PARAMS as P } from "./visual-config.js";

const STORAGE_KEY="visualaura.control-console.v1";

const controls=[
  {group:"Bloom",path:"bloom.strength",label:"Strength",min:0,max:2.5,step:.01},
  {group:"Bloom",path:"bloom.radius",label:"Radius",min:0,max:1,step:.01},
  {group:"Bloom",path:"bloom.threshold",label:"Threshold",min:0,max:1.5,step:.01},
  {group:"Bloom",path:"bloom.motionBoost",label:"Motion Boost",min:0,max:1,step:.01},

  {group:"Scaffold",path:"layers.scaffold.pointCount",label:"Points",min:24,max:240,step:1,reload:true},
  {group:"Scaffold",path:"layers.scaffold.neighbors",label:"Neighbors",min:1,max:7,step:1,reload:true},
  {group:"Scaffold",path:"layers.scaffold.radius",label:"Radius",min:.5,max:5,step:.01,reload:true},
  {group:"Scaffold",path:"layers.scaffold.innerRadius",label:"Inner Radius",min:.2,max:1,step:.01,reload:true},
  {group:"Scaffold",path:"layers.scaffold.ellipsoid.0",label:"Ellipsoid X",min:.3,max:2,step:.01,reload:true},
  {group:"Scaffold",path:"layers.scaffold.ellipsoid.1",label:"Ellipsoid Y",min:.3,max:2,step:.01,reload:true},
  {group:"Scaffold",path:"layers.scaffold.ellipsoid.2",label:"Ellipsoid Z",min:.3,max:2,step:.01,reload:true},
  {group:"Scaffold",path:"layers.scaffold.spokeEvery",label:"Spoke Every",min:1,max:18,step:1,reload:true},
  {group:"Scaffold",path:"layers.scaffold.opacity",label:"Opacity",min:0,max:1,step:.01},
  {group:"Scaffold",path:"layers.scaffold.breathing",label:"Breathing",min:0,max:.15,step:.001},
  {group:"Scaffold",path:"material.scaffold.glow",label:"Iridescent Glow",min:0,max:3,step:.01},
  {group:"Scaffold",path:"material.scaffold.whiteCore",label:"White Core",min:0,max:1,step:.01},

  {group:"Triangle Shell",path:"layers.shell.count",label:"Polygon Count",min:30,max:500,step:1,reload:true},
  {group:"Triangle Shell",path:"layers.shell.reflectiveRatio",label:"Webcam Ratio",min:0,max:.7,step:.01,reload:true},
  {group:"Triangle Shell",path:"layers.shell.radiusMin",label:"Radius Min",min:.5,max:6,step:.01,reload:true},
  {group:"Triangle Shell",path:"layers.shell.radiusMax",label:"Radius Max",min:1,max:9,step:.01,reload:true},
  {group:"Triangle Shell",path:"layers.shell.ellipsoid.0",label:"Ellipsoid X",min:.3,max:2,step:.01,reload:true},
  {group:"Triangle Shell",path:"layers.shell.ellipsoid.1",label:"Ellipsoid Y",min:.3,max:2,step:.01,reload:true},
  {group:"Triangle Shell",path:"layers.shell.ellipsoid.2",label:"Ellipsoid Z",min:.3,max:2,step:.01,reload:true},
  {group:"Triangle Shell",path:"layers.shell.radialJitter",label:"Radial Jitter",min:0,max:1.5,step:.01,reload:true},
  {group:"Triangle Shell",path:"layers.shell.moireSizeMin",label:"Moiré Size Min",min:.02,max:1,step:.01,reload:true},
  {group:"Triangle Shell",path:"layers.shell.moireSizeMax",label:"Moiré Size Max",min:.1,max:2,step:.01,reload:true},
  {group:"Triangle Shell",path:"layers.shell.reflectiveSizeMin",label:"Mirror Size Min",min:.1,max:2.5,step:.01,reload:true},
  {group:"Triangle Shell",path:"layers.shell.reflectiveSizeMax",label:"Mirror Size Max",min:.3,max:4,step:.01,reload:true},
  {group:"Triangle Shell",path:"layers.shell.frontBias",label:"Front Bias",min:-1,max:1,step:.01,reload:true},
  {group:"Triangle Shell",path:"layers.shell.rotationJitter",label:"Rotation Jitter",min:0,max:2,step:.01,reload:true},

  {group:"Webcam Material",path:"material.reflection.saturation",label:"Saturation",min:0,max:1.5,step:.01},
  {group:"Webcam Material",path:"material.reflection.brightness",label:"Brightness",min:0,max:3,step:.01},
  {group:"Webcam Material",path:"material.reflection.baseLift",label:"Base Lift",min:0,max:.5,step:.005},
  {group:"Webcam Material",path:"material.reflection.edgeGlow",label:"Edge Glow",min:0,max:4,step:.01},
  {group:"Webcam Material",path:"material.reflection.fresnelGlow",label:"Fresnel Glow",min:0,max:2,step:.01},
  {group:"Webcam Material",path:"material.reflection.opacity",label:"Opacity",min:0,max:1,step:.01},

  {group:"Moiré Material",path:"material.moire.black",label:"Black Level",min:0,max:.25,step:.001},
  {group:"Moiré Material",path:"material.moire.white",label:"White Level",min:.2,max:1.5,step:.01},
  {group:"Moiré Material",path:"material.moire.opacity",label:"Opacity",min:0,max:1,step:.01},
  {group:"Moiré Material",path:"material.moire.frequencyA",label:"Frequency A",min:4,max:120,step:1},
  {group:"Moiré Material",path:"material.moire.frequencyB",label:"Frequency B",min:4,max:120,step:1},
  {group:"Moiré Material",path:"material.moire.radialFrequency",label:"Radial Freq",min:4,max:160,step:1},
  {group:"Moiré Material",path:"material.moire.zebraMix",label:"Zebra Mix",min:0,max:1,step:.01},
  {group:"Moiré Material",path:"material.moire.edgeGlow",label:"Edge Glow",min:0,max:3,step:.01},

  {group:"Outer Wire",path:"layers.giantWire.count",label:"Count",min:1,max:40,step:1,reload:true},
  {group:"Outer Wire",path:"layers.giantWire.radiusMin",label:"Radius Min",min:2,max:10,step:.01,reload:true},
  {group:"Outer Wire",path:"layers.giantWire.radiusMax",label:"Radius Max",min:3,max:15,step:.01,reload:true},
  {group:"Outer Wire",path:"layers.giantWire.sizeMin",label:"Size Min",min:.5,max:8,step:.01,reload:true},
  {group:"Outer Wire",path:"layers.giantWire.sizeMax",label:"Size Max",min:1,max:12,step:.01,reload:true},
  {group:"Outer Wire",path:"layers.giantWire.tubeRadius",label:"Tube Radius",min:.003,max:.09,step:.001,reload:true},
  {group:"Outer Wire",path:"layers.giantWire.emissiveIntensity",label:"Glow",min:0,max:.4,step:.005},
  {group:"Outer Wire",path:"layers.giantWire.metalness",label:"Metalness",min:0,max:1,step:.01},
  {group:"Outer Wire",path:"layers.giantWire.roughness",label:"Roughness",min:0,max:1,step:.01},
  {group:"Outer Wire",path:"layers.giantWire.clearcoat",label:"Clearcoat",min:0,max:1,step:.01},
  {group:"Outer Wire",path:"layers.giantWire.clearcoatRoughness",label:"Coat Roughness",min:0,max:1,step:.01},

  {group:"Reaction",path:"reaction.root.pointerX",label:"Pointer X",min:0,max:.6,step:.01},
  {group:"Reaction",path:"reaction.root.pointerY",label:"Pointer Y",min:0,max:.6,step:.01},
  {group:"Reaction",path:"reaction.root.cameraX",label:"Camera X",min:0,max:.8,step:.01},
  {group:"Reaction",path:"reaction.root.cameraY",label:"Camera Y",min:0,max:.8,step:.01},
  {group:"Reaction",path:"reaction.root.velocityRoll",label:"Velocity Roll",min:0,max:2,step:.01},
  {group:"Reaction",path:"reaction.scaffold.cameraX",label:"Scaffold Cam X",min:0,max:.8,step:.01},
  {group:"Reaction",path:"reaction.scaffold.cameraY",label:"Scaffold Cam Y",min:0,max:.8,step:.01},
  {group:"Reaction",path:"reaction.scaffold.velocitySpin",label:"Scaffold Spin",min:0,max:2,step:.01},
  {group:"Reaction",path:"reaction.scaffold.motionScale",label:"Scaffold Pulse",min:0,max:.2,step:.001},
  {group:"Reaction",path:"reaction.shell.influenceRadius",label:"Shell Influence",min:.5,max:10,step:.01},
  {group:"Reaction",path:"reaction.shell.xPush",label:"Shell Push X",min:0,max:1,step:.01},
  {group:"Reaction",path:"reaction.shell.yPush",label:"Shell Push Y",min:0,max:1,step:.01},
  {group:"Reaction",path:"reaction.shell.zPush",label:"Shell Push Z",min:0,max:1,step:.01},
  {group:"Reaction",path:"reaction.shell.velocityTilt",label:"Shell Tilt",min:0,max:4,step:.01},
  {group:"Reaction",path:"reaction.shell.scalePulse",label:"Shell Pulse",min:0,max:.3,step:.001},
  {group:"Reaction",path:"reaction.giantWire.xPush",label:"Outer Push X",min:0,max:.6,step:.01},
  {group:"Reaction",path:"reaction.giantWire.yPush",label:"Outer Push Y",min:0,max:.6,step:.01},
  {group:"Reaction",path:"reaction.giantWire.velocityTilt",label:"Outer Tilt",min:0,max:2,step:.01},
  {group:"Reaction",path:"reaction.giantWire.motionScale",label:"Outer Pulse",min:0,max:.15,step:.001}
];

const colors=[
  {group:"Outer Wire",path:"layers.giantWire.darkColor",label:"Base Color"},
  {group:"Outer Wire",path:"layers.giantWire.emissiveColor",label:"Emissive"}
];

function getPath(path){
  return path.split(".").reduce((obj,key)=>obj?.[key],P);
}

function setPath(path,value){
  const keys=path.split(".");
  const last=keys.pop();
  const parent=keys.reduce((obj,key)=>obj[key],P);
  parent[last]=value;
}

function snapshot(){
  const data={};
  [...controls,...colors].forEach(item=>{data[item.path]=getPath(item.path);});
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
    Object.entries(stored).forEach(([path,value])=>{
      try{setPath(path,value);}catch{}
    });
  }catch(err){
    console.warn("VISUALAURA: invalid stored console parameters",err);
  }
}

export function createControlConsole({visual,onStructuralChange}={}){
  const panel=document.createElement("aside");
  panel.className="va-console";
  panel.innerHTML=
    '<div class="va-console__header">' +
      '<div><strong>VISUAL AURA</strong><span>PARAMETRIC CONSOLE</span></div>' +
      '<button class="va-console__collapse" type="button" aria-label="Konsole ein-/ausklappen">−</button>' +
    '</div>' +
    '<div class="va-console__body"></div>' +
    '<div class="va-console__footer">' +
      '<label class="va-console__toggle"><input type="checkbox" data-randomize /><span>new seed on reload</span></label>' +
      '<div class="va-console__seed"><span>seed</span><input type="number" data-seed min="0" step="1" /></div>' +
      '<button type="button" data-rebuild>REGENERATE</button>' +
      '<button type="button" data-reset>RESET SAVED</button>' +
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

  let structuralDirty=false;
  const rebuildButton=panel.querySelector("[data-rebuild]");

  const markStructural=()=>{
    structuralDirty=true;
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
    details.open=["Bloom","Scaffold","Triangle Shell"].includes(groupName);

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
        input.value=getPath(item.path);
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
          setPath(item.path,next);
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

  return {
    panel,
    markStructural,
    get structuralDirty(){return structuralDirty;}
  };
}