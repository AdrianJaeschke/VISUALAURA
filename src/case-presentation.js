import * as THREE from "three";
import { PARAMS } from "./params.js";

const clamp01=v=>Math.max(0,Math.min(1,v));
const easeOutCubic=t=>1-Math.pow(1-clamp01(t),3);
const easeInOutCubic=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;

function hashString(value=""){
  let h=2166136261;
  for(let i=0;i<value.length;i++){
    h^=value.charCodeAt(i);
    h=Math.imul(h,16777619);
  }
  return h>>>0;
}

function random01(seed){
  const x=Math.sin(seed*12.9898+78.233)*43758.5453;
  return Math.abs(x-Math.floor(x));
}

function textTexture(text,palette){
  const canvas=document.createElement("canvas");
  canvas.width=1600;
  canvas.height=420;
  const ctx=canvas.getContext("2d");
  const a=palette?.[0]||"#ffffff";
  const b=palette?.[1]||"#74f7ff";

  ctx.clearRect(0,0,canvas.width,canvas.height);
  const grad=ctx.createLinearGradient(0,0,canvas.width,0);
  grad.addColorStop(0,a);
  grad.addColorStop(.45,"#ffffff");
  grad.addColorStop(1,b);

  ctx.font='800 168px "Turret Road", Arial, sans-serif';
  ctx.textBaseline="middle";
  ctx.textAlign="center";
  ctx.fillStyle=grad;
  ctx.shadowColor=a;
  ctx.shadowBlur=28;
  ctx.fillText(String(text||"CASE").toUpperCase(),canvas.width/2,205);

  ctx.shadowBlur=0;
  ctx.font='500 34px "Turret Road", Arial, sans-serif';
  ctx.fillStyle="rgba(255,255,255,.58)";
  ctx.fillText("CASE / VISUAL AURA",canvas.width/2,338);

  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.minFilter=THREE.LinearFilter;
  return texture;
}

function placeholderTexture(caseData,index){
  const canvas=document.createElement("canvas");
  canvas.width=960;
  canvas.height=640;
  const ctx=canvas.getContext("2d");
  const palette=caseData.palette?.length?caseData.palette:["#74f7ff","#ff4ecf","#7b69ff"];
  const seed=hashString(caseData.id||caseData.title||"case")+index*97;

  ctx.fillStyle="#050507";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  const grad=ctx.createLinearGradient(0,0,canvas.width,canvas.height);
  grad.addColorStop(0,palette[index%palette.length]);
  grad.addColorStop(.52,"#08090d");
  grad.addColorStop(1,palette[(index+1)%palette.length]);
  ctx.globalAlpha=.62;
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.globalAlpha=.9;
  ctx.strokeStyle="rgba(255,255,255,.72)";
  ctx.lineWidth=2;

  for(let i=0;i<34;i++){
    const r=random01(seed+i*13);
    const x=random01(seed+i*31)*canvas.width;
    const y=random01(seed+i*47)*canvas.height;
    const s=40+r*210;
    ctx.beginPath();
    ctx.moveTo(x,y-s*.58);
    ctx.lineTo(x-s*.5,y+s*.32);
    ctx.lineTo(x+s*.5,y+s*.32);
    ctx.closePath();
    if(i%4===0){
      ctx.fillStyle="rgba(255,255,255,"+(.025+r*.08)+")";
      ctx.fill();
    }
    ctx.stroke();
  }

  ctx.globalAlpha=.58;
  ctx.fillStyle="#fff";
  ctx.font='700 42px "Turret Road", Arial, sans-serif';
  ctx.fillText(String(caseData.title||"CASE").toUpperCase(),46,76);
  ctx.font='500 23px "Turret Road", Arial, sans-serif';
  ctx.fillText(String(index+1).padStart(2,"0"),48,118);

  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.minFilter=THREE.LinearFilter;
  return {texture,aspect:canvas.width/canvas.height,generated:true};
}

async function imageTexture(entry,caseData,index){
  const src=typeof entry==="string"?entry:entry?.src;
  if(!src)return placeholderTexture(caseData,index);

  try{
    const loader=new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const texture=await loader.loadAsync(src);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.minFilter=THREE.LinearFilter;
    const image=texture.image;
    return {
      texture,
      aspect:(image?.naturalWidth||image?.width||3)/(image?.naturalHeight||image?.height||2),
      generated:false
    };
  }catch(err){
    console.warn("VISUALAURA: case image could not be loaded",src,err);
    return placeholderTexture(caseData,index);
  }
}

function normalizedMedia(caseData){
  const presentation=caseData.presentation||{};
  const hero=caseData.hero||{};
  const images=[
    ...(Array.isArray(presentation.images)?presentation.images:[]),
    ...(Array.isArray(caseData.images)?caseData.images:[])
  ];

  if(hero.image&&!images.some(item=>(typeof item==="string"?item:item?.src)===hero.image)){
    images.unshift({src:hero.image,alt:caseData.title});
  }

  const video=presentation.video||caseData.video||hero.video||null;
  return {images,video};
}

