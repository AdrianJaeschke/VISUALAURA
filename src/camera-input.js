import * as THREE from "three";

export function createCameraInput(video,isMobile){
  const canvas=document.createElement("canvas");
  canvas.width=256;
  canvas.height=256;

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

  function update(){
    if(!analysis.active||video.readyState<2)return;

    ctx.save();
    ctx.clearRect(0,0,256,256);
    ctx.scale(-1,1);
    ctx.drawImage(video,-256,0,256,256);
    ctx.restore();

    const img=ctx.getImageData(0,0,256,256);
    const d=img.data;

    let r=0,g=0,b=0;
    let diff=0;
    let samples=0;
    let weightedX=0;
    let weightedY=0;
    let weightTotal=0;
    let brightnessTotal=0;

    const step=12;

    for(let y=0;y<256;y+=step){
      for(let x=0;x<256;x+=step){
        const i=(y*256+x)*4;

        r+=d[i];
        g+=d[i+1];
        b+=d[i+2];

        const brightness=(d[i]+d[i+1]+d[i+2])/3/255;
        brightnessTotal+=brightness;

        if(analysis.prev){
          const delta=(
            Math.abs(d[i]-analysis.prev[i])+
            Math.abs(d[i+1]-analysis.prev[i+1])+
            Math.abs(d[i+2]-analysis.prev[i+2])
          )/(255*3);

          const motionWeight=Math.max(0,delta-.035);
          diff+=delta;

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
      ? THREE.MathUtils.clamp((diff/samples)*5.2,0,1)
      : 0;

    const nextCentroidX=weightTotal>.001?weightedX/weightTotal:analysis.centroidX;
    const nextCentroidY=weightTotal>.001?weightedY/weightTotal:analysis.centroidY;

    const prevCX=analysis.centroidX;
    const prevCY=analysis.centroidY;

    analysis.centroidX=THREE.MathUtils.lerp(analysis.centroidX,nextCentroidX,.22);
    analysis.centroidY=THREE.MathUtils.lerp(analysis.centroidY,nextCentroidY,.22);

    analysis.velocityX=THREE.MathUtils.lerp(
      analysis.velocityX,
      analysis.centroidX-prevCX,
      .32
    );
    analysis.velocityY=THREE.MathUtils.lerp(
      analysis.velocityY,
      analysis.centroidY-prevCY,
      .32
    );

    analysis.motionX=THREE.MathUtils.lerp(
      analysis.motionX,
      analysis.centroidX*rawMotion,
      .18
    );
    analysis.motionY=THREE.MathUtils.lerp(
      analysis.motionY,
      analysis.centroidY*rawMotion,
      .18
    );

    analysis.motion=THREE.MathUtils.lerp(analysis.motion,rawMotion,.2);
    analysis.presence=THREE.MathUtils.lerp(
      analysis.presence,
      THREE.MathUtils.clamp(brightnessTotal/samples*1.6,0,1),
      .08
    );

    analysis.r=r/samples/255;
    analysis.g=g/samples/255;
    analysis.b=b/samples/255;

    analysis.prev=new Uint8ClampedArray(d);
    texture.needsUpdate=true;
  }

  return {texture,analysis,start,update};
}