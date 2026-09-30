import * as THREE from "three";
import { EffectComposer } from "https://unpkg.com/three@0.164.1/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://unpkg.com/three@0.164.1/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://unpkg.com/three@0.164.1/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "https://unpkg.com/three@0.164.1/examples/jsm/postprocessing/OutputPass.js";
import { VISUAL_PARAMS as P } from "./visual-config.js";

const Z_AXIS=new THREE.Vector3(0,0,1);
const Y_AXIS=new THREE.Vector3(0,1,0);
const SCENE_SEED=P.generation.randomizeEachLoad?Math.random()*100000:P.generation.seed;

function rand(a,b=1){
  return Math.abs(
    Math.sin((a+SCENE_SEED)*12.9898+(b+SCENE_SEED*.017)*78.233)*43758.5453
  )%1;
}

function fibonacciDirection(i,count){
  const golden=Math.PI*(3-Math.sqrt(5));
  const y=1-(i/Math.max(1,count-1))*2;
  const radius=Math.sqrt(Math.max(0,1-y*y));
  const theta=golden*i+SCENE_SEED*.00013;
  return new THREE.Vector3(
    Math.cos(theta)*radius,
    y,
    Math.sin(theta)*radius
  ).normalize();
}

function ellipsoidPoint(dir,radius,ellipsoid){
  return new THREE.Vector3(
    dir.x*radius*ellipsoid[0],
    dir.y*radius*ellipsoid[1],
    dir.z*radius*ellipsoid[2]
  );
}

function triangleGeometry(){
  const h=Math.sqrt(3)/2;
  const geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.Float32BufferAttribute([
    0,h*2/3,0,
    -.5,-h/3,0,
    .5,-h/3,0
  ],3));
  geo.setAttribute("uv",new THREE.Float32BufferAttribute([
    .5,1,
    0,0,
    1,0
  ],2));
  geo.setAttribute("bary",new THREE.Float32BufferAttribute([
    1,0,0,
    0,1,0,
    0,0,1
  ],3));
  geo.computeVertexNormals();
  return geo;
}

function orientToNormal(object,normal,twist=0){
  object.quaternion.setFromUnitVectors(Z_AXIS,normal.clone().normalize());
  object.rotateZ(twist);
}

function createScaffoldGeometry(){
  const count=P.layers.scaffold.pointCount;
  const outer=[];
  const inner=[];

  for(let i=0;i<count;i++){
    const d=fibonacciDirection(i,count);
    outer.push(ellipsoidPoint(d,P.layers.scaffold.radius,P.layers.scaffold.ellipsoid));
    inner.push(ellipsoidPoint(
      d,
      P.layers.scaffold.radius*P.layers.scaffold.innerRadius,
      P.layers.scaffold.ellipsoid
    ));
  }

  const positions=[];
  const seen=new Set();

  const addEdge=(a,b,layer)=>{
    if(a===b)return;
    const min=Math.min(a,b);
    const max=Math.max(a,b);
    const key=layer+":"+min+":"+max;
    if(seen.has(key))return;
    seen.add(key);

    const source=layer==="outer"?outer:inner;
    const p0=source[a];
    const p1=source[b];
    positions.push(p0.x,p0.y,p0.z,p1.x,p1.y,p1.z);
  };

  for(let i=0;i<count;i++){
    const ranked=[];
    for(let j=0;j<count;j++){
      if(i===j)continue;
      ranked.push({j,d:outer[i].distanceToSquared(outer[j])});
    }
    ranked.sort((a,b)=>a.d-b.d);

    for(let n=0;n<P.layers.scaffold.neighbors;n++){
      addEdge(i,ranked[n].j,"outer");
      addEdge(i,ranked[n].j,"inner");
    }

    if(i%P.layers.scaffold.spokeEvery===0){
      const a=outer[i];
      const b=inner[i];
      positions.push(a.x,a.y,a.z,b.x,b.y,b.z);
    }
  }

  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  return geometry;
}

