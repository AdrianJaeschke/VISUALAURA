import * as THREE from "three";
export function createCameraInput(video,isMobile){
  const canvas=document.createElement("canvas"); canvas.width=256; canvas.height=256;
  const ctx=canvas.getContext("2d",{willReadFrequently:true});
  const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace;
  texture.minFilter=THREE.LinearFilter; texture.magFilter=THREE.LinearFilter;
  const analysis={motion:0,r:0,g:0,b:0,prev:null,active:false,stream:null};

  async function start(){
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:isMobile?{ideal:"environment"}:"user",width:{ideal:1280},height:{ideal:720}},audio:false});
    video.srcObject=stream; await video.play(); analysis.stream=stream; analysis.active=true;
    document.body.classList.add("camera-live");
  }
  function update(){
    if(!analysis.active||video.readyState<2)return;
    ctx.save(); ctx.clearRect(0,0,256,256); ctx.scale(-1,1); ctx.drawImage(video,-256,0,256,256); ctx.restore();
    const img=ctx.getImageData(0,0,256,256), d=img.data;
    let r=0,g=0,b=0,diff=0,samples=0;
    for(let y=0;y<256;y+=16)for(let x=0;x<256;x+=16){
      const i=(y*256+x)*4; r+=d[i];g+=d[i+1];b+=d[i+2];
      if(analysis.prev) diff+=Math.abs(d[i]-analysis.prev[i])+Math.abs(d[i+1]-analysis.prev[i+1])+Math.abs(d[i+2]-analysis.prev[i+2]);
      samples++;
    }
    analysis.r=r/samples/255;analysis.g=g/samples/255;analysis.b=b/samples/255;
    analysis.motion=analysis.prev?THREE.MathUtils.clamp(diff/samples/255/3*4.5,0,1):0;
    analysis.prev=new Uint8ClampedArray(d); texture.needsUpdate=true;
  }
  return {texture,analysis,start,update};
}