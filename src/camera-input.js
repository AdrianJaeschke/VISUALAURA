import * as THREE from "three";
import { PARAMS } from "./params.js";

const expAlpha=(dt,ms)=>1-Math.exp(-Math.max(dt,1)/Math.max(ms,1));

export function createCameraInput(video,isMobile){
  const canvas=document.createElement("canvas");
  canvas.width=256;
  canvas.height=256;

  const ctx=canvas.getContext("2d",{willReadFrequently:true});
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.minFilter=THREE.LinearFilter;
  texture.magFilter=THREE.LinearFilter;

  const history=[];
  let lastSample=0;
  let lastSmooth=performance.now();
  let delayedPrev={x:0,y:0};

  const analysis={
    motion:0,
    motionX:0,
    motionY:0,
    velocityX:0,
    velocityY:0,
    centroidX:0,
    centroidY:0,
    presence:0,
    r:0,g:0,b:0,
    rawMotion:0,
    prev:null,
    active:false,
    stream:null
  };

  async function start(){
    const stream=await navigator.mediaDevices.getUserMedia({
      video:{
        facingMode:isMobile?{ideal:"environment"}:"user",
        width:{ideal:1280},
        height:{ideal:720}
      },
      audio:false
    });

    video.srcObject=stream;
    await video.play();
    analysis.stream=stream;
    analysis.active=true;
    document.body.classList.add("camera-live");
  }

  function sample(now){
    ctx.save();
    ctx.clearRect(0,0,256,256);
    ctx.scale(-1,1);
    ctx.drawImage(video,-256,0,256,256);
    ctx.restore();

    const img=ctx.getImageData(0,0,256,256);
    const d=img.data;

    let r=0,g=0,b=0,diff=0,samples=0;
    let weightedX=0,weightedY=0,weightTotal=0;
    let brightnessTotal=0;

    const step=12;

    for(let y=0;y<256;y+=step){
      for(let x=0;x<256;x+=step){
        const i=(y*256+x)*4;
        r+=d[i];g+=d[i+1];b+=d[i+2];

        const brightness=(d[i]+d[i+1]+d[i+2])/(255*3);
        brightnessTotal+=brightness;

        if(analysis.prev){
          const delta=(
            Math.abs(d[i]-analysis.prev[i])+
            Math.abs(d[i+1]-analysis.prev[i+1])+
            Math.abs(d[i+2]-analysis.prev[i+2])
          )/(255*3);

          diff+=delta;

          const motionWeight=Math.max(0,delta-PARAMS.camera.motionThreshold);
          if(motionWeight>0){
            const nx=x/255*2-1;
            const ny=-(y/255*2-1);
            weightedX+=nx*motionWeight;
            weightedY+=ny*motionWeight;
            weightTotal+=motionWeight;
          }
        }
        samples++;
      }
    }

    const rawMotion=analysis.prev
      ? THREE.MathUtils.clamp((diff/samples)*PARAMS.camera.motionGain,0,1)
      : 0;

    const cx=weightTotal>PARAMS.camera.centroidDeadZone
      ? weightedX/weightTotal
      : history.length?history[history.length-1].x:0;

    const cy=weightTotal>PARAMS.camera.centroidDeadZone
      ? weightedY/weightTotal
      : history.length?history[history.length-1].y:0;

    history.push({
      t:now,
      x:THREE.MathUtils.clamp(cx,-1,1),
      y:THREE.MathUtils.clamp(cy,-1,1),
      motion:rawMotion,
      presence:THREE.MathUtils.clamp(brightnessTotal/samples*1.55,0,1),
      r:r/samples/255,
      g:g/samples/255,
      b:b/samples/255
    });

    while(history.length>80||history[0]?.t<now-2200)history.shift();

    analysis.prev=new Uint8ClampedArray(d);
    texture.needsUpdate=true;
  }

  function update(){
    if(!analysis.active||video.readyState<2)return;

    const now=performance.now();

    if(now-lastSample>=PARAMS.camera.sampleIntervalMs){
      lastSample=now;
      sample(now);
    }

    if(!history.length)return;

    const delayedAt=now-PARAMS.camera.delayMs;
    let target=history[0];
    for(const item of history){
      if(item.t<=delayedAt)target=item;
      else break;
    }

    const dt=now-lastSmooth;
    lastSmooth=now;

    const a=expAlpha(dt,PARAMS.camera.smoothingMs);
    const av=expAlpha(dt,PARAMS.camera.velocitySmoothingMs);

    const vx=target.x-delayedPrev.x;
    const vy=target.y-delayedPrev.y;
    delayedPrev={x:target.x,y:target.y};

    analysis.centroidX=THREE.MathUtils.lerp(analysis.centroidX,target.x,a);
    analysis.centroidY=THREE.MathUtils.lerp(analysis.centroidY,target.y,a);
    analysis.motion=THREE.MathUtils.lerp(analysis.motion,target.motion,a*.72);
    analysis.rawMotion=target.motion;

    analysis.velocityX=THREE.MathUtils.lerp(analysis.velocityX,vx,av*.45);
    analysis.velocityY=THREE.MathUtils.lerp(analysis.velocityY,vy,av*.45);

    analysis.motionX=THREE.MathUtils.lerp(
      analysis.motionX,
      analysis.centroidX*analysis.motion,
      a*.7
    );
    analysis.motionY=THREE.MathUtils.lerp(
      analysis.motionY,
      analysis.centroidY*analysis.motion,
      a*.7
    );

    analysis.presence=THREE.MathUtils.lerp(analysis.presence,target.presence,a*.45);
    analysis.r=THREE.MathUtils.lerp(analysis.r,target.r,a*.4);
    analysis.g=THREE.MathUtils.lerp(analysis.g,target.g,a*.4);
    analysis.b=THREE.MathUtils.lerp(analysis.b,target.b,a*.4);
  }

  return {texture,analysis,start,update};
}