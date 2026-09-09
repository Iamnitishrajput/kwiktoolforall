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
 if(!pdfImages.length)return;
 if(!window.jspdf){showToast("PDF engine could not load. Check your internet connection and try again.");return}
 createPdf.disabled=true;pdfStatus.textContent="Creating PDF locally…";
 try{
   const {jsPDF}=window.jspdf;
   const size=pageSize.value, orient=orientation.value, m=Number(margin.value);
   let doc=null;
   for(let i=0;i<pdfImages.length;i++){
     const item=pdfImages[i];
     const data=await fileToDataUrl(item.file);
     const img=await loadImage(data);
     const rotated=(item.rotation/90)%2!==0;
     let pageW,pageH,format;
     if(size==="a4"){format="a4";pageW=210;pageH=297}
     else if(size==="letter"){format="letter";pageW=215.9;pageH=279.4}
     else {format="a4";pageW=210;pageH=297}
     let want=orient;
     if(want==="auto")want=(rotated||img.width>img.height)?"landscape":"portrait";
     if(want==="landscape")[pageW,pageH]=[pageH,pageW];
     if(i===0)doc=new jsPDF({orientation:want==="landscape"?"landscape":"portrait",unit:"mm",format});
     else doc.addPage(format,want==="landscape"?"landscape":"portrait");
     const availableW=pageW-m*2,availableH=pageH-m*2;
     let iw=img.width,ih=img.height;
     if(rotated)[iw,ih]=[ih,iw];
     const scale=Math.min(availableW/iw,availableH/ih);
     const w=iw*scale,h=ih*scale;
     const x=m+(availableW-w)/2,y=m+(availableH-h)/2;
     doc.addImage(data,item.file.type==="image/png"?"PNG":"JPEG",x,y,w,h,undefined,"FAST",item.rotation);
   }
   const stamp=new Date().toISOString().slice(0,10);
   doc.save(`KwikToolForAll-images-${stamp}.pdf`);
   pdfStatus.textContent="✓ PDF created and downloaded.";
   showToast("✓ PDF created locally. Your images were not uploaded.");
 }catch(err){
   console.error(err);pdfStatus.textContent="Could not create the PDF. Please try again.";
   showToast("Something went wrong while creating the PDF.");
 }finally{createPdf.disabled=false}
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
