const tools=[
{id:'image-pdf',name:'Image → PDF',desc:'Convert JPG or PNG images into a clean PDF document.',icon:'▧',color:'red',keys:'image pdf convert'},
{id:'merge',name:'Merge PDF',desc:'Combine multiple PDF files into one document.',icon:'▤',color:'green',keys:'merge pdf combine'},
{id:'split',name:'Split PDF',desc:'Extract selected pages or ranges into a new PDF.',icon:'✂',color:'orange',keys:'split pdf pages'},
{id:'resize-image',name:'Resize Image',desc:'Change image dimensions while keeping quality under control.',icon:'↔',color:'blue',keys:'resize image dimensions'},
{id:'compress-image',name:'Compress Image',desc:'Reduce image file size for email, upload and sharing.',icon:'⌁',color:'purple',keys:'compress image size'}
];
const $=id=>document.getElementById(id), grid=$('toolGrid'), search=$('toolSearch'), empty=$('emptyState'), toast=$('toast');
function showToast(msg){if(!toast)return;toast.textContent=msg;toast.classList.add('show');clearTimeout(window.__kwikToast);window.__kwikToast=setTimeout(()=>toast.classList.remove('show'),2600)}
function render(q=''){const term=q.trim().toLowerCase();const list=tools.filter(t=>!term||`${t.name} ${t.desc} ${t.keys}`.toLowerCase().includes(term));grid.innerHTML=list.map(t=>`<article class="tool-card"><div class="tool-icon ${t.color}">${t.icon}</div><h3>${t.name}</h3><p>${t.desc}</p><button class="open-tool ${t.color}" data-open="${t.id}">Open tool →</button></article>`).join('');empty.hidden=list.length>0;grid.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openTool(b.dataset.open))}
function openTool(id){const t=tools.find(x=>x.id===id);if(!t)return;if(id==='image-pdf'){openImagePdf();return}if(['merge','split','resize-image','compress-image'].includes(id)){openUtility(id);return}showToast(`${t.name} is not available.`)}
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
$('searchForm').onsubmit=e=>{e.preventDefault();render(search.value);$('tools').scrollIntoView({behavior:'smooth',block:'start'})};$('resetSearch').onclick=()=>{search.value='';render()};$('searchFocus').onclick=()=>{search.focus();window.scrollTo({top:0,behavior:'smooth'})};function syncThemeControls(){const dark=document.body.classList.contains('dark');document.querySelectorAll('.theme-toggle').forEach(b=>{b.setAttribute('aria-pressed',String(dark));b.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');const icon=b.querySelector('.theme-icon');const label=b.querySelector('.theme-label');if(icon)icon.textContent=dark?'☀':'☾';if(label)label.textContent=dark?'Light':'Dark'})}
function toggleTheme(){document.body.classList.toggle('dark');localStorage.setItem('kwik-theme',document.body.classList.contains('dark')?'dark':'light');syncThemeControls()}
$('themeToggle').onclick=toggleTheme;
if(localStorage.getItem('kwik-theme')==='dark')document.body.classList.add('dark');
syncThemeControls();
$('mobileMenu').onclick=()=>document.querySelector('.main-nav')?.classList.toggle('mobile-open');
$('allToolsToggle').onclick=()=>{const menu=$('allToolsDropdown');const open=menu.hidden;menu.hidden=!open;$('allToolsToggle').setAttribute('aria-expanded',String(open))};document.addEventListener('click',e=>{const wrap=document.querySelector('.all-tools-menu');if(wrap&&!wrap.contains(e.target)){$('allToolsDropdown').hidden=true;$('allToolsToggle').setAttribute('aria-expanded','false')}});populateAllToolsMenu();render();


/* Document Scanner — simplified, browser-first implementation */
const scannerWorkspace=$('scannerWorkspace');
const scannerFiles=$('scannerFiles'),autoScan=$('autoScan'),scannerStage=$('scannerStage');
const scannerSuccess=$('scannerSuccess');
let scanPages=[],scanIndex=0,scannerSelectedFormat='pdf',scannerCropMode=null;
function resetScannerSuccess(){if(scannerSuccess){scannerSuccess.hidden=true;scannerSuccess.classList.remove('is-visible')}}
function openScanner(){
  resetSuccess();resetScannerSuccess();
  document.querySelectorAll('.scanner-upload,.scanner-layout,.scanner-bottom').forEach(x=>x.classList.remove('tool-hidden'));
  [workspaceHead,upload,fileToolbar,pagesSection,footer,pdfSuccess].forEach(x=>x&&x.classList.add('tool-hidden'));
  scannerWorkspace.hidden=false;
  toolModal.classList.add('open');toolModal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';
  renderScanner();
}
function closeScanner(){
  scannerCropMode=null;
  scannerWorkspace.hidden=true;toolModal.classList.remove('open');toolModal.setAttribute('aria-hidden','true');document.body.style.overflow='';
  const panel=$('scannerSharePanel');if(panel)panel.hidden=true;
}
$('closeTool').addEventListener('click',()=>{if(!scannerWorkspace.hidden)closeScanner();else closeImagePdf()});
$('scannerClose')?.addEventListener('click',closeScanner);
const scannerInputHandler=e=>{addScanFiles([...e.target.files]);e.target.value=''};
scannerFiles.addEventListener('change',scannerInputHandler);
function addScanFiles(files){
  const valid=files.filter(f=>f.type.startsWith('image/')||/\.(jpe?g|png|webp|heic|heif)$/i.test(f.name));
  if(valid.length<files.length)showToast('Please choose image files.');
  valid.forEach(file=>{const p={file,url:URL.createObjectURL(file),rotation:0,filter:'original',pageSize:'a4',cropScale:100,crop:null,naturalWidth:0,naturalHeight:0};scanPages.push(p);loadScanImage(p)});
  if(valid.length){scanIndex=Math.max(0,scanPages.length-valid.length);renderScanner()}
}
function loadScanImage(p){const im=new Image();im.onload=()=>{p.naturalWidth=im.naturalWidth;p.naturalHeight=im.naturalHeight;if(autoScan.checked)p.crop=detectDocumentCrop(im);renderScanner()};im.onerror=()=>showToast(`Could not read ${p.file.name}.`);im.src=p.url}
function detectDocumentCrop(im){
  const max=650, scale=Math.min(1,max/Math.max(im.naturalWidth,im.naturalHeight));
  const w=Math.max(120,Math.round(im.naturalWidth*scale)),h=Math.max(120,Math.round(im.naturalHeight*scale));
  const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(im,0,0,w,h);
  const d=ctx.getImageData(0,0,w,h).data, lum=new Float32Array(w*h);
  for(let i=0,j=0;i<d.length;i+=4,j++)lum[j]=.299*d[i]+.587*d[i+1]+.114*d[i+2];
  const sample=[];const band=Math.max(2,Math.round(Math.min(w,h)*.035));
  for(let y=0;y<h;y+=Math.max(1,Math.floor(h/80)))for(let x=0;x<w;x+=Math.max(1,Math.floor(w/80)))if(x<band||x>=w-band||y<band||y>=h-band)sample.push(lum[y*w+x]);
  sample.sort((a,b)=>a-b);const bg=sample[Math.floor(sample.length/2)]||lum[0];
  let minX=w,minY=h,maxX=-1,maxY=-1,found=0;const threshold=24;
  for(let y=2;y<h-2;y+=2){for(let x=2;x<w-2;x+=2){const v=lum[y*w+x];const local=(lum[(y-1)*w+x]+lum[(y+1)*w+x]+lum[y*w+x-1]+lum[y*w+x+1])/4;const edge=Math.abs(v-local);if(Math.abs(v-bg)>threshold||edge>22){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);found++}}}
  if(found<(w*h*.008)||maxX<0||maxX-minX<w*.42||maxY-minY<h*.42){
    // Fallback: trim a small, consistent border so Auto crop still performs a useful crop.
    return {x:.035,y:.035,w:.93,h:.93};
  }
  const pad=.018;minX=Math.max(0,minX-w*pad);minY=Math.max(0,minY-h*pad);maxX=Math.min(w-1,maxX+w*pad);maxY=Math.min(h-1,maxY+h*pad);
  return {x:minX/w,y:minY/h,w:Math.max(.1,(maxX-minX)/w),h:Math.max(.1,(maxY-minY)/h)};
}
function currentScan(){return scanPages[scanIndex]}
function getCropRect(p){const c=p.crop||{x:0,y:0,w:1,h:1};const scale=(p.cropScale||100)/100;const cx=c.x+c.w/2,cy=c.y+c.h/2;let w=c.w*scale,h=c.h*scale;let x=cx-w/2,y=cy-h/2;x=Math.max(0,Math.min(x,1-w));y=Math.max(0,Math.min(y,1-h));w=Math.min(1,w);h=Math.min(1,h);return{x,y,w,h}}
function renderScanner(){
  const p=currentScan();
  $('scannerPageCount').textContent=`${scanPages.length} page${scanPages.length===1?'':'s'}`;
  $('scannerPageTitle').textContent=p?`Page ${scanIndex+1} · ${escapeHtml(p.file.name)}`:'No page selected';
  $('scannerPrev').disabled=scanIndex<=0;$('scannerNext').disabled=scanIndex>=scanPages.length-1;
  document.querySelectorAll('#scannerFilters button').forEach(b=>b.classList.toggle('active',b.dataset.filter===(p?.filter||'original')));
  document.querySelectorAll('[data-export]').forEach(b=>b.classList.toggle('active',b.dataset.export===scannerSelectedFormat));
  const note=$('scannerFormatNote');if(note)note.textContent=scannerSelectedFormat==='pdf'?'PDF selected · all pages will be included.':`${scannerSelectedFormat.toUpperCase()} selected · current page will be exported.`;
  if(!p){scannerStage.innerHTML='<div class="scanner-empty">Upload a document image to begin.</div>';return}
  scannerStage.innerHTML='';const c=document.createElement('canvas');c.id='scannerCanvas';scannerStage.appendChild(c);drawScannerCanvas();
  $('scannerPageSize').value=p.pageSize||'a4';
  $('scannerStatus').textContent=`Page ${scanIndex+1} ready · ${autoScan.checked?'Auto edge detection on':'Auto edge detection off'}`;
}
function drawScannerCanvas(){
  const p=currentScan(),canvas=$('scannerCanvas');if(!p||!canvas)return;const im=new Image();im.onload=()=>{
    const r=getCropRect(p),cw=Math.max(1,Math.round(im.naturalWidth*r.w)),ch=Math.max(1,Math.round(im.naturalHeight*r.h));canvas.width=cw;canvas.height=ch;
    const ctx=canvas.getContext('2d');ctx.drawImage(im,im.naturalWidth*r.x,im.naturalHeight*r.y,im.naturalWidth*r.w,im.naturalHeight*r.h,0,0,cw,ch);applyScannerFilter(ctx,cw,ch,p.filter);
    if(p.rotation){const rot=document.createElement('canvas');rot.width=(p.rotation%180)?ch:cw;rot.height=(p.rotation%180)?cw:ch;const rc=rot.getContext('2d');rc.translate(rot.width/2,rot.height/2);rc.rotate(p.rotation*Math.PI/180);rc.drawImage(canvas,-cw/2,-ch/2);canvas.width=rot.width;canvas.height=rot.height;canvas.getContext('2d').drawImage(rot,0,0)}
  };im.src=p.url;
}
function applyScannerFilter(ctx,w,h,f){if(f==='original')return;const img=ctx.getImageData(0,0,w,h),d=img.data;for(let i=0;i<d.length;i+=4){const gray=.299*d[i]+.587*d[i+1]+.114*d[i+2];if(f==='gray'){d[i]=d[i+1]=d[i+2]=gray}else if(f==='bw'){const v=gray>170?255:0;d[i]=d[i+1]=d[i+2]=v}}ctx.putImageData(img,0,0)}
$('scannerPrev').onclick=()=>{if(scanIndex>0){scanIndex--;renderScanner()}};
$('scannerNext').onclick=()=>{if(scanIndex<scanPages.length-1){scanIndex++;renderScanner()}};
$('scannerAddPage').onclick=()=>scannerFiles.click();
$('scannerClear').onclick=()=>{scanPages.forEach(p=>URL.revokeObjectURL(p.url));scanPages=[];scanIndex=0;resetScannerSuccess();renderScanner()};
$('scannerDone').onclick=closeScanner;
$('autoScan').onchange=()=>{const p=currentScan();if(p&&autoScan.checked){const im=new Image();im.onload=()=>{p.crop=detectDocumentCrop(im);p.cropScale=100;renderScanner()};im.src=p.url}else renderScanner()};
$('scannerAutoCrop').onclick=()=>{const p=currentScan();if(!p)return;const im=new Image();im.onload=()=>{p.crop=detectDocumentCrop(im);p.cropScale=100;renderScanner();showToast('Document edges detected.')};im.src=p.url};
$('scannerRotateLeft').onclick=()=>{const p=currentScan();if(p){p.rotation=(p.rotation+270)%360;drawScannerCanvas()}};
$('scannerRotateRight').onclick=()=>{const p=currentScan();if(p){p.rotation=(p.rotation+90)%360;drawScannerCanvas()}};
$('scannerPageSize').onchange=e=>{const p=currentScan();if(p)p.pageSize=e.target.value};
document.querySelectorAll('#scannerFilters button').forEach(b=>b.onclick=()=>{const p=currentScan();if(p){p.filter=b.dataset.filter;renderScanner()}});
function enableScannerCrop(mode){
  const p=currentScan(),canvas=$('scannerCanvas');if(!p||!canvas)return;
  scannerCropMode=mode;canvas.style.cursor='crosshair';
  const stage=canvas.parentElement;stage.classList.add('crop-active');
  let overlay=stage.querySelector('.scanner-crop-selection');if(overlay)overlay.remove();
  overlay=document.createElement('div');overlay.className='scanner-crop-selection';stage.appendChild(overlay);
  let start=null,dragging=false;
  const point=e=>{const box=canvas.getBoundingClientRect();return{x:Math.max(0,Math.min(1,(e.clientX-box.left)/box.width)),y:Math.max(0,Math.min(1,(e.clientY-box.top)/box.height))}};
  const update=(a,b)=>{let x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),w=Math.abs(b.x-a.x),h=Math.abs(b.y-a.y);if(mode==='square'){const side=Math.min(w,h);x=b.x<a.x?a.x-side:a.x;y=b.y<a.y?a.y-side:a.y;w=h=side;x=Math.max(0,Math.min(x,1-side));y=Math.max(0,Math.min(y,1-side))}overlay.style.left=`${x*100}%`;overlay.style.top=`${y*100}%`;overlay.style.width=`${w*100}%`;overlay.style.height=`${h*100}%`;return{x,y,w,h}};
  const cleanup=()=>{canvas.releasePointerCapture?.(cleanup.pid);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);stage.classList.remove('crop-active');overlay.remove();canvas.style.cursor='default';scannerCropMode=null};
  const move=e=>{if(!dragging)return;update(start,point(e))};
  const up=e=>{if(!dragging)return;dragging=false;const local=update(start,point(e));if(local.w>.03&&local.h>.03){const base=p.crop||{x:0,y:0,w:1,h:1};p.crop={x:base.x+local.x*base.w,y:base.y+local.y*base.h,w:local.w*base.w,h:local.h*base.h};p.cropScale=100;showToast(mode==='square'?'Square crop applied.':'Free crop applied.')}cleanup();renderScanner()};
  const down=e=>{e.preventDefault();start=point(e);dragging=true;canvas.setPointerCapture?.(e.pointerId);cleanup.pid=e.pointerId;update(start,start);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up)};
  canvas.addEventListener('pointerdown',down,{once:true});
  showToast(mode==='square'?'Drag a square over the document.':'Drag freely over the part you want to keep.');
}
$('scannerManualCrop').onclick=()=>enableScannerCrop('free');
$('scannerSquareCrop').onclick=()=>enableScannerCrop('square');
document.querySelectorAll('[data-export]').forEach(b=>b.onclick=()=>{scannerSelectedFormat=b.dataset.export;renderScanner();showToast(`${b.textContent.trim()} selected.`)});
function scannerBlobFromCanvas(canvas,kind){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Canvas export failed')),kind==='jpg'?'image/jpeg':'image/png',.94))}
async function makeScannerProcessedCanvas(p){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{const r=getCropRect(p),srcW=Math.max(1,Math.round(im.naturalWidth*r.w)),srcH=Math.max(1,Math.round(im.naturalHeight*r.h));let outW=srcW,outH=srcH;if(p.pageSize==='a4'){outW=1240;outH=1754}else if(p.pageSize==='letter'){outW=1275;outH=1650}else if(p.pageSize==='id'){outW=1013;outH=638}if(p.pageSize!=='original'){const fit=Math.min((outW-70)/srcW,(outH-70)/srcH);const dw=srcW*fit,dh=srcH*fit;const c=document.createElement('canvas');c.width=outW;c.height=outH;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,outW,outH);ctx.save();ctx.translate(outW/2,outH/2);ctx.rotate(p.rotation*Math.PI/180);ctx.drawImage(im,im.naturalWidth*r.x,im.naturalHeight*r.y,im.naturalWidth*r.w,im.naturalHeight*r.h,-dw/2,-dh/2,dw,dh);ctx.restore();applyScannerFilter(ctx,outW,outH,p.filter);resolve(c)}else{const c=document.createElement('canvas');c.width=p.rotation%180?srcH:srcW;c.height=p.rotation%180?srcW:srcH;const ctx=c.getContext('2d');ctx.translate(c.width/2,c.height/2);ctx.rotate(p.rotation*Math.PI/180);ctx.drawImage(im,im.naturalWidth*r.x,im.naturalHeight*r.y,im.naturalWidth*r.w,im.naturalHeight*r.h,-srcW/2,-srcH/2,srcW,srcH);applyScannerFilter(ctx,c.width,c.height,p.filter);resolve(c)}};im.onerror=reject;im.src=p.url})}
function scannerFileName(kind){return `KwikToolForAll_Scan_${dateStamp()}.${kind==='jpg'?'jpg':kind}`}
async function makeScannerPdfFromBlobs(blobs){const enc=new TextEncoder(),chunks=[],offsets=[0];let pos=0;const push=v=>{const b=typeof v==='string'?enc.encode(v):v;chunks.push(b);pos+=b.length};const objs=[],add=o=>(objs.push(o),objs.length),catalog=add(null),pages=add(null),kids=[],content=[],images=[];push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');for(const blob of blobs){const bytes=dataUrlBytes(await blobDataUrl(blob));const im=new Image(),url=URL.createObjectURL(blob);await new Promise((r,j)=>{im.onload=r;im.onerror=j;im.src=url});const w=im.naturalWidth,h=im.naturalHeight;URL.revokeObjectURL(url);const iid=add({dict:`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>`,stream:bytes});images.push(iid);const stream=enc.encode(`q\n${w} 0 0 ${h} 0 0 cm\n/Im0 Do\nQ\n`);const cid=add({dict:`<< /Length ${stream.length} >>`,stream});content.push(cid);kids.push(add(null))}objs[catalog-1]=`<< /Type /Catalog /Pages ${pages} 0 R >>`;objs[pages-1]=`<< /Type /Pages /Kids [${kids.map(x=>x+' 0 R').join(' ')}] /Count ${kids.length} >>`;kids.forEach((pid,i)=>{const d=objs[images[i]-1].dict,w=Number(d.match(/\/Width (\d+)/)[1]),h=Number(d.match(/\/Height (\d+)/)[1]);objs[pid-1]=`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Im0 ${images[i]} 0 R >> >> /Contents ${content[i]} 0 R >>`});for(let i=0;i<objs.length;i++){offsets[i+1]=pos;push(`${i+1} 0 obj\n`);const o=objs[i];if(typeof o==='string')push(o+'\nendobj\n');else{push(o.dict+'\nstream\n');push(o.stream);push('\nendstream\nendobj\n')}}const xref=pos;push(`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`);for(let i=1;i<=objs.length;i++)push(String(offsets[i]).padStart(10,'0')+' 00000 n \n');push(`trailer\n<< /Size ${objs.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`);return new Blob(chunks,{type:'application/pdf'})}
async function buildScannerFile(){
  if(!scanPages.length)throw new Error('No pages');
  if(scannerSelectedFormat==='pdf'){const blobs=[];for(let i=0;i<scanPages.length;i++){const c=await makeScannerProcessedCanvas(scanPages[i]);blobs.push(await scannerBlobFromCanvas(c,'jpg'))}return {blob:await makeScannerPdfFromBlobs(blobs),name:scannerFileName('pdf'),type:'application/pdf',label:'PDF'}}
  const p=currentScan(),c=await makeScannerProcessedCanvas(p),blob=await scannerBlobFromCanvas(c,scannerSelectedFormat);return {blob,name:scannerFileName(scannerSelectedFormat),type:scannerSelectedFormat==='jpg'?'image/jpeg':'image/png',label:scannerSelectedFormat.toUpperCase()}
}
function downloadScannerFile(file){const url=URL.createObjectURL(file.blob),a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200)}
async function showScannerSuccess(message){scannerSuccess.hidden=false;scannerSuccess.classList.remove('is-visible');const m=$('scannerSuccessMain');if(m)m.textContent=message;requestAnimationFrame(()=>scannerSuccess.classList.add('is-visible'))}
async function downloadScanner(){if(!scanPages.length){showToast('Upload a document first.');return}const btn=$('scannerDownload');try{if(btn)btn.disabled=true;$('scannerStatus').textContent=`Preparing ${scannerSelectedFormat.toUpperCase()}…`;const file=await buildScannerFile();downloadScannerFile(file);resetScannerWorkspaceForSuccess();await showScannerSuccess('Your scanned file is now downloaded.');}catch(e){console.error(e);showToast('Could not create the file. Please try again.');$('scannerStatus').textContent='Export failed.'}finally{if(btn)btn.disabled=false}}
function resetScannerWorkspaceForSuccess(){document.querySelectorAll('.scanner-upload,.scanner-layout,.scanner-bottom').forEach(x=>x.classList.add('tool-hidden'));$('scannerStatus').textContent='Complete.'}
$('scannerDownload').onclick=downloadScanner;
$('scannerShare').onclick=()=>{const panel=$('scannerSharePanel');if(panel)panel.hidden=false};
$('scannerShareClose').onclick=()=>{$('scannerSharePanel').hidden=true};
$('reuseScannerTool').onclick=()=>{resetScannerSuccess();document.querySelectorAll('.scanner-upload,.scanner-layout,.scanner-bottom').forEach(x=>x.classList.remove('tool-hidden'));renderScanner()};
async function shareScanner(){if(!scanPages.length){showToast('Upload a document first.');return}try{$('scannerSharePanel').hidden=true;$('scannerStatus').textContent=`Preparing ${scannerSelectedFormat.toUpperCase()}…`;const file=await buildScannerFile();const sharedFile=new File([file.blob],file.name,{type:file.type});if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[sharedFile]}))){try{await navigator.share({title:`KwikToolForAll ${file.label}`,text:'Scanned document',files:[sharedFile]});resetScannerWorkspaceForSuccess();await showScannerSuccess('Your scanned file was shared successfully.');return}catch(e){if(e.name==='AbortError'){showToast('Share cancelled.');return}}}downloadScannerFile(file);resetScannerWorkspaceForSuccess();await showScannerSuccess('Your device cannot share files directly here, so the file was downloaded for sharing.')}catch(e){console.error(e);showToast('Could not prepare the file for sharing. Please try again.')}}
document.querySelector('[data-share="system"]')?.addEventListener('click',shareScanner);

