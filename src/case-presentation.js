function normalizeMedia(caseData){
  const presentation=caseData?.presentation||{};
  const hero=caseData?.hero||{};

  const images=[
    ...(Array.isArray(presentation.images)?presentation.images:[]),
    ...(Array.isArray(caseData?.images)?caseData.images:[])
  ];

  if(hero.image&&!images.some(item=>(typeof item==="string"?item:item?.src)===hero.image)){
    images.unshift({src:hero.image,alt:caseData?.title||"Case"});
  }

  const video=presentation.video||caseData?.video||hero.video||null;
  return {images,video};
}

function srcOf(entry){
  return typeof entry==="string"?entry:entry?.src||"";
}

function altOf(entry,fallback){
  return typeof entry==="string"?fallback:(entry?.alt||fallback);
}

function createElement(tag,className,text){
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text!=null)node.textContent=text;
  return node;
}

export function createCasePresentation(){
  const root=createElement("section","case-overlay");
  root.setAttribute("aria-hidden","true");

  const backdrop=createElement("button","case-overlay__backdrop");
  backdrop.type="button";
  backdrop.setAttribute("aria-label","Case schließen");

  const panel=createElement("article","case-overlay__panel");

  const header=createElement("header","case-overlay__header");
  const headerCopy=createElement("div","case-overlay__header-copy");
  const kicker=createElement("div","case-overlay__kicker");
  const title=createElement("h2","case-overlay__title");
  const description=createElement("p","case-overlay__description");

  const close=createElement("button","case-overlay__close","Close");
  close.type="button";

  headerCopy.append(kicker,title,description);
  header.append(headerCopy,close);

  const media=createElement("div","case-overlay__media");
  const hero=createElement("div","case-overlay__hero");
  const gallery=createElement("div","case-overlay__gallery");
  media.append(hero,gallery);

  panel.append(header,media);
  root.append(backdrop,panel);
  document.body.appendChild(root);

  let activeCase=null;
  let activeCaseIndex=0;
  let openState=false;
  let currentVideo=null;

  function clearMedia(){
    if(currentVideo){
      currentVideo.pause();
      currentVideo.removeAttribute("src");
      currentVideo.load();
      currentVideo=null;
    }
    hero.replaceChildren();
    gallery.replaceChildren();
  }

  function addImage(entry,index,total){
    const src=srcOf(entry);
    if(!src)return;

    const figure=createElement("figure","case-overlay__figure");
    figure.style.setProperty("--i",String(index));
    figure.style.setProperty("--count",String(total));

    const img=document.createElement("img");
    img.src=src;
    img.alt=altOf(entry,activeCase?.title||"Case image");
    img.loading=index<3?"eager":"lazy";
    img.decoding="async";

    figure.appendChild(img);
    gallery.appendChild(figure);
  }

  function build(caseData,index){
    activeCase=caseData;
    activeCaseIndex=index;

    clearMedia();

    kicker.textContent=`Case ${String(index+1).padStart(2,"0")}`;
    title.textContent=caseData?.title||"Untitled";
    description.textContent=caseData?.description||"";

    const normalized=normalizeMedia(caseData);
    const videoSrc=srcOf(normalized.video);
    const imageEntries=normalized.images.filter(entry=>srcOf(entry));

    if(videoSrc){
      const video=document.createElement("video");
      video.className="case-overlay__video";
      video.src=videoSrc;
      video.autoplay=true;
      video.loop=true;
      video.muted=true;
      video.playsInline=true;
      video.controls=true;
      video.preload="metadata";
      video.setAttribute("aria-label",caseData?.title||"Case video");
      hero.appendChild(video);
      currentVideo=video;
      video.play().catch(()=>{});
    }else if(imageEntries.length){
      const first=imageEntries[0];
      const img=document.createElement("img");
      img.className="case-overlay__hero-image";
      img.src=srcOf(first);
      img.alt=altOf(first,caseData?.title||"Case image");
      img.decoding="async";
      hero.appendChild(img);
    }else{
      const empty=createElement("div","case-overlay__empty","No media");
      hero.appendChild(empty);
    }

    const galleryEntries=videoSrc?imageEntries:imageEntries.slice(1);
    galleryEntries.forEach((entry,i)=>addImage(entry,i,galleryEntries.length));
    gallery.classList.toggle("is-empty",galleryEntries.length===0);
  }

  async function open(caseData,index=activeCaseIndex){
    if(!caseData)return;
    build(caseData,index);
    openState=true;
    root.classList.add("is-open");
    root.setAttribute("aria-hidden","false");
    document.body.classList.add("case-presentation-open");
  }

  function closeOverlay(){
    openState=false;
    root.classList.remove("is-open");
    root.setAttribute("aria-hidden","true");
    document.body.classList.remove("case-presentation-open");
    if(currentVideo)currentVideo.pause();
  }

  async function toggle(caseData,index=activeCaseIndex){
    if(openState&&activeCase?.id===caseData?.id){
      closeOverlay();
      return;
    }
    await open(caseData,index);
  }

  function isOpen(){
    return openState;
  }

  function update(){
    // DOM overlay intentionally bypasses Three.js postprocessing.
  }

  backdrop.addEventListener("click",closeOverlay);
  close.addEventListener("click",closeOverlay);

  return {
    open,
    close:closeOverlay,
    toggle,
    isOpen,
    update,
    get activeCase(){return activeCase;},
    get activeCaseIndex(){return activeCaseIndex;}
  };
}
