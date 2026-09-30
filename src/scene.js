import * as THREE from "three";
import { PARAMS } from "./params.js";

const Z_AXIS=new THREE.Vector3(0,0,1);
const WHITE=new THREE.Color(0xffffff);

function rand(seedA,seedB=1){
  return Math.abs(Math.sin(seedA*12.9898+seedB*78.233)*43758.5453)%1;
}

function triangleGeometry(){
  const h=Math.sqrt(3)/2;
  const geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.Float32BufferAttribute([
    0,h*2/3,0,
    -.5,-h/3,0,
    .5,-h/3,0
  ],3));
  geo.setAttribute("uv",new THREE.Float32BufferAttribute([.5,1,0,0,1,0],2));
  geo.setAttribute("bary",new THREE.Float32BufferAttribute([1,0,0,0,1,0,0,0,1],3));
  geo.computeVertexNormals();
  return geo;
}

function triangleLineGeometry(scale=1){
  const h=Math.sqrt(3)/2;
  const p0=new THREE.Vector3(0,h*2/3,0).multiplyScalar(scale);
  const p1=new THREE.Vector3(-.5,-h/3,0).multiplyScalar(scale);
  const p2=new THREE.Vector3(.5,-h/3,0).multiplyScalar(scale);
  return new THREE.BufferGeometry().setFromPoints([p0,p1,p1,p2,p2,p0]);
}

function anchorPosition(anchor,group="core"){
  const [x,y,z]=anchor.p;
  const t=PARAMS.template;

  if(group==="floor"){
    return new THREE.Vector3(
      x*t.floorScale,
      z*t.floorScale*.68+t.verticalOffset,
      0
    );
  }

  const scale=
    group==="shards"?t.shardScale:
    group==="struts"?t.strutScale:
    t.coreScale;

  return new THREE.Vector3(
    x*scale,
    y*scale+t.verticalOffset,
    z*scale
  );
}

function anchorNormal(anchor){
  return new THREE.Vector3(...anchor.n).normalize();
}

function orientFromAnchor(object,anchor,twist=0){
  const n=anchorNormal(anchor);
  object.quaternion.setFromUnitVectors(Z_AXIS,n);
  object.rotateZ(twist);
}

function anchorScore(item){
  const p=anchorPosition(item.anchor,item.group);
  const radial=Math.hypot(p.x,p.y);
  const center=1/(1+radial*PARAMS.triangles.largeCenterBias);
  return item.anchor.a*.8+center*2.4;
}

async function loadTemplate(){
  const url=new URL(PARAMS.template.url,import.meta.url);
  const res=await fetch(url);
  if(!res.ok)throw new Error(`Could not load visual template: ${res.status}`);
  return res.json();
}

function headlineTexture(text,a,b){
  const c=document.createElement("canvas");
  c.width=1024;c.height=256;
  const x=c.getContext("2d");

  const g=x.createLinearGradient(0,0,c.width,0);
  g.addColorStop(0,a);
  g.addColorStop(.55,"#ffffff");
  g.addColorStop(1,b);

  x.font='700 112px "Turret Road",Arial,sans-serif';
  x.textBaseline="middle";
  x.fillStyle=g;
  x.shadowColor=a;
  x.shadowBlur=22;
  x.fillText(text.toUpperCase(),24,128);

  x.shadowBlur=0;
  x.font='600 28px "Turret Road",Arial,sans-serif';
  x.fillStyle="rgba(255,255,255,.5)";
  x.fillText(text.toUpperCase().replace(/\s+/g," / "),30,42);

  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace=THREE.SRGBColorSpace;
  return tex;
}

function edgeHeadlineTexture(text,color){
  const c=document.createElement("canvas");
  c.width=1536;c.height=128;
  const x=c.getContext("2d");
  x.font='700 62px "Turret Road",Arial,sans-serif';
  x.textBaseline="middle";
  x.fillStyle=color;
  x.shadowColor=color;
  x.shadowBlur=12;
  x.fillText((" "+text.toUpperCase()+"   ").repeat(3),12,64);

  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.wrapS=THREE.RepeatWrapping;
  return tex;
}

