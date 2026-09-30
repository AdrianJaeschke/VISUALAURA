import * as THREE from "three";
import { EffectComposer } from "https://unpkg.com/three@0.164.1/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://unpkg.com/three@0.164.1/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://unpkg.com/three@0.164.1/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "https://unpkg.com/three@0.164.1/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "https://unpkg.com/three@0.164.1/examples/jsm/postprocessing/OutputPass.js";
import { VISUAL_PARAMS as P } from "./visual-config.js";

const Y_AXIS=new THREE.Vector3(0,1,0);
let ACTIVE_SEED=P.generation.seed;

function rand(a,b=1){
  return Math.abs(
    Math.sin((a+ACTIVE_SEED)*12.9898+(b+ACTIVE_SEED*.017)*78.233)*43758.5453
  )%1;
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
      }
    `,
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
        float band=floor(uv.y*36.);
        float glitch=step(.93,hash(vec2(band,floor(uTime*5.))))*uGlitch;
        uv.x+=(hash(vec2(band,7.+floor(uTime*6.)))-.5)*.04*glitch;
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

        vec3 col=chrome*(.56+fres*.34);
        col+=iri*(edge*uEdgeGlow+fres*uFresnelGlow);
        col+=vec3(1.)*edge*.20;
        col+=iri*uMotion*.14;

        gl_FragColor=vec4(col,uOpacity);
      }
    `
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
        vec4 world=modelMatrix*vec4(position,1.);
        vWorld=world.xyz;
        vNormalW=normalize(mat3(modelMatrix)*normal);
        gl_Position=projectionMatrix*viewMatrix*world;
      }
    `,
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
        vec3 a3=smoothstep(vec3(0.),d*1.3,vBary);
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
        float fres=pow(1.-max(dot(N,V),0.),2.4);
        float edge=edgeFactor();

        vec3 iri=.5+.5*cos(
          6.28318*(fres+vec3(0.,.33,.67))+vec3(0.,1.5,2.35)
        );
        iri=mix(uA,uB,iri.r);
        iri=mix(iri,uC,.28+fres*.42);

        vec3 col=base*.54;
        col+=iri*edge*uEdgeGlow;
        col+=iri*fres*.07;
        col+=vec3(1.)*uMotion*.02;

        gl_FragColor=vec4(col,uOpacity);
      }
    `
  });
}

function createIridescentMaterial(){
  return new THREE.ShaderMaterial({
    side:THREE.DoubleSide,
    transparent:true,
    depthWrite:false,
    uniforms:{
      uTime:{value:0},
      uA:{value:new THREE.Color("#74f7ff")},
      uB:{value:new THREE.Color("#ff4ecf")},
      uC:{value:new THREE.Color("#7b69ff")},
      uMotion:{value:0},
      uBrightness:{value:P.material.iridescent.brightness},
      uOpacity:{value:P.material.iridescent.opacity},
      uEdgeGlow:{value:P.material.iridescent.edgeGlow},
      uFresnelGlow:{value:P.material.iridescent.fresnelGlow},
      uSpeed:{value:P.material.iridescent.speed},
      uCaseIridescence:{value:1}
    },
    vertexShader:`
      attribute vec3 bary;
      varying vec3 vBary;
      varying vec3 vWorld;
      varying vec3 vNormalW;
      varying float vPhase;

      void main(){
        vBary=bary;
        vec4 local=instanceMatrix*vec4(position,1.);
        vec4 world=modelMatrix*local;
        vWorld=world.xyz;
        vNormalW=normalize(mat3(modelMatrix*instanceMatrix)*normal);
        vPhase=instanceMatrix[3][0]*.17+instanceMatrix[3][1]*.23+instanceMatrix[3][2]*.19;
        gl_Position=projectionMatrix*viewMatrix*world;
      }
    `,
    fragmentShader:`
      uniform float uTime,uMotion,uBrightness,uOpacity,uEdgeGlow,uFresnelGlow,uSpeed;
      uniform float uCaseIridescence;
      uniform vec3 uA,uB,uC;

      varying vec3 vBary;
      varying vec3 vWorld;
      varying vec3 vNormalW;
      varying float vPhase;

      float edgeFactor(){
        vec3 d=fwidth(vBary);
        vec3 a3=smoothstep(vec3(0.),d*1.25,vBary);
        return 1.-min(min(a3.x,a3.y),a3.z);
      }

      void main(){
        vec3 N=normalize(vNormalW);
        vec3 V=normalize(cameraPosition-vWorld);
        float fres=pow(1.-max(dot(N,V),0.),1.8);
        float edge=edgeFactor();

        float spectralPhase=
          fres*1.45+
          vPhase+
          uTime*uSpeed+
          sin((vWorld.x+vWorld.y)*.8+uTime*.13)*.08;

        vec3 spectrum=.5+.5*cos(
          6.28318*(spectralPhase+vec3(0.,.333,.667))
        );

        vec3 palette=mix(uA,uB,spectrum.r);
        palette=mix(palette,uC,spectrum.b*.48);
        palette*=uCaseIridescence;

        vec3 col=palette*(.34+fres*uFresnelGlow);
        col+=palette*edge*uEdgeGlow;
        col+=vec3(1.)*edge*.08;
        col*=uBrightness+uMotion*.14;

        gl_FragColor=vec4(col,uOpacity);
      }
    `
  });
}

