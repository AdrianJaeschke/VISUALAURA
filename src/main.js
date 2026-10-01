import * as THREE from "three";
import {loadCases} from "./cms.js";
import {createInterpreter} from "./interpreter.js";
import {createVisualScene,updateVisualScene} from "./scene.js";
import {createCasePresentation} from "./case-presentation.js";
import {applyStoredVisualParams,createControlConsole} from "./control-console.js";

const isMobile=matchMedia("(pointer: coarse)").matches||/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const el=id=>document.getElementById(id);
const mode=el("mode-label"),intro=el("intro"),dots=el("case-dots"),title=el("case-title"),kicker=el("case-kicker"),detail=el("case-detail");
const caseOpen=el("case-open"),startButton=el("start-experience");
const introLoadingBar=el("intro-loading-bar"),introLoadingValue=el("intro-loading-value"),introLoadingLabel=el("intro-loading-label");
const aboutOverlay=el("about-overlay"),aboutTrigger=el("about-trigger"),aboutClose=el("about-close"),aboutBackdrop=el("about-backdrop");

function setIntroProgress(value,label){
  const clamped=Math.max(0,Math.min(100,Math.round(value)));
  if(introLoadingBar)introLoadingBar.style.width=`${clamped}%`;
  if(introLoadingValue)introLoadingValue.textContent=`${clamped}%`;
  if(label&&introLoadingLabel)introLoadingLabel.textContent=label;
}

applyStoredVisualParams();
setIntroProgress(12,"Cases laden");
const CASES=await loadCases();
setIntroProgress(42,"Band aufbauen");
const interpret=createInterpreter(CASES);
const visual=await createVisualScene(el("stage"),CASES);
setIntroProgress(88,"Experience vorbereiten");
const presentation=createCasePresentation();
createControlConsole({visual,onStructuralChange:()=>location.reload()});
setIntroProgress(100,"Bereit");
startButton.disabled=false;

let activeCase=0,state=interpret(CASES[0]),targetState=state,wheelLock=false;
const pointer=new THREE.Vector2(),targetPointer=new THREE.Vector2(),gyroTarget=new THREE.Vector2();

function setCase(i){
  activeCase=(i+CASES.length)%CASES.length;
  const c=CASES[activeCase];
  targetState=interpret(c);
  kicker.textContent=`Case ${String(activeCase+1).padStart(2,"0")}`;
  title.textContent=c.title;
  const meta=[
    c.description,
    c.year,
    c.location?.city,
    Array.isArray(c.disciplines)?c.disciplines.join(" / "):null
  ].filter(Boolean);

  detail.replaceChildren(
    ...meta.map(item=>{
      const span=document.createElement("span");
      span.textContent=String(item);
      return span;
    })
  );
  [...dots.children].forEach((d,j)=>d.classList.toggle("active",j===activeCase));
  if(presentation.isOpen())presentation.open(c,activeCase);
}

CASES.forEach((c,i)=>{
  const b=document.createElement("button");
  b.className="case-dot"+(i===0?" active":"");
  b.ariaLabel=c.title;
  b.onclick=async e=>{
    e.stopPropagation();
    if(i!==activeCase)setCase(i);
    await presentation.open(CASES[activeCase],activeCase);
  };
  dots.appendChild(b);
});
setCase(0);

caseOpen.addEventListener("click",async e=>{
  e.stopPropagation();
  await presentation.open(CASES[activeCase],activeCase);
});

visual.renderer.domElement.addEventListener("click",e=>{
  if(!intro.classList.contains("hidden")||presentation.isOpen()||aboutOverlay.classList.contains("is-open"))return;
  const index=visual.pickCaseLabel(e.clientX,e.clientY);
  if(index==null)return;
  // First click on a ribbon headline only navigates to that case viewpoint.
  // Opening the case remains an explicit action via the arrow button.
  setCase(index);
});

function setAboutOpen(open){
  aboutOverlay.classList.toggle("is-open",open);
  aboutOverlay.setAttribute("aria-hidden",String(!open));
}
aboutTrigger.addEventListener("click",()=>setAboutOpen(true));
aboutClose.addEventListener("click",()=>setAboutOpen(false));
aboutBackdrop.addEventListener("click",()=>setAboutOpen(false));

const updatePointer=(x,y)=>{targetPointer.x=x/innerWidth*2-1;targetPointer.y=-(y/innerHeight*2-1)};
let swipeStart=null;

function canStartCaseSwipe(target){
  return (
    isMobile&&
    intro.classList.contains("hidden")&&
    !presentation.isOpen()&&
    !aboutOverlay.classList.contains("is-open")&&
    !target?.closest?.(".case-meta,.case-dots,button,.about-overlay,.case-overlay")
  );
}

function finishCaseSwipe(x,y){
  if(!swipeStart)return;
  const dx=x-swipeStart.x;
  const dy=y-swipeStart.y;
  const elapsed=performance.now()-swipeStart.time;
  swipeStart=null;

  if(elapsed>1000||Math.abs(dy)<44||Math.abs(dy)<Math.abs(dx)*1.05)return;
  setCase(activeCase+(dy<0?1:-1));
}

addEventListener("pointermove",e=>updatePointer(e.clientX,e.clientY),{passive:true});

// Desktop keeps pointer input. Mobile uses touch events directly because browsers
// may cancel pointer gestures when they interpret a vertical pan.
addEventListener("pointerdown",e=>{
  updatePointer(e.clientX,e.clientY);
  if(isMobile)return;
},{passive:true});