function createReflectiveMaterial(videoTexture){
  return new THREE.ShaderMaterial({
    side:THREE.DoubleSide,
    transparent:true,
    depthWrite:false,
    uniforms:{
      uTime:{value:0},
      uVideo:{value:videoTexture},
      uA:{value:new THREE.Color("#74f7ff")},
      uB:{value:new THREE.Color("#ff4ecf")},
      uC:{value:new THREE.Color("#7b69ff")},
      uMotion:{value:0},
      uGlitch:{value:.1},
      uReflectionBrightness:{value:PARAMS.look.reflectionBrightness},
      uReflectionSaturation:{value:PARAMS.look.reflectionSaturation}
    },
    vertexShader:`
      attribute vec3 bary;
      varying vec2 vUv;
      varying vec3 vBary;
      varying vec3 vWorld;
      varying vec3 vNormalW;
      void main(){
        vUv=uv;
        vBary=bary;
        vec4 world=modelMatrix*vec4(position,1.);
        vWorld=world.xyz;
        vNormalW=normalize(mat3(modelMatrix)*normal);
        gl_Position=projectionMatrix*viewMatrix*world;
      }`,
    fragmentShader:`
      uniform float uTime,uMotion,uGlitch,uReflectionBrightness,uReflectionSaturation;
      uniform sampler2D uVideo;
      uniform vec3 uA,uB,uC;
      varying vec2 vUv;
      varying vec3 vBary;
      varying vec3 vWorld;
      varying vec3 vNormalW;

      float edgeFactor(){
        vec3 d=fwidth(vBary);
        vec3 a3=smoothstep(vec3(0.),d*1.45,vBary);
        return 1.-min(min(a3.x,a3.y),a3.z);
      }
      float hash(vec2 p){
        p=fract(p*vec2(123.34,456.21));
        p+=dot(p,p+45.32);
        return fract(p.x*p.y);
      }

      void main(){
        vec2 uv=vUv;
        float band=floor(uv.y*38.);
        float glitch=step(.9,hash(vec2(band,floor(uTime*5.))))*uGlitch*.55;
        uv.x+=(hash(vec2(band,9.+floor(uTime*7.)))-.5)*.055*glitch;
        uv=clamp(uv,0.,1.);

        vec2 pixel=floor(uv*vec2(68.,44.))/vec2(68.,44.);
        vec3 cam=texture2D(uVideo,pixel).rgb;
        float l=dot(cam,vec3(.299,.587,.114));
        cam=mix(vec3(l),cam,uReflectionSaturation);

        vec3 N=normalize(vNormalW);
        vec3 V=normalize(cameraPosition-vWorld);
        float fres=pow(1.-max(dot(N,V),0.),2.05);

        vec3 iri=.5+.5*cos(6.28318*(fres+vec3(0.,.33,.67))+vec3(0.,1.35,2.15));
        iri=mix(uA,uB,iri.r);
        iri=mix(iri,uC,.34+fres*.46);

        float e=edgeFactor();
        vec3 chrome=pow(max(cam,vec3(.001)),vec3(.78))*uReflectionBrightness;
        chrome+=vec3(.07)+fres*.09;

        vec3 col=chrome*(.5+fres*.34);
        col+=iri*(e*2.15+fres*.46);
        col+=vec3(1.)*e*.24;
        col+=iri*uMotion*.15;

        gl_FragColor=vec4(col,.97);
      }`
  });
}

