import * as THREE from "three";
import { EffectComposer } from "https://unpkg.com/three@0.164.1/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://unpkg.com/three@0.164.1/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://unpkg.com/three@0.164.1/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "https://unpkg.com/three@0.164.1/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "https://unpkg.com/three@0.164.1/examples/jsm/postprocessing/OutputPass.js";
import { VISUAL_PARAMS as P } from "./visual-config.js";

let ACTIVE_SEED=P.generation.seed;

function rand(a,b=1){
  return Math.abs(
    Math.sin((a+ACTIVE_SEED)*12.9898+(b+ACTIVE_SEED*.017)*78.233)*43758.5453
  )%1;
}

function pushTriangle(targets,a,b,c,phase,facet){
  const {positions,uvs,bary,phases,facets}=targets;
  const verts=[a,b,c];
  const triUvs=[[0,0],[1,0],[.5,1]];
  const triBary=[[1,0,0],[0,1,0],[0,0,1]];

  for(let i=0;i<3;i++){
    positions.push(verts[i].x,verts[i].y,verts[i].z);
    uvs.push(triUvs[i][0],triUvs[i][1]);
    bary.push(...triBary[i]);
    phases.push(phase);
    facets.push(facet);
  }
}

function createRibbonGeometry(){
  const C=P.composition.band;
  const n=C.segments;
  const inner=[];
  const outer=[];
  const centers=[];

  for(let i=0;i<n;i++){
    const t=i/n;
    const a=t*Math.PI*2;

    const radialNoise=
      Math.sin(a*2.15+.5)*C.radiusNoise*.16+
      Math.sin(a*4.7+1.6)*C.radiusNoise*.09+
      (rand(i,1.7)-.5)*C.radiusNoise*.13;

    const radius=C.radius*(1+radialNoise);
    const center=new THREE.Vector3(
      Math.cos(a)*radius,
      Math.sin(a)*radius*C.yScale+
        Math.sin(a*2.8+.7)*.16,
      Math.sin(a*2.05+.4)*C.depth*.58+
        Math.cos(a*3.65+1.1)*C.depth*.22
    );
    centers.push(center.clone());

    const radial=new THREE.Vector3(
      Math.cos(a),
      Math.sin(a)*C.yScale,
      0
    ).normalize();

    const width=C.width*(
      1+
      Math.sin(a*3.15+1.2)*C.widthNoise*.22+
      (rand(i,2.9)-.5)*C.widthNoise*.28
    );

    const foldA=
      Math.sin(a*4.2+.6)*C.fold+
      (rand(i,3.8)-.5)*C.fold*.28;
    const foldB=
      Math.cos(a*3.35+1.7)*C.fold+
      (rand(i,4.6)-.5)*C.fold*.28;

    const twist=Math.sin(a*2.4+.8)*C.twist;
    const tangent=new THREE.Vector3(
      -Math.sin(a),
      Math.cos(a)*C.yScale,
      Math.cos(a*2.05+.4)*C.depth*.52
    ).normalize();

    const binormal=new THREE.Vector3().crossVectors(tangent,radial).normalize();
    const widthDir=radial.clone()
      .multiplyScalar(Math.cos(twist))
      .addScaledVector(binormal,Math.sin(twist))
      .normalize();

    outer.push(
      center.clone()
        .addScaledVector(widthDir,width*.5)
        .addScaledVector(binormal,foldA*.34)
    );

    inner.push(
      center.clone()
        .addScaledVector(widthDir,-width*.5)
        .addScaledVector(binormal,foldB*.34)
    );
  }

  const data={
    positions:[],
    uvs:[],
    bary:[],
    phases:[],
    facets:[]
  };

  for(let i=0;i<n;i++){
    const j=(i+1)%n;
    const phase=i/n;
    const facetA=.28+rand(i,7.1)*.72;
    const facetB=.28+rand(i,8.3)*.72;

    if(i%2===0){
      pushTriangle(data,outer[i],inner[i],outer[j],phase,facetA);
      pushTriangle(data,outer[j],inner[i],inner[j],phase,facetB);
    }else{
      pushTriangle(data,outer[i],inner[i],inner[j],phase,facetA);
      pushTriangle(data,outer[i],inner[j],outer[j],phase,facetB);
    }
  }

  const geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.Float32BufferAttribute(data.positions,3));
  geo.setAttribute("uv",new THREE.Float32BufferAttribute(data.uvs,2));
  geo.setAttribute("bary",new THREE.Float32BufferAttribute(data.bary,3));
  geo.setAttribute("phase",new THREE.Float32BufferAttribute(data.phases,1));
  geo.setAttribute("facet",new THREE.Float32BufferAttribute(data.facets,1));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return {geometry:geo,centers};
}

