const tools=[
{id:"image-pdf",name:"Image → PDF",desc:"Convert JPG or PNG images into a clean PDF document.",icon:"▧",color:"red",keys:"image pdf convert"},
{id:"ocr",name:"Image → Text",desc:"Extract readable text from images and screenshots.",icon:"Aa",color:"blue",keys:"image text ocr"},
{id:"merge",name:"Merge PDF",desc:"Combine multiple PDF files into one document.",icon:"▤",color:"green",keys:"merge pdf"},
{id:"split",name:"Split PDF",desc:"Separate pages or ranges from a PDF file.",icon:"✂",color:"orange",keys:"split pdf"},
{id:"compress-pdf",name:"Compress PDF",desc:"Reduce PDF file size for easier sharing.",icon:"↘",color:"purple",keys:"compress pdf"},
{id:"pdf-image",name:"PDF → JPG / PNG",desc:"Convert PDF pages into image files.",icon:"▥",color:"teal",keys:"pdf jpg png convert"},
{id:"scanner",name:"Document Scanner",desc:"Scan and clean documents with your camera.",icon:"▤",color:"blue",keys:"document scanner scan"},
{id:"compress-image",name:"Compress Image",desc:"Reduce image size for email and sharing.",icon:"⌁",color:"green",keys:"compress image"},
{id:"jpg-png",name:"JPG ↔ PNG",desc:"Switch between common image formats.",icon:"⇄",color:"orange",keys:"jpg png image convert"},
{id:"share",name:"Share & Send",desc:"Share files with temporary processing and delivery.",icon:"↥",color:"purple",keys:"share send temporary"}
];
const popular=tools.slice(0,6),grid=document.getElementById("toolGrid"),search=document.getElementById("toolSearch"),empty=document.getElementById("emptyState"),toast=document.getElementById("toast");
function showToast(msg){toast.textContent=msg;toast.classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>toast.classList.remove("show"),2600)}
function render(q=""){
 const term=q.trim().toLowerCase();
 const list=(term?tools:popular).filter(t=>!term||`${t.name} ${t.desc} ${t.keys}`.toLowerCase().includes(term));
 grid.innerHTML=list.map(t=>`<article class="tool-card"><div class="tool-icon ${t.color}">${t.icon}</div><h3>${t.name}</h3><p>${t.desc}</p><button class="open-tool ${t.color}" data-open="${t.id}">Open tool →</button></article>`).join("");
 empty.hidden=list.length>0;
 grid.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>openTool(b.dataset.open)));
}
function openTool(id){
 const tool=tools.find(t=>t.id===id);
 if(!tool)return;
 if(id==="image-pdf"){ openImagePdf(); return; }
 search.value=tool.name;
 render(tool.name);
 document.getElementById("tools").scrollIntoView({behavior:"smooth",block:"start"});
 showToast(`${tool.name} is selected. Its processing engine is coming next.`);
}

const toolModal=document.getElementById("toolModal");
const imageFiles=document.getElementById("imageFiles");
const uploadZone=document.getElementById("uploadZone");
const imageList=document.getElementById("imageList");
const fileCount=document.getElementById("fileCount");
const createPdf=document.getElementById("createPdf");
const pdfStatus=document.getElementById("pdfStatus");
const clearImages=document.getElementById("clearImages");
const pageSize=document.getElementById("pageSize");
const orientation=document.getElementById("orientation");
const margin=document.getElementById("margin");

