import * as THREE from "three";
import {VISUAL_PARAMS as P} from "./visual-config.js";

function rand(seedA,seedB=1){
  return Math.abs(Math.sin(seedA*12.9898+seedB*78.233)*43758.5453)%1;
}

function radialFalloff(index,power=3.2,maxRadius=5){
  return Math.pow(rand(index,2.7),power)*maxRadius;
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

function triangleLineGeometry(scale=1){
  const h=Math.sqrt(3)/2;
  const p0=new THREE.Vector3(0,h*2/3,0).multiplyScalar(scale);
  const p1=new THREE.Vector3(-.5,-h/3,0).multiplyScalar(scale);
  const p2=new THREE.Vector3(.5,-h/3,0).multiplyScalar(scale);
  return new THREE.BufferGeometry().setFromPoints([p0,p1,p1,p2,p2,p0]);
}

function headlineTexture(text,a,b){
  const c=document.createElement("canvas");
  c.width=1024;c.height=256;
  const x=c.getContext("2d");
  x.clearRect(0,0,c.width,c.height);

  const g=x.createLinearGradient(0,0,c.width,0);
  g.addColorStop(0,a);g.addColorStop(.55,"#ffffff");g.addColorStop(1,b);

  x.font='700 112px "Turret Road",Arial,sans-serif';
  x.textBaseline="middle";
  x.fillStyle=g;
  x.shadowColor=a;
  x.shadowBlur=24;
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
  x.clearRect(0,0,c.width,c.height);
  x.font='700 62px "Turret Road",Arial,sans-serif';
  x.textBaseline="middle";
  x.fillStyle=color;
  x.shadowColor=color;
  x.shadowBlur=14;
  x.fillText((" "+text.toUpperCase()+"   ").repeat(3),12,64);
  const tex=new THREE.CanvasTexture(c);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.wrapS=THREE.RepeatWrapping;
  return tex;
}

export function createVisualScene(stage,cases,videoTexture){
  const scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x030306,.032);

  const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,120);
  camera.position.set(0,0,8.4);

  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.32;
  stage.appendChild(renderer.domElement);

  const root=new THREE.Group();
  scene.add(root);

  const triGeo=triangleGeometry();

  const reflectiveMat=new THREE.ShaderMaterial({
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
      uGlitch:{value:.1}
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
      uniform float uTime,uMotion,uGlitch;
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
        float glitch=step(.88,hash(vec2(band,floor(uTime*7.))))*uGlitch;
        uv.x+=(hash(vec2(band,9.+floor(uTime*9.)))-.5)*.085*glitch;
        uv=clamp(uv,0.,1.);

        vec2 pixel=floor(uv*vec2(68.,44.))/vec2(68.,44.);
        vec3 cam=texture2D(uVideo,pixel).rgb;
        float l=dot(cam,vec3(.299,.587,.114));
        cam=mix(vec3(l),cam,.72);

        vec3 N=normalize(vNormalW);
        vec3 V=normalize(cameraPosition-vWorld);
        float fres=pow(1.-max(dot(N,V),0.),2.0);

        vec3 iri=.5+.5*cos(6.28318*(fres+vec3(0.,.33,.67))+vec3(0.,1.35,2.15));
        iri=mix(uA,uB,iri.r);
        iri=mix(iri,uC,.34+fres*.46);

        float e=edgeFactor();

        vec3 chrome=pow(cam,vec3(.78))*1.16;
        chrome+=vec3(.08)+fres*.08;
        vec3 col=chrome*(.5+fres*.34);
        col+=iri*(e*2.15+fres*.46);
        col+=vec3(1.)*e*.26;
        col+=iri*uMotion*.22;

        gl_FragColor=vec4(col,.97);
      }`
  });

  const moireMat=new THREE.ShaderMaterial({
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
        float b=sin((p.y-p.x*.18)*(54.+uMoire*16.)+uTime*.12);
        float c=sin(length(p)*74.-uTime*.08);
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
        float pulse=step(.975,sin(vWorld.y*19.+uTime*17.))*uGlitch;
        col+=iri*pulse*.32;
        gl_FragColor=vec4(col,.86);
      }`
  });

  const largeGroup=new THREE.Group();
  root.add(largeGroup);
  const largeTriangles=[];
  const largeWireRings=[];
  const depthBands=P.geometry.large.depthBands;
  const largeCount=P.geometry.large.count;
  const largeRadius=P.reference.aura.radialMax*P.geometry.large.radiusScale;

  for(let i=0;i<largeCount;i++){
    const mesh=new THREE.Mesh(triGeo,reflectiveMat);
    const centerBias=radialFalloff(i+10,P.geometry.large.falloff,largeRadius);
    const angle=rand(i,7.1)*Math.PI*2;
    const band=depthBands[i%depthBands.length];
    const bandJitter=(rand(i,8.2)-.5)*P.geometry.large.depthJitter;
    const size=THREE.MathUtils.lerp(
      P.geometry.large.sizeMin,
      P.geometry.large.sizeMax,
      1-centerBias/largeRadius
    );

    mesh.position.set(
      Math.cos(angle)*centerBias,
      (rand(i,4.4)-.5)*P.geometry.large.ySpread,
      band+bandJitter
    );

    mesh.rotation.set(
      (rand(i,1.2)-.5)*Math.PI,
      (rand(i,3.6)-.5)*Math.PI,
      (rand(i,9.4)-.5)*Math.PI
    );

    mesh.scale.setScalar(size);
    mesh.userData.basePos=mesh.position.clone();
    mesh.userData.baseRot=mesh.rotation.clone();
    mesh.userData.baseScale=size;
    mesh.userData.depthBand=i%depthBands.length;
    largeTriangles.push(mesh);
    largeGroup.add(mesh);

    const rings=[];
    for(let n=1;n<=P.geometry.large.nestedRings;n++){
      const line=new THREE.LineSegments(
        triangleLineGeometry(size*(1-n*.16)),
        new THREE.LineBasicMaterial({
          color:n%2?0xffffff:0x74f7ff,
          transparent:true,
          opacity:.12+n*.045,
          blending:THREE.AdditiveBlending,
          depthWrite:false
        })
      );
      line.position.copy(mesh.position);
      line.rotation.copy(mesh.rotation);
      line.userData.parent=mesh;
      line.userData.level=n;
      largeGroup.add(line);
      rings.push(line);
    }
    largeWireRings.push(rings);
  }

  const smallCount=P.geometry.small.count;
  const smallMesh=new THREE.InstancedMesh(triGeo,moireMat,smallCount);
  smallMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const smallSeeds=[];
  const temp=new THREE.Object3D();

  for(let i=0;i<smallCount;i++){
    const depthBand=i%P.geometry.small.depthBands;
    const z=P.geometry.small.zMin+depthBand*P.geometry.small.zStep+(rand(i,8.1)-.5)*P.geometry.small.zJitter;
    const radius=radialFalloff(
      i+200,
      P.geometry.small.falloff,
      P.reference.shards.radialMax*P.geometry.small.radiusScale
    );
    const angle=rand(i+300,2.1)*Math.PI*2;
    const y=(rand(i+400,5.7)-.5)*P.geometry.small.ySpread;

    temp.position.set(Math.cos(angle)*radius,y,z);
    temp.rotation.set(
      rand(i,4.5)*Math.PI,
      rand(i,1.2)*Math.PI,
      rand(i,6.8)*Math.PI
    );

    const s=THREE.MathUtils.lerp(P.geometry.small.sizeMin,P.geometry.small.sizeMax,rand(i,9.2));
    temp.scale.setScalar(s);
    temp.updateMatrix();
    smallMesh.setMatrixAt(i,temp.matrix);
    smallSeeds.push({
      position:temp.position.clone(),
      rotation:temp.rotation.clone(),
      scale:s,
      speed:.12+rand(i,3.7)*.55
    });
  }
  root.add(smallMesh);

  const tetraGroup=new THREE.Group();
  root.add(tetraGroup);
  const tetraGeo=new THREE.TetrahedronGeometry(.42,0);
  const tetraMeshes=[];

  for(let i=0;i<P.geometry.tetra.count;i++){
    const tetraMat=new THREE.MeshPhysicalMaterial({
      color:0x0d0f16,
      metalness:.88,
      roughness:.14,
      transparent:true,
      opacity:.96
    });
    const tetra=new THREE.Mesh(tetraGeo,tetraMat);
    const radius=THREE.MathUtils.lerp(
      P.reference.core.size*.4,
      P.reference.struts.radialMax*P.geometry.tetra.radiusScale,
      rand(i+500,4.2)
    );
    const angle=rand(i+700,1.8)*Math.PI*2;
    const z=THREE.MathUtils.lerp(P.geometry.tetra.zMin,P.geometry.tetra.zMax,rand(i+800,2.2));
    const y=(rand(i+600,7.6)-.5)*P.geometry.tetra.ySpread;

    tetra.position.set(Math.cos(angle)*radius,y,z);
    tetra.rotation.set(
      rand(i+900,3.7)*Math.PI,
      rand(i+1000,2.8)*Math.PI,
      rand(i+1100,9.1)*Math.PI
    );

    const s=THREE.MathUtils.lerp(P.geometry.tetra.sizeMin,P.geometry.tetra.sizeMax,rand(i+1200,1.5));
    tetra.scale.setScalar(s);

    const edges=new THREE.LineSegments(
      new THREE.EdgesGeometry(tetraGeo),
      new THREE.LineBasicMaterial({
        color:0xffffff,
        transparent:true,
        opacity:.24,
        blending:THREE.AdditiveBlending,
        depthWrite:false
      })
    );
    tetra.add(edges);
    tetra.userData.basePos=tetra.position.clone();
    tetra.userData.baseRot=tetra.rotation.clone();
    tetra.userData.baseScale=s;
    tetraMeshes.push(tetra);
    tetraGroup.add(tetra);
  }

  const sawGeo=new THREE.BufferGeometry();
  const sawPositions=[];
  for(let row=0;row<P.geometry.saw.rows;row++){
    const z=-5.5+row*1.45;
    const y=-2.4+row*.68;
    for(let i=0;i<P.geometry.saw.columns;i++){
      const x=-5.7+i*.3;
      const s=.15+(row%3)*.02;
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
    opacity:.12,
    blending:THREE.AdditiveBlending,
    depthWrite:false
  });
  const saw=new THREE.LineSegments(sawGeo,sawMat);
  saw.rotation.z=-.18;
  root.add(saw);

  const haloGroups=[];
  for(let d=0;d<P.geometry.halo.layers;d++){
    const hg=new THREE.Group();
    hg.position.z=P.geometry.halo.zStart+d*P.geometry.halo.zStep;
    hg.scale.setScalar(P.geometry.halo.baseScale+d*P.geometry.halo.scaleStep);
    hg.rotation.z=(d%2?1:-1)*(.07+d*.02);

    const count=P.geometry.halo.count;
    const haloMesh=new THREE.InstancedMesh(triGeo,moireMat,count);
    const o=new THREE.Object3D();
    for(let i=0;i<count;i++){
      const radius=radialFalloff(
        800+d*100+i,
        2.2,
        P.reference.struts.radialMax*P.geometry.halo.radiusScale
      );
      const angle=rand(i+d*100,3.6)*Math.PI*2;
      o.position.set(
        Math.cos(angle)*radius,
        (rand(i+d*100,6.2)-.5)*3.6,
        0
      );
      o.rotation.set(0,0,rand(i+d*100,8.8)*Math.PI);
      o.scale.setScalar(.055+rand(i+d*100,3.1)*.2);
      o.updateMatrix();
      haloMesh.setMatrixAt(i,o.matrix);
    }
    hg.add(haloMesh);
    root.add(hg);
    haloGroups.push(hg);
  }

  const networkGeo=new THREE.BufferGeometry();
  const networkPositions=[];
  for(let i=0;i<P.geometry.network.segments;i++){
    const a=largeTriangles[i%largeTriangles.length].position;
    const b=largeTriangles[(i*5+7)%largeTriangles.length].position;
    networkPositions.push(a.x,a.y,a.z,b.x,b.y,b.z);
  }
  networkGeo.setAttribute("position",new THREE.Float32BufferAttribute(networkPositions,3));
  const networkMat=new THREE.LineBasicMaterial({
    color:0xcbe8ff,
    transparent:true,
    opacity:.085,
    blending:THREE.AdditiveBlending,
    depthWrite:false
  });
  const networkLines=new THREE.LineSegments(networkGeo,networkMat);
  root.add(networkLines);

  const headlineRoot=new THREE.Group();
  root.add(headlineRoot);
  const headlines=cases.map((c,ci)=>{
    const group=new THREE.Group();
    const anchor=largeTriangles[(ci*5)%largeTriangles.length];

    const heroTex=headlineTexture(c.title,c.palette[0],c.palette[1]||c.palette[0]);
    const heroMat=new THREE.MeshBasicMaterial({
      map:heroTex,
      transparent:true,
      opacity:0,
      side:THREE.DoubleSide,
      depthWrite:false,
      blending:THREE.AdditiveBlending
    });
    const hero=new THREE.Mesh(new THREE.PlaneGeometry(2.8,.66),heroMat);
    hero.position.copy(anchor.position).add(new THREE.Vector3(0,.58,.34));
    hero.rotation.copy(anchor.rotation);
    hero.userData.base=hero.position.clone();
    group.add(hero);

    const edgeTex=edgeHeadlineTexture(c.title,c.palette[0]);
    const edgeMat=new THREE.MeshBasicMaterial({
      map:edgeTex,
      transparent:true,
      opacity:0,
      side:THREE.DoubleSide,
      depthWrite:false,
      blending:THREE.AdditiveBlending
    });

    const edgeScale=anchor.userData.baseScale*.9;
    const edgePlane=new THREE.Mesh(new THREE.PlaneGeometry(edgeScale*1.45,.18),edgeMat);
    edgePlane.position.copy(anchor.position);
    edgePlane.rotation.copy(anchor.rotation);
    edgePlane.position.y+=.08;
    edgePlane.position.z+=.03;
    edgePlane.userData.base=edgePlane.position.clone();
    edgePlane.userData.scroll=0;
    group.add(edgePlane);

    headlineRoot.add(group);
    return group;
  });

  scene.add(new THREE.AmbientLight(0xffffff,.18));
  const key=new THREE.PointLight(0x74f7ff,16,30);
  const fill=new THREE.PointLight(0xff4ecf,12,28);
  const back=new THREE.PointLight(0x7b69ff,9,34);
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
  const motionRaw=cameraMotion.motion||0;
  const motion=motionRaw*motionRaw*(3-2*motionRaw);
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

  root.rotation.x=THREE.MathUtils.lerp(
    root.rotation.x,
    pointer.y*.14+state.tiltBias*.12-humanY*P.reaction.root.cameraY,
    .04
  );
  root.rotation.y=THREE.MathUtils.lerp(
    root.rotation.y,
    pointer.x*.18+state.rotationBias*.035+humanX*P.reaction.root.cameraX,
    .04
  );
  root.rotation.z=Math.sin(time*.13)*.025+humanVX*P.reaction.root.velocityRoll;

  reflectiveMat.uniforms.uTime.value=time;
  reflectiveMat.uniforms.uMotion.value=motion;
  reflectiveMat.uniforms.uGlitch.value=state.glitch+motion*.25;
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
    const scaleBase=tri.userData.baseScale;
    const depth=tri.userData.depthBand;

    const proximity=Math.max(
      0,
      1-Math.hypot(base.x-humanCX*largeRadius,base.y-humanCY*P.geometry.large.ySpread)/
        P.reaction.large.influenceRadius
    );
    const humanPush=motion*proximity;
    tri.position.x=base.x+Math.sin(time*.18+i)*.04+humanX*P.reaction.large.xPush*proximity;
    tri.position.y=base.y+Math.cos(time*.16+i*.7)*.04+humanY*P.reaction.large.yPush*proximity;
    tri.position.z=base.z+Math.sin(time*.12+i*.35)*(.05+.02*depth)+humanPush*P.reaction.large.zPush;

    tri.rotation.x=tri.userData.baseRot.x+Math.sin(time*.11+i)*.04-humanVY*P.reaction.large.velocityTilt*proximity;
    tri.rotation.y=tri.userData.baseRot.y+Math.cos(time*.09+i)*.04+humanVX*P.reaction.large.velocityTilt*proximity;

    const pulse=1+motion*P.reaction.large.scalePulse*proximity+Math.sin(time*.35+i)*.01;
    tri.scale.setScalar(scaleBase*pulse);
  });

  largeWireRings.forEach(rings=>{
    rings.forEach(line=>{
      const parent=line.userData.parent;
      line.position.copy(parent.position);
      line.rotation.copy(parent.rotation);
      line.scale.copy(parent.scale).multiplyScalar(1/parent.userData.baseScale);
    });
  });

  const temp=new THREE.Object3D();
  smallSeeds.forEach((s,i)=>{
    temp.position.copy(s.position);
    const sx=s.position.x-humanCX*4.1;
    const sy=s.position.y-humanCY*3.0;
    const near=Math.max(0,1-Math.hypot(sx,sy)/P.reaction.small.influenceRadius);
    temp.position.x+=humanX*near*P.reaction.small.xPush;
    temp.position.y+=humanY*near*P.reaction.small.yPush;
    temp.position.z+=Math.sin(time*s.speed+i)*.08+motion*near*P.reaction.small.zPush;
    temp.rotation.set(
      s.rotation.x+time*.05*s.speed-humanVY*P.reaction.small.velocityTilt*near,
      s.rotation.y-time*.04*s.speed+humanVX*P.reaction.small.velocityTilt*near,
      s.rotation.z+Math.sin(time*.18+i)*.06
    );
    temp.scale.setScalar(
      s.scale*(1+Math.sin(time*.4+i)*.035*state.density+motion*near*P.reaction.small.scalePulse)
    );
    temp.updateMatrix();
    smallMesh.setMatrixAt(i,temp.matrix);
  });
  smallMesh.instanceMatrix.needsUpdate=true;

  tetraMeshes.forEach((tetra,i)=>{
    const base=tetra.userData.basePos;
    const dx=base.x-humanCX*4.5;
    const dy=base.y-humanCY*3.2;
    const near=Math.max(0,1-Math.hypot(dx,dy)/P.reaction.tetra.influenceRadius);
    tetra.position.x=base.x+humanX*near*P.reaction.tetra.xPush;
    tetra.position.y=base.y+humanY*near*P.reaction.tetra.yPush;
    tetra.position.z=base.z+Math.sin(time*.24+i)*.12+motion*near*P.reaction.tetra.zPush;
    tetra.rotation.x=tetra.userData.baseRot.x+time*.03-humanVY*P.reaction.tetra.velocityTilt*near;
    tetra.rotation.y=tetra.userData.baseRot.y-time*.025+humanVX*P.reaction.tetra.velocityTilt*near;
  });

  saw.rotation.y=Math.sin(time*.08)*.08;
  saw.position.x=Math.sin(time*.14)*.18;
  sawMat.opacity=.08+state.moire*.08+motion*.05;
  sawMat.color.copy(new THREE.Color().lerpColors(state.palette[0],new THREE.Color(0xffffff),.78));

  haloGroups.forEach((g,i)=>{
    g.rotation.z+=(i%2?1:-1)*(.00055+i*.00022)+(humanVX-humanVY)*P.reaction.halo.velocitySpin*(i+1);
    g.position.x=Math.sin(time*.08+i)*.14*(i+1)+humanX*P.reaction.halo.xPush*(i+1);
    g.position.y=Math.cos(time*.07+i*.7)*.08*(i+1)+humanY*P.reaction.halo.yPush*(i+1);
    const depthPulse=1+motion*P.reaction.halo.scalePulse*(i+1);
    g.scale.setScalar(
      (P.geometry.halo.baseScale+i*P.geometry.halo.scaleStep)*depthPulse
    );
  });

  networkMat.opacity=.045+state.density*.055+motion*.12;
  networkMat.color.copy(state.palette[0]).lerp(new THREE.Color(0xffffff),.72);

  headlines.forEach((g,gi)=>{
    const active=gi===activeCase;
    g.children.forEach((p,i)=>{
      const targetOpacity=active?(i===0?.94:.7):.025;
      p.material.opacity=THREE.MathUtils.lerp(p.material.opacity,targetOpacity,.06);
      p.position.copy(p.userData.base);
      p.position.y+=Math.sin(time*.8+i+gi)*.02;
      if(i===1&&p.material.map){
        p.material.map.offset.x=(time*.035)%1;
        p.material.map.needsUpdate=true;
      }
    });
  });

  key.color.copy(state.palette[0]);
  fill.color.copy(state.palette[1]||state.palette[0]);
  back.color.copy(state.palette[2]||state.palette[1]||state.palette[0]);

  key.position.x=5+humanX*3.5;
  key.position.y=3.5+humanY*2.4;
  fill.position.x=-5-humanX*2.2;
  fill.position.y=-3-humanY*1.8;

  key.intensity=9+state.intensity*13+motion*14;
  fill.intensity=6+state.glitch*10+motion*7;
  back.intensity=5+state.moire*5+motion*5;
}