function createBandMaterial(reflectionTexture){
  return new THREE.ShaderMaterial({
    side:THREE.DoubleSide,
    transparent:true,
    depthWrite:false,
    uniforms:{
      uTime:{value:0},
      uMotion:{value:0},
      uHuman:{value:new THREE.Vector2()},
      uA:{value:new THREE.Color("#74f7ff")},
      uB:{value:new THREE.Color("#ff4ecf")},
      uC:{value:new THREE.Color("#7b69ff")},
      uOpacity:{value:P.material.band.opacity},
      uBrightness:{value:P.material.band.brightness},
      uEdgeGlow:{value:P.material.band.edgeGlow},
      uFresnelGlow:{value:P.material.band.fresnelGlow},
      uWhiteSpecular:{value:P.material.band.whiteSpecular},
      uSpeed:{value:P.material.band.speed},
      uPearlStrength:{value:P.material.band.pearlStrength},
      uFilmThickness:{value:P.material.band.filmThickness},
      uWhiteness:{value:P.material.band.whiteness},
      uSpectralSaturation:{value:P.material.band.spectralSaturation},
      uFocusPhase:{value:0},
      uFocusWidth:{value:P.material.band.focusWidth},
      uFocusColorBoost:{value:P.material.band.focusColorBoost},
      uFocusReflection:{value:P.material.band.focusReflection},
      uReflectionMap:{value:reflectionTexture||null},
      uReflectionActive:{value:0},
      uDepth:{value:1},
      uCaseTwist:{value:0},
      uIridescence:{value:1}
    },
    vertexShader:`
      attribute vec3 bary;
      attribute float phase;
      attribute float facet;

      uniform float uTime,uMotion,uDepth,uCaseTwist;
      uniform vec2 uHuman;

      varying vec3 vBary;
      varying vec3 vWorld;
      varying vec3 vNormalW;
      varying float vPhase;
      varying float vFacet;

      void main(){
        vBary=bary;
        vPhase=phase;
        vFacet=facet;

        vec3 p=position;
        p.z*=uDepth;

        float twist=(phase-.5)*uCaseTwist;
        float ct=cos(twist);
        float st=sin(twist);
        p.xy=mat2(ct,-st,st,ct)*p.xy;

        float wave=
          sin(phase*31.4159+uTime*.34)*
          (.012+uMotion*.055);

        p+=normal*wave;
        p.z+=(p.x*uHuman.x+p.y*uHuman.y)*.014;

        vec4 world=modelMatrix*vec4(p,1.);
        vWorld=world.xyz;
        vNormalW=normalize(mat3(modelMatrix)*normal);
        gl_Position=projectionMatrix*viewMatrix*world;
      }
    `,
    fragmentShader:`
      uniform float uTime,uMotion,uOpacity,uBrightness,uEdgeGlow;
      uniform float uFresnelGlow,uWhiteSpecular,uSpeed,uIridescence;
      uniform float uPearlStrength,uFilmThickness,uWhiteness,uSpectralSaturation;
      uniform float uFocusPhase,uFocusWidth,uFocusColorBoost,uFocusReflection;
      uniform float uReflectionActive;
      uniform sampler2D uReflectionMap;
      uniform vec3 uA,uB,uC;

      varying vec3 vBary;
      varying vec3 vWorld;
      varying vec3 vNormalW;
      varying float vPhase;
      varying float vFacet;

      float edgeFactor(){
        vec3 d=fwidth(vBary);
        vec3 a3=smoothstep(vec3(0.),d*1.25,vBary);
        return 1.-min(min(a3.x,a3.y),a3.z);
      }

      float luma(vec3 c){
        return dot(c,vec3(.299,.587,.114));
      }

      float circularDistance(float a,float b){
        float d=abs(a-b);
        return min(d,1.-d);
      }

      vec3 thinFilmPearl(float cosTheta,float phaseOffset){
        float grazing=1.-clamp(cosTheta,0.,1.);
        float optical=uFilmThickness*(.72+grazing*2.45);
        vec3 wavelengths=vec3(.64,.53,.46);

        vec3 phase=
          optical*10.8/wavelengths+
          phaseOffset+
          vec3(.0,.72,1.46);

        vec3 first=.5+.5*cos(phase);
        vec3 second=.5+.5*cos(phase*.58+1.15);
        vec3 spectral=mix(first,second,.34);

        float y=luma(spectral);
        return mix(vec3(y),spectral,uSpectralSaturation);
      }

      void main(){
        vec3 N=normalize(vNormalW);
        vec3 V=normalize(cameraPosition-vWorld);
        float cosTheta=abs(dot(N,V));
        float fres=pow(1.-cosTheta,1.38);
        float edge=edgeFactor();
        float focusDistance=circularDistance(vPhase,uFocusPhase);
        float focusMask=1.-smoothstep(0.,max(.001,uFocusWidth),focusDistance);
        float focusCore=1.-smoothstep(0.,max(.001,uFocusWidth*.46),focusDistance);

        float phaseOffset=
          vPhase*2.2+
          sin(vWorld.x*.38+vWorld.y*.31+uTime*uSpeed)*.10;

        vec3 pearl=thinFilmPearl(cosTheta,phaseOffset);

        // Almost-white translucent mother-of-pearl at normal incidence.
        vec3 ivory=mix(
          vec3(.88,.91,.94),
          vec3(1.0,.995,.985),
          uWhiteness
        );

        float pearlMask=
          clamp(
            (.10+fres*.78+edge*.18)*
            uPearlStrength*
            uIridescence,
            0.,
            1.
          );

        vec3 col=mix(ivory,pearl,pearlMask*.62);

        // Facets stay softly white rather than turning into neon patches.
        float facetShade=.88+vFacet*.16;
        col*=facetShade;

        // Case palette stays subtle globally, but blooms into color around the active viewpoint.
        vec3 caseTint=mix(uA,uB,.5+.5*sin(vPhase*6.28318));
        caseTint=mix(caseTint,uC,.24);
        col=mix(col,col*caseTint,pearlMask*.07);

        vec3 focusIris=mix(pearl,caseTint,.38);
        float focusColor=clamp(focusMask*uFocusColorBoost,0.,1.5);
        col=mix(col,focusIris,clamp(focusColor*.34,0.,.62));
        col+=pearl*focusColor*.14;

        // Reflection coordinates are derived from the view vector, so the live camera shifts with viewpoint.
        vec3 reflectedDir=reflect(-V,N);
        vec2 reflectionUv=clamp(
          vec2(.5+reflectedDir.x*.42,.5-reflectedDir.y*.42),
          vec2(.02),
          vec2(.98)
        );
        vec3 reflected=texture2D(uReflectionMap,reflectionUv).rgb;
        float reflectionMask=
          focusMask*
          uFocusReflection*
          uReflectionActive*
          (.32+fres*.68);
        col=mix(
          col,
          reflected*1.08+focusIris*.16+vec3(.06),
          clamp(reflectionMask*.62,0.,.76)
        );

        float whiteSpec=pow(max(cosTheta,0.),18.)*uWhiteSpecular;
        whiteSpec+=
          pow(max(cosTheta,0.),10.)*
          focusCore*
          uWhiteSpecular*.42;
        col+=vec3(1.)*whiteSpec;
        col+=vec3(1.)*edge*uEdgeGlow*.28;
        col+=pearl*fres*uFresnelGlow*.22;

        col*=uBrightness+uMotion*.035;

        // Transparent white in the front, denser pearl at grazing angles.
        float alpha=
          uOpacity*
          (.62+fres*.32+edge*.06);

        gl_FragColor=vec4(col,clamp(alpha,0.,.94));
      }
    `
  });
}