/* KwikToolForAll local PDF engine: no upload/server dependency. */
function kwikMakePdf(pages){
  const enc = new TextEncoder();
  const chunks = [];
  const offsets = [0];
  let pos = 0;
  const push = s => { const b = typeof s === "string" ? enc.encode(s) : s; chunks.push(b); pos += b.length; };

  push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
  const objects = [];
  const addObj = body => { objects.push(body); return objects.length; };

  const catalogId = addObj(null);
  const pagesId = addObj(null);
  const pageIds = [];
  const contentIds = [];
  const imageIds = [];

  pages.forEach((p) => {
    const imgId = addObj(null);
    imageIds.push(imgId);
    const contentId = addObj(null);
    contentIds.push(contentId);
    const pageId = addObj(null);
    pageIds.push(pageId);
  });

  objects[catalogId-1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId-1] = `<< /Type /Pages /Kids [${pageIds.map(id=>id+" 0 R").join(" ")}] /Count ${pageIds.length} >>`;

  pages.forEach((p,i)=>{
    const w = p.width, h = p.height;
    objects[imageIds[i]-1] = {
      dict:`<< /Type /XObject /Subtype /Image /Width ${p.imgWidth} /Height ${p.imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>`,
      stream:p.jpeg
    };
    const commands = `q\n${w} 0 0 ${h} 0 0 cm\n/Im0 Do\nQ\n`;
    const cb = enc.encode(commands);
    objects[contentIds[i]-1] = {
      dict:`<< /Length ${cb.length} >>`,
      stream:cb
    };
    objects[pageIds[i]-1] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${imageIds[i]} 0 R >> >> /Contents ${contentIds[i]} 0 R >>`;
  });

  objects.forEach((obj,i)=>{
    offsets[i+1]=pos;
    push(`${i+1} 0 obj\n`);
    if(typeof obj === "string"){
      push(obj+"\nendobj\n");
    }else{
      push(obj.dict+"\nstream\n");
      push(obj.stream);
      push("\nendstream\nendobj\n");
    }
  });
  const xref = pos;
  push(`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`);
  for(let i=1;i<=objects.length;i++) push(String(offsets[i]).padStart(10,"0")+" 00000 n \n");
  push(`trailer\n<< /Size ${objects.length+1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(chunks,{type:"application/pdf"});
}

function kwikDataUrlToBytes(dataUrl){
  const b64 = dataUrl.split(",")[1] || "";
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i);
  return out;
}

function kwikImageToJpeg(item){
  return new Promise((resolve,reject)=>{
    const img = new Image();
    img.onload=()=>{
      try{
        const rad=(item.rotation||0)*Math.PI/180;
        const swap=Math.abs((item.rotation||0)%180)===90;
        const cw=swap?img.height:img.width, ch=swap?img.width:img.height;
        const canvas=document.createElement("canvas");
        canvas.width=cw; canvas.height=ch;
        const ctx=canvas.getContext("2d");
        ctx.translate(cw/2,ch/2);
        ctx.rotate(rad);
        ctx.drawImage(img,-img.width/2,-img.height/2);
        const data=canvas.toDataURL("image/jpeg",0.92);
        resolve({jpeg:kwikDataUrlToBytes(data),imgWidth:cw,imgHeight:ch});
      }catch(e){reject(e)}
    };
    img.onerror=()=>reject(new Error("Could not read image."));
    img.src=item.url;
  });
}

let pdfImages=[];

function openImagePdf(){
 toolModal.classList.add("open");
 toolModal.setAttribute("aria-hidden","false");
 document.body.style.overflow="hidden";
 renderPdfImages();
 setTimeout(()=>imageFiles.focus(),80);
}
function closeImagePdf(){
 toolModal.classList.remove("open");
 toolModal.setAttribute("aria-hidden","true");
 document.body.style.overflow="";
}
document.getElementById("closeTool").addEventListener("click",closeImagePdf);
document.querySelector("[data-close-tool]").addEventListener("click",closeImagePdf);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&toolModal.classList.contains("open"))closeImagePdf()});
imageFiles.addEventListener("change",e=>addFiles([...e.target.files]));
["dragenter","dragover"].forEach(ev=>uploadZone.addEventListener(ev,e=>{e.preventDefault();uploadZone.classList.add("dragover")}));
["dragleave","drop"].forEach(ev=>uploadZone.addEventListener(ev,e=>{e.preventDefault();uploadZone.classList.remove("dragover")}));
uploadZone.addEventListener("drop",e=>addFiles([...e.dataTransfer.files]));
uploadZone.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();imageFiles.click()}});

