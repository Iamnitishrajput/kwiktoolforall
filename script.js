const tools=[
{id:'image-pdf',name:'Image → PDF',desc:'Convert JPG or PNG images into a clean PDF document.',icon:'▧',color:'red',keys:'image pdf convert'},
{id:'merge',name:'Merge PDF',desc:'Combine multiple PDF files into one document.',icon:'▤',color:'green',keys:'merge pdf combine'},
{id:'split',name:'Split PDF',desc:'Extract selected pages or ranges into a new PDF.',icon:'✂',color:'orange',keys:'split pdf pages'},
{id:'compress-pdf',name:'Compress PDF',desc:'Reduce PDF file size while keeping useful quality.',icon:'↘',color:'purple',keys:'compress pdf reduce size'},
{id:'resize-image',name:'Resize & Photo Size',desc:'Resize, crop and prepare images for documents, social media and printing.',icon:'↔',color:'blue',keys:'resize image photo passport passport size id visa dimensions'},
{id:'compress-image',name:'Compress Image',desc:'Reduce image file size with clear quality choices.',icon:'⌁',color:'purple',keys:'compress image size'}
];
const $=id=>document.getElementById(id), grid=$('toolGrid'), search=$('toolSearch'), empty=$('emptyState'), toast=$('toast');
function showToast(msg){if(!toast)return;toast.textContent=msg;toast.classList.add('show');clearTimeout(window.__kwikToast);window.__kwikToast=setTimeout(()=>toast.classList.remove('show'),2600)}
function render(q=''){const term=q.trim().toLowerCase();const list=(term?tools:tools.slice(0,6)).filter(t=>!term||`${t.name} ${t.desc} ${t.keys}`.toLowerCase().includes(term));grid.innerHTML=list.map(t=>`<article class="tool-card"><div class="tool-icon ${t.color}">${t.icon}</div><h3>${t.name}</h3><p>${t.desc}</p><button class="open-tool ${t.color}" data-open="${t.id}">Open tool →</button></article>`).join('');empty.hidden=list.length>0;grid.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openTool(b.dataset.open))}
function toolUrl(id){return ({'image-pdf':'image-to-pdf.html','merge':'merge-pdf.html','split':'split-pdf.html','compress-pdf':'compress-pdf.html','resize-image':'resize-photo.html','compress-image':'compress-image.html'})[id]||'index.html'}
function openTool(id){const t=tools.find(x=>x.id===id);if(!t)return;window.location.href=toolUrl(id)}