function createWireMaterial(opacity=P.material.wire.opacity){
  return new THREE.ShaderMaterial({
    transparent:true,
    depthWrite:false,
    blending:THREE.AdditiveBlending,
    uniforms:{
      uTime:{value:0},
      uMotion:{value:0},
      uA:{value:new THREE.Color("#74f7ff")},
      uB:{value:new THREE.Color("#ff4ecf")},
      uC:{value:new THREE.Color("#7b69ff")},
      uOpacity:{value:opacity},
      uGlow:{value:P.material.wire.glow},
      uSpeed:{value:P.material.wire.speed}
    },
    vertexShader:`
      uniform float uTime,uMotion;
      varying vec3 vLocal;

      void main(){
        vec3 p=position;
        float pulse=sin((p.x+p.y+p.z)*1.7+uTime*.35)*uMotion*.025;
        p+=normalize(p+vec3(.001))*pulse;
        vLocal=p;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
      }
    `,
    fragmentShader:`
      uniform float uTime,uOpacity,uGlow,uSpeed;
      uniform vec3 uA,uB,uC;
      varying vec3 vLocal;

      void main(){
        float t=.5+.5*sin(
          vLocal.x*.7+vLocal.y*.9-vLocal.z*.5+uTime*uSpeed
        );
        vec3 col=mix(uA,uB,t);
        col=mix(col,uC,.22+.34*sin(t*3.14159));
        col=mix(col,vec3(1.),.20);
        gl_FragColor=vec4(col*uGlow,uOpacity);
      }
    `
  });
}

function createBandWireMaterial(){
  return new THREE.ShaderMaterial({
    transparent:true,
    depthWrite:false,
    blending:THREE.AdditiveBlending,
    uniforms:{
      uTime:{value:0},
      uMotion:{value:0},
      uA:{value:new THREE.Color("#74f7ff")},
      uB:{value:new THREE.Color("#ff4ecf")},
      uC:{value:new THREE.Color("#7b69ff")},
      uOpacity:{value:Math.min(1,P.material.wire.opacity+.18)},
      uGlow:{value:P.material.wire.glow},
      uSpeed:{value:P.material.wire.speed},
      uDepth:{value:1},
      uCaseTwist:{value:0},
      uHuman:{value:new THREE.Vector2()}
    },
    vertexShader:`
      uniform float uTime,uMotion,uDepth,uCaseTwist;
      uniform vec2 uHuman;
      varying vec3 vLocal;

      void main(){
        vec3 p=position;
        p.z*=uDepth;

        float phase=fract(atan(p.y,p.x)/6.2831853+1.0);
        float twist=(phase-.5)*uCaseTwist;
        float ct=cos(twist);
        float st=sin(twist);
        p.xy=mat2(ct,-st,st,ct)*p.xy;

        float pulse=sin(phase*31.4159+uTime*.42)*(.018+uMotion*.075);
        p+=normalize(p+vec3(.001))*pulse*.35;
        p.z+=(p.x*uHuman.x+p.y*uHuman.y)*.018;

        vLocal=p;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
      }
    `,
    fragmentShader:`
      uniform float uTime,uOpacity,uGlow,uSpeed;
      uniform vec3 uA,uB,uC;
      varying vec3 vLocal;

      void main(){
        float t=.5+.5*sin(
          vLocal.x*.75+vLocal.y*.82-vLocal.z*.55+uTime*uSpeed
        );
        vec3 col=mix(uA,uB,t);
        col=mix(col,uC,.22+.34*sin(t*3.14159));
        col=mix(col,vec3(1.),.28);
        gl_FragColor=vec4(col*uGlow,uOpacity);
      }
    `
  });
}

function createPointMaterial(){
  return new THREE.ShaderMaterial({
    transparent:true,
    depthWrite:false,
    blending:THREE.AdditiveBlending,
    uniforms:{
      uA:{value:new THREE.Color("#ffffff")},
      uB:{value:new THREE.Color("#74f7ff")},
      uOpacity:{value:P.material.points.opacity},
      uSize:{value:P.material.points.size},
      uPixelRatio:{value:Math.min(devicePixelRatio,2)}
    },
    vertexShader:`
      uniform float uSize,uPixelRatio;
      varying float vDepth;

      void main(){
        vec4 mv=modelViewMatrix*vec4(position,1.);
        vDepth=clamp((-mv.z-2.)/12.,0.,1.);
        gl_PointSize=uSize*uPixelRatio*900./max(1.,-mv.z);
        gl_Position=projectionMatrix*mv;
      }
    `,
    fragmentShader:`
      uniform vec3 uA,uB;
      uniform float uOpacity;
      varying float vDepth;

      void main(){
        vec2 p=gl_PointCoord-.5;
        float d=length(p);
        if(d>.5)discard;
        float core=1.-smoothstep(.05,.5,d);
        vec3 col=mix(uA,uB,vDepth);
        gl_FragColor=vec4(col,core*uOpacity);
      }
    `
  });
}

