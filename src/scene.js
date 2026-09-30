import * as THREE from "three";

function triangleGeometry(){
  const h=Math.sqrt(3)/2;
  const geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.Float32BufferAttribute([
     0, h*2/3, 0,
    -0.5,-h/3,0,
     0.5,-h/3,0
  ],3));
  geo.setAttribute("uv",new THREE.Float32BufferAttribute([
    0.5,1,
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
  const p=[
    new THREE.Vector3(0,h*2/3,0),
    new THREE.Vector3(-.5,-h/3,0),
    new THREE.Vector3(.5,-h/3,0)
  ].map(v=>v.multiplyScalar(scale));
  return new THREE.BufferGeometry().setFromPoints([p[0],p[1],p[1],p[2],p[2],p[0]]);
}

function headlineTexture(text,a,b){
  const c=document.createElement("canvas");c.width=1024;c.height=256;const x=c.getContext("2d");
  x.clearRect(0,0,c.width,c.height);
  const g=x.createLinearGradient(0,0,c.width,0);g.addColorStop(0,a);g.addColorStop(.55,"#ffffff");g.addColorStop(1,b);
  x.font="700 112px Inter,Arial,sans-serif";x.textBaseline="middle";x.fillStyle=g;x.shadowColor=a;x.shadowBlur=20;x.fillText(text.toUpperCase(),24,128);
  x.shadowBlur=0;x.font="600 28px ui-monospace,monospace";x.fillStyle="rgba(255,255,255,.48)";
  x.fillText(text.toUpperCase().replace(/\s+/g," / "),30,42);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

function seeded(i,a=12.9898,b=78.233){
  return Math.abs(Math.sin(i*a+b)*43758.5453)%1;
}

function setObjectFromSeed(object,i,rMin,rMax,zMin,zMax){
  const a=seeded(i,17.2,4.1)*Math.PI*2;
  const r=THREE.MathUtils.lerp(rMin,rMax,seeded(i,9.7,1.3));
  const y=(seeded(i,3.1,8.9)-.5)*5.2;
  object.position.set(Math.cos(a)*r,y,THREE.MathUtils.lerp(zMin,zMax,seeded(i,15.4,2.2))+Math.sin(a)*r*.22);
  object.rotation.set(
    (seeded(i,2.7,6.1)-.5)*Math.PI,
    (seeded(i,4.9,3.3)-.5)*Math.PI,
    (seeded(i,8.1,1.7)-.5)*Math.PI
  );
}

export function createVisualScene(stage,cases,videoTexture){
  const scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x030306,.035);

  const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.1,120);
  camera.position.set(0,0,8.2);

  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.25;
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
        vec3 a3=smoothstep(vec3(0.),d*1.5,vBary);
        return 1.-min(min(a3.x,a3.y),a3.z);
      }
      float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}

      void main(){
        vec2 uv=vUv;
        float band=floor(uv.y*34.);
        float glitch=step(.88,hash(vec2(band,floor(uTime*7.))))*uGlitch;
        uv.x+=(hash(vec2(band,9.+floor(uTime*9.)))-.5)*.075*glitch;
        uv=clamp(uv,0.,1.);

        vec2 pixel=floor(uv*vec2(54.,36.))/vec2(54.,36.);
        vec3 cam=texture2D(uVideo,pixel).rgb;
        float l=dot(cam,vec3(.299,.587,.114));
        cam=mix(vec3(l),cam,.42);

        vec3 N=normalize(vNormalW);
        vec3 V=normalize(cameraPosition-vWorld);
        float fres=pow(1.-max(dot(N,V),0.),2.2);
        vec3 iri=.5+.5*cos(6.28318*(fres+vec3(0.,.33,.67))+vec3(0.,1.4,2.1));
        iri=mix(uA,uB,iri.r);
        iri=mix(iri,uC,.35+fres*.45);

        float e=edgeFactor();
        vec3 col=cam*(.2+fres*.18);
        col+=iri*(e*1.8+fres*.28);
        col+=iri*uMotion*.18;
        col*=.72;
        gl_FragColor=vec4(col,.92);
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
        float a=sin((p.x+p.y*.21)*(46.+uMoire*16.));
        float b=sin((p.y-p.x*.17)*(51.+uMoire*14.)+uTime*.14);
        float c=sin(length(p)*71.-uTime*.1);
        float moire=step(0.,a*b+c*.18);
        float zebra=step(0.,sin((p.x*.62+p.y)*(38.+uZebra*22.)+uTime*.08));
        float bw=mix(moire,zebra,.42);

        vec3 N=normalize(vNormalW),V=normalize(cameraPosition-vWorld);
        float fres=pow(1.-max(dot(N,V),0.),2.45);
        vec3 iri=.5+.5*cos(6.28318*(fres+vec3(0.,.33,.67))+vec3(0.,1.5,2.35));
        iri=mix(uA,uB,iri.r);iri=mix(iri,uC,.3+fres*.5);

        float e=edgeFactor();
        vec3 col=mix(vec3(.01),vec3(.95),bw);
        col*=.35;
        col+=iri*(e*1.65+fres*.17);
        float pulse=step(.975,sin(vWorld.y*19.+uTime*17.))*uGlitch;
        col+=iri*pulse*.32;
        gl_FragColor=vec4(col,.84);
      }`
  });

  const largeGroup=new THREE.Group();
  root.add(largeGroup);
  const largeTriangles=[];
  const largeCount=11;
  for(let i=0;i<largeCount;i++){
    const mesh=new THREE.Mesh(triGeo,reflectiveMat);
    const s=THREE.MathUtils.lerp(1.2,2.65,seeded(i,5.7,8.4));
    mesh.scale.setScalar(s);
    setObjectFromSeed(mesh,i+10,1.2,4.4,-3.2,2.8);
    mesh.userData.basePos=mesh.position.clone();
    mesh.userData.baseRot=mesh.rotation.clone();
    mesh.userData.seed=i;
    largeTriangles.push(mesh);
    largeGroup.add(mesh);

    for(let n=1;n<=3;n++){
      const lm=new THREE.LineBasicMaterial({
        color:n%2?0xffffff:0x74f7ff,
        transparent:true,
        opacity:.12+n*.035,
        blending:THREE.AdditiveBlending,
        depthWrite:false
      });
      const line=new THREE.LineSegments(triangleLineGeometry(s*(1-n*.16)),lm);
      line.position.copy(mesh.position);
      line.rotation.copy(mesh.rotation);
      line.position.z+=.008*n;
      line.userData.parentIndex=i;
      line.userData.ring=n;
      largeGroup.add(line);
    }
  }

  const smallCount=260;
  const smallMesh=new THREE.InstancedMesh(triGeo,moireMat,smallCount);
  smallMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const temp=new THREE.Object3D();
  const smallSeeds=[];
  for(let i=0;i<smallCount;i++){
    setObjectFromSeed(temp,i+200,1.8,7.2,-7.5,4.5);
    const s=THREE.MathUtils.lerp(.08,.52,Math.pow(seeded(i,11.1,2.9),1.8));
    temp.scale.setScalar(s);
    temp.updateMatrix();
    smallMesh.setMatrixAt(i,temp.matrix);
    smallSeeds.push({
      position:temp.position.clone(),
      rotation:temp.rotation.clone(),
      scale:s,
      speed:.15+seeded(i,7.3,6.8)*.55
    });
  }
  root.add(smallMesh);

  const sawGeo=new THREE.BufferGeometry();
  const sawPositions=[];
  for(let row=0;row<7;row++){
    const z=-5+row*1.55;
    const y=-2.2+row*.72;
    for(let i=0;i<34;i++){
      const x=-5.2+i*.31;
      const s=.16+(row%3)*.025;
      const h=Math.sqrt(3)/2*s;
      const flip=i%2===0?1:-1;
      const p0=[x,y+h*flip,z];
      const p1=[x-s*.5,y-h*.35*flip,z];
      const p2=[x+s*.5,y-h*.35*flip,z];
      sawPositions.push(...p0,...p1,...p1,...p2,...p2,...p0);
    }
  }
  sawGeo.setAttribute("position",new THREE.Float32BufferAttribute(sawPositions,3));
  const sawMat=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.12,blending:THREE.AdditiveBlending,depthWrite:false});
  const saw=new THREE.LineSegments(sawGeo,sawMat);
  saw.rotation.z=-.18;
  root.add(saw);

  const haloGroups=[];
  for(let d=0;d<4;d++){
    const hg=new THREE.Group();
    hg.position.z=-4.5-d*3.5;
    hg.scale.setScalar(1.35+d*.42);
    hg.rotation.z=(d%2?1:-1)*(.08+d*.025);

    const count=50;
    const haloMesh=new THREE.InstancedMesh(triGeo,moireMat,count);
    const o=new THREE.Object3D();
    for(let i=0;i<count;i++){
      setObjectFromSeed(o,800+d*100+i,1.6,5.8,-1.2,1.2);
      o.position.z=0;
      o.scale.setScalar(.06+seeded(i+d*17,13.1,1.2)*.22);
      o.updateMatrix();
      haloMesh.setMatrixAt(i,o.matrix);
    }
    hg.add(haloMesh);
    root.add(hg);
    haloGroups.push(hg);
  }

  const headlineRoot=new THREE.Group();
  root.add(headlineRoot);
  const headlines=cases.map((c,ci)=>{
    const group=new THREE.Group();
    [c.title,`${c.location.city} ${c.year}`,c.tags.join(" / ")].forEach((txt,i)=>{
      const tex=headlineTexture(txt,c.palette[0],c.palette[1]||c.palette[0]);
      const hm=new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
      const p=new THREE.Mesh(new THREE.PlaneGeometry(2.6,.62),hm);
      const anchor=largeTriangles[(ci*3+i)%largeTriangles.length];
      p.position.copy(anchor.position).add(new THREE.Vector3(0,.55+i*.22,.28+i*.04));
      p.rotation.copy(anchor.rotation);
      p.userData.base=p.position.clone();
      group.add(p);
    });
    headlineRoot.add(group);
    return group;
  });

  scene.add(new THREE.AmbientLight(0xffffff,.18));
  const key=new THREE.PointLight(0x74f7ff,14,30);
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
    largeGroup,largeTriangles,
    smallMesh,smallSeeds,
    saw,sawMat,haloGroups,
    headlines,key,fill,back,resize
  };
}

export function updateVisualScene(v,time,state,pointer,motion,activeCase){
  const {
    root,reflectiveMat,moireMat,
    largeGroup,largeTriangles,
    smallMesh,smallSeeds,
    saw,sawMat,haloGroups,
    headlines,key,fill,back
  }=v;

  root.rotation.x=THREE.MathUtils.lerp(root.rotation.x,pointer.y*.18+state.tiltBias*.12,.035);
  root.rotation.y=THREE.MathUtils.lerp(root.rotation.y,pointer.x*.24+state.rotationBias*.035,.035);
  root.rotation.z=Math.sin(time*.13)*.025;

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
    const b=tri.userData.basePos;
    tri.position.x=b.x+Math.sin(time*.27+i)*.08*state.distortion;
    tri.position.y=b.y+Math.cos(time*.22+i*.7)*.07*state.morph;
    tri.position.z=b.z+Math.sin(time*.19+i*.4)*.12;
    tri.rotation.x=tri.userData.baseRot.x+Math.sin(time*.16+i)*.08;
    tri.rotation.y=tri.userData.baseRot.y+Math.cos(time*.14+i*.6)*.08;
    const pulse=1+motion*.07+Math.sin(time*.38+i)*.015;
    tri.scale.multiplyScalar(THREE.MathUtils.lerp(1,pulse,.05));
  });

  const temp=new THREE.Object3D();
  smallSeeds.forEach((s,i)=>{
    temp.position.copy(s.position);
    temp.position.z+=Math.sin(time*s.speed+i)*.08;
    temp.rotation.set(
      s.rotation.x+time*.05*s.speed,
      s.rotation.y-time*.04*s.speed,
      s.rotation.z+Math.sin(time*.18+i)*.06
    );
    temp.scale.setScalar(s.scale*(1+Math.sin(time*.4+i)*.035*state.density));
    temp.updateMatrix();
    smallMesh.setMatrixAt(i,temp.matrix);
  });
  smallMesh.instanceMatrix.needsUpdate=true;

  saw.rotation.y=Math.sin(time*.08)*.08;
  saw.position.x=Math.sin(time*.14)*.18;
  sawMat.opacity=.08+state.moire*.08+motion*.05;
  sawMat.color.copy(new THREE.Color().lerpColors(state.palette[0],new THREE.Color(0xffffff),.78));

  haloGroups.forEach((g,i)=>{
    g.rotation.z+=(i%2?1:-1)*(.0007+i*.0003);
    g.position.x=Math.sin(time*.08+i)*.18*(i+1);
    g.position.y=Math.cos(time*.07+i*.7)*.1*(i+1);
  });

  headlines.forEach((g,gi)=>{
    const active=gi===activeCase;
    g.children.forEach((p,i)=>{
      p.material.opacity=THREE.MathUtils.lerp(p.material.opacity,active?(i===0?.92:.52):.035,.06);
      p.position.copy(p.userData.base);
      p.position.y+=Math.sin(time*.8+i+gi)*.03;
    });
  });

  key.color.copy(state.palette[0]);
  fill.color.copy(state.palette[1]||state.palette[0]);
  back.color.copy(state.palette[2]||state.palette[1]||state.palette[0]);
  key.intensity=8+state.intensity*12+motion*6;
  fill.intensity=6+state.glitch*9;
  back.intensity=5+state.moire*5;
}