const toolModal=$('toolModal'),imageFiles=$('imageFiles'),uploadZone=$('uploadZone'),imageList=$('imageList'),fileCount=$('fileCount'),createPdf=$('createPdf'),pdfStatus=$('pdfStatus'),clearImages=$('clearImages');
const pdfSuccess=$('pdfSuccess'),workspaceHead=document.querySelector('.workspace-head'),upload=$('uploadZone'),fileToolbar=document.querySelector('.file-toolbar'),pagesSection=document.querySelector('.pdf-pages-section'),footer=$('pdfWorkspaceFooter');
const selectAll=$('selectAllPages'),bulkSettings=$('bulkSettings'),selectedCount=$('selectedCount'),bulkSize=$('bulkSize'),bulkOrientation=$('bulkOrientation'),bulkMargin=$('bulkMargin'),applySelected=$('applySelected'),pageCount=$('previewPageCount'),reuse=$('reusePdfTool');
let pdfImages=[],selected=new Set(),selectedPage=0,previewModal=null;
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function formatBytes(n){if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(1)} KB`;return `${(n/1048576).toFixed(1)} MB`}
function resetSuccess(){pdfSuccess.hidden=true;pdfSuccess.classList.remove('is-visible');[workspaceHead,upload,fileToolbar,pagesSection,footer].forEach(x=>x&&x.classList.remove('tool-hidden'));clearImages.disabled=false;createPdf.disabled=pdfImages.length===0}
function showSuccess(){[workspaceHead,upload,fileToolbar,pagesSection,footer].forEach(x=>x&&x.classList.add('tool-hidden'));pdfSuccess.hidden=false;requestAnimationFrame(()=>pdfSuccess.classList.add('is-visible'))}
function clearWorkspace(){pdfImages.forEach(x=>URL.revokeObjectURL(x.url));pdfImages=[];selected.clear();selectedPage=0;if(imageFiles)imageFiles.value='';closePreview();renderPdfImages();pdfStatus.textContent='Add images to get started.'}
function openImagePdf(){closeUtility();resetSuccess();toolModal.classList.add('open');toolModal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';renderPdfImages();setTimeout(()=>imageFiles?.focus(),80)}
function closeImagePdf(){if(!toolModal)return;toolModal.classList.remove('open');toolModal.setAttribute('aria-hidden','true');document.body.style.overflow='';closePreview()}
$('closeTool')?.addEventListener('click',closeActiveTool);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(previewModal?.classList.contains('open'))closePreview();else if($('utilityModal')?.classList.contains('open'))closeUtility();else if(toolModal?.classList.contains('open'))closeImagePdf()}});
if(imageFiles) imageFiles.addEventListener('change',e=>{addFiles([...e.target.files]);e.target.value='';});
const chooseFiles=document.querySelector('.choose-files');
if(chooseFiles) chooseFiles.addEventListener('click',e=>{e.stopPropagation();});
if(uploadZone) uploadZone.addEventListener('click',e=>{if(e.target.closest('button,select,input,.choose-files'))return;imageFiles?.click();});
if(uploadZone) ['dragenter','dragover'].forEach(ev=>uploadZone.addEventListener(ev,e=>{e.preventDefault();uploadZone.classList.add('dragover')}));
if(uploadZone) ['dragleave','drop'].forEach(ev=>uploadZone.addEventListener(ev,e=>{e.preventDefault();uploadZone.classList.remove('dragover')}));
if(uploadZone) uploadZone.addEventListener('drop',e=>addFiles([...e.dataTransfer.files]));
if(uploadZone) uploadZone.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();imageFiles?.click()}});
if(clearImages) clearImages.onclick=clearWorkspace;
if(selectAll) selectAll.onclick=()=>{if(!pdfImages.length)return;if(selected.size===pdfImages.length)selected.clear();else pdfImages.forEach((_,i)=>selected.add(i));renderPdfImages()};
if(applySelected) applySelected.onclick=()=>{const n=selected.size;if(!n)return;selected.forEach(i=>{pdfImages[i].pageSize=bulkSize.value;pdfImages[i].orientation=bulkOrientation.value;pdfImages[i].margin=Number(bulkMargin.value)});renderPdfImages();showToast(`Applied settings to ${n} selected page${n===1?'':'s'}.`)};
if(reuse) reuse.onclick=()=>{clearWorkspace();resetSuccess();showToast('Workspace cleared. You can start again.')};
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
          <img src="${item.url}" alt="Page ${i+1}" style="transform:rotate(${item.rotation}deg);transform-origin:center center;">
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

  imageList.querySelectorAll('[data-action]').forEach(x=>{
    x.onclick=e=>{
      e.preventDefault();
      e.stopPropagation();
      pageAction(x.dataset.action,Number(x.dataset.i));
    };
  });
}
function pageAction(action,i){
  const item=pdfImages[i];
  if(!item)return;
  if(action==='remove'){URL.revokeObjectURL(item.url);pdfImages.splice(i,1);selected=new Set([...selected].filter(x=>x!==i).map(x=>x>i?x-1:x));selectedPage=Math.min(selectedPage,Math.max(0,pdfImages.length-1));closePreview()}
  else if(action==='up'&&i>0){[pdfImages[i-1],pdfImages[i]]=[pdfImages[i],pdfImages[i-1]];remapSelection(i,i-1);selectedPage=i-1}
  else if(action==='down'&&i<pdfImages.length-1){[pdfImages[i+1],pdfImages[i]]=[pdfImages[i],pdfImages[i+1]];remapSelection(i,i+1);selectedPage=i+1}
  else if(action==='rotate'){
    item.rotation=(Number(item.rotation||0)+90)%360;
    selectedPage=i;
  }
  renderPdfImages();
  if(previewModal?.classList.contains('open') && pdfImages[selectedPage]) renderPreview();
}
function remapSelection(a,b){const n=new Set();selected.forEach(x=>n.add(x===a?b:x===b?a:x));selected=n}
function makePreview(){if(previewModal)return;previewModal=document.createElement('div');previewModal.className='kwik-preview-modal';previewModal.innerHTML=`<div class="kwik-preview-backdrop"></div><section class="kwik-preview-card" role="dialog" aria-modal="true"><header><strong id="kwikPreviewTitle">Live preview</strong><button id="kwikPreviewClose" type="button">×</button></header><div class="kwik-preview-body"><div class="kwik-preview-stage" id="kwikPreviewStage"></div><aside><label>Page size<select id="pvSize"><option value="a4">A4</option><option value="letter">Letter</option><option value="image">Image size</option></select></label><label>Orientation<select id="pvOrientation"><option value="auto">Auto</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label><label>Margin<select id="pvMargin"><option value="10">10 mm</option><option value="5">5 mm</option><option value="0">No margin</option></select></label><button id="pvRotate" type="button">↻ Rotate image</button><button id="pvDone" class="primary" type="button">Done</button><p>Changes are saved to this page immediately.</p></aside></div></section>`;document.body.appendChild(previewModal);$('kwikPreviewClose').onclick=closePreview;$('pvDone').onclick=closePreview;previewModal.querySelector('.kwik-preview-backdrop').onclick=closePreview;$('pvSize').onchange=()=>{pdfImages[selectedPage].pageSize=$('pvSize').value;renderPreview();renderPdfImages()};$('pvOrientation').onchange=()=>{pdfImages[selectedPage].orientation=$('pvOrientation').value;renderPreview();renderPdfImages()};$('pvMargin').onchange=()=>{pdfImages[selectedPage].margin=Number($('pvMargin').value);renderPreview();renderPdfImages()};$('pvRotate').onclick=()=>{pdfImages[selectedPage].rotation=(pdfImages[selectedPage].rotation+90)%360;renderPreview();renderPdfImages()}}
function openPreview(i){if(!pdfImages[i])return;selectedPage=i;makePreview();previewModal.classList.add('open');renderPreview()}
function closePreview(){previewModal?.classList.remove('open')}
function renderPreview(){
  const item=pdfImages[selectedPage];
  if(!item||!previewModal)return;
  const s=getSpec(item),stage=$('kwikPreviewStage');
  $('kwikPreviewTitle').textContent=`Page ${selectedPage+1} of ${pdfImages.length} · Live preview`;
  $('pvSize').value=item.pageSize;$('pvOrientation').value=item.orientation;$('pvMargin').value=String(item.margin);
  stage.innerHTML='';
  const maxW=Math.max(260,stage.clientWidth-60),maxH=Math.max(320,stage.clientHeight-60);
  const rotated=item.rotation%180!==0;
  const contentW=rotated?s.ih:s.iw,contentH=rotated?s.iw:s.ih;
  const fit=Math.min((s.pw-s.mm*2)/contentW,(s.ph-s.mm*2)/contentH);
  const scale=Math.min(maxW/s.pw,maxH/s.ph);
  const paper=document.createElement('div');
  paper.className='kwik-paper';paper.style.width=`${s.pw*scale}px`;paper.style.height=`${s.ph*scale}px`;
  const img=document.createElement('img');
  img.src=item.url;img.alt=`Page ${selectedPage+1}`;
  img.style.width=`${s.iw*fit*scale}px`;img.style.height=`${s.ih*fit*scale}px`;
  img.style.maxWidth='none';img.style.maxHeight='none';img.style.transform=`rotate(${item.rotation}deg)`;
  img.style.transformOrigin='center center';
  paper.appendChild(img);stage.appendChild(paper);
}

function dataUrlBytes(u){const b64=u.split(',')[1]||'',bin=atob(b64),a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return a}
async function createPdfFile(){if(!pdfImages.length)return;createPdf.disabled=true;pdfStatus.textContent='Creating your PDF…';try{const enc=new TextEncoder(),chunks=[],offsets=[0];let pos=0;const push=s=>{const b=typeof s==='string'?enc.encode(s):s;chunks.push(b);pos+=b.length};push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');const objs=[],add=x=>(objs.push(x),objs.length),catalog=add(null),pagesId=add(null),pids=[],cids=[],iids=[];for(const item of pdfImages){const s=getSpec(item),img=new Image();await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src=item.url});const pt=72/25.4,w=Math.max(1,Math.round(s.pw*pt)),h=Math.max(1,Math.round(s.ph*pt)),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);const fit=Math.min((s.pw-s.mm*2)/s.iw,(s.ph-s.mm*2)/s.ih),dw=s.iw*fit*pt,dh=s.ih*fit*pt;ctx.save();ctx.translate(w/2,h/2);ctx.rotate(item.rotation*Math.PI/180);ctx.drawImage(img,-dw/2,-dh/2,dw,dh);ctx.restore();const jpeg=dataUrlBytes(canvas.toDataURL('image/jpeg',.92));iids.push(add({dict:`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>`,stream:jpeg}));const cb=enc.encode(`q\n${w} 0 0 ${h} 0 0 cm\n/Im0 Do\nQ\n`);cids.push(add({dict:`<< /Length ${cb.length} >>`,stream:cb}));pids.push(add(null))}objs[catalog-1]=`<< /Type /Catalog /Pages ${pagesId} 0 R >>`;objs[pagesId-1]=`<< /Type /Pages /Kids [${pids.map(x=>x+' 0 R').join(' ')}] /Count ${pids.length} >>`;for(let i=0;i<pids.length;i++){const id=iids[i],d=objs[id-1].dict,w=Number(d.match(/\/Width (\d+)/)[1]),h=Number(d.match(/\/Height (\d+)/)[1]);objs[pids[i]-1]=`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${id} 0 R >> >> /Contents ${cids[i]} 0 R >>`}objs.forEach((o,i)=>{offsets[i+1]=pos;push(`${i+1} 0 obj\n`);if(typeof o==='string')push(o+'\nendobj\n');else{push(o.dict+'\nstream\n');push(o.stream);push('\nendstream\nendobj\n')}});const xref=pos;push(`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`);for(let i=1;i<=objs.length;i++)push(String(offsets[i]).padStart(10,'0')+' 00000 n \n');push(`trailer\n<< /Size ${objs.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`);const url=URL.createObjectURL(new Blob(chunks,{type:'application/pdf'})),a=document.createElement('a');a.href=url;a.download=`KwikToolForAll_${new Date().toISOString().slice(0,10)}.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);clearWorkspace();showSuccess()}catch(e){console.error(e);pdfStatus.textContent='Something went wrong. Your images are still here.';createPdf.disabled=false;showToast('Could not create the PDF. Please try again.')}}
if(createPdf) createPdf.onclick=createPdfFile;
if($('searchForm')) $('searchForm').onsubmit=e=>{e.preventDefault();render(search.value);$('tools').scrollIntoView({behavior:'smooth',block:'start'})}; if($('resetSearch')) $('resetSearch').onclick=()=>{search.value='';render()}; if($('searchFocus')) $('searchFocus').onclick=()=>{if(document.body.classList.contains('tool-page')){window.location.href='index.html#tools';return} search.focus();window.scrollTo({top:0,behavior:'smooth'})};
function syncThemeToggle(){const dark=document.body.classList.contains('dark'),btn=$('themeToggle');if(!btn)return;btn.textContent=dark?'☾':'☀';btn.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');btn.setAttribute('aria-pressed',dark?'true':'false');btn.classList.toggle('is-dark',dark)}
if($('themeToggle')) $('themeToggle').onclick=()=>{document.body.classList.toggle('dark');localStorage.setItem('kwik-theme',document.body.classList.contains('dark')?'dark':'light');syncThemeToggle()};if(localStorage.getItem('kwik-theme')==='dark')document.body.classList.add('dark');syncThemeToggle();if($('mobileMenu')) $('mobileMenu').onclick=()=>document.querySelector('.main-nav')?.classList.toggle('mobile-open');
/* Stable utilities */
function openToolModal(){toolModal.classList.add('open');toolModal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
function openUtility(id){
  const u={merge:['PDF TOOL','Merge PDF','Combine multiple PDF files into one PDF locally.'],split:['PDF TOOL','Split PDF','Extract selected pages or ranges into a new PDF locally.'],'compress-pdf':['PDF TOOL','Compress PDF','Choose how much to reduce the PDF while keeping useful quality.'],'resize-image':['IMAGE TOOL','Resize & Photo Size','Resize, crop and prepare images for documents, social media and printing.'],'compress-image':['IMAGE TOOL','Compress Image','Reduce image size with a quality level you control.']}[id];
  const renderer={merge:renderMergeTool,split:renderSplitTool,'compress-pdf':renderCompressPdfTool,'resize-image':renderResizeTool,'compress-image':renderCompressTool}[id];
  if(!u||!renderer)return;
  closeImagePdf();
  window.__utilityId=id;
  const modal=$('utilityModal');
  $('utilityKicker').textContent=u[0]; $('utilityTitle').textContent=u[1]; $('utilityDesc').textContent=u[2]; $('utilityStatus').textContent='Ready.';
  modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden';
  const body=$('utilityBody'); body.innerHTML=''; renderer(body);
}
function closeUtility(){const modal=$('utilityModal');if(!modal)return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.style.overflow='';if($('utilityBody'))$('utilityBody').innerHTML='';}
function utilityUploadMarkup(id,multiple){return `<div class="utility-upload"><div class="utility-upload-icon">↥</div><h3>${id==='merge'?'Choose PDF files':'Choose a PDF file'}</h3><p>${id==='merge'?'Select two or more PDFs in the order you want them combined.':'Choose a PDF to process locally.'}</p><label class="choose-files">Choose files<input id="utilityFiles" type="file" accept="application/pdf" ${multiple?'multiple':''} hidden></label><div class="utility-file-list" id="utilityFileList"></div></div>`}
function renderMergeTool(body){
  body.innerHTML=`
    <div class="merge-toolbar-top">
      <div><strong>Organize your PDFs</strong><span id="mergeSummary">Add at least 2 PDF files to begin.</span></div>
      <div class="merge-top-actions"><button type="button" class="merge-secondary" id="mergeSort">Sort A–Z</button><button type="button" class="merge-secondary" id="mergeReset">Reset order</button></div>
    </div>
    <div class="merge-dropzone" id="mergeDropzone"><div class="utility-upload-icon">↥</div><h3>Drop PDF files here</h3><p>Add multiple PDFs, then arrange files or individual pages before merging.</p><label class="choose-files">Add PDF files<input id="utilityFiles" type="file" accept="application/pdf" multiple hidden></label><small>Files stay in your browser and are processed locally.</small></div>
    <div class="merge-filebar"><strong>Files</strong><button type="button" class="text-btn" id="mergeAddMore">+ Add more</button></div>
    <div class="merge-source-list" id="mergeSourceList"></div>
    <div class="merge-pagebar"><div><strong>Pages</strong><span id="mergePageHint">Arrange individual pages below.</span></div><div class="merge-bulk-actions"><button type="button" class="merge-secondary" id="mergeSelectAll">Select all</button><button type="button" class="merge-secondary" id="mergeRotateSelected" disabled>↻ Rotate</button><button type="button" class="merge-secondary danger" id="mergeDeleteSelected" disabled>× Delete</button></div></div>
    <div class="merge-pages" id="mergePages"><div class="merge-empty">Your PDF pages will appear here.</div></div>
    <div class="merge-output"><label>Output filename<input id="mergeFilename" value="KwikToolForAll_Merged.pdf" maxlength="120"></label><div class="merge-output-meta" id="mergeOutputMeta">No pages ready yet.</div></div>
    <div class="utility-actions"><button class="primary-action" id="mergeRun" disabled>Merge PDF →</button></div>`;

  const input=$('utilityFiles'),drop=$('mergeDropzone'),sourceList=$('mergeSourceList'),pagesEl=$('mergePages'),run=$('mergeRun');
  const summary=$('mergeSummary'),pageHint=$('mergePageHint'),outputMeta=$('mergeOutputMeta');
  const sources=[],pages=[],selected=new Set();let dragPage=null;
  const updateStatus=text=>{$('utilityStatus').textContent=text};
  const syncPageOrderToSources=()=>{const ordered=[];sources.forEach(s=>pages.filter(p=>p.sourceId===s.id).forEach(p=>ordered.push(p)));pages.splice(0,pages.length,...ordered)};
  const updateSummary=()=>{const totalBytes=sources.reduce((n,s)=>n+s.file.size,0);summary.textContent=sources.length?`${sources.length} ${sources.length===1?'file':'files'} · ${pages.length} ${pages.length===1?'page':'pages'} · ${formatBytes(totalBytes)}`:'Add at least 2 PDF files to begin.';pageHint.textContent=pages.length?`${pages.length} pages · Drag pages to reorder them.`:'Arrange individual pages below.';outputMeta.textContent=pages.length?`${sources.length} files · ${pages.length} pages · ${formatBytes(totalBytes)}`:'No pages ready yet.';run.disabled=sources.length<2||pages.length<1;$('mergeRotateSelected').disabled=selected.size===0;$('mergeDeleteSelected').disabled=selected.size===0};
  const renderSources=()=>{sourceList.innerHTML=sources.length?sources.map((s,i)=>`<div class="merge-source-card"><span class="merge-source-number">${i+1}</span><div class="merge-source-info"><b>${escapeHtml(s.file.name)}</b><small>${s.pageCount} pages · ${formatBytes(s.file.size)}</small></div><div class="merge-source-actions"><button type="button" data-source-action="up" data-i="${i}" ${i===0?'disabled':''}>↑</button><button type="button" data-source-action="down" data-i="${i}" ${i===sources.length-1?'disabled':''}>↓</button><button type="button" data-source-action="remove" data-i="${i}" class="danger">×</button></div></div>`).join(''):'<div class="merge-source-empty">No PDF files added yet.</div>';sourceList.querySelectorAll('[data-source-action]').forEach(btn=>btn.onclick=()=>{const i=Number(btn.dataset.i),a=btn.dataset.sourceAction;if(a==='remove'){const removed=sources.splice(i,1)[0];for(let j=pages.length-1;j>=0;j--)if(pages[j].sourceId===removed.id)pages.splice(j,1);selected.clear()}else if(a==='up'&&i>0){[sources[i-1],sources[i]]=[sources[i],sources[i-1]];syncPageOrderToSources()}else if(a==='down'&&i<sources.length-1){[sources[i+1],sources[i]]=[sources[i],sources[i+1]];syncPageOrderToSources()}renderSources();renderPages();updateSummary();updateStatus(sources.length?`${sources.length} PDFs ready.`:'Choose at least 2 PDFs.')})};
  const thumbFor=async page=>{try{const src=sources.find(x=>x.id===page.sourceId);if(!src?.pdfjs)return '';const pdfPage=await src.pdfjs.getPage(page.srcPage+1),vp=pdfPage.getViewport({scale:.22}),c=document.createElement('canvas');c.width=Math.max(1,Math.round(vp.width));c.height=Math.max(1,Math.round(vp.height));await pdfPage.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;return c.toDataURL('image/jpeg',.82)}catch(e){console.error(e);return ''}};
  const renderPages=()=>{
    const snapshot=pages.slice();pagesEl.innerHTML='';
    if(!snapshot.length){pagesEl.innerHTML='<div class="merge-empty">Your PDF pages will appear here.</div>';return Promise.resolve()}
    snapshot.forEach((page,i)=>{
      const src=sources.find(x=>x.id===page.sourceId);if(!src)return;
      const card=document.createElement('article');card.className=`merge-page-card ${selected.has(page.id)?'selected':''}`;card.draggable=true;card.dataset.pageId=page.id;
      card.innerHTML=`<div class="merge-page-thumb"><span class="merge-page-loader">…</span></div><div class="merge-page-info"><b>Page ${i+1}</b><small>${escapeHtml(src.file.name)}</small></div><div class="merge-page-actions"><button type="button" data-page-action="up" title="Move up">↑</button><button type="button" data-page-action="down" title="Move down">↓</button><button type="button" data-page-action="rotate" title="Rotate">↻</button><button type="button" data-page-action="duplicate" title="Duplicate">＋</button><button type="button" data-page-action="remove" class="danger" title="Delete">×</button></div><label class="merge-page-check"><input type="checkbox" ${selected.has(page.id)?'checked':''}> Select</label>`;
      pagesEl.appendChild(card);
      card.querySelector('input').onchange=e=>{e.stopPropagation();e.target.checked?selected.add(page.id):selected.delete(page.id);card.classList.toggle('selected',e.target.checked);updateSummary()};
      card.querySelectorAll('[data-page-action]').forEach(btn=>btn.onclick=e=>{e.stopPropagation();const idx=pages.findIndex(p=>p.id===page.id);if(idx<0)return;const a=btn.dataset.pageAction;if(a==='up'&&idx>0)[pages[idx-1],pages[idx]]=[pages[idx],pages[idx-1]];if(a==='down'&&idx<pages.length-1)[pages[idx+1],pages[idx]]=[pages[idx],pages[idx+1]];if(a==='rotate')page.rotation=(page.rotation+90)%360;if(a==='duplicate'){const copy={...page,id:`pg-${Date.now()}-${Math.random().toString(36).slice(2)}`};pages.splice(idx+1,0,copy)}if(a==='remove'){pages.splice(idx,1);selected.delete(page.id)}renderPages();updateSummary();updateStatus(`${pages.length} pages ready.`)});
      card.ondragstart=e=>{dragPage=page.id;card.classList.add('dragging');e.dataTransfer.effectAllowed='move'};card.ondragend=()=>{dragPage=null;pagesEl.querySelectorAll('.merge-page-card').forEach(x=>x.classList.remove('drag-over'))};card.ondragover=e=>{e.preventDefault();if(dragPage&&dragPage!==page.id)card.classList.add('drag-over')};card.ondragleave=()=>card.classList.remove('drag-over');card.ondrop=e=>{e.preventDefault();const from=pages.findIndex(p=>p.id===dragPage),to=pages.findIndex(p=>p.id===page.id);if(from<0||to<0||from===to)return;const moved=pages.splice(from,1)[0];pages.splice(to,0,moved);selected.clear();renderPages();updateSummary();updateStatus('Page order updated.')};
      thumbFor(page).then(img=>{if(!document.body.contains(card))return;const wrap=card.querySelector('.merge-page-thumb');if(img)wrap.innerHTML=`<img src="${img}" alt="Page ${i+1}" style="transform:rotate(${page.rotation}deg)">`;else wrap.innerHTML='<span class="merge-page-loader">Preview unavailable</span>'});
    });
    return Promise.resolve();
  };
  const addFiles=async fileList=>{const pdfFiles=[...fileList].filter(f=>f.type==='application/pdf'||/\.pdf$/i.test(f.name));if(!pdfFiles.length)return;updateStatus('Reading PDF files…');for(const file of pdfFiles){try{const bytes=await file.arrayBuffer();const pdf=await PDFLib.PDFDocument.load(bytes,{updateMetadata:false});const pdfjs=await pdfjsLib.getDocument({data:bytes.slice(0)}).promise;const id=`src-${Date.now()}-${Math.random().toString(36).slice(2)}`;const src={id,file,pdf,pdfjs,pageCount:pdf.getPageCount()};sources.push(src);for(let i=0;i<src.pageCount;i++)pages.push({id:`pg-${Date.now()}-${Math.random().toString(36).slice(2)}-${i}`,sourceId:id,srcPage:i,rotation:0,originalIndex:pages.length})}catch(e){console.error(e);showToast(`Could not read ${file.name}.`)}}input.value='';renderSources();renderPages();updateSummary();updateStatus(`${sources.length} PDFs ready.`)};
  input.onchange=()=>addFiles(input.files);$('mergeAddMore').onclick=()=>input.click();drop.ondragover=e=>{e.preventDefault();drop.classList.add('dragover')};drop.ondragleave=()=>drop.classList.remove('dragover');drop.ondrop=e=>{e.preventDefault();drop.classList.remove('dragover');addFiles(e.dataTransfer.files)};
  $('mergeSort').onclick=()=>{sources.sort((a,b)=>a.file.name.localeCompare(b.file.name,undefined,{numeric:true,sensitivity:'base'}));syncPageOrderToSources();selected.clear();renderSources();renderPages();updateSummary();updateStatus('Files sorted A–Z.')};
  $('mergeReset').onclick=()=>{pages.sort((a,b)=>a.originalIndex-b.originalIndex);selected.clear();renderPages();updateSummary();updateStatus('Original page order restored.')};
  $('mergeSelectAll').onclick=()=>{if(selected.size===pages.length)selected.clear();else pages.forEach(p=>selected.add(p.id));renderPages();updateSummary()};
  $('mergeRotateSelected').onclick=()=>{pages.forEach(p=>{if(selected.has(p.id))p.rotation=(p.rotation+90)%360});renderPages();updateStatus(`${selected.size} selected pages rotated.`)};
  $('mergeDeleteSelected').onclick=()=>{if(!selected.size)return;for(let i=pages.length-1;i>=0;i--)if(selected.has(pages[i].id))pages.splice(i,1);selected.clear();renderPages();updateSummary();updateStatus('Selected pages deleted.')};
  run.onclick=async()=>{try{if(sources.length<2)throw Error('Add at least two PDFs.');run.disabled=true;updateStatus('Merging PDFs…');const out=await PDFLib.PDFDocument.create();for(let i=0;i<pages.length;i++){const item=pages[i],src=sources.find(s=>s.id===item.sourceId),copied=await out.copyPages(src.pdf,[item.srcPage]),pg=copied[0];if(item.rotation)pg.setRotation(PDFLib.degrees(item.rotation));out.addPage(pg);updateStatus(`Merging page ${i+1} of ${pages.length}…`)}const name=($('mergeFilename').value.trim()||'KwikToolForAll_Merged').replace(/\.pdf$/i,'')+'.pdf';downloadBlob(new Blob([await out.save({useObjectStreams:true})],{type:'application/pdf'}),name);showUtilitySuccess(`Merge complete. ${pages.length} pages from ${sources.length} PDFs were combined and downloaded.`)}catch(e){console.error(e);showToast('Could not merge those PDFs. Please check the files.');updateStatus('Merge failed.')}finally{run.disabled=false}};
  renderSources();updateSummary();updateStatus('Choose at least 2 PDFs.')
}
function renderSplitTool(body){
  body.innerHTML=`
    <div class="split-upload" id="splitDropzone">
      <div class="utility-upload-icon">↥</div><h3>Drop a PDF here</h3>
      <p>Choose one PDF, preview its pages, then select exactly how you want to split it.</p>
      <label class="choose-files">Choose PDF<input id="utilityFiles" type="file" accept="application/pdf" hidden></label>
      <small>Files stay in your browser and are processed locally.</small>
    </div>
    <div class="split-file-summary" id="splitFileSummary" hidden></div>
    <div class="split-modes" id="splitModes" hidden>
      <button type="button" class="split-mode active" data-split-mode="extract"><b>Extract pages</b><small>Make one PDF from selected pages.</small></button>
      <button type="button" class="split-mode" data-split-mode="every"><b>Every page</b><small>Create one PDF per page.</small></button>
      <button type="button" class="split-mode" data-split-mode="ranges"><b>Custom ranges</b><small>Create multiple PDFs from ranges.</small></button>
      <button type="button" class="split-mode" data-split-mode="after"><b>Split after pages</b><small>Choose where each part ends.</small></button>
    </div>
    <div class="split-workspace" id="splitWorkspace" hidden>
      <div class="split-page-head"><div><strong>Pages</strong><span id="splitSelectionHint">Click pages to select them. Drag selected pages to change extraction order.</span></div><div class="split-page-actions"><button type="button" class="merge-secondary" id="splitSelectAll">Select all</button><button type="button" class="merge-secondary" id="splitClearSelection">Clear</button></div></div>
      <div class="split-pages" id="splitPages"><div class="merge-empty">Pages will appear here.</div></div>
      <div id="splitControls"></div>
    </div>
    <div class="split-output" id="splitOutput" hidden>
      <label>Output filename / prefix<input id="splitFilename" value="KwikToolForAll_Split" maxlength="100"></label>
      <div class="split-output-meta" id="splitOutputMeta"></div>
    </div>
    <div class="utility-actions"><button class="primary-action" id="splitRun" disabled>Split PDF →</button></div>`;

  let file=null,pdf=null,pages=[],selected=new Set(),mode='extract',dragPage=null;
  const input=$('utilityFiles'),drop=$('splitDropzone'),run=$('splitRun'),pagesEl=$('splitPages');
  const status=t=>{$('utilityStatus').textContent=t};
  const modeName=()=>({extract:'Extract pages',every:'Every page',ranges:'Custom ranges',after:'Split after pages'})[mode];
  const selectedOrdered=()=>pages.filter(p=>selected.has(p.id));
  const updateMeta=()=>{
    if(!pdf)return;
    const count=selected.size;
    $('splitSelectionHint').textContent=mode==='extract'?'Click pages to select them. Drag selected pages to change extraction order.':mode==='every'?`All ${pages.length} pages will become separate PDFs.`:mode==='ranges'?'Enter one or more ranges below, for example 1-3, 4-7.':'Select the pages after which a new PDF should start.';
    $('splitOutputMeta').textContent=mode==='extract'?`${count} selected · ${pages.length} total pages`:mode==='every'?`${pages.length} output PDFs · ${pages.length} total pages`:mode==='after'?`${selected.size} split points · ${pages.length} total pages`:'Add ranges to preview output count.';
    if(mode==='extract')run.disabled=!count;
    else if(mode==='after')run.disabled=!selected.size;
  };
  const renderPages=()=>{
    pagesEl.innerHTML='';
    pages.forEach((page,i)=>{
      const card=document.createElement('article');card.className=`split-page-card ${selected.has(page.id)?'selected':''}`;card.draggable=mode==='extract';card.dataset.id=page.id;
      card.innerHTML=`<div class="split-page-thumb"><span class="merge-page-loader">…</span></div><div class="split-page-info"><b>Page ${i+1}</b><small>${selected.has(page.id)?'Selected':'Click to select'}</small></div><div class="split-page-mark">${selected.has(page.id)?'✓':''}</div>`;
      card.onclick=e=>{if(e.target.closest('button'))return;if(selected.has(page.id))selected.delete(page.id);else selected.add(page.id);renderPages();updateControls();updateMeta();status(`${selected.size} page${selected.size===1?'':'s'} selected.`)};
      card.ondragstart=e=>{dragPage=page.id;card.classList.add('dragging');e.dataTransfer.effectAllowed='move'};
      card.ondragend=()=>{dragPage=null;pagesEl.querySelectorAll('.split-page-card').forEach(x=>x.classList.remove('drag-over'))};
      card.ondragover=e=>{e.preventDefault();if(dragPage&&dragPage!==page.id)card.classList.add('drag-over')};
      card.ondragleave=()=>card.classList.remove('drag-over');
      card.ondrop=e=>{e.preventDefault();const from=pages.findIndex(p=>p.id===dragPage),to=pages.findIndex(p=>p.id===page.id);if(from<0||to<0||from===to)return;const moved=pages.splice(from,1)[0];pages.splice(to,0,moved);renderPages();updateControls();updateMeta();status('Page order updated.')};
      pagesEl.appendChild(card);
      pdf.getPage(page.num).then(pg=>{const vp=pg.getViewport({scale:.48}),canvas=document.createElement('canvas');canvas.width=Math.ceil(vp.width);canvas.height=Math.ceil(vp.height);return pg.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise.then(()=>{if(!document.body.contains(card))return;const wrap=card.querySelector('.split-page-thumb');wrap.innerHTML='';wrap.appendChild(canvas)})}).catch(()=>{});
    });
  };
  const renderControls=()=>{
    const c=$('splitControls');
    if(mode==='extract')c.innerHTML=`<div class="split-control-card"><strong>Selected pages</strong><div class="split-range-row"><input id="splitRange" type="text" placeholder="Example: 1, 3-5, 8"><button type="button" class="merge-secondary" id="splitApplyRange">Select pages</button></div><small>Use commas for separate pages and hyphens for ranges. Existing selection will be replaced.</small></div>`;
    else if(mode==='every')c.innerHTML=`<div class="split-control-card"><strong>One PDF per page</strong><small>${pages.length} individual PDFs will be created and downloaded together as a ZIP file.</small></div>`;
    else if(mode==='ranges')c.innerHTML=`<div class="split-control-card"><strong>Ranges</strong><div class="split-range-row"><input id="splitRanges" type="text" placeholder="Example: 1-3, 4-7, 8-12"><button type="button" class="merge-secondary" id="splitPreviewRanges">Preview</button></div><small>Each range becomes its own PDF. Overlapping ranges are allowed.</small><div id="splitRangePreview" class="split-range-preview"></div></div>`;
    else c.innerHTML=`<div class="split-control-card"><strong>Split after selected pages</strong><small>Select pages above. A new part starts after each selected page.</small><div id="splitAfterPreview" class="split-range-preview"></div></div>`;
    if($('splitApplyRange'))$('splitApplyRange').onclick=()=>{try{const nums=parseRanges($('splitRange').value,pages.length);selected.clear();nums.forEach(n=>selected.add(pages[n-1].id));renderPages();updateControls();updateMeta();status(`${nums.length} pages selected.`)}catch(e){showToast('Please check the page numbers.')}};
    if($('splitPreviewRanges'))$('splitPreviewRanges').onclick=()=>previewRanges();
    if($('splitRanges'))$('splitRanges').oninput=previewRanges;
  };
  const updateControls=()=>{
    if(mode==='after'){const nums=pages.map((p,i)=>selected.has(p.id)?i+1:null).filter(Boolean);$('splitAfterPreview').innerHTML=nums.length?buildParts(nums,pages.length):'<span>No split points selected.</span>';run.disabled=!nums.length}
    else if(mode==='ranges'){previewRanges();}
    else if(mode==='extract')run.disabled=!selected.size;
    else run.disabled=!file;
  };
  const buildParts=(cuts,total)=>{let prev=1,out='';cuts.forEach((end,i)=>{if(end<prev)return;out+=`<span>Part ${i+1}: ${prev}–${end}</span>`;prev=end+1});if(prev<=total)out+=`<span>Part ${cuts.length+1}: ${prev}–${total}</span>`;return out};
  const previewRanges=()=>{const el=$('splitRangePreview');if(!el)return;const text=$('splitRanges').value.trim();if(!text){el.innerHTML='<span>Enter ranges to see the output parts.</span>';run.disabled=true;return}const raw=text.split(',').map(x=>x.trim()).filter(Boolean),valid=[];raw.forEach(x=>{const m=x.match(/^(\d+)\s*-\s*(\d+)$/);if(m){let a=+m[1],b=+m[2];if(a>b)[a,b]=[b,a];if(a>=1&&b<=pages.length)valid.push([a,b])}});el.innerHTML=valid.length?valid.map((r,i)=>`<span>Part ${i+1}: ${r[0]}–${r[1]}</span>`).join(''):'<span>Enter valid ranges within the PDF.</span>';run.disabled=!valid.length;updateMeta()};
  const addFile=async f=>{if(!f||(!f.type&&!/\.pdf$/i.test(f.name)))return;try{status('Reading PDF…');file=f;const bytes=await f.arrayBuffer();pdf=await pdfjsLib.getDocument({data:bytes.slice(0)}).promise;pages=Array.from({length:pdf.numPages},(_,i)=>({id:`sp-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,num:i+1}));selected.clear();$('splitFileSummary').hidden=false;$('splitFileSummary').innerHTML=`<strong>${escapeHtml(f.name)}</strong><span>${pdf.numPages} pages · ${formatBytes(f.size)}</span><button type="button" class="text-btn" id="splitReplace">Replace</button>`;$('splitReplace').onclick=()=>input.click();$('splitModes').hidden=false;$('splitWorkspace').hidden=false;$('splitOutput').hidden=false;renderPages();renderControls();updateControls();updateMeta();status(`${pdf.numPages} pages ready.`)}catch(e){console.error(e);showToast('Could not read this PDF.');status('Could not read the PDF.')}};
  input.onchange=()=>{const f=input.files[0];input.value='';addFile(f)};drop.ondragover=e=>{e.preventDefault();drop.classList.add('dragover')};drop.ondragleave=()=>drop.classList.remove('dragover');drop.ondrop=e=>{e.preventDefault();drop.classList.remove('dragover');addFile([...e.dataTransfer.files][0])};
  body.querySelectorAll('[data-split-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.splitMode;body.querySelectorAll('[data-split-mode]').forEach(x=>x.classList.toggle('active',x===b));renderControls();updateControls();updateMeta();status(`${modeName()} selected.`)});
  $('splitSelectAll').onclick=()=>{if(selected.size===pages.length)selected.clear();else pages.forEach(p=>selected.add(p.id));renderPages();updateControls();updateMeta();status(selected.size===pages.length?'All pages selected.':'Selection cleared.')};
  $('splitClearSelection').onclick=()=>{selected.clear();renderPages();updateControls();updateMeta();status('Selection cleared.')};
  run.onclick=async()=>{
    try{run.disabled=true;status('Preparing split…');const src=await PDFLib.PDFDocument.load(await file.arrayBuffer(),{updateMetadata:false});const base=($('splitFilename').value.trim()||'KwikToolForAll_Split').replace(/\.pdf$/i,'');
      const makePdf=async nums=>{const out=await PDFLib.PDFDocument.create();const copied=await out.copyPages(src,nums.map(n=>n-1));copied.forEach(p=>out.addPage(p));return new Blob([await out.save({useObjectStreams:true})],{type:'application/pdf'})};
      if(mode==='extract'){const nums=selectedOrdered().map(p=>p.num);downloadBlob(await makePdf(nums),`${base}.pdf`);showUtilitySuccess(`Extracted ${nums.length} selected pages into one PDF.`)}
      else if(mode==='every'){if(!window.JSZip)throw Error('ZIP library unavailable');const zip=new JSZip();for(let i=1;i<=src.getPageCount();i++){status(`Creating page ${i} of ${src.getPageCount()}…`);zip.file(`${base}_Page_${String(i).padStart(2,'0')}.pdf`,await makePdf([i]))}const blob=await zip.generateAsync({type:'blob'});downloadBlob(blob,`${base}_AllPages.zip`);showUtilitySuccess(`Created ${src.getPageCount()} individual PDFs and packaged them into one ZIP.`)}
      else if(mode==='ranges'){const raw=$('splitRanges').value.split(',').map(x=>x.trim()).filter(Boolean),ranges=[];for(const x of raw){const m=x.match(/^(\d+)\s*-\s*(\d+)$/);if(!m)continue;let a=+m[1],b=+m[2];if(a>b)[a,b]=[b,a];if(a>=1&&b<=src.getPageCount())ranges.push([a,b])}if(!ranges.length)throw Error('No valid ranges');if(ranges.length===1){downloadBlob(await makePdf(Array.from({length:ranges[0][1]-ranges[0][0]+1},(_,i)=>ranges[0][0]+i)),`${base}_Part_01.pdf`);showUtilitySuccess('Created 1 PDF from the selected range.')}else{if(!window.JSZip)throw Error('ZIP library unavailable');const zip=new JSZip();for(let i=0;i<ranges.length;i++){const [a,b]=ranges[i];status(`Creating part ${i+1} of ${ranges.length}…`);zip.file(`${base}_Part_${String(i+1).padStart(2,'0')}.pdf`,await makePdf(Array.from({length:b-a+1},(_,j)=>a+j)))}downloadBlob(await zip.generateAsync({type:'blob'}),`${base}_Parts.zip`);showUtilitySuccess(`Created ${ranges.length} PDF parts and packaged them into one ZIP.`)}}
      else {const cuts=pages.map((p,i)=>selected.has(p.id)?i+1:null).filter(Boolean).sort((a,b)=>a-b);if(!cuts.length)throw Error('Select split points');const parts=[];let prev=1;cuts.forEach(end=>{if(end>=prev){parts.push([prev,end]);prev=end+1}});if(prev<=src.getPageCount())parts.push([prev,src.getPageCount()]);if(parts.length===1){downloadBlob(await makePdf(Array.from({length:parts[0][1]-parts[0][0]+1},(_,i)=>parts[0][0]+i)),`${base}_Part_01.pdf`);showUtilitySuccess('Created 1 PDF part.')}else{if(!window.JSZip)throw Error('ZIP library unavailable');const zip=new JSZip();for(let i=0;i<parts.length;i++){status(`Creating part ${i+1} of ${parts.length}…`);const [a,b]=parts[i];zip.file(`${base}_Part_${String(i+1).padStart(2,'0')}.pdf`,await makePdf(Array.from({length:b-a+1},(_,j)=>a+j)))}downloadBlob(await zip.generateAsync({type:'blob'}),`${base}_Parts.zip`);showUtilitySuccess(`Created ${parts.length} PDF parts and packaged them into one ZIP.`)}}
    }catch(e){console.error(e);showToast('Could not split this PDF. Please check the selection.');status('Split failed.')}finally{run.disabled=mode==='extract'?!selected.size:mode==='after'?!selected.size:mode==='ranges'?!($('splitRanges')?.value.trim()):!file}
  };
}

function parseRanges(text,total){const set=new Set();for(const part of text.split(',')){const x=part.trim();if(/^\d+$/.test(x)){const n=+x;if(n>=1&&n<=total)set.add(n)}else{const m=x.match(/^(\d+)\s*-\s*(\d+)$/);if(m){let a=+m[1],b=+m[2];if(a>b)[a,b]=[b,a];for(let n=a;n<=b&&n<=total;n++)if(n>=1)set.add(n)}}}return [...set].sort((a,b)=>a-b)}
function imageToolMarkup(title,desc){return `<div class="image-tool-grid"><div class="utility-upload"><div class="utility-upload-icon">↥</div><h3>Upload an image</h3><p>${desc}</p><label class="choose-files">Choose image<input id="utilityImageFile" type="file" accept="image/jpeg,image/png,image/webp" hidden></label></div><div class="utility-preview-panel"><div class="utility-preview-empty" id="utilityImagePreview">Preview will appear here.</div></div></div>`}
function loadImageFile(file,cb){const url=URL.createObjectURL(file),img=new Image();img.onload=()=>cb(img,url);img.onerror=()=>{URL.revokeObjectURL(url);showToast('Could not read that image.')};img.src=url}
function renderResizeTool(body){
  body.innerHTML=`
  <div class="photo-tool-shell">
    <div class="photo-upload" id="photoDropzone">
      <div class="utility-upload-icon">↥</div><h3>Drop your images here</h3>
      <p>Prepare photos for passports, IDs, visas, social media or printing.</p>
      <label class="choose-files">Choose images<input id="utilityImageFile" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden></label>
      <small>Images stay on your device and are processed locally.</small>
    </div>
    <div class="photo-filebar" id="photoFilebar" hidden><div><strong id="photoFileCount">0 images</strong><span id="photoFileNames"></span></div><button type="button" class="text-btn" id="photoReplace">Add more</button></div>
    <div class="photo-purpose-tabs" id="photoPurposeTabs">
      <button type="button" class="photo-purpose active" data-purpose="document">📸 Documents & ID</button>
      <button type="button" class="photo-purpose" data-purpose="social">📱 Social</button>
      <button type="button" class="photo-purpose" data-purpose="print">🖨️ Print</button>
      <button type="button" class="photo-purpose" data-purpose="custom">⚙️ Custom</button>
    </div>
    <div class="photo-preset-grid" id="photoPresetGrid"></div>
    <div class="photo-editor-grid" id="photoEditorGrid" hidden>
      <section class="photo-crop-panel">
        <div class="photo-panel-head"><div><strong>Crop & position</strong><small>Drag the image. Use the controls to zoom or rotate.</small></div><button type="button" class="merge-secondary" id="photoReset">Reset</button></div>
        <div class="photo-canvas-wrap" id="photoCanvasWrap"><canvas id="photoCanvas"></canvas><div class="photo-crop-frame" id="photoCropFrame"></div></div>
        <div class="photo-crop-tools"><button type="button" class="merge-secondary" id="photoZoomOut">−</button><input id="photoZoom" type="range" min="1" max="3" step="0.01" value="1"><button type="button" class="merge-secondary" id="photoZoomIn">+</button><button type="button" class="merge-secondary" id="photoRotate">↻ Rotate</button></div>
      </section>
      <section class="photo-settings-panel">
        <div class="photo-settings-card"><div class="photo-setting-title">Output size</div><div class="photo-two-col"><label>Width<input id="photoWidth" type="number" min="1"></label><label>Height<input id="photoHeight" type="number" min="1"></label></div><div class="photo-units"><button type="button" class="unit active" data-unit="px">px</button><button type="button" class="unit" data-unit="mm">mm</button><button type="button" class="unit" data-unit="cm">cm</button><button type="button" class="unit" data-unit="in">in</button></div><label class="photo-dpi-label">Resolution (DPI)<select id="photoDpi"><option value="72">72</option><option value="96">96</option><option value="150">150</option><option value="200">200</option><option value="300" selected>300</option></select></label><small class="photo-note" id="photoPixelNote"></small></div>
        <div class="photo-settings-card"><div class="photo-setting-title">File & quality</div><label>Format<select id="photoFormat"><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></label><label>Quality<input id="photoQuality" type="range" min="40" max="100" value="92"><span class="range-value" id="photoQualityValue">92%</span></label><label class="check-line"><input id="photoNoEnlarge" type="checkbox" checked> Don't enlarge smaller images</label><label>Maximum file size<select id="photoMaxSize"><option value="0">No limit</option><option value="51200">50 KB</option><option value="102400">100 KB</option><option value="204800">200 KB</option><option value="512000">500 KB</option><option value="1048576">1 MB</option></select></label></div>
      </section>
    </div>
    <div class="photo-preview-strip" id="photoPreviewStrip" hidden></div>
    <div class="photo-print-card" id="photoPrintCard" hidden><div><strong>Create a print sheet</strong><small>Arrange copies at the selected physical size on a printable PDF.</small></div><div class="photo-print-controls"><label>Paper<select id="photoPaper"><option value="a4">A4</option><option value="letter">Letter</option><option value="4x6">4 × 6 in</option></select></label><label>Copies<input id="photoCopies" type="number" min="1" max="100" value="8"></label><label>Gap (mm)<input id="photoGap" type="number" min="0" max="30" value="3"></label><label>Margin (mm)<input id="photoMargin" type="number" min="0" max="40" value="8"></label></div><div class="photo-print-meta" id="photoPrintMeta"></div></div>
    <div class="photo-actions" id="photoActions" hidden><button type="button" class="merge-secondary" id="photoDownload">Download image</button><button type="button" class="primary-action" id="photoPrint">Create print sheet PDF →</button></div>
  </div>`;

  let files=[],img=null,imgUrl='',purpose='document',presetKey='india-passport',unit='px',zoom=1,rotation=0,offsetX=0,offsetY=0,drag=null;
  const presets={
    document:[
      {key:'india-passport',name:'India Passport',sub:'35 × 45 mm',w:35,h:45,unit:'mm',dpi:300},
      {key:'pan',name:'PAN / ID Photo',sub:'35 × 35 mm',w:35,h:35,unit:'mm',dpi:300},
      {key:'us-visa',name:'US Visa',sub:'2 × 2 in',w:2,h:2,unit:'in',dpi:300},
      {key:'schengen',name:'Schengen / EU',sub:'35 × 45 mm',w:35,h:45,unit:'mm',dpi:300},
      {key:'canada',name:'Canada',sub:'50 × 70 mm',w:50,h:70,unit:'mm',dpi:300},
      {key:'stamp',name:'Stamp Photo',sub:'25 × 35 mm',w:25,h:35,unit:'mm',dpi:300}],
    social:[
      {key:'insta-square',name:'Instagram Square',sub:'1080 × 1080 px',w:1080,h:1080,unit:'px',dpi:96},
      {key:'insta-portrait',name:'Instagram Portrait',sub:'1080 × 1350 px',w:1080,h:1350,unit:'px',dpi:96},
      {key:'story',name:'Story / Reel',sub:'1080 × 1920 px',w:1080,h:1920,unit:'px',dpi:96},
      {key:'youtube',name:'YouTube Thumbnail',sub:'1280 × 720 px',w:1280,h:720,unit:'px',dpi:96},
      {key:'og',name:'Web / Open Graph',sub:'1200 × 630 px',w:1200,h:630,unit:'px',dpi:96}],
    print:[
      {key:'4x6',name:'4 × 6 inch',sub:'Photo print',w:4,h:6,unit:'in',dpi:300},
      {key:'5x7',name:'5 × 7 inch',sub:'Photo print',w:5,h:7,unit:'in',dpi:300},
      {key:'a4',name:'A4 Image',sub:'210 × 297 mm',w:210,h:297,unit:'mm',dpi:150},
      {key:'custom-print',name:'Custom print',sub:'Set your own size',w:100,h:100,unit:'mm',dpi:300}]
  };
  const $id=id=>$(id); const input=$id('utilityImageFile'),drop=$id('photoDropzone');
  const mmToPx=(v,dpi)=>Math.round(v/25.4*dpi),toPx=(v,u,dpi)=>u==='mm'?mmToPx(v,dpi):u==='cm'?mmToPx(v*10,dpi):u==='in'?Math.round(v*dpi):Math.round(v);
  const pxToUnit=(px,u,dpi)=>u==='mm'?px*25.4/dpi:u==='cm'?px*2.54/dpi:u==='in'?px/dpi:px;
  const currentPreset=()=>Object.values(presets).flat().find(x=>x.key===presetKey)||presets.document[0];
  const showPresets=()=>{const list=presets[purpose]||[];$id('photoPresetGrid').innerHTML=list.map(p=>`<button type="button" class="photo-preset ${p.key===presetKey?'active':''}" data-preset="${p.key}"><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.sub)}</small></button>`).join('')};
  const setDimensions=(p)=>{unit=p.unit;$id('photoWidth').value=p.w;$id('photoHeight').value=p.h;$id('photoDpi').value=p.dpi;document.querySelectorAll('.photo-units .unit').forEach(b=>b.classList.toggle('active',b.dataset.unit===unit));updateFrame();};
  const updateNote=()=>{const dpi=+$id('photoDpi').value,w=+$id('photoWidth').value,h=+$id('photoHeight').value;const pw=toPx(w,unit,dpi),ph=toPx(h,unit,dpi);$id('photoPixelNote').textContent=`Output: ${pw} × ${ph} px · ${w} × ${h} ${unit} at ${dpi} DPI`;updatePrintMeta()};
  const updateFrame=()=>{if(!img)return;const wrap=$id('photoCanvasWrap'),frame=$id('photoCropFrame'),ratio=toPx(+$id('photoWidth').value,unit,+$id('photoDpi').value)/toPx(+$id('photoHeight').value,unit,+$id('photoDpi').value);const maxW=Math.max(120,wrap.clientWidth-24),maxH=Math.max(180,wrap.clientHeight-24);let fw=maxW,fh=fw/ratio;if(fh>maxH){fh=maxH;fw=fh*ratio}frame.style.width=fw+'px';frame.style.height=fh+'px';frame.style.left=(wrap.clientWidth-fw)/2+'px';frame.style.top=(wrap.clientHeight-fh)/2+'px';updateNote();drawCanvas()};
  const drawCanvas=()=>{if(!img)return;const c=$id('photoCanvas'),wrap=$id('photoCanvasWrap');c.width=wrap.clientWidth*devicePixelRatio;c.height=wrap.clientHeight*devicePixelRatio;c.style.width=wrap.clientWidth+'px';c.style.height=wrap.clientHeight+'px';const ctx=c.getContext('2d');ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);ctx.fillStyle='#eef1f5';ctx.fillRect(0,0,wrap.clientWidth,wrap.clientHeight);const scale=Math.max(wrap.clientWidth/img.naturalWidth,wrap.clientHeight/img.naturalHeight)*zoom;const w=img.naturalWidth*scale,h=img.naturalHeight*scale;ctx.save();ctx.translate(wrap.clientWidth/2+offsetX,wrap.clientHeight/2+offsetY);ctx.rotate(rotation*Math.PI/180);ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore()};
  const loadFiles=async list=>{const valid=[...list].filter(f=>/^image\/(jpeg|png|webp)$/.test(f.type)||/\.(jpe?g|png|webp)$/i.test(f.name));if(!valid.length){showToast('Please choose JPG, PNG or WebP images.');return}files=files.concat(valid);$id('photoFilebar').hidden=false;$id('photoFileCount').textContent=`${files.length} image${files.length===1?'':'s'} selected`;$id('photoFileNames').textContent=files.slice(0,3).map(f=>f.name).join(' · ')+(files.length>3?' …':'');if(!img){const f=files[0];const u=URL.createObjectURL(f);img=new Image();img.onload=()=>{imgUrl=u;$id('photoEditorGrid').hidden=false;$id('photoPrintCard').hidden=false;$id('photoActions').hidden=false;$id('photoPreviewStrip').hidden=false;setDimensions(currentPreset());updatePreviewStrip();updatePrintMeta();drawCanvas()};img.src=u}else updatePreviewStrip()};
  const updatePreviewStrip=()=>{$id('photoPreviewStrip').innerHTML=files.map((f,i)=>`<div class="photo-mini"><span>${i+1}</span><strong>${escapeHtml(f.name)}</strong><small>${formatBytes(f.size)}</small></div>`).join('')};
  const renderOutputBlob=async(f,forSheet=false)=>{const source=new Image();const u=URL.createObjectURL(f);await new Promise((res,rej)=>{source.onload=res;source.onerror=rej;source.src=u});const dpi=+$id('photoDpi').value,w=toPx(+$id('photoWidth').value,unit,dpi),h=toPx(+$id('photoHeight').value,unit,dpi),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);const frameRatio=w/h,scale=Math.max(w/source.naturalWidth,h/source.naturalHeight)*zoom,drawW=source.naturalWidth*scale,drawH=source.naturalHeight*scale;ctx.save();ctx.translate(w/2+(offsetX/$id('photoCanvasWrap').clientWidth)*w,h/2+(offsetY/$id('photoCanvasWrap').clientHeight)*h);ctx.rotate(rotation*Math.PI/180);ctx.drawImage(source,-drawW/2,-drawH/2,drawW,drawH);ctx.restore();URL.revokeObjectURL(u);const type=$id('photoFormat').value;return canvasBlob(canvas,type,+$id('photoQuality').value/100)};
  const downloadCurrent=async()=>{if(!files.length)return;const blob=await renderOutputBlob(files[0]);const ext=$id('photoFormat').value.split('/')[1].replace('jpeg','jpg');downloadBlob(blob,`KwikToolForAll_Photo_${Date.now()}.${ext}`);showUtilitySuccess('Your resized photo is ready.');};
  const paperInfo=()=>({a4:[210,297],letter:[215.9,279.4],'4x6':[101.6,152.4]})[$id('photoPaper').value];
  const updatePrintMeta=()=>{if(!$id('photoPrintMeta'))return;const [pw,ph]=paperInfo(),gap=+$id('photoGap').value||0,margin=+$id('photoMargin').value||0,dpi=+$id('photoDpi').value,w=+$id('photoWidth').value,h=+$id('photoHeight').value;const cols=Math.max(0,Math.floor((pw-2*margin+gap)/(w+gap))),rows=Math.max(0,Math.floor((ph-2*margin+gap)/(h+gap)));const fit=cols*rows;$id('photoPrintMeta').textContent=fit?`${fit} photo${fit===1?'':'s'} fit per sheet · ${cols} columns × ${rows} rows · ${$id('photoCopies').value} copies requested`:'Photo is too large for this paper size.'};
  const makePrintSheet=async()=>{if(!files.length||!window.PDFLib)return;const photo=await renderOutputBlob(files[0],true),bytes=await photo.arrayBuffer(),pdf=await PDFLib.PDFDocument.create(),pageSize=paperInfo().map(mm=>mm/25.4*72),page=pdf.addPage(pageSize),margin=+$id('photoMargin').value||0,gap=+$id('photoGap').value||0,w=+$id('photoWidth').value,h=+$id('photoHeight').value,dpi=+$id('photoDpi').value,pw=pageSize[0],ph=pageSize[1],wPt=unit==='in'?w*72:unit==='mm'?w/25.4*72:unit==='cm'?w/2.54*72:w/dpi*72,hPt=unit==='in'?h*72:unit==='mm'?h/25.4*72:unit==='cm'?h/2.54*72:h/dpi*72,gPt=gap/25.4*72,mPt=margin/25.4*72;const cols=Math.floor((pw-2*mPt+gPt)/(wPt+gPt)),rows=Math.floor((ph-2*mPt+gPt)/(hPt+gPt)),fit=Math.max(0,cols*rows),copies=Math.min(100,Math.max(1,+$id('photoCopies').value||1));if(!fit){showToast('The photo is too large for the selected paper.');return}const jpg=$id('photoFormat').value==='image/png'?await pdf.embedPng(bytes):await pdf.embedJpg(bytes);let placed=0;for(let r=0;r<rows&&placed<copies;r++)for(let c=0;c<cols&&placed<copies;c++){page.drawImage(jpg,{x:mPt+c*(wPt+gPt),y:ph-mPt-hPt-r*(hPt+gPt),width:wPt,height:hPt});placed++}const blob=new Blob([await pdf.save()],{type:'application/pdf'});downloadBlob(blob,'KwikToolForAll_Print_Sheet.pdf');showUtilitySuccess(`Print sheet created with ${placed} photo${placed===1?'':'s'} at the selected physical size.`)};
  input.onchange=()=>{loadFiles(input.files);input.value=''};$id('photoReplace').onclick=()=>input.click();drop.ondragover=e=>{e.preventDefault();drop.classList.add('dragover')};drop.ondragleave=()=>drop.classList.remove('dragover');drop.ondrop=e=>{e.preventDefault();drop.classList.remove('dragover');loadFiles(e.dataTransfer.files)};
  document.querySelectorAll('.photo-purpose').forEach(b=>b.onclick=()=>{purpose=b.dataset.purpose;document.querySelectorAll('.photo-purpose').forEach(x=>x.classList.toggle('active',x===b));if(purpose==='custom'){presetKey='custom-print';showPresets();}else{presetKey=(presets[purpose]||presets.document)[0].key;showPresets();setDimensions(currentPreset())}});showPresets();
  $id('photoPresetGrid').onclick=e=>{const b=e.target.closest('[data-preset]');if(!b)return;presetKey=b.dataset.preset;showPresets();const p=currentPreset();setDimensions(p)};
  document.querySelectorAll('.photo-units .unit').forEach(b=>b.onclick=()=>{const old=unit;unit=b.dataset.unit;const dpi=+$id('photoDpi').value;const w=pxToUnit(toPx(+$id('photoWidth').value,old,dpi),unit,dpi),h=pxToUnit(toPx(+$id('photoHeight').value,old,dpi),unit,dpi);$id('photoWidth').value=+w.toFixed(2);$id('photoHeight').value=+h.toFixed(2);document.querySelectorAll('.photo-units .unit').forEach(x=>x.classList.toggle('active',x===b));updateFrame()});
  [$id('photoWidth'),$id('photoHeight'),$id('photoDpi')].forEach(x=>x.oninput=()=>updateFrame());$id('photoQuality').oninput=()=>{$id('photoQualityValue').textContent=$id('photoQuality').value+'%'};$id('photoPaper').onchange=updatePrintMeta;$id('photoGap').oninput=updatePrintMeta;$id('photoMargin').oninput=updatePrintMeta;$id('photoCopies').oninput=updatePrintMeta;
  $id('photoZoom').oninput=e=>{zoom=+e.target.value;drawCanvas()};$id('photoZoomIn').onclick=()=>{$id('photoZoom').value=Math.min(3,zoom+.1);zoom=+$id('photoZoom').value;drawCanvas()};$id('photoZoomOut').onclick=()=>{$id('photoZoom').value=Math.max(1,zoom-.1);zoom=+$id('photoZoom').value;drawCanvas()};$id('photoRotate').onclick=()=>{rotation=(rotation+90)%360;drawCanvas()};$id('photoReset').onclick=()=>{zoom=1;rotation=0;offsetX=0;offsetY=0;$id('photoZoom').value=1;drawCanvas()};
  const cw=$id('photoCanvasWrap');let drawQueued=false,pendingPoint=null;const queueDraw=()=>{if(drawQueued)return;drawQueued=true;requestAnimationFrame(()=>{drawQueued=false;drawCanvas()})};cw.onpointerdown=e=>{if(!img)return;drag={x:e.clientX,y:e.clientY,ox:offsetX,oy:offsetY};cw.setPointerCapture(e.pointerId)};cw.onpointermove=e=>{if(!drag)return;pendingPoint=e;offsetX=drag.ox+e.clientX-drag.x;offsetY=drag.oy+e.clientY-drag.y;queueDraw()};cw.onpointerup=()=>{drag=null;pendingPoint=null};cw.onpointercancel=()=>{drag=null;pendingPoint=null};let resizeTimer;window.addEventListener('resize',()=>{if(!img)return;clearTimeout(resizeTimer);resizeTimer=setTimeout(updateFrame,100)});
  $id('photoDownload').onclick=downloadCurrent;$id('photoPrint').onclick=makePrintSheet;$id('utilityStatus').textContent='Choose a photo size preset or create a custom size.';
}
function renderCompressTool(body){
  body.innerHTML=`
  <div class="compress-image-shell">
    <div class="compress-image-upload" id="compressImageDropzone">
      <div class="utility-upload-icon">⌁</div>
      <h3>Drop your images here</h3>
      <p>Compress photos for sharing, websites and uploads. Your files stay on your device.</p>
      <label class="choose-files">Choose images<input id="utilityImageFile" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden></label>
      <small>JPG, PNG and WebP · processed locally in your browser</small>
    </div>
    <div class="compress-image-files" id="compressImageFiles" hidden></div>
    <div class="compress-image-layout" id="compressImageLayout" hidden>
      <section class="compress-image-preview-card">
        <div class="compress-card-head"><div><strong>Preview</strong><small id="compressImagePreviewMeta">Choose an image to preview.</small></div><button type="button" class="merge-secondary" id="compressImageReplace">Add more</button></div>
        <div class="compress-image-preview" id="compressImagePreview"><span>Preview will appear here.</span></div>
      </section>
      <section class="compress-image-settings">
        <div class="compress-settings-card">
          <div class="compress-card-title">Compression</div>
          <div class="compression-choices compact-compression">
            <button type="button" class="compression-choice active" data-image-level="quality"><b>Quality-first</b><small>Light reduction · best detail</small></button>
            <button type="button" class="compression-choice" data-image-level="balanced"><b>Balanced <em>Recommended</em></b><small>Good quality and size</small></button>
            <button type="button" class="compression-choice" data-image-level="small"><b>Smaller file</b><small>Stronger reduction</small></button>
          </div>
          <label class="compress-field">Quality <input id="imageQuality" type="range" min="35" max="100" value="82"><span class="range-value" id="imageQualityValue">82%</span></label>
        </div>
        <div class="compress-settings-card">
          <div class="compress-card-title">Output</div>
          <div class="compress-two-col">
            <label class="compress-field">Format<select id="imageCompressFormat"><option value="auto">Keep best format</option><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option><option value="image/png">PNG</option></select></label>
            <label class="compress-field">Maximum size<select id="imageTargetSize"><option value="0">No target</option><option value="51200">50 KB</option><option value="102400">100 KB</option><option value="204800">200 KB</option><option value="512000">500 KB</option><option value="1048576">1 MB</option><option value="custom">Custom</option></select></label>
          </div>
          <div class="compress-two-col custom-image-target" id="customImageTargetWrap" hidden>
            <label class="compress-field">Custom target (KB)<input id="imageCustomTarget" type="number" min="10" step="10" value="200"></label>
          </div>
          <div class="compress-two-col">
            <label class="compress-field">Maximum width (px)<input id="imageMaxWidth" type="number" min="0" step="1" placeholder="No limit"></label>
            <label class="compress-field">Maximum height (px)<input id="imageMaxHeight" type="number" min="0" step="1" placeholder="No limit"></label>
          </div>
          <label class="check-line compress-check"><input id="imageNoEnlarge" type="checkbox" checked> Don't enlarge smaller images</label>
          <small class="compress-note">For PNG, target size may require choosing JPG or WebP because PNG is lossless.</small>
        </div>
      </section>
    </div>
    <div class="compress-image-results" id="compressImageResults" hidden></div>
    <div class="utility-actions compress-image-actions"><button class="primary-action" id="compressImagesRun" disabled>Compress images →</button></div>
  </div>`;

  let files=[],level='balanced',busy=false;
  const input=$('utilityImageFile'),drop=$('compressImageDropzone'),layout=$('compressImageLayout'),list=$('compressImageFiles'),run=$('compressImagesRun');
  const settings={quality:{q:.92,maxScale:1},balanced:{q:.80,maxScale:.9},small:{q:.62,maxScale:.72}};
  const extFor=type=>type==='image/png'?'png':type==='image/webp'?'webp':'jpg';
  const selectedQuality=()=>Math.max(.35,Math.min(1,(+$('imageQuality').value||82)/100));
  const targetBytes=()=>{const v=$('imageTargetSize').value;if(v==='custom')return Math.max(10240,(+$('imageCustomTarget').value||200)*1024);return +v||0};
  const outputType=(file)=>{const choice=$('imageCompressFormat').value;if(choice!=='auto')return choice;if(file.type==='image/png')return 'image/webp';return file.type||'image/jpeg'};
  const getDims=(im)=>{let w=im.naturalWidth||im.width,h=im.naturalHeight||im.height,mw=+$('imageMaxWidth').value||0,mh=+$('imageMaxHeight').value||0,scale=1;if(mw)scale=Math.min(scale,mw/w);if(mh)scale=Math.min(scale,mh/h);if($('imageNoEnlarge').checked)scale=Math.min(1,scale);return{w:Math.max(1,Math.round(w*scale)),h:Math.max(1,Math.round(h*scale))}};
  const drawPreview=async(file)=>{const url=URL.createObjectURL(file);const im=new Image();await new Promise((res,rej)=>{im.onload=res;im.onerror=rej;im.src=url});const d=getDims(im);$('compressImagePreview').innerHTML=`<img src="${url}" alt="Image preview">`;$('compressImagePreviewMeta').textContent=`${formatBytes(file.size)} · ${im.naturalWidth} × ${im.naturalHeight}px · output up to ${d.w} × ${d.h}px`;URL.revokeObjectURL(url)};
  const renderFiles=()=>{list.hidden=!files.length;layout.hidden=!files.length;run.disabled=!files.length||busy;list.innerHTML=files.map((f,i)=>`<div class="compress-image-file"><span class="compress-file-icon">IMG</span><div><b title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</b><small>${formatBytes(f.size)} · ${f.type.split('/')[1]?.toUpperCase()||'IMAGE'}</small></div><button type="button" class="text-btn" data-remove-image="${i}" aria-label="Remove ${escapeHtml(f.name)}">Remove</button></div>`).join('');if(files[0])drawPreview(files[0]).catch(()=>{});run.textContent=files.length>1?`Compress ${files.length} images →`:'Compress image →'};
  const addFiles=chosen=>{const valid=[...chosen].filter(f=>/^image\/(jpeg|png|webp)$/i.test(f.type));if(valid.length<chosen.length)showToast('Only JPG, PNG and WebP images are supported.');files.push(...valid);renderFiles();$('utilityStatus').textContent=files.length?`${files.length} image${files.length===1?'':'s'} ready.`:'Ready.'};
  input.onchange=()=>{addFiles(input.files);input.value=''};$('compressImageReplace').onclick=()=>input.click();
  drop.ondragover=e=>{e.preventDefault();drop.classList.add('dragover')};drop.ondragleave=()=>drop.classList.remove('dragover');drop.ondrop=e=>{e.preventDefault();drop.classList.remove('dragover');addFiles(e.dataTransfer.files)};
  list.onclick=e=>{const b=e.target.closest('[data-remove-image]');if(!b)return;files.splice(+b.dataset.removeImage,1);renderFiles()};
  body.querySelectorAll('[data-image-level]').forEach(b=>b.onclick=()=>{level=b.dataset.imageLevel;body.querySelectorAll('[data-image-level]').forEach(x=>x.classList.toggle('active',x===b));$('imageQuality').value=Math.round(settings[level].q*100);$('imageQualityValue').textContent=$('imageQuality').value+'%';$('utilityStatus').textContent=`${b.querySelector('b').textContent} selected.`});
  $('imageQuality').oninput=()=>{$('imageQualityValue').textContent=$('imageQuality').value+'%'};
  $('imageTargetSize').onchange=()=>{$('customImageTargetWrap').hidden=$('imageTargetSize').value!=='custom'};
  ['imageMaxWidth','imageMaxHeight','imageCustomTarget'].forEach(id=>$(id).oninput=()=>{if(files[0])drawPreview(files[0]).catch(()=>{})});

  async function encode(im,w,h,type,q){const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{alpha:type!=='image/jpeg'});if(type==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h)}ctx.drawImage(im,0,0,w,h);await new Promise(r=>requestAnimationFrame(r));return canvasBlob(c,type,q)}
  async function compressFile(file,index,total){
    const url=URL.createObjectURL(file),im=new Image();
    try{await new Promise((res,rej)=>{im.onload=res;im.onerror=rej;im.src=url});
      const dims=getDims(im);let type=outputType(file),target=targetBytes(),baseQ=selectedQuality(),cfg=settings[level];
      let w=Math.max(1,Math.round(dims.w*cfg.maxScale)),h=Math.max(1,Math.round(dims.h*cfg.maxScale));
      if(level==='quality'){w=dims.w;h=dims.h}
      let best=null,qualities=target?[baseQ,.9,.82,.74,.66,.58,.5,.42,.35]:[baseQ];
      if(target && type==='image/png')type='image/webp';
      if(target){for(let qi=0;qi<qualities.length;qi++){const b=await encode(im,w,h,type,qualities[qi]);if(!best||b.size<best.size)best=b;if(b.size<=target){best=b;break}await new Promise(r=>setTimeout(r,0))}
        if(best.size>target){let attempts=0;while(attempts<3&&best.size>target&&w>320&&h>320){w=Math.max(320,Math.round(w*.85));h=Math.max(320,Math.round(h*.85));const b=await encode(im,w,h,type,.5);if(b.size<best.size)best=b;attempts++}}
      }else best=await encode(im,w,h,type,baseQ);
      if(!best)throw Error('Compression failed');
      // Compression must never silently produce a larger file. When the generated
      // candidate is larger than the original, keep the original bytes instead.
      const usedOriginal=best.size>=file.size;
      if(usedOriginal){best=file;type=file.type||type}
      const outputName=`KwikToolForAll_Compressed_${String(index+1).padStart(2,'0')}.${extFor(type)}`;
      return {file,blob:best,w:usedOriginal?(im.naturalWidth||im.width):w,h:usedOriginal?(im.naturalHeight||im.height):h,type,name:outputName,saved:usedOriginal?0:Math.max(0,100*(1-best.size/file.size)),usedOriginal};
    }finally{URL.revokeObjectURL(url)}
  }
  run.onclick=async()=>{if(!files.length||busy)return;busy=true;run.disabled=true;const results=[];try{for(let i=0;i<files.length;i++){ $('utilityStatus').textContent=`Compressing image ${i+1} of ${files.length}…`;results.push(await compressFile(files[i],i,files.length));await new Promise(r=>setTimeout(r,0)) }
      const zip=window.JSZip?new JSZip():null;const listHtml=results.map(r=>`<div class="compress-result-row"><div><b>${escapeHtml(r.name)}</b><small>${formatBytes(r.file.size)} → ${formatBytes(r.blob.size)} · ${r.usedOriginal?'Already optimized':'-'+r.saved.toFixed(1)+'%'} · ${r.w} × ${r.h}px</small></div><button type="button" class="text-btn" data-download-result="${results.indexOf(r)}">Download</button></div>`).join('');
      $('compressImageResults').hidden=false;$('compressImageResults').innerHTML=`<div class="compress-results-head"><div><strong>Compression complete</strong><small>${results.length} image${results.length===1?'':'s'} processed</small></div>${zip?'<button type="button" class="primary-action compact-download" id="downloadAllImages">Download all as ZIP →</button>':''}</div><div>${listHtml}</div>`;
      results.forEach(r=>{if(zip)zip.file(r.name,r.blob)});
      if(zip)$('downloadAllImages').onclick=async()=>{const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:6}});downloadBlob(blob,'KwikToolForAll_Compressed_Images.zip')};
      $('compressImageResults').querySelectorAll('[data-download-result]').forEach(b=>b.onclick=()=>{const r=results[+b.dataset.downloadResult];downloadBlob(r.blob,r.name)});
      run.textContent='Compress more images →';run.disabled=false;$('utilityStatus').textContent='Compression complete. Review the results or download all as a ZIP.';
    }catch(e){console.error(e);showToast('Could not compress one or more images.');$('utilityStatus').textContent='Compression failed. Try a different format or target size.';run.disabled=false}finally{busy=false}}
}

function canvasBlob(c,type,q){return new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(Error('Encode failed')),type,q))}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function showCompressPdfSuccess(originalSize,outputSize,pct,compressed){$('utilityBody').innerHTML=`<div class="utility-success compress-final-success"><div class="success-orbit"><div class="success-check" aria-hidden="true"></div></div><span class="success-eyebrow">DOWNLOAD COMPLETE</span><h3>${compressed?'PDF compressed<br><strong>successfully.</strong>':'PDF already<br><strong>optimized.</strong>'}</h3><div class="compress-final-stats"><div><span>Original</span><strong>${formatBytes(originalSize)}</strong></div><div><span>${compressed?'Compressed':'Downloaded'}</span><strong>${formatBytes(outputSize)}</strong></div><div><span>Saved</span><strong>${pct>0?pct.toFixed(1)+'%':'0%'}</strong></div></div><p class="success-sub">Please check your <strong>Downloads</strong> folder.</p><div class="privacy-confirm"><span class="privacy-confirm-icon" aria-hidden="true"></span><div><strong>Your privacy is protected</strong><span>Your PDF was processed locally in your browser and was not uploaded.</span></div></div><button type="button" class="reuse-tool" id="utilityReuse"><span>↻</span> Re-use the tool</button><small class="success-note">No account • No cloud storage • No file retained</small></div>`;$('utilityReuse').onclick=()=>openUtility(window.__utilityId)}
function showUtilitySuccess(message){$('utilityBody').innerHTML=`<div class="utility-success"><div class="success-orbit"><div class="success-check" aria-hidden="true"></div></div><span class="success-eyebrow">DOWNLOAD COMPLETE</span><h3>Thank you for using<br><strong>KwikToolForAll.</strong></h3><p class="success-main">${message}</p><p class="success-sub">Please check your <strong>Downloads</strong> folder.</p><div class="privacy-confirm"><span class="privacy-confirm-icon" aria-hidden="true"></span><div><strong>Your privacy is protected</strong><span>Your file was processed locally in your browser and was not uploaded.</span></div></div><button type="button" class="reuse-tool" id="utilityReuse"><span>↻</span> Re-use the tool</button><small class="success-note">No account • No cloud storage • No file retained</small></div>`;$('utilityReuse').onclick=()=>openUtility(window.__utilityId)}
if(window.pdfjsLib)pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
function renderCompressPdfTool(body){
  body.innerHTML=`<div class="pdf-compress-grid">
    <div class="utility-upload" id="compressPdfDropzone">
      <div class="utility-upload-icon">↘</div><h3>Drop a PDF here</h3>
      <p>Choose a PDF and reduce its file size locally in your browser.</p>
      <label class="choose-files">Choose PDF<input id="utilityFiles" type="file" accept="application/pdf" hidden></label>
      <small>Files stay on your device and are processed locally.</small>
      <div class="utility-file-list" id="utilityFileList"></div>
    </div>
    <div class="compress-pdf-preview"><div class="compress-preview-title">Page preview</div><div class="compress-preview-canvas-wrap" id="compressPreview"><span>Preview will appear here.</span></div></div>
  </div>
  <div class="compress-pdf-summary" id="compressPdfSummary" hidden></div>
  <div class="compression-choices pdf-compression-choices">
    <button type="button" class="compression-choice active" data-pdf-level="quality"><b>Maximum Quality</b><small>Light reduction with more detail preserved.</small></button>
    <button type="button" class="compression-choice" data-pdf-level="balanced"><b>Balanced <em>Recommended</em></b><small>Good quality with meaningful size reduction.</small></button>
    <button type="button" class="compression-choice" data-pdf-level="small"><b>Small File</b><small>Stronger reduction for sharing and uploads.</small></button>
    <button type="button" class="compression-choice" data-pdf-level="maximum"><b>Maximum Compression</b><small>Smallest practical output; more visible quality loss.</small></button>
  </div>
  <div class="compress-pdf-controls">
    <div class="utility-field"><label>Target file size <select id="pdfTarget"><option value="none">No target — use selected quality</option><option value="512000">500 KB</option><option value="1048576">1 MB</option><option value="2097152">2 MB</option><option value="5242880">5 MB</option><option value="10485760">10 MB</option><option value="custom">Custom</option></select></label><small>We'll try to get as close as practical. Exact size cannot always be guaranteed.</small></div>
    <div class="utility-field custom-target-field" id="customTargetWrap" hidden><label>Custom target (MB)<input id="pdfCustomTarget" type="number" min="0.1" step="0.1" value="2"></label></div>
    <div class="utility-field"><label>Image quality <input id="pdfQuality" type="range" min="35" max="95" value="76"><span class="range-value" id="pdfQualityValue">76%</span></label><small>Lower quality usually creates a smaller PDF.</small></div>
    <div class="utility-field"><label>Resolution <select id="pdfDpi"><option value="150">150 DPI · print-friendly</option><option value="120">120 DPI · high quality</option><option value="96" selected>96 DPI · balanced</option><option value="72">72 DPI · web/email</option><option value="60">60 DPI · smallest</option></select></label></div>
    <label class="check-line compress-check"><input id="pdfGrayscale" type="checkbox"> Grayscale — useful for mostly black-and-white documents</label>
  </div>
  <div class="compress-warning"><strong>Important:</strong> This compression rebuilds pages as optimized images. Strong compression can reduce text sharpness and may remove selectable/searchable text. Your original PDF is never modified.</div>
  <div class="utility-actions"><button class="primary-action" id="compressPdfRun" disabled>Compress PDF →</button></div>
  <div class="compress-result" id="compressResult" hidden></div>`;

  let file=null, level='balanced', originalPdf=null, previewUrl=null;
  const input=$('utilityFiles'),drop=$('compressPdfDropzone'),run=$('compressPdfRun'),target=$('pdfTarget'),customWrap=$('customTargetWrap'),customTarget=$('pdfCustomTarget'),quality=$('pdfQuality'),qualityValue=$('pdfQualityValue'),dpi=$('pdfDpi'),gray=$('pdfGrayscale');
  const levelCfg={quality:{dpi:150,q:.88},balanced:{dpi:96,q:.76},small:{dpi:72,q:.60},maximum:{dpi:60,q:.45}};
  const labelFor=l=>({quality:'Maximum Quality',balanced:'Balanced',small:'Small File',maximum:'Maximum Compression'})[l];
  const update=msg=>{$('utilityStatus').textContent=msg};
  const setPreview=async()=>{
    if(!originalPdf)return;
    try{const page=await originalPdf.getPage(1),vp=page.getViewport({scale:.75}),c=document.createElement('canvas');c.width=Math.max(1,Math.round(vp.width));c.height=Math.max(1,Math.round(vp.height));await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;const box=$('compressPreview');box.innerHTML='';c.className='compress-preview-canvas';box.appendChild(c)}catch(e){$('compressPreview').innerHTML='<span>Preview unavailable.</span>'}
  };
  input.onchange=async()=>{file=input.files[0]||null;originalPdf=null;$('compressPdfSummary').hidden=true;$('compressResult').hidden=true;$('utilityFileList').innerHTML=file?`<div class="utility-file"><span>PDF</span><div><b>${escapeHtml(file.name)}</b><small>${formatBytes(file.size)}</small></div></div>`:'';run.disabled=!file;if(!file){update('Choose a PDF.');return}try{if(!window.pdfjsLib)throw Error('PDF renderer unavailable');originalPdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;$('compressPdfSummary').innerHTML=`<div><strong>${formatBytes(file.size)}</strong><span>Original size</span></div><div><strong>${originalPdf.numPages}</strong><span>Pages</span></div><div><strong>${labelFor(level)}</strong><span>Compression mode</span></div>`;$('compressPdfSummary').hidden=false;await setPreview();update(`PDF ready · ${formatBytes(file.size)} · ${originalPdf.numPages} pages.`)}catch(e){console.error(e);file=null;run.disabled=true;update('Could not read this PDF. Please choose another file.');showToast('Could not read this PDF.')}};
  drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('dragover')});drop.addEventListener('dragleave',()=>drop.classList.remove('dragover'));drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('dragover');const f=[...e.dataTransfer.files].find(x=>x.type==='application/pdf'||/\.pdf$/i.test(x.name));if(!f){showToast('Please drop a PDF file.');return}const dt=new DataTransfer();dt.items.add(f);input.files=dt.files;input.dispatchEvent(new Event('change'))});
  body.querySelectorAll('[data-pdf-level]').forEach(b=>b.onclick=()=>{level=b.dataset.pdfLevel;body.querySelectorAll('[data-pdf-level]').forEach(x=>x.classList.toggle('active',x===b));const cfg=levelCfg[level];dpi.value=String(cfg.dpi);quality.value=Math.round(cfg.q*100);qualityValue.textContent=quality.value+'%';const summaryMode=document.querySelector('#compressPdfSummary');if(summaryMode&&!summaryMode.hidden){const modeCell=summaryMode.querySelector('div:nth-child(3) strong');if(modeCell)modeCell.textContent=labelFor(level)}if(file)update(`${labelFor(level)} selected · ${formatBytes(file.size)} original.`)});
  const validateTarget=()=>{const valid=target.value!=='custom'||(Number.isFinite(Number(customTarget.value))&&Number(customTarget.value)>=0.1);run.disabled=!file||!valid;return valid};
  target.onchange=()=>{customWrap.hidden=target.value!=='custom';validateTarget()};
  customTarget.oninput=validateTarget;
  quality.oninput=()=>qualityValue.textContent=quality.value+'%';
  run.onclick=async()=>{if(!file||!originalPdf)return;if(!validateTarget()){showToast('Enter a target size of at least 0.1 MB.');customTarget.focus();return}run.disabled=true;run.textContent='Compressing…';$('compressResult').hidden=true;try{const targetBytes=target.value==='custom'?Math.max(1,Number(customTarget.value)*1048576):target.value==='none'?0:Number(target.value);const baseQ=Math.max(.35,Math.min(.95,Number(quality.value)/100)),baseDpi=Number(dpi.value);let attempts;if(level==='maximum'){attempts=[{q:baseQ,d:baseDpi},{q:Math.max(.34,baseQ-.10),d:Math.max(60,baseDpi-12)},{q:.38,d:60},{q:.30,d:54},{q:.24,d:48},{q:.20,d:42}]}else if(targetBytes){attempts=[{q:baseQ,d:baseDpi},{q:Math.max(.32,baseQ-.10),d:Math.max(60,baseDpi-12)},{q:Math.max(.28,baseQ-.18),d:Math.max(54,baseDpi-24)},{q:.25,d:54},{q:.22,d:48}]}else{attempts=[{q:baseQ,d:baseDpi}]};let candidates=[];for(let i=0;i<attempts.length;i++){const a=attempts[i];update(`Testing compression ${i+1} of ${attempts.length}…`);const blobs=await renderPdfToJpegs(originalPdf,a.q,a.d,gray.checked,update),out=await jpegBlobsToPdf(blobs,originalPdf);candidates.push({blob:out,q:a.q,d:a.d})}let best;if(targetBytes){const underTarget=candidates.filter(x=>x.blob.size<=targetBytes);best=underTarget.length?underTarget.reduce((a,b)=>b.blob.size>a.blob.size?b:a):candidates.reduce((a,b)=>b.blob.size<a.blob.size?b:a)}else{best=candidates.reduce((a,b)=>b.blob.size<a.blob.size?b:a)}const shouldUseCompressed=best.blob.size<file.size;const finalBlob=shouldUseCompressed?best.blob:new Blob([await file.arrayBuffer()],{type:'application/pdf'});downloadBlob(finalBlob,'KwikToolForAll_Compressed.pdf');const saved=Math.max(0,file.size-finalBlob.size),pct=file.size?saved/file.size*100:0;const statusText=shouldUseCompressed?'Compression complete.':'This PDF is already highly optimized; no smaller version was found without further quality loss.';$('compressResult').innerHTML=`<div class="compress-result-card"><div><span>Original</span><strong>${formatBytes(file.size)}</strong></div><div class="result-arrow">→</div><div><span>${shouldUseCompressed?'Compressed':'Best available'}</span><strong>${formatBytes(finalBlob.size)}</strong></div><div class="result-saving"><strong>${pct>0?pct.toFixed(1):'0'}%</strong><span>${saved>0?'smaller':'no reduction'}</span></div></div><small>${statusText}</small>`;$('compressResult').hidden=false;showCompressPdfSuccess(file.size,finalBlob.size,pct,shouldUseCompressed)}catch(e){console.error(e);showToast('Could not compress this PDF. Try a different compression level.');update('Compression failed.')}finally{run.disabled=!file;run.textContent='Compress PDF →'}};
}
async function renderPdfToJpegs(pdf,q,dpi,grayscale,update){const out=[];const scale=dpi/72;for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n),vp=page.getViewport({scale}),c=document.createElement('canvas');c.width=Math.max(1,Math.round(vp.width));c.height=Math.max(1,Math.round(vp.height));const ctx=c.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);if(grayscale)ctx.filter='grayscale(1)';await page.render({canvasContext:ctx,viewport:vp}).promise;ctx.filter='none';out.push(await canvasBlob(c,'image/jpeg',q));update(`Compressing page ${n} of ${pdf.numPages}…`)}return out}
async function jpegBlobsToPdf(blobs,sourcePdf){
  const enc=new TextEncoder(),chunks=[],offsets=[0],objs=[],add=o=>(objs.push(o),objs.length),catalog=add(null),pages=add(null),kids=[],contents=[],images=[];let pos=0;
  const push=v=>{const b=typeof v==='string'?enc.encode(v):v;chunks.push(b);pos+=b.length};
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  for(const blob of blobs){
    const bytes=dataUrlBytes(await blobDataUrl(blob)),im=new Image(),u=URL.createObjectURL(blob);
    await new Promise((r,j)=>{im.onload=r;im.onerror=j;im.src=u});
    const w=im.naturalWidth,h=im.naturalHeight;URL.revokeObjectURL(u);
    const iid=add({dict:`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>`,stream:bytes});images.push(iid);
    const cid=add(null);contents.push(cid);kids.push(add(null));
  }
  objs[catalog-1]=`<< /Type /Catalog /Pages ${pages} 0 R >>`;
  objs[pages-1]=`<< /Type /Pages /Kids [${kids.map(x=>x+' 0 R').join(' ')}] /Count ${kids.length} >>`;
  for(let i=0;i<kids.length;i++){
    const pid=kids[i],imgObj=objs[images[i]-1],d=imgObj.dict,w=Number(d.match(/\/Width (\d+)/)[1]),h=Number(d.match(/\/Height (\d+)/)[1]);
    let pw=w,ph=h;
    if(sourcePdf&&sourcePdf.getPage){const pg=await sourcePdf.getPage(i+1),box=pg.getViewport({scale:1});pw=box.width;ph=box.height}
    const stream=enc.encode(`q\n${pw} 0 0 ${ph} 0 0 cm\n/Im0 Do\nQ\n`);
    objs[contents[i]-1]={dict:`<< /Length ${stream.length} >>`,stream};
    objs[pid-1]=`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 ${images[i]} 0 R >> >> /Contents ${contents[i]} 0 R >>`;
  }
  for(let i=0;i<objs.length;i++){offsets[i+1]=pos;push(`${i+1} 0 obj\n`);const o=objs[i];if(typeof o==='string')push(o+'\nendobj\n');else{push(o.dict+'\nstream\n');push(o.stream);push('\nendstream\nendobj\n')}}
  const xref=pos;push(`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`);for(let i=1;i<=objs.length;i++)push(String(offsets[i]).padStart(10,'0')+' 00000 n \n');push(`trailer\n<< /Size ${objs.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`);return new Blob(chunks,{type:'application/pdf'})
}
function blobDataUrl(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(blob)})}
function closeActiveTool(){if($('utilityModal')?.classList.contains('open')){closeUtility();return}closeImagePdf()}
$('closeTool')?.addEventListener('click',closeActiveTool);
document.querySelector('[data-close-tool]')?.addEventListener('click',closeActiveTool);
$('utilityClose')?.addEventListener('click',closeUtility);
document.querySelector('[data-close-utility]')?.addEventListener('click',closeUtility);
$('utilityClear')?.addEventListener('click',()=>{if(window.__utilityId)openUtility(window.__utilityId)});

function closeToHome(){ window.location.href='index.html#tools'; }
function initToolPage(){
  const id=document.body.dataset.toolPage; if(!id)return;
  // Dedicated pages use normal document flow; only the page's own workspace is shown.
  // The breadcrumb is the single visible back control.
  if(id==='image-pdf') openImagePdf(); else openUtility(id);
  document.body.style.overflow='';
}
initToolPage();

// Homepage navigation: use explicit tool IDs so labels/icons can change without breaking routing.
const popularLinks=document.querySelectorAll('.popular [data-tool-id]');
popularLinks.forEach(btn=>btn.addEventListener('click',()=>{
  const id=btn.dataset.toolId;
  if(tools.some(t=>t.id===id)) openTool(id);
}));

// Home means the actual beginning of the page, not just changing the URL hash.
function goHome(e){
  if(e) e.preventDefault();
  if(document.body.classList.contains('tool-page')){window.location.href='index.html#home';return;}
  document.querySelector('.main-nav')?.classList.remove('mobile-open');
  window.scrollTo({top:0,left:0,behavior:'smooth'});
  history.replaceState(null,'','#home');
}
$('homeNav')?.addEventListener('click',goHome);
$('brandHome')?.addEventListener('click',goHome);
// FAQ accordion
document.querySelectorAll('.faq-question').forEach(btn=>btn.addEventListener('click',()=>{
  const item=btn.closest('.faq-item'), answer=item?.querySelector('.faq-answer'), isOpen=item?.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(openItem=>{if(openItem!==item){openItem.classList.remove('open');const q=openItem.querySelector('.faq-question'),a=openItem.querySelector('.faq-answer');q?.setAttribute('aria-expanded','false');if(q?.querySelector('b'))q.querySelector('b').textContent='+';if(a)a.hidden=true;}});
  if(!item||!answer)return; item.classList.toggle('open',!isOpen); btn.setAttribute('aria-expanded',String(!isOpen)); if(btn.querySelector('b'))btn.querySelector('b').textContent='+'; answer.hidden=isOpen;
}));
// Close mobile navigation after a normal section link is selected.
document.querySelectorAll('.main-nav a').forEach(link=>link.addEventListener('click',()=>document.querySelector('.main-nav')?.classList.remove('mobile-open')));
const allToolsToggle=$('allToolsToggle'), allToolsDropdown=$('allToolsDropdown');
function populateAllToolsMenu(){
  if(!allToolsDropdown)return;
  allToolsDropdown.innerHTML=tools.map(t=>`<button type=\"button\" class=\"all-tool-option\" data-menu-open=\"${t.id}\"><span class=\"menu-tool-icon ${t.color}\">${t.icon}</span><span><b>${escapeHtml(t.name)}</b><small>${escapeHtml(t.desc)}</small></span><span aria-hidden=\"true\">→</span></button>`).join('');
  allToolsDropdown.querySelectorAll('[data-menu-open]').forEach(btn=>btn.addEventListener('click',()=>{
    allToolsDropdown.hidden=true; allToolsToggle?.setAttribute('aria-expanded','false'); openTool(btn.dataset.menuOpen);
  }));
}
populateAllToolsMenu();
allToolsToggle?.addEventListener('click',e=>{
  e.stopPropagation();
  const willOpen=allToolsDropdown.hidden;
  allToolsDropdown.hidden=!willOpen;
  allToolsToggle.setAttribute('aria-expanded',String(willOpen));
});
document.addEventListener('click',e=>{
  if(allToolsDropdown && !allToolsDropdown.hidden && !e.target.closest('.all-tools-menu')){
    allToolsDropdown.hidden=true; allToolsToggle?.setAttribute('aria-expanded','false');
  }
});
if(grid) render();