function createVideoPlane(videoEntry,presentationGroup){
  const src=typeof videoEntry==="string"?videoEntry:videoEntry?.src;
  if(!src)return null;

  const video=document.createElement("video");
  video.src=src;
  video.crossOrigin="anonymous";
  video.muted=true;
  video.loop=true;
  video.playsInline=true;
  video.preload="metadata";

  const texture=new THREE.VideoTexture(video);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.minFilter=THREE.LinearFilter;
  texture.magFilter=THREE.LinearFilter;

  const material=new THREE.MeshBasicMaterial({
    map:texture,
    transparent:true,
    opacity:0,
    depthWrite:false,
    depthTest:false,
    toneMapped:false
  });

  const plane=new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);
  plane.renderOrder=102;
  plane.position.set(0,0,-.38);
  plane.scale.set(PARAMS.presentation.videoWidth,PARAMS.presentation.videoHeight,1);
  plane.userData.kind="video";
  plane.userData.basePosition=plane.position.clone();
  plane.userData.baseScale=plane.scale.clone();
  presentationGroup.add(plane);

  video.play().catch(()=>{});

  return {video,texture,plane};
}

function disposeObject(object){
  object.traverse(child=>{
    if(child.material){
      const materials=Array.isArray(child.material)?child.material:[child.material];
      for(const material of materials){
        if(material.map&&material.map.isTexture&&!(material.map instanceof THREE.VideoTexture)){
          material.map.dispose();
        }
        material.dispose?.();
      }
    }
    child.geometry?.dispose?.();
  });
}

