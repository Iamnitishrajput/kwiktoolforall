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
 search.value=tool.name;
 render(tool.name);
 document.getElementById("tools").scrollIntoView({behavior:"smooth",block:"start"});
 showToast(`${tool.name} selected. The processing workspace is the next build.`)
}
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
