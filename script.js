const tools=[
{id:'image-pdf',name:'Image → PDF',desc:'Convert JPG or PNG images into a clean PDF document.',icon:'▧',color:'red',keys:'image pdf convert'},
{id:'ocr',name:'Image → Text',desc:'Extract readable text from images and screenshots.',icon:'Aa',color:'blue',keys:'image text ocr'},
{id:'merge',name:'Merge PDF',desc:'Combine multiple PDF files into one document.',icon:'▤',color:'green',keys:'merge pdf'},
{id:'split',name:'Split PDF',desc:'Separate pages or ranges from a PDF file.',icon:'✂',color:'orange',keys:'split pdf'},
{id:'compress-pdf',name:'Compress PDF',desc:'Reduce PDF file size for easier sharing.',icon:'↘',color:'purple',keys:'compress pdf'},
{id:'pdf-image',name:'PDF → JPG / PNG',desc:'Convert PDF pages into image files.',icon:'▥',color:'teal',keys:'pdf jpg png convert'},
{id:'scanner',name:'Document Scanner',desc:'Scan and clean documents with your camera.',icon:'▤',color:'blue',keys:'document scanner scan'},
{id:'compress-image',name:'Compress Image',desc:'Reduce image size for email and sharing.',icon:'⌁',color:'green',keys:'compress image'},
{id:'jpg-png',name:'JPG ↔ PNG',desc:'Switch between common image formats.',icon:'⇄',color:'orange',keys:'jpg png image convert'},
{id:'share',name:'Share & Send',desc:'Share files with temporary processing and delivery.',icon:'↥',color:'purple',keys:'share send temporary'}
];
const $=id=>document.getElementById(id), grid=$('toolGrid'), search=$('toolSearch'), empty=$('emptyState'), toast=$('toast');
function showToast(msg){if(!toast)return;toast.textContent=msg;toast.classList.add('show');clearTimeout(window.__kwikToast);window.__kwikToast=setTimeout(()=>toast.classList.remove('show'),2600)}
function render(q=''){const term=q.trim().toLowerCase();const list=(term?tools:tools.slice(0,6)).filter(t=>!term||`${t.name} ${t.desc} ${t.keys}`.toLowerCase().includes(term));grid.innerHTML=list.map(t=>`<article class="tool-card"><div class="tool-icon ${t.color}">${t.icon}</div><h3>${t.name}</h3><p>${t.desc}</p><button class="open-tool ${t.color}" data-open="${t.id}">Open tool →</button></article>`).join('');empty.hidden=list.length>0;grid.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openTool(b.dataset.open))}
function openTool(id){const t=tools.find(x=>x.id===id);if(!t)return;if(id==='image-pdf'){openImagePdf();return}search.value=t.name;render(t.name);$('tools').scrollIntoView({behavior:'smooth',block:'start'});showToast(`${t.name} is selected. Its processing engine is coming next.`)}

