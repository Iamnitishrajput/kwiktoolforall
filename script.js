const tools = [
  {name:"Document Scanner", category:"documents", icon:"▤", desc:"Scan and clean documents with your camera.", tag:"SCAN"},
  {name:"Image → Text", category:"documents", icon:"✦", desc:"Extract readable text from images and screenshots.", tag:"OCR"},
  {name:"JPG / PNG → PDF", category:"images", icon:"▧", desc:"Combine images into a clean PDF document.", tag:"CONVERT"},
  {name:"PDF → JPG / PNG", category:"pdf", icon:"▥", desc:"Turn PDF pages into image files.", tag:"CONVERT"},
  {name:"Merge PDF", category:"pdf", icon:"⊞", desc:"Combine several PDF files into one document.", tag:"PDF"},
  {name:"Split PDF", category:"pdf", icon:"✂", desc:"Separate pages or ranges from a PDF.", tag:"PDF"},
  {name:"Compress Image", category:"images", icon:"⌁", desc:"Reduce image size for email and sharing.", tag:"IMAGE"},
  {name:"Resize Image", category:"images", icon:"⤢", desc:"Change image dimensions without the usual hassle.", tag:"IMAGE"},
  {name:"JPG ↔ PNG", category:"images", icon:"⇄", desc:"Switch between common image formats.", tag:"CONVERT"},
  {name:"Share & Send", category:"sharing", icon:"↥", desc:"Share files with temporary processing and delivery.", tag:"SHARE"}
];

const grid = document.getElementById("toolsGrid");
const search = document.getElementById("toolSearch");
const chips = [...document.querySelectorAll(".chip")];
const count = document.getElementById("toolCount");
const noResults = document.getElementById("noResults");
const modal = document.getElementById("toolModal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");

let activeFilter = "all";

function renderTools(){
  const query = search.value.trim().toLowerCase();
  const filtered = tools.filter(t => {
    const matchesFilter = activeFilter === "all" || t.category === activeFilter;
    const haystack = `${t.name} ${t.desc} ${t.tag} ${t.category}`.toLowerCase();
    return matchesFilter && haystack.includes(query);
  });

  grid.innerHTML = filtered.map(t => `
    <article class="tool-card">
      <div class="tool-top">
        <div class="tool-icon">${t.icon}</div>
        <span class="tool-category">${t.tag}</span>
      </div>
      <h3>${t.name}</h3>
      <p>${t.desc}</p>
      <button class="tool-link" data-tool="${t.name}">Open tool <span>→</span></button>
    </article>
  `).join("");

  noResults.style.display = filtered.length ? "none" : "block";
  count.textContent = `${filtered.length} ${filtered.length === 1 ? "tool" : "tools"} · built for everyday work`;

  grid.querySelectorAll("[data-tool]").forEach(btn => {
    btn.addEventListener("click", () => openTool(btn.dataset.tool));
  });
}

function openTool(name){
  modalTitle.textContent = name;
  modalText.textContent = `${name} has its polished workspace reserved. The actual file-processing engine will be connected next, with browser-first processing wherever practical.`;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
}

function closeTool(){
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}

chips.forEach(chip => {
  chip.addEventListener("click", () => {
    chips.forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    activeFilter = chip.dataset.filter;
    renderTools();
  });
});

search.addEventListener("input", renderTools);

document.addEventListener("keydown", e => {
  if(e.key === "/" && document.activeElement !== search && !["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){
    e.preventDefault();
    search.focus();
  }
  if(e.key === "Escape") closeTool();
});

document.getElementById("modalClose").addEventListener("click", closeTool);
document.getElementById("modalOkay").addEventListener("click", closeTool);
modal.addEventListener("click", e => { if(e.target === modal) closeTool(); });

document.querySelectorAll(".open-tool").forEach(btn => btn.addEventListener("click", () => openTool(btn.dataset.tool)));

const mobileMenu = document.getElementById("mobileMenu");
mobileMenu.addEventListener("click", () => {
  const open = mobileMenu.getAttribute("aria-expanded") === "true";
  mobileMenu.setAttribute("aria-expanded", String(!open));
  document.querySelector(".desktop-nav").style.display = open ? "" : "flex";
  if(!open){
    document.querySelector(".desktop-nav").style.position="absolute";
    document.querySelector(".desktop-nav").style.top="70px";
    document.querySelector(".desktop-nav").style.left="0";
    document.querySelector(".desktop-nav").style.right="0";
    document.querySelector(".desktop-nav").style.margin="0";
    document.querySelector(".desktop-nav").style.padding="18px";
    document.querySelector(".desktop-nav").style.background="#fff";
    document.querySelector(".desktop-nav").style.borderBottom="1px solid #e3e8ef";
    document.querySelector(".desktop-nav").style.flexDirection="column";
    document.querySelector(".desktop-nav").style.gap="15px";
  }
});

renderTools();