function addFiles(files){
 const valid=files.filter(f=>/^(image\/jpeg|image\/png)$/i.test(f.type));
 if(valid.length<files.length)showToast("Only JPG and PNG images are supported.");
 valid.forEach(file=>{
   pdfImages.push({file,url:URL.createObjectURL(file),rotation:0});
 });
 renderPdfImages();
}
function renderPdfImages(){
 fileCount.textContent=`${pdfImages.length} image${pdfImages.length===1?"":"s"}`;
 createPdf.disabled=pdfImages.length===0;
 pdfStatus.textContent=pdfImages.length?`${pdfImages.length} image${pdfImages.length===1?"":"s"} ready.`:"Add images to get started.";
 imageList.innerHTML=pdfImages.map((item,i)=>`
 <div class="image-item">
   <img class="image-thumb" src="${item.url}" style="transform:rotate(${item.rotation}deg)" alt="">
   <div class="image-meta"><b>${escapeHtml(item.file.name)}</b><small>${formatBytes(item.file.size)} · Page ${i+1}</small></div>
   <div class="image-actions">
    <button type="button" data-pdf-action="up" data-index="${i}" aria-label="Move up" ${i===0?"disabled":""}>↑</button>
    <button type="button" data-pdf-action="down" data-index="${i}" aria-label="Move down" ${i===pdfImages.length-1?"disabled":""}>↓</button>
    <button type="button" data-pdf-action="rotate" data-index="${i}" aria-label="Rotate">↻</button>
    <button type="button" data-pdf-action="remove" data-index="${i}" aria-label="Remove">×</button>
   </div>
 </div>`).join("");
 imageList.querySelectorAll("[data-pdf-action]").forEach(btn=>btn.addEventListener("click",()=>{
   const i=Number(btn.dataset.index),action=btn.dataset.pdfAction;
   if(action==="remove"){URL.revokeObjectURL(pdfImages[i].url);pdfImages.splice(i,1)}
   if(action==="rotate")pdfImages[i].rotation=(pdfImages[i].rotation+90)%360;
   if(action==="up"&&i>0)[pdfImages[i-1],pdfImages[i]]=[pdfImages[i],pdfImages[i-1]];
   if(action==="down"&&i<pdfImages.length-1)[pdfImages[i+1],pdfImages[i]]=[pdfImages[i],pdfImages[i+1]];
   renderPdfImages();
 }));
}
clearImages.addEventListener("click",()=>{pdfImages.forEach(x=>URL.revokeObjectURL(x.url));pdfImages=[];imageFiles.value="";renderPdfImages()});
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function formatBytes(n){if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(1)} KB`;return `${(n/1048576).toFixed(1)} MB`}

async function fileToDataUrl(file){
 return await new Promise((resolve,reject)=>{
   const reader=new FileReader();
   reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);
 });
}
async function createImagePdf(){
  const status=document.getElementById("pdfStatus");
  const btn=document.getElementById("createPdf");
  if(!pdfImages.length){
    status.textContent="Add at least one image.";
    return;
  }

  btn.disabled=true;
  status.textContent="Creating PDF locally…";

  try{
    const pageSize=document.getElementById("pageSize").value;
    const orientation=document.getElementById("orientation").value;
    const marginMm=Number(document.getElementById("margin").value)||0;

    const pages=[];
    for(const item of pdfImages){
      const info=await kwikImageToJpeg(item);
      const iw=info.imgWidth, ih=info.imgHeight;

      let pw,ph;
      if(pageSize==="letter"){
        pw=215.9; ph=279.4;
      }else if(pageSize==="image"){
        // Image-size mode: use the image's physical size at 96 CSS DPI.
        pw=iw*25.4/96 + marginMm*2;
        ph=ih*25.4/96 + marginMm*2;
        pw=Math.max(25,pw); ph=Math.max(25,ph);
      }else{
        pw=210; ph=297;
      }

      const landscape = orientation==="landscape" ||
        (orientation==="auto" && ((iw>ih && pageSize!=="image") || (pageSize==="image" && pw>ph)));
      if(pageSize!=="image"){
        if(landscape){ const t=pw; pw=ph; ph=t; }
      }

      const maxW=Math.max(1,pw-marginMm*2);
      const maxH=Math.max(1,ph-marginMm*2);
      const scale=Math.min(maxW/iw,maxH/ih);
      const w=iw*scale, h=ih*scale;
      const x=(pw-w)/2, y=(ph-h)/2;

      // Render the image onto a white page-sized canvas so the PDF is simple
      // and reliable across browsers/readers.
      const pxPerMm=96/25.4;
      const canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.round(pw*pxPerMm));
      canvas.height=Math.max(1,Math.round(ph*pxPerMm));
      const ctx=canvas.getContext("2d");
      ctx.fillStyle="#ffffff";
      ctx.fillRect(0,0,canvas.width,canvas.height);

      const img=new Image();
      await new Promise((resolve,reject)=>{
        img.onload=resolve; img.onerror=()=>reject(new Error("Could not render image."));
        img.src=item.url;
      });
      ctx.drawImage(
        img,
        Math.round(x*pxPerMm), Math.round(y*pxPerMm),
        Math.round(w*pxPerMm), Math.round(h*pxPerMm)
      );
      const jpeg=kwikDataUrlToBytes(canvas.toDataURL("image/jpeg",0.9));
      pages.push({
        width:pw*72/25.4,
        height:ph*72/25.4,
        imgWidth:canvas.width,
        imgHeight:canvas.height,
        jpeg
      });
    }

    const blob=kwikMakePdf(pages);
    const a=document.createElement("a");
    const date=new Date().toISOString().slice(0,10);
    a.href=URL.createObjectURL(blob);
    a.download=`KwikToolForAll-images-${date}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);

    status.textContent="✓ PDF created and downloaded.";
  }catch(err){
    console.error(err);
    status.textContent="Could not create the PDF. Please try again with JPG or PNG images.";
  }finally{
    btn.disabled=false;
  }
}