function createScaffoldMaterial(){
  return new THREE.ShaderMaterial({
    transparent:true,
    depthWrite:false,
    blending:THREE.AdditiveBlending,
    uniforms:{
      uTime:{value:0},
      uA:{value:new THREE.Color("#74f7ff")},
      uB:{value:new THREE.Color("#ff4ecf")},
      uC:{value:new THREE.Color("#7b69ff")},
      uOpacity:{value:P.layers.scaffold.opacity},
      uGlow:{value:P.material.scaffold.glow},
      uWhiteCore:{value:P.material.scaffold.whiteCore},
      uMotion:{value:0}
    },
    vertexShader:`
      varying float vPhase;
      void main(){
        vec4 world=modelMatrix*vec4(position,1.);
        vPhase=position.x*.19+position.y*.27+position.z*.23;
        gl_Position=projectionMatrix*viewMatrix*world;
      }`,
    fragmentShader:`
      uniform float uTime,uOpacity,uGlow,uWhiteCore,uMotion;
      uniform vec3 uA,uB,uC;
      varying float vPhase;

      void main(){
        float wave=.5+.5*sin(vPhase*5.4+uTime*.28);
        float wave2=.5+.5*cos(vPhase*7.2-uTime*.21);
        vec3 spectral=mix(uA,uB,wave);
        spectral=mix(spectral,uC,wave2*.55);
        spectral=mix(spectral,vec3(1.),uWhiteCore);
        spectral*=uGlow+uMotion*.36;
        gl_FragColor=vec4(spectral,uOpacity);
      }`
  });
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
      uGlitch:{value:.08},
      uSaturation:{value:P.material.reflection.saturation},
      uBrightness:{value:P.material.reflection.brightness},
      uBaseLift:{value:P.material.reflection.baseLift},
      uEdgeGlow:{value:P.material.reflection.edgeGlow},
      uFresnelGlow:{value:P.material.reflection.fresnelGlow},
      uOpacity:{value:P.material.reflection.opacity},
      uPixelGrid:{value:new THREE.Vector2(...P.material.reflection.pixelGrid)}
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
      uniform float uTime,uMotion,uGlitch,uSaturation,uBrightness,uBaseLift;
      uniform float uEdgeGlow,uFresnelGlow,uOpacity;
      uniform vec2 uPixelGrid;
      uniform sampler2D uVideo;
      uniform vec3 uA,uB,uC;

      varying vec2 vUv;
      varying vec3 vBary;
      varying vec3 vWorld;
      varying vec3 vNormalW;

      float edgeFactor(){
        vec3 d=fwidth(vBary);
        vec3 a3=smoothstep(vec3(0.),d*1.4,vBary);
        return 1.-min(min(a3.x,a3.y),a3.z);
      }

      float hash(vec2 p){
        p=fract(p*vec2(123.34,456.21));
        p+=dot(p,p+45.32);
        return fract(p.x*p.y);
      }

      void main(){
        vec2 uv=vUv;
        float band=floor(uv.y*34.);
        float glitch=step(.92,hash(vec2(band,floor(uTime*5.))))*uGlitch;
        uv.x+=(hash(vec2(band,9.+floor(uTime*7.)))-.5)*.045*glitch;
        uv=clamp(uv,0.,1.);

        vec2 px=floor(uv*uPixelGrid)/uPixelGrid;
        vec3 cam=texture2D(uVideo,px).rgb;
        float lum=dot(cam,vec3(.299,.587,.114));
        cam=mix(vec3(lum),cam,uSaturation);

        vec3 N=normalize(vNormalW);
        vec3 V=normalize(cameraPosition-vWorld);
        float fres=pow(1.-max(dot(N,V),0.),2.05);

        vec3 iri=.5+.5*cos(
          6.28318*(fres+vec3(0.,.33,.67))+vec3(0.,1.35,2.15)
        );
        iri=mix(uA,uB,iri.r);
        iri=mix(iri,uC,.34+fres*.46);

        float edge=edgeFactor();
        vec3 chrome=pow(max(cam,vec3(.001)),vec3(.78))*uBrightness;
        chrome+=vec3(uBaseLift)+fres*.1;

        vec3 col=chrome*(.54+fres*.35);
        col+=iri*(edge*uEdgeGlow+fres*uFresnelGlow);
        col+=vec3(1.)*edge*.22;
        col+=iri*uMotion*.16;

        gl_FragColor=vec4(col,uOpacity);
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
      uMotion:{value:0},
      uBlack:{value:P.material.moire.black},
      uWhite:{value:P.material.moire.white},
      uOpacity:{value:P.material.moire.opacity},
      uFreqA:{value:P.material.moire.frequencyA},
      uFreqB:{value:P.material.moire.frequencyB},
      uRadialFreq:{value:P.material.moire.radialFrequency},
      uZebraMix:{value:P.material.moire.zebraMix},
      uEdgeGlow:{value:P.material.moire.edgeGlow}
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
        vec4 world=modelMatrix*instanceMatrix*vec4(position,1.);
        vWorld=world.xyz;
        vNormalW=normalize(mat3(modelMatrix*instanceMatrix)*normal);
        gl_Position=projectionMatrix*viewMatrix*world;
      }`,
    fragmentShader:`
      uniform float uTime,uMoire,uZebra,uMotion;
      uniform float uBlack,uWhite,uOpacity,uFreqA,uFreqB,uRadialFreq,uZebraMix,uEdgeGlow;
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

        float a=sin((p.x+p.y*.23)*(uFreqA+uMoire*15.));
        float b=sin((p.y-p.x*.18)*(uFreqB+uMoire*13.)+uTime*.08);
        float radial=sin(length(p)*uRadialFreq-uTime*.05);

        float moire=step(0.,a*b+radial*.15);
        float zebra=step(0.,sin((p.x*.58+p.y)*(38.+uZebra*20.)));
        float bw=mix(moire,zebra,uZebraMix);

        vec3 base=mix(vec3(uBlack),vec3(uWhite),bw);

        vec3 N=normalize(vNormalW);
        vec3 V=normalize(cameraPosition-vWorld);
        float fres=pow(1.-max(dot(N,V),0.),2.5);
        float edge=edgeFactor();

        vec3 iri=.5+.5*cos(
          6.28318*(fres+vec3(0.,.33,.67))+vec3(0.,1.5,2.35)
        );
        iri=mix(uA,uB,iri.r);
        iri=mix(iri,uC,.28+fres*.46);

        vec3 col=base*.48;
        col+=iri*edge*uEdgeGlow;
        col+=iri*fres*.11;
        col+=vec3(1.)*uMotion*.025;

        gl_FragColor=vec4(col,uOpacity);
      }`
  });
}

function makeRod(geometry,material,a,b,radius){
  const mesh=new THREE.Mesh(geometry,material);
  const delta=b.clone().sub(a);
  const length=delta.length();

  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(Y_AXIS,delta.clone().normalize());
  mesh.scale.set(radius,length,radius);
  return mesh;
}

function createGiantWireTriangle(size,material,rodGeometry){
  const h=Math.sqrt(3)/2;
  const a=new THREE.Vector3(0,h*2/3*size,0);
  const b=new THREE.Vector3(-.5*size,-h/3*size,0);
  const c=new THREE.Vector3(.5*size,-h/3*size,0);

  const group=new THREE.Group();
  const radius=P.layers.giantWire.tubeRadius;

  group.add(makeRod(rodGeometry,material,a,b,radius));
  group.add(makeRod(rodGeometry,material,b,c,radius));
  group.add(makeRod(rodGeometry,material,c,a,radius));

  return group;
}

export async function createVisualScene(stage,cases,videoTexture){
  if(document.fonts?.load){
    try{await document.fonts.load('700 112px "Turret Road"');}catch{}
  }

  const scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x030306,.027);

  const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,120);
  camera.position.set(0,0,8.8);

  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.3;
  stage.appendChild(renderer.domElement);

  const composer=new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(devicePixelRatio,2));
  composer.setSize(innerWidth,innerHeight);

  const renderPass=new RenderPass(scene,camera);
  const bloomPass=new UnrealBloomPass(
    new THREE.Vector2(innerWidth,innerHeight),
    P.bloom.strength,
    P.bloom.radius,
    P.bloom.threshold
  );
  const outputPass=new OutputPass();

  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(outputPass);

  const root=new THREE.Group();
  scene.add(root);

  // Layer A: mathematical iridescent wire scaffold.
  const scaffoldGroup=new THREE.Group();
  root.add(scaffoldGroup);

  const scaffoldMat=createScaffoldMaterial();
  const scaffold=new THREE.LineSegments(createScaffoldGeometry(),scaffoldMat);
  scaffoldGroup.add(scaffold);

  // Layer B: spherical triangle polygon shell.
  const shellGroup=new THREE.Group();
  root.add(shellGroup);

  const triGeo=triangleGeometry();
  const reflectiveMat=createReflectiveMaterial(videoTexture);
  const moireMat=createMoireMaterial();

  const reflectiveTriangles=[];
  const moireSeeds=[];

  const shellCount=P.layers.shell.count;
  const reflectiveWanted=Math.max(
    1,
    Math.round(shellCount*P.layers.shell.reflectiveRatio)
  );
  let reflectiveCreated=0;

  for(let i=0;i<shellCount;i++){
    const direction=fibonacciDirection(i,shellCount);
    const radius=THREE.MathUtils.lerp(
      P.layers.shell.radiusMin,
      P.layers.shell.radiusMax,
      rand(i,4.7)
    )+(rand(i,8.1)-.5)*P.layers.shell.radialJitter;

    const position=ellipsoidPoint(
      direction,
      radius,
      P.layers.shell.ellipsoid
    );

    position.z+=P.layers.shell.frontBias*(1-Math.abs(direction.z));

    const shouldReflect=
      reflectiveCreated<reflectiveWanted &&
      (
        rand(i,12.3)<P.layers.shell.reflectiveRatio ||
        shellCount-i<=reflectiveWanted-reflectiveCreated
      );

    const temp=new THREE.Object3D();
    temp.position.copy(position);
    orientToNormal(
      temp,
      direction,
      (rand(i,5.2)-.5)*Math.PI*P.layers.shell.rotationJitter
    );

    if(shouldReflect){
      reflectiveCreated++;

      const mesh=new THREE.Mesh(triGeo,reflectiveMat);
      const size=THREE.MathUtils.lerp(
        P.layers.shell.reflectiveSizeMin,
        P.layers.shell.reflectiveSizeMax,
        Math.pow(rand(i,15.1),.66)
      );

      mesh.position.copy(temp.position);
      mesh.quaternion.copy(temp.quaternion);
      mesh.scale.setScalar(size);

      mesh.userData.basePos=mesh.position.clone();
      mesh.userData.baseQuat=mesh.quaternion.clone();
      mesh.userData.baseScale=size;
      mesh.userData.normal=direction.clone();
      mesh.userData.phase=rand(i,18.4)*Math.PI*2;

      reflectiveTriangles.push(mesh);
      shellGroup.add(mesh);
    }else{
      const size=THREE.MathUtils.lerp(
        P.layers.shell.moireSizeMin,
        P.layers.shell.moireSizeMax,
        Math.pow(rand(i,17.7),1.25)
      );

      moireSeeds.push({
        position:temp.position.clone(),
        quaternion:temp.quaternion.clone(),
        scale:size,
        normal:direction.clone(),
        phase:rand(i,21.8)*Math.PI*2
      });
    }
  }

  const moireMesh=new THREE.InstancedMesh(triGeo,moireMat,moireSeeds.length);
  moireMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  shellGroup.add(moireMesh);

  const instanceTemp=new THREE.Object3D();
  moireSeeds.forEach((seed,i)=>{
    instanceTemp.position.copy(seed.position);
    instanceTemp.quaternion.copy(seed.quaternion);
    instanceTemp.scale.setScalar(seed.scale);
    instanceTemp.updateMatrix();
    moireMesh.setMatrixAt(i,instanceTemp.matrix);
  });
  moireMesh.instanceMatrix.needsUpdate=true;

  // Layer C: giant glossy anthracite wire polygons.
  const giantWireGroup=new THREE.Group();
  root.add(giantWireGroup);

  const giantMat=new THREE.MeshPhysicalMaterial({
    color:new THREE.Color(P.layers.giantWire.darkColor),
    emissive:new THREE.Color(P.layers.giantWire.emissiveColor),
    emissiveIntensity:P.layers.giantWire.emissiveIntensity,
    metalness:P.layers.giantWire.metalness,
    roughness:P.layers.giantWire.roughness,
    clearcoat:P.layers.giantWire.clearcoat,
    clearcoatRoughness:P.layers.giantWire.clearcoatRoughness,
    side:THREE.DoubleSide
  });

  const rodGeometry=new THREE.CylinderGeometry(1,1,1,6,1,false);
  const giantPolygons=[];

  for(let i=0;i<P.layers.giantWire.count;i++){
    const direction=fibonacciDirection(i+31,P.layers.giantWire.count+31);

    const radius=THREE.MathUtils.lerp(
      P.layers.giantWire.radiusMin,
      P.layers.giantWire.radiusMax,
      rand(i,30.7)
    );

    const position=ellipsoidPoint(
      direction,
      radius,
      P.layers.giantWire.ellipsoid
    );

    const size=THREE.MathUtils.lerp(
      P.layers.giantWire.sizeMin,
      P.layers.giantWire.sizeMax,
      rand(i,33.1)
    );

    const group=createGiantWireTriangle(size,giantMat,rodGeometry);

    group.position.copy(position);
    orientToNormal(group,direction,(rand(i,35.2)-.5)*Math.PI);

    group.userData.basePos=group.position.clone();
    group.userData.baseQuat=group.quaternion.clone();
    group.userData.phase=rand(i,39.4)*Math.PI*2;

    giantPolygons.push(group);
    giantWireGroup.add(group);
  }

  // Lights mainly reveal the glossy black outer wire layer.
  scene.add(new THREE.AmbientLight(0xffffff,.17));

  const key=new THREE.PointLight(0xffffff,11,36);
  const cyan=new THREE.PointLight(0x74f7ff,8,32);
  const magenta=new THREE.PointLight(0xff4ecf,7,32);

  key.position.set(3.8,4.8,6.5);
  cyan.position.set(-5,1.5,4);
  magenta.position.set(4,-4,-2);

  scene.add(key,cyan,magenta);

  function applyParams(){
    bloomPass.strength=P.bloom.strength;
    bloomPass.radius=P.bloom.radius;
    bloomPass.threshold=P.bloom.threshold;

    scaffoldMat.uniforms.uOpacity.value=P.layers.scaffold.opacity;
    scaffoldMat.uniforms.uGlow.value=P.material.scaffold.glow;
    scaffoldMat.uniforms.uWhiteCore.value=P.material.scaffold.whiteCore;

    reflectiveMat.uniforms.uSaturation.value=P.material.reflection.saturation;
    reflectiveMat.uniforms.uBrightness.value=P.material.reflection.brightness;
    reflectiveMat.uniforms.uBaseLift.value=P.material.reflection.baseLift;
    reflectiveMat.uniforms.uEdgeGlow.value=P.material.reflection.edgeGlow;
    reflectiveMat.uniforms.uFresnelGlow.value=P.material.reflection.fresnelGlow;
    reflectiveMat.uniforms.uOpacity.value=P.material.reflection.opacity;
    reflectiveMat.uniforms.uPixelGrid.value.set(...P.material.reflection.pixelGrid);

    moireMat.uniforms.uBlack.value=P.material.moire.black;
    moireMat.uniforms.uWhite.value=P.material.moire.white;
    moireMat.uniforms.uOpacity.value=P.material.moire.opacity;
    moireMat.uniforms.uFreqA.value=P.material.moire.frequencyA;
    moireMat.uniforms.uFreqB.value=P.material.moire.frequencyB;
    moireMat.uniforms.uRadialFreq.value=P.material.moire.radialFrequency;
    moireMat.uniforms.uZebraMix.value=P.material.moire.zebraMix;
    moireMat.uniforms.uEdgeGlow.value=P.material.moire.edgeGlow;

    giantMat.color.set(P.layers.giantWire.darkColor);
    giantMat.emissive.set(P.layers.giantWire.emissiveColor);
    giantMat.emissiveIntensity=P.layers.giantWire.emissiveIntensity;
    giantMat.metalness=P.layers.giantWire.metalness;
    giantMat.roughness=P.layers.giantWire.roughness;
    giantMat.clearcoat=P.layers.giantWire.clearcoat;
    giantMat.clearcoatRoughness=P.layers.giantWire.clearcoatRoughness;
    giantMat.needsUpdate=true;
  }

  function resize(){
    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();

    const ratio=Math.min(devicePixelRatio,2);
    renderer.setPixelRatio(ratio);
    renderer.setSize(innerWidth,innerHeight);

    composer.setPixelRatio(ratio);
    composer.setSize(innerWidth,innerHeight);
  }

  return {
    scene,camera,renderer,composer,bloomPass,root,
    scaffoldGroup,scaffoldMat,
    shellGroup,reflectiveMat,reflectiveTriangles,
    moireMat,moireMesh,moireSeeds,
    giantWireGroup,giantPolygons,giantMat,
    key,cyan,magenta,
    applyParams,
    resize
  };
}

export function updateVisualScene(
  visual,
  time,
  state,
  pointer,
  cameraMotion,
  activeCase
){
  const motionRaw=cameraMotion.motion||0;
  const motion=motionRaw*motionRaw*(3-2*motionRaw);

  const humanX=cameraMotion.motionX||0;
  const humanY=cameraMotion.motionY||0;
  const humanVX=cameraMotion.velocityX||0;
  const humanVY=cameraMotion.velocityY||0;
  const humanCX=cameraMotion.centroidX||0;
  const humanCY=cameraMotion.centroidY||0;

  const {
    root,
    scaffoldGroup,scaffoldMat,
    reflectiveMat,reflectiveTriangles,
    moireMat,moireMesh,moireSeeds,
    giantWireGroup,giantPolygons,
    bloomPass,key,cyan,magenta
  }=visual;

  const R=P.reaction;

  root.rotation.x=THREE.MathUtils.lerp(
    root.rotation.x,
    pointer.y*R.root.pointerY-humanY*R.root.cameraY,
    .026
  );

  root.rotation.y=THREE.MathUtils.lerp(
    root.rotation.y,
    pointer.x*R.root.pointerX+humanX*R.root.cameraX,
    .026
  );

  root.rotation.z=THREE.MathUtils.lerp(
    root.rotation.z,
    humanVX*R.root.velocityRoll,
    .018
  );

  // Layer A.
  scaffoldMat.uniforms.uTime.value=time;
  scaffoldMat.uniforms.uMotion.value=motion;
  scaffoldMat.uniforms.uA.value.copy(state.palette[0]);
  scaffoldMat.uniforms.uB.value.copy(state.palette[1]||state.palette[0]);
  scaffoldMat.uniforms.uC.value.copy(
    state.palette[2]||state.palette[1]||state.palette[0]
  );

  scaffoldGroup.rotation.x=THREE.MathUtils.lerp(
    scaffoldGroup.rotation.x,
    -humanY*R.scaffold.cameraY+Math.sin(time*.09)*.035,
    .018
  );

  scaffoldGroup.rotation.y=THREE.MathUtils.lerp(
    scaffoldGroup.rotation.y,
    humanX*R.scaffold.cameraX+time*.012,
    .018
  );

  scaffoldGroup.rotation.z=THREE.MathUtils.lerp(
    scaffoldGroup.rotation.z,
    (humanVX-humanVY)*R.scaffold.velocitySpin,
    .014
  );

  const scaffoldScale=
    1+
    Math.sin(time*.24)*P.layers.scaffold.breathing+
    motion*R.scaffold.motionScale;

  const scaffoldS=THREE.MathUtils.lerp(
    scaffoldGroup.scale.x,
    scaffoldScale,
    .02
  );
  scaffoldGroup.scale.setScalar(scaffoldS);

  // Layer B materials.
  reflectiveMat.uniforms.uTime.value=time;
  reflectiveMat.uniforms.uMotion.value=motion;
  reflectiveMat.uniforms.uGlitch.value=state.glitch+motion*.13;
  reflectiveMat.uniforms.uA.value.copy(state.palette[0]);
  reflectiveMat.uniforms.uB.value.copy(state.palette[1]||state.palette[0]);
  reflectiveMat.uniforms.uC.value.copy(
    state.palette[2]||state.palette[1]||state.palette[0]
  );

  moireMat.uniforms.uTime.value=time;
  moireMat.uniforms.uMoire.value=state.moire;
  moireMat.uniforms.uZebra.value=state.zebra;
  moireMat.uniforms.uMotion.value=motion;
  moireMat.uniforms.uA.value.copy(state.palette[0]);
  moireMat.uniforms.uB.value.copy(state.palette[1]||state.palette[0]);
  moireMat.uniforms.uC.value.copy(
    state.palette[2]||state.palette[1]||state.palette[0]
  );

  reflectiveTriangles.forEach(tri=>{
    const base=tri.userData.basePos;
    const normal=tri.userData.normal;

    const dx=base.x-humanCX*3.2;
    const dy=base.y-humanCY*2.5;
    const near=Math.max(0,1-Math.hypot(dx,dy)/R.shell.influenceRadius);

    const target=base.clone()
      .add(new THREE.Vector3(
        humanX*R.shell.xPush*near,
        humanY*R.shell.yPush*near,
        0
      ))
      .addScaledVector(normal,motion*R.shell.zPush*near);

    target.addScaledVector(
      normal,
      Math.sin(time*.22+tri.userData.phase)*.035
    );

    tri.position.lerp(target,.03);

    const q=tri.userData.baseQuat.clone();
    q.multiply(
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          -humanVY*R.shell.velocityTilt*near,
          humanVX*R.shell.velocityTilt*near,
          0
        )
      )
    );
    tri.quaternion.slerp(q,.025);

    const targetScale=tri.userData.baseScale*(
      1+motion*R.shell.scalePulse*near
    );
    const s=THREE.MathUtils.lerp(tri.scale.x,targetScale,.028);
    tri.scale.setScalar(s);
  });

  const temp=new THREE.Object3D();

  moireSeeds.forEach((seed,i)=>{
    const base=seed.position;
    const normal=seed.normal;

    const dx=base.x-humanCX*3.4;
    const dy=base.y-humanCY*2.7;
    const near=Math.max(0,1-Math.hypot(dx,dy)/R.shell.influenceRadius);

    temp.position.copy(base);
    temp.position.x+=humanX*R.shell.xPush*.7*near;
    temp.position.y+=humanY*R.shell.yPush*.7*near;
    temp.position.addScaledVector(
      normal,
      motion*R.shell.zPush*.68*near+
      Math.sin(time*.17+seed.phase)*.025
    );

    temp.quaternion.copy(seed.quaternion);
    temp.rotateX(-humanVY*R.shell.velocityTilt*.58*near);
    temp.rotateY(humanVX*R.shell.velocityTilt*.58*near);

    temp.scale.setScalar(
      seed.scale*(1+motion*R.shell.scalePulse*.72*near)
    );

    temp.updateMatrix();
    moireMesh.setMatrixAt(i,temp.matrix);
  });

  moireMesh.instanceMatrix.needsUpdate=true;

  // Layer C.
  giantPolygons.forEach(poly=>{
    const base=poly.userData.basePos;
    const target=base.clone();

    target.x+=humanX*R.giantWire.xPush;
    target.y+=humanY*R.giantWire.yPush;
    target.z+=Math.sin(
      time*P.layers.giantWire.motion+poly.userData.phase
    )*.055;

    poly.position.lerp(target,.012);

    const q=poly.userData.baseQuat.clone();
    q.multiply(
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          -humanVY*R.giantWire.velocityTilt,
          humanVX*R.giantWire.velocityTilt,
          0
        )
      )
    );
    poly.quaternion.slerp(q,.01);

    const targetScale=1+motion*R.giantWire.motionScale;
    const s=THREE.MathUtils.lerp(poly.scale.x,targetScale,.012);
    poly.scale.setScalar(s);
  });

  giantWireGroup.rotation.y+=.00035;
  giantWireGroup.rotation.x=Math.sin(time*.045)*.035;

  // Light motion stays subtle.
  key.position.x=THREE.MathUtils.lerp(
    key.position.x,
    3.8+humanX*1.2,
    .02
  );
  key.position.y=THREE.MathUtils.lerp(
    key.position.y,
    4.8+humanY*.9,
    .02
  );

  cyan.color.copy(state.palette[0]);
  magenta.color.copy(state.palette[1]||state.palette[0]);

  cyan.intensity=7+state.intensity*3+motion*3;
  magenta.intensity=6+state.glitch*2+motion*2;

  bloomPass.strength=
    P.bloom.strength+
    motion*P.bloom.motionBoost+
    state.intensity*.05;
}