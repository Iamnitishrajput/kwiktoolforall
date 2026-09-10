const tools=[
{id:'image-pdf',name:'Image → PDF',desc:'Convert JPG or PNG images into a clean PDF document.',icon:'▧',color:'red',keys:'image pdf convert'},
{id:'merge',name:'Merge PDF',desc:'Combine multiple PDF files into one document.',icon:'▤',color:'green',keys:'merge pdf combine'},
{id:'split',name:'Split PDF',desc:'Extract selected pages or ranges into a new PDF.',icon:'✂',color:'orange',keys:'split pdf pages'},
{id:'compress-pdf',name:'Compress PDF',desc:'Reduce PDF file size while keeping useful quality.',icon:'↘',color:'purple',keys:'compress pdf reduce size'},
{id:'resize-image',name:'Resize Image',desc:'Change image dimensions while keeping quality under control.',icon:'↔',color:'blue',keys:'resize image dimensions'},
{id:'compress-image',name:'Compress Image',desc:'Reduce image file size with clear quality choices.',icon:'⌁',color:'purple',keys:'compress image size'}
];
const $=id=>document.getElementById(id), grid=$('toolGrid'), search=$('toolSearch'), empty=$('emptyState'), toast=$('toast');
function showToast(msg){if(!toast)return;toast.textContent=msg;toast.classList.add('show');clearTimeout(window.__kwikToast);window.__kwikToast=setTimeout(()=>toast.classList.remove('show'),2600)}
function render(q=''){const term=q.trim().toLowerCase();const list=(term?tools:tools.slice(0,6)).filter(t=>!term||`${t.name} ${t.desc} ${t.keys}`.toLowerCase().includes(term));grid.innerHTML=list.map(t=>`<article class="tool-card"><div class="tool-icon ${t.color}">${t.icon}</div><h3>${t.name}</h3><p>${t.desc}</p><button class="open-tool ${t.color}" data-open="${t.id}">Open tool →</button></article>`).join('');empty.hidden=list.length>0;grid.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openTool(b.dataset.open))}
function openTool(id){const t=tools.find(x=>x.id===id);if(!t)return;if(id==='image-pdf'){openImagePdf();return}if(['merge','split','compress-pdf','resize-image','compress-image'].includes(id)){openUtility(id);return}showToast(`${t.name} is not available.`)}