function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src})}
createPdf.addEventListener("click",createImagePdf);

function runSearch(q){search.value=q;render(q);document.getElementById("tools").scrollIntoView({behavior:"smooth",block:"start"})}
document.getElementById("searchForm").addEventListener("submit",e=>{e.preventDefault();runSearch(search.value)});
search.addEventListener("input",()=>render(search.value));
document.querySelectorAll("[data-query]").forEach(b=>b.addEventListener("click",()=>runSearch(b.dataset.query)));
document.querySelectorAll("[data-tool-id]").forEach(b=>b.addEventListener("click",()=>openTool(b.dataset.toolId)));
document.getElementById("clearSearch").addEventListener("click",()=>{search.value="";render();document.getElementById("tools").scrollIntoView({behavior:"smooth"})});
document.getElementById("resetSearch").addEventListener("click",()=>{search.value="";render()});
document.getElementById("searchFocus").addEventListener("click",()=>{search.focus();document.querySelector(".hero").scrollIntoView({behavior:"smooth"})});
document.addEventListener("keydown",e=>{if(e.key==="/"&&document.activeElement!==search&&!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){e.preventDefault();search.focus()}});
const themeBtn=document.getElementById("themeToggle"),saved=localStorage.getItem("kwikTheme");
if(saved==="dark"){document.body.classList.add("dark");themeBtn.textContent="☀";themeBtn.setAttribute("aria-pressed","true")}
themeBtn.addEventListener("click",()=>{const dark=document.body.classList.toggle("dark");themeBtn.textContent=dark?"☀":"☾";themeBtn.setAttribute("aria-pressed",String(dark));localStorage.setItem("kwikTheme",dark?"dark":"light")});
const mobile=document.getElementById("mobileMenu"),nav=document.querySelector(".main-nav");
mobile.addEventListener("click",()=>{const open=nav.classList.toggle("mobile-open");mobile.textContent=open?"×":"☰"});
document.querySelectorAll(".nav-link").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("mobile-open");mobile.textContent="☰"}));
const sections=[...document.querySelectorAll("main section[id]")],links=[...document.querySelectorAll(".nav-link")];
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){links.forEach(a=>a.classList.toggle("active",a.getAttribute("href")==="#"+entry.target.id))}}),{rootMargin:"-35% 0px -55% 0px",threshold:0});
sections.forEach(s=>observer.observe(s));
render();
