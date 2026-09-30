import * as THREE from "three";
import {VISUAL_PARAMS as P} from "./visual-config.js";

export function createCameraInput(video,isMobile){
  const size=P.camera.analysisSize;
  const canvas=document.createElement("canvas");
  canvas.width=size;
  canvas.height=size;

  const ctx=canvas.getContext("2d",{willReadFrequently:true});
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.minFilter=THREE.LinearFilter;
  texture.magFilter=THREE.LinearFilter;

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
    active:false,
    stream:null
  };

  let prevPixels=null;
  let lastCapture=0;
  let lastUpdate=performance.now();
  let rawCentroidX=0;
  let rawCentroidY=0;
  const queue=[];

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

  function capture(now){
    ctx.save();
    ctx.clearRect(0,0,size,size);
    ctx.scale(-1,1);
    ctx.drawImage(video,-size,0,size,size);
    ctx.restore();

    const img=ctx.getImageData(0,0,size,size);
    const d=img.data;

    let r=0,g=0,b=0,diff=0,samples=0;
    let weightedX=0,weightedY=0,weightTotal=0;
    let brightnessTotal=0;

    const step=P.camera.sampleStep;

    for(let y=0;y<size;y+=step){
      for(let x=0;x<size;x+=step){
        const i=(y*size+x)*4;
        r+=d[i];g+=d[i+1];b+=d[i+2];

        const brightness=(d[i]+d[i+1]+d[i+2])/3/255;
        brightnessTotal+=brightness;

        if(prevPixels){
          const delta=(
            Math.abs(d[i]-prevPixels[i])+
            Math.abs(d[i+1]-prevPixels[i+1])+
            Math.abs(d[i+2]-prevPixels[i+2])
          )/(255*3);

          diff+=delta;
          const w=Math.max(0,delta-P.camera.motionThreshold);

          if(w>0){
            const nx=x/(size-1)*2-1;
            const ny=-(y/(size-1)*2-1);
            weightedX+=nx*w;
            weightedY+=ny*w;
            weightTotal+=w;
          }
        }

        samples++;
      }
    }

    const motion=prevPixels
      ? THREE.MathUtils.clamp(diff/samples*P.camera.motionGain,0,1)
      : 0;

    const detectedX=weightTotal>.001?weightedX/weightTotal:rawCentroidX;
    const detectedY=weightTotal>.001?weightedY/weightTotal:rawCentroidY;

    const nextX=THREE.MathUtils.lerp(rawCentroidX,detectedX,P.camera.centroidResponse);
    const nextY=THREE.MathUtils.lerp(rawCentroidY,detectedY,P.camera.centroidResponse);

    const velocityX=THREE.MathUtils.clamp((nextX-rawCentroidX)*motion,-.16,.16);
    const velocityY=THREE.MathUtils.clamp((nextY-rawCentroidY)*motion,-.16,.16);

    rawCentroidX=nextX;
    rawCentroidY=nextY;

    queue.push({
      t:now,
      motion,
      centroidX:nextX,
      centroidY:nextY,
      motionX:nextX*motion,
      motionY:nextY*motion,
      velocityX,
      velocityY,
      presence:THREE.MathUtils.clamp(brightnessTotal/samples*1.6,0,1),
      r:r/samples/255,
      g:g/samples/255,
      b:b/samples/255
    });

    while(queue.length>P.camera.maxQueue)queue.shift();

    prevPixels=new Uint8ClampedArray(d);
    texture.needsUpdate=true;
  }

  function update(now=performance.now()){
    if(!analysis.active||video.readyState<2)return;

    if(now-lastCapture>=P.camera.sampleIntervalMs){
      capture(now);
      lastCapture=now;
    }

    const delayedTime=now-P.camera.delayMs;
    let target=null;

    for(let i=queue.length-1;i>=0;i--){
      if(queue[i].t<=delayedTime){
        target=queue[i];
        break;
      }
    }

    if(!target&&queue.length)target=queue[0];
    if(!target)return;

    const dt=Math.max(1,now-lastUpdate);
    lastUpdate=now;
    const alpha=1-Math.exp(-dt/P.camera.responseMs);

    analysis.motion=THREE.MathUtils.lerp(analysis.motion,target.motion,alpha);
    analysis.centroidX=THREE.MathUtils.lerp(analysis.centroidX,target.centroidX,alpha);
    analysis.centroidY=THREE.MathUtils.lerp(analysis.centroidY,target.centroidY,alpha);
    analysis.motionX=THREE.MathUtils.lerp(analysis.motionX,target.motionX,alpha);
    analysis.motionY=THREE.MathUtils.lerp(analysis.motionY,target.motionY,alpha);
    analysis.velocityX=THREE.MathUtils.lerp(analysis.velocityX,target.velocityX,alpha);
    analysis.velocityY=THREE.MathUtils.lerp(analysis.velocityY,target.velocityY,alpha);
    analysis.presence=THREE.MathUtils.lerp(analysis.presence,target.presence,alpha);
    analysis.r=THREE.MathUtils.lerp(analysis.r,target.r,alpha);
    analysis.g=THREE.MathUtils.lerp(analysis.g,target.g,alpha);
    analysis.b=THREE.MathUtils.lerp(analysis.b,target.b,alpha);
  }

  return {texture,analysis,start,update};
}