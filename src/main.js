import * as THREE from "three";
import {loadCases} from "./cms.js";
import {createInterpreter} from "./interpreter.js";
import {createCameraInput} from "./camera-input.js";
import {createVisualScene,updateVisualScene} from "./scene.js";

const isMobile=matchMedia("(pointer: coarse)").matches||/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const el=id=>document.getElementById(id);
const video=el("bg-video"),mode=el("mode-label"),intro=el("intro"),dots=el("case-dots"),title=el("case-title"),kicker=el("case-kicker"),detail=el("case-detail");
const CASES=await loadCases();
const cameraInput=createCameraInput(video,isMobile),interpret=createInterpreter(CASES),visual=createVisualScene(el("stage"),CASES,cameraInput.texture);
let activeCase=0,state=interpret(CASES[0]),targetState=state,wheelLock=false;
const pointer=new THREE.Vector2(),targetPointer=new THREE.Vector2(),gyroTarget=new THREE.Vector2();

function setCase(i){activeCase=(i+CASES.length)%CASES.length;const c=CASES[activeCase];targetState=interpret(c);kicker.textContent=`Case ${String(activeCase+1).padStart(2,"0")}`;title.textContent=c.title;detail.innerHTML=`<span>${c.year}</span><span>${c.location.city}</span><span>${c.disciplines.join(" / ")}</span>`;[...dots.children].forEach((d,j)=>d.classList.toggle("active",j===activeCase))}
CASES.forEach((c,i)=>{const b=document.createElement("button");b.className="case-dot"+(i===0?" active":"");b.ariaLabel=c.title;b.onclick=()=>setCase(i);dots.appendChild(b)});setCase(0);

const updatePointer=(x,y)=>{targetPointer.x=x/innerWidth*2-1;targetPointer.y=-(y/innerHeight*2-1)};
addEventListener("pointermove",e=>updatePointer(e.clientX,e.clientY),{passive:true});
addEventListener("pointerdown",e=>{updatePointer(e.clientX,e.clientY);if(isMobile&&intro.classList.contains("hidden"))setCase(activeCase+1)},{passive:true});
addEventListener("wheel",e=>{if(wheelLock||!intro.classList.contains("hidden"))return;wheelLock=true;setCase(activeCase+(e.deltaY>0?1:-1));setTimeout(()=>wheelLock=false,420)},{passive:true});
addEventListener("keydown",e=>{if(["ArrowRight","ArrowDown"].includes(e.key))setCase(activeCase+1);if(["ArrowLeft","ArrowUp"].includes(e.key))setCase(activeCase-1)});

async function orientation(){if(!isMobile)return;if(typeof DeviceOrientationEvent!=="undefined"&&typeof DeviceOrientationEvent.requestPermission==="function"){if(await DeviceOrientationEvent.requestPermission()!=="granted")return}
 addEventListener("deviceorientation",e=>{gyroTarget.x=THREE.MathUtils.clamp((e.gamma||0)/35,-1,1);gyroTarget.y=THREE.MathUtils.clamp(((e.beta||0)-45)/45,-1,1)})}
async function start(withCamera){if(withCamera&&navigator.mediaDevices?.getUserMedia){try{await cameraInput.start();mode.textContent=isMobile?"camera / spatial":"webcam / reflective"}catch(e){console.warn(e);mode.textContent=isMobile?"touch / spatial":"mouse / generative"}}else mode.textContent=isMobile?"touch / spatial":"mouse / generative";try{await orientation()}catch{}intro.classList.add("hidden")}
el("start-camera").onclick=()=>start(true);el("start-no-camera").onclick=()=>start(false);
el("help-copy").textContent=isMobile?"Touch · Gerät bewegen · Tap wechselt Cases · Kamera bleibt abstrakt":"Mouse bewegen · Scroll wechselt Cases · Webcam spiegelt nur auf großen Dreiecken";

function lerpState(a,b,t){return {morph:THREE.MathUtils.lerp(a.morph,b.morph,t),density:THREE.MathUtils.lerp(a.density,b.density,t),distortion:THREE.MathUtils.lerp(a.distortion,b.distortion,t),glitch:THREE.MathUtils.lerp(a.glitch,b.glitch,t),moire:THREE.MathUtils.lerp(a.moire,b.moire,t),zebra:THREE.MathUtils.lerp(a.zebra,b.zebra,t),rotationBias:THREE.MathUtils.lerp(a.rotationBias,b.rotationBias,t),tiltBias:THREE.MathUtils.lerp(a.tiltBias,b.tiltBias,t),intensity:THREE.MathUtils.lerp(a.intensity,b.intensity,t),palette:b.palette}}
function glitchCSS(g,m){const s=g*.07+m*.09;document.documentElement.style.setProperty("--glitchOpacity",(0.035+s).toFixed(3));document.documentElement.style.setProperty("--glitchX",`${((Math.random()-.5)*80*s).toFixed(2)}px`);document.documentElement.style.setProperty("--glitchY",`${((Math.random()-.5)*28*s).toFixed(2)}px`)}

const clock=new THREE.Clock();
visual.renderer.setAnimationLoop(()=>{const t=clock.getElapsedTime();pointer.lerp(isMobile?gyroTarget:targetPointer,.07);state=lerpState(state,targetState,.035);if(cameraInput.analysis.active)cameraInput.update(performance.now());const cameraMotion=cameraInput.analysis.active?cameraInput.analysis:{motion:0,motionX:0,motionY:0,velocityX:0,velocityY:0,centroidX:0,centroidY:0,presence:0};updateVisualScene(visual,t,state,pointer,cameraMotion,activeCase);glitchCSS(state.glitch,cameraMotion.motion);visual.renderer.render(visual.scene,visual.camera)});
addEventListener("resize",visual.resize);