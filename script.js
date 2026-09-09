const tools=[
{name:"Image → PDF",desc:"Convert JPG or PNG images into a clean PDF document.",icon:"▧",color:"red",keys:"image pdf convert"},
{name:"Image → Text",desc:"Extract readable text from images and screenshots.",icon:"Aa",color:"blue",keys:"image text ocr"},
{name:"Merge PDF",desc:"Combine multiple PDF files into one document.",icon:"▤",color:"green",keys:"merge pdf"},
{name:"Split PDF",desc:"Separate pages or ranges from a PDF file.",icon:"✂",color:"orange",keys:"split pdf"},
{name:"Compress PDF",desc:"Reduce PDF file size for easier sharing.",icon:"↘",color:"purple",keys:"compress pdf"},
{name:"PDF → JPG / PNG",desc:"Convert PDF pages into image files.",icon:"▥",color:"teal",keys:"pdf jpg png convert"},
{name:"Document Scanner",desc:"Scan and clean documents with your camera.",icon:"▤",color:"blue",keys:"document scanner scan"},
{name:"Compress Image",desc:"Reduce image size for email and sharing.",icon:"⌁",color:"green",keys:"compress image"},
{name:"JPG ↔ PNG",desc:"Switch between common image formats.",icon:"⇄",color:"orange",keys:"jpg png image convert"},
{name:"Share & Send",desc:"Share files with temporary processing and delivery.",icon:"↥",color:"purple",keys:"share send temporary"}
];
const popular=tools.slice(0,6);
const grid=document.getElementById("toolGrid"),search=document.getElementById("toolSearch"),empty=document.getElementById("emptyState"),count=document.getElementById("toolCount"),toast=document.getElementById("toast");
function render(q=""){
 const term=q.trim().toLowerCase();
 const list=(term?tools:popular).filter(t=>!term||`${t.name} ${t.desc} ${t.keys}`.toLowerCase().includes(term));
 grid.innerHTML=list.map(t=>`<article class="tool-card"><div class="tool-icon ${t.color}">${t.icon}</div><h3>${t.name}</h3><p>${t.desc}</p><button class="open-tool ${t.color}" data-tool="${t.name}">Open tool →</button></article>`).join("");
 empty.hidden=list.length>0; count.textContent=`${list.length} ${list.length===1?"tool":"tools"}`;
 grid.querySelectorAll("[data-tool]").forEach(b=>b.addEventListener("click",()=>showToast(`${b.dataset.tool} is queued for the next functional build.`)));
}
function showToast(msg){toast.textContent=msg;toast.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>toast.classList.remove("show"),2600)}
function runSearch(q){search.value=q;render(q);document.getElementById("tools").scrollIntoView({behavior:"smooth"})}
document.getElementById("searchForm").addEventListener("submit",e=>{e.preventDefault();runSearch(search.value)});
search.addEventListener("input",()=>render(search.value));
document.querySelectorAll("[data-query]").forEach(b=>b.addEventListener("click",()=>runSearch(b.dataset.query)));
document.getElementById("clearSearch").addEventListener("click",()=>{search.value="";render();document.getElementById("tools").scrollIntoView({behavior:"smooth"})});
document.getElementById("resetSearch").addEventListener("click",()=>{search.value="";render()});
document.getElementById("searchFocus").addEventListener("click",()=>{search.focus();window.scrollTo({top:0,behavior:"smooth"})});
document.addEventListener("keydown",e=>{if(e.key==="/"&&document.activeElement!==search&&!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){e.preventDefault();search.focus()}});
const themeBtn=document.getElementById("themeToggle");
const savedTheme=localStorage.getItem("kwikTheme");
if(savedTheme==="dark"){document.body.classList.add("dark");themeBtn.textContent="☀";themeBtn.setAttribute("aria-pressed","true")}
themeBtn.addEventListener("click",()=>{const dark=document.body.classList.toggle("dark");themeBtn.textContent=dark?"☀":"☾";themeBtn.setAttribute("aria-pressed",String(dark));localStorage.setItem("kwikTheme",dark?"dark":"light")});
const mobile=document.getElementById("mobileMenu");
mobile.addEventListener("click",()=>{let nav=document.querySelector(".main-nav");const open=nav.classList.toggle("mobile-open");mobile.textContent=open?"×":"☰";if(open){nav.style.display="flex"}else{nav.style.display=""}});
document.querySelectorAll(".nav-link").forEach(a=>a.addEventListener("click",()=>{document.querySelector(".main-nav").classList.remove("mobile-open");mobile.textContent="☰";if(innerWidth<=740)document.querySelector(".main-nav").style.display=""}));
const sections=[...document.querySelectorAll("main section[id]")],navLinks=[...document.querySelectorAll(".nav-link")];
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){navLinks.forEach(a=>a.classList.toggle("active",a.getAttribute("href")==="#"+entry.target.id))}}),{rootMargin:"-35% 0px -55% 0px",threshold:0});
sections.forEach(s=>observer.observe(s));
render();