if(isMobile){
  addEventListener("touchstart",e=>{
    if(e.touches.length!==1)return;
    const touch=e.touches[0];
    updatePointer(touch.clientX,touch.clientY);
    if(!canStartCaseSwipe(e.target)){
      swipeStart=null;
      return;
    }
    swipeStart={
      x:touch.clientX,
      y:touch.clientY,
      time:performance.now()
    };
  },{passive:true});

  addEventListener("touchend",e=>{
    if(!swipeStart||e.changedTouches.length!==1)return;
    const touch=e.changedTouches[0];
    finishCaseSwipe(touch.clientX,touch.clientY);
  },{passive:true});

  addEventListener("touchcancel",()=>{
    swipeStart=null;
  },{passive:true});
}
addEventListener("wheel",e=>{if(wheelLock||!intro.classList.contains("hidden")||presentation.isOpen()||aboutOverlay.classList.contains("is-open"))return;wheelLock=true;setCase(activeCase+(e.deltaY>0?1:-1));setTimeout(()=>wheelLock=false,420)},{passive:true});
addEventListener("keydown",e=>{
  if(e.key==="Escape"){
    if(aboutOverlay.classList.contains("is-open")){setAboutOpen(false);return;}
    presentation.close();
    return;
  }
  if(presentation.isOpen()||aboutOverlay.classList.contains("is-open"))return;
  if(["ArrowRight","ArrowDown"].includes(e.key))setCase(activeCase+1);
  if(["ArrowLeft","ArrowUp"].includes(e.key))setCase(activeCase-1);
});

async function orientation(){
  if(!isMobile)return;
  if(
    typeof DeviceOrientationEvent!=="undefined"&&
    typeof DeviceOrientationEvent.requestPermission==="function"
  ){
    if(await DeviceOrientationEvent.requestPermission()!=="granted")return;
  }

  addEventListener("deviceorientation",e=>{
    // Mobile interaction deliberately tracks only left / right tilt.
    // Physical tilt and resulting camera orbit both cap at ±45°.
    gyroTarget.x=THREE.MathUtils.clamp((e.gamma||0)/45,-1,1);
    gyroTarget.y=0;
  },{passive:true});
}
async function start(){
  mode.textContent=isMobile?"touch / spatial":"mouse / generative";
  try{await orientation()}catch{}
  intro.classList.add("hidden");
}
startButton.onclick=start;
el("help-copy").textContent=isMobile
  ?"Swipe ↑↓: vor / zurück · Headline: fokussieren · Neigen ↔: Motiv + Schimmer · Pfeil: öffnen"
  :"Scroll ↑↓: vor / zurück · Headline: fokussieren · Maus ↔: Motiv + Schimmer · Pfeil: öffnen";

function lerpState(a,b,t){
  return {
    morph:THREE.MathUtils.lerp(a.morph,b.morph,t),
    density:THREE.MathUtils.lerp(a.density,b.density,t),
    distortion:THREE.MathUtils.lerp(a.distortion,b.distortion,t),
    glitch:THREE.MathUtils.lerp(a.glitch,b.glitch,t),
    moire:THREE.MathUtils.lerp(a.moire,b.moire,t),
    zebra:THREE.MathUtils.lerp(a.zebra,b.zebra,t),
    rotationBias:THREE.MathUtils.lerp(a.rotationBias,b.rotationBias,t),
    tiltBias:THREE.MathUtils.lerp(a.tiltBias,b.tiltBias,t),
    intensity:THREE.MathUtils.lerp(a.intensity,b.intensity,t),
    complexity:THREE.MathUtils.lerp(a.complexity,b.complexity,t),
    bandScale:THREE.MathUtils.lerp(a.bandScale,b.bandScale,t),
    bandDepth:THREE.MathUtils.lerp(a.bandDepth,b.bandDepth,t),
    bandTwist:THREE.MathUtils.lerp(a.bandTwist,b.bandTwist,t),
    wireScale:THREE.MathUtils.lerp(a.wireScale,b.wireScale,t),
    typeScale:THREE.MathUtils.lerp(a.typeScale,b.typeScale,t),
    bloomBias:THREE.MathUtils.lerp(a.bloomBias,b.bloomBias,t),
    orbitBias:THREE.MathUtils.lerp(a.orbitBias,b.orbitBias,t),
    iridescenceBias:THREE.MathUtils.lerp(a.iridescenceBias,b.iridescenceBias,t),
    palette:b.palette
  };
}
function glitchCSS(g,m){const s=g*.07+m*.09;document.documentElement.style.setProperty("--glitchOpacity",(0.035+s).toFixed(3));document.documentElement.style.setProperty("--glitchX",`${((Math.random()-.5)*80*s).toFixed(2)}px`);document.documentElement.style.setProperty("--glitchY",`${((Math.random()-.5)*28*s).toFixed(2)}px`)}

const clock=new THREE.Clock();
let lastFrame=performance.now();
visual.renderer.setAnimationLoop(()=>{
  const now=performance.now();
  const dt=now-lastFrame;
  lastFrame=now;
  const t=clock.getElapsedTime();

  pointer.lerp(
    isMobile?gyroTarget:targetPointer,
    isMobile?.018:.07
  );
  state=lerpState(state,targetState,.035);

  const cameraMotion={
    active:false,
    motion:0,
    motionX:0,
    motionY:0,
    velocityX:0,
    velocityY:0,
    centroidX:0,
    centroidY:0,
    presence:0
  };

  updateVisualScene(visual,t,state,pointer,cameraMotion,activeCase);
  presentation.update(dt,t,pointer,cameraMotion);
  glitchCSS(state.glitch,cameraMotion.motion);
  visual.composer.render();
});
addEventListener("resize",visual.resize);