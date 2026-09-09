const tools=[
{name:"Image → PDF",desc:"Convert JPG or PNG images into a clean PDF document.",icon:"▧",color:"red",search:"image pdf convert"},
{name:"Image → Text",desc:"Extract readable text from images and screenshots.",icon:"Aa",color:"blue",search:"image text ocr"},
{name:"Merge PDF",desc:"Combine multiple PDF files into one document.",icon:"▤",color:"green",search:"merge pdf"},
{name:"Split PDF",desc:"Separate pages or ranges from a PDF file.",icon:"✂",color:"orange",search:"split pdf"},
{name:"Compress PDF",desc:"Reduce PDF file size for easier sharing.",icon:"↘",color:"purple",search:"compress pdf"},
{name:"PDF → JPG / PNG",desc:"Convert PDF pages into image files.",icon:"▥",color:"teal",search:"pdf jpg png"},
];

const grid=document.getElementById("popularGrid");
const search=document.getElementById("search");
const toast=document.getElementById("toast");

function render(query=""){
  const q=query.toLowerCase().trim();
  const list=tools.filter(t=>!q||`${t.name} ${t.desc} ${t.search}`.toLowerCase().includes(q));
  grid.innerHTML=list.map(t=>`<article class="tool-card"><div class="tool-icon icon-${t.color}">${t.icon}</div><h3>${t.name}</h3><p>${t.desc}</p><button class="open ${t.color}" data-tool="${t.name}">Open tool →</button></article>`).join("");
  if(!list.length) grid.innerHTML=`<div style="grid-column:1/-1;background:#fff;border:1px dashed #ccd7e6;border-radius:15px;padding:30px;text-align:center;color:#687894;font-size:12px">No popular tool matches “${query}”. Try another phrase.</div>`;
  document.querySelectorAll("[data-tool]").forEach(b=>b.addEventListener("click",()=>showToast(`${b.dataset.tool} workspace will be connected next.`)));
}
function showToast(msg){toast.textContent=msg;toast.classList.add("show");clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>toast.classList.remove("show"),2600)}
document.querySelectorAll("[data-search]").forEach(b=>b.addEventListener("click",()=>{search.value=b.dataset.search;render(b.dataset.search);document.getElementById("tools").scrollIntoView({behavior:"smooth"});}));
document.getElementById("searchBtn").addEventListener("click",()=>{render(search.value);document.getElementById("tools").scrollIntoView({behavior:"smooth"});});
search.addEventListener("input",()=>render(search.value));
document.getElementById("focusSearch").addEventListener("click",()=>search.focus());
document.addEventListener("keydown",e=>{if(e.key==="/"&&document.activeElement!==search){e.preventDefault();search.focus()}});
document.getElementById("themeBtn").addEventListener("click",()=>showToast("Theme controls are reserved for a later update."));
render();