function createTriangleFrameGeometry(){
  const h=Math.sqrt(3)/2;
  const a=new THREE.Vector3(0,h*2/3,0);
  const b=new THREE.Vector3(-.5,-h/3,0);
  const c=new THREE.Vector3(.5,-h/3,0);

  const positions=[
    a.x,a.y,a.z,b.x,b.y,b.z,
    b.x,b.y,b.z,c.x,c.y,c.z,
    c.x,c.y,c.z,a.x,a.y,a.z
  ];

  const geo=new THREE.BufferGeometry();
  geo.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
  return geo;
}

function createWireAura(){
  const C=P.composition.wireAura;
  const group=new THREE.Group();
  const mat=createWireMaterial();
  const networkMat=createWireMaterial(C.networkOpacity);
  const frameGeo=createTriangleFrameGeometry();

  const frames=[];
  const anchors=[];

  for(let i=0;i<C.count;i++){
    const angle=rand(i,20.4)*Math.PI*2;
    const radius=THREE.MathUtils.lerp(C.radiusMin,C.radiusMax,rand(i,21.8));
    const anchor=new THREE.Vector3(
      Math.cos(angle)*radius,
      Math.sin(angle)*radius*C.yScale,
      (rand(i,22.9)-.5)*C.zSpread-.35
    );

    anchors.push(anchor.clone());

    const line=new THREE.LineSegments(frameGeo,mat);
    const size=THREE.MathUtils.lerp(C.sizeMin,C.sizeMax,Math.pow(rand(i,23.7),.75));
    line.position.copy(anchor);
    line.rotation.set(
      (rand(i,24.8)-.5)*1.2,
      (rand(i,25.6)-.5)*1.2,
      rand(i,26.4)*Math.PI*2
    );
    line.scale.setScalar(size);
    line.userData.basePosition=anchor.clone();
    line.userData.baseRotation=line.rotation.clone();
    line.userData.baseScale=size;
    line.userData.phase=rand(i,27.1)*Math.PI*2;
    frames.push(line);
    group.add(line);
  }

  const networkPositions=[];
  for(let i=0;i<anchors.length;i++){
    const j=(i+1)%anchors.length;
    const k=(i+C.networkStride)%anchors.length;

    for(const target of [j,k]){
      if(rand(i,target*.17)<.68){
        networkPositions.push(
          anchors[i].x,anchors[i].y,anchors[i].z,
          anchors[target].x,anchors[target].y,anchors[target].z
        );
      }
    }
  }

  const networkGeo=new THREE.BufferGeometry();
  networkGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(networkPositions,3)
  );

  const network=new THREE.LineSegments(networkGeo,networkMat);
  group.add(network);

  const pointGeo=new THREE.BufferGeometry();
  pointGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      anchors.flatMap(p=>[p.x,p.y,p.z]),
      3
    )
  );

  const pointMat=createPointMaterial();
  const points=new THREE.Points(pointGeo,pointMat);
  group.add(points);

  return {
    group,
    frames,
    anchors,
    mat,
    networkMat,
    pointMat
  };
}

function trackedText(ctx,text,x,y,tracking,align="left"){
  const chars=[...String(text||"")];
  const widths=chars.map(ch=>ctx.measureText(ch).width);
  const total=widths.reduce((a,b)=>a+b,0)+tracking*Math.max(0,chars.length-1);

  let cursor=x;
  if(align==="center")cursor=x-total/2;
  if(align==="right")cursor=x-total;

  for(let i=0;i<chars.length;i++){
    ctx.fillText(chars[i],cursor,y);
    cursor+=widths[i]+tracking;
  }
}

function wrapText(ctx,text,maxWidth){
  const words=String(text||"").split(/\s+/).filter(Boolean);
  const lines=[];
  let line="";

  for(const word of words){
    const test=line?line+" "+word:word;
    if(ctx.measureText(test).width>maxWidth&&line){
      lines.push(line);
      line=word;
    }else{
      line=test;
    }
  }

  if(line)lines.push(line);
  return lines;
}

function createTextTexture({
  eyebrow="",
  title="",
  body="",
  align="left",
  width=1600,
  height=620
}){
  const canvas=document.createElement("canvas");
  canvas.width=width;
  canvas.height=height;
  const ctx=canvas.getContext("2d");

  ctx.clearRect(0,0,width,height);
  const x=align==="left"?64:align==="right"?width-64:width/2;

  ctx.textBaseline="top";
  ctx.fillStyle="rgba(255,255,255,.56)";
  ctx.font='500 28px "Turret Road", Arial, sans-serif';
  trackedText(ctx,eyebrow.toUpperCase(),x,52,8,align);

  ctx.fillStyle="rgba(255,255,255,.95)";
  ctx.font='600 76px "Turret Road", Arial, sans-serif';
  trackedText(ctx,title.toUpperCase(),x,126,5,align);

  ctx.fillStyle="rgba(255,255,255,.66)";
  ctx.font='500 31px "Turret Road", Arial, sans-serif';
  ctx.textAlign=align;

  const bodyLines=wrapText(ctx,body,width-128).slice(0,5);
  bodyLines.forEach((line,i)=>{
    ctx.fillText(line,x,256+i*52);
  });

  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.minFilter=THREE.LinearFilter;
  texture.magFilter=THREE.LinearFilter;
  return texture;
}