function createMoireMaterial(){
  return new THREE.ShaderMaterial({
    side:THREE.DoubleSide,
    transparent:true,
    depthWrite:false,
    uniforms:{
      uTime:{value:0},
      uA:{value:new THREE.Color("#74f7ff")},
      uB:{value:new THREE.Color("#ff4ecf")},
      uC:{value:new THREE.Color("#7b69ff")},
      uMoire:{value:1},
      uZebra:{value:.7},
      uGlitch:{value:.1}
    },
    vertexShader:`
      attribute vec3 bary;
      varying vec2 vUv;
      varying vec3 vBary;
      varying vec3 vWorld;
      varying vec3 vNormalW;
      void main(){
        vUv=uv;vBary=bary;
        vec4 world=modelMatrix*instanceMatrix*vec4(position,1.);
        vWorld=world.xyz;
        vNormalW=normalize(mat3(modelMatrix*instanceMatrix)*normal);
        gl_Position=projectionMatrix*viewMatrix*world;
      }`,
    fragmentShader:`
      uniform float uTime,uMoire,uZebra,uGlitch;
      uniform vec3 uA,uB,uC;
      varying vec2 vUv;
      varying vec3 vBary;
      varying vec3 vWorld;
      varying vec3 vNormalW;

      float edgeFactor(){
        vec3 d=fwidth(vBary);
        vec3 a3=smoothstep(vec3(0.),d*1.35,vBary);
        return 1.-min(min(a3.x,a3.y),a3.z);
      }

      void main(){
        vec2 p=(vUv-.5)*2.;
        float a=sin((p.x+p.y*.21)*(48.+uMoire*18.));
        float b=sin((p.y-p.x*.18)*(54.+uMoire*16.)+uTime*.08);
        float c=sin(length(p)*74.-uTime*.055);
        float moire=step(0.,a*b+c*.14);
        float zebra=step(0.,sin((p.x*.62+p.y)*(40.+uZebra*22.)));
        float bw=mix(moire,zebra,.46);

        vec3 N=normalize(vNormalW),V=normalize(cameraPosition-vWorld);
        float fres=pow(1.-max(dot(N,V),0.),2.45);
        vec3 iri=.5+.5*cos(6.28318*(fres+vec3(0.,.33,.67))+vec3(0.,1.5,2.35));
        iri=mix(uA,uB,iri.r);
        iri=mix(iri,uC,.3+fres*.5);

        float edge=edgeFactor();
        vec3 baseBW=mix(vec3(.015),vec3(.96),bw);
        vec3 col=baseBW*.44;
        col+=iri*(edge*1.72+fres*.19);

        float pulse=step(.982,sin(vWorld.y*17.+uTime*10.))*uGlitch;
        col+=iri*pulse*.22;

        gl_FragColor=vec4(col,.86);
      }`
  });
}

