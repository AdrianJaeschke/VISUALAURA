import * as THREE from "three";

function headlineTexture(text,a,b){
  const c=document.createElement("canvas"); c.width=1024;c.height=256;const x=c.getContext("2d");
  x.clearRect(0,0,c.width,c.height);
  const g=x.createLinearGradient(0,0,c.width,0);g.addColorStop(0,a);g.addColorStop(1,b);
  x.font="700 112px Inter, Arial, sans-serif";x.textBaseline="middle";x.fillStyle=g;x.shadowColor=a;x.shadowBlur=22;x.fillText(text.toUpperCase(),24,128);
  x.shadowBlur=0;x.font="600 28px ui-monospace, monospace";x.fillStyle="rgba(255,255,255,.48)";x.fillText(text.toUpperCase().replace(/\s+/g," / "),30,42);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}

export function createVisualScene(stage,cases,videoTexture){
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x050507,.05);
  const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,100);camera.position.z=7.2;
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;stage.appendChild(renderer.domElement);

  const root=new THREE.Group();scene.add(root);
  const geo=new THREE.IcosahedronGeometry(2.08,3);geo.scale(1.32,.9,1.12);geo.rotateZ(.23);

  const mat=new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0},uVideo:{value:videoTexture},uA:{value:new THREE.Color("#74f7ff")},uB:{value:new THREE.Color("#ff4ecf")},uC:{value:new THREE.Color("#7b69ff")},
      uMorph:{value:.5},uDistortion:{value:.5},uGlitch:{value:.1},uMotion:{value:0},uMoire:{value:1},uZebra:{value:.7},uPointer:{value:new THREE.Vector2()}},
    vertexShader:`
      uniform float uTime,uMorph,uDistortion;uniform vec2 uPointer;varying vec3 vW,vN,vL;
      void main(){vec3 p=position;float a=sin(p.x*5.2+uTime*.6)*cos(p.y*4.3-uTime*.35);float b=sin(p.z*7.4-uTime*.22)*sin(p.x*6.1+uTime*.18);
      float f=exp(-2.0*distance(normalize(p.xy+.0001),normalize(uPointer+.0001)));p+=normal*(a*b)*(.16+uMorph*.18);p+=normal*f*.12*(.6+uDistortion);
      vec4 w=modelMatrix*vec4(p,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);vL=p;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`
      uniform float uTime,uMorph,uDistortion,uGlitch,uMotion,uMoire,uZebra;uniform sampler2D uVideo;uniform vec3 uA,uB,uC;
      varying vec3 vW,vN,vL;
      float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
      void main(){vec3 N=normalize(vN),V=normalize(cameraPosition-vW);float fr=pow(1.-max(dot(N,V),0.),2.35);vec3 R=reflect(-V,N);vec2 uv=R.xy*.34+.5;
      float row=floor(uv.y*72.);float gh=step(.8,h(vec2(row,floor(uTime*8.))))*uGlitch;uv.x+=(h(vec2(row,7.+floor(uTime*10.)))-.5)*.1*gh;uv=clamp(uv,0.,1.);
      vec2 puv=floor(uv*vec2(48.))/48.;vec3 refl=texture2D(uVideo,puv).rgb;refl=mix(vec3(dot(refl,vec3(.333))),refl,.72);
      vec3 iri=.5+.5*cos(6.28318*(fr+vec3(0.,.33,.67))+vec3(0.,1.4,2.1));iri=mix(uA,uB,iri.r);iri=mix(iri,uC,.32+fr*.4);
      float za=.5+.5*sin((vL.x+vL.y)*46.+uTime*.18),zb=.5+.5*sin((vL.x*.85-vL.z)*57.-uTime*.14);float zebra=smoothstep(.47,.53,mix(za,zb,.5));
      float m=abs(sin(vL.x*(36.+uMoire*14.))*sin(vL.y*(41.+uMoire*11.)+uTime*.1));
      float gs=step(.95,sin(vW.y*17.+uTime*19.+h(vW.xz)*8.))*uGlitch*(.15+uMotion*.55);
      vec3 col=vec3(.012,.014,.021);col+=refl*(.12+fr*.34);col+=iri*(.16+fr*.82);col+=iri*zebra*.11*uZebra;col+=iri*m*.24*(.4+fr);col+=gs*mix(uA,uB,.5);col*=.72+fr*.38;gl_FragColor=vec4(col,1.);}`
  });
  const sculpture=new THREE.Mesh(geo,mat);root.add(sculpture);

  const wireMat=new THREE.LineBasicMaterial({color:0x74f7ff,transparent:true,opacity:.3,blending:THREE.AdditiveBlending});
  const wire=new THREE.LineSegments(new THREE.WireframeGeometry(geo),wireMat);wire.scale.setScalar(1.035);root.add(wire);
  const edgeMat=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.14,blending:THREE.AdditiveBlending});
  const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geo,8),edgeMat);edges.scale.setScalar(1.055);root.add(edges);

  const flowGroup=new THREE.Group();root.add(flowGroup);const flows=[];
  for(let i=0;i<18;i++){const pts=[];const turns=1.35+(i%4)*.24,r0=2.35+Math.sin(i*1.7)*.34;
    for(let j=0;j<72;j++){const t=j/71,a=t*Math.PI*2*turns+i*.65,r=r0+Math.sin(t*12+i*1.8)*.12;pts.push(new THREE.Vector3(Math.cos(a)*r,(t-.5)*4.4+Math.sin(t*10+i)*.16,Math.sin(a)*r*.72))}
    const curve=new THREE.CatmullRomCurve3(pts),fg=new THREE.TubeGeometry(curve,170,.008+(i%3)*.004,3,false);
    const fm=new THREE.MeshBasicMaterial({color:i%2?0xff4ecf:0x74f7ff,transparent:true,opacity:.28,blending:THREE.AdditiveBlending,depthWrite:false});
    const mesh=new THREE.Mesh(fg,fm);mesh.rotation.z=i*.14;mesh.userData.baseRot=mesh.rotation.z;flows.push(mesh);flowGroup.add(mesh);}

  const headlineRoot=new THREE.Group();root.add(headlineRoot);
  const headlines=cases.map((c,ci)=>{const group=new THREE.Group();[c.title,`${c.location.city} ${c.year}`,c.tags.join(" / ")].forEach((txt,i)=>{
      const tex=headlineTexture(txt,c.palette[0],c.palette[1]||c.palette[0]);const hm=new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
      const p=new THREE.Mesh(new THREE.PlaneGeometry(2.35,.58),hm),a=ci*1.25+i*.94,r=2.05+i*.3;p.position.set(Math.cos(a)*r,.76-i*.62,Math.sin(a)*r*.72);p.lookAt(0,0,0);p.rotateY(Math.PI);p.userData.base=p.position.clone();group.add(p)});
    headlineRoot.add(group);return group;});

  scene.add(new THREE.AmbientLight(0xffffff,.24));const key=new THREE.PointLight(0x74f7ff,18,24),fill=new THREE.PointLight(0xff4ecf,14,22),back=new THREE.PointLight(0x7b69ff,9,20);
  key.position.set(4.4,3.2,5.8);fill.position.set(-4.1,-2.6,4.8);back.position.set(0,0,-5);scene.add(key,fill,back);

  function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2))}
  return {scene,camera,renderer,root,sculpture,mat,wire,wireMat,edges,edgeMat,flowGroup,flows,headlines,key,fill,back,resize};
}

export function updateVisualScene(v,time,state,pointer,motion,activeCase){
  const {root,sculpture,mat,wire,wireMat,edgeMat,flowGroup,flows,headlines,key,fill,back}=v;
  root.rotation.x=THREE.MathUtils.lerp(root.rotation.x,pointer.y*.42+state.tiltBias*.32,.045);
  root.rotation.y=THREE.MathUtils.lerp(root.rotation.y,pointer.x*.54+state.rotationBias*.08+time*.08,.045);root.rotation.z=Math.sin(time*.25)*.06;
  sculpture.scale.set(1+Math.sin(time*.7)*.03*state.morph,1+Math.cos(time*.62)*.04*state.morph,1+Math.sin(time*.48)*.03);
  Object.assign(mat.uniforms.uTime,{value:time});mat.uniforms.uMorph.value=state.morph;mat.uniforms.uDistortion.value=state.distortion+motion*.38;mat.uniforms.uGlitch.value=state.glitch+motion*.22;mat.uniforms.uMotion.value=motion;mat.uniforms.uMoire.value=state.moire;mat.uniforms.uZebra.value=state.zebra;mat.uniforms.uPointer.value.copy(pointer);
  mat.uniforms.uA.value.copy(state.palette[0]);mat.uniforms.uB.value.copy(state.palette[1]||state.palette[0]);mat.uniforms.uC.value.copy(state.palette[2]||state.palette[1]||state.palette[0]);
  wire.rotation.y=-time*.025;wireMat.color.copy(state.palette[0]);wireMat.opacity=.18+state.density*.16+motion*.14;edgeMat.color.copy(state.palette[2]||state.palette[1]);edgeMat.opacity=.1+state.glitch*.12;
  flowGroup.rotation.y=time*(.04+state.distortion*.018);flowGroup.rotation.x=Math.sin(time*.2)*.14;flows.forEach((m,i)=>{m.rotation.z=m.userData.baseRot+Math.sin(time*(.28+i*.008)+i)*.11;m.material.opacity=.12+state.density*.25+motion*.2;m.material.color.copy(state.palette[i%state.palette.length])});
  headlines.forEach((g,gi)=>{const active=gi===activeCase;g.rotation.y=time*.05+gi*.28;g.children.forEach((p,i)=>{const o=active?(i===0?.9:.55):.06;p.material.opacity=THREE.MathUtils.lerp(p.material.opacity,o,.06);p.position.copy(p.userData.base);p.position.y+=Math.sin(time*1.1+i+gi)*(active?.04:.015)})});
  key.color.copy(state.palette[0]);fill.color.copy(state.palette[1]||state.palette[0]);back.color.copy(state.palette[2]||state.palette[1]);key.intensity=10+state.intensity*12+motion*10;fill.intensity=8+state.glitch*10;back.intensity=6+state.moire*5;
}