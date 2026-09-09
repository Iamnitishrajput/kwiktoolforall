const search = document.getElementById("toolSearch");
const cards = [...document.querySelectorAll(".tool-card")];
const count = document.getElementById("toolCount");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");

function openModal(name) {
  modalTitle.textContent = name;
  if (name === "Share & Send") {
    modalText.textContent = "The secure sharing module is planned next. It will use temporary processing with automatic cleanup after successful delivery.";
  } else {
    modalText.textContent = `${name} is part of the KwikToolForAll toolbox. Its working module will be connected as we build each tool.`;
  }
  modal.classList.remove("hidden");
}
function closeModal(){ modal.classList.add("hidden"); }

cards.forEach(card => card.addEventListener("click", () => openModal(card.dataset.tool)));
document.getElementById("modalClose").addEventListener("click", closeModal);
document.getElementById("modalAction").addEventListener("click", closeModal);
modal.addEventListener("click", e => { if(e.target === modal) closeModal(); });

document.getElementById("quickOpen").addEventListener("click", () => {
  document.getElementById("tools").scrollIntoView({behavior:"smooth"});
});

search.addEventListener("input", () => {
  const q = search.value.toLowerCase().trim();
  let visible = 0;
  cards.forEach(card => {
    const haystack = `${card.dataset.tool} ${card.dataset.keywords}`.toLowerCase();
    const match = !q || haystack.includes(q);
    card.style.display = match ? "" : "none";
    if(match) visible++;
  });
  count.textContent = `${visible} tool${visible === 1 ? "" : "s"}`;
});
document.addEventListener("keydown", e => {
  if(e.key === "/" && document.activeElement !== search){
    e.preventDefault(); search.focus();
  }
  if(e.key === "Escape") closeModal();
});