export async function createVisualScene(stage,cases,videoTexture){
  const template=await loadTemplate();
  const G=template.groups;

  const scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x030306,.032);

  const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,120);
  camera.position.set(0,0,8.4);

  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.30;
  stage.appendChild(renderer.domElement);

  const root=new THREE.Group();
  scene.add(root);

  const triGeo=triangleGeometry();
  const reflectiveMat=createReflectiveMaterial(videoTexture);
  const moireMat=createMoireMaterial();

  // Large reflective triangles follow the high-area and center-biased faces
  // of the uploaded visual_aura.obj template.
  const largeCandidates=[
    ...G.shards.map(anchor=>({anchor,group:"shards"})),
    ...G.core.map(anchor=>({anchor,group:"core"}))
  ].sort((a,b)=>anchorScore(b)-anchorScore(a));

  const largeGroup=new THREE.Group();
  root.add(largeGroup);

  const largeTriangles=[];
  const largeWireRings=[];

  for(let i=0;i<PARAMS.triangles.largeCount;i++){
    const source=largeCandidates[i%largeCandidates.length];
    const anchor=source.anchor;
    const mesh=new THREE.Mesh(triGeo,reflectiveMat);
    const p=anchorPosition(anchor,source.group);

    // Keep the original OBJ structure, but quantize z into controllable depth bands.
    const band=PARAMS.depth.largeBands[i%PARAMS.depth.largeBands.length];
    p.z=THREE.MathUtils.lerp(p.z,band,.42);

    const areaNorm=THREE.MathUtils.clamp(anchor.a/1.45,0,1);
    const radial=Math.hypot(p.x,p.y);
    const center=1/(1+radial*.42);
    const s=THREE.MathUtils.lerp(
      PARAMS.triangles.largeScaleMin,
      PARAMS.triangles.largeScaleMax,
      THREE.MathUtils.clamp(areaNorm*.45+center*.75,0,1)
    );

    mesh.position.copy(p);
    orientFromAnchor(mesh,anchor,(rand(i,9.4)-.5)*.9);
    mesh.scale.setScalar(s);

    mesh.userData.basePos=mesh.position.clone();
    mesh.userData.baseQuat=mesh.quaternion.clone();
    mesh.userData.baseScale=s;
    mesh.userData.depthBand=i%PARAMS.depth.largeBands.length;

    largeTriangles.push(mesh);
    largeGroup.add(mesh);

    const rings=[];
    for(let n=1;n<=PARAMS.triangles.nestedRings;n++){
      const line=new THREE.LineSegments(
        triangleLineGeometry(s*(1-n*.16)),
        new THREE.LineBasicMaterial({
          color:n%2?0xffffff:0x74f7ff,
          transparent:true,
          opacity:PARAMS.look.wireOpacity+n*.025,
          blending:THREE.AdditiveBlending,
          depthWrite:false
        })
      );
      line.position.copy(mesh.position);
      line.quaternion.copy(mesh.quaternion);
      line.userData.parent=mesh;
      line.userData.level=n;
      largeGroup.add(line);
      rings.push(line);
    }
    largeWireRings.push(rings);
  }

  // Small triangles are sampled from the actual core/shard/strut topology.
  const smallPool=[
    ...G.core.map(anchor=>({anchor,group:"core"})),
    ...G.shards.map(anchor=>({anchor,group:"shards"})),
    ...G.struts.map(anchor=>({anchor,group:"struts"}))
  ];

  const smallMesh=new THREE.InstancedMesh(triGeo,moireMat,PARAMS.triangles.smallCount);
  smallMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  root.add(smallMesh);

  const smallSeeds=[];
  const temp=new THREE.Object3D();

  for(let i=0;i<PARAMS.triangles.smallCount;i++){
    const source=smallPool[i%smallPool.length];
    const p=anchorPosition(source.anchor,source.group);
    const jitter=.05+.16*rand(i,3.2);

    p.x+=(rand(i,7.4)-.5)*jitter;
    p.y+=(rand(i,5.1)-.5)*jitter;
    p.z+=(rand(i,8.7)-.5)*jitter;

    temp.position.copy(p);
    orientFromAnchor(temp,source.anchor,(rand(i,6.8)-.5)*Math.PI);

    const area=THREE.MathUtils.clamp(source.anchor.a/2.6,0,1);
    const s=THREE.MathUtils.lerp(
      PARAMS.triangles.smallScaleMin,
      PARAMS.triangles.smallScaleMax,
      .2+area*.5+rand(i,9.2)*.3
    );

    temp.scale.setScalar(s);
    temp.updateMatrix();
    smallMesh.setMatrixAt(i,temp.matrix);

    smallSeeds.push({
      position:temp.position.clone(),
      quaternion:temp.quaternion.clone(),
      scale:s,
      speed:.12+rand(i,3.7)*.35
    });
  }

  // 3D tetrahedra use shard + strut anchors from the OBJ.
  const tetraPool=[
    ...G.shards.map(anchor=>({anchor,group:"shards"})),
    ...G.struts.map(anchor=>({anchor,group:"struts"}))
  ];
  const tetraGroup=new THREE.Group();
  root.add(tetraGroup);
  const tetraGeo=new THREE.TetrahedronGeometry(.42,0);
  const tetraMeshes=[];

  for(let i=0;i<PARAMS.triangles.tetraCount;i++){
    const source=tetraPool[i%tetraPool.length];
    const p=anchorPosition(source.anchor,source.group);
    const tetra=new THREE.Mesh(
      tetraGeo,
      new THREE.MeshPhysicalMaterial({
        color:0x0d0f16,
        metalness:.88,
        roughness:.14,
        transparent:true,
        opacity:.96
      })
    );

    tetra.position.copy(p);
    orientFromAnchor(tetra,source.anchor,(rand(i,4.5)-.5)*Math.PI);

    const s=THREE.MathUtils.lerp(
      PARAMS.triangles.tetraScaleMin,
      PARAMS.triangles.tetraScaleMax,
      .15+THREE.MathUtils.clamp(source.anchor.a/2.6,0,1)*.5+rand(i,1.5)*.3
    );
    tetra.scale.setScalar(s);

    const edges=new THREE.LineSegments(
      new THREE.EdgesGeometry(tetraGeo),
      new THREE.LineBasicMaterial({
        color:0xffffff,
        transparent:true,
        opacity:.22,
        blending:THREE.AdditiveBlending,
        depthWrite:false
      })
    );
    tetra.add(edges);

    tetra.userData.basePos=tetra.position.clone();
    tetra.userData.baseQuat=tetra.quaternion.clone();
    tetra.userData.baseScale=s;

    tetraMeshes.push(tetra);
    tetraGroup.add(tetra);
  }

  // Halo layers are literally derived from the large floor-facet field in the OBJ.
  const haloGroups=[];
  for(let d=0;d<PARAMS.triangles.haloLayers;d++){
    const hg=new THREE.Group();
    hg.position.z=PARAMS.depth.haloStart-d*PARAMS.depth.haloStep;
    hg.scale.setScalar(PARAMS.depth.haloBaseScale+d*PARAMS.depth.haloScaleStep);

    const count=PARAMS.triangles.haloPerLayer;
    const haloMesh=new THREE.InstancedMesh(triGeo,moireMat,count);
    const o=new THREE.Object3D();

    for(let i=0;i<count;i++){
      const anchor=G.floor[i%G.floor.length];
      const p=anchorPosition(anchor,"floor");
      o.position.copy(p);
      o.position.x+=(rand(i+d*31,2.7)-.5)*.18;
      o.position.y+=(rand(i+d*31,5.8)-.5)*.18;
      o.position.z=0;
      orientFromAnchor(o,anchor,(rand(i+d*40,8.8)-.5)*Math.PI);
      o.scale.setScalar(.055+rand(i+d*17,3.1)*.18);
      o.updateMatrix();
      haloMesh.setMatrixAt(i,o.matrix);
    }

    hg.add(haloMesh);
    root.add(hg);
    haloGroups.push(hg);
  }

  // Fine line structure is derived from FX_struts centroids.
  const networkPositions=[];
  const strutPoints=G.struts.map(a=>anchorPosition(a,"struts"));
  for(let i=0;i<strutPoints.length-1;i++){
    const a=strutPoints[i];
    const b=strutPoints[(i+3)%strutPoints.length];
    if(a.distanceTo(b)<4.6)networkPositions.push(a.x,a.y,a.z,b.x,b.y,b.z);
  }

  const networkGeo=new THREE.BufferGeometry();
  networkGeo.setAttribute("position",new THREE.Float32BufferAttribute(networkPositions,3));

  const networkMat=new THREE.LineBasicMaterial({
    color:0xcbe8ff,
    transparent:true,
    opacity:PARAMS.look.networkOpacity,
    blending:THREE.AdditiveBlending,
    depthWrite:false
  });
  root.add(new THREE.LineSegments(networkGeo,networkMat));

  // Parametric sawtooth ribbons are retained as a graphic counterpoint.
  const sawGeo=new THREE.BufferGeometry();
  const sawPositions=[];
  for(let row=0;row<7;row++){
    const z=-5.4+row*1.5;
    const y=-2.3+row*.7;
    for(let i=0;i<36;i++){
      const x=-5.5+i*.31;
      const s=.145+(row%3)*.02;
      const h=Math.sqrt(3)/2*s;
      const flip=i%2===0?1:-1;
      const p0=[x,y+h*flip,z];
      const p1=[x-s*.5,y-h*.35*flip,z];
      const p2=[x+s*.5,y-h*.35*flip,z];
      sawPositions.push(...p0,...p1,...p1,...p2,...p2,...p0);
    }
  }
  sawGeo.setAttribute("position",new THREE.Float32BufferAttribute(sawPositions,3));
  const sawMat=new THREE.LineBasicMaterial({
    color:0xffffff,
    transparent:true,
    opacity:.1,
    blending:THREE.AdditiveBlending,
    depthWrite:false
  });
  const saw=new THREE.LineSegments(sawGeo,sawMat);
  saw.rotation.z=-.18;
  root.add(saw);

  // Headlines remain anchored to the large triangles, so the type belongs to the sculpture.
  const headlineRoot=new THREE.Group();
  root.add(headlineRoot);
  const headlines=cases.map((c,ci)=>{
    const group=new THREE.Group();
    const anchor=largeTriangles[(ci*5)%largeTriangles.length];

    const hero=new THREE.Mesh(
      new THREE.PlaneGeometry(2.8,.66),
      new THREE.MeshBasicMaterial({
        map:headlineTexture(c.title,c.palette[0],c.palette[1]||c.palette[0]),
        transparent:true,
        opacity:0,
        side:THREE.DoubleSide,
        depthWrite:false,
        blending:THREE.AdditiveBlending
      })
    );
    hero.position.copy(anchor.position).add(new THREE.Vector3(0,.58,.34));
    hero.quaternion.copy(anchor.quaternion);
    hero.userData.base=hero.position.clone();
    group.add(hero);

    const edgePlane=new THREE.Mesh(
      new THREE.PlaneGeometry(anchor.userData.baseScale*1.3,.18),
      new THREE.MeshBasicMaterial({
        map:edgeHeadlineTexture(c.title,c.palette[0]),
        transparent:true,
        opacity:0,
        side:THREE.DoubleSide,
        depthWrite:false,
        blending:THREE.AdditiveBlending
      })
    );
    edgePlane.position.copy(anchor.position);
    edgePlane.quaternion.copy(anchor.quaternion);
    edgePlane.position.y+=.08;
    edgePlane.position.z+=.03;
    edgePlane.userData.base=edgePlane.position.clone();
    group.add(edgePlane);

    headlineRoot.add(group);
    return group;
  });

  scene.add(new THREE.AmbientLight(0xffffff,.18));
  const key=new THREE.PointLight(0x74f7ff,15,30);
  const fill=new THREE.PointLight(0xff4ecf,11,28);
  const back=new THREE.PointLight(0x7b69ff,8,34);
  key.position.set(5,3.5,7);
  fill.position.set(-5,-3,5);
  back.position.set(0,1,-10);
  scene.add(key,fill,back);

  function resize(){
    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  }

  return {
    scene,camera,renderer,root,
    reflectiveMat,moireMat,
    largeTriangles,largeWireRings,
    smallMesh,smallSeeds,
    tetraMeshes,
    saw,sawMat,haloGroups,
    networkMat,headlines,
    key,fill,back,resize
  };
}