function showUtility(id){
  const u={
    merge:{k:'PDF TOOL',t:'Merge PDF',d:'Combine multiple PDF files into one PDF locally.'},
    split:{k:'PDF TOOL',t:'Split PDF',d:'Extract selected pages or ranges into a new PDF locally.'},
    'resize-image':{k:'IMAGE TOOL',t:'Resize Image',d:'Change image dimensions without uploading your file.'},
    'compress-image':{k:'IMAGE TOOL',t:'Compress Image',d:'Reduce image size for faster sharing and uploads.'}
  }[id];
  $('utilityKicker').textContent=u.k;$('utilityTitle').textContent=u.t;$('utilityDesc').textContent=u.d;$('utilityBody').innerHTML='';$('utilityStatus').textContent='Ready.';$('utilityWorkspace').hidden=false;return u;
}
function openUtility(id){
  if(!['merge','split','resize-image','compress-image'].includes(id))return;
  closePreview?.();
  openToolModal();
  document.querySelectorAll('.workspace-head,.upload-zone,.file-toolbar,.pdf-pages-section,.workspace-footer,.pdf-success').forEach(x=>{if(x)x.classList.add('tool-hidden')});
  $('scannerWorkspace').hidden=true;$('utilityWorkspace').hidden=false;showUtility(id);
  const body=$('utilityBody');
  if(id==='merge')renderMergeTool(body);
  if(id==='split')renderSplitTool(body);
  if(id==='resize-image')renderResizeTool(body);
  if(id==='compress-image')renderCompressTool(body);
}
function openToolModal(){toolModal.classList.add('open');toolModal.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
function closeUtility(){if($('utilityWorkspace'))$('utilityWorkspace').hidden=true;document.querySelectorAll('.workspace-head,.upload-zone,.file-toolbar,.pdf-pages-section,.workspace-footer').forEach(x=>x.classList.remove('tool-hidden'));closeImagePdf()}
$('utilityClear').onclick=()=>{$('utilityBody').innerHTML='';$('utilityStatus').textContent='Ready.'};
function utilityUploadMarkup(id,multiple){return `<div class="utility-upload"><div class="utility-upload-icon">↥</div><h3>${id==='merge'?'Choose PDF files':'Choose a PDF file'}</h3><p>${id==='merge'?'Select two or more PDFs in the order you want them combined.':'Then enter the pages or ranges you want to extract.'}</p><label class="choose-files">Choose files<input id="utilityFiles" type="file" accept="application/pdf" ${multiple?'multiple':''} hidden></label><div class="utility-file-list" id="utilityFileList"></div></div>`}
function renderMergeTool(body){body.innerHTML=utilityUploadMarkup('merge',true)+`<div class="utility-actions"><button class="primary-action" id="mergeRun" disabled>Merge PDF →</button></div>`;const input=$('utilityFiles'),list=$('utilityFileList'),run=$('mergeRun');let files=[];input.onchange=()=>{files=[...input.files];list.innerHTML=files.map((f,i)=>`<div class="utility-file"><span>${i+1}</span><div><b>${escapeHtml(f.name)}</b><small>${formatBytes(f.size)}</small></div></div>`).join('');run.disabled=files.length<2;$('utilityStatus').textContent=files.length?`${files.length} PDFs selected.`:'Select at least 2 PDFs.'};run.onclick=async()=>{try{run.disabled=true;$('utilityStatus').textContent='Merging PDFs…';const out=await PDFLib.PDFDocument.create();for(const f of files){const src=await PDFLib.PDFDocument.load(await f.arrayBuffer());const pages=await out.copyPages(src,src.getPageIndices());pages.forEach(p=>out.addPage(p))}const bytes=await out.save();downloadBlob(new Blob([bytes],{type:'application/pdf'}),'KwikToolForAll_Merged.pdf');showUtilitySuccess('Merge complete. Your merged PDF is now downloaded.')}catch(e){console.error(e);showToast('Could not merge those PDFs.');$('utilityStatus').textContent='Merge failed.'}finally{run.disabled=false}}}
function renderSplitTool(body){body.innerHTML=utilityUploadMarkup('split',false)+`<div class="utility-field"><label>Pages or ranges <input id="splitRange" type="text" placeholder="Example: 1, 3-5, 8"></label><small>Use commas for separate pages and hyphens for ranges.</small></div><div class="utility-actions"><button class="primary-action" id="splitRun" disabled>Split PDF →</button></div>`;let file=null;const input=$('utilityFiles'),run=$('splitRun');input.onchange=()=>{file=input.files[0]||null;$('utilityFileList').innerHTML=file?`<div class="utility-file"><span>1</span><div><b>${escapeHtml(file.name)}</b><small>${formatBytes(file.size)}</small></div></div>`:'';run.disabled=!file||!$('splitRange').value.trim();$('utilityStatus').textContent=file?'Enter pages or ranges.':'Choose a PDF.'};$('splitRange').oninput=()=>run.disabled=!file||!$('splitRange').value.trim();run.onclick=async()=>{try{run.disabled=true;$('utilityStatus').textContent='Splitting PDF…';const src=await PDFLib.PDFDocument.load(await file.arrayBuffer());const pages=parseRanges($('splitRange').value,src.getPageCount());if(!pages.length)throw new Error('No valid pages');const out=await PDFLib.PDFDocument.create();const copied=await out.copyPages(src,pages.map(n=>n-1));copied.forEach(p=>out.addPage(p));const bytes=await out.save();downloadBlob(new Blob([bytes],{type:'application/pdf'}),'KwikToolForAll_Split.pdf');showUtilitySuccess('Split complete. Your selected pages are now downloaded.')}catch(e){console.error(e);showToast('Please check the page numbers or PDF.');$('utilityStatus').textContent='Split failed.'}finally{run.disabled=false}}}
function parseRanges(text,total){const set=new Set();for(const part of text.split(',')){const x=part.trim();if(!x)continue;if(/^\d+$/.test(x)){const n=Number(x);if(n>=1&&n<=total)set.add(n);continue}const m=x.match(/^(\d+)\s*-\s*(\d+)$/);if(m){let a=Number(m[1]),b=Number(m[2]);if(a>b)[a,b]=[b,a];for(let n=a;n<=b&&n<=total;n++)if(n>=1)set.add(n)}}return [...set].sort((a,b)=>a-b)}
function imageToolMarkup(title,desc){return `<div class="image-tool-grid"><div class="utility-upload"><div class="utility-upload-icon">↥</div><h3>${title}</h3><p>${desc}</p><label class="choose-files">Choose image<input id="utilityImageFile" type="file" accept="image/jpeg,image/png,image/webp" hidden></label><div id="utilityImageInfo" class="utility-file-list"></div></div><div class="utility-preview-panel"><div class="utility-preview-empty" id="utilityImagePreview">Preview will appear here.</div></div></div>`}
function loadImageFile(file,cb){const url=URL.createObjectURL(file),img=new Image();img.onload=()=>cb(img,url);img.onerror=()=>{URL.revokeObjectURL(url);showToast('Could not read that image.')};img.src=url}
function renderResizeTool(body){body.innerHTML=imageToolMarkup('Upload an image','JPG, PNG or WebP. Set the output dimensions below.')+`<div class="utility-options"><label>Width <input id="resizeW" type="number" min="1" placeholder="Width"></label><label>Height <input id="resizeH" type="number" min="1" placeholder="Height"></label><label class="check-line"><input id="resizeKeep" type="checkbox" checked> Keep aspect ratio</label><label>Format<select id="resizeFormat"><option value="image/jpeg">JPEG</option><option value="image/png">PNG</option></select></label></div><div class="utility-actions"><button class="primary-action" id="resizeRun" disabled>Resize & Download →</button></div>`;let file=null,img=null,url=null;const input=$('utilityImageFile'),w=$('resizeW'),h=$('resizeH'),run=$('resizeRun'),prev=$('utilityImagePreview');input.onchange=()=>{file=input.files[0]||null;if(!file)return;loadImageFile(file,(im,u)=>{img=im;url=u;w.value=im.naturalWidth;h.value=im.naturalHeight;prev.innerHTML=`<img src="${u}" alt="Preview">`;run.disabled=false;$('utilityStatus').textContent=`Original: ${im.naturalWidth} × ${im.naturalHeight} · ${formatBytes(file.size)}`})};w.oninput=()=>{if(img&&$('resizeKeep').checked&&img.naturalWidth)h.value=Math.max(1,Math.round(Number(w.value)*img.naturalHeight/img.naturalWidth))};h.oninput=()=>{if(img&&$('resizeKeep').checked&&img.naturalHeight)w.value=Math.max(1,Math.round(Number(h.value)*img.naturalWidth/img.naturalHeight))};run.onclick=async()=>{const ow=Math.max(1,Number(w.value)),oh=Math.max(1,Number(h.value));const c=document.createElement('canvas');c.width=ow;c.height=oh;c.getContext('2d').drawImage(img,0,0,ow,oh);const type=$('resizeFormat').value;const blob=await canvasBlob(c,type,.92);downloadBlob(blob,`KwikToolForAll_Resized.${type==='image/png'?'png':'jpg'}`);showUtilitySuccess('Resize complete. Your resized image is now downloaded.')}}
function renderCompressTool(body){body.innerHTML=imageToolMarkup('Upload an image','Lower quality to reduce file size. Your original stays on your device.')+`<div class="utility-options"><label>Quality <input id="compressQuality" type="range" min="25" max="95" value="72"><output id="compressQualityValue">72%</output></label><label>Max width <input id="compressMax" type="number" min="320" max="6000" value="2400"></label><label>Format<select id="compressFormat"><option value="image/jpeg">JPEG · best size</option><option value="image/png">PNG · lossless</option></select></label></div><div class="utility-actions"><button class="primary-action" id="compressRun" disabled>Compress & Download →</button></div>`;let file=null,img=null,url=null;const input=$('utilityImageFile'),q=$('compressQuality'),qv=$('compressQualityValue'),max=$('compressMax'),run=$('compressRun'),prev=$('utilityImagePreview');input.onchange=()=>{file=input.files[0]||null;if(!file)return;loadImageFile(file,(im,u)=>{img=im;url=u;prev.innerHTML=`<img src="${u}" alt="Preview">`;run.disabled=false;$('utilityStatus').textContent=`Original: ${formatBytes(file.size)} · ${im.naturalWidth} × ${im.naturalHeight}`})};q.oninput=()=>qv.value=`${q.value}%`;run.onclick=async()=>{const mw=Math.max(320,Number(max.value)||2400),scale=Math.min(1,mw/img.naturalWidth),w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');ctx.drawImage(img,0,0,w,h);const type=$('compressFormat').value,blob=await canvasBlob(c,type,Number(q.value)/100);downloadBlob(blob,`KwikToolForAll_Compressed.${type==='image/png'?'png':'jpg'}`);$('utilityStatus').textContent=`Compressed: ${formatBytes(blob.size)} from ${formatBytes(file.size)}`;showUtilitySuccess('Compression complete. Your compressed image is now downloaded.')}}
function canvasBlob(c,type,quality){return new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('Could not encode image')),type,quality))}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function showUtilitySuccess(message){const body=$('utilityBody');body.innerHTML=`<div class="utility-success"><div class="success-orbit"><div class="success-check" aria-hidden="true"></div></div><span class="success-eyebrow">DOWNLOAD COMPLETE</span><h3>Thank you for using<br><strong>KwikToolForAll.</strong></h3><p class="success-main">${message}</p><p class="success-sub">Please check your <strong>Downloads</strong> folder.</p><div class="privacy-confirm"><span class="privacy-confirm-icon" aria-hidden="true"></span><div><strong>Your privacy is protected</strong><span>Your file was processed locally in your browser and was not uploaded.</span></div></div><button type="button" class="reuse-tool" id="utilityReuse"><span>↻</span> Re-use the tool</button><small class="success-note">No account • No cloud storage • No file retained</small></div>`;$('utilityReuse').onclick=()=>{const id=window.__utilityId;openUtility(id)}}
const _oldOpenTool=openTool;window.__utilityId=null;openTool=function(id){window.__utilityId=id;return _oldOpenTool(id)};
const originalOpenUtility=openUtility;openUtility=function(id){window.__utilityId=id;return originalOpenUtility(id)};
const popularMap={'image to pdf':'image-pdf','merge pdf':'merge','split pdf':'split','resize image':'resize-image','compress image':'compress-image'};
document.querySelectorAll('[data-query]').forEach(b=>b.onclick=()=>{const id=popularMap[b.dataset.query]||popularMap[b.textContent.trim().toLowerCase()];if(id)openTool(id)});
// Make utility tools closable through the existing modal close button.
const _closeImagePdf=closeImagePdf;window.__toolClose=_closeImagePdf;
$('closeTool').onclick=()=>{if($('utilityWorkspace')&&!$('utilityWorkspace').hidden){closeUtility();return}if(typeof scannerWorkspace!=='undefined'&&!scannerWorkspace.hidden){closeScanner();return}_closeImagePdf()};document.querySelector('[data-close-tool]').onclick=()=>{if($('utilityWorkspace')&&!$('utilityWorkspace').hidden){closeUtility();return}if(typeof scannerWorkspace!=='undefined'&&!scannerWorkspace.hidden){closeScanner();return}_closeImagePdf()};
