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
function render(q=''){const term=q.trim().toLowerCase();const list=tools.filter(t=>!term||`${t.name} ${t.desc} ${t.keys}`.toLowerCase().includes(term));grid.innerHTML=list.map(t=>`<article class="tool-card"><div class="tool-icon ${t.color}">${t.icon}</div><h3>${t.name}</h3><p>${t.desc}</p><button class="open-tool ${t.color}" data-open="${t.id}">Open tool →</button></article>`).join('');empty.hidden=list.length>0;grid.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openTool(b.dataset.open))}
function openTool(id){const t=tools.find(x=>x.id===id);if(!t)return;if(id==='image-pdf'){openImagePdf();return}if(id==='scanner'){openScanner();return}$('tools').scrollIntoView({behavior:'smooth',block:'start'});showToast(`${t.name} is selected. This tool is next in the build queue.`)}

const toolModal=$('toolModal'),imageFiles=$('imageFiles'),uploadZone=$('uploadZone'),imageList=$('imageList'),fileCount=$('fileCount'),createPdf=$('createPdf'),pdfStatus=$('pdfStatus'),clearImages=$('clearImages');
const pdfSuccess=$('pdfSuccess'),workspaceHead=document.querySelector('.workspace-head'),upload=$('uploadZone'),fileToolbar=document.querySelector('.file-toolbar'),pagesSection=document.querySelector('.pdf-pages-section'),footer=$('pdfWorkspaceFooter');
const selectAll=$('selectAllPages'),bulkSettings=$('bulkSettings'),selectedCount=$('selectedCount'),bulkSize=$('bulkSize'),bulkOrientation=$('bulkOrientation'),bulkMargin=$('bulkMargin'),applySelected=$('applySelected'),pageCount=$('previewPageCount'),reuse=$('reusePdfTool');
let pdfImages=[],selected=new Set(),selectedPage=0,previewModal=null;
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function formatBytes(n){if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(1)} KB`;return `${(n/1048576).toFixed(1)} MB`}
function resetSuccess(){pdfSuccess.hidden=true;pdfSuccess.classList.remove('is-visible');[workspaceHead,upload,fileToolbar,pagesSection,footer].forEach(x=>x&&x.classList.remove('tool-hidden'));clearImages.disabled=false;createPdf.disabled=pdfImages.length===0}
function showSuccess(){[workspaceHead,upload,fileToolbar,pagesSection,footer].forEach(x=>x&&x.classList.add('tool-hidden'));pdfSuccess.hidden=false;requestAnimationFrame(()=>pdfSuccess.classList.add('is-visible'))}
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
function pageAction(action,i){if(action==='remove'){URL.revokeObjectURL(pdfImages[i].url);pdfImages.splice(i,1);selected=new Set([...selected].filter(x=>x!==i).map(x=>x>i?x-1:x));selectedPage=Math.min(selectedPage,Math.max(0,pdfImages.length-1))}else if(action==='up'&&i>0){[pdfImages[i-1],pdfImages[i]]=[pdfImages[i],pdfImages[i-1]];remapSelection(i,i-1);selectedPage=i-1}else if(action==='down'&&i<pdfImages.length-1){[pdfImages[i+1],pdfImages[i]]=[pdfImages[i],pdfImages[i+1]];remapSelection(i,i+1);selectedPage=i+1}else if(action==='rotate'){pdfImages[i].rotation=(pdfImages[i].rotation+90)%360;selectedPage=i;if(previewModal?.classList.contains('open')){renderPreview()}}renderPdfImages()}
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
function openSelectedTool(id){const t=tools.find(x=>x.id===id);if(!t)return;openTool(id)}
function populateAllToolsMenu(){const menu=$('allToolsDropdown');if(!menu)return;menu.innerHTML=tools.map(t=>`<button type="button" class="all-tool-option" data-menu-tool="${t.id}"><span class="menu-tool-icon ${t.color}">${t.icon}</span><span><b>${t.name}</b><small>${t.desc}</small></span><strong>→</strong></button>`).join('');menu.querySelectorAll('[data-menu-tool]').forEach(b=>b.onclick=()=>{const id=b.dataset.menuTool;$('allToolsDropdown').hidden=true;$('allToolsToggle').setAttribute('aria-expanded','false');openSelectedTool(id)})}
$('searchForm').onsubmit=e=>{e.preventDefault();render(search.value);$('tools').scrollIntoView({behavior:'smooth',block:'start'})};document.querySelectorAll('[data-query]').forEach(b=>b.onclick=()=>{search.value=b.dataset.query;render(b.dataset.query);$('tools').scrollIntoView({behavior:'smooth',block:'start'})});$('resetSearch').onclick=()=>{search.value='';render()};$('searchFocus').onclick=()=>{search.focus();window.scrollTo({top:0,behavior:'smooth'})};function syncThemeControls(){const dark=document.body.classList.contains('dark');document.querySelectorAll('.theme-toggle').forEach(b=>{b.setAttribute('aria-pressed',String(dark));b.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');const icon=b.querySelector('.theme-icon');const label=b.querySelector('.theme-label');if(icon)icon.textContent=dark?'☀':'☾';if(label)label.textContent=dark?'Light':'Dark'})}
function toggleTheme(){document.body.classList.toggle('dark');localStorage.setItem('kwik-theme',document.body.classList.contains('dark')?'dark':'light');syncThemeControls()}
$('themeToggle').onclick=toggleTheme;
if(localStorage.getItem('kwik-theme')==='dark')document.body.classList.add('dark');
syncThemeControls();
function addAppThemeControls(){document.querySelectorAll('.tool-workspace').forEach(ws=>{if(ws.querySelector('.app-theme-toggle'))return;const b=document.createElement('button');b.type='button';b.className='app-theme-toggle theme-toggle';b.innerHTML='<span class="theme-icon">☾</span><span class="theme-label">Dark</span>';b.onclick=toggleTheme;b.title='Switch light / dark mode';ws.appendChild(b)});syncThemeControls()}
addAppThemeControls();$('mobileMenu').onclick=()=>document.querySelector('.main-nav')?.classList.toggle('mobile-open');
$('allToolsToggle').onclick=()=>{const menu=$('allToolsDropdown');const open=menu.hidden;menu.hidden=!open;$('allToolsToggle').setAttribute('aria-expanded',String(open))};document.addEventListener('click',e=>{const wrap=document.querySelector('.all-tools-menu');if(wrap&&!wrap.contains(e.target)){$('allToolsDropdown').hidden=true;$('allToolsToggle').setAttribute('aria-expanded','false')}});populateAllToolsMenu();render();


/* Document Scanner */
const scannerWorkspace=$('scannerWorkspace');
const scannerFiles=$('scannerFiles'),scannerCamera=$('scannerCamera'),autoScan=$('autoScan'),scannerStage=$('scannerStage');
let scanPages=[],scanIndex=0,scannerCrop=null;
function openScanner(){
  resetSuccess();
  [workspaceHead,upload,fileToolbar,pagesSection,footer,pdfSuccess].forEach(x=>x&&x.classList.add('tool-hidden'));
  scannerWorkspace.hidden=false;
  toolModal.classList.add('open');toolModal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
  renderScanner();
}
function closeScanner(){scannerWorkspace.hidden=true;toolModal.classList.remove('open');toolModal.setAttribute('aria-hidden','true');document.body.style.overflow='';scannerSharePanel?.setAttribute('hidden','');}
$('closeTool').onclick=()=>{if(!scannerWorkspace.hidden)closeScanner();else closeImagePdf()};
scannerFiles.addEventListener('change',e=>{addScanFiles([...e.target.files]);e.target.value=''});
scannerCamera.addEventListener('change',e=>{addScanFiles([...e.target.files]);e.target.value=''});
function addScanFiles(files){
  const valid=files.filter(f=>f.type.startsWith('image/')||/\.(jpe?g|png|webp|heic|heif)$/i.test(f.name));
  if(valid.length<files.length)showToast('Please choose image files.');
  valid.forEach(file=>{const p={file,url:URL.createObjectURL(file),rotation:0,filter:'original',brightness:100,contrast:100,cropScale:100,crop:null,naturalWidth:0,naturalHeight:0};scanPages.push(p);loadScanImage(p)});
  if(valid.length){scanIndex=Math.max(0,scanPages.length-valid.length);renderScanner()}
}
function loadScanImage(p){const im=new Image();im.onload=()=>{p.naturalWidth=im.naturalWidth;p.naturalHeight=im.naturalHeight;if(autoScan.checked)p.crop=detectDocumentCrop(im);renderScanner()};im.onerror=()=>showToast(`Could not read ${p.file.name}.`);im.src=p.url}
function detectDocumentCrop(im){
  const w=Math.min(600,im.naturalWidth),h=Math.min(600,im.naturalHeight),c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(im,0,0,w,h);const d=x.getImageData(0,0,w,h).data;
  const border=[];for(let i=0;i<w;i++){border.push((d[i*4]+d[i*4+1]+d[i*4+2])/3);let j=((h-1)*w+i)*4;border.push((d[j]+d[j+1]+d[j+2])/3)}for(let y=1;y<h-1;y++){let a=(y*w)*4,b=(y*w+w-1)*4;border.push((d[a]+d[a+1]+d[a+2])/3,(d[b]+d[b+1]+d[b+2])/3)}
  const avg=border.reduce((a,b)=>a+b,0)/border.length;let minX=w,minY=h,maxX=0,maxY=0,found=0,thr=Math.max(22,Math.min(55,Math.abs(avg-128)*.18+25));
  for(let y=2;y<h-2;y+=2)for(let xx=2;xx<w-2;xx+=2){const k=(y*w+xx)*4,v=(d[k]+d[k+1]+d[k+2])/3;if(Math.abs(v-avg)>thr){minX=Math.min(minX,xx);minY=Math.min(minY,y);maxX=Math.max(maxX,xx);maxY=Math.max(maxY,y);found++}}
  if(found<(w*h*.025)||maxX-minX<w*.45||maxY-minY<h*.45)return{x:0,y:0,w:1,h:1};
  const pad=.025;minX=Math.max(0,minX-w*pad);minY=Math.max(0,minY-h*pad);maxX=Math.min(w,maxX+w*pad);maxY=Math.min(h,maxY+h*pad);return{x:minX/w,y:minY/h,w:(maxX-minX)/w,h:(maxY-minY)/h};
}
function currentScan(){return scanPages[scanIndex]}
function renderScanner(){
  const p=currentScan();$('scannerPageCount').textContent=`${scanPages.length} page${scanPages.length===1?'':'s'}`;$('scannerPageTitle').textContent=p?`Page ${scanIndex+1} · ${escapeHtml(p.file.name)}`:'No page selected';
  $('scannerPrev').disabled=scanIndex<=0;$('scannerNext').disabled=scanIndex>=scanPages.length-1;
  if(!p){scannerStage.innerHTML='<div class="scanner-empty">Choose a document image or camera photo to begin.</div>';return}
  scannerStage.innerHTML='';const c=document.createElement('canvas');c.id='scannerCanvas';scannerStage.appendChild(c);drawScannerCanvas();
  document.querySelectorAll('#scannerFilters button').forEach(b=>b.classList.toggle('active',b.dataset.filter===p.filter));
  $('scannerPageSize').value=p.pageSize||'a4';$('scannerBrightness').value=p.brightness;$('scannerContrast').value=p.contrast;$('scannerCropScale').value=p.cropScale;
  $('scannerStatus').textContent=`Page ${scanIndex+1} ready · ${autoScan.checked?'Auto scan on':'Auto scan off'}`;
}
function getCropRect(p){const c=p.crop||{x:0,y:0,w:1,h:1};const scale=(p.cropScale||100)/100;const cx=c.x+c.w/2,cy=c.y+c.h/2,w=c.w*scale,h=c.h*scale;return{x:Math.max(0,cx-w/2),y:Math.max(0,cy-h/2),w:Math.min(w,1-Math.max(0,cx-w/2)),h:Math.min(h,1-Math.max(0,cy-h/2))}}
function drawScannerCanvas(){const p=currentScan(),canvas=$('scannerCanvas');if(!p||!canvas)return;const im=new Image();im.onload=()=>{const r=getCropRect(p),cw=Math.max(1,Math.round(im.naturalWidth*r.w)),ch=Math.max(1,Math.round(im.naturalHeight*r.h));canvas.width=cw;canvas.height=ch;const ctx=canvas.getContext('2d');ctx.filter=`brightness(${p.brightness}%) contrast(${p.contrast}%)`;ctx.drawImage(im,im.naturalWidth*r.x,im.naturalHeight*r.y,im.naturalWidth*r.w,im.naturalHeight*r.h,0,0,cw,ch);ctx.filter='none';applyScannerFilter(ctx,cw,ch,p.filter);if(p.rotation){const rot=document.createElement('canvas');rot.width=(p.rotation%180)?ch:cw;rot.height=(p.rotation%180)?cw:ch;const rc=rot.getContext('2d');rc.translate(rot.width/2,rot.height/2);rc.rotate(p.rotation*Math.PI/180);rc.drawImage(canvas,-cw/2,-ch/2);canvas.width=rot.width;canvas.height=rot.height;canvas.getContext('2d').drawImage(rot,0,0)} };im.src=p.url}
function applyScannerFilter(ctx,w,h,f){if(f==='original')return;const img=ctx.getImageData(0,0,w,h),d=img.data;for(let i=0;i<d.length;i+=4){let r=d[i],g=d[i+1],b=d[i+2],gray=.299*r+.587*g+.114*b;if(f==='gray'){r=g=b=gray}else if(f==='bw'){let v=gray>175?255:gray<95?0:255;r=g=b=v}else if(f==='blue'){r=gray*.72;g=gray*.86;b=Math.min(255,gray*1.08+35)}else if(f==='color'){const boost=1.16;r=Math.min(255,(r-128)*boost+128);g=Math.min(255,(g-128)*boost+128);b=Math.min(255,(b-128)*boost+128)}d[i]=r;d[i+1]=g;d[i+2]=b}ctx.putImageData(img,0,0)}
$('scannerPrev').onclick=()=>{if(scanIndex>0){scanIndex--;renderScanner()}};$('scannerNext').onclick=()=>{if(scanIndex<scanPages.length-1){scanIndex++;renderScanner()}};
$('scannerAddPage').onclick=()=>scannerFiles.click();
$('scannerClear').onclick=()=>{scanPages.forEach(p=>URL.revokeObjectURL(p.url));scanPages=[];scanIndex=0;renderScanner()};
$('scannerDone').onclick=closeScanner;
autoScan.onchange=()=>{const p=currentScan();if(p&&autoScan.checked){const im=new Image();im.onload=()=>{p.crop=detectDocumentCrop(im);p.cropScale=100;renderScanner()};im.src=p.url}else renderScanner()};
$('scannerAutoCrop').onclick=()=>{const p=currentScan();if(!p)return;const im=new Image();im.onload=()=>{p.crop=detectDocumentCrop(im);p.cropScale=100;renderScanner();showToast('Document edges detected.')};im.src=p.url};
$('scannerCropScale').oninput=e=>{const p=currentScan();if(p){p.cropScale=Number(e.target.value);drawScannerCanvas()}};
$('scannerBrightness').oninput=e=>{const p=currentScan();if(p){p.brightness=Number(e.target.value);drawScannerCanvas()}};$('scannerContrast').oninput=e=>{const p=currentScan();if(p){p.contrast=Number(e.target.value);drawScannerCanvas()}};
document.querySelectorAll('#scannerFilters button').forEach(b=>b.onclick=()=>{const p=currentScan();if(p){p.filter=b.dataset.filter;renderScanner()}});
$('scannerRotateLeft').onclick=()=>{const p=currentScan();if(p){p.rotation=(p.rotation+270)%360;drawScannerCanvas()}};$('scannerRotateRight').onclick=()=>{const p=currentScan();if(p){p.rotation=(p.rotation+90)%360;drawScannerCanvas()}};
$('scannerPageSize').onchange=e=>{const p=currentScan();if(p)p.pageSize=e.target.value};
$('scannerManualCrop').onclick=()=>enableManualScannerCrop();
function enableManualScannerCrop(){const p=currentScan(),canvas=$('scannerCanvas');if(!p||!canvas)return;showToast('Drag on the preview to crop.');let start=null;const finish=e=>{if(!start)return;const box=canvas.getBoundingClientRect();const sx=Math.max(0,Math.min(start.x,e.clientX)-box.left)/box.width,sy=Math.max(0,Math.min(start.y,e.clientY)-box.top)/box.height,ex=Math.min(1,Math.max(start.x,e.clientX)-box.left)/box.width,ey=Math.min(1,Math.max(start.y,e.clientY)-box.top)/box.height;p.crop={x:Math.min(sx,ex),y:Math.min(sy,ey),w:Math.abs(ex-sx),h:Math.abs(ey-sy)};start=null;canvas.style.cursor='default';window.removeEventListener('pointerup',finish);renderScanner()};canvas.style.cursor='crosshair';canvas.onpointerdown=e=>{start={x:e.clientX,y:e.clientY};window.addEventListener('pointerup',finish,{once:true})};canvas.style.cursor='crosshair';canvas.onpointerdown=e=>{start={x:e.clientX,y:e.clientY};window.addEventListener('pointerup',finish,{once:true})}}
async function makeProcessedCanvas(p){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{const r=getCropRect(p);const srcW=Math.max(1,Math.round(im.naturalWidth*r.w)),srcH=Math.max(1,Math.round(im.naturalHeight*r.h));let outW=srcW,outH=srcH;if(p.pageSize==='a4'){outW=1240;outH=1754}else if(p.pageSize==='letter'){outW=1275;outH=1650}else if(p.pageSize==='id'){outW=1013;outH=638}const portrait=srcH>=srcW;if(p.pageSize==='a4'||p.pageSize==='letter'){if(!portrait)[outW,outH]=[outH,outW]}if(p.rotation%180)[outW,outH]=[outH,outW];const c=document.createElement('canvas');c.width=outW;c.height=outH;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,outW,outH);ctx.filter=`brightness(${p.brightness}%) contrast(${p.contrast}%)`;const iw=im.naturalWidth*r.w,ih=im.naturalHeight*r.h;let dw=iw,dh=ih;if(p.pageSize!=='original'){const pad=(p.pageSize==='id'?28:80);const fit=Math.min((outW-pad*2)/iw,(outH-pad*2)/ih);dw=iw*fit;dh=ih*fit}ctx.save();ctx.translate(outW/2,outH/2);ctx.rotate(p.rotation*Math.PI/180);ctx.drawImage(im,im.naturalWidth*r.x,im.naturalHeight*r.y,iw,ih,-dw/2,-dh/2,dw,dh);ctx.restore();ctx.filter='none';applyScannerFilter(ctx,outW,outH,p.filter);resolve(c)};im.onerror=reject;im.src=p.url})}
function canvasBlob(){const p=currentScan();return makeProcessedCanvas(p).then(c=>new Promise(r=>c.toBlob(r,'image/jpeg',.94)))}
async function exportScanner(kind){if(!scanPages.length)return;const old=$('scannerStatus').textContent;$('scannerStatus').textContent=`Preparing ${kind.toUpperCase()}…`;try{if(kind==='pdf'){const pages=[];for(let i=0;i<scanPages.length;i++){scanIndex=i;renderScanner();await new Promise(r=>setTimeout(r,30));pages.push(await canvasBlob())}await makeScannerPdf(pages);scanIndex=Math.min(scanIndex,scanPages.length-1);renderScanner()}else if(kind==='word'){const parts=[];for(let i=0;i<scanPages.length;i++){scanIndex=i;renderScanner();await new Promise(r=>setTimeout(r,30));const b=await canvasBlob();parts.push(`<p><img src="data:image/jpeg;base64,${await blobBase64(b)}" style="max-width:100%;"></p>`)}const html=`<html><body>${parts.join('<hr>')}</body></html>`,blob=new Blob(['\ufeff',html],{type:'application/msword'});downloadBlob(blob,`KwikToolForAll_Scan_${dateStamp()}.doc`,'application/msword')}else{scanIndex=scanIndex;renderScanner();const b=await canvasBlob();downloadBlob(b,`KwikToolForAll_Scan_${dateStamp()}.${kind}`,`image/${kind==='jpg'?'jpeg':'png'}`)}$('scannerStatus').textContent=`${kind.toUpperCase()} ready.`;showToast(`${kind.toUpperCase()} exported.`)}catch(e){console.error(e);$('scannerStatus').textContent=old;showToast('Export failed. Please try again.')}}
function dateStamp(){return new Date().toISOString().slice(0,10)}
function blobBase64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(String(r.result).split(',')[1]);r.onerror=rej;r.readAsDataURL(blob)})}
async function makeScannerPdf(blobs){const bytes=[];let pos=0,offsets=[0],objects=[];const enc=new TextEncoder();const push=v=>{const b=typeof v==='string'?enc.encode(v):v;bytes.push(b);pos+=b.length};push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');const cat=1,pages=2,pageIds=[],imgIds=[],contentIds=[];objects[cat]=`<< /Type /Catalog /Pages ${pages} 0 R >>`;objects[pages]=null;for(const blob of blobs){const data=dataUrlBytes(await blobDataUrl(blob));const jpg=data;const im=new Image();const u=URL.createObjectURL(blob);await new Promise((r,j)=>{im.onload=r;im.onerror=j;im.src=u});const w=im.naturalWidth,h=im.naturalHeight;URL.revokeObjectURL(u);const iid=objects.length;objects.push({dict:`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>`,stream:jpg});imgIds.push(iid);const cid=objects.length;const stream=enc.encode(`q\n${w} 0 0 ${h} 0 0 cm\n/Im0 Do\nQ\n`);objects.push({dict:`<< /Length ${stream.length} >>`,stream});contentIds.push(cid);pageIds.push(objects.length);objects.push(null)}objects[pages]=`<< /Type /Pages /Kids [${pageIds.map(i=>i+' 0 R').join(' ')}] /Count ${pageIds.length} >>`;for(let i=0;i<pageIds.length;i++){const id=imgIds[i],im=objects[id].dict,w=Number(im.match(/\/Width (\d+)/)[1]),h=Number(im.match(/\/Height (\d+)/)[1]);objects[pageIds[i]]=`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${id} 0 R >> >> /Contents ${contentIds[i]} 0 R >>`}const offs=new Array(objects.length);for(let i=1;i<objects.length;i++){offs[i]=pos;push(`${i} 0 obj\n`);const o=objects[i];if(typeof o==='string')push(o+'\nendobj\n');else{push(o.dict+'\nstream\n');push(o.stream);push('\nendstream\nendobj\n')}}const xref=pos;push(`xref\n0 ${objects.length}\n0000000000 65535 f \n`);for(let i=1;i<objects.length;i++)push(String(offs[i]).padStart(10,'0')+' 00000 n \n');push(`trailer\n<< /Size ${objects.length} /Root ${cat} 0 R >>\nstartxref\n${xref}\n%%EOF`);downloadBlob(new Blob(bytes,{type:'application/pdf'}),`KwikToolForAll_Scan_${dateStamp()}.pdf`,'application/pdf')}
function blobDataUrl(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(blob)})}
document.querySelectorAll('[data-export]').forEach(b=>b.onclick=()=>exportScanner(b.dataset.export));
const scannerShare=$('scannerShare'),scannerSharePanel=$('scannerSharePanel');scannerShare.onclick=()=>{scannerSharePanel.hidden=false};$('scannerShareClose').onclick=()=>scannerSharePanel.hidden=true;
async function shareScanner(mode){if(!scanPages.length)return;scanIndex=0;renderScanner();await new Promise(r=>setTimeout(r,30));const blob=await canvasBlob(),file=new File([blob],`KwikToolForAll_Scan_${dateStamp()}.jpg`,{type:'image/jpeg'});if(mode==='system'&&navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){try{await navigator.share({title:'Scanned document',files:[file]});showToast('Share sheet opened.');return}catch(e){if(e.name==='AbortError')return}}
downloadBlob(blob,file.name,'image/jpeg');const text=encodeURIComponent('Scanned document from KwikToolForAll. The file has been downloaded and is ready to attach.');if(mode==='whatsapp')window.open(`https://wa.me/?text=${text}`,'_blank');else if(mode==='telegram')window.open(`https://t.me/share/url?url=&text=${text}`,'_blank');else if(mode==='email')location.href=`mailto:?subject=Scanned document&body=${text}`;else if(mode==='sms')location.href=`sms:?body=${text}`;else if(mode==='twitter')window.open(`https://twitter.com/intent/tweet?text=${text}`,'_blank');else if(mode==='linkedin')window.open(`https://www.linkedin.com/sharing/share-offsite/?url=`,'_blank');else if(mode==='copy'){await navigator.clipboard?.writeText(file.name);showToast('File name copied.')}}
document.querySelectorAll('[data-share]').forEach(b=>b.onclick=()=>shareScanner(b.dataset.share));
const _baseOpenTool=openTool;openTool=function(id){if(id==='scanner'){openScanner();return}_baseOpenTool(id)};

// Final navigation/modal hardening
if(typeof scannerWorkspace!=='undefined'){document.querySelector('[data-close-tool]')?.addEventListener('click',()=>{if(!scannerWorkspace.hidden)closeScanner()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toolModal.classList.contains('open')&&!scannerWorkspace.hidden){closeScanner()}})}