export function createCasePresentation(scene,camera){
  const group=new THREE.Group();
  group.visible=false;
  group.position.set(0,0,PARAMS.presentation.sceneZ);
  scene.add(group);

  let targetOpen=0;
  let openness=0;
  let activeCase=null;
  let generation=0;
  let headline=null;
  let videoState=null;
  let images=[];

  function clear(){
    generation++;
    if(videoState){
      videoState.video.pause();
      videoState.video.removeAttribute("src");
      videoState.video.load();
      videoState.texture.dispose();
    }
    disposeObject(group);
    while(group.children.length)group.remove(group.children[0]);
    headline=null;
    videoState=null;
    images=[];
  }

  async function build(caseData){
    clear();
    const token=generation;
    activeCase=caseData;

    if(document.fonts?.load){
      try{await document.fonts.load('800 168px "Turret Road"');}catch{}
    }

    const media=normalizedMedia(caseData);
    const palette=caseData.palette||["#fff","#74f7ff"];

    if(media.video){
      videoState=createVideoPlane(media.video,group);
    }

    const titleTexture=textTexture(caseData.title,palette);
    const titleMaterial=new THREE.MeshBasicMaterial({
      map:titleTexture,
      transparent:true,
      opacity:0,
      depthWrite:false,
      depthTest:false,
      blending:THREE.AdditiveBlending,
      toneMapped:false
    });
    headline=new THREE.Mesh(new THREE.PlaneGeometry(1,1),titleMaterial);
    headline.renderOrder=120;
    headline.position.set(0,0,.24);
    headline.scale.set(PARAMS.presentation.headlineWidth,PARAMS.presentation.headlineHeight,1);
    headline.userData.basePosition=headline.position.clone();
    headline.userData.baseScale=headline.scale.clone();
    group.add(headline);

    const wanted=Math.min(
      Math.max(media.images.length,PARAMS.presentation.placeholderImages),
      PARAMS.presentation.maxImages
    );

    const sourceImages=media.images.length
      ? Array.from({length:wanted},(_,i)=>media.images[i%media.images.length])
      : Array.from({length:wanted},()=>null);

    const seedBase=hashString(caseData.id||caseData.title||"case");

    const loaded=await Promise.all(sourceImages.map((entry,i)=>imageTexture(entry,caseData,i)));
    if(token!==generation)return;

    loaded.forEach((loadedTexture,i)=>{
      const angle=(i/wanted)*Math.PI*2+random01(seedBase+i*17)*.55;
      const radial=THREE.MathUtils.lerp(
        PARAMS.presentation.radiusMin,
        PARAMS.presentation.radiusMax,
        random01(seedBase+i*31)
      );
      const x=Math.cos(angle)*radial;
      const y=Math.sin(angle)*radial*PARAMS.presentation.verticalRatio;
      const z=PARAMS.presentation.imageZStart-i*PARAMS.presentation.imageDepthStep;
      const width=THREE.MathUtils.lerp(
        PARAMS.presentation.imageWidthMin,
        PARAMS.presentation.imageWidthMax,
        random01(seedBase+i*43)
      );
      const height=width/Math.max(.65,Math.min(2.1,loadedTexture.aspect));

      const material=new THREE.MeshBasicMaterial({
        map:loadedTexture.texture,
        transparent:true,
        opacity:0,
        depthWrite:false,
        depthTest:false,
        toneMapped:false
      });

      const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);
      mesh.renderOrder=110-i;
      mesh.position.set(0,0,.05);
      mesh.scale.set(.08,.08,1);
      mesh.rotation.z=(random01(seedBase+i*59)-.5)*.16;

      mesh.userData.targetPosition=new THREE.Vector3(x,y,z);
      mesh.userData.targetScale=new THREE.Vector3(width,height,1);
      mesh.userData.baseRotationZ=mesh.rotation.z;
      mesh.userData.depthIndex=i/(Math.max(1,wanted-1));
      mesh.userData.phase=random01(seedBase+i*71)*Math.PI*2;
      group.add(mesh);
      images.push(mesh);
    });
  }

  async function open(caseData){
    if(!caseData)return;
    group.visible=true;
    targetOpen=1;
    await build(caseData);
  }

  function close(){
    targetOpen=0;
  }

  async function toggle(caseData){
    if(targetOpen>.5&&activeCase?.id===caseData?.id){
      close();
      return;
    }
    await open(caseData);
  }

  function isOpen(){
    return targetOpen>.5||openness>.08;
  }

  function update(dt,time,pointer,cameraMotion){
    const target=targetOpen;
    const speed=target>openness
      ? PARAMS.presentation.openResponseMs
      : PARAMS.presentation.closeResponseMs;
    const alpha=1-Math.exp(-Math.max(dt,1)/speed);
    openness=THREE.MathUtils.lerp(openness,target,alpha);

    if(openness<.012&&target===0){
      group.visible=false;
      return;
    }
    group.visible=true;

    const eased=target>0?easeOutCubic(openness):easeInOutCubic(openness);
    const motion=cameraMotion?.motion||0;
    const mx=cameraMotion?.motionX||0;
    const my=cameraMotion?.motionY||0;
    const vx=cameraMotion?.velocityX||0;
    const vy=cameraMotion?.velocityY||0;

    group.position.x=THREE.MathUtils.lerp(
      group.position.x,
      mx*PARAMS.presentation.groupReactionX+pointer.x*PARAMS.presentation.pointerReactionX,
      .025
    );
    group.position.y=THREE.MathUtils.lerp(
      group.position.y,
      my*PARAMS.presentation.groupReactionY+pointer.y*PARAMS.presentation.pointerReactionY,
      .025
    );
    group.position.z=PARAMS.presentation.sceneZ;

    group.rotation.x=THREE.MathUtils.lerp(group.rotation.x,-my*.055-vy*.8,.02);
    group.rotation.y=THREE.MathUtils.lerp(group.rotation.y,mx*.075+vx*.8,.02);

    if(videoState){
      const plane=videoState.plane;
      plane.material.opacity=eased*PARAMS.presentation.videoOpacity;
      const s=.92+eased*.08+motion*.025;
      plane.scale.set(
        plane.userData.baseScale.x*s,
        plane.userData.baseScale.y*s,
        1
      );
      plane.position.x=mx*.11;
      plane.position.y=my*.08;
      plane.position.z=plane.userData.basePosition.z;
    }

    if(headline){
      headline.material.opacity=eased;
      const s=.84+eased*.16+motion*.018;
      headline.scale.set(
        headline.userData.baseScale.x*s,
        headline.userData.baseScale.y*s,
        1
      );
      headline.position.x=-mx*.08;
      headline.position.y=-my*.06;
      headline.position.z=headline.userData.basePosition.z;
    }

    images.forEach((mesh,i)=>{
      const depth=mesh.userData.depthIndex;
      const reveal=clamp01((eased-depth*PARAMS.presentation.stagger)/Math.max(.001,1-depth*PARAMS.presentation.stagger));
      const e=easeOutCubic(reveal);
      const targetPos=mesh.userData.targetPosition;

      const parallax=1+depth*1.65;
      mesh.position.x=THREE.MathUtils.lerp(
        mesh.position.x,
        targetPos.x+mx*PARAMS.presentation.imageReactionX*parallax,
        .045
      );
      mesh.position.y=THREE.MathUtils.lerp(
        mesh.position.y,
        targetPos.y+my*PARAMS.presentation.imageReactionY*parallax,
        .045
      );
      mesh.position.z=THREE.MathUtils.lerp(
        mesh.position.z,
        targetPos.z+motion*PARAMS.presentation.imageReactionZ*(1-depth),
        .04
      );

      const targetScale=mesh.userData.targetScale;
      mesh.scale.x=THREE.MathUtils.lerp(mesh.scale.x,targetScale.x*e,.06);
      mesh.scale.y=THREE.MathUtils.lerp(mesh.scale.y,targetScale.y*e,.06);
      mesh.material.opacity=e*PARAMS.presentation.imageOpacity;

      mesh.rotation.z=mesh.userData.baseRotationZ
        +Math.sin(time*.34+mesh.userData.phase)*.018
        +(vx-vy)*PARAMS.presentation.imageVelocityTilt*(1-depth);
      mesh.rotation.x=THREE.MathUtils.lerp(mesh.rotation.x,-my*.055*parallax,.03);
      mesh.rotation.y=THREE.MathUtils.lerp(mesh.rotation.y,mx*.07*parallax,.03);
    });
  }

  return {open,close,toggle,isOpen,update,get activeCase(){return activeCase;}};
}