export function updateVisualScene(v,time,state,pointer,cameraMotion,activeCase){
  const motion=cameraMotion.motion||0;
  const humanX=cameraMotion.motionX||0;
  const humanY=cameraMotion.motionY||0;
  const humanVX=cameraMotion.velocityX||0;
  const humanVY=cameraMotion.velocityY||0;
  const humanCX=cameraMotion.centroidX||0;
  const humanCY=cameraMotion.centroidY||0;

  const {
    root,reflectiveMat,moireMat,
    largeTriangles,largeWireRings,
    smallMesh,smallSeeds,
    tetraMeshes,
    saw,sawMat,haloGroups,
    networkMat,headlines,
    key,fill,back
  }=v;

  const R=PARAMS.reaction;
  const M=PARAMS.motion;

  root.rotation.x=THREE.MathUtils.lerp(
    root.rotation.x,
    pointer.y*.08+state.tiltBias*.09-humanY*R.rootTilt,
    .018
  );
  root.rotation.y=THREE.MathUtils.lerp(
    root.rotation.y,
    pointer.x*.1+state.rotationBias*.025+humanX*R.rootTurn,
    .018
  );
  root.rotation.z=THREE.MathUtils.lerp(root.rotation.z,humanVX*.24,.012);

  reflectiveMat.uniforms.uTime.value=time;
  reflectiveMat.uniforms.uMotion.value=motion;
  reflectiveMat.uniforms.uGlitch.value=state.glitch+motion*.12;
  reflectiveMat.uniforms.uA.value.copy(state.palette[0]);
  reflectiveMat.uniforms.uB.value.copy(state.palette[1]||state.palette[0]);
  reflectiveMat.uniforms.uC.value.copy(state.palette[2]||state.palette[1]||state.palette[0]);

  moireMat.uniforms.uTime.value=time;
  moireMat.uniforms.uMoire.value=state.moire;
  moireMat.uniforms.uZebra.value=state.zebra;
  moireMat.uniforms.uGlitch.value=state.glitch;
  moireMat.uniforms.uA.value.copy(state.palette[0]);
  moireMat.uniforms.uB.value.copy(state.palette[1]||state.palette[0]);
  moireMat.uniforms.uC.value.copy(state.palette[2]||state.palette[1]||state.palette[0]);

  largeTriangles.forEach((tri,i)=>{
    const base=tri.userData.basePos;
    const q=tri.userData.baseQuat;
    const radial=Math.hypot(base.x-humanCX*2.5,base.y-humanCY*2.0);
    const near=Math.max(0,1-radial/4.8);

    tri.position.x=THREE.MathUtils.lerp(
      tri.position.x,
      base.x+Math.sin(time*M.ambientSpeed+i)*M.largeDrift+humanX*R.largePushXY*near,
      .025
    );
    tri.position.y=THREE.MathUtils.lerp(
      tri.position.y,
      base.y+Math.cos(time*M.ambientSpeed*.9+i*.7)*M.largeDrift+humanY*R.largePushXY*near,
      .025
    );
    tri.position.z=THREE.MathUtils.lerp(
      tri.position.z,
      base.z+Math.sin(time*M.ambientSpeed*.7+i*.4)*M.largeDrift*2+motion*R.largePushZ*near,
      .022
    );

    const targetQ=q.clone();
    const reactionEuler=new THREE.Euler(
      -humanVY*R.largeRotate*near,
      humanVX*R.largeRotate*near,
      0,
      "XYZ"
    );
    targetQ.multiply(new THREE.Quaternion().setFromEuler(reactionEuler));
    tri.quaternion.slerp(targetQ,.018);

    const targetScale=tri.userData.baseScale*(1+motion*R.largeScale*near);
    const s=THREE.MathUtils.lerp(tri.scale.x,targetScale,.02);
    tri.scale.setScalar(s);
  });

  largeWireRings.forEach(rings=>{
    rings.forEach(line=>{
      const parent=line.userData.parent;
      line.position.lerp(parent.position,.09);
      line.quaternion.slerp(parent.quaternion,.09);
      line.scale.setScalar(parent.scale.x/parent.userData.baseScale);
    });
  });

  const temp=new THREE.Object3D();
  smallSeeds.forEach((s,i)=>{
    const radial=Math.hypot(s.position.x-humanCX*3.0,s.position.y-humanCY*2.5);
    const near=Math.max(0,1-radial/5.4);

    temp.position.copy(s.position);
    temp.position.x+=humanX*R.smallPushXY*near;
    temp.position.y+=humanY*R.smallPushXY*near;
    temp.position.z+=Math.sin(time*s.speed+i)*M.smallDrift+motion*R.smallPushZ*near;

    temp.quaternion.copy(s.quaternion);
    temp.rotateX(-humanVY*R.smallRotate*near);
    temp.rotateY(humanVX*R.smallRotate*near);

    temp.scale.setScalar(s.scale*(1+motion*.05*near));
    temp.updateMatrix();
    smallMesh.setMatrixAt(i,temp.matrix);
  });
  smallMesh.instanceMatrix.needsUpdate=true;

  tetraMeshes.forEach((tetra,i)=>{
    const base=tetra.userData.basePos;
    const near=Math.max(0,1-Math.hypot(base.x-humanCX*3.2,base.y-humanCY*2.7)/6.2);

    tetra.position.x=THREE.MathUtils.lerp(tetra.position.x,base.x+humanX*R.tetraPushXY*near,.022);
    tetra.position.y=THREE.MathUtils.lerp(tetra.position.y,base.y+humanY*R.tetraPushXY*near,.022);
    tetra.position.z=THREE.MathUtils.lerp(
      tetra.position.z,
      base.z+Math.sin(time*.12+i)*M.tetraDrift+motion*R.tetraPushZ*near,
      .02
    );

    const tq=tetra.userData.baseQuat.clone();
    tq.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(
      -humanVY*R.tetraRotate*near,
      humanVX*R.tetraRotate*near,
      0
    )));
    tetra.quaternion.slerp(tq,.016);
  });

  saw.rotation.y=THREE.MathUtils.lerp(saw.rotation.y,humanX*.035,.018);
  saw.position.x=THREE.MathUtils.lerp(saw.position.x,humanX*.12,.018);
  sawMat.opacity=.07+state.moire*.07+motion*.025;
  sawMat.color.copy(state.palette[0]).lerp(WHITE,.8);

  haloGroups.forEach((g,i)=>{
    g.rotation.z+=(i%2?1:-1)*M.haloSpeed;
    g.position.x=THREE.MathUtils.lerp(g.position.x,humanX*R.haloDrift*(i+1),.012);
    g.position.y=THREE.MathUtils.lerp(g.position.y,humanY*R.haloDrift*.75*(i+1),.012);
    const targetScale=(PARAMS.depth.haloBaseScale+i*PARAMS.depth.haloScaleStep)*(1+motion*R.haloScale*(i+1));
    const scale=THREE.MathUtils.lerp(g.scale.x,targetScale,.012);
    g.scale.setScalar(scale);
  });

  networkMat.opacity=PARAMS.look.networkOpacity+state.density*.025+motion*.045;
  networkMat.color.copy(state.palette[0]).lerp(WHITE,.74);

  headlines.forEach((g,gi)=>{
    const active=gi===activeCase;
    g.children.forEach((p,i)=>{
      p.material.opacity=THREE.MathUtils.lerp(
        p.material.opacity,
        active?(i===0?.92:.65):.02,
        .04
      );
      p.position.copy(p.userData.base);
      p.position.y+=Math.sin(time*.45+i+gi)*.012;
      if(i===1&&p.material.map)p.material.map.offset.x=(time*.018)%1;
    });
  });

  key.position.x=THREE.MathUtils.lerp(key.position.x,5+humanX*R.lightFollow,.02);
  key.position.y=THREE.MathUtils.lerp(key.position.y,3.5+humanY*R.lightFollow*.7,.02);
  fill.position.x=THREE.MathUtils.lerp(fill.position.x,-5-humanX*R.lightFollow*.7,.02);
  fill.position.y=THREE.MathUtils.lerp(fill.position.y,-3-humanY*R.lightFollow*.55,.02);

  key.color.copy(state.palette[0]);
  fill.color.copy(state.palette[1]||state.palette[0]);
  back.color.copy(state.palette[2]||state.palette[1]||state.palette[0]);

  key.intensity=9+state.intensity*12+motion*6;
  fill.intensity=6+state.glitch*9+motion*3;
  back.intensity=5+state.moire*5+motion*2;
}