function createTextPlane(options,position,scale){
  const texture=createTextTexture(options);
  const material=new THREE.MeshBasicMaterial({
    map:texture,
    transparent:true,
    opacity:P.composition.typography.opacity,
    depthWrite:false,
    depthTest:false,
    toneMapped:false
  });

  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);
  mesh.position.copy(position);
  mesh.scale.copy(scale);
  mesh.renderOrder=300;
  return mesh;
}

function replaceTextPlaneTexture(mesh,options){
  mesh.material.map?.dispose?.();
  mesh.material.map=createTextTexture(options);
  mesh.material.needsUpdate=true;
}

function createTypography(cases){
  const group=new THREE.Group();

  const brand=createTextPlane(
    {
      eyebrow:"Interactive Installation",
      title:"Visual Aura",
      body:"Reactive polygonal field / body / data / light"
    },
    new THREE.Vector3(-4.05,2.45,.65),
    new THREE.Vector3(3.55,1.37,1)
  );

  const caseLabel=createTextPlane(
    {
      eyebrow:"Case 01",
      title:cases?.[0]?.title||"Case",
      body:cases?.[0]?.description||""
    },
    new THREE.Vector3(4.05,2.0,.25),
    new THREE.Vector3(3.25,1.52,1)
  );

  const left=createTextPlane(
    {
      eyebrow:"Human movement",
      title:"Reactive",
      body:"Movement deforms the band, wire field and light response in real time."
    },
    new THREE.Vector3(-4.28,-1.72,-.25),
    new THREE.Vector3(2.9,1.32,1)
  );

  const right=createTextPlane(
    {
      eyebrow:"Generative system",
      title:"Data Aura",
      body:"Triangulated ribbon / iridescent spectrum / spatial typography"
    },
    new THREE.Vector3(4.18,-1.72,-.20),
    new THREE.Vector3(2.75,1.30,1)
  );

  const top=createTextPlane(
    {
      eyebrow:"Light / sound / movement / data",
      title:"Realtime",
      body:"Three.js generative spatial system"
    },
    new THREE.Vector3(.25,3.35,-.75),
    new THREE.Vector3(2.85,1.00,1)
  );

  group.add(brand,caseLabel,left,right,top);

  return {
    group,
    brand,
    caseLabel,
    left,
    right,
    top
  };
}