function createGlobalDitherPass(){
  return new ShaderPass({
    uniforms:{
      tDiffuse:{value:null},
      uStrength:{value:P.postfx.dither.strength},
      uScale:{value:P.postfx.dither.scale},
      uLevels:{value:P.postfx.dither.levels},
      uTime:{value:0}
    },
    vertexShader:`
      varying vec2 vUv;

      void main(){
        vUv=uv;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
      }
    `,
    fragmentShader:`
      uniform sampler2D tDiffuse;
      uniform float uStrength;
      uniform float uScale;
      uniform float uLevels;
      uniform float uTime;
      varying vec2 vUv;

      float bayer4(vec2 p){
        vec2 f=mod(floor(p),4.0);
        float x=f.x;
        float y=f.y;

        if(y<1.0){
          if(x<1.0)return 0.0/16.0;
          if(x<2.0)return 8.0/16.0;
          if(x<3.0)return 2.0/16.0;
          return 10.0/16.0;
        }

        if(y<2.0){
          if(x<1.0)return 12.0/16.0;
          if(x<2.0)return 4.0/16.0;
          if(x<3.0)return 14.0/16.0;
          return 6.0/16.0;
        }

        if(y<3.0){
          if(x<1.0)return 3.0/16.0;
          if(x<2.0)return 11.0/16.0;
          if(x<3.0)return 1.0/16.0;
          return 9.0/16.0;
        }

        if(x<1.0)return 15.0/16.0;
        if(x<2.0)return 7.0/16.0;
        if(x<3.0)return 13.0/16.0;
        return 5.0/16.0;
      }

      void main(){
        vec4 source=texture2D(tDiffuse,vUv);
        float scale=max(.5,uScale);
        float levels=max(2.0,uLevels);
        float threshold=bayer4(gl_FragCoord.xy/scale);

        vec3 stepped=floor(max(source.rgb,vec3(0.0))*(levels-1.0)+threshold)/(levels-1.0);
        vec3 color=mix(source.rgb,stepped,clamp(uStrength,0.0,1.0));

        gl_FragColor=vec4(color,source.a);
      }
    `
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

function createWireTriangle(size,material,rodGeometry){
  const h=Math.sqrt(3)/2;
  const a=new THREE.Vector3(0,h*2/3*size,0);
  const b=new THREE.Vector3(-.5*size,-h/3*size,0);
  const c=new THREE.Vector3(.5*size,-h/3*size,0);

  const group=new THREE.Group();
  const radius=P.composition.outerWire.tubeRadius;

  group.add(makeRod(rodGeometry,material,a,b,radius));
  group.add(makeRod(rodGeometry,material,b,c,radius));
  group.add(makeRod(rodGeometry,material,c,a,radius));

  return group;
}

export async function createVisualScene(stage,cases,videoTexture){
  ACTIVE_SEED=P.generation.randomizeEachLoad
    ? Math.random()*100000
    : P.generation.seed;

  const scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x030306,.025);

  const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,120);
  camera.position.set(0,0,8.5);

  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.25;
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
  const ditherPass=createGlobalDitherPass();
  const outputPass=new OutputPass();

  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(ditherPass);
  composer.addPass(outputPass);

  const root=new THREE.Group();
  scene.add(root);

  const triGeo=triangleGeometry();

  // 1. One dominant webcam mirror triangle in the center.
  const heroGroup=new THREE.Group();
  root.add(heroGroup);

  const reflectiveMat=createReflectiveMaterial(videoTexture);
  const heroTriangle=new THREE.Mesh(triGeo,reflectiveMat);
  heroTriangle.position.set(0,0,P.composition.hero.z);
  heroTriangle.rotation.set(P.composition.hero.tiltX,P.composition.hero.tiltY,0);
  heroTriangle.scale.setScalar(P.composition.hero.size);
  heroTriangle.renderOrder=4;
  heroTriangle.userData.baseScale=P.composition.hero.size;
  heroGroup.add(heroTriangle);

  // 2. Exactly three moire triangles, deliberately overlapping the hero.
  const moireGroup=new THREE.Group();
  root.add(moireGroup);

  const moireMat=createMoireMaterial();
  const moireTriangles=[];

  for(let i=0;i<P.composition.moire.count;i++){
    const angle=-Math.PI/2+i*Math.PI*2/P.composition.moire.count;
    const size=THREE.MathUtils.lerp(
      P.composition.moire.sizeMin,
      P.composition.moire.sizeMax,
      rand(i,31.2)
    );

    const mesh=new THREE.Mesh(triGeo,moireMat);
    mesh.position.set(
      Math.cos(angle)*P.composition.moire.radius,
      Math.sin(angle)*P.composition.moire.radius*P.composition.moire.yRatio,
      P.composition.moire.zStart+i*P.composition.moire.zStep
    );
    mesh.rotation.set(
      (rand(i,32.1)-.5)*.13,
      (rand(i,33.1)-.5)*.13,
      angle*.22+(rand(i,34.1)-.5)*P.composition.moire.rotationJitter
    );
    mesh.scale.setScalar(size);
    mesh.renderOrder=3;

    mesh.userData.basePosition=mesh.position.clone();
    mesh.userData.baseRotation=mesh.rotation.clone();
    mesh.userData.baseScale=size;
    mesh.userData.phase=rand(i,35.1)*Math.PI*2;

    moireTriangles.push(mesh);
    moireGroup.add(mesh);
  }

  // 3. Many small iridescent triangles, compact around the same center.
  const auraGroup=new THREE.Group();
  root.add(auraGroup);

  const iridescentMat=createIridescentMaterial();
  const auraSeeds=[];
  const auraCount=P.composition.aura.count;
  const auraMesh=new THREE.InstancedMesh(triGeo,iridescentMat,auraCount);
  auraMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  auraMesh.renderOrder=2;
  auraGroup.add(auraMesh);

  const temp=new THREE.Object3D();

  for(let i=0;i<auraCount;i++){
    const angle=rand(i,41.2)*Math.PI*2;
    const radialT=Math.pow(rand(i,42.7),P.composition.aura.radialPower);
    const radius=THREE.MathUtils.lerp(
      P.composition.aura.radiusMin,
      P.composition.aura.radiusMax,
      radialT
    );

    const basePosition=new THREE.Vector3(
      Math.cos(angle)*radius*P.composition.aura.ellipsoid[0],
      Math.sin(angle)*radius*P.composition.aura.ellipsoid[1],
      (rand(i,43.9)-.5)*P.composition.aura.depthSpread*P.composition.aura.ellipsoid[2]-.20
    );

    const baseRotation=new THREE.Euler(
      (rand(i,44.1)-.5)*.58,
      (rand(i,45.3)-.5)*.58,
      rand(i,46.7)*Math.PI*2
    );

    const size=THREE.MathUtils.lerp(
      P.composition.aura.sizeMin,
      P.composition.aura.sizeMax,
      Math.pow(rand(i,47.4),1.18)
    );

    temp.position.copy(basePosition);
    temp.rotation.copy(baseRotation);
    temp.scale.setScalar(size);
    temp.updateMatrix();
    auraMesh.setMatrixAt(i,temp.matrix);

    auraSeeds.push({
      position:basePosition,
      rotation:baseRotation,
      scale:size,
      phase:rand(i,48.8)*Math.PI*2,
      depth:rand(i,49.2)
    });
  }

  auraMesh.instanceMatrix.needsUpdate=true;

  // 4. One large white glossy triangle wireframe surrounding the cluster.
  const outerWireGroup=new THREE.Group();
  root.add(outerWireGroup);

  const outerWireMat=new THREE.MeshPhysicalMaterial({
    color:new THREE.Color(P.composition.outerWire.color),
    emissive:new THREE.Color(P.composition.outerWire.emissiveColor),
    emissiveIntensity:P.composition.outerWire.emissiveIntensity,
    metalness:P.composition.outerWire.metalness,
    roughness:P.composition.outerWire.roughness,
    clearcoat:P.composition.outerWire.clearcoat,
    clearcoatRoughness:P.composition.outerWire.clearcoatRoughness,
    side:THREE.DoubleSide
  });

  const rodGeometry=new THREE.CylinderGeometry(1,1,1,8,1,false);
  const outerWire=createWireTriangle(
    P.composition.outerWire.size,
    outerWireMat,
    rodGeometry
  );

  outerWire.position.set(0,0,P.composition.outerWire.z);
  outerWire.rotation.set(
    P.composition.outerWire.tiltX,
    P.composition.outerWire.tiltY,
    P.composition.outerWire.tiltZ
  );
  outerWireGroup.add(outerWire);

  scene.add(new THREE.AmbientLight(0xffffff,.16));

  const key=new THREE.PointLight(0xffffff,7.5,34);
  const colorLightA=new THREE.PointLight(0x74f7ff,6.5,30);
  const colorLightB=new THREE.PointLight(0xff4ecf,5.5,30);

  key.position.set(3.4,4.3,6.2);
  colorLightA.position.set(-4.2,1.4,3.8);
  colorLightB.position.set(3.7,-3.2,-1);

  scene.add(key,colorLightA,colorLightB);

  function applyParams(){
    bloomPass.strength=P.bloom.strength;
    bloomPass.radius=P.bloom.radius;
    bloomPass.threshold=P.bloom.threshold;

    ditherPass.uniforms.uStrength.value=P.postfx.dither.strength;
    ditherPass.uniforms.uScale.value=P.postfx.dither.scale;
    ditherPass.uniforms.uLevels.value=P.postfx.dither.levels;

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

    iridescentMat.uniforms.uBrightness.value=P.material.iridescent.brightness;
    iridescentMat.uniforms.uOpacity.value=P.material.iridescent.opacity;
    iridescentMat.uniforms.uEdgeGlow.value=P.material.iridescent.edgeGlow;
    iridescentMat.uniforms.uFresnelGlow.value=P.material.iridescent.fresnelGlow;
    iridescentMat.uniforms.uSpeed.value=P.material.iridescent.speed;

    outerWireMat.color.set(P.composition.outerWire.color);
    outerWireMat.emissive.set(P.composition.outerWire.emissiveColor);
    outerWireMat.emissiveIntensity=P.composition.outerWire.emissiveIntensity;
    outerWireMat.metalness=P.composition.outerWire.metalness;
    outerWireMat.roughness=P.composition.outerWire.roughness;
    outerWireMat.clearcoat=P.composition.outerWire.clearcoat;
    outerWireMat.clearcoatRoughness=P.composition.outerWire.clearcoatRoughness;
    outerWireMat.needsUpdate=true;
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
    scene,camera,renderer,composer,bloomPass,ditherPass,root,

    heroGroup,heroTriangle,reflectiveMat,
    moireGroup,moireTriangles,moireMat,
    auraGroup,auraMesh,auraSeeds,iridescentMat,
    outerWireGroup,outerWire,outerWireMat,

    key,colorLightA,colorLightB,
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

  const {
    root,
    heroTriangle,reflectiveMat,
    moireGroup,moireTriangles,moireMat,
    auraGroup,auraMesh,auraSeeds,iridescentMat,
    outerWireGroup,outerWire,
    bloomPass,ditherPass,key,colorLightA,colorLightB
  }=visual;

  const R=P.reaction;

  root.rotation.x=THREE.MathUtils.lerp(
    root.rotation.x,
    pointer.y*R.root.pointerY-humanY*R.root.cameraY+state.tiltBias*.018,
    .025
  );

  root.rotation.y=THREE.MathUtils.lerp(
    root.rotation.y,
    pointer.x*R.root.pointerX+humanX*R.root.cameraX+state.rotationBias*.013,
    .025
  );

  root.rotation.z=THREE.MathUtils.lerp(
    root.rotation.z,
    humanVX*R.root.velocityRoll,
    .015
  );

  reflectiveMat.uniforms.uTime.value=time;
  reflectiveMat.uniforms.uMotion.value=motion;
  reflectiveMat.uniforms.uGlitch.value=state.glitch+motion*.10;
  reflectiveMat.uniforms.uA.value.copy(state.palette[0]);
  reflectiveMat.uniforms.uB.value.copy(state.palette[1]||state.palette[0]);
  reflectiveMat.uniforms.uC.value.copy(
    state.palette[2]||state.palette[1]||state.palette[0]
  );

  heroTriangle.position.x=THREE.MathUtils.lerp(
    heroTriangle.position.x,
    humanX*R.hero.xPush,
    .032
  );
  heroTriangle.position.y=THREE.MathUtils.lerp(
    heroTriangle.position.y,
    humanY*R.hero.yPush,
    .032
  );
  heroTriangle.position.z=THREE.MathUtils.lerp(
    heroTriangle.position.z,
    P.composition.hero.z+motion*R.hero.zPush,
    .03
  );

  heroTriangle.rotation.x=THREE.MathUtils.lerp(
    heroTriangle.rotation.x,
    P.composition.hero.tiltX-humanVY*R.hero.velocityTilt+pointer.y*.04,
    .028
  );
  heroTriangle.rotation.y=THREE.MathUtils.lerp(
    heroTriangle.rotation.y,
    P.composition.hero.tiltY+humanVX*R.hero.velocityTilt+pointer.x*.05,
    .028
  );

  const heroScale=
    P.composition.hero.size*
    state.heroScale*
    (1+motion*R.hero.scalePulse);
  const heroS=THREE.MathUtils.lerp(heroTriangle.scale.x,heroScale,.025);
  heroTriangle.scale.setScalar(heroS);

  moireMat.uniforms.uTime.value=time;
  moireMat.uniforms.uMotion.value=motion;
  moireMat.uniforms.uMoire.value=state.moire;
  moireMat.uniforms.uZebra.value=state.zebra;
  moireMat.uniforms.uA.value.copy(state.palette[0]);
  moireMat.uniforms.uB.value.copy(state.palette[1]||state.palette[0]);
  moireMat.uniforms.uC.value.copy(
    state.palette[2]||state.palette[1]||state.palette[0]
  );

  moireGroup.rotation.z=THREE.MathUtils.lerp(
    moireGroup.rotation.z,
    state.orbitBias*.24+time*.005,
    .012
  );

  moireTriangles.forEach(tri=>{
    const base=tri.userData.basePosition;
    const baseRot=tri.userData.baseRotation;

    tri.position.x=THREE.MathUtils.lerp(
      tri.position.x,
      base.x+humanX*R.moire.xPush,
      R.moire.lag
    );
    tri.position.y=THREE.MathUtils.lerp(
      tri.position.y,
      base.y+humanY*R.moire.yPush,
      R.moire.lag
    );
    tri.position.z=THREE.MathUtils.lerp(
      tri.position.z,
      base.z+motion*R.moire.zPush+Math.sin(time*.19+tri.userData.phase)*.035,
      R.moire.lag
    );

    tri.rotation.x=THREE.MathUtils.lerp(
      tri.rotation.x,
      baseRot.x-humanVY*R.moire.velocityTilt,
      R.moire.lag
    );
    tri.rotation.y=THREE.MathUtils.lerp(
      tri.rotation.y,
      baseRot.y+humanVX*R.moire.velocityTilt,
      R.moire.lag
    );
    tri.rotation.z=baseRot.z+Math.sin(time*.11+tri.userData.phase)*.03;

    const targetScale=
      tri.userData.baseScale*
      state.moireScale*
      (1+motion*R.moire.scalePulse);
    const s=THREE.MathUtils.lerp(tri.scale.x,targetScale,R.moire.lag);
    tri.scale.setScalar(s);
  });

  iridescentMat.uniforms.uTime.value=time;
  iridescentMat.uniforms.uMotion.value=motion;
  iridescentMat.uniforms.uA.value.copy(state.palette[0]);
  iridescentMat.uniforms.uB.value.copy(state.palette[1]||state.palette[0]);
  iridescentMat.uniforms.uC.value.copy(
    state.palette[2]||state.palette[1]||state.palette[0]
  );
  iridescentMat.uniforms.uCaseIridescence.value=state.iridescenceBias;

  auraGroup.rotation.z=THREE.MathUtils.lerp(
    auraGroup.rotation.z,
    state.orbitBias*.14-time*.0035,
    .009
  );
  auraGroup.rotation.y=THREE.MathUtils.lerp(
    auraGroup.rotation.y,
    humanX*.038+state.rotationBias*.006,
    .01
  );

  const temp=new THREE.Object3D();

  auraSeeds.forEach((seed,i)=>{
    const depthFactor=.65+seed.depth*.65;

    temp.position.copy(seed.position);
    temp.position.x+=humanX*R.aura.xPush*depthFactor;
    temp.position.y+=humanY*R.aura.yPush*depthFactor;
    temp.position.z+=
      motion*R.aura.zPush*depthFactor+
      Math.sin(time*.16+seed.phase)*.032;

    temp.rotation.copy(seed.rotation);
    temp.rotation.x+=-humanVY*R.aura.velocityTilt*depthFactor;
    temp.rotation.y+=humanVX*R.aura.velocityTilt*depthFactor;
    temp.rotation.z+=Math.sin(time*.10+seed.phase)*.035;

    const scale=
      seed.scale*
      state.auraScale*
      (1+motion*R.aura.scalePulse*depthFactor);

    temp.scale.setScalar(scale);
    temp.updateMatrix();
    auraMesh.setMatrixAt(i,temp.matrix);
  });

  auraMesh.instanceMatrix.needsUpdate=true;

  outerWire.position.x=THREE.MathUtils.lerp(
    outerWire.position.x,
    humanX*R.outerWire.xPush,
    R.outerWire.lag
  );
  outerWire.position.y=THREE.MathUtils.lerp(
    outerWire.position.y,
    humanY*R.outerWire.yPush,
    R.outerWire.lag
  );
  outerWire.position.z=P.composition.outerWire.z;

  outerWire.rotation.x=THREE.MathUtils.lerp(
    outerWire.rotation.x,
    P.composition.outerWire.tiltX-humanVY*R.outerWire.velocityTilt,
    R.outerWire.lag
  );
  outerWire.rotation.y=THREE.MathUtils.lerp(
    outerWire.rotation.y,
    P.composition.outerWire.tiltY+humanVX*R.outerWire.velocityTilt,
    R.outerWire.lag
  );
  outerWire.rotation.z=THREE.MathUtils.lerp(
    outerWire.rotation.z,
    P.composition.outerWire.tiltZ+state.orbitBias*.10,
    R.outerWire.lag
  );

  const wireScale=
    state.wireScale*
    (1+motion*R.outerWire.scalePulse);
  const wireS=THREE.MathUtils.lerp(
    outerWireGroup.scale.x,
    wireScale,
    R.outerWire.lag
  );
  outerWireGroup.scale.setScalar(wireS);

  colorLightA.color.copy(state.palette[0]);
  colorLightB.color.copy(state.palette[1]||state.palette[0]);
  colorLightA.intensity=5.5+state.intensity*2.3+motion*1.3;
  colorLightB.intensity=4.6+state.complexity*1.9+motion*1.0;

  key.position.x=THREE.MathUtils.lerp(
    key.position.x,
    3.4+humanX*.7,
    .018
  );
  key.position.y=THREE.MathUtils.lerp(
    key.position.y,
    4.3+humanY*.6,
    .018
  );

  bloomPass.radius=P.bloom.radius;
  bloomPass.threshold=P.bloom.threshold;
  bloomPass.strength=
    P.bloom.strength+
    state.bloomBias+
    motion*P.bloom.motionBoost+
    state.intensity*.035;

  ditherPass.uniforms.uTime.value=time;
  ditherPass.uniforms.uStrength.value=P.postfx.dither.strength;
  ditherPass.uniforms.uScale.value=P.postfx.dither.scale;
  ditherPass.uniforms.uLevels.value=P.postfx.dither.levels;
}