const toolModal=$('toolModal'),imageFiles=$('imageFiles'),uploadZone=$('uploadZone'),imageList=$('imageList'),fileCount=$('fileCount'),createPdf=$('createPdf'),pdfStatus=$('pdfStatus'),clearImages=$('clearImages');
const pdfSuccess=$('pdfSuccess'),workspaceHead=document.querySelector('.workspace-head'),upload=$('uploadZone'),fileToolbar=document.querySelector('.file-toolbar'),pagesSection=document.querySelector('.pdf-pages-section'),footer=$('pdfWorkspaceFooter');
const selectAll=$('selectAllPages'),bulkSettings=$('bulkSettings'),selectedCount=$('selectedCount'),bulkSize=$('bulkSize'),bulkOrientation=$('bulkOrientation'),bulkMargin=$('bulkMargin'),applySelected=$('applySelected'),pageCount=$('previewPageCount'),reuse=$('reusePdfTool');
let pdfImages=[],selected=new Set(),selectedPage=0,previewModal=null;
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function formatBytes(n){if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(1)} KB`;return `${(n/1048576).toFixed(1)} MB`}
function resetSuccess(){pdfSuccess.hidden=true;pdfSuccess.classList.remove('is-visible');[workspaceHead,upload,fileToolbar,pagesSection,footer].forEach(x=>x&&x.classList.remove('tool-hidden'));clearImages.disabled=false;createPdf.disabled=pdfImages.length===0}
function showSuccess(){[workspaceHead,upload,fileToolbar,pagesSection,footer].forEach(x=>x&&x.classList.add('tool-hidden'));pdfSuccess.hidden=false;requestAnimationFrame(()=>pdfSuccess.classList.add('is-visible'))}
function clearWorkspace(){pdfImages.forEach(x=>URL.revokeObjectURL(x.url));pdfImages=[];selected.clear();selectedPage=0;if(imageFiles)imageFiles.value='';closePreview();renderPdfImages();pdfStatus.textContent='Add images to get started.'}
function openImagePdf(){closeUtility();resetSuccess();toolModal.classList.add('open');toolModal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';renderPdfImages();setTimeout(()=>imageFiles.focus(),80)}
function closeImagePdf(){toolModal.classList.remove('open');toolModal.setAttribute('aria-hidden','true');document.body.style.overflow='';closePreview()}
$('closeTool').onclick=closeActiveTool;document.querySelector('[data-close-tool]').onclick=closeActiveTool;
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(previewModal?.classList.contains('open'))closePreview();else if($('utilityModal')?.classList.contains('open'))closeUtility();else if(toolModal.classList.contains('open'))closeImagePdf()}});
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
createPdf.onclick=createPdfFile;
$('searchForm').onsubmit=e=>{e.preventDefault();render(search.value);$('tools').scrollIntoView({behavior:'smooth',block:'start'})};$('resetSearch').onclick=()=>{search.value='';render()};$('searchFocus').onclick=()=>{search.focus();window.scrollTo({top:0,behavior:'smooth'})};$('themeToggle').onclick=()=>{document.body.classList.toggle('dark');localStorage.setItem('kwik-theme',document.body.classList.contains('dark')?'dark':'light')};if(localStorage.getItem('kwik-theme')==='dark')document.body.classList.add('dark');$('mobileMenu').onclick=()=>document.querySelector('.main-nav')?.classList.toggle('mobile-open');
/* Stable utilities */
function openToolModal(){toolModal.classList.add('open');toolModal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
function openUtility(id){
  const u={merge:['PDF TOOL','Merge PDF','Combine multiple PDF files into one PDF locally.'],split:['PDF TOOL','Split PDF','Extract selected pages or ranges into a new PDF locally.'],'compress-pdf':['PDF TOOL','Compress PDF','Choose how much to reduce the PDF while keeping useful quality.'],'resize-image':['IMAGE TOOL','Resize Image','Change image dimensions without uploading your file.'],'compress-image':['IMAGE TOOL','Compress Image','Reduce image size with a quality level you control.']}[id];
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
function renderSplitTool(body){body.innerHTML=utilityUploadMarkup('split',false)+`<div class="utility-field"><label>Pages or ranges <input id="splitRange" type="text" placeholder="Example: 1, 3-5, 8"></label><small>Use commas for separate pages and hyphens for ranges.</small></div><div class="utility-actions"><button class="primary-action" id="splitRun" disabled>Split PDF →</button></div>`;let file=null;const input=$('utilityFiles'),run=$('splitRun'),sync=()=>run.disabled=!file||!$('splitRange').value.trim();input.onchange=()=>{file=input.files[0]||null;$('utilityFileList').innerHTML=file?`<div class="utility-file"><span>1</span><div><b>${escapeHtml(file.name)}</b><small>${formatBytes(file.size)}</small></div></div>`:'';sync();$('utilityStatus').textContent=file?'Enter pages or ranges.':'Choose a PDF.'};$('splitRange').oninput=sync;run.onclick=async()=>{try{run.disabled=true;const src=await PDFLib.PDFDocument.load(await file.arrayBuffer()),pages=parseRanges($('splitRange').value,src.getPageCount());if(!pages.length)throw Error('No valid pages');const out=await PDFLib.PDFDocument.create();(await out.copyPages(src,pages.map(n=>n-1))).forEach(p=>out.addPage(p));downloadBlob(new Blob([await out.save({useObjectStreams:true})],{type:'application/pdf'}),'KwikToolForAll_Split.pdf');showUtilitySuccess('Split complete. Your selected pages are now downloaded.')}catch(e){console.error(e);showToast('Please check the page numbers or PDF.');$('utilityStatus').textContent='Split failed.'}finally{run.disabled=false}}}
function parseRanges(text,total){const set=new Set();for(const part of text.split(',')){const x=part.trim();if(/^\d+$/.test(x)){const n=+x;if(n>=1&&n<=total)set.add(n)}else{const m=x.match(/^(\d+)\s*-\s*(\d+)$/);if(m){let a=+m[1],b=+m[2];if(a>b)[a,b]=[b,a];for(let n=a;n<=b&&n<=total;n++)if(n>=1)set.add(n)}}}return [...set].sort((a,b)=>a-b)}
function imageToolMarkup(title,desc){return `<div class="image-tool-grid"><div class="utility-upload"><div class="utility-upload-icon">↥</div><h3>Upload an image</h3><p>${desc}</p><label class="choose-files">Choose image<input id="utilityImageFile" type="file" accept="image/jpeg,image/png,image/webp" hidden></label></div><div class="utility-preview-panel"><div class="utility-preview-empty" id="utilityImagePreview">Preview will appear here.</div></div></div>`}
function loadImageFile(file,cb){const url=URL.createObjectURL(file),img=new Image();img.onload=()=>cb(img,url);img.onerror=()=>{URL.revokeObjectURL(url);showToast('Could not read that image.')};img.src=url}
function renderResizeTool(body){body.innerHTML=imageToolMarkup('Resize Image','JPG, PNG or WebP. Set the output dimensions below.')+`<div class="utility-options"><label>Width <input id="resizeW" type="number" min="1"></label><label>Height <input id="resizeH" type="number" min="1"></label><label class="check-line"><input id="resizeKeep" type="checkbox" checked> Keep aspect ratio</label><label>Format<select id="resizeFormat"><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option></select></label></div><div class="utility-actions"><button class="primary-action" id="resizeRun" disabled>Resize & Download →</button></div>`;let img=null;const input=$('utilityImageFile'),w=$('resizeW'),h=$('resizeH'),run=$('resizeRun');input.onchange=()=>{const file=input.files[0];if(!file)return;loadImageFile(file,(im,u)=>{img=im;w.value=im.naturalWidth;h.value=im.naturalHeight;$('utilityImagePreview').innerHTML=`<img src="${u}" alt="Preview">`;run.disabled=false;$('utilityStatus').textContent=`Original: ${im.naturalWidth} × ${im.naturalHeight} · ${formatBytes(file.size)}`})};w.oninput=()=>{if(img&&$('resizeKeep').checked)h.value=Math.max(1,Math.round(Number(w.value)*img.naturalHeight/img.naturalWidth))};h.oninput=()=>{if(img&&$('resizeKeep').checked)w.value=Math.max(1,Math.round(Number(h.value)*img.naturalWidth/img.naturalHeight))};run.onclick=async()=>{try{const c=document.createElement('canvas'),ow=Math.max(1,+w.value),oh=Math.max(1,+h.value);c.width=ow;c.height=oh;c.getContext('2d').drawImage(img,0,0,ow,oh);const type=$('resizeFormat').value;downloadBlob(await canvasBlob(c,type,.92),`KwikToolForAll_Resized.${type==='image/png'?'png':'jpg'}`);showUtilitySuccess('Resize complete. Your resized image is now downloaded.')}catch(e){showToast('Could not resize this image.')}}}
function renderCompressTool(body){body.innerHTML=imageToolMarkup('Compress Image','Choose a compression level. Your original stays on your device.')+`<div class="compression-choices"><button type="button" class="compression-choice active" data-level="light"><b>Quality-first</b><small>Light compression · keeps the original look.</small></button><button type="button" class="compression-choice" data-level="balanced"><b>Balanced</b><small>Good quality with a useful size reduction.</small></button><button type="button" class="compression-choice" data-level="small"><b>Smaller file</b><small>Stronger compression for sharing and uploads.</small></button></div><div class="utility-options"><label>Format<select id="compressFormat"><option value="image/jpeg">JPEG · best for photos</option><option value="image/png">PNG</option></select></label></div><div class="utility-actions"><button class="primary-action" id="compressRun" disabled>Compress & Download →</button></div>`;let img=null,level='light';const input=$('utilityImageFile'),run=$('compressRun');body.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{level=b.dataset.level;body.querySelectorAll('[data-level]').forEach(x=>x.classList.toggle('active',x===b));if(img)run.disabled=false;$('utilityStatus').textContent=`${b.querySelector('b').textContent} selected.`});input.onchange=()=>{const file=input.files[0];if(!file)return;loadImageFile(file,(im,u)=>{img=im;$('utilityImagePreview').innerHTML=`<img src="${u}" alt="Preview">`;run.disabled=false;$('utilityStatus').textContent=`Image ready · ${formatBytes(file.size)} · ${im.naturalWidth} × ${im.naturalHeight}`})};run.onclick=async()=>{try{const cfg={light:{q:.9,max:Math.max(img.naturalWidth,2400)},balanced:{q:.76,max:2400},small:{q:.58,max:1800}}[level],scale=Math.min(1,cfg.max/img.naturalWidth),w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale)),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);const type=$('compressFormat').value;downloadBlob(await canvasBlob(c,type,cfg.q),`KwikToolForAll_Compressed.${type==='image/png'?'png':'jpg'}`);showUtilitySuccess(`${level==='light'?'Quality-first':level==='balanced'?'Balanced':'Smaller file'} compression complete. Your compressed image is now downloaded.`)}catch(e){showToast('Could not compress this image.')}}}
function canvasBlob(c,type,q){return new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(Error('Encode failed')),type,q))}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function showUtilitySuccess(message){$('utilityBody').innerHTML=`<div class="utility-success"><div class="success-orbit"><div class="success-check" aria-hidden="true"></div></div><span class="success-eyebrow">DOWNLOAD COMPLETE</span><h3>Thank you for using<br><strong>KwikToolForAll.</strong></h3><p class="success-main">${message}</p><p class="success-sub">Please check your <strong>Downloads</strong> folder.</p><div class="privacy-confirm"><span class="privacy-confirm-icon" aria-hidden="true"></span><div><strong>Your privacy is protected</strong><span>Your file was processed locally in your browser and was not uploaded.</span></div></div><button type="button" class="reuse-tool" id="utilityReuse"><span>↻</span> Re-use the tool</button><small class="success-note">No account • No cloud storage • No file retained</small></div>`;$('utilityReuse').onclick=()=>openUtility(window.__utilityId)}
if(window.pdfjsLib)pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
function renderCompressPdfTool(body){body.innerHTML=utilityUploadMarkup('compress-pdf',false)+`<div class="compression-choices"><button type="button" class="compression-choice active" data-pdf-level="light"><b>Quality-first</b><small>Light compression · preserves more detail.</small></button><button type="button" class="compression-choice" data-pdf-level="balanced"><b>Balanced</b><small>Good quality with a meaningful size reduction.</small></button><button type="button" class="compression-choice" data-pdf-level="small"><b>Smaller file</b><small>Stronger reduction for easier sharing.</small></button></div><div class="utility-actions"><button class="primary-action" id="compressPdfRun" disabled>Compress PDF →</button></div>`;let file=null,level='light';const input=$('utilityFiles'),run=$('compressPdfRun');body.querySelectorAll('[data-pdf-level]').forEach(b=>b.onclick=()=>{level=b.dataset.pdfLevel;body.querySelectorAll('[data-pdf-level]').forEach(x=>x.classList.toggle('active',x===b));if(file)run.disabled=false;$('utilityStatus').textContent=`${b.querySelector('b').textContent} selected.`});input.onchange=()=>{file=input.files[0]||null;$('utilityFileList').innerHTML=file?`<div class="utility-file"><span>1</span><div><b>${escapeHtml(file.name)}</b><small>${formatBytes(file.size)}</small></div></div>`:'';run.disabled=!file;$('utilityStatus').textContent=file?`PDF ready · ${formatBytes(file.size)} · ${level==='light'?'Quality-first':level==='balanced'?'Balanced':'Smaller file'} selected.`:'Choose a PDF.'};run.onclick=async()=>{try{if(!window.pdfjsLib)throw Error('PDF renderer unavailable');run.disabled=true;const cfg={light:{scale:1.35,q:.9},balanced:{scale:1.1,q:.76},small:{scale:.85,q:.58}}[level],pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise,pages=[];for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n),vp=page.getViewport({scale:cfg.scale}),c=document.createElement('canvas');c.width=Math.max(1,Math.round(vp.width));c.height=Math.max(1,Math.round(vp.height));await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;pages.push(await canvasBlob(c,'image/jpeg',cfg.q));$('utilityStatus').textContent=`Compressing page ${n} of ${pdf.numPages}…`}downloadBlob(await jpegBlobsToPdf(pages),'KwikToolForAll_Compressed.pdf');showUtilitySuccess(`${level==='light'?'Quality-first':level==='balanced'?'Balanced':'Smaller file'} PDF compression complete. Your compressed PDF is now downloaded.`)}catch(e){console.error(e);showToast('Could not compress this PDF.');$('utilityStatus').textContent='Compression failed.'}finally{run.disabled=false}}}
async function jpegBlobsToPdf(blobs){const enc=new TextEncoder(),chunks=[],offsets=[0],objs=[],add=o=>(objs.push(o),objs.length),catalog=add(null),pages=add(null),kids=[],contents=[],images=[];let pos=0;const push=v=>{const b=typeof v==='string'?enc.encode(v):v;chunks.push(b);pos+=b.length};push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');for(const blob of blobs){const bytes=dataUrlBytes(await blobDataUrl(blob)),im=new Image(),u=URL.createObjectURL(blob);await new Promise((r,j)=>{im.onload=r;im.onerror=j;im.src=u});const w=im.naturalWidth,h=im.naturalHeight;URL.revokeObjectURL(u);const iid=add({dict:`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>`,stream:bytes});images.push(iid);const s=enc.encode(`q\n${w} 0 0 ${h} 0 0 cm\n/Im0 Do\nQ\n`),cid=add({dict:`<< /Length ${s.length} >>`,stream:s});contents.push(cid);kids.push(add(null))}objs[catalog-1]=`<< /Type /Catalog /Pages ${pages} 0 R >>`;objs[pages-1]=`<< /Type /Pages /Kids [${kids.map(x=>x+' 0 R').join(' ')}] /Count ${kids.length} >>`;kids.forEach((pid,i)=>{const d=objs[images[i]-1].dict,w=Number(d.match(/\/Width (\d+)/)[1]),h=Number(d.match(/\/Height (\d+)/)[1]);objs[pid-1]=`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${images[i]} 0 R >> >> /Contents ${contents[i]} 0 R >>`});for(let i=0;i<objs.length;i++){offsets[i+1]=pos;push(`${i+1} 0 obj\n`);const o=objs[i];if(typeof o==='string')push(o+'\nendobj\n');else{push(o.dict+'\nstream\n');push(o.stream);push('\nendstream\nendobj\n')}}const xref=pos;push(`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`);for(let i=1;i<=objs.length;i++)push(String(offsets[i]).padStart(10,'0')+' 00000 n \n');push(`trailer\n<< /Size ${objs.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`);return new Blob(chunks,{type:'application/pdf'})}
function blobDataUrl(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(blob)})}
function closeActiveTool(){if($('utilityModal')?.classList.contains('open')){closeUtility();return}closeImagePdf()}
$('closeTool').onclick=closeActiveTool;
document.querySelector('[data-close-tool]').onclick=closeActiveTool;
$('utilityClose').onclick=closeUtility;
document.querySelector('[data-close-utility]').onclick=closeUtility;
$('utilityClear').onclick=()=>{if(window.__utilityId)openUtility(window.__utilityId)};

// Homepage navigation: popular shortcuts and All Tools menu must open tools directly.
const popularLinks=document.querySelectorAll('.popular [data-query]');
popularLinks.forEach(btn=>btn.addEventListener('click',()=>{
  const match=tools.find(t=>t.name.toLowerCase()===btn.dataset.query.toLowerCase()) ||
    tools.find(t=>t.name.toLowerCase().replace(/\s+/g,' ').includes(btn.dataset.query.toLowerCase()));
  if(match){ openTool(match.id); }
}));
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
render();