function createGlobalDitherPass(){
  return new ShaderPass({
    uniforms:{
      tDiffuse:{value:null},
      uStrength:{value:P.postfx.dither.strength},
      uScale:{value:P.postfx.dither.scale},
      uLevels:{value:P.postfx.dither.levels}
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
      uniform float uStrength,uScale,uLevels;
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
        vec4 src=texture2D(tDiffuse,vUv);
        float threshold=bayer4(gl_FragCoord.xy/max(.5,uScale));
        float levels=max(2.0,uLevels);
        vec3 quant=floor(max(src.rgb,vec3(0.0))*(levels-1.0)+threshold)/(levels-1.0);
        vec3 col=mix(src.rgb,quant,clamp(uStrength,0.0,1.0));
        gl_FragColor=vec4(col,src.a);
      }
    `
  });
}

export async function createVisualScene(stage,cases,videoTexture){
  ACTIVE_SEED=P.generation.randomizeEachLoad
    ? Math.random()*100000
    : P.generation.seed;

  if(document.fonts?.load){
    try{await document.fonts.load('600 76px "Turret Road"');}catch{}
  }

  const scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x030306,.023);

  const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,120);
  camera.position.set(0,0,9.1);

  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.28;
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
  root.rotation.set(
    P.composition.band.rotationX,
    P.composition.band.rotationY,
    P.composition.band.rotationZ
  );
  scene.add(root);

  // Central faceted amorphous ribbon.
  const bandData=createRibbonGeometry();
  const bandGeometry=bandData.geometry;
  const bandCurve=new THREE.CatmullRomCurve3(
    bandData.centers,
    true,
    "centripetal",
    .5
  );
  const bandMaterial=createBandMaterial(videoTexture);
  const bandMesh=new THREE.Mesh(bandGeometry,bandMaterial);
  bandMesh.renderOrder=4;
  root.add(bandMesh);

  // Triangulated wire skin on the ribbon itself.
  const bandWireMaterial=createBandWireMaterial();
  const bandWireGeometry=new THREE.WireframeGeometry(bandGeometry);
  const bandWire=new THREE.LineSegments(bandWireGeometry,bandWireMaterial);
  bandWire.renderOrder=5;
  root.add(bandWire);

  // Sparse iridescent triangle-wire constellation around the band.
  const wireAura=createWireAura();
  root.add(wireAura.group);

  // Spatial typography around the installation.
  const typography=createTypography(cases);
  scene.add(typography.group);

  // Minimal lighting for translucent/specular read.
  scene.add(new THREE.AmbientLight(0xffffff,.15));

  const key=new THREE.PointLight(0xffffff,8.5,34);
  const lightA=new THREE.PointLight(0x74f7ff,7.2,32);
  const lightB=new THREE.PointLight(0xff4ecf,6.6,32);

  key.position.set(3.8,4.8,6.4);
  lightA.position.set(-4.8,1.2,4.0);
  lightB.position.set(4.1,-3.3,-1.2);
  scene.add(key,lightA,lightB);

  const caseTs=(cases||[]).map((_,index,list)=>{
    const count=Math.max(1,list.length);
    return ((index+.5)/count)%1;
  });

  const cameraRig={
    position:camera.position.clone(),
    target:new THREE.Vector3(),
    desiredPosition:camera.position.clone(),
    desiredTarget:new THREE.Vector3()
  };

  let lastState=null;

  function deformRailPoint(t,state){
    const local=bandCurve.getPointAt((t%1+1)%1);
    const depth=state?.bandDepth??1;
    const twist=state?.bandTwist??0;

    local.z*=depth;

    const angle=(t-.5)*twist;
    const ct=Math.cos(angle);
    const st=Math.sin(angle);
    const x=local.x*ct-local.y*st;
    const y=local.x*st+local.y*ct;
    local.x=x;
    local.y=y;

    return local;
  }

  function getCaseFrame(index,state=lastState,orbitX=0,orbitY=0){
    const count=Math.max(1,caseTs.length);
    const safe=((index%count)+count)%count;
    const t=caseTs[safe]??0;
    const ahead=P.composition.cameraRail.lookAhead;

    const localTarget=deformRailPoint(t,state);
    const localNext=deformRailPoint((t+ahead)%1,state);
    const localPrev=deformRailPoint((t-ahead+1)%1,state);

    root.updateMatrixWorld(true);

    const target=localTarget.clone().applyMatrix4(root.matrixWorld);
    const next=localNext.clone().applyMatrix4(root.matrixWorld);
    const prev=localPrev.clone().applyMatrix4(root.matrixWorld);

    const tangent=next.sub(prev).normalize();

    const centerWorld=new THREE.Vector3().setFromMatrixPosition(root.matrixWorld);
    const outward=target.clone().sub(centerWorld);
    if(outward.lengthSq()<.0001)outward.set(0,0,1);
    outward.normalize();

    const side=new THREE.Vector3().crossVectors(tangent,outward);
    if(side.lengthSq()<.0001)side.set(0,1,0);
    side.normalize();

    // Every case naturally sits on a different side of the closed ribbon.
    // Pointer / gyro then gives a full additional 360 degree orbit.
    const baseOffset=outward.clone()
      .multiplyScalar(P.composition.cameraRail.distance)
      .addScaledVector(side,P.composition.cameraRail.sideOffset)
      .addScaledVector(new THREE.Vector3(0,1,0),P.composition.cameraRail.height);

    const worldUp=new THREE.Vector3(0,1,0);
    const azimuth=orbitX*P.composition.cameraRail.orbitAzimuth;
    baseOffset.applyAxisAngle(worldUp,azimuth);

    const elevationAxis=new THREE.Vector3()
      .crossVectors(worldUp,baseOffset)
      .normalize();
    if(elevationAxis.lengthSq()>.0001){
      baseOffset.applyAxisAngle(
        elevationAxis,
        orbitY*P.composition.cameraRail.orbitElevation
      );
    }

    const minD=P.composition.cameraRail.minDistance;
    const maxD=P.composition.cameraRail.maxDistance;
    const d=THREE.MathUtils.clamp(baseOffset.length(),minD,maxD);
    baseOffset.setLength(d);

    const position=target.clone().add(baseOffset);

    return {
      index:safe,
      t,
      target,
      position,
      tangent,
      normal:outward,
      side
    };
  }

  let activeCaseIndex=-1;

  function setCase(index){
    if(index===activeCaseIndex)return;
    activeCaseIndex=index;

    const c=cases?.[index];
    if(!c)return;

    replaceTextPlaneTexture(typography.caseLabel,{
      eyebrow:`Case ${String(index+1).padStart(2,"0")}`,
      title:c.title||"Case",
      body:c.description||""
    });
  }

  function applyParams(){
    bloomPass.strength=P.bloom.strength;
    bloomPass.radius=P.bloom.radius;
    bloomPass.threshold=P.bloom.threshold;

    ditherPass.uniforms.uStrength.value=P.postfx.dither.strength;
    ditherPass.uniforms.uScale.value=P.postfx.dither.scale;
    ditherPass.uniforms.uLevels.value=P.postfx.dither.levels;

    bandMaterial.uniforms.uOpacity.value=P.material.band.opacity;
    bandMaterial.uniforms.uBrightness.value=P.material.band.brightness;
    bandMaterial.uniforms.uEdgeGlow.value=P.material.band.edgeGlow;
    bandMaterial.uniforms.uFresnelGlow.value=P.material.band.fresnelGlow;
    bandMaterial.uniforms.uWhiteSpecular.value=P.material.band.whiteSpecular;
    bandMaterial.uniforms.uSpeed.value=P.material.band.speed;
    bandMaterial.uniforms.uPearlStrength.value=P.material.band.pearlStrength;
    bandMaterial.uniforms.uFilmThickness.value=P.material.band.filmThickness;
    bandMaterial.uniforms.uWhiteness.value=P.material.band.whiteness;
    bandMaterial.uniforms.uSpectralSaturation.value=P.material.band.spectralSaturation;
    bandMaterial.uniforms.uFocusWidth.value=P.material.band.focusWidth;
    bandMaterial.uniforms.uFocusColorBoost.value=P.material.band.focusColorBoost;
    bandMaterial.uniforms.uFocusReflection.value=P.material.band.focusReflection;

    bandWireMaterial.uniforms.uGlow.value=P.material.wire.glow;
    bandWireMaterial.uniforms.uOpacity.value=Math.min(1,P.material.wire.opacity+.18);
    bandWireMaterial.uniforms.uSpeed.value=P.material.wire.speed;

    wireAura.mat.uniforms.uGlow.value=P.material.wire.glow;
    wireAura.mat.uniforms.uOpacity.value=P.material.wire.opacity;
    wireAura.mat.uniforms.uSpeed.value=P.material.wire.speed;

    wireAura.networkMat.uniforms.uGlow.value=P.material.wire.glow*.72;
    wireAura.networkMat.uniforms.uOpacity.value=P.composition.wireAura.networkOpacity;
    wireAura.networkMat.uniforms.uSpeed.value=P.material.wire.speed;

    wireAura.pointMat.uniforms.uOpacity.value=P.material.points.opacity;
    wireAura.pointMat.uniforms.uSize.value=P.material.points.size;
    wireAura.pointMat.uniforms.uPixelRatio.value=Math.min(devicePixelRatio,2);

    typography.group.children.forEach(mesh=>{
      if(mesh.material)mesh.material.opacity=P.composition.typography.opacity;
    });
  }

  function resize(){
    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();

    const ratio=Math.min(devicePixelRatio,2);
    renderer.setPixelRatio(ratio);
    renderer.setSize(innerWidth,innerHeight);

    composer.setPixelRatio(ratio);
    composer.setSize(innerWidth,innerHeight);
    wireAura.pointMat.uniforms.uPixelRatio.value=ratio;
  }

  setCase(0);

  return {
    scene,camera,renderer,composer,bloomPass,ditherPass,root,
    bandMesh,bandMaterial,bandWire,bandWireMaterial,
    wireAura,
    typography,
    key,lightA,lightB,
    bandCurve,
    caseTs,
    cameraRig,
    getCaseFrame,
    setCase,
    get activeCaseIndex(){return activeCaseIndex;},
    get lastState(){return lastState;},
    setStateSnapshot(next){lastState=next;},
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
    root,camera,
    bandMesh,bandMaterial,bandWireMaterial,
    wireAura,typography,
    bloomPass,ditherPass,
    cameraRig,
    key,lightA,lightB
  }=visual;

  visual.setStateSnapshot(state);

  if(activeCase!==visual.activeCaseIndex){
    visual.setCase(activeCase);
  }

  const R=P.reaction;

  root.rotation.x=THREE.MathUtils.lerp(
    root.rotation.x,
    P.composition.band.rotationX+
      pointer.y*R.root.pointerY-
      humanY*R.root.cameraY+
      state.tiltBias*.018,
    .02
  );

  root.rotation.y=THREE.MathUtils.lerp(
    root.rotation.y,
    P.composition.band.rotationY+
      pointer.x*R.root.pointerX+
      humanX*R.root.cameraX+
      state.rotationBias*.012,
    .02
  );

  root.rotation.z=THREE.MathUtils.lerp(
    root.rotation.z,
    P.composition.band.rotationZ+
      state.orbitBias*.22+
      humanVX*R.root.velocityRoll,
    .016
  );

  root.position.x=THREE.MathUtils.lerp(
    root.position.x,
    humanX*R.band.xPush,
    R.band.response
  );
  root.position.y=THREE.MathUtils.lerp(
    root.position.y,
    humanY*R.band.yPush,
    R.band.response
  );
  root.position.z=THREE.MathUtils.lerp(
    root.position.z,
    motion*R.band.zPush,
    R.band.response
  );

  const bandScale=
    state.bandScale*
    (1+motion*R.band.scalePulse);
  const bs=THREE.MathUtils.lerp(root.scale.x,bandScale,R.band.response);
  root.scale.setScalar(bs);

  root.updateMatrixWorld(true);

  // Each case owns one viewpoint along the closed ribbon.
  // Pointer / gyro adds a true 360-degree orbit around that local case anchor.
  const orbitX=THREE.MathUtils.clamp(
    pointer.x*P.composition.cameraRail.pointerOrbit+
    humanX*P.composition.cameraRail.motionOrbit,
    -1,
    1
  );
  const orbitY=THREE.MathUtils.clamp(
    pointer.y*P.composition.cameraRail.pointerOrbit*.72+
    humanY*P.composition.cameraRail.motionOrbit,
    -1,
    1
  );

  const view=visual.getCaseFrame(activeCase,state,orbitX,orbitY);
  cameraRig.desiredPosition.copy(view.position);
  cameraRig.desiredTarget.copy(view.target);

  cameraRig.position.lerp(
    cameraRig.desiredPosition,
    P.composition.cameraRail.transitionResponse
  );
  cameraRig.target.lerp(
    cameraRig.desiredTarget,
    P.composition.cameraRail.targetResponse
  );

  camera.position.copy(cameraRig.position);
  camera.lookAt(cameraRig.target);

  bandMaterial.uniforms.uTime.value=time;
  bandMaterial.uniforms.uMotion.value=motion;
  bandMaterial.uniforms.uHuman.value.set(humanX,humanY);
  bandMaterial.uniforms.uA.value.copy(state.palette[0]);
  bandMaterial.uniforms.uB.value.copy(state.palette[1]||state.palette[0]);
  bandMaterial.uniforms.uC.value.copy(
    state.palette[2]||state.palette[1]||state.palette[0]
  );
  bandMaterial.uniforms.uDepth.value=state.bandDepth;
  bandMaterial.uniforms.uCaseTwist.value=
    state.bandTwist+
    humanVX*R.band.velocityTilt*.15-
    humanVY*R.band.velocityTilt*.12;
  bandMaterial.uniforms.uIridescence.value=state.iridescenceBias;
  bandMaterial.uniforms.uFocusPhase.value=view.t;
  bandMaterial.uniforms.uFocusWidth.value=P.material.band.focusWidth;
  bandMaterial.uniforms.uFocusColorBoost.value=P.material.band.focusColorBoost;
  bandMaterial.uniforms.uFocusReflection.value=P.material.band.focusReflection;
  bandMaterial.uniforms.uReflectionActive.value=cameraMotion.active
    ?THREE.MathUtils.clamp(.45+(cameraMotion.presence||0)*.75,0,1)
    :0;

  bandWireMaterial.uniforms.uTime.value=time;
  bandWireMaterial.uniforms.uMotion.value=motion;
  bandWireMaterial.uniforms.uDepth.value=state.bandDepth;
  bandWireMaterial.uniforms.uCaseTwist.value=
    state.bandTwist+
    humanVX*R.band.velocityTilt*.15-
    humanVY*R.band.velocityTilt*.12;
  bandWireMaterial.uniforms.uHuman.value.set(humanX,humanY);
  bandWireMaterial.uniforms.uA.value.copy(state.palette[0]);
  bandWireMaterial.uniforms.uB.value.copy(state.palette[1]||state.palette[0]);
  bandWireMaterial.uniforms.uC.value.copy(
    state.palette[2]||state.palette[1]||state.palette[0]
  );

  wireAura.mat.uniforms.uTime.value=time;
  wireAura.mat.uniforms.uMotion.value=motion;
  wireAura.networkMat.uniforms.uTime.value=time;
  wireAura.networkMat.uniforms.uMotion.value=motion*.5;

  for(const mat of [wireAura.mat,wireAura.networkMat]){
    mat.uniforms.uA.value.copy(state.palette[0]);
    mat.uniforms.uB.value.copy(state.palette[1]||state.palette[0]);
    mat.uniforms.uC.value.copy(
      state.palette[2]||state.palette[1]||state.palette[0]
    );
  }

  wireAura.pointMat.uniforms.uA.value.copy(
    state.palette[0]||new THREE.Color("#ffffff")
  );
  wireAura.pointMat.uniforms.uB.value.copy(
    state.palette[1]||state.palette[0]
  );

  const wireScale=
    state.wireScale*
    (1+motion*R.wireAura.scalePulse);

  wireAura.group.scale.setScalar(
    THREE.MathUtils.lerp(
      wireAura.group.scale.x,
      wireScale,
      R.wireAura.response
    )
  );

  wireAura.group.rotation.y=THREE.MathUtils.lerp(
    wireAura.group.rotation.y,
    humanX*.06+state.orbitBias*.20,
    R.wireAura.response
  );
  wireAura.group.rotation.x=THREE.MathUtils.lerp(
    wireAura.group.rotation.x,
    -humanY*.05+state.tiltBias*.025,
    R.wireAura.response
  );

  wireAura.frames.forEach((frame,i)=>{
    const base=frame.userData.basePosition;
    const rot=frame.userData.baseRotation;
    const depth=.65+Math.abs(base.z)*.10;

    frame.position.x=THREE.MathUtils.lerp(
      frame.position.x,
      base.x+humanX*R.wireAura.xPush*depth,
      R.wireAura.response
    );
    frame.position.y=THREE.MathUtils.lerp(
      frame.position.y,
      base.y+humanY*R.wireAura.yPush*depth,
      R.wireAura.response
    );
    frame.position.z=THREE.MathUtils.lerp(
      frame.position.z,
      base.z+
        motion*R.wireAura.zPush*depth+
        Math.sin(time*.13+frame.userData.phase)*.045,
      R.wireAura.response
    );

    frame.rotation.x=
      rot.x-humanVY*R.wireAura.velocityTilt*.18+
      Math.sin(time*.07+frame.userData.phase)*.025;
    frame.rotation.y=
      rot.y+humanVX*R.wireAura.velocityTilt*.18;
    frame.rotation.z=
      rot.z+Math.sin(time*.10+frame.userData.phase)*.045;
  });

  const typeR=R.typography;
  typography.group.position.x=THREE.MathUtils.lerp(
    typography.group.position.x,
    pointer.x*typeR.pointerX+humanX*typeR.cameraX,
    typeR.response
  );
  typography.group.position.y=THREE.MathUtils.lerp(
    typography.group.position.y,
    pointer.y*typeR.pointerY+humanY*typeR.cameraY,
    typeR.response
  );

  const ts=THREE.MathUtils.lerp(
    typography.group.scale.x,
    state.typeScale*P.composition.typography.scale,
    .014
  );
  typography.group.scale.setScalar(ts);

  typography.group.children.forEach(mesh=>{
    if(mesh.isMesh){
      mesh.quaternion.slerp(camera.quaternion,.065);
    }
  });

  lightA.color.copy(state.palette[0]);
  lightB.color.copy(state.palette[1]||state.palette[0]);

  lightA.intensity=6.1+state.intensity*3+motion*1.8;
  lightB.intensity=5.6+state.complexity*2.5+motion*1.5;

  key.position.x=THREE.MathUtils.lerp(
    key.position.x,
    3.8+humanX*.9,
    .018
  );
  key.position.y=THREE.MathUtils.lerp(
    key.position.y,
    4.8+humanY*.7,
    .018
  );

  bloomPass.radius=P.bloom.radius;
  bloomPass.threshold=P.bloom.threshold;
  bloomPass.strength=
    P.bloom.strength+
    state.bloomBias+
    motion*P.bloom.motionBoost+
    state.intensity*.04;

  ditherPass.uniforms.uStrength.value=P.postfx.dither.strength;
  ditherPass.uniforms.uScale.value=P.postfx.dither.scale;
  ditherPass.uniforms.uLevels.value=P.postfx.dither.levels;
}