const toolModal=$('toolModal'),imageFiles=$('imageFiles'),uploadZone=$('uploadZone'),imageList=$('imageList'),fileCount=$('fileCount'),createPdf=$('createPdf'),pdfStatus=$('pdfStatus'),clearImages=$('clearImages');
const pdfSuccess=$('pdfSuccess'),workspaceHead=document.querySelector('.workspace-head'),upload=$('uploadZone'),pagesSection=document.querySelector('.pdf-pages-section'),footer=$('pdfWorkspaceFooter');
const selectAll=$('selectAllPages'),bulkSettings=$('bulkSettings'),selectedCount=$('selectedCount'),bulkSize=$('bulkSize'),bulkOrientation=$('bulkOrientation'),bulkMargin=$('bulkMargin'),applySelected=$('applySelected'),pageCount=$('previewPageCount'),reuse=$('reusePdfTool');
let pdfImages=[],selected=new Set(),selectedPage=0,previewModal=null;
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function formatBytes(n){if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(1)} KB`;return `${(n/1048576).toFixed(1)} MB`}
function resetSuccess(){pdfSuccess.hidden=true;pdfSuccess.classList.remove('is-visible');[workspaceHead,upload,pagesSection,footer].forEach(x=>x&&x.classList.remove('tool-hidden'));clearImages.disabled=false;createPdf.disabled=pdfImages.length===0}
function showSuccess(){[workspaceHead,upload,pagesSection,footer].forEach(x=>x&&x.classList.add('tool-hidden'));pdfSuccess.hidden=false;requestAnimationFrame(()=>pdfSuccess.classList.add('is-visible'))}
function clearWorkspace(){pdfImages.forEach(x=>URL.revokeObjectURL(x.url));pdfImages=[];selected.clear();selectedPage=0;if(imageFiles)imageFiles.value='';closePreview();renderPdfImages();pdfStatus.textContent='Add images to get started.'}
function openImagePdf(){resetSuccess();toolModal.classList.add('open');toolModal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';renderPdfImages();setTimeout(()=>imageFiles.focus(),80)}
function closeImagePdf(){toolModal.classList.remove('open');toolModal.setAttribute('aria-hidden','true');document.body.style.overflow='';closePreview()}
$('closeTool').onclick=closeImagePdf;document.querySelector('[data-close-tool]').onclick=closeImagePdf;
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(previewModal?.classList.contains('open'))closePreview();else if(toolModal.classList.contains('open'))closeImagePdf()}});
imageFiles.addEventListener('change',e=>{addFiles([...e.target.files]);e.target.value='';});
const chooseFiles=document.querySelector('.choose-files');
if(chooseFiles) chooseFiles.addEventListener('click',e=>{e.stopPropagation();});
uploadZone.addEventListener('click',e=>{if(e.target.closest('button,select,input,.choose-files'))return;imageFiles.click();});
['dragenter','dragover'].forEach(ev=>uploadZone.addEventListener(ev,e=>{e.preventDefault();uploadZone.classList.add('dragover')}));
['dragleave','drop'].forEach(ev=>uploadZone.addEventListener(ev,e=>{e.preventDefault();uploadZone.classList.remove('dragover')}));
uploadZone.addEventListener('drop',e=>addFiles([...e.dataTransfer.files]));
uploadZone.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();imageFiles.click()}});
clearImages.onclick=clearWorkspace;
selectAll.onclick=()=>{if(!pdfImages.length)return;if(selected.size===pdfImages.length)selected.clear();else pdfImages.forEach((_,i)=>selected.add(i));renderPdfImages()};
applySelected.onclick=()=>{const n=selected.size;if(!n)return;selected.forEach(i=>{pdfImages[i].pageSize=bulkSize.value;pdfImages[i].orientation=bulkOrientation.value;pdfImages[i].margin=Number(bulkMargin.value)});renderPdfImages();showToast(`Applied settings to ${n} selected page${n===1?'':'s'}.`)};
reuse.onclick=()=>{clearWorkspace();resetSuccess();showToast('Workspace cleared. You can start again.')};
function addFiles(files){const valid=files.filter(f=>/^(image\/jpeg|image\/png)$/i.test(f.type)||/\.(jpe?g|png)$/i.test(f.name));if(valid.length<files.length)showToast('Only JPG and PNG images are supported.');valid.forEach(file=>{const item={file,url:URL.createObjectURL(file),rotation:0,naturalWidth:0,naturalHeight:0,pageSize:'a4',orientation:'auto',margin:10};pdfImages.push(item);loadNaturalSize(item)});renderPdfImages()}
function loadNaturalSize(item){const img=new Image();img.onload=()=>{item.naturalWidth=img.naturalWidth;item.naturalHeight=img.naturalHeight;renderPdfImages()};img.onerror=()=>{const i=pdfImages.indexOf(item);if(i>-1){URL.revokeObjectURL(item.url);pdfImages.splice(i,1);renderPdfImages()}showToast(`Could not read ${item.file.name}. Please choose a JPG or PNG image.`)};img.src=item.url}
function getSpec(item){const iw=item.naturalWidth||1000,ih=item.naturalHeight||1400,mm=Number(item.margin)||0;let pw=210,ph=297;if(item.pageSize==='letter'){pw=215.9;ph=279.4}if(item.pageSize==='image'){pw=Math.max(25,iw*25.4/96+mm*2);ph=Math.max(25,ih*25.4/96+mm*2)}if(item.orientation==='landscape'&&ph>pw)[pw,ph]=[ph,pw];if(item.orientation==='portrait'&&pw>ph)[pw,ph]=[ph,pw];if(item.orientation==='auto'&&item.pageSize!=='image'&&iw>ih)[pw,ph]=[ph,pw];return{pw,ph,iw,ih,mm}}
function renderPdfImages(){
  if(!imageList)return;
  fileCount.textContent=`${pdfImages.length} image${pdfImages.length===1?'':'s'}`;
  createPdf.disabled=pdfImages.length===0;
  pdfStatus.textContent=pdfImages.length?`${pdfImages.length} image${pdfImages.length===1?'':'s'} ready.`:'Add images to get started.';
  pageCount.textContent=`${pdfImages.length} page${pdfImages.length===1?'':'s'}`;
  selected=new Set([...selected].filter(i=>i>=0&&i<pdfImages.length));
  selectedCount.textContent=`${selected.size} selected`;
  bulkSettings.hidden=selected.size===0;
  selectAll.textContent=pdfImages.length&&selected.size===pdfImages.length?'Clear all':'Select all';
  if(!pdfImages.length){imageList.innerHTML='<div class="pages-empty">Add images above to build your document.</div>';return}

  imageList.innerHTML=pdfImages.map((item,i)=>`<article class="image-row ${i===selectedPage?'preview-selected':''}" data-page-row="${i}">
    <div class="page-card-main">
      <label class="page-select">
        <input class="page-check" type="checkbox" data-select="${i}" ${selected.has(i)?'checked':''}>
        <span class="image-thumb" data-preview="${i}" title="Click to preview">
          <img src="${item.url}" alt="Page ${i+1}">
        </span>
        <span class="image-meta">
          <strong>Page ${i+1} · ${escapeHtml(item.file.name)}</strong>
          <small>${formatBytes(item.file.size)} · ${item.pageSize==='image'?'Image size':item.pageSize.toUpperCase()} · ${item.orientation} · ${item.margin} mm margin</small>
        </span>
      </label>
      <div class="image-actions">
        <button type="button" class="preview-page-btn" data-preview="${i}" title="Live preview" aria-label="Preview page ${i+1}">◉</button>
        <button type="button" data-action="up" data-i="${i}" ${i===0?'disabled':''}>↑</button>
        <button type="button" data-action="down" data-i="${i}" ${i===pdfImages.length-1?'disabled':''}>↓</button>
        <button type="button" data-action="rotate" data-i="${i}">↻</button>
        <button type="button" data-action="remove" data-i="${i}">×</button>
      </div>
    </div>
    <div class="page-settings">
      <label>Size<select data-setting="pageSize" data-i="${i}"><option value="a4" ${item.pageSize==='a4'?'selected':''}>A4</option><option value="letter" ${item.pageSize==='letter'?'selected':''}>Letter</option><option value="image" ${item.pageSize==='image'?'selected':''}>Image</option></select></label>
      <label>Orientation<select data-setting="orientation" data-i="${i}"><option value="auto" ${item.orientation==='auto'?'selected':''}>Auto</option><option value="portrait" ${item.orientation==='portrait'?'selected':''}>Portrait</option><option value="landscape" ${item.orientation==='landscape'?'selected':''}>Landscape</option></select></label>
      <label>Margin<select data-setting="margin" data-i="${i}"><option value="10" ${item.margin===10?'selected':''}>10</option><option value="5" ${item.margin===5?'selected':''}>5</option><option value="0" ${item.margin===0?'selected':''}>0</option></select></label>
    </div>
  </article>`).join('');

  imageList.querySelectorAll('.page-check').forEach(x=>x.addEventListener('change',e=>{
    e.stopPropagation();
    const i=Number(x.dataset.select);
    x.checked?selected.add(i):selected.delete(i);
    selectedPage=i;
    renderPdfImages();
  }));

  imageList.querySelectorAll('[data-preview]').forEach(x=>x.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    const i=Number(x.dataset.preview);
    if(pdfImages[i]){selectedPage=i;openPreview(i);}
  }));

  imageList.querySelectorAll('.image-meta').forEach(x=>x.addEventListener('click',e=>{
    e.preventDefault();
    e.stopPropagation();
    const row=x.closest('[data-page-row]');
    const i=Number(row.dataset.pageRow);
    if(pdfImages[i]){selectedPage=i;openPreview(i);}
  }));

  imageList.querySelectorAll('.page-select').forEach(x=>x.addEventListener('click',e=>{
    if(e.target.closest('.page-check')||e.target.closest('.image-thumb')||e.target.closest('.image-meta'))return;
    const row=x.closest('[data-page-row]'),i=Number(row.dataset.pageRow);
    if(pdfImages[i]){selectedPage=i;openPreview(i);}
  }));

  imageList.querySelectorAll('[data-setting]').forEach(x=>x.addEventListener('change',e=>{
    e.stopPropagation();
    const i=Number(x.dataset.i);
    pdfImages[i][x.dataset.setting]=x.dataset.setting==='margin'?Number(x.value):x.value;
    selectedPage=i;
    renderPdfImages();
  }));

  imageList.querySelectorAll('[data-action]').forEach(x=>x.addEventListener('click',e=>{
    e.stopPropagation();
    pageAction(x.dataset.action,Number(x.dataset.i));
  }));
}
function pageAction(action,i){if(action==='remove'){URL.revokeObjectURL(pdfImages[i].url);pdfImages.splice(i,1);selected=new Set([...selected].filter(x=>x!==i).map(x=>x>i?x-1:x));selectedPage=Math.min(selectedPage,Math.max(0,pdfImages.length-1))}else if(action==='up'&&i>0){[pdfImages[i-1],pdfImages[i]]=[pdfImages[i],pdfImages[i-1]];remapSelection(i,i-1);selectedPage=i-1}else if(action==='down'&&i<pdfImages.length-1){[pdfImages[i+1],pdfImages[i]]=[pdfImages[i],pdfImages[i+1]];remapSelection(i,i+1);selectedPage=i+1}else if(action==='rotate'){pdfImages[i].rotation=(pdfImages[i].rotation+90)%360;selectedPage=i}renderPdfImages()}
function remapSelection(a,b){const n=new Set();selected.forEach(x=>n.add(x===a?b:x===b?a:x));selected=n}
function makePreview(){if(previewModal)return;previewModal=document.createElement('div');previewModal.className='kwik-preview-modal';previewModal.innerHTML=`<div class="kwik-preview-backdrop"></div><section class="kwik-preview-card" role="dialog" aria-modal="true"><header><strong id="kwikPreviewTitle">Live preview</strong><button id="kwikPreviewClose" type="button">×</button></header><div class="kwik-preview-body"><div class="kwik-preview-stage" id="kwikPreviewStage"></div><aside><label>Page size<select id="pvSize"><option value="a4">A4</option><option value="letter">Letter</option><option value="image">Image size</option></select></label><label>Orientation<select id="pvOrientation"><option value="auto">Auto</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label><label>Margin<select id="pvMargin"><option value="10">10 mm</option><option value="5">5 mm</option><option value="0">No margin</option></select></label><button id="pvRotate" type="button">↻ Rotate image</button><button id="pvDone" class="primary" type="button">Done</button><p>Changes are saved to this page immediately.</p></aside></div></section>`;document.body.appendChild(previewModal);$('kwikPreviewClose').onclick=closePreview;$('pvDone').onclick=closePreview;previewModal.querySelector('.kwik-preview-backdrop').onclick=closePreview;$('pvSize').onchange=()=>{pdfImages[selectedPage].pageSize=$('pvSize').value;renderPreview();renderPdfImages()};$('pvOrientation').onchange=()=>{pdfImages[selectedPage].orientation=$('pvOrientation').value;renderPreview();renderPdfImages()};$('pvMargin').onchange=()=>{pdfImages[selectedPage].margin=Number($('pvMargin').value);renderPreview();renderPdfImages()};$('pvRotate').onclick=()=>{pdfImages[selectedPage].rotation=(pdfImages[selectedPage].rotation+90)%360;renderPreview();renderPdfImages()}}
function openPreview(i){if(!pdfImages[i])return;selectedPage=i;makePreview();previewModal.classList.add('open');renderPreview()}
function closePreview(){previewModal?.classList.remove('open')}
function renderPreview(){const item=pdfImages[selectedPage];if(!item||!previewModal)return;const s=getSpec(item),stage=$('kwikPreviewStage');$('kwikPreviewTitle').textContent=`Page ${selectedPage+1} of ${pdfImages.length} · Live preview`;$('pvSize').value=item.pageSize;$('pvOrientation').value=item.orientation;$('pvMargin').value=String(item.margin);stage.innerHTML='';const maxW=Math.max(260,stage.clientWidth-60),maxH=Math.max(320,stage.clientHeight-60),scale=Math.min(maxW/s.pw,maxH/s.ph),paper=document.createElement('div');paper.className='kwik-paper';paper.style.width=`${s.pw*scale}px`;paper.style.height=`${s.ph*scale}px`;const img=document.createElement('img');img.src=item.url;const fit=Math.min((s.pw-s.mm*2)/s.iw,(s.ph-s.mm*2)/s.ih);img.style.width=`${s.iw*fit*scale}px`;img.style.height=`${s.ih*fit*scale}px`;img.style.transform=`rotate(${item.rotation}deg)`;paper.appendChild(img);stage.appendChild(paper)}
function dataUrlBytes(u){const b64=u.split(',')[1]||'',bin=atob(b64),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return a}
async function createPdfFile(){if(!pdfImages.length)return;createPdf.disabled=true;pdfStatus.textContent='Creating your PDF…';try{const enc=new TextEncoder(),chunks=[],offsets=[0];let pos=0;const push=s=>{const b=typeof s==='string'?enc.encode(s):s;chunks.push(b);pos+=b.length};push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');const objs=[],add=x=>(objs.push(x),objs.length),catalog=add(null),pagesId=add(null),pids=[],cids=[],iids=[];for(const item of pdfImages){const s=getSpec(item),img=new Image();await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=item.url});const pt=72/25.4,w=Math.max(1,Math.round(s.pw*pt)),h=Math.max(1,Math.round(s.ph*pt)),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);const fit=Math.min((s.pw-s.mm*2)/s.iw,(s.ph-s.mm*2)/s.ih),dw=s.iw*fit*pt,dh=s.ih*fit*pt;ctx.save();ctx.translate(w/2,h/2);ctx.rotate(item.rotation*Math.PI/180);ctx.drawImage(img,-dw/2,-dh/2,dw,dh);ctx.restore();const jpeg=dataUrlBytes(canvas.toDataURL('image/jpeg',.92));iids.push(add({dict:`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`,stream:jpeg}));const cb=enc.encode(`q\n${w} 0 0 ${h} 0 0 cm\n/Im0 Do\nQ\n`);cids.push(add({dict:`<< /Length ${cb.length} >>`,stream:cb}));pids.push(add(null))}objs[catalog-1]=`<< /Type /Catalog /Pages ${pagesId} 0 R >>`;objs[pagesId-1]=`<< /Type /Pages /Kids [${pids.map(x=>x+' 0 R').join(' ')}] /Count ${pids.length} >>`;for(let i=0;i<pids.length;i++){const id=iids[i],d=objs[id-1].dict,w=Number(d.match(/\/Width (\d+)/)[1]),h=Number(d.match(/\/Height (\d+)/)[1]);objs[pids[i]-1]=`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${id} 0 R >> >> /Contents ${cids[i]} 0 R >>`}objs.forEach((o,i)=>{offsets[i+1]=pos;push(`${i+1} 0 obj\n`);if(typeof o==='string')push(o+'\nendobj\n');else{push(o.dict+'\nstream\n');push(o.stream);push('\nendstream\nendobj\n')}});const xref=pos;push(`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`);for(let i=1;i<=objs.length;i++)push(String(offsets[i]).padStart(10,'0')+' 00000 n \n');push(`trailer\n<< /Size ${objs.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`);const url=URL.createObjectURL(new Blob(chunks,{type:'application/pdf'})),a=document.createElement('a');a.href=url;a.download=`KwikToolForAll_${new Date().toISOString().slice(0,10)}.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);clearWorkspace();showSuccess()}catch(e){console.error(e);pdfStatus.textContent='Something went wrong. Your images are still here.';createPdf.disabled=false;showToast('Could not create the PDF. Please try again.')}}
createPdf.onclick=createPdfFile;
$('searchForm').onsubmit=e=>{e.preventDefault();render(search.value);$('tools').scrollIntoView({behavior:'smooth',block:'start'})};document.querySelectorAll('[data-query]').forEach(b=>b.onclick=()=>{search.value=b.dataset.query;render(b.dataset.query);$('tools').scrollIntoView({behavior:'smooth',block:'start'})});$('clearSearch').onclick=()=>{search.value='';render()};$('resetSearch').onclick=()=>{search.value='';render()};$('searchFocus').onclick=()=>{search.focus();window.scrollTo({top:0,behavior:'smooth'})};$('themeToggle').onclick=()=>document.body.classList.toggle('dark-mode');$('mobileMenu').onclick=()=>document.querySelector('.main-nav')?.classList.toggle('mobile-open');
render();
